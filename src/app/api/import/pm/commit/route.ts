// POST /api/import/pm/commit
// Writes previewed tasks and contacts to the GHM database.
// Matches assignees to existing Users by email/name (best-effort).
// Enforces field length limits, detects duplicates, stores session ID for rollback.

import { NextRequest, NextResponse } from "next/server"
import { withPermission } from "@/lib/auth/api-permissions"
import { prisma } from "@/lib/db"
import { Prisma } from "@prisma/client"
import { auth } from "@/lib/auth"
import type { ImportedTask, ImportedContact } from "@/lib/pm-import"

const MAX_TITLE_LEN       = 255
const MAX_DESCRIPTION_LEN = 5000

export async function POST(request: NextRequest) {
  const permErr = await withPermission(request, "manage_clients")
  if (permErr) return permErr

  const session = await auth()
  const userId = parseInt((session?.user as any)?.id ?? "0")
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json() as {
    sessionId:          number
    selectedTaskIds?:   string[]
    clientId:           number
    categoryOverride?:  string
    duplicateStrategy?: "skip" | "overwrite"  // default: "skip"
  }

  if (!body.clientId)
    return NextResponse.json({ error: "clientId is required — tasks must be linked to a client" }, { status: 400 })

  const duplicateStrategy = body.duplicateStrategy ?? "skip"

  const importSession = await prisma.pmImportSession.findUnique({ where: { id: body.sessionId } })
  if (!importSession || importSession.userId !== userId)
    return NextResponse.json({ error: "Session not found" }, { status: 404 })

  if (importSession.status !== "preview_ready")
    return NextResponse.json({ error: "Session is not in preview_ready state" }, { status: 422 })

  const preview = importSession.previewJson as unknown as {
    tasks: ImportedTask[]; contacts: ImportedContact[]
  }

  if (!preview?.tasks)
    return NextResponse.json({ error: "No preview data found in session" }, { status: 422 })

  await prisma.pmImportSession.update({
    where: { id: body.sessionId }, data: { status: "importing" },
  })

  // ── Build user lookup map ────────────────────────────────────────────────
  const allUsers = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, email: true },
  })
  const byEmail = new Map(allUsers.map(u => [u.email?.toLowerCase(), u.id]))
  const byName  = new Map(allUsers.map(u => [u.name?.toLowerCase(),  u.id]))

  function resolveUser(task: ImportedTask): number | null {
    if (task.assigneeEmail) {
      const id = byEmail.get(task.assigneeEmail.toLowerCase())
      if (id) return id
    }
    if (task.assigneeName) {
      const id = byName.get(task.assigneeName.toLowerCase())
      if (id) return id
    }
    return null
  }

  // ── Filter tasks if selection provided ──────────────────────────────────
  const selectedSet = body.selectedTaskIds?.length
    ? new Set(body.selectedTaskIds)
    : null

  const tasksToImport = selectedSet
    ? preview.tasks.filter(t => selectedSet.has(t.externalId))
    : preview.tasks

  // ── Load existing duplicates for this client ─────────────────────────────
  const externalIds = tasksToImport.map(t => t.externalId)
  const existingByExternalId = new Map<string, number>()

  if (externalIds.length > 0) {
    const existing = await prisma.clientTask.findMany({
      where: { clientId: body.clientId, pmExternalId: { in: externalIds } },
      select: { pmExternalId: true, id: true },
    })
    existing.forEach(e => { if (e.pmExternalId) existingByExternalId.set(e.pmExternalId, e.id) })
  }

  // ── Import tasks ─────────────────────────────────────────────────────────
  let tasksCreated  = 0
  let tasksUpdated  = 0
  let tasksSkipped  = 0
  const taskErrors: { externalId: string; title: string; error: string }[] = []

  for (const task of tasksToImport) {
    // Skip tasks with no title (hard error — DB requires it)
    if (!task.title?.trim()) {
      tasksSkipped++
      taskErrors.push({ externalId: task.externalId, title: "(no title)", error: "Missing title — skipped" })
      continue
    }

    // Enforce field length limits (truncate rather than throw)
    const title = task.title.slice(0, MAX_TITLE_LEN)
    const rawDescription = [
      task.description,
      `[Imported from ${importSession.platform}]`,
      task.projectName ? `Project: ${task.projectName}` : null,
    ].filter(Boolean).join("\n") || ""
    const description = rawDescription.slice(0, MAX_DESCRIPTION_LEN)

    const taskData = {
      clientId:           body.clientId,
      title,
      description,
      category:           body.categoryOverride ?? task.category ?? "general",
      source:             `import:${importSession.platform}`,
      status:             task.status === "in_progress" ? "in_progress" : task.status === "completed" ? "completed" : "queued",
      priority:           task.priority,
      dueDate:            task.dueDate instanceof Date ? task.dueDate : null,
      completedAt:        task.completedAt instanceof Date ? task.completedAt : null,      assignedToUserId:   resolveUser(task),
      pmImportSessionId:  body.sessionId,
      pmExternalId:       task.externalId,
    }

    try {
      const existingId = existingByExternalId.get(task.externalId)

      if (existingId) {
        if (duplicateStrategy === "overwrite") {
          await prisma.clientTask.update({ where: { id: existingId }, data: taskData })
          tasksUpdated++
        } else {
          tasksSkipped++
        }
      } else {
        await prisma.clientTask.create({ data: taskData })
        tasksCreated++
      }
    } catch (e) {
      tasksSkipped++
      taskErrors.push({ externalId: task.externalId, title, error: String(e) })
    }
  }

  // ── Commit stats and mark complete ───────────────────────────────────────
  const commitStats = {
    tasksCreated,
    tasksUpdated,
    tasksSkipped,
    duplicateStrategy,
    errors: taskErrors.slice(0, 50),
    platform: importSession.platform,
    committedAt: new Date().toISOString(),
  }

  await prisma.pmImportSession.update({
    where: { id: body.sessionId },
    data: {
      status:          "complete",
      commitStats:     commitStats as object,
      credentialsJson: Prisma.DbNull,
      errorMessage:    null,
    },
  })

  return NextResponse.json({ ok: true, ...commitStats })
}
