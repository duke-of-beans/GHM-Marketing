// POST /api/wave/sync/customers
// Syncs all active ClientProfiles to Wave customers

import { NextRequest, NextResponse } from 'next/server'
import { withPermission } from '@/lib/auth/api-permissions'
import { prisma } from '@/lib/db'
import { ensureWaveCustomer } from '@/lib/wave/sync'

export async function POST(req: NextRequest) {
  const permissionError = await withPermission(req, 'manage_payments')
  if (permissionError) return permissionError

  const clients = await prisma.clientProfile.findMany({
    where: { status: { in: ['active', 'signed', 'paused'] } },
    select: { id: true, businessName: true, waveCustomerId: true },
  })

  const results = { synced: 0, alreadyLinked: 0, failed: 0, errors: [] as string[] }

  for (const client of clients) {
    try {
      if (client.waveCustomerId) {
        results.alreadyLinked++
        continue
      }
      await ensureWaveCustomer(client.id)
      results.synced++
    } catch (err) {
      results.failed++
      results.errors.push(`${client.businessName}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return NextResponse.json({ success: true, results })
}
