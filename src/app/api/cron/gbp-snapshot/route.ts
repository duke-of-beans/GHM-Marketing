import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getGBPClient } from '@/lib/enrichment/providers/google-business/client'
import { fetchInsights } from '@/lib/enrichment/providers/google-business/insights'
import { listReviews } from '@/lib/enrichment/providers/google-business/reviews'
import { listPosts } from '@/lib/enrichment/providers/google-business/posts'
import { evaluateAlertRules } from '@/lib/ops/alert-engine'
import { recordProviderSuccess, recordProviderFailure } from '@/lib/ops/data-source-monitor'

const PROVIDER = 'google_business' as const

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// POST /api/cron/gbp-snapshot
// Weekly — creates GbpSnapshot for all clients with active GBPConnection
export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const start = Date.now()
  let processed = 0
  let skipped = 0
  const errors: { clientId: number; error: string }[] = []

  const connections = await prisma.gBPConnection.findMany({
    where: { isActive: true },
    include: { client: { select: { id: true, businessName: true } } },
  })

  for (const conn of connections) {
    const clientId = conn.clientId
    const callStart = Date.now()

    try {
      const gbp = await getGBPClient(clientId)
      if (!gbp) { skipped++; continue }

      const [insights, reviews, posts] = await Promise.all([
        fetchInsights(gbp, 30),
        listReviews(gbp, 200),
        listPosts(gbp),
      ])

      // Aggregate 30-day totals
      const daily           = insights.daily
      const searchViews     = daily.reduce((s, d) => s + d.impressionsDesktop + d.impressionsMobile, 0)
      const websiteClicks   = daily.reduce((s, d) => s + d.websiteClicks, 0)
      const phoneClicks     = daily.reduce((s, d) => s + d.callClicks, 0)
      const directionClicks = daily.reduce((s, d) => s + d.directionRequests, 0)

      const reviewCount = reviews.length
      const reviewAvg   = reviewCount > 0
        ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviewCount) * 10) / 10
        : null

      // Previous snapshot for deltas
      const prev = await prisma.gbpSnapshot.findFirst({
        where:   { clientId },
        orderBy: { scanDate: 'desc' },
      })

      const newReviews = prev?.reviewCount != null
        ? Math.max(0, reviewCount - prev.reviewCount)
        : null

      const snapshot = await prisma.gbpSnapshot.create({
        data: {
          clientId,
          searchViews,
          mapViews:            null,   // GBP API doesn't break out map vs search at aggregation level
          websiteClicks,
          phoneClicks,
          directionClicks,
          reviewCount,
          reviewAvg,
          newReviews,
          photosCount:         null,   // not available via current API methods
          postsCount:          posts.length,
          previousSearchViews: prev?.searchViews ?? null,
          previousMapViews:    prev?.mapViews ?? null,
          periodStart:         new Date(Date.now() - 30 * 86400 * 1000),
          periodEnd:           new Date(),
        },
      })

      // Compute deltas for alert engine
      const reviewAvgDelta = prev?.reviewAvg != null && reviewAvg != null
        ? Math.round((reviewAvg - Number(prev.reviewAvg)) * 10) / 10
        : null

      const searchViewsDelta = prev?.searchViews != null
        ? Math.round(((searchViews - prev.searchViews) / Math.max(prev.searchViews, 1)) * 100)
        : null

      await evaluateAlertRules({
        clientId,
        sourceType: 'gbp',
        sourceId:   snapshot.id,   // number, not string
        data: {
          reviewAvg:         reviewAvg        ?? undefined,
          reviewAvgDelta:    reviewAvgDelta   ?? undefined,
          newReviews:        newReviews       ?? undefined,
          searchViewsDelta:  searchViewsDelta ?? undefined,
        },
      })

      await recordProviderSuccess(PROVIDER, Date.now() - callStart, { clientId })

      processed++
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push({ clientId, error: msg })
      await recordProviderFailure(PROVIDER, err, { clientId })
    }

    await sleep(1000)
  }

  return NextResponse.json({
    processed,
    skipped,
    errors,
    durationMs: Date.now() - start,
  })
}
