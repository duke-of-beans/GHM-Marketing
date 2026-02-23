# GHM DASHBOARD — PRODUCT BACKLOG
**Last Updated:** February 23, 2026
**Owner:** David Kirsch

This file contains ONLY open work. When an item ships:
1. Add a row to CHANGELOG.md (date + commit + summary)
2. Delete the item from this file
3. Update STATUS.md "Last Updated" line
4. Then commit

Completed history lives in CHANGELOG.md. Never put ✅ items here.

---

## 🗺️ RECOMMENDED SPRINT SEQUENCE (February 23, 2026)

Foundation → out. Each sprint unblocks the next.

| Sprint | Focus | Items | Size | Why This Order |
|--------|-------|-------|------|----------------|
| 1 | Production Foundation | Security Hardening + Sentry + Structured Logging | ~1 session | Gates all external use. Must be done before reps, new clients, or second agency. |
| 2 | Ops Spine Completion | Client Portal Decision + Ops Sprint 6 (Reporting Pipeline) | ~1.5 sessions | Fulfills contract promise of monthly delivery. Portal ambiguity off the board. |
| 3 | Bulk Operations | Ops Sprint 7 (bulk content/task/pipeline) | ~1 session | Team can't scale without batch actions. Additive to existing systems. |
| 4 | Intelligence Layer | Ops Sprint 8 (MoM/YoY trends, churn risk, health trajectories) | ~1 session | Synthesizes all collected data. Turns dashboard into indispensable ops platform. |
| 5 | Data Access + Admin Visibility | Data Export + User Activity/Session Stats | ~1 session | External data requests + internal usage intelligence. |
| 6 | UX Completeness | Static Empty States + Pipeline Filter UX debt + Keyboard Shortcuts | ~1 session | Closes gap between functional and polished. |
| 7 | Sales Enablement Polish | Audit PDF PPC + Brochure PPC + Save Searches | ~0.5 sessions | Completes ITEM-001 scope. Power-user filter layer. |
| 8 | Content Power | Bulk Content Ops + Competitor Tracking Manual + Custom Report Builder | ~1 session | Makes content and competitive intelligence practical at scale. |
| 9 | COVOS Self-Service | COVOS Admin Onboarding Wizard | ~2 sessions | Requires Sprint 1 security first. Unlocks white-label productization. |

**Background (no code needed, external waits):**
- W7 Kill Gusto — run parallel Wave payroll cycle, then ops decision
- I4 GBP OAuth — monitor Google API Console approval

---

## 🧭 HOW TO PICK WORK

Pick the top item in your current tier that unblocks the next thing.

| Tier | Meaning |
|------|---------|
| 🔴 MUST | Blocking client or rep operations right now |
| 🟠 SHOULD | Blocking productization, investor pitch, or next client tier |
| 🟡 WOULD | High value, no current blocker |
| ⚪ FUTURE | Vision items, deferred until scale |

---

## 🔴 MUST — Active Blockers

### W7 — Kill Gusto
**Context:** Wave AP/payroll is fully built and validated. Gusto is running in parallel.
**Gate:** Complete at least one successful payroll cycle through Wave → confirm Wave covers payroll + contractor 1099 → cancel Gusto.
**Note:** Gavin is W-2/2% shareholder in Gusto. Do NOT migrate mid-year. Plan: close 2026 on Gusto, migrate to Wave Payroll Jan 2027 alongside equity restructure. Arian + future reps are 1099 via dashboard → Wave bills, no Gusto needed.
**Action:** Ops decision, no code. ~30 min once gate is cleared.

### I4 — Google Business Profile OAuth (external wait)
**Context:** GBP integration fully built — OAuth flow, reviews, insights, posts, Local Presence tab. App in Testing mode with David + Gavin as test users.
**Gate:** Google API Console approval for external app status.
**Action:** Monitor approval → flip from Testing to Published → verify OAuth flow with a real client listing. ~1 hr once approved.

---

## 🟠 SHOULD — Productization & Growth

### Ops Layer Sprints 6–8
**Context:** The ops-layer sprint plan (commit 04d2a92) laid out 9 sprints. Sprints 0–5 shipped. Sprints 6–8 were never committed.
**Sprint 6 — Reporting Pipeline:** Scheduled monthly report generation, delivery queue, per-client schedule (1st/5th/15th), Resend delivery, delivery log on client record.
**Sprint 7 — Bulk Operations:** Bulk content approve/archive/assign, bulk task close, batch pipeline actions.
**Sprint 8 — Advanced Analytics + Insights:** Trend analysis, MoM/YoY comparisons, churn risk scoring, client health trajectory charts.
**Size:** ~1 session per sprint.
**Files:** `src/app/api/reports/schedule/`, `src/components/content/BulkActions.tsx`, `src/app/(dashboard)/analytics/`

### Client Portal — Activation Decision
**Context:** Feb 17 portal was built with portalToken auth but disabled via `.disabled` extensions due to a missing ClientProfile.portalToken field. The Feb 20 OnboardingToken portal may have superseded it.
**Current state — three files still disabled:**
- `src/app/(portal)/portal/page.tsx.disabled`
- `src/app/api/clients/[id]/generate-portal-token/route.ts.disabled`
- `src/app/api/email/send-portal-invite/route.ts.disabled`
**Decision needed:** If the old portal is still the right path → add `portalToken String? @unique` to ClientProfile, `prisma db push`, rename `.disabled` files. If superseded by OnboardingToken portal → delete disabled files and document the decision in CHANGELOG.md.
**Size:** ~1 hr decision + cleanup.

### Keyboard Shortcuts Layer
**Context:** Cmd+K global search exists. Page navigation shortcuts don't. Wanted since early sessions.
**Scope:** `G L` → Leads, `G C` → Clients, `N L` → New Lead, `N T` → New Task, `?` → shortcut hint overlay. Use `cmdk` library (shadcn already wraps it).
**Size:** ~2–3 hrs additive to existing search bar.

### COVOS Admin Onboarding Wizard
**Context:** Multi-tenant infrastructure is live (covos.app, TENANT_REGISTRY). This is the self-service onboarding a second agency would use to get onto the platform without GHM support. Spec documented in PRODUCTIZING_BACKLOG.md (commit c2a6daa).
**Scope:** Guided in-product wizard — API config, vendor selection, contractor/vendor setup, env var checklist (live UI showing which env vars are set/missing), role/permission briefing.
**Size:** ~2 sessions.
**Files:** `src/app/(dashboard)/settings/onboarding/` (new), `src/lib/tenant/`

### Security Hardening
**Context:** Flagged as medium priority across multiple sessions. Required before any external agency onboards.
**Scope:** 2FA for admin + master accounts (TOTP via `otplib` or NextAuth MFA hooks), rate limiting per user on auth endpoints, CSRF token verification on sensitive mutation routes, security headers audit (`CSP`, `X-Frame-Options`, `Referrer-Policy`) via `next.config.js`.
**Size:** ~1 session.

---

## 🟡 WOULD — High Value, No Current Blocker

### Reporting — Scheduled Delivery (Sprint 6 subset)
Reports are manually generated. Contract implies monthly delivery.
**Scope:** Per-client report schedule (1st, 5th, or 15th of month), delivery email + cc list, monthly cron, delivery log on client record.
**Size:** ~1 session.

### Advanced Filter Persistence + Save Searches
Pipeline filter bar has localStorage persistence. Next tier is named saved searches.
**Scope:** "Save this filter" button → names the current combo → chips above filter bar (e.g., "Hot leads - Austin") → per-user, persisted to DB, max 5 per user.
**Size:** ~2–3 hrs.

### Pipeline Filter — Remaining UX Debt
Major UX pass done Feb 22. Three items left from original spec.
**Scope:** "Lead Source" filter (organic/referral/discovery/import — in DB, not surfaced), "Deal Value" range slider, "Days in Stage" filter (stale leads > N days in current stage).
**Size:** ~2 hrs total.

### Audit PDF — Paid Search Opportunity Section
In original ITEM-001 scope, never built.
**Scope:** Add section to audit PDF — estimated monthly search volume for target keywords, competitor ad spend indicators (DataForSEO), "you're leaving X/mo in paid visibility on the table" framing.
**Size:** ~1 hr (template-driven).

### Digital Brochure — PPC/Ads Highlight
In ITEM-001 scope, never built. Brochure currently focuses only on SEO.
**Scope:** Add section to `src/app/(onboarding)/brochure/page.tsx` covering Google Ads management + PPC as part of the $2,400/mo package. Include mock campaign metrics.
**Size:** ~1 hr.

### Bulk Content Operations (Sprint 7 subset)
Content Studio manages items one at a time.
**Scope:** Checkbox multi-select on Content Studio list, bulk approve (master+ only), bulk archive, bulk assign.
**Size:** ~2 hrs.

### Competitor Tracking — Manual Add + Refresh
Competitors seeded at client creation, updated by scans. No manual refresh or manual add.
**Scope:** "Add Competitor" button (name + domain), "Remove Competitor", "Refresh Competitor Data" (re-runs enrichment on demand).
**Size:** ~2 hrs.

### Reporting — Custom Report Builder
Reports auto-generated from scan data. Power users want section control.
**Scope:** Section toggle UI before generation, per-client report template (save preferred sections), AI-written "Executive Summary" paragraph using scan delta data.
**Size:** ~1 session.

### Data Export — Leads + Clients → CSV/XLSX
Zero export capability currently.
**Scope:** "Export" button on Leads table (current filtered view → CSV), "Export" on Clients table, column picker, admin-only full DB export.
**Size:** ~3 hrs.

### Sentry Error Monitoring
No runtime error visibility in production.
**Scope:** `@sentry/nextjs` install + wizard config, source maps on deploy, alerts for error rate threshold + new types, user context (role, email) attached to events.
**Size:** ~1 hr setup.

### Structured Logging (Replace console.log)
Crons and API routes use `console.log` everywhere. No severity, no trace IDs.
**Scope:** Minimal structured logger (`log.info/warn/error` with JSON output), correlation IDs on API routes. Consider `pino`.
**Size:** ~2 hrs.

### Static Empty State Help Text
Noted in commit cb8dd9d. Current empty states are static.
**Scope:** Context-aware empty states in Leads, Clients, Content Studio — suggest next action with direct button (e.g., "Run a Discovery scan to import leads"). Pairs with AI search layer.
**Size:** ~2–3 hrs.

### User Activity / Session Stats (Admin View)
Discussed in Feb 18 copy audit session. No per-user session tracking exists.
**Scope:** Admin-visible stats — last login, login count, average session duration, pages visited. Likely needs a `UserSession` table or extension of `AuditLog`.
**Size:** ~1 session.

---

## ⚪ FUTURE — Vision & Scale

### Accessibility (WCAG 2.1 AA)
Required before enterprise sales. Start with keyboard navigation (highest ROI), then screen reader, focus indicators, high contrast mode. **Size:** ~1–2 weeks full audit + fix pass.

### Mobile-Optimized UX (Beyond Responsive)
Full-screen mobile kanban, touch-optimized lead cards with swipe actions (right = claim, left = dismiss), mobile-specific quick actions. **Size:** ~2–3 sessions.

### Native Mobile Apps (iOS + Android)
React Native with shared business logic. Expo for faster iteration.
**Prerequisite:** Security hardening + API documentation complete.

### White-Label / Multi-Agency Productization (Covos)
Multi-tenant infrastructure is live. Next tier: self-serve agency onboarding, per-tenant branding, per-tenant billing, tenant admin panel, data isolation audit.
**Prerequisite:** Vendor Flexibility Architecture ✅ complete. COVOS Admin Onboarding Wizard must ship first.
**Size:** 2–3 sessions for core self-serve flow; ongoing for billing and admin.
