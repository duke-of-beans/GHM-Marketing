/**
 * Competitive Scan Data Fetcher
 * Rewired to use provider layer — no more raw API calls here.
 * Cache-aware: checks EnrichmentCache before hitting APIs.
 */

import type { ClientData, Competitors, ApiCosts } from "@/types/competitive-scan";
import { prisma } from "@/lib/db";
import { fetchGMBScan } from "@/lib/enrichment/providers/outscraper";
import { fetchDomainOverview, fetchKeywordRankings } from "@/lib/enrichment/providers/ahrefs";
import { fetchPageSpeedScan } from "@/lib/enrichment/providers/pagespeed";
import { getCached, setCache } from "@/lib/enrichment/cache";
import { logProviderCall } from "@/lib/enrichment/cost-tracker";

// ============================================================================
// Keyword helpers
// ============================================================================

async function getClientKeywords(clientId: number): Promise<string[]> {
  const client = await prisma.clientProfile.findUnique({
    where: { id: clientId },
    select: { lead: { select: { competitiveIntel: true } } },
  });

  const intel = client?.lead.competitiveIntel as { trackedKeywords?: string[] } | null;
  return Array.isArray(intel?.trackedKeywords) ? intel!.trackedKeywords! : [];
}

// ============================================================================
// Cached provider wrappers — check cache first, log all calls
// ============================================================================

async function cachedGMBScan(businessName: string, city: string, state: string) {
  const key = `outscraper:gmb:${businessName}:${city}:${state}`.toLowerCase();
  const cached = await getCached<{ rating: number; reviews: number }>("outscraper", key);
  if (cached) {
    await logProviderCall({ provider: "outscraper", operation: "gmb_scan", cacheHit: true, costUsd: 0, success: true });
    return cached;
  }
  const t0 = Date.now();
  const result = await fetchGMBScan(businessName, city, state);
  await logProviderCall({ provider: "outscraper", operation: "gmb_scan", cacheHit: false, costUsd: result ? 0.005 : 0, latencyMs: Date.now() - t0, success: result !== null });
  if (result) await setCache("outscraper", key, result, 14, 0.005);
  return result;
}

async function cachedDomainOverview(domain: string) {
  const key = `ahrefs:domain:${domain}`;
  const cached = await getCached<{ domain_rating: number; backlinks: number; organic_traffic: number }>("ahrefs", key);
  if (cached) {
    await logProviderCall({ provider: "ahrefs", operation: "domain_overview", cacheHit: true, costUsd: 0, success: true });
    return cached;
  }
  const t0 = Date.now();
  const result = await fetchDomainOverview(domain);
  await logProviderCall({ provider: "ahrefs", operation: "domain_overview", cacheHit: false, costUsd: result ? 0.01 : 0, latencyMs: Date.now() - t0, success: result !== null });
  if (result) await setCache("ahrefs", key, result, 14, 0.01);
  return result;
}

async function cachedPageSpeedScan(url: string, strategy: "mobile" | "desktop") {
  const key = `pagespeed:scan:${url}:${strategy}`;
  const cached = await getCached<number>("pagespeed", key);
  if (cached !== null) {
    await logProviderCall({ provider: "pagespeed", operation: `scan_${strategy}`, cacheHit: true, costUsd: 0, success: true });
    return cached;
  }
  const t0 = Date.now();
  const result = await fetchPageSpeedScan(url, strategy);
  await logProviderCall({ provider: "pagespeed", operation: `scan_${strategy}`, cacheHit: false, costUsd: 0, latencyMs: Date.now() - t0, success: result !== null });
  if (result !== null) await setCache("pagespeed", key, result, 14);
  return result;
}

async function cachedKeywordRankings(domain: string, keywords: string[]) {
  if (keywords.length === 0) return {};
  const key = `ahrefs:keywords:${domain}`;
  const cached = await getCached<Record<string, number>>("ahrefs", key);
  if (cached) {
    await logProviderCall({ provider: "ahrefs", operation: "keyword_rankings", cacheHit: true, costUsd: 0, success: true });
    return cached;
  }
  const t0 = Date.now();
  const result = await fetchKeywordRankings(domain, keywords);
  await logProviderCall({ provider: "ahrefs", operation: "keyword_rankings", cacheHit: false, costUsd: Object.keys(result).length > 0 ? 0.01 : 0, latencyMs: Date.now() - t0, success: true });
  if (Object.keys(result).length > 0) await setCache("ahrefs", key, result, 14, 0.01);
  return result;
}

// ============================================================================
// Core Data Fetcher
// ============================================================================

interface FetchDataParams {
  clientId: number;
  includeCompetitors?: boolean;
}

interface FetchDataResult {
  clientData: ClientData;
  competitors: Competitors;
  apiCosts: ApiCosts;
  errors: string[];
}

export async function fetchScanData(params: FetchDataParams): Promise<FetchDataResult> {
  const { clientId, includeCompetitors = true } = params;

  const client = await prisma.clientProfile.findUnique({
    where: { id: clientId },
    include: {
      lead: { select: { businessName: true, website: true, city: true, state: true } },
      competitors: {
        where: { isActive: true },
        select: { id: true, businessName: true, domain: true, googlePlaceId: true },
      },
    },
  });

  if (!client) throw new Error(`Client ${clientId} not found`);

  const errors: string[] = [];
  const apiCallCounts = { outscraper: 0, ahrefs: 0, pagespeed: 0 };

  const trackedKeywords = await getClientKeywords(clientId);
  const clientDomain = client.lead.website?.replace(/^https?:\/\//, "").replace(/\/.*$/, "") ?? "";

  const [gmbData, domainData, speedMobile, speedDesktop, rankings] = await Promise.allSettled([
    cachedGMBScan(client.lead.businessName, client.lead.city, client.lead.state),
    clientDomain ? cachedDomainOverview(clientDomain) : Promise.resolve(null),
    clientDomain ? cachedPageSpeedScan(clientDomain, "mobile") : Promise.resolve(null),
    clientDomain ? cachedPageSpeedScan(clientDomain, "desktop") : Promise.resolve(null),
    clientDomain ? cachedKeywordRankings(clientDomain, trackedKeywords) : Promise.resolve({}),
  ]);

  if (gmbData.status === "fulfilled" && gmbData.value) apiCallCounts.outscraper++;
  if (domainData.status === "fulfilled" && domainData.value) apiCallCounts.ahrefs++;
  if (speedMobile.status === "fulfilled" && speedMobile.value) apiCallCounts.pagespeed++;
  if (speedDesktop.status === "fulfilled" && speedDesktop.value) apiCallCounts.pagespeed++;
  if (rankings.status === "fulfilled" && Object.keys(rankings.value || {}).length > 0) apiCallCounts.ahrefs++;

  [gmbData, domainData, speedMobile, speedDesktop, rankings].forEach((result, idx) => {
    if (result.status === "rejected") {
      errors.push(`Client fetch ${["GMB", "Domain", "SpeedMobile", "SpeedDesktop", "Rankings"][idx]} failed: ${result.reason}`);
    }
  });

  const clientData: ClientData = {
    domainRating: domainData.status === "fulfilled" && domainData.value ? domainData.value.domain_rating : 0,
    reviewCount: gmbData.status === "fulfilled" && gmbData.value ? gmbData.value.reviews : 0,
    reviewAvg: gmbData.status === "fulfilled" && gmbData.value ? gmbData.value.rating : 0,
    siteSpeedMobile: speedMobile.status === "fulfilled" && speedMobile.value ? speedMobile.value : 0,
    siteSpeedDesktop: speedDesktop.status === "fulfilled" && speedDesktop.value ? speedDesktop.value : 0,
    backlinks: domainData.status === "fulfilled" && domainData.value ? domainData.value.backlinks : 0,
    rankings: rankings.status === "fulfilled" ? rankings.value || {} : {},
    organicTraffic: domainData.status === "fulfilled" && domainData.value ? domainData.value.organic_traffic : undefined,
  };

  // Competitor data
  const competitors: Competitors = [];

  if (includeCompetitors) {
    for (const comp of client.competitors) {
      const compDomain = comp.domain?.replace(/^https?:\/\//, "").replace(/\/.*$/, "") ?? "";

      const [compGMB, compDomainData, compSpeed, compRankings] = await Promise.allSettled([
        comp.googlePlaceId
          ? cachedGMBScan(comp.businessName, client.lead.city, client.lead.state)
          : Promise.resolve(null),
        compDomain ? cachedDomainOverview(compDomain) : Promise.resolve(null),
        compDomain ? cachedPageSpeedScan(compDomain, "mobile") : Promise.resolve(null),
        compDomain ? cachedKeywordRankings(compDomain, trackedKeywords) : Promise.resolve({}),
      ]);

      if (compGMB.status === "fulfilled" && compGMB.value) apiCallCounts.outscraper++;
      if (compDomainData.status === "fulfilled" && compDomainData.value) apiCallCounts.ahrefs++;
      if (compSpeed.status === "fulfilled" && compSpeed.value) apiCallCounts.pagespeed++;
      if (compRankings.status === "fulfilled" && Object.keys(compRankings.value || {}).length > 0) apiCallCounts.ahrefs++;

      competitors.push({
        businessName: comp.businessName,
        domain: compDomain,
        googlePlaceId: comp.googlePlaceId || undefined,
        domainRating: compDomainData.status === "fulfilled" && compDomainData.value ? compDomainData.value.domain_rating : 0,
        reviewCount: compGMB.status === "fulfilled" && compGMB.value ? compGMB.value.reviews : 0,
        reviewAvg: compGMB.status === "fulfilled" && compGMB.value ? compGMB.value.rating : 0,
        siteSpeedMobile: compSpeed.status === "fulfilled" && compSpeed.value ? compSpeed.value : 0,
        siteSpeedDesktop: 0,
        backlinks: compDomainData.status === "fulfilled" && compDomainData.value ? compDomainData.value.backlinks : 0,
        rankings: compRankings.status === "fulfilled" ? compRankings.value || {} : {},
        organicTraffic: compDomainData.status === "fulfilled" && compDomainData.value ? compDomainData.value.organic_traffic : undefined,
      });
    }
  }

  const apiCosts: ApiCosts = {
    outscraper: apiCallCounts.outscraper * 0.005,
    ahrefs: apiCallCounts.ahrefs * 0.01,
    pagespeed: 0,
    total: 0,
    calls: apiCallCounts,
  };
  apiCosts.total = apiCosts.outscraper + apiCosts.ahrefs;

  return { clientData, competitors, apiCosts, errors };
}
