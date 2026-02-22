// GET /api/cron/invoice-status-poll
// Vercel cron: runs every hour (0 * * * *)
//
// Option C payment trigger — polls Wave for status changes on all open invoices.
// When an invoice flips to PAID, runs the commission engine for that client
// (same logic as the webhook handler would have used).
//
// With 7-8 clients this is trivially within Wave API rate limits.
// Worst-case payment latency: ~1 hour. Effectively real-time for this scale.

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getInvoice } from '@/lib/wave/invoices'
import { generateClientMonthlyPayments } from '@/lib/payments/calculations'
import { startOfMonth } from 'date-fns'
import { format } from 'date-fns'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch all invoices that could still flip to paid
  const openInvoices = await prisma.invoiceRecord.findMany({
    where: {
      status: { in: ['sent', 'viewed', 'overdue'] },
    },
    include: {
      client: {
        select: {
          id: true,
          businessName: true,
          status: true,
          waveCustomerId: true,
          paymentStatus: true,
          onboardedMonth: true,
          retainerAmount: true,
          salesRepId: true,
          masterManagerId: true,
          lockedResidualAmount: true,
          closedInMonth: true,
          salesRep: { include: { compensationConfig: true } },
          masterManager: { include: { compensationConfig: true } },
          compensationOverrides: true,
        },
      },
    },
  })

  const results = {
    checked: openInvoices.length,
    unchanged: 0,
    paidFlips: 0,
    commissionsGenerated: 0,
    errors: [] as string[],
  }

  for (const invoice of openInvoices) {
    try {
      const waveInvoice = await getInvoice(invoice.waveInvoiceId)
      if (!waveInvoice) continue

      const newStatus = waveInvoice.status.toLowerCase()

      // No change — skip
      if (newStatus === invoice.status) {
        results.unchanged++
        continue
      }

      // Update the invoice record
      const isPaid = newStatus === 'paid'
      await prisma.invoiceRecord.update({
        where: { id: invoice.id },
        data: {
          status: newStatus,
          paidDate: isPaid && waveInvoice.amountPaid.raw > 0 ? new Date() : undefined,
          paidAmount: isPaid ? waveInvoice.amountPaid.raw : undefined,
        },
      })

      // Only trigger commissions on paid flip
      if (!isPaid) continue

      results.paidFlips++

      const client = invoice.client
      if (client.status !== 'active') continue

      const currentMonth = startOfMonth(new Date())
      const eventId = `poll-${invoice.waveInvoiceId}-${format(currentMonth, 'yyyy-MM')}`

      const salesRepConfig = client.salesRep?.compensationConfig ?? null
      const masterConfig = client.masterManager?.compensationConfig ?? null
      const salesRepOverride = client.salesRepId
        ? (client.compensationOverrides.find(o => o.userId === client.salesRepId) ?? null)
        : null

      const paymentsToGenerate = generateClientMonthlyPayments(
        {
          id: client.id,
          onboardedMonth: client.onboardedMonth,
          retainerAmount: client.retainerAmount,
          status: client.status,
          salesRepId: client.salesRepId,
          masterManagerId: client.masterManagerId,
          lockedResidualAmount: client.lockedResidualAmount ?? null,
          closedInMonth: client.closedInMonth ?? null,
        },
        salesRepConfig,
        salesRepOverride,
        masterConfig,
        currentMonth,
        false
      )

      let created = 0
      for (const p of paymentsToGenerate) {
        // Skip if already exists for this month (webhook or previous poll already ran)
        const exists = await prisma.paymentTransaction.findFirst({
          where: {
            clientId: p.clientId,
            userId: p.userId,
            type: p.type,
            month: currentMonth,
          },
        })
        if (exists) continue

        await prisma.paymentTransaction.create({
          data: {
            clientId: p.clientId,
            userId: p.userId,
            type: p.type,
            amount: p.amount,
            month: currentMonth,
            status: 'pending',
            sourceEventId: eventId,
            notes: `Auto-generated from invoice poll (${invoice.waveInvoiceId})`,
          },
        })
        created++
      }

      if (created > 0) {
        // Update client payment status to current
        await prisma.clientProfile.update({
          where: { id: client.id },
          data: { lastPaymentDate: new Date(), paymentStatus: 'current' },
        })
      }

      results.commissionsGenerated += created
      console.log(`[cron/invoice-status-poll] ${client.businessName} paid — ${created} transactions created`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      results.errors.push(`Invoice ${invoice.waveInvoiceId}: ${msg}`)
      console.error(`[cron/invoice-status-poll] Error on invoice ${invoice.waveInvoiceId}:`, msg)
    }
  }

  console.log('[cron/invoice-status-poll]', JSON.stringify(results))
  return NextResponse.json({ ok: true, results })
}
