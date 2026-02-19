/**
 * Cost Tracker — GHM Dashboard
 *
 * Reshaped from GREGORE orchestration/metabolism/metabolism-engine.ts + cost-tracker.ts
 *
 * What changed:
 * - "Cognitive tokens" abstraction removed — we track real USD costs
 * - Stateless design: no in-memory budget manager (Next.js routes are stateless)
 * - Costs stored in DB via PrismaClient (append-only log)
 * - Per-client and per-feature breakdowns for billing/analytics
 *
 * What GREGORE logic was kept:
 * - Cost estimation math (estimateQueryCost from benchmarks)
 * - Prediction accuracy calculation
 * - Trend analysis structure
 */

import { prisma } from "@/lib/prisma";
import type { CostRecord, AIFeature } from "./router/types";
import { getModel } from "./router/model-benchmarks";

// ── Record a completed AI call ────────────────────────────────────────────────

export async function recordAICost(record: Omit<CostRecord, "id">): Promise<void> {
  try {
    await prisma.aICostLog.create({
      data: {
        timestamp: record.timestamp,
        feature: record.feature,
        clientId: record.clientId,
        modelId: record.modelId,
        inputTokens: record.inputTokens,
        outputTokens: record.outputTokens,
        costUSD: record.costUSD,
        latencyMs: record.latencyMs,
        qualityScore: record.qualityScore ?? null,
      },
    });
  } catch {
    // Non-fatal: cost tracking failure should never block the AI call response
    console.error("[CostTracker] Failed to record AI cost:", record);
  }
}

// ── Query cost analytics ──────────────────────────────────────────────────────

export async function getCostByClient(
  clientId: number,
  daysBack = 30
): Promise<{ totalUSD: number; callCount: number; byFeature: Record<AIFeature, number> }> {
  const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

  const records = await prisma.aICostLog.findMany({
    where: { clientId, timestamp: { gte: since } },
  });

  const totalUSD = records.reduce((s, r) => s + r.costUSD, 0);
  const byFeature = records.reduce((acc, r) => {
    const f = r.feature as AIFeature;
    acc[f] = (acc[f] ?? 0) + r.costUSD;
    return acc;
  }, {} as Record<AIFeature, number>);

  return { totalUSD, callCount: records.length, byFeature };
}

export async function getCostByFeature(
  feature: AIFeature,
  daysBack = 30
): Promise<{ totalUSD: number; callCount: number; avgCostPerCall: number }> {
  const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

  const records = await prisma.aICostLog.findMany({
    where: { feature, timestamp: { gte: since } },
  });

  const totalUSD = records.reduce((s, r) => s + r.costUSD, 0);
  const callCount = records.length;

  return {
    totalUSD,
    callCount,
    avgCostPerCall: callCount > 0 ? totalUSD / callCount : 0,
  };
}

/**
 * Prediction accuracy: how close were our cost estimates to actuals?
 * Kept from GREGORE metabolism engine — useful for tuning benchmarks.
 */
export async function getCostAccuracy(daysBack = 30): Promise<number> {
  const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

  const records = await prisma.aICostLog.findMany({
    where: { timestamp: { gte: since }, estimatedCostUSD: { not: null } },
  });

  if (records.length === 0) return 0;

  const accuracies = records.map((r) => {
    if (!r.estimatedCostUSD || r.estimatedCostUSD === 0) return 0;
    return Math.max(0, 1 - Math.abs(r.costUSD - r.estimatedCostUSD) / r.estimatedCostUSD);
  });

  return accuracies.reduce((s, a) => s + a, 0) / accuracies.length;
}
