import { getCurrentUser, territoryFilter } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getDashboardMetrics, getFunnelStats } from "@/lib/db/leads";
import { MetricCard, formatCurrency } from "@/components/dashboard/metric-card";
import { PipelineFunnel } from "@/components/dashboard/pipeline-funnel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MyEarningsWidget } from "@/components/payments/my-earnings-widget";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function SalesDashboard() {
  const user = await getCurrentUser();
  const filter = territoryFilter(user);
  const userId = Number(user.id);

  const [, funnelStats, recentLeads] = await Promise.all([
    getDashboardMetrics(user),
    getFunnelStats(user),
    // Recent leads assigned to this rep
    prisma.lead.findMany({
      where: {
        ...filter,
        assignedTo: userId,
        status: {
          in: ["scheduled", "contacted", "follow_up", "paperwork"],
        },
      },
      select: {
        id: true,
        businessName: true,
        city: true,
        status: true,
        statusChangedAt: true,
        dealValueTotal: true,
      },
      orderBy: { statusChangedAt: "asc" }, // Oldest first = needs attention
      take: 5,
    }),
  ]);

  // My personal stats
  const [myActive, myWon, myRevenue] = await Promise.all([
    prisma.lead.count({
      where: {
        assignedTo: userId,
        status: { in: ["scheduled", "contacted", "follow_up", "paperwork"] },
      },
    }),
    prisma.lead.count({ where: { assignedTo: userId, status: "won" } }),
    prisma.lead.aggregate({
      where: { assignedTo: userId, status: "won" },
      _sum: { dealValueTotal: true },
    }),
  ]);

  const availableInTerritory = await prisma.lead.count({
    where: { ...filter, status: "available" },
  });

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div>
        <h1 className="text-2xl font-bold">My Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {user.name}{user.territoryName ? ` · ${user.territoryName}` : ""}
        </p>
      </div>

      {/* My stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          title="Available"
          value={availableInTerritory}
          subtitle="In my territory"
          className="[&_p.text-2xl]:text-blue-600 [&_p.text-3xl]:text-blue-600"
        />
        <MetricCard title="My Active" value={myActive} />
        <MetricCard
          title="My Wins"
          value={myWon}
          className="[&_p.text-2xl]:text-green-600 [&_p.text-3xl]:text-green-600"
        />
        <MetricCard
          title="My Revenue"
          value={formatCurrency(Number(myRevenue._sum.dealValueTotal ?? 0))}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Pipeline funnel */}
        <PipelineFunnel stats={funnelStats} />

        {/* My Earnings */}
        <MyEarningsWidget />
      </div>

      {/* Needs Attention */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Needs Attention</CardTitle>
            <Link href="/leads">
              <Button variant="ghost" size="sm" className="text-xs">
                View all →
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentLeads.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No active leads — grab some from Available!
            </p>
          ) : (
            <div className="space-y-2">
              {recentLeads.map((lead) => {
                const daysSince = Math.floor(
                  (Date.now() - new Date(lead.statusChangedAt).getTime()) /
                    (1000 * 60 * 60 * 24)
                );
                return (
                  <Link
                    key={lead.id}
                    href="/leads"
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {lead.businessName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {lead.city} · {daysSince}d in stage
                      </p>
                    </div>
                    {Number(lead.dealValueTotal) > 0 && (
                      <span className="text-sm font-medium flex-shrink-0">
                        ${Number(lead.dealValueTotal).toLocaleString()}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
