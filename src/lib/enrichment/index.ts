import { prisma } from "@/lib/db";

// ============================================================================
// Outscraper - Google My Business data (reviews, rating, hours, photos)
// ============================================================================

type OutscraperResult = {
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

async function fetchOutscraper(businessName: string, city: string, state: string): Promise<OutscraperResult | null> {
  const apiKey = process.env.OUTSCRAPER_API_KEY;
  if (!apiKey) {
    console.warn("OUTSCRAPER_API_KEY not set, skipping GMB enrichment");
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
      console.error(`Outscraper error: ${res.status} ${res.statusText}`);
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
    console.error("Outscraper fetch failed:", err);
    return null;
  }
}

// ============================================================================
// Ahrefs - Domain rating, backlinks, organic keywords
// ============================================================================

type AhrefsResult = {
  domain_rating: number;
  ahrefs_rank: number;
  backlinks: number;
  referring_domains: number;
  organic_keywords: number;
  organic_traffic: number;
};

async function fetchAhrefs(domain: string): Promise<AhrefsResult | null> {
  const apiKey = process.env.AHREFS_API_KEY;
  if (!apiKey) {
    console.warn("AHREFS_API_KEY not set, skipping domain enrichment");
    return null;
  }

  try {
    const res = await fetch(
      `https://api.ahrefs.com/v3/site-explorer/overview?target=${encodeURIComponent(domain)}&mode=domain`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!res.ok) {
      console.error(`Ahrefs error: ${res.status} ${res.statusText}`);
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
    console.error("Ahrefs fetch failed:", err);
    return null;
  }
}

// ============================================================================
// PageSpeed Insights - Performance, accessibility, SEO scores
// ============================================================================

type PageSpeedResult = {
  performance_score: number;
  accessibility_score: number;
  seo_score: number;
  best_practices_score: number;
  fcp: number; // First Contentful Paint (ms)
  lcp: number; // Largest Contentful Paint (ms)
  cls: number; // Cumulative Layout Shift
  tbt: number; // Total Blocking Time (ms)
  speed_index: number;
};

async function fetchPageSpeed(url: string): Promise<PageSpeedResult | null> {
  const apiKey = process.env.PAGESPEED_API_KEY;
  if (!apiKey) {
    console.warn("PAGESPEED_API_KEY not set, skipping performance enrichment");
    return null;
  }

  try {
    const target = url.startsWith("http") ? url : `https://${url}`;
    const res = await fetch(
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(target)}&strategy=mobile&key=${apiKey}`,
      { signal: AbortSignal.timeout(30000) } // PageSpeed can be slow
    );

    if (!res.ok) {
      console.error(`PageSpeed error: ${res.status} ${res.statusText}`);
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
    console.error("PageSpeed fetch failed:", err);
    return null;
  }
}

// ============================================================================
// Enrichment Orchestrator - runs all providers, saves to competitive_intel
// ============================================================================

export type EnrichmentResult = {
  leadId: number;
  outscraper: OutscraperResult | null;
  ahrefs: AhrefsResult | null;
  pageSpeed: PageSpeedResult | null;
  errors: string[];
};

export async function enrichLead(leadId: number): Promise<EnrichmentResult> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      id: true,
      businessName: true,
      city: true,
      state: true,
      website: true,
    },
  });

  if (!lead) {
    throw new Error(`Lead ${leadId} not found`);
  }

  const errors: string[] = [];

  // Run all enrichment providers in parallel
  const [outscraper, ahrefs, pageSpeed] = await Promise.allSettled([
    fetchOutscraper(lead.businessName, lead.city, lead.state),
    lead.website ? fetchAhrefs(lead.website.replace(/^https?:\/\//, "").replace(/\/.*$/, "")) : Promise.resolve(null),
    lead.website ? fetchPageSpeed(lead.website) : Promise.resolve(null),
  ]);

  const outscraperData = outscraper.status === "fulfilled" ? outscraper.value : null;
  const ahrefsData = ahrefs.status === "fulfilled" ? ahrefs.value : null;
  const pageSpeedData = pageSpeed.status === "fulfilled" ? pageSpeed.value : null;

  if (outscraper.status === "rejected") errors.push(`Outscraper: ${outscraper.reason}`);
  if (ahrefs.status === "rejected") errors.push(`Ahrefs: ${ahrefs.reason}`);
  if (pageSpeed.status === "rejected") errors.push(`PageSpeed: ${pageSpeed.reason}`);

  // Upsert competitive intel record with actual schema fields
  const intelData: Record<string, unknown> = {
    fetchedAt: new Date(),
  };

  if (ahrefsData) {
    intelData.domainRating = ahrefsData.domain_rating;
    intelData.currentRank = ahrefsData.ahrefs_rank;
    intelData.backlinks = ahrefsData.backlinks;
  }

  if (outscraperData) {
    intelData.reviewCount = outscraperData.reviews;
    intelData.reviewAvg = outscraperData.rating;
  }

  if (pageSpeedData) {
    intelData.siteSpeedMobile = pageSpeedData.performance_score;
    intelData.siteSpeedDesktop = pageSpeedData.seo_score; // Using SEO score for desktop metric
  }

  await prisma.competitiveIntel.upsert({
    where: { leadId },
    create: { leadId, ...intelData },
    update: intelData,
  });

  // Update lead's SEO fields from enrichment data
  const leadUpdate: Record<string, unknown> = {};

  if (ahrefsData) {
    leadUpdate.domainRating = ahrefsData.domain_rating;
    leadUpdate.currentRank = ahrefsData.ahrefs_rank;
  }

  if (outscraperData) {
    leadUpdate.reviewCount = outscraperData.reviews;
    leadUpdate.reviewAvg = outscraperData.rating;
    // Backfill website if missing
    if (!lead.website && outscraperData.site) {
      leadUpdate.website = outscraperData.site;
    }
  }

  if (Object.keys(leadUpdate).length > 0) {
    await prisma.lead.update({
      where: { id: leadId },
      data: leadUpdate,
    });
  }

  return {
    leadId,
    outscraper: outscraperData,
    ahrefs: ahrefsData,
    pageSpeed: pageSpeedData,
    errors,
  };
}

// ============================================================================
// Batch Enrichment - process multiple leads with rate limiting
// ============================================================================

export async function enrichLeadsBatch(
  leadIds: number[],
  onProgress?: (completed: number, total: number) => void
): Promise<EnrichmentResult[]> {
  const results: EnrichmentResult[] = [];
  const batchSize = 3; // Concurrent limit to respect API rate limits

  for (let i = 0; i < leadIds.length; i += batchSize) {
    const batch = leadIds.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((id) =>
        enrichLead(id).catch((err) => ({
          leadId: id,
          outscraper: null,
          ahrefs: null,
          pageSpeed: null,
          errors: [String(err)],
        }))
      )
    );

    results.push(...batchResults);
    onProgress?.(results.length, leadIds.length);

    // Rate limiting pause between batches
    if (i + batchSize < leadIds.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
}
