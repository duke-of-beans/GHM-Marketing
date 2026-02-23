// lib/basecamp/index.ts
// Public entry point — get a ready BasecampClient from stored token

import { prisma } from '@/lib/db'
import { BasecampClient, type BasecampToken } from './client'

export { BasecampClient, getAuthorizationUrl } from './client'
export type * from './client'

export async function getBasecampClient(): Promise<BasecampClient> {
  const setting = await prisma.appSetting.findUnique({ where: { key: 'basecamp_token' } })
  if (!setting?.value) {
    throw new Error('Basecamp not connected. Visit /api/auth/basecamp to authorize.')
  }

  const token: BasecampToken = JSON.parse(setting.value)

  if (Date.now() > token.expires_at - 60_000) {
    throw new Error('Basecamp token expired. Re-authorize at /api/auth/basecamp.')
  }

  return new BasecampClient(token)
}
