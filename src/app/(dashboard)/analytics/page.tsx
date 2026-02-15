"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
} from "recharts";
import { LEAD_STATUS_CONFIG } from "@/types";
import type { LeadStatus } from "@prisma/client";

type AnalyticsData = {
  pipeline: { status: string; count: number; totalValue: number; mrr: number }[];
  leadsOverTime: { date: string; count: number }[];
  wonsOverTime: { week: string; count: number; value: number }[];
  stageTimes: { status: string; avgDays: number }[];
  sourcePerformance: {
    name: string;
    total: number;
    won: number;
    revenue: number;
    conversionRate: number;
  }[];
  repLeaderboard: {
    name: string;
    territory: string;
    totalLeads: number;
    wonDeals: number;
    revenue: number;
    mrr: number;
    conversionRate: number;
  }[];
};

const fmtCurrency = (v: number) =>
  `$${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

const STAGE_COLORS: Record<string, string> = {
  new_lead: "#94a3b8",
  contacted: "#60a5fa",
  follow_up: "#a78bfa",
  scheduled: "#f59e0b",
  paperwork: "#f97316",
  won: "#22c55e",
  lost: "#ef4444",
  stalled: "#6b7280",
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?days=${days}`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading || !data) {
    return (
      <div className="p-4 md:p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-muted rounded" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  const totalLeads = data.pipeline.reduce((s, p) => s + p.count, 0);
  const totalValue = data.pipeline.reduce((s, p) => s + p.totalValue, 0);
  const wonStage = data.pipeline.find((p) => p.status === "won");
  const totalMRR = data.pipeline.reduce((s, p) => s + p.mrr, 0);

  return (
    <div className="p-4 md:p-6 space-y-6 pb-20 md:pb-6 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <select
          className="h-9 px-3 text-sm border rounded bg-background"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
        >
          <option value={7}>7 days</option>
          <option value={30}>30 days</option>
          <option value={90}>90 days</option>
          <option value={180}>6 months</option>
          <option value={365}>1 year</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border rounded-lg p-3 bg-card">
          <p className="text-xs text-muted-foreground">Total Leads</p>
          <p className="text-2xl font-bold">{totalLeads}</p>
        </div>
        <div className="border rounded-lg p-3 bg-card">
          <p className="text-xs text-muted-foreground">Pipeline Value</p>
          <p className="text-2xl font-bold">{fmtCurrency(totalValue)}</p>
        </div>
        <div className="border rounded-lg p-3 bg-card">
          <p className="text-xs text-muted-foreground">Won Deals</p>
          <p className="text-2xl font-bold text-green-600">
            {wonStage?.count ?? 0}
          </p>
        </div>
        <div className="border rounded-lg p-3 bg-card">
          <p className="text-xs text-muted-foreground">Monthly Recurring</p>
          <p className="text-2xl font-bold text-blue-600">
            {fmtCurrency(totalMRR)}
          </p>
        </div>
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pipeline Funnel */}
        <div className="border rounded-lg p-4 bg-card">
          <h2 className="font-semibold mb-3">Pipeline by Stage</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={data.pipeline.filter((p) => p.status !== "lost" && p.status !== "stalled")}
              layout="vertical"
              margin={{ left: 10, right: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" />
              <YAxis
                type="category"
                dataKey="status"
                width={90}
                tickFormatter={(s) =>
                  LEAD_STATUS_CONFIG[s as LeadStatus]?.label ?? s
                }
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value) => [value, "Leads"]}
                labelFormatter={(s) =>
                  LEAD_STATUS_CONFIG[s as LeadStatus]?.label ?? s
                }
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {data.pipeline
                  .filter((p) => p.status !== "lost" && p.status !== "stalled")
                  .map((entry) => (
                    <Cell
                      key={entry.status}
                      fill={STAGE_COLORS[entry.status] || "#94a3b8"}
                    />
                  ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Leads over time */}
        <div className="border rounded-lg p-4 bg-card">
          <h2 className="font-semibold mb-3">New Leads Over Time</h2>
          {data.leadsOverTime.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.leadsOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(d) => {
                    const dt = new Date(d);
                    return `${dt.getMonth() + 1}/${dt.getDate()}`;
                  }}
                />
                <YAxis allowDecimals={false} />
                <Tooltip
                  labelFormatter={(d) =>
                    new Date(d).toLocaleDateString()
                  }
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#60a5fa"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-16">
              No lead data for this period
            </p>
          )}
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Won deals over time */}
        <div className="border rounded-lg p-4 bg-card">
          <h2 className="font-semibold mb-3">Won Revenue (Weekly)</h2>
          {data.wonsOverTime.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.wonsOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(w) => {
                    const dt = new Date(w);
                    return `${dt.getMonth() + 1}/${dt.getDate()}`;
                  }}
                />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value) => [fmtCurrency(Number(value)), "Revenue"]}
                  labelFormatter={(w) =>
                    `Week of ${new Date(w).toLocaleDateString()}`
                  }
                />
                <Bar dataKey="value" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-16">
              No won deals for this period
            </p>
          )}
        </div>

        {/* Avg time in stage */}
        <div className="border rounded-lg p-4 bg-card">
          <h2 className="font-semibold mb-3">Avg Days in Stage</h2>
          {data.stageTimes.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.stageTimes} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" unit=" d" />
                <YAxis
                  type="category"
                  dataKey="status"
                  width={90}
                  tickFormatter={(s) =>
                    LEAD_STATUS_CONFIG[s as LeadStatus]?.label ?? s
                  }
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value) => [`${value} days`, "Avg Time"]}
                  labelFormatter={(s) =>
                    LEAD_STATUS_CONFIG[s as LeadStatus]?.label ?? s
                  }
                />
                <Bar dataKey="avgDays" fill="#a78bfa" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-16">
              No stage time data yet
            </p>
          )}
        </div>
      </div>

      {/* Source Performance Table */}
      {data.sourcePerformance.length > 0 && (
        <div className="border rounded-lg p-4 bg-card">
          <h2 className="font-semibold mb-3">Lead Source Performance</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b">
                  <th className="py-2 pr-4">Source</th>
                  <th className="py-2 pr-4 text-right">Leads</th>
                  <th className="py-2 pr-4 text-right">Won</th>
                  <th className="py-2 pr-4 text-right">Conv %</th>
                  <th className="py-2 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.sourcePerformance.map((source) => (
                  <tr key={source.name} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{source.name}</td>
                    <td className="py-2 pr-4 text-right">{source.total}</td>
                    <td className="py-2 pr-4 text-right">{source.won}</td>
                    <td className="py-2 pr-4 text-right">{source.conversionRate}%</td>
                    <td className="py-2 text-right font-medium">
                      {fmtCurrency(source.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rep Leaderboard */}
      {data.repLeaderboard.length > 0 && (
        <div className="border rounded-lg p-4 bg-card">
          <h2 className="font-semibold mb-3">Rep Leaderboard</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b">
                  <th className="py-2 pr-4">Rep</th>
                  <th className="py-2 pr-4">Territory</th>
                  <th className="py-2 pr-4 text-right">Leads</th>
                  <th className="py-2 pr-4 text-right">Won</th>
                  <th className="py-2 pr-4 text-right">Conv %</th>
                  <th className="py-2 pr-4 text-right">Revenue</th>
                  <th className="py-2 text-right">MRR</th>
                </tr>
              </thead>
              <tbody>
                {data.repLeaderboard.map((rep, i) => (
                  <tr key={rep.name} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">
                      {i === 0 && rep.wonDeals > 0 ? "🏆 " : ""}
                      {rep.name}
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {rep.territory}
                    </td>
                    <td className="py-2 pr-4 text-right">{rep.totalLeads}</td>
                    <td className="py-2 pr-4 text-right">{rep.wonDeals}</td>
                    <td className="py-2 pr-4 text-right">{rep.conversionRate}%</td>
                    <td className="py-2 pr-4 text-right font-medium">
                      {fmtCurrency(rep.revenue)}
                    </td>
                    <td className="py-2 text-right font-medium text-blue-600">
                      {fmtCurrency(rep.mrr)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
