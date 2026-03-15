// src/lib/tenant/cron-guard.ts
// SEC-004-FOLLOWUP — Multi-tenant shared-DB guard for cron jobs.
//
// COVOS uses per-tenant Neon databases as the primary isolation boundary.
// Cron jobs that query tenant-specific models (clientProfile, invoiceRecord, etc.)
// via the shared `prisma` client are safe on the current deployment because only
// one tenant (GHM) uses the primary DATABASE_URL. A second shared-DB tenant would
// cause cross-tenant data mixing in these crons.
//
// assertSingleSharedDbTenant() must be called at the top of any cron that:
//   - queries clientProfile, invoiceRecord, or other tenant-scoped models
//   - uses the shared `prisma` from @/lib/db (not a tenant-specific client)
//
// If a second tenant is onboarded without their own databaseUrl, this guard
// halts the cron and logs the issue, preventing silent cross-tenant data mixing.
// The full fix (per-tenant prisma iteration) is tracked in BACKLOG.md as SEC-004-FOLLOWUP.

import { prisma } from "@/lib/prisma";
import { log } from "@/lib/logger";

export interface CronGuardResult {
  safe: boolean;
  tenantCount: number;
  tenantSlugs: string[];
}

/**
 * Check whether the shared primary DB is currently used by more than one active tenant.
 * Returns a result object — callers decide how to handle (log, return error, etc.).
 */
export async function checkSharedDbTenantCount(): Promise<CronGuardResult> {
  try {
    const sharedTenants = await prisma.tenant.findMany({
      where: { databaseUrl: null, active: true },
      select: { slug: true },
    });
    return {
      safe: sharedTenants.length <= 1,
      tenantCount: sharedTenants.length,
      tenantSlugs: sharedTenants.map((t) => t.slug),
    };
  } catch {
    // If tenants table doesn't exist yet, we're on a single-tenant deployment — safe.
    return { safe: true, tenantCount: 1, tenantSlugs: ["unknown"] };
  }
}

/**
 * Asserts that only one tenant shares the primary DB.
 * Returns an error response payload if the assertion fails, null if safe.
 * Usage: const guard = await assertSingleSharedDbTenant("cron-name");
 *        if (guard) return NextResponse.json(guard, { status: 503 });
 */
export async function assertSingleSharedDbTenant(
  cronName: string
): Promise<{ error: string; tenants: string[] } | null> {
  const result = await checkSharedDbTenantCount();
  if (!result.safe) {
    log.error(
      { cron: cronName, tenants: result.tenantSlugs },
      `SEC-004-FOLLOWUP: ${cronName} halted — ${result.tenantCount} tenants share the primary DB. ` +
        "Per-tenant iteration required before this cron can run safely. See BACKLOG.md."
    );
    return {
      error: `Multi-tenant shared DB detected. ${cronName} requires per-tenant iteration. See BACKLOG.md SEC-004-FOLLOWUP.`,
      tenants: result.tenantSlugs,
    };
  }
  return null;
}
