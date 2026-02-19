# GHM DASHBOARD — MASTER STATUS
**Single source of truth. All other status files are archived.**  
**Last Updated:** February 19, 2026 (evening sprint)

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
- ⚠️ **Needs:** Migrate existing content brief API to use `callAI()` (10-min job)

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
- 1 existing report in DB

---

## 🔴 ACTIVE SPRINT — February 19, 2026

### Quick Wins (Today)

| ID | Type | Description | Status |
|----|------|-------------|--------|
| BUG-002 | Bug | Login page renders wrong in dark mode after logout | ✅ DONE (was already fixed) |
| BUG-003 | Bug | Help button misaligned in left nav | ✅ DONE (emoji icon match) |
| BUG-004 | Bug | Pipeline status badge colors broken in dark mode | ✅ DONE (config had dark variants; fixed DR badge) |

### Website Studio (Remaining Build)

| Priority | Item | Status |
|----------|------|--------|
| P1 | Deploy button (Vercel API integration) | ✅ DONE (API + DeployButton component wired) |
| P2 | Verify `check_section` on SCRVNR adapter | ✅ DONE (runner + adapter both handle section_only) |
| P3 | DNA Lab UI (capture flow + override panel) | ✅ DONE (DnaLab.tsx fully built) |
| P4 | Live Sites panel (all clients, staleness alerts) | ✅ DONE (LiveSitesPanel + /live-sites route) |
| P5 | PageComposer dedicated job detail route | ✅ DONE (/clients/[id]/composer/[jobId]) |

### FEAT-003: My Tasks Dashboard Widget
- Role-personalized task widget on dashboard home
- Sales: sees tasks for their assigned clients
- Manager/Admin: sees all active tasks across clients
- Overdue detection, priority badges, clickthrough to client
- API: `/api/tasks/dashboard` (role-filtered)
- Wired into both `/master` (grid widget) and `/sales` (standalone card)
- Status: ✅ DONE

---

## 🟡 NEXT TIER (After Sprint)

### Permission System (Phase 4-5 remaining)
- Phases 1-3 complete (schema, API, UI components)
- Phase 4: Replace role-based checks with permission checks across app
- Phase 5: Tutorial + documentation updates

### Commission System Validation
- End-to-end test with live client
- Manually trigger monthly cron to verify residual generation
- Verify dashboard widgets populate

### Pipeline Filter UX
- Make pipeline status collapsible in More Filters
- Rethink default visible filters (status, rep, territory, sort)
- Expand filter options from full Lead model fields

### TeamFeed Multimedia
- Emoji picker inline
- Image/GIF attachment support
- Giphy/Tenor search integration

---

## 🟢 INFRASTRUCTURE (When Time Allows)

- Client Portal migration (portalToken column + re-enable 3 disabled files)
- Error monitoring (Sentry)
- Structured logging (replace console.log)
- Security hardening (2FA for admin, rate limiting)
- Automated testing infrastructure
- Production deployment checklist verification

---

## ⚪ FUTURE ROADMAP (Not Blocking Anything)

- Voice profile system for AI content
- Advanced discovery (automated sourcing, ML scoring, nurture sequences)
- Work order PDF generation
- Advanced analytics (cohorts, churn prediction, territory heatmaps)
- Mobile native apps
- White-label multi-tenant platform
- Calendar/Slack/Zapier integrations
- Custom report builder
- Keyboard shortcuts / command palette
- Accessibility (WCAG 2.1 AA)
- Data export tools

---

## 📁 FILE INDEX

**This file (`STATUS.md`)** — Single source of truth for project status.

**Specs (still valid, reference when building):**
- `COMMISSION_SYSTEM_SPEC.md` — Commission structure, DB schema, UI designs
- `EDIT_AND_TASKS_SPEC.md` — Edit client + bulk task management spec
- `BUILD_PLAN.md` — Master build plan with all confirmed decisions + Website Studio status
- `QUICK_REFERENCE.md` — API keys, env vars, deployment info

**Archived (historical, do not use for current planning):**
- `MISSING_FEATURES_TODO.md` — Superseded by this file
- `FEATURE_ROADMAP.md` — Superseded by this file
- `PROJECT_STATUS.md` — Superseded by this file
- `OPERATIONAL_STATUS.md` — Superseded by this file
- `PHASE_3_POLISH_COMPLETE.md`, `PHASE4_CONTINUATION.md` — Session logs
- `UX_*.md` — Completed UX audit artifacts
- `DEPLOYMENT_*.md` — Deployment session logs
- `INLINE_HANDOFF.md`, `HANDOFF_PROMPT.md` — Old session handoffs
- `docs/PHASE_*.md` — Phase completion logs
- `docs/SESSION_*.md` — Session summaries

**Active session state:**
- `START_NEXT_SESSION.txt` — Last session closeout + quick context

---

## 🔒 CRITICAL CONSTRAINTS (Always Enforce)

- **DB drift:** NEVER run `prisma migrate dev` — use `prisma db push` only
- **"master" stays as DB enum** — UI shows "Manager" via ROLE_LABELS
- **David's account = admin role** in Neon DB
- **Admin hierarchy:** admin > master > sales, `isElevated()` = admin|master
- **TypeScript must be clean** — run `npx tsc --noEmit` before closing any sprint
