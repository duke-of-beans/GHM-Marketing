/**
 * src/lib/providers/registry.ts
 *
 * Provider factory — resolves the correct provider implementation for a tenant.
 *
 * Usage:
 *   const accounting = getAccountingProvider('ghm')
 *   const invoice = await accounting.createInvoice({ ... })
 *
 * Adding a new vendor:
 *   1. Implement the interface in src/lib/providers/<vendor>/
 *   2. Add a case to the relevant get*Provider function below
 *   3. Add the key to the union type in types.ts
 *   4. Update TENANT_REGISTRY providers block for tenants that use it
 */

import type {
  AccountingProvider,
  DomainProvider,
  PayrollProvider,
  EmailProvider,
  AccountingProviderKey,
  DomainProviderKey,
  PayrollProviderKey,
  EmailProviderKey,
} from './types'
import { TENANT_REGISTRY, DEFAULT_PROVIDERS } from '@/lib/tenant/config'

// ─── Provider resolution ─────────────────────────────────────────────────────

export async function getAccountingProvider(tenantSlug: string): Promise<AccountingProvider> {
  const key = getProviderKey(tenantSlug, 'accounting') as AccountingProviderKey
  switch (key) {
    case 'wave': {
      const { WaveAccountingProvider } = await import('./wave/accounting')
      return new WaveAccountingProvider()
    }
    // case 'stripe':    return new StripeAccountingProvider()
    // case 'quickbooks': return new QuickBooksAccountingProvider()
    // case 'xero':      return new XeroAccountingProvider()
    default:
      throw new Error(`Accounting provider "${key}" not implemented for tenant "${tenantSlug}"`)
  }
}

export async function getDomainProvider(tenantSlug: string): Promise<DomainProvider> {
  const key = getProviderKey(tenantSlug, 'domain') as DomainProviderKey
  switch (key) {
    case 'godaddy': {
      const { GoDaddyDomainProvider } = await import('./godaddy/domain')
      return new GoDaddyDomainProvider()
    }
    // case 'namecheap':  return new NamecheapDomainProvider()
    // case 'cloudflare': return new CloudflareDomainProvider()
    // case 'vercel':     return new VercelDomainProvider()
    default:
      throw new Error(`Domain provider "${key}" not implemented for tenant "${tenantSlug}"`)
  }
}

export async function getPayrollProvider(tenantSlug: string): Promise<PayrollProvider> {
  const key = getProviderKey(tenantSlug, 'payroll') as PayrollProviderKey
  switch (key) {
    case 'wave': {
      const { WavePayrollProvider } = await import('./wave/payroll')
      return new WavePayrollProvider()
    }
    // case 'gusto': return new GustoPayrollProvider()
    // case 'adp':   return new ADPPayrollProvider()
    default:
      throw new Error(`Payroll provider "${key}" not implemented for tenant "${tenantSlug}"`)
  }
}

export async function getEmailProvider(tenantSlug: string): Promise<EmailProvider> {
  const key = getProviderKey(tenantSlug, 'email') as EmailProviderKey
  switch (key) {
    case 'resend': {
      const { ResendEmailProvider } = await import('./resend/email')
      return new ResendEmailProvider()
    }
    // case 'sendgrid':  return new SendGridEmailProvider()
    // case 'mailchimp': return new MailchimpEmailProvider()
    default:
      throw new Error(`Email provider "${key}" not implemented for tenant "${tenantSlug}"`)
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

type ProviderCategory = 'accounting' | 'domain' | 'payroll' | 'email'

function getProviderKey(tenantSlug: string, category: ProviderCategory): string {
  const tenant = TENANT_REGISTRY[tenantSlug]
  if (!tenant) throw new Error(`Unknown tenant: "${tenantSlug}"`)
  return tenant.providers?.[category] ?? DEFAULT_PROVIDERS[category]
}
