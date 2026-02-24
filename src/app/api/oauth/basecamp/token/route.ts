// GET /api/oauth/basecamp/token
// Returns the stored Basecamp OAuth token for the PM import wizard.
// Admin-only — credentials are only ever read server-side and never exposed beyond this call.

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 })
  }

  try {
    const setting = await prisma.appSetting.findUnique({ where: { key: "basecamp_token" } })
    if (!setting?.value) {
      return NextResponse.json({ error: "No Basecamp token found. Connect Basecamp in Settings → Integrations first." }, { status: 404 })
    }

    const token = JSON.parse(setting.value) as {
      access_token:  string
      refresh_token: string
      expires_at:    number
      account_id:    string
      account_name:  string
    }

    // Check expiry
    if (token.expires_at && token.expires_at < Date.now()) {
      return NextResponse.json({ error: "Basecamp token has expired. Please reconnect in Settings → Integrations." }, { status: 401 })
    }

    return NextResponse.json({
      ok:           true,
      accessToken:  token.access_token,
      refreshToken: token.refresh_token,
      accountId:    token.account_id,
      accountName:  token.account_name,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
