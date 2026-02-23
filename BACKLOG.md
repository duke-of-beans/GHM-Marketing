# GHM DASHBOARD — PRODUCT BACKLOG
**Reconciled:** February 23, 2026 — Full audit against git history, past chat sessions, and local files.
**Method:** Every item verified against commit log + chat evidence before status assigned.
**Owner:** David Kirsch

This file is the single source of truth for everything we want to build that isn't yet started.
STATUS.md owns what's done and what's in-sprint. This file owns what comes next.

---

## 🧭 HOW TO USE THIS FILE

Each item has a **tier**, **size estimate**, and **dependency note**.
Pick the top item in your current tier that unblocks the next thing, not the most interesting one.

**Tiers:**
- 🔴 MUST — Blocking client or rep operations right now
- 🟠 SHOULD — Blocking productization / investor pitch / next client tier
- 🟡 WOULD — High value, no current blocker, but visible to users
- ⚪ FUTURE — Vision items, research needed, or deferred until scale

---

## 🔴 MUST — Active Blockers

### ✅ Commission Validation — COMPLETE (February 22, 2026)
Cron triggered, PaymentTransactions verified, Wave bill generated. Apex North test client deleted. End-to-end confirmed working.
**Commits:** f5fcb3f, f9e8bcf

### W7 — Kill Gusto (after parallel validation)
**Context:** Wave AP/payroll is fully built. Gusto still running in parallel per David's decision.
**Gate:** Complete at least one successful payroll cycle through Wave → confirm Wave covers payroll, contractor 1099, benefits → cancel Gusto → update SALARY_ONLY_USER_IDS if anything changes.
**Action:** Ops decision, no code. ~30 min once gate is cleared.

### I4 — Google Business Profile OAuth (external wait)
**Context:** GBP integration built (OAuth flow, reviews, insights, posts, Local Presence tab). Blocked on Google API Console approval for external app status.
**Action:** Monitor approval status → flip from test to production → verify OAuth flow with a real client listing.
**Size:** ~1 hr once approved.

---

## 🟠 SHOULD — Productization & Growth

### ✅ Vendor Flexibility Architecture — COMPLETE (February 23, 2026)
Provider interfaces built for Wave/GoDaddy/Resend with TENANT_REGISTRY providers block.
**Commit:** 2ebdefb

### ✅ AI Universal Search (Cmd+K) — COMPLETE (February 23, 2026)
Two-phase local+AI search bar wired into DashboardLayoutClient.
**Commit:** e762287

### ✅ Commission System Phase A + C — COMPLETE (February 20, 2026)
lockedResidualAmount, tiered residuals, lock-at-close logic all built and deployed.
**Commits:** 331ac9b, 0e6c291

### ✅ PWA Manifest + Push Notifications — COMPLETE (February 17, 2026)
VAPID keys, service worker, PushSubscription table, permission prompt in TeamFeed, fires on message + task assignment. Settings toggles. Android full support, iOS 16.4+ via home screen install.
**Commit:** 2abf973
**NOTE:** VAPID keys must be in Vercel env vars — confirm they're still set (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`).

### ✅ TeamFeed Permanent Sidebar — COMPLETE (February 17, 2026)
Collapsible right-panel that squeezes content (not overlay). Toggle in master page header with unread badge. State in localStorage.
**Commit:** f61d299

### ✅ Ops Layer Sprints 0–5 — COMPLETE (February 23, 2026)
Sprint 0: Alert engine, notifications, data-source monitor, recurring tasks, full schema migration.
Sprint 1: Execution spine — checklists, recurring tasks, alert links.
Sprint 2: Site Health — SiteHealthSnapshot, cron, API, tab, alert rules.
Sprint 3: GBP snapshot system + AI post drafting + alert rules.
Sprint 4: Approval workflow engine + ApprovalModal + staleness monitoring + deployment task automation.
Sprint 5: AI report narratives — ai-narrative.ts, generator/template updates, report_narrative AIFeature.
**Commits:** 9bd8cad, cc5d3e9, e6cf800, 35d32e4, d92c03f, 046308d, 5afed4d, e86d677
**NOTE:** Sprints 6–8 from the original ops-layer plan were not committed — see below.

### Ops Layer Sprints 6–8 (OPEN — never built)
**Context:** The ops-layer sprint plan (commit 04d2a92) laid out 9 sprints. Sprints 0–5 shipped. Sprints 6–8 were never committed.
**What was planned:**
- **Sprint 6:** Reporting pipeline — scheduled monthly report generation, delivery queue, per-client schedule (1st/5th/15th), Resend delivery, delivery log on client record
- **Sprint 7:** Bulk operations — bulk content approve/archive/assign, bulk task close, batch pipeline actions
- **Sprint 8:** Advanced analytics + insights — trend analysis, MoM/YoY comparisons, churn risk scoring, client health trajectory charts
**Size:** ~1 session per sprint.
**Files:** `src/app/api/reports/schedule/`, `src/components/content/BulkActions.tsx`, `src/app/(dashboard)/analytics/`

### Client Portal — Activation
**Context:** Portal was fully built in Feb 17 session but disabled via `.disabled` file extensions because it required a `portalToken` field migration. The OnboardingToken-based portal (built Feb 20) may have superseded this — needs a decision before re-enabling.
**Current state:** Three files still disabled:
- `src/app/(portal)/portal/page.tsx.disabled`
- `src/app/api/clients/[id]/generate-portal-token/route.ts.disabled`
- `src/app/api/email/send-portal-invite/route.ts.disabled`
**Action needed:** Decide whether the Feb 17 portal OR the Feb 20 OnboardingToken portal is the right path. If the old portal is still needed: `prisma db push` after adding `portalToken String? @unique` to ClientProfile, then rename `.disabled` files. If superseded: delete the disabled files and document the decision.
**Size:** ~1 hr decision + cleanup.

### Keyboard Shortcuts Layer
**Context:** Cmd+K global search exists (e762287). Keyboard shortcuts for navigation don't. Wanted since early sessions.
**Scope:**
- `G L` → go to leads, `G C` → go to clients, `N L` → new lead, `N T` → new task
- `?` shortcut hint overlay showing all shortcuts
- Use `cmdk` library (shadcn already wraps it)
**Size:** ~2–3 hrs additive to existing search bar.

### COVOS Admin Onboarding Wizard
**Context:** Documented in PRODUCTIZING_BACKLOG.md (commit c2a6daa). Required before a second agency can onboard themselves onto the platform without GHM support.
**Scope:** Guided in-product wizard covering API configuration, vendor selection, contractor/vendor setup, environment variable checklist (live UI showing which env vars are set/missing), role/permission briefing. North star: zero-touch self-service for new tenants.
**Size:** ~2 sessions.
**Files:** `src/app/(dashboard)/settings/onboarding/` (new), `src/lib/tenant/`

### Security Hardening
**Context:** Flagged in multiple past sessions as medium priority.
**Scope:**
- 2FA for admin + master accounts (TOTP via `otplib` or NextAuth MFA hooks)
- Rate limiting per user on auth endpoints
- CSRF token verification on sensitive mutation routes
- Security headers audit (`CSP`, `X-Frame-Options`, `Referrer-Policy`) via `next.config.js`
**Size:** ~1 session.

---

## 🟡 WOULD — High Value, No Current Blocker

### Reporting — Scheduled Delivery (Sprint 6 subset)
**Context:** Reports are manually generated. Contract implies monthly delivery. Was in ops-layer Sprint 6 plan.
**Scope:** Per-client report schedule (1st, 5th, or 15th), delivery email + cc list, monthly cron, delivery log on client record.
**Size:** ~1 session.

### Advanced Filter Persistence + Save Searches
**Context:** Pipeline filter bar has localStorage persistence. Next tier is named saved searches.
**Scope:** "Save this filter" button → names the current combo → chips above filter bar (e.g., "Hot leads - Austin") → per-user, persisted to DB, max 5 per user.
**Size:** ~2–3 hrs.

### Pipeline Filter — Remaining UX Debt
**Context:** Major UX pass done Feb 22. Three items left from original spec.
**Scope:**
- "Lead Source" filter (organic/referral/discovery/import — in DB, not surfaced)
- "Deal Value" range slider
- "Days in Stage" filter (stale leads > N days in current stage)
**Size:** ~2 hrs total.

### Audit PDF — Paid Search Opportunity Section
**Context:** In original ITEM-001 scope, never built.
**Scope:** Add a section to the audit PDF template: estimated monthly search volume for target keywords, competitor ad spend indicators (DataForSEO), "you're leaving X/mo in paid visibility on the table" framing.
**Size:** ~1 hr (template-driven).

### Digital Brochure — PPC/Ads Highlight
**Context:** In ITEM-001 scope, never built. Brochure currently focuses only on SEO.
**Scope:** Add a section to `src/app/(onboarding)/brochure/page.tsx` covering Google Ads management + PPC as part of the $2,400/mo package. Include mock campaign metrics.
**Size:** ~1 hr.

### Bulk Content Operations (Sprint 7 subset)
**Context:** Content Studio manages items one at a time. Was in ops-layer Sprint 7 plan.
**Scope:** Checkbox multi-select on Content Studio list, bulk approve (master+ only), bulk archive, bulk assign.
**Size:** ~2 hrs.

### Competitor Tracking — Manual Add + Refresh
**Context:** Competitors seeded at client creation, updated by scans. No manual refresh.
**Scope:** "Add Competitor" button (name + domain), "Remove Competitor", "Refresh Competitor Data" (re-runs enrichment on demand).
**Size:** ~2 hrs.

### Reporting — Custom Report Builder
**Context:** Reports auto-generated from scan data. Power users want to pick sections.
**Scope:** Section toggle UI before generation, per-client report template (save preferred sections), AI-written "Executive Summary" paragraph at top using scan delta data.
**Size:** ~1 session.

### Data Export — Leads + Clients → CSV/XLSX
**Context:** Zero export capability. Requested in multiple past sessions.
**Scope:** "Export" button on Leads table (current filtered view → CSV), "Export" on Clients table, column picker, admin-only full DB export.
**Size:** ~3 hrs.

### Sentry Error Monitoring
**Context:** No runtime error visibility in production. Users report bugs that should be auto-surfaced.
**Scope:** `@sentry/nextjs` install + wizard config, source maps on deploy, alerts for error rate threshold + new types, user context (role, email) attached to events.
**Size:** ~1 hr setup.

### Structured Logging (Replace console.log)
**Context:** Crons and API routes use `console.log` everywhere. No severity, no trace IDs.
**Scope:** Minimal structured logger (`log.info/warn/error` with JSON output), correlation IDs on API routes, consider `pino`.
**Size:** ~2 hrs.

### Static Empty State Help Text (AI-Aware)
**Context:** Current empty states are static. Was noted in Feb 23 commit cb8dd9d as a backlog item.
**Scope:** Empty states in Leads, Clients, Content Studio, and other key pages that incorporate context-aware suggestions — e.g., an empty Leads pipeline suggests "Run a Discovery scan to import leads" with a direct action button. Pairs well with AI search layer.
**Size:** ~2–3 hrs.

### User Activity / Session Stats (Admin View)
**Context:** Discussed in Feb 18 copy audit chat. No per-user session tracking exists.
**Scope:** Admin-visible stats: last login, login count, average session duration, pages visited. Likely needs a `UserSession` table or extension of `AuditLog`. Display in a new "User Activity" section, admin-only.
**Size:** ~1 session.

---

## ⚪ FUTURE — Vision & Scale

### Accessibility (WCAG 2.1 AA)
Basic accessibility only. Required before enterprise sales. Start with keyboard navigation (highest ROI), then screen reader, focus indicators, high contrast mode.
**Size:** ~1–2 weeks full audit + fix pass.

### Mobile-Optimized UX (Beyond Responsive)
Full-screen mobile kanban (currently horizontal scroll — flagged as known UX issue), touch-optimized lead cards with swipe actions (right = claim, left = dismiss), mobile-specific quick actions.
**Size:** ~2–3 sessions.

### Native Mobile Apps (iOS + Android)
React Native with shared business logic. Expo for faster iteration. Push notifications (already live) must be stable first. API layer must be clean and documented.
**Prerequisite:** Security hardening + API documentation complete.

### White-Label / Multi-Agency Productization (Covos)
Multi-tenant infrastructure is live (covos.app, `*.covos.app`, TENANT_REGISTRY). Next tier:
- Self-serve agency onboarding (subdomain + tenant setup)
- Per-tenant branding (logo, primary color, company name in all UI + emails)
- Per-tenant billing
- Tenant admin panel (user management, billing, integration config, branding)
- Data isolation audit (verify no cross-tenant leakage in any API route)
**Prerequisite:** Vendor Flexibility Architecture complete (it is). COVOS Admin Onboarding Wizard complete.
**Size:** 2–3 sessions for core self-serve flow; ongoing for billing and admin.

---

## ✅ RECENTLY CLOSED (for reference)

| Item | Completed | Commit |
|------|-----------|--------|
| Task→Invoice auto-generation on website_deployment→deployed | Feb 23, 2026 | 92b2629 |
| Vendor Flexibility Architecture (provider interfaces) | Feb 23, 2026 | 2ebdefb |
| pick() readonly tuple fix | Feb 23, 2026 | a6d8108 |
| Tutorial sardonic voice rewrite + overlap fix | Feb 23, 2026 | 17fceb6 |
| AI Universal Search (Cmd+K) | Feb 23, 2026 | e762287 |
| Ops Layer Sprints 0–5 | Feb 23, 2026 | 9bd8cad–e86d677 |
| Basecamp OAuth integration | Feb 22, 2026 | 153205e |
| Sprint B — historical Wave invoice import | Feb 22, 2026 | f9e8bcf |
| Commission validation end-to-end | Feb 22, 2026 | f5fcb3f |
| I4 GBP OAuth (code complete, pending Google approval) | Feb 22, 2026 | 0a97fad |
| FINANCE-001 live financial overview | Feb 22, 2026 | 8df9bd8 |
| Covos multi-tenant infrastructure | Feb 22, 2026 | a586948 |
| Sprint 4 pipeline filter UX + voice/micro-copy layer | Feb 22, 2026 | afb4eba |
| ITEM-003 per-page Driver.js tutorials | Feb 22, 2026 | 817b9d5 |
| VAULT-001 shared file version warning + download toast | Feb 23, 2026 | e953ef3 |
| Phase A + C commission system | Feb 20, 2026 | 331ac9b |
| I1–I6 API integrations (DataForSEO, NAP, GBP, report sections, audit) | Feb 19–20, 2026 | 6058025–b04ae15 |
| Permission migration (16 routes) + task pipeline | Feb 19, 2026 | 03bf33b |
| PWA manifest + push notifications | Feb 17, 2026 | 2abf973 |
| TeamFeed permanent collapsible sidebar | Feb 17, 2026 | f61d299 |
| Content Studio collapsible panels | Feb 18, 2026 | 8d0622d |
| Content Studio PPC ad copy generator | Feb 18, 2026 | (session e724a6f6) |
| Content Studio topic + keyword generator (unified panel) | Feb 18, 2026 | (session e724a6f6) |
| Client portfolio sorting (A–Z, Z–A, MRR, health, newest, oldest) | Feb 18, 2026 | (session e724a6f6) |
| SCRVNR gate engine (voice alignment, 54/54 tests) | Feb 18, 2026 | 81c2c1e |
| Wave payments W1–W6 | Feb 19–22, 2026 | ceec0e5 |
| Onboarding portal (OnboardingToken-based) | Feb 20, 2026 | (session 6522f504) |
| Rep dashboard + onboarding wizard | Feb 20, 2026 | b72fc37, e613280 |
| Document Vault + TeamFeed Save to Vault | Feb 20, 2026 | 56f8135, b62af2c |
| Sales tools (audit PDF, brochure, comp sheet, territory map) | Feb 20, 2026 | f1ee8ae |
| UX-001/002/003/004 client detail refactor + nav | Feb 20, 2026 | b759f42–dd4e1ed |
| Admin task auto-creation on user creation | Feb 22, 2026 | 084a437 |
| Client churn + hard delete with notes | Feb 22, 2026 | 9d638c6 |
| Client tabs — primary nav + grouped overflow More menu | Feb 22, 2026 | d9bb3f3 |
