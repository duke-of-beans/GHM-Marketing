/**
 * Google OAuth 2.0 flow for Business Profile API
 *
 * Required env vars:
 *   GOOGLE_CLIENT_ID
 *   GOOGLE_CLIENT_SECRET
 *   GOOGLE_REDIRECT_URI  (e.g. https://your-domain.com/api/oauth/google/callback)
 *   ENCRYPTION_KEY       (64 hex chars)
 */

import { prisma } from '@/lib/prisma'
import { encrypt, decrypt } from './encrypt'

const SCOPES = [
  'https://www.googleapis.com/auth/business.manage',
].join(' ')

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'

// Account Management API
const ACCT_BASE = 'https://mybusinessaccountmanagement.googleapis.com/v1'
// v4.9 — Reviews, Posts
const V4_BASE = 'https://mybusiness.googleapis.com/v4'

export function buildAuthUrl(clientId: number): string {
  const params = new URLSearchParams({
    client_id:     process.env.GOOGLE_CLIENT_ID!,
    redirect_uri:  process.env.GOOGLE_REDIRECT_URI!,
    response_type: 'code',
    scope:         SCOPES,
    access_type:   'offline',
    prompt:        'consent',            // force refresh_token every time
    state:         String(clientId),     // passed back in callback
  })
  return `${AUTH_URL}?${params}`
}

export async function exchangeCode(
  code: string
): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date; email: string }> {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri:  process.env.GOOGLE_REDIRECT_URI!,
      grant_type:    'authorization_code',
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Token exchange failed: ${err}`)
  }

  const data = await res.json()

  // Decode id_token to get email (no verification needed — just display)
  const payload = JSON.parse(
    Buffer.from(data.id_token.split('.')[1], 'base64url').toString()
  )

  return {
    accessToken:  data.access_token,
    refreshToken: data.refresh_token,
    expiresAt:    new Date(Date.now() + data.expires_in * 1000),
    email:        payload.email,
  }
}

export async function refreshAccessToken(gbpConnectionId: number): Promise<string> {
  const conn = await prisma.gBPConnection.findUniqueOrThrow({
    where: { id: gbpConnectionId },
  })

  // Return cached token if still valid (5-min buffer)
  if (conn.expiresAt > new Date(Date.now() + 5 * 60 * 1000)) {
    return decrypt(conn.accessTokenEnc)
  }

  const refreshToken = decrypt(conn.refreshTokenEnc)

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type:    'refresh_token',
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Token refresh failed: ${err}`)
  }

  const data = await res.json()
  const newExpiry = new Date(Date.now() + data.expires_in * 1000)

  await prisma.gBPConnection.update({
    where: { id: gbpConnectionId },
    data: {
      accessTokenEnc: encrypt(data.access_token),
      expiresAt:      newExpiry,
    },
  })

  return data.access_token
}

/** Fetch the first GBP account + first location for the authorized user */
export async function discoverAccountAndLocation(
  accessToken: string
): Promise<{ accountId: string; locationId: string; locationName: string }> {
  // 1. List accounts
  const acctRes = await fetch(`${ACCT_BASE}/accounts`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!acctRes.ok) throw new Error(`GBP accounts list failed: ${await acctRes.text()}`)
  const { accounts } = await acctRes.json()
  if (!accounts?.length) throw new Error('No GBP accounts found for this Google user')

  const accountId = accounts[0].name // e.g. "accounts/123456"

  // 2. List locations under first account (v4)
  const locRes = await fetch(
    `${V4_BASE}/${accountId}/locations?pageSize=1`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!locRes.ok) throw new Error(`GBP locations list failed: ${await locRes.text()}`)
  const { locations } = await locRes.json()
  if (!locations?.length) throw new Error('No locations found under GBP account')

  const loc = locations[0]
  // loc.name = "accounts/123/locations/987654321"
  // Performance API needs just the numeric location ID: "locations/987654321"
  const locationId = loc.name.split('/').slice(-2).join('/') // "locations/987654321"

  return { accountId, locationId, locationName: loc.locationName || loc.name }
}

export { encrypt, decrypt, ACCT_BASE, V4_BASE }
