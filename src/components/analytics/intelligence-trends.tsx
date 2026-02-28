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
import { CHART_COLORS, CHART_GRID_COLOR, CHART_AXIS_COLOR, CHART_TOOLTIP_BG, CHART_TOOLTIP_BORDER } from "@/lib/chart-tokens";
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
        <h2 className="text-2xl font-semibold">Business Intelligence</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Month-over-month revenue, client count, and health score trends
        </p>
      </div>

      {/* MRR Trend */}
      <Card data-tour="analytics-revenue-chart">
        <CardHeader>
          <CardTitle className="text-sm">Revenue Trend — MRR</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={display}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_COLOR} className="opacity-40" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: CHART_AXIS_COLOR }} />
              <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: CHART_AXIS_COLOR }} />
              <Tooltip formatter={formatMrr} contentStyle={{ background: CHART_TOOLTIP_BG, border: `1px solid ${CHART_TOOLTIP_BORDER}` }} />
              <Line
                type="monotone"
                dataKey="mrr"
                stroke={CHART_COLORS.revenue}
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
        <Card data-tour="analytics-client-chart">
          <CardHeader>
            <CardTitle className="text-sm">Active Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={display}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_COLOR} className="opacity-40" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: CHART_AXIS_COLOR }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: CHART_AXIS_COLOR }} />
                <Tooltip contentStyle={{ background: CHART_TOOLTIP_BG, border: `1px solid ${CHART_TOOLTIP_BORDER}` }} />
                <Line
                  type="monotone"
                  dataKey="activeClients"
                  stroke={CHART_COLORS.clients}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Active Clients"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* New Closes + Churn */}
        <Card data-tour="analytics-churn-panel">
          <CardHeader>
            <CardTitle className="text-sm">New Clients vs. Churn</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={display}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_COLOR} className="opacity-40" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: CHART_AXIS_COLOR }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: CHART_AXIS_COLOR }} />
                <Tooltip contentStyle={{ background: CHART_TOOLTIP_BG, border: `1px solid ${CHART_TOOLTIP_BORDER}` }} />
                <Legend />
                <Bar dataKey="newClients" fill={CHART_COLORS.new} name="New" radius={[3, 3, 0, 0]} />
                <Bar dataKey="churnedClients" fill={CHART_COLORS.churn} name="Churned" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Avg Health Score Trend */}
      <Card data-tour="analytics-health-sparklines">
        <CardHeader>
          <CardTitle className="text-sm">Average Health Score Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {display.every((p) => p.avgHealthScore === null) ? (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
              No competitive scan data yet — health scores will appear once scans run.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={display}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_COLOR} className="opacity-40" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: CHART_AXIS_COLOR }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: CHART_AXIS_COLOR }} />
                <Tooltip contentStyle={{ background: CHART_TOOLTIP_BG, border: `1px solid ${CHART_TOOLTIP_BORDER}` }} />
                <Line
                  type="monotone"
                  dataKey="avgHealthScore"
                  stroke={CHART_COLORS.health}
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
