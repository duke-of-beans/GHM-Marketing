// GET /api/auth/basecamp — redirects admin to Basecamp OAuth consent screen
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { getAuthorizationUrl } from '@/lib/basecamp/client'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }
  return NextResponse.redirect(getAuthorizationUrl())
}
