import { getCurrentUser, territoryFilter } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { ACTIVE_STATUSES } from "@/types";
import { LeadsClientPage } from "./client";

export default async function LeadsPage() {
  const user = await getCurrentUser();
  const baseFilter = territoryFilter(user);

  // Fetch leads in active pipeline stages + recently won for Kanban
  const [leads, totalLeadCount] = await Promise.all([
    prisma.lead.findMany({
      where: {
        ...baseFilter,
        status: { in: [...ACTIVE_STATUSES, "won"] },
      },
      select: {
        id: true,
        businessName: true,
        phone: true,
        city: true,
        state: true,
        status: true,
        domainRating: true,
        reviewCount: true,
        dealValueTotal: true,
        updatedAt: true,
        assignedUser: { select: { id: true, name: true } },
        _count: { select: { notes: true } },
        // Lead gen engine fields (actual database field names)
        impactScore: true,
        closeScore: true, // Note: database has "closeScore" not "closeLikelihood"
        priorityTier: true,
        reviewAvg: true, // Note: database has "reviewAvg" not "rating"
        marketType: true,
        suppressionSignal: true,
        wealthScore: true,
        distanceFromMetro: true,
        website: true,
        email: true, // Note: database has "email" not "publicEmail"
        // Note: database does NOT have municipalMismatch, isChain, isFranchise, isCorporate fields
      },
      orderBy: { updatedAt: "desc" },
      take: 500, // Kanban cap for performance
    }),
    prisma.lead.count({
      where: {
        ...baseFilter,
        status: { in: [...ACTIVE_STATUSES, "won"] },
      },
    }),
  ]);

  // Serialize Prisma Decimals to plain numbers + map database fields to client type
  const serializedLeads = leads.map((lead) => ({
    id: lead.id,
    businessName: lead.businessName,
    phone: lead.phone,
    city: lead.city,
    state: lead.state,
    status: lead.status,
    domainRating: lead.domainRating,
    reviewCount: lead.reviewCount,
    dealValueTotal: Number(lead.dealValueTotal),
    updatedAt: lead.updatedAt.toISOString(),
    assignedUser: lead.assignedUser,
    _count: lead._count,
    // Map database fields to client type names
    impactScore: lead.impactScore,
    closeLikelihood: lead.closeScore, // DB: closeScore → Client: closeLikelihood
    priorityTier: lead.priorityTier,
    rating: lead.reviewAvg ? Number(lead.reviewAvg) : null, // DB: reviewAvg → Client: rating
    marketType: lead.marketType,
    suppressionSignal: lead.suppressionSignal,
    wealthScore: lead.wealthScore ? Number(lead.wealthScore) : null,
    distanceFromMetro: lead.distanceFromMetro ? Number(lead.distanceFromMetro) : null,
    website: lead.website,
    publicEmail: lead.email, // DB: email → Client: publicEmail
    // Fields not yet in database schema
    municipalMismatch: null,
    isChain: null,
    isFranchise: null,
    isCorporate: null,
  }));

  return (
    <LeadsClientPage
      initialLeads={serializedLeads}
      totalLeadCount={totalLeadCount}
      userRole={user.role}
    />
  );
}
