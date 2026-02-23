// GET /api/finance/live-summary
// Returns live financial snapshot: Wave bank balances + recent transactions +
// AR/AP totals from DB. Admin-only.

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getBankAccounts, getRecentTransactions } from '@/lib/wave/accounts'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as { role?: string }).role
  if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // ── DB queries (fast, no external call) ────────────────────────────────────

  // AR: unpaid invoice totals
  const arData = await prisma.invoiceRecord.groupBy({
    by: ['status'],
    where: { status: { in: ['sent', 'viewed', 'overdue'] } },
    _sum: { amount: true },
    _count: { id: true },
  })

  const arByStatus = arData.reduce<Record<string, { amount: number; count: number }>>(
    (acc, row) => {
      acc[row.status] = {
        amount: Number(row._sum.amount ?? 0),
        count: row._count.id,
      }
      return acc
    },
    {}
  )

  const totalOutstanding = Object.values(arByStatus).reduce((s, r) => s + r.amount, 0)
  const totalOverdue = (arByStatus['overdue']?.amount ?? 0)
  const overdueCount = (arByStatus['overdue']?.count ?? 0)

  // Next expected payment: earliest due date among outstanding invoices
  const nextDue = await prisma.invoiceRecord.findFirst({
    where: { status: { in: ['sent', 'viewed', 'overdue'] } },
    orderBy: { dueDate: 'asc' },
    select: { dueDate: true, amount: true, status: true },
  })

  // AP: pending partner payments (PaymentTransaction)
  const apPending = await prisma.paymentTransaction.aggregate({
    where: { status: 'pending', isHistorical: false },
    _sum: { amount: true },
    _count: { id: true },
  })
  const totalPendingAP = Number(apPending._sum.amount ?? 0)
  const pendingAPCount = apPending._count.id

  // Collected MTD
  const now = new Date()
  const mtdStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const mtdCollected = await prisma.invoiceRecord.aggregate({
    where: { status: 'paid', paidDate: { gte: mtdStart } },
    _sum: { paidAmount: true },
    _count: { id: true },
  })
  const collectedMTD = Number(mtdCollected._sum.paidAmount ?? 0)

  // ── Wave API calls (external) ───────────────────────────────────────────────
  const [bankAccounts, recentTransactions] = await Promise.allSettled([
    getBankAccounts(),
    getRecentTransactions(10),
  ])

  const accounts = bankAccounts.status === 'fulfilled' ? bankAccounts.value : []
  const transactions = recentTransactions.status === 'fulfilled' ? recentTransactions.value : []
  const waveError = bankAccounts.status === 'rejected'
    ? String((bankAccounts as PromiseRejectedResult).reason)
    : null

  // Net cash = total bank balance - pending AP
  const totalBankBalance = accounts.reduce((s, a) => s + a.balance, 0)
  const netCash = totalBankBalance - totalPendingAP

  return NextResponse.json({
    // Bank
    bankAccounts: accounts,
    totalBankBalance,

    // AR
    ar: {
      totalOutstanding,
      totalOverdue,
      overdueCount,
      collectedMTD,
      nextExpected: nextDue
        ? { dueDate: nextDue.dueDate, amount: Number(nextDue.amount), status: nextDue.status }
        : null,
    },

    // AP
    ap: {
      totalPending: totalPendingAP,
      pendingCount: pendingAPCount,
    },

    // Net position
    netCash,

    // Recent transactions from Wave
    recentTransactions: transactions,

    // Error passthrough (graceful — UI still renders DB data)
    waveError,
  })
}
