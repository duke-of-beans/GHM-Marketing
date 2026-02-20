import { NextRequest, NextResponse } from 'next/server'
import { buildAuthUrl } from '@/lib/oauth/google-ads'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params
  const id = parseInt(clientId)
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid clientId' }, { status: 400 })

  const url = buildAuthUrl(id)
  return NextResponse.redirect(url)
}
