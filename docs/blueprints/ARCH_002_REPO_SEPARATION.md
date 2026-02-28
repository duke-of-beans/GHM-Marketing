# ARCH-002: Repository / Service / Database Separation Strategy

**Status:** PROPOSED — requires David sign-off before ACCEPTED  
**Date:** 2026-02-28  
**Deciders:** David (COO/operator, sole developer)  
**Supersedes:** *(none — first ADR on this topic)*  
**Related:** `docs/TENANT_PROVISIONING.md`, `PLATFORM_ARCHITECTURE.md`, `docs/blueprints/SPRINT29_GO_LIVE_BLUEPRINT.md`

---

## Context

### 1.1 Current State (as of February 28, 2026)

The COVOS platform and GHM Digital Marketing configuration live in a single Git repository at `D:\Work\SEO-Services\ghm-dashboard`, deployed as one Vercel project under the domain `covos.app`. The architecture was purpose-built for GHM and is being extracted toward a multi-tenant SaaS platform (COVOS) that could be sold to other agencies.

**What exists today:**

The codebase is a Next.js 14 App Router application with Prisma/Neon PostgreSQL. GHM-specific configuration now lives exclusively in `src/lib/tenant/config.ts` — the TENANT_REGISTRY — following the Sprint 28 extraction that removed ~50 runtime GHM hardcoded strings from the non-tenant layer. Two tenants are active:

- `ghm` — primary production tenant (GHM Digital Marketing Inc), points at the GHM Neon database
- `covosdemo` — second tenant dry-run (verified 2026-02-27), points at a separate Neon database in the same Neon project

Per-tenant database isolation is handled by `getTenantPrismaClient()` in `src/lib/tenant/server.ts`. Adding a third tenant requires: one entry in `TENANT_REGISTRY`, one Neon database, three Vercel environment variables, and a Vercel domain alias.

**What does NOT yet exist:**

- A second production customer (non-GHM) using the platform
- A separate repository for the COVOS platform layer
- A `packages/` or `apps/` monorepo structure
- Any CI/CD separation between platform code and tenant configuration

**The core tension:**

GHM is simultaneously a customer of COVOS (a tenant) and the reason the platform exists (it funded development). As COVOS is positioned for sale to other agencies, this dual role creates architectural risk: GHM business logic could continue to bleed into the platform layer, making the codebase harder to audit, pitch to investors, or open-source partially.

---

## Decision Drivers

1. **Sellability timeline:** COVOS should be demonstrably sellable as an independent product within ~6 months (target: September 2026).
2. **Developer capacity:** One developer (David), working sessions-based. Sync overhead between repositories has a real cost.
3. **GHM stability:** GHM is a paying client. Nothing can degrade their production experience.
4. **Tenant isolation:** COVOS architecture must credibly support N tenants with no data bleed.
5. **Open-source optionality:** David may want to open-source the platform layer while keeping GHM config private.

---

## Options Considered

### Option A — Stay Monorepo (Current Architecture)

**Description:** Continue with the single repository. The COVOS platform code and GHM-specific configuration coexist in one repo, one Vercel project, one deployment pipeline. The tenant registry in `src/lib/tenant/config.ts` remains the sole point of tenant configuration. Additional tenants are onboarded by extending `TENANT_REGISTRY` and adding Vercel env vars.

**What "done" looks like:** ARCH-002 is marked ACCEPTED with Option A. No repository changes. Sprint work continues in the current repo. GHM config stays in `config.ts`. New tenants are added entries.

**Pros:**

Zero duplication. Every platform improvement is immediately available to GHM and any other tenant with no sync step. Single deployment pipeline, single Vercel project (at least until Vercel billing forces multi-project). TypeScript types, ESLint config, Tailwind config, and Prisma schema are shared and stay in sync automatically. The risk of GHM diverging from the platform version is zero. For a solo developer, cognitive overhead is at its minimum — one place to look for everything.

Sprint velocity is highest in this option. There are no `npm link` chains, no workspace version mismatches, no "which repo do I push to" decisions. The existing 30-sprint build history and all commit context stay in one `git log`.

COVOS extraction is already ~90% complete at the application layer (Sprint 28). The remaining coupling is architectural: one Vercel project, one GitHub repo, GHM tenant as de-facto default fallback. These are manageable without a repo split.

**Cons:**

A prospective COVOS customer or investor who reviews the GitHub repository sees GHM client data configuration alongside the platform. Even with `TENANT_REGISTRY` cleanly separated, the co-location signals "this is a GHM tool, not a product." This is a perception problem, not a technical one, but it matters for sales.

If David wants to open-source the platform layer, he cannot do so from this repo without scrubbing GHM configuration — an ongoing manual obligation every time GHM config is touched.

GHM-specific APIs, integrations (Wave, Ahrefs, GBP), and data models are embedded in the schema. A second tenant with a different accounting provider would require conditional logic or provider abstraction in the same schema file.

**Risk:** GHM business logic creep. Without enforcement, new GHM-specific features tend to land in the shared layer rather than the tenant layer. The extraction work of Sprint 28 had to be done retroactively. Option A does not structurally prevent this from recurring.

---

### Option B — Platform Fork (Separate `covos-platform` Repository)

**Description:** Create a new repository (`covos-platform`) that contains the Next.js application, Prisma schema, API routes, and all UI components that are tenant-agnostic. GHM becomes a downstream consumer — it either (a) forks `covos-platform` and adds GHM configuration in a thin overlay, or (b) installs `covos-platform` as a submodule or package and extends it.

**What "done" looks like:** A `covos-platform` GitHub repo exists (likely private initially), the current codebase is split — platform code migrates there, GHM-specific code stays in a thin `ghm-dashboard` repo or configuration layer. Two Vercel projects. GHM redeploys from GHM config; other tenants deploy from `covos-platform`.

**Pros:**

Clean separation is structural and enforced by the repo boundary. A COVOS sales prospect can be given read access to `covos-platform` without seeing any GHM business data. If David open-sources the platform, he opens `covos-platform` and GHM config stays private.

The COVOS brand can have its own GitHub organisation, its own README, its own contributor history — signals that matter when pitching agencies as a product rather than a consulting deliverable.

New tenants onboard by deploying `covos-platform` with their `TENANT_REGISTRY` entry, not by opening a monorepo they don't own.

**Cons:**

Migration cost is high. Every file needs a home decision: platform or GHM-specific. The current schema (`prisma/schema.prisma`) is the hardest: GHM-specific models (commission engine, personnel, Wave integration) are interleaved with tenant-agnostic models (users, clients, tasks). Splitting the schema without breaking Prisma type generation is non-trivial.

Two repositories means two places to track issues, two PR queues, two CI pipelines, and two `git log` histories. For a solo developer, this doubles the coordination overhead with zero additional capacity to absorb it.

Keeping GHM's production system stable during migration is the highest-risk phase. There is a period where `ghm-dashboard` references `covos-platform` but the split is incomplete — a split-brain state that could cause subtle bugs.

The platform version pinning problem: GHM will be on a specific commit of `covos-platform`. When platform bugs are fixed or features added, GHM must explicitly upgrade. This is the correct model for a product but it requires release management discipline that a solo developer will find burdensome.

**Risk:** At current team size (one developer), Option B's overhead is likely to slow sprint velocity by 20–30% for the duration of the migration, and then by 10–15% permanently due to cross-repo coordination. This is a significant cost against a 6-month sellability timeline.

---

### Option C — Turborepo Monorepo (`packages/platform` + `apps/ghm` + `apps/covos`)

**Description:** Restructure the repository as a Turborepo monorepo. Platform-agnostic code lives in `packages/platform` (or `packages/ui`, `packages/db`, etc.). GHM-specific application code lives in `apps/ghm`. A COVOS demo or default app lives in `apps/covos`. Shared TypeScript types, ESLint config, Tailwind presets, and the Prisma client are workspace packages consumed by both apps.

**What "done" looks like:** `pnpm workspaces` (or Turborepo) configured. `apps/ghm` and `apps/covos` are Next.js applications. `packages/platform` exports the data layer, API route handlers, and shared UI. Both apps extend `packages/platform` — same repo, different build artifacts, potentially separate Vercel projects.

**Pros:**

Best of both options in theory. Code sharing without cross-repo sync. Platform vs. tenant boundary is enforced by the package boundary (linting rules can prevent `apps/ghm` from importing non-`packages/` platform internals). Single `git log`. Single CI pipeline with task-level granularity via Turborepo.

Open-source path: open `packages/platform`, keep `apps/ghm` private in a separate repo or behind a `.gitignore` pattern.

Scales to N tenants cleanly — each is an `apps/<tenant>` directory with its own config, its own `TENANT_REGISTRY` entry, and its own Vercel project.

**Cons:**

Migration complexity is the highest of all three options. Turborepo setup, pnpm workspace configuration, package boundary definition, shared tsconfig/eslint, Prisma client extraction into a workspace package — this is 2–4 weeks of infrastructure work before any product sprint can resume. For a 6-month sellability window, spending 4–8 weeks on monorepo plumbing is a significant allocation.

Next.js App Router and Turborepo have known compatibility friction points (module resolution, `"use client"` propagation across workspace packages, Vercel build caching). The tooling is mature but the edge cases are real and will cost debugging time.

Turborepo adds operational overhead: `turbo.json`, `package.json` workspace declarations, peer dependency management. Every new package or app entry point requires coordination.

**Risk:** This is the correct long-term architecture for a platform with 5+ tenants and 3+ developers. For the current state (1 developer, 2 tenants, 6-month window), it is almost certainly premature. The infrastructure investment would delay COVOS sales readiness, not accelerate it.

---

## Recommendation

**OPTION A — Stay Monorepo**, with a structural enforcement layer added to prevent regression.

For a solo developer with a 6-month sellability target, Options B and C consume too much of the available sprint budget on infrastructure that solves a problem that doesn't yet exist at scale. The Sprint 28 extraction is already sufficient for technical tenant isolation. The remaining problem is presentational (investor/customer perception) and can be addressed with cheaper mitigations than a full repo split.

**Recommended mitigations within Option A:**

The `TENANT_REGISTRY` in `src/lib/tenant/config.ts` should be documented as the authoritative isolation boundary. Any new GHM-specific configuration must land there, not in shared components or API routes. This rule should be enforced via ESLint no-restricted-imports rules or a custom lint rule that blocks imports of `TENANT_REGISTRY["ghm"]` outside of `src/lib/tenant/`.

A COVOS-branded README should be written at the repo root that presents the project as a multi-tenant SEO agency platform (which it is), not as a GHM tool. The TENANT_REGISTRY entry for GHM is described as a reference implementation of a tenant configuration.

A separate GitHub repository (`covos-platform-docs` or similar) can serve as the public-facing COVOS brand presence, containing architecture diagrams, API documentation, and the sales pitch — without exposing source code.

If a sales prospect needs a code review, a clean branch can be created that excludes `TENANT_REGISTRY["ghm"]` entries — this takes minutes, not a multi-week migration.

**Trigger conditions that would change this recommendation** (see Section: Trigger Conditions below).

---

## Migration Path

### If Triggered: Moving from A → B

Execute this migration only when a trigger condition (see below) is met. Do not start without a dedicated sprint allocation of at least 3 weeks.

**Step 1 — Schema audit (2 days).** Categorise every Prisma model as: (a) tenant-agnostic (users, clients, tasks, leads), (b) GHM-specific (commissions, Wave payment transactions, personnel positions), or (c) ambiguous (requires decision). Document in `docs/SCHEMA_SEPARATION.md`.

**Step 2 — Create `covos-platform` repository (1 day).** Private repo under the COVOS GitHub org. Copy the Next.js project. Remove `TENANT_REGISTRY["ghm"]`. Seed with `TENANT_REGISTRY["covos-template"]` as the default. Push. Do not delete the `ghm-dashboard` repo.

**Step 3 — Extract tenant-agnostic schema (3 days).** Move tenant-agnostic models to `covos-platform/prisma/schema.prisma`. GHM-specific models either stay in the `ghm-dashboard` fork of the schema or are abstracted behind a provider interface.

**Step 4 — Sync GHM dashboard as a downstream fork (2 days).** `ghm-dashboard` is rebased or cherry-picked from `covos-platform`. A `git remote add platform` allows pulling upstream fixes. GHM-specific config lives only in the fork layer.

**Step 5 — Dual-deploy verification (2 days).** Both Vercel projects are live and healthy. GHM production traffic confirmed correct. `covosdemo.covos.app` redeploys from `covos-platform`.

**Step 6 — Documentation and handoff (1 day).** `TENANT_PROVISIONING.md` updated for the two-repo model. ARCH-002 status changed to ACCEPTED. This ADR updated with actual migration date and lessons.

### If Triggered: Moving from A → C

Do not attempt A → C without at least 4 weeks of dedicated sprint time and Turborepo expertise. The recommended path is A → B → C, not A → C directly. Option B's repo separation is a prerequisite for understanding the actual package boundaries before encoding them as workspace packages.

---

## Trigger Conditions

This ADR should be reopened and Option B or C reconsidered when **any one** of the following is true:

1. **Second paying tenant:** A second non-GHM agency signs a contract to use the COVOS platform. At that point, the perception problem becomes a sales risk — the new tenant may reasonably object to their configuration living in a repo named `ghm-dashboard`.

2. **Open-source intent confirmed:** David decides to open-source the platform layer. The manual scrubbing obligation makes Option A untenable the moment a public GitHub URL is committed to.

3. **Team growth:** A second developer joins the platform team who does not have the context to respect the `TENANT_REGISTRY` isolation boundary. The structural enforcement of a repo or package boundary becomes necessary.

4. **Investor due diligence:** A COVOS investor or acquirer requests a code review and the GHM co-location creates a blocking objection. At that point the migration timeline compresses to deal-speed, which is worse — do it before this happens.

5. **Sprint velocity impact:** More than 20% of sprint time is spent on GHM-vs-platform decision overhead (e.g., "should this feature be in the tenant layer or the platform layer?"). The friction indicates the architectural boundary needs to be structural, not disciplinary.

---

## Consequences

**If Option A is accepted:**

Sprint velocity is preserved. The COVOS sellability timeline is met by building product features rather than infrastructure. The tenant isolation boundary (`TENANT_REGISTRY`) is documented and enforced by convention. Migration to Option B remains available and is fully described above — it is not foreclosed by choosing Option A now.

The accepted risks are: GHM business logic creep (mitigated by ESLint rules and the isolation convention), investor perception (mitigated by the COVOS-branded README and documentation repo), and the eventual migration cost if trigger conditions are met (accepted — the migration is described above and estimated at 2–3 weeks when the time comes).

**If Option B or C is accepted instead:**

The platform separation is structurally enforced and the open-source and investor-review paths are cleaner. The costs are: 3–4 weeks of migration sprint time not available for product work, increased ongoing coordination overhead for a solo developer, and the risk of a split-brain migration state that could degrade GHM's production stability. These are real costs and should be weighed against the actual urgency of the trigger conditions.

---

## Review Schedule

This ADR should be reviewed at the start of Sprint 35 (estimated May 2026) regardless of trigger conditions, to assess whether the recommendation should change as the COVOS pipeline develops.

**Sign-off required from:** David  
**Status will change to:** ACCEPTED or SUPERSEDED  
**Do not change status:** without explicit decision recorded in CHANGELOG.md

---

*ADR format based on Michael Nygard's template. See [https://github.com/joelparkerhenderson/architecture-decision-record](https://github.com/joelparkerhenderson/architecture-decision-record).*
