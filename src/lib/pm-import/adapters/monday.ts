// lib/pm-import/adapters/monday.ts
// Monday.com adapter — GraphQL API, scrapes boards → groups → items → people.

import type {
  TaskImportAdapter, PmCredentials, PmPreviewResult,
  ImportedTask, ImportedContact, ImportedProject,
} from "../types"

const GQL_URL = "https://api.monday.com/v2"

async function mondayQuery<T>(query: string, token: string): Promise<T> {
  const res = await fetch(GQL_URL, {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
      "API-Version": "2024-01",
    },
    body: JSON.stringify({ query }),
  })
  if (!res.ok) throw new Error(`Monday.com API ${res.status}: ${await res.text()}`)
  const json = await res.json() as { data: T; errors?: { message: string }[] }
  if (json.errors?.length) throw new Error(json.errors[0].message)
  return json.data
}

export const MondayAdapter: TaskImportAdapter = {
  platform: "monday",

  async testConnection(creds) {
    try {
      if (!creds.apiKey) return { ok: false, error: "API token required." }
      await mondayQuery<{ me: { id: string } }>("{ me { id } }", creds.apiKey)
      return { ok: true }
    } catch (e) {
      return { ok: false, error: String(e) }
    }
  },

  async scrape(creds): Promise<PmPreviewResult> {
    if (!creds.apiKey) throw new Error("Monday.com API token required.")

    // Fetch boards (up to 200)
    const { boards } = await mondayQuery<{
      boards: {
        id: string; name: string; state: string
        items_page: {
          items: {
            id: string; name: string
            column_values: { id: string; text: string; type: string }[]
            created_at: string
            updated_at: string
          }[]
        }
      }[]
    }>(`{
      boards(limit: 200, state: active) {
        id name state
        items_page(limit: 500) {
          items {
            id name created_at updated_at
            column_values { id text type }
          }
        }
      }
    }`, creds.apiKey)

    // Users
    const { users } = await mondayQuery<{
      users: { id: string; name: string; email: string; title?: string }[]
    }>("{ users(kind: non_guests) { id name email title } }", creds.apiKey)

    const contacts: ImportedContact[] = users.map(u => ({
      externalId: `monday-user-${u.id}`,
      name: u.name, email: u.email, title: u.title,
    }))

    const projects: ImportedProject[] = []
    const tasks: ImportedTask[] = []

    for (const board of boards) {
      const proj: ImportedProject = {
        externalId: `monday-board-${board.id}`,
        name: board.name, status: board.state, taskCount: 0,
      }
      projects.push(proj)

      for (const item of board.items_page.items) {
        // Extract status and due date from column_values
        const statusCol = item.column_values.find(c => c.type === "color" || c.id === "status")
        const dateCol   = item.column_values.find(c => c.type === "date" || c.id.includes("due"))
        const personCol = item.column_values.find(c => c.type === "multiple-person" || c.id === "person")

        const rawStatus = (statusCol?.text ?? "").toLowerCase()
        const status: ImportedTask["status"] =
          rawStatus.includes("done") || rawStatus.includes("complete") ? "completed" :
          rawStatus.includes("progress") || rawStatus.includes("working") ? "in_progress" :
          "queued"

        tasks.push({
          externalId:   `monday-${item.id}`,
          title:        item.name,
          status,
          priority:     "P3",
          category:     "general",
          dueDate:      dateCol?.text ? new Date(dateCol.text) : undefined,
          assigneeName: personCol?.text || undefined,
          projectName:  board.name,
          tags:         [board.name],
        })
        proj.taskCount++
      }
    }

    return {
      tasks, contacts, projects,
      stats: { taskCount: tasks.length, contactCount: contacts.length,
               projectCount: projects.length, platform: "monday",
               scrapedAt: new Date().toISOString() },
    }
  },
}
