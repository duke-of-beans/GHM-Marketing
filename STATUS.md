# GHM DASHBOARD — MASTER STATUS
**Single source of truth. All other status files are archived.**  
**Last Updated:** February 20, 2026 (early AM — task pipeline fully complete)

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
- 1 existing report in DB

### Permission System — Full Migration (Feb 20, 2026)
- 5-phase system: schema, API middleware, UI components, app-wide migration, documentation
- Phases 1-3: permission schema, presets, `withPermission()` API guard, `requirePermission()` server guard, audit logging
- Phase 4: All 16 API routes migrated from `requireMaster()`/`isElevated()` to `withPermission()` with proper 401/403 responses
- Routes migrated: tasks (approve, reject, request-changes, generate-brief, recalculate-priorities), upsell (detect, present, dismiss), reports (html, preview, generate), products CRUD, email (send-upsell, send-report), discovery (search, import)
- Client detail page migrated from `requireMaster()` to `requirePermission("manage_clients")`
- Zero `requireMaster()` calls remain in API routes; `isElevated()` retained only for data-scoping (correct)
- TypeScript: 0 errors
- Phase 5 (tutorial/docs updates) deferred — low priority

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

### Sales Launch Tools (Priority — See SALES_OPERATIONS.md)
| Priority | Item | Status |
|----------|------|--------|
| S1 | Prospect Audit Generator — "Generate Audit" button in dashboard, outputs branded competitive report from prospect domain | 🔴 TODO |
| S2 | Interactive Demo Generator — "Create Demo" button, spins up branded HTML demo with prospect's real data in ~2 min, used selectively on hot calls | 🔴 TODO |
| S3 | Digital Brochure — one-pager hitting differentiators, phone/Zoom optimized | 🔴 TODO |
| S4 | Recruiting Comp Sheet — one-pager with earnings projections for candidate recruitment | 🔴 TODO |
| S5 | Territory Map — initial territory definitions for first 4 reps | 🔴 TODO |
| S6 | Sales Agreement Template — contractor terms, comp structure, territory rules, residual terms | 🔴 TODO |
| S7 | Job Ad — draft and post to Indeed, LinkedIn, CommissionCrowd | 🔴 TODO |

### Commission System Updates (Dashboard)
- Update residual tiers in CompensationConfigSection to support tiered structure ($200/$250/$300 locked at close)
- Add upsell commission tracking (10% on website builds and consultations)
- Ensure sales role dashboard shows: pipeline, residual book, territory leads, audit/demo tools

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
- **Schema:** ✅ DONE — `assignedToUserId`, `assignedByUserId`, `startedAt`, `completedAt`, `statusChangedAt`, `estimatedMinutes`, `sortOrder` added to ClientTask; new `TaskTransition` model for status history; proper User FK relations; all pushed to Neon
- **Status Machine:** ✅ DONE — `src/lib/tasks/status-machine.ts` — 9 statuses (queued → in_progress → review → approved → deployed → measuring → complete, plus rejected/cancelled), validated transitions with role-based permissions, comment requirements for rejections/reopens
- **API - Queue:** ✅ DONE — `GET /api/tasks/queue` — personal queue with view modes (mine/team/unassigned), multi-sort (priority/due_date/updated/sort_order), status/priority filters, pagination, overdue detection, inline transition options per task
- **API - Transition:** ✅ DONE — `PATCH /api/tasks/[id]/transition` — status machine enforcer, validates transitions against rules, records TaskTransition history, sets timestamps (startedAt, completedAt, deployedAt) automatically
- **API - Assign:** ✅ DONE — `PATCH /api/tasks/[id]/assign` — role-aware assignment (sales can self-assign unassigned, managers can assign anyone)
- **API - Reorder:** ✅ DONE — `PATCH /api/tasks/reorder` — batch sort order update for drag-and-drop
- **UI - My Queue page:** ✅ DONE — `/tasks` route, server page + client component, list view + board (kanban) view, stats bar, filters (view/status/sort), view mode toggle
- **UI - Board (kanban) view:** ✅ DONE — 4-column kanban (Queued → In Progress → In Review → Approved), task cards with priority/category/overdue indicators
- **UI - Task detail sheet:** ✅ DONE — Slide-out Sheet with full task meta, description, timeline, all transition buttons, comment input for rejections/reopens, self-assign, transition history timeline
- **UI - Drag-and-drop reorder:** ✅ DONE — dnd-kit sortable rows in list view, persists via PATCH /api/tasks/reorder, "Manual Order" sort option
- **UI - Task creation form:** ✅ DONE — Dialog with client picker, title, description, category, priority, due date, estimate. POST /api/tasks auto-assigns to creator, records initial transition
- **UI - Transition history:** ✅ DONE — GET /api/tasks/[id]/history returns all transitions with user names. Detail sheet shows vertical timeline with from→to badges, comments, timestamps
- **Nav link:** ✅ DONE — "My Tasks" added to left nav (visible to all roles, between Dashboard and Find Leads)
- **Dashboard widget:** ✅ DONE — "View all →" link wired to `/tasks` page

### Voice System — Sardonic Micro-Copy Layer
- Centralized `src/lib/voice.ts` with all user-facing micro-copy (toasts, empty states, confirmations, loading, push notifications, tutorial copy)
- Tone: deadpan, sardonic, break-the-4th-wall. Never mean, never corny. Professional UI labels stay clean — voice lives ONLY in reward messages, toasts, tutorials, empty states, confirmations, loading moments.
- Replace browser `alert()`/`confirm()` with Sonner toasts + dialog components
- Randomized variant pools per category (same action ≠ same quip every time)
- Rewrite onboarding tutorial copy (20+ steps across sales/master flows)
- Wire push notification templates through voice system
- Priority: Low

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
