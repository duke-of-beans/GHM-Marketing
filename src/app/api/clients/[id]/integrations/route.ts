/**
 * GET  /api/clients/[id]/integrations  — fetch connection status
 * DELETE /api/clients/[id]/integrations?type=google_ads|gbp — disconnect
 */

import { NextRequest, NextResponse } from 'next/server'
import { withPermission } from '@/lib/auth/api-permissions'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permErr = await withPermission(req, 'manage_clients')
  if (permErr) return permErr

  const { id } = await params
  const clientId = parseInt(id)
  if (isNaN(clientId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const [gbp, ads] = await Promise.all([
    prisma.gBPConnection.findUnique({ where: { clientId } }),
    prisma.googleAdsConnection.findUnique({ where: { clientId } }),
  ])

  return NextResponse.json({
    success: true,
    data: {
      gbp: gbp ? {
        connected:    true,
        googleEmail:  gbp.googleEmail,
        locationName: gbp.locationName,
        connectedAt:  gbp.connectedAt,
        lastSyncAt:   gbp.lastSyncAt,
        isActive:     gbp.isActive,
      } : { connected: false },
      googleAds: ads ? {
        connected:   true,
        googleEmail: ads.googleEmail,
        accountName: ads.accountName,
        customerId:  ads.customerId,
        connectedAt: ads.connectedAt,
        lastSyncAt:  ads.lastSyncAt,
        isActive:    ads.isActive,
      } : { connected: false },
    },
  })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permErr = await withPermission(req, 'manage_clients')
  if (permErr) return permErr

  const { id } = await params
  const clientId = parseInt(id)
  if (isNaN(clientId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const type = req.nextUrl.searchParams.get('type')

  if (type === 'google_ads') {
    await prisma.googleAdsConnection.deleteMany({ where: { clientId } })
    return NextResponse.json({ success: true })
  }

  if (type === 'gbp') {
    await prisma.gBPConnection.deleteMany({ where: { clientId } })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'type must be google_ads or gbp' }, { status: 400 })
}
