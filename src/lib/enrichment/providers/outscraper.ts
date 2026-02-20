/**
 * Outscraper Provider
 * Single source of truth for all Outscraper (Google Maps / GMB) API calls.
 */

export type OutscraperGMBResult = {
  name: string;
  full_address: string;
  phone: string;
  site: string;
  rating: number;
  reviews: number;
  category: string;
  working_hours: Record<string, string>;
  photos_count: number;
  latitude: number;
  longitude: number;
};

// Compact version for scan engine (only what's needed for competitive comparisons)
export type OutscraperScanResult = {
  rating: number;
  reviews: number;
};

function getApiKey(): string | null {
  return process.env.OUTSCRAPER_API_KEY ?? null;
}

/**
 * Full GMB lookup — used by lead enrichment.
 * Returns all available business data.
 * ~$0.005 per call.
 */
export async function fetchGMBFull(
  businessName: string,
  city: string,
  state: string
): Promise<OutscraperGMBResult | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("[outscraper] OUTSCRAPER_API_KEY not set, skipping");
    return null;
  }

  try {
    const query = encodeURIComponent(`${businessName}, ${city}, ${state}`);
    const res = await fetch(
      `https://api.app.outscraper.com/maps/search-v3?query=${query}&limit=1&async=false`,
      {
        headers: { "X-API-KEY": apiKey },
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!res.ok) {
      console.error(`[outscraper] error: ${res.status} ${res.statusText}`);
      return null;
    }

    const data = await res.json();
    const results = data?.data?.[0];
    if (!results || results.length === 0) return null;

    const biz = results[0];
    return {
      name: biz.name || "",
      full_address: biz.full_address || "",
      phone: biz.phone || "",
      site: biz.site || "",
      rating: biz.rating || 0,
      reviews: biz.reviews || 0,
      category: biz.category || "",
      working_hours: biz.working_hours || {},
      photos_count: biz.photos_count || 0,
      latitude: biz.latitude || 0,
      longitude: biz.longitude || 0,
    };
  } catch (err) {
    console.error("[outscraper] fetchGMBFull failed:", err);
    return null;
  }
}

/**
 * Compact GMB lookup — used by competitive scan engine.
 * Only fetches rating + review count to minimize cost.
 * ~$0.005 per call.
 */
export async function fetchGMBScan(
  businessName: string,
  city: string,
  state: string
): Promise<OutscraperScanResult | null> {
  const full = await fetchGMBFull(businessName, city, state);
  if (!full) return null;
  return { rating: full.rating, reviews: full.reviews };
}
