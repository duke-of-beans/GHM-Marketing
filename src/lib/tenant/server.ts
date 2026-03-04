// src/lib/tenant/server.ts
// Server-side tenant utilities — safe to import in API routes and Server Components.
// DO NOT import in client components.
//
// Sprint 34: getTenant() reads from DB (Tenant table) with 5-min in-memory cache.
// TENANT_REGISTRY kept as deprecated fallback — will be removed once DB path is stable.

import { headers } from "next/headers";
import { PrismaClient } from "@prisma/client";
import { TENANT_HEADER, TENANT_REGISTRY } from "./index";
import type { TenantConfig } from "./config";
import { AFFILIATE_TERMINOLOGY } from "./config";
import type { TenantProviderConfig } from "@/lib/providers/types";

// ── In-memory tenant cache (slug → TenantConfig, 5-min TTL) ────────────────

const _tenantCache = new Map<string, { config: TenantConfig; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

// Platform-level prisma client (meta-DB; currently the GHM Neon DB until INFRA-002)
import { prisma } from "@/lib/prisma";

/**
 * Resolve a TenantConfig by slug. Reads from the `tenants` table first,
 * falls back to TENANT_REGISTRY if the DB query fails (e.g. table missing).
 * Returns null if the slug is not found in either source.
 */
async function getTenantBySlug(slug: string): Promise<{ config: TenantConfig; source: "tenants_table" | "registry_fallback" } | null> {
  const now = Date.now();
  const cached = _tenantCache.get(slug);
  if (cached && cached.expiresAt > now) {
    return { config: cached.config, source: "tenants_table" };
  }

  try {
    const row = await prisma.tenant.findUnique({ where: { slug } });
    if (row && row.active) {
      const config: TenantConfig = {
        slug: row.slug,
        name: row.name,
        companyName: row.companyName,
        companyTagline: row.companyTagline ?? undefined,
        fromEmail: row.fromEmail,
        fromName: row.fromName,
        supportEmail: row.supportEmail,
        dashboardUrl: row.dashboardUrl,
        databaseUrl: row.databaseUrl ?? undefined,
        logoUrl: row.logoUrl ?? undefined,
        primaryColor: row.primaryColor ?? undefined,
        aiContext: row.aiContext ?? undefined,
        providers: (row.providers as Partial<TenantProviderConfig>) ?? undefined,
        verticalType: (row.verticalType as TenantConfig['verticalType']) ?? undefined,
        active: row.active,
      };
      _tenantCache.set(slug, { config, expiresAt: now + CACHE_TTL_MS });
      return { config, source: "tenants_table" };
    }
  } catch (err) {
    // DB query failed (table missing, connection error, etc.)
    // Fall through to registry fallback.
    console.warn(`[getTenantBySlug] DB lookup failed for "${slug}", trying registry fallback:`, err);
  }

  // Deprecated fallback — TENANT_REGISTRY in config.ts
  const registryTenant = TENANT_REGISTRY[slug];
  if (registryTenant && registryTenant.active) {
    return { config: registryTenant, source: "registry_fallback" };
  }

  return null;
}

/**
 * Read the current tenant from the request headers injected by middleware.
 * Returns null on the root domain (landing page), if the header is missing,
 * or if the slug does not match any known tenant.
 *
 * Sprint 34: NO GHM fallback. Unknown slugs return null. GHM has no special status.
 *
 * Usage in a Server Component:
 *   const tenant = await getTenant();
 *
 * Usage in an API Route:
 *   const tenant = await getTenant();
 *   if (!tenant) return new Response("Unknown tenant", { status: 400 });
 */
export async function getTenant(): Promise<TenantConfig | null> {
  const headerStore = await headers();
  const slug = headerStore.get(TENANT_HEADER);

  if (slug) {
    const result = await getTenantBySlug(slug);
    if (result) return result.config;
  }

  // No valid slug found — return null. Caller decides what to do.
  // DO NOT fall back to GHM. GHM has no special status.
  return null;
}

/**
 * Like getTenant() but also returns the resolution source for debug/telemetry.
 * Used by /api/debug/tenant.
 */
export async function getTenantWithSource(): Promise<{ config: TenantConfig; source: "tenants_table" | "registry_fallback" } | null> {
  const headerStore = await headers();
  const slug = headerStore.get(TENANT_HEADER);
  if (!slug) return null;
  return getTenantBySlug(slug);
}

/**
 * Like getTenant() but throws if tenant is missing.
 * Use in routes that must always be tenant-scoped.
 */
export async function requireTenant(): Promise<TenantConfig> {
  const tenant = await getTenant();
  if (!tenant) {
    throw new Error(
      "No tenant context. This route must be accessed via a tenant subdomain."
    );
  }
  return tenant;
}

// ── Per-tenant Prisma client ──────────────────────────────────────────────────

// Singleton cache — one PrismaClient per unique DB URL.
// Prevents connection pool exhaustion across hot-reloads and concurrent requests.
const _tenantClientCache = new Map<string, PrismaClient>();

/**
 * Returns a PrismaClient scoped to the given tenant's database.
 *
 * If tenant.databaseUrl is set, connects to that database.
 * If not set, falls back to DATABASE_URL (current default — Easter Agency's DB).
 *
 * This is the sole mechanism for per-tenant DB routing in COVOS Phase 1.
 * Each tenant gets a separate Neon project — no tenantId columns, no row-level
 * filtering, no risk of data bleed between tenants.
 *
 * Usage:
 *   const tenant = await requireTenant();
 *   const db = getTenantPrismaClient(tenant);
 *   const clients = await db.clientProfile.findMany();
 *
 * DO NOT instantiate PrismaClient directly in API routes.
 */
export function getTenantPrismaClient(tenant: TenantConfig): PrismaClient {
  const url = tenant.databaseUrl ?? process.env.DATABASE_URL!;
  if (!_tenantClientCache.has(url)) {
    _tenantClientCache.set(
      url,
      new PrismaClient({ datasources: { db: { url } } })
    );
  }
  return _tenantClientCache.get(url)!;
}

// ── Terminology Resolver ──────────────────────────────────────────────────────

/**
 * Default SEO-agency terminology used by GHM and any tenant without a vertical override.
 */
const DEFAULT_TERMINOLOGY = {
  client: 'Client',
  clients: 'Clients',
  clientSingular: 'client',
  lead: 'Lead',
  leads: 'Leads',
  pipeline: 'Pipeline',
  rep: 'Rep',
  reps: 'Reps',
  partner: 'Partner',
  partners: 'Partners',
  clientHealth: 'Client Health',
  newClient: 'Add Client',
  workOrder: 'Work Order',
} as const;

export type TenantTerminology = typeof DEFAULT_TERMINOLOGY | typeof AFFILIATE_TERMINOLOGY;

/**
 * Returns the terminology set for a given tenant config.
 * Affiliate portfolio tenants get affiliate-specific labels.
 * All other tenants (SEO agency, generic, undefined) get the default labels.
 */
export function getTenantTerminology(tenant: TenantConfig): TenantTerminology {
  if (tenant.verticalType === 'affiliate_portfolio') {
    return AFFILIATE_TERMINOLOGY;
  }
  return DEFAULT_TERMINOLOGY;
}
