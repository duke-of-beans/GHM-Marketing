"use client";

import { useState, useMemo } from "react";
import { KanbanBoard } from "@/components/leads/kanban-board";
import { LeadDetailSheet } from "@/components/leads/lead-detail-sheet";
import { CSVImportDialog } from "@/components/leads/csv-import-dialog";
import { LeadFilterBar, type FilterState } from "@/components/leads/lead-filter-bar";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { LeadStatus, UserRole } from "@prisma/client";

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
};

type LeadsClientPageProps = {
  initialLeads: KanbanLead[];
  userRole: UserRole;
};

export function LeadsClientPage({ initialLeads, userRole }: LeadsClientPageProps) {
  const router = useRouter();
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    territoryId: null,
    assignedToId: null,
  });

  const filteredLeads = useMemo(() => {
    let result = initialLeads;

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (lead) =>
          lead.businessName.toLowerCase().includes(q) ||
          lead.phone.includes(q) ||
          lead.city.toLowerCase().includes(q)
      );
    }

    if (filters.assignedToId !== null) {
      if (filters.assignedToId === 0) {
        result = result.filter((lead) => !lead.assignedUser);
      } else {
        result = result.filter(
          (lead) => lead.assignedUser?.id === filters.assignedToId
        );
      }
    }

    return result;
  }, [initialLeads, filters]);

  const [batchEnriching, setBatchEnriching] = useState(false);

  const handleBatchEnrich = async () => {
    const leadIds = filteredLeads.map((l) => l.id);
    if (leadIds.length === 0) return;
    const batch = leadIds.slice(0, 50);
    setBatchEnriching(true);
    try {
      const res = await fetch("/api/leads/enrich-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadIds: batch }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(
          `Enriched ${data.data.summary.successful} of ${batch.length} leads`
        );
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
        <div>
          <h1 className="text-2xl font-bold">Sales Pipeline</h1>
          <p className="text-sm text-muted-foreground">
            Manage leads from first contact through deal close — {filteredLeads.length} leads • Drag cards between stages
          </p>
        </div>
        {userRole === "master" && (
          <div className="flex gap-2">
            <button
              className="h-9 px-3 text-sm border rounded hover:bg-muted disabled:opacity-50"
              onClick={handleBatchEnrich}
              disabled={batchEnriching || filteredLeads.length === 0}
            >
              {batchEnriching ? "Enriching..." : `🔍 Enrich (${Math.min(filteredLeads.length, 50)})`}
            </button>
            <CSVImportDialog onComplete={handleImportComplete} />
          </div>
        )}
      </div>

      <LeadFilterBar
        filters={filters}
        onChange={setFilters}
        showTerritoryFilter={userRole === "master"}
      />

      <KanbanBoard
        initialLeads={filteredLeads}
        onLeadClick={(id) => setSelectedLeadId(id)}
      />

      <LeadDetailSheet
        leadId={selectedLeadId}
        open={selectedLeadId !== null}
        onClose={() => setSelectedLeadId(null)}
      />
    </div>
  );
}
