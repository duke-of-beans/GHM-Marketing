"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip as InfoTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
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

import { CHART_FALLBACKS } from "@/hooks/use-chart-colors";
const COLORS = [...CHART_FALLBACKS];

export function AnalyticsDashboard({ data }: { data: AnalyticsData }) {
  const metrics = useMemo(() => calculateMetrics(data), [data]);

  return (
    <TooltipProvider>
      <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Monthly Recurring Revenue
              </CardTitle>
              <InfoTooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    Total monthly recurring revenue from active client retainers. ARR (Annual Recurring Revenue) = MRR × 12.
                  </p>
                </TooltipContent>
              </InfoTooltip>
            </div>
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
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                MRR Growth Rate
              </CardTitle>
              <InfoTooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    Month-over-month growth in recurring revenue. Healthy SaaS businesses target 10-20% monthly growth.
                  </p>
                </TooltipContent>
              </InfoTooltip>
            </div>
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
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Lead → Client Rate
              </CardTitle>
              <InfoTooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    Percentage of leads that become paying clients. Industry average is 15-25%. Higher rates indicate better qualification or sales process.
                  </p>
                </TooltipContent>
              </InfoTooltip>
            </div>
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
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Average Client Value
              </CardTitle>
              <InfoTooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    Estimated annual value per client (MRR × 12 ÷ active clients). Higher values indicate premium service positioning or successful additional service adoption.
                  </p>
                </TooltipContent>
              </InfoTooltip>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.avgClientValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Annual value estimate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Forecast */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Forecast: Where We&apos;re Heading</CardTitle>
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
                stroke={COLORS[0]}
                strokeWidth={2}
                name="Actual MRR"
              />
              <Line
                type="monotone"
                dataKey="projected"
                stroke={COLORS[1]}
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
            <CardTitle>Pipeline Stages: Active Lead Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.funnel}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill={COLORS[0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Lead Sources */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Sources: Where Your Best Prospects Come From</CardTitle>
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
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Health Score
              </CardTitle>
              <InfoTooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    Composite score (0–100) based on competitive position, ranking trends, and scan results. 75+ = healthy, 50–74 = competitive, &lt;50 = needs attention.
                  </p>
                </TooltipContent>
              </InfoTooltip>
            </div>
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
              Additional Services Pipeline
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
    </TooltipProvider>
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

  // Conversion funnel — uses actual lead statuses
  const available = leads.filter((l) => l.status === "available").length;
  const scheduled = leads.filter((l) => l.status === "scheduled").length;
  const contacted = leads.filter((l) => l.status === "contacted").length;
  const followUp = leads.filter((l) => l.status === "follow_up").length;
  const paperwork = leads.filter((l) => l.status === "paperwork").length;
  const won = leads.filter((l) => l.status === "won").length;

  const funnel = [
    { stage: "Available", count: available },
    { stage: "Scheduled", count: scheduled },
    { stage: "Contacted", count: contacted },
    { stage: "Follow Up", count: followUp },
    { stage: "Paperwork", count: paperwork },
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
