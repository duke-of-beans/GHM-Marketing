// src/lib/tenant/config.ts
// Tenant registry — maps subdomain slug to tenant configuration.
// Currently file-based; migrate to DB table when tenant count exceeds ~10.

import type { TenantProviderConfig } from '@/lib/providers/types'

export interface TenantConfig {
  // Core identity
  slug: string;           // Subdomain identifier (e.g. "ghm")
  name: string;           // Short display name: "GHM Digital Marketing"
  companyName: string;    // Full legal entity: "GHM Digital Marketing Inc"
  companyTagline?: string; // Footer/subheading: "Digital Marketing Solutions"

  // Vertical type — determines module set and terminology
  verticalType?: 'seo_agency' | 'affiliate_portfolio' | 'generic';

  // Email
  fromEmail: string;      // Outbound from address: "noreply@ghmmarketing.com"
  fromName: string;       // From display name: "GHM Marketing"
  supportEmail: string;   // Contact/help links: "support@ghmdigital.com"

  // URLs
  dashboardUrl: string;   // Base app URL: "https://ghm.covos.app"

  // AI
  aiContext?: string;     // Injected into AI system prompts as platform description

  // Branding (future use — read from GlobalSettings for now)
  logoUrl?: string;
  primaryColor?: string;

  // Infrastructure
  databaseUrl?: string;   // Override DATABASE_URL for this tenant
  active: boolean;

  // Wave accounting (per-tenant)
  waveBusinessId?: string;  // Wave business ID for this tenant
  // waveApiKey is read from process.env[`WAVE_API_KEY_${slug.toUpperCase()}`]
  // e.g. WAVE_API_KEY_GHM, WAVE_API_KEY_EASTER — never stored in config

  // Vendors
  /** Vendor provider selection. Omit a key to use the platform default. */
  providers?: Partial<TenantProviderConfig>;
}

// Platform defaults — used when a tenant doesn't specify a provider.
// Change here to change the default for all new tenants.
export const DEFAULT_PROVIDERS: TenantProviderConfig = {
  accounting: 'wave',
  domain:     'godaddy',
  payroll:    'wave',
  email:      'resend',
};

// Registry of all known tenants.
// Add new client here when onboarded.
export const TENANT_REGISTRY: Record<string, TenantConfig> = {
  ghm: {
    slug: "ghm",
    name: "GHM Digital Marketing",
    companyName: "GHM Digital Marketing Inc",
    companyTagline: "Digital Marketing Solutions",
    fromEmail: "noreply@ghmmarketing.com",
    fromName: "GHM Marketing",
    supportEmail: "support@ghmdigital.com",
    dashboardUrl: "https://ghm.covos.app",
    aiContext: "enterprise SEO services platform for local businesses",
    active: true,
    providers: {
      accounting: 'wave',
      domain:     'godaddy',
      payroll:    'wave',
      email:      'resend',
    },
  },
  covosdemo: {
    slug: "covosdemo",
    name: "COVOS Demo",
    companyName: "COVOS Demo Agency",
    companyTagline: "Powered by COVOS",
    fromEmail: "noreply@covos.app",
    fromName: "COVOS Demo",
    supportEmail: "support@covos.app",
    dashboardUrl: "https://covosdemo.covos.app",
    databaseUrl: process.env.COVOS_TEST_DATABASE_URL,
    logoUrl: "/logos/covos.png",
    active: true,
    providers: {
      accounting: 'wave',
      domain:     'godaddy',
      payroll:    'wave',
      email:      'resend',
    },
  },
};

// Subdomains that are NOT tenants — reserved for platform use.
export const RESERVED_SUBDOMAINS = new Set([
  "www",
  "app",
  "api",
  "admin",
  "status",
  "mail",
  "docs",
]);

/**
 * Resolve tenant config from a hostname.
 * Returns null if not a valid tenant subdomain.
 *
 * Examples:
 *   ghm.covos.app       → TenantConfig { slug: "ghm", ... }
 *   covos.app           → null  (root domain — landing page)
 *   www.covos.app       → null  (reserved)
 *   unknown.covos.app   → null  (not in registry)
 */
export function getTenantFromHost(host: string): TenantConfig | null {
  // Strip port if present (localhost:3000)
  const hostname = host.split(":")[0];

  // Must end with covos.app to be a tenant subdomain
  const ROOT_DOMAIN = process.env.ROOT_DOMAIN ?? "covos.app";

  const isSubdomain =
    hostname.endsWith(`.${ROOT_DOMAIN}`) ||
    hostname.endsWith(".localhost"); // local dev support

  if (!isSubdomain) return null;

  const parts = hostname.split(".");
  if (parts.length < 2) return null;

  const slug = parts[0].toLowerCase();

  if (RESERVED_SUBDOMAINS.has(slug)) return null;

  const tenant = TENANT_REGISTRY[slug];
  if (!tenant || !tenant.active) return null;

  return tenant;
}

// ── Affiliate Vertical Configuration ─────────────────────────────────────────

/**
 * Module toggle defaults for the affiliate_portfolio vertical.
 * Core affiliate operations ON; SEO agency modules OFF.
 */
export const AFFILIATE_MODULE_DEFAULTS = {
  // ON — core affiliate operations
  sitePortfolio: true,
  contentCalendar: true,
  taskManagement: true,
  acquisitionPipeline: true,
  affiliateProgramRegistry: true,
  displayAdNetworks: true,
  revenueDashboard: true,
  portfolioIntelligence: true,
  siteValuation: true,
  vault: true,
  teamManagement: true,
  reporting: true,
  // OFF — SEO agency modules not needed for affiliate ops
  waveBilling: false,
  partnerManagement: false,
  googleBusinessProfile: false,
  googleAds: false,
  workOrders: false,
  proposals: false,
  clientPortal: false,
  territories: false,
  timeTracking: false,
  leadPipeline: false,
} as const;

/**
 * Terminology overrides for the affiliate_portfolio vertical.
 * Maps generic SEO-agency labels to affiliate-specific equivalents.
 */
export const AFFILIATE_TERMINOLOGY = {
  client: 'Site',
  clients: 'Sites',
  clientSingular: 'site',
  lead: 'Target',
  leads: 'Targets',
  pipeline: 'Acquisition Pipeline',
  rep: 'Content Manager',
  reps: 'Content Managers',
  partner: 'Contractor',
  partners: 'Contractors',
  clientHealth: 'Site Health',
  newClient: 'Add Site',
  workOrder: null,
} as const;

export type AffiliateTerminology = typeof AFFILIATE_TERMINOLOGY;
