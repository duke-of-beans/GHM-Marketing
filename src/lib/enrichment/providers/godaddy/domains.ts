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
