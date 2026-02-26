"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUp, ArrowDown, Minus, Plus, RefreshCw, Search } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface Snapshot {
  organicPosition: number | null;
  localPackPosition: number | null;
  previousOrganic: number | null;
  previousLocalPack: number | null;
  scanDate: string;
  serpFeatures: string[];
  localPackBusiness: string | null;
}

interface KeywordTracker {
  id: number;
  keyword: string;
  category: string | null;
  searchVolume: number | null;
  difficulty: number | null;
  isActive: boolean;
  snapshots: Snapshot[];
}

interface RankingSummary {
  total: number;
  inTop3: number;
  inLocalPack: number;
  avgPosition: number | null;
  lastScanDate: string | null;
}

// ============================================================================
// Helpers
// ============================================================================

function PositionDelta({ current, previous }: { current: number | null; previous: number | null }) {
  if (current === null) return <span className="text-gray-400 text-xs">—</span>;
  if (previous === null) return <span className="text-xs text-blue-500">New</span>;
  const delta = previous - current; // positive = improved (moved up)
  if (delta === 0) return <Minus className="h-3 w-3 text-gray-400 inline" />;
  if (delta > 0) return (
    <span className="text-status-success text-xs flex items-center gap-0.5">
      <ArrowUp className="h-3 w-3" />{delta}
    </span>
  );
  return (
    <span className="text-status-danger text-xs flex items-center gap-0.5">
      <ArrowDown className="h-3 w-3" />{Math.abs(delta)}
    </span>
  );
}

function PositionBadge({ pos, type }: { pos: number | null; type: "organic" | "pack" }) {
  if (pos === null) return <span className="text-gray-400 text-sm">—</span>;
  const color = pos <= 3 ? "bg-status-success-bg text-status-success" : pos <= 10 ? "bg-status-warning-bg text-status-warning" : "bg-gray-100 text-gray-600";
  return (
    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${color}`}>
      #{pos}
    </span>
  );
}

// ============================================================================
// Add Keywords Dialog
// ============================================================================

function AddKeywordsDialog({ clientId, onAdded }: { clientId: number; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [raw, setRaw] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAdd() {
    const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    setLoading(true);
    try {
      await fetch(`/api/clients/${clientId}/keywords`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lines.map((keyword) => ({ keyword, category: category || undefined }))),
      });
      setRaw("");
      setCategory("");
      setOpen(false);
      onAdded();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-1" /> Add Keywords
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Keywords</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Keywords (one per line)</label>
            <textarea
              className="w-full border rounded p-2 text-sm min-h-[120px] font-mono"
              placeholder={"plumber near me\nemergency plumber\ndrain cleaning"}
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Category (optional)</label>
            <Input
              placeholder="e.g. Emergency Services"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
          <Button onClick={handleAdd} disabled={loading || !raw.trim()} className="w-full">
            {loading ? "Adding..." : `Add ${raw.split("\n").filter(Boolean).length} keywords`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Main Rankings Tab
// ============================================================================

export function RankingsTab({ clientId }: { clientId: number }) {
  const [keywords, setKeywords] = useState<KeywordTracker[]>([]);
  const [summary, setSummary] = useState<RankingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/keywords`);
      const data = await res.json();
      setKeywords(data.keywords ?? []);
      setSummary(data.summary ?? null);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  async function handleScanNow() {
    setScanning(true);
    try {
      await fetch(`/api/clients/${clientId}/keywords/scan`, { method: "POST" });
      alert("Rank scan queued. Results will appear in ~5 minutes.");
    } finally {
      setScanning(false);
    }
  }

  async function handleDeactivate(kwId: number) {
    await fetch(`/api/clients/${clientId}/keywords/${kwId}`, { method: "DELETE" });
    load();
  }

  // Filtered keywords
  const activeKeywords = keywords.filter((k) => k.isActive);
  const categories = Array.from(
    new Set(activeKeywords.map((k) => k.category).filter(Boolean))
  ) as string[];

  const filtered = activeKeywords.filter((k) => {
    if (search && !k.keyword.includes(search.toLowerCase())) return false;
    if (categoryFilter !== "all" && k.category !== categoryFilter) return false;
    return true;
  });

  // Group by category for cluster view
  const grouped = categories.reduce<Record<string, KeywordTracker[]>>((acc, cat) => {
    acc[cat] = filtered.filter((k) => k.category === cat);
    return acc;
  }, {});
  const uncategorized = filtered.filter((k) => !k.category);
  if (uncategorized.length > 0) grouped["Uncategorized"] = uncategorized;

  if (loading) return <div className="p-6 text-sm text-gray-500">Loading rankings...</div>;

  return (
    <div className="space-y-6 p-4">
      {/* Summary KPIs */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Tracked Keywords", value: summary.total },
            { label: "In Top 3", value: summary.inTop3 },
            { label: "In Local Pack", value: summary.inLocalPack },
            { label: "Avg. Position", value: summary.avgPosition ?? "—" },
          ].map((stat) => (
            <div key={stat.label} className="border rounded-lg p-3 bg-white">
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            className="pl-8 text-sm"
            placeholder="Search keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {categories.length > 0 && (
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40 text-sm">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <AddKeywordsDialog clientId={clientId} onAdded={load} />
        <Button size="sm" variant="outline" onClick={handleScanNow} disabled={scanning}>
          <RefreshCw className={`h-4 w-4 mr-1 ${scanning ? "animate-spin" : ""}`} />
          {scanning ? "Queuing..." : "Run Scan Now"}
        </Button>
      </div>

      {/* Last scan info */}
      {summary?.lastScanDate && (
        <p className="text-xs text-gray-400">
          Last scan: {new Date(summary.lastScanDate).toLocaleString()} · Biweekly schedule active
        </p>
      )}

      {/* No keywords state */}
      {activeKeywords.length === 0 && (
        <div className="border rounded-lg p-8 text-center text-gray-500">
          <p className="text-sm mb-2">No keywords being tracked yet.</p>
          <p className="text-xs">Add keywords above to start tracking local rankings.</p>
        </div>
      )}

      {/* Keyword table grouped by category */}
      {Object.entries(grouped).map(([cat, kws]) => (
        <div key={cat} className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 flex items-center justify-between border-b">
            <span className="text-sm font-medium">{cat}</span>
            <span className="text-xs text-gray-400">{kws.length} keywords</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs text-gray-500 bg-gray-50/50">
                <th className="text-left py-2 px-4 font-medium">Keyword</th>
                <th className="text-center py-2 px-3 font-medium">Organic</th>
                <th className="text-center py-2 px-3 font-medium">Δ</th>
                <th className="text-center py-2 px-3 font-medium">Local Pack</th>
                <th className="text-center py-2 px-3 font-medium">Δ</th>
                <th className="text-right py-2 px-4 font-medium">Vol.</th>
                <th className="text-right py-2 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {kws.map((kw) => {
                const snap = kw.snapshots[0] ?? null;
                return (
                  <tr key={kw.id} className="border-b last:border-0 hover:bg-gray-50/50">
                    <td className="py-2 px-4 font-mono text-xs">{kw.keyword}</td>
                    <td className="py-2 px-3 text-center">
                      <PositionBadge pos={snap?.organicPosition ?? null} type="organic" />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <PositionDelta
                        current={snap?.organicPosition ?? null}
                        previous={snap?.previousOrganic ?? null}
                      />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <PositionBadge pos={snap?.localPackPosition ?? null} type="pack" />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <PositionDelta
                        current={snap?.localPackPosition ?? null}
                        previous={snap?.previousLocalPack ?? null}
                      />
                    </td>
                    <td className="py-2 px-4 text-right text-xs text-gray-500">
                      {kw.searchVolume ? kw.searchVolume.toLocaleString() : "—"}
                    </td>
                    <td className="py-2 px-4 text-right">
                      <button
                        onClick={() => handleDeactivate(kw.id)}
                        className="text-xs text-gray-400 hover:text-status-danger"
                        title="Remove keyword"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
