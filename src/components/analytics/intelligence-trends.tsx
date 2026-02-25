"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { CHART_FALLBACKS } from "@/hooks/use-chart-colors";
import type { MonthlyTrendPoint } from "@/lib/analytics/intelligence";

type Props = {
  trend: MonthlyTrendPoint[];
};

function formatMrr(value: number | undefined) {
  if (value == null) return "";
  return `$${value.toLocaleString()}`;
}

export function IntelligenceTrends({ trend }: Props) {
  // Filter out months where we have no data at all (all zeros — pre-launch)
  const activeTrend = trend.filter(
    (p) => p.mrr > 0 || p.activeClients > 0 || p.newClients > 0
  );

  // Fall back to full trend if all months have data
  const display = activeTrend.length >= 2 ? activeTrend : trend;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Business Intelligence</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Month-over-month revenue, client count, and health score trends
        </p>
      </div>

      {/* MRR Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue Trend — MRR</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={display}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-40" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={formatMrr} />
              <Line
                type="monotone"
                dataKey="mrr"
                stroke={CHART_FALLBACKS[0]}
                strokeWidth={2}
                dot={{ r: 3 }}
                name="MRR"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Client Count Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={display}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-40" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="activeClients"
                  stroke={CHART_FALLBACKS[1]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Active Clients"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* New Closes + Churn */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New Clients vs. Churn</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={display}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-40" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="newClients" fill={CHART_FALLBACKS[0]} name="New" radius={[3, 3, 0, 0]} />
                <Bar dataKey="churnedClients" fill={CHART_FALLBACKS[3]} name="Churned" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Avg Health Score Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Average Health Score Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {display.every((p) => p.avgHealthScore === null) ? (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
              No competitive scan data yet — health scores will appear once scans run.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={display}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-40" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="avgHealthScore"
                  stroke={CHART_FALLBACKS[1]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Avg Health Score"
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
