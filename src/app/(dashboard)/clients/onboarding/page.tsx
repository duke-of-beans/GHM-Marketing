"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow, format } from "date-fns";
import { Search, ExternalLink } from "lucide-react";

interface Submission {
  id: number;
  submittedAt: string;
  onboardingComplete: boolean;
  opsChecklist: Record<string, { completed: boolean; note?: string }> | null;
  lead: { id: number; businessName: string; city: string; state: string } | null;
  token: {
    generatedByUser: { id: number; name: string } | null;
  } | null;
}

function checklistProgress(checklist: Submission["opsChecklist"]): { done: number; total: number } {
  if (!checklist) return { done: 0, total: 8 };
  const keys = Object.keys(checklist);
  const done = keys.filter((k) => checklist[k].completed).length;
  return { done, total: Math.max(keys.length, 8) };
}

export default function OnboardingQueuePage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "complete">("pending");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const complete = filter === "all" ? null : filter === "complete" ? "true" : "false";
    const url = complete !== null
      ? `/api/onboarding/submissions?complete=${complete}`
      : "/api/onboarding/submissions";
    fetch(url)
      .then((r) => r.json())
      .then((data) => setSubmissions(data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  const filtered = submissions.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.lead?.businessName?.toLowerCase().includes(q) ||
      s.token?.generatedByUser?.name?.toLowerCase().includes(q)
    );
  });

  const pending = submissions.filter((s) => !s.onboardingComplete).length;
  const complete = submissions.filter((s) => s.onboardingComplete).length;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Onboarding Queue</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Client submissions awaiting ops processing
          </p>
        </div>
        <div className="flex gap-4 text-sm text-center">
          <div>
            <p className="text-2xl font-bold text-amber-600">{pending}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{complete}</p>
            <p className="text-xs text-muted-foreground">Complete</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search client or partner..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex gap-1">
          {(["pending", "complete", "all"] as const).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "outline"}
              onClick={() => setFilter(f)}
              className="capitalize"
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-14 bg-muted/50 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm">No submissions found</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium text-xs uppercase tracking-wide text-muted-foreground">Client</th>
                <th className="text-left p-3 font-medium text-xs uppercase tracking-wide text-muted-foreground">Partner</th>
                <th className="text-left p-3 font-medium text-xs uppercase tracking-wide text-muted-foreground">Submitted</th>
                <th className="text-left p-3 font-medium text-xs uppercase tracking-wide text-muted-foreground">Progress</th>
                <th className="text-left p-3 font-medium text-xs uppercase tracking-wide text-muted-foreground">Status</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((s) => {
                const { done, total } = checklistProgress(s.opsChecklist);
                const pct = Math.round((done / total) * 100);
                return (
                  <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <p className="font-medium">{s.lead?.businessName ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.lead?.city}, {s.lead?.state}
                      </p>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {s.token?.generatedByUser?.name ?? "—"}
                    </td>
                    <td className="p-3 text-muted-foreground whitespace-nowrap">
                      {format(new Date(s.submittedAt), "MMM d")}
                      <span className="block text-xs">
                        {formatDistanceToNow(new Date(s.submittedAt), { addSuffix: true })}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden w-24">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {done}/{total}
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      {s.onboardingComplete ? (
                        <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50 dark:bg-green-950/30">
                          ✅ Done
                        </Badge>
                      ) : (
                        <Badge variant="secondary">⏳ In Progress</Badge>
                      )}
                    </td>
                    <td className="p-3">
                      <Link href={`/clients/onboarding/${s.id}`}>
                        <Button size="sm" variant="ghost" className="gap-1">
                          View <ExternalLink className="h-3 w-3" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
