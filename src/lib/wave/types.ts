// lib/wave/types.ts
// TypeScript types for Wave GraphQL API responses

export interface WaveBusiness {
  id: string
  name: string
  currency: { code: string }
}

export interface WaveCustomer {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: {
    city: string | null
    province: { name: string | null } | null
    country: { code: string } | null
  } | null
}

export interface WaveProduct {
  id: string
  name: string
  unitPrice: number | null
}

export interface WaveInvoice {
  id: string
  invoiceNumber: string
  status: string // DRAFT | SENT | VIEWED | PAID | OVERDUE | CANCELLED
  title: string
  subhead: string | null
  memo: string | null
  invoiceDate: string // ISO date
  dueDate: string    // ISO date
  pdfUrl: string | null
  viewUrl: string
  total: { raw: number; value: string; currency: { code: string } }
  amountDue: { raw: number; value: string }
  amountPaid: { raw: number; value: string }
  customer: { id: string; name: string } | null
  items: {
    edges: Array<{
      node: {
        product: { id: string; name: string } | null
        description: string | null
        quantity: number
        unitPrice: number
        subtotal: { raw: number; value: string }
      }
    }>
  }
}

export interface WaveVendor {
  id: string
  name: string
  email: string | null
  displayId: string | null
}

export interface WaveBill {
  id: string
  billNumber: string | null
  status: string
  dueDate: string | null
  invoiceDate: string
  total: { raw: number; value: string }
  amountDue: { raw: number; value: string }
  vendor: { id: string; name: string } | null
}

export interface WaveMutationResult<T> {
  didSucceed: boolean
  inputErrors: Array<{ code: string; message: string; path: string[] }>
  entity: T | null
}

export interface WaveLineItem {
  productId: string
  description?: string
  quantity: number
  unitPrice: number
}
