// GET /api/auth/basecamp — redirects admin to Basecamp OAuth consent screen
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getAuthorizationUrl } from '@/lib/basecamp/client'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }
  return NextResponse.redirect(getAuthorizationUrl())
}
