/**
 * Ahrefs Provider
 * Single source of truth for all Ahrefs API calls.
 * Used by both the enrichment orchestrator and the competitive scan engine.
 */

export type AhrefsDomainResult = {
  domain_rating: number;
  ahrefs_rank: number;
  backlinks: number;
  referring_domains: number;
  organic_keywords: number;
  organic_traffic: number;
};

export type AhrefsKeywordRankings = Record<string, number>; // keyword → position

const API_BASE = "https://api.ahrefs.com/v3";

function getApiKey(): string | null {
  return process.env.AHREFS_API_KEY ?? null;
}

/**
 * Fetch domain overview — DR, backlinks, organic traffic.
 * ~$0.01 per call (Ahrefs Starter credits).
 */
export async function fetchDomainOverview(domain: string): Promise<AhrefsDomainResult | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("[ahrefs] AHREFS_API_KEY not set, skipping");
    return null;
  }

  try {
    const res = await fetch(
      `${API_BASE}/site-explorer/overview?target=${encodeURIComponent(domain)}&mode=domain`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!res.ok) {
      console.error(`[ahrefs] domain overview error: ${res.status} ${res.statusText}`);
      return null;
    }

    const data = await res.json();
    return {
      domain_rating: data.domain_rating ?? 0,
      ahrefs_rank: data.ahrefs_rank ?? 0,
      backlinks: data.backlinks ?? 0,
      referring_domains: data.referring_domains ?? 0,
      organic_keywords: data.org_keywords ?? 0,
      organic_traffic: data.org_traffic ?? 0,
    };
  } catch (err) {
    console.error("[ahrefs] fetchDomainOverview failed:", err);
    return null;
  }
}

/**
 * Fetch organic keyword positions for a domain.
 * Returns a map of keyword → position for any matched tracked keywords.
 * ~$0.01 per call.
 */
export async function fetchKeywordRankings(
  domain: string,
  trackedKeywords: string[]
): Promise<AhrefsKeywordRankings> {
  if (trackedKeywords.length === 0) return {};

  const apiKey = getApiKey();
  if (!apiKey) return {};

  try {
    const res = await fetch(
      `${API_BASE}/site-explorer/organic-keywords?target=${encodeURIComponent(domain)}&mode=domain&limit=100`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!res.ok) return {};
    const data = await res.json();

    const rankings: AhrefsKeywordRankings = {};
    trackedKeywords.forEach((kw) => {
      const match = data.keywords?.find(
        (k: { keyword?: string; position?: number }) =>
          k.keyword?.toLowerCase() === kw.toLowerCase()
      );
      if (match?.position) rankings[kw] = match.position;
    });

    return rankings;
  } catch (err) {
    console.error("[ahrefs] fetchKeywordRankings failed:", err);
    return {};
  }
}
