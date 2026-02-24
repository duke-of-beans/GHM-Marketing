// lib/pm-import/adapters/basecamp.ts
// Basecamp adapter — reuses existing BasecampClient, normalises to ImportedTask/Contact.

import { BasecampClient, type BasecampToken } from "@/lib/basecamp/client"
import type {
  TaskImportAdapter, PmCredentials, PmPreviewResult,
  ImportedTask, ImportedContact, ImportedProject,
} from "../types"

export const BasecampAdapter: TaskImportAdapter = {
  platform: "basecamp",

  async testConnection(creds: PmCredentials) {
    try {
      if (!creds.accessToken || !creds.accountId)
        return { ok: false, error: "Missing access token or account ID. Connect via OAuth first." }
      const token: BasecampToken = {
        access_token:  creds.accessToken,
        refresh_token: creds.refreshToken ?? "",
        expires_at:    Date.now() + 3600_000,
        account_id:    creds.accountId,
      }
      const client = new BasecampClient(token)
      await client.getProjects()
      return { ok: true }
    } catch (e) {
      return { ok: false, error: String(e) }
    }
  },

  async scrape(creds: PmCredentials): Promise<PmPreviewResult> {
    if (!creds.accessToken || !creds.accountId)
      throw new Error("Missing Basecamp credentials — connect via OAuth first.")

    const token: BasecampToken = {
      access_token:  creds.accessToken,
      refresh_token: creds.refreshToken ?? "",
      expires_at:    Date.now() + 3600_000,
      account_id:    creds.accountId,
    }
    const client = new BasecampClient(token)

    const rawProjects = await client.getProjects()
    const activeProjects = rawProjects.filter(p => p.status === "active")

    const projects: ImportedProject[] = activeProjects.map(p => ({
      externalId: String(p.id), name: p.name,
      description: p.description || undefined, status: p.status, taskCount: 0,
    }))
    const projectMap = new Map(projects.map(p => [p.externalId, p]))

    const tasks: ImportedTask[] = []
    for (const project of activeProjects) {
      let lists: Awaited<ReturnType<typeof client.getTodolists>>
      try { lists = await client.getTodolists(project.id) } catch { continue }
      for (const list of lists) {
        let todos: Awaited<ReturnType<typeof client.getTodos>>
        try { todos = await client.getTodos(project.id, list.id) } catch { continue }
        for (const todo of todos) {
          tasks.push({
            externalId:    `bc-${todo.id}`,
            title:         todo.title,
            description:   todo.description || undefined,
            status:        todo.completed ? "completed" : "queued",
            priority:      "P3",
            category:      "general",
            dueDate:       todo.due_on ? new Date(todo.due_on) : undefined,
            assigneeName:  todo.assignees[0]?.name,
            assigneeEmail: todo.assignees[0]?.email_address,
            projectName:   project.name,
            completedAt:   todo.completed ? new Date() : undefined,
            tags:          [project.name, list.title].filter(Boolean),
          })
          const proj = projectMap.get(String(project.id))
          if (proj) proj.taskCount++
        }
      }
    }

    const people = await client.getPeople().catch(() => [])
    const contacts: ImportedContact[] = people.map(p => ({
      externalId: `bc-person-${p.id}`,
      name: p.name, email: p.email_address || undefined, title: p.title || undefined,
    }))

    return {
      tasks, contacts, projects: Array.from(projectMap.values()),
      stats: { taskCount: tasks.length, contactCount: contacts.length,
               projectCount: projects.length, platform: "basecamp",
               scrapedAt: new Date().toISOString() },
    }
  },
}
