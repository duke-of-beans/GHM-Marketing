# COVOS — TENANT PROVISIONING RUNBOOK
**Last verified: February 27, 2026 — reflects Sprint 29 + 30 state.**
**Last Updated:** February 27, 2026
**For:** Onboarding a new agency onto the COVOS platform

---

## OVERVIEW

COVOS uses **one deployment, one codebase, separate database per tenant.**

- All tenants run on the same Vercel project at `*.covos.app`
- Subdomain routing is handled by middleware
- Each tenant gets their own isolated Neon PostgreSQL database — zero data bleed
- Adding a tenant = ~30 minutes if credentials are ready

---

## WHAT COVOS PROVIDES VS. WHAT THE TENANT PROVIDES

| Service | COVOS Provides | Tenant Provides |
|---------|---------------|-----------------| 
| Hosting / deployment | Vercel project | — |
| Subdomain (`name.covos.app`) | DNS + Vercel domain | — |
| Application code | Shared codebase | — |
| Database | Neon project setup support | Own Neon project |
| Email sending | — | Resend account + verified domain (or use covos.app) |
| Wave (billing/payroll) | — | Wave account + API credentials |
| Google Ads | — | Google Ads account + API credentials |
| GBP OAuth | COVOS GCP OAuth app | Own GBP property access |
| DataForSEO / Ahrefs | — | Own API keys |
| Anthropic API | COVOS key (costs tracked per tenant) | — |

---

## ONBOARDING CHECKLIST

### Prerequisites (gather before starting)

```
□ Tenant slug decided (e.g. "easter" → easter.covos.app)
□ Full company name (e.g. "The Easter Agency LLC")
□ From-email address (e.g. "noreply@easteragency.com")
□ Support email (e.g. "support@easteragency.com")
□ Resend API key + sending domain verified (or confirm tenant will use covos.app as sending domain — see Step 5)
□ Wave API key (if using Wave billing) — will be set as WAVE_API_KEY_[SLUG] env var
□ Wave business ID (if known — optional, can be retrieved later from Wave dashboard)
```

### Step 1 — Create Neon Database

1. Log into neon.tech (COVOS account)
2. Create new project: name it `covos-[slug]` (e.g. `covos-easter`)
3. Copy both connection strings:
   - `DATABASE_URL` = pooled connection (Prisma queries)
   - `DIRECT_URL` = direct connection (Prisma schema push)

### Step 2 — Push Schema to New DB

```powershell
$env:DATABASE_URL = "postgresql://[new-tenant-pooled-url]"
$env:DIRECT_URL = "postgresql://[new-tenant-direct-url]"
npx prisma db push
```

Confirm: "Your database is now in sync with your Prisma schema."

This creates all models atomically — User, Lead, ClientProfile, WorkOrder, PaymentTransaction, SignatureEnvelope, and all others defined in `prisma/schema.prisma`. No additional steps are needed per-model; `prisma db push` handles the full schema. After any future schema changes, re-run `prisma db push` against each tenant's DB URL individually.

### Step 3 — Add Env Vars to Vercel

In Vercel → Settings → Environment Variables:

```
[SLUG]_DATABASE_URL     = postgresql://[pooled-url]
[SLUG]_DIRECT_URL       = postgresql://[direct-url]
WAVE_API_KEY_[SLUG]     = [wave-api-key-for-this-tenant]
```

Examples for a tenant with slug `easter`:
```
EASTER_DATABASE_URL     = postgresql://...
EASTER_DIRECT_URL       = postgresql://...
WAVE_API_KEY_EASTER     = [easter-wave-api-key]
```

**Note:** Wave API keys are env-var-only — they are never stored in the tenant config or the database. The naming convention is strictly `WAVE_API_KEY_` + uppercase slug. After adding env vars, redeploy the Vercel project.

### Step 4 — Add to TENANT_REGISTRY

In `src/lib/tenant/config.ts`, add an entry to `TENANT_REGISTRY`:

```ts
easter: {
  // Required fields
  slug: "easter",
  name: "The Easter Agency",            // Short display name
  companyName: "The Easter Agency LLC", // Full legal entity — used in emails, reports, UI
  fromEmail: "noreply@easteragency.com",
  fromName: "The Easter Agency",
  supportEmail: "support@easteragency.com",
  dashboardUrl: "https://easter.covos.app",
  active: true,                         // Set false to block all access without code removal

  // Optional fields
  companyTagline: "Local SEO That Converts", // Footer/subheading (omit to suppress)
  aiContext: "SEO agency platform for local businesses", // Injected into AI system prompts
  logoUrl: "/logos/easter.png",         // Served from /public/logos/ — omit to use default
  primaryColor: "#1a56db",              // Future use — branding token

  // Infrastructure
  databaseUrl: process.env.EASTER_DATABASE_URL, // Undefined = falls back to DATABASE_URL

  // Wave accounting — waveBusinessId is the Wave business ID shown in Wave dashboard URLs
  // Wave API key is NEVER stored here — read from process.env.WAVE_API_KEY_EASTER at runtime
  waveBusinessId: "QnVzaW5lc3M6...",   // Optional — omit if Wave not yet configured

  providers: {
    accounting: 'wave',
    domain:     'godaddy',
    payroll:    'wave',
    email:      'resend',
  },
},
```

**Field reference — TenantConfig interface:**

| Field | Required | Notes |
|-------|----------|-------|
| `slug` | ✅ | Lowercase, matches subdomain and env var prefix |
| `name` | ✅ | Short display name |
| `companyName` | ✅ | Full legal name — appears in emails, PDFs, UI |
| `fromEmail` | ✅ | Outbound email from address |
| `fromName` | ✅ | Outbound email display name |
| `supportEmail` | ✅ | Used in help links |
| `dashboardUrl` | ✅ | Base app URL |
| `active` | ✅ | `false` blocks all access immediately on deploy |
| `companyTagline` | optional | Footer/subheading |
| `aiContext` | optional | Injected into AI system prompts |
| `logoUrl` | optional | Path under `/public/` — omit for default |
| `primaryColor` | optional | Future branding token |
| `databaseUrl` | optional* | *Functionally required for DB isolation — omit only for local dev |
| `waveBusinessId` | optional | Wave business ID; Wave API key goes in env as `WAVE_API_KEY_[SLUG]` |
| `providers` | optional | Defaults to wave/godaddy/wave/resend if omitted |

### Step 5 — Configure Wave and Email Sending

**Wave:**
Wave credentials are set via Vercel env vars (Step 3), not through the UI. After deploying, admins will see an amber banner in Settings → Wave that confirms the integration is tenant-specific and points to env vars for reconfiguration. No further UI action is needed to connect Wave — the `WAVE_API_KEY_[SLUG]` env var is picked up automatically by `waveQuery()` and `waveMutation()` at runtime.

**Resend (email sending domain):**
COVOS's `covos.app` domain is verified in the COVOS Resend account as of February 27, 2026. `ghmmarketing.com` is verified separately in the GHM tenant's Resend account.

New tenants have two options:
- **Use covos.app as the sending domain** — set `fromEmail` to `anything@covos.app`. No additional Resend verification needed.
- **Use their own domain** — tenant must verify their domain in their own Resend account before `fromEmail` can use it. Verification typically takes 10–30 minutes (DNS propagation). Until verified, emails will bounce or fail silently.

For other per-tenant integrations, log into the new tenant's dashboard as admin and configure:
- DataForSEO / Ahrefs → Settings → Integrations → SEO
- Google Ads → Settings → Integrations → Ads

These live in the `AppSetting` table in the tenant's own DB. Never cross-tenant.

### Step 6 — DNS

Wildcards (`*.covos.app`) are not supported on Vercel's free tier and were removed in Sprint 30. Each tenant requires an explicit CNAME.

In the `covos.app` registrar (Namecheap):
1. Add CNAME: `[slug]` → `cname.vercel-dns.com`
   - Example: `covosdemo` → `cname.vercel-dns.com` (results in `covosdemo.covos.app`)
   - Example: `easter` → `cname.vercel-dns.com` (results in `easter.covos.app`)
2. In Vercel → Settings → Domains: add `[slug].covos.app`

DNS propagation is typically instant to ~5 minutes for Namecheap CNAME records.

### Step 7 — Create First Admin User

Via Neon SQL editor or Prisma Studio on the new tenant DB:

```sql
INSERT INTO "User" (email, password_hash, name, role, is_active, created_at, updated_at)
VALUES (
  'admin@easteragency.com',
  '[bcrypt hash of temp password]',
  'Admin',
  'admin',
  true,
  NOW(),
  NOW()
);
```

### Step 8 — Verify

```
□ https://[slug].covos.app loads
□ Login page shows correct tenant company name
□ Admin login works — empty dashboard, no other tenant data visible
□ Test work order email — FROM shows tenant fromName/fromEmail
□ Existing tenants completely unaffected
```

---

## OFFBOARDING CHECKLIST

```
□ Set active: false in TENANT_REGISTRY → deploy (blocks access immediately)
□ Export tenant DB (pg_dump or Neon export) → deliver to tenant
□ Archive/delete Neon project after 30-day hold
□ Remove [SLUG]_DATABASE_URL, [SLUG]_DIRECT_URL, and WAVE_API_KEY_[SLUG] from Vercel
□ Remove CNAME record for [slug].covos.app
□ Remove from TENANT_REGISTRY in next release
```

---

## MIGRATION: GHM → THE EASTER AGENCY

When Easter is ready to migrate:

1. Follow Steps 1–7 above with slug `easter`
2. Fork or copy GHM's Neon DB into the new Easter Neon project
3. Update Easter's AppSetting records with their new service credentials
4. Test thoroughly at `easter.covos.app`
5. When stable: set `ghm` to `active: false` in TENANT_REGISTRY
6. Update any client-facing URLs from `ghm.covos.app` → `easter.covos.app`

Migration is fully independent — COVOS runs uninterrupted for all other tenants throughout.

---

## POST-PROVISIONING VERIFICATION CHECKLIST

After completing all 8 steps above, run these checks before handing off to the tenant:

```
□ https://[slug].covos.app/api/debug/tenant  (GET as admin — requires logged-in admin session)
    → "slug" matches the expected slug
    → "hasDatabaseUrl": true
    → "active": true
    → "resolvedFrom" shows the correct hostname (not a fallback)

□ https://[slug].covos.app/login
    → Correct tenant logo renders (not the GHM logo)
    → Company name in page title/header is correct

□ Send a test notification (e.g. trigger a welcome email or use the work order flow)
    → Email arrives in inbox
    → FROM address is the correct tenant sending domain (not ghmmarketing.com)
    → No bounce or Resend error in logs

□ Log in as admin and open Settings → Wave
    → Banner shows correct tenant.companyName in the configuration note
    → No stale GHM company name visible
```

If any check fails: verify the TENANT_REGISTRY entry, Vercel env vars, and DNS config before going live.

---

## TECHNICAL NOTES

- `getTenantPrismaClient(tenant)` in `src/lib/tenant/server.ts` handles all DB routing
- Never run `prisma migrate dev` — always `prisma db push`
- Schema changes apply to ALL tenant DBs — run `prisma db push` against each tenant's DB URL after any schema update
- `SALARY_ONLY_USER_IDS = [4]` (Gavin) is currently hardcoded in calculations.ts — moves to `TenantConfig.salaryOnlyUserIds` when Easter onboards as a separate tenant
- Wave API keys use the `WAVE_API_KEY_[SLUG]` env var convention (e.g. `WAVE_API_KEY_GHM`, `WAVE_API_KEY_EASTER`). The old single `WAVE_API_KEY` / `WAVE_API_TOKEN` env var remains as a fallback for the GHM tenant only. New tenants must use the per-tenant naming.
