"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import { ArrowLeft, CheckCircle2, Circle, ChevronDown, ChevronUp } from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface SubmissionData {
  id: number;
  submittedAt: string;
  onboardingComplete: boolean;
  submittedData: Record<string, unknown> | null;
  opsChecklist: Record<string, { completed: boolean; note?: string }> | null;
  lead: {
    id: number;
    businessName: string;
    city: string;
    state: string;
    email: string | null;
    phone: string | null;
  } | null;
  token: {
    generatedByUser: { id: number; name: string; email: string } | null;
  } | null;
}

// ─── Checklist definition ────────────────────────────────────────────────────

interface ChecklistItem {
  key: string;
  label: string;
  description?: string;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  { key: "nap_verified", label: "NAP verified", description: "Name, address, phone matches lead record" },
  { key: "dns_received", label: "DNS access received", description: "Provider login or invite confirmed" },
  { key: "gbp_access", label: "GBP access", description: "Google Business Profile invite accepted" },
  { key: "analytics_setup", label: "Analytics setup", description: "GA4 configured or access received" },
  { key: "search_console", label: "Search Console access", description: "Ownership verified" },
  { key: "cms_access", label: "CMS access", description: "WordPress / platform login confirmed" },
  { key: "comp_audit", label: "Competitor audit started", description: "Initial research kicked off" },
  { key: "work_order", label: "Work order issued", description: "Service agreement finalized" },
  { key: "onboarding_done", label: "Onboarding complete", description: "All blockers resolved, active" },
  { key: "first_invoice", label: "First invoice sent", description: "Billing initiated" },
];

// ─── Helper ──────────────────────────────────────────────────────────────────

function getStr(data: Record<string, unknown> | null, key: string): string {
  if (!data) return "";
  const val = data[key];
  return typeof val === "string" ? val : "";
}

function getArr(data: Record<string, unknown> | null, key: string): string[] {
  if (!data) return [];
  const val = data[key];
  return Array.isArray(val) ? val.map(String) : [];
}

function getObj(data: Record<string, unknown> | null, key: string): Record<string, unknown> {
  if (!data) return {};
  const val = data[key];
  return val && typeof val === "object" && !Array.isArray(val) ? (val as Record<string, unknown>) : {};
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-lg border overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-sm font-medium"
        onClick={() => setOpen(!open)}
      >
        {title}
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-4 py-3 space-y-2">{children}</div>}
    </div>
  );
}

function DataRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-muted-foreground w-36 shrink-0">{label}</span>
      <span className="font-medium">{value || "—"}</span>
    </div>
  );
}

// ─── Checklist item with inline note ─────────────────────────────────────────

function ChecklistRow({
  item,
  state,
  onToggle,
  onNote,
  saving,
}: {
  item: ChecklistItem;
  state: { completed: boolean; note?: string };
  onToggle: () => void;
  onNote: (note: string) => void;
  saving: boolean;
}) {
  const [showNote, setShowNote] = useState(!!state.note);
  const [noteValue, setNoteValue] = useState(state.note ?? "");

  return (
    <div className={`rounded-lg border p-3 space-y-2 transition-colors ${state.completed ? "bg-status-success-bg/50 border-status-success-border" : ""}`}>
      <div className="flex items-start gap-2">
        <button
          onClick={onToggle}
          disabled={saving}
          className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        >
          {state.completed ? (
            <CheckCircle2 className="h-5 w-5 text-status-success" />
          ) : (
            <Circle className="h-5 w-5" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${state.completed ? "line-through text-muted-foreground" : ""}`}>
            {item.label}
          </p>
          {item.description && (
            <p className="text-xs text-muted-foreground">{item.description}</p>
          )}
        </div>
        <button
          className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
          onClick={() => setShowNote(!showNote)}
        >
          {showNote ? "hide note" : state.note ? "edit note" : "+ note"}
        </button>
      </div>
      {showNote && (
        <div className="pl-7 space-y-1">
          <Textarea
            value={noteValue}
            onChange={(e) => setNoteValue(e.target.value)}
            placeholder="Add a note for this item..."
            rows={2}
            className="resize-none text-xs"
          />
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-7"
            disabled={saving || noteValue === (state.note ?? "")}
            onClick={() => onNote(noteValue)}
          >
            Save note
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function OnboardingDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [submission, setSubmission] = useState<SubmissionData | null>(null);
  const [checklist, setChecklist] = useState<Record<string, { completed: boolean; note?: string }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);

  const fetchSubmission = useCallback(async () => {
    try {
      const res = await fetch(`/api/onboarding/submissions/${id}`);
      const data = await res.json();
      if (res.ok) {
        setSubmission(data.data);
        setChecklist(data.data.opsChecklist ?? {});
      } else {
        toast.error(data.error || "Failed to load submission");
      }
    } catch {
      toast.error("Failed to load submission");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSubmission();
  }, [fetchSubmission]);

  const updateChecklist = async (key: string, completed: boolean, note?: string) => {
    setSaving(true);
    const prev = checklist;
    const next = {
      ...checklist,
      [key]: { completed, note: note ?? checklist[key]?.note ?? "" },
    };
    setChecklist(next);
    try {
      const res = await fetch(`/api/onboarding/submissions/${id}/checklist`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: [{ key, completed, note: note ?? checklist[key]?.note }] }),
      });
      if (!res.ok) {
        setChecklist(prev);
        toast.error("Failed to update checklist");
      }
    } catch {
      setChecklist(prev);
      toast.error("Failed to update checklist");
    } finally {
      setSaving(false);
    }
  };

  const handleMarkComplete = async () => {
    setCompleting(true);
    try {
      const res = await fetch(`/api/onboarding/submissions/${id}/complete`, {
        method: "PATCH",
      });
      if (res.ok) {
        toast.success("Onboarding marked complete!");
        fetchSubmission();
      } else {
        toast.error("Failed to mark complete");
      }
    } catch {
      toast.error("Failed to mark complete");
    } finally {
      setCompleting(false);
    }
  };

  const done = CHECKLIST_ITEMS.filter((i) => checklist[i.key]?.completed).length;
  const total = CHECKLIST_ITEMS.length;
  const pct = Math.round((done / total) * 100);

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-muted/50 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="p-6 max-w-5xl mx-auto text-center">
        <p className="text-muted-foreground">Submission not found.</p>
        <Link href="/clients/onboarding">
          <Button variant="outline" size="sm" className="mt-4">← Back to queue</Button>
        </Link>
      </div>
    );
  }

  const sd = submission.submittedData;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/clients/onboarding" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-1">
            <ArrowLeft className="h-4 w-4" /> Back to queue
          </Link>
          <h1 className="text-2xl font-bold">
            {submission.lead?.businessName ?? "Onboarding Submission"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Submitted {format(new Date(submission.submittedAt), "MMM d, yyyy")}
            {submission.token?.generatedByUser && ` · Partner: ${submission.token.generatedByUser.name}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {submission.onboardingComplete ? (
            <Badge variant="outline" className="text-status-success border-status-success-border bg-status-success-bg">
              Onboarding Complete
            </Badge>
          ) : (
            <Button
              onClick={handleMarkComplete}
              disabled={completing}
              size="sm"
            >
              {completing ? "Saving..." : "Mark Onboarding Complete"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ── Left: Ops checklist ─────────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Ops Checklist</h2>
            <span className="text-sm text-muted-foreground">{done}/{total} · {pct}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="space-y-2">
            {CHECKLIST_ITEMS.map((item) => (
              <ChecklistRow
                key={item.key}
                item={item}
                state={checklist[item.key] ?? { completed: false }}
                onToggle={() => updateChecklist(item.key, !(checklist[item.key]?.completed ?? false))}
                onNote={(note) => updateChecklist(item.key, checklist[item.key]?.completed ?? false, note)}
                saving={saving}
              />
            ))}
          </div>
        </div>

        {/* ── Right: Submission data ───────────────────────────────────────── */}
        <div className="space-y-4">
          <h2 className="font-medium">Submission Data</h2>

          <SectionCard title="Business Info">
            <DataRow label="Business name" value={getStr(sd, "businessName")} />
            <DataRow label="Address" value={[getStr(sd, "address"), getStr(sd, "city"), getStr(sd, "state"), getStr(sd, "zip")].filter(Boolean).join(", ")} />
            <DataRow label="Phone" value={getStr(sd, "phone")} />
            <DataRow label="Website" value={getStr(sd, "website")} />
            <DataRow label="Services" value={getStr(sd, "services")} />
            <DataRow label="Multi-location" value={getStr(sd, "multiLocation") || undefined} />
          </SectionCard>

          <SectionCard title="Contacts">
            {(() => {
              const primary = getObj(sd, "primaryContact");
              const billing = getObj(sd, "billingContact");
              return (
                <>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Primary</p>
                  <DataRow label="Name" value={getStr(primary as Record<string, unknown>, "name")} />
                  <DataRow label="Email" value={getStr(primary as Record<string, unknown>, "email")} />
                  <DataRow label="Phone" value={getStr(primary as Record<string, unknown>, "phone")} />
                  <DataRow label="Role" value={getStr(primary as Record<string, unknown>, "role")} />
                  <DataRow label="Preferred contact" value={getStr(primary as Record<string, unknown>, "preferredContact")} />
                  <Separator className="my-2" />
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Billing</p>
                  <DataRow label="Same as primary" value={getStr(sd, "billingSameAsPrimary") === "true" ? "Yes" : "No"} />
                  {getStr(sd, "billingSameAsPrimary") !== "true" && (
                    <>
                      <DataRow label="Name" value={getStr(billing as Record<string, unknown>, "name")} />
                      <DataRow label="Email" value={getStr(billing as Record<string, unknown>, "email")} />
                    </>
                  )}
                  <DataRow label="Payment method" value={getStr(sd, "paymentMethod")} />
                </>
              );
            })()}
          </SectionCard>

          <SectionCard title="Technical Access">
            {(() => {
              const access = getObj(sd, "technicalAccess") as Record<string, { has: string; method: string; notes?: string }>;
              const sections = [
                { key: "dns", label: "DNS / Domain" },
                { key: "gbp", label: "Google Business Profile" },
                { key: "analytics", label: "Google Analytics" },
                { key: "searchConsole", label: "Search Console" },
                { key: "cms", label: "CMS" },
                { key: "adAccounts", label: "Ad Accounts" },
              ];
              return sections.map(({ key, label }) => {
                const item = access[key];
                if (!item) return <DataRow key={key} label={label} value="Not provided" />;
                return (
                  <div key={key} className="text-sm">
                    <span className="text-muted-foreground w-36 inline-block">{label}</span>
                    <span className="font-medium capitalize">{item.has === "yes" ? `Has it · ${item.method || "method TBD"}` : item.has === "no" ? "Doesn't have it" : item.has === "not_sure" ? "Not sure" : item.has}</span>
                    {item.notes && <p className="text-xs text-muted-foreground ml-36">{item.notes}</p>}
                  </div>
                );
              });
            })()}
          </SectionCard>

          <SectionCard title="Market & Content">
            <DataRow label="Competitors" value={getArr(sd, "competitors").filter(Boolean).join(", ") || "None listed"} />
            <DataRow label="Competitor pains" value={getArr(sd, "competitorPains").join(", ") || "None checked"} />
            <DataRow label="Content topics" value={getStr(sd, "contentTopics")} />
            <DataRow label="Topics to avoid" value={getStr(sd, "topicsToAvoid")} />
            <DataRow label="Brand tone" value={getStr(sd, "brandTone")} />
            <DataRow label="Review preference" value={getStr(sd, "reviewPreference")} />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
