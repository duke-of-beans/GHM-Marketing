/**
 * Google Ads OAuth 2.0 flow
 * Separate from GBP OAuth — different scopes, different connection model.
 *
 * Required env vars:
 *   GOOGLE_ADS_CLIENT_ID
 *   GOOGLE_ADS_CLIENT_SECRET
 *   GOOGLE_ADS_REDIRECT_URI
 *   GOOGLE_ADS_DEVELOPER_TOKEN
 *   ENCRYPTION_KEY  (shared with GBP OAuth)
 */

import { prisma } from '@/lib/prisma'
import { encrypt, decrypt } from './encrypt'

const SCOPES = [
  'https://www.googleapis.com/auth/adwords',
].join(' ')

const TOKEN_URL  = 'https://oauth2.googleapis.com/token'
const AUTH_URL   = 'https://accounts.google.com/o/oauth2/v2/auth'
const ADS_API    = 'https://googleads.googleapis.com/v18'

export function buildAuthUrl(clientId: number): string {
  const params = new URLSearchParams({
    client_id:     process.env.GOOGLE_ADS_CLIENT_ID!,
    redirect_uri:  process.env.GOOGLE_ADS_REDIRECT_URI!,
    response_type: 'code',
    scope:         SCOPES,
    access_type:   'offline',
    prompt:        'consent',
    state:         String(clientId),
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
      client_id:     process.env.GOOGLE_ADS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
      redirect_uri:  process.env.GOOGLE_ADS_REDIRECT_URI!,
      grant_type:    'authorization_code',
    }),
  })

  if (!res.ok) throw new Error(`Ads token exchange failed: ${await res.text()}`)
  const data = await res.json()

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

export async function refreshAccessToken(connectionId: number): Promise<string> {
  const conn = await prisma.googleAdsConnection.findUniqueOrThrow({
    where: { id: connectionId },
  })

  if (conn.expiresAt > new Date(Date.now() + 5 * 60 * 1000)) {
    return decrypt(conn.accessTokenEnc)
  }

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: decrypt(conn.refreshTokenEnc),
      client_id:     process.env.GOOGLE_ADS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
      grant_type:    'refresh_token',
    }),
  })

  if (!res.ok) throw new Error(`Ads token refresh failed: ${await res.text()}`)
  const data = await res.json()
  const newExpiry = new Date(Date.now() + data.expires_in * 1000)

  await prisma.googleAdsConnection.update({
    where: { id: connectionId },
    data: { accessTokenEnc: encrypt(data.access_token), expiresAt: newExpiry },
  })

  return data.access_token
}

/** Discover the first accessible Ads customer account for the authorized user */
export async function discoverCustomer(
  accessToken: string
): Promise<{ customerId: string; accountName: string }> {
  const res = await fetch(`${ADS_API}/customers:listAccessibleCustomers`, {
    headers: {
      Authorization:        `Bearer ${accessToken}`,
      'developer-token':    process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
      'Content-Type':       'application/json',
    },
  })

  if (!res.ok) throw new Error(`Ads customer list failed: ${await res.text()}`)
  const data = await res.json()

  if (!data.resourceNames?.length) throw new Error('No accessible Google Ads customers found')

  // resourceNames[0] = "customers/1234567890"
  const customerId = data.resourceNames[0].split('/')[1]

  // Fetch account name
  const infoRes = await fetch(
    `${ADS_API}/customers/${customerId}?fields=customer.descriptive_name`,
    {
      headers: {
        Authorization:        `Bearer ${accessToken}`,
        'developer-token':    process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
        'login-customer-id':  customerId,
      },
    }
  )

  const infoData = infoRes.ok ? await infoRes.json() : {}
  const accountName = infoData.customer?.descriptiveName ?? `Customer ${customerId}`

  return { customerId, accountName }
}

export { encrypt, decrypt, ADS_API }
