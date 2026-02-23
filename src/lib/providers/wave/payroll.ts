/**
 * src/lib/providers/wave/payroll.ts
 *
 * Wave implementation of PayrollProvider.
 * Wave handles both AP bills and vendor (contractor) management.
 */

import { createVendor as waveCreateVendor, listVendors as waveListVendors } from '@/lib/wave/vendors'
import { createBill as waveCreateBill } from '@/lib/wave/bills'
import type { PayrollProvider, NormalizedVendor } from '../types'

export class WavePayrollProvider implements PayrollProvider {
  readonly name = 'wave'

  async createVendor(params: { name: string; email?: string }): Promise<NormalizedVendor> {
    const vendor = await waveCreateVendor(params)
    return {
      id:    vendor.id,
      name:  vendor.name,
      email: vendor.email,
    }
  }

  async listVendors(): Promise<NormalizedVendor[]> {
    const vendors = await waveListVendors()
    return vendors.map((v) => ({ id: v.id, name: v.name, email: v.email }))
  }

  async createPayment(params: {
    externalVendorId: string
    amount: number
    description: string
    paymentDate: string
    referenceId?: string
  }): Promise<{ id: string; status: string }> {
    const bill = await waveCreateBill({
      waveVendorId: params.externalVendorId,
      amount:       params.amount,
      description:  params.description,
      invoiceDate:  params.paymentDate,
      billNumber:   params.referenceId,
    })
    return { id: bill.id, status: bill.status }
  }
}
