# GHM DASHBOARD — MASTER STATUS
**Single source of truth for build progress. All other status files are archived.**
**Product vision and philosophy:** See `VISION.md` (updated February 21, 2026 — mandatory read for new instances).
**Last Updated:** February 28, 2026 — Sprint 27 Wave 1 Instance 1 complete: BUG-030 TeamFeed send button flex fix, BUG-031 dark mode accent warm amber, BUG-032 pipeline column dark mode headers, FEAT-037 new-lead-dialog.tsx + API wiring. TypeScript gate: 5 pre-existing errors, zero new. Also: Sprint 32 Wave 1 Instance 3 complete: 32-A SignatureEnvelope schema + prisma db push, 32-F/G/H tour configs, data-tour attrs added.

### SPRINT 28 TRACK A — Tenant Identity Extraction (February 27, 2026)
### SPRINT 30 — Tenant Branding + Resolution Hardening (February 27, 2026 — COMPLETE)

- [x] **Per-tenant logo serving** — `TenantConfig.logoUrl` field added. `/api/public/branding` returns `logoUrl`. Login page + nav both fetch and render dynamically. `public/logos/covos.png` placeholder created. GHM unchanged. Commit `e1949dc`.
- [x] **getTenant() hardened** — Unknown slugs, inactive tenants, localhost, and Vercel preview URLs all fall back gracefully to `TENANT_REGISTRY["ghm"]` with console warning. No crash path.
- [x] **Debug endpoint live** — `GET /api/debug/tenant` (admin-gated). Returns slug, companyName, dashboardUrl, hasDatabaseUrl, active, resolvedFrom. databaseUrl never exposed.
- [x] **Tenant resolution verified** — `covosdemo.covos.app/api/debug/tenant` returns `slug:"covosdemo"`, `hasDatabaseUrl:true`, `resolvedFrom:"covosdemo.covos.app"`. DB isolation confirmed.
- [x] **DNS fixed** — Removed `*.covos.app` wildcard from Vercel (unsupported on free tier). Added explicit `ghm CNAME cname.vercel-dns.com` in Namecheap. `covos.app` A record confirmed correct (`76.76.21.21`).



- [x] **getTenantPrismaClient() shipped** — `src/lib/tenant/server.ts`. Singleton cache, one PrismaClient per unique DB URL. Falls back to `DATABASE_URL` if `tenant.databaseUrl` is unset (zero behavior change for current tenant). TypeScript clean.
- [x] **TENANT_PROVISIONING.md written** — `docs/TENANT_PROVISIONING.md`. Full 8-step onboarding checklist, offboarding checklist, GHM→Easter migration path, technical notes.
- [x] **Second-tenant dry-run complete** — `covos-test` Neon DB created (same project, isolated database). `COVOS_TEST_DATABASE_URL` + `COVOS_TEST_DIRECT_URL` added to Vercel. Schema pushed via `prisma db push`. `covosdemo` added to TENANT_REGISTRY (commit `f5bdfad`). `covosdemo.covos.app` domain added to Vercel (wildcard CNAME in Namecheap resolved instantly). Redeploy successful. **covosdemo.covos.app is live and serving the correct isolated tenant.** "POWERED BY COVOS" footer confirmed. DB isolation verified.
- [ ] **Resend platform account** — Create COVOS Resend account, verify `covos.app` sending domain. **David manual — ~20 min.**
- [ ] **GCP OAuth app** — Create `COVOS Platform` GCP project, submit GBP OAuth app for Google review. **David manual — submit ASAP, review takes 1–3 weeks.**

### SPRINT 28 — COVOS Tenant Extraction (February 27, 2026)
- [x] **SPRINT 28 COMPLETE** — All ~50 runtime GHM hardcoded strings extracted from non-tenant layer. Commits: 315c3bd (Track A), 033562e (Track B), 6b487f9 (Track C), 986b9f2 (mop-up), 69a3508 (chore). Post-sprint full-codebase scan: clean. Only remaining GHM strings are in `src/lib/tenant/config.ts` registry values (correct by design). TypeScript: zero new errors across all tracks.
  - **What shipped:** TenantConfig extended with 6 new fields. Email/template/report/audit/work-order/AI-prompts/UI-components/public-pages all read from TenantConfig. `demo/template.ts`, root `layout.tsx`, and auth page alt text cleaned up in mop-up pass.
  - **Mop-up catches (not in original blueprints):** `src/lib/demo/template.ts` (parallel sibling to audit/template.ts), `src/app/layout.tsx` (root layout title), auth page logo alt text — all fixed.
  - **Sprint 29 is next.** Blueprint at `docs/blueprints/SPRINT29_GO_LIVE_BLUEPRINT.md`. Answer open questions I1–I5 before starting.

- [x] **TRACK A COMPLETE** — Extracted all hardcoded GHM strings from 5 target files into `TenantConfig`. Zero behavior change for GHM tenant. Blueprint: `docs/blueprints/SPRINT28_TRACK_A_BLUEPRINT.md`.
  - **Step 1:** Extended `TenantConfig` interface with 6 new required fields (`companyName`, `companyTagline`, `fromEmail`, `fromName`, `supportEmail`, `dashboardUrl`) + updated GHM registry entry.
  - **Step 2:** `src/lib/email/index.ts` — removed `FROM_EMAIL`/`FROM_NAME` constants, added `tenant: TenantConfig` param to all 7 exported functions, replaced all hardcoded GHM strings with tenant fields.
  - **Step 3:** `src/lib/email/templates.ts` — removed `FROM_EMAIL` constant, added tenant param to 3 exported + 3 private functions, replaced copyright footers and support email.
  - **Step 4:** `src/lib/reports/template.ts` — added tenant param to `generateReportHTML`, replaced footer string.
  - **Step 5:** `src/lib/audit/template.ts` — added tenant param to `generateAuditHTML`, replaced all 6 GHM instances (cover logo, PPC mentions, CTA, disclaimer).
  - **Step 6:** `src/lib/pdf/work-order-template.tsx` — added tenant to props, replaced company name and footer. Updated `generate-work-order.ts` to thread tenant through.
  - **Callers updated:** 17 files total — all API routes and lib callers now pass tenant via `requireTenant()` (auth routes) or `TENANT_REGISTRY["ghm"]` (public/cron routes with TODO for multi-tenant resolution).
  - **Verification:** `tsc --noEmit` passes (only 5 pre-existing known errors in scripts/ and basecamp/). Zero GHM/ghmdigital/ghmmarketing strings remain in target files or API routes.
  - **Extra catch:** `src/lib/ops/notification-service.ts` — missed in blueprint's caller list, caught by tsc, fixed with `TENANT_REGISTRY["ghm"]`.
  - **Next:** Tracks B (AI/scan layer) + C (dashboard/auth layer) can now run in parallel.

### SPRINT 28 TRACK C — UI Components + Public Pages + Client Portal (February 27, 2026)
- [x] **TRACK C COMPLETE** — Extracted all hardcoded GHM strings from UI components, public-facing onboarding pages, and client portal. Zero new TS errors. Blueprint: `docs/blueprints/SPRINT28_TRACK_C_BLUEPRINT.md`.
  - **branding/route.ts:** Added `getTenant()` + `supportEmail` field to `/api/public/branding` response — now serves `companyName` and `supportEmail` to all client-side consumers.
  - **nav.tsx:** Fallback `<Image>` alt text replaced with `companyName ?? "Dashboard"` — fully dynamic, no GHM string remains.
  - **client-portal-dashboard.tsx:** Added `companyName` prop (default `"COVOS"`), replaced copyright footer.
  - **onboarding-panel.tsx:** Removed `"https://app.ghmdigital.com"` SSR fallback — component is `"use client"`, simplified to `window.location.origin`.
  - **brochure/page.tsx + comp-sheet/page.tsx:** Converted static `metadata` export to `generateMetadata()`, made page components `async`, injected `companyName` from `getTenant()`. 3 instances each replaced.
  - **territory-map/page.tsx:** Same pattern — already `async`, added `getTenant()` call, converted metadata, replaced 4 instances (title, description, hero eyebrow, footer). Territory/city/phase data untouched.
  - **welcome/[token]/page.tsx:** Added `supportEmail` state (default `"support@covos.app"`), `useEffect` fetches from `/api/public/branding` on mount. Threaded into `ConfirmationScreen` + `ErrorScreen` props. All 3 hardcoded `support@ghmdigital.com` instances replaced with dynamic `<a href>` links.
  - **Verification:** Zero matches for `ghmdigital|ghmmarketing|GHM Digital Marketing` across all 8 target files. `tsc --noEmit` — only 5 pre-existing known errors (scripts/basecamp). Zero new errors.
  - **Sprint 28 fully complete.** ~50 GHM hardcoded strings removed across Tracks A + B + C.

### COVOS EXTRACTION AUDIT — Phase 1 Complete (February 26, 2026)
- [x] **AUDIT COMPLETE** — Full tenant coupling analysis. Documents at `docs/blueprints/COVOS_EXTRACTION_AUDIT.md`.
  - **Category B (needs extraction):** ~50 runtime GHM references across 12 files. Fully catalogued with exact line numbers and replacement targets.
  - **TenantConfig gap analysis:** 6 new fields required (`companyName`, `fromEmail`, `fromName`, `supportEmail`, `dashboardUrl`, `aiContext`). Interface extension + updated ghm entry specified exactly.
  - **DB isolation:** Recommend separate Neon DB per tenant (Path A). `TenantConfig.databaseUrl` already designed for this. Single `getTenantPrismaClient()` helper = done.
  - **Infrastructure map:** Vercel project, Resend account, GCP project all need transfer/creation for COVOS entity. Wave/GBP/DataForSEO per-tenant (already correct).
  - **File collision map:** 4 non-overlapping tracks for parallel Cowork. Track A must complete first (defines interface), then B + C run simultaneously.
- [x] **SPRINT 28 BLUEPRINTS WRITTEN** — `docs/blueprints/SPRINT28_TRACK_A_BLUEPRINT.md`, `SPRINT28_TRACK_B_BLUEPRINT.md`, `SPRINT28_TRACK_C_BLUEPRINT.md`. Exact files, search-and-replace instructions, verification commands, commit messages. Ready for Cowork execution.
- [x] **SPRINT 29 BLUEPRINT WRITTEN** — `docs/blueprints/SPRINT29_GO_LIVE_BLUEPRINT.md`. Full infrastructure transfer runbook (Vercel, GitHub, Resend, GCP/GBP OAuth, Blob). DB isolation helper (`getTenantPrismaClient`). Second tenant dry-run checklist. `TENANT_PROVISIONING.md` spec. Open infra questions (I1–I5) documented.
- **4 open decisions** need David's answer before Sprint 28 starts (see Section 7 of audit doc).

### BUG-025 — Middleware auth redirect loop (February 24, 2026)
- [x] **BUG-025 COMPLETE** — All browser windows auto-navigating to `/manager` or `/sales` regardless of website. Root cause: `authorized()` callback in `auth.config.ts` treated any path not in `PUBLIC_PATHS` as protected, so the root path `/` and any marketing pages returned `false` for unauthenticated visitors (NextAuth redirect to `/login`) OR redirected logged-in users away from non-app pages to their dashboard. Fix: added `MARKETING_PATHS` array (`/`, `/about`, `/pricing`, `/contact`, `/privacy`, `/terms`) that always returns `true` without any redirect, checked before the `PUBLIC_PATHS` redirect logic. Also added `/auth` and `/public` to `PUBLIC_PATHS` to cover forgot-password and reset-password routes.
**Files modified:** `src/lib/auth/auth.config.ts`

### SPRINT 21-B — TeamFeed UX Overhaul (February 24, 2026)

**Audit findings addressed:**
- `TeamFeedPanel` never called `load()` on mount — messages never appeared on first open. Fixed with `useEffect` + `useCallback` load on mount.
- `ReactionRow` had dead `&& true` guard — cleaned.
- `AttachmentBlock` was duplicated between `TeamFeed.tsx` and `TeamFeedSidebar.tsx` — extracted to `TeamFeedAttachment.tsx`.

**Panel UX (Slack-grade open experience):**
- Auto-scroll to bottom on mount + on new messages via `scrollRef` + `scrollIntoView`
- Pinned messages extracted from scroll flow → collapsible banner strip above message list
- Compose always rendered at bottom — no toggle button, audience/priority collapsed until "⋯ Options" clicked
- Unread messages: scroll to first unread on open with floating "Jump to latest ↓" pill

**New features:**
- **SSE real-time** — `GET /api/team-messages/stream` replaces 30s polling. 5s DB poll, 25s heartbeat, 4.5min auto-close (under Vercel 5min cap, client reconnects). Instant updates.
- **@mentions** — inline `@name` autocomplete while typing (fuzzy match against users list), stored as `mentions JSON` on `TeamMessage`. Mentioned users receive targeted in-app notification + push regardless of audience setting. Mentions render highlighted in message body.
- **Edit message** — author can edit in-place via pencil icon. `PATCH /api/team-messages/[id]` with `content` body. `edited_at` timestamp stored, "edited" label shown in UI.
- **"Seen by X" read receipts** — hover timestamp shows popover with reader names + relative timestamps. Reads query includes `user.name` in GET response.
- **Search** — search input in panel header, `GET /api/team-messages?q=` against content + author name. Debounced 300ms. Clear button.

**Schema migration:**
- `prisma/migrations/20260224_teamfeed_sprint21b/migration.sql` — adds `edited_at TIMESTAMP(3)` + `mentions JSONB` to `team_messages`
- Run `prisma db push` or apply migration before deploying

**Files created:** `src/app/api/team-messages/stream/route.ts`, `src/components/team-feed/TeamFeedAttachment.tsx`, `prisma/migrations/20260224_teamfeed_sprint21b/migration.sql`
**Files modified:** `src/components/team-feed/TeamFeedSidebar.tsx` (full overhaul), `src/components/team-feed/TeamFeed.tsx` (mount fix + attachment extraction), `src/components/team-feed/TeamFeedMultimedia.tsx` (dead code cleanup), `src/app/api/team-messages/route.ts` (search + reader names), `src/app/api/team-messages/[id]/route.ts` (edit support + PATCH content), `src/app/api/team-messages/stream/route.ts` (new SSE route)
**TypeScript:** Zero new errors. Pre-existing 5 errors (scripts/basecamp/dotenv) unaffected.

### SPRINT 21-A — Bug Triage Batch (February 24, 2026)
- [x] **BUG-026 COMPLETE** — Forgot password email dead link + silent failures fixed. Root cause 1: reset URL path was `/reset-password` — page lives at `/auth/reset-password`. All generated links were 404s even if email arrived. Fixed to correct path. Root cause 2: `sendNotificationEmail` result was not checked — silent failures swallowed. Added explicit `emailResult.success` check with `console.error` logging so Vercel runtime logs surface Resend failures. **Remaining ops gate:** INFRA-001 (Resend domain verification) must be completed for email to actually deliver — DNS action, no code.
**Files modified:** `src/app/api/auth/forgot-password/route.ts`

- [x] **BUG-027 COMPLETE** — Goals widget hint text pointed to "Settings → General" after `CompensationTab` was extracted in UX-AUDIT-020 (Sprint 22). Fixed link to `/settings?tab=compensation` with updated label "Settings → Compensation".
**Files modified:** `src/app/(dashboard)/manager/page.tsx`

- [x] **BUG-028 COMPLETE (partial)** — Two failures in TeamFeed multimedia (Sprint 19 deliverables). Emoji fix: added `z-[200]` and `sideOffset={8}` to `EmojiPickerButton` PopoverContent — was rendering behind the TeamFeed panel overlay due to stacking context. GIF fix: added `z-[200]` and `sideOffset={8}` to GIF picker PopoverContent; added explicit error logging in `search()` callback to surface Tenor API failures in browser console. Note: `/api/gifs` route uses a fake Tenor demo key — identified as orphaned/broken. Active GIF path is `/api/gif-search` (uses real Tenor demo key `LIVDSRZULELA`) — this is what `TeamFeedMultimedia.tsx` calls. If GIFs still return no results in production, check Vercel runtime logs for Tenor API response and verify `TENOR_API_KEY` env var.
**Files modified:** `src/components/team-feed/TeamFeedMultimedia.tsx`

### SPRINT 20 — Data Migration & PM Import (February 24, 2026)
- [x] **FEAT-014 COMPLETE** — PM Data Migration Import system. One-time connect → scrape → preview → commit flow for migrating tasks and contacts out of external PM platforms into GHM. No ongoing integration — credentials cleared after import completes.
  - **Schema:** `PmImportSession` model added to Prisma schema (`prisma db push` applied). Tracks platform, encrypted credentials (cleared post-import), preview JSON, commit stats.
  - **Adapter layer:** `src/lib/pm-import/` — `TaskImportAdapter` interface + `ADAPTER_REGISTRY`. Six adapters: Basecamp (reuses existing `BasecampClient`), Asana (PAT + paginated REST), ClickUp (API token + teams/spaces/lists), Monday.com (GraphQL API), Trello (API key + token), CSV/XLSX (column-mapping import, reuses XLSX pattern from leads/import).
  - **API routes:** `POST /api/import/pm/connect` (validate creds, create session), `POST /api/import/pm/preview` (scrape all data, store server-side; supports multipart for CSV), `POST /api/import/pm/commit` (write tasks to ClientTask, resolve assignees by email/name, clear creds), `GET /api/import/pm/sessions` (history).
  - **Token bridge:** `GET /api/oauth/basecamp/token` — reads stored `AppSetting.basecamp_token` for Basecamp OAuth path.
  - **UI:** `DataImportTab` component — 5-step wizard (Platform → Connect → Preview → Import → Complete). Platform cards, OAuth auto-connect for Basecamp, drag-drop CSV upload, task preview table with row-level selection, client ID assignment, category override, completion screen.
  - **Settings wiring:** `data-import` tab added to Settings page (admin-only). `Database` icon from lucide-react. Tab trigger + content + `VALID_TABS` updated.
  - **TypeScript:** Zero new errors. Pre-existing 5 errors (basecamp/dotenv) unaffected.
**Files created:** `prisma/schema.prisma` (PmImportSession model + User relation), `src/lib/pm-import/types.ts`, `src/lib/pm-import/index.ts`, `src/lib/pm-import/adapters/{basecamp,asana,clickup,monday,trello,csv}.ts`, `src/app/api/import/pm/{connect,preview,commit,sessions}/route.ts`, `src/app/api/oauth/basecamp/token/route.ts`, `src/components/settings/DataImportTab.tsx`
**Files modified:** `src/app/(dashboard)/settings/page.tsx` (DataImportTab import, tab trigger, tab content, VALID_TABS)

### SPRINT 19 — Content Automation (February 24, 2026)
- [x] **FEAT-022 COMPLETE** — TeamFeed multimedia (Slack-grade). Full emoji picker (emoji-mart, dynamically imported) wired into compose box in both TeamFeed.tsx and TeamFeedSidebar.tsx. GIF search via Tenor API (`/api/gif-search`) with debounced search, 2-column grid preview, inline GIF rendering in messages via `InlineMedia`. Emoji reactions: `TeamMessageReaction` table already in schema and DB. `ReactionRow` component aggregates per-emoji with toggle-on-click, add-reaction button. Both the GET `/api/team-messages` query and replies sub-query updated to include `user.name` on reactions for tooltip display. `TeamFeedMultimedia.tsx` is the shared component barrel (EmojiPickerButton, GifPickerButton, ReactionRow, InlineMedia) — both feed variants import from it. TypeScript: zero new errors.
- [x] **FEAT-023 COMPLETE** — Stock photo library integration. `/api/stock-photos` route proxies Unsplash and Pexels (server-side API keys, both normalized to same `StockPhoto` shape). `StockPhotoPicker` component supports both dialog and inline modes, masonry grid layout, hover overlay with "Use Photo" + copy URL + view original, Unsplash attribution links, pagination via "Load more". Wired into Content Studio as a new "Stock Photos" tab (inline mode). Env vars: `UNSPLASH_ACCESS_KEY`, `PEXELS_API_KEY` — graceful "no keys" empty state shown if neither configured.
- [x] **FEAT-024 COMPLETE** — Client website audit. `WebsiteAudit` schema model added, `prisma db push` applied. `src/lib/audit/website-auditor.ts` orchestrates parallel analysis: PageSpeed Insights API (performance/accessibility/SEO/best-practices scores + CWV), meta tag extraction via HTML fetch + regex parse, SSL/mobile signals, sitemap/robots.txt checks, heading structure. Issues aggregated into Critical/Recommended/Optional severity tiers. `/api/clients/[id]/audit` POST (run new audit) + GET (list history). `WebsiteAuditPanel` component: URL input pre-populated from client profile, score ring display, issue list with severity badges, previous audit history with timestamp. Wired into client detail page as new "Audit" tab. Env var: `PAGESPEED_API_KEY` (free, public-use demo key used as fallback). TypeScript: zero new errors.
**Files created:** `src/app/api/stock-photos/route.ts`, `src/app/api/clients/[id]/audit/route.ts`, `src/lib/audit/website-auditor.ts`, `src/components/content/StockPhotoPicker.tsx`, `src/components/clients/website-audit/WebsiteAuditPanel.tsx`, `src/app/api/gifs/route.ts` (duplicate of gif-search, benign)
**Files modified:** `src/app/api/team-messages/route.ts` (reactions include user.name), `src/components/team-feed/TeamFeedMultimedia.tsx` (Gif→text label fix), `src/components/content/ContentStudioTab.tsx` (Photos tab), `src/components/clients/ClientDetailPage.tsx` (Audit tab), `prisma/schema.prisma` (WebsiteAudit model + ClientProfile relation), `.env.example` (UNSPLASH_ACCESS_KEY, PEXELS_API_KEY)


### SPRINT 18 — Analytics & Telemetry (February 25, 2026)
- [x] **UX-AUDIT-022 COMPLETE** — Settings IA: Team/Positions/Permissions consolidated into a single "Team" tab with an internal sub-section switcher (Members | Positions | Permissions). Positions section is admin-only. Permissions (PermissionManager) available to all elevated users. The three are now visually and architecturally unified — positions is the bridge between members and permissions. Outer settings tabs "positions" and "permissions" removed. TeamManagementTab now accepts `isAdmin` prop.
- [x] **FEAT-019 COMPLETE** — Dashboard usage analytics: `DashboardEvent` schema, `/api/analytics/events` POST route for client-side tracking, `/api/analytics/dashboard-usage` GET route (feature heatmap, top pages, DAU chart, per-user activity). `DashboardUsagePanel` component wired into analytics page (admin-only). `use-dashboard-event` hook for client-side fire-and-forget tracking.
- [x] **FEAT-020 COMPLETE** — COVOS owner telemetry: `src/lib/telemetry/covos.ts` with SHA-256 tenant hashing, privacy contract (no PII — only eventType + feature + tenant hash + count + day). `/api/cron/covos-telemetry` daily cron (5am UTC) aggregates yesterday's DashboardEvents by eventType+feature and ships anonymized batch to `COVOS_TELEMETRY_ENDPOINT`. Graceful degradation — no-ops if env var not set. `COVOS_TELEMETRY_ENDPOINT` and `COVOS_TENANT_SLUG` added to `.env.example`. Cron already in `vercel.json`.
- TypeScript: Zero new errors (5 pre-existing basecamp/dotenv errors unaffected).
**Files created:** `src/app/api/cron/covos-telemetry/route.ts`, `src/lib/telemetry/covos.ts` (was already there)
**Files modified:** `src/app/(dashboard)/settings/page.tsx`, `src/components/settings/TeamManagementTab.tsx`, `.env.example`


- [x] **FEAT-015 COMPLETE** — Full admin onboarding wizard expanded from 4 steps to 7. Steps: Welcome → Company → Branding (logo + 3-color system) → Team Setup (invite first user) → Client/Lead Import (CSV/Excel) → Integrations Checklist (live status badges) → Done. Wizard step persisted to `User.adminOnboardingStep` in DB so admin can resume after leaving. Every step skippable. Files: `src/components/onboarding/AdminSetupWizard.tsx`, `src/app/admin-setup/page.tsx`.
- [x] **FEAT-018 COMPLETE** — Login page tenant logo. `GET /api/public/branding` (no auth) returns logoUrl + companyName + brand colors. Login page fetches on mount, shows tenant logo with fallback to `/logo.png`. Files: `src/app/api/public/branding/route.ts`, `src/app/(auth)/login/page.tsx`.
- [x] **UX-AUDIT-012 COMPLETE** — 3-color branding system. Added `brandColorSecondary` + `brandColorAccent` to `GlobalSettings` schema (pushed to DB). BrandingTab updated with three color pickers (Primary/Secondary/Accent) + per-color reset buttons. Colors saved via existing `/api/admin/onboarding` PATCH. Files: `src/components/settings/BrandingTab.tsx`, `prisma/schema.prisma`.
- [x] **BrandThemeInjector COMPLETE** — Client leaf component that injects `--brand-primary`, `--brand-secondary`, `--brand-accent` as CSS custom properties on `:root`. Mounted in dashboard layout (already wired). Files: `src/components/branding/BrandThemeInjector.tsx`, `src/app/(dashboard)/layout.tsx` (import already present).
- [x] **Onboarding API extended** — `/api/admin/onboarding` GET + PATCH now handles `step` field for wizard progress persistence and all three brand color fields. Files: `src/app/api/admin/onboarding/route.ts`.
- TypeScript: Zero new errors (5 pre-existing basecamp/dotenv errors unaffected).

### SPRINT 16 + 16.5 — Admin Polish + Critical Bug Batch (February 25, 2026)
- [x] **FEAT-027 COMPLETE** — Logo nav: already implemented in prior sprint (Link href={dashboardHref} wrapping logo in nav.tsx). Confirmed working, cleaned from open items.
- [x] **FEAT-028 COMPLETE** — Bug report status feedback loop. Admin bug view now has inline Status + Priority selects per report. PATCH route fires in-app notification to submitter on status change. Non-admin users see "My Submissions" view at /bugs (own reports only, read-only status badge). GET route updated to allow non-admins with `mine=true`. Files: `bugs-page-client.tsx`, `api/bug-reports/[id]/route.ts`, `api/bug-reports/route.ts`, `bugs/page.tsx`.
- [x] **UX-AUDIT-015 COMPLETE** — Content Studio empty states: already handled in StudioClientPicker (context-aware empty states for no-clients and search-no-match). Confirmed, cleaned from open items.
- [x] **BUG-020 COMPLETE** — Forgot password flow. PasswordReset model added to Prisma schema + `prisma db push`. API routes: `/api/auth/forgot-password` (POST, generates token, sends email via Resend) + `/api/auth/reset-password` (POST, validates token, updates password). Pages: `/auth/forgot-password` + `/auth/reset-password`. "Forgot password?" link added to login page beneath password field.
- [x] **BUG-021 COMPLETE** — "Wave accounts" label hardcoded. Changed fallback in FinancialOverviewSection from `"Wave accounts"` → `"Connected accounts"`. Dynamic label already shown when accounts are returned by API.
- [x] **BUG-022 COMPLETE** — Territory showcase now DB-driven. Territories page converted from hardcoded static array to live Prisma query (`territory.findMany({ where: { isActive: true } })`). Real territory names/cities/states render; color defaults applied gracefully for fields the model doesn't have.
- [x] **BUG-023 COMPLETE** — Document vault three broken behaviors fixed: (1) Stale-copy warning removed — was firing erroneously on all clicks. (2) Preview-first: PDF/image files open in Dialog with iframe/img + secondary Download button; other types go straight to download. (3) Delete: three-dot menu now shows Delete for uploader + admins, confirmation dialog, `DELETE /api/vault/files/[id]` removes blob + DB record.
- [x] **BUG-024 COMPLETE** — Service catalog edit form blank fields. ProductDialog `useEffect` added to reset `formData` when `product` prop or `open` state changes. Edit now pre-populates all fields from the selected service.
- TypeScript: Zero new errors (5 pre-existing basecamp/dotenv errors unaffected).


- [x] **FEAT-025 COMPLETE** — Pipeline filter full Lead model expansion. Added `closeScore` (range slider), `wealthScore` (multi-select: Low/Medium/High/Very High — stored as string), `pitchAngle` (multi-select), `suppressionSignal` (existing), `distanceFromMetro` (range slider), `intelNeedsRefresh` (3-state toggle: All/Stale/Fresh), `mrr` (range slider), `arr` (range slider). Also wired into `client.tsx` filter logic with null-safe casting. `leads/page.tsx` Prisma select extended with `mrr`, `arr`, `pitchAngle`, `intelNeedsRefresh`, `closeScore`.
- [x] **FEAT-026 COMPLETE** — Pipeline Status section now collapsible (open by default, consistent with Quality Scores and Market Intelligence). Default visible top-bar reordered: Status, Assigned Rep, Territory, Sort — scores/intelligence in More Filters.
- [x] **UX-FEAT-001 COMPLETE** — Tier A/B/C buttons, Impact ≥ inline input, Close Likelihood ≥ inline input surfaced as primary visible controls. Intelligence posture strip (Zap icon) appears above the advanced panel when active filters are set. Market Intelligence section expanded with Wealth Score, Pitch Angle, Distance from Metro, Intel Status. New "Deal Value & Revenue" collapsible section for MRR/ARR/deal value sliders.
- TypeScript: Zero new errors (5 pre-existing basecamp/dotenv errors unaffected).
**Files:** `src/components/leads/lead-filter-bar-advanced.tsx`, `src/app/(dashboard)/leads/client.tsx`, `src/app/(dashboard)/leads/page.tsx`

### SPRINT 22 — UX Polish + Settings IA (February 25, 2026)
- [x] **BUG-017 COMPLETE** — Login dark mode flash on logout. Created `src/app/(auth)/layout.tsx` forcing `className="light"` at layout level before hydration. Login is always rendered in light mode regardless of user theme preference.
- [x] **BUG-018 COMPLETE** — Search bar `CtrlK` → `Ctrl+K`. Added `+` separator in `AISearchBar.tsx` kbd badge: `{modSymbol}+K`.
- [x] **BUG-019 COMPLETE** — TeamFeed enter icon too small. Replaced unicode `↵` with `<CornerDownLeft className="h-3 w-3 inline" />` in both `TeamFeed.tsx` and `TeamFeedSidebar.tsx`.
- [x] **UX-AUDIT-020 COMPLETE** — Settings IA: Commission Defaults + Monthly Goals extracted from General Settings into new `CompensationTab.tsx`. General Settings now contains only Appearance + Push Notifications. Compensation tab added as admin-only tab after General.
- [x] **UX-AUDIT-021 COMPLETE** — Tutorial restart global nav awareness. `OnboardingTutorial` moved from `sales/page.tsx` + `manager/page.tsx` to `DashboardLayoutClient` (global mount on every dashboard page). `window.restartTutorial` now always registered. Help menu "Restart Tutorial" works on any page.
**Files:** `src/app/(auth)/layout.tsx` (new), `src/components/settings/CompensationTab.tsx` (new), `src/components/search/AISearchBar.tsx`, `src/components/team-feed/TeamFeed.tsx`, `src/components/team-feed/TeamFeedSidebar.tsx`, `src/components/settings/GeneralSettingsTab.tsx`, `src/app/(dashboard)/settings/page.tsx`, `src/components/dashboard/DashboardLayoutClient.tsx`, `src/app/(dashboard)/layout.tsx`, `src/app/(dashboard)/sales/page.tsx`, `src/app/(dashboard)/manager/page.tsx`

### SPRINT 21 — Bug Fixes + UX Polish (February 24, 2026)
- [x] **BUG-014 COMPLETE** — Recurring Tasks "New Rule" crash. Root: `/api/checklist-templates` missing + no array guards. Fixed: created route (Prisma `taskChecklistTemplate.findMany({ where: { isActive: true } })`); added `Array.isArray()` guards to both fetch handlers in `recurring-task-form.tsx`.
- [x] **BUG-012 COMPLETE** — Territories Settings tab crash. Root: dynamic import of server component with `headers()` call inside client component. Fixed: import `TerritoriesClient` directly instead of the page wrapper.
- [x] **BUG-013 COMPLETE** — Custom permission preset 400 error. Root: validation array in `/api/users/[id]/permissions` missing `"custom"`. Fixed: added `"custom"` to allowed preset values.
- [x] **BUG-015 COMPLETE** — Wave settings broken UI when unconfigured. Fixed: added actionable setup prompt with env var names and Wave API docs link when `!status.connected`.
- [x] **BUG-016 COMPLETE** — Kanban column headings too bright in dark mode. Fixed: all 8 status heading colors changed from `dark:text-{color}-300` to `dark:text-{color}-400` in `src/types/index.ts`.
- [x] **UX-AUDIT-019 COMPLETE** — Permission manager embedded inline in Settings → Permissions tab. Removed "Open Permissions Manager →" link; `<PermissionManager />` now renders directly.
- [x] **UX-AUDIT-018 COMPLETE** — Integration health panel CTAs. Non-configured integrations show a "Configure ↗" button linking to provider API console. Configured integrations show per-row Refresh icon button. Renamed global button to "Refresh All".
- [x] **FEAT-030 COMPLETE** — Service catalog list/grid toggle. `LayoutList`/`LayoutGrid` button pair persisted to `localStorage`. Grid renders compact 1–3 column responsive cards with name, category badge, active/inactive badge, price, and truncated description.
- [x] **FEAT-031 COMPLETE** — Role-aware suggested tasks in New Task dialog. Quick-add chip bar above Title field; 4–5 curated suggestions per role (admin/manager/sales). Clicking a chip populates title + sets category via DOM querySelector.
- [x] **FEAT-032 COMPLETE** — File uploads optional Display Name field. Added `display_name` column to `vault_files` (schema + `prisma db push`). Upload dialog shows Display Name input after file is selected. Tile renders `displayName ?? name`. Search also covers displayName. `VaultFileRecord` type updated.
**Files:** `src/app/api/checklist-templates/route.ts` (new), `src/components/tasks/recurring-task-form.tsx`, `src/app/(dashboard)/settings/page.tsx`, `src/app/api/users/[id]/permissions/route.ts`, `src/components/settings/WaveSettingsTab.tsx`, `src/types/index.ts`, `src/components/permissions/permission-manager.tsx` (inline embed), `src/components/settings/IntegrationsTab.tsx`, `src/components/products/product-catalog.tsx`, `src/components/tasks/task-queue-client.tsx`, `src/app/api/vault/upload/route.ts`, `src/components/vault/vault-upload-button.tsx`, `src/components/vault/vault-file-tile.tsx`, `src/components/vault/vault-client.tsx`, `prisma/schema.prisma`

### SPRINT 14 — UX Polish Batch (February 24, 2026)
- [x] **FEAT-029 COMPLETE** — Full rename of `master` → `manager` role across entire codebase. DB enum migrated live (`ALTER TYPE`), Prisma regenerated, 87+ files updated, `/master` route directory renamed to `/manager`, all redirect/revalidate strings updated, preset names `master_lite/full` → `manager_lite/full`. TypeScript reports zero FEAT-029 errors. Pre-existing script errors (basecamp/dotenv) unaffected.
**Files:** All `src/` .ts/.tsx except calculations; `prisma/schema.prisma`; `src/app/(dashboard)/manager/` (renamed from master)
**Preserved intentionally:** `master_fee` payment type, `masterFeeEnabled/Amount`, `masterManagerId` Prisma field names, `masterManagerFee` settings key
- [x] **UX-AUDIT-013 COMPLETE** — Global dialog/modal style audit. Base components upgraded (`dialog.tsx`, `sheet.tsx`, `alert-dialog.tsx`) — all 30+ consumers inherit. Backdrop blur, accent top border, improved close button, header separator, footer gap tightening.
- [x] **UX-AUDIT-016 COMPLETE** — Tooltip vs tour tip visual differentiation. New `InfoTip` component (subdued, info-only). `TourButton` updated to accent primary style (filled, signals guided interaction). JSDoc design system notes on both.
- [x] **UX-AUDIT-017 COMPLETE** — Bulk actions configurable volume. Split-button enrich with DropdownMenu preset picker (25/50/100/All + ⚠ cost warning). Bulk Actions count also configurable (25/50/100/200/All). `resolvedCount()` helper. Hardcoded 50/200 integers eliminated.
- [x] **UX-BUG-002 COMPLETE** — Search bar inline trigger upgraded to layout-aware `flex-1` bar with `max-w-sm` cap. Fills space between nav and TeamFeedToggle. Also resolves UX-BUG-001 (click-outside dismiss already handled by overlay).
**Files:** `src/components/ui/dialog.tsx`, `src/components/ui/sheet.tsx`, `src/components/ui/alert-dialog.tsx`, `src/components/ui/info-tip.tsx` (new), `src/components/tutorials/TourButton.tsx`, `src/app/(dashboard)/leads/client.tsx`, `src/components/search/AISearchBar.tsx`



### SPRINT 13 — Bug Triage (February 24, 2026)
- [x] **BUG-010 FULLY RESOLVED** — Vercel Blob store (`ghm-marketing-blob`, IAD1, Public) created and connected to project. `BLOB_READ_WRITE_TOKEN` now active in all environments (Development, Preview, Production). Token pulled locally via `vercel env pull`. Logo upload is live. Graceful fallback code retained for future token expiry edge cases.
- [x] **BUG-010 secondary fix** — `<meta name="apple-mobile-web-app-capable">` deprecation warning resolved. Added `mobile-web-app-capable` sibling in `src/app/layout.tsx`.
- [x] **BUG-011 fixed** — Admin wizard steps 1 and 2 now have "Skip for now — finish in Settings → Branding" links. `handleSkip` saves partial branding data without stamping `adminOnboardingCompletedAt`. Done screen explains re-entry path (Settings → Branding).
- [x] **UX-AUDIT-004 fixed** — Dashboard layout flash on return navigation. `RefreshOnFocus` now debounces: skips `router.refresh()` if focus fires within 2 seconds of a route change. Prevents master dashboard grid and sales dashboard from re-rendering on every back-navigation from `/leads`, `/clients`, etc.
**Files:** `src/components/onboarding/AdminSetupWizard.tsx`, `src/app/layout.tsx`, `src/components/dashboard/refresh-on-focus.tsx`, `BACKLOG.md`
**Pending manual action:** Vercel Blob store provisioning (5 min) — see BUG-010 in BACKLOG.md for exact steps.

### SPRINT 12 — Route/Button/Permission Audit ✅ COMPLETE (February 24, 2026)
- [x] **Full route inventory** — All `src/app/(dashboard)/` pages mapped to their permission gates. Documented in `docs/ROUTE_AUDIT.md`.
- [x] **/bugs permission gap fixed** — Page was a bare client component with no server gate. Extracted `BugsPageClient` to `src/components/bugs/`, replaced page with server wrapper calling `requirePermission("manage_settings")`. Also fixed silent data bug: API returns `{ data: [] }` not `{ bugs: [] }`.
- [x] **/territories permission gap fixed** — Same pattern. Extracted `TerritoriesClient` to `src/components/territories/`, server wrapper calls `requirePermission("manage_territories")`.
- [x] **/payments permission gap fixed** — Page had no top-level permission check. Added `requirePermission("view_payments")`. Replaced raw `role === "admin"` string with `isElevated(role ?? "")`.
- [x] **/api/bug-reports GET — admin-only → isElevated** — Master-role users were blocked from viewing bug reports. Fixed to `isElevated(user?.role ?? "")`.
- [x] **/master isOwner stale ID fixed** — `[1, 2].includes(...)` → `Number(user.id) === 1`. Seed user id=2 deleted Feb 22.
- [x] **Zero new TypeScript errors** — Pre-existing basecamp/dotenv script errors unaffected.
**Files:** `src/app/(dashboard)/bugs/page.tsx`, `src/components/bugs/bugs-page-client.tsx`, `src/app/(dashboard)/territories/page.tsx`, `src/components/territories/territories-client.tsx`, `src/app/(dashboard)/payments/page.tsx`, `src/app/api/bug-reports/route.ts`, `src/app/(dashboard)/master/page.tsx`, `docs/ROUTE_AUDIT.md`
**Open items from audit:** /tasks API mutation routes not verified; /territories API mutations not verified; /discovery page not audited; nav visibility vs. route protection not cross-referenced. See ROUTE_AUDIT.md §4–6.

### SPRINT 11 — Context-Aware Empty States ✅ COMPLETE (February 24, 2026)
- [x] **Leads pipeline** — 3-state empty logic: (1) no leads anywhere → "pipeline is empty" + CTA to import or go to Discovery; (2) filters active + no results → "X leads exist, try broadening" + clear-all link; (3) no filters active but no leads visible → neutral "no leads in this view" (territory/assignment context).
- [x] **Client portfolio** — "No clients" state upgraded with first-action links to Pipeline and Discovery. "No matches" state now shows the actual client count so the user knows data exists but is filtered.
- [x] **Discovery dashboard** — Pre-search first-visit state added ("Ready to find leads" + explanation of quality scores and CSV option). Post-search no-results state cleaned up: removed bullet list, replaced with a single prose sentence, added emoji treatment matching other pages.
- [x] **Zero new TypeScript errors** — pre-existing basecamp/dotenv script errors unaffected.
**Files modified:** `src/app/(dashboard)/leads/client.tsx`, `src/components/clients/portfolio.tsx`, `src/components/discovery/discovery-dashboard.tsx`

### SPRINT 10 — Lead Filter Bar Presentation Overhaul ✅ COMPLETE (February 24, 2026)
- [x] **Active filter chips** — `buildActiveChips()` helper generates dismissible chips for every active filter dimension (all 18 filter fields, not just statuses/dateRange/priorityTiers/marketTypes). Chips row appears below controls when any filter is active; each chip has an inline X to remove just that filter.
- [x] **Filters button redesign** — "More/Less" replaced with `SlidersHorizontal` icon + "Filters" label + active count badge. Badge always shows regardless of saved search state. Chevron indicates open/close.
- [x] **Advanced panel reorganized** — 3 clearly labeled sections: Pipeline (status + date range + priority tiers + deal value + days in stage + lead source), Quality Scores (collapsible, 5 sliders + website/email toggles), Market Intelligence (collapsible, market type checkboxes). Dense nested Collapsible/CollapsibleTrigger pattern replaced with simple button toggles + conditional render.
- [x] **Saved search affordance unified** — Bookmark icon shows whenever `hasActiveFilters` OR saved searches exist (not gated on `savedSearches.length > 0`). "Save current filters…" always appears in dropdown when filters are active. Removed redundant standalone "Save" button.
- [x] **Zero new TypeScript errors** — pre-existing basecamp/import-wave-history script errors unaffected.
**Files modified:** `src/components/leads/lead-filter-bar-advanced.tsx`
**Removed imports:** `Collapsible`, `CollapsibleContent`, `CollapsibleTrigger`, `Filter` (replaced by `SlidersHorizontal`)

### SPRINT 9 — Admin Infrastructure ✅ COMPLETE (February 24, 2026)
- [x] **Import visibility fix** — `CSVImportDialog` on `/leads` moved outside master-only guard; now visible to admin + master. Discovery page gets "Import from CSV" card. Enrich/Bulk Actions/territory filter guards updated to admin|master.
- [x] **Admin = master elevation** — `isElevated()` applied consistently: root redirect (`page.tsx`), work orders GET, team-messages pin permission, dashboard layout `isMaster` prop. Admins now access all master-level features.
- [x] **Branding system (9C)** — `POST/DELETE /api/settings/branding` (logo upload/delete via Vercel Blob). `BrandingTab` component (logo drag-drop, company name/tagline, brand color picker). Settings page Branding tab wired (admin-only). Dashboard layout fetches `logoUrl`+`companyName` from `GlobalSettings` and passes to nav. Nav shows custom logo with `/logo.png` fallback.
- [x] **Admin first-run wizard (9B)** — 4-step flow (Welcome → Company → Branding → Done) at `/admin-setup`. `GET/PATCH /api/admin/onboarding` routes. Dashboard layout redirects admin without `adminOnboardingCompletedAt` to wizard on first login. Finish marks completion, redirects to `/master`.

---

### SPRINT 8 — Content Power ✅ COMPLETE (February 24, 2026)
- [x] **8A — Bulk Content Operations** — Multi-select UI on ContentList, bulk action bar (Approve/Archive), `POST /api/content/bulk` route. Master+ only. `isMaster` prop threaded from page → profile → ContentStudioTab → ContentList.
- [x] **8B — Competitor Tracking** — `CompetitorsTab` component with add/remove/refresh-scan UX. `GET/POST /api/clients/[id]/competitors`, `DELETE /api/clients/[id]/competitors/[cid]`. "Competitors" added to profile Overflow tab group under Operations.
- [x] **8C — Custom Report Builder** — Report dialog extended with 8-section toggle grid, AI Executive Summary switch, Client-Facing Mode switch. All params passed to existing `/api/reports/generate` endpoint.

---

## 🗓️ SPRINT PLAN — February 22, 2026

## 🗓️ SPRINT PLAN — February 22, 2026

### SESSION — Commission Validation Prep + Client Lifecycle (February 22, 2026)
- [x] **DB cleanup** — Deleted seed accounts Alex Johnson (id=2) and Sarah Chen (id=3). Zero real data attached. User roster is now David/Gavin/Arian/TestAccount only.
- [x] **BUG: Master Manager dropdown excluded admins** — `client-compensation.tsx` filter was `role === 'master'` only. Fixed to `role === 'master' || role === 'admin'`. David now appears in dropdown.
- [x] **BUG: getEffectiveFee hardcoded userId=2 as owner** — was `[1, 2].includes(userId)` → fixed to `userId === 1` (David only). Alex was already deleted but logic was wrong regardless.
- [x] **FEAT: Churn client with notes** — `churnedAt` + `churnReason` added to ClientProfile schema (db push complete). PATCH route handles churn stamping + auto-cancels all pending/approved PaymentTransactions on churn. Edit dialog shows churn reason textarea when status switches to Churned. Churn is a soft status change — record preserved.
- [x] **FEAT: Hard delete client** — DELETE `/api/clients/[id]` (admin only). Cascades ClientProfile + parent Lead. Edit dialog has destructive "Delete Client" button (admin only) behind AlertDialog requiring exact business name confirmation to activate.

### COVOS MULTI-TENANT INFRASTRUCTURE — ✅ COMPLETE (February 22, 2026)
- DNS: covos.app wildcard (*.covos.app) → Vercel, ghm.covos.app registered
- Vercel: wildcard + ghm subdomain added to ghm-marketing project, both verified
- `src/lib/tenant/config.ts` — TenantConfig interface, TENANT_REGISTRY (ghm), getTenantFromHost()
- `src/lib/tenant/index.ts` — public module exports + TENANT_HEADER constant
- `src/lib/tenant/server.ts` — getTenant() + requireTenant() for Server Components/API routes
- `src/hooks/use-tenant.ts` — useTenant() hook for client components
- `src/middleware.ts` — layered: tenant detection first (injects x-tenant-slug header, rejects unknown subdomains), auth second
- `.env.local` + `.env.example` + Vercel env — ROOT_DOMAIN="covos.app"
- Build verified: 120/120 pages, zero errors
- New client onboarding: add slug to TENANT_REGISTRY in config.ts, DNS handles the rest

### SPRINT 1 — Launch Readiness (~4 hrs) ← DO FIRST
Items blocking confident client and rep handoff.
- [x] Commission validation — validated via Apex North LLC test client. Cron generated residual ($200, Arian) + master_fee ($240, David), both pending, no Wave calls. Engine confirmed correct. Test client hard-deleted post-validation.
- [ ] W7 — verify Wave covers Gusto use cases, cancel Gusto
- [x] ITEM-001 docs — `CLIENT_AGREEMENT.md` created (§1.1 includes full PPC/Ads scope language, separate ad spend clarification, account ownership); `CLIENT_ONBOARDING_FORM.md` created (Google Ads Account ID field, manager access, budget, campaign start); report PDF template Ads section was already complete.
- [x] D4 — Audit → Demo one-click: `handleGenerateAll` + `generatingAll` state + "Audit + Demo" button (variant="default", Zap icon) added to lead-detail-sheet.tsx. Opens audit + 500ms delayed demo in two tabs simultaneously.

### SPRINT 2 — Personnel System (~6 hrs) ✅ COMPLETE
Required before first operations hire.
- [x] PAYMENTS-004 — Position model (schema, seed: Owner/Manager/Sales Rep/Content Manager/SEO Specialist, Settings UI tab)
- [x] PAYMENTS-005 — Generalize onboarding wizard to all position types; steps adapt by positionType (sales vs ops/management); contractor entity step for all
- [x] PAYMENTS-003 UI — Contractor entity fields (vendor ID, entity name, email) in Team settings; Add User dialog with position picker + auto-temp-password; Reset Onboarding button (admin); `/api/users/[id]/onboarding-reset` POST route

### SPRINT 3 — Operations Intelligence (~5 hrs)
Portfolio-level visibility as team and client base grow.
- [x] AdminTask model — schema + db push + `POST /api/users` auto-creates onboarding checklist task on user creation
- [x] Client health overview — table: healthLabel badge + score/100 + scan overdue indicator; cards: label-first badge + score/100
- [x] TeamFeed "Save to Vault" — confirmed complete (`/api/vault/transfer` fully implemented; wired in TeamFeed + Sidebar)
- [x] I4 GBP — OAuth client created (GHM Marketing GCP project), Business Profile APIs enabled, credentials vaulted + deployed. Testing mode with David + Gavin as test users. Ready to connect real client GBP accounts.

### ✅ VENDOR-001: Vendor Flexibility Architecture (February 23, 2026)
11 new files under `src/lib/providers/`. Types, registry, Wave/GoDaddy/Resend adapters. TenantConfig `providers` block. Zero new TS errors.

### ✅ FINANCE-003: Task → Invoice Auto-Generation (February 23, 2026)
When a `website_deployment` task transitions to `deployed`, Wave invoice auto-creates + sends. Non-blocking fire-and-forget hook. Idempotent via `InvoiceRecord.sourceTaskId`. Shared `getSeoProductId()` utility extracted.
- `src/lib/wave/product-id.ts` — shared product ID resolver
- `src/lib/tasks/invoice-hook.ts` — `maybeAutoGenerateDeploymentInvoice()`
- `prisma/schema.prisma` — `InvoiceRecord.sourceTaskId Int?` added + db pushed
- `src/app/api/tasks/[id]/transition/route.ts` — hook wired post-transaction


- [x] GbpSnapshot schema + migration — 30-day rolling aggregates: searchViews, mapViews, clicks, reviewCount, reviewAvg, newReviews, previousSearchViews delta
- [x] GBP snapshot cron — `/api/cron/gbp-snapshot` weekly Mon 4am UTC; skips no-connection clients; feeds alert engine; updates DataSourceStatus
- [x] Snapshot API — `/api/clients/[id]/gbp/snapshots` (paginated history) + `/latest` (with computed deltas)
- [x] AI GMB post drafting — `/api/clients/[id]/gbp/draft-post`; reads VoiceProfile; 150-300 char GBP post; update/offer/event types
- [x] LocalPresenceTab extended — Trends tab (6 KPI cards + LineChart from snapshot history); AI Draft button → AIDraftModal → pre-fills CreatePostModal
- [x] 5 alert rules seeded — review avg <4.0 (critical), zero new reviews, search views -25%, keyword lost top 3, keyword entered top 3 (info)
- [x] AlertSourceType extended with "gbp" + "rankings" in alert-engine.ts
- [x] vercel.json — gbp-snapshot cron wired (0 4 * * 1 — Monday 4am UTC)

### ✅ SPRINT 4 — Intelligence Layer (February 24, 2026)
Portfolio analytics: trend visibility + churn early warning + health trajectory.
- [x] **4A — MoM/YoY Trend Charts** — `src/lib/analytics/intelligence.ts` core lib: `buildMonthlyTrend()` computes MRR, active clients, new/churned, avg health score per month. API route `GET /api/analytics/trends`. `IntelligenceTrends` component: 4 recharts charts (revenue, clients, new vs churn bar, avg health). Wired into `/analytics` page.
- [x] **4B — Churn Risk Scoring** — `computeChurnRisk()` runtime engine: 4 factors (overdue scan +25, payment not current +30, declining health trend +25, no recent tasks +20). Labels: low/medium/high/critical. API `GET /api/clients/churn-risk`. `ChurnRiskBadge` component with tooltip breakdown. Client-side `computeClientChurnRisk()` for portfolio cards. Badges wired into card view + table Risk column.
- [x] **4C — Health Trajectory Sparklines** — `buildHealthTrajectory()` + `buildSparklinePath()` in intelligence lib. `HealthSparkline` inline SVG component (80×24px, delta indicator, tooltip). `HealthTrajectoryChart` full recharts chart for detail page. Sparkline data computed server-side in clients page, passed to portfolio. Wired into card footer.
- [x] **TypeScript clean** — All Sprint 4 errors resolved: `requirePermission` pattern corrected for API routes, `churnedAt` added to analytics page select, recharts formatter types fixed. Zero Sprint 4 errors (pre-existing scripts/basecamp errors unrelated).

**Files created:** `src/lib/analytics/intelligence.ts`, `src/app/api/analytics/trends/route.ts`, `src/app/api/clients/churn-risk/route.ts`, `src/components/analytics/intelligence-trends.tsx`, `src/components/clients/churn-risk-badge.tsx`, `src/components/clients/health-sparkline.tsx`
**Files modified:** `src/app/(dashboard)/analytics/page.tsx`, `src/app/(dashboard)/clients/page.tsx`, `src/components/clients/portfolio.tsx`

### SPRINT 5 — AI Report Narratives ✅ COMPLETE (February 23, 2026)
AI-generated narrative paragraphs embedded in client monthly reports, voice-profile tone-matched, zero new TypeScript errors.
- [x] `src/lib/reports/ai-narrative.ts` — 6 parallel AI narrative calls (executive summary, ranking changes, site health, GBP performance, competitive positioning, recommended next steps); `Promise.allSettled` for resilience; voice profile tone-matching; all routed through `callAI()`
- [x] `src/lib/reports/generator.ts` — `includeNarratives` option added; VoiceProfile fetched from DB; `generateAINarratives()` called after section data is assembled
- [x] `src/lib/reports/template.ts` — narrative callout blocks (`<div class="narrative">`) rendered after metric grid (executive summary), in Rankings, Citations, GBP sections; standalone "Recommended Next Steps" section before footer
- [x] `src/app/api/clients/[id]/reports/generate/route.ts` — per-client on-demand report generation (D3); supports monthly/quarterly/annual; `includeNarratives: true`; persists `ClientReport` record
- [x] `src/lib/ai/router/types.ts` + `src/lib/ai/client.ts` — `report_narrative` added to `AIFeature` union + `DEFAULT_MAX_TOKENS` (1,000)
- [x] `src/lib/ai/context/system-prompt-builder.ts` — `report_narrative` case added with plain-text output contract
- [x] `prisma/seed-sprint5-reports.ts` — seeded: `TaskChecklistTemplate` (Monthly Client Report, 7 items, id=2) + `RecurringTaskRule` (1st of month 9am, id=1, next run 2026-03-01)

### SPRINT 4 — Cluster Manager ✅ COMPLETE (February 23, 2026)
Approval workflow on existing Website Studio. No new domain tables — governance added to existing BuildJob pipeline.
- [x] cluster-approval.ts — evaluateBuildJobApproval() auto-transitions BuildJob to "approved" when all pages approved; createDeploymentTask() auto-creates ClientTask(website_deployment) with checklist; approveAllClearedPages() bulk approval; checkWebPropertyStaleness() staleness monitor
- [x] PATCH /api/website-studio/[clientId]/pages/[pageId]/review — single-page approve/reject/SCRVNR-override (requires overrideNote for failed pages)
- [x] POST /api/website-studio/[clientId]/approve-all — bulk approve all SCRVNR-cleared pages, triggers job evaluation
- [x] GET /api/website-studio/[clientId]/pages?jobId= — new list route for ApprovalQueue component
- [x] ApprovalQueue.tsx — Pending Review panel: per-page SCRVNR scores (P1/P2), approve/reject/override per page, bulk "Approve All Cleared" with confirmation, reviewer note field, SCRVNR failure detail expansion, auto-close on job transition
- [x] WebsiteStudioTab — approval view mode wired; BuildQueue "Review Pages" button navigates to ApprovalQueue view
- [x] website_deployment TaskChecklistTemplate seeded (6 items: DNS, SSL, GA, Search Console, client approval, go-live notification)
- [x] website_stale AlertRule seeded (sourceType: health, 7-day cooldown)
- [x] daily-scans cron extended — checkWebPropertyStaleness() runs daily, feeds alert engine for overdue sites
- [x] Zero new TypeScript errors

### SPRINT 4 — Platform Polish (~4 hrs)
Makes the platform feel like a product.
- [x] ITEM-003 — Per-page tutorials using Driver.js — DONE Feb 22, 2026. See files below.
- [x] Pipeline filter UX refinement — DONE Feb 22, 2026. Fixed dateRange filter (was broken — missing updatedAt in data + no filter logic); removed 4 ghost UI filters (municipalMismatch, isChain, isFranchise, isCorporate — fields don't exist in DB); added localStorage filter persistence; fixed active filter count badge; deleted dead lead-filter-bar.tsx.
- [x] Voice/micro-copy layer — DONE Feb 22, 2026. Added per-column sardonic empty state messages; zero-results banner with clear-all CTA.

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
| W7. Kill Gusto | ⏸ DEFERRED — Jan 2027. Gavin is W-2/2% shareholder in Gusto; mid-year migration creates split W-2. Plan: close 2026 on Gusto, migrate to Wave Payroll Jan 2027 alongside equity restructure. Arian + future reps are 1099 handled via dashboard → Wave bills, no Gusto needed. |

### API Integration Ecosystem — SPEC COMPLETE, READY TO BUILD
**Spec:** `D:\Work\SEO-Services\specs\API_INTEGRATION_BLUEPRINT.md` (1,124 lines)
**Effort:** ~56 hours | **Priority:** HIGH — completes intelligence engine, eliminates BrightLocal

| Sprint | Tasks | Hours | Status |
|--------|-------|-------|--------|
| I1. Provider Refactor + Cache | Extract providers, shared cache + cost tracking | 6 | ✅ DONE |
| I2. DataForSEO SERP | Local rank tracking, Keywords tab, rank clusters | 12 | ✅ DONE |
| I3. NAP Citation Scraper | 35 directory adapters, Citations tab, health sentry | 10 | ✅ DONE |
| I4. Google Business Profile | OAuth, reviews, insights, posts, Local Presence tab | 8 | ✅ DONE — GHM Marketing GCP project created, OAuth client configured, Business Profile APIs enabled, test users added (David + Gavin). Credentials in Oktyv vault + .env.local + Vercel. App in Testing mode — full verification when ready to open to all clients. |
| I5. Report Generator Upgrades | Rank/citation/GBP/perf sections in client reports | 6 | ✅ DONE |
| I6. Prospect Audit Enrichment | Rank data + citation health in sales audits | 4 | ✅ DONE |
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
| D1 | Audit history on lead detail | ✅ DONE |
| D2 | Demo history on lead detail | ✅ DONE |
| D3 | Shareable audit link (public, no auth required) | ✅ DONE |
| D4 | Audit → Demo one-click workflow | 🔴 TODO |
| D5 | Territory map visualization (simple/static) | ✅ DONE — `src/app/(onboarding)/territory-map/page.tsx` (4 territories, phase roadmap, rules strip) |

**Non-Dashboard Sales Enablement (External Collateral)**
| ID | Task | Status |
|----|------|--------|
| S3 | Digital Brochure — one-pager, phone/Zoom optimized | ✅ DONE — `src/app/(onboarding)/brochure/page.tsx` (live dashboard page) |
| S4 | Recruiting Comp Sheet — earnings projections for candidates | ✅ DONE — `src/app/(onboarding)/comp-sheet/page.tsx` (live, income projection table + stacked bar chart) |
| S5 | Territory Map — initial definitions for first 4 reps | ✅ DONE — same as D5, `src/app/(onboarding)/territory-map/page.tsx` |
| S6 | Sales Agreement Template — contractor terms | ✅ DONE — `D:\Work\SEO-Services\CLIENT_SERVICE_AGREEMENT.md` (complete 12-section agreement) |
| S7 | Job Ad — draft and post | ✅ DONE — `D:\Work\SEO-Services\JOB_AD.md` (two versions: Indeed + LinkedIn, with posting notes) |

### ✅ SPRINT 7 — Sales Enablement Polish (February 24, 2026)
- [x] **7A — Save Searches (Pipeline)** — `SavedSearch` model added to schema, migrated. Three API routes (`GET/POST /api/saved-searches`, `DELETE /api/saved-searches/[id]`). UI in `lead-filter-bar-advanced.tsx`: Save button + inline name input + "Saved Searches" dropdown. Active saved search shows as named badge instead of "X active filters."
- [x] **7B — Audit PDF: PPC / Google Ads Section** — `AuditData` extended with `ppc` field. `generator.ts` pulls `GoogleAdsConnection.isActive` via `clientProfile` relation. PPC section added to `template.ts`: Ads account status, missed clicks estimate, recommended budget, campaign types, CTR expectation, CTA.
- [x] **7C — Brochure PDF: PPC Version** — Full PPC section added to `src/app/(onboarding)/brochure/page.tsx`: value prop, services list (LSAs + Search Ads + management + reporting), pricing reference (CLIENT_AGREEMENT.md §1.1 language), inline SVG funnel visual, matching brand style.
- TypeScript: Zero Sprint 7 errors. Pre-existing errors in scripts/basecamp* are unrelated.

**Files created:** `src/app/api/saved-searches/route.ts`, `src/app/api/saved-searches/[id]/route.ts`
**Files modified:** `prisma/schema.prisma`, `src/components/leads/lead-filter-bar-advanced.tsx`, `src/lib/audit/generator.ts`, `src/lib/audit/template.ts`, `src/app/(onboarding)/brochure/page.tsx`

### Commission System Validation — ✅ COMPLETE (February 22, 2026)
Validated via Apex North LLC test client. Cron generated residual ($200, Arian) + master_fee ($240, David). Approval flow confirmed. Cron rescheduled to 5th of month. Test client hard-deleted. See Sprint 1 + PAYMENTS-002/006 above.

### Other Pending (Lower Priority)
- BUG-005: ✅ DONE | BUG-006: ✅ DONE
- Pipeline Filter UX refinement
- Content Library → Calendar Scheduling
- Content CTA Enforcement
- Task Pipeline UX: ✅ ALL DONE (schema, API, UI, kanban, transitions, history)
- Voice System — Sardonic Micro-Copy Layer (Low)
- TeamFeed Multimedia (Low)

---

## 📥 BACKLOG — Added February 22, 2026

### ✅ PAYMENTS-001: Wave invoice.paid Webhook Handler
**Completed:** February 22, 2026
**Note:** Wave doesn't expose webhooks in their standard UI. Built Option C (poll) instead — see invoice-status-poll cron below.
**Files built:**
- `src/app/api/webhooks/wave/route.ts` — handler exists but dormant (no Wave webhook endpoint to register against)
- `src/app/api/cron/invoice-status-poll/route.ts` — hourly poll, same commission logic, ~1hr worst-case latency
- `vercel.json` — invoice-status-poll added at `0 * * * *`
- `prisma/schema.prisma` — `WebhookEvent` model and `sourceEventId` on PaymentTransaction (still useful for poll dedup)

### ✅ PAYMENTS-002: Approval Flow for Payments in Approvals Tab
**Completed:** February 22, 2026
**Files built:**
- `src/components/tasks/approvals-tab.tsx` — PaymentGroup section added (grouped by user, inline breakdown, vendor ID warning, approve button)
- `src/app/api/payments/approve/route.ts` — approves transactions, creates Wave bill if contractorVendorId set
- `src/app/api/payments/pending/route.ts` — GET pending transactions grouped by user for queue UI

### ✅ PAYMENTS-003: Contractor Entity Fields on User
**Completed:** February 22, 2026
**Schema:** `contractorVendorId`, `contractorEntityName`, `contractorEmail` on User — replaces `waveVendorId`
**Updated:** `sync.ts` ensureWaveVendor uses contractorEntityName/Email; payout, partners/sync, partners/[userId] routes updated
**Pending:** UI in Team settings (admin) — low priority, can set via DB admin until needed

### ✅ PAYMENTS-004: Position System — COMPLETE (February 22, 2026)
**Schema:** `Position` model — name, type, compensationType, defaultAmount, defaultFrequency, dashboardAccessLevel. `positionId` FK on User.
**Seed:** Owner, Manager, Sales Rep, Content Manager, SEO Specialist.
**API:** GET/POST `/api/positions`, PATCH/DELETE `/api/positions/[id]`.
**UI:** `PositionsTab.tsx` in Settings → admin-only tab. Full CRUD with active toggle, user count per position.

### ✅ PAYMENTS-005: Generalized Onboarding Wizard — COMPLETE (February 22, 2026)
**Files:** `src/app/(onboarding)/rep-setup/page.tsx` (generalized), `src/components/onboarding/onboarding-wizard.tsx` (position-adaptive, new).
**Sales flow:** Welcome → Profile → Contractor → Territory → Tools → First Lead → Resources → Done (8 steps).
**Ops/Mgmt flow:** Welcome → Profile → Contractor → Scope → Tools → Done (6 steps).
**API:** `POST /api/users/onboarding/contractor` — self-serve entity name + billing email save during onboarding.
**Admin:** `POST /api/users/[id]/onboarding-reset` — clears `repOnboardingCompletedAt` + `repOnboardingStep`. Reset button in UserPermissionCard (admin-only, shown when onboarding already completed).
**User creation:** `POST /api/users` — creates account, position-assignable, generates temp password, logs onboarding checklist to console (AdminTask model deferred to Sprint 3).
**Add User dialog:** wired into TeamManagementTab with role + position selectors and password field.

### VAULT-001: Global Document Version Warning ✅ COMPLETE (February 23, 2026)
- [x] `vault-client.tsx` — amber banner on Shared tab for non-elevated users: "Always use files from this Shared folder. Documents saved to your device may become outdated."
- [x] `vault-file-tile.tsx` — `toast.warning()` fires on tile click (open) and Download dropdown item for any file in the `shared` space. 5-second duration.
- [x] Zero new TypeScript errors.

### VAULT-001: Global Document Version Warning
**Priority:** HIGH — legal/ops risk
**Problem:** Reps can download or transfer global documents (contracts, agreements, comp sheet, etc.) to their private vault folder or local machine. If they do, they're working from a snapshot that won't reflect future updates. There's no signal that the shared versions are the only guaranteed-current copies.
**Solution:** When a rep views or downloads any document from the Shared space, show a persistent banner or toast: "This is the official current version. Saved copies may become outdated — always access contracts and agreements from the Shared folder." Additionally, consider a "Version warning" badge on any private vault file that was transferred from a shared document, indicating it may not be current.
**Scope:** Vault UI — Shared space document viewer/download action + transfer-to-private flow.

### FINANCE-002: Historical Data Sync — Wave + Gusto into Dashboard
**Priority:** MEDIUM — context and continuity for financial reporting
**Status:** ✅ SCRIPT READY — February 22, 2026. Schema updated (isHistorical flag). Run when ready.
**Script:** `scripts/import-wave-history.ts`
**Run:** `DRY_RUN=true npx tsx scripts/import-wave-history.ts` (preview), then without DRY_RUN to write
**Cutoff:** Jan 1, 2026 — everything before is imported history, everything after is live
**Notes:** Bills import uses `clientId=clients[0]` as placeholder — update manually post-import if attribution needed for specific bills. Gusto payroll history is out of scope (Gusto is W-2 for Gavin only; 1099 contractors handled via Wave bills).


**Priority:** HIGH — financial visibility for operations
**Status:** ✅ DONE — February 22, 2026 (Sprint A)
**Files built:**
- `src/lib/wave/accounts.ts` — `getBankAccounts()` + `getRecentTransactions()` Wave queries
- `src/lib/wave/types.ts` — `WaveAccount`, `WaveTransaction`, `WaveFinancialSummary` types added
- `src/app/api/finance/live-summary/route.ts` — admin-only GET: Wave bank balances + DB AR/AP totals + net cash
- `src/components/payments/FinancialOverviewSection.tsx` — client component with 4-card KPI row, cash flow detail, recent transactions feed, multi-account strip
- `src/app/(dashboard)/payments/page.tsx` — FinancialOverviewSection injected above existing PaymentsOverview (admin-only)
- `prisma/schema.prisma` — isHistorical Boolean @default(false) added to PaymentTransaction; db push complete


**Priority:** LOW — existing cron works, needs schedule change only
**Change:** Move from 1st to 5th of month. Webhook is now primary trigger. Cron catches misses only.

### ✅ PAYMENTS-006: Cron Schedule Change (generate-payments)
**Completed:** February 22, 2026
**Change:** `vercel.json` — `generate-payments` moved from 1st to 5th of month (`1 0 5 * *`). Webhook is now primary; cron is safety-net only.

---

## 📥 BACKLOG — Added February 20, 2026

### ITEM-001: Google Ads & PPC — Surface in All Materials
**Priority:** HIGH — affects contracts, onboarding, dashboard, demos, reporting
**Context:** The $2,400/month standard package includes both Google Ads management AND Google PPC management. Clients pay ad spend directly; GHM manages both under the same package fee.

**✅ DONE — Dashboard (Feb 22, 2026):**
- `CampaignsTab.tsx` built and wired into client detail view as "Google Ads" tab
- Surfaces campaign metrics (impressions, clicks, CTR, spend, ROAS) from connected Ads account

**Still open:**
- `CLIENT_AGREEMENT.md` — add explicit PPC/Ads language to Section 1.1 (no code dependency, do first)
- Ads section in monthly report PDF template
- `CLIENT_ONBOARDING_FORM.md` — add Google Ads account ID field + access grant instructions
- Digital brochure (S3) — highlight Ads + PPC as included value
- Sales audit PDF (I6) — add "Paid Search Opportunity" section
- Demo pages — include mock Ads campaign metrics

---

### ITEM-002: GHM is an "Inc" not "LLC" — ✅ RESOLVED
**Result:** grep across entire codebase confirmed zero LLC references for GHM's entity. All documents already use "GHM Digital Marketing Inc" (PARTNER_AGREEMENT.md, email templates, etc.). No changes required.
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

### UX-001: Client Detail Card — Panel Layout Rethink
**Status: ✅ COMPLETE — February 21, 2026**
profile.tsx decomposed from 1057-line monolith to 489-line orchestrator. Tasks, Notes, and Domains extracted to standalone components. URL tab sync added (?tab=...). All 13 tabs delegate to imported components.

**Priority:** HIGH — affects every rep interaction with active clients daily
**Problem:** The client detail view (`/clients/[id]`) renders all panels (Scorecard, Tasks, Rankings, Citations, Reports, Billing, etc.) as stacked sections inside a single scrollable container. In split-screen or responsive viewports, both vertical and horizontal scrollbars appear simultaneously, which breaks flow and feels broken. Reps don't know what they're looking for or where to find it.

**Proposed rethink — Tab-per-panel architecture:**
Replace the long scroll with a full-height tabbed layout where the viewport itself is the scroll boundary, not an inner container. The client header (name, health score, key metrics strip) stays pinned at top; below it sits a tab bar; below that is a scrollable content area that fills the remaining viewport height exactly. This gives each panel its own isolated scroll context — no horizontal scroll, no double-scroll, no confusion.

**Tab groups (proposed):**
- **Overview** — scorecard + recent activity summary (the "at a glance" landing tab)
- **Tasks** — full task kanban/list (replaces embedded Tasks panel)
- **SEO** — rankings + citations + GBP metrics
- **Campaigns** — Google Ads / PPC (once I7 surfaces)
- **Content** — content studio briefs + review queue (see UX-002/UX-004 for further decisions)
- **Reports** — generate + history
- **Billing** — Wave invoices + payment history
- **Settings** — client details edit, contacts, access

**Responsive behavior:** On narrow viewports, tab bar becomes a horizontal scroll (no truncation). On very narrow (< 480px), collapses to a dropdown selector. Tab content always fills available height.

**Files to touch:**
- `src/app/(dashboard)/clients/[id]/page.tsx` — layout restructure
- `src/components/clients/profile.tsx` — currently the monolith, break into tab-gated components
- All sub-panel components (RankingsTab, CitationsTab, ScorecardTab, etc.) — already componentized, just need correct height/overflow CSS

---

### UX-002: Website Studio + Content Studio — Left Panel Promotion
**Status: ✅ COMPLETE — February 21, 2026**
Both studios promoted to top-level nav entries in Clients group. New routes /content-studio and /website-studio with StudioClientPicker component. Supports ?clientId= deep links from client records. Permission-gated (manage_clients).

**Priority:** HIGH — discoverability directly affects upsell conversion
**Problem:** Website Studio and Content Studio are currently buried inside the client detail view, only accessible after navigating to a specific client. This is correct for client-level work, but wrong for awareness — reps and admins don't know these features exist unless they're deep in a client record. As paid upsell modules (alongside Lead Gen, Task Management, Payments), they need their own top-level presence.

**Recommendation:** Promote both studios to the left nav as their own entries — but scope-aware. When accessed from the nav, they show a "select a client" state and then load that client's studio context. When accessed from within a client record (the tab in UX-001), they load directly into that client. This is the same pattern as any multi-tenant tool (Notion's per-workspace sidebar → per-page editor).

**Left panel entries to add:**
- **Content Studio** (with sub-item: Content Review, once UX-004 is resolved)
- **Website Studio**
- Both should show a badge or indicator if there are pending items (e.g., "3 drafts awaiting review")

**Consideration:** Both modules should be conditionally rendered or clearly marked as "upsell" in the nav for clients who haven't activated them — show them, but with a "Upgrade" lock state so reps know they exist and can pitch them.

**Files to touch:**
- `src/components/layout/sidebar.tsx` (or equivalent nav component)
- Route structure — may need `src/app/(dashboard)/content-studio/page.tsx` and `/website-studio/page.tsx` as landing pages with client-picker

---

### UX-003: Left Panel — Smart Group Navigation with Expand/Collapse
**Status: ✅ COMPLETE — February 21, 2026**
Flat nav replaced with 5 collapsible groups: Prospects, Clients, Insights, Finance, Team. State persisted to localStorage. Active route auto-expands parent group. Dashboard pinned above groups. NavGroupSection component with aria-expanded and keyboard support.

**Priority:** MEDIUM-HIGH — will become critical as nav items grow past ~12
**Problem:** As upsell modules, studios, admin tools, and new features get added to the left panel, it will become a flat wall of links. No mental model. No hierarchy. Hard to scan.

**Recommendation:** Group nav items into collapsible sections with persistent expand/collapse state (saved to localStorage per user). Groups should reflect the actual workflow model — not arbitrary categories.

**Proposed groups:**
- **Prospects** (always expanded by default for sales) — Pipeline, Leads, Discovery, Territory Map
- **Clients** (always expanded by default) — Client List, My Tasks, Content Studio, Website Studio, Reports
- **Insights** — Analytics, Rankings Overview, Citation Health
- **Finance** — Commissions/Earnings, Wave Billing (admin/master only)
- **Team** (admin/master only) — Team Management, Document Vault, Bug Reports
- **Settings** — Profile, App Settings

**Behavior:**
- Each group has a header label + chevron toggle
- State persisted in localStorage (`sidebar_group_[group_id]_expanded: bool`)
- On first load: Prospects + Clients expanded, everything else collapsed (unless user is admin, in which case all expanded)
- Active route auto-expands its parent group even if collapsed
- Keyboard accessible (focus group header → Enter to toggle)

**Self-contained system note:** The core system (Pipeline, Clients, Tasks, Reports, Analytics, Earnings) must be fully navigable and useful without any upsell modules installed. Upsell module entries (Content Studio, Website Studio, Lead Gen, Payments) are additive — they appear in their group but are lockable per-client. A rep using only the base system should never feel like they're navigating around missing pieces.

**Files to touch:**
- `src/components/layout/sidebar.tsx` — full refactor
- New `SidebarGroup` component with toggle logic

---

### UX-004: Content Review + Content Studio — ✅ DONE (February 21, 2026)
**Implemented:** Content Review merged into Tasks as two-tab layout. Work tab = assigned tasks (unchanged). Approvals tab = both ClientTask and ClientContent items in "review" status. Tab state synced to URL (?tab=approvals). Approvals tab only visible to elevated users. Old /review page redirected permanently. Nav entry removed. New: TasksPageClient shell, ApprovalsTab component, GET /api/review/content-queue, redirect at /review.

### UX-004: Content Review + Content Studio — Architecture Decision (original below)
**Priority:** HIGH — affects information architecture before UX-001/UX-002 can be finalized
**Problem:** Content Review is currently a separate nav/page item, but it only has meaning if a client has Content Studio active. Its presence in the top-level nav as a permanent item creates confusion for users who don't have any content pipeline.

**Analysis:**
- **Content Review** is a queue — it surfaces items awaiting approval. It's reactive, not proactive.
- **My Tasks** is also a queue — it surfaces tasks assigned to the current user. Also reactive.
- These are conceptually the same pattern: "things needing your attention right now."
- The only meaningful difference is: Tasks = work actions; Content Review = approval actions.

**Recommendation:** Merge Content Review into My Tasks as a sub-section or tab — "Tasks" and "Content Approvals" as two tabs within the same page. The merged page becomes "My Work" or just "Tasks" with a tab bar. Content Approvals tab is hidden/empty with a friendly empty state if the client has no Content Studio.

**Alternative (keep separate):** Keep Content Review as its own left-panel item, but move it inside the Clients group (UX-003) and only show it when at least one client has Content Studio active. Show a count badge so it's useful at a glance.

**Decision — CONFIRMED February 21, 2026:** Merge Content Review into My Tasks as two tabs: **Work** (assigned tasks) and **Approvals** (content review queue). Approvals tab shows empty state if no studios active. Content Studio goes to left nav as top-level creation/management entry. Review/approval surfaces in Tasks only. This gates UX-001, UX-002, UX-003 final structure — all can now proceed.

---

### BUG-007: Content Review Quick Approve Does Not Sync — ✅ FIXED (February 21, 2026)
**Root cause:** Two completely decoupled systems with no FK link. Content Studio stores items in `ClientContent`; the review queue only queried `ClientTask`. Approving a task never touched `ClientContent`. Content Studio's "Submit for Review" updated `ClientContent.status` but items never appeared in the review queue.
**Fix:** Review page now queries both `ClientTask` (status='review') and `ClientContent` (status='review'). `ReviewQueue` component handles both types. Each card's approve action routes to the correct model — tasks via `/api/tasks/[id]/approve`, content items via `PATCH /api/content/list`. No FK needed; the two item types are rendered separately and approved via their own APIs.

### BUG-008: Completed Tasks Not Removed from Content Review — ✅ FIXED (February 21, 2026)
**Root cause:** Status string mismatch. Status machine and transition route store `status: "review"` (no hyphen). Review page queried `status: "in-review"` — never matched anything. The queue was permanently empty regardless of actual task states.
**Fix:** Changed query to `status: "review"`. Also hardened the approve route: now validates task is actually in `"review"` before approving, runs status update + `TaskTransition` audit entry in a single `$transaction`, and sets `completedAt` timestamp. Tasks correctly exit the queue on approval.
**Priority:** HIGH — data integrity issue, reps think they approved something but studio state is unchanged
**Problem:** Clicking "Quick Approve" on an item in the Content Review queue marks it approved in the review queue's local state but does not update the corresponding record in Content Studio. The two views are reading from the same data source but the approval write is only updating one side.
**Fix:** The approve action must write to the canonical content item status field, and both Content Review and Content Studio must read from that same field. Likely a state update is happening in the component but not persisting to DB, or persisting to a different field than Content Studio reads.
**Files to investigate:** `src/components/content-review/` and `src/components/content-studio/` — compare the field they each read for approval status, and trace the approve API call.

---

### BUG-008: Completed Tasks Not Removed from Content Review
**Priority:** HIGH — content review becomes polluted with stale items
**Problem:** When a task is moved to "Complete" in the task system, it is not removed from the Content Review queue. Content Review should only show items that are pending review — completed items should be filtered out or auto-dismissed.
**Fix:** Content Review query should filter `status != 'complete'` (or equivalent). Alternatively, task completion should trigger a status write on the linked content item that Content Review's query filters by.
**Files to investigate:** `src/app/api/content-review/` — check the query filter conditions.

---

### FEAT-013: GoDaddy Parked Domain Search for Satellite Clusters — ✅ COMPLETE (Feb 22, 2026)
**Backend:** `/api/domains/search/route.ts` — fetches parked domains + suggestions in parallel, fuzzy-matches query.
**UI:** `DomainFinderSection.tsx` — keyword search bar, surfaces GHM parked matches first with "GHM Parked" badge, then ranked available domains with buy links. Wired into `ClientDomainsTab` via `defaultQuery={businessName}`. No purchase CTA shown when parked match exists.

---

### BUG-009: Dashboard Widget Layout Not Synchronized Across Light/Dark Mode — ✅ FIXED
**Resolution (Feb 22, 2026):** `MasterDashboardGrid.tsx` uses localStorage key `ghm:dashboard-layout` — completely theme-agnostic. Code comment explicitly states "This prevents layout loss when React re-mounts the component (e.g. theme switch)." Layout was already stored theme-agnostically; bug resolved during dashboard grid refactor. No separate fix required.
**Priority:** MEDIUM — UX inconsistency, confusing when switching themes
**Problem:** Dashboard widget arrangement is saved per-theme. If a user arranges widgets in light mode and saves, then switches to dark mode, the saved arrangement doesn't carry over. Switching back to light mode restores the saved arrangement, but the inconsistency creates the impression that settings aren't saving or that the system is broken.
**Root cause:** Widget layout state is almost certainly being keyed by something that varies between themes (possibly a localStorage key that includes a theme identifier, or theme triggers a full remount that re-reads a stale default).
**Fix:** Widget layout should be stored theme-agnostically — one layout state used by both themes. If the user rearranges in dark mode, that layout persists to light mode and vice versa. Theme affects only visual styling, never data or layout state.
**Files to investigate:** Dashboard widget persistence logic — search for `localStorage` and `widget` in `src/components/dashboard/` and `src/app/(dashboard)/`.

---

### ITEM-004: AI Wrapper Audit — ✅ COMPLETE (February 21, 2026)
**Result:** One raw call found and migrated. All AI calls now route through `callAI()`.

**Audit findings:**
- `src/lib/scrvnr/voice-capture.ts` — was using `new Anthropic()` + `anthropic.messages.create()` directly. **Migrated.**
- `src/app/api/settings/integrations/route.ts` — references Anthropic only to ping the health endpoint (`/v1/models`), not for inference. **Correct as-is.**
- All Content Studio, competitive scan, upsell detection, content brief routes — already using `callAI()`.

**Enhancements applied:**
- Added `voice_capture` to `AIFeature` type union
- Added `voice_capture` system prompt to `system-prompt-builder.ts` with detailed brand voice extraction methodology and scoring rubrics
- Added `voice_capture` output contract (JSON schema enforced)
- Added `voice_capture` to cascade escalation JSON-feature list (will escalate to Opus if Sonnet returns malformed JSON)
- Default max tokens: 1,200 (sufficient for structured JSON + quality vocabulary extraction)
- `captureVoiceFromWebsite()` now accepts `clientId` + `clientName` for cost tracking attribution — all voice capture calls logged to `ai_cost_logs`
- Model routing: voice capture is moderate complexity + copywriting domain → routes to Sonnet by default, escalates to Opus on JSON parse failure
**Priority:** MEDIUM — architectural quality; we have the layer, need to confirm everything routes through it
**Context:** Phase 11 (AI Client Layer) implemented a unified `callAI()` entry point with model routing, complexity analysis, cost tracking, system prompt builder, cascade retry, and per-feature prompt engineering. This is the right architecture. The question is whether it's fully applied — or whether any later-added features are making raw `anthropic.messages.create()` calls that bypass the wrapper.

**Current state (Phase 11 completed):**
- `src/lib/ai/` — model router, complexity analyzer, cost tracker, system prompt builder, `callAI()` unified entry
- `ai_cost_logs` table — per-call USD logging
- Content brief API confirmed using `callAI()`

**Audit needed — search for raw AI calls that bypass `callAI()`:**
- Search `src/` for `anthropic.messages` or `new Anthropic()` or `openai.chat.completions` outside of `src/lib/ai/`
- Any direct API calls found should be refactored to go through `callAI()` with appropriate feature context, model selection, and system prompt
- Document which features exist in the system prompt builder and which may be missing

**Enhancements to consider if gaps found:**
- Model routing rules: simple summarization → Haiku; complex multi-step reasoning → Sonnet; long-context synthesis → Opus (if budget allows)
- Token optimization: trim unnecessary context from prompts, compress large inputs before sending
- Per-feature system prompts: ensure Content Brief, Demo Generator, Audit Narrative (if any), Upsell Detection, and Competitive Analysis each have distinct, well-tuned system prompts
- Retry logic: verify cascade retry handles rate limits and 529s gracefully
- Cost guardrails: per-client monthly cap, alert if client's AI spend exceeds threshold

**Files:**
- `src/lib/ai/` — existing layer, review and extend
- Audit script: `grep -r "anthropic.messages\|new Anthropic\|openai.chat" src/ --include="*.ts" --exclude-dir=lib/ai`

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
- ✅ Error monitoring (Sentry) — shipped Sprint 1
- ✅ Structured logging — shipped Sprint 1
- ✅ Security hardening (2FA/TOTP, rate limiting, CSRF) — shipped Sprint 1
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

**This file (`STATUS.md`)** — Current sprint + critical constraints + file index. Open work lives in BACKLOG.md. Completed work lives in CHANGELOG.md.

**`BACKLOG.md`** — Open items only, tiered by priority (MUST / SHOULD / WOULD / FUTURE). Items are deleted when shipped. Never contains ✅.

**`CHANGELOG.md`** — Permanent log of every completed item (date + commit + summary). Never pruned. The destination when a BACKLOG item ships.

**`SYNC_PROTOCOL.md`** — Exact 6-step process for closing items and running git. Read this when syncing. `commit.bat` and `deploy.bat` print a checklist reminder before running git.

**Specs (reference when building):**
- `SALES_INTEGRATION_PLAN.md` — Full gap analysis, schema changes, API specs, UI requirements for sales features
- `INTEGRATION_STRATEGY.md` — API selection, enrichment, scaling, caching
- `COMMISSION_SYSTEM_SPEC.md` — Commission structure, DB schema, UI designs
- `EDIT_AND_TASKS_SPEC.md` — Edit client + bulk task management
- `BUILD_PLAN.md` — Master build plan + Website Studio status
- `QUICK_REFERENCE.md` — API keys, env vars, deployment info
- `D:\Work\SEO-Services\specs\PAYMENTS_ARCHITECTURE.md` — Payments architecture (webhook triggers, position system, contractor routing, approval flow, personnel model)
- `D:\Work\SEO-Services\specs\ONBOARDING_PORTAL_SPEC.md` — Client onboarding portal (token-auth form, wireframes, 21 tasks)
- `D:\Work\SEO-Services\specs\WAVE_PAYMENTS_BLUEPRINT.md` — Wave payments integration (schema, wireframes, 30 tasks)
- `D:\Work\SEO-Services\specs\CONTRACT_AUDIT_AND_PAYMENTS.md` — Contract claims audit + payments architecture narrative
- `D:\Work\SEO-Services\specs\API_INTEGRATION_BLUEPRINT.md` — API ecosystem (DataForSEO, NAP, GBP, Ads, GoDaddy, 56 hrs)

**Design blueprints (docs/blueprints/):**
- `docs/blueprints/OPERATIONS_BLUEPRINT.md` — Complete operational gap-fill: solo-operator model, client lifecycle workflows, AI-assisted content/SEO/PPC pipelines, Basecamp migration, task automation architecture
- `docs/blueprints/UXUI_DESIGN_SPEC.md` — Evidence-based visual design: competitive research (AgencyAnalytics pain points), component patterns, data density principles, responsive behavior
- `docs/blueprints/UXUI_PHILOSOPHY_v2.md` — Interaction architecture for solo operator + AI: mental model, session context, alert vs notification distinction, data-to-action pathways, compact/full rendering modes

**Business operations:**
- `D:\Work\SEO-Services\SALES_OPERATIONS.md` — Canonical sales comp, territory, hiring manual
- `D:\Work\SEO-Services\CLIENT_AGREEMENT.md` — Client service agreement (month-to-month, $2,400/mo)
- `D:\Work\SEO-Services\CLIENT_ONBOARDING_FORM.md` — Onboarding form content (source for portal spec)
- `BUSINESS_DNA.yaml` — Company identity, market, ops, priorities

---

## 🔒 CRITICAL CONSTRAINTS (Always Enforce)

- **DB drift:** NEVER run `prisma migrate dev` — use `prisma db push` only
- **"master" stays as DB enum** — UI shows "Manager" via ROLE_LABELS
- **David's account = admin role** in Neon DB (id=1)
- **Admin hierarchy:** admin > master > sales, `isElevated()` = admin|master
- **TypeScript must be clean** — run `npx tsc --noEmit` before closing any sprint
- **SALARY_ONLY_USER_IDS = [4]** — Gavin (id=4) never receives engine-generated payments. Salary handled outside system entirely. This constant lives in `src/lib/payments/calculations.ts` and must never include David (id=1).
- **David (id=1) legitimately receives $240/mo management fee** through the engine as master_fee transactions. His masterFeeEnabled=true in UserCompensationConfig is correct.
- **Test account (userId=6)** must never have contractorVendorId set or be assigned as salesRepId/masterManagerId on any real client.
- **Vercel build script:** `vercel-build` (not `build`) is what Vercel runs. `prisma db push` was removed — schema changes are manual only.

