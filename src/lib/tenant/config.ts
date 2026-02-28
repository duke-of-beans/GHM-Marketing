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
