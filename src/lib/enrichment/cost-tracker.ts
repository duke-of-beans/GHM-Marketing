/**
 * Enrichment Cost Tracker
 * Logs every provider API call (hit or miss, cached or live) to enrichment_cost_logs.
 * Feeds the profitability dashboard with real per-client API costs.
 */

import { prisma } from "@/lib/db";

export type Provider = "ahrefs" | "outscraper" | "pagespeed" | "dataforseo" | "nap" | "gbp" | "google_ads" | "godaddy";

export interface LogCallParams {
  provider: Provider;
  operation: string;
  clientId?: number;
  cacheHit: boolean;
  costUsd: number;
  latencyMs?: number;
  success: boolean;
  errorMsg?: string;
}

/**
 * Log a single provider API call.
 * Non-blocking — failures are silently swallowed so they never affect scan results.
 */
export async function logProviderCall(params: LogCallParams): Promise<void> {
  try {
    await prisma.enrichmentCostLog.create({
      data: {
        provider: params.provider,
        operation: params.operation,
        clientId: params.clientId ?? null,
        cacheHit: params.cacheHit,
        costUsd: params.costUsd,
        latencyMs: params.latencyMs ?? null,
        success: params.success,
        errorMsg: params.errorMsg ?? null,
      },
    });
  } catch {
    // Non-fatal: cost logging never breaks scan execution
  }
}

/**
 * Get cost summary for a client over a date range.
 */
export async function getClientCostSummary(
  clientId: number,
  since?: Date
): Promise<{ totalUsd: number; byProvider: Record<string, number>; cacheHitRate: number }> {
  try {
    const rows = await prisma.enrichmentCostLog.findMany({
      where: {
        clientId,
        ...(since ? { createdAt: { gte: since } } : {}),
      },
      select: { provider: true, costUsd: true, cacheHit: true },
    });

    const byProvider: Record<string, number> = {};
    let totalUsd = 0;
    let hits = 0;

    for (const row of rows) {
      const cost = Number(row.costUsd);
      byProvider[row.provider] = (byProvider[row.provider] ?? 0) + cost;
      totalUsd += cost;
      if (row.cacheHit) hits++;
    }

    return {
      totalUsd,
      byProvider,
      cacheHitRate: rows.length > 0 ? hits / rows.length : 0,
    };
  } catch {
    return { totalUsd: 0, byProvider: {}, cacheHitRate: 0 };
  }
}

/**
 * Get global cost stats for the admin integration health dashboard.
 */
export async function getGlobalCostStats(since?: Date): Promise<{
  totalUsd: number;
  byProvider: Record<string, { costUsd: number; calls: number; cacheHits: number }>;
}> {
  try {
    const rows = await prisma.enrichmentCostLog.groupBy({
      by: ["provider"],
      where: since ? { createdAt: { gte: since } } : {},
      _sum: { costUsd: true },
      _count: { id: true },
    });

    // Get cache hits separately
    const hitRows = await prisma.enrichmentCostLog.groupBy({
      by: ["provider"],
      where: {
        cacheHit: true,
        ...(since ? { createdAt: { gte: since } } : {}),
      },
      _count: { id: true },
    });

    const hitMap = Object.fromEntries(hitRows.map((r) => [r.provider, r._count.id]));
    const byProvider: Record<string, { costUsd: number; calls: number; cacheHits: number }> = {};
    let totalUsd = 0;

    for (const row of rows) {
      const cost = Number(row._sum.costUsd ?? 0);
      byProvider[row.provider] = {
        costUsd: cost,
        calls: row._count.id,
        cacheHits: hitMap[row.provider] ?? 0,
      };
      totalUsd += cost;
    }

    return { totalUsd, byProvider };
  } catch {
    return { totalUsd: 0, byProvider: {} };
  }
}
