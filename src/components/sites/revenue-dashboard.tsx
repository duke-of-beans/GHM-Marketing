"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { DollarSign, TrendingUp, Users, BarChart3, ArrowUp, ArrowDown } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

type Site = {
  id: number; domain: string; status: string;
  monthlyRevenueCurrent: number | null; monthlyTrafficCurrent: number | null;
  monetizationMix: string | null;
};
type RevenueEntry = {
  id: number; siteId: number; month: number; year: number;
  sourceType: string; sourceName: string; revenue: number;
  sessions: number | null; rpm: number | null;
};
type Network = { id: number; currentRpm: number | null; };
const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"];

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

export function RevenueDashboard({ sites, revenueEntries, networks }: {
  sites: Site[]; revenueEntries: RevenueEntry[]; networks: Network[];
}) {
  const activeSites = sites.filter(s => s.status === "ACTIVE" || s.status === "MONETIZING");
  const dormantSites = sites.filter(s => s.status === "PARKED" || s.status === "ARCHIVED");
  const forSaleSites = sites.filter(s => s.status === "FOR_SALE");

  const portfolioMrr = activeSites.reduce((sum, s) => sum + (s.monthlyRevenueCurrent ?? 0), 0);
  const totalTraffic = activeSites.reduce((sum, s) => sum + (s.monthlyTrafficCurrent ?? 0), 0);
  const activeNetworkRpms = networks.filter(n => n.currentRpm != null).map(n => n.currentRpm!);
  const avgRpm = activeNetworkRpms.length > 0 ? activeNetworkRpms.reduce((a, b) => a + b, 0) / activeNetworkRpms.length : 0;

  // Monthly trend: aggregate revenue by month for last 12 months
  const now = new Date();
  const monthlyTrend = useMemo(() => {
    const months: { label: string; revenue: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const rev = revenueEntries.filter(e => e.month === m && e.year === y).reduce((sum, e) => sum + e.revenue, 0);
      months.push({ label: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }), revenue: rev });
    }
    return months;
  }, [revenueEntries]);
  // Revenue by source type
  const bySource = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of revenueEntries) {
      map.set(e.sourceType, (map.get(e.sourceType) ?? 0) + e.revenue);
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [revenueEntries]);

  // Revenue by site with MoM comparison
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  const [sortKey, setSortKey] = useState<string>("domain");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const siteRows = useMemo(() => {
    return sites.map(site => {
      const thisMonthRev = revenueEntries.filter(e => e.siteId === site.id && e.month === currentMonth && e.year === currentYear).reduce((s, e) => s + e.revenue, 0);
      const lastMonthRev = revenueEntries.filter(e => e.siteId === site.id && e.month === lastMonth && e.year === lastMonthYear).reduce((s, e) => s + e.revenue, 0);
      const momChange = lastMonthRev > 0 ? ((thisMonthRev - lastMonthRev) / lastMonthRev) * 100 : null;
      return { ...site, thisMonthRev, lastMonthRev, momChange };
    }).sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortKey === "domain") return a.domain.localeCompare(b.domain) * dir;
      const aVal = (a as any)[sortKey] ?? 0;
      const bVal = (b as any)[sortKey] ?? 0;
      return (aVal - bVal) * dir;
    });
  }, [sites, revenueEntries, sortKey, sortDir]);

  function toggleSort(key: string) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  }
  if (revenueEntries.length === 0) {
    return <EmptyState icon={DollarSign} title="No revenue data yet" description="Add revenue entries to your sites to see portfolio performance here." />;
  }

  return (
    <div className="space-y-6">
      {/* Metric tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Portfolio MRR</p>
          <p className="text-2xl font-bold">{formatCurrency(portfolioMrr)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Total Traffic</p>
          <p className="text-2xl font-bold">{formatNumber(totalTraffic)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Average RPM</p>
          <p className="text-2xl font-bold">${avgRpm.toFixed(2)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Total Sites</p>
          <p className="text-2xl font-bold">{sites.length}</p>
          <p className="text-xs text-muted-foreground">{activeSites.length} active / {dormantSites.length} dormant / {forSaleSites.length} for sale</p>
        </CardContent></Card>
      </div>
      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Monthly Revenue Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyTrend}>
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Revenue by Source</CardTitle></CardHeader>
          <CardContent>
            {bySource.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={bySource} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(e) => e.name}>
                    {bySource.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-muted-foreground text-sm">No data</p>}
          </CardContent>
        </Card>
      </div>
      {/* Revenue by site table */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Revenue by Site</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium cursor-pointer hover:text-primary" onClick={() => toggleSort("domain")}>Site</th>
              <th className="text-right p-3 font-medium cursor-pointer hover:text-primary" onClick={() => toggleSort("thisMonthRev")}>This Month</th>
              <th className="text-right p-3 font-medium cursor-pointer hover:text-primary" onClick={() => toggleSort("lastMonthRev")}>Last Month</th>
              <th className="text-right p-3 font-medium cursor-pointer hover:text-primary" onClick={() => toggleSort("momChange")}>MoM Change</th>
              <th className="text-right p-3 font-medium">Traffic</th>
              <th className="text-left p-3 font-medium">Monetization</th>
            </tr></thead>
            <tbody>
              {siteRows.map(s => (
                <tr key={s.id} className="border-b hover:bg-muted/30 cursor-pointer" onClick={() => window.location.href = `/sites/${s.id}`}>
                  <td className="p-3"><Link href={`/sites/${s.id}`} className="text-primary hover:underline font-medium">{s.domain}</Link></td>
                  <td className="p-3 text-right font-mono">{formatCurrency(s.thisMonthRev)}</td>
                  <td className="p-3 text-right font-mono">{formatCurrency(s.lastMonthRev)}</td>
                  <td className="p-3 text-right font-mono">
                    {s.momChange != null ? (
                      <span className={s.momChange >= 0 ? "text-green-600" : "text-red-600"}>
                        {s.momChange >= 0 ? <ArrowUp className="inline h-3 w-3" /> : <ArrowDown className="inline h-3 w-3" />}
                        {Math.abs(s.momChange).toFixed(1)}%
                      </span>
                    ) : "—"}
                  </td>
                  <td className="p-3 text-right font-mono">{formatNumber(s.monthlyTrafficCurrent ?? 0)}</td>
                  <td className="p-3 capitalize text-muted-foreground">{s.monetizationMix ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}