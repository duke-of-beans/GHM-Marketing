# COVOS EXTRACTION AUDIT
**Version:** 1.0.0
**Date:** February 26, 2026
**Author:** Claude (session audit)
**Scope:** Full coupling analysis of GHM Dashboard codebase ahead of COVOS entity go-live (~2 weeks)

---

## PURPOSE

This document is the prerequisite for Sprints 27–29. It answers five questions:

1. Where is GHM hardcoded in the codebase, and what category is each reference?
2. What fields does `TenantConfig` need that it doesn't have?
3. Which DB tables are tenant-isolated vs. global? What needs `tenantId`?
4. Which infrastructure services are platform-owned vs. tenant-owned?
5. How do we group all extraction work into non-overlapping file sets for parallel Cowork execution?

Nothing in Sprint 28 or 29 should be built without first reading this document.

---

## 1. TENANT COUPLING AUDIT

### Category System

- **A — Already behind tenant config:** Reads from `TENANT_REGISTRY` or env var. Works for any tenant today.
- **B — Needs extraction:** Hardcoded GHM string that must move behind `TenantConfig` before a second tenant goes live.
- **C — Legitimately tenant data:** GHM-specific business configuration (commission rules, territory definitions, personnel IDs). Lives in DB or TenantConfig as data, not code. Not a codebase defect.
- **Comment-only:** File header comments saying "GHM Dashboard." No runtime impact. Low priority cleanup.

---

### Category A — Already Correct

These work for any tenant right now. No changes needed.

| File | What's correct |
|------|----------------|
| `src/lib/tenant/config.ts` | `getTenantFromHost()` reads `TENANT_REGISTRY` dynamically. Adding a tenant = add one entry. |
| `src/lib/tenant/server.ts` | `getTenant()` / `requireTenant()` read from injected header, not hardcoded. |
| `src/lib/tenant/index.ts` | Public module exports, no hardcoding. |
| `src/hooks/use-tenant.ts` | Client hook reads from server-injected context. |
| `src/middleware.ts` | Subdomain detection reads `TENANT_REGISTRY`, rejects unknown slugs. |
| `src/lib/providers/` | Vendor provider registry and adapters — tenant-configurable via `providers` block in `TENANT_REGISTRY`. |
| `src/lib/telemetry/covos.ts` | SHA-256 hashes tenant slug before transmitting. No PII. |
| `src/app/api/public/branding/route.ts` | Reads from `GlobalSettings` DB record, not hardcoded. |
| `src/lib/wave/` | Wave credentials come from `AppSetting` DB records. Per-tenant once DB is isolated. |
| `prisma/schema.prisma` → `AppSetting` | Key-value config store. Per-tenant once DB is isolated. |
| `src/components/branding/BrandThemeInjector.tsx` | Reads `GlobalSettings.brandColorPrimary/Secondary/Accent`. Correct. |

---

### Category B — Needs Extraction (Sprint 28 targets)

Complete inventory of every hardcoded GHM string with runtime impact. Organized by file.

#### `src/lib/email/index.ts`

| Line | Hardcoded value | Target field in TenantConfig |
|------|----------------|------------------------------|
| 13 | `FROM_EMAIL` fallback: `"noreply@ghmmarketing.com"` | `tenant.fromEmail` |
| 14 | `FROM_NAME = "GHM Marketing"` (const, not env) | `tenant.fromName` |
| 50 | Email header: `GHM Marketing` (h1 in work order email) | `tenant.fromName` |
| 154 | Status notification: `"Hi, this is ${repName} from GHM Marketing."` | `tenant.fromName` |
| 161 | Status notification footer: `"GHM Marketing · Digital Marketing Solutions"` | `tenant.companyTagline` |
| 194 | Ops onboarding URL: `https://app.ghmdigital.com/clients/onboarding/...` | `tenant.dashboardUrl` |
| 257 | Contractor Wave invite from: `"GHM Marketing <${FROM_EMAIL}>"` | `tenant.fromName` + `tenant.fromEmail` |
| 259 | Contractor invite subject: `"...Set up your payment account with GHM Marketing"` | `tenant.fromName` |
| 263 | Contractor invite header: `GHM Marketing` | `tenant.fromName` |
| 312 | Contractor invite footer: `"GHM Digital Marketing Inc · Questions? Reply to this email."` | `tenant.companyName` |
| 345 | Partner onboarding URL: `https://app.ghmdigital.com/clients/onboarding/...` | `tenant.dashboardUrl` |
| 355 | Partner onboarding header: `GHM Marketing` | `tenant.fromName` |
| 429 | Generic notification footer: `"GHM Marketing Dashboard — automated notification"` | `tenant.fromName` |
| 476 | Report email header: `GHM Marketing` | `tenant.fromName` |

**Fix pattern:** Accept `tenant: TenantConfig` as a parameter in email-sending functions. Replace all `FROM_EMAIL`, `FROM_NAME`, and hardcoded company strings with `tenant.*` fields. The two hardcoded fallback URL strings (`https://app.ghmdigital.com/...`) become `tenant.dashboardUrl`.

---

#### `src/lib/email/templates.ts`

| Line | Hardcoded value | Target field |
|------|----------------|--------------|
| 10 | `FROM_EMAIL` fallback: `"reports@ghmdigital.com"` | `tenant.fromEmail` |
| 180 | Footer: `© GHM Digital Marketing Inc. All rights reserved.` | `tenant.companyName` |
| 253 | Contact link: `hello@ghmdigital.com` | `tenant.supportEmail` |
| 265 | Footer: `© GHM Digital Marketing Inc. All rights reserved.` | `tenant.companyName` |
| 329 | Footer: `© GHM Digital Marketing Inc. All rights reserved.` | `tenant.companyName` |

---

#### `src/lib/audit/template.ts` (audit/demo PDF templates)

| Line | Hardcoded value | Target field |
|------|----------------|--------------|
| 45 | `<title>GHM Digital Marketing Inc — Your SEO Preview: ...` | `tenant.companyName` |
| 57 | Brand header: `GHM Digital Marketing Inc` | `tenant.companyName` |
| 123 | Cover page: `<div class="cover-logo">GHM Digital Marketing Inc</div>` | `tenant.companyName` |
| 191 | Footer: `GHM Digital Marketing Inc` | `tenant.companyName` |
| 260 | CTA: `Contact GHM Digital Marketing Inc for a comprehensive strategy session.` | `tenant.companyName` |

---

#### `src/lib/reports/template.ts` (monthly report PDF)

| Line | Hardcoded value | Target field |
|------|----------------|--------------|
| 464 | Footer: `Generated by GHM Digital Marketing Inc •` | `tenant.companyName` |

---

#### `src/lib/pdf/work-order-template.tsx`

| Line | Hardcoded value | Target field |
|------|----------------|--------------|
| 271 | `<Text>GHM Marketing</Text>` (company name on work order) | `tenant.fromName` |
| 431 | Footer: `GHM Marketing · Digital Marketing Solutions` | `tenant.companyTagline` |

---

#### `src/lib/ai/context/system-prompt-builder.ts`

| Line | Hardcoded value | Target field |
|------|----------------|--------------|
| 35 | `"You are an AI assistant embedded in the GHM Marketing Dashboard, an enterprise SEO services platform."` | `tenant.aiContext` or compose from `tenant.name` |
| 121 | `"GHM-owned"` (in satellite tier description) | Internal label, low priority — comment cleanup |
| 193 | `"There is a specific GHM service that directly addresses it"` | `tenant.name` interpolation |

---

#### `src/lib/ai/search-prompt.ts`

| Line | Hardcoded value | Target field |
|------|----------------|--------------|
| 28 | `"You are the COVOS search intelligence layer for GHM Marketing Dashboard."` | Compose from `tenant.name` |

---

#### `src/lib/push.ts`

| Line | Hardcoded value | Target field |
|------|----------------|--------------|
| 9 | VAPID_SUBJECT fallback: `"mailto:admin@ghmmarketing.com"` | `tenant.supportEmail` or env var `VAPID_SUBJECT` (already env-overridable — just remove the GHM fallback) |

---

#### `src/app/(dashboard)/layout.tsx`

| Line | Hardcoded value | Target field |
|------|----------------|--------------|
| 11 | `title: "GHM Marketing Dashboard"` | `tenant.name` + `" Dashboard"` |

---

#### `src/components/layout/nav.tsx`

| Line | Hardcoded value | Target field |
|------|----------------|--------------|
| 282 | `alt="GHM Digital Marketing"` on logo `<Image>` | `tenant.name` |

---

#### `src/components/clients/client-portal-dashboard.tsx`

| Line | Hardcoded value | Target field |
|------|----------------|--------------|
| 198 | `© GHM Digital Marketing Inc. All rights reserved.` | `tenant.companyName` |

---

#### `src/components/clients/onboarding-panel.tsx`

| Line | Hardcoded value | Target field |
|------|----------------|--------------|
| 91 | `"https://app.ghmdigital.com"` fallback base URL | `tenant.dashboardUrl` |

---

#### Public marketing / onboarding pages (`src/app/(onboarding)/`)

These are GHM-specific sales collateral pages. Three paths exist:

**Path 1 (recommended for Sprint 28):** Pass tenant context into the pages and replace hardcoded strings. Correct solution if these pages become per-tenant marketing collateral in COVOS.

**Path 2 (acceptable for entity launch):** Leave these pages as GHM-specific. They're GHM's public sales tools, not COVOS platform infrastructure. Move them to a `src/app/(onboarding)/ghm/` route or document them as GHM-tenant-only pages in `TENANT_REGISTRY`.

Current GHM hardcoding in these pages:

| File | Hardcoded references |
|------|---------------------|
| `brochure/page.tsx` | `GHM Digital Marketing Inc` (title, header, footer, lines 4, 31, 493) |
| `comp-sheet/page.tsx` | `GHM Digital Marketing Inc` (title, header, footer, lines 4, 40, 259) |
| `territory-map/page.tsx` | `GHM Digital Marketing Inc` (title, description, header, footer, lines 5, 6, 48, 218) |
| Onboarding page(s) | `support@ghmdigital.com` (lines 1161, 1214, 1261) |

**Recommendation:** Sprint 28 extracts `companyName` and `supportEmail` from these pages into `TenantConfig`. The actual territory data and commission content stays as GHM-specific tenant data (Category C).

---

#### `src/lib/tenant/config.ts` — TENANT_REGISTRY

The registry itself is correctly architected. The single entry is:

```ts
ghm: {
  slug: "ghm",
  name: "GHM Digital Marketing",
  active: true,
  providers: { accounting: 'wave', domain: 'godaddy', payroll: 'wave', email: 'resend' },
}
```

This is not a defect. The defect is that `TenantConfig` interface is missing the fields that would allow all the Category B strings above to be tenant-configurable. See Section 2.

---

### Category C — Legitimately Tenant Data (Not Extraction Targets)

| Item | Where | Why it stays |
|------|-------|-------------|
| `SALARY_ONLY_USER_IDS = [4]` | `src/lib/payments/calculations.ts` | Gavin's (id=4) specific compensation arrangement. GHM business rule, not platform logic. Move to TenantConfig or DB config when second tenant onboards. |
| Commission tier thresholds ($200/$250/$300) | `GlobalSettings` DB + UI | GHM's comp structure. Already per-tenant once DB is isolated (stored in `GlobalSettings` table). |
| Territory definitions | `territory-map/page.tsx` + `Territory` DB table | GHM's actual territories. Tenant data, not codebase. |
| `GHM Digital Marketing` in `TENANT_REGISTRY.ghm.name` | `config.ts` | This IS the tenant config. Correct. |
| All DB records (leads, clients, users, tasks, etc.) | Neon PostgreSQL | GHM's operational data. See Section 3 for isolation path. |

---

### Comment-Only References (Low Priority)

These are file header comments with no runtime impact. Cleanup is good hygiene but not required for entity launch.

| File | Reference type |
|------|---------------|
| `src/lib/ai/complexity-analyzer.ts` | `// Complexity Analyzer — GHM Dashboard` |
| `src/lib/ai/model-benchmarks.ts` | `// Model Benchmarks — GHM Dashboard` |
| `src/lib/ai/model-router.ts` | `// Model Router — GHM Dashboard` |
| `src/lib/ai/types.ts` | `// AI Router Types — GHM Dashboard` + inline comments on QueryIntent/QueryDomain types |
| `src/lib/ai/client.ts` | `// AI Client — GHM Dashboard` |
| `src/lib/ai/cost-tracker.ts` | `// Cost Tracker — GHM Dashboard` |
| `src/lib/ai/index.ts` | `// AI Layer — GHM Dashboard` |
| `src/lib/website-audit/auditor.ts` | Comment artifact |
| `src/lib/voice.ts` | Comment header |
| `src/lib/totp.ts` | Comment artifact |
| `src/lib/sentry.ts` | Comment header |
| `src/lib/scrvnr/voice-capture.ts` | Comment artifact |
| `src/lib/permissions/*.ts` | Comment headers |
| `src/lib/ai/system-prompt-builder.ts` | `// System Prompt Builder — GHM Dashboard` |

Replace `"GHM Dashboard"` → `"COVOS Platform"` in a single bulk pass after Sprint 28 core work is done.

---

## 2. TENANTCONFIG GAP ANALYSIS

### Current `TenantConfig` Interface (from `src/lib/tenant/config.ts`)

```ts
export interface TenantConfig {
  slug: string;
  name: string;
  databaseUrl?: string;
  logoUrl?: string;
  primaryColor?: string;
  active: boolean;
  providers?: Partial<TenantProviderConfig>;
}
```

### Required Additions

Every field below corresponds to at least one Category B string from Section 1. Adding these fields + updating `TENANT_REGISTRY.ghm` with GHM's values eliminates all Category B hardcoding with zero behavior change for GHM.

```ts
export interface TenantConfig {
  // ── Existing ──────────────────────────────────────────
  slug: string;
  name: string;              // "GHM Digital Marketing" — short display name
  databaseUrl?: string;
  logoUrl?: string;
  primaryColor?: string;
  active: boolean;
  providers?: Partial<TenantProviderConfig>;

  // ── New: Identity ──────────────────────────────────────
  companyName: string;       // Full legal name: "GHM Digital Marketing Inc"
  companyTagline?: string;   // "Digital Marketing Solutions" — used in footers/subheadings

  // ── New: Email ─────────────────────────────────────────
  fromEmail: string;         // "noreply@ghmmarketing.com" — all outbound email FROM address
  fromName: string;          // "GHM Marketing" — display name in From header
  supportEmail: string;      // "support@ghmdigital.com" — contact/help links

  // ── New: URLs ──────────────────────────────────────────
  dashboardUrl: string;      // "https://ghm.covos.app" — base URL for this tenant's app

  // ── New: AI Context ────────────────────────────────────
  aiContext?: string;        // "enterprise SEO services platform" — injected into AI system prompts
                             // If omitted, compose as: "${tenant.name} business operations platform"
}
```

### Updated GHM Registry Entry

```ts
export const TENANT_REGISTRY: Record<string, TenantConfig> = {
  ghm: {
    slug: "ghm",
    name: "GHM Digital Marketing",
    companyName: "GHM Digital Marketing Inc",
    companyTagline: "Digital Marketing Solutions",
    fromEmail: "noreply@ghmmarketing.com",
    fromName: "GHM Marketing",
    supportEmail: "support@ghmdigital.com",
    dashboardUrl: "https://ghm.covos.app",
    aiContext: "enterprise SEO services platform for local businesses",
    logoUrl: undefined,        // pulls from GlobalSettings.logoUrl (DB-managed)
    primaryColor: undefined,   // pulls from GlobalSettings.brandColorPrimary
    active: true,
    providers: {
      accounting: 'wave',
      domain: 'godaddy',
      payroll: 'wave',
      email: 'resend',
    },
  },
};
```

### How Email Functions Should Use TenantConfig

All email-sending functions currently import `FROM_EMAIL` and `FROM_NAME` as module-level constants. After extraction, they accept a `tenant` parameter:

```ts
// Before
export async function sendWorkOrderEmail(params: WorkOrderEmailParams) {
  const from = `${FROM_NAME} <${FROM_EMAIL}>`;
  // ...
}

// After
export async function sendWorkOrderEmail(
  params: WorkOrderEmailParams,
  tenant: TenantConfig
) {
  const from = `${tenant.fromName} <${tenant.fromEmail}>`;
  // ...
}
```

API routes calling these functions already have tenant context via `requireTenant()` / `getTenant()`. Threaded through naturally.

---

## 3. DATA ISOLATION AUDIT

### Current State

The Prisma schema has **no `tenantId` column on any model.** The database contains ~90 models. All records are implicitly GHM's.

This is the single biggest gap for multi-tenant. Every query in the application currently returns all records — correctly, because there's only one tenant. The moment a second tenant's data enters the same database, every query returns mixed data.

### Two Viable Paths

#### Path A: Separate Database Per Tenant (RECOMMENDED for COVOS Phase 1)

Each tenant gets their own Neon project/branch. `TenantConfig.databaseUrl` is already defined for exactly this purpose.

Advantages:
- Zero schema changes. Zero migration risk.
- Complete data isolation by design. No row-level security, no query-level filtering.
- Tenant data is natively portable (dump one DB, restore elsewhere).
- Neon free tier = $0 for inactive tenants. Paid branches start ~$20/mo.
- Simpler GDPR/data deletion story: drop the database.

How it works:
- `src/lib/tenant/server.ts` already passes tenant context to callers. Add a `getTenantPrismaClient(tenant)` helper that returns a `PrismaClient` initialized with `tenant.databaseUrl ?? process.env.DATABASE_URL`.
- New tenant onboarding: provision a new Neon project, run `prisma db push` against it, add `databaseUrl` to `TENANT_REGISTRY`.
- GHM's existing DB continues as-is. No migration of existing data.

#### Path B: Shared DB with tenantId Column

Requires adding `tenantId String` to every model (~90 tables), updating every query with `where: { tenantId: tenant.slug }`, and running a data migration to stamp all existing rows with `tenantId = "ghm"`.

Disadvantages:
- Massive migration scope.
- Application-layer enforcement is error-prone (missed `tenantId` filter = data leak).
- Recommended only if cross-tenant analytics (e.g., COVOS owner dashboards aggregating across all tenants) are needed in Phase 1. They're not.

### Recommendation

**Use Path A (separate DB per tenant) for COVOS Phase 1.** The `databaseUrl` field in `TenantConfig` was designed for this. The incremental work is a single helper function.

### DB Isolation Work for Sprint 29

1. Add `getTenantPrismaClient(tenant: TenantConfig): PrismaClient` to `src/lib/tenant/server.ts`.
2. Confirm `TENANT_REGISTRY.ghm.databaseUrl` is unset (uses `process.env.DATABASE_URL` — current GHM DB, correct).
3. New tenant provisioning runbook: create Neon project → copy `DATABASE_URL` → add to `TENANT_REGISTRY` → push schema.
4. Document in `docs/TENANT_PROVISIONING.md`.

### Tables That Are Already Logically Isolated

These tables are already scoped to individual users/clients and carry no cross-contamination risk in a single-tenant scenario. They're listed here so Sprint 28 doesn't accidentally add unnecessary tenantId columns:

- `ClientProfile`, `Lead`, `ClientTask`, `ClientNote`, `ClientContent`, `ClientReport` — scoped by clientId/userId
- `VaultFile` — scoped by ownerId + space
- `TeamMessage`, `TeamMessageReaction`, `TeamMessageRead` — internal comms, scoped naturally
- `PaymentTransaction`, `UserCompensationConfig` — scoped by userId
- `AICostLog`, `DashboardEvent` — scoped by clientId/userId

---

## 4. INFRASTRUCTURE SEPARATION MAP

### Classification Key

- **COVOS Platform Owns:** Shared infrastructure. All tenants use this. COVOS pays.
- **Tenant Provides:** Per-tenant credentials. Each agency brings their own account.
- **Currently GHM's — Needs Reassignment Before Second Tenant:** Credential or account currently tied to GHM's identity. Must be transferred or duplicated.

| Service | Current owner | Classification | Sprint 29 action |
|---------|--------------|----------------|-----------------|
| Vercel project (`ghm-marketing`) | GHM / duke-of-beans org | ❌ NEEDS REASSIGNMENT | Create COVOS Vercel team. Transfer project or redeploy. All tenants share one deployment. |
| GitHub repo (`duke-of-beans/GHM-Marketing`) | GHM / duke-of-beans | ❌ NEEDS REASSIGNMENT | Fork or transfer to `covos-platform` org. GHM-specific config becomes tenant data only. |
| Neon PostgreSQL (GHM DB) | GHM | Tenant-owned | GHM keeps their DB. New tenants get their own. |
| Resend account + `ghmmarketing.com` domain | GHM | ❌ GHM-specific | COVOS needs its own Resend account + `covos.app` verified domain. Each tenant verifies their own sending domain OR uses COVOS shared domain. |
| Wave API credentials | GHM | Tenant-provided | Already in `AppSetting` per-DB. Correct. New tenants configure theirs. |
| Google Ads API | GHM | Tenant-provided | Per `AppSetting`. Correct. |
| GBP OAuth (`GHM Marketing` GCP project) | GHM | ❌ NEEDS ACTION | GBP OAuth app is in GHM's GCP project. COVOS needs its own GCP project + OAuth app for the platform. GHM continues using their own OAuth app OR switches to the COVOS app with their credentials. |
| DataForSEO, Ahrefs | GHM | Tenant-provided | Per `AppSetting`. Correct. |
| Anthropic API key | Currently one key | Platform → COVOS owns, OR tenant-provided | Decision required: COVOS pays AI costs and charges tenants, vs. each tenant provides their own Anthropic key. Phase 1 recommendation: COVOS-owned with per-tenant cost tracking (already implemented via `AICostLog`). |
| Tenor / Unsplash | GHM | Platform service | Transfer to COVOS entity. No per-tenant key needed. |
| Vercel Blob (`ghm-marketing-blob`) | GHM Vercel project | ❌ NEEDS REASSIGNMENT | Transfer to COVOS Vercel team. Or provision new blob store per tenant. |
| VAPID push keys | GHM env | Platform service | COVOS-owned. One set of VAPID keys per deployment. Remove GHM email fallback (see Section 1). |
| `covos.app` domain | David | COVOS entity | Transfer to new entity when formed. |
| `ROOT_DOMAIN=covos.app` env var | Vercel | COVOS Platform | Already correct. |

### Sprint 29 Infrastructure Priority Order

1. Create COVOS Vercel team → transfer or redeploy project under COVOS org.
2. Create COVOS Resend account → verify `covos.app` sending domain → update `FROM_EMAIL` env var.
3. Decide GCP: create COVOS GCP project for GBP OAuth OR document GHM's GCP project as GHM-tenant-only.
4. Move Vercel Blob to COVOS team.
5. Document every service in `docs/INFRASTRUCTURE_REGISTRY.md` (owner, credentials location, per-tenant or platform).

---

## 5. FILE COLLISION MAP (Parallel Cowork Execution)

Three tracks with zero file overlap. Each track can run simultaneously in a separate Cowork session after Track A writes the `TenantConfig` interface extension.

### Dependency

**Track A must complete the `TenantConfig` interface extension before Tracks B and C begin.** Specifically: the new fields (`companyName`, `fromEmail`, `fromName`, `supportEmail`, `dashboardUrl`, `aiContext`) must be defined in `src/lib/tenant/config.ts` before any other track uses them. This is ~30 minutes of work.

---

### Track A — Email, Templates, Tenant Interface
**Estimated time:** 3–4 hrs
**Must run first (defines TenantConfig fields)**

Files touched (exclusive to Track A):
```
src/lib/tenant/config.ts              ← extend TenantConfig interface + update ghm entry
src/lib/email/index.ts               ← extract 9 hardcoded strings
src/lib/email/templates.ts           ← extract 4 hardcoded strings
src/lib/reports/template.ts          ← extract 1 hardcoded string
src/lib/audit/template.ts            ← extract 5 hardcoded strings (audit/demo PDFs)
src/lib/pdf/work-order-template.tsx  ← extract 2 hardcoded strings
```

No file in Track A overlaps with Track B or Track C.

---

### Track B — AI Prompts, Push, Dashboard Layout Title
**Estimated time:** 1–2 hrs
**Starts after Track A completes TenantConfig interface**

Files touched (exclusive to Track B):
```
src/lib/ai/context/system-prompt-builder.ts  ← extract 3 GHM references
src/lib/ai/search-prompt.ts                  ← extract 1 GHM reference
src/lib/push.ts                              ← remove GHM email fallback from VAPID_SUBJECT
src/app/(dashboard)/layout.tsx               ← page title → tenant.name
```

---

### Track C — UI Components, Public Pages, Client Portal
**Estimated time:** 2–3 hrs
**Starts after Track A completes TenantConfig interface**

Files touched (exclusive to Track C):
```
src/components/layout/nav.tsx                        ← logo alt text
src/components/clients/client-portal-dashboard.tsx   ← copyright footer
src/components/clients/onboarding-panel.tsx          ← fallback base URL
src/app/(onboarding)/brochure/page.tsx               ← company name, footer
src/app/(onboarding)/comp-sheet/page.tsx             ← company name, footer
src/app/(onboarding)/territory-map/page.tsx          ← company name, footer
src/app/(onboarding)/**/page.tsx (onboarding)        ← support@ghmdigital.com (3 instances)
```

---

### Track D — Comment Cleanup (Post-launch, not blocking)
**Estimated time:** 30 min
**Not required for entity go-live. Run in Sprint 30.**

Files (comment headers only, no logic changes):
```
src/lib/ai/*.ts (8 files)     ← replace "GHM Dashboard" → "COVOS Platform"
src/lib/voice.ts
src/lib/totp.ts
src/lib/sentry.ts
src/lib/scrvnr/voice-capture.ts
src/lib/permissions/*.ts
src/lib/website-audit/auditor.ts
```

---

## 6. SPRINT PACKAGING

### Sprint 27 — Bug Triage (~1 hr)
BUG-030, BUG-031, BUG-032 + FEAT-037 (single lead entry).
No COVOS extraction work. Runs in parallel or before Sprint 28.

### Sprint 28 — COVOS Core Extraction (~1.5 sessions)

**Sequence:**
1. Blueprint-gating check: read this file + `BUSINESS_DNA.yaml`
2. Track A (sequential, must go first): TenantConfig extension → email/template extraction
3. Tracks B + C (parallel): AI prompts + UI components simultaneously
4. TypeScript check: `npx tsc --noEmit` — zero new errors
5. Functional verify: work order email renders GHM name from config; audit PDF shows correct company name
6. Sync: BACKLOG.md, CHANGELOG.md, STATUS.md → git push

**Verification commands post-Track A:**
```bash
# Confirm no GHM hardcoding remains in email/templates (should return zero matches)
Get-ChildItem -Recurse -Include "*.ts" src/lib/email/ | Select-String "ghmmarketing|ghmdigital|GHM Marketing|GHM Digital Marketing"

# Confirm TenantConfig has all new fields
Select-String "fromEmail|companyName|dashboardUrl" src/lib/tenant/config.ts
```

**Verification commands post-Tracks B + C:**
```bash
# Full scan — should return only TENANT_REGISTRY definition + comment-only refs
Get-ChildItem -Recurse -Include "*.ts","*.tsx" src/ | Select-String "GHM Marketing|ghmmarketing|ghmdigital|GHM Digital Marketing"
# Expected remaining: config.ts (ghm entry values), comment headers in lib/ai/
```

### Sprint 29 — Entity Go-Live (~1 session)

1. Infrastructure: Create COVOS Vercel team, Resend account, transfer relevant services (see Section 4).
2. DB isolation: Add `getTenantPrismaClient()` helper to `src/lib/tenant/server.ts`.
3. Second tenant dry-run: Add a test `covostest` entry to `TENANT_REGISTRY` with a blank Neon DB. Verify tenant detection, login flow, and empty dashboard. Confirm no GHM data bleeds through.
4. Ops runbook: Write `docs/TENANT_PROVISIONING.md`.
5. Remove or rename `duke-of-beans/GHM-Marketing` GitHub repo reference from docs.
6. Sync and push.

---

## 7. OPEN DECISIONS (Require David's Answer Before Sprint 28)

| # | Question | Stakes | Recommendation |
|---|----------|--------|---------------|
| D1 | Do the `(onboarding)/` pages become per-tenant COVOS collateral, or stay as GHM-only sales pages? | Affects Track C scope | Leave as GHM-specific for Sprint 28. Move to TenantConfig in Sprint 29+ when a second agency needs them. |
| D2 | COVOS Anthropic API key: COVOS pays per-tenant with cost tracking, or each tenant provides their own key? | Billing model | COVOS-owned for Phase 1. Already have `AICostLog` per tenant. Charge tenants via flat fee. |
| D3 | GBP OAuth: Create new COVOS GCP project, or document GHM's project as GHM-tenant-only? | Sprint 29 infra | New COVOS GCP project. GHM can migrate OAuth credentials when ready. |
| D4 | `SALARY_ONLY_USER_IDS = [4]` — move to TenantConfig now (Sprint 28) or Sprint 29? | Code cleanliness | Sprint 28 Track A. Low-risk, high-value. Becomes `tenant.salaryOnlyUserIds?: number[]`. |

---

## APPENDIX: COMPLETE GHM REFERENCE COUNT BY FILE

From full grep scan (`Get-ChildItem -Recurse src/ | Select-String "GHM|ghmmarketing|ghmdigital"`):

| File | Runtime references | Comment-only |
|------|-------------------|-------------|
| `src/lib/email/index.ts` | 14 | 0 |
| `src/lib/email/templates.ts` | 5 | 0 |
| `src/lib/audit/template.ts` | 5 | 0 |
| `src/lib/reports/template.ts` | 1 | 0 |
| `src/lib/pdf/work-order-template.tsx` | 2 | 0 |
| `src/lib/tenant/config.ts` | 2 (registry entry values — correct) | 0 |
| `src/lib/ai/context/system-prompt-builder.ts` | 2 | 1 |
| `src/lib/ai/search-prompt.ts` | 1 | 0 |
| `src/lib/push.ts` | 1 | 0 |
| `src/app/(dashboard)/layout.tsx` | 1 | 0 |
| `src/components/layout/nav.tsx` | 1 | 0 |
| `src/components/clients/client-portal-dashboard.tsx` | 1 | 0 |
| `src/components/clients/onboarding-panel.tsx` | 1 | 0 |
| `src/app/(onboarding)/brochure/page.tsx` | 3 | 0 |
| `src/app/(onboarding)/comp-sheet/page.tsx` | 3 | 0 |
| `src/app/(onboarding)/territory-map/page.tsx` | 4 | 0 |
| `src/app/(onboarding)/*/page.tsx` (support email) | 3 | 0 |
| `src/lib/ai/*.ts` (8 files) | 0 | ~20 |
| `src/lib/voice.ts`, `totp.ts`, `sentry.ts`, etc. | 0 | ~6 |

**Total runtime references requiring extraction (Track A+B+C):** ~50
**Total comment-only references (Track D):** ~26

When Sprint 28 is complete, the only remaining GHM references in `src/` should be:
- `TENANT_REGISTRY.ghm` entry with GHM's actual values (correct — this is data)
- Track D comment headers in `src/lib/ai/` (harmless until Sprint 30 cleanup)
