/**
 * Google Ads API authenticated client
 * Handles token refresh transparently on every call.
 */

import { prisma } from '@/lib/prisma'
import { refreshAccessToken, ADS_API } from '@/lib/oauth/google-ads'

export interface AdsClient {
  connectionId: number
  customerId:   string
  accountName:  string
  get:  (path: string) => Promise<Response>
  post: (path: string, body: unknown) => Promise<Response>
}

export async function getAdsClient(clientId: number): Promise<AdsClient | null> {
  const conn = await prisma.googleAdsConnection.findUnique({
    where: { clientId, isActive: true },
  })
  if (!conn) return null

  const accessToken = await refreshAccessToken(conn.id)

  const headers = () => ({
    Authorization:       `Bearer ${accessToken}`,
    'developer-token':   process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
    'login-customer-id': conn.customerId,
    'Content-Type':      'application/json',
  })

  return {
    connectionId: conn.id,
    customerId:   conn.customerId,
    accountName:  conn.accountName,
    get:  (path) => fetch(`${ADS_API}${path}`, { headers: headers() }),
    post: (path, body) => fetch(`${ADS_API}${path}`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body),
    }),
  }
}
