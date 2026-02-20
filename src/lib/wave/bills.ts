// lib/wave/bills.ts
// Bill creation for partner contractor payments

import { waveQuery, waveMutation } from './client'
import { WAVE_BUSINESS_ID } from './constants'
import type { WaveBill } from './types'

export async function createBill(params: {
  waveVendorId: string
  amount: number
  description: string
  invoiceDate: string  // YYYY-MM-DD
  dueDate?: string
  billNumber?: string
}): Promise<WaveBill> {
  const mutation = `
    mutation BillCreate($input: BillCreateInput!) {
      billCreate(input: $input) {
        didSucceed
        inputErrors { code message path }
        bill {
          id
          billNumber
          status
          invoiceDate
          dueDate
          total { raw value }
          amountDue { raw value }
          vendor { id name }
        }
      }
    }
  `
  const result = await waveMutation<{ bill: WaveBill }>(mutation, {
    input: {
      businessId: WAVE_BUSINESS_ID,
      vendorId: params.waveVendorId,
      invoiceDate: params.invoiceDate,
      dueDate: params.dueDate ?? params.invoiceDate,
      billNumber: params.billNumber ?? null,
      items: [{
        description: params.description,
        quantity: 1,
        unitPrice: params.amount,
      }],
    },
  })

  if (!result.didSucceed || !result.entity?.bill) {
    throw new Error(`billCreate failed: ${JSON.stringify(result.inputErrors)}`)
  }
  return result.entity.bill
}

export async function listBills(page = 1, pageSize = 50): Promise<WaveBill[]> {
  const query = `
    query ListBills($businessId: ID!, $page: Int!, $pageSize: Int!) {
      business(id: $businessId) {
        bills(page: $page, pageSize: $pageSize) {
          edges {
            node {
              id billNumber status invoiceDate dueDate
              total { raw value }
              amountDue { raw value }
              vendor { id name }
            }
          }
        }
      }
    }
  `
  const data = await waveQuery<{
    business: { bills: { edges: Array<{ node: WaveBill }> } }
  }>(query, { businessId: WAVE_BUSINESS_ID, page, pageSize })
  return data.business.bills.edges.map(e => e.node)
}
