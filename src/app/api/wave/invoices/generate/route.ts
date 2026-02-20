// POST /api/wave/invoices/generate
// Creates and sends a retainer invoice for a single client
// Body: { clientId: number, dryRun?: boolean }

import { NextRequest, NextResponse } from 'next/server'
import { withPermission } from '@/lib/auth/api-permissions'
import { prisma } from '@/lib/db'
import { ensureWaveCustomer } from '@/lib/wave/sync'
import { createInvoice, sendInvoice } from '@/lib/wave/invoices'
import { addDays, format, startOfMonth } from 'date-fns'

async function getSeoProductId(): Promise<string> {
  // Env var takes precedence; fall back to DB setting configured in UI
  if (process.env.WAVE_SEO_PRODUCT_ID) return process.env.WAVE_SEO_PRODUCT_ID
  const setting = await prisma.appSetting.findUnique({ where: { key: 'wave_seo_product_id' } })
  return setting?.value ?? ''
}

export async function POST(req: NextRequest) {
  const permissionError = await withPermission(req, 'manage_payments')
  if (permissionError) return permissionError

  const body = await req.json()
  const { clientId, dryRun = false } = body as { clientId: number; dryRun?: boolean }

  if (!clientId) {
    return NextResponse.json({ error: 'clientId required' }, { status: 400 })
  }

  const client = await prisma.clientProfile.findUnique({
    where: { id: clientId },
    include: { lead: true },
  })

  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  }

  if (!['active', 'signed'].includes(client.status)) {
    return NextResponse.json({ error: `Client status "${client.status}" is not billable` }, { status: 422 })
  }

  const waveCustomerId = await ensureWaveCustomer(clientId)
  const seoProductId = await getSeoProductId()
  if (!seoProductId) {
    return NextResponse.json({ error: 'Wave SEO product not configured. Set it in Settings → Wave.' }, { status: 400 })
  }
  const today = new Date()
  const invoiceDate = format(startOfMonth(today), 'yyyy-MM-dd')
  const dueDate = format(addDays(startOfMonth(today), client.paymentTermsDays), 'yyyy-MM-dd')
  const amount = Number(client.retainerAmount)

  if (dryRun) {
    return NextResponse.json({ dryRun: true, clientId, businessName: client.businessName, waveCustomerId, amount, invoiceDate, dueDate })
  }

  const waveInvoice = await createInvoice({
    waveCustomerId,
    invoiceDate,
    dueDate,
    memo: `SEO Retainer — ${format(today, 'MMMM yyyy')}`,
    lineItems: [{
      productId: seoProductId,
      description: `Monthly SEO Services — ${format(today, 'MMMM yyyy')}`,
      quantity: 1,
      unitPrice: amount,
    }],
  })

  const record = await prisma.invoiceRecord.create({
    data: {
      clientId,
      waveInvoiceId: waveInvoice.id,
      invoiceNumber: waveInvoice.invoiceNumber,
      amount: client.retainerAmount,
      status: 'draft',
      issuedDate: new Date(invoiceDate),
      dueDate: new Date(dueDate),
      waveViewUrl: waveInvoice.viewUrl,
      lineItems: [{ description: `Monthly SEO Services — ${format(today, 'MMMM yyyy')}`, quantity: 1, unitPrice: amount }],
    },
  })

  const sent = await sendInvoice(waveInvoice.id)

  if (sent) {
    await prisma.invoiceRecord.update({ where: { id: record.id }, data: { status: 'sent' } })
    await prisma.clientProfile.update({ where: { id: clientId }, data: { lastInvoiceDate: new Date() } })
  }

  return NextResponse.json({ success: true, invoiceId: record.id, waveInvoiceId: waveInvoice.id, invoiceNumber: waveInvoice.invoiceNumber, viewUrl: waveInvoice.viewUrl, sent })
}
