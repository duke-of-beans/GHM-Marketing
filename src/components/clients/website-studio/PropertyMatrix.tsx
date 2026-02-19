"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, ExternalLink, AlertTriangle, CheckCircle2, Clock, Dna } from "lucide-react";
import type { WebPropertyMatrix, WebPropertySummary, WebPropertyTier } from "@/types/website-studio";

const TIER_CONFIG: Record<WebPropertyTier, { label: string; color: string; bg: string; border: string; dot: string }> = {
  tier1: { label: "Tier 1 — Extension",  color: "text-blue-700 dark:text-blue-300",   bg: "bg-blue-50 dark:bg-blue-950/40",   border: "border-blue-200 dark:border-blue-800",   dot: "bg-blue-500" },
  tier2: { label: "Tier 2 — Satellite",  color: "text-purple-700 dark:text-purple-300", bg: "bg-purple-50 dark:bg-purple-950/40", border: "border-purple-200 dark:border-purple-800", dot: "bg-purple-500" },
  tier3: { label: "Tier 3 — Pure Brand", color: "text-amber-700 dark:text-amber-300",  bg: "bg-amber-50 dark:bg-amber-950/40",  border: "border-amber-200 dark:border-amber-800",  dot: "bg-amber-500" },
};

interface Props {
  matrix: WebPropertyMatrix;
  onOpenComposer: (jobId: number) => void;
  onOpenDna: (propertyId: number, slug: string) => void;
  onNew: () => void;
}

export function PropertyMatrix({ matrix, onOpenComposer, onOpenDna, onNew }: Props) {
  const brands = Object.keys(matrix).sort();

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Property Matrix</p>
      <div className="rounded-lg border overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-4 bg-muted/50 border-b text-xs font-medium text-muted-foreground">
          <div className="px-3 py-2">Brand Segment</div>
          <TierHeader tier="tier1" />
          <TierHeader tier="tier2" />
          <TierHeader tier="tier3" />
        </div>

        {/* Brand rows */}
        {brands.map((brand, i) => (
          <div
            key={brand}
            className={`grid grid-cols-4 border-b last:border-b-0 ${i % 2 === 0 ? "" : "bg-muted/20"}`}
          >
            <div className="px-3 py-3 flex items-center">
              <span className="text-sm font-medium">{brand}</span>
            </div>
            <TierCell property={matrix[brand].tier1} tier="tier1" onOpenComposer={onOpenComposer} onOpenDna={onOpenDna} onNew={onNew} />
            <TierCell property={matrix[brand].tier2} tier="tier2" onOpenComposer={onOpenComposer} onOpenDna={onOpenDna} onNew={onNew} />
            <TierCell property={matrix[brand].tier3} tier="tier3" onOpenComposer={onOpenComposer} onOpenDna={onOpenDna} onNew={onNew} />
          </div>
        ))}
      </div>
    </div>
  );
}

function TierHeader({ tier }: { tier: WebPropertyTier }) {
  const cfg = TIER_CONFIG[tier];
  return (
    <div className={`px-3 py-2 border-l ${cfg.color}`}>
      <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${cfg.dot}`} />
      {cfg.label}
    </div>
  );
}

function TierCell({
  property,
  tier,
  onOpenComposer,
  onOpenDna,
  onNew,
}: {
  property: WebPropertySummary | null;
  tier: WebPropertyTier;
  onOpenComposer: (jobId: number) => void;
  onOpenDna: (propertyId: number, slug: string) => void;
  onNew: () => void;
}) {
  const cfg = TIER_CONFIG[tier];

  if (!property) {
    return (
      <div className="px-3 py-3 border-l">
        <button
          onClick={onNew}
          className="flex items-center gap-1.5 text-xs text-muted-foreground border border-dashed rounded px-2 py-1 hover:border-foreground/40 hover:text-foreground transition-colors"
        >
          <Plus className="h-3 w-3" />
          Add
        </button>
      </div>
    );
  }

  const progress =
    property.pagesTotal > 0
      ? Math.round((property.pagesApproved / property.pagesTotal) * 100)
      : 0;

  return (
    <div className={`px-3 py-3 border-l ${cfg.bg}`}>
      <div className="space-y-1.5">
        {/* URL + status */}
        <div className="flex items-center gap-1.5">
          <StatusDot status={property.deployStatus} isStale={property.isStale} />
          <span className="text-xs font-medium truncate max-w-[140px]">{property.targetUrl}</span>
          {property.deployStatus === "live" && (
            <a href={`https://${property.targetUrl}`} target="_blank" rel="noreferrer" className="shrink-0">
              <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-foreground" />
            </a>
          )}
        </div>

        {/* Build progress */}
        {property.activeBuildJobId && property.pagesTotal > 0 && (
          <div className="space-y-0.5">
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>{property.activeBuildStage}</span>
              <span>{property.pagesApproved}/{property.pagesTotal} pages</span>
            </div>
            <div className="h-1 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-green-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        {property.activeBuildJobId && (
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-[11px] px-2 -ml-2"
              onClick={() => onOpenComposer(property.activeBuildJobId!)}
            >
              Composer →
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-[11px] px-2"
              onClick={() => onOpenDna(property.id, property.slug)}
            >
              <Dna className="h-3 w-3 mr-1" /> DNA
            </Button>
          </div>
        )}

        {/* Alerts */}
        {property.isStale && (
          <div className="flex items-center gap-1 text-[10px] text-amber-600">
            <AlertTriangle className="h-3 w-3" />
            Stale
          </div>
        )}
        {property.dnsVerified && property.sslActive && property.deployStatus === "live" && (
          <div className="flex items-center gap-1 text-[10px] text-green-600">
            <CheckCircle2 className="h-3 w-3" />
            Live · DNS ✓ · SSL ✓
          </div>
        )}
      </div>
    </div>
  );
}

function StatusDot({ status, isStale }: { status: string; isStale: boolean }) {
  if (isStale) return <span className="inline-block w-2 h-2 rounded-full bg-amber-400 shrink-0" />;
  const colors: Record<string, string> = {
    live:       "bg-green-500",
    approved:   "bg-emerald-400",
    review:     "bg-yellow-400",
    composing:  "bg-blue-400",
    scaffolded: "bg-gray-400",
    error:      "bg-red-500",
  };
  return <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${colors[status] ?? "bg-gray-400"}`} />;
}
