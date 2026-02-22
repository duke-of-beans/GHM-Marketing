// POST /api/wave/partners/payout
// Creates Wave bills for pending commission transactions
// Body: { month?: string (YYYY-MM), userId?: number, dryRun?: boolean }

import { NextRequest, NextResponse } from 'next/server'
import { withPermission } from '@/lib/auth/api-permissions'
import { prisma } from '@/lib/db'
import { ensureWaveVendor } from '@/lib/wave/sync'
import { createBill } from '@/lib/wave/bills'
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns'

export async function POST(req: NextRequest) {
  const permissionError = await withPermission(req, 'manage_payments')
  if (permissionError) return permissionError

  const body = await req.json().catch(() => ({}))
  const { month, userId, dryRun = false } = body as { month?: string; userId?: number; dryRun?: boolean }

  const targetDate = month ? parseISO(`${month}-01`) : new Date()
  const monthStart = startOfMonth(targetDate)
  const monthEnd = endOfMonth(targetDate)
  const monthLabel = format(targetDate, 'MMMM yyyy')

  const transactions = await prisma.paymentTransaction.findMany({
    where: {
      status: 'pending',
      waveBillId: null,
      month: { gte: monthStart, lte: monthEnd },
      ...(userId ? { userId } : {}),
    },
    include: {
      user: { select: { id: true, name: true, email: true, contractorVendorId: true, contractorEntityName: true } },
      client: { select: { businessName: true } },
    },
    orderBy: [{ userId: 'asc' }, { type: 'asc' }],
  })

  if (transactions.length === 0) {
    return NextResponse.json({ success: true, message: 'No pending transactions found', month: monthLabel })
  }

  // Group by user
  const byUser: Record<number, typeof transactions> = {}
  for (const tx of transactions) {
    if (!byUser[tx.userId]) byUser[tx.userId] = []
    byUser[tx.userId].push(tx)
  }

  if (dryRun) {
    const preview = Object.entries(byUser).map(([uid, txs]) => ({
      userId: Number(uid),
      name: txs[0].user.name,
      email: txs[0].user.email,
      transactions: txs.map((t) => ({
        id: t.id, type: t.type, client: t.client.businessName, amount: Number(t.amount),
      })),
      totalAmount: txs.reduce((sum: number, t) => sum + Number(t.amount), 0),
    }))
    return NextResponse.json({ dryRun: true, month: monthLabel, preview, totalTransactions: transactions.length })
  }

  const results = { processed: 0, failed: 0, totalPaid: 0, errors: [] as string[] }

  for (const [uid, txs] of Object.entries(byUser)) {
    try {
      const userId = Number(uid)
      const waveVendorId = await ensureWaveVendor(userId)
      const totalAmount = txs.reduce((sum: number, t) => sum + Number(t.amount), 0)

      const description = txs
        .map((t) => `${t.type.replace('_', ' ')} — ${t.client.businessName}: $${Number(t.amount).toFixed(2)}`)
        .join('\n')

      const billNumber = `GHM-PAY-${format(targetDate, 'yyyyMM')}-${userId}`

      const waveBill = await createBill({
        waveVendorId,
        amount: totalAmount,
        description: `Partner Commissions — ${monthLabel}\n${description}`,
        invoiceDate: format(monthStart, 'yyyy-MM-dd'),
        dueDate: format(monthEnd, 'yyyy-MM-dd'),
        billNumber,
      })

      await prisma.paymentTransaction.updateMany({
        where: { id: { in: txs.map((t) => t.id) } },
        data: { waveBillId: waveBill.id },
      })

      results.processed += txs.length
      results.totalPaid += totalAmount
    } catch (err) {
      results.failed++
      const userName = txs[0].user.name
      results.errors.push(`${userName}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return NextResponse.json({ success: true, month: monthLabel, results })
}
