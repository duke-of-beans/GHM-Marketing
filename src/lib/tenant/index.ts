// src/lib/tenant/index.ts
// Public API for the tenant module.

export { getTenantFromHost, TENANT_REGISTRY, RESERVED_SUBDOMAINS } from "./config";
export type { TenantConfig } from "./config";

// Header name injected by middleware — read this in server components / API routes.
export const TENANT_HEADER = "x-tenant-slug";
