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
