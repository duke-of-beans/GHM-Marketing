/**
 * src/lib/providers/wave/accounting.ts
 *
 * Wave implementation of AccountingProvider.
 * Delegates to src/lib/wave/* — does not duplicate logic, only normalizes output.
 */

import {
  createInvoice as waveCreateInvoice,
  sendInvoice as waveSendInvoice,
  getInvoice as waveGetInvoice,
  listInvoicesForCustomer as waveListInvoices,
} from '@/lib/wave/invoices'
import { createBill as waveCreateBill } from '@/lib/wave/bills'
import type {
  AccountingProvider,
  InvoiceLineItem,
  NormalizedInvoice,
  NormalizedBill,
} from '../types'
import type { WaveInvoice, WaveBill } from '@/lib/wave/types'

function normalizeStatus(raw: string): NormalizedInvoice['status'] {
  const map: Record<string, NormalizedInvoice['status']> = {
    DRAFT:     'draft',
    SENT:      'sent',
    VIEWED:    'viewed',
    PAID:      'paid',
    OVERDUE:   'overdue',
    CANCELLED: 'cancelled',
  }
  return map[raw.toUpperCase()] ?? 'draft'
}

function normalizeInvoice(w: WaveInvoice): NormalizedInvoice {
  return {
    id:             w.id,
    invoiceNumber:  w.invoiceNumber,
    status:         normalizeStatus(w.status),
    totalRaw:       w.total.raw,
    amountDueRaw:   w.amountDue.raw,
    amountPaidRaw:  w.amountPaid.raw,
    currency:       w.total.currency.code,
    invoiceDate:    w.invoiceDate,
    dueDate:        w.dueDate,
    viewUrl:        w.viewUrl,
    pdfUrl:         w.pdfUrl,
    customerId:     w.customer?.id ?? null,
  }
}

function normalizeBill(b: WaveBill): NormalizedBill {
  return {
    id:           b.id,
    billNumber:   b.billNumber,
    status:       b.status,
    totalRaw:     b.total.raw,
    amountDueRaw: b.amountDue.raw,
    invoiceDate:  b.invoiceDate,
    dueDate:      b.dueDate,
    vendorId:     b.vendor?.id ?? null,
  }
}

export class WaveAccountingProvider implements AccountingProvider {
  readonly name = 'wave'

  async createInvoice(params: {
    externalCustomerId: string
    lineItems: InvoiceLineItem[]
    invoiceDate: string
    dueDate: string
    memo?: string
  }): Promise<NormalizedInvoice> {
    const invoice = await waveCreateInvoice({
      waveCustomerId: params.externalCustomerId,
      lineItems: params.lineItems,
      invoiceDate: params.invoiceDate,
      dueDate: params.dueDate,
      memo: params.memo,
    })
    return normalizeInvoice(invoice)
  }

  async sendInvoice(externalInvoiceId: string): Promise<boolean> {
    return waveSendInvoice(externalInvoiceId)
  }

  async getInvoice(externalInvoiceId: string): Promise<NormalizedInvoice | null> {
    const invoice = await waveGetInvoice(externalInvoiceId)
    return invoice ? normalizeInvoice(invoice) : null
  }

  async listInvoicesForCustomer(
    externalCustomerId: string,
    page = 1,
    pageSize = 50,
  ): Promise<NormalizedInvoice[]> {
    const invoices = await waveListInvoices(externalCustomerId, page, pageSize)
    return invoices.map(normalizeInvoice)
  }

  async createBill(params: {
    externalVendorId: string
    amount: number
    description: string
    invoiceDate: string
    dueDate?: string
    billNumber?: string
  }): Promise<NormalizedBill> {
    const bill = await waveCreateBill({
      waveVendorId: params.externalVendorId,
      amount: params.amount,
      description: params.description,
      invoiceDate: params.invoiceDate,
      dueDate: params.dueDate,
      billNumber: params.billNumber,
    })
    return normalizeBill(bill)
  }
}
