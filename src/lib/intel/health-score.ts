// src/lib/intel/health-score.ts
// Intelligence Engine — Sprint IE-02
// Weighted composite health score (0–100) from snapshot metrics.
// Updates IntelAsset.healthScore, IntelAssetGroup.healthScore, and
// backward-compat syncs to ClientProfile.healthScore (SEO vertical).

import { prisma } from "@/lib/prisma";

// ── Weight definitions (driven by vertical profiles in IE-03+) ───────────────
// For IE-02 we use a cross-vertical default that weights the sensors we have.

interface WeightEntry {
  key: string;
  weight: number;
  /** If true, lower value = better score */
  invertScale?: boolean;
  /** Min value used for normalization */
  scaleMin?: number;
  /** Max value used for normalization */
  scaleMax?: number;
}

const DEFAULT_WEIGHTS: WeightEntry[] = [
  // PageSpeed (0-100 scores already normalized)
  { key: "mobileScore", weight: 0.20, scaleMin: 0, scaleMax: 100 },
  { key: "desktopScore", weight: 0.15, scaleMin: 0, scaleMax: 100 },
  // Core Web Vitals (lower is better; normalize to 0-100)
  { key: "lcp", weight: 0.15, invertScale: true, scaleMin: 0, scaleMax: 6000 },
  { key: "cls", weight: 0.10, invertScale: true, scaleMin: 0, scaleMax: 0.5 },
  // Ahrefs authority signals
  { key: "domainRating", weight: 0.20, scaleMin: 0, scaleMax: 100 },
  { key: "referringDomains", weight: 0.10, scaleMin: 0, scaleMax: 1000 },
  { key: "estimatedTraffic", weight: 0.10, scaleMin: 0, scaleMax: 100000 },
];

// ── Score calculation ────────────────────────────────────────────────────────

function normalizeValue(
  value: number,
  entry: WeightEntry
): number {
  const min = entry.scaleMin ?? 0;
  const max = entry.scaleMax ?? 100;
  const clamped = Math.max(min, Math.min(max, value));
  const normalized = (clamped - min) / (max - min); // 0.0 – 1.0
  return entry.invertScale ? 1 - normalized : normalized;
}

export function computeHealthScore(
  metrics: Record<string, unknown>,
  weights: WeightEntry[] = DEFAULT_WEIGHTS
): number {
  let totalWeight = 0;
  let weightedSum = 0;

  for (const entry of weights) {
    const raw = metrics[entry.key];
    if (typeof raw !== "number" || isNaN(raw)) continue; // Skip missing metrics

    const normalized = normalizeValue(raw, entry);
    weightedSum += normalized * entry.weight;
    totalWeight += entry.weight;
  }

  if (totalWeight === 0) return 50; // Default when no metrics available

  // Re-scale to account for missing metrics (totalWeight may be < 1)
  const score = Math.round((weightedSum / totalWeight) * 100);
  return Math.max(0, Math.min(100, score));
}

// ── Competitor average ───────────────────────────────────────────────────────

export async function getCompetitorAvgScore(
  scanId: number,
  weights?: WeightEntry[]
): Promise<number | null> {
  const competitorSnapshots = await prisma.intelSnapshot.findMany({
    where: { scanId, entityType: "competitor" },
  });
  if (competitorSnapshots.length === 0) return null;

  const scores = competitorSnapshots.map((s) =>
    computeHealthScore(s.metrics as Record<string, unknown>, weights)
  );
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

// ── Persist health score to asset + backward-compat targets ─────────────────

export async function computeAndPersistHealthScore(
  assetId: number,
  scanId: number
): Promise<number> {
  // Get the latest snapshot for this asset in this scan
  const snapshot = await prisma.intelSnapshot.findFirst({
    where: { scanId, assetId },
    orderBy: { createdAt: "desc" },
  });

  if (!snapshot) return 50;

  const metrics = snapshot.metrics as Record<string, unknown>;
  const score = computeHealthScore(metrics);

  // 1. Update IntelAsset.healthScore
  await prisma.intelAsset.update({
    where: { id: assetId },
    data: { healthScore: score },
  });

  // 2. Propagate to IntelAssetGroup if applicable
  const asset = await prisma.intelAsset.findUnique({
    where: { id: assetId },
    include: {
      assetGroup: {
        include: { assets: { select: { healthScore: true } } },
      },
    },
  });

  if (asset?.assetGroup) {
    const scores = asset.assetGroup.assets.map((a) => a.healthScore);
    const groupScore = Math.round(
      scores.reduce((a, b) => a + b, 0) / scores.length
    );
    await prisma.intelAssetGroup.update({
      where: { id: asset.assetGroup.id },
      data: { healthScore: groupScore },
    });

    // 3. Backward-compat: sync to ClientProfile (SEO vertical)
    if (asset.assetGroup.clientProfileId) {
      await prisma.clientProfile
        .update({
          where: { id: asset.assetGroup.clientProfileId },
          data: { healthScore: groupScore },
        })
        .catch(() => {
          // ClientProfile may not have healthScore in older schema versions — non-fatal
        });
    }
  }

  // 4. Backward-compat: sync domainRating to Site (affiliate vertical)
  if (asset?.siteId) {
    const dr = metrics["domainRating"];
    if (typeof dr === "number") {
      await prisma.site
        .update({
          where: { id: asset.siteId },
          data: { domainRating: Math.round(dr) },
        })
        .catch(() => {
          // Non-fatal
        });
    }
  }

  return score;
}
