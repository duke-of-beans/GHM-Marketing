/**
 * GoDaddy DNS record management
 */

import { gdGet, gdPut } from './client'

export interface DnsRecord {
  type:   string   // A | CNAME | TXT | MX | etc.
  name:   string   // '@' for root
  data:   string   // IP or target
  ttl?:   number   // seconds, default 3600
}

// Vercel's anycast IP for A records
const VERCEL_IP = '76.76.21.21'

export async function getDnsRecords(domain: string): Promise<DnsRecord[]> {
  const res = await gdGet(`/domains/${encodeURIComponent(domain)}/records`)
  if (!res.ok) throw new Error(`GoDaddy DNS get failed: ${await res.text()}`)
  const data = await res.json()
  return (data as DnsRecord[]).map((r) => ({
    type: r.type,
    name: r.name,
    data: r.data,
    ttl:  r.ttl,
  }))
}

export async function setDnsRecords(domain: string, records: DnsRecord[]): Promise<void> {
  const res = await gdPut(`/domains/${encodeURIComponent(domain)}/records`, records)
  if (!res.ok) throw new Error(`GoDaddy DNS set failed: ${await res.text()}`)
}

/**
 * Point a domain to Vercel:
 *  - Root (@) → A record → 76.76.21.21
 *  - www     → CNAME    → cname.vercel-dns.com
 */
export async function pointToVercel(domain: string): Promise<void> {
  const records: DnsRecord[] = [
    { type: 'A',     name: '@',   data: VERCEL_IP,              ttl: 600 },
    { type: 'CNAME', name: 'www', data: 'cname.vercel-dns.com.', ttl: 600 },
  ]

  // Set root A record
  const aRes = await gdPut(
    `/domains/${encodeURIComponent(domain)}/records/A/@`,
    [{ data: VERCEL_IP, ttl: 600 }]
  )
  if (!aRes.ok) throw new Error(`GoDaddy A record failed: ${await aRes.text()}`)

  // Set www CNAME
  const cnRes = await gdPut(
    `/domains/${encodeURIComponent(domain)}/records/CNAME/www`,
    [{ data: 'cname.vercel-dns.com.', ttl: 600 }]
  )
  if (!cnRes.ok) throw new Error(`GoDaddy CNAME failed: ${await cnRes.text()}`)
}
