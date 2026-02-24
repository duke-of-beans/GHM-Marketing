// lib/pm-import/types.ts
// Shared types for the PM platform data migration system (FEAT-014).
// Every adapter produces these shapes regardless of source platform.

// ─── Normalised data shapes ───────────────────────────────────────────────────

export interface ImportedTask {
  externalId:   string           // source platform ID (for dedup logging)
  title:        string
  description?: string
  status:       "queued" | "in_progress" | "completed"
  priority:     "P1" | "P2" | "P3" | "P4"
  category:     string           // maps to ClientTask.category
  dueDate?:     Date
  assigneeName?: string          // best-effort; matched to a User by name/email later
  assigneeEmail?: string
  projectName?: string           // source project / list name — used as category fallback
  completedAt?: Date
  tags:         string[]
  rawData?:     unknown          // kept for troubleshooting; not persisted
}

export interface ImportedContact {
  externalId:  string
  name:        string
  email?:      string
  phone?:      string
  company?:    string
  title?:      string
  rawData?:    unknown
}

export interface ImportedProject {
  externalId: string
  name:       string
  description?: string
  status:     string
  taskCount:  number
}

// ─── Adapter contract ────────────────────────────────────────────────────────

export interface PmCredentials {
  // API-key platforms
  apiKey?:      string
  workspaceId?: string
  // OAuth platforms (Basecamp)
  accessToken?:  string
  refreshToken?: string
  accountId?:    string
  // Anything else the adapter needs
  extra?:        Record<string, string>
}

export interface PmPreviewResult {
  tasks:    ImportedTask[]
  contacts: ImportedContact[]
  projects: ImportedProject[]
  stats: {
    taskCount:    number
    contactCount: number
    projectCount: number
    platform:     string
    scrapedAt:    string   // ISO
  }
}

export interface TaskImportAdapter {
  platform: PmPlatform
  /** Validate credentials by attempting a lightweight API call */
  testConnection(creds: PmCredentials): Promise<{ ok: boolean; error?: string }>
  /** Scrape all data and return a normalised preview payload */
  scrape(creds: PmCredentials): Promise<PmPreviewResult>
}

// ─── Platform registry ───────────────────────────────────────────────────────

export type PmPlatform =
  | "basecamp"
  | "asana"
  | "clickup"
  | "monday"
  | "trello"
  | "csv"

export const PM_PLATFORM_META: Record<PmPlatform, {
  label:       string
  authType:    "oauth" | "apikey" | "file"
  fields:      { key: keyof PmCredentials; label: string; type: "text" | "password" }[]
  description: string
  docsUrl:     string
}> = {
  basecamp: {
    label:       "Basecamp",
    authType:    "oauth",
    fields:      [],   // OAuth — no manual fields needed
    description: "Connect via Basecamp OAuth to scrape all projects, to-dos, and people.",
    docsUrl:     "https://github.com/basecamp/api/blob/master/sections/authentication.md",
  },
  asana: {
    label:       "Asana",
    authType:    "apikey",
    fields:      [
      { key: "apiKey",      label: "Personal Access Token", type: "password" },
      { key: "workspaceId", label: "Workspace ID (optional)", type: "text" },
    ],
    description: "Generate a Personal Access Token in Asana → My Profile → Apps → Manage Developer Apps.",
    docsUrl:     "https://developers.asana.com/docs/personal-access-token",
  },
  clickup: {
    label:       "ClickUp",
    authType:    "apikey",
    fields:      [
      { key: "apiKey",      label: "API Token", type: "password" },
      { key: "workspaceId", label: "Workspace ID (optional)", type: "text" },
    ],
    description: "Get your API token from ClickUp → Settings → Apps → API Token.",
    docsUrl:     "https://clickup.com/api/developer-portal/authentication/",
  },
  monday: {
    label:       "Monday.com",
    authType:    "apikey",
    fields:      [
      { key: "apiKey", label: "API Token v2", type: "password" },
    ],
    description: "Get your API token from Monday.com → Profile → Developers → API.",
    docsUrl:     "https://developer.monday.com/api-reference/docs/authentication",
  },
  trello: {
    label:       "Trello",
    authType:    "apikey",
    fields:      [
      { key: "apiKey",      label: "API Key",   type: "text" },
      { key: "extra",       label: "Token",     type: "password" },
    ],
    description: "Get your Trello API key and token from trello.com/app-key.",
    docsUrl:     "https://developer.atlassian.com/cloud/trello/guides/rest-api/api-introduction/",
  },
  csv: {
    label:       "CSV / Excel",
    authType:    "file",
    fields:      [],
    description: "Upload a CSV or Excel export from any task management platform.",
    docsUrl:     "",
  },
}
