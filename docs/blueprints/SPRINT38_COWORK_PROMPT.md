# SPRINT 38 — COWORK PROMPT
**Affiliate Vertical Data Layer**
**Date:** March 3, 2026

---

You are a senior full-stack engineer working on COVOS, a multi-tenant vertical ERP platform built in Next.js 14 / TypeScript / Prisma / Neon / Tailwind.

## Your Mission

Build the complete data foundation for COVOS Vertical 2 (Affiliate / Domain Portfolio). This is a pure backend sprint — schema, migrations, API routes, module toggle config, and terminology config. No UI. No demo data. No changes to existing SEO vertical or GHM tenant.

## MANDATORY: Read These Files First

Before writing a single line of code, read these files in order:

```
prisma/schema.prisma
src/lib/tenant/config.ts
src/lib/tenant/server.ts
src/app/api/clients/route.ts
src/middleware.ts
docs/blueprints/SPRINT38_BLUEPRINT.md
docs/VERTICAL_2_AFFILIATE_STRATEGY.md
```

The blueprint is your specification. The existing files are your pattern library. Do not deviate from existing conventions.

## Work in Three Phases

### Phase 1 — Parallel Tracks (start all three simultaneously)

**Track A — Prisma Models**
Add all 6 new models to `prisma/schema.prisma` exactly as specified in the blueprint:
- `Site` with `SiteStatus` enum
- `AffiliateProgram` with `AffiliateProgramStatus` enum
- `DisplayAdNetwork` with `AdNetworkStatus` enum
- `RevenueEntry` with `RevenueSourceType` enum
- `AcquisitionTarget` with `AcquisitionStage` enum
- `AffiliateContentBrief` with `ContentType` and `BriefStatus` enums
- `SiteValuation` with `ValuationListingStatus` enum

After adding models: `npx prisma migrate dev --name affiliate-vertical-schema`
Verify: `npx prisma validate`

**Track B — Config Layer**
- Add `verticalType` field to `TenantConfig` type
- Add `AFFILIATE_MODULE_DEFAULTS` export to config file
- Add `AFFILIATE_TERMINOLOGY` export to terminology resolver
- Wire `verticalType === 'affiliate_portfolio'` into the terminology resolver so it returns affiliate terms when that vertical is active

**Track C — Content Brief Extension**
- Read the existing `Content` or `ContentBrief` model in schema carefully
- `AffiliateContentBrief` is a NEW model (not an extension of existing) — it's scoped to a `Site` not a `Client`
- Ensure no naming collisions with existing content models

### Phase 2 — API Routes (after Phase 1 migration succeeds)

Create all routes under `src/app/api/affiliate/` as specified in the blueprint.

Pattern for every route:
1. Import `withAuth` and `withPermission` from middleware
2. Resolve `tenantId` from the authenticated session — NEVER from request body
3. All queries filter by `tenantId`
4. Return proper HTTP status codes (200, 201, 400, 404, 500)
5. Wrap in try/catch

Calculated fields to compute server-side before saving:
- `RevenueEntry`: compute `rpm = (revenue / sessions) * 1000` if sessions > 0; compute `epc = revenue / clicks` if clicks > 0
- `SiteValuation`: compute `estimatedValue = monthlyNetProfit * multipleUsed` before insert
- `DisplayAdNetwork` GET response: include `qualificationProgress = (currentMonthlySessions / monthlySessionsRequired) * 100` as a virtual field in the response (do not store)
- `AffiliateContentBrief` PUT: if `currentRankingPosition` is being updated, compare to `peakRankingPosition`; if decay > 5 spots, set `refreshDue = true`; if new position is better than peak, update `peakRankingPosition`

### Phase 3 — Gate + Close

**Track G — TypeScript Gate**
Run `npx tsc --noEmit`
Zero new errors allowed in any Sprint 38 file. Pre-existing errors in untouched files are acceptable — document count.

**Track H — Sprint Close**
Update these files:
- `CHANGELOG.md` — add Sprint 38 entry with date, commit hash, summary of all changes
- `STATUS.md` — update Last Updated line, note Sprint 38 shipped, Sprint 39 next
- `BACKLOG.md` — mark Sprint 38 row as ✅ SHIPPED with commit hash

Then: `git add -A && git commit -m "Sprint 38: Affiliate vertical data layer — 6 new models, module/terminology config, full API routes" && git push origin main`

## Quality Gates

- [ ] `npx prisma validate` passes
- [ ] `npx prisma migrate dev` succeeds with no warnings
- [ ] All API routes return correct tenant-scoped data
- [ ] Zero new TypeScript errors
- [ ] All 6 models have working list + get + create + update + delete routes
- [ ] Module toggle config exports cleanly
- [ ] Terminology config resolves correctly for `affiliate_portfolio` vertical type
- [ ] Sprint close committed and pushed

## Constraints

- Do NOT modify existing models (Client, Lead, ContentBrief if it exists, etc.)
- Do NOT modify GHM tenant config or SEO vertical config
- Do NOT add UI components — this is data layer only
- Do NOT add demo/seed data — Sprint 40 handles that
- Do NOT use `any` type in TypeScript — infer properly from Prisma generated types
- ALWAYS scope queries to `tenantId` — never return cross-tenant data
