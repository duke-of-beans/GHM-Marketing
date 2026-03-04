"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { ExternalLink, RefreshCw, Users } from "lucide-react";
import { useRouter } from "next/navigation";

type Site = { id: number; domain: string };
type Brief = {
  id: number; siteId: number; targetKeyword: string; contentType: string;
  status: string; assignedWriterName: string | null; wordCountTarget: number | null;
  publishedUrl: string | null; currentRankingPosition: number | null;
  peakRankingPosition: number | null; monthlyTrafficEstimate: number | null;
  attributedMonthlyRevenue: number | null; refreshDue: boolean;
  publishedDate: string | null; createdAt: string;
  site: { domain: string };
};

const STATUS_TABS = ["All", "BRIEFED", "IN_PROGRESS", "REVIEW", "PUBLISHED", "NEEDS_REFRESH"] as const;
const STATUS_LABELS: Record<string, string> = {
  BRIEFED: "Briefed", IN_PROGRESS: "In Progress", REVIEW: "Review",
  PUBLISHED: "Published", NEEDS_REFRESH: "Needs Refresh",
};

function statusBadge(status: string, refreshDue: boolean) {
  if (refreshDue) return <Badge className="bg-amber-100 text-amber-800 border-amber-300">Needs Refresh</Badge>;
  const colors: Record<string, string> = {
    BRIEFED: "bg-blue-100 text-blue-800",
    IN_PROGRESS: "bg-purple-100 text-purple-800",
    REVIEW: "bg-yellow-100 text-yellow-800",
    PUBLISHED: "bg-green-100 text-green-800",
  };
  return <Badge className={colors[status] ?? "bg-gray-100 text-gray-800"}>{STATUS_LABELS[status] ?? status}</Badge>;
}

function formatCurrency(n: number | null): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export function AffiliateContentCalendar({ sites, briefs: initialBriefs }: { sites: Site[]; briefs: Brief[] }) {
  const router = useRouter();
  const [briefs, setBriefs] = useState(initialBriefs);
  const [siteFilter, setSiteFilter] = useState<string>("all");
  const [statusTab, setStatusTab] = useState<string>("All");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [bulkWriter, setBulkWriter] = useState("");

  const filtered = useMemo(() => {
    let result = briefs;
    if (siteFilter !== "all") {
      result = result.filter(b => b.siteId === parseInt(siteFilter));
    }
    if (statusTab === "NEEDS_REFRESH") {
      result = result.filter(b => b.refreshDue);
      result.sort((a, b) => (b.attributedMonthlyRevenue ?? 0) - (a.attributedMonthlyRevenue ?? 0));
    } else if (statusTab !== "All") {
      result = result.filter(b => b.status === statusTab);
    }
    return result;
  }, [briefs, siteFilter, statusTab]);

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(b => b.id)));
    }
  };

  async function bulkAssign() {
    if (!bulkWriter.trim()) return;
    const ids = Array.from(selected);
    await Promise.all(ids.map(id =>
      fetch(`/api/affiliate/briefs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedWriterName: bulkWriter.trim() }),
      })
    ));
    setBriefs(prev => prev.map(b =>
      ids.includes(b.id) ? { ...b, assignedWriterName: bulkWriter.trim() } : b
    ));
    setSelected(new Set());
    setBulkAssignOpen(false);
    setBulkWriter("");
  }

  async function markRefreshed(id: number) {
    await fetch(`/api/affiliate/briefs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshDue: false }),
    });
    setBriefs(prev => prev.map(b => b.id === id ? { ...b, refreshDue: false } : b));
  }

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { All: briefs.length, NEEDS_REFRESH: 0 };
    for (const b of briefs) {
      counts[b.status] = (counts[b.status] ?? 0) + 1;
      if (b.refreshDue) counts.NEEDS_REFRESH++;
    }
    return counts;
  }, [briefs]);

  if (briefs.length === 0) {
    return <EmptyState title="No Content Briefs" description="Create content briefs from a site's Content tab to start tracking." />;
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={siteFilter} onValueChange={setSiteFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Sites" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sites</SelectItem>
            {sites.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.domain}</SelectItem>)}
          </SelectContent>
        </Select>
        {selected.size > 0 && (
          <Button size="sm" variant="outline" onClick={() => setBulkAssignOpen(true)}>
            <Users className="h-4 w-4 mr-1" /> Assign Writer ({selected.size})
          </Button>
        )}
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 border-b">
        {STATUS_TABS.map(tab => (
          <button key={tab} onClick={() => { setStatusTab(tab); setSelected(new Set()); }}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              statusTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}>
            {tab === "All" ? "All" : tab === "NEEDS_REFRESH" ? "Needs Refresh" : STATUS_LABELS[tab]}
            <span className="ml-1 text-xs text-muted-foreground">({tabCounts[tab] ?? 0})</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"><Checkbox checked={selected.size === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} /></TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Keyword</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Writer</TableHead>
                {(statusTab === "PUBLISHED" || statusTab === "All" || statusTab === "NEEDS_REFRESH") && (
                  <>
                    <TableHead>URL</TableHead>
                    <TableHead className="text-right">Position</TableHead>
                    <TableHead className="text-right">Traffic</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </>
                )}
                {statusTab === "NEEDS_REFRESH" && <TableHead className="w-24">Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">No briefs match this filter.</TableCell></TableRow>
              ) : filtered.map(brief => (
                <TableRow key={brief.id} className={brief.refreshDue ? "bg-amber-50" : ""}>
                  <TableCell><Checkbox checked={selected.has(brief.id)} onCheckedChange={() => toggleSelect(brief.id)} /></TableCell>
                  <TableCell className="font-medium">{brief.site.domain}</TableCell>
                  <TableCell>{brief.targetKeyword}</TableCell>
                  <TableCell className="capitalize">{brief.contentType.replace(/_/g, " ").toLowerCase()}</TableCell>
                  <TableCell>{statusBadge(brief.status, brief.refreshDue)}</TableCell>
                  <TableCell>{brief.assignedWriterName ?? "—"}</TableCell>
                  {(statusTab === "PUBLISHED" || statusTab === "All" || statusTab === "NEEDS_REFRESH") && (
                    <>
                      <TableCell>
                        {brief.publishedUrl ? (
                          <a href={brief.publishedUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" /> View
                          </a>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-right">{brief.currentRankingPosition ?? "—"}</TableCell>
                      <TableCell className="text-right">{brief.monthlyTrafficEstimate?.toLocaleString() ?? "—"}</TableCell>
                      <TableCell className="text-right">{formatCurrency(brief.attributedMonthlyRevenue)}</TableCell>
                    </>
                  )}
                  {statusTab === "NEEDS_REFRESH" && (
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => markRefreshed(brief.id)}>
                        <RefreshCw className="h-3 w-3 mr-1" /> Done
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Bulk Assign Dialog */}
      <Dialog open={bulkAssignOpen} onOpenChange={setBulkAssignOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Assign Writer</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Assign a writer to {selected.size} selected brief{selected.size !== 1 ? "s" : ""}.</p>
          <Input placeholder="Writer name" value={bulkWriter} onChange={(e) => setBulkWriter(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkAssignOpen(false)}>Cancel</Button>
            <Button onClick={bulkAssign} disabled={!bulkWriter.trim()}>Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
