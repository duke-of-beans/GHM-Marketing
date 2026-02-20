// lib/wave/customers.ts
// Wave customer CRUD — maps our ClientProfile to Wave customers

import { waveQuery, waveMutation } from './client'
import { WAVE_BUSINESS_ID } from './constants'
import type { WaveCustomer, WaveMutationResult } from './types'

const CUSTOMER_FRAGMENT = `
  fragment CustomerFields on Customer {
    id
    name
    email
    phone
    address {
      city
      province { name }
      country { code }
    }
  }
`

export async function createCustomer(params: {
  name: string
  email?: string
  phone?: string
}): Promise<WaveCustomer> {
  const mutation = `
    ${CUSTOMER_FRAGMENT}
    mutation CustomerCreate($input: CustomerCreateInput!) {
      customerCreate(input: $input) {
        didSucceed
        inputErrors { code message path }
        customer { ...CustomerFields }
      }
    }
  `
  const result = await waveMutation<{ customer: WaveCustomer }>(mutation, {
    input: {
      businessId: WAVE_BUSINESS_ID,
      name: params.name,
      email: params.email ?? null,
      phone: params.phone ?? null,
    },
  })

  if (!result.didSucceed || !result.entity?.customer) {
    throw new Error(`customerCreate failed: ${JSON.stringify(result.inputErrors)}`)
  }
  return result.entity.customer
}

export async function getCustomer(customerId: string): Promise<WaveCustomer | null> {
  const query = `
    ${CUSTOMER_FRAGMENT}
    query GetCustomer($businessId: ID!, $customerId: ID!) {
      business(id: $businessId) {
        customer(id: $customerId) { ...CustomerFields }
      }
    }
  `
  const data = await waveQuery<{ business: { customer: WaveCustomer | null } }>(query, {
    businessId: WAVE_BUSINESS_ID,
    customerId,
  })
  return data.business.customer
}

export async function listCustomers(): Promise<WaveCustomer[]> {
  const query = `
    ${CUSTOMER_FRAGMENT}
    query ListCustomers($businessId: ID!) {
      business(id: $businessId) {
        customers(page: 1, pageSize: 200) {
          edges { node { ...CustomerFields } }
        }
      }
    }
  `
  const data = await waveQuery<{
    business: { customers: { edges: Array<{ node: WaveCustomer }> } }
  }>(query, { businessId: WAVE_BUSINESS_ID })
  return data.business.customers.edges.map(e => e.node)
}
