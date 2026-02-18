import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";

export default async function AnalyticsPage() {
  await requirePermission("view_analytics");

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

  // Sample data for advanced charts (in production, calculate from real data)
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Business Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Revenue performance, pipeline health, and growth forecasting at a glance
        </p>
      </div>

      <AnalyticsDashboard data={serialized} />

      {/* Advanced Analytics Section — live data connections in progress */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold">Advanced Insights</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Deep dive into revenue trends, team performance, and service analytics
            </p>
          </div>
          <span className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700/50 px-2.5 py-1 rounded-full font-medium">
            🔧 Live data coming soon
          </span>
        </div>

        {/* Coming Soon Placeholder */}
        <div className="rounded-lg border-2 border-dashed border-amber-200 dark:border-amber-700/50 bg-amber-50/40 dark:bg-amber-950/20 p-8 text-center space-y-2">
          <p className="text-base font-semibold text-amber-900 dark:text-amber-300">Advanced charts are being connected to live data</p>
          <p className="text-sm text-amber-700 dark:text-amber-400/80">
            Rep performance, territory comparisons, revenue trends, and service mix charts will appear here once real-time data pipelines are complete.
            The analytics above already reflect accurate live data.
          </p>
        </div>
      </div>
    </div>
  );
}
