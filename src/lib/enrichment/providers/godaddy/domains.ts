/**
 * GoDaddy domain search, purchase, and info
 */

import { gdGet, gdPost } from './client'

export interface DomainAvailability {
  domain:     string
  available:  boolean
  price:      number    // USD cents
  currency:   string
  period:     number    // years
}

export interface ContactInfo {
  firstName:   string
  lastName:    string
  email:       string
  phone:       string   // +1.5555555555
  address1:    string
  city:        string
  state:       string   // 2-letter
  postalCode:  string
  country:     string   // 2-letter ISO
}

export interface PurchaseResult {
  orderId:    number
  itemCount:  number
  total:      number    // USD cents
  currency:   string
}

export interface DomainInfo {
  domain:     string
  status:     string
  expires:    string   // ISO date
  nameServers: string[]
  locked:     boolean
}

export async function searchDomains(query: string): Promise<DomainAvailability[]> {
  // Check exact domain + common TLD variants
  const tlds = ['.com', '.net', '.org', '.io', '.co']
  const domains = query.includes('.') ? [query] : tlds.map((t) => `${query}${t}`)

  const results: DomainAvailability[] = []

  for (const domain of domains) {
    try {
      const res = await gdGet(`/domains/available?domain=${encodeURIComponent(domain)}&checkType=FAST`)
      if (!res.ok) continue
      const data = await res.json()
      results.push({
        domain:    data.domain,
        available: data.available,
        price:     data.price ?? 0,
        currency:  data.currency ?? 'USD',
        period:    data.period ?? 1,
      })
    } catch { /* skip failed checks */ }
  }

  return results
}

export async function purchaseDomain(
  domain: string,
  contact: ContactInfo
): Promise<PurchaseResult> {
  const body = {
    domain,
    period: 1,
    renewAuto: true,
    privacy: false,
    consent: {
      agreedAt:  new Date().toISOString(),
      agreedBy:  contact.email,
      agreementKeys: ['DNRA'],
    },
    contactAdmin:      buildContact(contact),
    contactBilling:    buildContact(contact),
    contactRegistrant: buildContact(contact),
    contactTech:       buildContact(contact),
  }

  const res = await gdPost('/domains/purchase', body)
  if (!res.ok) throw new Error(`GoDaddy purchase failed: ${await res.text()}`)

  const data = await res.json()
  return {
    orderId:   data.orderId,
    itemCount: data.itemCount ?? 1,
    total:     data.total ?? 0,
    currency:  data.currency ?? 'USD',
  }
}

export async function getDomainInfo(domain: string): Promise<DomainInfo> {
  const res = await gdGet(`/domains/${encodeURIComponent(domain)}`)
  if (!res.ok) throw new Error(`GoDaddy domain info failed: ${await res.text()}`)
  const data = await res.json()
  return {
    domain:      data.domain,
    status:      data.status,
    expires:     data.expires,
    nameServers: data.nameServers ?? [],
    locked:      data.locked ?? false,
  }
}

function buildContact(c: ContactInfo) {
  return {
    nameFirst:   c.firstName,
    nameLast:    c.lastName,
    email:       c.email,
    phone:       c.phone,
    addressMailing: {
      address1:   c.address1,
      city:       c.city,
      state:      c.state,
      postalCode: c.postalCode,
      country:    c.country,
    },
  }
}

// ─── Parked domain discovery ──────────────────────────────────────────────────

export interface OwnedDomain {
  domain:    string
  status:    string   // ACTIVE | PARKED | EXPIRED | CANCELLED
  expires:   string   // ISO date
  renewable: boolean
}

/**
 * List all domains in GHM's GoDaddy account, optionally filtered by status.
 * Used to surface parked/available domains for satellite repurposing.
 */
export async function listOwnedDomains(statusFilter?: string): Promise<OwnedDomain[]> {
  const params = new URLSearchParams({ limit: '500', includes: 'nameServers' })
  if (statusFilter) params.set('statuses', statusFilter)

  const res = await gdGet(`/domains?${params}`)
  if (!res.ok) {
    console.error(`[godaddy] listOwnedDomains failed: ${await res.text()}`)
    return []
  }

  const data = await res.json() as Array<{
    domain:    string
    status:    string
    expires:   string
    renewable: boolean
  }>

  return data.map((d) => ({
    domain:    d.domain,
    status:    d.status,
    expires:   d.expires,
    renewable: d.renewable ?? false,
  }))
}

export interface DomainSuggestion {
  domain:    string
  available: boolean
  price:     number   // USD cents
  period:    number   // years
}

/**
 * Suggest available domains based on keywords (business name, niche, city).
 * Uses GoDaddy's /domains/suggest endpoint — returns up to 20 results.
 * Also runs a bulk availability check to get accurate pricing.
 */
export async function suggestDomains(
  keywords: string,
  tlds: string[] = ['com', 'net', 'org', 'io', 'co']
): Promise<DomainSuggestion[]> {
  const params = new URLSearchParams({
    query:        keywords,
    country:      'US',
    city:         '',
    sources:      'CC_TLD,SPIN,DOTS_ADJACENT',
    tlds:         tlds.join(','),
    lengthMax:    '20',
    limit:        '20',
    waitMs:       '1000',
    suggestionsPerTld: '4',
  })

  const res = await gdGet(`/domains/suggest?${params}`)
  if (!res.ok) {
    console.error(`[godaddy] suggestDomains failed: ${await res.text()}`)
    return []
  }

  const suggestions = await res.json() as Array<{ domain: string }>
  if (!suggestions.length) return []

  // Bulk availability check to get prices
  const domainList = suggestions.map((s) => s.domain)
  const bulkRes = await gdPost('/domains/available', { domains: domainList, checkType: 'FAST' })

  if (!bulkRes.ok) {
    // Return without pricing if bulk check fails
    return domainList.map((domain) => ({
      domain, available: true, price: 0, period: 1,
    }))
  }

  const bulk = await bulkRes.json() as {
    domains: Array<{ domain: string; available: boolean; price: number; period: number }>
  }

  return (bulk.domains ?? []).map((d) => ({
    domain:    d.domain,
    available: d.available,
    price:     d.price ?? 0,
    period:    d.period ?? 1,
  }))
}

/**
 * Check if a specific list of domains are available (batch, up to 500).
 */
export async function checkDomainsAvailable(domains: string[]): Promise<DomainSuggestion[]> {
  if (!domains.length) return []

  const res = await gdPost('/domains/available', { domains, checkType: 'FAST' })
  if (!res.ok) {
    console.error(`[godaddy] checkDomainsAvailable failed: ${await res.text()}`)
    return []
  }

  const data = await res.json() as {
    domains: Array<{ domain: string; available: boolean; price: number; period: number }>
  }

  return (data.domains ?? []).map((d) => ({
    domain:    d.domain,
    available: d.available,
    price:     d.price ?? 0,
    period:    d.period ?? 1,
  }))
}
