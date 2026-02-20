# GHM DASHBOARD — MASTER STATUS
**Single source of truth. All other status files are archived.**  
**Last Updated:** February 20, 2026 — API integration ecosystem blueprinted (DataForSEO + NAP + GBP + Ads + GoDaddy)

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

### Client Onboarding Portal — SPEC COMPLETE, READY TO BUILD
**Spec:** `D:\Work\SEO-Services\specs\ONBOARDING_PORTAL_SPEC.md` (850 lines)
**Effort:** ~27 hours | **Priority:** HIGH — blocks partner launch

| Phase | Tasks | Hours | Status |
|-------|-------|-------|--------|
| 1. Foundation | Schema (OnboardingToken, OnboardingSubmission) + layout + wizard shell | 4 | 🔴 TODO |
| 2. APIs | Token gen, form load/save/submit, pre-fill from lead | 5 | 🔴 TODO |
| 3. Client Form | Steps 1-5 + auto-save + confirmation page | 9 | 🔴 TODO |
| 4. Dashboard | Partner link gen, ops queue, submission detail + checklist | 7.5 | 🔴 TODO |
| 5. Polish | Notifications, mobile responsiveness, error states | 4.5 | 🔴 TODO |

### Wave Payments Integration — SPEC COMPLETE, READY TO BUILD
**Spec:** `D:\Work\SEO-Services\specs\WAVE_PAYMENTS_BLUEPRINT.md` (630 lines)
**Audit:** `D:\Work\SEO-Services\specs\CONTRACT_AUDIT_AND_PAYMENTS.md`
**Effort:** ~34 hours | **Priority:** HIGH — enables billing, kills Gusto

| Phase | Tasks | Hours | Status |
|-------|-------|-------|--------|
| W1. Wave Setup | Manual: account, BofA, payroll, API creds | 2 | 🔴 TODO (David/Gavin) |
| W2. Schema + Library | Prisma changes + lib/wave/ GraphQL client | 4 | 🔴 TODO |
| W3. Invoice Automation (AR) | Monthly invoicing, webhooks, overdue escalation | 8 | 🔴 TODO |
| W4. Partner Payments (AP) | Bill gen, vendor sync, cron integration | 4 | 🔴 TODO |
| W5. Dashboard UI | Financial overview, billing tab, enhanced earnings | 12 | 🔴 TODO |
| W6. Settings + Polish | Sync status, error handling, constants | 3 | 🔴 TODO |
| W7. Kill Gusto | Verify, migrate, cancel | 1 | 🔴 TODO (after W4 verified) |

### API Integration Ecosystem — SPEC COMPLETE, READY TO BUILD
**Spec:** `D:\Work\SEO-Services\specs\API_INTEGRATION_BLUEPRINT.md` (1,124 lines)
**Effort:** ~56 hours | **Priority:** HIGH — completes intelligence engine, eliminates BrightLocal

| Sprint | Tasks | Hours | Status |
|--------|-------|-------|--------|
| I1. Provider Refactor + Cache | Extract providers, shared cache + cost tracking | 6 | 🔴 TODO |
| I2. DataForSEO SERP | Local rank tracking, Keywords tab, rank clusters | 12 | 🔴 TODO |
| I3. NAP Citation Scraper | 35 directory adapters, Citations tab, health sentry | 10 | 🔴 TODO |
| I4. Google Business Profile | OAuth, reviews, insights, posts, Local Presence tab | 8 | 🔴 TODO (needs Google approval) |
| I5. Report Generator Upgrades | Rank/citation/GBP/perf sections in client reports | 6 | 🔴 TODO |
| I6. Prospect Audit Enrichment | Rank data + citation health in sales audits | 4 | 🔴 TODO |
| I7. Google Ads + GoDaddy | Campaign data + domain deployment | 6 | 🔴 TODO |
| I8. Settings + Admin Dashboard | Integration health, cost dashboard, cache stats | 4 | 🔴 TODO |

**BrightLocal cancellation gate:** After I2 + I3 verified (rank data matching + NAP scraper working)

### Sales Launch — Dashboard Integration (See SALES_INTEGRATION_PLAN.md for full spec)

**Phase A: Foundation (Schema + Core Logic) — CRITICAL, everything depends on this**
| ID | Task | Status |
|----|------|--------|
| A1 | Schema: `lockedResidualAmount` + `closedInMonth` on ClientProfile | 🔴 TODO |
| A2 | Schema: Residual tier config (company-wide $200/$250/$300 thresholds) | 🔴 TODO |
| A3 | Logic: Tiered residual calculation with lock-at-close | 🔴 TODO |
| A4 | Logic: Auto-lock residual on lead → won transition | 🔴 TODO |
| A5 | Schema: `upsell_commission` payment type | 🔴 TODO |
| A6 | Logic: Upsell commission generation on product sale (10%) | 🔴 TODO |
| A7 | Logic: Rolling 90-day close rate calculator | 🔴 TODO |

**Phase B: Prospect Sales Tools — HIGH, the sales team's weapons**
| ID | Task | Status |
|----|------|--------|
| B1 | API: `/api/prospect-audit/generate` (domain + competitor analysis) | 🔴 TODO |
| B2 | Template: Branded audit report (HTML, shareable) | 🔴 TODO |
| B3 | UI: "Generate Audit" button on lead detail sheet | 🔴 TODO |
| B4 | UI: "New Prospect Audit" in pipeline header | 🔴 TODO |
| B5 | DB: Store audit results linked to lead record | 🔴 TODO |
| B6 | API: `/api/prospect-demo/generate` (HTML demo from audit data) | 🔴 TODO |
| B7 | Template: Branded demo page with prospect's real data | 🔴 TODO |
| B8 | Deploy: Temp Vercel preview URLs for demos (~2 min build) | 🔴 TODO |
| B9 | UI: "Create Demo" button on lead detail (requires audit first) | 🔴 TODO |
| B10 | Cleanup: Cron to expire old demo deployments | 🔴 TODO |

**Phase C: Dashboard UI Enhancements — HIGH, makes dashboard match the business**
| ID | Task | Status |
|----|------|--------|
| C1 | UI: Territory banner on pipeline/leads page | 🔴 TODO |
| C2 | UI: Territory stats card on sales dashboard | 🔴 TODO |
| C3 | UI: Rolling 90-day close rate on sales dashboard | 🔴 TODO |
| C4 | UI: Production threshold warnings (admin + rep views) | 🔴 TODO |
| C5 | UI: CompensationConfigSection — tier config fields | 🔴 TODO |
| C6 | UI: My Earnings — tiered breakdown with locked rates | 🔴 TODO |
| C7 | UI: My Earnings — upsell commission line items | 🔴 TODO |
| C8 | UI: Gavin's profitability — use actual locked rates | 🔴 TODO |
| C9 | UI: Earnings projection ("your book will be worth $X by...") | 🔴 TODO |

**Phase D: Polish & Sales Enablement — MEDIUM**
| ID | Task | Status |
|----|------|--------|
| D1 | Audit history on lead detail | 🔴 TODO |
| D2 | Demo history on lead detail | 🔴 TODO |
| D3 | Shareable audit link (public, no auth required) | 🔴 TODO |
| D4 | Audit → Demo one-click workflow | 🔴 TODO |
| D5 | Territory map visualization (simple/static) | 🔴 TODO |

**Non-Dashboard Sales Enablement (External Collateral)**
| ID | Task | Status |
|----|------|--------|
| S3 | Digital Brochure — one-pager, phone/Zoom optimized | 🔴 TODO |
| S4 | Recruiting Comp Sheet — earnings projections for candidates | 🔴 TODO |
| S5 | Territory Map — initial definitions for first 4 reps | 🔴 TODO |
| S6 | Sales Agreement Template — contractor terms | 🔴 TODO |
| S7 | Job Ad — draft and post | 🔴 TODO |

### Commission System Validation
- End-to-end test with live client
- Manually trigger monthly cron to verify residual generation
- Verify dashboard widgets populate

### Other Pending (Lower Priority)
- BUG-005: ✅ DONE | BUG-006: ✅ DONE
- Pipeline Filter UX refinement
- Content Library → Calendar Scheduling
- Content CTA Enforcement
- Task Pipeline UX: ✅ ALL DONE (schema, API, UI, kanban, transitions, history)
- Voice System — Sardonic Micro-Copy Layer (Low)
- TeamFeed Multimedia (Low)

---

## 🟢 INFRASTRUCTURE (When Time Allows)

- Client Portal migration
- Error monitoring (Sentry)
- Structured logging
- Security hardening (2FA, rate limiting)
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

**This file (`STATUS.md`)** — Single source of truth for project status.

**Specs (reference when building):**
- `SALES_INTEGRATION_PLAN.md` — Full gap analysis, schema changes, API specs, UI requirements for sales features
- `INTEGRATION_STRATEGY.md` — API selection, enrichment, scaling, caching
- `COMMISSION_SYSTEM_SPEC.md` — Commission structure, DB schema, UI designs
- `EDIT_AND_TASKS_SPEC.md` — Edit client + bulk task management
- `BUILD_PLAN.md` — Master build plan + Website Studio status
- `QUICK_REFERENCE.md` — API keys, env vars, deployment info
- `D:\Work\SEO-Services\specs\ONBOARDING_PORTAL_SPEC.md` — Client onboarding portal (token-auth form, wireframes, 21 tasks)
- `D:\Work\SEO-Services\specs\WAVE_PAYMENTS_BLUEPRINT.md` — Wave payments integration (schema, wireframes, 30 tasks)
- `D:\Work\SEO-Services\specs\CONTRACT_AUDIT_AND_PAYMENTS.md` — Contract claims audit + payments architecture narrative
- `D:\Work\SEO-Services\specs\API_INTEGRATION_BLUEPRINT.md` — API ecosystem (DataForSEO, NAP, GBP, Ads, GoDaddy, 56 hrs)

**Business operations:**
- `D:\Work\SEO-Services\SALES_OPERATIONS.md` — Canonical sales comp, territory, hiring manual
- `D:\Work\SEO-Services\CLIENT_AGREEMENT.md` — Client service agreement (month-to-month, $2,400/mo)
- `D:\Work\SEO-Services\CLIENT_ONBOARDING_FORM.md` — Onboarding form content (source for portal spec)
- `BUSINESS_DNA.yaml` — Company identity, market, ops, priorities

---

## 🔒 CRITICAL CONSTRAINTS (Always Enforce)

- **DB drift:** NEVER run `prisma migrate dev` — use `prisma db push` only
- **"master" stays as DB enum** — UI shows "Manager" via ROLE_LABELS
- **David's account = admin role** in Neon DB
- **Admin hierarchy:** admin > master > sales, `isElevated()` = admin|master
- **TypeScript must be clean** — run `npx tsc --noEmit` before closing any sprint
