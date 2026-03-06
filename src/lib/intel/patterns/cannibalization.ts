// src/lib/intel/patterns/cannibalization.ts
// Intelligence Engine — Sprint IE-06
// Keyword Cannibalization Detection.
//
// For asset groups with 2+ assets (satellite clusters, SEO portfolios),
// compares keyword ranking data across assets in the same group.
// Flags when 2+ assets rank for the same keyword and generates a
// "Resolve Cannibalization" task with a recommended resolution action.
//
// Resolution actions:
//   "consolidate"   — merge the two pages into a single stronger page
//   "differentiate" — adjust keyword targeting so pages don't overlap
//   "deindex"       — noindex the weaker-ranking page

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface CannibalizationPair {
  keyword: string;
  assetA: { id: number; domain: string; name: string; position: number };
  assetB: { id: number; domain: string; name: string; position: number };
  /** Stronger of the two: lower position = higher ranking */
  strongerAssetId: number;
  weakerAssetId: number;
  recommendedAction: "consolidate" | "differentiate" | "deindex";
  rationale: string;
}

export interface CannibalizationResult {
  assetGroupId: number;
  pairs: CannibalizationPair[];
  tasksCreated: number;
  skipped: number;
  errors: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Extract ranked keywords from a snapshot's metrics.
 * The sensor stores keywords as an array of { keyword, position } objects
 * under the metric key "rankedKeywords".
 */
function extractRankedKeywords(
  metrics: Record<string, unknown>
): Map<string, number> {
  const result = new Map<string, number>();

  // SerpAPI / Ahrefs sensors store ranked keywords in this shape:
  // rankedKeywords: [{ keyword: "...", position: 3 }, ...]
  const raw = metrics["rankedKeywords"];
  if (!Array.isArray(raw)) return result;

  for (const entry of raw) {
    if (
      typeof entry === "object" &&
      entry !== null &&
      typeof (entry as Record<string, unknown>)["keyword"] === "string" &&
      typeof (entry as Record<string, unknown>)["position"] === "number"
    ) {
      const kw = (entry as { keyword: string; position: number }).keyword
        .toLowerCase()
        .trim();
      const pos = (entry as { keyword: string; position: number }).position;
      // Keep the best (lowest) position if keyword appears multiple times
      if (!result.has(kw) || pos < result.get(kw)!) {
        result.set(kw, pos);
      }
    }
  }

  return result;
}

/**
 * Choose the recommended resolution action based on the position gap.
 *
 * Rules:
 * - Both rank in top 10 → differentiate (both worth preserving)
 * - Positions far apart (gap > 15) → deindex the weaker one
 * - Otherwise → consolidate (merge for compound authority)
 */
function recommendAction(
  positionA: number,
  positionB: number
): { action: "consolidate" | "differentiate" | "deindex"; rationale: string } {
  const better = Math.min(positionA, positionB);
  const worse = Math.max(positionA, positionB);
  const gap = worse - better;

  if (better <= 10 && worse <= 10) {
    return {
      action: "differentiate",
      rationale:
        "Both pages rank in the top 10. Rather than consolidating, refine their " +
        "keyword targeting so each page owns distinct search intent variants.",
    };
  }

  if (gap > 15) {
    return {
      action: "deindex",
      rationale:
        `The weaker page ranks ${worse} vs the stronger page at ${better}. ` +
        "Noindex the weaker page so Google concentrates ranking signals on the " +
        "stronger URL.",
    };
  }

  return {
    action: "consolidate",
    rationale:
      `Both pages rank for the same keyword (positions ${better} and ${worse}). ` +
      "Consolidating them into one authoritative page would compound their combined " +
      "link equity and content signals.",
  };
}

async function hasPendingCannibalizationTask(
  clientId: number,
  keyword: string
): Promise<boolean> {
  const existing = await prisma.clientTask.findFirst({
    where: {
      clientId,
      source: "intelligence_engine",
      status: { in: ["queued", "in_progress"] },
      title: { contains: keyword, mode: "insensitive" },
    },
    select: { id: true },
  });
  return existing !== null;
}

// ── Main entry point ───────────────────────────────────────────────────────────

/**
 * Detect keyword cannibalization across assets in the same group.
 *
 * Fetches the most recent snapshot for each asset in the group,
 * extracts ranked keyword data, finds overlapping keywords across 2+ assets,
 * and generates "Resolve Cannibalization" tasks.
 */
export async function detectCannibalization(
  tenantId: number,
  assetGroupId: number,
  scanId: number
): Promise<CannibalizationResult> {
  const result: CannibalizationResult = {
    assetGroupId,
    pairs: [],
    tasksCreated: 0,
    skipped: 0,
    errors: [],
  };

  // ── Require 2+ assets ──────────────────────────────────────────────────────
  const assets = await prisma.intelAsset.findMany({
    where: { tenantId, assetGroupId, status: "active" },
    select: { id: true, domain: true, name: true },
  });

  if (assets.length < 2) {
    result.skipped = 1;
    return result;
  }

  // ── Resolve client (tasks only for SEO agency groups) ──────────────────────
  const group = await prisma.intelAssetGroup.findUnique({
    where: { id: assetGroupId },
    select: { clientProfileId: true },
  });
  const clientId = group?.clientProfileId ?? null;

  // ── Fetch latest asset snapshots ──────────────────────────────────────────
  const assetKeywords = new Map<
    number,
    { asset: (typeof assets)[0]; keywords: Map<string, number> }
  >();

  for (const asset of assets) {
    const snap = await prisma.intelSnapshot.findFirst({
      where: {
        assetId: asset.id,
        entityType: "asset",
      },
      orderBy: { createdAt: "desc" },
      select: { metrics: true },
    });

    if (!snap) continue;

    const keywords = extractRankedKeywords(snap.metrics as Record<string, unknown>);
    if (keywords.size === 0) continue;

    assetKeywords.set(asset.id, { asset, keywords });
  }

  if (assetKeywords.size < 2) {
    result.skipped = 1;
    return result;
  }

  // ── Find overlapping keywords ──────────────────────────────────────────────
  const assetEntries = Array.from(assetKeywords.entries());

  for (let i = 0; i < assetEntries.length; i++) {
    for (let j = i + 1; j < assetEntries.length; j++) {
      const [idA, dataA] = assetEntries[i];
      const [idB, dataB] = assetEntries[j];

      for (const [keyword, posA] of dataA.keywords) {
        const posB = dataB.keywords.get(keyword);
        if (posB === undefined) continue;

        // Only flag when both are in top 50 (beyond that, too noisy)
        if (posA > 50 || posB > 50) continue;

        const strongerAssetId = posA <= posB ? idA : idB;
        const weakerAssetId = posA <= posB ? idB : idA;
        const strongerPos = posA <= posB ? posA : posB;
        const weakerPos = posA <= posB ? posB : posA;

        const { action, rationale } = recommendAction(posA, posB);

        result.pairs.push({
          keyword,
          assetA: { id: idA, domain: dataA.asset.domain, name: dataA.asset.name, position: posA },
          assetB: { id: idB, domain: dataB.asset.domain, name: dataB.asset.name, position: posB },
          strongerAssetId,
          weakerAssetId,
          recommendedAction: action,
          rationale,
        });

        // ── Generate task (SEO agency only) ───────────────────────────────────
        if (!clientId) continue;

        try {
          if (await hasPendingCannibalizationTask(clientId, keyword)) {
            result.skipped++;
            continue;
          }

          const strongerDomain =
            posA <= posB ? dataA.asset.domain : dataB.asset.domain;
          const weakerDomain =
            posA <= posB ? dataB.asset.domain : dataA.asset.domain;

          const title = `Resolve keyword cannibalization: "${keyword}"`;
          const description =
            `Two assets are competing for the same keyword "${keyword}": ` +
            `${strongerDomain} (position ${strongerPos}) and ${weakerDomain} (position ${weakerPos}). ` +
            `Recommended action: ${action.toUpperCase()}. ${rationale}`;

          await prisma.clientTask.create({
            data: {
              clientId,
              title,
              description,
              category: "technical_seo",
              priority: strongerPos <= 10 ? "P2" : "P3",
              status: "queued",
              source: "intelligence_engine",
              intelScanId: scanId,
              contentBrief: {
                type: "keyword_cannibalization",
                keyword,
                assetA: { id: idA, domain: dataA.asset.domain, position: posA },
                assetB: { id: idB, domain: dataB.asset.domain, position: posB },
                strongerAssetId,
                weakerAssetId,
                recommendedAction: action,
                rationale,
              } as Prisma.InputJsonValue,
            },
          });
          result.tasksCreated++;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          result.errors.push(`cannibalization "${keyword}": ${msg}`);
        }
      }
    }
  }

  return result;
}
