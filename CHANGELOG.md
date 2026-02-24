# GHM DASHBOARD — CHANGELOG
**Purpose:** Permanent record of every completed item. Items are moved here when shipped.
**Never prune this file.** It is the audit trail.
**Last Updated:** February 23, 2026 — Sprint 3 shipped.

---

## How items land here
When you ship something:
1. Add a row to the table below (date + commit + what shipped)
2. Delete the item from BACKLOG.md
3. Update STATUS.md "Last Updated" line
4. Then commit

---

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
