// src/lib/intel/patterns/upsell.ts
// Intelligence Engine — Sprint IE-06
// Upsell Detection Engine — pattern matching on competitive scan deltas.
//
// Rules:
//   competitor_ppc_detected     → recommend PPC management
//   competitor_review_surge     → recommend review generation
//   competitor_site_redesign    → recommend UX audit
//   keyword_gap_opportunity     → recommend content expansion
//
// Each opportunity includes: competitor context, estimated impact,
// proposed service, and estimated price range.
//
// Rate limit: max MAX_UPSELLS_PER_CYCLE per client per scan cycle.
// Writes UpsellOpportunity records (existing model).
// Falls back to ClientTask if no matching Product record found.

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// ── Constants ──────────────────────────────────────────────────────────────────

const MAX_UPSELLS_PER_CYCLE = 3;

// ── Rule definitions ───────────────────────────────────────────────────────────

interface UpsellRule {
  ruleId: string;
  label: string;
  gapCategory: string;
  /** Metric key to look for in competitor snapshot metrics */
  triggerMetric: string;
  /**
   * For delta rules: minimum absolute or % increase in the metric
   * For presence rules: minimum raw value indicating the feature is active
   */
  triggerType: "delta_pct" | "absolute_min" | "presence";
  triggerValue: number;
  /** Service to propose */
  proposedService: string;
  /** Product name to look up in the Product table */
  productName: string;
  /** Estimated monthly recurring revenue range */
  estimatedMrrMin: number;
  estimatedMrrMax: number;
  /** Opportunity score 0–100 */
  baseScore: number;
  /** Short explanation template. {competitor} {metric} {value} available. */
  reasoningTemplate: string;
}

const UPSELL_RULES: UpsellRule[] = [
  {
    ruleId: "competitor_ppc_detected",
    label: "Competitor PPC Activity Detected",
    gapCategory: "paid_search",
    triggerMetric: "paidKeywords",
    triggerType: "absolute_min",
    triggerValue: 5,
    proposedService: "PPC Management",
    productName: "PPC Management",
    estimatedMrrMin: 750,
    estimatedMrrMax: 1500,
    baseScore: 75,
    reasoningTemplate:
      "{competitor} is running paid search ads ({value} paid keywords detected). " +
      "Your client has no active PPC presence. Adding PPC management now would capture " +
      "top-of-page visibility before the competitor builds brand authority.",
  },
  {
    ruleId: "competitor_review_surge",
    label: "Competitor Review Velocity Gap",
    gapCategory: "reputation",
    triggerMetric: "reviewCount",
    triggerType: "delta_pct",
    triggerValue: 15,
    proposedService: "Review Generation",
    productName: "Review Generation",
    estimatedMrrMin: 300,
    estimatedMrrMax: 600,
    baseScore: 65,
    reasoningTemplate:
      "{competitor} gained {value}% more reviews this period. A growing review gap " +
      "directly impacts local pack rankings. Review generation would close this gap " +
      "within 60–90 days.",
  },
  {
    ruleId: "competitor_site_redesign",
    label: "Competitor Site Redesign Detected",
    gapCategory: "website",
    triggerMetric: "mobileScore",
    triggerType: "delta_pct",
    triggerValue: 20,
    proposedService: "Website UX Audit",
    productName: "Website Audit",
    estimatedMrrMin: 500,
    estimatedMrrMax: 1000,
    baseScore: 60,
    reasoningTemplate:
      "{competitor} improved their mobile performance score by {value}% this period, " +
      "suggesting a recent site redesign or significant technical investment. " +
      "A UX audit would identify where your client's site is falling behind on " +
      "Core Web Vitals and user experience.",
  },
  {
    ruleId: "keyword_gap_opportunity",
    label: "Keyword Gap Opportunity Identified",
    gapCategory: "content",
    triggerMetric: "organicKeywords",
    triggerType: "delta_pct",
    triggerValue: 10,
    proposedService: "Content Expansion",
    productName: "Content Marketing",
    estimatedMrrMin: 600,
    estimatedMrrMax: 1200,
    baseScore: 70,
    reasoningTemplate:
      "{competitor} increased their organic keyword footprint by {value}% this period. " +
      "Expanding your client's content to cover these emerging keyword clusters would " +
      "recapture search visibility before competitor authority compounds.",
  },
];

// ── Types ──────────────────────────────────────────────────────────────────────

export interface UpsellDetectionResult {
  opportunitiesCreated: number;
  tasksCreated: number;
  skipped: number;
  errors: string[];
  opportunities: DetectedOpportunity[];
}

export interface DetectedOpportunity {
  ruleId: string;
  label: string;
  gapCategory: string;
  competitorDomain: string;
  proposedService: string;
  estimatedMrrMin: number;
  estimatedMrrMax: number;
  opportunityScore: number;
  reasoning: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function interpolateReasoning(
  template: string,
  competitor: string,
  metricValue: number
): string {
  return template
    .replace("{competitor}", competitor)
    .replace("{value}", Math.round(metricValue).toString());
}

async function findProduct(productName: string): Promise<number | null> {
  const exact = await prisma.product.findFirst({
    where: {
      name: { contains: productName, mode: "insensitive" },
      isActive: true,
    },
    select: { id: true },
  });
  return exact?.id ?? null;
}

async function countRecentUpsells(clientId: number): Promise<number> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7-day cycle
  return prisma.upsellOpportunity.count({
    where: {
      clientId,
      detectedAt: { gte: since },
    },
  });
}

async function isDuplicateOpportunity(
  clientId: number,
  gapCategory: string
): Promise<boolean> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30-day dedup window
  const existing = await prisma.upsellOpportunity.findFirst({
    where: {
      clientId,
      gapCategory,
      detectedAt: { gte: since },
    },
    select: { id: true },
  });
  return existing !== null;
}

// ── Metric evaluation ──────────────────────────────────────────────────────────

interface EvalResult {
  triggered: boolean;
  triggerValue: number;
}

function evaluateRule(
  rule: UpsellRule,
  competitorMetrics: Record<string, unknown>,
  previousCompetitorMetrics: Record<string, unknown> | null
): EvalResult {
  const current = competitorMetrics[rule.triggerMetric];
  if (typeof current !== "number") return { triggered: false, triggerValue: 0 };

  switch (rule.triggerType) {
    case "absolute_min":
      return { triggered: current >= rule.triggerValue, triggerValue: current };

    case "presence":
      return { triggered: current > 0, triggerValue: current };

    case "delta_pct": {
      if (!previousCompetitorMetrics) return { triggered: false, triggerValue: 0 };
      const prev = previousCompetitorMetrics[rule.triggerMetric];
      if (typeof prev !== "number" || prev === 0) return { triggered: false, triggerValue: 0 };
      const pctChange = ((current - prev) / Math.abs(prev)) * 100;
      return {
        triggered: pctChange >= rule.triggerValue,
        triggerValue: pctChange,
      };
    }
  }
}

// ── Main entry point ───────────────────────────────────────────────────────────

/**
 * Detect upsell opportunities for a client from the latest scan's competitor data.
 *
 * Queries the most recent competitor snapshots for this asset group, evaluates
 * each rule, and writes UpsellOpportunity records (or ClientTask fallbacks).
 * Caps at MAX_UPSELLS_PER_CYCLE per client per scan cycle.
 */
export async function detectUpsellOpportunities(
  tenantId: number,
  assetGroupId: number,
  scanId: number
): Promise<UpsellDetectionResult> {
  const result: UpsellDetectionResult = {
    opportunitiesCreated: 0,
    tasksCreated: 0,
    skipped: 0,
    errors: [],
    opportunities: [],
  };

  // ── Resolve client ─────────────────────────────────────────────────────────
  const group = await prisma.intelAssetGroup.findUnique({
    where: { id: assetGroupId },
    select: { clientProfileId: true, name: true },
  });
  if (!group?.clientProfileId) {
    result.skipped = UPSELL_RULES.length;
    return result; // Only run for SEO agency clients
  }
  const clientId = group.clientProfileId;

  // ── Check global cycle cap ─────────────────────────────────────────────────
  const recentCount = await countRecentUpsells(clientId);
  if (recentCount >= MAX_UPSELLS_PER_CYCLE) {
    result.skipped = UPSELL_RULES.length;
    return result;
  }
  let remainingSlots = MAX_UPSELLS_PER_CYCLE - recentCount;

  // ── Fetch most recent competitor snapshots for this scan ──────────────────
  const currentSnapshots = await prisma.intelSnapshot.findMany({
    where: { scanId, entityType: "competitor" },
    select: {
      competitorId: true,
      metrics: true,
      competitor: { select: { domain: true, name: true } },
    },
  });

  if (currentSnapshots.length === 0) {
    return result;
  }

  // ── Fetch previous competitor snapshots for delta calculations ─────────────
  const previousMetricsMap = new Map<number, Record<string, unknown>>();
  for (const snap of currentSnapshots) {
    if (!snap.competitorId) continue;
    const prev = await prisma.intelSnapshot.findFirst({
      where: {
        competitorId: snap.competitorId,
        scanId: { not: scanId },
        entityType: "competitor",
      },
      orderBy: { createdAt: "desc" },
      select: { metrics: true },
    });
    if (prev) {
      previousMetricsMap.set(snap.competitorId, prev.metrics as Record<string, unknown>);
    }
  }

  // ── Evaluate rules against each competitor snapshot ────────────────────────
  const detected: DetectedOpportunity[] = [];

  for (const snap of currentSnapshots) {
    if (remainingSlots <= 0) break;
    const competitorDomain =
      snap.competitor?.domain ?? snap.competitor?.name ?? "Competitor";
    const metrics = snap.metrics as Record<string, unknown>;
    const prevMetrics = snap.competitorId
      ? (previousMetricsMap.get(snap.competitorId) ?? null)
      : null;

    for (const rule of UPSELL_RULES) {
      if (remainingSlots <= 0) break;

      // Check dedup — skip if same gap category was upselled in last 30d
      if (await isDuplicateOpportunity(clientId, rule.gapCategory)) {
        result.skipped++;
        continue;
      }

      const evalResult = evaluateRule(rule, metrics, prevMetrics);
      if (!evalResult.triggered) continue;

      const reasoning = interpolateReasoning(
        rule.reasoningTemplate,
        competitorDomain,
        evalResult.triggerValue
      );

      const estimatedMrr =
        (rule.estimatedMrrMin + rule.estimatedMrrMax) / 2;

      detected.push({
        ruleId: rule.ruleId,
        label: rule.label,
        gapCategory: rule.gapCategory,
        competitorDomain,
        proposedService: rule.proposedService,
        estimatedMrrMin: rule.estimatedMrrMin,
        estimatedMrrMax: rule.estimatedMrrMax,
        opportunityScore: rule.baseScore,
        reasoning,
      });

      // ── Persist UpsellOpportunity ──────────────────────────────────────────
      try {
        const productId = await findProduct(rule.productName);

        if (productId) {
          await prisma.upsellOpportunity.create({
            data: {
              clientId,
              productId,
              status: "detected",
              opportunityScore: rule.baseScore,
              gapCategory: rule.gapCategory,
              reasoning,
              projectedMrr: estimatedMrr,
              projectedRoi: null,
            },
          });
          result.opportunitiesCreated++;
        } else {
          // Fallback: create a ClientTask flagging the upsell
          await prisma.clientTask.create({
            data: {
              clientId,
              title: `Upsell opportunity: ${rule.label}`,
              description: reasoning,
              category: "general",
              priority: "P2",
              status: "queued",
              source: "intelligence_engine",
              intelScanId: scanId,
              contentBrief: {
                type: "upsell_opportunity",
                ruleId: rule.ruleId,
                gapCategory: rule.gapCategory,
                proposedService: rule.proposedService,
                estimatedMrrMin: rule.estimatedMrrMin,
                estimatedMrrMax: rule.estimatedMrrMax,
                opportunityScore: rule.baseScore,
                competitorDomain,
              } as Prisma.InputJsonValue,
            },
          });
          result.tasksCreated++;
        }

        remainingSlots--;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        result.errors.push(`${rule.ruleId}: ${msg}`);
      }
    }
  }

  result.opportunities = detected;
  return result;
}
