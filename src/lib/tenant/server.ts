// src/lib/tenant/server.ts
// Server-side tenant utilities — safe to import in API routes and Server Components.
// DO NOT import in client components.

import { headers } from "next/headers";
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
