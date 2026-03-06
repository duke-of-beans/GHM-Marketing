// src/lib/intel/sensors/ahrefs.ts
// Intelligence Engine — Sprint IE-02
// Ahrefs sensor — uses tenant's stored API credential.
// Gracefully degrades (skip) if no credential is stored for this tenant.

import type { SensorInterface, SensorCollectParams, SensorResult } from "./sensor-interface";

// ── Ahrefs API v3 helpers ────────────────────────────────────────────────────

const AHREFS_BASE = "https://api.ahrefs.com/v3";

interface AhrefsOverview {
  domain_rating: number;
  ahrefs_rank: number;
  backlinks: number;
  referring_domains: number;
  organic_keywords: number;
  organic_traffic: number;
}

interface AhrefsNewLost {
  new_backlinks: number;
  lost_backlinks: number;
}

async function fetchAhrefsOverview(
  domain: string,
  apiKey: string
): Promise<AhrefsOverview | null> {
  try {
    const url = `${AHREFS_BASE}/site-explorer/overview/v2?target=${encodeURIComponent(domain)}&mode=domain&output=json`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return null;
    const json = await res.json() as { domain?: AhrefsOverview };
    return json.domain ?? null;
  } catch {
    return null;
  }
}

async function fetchAhrefsNewLost(
  domain: string,
  apiKey: string
): Promise<AhrefsNewLost | null> {
  try {
    // New/lost backlinks over the last 30 days
    const dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const url =
      `${AHREFS_BASE}/site-explorer/new-lost-backlinks` +
      `?target=${encodeURIComponent(domain)}&mode=domain&date_from=${dateFrom}&output=json`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return null;
    const json = await res.json() as { new_backlinks?: number; lost_backlinks?: number };
    return {
      new_backlinks: json.new_backlinks ?? 0,
      lost_backlinks: json.lost_backlinks ?? 0,
    };
  } catch {
    return null;
  }
}

// ── Sensor Implementation ────────────────────────────────────────────────────

export class AhrefsSensor implements SensorInterface {
  readonly sensorId = "ahrefs";
  readonly displayName = "Ahrefs SEO Intelligence";
  readonly verticals = [
    "local-service",
    "ecommerce",
    "saas",
    "affiliate",
    "seo-agency",
  ];
  readonly requiresCredentials = true;

  async collect(params: SensorCollectParams): Promise<SensorResult> {
    const { domain } = params.target;
    const apiKey = params.credentials["apiKey"];

    // Graceful degradation — if no key, mark as skipped, not failed
    if (!apiKey) {
      return {
        sensorId: this.sensorId,
        success: false,
        metrics: {},
        error: "SKIPPED: No Ahrefs API key configured for this tenant",
        collectedAt: new Date(),
      };
    }

    try {
      const [overview, newLost] = await Promise.all([
        fetchAhrefsOverview(domain, apiKey),
        fetchAhrefsNewLost(domain, apiKey),
      ]);

      if (!overview) {
        return {
          sensorId: this.sensorId,
          success: false,
          metrics: {},
          error: `Ahrefs API returned no data for ${domain}`,
          collectedAt: new Date(),
        };
      }

      const metrics = {
        domainRating: overview.domain_rating,
        ahrefsRank: overview.ahrefs_rank,
        backlinks: overview.backlinks,
        referringDomains: overview.referring_domains,
        organicKeywords: overview.organic_keywords,
        estimatedTraffic: overview.organic_traffic,
        newBacklinks: newLost?.new_backlinks ?? null,
        lostBacklinks: newLost?.lost_backlinks ?? null,
        // Net backlink trend (positive = growing)
        backlinkNetChange:
          newLost
            ? newLost.new_backlinks - newLost.lost_backlinks
            : null,
      };

      // Ahrefs charges per row — estimate ~2 API credits per call
      return {
        sensorId: this.sensorId,
        success: true,
        metrics,
        cost: 0.04, // Approximate cost per domain scan (2 API calls)
        collectedAt: new Date(),
      };
    } catch (err) {
      return {
        sensorId: this.sensorId,
        success: false,
        metrics: {},
        error: err instanceof Error ? err.message : String(err),
        collectedAt: new Date(),
      };
    }
  }
}
