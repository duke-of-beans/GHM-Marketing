// POST /api/import/pm/connect
// Creates or retrieves a PmImportSession and validates credentials.
// For OAuth platforms (Basecamp) the session is created after OAuth callback;
// for API-key platforms this is the first step.

import { NextRequest, NextResponse } from "next/server"
import { withPermission } from "@/lib/auth/api-permissions"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { ADAPTER_REGISTRY } from "@/lib/pm-import"
import type { PmPlatform, PmCredentials } from "@/lib/pm-import"

export async function POST(request: NextRequest) {
  const permErr = await withPermission(request, "manage_clients")
  if (permErr) return permErr

  const session = await auth()
  const userId = parseInt((session?.user as any)?.id ?? "0")
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json() as {
    platform: PmPlatform
    credentials: PmCredentials
    sessionId?: number   // pass existing session ID to reconnect
  }

  const { platform, credentials } = body

  if (!ADAPTER_REGISTRY[platform]) {
    return NextResponse.json({ error: `Unknown platform: ${platform}` }, { status: 400 })
  }

  // Test the connection before persisting
  const adapter = ADAPTER_REGISTRY[platform]
  const test = await adapter.testConnection(credentials)
  if (!test.ok) {
    return NextResponse.json({ error: test.error ?? "Connection failed" }, { status: 422 })
  }

  // Upsert session
  const importSession = body.sessionId
    ? await prisma.pmImportSession.update({
        where: { id: body.sessionId },
        data: {
          status:          "connected",
          credentialsJson: credentials as object,
          errorMessage:    null,
        },
      })
    : await prisma.pmImportSession.create({
        data: {
          userId,
          platform,
          status:          "connected",
          credentialsJson: credentials as object,
        },
      })

  return NextResponse.json({ ok: true, sessionId: importSession.id })
}
