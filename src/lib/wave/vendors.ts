// lib/wave/vendors.ts
// Wave vendor CRUD — maps our User (partners) to Wave vendors for 1099 tracking

import { waveQuery, waveMutation } from './client'
import { WAVE_BUSINESS_ID } from './constants'
import type { WaveVendor } from './types'

export async function createVendor(params: {
  name: string
  email?: string
}): Promise<WaveVendor> {
  const mutation = `
    mutation VendorCreate($input: VendorCreateInput!) {
      vendorCreate(input: $input) {
        didSucceed
        inputErrors { code message path }
        vendor { id name email displayId }
      }
    }
  `
  const result = await waveMutation<{ vendor: WaveVendor }>(mutation, {
    input: {
      businessId: WAVE_BUSINESS_ID,
      name: params.name,
      email: params.email ?? null,
    },
  })

  if (!result.didSucceed || !result.entity?.vendor) {
    throw new Error(`vendorCreate failed: ${JSON.stringify(result.inputErrors)}`)
  }
  return result.entity.vendor
}

export async function listVendors(): Promise<WaveVendor[]> {
  const query = `
    query ListVendors($businessId: ID!) {
      business(id: $businessId) {
        vendors(page: 1, pageSize: 200) {
          edges { node { id name email displayId } }
        }
      }
    }
  `
  const data = await waveQuery<{
    business: { vendors: { edges: Array<{ node: WaveVendor }> } }
  }>(query, { businessId: WAVE_BUSINESS_ID })
  return data.business.vendors.edges.map(e => e.node)
}
