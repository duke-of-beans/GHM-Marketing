// POST /api/webhooks/wave
// Handles inbound Wave webhook events
// Primary trigger for commission payment generation (replaces cron as primary)
//
// Security: Validates HMAC-SHA256 signature from Wave before processing
// Idempotency: Deduplicates on WebhookEvent.externalId — safe to receive retries
//
// Supported events:
//   invoice.paid → triggers commission/residual/master_fee generation for that client

import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { prisma } from '@/lib/db'
import { WAVE_WEBHOOK_SECRET } from '@/lib/wave/constants'
import { generateClientMonthlyPayments } from '@/lib/payments/calculations'
import { getFirstDayOfMonth } from '@/lib/payments/calculations'
import { startOfMonth } from 'date-fns'

// ── Signature validation ──────────────────────────────────────────────────────

function validateWaveSignature(payload: string, signature: string | null): boolean {
  if (!signature || !WAVE_WEBHOOK_SECRET) return false
  try {
    const expected = createHmac('sha256', WAVE_WEBHOOK_SECRET)
      .update(payload, 'utf8')
      .digest('hex')
    const expectedBuf = Buffer.from(`sha256=${expected}`, 'utf8')
    const receivedBuf = Buffer.from(signature, 'utf8')
    if (expectedBuf.length !== receivedBuf.length) return false
    return timingSafeEqual(expectedBuf, receivedBuf)
  } catch {
    return false
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-wave-signature')

  // Validate signature (skip in development if secret not set)
  if (process.env.NODE_ENV === 'production' && !validateWaveSignature(rawBody, signature)) {
    console.error('[webhook/wave] Invalid signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: WaveWebhookPayload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const eventId = payload.id ?? payload.data?.id ?? `${payload.eventType}-${Date.now()}`
  const eventType = payload.eventType ?? payload.event ?? 'unknown'

  // Idempotency check — log the event first, skip if already seen
  const existing = await prisma.webhookEvent.findUnique({
    where: { source_externalId: { source: 'wave', externalId: eventId } },
  })

  if (existing?.status === 'processed') {
    return NextResponse.json({ ok: true, skipped: true, reason: 'already_processed' })
  }

  // Upsert webhook event record
  const webhookEvent = await prisma.webhookEvent.upsert({
    where: { source_externalId: { source: 'wave', externalId: eventId } },
    create: {
      source: 'wave',
      eventType,
      externalId: eventId,
      rawPayload: payload as object,
      status: 'received',
    },
    update: {
      status: 'received',
      error: null,
    },
  })

  try {
    let result: object = { skipped: true }

    if (eventType === 'invoice.paid' || eventType === 'INVOICE_PAID') {
      result = await handleInvoicePaid(payload, eventId)
    }
    // Future: handle invoice.created, invoice.overdue, etc.

    await prisma.webhookEvent.update({
      where: { id: webhookEvent.id },
      data: { status: 'processed', processedAt: new Date() },
    })

    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    console.error(`[webhook/wave] Processing failed for event ${eventId}:`, errorMsg)

    await prisma.webhookEvent.update({
      where: { id: webhookEvent.id },
      data: { status: 'failed', error: errorMsg },
    })

    // Return 200 to prevent Wave from retrying permanently on bugs
    // Wave will retry on 5xx — we use our own replay mechanism for recoverable failures
    return NextResponse.json({ ok: false, error: errorMsg }, { status: 200 })
  }
}

// ── invoice.paid handler ──────────────────────────────────────────────────────

async function handleInvoicePaid(
  payload: WaveWebhookPayload,
  eventId: string
): Promise<object> {
  // Extract Wave customer ID from payload
  // Wave sends: payload.data.invoice.customer.id (v2) or payload.invoice.customerId (v1)
  const waveCustomerId =
    payload.data?.invoice?.customer?.id ??
    payload.invoice?.customerId ??
    payload.data?.customerId ??
    null

  if (!waveCustomerId) {
    console.warn(`[webhook/wave] invoice.paid event ${eventId} has no customer ID — skipping`)
    return { skipped: true, reason: 'no_customer_id' }
  }

  // Find the client
  const client = await prisma.clientProfile.findFirst({
    where: { waveCustomerId },
    include: {
      salesRep: {
        include: { compensationConfig: true },
      },
      masterManager: {
        include: { compensationConfig: true },
      },
      compensationOverrides: true,
    },
  })

  if (!client) {
    console.warn(`[webhook/wave] No client found for Wave customer ${waveCustomerId}`)
    return { skipped: true, reason: 'no_client_match', waveCustomerId }
  }

  if (client.status !== 'active') {
    return { skipped: true, reason: 'client_not_active', clientId: client.id }
  }

  const currentMonth = startOfMonth(new Date())

  // Build calculation inputs
  const salesRepConfig = client.salesRep?.compensationConfig ?? null
  const masterConfig = client.masterManager?.compensationConfig ?? null
  const salesRepOverride = client.salesRepId
    ? (client.compensationOverrides.find(o => o.userId === client.salesRepId) ?? null)
    : null

  const clientForCalc = {
    id: client.id,
    onboardedMonth: client.onboardedMonth,
    retainerAmount: client.retainerAmount,
    status: client.status,
    salesRepId: client.salesRepId,
    masterManagerId: client.masterManagerId,
    lockedResidualAmount: client.lockedResidualAmount ?? null,
    closedInMonth: client.closedInMonth ?? null,
  }

  const paymentsToGenerate = generateClientMonthlyPayments(
    clientForCalc,
    salesRepConfig,
    salesRepOverride,
    masterConfig,
    currentMonth,
    false // not a new client — commissions already paid at close
  )

  if (paymentsToGenerate.length === 0) {
    return { clientId: client.id, generated: 0, reason: 'no_payments_due' }
  }

  // Create pending transactions (idempotent — skip if already exists for this month + client + user + type)
  let created = 0
  let skipped = 0

  for (const p of paymentsToGenerate) {
    const exists = await prisma.paymentTransaction.findFirst({
      where: {
        clientId: p.clientId,
        userId: p.userId,
        type: p.type,
        month: currentMonth,
        sourceEventId: eventId,
      },
    })

    if (exists) {
      skipped++
      continue
    }

    // Also check if a transaction already exists for this month regardless of source
    // (safety net cron may have already run before the webhook)
    const alreadyThisMonth = await prisma.paymentTransaction.findFirst({
      where: {
        clientId: p.clientId,
        userId: p.userId,
        type: p.type,
        month: currentMonth,
      },
    })

    if (alreadyThisMonth) {
      skipped++
      continue
    }

    await prisma.paymentTransaction.create({
      data: {
        clientId: p.clientId,
        userId: p.userId,
        type: p.type,
        amount: p.amount,
        month: currentMonth,
        status: 'pending',
        sourceEventId: eventId,
        notes: `Auto-generated from Wave invoice.paid webhook (${eventId})`,
      },
    })
    created++
  }

  // Update client payment status
  await prisma.clientProfile.update({
    where: { id: client.id },
    data: {
      lastPaymentDate: new Date(),
      paymentStatus: 'current',
    },
  })

  console.log(`[webhook/wave] invoice.paid: client ${client.id} (${client.businessName}) — created ${created} transactions, skipped ${skipped}`)

  return {
    clientId: client.id,
    businessName: client.businessName,
    generated: created,
    skipped,
    month: currentMonth.toISOString().slice(0, 7),
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface WaveWebhookPayload {
  id?: string
  eventType?: string
  event?: string
  data?: {
    id?: string
    customerId?: string
    invoice?: {
      id?: string
      customer?: {
        id?: string
        name?: string
      }
      status?: string
      amountDue?: { raw?: number; currency?: string }
      amountPaid?: { raw?: number; currency?: string }
    }
  }
  // Legacy v1 shape
  invoice?: {
    id?: string
    customerId?: string
    status?: string
  }
  [key: string]: unknown
}
