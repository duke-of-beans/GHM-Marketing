"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Loader2,
  CheckCheck,
} from "lucide-react";

interface PageRow {
  id: number;
  slug: string;
  title: string;
  scrvnrStatus: string;
  reviewStatus: string;
  lastScrvnrResult: {
    pass1Score: number;
    pass2Score: number | null;
    overrideApplied: boolean;
    failedSections: string[];
  } | null;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  clientId: number;
  jobId: number;
  jobBrandSegment: string;
  jobTier: string;
  pages: PageRow[];
  onDone: () => void;
}

export function ApprovalModal({
  open,
  onOpenChange,
  clientId,
  jobId,
  jobBrandSegment,
  jobTier,
  pages,
  onDone,
}: Props) {
  const [localPages, setLocalPages] = useState<PageRow[]>(pages);
  const [overridePageId, setOverridePageId] = useState<number | null>(null);
  const [overrideNote, setOverrideNote] = useState("");
  const [rejectionPageId, setRejectionPageId] = useState<number | null>(null);
  const [rejectionNote, setRejectionNote] = useState("");
  const [loading, setLoading] = useState<Record<number, boolean>>({});
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setLocalPages(pages);
      setOverridePageId(null);
      setOverrideNote("");
      setRejectionPageId(null);
      setRejectionNote("");
    }
  }, [open, pages]);

  async function approvePage(pageId: number, overrideNoteText?: string) {
    setLoading(l => ({ ...l, [pageId]: true }));
    try {
      const res = await fetch(
        `/api/website-studio/${clientId}/pages/${pageId}/review`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "approved",
            ...(overrideNoteText ? { overrideNote: overrideNoteText } : {}),
          }),
        }
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setLocalPages(lp =>
        lp.map(p => p.id === pageId ? { ...p, reviewStatus: "approved" } : p)
      );
      if (json.data?.approvalResult?.transitioned) {
        toast.success("All pages approved — job moved to approved stage!");
        onDone();
        onOpenChange(false);
        return;
      }
      setOverridePageId(null);
      setOverrideNote("");
    } catch (err: any) {
      toast.error(err.message ?? "Approval failed");
    } finally {
      setLoading(l => ({ ...l, [pageId]: false }));
    }
  }

  async function rejectPage(pageId: number) {
    if (!rejectionNote.trim()) {
      toast.error("A rejection note is required");
      return;
    }
    setLoading(l => ({ ...l, [pageId]: true }));
    try {
      const res = await fetch(
        `/api/website-studio/${clientId}/pages/${pageId}/review`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "changes_requested", note: rejectionNote }),
        }
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setLocalPages(lp =>
        lp.map(p => p.id === pageId ? { ...p, reviewStatus: "changes_requested" } : p)
      );
      setRejectionPageId(null);
      setRejectionNote("");
    } catch (err: any) {
      toast.error(err.message ?? "Rejection failed");
    } finally {
      setLoading(l => ({ ...l, [pageId]: false }));
    }
  }

  async function bulkApproveAll() {
    setBulkLoading(true);
    try {
      const res = await fetch(`/api/website-studio/${clientId}/approve-all`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      const { approvedPageIds, approvalResult } = json.data;
      toast.success(
        approvalResult.transitioned
          ? `All ${approvedPageIds.length} pages approved — job is now ready to deploy!`
          : `Approved ${approvedPageIds.length} pages.`
      );
      onDone();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message ?? "Bulk approval failed");
    } finally {
      setBulkLoading(false);
    }
  }

  const clearedPages = localPages.filter(p => p.scrvnrStatus === "cleared" && p.reviewStatus !== "approved");
  const failedPages  = localPages.filter(p => p.scrvnrStatus === "failed"  && p.reviewStatus !== "approved");
  const approvedCount = localPages.filter(p => p.reviewStatus === "approved").length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Review Pages — {jobBrandSegment} {jobTier.toUpperCase()}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {approvedCount}/{localPages.length} pages approved
          </p>
        </DialogHeader>

        {/* Bulk approve bar */}
        {clearedPages.length > 0 && (
          <div className="flex items-center justify-between rounded-lg bg-status-success-bg border border-status-success-border px-4 py-3">
            <div className="text-sm text-status-success">
              <span className="font-medium">{clearedPages.length} page{clearedPages.length !== 1 ? "s" : ""}</span> passed SCRVNR and are ready for bulk approval.
            </div>
            <Button
              size="sm"
              className="bg-status-success-bg hover:bg-status-success-bg text-white gap-1.5"
              onClick={bulkApproveAll}
              disabled={bulkLoading}
            >
              {bulkLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
              Approve All Cleared
            </Button>
          </div>
        )}

        {/* Page list */}
        <div className="divide-y rounded-lg border">
          {localPages.map(page => {
            const isCleared  = page.scrvnrStatus === "cleared";
            const isFailed   = page.scrvnrStatus === "failed";
            const isApproved = page.reviewStatus === "approved";
            const isRejected = page.reviewStatus === "changes_requested";
            const isLoading  = loading[page.id];
            const score1 = page.lastScrvnrResult?.pass1Score;
            const score2 = page.lastScrvnrResult?.pass2Score;

            return (
              <div key={page.id} className="px-4 py-3 space-y-2">
                <div className="flex items-center gap-3">
                  {/* Status icon */}
                  <div className="shrink-0">
                    {isApproved ? (
                      <CheckCircle2 className="h-4 w-4 text-status-success" />
                    ) : isRejected ? (
                      <XCircle className="h-4 w-4 text-status-danger" />
                    ) : isFailed ? (
                      <AlertTriangle className="h-4 w-4 text-status-warning" />
                    ) : isCleared ? (
                      <CheckCircle2 className="h-4 w-4 text-blue-500" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                    )}
                  </div>

                  {/* Title + SCRVNR scores */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{page.title}</span>
                      {score1 != null && (
                        <span className="text-[10px] tabular-nums text-muted-foreground">
                          P1: {score1.toFixed(0)}%{score2 != null ? ` · P2: ${score2.toFixed(0)}%` : ""}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <ScrvnrBadge status={page.scrvnrStatus} />
                      <ReviewBadge  status={page.reviewStatus} />
                    </div>
                    {isFailed && page.lastScrvnrResult?.failedSections?.length ? (
                      <p className="text-[11px] text-status-warning mt-1">
                        Failed: {page.lastScrvnrResult.failedSections.join(", ")}
                      </p>
                    ) : null}
                  </div>

                  {/* Actions */}
                  {!isApproved && !isLoading && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isCleared && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs border-status-success-border text-status-success hover:bg-status-success-bg"
                          onClick={() => approvePage(page.id)}
                        >
                          Approve
                        </Button>
                      )}
                      {isFailed && overridePageId !== page.id && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs border-status-warning-border text-status-warning hover:bg-status-warning-bg"
                          onClick={() => setOverridePageId(page.id)}
                        >
                          Override
                        </Button>
                      )}
                      {!isRejected && rejectionPageId !== page.id && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-status-danger hover:text-status-danger hover:bg-status-danger-bg"
                          onClick={() => setRejectionPageId(page.id)}
                        >
                          Reject
                        </Button>
                      )}
                    </div>
                  )}
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>

                {/* Override inline form */}
                {overridePageId === page.id && (
                  <div className="ml-7 space-y-2 rounded-md bg-status-warning-bg border border-status-warning-border p-3">
                    <p className="text-xs font-medium text-status-warning">
                      Override SCRVNR failure — explain why this page is acceptable:
                    </p>
                    <Textarea
                      value={overrideNote}
                      onChange={e => setOverrideNote(e.target.value)}
                      placeholder="e.g. Client explicitly requested this tone — approved by account manager"
                      className="text-xs h-20"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        className="h-7 text-xs bg-status-warning-bg hover:bg-status-warning-bg text-white"
                        onClick={() => approvePage(page.id, overrideNote)}
                        disabled={!overrideNote.trim()}
                      >
                        Confirm Override
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() => { setOverridePageId(null); setOverrideNote(""); }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Rejection inline form */}
                {rejectionPageId === page.id && (
                  <div className="ml-7 space-y-2 rounded-md bg-status-danger-bg border border-status-danger-border p-3">
                    <p className="text-xs font-medium text-status-danger">
                      Request changes — describe what needs to be fixed:
                    </p>
                    <Textarea
                      value={rejectionNote}
                      onChange={e => setRejectionNote(e.target.value)}
                      placeholder="e.g. Hero copy too generic — needs a specific {brand} pain point in the first sentence"
                      className="text-xs h-20"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-7 text-xs"
                        onClick={() => rejectPage(page.id)}
                        disabled={!rejectionNote.trim()}
                      >
                        Send Back
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() => { setRejectionPageId(null); setRejectionNote(""); }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ScrvnrBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    unprocessed: { label: "Not run",    className: "bg-gray-100 text-gray-600" },
    processing:  { label: "Running",    className: "bg-blue-100 text-blue-700" },
    cleared:     { label: "SCRVNR ✓",  className: "bg-status-success-bg text-status-success" },
    failed:      { label: "SCRVNR ✗",  className: "bg-status-danger-bg text-status-danger" },
    override:    { label: "Overridden", className: "bg-status-warning-bg text-status-warning" },
  };
  const cfg = config[status] ?? config.unprocessed;
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

function ReviewBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    pending:            { label: "Pending",          className: "bg-gray-100 text-gray-500" },
    approved:           { label: "Approved",         className: "bg-status-success-bg text-status-success" },
    changes_requested:  { label: "Changes needed",   className: "bg-status-danger-bg text-status-danger" },
  };
  const cfg = config[status] ?? config.pending;
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}
