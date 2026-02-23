/**
 * src/lib/wave/product-id.ts
 *
 * Shared helper for resolving the Wave SEO product ID.
 * Env var takes precedence; falls back to DB AppSetting configured in Settings → Wave.
 */

import { prisma } from '@/lib/db'

export async function getSeoProductId(): Promise<string> {
  if (process.env.WAVE_SEO_PRODUCT_ID) return process.env.WAVE_SEO_PRODUCT_ID
  const setting = await prisma.appSetting.findUnique({ where: { key: 'wave_seo_product_id' } })
  return setting?.value ?? ''
}
