// POST /api/wave/webhook
// Receives Wave payment events and updates our DB accordingly
// Events: invoice.payment.created, invoice.viewed, invoice.sent, bill.payment.created

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyWebhookSignature, parseWebhookPayload } from '@/lib/wave/webhooks'
import { sendPushToUser } from '@/lib/push'

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-waveapps-signature')

  // Verify signature if secret is configured
  if (process.env.WAVE_WEBHOOK_SECRET) {
    const valid = await verifyWebhookSignature(rawBody, signature)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  }

  const payload = parseWebhookPayload(rawBody)
  if (!payload) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const { event, data } = payload

  try {
    switch (event) {
      case 'invoice.payment.created':
        await handleInvoicePayment(data)
        break
      case 'invoice.viewed':
        await handleInvoiceViewed(data)
        break
      case 'invoice.sent':
        await handleInvoiceSent(data)
        break
      case 'bill.payment.created':
        await handleBillPayment(data)
        break
      default:
        // Unknown event — log and ignore
        console.log(`[Wave webhook] Unhandled event: ${event}`)
    }
  } catch (err) {
    console.error(`[Wave webhook] Error handling ${event}:`, err)
    // Return 200 so Wave doesn't retry — log the error separately
  }

  return NextResponse.json({ received: true })
}

async function handleInvoicePayment(data: Record<string, unknown>) {
  const waveInvoiceId = (data.invoice as { id: string })?.id
  if (!waveInvoiceId) return

  const record = await prisma.invoiceRecord.findUnique({ where: { waveInvoiceId } })
  if (!record) return

  const paidAmount = (data.amount as { raw: number })?.raw ?? Number(record.amount)

  await prisma.invoiceRecord.update({
    where: { waveInvoiceId },
    data: {
      status: 'paid',
      paidDate: new Date(),
      paidAmount,
      paymentMethod: (data.paymentMethod as string) ?? null,
    },
  })

  await prisma.clientProfile.update({
    where: { id: record.clientId },
    data: {
      lastPaymentDate: new Date(),
      paymentStatus: 'current',
    },
  })

  // Notify admins
  const admins = await prisma.user.findMany({
    where: { role: { in: ['admin', 'master'] }, isActive: true },
    select: { id: true },
  })
  const client = await prisma.clientProfile.findUnique({
    where: { id: record.clientId },
    select: { businessName: true },
  })
  for (const admin of admins) {
    await sendPushToUser(admin.id, {
      title: '💰 Payment received',
      body: `${client?.businessName} paid invoice ${record.invoiceNumber ?? waveInvoiceId}`,
    }).catch(() => {})
  }
}

async function handleInvoiceViewed(data: Record<string, unknown>) {
  const waveInvoiceId = (data.invoice as { id: string })?.id
  if (!waveInvoiceId) return

  await prisma.invoiceRecord.updateMany({
    where: { waveInvoiceId, status: 'sent' },
    data: { status: 'viewed' },
  })
}

async function handleInvoiceSent(data: Record<string, unknown>) {
  const waveInvoiceId = (data.invoice as { id: string })?.id
  if (!waveInvoiceId) return

  await prisma.invoiceRecord.updateMany({
    where: { waveInvoiceId, status: 'draft' },
    data: { status: 'sent' },
  })
}

async function handleBillPayment(data: Record<string, unknown>) {
  const waveBillId = (data.bill as { id: string })?.id
  if (!waveBillId) return

  await prisma.paymentTransaction.updateMany({
    where: { waveBillId },
    data: { status: 'paid', paidAt: new Date() },
  })
}
