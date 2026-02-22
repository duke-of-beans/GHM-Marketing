// GET /api/payments/pending
// Returns pending PaymentTransaction records for the approvals queue.
// Elevated (admin/master) only.
//
// Query params:
//   ?month=YYYY-MM   — filter to a specific month (default: current month)
//   ?all             — if present, return all pending regardless of month
//
// Returns transactions grouped by user with totals, plus a summary.

import { NextRequest, NextResponse } from 'next/server'
import { withPermission } from '@/lib/auth/api-permissions'
import { prisma } from '@/lib/db'
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns'

export async function GET(req: NextRequest) {
  const permissionError = await withPermission(req, 'manage_payments')
  if (permissionError) return permissionError

  const monthParam = req.nextUrl.searchParams.get('month')
  const showAll = req.nextUrl.searchParams.has('all')

  let monthFilter: { gte: Date; lte: Date } | undefined
  if (!showAll) {
    const targetDate = monthParam ? parseISO(`${monthParam}-01`) : new Date()
    monthFilter = {
      gte: startOfMonth(targetDate),
      lte: endOfMonth(targetDate),
    }
  }

  const transactions = await prisma.paymentTransaction.findMany({
    where: {
      status: 'pending',
      ...(monthFilter ? { month: monthFilter } : {}),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          role: true,
          contractorVendorId: true,
          contractorEntityName: true,
        },
      },
      client: {
        select: {
          id: true,
          businessName: true,
          retainerAmount: true,
        },
      },
    },
    orderBy: [{ month: 'desc' }, { userId: 'asc' }, { type: 'asc' }],
  })

  // Group by user
  type TxGroup = {
    userId: number
    userName: string
    userRole: string
    entityName: string | null
    hasVendorId: boolean
    totalAmount: number
    transactions: typeof transactions
    month: string
  }

  const byUser = new Map<string, TxGroup>()

  for (const tx of transactions) {
    const monthKey = format(tx.month, 'yyyy-MM')
    const groupKey = `${tx.userId}-${monthKey}`
    const existing = byUser.get(groupKey)

    if (existing) {
      existing.transactions.push(tx)
      existing.totalAmount += Number(tx.amount)
    } else {
      byUser.set(groupKey, {
        userId: tx.userId,
        userName: tx.user.name,
        userRole: tx.user.role,
        entityName: tx.user.contractorEntityName,
        hasVendorId: !!tx.user.contractorVendorId,
        totalAmount: Number(tx.amount),
        transactions: [tx],
        month: monthKey,
      })
    }
  }

  const groups = Array.from(byUser.values())
  const totalPending = transactions.reduce((sum, t) => sum + Number(t.amount), 0)
  const missingVendorCount = groups.filter(g => !g.hasVendorId).length

  return NextResponse.json({
    success: true,
    data: {
      groups,
      summary: {
        totalTransactions: transactions.length,
        totalAmount: totalPending,
        userCount: groups.length,
        missingVendorCount,
      },
    },
  })
}
