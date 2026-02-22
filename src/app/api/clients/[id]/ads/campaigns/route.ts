/**
 * GET /api/clients/[id]/ads/campaigns
 *
 * Returns live Google Ads campaign + keyword performance for a client.
 * Requires the client to have an active GoogleAdsConnection.
 *
 * Query params:
 *   startDate  YYYY-MM-DD  (default: first of current month)
 *   endDate    YYYY-MM-DD  (default: today)
 */

import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/auth/permissions'
import { getCampaignPerformance } from '@/lib/enrichment/providers/google-ads/campaigns'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission('manage_clients')

    const { id } = await params
    const clientId = parseInt(id)
    if (isNaN(clientId)) {
      return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 })
    }

    const { searchParams } = new URL(req.url)

    // Default to current calendar month
    const now = new Date()
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .slice(0, 10)
    const defaultEnd = now.toISOString().slice(0, 10)

    const startDate = searchParams.get('startDate') ?? defaultStart
    const endDate   = searchParams.get('endDate')   ?? defaultEnd

    const data = await getCampaignPerformance(clientId, { startDate, endDate })

    if (!data) {
      // No connection or connection inactive — not an error, just no data
      return NextResponse.json({ connected: false, data: null })
    }

    return NextResponse.json({ connected: true, data })
  } catch (err) {
    console.error('[ads/campaigns] error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
