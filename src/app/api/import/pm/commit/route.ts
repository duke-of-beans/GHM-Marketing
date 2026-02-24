// POST /api/import/pm/commit
// Writes previewed tasks and contacts to the GHM database.
// Matches assignees to existing Users by email/name (best-effort).
// Optionally filters to selected task IDs only (from UI selection).

import { NextRequest, NextResponse } from "next/server"
import { withPermission } from "@/lib/auth/api-permissions"
import { prisma } from "@/lib/db"
import { Prisma } from "@prisma/client"
import { auth } from "@/lib/auth"
import type { ImportedTask, ImportedContact } from "@/lib/pm-import"

export async function POST(request: NextRequest) {
  const permErr = await withPermission(request, "manage_clients")
  if (permErr) return permErr

  const session = await auth()
  const userId = parseInt((session?.user as any)?.id ?? "0")
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json() as {
    sessionId:         number
    selectedTaskIds?:  string[]   // externalIds to import; if omitted, import all
    clientId:          number     // required — all imported tasks are linked to this client
    categoryOverride?: string     // override all task categories
  }

  if (!body.clientId)
    return NextResponse.json({ error: "clientId is required — tasks must be linked to a client" }, { status: 400 })

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

  // ── Build user lookup map (email → id, name → id) ────────────────────────
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

  // ── Import tasks ─────────────────────────────────────────────────────────
  let tasksCreated = 0
  let tasksSkipped = 0
  const taskErrors: { externalId: string; error: string }[] = []

  for (const task of tasksToImport) {
    try {
      await prisma.clientTask.create({
        data: {
          clientId:         body.clientId,
          title:            task.title,
          description:      [
            task.description,
            `[Imported from ${importSession.platform}]`,
            task.projectName ? `Project: ${task.projectName}` : null,
          ].filter(Boolean).join("\n") || "",
          category:         body.categoryOverride ?? task.category ?? "general",
          source:           `import:${importSession.platform}`,
          status:           task.status === "in_progress" ? "in_progress" : task.status === "completed" ? "completed" : "queued",
          priority:         task.priority,
          dueDate:          task.dueDate ? new Date(task.dueDate) : null,
          completedAt:      task.completedAt ? new Date(task.completedAt) : null,
          assignedToUserId: resolveUser(task),
        },
      })
      tasksCreated++
    } catch (e) {
      tasksSkipped++
      taskErrors.push({ externalId: task.externalId, error: String(e) })
    }
  }

  // ── Commit stats and mark complete ───────────────────────────────────────
  const commitStats = {
    tasksCreated, tasksSkipped,
    errors: taskErrors.slice(0, 20),
    platform: importSession.platform,
    committedAt: new Date().toISOString(),
  }

  await prisma.pmImportSession.update({
    where: { id: body.sessionId },
    data: {
      status:          "complete",
      commitStats:     commitStats as object,
      // Clear credentials now that migration is done
      credentialsJson: Prisma.DbNull,
      errorMessage:    null,
    },
  })

  return NextResponse.json({ ok: true, ...commitStats })
}
