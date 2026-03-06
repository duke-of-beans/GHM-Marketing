// src/lib/intel/patterns/seasonal.ts
// Intelligence Engine — Sprint IE-06
// Seasonal pattern detection across competitor activity timelines.
//
// Requires 6+ months of IntelSnapshot data per asset group.
// Analyzes competitor snapshots for periodic activity spikes (content, backlinks,
// PPC, reviews) across calendar months, then generates pre-emptive content tasks
// 4 weeks before the historically competitive period approaches.
//
// Graceful degradation: returns insufficient_data when < MIN_MONTHS of scans exist.

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// ── Constants ──────────────────────────────────────────────────────────────────

/** Minimum months of scan history required before pattern detection runs */
const MIN_MONTHS = 6;

/** A month is "competitive" if competitor activity is this % above the annual mean */
const SPIKE_THRESHOLD_PCT = 40;

/** Tasks are generated this many weeks before the competitive period */
const LEAD_WEEKS = 4;

/** Metric keys we look at for "competitor activity" */
const ACTIVITY_METRICS: string[] = [
  "organicPages",          // from Ahrefs — new content published
  "referringDomains",      // backlink velocity
  "estimatedTraffic",      // traffic growth
  "reviewCount",           // review surges (Outscraper)
  "newPagesLast30d",       // PageSpeed / crawl heuristic
];

// ── Types ──────────────────────────────────────────────────────────────────────

export interface SeasonalPattern {
  /** 1-12 */
  peakMonth: number;
  peakMonthName: string;
  metric: string;
  /** Average value during peak month across all years observed */
  peakAvg: number;
  /** Mean across all non-peak months */
  baselineAvg: number;
  /** How much higher the peak is vs baseline (0-1 scale) */
  spikeRatio: number;
  /** Number of years this pattern was observed */
  observedYears: number;
  competitors: string[];
}

export interface SeasonalInsight {
  assetGroupId: number;
  patterns: SeasonalPattern[];
  preemptiveTasks: SeasonalTask[];
  dataMonths: number;
  oldestScanAt: Date;
}

export interface SeasonalTask {
  pattern: SeasonalPattern;
  recommendedPublishBy: Date;
  competitiveWindowStart: Date;
  titleTemplate: string;
  description: string;
  priority: "P1" | "P2" | "P3";
}

export interface SeasonalResult {
  status: "ok" | "insufficient_data";
  reason?: string;
  insight?: SeasonalInsight;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function monthName(m: number): string {
  return MONTH_NAMES[(m - 1) % 12] ?? "Unknown";
}

/** Returns the Date for the first day of a given future month offset */
function firstOfMonth(monthOffset: number): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
}

/** Returns how many weeks until a given month (1-12), looking forward */
function weeksUntilMonth(targetMonth: number): number {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  let monthsAway = targetMonth - currentMonth;
  if (monthsAway <= 0) monthsAway += 12;
  return Math.round(monthsAway * 4.33); // ~4.33 weeks per month
}

// ── Core analysis ──────────────────────────────────────────────────────────────

interface MonthlyBucket {
  month: number; // 1-12
  year: number;
  values: number[];
}

/**
 * Given a flat array of (date, value) observations for a single metric,
 * group by calendar month and detect anomalously high months.
 */
function detectMonthlySpikes(
  observations: Array<{ date: Date; value: number }>
): Array<{ month: number; avg: number; baselineAvg: number; spikeRatio: number; years: number[] }> {
  if (observations.length < 6) return [];

  // Group into monthly buckets across all years
  const buckets = new Map<number, MonthlyBucket>();
  for (const obs of observations) {
    const month = obs.date.getMonth() + 1;
    const year = obs.date.getFullYear();
    const key = month;
    if (!buckets.has(key)) buckets.set(key, { month, year, values: [] });
    buckets.get(key)!.values.push(obs.value);
  }

  // Compute per-month averages
  const monthlyAvgs = new Map<number, number>();
  for (const [month, bucket] of buckets) {
    const avg = bucket.values.reduce((a, b) => a + b, 0) / bucket.values.length;
    monthlyAvgs.set(month, avg);
  }

  // Global baseline = mean of all monthly averages
  const allAvgs = Array.from(monthlyAvgs.values());
  const globalMean = allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length;
  if (globalMean === 0) return [];

  const spikes: Array<{ month: number; avg: number; baselineAvg: number; spikeRatio: number; years: number[] }> = [];

  for (const [month, avg] of monthlyAvgs) {
    const spikeRatio = (avg - globalMean) / globalMean;
    if (spikeRatio * 100 >= SPIKE_THRESHOLD_PCT) {
      // Collect which years showed activity in this month
      const years: number[] = [];
      for (const obs of observations) {
        if (obs.date.getMonth() + 1 === month) {
          const yr = obs.date.getFullYear();
          if (!years.includes(yr)) years.push(yr);
        }
      }
      spikes.push({ month, avg, baselineAvg: globalMean, spikeRatio, years });
    }
  }

  return spikes.sort((a, b) => b.spikeRatio - a.spikeRatio);
}

// ── Main entry point ───────────────────────────────────────────────────────────

/**
 * Analyse seasonal patterns for an asset group.
 *
 * Queries all competitor IntelSnapshot records for this group, extracts
 * activity metrics across the timeline, and detects calendar-month spikes.
 * Returns pre-emptive task recommendations for any approaching peak periods.
 */
export async function detectSeasonalPatterns(
  tenantId: number,
  assetGroupId: number
): Promise<SeasonalResult> {
  // ── Check data sufficiency ─────────────────────────────────────────────────
  const oldestScan = await prisma.intelScan.findFirst({
    where: { tenantId, assetGroupId, status: { in: ["complete", "partial"] } },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true },
  });

  if (!oldestScan) {
    return {
      status: "insufficient_data",
      reason: "No completed scans found for this asset group.",
    };
  }

  const ageMs = Date.now() - oldestScan.createdAt.getTime();
  const ageMonths = ageMs / (1000 * 60 * 60 * 24 * 30.44);

  if (ageMonths < MIN_MONTHS) {
    const needed = Math.ceil(MIN_MONTHS - ageMonths);
    return {
      status: "insufficient_data",
      reason: `Insufficient data — need 6+ months of scans (${Math.floor(ageMonths)} months available, ${needed} more needed).`,
    };
  }

  // ── Fetch competitor snapshots ─────────────────────────────────────────────
  const competitorSnapshots = await prisma.intelSnapshot.findMany({
    where: {
      entityType: "competitor",
      scan: { tenantId, assetGroupId },
    },
    select: {
      createdAt: true,
      metrics: true,
      competitor: { select: { name: true, domain: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  if (competitorSnapshots.length < 10) {
    return {
      status: "insufficient_data",
      reason: "Insufficient competitor snapshot history (need 10+ snapshots).",
    };
  }

  // ── Build per-metric observation arrays ───────────────────────────────────
  const metricObservations = new Map<
    string,
    Array<{ date: Date; value: number; competitorDomain: string }>
  >();
  for (const metric of ACTIVITY_METRICS) {
    metricObservations.set(metric, []);
  }

  for (const snap of competitorSnapshots) {
    const metrics = snap.metrics as Record<string, unknown>;
    const domain = snap.competitor?.domain ?? snap.competitor?.name ?? "unknown";
    for (const metric of ACTIVITY_METRICS) {
      const val = metrics[metric];
      if (typeof val === "number") {
        metricObservations.get(metric)!.push({
          date: snap.createdAt,
          value: val,
          competitorDomain: domain,
        });
      }
    }
  }

  // ── Detect spikes per metric ───────────────────────────────────────────────
  const patterns: SeasonalPattern[] = [];

  for (const metric of ACTIVITY_METRICS) {
    const observations = metricObservations.get(metric) ?? [];
    if (observations.length < 6) continue;

    const spikes = detectMonthlySpikes(observations);
    for (const spike of spikes) {
      // Collect unique competitor domains that contributed to this spike
      const competitorDomains = [
        ...new Set(
          observations
            .filter((o) => o.date.getMonth() + 1 === spike.month)
            .map((o) => o.competitorDomain)
        ),
      ];

      patterns.push({
        peakMonth: spike.month,
        peakMonthName: monthName(spike.month),
        metric,
        peakAvg: spike.avg,
        baselineAvg: spike.baselineAvg,
        spikeRatio: spike.spikeRatio,
        observedYears: spike.years.length,
        competitors: competitorDomains,
      });
    }
  }

  // Deduplicate: keep the strongest signal per peak month
  const byMonth = new Map<number, SeasonalPattern>();
  for (const p of patterns) {
    const existing = byMonth.get(p.peakMonth);
    if (!existing || p.spikeRatio > existing.spikeRatio) {
      byMonth.set(p.peakMonth, p);
    }
  }

  const dedupedPatterns = Array.from(byMonth.values()).sort(
    (a, b) => b.spikeRatio - a.spikeRatio
  );

  // ── Generate pre-emptive tasks ─────────────────────────────────────────────
  const preemptiveTasks: SeasonalTask[] = [];

  for (const pattern of dedupedPatterns) {
    const weeksAway = weeksUntilMonth(pattern.peakMonth);

    // Only generate tasks for periods 2–16 weeks away (actionable window)
    if (weeksAway < 2 || weeksAway > 16) continue;

    const competitiveWindowStart = firstOfMonth(
      pattern.peakMonth - (new Date().getMonth() + 1)
    );
    const recommendedPublishBy = new Date(
      competitiveWindowStart.getTime() - LEAD_WEEKS * 7 * 24 * 60 * 60 * 1000
    );

    const competitorList = pattern.competitors.slice(0, 3).join(", ");
    const spikePercent = Math.round(pattern.spikeRatio * 100);

    preemptiveTasks.push({
      pattern,
      recommendedPublishBy,
      competitiveWindowStart,
      titleTemplate: `Seasonal prep: publish content before ${pattern.peakMonthName} competitive surge`,
      description:
        `Last year, competitors (${competitorList}) significantly increased ${pattern.metric} activity in ` +
        `${pattern.peakMonthName} (+${spikePercent}% above baseline, observed ${pattern.observedYears}x). ` +
        `Recommend publishing content by ${recommendedPublishBy.toLocaleDateString("en-US", { month: "long", day: "numeric" })} ` +
        `to establish position before the competitive window opens.`,
      priority: spikePercent >= 80 ? "P1" : spikePercent >= 50 ? "P2" : "P3",
    });
  }

  const dataMonths = Math.floor(ageMonths);

  return {
    status: "ok",
    insight: {
      assetGroupId,
      patterns: dedupedPatterns,
      preemptiveTasks,
      dataMonths,
      oldestScanAt: oldestScan.createdAt,
    },
  };
}

/**
 * Persist pre-emptive seasonal tasks as ClientTask records.
 * Only runs for asset groups with a linked clientProfileId.
 * Safe to call multiple times — deduplicates by title + clientId.
 */
export async function persistSeasonalTasks(
  assetGroupId: number,
  scanId: number,
  result: SeasonalResult
): Promise<number> {
  if (result.status !== "ok" || !result.insight) return 0;

  const group = await prisma.intelAssetGroup.findUnique({
    where: { id: assetGroupId },
    select: { clientProfileId: true },
  });
  if (!group?.clientProfileId) return 0;

  const clientId = group.clientProfileId;
  let created = 0;

  for (const task of result.insight.preemptiveTasks) {
    // Dedup by title + client
    const existing = await prisma.clientTask.findFirst({
      where: {
        clientId,
        title: task.titleTemplate,
        source: "intelligence_engine",
        status: { in: ["queued", "in_progress"] },
      },
      select: { id: true },
    });
    if (existing) continue;

    await prisma.clientTask.create({
      data: {
        clientId,
        title: task.titleTemplate,
        description: task.description,
        category: "content",
        priority: task.priority,
        status: "queued",
        source: "intelligence_engine",
        intelScanId: scanId,
        contentBrief: {
          type: "seasonal_preemptive",
          peakMonth: task.pattern.peakMonth,
          peakMonthName: task.pattern.peakMonthName,
          metric: task.pattern.metric,
          spikeRatio: task.pattern.spikeRatio,
          observedYears: task.pattern.observedYears,
          competitors: task.pattern.competitors,
          recommendedPublishBy: task.recommendedPublishBy.toISOString(),
          competitiveWindowStart: task.competitiveWindowStart.toISOString(),
        } as Prisma.InputJsonValue,
      },
    });
    created++;
  }

  return created;
}
