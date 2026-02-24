// lib/pm-import/adapters/clickup.ts
// ClickUp adapter — API Token auth, scrapes teams → spaces → lists → tasks → members.

import type {
  TaskImportAdapter, PmCredentials, PmPreviewResult,
  ImportedTask, ImportedContact, ImportedProject,
} from "../types"

const BASE = "https://api.clickup.com/api/v2"

async function cuGet<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: token, "Content-Type": "application/json" },
  })
  if (!res.ok) throw new Error(`ClickUp API ${res.status}: ${await res.text()}`)
  return res.json() as Promise<T>
}

function mapStatus(s: string): ImportedTask["status"] {
  const l = (s ?? "").toLowerCase()
  if (l === "complete" || l === "done" || l === "closed") return "completed"
  if (l === "in progress" || l === "in review") return "in_progress"
  return "queued"
}

export const ClickupAdapter: TaskImportAdapter = {
  platform: "clickup",

  async testConnection(creds) {
    try {
      if (!creds.apiKey) return { ok: false, error: "API token required." }
      await cuGet("/user", creds.apiKey)
      return { ok: true }
    } catch (e) {
      return { ok: false, error: String(e) }
    }
  },

  async scrape(creds): Promise<PmPreviewResult> {
    if (!creds.apiKey) throw new Error("ClickUp API token required.")

    const { teams } = await cuGet<{ teams: { id: string; name: string; members: { user: { id: number; username: string; email: string } }[] }[] }>(
      "/team", creds.apiKey
    )

    const contactMap = new Map<string, ImportedContact>()
    const projects: ImportedProject[] = []
    const tasks: ImportedTask[] = []

    for (const team of teams) {
      // Members as contacts
      for (const { user: u } of team.members) {
        const key = String(u.id)
        if (!contactMap.has(key))
          contactMap.set(key, { externalId: `cu-user-${u.id}`, name: u.username, email: u.email })
      }

      // Spaces → folders → lists OR spaces → lists directly
      const { spaces } = await cuGet<{ spaces: { id: string; name: string }[] }>(
        `/team/${team.id}/space?archived=false`, creds.apiKey
      )

      for (const space of spaces) {
        // Folderless lists
        const { lists } = await cuGet<{ lists: { id: string; name: string }[] }>(
          `/space/${space.id}/list?archived=false`, creds.apiKey
        )

        // Folders
        const { folders } = await cuGet<{ folders: { id: string; name: string; lists: { id: string; name: string }[] }[] }>(
          `/space/${space.id}/folder?archived=false`, creds.apiKey
        )

        const allLists = [
          ...lists,
          ...folders.flatMap(f => f.lists),
        ]

        for (const list of allLists) {
          const proj: ImportedProject = {
            externalId: `cu-list-${list.id}`, name: list.name,
            status: "active", taskCount: 0,
          }
          projects.push(proj)

          // Tasks in list (paginated by page)
          let page = 0
          while (true) {
            const { tasks: rawTasks } = await cuGet<{
              tasks: {
                id: string; name: string; description?: string
                status: { status: string }
                priority?: { priority: string }
                due_date?: string
                assignees: { id: number; username: string; email: string }[]
                tags: { name: string }[]
                date_done?: string
              }[]
            }>(`/list/${list.id}/task?archived=false&page=${page}&include_closed=true`, creds.apiKey).catch(() => ({ tasks: [] }))

            if (!rawTasks.length) break
            for (const t of rawTasks) {
              const cuPriority = t.priority?.priority?.toLowerCase()
              const priority: ImportedTask["priority"] =
                cuPriority === "urgent" ? "P1" :
                cuPriority === "high"   ? "P2" :
                cuPriority === "low"    ? "P4" : "P3"

              tasks.push({
                externalId:    `cu-${t.id}`,
                title:         t.name,
                description:   t.description || undefined,
                status:        mapStatus(t.status.status),
                priority,
                category:      "general",
                dueDate:       t.due_date ? new Date(parseInt(t.due_date)) : undefined,
                assigneeName:  t.assignees[0]?.username,
                assigneeEmail: t.assignees[0]?.email,
                projectName:   list.name,
                tags:          t.tags.map(tag => tag.name),
              })
              proj.taskCount++
              for (const a of t.assignees) {
                const key = String(a.id)
                if (!contactMap.has(key))
                  contactMap.set(key, { externalId: `cu-user-${a.id}`, name: a.username, email: a.email })
              }
            }
            if (rawTasks.length < 100) break
            page++
          }
        }
      }
    }

    const contacts = Array.from(contactMap.values())
    return {
      tasks, contacts, projects,
      stats: { taskCount: tasks.length, contactCount: contacts.length,
               projectCount: projects.length, platform: "clickup",
               scrapedAt: new Date().toISOString() },
    }
  },
}
