"use client";

/**
 * SiteHealthTab — Sprint 2
 * Shows PageSpeed scores, Core Web Vitals, and historical trend per domain.
 */

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { CHART_FALLBACKS } from "@/hooks/use-chart-colors";
import { ArrowUp, ArrowDown, Minus, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Types ──────────────────────────────────────────────────────────────────

interface SiteHealthSnapshot {
  id: number;
  domainId: number;
  performanceMobile: number | null;
  performanceDesktop: number | null;
  lcp: number | null;
  tbt: number | null;
  cls: number | null;
  fcp: number | null;
  seoScore: number | null;
  accessibilityScore: number | null;
  bestPracticesScore: number | null;
  previousMobile: number | null;
  previousDesktop: number | null;
  scanDate: string;
}

interface Domain {
  id: number;
  domain: string;
  type: string;
}

interface LatestEntry {
  domain: Domain;
  snapshot: SiteHealthSnapshot | null;
  deltas: {
    mobile: number | null;
    desktop: number | null;
    mobileTrend: "up" | "down" | "stable" | "unknown";
    desktopTrend: "up" | "down" | "stable" | "unknown";
  } | null;
}

interface HistorySnapshot extends SiteHealthSnapshot {
  domain: Domain;
}

interface Props {
  clientId: number;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function scoreColor(score: number | null): string {
  if (score === null) return "text-muted-foreground";
  if (score >= 90) return "text-status-success";
  if (score >= 50) return "text-status-warning";
  return "text-status-danger";
}

function scoreBg(score: number | null): string {
  if (score === null) return "bg-muted";
  if (score >= 90) return "bg-status-success-bg border-status-success-border";
  if (score >= 50) return "bg-status-warning-bg border-status-warning-border";
  return "bg-status-danger-bg border-status-danger-border";
}

function TrendArrow({ trend, delta }: { trend: string; delta: number | null }) {
  if (trend === "unknown" || delta === null) {
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  }
  if (trend === "up") {
    return (
      <span className="flex items-center gap-0.5 text-status-success text-xs font-medium">
        <ArrowUp className="h-3.5 w-3.5" />+{delta}
      </span>
    );
  }
  if (trend === "down") {
    return (
      <span className="flex items-center gap-0.5 text-status-danger text-xs font-medium">
        <ArrowDown className="h-3.5 w-3.5" />{delta}
      </span>
    );
  }
  return <span className="text-muted-foreground text-xs">{delta > 0 ? `+${delta}` : delta}</span>;
}

function cwvLabel(key: string): string {
  const map: Record<string, string> = { lcp: "LCP", tbt: "TBT", cls: "CLS", fcp: "FCP" };
  return map[key] ?? key.toUpperCase();
}

function cwvStatus(
  key: string,
  val: number | null
): "good" | "needs-improvement" | "poor" | "unknown" {
  if (val === null) return "unknown";
  switch (key) {
    case "lcp": return val <= 2500 ? "good" : val <= 4000 ? "needs-improvement" : "poor";
    case "tbt": return val <= 200 ? "good" : val <= 600 ? "needs-improvement" : "poor";
    case "cls": return val <= 0.1 ? "good" : val <= 0.25 ? "needs-improvement" : "poor";
    case "fcp": return val <= 1800 ? "good" : val <= 3000 ? "needs-improvement" : "poor";
    default: return "unknown";
  }
}

function cwvStatusColor(status: string): string {
  if (status === "good") return "text-status-success bg-status-success-bg border-status-success-border";
  if (status === "needs-improvement") return "text-status-warning bg-status-warning-bg border-status-warning-border";
  if (status === "poor") return "text-status-danger bg-status-danger-bg border-status-danger-border";
  return "text-muted-foreground bg-muted border-border";
}

function formatCwvValue(key: string, val: number | null): string {
  if (val === null) return "—";
  if (key === "cls") return val.toFixed(3);
  if (key === "lcp" || key === "fcp") return `${(val / 1000).toFixed(2)}s`;
  return `${Math.round(val)}ms`;
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Main Component ───────────────────────────────────────────────────────────

export function SiteHealthTab({ clientId }: Props) {
  const [latest, setLatest] = useState<LatestEntry[]>([]);
  const [history, setHistory] = useState<HistorySnapshot[]>([]);
  const [selectedDomainId, setSelectedDomainId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLatest = useCallback(async () => {
    const res = await fetch(`/api/clients/${clientId}/site-health/latest`);
    if (!res.ok) throw new Error("Failed to load site health data");
    const json = await res.json();
    return json.data as LatestEntry[];
  }, [clientId]);

  const fetchHistory = useCallback(
    async (domainId: number) => {
      const res = await fetch(
        `/api/clients/${clientId}/site-health?domainId=${domainId}&limit=12`
      );
      if (!res.ok) throw new Error("Failed to load history");
      const json = await res.json();
      return json.data.snapshots as HistorySnapshot[];
    },
    [clientId]
  );

  const load = useCallback(async () => {
    try {
      setError(null);
      const latestData = await fetchLatest();
      setLatest(latestData);
      const primary =
        latestData.find((e) => e.domain.type === "primary") ?? latestData[0];
      if (primary?.snapshot) {
        setSelectedDomainId(primary.domain.id);
        const hist = await fetchHistory(primary.domain.id);
        setHistory(hist);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  }, [fetchLatest, fetchHistory]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const handleDomainChange = async (domainIdStr: string) => {
    const id = parseInt(domainIdStr);
    setSelectedDomainId(id);
    const hist = await fetchHistory(id);
    setHistory(hist);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const selectedEntry = latest.find((e) => e.domain.id === selectedDomainId);
  const snap = selectedEntry?.snapshot ?? null;
  const deltas = selectedEntry?.deltas ?? null;

  const chartData = [...history].reverse().map((s) => ({
    date: formatDate(s.scanDate),
    Mobile: s.performanceMobile,
    Desktop: s.performanceDesktop,
    SEO: s.seoScore,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
        Loading site health data…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
        <AlertTriangle className="h-8 w-8 text-status-warning" />
        <p className="text-sm">{error}</p>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          Retry
        </Button>
      </div>
    );
  }

  if (latest.length === 0 || latest.every((e) => !e.snapshot)) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
        <p className="text-sm">No site health data yet.</p>
        <p className="text-xs">
          Snapshots are captured weekly. Check back after the next cron run.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold">Site Health</h3>
          {latest.length > 1 && (
            <Select
              value={selectedDomainId?.toString() ?? ""}
              onValueChange={handleDomainChange}
            >
              <SelectTrigger className="w-60 h-8 text-sm">
                <SelectValue placeholder="Select domain" />
              </SelectTrigger>
              <SelectContent>
                {latest.map((e) => (
                  <SelectItem key={e.domain.id} value={e.domain.id.toString()}>
                    {e.domain.domain}
                    {e.domain.type === "primary" && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        primary
                      </Badge>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {snap ? (
        <>
          {/* Lighthouse score cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                label: "Mobile",
                score: snap.performanceMobile,
                delta: deltas?.mobile ?? null,
                trend: deltas?.mobileTrend ?? "unknown",
              },
              {
                label: "Desktop",
                score: snap.performanceDesktop,
                delta: deltas?.desktop ?? null,
                trend: deltas?.desktopTrend ?? "unknown",
              },
              { label: "SEO", score: snap.seoScore, delta: null, trend: "unknown" },
              {
                label: "Accessibility",
                score: snap.accessibilityScore,
                delta: null,
                trend: "unknown",
              },
            ].map(({ label, score, delta, trend }) => (
              <Card key={label} className={`border ${scoreBg(score)}`}>
                <CardContent className="py-4 text-center space-y-1">
                  <p className={`text-3xl font-bold ${scoreColor(score)}`}>
                    {score ?? "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  {delta !== null && (
                    <div className="flex justify-center">
                      <TrendArrow trend={trend} delta={delta} />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Core Web Vitals */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Core Web Vitals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(["lcp", "tbt", "cls", "fcp"] as const).map((key) => {
                  const val = snap[key];
                  const status = cwvStatus(key, val);
                  return (
                    <div key={key} className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        {cwvLabel(key)}
                      </p>
                      <p className="text-xl font-semibold">
                        {formatCwvValue(key, val)}
                      </p>
                      <Badge
                        variant="outline"
                        className={`text-xs ${cwvStatusColor(status)}`}
                      >
                        {status === "needs-improvement"
                          ? "Needs Work"
                          : status === "unknown"
                          ? "No Data"
                          : status.charAt(0).toUpperCase() + status.slice(1)}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* History chart */}
          {chartData.length > 1 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Performance History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      width={28}
                    />
                    <Tooltip
                      contentStyle={{
                        fontSize: 12,
                        borderRadius: 8,
                        border: "1px solid hsl(var(--border))",
                      }}
                    />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                    <Line
                      type="monotone"
                      dataKey="Mobile"
                      stroke={CHART_FALLBACKS[0]}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Desktop"
                      stroke={CHART_FALLBACKS[2]}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="SEO"
                      stroke={CHART_FALLBACKS[4]}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {snap.scanDate && (
            <p className="text-xs text-muted-foreground text-right">
              Last scanned {formatDate(snap.scanDate)}
            </p>
          )}
        </>
      ) : (
        <div className="py-12 text-center text-sm text-muted-foreground">
          No snapshot available for this domain yet.
        </div>
      )}
    </div>
  );
}
