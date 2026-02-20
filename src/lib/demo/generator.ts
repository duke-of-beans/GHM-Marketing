/**
 * Interactive Demo Generator
 *
 * Builds a branded "what GHM does for you" demo page using the prospect's real data.
 * NOT a gap analysis — this shows what their GHM account would look like after onboarding.
 *
 * Used only on hot calls where a close is likely. Costs ~$0.006 (same DataForSEO calls).
 * Rep hits "Create Demo" in the dashboard during the call → prospect gets a live URL.
 */

import { prisma } from "@/lib/db";
import { fetchLocalRankingsLive } from "@/lib/enrichment/providers/dataforseo";

export interface DemoData {
  generatedAt: Date;
  expiresAt: Date; // 48 hours
  lead: {
    id: number;
    businessName: string;
    website: string | null;
    city: string;
    state: string;
    zipCode: string;
    phone: string;
    category: string | null;
  };
  currentRankings: {
    keyword: string;
    currentPosition: number | null;
    inLocalPack: boolean;
    top3Competitors: string[];
  }[];
  projectedRankings: {
    keyword: string;
    projectedPosition: number | null;
    projectedMonths: number;
    projectedLocalPack: boolean;
  }[];
  satelliteSites: {
    domain: string;
    targetKeyword: string;
    status: "planned" | "building" | "live";
  }[];
  competitorSnapshot: {
    name: string;
    domainRating: number;
    localPackPresence: number; // out of 3 keywords
  }[];
  monthlyValue: {
    estimatedTrafficGain: number;
    estimatedLeadGain: number;
    estimatedRevGain: number;
  };
  repName: string | null;
  token: string;
}

export async function generateDemoData(leadId: number, repName?: string): Promise<DemoData> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      id: true,
      businessName: true,
      website: true,
      phone: true,
      city: true,
      state: true,
      zipCode: true,
      domainRating: true,
      reviewCount: true,
      competitiveIntel: {
        select: {
          competitors: true,
          domainRating: true,
          fetchedAt: true,
        },
      },
    },
  });

  if (!lead) throw new Error(`Lead ${leadId} not found`);

  const ci = lead.competitiveIntel;
  const competitorsData = ci?.competitors as Record<string, unknown> | null;
  const category = (competitorsData?.category as string) ?? null;

  // Build keywords
  const baseCategory = category?.toLowerCase().trim() ?? lead.businessName.split(" ")[0].toLowerCase();
  const keywords = [
    `${baseCategory} ${lead.city}`,
    `best ${baseCategory} near me`,
    `${baseCategory} ${lead.city} ${lead.state}`,
  ];

  // Live rank check
  let currentRankings: DemoData["currentRankings"] = keywords.map((kw) => ({
    keyword: kw,
    currentPosition: null,
    inLocalPack: false,
    top3Competitors: [],
  }));

  const competitors: DemoData["competitorSnapshot"] = [];

  if (lead.zipCode && process.env.DATAFORSEO_LOGIN) {
    const domain = lead.website?.replace(/^https?:\/\//, "").replace(/\/.*$/, "") ?? "";
    const results = await fetchLocalRankingsLive({ keywords, zipCode: lead.zipCode, domain }).catch(() => []);

    currentRankings = results.map((r) => {
      const nameLower = lead.businessName.toLowerCase();
      let inPack = false;
      for (const e of r.localPackEntries) {
        if (e.title.toLowerCase().includes(nameLower.split(" ")[0])) { inPack = true; break; }
      }
      const top3 = r.localPackEntries.slice(0, 3).map((e) => e.title);

      // Collect competitor data
      r.localPackEntries.slice(0, 3).forEach((e) => {
        if (!competitors.find((c) => c.name === e.title)) {
          competitors.push({
            name: e.title,
            domainRating: 20 + Math.floor(Math.random() * 30), // estimated without live DR lookup
            localPackPresence: 1,
          });
        } else {
          const existing = competitors.find((c) => c.name === e.title);
          if (existing) existing.localPackPresence++;
        }
      });

      return {
        keyword: r.keyword,
        currentPosition: r.organicPosition,
        inLocalPack: inPack,
        top3Competitors: top3,
      };
    });
  }

  // Projected rankings — what GHM delivers in 90 days
  const projectedRankings = currentRankings.map((r) => {
    const currentPos = r.currentPosition ?? 40;
    const projected = Math.max(1, Math.min(currentPos - 18, 8));
    return {
      keyword: r.keyword,
      projectedPosition: projected,
      projectedMonths: 3,
      projectedLocalPack: true, // GHM commits to local pack presence
    };
  });

  // Satellite sites — generate plausible cluster
  const satelliteBase = baseCategory.replace(/\s+/g, "-");
  const citySlug = lead.city.toLowerCase().replace(/\s+/g, "-");
  const satelliteSites: DemoData["satelliteSites"] = [
    { domain: `${citySlug}-${satelliteBase}.com`, targetKeyword: keywords[0], status: "planned" },
    { domain: `best-${satelliteBase}-${citySlug}.com`, targetKeyword: keywords[1], status: "planned" },
    { domain: `${satelliteBase}-near-${citySlug}.com`, targetKeyword: keywords[2], status: "planned" },
    { domain: `top-${citySlug}-${satelliteBase}.net`, targetKeyword: `top ${baseCategory} ${lead.city}`, status: "planned" },
    { domain: `${citySlug}-${satelliteBase}-reviews.com`, targetKeyword: `${baseCategory} reviews ${lead.city}`, status: "planned" },
  ];

  // Estimated ROI
  const trafficGain = 180 + Math.floor((lead.domainRating ?? 10) * 2);
  const leadConvRate = 0.04; // 4% of traffic becomes a lead inquiry
  const leadGain = Math.round(trafficGain * leadConvRate);
  const avgJobValue = 450; // conservative SMB average
  const leadCloseRate = 0.25;
  const revGain = Math.round(leadGain * leadCloseRate * avgJobValue);

  const token = `demo-${leadId}-${Date.now().toString(36)}`;

  return {
    generatedAt: new Date(),
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
    lead: {
      id: lead.id,
      businessName: lead.businessName,
      website: lead.website,
      phone: lead.phone,
      city: lead.city,
      state: lead.state,
      zipCode: lead.zipCode,
      category,
    },
    currentRankings,
    projectedRankings,
    satelliteSites,
    competitorSnapshot: competitors.slice(0, 3),
    monthlyValue: {
      estimatedTrafficGain: trafficGain,
      estimatedLeadGain: leadGain,
      estimatedRevGain: revGain,
    },
    repName: repName ?? null,
    token,
  };
}
