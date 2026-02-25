// POST /api/import/pm/validate
// Runs a pre-commit validation pass on the selected tasks from a PmImportSession.
// Returns per-record issues + assignee mismatch report + duplicate detection.
// Client must resolve blocking issues before commit is allowed.

import { NextRequest, NextResponse } from "next/server"
import { withPermission } from "@/lib/auth/api-permissions"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import type { ImportedTask } from "@/lib/pm-import"

const MAX_TITLE_LEN       = 255
const MAX_DESCRIPTION_LEN = 5000

export async function POST(request: NextRequest) {
  const permErr = await withPermission(request, "manage_clients")
  if (permErr) return permErr

  const session = await auth()
  const userId = parseInt((session?.user as any)?.id ?? "0")
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json() as {
    sessionId:        number
    selectedTaskIds?: string[]
    clientId:         number
  }

  if (!body.clientId)
    return NextResponse.json({ error: "clientId is required" }, { status: 400 })

  const importSession = await prisma.pmImportSession.findUnique({ where: { id: body.sessionId } })
  if (!importSession || importSession.userId !== userId)
    return NextResponse.json({ error: "Session not found" }, { status: 404 })

  const preview = importSession.previewJson as unknown as { tasks: ImportedTask[] }
  if (!preview?.tasks)
    return NextResponse.json({ error: "No preview data found" }, { status: 422 })

  const selectedSet = body.selectedTaskIds?.length
    ? new Set(body.selectedTaskIds)
    : null

  const tasksToValidate = selectedSet
    ? preview.tasks.filter(t => selectedSet.has(t.externalId))
    : preview.tasks

  // ── Build user lookup map ────────────────────────────────────────────────
  const allUsers = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, email: true },
  })
  const byEmail = new Map(allUsers.map(u => [u.email?.toLowerCase(), u.id]))
  const byName  = new Map(allUsers.map(u => [u.name?.toLowerCase(),  u.id]))

  function canResolveUser(task: ImportedTask): boolean {
    if (task.assigneeEmail && byEmail.has(task.assigneeEmail.toLowerCase())) return true
    if (task.assigneeName  && byName.has(task.assigneeName.toLowerCase()))   return true
    return false
  }

  // ── Check for existing duplicates (source + externalId) ─────────────────
  const externalIds = tasksToValidate.map(t => t.externalId)
  const existingTasks = await prisma.clientTask.findMany({
    where: {
      clientId: body.clientId,
      pmExternalId: { in: externalIds },
    },
    select: { pmExternalId: true, title: true, id: true },
  })
  const duplicateSet = new Set(existingTasks.map(t => t.pmExternalId).filter(Boolean))

  // ── Per-record validation ────────────────────────────────────────────────
  interface TaskIssue {
    externalId: string
    title:      string
    severity:   "error" | "warning"
    issues:     string[]
  }

  const taskIssues: TaskIssue[] = []
  const assigneeMismatches: { name: string; email?: string }[] = []
  const seenMismatches = new Set<string>()

  for (const task of tasksToValidate) {
    const issues: string[] = []
    let severity: "error" | "warning" = "warning"

    // Required field: title
    if (!task.title || !task.title.trim()) {
      issues.push("Missing title — task will not be imported without a title")
      severity = "error"
    }

    // Field length warnings (we'll truncate on commit, but warn here)
    if (task.title && task.title.length > MAX_TITLE_LEN) {
      issues.push(`Title will be truncated to ${MAX_TITLE_LEN} characters (currently ${task.title.length})`)
    }
    if (task.description && task.description.length > MAX_DESCRIPTION_LEN) {
      issues.push(`Description will be truncated to ${MAX_DESCRIPTION_LEN} characters (currently ${task.description.length})`)
    }

    // Invalid date
    if (task.dueDate && !(task.dueDate instanceof Date) && isNaN(Date.parse(String(task.dueDate)))) {
      issues.push(`Invalid due date — will be ignored`)
    }

    // Duplicate
    if (duplicateSet.has(task.externalId)) {
      issues.push("A task with this ID already exists for this client — will be skipped unless overwrite is chosen")
    }

    // Assignee mismatch
    const hasAssignee = task.assigneeEmail || task.assigneeName
    if (hasAssignee && !canResolveUser(task)) {
      const key = task.assigneeEmail ?? task.assigneeName ?? "unknown"
      if (!seenMismatches.has(key)) {
        seenMismatches.add(key)
        assigneeMismatches.push({
          name:  task.assigneeName ?? "Unknown",
          email: task.assigneeEmail,
        })
      }
      issues.push(`Assignee "${task.assigneeName ?? task.assigneeEmail}" not found — task will be unassigned`)
    }

    if (issues.length > 0) {
      taskIssues.push({
        externalId: task.externalId,
        title:      task.title ?? "(no title)",
        severity,
        issues,
      })
    }
  }

  const errorCount   = taskIssues.filter(i => i.severity === "error").length
  const warningCount = taskIssues.filter(i => i.severity === "warning").length
  const duplicateCount = existingTasks.length
  const canProceed   = errorCount === 0

  return NextResponse.json({
    ok: true,
    canProceed,
    summary: {
      totalSelected:    tasksToValidate.length,
      errorCount,
      warningCount,
      duplicateCount,
      assigneeMismatches: assigneeMismatches.length,
    },
    taskIssues: taskIssues.slice(0, 100), // cap for payload size
    assigneeMismatches,
    duplicates: existingTasks.map(t => ({ externalId: t.pmExternalId, title: t.title, id: t.id })),
  })
}
