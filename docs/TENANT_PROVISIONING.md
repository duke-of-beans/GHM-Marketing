# COVOS — TENANT PROVISIONING RUNBOOK
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
| Email sending | — | Resend account + verified domain |
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
□ Resend API key
□ Wave API credentials (if using Wave billing)
□ Sending domain verified in their Resend account
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

### Step 3 — Add Env Vars to Vercel

In Vercel → Settings → Environment Variables:

```
[SLUG]_DATABASE_URL = postgresql://[pooled-url]
[SLUG]_DIRECT_URL   = postgresql://[direct-url]
```

### Step 4 — Add to TENANT_REGISTRY

In `src/lib/tenant/config.ts`:

```ts
easter: {
  slug: "easter",
  name: "The Easter Agency",
  companyName: "The Easter Agency LLC",
  companyTagline: "Local SEO That Converts",
  fromEmail: "noreply@easteragency.com",
  fromName: "The Easter Agency",
  supportEmail: "support@easteragency.com",
  dashboardUrl: "https://easter.covos.app",
  databaseUrl: process.env.EASTER_DATABASE_URL,
  active: true,
  providers: {
    accounting: 'wave',
    domain:     'godaddy',
    payroll:    'wave',
    email:      'resend',
  },
},
```

### Step 5 — Configure Tenant Service Credentials

Log into the new tenant's dashboard as admin and set:
- Wave API key → Settings → Integrations → Wave
- Resend API key → Settings → Integrations → Email
- DataForSEO / Ahrefs → Settings → Integrations → SEO
- Google Ads → Settings → Integrations → Ads

These live in the `AppSetting` table in the tenant's own DB. Never cross-tenant.

### Step 6 — DNS

In the `covos.app` registrar:
1. Add CNAME: `[slug].covos.app` → `cname.vercel-dns.com`
2. In Vercel → Settings → Domains: add `[slug].covos.app`

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
□ Remove [SLUG]_DATABASE_URL and [SLUG]_DIRECT_URL from Vercel
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

## TECHNICAL NOTES

- `getTenantPrismaClient(tenant)` in `src/lib/tenant/server.ts` handles all DB routing
- Never run `prisma migrate dev` — always `prisma db push`
- Schema changes apply to ALL tenant DBs — run `prisma db push` against each tenant's DB URL after any schema update
- `SALARY_ONLY_USER_IDS = [4]` (Gavin) is currently hardcoded in calculations.ts — moves to `TenantConfig.salaryOnlyUserIds` when Easter onboards as a separate tenant
