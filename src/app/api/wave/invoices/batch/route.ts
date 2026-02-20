// POST /api/wave/invoices/batch
// Monthly batch invoice generation for all active clients

import { NextRequest, NextResponse } from 'next/server'
import { withPermission } from '@/lib/auth/api-permissions'
import { prisma } from '@/lib/db'
import { ensureWaveCustomer } from '@/lib/wave/sync'
import { createInvoice, sendInvoice } from '@/lib/wave/invoices'
import { addDays, format, startOfMonth } from 'date-fns'

const SEO_RETAINER_PRODUCT_ID = process.env.WAVE_SEO_PRODUCT_ID ?? ''

export async function POST(req: NextRequest) {
  // Allow cron calls through without session
  const cronSecret = req.headers.get('x-cron-secret')
  const isCronCall = cronSecret === process.env.CRON_SECRET

  if (!isCronCall) {
    const permissionError = await withPermission(req, 'manage_payments')
    if (permissionError) return permissionError
  }

  const body = await req.json().catch(() => ({}))
  const { dryRun = false, month } = body as { dryRun?: boolean; month?: string }

  const targetDate = month ? new Date(month) : new Date()
  const invoiceDate = format(startOfMonth(targetDate), 'yyyy-MM-dd')
  const monthLabel = format(targetDate, 'MMMM yyyy')

  const clients = await prisma.clientProfile.findMany({
    where: { status: { in: ['active', 'signed'] } },
    include: { lead: true },
  })

  const alreadyInvoiced = await prisma.invoiceRecord.findMany({
    where: {
      clientId: { in: clients.map(c => c.id) },
      issuedDate: { gte: startOfMonth(targetDate), lt: addDays(startOfMonth(targetDate), 1) },
    },
    select: { clientId: true },
  })
  const alreadyInvoicedIds = new Set(alreadyInvoiced.map(r => r.clientId))
  const toInvoice = clients.filter(c => !alreadyInvoicedIds.has(c.id))

  if (dryRun) {
    return NextResponse.json({
      dryRun: true,
      month: monthLabel,
      totalClients: clients.length,
      alreadyInvoiced: alreadyInvoicedIds.size,
      toInvoice: toInvoice.map(c => ({ clientId: c.id, name: c.businessName, amount: Number(c.retainerAmount) })),
      totalAmount: toInvoice.reduce((sum, c) => sum + Number(c.retainerAmount), 0),
    })
  }

  const results = { success: 0, failed: 0, skipped: alreadyInvoicedIds.size, errors: [] as string[] }

  for (const client of toInvoice) {
    try {
      const waveCustomerId = await ensureWaveCustomer(client.id)
      const dueDate = format(addDays(startOfMonth(targetDate), client.paymentTermsDays), 'yyyy-MM-dd')
      const amount = Number(client.retainerAmount)

      const waveInvoice = await createInvoice({
        waveCustomerId,
        invoiceDate,
        dueDate,
        memo: `SEO Retainer — ${monthLabel}`,
        lineItems: [{ productId: SEO_RETAINER_PRODUCT_ID, description: `Monthly SEO Services — ${monthLabel}`, quantity: 1, unitPrice: amount }],
      })

      const record = await prisma.invoiceRecord.create({
        data: {
          clientId: client.id,
          waveInvoiceId: waveInvoice.id,
          invoiceNumber: waveInvoice.invoiceNumber,
          amount: client.retainerAmount,
          status: 'draft',
          issuedDate: new Date(invoiceDate),
          dueDate: new Date(dueDate),
          waveViewUrl: waveInvoice.viewUrl,
          lineItems: [{ description: `Monthly SEO Services — ${monthLabel}`, quantity: 1, unitPrice: amount }],
        },
      })

      const sent = await sendInvoice(waveInvoice.id)
      if (sent) {
        await prisma.invoiceRecord.update({ where: { id: record.id }, data: { status: 'sent' } })
        await prisma.clientProfile.update({ where: { id: client.id }, data: { lastInvoiceDate: new Date() } })
      }
      results.success++
    } catch (err) {
      results.failed++
      results.errors.push(`${client.businessName}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return NextResponse.json({ success: true, month: monthLabel, results })
}
