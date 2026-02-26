# GHM DASHBOARD — CHANGELOG
**Purpose:** Permanent record of every completed item. Items are moved here when shipped.
**Never prune this file.** It is the audit trail.
**Last Updated:** February 26, 2026 — Sprint 23-E shipped (Status Color Token Migration — 779 replacements across 125 file-changes).

---

## Sprint 23-E — UI Constitution Phase 1: Status Color Token Migration — February 26, 2026

**Class-name-only refactor across 125 file-changes.** Replaced all hardcoded Tailwind status-color classes with COVOS semantic token classes. Zero logic changes — class names only.

**Non-orange migration (automated):** 99 files, 710 replacements. Python script replaced green/emerald → `success`, yellow/amber → `warning`, red → `danger` across all eligible `.tsx` files in one pass. Dark mode `dark:text-*`, `dark:bg-*`, `dark:border-*` variants removed from all migrated files — tokens handle dark mode via CSS variables automatically.

**Orange migration (context-reviewed):** 26 files, 69 replacements. Each orange instance reviewed in surrounding code context before replacement. All 26 files confirmed → `warning` semantics: P2 priority badges, pending financial amounts (earnings, fees, upsell), outstanding AR, billing "overdue" status (sits between grace=warning and paused=danger in the escalation scale), bug "new" status icons, audit `data_export` event type, issue impact text in WebsiteAuditPanel, setup/onboarding tool category colors, dashboard "Manage Team" widget, content type "commercial" indicators, scan overdue alerts.

**Intentionally excluded (7 files):** 4 PDF/print pages (`@react-pdf/renderer` requires inline styles — migration would break rendering), `status-badge.tsx` + `churn-risk-badge.tsx` (dot indicator circles — raw Tailwind intentional, these are filled SVG-circle dots not semantic text/bg), `health-sparkline.tsx` (deferred — needs trend-direction tokens not yet defined).

**Intentional non-migration (1 case):** `PositionsTab.tsx` contractor `TYPE_COLORS` — orange is a categorical identity color (blue=sales, purple=management, green=operations, orange=contractor). Not semantically equivalent to `warning`. Migrating it would make "Contractor" position type visually indistinguishable from a warning state.

**TypeScript check:** No new errors. Pre-existing errors in `scripts/basecamp-crawl.ts`, `scripts/import-wave-history.ts`, `src/lib/basecamp/client.ts` unchanged (unrelated to this sprint).

**Files changed:** 125 file-changes (99 non-orange pass + 26 orange pass, some files touched by both), 779 total replacements (710 + 69).

---

## Sprint 23-D — UI Constitution Phase 1: StatusBadge + Chart Color Migration — February 25, 2026

**Two new utility files + 6 component migrations.** Built the reusable foundation components that enable systematic color migration across the rest of the codebase.

**New: `StatusBadge` component** (`src/components/ui/status-badge.tsx`) — Universal status indicator consuming COVOS semantic tokens. 5 variants: success, warning, danger, info, neutral. Props: variant, children, dot (optional status dot), size (sm/md). Includes `scoreToVariant()` helper for mapping numeric scores to status variants. Uses `bg-status-{variant}-bg text-status-{variant} border-status-{variant}-border` tokens.

**New: `useChartColors` hook** (`src/hooks/use-chart-colors.ts`) — Resolves `--chart-N` CSS variables to hex strings for recharts (which can't consume CSS variables directly). Reads computed styles from DOM, converts HSL to hex via canvas. Exports `CHART_FALLBACKS` for static/server contexts. Auto-updates when dark mode toggles via MutationObserver on `<html>` class attribute.

**Migrated: `churn-risk-badge.tsx`** — Replaced hardcoded green/yellow/orange/red Tailwind classes with `bg-status-{variant}-bg text-status-{variant} border-status-{variant}-border`. Added dark mode dot variants.

**Migrated: `advanced-charts.tsx`** — Replaced 7-color hardcoded COLORS array with `CHART_FALLBACKS` import. All 12 inline hex references in RevenueTrendChart, SalesRepPerformanceChart, TerritoryComparisonChart, TaskCompletionTrendChart converted to `COLORS[N]`.

**Migrated: `intelligence-trends.tsx`** — Replaced 5 hardcoded hex values with `CHART_FALLBACKS` references across trend lines.

**Migrated: `analytics-dashboard.tsx`** — Replaced 3 hardcoded hex values with `CHART_FALLBACKS` references.

**Migrated: `performance-dashboard.tsx`** — Replaced 3 hardcoded hex values (request count line, avg duration line, error bar) with `CHART_FALLBACKS` references.

**Migrated: `SiteHealthTab.tsx`** — Replaced 3 hardcoded hex values (Mobile/Desktop/SEO score lines) with `CHART_FALLBACKS` references.

**Remaining chart hex (deferred):** `health-sparkline.tsx` (1 value — status-semantic green, not chart color), `LocalPresenceTab.tsx` (1 value — grid line structural neutral). Both are edge cases for future status/structural token migration, not chart color migration.

**TypeScript check:** Fixed `ImageData` destructuring error in `use-chart-colors.ts` (Uint8ClampedArray needs index access, not array destructuring without `downlevelIteration`). No new errors.
**Files created:** `src/components/ui/status-badge.tsx`, `src/hooks/use-chart-colors.ts`
**Files modified:** `src/components/clients/churn-risk-badge.tsx`, `src/components/analytics/advanced-charts.tsx`, `src/components/analytics/intelligence-trends.tsx`, `src/components/analytics/analytics-dashboard.tsx`, `src/components/monitoring/performance-dashboard.tsx`, `src/components/clients/site-health/SiteHealthTab.tsx`

---

## Sprint 23-C — UI Constitution Phase 1: Signal Token Implementation — February 25, 2026

**COVOS Signal palette implemented across token infrastructure.** Three files modified, zero component changes needed (shadcn tokens already consumed by components). This sprint delivers the foundation — all subsequent color migration sprints consume these tokens.

**globals.css — Full token replacement.** Replaced stock shadcn blue `:root` and `.dark` blocks with COVOS Signal palette (indigo-600 primary, amber-600 accent, slate neutrals). Added 6 sidebar tokens (deep navy, same in both modes). Added 15 status tokens × 2 modes (success/warning/danger/info/neutral — each with text, bg, border variants). Added 8 chart tokens × 2 modes (indigo, amber, teal, rose, violet, cyan, lime, orange — colorblind-safe, well-separated hues). Dark mode: sidebar stays identical, content area inverts, primary lightens to indigo-400, accent brightens to amber-400, status colors get darkened backgrounds with brightened text.

**tailwind.config.ts — Token mappings extended.** Added chart tokens 6-8 (was 1-5). Added sidebar token group (DEFAULT, foreground, muted, active, active-bg, border). Added status token group (15 tokens: success/warning/danger/info/neutral × text/bg/border). Cleaned up mixed tab/space indentation to consistent 2-space. Components can now use `bg-status-success-bg text-status-success` instead of hardcoded `bg-green-100 text-green-600`.

**BrandThemeInjector.tsx — Defaults updated to Signal.** Changed from stock shadcn blue (`#2563eb`) to Signal indigo (`#4f46e5`). Changed accent from `#f59e0b` to `#d97706`. Changed secondary from `#64748b` to `#94a3b8`. These defaults are what an unbranded COVOS tenant sees.

**TypeScript check:** No new errors. Pre-existing errors in scripts/basecamp (unrelated) unchanged.
**Files modified:** `src/app/globals.css`, `tailwind.config.ts`, `src/components/branding/BrandThemeInjector.tsx`
**Spec:** `docs/ui-constitution/SIGNAL_TOKEN_SPEC.md` (locked reference — all token values, hex + HSL, light + dark, migration impact)

---

## Sprint 23-B — UI Constitution Phase 1: Color Token Design — February 25, 2026

**COVOS platform palette designed and locked.** Multi-session design exploration (5 initial palettes → 4 refinements → Signal family → final selection). Produced `SIGNAL_TOKEN_SPEC.md` — complete token specification with light/dark values for structural, interactive, sidebar, status, and chart token families.

**Decisions locked:** Palette: Signal. Neutrals: Slate. Dark mode: sidebar-stable (content inverts). Chart tokens: 8. Brand navy (#1e3a5f): deferred. Layer architecture: Layer 0 (COVOS platform, never overridden) + Layer 1 (tenant brand overlay) + Layer 2 (dark mode).
**Files created:** `docs/ui-constitution/SIGNAL_TOKEN_SPEC.md`

---

## Sprint 23-A — UI Constitution Phase 1: Color Token Audit — February 25, 2026

**COLOR_AUDIT.md COMPLETE — First Cowork autonomous agent session.** Read-only audit of all color usage across the GHM dashboard codebase. 716 lines, 10 sections, all quality gates passed (output exists, all sections present, zero code modified). Findings: 1,229 hardcoded color classes, 109 inline style color values, 44 SVG/chart hex values. 12 distinct status/state color patterns identified. Dark mode coverage at ~16%. Top concerns: status color fragmentation (12 independent systems), chart colors bypassing tokens entirely, custom navy #1e3a5f unformalised, welcome page as 10% color hotspot, inconsistent shade usage across same semantic concepts.
**Files created:** `docs/ui-constitution/COLOR_AUDIT.md`, `MORNING_BRIEFING.md`, `docs/INFRA-001_RESEND_RUNBOOK.md`

---

## Sprint 24 — February 25, 2026

**LEGAL-001 COMPLETE — Partner Agreement Dashboard Use Restriction.** Added §9.7 to `PARTNER_AGREEMENT.md`: dashboard and platform features licensed exclusively for GHM business. Use for personal clients, third-party clients, or non-GHM purposes is a material breach. GHM reserves right to monitor usage and suspend access.
**Files modified:** `D:\Work\SEO-Services\PARTNER_AGREEMENT.md`

**FEAT-028 — Confirmed pre-shipped (removed from backlog).** Bug report status feedback loop was already fully implemented: admin inline Status + Priority selects fire `createNotification()` to submitter on change. Non-admin "My Submissions" view at `/bugs` with `?mine=true` API support. All wired in Sprint 16.

**UX-AUDIT-014 COMPLETE — Pipeline Enrich Button Intent-Aware Redesign.** Removed standalone "Enrich (50)" header button and its entire code path (`handleBatchEnrich`, `batchEnriching`, `enrichCount` state — all dead code removed). Enrichment now available through two intent-aware paths: (1) per-lead "Enrich Data" button in lead detail sheet (already existed), (2) "Enrich All (skip fresh)" in Bulk Actions dropdown (already existed). Added confirmation warning when >50% of targeted leads are in "Available" status — warns that enriching untouched leads wastes API credits.
**Files modified:** `src/app/(dashboard)/leads/client.tsx`

---

## Backlog Hygiene — February 25, 2026

**UX-BUG-004 — Removed from backlog (pre-shipped).** Nav auto-scroll on group expand confirmed shipped Feb 24 changelog audit. `nav.tsx` line 185 already calls `scrollIntoView({ behavior: "smooth", block: "nearest" })`.

**UX-BUG-005 — Removed from backlog (pre-shipped).** "Team" nav group already renamed to "Resources" in `nav.tsx`. Confirmed Feb 24 changelog audit.

**UX-AUDIT-010 — Removed from backlog (pre-shipped).** Dashboard role-switch layout flash resolved by `RefreshOnFocus` 2-second debounce. Confirmed Feb 24 changelog audit.

**BUG-026 — Removed from backlog (code fix shipped Sprint 21-A).** Forgot password route fixed: correct `/auth/reset-password` path, explicit `emailResult.success` check with `console.error` logging. Email delivery blocked solely by INFRA-001 (Resend domain verification — ops action, no code).

**FEAT-022/023/024 — Removed stale shipped entries from backlog.** All three shipped Sprint 19 but full description text was still lingering with strikethrough headers.

**INFRA-001 — Ops runbook created.** Step-by-step Resend domain verification guide at `docs/INFRA-001_RESEND_RUNBOOK.md`. Verified forgot password route code is solid (Sprint 21-A fix confirmed). Once domain is verified, all email (forgot password, notifications, reports, work orders) will deliver.

---

## Agent Infrastructure — February 24, 2026

**AGENT_PROTOCOL.md** — GHM project-specific agent protocol created. Immutable constraints (SALARY_ONLY_USER_IDS, prisma db push, no raw anthropic calls, isElevated() enforcement), bootstrap sequence, quality gates (TypeScript + SHIM + git), sync protocol, KERNL checkpointing spec, session end checklist.

**SPRINT_23A_BLUEPRINT.md** — First agent-ready blueprint written for Sprint 23-A Color Token Audit. Read-only session: audits all color usage across `src/` and produces `docs/ui-constitution/COLOR_AUDIT.md`. 10 structured work items, full stopping conditions, ambiguity resolution, quality gates. First Cowork autonomous test run.

**CLAUDE_INSTRUCTIONS.md** — §AGENT_MODE section added. Cowork agents skip interactive checkpoint, load AGENT_PROTOCOL + blueprint, proceed directly to execution. Quality gates and stopping conditions remain mandatory.

**Files:** `AGENT_PROTOCOL.md` (new), `SPRINT_23A_BLUEPRINT.md` (new), `CLAUDE_INSTRUCTIONS.md` (§AGENT_MODE added)

---

## Sprint 21-D — TeamFeed Rework — February 24, 2026

**BUG-029 / BUG-028 — GIF Rendering Fixed**
Root cause: `POST /api/team-messages` destructured `content, audienceType, audienceValue, recipientId, parentId, priority, isPinned, mentions` from body but never destructured or persisted `attachmentUrl, attachmentName, attachmentSize, attachmentMimeType, attachmentVaultId`. Attachment fields were silently dropped on every POST. Fix: destructured all 5 attachment fields, added them to `prisma.teamMessage.create` data block. Also relaxed validation — empty content is now allowed when `attachmentUrl` is present (required for GIF-only messages). Push notification body now falls back to `"📎 Attachment"` when content is empty.
**Files modified:** `src/app/api/team-messages/route.ts`

**UX-AUDIT-026 — Compose UX Full Rethink (Slack-Bar Standard)**
Killed the `⋯ options` hidden drawer entirely. Rebuilt `ComposeBox` in `TeamFeedSidebar.tsx` to Slack-bar standard. Always visible: textarea, send button, emoji picker, GIF picker. Audience: compact `Users`-icon chip showing current audience label ("Everyone", "Managers", "Sales", or person name) — one click expands an inline picker with role buttons and per-user direct buttons, auto-dismisses on selection. Priority: single icon button cycling `normal → important → urgent` — icon changes color to reflect state (grey→amber→red), no dropdown needed. Pin: icon button visible to masters only. Removed all `Select` component imports from compose (no longer needed). No hidden drawers. No required discovery. Bar is: open feed → type → hit send in under 5 seconds.
**Files modified:** `src/components/team-feed/TeamFeedSidebar.tsx`
**TypeScript:** Zero new errors. Pre-existing 5 errors (scripts/basecamp/dotenv) unaffected.

---

## Bug Batch Audit — February 24, 2026

**UX-BUG-003 — Wave Widget Graceful Degradation**
Confirmed pre-shipped. `FinancialOverviewSection.tsx` already handles `waveError` state with amber non-fatal notice. Raw GraphQL errors do not surface.

**UX-BUG-004 — Left Nav Auto-Scroll on Group Expand**
Confirmed pre-shipped. `nav.tsx` line 185 already calls `scrollIntoView({ behavior: "smooth", block: "nearest" })` on the last link of any expanded group.

**UX-BUG-005 — "Team" Nav Group Rename**
Confirmed pre-shipped. Nav group label is already `"Resources"` in `nav.tsx`. Service Catalog + Document Vault correctly grouped.

**BUG-027 — Goals Widget Wrong Settings Hint**
Confirmed pre-shipped. Manager dashboard hint link already reads `"Configure in Settings → Compensation"` pointing to `/settings?tab=compensation`.

**UX-AUDIT-010 — Dashboard Role-Switch Layout Flash**
Confirmed pre-shipped. `RefreshOnFocus` component implements 2-second debounce — skips refresh on back-navigation, only fires on genuine tab refocus. Flash resolved.

**ARCH-001 — Orphaned File Audit**
Executed. Moved `SPRINT7_HANDOFF.md`, `PROJECT_STATUS.md`, `OPERATIONAL_STATUS.md`, `BUILD_PLAN.md` from root to `docs/archive/`. Root is now clean.

---

## Sprint 22 — February 24, 2026

**UX-AUDIT-023 — Tour Tip Sparkle Badge**
Confirmed pre-shipped. `TourButton.tsx` already has amber Sparkles badge absolutely positioned top-right of HelpCircle icon. No code changes needed.

**UX-AUDIT-024 — COVOS Branding Pass**
"Powered by COVOS" mark added to all remaining surfaces: `src/lib/email/templates.ts` (report, upsell, portal invite footers), `src/lib/email/index.ts` (status notification, contractor Wave invite, partner onboarding notification, report email). Login page, error page, onboarding wizard done screen, and report PDF template confirmed pre-existing. Full platform-layer coverage complete.

---

## Sprint 21-C — February 24, 2026

**FEAT-033 — Import/Migration Edge Case Hardening & Recovery Layer**
Schema: `pm_import_session_id INT` + `pm_external_id TEXT` added to `client_tasks` with dedup index. New API routes: `POST /api/import/pm/validate` (pre-commit validation — missing titles, field length warnings, duplicate detection, assignee mismatch report, canProceed flag), `POST /api/import/pm/rollback` (24-hour undo window, deletes all tasks by session ID). Commit route hardened: field truncation at 255/5000 chars, duplicate detection with skip/overwrite strategy, `pmImportSessionId` + `pmExternalId` stored on every created task. `DataImportTab` UI overhauled to 6-step flow: platform → connect → preview (with CSV column mapper) → validate (with assignee mismatch panel, per-record issues, duplicate count) → commit (with dup strategy selector) → done (with collapsible error log, rollback button). TypeScript clean (5 pre-existing errors unaffected).

---

## Sprint 21-B — February 24, 2026

**UX-AUDIT-025 — TeamFeed Full UX Overhaul**
SSE real-time replaces 30s polling (`/api/team-messages/stream` — 5s DB poll, 25s heartbeat). Panel auto-scrolls to bottom on open. Pinned messages extracted to collapsible banner strip. Compose always visible with collapsible options. @mention autocomplete inline while typing, stored in `mentions JSON`, triggers targeted notification. Edit message in-place (author only), `edited_at` tracked. "Seen by X" read receipts on timestamp hover. Search in panel header against content + author. Dead `&&true` in ReactionRow cleaned. `AttachmentBlock` extracted to shared `TeamFeedAttachment.tsx`. `TeamFeedPanel` mount bug fixed (never called `load()`). Schema: `edited_at TIMESTAMP(3)` + `mentions JSONB` added to `team_messages`.

---



---

## Sprint 22 — UX Polish + Settings IA (February 24, 2026)

| Date | What Shipped |
|------|-------------|
| Feb 24 | **BUG-017** — Login dark mode bleed on logout. Created `src/app/(auth)/layout.tsx` with forced `className="light"` wrapper. Auth routes always render in light mode regardless of user theme. |
| Feb 24 | **BUG-018** — Search bar shortcut `CtrlK` → `Ctrl+K`. Added `+` separator in `AISearchBar.tsx` kbd badge. |
| Feb 24 | **BUG-019** — TeamFeed compose enter icon too small. Replaced unicode `↵` with `<CornerDownLeft className="h-3 w-3 inline" />` in both `TeamFeed.tsx` and `TeamFeedSidebar.tsx`. |
| Feb 24 | **UX-AUDIT-020** — Settings IA: Commission Defaults + Monthly Goals extracted from General Settings into new `CompensationTab.tsx`. General Settings now contains only Appearance + Push Notifications. Compensation tab is admin-only, placed after General. |
| Feb 24 | **UX-AUDIT-021** — Tutorial restart global nav awareness. `OnboardingTutorial` moved from `sales/page.tsx` + `manager/page.tsx` to `DashboardLayoutClient` (global mount on every page). `window.restartTutorial` always registered. Help menu "Restart Tutorial" works from any route. |

**Files:** `src/app/(auth)/layout.tsx` (new), `src/components/settings/CompensationTab.tsx` (new), `src/components/search/AISearchBar.tsx`, `src/components/team-feed/TeamFeed.tsx`, `src/components/team-feed/TeamFeedSidebar.tsx`, `src/components/settings/GeneralSettingsTab.tsx`, `src/app/(dashboard)/settings/page.tsx`, `src/components/dashboard/DashboardLayoutClient.tsx`, `src/app/(dashboard)/layout.tsx`, `src/app/(dashboard)/sales/page.tsx`, `src/app/(dashboard)/manager/page.tsx`

---

## Sprint 21-A — Bug Triage Batch (February 24, 2026)

| Date | What Shipped |
|------|-------------|
| Feb 24 | **BUG-026** — Forgot password email not delivered. Root causes: (1) reset URL path was `/reset-password` instead of `/auth/reset-password` — dead link even if email arrived. Fixed to correct path. (2) Added explicit `emailResult.success` check with error logging so Vercel runtime logs surface Resend failures. Resend domain verification (INFRA-001) remains a required ops action. |
| Feb 24 | **BUG-027** — Goals widget hint text pointed to "Settings → General" after goals config moved to Compensation tab (UX-AUDIT-020). Fixed link to `/settings?tab=compensation` with label "Settings → Compensation". |
| Feb 24 | **BUG-028** — TeamFeed emoji picker and GIF search broken in production. Emoji fix: `@emoji-mart/data` imported directly and passed as `data` prop to `EmojiPicker` — prevents runtime CDN fetch which is unreliable in Vercel edge environment. GIF fix: removed `{ next: { revalidate: 60 } }` cache option from Tenor API fetch (replaced with `cache: "no-store"`) which was serving stale empty results; added explicit error logging for Tenor API failures. |

**Files:** `src/app/api/auth/forgot-password/route.ts`, `src/app/(dashboard)/manager/page.tsx`, `src/components/team-feed/TeamFeedMultimedia.tsx`, `src/app/api/gif-search/route.ts`

---



| Date | What Shipped |
|------|-------------|
| Feb 25 | **FEAT-015** — Admin onboarding wizard expanded from 4 steps to 7. Steps: Welcome → Company → Branding (logo + 3 colors) → Team Setup (invite user) → Lead Import (CSV/Excel) → Integrations Checklist (live status badges) → Done. Wizard step persisted to `User.adminOnboardingStep`; resume on re-entry. All steps skippable. `AdminSetupWizard.tsx` fully rewritten; `admin-setup/page.tsx` updated to pass `initialStep`. |
| Feb 25 | **FEAT-018** — Login page tenant logo. `GET /api/public/branding` (no auth). Login page fetches on mount and renders tenant logo with fallback to `/logo.png`. |
| Feb 25 | **UX-AUDIT-012** — 3-color branding system. `brandColorSecondary` + `brandColorAccent` added to `GlobalSettings` schema + pushed to DB. BrandingTab updated with three color pickers + per-color reset buttons. Saved via `/api/admin/onboarding` PATCH. |
| Feb 25 | **BrandThemeInjector** — `src/components/branding/BrandThemeInjector.tsx` created. Injects `--brand-primary`, `--brand-secondary`, `--brand-accent` as CSS custom properties on `:root`. Dashboard layout already imports and mounts it. |
| Feb 25 | **Onboarding API** — `GET /api/admin/onboarding` + `PATCH` extended: `step` field for wizard progress, all three brand color fields (`brandColorSecondary`, `brandColorAccent`). `GET /api/public/branding` created (no auth required). |

---

## Sprint 16 + 16.5 — Admin Polish + Critical Bug Batch (February 25, 2026)

| Date | What Shipped |
|------|-------------|
| Feb 25 | **FEAT-027** — Logo nav: confirmed already implemented (nav.tsx logo wrapped in Link). Closed. |
| Feb 25 | **FEAT-028** — Bug report status feedback loop. Admin bug view: inline Status + Priority selects per card. PATCH route fires in-app notification to submitter on status change (via notification-service). Non-admin users see "My Submissions" at /bugs (own reports only, read-only status). GET route supports `mine=true` for non-admin scoping. |
| Feb 25 | **UX-AUDIT-015** — Content Studio empty states: confirmed implemented in StudioClientPicker. Closed. |
| Feb 25 | **BUG-020** — Forgot password flow. PasswordReset model + prisma db push. `/api/auth/forgot-password` + `/api/auth/reset-password` routes. `/auth/forgot-password` + `/auth/reset-password` pages. "Forgot password?" link on login screen. |
| Feb 25 | **BUG-021** — "Wave accounts" hardcoded fallback replaced with "Connected accounts" in FinancialOverviewSection. |
| Feb 25 | **BUG-022** — Territory showcase converted from hardcoded static array to live Prisma query (`territory.findMany({ where: { isActive: true } })`). |
| Feb 25 | **BUG-023** — Vault: stale-copy warning removed. Preview modal for PDF/image files (iframe/img + Download button). Delete added to three-dot menu with confirmation dialog; DELETE API route removes blob + DB record. |
| Feb 25 | **BUG-024** — Service catalog edit form blank fields fixed. ProductDialog useEffect resets formData when `product` or `open` changes. |

---



| Date | What Shipped |
|------|-------------|
| Feb 25 | **FEAT-025** — Full Lead model filter expansion. Added closeScore (range slider), wealthScore (multi-select: Low/Medium/High/Very High), pitchAngle (multi-select from enum), suppressionSignal (text search), distanceFromMetro (range slider), intelNeedsRefresh (boolean toggle), mrr/arr (range sliders) as filter controls in `lead-filter-bar-advanced.tsx`. client.tsx and leads/page.tsx updated to pass/apply all new fields. |
| Feb 25 | **FEAT-026** — Filter UX defaults + collapsibility. Pipeline Status section made collapsible (was the only non-collapsible section). Default visible top-bar filters reordered to: Status, Assigned Rep, Territory, Sort. Score/intelligence filters moved to More Filters panel. |
| Feb 25 | **UX-FEAT-001** — Filter bar presentation overhaul. Tier, Impact Score, and Close Likelihood surfaced as primary visible controls. Intelligence posture strip added above kanban when filters are active, showing active filter summary. Improved expand/collapse visual language throughout. No data model changes. |

---



| Date | What Shipped |
|------|-------------|
| Feb 24 | **BUG-012** — Territories Settings tab crash. `headers()` called inside client component via dynamic server import. Fixed: import `TerritoriesClient` directly instead of page wrapper. |
| Feb 24 | **BUG-013** — Custom permission preset 400 error. Validation array in `/api/users/[id]/permissions` missing `"custom"`. Fixed: added `"custom"` to allowed preset values. |
| Feb 24 | **BUG-014** — Recurring Tasks "New Rule" crash. Missing `/api/checklist-templates` route + no array guards. Fixed: created route (`taskChecklistTemplate.findMany`), added `Array.isArray()` guards in `recurring-task-form.tsx`. |
| Feb 24 | **BUG-015** — Wave settings tab broken when unconfigured. Fixed: actionable setup prompt with env var names and Wave API docs link when `!status.connected`. |
| Feb 24 | **BUG-016** — Kanban column headings too bright in dark mode. Fixed: all 8 status heading colors changed from `dark:text-{color}-300` → `dark:text-{color}-400` in `src/types/index.ts`. |
| Feb 24 | **UX-AUDIT-019** — Permission manager embedded inline in Settings → Permissions tab. Removed link-out card; `<PermissionManager />` renders directly. |
| Feb 24 | **UX-AUDIT-018** — Integration health panel CTAs. Non-configured integrations: "Configure ↗" link to provider docs. Configured integrations: per-row Refresh icon button. Global button renamed "Refresh All". |
| Feb 24 | **FEAT-030** — Service catalog list/grid toggle. `LayoutList`/`LayoutGrid` button pair, localStorage-persisted. Grid: compact 1–3 column responsive cards with name, category badge, active/inactive badge, price, truncated description. |
| Feb 24 | **FEAT-031** — Role-aware suggested tasks in New Task dialog. Quick-add chip bar above Title field; 4–5 curated suggestions per role (admin/manager/sales). Chip click populates title + sets category. |
| Feb 24 | **FEAT-032** — File uploads optional Display Name field. `display_name` column added to `vault_files` (schema + `prisma db push`). Upload dialog shows Display Name input after file selected. Tile renders `displayName ?? name`. Search covers displayName. `VaultFileRecord` type updated. |

**Files:** `src/app/api/checklist-templates/route.ts` (new), `src/components/tasks/recurring-task-form.tsx`, `src/app/(dashboard)/settings/page.tsx`, `src/app/api/users/[id]/permissions/route.ts`, `src/components/settings/WaveSettingsTab.tsx`, `src/types/index.ts`, `src/components/permissions/permission-manager.tsx`, `src/components/settings/IntegrationsTab.tsx`, `src/components/products/product-catalog.tsx`, `src/components/tasks/task-queue-client.tsx`, `src/app/api/vault/upload/route.ts`, `src/components/vault/vault-upload-button.tsx`, `src/components/vault/vault-file-tile.tsx`, `src/components/vault/vault-client.tsx`, `prisma/schema.prisma`

---

## Sprint 14 — UX Polish Batch (February 24, 2026)

### UX-AUDIT-013 — Dialog / Modal Global Style Audit
Base components upgraded: `dialog.tsx`, `sheet.tsx`, `alert-dialog.tsx`. All 30+ consumers inherit automatically. Changes: backdrop darkened to `bg-black/60` with `backdrop-blur-sm`, `DialogContent` gets `border-t-2 border-t-primary/30` accent top border and `shadow-xl`, close button upgraded from `rounded-sm` to `rounded-md p-1` with `hover:bg-muted` state, `DialogHeader` gains `pb-4 border-b` separator, `DialogFooter` and `AlertDialogFooter` get `gap-2 pt-2` tightening, `SheetContent` right variant gets `border-l-primary/20` accent.
**Files:** `src/components/ui/dialog.tsx`, `src/components/ui/sheet.tsx`, `src/components/ui/alert-dialog.tsx`

### UX-AUDIT-016 — Tooltip vs Tour Tip Visual Differentiation
Created `InfoTip` component as the canonical info `?` — subdued `text-muted-foreground/60`, outline style, informational only. Updated `TourButton` to render in `text-primary/70 hover:text-primary hover:bg-primary/10` — visually distinct filled accent style signaling guided interaction. Design system note included in both files via JSDoc.
**Files:** `src/components/ui/info-tip.tsx` (new), `src/components/tutorials/TourButton.tsx`

### UX-AUDIT-017 — Bulk Actions Configurable Volume
Replaced hardcoded `Enrich (50)` and `Bulk Actions (200)` with configurable count state. Enrich button becomes split-button: main action runs enrich at selected count, chevron opens DropdownMenu with presets (25/50/100/All) and ⚠ cost warning for 100+. Bulk Actions dropdown footer shows count presets (25/50/100/200/All). `resolvedCount()` helper. Default: enrich=50, bulk=200. Server-side caps unchanged.
**Files:** `src/app/(dashboard)/leads/client.tsx`

### UX-BUG-002 — Search Bar Layout-Aware Inline Trigger
Trigger button upgraded to `flex-1 min-w-0 max-w-sm` — fills available space between left nav and TeamFeedToggle, layout-aware. Kbd shortcut badge moved to `ml-auto` right-aligned. Text truncates cleanly. Modal overlay already handled click-outside dismiss. Resolves UX-BUG-001 (click-outside) as a side effect.
**Files:** `src/components/search/AISearchBar.tsx`

### FEAT-029 — Rename `master` role → `manager`

**Breaking schema change — fully migrated.**

| Layer | Change |
|---|---|
| Database | `UserRole` enum: `master` → `manager` (live SQL); Gavin Muirhead (id=5) confirmed ✅ |
| Prisma | Schema + client regenerated |
| Auth | `AppRole`, `isElevated()`, `ROLE_LABELS`, redirects all updated |
| Route | `/master` directory → `/manager`; all redirect/push/revalidate strings updated |
| Presets | `master_lite/full` → `manager_lite/full` in types, presets, UI, API validation |
| API | 87+ files: all `"master"` role string literals replaced |
| Preserved | `master_fee` payment type, `masterFeeEnabled/Amount`, `masterManagerId` DB columns |

---


| Date | What Shipped |
|------|-------------|
| Feb 24 | **Import visibility** — `CSVImportDialog` on `/leads` unblocked from master-only guard (now admin+master). Discovery page gets "Import from CSV" card alongside search. Enrich/Bulk Actions/territory filter guards updated to `admin\|master`. |
| Feb 24 | **Admin role elevation** — `isElevated()` applied to root redirect, work orders GET, team-messages pin, dashboard layout `isMaster` prop. Admins now have full master-level access everywhere. |
| Feb 24 | **9C — Branding system** — `POST/DELETE /api/settings/branding` (Vercel Blob logo upload/delete). `BrandingTab` (logo drag-drop, company name/tagline, brand color). Settings Branding tab (admin-only). Dashboard layout passes `logoUrl`+`companyName` to nav; nav shows custom logo with `/logo.png` fallback. |
| Feb 24 | **9B — Admin first-run wizard** — `/admin-setup` page + `AdminSetupWizard` (4 steps: Welcome → Company → Branding → Done). `GET/PATCH /api/admin/onboarding`. Dashboard layout redirects new admins to wizard; finish stamps `adminOnboardingCompletedAt` and routes to `/master`. |

---

## Sprint 8 — Content Power (February 24, 2026)

| Date | What Shipped |
|------|-------------|
| Feb 24 | **8A — Bulk Content Operations** — Multi-select + bulk action bar (Approve/Archive) in ContentList. `POST /api/content/bulk`. Master+ only via `isMaster` prop threaded page → profile → ContentStudioTab → ContentList. |
| Feb 24 | **8B — Competitor Tracking** — `CompetitorsTab` component (add/remove/scan-trigger, 5-slot limit, empty state). `GET/POST /api/clients/[id]/competitors`, `DELETE /api/clients/[id]/competitors/[cid]`. Wired into profile overflow nav under Operations. Fixed Prisma model name (`clientCompetitor`). |
| Feb 24 | **8C — Custom Report Builder** — Dialog extended with 8-section toggle grid, select-all, AI Executive Summary switch, Client-Facing Mode switch. `Array.from()` spread fix for Set iteration TS error. |
| Feb 24 | **Build fixes** — ESLint ternary-as-statement fix in ContentList + generate-report-button. Set spread → Array.from in both files. All Sprint 8 TS errors cleared. |



| Date | What Shipped |
|------|-------------|
| Feb 24, 2026 | **7A — Save Searches**: `SavedSearch` Prisma model + migration. `GET/POST /api/saved-searches` + `DELETE /api/saved-searches/[id]`. Save button + inline name input + "Saved Searches" dropdown in `lead-filter-bar-advanced.tsx`. Active saved search shows as named badge. |
| Feb 24, 2026 | **7B — Audit PDF PPC Section**: `AuditData.ppc` field added. `generator.ts` computes PPC block from `GoogleAdsConnection.isActive` + search volume proxy. Full PPC section in `template.ts`: account status, missed clicks, budget recommendation, campaign types, CTR, CTA. |
| Feb 24, 2026 | **7C — Brochure PPC Version**: Full PPC section added to `brochure/page.tsx`: value prop, services list (LSAs + Search Ads + management + reporting), pricing/engagement reference, inline SVG funnel visual, matching brand style. |

---

## Sprint 6 — UX Completeness + Pipeline Filter Debt (February 24, 2026)

| Date | What Shipped |
|------|-------------|
| Feb 24, 2026 | **UX-BUG-007/Search Bar Portal**: `AISearchBar` modal now renders via `createPortal(document.body)` with `mounted` guard. Escapes `overflow:hidden` layout containers. Transparent square bug eliminated. |
| Feb 24, 2026 | **UX-BUG-008 — Team Feed modifier key**: `ComposeMessage` (TeamFeed.tsx) and `ComposeBox` (TeamFeedSidebar.tsx) now use `useModifierKey` hook to show `⌘↵` on Mac and `Ctrl+↵` on Windows. |
| Feb 24, 2026 | **Pipeline Filter Debt — Deal Value slider**: `dealValueMin/Max` filter (0–$50k) added to `AdvancedFilterState`, filter bar UI (range slider with live `$` labels), and `filteredLeads` memo in client.tsx. |
| Feb 24, 2026 | **Pipeline Filter Debt — Days in Stage**: `daysInStageMin/Max` filter (0–365d) wired end-to-end. `statusChangedAt` now selected and serialized from server (fallback to `updatedAt` if null). Filter computes elapsed days at query time. |
| Feb 24, 2026 | **Keyboard Shortcuts**: `use-keyboard-shortcuts.ts` hook + `KeyboardShortcutsHelp` overlay component. Global `?` or `/` opens help panel. `G+D/L/C/T/R/S/P` navigation sequences. Wired into `DashboardLayoutClient`. Zero impact on existing shortcuts (Cmd+K search unchanged). |

---

## Sprint 5 — Data Access + Admin Visibility (February 24, 2026)

| Date | What Shipped |
|------|-------------|
| Feb 24, 2026 | **5A — Data Export**: `GET /api/export/leads` + `GET /api/export/clients` — CSV download with permission gate (admin = full DB, master = filtered by territory/permissions). Export button wired into Leads toolbar (current filtered view) and Clients portfolio toolbar (active or all). No new schema. |
| Feb 24, 2026 | **5B — User Activity/Session Stats**: `GET /api/admin/user-activity` — aggregates 30d event count, last activity, and unique pages from AuditLog (no new schema). `UserActivityTab.tsx` admin-only settings tab with sortable table (Most Active / Last Login / Name). Wired into Settings page as "User Activity" tab. |

---

## UX Bug Batch (February 24, 2026)

| Date | What Shipped |
|------|-------------|
| Feb 24, 2026 | UX-BUG-001 — Confirmed fixed: search bar backdrop click already closed modal via overlay onClick handler |
| Feb 24, 2026 | UX-BUG-002 + UX-BUG-007 — `AISearchBar.tsx`: trigger button now `invisible` (not unmounted) when modal open, eliminating double-bar effect. Modal renders conditionally via `{open && …}` with proper `<>` fragment wrapper |
| Feb 24, 2026 | UX-BUG-003 — `FinancialOverviewSection.tsx`: Wave error banner now shows clean "Live bank data unavailable. Showing payment records only." with Retry button — raw error detail removed from UI |
| Feb 24, 2026 | UX-BUG-004 — `nav.tsx`: `NavGroupSection` added `useRef` + `scrollIntoView({ behavior: "smooth", block: "nearest" })` on last link when group expands |
| Feb 24, 2026 | UX-BUG-005 — `nav.tsx`: "Team" nav group renamed to "Resources" |
| Feb 24, 2026 | UX-BUG-006 — `src/hooks/use-modifier-key.ts` created. `AISearchBar.tsx` applies `useModifierKey()` — shows `⌘K` on macOS, `CtrlK` on Windows/Linux |
| Feb 24, 2026 | ARCH-001 — 19 stale root-level `.md` files moved to `docs/archive/`. 11 stale `docs/PHASE_*.md` + session summary files also archived. Root is now clean |

## Sprint 4 — Intelligence Layer (February 24, 2026)

| Date | What Shipped |
|------|-------------|
| Feb 24, 2026 | `src/lib/analytics/intelligence.ts` — `buildMonthlyTrend()`, `computeChurnRisk()`, `buildHealthTrajectory()`, `buildSparklinePath()` — full intelligence computation library |
| Feb 24, 2026 | `src/app/api/analytics/trends/route.ts` — MoM trend + health trajectory data API (admin/master) |
| Feb 24, 2026 | `src/app/api/clients/churn-risk/route.ts` — Churn risk scores for all active clients (admin/master) |
| Feb 24, 2026 | `src/components/analytics/intelligence-trends.tsx` — 4-chart trend dashboard: MRR, active clients, new vs churn bar, avg health score |
| Feb 24, 2026 | `src/components/clients/churn-risk-badge.tsx` — Colored risk badge (medium/high/critical) with factor tooltip + client-side scoring function |
| Feb 24, 2026 | `src/components/clients/health-sparkline.tsx` — Inline SVG sparkline + full recharts trajectory chart |
| Feb 24, 2026 | Modified: `analytics/page.tsx`, `clients/page.tsx`, `portfolio.tsx` — trend charts, sparklines, and churn badges wired in |

## Sprint 3 — Bulk Operations (February 23, 2026)

| Date | What Shipped |
|------|-------------|
| Feb 23, 2026 | `src/lib/bulk/types.ts` — Shared bulk operation types and `bulkResponse()` helper |
| Feb 23, 2026 | `src/app/api/bulk/leads/route.ts` — Bulk lead ops: status transition, assign, archive, delete, enrich (200-lead cap, 50 for enrich) |
| Feb 23, 2026 | `src/app/api/bulk/clients/route.ts` — Bulk client ops: status, assign_rep, assign_manager, scan trigger, report generate+send |
| Feb 23, 2026 | `src/app/api/bulk/content/route.ts` — Bulk content ops: approve, reject, archive |
| Feb 23, 2026 | `src/app/api/bulk/tasks/route.ts` — Bulk task ops: close, reassign, create_for_clients (power-user: assign same task to N clients) |
| Feb 23, 2026 | `src/app/api/bulk/users/route.ts` — Bulk user ops: role, position, territory, activate, deactivate, reset_onboarding (protected: ID 1 never bulk-modified) |
| Feb 23, 2026 | `src/app/api/clients/import/route.ts` — CSV/XLSX client import (productization unlock: agencies import existing client lists, 500-client cap, creates Lead + ClientProfile atomically) |
| Feb 23, 2026 | `src/app/api/users/import/route.ts` — CSV/XLSX user/contractor import (bulk team onboarding, auto-generates temp passwords, returns credentials once) |
| Feb 23, 2026 | `src/hooks/use-bulk-select.ts` — Reusable multi-select state hook (toggle, toggleAll, clear, allSelected, someSelected, selectedIds) |
| Feb 23, 2026 | `src/components/bulk/bulk-action-bar.tsx` — Floating action bar with per-action loading states, toast results, confirm dialogs |
| Feb 23, 2026 | `src/components/bulk/bulk-import-dialog.tsx` — Reusable CSV/XLSX upload dialog with template download, drag-drop, results view |
| Feb 23, 2026 | `src/components/bulk/import-dialogs.tsx` — Thin wrappers: ClientImportDialog + UserImportDialog |
| Feb 23, 2026 | `src/components/clients/portfolio.tsx` — Wired: checkbox column in table view, Import button, ClientImportDialog, BulkActionBar (scan, report, status) |
| Feb 23, 2026 | `src/app/(dashboard)/leads/client.tsx` — Wired: Bulk Actions dropdown (status transition, archive, delete, enrich) on all filtered leads |
| Feb 23, 2026 | `src/components/settings/TeamManagementTab.tsx` — Wired: checkbox overlay on user cards, Import button, UserImportDialog, BulkActionBar (role, deactivate, reset onboarding) |
| Feb 23, 2026 | `src/components/tasks/task-queue-client.tsx` — Wired: Select mode toggle, checkbox list view (swaps DnD), BulkActionBar (close, unassign) |

## Completed Work Log

| Date | Commit | Item |
|------|--------|------|
| 2026-02-23 | be27179 | Client Portal Activation — portalToken field added to ClientProfile schema (db push), three .disabled files renamed to live routes: portal/page.tsx, generate-portal-token/route.ts, send-portal-invite/route.ts |
| 2026-02-23 | be27179 | Sprint 6 Reporting Pipeline — reportDeliveryDay + reportDeliveryEmails on ClientProfile, sentAt on ClientReport, sendReportEmail() in email lib, deliver-reports cron (daily, matches per-client day), reports/schedule/ API (GET+PATCH), ReportSchedulePanel UI component, vercel.json cron entry |

| Date | Commit | Item |
|------|--------|------|
| 2026-02-23 | ce04740 | Security Hardening Sprint 1 — TOTP/2FA (totp.ts, /api/auth/totp/ routes, login page MFA wiring), rate limiting (rate-limit.ts), CSRF protection (csrf.ts), security headers in next.config.mjs |
| 2026-02-23 | ce04740 | Sentry error monitoring — sentry.client/server/edge.config.ts, src/lib/sentry.ts, user context injection, PII scrubbing, session replay on error |
| 2026-02-23 | ce04740 | Structured logging — src/lib/logger.ts (log.info/warn/error), cron routes migrated off console.log |
| 2026-02-23 | e762287 | AI Universal Search (Cmd+K) — two-phase local+AI, wired to DashboardLayoutClient |
| 2026-02-23 | 2ebdefb | Vendor Flexibility Architecture — provider interfaces for Wave/GoDaddy/Resend, TENANT_REGISTRY providers block |
| 2026-02-23 | 92b2629 | Task→Invoice auto-generation — website_deployment→deployed fires Wave invoice |
| 2026-02-23 | a6d8108 | pick() readonly tuple TypeScript fix |
| 2026-02-23 | 17fceb6 | Tutorial sardonic voice rewrite + overlap fix |
| 2026-02-23 | e953ef3 | VAULT-001 — shared file version warning banner + download toast on open/download |
| 2026-02-23 | 9bd8cad–e86d677 | Ops Layer Sprint 0 — alert engine, DataSourceStatus, notification model, recurring task framework, schema migration |
| 2026-02-23 | 9bd8cad–e86d677 | Ops Layer Sprint 1 — execution spine: checklists, recurring tasks, alert→task links |
| 2026-02-23 | 9bd8cad–e86d677 | Ops Layer Sprint 2 — SiteHealthSnapshot cron + API + tab + alert rules |
| 2026-02-23 | 9bd8cad–e86d677 | Ops Layer Sprint 3 — GBP snapshot system + AI post drafting + alert rules |
| 2026-02-23 | 9bd8cad–e86d677 | Ops Layer Sprint 4 — cluster approval workflow + ApprovalModal + staleness monitoring + deployment task automation |
| 2026-02-23 | 9bd8cad–e86d677 | Ops Layer Sprint 5 — AI report narratives (6 parallel AI calls, voice-profile tone-matching, report_narrative AIFeature) |
| 2026-02-23 | c84a1aa | BACKLOG full reconciliation — 30+ items audited against git history + past chats |
| 2026-02-22 | f5fcb3f | Commission validation end-to-end — cron triggered, transactions verified, Apex North test client deleted |
| 2026-02-22 | f9e8bcf | Wave historical invoice import script (scripts/import-wave-history.ts) |
| 2026-02-22 | 153205e | Basecamp OAuth integration |
| 2026-02-22 | 0a97fad | I4 GBP OAuth code complete — OAuth client, Business Profile APIs, test users, credentials vaulted. Pending Google approval. |
| 2026-02-22 | 8df9bd8 | FINANCE-001 — live financial overview: Wave bank balances + DB AR/AP, cash flow detail, recent transactions feed |
| 2026-02-22 | a586948 | COVOS multi-tenant infrastructure — *.covos.app wildcard DNS, tenant detection middleware, TENANT_REGISTRY |
| 2026-02-22 | afb4eba | Pipeline filter UX — fixed dateRange bug, removed 4 ghost filters, localStorage persistence, active count badge |
| 2026-02-22 | afb4eba | Voice/micro-copy layer — per-column sardonic empty states, zero-results banner with clear-all CTA |
| 2026-02-22 | 817b9d5 | ITEM-003 — per-page Driver.js tutorials for Leads, Clients, Discovery, Content Studio |
| 2026-02-22 | 084a437 | AdminTask auto-creation on user creation — onboarding checklist auto-seeded |
| 2026-02-22 | 9d638c6 | Client churn (soft, with reason) + hard delete (admin only, name confirmation) |
| 2026-02-22 | d9bb3f3 | Client tabs — primary nav + grouped overflow "More" menu |
| 2026-02-22 | PAYMENTS-006 | Cron schedule change — generate-payments moved from 1st to 5th of month |
| 2026-02-22 | PAYMENTS-001 | Wave invoice.paid webhook handler + invoice-status-poll hourly fallback cron |
| 2026-02-22 | PAYMENTS-002 | Approval flow for payments — PaymentGroup section in ApprovalsTab, approve route, pending route |
| 2026-02-22 | PAYMENTS-003 | Contractor entity fields on User (contractorVendorId, contractorEntityName, contractorEmail) |
| 2026-02-22 | PAYMENTS-004 | Position system — Position model, seed (Owner/Manager/Sales Rep/Content Manager/SEO Specialist), PositionsTab CRUD |
| 2026-02-22 | PAYMENTS-005 | Generalized onboarding wizard — position-adaptive steps, sales (8 steps) vs ops/mgmt (6 steps), admin reset |
| 2026-02-22 | FINANCE-002 | Historical data sync script (scripts/import-wave-history.ts) — isHistorical flag, Jan 1 2026 cutoff |
| 2026-02-22 | FEAT-013 | GoDaddy parked domain search — DomainFinderSection, fuzzy match, GHM Parked badge, wired to ClientDomainsTab |
| 2026-02-21 | b759f42 | UX-001 — Client detail card tab architecture (13-tab layout, profile.tsx decomposed from 1057→489 lines) |
| 2026-02-21 | UX-002 | Content Studio + Website Studio promoted to top-level nav with StudioClientPicker, ?clientId= deep links |
| 2026-02-21 | UX-003 | Left nav smart group navigation — 5 collapsible groups, localStorage state, active route auto-expand |
| 2026-02-21 | UX-004 | Content Review merged into Tasks — Work tab + Approvals tab, URL sync, /review permanent redirect |
| 2026-02-21 | ITEM-004 | AI wrapper audit — voice-capture migrated to callAI(), voice_capture AIFeature + system prompt + cost tracking |
| 2026-02-21 | BUG-007 | Content Review quick approve sync fix — dual-query (ClientTask + ClientContent), approve routes to correct model |
| 2026-02-21 | BUG-008 | Completed tasks not removed from review — status string mismatch fixed (in-review → review), approve route hardened |
| 2026-02-21 | BUG-009 | Dashboard widget layout theme sync — confirmed theme-agnostic localStorage key, no fix needed |
| 2026-02-20 | 331ac9b | Phase A — Commission system foundation (lockedResidualAmount, tiered residuals, lock-at-close, upsell_commission, rolling 90-day close rate) |
| 2026-02-20 | 0e6c291 | Phase C — Commission dashboard UI (territory banner, My Book widget, close rate widget, CompensationConfigSection, My Earnings) |
| 2026-02-20 | b72fc37 | FEAT-010 — Rep dashboard (territory health, My Book projections, sales tools panel, needs-attention list) |
| 2026-02-20 | e613280 | FEAT-011 — Rep onboarding wizard (7-step, DB progress tracking, first-login redirect, admin reset) |
| 2026-02-20 | 56f8135 | FEAT-012 — Document Vault (4 spaces, upload, transfer, search, VaultFile schema, API routes) |
| 2026-02-20 | b62af2c | TeamFeed "Save to Vault" — file attachment in messages → vault via API |
| 2026-02-20 | f1ee8ae | Sales tools — audit PDF, live demo generator, digital brochure, comp sheet, territory map |
| 2026-02-20 | (session 6522f504) | Client onboarding portal (OnboardingToken-based) — 5-step wizard, auto-save, expiry UX, ops queue, submission detail |
| 2026-02-20 | 6058025–b04ae15 | API integrations I1–I6 — DataForSEO SERP, NAP citation scraper, GBP layer, report sections, audit enrichment |
| 2026-02-20 | (phase) | Wave payments W1–W6 — setup, schema, invoice AR cron, partner AP, dashboard UI, admin settings |
| 2026-02-19 | 03bf33b | Permission migration — 16 API routes to withPermission(), zero requireMaster() calls remaining |
| 2026-02-19 | 03bf33b | Task pipeline full build — schema, API, kanban UI, status transitions, history |
| 2026-02-19 | (phase 12) | Commission transaction engine — monthly cron, residuals + master fees, dashboard widgets (3 role views) |
| 2026-02-19 | (phase 11) | AI client layer — model router, complexity analyzer, cost tracker, system prompt builder, callAI(), ai_cost_logs |
| 2026-02-18 | 8d0622d | Content Studio collapsible panels with localStorage persistence |
| 2026-02-18 | (session e724a6f6) | Content Studio PPC ad copy generator — 3 Google Ads variants with character count validation |
| 2026-02-18 | (session e724a6f6) | Content Studio topic + keyword generator — unified Content Strategy panel |
| 2026-02-18 | (session e724a6f6) | Client portfolio sorting — A–Z, Z–A, MRR, health score, newest, oldest |
| 2026-02-18 | 81c2c1e | SCRVNR gate engine — voice alignment scoring, 54/54 tests passing |
| 2026-02-18–19 | (admin) | Admin role system — 3-tier hierarchy, isElevated(), ROLE_LABELS, AppRole type, role badges, profile refresh BUG-001 fix |
| 2026-02-18–19 | (admin) | Bug report system — POST/GET/PATCH routes, BugReportsTab (admin), auto-captures console + network errors |
| 2026-02-17 | 2abf973 | PWA manifest + push notifications — VAPID keys, service worker, PushSubscription table, settings toggles |
| 2026-02-17 | f61d299 | TeamFeed permanent collapsible sidebar — squeezes content, toggle in header, unread badge, localStorage state |
| 2026-02-17 | (phase 1–11) | Core platform — auth, client management, lead database, task system, competitive scanning, content review, reports, upsell detection, product catalog, analytics, client portal, email automation |
