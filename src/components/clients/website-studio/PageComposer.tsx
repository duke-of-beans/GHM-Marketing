"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, XCircle, AlertCircle, Loader2, ShieldCheck, ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { ComposerPage, ScrvnrGateStatus, ScrvnrComposerFeedback } from "@/types/website-studio";

// Default section stacks per tier (shown as empty slots until filled)
const DEFAULT_SECTIONS = ["hero", "services", "why-us", "cta"];

interface Props {
  clientId: number;
  job: any;
  initialPageId: number | null;
  onBack: () => void;
  onRefresh: () => void;
}

export function PageComposer({ clientId, job, initialPageId, onBack, onRefresh }: Props) {
  const [pages, setPages] = useState<ComposerPage[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<number | null>(initialPageId);
  const [sections, setSections] = useState<Record<string, string>>({});
  const [scrvnrStatus, setScrvnrStatus] = useState<ScrvnrGateStatus>("unprocessed");
  const [sectionFeedback, setSectionFeedback] = useState<ScrvnrComposerFeedback[]>([]);
  const [runningScrvnr, setRunningScrvnr] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedPage = pages.find((p) => p.id === selectedPageId) ?? null;
  const sectionKeys = selectedPage
    ? Object.keys((selectedPage.sections as any) ?? {}).length > 0
      ? Object.keys(selectedPage.sections as any)
      : DEFAULT_SECTIONS
    : DEFAULT_SECTIONS;

  // Load pages for this job
  useEffect(() => {
    if (!job?.id) return;
    setLoading(true);
    fetch(`/api/website-studio/${clientId}`)
      .then((r) => r.json())
      .then((json) => {
        if (!json.success) throw new Error(json.error);
        const jobData = json.data.buildJobs?.find((j: any) => j.id === job.id);
        if (jobData?.pages) {
          setPages(jobData.pages);
          const target = jobData.pages.find((p: any) => p.id === initialPageId) ?? jobData.pages[0];
          if (target) loadPage(target);
        }
      })
      .catch((err) => toast.error(err.message ?? "Failed to load pages"))
      .finally(() => setLoading(false));
  }, [job?.id]);

  function loadPage(page: ComposerPage) {
    setSelectedPageId(page.id);
    const pageSections = page.sections as Record<string, string>;
    const keys = Object.keys(pageSections).length > 0 ? pageSections : Object.fromEntries(DEFAULT_SECTIONS.map((s) => [s, ""]));
    setSections(keys);
    setScrvnrStatus(page.scrvnrStatus as ScrvnrGateStatus);
    setSectionFeedback(
      (page.lastScrvnrResult as any)?.failedSections?.map((s: string) => ({
        section: s, pass: false, pass1_score: null, pass2_score: null, failures: [],
      })) ?? []
    );
  }

  // Auto-save on section change (debounced 1.2s)
  function handleSectionChange(key: string, value: string) {
    const updated = { ...sections, [key]: value };
    setSections(updated);
    setScrvnrStatus("unprocessed");

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => saveSections(updated), 1200);
  }

  async function saveSections(data: Record<string, string>) {
    if (!selectedPageId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/website-studio/${clientId}/pages/${selectedPageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections: data }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    } catch (err: any) {
      toast.error("Auto-save failed: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function runScrvnr(override = false, overrideNote = "") {
    if (!selectedPageId) return;
    const hasCopy = Object.values(sections).some((v) => v.trim().length > 0);
    if (!hasCopy) { toast.error("Add some copy before running SCRVNR."); return; }

    setRunningScrvnr(true);
    setScrvnrStatus("processing");
    setSectionFeedback([]);

    try {
      const res = await fetch(`/api/website-studio/${clientId}/scrvnr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId: selectedPageId, sections, override, overrideNote }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      const result = json.data.adapterResult ?? json.data;
      setScrvnrStatus(result.gate_open ? "cleared" : "failed");
      setSectionFeedback(result.composer_feedback ?? []);

      if (result.gate_open) {
        toast.success("SCRVNR cleared — gate open.");
      } else {
        toast.error(`SCRVNR failed — ${result.action_required}`);
      }

      // Refresh page list to get updated status counts
      setPages((prev) =>
        prev.map((p) =>
          p.id === selectedPageId
            ? { ...p, scrvnrStatus: result.gate_open ? "cleared" : "failed" }
            : p
        )
      );
    } catch (err: any) {
      toast.error("SCRVNR error: " + err.message);
      setScrvnrStatus("unprocessed");
    } finally {
      setRunningScrvnr(false);
    }
  }

  async function submitForReview() {
    if (!selectedPageId) return;
    if (scrvnrStatus !== "cleared") { toast.error("Page must pass SCRVNR before review."); return; }
    try {
      const res = await fetch(`/api/website-studio/${clientId}/pages/${selectedPageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewStatus: "pending" }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast.success("Submitted for review.");
      setPages((prev) =>
        prev.map((p) => (p.id === selectedPageId ? { ...p, reviewStatus: "pending" } : p))
      );
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading composer...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="h-7 px-2 -ml-2">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
          </Button>
          <span className="text-sm font-medium">
            {job?.property?.brandSegment} · {job?.property?.tier?.replace("tier","T")} — Page Composer
          </span>
          {saving && <span className="text-xs text-muted-foreground">Saving...</span>}
        </div>
        <ScrvnrGateBadge status={scrvnrStatus} />
      </div>

      <div className="grid grid-cols-[200px_1fr] gap-4">
        {/* Page list */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1 pb-1">Pages</p>
          {pages.map((page) => (
            <button
              key={page.id}
              onClick={() => loadPage(page)}
              className={`w-full text-left rounded px-2 py-1.5 text-sm transition-colors ${
                page.id === selectedPageId
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-muted"
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="truncate">{page.title}</span>
                <PageStatusIcon status={page.scrvnrStatus as ScrvnrGateStatus} reviewStatus={page.reviewStatus} />
              </div>
            </button>
          ))}
        </div>

        {/* Section editor */}
        <div className="space-y-4">
          {selectedPage ? (
            <>
              {sectionKeys.map((key) => {
                const feedback = sectionFeedback.find((f) => f.section === key);
                return (
                  <SectionEditor
                    key={key}
                    sectionKey={key}
                    value={sections[key] ?? ""}
                    feedback={feedback ?? null}
                    onChange={(v) => handleSectionChange(key, v)}
                  />
                );
              })}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => runScrvnr()}
                  disabled={runningScrvnr}
                >
                  {runningScrvnr ? (
                    <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Running...</>
                  ) : (
                    <><ShieldCheck className="h-3.5 w-3.5 mr-1.5" /> Run SCRVNR</>
                  )}
                </Button>
                <Button
                  size="sm"
                  onClick={submitForReview}
                  disabled={scrvnrStatus !== "cleared"}
                >
                  Submit for Review
                </Button>
                {scrvnrStatus === "failed" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground text-xs"
                    onClick={() => {
                      const note = prompt("Override reason (required):");
                      if (note) runScrvnr(true, note);
                    }}
                  >
                    Override Gate
                  </Button>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Select a page to start composing.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Section Editor ────────────────────────────────────────────────────────────

function SectionEditor({
  sectionKey,
  value,
  feedback,
  onChange,
}: {
  sectionKey: string;
  value: string;
  feedback: ScrvnrComposerFeedback | null;
  onChange: (v: string) => void;
}) {
  const label = sectionKey.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const failed = feedback !== null && !feedback.pass;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</label>
        {feedback && (
          feedback.pass
            ? <CheckCircle2 className="h-3.5 w-3.5 text-status-success" />
            : <XCircle className="h-3.5 w-3.5 text-status-danger" />
        )}
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className={`resize-y text-sm ${failed ? "border-status-danger-border focus-visible:ring-red-400" : ""}`}
        placeholder={`Write ${label.toLowerCase()} copy...`}
      />
      {failed && feedback?.failures && feedback.failures.length > 0 && (
        <ul className="text-xs text-status-danger space-y-0.5 pl-1">
          {feedback.failures.map((f, i) => (
            <li key={i}>· {f}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Status indicators ─────────────────────────────────────────────────────────

function ScrvnrGateBadge({ status }: { status: ScrvnrGateStatus }) {
  const configs: Record<ScrvnrGateStatus, { label: string; className: string; icon: React.ReactNode }> = {
    unprocessed: { label: "Not checked",  className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400", icon: null },
    processing:  { label: "Running...",   className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300", icon: <Loader2 className="h-3 w-3 animate-spin" /> },
    cleared:     { label: "Gate: OPEN",   className: "bg-status-success-bg text-status-success", icon: <ShieldCheck className="h-3 w-3" /> },
    failed:      { label: "Gate: CLOSED", className: "bg-status-danger-bg text-status-danger", icon: <ShieldX className="h-3 w-3" /> },
    override:    { label: "Override",     className: "bg-status-warning-bg text-status-warning", icon: <AlertCircle className="h-3 w-3" /> },
  };
  const cfg = configs[status] ?? configs.unprocessed;
  return (
    <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.className}`}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

function PageStatusIcon({ status, reviewStatus }: { status: ScrvnrGateStatus; reviewStatus: string }) {
  if (reviewStatus === "approved") return <CheckCircle2 className="h-3 w-3 text-status-success shrink-0" />;
  if (status === "cleared") return <CheckCircle2 className="h-3 w-3 text-status-success shrink-0" />;
  if (status === "failed") return <XCircle className="h-3 w-3 text-status-danger shrink-0" />;
  if (status === "override") return <AlertCircle className="h-3 w-3 text-status-warning shrink-0" />;
  return null;
}
