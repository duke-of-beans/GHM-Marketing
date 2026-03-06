// src/lib/intel/patterns/cross-client.ts
// Intelligence Engine — Sprint IE-06
// Cross-Client Insights — aggregate pattern detection across all asset groups
// for a tenant.
//
// Surfaces:
//   - "3 of your clients lost local pack position this week — possible algorithm update"
//   - "Competitor X appears in 4 of your client landscapes — consider dedicated analysis"
//   - "Content task approval rate is 78% — common rejection reasons: [list]"
//   - Fleet-wide health score drops suggesting a systemic issue
//   - Scan failure spikes indicating sensor/credential problems
//
// Returns a structured CrossClientSummary for tenant-level intelligence display.
// All DB reads only — no side effects, no task creation.

import { prisma } from "@/lib/prisma";

// ── Types ──────────────────────────────────────────────────────────────────────

export type InsightSeverity = "info" | "warning" | "critical";

export interface CrossClientInsight {
  type: string;
  severity: InsightSeverity;
  headline: string;
  detail: string;
  affectedCount: number;
  affectedGroupIds: number[];
  metadata?: Record<string, unknown>;
}

export interface ContentApprovalStats {
  totalTasks: number;
  approvedCount: number;
  rejectedCount: number;
  approvalRate: number;
  commonRejectionReasons: string[];
}

export interface CrossClientSummary {
  tenantId: number;
  generatedAt: Date;
  insights: CrossClientInsight[];
  contentApproval: ContentApprovalStats | null;
  /** Number of asset groups with data in the analysis window */
  groupsAnalyzed: number;
  windowDays: number;
}

// ── Constants ──────────────────────────────────────────────────────────────────

/** Analysis window in days */
const WINDOW_DAYS = 7;

/** Minimum number of groups with same signal before surfacing as a cross-client insight */
const MIN_GROUPS_FOR_PATTERN = 2;

/** Local pack loss threshold: health score drop indicating local visibility loss */
const LOCAL_PACK_DROP_THRESHOLD = 10;

// ── Helpers ────────────────────────────────────────────────────────────────────

function since(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

// ── Analysis functions ─────────────────────────────────────────────────────────

/**
 * Detect groups that lost local pack position (health score drop + local_seo metrics)
 * in the analysis window.
 */
async function detectLocalPackLosses(
  tenantId: number,
  assetGroups: Array<{ id: number; name: string }>
): Promise<CrossClientInsight | null> {
  const windowStart = since(WINDOW_DAYS);
  const affectedGroupIds: number[] = [];
  const affectedGroupNames: string[] = [];

  for (const group of assetGroups) {
    // Look for snapshots with declining localPackPosition in the window
    const recentSnapshots = await prisma.intelSnapshot.findMany({
      where: {
        entityType: "asset",
        createdAt: { gte: windowStart },
        scan: { tenantId, assetGroupId: group.id },
      },
      select: { metrics: true, deltas: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    let groupHasLoss = false;
    for (const snap of recentSnapshots) {
      const metrics = snap.metrics as Record<string, unknown>;
      const deltas = snap.deltas as Record<string, unknown> | null;

      // Check for explicit local pack position drop
      const localPackPos = metrics["localPackPosition"] as number | null;
      const packDelta = deltas?.["localPackPosition"] as
        | { absoluteChange?: number }
        | null;

      if (
        localPackPos !== null &&
        localPackPos !== undefined &&
        packDelta?.absoluteChange !== undefined &&
        packDelta.absoluteChange > 3 // position number went up = rank dropped
      ) {
        groupHasLoss = true;
        break;
      }

      // Fallback: health score dropped significantly
      const healthScore = metrics["healthScore"] as number | null;
      const hsDelta = deltas?.["healthScore"] as
        | { absoluteChange?: number }
        | null;
      if (
        healthScore !== null &&
        hsDelta?.absoluteChange !== undefined &&
        hsDelta.absoluteChange <= -LOCAL_PACK_DROP_THRESHOLD
      ) {
        groupHasLoss = true;
        break;
      }
    }

    if (groupHasLoss) {
      affectedGroupIds.push(group.id);
      affectedGroupNames.push(group.name);
    }
  }

  if (affectedGroupIds.length < MIN_GROUPS_FOR_PATTERN) return null;

  const severity: InsightSeverity =
    affectedGroupIds.length >= 5 ? "critical" : "warning";

  return {
    type: "local_pack_loss_cluster",
    severity,
    headline: `${affectedGroupIds.length} client${affectedGroupIds.length === 1 ? "" : "s"} lost local pack visibility this week`,
    detail:
      `${affectedGroupNames.slice(0, 3).join(", ")}${affectedGroupNames.length > 3 ? ` and ${affectedGroupNames.length - 3} more` : ""} ` +
      `all show local visibility drops in the last ${WINDOW_DAYS} days. ` +
      `When multiple clients show simultaneous losses, a Google algorithm update or ` +
      `local index refresh is the likely cause. Monitor for 48–72 hours before escalating.`,
    affectedCount: affectedGroupIds.length,
    affectedGroupIds,
    metadata: { affectedGroupNames },
  };
}

/**
 * Find competitors that appear across multiple client landscapes.
 * A competitor appearing in 3+ client landscapes is worth dedicated tracking.
 */
async function detectRecurringCompetitors(
  tenantId: number,
  assetGroups: Array<{ id: number; name: string }>
): Promise<CrossClientInsight[]> {
  const insights: CrossClientInsight[] = [];

  // Load all competitors across all groups for this tenant
  const competitors = await prisma.intelCompetitor.findMany({
    where: { tenantId, isActive: true },
    select: { domain: true, name: true, assetGroupId: true },
  });

  // Count appearances per competitor domain
  const domainCount = new Map<
    string,
    { count: number; groupIds: number[]; displayName: string }
  >();
  for (const comp of competitors) {
    if (!comp.domain) continue;
    const existing = domainCount.get(comp.domain);
    const gid = comp.assetGroupId ?? 0;
    if (existing) {
      if (!existing.groupIds.includes(gid)) {
        existing.count++;
        existing.groupIds.push(gid);
      }
    } else {
      domainCount.set(comp.domain, {
        count: 1,
        groupIds: [gid],
        displayName: comp.domain,
      });
    }
  }

  // Surface competitors appearing in 3+ client landscapes
  for (const [domain, data] of domainCount) {
    if (data.count < 3) continue;

    const affectedGroupNames = assetGroups
      .filter((g) => data.groupIds.includes(g.id))
      .map((g) => g.name);

    insights.push({
      type: "recurring_competitor",
      severity: "info",
      headline: `${domain} appears across ${data.count} client landscapes`,
      detail:
        `${domain} is actively competing against ${data.count} of your clients ` +
        `(${affectedGroupNames.slice(0, 3).join(", ")}${affectedGroupNames.length > 3 ? ` +${affectedGroupNames.length - 3} more` : ""}). ` +
        `Consider building a dedicated competitor analysis report on this domain ` +
        `to identify patterns in their strategy that affect multiple retainers.`,
      affectedCount: data.count,
      affectedGroupIds: data.groupIds,
      metadata: { competitorDomain: domain },
    });
  }

  // Return top 3 by appearance count
  return insights
    .sort((a, b) => b.affectedCount - a.affectedCount)
    .slice(0, 3);
}

/**
 * Aggregate content task approval rates and surface common rejection reasons.
 */
async function analyzeContentApproval(
  tenantId: number
): Promise<ContentApprovalStats | null> {
  // Find all asset group IDs for this tenant
  const groups = await prisma.intelAssetGroup.findMany({
    where: { tenantId },
    select: { clientProfileId: true },
  });
  const clientIds = groups
    .map((g) => g.clientProfileId)
    .filter((id): id is number => id !== null);

  if (clientIds.length === 0) return null;

  const windowStart = since(30); // 30-day window for approval rate

  const [totalTasks, approvedTasks, rejectedTasks] = await Promise.all([
    prisma.clientTask.count({
      where: {
        clientId: { in: clientIds },
        category: "content",
        createdAt: { gte: windowStart },
      },
    }),
    prisma.clientTask.count({
      where: {
        clientId: { in: clientIds },
        category: "content",
        status: "complete",
        createdAt: { gte: windowStart },
      },
    }),
    prisma.clientTask.count({
      where: {
        clientId: { in: clientIds },
        category: "content",
        status: "cancelled",
        createdAt: { gte: windowStart },
      },
    }),
  ]);

  if (totalTasks < 5) return null; // Not enough data for meaningful stats

  const approvalRate =
    totalTasks > 0 ? Math.round((approvedTasks / totalTasks) * 100) : 0;

  // Extract common rejection reasons from cancelled task descriptions
  const cancelledTasks = await prisma.clientTask.findMany({
    where: {
      clientId: { in: clientIds },
      category: "content",
      status: "cancelled",
      createdAt: { gte: windowStart },
    },
    select: { description: true },
    take: 50,
  });

  // Simple keyword extraction for rejection reasons
  const rejectionKeywords: Record<string, number> = {};
  const reasonPhrases = [
    "already covered",
    "not relevant",
    "wrong tone",
    "budget",
    "timing",
    "duplicate",
    "low priority",
    "scope",
  ];
  for (const task of cancelledTasks) {
    if (!task.description) continue;
    const lower = task.description.toLowerCase();
    for (const phrase of reasonPhrases) {
      if (lower.includes(phrase)) {
        rejectionKeywords[phrase] = (rejectionKeywords[phrase] ?? 0) + 1;
      }
    }
  }

  const commonRejectionReasons = Object.entries(rejectionKeywords)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([phrase]) => phrase);

  return {
    totalTasks,
    approvedCount: approvedTasks,
    rejectedCount: rejectedTasks,
    approvalRate,
    commonRejectionReasons,
  };
}

/**
 * Detect scan failure spikes that indicate credential or sensor problems.
 */
async function detectScanFailureSpike(
  tenantId: number
): Promise<CrossClientInsight | null> {
  const windowStart = since(WINDOW_DAYS);

  const recentScans = await prisma.intelScan.findMany({
    where: {
      tenantId,
      createdAt: { gte: windowStart },
    },
    select: { status: true, sensorsFailed: true, assetGroupId: true },
  });

  if (recentScans.length < 3) return null;

  const failed = recentScans.filter(
    (s) => s.status === "failed" || s.status === "partial"
  );
  const failureRate = failed.length / recentScans.length;

  if (failureRate < 0.4) return null; // Less than 40% failure rate — not a spike

  // Find the most common failing sensors
  const sensorFailCounts: Record<string, number> = {};
  for (const scan of failed) {
    const failures = scan.sensorsFailed as Record<string, string> | null;
    if (!failures) continue;
    for (const sensor of Object.keys(failures)) {
      sensorFailCounts[sensor] = (sensorFailCounts[sensor] ?? 0) + 1;
    }
  }

  const topFailingSensor = Object.entries(sensorFailCounts).sort(
    ([, a], [, b]) => b - a
  )[0];

  const affectedGroupIds = [
    ...new Set(
      failed
        .map((s) => s.assetGroupId)
        .filter((id): id is number => id !== null)
    ),
  ];

  return {
    type: "scan_failure_spike",
    severity: failureRate >= 0.7 ? "critical" : "warning",
    headline: `${Math.round(failureRate * 100)}% of recent scans failed or completed with errors`,
    detail:
      `${failed.length} of ${recentScans.length} scans in the last ${WINDOW_DAYS} days ` +
      `failed or returned partial results. ` +
      (topFailingSensor
        ? `Most common failing sensor: "${topFailingSensor[0]}" (${topFailingSensor[1]} failures). Check credentials and rate limits.`
        : "Check sensor credentials and API rate limits."),
    affectedCount: failed.length,
    affectedGroupIds,
    metadata: { failureRate, sensorFailCounts },
  };
}

// ── Main entry point ───────────────────────────────────────────────────────────

/**
 * Generate a cross-client intelligence summary for a tenant.
 *
 * Aggregates patterns across all asset groups and surfaces tenant-wide signals
 * that would not be visible looking at individual clients in isolation.
 * Read-only — does not create tasks or modify data.
 */
export async function generateCrossClientInsights(
  tenantId: number
): Promise<CrossClientSummary> {
  const generatedAt = new Date();

  const assetGroups = await prisma.intelAssetGroup.findMany({
    where: { tenantId, status: { not: "churned" } },
    select: { id: true, name: true },
  });

  const insights: CrossClientInsight[] = [];

  // Run all analysis functions in parallel
  const [
    localPackInsight,
    recurringCompetitorInsights,
    contentApproval,
    scanFailureInsight,
  ] = await Promise.all([
    detectLocalPackLosses(tenantId, assetGroups),
    detectRecurringCompetitors(tenantId, assetGroups),
    analyzeContentApproval(tenantId),
    detectScanFailureSpike(tenantId),
  ]);

  if (localPackInsight) insights.push(localPackInsight);
  insights.push(...recurringCompetitorInsights);
  if (scanFailureInsight) insights.push(scanFailureInsight);

  // Add content approval insight if rate is below 70%
  if (contentApproval && contentApproval.totalTasks >= 5) {
    if (contentApproval.approvalRate < 70) {
      const reasons =
        contentApproval.commonRejectionReasons.length > 0
          ? ` Common rejection themes: ${contentApproval.commonRejectionReasons.join(", ")}.`
          : "";
      insights.push({
        type: "low_content_approval_rate",
        severity: contentApproval.approvalRate < 50 ? "warning" : "info",
        headline: `Content task approval rate is ${contentApproval.approvalRate}%`,
        detail:
          `${contentApproval.approvedCount} of ${contentApproval.totalTasks} content tasks ` +
          `were approved in the last 30 days (${contentApproval.approvalRate}%).${reasons} ` +
          `Review task quality and relevance settings for the intelligence engine.`,
        affectedCount: contentApproval.totalTasks - contentApproval.approvedCount,
        affectedGroupIds: [],
        metadata: {
          approvalRate: contentApproval.approvalRate,
          commonRejectionReasons: contentApproval.commonRejectionReasons,
        },
      });
    }
  }

  // Sort: critical first, then warning, then info
  const severityOrder: Record<InsightSeverity, number> = {
    critical: 0,
    warning: 1,
    info: 2,
  };
  insights.sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  );

  return {
    tenantId,
    generatedAt,
    insights,
    contentApproval,
    groupsAnalyzed: assetGroups.length,
    windowDays: WINDOW_DAYS,
  };
}
