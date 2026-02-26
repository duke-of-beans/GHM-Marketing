"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import Link from "next/link";
import {
  Globe,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type LiveSite = {
  id: number;
  slug: string;
  brandSegment: string;
  tier: string;
  targetUrl: string;
  deployStatus: string;
  lastDeployedAt: string | null;
  daysSinceDeploy: number | null;
  isStale: boolean;
  stalenessThresholdDays: number;
  dnsVerified: boolean;
  sslActive: boolean;
  client: { id: number; businessName: string };
};

type ApiResponse = {
  success: boolean;
  data: { sites: LiveSite[]; total: number; staleCount: number };
};

export function LiveSitesPanel() {
  const [sites, setSites] = useState<LiveSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [staleCount, setStaleCount] = useState(0);

  useEffect(() => {
    fetch("/api/website-studio/live-sites")
      .then((r) => r.json())
      .then((json: ApiResponse) => {
        if (!json.success) throw new Error("Failed to load");
        setSites(json.data.sites);
        setStaleCount(json.data.staleCount);
      })
      .catch((err) => toast.error(err.message ?? "Failed to load live sites"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading live sites...
      </div>
    );
  }

  if (sites.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center space-y-3">
        <Globe className="h-8 w-8 text-muted-foreground mx-auto" />
        <p className="font-medium">No live sites yet</p>
        <p className="text-sm text-muted-foreground">
          Deploy a build from Website Studio to see live sites here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-muted-foreground">{sites.length} live site{sites.length !== 1 ? "s" : ""}</span>
        {staleCount > 0 && (
          <span className="flex items-center gap-1 text-status-warning">
            <AlertTriangle className="h-3.5 w-3.5" />
            {staleCount} stale
          </span>
        )}
      </div>

      {/* Site cards */}
      <div className="rounded-lg border divide-y">
        {sites.map((site) => (
          <SiteRow key={site.id} site={site} />
        ))}
      </div>
    </div>
  );
}

function SiteRow({ site }: { site: LiveSite }) {
  const tierLabel = site.tier?.replace("tier", "T") ?? "";
  const tierColors: Record<string, string> = {
    tier1: "bg-status-info-bg text-status-info",
    tier2: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    tier3: "bg-status-warning-bg text-status-warning",
  };

  return (
    <div className="flex items-center gap-4 px-4 py-3">
      {/* Status dot */}
      <span
        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
          site.isStale ? "bg-status-warning-bg" : "bg-status-success-bg"
        }`}
      />

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-2">
          <Link
            href={`/clients/${site.client.id}`}
            className="text-sm font-medium hover:underline truncate"
          >
            {site.client.businessName}
          </Link>
          <span className="text-xs text-muted-foreground">· {site.brandSegment}</span>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${tierColors[site.tier] ?? ""}`}>
            {tierLabel}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <a
            href={`https://${site.targetUrl}`}
            target="_blank"
            rel="noreferrer"
            className="font-mono hover:text-foreground flex items-center gap-1"
          >
            {site.targetUrl} <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Health indicators */}
      <div className="flex items-center gap-3 shrink-0 text-xs">
        {site.dnsVerified && site.sslActive ? (
          <span className="flex items-center gap-1 text-status-success">
            <ShieldCheck className="h-3.5 w-3.5" /> DNS + SSL
          </span>
        ) : (
          <span className="flex items-center gap-1 text-muted-foreground">
            {site.dnsVerified ? "DNS ✓" : "DNS ✗"}
            {" · "}
            {site.sslActive ? "SSL ✓" : "SSL ✗"}
          </span>
        )}
      </div>

      {/* Deploy age */}
      <div className="text-right shrink-0">
        {site.daysSinceDeploy !== null ? (
          <div className={`text-xs tabular-nums ${site.isStale ? "text-status-warning font-medium" : "text-muted-foreground"}`}>
            {site.daysSinceDeploy === 0
              ? "Today"
              : site.daysSinceDeploy === 1
                ? "1 day ago"
                : `${site.daysSinceDeploy} days ago`}
            {site.isStale && (
              <div className="flex items-center gap-1 justify-end mt-0.5">
                <AlertTriangle className="h-3 w-3" /> Stale
              </div>
            )}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Never deployed</span>
        )}
      </div>
    </div>
  );
}
