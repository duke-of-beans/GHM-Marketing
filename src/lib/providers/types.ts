/**
 * src/lib/providers/types.ts
 *
 * Vendor-agnostic provider interfaces for all external integrations.
 *
 * RULE: No code outside src/lib/providers/ imports Wave, GoDaddy, Resend, or
 * Gusto directly. Everything goes through these interfaces + the registry.
 *
 * Adding a new vendor = implement the interface, add to registry.
 * Switching vendors for a tenant = change providers config in TENANT_REGISTRY.
 */

// ─── Accounting / AR / AP ────────────────────────────────────────────────────

export interface InvoiceLineItem {
  /** Provider-native product/service ID */
  productId: string
  description?: string
  quantity: number
  unitPrice: number // decimal dollars
}

export interface NormalizedInvoice {
  id: string
  invoiceNumber: string
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled'
  totalRaw: number
  amountDueRaw: number
  amountPaidRaw: number
  currency: string
  invoiceDate: string   // ISO date
  dueDate: string       // ISO date
  viewUrl: string
  pdfUrl: string | null
  customerId: string | null
}

export interface NormalizedBill {
  id: string
  billNumber: string | null
  status: string
  totalRaw: number
  amountDueRaw: number
  invoiceDate: string
  dueDate: string | null
  vendorId: string | null
}

export interface AccountingProvider {
  readonly name: string

  /** Create an AR invoice for a client. Returns normalized invoice. */
  createInvoice(params: {
    externalCustomerId: string  // provider's customer ID (e.g. Wave customer ID)
    lineItems: InvoiceLineItem[]
    invoiceDate: string         // YYYY-MM-DD
    dueDate: string
    memo?: string
  }): Promise<NormalizedInvoice>

  /** Send a previously created invoice to the customer. */
  sendInvoice(externalInvoiceId: string): Promise<boolean>

  /** Fetch a single invoice by provider-native ID. */
  getInvoice(externalInvoiceId: string): Promise<NormalizedInvoice | null>

  /** List all invoices for a given customer. */
  listInvoicesForCustomer(
    externalCustomerId: string,
    page?: number,
    pageSize?: number,
  ): Promise<NormalizedInvoice[]>

  /** Create an AP bill (contractor payout). */
  createBill(params: {
    externalVendorId: string
    amount: number
    description: string
    invoiceDate: string
    dueDate?: string
    billNumber?: string
  }): Promise<NormalizedBill>
}

// ─── Domain / Hosting ────────────────────────────────────────────────────────

export interface DomainSearchResult {
  domain: string
  available: boolean
  priceCents: number
  currency: string
  periodYears: number
}

export interface DnsRecord {
  type: string    // A | CNAME | TXT | MX
  name: string    // '@' for root
  data: string    // IP or target
  ttl?: number
}

export interface DomainProvider {
  readonly name: string

  /** Check availability + pricing for a domain or keyword. */
  searchDomains(query: string): Promise<DomainSearchResult[]>

  /** Purchase a domain. Returns order ID. */
  purchaseDomain(domain: string, contact: {
    firstName: string
    lastName: string
    email: string
    phone: string
    address1: string
    city: string
    state: string
    postalCode: string
    country: string
  }): Promise<{ orderId: string | number }>

  /** Get current DNS records for a domain. */
  getDnsRecords(domain: string): Promise<DnsRecord[]>

  /** Replace DNS records for a domain. */
  setDnsRecords(domain: string, records: DnsRecord[]): Promise<void>

  /** Point domain to Vercel (convenience wrapper). */
  pointToVercel(domain: string): Promise<void>
}

// ─── Payroll / Contractor ────────────────────────────────────────────────────

export interface NormalizedVendor {
  id: string
  name: string
  email: string | null
}

export interface PayrollProvider {
  readonly name: string

  /** Create a contractor vendor in the payroll system. */
  createVendor(params: { name: string; email?: string }): Promise<NormalizedVendor>

  /** List all vendors / contractors. */
  listVendors(): Promise<NormalizedVendor[]>

  /**
   * Create a contractor payment / bill.
   * Maps to Wave's billCreate; Gusto equivalent would be contractor payment run.
   */
  createPayment(params: {
    externalVendorId: string
    amount: number
    description: string
    paymentDate: string  // YYYY-MM-DD
    referenceId?: string
  }): Promise<{ id: string; status: string }>
}

// ─── Email ───────────────────────────────────────────────────────────────────

export interface EmailAttachment {
  filename: string
  content: Buffer
}

export interface EmailProvider {
  readonly name: string

  send(params: {
    to: string | string[]
    from: string
    replyTo?: string
    cc?: string | string[]
    subject: string
    html: string
    attachments?: EmailAttachment[]
  }): Promise<{ id?: string; error?: string }>
}

// ─── Provider config keys ────────────────────────────────────────────────────

export type AccountingProviderKey = 'wave' | 'stripe' | 'quickbooks' | 'xero'
export type DomainProviderKey     = 'godaddy' | 'namecheap' | 'cloudflare' | 'vercel'
export type PayrollProviderKey    = 'wave' | 'gusto' | 'adp'
export type EmailProviderKey      = 'resend' | 'sendgrid' | 'mailchimp'

export interface TenantProviderConfig {
  accounting:    AccountingProviderKey
  domain:        DomainProviderKey
  payroll:       PayrollProviderKey
  email:         EmailProviderKey
}
