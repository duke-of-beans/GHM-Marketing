// POST /api/wave/partners/sync
// Creates Wave vendor records for all active sales reps + masters
// Idempotent — skips users who already have a contractorVendorId

import { NextRequest, NextResponse } from 'next/server'
import { withPermission } from '@/lib/auth/api-permissions'
import { prisma } from '@/lib/db'
import { ensureWaveVendor } from '@/lib/wave/sync'

export async function POST(req: NextRequest) {
  const permissionError = await withPermission(req, 'manage_payments')
  if (permissionError) return permissionError

  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      role: { in: ['sales', 'manager'] },
    },
    select: { id: true, name: true, email: true, contractorVendorId: true, contractorEntityName: true },
  })

  const results = { synced: 0, alreadyLinked: 0, failed: 0, errors: [] as string[] }

  for (const user of users) {
    try {
      if (user.contractorVendorId) {
        results.alreadyLinked++
        continue
      }
      await ensureWaveVendor(user.id)
      results.synced++
    } catch (err) {
      results.failed++
      results.errors.push(`${user.name} (${user.email}): ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return NextResponse.json({ success: true, results })
}
