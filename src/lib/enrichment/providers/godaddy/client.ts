/**
 * GoDaddy API client — API key auth (no per-client OAuth needed)
 * Uses GHM's own GoDaddy account for domain purchases and DNS management.
 */

const BASE = {
  production: 'https://api.godaddy.com/v1',
  ote:        'https://api.ote-godaddy.com/v1',
}

function getBase(): string {
  const env = (process.env.GODADDY_ENVIRONMENT ?? 'production') as 'production' | 'ote'
  return BASE[env] ?? BASE.production
}

function authHeaders() {
  const key    = process.env.GODADDY_API_KEY
  const secret = process.env.GODADDY_API_SECRET
  if (!key || !secret) throw new Error('GoDaddy API credentials not configured')
  return {
    Authorization: `sso-key ${key}:${secret}`,
    'Content-Type': 'application/json',
  }
}

export async function gdGet(path: string): Promise<Response> {
  return fetch(`${getBase()}${path}`, { headers: authHeaders() })
}

export async function gdPost(path: string, body: unknown): Promise<Response> {
  return fetch(`${getBase()}${path}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  })
}

export async function gdPatch(path: string, body: unknown): Promise<Response> {
  return fetch(`${getBase()}${path}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(body),
  })
}

export async function gdPut(path: string, body: unknown): Promise<Response> {
  return fetch(`${getBase()}${path}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(body),
  })
}
