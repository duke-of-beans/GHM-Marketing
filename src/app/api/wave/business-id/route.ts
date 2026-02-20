// GET /api/wave/business-id
// One-time utility: fetch our Wave business ID
// Run once, copy ID into .env.local as WAVE_BUSINESS_ID, then delete this route

import { NextRequest, NextResponse } from 'next/server'
import { withPermission } from '@/lib/auth/api-permissions'
import { waveQuery } from '@/lib/wave/client'

export async function GET(req: NextRequest) {
  const permissionError = await withPermission(req, 'manage_settings')
  if (permissionError) return permissionError

  const query = `
    query {
      businesses {
        edges {
          node { id name currency { code } }
        }
      }
    }
  `

  const data = await waveQuery<{
    businesses: { edges: Array<{ node: { id: string; name: string; currency: { code: string } } }> }
  }>(query)

  return NextResponse.json({
    businesses: data.businesses.edges.map(e => e.node),
    instructions: 'Copy the id of your GHM business into WAVE_BUSINESS_ID in .env.local',
  })
}
