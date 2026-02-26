# SPRINT 29 — BLUEPRINT
# COVOS Entity Go-Live: Infrastructure Transfer + DB Isolation + Second Tenant Dry-Run
**Date:** February 26, 2026
**Prerequisite:** Sprint 28 (Tracks A + B + C) must be merged and deployed
**Estimated time:** 1 full session (~4–6 hrs) + async infrastructure setup
**Goal:** The moment this sprint completes, registering a second tenant is a 30-minute procedure.

---

## CONTEXT

Sprint 29 is the infrastructure sprint. Sprint 28 extracts hardcoded GHM strings from the codebase — but even after Sprint 28, every GHM service account, Vercel project, GitHub repo, and Resend domain is still GHM-branded. Sprint 29 moves the platform from "GHM's codebase with tenant config" to "COVOS's platform that GHM runs on."

New entity forms in ~2 weeks. Sprint 29 must complete before that date.

---

## STEP 1 — Database Isolation Helper

File: `src/lib/tenant/server.ts`

### 1A. Add `getTenantPrismaClient()`

```ts
import { PrismaClient } from "@prisma/client";
import type { TenantConfig } from "@/lib/tenant/config";

// Singleton cache: one PrismaClient per tenant DB URL
const clientCache = new Map<string, PrismaClient>();

export function getTenantPrismaClient(tenant: TenantConfig): PrismaClient {
  const url = tenant.databaseUrl ?? process.env.DATABASE_URL!;
  
  if (!clientCache.has(url)) {
    clientCache.set(url, new PrismaClient({
      datasources: { db: { url } },
    }));
  }
  
  return clientCache.get(url)!;
}
```

### 1B. Document the intent

Add a comment above:
```ts
/**
 * Returns a PrismaClient scoped to the given tenant's database.
 * 
 * If tenant.databaseUrl is set, returns a client for that database.
 * If not set, falls back to DATABASE_URL (GHM's production DB).
 * 
 * For Phase 1 multi-tenancy: each tenant gets a separate Neon project.
 * This function is the sole mechanism for per-tenant DB routing.
 * 
 * DO NOT instantiate PrismaClient directly in API routes.
 * Use this function + requireTenant() for all DB access.
 */
```

### 1C. Note on existing `prisma` singleton

The existing global `prisma` singleton in `src/lib/prisma.ts` should remain for GHM (which has no `databaseUrl` in registry, so uses `DATABASE_URL`). `getTenantPrismaClient(tenant)` is for the multi-tenant routing path and is currently only called explicitly. Phase 2 may refactor all routes to use this, but Phase 1 just needs it available.

### 1D. TypeScript check

```powershell
npx tsc --noEmit
```

No new errors.

---

## STEP 2 — Vercel Project Transfer

### 2A. Create COVOS Vercel Team

- Go to vercel.com → Create Team → "COVOS Platform"
- Transfer billing to new entity account when formed

### 2B. Transfer or redeploy project

**Option A (Transfer):** Vercel Dashboard → `ghm-marketing` project → Settings → Transfer → select COVOS Platform team.
- Advantage: keeps deployment history, env vars, domain config.
- Risk: project slug remains `ghm-marketing`. Rename after transfer.

**Option B (Redeploy fresh):** Create new project in COVOS team pointing to same GitHub repo. Reconfigure env vars and domain.
- Advantage: clean start.
- Risk: brief downtime during DNS cutover.

**Recommendation:** Use Option A (transfer). After transfer, rename project to `covos-platform`.

### 2C. Update project name and domain

After transfer:
- Rename Vercel project: `ghm-marketing` → `covos-platform`
- Confirm `covos.app` domain remains pointing to this project
- Confirm `ghm.covos.app` subdomain routes correctly (test tenant detection)
- Confirm env vars survived transfer (check Vercel dashboard)

### 2D. Add `TENANT_DOMAIN` env var for local dev

Add to `.env.local`:
```
ROOT_DOMAIN=covos.app
```

Already used in `getTenantFromHost()`. No code change needed.

---

## STEP 3 — Resend Email Infrastructure

### 3A. Current state
- GHM emails send from `noreply@ghmmarketing.com` via GHM's Resend account
- After Sprint 28, `TenantConfig.fromEmail` for GHM = `"noreply@ghmmarketing.com"` — still correct
- GHM's Resend account remains GHM's — they keep it

### 3B. COVOS Resend account

Create a separate Resend account under COVOS entity:
- Email: `ops@covos.app`
- Verify `covos.app` sending domain in Resend
- This is the platform-level Resend account for system emails (future: tenant provisioning, billing, etc.)

### 3C. Per-tenant Resend setup

Each tenant either:
- Provides their own Resend API key (configured in `AppSetting` per tenant's DB), OR
- Uses the COVOS Resend account with their verified sender domain

**Phase 1 recommendation:** GHM keeps their own Resend account + API key. The COVOS platform account is for COVOS-originated emails (provisioning, billing) only. Document this in `TENANT_PROVISIONING.md`.

### 3D. Update env var comment in `.env.example`

```
# Resend API key. For GHM tenant, use GHM's Resend key.
# For COVOS platform-level emails, use the COVOS Resend key.
RESEND_API_KEY=
```

---

## STEP 4 — GitHub Repository Transfer

### 4A. Current state
- Repo: `duke-of-beans/GHM-Marketing`
- This name is GHM-specific and should not be the COVOS platform repo name

### 4B. Transfer to COVOS org

- Create GitHub org: `covos-platform`
- Transfer repo from `duke-of-beans` to `covos-platform`
- Rename repo: `GHM-Marketing` → `covos-platform` (the main platform repo)

**After transfer:** Vercel will need to reconnect the GitHub integration. Do this in Vercel Settings → Git after repo transfer.

### 4C. Update any hardcoded repo references

Search codebase for `duke-of-beans` references:
```powershell
Get-ChildItem -Recurse -Include "*.ts","*.tsx","*.json","*.md" | Select-String "duke-of-beans|GHM-Marketing" | Format-Table Filename,LineNumber,Line
```

Update any found in documentation or config.

---

## STEP 5 — GCP / GBP OAuth

### 5A. Current state

The GBP (Google Business Profile) OAuth app is registered in GHM's GCP project. It uses GHM Marketing's branding and appears as "GHM Marketing" in the OAuth consent screen when partners authorize.

### 5B. Decision

For Sprint 29, create a COVOS GCP project:
- Project name: `COVOS Platform`
- OAuth app: `COVOS Platform` (consent screen shows "COVOS Platform wants access to…")
- Add required GBP scopes to new OAuth app
- Update `GBP_CLIENT_ID` and `GBP_CLIENT_SECRET` env vars in Vercel

### 5C. GHM migration path

After new OAuth app is approved (Google review can take 1–3 weeks):
- Existing GHM GBP connections continue working until they re-authorize
- Re-authorization prompts users to authorize with the new COVOS app
- GHM's existing `GBPConnection` records remain valid during transition

**Action for Sprint 29:** Create the COVOS GCP project and submit OAuth app for review. Don't wait for approval to deploy Sprint 29 — GHM's existing OAuth app continues working in parallel.

---

## STEP 6 — Vercel Blob Store Transfer

### 6A. Current state

Vercel Blob store is attached to the `ghm-marketing` Vercel project. All uploaded files (voice profiles, vault docs, etc.) live here.

### 6B. After Vercel project transfer (Step 2)

The Blob store transfers with the project. Confirm:
- `BLOB_READ_WRITE_TOKEN` env var survives the transfer
- Test a file upload after transfer

No code changes needed.

---

## STEP 7 — Second Tenant Dry-Run

This step validates that the platform can actually onboard a second tenant before a real agency depends on it.

### 7A. Add a test tenant to TENANT_REGISTRY

```ts
// In src/lib/tenant/config.ts — TEMPORARY, remove after verification
covosdemo: {
  slug: "covosdemo",
  name: "COVOS Demo Agency",
  companyName: "COVOS Demo Agency LLC",
  companyTagline: "Local SEO Demonstration",
  fromEmail: "demo@covos.app",
  fromName: "COVOS Demo",
  supportEmail: "support@covos.app",
  dashboardUrl: "https://covosdemo.covos.app",
  databaseUrl: process.env.COVOS_DEMO_DATABASE_URL,  // New empty Neon DB
  active: true,
  providers: {
    accounting: 'wave',
    domain: 'godaddy',
    payroll: 'wave',
    email: 'resend',
  },
},
```

### 7B. Provision the demo Neon DB

- Create new Neon project: `covos-demo-tenant`
- Copy the `DATABASE_URL` from Neon dashboard
- Add to Vercel env vars: `COVOS_DEMO_DATABASE_URL=postgresql://...`
- Run schema push against it:
  ```powershell
  $env:DATABASE_URL = "postgresql://[demo-db-connection-string]"
  npx prisma db push
  ```

### 7C. Add DNS subdomain

In wherever `covos.app` DNS is managed:
- Add `covosdemo.covos.app` CNAME pointing to `cname.vercel-dns.com`
- Wait for DNS propagation (~5 min)

### 7D. Verification checklist

```
□ https://covosdemo.covos.app loads (not GHM dashboard)
□ Tenant detection returns slug = "covosdemo" (check Vercel logs)
□ Login page shows "COVOS Demo Agency" branding (from TenantConfig)
□ Admin account creation: create a test user in the demo DB
□ Dashboard loads with empty state (no GHM clients/leads visible)
□ GHM dashboard at https://ghm.covos.app completely unaffected
□ Email: send a test work order email — FROM shows "COVOS Demo <demo@covos.app>"
□ GHM email: send a test — FROM shows "GHM Marketing <noreply@ghmmarketing.com>"
□ No GHM data appears in covosdemo tenant (DB isolation confirmed)
```

### 7E. After verification

- Remove `covosdemo` from `TENANT_REGISTRY` (or keep as `active: false`)
- Remove `COVOS_DEMO_DATABASE_URL` env var or keep for future use
- Delete the Neon demo project if not needed

---

## STEP 8 — Write TENANT_PROVISIONING.md

File: `docs/TENANT_PROVISIONING.md`

Contents must cover:

1. Prerequisites (DNS access to `covos.app`, Neon access, Vercel access, Resend access)
2. Checklist for onboarding a new agency:
   - Create Neon project → copy DATABASE_URL
   - Run `prisma db push` against new DB
   - Add subdomain DNS record
   - Add tenant entry to TENANT_REGISTRY
   - Add DATABASE_URL env var to Vercel (e.g. `[SLUG]_DATABASE_URL`)
   - Deploy / redeploy Vercel project
   - Create admin user in new tenant DB (SQL or admin UI)
   - Verify login and empty dashboard
3. Service dependencies per tenant (what each agency must provide vs. what COVOS provides)
4. Offboarding procedure (mark `active: false`, archive DB, remove env var, DNS cleanup)

---

## STEP 9 — Sync and Ship

```powershell
# In ghm-dashboard repo
# 1. Close Sprint 29 items in STATUS.md and BACKLOG.md
# 2. Update Last Updated header in STATUS.md
# 3. git add -A
# 4. git commit -m "feat: COVOS entity go-live infrastructure (Sprint 29)"
# 5. git push
```

---

## OPEN INFRASTRUCTURE QUESTIONS (Answer Before Starting Sprint 29)

| # | Question | Where to decide |
|---|----------|----------------|
| I1 | Which Vercel account/org owns the transfer destination? | Create COVOS Vercel team first |
| I2 | Which GitHub org will own the platform repo? | Create `covos-platform` GitHub org |
| I3 | Is `covos.app` registered to David personally or to an entity? | Must transfer to new entity when formed |
| I4 | Will GHM pay COVOS for the platform (SaaS fee), or is GHM the first equity customer? | Business/legal question, no Sprint 29 blocker |
| I5 | Will COVOS manage Resend for all tenants (pay Resend, charge tenants), or does each tenant bring their own Resend key? | Phase 1: each tenant brings own key. Update provisioning docs. |

---

## SPRINT 29 COMMIT MESSAGE

```
feat: COVOS entity go-live — infrastructure transfer and DB isolation (Sprint 29)

- Add getTenantPrismaClient() helper for per-tenant DB routing
- Vercel project transferred to COVOS Platform team, renamed covos-platform
- GitHub repo transferred to covos-platform org
- Resend: COVOS platform account created for system emails
- GCP: COVOS OAuth app submitted for review (GBP integration)
- Second tenant dry-run: covosdemo tenant validated end-to-end
  - DB isolation confirmed (zero GHM data bleed)
  - Email FROM correctly resolves per TenantConfig
  - Tenant detection and login flow verified
- docs/TENANT_PROVISIONING.md: full onboarding/offboarding runbook
- STATUS.md: Sprint 29 complete, Sprint 30 queued
```
