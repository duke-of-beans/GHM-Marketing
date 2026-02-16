import { prisma } from "@/lib/db";
import { Prisma, LeadStatus } from "@prisma/client";
import type { SessionUser } from "@/lib/auth/session";
import { territoryFilter } from "@/lib/auth/session";
import type { LeadFilterInput } from "@/lib/validations";
import { createClientFromWonLead } from "@/lib/db/clients";

// ============================================================================
// Lead Queries (Territory-Scoped)
// ============================================================================

const leadInclude = {
  territory: { select: { id: true, name: true } },
  assignedUser: { select: { id: true, name: true } },
  leadSource: { select: { id: true, name: true } },
  _count: { select: { notes: true, workOrders: true } },
} satisfies Prisma.LeadInclude;

export async function getLeads(user: SessionUser, filters: LeadFilterInput) {
  const baseFilter = territoryFilter(user);

  const where: Prisma.LeadWhereInput = {
    ...baseFilter,
    ...(filters.status && { status: filters.status }),
    ...(filters.territoryId && { territoryId: filters.territoryId }),
    ...(filters.assignedTo && { assignedTo: filters.assignedTo }),
    ...(filters.search && {
      OR: [
        { businessName: { contains: filters.search, mode: "insensitive" } },
        { phone: { contains: filters.search } },
        { email: { contains: filters.search, mode: "insensitive" } },
        { city: { contains: filters.search, mode: "insensitive" } },
      ],
    }),
  };

  const [items, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      include: leadInclude,
      orderBy: { [filters.sortBy]: filters.sortOrder },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
    prisma.lead.count({ where }),
  ]);

  return {
    items,
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: Math.ceil(total / filters.pageSize),
  };
}

export async function getLeadById(user: SessionUser, id: number) {
  const baseFilter = territoryFilter(user);

  return prisma.lead.findFirst({
    where: { id, ...baseFilter },
    include: {
      ...leadInclude,
      notes: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      competitiveIntel: true,
      dealProducts: {
        include: { product: true },
      },
      leadHistory: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { changedAt: "desc" },
        take: 20,
      },
    },
  });
}

export async function updateLeadStatus(
  user: SessionUser,
  leadId: number,
  newStatus: LeadStatus
) {
  const baseFilter = territoryFilter(user);

  // Verify lead exists and user has access
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, ...baseFilter },
  });

  if (!lead) return null;

  // Update status (trigger handles history logging)
  const updated = await prisma.lead.update({
    where: { id: leadId },
    data: {
      status: newStatus,
      // Auto-assign rep when pulled from available
      ...(lead.status === "available" &&
        newStatus !== "available" && {
          assignedTo: Number(user.id),
        }),
    },
    include: leadInclude,
  });

  // Back Cycle trigger: auto-create client profile when lead is won
  if (newStatus === "won") {
    try {
      await createClientFromWonLead(leadId);
    } catch (err) {
      // Log but don't fail the status update — client can be created manually
      console.error(`[BackCycle] Failed to auto-create client for lead ${leadId}:`, err);
    }
  }

  return updated;
}

// ============================================================================
// Funnel Stats (for dashboard cards and Kanban columns)
// ============================================================================

export async function getFunnelStats(user: SessionUser) {
  const baseFilter = territoryFilter(user);

  const stats = await prisma.lead.groupBy({
    by: ["status"],
    where: baseFilter,
    _count: { id: true },
    _sum: { dealValueTotal: true, mrr: true },
  });

  return stats.map((s) => ({
    status: s.status,
    count: s._count.id,
    totalValue: Number(s._sum.dealValueTotal ?? 0),
    totalMRR: Number(s._sum.mrr ?? 0),
  }));
}

export async function getDashboardMetrics(user: SessionUser) {
  const baseFilter = territoryFilter(user);
  const activeStatuses: LeadStatus[] = [
    "available",
    "scheduled",
    "contacted",
    "follow_up",
    "paperwork",
  ];

  const [totalLeads, activeLeads, wonLeads, revenueAgg] = await Promise.all([
    prisma.lead.count({ where: baseFilter }),
    prisma.lead.count({
      where: { ...baseFilter, status: { in: activeStatuses } },
    }),
    prisma.lead.count({ where: { ...baseFilter, status: "won" } }),
    prisma.lead.aggregate({
      where: { ...baseFilter, status: "won" },
      _sum: {
        dealValueTotal: true,
        mrr: true,
        arr: true,
        ltvEstimated: true,
      },
      _avg: { dealValueTotal: true },
    }),
  ]);

  return {
    totalLeads,
    activeLeads,
    wonDeals: wonLeads,
    totalMRR: Number(revenueAgg._sum.mrr ?? 0),
    totalARR: Number(revenueAgg._sum.arr ?? 0),
    totalLTV: Number(revenueAgg._sum.ltvEstimated ?? 0),
    avgDealSize: Number(revenueAgg._avg.dealValueTotal ?? 0),
    conversionRate:
      totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0,
  };
}

// ============================================================================
// Bulk Operations
// ============================================================================

export type BulkLeadInput = {
  businessName: string;
  phone: string;
  city: string;
  state: string;
  zipCode: string;
  website?: string;
  email?: string;
  address?: string;
  leadSourceId?: number;
  // Scoring fields
  priorityTier?: string;
  impactScore?: number;
  closeScore?: number;
  marketType?: string;
  suppressionSignal?: string;
  pitchAngle?: string;
  reviewCount?: number;
  reviewAvg?: number;
  wealthScore?: string;
  distanceFromMetro?: number;
};

export async function bulkCreateLeads(leads: BulkLeadInput[]) {
  // Use createMany for performance, but note: triggers won't fire.
  // Territory assignment handled in application code for bulk imports.
  const territories = await prisma.territory.findMany({
    where: { isActive: true },
  });

  // Build territory lookup maps
  const cityMap = new Map<string, number>();
  const zipMap = new Map<string, number>();
  const stateMap = new Map<string, number>();
  let nationalTerritoryId: number | null = null;

  for (const t of territories) {
    // National territory: states = ["ALL"]
    if (t.states.includes("ALL")) {
      nationalTerritoryId = t.id;
    }
    // State-level territories (states set, no cities/zips)
    if (t.cities.length === 0 && t.zipCodes.length === 0 && !t.states.includes("ALL")) {
      for (const state of t.states) {
        stateMap.set(state.toUpperCase(), t.id);
      }
    }
    // City-level
    for (const city of t.cities) {
      cityMap.set(city.toLowerCase(), t.id);
    }
    // Zip-level
    for (const zip of t.zipCodes) {
      zipMap.set(zip, t.id);
    }
  }

  // Assign territories: zip > city > state > national (most specific wins)
  const leadsWithTerritory = leads.map((lead) => {
    const territoryId =
      zipMap.get(lead.zipCode) ??
      cityMap.get(lead.city.toLowerCase()) ??
      stateMap.get(lead.state.toUpperCase()) ??
      nationalTerritoryId;

    return {
      businessName: lead.businessName,
      phone: lead.phone,
      city: lead.city,
      state: lead.state,
      zipCode: lead.zipCode,
      website: lead.website || null,
      email: lead.email || null,
      address: lead.address || null,
      leadSourceId: lead.leadSourceId || null,
      territoryId,
      status: "available" as LeadStatus,
      // Scoring fields
      priorityTier: lead.priorityTier || null,
      impactScore: lead.impactScore ?? null,
      closeScore: lead.closeScore ?? null,
      marketType: lead.marketType || null,
      suppressionSignal: lead.suppressionSignal || null,
      pitchAngle: lead.pitchAngle || null,
      reviewCount: lead.reviewCount ?? null,
      reviewAvg: lead.reviewAvg != null ? new Prisma.Decimal(lead.reviewAvg) : null,
      wealthScore: lead.wealthScore || null,
      distanceFromMetro: lead.distanceFromMetro != null ? new Prisma.Decimal(lead.distanceFromMetro) : null,
    };
  });

  // Check for duplicates by phone
  const phones = leadsWithTerritory.map((l) => l.phone);
  const existingPhones = await prisma.lead.findMany({
    where: { phone: { in: phones } },
    select: { phone: true },
  });
  const existingPhoneSet = new Set(existingPhones.map((l) => l.phone));

  const newLeads = leadsWithTerritory.filter(
    (l) => !existingPhoneSet.has(l.phone)
  );
  const duplicateCount = leadsWithTerritory.length - newLeads.length;

  // Batch insert
  const result = await prisma.lead.createMany({
    data: newLeads,
    skipDuplicates: true,
  });

  return {
    total: leads.length,
    imported: result.count,
    duplicates: duplicateCount,
    failed: leads.length - result.count - duplicateCount,
  };
}
