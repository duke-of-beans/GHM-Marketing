"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Database, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface CostData {
  ai: {
    last30Days:  { totalUSD: string; callCount: number };
    thisMonth:   { totalUSD: string };
    byFeature:   { feature: string; totalUSD: string; callCount: number }[];
    trend7:      { day: string; total: string }[];
  };
  enrichment: {
    last30Days:  { totalUSD: string; callCount: number };
    byProvider:  { provider: string; totalUSD: string; callCount: number }[];
  };
  cache: {
    totalEntries:   number;
    expiredEntries: number;
    validEntries:   number;
    byProvider:     { provider: string; count: number }[];
  };
}

export function CostDashboard() {
  const [data, setData]         = useState<CostData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [flushing, setFlushing] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const res  = await fetch("/api/settings/costs");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setData(json.data);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to load cost data");
    } finally {
      setLoading(false);
    }
  }

  async function flushExpiredCache() {
    try {
      setFlushing(true);
      const res  = await fetch("/api/settings/costs", { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast.success(`Cleared ${json.data.deleted} expired cache entries`);
      load();
    } catch (err: any) {
      toast.error(err.message ?? "Cache flush failed");
    } finally {
      setFlushing(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const totalLast30 = (
    parseFloat(data.ai.last30Days.totalUSD) +
    parseFloat(data.enrichment.last30Days.totalUSD)
  ).toFixed(4);

  return (
    <div className="space-y-6">

      {/* Summary row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total (30d)" value={`$${totalLast30}`} sub="AI + enrichment" />
        <StatCard label="AI This Month" value={`$${data.ai.thisMonth.totalUSD}`} sub={`${data.ai.last30Days.callCount} calls`} />
        <StatCard label="Enrichment (30d)" value={`$${data.enrichment.last30Days.totalUSD}`} sub={`${data.enrichment.last30Days.callCount} calls`} />
        <StatCard label="Cache Entries" value={String(data.cache.validEntries)} sub={`${data.cache.expiredEntries} expired`} />
      </div>

      {/* AI by feature */}
      {data.ai.byFeature.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              AI Cost by Feature (30d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground uppercase border-b">
                  <th className="text-left pb-2">Feature</th>
                  <th className="text-right pb-2">Calls</th>
                  <th className="text-right pb-2">Cost</th>
                </tr>
              </thead>
              <tbody>
                {data.ai.byFeature.map((f) => (
                  <tr key={f.feature} className="border-b last:border-0">
                    <td className="py-2 font-mono text-xs">{f.feature}</td>
                    <td className="py-2 text-right text-muted-foreground">{f.callCount.toLocaleString()}</td>
                    <td className="py-2 text-right">${f.totalUSD}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Enrichment by provider */}
      {data.enrichment.byProvider.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Enrichment Cost by Provider (30d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground uppercase border-b">
                  <th className="text-left pb-2">Provider</th>
                  <th className="text-right pb-2">Calls</th>
                  <th className="text-right pb-2">Cost</th>
                </tr>
              </thead>
              <tbody>
                {data.enrichment.byProvider.map((p) => (
                  <tr key={p.provider} className="border-b last:border-0">
                    <td className="py-2 capitalize">{p.provider}</td>
                    <td className="py-2 text-right text-muted-foreground">{p.callCount.toLocaleString()}</td>
                    <td className="py-2 text-right">${p.totalUSD}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Cache stats */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Database className="h-4 w-4" />
              Enrichment Cache
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={flushExpiredCache}
              disabled={flushing || data.cache.expiredEntries === 0}
              className="gap-1.5 h-7 text-xs"
            >
              <Trash2 className={`h-3 w-3 ${flushing ? "animate-spin" : ""}`} />
              Flush Expired ({data.cache.expiredEntries})
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {data.cache.byProvider.map((p) => (
              <Badge key={p.provider} variant="secondary" className="gap-1">
                {p.provider}
                <span className="font-mono">{p.count}</span>
              </Badge>
            ))}
            {data.cache.byProvider.length === 0 && (
              <p className="text-sm text-muted-foreground">No cache entries yet.</p>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            {data.cache.validEntries} valid · {data.cache.expiredEntries} expired · {data.cache.totalEntries} total
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={load} className="gap-1.5 text-xs">
          <RefreshCw className="h-3 w-3" />
          Refresh
        </Button>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-lg border px-4 py-3 text-center">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
    </div>
  );
}
