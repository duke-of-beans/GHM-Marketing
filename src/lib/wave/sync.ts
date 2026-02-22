// lib/wave/sync.ts
// Bidirectional sync utilities — keep our DB in sync with Wave state

import { prisma } from '@/lib/prisma'
import { createCustomer, getCustomer } from './customers'
import { createVendor } from './vendors'
import { getInvoice } from './invoices'
import { INVOICE_STATUS } from './constants'

/**
 * Ensure a ClientProfile has a Wave customer ID.
 * Creates one if it doesn't exist yet.
 */
export async function ensureWaveCustomer(clientId: number): Promise<string> {
  const client = await prisma.clientProfile.findUniqueOrThrow({
    where: { id: clientId },
    include: { lead: true },
  })

  if (client.waveCustomerId) return client.waveCustomerId

  const customer = await createCustomer({
    name: client.businessName,
    email: client.lead.email ?? undefined,
    phone: client.lead.phone ?? undefined,
  })

  await prisma.clientProfile.update({
    where: { id: clientId },
    data: { waveCustomerId: customer.id },
  })

  return customer.id
}

/**
 * Ensure a User (partner) has a Wave vendor ID.
 * Creates one if it doesn't exist yet.
 */
export async function ensureWaveVendor(userId: number): Promise<string> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })

  if (user.contractorVendorId) return user.contractorVendorId

  const vendor = await createVendor({
    name: user.contractorEntityName ?? user.name,
    email: user.contractorEmail ?? user.email,
  })

  await prisma.user.update({
    where: { id: userId },
    data: { contractorVendorId: vendor.id },
  })

  return vendor.id
}

/**
 * Sync a Wave invoice's current status back into our InvoiceRecord.
 */
export async function syncInvoiceStatus(waveInvoiceId: string): Promise<void> {
  const invoice = await getInvoice(waveInvoiceId)
  if (!invoice) return

  const status = invoice.status.toLowerCase()
  const isPaid = invoice.status === INVOICE_STATUS.PAID

  await prisma.invoiceRecord.updateMany({
    where: { waveInvoiceId },
    data: {
      status,
      paidDate: isPaid && invoice.amountPaid.raw > 0 ? new Date() : undefined,
      paidAmount: isPaid ? invoice.amountPaid.raw : undefined,
    },
  })
}
