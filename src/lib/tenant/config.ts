// src/lib/tenant/config.ts
// Tenant registry — maps subdomain slug to tenant configuration.
// Currently file-based; migrate to DB table when tenant count exceeds ~10.

export interface TenantConfig {
  slug: string;           // Subdomain identifier (e.g. "ghm")
  name: string;           // Display name
  databaseUrl?: string;   // Override DATABASE_URL for this tenant (future use)
  logoUrl?: string;       // Custom branding (future use)
  primaryColor?: string;  // Custom branding (future use)
  active: boolean;
}

// Registry of all known tenants.
// Add new client here when onboarded.
export const TENANT_REGISTRY: Record<string, TenantConfig> = {
  ghm: {
    slug: "ghm",
    name: "GHM Digital Marketing",
    active: true,
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
