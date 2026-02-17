import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";
import {
  RevenueTrendChart,
  ClientHealthChart,
  SalesRepPerformanceChart,
  TerritoryComparisonChart,
  TaskCompletionTrendChart,
  ServiceMixChart,
} from "@/components/analytics/advanced-charts";

export default async function AnalyticsPage() {
  await requirePermission("view_analytics");

  // Fetch analytics data
  const [leads, clients, tasks, scans, opportunities] = await Promise.all([
    prisma.lead.findMany({
      select: {
        id: true,
        status: true,
        createdAt: true,
        leadSource: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.clientProfile.findMany({
      select: {
        id: true,
        retainerAmount: true,
        healthScore: true,
        status: true,
        onboardedAt: true,
        lead: {
          select: {
            createdAt: true,
            status: true,
          },
        },
      },
    }),
    prisma.clientTask.findMany({
      select: {
        id: true,
        status: true,
        createdAt: true,
        deployedAt: true,
        measuredAt: true,
      },
    }),
    prisma.competitiveScan.findMany({
      select: {
        id: true,
        scanDate: true,
        healthScore: true,
        clientId: true,
      },
      orderBy: { scanDate: "desc" },
      take: 1000,
    }),
    prisma.upsellOpportunity.findMany({
      select: {
        id: true,
        status: true,
        opportunityScore: true,
        projectedMrr: true,
        detectedAt: true,
        presentedAt: true,
      },
    }),
  ]);

  // Serialize data with proper Decimal handling
  const serialized = {
    leads: JSON.parse(JSON.stringify(leads)),
    clients: JSON.parse(JSON.stringify(clients)),
    tasks: JSON.parse(JSON.stringify(tasks)),
    scans: JSON.parse(JSON.stringify(scans)),
    opportunities: opportunities.map(opp => ({
      ...opp,
      projectedMrr: opp.projectedMrr ? Number(opp.projectedMrr) : null,
    })),
  };

  // Sample data for advanced charts (in production, calculate from real data)
  const revenueData = Array.from({ length: 12 }, (_, i) => ({
    month: new Date(2024, i).toLocaleDateString('en-US', { month: 'short' }),
    mrr: 20000 + (i * 2500) + Math.random() * 3000,
  }));

  const healthData = [
    { category: 'Excellent (80-100)', count: clients.filter(c => c.healthScore >= 80).length },
    { category: 'Good (60-79)', count: clients.filter(c => c.healthScore >= 60 && c.healthScore < 80).length },
    { category: 'Fair (40-59)', count: clients.filter(c => c.healthScore >= 40 && c.healthScore < 60).length },
    { category: 'Poor (<40)', count: clients.filter(c => c.healthScore < 40).length },
  ].filter(d => d.count > 0);

  const repData = [
    { name: 'Sarah J', revenue: 125000, deals: 12 },
    { name: 'Mike T', revenue: 98000, deals: 9 },
    { name: 'Alex R', revenue: 87000, deals: 8 },
    { name: 'Jordan K', revenue: 76000, deals: 7 },
  ];

  const territoryData = [
    { metric: 'Revenue', territoryA: 85, territoryB: 92 },
    { metric: 'Deals Closed', territoryA: 78, territoryB: 65 },
    { metric: 'Client Retention', territoryA: 95, territoryB: 88 },
    { metric: 'Avg Deal Size', territoryA: 70, territoryB: 82 },
    { metric: 'Pipeline Health', territoryA: 82, territoryB: 75 },
  ];

  const taskTrendData = Array.from({ length: 12 }, (_, i) => ({
    week: `W${i + 1}`,
    completed: Math.floor(15 + Math.random() * 10),
    created: Math.floor(12 + Math.random() * 8),
    pending: Math.floor(8 + Math.random() * 5),
  }));

  const serviceMixData = Array.from({ length: 6 }, (_, i) => ({
    month: new Date(2024, i).toLocaleDateString('en-US', { month: 'short' }),
    seo: Math.floor(15000 + Math.random() * 5000),
    ppc: Math.floor(8000 + Math.random() * 3000),
    social: Math.floor(5000 + Math.random() * 2000),
    content: Math.floor(6000 + Math.random() * 2500),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Business Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Revenue performance, pipeline health, and growth forecasting at a glance
        </p>
      </div>

      <AnalyticsDashboard data={serialized} />

      {/* Advanced Analytics Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Advanced Insights</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Deep dive into revenue trends, team performance, and service analytics
          </p>
        </div>

        {/* Row 1: Revenue & Health */}
        <div className="grid md:grid-cols-2 gap-6">
          <RevenueTrendChart data={revenueData} />
          <ClientHealthChart data={healthData} />
        </div>

        {/* Row 2: Sales & Territory */}
        <div className="grid md:grid-cols-2 gap-6">
          <SalesRepPerformanceChart data={repData} />
          <TerritoryComparisonChart data={territoryData} />
        </div>

        {/* Row 3: Tasks & Services */}
        <div className="grid md:grid-cols-2 gap-6">
          <TaskCompletionTrendChart data={taskTrendData} />
          <ServiceMixChart data={serviceMixData} />
        </div>
      </div>
    </div>
  );
}
