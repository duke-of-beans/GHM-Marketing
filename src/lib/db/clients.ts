import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

// ============================================================================
// CLIENT PROFILE OPERATIONS
// ============================================================================

/**
 * Get all active clients with health scores for portfolio view.
 */
export async function getClients(filters?: {
  status?: string;
  healthMin?: number;
  healthMax?: number;
}) {
  const where: Prisma.ClientProfileWhereInput = {};

  if (filters?.status) where.status = filters.status;
  if (filters?.healthMin !== undefined || filters?.healthMax !== undefined) {
    where.healthScore = {};
    if (filters?.healthMin !== undefined) where.healthScore.gte = filters.healthMin;
    if (filters?.healthMax !== undefined) where.healthScore.lte = filters.healthMax;
  }

  return prisma.clientProfile.findMany({
    where,
    include: {
      lead: {
        select: {
          businessName: true,
          phone: true,
          city: true,
          state: true,
          website: true,
        },
      },
      tasks: {
        where: { status: { notIn: ["deployed", "measured", "dismissed"] } },
        select: { id: true },
      },
      competitors: {
        where: { isActive: true },
        select: { id: true },
      },
      domains: {
        select: { id: true, domain: true, type: true },
      },
    },
    orderBy: { healthScore: "asc" }, // Worst health first — needs attention
  });
}

/**
 * Get a single client profile with all related data for the detail view.
 */
export async function getClient(id: number) {
  return prisma.clientProfile.findUnique({
    where: { id },
    include: {
      lead: {
        select: {
          id: true,
          businessName: true,
          phone: true,
          email: true,
          city: true,
          state: true,
          zipCode: true,
          website: true,
          domainRating: true,
          reviewCount: true,
          reviewAvg: true,
          competitiveIntel: true,
        },
      },
      competitors: {
        where: { isActive: true },
        orderBy: { addedAt: "asc" },
      },
      domains: {
        orderBy: { createdAt: "asc" },
      },
      tasks: {
        orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
        include: {
          notes: {
            orderBy: { createdAt: "desc" },
            take: 5,
          },
        },
      },
      notes: {
        where: { taskId: null }, // Client-level notes only
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
        include: {
          author: { select: { id: true, name: true } },
        },
      },
      scans: {
        orderBy: { scanDate: "desc" },
        take: 10,
      },
      reports: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      // NOTE: upsellOpportunities table doesn't exist in production yet
      // Commented out until migration is run
      // upsellOpportunities: {
      //   where: { status: { in: ["detected", "presented"] } },
      //   orderBy: { opportunityScore: "desc" },
      //   take: 10,
      //   include: {
      //     product: {
      //       select: {
      //         id: true,
      //         name: true,
      //         category: true,
      //         price: true,
      //         pricingModel: true,
      //       },
      //     },
      //   },
      // },
    },
  });
}

/**
 * Create a client profile when a lead is won.
 * Copies baseline data from the lead's competitive intel.
 */
export async function createClientFromWonLead(leadId: number) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      competitiveIntel: true,
      clientProfile: true,
    },
  });

  if (!lead) throw new Error(`Lead ${leadId} not found`);
  if (lead.clientProfile) {
    // Reactivate if previously cancelled
    if (lead.clientProfile.status !== "active") {
      return prisma.clientProfile.update({
        where: { id: lead.clientProfile.id },
        data: { status: "active" },
      });
    }
    return lead.clientProfile;
  }

  // Extract competitors from existing intel
  const competitors =
    lead.competitiveIntel?.competitors as Array<{
      name: string;
      url?: string;
      googlePlaceId?: string;
    }> | null;

  // Calculate initial health score from existing metrics
  const healthScore = calculateInitialHealth(lead);

  // Set next scan date (2 weeks from now for biweekly default)
  const nextScanAt = new Date();
  nextScanAt.setDate(nextScanAt.getDate() + 14);

  return prisma.clientProfile.create({
    data: {
      leadId: lead.id,
      businessName: lead.businessName,
      healthScore,
      nextScanAt,
      competitors: competitors
        ? {
            createMany: {
              data: competitors.slice(0, 5).map((c) => ({
                businessName: c.name,
                domain: c.url || null,
                googlePlaceId: c.googlePlaceId || null,
              })),
            },
          }
        : undefined,
    },
    include: {
      competitors: true,
    },
  });
}

/**
 * Calculate initial health score from lead data.
 * Simple heuristic — real scoring improves with scan data over time.
 */
function calculateInitialHealth(lead: {
  domainRating: number | null;
  reviewCount: number | null;
  currentRank: number | null;
}): number {
  let score = 50; // Start at baseline

  // Domain rating: higher is better (max contribution: +20)
  if (lead.domainRating) {
    score += Math.min(20, Math.round(lead.domainRating / 3));
  }

  // Review count: more is better (max contribution: +15)
  if (lead.reviewCount) {
    score += Math.min(15, Math.round(lead.reviewCount / 10));
  }

  // Local pack rank: lower is better (max contribution: +15)
  if (lead.currentRank) {
    if (lead.currentRank <= 3) score += 15;
    else if (lead.currentRank <= 5) score += 10;
    else if (lead.currentRank <= 10) score += 5;
  }

  return Math.min(100, Math.max(0, score));
}

// ============================================================================
// TASK OPERATIONS
// ============================================================================

export async function getClientTasks(
  clientId: number,
  filters?: {
    status?: string;
    category?: string;
    priority?: string;
  }
) {
  const where: Prisma.ClientTaskWhereInput = { clientId };
  if (filters?.status) where.status = filters.status;
  if (filters?.category) where.category = filters.category;
  if (filters?.priority) where.priority = filters.priority;

  return prisma.clientTask.findMany({
    where,
    include: {
      notes: {
        orderBy: { createdAt: "desc" },
        take: 3,
        include: {
          author: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
  });
}

export async function createTask(
  clientId: number,
  data: {
    title: string;
    description?: string;
    category: string;
    priority?: string;
    source?: string;
    assignedTo?: string;
    targetKeywords?: string[];
    competitorRef?: string;
    dueDate?: Date;
    scanId?: number;
  }
) {
  return prisma.clientTask.create({
    data: {
      clientId,
      title: data.title,
      description: data.description,
      category: data.category,
      priority: data.priority || "P3",
      source: data.source || "manual",
      assignedTo: data.assignedTo,
      targetKeywords: data.targetKeywords || undefined,
      competitorRef: data.competitorRef,
      dueDate: data.dueDate,
      scanId: data.scanId,
    },
  });
}

export async function updateTaskStatus(
  taskId: number,
  status: string,
  extras?: {
    approvedContent?: string;
    deployedUrl?: string;
    outcomeMetrics?: Prisma.InputJsonValue;
  }
) {
  const data: Prisma.ClientTaskUpdateInput = { status };

  if (status === "approved" && extras?.approvedContent) {
    data.approvedContent = extras.approvedContent;
  }
  if (status === "deployed") {
    data.deployedAt = new Date();
    if (extras?.deployedUrl) data.deployedUrl = extras.deployedUrl;
  }
  if (status === "measured" && extras?.outcomeMetrics) {
    data.measuredAt = new Date();
    data.outcomeMetrics = extras.outcomeMetrics;
  }

  return prisma.clientTask.update({
    where: { id: taskId },
    data,
  });
}

// ============================================================================
// NOTE OPERATIONS
// ============================================================================

export async function addClientNote(data: {
  clientId: number;
  authorId: number;
  content: string;
  type: string;
  taskId?: number;
  isPinned?: boolean;
  tags?: string[];
}) {
  return prisma.clientNote.create({
    data: {
      clientId: data.clientId,
      authorId: data.authorId,
      content: data.content,
      type: data.type,
      taskId: data.taskId || null,
      isPinned: data.isPinned || false,
      tags: data.tags || undefined,
    },
    include: {
      author: { select: { id: true, name: true } },
    },
  });
}

// ============================================================================
// DOMAIN OPERATIONS
// ============================================================================

export async function addClientDomain(data: {
  clientId: number;
  domain: string;
  type: string;
  hosting: string;
  ownershipType?: string;
  wpUrl?: string;
  wpUsername?: string;
  wpAppPassword?: string;
  vercelProjectId?: string;
  githubRepo?: string;
  templateUsed?: string;
}) {
  return prisma.clientDomain.create({
    data: {
      clientId: data.clientId,
      domain: data.domain,
      type: data.type,
      hosting: data.hosting,
      ownershipType: data.ownershipType || "ghm",
      wpUrl: data.wpUrl,
      wpUsername: data.wpUsername,
      wpAppPassword: data.wpAppPassword,
      vercelProjectId: data.vercelProjectId,
      githubRepo: data.githubRepo,
      templateUsed: data.templateUsed,
    },
  });
}

// ============================================================================
// SCAN OPERATIONS
// ============================================================================

export async function getClientScans(clientId: number, limit = 10) {
  return prisma.competitiveScan.findMany({
    where: { clientId },
    orderBy: { scanDate: "desc" },
    take: limit,
  });
}

export async function saveScanResults(data: {
  clientId: number;
  clientData: Prisma.InputJsonValue;
  competitors: Prisma.InputJsonValue;
  deltas: Prisma.InputJsonValue;
  alerts: Prisma.InputJsonValue;
  healthScore: number;
  apiCosts?: Prisma.InputJsonValue;
}) {
  // Save scan
  const scan = await prisma.competitiveScan.create({
    data: {
      clientId: data.clientId,
      clientData: data.clientData,
      competitors: data.competitors,
      deltas: data.deltas,
      alerts: data.alerts,
      healthScore: data.healthScore,
      apiCosts: data.apiCosts || undefined,
    },
  });

  // Update client health score and scan timestamps
  const nextScanAt = new Date();
  const client = await prisma.clientProfile.findUnique({
    where: { id: data.clientId },
    select: { scanFrequency: true },
  });

  const daysUntilNext =
    client?.scanFrequency === "weekly" ? 7 : client?.scanFrequency === "monthly" ? 30 : 14;
  nextScanAt.setDate(nextScanAt.getDate() + daysUntilNext);

  await prisma.clientProfile.update({
    where: { id: data.clientId },
    data: {
      healthScore: data.healthScore,
      lastScanAt: new Date(),
      nextScanAt,
    },
  });

  return scan;
}

// ============================================================================
// PORTFOLIO STATS
// ============================================================================

export async function getPortfolioStats() {
  const clients = await prisma.clientProfile.findMany({
    where: { status: "active" },
    select: {
      healthScore: true,
      retainerAmount: true,
    },
  });

  const total = clients.length;
  const avgHealth =
    total > 0 ? Math.round(clients.reduce((sum, c) => sum + c.healthScore, 0) / total) : 0;
  const needsAttention = clients.filter((c) => c.healthScore < 50).length;
  const totalRevenue = clients.reduce(
    (sum, c) => sum + Number(c.retainerAmount),
    0
  );

  return { total, avgHealth, needsAttention, totalRevenue };
}

/**
 * Get tasks in "in-review" status across all clients.
 * Powers the content review queue page.
 */
export async function getContentReviewQueue() {
  return prisma.clientTask.findMany({
    where: { status: "in-review" },
    include: {
      client: {
        select: { id: true, businessName: true },
      },
    },
    orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
  });
}
