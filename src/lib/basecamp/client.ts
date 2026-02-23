// lib/basecamp/client.ts
// Basecamp 4 REST API client — auth, pagination, error handling

const BC_API_BASE = 'https://3.basecampapi.com'
const BC_AUTH_BASE = 'https://launchpad.37signals.com'
const USER_AGENT = 'GHM Dashboard (https://ghm.covos.app)'

export interface BasecampToken {
  access_token: string
  refresh_token: string
  expires_at: number // unix ms
  account_id: string // Basecamp account/org ID
}

export class BasecampClient {
  private token: BasecampToken

  constructor(token: BasecampToken) {
    this.token = token
  }

  private async request<T>(path: string): Promise<T> {
    const url = path.startsWith('http') ? path : `${BC_API_BASE}/${this.token.account_id}${path}`
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.token.access_token}`,
        'User-Agent': USER_AGENT,
        'Content-Type': 'application/json',
      },
    })
    if (!res.ok) throw new Error(`Basecamp API error ${res.status}: ${await res.text()}`)
    return res.json() as Promise<T>
  }

  async paginate<T>(path: string): Promise<T[]> {
    const results: T[] = []
    let url: string | null = path.startsWith('http')
      ? path
      : `${BC_API_BASE}/${this.token.account_id}${path}`

    while (url) {
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.token.access_token}`,
          'User-Agent': USER_AGENT,
        },
      })
      if (!res.ok) throw new Error(`Basecamp API error ${res.status}: ${await res.text()}`)
      const data = await res.json() as T[]
      results.push(...data)
      const link = res.headers.get('Link')
      const next = link?.match(/<([^>]+)>;\s*rel="next"/)
      url = next ? next[1] : null
    }
    return results
  }

  async getProjects()                                { return this.paginate<BasecampProject>('/projects.json') }
  async getTodolists(projectId: number)              { return this.paginate<BasecampTodolist>(`/buckets/${projectId}/todolists.json`) }
  async getTodos(projectId: number, listId: number)  { return this.paginate<BasecampTodo>(`/buckets/${projectId}/todolists/${listId}/todos.json`) }
  async getMessages(projectId: number)               { return this.paginate<BasecampMessage>(`/buckets/${projectId}/message_boards/1/messages.json`).catch(() => [] as BasecampMessage[]) }
  async getDocuments(projectId: number)              { return this.paginate<BasecampDocument>(`/buckets/${projectId}/vaults/1/documents.json`).catch(() => [] as BasecampDocument[]) }
  async getUploads(projectId: number)                { return this.paginate<BasecampUpload>(`/buckets/${projectId}/vaults/1/uploads.json`).catch(() => [] as BasecampUpload[]) }
  async getPeople()                                  { return this.paginate<BasecampPerson>('/people.json') }
}

export function getAuthorizationUrl(): string {
  const params = new URLSearchParams({
    type: 'web_server',
    client_id: process.env.BASECAMP_CLIENT_ID!,
    redirect_uri: process.env.BASECAMP_REDIRECT_URI!,
  })
  return `https://launchpad.37signals.com/authorization/new?${params}`
}

export async function exchangeCodeForToken(code: string) {
  const res = await fetch(`${BC_AUTH_BASE}/authorization/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': USER_AGENT },
    body: JSON.stringify({
      type: 'web_server',
      client_id: process.env.BASECAMP_CLIENT_ID,
      client_secret: process.env.BASECAMP_CLIENT_SECRET,
      redirect_uri: process.env.BASECAMP_REDIRECT_URI,
      code,
    }),
  })
  if (!res.ok) throw new Error(`Token exchange failed: ${await res.text()}`)
  return res.json() as Promise<{
    access_token: string
    refresh_token: string
    expires_in: number
    accounts: BasecampAccount[]
  }>
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BasecampAccount  { id: number; name: string; product: string; href: string }
export interface BasecampProject  { id: number; name: string; description: string; status: string; created_at: string; updated_at: string; app_url: string }
export interface BasecampTodolist { id: number; title: string; completed_ratio: string; todos_count: number; app_url: string }
export interface BasecampTodo     { id: number; title: string; completed: boolean; due_on: string | null; created_at: string; assignees: { name: string; email_address: string }[]; creator: { name: string }; description: string; app_url: string }
export interface BasecampMessage  { id: number; subject: string; created_at: string; creator: { name: string }; content: string; app_url: string }
export interface BasecampDocument { id: number; title: string; created_at: string; creator: { name: string }; content: string; app_url: string }
export interface BasecampUpload   { id: number; filename: string; content_type: string; byte_size: number; download_url: string; created_at: string; creator: { name: string } }
export interface BasecampPerson   { id: number; name: string; email_address: string; title: string; admin: boolean }
