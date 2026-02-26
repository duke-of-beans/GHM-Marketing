import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard, formatCurrency } from "@/components/dashboard/metric-card";


export default async function ReportsPage() {
  await requirePermission("view_analytics");

  // Territory breakdown
  const territories = await prisma.territory.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { leads: true, users: true } },
      leads: {
        select: { status: true, dealValueTotal: true, mrr: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const territoryStats = territories.map((t) => {
    const won = t.leads.filter((l) => l.status === "won");
    const active = t.leads.filter((l) =>
      ["scheduled", "contacted", "follow_up", "paperwork"].includes(l.status)
    );
    return {
      name: t.name,
      totalLeads: t._count.leads,
      reps: t._count.users,
      active: active.length,
      won: won.length,
      revenue: won.reduce((sum, l) => sum + Number(l.dealValueTotal), 0),
      mrr: won.reduce((sum, l) => sum + Number(l.mrr), 0),
    };
  });

  // Source performance
  const sources = await prisma.leadSource.findMany({
    include: {
      _count: { select: { leads: true } },
      leads: {
        select: { status: true, dealValueTotal: true },
      },
    },
  });

  const sourceStats = sources.map((s) => {
    const won = s.leads.filter((l) => l.status === "won");
    return {
      name: s.name,
      type: s.type,
      total: s._count.leads,
      won: won.length,
      revenue: won.reduce((sum, l) => sum + Number(l.dealValueTotal), 0),
      conversionRate:
        s._count.leads > 0
          ? Math.round((won.length / s._count.leads) * 100)
          : 0,
      costPerLead: s.costPerLead ? Number(s.costPerLead) : null,
    };
  });

  // Global stats
  const totalRevenue = territoryStats.reduce((s, t) => s + t.revenue, 0);
  const totalMRR = territoryStats.reduce((s, t) => s + t.mrr, 0);

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-sm text-muted-foreground">Territory and source performance</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard title="Total Revenue" value={formatCurrency(totalRevenue)} />
        <MetricCard title="Monthly Recurring" value={formatCurrency(totalMRR)} />
        <MetricCard title="Territories" value={territories.length} />
        <MetricCard title="Lead Sources" value={sources.length} />
      </div>

      {/* Territory breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Territory Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 font-medium">Territory</th>
                  <th className="pb-2 font-medium text-right">Reps</th>
                  <th className="pb-2 font-medium text-right">Leads</th>
                  <th className="pb-2 font-medium text-right">Active</th>
                  <th className="pb-2 font-medium text-right">Won</th>
                  <th className="pb-2 font-medium text-right">Revenue</th>
                  <th className="pb-2 font-medium text-right">MRR</th>
                </tr>
              </thead>
              <tbody>
                {territoryStats.map((t) => (
                  <tr key={t.name} className="border-b last:border-0">
                    <td className="py-2 font-medium">{t.name}</td>
                    <td className="py-2 text-right">{t.reps}</td>
                    <td className="py-2 text-right">{t.totalLeads}</td>
                    <td className="py-2 text-right">{t.active}</td>
                    <td className="py-2 text-right text-status-success">{t.won}</td>
                    <td className="py-2 text-right font-medium">
                      {formatCurrency(t.revenue)}
                    </td>
                    <td className="py-2 text-right font-medium">
                      {formatCurrency(t.mrr)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Source performance */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Lead Source Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 font-medium">Source</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium text-right">Leads</th>
                  <th className="pb-2 font-medium text-right">Won</th>
                  <th className="pb-2 font-medium text-right">Conv %</th>
                  <th className="pb-2 font-medium text-right">Revenue</th>
                  <th className="pb-2 font-medium text-right">CPL</th>
                </tr>
              </thead>
              <tbody>
                {sourceStats.map((s) => (
                  <tr key={s.name} className="border-b last:border-0">
                    <td className="py-2 font-medium">{s.name}</td>
                    <td className="py-2 text-muted-foreground">{s.type}</td>
                    <td className="py-2 text-right">{s.total}</td>
                    <td className="py-2 text-right text-status-success">{s.won}</td>
                    <td className="py-2 text-right">{s.conversionRate}%</td>
                    <td className="py-2 text-right font-medium">
                      {formatCurrency(s.revenue)}
                    </td>
                    <td className="py-2 text-right text-muted-foreground">
                      {s.costPerLead !== null ? `$${s.costPerLead.toFixed(2)}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
