# GHM DASHBOARD — MASTER STATUS
**Single source of truth. All other status files are archived.**  
**Last Updated:** February 20, 2026 — Onboarding Portal complete (all 5 phases), Wave Payments complete (W1-W6), W7 deferred

---

## ✅ COMPLETED (Do Not Rebuild)

### Core Platform (Phases 1-11)
- Authentication (NextAuth v5)
- Client management + **Edit Client Details** (PATCH API + dialog + profile integration)
- Lead database + discovery engine + enrichment (single + batch)
- Task system + AI content briefs (Claude Sonnet)
- Competitive scanning engine + daily cron + auto-task creation
- Content review queue
- Client-facing reports (generate + preview + download)
- Upsell detection engine
- Product catalog CRUD
- Advanced analytics (revenue forecast, funnel, lead source)
- Client portal (token-based)
- Email automation (Resend — report delivery, upsell, portal invites)

### Phase 12: Commission Transaction Engine
- Monthly cron (`/api/cron/generate-payments`) — generates residuals + master fees
- CompensationConfigSection wired into TeamManagementTab
- Commission trigger on client → active transition
- Dashboard widgets for all 3 role views (sales/master/owner)
- ⚠️ **Needs end-to-end test:** Mark German Auto Doctor active, verify transaction creation

### AI Client Layer (Phase 11)
- Model router (Free Energy minimization), complexity analyzer
- Cost tracker (per-client, per-feature USD logging)
- System prompt builder for all 5 AI features
- Unified `callAI()` entry point with cascade retry
- `ai_cost_logs` table live
- ✅ Content brief API already uses `callAI()`

### Admin Role System (Feb 18-19, 2026)
- 3-tier hierarchy: admin > master > sales
- `isElevated()` utility, `ROLE_LABELS` constant, `AppRole` type
- Role dropdown in team management (admin sees all 3, master sees 2)
- Role badges updated everywhere (ProfileForm, TeamFeed, nav, onboarding)
- Profile refresh on window focus (BUG-001 fix)
- Nav routing uses `isElevated()` for /master dashboard

### Bug Report System (FEAT-002, Feb 19, 2026)
- POST `/api/bug-reports` — any authenticated user
- GET `/api/bug-reports` — admin only, with filters
- PATCH `/api/bug-reports/[id]` — admin only, status/priority/notes
- BugReportsTab in Settings (admin-only tab)
- Auto-captures console errors, network errors, session data

### Permission System — Full Migration (Feb 20, 2026)
- All 16 API routes migrated to `withPermission()` with proper 401/403 responses
- Zero `requireMaster()` calls remain in API routes
- TypeScript: 0 errors

---

## 🔴 ACTIVE SPRINT — February 19, 2026

### Quick Wins — ✅ ALL DONE (BUG-002, BUG-003, BUG-004)
### Website Studio — ✅ ALL DONE (P1-P5)
### FEAT-003: My Tasks Dashboard Widget — ✅ DONE

---

## 🟡 NEXT TIER (After Sprint)

### Client Onboarding Portal — ✅ COMPLETE (Feb 20, 2026)
**Spec:** `D:\Work\SEO-Services\specs\ONBOARDING_PORTAL_SPEC.md`

| Phase | Tasks | Status |
|-------|-------|--------|
| 1. Foundation | Schema (OnboardingToken, OnboardingSubmission) + layout | ✅ DONE |
| 2. APIs | Token gen, form load/save/submit, pre-fill from lead | ✅ DONE |
| 3. Client Form | 5-step wizard + auto-save + confirmation + expiry UX | ✅ DONE |
| 4. Dashboard | Partner link gen, ops queue, submission detail + checklist | ✅ DONE |
| 5. Polish | Notifications, mobile responsiveness, refresh-token flow | ✅ DONE |

### Wave Payments Integration — ✅ W1-W6 COMPLETE (Feb 20, 2026)
**Spec:** `D:\Work\SEO-Services\specs\WAVE_PAYMENTS_BLUEPRINT.md`
**W7 deferred:** Running Gusto in parallel 1-2 weeks to identify gaps before canceling

| Phase | Status |
|-------|--------|
| W1. Wave Setup — account, BofA, API creds, Business ID | ✅ DONE |
| W2. Schema + lib/wave/ GraphQL client (8 files) | ✅ DONE |
| W3. Invoice automation AR — monthly cron, webhooks, overdue escalation | ✅ DONE |
| W4. Partner payments AP — vendor sync, bill gen, payout cron | ✅ DONE |
| W5. Dashboard UI — financial overview page, billing tab on client detail | ✅ DONE |
| W6. Settings — Wave tab (admin-only), AppSetting model, product picker | ✅ DONE |
| W7. Kill Gusto | ⏸ DEFERRED |

### API Integration Ecosystem — SPEC COMPLETE, READY TO BUILD
**Spec:** `D:\Work\SEO-Services\specs\API_INTEGRATION_BLUEPRINT.md` (1,124 lines)
**Effort:** ~56 hours | **Priority:** HIGH — completes intelligence engine, eliminates BrightLocal

| Sprint | Tasks | Hours | Status |
|--------|-------|-------|--------|
| I1. Provider Refactor + Cache | Extract providers, shared cache + cost tracking | 6 | 🔴 TODO |
| I2. DataForSEO SERP | Local rank tracking, Keywords tab, rank clusters | 12 | 🔴 TODO |
| I3. NAP Citation Scraper | 35 directory adapters, Citations tab, health sentry | 10 | 🔴 TODO |
| I4. Google Business Profile | OAuth, reviews, insights, posts, Local Presence tab | 8 | 🔴 TODO (needs Google approval) |
| I5. Report Generator Upgrades | Rank/citation/GBP/perf sections in client reports | 6 | 🔴 TODO |
| I6. Prospect Audit Enrichment | Rank data + citation health in sales audits | 4 | 🔴 TODO |
| I7. Google Ads + GoDaddy | Campaign data + domain deployment | 6 | ✅ DONE |
| I8. Settings + Admin Dashboard | Integration health, cost dashboard, cache stats | 4 | ✅ DONE |

**BrightLocal cancellation gate:** After I2 + I3 verified (rank data matching + NAP scraper working)

### Sales Launch — Dashboard Integration (See SALES_INTEGRATION_PLAN.md for full spec)

**Phase A: Foundation (Schema + Core Logic) — ✅ COMPLETE (Feb 20, 2026)**
| ID | Task | Status |
|----|------|--------|
| A1 | Schema: `lockedResidualAmount` + `closedInMonth` on ClientProfile | ✅ DONE |
| A2 | Schema: Residual tier config (company-wide $200/$250/$300 thresholds) in GlobalSettings | ✅ DONE |
| A3 | Logic: Tiered residual calculation with lock-at-close (`calculateTieredResidual`) | ✅ DONE |
| A4 | Logic: Auto-lock residual on lead → won (`createClientFromWonLead`) | ✅ DONE |
| A5 | Schema: `upsell_commission` payment type (string field, no enum change needed) | ✅ DONE |
| A6 | Logic: Upsell commission generation on product sale (10%, products route) | ✅ DONE |
| A7 | Logic: Rolling 90-day close rate (`calculateRolling90DayCloseRate` + `/api/users/[id]/close-rate`) | ✅ DONE |

**Phase B: Prospect Sales Tools — ✅ COMPLETE (Feb 20, 2026)**
| ID | Task | Status |
|----|------|--------|
| B1-B10 | Audit PDF, Demo Generator, Brochure, Comp Sheet, Territory Map — all built and deployed | ✅ DONE |

**Phase C: Dashboard UI Enhancements — PARTIAL**
| ID | Task | Status |
|----|------|--------|
| C1 | UI: Territory banner on pipeline/leads page | ✅ DONE |
| C2 | UI: Territory stats card on sales dashboard | ✅ DONE |
| C3 | UI: Rolling 90-day close rate on sales dashboard | ✅ DONE |
| C4 | UI: Production threshold warnings (admin + rep views) | ✅ DONE |
| C5 | UI: CompensationConfigSection — tier config fields (admin can edit tier thresholds/amounts) | ✅ DONE |
| C6 | UI: My Earnings — tiered breakdown with locked rates | ✅ DONE |
| C7 | UI: My Earnings — upsell commission line items | ✅ DONE |
| C8 | UI: Gavin's profitability — use actual locked rates | ✅ DONE |
| C9 | UI: Earnings projection ("your book will be worth $X by...") | ✅ DONE (My Book widget) |

**Phase D: Polish & Sales Enablement — MEDIUM**
| ID | Task | Status |
|----|------|--------|
| D1 | Audit history on lead detail | 🔴 TODO |
| D2 | Demo history on lead detail | 🔴 TODO |
| D3 | Shareable audit link (public, no auth required) | 🔴 TODO |
| D4 | Audit → Demo one-click workflow | 🔴 TODO |
| D5 | Territory map visualization (simple/static) | 🔴 TODO |

**Non-Dashboard Sales Enablement (External Collateral)**
| ID | Task | Status |
|----|------|--------|
| S3 | Digital Brochure — one-pager, phone/Zoom optimized | 🔴 TODO |
| S4 | Recruiting Comp Sheet — earnings projections for candidates | 🔴 TODO |
| S5 | Territory Map — initial definitions for first 4 reps | 🔴 TODO |
| S6 | Sales Agreement Template — contractor terms | 🔴 TODO |
| S7 | Job Ad — draft and post | 🔴 TODO |

### Commission System Validation
- End-to-end test with live client
- Manually trigger monthly cron to verify residual generation
- Verify dashboard widgets populate

### Other Pending (Lower Priority)
- BUG-005: ✅ DONE | BUG-006: ✅ DONE
- Pipeline Filter UX refinement
- Content Library → Calendar Scheduling
- Content CTA Enforcement
- Task Pipeline UX: ✅ ALL DONE (schema, API, UI, kanban, transitions, history)
- Voice System — Sardonic Micro-Copy Layer (Low)
- TeamFeed Multimedia (Low)

---

## 📥 BACKLOG — Added February 20, 2026

### ITEM-001: Google Ads & PPC — Surface in All Materials
**Priority:** HIGH — affects contracts, onboarding, dashboard, demos, reporting
**Context:** The $2,400/month standard package includes both Google Ads management AND Google PPC management. Clients pay ad spend directly; GHM manages both under the same package fee.

**Dashboard work needed:**
- I7 (Google Ads sprint) is already in the API Integration Ecosystem above — ensure it surfaces campaign metrics (impressions, clicks, CTR, spend, ROAS) in the client detail view and monthly reports
- Add a "Campaigns" section to the client-facing report template alongside the existing rank/citation/GBP sections
- Add Google Ads account linking to the client onboarding portal form (so clients can grant access during signup)
- Dashboard should help ops team make decisions: flag underperforming campaigns, spend pacing alerts, keyword performance trends

**Materials/contracts needed:**
- `CLIENT_AGREEMENT.md` — add explicit language: "Package includes Google Ads campaign management and Google PPC management. Client is responsible for direct ad spend billed by Google. GHM manages all campaign setup, optimization, and reporting at no additional management fee."
- `CLIENT_ONBOARDING_FORM.md` — add Google Ads account ID field + access grant instructions
- Digital brochure (S3) — highlight Ads + PPC management as included value
- Sales audit PDF (I6) — add a "Paid Search Opportunity" section analyzing whether prospect is running Ads and how much they're leaving on the table
- Demo pages (B6/B7) — include mock Ads campaign metrics to show what they'd see as a client

---

### ITEM-002: GHM is an "Inc" not "LLC"
**Priority:** HIGH — legal/brand accuracy, must fix before any external materials go out
**Scope:** Global find-and-replace across all files that might say "LLC"

**Files to audit and fix:**
- `D:\Work\SEO-Services\CLIENT_AGREEMENT.md` — contract header
- `D:\Work\SEO-Services\ghm-dashboard\BUSINESS_DNA.yaml` — company identity
- Any PDF templates, work order headers, email templates in `src/lib/email/templates.ts`
- Work order PDF template (`src/lib/pdf/work-order-template.tsx`) — company name in header
- Client portal — any footer/branding text
- Onboarding form — any GHM entity references
- `README.md`, `OWNER_CONFIG.md`, `QUICK_REFERENCE.md` — anywhere GHM is named formally

**Search pattern to run:** grep for "GHM.*LLC", "G.H.M.*LLC", "llc" (case-insensitive) across entire project before closing this item.

---

### ITEM-003: Per-Page Tutorial System (Replace Global Onboarding Tutorial)
**Priority:** MEDIUM — UX improvement, important as app grows
**Context:** Current `onboarding-tutorial.tsx` is a single monolithic walkthrough shown to new users. As pages and features accumulate, this will overwhelm users and become impossible to maintain. Replace with a per-page approach.

**Proposed architecture:**
- Each page that warrants a tutorial gets its own tutorial component or config array: steps specific to that page's elements
- First-visit detection: check `localStorage` (or a `UserSettings` DB flag) for `"tutorial_seen_[page_slug]"` — show tutorial on first visit, never again unless reset
- Global tutorial reset option in user profile/settings ("Reset all page tours")
- Tutorial trigger button on each page (e.g., a `?` icon) so users can re-run the tour for that page anytime
- Tutorial steps should be data-driven (array of `{ target, title, content }`) not hardcoded JSX, so adding steps to any page doesn't require touching shared components

**Pages to build tutorials for (in priority order):**
1. Leads / Pipeline (most complex, most used by reps)
2. Client Detail (tabs, scan history, actions)
3. Discovery (search + import flow)
4. Content Studio (briefs, review queue)
5. Reports (generate + preview)
6. Settings / Team (admin only)
7. Analytics
8. Onboarding Portal (client-facing)

**Implementation notes:**
- Can use an existing library (Driver.js, Intro.js, Shepherd.js) or build a lightweight custom component — evaluate bundle size trade-off
- Kill the global `onboarding-tutorial.tsx` once per-page system is live for the top 3 pages
- Coordinate with the permission system — don't show tutorials for features a user can't access

---

---

## 🟠 QUEUED — NOT YET STARTED

### FEAT-010: Rep Dashboard View — ✅ COMPLETE (Feb 20, 2026)
**Commit:** b72fc37
- Territory health banner (green/amber/red, progress bar, rolling 90-day avg vs 2/mo threshold)
- My Book widget (current monthly residual, 6 + 12 month churn-adjusted projections, avg per client)
- Sales Tools Panel (7 quick-access buttons: Pipeline, Claim Leads, Audit PDF, Live Demo, Brochure, Comp Sheet, Territory Map)
- Enhanced metrics: Available leads, Active leads, My Book (active clients), All-time wins + value
- Needs Attention list with stale lead highlighting (5+ days in stage = amber)

### FEAT-011: Rep Onboarding Flow — ✅ COMPLETE (Feb 20, 2026)
**Commit:** e613280
- 7-step wizard: Welcome → Role → Territory → Tools → First Lead → Resources → Done
- Progress tracking persisted to DB (repOnboardingStep, repOnboardingCompletedAt)
- First-login redirect: /sales page auto-redirects reps who haven't completed onboarding to /rep-setup
- Admin can reset onboarding from team settings by clearing repOnboardingCompletedAt
- API: GET/PATCH /api/users/onboarding
**Scope:** Sales role gets a purpose-built dashboard showing exactly what matters to them and nothing else

**Rep dashboard should include:**
- Territory banner (name, claimed date, threshold status green/yellow/red)
- My Pipeline: active leads, hot leads flagged, recent activity
- My Book: active clients count, total monthly residual, projected 90-day churn-adjusted value
- Close rate widget: rolling 90-day closes vs. threshold (2/mo), visual progress bar
- Earnings this month: close bonuses earned + residual income total + upsell commissions
- Earnings projection: book value at 6 months, 12 months (live calc based on current trajectory)
- Quick actions: Generate Audit, Create Demo, Add Lead, View Brochure, View Comp Sheet
- Recent activity feed: last 5 actions (closes, demos created, enrichments run)

**Key constraint:** Rep sees ONLY their own data — their territory, their leads, their book, their earnings. No team view unless elevated.

**Files:**
- `src/app/(dashboard)/sales/page.tsx` — likely exists, needs full rebuild
- `src/components/sales/rep-dashboard/` — new component folder
- `src/app/api/payments/my-earnings/route.ts` — likely exists, verify
- `src/app/api/territories/` — verify territory data available

---

### FEAT-011: Rep Onboarding Flow
**Priority:** HIGH — needed for first hire
**Scope:** When a new sales rep account is created and they log in for the first time, walk them through setup and orientation. Not a tutorial overlay — a real sequential onboarding flow with discrete steps they complete.

**Steps:**
1. Welcome screen — who GHM is, what the role is, what success looks like
2. Profile setup — name, phone, preferred contact (pre-filled from invite)
3. Territory claim — show territory map, pick their territory (or confirm if pre-assigned)
4. Tool orientation — 3 short cards: what Leads page does, what Audit PDF is, what Live Demo does
5. First lead — prompt them to either import a lead or find one via Discovery
6. Resources — links to: Brochure, Comp Sheet, Territory Map, Partner Agreement (from Document Vault once built)
7. Done — "You're live. Go close something."

**Admin side:**
- Master/admin can trigger rep onboarding manually from Team settings (resend first-login state)
- Onboarding completion tracked in DB (`repOnboardingCompletedAt` on User)
- Admin sees onboarding status per rep in Team tab

**Files:**
- `src/app/(onboarding)/rep-setup/page.tsx` — new multi-step flow
- `src/components/onboarding/rep-onboarding-wizard.tsx` — stepper component
- Schema: add `repOnboardingCompletedAt DateTime?` to User model

---

### FEAT-012: Document Vault — ✅ COMPLETE (Feb 20, 2026)
**Commit:** 56f8135
- 4 spaces: Shared (everyone, manager-upload), Private (per-user), Client Reports (auto-populated), Signed Contracts
- Shared space: categorized view (Sales Resources, Legal, Templates, Onboarding, Misc) with version management
- Upload: drag-and-drop dialog with space/category selectors, elevated-only guard for shared spaces
- Transfer: private → shared in one click (with category prompt); TeamFeed attachment → Vault via API
- File tiles: open/download on click, dropdown for delete/transfer, mobile-friendly
- Search across all files in active tab
- Schema: VaultFile model + TeamMessage attachment fields (attachmentUrl, attachmentName, attachmentSize, attachmentMimeType, attachmentVaultId)
- Nav: Document Vault added to sidebar (visible to all roles)
- APIs: POST /api/vault/upload, GET/DELETE /api/vault/files, POST /api/vault/transfer
- **TODO (next session):** TeamFeed UI — "Save to Vault" button on file attachments in messages
**Scope:** Shared file repository with public (everyone) and private (per-user) spaces. Natural, intuitive, useful — not a dumping ground.

**Spaces:**
- **Shared** — manager-curated. Current versions of contracts, comp sheet, brochure, territory map, onboarding packet, policy docs. Read access for all, write/upload for admin/master only. Organized by category (Sales Resources, Legal, Templates, Reports).
- **Private** — per-user personal stash. Notes, prospect research, personal drafts. Only visible to owner. Full upload/delete for the owner.
- **Client Reports** — auto-populated. Every generated client report (historical) lives here, organized by client. Managers and the assigned rep can access. No manual upload needed — generation auto-saves here.
- **Signed Contracts** — auto-populated + manual upload. Signed partner agreements and client agreements land here. Searchable by name/date.

**Interactions:**
- Upload to either space from any page (drag-drop or file picker) — a floating "Save to Vault" affordance
- Transfer file from Private → Shared in one click (manager confirms if the file is going public)
- Transfer file from TeamFeed message → Vault: any file attachment in TeamFeed gets a "Save to Vault" button that opens a modal (choose space + category)
- Transfer file from Vault → TeamFeed: attach from Vault when composing a team message
- Every generated artifact (report PDF, audit PDF, demo HTML, work order) offers "Save to Vault" on generation
- Search across all accessible files (name, category, uploader, date range)

**Organization:**
- Shared space uses manager-defined categories (default: Sales Resources, Legal, Templates, Client Reports, Signed Contracts, Misc)
- Private space is flat — user-defined tags optional
- Recent files surfaced at top of each space
- File versioning for Shared space — uploading a new version of a contract keeps old version accessible but marks new as current

**File storage:**
- Use Vercel Blob or S3-compatible storage (not DB blobs)
- DB stores metadata: name, space, category, uploader, size, mime type, blob URL, version, created/updated
- Signed URLs for secure access (files are not publicly addressable)

**Files:**
- `prisma/schema.prisma` — new `VaultFile` model
- `src/app/(dashboard)/vault/page.tsx` — main vault page
- `src/components/vault/` — VaultShared, VaultPrivate, VaultUploadModal, VaultSearch, VaultFileTile
- `src/app/api/vault/` — upload, list, delete, transfer, presigned-url routes
- TeamFeed integration — "Save to Vault" on file attachments
- Storage: Vercel Blob (already available in this stack)

---

## 🟢 INFRASTRUCTURE (When Time Allows)

- Client Portal migration
- Error monitoring (Sentry)
- Structured logging
- Security hardening (2FA, rate limiting)
- Automated testing
- Production deployment checklist

---

## ⚪ FUTURE ROADMAP (Not Blocking Anything)

- Review Enhancement Engine
- PPC Keyword Automation
- Lead Gen Studio
- Voice profiles, advanced discovery, work order PDFs, advanced analytics
- Mobile apps, white-label, integrations, command palette, accessibility

---

## 📁 FILE INDEX

**This file (`STATUS.md`)** — Single source of truth for project status.

**Specs (reference when building):**
- `SALES_INTEGRATION_PLAN.md` — Full gap analysis, schema changes, API specs, UI requirements for sales features
- `INTEGRATION_STRATEGY.md` — API selection, enrichment, scaling, caching
- `COMMISSION_SYSTEM_SPEC.md` — Commission structure, DB schema, UI designs
- `EDIT_AND_TASKS_SPEC.md` — Edit client + bulk task management
- `BUILD_PLAN.md` — Master build plan + Website Studio status
- `QUICK_REFERENCE.md` — API keys, env vars, deployment info
- `D:\Work\SEO-Services\specs\ONBOARDING_PORTAL_SPEC.md` — Client onboarding portal (token-auth form, wireframes, 21 tasks)
- `D:\Work\SEO-Services\specs\WAVE_PAYMENTS_BLUEPRINT.md` — Wave payments integration (schema, wireframes, 30 tasks)
- `D:\Work\SEO-Services\specs\CONTRACT_AUDIT_AND_PAYMENTS.md` — Contract claims audit + payments architecture narrative
- `D:\Work\SEO-Services\specs\API_INTEGRATION_BLUEPRINT.md` — API ecosystem (DataForSEO, NAP, GBP, Ads, GoDaddy, 56 hrs)

**Business operations:**
- `D:\Work\SEO-Services\SALES_OPERATIONS.md` — Canonical sales comp, territory, hiring manual
- `D:\Work\SEO-Services\CLIENT_AGREEMENT.md` — Client service agreement (month-to-month, $2,400/mo)
- `D:\Work\SEO-Services\CLIENT_ONBOARDING_FORM.md` — Onboarding form content (source for portal spec)
- `BUSINESS_DNA.yaml` — Company identity, market, ops, priorities

---

## 🔒 CRITICAL CONSTRAINTS (Always Enforce)

- **DB drift:** NEVER run `prisma migrate dev` — use `prisma db push` only
- **"master" stays as DB enum** — UI shows "Manager" via ROLE_LABELS
- **David's account = admin role** in Neon DB
- **Admin hierarchy:** admin > master > sales, `isElevated()` = admin|master
- **TypeScript must be clean** — run `npx tsc --noEmit` before closing any sprint
