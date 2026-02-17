import { requireMaster } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";

export default async function AnalyticsPage() {
  await requireMaster();

  // Fetch analytics data
  const [leads, clients, tasks, scans, opportunities] = await Promise.all([
    prisma.lead.findMany({
      select: {
        id: true,
        status: true,
        createdAt: true,
        leadSource: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.clientProfile.findMany({
      select: {
        id: true,
        retainerAmount: true,
        healthScore: true,
        status: true,
        onboardedAt: true,
        lead: {
          select: {
            createdAt: true,
            status: true,
          },
        },
      },
    }),
    prisma.clientTask.findMany({
      select: {
        id: true,
        status: true,
        createdAt: true,
        deployedAt: true,
        measuredAt: true,
      },
    }),
    prisma.competitiveScan.findMany({
      select: {
        id: true,
        scanDate: true,
        healthScore: true,
        clientId: true,
      },
      orderBy: { scanDate: "desc" },
      take: 1000,
    }),
    prisma.upsellOpportunity.findMany({
      select: {
        id: true,
        status: true,
        opportunityScore: true,
        projectedMrr: true,
        detectedAt: true,
        presentedAt: true,
      },
    }),
  ]);

  // Serialize data with proper Decimal handling
  const serialized = {
    leads: JSON.parse(JSON.stringify(leads)),
    clients: JSON.parse(JSON.stringify(clients)),
    tasks: JSON.parse(JSON.stringify(tasks)),
    scans: JSON.parse(JSON.stringify(scans)),
    opportunities: opportunities.map(opp => ({
      ...opp,
      projectedMrr: opp.projectedMrr ? Number(opp.projectedMrr) : null,
    })),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Revenue forecasting, conversion tracking, and performance metrics
        </p>
      </div>

      <AnalyticsDashboard data={serialized} />
    </div>
  );
}
