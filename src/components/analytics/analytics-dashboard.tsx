"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type AnalyticsData = {
  leads: any[];
  clients: any[];
  tasks: any[];
  scans: any[];
  opportunities: any[];
};

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

export function AnalyticsDashboard({ data }: { data: AnalyticsData }) {
  const metrics = useMemo(() => calculateMetrics(data), [data]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Recurring Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.mrr.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              ARR: ${metrics.arr.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              MRR Growth Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.mrrGrowth.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.mrrGrowth > 0 ? "↑ Positive growth" : "→ Flat"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Lead → Client Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.totalLeads} leads → {metrics.totalClients} clients
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Client Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.avgClientValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Lifetime value estimate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Forecast */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Forecast (Next 6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics.forecast}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value}`} />
              <Legend />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#10b981"
                strokeWidth={2}
                name="Actual MRR"
              />
              <Line
                type="monotone"
                dataKey="projected"
                stroke="#3b82f6"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Projected MRR"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.funnel}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Lead Sources */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={metrics.sources}
                  dataKey="count"
                  nameKey="source"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {metrics.sources.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Task Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Task Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.taskCompletionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.completedTasks} / {metrics.totalTasks} tasks completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Health Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgHealthScore.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {metrics.totalClients} active clients
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Upsell Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.upsellPipeline.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.activeOpportunities} active opportunities
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function calculateMetrics(data: AnalyticsData) {
  const { leads, clients, tasks, scans, opportunities } = data;

  // Current MRR
  const activeClients = clients.filter((c) => c.status === "active");
  const mrr = activeClients.reduce((sum, c) => sum + Number(c.retainerAmount || 0), 0);
  const arr = mrr * 12;

  // MRR Growth (simplified - compare last month to current)
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const clientsLastMonth = clients.filter(
    (c) => new Date(c.onboardedAt) <= lastMonth && c.status === "active"
  );
  const mrrLastMonth = clientsLastMonth.reduce(
    (sum, c) => sum + Number(c.retainerAmount || 0),
    0
  );
  const mrrGrowth = mrrLastMonth > 0 ? ((mrr - mrrLastMonth) / mrrLastMonth) * 100 : 0;

  // Conversion metrics
  const totalLeads = leads.length;
  const totalClients = clients.length;
  const conversionRate = totalLeads > 0 ? (totalClients / totalLeads) * 100 : 0;

  // Average client value (LTV estimate: MRR * 12 months)
  const avgClientValue = totalClients > 0 ? (mrr * 12) / totalClients : 0;

  // Revenue forecast (next 6 months)
  const forecast = [];
  const monthlyGrowthRate = mrrGrowth / 100 || 0.05; // Default 5% if no data
  
  for (let i = -3; i <= 6; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const monthName = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    
    if (i <= 0) {
      // Actual data (simplified)
      forecast.push({
        month: monthName,
        actual: mrr * (1 + monthlyGrowthRate * i),
        projected: null,
      });
    } else {
      // Projected data
      forecast.push({
        month: monthName,
        actual: null,
        projected: mrr * Math.pow(1 + monthlyGrowthRate, i),
      });
    }
  }

  // Conversion funnel
  const newLeads = leads.filter((l) => l.status === "new").length;
  const qualified = leads.filter((l) => l.status === "qualified").length;
  const contacted = leads.filter((l) => l.status === "contacted").length;
  const won = clients.length;

  const funnel = [
    { stage: "New Leads", count: newLeads },
    { stage: "Qualified", count: qualified },
    { stage: "Contacted", count: contacted },
    { stage: "Won", count: won },
  ];

  // Lead sources
  const sourceMap = new Map<string, number>();
  leads.forEach((l) => {
    const source = l.leadSource?.name || "unknown";
    sourceMap.set(source, (sourceMap.get(source) || 0) + 1);
  });
  const sources = Array.from(sourceMap.entries()).map(([source, count]) => ({
    source,
    count,
  }));

  // Task metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(
    (t) => t.status === "deployed" || t.status === "measured"
  ).length;
  const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Health score average
  const avgHealthScore =
    activeClients.length > 0
      ? activeClients.reduce((sum, c) => sum + (c.healthScore || 0), 0) / activeClients.length
      : 0;

  // Upsell metrics
  const activeOpportunities = opportunities.filter(
    (o) => o.status === "detected" || o.status === "presented"
  ).length;
  const upsellPipeline = opportunities
    .filter((o) => o.status === "detected" || o.status === "presented")
    .reduce((sum, o) => sum + Number(o.projectedMrr || 0), 0);

  return {
    mrr,
    arr,
    mrrGrowth,
    conversionRate,
    totalLeads,
    totalClients,
    avgClientValue,
    forecast,
    funnel,
    sources,
    totalTasks,
    completedTasks,
    taskCompletionRate,
    avgHealthScore,
    activeOpportunities,
    upsellPipeline,
  };
}
