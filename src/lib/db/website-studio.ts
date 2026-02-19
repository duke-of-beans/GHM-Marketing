import { prisma } from "@/lib/db";
import type {
  WebProperty,
  WebPropertySummary,
  WebPropertyMatrix,
  DnaCapture,
  BuildJob,
  BuildJobWithPages,
  ComposerPage,
  NewPropertyConfig,
  ScrvnrAdapterResult,
  DnaTokenBlob,
  ScrvnrResultSummary,
} from "@/types/website-studio";

// ============================================================================
// WEB PROPERTIES
// ============================================================================

export async function getWebProperties(clientId: number) {
  return prisma.webProperty.findMany({
    where: { clientId, isArchived: false },
    include: {
      dnaCaptures: {
        where: { isSuperseded: false },
        take: 1,
      },
      buildJobs: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          pages: {
            select: {
              id: true,
              scrvnrStatus: true,
              reviewStatus: true,
            },
          },
        },
      },
    },
    orderBy: [{ brandSegment: "asc" }, { tier: "asc" }],
  });
}

/**
 * Build the matrix view: { brandSegment → { tier1, tier2, tier3 } }
 * All gaps (no property exists) are returned as null — UI renders gap cells.
 */
export async function getWebPropertyMatrix(
  clientId: number
): Promise<WebPropertyMatrix> {
  const properties = await getWebProperties(clientId);
  const matrix: WebPropertyMatrix = {};

  for (const prop of properties) {
    if (!matrix[prop.brandSegment]) {
      matrix[prop.brandSegment] = { tier1: null, tier2: null, tier3: null };
    }

    const activeBuild = prop.buildJobs[0] ?? null;
    const pages = activeBuild?.pages ?? [];
    const staleDays = prop.stalenessThresholdDays;
    const isStale =
      prop.lastDeployedAt !== null &&
      (Date.now() - new Date(prop.lastDeployedAt).getTime()) / 86400000 >
        staleDays;

    const summary: WebPropertySummary = {
      id: prop.id,
      slug: prop.slug,
      tier: prop.tier as WebPropertySummary["tier"],
      brandSegment: prop.brandSegment,
      targetUrl: prop.targetUrl,
      deployStatus: prop.deployStatus as WebPropertySummary["deployStatus"],
      lastDeployedAt: prop.lastDeployedAt,
      dnsVerified: prop.dnsVerified,
      sslActive: prop.sslActive,
      isStale,
      activeBuildJobId: activeBuild?.id ?? null,
      activeBuildStage: (activeBuild?.stage as WebPropertySummary["activeBuildStage"]) ?? null,
      pagesTotal: activeBuild?.pageCount ?? 0,
      pagesCleared: activeBuild?.pagesCleared ?? 0,
      pagesApproved: activeBuild?.pagesApproved ?? 0,
    };

    const tierKey = prop.tier as "tier1" | "tier2" | "tier3";
    matrix[prop.brandSegment][tierKey] = summary;
  }

  return matrix;
}

export async function getWebProperty(propertyId: number) {
  return prisma.webProperty.findUnique({
    where: { id: propertyId },
    include: {
      dnaCaptures: {
        where: { isSuperseded: false },
        take: 1,
        include: { overrides: { orderBy: { createdAt: "desc" } } },
      },
      buildJobs: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
}

export async function createWebProperty(config: NewPropertyConfig) {
  const slug = buildPropertySlug(config);
  return prisma.webProperty.create({
    data: {
      clientId: config.clientId,
      slug,
      tier: config.tier,
      brandSegment: config.brandSegment,
      targetUrl: config.targetUrl,
      voiceProfileSlug: config.voiceProfileSlug,
      deployStatus: "scaffolded",
    },
  });
}

export async function updateWebPropertyDeployStatus(
  propertyId: number,
  status: string,
  opts?: {
    vercelProjectId?: string;
    dnsVerified?: boolean;
    sslActive?: boolean;
    sslExpiresAt?: Date;
    lastDeployedAt?: Date;
    lastDeployError?: string;
  }
) {
  return prisma.webProperty.update({
    where: { id: propertyId },
    data: {
      deployStatus: status,
      ...opts,
      updatedAt: new Date(),
    },
  });
}

function buildPropertySlug(config: NewPropertyConfig): string {
  const brand = config.brandSegment.toLowerCase().replace(/\s+/g, "-");
  const tier = config.tier.replace("tier", "t");
  return `${brand}-${tier}`;
}

// ============================================================================
// DNA CAPTURES
// ============================================================================

export async function getActiveDnaCapture(propertyId: number) {
  return prisma.dnaCapture.findFirst({
    where: { propertyId, isSuperseded: false },
    include: { overrides: { orderBy: { createdAt: "desc" } } },
    orderBy: { capturedAt: "desc" },
  });
}

export async function createDnaCapture(
  propertyId: number,
  sourceUrl: string,
  tokenBlob: DnaTokenBlob,
  capturedBy?: string
) {
  // Supersede all previous captures
  await prisma.dnaCapture.updateMany({
    where: { propertyId },
    data: { isSuperseded: true },
  });

  return prisma.dnaCapture.create({
    data: {
      propertyId,
      sourceUrl,
      tokenBlob: tokenBlob as any,
      capturedBy: capturedBy ?? "system",
    },
  });
}

export async function addDnaTokenOverride(
  captureId: number,
  tokenKey: string,
  originalValue: unknown,
  overrideValue: unknown,
  note: string,
  operatorName: string,
  isLocked = false
) {
  const [override] = await Promise.all([
    prisma.dnaTokenOverride.create({
      data: {
        captureId,
        tokenKey,
        originalValue: JSON.stringify(originalValue),
        overrideValue: JSON.stringify(overrideValue),
        note,
        operatorName,
        isLocked,
      },
    }),
    prisma.dnaCapture.update({
      where: { id: captureId },
      data: { overrideCount: { increment: 1 } },
    }),
  ]);
  return override;
}

// ============================================================================
// BUILD JOBS
// ============================================================================

export async function getActiveBuildJob(
  propertyId: number
): Promise<BuildJobWithPages | null> {
  const job = await prisma.buildJob.findFirst({
    where: { propertyId, stage: { notIn: ["live", "error"] } },
    include: {
      pages: { orderBy: { pageOrder: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });
  return job as BuildJobWithPages | null;
}

export async function getAllBuildJobs(clientId: number) {
  return prisma.buildJob.findMany({
    where: {
      property: { clientId },
      stage: { notIn: ["live"] },
    },
    include: {
      property: {
        select: {
          id: true,
          slug: true,
          tier: true,
          brandSegment: true,
          targetUrl: true,
          voiceProfileSlug: true,
        },
      },
      pages: {
        select: {
          id: true,
          slug: true,
          title: true,
          scrvnrStatus: true,
          reviewStatus: true,
          pageOrder: true,
        },
        orderBy: { pageOrder: "asc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function createBuildJob(
  propertyId: number,
  opts?: { assignedTo?: string }
) {
  return prisma.buildJob.create({
    data: {
      propertyId,
      stage: "scaffolded",
      assignedTo: opts?.assignedTo ?? null,
    },
  });
}

export async function updateBuildJobStage(jobId: number, stage: string) {
  return prisma.buildJob.update({
    where: { id: jobId },
    data: { stage, updatedAt: new Date() },
  });
}

export async function updateBuildJobPageCounts(jobId: number) {
  const pages = await prisma.composerPage.findMany({
    where: { jobId },
    select: { scrvnrStatus: true, reviewStatus: true },
  });

  return prisma.buildJob.update({
    where: { id: jobId },
    data: {
      pageCount: pages.length,
      pagesCleared: pages.filter((p) => p.scrvnrStatus === "cleared").length,
      pagesApproved: pages.filter((p) => p.reviewStatus === "approved").length,
      updatedAt: new Date(),
    },
  });
}

// ============================================================================
// COMPOSER PAGES
// ============================================================================

export async function getComposerPages(jobId: number) {
  return prisma.composerPage.findMany({
    where: { jobId },
    orderBy: { pageOrder: "asc" },
  });
}

export async function getComposerPage(pageId: number) {
  return prisma.composerPage.findUnique({
    where: { id: pageId },
    include: {
      scrvnrResults: {
        orderBy: { evaluatedAt: "desc" },
        take: 5,
      },
    },
  });
}

export async function createComposerPages(
  jobId: number,
  pages: Array<{ slug: string; title: string; filePath: string; pageOrder: number }>
) {
  return prisma.composerPage.createMany({
    data: pages.map((p) => ({ ...p, jobId })),
  });
}

export async function updatePageSections(
  pageId: number,
  sections: Record<string, string>
) {
  return prisma.composerPage.update({
    where: { id: pageId },
    data: { sections, updatedAt: new Date() },
  });
}

export async function updatePageScrvnrStatus(
  pageId: number,
  status: string,
  resultSummary?: ScrvnrResultSummary
) {
  return prisma.composerPage.update({
    where: { id: pageId },
    data: {
      scrvnrStatus: status,
      lastScrvnrResult: resultSummary ? (resultSummary as any) : undefined,
      updatedAt: new Date(),
    },
  });
}

export async function updatePageReviewStatus(
  pageId: number,
  status: string,
  note?: string
) {
  return prisma.composerPage.update({
    where: { id: pageId },
    data: {
      reviewStatus: status,
      reviewNote: note ?? null,
      updatedAt: new Date(),
    },
  });
}

// ============================================================================
// SCRVNR GATE RESULTS
// ============================================================================

export async function recordScrvnrResult(
  pageId: number,
  propertySlug: string,
  voiceProfileSlug: string | null,
  adapterResult: ScrvnrAdapterResult
) {
  const failedSections = adapterResult.composer_feedback
    .filter((f) => !f.pass)
    .map((f) => f.section);

  const sectionsEvaluated = Object.keys(adapterResult.sections);

  const record = await prisma.scrvnrGateResult.create({
    data: {
      pageId,
      propertySlug,
      voiceProfileSlug,
      gateOpen: adapterResult.gate_open,
      gateStatus: adapterResult.gate_status,
      overrideApplied: adapterResult.override_applied,
      overrideNote: adapterResult.override_note ?? null,
      pass1Score: adapterResult.pass1_score,
      pass1Pass: adapterResult.pass1_pass,
      pass2Score: adapterResult.pass2_score ?? null,
      pass2Pass: adapterResult.pass2_pass ?? null,
      sectionsEvaluated,
      failedSections,
      rawResult: adapterResult as any,
    },
  });

  // Sync page status from gate result
  const newStatus = adapterResult.gate_open
    ? "cleared"
    : adapterResult.override_applied
    ? "cleared"
    : "failed";

  const summary: ScrvnrResultSummary = {
    pass1Score: adapterResult.pass1_score,
    pass1Pass: adapterResult.pass1_pass,
    pass2Score: adapterResult.pass2_score ?? null,
    pass2Pass: adapterResult.pass2_pass ?? null,
    overrideApplied: adapterResult.override_applied,
    failedSections,
    runAt: adapterResult.timestamp,
  };

  await updatePageScrvnrStatus(pageId, newStatus, summary);

  return record;
}

export async function getScrvnrHistory(pageId: number, limit = 10) {
  return prisma.scrvnrGateResult.findMany({
    where: { pageId },
    orderBy: { evaluatedAt: "desc" },
    take: limit,
  });
}
