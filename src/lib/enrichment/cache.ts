/**
 * Enrichment Cache
 * TTL-based shared cache using the enrichment_cache DB table.
 * Prevents redundant API calls across clients sharing competitors.
 *
 * TTL conventions (days):
 *   ahrefs domain:    14
 *   ahrefs keywords:  14
 *   outscraper:       14
 *   pagespeed:        14
 *   dataforseo:       14
 *   nap:              90
 *   gbp:               7
 */

import { prisma } from "@/lib/db";

export async function getCached<T>(
  provider: string,
  key: string
): Promise<T | null> {
  try {
    const entry = await prisma.enrichmentCache.findUnique({
      where: { provider_cacheKey: { provider, cacheKey: key } },
    });

    if (!entry) return null;
    if (entry.expiresAt < new Date()) {
      // Expired — delete lazily and return null
      await prisma.enrichmentCache.delete({
        where: { provider_cacheKey: { provider, cacheKey: key } },
      }).catch(() => {}); // best-effort
      return null;
    }

    return entry.data as T;
  } catch {
    return null; // Cache failure is never fatal
  }
}

export async function setCache(
  provider: string,
  key: string,
  data: unknown,
  ttlDays: number,
  costUsd?: number
): Promise<void> {
  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + ttlDays);

    await prisma.enrichmentCache.upsert({
      where: { provider_cacheKey: { provider, cacheKey: key } },
      create: {
        provider,
        cacheKey: key,
        data: data as never,
        costUsd: costUsd ?? null,
        expiresAt,
      },
      update: {
        data: data as never,
        costUsd: costUsd ?? null,
        fetchedAt: new Date(),
        expiresAt,
      },
    });
  } catch (err) {
    console.error("[cache] setCache failed:", err); // Non-fatal
  }
}

export async function invalidateCache(
  provider: string,
  keyPattern?: string
): Promise<number> {
  try {
    if (keyPattern) {
      const result = await prisma.enrichmentCache.deleteMany({
        where: { provider, cacheKey: { contains: keyPattern } },
      });
      return result.count;
    } else {
      const result = await prisma.enrichmentCache.deleteMany({ where: { provider } });
      return result.count;
    }
  } catch {
    return 0;
  }
}

export async function getCacheStats(): Promise<{
  totalEntries: number;
  byProvider: Record<string, { entries: number; costUsd: number }>;
}> {
  try {
    const rows = await prisma.enrichmentCache.groupBy({
      by: ["provider"],
      _count: { id: true },
      _sum: { costUsd: true },
    });

    const byProvider: Record<string, { entries: number; costUsd: number }> = {};
    let totalEntries = 0;

    for (const row of rows) {
      byProvider[row.provider] = {
        entries: row._count.id,
        costUsd: Number(row._sum.costUsd ?? 0),
      };
      totalEntries += row._count.id;
    }

    return { totalEntries, byProvider };
  } catch {
    return { totalEntries: 0, byProvider: {} };
  }
}
