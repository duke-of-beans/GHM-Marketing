import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getGBPClient } from '@/lib/enrichment/providers/google-business/client'
import { listReviews } from '@/lib/enrichment/providers/google-business/reviews'
import { fetchInsights } from '@/lib/enrichment/providers/google-business/insights'
import { listPosts } from '@/lib/enrichment/providers/google-business/posts'
import { withPermission } from "@/lib/auth/api-permissions"

// GET /api/clients/[id]/gbp
// Returns connection status + reviews + insights + posts
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const permissionError = await withPermission(request, "manage_clients");
  if (permissionError) return permissionError;

  const clientId = parseInt(params.id)
  if (isNaN(clientId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const conn = await prisma.gBPConnection.findUnique({ where: { clientId } })
  if (!conn || !conn.isActive) {
    return NextResponse.json({ connected: false })
  }

  try {
    const gbp = await getGBPClient(clientId)
    if (!gbp) return NextResponse.json({ connected: false })

    const [reviews, insights, posts] = await Promise.all([
      listReviews(gbp, 50),
      fetchInsights(gbp, 90),
      listPosts(gbp),
    ])

    await prisma.gBPConnection.update({
      where: { clientId },
      data:  { lastSyncAt: new Date() },
    })

    return NextResponse.json({
      connected:    true,
      locationName: conn.locationName,
      googleEmail:  conn.googleEmail,
      lastSyncAt:   conn.lastSyncAt,
      reviews,
      insights,
      posts,
    })
  } catch (err: unknown) {
    console.error('[GBP GET]', err)
    return NextResponse.json({ error: 'Fetch failed' }, { status: 500 })
  }
}

// DELETE /api/clients/[id]/gbp — disconnect
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const permissionError = await withPermission(request, "manage_clients");
  if (permissionError) return permissionError;

  const clientId = parseInt(params.id)
  await prisma.gBPConnection.updateMany({
    where: { clientId },
    data:  { isActive: false },
  })
  return NextResponse.json({ ok: true })
}
