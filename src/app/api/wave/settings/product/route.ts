// POST /api/wave/settings/product
// Saves the selected Wave SEO product ID to the DB (app_settings table)
// The invoice generation routes read from this setting at runtime

import { NextRequest, NextResponse } from 'next/server'
import { withPermission } from '@/lib/auth/api-permissions'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const permissionError = await withPermission(req, 'manage_settings')
  if (permissionError) return permissionError

  const setting = await prisma.appSetting.findUnique({
    where: { key: 'wave_seo_product_id' },
  })

  return NextResponse.json({ productId: setting?.value ?? null })
}

export async function POST(req: NextRequest) {
  const permissionError = await withPermission(req, 'manage_settings')
  if (permissionError) return permissionError

  const { productId } = await req.json().catch(() => ({}))
  if (!productId || typeof productId !== 'string') {
    return NextResponse.json({ error: 'productId required' }, { status: 400 })
  }

  await prisma.appSetting.upsert({
    where: { key: 'wave_seo_product_id' },
    create: { key: 'wave_seo_product_id', value: productId },
    update: { value: productId },
  })

  return NextResponse.json({ success: true, productId })
}
