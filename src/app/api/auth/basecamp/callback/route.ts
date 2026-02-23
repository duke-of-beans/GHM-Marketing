// GET /api/auth/basecamp/callback — receives OAuth code, exchanges for token, saves to DB
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { exchangeCodeForToken } from '@/lib/basecamp/client'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const code = req.nextUrl.searchParams.get('code')
  if (!code) {
    return NextResponse.json({ error: 'Missing code parameter' }, { status: 400 })
  }

  try {
    const tokenData = await exchangeCodeForToken(code)

    // Pick the Basecamp 4 account
    const bc4Account = tokenData.accounts.find(a => a.product === 'bc4') ?? tokenData.accounts[0]
    if (!bc4Account) throw new Error('No Basecamp 4 account found in token response')

    const expiresAt = Date.now() + (tokenData.expires_in ?? 7776000) * 1000 // default 90 days

    // Persist to AppSetting — reuse existing key/value store
    await prisma.appSetting.upsert({
      where: { key: 'basecamp_token' },
      update: {
        value: JSON.stringify({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: expiresAt,
          account_id: String(bc4Account.id),
          account_name: bc4Account.name,
        }),
      },
      create: {
        key: 'basecamp_token',
        value: JSON.stringify({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: expiresAt,
          account_id: String(bc4Account.id),
          account_name: bc4Account.name,
        }),
      },
    })

    // Redirect back to settings with success flag
    return NextResponse.redirect(new URL('/settings?tab=integrations&bc=connected', req.url))
  } catch (err) {
    console.error('[Basecamp OAuth] Callback error:', err)
    return NextResponse.redirect(new URL('/settings?tab=integrations&bc=error', req.url))
  }
}
