"use client";

// AffiliateDashboardClient — client wrapper for the affiliate dashboard page.
// Sprint 41

import { MetricCard, formatCurrency } from "@/components/dashboard/metric-card";
import { AffiliateWidgetPanel } from "@/components/dashboard/affiliate-widgets";
import { formatMetric } from "@/lib/format";

type Props = {
  companyName: string;
  totalSites: number;
  activeSites: number;
  portfolioMRR: number;
  portfolioValue: number;
  sites: any[];
  revenueEntries: any[];
  networks: any[];
  briefs: any[];
  valuations: any[];
};

export function AffiliateDashboardClient({
  companyName,
  totalSites,
  activeSites,
  portfolioMRR,
  portfolioValue,
  sites,
  revenueEntries,
  networks,
  briefs,
  valuations,
}: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Dashboard</h1>
        <p className="text-sm text-muted-foreground">{companyName}</p>
      </div>

      {/* Metrics row — 4 tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <MetricCard title="Total Sites" value={formatMetric(totalSites)} />
        <MetricCard title="Active Sites" value={formatMetric(activeSites)} />
        <MetricCard title="Portfolio MRR" value={formatCurrency(portfolioMRR)} />
        <MetricCard title="Portfolio Value" value={formatCurrency(portfolioValue)} />
      </div>

      {/* Widget panel */}
      <AffiliateWidgetPanel
        sites={sites}
        revenueEntries={revenueEntries}
        networks={networks}
        briefs={briefs}
        valuations={valuations}
      />
    </div>
  );
}