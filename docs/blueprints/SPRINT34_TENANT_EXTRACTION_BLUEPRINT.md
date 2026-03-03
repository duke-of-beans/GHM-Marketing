# SPRINT 34 BLUEPRINT — GHM → TENANT EXTRACTION
**Created:** March 2, 2026
**Status:** READY TO EXECUTE
**Estimated:** 1 session (Cowork)
**Goal:** COVOS is the platform. GHM is a tenant. Zero GHM fingerprints in platform identity layer.

---

## DONE CRITERIA

The sprint is complete when ALL of the following are true:

1. `getTenant()` returns a proper error/404 for unknown slugs — no fallback to GHM
2. `getTenantFromHost()` same — unknown subdomains → error page, not GHM content
3. Tenant registry is read from the database (`Tenant` table), not `config.ts`
4. Every GHM-specific env var is documented in TenantConfig row, not platform env vars
5. Every third-party integration that needs a COVOS-owned account has a `TODO: COVOS_ACCOUNT_NEEDED` stub
6. `THIRD_PARTY_MIGRATION.md` has code-side stubs matching every item in the checklist
7. `covosdemo.covos.app` works as before (second clean tenant)
8. `ghm.covos.app` works as before (GHM is just a tenant — no special status)
9. `npx tsc --noEmit` — zero new errors

---

## PARALLELIZATION MAP

```
PHASE 1 (parallel — no dependencies between tracks)
├── Track A: Prisma schema + meta-DB migration
├── Track B: getTenant() hardening + error states  
└── Track C: Env var audit + TenantConfig field mapping

PHASE 2 (sequential — depends on Phase 1)
└── Track D: Wire getTenant() to DB + seed GHM + covosdemo rows

PHASE 3 (sequential — depends on Phase 2)
├── Track E: Third-party integration stubs + TODO markers
└── Track F: TypeScript gate + verification
```

---

## PHASE 1 — PARALLEL TRACKS

---

### TRACK A — Prisma Schema: Tenant Table

**File:** `prisma/schema.prisma`

Add this model. Run `prisma db push` after.

```prisma
model Tenant {
  id           Int      @id @default(autoincrement())
  slug         String   @unique                        // e.g. "ghm", "covosdemo"
  name         String                                  // "GHM Digital Marketing"
  companyName  String   @map("company_name")           // "GHM Digital Marketing Inc"
  companyTagline String? @map("company_tagline")
  fromEmail    String   @map("from_email")
  fromName     String   @map("from_name")
  supportEmail String   @map("support_email")
  dashboardUrl String   @map("dashboard_url")
  databaseUrl  String?  @map("database_url")           // per-tenant Neon DB URL (encrypted)
  logoUrl      String?  @map("logo_url")
  primaryColor String?  @map("primary_color")
  aiContext    String?  @map("ai_context")
  providers    Json?                                    // Partial<TenantProviderConfig>
  securityTier String   @default("standard") @map("security_tier") // "standard" | "vault"
  active       Boolean  @default(true)
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  @@map("tenants")
}
```

**After schema push:** Write seed script `scripts/seed-tenants.ts` that inserts GHM and covosdemo rows from current `TENANT_REGISTRY` values. Run once. Verify rows exist.

---

### TRACK B — getTenant() Hardening: Remove GHM Default Privilege

**File:** `src/lib/tenant/server.ts`

Current problem — the fallback in `getTenant()`:
```typescript
// WRONG — falls back to GHM on any unknown slug
console.warn(`[getTenant] Unknown or inactive slug "${subdomain}", falling back to ghm`);
return TENANT_REGISTRY["ghm"];
```

**Replace the entire fallback block** so unknown slugs return `null`, not GHM:

```typescript
export async function getTenant(): Promise<TenantConfig | null> {
  const headerStore = await headers();
  const slug = headerStore.get(TENANT_HEADER);

  if (slug) {
    // Phase 1: still reads from in-memory registry
    // Phase 2 (Track D): this switches to DB query
    const tenant = TENANT_REGISTRY[slug];
    if (tenant && tenant.active) return tenant;
  }

  // No valid slug found — return null. Caller decides what to do.
  // DO NOT fall back to GHM. GHM has no special status.
  return null;
}
```

**File:** `src/lib/tenant/config.ts`

`getTenantFromHost()` already returns `null` for unknown slugs — that's correct. No change needed there.

**File:** `src/middleware.ts`

The middleware already redirects unknown subdomains to `covos.app?error=unknown-tenant`. Verify this handles the null case cleanly. No change needed unless the redirect target should be a proper COVOS landing or 404 page — note as TODO.

**Create error page:** `src/app/not-a-tenant/page.tsx`

Simple page: "This subdomain isn't configured. Visit covos.app to learn more." Middleware can redirect unknown slugs here instead of root domain if preferred. Mark as `TODO: COVOS_LANDING_PAGE_NEEDED` for now — middleware redirect to `covos.app?error=unknown-tenant` is acceptable short-term.

**Audit all callers of `getTenant()` that assume non-null return:**

Search: `grep -r "getTenant()" src/ --include="*.ts" --include="*.tsx"`

Every caller that does `const tenant = await getTenant(); tenant.companyName` without a null check will throw. Fix each one: either `requireTenant()` (throws) or guard with `if (!tenant) return ...`.

The safest pattern for API routes:
```typescript
const tenant = await requireTenant();
// throws if null — caught by Next.js error boundary
```

For Server Components that render public pages (landing, not-a-tenant):
```typescript
const tenant = await getTenant();
if (!tenant) redirect('/not-a-tenant');
```

---

### TRACK C — Env Var Audit

**Goal:** Every env var that belongs to GHM specifically (not COVOS platform infrastructure) gets documented and marked for migration to the `Tenant` DB row.

Run this audit:
```bash
grep -E "GHM|ghm|ghmdigital|ghmmarketing" .env.example
grep -E "WAVE_API_KEY|WAVE_BUSINESS" .env.example
grep -E "GBP_|GOOGLE_ADS|DATAFORSEO|TENOR|UNSPLASH|PEXELS" .env.example
```

**Classification:**

| Env Var | Classification | Migration Target |
|---------|---------------|-----------------|
| `DATABASE_URL` | Platform (meta-DB, post-migration) | Stays in platform env |
| `DIRECT_URL` | Platform | Stays |
| `NEXTAUTH_SECRET` | Platform | Stays |
| `ROOT_DOMAIN` | Platform | Stays |
| `BLOB_READ_WRITE_TOKEN` | Platform (INFRA-005 migration pending) | TODO: COVOS_ACCOUNT_NEEDED |
| `WAVE_API_KEY` | GHM tenant | → `Tenant.providers` JSON or AppSetting keyed by slug |
| `WAVE_BUSINESS_ID` | GHM tenant | → `Tenant` row field |
| `GBP_CLIENT_ID` | Platform OAuth app (INFRA-004 migration pending) | TODO: COVOS_ACCOUNT_NEEDED |
| `GBP_CLIENT_SECRET` | Same | TODO: COVOS_ACCOUNT_NEEDED |
| `GOOGLE_ADS_CLIENT_ID` | Platform OAuth | TODO: COVOS_ACCOUNT_NEEDED |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | Platform | TODO: COVOS_ACCOUNT_NEEDED |
| `DATAFORSEO_LOGIN` | Platform credential | TODO: COVOS_ACCOUNT_NEEDED |
| `DATAFORSEO_PASSWORD` | Platform credential | TODO: COVOS_ACCOUNT_NEEDED |
| `TENOR_API_KEY` | Platform | TODO: COVOS_ACCOUNT_NEEDED |
| `UNSPLASH_ACCESS_KEY` | Platform | TODO: COVOS_ACCOUNT_NEEDED |
| `PEXELS_API_KEY` | Platform | TODO: COVOS_ACCOUNT_NEEDED |
| `RESEND_API_KEY` | Platform (INFRA-003 migration pending) | TODO: COVOS_ACCOUNT_NEEDED |
| `FROM_EMAIL` | GHM tenant — already in TenantConfig | Remove from platform env |
| `COVOS_TEST_DATABASE_URL` | covosdemo tenant | → `Tenant.databaseUrl` row |
| `COVOS_TEST_DIRECT_URL` | covosdemo tenant | → same |
| `COVOS_TELEMETRY_ENDPOINT` | Platform | Stays |

**Add to `.env.example`** a `# TODO: COVOS_ACCOUNT_NEEDED` comment block for every credential that needs a new COVOS-owned account per `THIRD_PARTY_MIGRATION.md`.

---

## PHASE 2 — SEQUENTIAL

### TRACK D — Wire getTenant() to DB

**Depends on:** Track A (Tenant table exists and is seeded)

**File:** `src/lib/tenant/server.ts`

Replace the in-memory `TENANT_REGISTRY` lookup with a DB query + in-memory cache:

```typescript
import { prisma } from '@/lib/prisma'; // platform-level prisma (meta-DB, post-migration; or current DB for now)

// In-memory cache: slug → TenantConfig. TTL 5 minutes.
const _tenantCache = new Map<string, { config: TenantConfig; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

async function getTenantBySlug(slug: string): Promise<TenantConfig | null> {
  const now = Date.now();
  const cached = _tenantCache.get(slug);
  if (cached && cached.expiresAt > now) return cached.config;

  const row = await prisma.tenant.findUnique({ where: { slug, active: true } });
  if (!row) return null;

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
    active: row.active,
  };

  _tenantCache.set(slug, { config, expiresAt: now + CACHE_TTL_MS });
  return config;
}

export async function getTenant(): Promise<TenantConfig | null> {
  const headerStore = await headers();
  const slug = headerStore.get(TENANT_HEADER);
  if (!slug) return null;
  return getTenantBySlug(slug);
}
```

**Keep `TENANT_REGISTRY` in `config.ts` for now** as a fallback during transition — but `getTenant()` no longer uses it as the primary source. It can be deprecated and removed in a follow-up sprint once the DB path is verified stable.

**Note on prisma instance:** Until INFRA-002 (meta-DB) is provisioned, this query hits the existing GHM Neon DB. That's fine — the `tenants` table lives there for now. Post-INFRA-002 it moves to the dedicated meta-DB and the prisma instance URL is updated. Zero code change required.

---

## PHASE 3 — PARALLEL AFTER TRACK D

### TRACK E — Third-Party Integration Stubs

For every integration in `THIRD_PARTY_MIGRATION.md` that currently reads from platform env vars but should eventually be per-tenant or COVOS-owned, add a `TODO` comment at the point of use.

**Pattern:**
```typescript
// TODO: COVOS_ACCOUNT_NEEDED — T-005 Tenor
// Current: reads TENOR_API_KEY from platform env (registered under GHM)
// Target: COVOS Platform Tenor API key
// Track: THIRD_PARTY_MIGRATION.md → T-005
const tenorKey = process.env.TENOR_API_KEY;
```

**Files to annotate:**

| File | Integration | Migration Item |
|------|------------|---------------|
| `src/app/api/gif-search/route.ts` | Tenor | T-005 |
| `src/app/api/stock-photos/route.ts` | Unsplash + Pexels | T-006, T-007 |
| `src/lib/wave/client.ts` (or equivalent) | Wave | T-001 |
| `src/app/api/oauth/gbp/route.ts` | GBP OAuth | T-002, INFRA-004 |
| `src/app/api/google-ads/` | Google Ads | T-003, INFRA-004 |
| `src/lib/dataforseo/` | DataForSEO | T-004 |
| `src/app/api/vault/upload/route.ts` | Vercel Blob | INFRA-005 |
| Resend calls in `src/lib/email/index.ts` | Resend | INFRA-003 |

Each TODO is a 2-line comment — no behavior change. This sprint is about documentation, not breaking anything.

---

### TRACK F — TypeScript Gate + Verification

```bash
npx tsc --noEmit
```

Expected: 5 pre-existing errors only (basecamp/dotenv scripts). Zero new errors.

**Spot checks:**
- `curl https://ghm.covos.app/api/debug/tenant` → `slug:"ghm"`, `resolvedFrom:"tenants_table"` (update debug endpoint to report source)
- `curl https://covosdemo.covos.app/api/debug/tenant` → `slug:"covosdemo"`, `hasDatabaseUrl:true`
- `curl https://unknown.covos.app/` → redirects to `covos.app?error=unknown-tenant` (not GHM content)

**Update `/api/debug/tenant`** to add `resolvedFrom` field that reports `"tenants_table"` vs `"registry_fallback"` so we can confirm DB path is live.

---

## FILE CHANGE SUMMARY

| File | Change | Track |
|------|--------|-------|
| `prisma/schema.prisma` | Add `Tenant` model | A |
| `scripts/seed-tenants.ts` | Seed GHM + covosdemo rows | A |
| `src/lib/tenant/server.ts` | Remove GHM fallback, add DB query + cache | B → D |
| `src/app/not-a-tenant/page.tsx` | New error page (minimal) | B |
| `.env.example` | TODO comments for all COVOS_ACCOUNT_NEEDED items | C |
| `src/app/api/gif-search/route.ts` | TODO stub | E |
| `src/app/api/stock-photos/route.ts` | TODO stub | E |
| Wave client | TODO stub | E |
| GBP OAuth route | TODO stub | E |
| Google Ads routes | TODO stub | E |
| DataForSEO lib | TODO stub | E |
| Vault upload route | TODO stub | E |
| Email lib | TODO stub | E |
| `src/app/api/debug/tenant` | Add `resolvedFrom` field | F |

**Schema change:** `prisma db push` (never `migrate dev`)
**New seed script:** `npx tsx scripts/seed-tenants.ts`
**TypeScript:** zero new errors

---

## WHAT THIS SPRINT DOES NOT DO

- Does not provision COVOS infrastructure accounts (that's Sprint 34-OPS / David manual)
- Does not move the Neon meta-DB (INFRA-002 — post-manual sprint)
- Does not break GHM or covosdemo — both continue working throughout
- Does not change any UI, UX, or feature behavior
- Does not touch Wave, GBP, Ads, or DataForSEO behavior — only adds TODO comments

---

## GIT COMMIT MESSAGE

```
feat(tenant): Sprint 34 — GHM → tenant extraction

- Add Tenant model to schema (prisma db push)
- Seed GHM + covosdemo rows from TENANT_REGISTRY
- getTenant() now reads from DB with 5-min in-memory cache
- Remove GHM default privilege — unknown slugs return null
- Add not-a-tenant error page
- Annotate all third-party integrations with COVOS_ACCOUNT_NEEDED TODOs
- Update /api/debug/tenant to report resolvedFrom field
- .env.example: document all platform vs per-tenant credential split
- TypeScript: zero new errors (5 pre-existing basecamp/dotenv unaffected)

ARCH-006: GHM → tenant extraction (Layer 1 + Layer 2 code complete)
Manual ops (Layer 2 infrastructure + Layer 3 credentials): THIRD_PARTY_MIGRATION.md
```
