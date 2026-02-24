// lib/pm-import/adapters/csv.ts
// CSV/Excel adapter — accepts an uploaded file, parses it into ImportedTask/Contact shapes.
// This is a server-side helper; the file buffer is passed in by the API route.

import * as XLSX from "xlsx"
import type {
  TaskImportAdapter, PmCredentials, PmPreviewResult,
  ImportedTask, ImportedContact,
} from "../types"

// ─── Column normalisation map ─────────────────────────────────────────────────

const TASK_COLS: Record<string, string> = {
  // title
  "task": "title", "task name": "title", "name": "title", "title": "title",
  "subject": "title", "summary": "title", "item": "title",
  // description
  "description": "description", "notes": "description", "details": "description",
  // status
  "status": "status", "state": "status",
  // priority
  "priority": "priority", "importance": "priority",
  // due date
  "due": "dueDate", "due date": "dueDate", "due_date": "dueDate",
  "deadline": "dueDate", "target date": "dueDate",
  // assignee
  "assignee": "assigneeName", "assigned to": "assigneeName",
  "owner": "assigneeName", "responsible": "assigneeName",
  "assignee email": "assigneeEmail",
  // project / list
  "project": "projectName", "list": "projectName", "board": "projectName",
  "bucket": "projectName", "sprint": "projectName",
  // tags
  "tags": "tags", "labels": "tags", "categories": "tags",
}

function normalise(header: string) { return header.trim().toLowerCase() }

function buildMap(headers: string[]): Record<string, string> {
  const map: Record<string, string> = {}
  for (const h of headers) {
    const field = TASK_COLS[normalise(h)]
    if (field) map[h] = field
  }
  return map
}

function mapStatus(s: string): ImportedTask["status"] {
  const l = (s ?? "").toLowerCase().trim()
  if (l === "done" || l === "complete" || l === "completed" || l === "closed") return "completed"
  if (l === "in progress" || l === "doing" || l === "active" || l === "wip") return "in_progress"
  return "queued"
}

function mapPriority(s: string): ImportedTask["priority"] {
  const l = (s ?? "").toLowerCase().trim()
  if (l === "critical" || l === "urgent" || l === "p1") return "P1"
  if (l === "high" || l === "p2") return "P2"
  if (l === "low" || l === "p4") return "P4"
  return "P3"
}

export function parsePmCsv(buffer: ArrayBuffer, filename: string): PmPreviewResult {
  const wb = XLSX.read(buffer, { type: "array", cellDates: true })
  // pick sheet with most rows
  let bestRows: Record<string, unknown>[] = []
  for (const name of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[name])
    if (rows.length > bestRows.length) bestRows = rows
  }

  if (!bestRows.length) return {
    tasks: [], contacts: [], projects: [],
    stats: { taskCount: 0, contactCount: 0, projectCount: 0,
             platform: "csv", scrapedAt: new Date().toISOString() },
  }

  const headers = Object.keys(bestRows[0])
  const colMap   = buildMap(headers)
  const tasks: ImportedTask[] = []
  const contactMap = new Map<string, ImportedContact>()
  const projectSet = new Set<string>()

  for (let i = 0; i < bestRows.length; i++) {
    const raw = bestRows[i]
    const mapped: Record<string, string> = {}
    for (const [rawCol, field] of Object.entries(colMap)) {
      const v = raw[rawCol]
      if (v !== undefined && v !== null && v !== "") mapped[field] = String(v).trim()
    }

    const title = mapped.title
    if (!title) continue

    const projectName = mapped.projectName || filename.replace(/\.[^.]+$/, "")
    projectSet.add(projectName)

    const task: ImportedTask = {
      externalId:    `csv-${i}`,
      title,
      description:   mapped.description,
      status:        mapStatus(mapped.status ?? ""),
      priority:      mapPriority(mapped.priority ?? ""),
      category:      "general",
      dueDate:       mapped.dueDate ? new Date(mapped.dueDate) : undefined,
      assigneeName:  mapped.assigneeName,
      assigneeEmail: mapped.assigneeEmail,
      projectName,
      tags:          mapped.tags ? mapped.tags.split(/[,;|]/).map(t => t.trim()).filter(Boolean) : [],
    }
    tasks.push(task)

    // Build contact from assignee
    if (mapped.assigneeName) {
      const key = (mapped.assigneeEmail ?? mapped.assigneeName).toLowerCase()
      if (!contactMap.has(key))
        contactMap.set(key, {
          externalId: `csv-contact-${contactMap.size}`,
          name:  mapped.assigneeName,
          email: mapped.assigneeEmail,
        })
    }
  }

  const projects = Array.from(projectSet).map(name => ({
    externalId: `csv-proj-${name}`, name, status: "active",
    taskCount: tasks.filter(t => t.projectName === name).length,
  }))

  const contacts = Array.from(contactMap.values())
  return {
    tasks, contacts, projects,
    stats: { taskCount: tasks.length, contactCount: contacts.length,
             projectCount: projects.length, platform: "csv",
             scrapedAt: new Date().toISOString() },
  }
}

// The CSV adapter implements TaskImportAdapter for completeness, but scrape()
// is not used directly — parsePmCsv() is called by the API route with the file buffer.
export const CsvAdapter: TaskImportAdapter = {
  platform: "csv",
  async testConnection() { return { ok: true } },
  async scrape()         { throw new Error("Use parsePmCsv() directly for CSV imports.") },
}
