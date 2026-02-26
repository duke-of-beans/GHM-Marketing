"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Loader2,
  CheckCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import type { ComposerPage, ScrvnrResultSummary } from "@/types/website-studio";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface PageRow extends ComposerPage {
  scrvnrResult: ScrvnrResultSummary | null;
}

interface Props {
  clientId: number;
  jobId: number;
  onClose: () => void;
  onApprovalComplete: () => void;
}

// ─── Status config ──────────────────────────────────────────────────────────

const SCRVNR_BADGE: Record<string, { label: string; className: string }> = {
  unprocessed: { label: "Unprocessed", className: "bg-muted text-muted-foreground" },
  processing:  { label: "Processing",  className: "bg-blue-100 text-blue-600" },
  cleared:     { label: "Cleared ✓",   className: "bg-status-success-bg text-status-success" },
  failed:      { label: "Failed",      className: "bg-status-danger-bg text-status-danger" },
  override:    { label: "Override",    className: "bg-status-warning-bg text-status-warning" },
};

const REVIEW_BADGE: Record<string, { label: string; className: string }> = {
  pending:            { label: "Pending",            className: "bg-muted text-muted-foreground" },
  approved:           { label: "Approved",           className: "bg-status-success-bg text-status-success" },
  changes_requested:  { label: "Changes Requested",  className: "bg-status-danger-bg text-status-danger" },
};

// ─── Component ─────────────────────────────────────────────────────────────────

export function ApprovalQueue({ clientId, jobId, onClose, onApprovalComplete }: Props) {
  const [pages, setPages]       = useState<PageRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [overrideNote, setOverrideNote] = useState<Record<number, string>>({});
  const [busy, setBusy]         = useState<Record<number, boolean>>({});
  const [bulkBusy, setBulkBusy] = useState(false);
  const [note, setNote]         = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/website-studio/${clientId}/pages?jobId=${jobId}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setPages(json.data as PageRow[]);
    } catch (err: any) {
      toast.error("Failed to load pages: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [clientId, jobId]);

  useEffect(() => { load(); }, [load]);

  // ── Single page approval / rejection ────────────────────────────────────

  async function reviewPage(
    pageId: number,
    status: "approved" | "changes_requested",
    opts?: { overrideNote?: string }
  ) {
    setBusy(b => ({ ...b, [pageId]: true }));
    try {
      const res = await fetch(
        `/api/website-studio/${clientId}/pages/${pageId}/review`,
        {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ status, note: note || undefined, overrideNote: opts?.overrideNote }),
        }
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      toast.success(status === "approved" ? "Page approved" : "Changes requested");

      if (json.data.approvalResult?.transitioned) {
        toast.success("All pages approved — build job promoted to Approved ✓", { duration: 5000 });
        onApprovalComplete();
        return;
      }

      await load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(b => ({ ...b, [pageId]: false }));
    }
  }

  // ── Bulk approve all cleared pages ────────────────────────────────────

  async function handleBulkApprove() {
    if (!confirm("Approve all SCRVNR-cleared pages in one shot?")) return;
    setBulkBusy(true);
    try {
      const res = await fetch(`/api/website-studio/${clientId}/approve-all`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ jobId, note: note || undefined }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      const { approvedPageIds, approvalResult } = json.data;
      toast.success(`${approvedPageIds.length} pages approved`);
      if (approvalResult.transitioned) {
        toast.success("Build job promoted to Approved — deployment task created ✓", { duration: 5000 });
        onApprovalComplete();
        return;
      }
      await load();
    } catch (err: any) {
      toast.error("Bulk approve failed: " + err.message);
    } finally {
      setBulkBusy(false);
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  const clearableCount = pages.filter(
    p => p.scrvnrStatus === "cleared" && p.reviewStatus !== "approved"
  ).length;

  const approvedCount  = pages.filter(p => p.reviewStatus === "approved").length;
  const failedCount    = pages.filter(p => p.scrvnrStatus === "failed").length;
  const pendingCount   = pages.filter(p => p.reviewStatus === "pending").length;

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading pages...
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* Header strip */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Page Review — Job #{jobId}</span>
          <span className="text-xs text-muted-foreground">
            {approvedCount}/{pages.length} approved · {failedCount} failed · {pendingCount} pending
          </span>
        </div>
        <div className="flex items-center gap-2">
          {clearableCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs border-status-success-border text-status-success hover:bg-status-success-bg"
              onClick={handleBulkApprove}
              disabled={bulkBusy}
            >
              {bulkBusy
                ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Approving...</>
                : <><CheckCheck className="h-3 w-3 mr-1" />Approve All Cleared ({clearableCount})</>
              }
            </Button>
          )}
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      {/* Optional reviewer note applied to all actions */}
      <div>
        <label className="text-xs text-muted-foreground block mb-1">
          Reviewer note (applied to all actions)
        </label>
        <Textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Optional note for the record..."
          className="h-16 text-sm resize-none"
        />
      </div>

      {/* Page rows */}
      <div className="rounded-lg border divide-y">
        {pages.map(page => {
          const scrvnrCfg = SCRVNR_BADGE[page.scrvnrStatus] ?? SCRVNR_BADGE.unprocessed;
          const reviewCfg = REVIEW_BADGE[page.reviewStatus] ?? REVIEW_BADGE.pending;
          const isOpen    = expanded[page.id] ?? false;
          const isBusy    = busy[page.id] ?? false;
          const isFailed  = page.scrvnrStatus === "failed";
          const isApproved = page.reviewStatus === "approved";
          const result    = page.lastScrvnrResult as ScrvnrResultSummary | null;

          return (
            <div key={page.id} className="px-4 py-3 space-y-2">
              {/* Row header */}
              <div className="flex items-center gap-3">

                {/* Page info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{page.title}</span>
                    <span className="text-xs text-muted-foreground">/{page.slug}</span>
                  </div>
                </div>

                {/* SCRVNR badge */}
                <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${scrvnrCfg.className}`}>
                  {scrvnrCfg.label}
                </span>

                {/* Review badge */}
                <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${reviewCfg.className}`}>
                  {reviewCfg.label}
                </span>

                {/* Scores */}
                {result && (
                  <div className="text-xs text-muted-foreground tabular-nums">
                    P1: {result.pass1Score} · P2: {result.pass2Score ?? "—"}
                  </div>
                )}

                {/* Expand for details */}
                <button
                  onClick={() => setExpanded(e => ({ ...e, [page.id]: !isOpen }))}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>

                {/* Actions */}
                {!isApproved && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isFailed && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-status-warning-border text-status-warning hover:bg-status-warning-bg"
                        onClick={() => setExpanded(e => ({ ...e, [page.id]: true }))}
                      >
                        <ShieldAlert className="h-3 w-3 mr-1" />Override
                      </Button>
                    )}
                    {(page.scrvnrStatus === "cleared" || page.scrvnrStatus === "override") && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-status-success-border text-status-success hover:bg-status-success-bg"
                        onClick={() => reviewPage(page.id, "approved")}
                        disabled={isBusy}
                      >
                        {isBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
                        Approve
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-status-danger hover:bg-status-danger-bg"
                      onClick={() => reviewPage(page.id, "changes_requested")}
                      disabled={isBusy}
                    >
                      <XCircle className="h-3 w-3 mr-1" />Reject
                    </Button>
                  </div>
                )}

                {isApproved && (
                  <CheckCircle2 className="h-4 w-4 text-status-success shrink-0" />
                )}
              </div>

              {/* Expanded detail: SCRVNR feedback + override form */}
              {isOpen && (
                <div className="pl-2 pt-1 space-y-3 border-l-2 border-muted ml-2">

                  {/* Failed sections */}
                  {result?.failedSections && result.failedSections.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-status-danger flex items-center gap-1 mb-1">
                        <AlertTriangle className="h-3 w-3" />Failed sections
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {result.failedSections.map(s => (
                          <span key={s} className="text-[11px] bg-status-danger-bg text-status-danger px-2 py-0.5 rounded border border-status-danger-border">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Review note if exists */}
                  {page.reviewNote && (
                    <p className="text-xs text-muted-foreground italic">Note: {page.reviewNote}</p>
                  )}

                  {/* Override form for failed pages */}
                  {isFailed && !isApproved && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-status-warning">
                        Override SCRVNR failure — note required
                      </p>
                      <Textarea
                        value={overrideNote[page.id] ?? ""}
                        onChange={e => setOverrideNote(n => ({ ...n, [page.id]: e.target.value }))}
                        placeholder="Explain why this page is acceptable despite failing SCRVNR..."
                        className="h-20 text-sm resize-none"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-status-warning-border text-status-warning hover:bg-status-warning-bg"
                        disabled={!overrideNote[page.id]?.trim() || isBusy}
                        onClick={() =>
                          reviewPage(page.id, "approved", { overrideNote: overrideNote[page.id] })
                        }
                      >
                        {isBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldAlert className="h-3 w-3 mr-1" />}
                        Override & Approve
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
