"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Globe, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PropertyMatrix } from "./PropertyMatrix";
import { BuildQueue } from "./BuildQueue";
import { NewPropertyModal } from "./NewPropertyModal";
import { PageComposer } from "./PageComposer";
import { DnaLab } from "./DnaLab";
import type {
  WebPropertyMatrix,
  BuildJobWithPages,
  ComposerPage,
} from "@/types/website-studio";

// ── View states ───────────────────────────────────────────────────────────────
type View =
  | { mode: "matrix" }
  | { mode: "composer"; jobId: number; pageId: number | null }
  | { mode: "dna"; propertyId: number; propertySlug: string };

interface Props {
  clientId: number;
  businessName: string;
}

export function WebsiteStudioTab({ clientId, businessName }: Props) {
  const [loading, setLoading] = useState(true);
  const [matrix, setMatrix] = useState<WebPropertyMatrix>({});
  const [buildJobs, setBuildJobs] = useState<any[]>([]);
  const [view, setView] = useState<View>({ mode: "matrix" });
  const [newPropertyOpen, setNewPropertyOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/website-studio/${clientId}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setMatrix(json.data.matrix);
      setBuildJobs(json.data.buildJobs);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to load Website Studio");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  function openComposer(jobId: number, pageId?: number) {
    setView({ mode: "composer", jobId, pageId: pageId ?? null });
  }

  function openDna(propertyId: number, propertySlug: string) {
    setView({ mode: "dna", propertyId, propertySlug });
  }

  function backToMatrix() {
    setView({ mode: "matrix" });
    load(); // Refresh counts after composer work
  }

  // ── DNA Lab view ──────────────────────────────────────────────────────────
  if (view.mode === "dna") {
    return (
      <DnaLab
        clientId={clientId}
        propertyId={view.propertyId}
        propertySlug={view.propertySlug}
        onBack={backToMatrix}
      />
    );
  }

  // ── Page Composer view ───────────────────────────────────────────────────
  if (view.mode === "composer") {
    const job = buildJobs.find((j) => j.id === view.jobId);
    return (
      <PageComposer
        clientId={clientId}
        job={job}
        initialPageId={view.pageId}
        onBack={backToMatrix}
        onRefresh={load}
      />
    );
  }

  // ── Matrix + Queue view ──────────────────────────────────────────────────
  const hasProperties = Object.keys(matrix).length > 0;
  const activeJobs = buildJobs.filter((j) => j.stage !== "live");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">
            Website Studio — {businessName}
          </span>
        </div>
        <Button size="sm" onClick={() => setNewPropertyOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          New Property
        </Button>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground py-8 text-center">Loading...</div>
      ) : !hasProperties ? (
        <EmptyState onNew={() => setNewPropertyOpen(true)} businessName={businessName} />
      ) : (
        <>
          <PropertyMatrix
            matrix={matrix}
            onOpenComposer={(jobId) => openComposer(jobId)}
            onOpenDna={(propertyId, slug) => openDna(propertyId, slug)}
            onNew={() => setNewPropertyOpen(true)}
          />
          {activeJobs.length > 0 && (
            <BuildQueue
              clientId={clientId}
              jobs={activeJobs}
              onOpenComposer={(jobId, pageId) => openComposer(jobId, pageId)}
              onRefresh={load}
            />
          )}
        </>
      )}

      <NewPropertyModal
        open={newPropertyOpen}
        onOpenChange={setNewPropertyOpen}
        clientId={clientId}
        businessName={businessName}
        onCreated={() => { setNewPropertyOpen(false); load(); }}
      />
    </div>
  );
}

function EmptyState({
  onNew,
  businessName,
}: {
  onNew: () => void;
  businessName: string;
}) {
  return (
    <div className="rounded-lg border border-dashed p-10 text-center space-y-3">
      <Globe className="h-8 w-8 text-muted-foreground mx-auto" />
      <div>
        <p className="font-medium">No web properties yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Create a Tier 1, 2, or 3 satellite site for {businessName} to get started.
        </p>
      </div>
      <Button size="sm" onClick={onNew}>
        <Plus className="h-3.5 w-3.5 mr-1.5" />
        New Property
      </Button>
    </div>
  );
}
