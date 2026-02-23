/**
 * src/lib/providers/godaddy/domain.ts
 *
 * GoDaddy implementation of DomainProvider.
 */

import {
  searchDomains as gdSearch,
  purchaseDomain as gdPurchase,
} from '@/lib/enrichment/providers/godaddy/domains'
import {
  getDnsRecords as gdGetDns,
  setDnsRecords as gdSetDns,
  pointToVercel as gdPointToVercel,
} from '@/lib/enrichment/providers/godaddy/dns'
import type { DomainProvider, DomainSearchResult, DnsRecord } from '../types'

export class GoDaddyDomainProvider implements DomainProvider {
  readonly name = 'godaddy'

  async searchDomains(query: string): Promise<DomainSearchResult[]> {
    const results = await gdSearch(query)
    return results.map((r) => ({
      domain:      r.domain,
      available:   r.available,
      priceCents:  r.price,
      currency:    r.currency,
      periodYears: r.period,
    }))
  }

  async purchaseDomain(
    domain: string,
    contact: {
      firstName: string; lastName: string; email: string; phone: string
      address1: string; city: string; state: string; postalCode: string; country: string
    },
  ): Promise<{ orderId: string | number }> {
    const result = await gdPurchase(domain, contact)
    return { orderId: result.orderId }
  }

  async getDnsRecords(domain: string): Promise<DnsRecord[]> {
    return gdGetDns(domain)
  }

  async setDnsRecords(domain: string, records: DnsRecord[]): Promise<void> {
    return gdSetDns(domain, records)
  }

  async pointToVercel(domain: string): Promise<void> {
    return gdPointToVercel(domain)
  }
}
