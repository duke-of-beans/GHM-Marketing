# GHM DASHBOARD — PRODUCT BACKLOG
**Last Updated:** February 25, 2026 — Sprint 16+16.5 shipped. Added INFRA-001, UI-CONST-001.

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
| 18 | Analytics + Telemetry | FEAT-019 (dashboard usage metrics) + FEAT-020 (COVOS owner telemetry) | ~1 session | Know what's working before scaling. |
| 19 | Content Automation | FEAT-022 (TeamFeed multimedia) + FEAT-023 (stock photo library) + FEAT-024 (client website audit) | ~2 sessions | Content quality and velocity. |
| 20 | COVOS Self-Service | FEAT-014 (PM Import) + multi-tenant self-serve | ~2 sessions | Full productization. |
| ~~21~~ | ~~Settings & Tasks Polish~~ | ~~BUG-012–016 + UX-AUDIT-018/019 + FEAT-030–032~~ | ✅ SHIPPED | |
| ~~22~~ | ~~UX Polish + Settings IA~~ | ~~BUG-017/018/019 + UX-AUDIT-020/021~~ | ✅ SHIPPED | |

**Background (no code needed, external waits):**
- W7 Kill Gusto — run parallel Wave payroll cycle, then ops decision
- I4 GBP OAuth — monitor Google API Console approval


---

## 🐛 UX BUGS (Pre-existing, open)

### UX-BUG-003: Payments Page — Wave Widget Fails Without Graceful Degradation
Raw GraphQL error surfaced in UI. **Fix:** Catch Wave auth errors, show clean amber notice. **Size:** ~1 hr.

### UX-BUG-004: Left Nav — Auto-Scroll on Group Expand at Bottom of Panel
Expanded items render below viewport. **Fix:** `scrollIntoView({ behavior: 'smooth' })` on last item of expanded group. **Size:** ~1 hr.

### UX-BUG-005: "Team" Nav Group — Rename to Better Reflect Contents
Contains Service Catalog + Document Vault. "Team" is misleading. **Fix:** Rename to "Resources" or "Workspace." **Size:** ~15 min.

### ARCH-001: Orphaned File Audit
Old sprint/phase/session markdown files cluttering root and docs/. **Fix:** Audit, move historical-only files to `docs/archive/`. **Size:** ~1 hr.

---

## 🔴 BUGS — Active Crashes & Broken Features

### BUG-017: Login Screen — Dark Mode Bleed on Logout
Logging out while in dark mode leaves the login page rendering with a dark background and dark panel styling. Login should always display in forced light mode — it's a marketing/branding surface, not a UI preference surface, and dark mode on the login page looks broken/unintentional.
**Fix:** Add `className="light"` (or equivalent forced-light wrapper) to the login page root element, bypassing the global theme provider. The Tailwind `dark:` classes should not apply here regardless of system or user preference.
**Size:** ~30 min. **Priority:** 🔴 Must fix — visible to every user on every logout.

### BUG-018: Search Bar Keyboard Shortcut — "CtrlK" Missing "+" Separator
The search bar trigger button displays `CtrlK` as a single string instead of `Ctrl+K`. The modifier key and the letter need a `+` separator to be legible and match platform conventions.
**Fix:** Find where the shortcut label is rendered in `AISearchBar.tsx` (or the `useModifierKey` hook output). Ensure the format is `Ctrl+K` / `⌘K` — the Mac variant already uses the symbol convention correctly; Windows just needs the `+` inserted.
**Size:** ~15 min. **Priority:** 🔴 Must fix — looks like a bug to every Windows user.

### BUG-019: TeamFeed Compose Box — Enter Icon Too Small
The `Ctrl[↵]` shortcut indicator in the TeamFeed compose box renders the enter/return icon at a very small size, making it hard to read and looking visually broken next to the `Ctrl` text.
**Fix:** Find the enter icon in `TeamFeed.tsx` / `TeamFeedSidebar.tsx` compose area shortcut hint. Increase the icon size (likely a Lucide `CornerDownLeft` or similar) to match the text cap-height — probably `h-3.5 w-3.5` or `h-4 w-4`. Ensure vertical alignment is `align-middle` or `items-center`.
**Size:** ~15 min. **Priority:** 🔴 Must fix — visible every time someone opens TeamFeed.

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

### UX-AUDIT-022: Settings — Team / Positions / Permissions IA Consolidation
These three Settings tabs are conceptually related (who's on the team, what roles they hold, what those roles can do) but currently exist as three separate flat tabs with no visual relationship to each other. The navigation between them is fragmented and the mental model isn't obvious to a new admin.
**Direction:** Evaluate two paths: (A) **Merge into a single "Team & Permissions" tab** with internal sub-navigation (tabs or anchored sections): Team roster → Positions → Permissions matrix. (B) **Keep as separate tabs but group them visually** in the settings nav under a "People" or "Team" heading with clear hierarchy. Option A is preferred if the combined content fits without feeling cramped. Either way: eliminate any duplicate controls currently spread across tabs, ensure the permissions matrix is reachable from a user's row in the team roster (one click), and make "positions" feel like the bridge between the two (a position defines a role; a role has permissions; a user has a position).
**Output:** Concrete IA proposal documented first, then implementation. No data model changes expected.
**Size:** ~1.5 hrs (audit + design) + ~1.5 hrs (implementation). **Priority:** 🟠 SHOULD — confusing for any new admin setting up the team.

### UX-AUDIT-010: Dashboard Role-Switch Layout Flash
Navigating away from `/sales` and returning shows a different dashboard layout on return. Likely two different dashboard components mounting depending on navigation state or session hydration order.
**Direction:** Audit which dashboard component mounts on `/` or `/sales` depending on role and navigation history. Confirm component is stable on return.
**Size:** ~1–2 hrs. **Priority:** 🔴 Fix before external users — inconsistent first impression is a trust issue.

---

## 🟠 SHOULD — UX Audits & Systemic Fixes

### UX-AUDIT-001: Tooltip / Help Text / Hover State Audit (Global)
The dashboard has no consistent tooltip or contextual help layer. Users — especially new admins — encounter unlabeled icons, ambiguous controls, and metric labels with no explanation.
**Scope:** Full global pass. Every icon button, metric card, non-obvious control gets a tooltip or `title` attribute. Focus areas: nav icons, action buttons without labels, score/metric displays (health score, churn risk, impact score, close likelihood), filter controls, audit sections, commission fields. Build shared `<Tooltip>` component if one doesn't exist. Also audit all static help text (empty states, onboarding prompts, section intros) for accuracy and consistency.
**Voice rule:** Tooltip voice = reserved, informational, brief. "Health score reflects GBP engagement, citation accuracy, and ranking position over the last 30 days." Not "Check out your health score!"
**Size:** ~1 session. **Priority:** 🟠 SHOULD.

### UX-AUDIT-002: Voice Audit — Dashboard UI Copy (Global, SCRVNR Pass)
Dashboard UI contains consumer-facing language that doesn't match the voice of a professional marketing platform. "Upsells available" should be "Additional products available."
**Scope:** All UI copy — page titles, section headers, button labels, column headers, badge labels, empty states, filter labels, card labels, dialog titles, form labels, placeholder text, nav labels, status indicators. Also: demos and promotional materials (brochures, audit reports, comp sheets, territory map page). Excludes: notifications/alerts, tutorials/guides, contracts.
**Method:** SCRVNR pass. Voice target = reserved, professional, B2B.
**Size:** ~1 session. **Priority:** 🟠 SHOULD.

### UX-AUDIT-003: Brochure — Visual Design Overhaul (Marketing-Grade)
The brochure represents a marketing company selling marketing services. It currently doesn't look like something a sharp agency would send a prospect.
**Direction:** Modern layout — strong typographic hierarchy, bold section breaks, purposeful whitespace, brand-consistent color. Not a template — an actual designed piece.
**Dependency:** FEAT-016 (tenant voice/style capture) should ship first so the brochure renders each tenant's brand rather than being GHM-generic.
**Size:** ~1 session structural redesign; additional pass once FEAT-016 is live. **Priority:** 🟠 SHOULD.

### UX-AUDIT-005: Dark Theme Audit (Global)
Dark mode exists but hasn't been comprehensively audited. Likely issues: hardcoded light colors, insufficient contrast, invisible borders, shadows that don't adapt.
**Scope:** Full global pass in dark mode. Every page and major component. Fix all inconsistencies. Codify dark mode colors in shared token/variable system if not already done.
**Size:** ~1 session. **Priority:** 🟠 SHOULD.

### UX-AUDIT-006: Responsiveness Audit (Global — Split Screen + Mobile)
No formal responsiveness audit has been run.
**Scope:** Test at 1920px, 1440px, 1280px, 1024px (split screen), 768px (tablet), 375px (mobile). Fix critical breakage at 1024px and 768px. Document 375px issues as future mobile sprint items.
**Size:** ~1 session. **Priority:** 🟠 SHOULD.

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

### UX-AUDIT-014: Pipeline Enrich Button — Intent-Aware Enrichment
"Enrich (50)" button enriches leads indiscriminately, wasting API credits on cold/unqualified leads.
**Scope:** Remove flat header button. Replace with: (1) per-lead "Enrich" in lead detail sheet; (2) "Enrich selected" in Bulk Actions dropdown. Add warning when bulk enriching "available" status leads. Existing `handleBatchEnrich` logic unchanged.
**Size:** ~1.5 hrs. **Priority:** 🟠 SHOULD.

### UX-AUDIT-015: Content Studio Empty States
Content Studio shows generic "no content." Needs context-aware states: (a) no clients have Content Studio active, (b) active but no briefs yet — prompt to generate first.
**Size:** ~30 min. **Priority:** 🟡 WOULD.

---

## 🟠 SHOULD — Features & Productization

### FEAT-014: Project Management Platform Import
Onboarding adapters for Basecamp (existing crawler), Asana, Monday.com, ClickUp, Trello. Generic `TaskImportAdapter` interface + import wizard in Settings. Preview/mapping step before commit. Admin-only.
**Strategic note (Feb 24):** This is a customer acquisition lever — absorbing PM platform users entirely by migrating their existing tasks. Prioritize the most popular platforms first (Asana, ClickUp). The import wizard should feel effortless: connect → preview → confirm → done.
**Size:** ~1 session per adapter; ~1 session for wizard UI. **Priority:** 🟠 Sprint 20 target.

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

### FEAT-019: Dashboard Usage Analytics (Admin-Facing)
Admin needs to know what's working in the platform itself — not business analytics, but platform analytics.
**Scope:** Per-user, per-session event tracking: page views, feature interactions, integration events, session duration and frequency. Admin-only analytics page: usage heatmap by feature, active users over time, most/least used pages, "dead zones." Events in `DashboardEvent` table, no PII beyond userId.
**Size:** ~1 session. **Priority:** 🟠 SHOULD — Sprint 18 target.

### FEAT-020: COVOS Owner Telemetry (Anonymous Backdoor)
Aggregate visibility into platform health and adoption across all tenants — anonymized.
**Scope:** Anonymous event pipeline from each tenant → COVOS central analytics endpoint. Events: feature usage (event type + tenant hash only), integration events, session frequency by tenant. COVOS owner dashboard showing fleet health. Tenant hash only — never business name, client data, or user identity.
**Privacy note:** Tenants should be informed this telemetry exists (add to SERVICE_AGREEMENT).
**Size:** ~1 session. **Priority:** 🟠 SHOULD — Sprint 18 target.

### FEAT-021: Tenant Logo + Brand Asset Management
Marketing materials currently use generic GHM placeholders. Each tenant needs their own brand applied.
**Scope:** `logoUrl` on TenantConfig. Admin-only upload UI in Settings → Branding. Toggle per material type (brochure, audit PDF, comp sheet, proposal, portal). Materials pull `logoUrl` + toggle state before generating. Fallback to text-only if no logo.
**Relationship:** Depends on FEAT-016 (full style capture); this is a shippable subset.
**Size:** ~1 session. **Priority:** 🟠 SHOULD. Pairs with FEAT-018.

### FEAT-022: TeamFeed — Multimedia, GIF, and Emoji Support (Slack-Grade)
TeamFeed is currently text-only. For team communication to actually get used, it needs to feel like Slack.
**Scope:** Emoji picker (emoji-mart) inline in compose box. Emoji reactions per message (store per-message-per-user, aggregate + display below messages). GIF search via Giphy or Tenor API — renders inline in thread. Image/file attachment via drag-drop or click-to-upload (Vercel Blob, depends on BUG-010). Paste-from-clipboard image support. Server limits: images max 8 MB, PNG/JPG/GIF/WebP.
**UX bar:** Everything should feel native and instant. The bar is Slack. If it feels worse than Slack, it's not done.
**Dependencies:** BUG-010 Blob provisioning (for image upload). Giphy/Tenor API key (free tier sufficient).
**Size:** ~2 sessions (emoji + reactions first; GIF + attachment second). **Priority:** 🟠 SHOULD.

### FEAT-023: Stock Photo Library Integration (API-Based Media Automation)
Content production requires images. Currently no way to source or attach images from within the platform.
**Scope:** Integrate Unsplash, Pexels, and/or Pixabay (all free, permissive licenses). Search interface accessible from Content Studio and any rich text field — keyword search returns photo grid with photographer credit, one-click insert. Automation layer: when AI generates content, system auto-suggests relevant stock image based on topic (keyword extraction → API query → attach top result). Attribution metadata stored with image reference (required for Unsplash compliance).
**Size:** ~1 session (search UI + Unsplash/Pexels); ~1 session (automation layer). **Priority:** 🟠 SHOULD.

### FEAT-024: Client Website Audit — Review & Optimization Analysis
Fast, structured way to audit a client's current site for technical, SEO, UX, and performance issues.
**Scope:** "Audit Website" button on Client detail page (and optionally Lead detail sheet for prospect sites). Pre-populated with `websiteUrl`, editable. Analysis: Page speed / Core Web Vitals (PageSpeed Insights API), meta title/description, heading structure, mobile signal, SSL check, schema markup, broken links (surface-level), image alt tags, canonical tags, sitemap/robots.txt. Output: score per dimension, prioritized issue list (Critical / Recommended / Optional), plain-English summary. Export as branded PDF. Store per-client with timestamp for before/after tracking.
**API dependency:** Google PageSpeed Insights API (free, requires API key in env).
**Size:** ~2 sessions. **Priority:** 🟠 SHOULD.

### FEAT-028: Bug Report Status Feedback Loop
Bug and feature submissions currently go into a void from the submitter's perspective. Reports are visible to admin but submitters get no status updates.
**Scope:** When admin updates ticket status (new → acknowledged → in-progress → resolved → won't-fix), the submitter receives an in-app notification (and optionally push if enabled). Lightweight "My Submissions" view for non-admin users to check ticket status without seeing everyone else's. Existing `BugReportsTab` (admin) already has status management — this is the submitter-facing layer only.
**Size:** ~1 hr. **Priority:** 🟠 SHOULD.

---

## 🟡 WOULD — High Value, No Current Blocker

### UX-AUDIT-009: Psychological / Human Nature UX Audit
See full scope above (in SHOULD section — moved here pending pitch/demo timeline decision).

### UX-AUDIT-011: Tasks/Recurring Tasks Nav Placement
Should Tasks live under "Clients" in the left nav rather than as a standalone top-level section? Most task work is client-contextual.
**Direction:** Evaluate (A) keep top-level for cross-client queue management vs. (B) move under Clients with master queue accessible elsewhere. Audit actual usage pattern before committing.
**Size:** ~2 hrs (decision + nav restructure). **Priority:** 🟡 WOULD — low disruption if changed early, high disruption later. Decide before Sprint 20.

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
1. Foundations — color tokens, type scale, spacing grid, elevation/shadow
2. Icon System — select or commission set, swap all stock/emoji
3. Component Core — buttons, inputs, selects, badges, tags, modals
4. Navigation — sidebar, topbar, breadcrumbs, tabs
5. Data Display — tables, cards, metric tiles, charts
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
