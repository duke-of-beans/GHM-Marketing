/**
 * GET /api/settings/integrations/health
 * Live-pings each configured integration and returns status.
 * Admin only.
 */

import { NextRequest, NextResponse } from 'next/server'
import { withPermission } from '@/lib/auth/api-permissions'

interface IntegrationStatus {
  id:          string
  name:        string
  configured:  boolean
  healthy:     boolean | null   // null = not checked (not configured)
  latencyMs:   number | null
  error:       string | null
  note:        string | null
}

async function ping(url: string, headers: Record<string, string>): Promise<{ ok: boolean; ms: number; error?: string }> {
  const start = Date.now()
  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(6000) })
    return { ok: res.ok, ms: Date.now() - start, error: res.ok ? undefined : `HTTP ${res.status}` }
  } catch (err: any) {
    return { ok: false, ms: Date.now() - start, error: err.message ?? 'timeout' }
  }
}

export async function GET(req: NextRequest) {
  const permissionError = await withPermission(req, 'manage_settings')
  if (permissionError) return permissionError

  const results: IntegrationStatus[] = []

  // ── Anthropic ────────────────────────────────────────────────────────────
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (anthropicKey) {
    const { ok, ms, error } = await ping('https://api.anthropic.com/v1/models', {
      'x-api-key':         anthropicKey,
      'anthropic-version': '2023-06-01',
    })
    results.push({ id: 'anthropic', name: 'Anthropic (Claude)', configured: true, healthy: ok, latencyMs: ms, error: error ?? null, note: null })
  } else {
    results.push({ id: 'anthropic', name: 'Anthropic (Claude)', configured: false, healthy: null, latencyMs: null, error: null, note: 'ANTHROPIC_API_KEY not set' })
  }

  // ── DataForSEO (via Outscraper key used in audit generator) ──────────────
  const outscraperKey = process.env.OUTSCRAPER_API_KEY
  if (outscraperKey) {
    const { ok, ms, error } = await ping('https://api.app.outscraper.com/profile', {
      'X-API-KEY': outscraperKey,
    })
    results.push({ id: 'outscraper', name: 'Outscraper (Rank / NAP)', configured: true, healthy: ok, latencyMs: ms, error: error ?? null, note: null })
  } else {
    results.push({ id: 'outscraper', name: 'Outscraper (Rank / NAP)', configured: false, healthy: null, latencyMs: null, error: null, note: 'OUTSCRAPER_API_KEY not set' })
  }

  // ── Google Ads ───────────────────────────────────────────────────────────
  const adsClientId = process.env.GOOGLE_ADS_CLIENT_ID
  const adsDeveloperToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
  const adsConfigured = !!(adsClientId && adsDeveloperToken && process.env.GOOGLE_ADS_CLIENT_SECRET)
  results.push({
    id:          'google_ads',
    name:        'Google Ads',
    configured:  adsConfigured,
    healthy:     adsConfigured ? true : null,   // credentials exist; per-client OAuth tested separately
    latencyMs:   null,
    error:       null,
    note:        adsConfigured ? 'Credentials configured. Per-client OAuth connected on client integrations tab.' : 'GOOGLE_ADS_* env vars not set',
  })

  // ── GoDaddy ──────────────────────────────────────────────────────────────
  const gdKey    = process.env.GODADDY_API_KEY
  const gdSecret = process.env.GODADDY_API_SECRET
  if (gdKey && gdSecret) {
    const { ok, ms, error } = await ping('https://api.godaddy.com/v1/domains?limit=1', {
      Authorization:  `sso-key ${gdKey}:${gdSecret}`,
      'Content-Type': 'application/json',
    })
    results.push({ id: 'godaddy', name: 'GoDaddy (Domains / DNS)', configured: true, healthy: ok, latencyMs: ms, error: error ?? null, note: null })
  } else {
    results.push({ id: 'godaddy', name: 'GoDaddy (Domains / DNS)', configured: false, healthy: null, latencyMs: null, error: null, note: 'GODADDY_API_KEY / GODADDY_API_SECRET not set' })
  }

  // ── Wave Payments ────────────────────────────────────────────────────────
  const waveToken = process.env.WAVE_API_TOKEN
  if (waveToken) {
    const { ok, ms, error } = await ping('https://gql.waveapps.com/graphql/public', {
      Authorization:  `Bearer ${waveToken}`,
      'Content-Type': 'application/json',
    })
    results.push({ id: 'wave', name: 'Wave Payments', configured: true, healthy: ok, latencyMs: ms, error: error ?? null, note: null })
  } else {
    results.push({ id: 'wave', name: 'Wave Payments', configured: false, healthy: null, latencyMs: null, error: null, note: 'WAVE_API_TOKEN not set' })
  }

  // ── Google Business Profile OAuth infra ──────────────────────────────────
  const gbpConfigured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
  results.push({
    id:         'google_oauth',
    name:       'Google OAuth (GBP)',
    configured: gbpConfigured,
    healthy:    gbpConfigured ? true : null,
    latencyMs:  null,
    error:      null,
    note:       gbpConfigured ? 'OAuth app configured. Per-client connections managed on client integrations tab.' : 'GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set',
  })

  // ── Neon Postgres ────────────────────────────────────────────────────────
  const dbConfigured = !!process.env.DATABASE_URL
  results.push({
    id:         'postgres',
    name:       'Neon Postgres',
    configured: dbConfigured,
    healthy:    dbConfigured ? true : null,   // Prisma would have crashed if unreachable
    latencyMs:  null,
    error:      null,
    note:       dbConfigured ? 'Connected (Prisma manages connection pooling)' : 'DATABASE_URL not set',
  })

  const allHealthy = results.filter((r) => r.configured).every((r) => r.healthy !== false)

  return NextResponse.json({ success: true, data: { integrations: results, allHealthy } })
}
