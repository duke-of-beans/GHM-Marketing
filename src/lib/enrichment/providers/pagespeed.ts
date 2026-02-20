/**
 * PageSpeed Insights Provider
 * Single source of truth for all Google PageSpeed API calls.
 */

export type PageSpeedResult = {
  performance_score: number;
  accessibility_score: number;
  seo_score: number;
  best_practices_score: number;
  fcp: number;   // First Contentful Paint (ms)
  lcp: number;   // Largest Contentful Paint (ms)
  cls: number;   // Cumulative Layout Shift
  tbt: number;   // Total Blocking Time (ms)
  speed_index: number;
};

// Compact version for scan engine (performance score only)
export type PageSpeedScanResult = number; // 0-100

function getApiKey(): string | null {
  return process.env.PAGESPEED_API_KEY ?? null;
}

function normalizeUrl(url: string): string {
  return url.startsWith("http") ? url : `https://${url}`;
}

/**
 * Full PageSpeed analysis — used by lead enrichment.
 * Returns all Lighthouse categories and Core Web Vitals.
 * Free API (rate limited).
 */
export async function fetchPageSpeedFull(
  url: string,
  strategy: "mobile" | "desktop" = "mobile"
): Promise<PageSpeedResult | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("[pagespeed] PAGESPEED_API_KEY not set, skipping");
    return null;
  }

  try {
    const target = normalizeUrl(url);
    const res = await fetch(
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(target)}&strategy=${strategy}&key=${apiKey}`,
      { signal: AbortSignal.timeout(30000) }
    );

    if (!res.ok) {
      console.error(`[pagespeed] error: ${res.status} ${res.statusText}`);
      return null;
    }

    const data = await res.json();
    const categories = data.lighthouseResult?.categories || {};
    const audits = data.lighthouseResult?.audits || {};

    return {
      performance_score: Math.round((categories.performance?.score ?? 0) * 100),
      accessibility_score: Math.round((categories.accessibility?.score ?? 0) * 100),
      seo_score: Math.round((categories.seo?.score ?? 0) * 100),
      best_practices_score: Math.round((categories["best-practices"]?.score ?? 0) * 100),
      fcp: audits["first-contentful-paint"]?.numericValue ?? 0,
      lcp: audits["largest-contentful-paint"]?.numericValue ?? 0,
      cls: audits["cumulative-layout-shift"]?.numericValue ?? 0,
      tbt: audits["total-blocking-time"]?.numericValue ?? 0,
      speed_index: audits["speed-index"]?.numericValue ?? 0,
    };
  } catch (err) {
    console.error("[pagespeed] fetchPageSpeedFull failed:", err);
    return null;
  }
}

/**
 * Compact PageSpeed scan — used by competitive scan engine.
 * Returns just the performance score (0-100).
 * Free API.
 */
export async function fetchPageSpeedScan(
  url: string,
  strategy: "mobile" | "desktop" = "mobile"
): Promise<PageSpeedScanResult | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  try {
    const target = normalizeUrl(url);
    const res = await fetch(
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(target)}&strategy=${strategy}&key=${apiKey}`,
      { signal: AbortSignal.timeout(30000) }
    );

    if (!res.ok) return null;
    const data = await res.json();
    const score = data.lighthouseResult?.categories?.performance?.score ?? 0;
    return Math.round(score * 100);
  } catch (err) {
    console.error("[pagespeed] fetchPageSpeedScan failed:", err);
    return null;
  }
}
