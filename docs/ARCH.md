# COVOS — ARCHITECTURAL DECISIONS
**Last Updated:** March 2, 2026
**Status:** ACTIVE — living document. Update when decisions change.

---

## ARCH-001 — UI Constitution + Design System ✅ ACCEPTED

Groups 1–5 complete (Foundations, Icons, Components, Navigation, Data Display).
Groups 6–8 remain (Communication, Content, Identity). Runs parallel to product sprints.

---

## ARCH-002 — Repo/Service/DB Separation ❌ REJECTED

**Decision date:** March 2, 2026
**Proposed:** Separate repo, separate services, separate DB per tenant.
**Rejected because:** COVOS is true multi-tenant SaaS. One codebase, one deployment, data isolation via per-tenant Neon database URLs. Code separation is unnecessary and creates maintenance overhead without adding value. Module toggles in TenantConfig serve as the commercial lever — tenants buy capabilities, not deployments.
**What replaced it:** Meta-DB architecture (see ARCH-004).

---

## ARCH-003 — 82-Category Module Map ✅ ACCEPTED

Full map documented in `D:\Work\Covos_Business_Opportunity_Assessment.docx`.
Build sequence: Phase 1 (horizontal core, 10 modules) → Phase 2 (vertical unlocks) → Phase 3 (back-office depth).
Phase 1 complete for SEO vertical. Phase 2+ begins after vertical 2 (affiliate/domain) is scoped.

---

## ARCH-004 — Meta-DB Tenant Architecture ✅ ACCEPTED

**Decision date:** March 2, 2026

**Model:** One central COVOS-owned Neon meta-database stores the tenant registry. Each tenant record contains slug, subdomain, config JSON, `securityTier`, and a pointer to their own isolated database URL. `getTenant()` queries the meta-DB, resolves the tenant, and connects to their isolated DB for all operational data.

**Resilience:** Meta-DB runs with a Neon read replica in a second region. In-memory cache (5–10 min TTL) on `getTenant()` means a brief meta-DB outage doesn't affect active sessions.

**Security:** Tenant DB connection strings encrypted at rest (Neon default + application-level encryption on `databaseUrl` field before storage).

**Scaling:** Adding a new tenant is a DB insert. No code deploys, no env var changes.

**Rejected alternatives:**
- Option B (env vars per tenant): breaks at 10+ tenants, requires redeployment per new tenant.
- Option C (secrets manager for all tenants): correct eventually, premature now.

---

## ARCH-005 — COVOS Vault Compliance Tier 📋 FUTURE

**Decision date:** March 2, 2026
**Status:** Architecture noted and reserved. Build when first regulated client needs it.

**Model:** Premium `securityTier: "vault"` on TenantConfig. Credentials live in AWS Secrets Manager or Azure Key Vault instead of meta-DB. Field-level encryption on sensitive data. Comprehensive audit logging. HIPAA, FedRAMP-lite, SOC 2 checkboxes.

**Pricing:** ~$500–$1,000/month add-on on top of platform tier.

**Target clients:** Healthcare/HIPAA, government contractors, defense subcontractors, financial services.

**Implementation:** `getTenant()` checks `securityTier` and uses the appropriate credential resolver. Standard and Vault tenants coexist on the same platform — no fork, no separate deployment.

**Why noted now:** So no future architectural decision designs around it or assumes it doesn't exist.

---

## ARCH-006 — GHM Tenant Extraction ⏳ IN PROGRESS

**Decision date:** March 2, 2026
**Status:** Sprint planned. Code work + manual ops work separated.

**Goal:** COVOS is the platform. GHM is a tenant. The platform has no GHM fingerprints in its identity layer. No default-to-GHM fallback in `getTenant()`. All infrastructure is COVOS-owned with GHM as a configured tenant within it.

**Layers:**

**Layer 1 — Code (in progress):**
- Remove GHM default privilege from `getTenant()` — unknown slugs return 404/error page, not GHM content
- Move tenant registry from `config.ts` static file to meta-DB `Tenant` table
- Audit all env vars — GHM-specific credentials move into per-tenant TenantConfig row
- Stub all third-party integrations with `TODO: COVOS_ACCOUNT_NEEDED` markers
- Write `THIRD_PARTY_MIGRATION.md` as the manual ops checklist

**Layer 2 — Infrastructure (David manual sprint):**
- Create COVOS-owned Vercel project, Neon project, Resend account, GCP project
- GHM migrates to be a tenant within COVOS infrastructure (not the host)
- Work through `THIRD_PARTY_MIGRATION.md` line by line

**Layer 3 — Third-party credentials (backlog, progressive):**
- GBP OAuth, Google Ads, DataForSEO, Tenor, Unsplash, Pexels — all currently registered under GHM or personal accounts
- Each needs COVOS platform account where COVOS owns the credential
- GHM becomes a configured tenant within each
- Timing: careful handoff required for live GHM operations

**Done means:** `covosdemo.covos.app` is a second clean tenant. `ghm.covos.app` is a configured tenant with no special status. `covos.app` serves the platform home. No fallback to GHM anywhere in the code.

---

## Open Architectural Questions

None currently. All major decisions resolved as of March 2, 2026.
