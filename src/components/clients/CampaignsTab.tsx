"use client";

/**
 * CampaignsTab — Google Ads campaign + keyword performance
 * Shown on client detail page when a GoogleAdsConnection exists.
 */

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  AdsPerformanceData,
  CampaignData,
  AdKeywordData,
} from "@/lib/enrichment/providers/google-ads/campaigns";

// ─── Date range helpers ──────────────────────────────────────────────────────

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function getRange(preset: string): { startDate: string; endDate: string } {
  const now = new Date();
  const today = isoDate(now);
  switch (preset) {
    case "this_month":
      return { startDate: isoDate(new Date(now.getFullYear(), now.getMonth(), 1)), endDate: today };
    case "last_month":
      return {
        startDate: isoDate(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
        endDate:   isoDate(new Date(now.getFullYear(), now.getMonth(), 0)),
      };
    case "last_7":
      return { startDate: isoDate(new Date(Date.now() - 6 * 86_400_000)), endDate: today };
    case "last_30":
      return { startDate: isoDate(new Date(Date.now() - 29 * 86_400_000)), endDate: today };
    case "last_90":
      return { startDate: isoDate(new Date(Date.now() - 89 * 86_400_000)), endDate: today };
    default:
      return getRange("this_month");
  }
}

// ─── Formatters ──────────────────────────────────────────────────────────────

const fmt = {
  usd: (n: number) =>
    "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  pct: (n: number) => (n * 100).toFixed(2) + "%",
  int: (n: number) => n.toLocaleString("en-US"),
};

function StatusBadge({ status }: { status: string }) {
  if (status === "ENABLED")
    return <Badge className="bg-status-success-bg text-status-success border-status-success-border text-[10px]">Active</Badge>;
  if (status === "PAUSED")
    return <Badge className="bg-status-warning-bg text-status-warning border-status-warning-border text-[10px]">Paused</Badge>;
  return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
}

function KpiTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-muted/50 rounded-lg px-4 py-3 text-center">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Campaigns table ─────────────────────────────────────────────────────────

function CampaignsTable({ campaigns }: { campaigns: CampaignData[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Campaigns</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30 text-xs text-muted-foreground">
                <th className="text-left px-4 py-2 font-medium">Campaign</th>
                <th className="text-center px-3 py-2 font-medium">Status</th>
                <th className="text-right px-3 py-2 font-medium">Spend</th>
                <th className="text-right px-3 py-2 font-medium">Impr.</th>
                <th className="text-right px-3 py-2 font-medium">Clicks</th>
                <th className="text-right px-3 py-2 font-medium">CTR</th>
                <th className="text-right px-3 py-2 font-medium">Avg CPC</th>
                <th className="text-right px-3 py-2 font-medium">Conv.</th>
                <th className="text-right px-4 py-2 font-medium">CPA</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-2.5 font-medium max-w-[200px] truncate">{c.name}</td>
                  <td className="px-3 py-2.5 text-center"><StatusBadge status={c.status} /></td>
                  <td className="px-3 py-2.5 text-right">{fmt.usd(c.spend)}</td>
                  <td className="px-3 py-2.5 text-right text-muted-foreground">{fmt.int(c.impressions)}</td>
                  <td className="px-3 py-2.5 text-right">{fmt.int(c.clicks)}</td>
                  <td className="px-3 py-2.5 text-right">{fmt.pct(c.ctr)}</td>
                  <td className="px-3 py-2.5 text-right">{fmt.usd(c.avgCpc)}</td>
                  <td className="px-3 py-2.5 text-right">{fmt.int(c.conversions)}</td>
                  <td className="px-4 py-2.5 text-right">{c.cpa > 0 ? fmt.usd(c.cpa) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Keywords table ───────────────────────────────────────────────────────────

function KeywordsTable({ keywords }: { keywords: AdKeywordData[] }) {
  if (keywords.length === 0) return null;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Top Keywords</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30 text-xs text-muted-foreground">
                <th className="text-left px-4 py-2 font-medium">Keyword</th>
                <th className="text-left px-3 py-2 font-medium">Match</th>
                <th className="text-right px-3 py-2 font-medium">Impr.</th>
                <th className="text-right px-3 py-2 font-medium">Clicks</th>
                <th className="text-right px-3 py-2 font-medium">CTR</th>
                <th className="text-right px-3 py-2 font-medium">CPC</th>
                <th className="text-right px-4 py-2 font-medium">Conv.</th>
              </tr>
            </thead>
            <tbody>
              {keywords.map((kw, i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-2.5 font-medium">{kw.keyword}</td>
                  <td className="px-3 py-2.5 text-muted-foreground capitalize text-xs">
                    {kw.matchType.charAt(0) + kw.matchType.slice(1).toLowerCase()}
                  </td>
                  <td className="px-3 py-2.5 text-right text-muted-foreground">{fmt.int(kw.impressions)}</td>
                  <td className="px-3 py-2.5 text-right">{fmt.int(kw.clicks)}</td>
                  <td className="px-3 py-2.5 text-right">{fmt.pct(kw.ctr)}</td>
                  <td className="px-3 py-2.5 text-right">{fmt.usd(kw.cpc)}</td>
                  <td className="px-4 py-2.5 text-right">{fmt.int(kw.conversions)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function CampaignsTab({ clientId }: { clientId: number }) {
  const [preset, setPreset]     = useState("this_month");
  const [loading, setLoading]   = useState(true);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [data, setData]         = useState<AdsPerformanceData | null>(null);
  const [error, setError]       = useState<string | null>(null);

  const load = useCallback(async (p: string) => {
    setLoading(true);
    setError(null);
    try {
      const { startDate, endDate } = getRange(p);
      const res = await fetch(
        `/api/clients/${clientId}/ads/campaigns?startDate=${startDate}&endDate=${endDate}`
      );
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setConnected(json.connected);
      setData(json.data ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Ads data");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => { load(preset); }, [load, preset]);

  // Not connected
  if (!loading && connected === false) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-2">
          <p className="font-medium text-muted-foreground">Google Ads not connected</p>
          <p className="text-sm text-muted-foreground">
            Connect this client&apos;s Google Ads account in the{" "}
            <a href="?tab=integrations" className="underline hover:text-foreground">
              Integrations tab
            </a>{" "}
            to see campaign performance here.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Error
  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center space-y-3">
          <p className="text-sm text-status-danger">{error}</p>
          <Button size="sm" variant="outline" onClick={() => load(preset)}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-40 rounded-lg" />
      </div>
    );
  }

  // No data
  if (!data || data.campaigns.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No campaign data for this period.</p>
        </CardContent>
      </Card>
    );
  }

  const { totals, campaigns, topKeywords, accountName, dateRange } = data;
  const aggCtr = totals.impressions > 0 ? totals.clicks / totals.impressions : 0;
  const aggCpa = totals.conversions > 0 ? totals.spend / totals.conversions : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="font-semibold">{accountName}</p>
          <p className="text-xs text-muted-foreground">
            {dateRange.startDate} – {dateRange.endDate}
          </p>
        </div>
        <Select value={preset} onValueChange={(v) => { setPreset(v); }}>
          <SelectTrigger className="w-40 h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="this_month">This month</SelectItem>
            <SelectItem value="last_month">Last month</SelectItem>
            <SelectItem value="last_7">Last 7 days</SelectItem>
            <SelectItem value="last_30">Last 30 days</SelectItem>
            <SelectItem value="last_90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiTile label="Ad Spend"    value={fmt.usd(totals.spend)} />
        <KpiTile label="Impressions" value={fmt.int(totals.impressions)} />
        <KpiTile label="Clicks"      value={fmt.int(totals.clicks)} sub={`CTR ${fmt.pct(aggCtr)}`} />
        <KpiTile
          label="Conversions"
          value={fmt.int(totals.conversions)}
          sub={aggCpa > 0 ? `CPA ${fmt.usd(aggCpa)}` : undefined}
        />
      </div>

      <CampaignsTable campaigns={campaigns} />
      <KeywordsTable keywords={topKeywords} />
    </div>
  );
}
