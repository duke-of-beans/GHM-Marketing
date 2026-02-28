// src/lib/tenant/server.ts
// Server-side tenant utilities — safe to import in API routes and Server Components.
// DO NOT import in client components.

import { headers } from "next/headers";
import { PrismaClient } from "@prisma/client";
import { TENANT_HEADER, TENANT_REGISTRY } from "./index";
import type { TenantConfig } from "./config";

/**
 * Read the current tenant from the request headers injected by middleware.
 * Returns null on the root domain (landing page) or if the header is missing.
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
  if (!slug) return null;
  return TENANT_REGISTRY[slug] ?? null;
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
