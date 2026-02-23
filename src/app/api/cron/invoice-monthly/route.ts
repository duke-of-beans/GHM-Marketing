// GET /api/cron/invoice-monthly
// Vercel cron: runs 1st of month at 00:05 UTC
// Triggers batch invoice generation for all active clients

import { NextRequest, NextResponse } from 'next/server'
import { log } from '@/lib/logger'

export async function GET(req: NextRequest) {
  // Verify this is a legitimate Vercel cron call
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

  const response = await fetch(`${baseUrl}/api/wave/invoices/batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Pass internal cron auth so withPermission doesn't block it
      'x-cron-secret': process.env.CRON_SECRET ?? '',
    },
    body: JSON.stringify({}),
  })

  const result = await response.json()
  log.info({ cron: 'invoice-monthly', result }, 'Monthly invoice batch triggered')

  return NextResponse.json({ ok: true, result })
}
