# GHM DASHBOARD — SPRINT 9–12 HANDOFF PROMPT
**Generated:** February 24, 2026
**Commit:** 452556e (Sprint 8 complete)
**Use this prompt:** Paste at the start of the next Claude session working on GHM Dashboard.

---

## BOOTSTRAP (READ THESE FIRST — IN ORDER)

```
1. Filesystem:read_file D:\Work\SEO-Services\ghm-dashboard\STATUS.md
2. Filesystem:read_file D:\Work\SEO-Services\ghm-dashboard\BACKLOG.md
3. Filesystem:read_file D:\Work\SEO-Services\ghm-dashboard\CHANGELOG.md (last 60 lines only)
```

Critical constraints are in STATUS.md under 🔒 CRITICAL CONSTRAINTS. Read them before touching any file.

---

## WHERE WE LEFT OFF

Sprint 8 shipped and closed (commit 452556e):
- **8A** — Bulk Content Operations (multi-select, bulk approve/archive, master+ only)
- **8B** — CompetitorsTab component + API routes (`GET/POST /api/clients/[id]/competitors`, `DELETE /api/clients/[id]/competitors/[cid]`). Prisma model is `clientCompetitor` (not `competitor` — already fixed).
- **8C** — Custom Report Builder (8-section toggle, AI Executive Summary switch, Client-Facing Mode switch)
- All TypeScript errors from Sprint 8 cleared. 5 pre-existing errors remain in scripts/ and lib/basecamp/ — do not fix unless explicitly tasked.

The Vercel build is live and clean. Repo: `duke-of-beans/GHM-Marketing`, branch `main`.

---

## SPRINT 9 — QUALITY & TRUST (DO THIS FIRST)

**Goal:** Fix trust-breaking issues before any external user touches the platform.

### 9A — Dashboard Layout Flash (UX-AUDIT-010) — ~2 hrs
**Problem:** Navigating away from the dashboard and returning shows a different layout — "Sales Tools" widget set on first load, different widgets on return. Inconsistent first impression.
**Investigation starting point:** `src/app/(dashboard)/page.tsx` and any sales-role-specific dashboard component. Look for two different components mounting depending on navigation state, session hydration order, or role resolution timing.
**Fix:** Ensure the same component mounts consistently on return navigation. Check if this is the same mount-flash pattern as the pre-Sprint 8 grid fix.

### 9B — Admin First-Run Wizard (FEAT-015) — ~1 session
**Goal:** When a new admin logs in for the first time (or after a reset), guide them through: company name, logo upload, brand color, tagline, sales rep territory setup. Stores to TenantConfig. Skip button available.
**Why now:** Required before COVOS productizes. Any new tenant needs this on day one.
**Starting point:** TenantConfig is at `src/lib/tenant/config.ts`. Settings UI is in `src/app/(dashboard)/settings/`. Look for existing settings tabs pattern before building new pages.

### 9C — Logo & Brand Asset Management (FEAT-021 / FEAT-018) — ~1 session
**Goal:** 
- Admin uploads GHM logo in Settings > Branding. Stored as `logoUrl` on TenantConfig.
- Navbar pulls logo from TenantConfig instead of static file.
- Login page pulls logo from TenantConfig.
- Marketing materials (brochure, audit PDF, comp sheet) use `logoUrl` when set. Per-material toggle (default: on). Graceful fallback to text if no logo.
**Why now:** GHM-specific need — brochures and audit PDFs should show GHM logo immediately. Also the foundational productization step for COVOS white-label.
**Depends on:** 9B (TenantConfig schema must have `logoUrl` field).

---

## SPRINT 10 — SALES MUSCLE

**Goal:** Make the day-to-day sales workflow sharper for Arian.

### 10A — Prospect Filter Intelligence Surface (UX-AUDIT-009 / FEAT-013) — ~1 session
**File:** `src/components/leads/lead-filter-bar-advanced.tsx`
**Problem:** The filter bar looks like a basic search bar. The underlying data has Tier, Impact Score, and Close Likelihood — none are surfaced as primary controls.
**Fix:** Surface those three as first-class visible filters. Intelligence strip above kanban showing active filter posture. Better visual language for expand/collapse. No data model changes — purely presentation.

### 10B — Lead Source Filter — ~1 hr
**File:** `src/components/leads/lead-filter-bar-advanced.tsx` + filteredLeads memo
**Problem:** Lead Source field (organic/referral/discovery/import) exists in DB, not in filter UI.
**Fix:** Add to filter bar and filteredLeads memo.

### 10C — Static Empty States — ~2 hrs
**Scope:** Context-aware empty states in Leads, Clients, Content Studio. Each should suggest the next action with a direct button. Pairs with tooltip audit (UX-AUDIT-001).

---

## SPRINT 11 — ADMIN VISIBILITY & ANALYTICS

### 11A — Dashboard Usage Analytics (FEAT-019) — ~1 session
Per-user, per-session event tracking. Admin-only analytics page: page views, feature interactions, session duration, dead zones. `DashboardEvent` table. No PII beyond userId.

### 11B — COVOS Owner Telemetry (FEAT-020) — ~1 session
Anonymous event pipeline from each tenant → COVOS central analytics. Fleet health dashboard for David as platform owner. Tenant hash only — no PII. Add disclosure to SERVICE_AGREEMENT.

### 11C — Route & Button Audit (FEAT-011) — ~1 session
Full audit of every `<Button>`, `<Link>`, `router.push()`, form `onSubmit`. Map to handlers and routes. Flag dead routes, broken routes, duplicate logic, permission gaps, dependency tangles. Output: `docs/ROUTE_AUDIT.md`.

---

## SPRINT 12 — DATA MIGRATION & REAL OPERATIONS

**This is the "make it real" sprint. Run after Sprints 9–11 are clean.**

### 12A — Enter Real Leads
Manually enter or import current GHM prospects into the Leads system. Assign territory, set pipeline stage, claim leads for Arian. Verify all pipeline stages and filter bar work with real data.

### 12B — Enter Current Clients
Create ClientProfile records for all active GHM clients. Populate: business name, service tier, MRR, assigned sales rep, master manager. Verify compensation engine fires correctly against real client records.

### 12C — Migrate Basecamp Tasks
Re-run the Basecamp crawl against live data and import into the tasks system. The crawler is at `scripts/basecamp-crawl.ts`. The import adapter is `scripts/import-wave-history.ts` (check for a tasks equivalent). Verify recurring tasks map correctly to ClientTasksTab. Cross-reference against `D:\Research\` for any prior crawl output.

**Before 12C:** Resolve the two pre-existing TS errors in scripts/ (`basecamp-crawl.ts` can't find `../src/lib/db.js`, `import-wave-history.ts` can't find `dotenv`). These will block the crawl from running.

---

## KEY FILE PATHS

```
Project root:     D:\Work\SEO-Services\ghm-dashboard\
Tenant config:    src/lib/tenant/config.ts
Settings UI:      src/app/(dashboard)/settings/
Leads filter:     src/components/leads/lead-filter-bar-advanced.tsx
Client profile:   src/components/clients/profile.tsx
Navbar:           src/components/layout/sidebar.tsx  ← verify path before editing
Prisma schema:    prisma/schema.prisma
DB rule:          prisma db push ONLY — never migrate dev
Basecamp crawl:   scripts/basecamp-crawl.ts
```

---

## CONSTRAINTS (NEVER VIOLATE)

- `prisma db push` only — never `prisma migrate dev`
- "master" stays as DB enum — UI shows "Manager" via ROLE_LABELS
- David's account = admin role, id=1 in Neon DB
- SALARY_ONLY_USER_IDS = [4] (Gavin) — never include David (id=1)
- David (id=1) legitimately receives $240/mo management fee through engine — masterFeeEnabled=true is correct
- Test account (userId=6) — never set contractorVendorId or assign as salesRepId/masterManagerId on real clients
- TypeScript clean before closing any sprint — `npx tsc --noEmit` (5 pre-existing errors in scripts/ and lib/basecamp/ are pre-existing, don't count against us)
- Sync protocol: close docs first → update Last Updated → git add/commit/push

---

## SYNC PROTOCOL (EVERY SESSION END)

1. Close completed items in STATUS.md (check boxes)
2. Move completed items to CHANGELOG.md (date + commit + summary)  
3. Delete completed items from BACKLOG.md
4. Update `Last Updated` line in STATUS.md and BACKLOG.md
5. `npx tsc --noEmit` — confirm no new errors
6. `git add -A && git commit -m "..."` → `git push`
