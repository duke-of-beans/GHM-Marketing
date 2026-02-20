/**
 * GET /api/oauth/google-ads/callback
 * Handles Google Ads OAuth redirect, stores encrypted tokens.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { exchangeCode, discoverCustomer } from '@/lib/oauth/google-ads'
import { encrypt } from '@/lib/oauth/encrypt'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code     = searchParams.get('code')
  const state    = searchParams.get('state')
  const errorMsg = searchParams.get('error')

  if (errorMsg) {
    return NextResponse.redirect(
      new URL(`/clients?ads_error=${encodeURIComponent(errorMsg)}`, req.url)
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL('/clients?ads_error=missing_params', req.url))
  }

  const clientId = parseInt(state, 10)
  if (isNaN(clientId)) {
    return NextResponse.redirect(new URL('/clients?ads_error=invalid_state', req.url))
  }

  try {
    const { accessToken, refreshToken, expiresAt, email } = await exchangeCode(code)
    const { customerId, accountName } = await discoverCustomer(accessToken)

    await prisma.googleAdsConnection.upsert({
      where:  { clientId },
      create: {
        clientId,
        accessTokenEnc:  encrypt(accessToken),
        refreshTokenEnc: encrypt(refreshToken),
        expiresAt,
        customerId,
        accountName,
        googleEmail: email,
      },
      update: {
        accessTokenEnc:  encrypt(accessToken),
        refreshTokenEnc: encrypt(refreshToken),
        expiresAt,
        customerId,
        accountName,
        googleEmail: email,
        isActive:    true,
        lastSyncAt:  null,
      },
    })

    return NextResponse.redirect(
      new URL(`/clients/${clientId}?tab=integrations&ads_connected=1`, req.url)
    )
  } catch (err) {
    console.error('[google-ads oauth]', err)
    const msg = err instanceof Error ? err.message : 'unknown_error'
    return NextResponse.redirect(
      new URL(`/clients/${clientId}?ads_error=${encodeURIComponent(msg)}`, req.url)
    )
  }
}
