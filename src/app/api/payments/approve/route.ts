// POST /api/payments/approve
// Approves one or more pending PaymentTransaction records.
// Elevated (admin/master) only.
//
// Body:
//   { transactionIds: number[] }           — approve specific transactions
//   { clientId: number, month: string }    — approve all pending for a client/month
//   { userId: number, month: string }      — approve all pending for a user/month
//
// On approval:
//   - Sets status → "approved"
//   - Validates contractorVendorId is set on the payee (warns if missing, still approves)
//   - Creates Wave bill if contractorVendorId is set
//   - Returns summary of what was approved and any Wave errors
//
// Note: Wave bill creation is best-effort. A failed bill does NOT roll back the
// approval — the approved status is a business decision separate from Wave.
// Re-running payout cron or the Wave payout endpoint will pick up approved txs.

import { NextRequest, NextResponse } from 'next/server'
import { withPermission } from '@/lib/auth/api-permissions'
import { prisma } from '@/lib/db'
import { createBill } from '@/lib/wave/bills'
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns'

export async function POST(req: NextRequest) {
  const permissionError = await withPermission(req, 'manage_payments')
  if (permissionError) return permissionError

  const body = await req.json().catch(() => ({}))
  const { transactionIds, clientId, userId, month } = body as {
    transactionIds?: number[]
    clientId?: number
    userId?: number
    month?: string
  }

  // Build the where clause
  type WhereClause = {
    id?: { in: number[] }
    clientId?: number
    userId?: number
    status: string
    month?: { gte: Date; lte: Date }
  }
  const where: WhereClause = { status: 'pending' }

  if (transactionIds?.length) {
    where.id = { in: transactionIds }
  } else if (clientId && month) {
    const monthDate = parseISO(`${month}-01`)
    where.clientId = clientId
    where.month = { gte: startOfMonth(monthDate), lte: endOfMonth(monthDate) }
  } else if (userId && month) {
    const monthDate = parseISO(`${month}-01`)
    where.userId = userId
    where.month = { gte: startOfMonth(monthDate), lte: endOfMonth(monthDate) }
  } else {
    return NextResponse.json(
      { error: 'Provide transactionIds, or (clientId + month), or (userId + month)' },
      { status: 400 }
    )
  }

  const transactions = await prisma.paymentTransaction.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          contractorVendorId: true,
          contractorEntityName: true,
          contractorEmail: true,
        },
      },
      client: { select: { businessName: true } },
    },
  })

  if (transactions.length === 0) {
    return NextResponse.json({ success: true, approved: 0, message: 'No pending transactions matched' })
  }

  const results = {
    approved: 0,
    waveCreated: 0,
    waveFailed: 0,
    missingVendorId: [] as string[],
    errors: [] as string[],
  }

  // Group by user for consolidated Wave bills (one bill per user covers all their txs in this batch)
  const byUser = new Map<number, typeof transactions>()
  for (const tx of transactions) {
    const group = byUser.get(tx.userId) ?? []
    group.push(tx)
    byUser.set(tx.userId, group)
  }

  for (const [uid, txs] of Array.from(byUser)) {
    const user = txs[0].user
    const txIds = txs.map((t: typeof transactions[number]) => t.id)

    // Mark approved
    await prisma.paymentTransaction.updateMany({
      where: { id: { in: txIds } },
      data: { status: 'approved' },
    })
    results.approved += txs.length

    // Attempt Wave bill creation if vendor ID is set
    if (!user.contractorVendorId) {
      results.missingVendorId.push(user.name)
      continue
    }

    try {
      const totalAmount = txs.reduce((sum: number, t: typeof transactions[number]) => sum + Number(t.amount), 0)
      const monthLabel = format(txs[0].month, 'MMMM yyyy')
      const description = txs
        .map((t: typeof transactions[number]) => `${t.type.replace(/_/g, ' ')} — ${t.client.businessName}: $${Number(t.amount).toFixed(2)}`)
        .join('\n')
      const billNumber = `GHM-PAY-${format(txs[0].month, 'yyyyMM')}-${uid}`

      const waveBill = await createBill({
        waveVendorId: user.contractorVendorId,
        amount: totalAmount,
        description: `Partner Commissions — ${monthLabel}\n${description}`,
        invoiceDate: format(startOfMonth(txs[0].month), 'yyyy-MM-dd'),
        dueDate: format(endOfMonth(txs[0].month), 'yyyy-MM-dd'),
        billNumber,
      })

      await prisma.paymentTransaction.updateMany({
        where: { id: { in: txIds } },
        data: { waveBillId: waveBill.id },
      })

      results.waveCreated++
    } catch (err) {
      results.waveFailed++
      results.errors.push(
        `Wave bill failed for ${user.name}: ${err instanceof Error ? err.message : String(err)}`
      )
    }
  }

  return NextResponse.json({ success: true, ...results, total: transactions.length })
}
