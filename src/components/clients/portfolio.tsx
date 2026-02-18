"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MetricCard, formatCurrency } from "@/components/dashboard/metric-card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle, Plus } from "lucide-react";
import { AddClientDialog } from "./add-client-dialog";
import { ClientFilterBar, type FilterState } from "./client-filter-bar";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    healthFilter: "all",
    revenueRange: "all",
    taskFilter: "all",
    scanFilter: "all",
    sortBy: "health-low",
  });

  const filteredClients = useMemo(() => {
    let result = clients;

    // Search filter
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (client) =>
          client.businessName.toLowerCase().includes(q) ||
          client.lead.city.toLowerCase().includes(q) ||
          client.lead.state.toLowerCase().includes(q)
      );
    }

    // Health filter
    if (filters.healthFilter !== "all") {
      result = result.filter((client) => {
        if (filters.healthFilter === "healthy") return client.healthScore >= 75;
        if (filters.healthFilter === "competitive")
          return client.healthScore >= 50 && client.healthScore < 75;
        if (filters.healthFilter === "attention") return client.healthScore < 50;
        return true;
      });
    }

    // Revenue range filter
    if (filters.revenueRange !== "all") {
      result = result.filter((client) => {
        const revenue = Number(client.retainerAmount);
        if (filters.revenueRange === "high") return revenue >= 2000;
        if (filters.revenueRange === "mid")
          return revenue >= 1000 && revenue < 2000;
        if (filters.revenueRange === "low") return revenue < 1000;
        return true;
      });
    }

    // Task filter
    if (filters.taskFilter !== "all") {
      result = result.filter((client) => {
        if (filters.taskFilter === "has-tasks") return client.tasks.length > 0;
        if (filters.taskFilter === "no-tasks") return client.tasks.length === 0;
        return true;
      });
    }

    // Scan filter
    if (filters.scanFilter !== "all") {
      result = result.filter((client) => {
        if (!client.lastScanAt) return filters.scanFilter === "needs-scan";
        const daysSince = Math.floor(
          (Date.now() - new Date(client.lastScanAt).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        if (filters.scanFilter === "recent") return daysSince < 7;
        if (filters.scanFilter === "needs-scan") return daysSince >= 7;
        return true;
      });
    }

    // Sorting
    if (filters.sortBy === "health-low") {
      result = [...result].sort((a, b) => a.healthScore - b.healthScore);
    } else if (filters.sortBy === "health-high") {
      result = [...result].sort((a, b) => b.healthScore - a.healthScore);
    } else if (filters.sortBy === "revenue-high") {
      result = [...result].sort(
        (a, b) => Number(b.retainerAmount) - Number(a.retainerAmount)
      );
    } else if (filters.sortBy === "revenue-low") {
      result = [...result].sort(
        (a, b) => Number(a.retainerAmount) - Number(b.retainerAmount)
      );
    } else if (filters.sortBy === "name-az") {
      result = [...result].sort((a, b) =>
        a.businessName.localeCompare(b.businessName)
      );
    } else if (filters.sortBy === "name-za") {
      result = [...result].sort((a, b) =>
        b.businessName.localeCompare(a.businessName)
      );
    } else if (filters.sortBy === "newest") {
      result = [...result].sort(
        (a, b) => new Date(b.onboardedAt).getTime() - new Date(a.onboardedAt).getTime()
      );
    } else if (filters.sortBy === "oldest") {
      result = [...result].sort(
        (a, b) => new Date(a.onboardedAt).getTime() - new Date(b.onboardedAt).getTime()
      );
    } else if (filters.sortBy === "scan-recent") {
      result = [...result].sort((a, b) => {
        const aTime = a.lastScanAt ? new Date(a.lastScanAt).getTime() : 0;
        const bTime = b.lastScanAt ? new Date(b.lastScanAt).getTime() : 0;
        return bTime - aTime;
      });
    }

    return result;
  }, [clients, filters]);

  const handleClientAdded = () => {
    router.refresh();
  };

  return (
    <TooltipProvider>
      <div className="space-y-6 pb-20 md:pb-0">
        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard title="Active Clients" value={stats.total} />
          <div className="relative">
            <MetricCard
              title="Avg Health"
              value={stats.avgHealth}
              subtitle={healthLabel(stats.avgHealth)}
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help absolute top-2 right-2" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">
                  Composite score (0–100) based on competitive position, ranking trends, and scan results. 75+ = healthy, 50–74 = competitive, &lt;50 = needs attention.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
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

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {filteredClients.length} {filteredClients.length === 1 ? "Client" : "Clients"}
            {filteredClients.length !== clients.length && (
              <span className="text-sm text-muted-foreground font-normal">
                {" "}
                of {clients.length} total
              </span>
            )}
          </h3>
          <p className="text-sm text-muted-foreground">
            Manage client portfolio and track performance
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add Client
        </Button>
      </div>

      {/* Filter Bar */}
      <ClientFilterBar filters={filters} onChange={setFilters} />

      {/* Client cards */}
      {filteredClients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            {clients.length === 0 ? (
              <p className="text-muted-foreground">
                No active clients yet. Clients are created automatically when leads
                are marked as &ldquo;won&rdquo; in the sales pipeline.
              </p>
            ) : (
              <p className="text-muted-foreground">
                No clients match your filters. Try adjusting your search criteria.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => (
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

      {/* Add Client Dialog */}
      <AddClientDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={handleClientAdded}
      />
    </div>
    </TooltipProvider>
  );
}
