import { getCurrentUser, territoryFilter } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getFunnelStats } from "@/lib/db/leads";
import { MetricCard, formatCurrency } from "@/components/dashboard/metric-card";
import { PipelineFunnel } from "@/components/dashboard/pipeline-funnel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MyEarningsWidget } from "@/components/payments/my-earnings-widget";
import { MyTasksWidget } from "@/components/dashboard/my-tasks-widget";
import { RefreshOnFocus } from "@/components/dashboard/refresh-on-focus";
import { TerritoryHealthBanner } from "@/components/sales/territory-health-banner";
import { MyBookWidget } from "@/components/sales/my-book-widget";
import { SalesToolsPanel } from "@/components/sales/sales-tools-panel";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function SalesDashboard() {
  const user = await getCurrentUser();

  // First-login redirect: sales reps who haven't completed onboarding go to setup wizard
  if (user.role === "sales") {
    const dbUser = await prisma.user.findUnique({
      where: { id: Number(user.id) },
      select: { repOnboardingCompletedAt: true },
    });
    if (!dbUser?.repOnboardingCompletedAt) {
      redirect("/rep-setup");
    }
  }

  const filter = territoryFilter(user);
  const userId = Number(user.id);

  // First-login check: send new reps through setup before showing dashboard
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { repOnboardingCompletedAt: true },
  });
  if (user.role === "sales" && !dbUser?.repOnboardingCompletedAt) {
    redirect("/rep-setup");
  }

  // 90-day window for close rate calculation
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const [funnelStats, recentLeads, myStats, closedLast90, activeClients] =
    await Promise.all([
      getFunnelStats(user),

      // Needs attention: oldest in active stages
      prisma.lead.findMany({
        where: {
          ...filter,
          assignedTo: userId,
          status: { in: ["scheduled", "contacted", "follow_up", "paperwork"] },
        },
        select: {
          id: true,
          businessName: true,
          city: true,
          status: true,
          statusChangedAt: true,
          dealValueTotal: true,
        },
        orderBy: { statusChangedAt: "asc" },
        take: 6,
      }),

      // My aggregate stats
      Promise.all([
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
        prisma.lead.count({ where: { ...filter, status: "available" } }),
      ]),

      // Closes in last 90 days (for threshold calculation)
      prisma.lead.count({
        where: {
          assignedTo: userId,
          status: "won",
          statusChangedAt: { gte: ninetyDaysAgo },
        },
      }),

      // Active clients (for My Book)
      prisma.clientProfile.count({
        where: { salesRepId: userId, status: "active" },
      }),
    ]);

  const [myActive, myWon, myRevenue, availableInTerritory] = myStats;

  // Rolling 90-day close rate: closes ÷ 3 months = monthly avg
  const rolling90DayAvg = closedLast90 / 3;
  const thresholdTarget = 2;
  const thresholdProgress = Math.min(
    100,
    Math.round((rolling90DayAvg / thresholdTarget) * 100)
  );
  const thresholdStatus: "good" | "warning" | "danger" =
    rolling90DayAvg >= thresholdTarget
      ? "good"
      : rolling90DayAvg >= thresholdTarget * 0.7
      ? "warning"
      : "danger";

  return (
    <div className="space-y-5 pb-20 md:pb-0">

      {/* Territory Health Banner */}
      <TerritoryHealthBanner
        territoryName={user.territoryName}
        rolling90DayAvg={rolling90DayAvg}
        thresholdTarget={thresholdTarget}
        thresholdProgress={thresholdProgress}
        thresholdStatus={thresholdStatus}
        closedLast90={closedLast90}
      />

      <div>
        <h1 className="text-2xl font-bold">My Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {user.name}
          {user.territoryName ? ` · ${user.territoryName}` : ""}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          title="Available"
          value={availableInTerritory}
          subtitle="In my territory"
          className="[&_p.text-2xl]:text-blue-600 [&_p.text-3xl]:text-blue-600"
          tooltip="Unassigned leads in your territory ready to claim."
        />
        <MetricCard
          title="Active Leads"
          value={myActive}
          tooltip="Leads in your pipeline across all active stages."
        />
        <MetricCard
          title="My Book"
          value={activeClients}
          subtitle="Active clients"
          className="[&_p.text-2xl]:text-status-success [&_p.text-3xl]:text-status-success"
          tooltip="Clients you closed who are actively paying. These generate your residuals."
        />
        <MetricCard
          title="All-Time Wins"
          value={myWon}
          subtitle={formatCurrency(Number(myRevenue._sum.dealValueTotal ?? 0))}
          tooltip="Total clients closed and the total deal value that generated."
        />
      </div>

      {/* Sales Tools */}
      <SalesToolsPanel />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MyBookWidget activeClients={activeClients} />
        <MyEarningsWidget />
      </div>

      <PipelineFunnel stats={funnelStats} />

      <MyTasksWidget />

      {/* Needs Attention */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Needs Attention</CardTitle>
            <Link href="/leads">
              <Button variant="ghost" size="sm" className="text-xs">View all →</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentLeads.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No active leads in pipeline. Claim leads from Available to get started.
            </p>
          ) : (
            <div className="space-y-1">
              {recentLeads.map((lead) => {
                const daysSince = Math.floor(
                  (Date.now() - new Date(lead.statusChangedAt).getTime()) /
                    (1000 * 60 * 60 * 24)
                );
                const isStale = daysSince >= 5;
                return (
                  <Link
                    key={lead.id}
                    href="/leads"
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-primary">
                        {lead.businessName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {lead.city}
                        {" · "}
                        <span className={isStale ? "text-status-warning font-medium" : ""}>
                          {daysSince}d in stage
                        </span>
                      </p>
                    </div>
                    {Number(lead.dealValueTotal) > 0 && (
                      <span className="text-sm font-medium flex-shrink-0 ml-3">
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

      <RefreshOnFocus />
    </div>
  );
}
