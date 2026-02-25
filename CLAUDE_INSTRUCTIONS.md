# GHM DASHBOARD — CLAUDE INSTRUCTIONS
**Read this file first. Every session. No exceptions.**
**Last Updated:** February 24, 2026

---

## §1 WHAT THIS PROJECT IS

GHM Dashboard is a unified agency intelligence platform for GHM Digital Marketing Inc — a digital SEO agency charging $2,400/mo per client, month-to-month. The dashboard handles the full agency stack: lead pipeline, client management, task management, billing (Wave API), content studio, commissions, team feed, file vault, and reporting.

**Tech stack:** Next.js 14 (App Router) · TypeScript · Prisma · Neon PostgreSQL · Tailwind · shadcn/ui · Wave API · Ahrefs API · Google Business Profile API

**Production URL:** ghm.covos.app (multi-tenant infrastructure live on covos.app)

**Owner:** Gavin (GHM). David = effective COO/operator, builds and runs the system.

---

## §2 BOOTSTRAP SEQUENCE (mandatory every session)

Load these files in order before any code or file changes:

```
1. This file                                     ← you are here
2. STATUS.md                                     ← current sprint + critical constraints
3. BACKLOG.md                                    ← all open work, tiered by priority
4. CHANGELOG.md (first 60 lines)                 ← recent history, avoid re-doing work
```

Output this verification block before any work:

```
BUSINESS SESSION INITIALIZED
Environment: GHM Dashboard
✅ CLAUDE_INSTRUCTIONS.md loaded
✅ STATUS.md loaded
✅ BACKLOG.md loaded
✅ CHANGELOG.md loaded
Last commit: [read from STATUS.md or CHANGELOG.md]
Ready to proceed.
```

If any file fails to load, stop and tell the user which file is missing. Do not proceed with assumptions.

---

## §AGENT_MODE — Cowork Autonomous Sessions

If operating as a Cowork agent (not a Chat session):

1. Load `D:\Work\SEO-Services\ghm-dashboard\AGENT_PROTOCOL.md` (GHM override)
2. Load `D:\Work\AGENT_PROTOCOL.md` (business environment base)
3. Load the sprint blueprint specified in the session brief
4. **Skip the interactive verification checkpoint** — proceed directly to execution
5. Follow the Agent Lifecycle defined in `D:\AGENT_ARCHITECTURE.md §4`
6. End every session with MORNING_BRIEFING.md and git push

**GHM-specific rules always active in agent mode:**
- `SALARY_ONLY_USER_IDS = [4]` — never generate Gavin commissions or fees
- `npx tsc --noEmit` must pass before any commit (zero new errors)
- `prisma db push` only — never `prisma migrate dev`
- Docs before git — always (BACKLOG → CHANGELOG → STATUS → then commit)
- No raw `anthropic.messages.create()` outside `src/lib/ai/`
- No raw role string comparisons — always `isElevated()`

Templates: `D:\Dev\TEMPLATES\` — MORNING_BRIEFING_SCHEMA.md, BLOCKED_SCHEMA.md, AGENT_READY_BLUEPRINT.md

---

## §3 SYNC PROTOCOL (non-negotiable)

"Sync, commit, and push" means exactly this sequence — no shortcuts:

1. **BACKLOG.md** — delete every item that shipped this session (no ✅, just delete)
2. **CHANGELOG.md** — add a row for each shipped item: `| Date | commit | What shipped |`
3. **STATUS.md** — update the `Last Updated:` header line
4. `git add -A`
5. `git commit -m "feat/fix/docs: description"`
6. `git push`

**Docs before git. Always. No exceptions.** The full protocol is in `SYNC_PROTOCOL.md`.

---

## §4 CRITICAL CONSTRAINTS (read before every code change)

- **Gavin (userId=4) is SALARY ONLY.** `SALARY_ONLY_USER_IDS = [4]` is enforced in code. Never generate commissions or fees for Gavin. Never change this.
- **Wave API** handles all real money movement. Commission engine generates `PaymentTransaction` records → David/Gavin approve in Approvals tab → Wave AP sends actual payment. Never bypass the approval step.
- **Multi-tenant:** `src/lib/tenant/` handles tenant detection from subdomain. Do not hardcode GHM-specific logic outside the tenant registry.
- **TypeScript strict:** Run `npx tsc --noEmit` before every commit. Only pre-existing errors in `scripts/basecamp-crawl.ts`, `scripts/import-wave-history.ts`, and `src/lib/basecamp/client.ts` are acceptable — do not introduce new ones.
- **Database:** Always use `prisma/schema.prisma` + `npx prisma db push` for schema changes (no migrations in dev). For production schema changes, document the change in STATUS.md.

---

## §5 FILE MAP (where things live)

```
prisma/schema.prisma                              Data model — source of truth
src/app/(dashboard)/                              All dashboard pages (App Router)
src/app/api/                                      All API routes
src/components/leads/                             Lead pipeline + filter bar
src/components/clients/                           Client portfolio + detail
src/components/team-feed/                         TeamFeed + Sidebar
src/components/dashboard/DashboardLayoutClient.tsx Layout shell + keyboard shortcuts
src/components/search/AISearchBar.tsx             Global Cmd+K search (portal-based)
src/components/ui/keyboard-shortcuts-help.tsx     ? overlay (Sprint 6)
src/hooks/use-modifier-key.ts                     OS-aware ⌘/Ctrl detection
src/hooks/use-keyboard-shortcuts.ts               Global shortcut registration (Sprint 6)
src/lib/tenant/                                   Multi-tenant infrastructure
src/lib/wave/                                     Wave API client + helpers
src/lib/basecamp/                                 Basecamp API client (task import)
scripts/                                          One-off scripts (enrichment, import, crawl)
BUSINESS_DNA.yaml                                 Agency identity, positioning, team comp
VISION.md                                         Product vision — read before UI decisions
COMMISSION_SYSTEM_SPEC.md                         Commission engine rules
CLIENT_AGREEMENT.md                               Contract language (PPC/SEO scope)
SYNC_PROTOCOL.md                                  Full sync/commit rules
```

---

## §6 BACKLOG PRIORITY TIERS

| Tier | Meaning |
|------|---------|
| 🔴 MUST | Blocking client or rep operations right now |
| 🟠 SHOULD | Blocking productization, investor pitch, or next client tier |
| 🟡 WOULD | High value, no current blocker |
| ⚪ FUTURE | Vision items, deferred until scale |

Always work the highest tier first unless the user specifies otherwise.

---

## §7 CODE STANDARDS

- **No mocks, stubs, or placeholders.** If a feature requires real data, build the real endpoint.
- **No temporary solutions.** Every fix should be the correct fix, not the quick one.
- **Error handling everywhere.** API routes must return structured `{ success, data, error }` responses. UI must handle loading, error, and empty states.
- **Empty states are required.** Every list/table/board needs a real empty state (not just a blank area). See leads kanban for the pattern.
- **Optimistic UI** for status changes (tasks, lead stage moves) — no loading spinners for simple state transitions.
- **Mobile-aware.** The dashboard is primarily desktop but must not break on tablet.

---

## §8 SPRINT HISTORY (summary)

All sprints 1–6 are shipped. See CHANGELOG.md for full detail.

- **Sprint 1:** Security hardening, Sentry, structured logging
- **Sprint 2:** Personnel system (positions, onboarding wizard, contractor entities)
- **Sprint 3:** Operations intelligence (health scores, team feed vault, GBP OAuth)
- **Sprint 4:** Intelligence layer (MoM/YoY trends, churn risk, health trajectories, COVOS multi-tenant)
- **Sprint 5:** Data export (leads + clients CSV) + user activity admin tab
- **Sprint 6:** Search bar portal fix, Team Feed modifier key fix, pipeline filter debt (deal value, days in stage, lead source), keyboard shortcuts system

**Current sprint:** 7 — Sales Enablement Polish (Save Searches, Audit PDF PPC section, Brochure PDF PPC version). Full spec in `SPRINT7_HANDOFF.md`.

---

## §9 ARCHITECTURE DECISIONS (don't relitigate these)

- **Search bar uses `createPortal(document.body)`** — escapes overflow:hidden layout containers. Do not revert to modal/cmdk approach.
- **`useModifierKey()` hook** — all keyboard shortcut hints use this. Never hardcode ⌘ or Ctrl.
- **Commission engine is webhook-primary, cron-safety-net.** Wave `invoice.paid` webhook triggers immediately. Monthly cron on the 5th catches anything missed.
- **Client Health Score** is a composite of 5 modules — visible as a dot everywhere a client appears. Do not simplify to a single-module calculation.
- **No direct Wave AP payments from code** — all payments surface as `PaymentTransaction` records in Approvals tab first. Human approval required.
