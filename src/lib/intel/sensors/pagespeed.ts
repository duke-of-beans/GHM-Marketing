// src/lib/intel/sensors/pagespeed.ts
// Intelligence Engine — Sprint IE-02
// PageSpeed Insights sensor — free API, no credentials required.
// Calls both mobile and desktop strategies and returns Core Web Vitals.

import type { SensorInterface, SensorCollectParams, SensorResult } from "./sensor-interface";

// ── Types ────────────────────────────────────────────────────────────────────

interface PageSpeedAudit {
  id: string;
  title: string;
  score: number | null;
  displayValue?: string;
  numericValue?: number;
}

interface PageSpeedResponse {
  lighthouseResult?: {
    categories?: {
      performance?: { score: number | null };
    };
    audits?: Record<string, PageSpeedAudit>;
  };
  loadingExperience?: {
    metrics?: {
      LARGEST_CONTENTFUL_PAINT_MS?: { percentile: number; category: string };
      FIRST_INPUT_DELAY_MS?: { percentile: number; category: string };
      CUMULATIVE_LAYOUT_SHIFT_SCORE?: { percentile: number; category: string };
      INTERACTION_TO_NEXT_PAINT?: { percentile: number; category: string };
    };
    overall_category?: string;
  };
}

// ── Audit IDs that indicate real problems when failing ───────────────────────

const DIAGNOSTIC_AUDITS = [
  "render-blocking-resources",
  "unused-css-rules",
  "unused-javascript",
  "uses-optimized-images",
  "uses-webp-images",
  "uses-responsive-images",
  "efficient-animated-content",
  "uses-text-compression",
  "uses-long-cache-ttl",
  "dom-size",
  "bootup-time",
  "mainthread-work-breakdown",
  "total-byte-weight",
];

// ── Helpers ──────────────────────────────────────────────────────────────────

const PSI_BASE = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

async function fetchStrategy(
  url: string,
  strategy: "mobile" | "desktop"
): Promise<PageSpeedResponse | null> {
  const apiUrl = `${PSI_BASE}?url=${encodeURIComponent(url)}&strategy=${strategy}&category=performance`;
  try {
    const res = await fetch(apiUrl, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) return null;
    return (await res.json()) as PageSpeedResponse;
  } catch {
    return null;
  }
}

function extractScore(data: PageSpeedResponse | null): number | null {
  const raw = data?.lighthouseResult?.categories?.performance?.score;
  if (raw === null || raw === undefined) return null;
  return Math.round(raw * 100);
}

function extractLabAudit(
  data: PageSpeedResponse | null,
  auditId: string
): number | null {
  const audit = data?.lighthouseResult?.audits?.[auditId];
  if (!audit || audit.numericValue === undefined) return null;
  return Math.round(audit.numericValue);
}

function extractIssues(data: PageSpeedResponse | null): string[] {
  if (!data?.lighthouseResult?.audits) return [];
  return DIAGNOSTIC_AUDITS.filter((id) => {
    const audit = data.lighthouseResult!.audits![id];
    return audit && audit.score !== null && audit.score < 0.9;
  }).map((id) => {
    const audit = data.lighthouseResult!.audits![id];
    return audit.displayValue ? `${id}: ${audit.displayValue}` : id;
  });
}

// ── Sensor Implementation ────────────────────────────────────────────────────

export class PageSpeedSensor implements SensorInterface {
  readonly sensorId = "pagespeed";
  readonly displayName = "PageSpeed & Core Web Vitals";
  readonly verticals = [
    "local-service",
    "local-retail",
    "ecommerce",
    "saas",
    "affiliate",
    "seo-agency",
  ];
  readonly requiresCredentials = false;

  async collect(params: SensorCollectParams): Promise<SensorResult> {
    const { domain } = params.target;
    const url = domain.startsWith("http") ? domain : `https://${domain}`;

    try {
      // Run mobile and desktop in parallel — free tier allows both
      const [mobile, desktop] = await Promise.all([
        fetchStrategy(url, "mobile"),
        fetchStrategy(url, "desktop"),
      ]);

      if (!mobile && !desktop) {
        return {
          sensorId: this.sensorId,
          success: false,
          metrics: {},
          error: `PageSpeed API returned no data for ${domain}`,
          collectedAt: new Date(),
        };
      }

      // Field data from mobile (more representative for CWV pass/fail)
      const fieldMetrics = mobile?.loadingExperience?.metrics;

      const metrics = {
        mobileScore: extractScore(mobile),
        desktopScore: extractScore(desktop),
        // Core Web Vitals from field data
        lcp: fieldMetrics?.LARGEST_CONTENTFUL_PAINT_MS?.percentile ?? null,
        fid: fieldMetrics?.FIRST_INPUT_DELAY_MS?.percentile ?? null,
        cls: fieldMetrics?.CUMULATIVE_LAYOUT_SHIFT_SCORE
          ? Math.round(
              (fieldMetrics.CUMULATIVE_LAYOUT_SHIFT_SCORE.percentile / 100) *
                100
            ) / 100
          : null,
        inp: fieldMetrics?.INTERACTION_TO_NEXT_PAINT?.percentile ?? null,
        lcpCategory:
          fieldMetrics?.LARGEST_CONTENTFUL_PAINT_MS?.category ?? null,
        fidCategory: fieldMetrics?.FIRST_INPUT_DELAY_MS?.category ?? null,
        clsCategory:
          fieldMetrics?.CUMULATIVE_LAYOUT_SHIFT_SCORE?.category ?? null,
        overallCategory: mobile?.loadingExperience?.overall_category ?? null,
        // Lab metrics (mobile Lighthouse)
        fcp: extractLabAudit(mobile, "first-contentful-paint"),
        si: extractLabAudit(mobile, "speed-index"),
        tbt: extractLabAudit(mobile, "total-blocking-time"),
        tti: extractLabAudit(mobile, "interactive"),
        // Actionable issues
        specificIssues: extractIssues(mobile),
      };

      return {
        sensorId: this.sensorId,
        success: true,
        metrics,
        cost: 0, // Free API
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
