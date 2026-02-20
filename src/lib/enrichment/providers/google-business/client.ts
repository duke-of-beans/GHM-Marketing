/**
 * Authenticated GBP API client
 * Handles token refresh transparently on every call.
 */

import { prisma } from '@/lib/prisma'
import { refreshAccessToken } from '@/lib/oauth/google'

export const PERF_BASE = 'https://businessprofileperformance.googleapis.com/v1'
export const V4_BASE   = 'https://mybusiness.googleapis.com/v4'

export interface GBPClient {
  connectionId: number
  accountId:    string
  locationId:   string   // "locations/987654321" — for Performance API
  locationName: string
  get:  (url: string) => Promise<Response>
  post: (url: string, body: unknown) => Promise<Response>
  put:  (url: string, body: unknown) => Promise<Response>
}

export async function getGBPClient(clientId: number): Promise<GBPClient | null> {
  const conn = await prisma.gBPConnection.findUnique({
    where: { clientId, isActive: true },
  })
  if (!conn) return null

  const accessToken = await refreshAccessToken(conn.id)

  const authHeaders = () => ({
    Authorization:  `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  })

  return {
    connectionId: conn.id,
    accountId:    conn.accountId,
    locationId:   conn.locationId,
    locationName: conn.locationName,
    get:  (url) => fetch(url, { headers: authHeaders() }),
    post: (url, body) => fetch(url, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) }),
    put:  (url, body) => fetch(url, { method: 'PUT',  headers: authHeaders(), body: JSON.stringify(body) }),
  }
}
