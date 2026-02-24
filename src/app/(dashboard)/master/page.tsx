import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { getDashboardMetrics, getFunnelStats } from "@/lib/db/leads";
import { PipelineFunnel } from "@/components/dashboard/pipeline-funnel";
import { RepLeaderboard } from "@/components/dashboard/rep-leaderboard";
import { ManagementFeesWidget } from "@/components/payments/management-fees-widget";
import { CompanyProfitabilityWidget } from "@/components/payments/company-profitability-widget";
import { OnboardingTutorial } from "@/components/onboarding/onboarding-tutorial";
import { QuickActions, RevenueMetricsWidget, GoalsWidget } from "@/components/dashboard/dashboard-widgets";
import { MyTasksWidget } from "@/components/dashboard/my-tasks-widget";
import { MetricsRow } from "@/components/dashboard/MetricsRow";
import { MasterDashboardGrid } from "@/components/dashboard/MasterDashboardGrid";
import { MasterPageClient } from "@/components/dashboard/MasterPageClient";
import { RefreshOnFocus } from "@/components/dashboard/refresh-on-focus";
import type { ResponsiveLayouts } from "react-grid-layout";

export default async function MasterDashboard() {
  const user = await requirePermission("view_analytics");

  const [metrics, funnelStats, repData, mrrGrowth, contextStats, globalSettings, teamUsers, savedLayout] = await Promise.all([
    getDashboardMetrics(user),
    getFunnelStats(user),

    // Rep performance
    prisma.user.findMany({
      where: { role: "sales", isActive: true },
      include: { territory: { select: { name: true } }, _count: { select: { assignedLeads: true } } },
    }).then(async (reps) =>
      Promise.all(reps.map(async (rep) => {
        const [active, won, revenue] = await Promise.all([
          prisma.lead.count({ where: { assignedTo: rep.id, status: { in: ["scheduled","contacted","follow_up","paperwork"] } } }),
          prisma.lead.count({ where: { assignedTo: rep.id, status: "won" } }),
          prisma.lead.aggregate({ where: { assignedTo: rep.id, status: "won" }, _sum: { dealValueTotal: true } }),
        ]);
        return { id: rep.id, name: rep.name, territoryName: rep.territory?.name ?? "Unassigned", assigned: rep._count.assignedLeads, active, won, revenue: Number(revenue._sum.dealValueTotal ?? 0) };
      }))
    ),

    // MRR growth
    (async () => {
      const now = new Date();
      const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const [curr, prev] = await Promise.all([
        prisma.clientProfile.findMany({ where: { status: "active" }, select: { retainerAmount: true } }),
        prisma.clientProfile.findMany({ where: { status: "active", onboardedAt: { lt: firstOfThisMonth } }, select: { retainerAmount: true } }),
      ]);
      const curMRR = curr.reduce((s, c) => s + Number(c.retainerAmount), 0);
      const prevMRR = prev.reduce((s, c) => s + Number(c.retainerAmount), 0);
      return prevMRR > 0 ? parseFloat(((curMRR - prevMRR) / prevMRR * 100).toFixed(1)) : 0;
    })(),

    // Context stats
    (async () => {
      const [needsAttention, availableLeads] = await Promise.all([
        prisma.clientProfile.count({ where: { status: "active", healthScore: { lt: 50 } } }),
        prisma.lead.count({ where: { status: "available" } }),
      ]);
      return { needsAttention, availableLeads };
    })(),

    prisma.globalSettings.findFirst(),

    // Team users for messaging audience selector
    prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, role: true },
      orderBy: { name: "asc" },
    }),

    // Saved dashboard layout
    prisma.user.findUnique({
      where: { id: parseInt(user.id) },
      select: { dashboardLayout: true },
    }).then(u => (u?.dashboardLayout as ResponsiveLayouts | null) ?? null),
  ]);

  // isOwner = David only (id=1). Seed user id=2 (Alex Johnson) was deleted in session Feb 22.
  const isOwner = Number(user.id) === 1;
  const isMaster = user.role === "master";

  // Goals widget or placeholder
  const goalsWidget = globalSettings?.goalsEnabled ? (
    <GoalsWidget
      wonDeals={metrics.wonDeals}
      targetDeals={globalSettings.monthlyDealTarget ?? 20}
      revenue={metrics.totalMRR}
      targetRevenue={globalSettings.monthlyRevenueTarget ?? 50000}
    />
  ) : (
    <div className="flex flex-col items-center justify-center h-full rounded-lg border border-dashed text-sm text-muted-foreground p-6 text-center gap-1">
      <span>Goals widget disabled.</span>
      <a href="/settings" className="underline text-xs">Configure in Settings → General</a>
    </div>
  );

  return (
    <MasterPageClient
      heading={
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {[
              contextStats.needsAttention > 0 && `${contextStats.needsAttention} client${contextStats.needsAttention !== 1 ? "s" : ""} need attention`,
              contextStats.availableLeads > 0 && `${contextStats.availableLeads} unclaimed lead${contextStats.availableLeads !== 1 ? "s" : ""} available`,
            ].filter(Boolean).join(" · ") || `Good work, ${user.name.split(" ")[0]} — everything looks healthy`}
          </p>
        </div>
      }
    >
      <MasterDashboardGrid
        savedLayout={savedLayout}
        showProfitability={isOwner}
      >
        {{
          "metrics": (
            <MetricsRow
              totalLeads={metrics.totalLeads}
              activeLeads={metrics.activeLeads}
              conversionRate={metrics.conversionRate}
              wonDeals={metrics.wonDeals}
              totalMRR={metrics.totalMRR}
              totalARR={metrics.totalARR}
            />
          ),
          "quick-actions": <QuickActions />,
          "revenue": <RevenueMetricsWidget mrr={metrics.totalMRR} arr={metrics.totalARR} growth={mrrGrowth} />,
          "goals": goalsWidget,
          "pipeline": <PipelineFunnel stats={funnelStats} />,
          "leaderboard": <RepLeaderboard reps={repData} />,
          "my-tasks": <MyTasksWidget />,
          "mgmt-fees": <ManagementFeesWidget />,
          "profitability": <CompanyProfitabilityWidget />,
        }}
      </MasterDashboardGrid>

      <OnboardingTutorial userRole={isOwner ? "owner" : "master"} userName={user.name} />
      <RefreshOnFocus />
    </MasterPageClient>
  );
}
