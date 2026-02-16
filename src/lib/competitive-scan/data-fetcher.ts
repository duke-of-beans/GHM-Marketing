/**
 * Competitive Scan Data Fetcher
 * 
 * Fetches fresh metrics for client + competitors using existing enrichment APIs.
 * Returns structured ClientData and CompetitorData for scan storage.
 */

import type { ClientData, Competitors, ApiCosts } from '@/types/competitive-scan';
import { prisma } from '@/lib/db';

// ============================================================================
// Keyword Rankings Helper
// ============================================================================

async function fetchKeywordRankings(domain: string, keywords: string[]) {
  if (keywords.length === 0) return {};
  
  const apiKey = process.env.AHREFS_API_KEY;
  if (!apiKey) return {};
  
  try {
    // Fetch organic keywords for domain
    const res = await fetch(
      `https://api.ahrefs.com/v3/site-explorer/organic-keywords?target=${encodeURIComponent(domain)}&mode=domain&limit=100`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(10000),
      }
    );
    
    if (!res.ok) return {};
    const data = await res.json();
    
    // Match tracked keywords with API results
    const rankings: Record<string, number> = {};
    keywords.forEach(keyword => {
      const match = data.keywords?.find((k: { keyword?: string; position?: number }) => 
        k.keyword?.toLowerCase() === keyword.toLowerCase()
      );
      if (match?.position) {
        rankings[keyword] = match.position;
      }
    });
    
    return rankings;
  } catch {
    return {};
  }
}

// Get keywords to track for a client
async function getClientKeywords(clientId: number): Promise<string[]> {
  // Check if client has keywords stored in competitive intel
  const client = await prisma.clientProfile.findUnique({
    where: { id: clientId },
    select: {
      lead: {
        select: {
          competitiveIntel: true,
        },
      },
    },
  });
  
  const intel = client?.lead.competitiveIntel as { trackedKeywords?: string[] } | null;
  if (intel?.trackedKeywords && Array.isArray(intel.trackedKeywords)) {
    return intel.trackedKeywords;
  }
  
  // Default: return empty array (keywords should be configured per client)
  return [];
}

// ============================================================================
// Helper Functions to Call Enrichment APIs
// ============================================================================

// These mirror the enrichment functions but are self-contained

async function fetchGMBData(businessName: string, city: string, state: string) {
  const apiKey = process.env.OUTSCRAPER_API_KEY;
  if (!apiKey) return null;

  try {
    const query = encodeURIComponent(`${businessName}, ${city}, ${state}`);
    const res = await fetch(
      `https://api.app.outscraper.com/maps/search-v3?query=${query}&limit=1&async=false`,
      {
        headers: { "X-API-KEY": apiKey },
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!res.ok) return null;
    const data = await res.json();
    const biz = data?.data?.[0]?.[0];
    
    return {
      rating: biz?.rating || 0,
      reviews: biz?.reviews || 0,
    };
  } catch {
    return null;
  }
}


async function fetchDomainData(domain: string) {
  const apiKey = process.env.AHREFS_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://api.ahrefs.com/v3/site-explorer/overview?target=${encodeURIComponent(domain)}&mode=domain`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!res.ok) return null;
    const data = await res.json();
    
    return {
      domain_rating: data.domain_rating ?? 0,
      backlinks: data.backlinks ?? 0,
      organic_traffic: data.org_traffic ?? 0,
    };
  } catch {
    return null;
  }
}

async function fetchSpeedData(url: string, strategy: 'mobile' | 'desktop' = 'mobile') {
  const apiKey = process.env.PAGESPEED_API_KEY;
  if (!apiKey) return null;

  try {
    const target = url.startsWith("http") ? url : `https://${url}`;
    const res = await fetch(
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(target)}&strategy=${strategy}&key=${apiKey}`,
      { signal: AbortSignal.timeout(30000) }
    );

    if (!res.ok) return null;
    const data = await res.json();
    const performance = data.lighthouseResult?.categories?.performance?.score ?? 0;
    
    return Math.round(performance * 100);
  } catch {
    return null;
  }
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
  
  // Load client profile with related data
  const client = await prisma.clientProfile.findUnique({
    where: { id: clientId },
    include: {
      lead: {
        select: {
          businessName: true,
          website: true,
          city: true,
          state: true,
        },
      },
      competitors: {
        where: { isActive: true },
        select: {
          id: true,
          businessName: true,
          domain: true,
          googlePlaceId: true,
        },
      },
    },
  });
  
  if (!client) {
    throw new Error(`Client ${clientId} not found`);
  }

  const errors: string[] = [];
  const apiCallCounts = { outscraper: 0, ahrefs: 0, pagespeed: 0 };
  
  // Get tracked keywords for this client
  const trackedKeywords = await getClientKeywords(clientId);
  
  // Fetch client data
  const clientDomain = client.lead.website?.replace(/^https?:\/\//, '').replace(/\/.*$/, '') || '';
  
  const [gmbData, domainData, speedMobile, speedDesktop, rankings] = await Promise.allSettled([
    fetchGMBData(client.lead.businessName, client.lead.city, client.lead.state),
    clientDomain ? fetchDomainData(clientDomain) : Promise.resolve(null),
    clientDomain ? fetchSpeedData(clientDomain, 'mobile') : Promise.resolve(null),
    clientDomain ? fetchSpeedData(clientDomain, 'desktop') : Promise.resolve(null),
    clientDomain && trackedKeywords.length > 0 ? fetchKeywordRankings(clientDomain, trackedKeywords) : Promise.resolve({}),
  ]);
  
  if (gmbData.status === 'fulfilled' && gmbData.value) apiCallCounts.outscraper++;
  if (domainData.status === 'fulfilled' && domainData.value) apiCallCounts.ahrefs++;
  if (speedMobile.status === 'fulfilled' && speedMobile.value) apiCallCounts.pagespeed++;
  if (speedDesktop.status === 'fulfilled' && speedDesktop.value) apiCallCounts.pagespeed++;
  if (rankings.status === 'fulfilled' && Object.keys(rankings.value || {}).length > 0) apiCallCounts.ahrefs++;
  
  const clientData: ClientData = {
    domainRating: domainData.status === 'fulfilled' && domainData.value ? domainData.value.domain_rating : 0,
    reviewCount: gmbData.status === 'fulfilled' && gmbData.value ? gmbData.value.reviews : 0,
    reviewAvg: gmbData.status === 'fulfilled' && gmbData.value ? gmbData.value.rating : 0,
    siteSpeedMobile: speedMobile.status === 'fulfilled' && speedMobile.value ? speedMobile.value : 0,
    siteSpeedDesktop: speedDesktop.status === 'fulfilled' && speedDesktop.value ? speedDesktop.value : 0,
    backlinks: domainData.status === 'fulfilled' && domainData.value ? domainData.value.backlinks : 0,
    rankings: rankings.status === 'fulfilled' ? rankings.value || {} : {},
    organicTraffic: domainData.status === 'fulfilled' && domainData.value ? domainData.value.organic_traffic : undefined,
  };
  
  // Track errors
  [gmbData, domainData, speedMobile, speedDesktop, rankings].forEach((result, idx) => {
    if (result.status === 'rejected') {
      errors.push(`Client fetch ${['GMB', 'Domain', 'SpeedMobile', 'SpeedDesktop', 'Rankings'][idx]} failed: ${result.reason}`);
    }
  });
  
  // Fetch competitor data
  const competitors: Competitors = [];
  
  if (includeCompetitors) {
    for (const comp of client.competitors) {
      const compDomain = comp.domain?.replace(/^https?:\/\//, '').replace(/\/.*$/, '') || '';
      
      const [compGMB, compDomainData, compSpeedMobile, compRankings] = await Promise.allSettled([
        comp.googlePlaceId 
          ? fetchGMBData(comp.businessName, client.lead.city, client.lead.state)
          : Promise.resolve(null),
        compDomain ? fetchDomainData(compDomain) : Promise.resolve(null),
        compDomain ? fetchSpeedData(compDomain, 'mobile') : Promise.resolve(null),
        compDomain && trackedKeywords.length > 0 ? fetchKeywordRankings(compDomain, trackedKeywords) : Promise.resolve({}),
      ]);
      
      if (compGMB.status === 'fulfilled' && compGMB.value) apiCallCounts.outscraper++;
      if (compDomainData.status === 'fulfilled' && compDomainData.value) apiCallCounts.ahrefs++;
      if (compSpeedMobile.status === 'fulfilled' && compSpeedMobile.value) apiCallCounts.pagespeed++;
      if (compRankings.status === 'fulfilled' && Object.keys(compRankings.value || {}).length > 0) apiCallCounts.ahrefs++;
      
      competitors.push({
        businessName: comp.businessName,
        domain: compDomain,
        googlePlaceId: comp.googlePlaceId || undefined,
        domainRating: compDomainData.status === 'fulfilled' && compDomainData.value ? compDomainData.value.domain_rating : 0,
        reviewCount: compGMB.status === 'fulfilled' && compGMB.value ? compGMB.value.reviews : 0,
        reviewAvg: compGMB.status === 'fulfilled' && compGMB.value ? compGMB.value.rating : 0,
        siteSpeedMobile: compSpeedMobile.status === 'fulfilled' && compSpeedMobile.value ? compSpeedMobile.value : 0,
        siteSpeedDesktop: 0, // Skip desktop for competitors to save API calls
        backlinks: compDomainData.status === 'fulfilled' && compDomainData.value ? compDomainData.value.backlinks : 0,
        rankings: compRankings.status === 'fulfilled' ? compRankings.value || {} : {},
        organicTraffic: compDomainData.status === 'fulfilled' && compDomainData.value ? compDomainData.value.organic_traffic : undefined,
      });
    }
  }
  
  // Calculate API costs (approximate USD)
  const apiCosts: ApiCosts = {
    outscraper: apiCallCounts.outscraper * 0.10, // ~$0.10 per GMB lookup
    ahrefs: apiCallCounts.ahrefs * 0.01,          // ~$0.01 per domain lookup
    pagespeed: 0,                                  // Free API
    total: 0,
    calls: apiCallCounts,
  };
  apiCosts.total = apiCosts.outscraper + apiCosts.ahrefs + apiCosts.pagespeed;
  
  return {
    clientData,
    competitors,
    apiCosts,
    errors,
  };
}
