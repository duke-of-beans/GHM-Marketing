// POST /api/import/pm/rollback
// Soft-deletes (actually hard-deletes — tasks have no soft-delete) all ClientTask
// records created by a specific PmImportSession. Only available within 24 hours
// of the commit and only to the user who ran the import.

import { NextRequest, NextResponse } from "next/server"
import { withPermission } from "@/lib/auth/api-permissions"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function POST(request: NextRequest) {
  const permErr = await withPermission(request, "manage_clients")
  if (permErr) return permErr

  const session = await auth()
  const userId = parseInt((session?.user as any)?.id ?? "0")
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json() as { sessionId: number }
  if (!body.sessionId)
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 })

  const importSession = await prisma.pmImportSession.findUnique({
    where: { id: body.sessionId },
  })

  if (!importSession || importSession.userId !== userId)
    return NextResponse.json({ error: "Session not found" }, { status: 404 })

  if (importSession.status !== "complete")
    return NextResponse.json({ error: "Only completed imports can be rolled back" }, { status: 422 })

  // 24-hour window check
  const hoursSinceCommit = (Date.now() - importSession.updatedAt.getTime()) / (1000 * 60 * 60)
  if (hoursSinceCommit > 24)
    return NextResponse.json({ error: "Rollback window has expired (24 hours)" }, { status: 422 })

  // Delete all tasks created by this import session
  const { count } = await prisma.clientTask.deleteMany({
    where: { pmImportSessionId: body.sessionId },
  })

  // Mark session as rolled back
  await prisma.pmImportSession.update({
    where: { id: body.sessionId },
    data: {
      status: "rolled_back",
      commitStats: {
        ...(importSession.commitStats as object ?? {}),
        rolledBackAt: new Date().toISOString(),
        tasksDeleted: count,
      } as object,
    },
  })

  return NextResponse.json({ ok: true, tasksDeleted: count })
}
