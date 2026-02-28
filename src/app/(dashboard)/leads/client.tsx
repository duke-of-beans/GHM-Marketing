"use client";

import { useState, useMemo } from "react";
import { KanbanBoard } from "@/components/leads/kanban-board";
import { LeadDetailSheet } from "@/components/leads/lead-detail-sheet";
import { CSVImportDialog } from "@/components/leads/csv-import-dialog";
import { NewLeadDialog } from "@/components/leads/new-lead-dialog";
import { 
  AdvancedLeadFilterBar, 
  type AdvancedFilterState,
  DEFAULT_FILTERS 
} from "@/components/leads/lead-filter-bar-advanced";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { LeadStatus, UserRole } from "@prisma/client";
import { useTour } from "@/lib/tutorials";
import { LEADS_TOUR } from "@/lib/tutorials";
import { TourButton } from "@/components/tutorials/TourButton";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Users, Archive, Trash2, Download, AlertTriangle, Filter, ClipboardList } from "lucide-react";

type KanbanLead = {
  id: number;
  businessName: string;
  phone: string;
  city: string;
  state: string;
  status: LeadStatus;
  domainRating: number | null;
  reviewCount: number | null;
  dealValueTotal: number;
  updatedAt: string;
  statusChangedAt: string;
  assignedUser: { id: number; name: string } | null;
  _count: { notes: number };
  
  // Lead gen engine fields
  impactScore: number | null;
  closeLikelihood: number | null;
  priorityTier: string | null;
  rating: number | null;
  marketType: string | null;
  suppressionSignal: string | null;
  municipalMismatch: boolean | null;
  wealthScore: number | null;
  distanceFromMetro: number | null;
  website: string | null;
  publicEmail: string | null;
  isChain: boolean | null;
  isFranchise: boolean | null;
  isCorporate: boolean | null;
  leadSourceId: number | null;
};

type LeadsClientPageProps = {
  initialLeads: KanbanLead[];
  totalLeadCount: number;
  userRole: UserRole;
};

export function LeadsClientPage({ initialLeads, totalLeadCount, userRole }: LeadsClientPageProps) {
  const router = useRouter();
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [filters, setFilters] = useState<AdvancedFilterState>(() => {
    if (typeof window === "undefined") return DEFAULT_FILTERS;
    try {
      const saved = localStorage.getItem("leads_filters");
      if (saved) return { ...DEFAULT_FILTERS, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_FILTERS;
  });
  const { startTour } = useTour(LEADS_TOUR);

  const handleFiltersChange = (next: AdvancedFilterState) => {
    setFilters(next);
    try { localStorage.setItem("leads_filters", JSON.stringify(next)); } catch {}
  };

  const filteredLeads = useMemo(() => {
    let result = initialLeads;

    // Search filter
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (lead) =>
          lead.businessName.toLowerCase().includes(q) ||
          lead.phone.includes(q) ||
          lead.city.toLowerCase().includes(q)
      );
    }

    // Assigned to filter
    if (filters.assignedToId !== null) {
      if (filters.assignedToId === 0) {
        result = result.filter((lead) => !lead.assignedUser);
      } else {
        result = result.filter(
          (lead) => lead.assignedUser?.id === filters.assignedToId
        );
      }
    }

    // Status filter
    if (filters.statuses.length > 0) {
      result = result.filter((lead) => filters.statuses.includes(lead.status));
    }

    // Impact Score filter
    if (filters.impactScoreMin > 0 || filters.impactScoreMax < 100) {
      result = result.filter((lead) => {
        if (!lead.impactScore) return false;
        return lead.impactScore >= filters.impactScoreMin && 
               lead.impactScore <= filters.impactScoreMax;
      });
    }

    // Close Likelihood filter
    if (filters.closeLikelihoodMin > 0 || filters.closeLikelihoodMax < 100) {
      result = result.filter((lead) => {
        if (!lead.closeLikelihood) return false;
        return lead.closeLikelihood >= filters.closeLikelihoodMin && 
               lead.closeLikelihood <= filters.closeLikelihoodMax;
      });
    }

    // Priority Tier filter
    if (filters.priorityTiers.length > 0) {
      result = result.filter((lead) => 
        lead.priorityTier && filters.priorityTiers.includes(lead.priorityTier)
      );
    }

    // Rating filter
    if (filters.ratingMin > 0 || filters.ratingMax < 5) {
      result = result.filter((lead) => {
        if (!lead.rating) return false;
        return lead.rating >= filters.ratingMin && 
               lead.rating <= filters.ratingMax;
      });
    }

    // Review Count filter
    if (filters.reviewCountMin > 0 || filters.reviewCountMax < 1000) {
      result = result.filter((lead) => {
        const count = lead.reviewCount || 0;
        return count >= filters.reviewCountMin && 
               count <= filters.reviewCountMax;
      });
    }

    // Domain Rating filter
    if (filters.domainRatingMin > 0 || filters.domainRatingMax < 100) {
      result = result.filter((lead) => {
        const rating = lead.domainRating || 0;
        return rating >= filters.domainRatingMin && 
               rating <= filters.domainRatingMax;
      });
    }

    // Has Website filter
    if (filters.hasWebsite !== "all") {
      result = result.filter((lead) => 
        filters.hasWebsite === "yes" ? !!lead.website : !lead.website
      );
    }

    // Has Email filter
    if (filters.hasEmail !== "all") {
      result = result.filter((lead) => 
        filters.hasEmail === "yes" ? !!lead.publicEmail : !lead.publicEmail
      );
    }

    // Market Type filter
    if (filters.marketTypes.length > 0) {
      result = result.filter((lead) => 
        lead.marketType && filters.marketTypes.includes(lead.marketType)
      );
    }

    // Municipal Mismatch filter
    if (filters.municipalMismatch !== "all") {
      result = result.filter((lead) => 
        filters.municipalMismatch === "yes" ? lead.municipalMismatch : !lead.municipalMismatch
      );
    }

    // Exclusions (fields not yet in DB — skip when null)
    if (filters.excludeChains) {
      result = result.filter((lead) => lead.isChain === null || !lead.isChain);
    }
    if (filters.excludeFranchises) {
      result = result.filter((lead) => lead.isFranchise === null || !lead.isFranchise);
    }
    if (filters.excludeCorporate) {
      result = result.filter((lead) => lead.isCorporate === null || !lead.isCorporate);
    }

    // Date range filter (based on updatedAt)
    if (filters.dateRange !== "all") {
      const now = Date.now();
      const msMap = { "7d": 7, "30d": 30, "90d": 90 };
      const days = msMap[filters.dateRange];
      const cutoff = now - days * 24 * 60 * 60 * 1000;
      result = result.filter((lead) => new Date(lead.updatedAt).getTime() >= cutoff);
    }

    // Deal value filter
    if (filters.dealValueMin > 0 || filters.dealValueMax < 50000) {
      result = result.filter((lead) => {
        return lead.dealValueTotal >= filters.dealValueMin &&
               lead.dealValueTotal <= filters.dealValueMax;
      });
    }

    // Days in stage filter
    if (filters.daysInStageMin > 0 || filters.daysInStageMax < 365) {
      const now = Date.now();
      result = result.filter((lead) => {
        const daysInStage = Math.floor((now - new Date(lead.statusChangedAt).getTime()) / (1000 * 60 * 60 * 24));
        return daysInStage >= filters.daysInStageMin && daysInStage <= filters.daysInStageMax;
      });
    }

    // Lead source filter
    if (filters.leadSourceIds.length > 0) {
      result = result.filter((lead) =>
        lead.leadSourceId !== null && filters.leadSourceIds.includes(lead.leadSourceId)
      );
    }

    // Close score filter
    if (filters.closeScoreMin > 0 || filters.closeScoreMax < 100) {
      result = result.filter((lead) => {
        const s = (lead as Record<string, unknown>).closeScore as number | null | undefined ?? 0;
        return s >= filters.closeScoreMin && s <= filters.closeScoreMax;
      });
    }

    // MRR filter
    if (filters.mrrMin > 0 || filters.mrrMax < 10000) {
      result = result.filter((lead) => {
        const v = (lead as Record<string, unknown>).mrr as number | null | undefined ?? 0;
        return v >= filters.mrrMin && v <= filters.mrrMax;
      });
    }

    // ARR filter
    if (filters.arrMin > 0 || filters.arrMax < 120000) {
      result = result.filter((lead) => {
        const v = (lead as Record<string, unknown>).arr as number | null | undefined ?? 0;
        return v >= filters.arrMin && v <= filters.arrMax;
      });
    }

    // Distance from metro filter
    if (filters.distanceFromMetroMin > 0 || filters.distanceFromMetroMax < 50) {
      result = result.filter((lead) => {
        const d = (lead as Record<string, unknown>).distanceFromMetro as number | null | undefined ?? 0;
        return d >= filters.distanceFromMetroMin && d <= filters.distanceFromMetroMax;
      });
    }

    // Wealth score filter (string-based)
    if (filters.wealthScores.length > 0) {
      result = result.filter((lead) => {
        const ws = (lead as Record<string, unknown>).wealthScore as string | null | undefined;
        return ws && filters.wealthScores.includes(ws);
      });
    }

    // Pitch angle filter
    if (filters.pitchAngles.length > 0) {
      result = result.filter((lead) => {
        const pa = (lead as Record<string, unknown>).pitchAngle as string | null | undefined;
        return pa && filters.pitchAngles.includes(pa);
      });
    }

    // Intel needs refresh filter
    if (filters.intelNeedsRefresh !== null) {
      result = result.filter((lead) => {
        const v = (lead as Record<string, unknown>).intelNeedsRefresh as boolean | null | undefined ?? false;
        return v === filters.intelNeedsRefresh;
      });
    }

    // Sorting
    if (filters.sortBy === "newest") {
      // Already sorted by updatedAt desc from server
    } else if (filters.sortBy === "oldest") {
      result = [...result].reverse();
    } else if (filters.sortBy === "value-high") {
      result = [...result].sort((a, b) => b.dealValueTotal - a.dealValueTotal);
    } else if (filters.sortBy === "value-low") {
      result = [...result].sort((a, b) => a.dealValueTotal - b.dealValueTotal);
    } else if (filters.sortBy === "impact-high") {
      result = [...result].sort((a, b) => (b.impactScore || 0) - (a.impactScore || 0));
    } else if (filters.sortBy === "impact-low") {
      result = [...result].sort((a, b) => (a.impactScore || 0) - (b.impactScore || 0));
    } else if (filters.sortBy === "close-high") {
      result = [...result].sort((a, b) => (b.closeLikelihood || 0) - (a.closeLikelihood || 0));
    } else if (filters.sortBy === "close-low") {
      result = [...result].sort((a, b) => (a.closeLikelihood || 0) - (b.closeLikelihood || 0));
    } else if (filters.sortBy === "updated") {
      // Already sorted by updatedAt desc from server
    }

    return result;
  }, [initialLeads, filters]);

  const [bulkCount, setBulkCount] = useState<number | "all">(200);
  const resolvedCount = (count: number | "all", total: number) =>
    count === "all" ? total : Math.min(count, total);

  const handleImportComplete = () => {
    router.refresh();
  };

  const handleExportLeads = () => {
    const statusParam = filters.statuses.length > 0 ? `&status=${filters.statuses.join(",")}` : "";
    const url = `/api/export/leads?${statusParam}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = "";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const bulkLeadOp = async (operation: string, params?: Record<string, unknown>) => {
    const ids = filteredLeads.map(l => l.id);
    if (ids.length === 0) { toast.error("No leads visible to operate on"); return; }
    const cap = Math.min(ids.length, 200);
    const res = await fetch("/api/bulk/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: ids.slice(0, cap), operation, params }),
    });
    const data = await res.json();
    if (data.processed > 0) {
      toast.success(`${data.processed} lead${data.processed !== 1 ? "s" : ""} updated`);
      router.refresh();
    } else {
      toast.error(data.summary ?? "Operation failed");
    }
  };

  return (
    <div className="space-y-4 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
        <div data-tour="leads-heading">
          <h1 className="text-2xl font-bold">Sales Pipeline</h1>
          <p className="text-sm text-muted-foreground">
            Manage leads from first contact through deal close — {filteredLeads.length} leads • Drag cards between stages
          </p>
        </div>
        <div className="flex items-center gap-2" data-tour="leads-bulk-actions">
          <TourButton onStart={startTour} tooltip="Tour the Sales Pipeline" />
          {/* Manual single-lead entry — all roles */}
          <NewLeadDialog />
          {/* Import — available to admin + master, not sales reps */}
          {userRole !== "sales" && (
            <CSVImportDialog onComplete={handleImportComplete} />
          )}
          {(userRole === "manager" || userRole === "admin") && (
            <>
              {/* Bulk Actions with configurable count */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="h-9 px-3 text-sm border rounded hover:bg-muted flex items-center gap-1.5 disabled:opacity-50"
                    disabled={filteredLeads.length === 0}
                  >
                    Bulk Actions ({resolvedCount(bulkCount, filteredLeads.length)})
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel className="text-xs">
                    On {resolvedCount(bulkCount, filteredLeads.length)} filtered leads
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => bulkLeadOp("stage", { stage: "contacted" })}>
                    Mark as Contacted
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => bulkLeadOp("stage", { stage: "archived" })}>
                    <Archive className="h-3.5 w-3.5 mr-1.5" /> Archive All
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => {
                    const availableCount = filteredLeads.filter(l => l.status === "available").length;
                    const total = resolvedCount(bulkCount, filteredLeads.length);
                    if (availableCount > total * 0.5) {
                      if (!window.confirm(
                        `${availableCount} of ${total} leads are still in "Available" status and haven't been contacted. Enriching untouched leads uses API credits that may not convert. Continue?`
                      )) return;
                    }
                    bulkLeadOp("enrich", { force: false });
                  }}>
                    Enrich All (skip fresh)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => {
                      const count = resolvedCount(bulkCount, filteredLeads.length);
                      if (window.confirm(`Delete ${count} leads? Cannot be undone.`))
                        bulkLeadOp("delete");
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete All
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs text-muted-foreground">Apply to</DropdownMenuLabel>
                  {([25, 50, 100, 200, "all"] as const).map((n) => (
                    <DropdownMenuItem
                      key={n}
                      className={bulkCount === n ? "font-medium text-primary" : ""}
                      onClick={() => setBulkCount(n)}
                    >
                      {n === "all" ? `All (${filteredLeads.length})` : n}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <button
                className="h-9 px-3 text-sm border rounded hover:bg-muted flex items-center gap-1.5"
                onClick={handleExportLeads}
                title="Export current filtered view as CSV"
              >
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </button>
            </>
          )}
        </div>
      </div>

      <div data-tour="leads-filter-bar">
        <AdvancedLeadFilterBar
          filters={filters}
          onChange={handleFiltersChange}
          showTerritoryFilter={userRole === "manager" || userRole === "admin"}
        />
      </div>

      {/* Cap warning — shown when lead count exceeds the 500-lead kanban limit */}
      {totalLeadCount > 500 && (
        <div className="flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-status-warning-border bg-status-warning-bg text-status-warning">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            Showing 500 of {totalLeadCount.toLocaleString()} leads — use filters above to narrow results and see specific leads.
          </span>
        </div>
      )}

      <div data-tour="leads-kanban">
        {filteredLeads.length === 0 && (() => {
          const hasFilters = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS);
          const noLeadsAtAll = initialLeads.length === 0;

          if (noLeadsAtAll) {
            // Brand new pipeline — no leads exist anywhere
            return (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                <ClipboardList className="h-10 w-10 text-muted-foreground mx-auto" />
                <p className="font-semibold text-lg">Your pipeline is empty</p>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Add your first lead manually, import a CSV, or use the Discovery engine to find local businesses that match your criteria.
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <NewLeadDialog />
                  {userRole !== "sales" && <CSVImportDialog onComplete={handleImportComplete} />}
                  <a href="/discovery" className="text-sm underline text-muted-foreground hover:text-foreground">
                    Find leads in Discovery →
                  </a>
                </div>
              </div>
            );
          }

          if (hasFilters) {
            // Leads exist but filters are hiding them all
            return (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-2">
                <Filter className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="font-semibold">No leads match these filters</p>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {initialLeads.length} lead{initialLeads.length !== 1 ? "s" : ""} exist in your pipeline — try broadening your criteria or clearing the filters.
                </p>
                <button
                  className="mt-3 text-sm underline text-muted-foreground hover:text-foreground"
                  onClick={() => handleFiltersChange(DEFAULT_FILTERS)}
                >
                  Clear all filters
                </button>
              </div>
            );
          }

          // Leads exist, no filters active — territory or assignment context returning nothing
          return (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-2">
              <Users className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="font-semibold">No leads visible here</p>
              <p className="text-sm text-muted-foreground max-w-sm">
                There are no leads in this view. They may be assigned to a different territory, or not yet imported.
              </p>
            </div>
          );
        })()}
        <KanbanBoard
          initialLeads={filteredLeads}
          onLeadClick={(id) => setSelectedLeadId(id)}
        />
      </div>

      <LeadDetailSheet
        leadId={selectedLeadId}
        open={selectedLeadId !== null}
        onClose={() => setSelectedLeadId(null)}
      />
    </div>
  );
}

