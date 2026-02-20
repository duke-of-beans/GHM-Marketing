/**
 * Lead Enrichment Orchestrator
 * Rewired to use provider layer — no more raw API calls here.
 */

import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { fetchGMBFull } from "./providers/outscraper";
import { fetchDomainOverview } from "./providers/ahrefs";
import { fetchPageSpeedFull } from "./providers/pagespeed";
import { getCached, setCache } from "./cache";
import { logProviderCall } from "./cost-tracker";

export type EnrichmentResult = {
  leadId: number;
  outscraper: Awaited<ReturnType<typeof fetchGMBFull>>;
  ahrefs: Awaited<ReturnType<typeof fetchDomainOverview>>;
  pageSpeed: Awaited<ReturnType<typeof fetchPageSpeedFull>>;
  errors: string[];
  skipped?: boolean;
  lastEnrichedAt?: Date | null;
};

export const ENRICHMENT_COOLDOWN_DAYS = 7;

// ============================================================================
// Single lead enrichment with cache + cost tracking
// ============================================================================

export async function enrichLead(leadId: number, force = false): Promise<EnrichmentResult> {
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
  const domain = lead.website?.replace(/^https?:\/\//, "").replace(/\/.*$/, "") ?? "";

  // --- Outscraper ---
  const outscraperKey = `outscraper:gmb:${lead.businessName}:${lead.city}:${lead.state}`.toLowerCase();
  let outscraperData = await getCached<Awaited<ReturnType<typeof fetchGMBFull>>>("outscraper", outscraperKey);
  let outscraperCacheHit = outscraperData !== null;

  if (!outscraperData) {
    const t0 = Date.now();
    outscraperData = await fetchGMBFull(lead.businessName, lead.city, lead.state).catch((e) => {
      errors.push(`Outscraper: ${e}`);
      return null;
    });
    const latencyMs = Date.now() - t0;
    await logProviderCall({ provider: "outscraper", operation: "gmb_full", cacheHit: false, costUsd: outscraperData ? 0.005 : 0, latencyMs, success: outscraperData !== null });
    if (outscraperData) await setCache("outscraper", outscraperKey, outscraperData, 14, 0.005);
  } else {
    await logProviderCall({ provider: "outscraper", operation: "gmb_full", cacheHit: true, costUsd: 0, success: true });
  }

  // --- Ahrefs ---
  const ahrefsKey = `ahrefs:domain:${domain}`;
  let ahrefsData = domain ? await getCached<Awaited<ReturnType<typeof fetchDomainOverview>>>("ahrefs", ahrefsKey) : null;
  let ahrefsCacheHit = ahrefsData !== null;

  if (!ahrefsData && domain) {
    const t0 = Date.now();
    ahrefsData = await fetchDomainOverview(domain).catch((e) => {
      errors.push(`Ahrefs: ${e}`);
      return null;
    });
    const latencyMs = Date.now() - t0;
    await logProviderCall({ provider: "ahrefs", operation: "domain_overview", cacheHit: false, costUsd: ahrefsData ? 0.01 : 0, latencyMs, success: ahrefsData !== null });
    if (ahrefsData) await setCache("ahrefs", ahrefsKey, ahrefsData, 14, 0.01);
  } else if (ahrefsCacheHit) {
    await logProviderCall({ provider: "ahrefs", operation: "domain_overview", cacheHit: true, costUsd: 0, success: true });
  }

  // --- PageSpeed ---
  const psKey = `pagespeed:full:${domain}:mobile`;
  let pageSpeedData = domain ? await getCached<Awaited<ReturnType<typeof fetchPageSpeedFull>>>("pagespeed", psKey) : null;

  if (!pageSpeedData && domain) {
    const t0 = Date.now();
    pageSpeedData = await fetchPageSpeedFull(lead.website!, "mobile").catch((e) => {
      errors.push(`PageSpeed: ${e}`);
      return null;
    });
    const latencyMs = Date.now() - t0;
    await logProviderCall({ provider: "pagespeed", operation: "full_mobile", cacheHit: false, costUsd: 0, latencyMs, success: pageSpeedData !== null });
    if (pageSpeedData) await setCache("pagespeed", psKey, pageSpeedData, 14);
  } else if (pageSpeedData) {
    await logProviderCall({ provider: "pagespeed", operation: "full_mobile", cacheHit: true, costUsd: 0, success: true });
  }

  // Suppress unused variable warnings
  void outscraperCacheHit;
  void ahrefsCacheHit;

  // --- Persist results ---
  const now = new Date();
  const cost = new Prisma.Decimal(
    (outscraperData ? 0.005 : 0) + (ahrefsData ? 0.01 : 0)
  );

  const intelData: Record<string, unknown> = { fetchedAt: now, apiCosts: cost };
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

  const leadUpdate: Record<string, unknown> = { intelLastUpdated: now, intelNeedsRefresh: false };
  if (ahrefsData) {
    leadUpdate.domainRating = ahrefsData.domain_rating;
    leadUpdate.currentRank = ahrefsData.ahrefs_rank;
  }
  if (outscraperData) {
    leadUpdate.reviewCount = outscraperData.reviews;
    leadUpdate.reviewAvg = outscraperData.rating;
    if (!lead.website && outscraperData.site) leadUpdate.website = outscraperData.site;
  }

  await prisma.lead.update({ where: { id: leadId }, data: leadUpdate });

  return { leadId, outscraper: outscraperData, ahrefs: ahrefsData, pageSpeed: pageSpeedData, errors, lastEnrichedAt: now };
}

// ============================================================================
// Batch enrichment
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
      await new Promise((r) => setTimeout(r, 1000));
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
