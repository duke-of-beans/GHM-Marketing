/**
 * Cluster Approval Engine
 * src/lib/ops/cluster-approval.ts
 *
 * Governs the BuildJob approval workflow.
 * Called after page review status changes — auto-transitions jobs and creates deployment tasks.
 */

import { prisma } from "@/lib/db";
import type { BuildStage } from "@/types/website-studio";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApprovalResult {
  jobId: number;
  prevStage: string;
  newStage: string;
  transitioned: boolean;
  taskCreated: boolean;
  taskId: number | null;
}

// ─── Core: evaluate job after any page review change ─────────────────────────

/**
 * Called after any ComposerPage reviewStatus change.
 * Checks if all pages are approved — if so, transitions BuildJob to "approved"
 * and auto-creates a deployment ClientTask with checklist.
 */
export async function evaluateBuildJobApproval(
  jobId: number
): Promise<ApprovalResult> {
  const job = await prisma.buildJob.findUnique({
    where: { id: jobId },
    include: {
      pages:    { select: { reviewStatus: true } },
      property: { select: { clientId: true, brandSegment: true, tier: true } },
    },
  })

  if (!job) throw new Error(`BuildJob ${jobId} not found`)

  const result: ApprovalResult = {
    jobId,
    prevStage: job.stage,
    newStage:  job.stage,
    transitioned: false,
    taskCreated:  false,
    taskId: null,
  }

  // Only transition from review stage
  if (job.stage !== "review") return result

  const pages = job.pages
  if (pages.length === 0) return result

  const allApproved = pages.every(p => p.reviewStatus === "approved")
  if (!allApproved) return result

  // All pages approved — transition job
  await prisma.buildJob.update({
    where: { id: jobId },
    data:  { stage: "approved", updatedAt: new Date() },
  })

  result.newStage    = "approved"
  result.transitioned = true

  // Auto-create deployment task
  const taskResult = await createDeploymentTask(
    job.property.clientId,
    job.property.brandSegment,
    job.property.tier,
    jobId
  )

  result.taskCreated = taskResult.created
  result.taskId      = taskResult.taskId

  return result
}

// ─── Deployment task creation ─────────────────────────────────────────────────

async function createDeploymentTask(
  clientId: number,
  brandSegment: string,
  tier: string,
  jobId: number
): Promise<{ created: boolean; taskId: number | null }> {
  // Idempotency: skip if a deployment task already exists for this job
  const existing = await prisma.clientTask.findFirst({
    where: {
      clientId,
      category: "website_deployment",
      contentBrief: { path: ["buildJobId"], equals: jobId },
    },
    select: { id: true },
  })

  if (existing) return { created: false, taskId: existing.id }

  const client = await prisma.clientProfile.findUnique({
    where:  { id: clientId },
    select: { businessName: true },
  })

  const title = `Deploy ${brandSegment} ${tier.toUpperCase()} — ${client?.businessName ?? "Client"}`

  const task = await prisma.clientTask.create({
    data: {
      clientId,
      category:     "website_deployment",
      priority:     "P2",
      status:       "pending",
      title,
      description:  `BuildJob #${jobId} has all pages approved. Complete deployment checklist.`,
      contentBrief: { buildJobId: jobId, brandSegment, tier },
    },
  })

  // Apply website_deployment checklist template if it exists
  const template = await prisma.taskChecklistTemplate.findFirst({
    where: { category: "website_deployment" },
    select: { items: true },
  })

  if (template) {
    const items = template.items as Array<{ label: string; sortOrder: number }>
    await prisma.taskChecklistItem.createMany({
      data: items.map(item => ({
        taskId:    task.id,
        label:     item.label,
        sortOrder: item.sortOrder,
      })),
    })
  }

  return { created: true, taskId: task.id }
}

// ─── Bulk approval ────────────────────────────────────────────────────────────

/**
 * Approve all cleared (SCRVNR passed) pages for a job in one operation.
 * Pages that are still pending/failed are skipped.
 * Returns the list of approved page IDs and triggers job evaluation.
 */
export async function approveAllClearedPages(
  jobId: number,
  reviewerNote?: string
): Promise<{ approvedPageIds: number[]; approvalResult: ApprovalResult }> {
  const pages = await prisma.composerPage.findMany({
    where: { jobId, scrvnrStatus: { in: ["cleared"] } },
    select: { id: true, reviewStatus: true },
  })

  const toApprove = pages.filter(p => p.reviewStatus !== "approved")

  if (toApprove.length > 0) {
    await prisma.composerPage.updateMany({
      where: { id: { in: toApprove.map(p => p.id) } },
      data:  {
        reviewStatus: "approved",
        reviewNote:   reviewerNote ?? null,
        updatedAt:    new Date(),
      },
    })

    // Update BuildJob page counts
    await updateJobPageCounts(jobId)
  }

  const approvalResult = await evaluateBuildJobApproval(jobId)

  return {
    approvedPageIds: toApprove.map(p => p.id),
    approvalResult,
  }
}

// ─── Staleness check ─────────────────────────────────────────────────────────

/**
 * Check all live WebProperties for content staleness.
 * Fires alert engine if lastDeployedAt + stalenessThresholdDays < now.
 * Called from daily-scans cron.
 */
export async function checkWebPropertyStaleness(): Promise<{
  checked: number;
  stale:   number;
  errors:  number;
}> {
  const properties = await prisma.webProperty.findMany({
    where: {
      deployStatus: "live",
      isArchived:   false,
      lastDeployedAt: { not: null },
    },
    select: {
      id:                    true,
      clientId:              true,
      slug:                  true,
      brandSegment:          true,
      tier:                  true,
      lastDeployedAt:        true,
      stalenessThresholdDays: true,
    },
  })

  let stale  = 0
  let errors = 0

  const { evaluateAlertRules } = await import("./alert-engine")

  for (const prop of properties) {
    try {
      const deployedAt = new Date(prop.lastDeployedAt!).getTime()
      const daysSince  = (Date.now() - deployedAt) / 86400000

      if (daysSince > prop.stalenessThresholdDays) {
        stale++
        await evaluateAlertRules({
          sourceType: "health",
          sourceId:   prop.id,
          clientId:   prop.clientId,
          data: {
            isStale:       true,
            daysSinceDeploy: Math.floor(daysSince),
            threshold:     prop.stalenessThresholdDays,
            propertySlug:  prop.slug,
            brandSegment:  prop.brandSegment,
            tier:          prop.tier,
          },
        })
      }
    } catch {
      errors++
    }
  }

  return { checked: properties.length, stale, errors }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function updateJobPageCounts(jobId: number) {
  const pages = await prisma.composerPage.findMany({
    where:  { jobId },
    select: { scrvnrStatus: true, reviewStatus: true },
  })
  await prisma.buildJob.update({
    where: { id: jobId },
    data: {
      pageCount:     pages.length,
      pagesCleared:  pages.filter(p => p.scrvnrStatus === "cleared").length,
      pagesApproved: pages.filter(p => p.reviewStatus === "approved").length,
      updatedAt:     new Date(),
    },
  })
}
