import { getCurrentUser, territoryFilter } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getDashboardMetrics, getFunnelStats } from "@/lib/db/leads";
import { MetricCard, formatCurrency } from "@/components/dashboard/metric-card";
import { PipelineFunnel } from "@/components/dashboard/pipeline-funnel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MyEarningsWidget } from "@/components/payments/my-earnings-widget";
import { OnboardingTutorial } from "@/components/onboarding/onboarding-tutorial";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Target, TrendingUp, DollarSign, Zap } from "lucide-react";
import { MyTasksWidget } from "@/components/dashboard/my-tasks-widget";

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
          tooltip="Unassigned leads in your territory that are ready to be claimed. Grab these to build your pipeline!"
        />
        <MetricCard 
          title="My Active" 
          value={myActive}
          tooltip="Leads currently assigned to you in active sales stages (Scheduled, Contacted, Follow Up, Paperwork)."
        />
        <MetricCard
          title="My Wins"
          value={myWon}
          className="[&_p.text-2xl]:text-green-600 [&_p.text-3xl]:text-green-600"
          tooltip="Total number of deals you've successfully closed. Great work!"
        />
        <MetricCard
          title="My Revenue"
          value={formatCurrency(Number(myRevenue._sum.dealValueTotal ?? 0))}
          tooltip="Total deal value from all your won clients. This drives your commission and residuals!"
        />
      </div>

      {/* Quick Actions for Sales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/leads">
              <Button className="w-full h-auto flex-col items-start gap-2 p-4 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-950/70 text-blue-900 dark:text-blue-200 border-none">
                <div className="flex items-center gap-2 w-full">
                  <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className="font-semibold text-sm">View Pipeline</span>
                </div>
                <span className="text-xs text-muted-foreground text-left w-full">
                  Manage your active leads
                </span>
              </Button>
            </Link>
            <Link href="/leads?filter=available">
              <Button variant="outline" className="w-full h-auto flex-col items-start gap-2 p-4 bg-green-50 hover:bg-green-100 dark:bg-green-950/40 dark:hover:bg-green-950/70 dark:text-green-200 border-none">
                <div className="flex items-center gap-2 w-full">
                  <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className="font-semibold text-sm">Claim Leads</span>
                </div>
                <span className="text-xs text-muted-foreground text-left w-full">
                  {availableInTerritory} available now
                </span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Pipeline funnel */}
        <PipelineFunnel stats={funnelStats} />

        {/* My Earnings */}
        <MyEarningsWidget />
      </div>

      {/* My Tasks */}
      <MyTasksWidget />

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

      {/* Onboarding Tutorial */}
      <OnboardingTutorial userRole="sales" userName={user.name} />
    </div>
  );
}
