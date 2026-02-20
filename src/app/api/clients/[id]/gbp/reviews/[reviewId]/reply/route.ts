import { NextRequest, NextResponse } from 'next/server'
import { getGBPClient } from '@/lib/enrichment/providers/google-business/client'
import { replyToReview } from '@/lib/enrichment/providers/google-business/reviews'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; reviewId: string } }
) {
  const clientId = parseInt(params.id)
  const { replyText } = await req.json()
  if (!replyText?.trim()) return NextResponse.json({ error: 'replyText required' }, { status: 400 })

  const gbp = await getGBPClient(clientId)
  if (!gbp) return NextResponse.json({ error: 'GBP not connected' }, { status: 404 })

  const ok = await replyToReview(gbp, params.reviewId, replyText)
  return NextResponse.json({ ok })
}
