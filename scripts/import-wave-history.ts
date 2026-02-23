/**
 * FINANCE-002 — Wave Historical Data Import
 * ==========================================
 * Pulls all Wave invoices and bills created before HISTORY_CUTOFF (Jan 1, 2026)
 * and seeds them as:
 *   - InvoiceRecord rows (AR history)
 *   - PaymentTransaction rows (AP history, where bills map to partner payments)
 *
 * All imported records get isHistorical=true and status='paid'.
 * Already-imported records are skipped via waveInvoiceId / waveBillId uniqueness.
 *
 * Usage:
 *   npx ts-node --project tsconfig.scripts.json scripts/import-wave-history.ts
 *   -- or --
 *   npx tsx scripts/import-wave-history.ts
 *
 * Dry-run mode (no DB writes):
 *   DRY_RUN=true npx tsx scripts/import-wave-history.ts
 *
 * Environment variables required (same as app):
 *   DATABASE_URL, DIRECT_URL, WAVE_API_URL, WAVE_API_TOKEN, WAVE_BUSINESS_ID
 */

import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

// Load .env.local from project root
const envPath = path.resolve(__dirname, '../.env.local')
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
  console.log(`[ENV] Loaded ${envPath}`)
} else {
  dotenv.config()
  console.log('[ENV] Loaded .env')
}

// ── Config ─────────────────────────────────────────────────────────────────

const HISTORY_CUTOFF = new Date('2026-01-01T00:00:00Z')
const DRY_RUN = process.env.DRY_RUN === 'true'
const WAVE_API_URL = process.env.WAVE_API_URL ?? 'https://gql.waveapps.com/graphql/public'
const WAVE_API_TOKEN = process.env.WAVE_API_TOKEN ?? ''
const WAVE_BUSINESS_ID = process.env.WAVE_BUSINESS_ID ?? ''

if (!WAVE_API_TOKEN || !WAVE_BUSINESS_ID) {
  console.error('[FATAL] WAVE_API_TOKEN or WAVE_BUSINESS_ID not set')
  process.exit(1)
}

const prisma = new PrismaClient()

// ── Wave GraphQL client (inline — avoids Next.js module resolution issues) ──

async function waveQuery<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(WAVE_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${WAVE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  })
  if (!res.ok) throw new Error(`Wave HTTP ${res.status}: ${await res.text()}`)
  const json = await res.json() as { data?: T; errors?: unknown[] }
  if (json.errors?.length) throw new Error(`Wave GQL: ${JSON.stringify(json.errors)}`)
  return json.data as T
}

// ── Wave query: list all invoices (paginated) ───────────────────────────────

interface WaveInvoiceRaw {
  id: string
  invoiceNumber: string
  status: string
  invoiceDate: string
  dueDate: string
  viewUrl: string
  pdfUrl: string | null
  total: { raw: number; currency: { code: string } }
  amountDue: { raw: number }
  amountPaid: { raw: number }
  customer: { id: string; name: string } | null
}

async function fetchAllInvoices(): Promise<WaveInvoiceRaw[]> {
  const QUERY = `
    query ListInvoices($businessId: ID!, $page: Int!, $pageSize: Int!) {
      business(id: $businessId) {
        invoices(page: $page, pageSize: $pageSize) {
          edges { node {
            id invoiceNumber status invoiceDate dueDate viewUrl pdfUrl
            total { raw currency { code } }
            amountDue { raw }
            amountPaid { raw }
            customer { id name }
          }}
        }
      }
    }
  `
  const all: WaveInvoiceRaw[] = []
  let page = 1
  const pageSize = 100

  while (true) {
    const data = await waveQuery<{
      business: { invoices: { edges: Array<{ node: WaveInvoiceRaw }> } }
    }>(QUERY, { businessId: WAVE_BUSINESS_ID, page, pageSize })

    const nodes = data.business.invoices.edges.map(e => e.node)
    all.push(...nodes)
    console.log(`  [invoices] page ${page} — fetched ${nodes.length}`)
    if (nodes.length < pageSize) break
    page++
  }

  return all
}

// ── Wave query: list all bills (paginated) ──────────────────────────────────

interface WaveBillRaw {
  id: string
  billNumber: string | null
  status: string
  invoiceDate: string
  dueDate: string | null
  total: { raw: number }
  amountDue: { raw: number }
  amountPaid: { raw: number }
  vendor: { id: string; name: string } | null
}

async function fetchAllBills(): Promise<WaveBillRaw[]> {
  // Wave's public GraphQL API does not expose bills/AP on the Business type.
  // Only AR (invoices), customers, vendors, accounts, and products are queryable.
  // Historical AP data cannot be imported from Wave — skip gracefully.
  console.log('  [bills] Wave API does not expose bills via GraphQL — skipping AP import.')
  return []
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function isBefore(dateStr: string, cutoff: Date): boolean {
  return new Date(dateStr) < cutoff
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`FINANCE-002 — Wave Historical Import`)
  console.log(`Cutoff: ${HISTORY_CUTOFF.toISOString()} (everything BEFORE this date)`)
  console.log(`Mode: ${DRY_RUN ? '🔵 DRY RUN (no writes)' : '🔴 LIVE (will write to DB)'}`)
  console.log(`${'='.repeat(60)}\n`)

  // ── INVOICES (AR) ──────────────────────────────────────────────────────────
  console.log('Fetching Wave invoices...')
  const allInvoices = await fetchAllInvoices()
  const historicalInvoices = allInvoices.filter(inv => isBefore(inv.invoiceDate, HISTORY_CUTOFF))

  console.log(`\nTotal invoices from Wave: ${allInvoices.length}`)
  console.log(`Historical (before cutoff): ${historicalInvoices.length}`)

  // Fetch existing waveInvoiceIds to skip duplicates
  const existingInvoiceIds = new Set(
    (await prisma.invoiceRecord.findMany({ select: { waveInvoiceId: true } }))
      .map(r => r.waveInvoiceId)
  )

  // Find client profiles for customer name matching (best-effort)
  const clients = await prisma.clientProfile.findMany({
    select: { id: true, businessName: true, waveCustomerId: true },
  })

  const getClientIdByCustomer = (waveCust: { id: string; name: string } | null): number | null => {
    if (!waveCust) return null
    // Prefer waveCustomerId match
    const byId = clients.find(c => c.waveCustomerId === waveCust.id)
    if (byId) return byId.id
    // Fallback: fuzzy name match
    const byName = clients.find(c =>
      c.businessName.toLowerCase().includes(waveCust.name.toLowerCase()) ||
      waveCust.name.toLowerCase().includes(c.businessName.toLowerCase())
    )
    return byName?.id ?? null
  }

  let invoiceCreated = 0
  let invoiceSkipped = 0
  let invoiceUnmatched = 0

  for (const inv of historicalInvoices) {
    if (existingInvoiceIds.has(inv.id)) {
      invoiceSkipped++
      continue
    }

    const clientId = getClientIdByCustomer(inv.customer)
    if (!clientId) {
      console.warn(`  [SKIP] Invoice ${inv.invoiceNumber} — customer not matched: ${inv.customer?.name ?? 'unknown'}`)
      invoiceUnmatched++
      continue
    }

    const invoiceDate = new Date(inv.invoiceDate)
    const dueDate = new Date(inv.dueDate ?? inv.invoiceDate)

    if (!DRY_RUN) {
      await prisma.invoiceRecord.create({
        data: {
          clientId,
          waveInvoiceId: inv.id,
          invoiceNumber: inv.invoiceNumber,
          amount: inv.total.raw,
          status: 'paid',
          issuedDate: invoiceDate,
          dueDate,
          paidDate: dueDate, // Use due date as paid approximation for historical
          paidAmount: inv.amountPaid.raw || inv.total.raw,
          waveViewUrl: inv.viewUrl,
        },
      })
    } else {
      console.log(`  [DRY] Would create InvoiceRecord: ${inv.invoiceNumber} — $${inv.total.raw} — client ${clientId}`)
    }
    invoiceCreated++
  }

  console.log(`\nInvoice import summary:`)
  console.log(`  Created: ${invoiceCreated}`)
  console.log(`  Skipped (already exists): ${invoiceSkipped}`)
  console.log(`  Unmatched (no client): ${invoiceUnmatched}`)

  // ── BILLS (AP) ─────────────────────────────────────────────────────────────
  console.log('\nFetching Wave bills...')
  const allBills = await fetchAllBills()
  const historicalBills = allBills.filter(b => isBefore(b.invoiceDate, HISTORY_CUTOFF))

  console.log(`Total bills from Wave: ${allBills.length}`)
  console.log(`Historical (before cutoff): ${historicalBills.length}`)

  // Find users by Wave vendor ID match (best-effort)
  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, contractorVendorId: true, contractorEntityName: true },
  })

  const getUserIdByVendor = (vendor: { id: string; name: string } | null): number | null => {
    if (!vendor) return null
    const byVendorId = users.find(u => u.contractorVendorId === vendor.id)
    if (byVendorId) return byVendorId.id
    const byName = users.find(u =>
      u.name.toLowerCase().includes(vendor.name.toLowerCase()) ||
      vendor.name.toLowerCase().includes(u.name.toLowerCase())
    )
    return byName?.id ?? null
  }

  // We need a clientId for PaymentTransaction — for historical bills, use a placeholder
  // approach: find the first active client for the vendor (bills in Wave don't specify a client).
  // If you want precise attribution, you can update these manually after import.
  const defaultClientId = clients[0]?.id ?? 1

  const existingBillIds = new Set(
    (await prisma.paymentTransaction.findMany({
      where: { waveBillId: { not: null } },
      select: { waveBillId: true },
    })).map(r => r.waveBillId)
  )

  let billCreated = 0
  let billSkipped = 0
  let billUnmatched = 0

  for (const bill of historicalBills) {
    if (existingBillIds.has(bill.id)) {
      billSkipped++
      continue
    }

    const userId = getUserIdByVendor(bill.vendor)
    if (!userId) {
      console.warn(`  [SKIP] Bill ${bill.billNumber ?? bill.id} — vendor not matched: ${bill.vendor?.name ?? 'unknown'}`)
      billUnmatched++
      continue
    }

    const billMonth = new Date(bill.invoiceDate)
    billMonth.setDate(1) // normalize to month start

    if (!DRY_RUN) {
      await prisma.paymentTransaction.create({
        data: {
          clientId: defaultClientId, // best-effort; update manually if needed
          userId,
          type: 'residual',          // assume residual for historical; update manually if needed
          amount: bill.total.raw,
          month: billMonth,
          status: 'paid',
          paidAt: new Date(bill.dueDate ?? bill.invoiceDate),
          waveBillId: bill.id,
          notes: `Historical import — Wave bill ${bill.billNumber ?? bill.id}`,
          isHistorical: true,
        },
      })
    } else {
      console.log(`  [DRY] Would create PaymentTransaction: bill ${bill.billNumber ?? bill.id} — $${bill.total.raw} — user ${userId}`)
    }
    billCreated++
  }

  console.log(`\nBill import summary:`)
  console.log(`  Created: ${billCreated}`)
  console.log(`  Skipped (already exists): ${billSkipped}`)
  console.log(`  Unmatched (no user): ${billUnmatched}`)

  console.log(`\n${'='.repeat(60)}`)
  console.log(DRY_RUN ? '✅ Dry run complete — no data written.' : '✅ Import complete.')
  console.log(`${'='.repeat(60)}\n`)

  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error('[FATAL]', e)
  await prisma.$disconnect()
  process.exit(1)
})
