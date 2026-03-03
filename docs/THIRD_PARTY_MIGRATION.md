# COVOS — THIRD PARTY MIGRATION CHECKLIST
**Last Updated:** March 2, 2026
**Owner:** David Kirsch (manual ops sprint)
**Status:** PENDING — blocked on infrastructure inversion code sprint completing first

---

## Purpose

Every third-party credential and infrastructure account currently registered under GHM or David's personal accounts needs to migrate to a COVOS platform account. This document is the complete checklist.

Pattern for each item:
1. Create a COVOS-owned account / project
2. Store COVOS-level credentials in platform env vars
3. GHM becomes a configured tenant with its own per-tenant credentials stored in TenantConfig
4. Other tenants provision their own credentials via the same pattern

---

## Infrastructure Accounts

### INFRA-001 — Vercel Project
- **Current:** GHM-marketing Vercel project. COVOS is running inside it.
- **Target:** COVOS Platform Vercel project. GHM is a tenant deployment within it.
- **Action:** Create new Vercel project under COVOS entity. Migrate codebase. Update DNS. Decommission or repurpose GHM Vercel project.
- **Risk:** Live GHM operations — coordinate cutover carefully.
- **Status:** ⏳ PENDING

### INFRA-002 — Neon Database Project
- **Current:** GHM Neon project contains: GHM production DB + covosdemo test DB.
- **Target:** COVOS Platform Neon project. GHM gets its own DB within it. covosdemo gets its own DB. Meta-DB is the new COVOS-owned registry DB.
- **Action:** Create COVOS Neon project. Create meta-DB. Create GHM tenant DB (migrate data). Create covosdemo DB (migrate or recreate). Add Neon read replica to meta-DB for resilience.
- **Risk:** GHM production data migration. Test thoroughly before cutover.
- **Status:** ⏳ PENDING

### INFRA-003 — Resend Account + Sending Domain
- **Current:** GHM Resend account. Emails send from `noreply@ghmmarketing.com`.
- **Target:** COVOS Resend account. Platform emails send from `noreply@covos.app` (COVOS system emails). GHM tenant emails send from `noreply@ghmmarketing.com` (stored in GHM TenantConfig). Other tenants configure their own sending domain.
- **Action:** Create COVOS Resend account. Verify `covos.app` domain (SPF, DKIM, DMARC). Update platform `FROM_EMAIL` to pull from TenantConfig (already scaffolded in Sprint 28 Track A). INFRA-001 Resend domain verification for GHM can wait — GHM sending moves to per-tenant config.
- **Status:** ⏳ PENDING

### INFRA-004 — GCP Project + OAuth App
- **Current:** GHM Marketing GCP project. OAuth client configured. GBP APIs enabled. App in Testing mode (David + Gavin as test users).
- **Target:** COVOS Platform GCP project. OAuth app for COVOS platform (supports all tenants via per-tenant GBP OAuth flow). GHM's GBP connection migrates to a tenant-level OAuth token stored in TenantConfig.
- **Action:** Create `COVOS Platform` GCP project. Enable Business Profile APIs. Create OAuth client. Submit for Google external app review (1–3 week wait — start ASAP). Per-tenant OAuth tokens stored in TenantConfig, not platform env vars.
- **Prerequisite for:** I4 GBP OAuth going live for real clients.
- **Status:** ⏳ PENDING — submit review ASAP, clock starts on approval wait

### INFRA-005 — Vercel Blob Store
- **Current:** `ghm-marketing-blob` (IAD1, Public). `BLOB_READ_WRITE_TOKEN` active.
- **Target:** COVOS Platform Blob store. Paths namespaced by tenant slug (`/{tenantSlug}/...`). GHM's blobs migrate to `/ghm/...` prefix.
- **Action:** Create new Blob store under COVOS Vercel project (follows INFRA-001). Migrate existing GHM blobs to namespaced paths. Update upload/read routes to prepend tenant slug.
- **Status:** ⏳ PENDING (blocked on INFRA-001)

---

## Per-Tenant Third-Party Credentials

These are credentials currently used by GHM that each tenant will configure for their own account. The platform provides the integration; tenants bring their own credentials.

### T-001 — Wave Accounting
- **Current:** GHM Wave API key in platform env vars.
- **Target:** Per-tenant Wave API key stored in TenantConfig. Wave settings UI already built (Sprint W6). Admin configures their Wave credentials in Settings → Integrations.
- **Action:** Move `WAVE_API_KEY` from platform env vars to GHM TenantConfig row. Verify Wave settings tab reads from TenantConfig, not env vars.
- **Status:** ⏳ PENDING (scaffolding exists from Sprint 28)

### T-002 — Google Business Profile (per tenant)
- **Current:** GHM GBP OAuth under GHM GCP project.
- **Target:** COVOS Platform OAuth app (INFRA-004). Per-tenant GBP OAuth tokens stored in TenantConfig.
- **Action:** Blocked on INFRA-004. Once COVOS GCP project exists, build per-tenant GBP OAuth flow in Settings → Integrations. GHM reconnects under new flow.
- **Status:** ⏳ PENDING (blocked on INFRA-004)

### T-003 — Google Ads
- **Current:** Google Ads account connected under GHM. `GOOGLE_ADS_*` env vars.
- **Target:** Per-tenant Google Ads credentials. COVOS platform has a Google Ads API developer token. Each tenant authenticates their own Ads account via OAuth.
- **Action:** Create COVOS Google Ads API developer token (MCC account). Build per-tenant Ads OAuth flow. GHM reconnects under new flow.
- **Status:** ⏳ PENDING

### T-004 — DataForSEO
- **Current:** GHM DataForSEO API key in platform env vars.
- **Target:** COVOS Platform DataForSEO account (platform-level credential, shared across tenants, usage billed to COVOS, costs passed through or included in platform tier pricing).
- **Action:** Create COVOS DataForSEO account. Move API key to platform-level env var under COVOS Vercel project. No per-tenant credential needed — this is platform infrastructure.
- **Status:** ⏳ PENDING

### T-005 — Tenor (GIF search)
- **Current:** `TENOR_API_KEY` in platform env vars. Demo key `LIVDSRZULELA` used as fallback.
- **Target:** COVOS Platform Tenor API key. Platform-level credential.
- **Action:** Register COVOS Tenor API key. Update env var under COVOS Vercel project.
- **Status:** ⏳ PENDING

### T-006 — Unsplash
- **Current:** `UNSPLASH_ACCESS_KEY` in platform env vars.
- **Target:** COVOS Platform Unsplash application. Platform-level credential.
- **Action:** Create COVOS Unsplash app. Update env var.
- **Status:** ⏳ PENDING

### T-007 — Pexels
- **Current:** `PEXELS_API_KEY` in platform env vars.
- **Target:** COVOS Platform Pexels API key. Platform-level credential.
- **Action:** Create COVOS Pexels account. Update env var.
- **Status:** ⏳ PENDING

### T-008 — Sentry (Error Monitoring)
- **Current:** Sentry project under GHM or personal account.
- **Target:** COVOS Platform Sentry organization. Separate projects per tenant or DSN per tenant.
- **Action:** Create COVOS Sentry org. Migrate GHM project. Update `SENTRY_DSN` env var.
- **Status:** ⏳ PENDING

### T-009 — DocuSign
- **Current:** DocuSign integration credentials. Per-tenant configuration already in architecture.
- **Target:** COVOS Platform DocuSign developer account. Per-tenant DocuSign credentials stored in TenantConfig (each tenant uses their own DocuSign account for signing — COVOS does not sign on their behalf).
- **Action:** Verify TenantConfig has DocuSign credential fields. Confirm GHM credentials are stored per-tenant, not in platform env vars.
- **Status:** ⏳ PENDING (verify current state)

---

## Priority Order for Manual Sprint

When ready to execute, work in this sequence:

1. **INFRA-004** (GCP OAuth) — submit for Google review ASAP. Approval takes 1–3 weeks. Start the clock.
2. **INFRA-001** (Vercel project) — foundation everything else depends on.
3. **INFRA-002** (Neon project + meta-DB) — data isolation foundation.
4. **INFRA-003** (Resend + covos.app domain) — platform email identity.
5. **INFRA-005** (Blob store) — follows Vercel project.
6. **T-001 through T-009** — work through progressively. None block platform launch for a second tenant. GHM continues working throughout.

---

## Notes

- GHM must continue operating throughout this migration. No big-bang cutover. Each item migrates independently.
- Items marked `PENDING` are not blocking the code sprint — the code sprint stubs everything and marks TODOs. This checklist is the manual follow-up.
- When an item is complete, mark it `✅ DONE` with date.
