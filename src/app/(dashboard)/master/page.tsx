import { requireMaster } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getDashboardMetrics, getFunnelStats } from "@/lib/db/leads";
import { MetricCard, formatCurrency } from "@/components/dashboard/metric-card";
import { PipelineFunnel } from "@/components/dashboard/pipeline-funnel";
import { RepLeaderboard } from "@/components/dashboard/rep-leaderboard";
import { ManagementFeesWidget } from "@/components/payments/management-fees-widget";
import { CompanyProfitabilityWidget } from "@/components/payments/company-profitability-widget";

export default async function MasterDashboard() {
  const user = await requireMaster();

  const [metrics, funnelStats, repData] = await Promise.all([
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
  ]);

  const isOwner = [1, 2].includes(Number(user.id));

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back, {user.name.split(' ')[0]}</p>
      </div>

      {/* Top metrics row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard title="Total Leads" value={metrics.totalLeads} />
        <MetricCard
          title="Active Pipeline"
          value={metrics.activeLeads}
          subtitle={`${metrics.conversionRate}% conversion`}
        />
        <MetricCard
          title="Won Deals"
          value={metrics.wonDeals}
          className="[&_p.text-2xl]:text-green-600 [&_p.text-3xl]:text-green-600"
        />
        <MetricCard
          title="MRR"
          value={formatCurrency(metrics.totalMRR)}
          subtitle={`ARR ${formatCurrency(metrics.totalARR)}`}
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
    </div>
  );
}
