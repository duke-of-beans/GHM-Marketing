// POST /api/import/pm/preview
// Triggers the scrape for a connected session. Stores results in DB.
// For CSV, accepts multipart/form-data with a file field.

import { NextRequest, NextResponse } from "next/server"
import { withPermission } from "@/lib/auth/api-permissions"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { ADAPTER_REGISTRY, parsePmCsv } from "@/lib/pm-import"
import type { PmCredentials } from "@/lib/pm-import"

export async function POST(request: NextRequest) {
  const permErr = await withPermission(request, "manage_clients")
  if (permErr) return permErr

  const session = await auth()
  const userId = parseInt((session?.user as any)?.id ?? "0")
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const contentType = request.headers.get("content-type") ?? ""
  let sessionId: number
  let filename = "import"

  // ── CSV path: multipart upload ───────────────────────────────────────────
  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData()
    sessionId = parseInt(form.get("sessionId") as string ?? "0")
    const file = form.get("file") as File | null
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    if (file.size > 20 * 1024 * 1024)
      return NextResponse.json({ error: "File too large (max 20 MB)" }, { status: 400 })

    filename = file.name
    const buffer = await file.arrayBuffer()

    let preview: Awaited<ReturnType<typeof parsePmCsv>>
    try {
      preview = parsePmCsv(buffer, filename)
    } catch (e) {
      return NextResponse.json({ error: `CSV parse error: ${String(e)}` }, { status: 422 })
    }

    const updated = await prisma.pmImportSession.update({
      where: { id: sessionId },
      data: {
        status:       "preview_ready",
        previewJson:  preview as unknown as object,
        previewStats: preview.stats as object,
        errorMessage: null,
      },
    })

    return NextResponse.json({
      ok: true, sessionId, stats: preview.stats,
      preview: {
        tasks:    preview.tasks.slice(0, 50),    // first 50 for UI preview table
        contacts: preview.contacts.slice(0, 50),
        projects: preview.projects,
      },
    })
  }

  // ── API-key / OAuth path: JSON body ──────────────────────────────────────
  const body = await request.json() as { sessionId: number }
  sessionId = body.sessionId

  const importSession = await prisma.pmImportSession.findUnique({ where: { id: sessionId } })
  if (!importSession || importSession.userId !== userId)
    return NextResponse.json({ error: "Session not found" }, { status: 404 })

  // Mark as previewing so UI can show a progress state
  await prisma.pmImportSession.update({
    where: { id: sessionId }, data: { status: "previewing" },
  })

  const adapter = ADAPTER_REGISTRY[importSession.platform as keyof typeof ADAPTER_REGISTRY]
  if (!adapter)
    return NextResponse.json({ error: `No adapter for platform: ${importSession.platform}` }, { status: 400 })

  try {
    const preview = await adapter.scrape(importSession.credentialsJson as PmCredentials)

    await prisma.pmImportSession.update({
      where: { id: sessionId },
      data: {
        status:       "preview_ready",
        previewJson:  preview as unknown as object,
        previewStats: preview.stats as object,
        errorMessage: null,
      },
    })

    return NextResponse.json({
      ok: true, sessionId, stats: preview.stats,
      preview: {
        tasks:    preview.tasks.slice(0, 50),
        contacts: preview.contacts.slice(0, 50),
        projects: preview.projects,
      },
    })
  } catch (e) {
    await prisma.pmImportSession.update({
      where: { id: sessionId },
      data: { status: "error", errorMessage: String(e) },
    })
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
