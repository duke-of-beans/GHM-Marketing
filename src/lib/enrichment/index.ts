import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

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

async function fetchOutscraper(
  businessName: string,
  city: string,
  state: string
): Promise<OutscraperResult | null> {
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
  fcp: number;
  lcp: number;
  cls: number;
  tbt: number;
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
      { signal: AbortSignal.timeout(30000) }
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
// Enrichment Orchestrator
// ============================================================================

export type EnrichmentResult = {
  leadId: number;
  outscraper: OutscraperResult | null;
  ahrefs: AhrefsResult | null;
  pageSpeed: PageSpeedResult | null;
  errors: string[];
  skipped?: boolean;
  lastEnrichedAt?: Date | null;
};

// Leads enriched within this window are skipped unless force=true
export const ENRICHMENT_COOLDOWN_DAYS = 7;

// Approximate cost per enrichment call (Outscraper ~$0.005 + Ahrefs ~$0.02 + PageSpeed free)
const COST_PER_ENRICHMENT = new Prisma.Decimal("0.025");

export async function enrichLead(
  leadId: number,
  force = false
): Promise<EnrichmentResult> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      id: true,
      businessName: true,
      city: true,
      state: true,
      website: true,
      intelLastUpdated: true,
    },
  });

  if (!lead) throw new Error(`Lead ${leadId} not found`);

  // Duplicate-billing guard: skip if enriched recently (unless forced)
  if (!force && lead.intelLastUpdated) {
    const daysSince = (Date.now() - lead.intelLastUpdated.getTime()) / 86_400_000;
    if (daysSince < ENRICHMENT_COOLDOWN_DAYS) {
      return {
        leadId,
        outscraper: null,
        ahrefs: null,
        pageSpeed: null,
        errors: [],
        skipped: true,
        lastEnrichedAt: lead.intelLastUpdated,
      };
    }
  }

  const errors: string[] = [];

  const [outscraper, ahrefs, pageSpeed] = await Promise.allSettled([
    fetchOutscraper(lead.businessName, lead.city, lead.state),
    lead.website
      ? fetchAhrefs(lead.website.replace(/^https?:\/\//, "").replace(/\/.*$/, ""))
      : Promise.resolve(null),
    lead.website ? fetchPageSpeed(lead.website) : Promise.resolve(null),
  ]);

  const outscraperData = outscraper.status === "fulfilled" ? outscraper.value : null;
  const ahrefsData = ahrefs.status === "fulfilled" ? ahrefs.value : null;
  const pageSpeedData = pageSpeed.status === "fulfilled" ? pageSpeed.value : null;

  if (outscraper.status === "rejected") errors.push(`Outscraper: ${outscraper.reason}`);
  if (ahrefs.status === "rejected") errors.push(`Ahrefs: ${ahrefs.reason}`);
  if (pageSpeed.status === "rejected") errors.push(`PageSpeed: ${pageSpeed.reason}`);

  const now = new Date();

  // Calculate cost based on which APIs actually fired
  const cost = new Prisma.Decimal(
    (outscraperData ? 0.005 : 0) +
    (ahrefsData ? 0.02 : 0) +
    (pageSpeedData ? 0 : 0) // PageSpeed is free
  );

  // Upsert competitive intel
  const intelData: Record<string, unknown> = {
    fetchedAt: now,
    apiCosts: cost.greaterThan(0) ? cost : COST_PER_ENRICHMENT,
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
    intelData.siteSpeedDesktop = pageSpeedData.seo_score;
  }

  await prisma.competitiveIntel.upsert({
    where: { leadId },
    create: { leadId, ...intelData },
    update: intelData,
  });

  // Update lead fields + stamp intelLastUpdated
  const leadUpdate: Record<string, unknown> = {
    intelLastUpdated: now,
    intelNeedsRefresh: false,
  };

  if (ahrefsData) {
    leadUpdate.domainRating = ahrefsData.domain_rating;
    leadUpdate.currentRank = ahrefsData.ahrefs_rank;
  }
  if (outscraperData) {
    leadUpdate.reviewCount = outscraperData.reviews;
    leadUpdate.reviewAvg = outscraperData.rating;
    if (!lead.website && outscraperData.site) {
      leadUpdate.website = outscraperData.site;
    }
  }

  await prisma.lead.update({ where: { id: leadId }, data: leadUpdate });

  return {
    leadId,
    outscraper: outscraperData,
    ahrefs: ahrefsData,
    pageSpeed: pageSpeedData,
    errors,
    lastEnrichedAt: now,
  };
}

// ============================================================================
// Batch Enrichment - respects cooldown, reports skips
// ============================================================================

export type BatchEnrichmentResult = {
  results: EnrichmentResult[];
  summary: {
    total: number;
    enriched: number;
    skipped: number;
    errors: number;
    providers: { outscraper: number; ahrefs: number; pageSpeed: number };
  };
};

export async function enrichLeadsBatch(
  leadIds: number[],
  force = false,
  onProgress?: (completed: number, total: number) => void
): Promise<BatchEnrichmentResult> {
  const results: EnrichmentResult[] = [];
  const batchSize = 3;

  for (let i = 0; i < leadIds.length; i += batchSize) {
    const batch = leadIds.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((id) =>
        enrichLead(id, force).catch((err) => ({
          leadId: id,
          outscraper: null,
          ahrefs: null,
          pageSpeed: null,
          errors: [String(err)],
          skipped: false,
        }))
      )
    );

    results.push(...batchResults);
    onProgress?.(results.length, leadIds.length);

    if (i + batchSize < leadIds.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  const summary = {
    total: results.length,
    enriched: results.filter((r) => !r.skipped && r.errors.length === 0).length,
    skipped: results.filter((r) => r.skipped).length,
    errors: results.filter((r) => r.errors.length > 0).length,
    providers: {
      outscraper: results.filter((r) => r.outscraper !== null).length,
      ahrefs: results.filter((r) => r.ahrefs !== null).length,
      pageSpeed: results.filter((r) => r.pageSpeed !== null).length,
    },
  };

  return { results, summary };
}
