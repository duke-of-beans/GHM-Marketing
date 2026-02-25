"use client";

/**
 * WebsiteAuditPanel — FEAT-024
 * Run and display website audits for a client.
 * Shows scores, meta summary, and prioritized issue list.
 */

import { useState, useEffect, useCallback } from "react";
import {
  Globe, Play, RefreshCw, ChevronDown, ChevronUp,
  CheckCircle2, AlertTriangle, Info, Shield, Smartphone,
  FileText, MapPin, ArrowUpRight, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { toast } from "sonner";
import type { AuditIssue } from "@/lib/website-audit/auditor";

interface AuditSummary {
  id: number;
  url: string;
  runAt: string;
  scorePerformance: number | null;
  scoreAccessibility: number | null;
  scoreSeo: number | null;
  scoreBestPractices: number | null;
  ssl: boolean | null;
  mobile: boolean | null;
  hasSitemap: boolean | null;
  hasRobots: boolean | null;
  metaTitle: string | null;
  metaDescription: string | null;
  h1: string | null;
  issues: AuditIssue[] | null;
}

function ScoreRing({ score, label }: { score: number | null; label: string }) {
  if (score === null) return (
    <div className="flex flex-col items-center gap-1">
      <div className="h-14 w-14 rounded-full border-4 border-muted flex items-center justify-center text-xs text-muted-foreground">—</div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
  const color = score >= 90 ? "border-green-500 text-green-600" : score >= 50 ? "border-yellow-500 text-yellow-600" : "border-red-500 text-red-600";
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`h-14 w-14 rounded-full border-4 ${color} flex items-center justify-center text-sm font-bold`}>{score}</div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function IssueBadge({ category }: { category: AuditIssue["category"] }) {
  if (category === "critical") return <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Critical</Badge>;
  if (category === "recommended") return <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-yellow-100 text-yellow-800 border-yellow-200">Recommended</Badge>;
  return <Badge variant="outline" className="text-[10px] px-1.5 py-0">Optional</Badge>;
}

function DimensionIcon({ dim }: { dim: AuditIssue["dimension"] }) {
  const cls = "h-3.5 w-3.5 flex-shrink-0 text-muted-foreground";
  switch (dim) {
    case "performance": return <RefreshCw className={cls} />;
    case "seo": return <Globe className={cls} />;
    case "accessibility": return <Info className={cls} />;
    case "technical": return <Shield className={cls} />;
    case "content": return <FileText className={cls} />;
  }
}

export function WebsiteAuditPanel({ clientId, websiteUrl }: { clientId: number; websiteUrl?: string | null }) {
  const [audits, setAudits] = useState<AuditSummary[]>([]);
  const [active, setActive] = useState<AuditSummary | null>(null);
  const [url, setUrl] = useState(websiteUrl ?? "");
  const [running, setRunning] = useState(false);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [showHistory, setShowHistory] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/clients/${clientId}/website-audit`);
    if (!res.ok) return;
    const data: AuditSummary[] = await res.json();
    setAudits(data);
    if (data.length > 0) setActive(data[0]);
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  async function runAudit() {
    if (!url.trim()) { toast.error("Enter a URL first"); return; }
    setRunning(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/website-audit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error ?? "Audit failed"); }
      const audit = await res.json();
      setAudits((prev) => [audit, ...prev]);
      setActive(audit);
      toast.success("Audit complete");
    } catch (err: any) {
      toast.error(err.message ?? "Audit failed");
    } finally {
      setRunning(false);
    }
  }

  function toggleIssue(idx: number) {
    setExpanded((prev) => { const n = new Set(prev); if (n.has(idx)) n.delete(idx); else n.add(idx); return n; });
  }

  const critical = active?.issues?.filter((i) => i.category === "critical") ?? [];

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4" />Website Audit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" className="flex-1" onKeyDown={(e) => { if (e.key === "Enter") runAudit(); }} />
            <Button onClick={runAudit} disabled={running} className="gap-1.5">
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {running ? "Running…" : "Run Audit"}
            </Button>
          </div>
          {running && <p className="text-xs text-muted-foreground mt-2 animate-pulse">Analyzing performance, SEO, technical health… this takes 20–30 seconds.</p>}
        </CardContent>
      </Card>

      {active && (
        <>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium truncate max-w-sm">{active.url}</p>
                <p className="text-xs text-muted-foreground">{format(new Date(active.runAt), "MMM d, yyyy 'at' h:mm a")}</p>
              </div>
              <a href={active.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground"><ArrowUpRight className="h-4 w-4" /></a>
            </div>

            <div className="flex gap-6 justify-center py-3 border rounded-xl bg-muted/30">
              <ScoreRing score={active.scorePerformance} label="Performance" />
              <ScoreRing score={active.scoreSeo} label="SEO" />
              <ScoreRing score={active.scoreAccessibility} label="Accessibility" />
              <ScoreRing score={active.scoreBestPractices} label="Best Practices" />
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              {[
                { label: "HTTPS", ok: active.ssl, icon: <Shield className="h-3 w-3" /> },
                { label: "Mobile", ok: active.mobile, icon: <Smartphone className="h-3 w-3" /> },
                { label: "Sitemap", ok: active.hasSitemap, icon: <MapPin className="h-3 w-3" /> },
                { label: "robots.txt", ok: active.hasRobots, icon: <FileText className="h-3 w-3" /> },
              ].map(({ label, ok, icon }) => (
                <div key={label} className={`flex items-center gap-1 rounded-full px-2.5 py-1 border ${ok ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
                  {ok ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                  {icon}{label}
                </div>
              ))}
            </div>

            {(active.metaTitle || active.metaDescription || active.h1) && (
              <div className="border rounded-lg p-3 space-y-1.5 text-xs bg-muted/20">
                {active.metaTitle && <p><span className="text-muted-foreground">Title:</span> {active.metaTitle}</p>}
                {active.h1 && <p><span className="text-muted-foreground">H1:</span> {active.h1}</p>}
                {active.metaDescription && <p><span className="text-muted-foreground">Description:</span> {active.metaDescription}</p>}
              </div>
            )}
          </div>

          {(active.issues?.length ?? 0) > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold">
                {active.issues!.length} Issue{active.issues!.length !== 1 ? "s" : ""}
                {critical.length > 0 && <span className="ml-2 text-red-600 text-xs font-normal">({critical.length} critical)</span>}
              </p>
              {active.issues!.map((issue, idx) => (
                <div key={idx} className="border rounded-lg overflow-hidden">
                  <button className="w-full flex items-center gap-2 p-3 text-left hover:bg-muted/40 transition-colors" onClick={() => toggleIssue(idx)}>
                    <DimensionIcon dim={issue.dimension} />
                    <span className="flex-1 text-sm">{issue.title}</span>
                    <IssueBadge category={issue.category} />
                    {expanded.has(idx) ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                  </button>
                  {expanded.has(idx) && (
                    <div className="px-3 pb-3 pt-0 text-xs text-muted-foreground space-y-1 border-t bg-muted/20">
                      <p className="pt-2">{issue.description}</p>
                      {issue.impact && <p className="text-orange-600 font-medium">Impact: {issue.impact}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {audits.length > 1 && (
            <div>
              <button onClick={() => setShowHistory(!showHistory)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                {showHistory ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                {showHistory ? "Hide" : "Show"} audit history ({audits.length})
              </button>
              {showHistory && (
                <div className="mt-2 space-y-1">
                  {audits.map((a) => (
                    <button key={a.id} onClick={() => setActive(a)} className={`w-full text-left flex items-center justify-between p-2 rounded-lg text-xs border transition-colors ${active.id === a.id ? "bg-primary/10 border-primary/30" : "hover:bg-muted/50"}`}>
                      <span className="text-muted-foreground">{format(new Date(a.runAt), "MMM d 'at' h:mm a")}</span>
                      <div className="flex gap-2"><span>Perf {a.scorePerformance ?? "—"}</span><span>SEO {a.scoreSeo ?? "—"}</span></div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {!active && !running && (
        <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
          <Globe className="h-8 w-8 text-muted-foreground opacity-30" />
          <p className="text-sm text-muted-foreground">No audits yet. Enter a URL above and run your first audit.</p>
        </div>
      )}
    </div>
  );
}
