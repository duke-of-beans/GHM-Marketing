import { getCurrentUser, territoryFilter } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { ACTIVE_STATUSES } from "@/types";
import { LeadsClientPage } from "./client";

export default async function LeadsPage() {
  const user = await getCurrentUser();
  const baseFilter = territoryFilter(user);

  // Fetch leads in active pipeline stages for Kanban
  const leads = await prisma.lead.findMany({
    where: {
      ...baseFilter,
      status: { in: [...ACTIVE_STATUSES] },
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
      assignedUser: { select: { id: true, name: true } },
      _count: { select: { notes: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 200, // Kanban cap for performance
  });

  // Serialize Prisma Decimals to plain numbers for client
  const serializedLeads = leads.map((lead) => ({
    ...lead,
    dealValueTotal: Number(lead.dealValueTotal),
  }));

  return (
    <LeadsClientPage
      initialLeads={serializedLeads}
      userRole={user.role}
    />
  );
}
