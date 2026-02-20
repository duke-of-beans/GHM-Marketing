/**
 * Prospect Audit Generator
 *
 * Assembles a full gap-analysis snapshot for a lead:
 *   1. Pulls cached enrichment intel (Outscraper + Ahrefs + PageSpeed)
 *   2. Fires DataForSEO LIVE rank check for 3 primary keywords
 *   3. Spot-checks top 5 NAP directories (skips scrape if fresh CitationScan exists)
 *   4. Returns structured AuditData — consumed by the HTML template
 *
 * Cost per audit: ~$0.006 (3x DataForSEO live @ $0.002/ea)
 * If intel is stale, caller should trigger /enrich first.
 */

import { prisma } from "@/lib/db";
import { fetchLocalRankingsLive, SerpResult } from "@/lib/enrichment/providers/dataforseo";

// ============================================================================
// Output types
// ============================================================================

export interface AuditKeyword {
  keyword: string;
  organicPosition: number | null;
  inLocalPack: boolean;
  localPackRank: number | null;
  localPackTop3: string[];  // competitor names
}

export interface AuditNAPResult {
  directory: string;
  displayName: string;
  status: "match" | "mismatch" | "missing" | "not_checked";
  issues: string[];
}

export interface AuditData {
  generatedAt: Date;
  lead: {
    id: number;
    businessName: string;
    website: string | null;
    phone: string;
    address: string | null;
    city: string;
    state: string;
    zipCode: string;
    category: string | null;
  };
  healthScore: number;
  intel: {
    domainRating: number | null;
    reviewCount: number | null;
    reviewAvg: number | null;
    photosCount: number | null;
    siteSpeedMobile: number | null;
    siteSpeedDesktop: number | null;
    backlinks: number | null;
    intelAge: number | null; // days since last enrichment
  };
  rankings: AuditKeyword[];
  nap: AuditNAPResult[];
  napScore: number | null;
  gaps: AuditGap[];
  repName: string | null;
}

export interface AuditGap {
  category: "rankings" | "citations" | "reviews" | "speed" | "authority";
  severity: "critical" | "warning" | "opportunity";
  finding: string;
  impact: string;
  recommendation: string;
}

// ============================================================================
// Main generator
// ============================================================================

export async function generateAuditData(
  leadId: number,
  repName?: string
): Promise<AuditData> {
  // ── Load lead ──
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      id: true,
      businessName: true,
      website: true,
      phone: true,
      address: true,
      city: true,
      state: true,
      zipCode: true,
      domainRating: true,
      currentRank: true,
      reviewCount: true,
      reviewAvg: true,
      intelLastUpdated: true,
      competitiveIntel: {
        select: {
          domainRating: true,
          backlinks: true,
          reviewCount: true,
          reviewAvg: true,
          siteSpeedMobile: true,
          siteSpeedDesktop: true,
          competitors: true,
          fetchedAt: true,
        },
      },
    },
  });

  if (!lead) throw new Error(`Lead ${leadId} not found`);

  const ci = lead.competitiveIntel;
  const competitorsData = ci?.competitors as Record<string, unknown> | null;

  const intelAgeDays = ci?.fetchedAt
    ? Math.floor((Date.now() - ci.fetchedAt.getTime()) / 86400000)
    : lead.intelLastUpdated
    ? Math.floor((Date.now() - lead.intelLastUpdated.getTime()) / 86400000)
    : null;

  const intel = {
    domainRating: ci?.domainRating ?? lead.domainRating ?? null,
    reviewCount: ci?.reviewCount ?? lead.reviewCount ?? null,
    reviewAvg: ci?.reviewAvg ? Number(ci.reviewAvg) : (lead.reviewAvg ? Number(lead.reviewAvg) : null),
    photosCount: (competitorsData?.photos_count as number) ?? null,
    siteSpeedMobile: ci?.siteSpeedMobile ?? null,
    siteSpeedDesktop: ci?.siteSpeedDesktop ?? null,
    backlinks: ci?.backlinks ?? null,
    intelAge: intelAgeDays,
  };

  // Category from competitors JSON blob (populated by Outscraper) or null
  const category = (competitorsData?.category as string) ?? null;

  // ── Live rank check ──
  const keywords = buildTargetKeywords(lead.businessName, lead.city, lead.state, category);
  let rankings: AuditKeyword[] = [];

  if (lead.zipCode && process.env.DATAFORSEO_LOGIN) {
    const domain = lead.website?.replace(/^https?:\/\//, "").replace(/\/.*$/, "") ?? "";
    const serpResults = await fetchLocalRankingsLive({
      keywords,
      zipCode: lead.zipCode,
      domain,
    }).catch(() => [] as SerpResult[]);

    rankings = serpResults.map((r) => {
      // Find client in local pack by domain match or business name
      let localPackRank: number | null = null;
      const nameLower = lead.businessName.toLowerCase();
      for (const entry of r.localPackEntries) {
        if (entry.title.toLowerCase().includes(nameLower.split(" ")[0])) {
          localPackRank = entry.position;
          break;
        }
      }
      const top3 = r.localPackEntries.slice(0, 3).map((e) => e.title);
      return {
        keyword: r.keyword,
        organicPosition: r.organicPosition,
        inLocalPack: localPackRank !== null,
        localPackRank,
        localPackTop3: top3,
      };
    });
  }

  // ── NAP spot-check — use most recent CitationScan if this lead has a client profile ──
  let napResults: AuditNAPResult[] = [];
  let napScore: number | null = null;

  const recentScan = await prisma.citationScan.findFirst({
    where: {
      client: { lead: { id: leadId } },
      scanDate: { gte: new Date(Date.now() - 60 * 86400000) },
    },
    orderBy: { scanDate: "desc" },
  }).catch(() => null);

  if (recentScan) {
    napScore = recentScan.healthScore;
    const results = (recentScan.results as Array<Record<string, unknown>>) ?? [];
    napResults = results.slice(0, 8).map((r) => ({
      directory: String(r.directoryKey ?? r.key ?? ""),
      displayName: String(r.displayName ?? r.directoryKey ?? ""),
      status: (r.status as AuditNAPResult["status"]) ?? "not_checked",
      issues: (r.details as string[]) ?? [],
    }));
  }

  // ── Build health score ──
  const healthScore = computeAuditScore(intel, rankings, napScore);

  // ── Build gap analysis ──
  const gaps = buildGaps(intel, rankings, napResults, napScore);

  return {
    generatedAt: new Date(),
    lead: {
      id: lead.id,
      businessName: lead.businessName,
      website: lead.website,
      phone: lead.phone,
      address: lead.address,
      city: lead.city,
      state: lead.state,
      zipCode: lead.zipCode,
      category,
    },
    healthScore,
    intel,
    rankings,
    nap: napResults,
    napScore,
    gaps,
    repName: repName ?? null,
  };
}

// ============================================================================
// Helpers
// ============================================================================

function buildTargetKeywords(
  businessName: string,
  city: string,
  state: string,
  category: string | null
): string[] {
  const base = category?.toLowerCase().replace(/\s+/g, " ").trim();
  const loc = `${city} ${state}`;

  if (base) {
    return [
      `${base} ${city}`,
      `best ${base} near me`,
      `${base} ${loc}`,
    ];
  }

  // Fallback: generic local search
  return [
    `${businessName.split(" ")[0]} ${city}`,
    `${city} local business`,
    `${businessName} ${state}`,
  ];
}

function computeAuditScore(
  intel: AuditData["intel"],
  rankings: AuditKeyword[],
  napScore: number | null
): number {
  let score = 50; // baseline

  // Domain rating component (max +20)
  const dr = intel.domainRating ?? 0;
  score += Math.min(20, dr * 0.4);

  // Ranking component (max +15)
  const inPack = rankings.filter((r) => r.inLocalPack).length;
  const packRatio = rankings.length > 0 ? inPack / rankings.length : 0;
  score += packRatio * 15;

  // Reviews (max +10)
  const reviews = intel.reviewCount ?? 0;
  const avg = intel.reviewAvg ?? 0;
  if (reviews >= 50 && avg >= 4.5) score += 10;
  else if (reviews >= 20 && avg >= 4.0) score += 6;
  else if (reviews >= 5) score += 3;

  // PageSpeed (max +10)
  const speed = intel.siteSpeedMobile ?? 0;
  score += Math.min(10, speed * 0.1);

  // NAP (max +10)
  if (napScore !== null) score += napScore * 0.1;

  // Clamp 0–100, round
  return Math.round(Math.max(0, Math.min(100, score)));
}

function buildGaps(
  intel: AuditData["intel"],
  rankings: AuditKeyword[],
  nap: AuditNAPResult[],
  napScore: number | null
): AuditGap[] {
  const gaps: AuditGap[] = [];

  // Ranking gaps
  const notInPack = rankings.filter((r) => !r.inLocalPack);
  if (notInPack.length > 0) {
    gaps.push({
      category: "rankings",
      severity: notInPack.length === rankings.length ? "critical" : "warning",
      finding: `Not appearing in the Google Local Pack for ${notInPack.length} of ${rankings.length} target keywords`,
      impact: "Local Pack listings receive ~3x more clicks than organic results — missing from the pack means customers are calling competitors instead",
      recommendation: "Local Pack optimization: GBP profile completeness, citation consistency, and local keyword targeting",
    });
  }
  const poorOrganic = rankings.filter((r) => r.organicPosition !== null && r.organicPosition > 10);
  if (poorOrganic.length > 0) {
    gaps.push({
      category: "rankings",
      severity: "warning",
      finding: `Ranking on page 2+ for ${poorOrganic.length} keyword${poorOrganic.length > 1 ? "s" : ""}`,
      impact: "Page 2 organic results receive less than 1% of clicks — effectively invisible",
      recommendation: "Content strategy + local landing pages targeting high-intent keywords",
    });
  }

  // Citation gaps
  if (napScore !== null && napScore < 60) {
    gaps.push({
      category: "citations",
      severity: napScore < 40 ? "critical" : "warning",
      finding: `NAP consistency score: ${napScore}/100 — business info is inconsistent across directories`,
      impact: "Inconsistent citations confuse Google and suppress local rankings — Google can't confidently surface a business it can't verify",
      recommendation: "Citation audit and correction across top 50 directories (Yelp, Bing Places, Apple Maps, etc.)",
    });
  }
  const mismatches = nap.filter((n) => n.status === "mismatch" || n.status === "missing");
  if (mismatches.length > 0) {
    gaps.push({
      category: "citations",
      severity: "warning",
      finding: `${mismatches.length} directory listing${mismatches.length > 1 ? "s" : ""} with errors: ${mismatches.map((m) => m.displayName).slice(0, 3).join(", ")}`,
      impact: "Each mismatch dilutes local authority and can cause duplicate listing penalties",
      recommendation: "Correct business name, phone, and address across all affected directories",
    });
  }

  // Review gaps
  const reviews = intel.reviewCount ?? 0;
  const avg = intel.reviewAvg ?? 0;
  if (reviews < 25) {
    gaps.push({
      category: "reviews",
      severity: reviews < 10 ? "critical" : "warning",
      finding: `Only ${reviews} Google review${reviews !== 1 ? "s" : ""} — significantly below the local average of 40–80`,
      impact: "73% of consumers say reviews are more important than proximity when choosing a local business",
      recommendation: "Automated review generation campaign targeting satisfied customers post-service",
    });
  }
  if (reviews >= 10 && avg < 4.2) {
    gaps.push({
      category: "reviews",
      severity: avg < 3.8 ? "critical" : "warning",
      finding: `Average rating of ${avg.toFixed(1)} — below the 4.2+ threshold Google uses to feature businesses prominently`,
      impact: "Sub-4.2 ratings reduce click-through rate and Local Pack eligibility",
      recommendation: "Review response strategy + proactive reputation management",
    });
  }

  // Speed gaps
  const speed = intel.siteSpeedMobile ?? 0;
  if (speed > 0 && speed < 50) {
    gaps.push({
      category: "speed",
      severity: speed < 30 ? "critical" : "warning",
      finding: `Mobile PageSpeed score: ${speed}/100 — Google classifies this as Poor`,
      impact: "53% of mobile users abandon a page that takes longer than 3 seconds. Poor speed is a direct ranking signal",
      recommendation: "Core Web Vitals optimization: image compression, server response time, JavaScript reduction",
    });
  } else if (speed >= 50 && speed < 70) {
    gaps.push({
      category: "speed",
      severity: "opportunity",
      finding: `Mobile PageSpeed score: ${speed}/100 — improvement available`,
      impact: "Moving from 'Needs Improvement' to 'Good' tier measurably increases conversion rate",
      recommendation: "Performance optimization to reach 70+ score",
    });
  }

  // Authority gaps
  const dr = intel.domainRating ?? 0;
  if (dr < 20) {
    gaps.push({
      category: "authority",
      severity: dr < 5 ? "critical" : "warning",
      finding: `Domain Rating: ${dr}/100 — low authority limits ranking potential`,
      impact: "Low DR means Google doesn't trust the site — competing with DR 30–50 businesses in the same market is an uphill battle",
      recommendation: "Link-building campaign: local partnerships, industry directories, and content that earns citations",
    });
  }

  // Sort: critical first
  gaps.sort((a, b) => {
    const order = { critical: 0, warning: 1, opportunity: 2 };
    return order[a.severity] - order[b.severity];
  });

  return gaps;
}
