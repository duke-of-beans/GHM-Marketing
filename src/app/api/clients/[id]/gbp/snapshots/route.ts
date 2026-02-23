import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUserWithPermissions } from '@/lib/auth/api-permissions'
import { isElevated } from '@/lib/auth/roles'

// GET /api/clients/[id]/gbp/snapshots
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUserWithPermissions()
  if (!user || !isElevated(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const clientId = parseInt(params.id)
  if (isNaN(clientId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '12'), 52)
  const page  = Math.max(parseInt(searchParams.get('page') ?? '1'), 1)
  const skip  = (page - 1) * limit

  const [snapshots, total] = await Promise.all([
    prisma.gbpSnapshot.findMany({
      where:   { clientId },
      orderBy: { scanDate: 'desc' },
      skip,
      take: limit,
    }),
    prisma.gbpSnapshot.count({ where: { clientId } }),
  ])

  return NextResponse.json({
    success: true,
    data: { snapshots, total, page, limit, pages: Math.ceil(total / limit) },
  })
}
