"use client";

import { useState, useMemo } from "react";
import { KanbanBoard } from "@/components/leads/kanban-board";
import { LeadDetailSheet } from "@/components/leads/lead-detail-sheet";
import { CSVImportDialog } from "@/components/leads/csv-import-dialog";
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
};

type LeadsClientPageProps = {
  initialLeads: KanbanLead[];
  totalLeadCount: number;
  userRole: UserRole;
};

export function LeadsClientPage({ initialLeads, totalLeadCount, userRole }: LeadsClientPageProps) {
  const router = useRouter();
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [filters, setFilters] = useState<AdvancedFilterState>(DEFAULT_FILTERS);
  const { startTour } = useTour(LEADS_TOUR);

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

    // Exclusions
    if (filters.excludeChains) {
      result = result.filter((lead) => !lead.isChain);
    }
    if (filters.excludeFranchises) {
      result = result.filter((lead) => !lead.isFranchise);
    }
    if (filters.excludeCorporate) {
      result = result.filter((lead) => !lead.isCorporate);
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

  const [batchEnriching, setBatchEnriching] = useState(false);

  const handleBatchEnrich = async (force = false) => {
    const leadIds = filteredLeads.map((l) => l.id);
    if (leadIds.length === 0) return;
    const batch = leadIds.slice(0, 50);
    setBatchEnriching(true);
    try {
      const res = await fetch("/api/leads/enrich-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadIds: batch, force }),
      });
      const data = await res.json();
      if (data.success) {
        const { enriched, skipped } = data.data.summary;
        if (skipped > 0 && enriched === 0) {
          toast.warning(`All ${skipped} leads were enriched within the last 7 days — skipped to save API credits.`, {
            action: {
              label: "Force Re-enrich",
              onClick: () => handleBatchEnrich(true),
            },
            duration: 10000,
          });
        } else if (skipped > 0) {
          toast.success(`Enriched ${enriched} leads · ${skipped} skipped (fresh data)`);
        } else {
          toast.success(`Enriched ${enriched} of ${batch.length} leads`);
        }
        router.refresh();
      } else {
        toast.error(data.error || "Batch enrichment failed");
      }
    } catch {
      toast.error("Batch enrichment failed");
    } finally {
      setBatchEnriching(false);
    }
  };

  const handleImportComplete = () => {
    router.refresh();
  };

  return (
    <div className="space-y-4 pb-20 md:pb-0">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div data-tour="leads-heading">
          <h1 className="text-2xl font-bold">Sales Pipeline</h1>
          <p className="text-sm text-muted-foreground">
            Manage leads from first contact through deal close — {filteredLeads.length} leads • Drag cards between stages
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TourButton onStart={startTour} tooltip="Tour the Sales Pipeline" />
          {userRole === "master" && (
            <>
              <button
                className="h-9 px-3 text-sm border rounded hover:bg-muted disabled:opacity-50"
                onClick={() => handleBatchEnrich()}
                disabled={batchEnriching || filteredLeads.length === 0}
              >
                {batchEnriching ? "Enriching..." : `🔍 Enrich (${Math.min(filteredLeads.length, 50)})`}
              </button>
              <CSVImportDialog onComplete={handleImportComplete} />
            </>
          )}
        </div>
      </div>

      <div data-tour="leads-filter-bar">
        <AdvancedLeadFilterBar
          filters={filters}
          onChange={setFilters}
          showTerritoryFilter={userRole === "master"}
        />
      </div>

      {/* Cap warning — shown when lead count exceeds the 500-lead kanban limit */}
      {totalLeadCount > 500 && (
        <div className="flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-amber-200 bg-amber-50 text-amber-800">
          <span>⚠️</span>
          <span>
            Showing 500 of {totalLeadCount.toLocaleString()} leads — use filters above to narrow results and see specific leads.
          </span>
        </div>
      )}

      <div data-tour="leads-kanban">
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
