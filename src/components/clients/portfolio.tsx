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
import { HelpCircle, Plus, LayoutGrid, List, AlertTriangle, Upload, CheckSquare, ChevronDown, Download, Users, Search } from "lucide-react";
import { AddClientDialog } from "./add-client-dialog";
import { ChurnRiskBadge, computeClientChurnRisk } from "./churn-risk-badge";
import { HealthSparkline } from "./health-sparkline";
import { ClientFilterBar, DEFAULT_CLIENT_FILTERS, type FilterState } from "./client-filter-bar";
import { useRouter } from "next/navigation";
import { useBulkSelect } from "@/hooks/use-bulk-select";
import { BulkActionBar } from "@/components/bulk/bulk-action-bar";
import { ClientImportDialog } from "@/components/bulk/import-dialogs";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ClientItem = {
  id: number;
  businessName: string;
  retainerAmount: string | number;
  healthScore: number;
  scanFrequency: string;
  status: string;
  paymentStatus: string | null;
  onboardedAt: string;
  lastScanAt: string | null;
  nextScanAt: string | null;
  googleAdsConnection: { isActive: boolean } | null;
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

function isScanOverdue(client: ClientItem): boolean {
  if (!client.lastScanAt) return true;
  const daysSince = Math.floor(
    (Date.now() - new Date(client.lastScanAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  const threshold =
    client.scanFrequency === "weekly" ? 7 : client.scanFrequency === "monthly" ? 30 : 14;
  return daysSince > threshold;
}

function paymentBadgeClass(status: string | null): string {
  if (!status || status === "current") return "bg-green-100 text-green-800 border-green-200";
  if (status === "overdue_7")  return "bg-yellow-100 text-yellow-800 border-yellow-200";
  if (status === "overdue_15") return "bg-orange-100 text-orange-800 border-orange-200";
  if (status === "overdue_30") return "bg-red-100 text-red-800 border-red-200";
  return "bg-muted text-muted-foreground";
}

function paymentLabel(status: string | null): string {
  if (!status || status === "current") return "Current";
  if (status === "overdue_7")  return "7d late";
  if (status === "overdue_15") return "15d late";
  if (status === "overdue_30") return "30d+ late";
  return status;
}

function healthDot(score: number): string {
  if (score >= 75) return "bg-green-500";
  if (score >= 50) return "bg-yellow-500";
  return "bg-red-500";
}

export function ClientPortfolio({
  clients,
  stats,
  sparklines: sparklinesObj,
}: {
  clients: ClientItem[];
  stats: PortfolioStats;
  sparklines?: Record<string, { path: string | null; delta: number | null }>;
}) {
  const sparklines = sparklinesObj ?? {};
  const router = useRouter();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [filters, setFilters] = useState<FilterState>(DEFAULT_CLIENT_FILTERS);

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

  const bulk = useBulkSelect(filteredClients);

  const bulkActions = [
    {
      label: "Trigger Scans",
      run: async (ids: number[]) => {
        const res = await fetch("/api/bulk/clients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids, operation: "scan" }) });
        return res.json();
      },
    },
    {
      label: "Generate Reports",
      run: async (ids: number[]) => {
        const res = await fetch("/api/bulk/clients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids, operation: "report", params: { send: false } }) });
        return res.json();
      },
    },
    {
      label: "Send Reports",
      run: async (ids: number[]) => {
        const res = await fetch("/api/bulk/clients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids, operation: "report", params: { send: true } }) });
        return res.json();
      },
    },
    {
      label: "Set Active",
      run: async (ids: number[]) => {
        const res = await fetch("/api/bulk/clients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids, operation: "status", params: { status: "active" } }) });
        return res.json();
      },
    },
    {
      label: "Set Paused",
      run: async (ids: number[]) => {
        const res = await fetch("/api/bulk/clients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids, operation: "status", params: { status: "paused" } }) });
        return res.json();
      },
    },
  ];

  const handleClientAdded = () => {
    router.refresh();
  };

  const handleExport = (statusFilter: "active" | "all") => {
    const url = `/api/export/clients?status=${statusFilter}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = "";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
              <TooltipContent className="max-w-sm space-y-2 p-3">
                <p className="text-sm font-semibold">Health Score — how it works</p>
                <div className="text-xs space-y-1.5 text-muted-foreground">
                  <p>Composite score (0–100) updated each time a competitive scan runs.</p>
                  <div className="space-y-1 border-t pt-1.5">
                    <p><span className="font-medium text-foreground">Momentum (25%)</span> — DR, reviews, and rankings vs. last scan</p>
                    <p><span className="font-medium text-foreground">Competitive position (20%)</span> — average gap vs. tracked competitors</p>
                    <p><span className="font-medium text-foreground">Domain authority (20%)</span> — Ahrefs Domain Rating (DR 50+ scores well)</p>
                    <p><span className="font-medium text-foreground">Reviews (20%)</span> — count (200+ ideal) and average rating (4.5+)</p>
                    <p><span className="font-medium text-foreground">Site speed (15%)</span> — PageSpeed score, mobile-weighted</p>
                  </div>
                  <div className="border-t pt-1.5">
                    <p><span className="text-green-600 font-medium">75+</span> healthy · <span className="text-yellow-600 font-medium">50–74</span> competitive · <span className="text-red-600 font-medium">&lt;50</span> needs attention</p>
                  </div>
                </div>
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
        <Button variant="outline" onClick={() => setIsImportOpen(true)}>
          <Upload className="h-4 w-4 mr-1" />
          Import
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-1" />
              Export
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Export Clients</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleExport("active")}>
              Active clients (CSV)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("all")}>
              All clients — full DB (CSV)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {viewMode === "table" && filteredClients.length > 0 && (
          <Button variant="outline" size="sm" onClick={bulk.toggleAll} className="gap-1.5">
            <CheckSquare className="h-4 w-4" />
            {bulk.allSelected ? "Deselect All" : `Select All (${filteredClients.length})`}
          </Button>
        )}
        <div className="flex items-center border rounded-md overflow-hidden">
          <button
            onClick={() => setViewMode("cards")}
            className={`p-1.5 transition-colors ${viewMode === "cards" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            title="Card view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`p-1.5 transition-colors ${viewMode === "table" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            title="Table view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <ClientFilterBar filters={filters} onChange={setFilters} />

      {/* Health Status Summary */}
      {clients.length > 0 && (() => {
        const healthy = clients.filter(c => c.healthScore >= 75).length;
        const competitive = clients.filter(c => c.healthScore >= 50 && c.healthScore < 75).length;
        const attention = clients.filter(c => c.healthScore < 50).length;
        const scanOverdue = clients.filter(isScanOverdue).length;
        const paymentIssues = clients.filter(c => c.paymentStatus && c.paymentStatus !== "current").length;
        return (
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-800 border border-green-200 font-medium">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              {healthy} Healthy
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200 font-medium">
              <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />
              {competitive} Competitive
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 text-red-800 border border-red-200 font-medium">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
              {attention} Needs Attention
            </span>
            {scanOverdue > 0 && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-100 text-orange-800 border border-orange-200 font-medium">
                <AlertTriangle className="w-3 h-3" />
                {scanOverdue} Scan Overdue
              </span>
            )}
            {paymentIssues > 0 && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 text-red-800 border border-red-200 font-medium">
                <AlertTriangle className="w-3 h-3" />
                {paymentIssues} Payment Issues
              </span>
            )}
          </div>
        );
      })()}

      {filteredClients.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            {clients.length === 0 ? (
              <>
                <Users className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-base font-medium">No clients yet</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                  Clients are created automatically when a lead is marked as <strong>Won</strong> in the sales pipeline.
                </p>
              </>
            ) : (
              <>
                <Search className="h-10 w-10 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-base font-medium">No clients match these filters</p>
                <p className="text-sm text-muted-foreground mt-1">Try broadening your search or clearing the filters.</p>
                <button
                  className="mt-4 text-sm underline text-muted-foreground hover:text-foreground"
                  onClick={() => setFilters(DEFAULT_CLIENT_FILTERS)}
                >
                  Clear filters
                </button>
              </>
            )}
          </CardContent>
        </Card>
      ) : viewMode === "table" ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-xs text-muted-foreground">
                  <th className="w-8 px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={bulk.allSelected}
                      ref={el => { if (el) el.indeterminate = bulk.someSelected; }}
                      onChange={bulk.toggleAll}
                      className="rounded"
                    />
                  </th>
                  <th className="text-left px-4 py-2.5 font-medium">Client</th>
                  <th className="text-center px-3 py-2.5 font-medium">Health</th>
                  <th className="text-right px-3 py-2.5 font-medium">Retainer</th>
                  <th className="text-center px-3 py-2.5 font-medium">Open Tasks</th>
                  <th className="text-center px-3 py-2.5 font-medium">Last Scan</th>
                  <th className="text-center px-3 py-2.5 font-medium">Payment</th>
                  <th className="text-center px-3 py-2.5 font-medium">Risk</th>
                  <th className="text-center px-4 py-2.5 font-medium">Google Ads</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => (
                  <tr
                    key={client.id}
                    className={`border-b last:border-0 hover:bg-muted/20 transition-colors cursor-pointer ${bulk.isSelected(client.id) ? "bg-primary/5" : ""}`}
                  >
                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={bulk.isSelected(client.id)}
                        onChange={() => bulk.toggle(client.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-3" onClick={() => router.push(`/clients/${client.id}`)}>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${healthDot(client.healthScore)}`} />
                        <div>
                          <p className="font-medium">{client.businessName}</p>
                          <p className="text-xs text-muted-foreground">{client.lead.city}, {client.lead.state}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <Badge variant="outline" className={`text-xs ${healthColor(client.healthScore)}`}>
                          {healthLabel(client.healthScore)}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">{client.healthScore}/100</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right font-medium">
                      {formatCurrency(Number(client.retainerAmount))}/mo
                    </td>
                    <td className="px-3 py-3 text-center">
                      {client.tasks.length > 0 ? (
                        <Badge variant="secondary" className="text-xs">{client.tasks.length}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center text-xs">
                      {isScanOverdue(client) ? (
                        <span className="text-orange-600 font-medium flex items-center justify-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {daysAgo(client.lastScanAt)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">{daysAgo(client.lastScanAt)}</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <Badge variant="outline" className={`text-xs ${paymentBadgeClass(client.paymentStatus)}`}>
                        {paymentLabel(client.paymentStatus)}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-center">
                      {(() => {
                        const risk = computeClientChurnRisk(client);
                        return risk.level !== "low"
                          ? <ChurnRiskBadge level={risk.level} score={risk.score} factors={risk.factors} />
                          : <span className="text-xs text-muted-foreground">—</span>;
                      })()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {client.googleAdsConnection?.isActive ? (
                        <span className="text-xs text-green-600 font-medium">Connected</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="shrink-0 flex flex-col items-end gap-1 cursor-help">
                        <Badge
                          variant="outline"
                          className={`${healthColor(client.healthScore)}`}
                        >
                          {healthLabel(client.healthScore)}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">{client.healthScore}/100</span>
                        {(() => {
                          const risk = computeClientChurnRisk(client);
                          return <ChurnRiskBadge level={risk.level} score={risk.score} factors={risk.factors} />;
                        })()}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-[200px]">
                        <p className="text-xs font-medium mb-1">Health Score</p>
                        <p className="text-xs text-muted-foreground">
                          {client.healthScore >= 75
                            ? "Healthy — leading or competitive across all metrics."
                            : client.healthScore >= 50
                            ? "Competitive — gaps exist but within striking range."
                            : "Needs attention — at least one metric is significantly behind."}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1">Hover the ? on Avg Health above for full methodology.</p>
                      </TooltipContent>
                    </Tooltip>
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

                  {/* Health Sparkline */}
                  {sparklines[client.id] && (
                    <div className="flex items-center gap-2 border-t pt-2">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide shrink-0">Trend</span>
                      <HealthSparkline
                        sparklinePath={sparklines[client.id].path}
                        delta={sparklines[client.id].delta}
                        width={80}
                        height={24}
                      />
                    </div>
                  )}

                  {/* Footer info */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-2">
                    <span>{formatCurrency(Number(client.retainerAmount))}/mo</span>
                    <div className="flex items-center gap-2">
                      {client.paymentStatus && client.paymentStatus !== "current" && (
                        <Badge variant="outline" className={`text-[10px] px-1.5 ${paymentBadgeClass(client.paymentStatus)}`}>
                          {paymentLabel(client.paymentStatus)}
                        </Badge>
                      )}
                      <span className={isScanOverdue(client) ? "text-orange-600 font-medium flex items-center gap-1" : ""}>
                        {isScanOverdue(client) && <AlertTriangle className="w-3 h-3" />}
                        Scanned {daysAgo(client.lastScanAt)}
                      </span>
                    </div>
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

      {/* Client Import Dialog */}
      <ClientImportDialog
        open={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={() => router.refresh()}
      />

      {/* Bulk Action Bar — floats when clients are selected in table view */}
      <BulkActionBar
        selectedIds={bulk.selectedIds}
        onClear={bulk.clear}
        actions={bulkActions}
        entityLabel="client"
      />
    </div>
    </TooltipProvider>
  );
}
