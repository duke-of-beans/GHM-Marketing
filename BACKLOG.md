# GHM DASHBOARD — PRODUCT BACKLOG
**Last Updated:** February 24, 2026 — Sprint 7 shipped. Added UX-AUDIT-001–009, FEAT-015–020. Cleaned stale stubs (Save Searches shipped, Brochure PPC shipped, Audit Paid Search partially shipped).
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
| 8 | Content Power | Bulk Content Ops + Competitor Tracking Manual + Custom Report Builder | ~1 session | Makes content and competitive intelligence practical at scale. |
| 9 | Polish & Audit Sprint | UX-AUDIT-001–009 + Dark Theme + Responsiveness + Voice | ~2 sessions | Productization-readiness. Everything must look and feel right before external eyes. |
| 10 | Admin First-Run Experience | FEAT-015 (Admin Onboarding Flow) + FEAT-018 (Logo Swap) | ~1 session | Enables real new-tenant activation without handholding. |
| 11 | COVOS Analytics | FEAT-019 (Dashboard Usage Metrics) + FEAT-020 (COVOS Owner Telemetry) | ~1 session | Closes the loop: know what's working before scaling. |
| 12 | COVOS Self-Service | FEAT-014 (PM Import) + Multi-tenant self-serve | ~2 sessions | Full productization. Requires Sprint 10 first. |

**Background (no code needed, external waits):**
- W7 Kill Gusto — run parallel Wave payroll cycle, then ops decision
- I4 GBP OAuth — monitor Google API Console approval

---

## 🐛 UX BUGS (Pre-existing, open)

### UX-BUG-001: Search Bar — Click-Outside Should Close
Escape only. Clicking anywhere outside should dismiss.
**Fix:** `useClickOutside` hook on search component. **Size:** ~30 min.

### UX-BUG-002: Search Bar — Expansion Behavior Wrong, Not Layout-Aware
Modal-style cmdk trigger renders a transparent gray square. Should be inline expanding input with dropdown results, layout-aware of Team Feed panel width.
**Fix:** Replace cmdk modal with inline input. CSS transition max-width. Results as positioned dropdown below input. **Size:** ~2–3 hrs. **Closes:** UX-BUG-007.

### UX-BUG-003: Payments Page — Wave Widget Fails Without Graceful Degradation
Raw GraphQL error surfaced in UI. **Fix:** Catch Wave auth errors, show clean amber notice. **Size:** ~1 hr.

### UX-BUG-004: Left Nav — Auto-Scroll on Group Expand at Bottom of Panel
Expanded items render below viewport. **Fix:** `scrollIntoView({ behavior: 'smooth' })` on last item of expanded group. **Size:** ~1 hr.

### UX-BUG-005: "Team" Nav Group — Rename to Better Reflect Contents
Contains Service Catalog + Document Vault. "Team" is misleading. **Fix:** Rename to "Resources" or "Workspace." **Size:** ~15 min.

### UX-BUG-007: Command Palette — Opens as Empty Transparent Square
Resolved by UX-BUG-002 fix. Do not patch in isolation.

### ARCH-001: Orphaned File Audit
Old sprint/phase/session markdown files cluttering root and docs/. **Fix:** Audit, move historical-only files to `docs/archive/`. **Size:** ~1 hr.

---

## 🔴 NEW: UX AUDITS & SYSTEMIC FIXES (February 24, 2026)

### UX-AUDIT-001: Tooltip / Help Text / Hover State Audit (Global)
The dashboard has no consistent tooltip or contextual help layer. Users — especially new admins — encounter unlabeled icons, ambiguous controls, and metric labels with no explanation of what they mean or why they matter.
**Scope:** Full global pass. Every icon button, every metric card, every non-obvious control gets a tooltip or `title` attribute. Focus areas: nav icons, action buttons without labels, score/metric displays (health score, churn risk, impact score, close likelihood), filter controls, audit sections, commission fields. Build a shared `<Tooltip>` component if one doesn't exist and standardize across the codebase. Also audit all static help/guide/how/why/what text (empty states, onboarding prompts, section intros) for accuracy and consistency.
**Voice rule:** Tooltip and help text voice = reserved, informational. Same voice family as notifications but dialed back — factual, brief, no flair. "Health score reflects GBP engagement, citation accuracy, and ranking position over the last 30 days." Not "Check out your health score!"
**Size:** ~1 session. **Priority:** 🟠 SHOULD.

### UX-AUDIT-002: Voice Audit — Dashboard UI Copy (Global, SCRVNR Pass)
The dashboard UI contains consumer-facing language that doesn't match the voice of a professional marketing platform. Example: "Upsells available" should be "Additional products available." The platform serves marketing agency operators and their reps — the copy should sound like a serious B2B tool, not a consumer app.
**Scope:** All UI copy in the dashboard, excluding: notifications/alerts (direct system communications), tutorials/guides, contracts, and documents. Included: page titles, section headers, button labels, column headers, badge labels, empty states, filter labels, card labels, dialog titles, form labels, placeholder text, nav labels, status indicators. Also included: demos and promotional materials (brochures, audit reports, comp sheets, territory map page).
**Method:** Run through SCRVNR. Voice target = reserved, professional, B2B. Remove colloquialisms, consumer-app language, unnecessary flair. Replace jargon visible to clients with plain business language.
**Size:** ~1 session (can be broken into dashboard copy + promotional materials as two passes). **Priority:** 🟠 SHOULD.

### UX-AUDIT-003: Brochure — Visual Design Overhaul (Marketing-Grade)
The brochure represents a marketing company selling marketing services. It currently does not look like something a sharp marketing agency would send a prospect. It needs to look and feel like marketing collateral made by people who know what they're doing.
**Direction:** Study what top-tier digital marketing agencies (Wpromote, Thrive, WebFX style) put in their client-facing collateral. Modern layout: strong typographic hierarchy, bold section breaks, purposeful whitespace, brand-consistent color application. Not a template — an actual designed piece. The current layout likely has too much text density and not enough visual breathing room.
**Dependency:** This requires first capturing the marketing company's voice profile and visual style (see FEAT-016 below) and making those the defaults for all marketing deliverables. The brochure itself should be the first thing rendered with those captured defaults. Do not redesign the brochure as GHM-generic — redesign it as a system that renders each tenant's brand.
**Size:** ~1 session for the structural redesign; additional pass once FEAT-016 voice/style capture is live. **Priority:** 🟠 SHOULD.

### UX-AUDIT-004: Live Demo Navigation Bug — Dashboard State Lost on Return
**Bug 1:** Clicking "Live Demo" from the dashboard routes directly to the Sales Pipeline page. The demo button should launch a guided demo experience, not just navigate to a random page. This is likely the wrong handler or a stale route.
**Bug 2:** When returning to the dashboard after the demo navigation, widgets render differently — sizes, layouts, and component states are inconsistent with the pre-navigation state. This suggests the dashboard is not properly restoring its layout state on remount, or the demo navigation is corrupting some shared state.
**Fix:** Audit the "Live Demo" button handler in the dashboard. Confirm what the intended demo experience is (separate demo route? Overlay? Guided walkthrough?). Fix the return-state issue by auditing dashboard layout persistence — likely a `useState` that resets on unmount, or a layout context that doesn't survive navigation.
**Size:** ~1–2 hrs. **Priority:** 🔴 MUST before any sales demo.

### UX-AUDIT-005: Dark Theme Audit (Global)
Dark mode exists but has not been comprehensively audited. There are likely inconsistencies: components using hardcoded light colors, text with insufficient contrast, borders invisible in dark, shadows that don't adapt, images/SVGs that look wrong.
**Scope:** Full global pass in dark mode. Check every page and major component: nav, dashboard widgets, client cards, leads pipeline, content studio, settings, payments, audit/demo output pages, brochure, onboarding pages, dialogs, toasts, tooltips, empty states. Fix all inconsistencies. Codify dark mode color usage in a shared token/variable system if not already done.
**Size:** ~1 session. **Priority:** 🟠 SHOULD.

### UX-AUDIT-006: Responsiveness Audit (Global — Split Screen + Mobile)
The dashboard has never had a formal responsiveness audit. With reps using laptops in split-screen and managers potentially on tablets, breakage is likely.
**Scope:** Test at common breakpoints: 1920px (wide), 1440px (standard laptop), 1280px, 1024px (split screen), 768px (tablet), 375px (mobile). Focus areas: nav collapse/overflow, dashboard widget grid reflow, leads kanban horizontal scroll, filter bars wrapping, modals/dialogs on small screens, tables overflowing, text truncation, touch targets. Fix all critical breakage at 1024px and 768px. Document 375px issues as future mobile sprint items.
**Size:** ~1 session. **Priority:** 🟠 SHOULD.

### UX-AUDIT-007: Admin Logo Swap (Productization)
When onboarding a new tenant, the admin needs to replace the GHM logo in the dashboard navbar and on the login screen with their own logo. Currently hardcoded.
**Scope:** Add `logoUrl` to `TenantConfig`. Upload flow in tenant Settings (admin-only). Persist to DB or object storage. Navbar + login screen pull from tenant config. Fallback to COVOS default logo.
**Size:** ~2 hrs. **Priority:** 🟠 SHOULD (productization gate).

### UX-AUDIT-008: Admin First-Run Experience (New Tenant Onboarding Flow)
The real first sign-in for an admin at a new tenant is the most labor-intensive session they'll ever have: set up company profile, migrate tasks, connect accounting, add users, add clients, configure integrations. Currently there is no guided path — they land on an empty dashboard with no direction.
**Scope:** Build a first-run wizard that activates on first admin login for a new tenant. Steps: (1) Company profile (name, logo, timezone, territory); (2) Team setup (invite users, assign roles); (3) Client import (CSV upload or PM platform adapter); (4) Integrations checklist (Wave, GBP, Google Ads — each with status indicator showing connected/pending); (5) "You're live" completion screen with suggested next actions.
**Each step should be skippable** but progress persists so they can return. Wizard state stored per-tenant-per-user. Completion unlocks the "I4 GBP + Wave connected" achievement-style indicators in the dashboard (see FEAT-019).
**Size:** ~2 sessions. **Priority:** 🟠 SHOULD (Sprint 10 target).
**Related:** FEAT-014 (PM Import), FEAT-018 (Logo Swap).

### UX-AUDIT-009: Psychological / Human Nature UX Audit
The dashboard has multiple user archetypes with different emotional triggers and "magic moments" — the instant where the product clicks and the user feels the value. These moments are currently accidental. They need to be designed.
**User archetypes and their magic moments:**
- **Admin/Owner:** "The platform came alive" = first API connected, first enrichment run, first integration firing. Progress indicators, connection status, first-data celebrations.
- **Sales Rep:** "The automation did my job" = seeing a prospect's enriched profile with score, seeing a demo generate in one click, seeing a brochure that looks professional enough to actually send.
- **Manager/Operator:** "The AI just worked" = content drafted automatically, backlinks running, PPC campaign created, website built without a dev.
**Audit direction:** Walk each user flow from first login. Identify the 3 most emotionally resonant moments per archetype. Design micro-interactions, state transitions, and copy that amplify those moments — not through gimmicks but through clarity, speed, and surprise-in-the-right-place. Remove friction from the path to each magic moment. This is not a feature audit — it's a flow audit with a psychological lens.
**Output:** A written spec (PSYCH_UX_AUDIT.md in docs/) with findings + proposed interventions, then implementation sprint.
**Size:** ~1 session for audit + spec; ~1 session to implement top interventions. **Priority:** 🟡 WOULD — high leverage before investor pitch or first external tenant.

---

## 🔴 MUST — Active Blockers

### W7 — Kill Gusto
Wave AP/payroll fully built and validated. Gate: one successful full payroll cycle through Wave. Gavin is W-2 — do not migrate mid-year. Plan: Arian + future reps are 1099 via dashboard, close Gusto 2026, migrate W-2 to Wave Payroll Jan 2027.
**Action:** Ops decision, no code. ~30 min once gate is cleared.

### I4 — Google Business Profile OAuth (external wait)
GBP integration built. App in Testing mode. Gate: Google API Console approval for external app status.
**Action:** Monitor → flip to Published → verify OAuth with real client listing. ~1 hr once approved.

---

## 🟠 SHOULD — Productization & Growth

### UX-FEAT-001: Lead Gen Filter Bar — Presentation Overhaul
The default visible state undersells the intelligence system. A new user sees a basic search bar, not a sophisticated lead scoring engine.
**Direction:** Surface Tier, Impact Score, and Close Likelihood as the primary visible controls. Intelligence strip above kanban showing active filter posture. Better visual language for expand/collapse — not a generic accordion.
**Constraint:** No data model or filter logic changes. Purely `lead-filter-bar-advanced.tsx` presentation.
**Size:** ~1 session. **Files:** `src/components/leads/lead-filter-bar-advanced.tsx`

### FEAT-014: Project Management Platform Import
Onboarding adapters for Basecamp (existing crawler), Asana, Monday.com, ClickUp, Trello. Generic `TaskImportAdapter` interface + import wizard in Settings. Preview/mapping step before commit. Admin-only.
**Size:** ~1 session per adapter; ~1 session for wizard UI. **Priority:** 🟠 Sprint 12 target.

### FEAT-015: Admin First-Run Wizard
See UX-AUDIT-008. Same item — cross-referenced here for sprint sequencing.
**Sprint target:** 10.

### FEAT-016: Tenant Voice + Visual Style Capture
Before the brochure, audit reports, and comp sheets can represent a marketing company well, the system needs to know who that company is. The admin should be able to input (or the system should infer): brand color palette, primary font, logo, tagline, tone/voice profile (formal vs conversational, bold vs reserved). These become the defaults for all marketing deliverables rendered for that tenant.
**Scope:** Voice profile schema on TenantConfig (tone, keywords, anti-keywords, sample approved copy). Visual style schema (primaryColor, accentColor, fontFamily, logoUrl). Settings UI for admin to configure. Template renderer reads tenant style when generating brochures, audit reports, comp sheets. Fallback to COVOS defaults.
**Size:** ~1 session. **Priority:** 🟠 SHOULD — required before AUDIT-003 brochure redesign is meaningful.

### FEAT-017: Brochure + Marketing Collateral Design Overhaul
See UX-AUDIT-003. Depends on FEAT-016 (style capture). Redesign brochure as tenant-branded output. Extend to audit reports and comp sheet.
**Sprint target:** After FEAT-016. ~1 session.

### FEAT-018: Admin Logo Swap
See UX-AUDIT-007. `logoUrl` on TenantConfig, upload UI, navbar + login pull from tenant config.
**Sprint target:** 10. ~2 hrs.

### FEAT-019: Dashboard Usage Analytics (Admin-Facing)
The admin needs to know what's working in the dashboard itself — not business analytics, but platform analytics. What pages are used? What features are ignored? Where do users drop off? What integrations are connected vs never touched?
**Scope:** Per-user, per-session event tracking: page views, feature interactions (audit generated, demo generated, filter used, search triggered, etc.), integration connection events, session duration and frequency. Admin-only analytics page: usage heatmap by feature, active users over time, most/least used pages, "dead zones" (features with <10% engagement). Sign-in metadata: device, time of day, session length. This is dashboard introspection — the admin benchmarking board for the platform itself, not for clients.
**Instrument carefully:** No PII in events beyond userId. Events stored in `DashboardEvent` table. Aggregated views computed server-side. Export as CSV for manual analysis.
**Size:** ~1 session (instrumentation + admin page). **Priority:** 🟠 SHOULD — Sprint 11 target.

### FEAT-020: COVOS Owner Telemetry (Anonymous Backdoor)
As the owner of COVOS managing multiple tenant clients, David needs aggregate visibility into platform health and adoption across tenants — anonymized, no tenant PII. Which features are being used across the fleet? Which tenants are active vs stale? Where is friction showing up across all users?
**Scope:** Anonymous event pipeline from each tenant deployment → COVOS central analytics endpoint. Events: feature usage (no content, just event type + tenant hash), integration connection events, session frequency by tenant. Dashboard at a COVOS owner level (separate from tenant admin panel) showing fleet health. Must be architected to survive productization — when the platform has 50 tenants, this is how David knows what to build next.
**Privacy:** Anonymous by design. Tenant hash only — never business name, client data, or user identity in the central pipeline. Tenants should be informed this telemetry exists (add to SERVICE_AGREEMENT).
**Size:** ~1 session. **Priority:** 🟠 SHOULD — Sprint 11 target (alongside FEAT-019).

---

## 🟡 WOULD — High Value, No Current Blocker

### UX-AUDIT-010: Dashboard Role-Switch Layout Flash
**Observed:** Navigating away from `/sales` (Sales Dashboard) and returning shows a different dashboard — "Sales Tools + Quick Actions" on first load vs. a different widget layout on return. Likely two different dashboard components mounting depending on navigation state or session hydration order.
**Direction:** Audit which dashboard component mounts on `/` or `/sales` depending on role and navigation history. Confirm the component is stable on return navigation. This may be the same mount-flash issue as the pre-Sprint 8 grid fix, or a separate role/route resolution problem.
**Size:** ~1–2 hrs. **Priority:** 🔴 Should fix before external users — inconsistent first impression is a trust issue.

### FEAT-021: Tenant Logo + Brand Asset Management
**Context:** Marketing materials (brochures, audit reports, comp sheets, proposals) currently use generic GHM placeholders. When productized as COVOS, each tenant needs their own brand applied.
**Scope:**
- `logoUrl` field on TenantConfig (or extend existing config table). Admin-only upload UI in Settings > Branding.
- Toggle per material type: "Include logo on marketing materials" (default: on). Granular controls: brochure, audit PDF, comp sheet, proposal, portal.
- Rendered materials pull `logoUrl` + toggle state before generating. Fallback to text-only if no logo uploaded.
- GHM default: upload GHM logo assets now so they appear immediately in all current output.
- COVOS productization: when a new tenant admin onboards, branding step in first-run wizard (FEAT-015).
**Relationship:** Depends on FEAT-016 (full style capture); FEAT-021 is a subset that can ship independently.
**Size:** ~1 session. **Priority:** 🟠 SHOULD — Sprint 10 target. Pairs with FEAT-018 (navbar logo swap).

### UX-AUDIT-011: Tasks/Recurring Tasks Nav Placement
**Question:** Should Tasks and Recurring Tasks live under "Clients" in the left nav, rather than as standalone nav items?
**Current state:** Tasks appear as a top-level section. Most task work is client-contextual (tied to a specific client's deliverables, deadlines, and onboarding).
**Direction:** Evaluate two models — (A) Keep tasks at top level for cross-client queue management (master view: "all tasks across all clients"), (B) Move tasks under Clients as a client-contextual tool, with a master queue accessible from a different entry point. Both are valid depending on how task work is actually done day-to-day. Audit actual usage pattern before committing.
**Size:** ~2 hrs (decision + nav restructure). **Priority:** 🟡 WOULD — low disruption if changed early, high disruption if changed after user habits form. Decide by Sprint 10.

### FEAT-011: Full Button / Route / Path / Pattern / Dependency & Logic Audit
No formal audit has been run on the complete button-to-route-to-handler chain. Stale routes, dead buttons, orphaned handlers, and dependency mismatches accumulate over sprints and become invisible bugs or security gaps at productization.
**Scope:** Enumerate every `<Button>`, `<Link>`, `router.push()`, and form `onSubmit` in the codebase. Map each to its handler and route. Flag: dead routes (handler exists, no UI pointing to it), broken routes (UI points, handler missing/wrong), duplicate logic (same operation done two ways in different components), permission gaps (route accessible without correct role check), and dependency tangles (component imported but unused, or used in multiple incompatible contexts).
**Output:** `docs/ROUTE_AUDIT.md` with findings table. Fix critical gaps immediately; document non-critical for next sprint.
**Size:** ~1 session (audit + doc); fix pass ~1 additional session. **Priority:** 🟡 WOULD — must happen before first external tenant.

### Pipeline Filter — Lead Source Filter
Lead Source field (organic/referral/discovery/import) exists in DB, not surfaced in filter bar. **Scope:** Add to filter UI and `filteredLeads` memo. **Size:** ~1 hr.

### Static Empty State Help Text
Context-aware empty states in Leads, Clients, Content Studio — suggest next action with direct button. Pairs with tooltip audit (UX-AUDIT-001).
**Size:** ~2–3 hrs.

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
**Prerequisite:** FEAT-016 style capture, FEAT-018 logo swap, Sprint 10 admin first-run, Sprint 11 telemetry. **Size:** 2–3 sessions core flow; ongoing for billing and admin.
