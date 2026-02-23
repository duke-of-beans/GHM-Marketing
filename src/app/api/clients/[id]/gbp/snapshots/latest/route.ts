import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUserWithPermissions } from '@/lib/auth/api-permissions'
import { isElevated } from '@/lib/auth/roles'

// GET /api/clients/[id]/gbp/snapshots/latest
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUserWithPermissions()
  if (!user || !isElevated(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const clientId = parseInt(params.id)
  if (isNaN(clientId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const latest = await prisma.gbpSnapshot.findFirst({
    where:   { clientId },
    orderBy: { scanDate: 'desc' },
  })

  if (!latest) return NextResponse.json({ success: true, data: null })

  const searchViewsDelta = latest.previousSearchViews != null && latest.searchViews != null
    ? latest.searchViews - latest.previousSearchViews
    : null

  const trend = (delta: number | null) => {
    if (delta === null) return 'unknown'
    if (delta > 0) return 'up'
    if (delta < 0) return 'down'
    return 'stable'
  }

  return NextResponse.json({
    success: true,
    data: {
      snapshot: latest,
      deltas: {
        searchViews:      searchViewsDelta,
        searchViewsTrend: trend(searchViewsDelta),
      },
    },
  })
}
