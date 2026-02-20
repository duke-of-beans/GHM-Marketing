// GET /api/wave/settings/products
// Fetches Wave products/services for the business — used to select the SEO retainer product

import { NextRequest, NextResponse } from 'next/server'
import { withPermission } from '@/lib/auth/api-permissions'
import { waveQuery } from '@/lib/wave/client'
import { WAVE_BUSINESS_ID } from '@/lib/wave/constants'

const PRODUCTS_QUERY = `
  query GetProducts($businessId: ID!) {
    business(id: $businessId) {
      products(page: 1, pageSize: 50) {
        edges {
          node {
            id
            name
            unitPrice
            isArchived
          }
        }
      }
    }
  }
`

interface ProductNode {
  id: string
  name: string
  unitPrice: number
  isArchived: boolean
}

export async function GET(req: NextRequest) {
  const permissionError = await withPermission(req, 'manage_settings')
  if (permissionError) return permissionError

  if (!WAVE_BUSINESS_ID) {
    return NextResponse.json({ error: 'WAVE_BUSINESS_ID not configured' }, { status: 400 })
  }

  try {
    const data = await waveQuery<{
      business: {
        products: { edges: Array<{ node: ProductNode }> }
      } | null
    }>(PRODUCTS_QUERY, { businessId: WAVE_BUSINESS_ID })

    const products = (data.business?.products.edges ?? [])
      .map(e => e.node)
      .filter(p => !p.isArchived)
      .map(p => ({ id: p.id, name: p.name, unitPrice: p.unitPrice }))

    return NextResponse.json({ products })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Wave API error' },
      { status: 500 }
    )
  }
}
