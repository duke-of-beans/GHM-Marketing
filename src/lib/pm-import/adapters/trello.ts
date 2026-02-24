// lib/pm-import/adapters/trello.ts
// Trello adapter — REST API v1, scrapes boards → lists → cards → members.

import type {
  TaskImportAdapter, PmCredentials, PmPreviewResult,
  ImportedTask, ImportedContact, ImportedProject,
} from "../types"

const BASE = "https://api.trello.com/1"

async function trelloGet<T>(path: string, key: string, token: string): Promise<T> {
  const sep = path.includes("?") ? "&" : "?"
  const res = await fetch(`${BASE}${path}${sep}key=${key}&token=${token}`)
  if (!res.ok) throw new Error(`Trello API ${res.status}: ${await res.text()}`)
  return res.json() as Promise<T>
}

export const TrelloAdapter: TaskImportAdapter = {
  platform: "trello",

  async testConnection(creds) {
    try {
      if (!creds.apiKey || !creds.extra?.["Token"])
        return { ok: false, error: "API Key and Token required." }
      await trelloGet("/members/me", creds.apiKey, creds.extra["Token"])
      return { ok: true }
    } catch (e) {
      return { ok: false, error: String(e) }
    }
  },

  async scrape(creds): Promise<PmPreviewResult> {
    if (!creds.apiKey || !creds.extra?.["Token"])
      throw new Error("Trello API Key and Token required.")

    const key   = creds.apiKey
    const token = creds.extra["Token"]

    // Members first (me + org members)
    const me = await trelloGet<{ id: string; fullName: string; email?: string }>(
      "/members/me?fields=id,fullName,email", key, token
    )
    const contactMap = new Map<string, ImportedContact>()
    contactMap.set(me.id, {
      externalId: `trello-member-${me.id}`, name: me.fullName, email: me.email,
    })

    // Boards
    const boards = await trelloGet<{
      id: string; name: string; closed: boolean; memberships: { idMember: string }[]
    }[]>("/members/me/boards?fields=id,name,closed,memberships", key, token)

    const openBoards = boards.filter(b => !b.closed)
    const projects: ImportedProject[] = []
    const tasks: ImportedTask[] = []

    for (const board of openBoards) {
      const proj: ImportedProject = {
        externalId: `trello-board-${board.id}`,
        name: board.name, status: "active", taskCount: 0,
      }
      projects.push(proj)

      // Lists in board
      const lists = await trelloGet<{ id: string; name: string; closed: boolean }[]>(
        `/boards/${board.id}/lists?fields=id,name,closed`, key, token
      )
      const openLists = lists.filter(l => !l.closed)
      const listNameMap = new Map(openLists.map(l => [l.id, l.name]))

      // Cards in board
      const cards = await trelloGet<{
        id: string; name: string; desc: string; closed: boolean
        due: string | null; dueComplete: boolean
        idList: string; idMembers: string[]
        labels: { name: string }[]
        dateLastActivity: string
      }[]>(`/boards/${board.id}/cards?fields=id,name,desc,closed,due,dueComplete,idList,idMembers,labels,dateLastActivity`, key, token)

      for (const card of cards) {
        // Fetch member details we haven't seen yet
        for (const memberId of card.idMembers) {
          if (!contactMap.has(memberId)) {
            const m = await trelloGet<{ id: string; fullName: string; email?: string }>(
              `/members/${memberId}?fields=id,fullName,email`, key, token
            ).catch(() => null)
            if (m) contactMap.set(m.id, { externalId: `trello-member-${m.id}`, name: m.fullName, email: m.email })
          }
        }

        const listName = listNameMap.get(card.idList) ?? ""
        const status: ImportedTask["status"] =
          card.closed || card.dueComplete ? "completed" :
          listName.toLowerCase().includes("doing") || listName.toLowerCase().includes("progress") ? "in_progress" :
          "queued"

        tasks.push({
          externalId:   `trello-${card.id}`,
          title:        card.name,
          description:  card.desc || undefined,
          status,
          priority:     "P3",
          category:     "general",
          dueDate:      card.due ? new Date(card.due) : undefined,
          completedAt:  card.dueComplete && card.due ? new Date(card.due) : undefined,
          assigneeName: card.idMembers[0] ? contactMap.get(card.idMembers[0])?.name : undefined,
          projectName:  board.name,
          tags:         [board.name, ...card.labels.map(l => l.name)].filter(Boolean),
        })
        proj.taskCount++
      }
    }

    const contacts = Array.from(contactMap.values())
    return {
      tasks, contacts, projects,
      stats: { taskCount: tasks.length, contactCount: contacts.length,
               projectCount: projects.length, platform: "trello",
               scrapedAt: new Date().toISOString() },
    }
  },
}
