# GHM DASHBOARD — PRODUCT BACKLOG
**Last Updated:** March 1, 2026 — Sprints 27/29/ARCH/31/32 complete. Docs sync via final gate instance.

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
| 30 | Communication + Polish | UX-FEAT-002 (TeamFeed overhaul) + UX-AUDIT-027 (contrast) + FEAT-035 (vault preview) | ~1.5 sessions | Alive + accessible |
| ~~31~~ | ~~UI-CONST-001 Group 5~~ | ~~Data Display — tables, metric tiles, charts~~ | ✅ SHIPPED | |
| ~~32~~ | ~~Signing + Tours~~ | ~~FEAT-036 (DocuSign) + FEAT-038 (expanded tour tips)~~ | ✅ SHIPPED | |
| 33 | Customization + Guide | FEAT-034 (customization audit) + FEAT-039 (guide character Phase 1) | ~2 sessions | Retention + personality |
| 34+ | COVOS Phase 1 Modules | Per ARCH-003 roadmap — email marketing, booking, proposals, etc. | Multi-session | Vertical ERP expansion |
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

### UX-AUDIT-009: Psychological / Human Nature UX Audit
Magic moments per archetype are currently accidental. They need to be designed.
**Archetypes:** Admin ("platform came alive"), Sales Rep ("automation did my job"), Manager ("AI just worked").
**Audit direction:** Walk each user flow. Identify 3 most emotionally resonant moments per archetype. Design micro-interactions, state transitions, copy that amplify those moments. Remove friction from the path to each magic moment.
**Output:** `docs/PSYCH_UX_AUDIT.md` with findings + interventions spec, then implementation sprint.
**Size:** ~1 session audit + spec; ~1 session implementation. **Priority:** 🟡 WOULD.

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

### UX-AUDIT-009: Psychological / Human Nature UX Audit
See full scope above (in SHOULD section — moved here pending pitch/demo timeline decision).

### UX-AUDIT-011: Tasks/Recurring Tasks Nav Placement
Should Tasks live under "Clients" in the left nav rather than as a standalone top-level section? Most task work is client-contextual.
**Direction:** Evaluate (A) keep top-level for cross-client queue management vs. (B) move under Clients with master queue accessible elsewhere. Audit actual usage pattern before committing.
**Size:** ~2 hrs (decision + nav restructure). **Priority:** 🟡 WOULD — low disruption if changed early, high disruption later. Decide before Sprint 20.

### UX-FEAT-002: TeamFeed Major Overhaul — Slack-Grade Panel
TeamFeed needs to evolve from a sidebar chat panel into a proper communication hub. Three major upgrades:
1. **Resizable panel** — drag handle on left edge, width persisted to localStorage, min/max constraints.
2. **Two-pane layout** — people/channels list on left, message thread on right (Slack model). Online/offline status indicators (green dot = active in last 5 min via `DashboardEvent` heartbeat or session recency). User avatars or initials with presence dots.
3. **Polish** — subtle accent color on the TeamFeed toggle icon in the nav (e.g., indigo dot or badge when unread). Typing indicators, "X is typing..." at bottom of message pane.
**Size:** ~1.5 sessions (resize + layout restructure + presence system). **Priority:** 🟠 SHOULD — high-impact UX, makes the platform feel alive.

### UX-AUDIT-027: Accessibility Contrast Pass — Signal Palette Review
The Signal palette looks great but some token combinations may not meet WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text). Particularly concerned about: muted text on dark backgrounds, status badge text on colored backgrounds, secondary text in metric cards, sidebar nav items in non-active state. Run a systematic contrast audit of all foreground/background token pairs in both light and dark mode. Adjust any failing pairs while preserving the Signal aesthetic — typically means bumping foreground lightness up 10-15% rather than changing hues.
**Size:** ~1 hr audit + ~1 hr fixes. **Priority:** 🟠 SHOULD — accessibility + readability, especially for older users or bright environments.

### UX-FEAT-003: Dashboard Widget Default Layout per Role
Dashboard widgets currently initialize in an undefined/random order on first login. Each role should get a thoughtful default layout reflecting what they'll use most:
- **Admin/Manager:** Revenue metrics top-left, Client Health top-right, Team Activity mid-left, Goals mid-right, Quick Actions bottom.
- **Sales Rep:** My Pipeline top-left, My Book top-right, Needs Attention mid-left, Sales Tools mid-right, Earnings bottom.
Layout stored on first render if no saved layout exists. Users can still customize and their arrangement persists. Only affects the very first session.
**Size:** ~1 hr. **Priority:** 🟠 SHOULD — first impression matters, especially for new reps.

### UX-AUDIT-028: Customization Audit — Global User Personalization Surface
Every user interaction with the platform should feel like *their* platform. This is a comprehensive audit of every surface that could be customizable but isn't yet. Not just widget layout — everything: which columns appear in tables, which metrics show on dashboard cards, sidebar group order, default filters on each page, notification preferences per event type, theme beyond light/dark (accent color per user?), default landing page per role, compact vs. comfortable density toggle, which quick actions appear and in what order, pipeline column visibility/ordering, report section toggles, email digest frequency. The audit produces a ranked list of customization opportunities with effort estimates and a phased implementation plan. The philosophy: reasonable defaults that work for 90% of users, with progressive disclosure of customization for power users who want control.
**Output:** `docs/CUSTOMIZATION_AUDIT.md` — every customizable surface, current state, proposed UX, effort.
**Size:** ~1 session audit, multi-session implementation. **Priority:** 🟡 WOULD — high-value for retention and stickiness, not blocking entity launch.

### UX-FEAT-004: Document Vault — Preview Before Download
Currently clicking a vault file triggers an immediate download. Best practice: preview first, download second. Images render inline in a lightbox/dialog. PDFs render in an iframe viewer. Documents (.docx, .xlsx) show a preview card with metadata (size, type, upload date, uploader) and prominent Download button. Unknown types show metadata + download only. The preview dialog should also surface version info if the file is from Shared space.
**Size:** ~2 hrs. **Priority:** 🟠 SHOULD — UX quality, prevents accidental downloads, builds trust.

### UX-FEAT-006: COVOS Guide Character — Reactive AI Assistant Persona
A persistent but non-intrusive guide character that speaks in the platform's sardonic, deadpan, 4th-wall-breaking voice. NOT Clippy — doesn't pop up on a timer or frequency. Reactive: appears when it detects user idle on a page for >30 seconds, when a user visits the same page 3x without taking action, when a workflow stalls (e.g., lead sitting in "New" for 5+ days). Proactive only when patterns suggest confusion (rapid page switching, incomplete form abandonment, repeated filter resets). The character has David's sketches as design reference. Voice matches the sardonic micro-copy already in empty states. Could evolve into an AI-powered contextual assistant that actually understands what the user is trying to do.
**Phase 1:** Static character with pre-written contextual tips (reactive triggers only).
**Phase 2:** AI-powered contextual awareness (reads page state, suggests next action).
**Size:** Phase 1 ~1 session, Phase 2 ~2 sessions. **Priority:** 🟡 WOULD — differentiator, personality layer, but requires design assets (David's sketches).

### FEAT-011: Full Button / Route / Path / Dependency & Logic Audit
No formal audit of the complete button-to-route-to-handler chain. Stale routes, dead buttons, orphaned handlers accumulate silently.
**Scope:** Enumerate every `<Button>`, `<Link>`, `router.push()`, form `onSubmit`. Map to handler and route. Flag: dead routes, broken routes, duplicate logic, permission gaps, dependency tangles.
**Output:** `docs/ROUTE_AUDIT.md` findings table. Fix critical gaps immediately.
**Note:** Sprint 12 covered security-critical routes. This is the full functional audit.
**Size:** ~1 session audit + doc; ~1 session fix pass. **Priority:** 🟡 WOULD — before first external tenant.

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

### FEAT-034: Customization Audit — Global Personalization Framework
Every surface that could be personalized should be. Systematic audit of every configurable element across the entire platform.
**Scope (non-exhaustive):** Widget visibility (add/remove/show/hide, not just rearrange). Table column chooser per data table. Sidebar nav pin/unpin/reorder. Notification preferences per-channel per-event. Display density toggle (compact/comfortable/spacious). Default tab memory per page. Quick action visibility/order. Pipeline stage customization (tenant-level). Keyboard shortcut reference.
**Output:** `docs/CUSTOMIZATION_AUDIT.md` — every configurable surface mapped, current state, recommendation (user-level vs. tenant-level vs. not worth it).
**Size:** ~1 session audit + doc, multi-sprint implementation. **Priority:** 🟡 WOULD.

### FEAT-035: Document Vault — Preview Before Download
Click → preview modal instead of immediate download. PDF via iframe, images full-size with zoom, DOCX via server-side conversion, CSV/XLSX as table preview. Download as secondary action in modal footer.
**Size:** ~2 hrs. **Priority:** 🟠 SHOULD.

### FEAT-039: Reactive Guide Character — "The Voice"
Personality-driven contextual assistant. NOT Clippy — reactive only. Triggers: idle 60s+ on actionable page, same page 3x without completing primary action, empty states, first-visit pages. Character: deadpan sardonic, fourth-wall-breaking, matches brand voice. David has character sketches.
**Technical:** Global React component, receives page context + DashboardEvent signals. Small avatar bottom-right with speech bubble. Dismissable. Toggleable in Settings. Learns what user already knows.
**Size:** ~2 sessions (system + content for all pages). **Priority:** 🟡 WOULD — high differentiation, needs character design finalized.
