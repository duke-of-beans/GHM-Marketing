// lib/pm-import/adapters/asana.ts
// Asana adapter — Personal Access Token auth, scrapes workspaces → projects → tasks → users.

import type {
  TaskImportAdapter, PmCredentials, PmPreviewResult,
  ImportedTask, ImportedContact, ImportedProject,
} from "../types"

const BASE = "https://app.asana.com/api/1.0"

async function asanaGet<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  })
  if (!res.ok) throw new Error(`Asana API ${res.status}: ${await res.text()}`)
  const json = await res.json() as { data: T }
  return json.data
}

async function asanaPaginate<T>(path: string, token: string): Promise<T[]> {
  const results: T[] = []
  let url = `${BASE}${path}${path.includes("?") ? "&" : "?"}limit=100`
  while (url) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    })
    if (!res.ok) throw new Error(`Asana API ${res.status}: ${await res.text()}`)
    const json = await res.json() as { data: T[]; next_page?: { uri: string } }
    results.push(...json.data)
    url = json.next_page?.uri ?? ""
  }
  return results
}

function mapStatus(s: string): ImportedTask["status"] {
  if (!s || s === "null") return "queued"
  const l = s.toLowerCase()
  if (l.includes("done") || l.includes("complete")) return "completed"
  if (l.includes("progress") || l.includes("active")) return "in_progress"
  return "queued"
}

export const AsanaAdapter: TaskImportAdapter = {
  platform: "asana",

  async testConnection(creds) {
    try {
      if (!creds.apiKey) return { ok: false, error: "API token required." }
      await asanaGet("/users/me", creds.apiKey)
      return { ok: true }
    } catch (e) {
      return { ok: false, error: String(e) }
    }
  },

  async scrape(creds): Promise<PmPreviewResult> {
    if (!creds.apiKey) throw new Error("Asana API token required.")

    // Workspaces
    const workspaces = await asanaGet<{ gid: string; name: string }[]>("/workspaces", creds.apiKey)
    const wsGids = creds.workspaceId
      ? [{ gid: creds.workspaceId, name: "" }]
      : workspaces

    const projects: ImportedProject[] = []
    const tasks: ImportedTask[] = []
    const contactMap = new Map<string, ImportedContact>()

    for (const ws of wsGids) {
      // Projects
      const rawProjects = await asanaPaginate<{ gid: string; name: string; archived: boolean }>(
        `/projects?workspace=${ws.gid}&opt_fields=gid,name,archived`, creds.apiKey
      )
      for (const proj of rawProjects.filter(p => !p.archived)) {
        projects.push({ externalId: proj.gid, name: proj.name, status: "active", taskCount: 0 })
      }

      // Members as contacts
      const members = await asanaPaginate<{ gid: string; name: string; email: string }>(
        `/workspaces/${ws.gid}/users?opt_fields=gid,name,email`, creds.apiKey
      )
      for (const m of members) {
        if (!contactMap.has(m.gid))
          contactMap.set(m.gid, { externalId: `asana-user-${m.gid}`, name: m.name, email: m.email })
      }
    }

    // Tasks per project
    for (const proj of projects) {
      const rawTasks = await asanaPaginate<{
        gid: string; name: string; notes: string; completed: boolean;
        due_on: string | null; assignee: { gid: string; name: string; email?: string } | null;
        custom_fields?: { name: string; enum_value?: { name: string } }[]
        tags?: { name: string }[]
      }>(
        `/tasks?project=${proj.externalId}&opt_fields=gid,name,notes,completed,due_on,assignee,assignee.email,tags,custom_fields`,
        creds.apiKey
      ).catch(() => [] as ImportedTask[])

      for (const t of rawTasks as any[]) {
        if (!t.name) continue
        tasks.push({
          externalId:    `asana-${t.gid}`,
          title:         t.name,
          description:   t.notes || undefined,
          status:        t.completed ? "completed" : "queued",
          priority:      "P3",
          category:      "general",
          dueDate:       t.due_on ? new Date(t.due_on) : undefined,
          assigneeName:  t.assignee?.name,
          assigneeEmail: t.assignee?.email,
          projectName:   proj.name,
          tags:          (t.tags ?? []).map((tag: { name: string }) => tag.name),
        })
        proj.taskCount++
        if (t.assignee && !contactMap.has(t.assignee.gid)) {
          contactMap.set(t.assignee.gid, {
            externalId: `asana-user-${t.assignee.gid}`,
            name: t.assignee.name, email: t.assignee.email,
          })
        }
      }
    }

    const contacts = Array.from(contactMap.values())
    return {
      tasks, contacts, projects,
      stats: { taskCount: tasks.length, contactCount: contacts.length,
               projectCount: projects.length, platform: "asana",
               scrapedAt: new Date().toISOString() },
    }
  },
}
