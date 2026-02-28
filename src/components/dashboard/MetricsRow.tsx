"use client";

import { MetricCard, formatCurrency } from "@/components/dashboard/metric-card";
import { formatMetric } from "@/lib/format";

type Props = {
  totalLeads: number;
  activeLeads: number;
  conversionRate: number;
  wonDeals: number;
  totalMRR: number;
  totalARR: number;
};

export function MetricsRow({ totalLeads, activeLeads, conversionRate, wonDeals, totalMRR, totalARR }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 h-full content-start">
      <MetricCard
        title="Total Leads"
        value={formatMetric(totalLeads)}
        tooltip="Total number of leads in the system across all territories and statuses."
      />
      <MetricCard
        title="Active Pipeline"
        value={formatMetric(activeLeads)}
        subtitle={`${conversionRate}% conversion`}
        tooltip="Leads currently in active sales stages. Conversion = Won / (Won + Lost)."
      />
      <MetricCard
        title="Won Deals"
        value={formatMetric(wonDeals)}
        className="[&_p.text-2xl]:text-status-success [&_p.text-3xl]:text-status-success"
        tooltip="Successfully closed deals that converted to active clients."
      />
      <MetricCard
        title="MRR"
        value={formatCurrency(totalMRR)}
        subtitle={`ARR ${formatCurrency(totalARR)}`}
        tooltip="Monthly Recurring Revenue. ARR = MRR × 12."
      />
    </div>
  );
}
