/**
 * GET /api/settings/costs
 * Returns AI + enrichment cost summaries and cache stats for admin dashboard.
 * Admin only.
 */

import { NextRequest, NextResponse } from 'next/server'
import { withPermission } from '@/lib/auth/api-permissions'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const permissionError = await withPermission(req, 'manage_settings')
  if (permissionError) return permissionError

  const now    = new Date()
  const day30  = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const day7   = new Date(now.getTime() -  7 * 24 * 60 * 60 * 1000)
  const month1 = new Date(now.getFullYear(), now.getMonth(), 1)

  // ── AI costs ─────────────────────────────────────────────────────────────
  const [aiLast30, aiThisMonth, aiByFeature] = await Promise.all([
    prisma.aICostLog.aggregate({
      where: { timestamp: { gte: day30 } },
      _sum:  { costUSD: true },
      _count: true,
    }),
    prisma.aICostLog.aggregate({
      where: { timestamp: { gte: month1 } },
      _sum:  { costUSD: true },
    }),
    prisma.aICostLog.groupBy({
      by: ['feature'],
      where: { timestamp: { gte: day30 } },
      _sum: { costUSD: true },
      _count: true,
      orderBy: { _sum: { costUSD: 'desc' } },
    }),
  ])

  // ── Enrichment costs ──────────────────────────────────────────────────────
  const [enrichLast30, enrichByProvider] = await Promise.all([
    prisma.enrichmentCostLog.aggregate({
      where: { createdAt: { gte: day30 } },
      _sum:  { costUsd: true },
      _count: true,
    }),
    prisma.enrichmentCostLog.groupBy({
      by: ['provider'],
      where: { createdAt: { gte: day30 } },
      _sum: { costUsd: true },
      _count: true,
      orderBy: { _sum: { costUsd: 'desc' } },
    }),
  ])

  // ── Cache stats ───────────────────────────────────────────────────────────
  const [cacheTotal, cacheByProvider, cacheExpired] = await Promise.all([
    prisma.enrichmentCache.count(),
    prisma.enrichmentCache.groupBy({
      by: ['provider'],
      _count: true,
    }),
    prisma.enrichmentCache.count({ where: { expiresAt: { lt: now } } }),
  ])

  // ── 7-day AI cost trend ───────────────────────────────────────────────────
  // Group by day (raw query for date truncation)
  const trend7 = await prisma.$queryRaw<{ day: string; total: number }[]>`
    SELECT
      to_char(timestamp AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day,
      SUM(cost_usd)::float AS total
    FROM ai_cost_logs
    WHERE timestamp >= ${day7}
    GROUP BY 1
    ORDER BY 1 ASC
  `

  return NextResponse.json({
    success: true,
    data: {
      ai: {
        last30Days: {
          totalUSD:   Number(aiLast30._sum.costUSD ?? 0).toFixed(4),
          callCount:  aiLast30._count,
        },
        thisMonth: {
          totalUSD: Number(aiThisMonth._sum.costUSD ?? 0).toFixed(4),
        },
        byFeature: aiByFeature.map((r) => ({
          feature:   r.feature,
          totalUSD:  Number(r._sum.costUSD ?? 0).toFixed(4),
          callCount: r._count,
        })),
        trend7: trend7.map((r) => ({
          day:   r.day,
          total: Number(r.total).toFixed(4),
        })),
      },
      enrichment: {
        last30Days: {
          totalUSD:   Number(enrichLast30._sum.costUsd ?? 0).toFixed(4),
          callCount:  enrichLast30._count,
        },
        byProvider: enrichByProvider.map((r) => ({
          provider:  r.provider,
          totalUSD:  Number(r._sum.costUsd ?? 0).toFixed(4),
          callCount: r._count,
        })),
      },
      cache: {
        totalEntries: cacheTotal,
        expiredEntries: cacheExpired,
        validEntries:   cacheTotal - cacheExpired,
        byProvider: cacheByProvider.map((r) => ({
          provider: r.provider,
          count:    r._count,
        })),
      },
    },
  })
}

// DELETE /api/settings/costs/cache  — flush expired cache entries
export async function DELETE(req: NextRequest) {
  const permissionError = await withPermission(req, 'manage_settings')
  if (permissionError) return permissionError

  const { count } = await prisma.enrichmentCache.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  })

  return NextResponse.json({ success: true, data: { deleted: count } })
}
