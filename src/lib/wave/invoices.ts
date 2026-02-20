// lib/wave/invoices.ts
// Invoice creation, sending, and querying

import { waveQuery, waveMutation } from './client'
import { WAVE_BUSINESS_ID } from './constants'
import type { WaveInvoice, WaveLineItem } from './types'

const INVOICE_FRAGMENT = `
  fragment InvoiceFields on Invoice {
    id
    invoiceNumber
    status
    invoiceDate
    dueDate
    viewUrl
    pdfUrl
    total { raw value currency { code } }
    amountDue { raw value }
    amountPaid { raw value }
    customer { id name }
    items {
      edges {
        node {
          product { id name }
          description
          quantity
          unitPrice
          subtotal { raw value }
        }
      }
    }
  }
`

export async function createInvoice(params: {
  waveCustomerId: string
  lineItems: WaveLineItem[]
  invoiceDate: string  // ISO date string YYYY-MM-DD
  dueDate: string
  memo?: string
}): Promise<WaveInvoice> {
  const mutation = `
    ${INVOICE_FRAGMENT}
    mutation InvoiceCreate($input: InvoiceCreateInput!) {
      invoiceCreate(input: $input) {
        didSucceed
        inputErrors { code message path }
        invoice { ...InvoiceFields }
      }
    }
  `
  const result = await waveMutation<{ invoice: WaveInvoice }>(mutation, {
    input: {
      businessId: WAVE_BUSINESS_ID,
      customerId: params.waveCustomerId,
      invoiceDate: params.invoiceDate,
      dueDate: params.dueDate,
      memo: params.memo ?? null,
      items: params.lineItems.map(item => ({
        productId: item.productId,
        description: item.description ?? null,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    },
  })

  if (!result.didSucceed || !result.entity?.invoice) {
    throw new Error(`invoiceCreate failed: ${JSON.stringify(result.inputErrors)}`)
  }
  return result.entity.invoice
}

export async function sendInvoice(waveInvoiceId: string): Promise<boolean> {
  const mutation = `
    mutation InvoiceSend($input: InvoiceSendInput!) {
      invoiceSend(input: $input) {
        didSucceed
        inputErrors { code message path }
      }
    }
  `
  const result = await waveMutation<null>(mutation, {
    input: { invoiceId: waveInvoiceId, sendMethod: 'EMAIL' },
  })
  return result.didSucceed
}

export async function getInvoice(waveInvoiceId: string): Promise<WaveInvoice | null> {
  const query = `
    ${INVOICE_FRAGMENT}
    query GetInvoice($businessId: ID!, $invoiceId: ID!) {
      business(id: $businessId) {
        invoice(id: $invoiceId) { ...InvoiceFields }
      }
    }
  `
  const data = await waveQuery<{ business: { invoice: WaveInvoice | null } }>(query, {
    businessId: WAVE_BUSINESS_ID,
    invoiceId: waveInvoiceId,
  })
  return data.business.invoice
}

export async function listInvoicesForCustomer(
  waveCustomerId: string,
  page = 1,
  pageSize = 50
): Promise<WaveInvoice[]> {
  const query = `
    ${INVOICE_FRAGMENT}
    query ListInvoices($businessId: ID!, $customerId: ID, $page: Int!, $pageSize: Int!) {
      business(id: $businessId) {
        invoices(customerId: $customerId, page: $page, pageSize: $pageSize) {
          edges { node { ...InvoiceFields } }
        }
      }
    }
  `
  const data = await waveQuery<{
    business: { invoices: { edges: Array<{ node: WaveInvoice }> } }
  }>(query, { businessId: WAVE_BUSINESS_ID, customerId: waveCustomerId, page, pageSize })
  return data.business.invoices.edges.map(e => e.node)
}
