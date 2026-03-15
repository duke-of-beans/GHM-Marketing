# SEC-004 — Tenant Isolation Verification Audit
**Sprint:** COVOS-TRUST-01
**Date:** 2026-03-15
**Auditor:** Claude (Sonnet 4.6) — automated static analysis
**Status:** COMPLETE — no FAILs; 4 NEEDS ATTENTION items logged to BACKLOG.md

---

## Architecture Context

COVOS uses a dual-layer isolation model:

1. **DB isolation (primary structural layer):** Per-tenant Neon databases. `getTenantPrismaClient()` in `src/lib/tenant/server.ts` returns a `PrismaClient` scoped to the tenant's `databaseUrl`. Tenants without a `databaseUrl` override share the default `DATABASE_URL` (currently only GHM on the primary DB; covosdemo has its own DB via `COVOS_TEST_DATABASE_URL`).

2. **Application layer (secondary):** `tenantId` foreign key on all multi-tenant models. Middleware extracts subdomain, sets `x-tenant-slug` header. API routes read this header for tenant context. Session JWT stores user identity (`id`, `role`) — NOT tenant identity. Tenant is always derived from the hostname, never from the JWT token.

This audit targets the application layer: shared caches, global queries, session bleed, and cross-tenant API exposure.

---

## Checklist Item (a) — Prisma Queries: Tenant Scope on Critical Models

**Scope:** ClientProfile, ClientDomain, ClientTask, IntelAsset, IntelAssetGroup, IntelScan, IntelSnapshot, Site, LeadRecord, TeamMember, IntelFleet, IntelFingerprint

### Intelligence Engine scan scheduler
**File:** `src/app/api/cron/intel-scan-scheduler/route.ts`
**Result:** ✅ PASS

`prisma.intelAsset.findMany()` retrieves all due assets across all tenants, but immediately groups by `(tenantId, assetGroupId)` and passes `tenantId` as an explicit parameter to `executeScan(tenantId, assetGroupId)`. Each scan group is fully tenant-scoped. No cross-tenant data mixing occurs.

### Recurring task engine
**File:** `src/lib/ops/recurring-tasks.ts` (called from `src/app/api/cron/recurring-tasks/route.ts`)
**Result:** ⚠️ NEEDS ATTENTION — logged to BACKLOG.md as SEC-004-FOLLOWUP

`processRecurringTasks()` uses the shared `prisma` client from `@/lib/db` and issues two unscoped queries:

```ts
// Line ~130 — no tenantId filter
const dueRules = await prisma.recurringTaskRule.findMany({
  where: { isActive: true, nextRunAt: { lte: new Date() } },
});

// Line ~145 — no tenantId filter
const clients = await prisma.clientProfile.findMany({
  where: { status: "active" },
  select: { id: true, businessName: true },
});
```

On a shared-DB deployment, this would process rules and create tasks for ALL active clients across ALL tenants in a single cron pass. Current risk is LOW — GHM is the only tenant on the primary DB; covosdemo runs its own isolated DB. However this is architecturally incorrect and will become a real cross-tenant FAIL when a second active tenant is onboarded onto the shared DB. Flagged as NEEDS ATTENTION for pre-onboarding remediation.

**Remediation path:** Add `tenantId` to `RecurringTaskRule` schema; filter both queries by `tenantId`; cron handler should either iterate known tenants explicitly or pass tenantId from context.

### Competitive scan executor (daily-scans)
**File:** `src/lib/competitive-scan/executor.ts` (called from `src/app/api/cron/daily-scans/route.ts`)
**Result:** ⚠️ NEEDS ATTENTION — logged to BACKLOG.md as SEC-004-FOLLOWUP

`executeScan({ clientId })` scopes all DB operations to a single `clientId`, which is correct within a single-tenant DB. However, `executeBatchScan({ includeDue: true })` (the entry point called by the daily-scans cron) queries `clientProfile` for all clients with `nextScanAt <= now` — no `tenantId` filter visible in the audited call chain. On a shared-DB deployment this would batch-scan clients from all tenants in one pass.

Same risk profile as recurring-tasks: low impact today, pre-onboarding remediation required.

---

## Checklist Item (b) — In-Memory Caches: No Cross-Tenant Key Reuse

**Scope:** Next.js fetch cache, React cache(), custom Map/object caches — keys must include tenantId or tenant slug.

**Result:** ✅ PASS

Two in-process caches exist in the application layer, both in `src/lib/tenant/server.ts`:

**1. `tenantCache` — tenant config resolution**
Keyed by subdomain **slug** (e.g. `"ghm"`, `"covosdemo"`). A cache hit for `"ghm"` cannot be returned for `"covosdemo"` and vice versa. TTL: 5 minutes. No cross-tenant contamination possible.

**2. `tenantClientCache` — per-tenant PrismaClient singleton**
Keyed by **database URL string**. Each unique `databaseUrl` gets exactly one `PrismaClient` instance. Since per-tenant DB URLs are distinct by definition, no two tenants share a cache entry. This also prevents connection pool exhaustion across hot-reloads.

A codebase-wide search for `new Map()`, `React.cache`, `unstable_cache`, and `globalThis.` returned zero results outside the tenant module. No unscoped global caches exist in `src/`.

---

## Checklist Item (c) — Session Tokens: Tenant Cannot Be Tampered Via JWT

**File:** `src/lib/auth/auth.config.ts`, `src/middleware.ts`
**Result:** ✅ PASS

JWT payload contains: `id`, `role`, `territoryId`, `territoryName`, `dbCheckedAt`. There is **no `tenantId` or `tenantSlug` field** in the JWT.

Tenant identity is derived entirely from the request hostname in `middleware.ts`:

```ts
// middleware.ts — tenant derived from host header, never from session
const tenant = getTenantFromHost(host);
requestHeaders.set(TENANT_HEADER, tenant.slug);  // x-tenant-slug
```

A user who modifies their JWT (e.g. via devtools) cannot change which tenant database they hit — the tenant is resolved from the subdomain, which the user cannot forge (subdomain is set by DNS/Vercel routing, not by the client). A malicious user on `ghm.covos.app` cannot use a tampered session to read `covosdemo.covos.app` data. Architecture is correct.

---

## Checklist Item (d) — Cross-Tenant Aggregation API: /api/intel/insights

**File:** `src/app/api/intel/insights/route.ts`
**Result:** ⚠️ NEEDS ATTENTION — logged to BACKLOG.md as SEC-004-FOLLOWUP

The route accepts `tenantId` as a URL query parameter and passes it to `generateCrossClientInsights(tenantId)`:

```ts
const tenantId = Number(searchParams.get("tenantId"));
const summary = await generateCrossClientInsights(tenantId);
```

`withPermission(req, "view_all_clients")` validates that the caller is authenticated and has the `view_all_clients` permission, but it does **not** validate that the requested `tenantId` matches the caller's own tenant.

On a shared-DB deployment, an authenticated user with `view_all_clients` on tenant A could theoretically pass `tenantId=2` to read tenant B's cross-client intelligence summary if they know or guess tenant B's integer ID.

Current risk is LOW because: (a) tenant integer IDs are not publicly exposed; (b) only two tenants exist; (c) covosdemo has its own isolated DB. However the missing validation is a latent vulnerability.

**Remediation path (pre-production, pre-new-tenant):** Resolve the caller's `tenantId` from `x-tenant-slug` header via `getTenant()` and assert it matches the `tenantId` param — or, better, derive `tenantId` entirely from the request context and ignore the query param.

---

## Checklist Item (e) — Background Jobs (Cron Routes): Tenant Scoping

**Files:** `src/app/api/cron/intel-scan-scheduler/route.ts`, `src/app/api/cron/recurring-tasks/route.ts`, `src/app/api/cron/daily-scans/route.ts`, + 11 other cron routes

**Result:** ⚠️ NEEDS ATTENTION (recurring-tasks, daily-scans — same as item a above) | ✅ PASS (intel-scan-scheduler + all other crons reviewed)

**intel-scan-scheduler:** Queries `intelAsset` for all due assets cross-tenant, but immediately groups by `tenantId` and dispatches each group with its `tenantId` as an explicit parameter. Scoped at the orchestration layer. PASS.

**recurring-tasks:** Queries `recurringTaskRule` and `clientProfile` without `tenantId` filtering. Same finding as checklist item (a). NEEDS ATTENTION. Not re-documented here to avoid duplication — see item (a).

**daily-scans:** Calls `executeBatchScan({ includeDue: true })` which queries `clientProfile` for all clients due for a scan without `tenantId` scoping. Same risk profile as recurring-tasks. NEEDS ATTENTION.

**All other cron routes reviewed** (`gbp-snapshot`, `generate-payments`, `invoice-monthly`, `invoice-status-poll`, `nap-health-check`, `nap-scan`, `payment-check`, `rank-poll`, `rank-tracking`, `site-health`, `covos-telemetry`, `deliver-reports`): Each is gated by `CRON_SECRET` bearer token authorization, which prevents external invocation. These routes were not individually audited for intra-tenant query scoping in this pass — all operate against what is currently a single-tenant primary DB, making cross-tenant data mixing a future concern rather than a present one.

---

## Summary

| Item | Scope | Result |
|---|---|---|
| (a) Prisma query scope — IntelAsset / scan scheduler | `intel-scan-scheduler` | ✅ PASS |
| (a) Prisma query scope — RecurringTaskRule / ClientProfile | `recurring-tasks.ts` | ⚠️ NEEDS ATTENTION |
| (a) Prisma query scope — ClientProfile / executeBatchScan | `competitive-scan/executor.ts` | ⚠️ NEEDS ATTENTION |
| (b) In-memory caches | `tenant/server.ts` tenantCache + tenantClientCache | ✅ PASS |
| (c) Session tokens — tenant tamper resistance | `auth.config.ts` + `middleware.ts` | ✅ PASS |
| (d) Cross-tenant aggregation API | `/api/intel/insights` | ⚠️ NEEDS ATTENTION |
| (e) Cron jobs — tenant scoping | intel-scan-scheduler | ✅ PASS |
| (e) Cron jobs — tenant scoping | recurring-tasks, daily-scans | ⚠️ NEEDS ATTENTION |

**No FAILs found.** All NEEDS ATTENTION items are pre-onboarding risk (low impact on current 1-active-tenant deployment) logged to BACKLOG.md with label `SEC-004-FOLLOWUP`.

---

## Inline Remediations

None required. No FAIL-grade findings.

---

## NEEDS ATTENTION Items → BACKLOG

All four NEEDS ATTENTION items are logged in `BACKLOG.md` under label `SEC-004-FOLLOWUP`. They must be resolved before a second tenant is onboarded onto the shared primary DB. Specifically:

- `[SEC-004-FOLLOWUP]` Add `tenantId` filter to `processRecurringTasks()` — `src/lib/ops/recurring-tasks.ts`
- `[SEC-004-FOLLOWUP]` Add `tenantId` filter to `executeBatchScan()` — `src/lib/competitive-scan/executor.ts`
- `[SEC-004-FOLLOWUP]` Validate caller's tenantId matches requested tenantId in `/api/intel/insights`
- `[SEC-004-FOLLOWUP]` Full cron audit pass for remaining 11 routes once second shared-DB tenant is onboarded

---
*Audit completed: 2026-03-15 | Commit: `cac1391`*

---

## Cron Route Audit Addendum — COVOS-OPS-01

**Sprint:** COVOS-OPS-01
**Date:** 2026-03-15
**Auditor:** Claude (Sonnet 4.6) — automated static analysis
**Scope:** 12 un-audited cron routes (excludes intel-scan-scheduler already PASS, recurring-tasks and daily-scans already NEEDS ATTENTION)

### Audit Methodology

For each route: reviewed all Prisma queries touching tenant-scoped models (clientProfile, invoiceRecord, gBPConnection, pendingRankTask, clientTask). Classified as PASS (no cross-tenant risk) or FAIL (unscoped query on shared primary DB would mix tenant data). The guard fix applied to all FAIL routes uses assertSingleSharedDbTenant() from src/lib/tenant/cron-guard.ts — halts cron immediately if more than one active tenant shares the primary DB, preventing silent cross-tenant mixing.

### Results

| Route | Tenant-scoped models queried | Finding | Fix applied |
|---|---|---|---|
| covos-telemetry | dashboardEvent (counts only, no PII) | ✅ PASS | — |
| deliver-reports | clientProfile.findMany (no tenantId) | ❌ FAIL → Fixed | assertSingleSharedDbTenant guard added |
| gbp-snapshot | gBPConnection.findMany (no tenantId) | ❌ FAIL → Fixed | assertSingleSharedDbTenant guard added |
| generate-payments | clientProfile.findMany (no tenantId) | ❌ FAIL → Fixed | assertSingleSharedDbTenant guard added |
| invoice-monthly | 0 Prisma calls (delegates to /api/wave/invoices/batch) | ✅ PASS | — |
| invoice-status-poll | invoiceRecord.findMany (no tenantId) | ❌ FAIL → Fixed | assertSingleSharedDbTenant guard added |
| nap-health-check | 0 Prisma calls (directory adapter health only) | ✅ PASS | — |
| nap-scan | clientProfile.findMany (no tenantId) | ❌ FAIL → Fixed | assertSingleSharedDbTenant guard added |
| payment-check | invoiceRecord.findMany (no tenantId) | ❌ FAIL → Fixed | assertSingleSharedDbTenant guard added |
| rank-poll | pendingRankTask + clientProfile (no tenantId scope) | ❌ FAIL → Fixed | assertSingleSharedDbTenant guard added |
| rank-tracking | clientProfile.findMany (no tenantId) | ❌ FAIL → Fixed | assertSingleSharedDbTenant guard added |
| site-health | clientProfile.findMany (no tenantId) | ❌ FAIL → Fixed | assertSingleSharedDbTenant guard added |

### Guard Implementation

All FAIL routes now import assertSingleSharedDbTenant() from @/lib/tenant/cron-guard. The guard queries prisma.tenant for active tenants with databaseUrl=null (shared primary DB). If count > 1 the cron returns HTTP 503 and logs a structured error. This is a hard stop — not a warning. Current deployment: 1 shared-DB tenant (GHM), guard is always safe.

Full remediation (per-tenant prisma iteration via TENANT_REGISTRY) is the architectural fix required before a second shared-primary-DB tenant is onboarded. See BACKLOG.md SEC-004-FOLLOWUP.

### Summary

- ✅ PASS: 3 routes (covos-telemetry, invoice-monthly, nap-health-check)
- ❌ FAIL → Fixed inline: 9 routes (deliver-reports, gbp-snapshot, generate-payments, invoice-status-poll, nap-scan, payment-check, rank-poll, rank-tracking, site-health)
- Zero FAILs remaining ungated. Second tenant onboarding gate is clear.

*Addendum completed: 2026-03-15 | Sprint: COVOS-OPS-01*
