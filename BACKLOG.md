# GHM DASHBOARD — PRODUCT BACKLOG
**Last Updated:** March 3, 2026 — SEO vertical satellite cluster quality items added.

**Owner:** David Kirsch

This file contains ONLY open work. When an item ships:
1. Add a row to CHANGELOG.md (date + commit + summary)
2. Delete the item from this file
3. Update STATUS.md "Last Updated" line
4. Then commit

Completed history lives in CHANGELOG.md. Never put ✅ items here.

---

## 🗺️ RECOMMENDED SPRINT SEQUENCE

Foundation → out. Each sprint unblocks the next.

| Sprint | Focus | Items | Size | Why This Order |
|--------|-------|-------|------|----------------|
| ~~1~~ | ~~Production Foundation~~ | ~~Security Hardening + Sentry + Structured Logging~~ | ✅ SHIPPED | |
| ~~2~~ | ~~Ops Spine Completion~~ | ~~Client Portal Decision + Ops Sprint 6 (Reporting Pipeline)~~ | ✅ SHIPPED | |
| ~~3~~ | ~~Bulk Operations~~ | ~~Ops Sprint 7 (bulk content/task/pipeline)~~ | ✅ SHIPPED | |
| ~~4~~ | ~~Intelligence Layer~~ | ~~Ops Sprint 8 (MoM/YoY trends, churn risk, health trajectories)~~ | ✅ SHIPPED | |
| ~~UX~~ | ~~UX Bug Batch~~ | ~~BUG-001–007 + ARCH-001~~ | ✅ SHIPPED | |
| ~~5~~ | ~~Data Access + Admin Visibility~~ | ~~Data Export + User Activity/Session Stats~~ | ✅ SHIPPED | |
| ~~6~~ | ~~UX Completeness~~ | ~~Static Empty States · Pipeline Filter UX debt · UX-BUG-007/008 · Keyboard Shortcuts~~ | ✅ SHIPPED | |
| ~~7~~ | ~~Sales Enablement Polish~~ | ~~Audit PDF PPC + Brochure PPC + Save Searches~~ | ✅ SHIPPED | |
| ~~8~~ | ~~Content Power~~ | ~~Bulk Content Ops + Competitor Tracking + Custom Report Builder~~ | ✅ SHIPPED | |
| ~~9~~ | ~~Admin Infrastructure~~ | ~~Import visibility + Admin elevation + Branding system + Admin first-run wizard~~ | ✅ SHIPPED | |
| ~~12~~ | ~~Route/Permission Audit~~ | ~~3 unguarded pages + API role bug + stale ID~~ | ✅ SHIPPED | |
| ~~13~~ | ~~Bug Triage~~ | ~~BUG-010/011 + AUDIT-004 dashboard flash~~ | ✅ SHIPPED | |
| ~~14~~ | ~~UX Polish Batch~~ | ~~UX-AUDIT-013 + UX-AUDIT-016/017 + UX-BUG-001/002~~ | ✅ SHIPPED | |
| ~~15~~ | ~~Pipeline Intelligence~~ | ~~FEAT-025 (full Lead model filters) + FEAT-026 (filter UX defaults) + UX-FEAT-001 (filter bar presentation)~~ | ✅ SHIPPED | |
| ~~16~~ | ~~Admin Polish~~ | ~~FEAT-027 (logo nav) + FEAT-028 (bug report feedback) + UX-AUDIT-015 (Content Studio empty states)~~ | ✅ SHIPPED | |
| ~~16.5~~ | ~~Critical Bug Batch~~ | ~~BUG-020 (forgot password) + BUG-021 (Wave label) + BUG-022 (territories data sync) + BUG-023 (vault: preview/delete/message) + BUG-024 (service catalog edit prefill)~~ | ✅ SHIPPED | |
| ~~17~~ | ~~Admin First-Run (Full)~~ | ~~FEAT-015 (7-step wizard) + FEAT-018 (login logo) + UX-AUDIT-012 (3-color branding) + BrandThemeInjector~~ | ✅ SHIPPED | |
| UI-CONST | UI/UX Constitution + Design System Saga | UI-CONST-001 — runs parallel to all sprints; audit → blueprint → build in groups | Multi-session initiative | Professional-grade UI indistinguishable from Xero/Slack/Monday. Prerequisite for White-Label/COVOS productization. |
| ~~18~~ | ~~Analytics + Telemetry~~ | ~~FEAT-019 (dashboard usage metrics) + FEAT-020 (COVOS owner telemetry) + UX-AUDIT-022 (Settings IA consolidation)~~ | ✅ SHIPPED | |
| ~~19~~ | ~~Content Automation~~ | ~~FEAT-022 (TeamFeed multimedia) + FEAT-023 (stock photo library) + FEAT-024 (client website audit)~~ | ✅ SHIPPED | |
| ~~20~~ | ~~COVOS Self-Service~~ | ~~FEAT-014 (PM Import) + BUG-025 (auth loop)~~ | ✅ SHIPPED | |
| ~~21-A~~ | ~~Bug Triage Batch~~ | ~~BUG-026 (forgot pw email) + BUG-027 (goals hint) + BUG-028 (emoji/gif) + BUG-017/018/019~~ | ✅ SHIPPED | |
| 21-B | TeamFeed Polish | UX-AUDIT-025 (TeamFeed full overhaul) | ✅ SHIPPED | |
| 21-C | Import Hardening | FEAT-033 (edge cases + validation + rollback) | ✅ SHIPPED | |
| 22 | COVOS Identity | UX-AUDIT-024 (branding pass) + UX-AUDIT-023 (tour tip sparkle) | ✅ SHIPPED | |
| ~~21-D~~ | ~~TeamFeed Rework~~ | ~~BUG-029 (GIF render) + UX-AUDIT-026 (compose UX full rethink)~~ | ✅ SHIPPED | |
| ~~23~~ | ~~UI Constitution Phase 1~~ | ~~UI-CONST-001 Foundations (color tokens, type scale, spacing)~~ | ✅ SHIPPED | |
| ~~23-A~~ | ~~Color Token Audit~~ | ~~Sprint 23-A: COLOR_AUDIT.md generated (716 lines, 10 sections)~~ | ✅ SHIPPED | First Cowork test run |
| ~~24~~ | ~~UX Quality Sprint~~ | ~~Dark theme token migration + Voice audit + Tooltip audit~~ | ✅ SHIPPED | |
| ~~25~~ | ~~UI Constitution Mega-Sprint~~ | ~~5-Pass: Responsiveness + Icons + Typography + Spacing + Components. UX-AUDIT-006 closed.~~ | ✅ SHIPPED | |
| ~~26~~ | ~~COVOS Signal Visual Identity~~ | ~~4-Pass sidebar/widget/component/page redesign. UI-CONST-001 Group 4 (Navigation) complete.~~ | ✅ SHIPPED | |
| ~~SEC~~ | ~~Security Fix — Permission Gaps~~ | ~~18 unprotected API handlers secured with withPermission. createdBy hardcode fixed.~~ | ✅ SHIPPED | |
| ~~27~~ | ~~Bug Triage + Dark Mode Polish~~ | ~~BUG-030/031/032 + FEAT-037 (single lead entry)~~ | ✅ SHIPPED | |
| ~~28~~ | ~~Tenant Productization Core~~ | ~~COVOS extraction: TenantConfig extension + email/template/AI/UI layer~~ | ✅ SHIPPED | |
| ~~29~~ | ~~Entity Migration Readiness~~ | ~~Tenant registry, contract templates, brochure hooks, Wave reconnect~~ | ✅ SHIPPED | |
| ~~ARCH~~ | ~~Project Fracture + COVOS Roadmap~~ | ~~ARCH-002 (repo/service/DB separation plan) + ARCH-003 (82-category module mapping)~~ | ✅ SHIPPED | |
| ~~30~~ | ~~Communication + Polish~~ | ~~UX-FEAT-002 (TeamFeed overhaul) + UX-AUDIT-027 (contrast) + FEAT-035 (vault preview)~~ | ✅ SHIPPED | Sprint Cowork |
| ~~31~~ | ~~UI-CONST-001 Group 5~~ | ~~Data Display — tables, metric tiles, charts~~ | ✅ SHIPPED | |
| ~~32~~ | ~~Signing + Tours~~ | ~~FEAT-036 (DocuSign) + FEAT-038 (expanded tour tips)~~ | ✅ SHIPPED | |
| ~~33~~ | ~~Customization + Guide~~ | ~~FEAT-034 (customization audit) + FEAT-039 (guide character Phase 1)~~ | ✅ SHIPPED | Sprint Cowork |
| ~~34~~ | ~~GHM → Tenant Extraction~~ | ~~Remove GHM default privilege, meta-DB tenant registry, env var audit, third-party stubs~~ | ✅ SHIPPED | Platform identity gate complete |
| ~~35~~ | ~~Tenant Visual Identity + Brand System~~ | ~~AI voice injection, TenantLogo, default layouts, brochure brand colors, demo/email extraction, LEGAL-001~~ | ✅ SHIPPED | Identity gate for second tenant |
| 34-OPS | Manual Infrastructure Inversion | INFRA-001–005 + T-001–009 per THIRD_PARTY_MIGRATION.md | David manual sprint | Follows Sprint 34 code work |
| ~~38~~ | ~~Affiliate Vertical Data Layer~~ | ~~6 new Prisma models, module toggle config, terminology config, full API routes~~ | ✅ SHIPPED 90fb3e4 | Vertical 2 foundation |
| ~~39~~ | ~~Affiliate Vertical UI~~ | ~~7 surfaces: site portfolio, revenue dashboard, acquisition pipeline, content calendar, portfolio intelligence~~ | ✅ SHIPPED 90fb3e4 | Vertical 2 UI complete |
| ~~40~~ | ~~Demo Tenant + Intelligence Layer~~ | ~~Ridgeline Media seed data, GSC/GA4 Site extension, CSV affiliate network import~~ | ✅ SHIPPED 90fb3e4 | Vertical 2 demo-ready |
| ~~36~~ | ~~Communication Layer + Platform Hygiene~~ | ~~Email templates, toast audit, empty states, route audit, psych UX audit, security fixes~~ | ✅ SHIPPED | Demo-ready gate |
| ~~37~~ | ~~Magic Moments + Platform Polish~~ | ~~PSYCH_UX_AUDIT.md implementation: AlertDialog migration (4), breadcrumb component, onboarding celebration, settings grouping, AI progress indicators~~ | ✅ SHIPPED | UX polish gate |
| ~~41~~ | ~~Affiliate Dashboard Polish~~ | ~~Vertical routing, affiliate /dashboard page, guide tips, onboarding tour, empty state copy, nav logo fallback~~ | ✅ SHIPPED | UI-CONST Groups 6–7 (affiliate) |
| 🔧 OPS | Manual Ops Tasks | INFRA-001 (Resend DNS) + I4 (GBP OAuth) + W7 (Kill Gusto) | ⏸ WAITING | David manual — no Claude work needed |

**Background (no code needed, external waits):**
- W7 Kill Gusto — run parallel Wave payroll cycle, then ops decision
- I4 GBP OAuth — monitor Google API Console approval

---

---

## 🔴 MUST — Active Blockers

### W7 — Kill Gusto
Wave AP/payroll fully built and validated. Gate: one successful full payroll cycle through Wave. Gavin is W-2 — do not migrate mid-year. Plan: Arian + future reps are 1099 via dashboard, close Gusto 2026, migrate W-2 to Wave Payroll Jan 2027.
**Action:** Ops decision, no code. ~30 min once gate is cleared.

### INFRA-001: Resend Sending Address — Configure & Verify Domain
All outbound emails (notifications, forgot password, work orders, partner emails, reports) send from `noreply@ghmmarketing.com` (set via `FROM_EMAIL` env var, defaults to that address). This domain **must be verified in the Resend dashboard** for emails to deliver reliably. Without domain verification, Resend falls back to its shared sending pool which is unreliable and may land in spam.
**Current state:** `FROM_EMAIL` env var controls the address; if unset it defaults to `noreply@ghmmarketing.com`. The `FROM_NAME` is hardcoded as `"GHM Marketing"` in `src/lib/email/index.ts`.
**Action required:** (1) Log into Resend dashboard → Domains → Add `ghmmarketing.com` → add the three DNS records (SPF, DKIM, DMARC) in your DNS registrar → verify. (2) Confirm `FROM_EMAIL=noreply@ghmmarketing.com` is set in `.env.production`. (3) Send a test notification to confirm delivery. No code changes needed unless you want to change the address.
**Future consideration:** When multi-tenant is live, each tenant may want their own sending domain. `FROM_EMAIL` should eventually be pulled from `TenantConfig` rather than a global env var. Track in FEAT-016 scope.
**Size:** ~30 min DNS + verification. **Priority:** 🔴 Must resolve — email delivery is broken until this is done.

### I4 — Google Business Profile OAuth (external wait)
GBP integration built. App in Testing mode. Gate: Google API Console approval for external app status.
**Action:** Monitor → flip to Published → verify OAuth with real client listing. ~1 hr once approved.

---

---

## 🔴 UX AUDITS — Must Fix Before External Eyes

### UX-AUDIT-003: Brochure — Visual Design Overhaul (Marketing-Grade)
The brochure represents a marketing company selling marketing services. It currently doesn't look like something a sharp agency would send a prospect.
**Direction:** Modern layout — strong typographic hierarchy, bold section breaks, purposeful whitespace, brand-consistent color. Not a template — an actual designed piece.
**Dependency:** FEAT-016 (tenant voice/style capture) should ship first so the brochure renders each tenant's brand rather than being GHM-generic.
**Size:** ~1 session structural redesign; additional pass once FEAT-016 is live. **Priority:** 🟠 SHOULD.

### UX-AUDIT-007: Admin Logo Swap (Productization)
Navbar and login screen logos are hardcoded. New tenants need to replace with their own logo.
**Scope:** `logoUrl` on `TenantConfig`. Upload flow in Settings (admin-only). Navbar + login screen pull from tenant config. Fallback to COVOS default logo.
**Size:** ~2 hrs. **Priority:** 🟠 SHOULD. **Also see:** FEAT-018 (same item, sequenced for Sprint 17).

### UX-AUDIT-008: Admin First-Run Experience (New Tenant Onboarding Flow — Full Scope)
Current wizard (Sprint 9) is the basic 4-step shell. Full scope: guided path through company profile, team setup, client import, integrations checklist, and "you're live" completion screen.
**Scope:** Steps: (1) Company profile; (2) Team setup (invite users, assign roles); (3) Client import (CSV or PM adapter); (4) Integrations checklist (Wave, GBP, Google Ads — status indicators); (5) Completion screen with suggested next actions. Each step skippable, progress persists. Wizard state per-tenant-per-user. Completion unlocks achievement indicators.
**Size:** ~2 sessions. **Priority:** 🟠 SHOULD. **Also see:** FEAT-015 (same item).

### ~~UX-AUDIT-009: Psychological / Human Nature UX Audit~~ ✅ SHIPPED Sprint 36 (audit phase)
docs/PSYCH_UX_AUDIT.md written (141 lines, 8 sections). Implementation of recommended interventions remains in backlog.

### UX-AUDIT-012: Branding System — Expanded Color Options + Reset/Delete
Current branding tab has a single brand color field. Need three roles: Primary (CTAs), Secondary (supporting UI), Accent (highlights/badges).
**Scope:** Extend `GlobalSettings` with `brandColorPrimary`, `brandColorSecondary`, `brandColorAccent` (nullable). `BrandingTab` UI with three pickers, role descriptions, "not set — using default" indicator, "Reset to defaults" button. CSS custom property injection at root level.
**Size:** ~2 hrs. **Priority:** 🟠 SHOULD. **Depends on:** BUG-010 Blob provisioning first.

### UX-AUDIT-015: Content Studio Empty States
Content Studio shows generic "no content." Needs context-aware states: (a) no clients have Content Studio active, (b) active but no briefs yet — prompt to generate first.
**Size:** ~30 min. **Priority:** 🟡 WOULD.

---

## 🟠 SHOULD — Features & Productization

### FEAT-015: Admin First-Run Wizard (Full Scope)
See UX-AUDIT-008. Same item — cross-referenced for sprint sequencing. **Sprint target:** 17.

### FEAT-016: Tenant Voice + Visual Style Capture
The system needs to know who each tenant is before brochures, audit reports, and comp sheets can represent them well.
**Scope:** Voice profile schema on TenantConfig (tone, keywords, anti-keywords, sample approved copy). Visual style schema (primaryColor, accentColor, fontFamily, logoUrl). Settings UI for admin to configure. Template renderer reads tenant style when generating all marketing deliverables. Fallback to COVOS defaults.
**Size:** ~1 session. **Priority:** 🟠 SHOULD — required before UX-AUDIT-003 brochure redesign is meaningful.

### FEAT-017: Brochure + Marketing Collateral Design Overhaul
See UX-AUDIT-003. Depends on FEAT-016 (style capture). Redesign brochure as tenant-branded output. Extend to audit reports and comp sheet.
**Sprint target:** After FEAT-016. ~1 session.

### FEAT-018: Admin Logo Swap
See UX-AUDIT-007. `logoUrl` on TenantConfig, upload UI in Settings, navbar + login pull from tenant config.
**Sprint target:** 17. ~2 hrs.

### FEAT-021: Tenant Logo + Brand Asset Management
Marketing materials currently use generic GHM placeholders. Each tenant needs their own brand applied.
**Scope:** `logoUrl` on TenantConfig. Admin-only upload UI in Settings → Branding. Toggle per material type (brochure, audit PDF, comp sheet, proposal, portal). Materials pull `logoUrl` + toggle state before generating. Fallback to text-only if no logo.
**Relationship:** Depends on FEAT-016 (full style capture); this is a shippable subset.
**Size:** ~1 session. **Priority:** 🟠 SHOULD. Pairs with FEAT-018.

---

## 🟡 WOULD — High Value, No Current Blocker

### ~~UX-AUDIT-009: Psychological / Human Nature UX Audit~~ ✅ SHIPPED Sprint 36
See above — audit complete. Implementation sprint remains backlog.

### UX-AUDIT-011: Tasks/Recurring Tasks Nav Placement
Should Tasks live under "Clients" in the left nav rather than as a standalone top-level section? Most task work is client-contextual.
**Direction:** Evaluate (A) keep top-level for cross-client queue management vs. (B) move under Clients with master queue accessible elsewhere. Audit actual usage pattern before committing.
**Size:** ~2 hrs (decision + nav restructure). **Priority:** 🟡 WOULD — low disruption if changed early, high disruption later. Decide before Sprint 20.





### UX-FEAT-003: Dashboard Widget Default Layout per Role
Dashboard widgets currently initialize in an undefined/random order on first login. Each role should get a thoughtful default layout reflecting what they'll use most:
- **Admin/Manager:** Revenue metrics top-left, Client Health top-right, Team Activity mid-left, Goals mid-right, Quick Actions bottom.
- **Sales Rep:** My Pipeline top-left, My Book top-right, Needs Attention mid-left, Sales Tools mid-right, Earnings bottom.
Layout stored on first render if no saved layout exists. Users can still customize and their arrangement persists. Only affects the very first session.
**Size:** ~1 hr. **Priority:** 🟠 SHOULD — first impression matters, especially for new reps.







### ~~FEAT-011: Full Button / Route / Path / Dependency & Logic Audit~~ ✅ SHIPPED Sprint 36
Delivered as Track B + Track D. scripts/route-audit.js scanned 239 routes. docs/ROUTE_AUDIT.md written. 3 unguarded routes fixed. Button chain audit complete.

### FEAT-021 subset: Pipeline Filter — Lead Source Filter
`leadSourceId` field (organic/referral/discovery/import) exists in DB, not surfaced in filter bar. Covered by FEAT-025 full scope — can be pulled forward as a standalone quick win if needed.
**Size:** ~1 hr standalone.

---

## 📋 LEGAL / CONTRACTUAL — No Code

### LEGAL-001: Partner Agreement — Restrict Dashboard Use to GHM Business Only
The partner agreement currently does not explicitly prohibit reps from using the GHM dashboard for non-GHM clients or personal purposes. This needs to be locked down.
**Required language (to be drafted):** The dashboard is licensed for use solely in connection with the partner's sales and client management activities conducted on behalf of GHM. Use of the dashboard — including access to client data, marketing tools, pipeline intelligence, or any platform features — for the partner's own clients, third-party clients, or any purpose unrelated to GHM business is strictly prohibited and constitutes a material breach of this agreement.
**Action:** Update `SERVICE_AGREEMENT.md` (or equivalent contract template) with the above restriction. Have legal review if/when this goes to real external partners. No code changes required unless the agreement is auto-generated from a template in the platform.
**Size:** ~30 min (draft language). **Priority:** 🔴 Must resolve before any external partner onboarding.

---

## ⚪ FUTURE — Vision & Scale

### UI-CONST-001: UI/UX Constitution + Professional Design System Saga
The platform needs to be indistinguishable in quality from Xero, Slack, Monday, Linear, or Notion. Right now it uses stock icons, emoji, off-shelf components with default styling, and inconsistent visual language. This initiative establishes the aesthetic truth of the platform and delivers it systematically across every surface.

**What this is:** Not a single sprint. A structured multi-session initiative with three phases per group: (1) Research & Audit — identify what exists and what's wrong, (2) Blueprint — design decisions documented in a UI Constitution, (3) Build — implement from blueprint in grouped batches.

**Scope — every surface:**
- Icons: custom icon set or curated premium set, zero emoji in UI, zero Lucide defaults without intentional selection
- Favicon + app icons: professional multi-resolution favicon, PWA manifest icons, OG images
- Typography: type scale, weight system, line-height, letter-spacing — codified and enforced
- Color system: semantic token layer over raw colors — `color.surface.primary`, `color.interactive.default`, etc. not raw hex scattered through components
- Spacing + layout: 4pt grid enforcement, consistent component padding, page margin standards
- Component library: every button state, every input state, every card, every badge, every modal — designed with intention, not defaulted
- Motion: micro-interactions, loading states, transitions — purposeful not decorative
- Email templates: HTML emails should look as good as Mailchimp's own emails. Currently inline-styled and basic.
- Notification design: in-app notification center visual quality, toast/alert design, empty states
- Tutorial system: illustrated walkthroughs, not just tooltip text
- Every page header, every panel, every sidebar, every empty state

**Structure:**
- Audit sessions cover one group at a time (e.g., "Icon System Audit", "Color Token Audit", "Email Template Audit")
- Each audit produces a Blueprint section of the UI Constitution (`docs/UI_CONSTITUTION.md`)
- Build sessions implement one Blueprint group at a time
- No building without a Blueprint. No Blueprint without an Audit.

**First deliverable before any building:** `docs/UI_CONSTITUTION.md` — our aesthetic truths. What does this platform feel like? Who does it serve? What does every design decision communicate about quality? Answers codified as enforceable standards.

**Questions the Constitution answers:**
- What are our aesthetic truths? (restraint, density, trust-signaling, professional precision)
- What is the emotional register of this platform? (confident, not flashy; clear, not cold)
- What are the rules for every component? (button variants, icon usage, color semantics, motion policy)
- What is explicitly forbidden? (emoji in UI, decorative animation, inconsistent spacing)

**Groups (audit + blueprint + build in sequence):**
1. Foundations — ✅ 1a: Color tokens (Sprint 23-D/E) · ✅ 1b: Typography (Sprint 25 Pass 3) · ✅ 1c: Spacing/Elevation (Sprint 25 Pass 4) · ✅ Responsiveness (Sprint 25 Pass 1)
2. Icon System — ✅ COMPLETE (Sprint 25 Pass 2) — sizes normalized, aria-hidden added, semantic replacements applied
3. Component Core — ✅ COMPLETE (Sprint 25 Pass 5) — Card anatomy, Badge→StatusBadge, Dialog widths, TableHead, empty states
4. ✅ Navigation — COMPLETE (Sprint 26) — sidebar Signal identity (navy bg, token hover/active states, COVOS attribution), nav token utility layer added to globals.css
5. ✅ Data Display — tables, cards, metric tiles, charts (Sprint 31 complete)
6. Communication — email templates, in-app notifications, toasts, alerts, empty states
7. Content — tutorial system, onboarding illustrations, marketing-facing pages
8. Identity — favicon, OG images, PWA assets, logo usage standards

**Size:** 8+ sessions (audit+blueprint) + 8+ sessions (build). Runs parallel to product sprints.
**Priority:** 🟣 Strategic — prerequisite for White-Label/COVOS, external demo quality, investor readiness.

### Accessibility (WCAG 2.1 AA)
Keyboard navigation first (highest ROI), then screen reader + focus indicators + high contrast. **Size:** ~1–2 weeks full audit + fix pass.

### Mobile-Optimized UX (Beyond Responsive)
Full-screen mobile kanban, touch-optimized lead cards with swipe actions, mobile-specific quick actions. **Size:** ~2–3 sessions.

### Native Mobile Apps (iOS + Android)
React Native + Expo. **Prerequisite:** Security hardening + API documentation complete.

### White-Label / Multi-Agency Productization (Full COVOS)
Self-serve agency onboarding, per-tenant branding, per-tenant billing, tenant admin panel, data isolation audit. Multi-tenant infra is live — this is the full productization layer.
**Prerequisite:** FEAT-016 style capture, FEAT-018 logo swap, Sprint 17 admin first-run, Sprint 18 telemetry.

### ARCH-NOTE-001: Bug Reports + Feature Requests — Enterprise Support Routing
**Architecture note (no code yet):** Bug reports and feature request submissions from tenant users must NOT route to the client-side admin (i.e., whoever is running the COVOS instance). These are platform-level communications and belong in an enterprise support channel owned by COVOS/David. Before building FEAT-028 (submitter feedback loop) or any multi-tenant support tooling, define a support email address and route all bug/feature submissions there instead of — or in addition to — surfacing them in the tenant's admin Settings. The tenant admin should see a filtered, curated view of what's relevant to their instance; platform-level reports go upstream to COVOS support.
**Action needed:** Pick support email (e.g., support@covos.app). Update FEAT-028 spec to reflect routing. Consider whether tenant admins get a read-only filtered view or nothing at all.


## 🟡 WOULD — Additional Features & Polish

### FEAT-029: Multi-Business Profile Switcher
**Request:** Users who operate multiple businesses (e.g., an SEO agency + an affiliate portfolio company) should be able to switch between their COVOS business profiles without signing out and back in. Each business is a separate tenant with its own vertical, branding, nav, and data.

**UX concept:** Profile switcher in the sidebar (near the tenant logo / user avatar area) — similar to Slack's workspace switcher or Notion's workspace selector. Clicking opens a dropdown or modal listing all tenants the authenticated user has access to, with one-click switching that re-scopes the session to the selected tenant.

**Architecture notes:**
- Requires a user↔tenant membership model (a user can belong to multiple tenants with a role per tenant)
- Currently users are scoped to a single tenant implicitly via their account. Need a `UserTenantMembership` join table: `userId`, `tenantId`, `role`, `isDefault`
- Session token would need to carry `activeTenantSlug` (switchable without full re-auth)
- Middleware reads `activeTenantSlug` from session cookie rather than (or in addition to) subdomain
- Switch action: updates `activeTenantSlug` in session, triggers full page reload to re-render correct vertical nav + widgets

**Prerequisites:** ARCH-006 tenant extraction complete, meta-DB tenant registry live (Sprint 34-OPS).
**Size:** ~1 sprint (data model + session plumbing + switcher UI).
**Priority:** 🟡 Would — high value for operators running multiple COVOS-powered businesses (exact use case: David running GHM + Proper Sluice).

---

## 📋 NOTES + BEST PRACTICES — March 4, 2026 Session

### DEV-STANDARD-001: Universal Test Credentials
**Decision (March 4, 2026):** Across all COVOS tenants and projects, the standard test account is `test@account.com` / `ChangeMe123!` (admin role). Script at `scripts/seed-test-user.ts` creates/resets this user via upsert. Re-run when any tenant DB is reset or provisioned. Never use personal accounts (`david@ghmmarketing.com`) for testing non-GHM contexts.
**Action:** Add `seed-test-user.ts` execution to `TENANT_PROVISIONING.md` as a required provisioning step.

---

### DEV-STANDARD-002: Local Tenant Dev Override
**Decision (March 4, 2026):** Middleware is subdomain-based and doesn't work on localhost. `TENANT_DEV_OVERRIDE` env var in `.env.local` bypasses this. Set to `ridgeline`, `ghm`, or `covosdemo` and restart dev server. Port allocation: GregLite owns 3000–3009, COVOS runs on port 3100 permanently (set in `package.json` dev script).
**Implementation:** `src/middleware.ts` — when override is set and host is localhost, injects tenant header from `getTenantFromHost(`${slug}.covos.app`)`.
**Action:** Document in `CLAUDE_INSTRUCTIONS.md` and `QUICK_REFERENCE.md`.

---

### FEAT-030: Satellite Website "Value Layer" Content Standard (SEO Vertical / Easter Agency)
**Context (March 4, 2026):** GAD satellite cluster sites (Audi, BMW, Mercedes, VW, Porsche, Land Rover, European Auto — Simi Valley) were reviewed and assessed as **not PBNs** due to substantive model-specific content depth. The content quality (fault codes, part names, cost ranges, service intervals, diagnostic detail) is the primary protection against PBN classification — not the structure.

**PBN risk factors to watch:**
- Consistent layout/headline pattern across all satellites — not disqualifying alone, but content must compensate
- One-directional links (all pointing to money site, no outbound citations) — mild PBN signal; fix by adding 2–4 outbound links per satellite to manufacturer TSBs, NHTSA, authoritative communities
- No GBP tied to satellite domains — recommended addition for geo-targeted satellites
- No local schema markup — should be added

**COVOS Satellite Content Standard (for productization):** Each satellite must meet before going live:
1. 500+ words of technically accurate, brand/topic-specific content per primary page (not templated copy)
2. At least one "value layer" — something a visitor would use even without clicking through to the money site (auto: cost estimator, warning light lookup; legal: fee calculator; medical: symptom guide)
3. Minimum 3 contextual outbound links to authoritative third-party sources per satellite
4. Local schema markup
5. GBP recommended for geo-targeted satellites

**Easter Agency differentiator pitch:** "We don't build link satellites — we build micro-resources that rank independently."
**Action:** Define content spec doc. Add quality gate to Website Studio cluster approval workflow (SCRVNR already exists in Sprint 4).
**Priority:** 🟠 Should.

---

### FEAT-031: Citation Finder for Satellite Content (Website Studio)
**Context:** Follows FEAT-030. Website Studio generates satellite content but doesn't enforce outbound citations. After content draft, run an AI "Citation Finder" pass: identify factual claims, suggest 3–5 authoritative outbound links per page, editor accepts/rejects, minimum count enforced in SCRVNR approval gate.
**Size:** ~1 sprint. **Priority:** 🟡 Would.

---

### ARCH-NOTE-002: Vertical Routing Pattern (Established Sprint 41)
**Decision:** Post-login routing stays role-based in `auth.config.ts` (edge-safe, no Prisma). Vertical routing happens inside server component dashboard pages. Pattern: `/manager` and `/sales` check `tenant.verticalType` at top — if `affiliate_portfolio`, redirect to `/dashboard`. New verticals follow same pattern: new route + redirect check in existing role pages. Auth config is never the right place for vertical logic.
**Action:** Document as ARCH-007 in `docs/ARCH.md`.

---

### ARCH-NOTE-003: Tenant Display Name Hierarchy (Established Sprint 41)
**Decision:** Page headers/subtitles use `tenant.companyName` from `TenantConfig` directly — NOT `GlobalSettings`. GlobalSettings may not be seeded for new tenants; TenantConfig is always populated at provisioning. Logo chain: `TenantLogo` component handles `GlobalSettings.logoUrl` → `tenant.name` text fallback. Never read `GlobalSettings` just for display name.
**Action:** Audit existing pages using `GlobalSettings.companyName` for display; migrate to `tenant.companyName`.

---

### OPS-NOTE-001: GCP OAuth Submission — Time-Gated
**Status:** INFRA-004 (GCP OAuth for GBP integration) requires 1–3 week Google review. Must be submitted before Vertical 1 go-live is possible. See THIRD_PARTY_MIGRATION.md.
**Action:** David manual — confirm submission status.


