// TODO: COVOS_ACCOUNT_NEEDED — T-002 GBP OAuth, INFRA-004
// Current: GBP OAuth under GHM GCP project (Testing mode)
// Target: COVOS Platform GCP project — submit for Google external app review
// Track: THIRD_PARTY_MIGRATION.md → T-002, INFRA-004
import { NextRequest, NextResponse } from 'next/server'
import { buildAuthUrl } from '@/lib/oauth/google'

export async function GET(
  _req: NextRequest,
  { params }: { params: { clientId: string } }
) {
  const clientId = parseInt(params.clientId)
  if (isNaN(clientId)) return NextResponse.json({ error: 'Invalid clientId' }, { status: 400 })

  const url = buildAuthUrl(clientId)
  return NextResponse.redirect(url)
}
