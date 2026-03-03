// src/app/api/debug/tenant/route.ts
// Returns the resolved tenant config for the current request.
// Admin-only — uses the same requirePermission guard as other admin routes.
// NOTE: databaseUrl is intentionally excluded for security.
// Sprint 34: reports `resolvedFrom` field ("tenants_table" | "registry_fallback").

import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permissions";
import { getTenantWithSource } from "@/lib/tenant/server";

export async function GET() {
  // Enforce admin auth — throws 401/403 if caller lacks permission.
  await requirePermission("manage_settings");

  const result = await getTenantWithSource();

  if (!result) {
    return NextResponse.json(
      { error: "Tenant resolution failed — no valid tenant slug in request headers" },
      { status: 404 }
    );
  }

  const { config: tenant, source } = result;

  return NextResponse.json({
    slug: tenant.slug,
    name: tenant.name,
    companyName: tenant.companyName,
    dashboardUrl: tenant.dashboardUrl,
    hasDatabaseUrl: !!tenant.databaseUrl,
    active: tenant.active,
    resolvedFrom: source,
  });
}
