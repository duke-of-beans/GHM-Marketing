# ARCH-003: COVOS Module Map + 12-Month Product Roadmap

> **DRAFT** — Not finalized. Requires David review before treated as canonical.

**Date:** 2026-02-28
**Author:** David (COO/operator, sole developer)
**Builds on:** ARCH-002 (PROPOSED — stay monorepo, Option A accepted pending sign-off)
**Purpose:** Document every functional module in the current COVOS platform, map the full 82-category vertical ERP vision, and define the 12-month build sequence for platform sellability.
**Scope:** GHM Dashboard codebase at `D:\Work\SEO-Services\ghm-dashboard`, deployed at `covos.app`.

---

## Table of Contents

1. [What COVOS Is Today](#section-1--what-covos-is-today)
2. [The 82-Category Vision](#section-2--the-82-category-vision)
3. [Recommended Build Sequence — Next 12 Months](#section-3--recommended-build-sequence-next-12-months)
4. [First Paying Tenant Readiness Checklist](#section-4--first-paying-tenant-readiness-checklist)

---

## Section 1 — What COVOS Is Today

The following modules exist in the current codebase as of February 28, 2026 (commit `8b028a0`). Status levels: **Live** = fully functional in production, **Partial** = built but limited/constrained, **Scaffolded** = API/schema exists, UI thin or not exposed to end users.

---

### 1. Authentication

One-sentence description: Full authentication stack covering session management, TOTP 2FA, password reset, rate limiting, and CSRF protection.

**Status:** Live

**Primary files:** `src/lib/auth/auth.config.ts`, `src/app/api/auth/[...nextauth]/`, `src/app/api/auth/forgot-password/`, `src/app/api/auth/reset-password/`, `src/app/api/auth/totp/`, `src/app/(auth)/login/`, `src/app/(auth)/forgot-password/`, `src/app/(auth)/reset-password/`

**Tenants:** ghm, covosdemo (infrastructure shared; branding per-tenant via `/api/public/branding`)

---

### 2. Multi-Tenant Engine

One-sentence description: Subdomain-based tenant detection, per-tenant database isolation, and registry-driven configuration for all tenant-specific fields.

**Status:** Live

**Primary files:** `src/lib/tenant/config.ts` (TENANT_REGISTRY, TenantConfig interface), `src/lib/tenant/server.ts` (getTenant, requireTenant, getTenantPrismaClient), `src/lib/tenant/index.ts`, `src/hooks/use-tenant.ts`, `src/middleware.ts`, `src/app/api/debug/tenant/`, `docs/TENANT_PROVISIONING.md`

**Tenants:** ghm (production), covosdemo (dry-run verified 2026-02-27)

---

### 3. Lead Management

One-sentence description: Full CRM pipeline covering Kanban board, enrichment, discovery, import, advanced filtering with 18+ dimensions, saved searches, bulk actions, and single manual entry.

**Status:** Live

**Primary files:** `src/app/(dashboard)/leads/`, `src/components/leads/`, `src/app/api/leads/`, `src/app/api/discovery/`, `src/app/api/enrichment/`, `src/app/api/saved-searches/`, `src/components/leads/lead-filter-bar-advanced.tsx`, `src/components/leads/new-lead-dialog.tsx`

**Tenants:** ghm (all features active)

---

### 4. Client Management

One-sentence description: Full client lifecycle from portfolio view through 17-tab detail page — scorecard, tasks, rankings, citations, local presence, content, websites, audit, health, reports, domains, compensation, billing, campaigns, integrations, notes, competitors, and signatures.

**Status:** Live

**Primary files:** `src/components/clients/portfolio.tsx`, `src/components/clients/profile.tsx`, `src/app/(dashboard)/clients/`, `src/app/api/clients/`, `src/components/clients/SignaturesTab.tsx`, `src/components/clients/CampaignsTab.tsx`, `src/components/clients/website-audit/`

**Tenants:** ghm (all tabs active)

---

### 5. Task System

One-sentence description: Unified task queue for client and admin tasks with recurring rules, checklist templates, AI-suggested priorities, role-aware quick-add chips, and Basecamp import.

**Status:** Live

**Primary files:** `src/app/api/tasks/`, `src/app/api/recurring-tasks/`, `src/app/api/checklist-templates/`, `src/components/tasks/`, `src/lib/tasks/invoice-hook.ts`, `src/app/api/import/pm/`

**Tenants:** ghm (all features active)

---

### 6. Commission Engine

One-sentence description: Automated monthly residual and management-fee generation, Wave AP payment surfacing, and approval workflow — with SALARY_ONLY_USER_IDS guard blocking commission generation for salaried employees.

**Status:** Live

**Primary files:** `src/app/api/cron/generate-payments/`, `src/app/api/payments/`, `src/app/api/cron/invoice-monthly/`, `src/app/api/finance/live-summary/`, `COMMISSION_SYSTEM_SPEC.md`, `src/lib/wave/product-id.ts`, `src/lib/tasks/invoice-hook.ts`

**Critical constraint:** `SALARY_ONLY_USER_IDS = [4]` (Gavin) — never commissions or fees generated. Enforced in cron and all payment generation paths.

**Tenants:** ghm (Wave API required; per-tenant WAVE_API_KEY_[SLUG] scaffolded for future tenants)

---

### 7. Reporting

One-sentence description: AI-narrative PDF reports (monthly/quarterly/annual) with 8 configurable sections, voice-profile tone-matching, scheduled delivery, and shareable preview links.

**Status:** Live

**Primary files:** `src/lib/reports/generator.ts`, `src/lib/reports/template.ts`, `src/lib/reports/ai-narrative.ts`, `src/app/api/reports/`, `src/app/api/cron/deliver-reports/`, `src/components/reports/`

**Tenants:** ghm (all features active; template strings tenant-aware via TenantConfig)

---

### 8. AI Layer

One-sentence description: Unified AI entry point (callAI) with model router, complexity analyzer, cost tracker, and system prompt builder supporting five distinct AI features across the platform.

**Status:** Live

**Primary files:** `src/lib/ai/index.ts`, `src/lib/ai/client.ts`, `src/lib/ai/router/model-router.ts`, `src/lib/ai/router/complexity-analyzer.ts`, `src/lib/ai/cost-tracker.ts`, `src/lib/ai/context/system-prompt-builder.ts`, `src/lib/ai/search-prompt.ts`, `src/lib/ai/task-intelligence.ts`

**AI features active:** content brief, report narrative, global search, task intelligence, SEO strategy generation, GMB post drafting

**Tenants:** ghm (all features); cost logging per-client in `ai_cost_logs` table

---

### 9. Website Studio

One-sentence description: Client website build pipeline with SCRVNR (automated quality scoring), per-page approval queue, cluster-manager governance, deployment task auto-creation, and live-sites registry.

**Status:** Partial (build + approval pipeline live; deployment to production is manual; no hosting layer)

**Primary files:** `src/components/website-studio/`, `src/app/api/website-studio/`, `src/lib/cluster-approval.ts` (implied), `src/app/(dashboard)/websites/`

**Tenants:** ghm (active use)

---

### 10. Content Studio

One-sentence description: AI-powered content generation (blog, meta, PPC copy, social posts, strategy) with review queue, bulk operations, stock photo library, content scheduling, and direct publish.

**Status:** Live

**Primary files:** `src/components/content/`, `src/app/api/content/`, `src/components/content/ContentStudioTab.tsx`, `src/components/content/StockPhotoPicker.tsx`, `src/app/api/stock-photos/`

**Tenants:** ghm (all features active)

---

### 11. TeamFeed

One-sentence description: Slack-grade internal communication panel with SSE real-time delivery, @mentions, emoji reactions, edit, pinned messages, read receipts, GIF search, and Save-to-Vault.

**Status:** Live

**Primary files:** `src/components/team-feed/TeamFeedSidebar.tsx`, `src/components/team-feed/TeamFeed.tsx`, `src/components/team-feed/TeamFeedMultimedia.tsx`, `src/app/api/team-messages/`, `src/app/api/team-messages/stream/`

**Tenants:** ghm (all features active; Tenor GIF key shared)

---

### 12. Document Vault

One-sentence description: Per-tenant file storage on Vercel Blob with upload, display names, PDF preview, three-dot menu (download/delete/move/send-for-signature), shared space, and DocuSign envelope initiation.

**Status:** Live

**Primary files:** `src/components/vault/`, `src/app/api/vault/`, `src/components/vault/SendForSignatureDialog.tsx`, `src/components/vault/vault-file-tile.tsx`, `src/app/api/vault/upload/`, `src/app/api/vault/transfer/`

**Tenants:** ghm (all features active; Vercel Blob store `ghm-marketing-blob` provisioned)

---

### 13. Analytics & Intelligence

One-sentence description: Portfolio-level MoM/YoY trend charts, revenue forecasting, churn risk scoring, health trajectory sparklines, advanced charts, dashboard usage heatmap, and anonymized COVOS telemetry cron.

**Status:** Live

**Primary files:** `src/lib/analytics/intelligence.ts`, `src/components/analytics/`, `src/app/api/analytics/`, `src/app/api/cron/covos-telemetry/`, `src/lib/telemetry/covos.ts`, `src/lib/format.ts`, `src/lib/chart-tokens.ts`

**Tenants:** ghm (all features); COVOS telemetry ships anonymized batch to `COVOS_TELEMETRY_ENDPOINT`

---

### 14. Wave Integration

One-sentence description: Per-tenant Wave API client for invoicing, payment sync, webhook handling, partner lookup, and business-ID resolution — with per-tenant API key pattern (WAVE_API_KEY_[SLUG]).

**Status:** Partial (fully live for ghm tenant; per-tenant key architecture scaffolded but no second production tenant on Wave yet)

**Primary files:** `src/lib/wave/client.ts`, `src/app/api/wave/`, `src/app/api/webhooks/wave/`, `src/app/api/cron/invoice-status-poll/`, `src/components/settings/WaveSettingsTab.tsx`

**Tenants:** ghm (live); future tenants: add WAVE_API_KEY_[SLUG] + waveBusinessId to TENANT_REGISTRY

---

### 15. Google Business Profile (GBP) Integration

One-sentence description: OAuth-authenticated GBP snapshot collection, weekly cron aggregation, AI-drafted GMB posts, LocalPresenceTab with trends and post management, and five seeded alert rules.

**Status:** Partial (OAuth live in testing mode with David + Gavin as test users; Google review of OAuth app pending — required before connecting real client GBP accounts)

**Primary files:** `src/app/api/oauth/google/`, `src/app/api/cron/gbp-snapshot/`, `src/app/api/clients/[id]/gbp/`, `src/components/clients/local-presence/`

**Tenants:** ghm (OAuth credentials in GHM GCP project; COVOS Platform GCP project needed for multi-tenant)

---

### 16. Email System

One-sentence description: Transactional email via Resend — covering report delivery, upsell notifications, portal invites, password reset, and 7 templated flows — with covos.app sending domain verified.

**Status:** Live

**Primary files:** `src/lib/email/index.ts`, `src/lib/email/templates.ts`, `src/app/api/email/`, `src/app/api/cron/deliver-reports/`

**Tenants:** ghm (uses ghmmarketing.com sending domain in production); covos.app domain verified for new tenants. All template strings tenant-aware via TenantConfig.

---

### 17. Onboarding Wizard

One-sentence description: 7-step admin setup wizard (Welcome → Company → Branding → Team → Import → Integrations → Done) with step persistence and a separate token-based client portal onboarding flow.

**Status:** Live

**Primary files:** `src/components/onboarding/AdminSetupWizard.tsx`, `src/app/admin-setup/`, `src/app/api/admin/onboarding/`, `src/app/api/onboarding/`, `src/app/(onboarding)/welcome/[token]/`

**Tenants:** ghm (wizard complete; client portal token flow active)

---

### 18. Branding System

One-sentence description: Three-color (primary/secondary/accent) tenant branding system with dynamic logo serving, BrandThemeInjector CSS custom properties, and per-tenant logoUrl on login and nav.

**Status:** Live

**Primary files:** `src/components/branding/BrandThemeInjector.tsx`, `src/components/settings/BrandingTab.tsx`, `src/app/api/settings/branding/`, `src/app/api/public/branding/`, `src/lib/tenant/config.ts` (logoUrl field)

**Tenants:** ghm (logo + colors active); new tenants: upload logo, set colors in Settings → Branding

---

### 19. Alert Engine

One-sentence description: Rule-based alerting system watching GBP, rankings, and health metrics — with seeded rules, in-app notification delivery, and admin rule management.

**Status:** Partial (engine running, 5 GBP + 1 staleness rule seeded; UI for creating custom alert rules thin)

**Primary files:** `src/app/api/alerts/`, `src/app/api/alerts/rules/`, `src/lib/analytics/alert-engine.ts` (implied), `src/app/api/cron/nap-health-check/`, `src/app/api/cron/rank-poll/`

**Tenants:** ghm (all seeded rules active)

---

### 20. DocuSign Integration

One-sentence description: Envelope creation, status tracking, webhook-driven completion, and signed-PDF auto-save to Document Vault — with client-level Signatures tab and Send for Signature dialog on vault files.

**Status:** Scaffolded (API routes and UI complete; sandbox only — OAuth upgrade required before production go-live)

**Primary files:** `src/app/api/signatures/`, `src/app/api/webhooks/docusign/`, `src/components/vault/SendForSignatureDialog.tsx`, `src/components/clients/SignaturesTab.tsx`

**Tenants:** ghm (sandbox credentials; DOCUSIGN_API_KEY + DOCUSIGN_ACCOUNT_ID required per deployment)

---

## Section 2 — The 82-Category Vision

Status legend:
- ✅ **Built** — functional in production at ghm.covos.app
- 🔧 **Partial** — exists but constrained (noted inline)
- 📋 **Planned** — explicitly in backlog or roadmap sprint queue
- ⬜ **Vision** — strategic direction, not yet scoped

---

### Group 1 — Revenue

| # | Category | Status | Notes |
|---|----------|--------|-------|
| 1 | CRM pipeline | ✅ Built | Kanban + list, 18+ filter dimensions, saved searches, bulk actions |
| 2 | Lead scoring | ✅ Built | closeScore, wealthScore, pitchAngle, market intelligence fields |
| 3 | Quote builder | ⬜ Vision | Product catalog exists (CRUD); no quote assembly or PDF quote flow yet |
| 4 | Proposal generator | 🔧 Partial | Brochure + comp-sheet PDFs live (tenant-aware); not client-specific proposal builder |
| 5 | Contract management | 🔧 Partial | CLIENT_AGREEMENT.md + work orders exist; DocuSign scaffolded but sandbox only |
| 6 | Commission engine | ✅ Built | Monthly cron, residual + master-fee, approval workflow, SALARY_ONLY_USER_IDS guard |
| 7 | Billing / invoicing | ✅ Built | Wave API — invoice creation, status poll, webhook, auto-invoice on deployment task |
| 8 | Payment collection | 🔧 Partial | Wave AP payment records surface in Approvals; manual Wave approval required (by design) |
| 9 | Revenue forecasting | ✅ Built | MRR/ARR trend charts, revenue forecast model in analytics dashboard |
| 10 | Churn prevention | ✅ Built | Churn risk scoring (4 factors), ChurnRiskBadge, upsell detection engine |
| 11 | Territory management | ✅ Built | Territory model, DB-driven showcase, territory assignment on leads, permission-gated |

---

### Group 2 — Operations

| # | Category | Status | Notes |
|---|----------|--------|-------|
| 12 | Task management | ✅ Built | Client + admin tasks, checklist templates, recurring rules, role-suggested quick-add |
| 13 | Project tracking | 🔧 Partial | Website Studio BuildJob pipeline tracks website projects; no generic project model |
| 14 | Workflow automation | 🔧 Partial | Task → invoice hook on deployment; recurring task engine; no visual workflow builder |
| 15 | Scheduling | 🔧 Partial | Recurring task scheduler (cron-based); report delivery scheduling live |
| 16 | Time tracking | ⬜ Vision | No time model in schema |
| 17 | Approval chains | ✅ Built | Commission approval (PaymentTransaction), DocuSign multi-party (scaffolded), page approval queue |
| 18 | SOP library | ⬜ Vision | No structured SOP model; task checklist templates are closest analogue |
| 19 | Recurring operations | ✅ Built | RecurringTaskRule model, cron engine, 12+ Vercel cron jobs active |
| 20 | Capacity planning | ⬜ Vision | No capacity or utilization model |
| 21 | Resource allocation | ⬜ Vision | Task assignee model exists; no resource-load visualization |

---

### Group 3 — Marketing

| # | Category | Status | Notes |
|---|----------|--------|-------|
| 22 | SEO management | ✅ Built | Rank tracking, citation management, NAP health check, daily scans, Ahrefs API |
| 23 | Content studio | ✅ Built | Blog/meta/PPC/social/strategy generation, review queue, bulk ops, stock photos, scheduling |
| 24 | Competitive analysis | ✅ Built | CompetitorsTab, competitive scanning cron, auto-task creation, client-level competitor tracking |
| 25 | Google Ads integration | 🔧 Partial | OAuth scaffolded; CLIENT_AGREEMENT includes ad spend scope; no live campaign data pull yet |
| 26 | Social scheduling | 🔧 Partial | Content schedule endpoint exists (`/api/content/schedule`); no platform OAuth (Buffer/Meta) |
| 27 | Email campaigns | ⬜ Vision | Resend is transactional only; no campaign sequencing or list management |
| 28 | Landing page builder | ⬜ Vision | Website Studio builds full sites; no lightweight landing page tool |
| 29 | Reputation management | 🔧 Partial | GBP review count/avg tracked; review generation workflow not built |
| 30 | Citation management | ✅ Built | Citations tab on client detail, NAP health check cron, citation data in reports |
| 31 | Review generation | 📋 Planned | GBP post drafting live; review request automation is a natural next build |
| 32 | Website Studio | ✅ Built | Build pipeline, SCRVNR scoring, approval queue, deployment task, live-sites registry |

---

### Group 4 — Intelligence

| # | Category | Status | Notes |
|---|----------|--------|-------|
| 33 | Analytics dashboard | ✅ Built | Revenue/churn/health/pipeline charts, KPI cards with delta badges, tour wired |
| 34 | Custom report builder | ✅ Built | 8-section toggle grid, AI Executive Summary, Client-Facing Mode, voice-profile matching |
| 35 | AI insights engine | ✅ Built | callAI() with model router, complexity analyzer, cost tracker; 6 AI feature types |
| 36 | Competitive intelligence | ✅ Built | Competitive scanning engine with daily cron, client-level competitor tabs |
| 37 | Alert system | 🔧 Partial | 5 GBP + 1 staleness rule seeded; custom rule creation UI thin |
| 38 | Forecasting models | ✅ Built | Revenue forecast, health trajectory, churn risk scoring models |
| 39 | Health scoring | ✅ Built | 5-factor composite health score, sparklines, trajectory charts, badge everywhere |
| 40 | Usage telemetry | ✅ Built | DashboardEvent tracking, feature heatmap, DAU chart; COVOS anonymized telemetry cron |
| 41 | Data export | ✅ Built | Leads + clients CSV export, reports PDF download, audit PDF shareable link |
| 42 | API access | ⬜ Vision | No public API or API key management for tenant developers |

---

### Group 5 — Communications

| # | Category | Status | Notes |
|---|----------|--------|-------|
| 43 | TeamFeed | ✅ Built | SSE real-time, @mentions, reactions, edit, pinned, read receipts, GIF/emoji, Save-to-Vault |
| 44 | Client portal | ✅ Built | Token-based client-facing portal with onboarding flow |
| 45 | Document signing | 🔧 Partial | DocuSign scaffolded (sandbox); SendForSignatureDialog + SignaturesTab live; OAuth upgrade needed |
| 46 | Notification center | ✅ Built | In-app notifications, push subscriptions (web push), @mention-triggered alerts |
| 47 | In-app messaging | ✅ Built | TeamFeed is the in-app messaging layer (team-facing) |
| 48 | Email templates | ✅ Built | 7 Resend template functions, voice-profile tone-matching, tenant-aware from/subject |
| 49 | SMS integration | ⬜ Vision | No SMS provider (Twilio/etc.) integrated |
| 50 | Video call scheduling | ⬜ Vision | No Zoom/Google Meet integration |
| 51 | Announcement system | 🔧 Partial | TeamFeed pinned messages serve as announcements; no dedicated broadcast tool |
| 52 | Feedback collection | ✅ Built | Bug report system (admin view + non-admin submission + status feedback loop) |

---

### Group 6 — HR & People

| # | Category | Status | Notes |
|---|----------|--------|-------|
| 53 | Employee onboarding | ✅ Built | 7-step admin wizard + user onboarding wizard (position-aware, contractor entity step) |
| 54 | Org chart | ⬜ Vision | Position model exists; no org chart visualization |
| 55 | Position management | ✅ Built | Position model, 5 seeded positions (Owner/Manager/Sales Rep/Content Manager/SEO Specialist), Settings UI |
| 56 | Payroll (Wave) | 🔧 Partial | Wave AP payment generation for commissions; full payroll (salary runs) not modeled |
| 57 | Performance tracking | ⬜ Vision | No performance review model; health scoring is client-facing, not rep-facing |
| 58 | Hiring pipeline | ⬜ Vision | No candidate or hiring workflow model |
| 59 | Role & permission management | ✅ Built | 3-tier role hierarchy (admin/manager/sales), 16 named permissions, PermissionManager UI, custom presets |
| 60 | Team directory | ✅ Built | Team management tab, user roster, role badges, profile forms |
| 61 | Time-off tracking | ⬜ Vision | No time-off model |
| 62 | 1099/W-2 management | ⬜ Vision | Contractor entity fields captured; no IRS form generation |

---

### Group 7 — Infrastructure

| # | Category | Status | Notes |
|---|----------|--------|-------|
| 63 | Multi-tenant engine | ✅ Built | TENANT_REGISTRY, getTenantPrismaClient(), middleware, debug endpoint, dry-run verified |
| 64 | Authentication (NextAuth) | ✅ Built | NextAuth v5, TOTP, rate limiting, CSRF, Sentry, structured logging |
| 65 | Blob storage (Vercel Blob) | ✅ Built | `ghm-marketing-blob` provisioned; logo upload, vault files, signed-PDF auto-save |
| 66 | Database isolation (Neon) | ✅ Built | Per-tenant Neon database, singleton PrismaClient cache, prisma db push protocol |
| 67 | Integration hub | 🔧 Partial | IntegrationsTab with health badges + configure CTAs; no unified OAuth flow for all providers |
| 68 | Webhook system | ✅ Built | Wave webhook, DocuSign webhook (HMAC-verified), GBP OAuth callback |
| 69 | API gateway | ⬜ Vision | All routes are direct Next.js API routes; no gateway layer, rate limiting per-tenant, or API key auth |
| 70 | Telemetry & logging | ✅ Built | Sentry (error tracking), structured logging (Sprint 1), COVOS telemetry cron, audit logs table |
| 71 | Disaster recovery | ⬜ Vision | No documented backup/restore procedure; Neon handles DB backups; Vercel handles deployment rollback |
| 72 | White-label packaging | 🔧 Partial | Per-tenant branding (logo/colors/companyName/fromEmail) fully live; COVOS-branded README not yet written (ARCH-002 mitigation item) |

---

### Group 8 — Customization

| # | Category | Status | Notes |
|---|----------|--------|-------|
| 73 | Tenant branding (logo/colors/voice) | ✅ Built | BrandThemeInjector, BrandingTab, VoiceProfile model, logoUrl per tenant |
| 74 | Theme engine | 🔧 Partial | Dark/light mode via next-themes; 3 brand color CSS custom properties injected; no theme presets |
| 75 | UI constitution | 🔧 Partial | Design system partially codified (TourButton, InfoTip, dialog base, DataTable); no published component spec |
| 76 | Workflow builder | ⬜ Vision | No visual workflow builder; automation is code-defined |
| 77 | Permission matrix | ✅ Built | 16 named permissions, custom presets, PermissionManager UI inline in Settings |
| 78 | Custom fields | ⬜ Vision | No custom field model; all fields are schema-defined |
| 79 | White-label domain management | ✅ Built | Per-subdomain CNAME provisioning documented in TENANT_PROVISIONING.md; Vercel domain alias per tenant |
| 80 | AI personality configuration | 🔧 Partial | VoiceProfile model (tone, style, focusAreas) informs AI prompts; no tenant-level AI settings UI |
| 81 | Dashboard layout personalization | 📋 Planned | `dashboard-layout` API endpoint exists; personalization UI not exposed |
| 82 | Notification preferences | 🔧 Partial | Push subscription toggle in Settings; no per-notification-type preference control |

---

## Section 3 — Recommended Build Sequence (Next 12 Months)

### Prioritization Principles

Three filters applied to every ordering decision: (a) what unblocks the most other modules — foundational items first; (b) what has the highest revenue impact for GHM right now — because GHM is both customer and funding source; (c) what is required before the first paying COVOS tenant beyond GHM — the September 2026 sellability target from ARCH-002.

---

### Q1 2026 (March – May): Tenant Hardening + GHM Revenue Depth

**Goal:** Lock the infrastructure so a second tenant could onboard in under a day. Simultaneously deepen the highest-revenue modules for GHM so the platform justifies the $2,400/mo price point more visibly.

**Sprint 33 — DocuSign Go-Live + Contract Flow**
Upgrade DocuSign sandbox credentials to production OAuth. Wire document signing into the contract lifecycle (lead → proposal → signed contract → client activated). Adds the first end-to-end paperless close flow. This unblocks Contract Management (item 5) moving from Partial to Built. Estimated: 1 sprint.

**Sprint 34 — GBP Production OAuth + Review Workflow**
Submit GCP OAuth app for Google review (manual David action, already documented). Once approved, connect real client GBP accounts. Build review request automation (email + in-app link) completing Review Generation (item 31). GBP is one of the highest-visibility daily wins for a local SEO agency — live client GBP data is a retention driver. Estimated: 1–2 sprints after Google approval.

**Sprint 35 — Alert Engine UI + Custom Rules**
Promote Alert System (item 37) from Partial to Built by adding a UI for custom rule creation. Alert system is a category that competing platforms (AgencyAnalytics, etc.) charge extra for. This is both a retention feature and a demo differentiator. Also: Sprint 35 is the ARCH-002 review checkpoint — reassess monorepo recommendation against actual COVOS pipeline.

**Sprint 36 — Quote Builder + Proposal PDF**
Build a quote assembly tool that generates a client-facing proposal PDF from the existing Product Catalog entries. This closes the most visible gap in the Revenue group — COVOS currently has no formal proposal layer. At $2,400/mo, the close rate is meaningful; a polished proposal flow is worth building before the first external tenant demo.

**ARCH-002 Mitigation (Q1 parallel, low-sprint-cost)**
Write the COVOS-branded README at repo root. Create `covos-platform-docs` GitHub repo (public, architecture + API docs, no source code). Add ESLint no-restricted-imports rule to enforce TENANT_REGISTRY isolation boundary. These three items take <1 day total and directly address ARCH-002's Option A mitigation requirements.

---

### Q2 2026 (June – August): COVOS Sellability Sprint

**Goal:** Get the platform to a state where a second agency could use it without needing David's intervention on any step. This is the hard requirement before the first paid external tenant.

**Sprint 37 — Google Ads Live Data Pull**
Wire the Google Ads OAuth (already scaffolded) to pull campaign performance data into the client detail page. Google Ads is on almost every GHM client brief — live campaign data inside the same dashboard as SEO metrics is a meaningful differentiator. Completes Google Ads integration (item 25) from Partial to Built.

**Sprint 38 — Social Scheduling Platform OAuth**
Connect Buffer or Meta Graph API to publish/schedule the content already being generated in Content Studio. The generation layer is live; the distribution layer is missing. Completes Social Scheduling (item 26) from Partial to Built.

**Sprint 39 — Tenant Self-Service Onboarding**
Build a guided onboarding flow for a new tenant admin that covers: database provisioning instructions, TENANT_REGISTRY entry creation, DNS setup, Resend sending domain, and Wave API key configuration. Currently this is a David-manual process documented in TENANT_PROVISIONING.md. For a paid external tenant, this needs to be a checklist they can execute without calling David. Target: new tenant operational in under 2 hours.

**Sprint 40 — Permission Matrix + Custom Role Builder**
Promote the permission system from a David-configured system to a tenant-admin-configurable one. The current PermissionManager UI is read-only for non-admins. Add the ability for a tenant admin to create custom permission presets for their team without David's intervention.

**Sprint 41 — API Access Layer (Tenant API Keys)**
Introduce per-tenant API keys so agencies can pull their COVOS data into their own tools (spreadsheets, BI dashboards, custom reports). This is table stakes for an agency-facing platform at the $500+/mo price point. Even a read-only REST API with key management covers the most common request.

---

### Q3 2026 (September – October): Revenue Expansion + HR Depth

**Goal:** September 2026 is the ARCH-002 sellability target. By this point the first external tenant should be onboarded. Q3 builds the modules that justify a price increase and expand ARR per tenant.

**Sprint 42–43 — Performance Tracking + Rep Dashboards**
Build rep-level performance tracking (leads touched, close rate, tasks completed, commissions earned over time) with a dedicated rep dashboard view. Currently the analytics dashboard is aggregate; reps have no personal performance view. This is a retention feature for sales teams and a management tool for agency owners.

**Sprint 44 — Time Tracking (Lightweight)**
Add a simple time log model (task + duration + billable flag) to enable basic project profitability reporting. This is the minimum viable time-tracking layer — not a full Harvest replacement, but enough to know which clients are over-served relative to their retainer.

**Sprint 45 — Email Campaign Sequencing**
Extend the Resend integration from transactional to campaign: list management, sequence builder, open/click tracking. Targeted at the client upsell use case (agencies running email campaigns for their clients through COVOS). Completes Email Campaigns (item 27) from Vision to Built.

**Sprint 46 — Org Chart + HR Visibility**
Add an org chart visualization built from the existing Position + User model. Low-complexity build with high demo impact — shows agency owners their team structure at a glance and positions COVOS as a full agency OS rather than just a marketing tool.

---

### Q4 2026 (November – December): Platform Hardening + Scale Preparation

**Goal:** Harden the infrastructure for N-tenant operation. Address the Vision-status items that any serious agency platform needs to check off before a Series A conversation or open-source publication.

**Sprint 47 — Custom Fields**
Add a flexible custom field model (text, number, date, select) attachable to Lead and Client records. This is the feature that eliminates the most common "we need to track X" customization request from new tenants. Without it, every new tenant requirement becomes a schema migration request.

**Sprint 48 — Disaster Recovery Documentation + Runbook**
Write the backup/restore runbook, define RTO/RPO targets, document the Neon DB backup policy, and build a tenant health monitoring dashboard (is each tenant's DB reachable? is their cron running?). Required for any SLA conversation with a paying tenant.

**Sprint 49 — SOP Library**
Build a structured SOP model (title, steps, assignable, version history) so agencies can encode their operational playbooks inside COVOS. Completes SOP Library (item 18) from Vision to Built. This is a high-stickiness feature — once an agency's SOPs are in the platform, churn cost is high.

**Sprint 50 — White-Label Dashboard Packaging**
Complete the white-label story: custom subdomain on client-owned domains (not just covos.app subdomains), custom email sender, custom report footer, removable COVOS branding. This is the feature that converts a platform user into a platform reseller — agencies white-labeling COVOS as their own ops tool for their clients.

---

## Section 4 — First Paying Tenant Readiness Checklist

The following conditions must all be true before COVOS platform access is sold to a non-GHM agency. Each item is specific and verifiable — not a general health statement.

---

### Infrastructure Gates

- [ ] `GET https://[new-slug].covos.app/api/debug/tenant` returns `{ slug: "[new-slug]", hasDatabaseUrl: true, active: true, resolvedFrom: "[new-slug].covos.app" }` — confirms tenant detection, DB isolation, and active guard working correctly.
- [ ] `GET https://[new-slug].covos.app/login` renders the new tenant's logo (not GHM logo, not the COVOS placeholder) — confirms per-tenant logoUrl resolved from Vercel Blob.
- [ ] `npx prisma db push` has been run against the new tenant's Neon database URL, and `prisma studio` shows all models created — confirms schema isolation.
- [ ] Three Vercel environment variables are confirmed set for the new tenant: `[SLUG]_DATABASE_URL`, `[SLUG]_DIRECT_URL`, and `WAVE_API_KEY_[SLUG]` (if Wave integration required). Verified via `vercel env ls`.
- [ ] New tenant's subdomain CNAME (`[slug] CNAME cname.vercel-dns.com`) is confirmed resolving in DNS. Verify with `nslookup [slug].covos.app` or `dig [slug].covos.app`.
- [ ] Vercel domain alias for `[slug].covos.app` is added to the project and shows status "Valid Configuration" in the Vercel dashboard.

### Application Gates

- [ ] Admin user account created for the new tenant admin. Login at `[slug].covos.app/login` succeeds. User is assigned admin role. Session is tenant-isolated (no GHM data visible, no cross-tenant data leak).
- [ ] Admin Onboarding Wizard completes all 7 steps at `[slug].covos.app/admin-setup`. Company name, logo, and brand colors are set and persist after wizard close. Dashboard renders with tenant branding.
- [ ] Settings → Wave → shows the new tenant's company name in the banner and connects successfully with `WAVE_API_KEY_[SLUG]`. (Skip if new tenant does not use Wave.)
- [ ] Settings → Branding → logo upload succeeds. Uploaded logo appears in nav and on login page within 30 seconds (no Vercel Blob permission error).
- [ ] A test lead can be created manually via New Lead dialog and appears on the pipeline board, isolated to the tenant's database.
- [ ] A test client can be created and appears in the client portfolio. The client detail page loads all tabs without errors (check browser console — zero 500 errors).
- [ ] A test task can be created, assigned, and marked complete. The task appears in the dashboard task queue.

### Email Gates

- [ ] Send a test notification (e.g., trigger a password reset email at `[slug].covos.app/auth/forgot-password`). Email arrives from the correct sending domain: `covos.app` (for new tenants), not `ghmmarketing.com`. Verify sender name matches `tenant.fromName`.
- [ ] Report email delivery: manually trigger `POST /api/reports/generate` for a test client and then `POST /api/email/send-report`. Email arrives with correct tenant branding in footer and subject line.

### DocuSign Gates (if applicable)

- [ ] `DOCUSIGN_API_KEY` and `DOCUSIGN_ACCOUNT_ID` are set in Vercel for the new tenant's deployment environment. `POST /api/signatures` with a test PDF returns HTTP 200 (not 503 "DocuSign not configured"). DocuSign sandbox envelope is visible in the DocuSign developer console.
- [ ] DocuSign webhook route `POST /api/webhooks/docusign` is registered in DocuSign Connect configuration pointing at `[slug].covos.app/api/webhooks/docusign`. A completed envelope triggers status update to "signed" in COVOS SignatureEnvelope record.

### Commercial Gates

- [ ] Monthly invoice is configured in Wave for the new tenant (retainer amount, billing cycle). First invoice generated successfully via Wave — not blocking production but required before the first billing date.
- [ ] TENANT_PROVISIONING.md offboarding checklist has been reviewed and the new tenant admin understands the data deletion process. (Prevents surprise at contract termination.)
- [ ] `docs/TENANT_PROVISIONING.md` is updated to reflect any new-tenant-specific configuration decisions made during this onboarding (new env var patterns, DNS variations, etc.).

### Support Gates

- [ ] A support contact and escalation path is defined for the new tenant. They know who to reach and how. (David is not a sustainable support-alone model past 3 tenants.)
- [ ] A one-page "Day 1 for your team" guide has been written for the new tenant's admin to distribute internally — covering login URL, role structure, how to create tasks, how to access reports. This does not need to be polished — it needs to exist so David is not the default trainer for every new user.

---

## Appendix: Build Status Summary

As of February 28, 2026 (commit `8b028a0`):

| Status | Count | Groups |
|--------|-------|--------|
| ✅ Built | 39 | Revenue (4), Operations (4), Marketing (5), Intelligence (7), Communications (5), HR & People (4), Infrastructure (5), Customization (4), +Territory |
| 🔧 Partial | 22 | Spread across all 8 groups |
| 📋 Planned | 3 | Review generation, Dashboard layout personalization, (implicit: DocuSign production upgrade) |
| ⬜ Vision | 18 | Time tracking, SOP library, org chart, hiring pipeline, custom fields, API access, disaster recovery docs, video calls, SMS, email campaigns (partially), workflow builder, 1099/W-2, quote builder |

The platform is approximately 47% built against its full 82-category vision. The built categories represent a coherent, sellable MVP for a local SEO agency — they are not evenly distributed; they cluster in Revenue, Intelligence, and Marketing, which is the correct prioritization for a platform selling at $2,400/mo to local service businesses.

---

*Document status: DRAFT. Requires David review and sign-off before ACCEPTED. ARCH-002 sign-off should be resolved concurrently.*
*Review at: Sprint 35 (estimated May 2026) — coincides with ARCH-002 scheduled review.*
*Next document in ARCH series: ARCH-004 (TBD — likely covering API gateway design or schema separation if trigger conditions from ARCH-002 are met).*

---

## Appendix B: Module Dependency Map

Understanding which modules depend on others is critical for sequencing build work without creating rework cycles. The following dependency relationships are the most consequential.

**Multi-Tenant Engine is the root dependency.** Every other module in the system relies on `getTenant()` / `requireTenant()` for its data isolation guarantee. Any module that ships before the tenant engine is hardened risks carrying a GHM-specific assumption that has to be retroactively extracted (as happened with Sprint 28's ~50-string extraction pass). The Sprint 30 hardening work closed the obvious gaps; ARCH-002 documents the mitigation layer for the remaining structural risk.

**Commission Engine depends on Wave Integration.** The Commission Engine generates `PaymentTransaction` records that surface in the Approvals tab and ultimately require a human-approved Wave AP payment to execute. Wave Integration must be live and per-tenant before Commission Engine can be meaningfully used by a second tenant. This is why the Wave per-tenant scaffolding (Sprint 29-C) preceded any Commission Engine expansion.

**AI Layer is a horizontal dependency.** Six modules route through `callAI()`: Content Studio, Reporting (narrative), Global Search, Task System (intelligence scoring), GBP (GMB post drafting), and Website Studio (implied via SCRVNR). Any model-router change or cost-tracker update in `src/lib/ai/` has blast radius across all six. The model router's complexity analyzer routes requests between Claude Haiku, Sonnet, and Opus based on query complexity — this is the primary cost control mechanism.

**DocuSign depends on Document Vault and Client Management.** The `SendForSignatureDialog` operates in two modes: vault-file mode (file already in vault) and freeform mode (file URL provided). The `SignaturesTab` on the client detail page needs `SignatureEnvelope.clientId` to be set, which requires the Client model to exist. The webhook-completion handler auto-saves signed PDFs back to the vault via Vercel Blob. All three systems must be live for the end-to-end flow to work.

**Reporting depends on AI Layer, GBP Integration, and the client data model.** Report generation pulls data from seven sources (rankings, citations, GBP, tasks, health score, churn risk, invoice history) and sends them through `callAI()` for narrative generation. If any upstream data source is empty (e.g., no GBP connection), the report section renders with a graceful degraded state rather than failing.

**Alert Engine depends on GBP Integration and Rank Tracking.** The five seeded alert rules fire on GBP metric drops and keyword ranking changes. The engine is functionally dormant for a new tenant without GBP OAuth connected and rank tracking running. This means the Alert Engine has implicit dependency on GBP OAuth approval from Google — a manual step with a 1–3 week lead time that should be submitted early in every new tenant onboarding.

**Email System depends on Resend domain verification.** The `covos.app` sending domain is verified (INFRA-001, February 27, 2026). GHM's `ghmmarketing.com` is separate. A new tenant using a custom sending domain (e.g., `theiragency.com`) requires a new Resend domain verification cycle — DNS records added, Resend verification triggered, status confirmed — before transactional emails will deliver. This takes 15–30 minutes but must happen before the first password reset or report delivery email for that tenant.

---

## Appendix C: Modules Not in the 82-Category Vision (But Built)

The following modules are fully built but do not map cleanly to any of the 82 categories listed above. They are documented here to ensure the vision map is complete and the gap is intentional.

**Bug Report System.** Any authenticated user can submit a bug report with automatic capture of console errors, network errors, and session data. Admins see all reports with status/priority management. This is an internal ops tool, not a customer-facing feature — it belongs to Infrastructure but is distinct enough that it was excluded from the tenant-facing module map.

**PM Task Import (Sprint 20).** A one-time migration wizard supporting Basecamp, Asana, ClickUp, Monday.com, Trello, and CSV/Excel. Credentials are cleared post-import. This is a migration utility, not an ongoing integration — it exists to reduce friction when a new agency migrates from an existing PM tool to COVOS.

**Dashboard Usage Analytics (internal).** `DashboardEvent` tracking with feature heatmap, DAU chart, and per-user activity view — admin-only. This is COVOS platform telemetry, not a customer-facing analytics feature. It informs product decisions about which features are used and which are ignored.

**Upsell Detection Engine.** `GET /api/upsell/detect` analyzes client signals (missing services, health decline, competitive gaps) and surfaces upsell recommendations. This is partially a CRM Revenue module (Revenue Forecasting adjacent) and partially an Intelligence module — it defies clean categorization in the 82-item map but is a meaningful revenue-generation tool for any agency using COVOS.

---

## Appendix D: Key Technical Decisions Inherited by ARCH-003

These decisions were made before this document and constrain the build sequence described in Section 3. They are documented here for context, not for re-litigation.

**`prisma db push` only — no `prisma migrate dev`.** Migrations are applied directly against each tenant's Neon database. This is intentional for a development/MVP phase — migration files are not tracked. When COVOS reaches multi-tenant scale with production SLAs, this decision should be revisited (ARCH-002 trigger condition: second paying tenant). Until then, `prisma db push` is the correct protocol.

**NextAuth v5 App Router pattern.** The auth system uses NextAuth v5 with the App Router pattern (`auth()` in server components, `useSession()` in client components). This is non-negotiable without a full auth migration. The TOTP, rate limiting, and CSRF layers were built on this foundation in Sprint 1.

**Vercel Blob for all binary storage.** Logos, vault files, and signed PDFs all land in Vercel Blob. The blob store is currently shared across tenants (files are namespaced by path, not by separate stores). For a second paying tenant, files land in the same blob store but under different path prefixes. This is acceptable for the near term; a per-tenant Blob store isolation strategy should be documented before tenant three.

**`isElevated()` for all role checks — never raw string comparisons.** This is an absolute constraint enforced by GHM project instructions. `isElevated()` covers both `admin` and `manager` roles. Any new feature that gates on elevated access must use this utility.

**No raw `anthropic.messages.create()` outside `src/lib/ai/`.** All AI calls route through `callAI()` in `src/lib/ai/index.ts`. This enforces cost tracking, model routing, and system prompt consistency. Any new AI feature added during the Section 3 roadmap must follow this pattern.

**`SALARY_ONLY_USER_IDS = [4]` is hardcoded and intentional.** Gavin (userId=4) is a salaried employee who must never have commissions or management fees generated for him. This guard is in every payment generation path and must never be removed or generalized to a configuration field. It is a business rule, not a system default.

---

*End of ARCH-003 DRAFT.*
