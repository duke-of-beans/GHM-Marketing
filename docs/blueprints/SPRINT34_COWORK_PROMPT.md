Execute Sprint 34 — GHM → Tenant Extraction per the blueprint at docs/blueprints/SPRINT34_TENANT_EXTRACTION_BLUEPRINT.md. Read it completely before writing a single line of code.

CONTEXT: COVOS is a multi-tenant SaaS platform. GHM is a tenant. The codebase currently treats GHM as the default/fallback tenant — that needs to end. This sprint makes COVOS the platform and GHM just another row in a database.

MANDATORY READS BEFORE ANY WORK:
1. docs/blueprints/SPRINT34_TENANT_EXTRACTION_BLUEPRINT.md — the full execution plan
2. src/lib/tenant/config.ts — current TENANT_REGISTRY (what's being replaced)
3. src/lib/tenant/server.ts — getTenant() (what's being hardened)
4. src/middleware.ts — tenant detection (verify null handling)
5. prisma/schema.prisma — for the Tenant model addition
6. docs/THIRD_PARTY_MIGRATION.md — what gets a TODO stub

EXECUTION ORDER (follow exactly):

PHASE 1 — run all three tracks in parallel:

Track A: Add Tenant model to prisma/schema.prisma. Run `prisma db push`. Write scripts/seed-tenants.ts that inserts GHM and covosdemo rows from current TENANT_REGISTRY values. Run it. Verify both rows exist.

Track B: Harden getTenant() in server.ts — remove the GHM fallback entirely. Unknown slugs return null. No tenant has default privilege. Create src/app/not-a-tenant/page.tsx (minimal — "This subdomain isn't configured. Visit covos.app."). Audit every getTenant() caller with grep, fix any that assume non-null without a guard.

Track C: Run the env var audit from the blueprint. Classify every env var as platform vs GHM-tenant vs needs-COVOS-account. Update .env.example with TODO: COVOS_ACCOUNT_NEEDED comments for every third-party credential that needs a new COVOS-owned account. Do not change any actual values — documentation only.

PHASE 2 — after Phase 1 complete:

Track D: Wire getTenant() to the Tenant DB table with a 5-minute in-memory cache. Replace the TENANT_REGISTRY in-memory lookup with a prisma.tenant.findUnique() call. Keep TENANT_REGISTRY in config.ts as deprecated fallback — do not delete it yet. Update /api/debug/tenant to add a resolvedFrom field that reports "tenants_table" vs "registry_fallback".

PHASE 3 — after Track D complete, run parallel:

Track E: Add TODO: COVOS_ACCOUNT_NEEDED stub comments to every third-party integration file listed in the blueprint (gif-search, stock-photos, Wave client, GBP OAuth, Google Ads, DataForSEO, vault upload, email lib). Two-line comment per location. No behavior changes.

Track F: npx tsc --noEmit. Expected: 5 pre-existing errors only. Zero new errors. Verify spot checks: ghm.covos.app/api/debug/tenant returns resolvedFrom:"tenants_table". covosdemo.covos.app/api/debug/tenant returns hasDatabaseUrl:true. An unknown subdomain redirects correctly, not to GHM content.

CONSTRAINTS:
- Never run prisma migrate dev — use prisma db push only
- Zero new TypeScript errors — fix every error introduced before closing the sprint
- GHM must continue working throughout — ghm.covos.app is not broken at any point
- covosdemo must continue working throughout
- No UI changes, no feature behavior changes, no schema changes beyond the Tenant model
- This sprint does not provision any external accounts — only TODO stubs

CLOSE THE SPRINT:
When all tracks are complete and TypeScript is clean:
1. Update STATUS.md — add Sprint 34 complete entry
2. Add Sprint 34 to CHANGELOG.md
3. Update BACKLOG.md — close Sprint 34, confirm Sprint 34-OPS is next for David
4. Git: sync, commit, push with the commit message from the blueprint
