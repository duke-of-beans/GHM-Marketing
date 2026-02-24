# GHM DASHBOARD — PRODUCT BACKLOG
**Last Updated:** February 24, 2026 — Added 10 items from David's audit: BUG-012–016 (5 bugs), FEAT-030–032 (3 features), UX-AUDIT-018–019 (2 UX items). Sprint table updated.

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
| 15 | Pipeline Intelligence | FEAT-025 (full Lead model filters) + FEAT-026 (filter UX defaults) + UX-FEAT-001 (filter bar presentation) | ~1 session | Surface the scoring engine properly. |
| 16 | Admin Polish | FEAT-027 (logo nav) + FEAT-028 (bug report feedback) + UX-AUDIT-015 (Content Studio empty states) | ~1 session | Small items, high finish quality. |
| 17 | Admin First-Run (Full) | FEAT-015 (onboarding wizard full scope) + FEAT-018 (logo swap) + UX-AUDIT-012 (3-color branding) | ~1 session | Enables real new-tenant activation. |
| 18 | Analytics + Telemetry | FEAT-019 (dashboard usage metrics) + FEAT-020 (COVOS owner telemetry) | ~1 session | Know what's working before scaling. |
| 19 | Content Automation | FEAT-022 (TeamFeed multimedia) + FEAT-023 (stock photo library) + FEAT-024 (client website audit) | ~2 sessions | Content quality and velocity. |
| 20 | COVOS Self-Service | FEAT-014 (PM Import) + multi-tenant self-serve | ~2 sessions | Full productization. |
| 21 | Settings & Tasks Polish | BUG-012 (territories crash) + BUG-013 (permission preset 400) + BUG-014 (recurring tasks crash) + BUG-015 (Wave unconfigured state) + BUG-016 (pipeline dark mode headings) + UX-AUDIT-018 (integrations health panel) + UX-AUDIT-019 (permissions inline) + FEAT-030 (service catalog grid) + FEAT-031 (contextual task suggestions) + FEAT-032 (file display name) | ~1–2 sessions | Fixes from David's Feb 24 audit — critical bugs first, then UX polish. |

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

### BUG-012: Territories Tab Crashes — `headers()` Called Outside Request Scope
Settings → Territories tab throws: `` `headers` was called outside a request scope ``. Next.js server API called in wrong context (likely a Server Component function invoked client-side or in middleware without a request). Page is unusable.
**Fix:** Identify where `headers()` is called in the territories settings flow. Move to a proper server action or API route. Ensure the component is structured correctly as a Server Component with an async data fetch, or convert to client-side fetch pattern.
**Size:** ~1 hr. **Priority:** 🔴 Must fix — page broken.

### BUG-013: Custom Permission Preset Assigns With "Invalid Request" Error
Settings → Permissions → assigning "Custom" preset from the dropdown on a user (reproduced with Test Account) fires a toast: "Invalid request." API likely rejects the `custom` preset value as not in the allowed enum/list.
**Fix:** Audit `POST /api/users/[id]/permissions` (or equivalent). Check how `preset` value is validated server-side. `custom` likely needs special handling — either skip preset validation when `custom` is selected, or send permissions object directly. Confirm the correct payload shape for custom presets.
**Size:** ~1 hr. **Priority:** 🔴 Must fix — permissions system broken for custom configs.

### BUG-014: Recurring Tasks "New Rule" Crashes — `$.map is not a function`
Tasks → Recurring Tasks → clicking "New Rule" briefly flashes the form UI then navigates to a new page and throws: `$.map is not a function`. Likely a jQuery or lodash `$` reference where a plain array was expected, or a non-array value being passed to `.map()` (e.g., an API response that returns `null` or an object instead of an array).
**Fix:** Find the recurring task form component and locate the `.map()` call failing. Add null/type guard before mapping. If `$` is a stale jQuery artifact, remove it. Check that the API route returns `[]` not `null` when no data exists.
**Size:** ~1–2 hrs. **Priority:** 🔴 Must fix — feature completely broken.

### BUG-015: Wave Settings Tab — No Unconfigured State
Settings → Wave tab renders Wave UI regardless of whether the tenant has connected a Wave account. If unconfigured, it should show a clear "Connect Wave" prompt — OAuth link or API key entry — not a blank or broken UI. Once connected, content should reflect the specific tenant's Wave org (not hardcoded GHM context).
**Fix:** Add `isConfigured` check at top of Wave tab. If not configured: show connection prompt with OAuth flow or API key field + link to Wave API docs. If configured: show current connection status, org name, and a Disconnect option. Tenant-aware: pull Wave credentials from tenant settings, not global env.
**Size:** ~1.5 hrs. **Priority:** 🔴 Must fix before external tenants — currently shows broken/confusing state.

### BUG-016: Sales Pipeline Kanban — Column Heading Colors Too Bright in Dark Mode
Kanban column headings in the Sales Pipeline are hardcoded to light-mode colors and don't adapt to dark mode. They appear too bright, washed out, or visually inconsistent in dark mode.
**Fix:** Audit heading color classes in the kanban board column header component. Replace any hardcoded `text-*` or `bg-*` color values with semantic dark mode-aware tokens (`text-foreground`, `text-muted-foreground`, `dark:text-*`). Do not do a full dark mode audit here — targeted fix for pipeline headings only.
**Size:** ~30 min. **Priority:** 🟠 SHOULD — visible on every sales rep session.

---

## 🔴 MUST — Active Blockers

### W7 — Kill Gusto
Wave AP/payroll fully built and validated. Gate: one successful full payroll cycle through Wave. Gavin is W-2 — do not migrate mid-year. Plan: Arian + future reps are 1099 via dashboard, close Gusto 2026, migrate W-2 to Wave Payroll Jan 2027.
**Action:** Ops decision, no code. ~30 min once gate is cleared.

### I4 — Google Business Profile OAuth (external wait)
GBP integration built. App in Testing mode. Gate: Google API Console approval for external app status.
**Action:** Monitor → flip to Published → verify OAuth with real client listing. ~1 hr once approved.


---

## 🔴 UX AUDITS — Must Fix Before External Eyes

### UX-AUDIT-004: Live Demo Navigation Bug — Dashboard State Lost on Return
**Status:** Partially fixed (Sprint 13 — RefreshOnFocus debounce). Dashboard layout flash on return navigation resolved. Original Bug 1 (Live Demo button routes to wrong page) confirmed not a bug — `/leads` is the correct destination since demo generation is a per-lead action. **Monitor** — if repro'd in the wild, revisit.

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

### UX-AUDIT-018: Integrations Health Panel — Actionable States
Settings → Integrations health panel currently shows status indicators but non-configured integrations have no path to configure them, and healthy ones have no way to refresh or disconnect.
**Scope:** For each integration card: (a) NOT CONFIGURED → show "Configure" CTA. For API-key integrations: inline key entry or link to settings field. For OAuth integrations: "Connect" button that launches OAuth flow. Include link to relevant docs. (b) HEALTHY/CONNECTED → show "Refresh" button (re-runs health check) and "Disconnect" button (clears credentials, resets to unconfigured state with confirmation). (c) ERROR → show error message + retry + reconfigure option. This makes integrations self-service — no hunting for where to enter credentials.
**Size:** ~1.5 hrs. **Priority:** 🟠 SHOULD — required for external tenant self-serve.

### UX-AUDIT-019: Permissions Tab — Inline Manager, No Separate Page
Settings → Permissions tab has a button that navigates to a separate `/permissions` page (PermissionManager). This double click-through is unnecessary friction. The full permission manager should be inline within the Settings tab — no separate route needed.
**Scope:** Evaluate whether the permissions manager component can be embedded directly in the Permissions settings tab rather than being linked as a separate page. If the component is large, use an accordion or expandable panel within the tab. Remove the standalone `/permissions` route (or keep as a redirect for any existing links). Goal: settings flow stays within settings.
**Size:** ~1 hr. **Priority:** 🟠 SHOULD.

---

## 🟠 SHOULD — Features & Productization

### UX-FEAT-001: Lead Gen Filter Bar — Presentation Overhaul
Default visible state undersells the intelligence system. A new user sees a basic search bar, not a sophisticated lead scoring engine.
**Direction:** Surface Tier, Impact Score, and Close Likelihood as primary visible controls. Intelligence strip above kanban showing active filter posture. Better visual language for expand/collapse.
**Constraint:** No data model or filter logic changes. Purely `lead-filter-bar-advanced.tsx` presentation.
**Size:** ~1 session.

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

### FEAT-025: Pipeline Filter — Full Lead Model Expansion
Current filter set is far narrower than what the data supports. The Lead model has rich scoring fields that aren't surfaced.
**Scope:** Audit the Lead model and expose relevant fields in the filter bar: `closeScore`, `impactScore`, `wealthScore` (range sliders or tiers), `priorityTier` (dropdown), `marketType` (dropdown), `pitchAngle` (dropdown), `suppressionSignal` (boolean / exclude toggle), `distanceFromMetro` (range), `domainRating` (range), `intelNeedsRefresh` (boolean), `dealValueTotal` / `mrr` / `arr` (range), `leadSourceId` (multi-select), `createdAt` (date range). Also review Outscraper qualification scoring fields that can be filtered on.
**Size:** ~1 session. **Priority:** 🟠 SHOULD.

### FEAT-026: Pipeline Filter — UX Defaults + Collapsibility Overhaul
Two specific UX issues with the current filter panel.
**Issue 1:** "Pipeline Status" section in More Filters is not collapsible, unlike the other two sections. All three sections should be collapsible and open by default — consistent behavior.
**Issue 2:** Default visible filter/sort options don't reflect what reps actually use. Most-used options should be always-visible above the More Filters button. Suggested top-level defaults: Status, Assigned Rep, Territory, Sort (newest / deal value / close score). Secondary options go into More Filters: Score range, Market type, Lead source, Deal value, Distance, Wealth score, etc.
**Size:** ~1 hr. **Priority:** 🟠 SHOULD.

### FEAT-028: Bug Report Status Feedback Loop
Bug and feature submissions currently go into a void from the submitter's perspective. Reports are visible to admin but submitters get no status updates.
**Scope:** When admin updates ticket status (new → acknowledged → in-progress → resolved → won't-fix), the submitter receives an in-app notification (and optionally push if enabled). Lightweight "My Submissions" view for non-admin users to check ticket status without seeing everyone else's. Existing `BugReportsTab` (admin) already has status management — this is the submitter-facing layer only.
**Size:** ~1 hr. **Priority:** 🟠 SHOULD.

### FEAT-030: Service Catalog — Grid View Toggle
Service catalog page currently only supports list view. Users want to browse visually as well.
**Scope:** Add a List/Grid toggle button to the service catalog page header (icon buttons, similar to leads kanban/list toggle). Grid view: card-based layout showing service name, category, price, and status at a glance. List view: existing table/list. Persist preference in localStorage or user settings. No data model changes required.
**Size:** ~1 hr. **Priority:** 🟠 SHOULD.

### FEAT-032: File Uploads — Display Name Override
When uploading files (Document Vault, content attachments, or any file upload surface), the uploader should be able to set a display name that shows more prominently than the raw filename. Raw filenames are often cryptic (`Q3_FINAL_v2_REAL_USE_THIS.pdf`). A human-readable display name improves scannability for everyone who sees the file afterward.
**Scope:** Add an optional "Display name" field to all file upload dialogs/flows. If set, display name renders as the primary label in file lists, cards, and previews; raw filename shown secondarily in smaller/muted text or on hover. Store `displayName` alongside file record in DB (nullable — falls back to filename if not set). Apply to: Document Vault uploads at minimum; audit other upload surfaces (content attachments, logo upload, CSV import) and apply where it makes sense contextually.
**Size:** ~1.5 hrs. **Priority:** 🟠 SHOULD.


When creating a new task, users should be prompted with suggestions relevant to what actually happens in the system for their role — not just a blank form.
**Scope:** "New Task" dialog gains a "Suggested tasks" section showing role-aware quick-add options. Examples for admin: "Create new user", "Review bug reports", "Approve content brief". For manager: "Review client health scores", "Approve commission". For sales: "Follow up lead", "Generate audit report". Suggestions are one-click to pre-fill task title + optionally link to the relevant page/action. Suggestions are curated static lists per role (not AI-generated initially — keep it fast). Also surfaces any recurring tasks the user has active as "based on your rules."
**Size:** ~1.5 hrs. **Priority:** 🟠 SHOULD. **Related:** FEAT-014 (PM import), UX-AUDIT-011 (tasks nav placement).


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

## ⚪ FUTURE — Vision & Scale

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
