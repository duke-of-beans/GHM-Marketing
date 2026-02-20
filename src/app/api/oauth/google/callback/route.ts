import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { exchangeCode, discoverAccountAndLocation } from '@/lib/oauth/google'
import { encrypt } from '@/lib/oauth/encrypt'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code     = searchParams.get('code')
  const stateRaw = searchParams.get('state')   // clientId
  const error    = searchParams.get('error')

  const dashboardBase = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  if (error || !code || !stateRaw) {
    return NextResponse.redirect(
      `${dashboardBase}/clients?gbp_error=${error || 'missing_code'}`
    )
  }

  const clientId = parseInt(stateRaw)
  if (isNaN(clientId)) {
    return NextResponse.redirect(`${dashboardBase}/clients?gbp_error=invalid_state`)
  }

  try {
    // 1. Exchange code for tokens + email
    const { accessToken, refreshToken, expiresAt, email } = await exchangeCode(code)

    // 2. Discover the GBP account + location for this client
    const { accountId, locationId, locationName } =
      await discoverAccountAndLocation(accessToken)

    // 3. Upsert connection record (one per client)
    await prisma.gBPConnection.upsert({
      where:  { clientId },
      create: {
        clientId,
        accessTokenEnc:  encrypt(accessToken),
        refreshTokenEnc: encrypt(refreshToken),
        expiresAt,
        accountId,
        locationId,
        locationName,
        googleEmail: email,
      },
      update: {
        accessTokenEnc:  encrypt(accessToken),
        refreshTokenEnc: encrypt(refreshToken),
        expiresAt,
        accountId,
        locationId,
        locationName,
        googleEmail: email,
        isActive:    true,
        lastSyncAt:  null,
      },
    })

    return NextResponse.redirect(
      `${dashboardBase}/clients/${clientId}?tab=local-presence&gbp_connected=1`
    )
  } catch (err: unknown) {
    console.error('[GBP OAuth callback]', err)
    const msg = err instanceof Error ? err.message : 'unknown_error'
    return NextResponse.redirect(
      `${dashboardBase}/clients/${clientId}?gbp_error=${encodeURIComponent(msg)}`
    )
  }
}
