// GET /api/wave/partners/[userId]
// Returns commission payment history for a partner (sales rep or master)
// Query params: ?month=YYYY-MM (optional filter)

import { NextRequest, NextResponse } from 'next/server'
import { withPermission } from '@/lib/auth/api-permissions'
import { prisma } from '@/lib/db'
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const permissionError = await withPermission(req, 'manage_payments')
  if (permissionError) return permissionError

  const { userId: userIdStr } = await params
  const userId = parseInt(userIdStr)
  if (isNaN(userId)) {
    return NextResponse.json({ error: 'Invalid userId' }, { status: 400 })
  }

  const monthParam = req.nextUrl.searchParams.get('month')
  const monthFilter = monthParam
    ? { gte: startOfMonth(parseISO(`${monthParam}-01`)), lte: endOfMonth(parseISO(`${monthParam}-01`)) }
    : undefined

  const [user, transactions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, contractorVendorId: true, contractorEntityName: true, contractorEmail: true },
    }),
    prisma.paymentTransaction.findMany({
      where: { userId, ...(monthFilter ? { month: monthFilter } : {}) },
      include: { client: { select: { businessName: true } } },
      orderBy: { month: 'desc' },
    }),
  ])

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Group by month for summary view
  const byMonth = new Map<string, { total: number; paid: number; pending: number; count: number }>()
  for (const tx of transactions) {
    const key = format(tx.month, 'yyyy-MM')
    const existing = byMonth.get(key) ?? { total: 0, paid: 0, pending: 0, count: 0 }
    existing.total += Number(tx.amount)
    if (tx.status === 'paid') existing.paid += Number(tx.amount)
    else if (tx.status === 'pending') existing.pending += Number(tx.amount)
    existing.count++
    byMonth.set(key, existing)
  }

  const totalEarned = transactions.reduce((sum, t) => sum + Number(t.amount), 0)
  const totalPaid = transactions.filter(t => t.status === 'paid').reduce((sum, t) => sum + Number(t.amount), 0)
  const totalPending = transactions.filter(t => t.status === 'pending').reduce((sum, t) => sum + Number(t.amount), 0)

  return NextResponse.json({
    user,
    transactions,
    monthlyBreakdown: Object.fromEntries(byMonth),
    summary: { totalEarned, totalPaid, totalPending, transactionCount: transactions.length },
  })
}
