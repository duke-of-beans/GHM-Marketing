"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type Site = {
  id: number; domain: string; status: string;
  monthlyRevenueCurrent: number | null; monthlyTrafficCurrent: number | null;
};
type RevenueEntry = {
  id: number; siteId: number; month: number; year: number;
  revenue: number | null; sessions: number | null;
};
type Network = {
  id: number; siteId: number; networkName: string; status: string;
  currentMonthlySessions: number | null; monthlySessionsRequired: number | null;
  qualificationProgress: number | null;
};
type Brief = {
  id: number; siteId: number; status: string; refreshDue: boolean;
  publishedDate: string | null; attributedMonthlyRevenue: number | null;
};
type Valuation = {
  id: number; siteId: number; estimatedValue: number | null; valuationDate: string;
};

type WidgetProps = {
  sites: Site[];
  revenueEntries: RevenueEntry[];
  networks: Network[];
  briefs: Brief[];
  valuations: Valuation[];
};

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

/* ── Widget 1: Top Earners ── */
export function TopEarnersWidget({ sites }: { sites: Site[] }) {
  const top5 = [...sites]
    .filter(s => s.monthlyRevenueCurrent != null && s.monthlyRevenueCurrent > 0)
    .sort((a, b) => (b.monthlyRevenueCurrent ?? 0) - (a.monthlyRevenueCurrent ?? 0))
    .slice(0, 5);

  if (top5.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader><CardTitle className="text-base">Top Earners</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground">Add revenue data to your sites to see top earners.</p></CardContent>
      </Card>
    );
  }

  const data = top5.map(s => ({ name: s.domain.replace(/^www\./, ""), revenue: s.monthlyRevenueCurrent ?? 0 }));

  return (
    <Card className="h-full">
      <CardHeader><CardTitle className="text-base">Top Earners</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} layout="vertical" margin={{ left: 80, right: 10, top: 0, bottom: 0 }}>
            <XAxis type="number" tickFormatter={(v) => `$${v}`} fontSize={11} />
            <YAxis type="category" dataKey="name" fontSize={11} width={80} />
            <Tooltip formatter={(v: number | undefined) => formatCurrency(v ?? 0)} />
            <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

/* ── Widget 2: Site Health ── */
export function SiteHealthWidget({ sites, revenueEntries, briefs }: { sites: Site[]; revenueEntries: RevenueEntry[]; briefs: Brief[] }) {
  const now = new Date();
  const activeSites = sites.filter(s => s.status === "ACTIVE");

  if (activeSites.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader><CardTitle className="text-base">Site Health</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground">Not enough data yet to calculate site health.</p></CardContent>
      </Card>
    );
  }

  function getMonthlyTotals(siteId: number, field: "revenue" | "sessions") {
    const entries = revenueEntries.filter(e => e.siteId === siteId);
    const months: Map<string, number> = new Map();
    for (const e of entries) {
      const key = `${e.year}-${String(e.month).padStart(2, "0")}`;
      months.set(key, (months.get(key) ?? 0) + (field === "revenue" ? (e.revenue ?? 0) : (e.sessions ?? 0)));
    }
    return [...months.entries()].sort((a, b) => b[0].localeCompare(a[0])).slice(0, 3).map(([, v]) => v);
  }

  function trend(vals: number[]): "up" | "flat" | "down" {
    if (vals.length < 2) return "flat";
    const recent = vals[0]; const older = vals[vals.length - 1];
    if (recent > older * 1.05) return "up";
    if (recent < older * 0.95) return "down";
    return "flat";
  }

  const healthData = activeSites.map(site => {
    const revTrend = trend(getMonthlyTotals(site.id, "revenue"));
    const trafficTrend = trend(getMonthlyTotals(site.id, "sessions"));
    const siteBriefs = briefs.filter(b => b.siteId === site.id && b.status === "PUBLISHED");
    const freshPct = siteBriefs.length > 0 ? siteBriefs.filter(b => !b.refreshDue).length / siteBriefs.length : 1;
    let concerns = 0;
    if (revTrend === "down") concerns++;
    if (trafficTrend === "down") concerns++;
    if (freshPct < 0.7) concerns++;
    const color = concerns === 0 ? "green" : concerns === 1 ? "amber" : "red";
    return { domain: site.domain, color, concerns };
  });

  const badgeClass: Record<string, string> = {
    green: "bg-green-100 text-green-800",
    amber: "bg-amber-100 text-amber-800",
    red: "bg-red-100 text-red-800",
  };

  return (
    <Card className="h-full">
      <CardHeader><CardTitle className="text-base">Site Health</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-2">
          {healthData.map(h => (
            <div key={h.domain} className="flex items-center justify-between text-sm">
              <span className="truncate">{h.domain}</span>
              <Badge className={badgeClass[h.color]}>{h.color === "green" ? "Healthy" : h.color === "amber" ? "Warning" : "At Risk"}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Widget 3: Qualification Tracker ── */
export function QualificationTrackerWidget({ networks, sites }: { networks: Network[]; sites: Site[] }) {
  const qualifying = networks.filter(n =>
    (n.status === "NOT_QUALIFIED" || n.status === "PENDING") && n.monthlySessionsRequired != null && n.monthlySessionsRequired > 0
  );

  if (qualifying.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader><CardTitle className="text-base">Qualification Tracker</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground">No sites are currently working toward ad network qualification.</p></CardContent>
      </Card>
    );
  }

  const siteMap = new Map(sites.map(s => [s.id, s.domain]));

  return (
    <Card className="h-full">
      <CardHeader><CardTitle className="text-base">Qualification Tracker</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-3">
          {qualifying.map(n => {
            const progress = Math.min(n.qualificationProgress ?? 0, 100);
            const current = n.currentMonthlySessions ?? 0;
            const required = n.monthlySessionsRequired ?? 1;
            const barColor = progress >= 100 ? "bg-green-500" : progress >= 50 ? "bg-amber-500" : "bg-red-500";
            return (
              <div key={n.id} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{n.networkName}</span>
                  <span className="text-muted-foreground text-xs">{siteMap.get(n.siteId) ?? "Unknown"}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className={`h-2 rounded-full ${barColor}`} style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {current.toLocaleString()} / {required.toLocaleString()} sessions to {n.networkName}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Widget 4: Content Velocity ── */
export function ContentVelocityWidget({ briefs, sites }: { briefs: Brief[]; sites: Site[] }) {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
  const lastYear = thisMonth === 0 ? thisYear - 1 : thisYear;

  const published = briefs.filter(b => b.status === "PUBLISHED" && b.publishedDate);

  if (published.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader><CardTitle className="text-base">Content Velocity</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground">No published briefs yet.</p></CardContent>
      </Card>
    );
  }

  const siteMap = new Map(sites.map(s => [s.id, s.domain]));
  const siteIds = [...new Set(briefs.map(b => b.siteId))];

  const rows = siteIds.map(siteId => {
    const siteBriefs = published.filter(b => b.siteId === siteId);
    const thisMonthCount = siteBriefs.filter(b => {
      const d = new Date(b.publishedDate!);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    }).length;
    const lastMonthCount = siteBriefs.filter(b => {
      const d = new Date(b.publishedDate!);
      return d.getMonth() === lastMonth && d.getFullYear() === lastYear;
    }).length;
    return { domain: siteMap.get(siteId) ?? "Unknown", thisMonthCount, lastMonthCount, change: thisMonthCount - lastMonthCount };
  });

  return (
    <Card className="h-full">
      <CardHeader><CardTitle className="text-base">Content Velocity</CardTitle></CardHeader>
      <CardContent className="p-0">
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left">
            <th className="p-2 font-medium">Site</th>
            <th className="p-2 text-right font-medium">This Mo</th>
            <th className="p-2 text-right font-medium">Last Mo</th>
            <th className="p-2 text-right font-medium">Change</th>
          </tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.domain} className={r.thisMonthCount === 0 ? "bg-amber-50" : ""}>
                <td className="p-2 truncate max-w-[120px]">{r.domain}</td>
                <td className="p-2 text-right">{r.thisMonthCount}</td>
                <td className="p-2 text-right">{r.lastMonthCount}</td>
                <td className={`p-2 text-right ${r.change > 0 ? "text-green-600" : r.change < 0 ? "text-red-600" : ""}`}>
                  {r.change > 0 ? "+" : ""}{r.change}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

/* ── Widget 5: Portfolio Valuation ── */
export function PortfolioValuationWidget({ sites, valuations }: { sites: Site[]; valuations: Valuation[] }) {
  const activeSites = sites.filter(s => s.status === "ACTIVE");
  if (activeSites.length === 0 || valuations.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader><CardTitle className="text-base">Portfolio Valuation</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground">Add site valuations to see total portfolio value.</p></CardContent>
      </Card>
    );
  }

  // Most recent valuation per active site
  const latestBySite = new Map<number, number>();
  for (const v of valuations) {
    if (!activeSites.some(s => s.id === v.siteId)) continue;
    if (v.estimatedValue == null) continue;
    if (!latestBySite.has(v.siteId)) latestBySite.set(v.siteId, v.estimatedValue);
  }

  const total = [...latestBySite.values()].reduce((s, v) => s + v, 0);
  const siteCount = latestBySite.size;

  return (
    <Card className="h-full">
      <CardHeader><CardTitle className="text-base">Portfolio Valuation</CardTitle></CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-6">
        <p className="text-3xl font-bold">{formatCurrency(total)}</p>
        <p className="text-sm text-muted-foreground mt-1">across {siteCount} site{siteCount !== 1 ? "s" : ""}</p>
      </CardContent>
    </Card>
  );
}

/* ── Combined Panel ── */
export function AffiliateWidgetPanel(props: WidgetProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <TopEarnersWidget sites={props.sites} />
      <SiteHealthWidget sites={props.sites} revenueEntries={props.revenueEntries} briefs={props.briefs} />
      <QualificationTrackerWidget networks={props.networks} sites={props.sites} />
      <ContentVelocityWidget briefs={props.briefs} sites={props.sites} />
      <PortfolioValuationWidget sites={props.sites} valuations={props.valuations} />
    </div>
  );
}
