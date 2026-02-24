import { requirePermission } from "@/lib/auth/permissions";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";
import { IntelligenceTrends } from "@/components/analytics/intelligence-trends";
import { buildMonthlyTrend } from "@/lib/analytics/intelligence";
import { DashboardUsagePanel } from "@/components/analytics/dashboard-usage-panel";

export default async function AnalyticsPage() {
  await requirePermission("view_analytics");
  const session = await auth();
  const isAdmin = (session?.user as any)?.role === "admin";

  // Fetch analytics data
  const [leads, clients, tasks, scans, opportunities, allScans] = await Promise.all([
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
        churnedAt: true,
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
    // For intelligence trends — all clients + all scans
    prisma.competitiveScan.findMany({
      select: { clientId: true, scanDate: true, healthScore: true },
      orderBy: { scanDate: "desc" },
      take: 2000,
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

  // Build MoM trend for IntelligenceTrends (4A)
  const clientRows = clients.map((c) => ({
    id: c.id,
    retainerAmount: Number(c.retainerAmount),
    status: c.status,
    onboardedAt: c.onboardedAt,
    churnedAt: c.churnedAt ?? null,
    healthScore: c.healthScore,
  }));
  const scanRows = allScans.map((s) => ({
    clientId: s.clientId,
    scanDate: s.scanDate,
    healthScore: s.healthScore,
  }));
  const trend12 = buildMonthlyTrend(clientRows, scanRows, 12);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Business Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Revenue performance, pipeline health, and growth forecasting at a glance
        </p>
      </div>

      <AnalyticsDashboard data={serialized} />

      {/* Intelligence Layer — Sprint 4A: MoM Trend Charts */}
      <IntelligenceTrends trend={trend12} />

      {/* Platform Usage Analytics — FEAT-019 (admin only) */}
      {isAdmin && (
        <div>
          <h2 className="text-xl font-bold mb-4">Platform Usage</h2>
          <DashboardUsagePanel />
        </div>
      )}
    </div>
  );
}
