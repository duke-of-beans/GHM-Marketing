// src/app/api/debug/tenant/route.ts
// Returns the resolved tenant config for the current request.
// Admin-only — uses the same requirePermission guard as other admin routes.
// NOTE: databaseUrl is intentionally excluded for security.

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requirePermission } from "@/lib/auth/permissions";
import { getTenant } from "@/lib/tenant/server";

export async function GET() {
  // Enforce admin auth — throws 401/403 if caller lacks permission.
  await requirePermission("manage_settings");

  const headerStore = await headers();
  const resolvedFrom = headerStore.get("host") ?? "unknown";

  const tenant = await getTenant();

  // getTenant() always returns a tenant after hardening, but guard for safety.
  if (!tenant) {
    return NextResponse.json(
      { error: "Tenant resolution failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    slug: tenant.slug,
    name: tenant.name,
    companyName: tenant.companyName,
    dashboardUrl: tenant.dashboardUrl,
    hasDatabaseUrl: !!tenant.databaseUrl,
    active: tenant.active,
    resolvedFrom,
  });
}
