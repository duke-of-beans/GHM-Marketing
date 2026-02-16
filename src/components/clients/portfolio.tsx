"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MetricCard, formatCurrency } from "@/components/dashboard/metric-card";

type ClientItem = {
  id: number;
  businessName: string;
  retainerAmount: string | number;
  healthScore: number;
  scanFrequency: string;
  status: string;
  onboardedAt: string;
  lastScanAt: string | null;
  nextScanAt: string | null;
  lead: {
    businessName: string;
    phone: string;
    city: string;
    state: string;
    website: string | null;
  };
  tasks: { id: number }[];
  competitors: { id: number }[];
  domains: { id: number; domain: string; type: string }[];
};

type PortfolioStats = {
  total: number;
  avgHealth: number;
  needsAttention: number;
  totalRevenue: number;
};

function healthColor(score: number): string {
  if (score >= 75) return "bg-green-100 text-green-800 border-green-200";
  if (score >= 50) return "bg-yellow-100 text-yellow-800 border-yellow-200";
  return "bg-red-100 text-red-800 border-red-200";
}

function healthLabel(score: number): string {
  if (score >= 75) return "Healthy";
  if (score >= 50) return "Competitive";
  return "Needs Attention";
}

function daysAgo(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

export function ClientPortfolio({
  clients,
  stats,
}: {
  clients: ClientItem[];
  stats: PortfolioStats;
}) {
  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard title="Active Clients" value={stats.total} />
        <MetricCard
          title="Avg Health"
          value={stats.avgHealth}
          subtitle={healthLabel(stats.avgHealth)}
        />
        <MetricCard
          title="Needs Attention"
          value={stats.needsAttention}
          className={
            stats.needsAttention > 0
              ? "[&_p.text-2xl]:text-red-600 [&_p.text-3xl]:text-red-600"
              : ""
          }
        />
        <MetricCard
          title="Monthly Revenue"
          value={formatCurrency(stats.totalRevenue)}
        />
      </div>

      {/* Client cards */}
      {clients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No active clients yet. Clients are created automatically when leads
              are marked as &ldquo;won&rdquo; in the sales pipeline.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Link
              key={client.id}
              href={`/clients/${client.id}`}
              className="block"
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="text-base truncate">
                        {client.businessName}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {client.lead.city}, {client.lead.state}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`shrink-0 ${healthColor(client.healthScore)}`}
                    >
                      {client.healthScore}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Quick metrics */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-semibold">
                        {client.tasks.length}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                        Open Tasks
                      </p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold">
                        {client.domains.length}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                        Domains
                      </p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold">
                        {client.competitors.length}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                        Competitors
                      </p>
                    </div>
                  </div>

                  {/* Footer info */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-2">
                    <span>{formatCurrency(Number(client.retainerAmount))}/mo</span>
                    <span>Scanned {daysAgo(client.lastScanAt)}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
