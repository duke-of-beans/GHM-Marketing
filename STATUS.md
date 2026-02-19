# GHM DASHBOARD — MASTER STATUS
**Single source of truth. All other status files are archived.**  
**Last Updated:** February 19, 2026 (late night — integration strategy + backlog update)

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

### BUG-005: Dashboard Widgets Stale After Pipeline Changes — ✅ DONE
- Moving leads across pipeline (e.g. to "won") didn't update dashboard widgets (My Wins, etc.) in real-time
- **Root cause:** Next.js 14 Router Cache served stale RSC payloads on soft navigation; client-side widgets only fetched on mount
- **Fix (3-layer):** (1) `revalidatePath` on `/master`, `/sales`, `/leads` in leads PATCH API; (2) `RefreshOnFocus` component on both dashboard pages triggers `router.refresh()` on tab focus; (3) `useRefetchOnFocus` hook added to all self-fetching widgets (MyTasks, ManagementFees, Profitability, MyEarnings)

### BUG-006: Permission Management Missing Back Navigation — ✅ DONE
- In Settings → Permission Management, no 'back' button or 'X' to return to previous Settings view
- **Fix:** Added "Back to Settings" link with ArrowLeft icon on both `/permissions` and `/audit` pages, linking back to the correct Settings tab

### Pipeline Filter UX
- Make pipeline status collapsible in More Filters
- Rethink default visible filters (status, rep, territory, sort)
- Expand filter options from full Lead model fields

### Content Library → Calendar Scheduling
- Ability to schedule blog posts and other content directly from content library to a publishing calendar
- Ties into Website Studio deployment pipeline and GBP post publishing (once GBP API integrated)

### Content CTA Enforcement
- All generated content (briefs, blog posts, landing pages) should end with CTAs by default
- Update AI system prompts in content brief generator to always include CTA
- Add CTA template selection to content review queue

### Task Pipeline UX Overhaul (DISCUSSION NEEDED)
- Current task system lacks the visceral, satisfying flow that the sales pipeline kanban has. Tasks move through people and roles but the movement isn't visible or gratifying.
- **Core tension:** Some tasks are single-person (fix a bug), some are multi-person handoff chains (sales rep builds wireframe → manager approves/rejects with corrections → deployment). The current system doesn't distinguish these or make the handoff feel like forward momentum.
- **Vision:** A unified personal work queue that pulls from ALL sources — scheduled leads needing follow-up, urgent client management tasks, bug reports assigned to you, feature requests, stale leads, content awaiting review, wireframes awaiting approval. One place, prioritized, with clear "what's next" energy.
- **The handoff chain problem:** Website Studio already has a path (rep builds → admin approves → deploy), but it doesn't feel like a pipeline. Need kanban-style columns or a status progression that makes completing a step and kicking to the next person feel like movement. Visual feedback, maybe animations, definitely clear ownership transfer.
- **Role-aware task routing:** Tasks should know who can do what. A wireframe approval can only go to admin/master. A content brief can be assigned to any rep. Bug fixes route to admin. The queue should be smart about what shows up for whom.
- **Engagement hooks:** Progress indicators, streak tracking, completion celebrations, daily digest of "here's your plate today." Make people want to clear their queue.
- **Status:** Needs design discussion before implementation. This touches task system, notification system, role permissions, and potentially a new "workflow" abstraction layer.

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

### Strategic Product Features
- **Review Enhancement Engine** — Multi-prong approach to boosting client reviews. Real review generation (automated follow-up sequences to actual customers), synthetic reviews (AI-assisted drafting from real service experiences), hybrid strategies. Huge sales leverage — review count/rating directly impacts local pack ranking. Needs careful compliance design.
- **PPC Keyword Automation** — Google Ads integration beyond read-only. Automate keyword additions and negative keyword management based on search term reports. All changes validated by human before execution (approval queue, not fully autonomous). Ties into Google Ads API integration.
- **Lead Gen Studio** — Modular product like Website Studio and Content Studio. Lead generation as a packaged, repeatable service with its own workflow, templates, and tracking. Discovery engine feeds → outreach sequences → pipeline intake → conversion tracking.

### Platform Features
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
- `INTEGRATION_STRATEGY.md` — API selection, enrichment methodology, scaling costs, caching strategy, integration build priority
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
