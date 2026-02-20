// GET /api/wave/settings/status
// Returns current Wave integration health — connection, product config, webhook status

import { NextRequest, NextResponse } from 'next/server'
import { withPermission } from '@/lib/auth/api-permissions'
import { waveQuery } from '@/lib/wave/client'
import { WAVE_BUSINESS_ID, WAVE_WEBHOOK_SECRET } from '@/lib/wave/constants'

const BUSINESS_QUERY = `
  query GetBusiness($businessId: ID!) {
    business(id: $businessId) {
      id
      name
    }
  }
`

export async function GET(req: NextRequest) {
  const permissionError = await withPermission(req, 'manage_settings')
  if (permissionError) return permissionError

  const productId = process.env.WAVE_SEO_PRODUCT_ID ?? null
  const webhookConfigured = !!WAVE_WEBHOOK_SECRET

  if (!WAVE_BUSINESS_ID) {
    return NextResponse.json({
      connected: false,
      businessName: null,
      businessId: null,
      currentProductId: productId,
      webhookConfigured,
      error: 'WAVE_BUSINESS_ID not configured',
    })
  }

  try {
    const data = await waveQuery<{ business: { id: string; name: string } | null }>(
      BUSINESS_QUERY,
      { businessId: WAVE_BUSINESS_ID }
    )

    return NextResponse.json({
      connected: !!data.business,
      businessName: data.business?.name ?? null,
      businessId: data.business?.id ?? null,
      currentProductId: productId,
      webhookConfigured,
    })
  } catch (err) {
    return NextResponse.json({
      connected: false,
      businessName: null,
      businessId: WAVE_BUSINESS_ID,
      currentProductId: productId,
      webhookConfigured,
      error: err instanceof Error ? err.message : 'Wave API error',
    })
  }
}
