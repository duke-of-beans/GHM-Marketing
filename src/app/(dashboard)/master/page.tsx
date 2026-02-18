import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { getDashboardMetrics, getFunnelStats } from "@/lib/db/leads";
import { MetricCard, formatCurrency } from "@/components/dashboard/metric-card";
import { PipelineFunnel } from "@/components/dashboard/pipeline-funnel";
import { RepLeaderboard } from "@/components/dashboard/rep-leaderboard";
import { ManagementFeesWidget } from "@/components/payments/management-fees-widget";
import { CompanyProfitabilityWidget } from "@/components/payments/company-profitability-widget";
import { OnboardingTutorial } from "@/components/onboarding/onboarding-tutorial";
import { 
  QuickActions, 
  RevenueMetricsWidget, 
  GoalsWidget 
} from "@/components/dashboard/dashboard-widgets";

export default async function MasterDashboard() {
  const user = await requirePermission("view_analytics");

  const [metrics, funnelStats, repData, mrrGrowth, contextStats] = await Promise.all([
    getDashboardMetrics(user),
    getFunnelStats(user),
    // Get rep performance
    prisma.user.findMany({
      where: { role: "sales", isActive: true },
      include: {
        territory: { select: { name: true } },
        _count: {
          select: { assignedLeads: true },
        },
      },
    }).then(async (reps) => {
      // Fetch per-rep stats
      return Promise.all(
        reps.map(async (rep) => {
          const [active, won, revenue] = await Promise.all([
            prisma.lead.count({
              where: {
                assignedTo: rep.id,
                status: {
                  in: ["scheduled", "contacted", "follow_up", "paperwork"],
                },
              },
            }),
            prisma.lead.count({
              where: { assignedTo: rep.id, status: "won" },
            }),
            prisma.lead.aggregate({
              where: { assignedTo: rep.id, status: "won" },
              _sum: { dealValueTotal: true },
            }),
          ]);
          return {
            id: rep.id,
            name: rep.name,
            territoryName: rep.territory?.name ?? "Unassigned",
            assigned: rep._count.assignedLeads,
            active,
            won,
            revenue: Number(revenue._sum.dealValueTotal ?? 0),
          };
        })
      );
    }),
    // Real MRR growth: compare this month's client retainers to last month's
    (async () => {
      const now = new Date();
      const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const [currentClients, lastMonthClients] = await Promise.all([
        prisma.clientProfile.findMany({
          where: { status: "active" },
          select: { retainerAmount: true },
        }),
        prisma.clientProfile.findMany({
          where: {
            status: "active",
            onboardedAt: { lt: firstOfThisMonth },
          },
          select: { retainerAmount: true },
        }),
      ]);

      const currentMRR = currentClients.reduce((s, c) => s + Number(c.retainerAmount), 0);
      const lastMRR = lastMonthClients.reduce((s, c) => s + Number(c.retainerAmount), 0);
      return lastMRR > 0 ? parseFloat(((currentMRR - lastMRR) / lastMRR * 100).toFixed(1)) : 0;
    })(),
    // Context stats for the dashboard subtitle
    (async () => {
      const [needsAttention, availableLeads] = await Promise.all([
        prisma.clientProfile.count({ where: { status: "active", healthScore: { lt: 50 } } }),
        prisma.lead.count({ where: { status: "available" } }),
      ]);
      return { needsAttention, availableLeads };
    })(),
  ]);

  const isOwner = [1, 2].includes(Number(user.id));

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {[
            contextStats.needsAttention > 0 && `${contextStats.needsAttention} client${contextStats.needsAttention !== 1 ? 's' : ''} need attention`,
            contextStats.availableLeads > 0 && `${contextStats.availableLeads} unclaimed lead${contextStats.availableLeads !== 1 ? 's' : ''} available`,
          ].filter(Boolean).join(' · ') || `Good work, ${user.name.split(' ')[0]} — everything looks healthy`}
        </p>
      </div>

      {/* Top metrics row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard 
          title="Total Leads" 
          value={metrics.totalLeads}
          tooltip="Total number of leads in the system across all territories and statuses."
        />
        <MetricCard
          title="Active Pipeline"
          value={metrics.activeLeads}
          subtitle={`${metrics.conversionRate}% conversion`}
          tooltip="Leads currently in active sales stages (Scheduled, Contacted, Follow Up, Paperwork). Conversion rate = Won / (Won + Lost)."
        />
        <MetricCard
          title="Won Deals"
          value={metrics.wonDeals}
          className="[&_p.text-2xl]:text-green-600 [&_p.text-3xl]:text-green-600"
          tooltip="Total number of successfully closed deals that converted to active clients."
        />
        <MetricCard
          title="MRR"
          value={formatCurrency(metrics.totalMRR)}
          subtitle={`ARR ${formatCurrency(metrics.totalARR)}`}
          tooltip="Monthly Recurring Revenue from all active clients. ARR = Annual Run Rate (MRR × 12)."
        />
      </div>

      {/* Quick Actions + Revenue + Goals */}
      <div className="grid md:grid-cols-3 gap-4">
        <QuickActions />
        <RevenueMetricsWidget 
          mrr={metrics.totalMRR}
          arr={metrics.totalARR}
          growth={mrrGrowth}
        />
        {/* TODO: Move targetDeals + targetRevenue to GlobalSettings schema so goals are configurable per-tenant */}
        <GoalsWidget 
          wonDeals={metrics.wonDeals}
          targetDeals={20}
          revenue={metrics.totalMRR}
          targetRevenue={50000}
        />
      </div>

      {/* Pipeline + Rep performance */}
      <div className="grid md:grid-cols-2 gap-4">
        <PipelineFunnel stats={funnelStats} />
        <RepLeaderboard reps={repData} />
      </div>

      {/* Earnings/Profitability Widgets */}
      <div className="grid md:grid-cols-2 gap-4">
        <ManagementFeesWidget />
        {isOwner && <CompanyProfitabilityWidget />}
      </div>

      {/* Onboarding Tutorial */}
      <OnboardingTutorial 
        userRole={isOwner ? "owner" : "master"} 
        userName={user.name} 
      />
    </div>
  );
}
