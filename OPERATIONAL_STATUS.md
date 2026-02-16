# GHM Dashboard — Operational Status

> Last updated: 2026-02-16
> Update this file at the end of each working session.

## Current Phase

**Back Cycle Phase 2: Competitive Scan Engine** — NOT YET STARTED

## What's Complete

### Front Cycle (Sales Pipeline) — ✅ COMPLETE
- Authentication with role-based access (master/rep)
- Territory management with geographic scoping
- Lead pipeline with drag-and-drop Kanban (7 visible columns)
- Lead enrichment: Outscraper, Ahrefs, PageSpeed Insights
- Smart CSV/XLSX import with territory matching, scoring, dedup
- Product catalog with MRR/ARR/one-time pricing
- Work order PDF generation and email delivery
- Team management with role assignments
- Analytics page with pipeline funnel charts
- Rep performance tracking and territory reports

### Back Cycle Phase 1 (Client Management) — ✅ COMPLETE
- Won-lead trigger auto-creates ClientProfile
- Reverse trigger: leaving Won → deactivates client, re-winning → reactivates
- Client portfolio page (health scores, task counts, domain counts)
- Client detail page (5-tab UI):
  - Scorecard (competitive scan results — empty until engine built)
  - Tasks (full workflow: queued → in-progress → in-review → approved → deployed → measured)
  - Domains (registration tracking, DNS/SSL status)
  - Notes (with pinned "client standards" for voice/style)
  - Reports (placeholder — populated by scan engine)
- Task CRUD with status transitions
- Note system with types (contact-log, standard, task-note)
- Error boundaries on all client pages

## What's Next

### Back Cycle Phase 2: Competitive Scan Engine
Build the engine that populates client scorecards and drives task generation:

1. **Scan Executor** — Scheduled job per client's `scanFrequency`
2. **Data Fetcher** — Reuse enrichment APIs for client + competitors
3. **Delta Calculator** — Compare current vs previous scan, client vs competitors
4. **Alert Generator** — Flag significant competitive changes
5. **Task Auto-Creator** — Convert gaps into `client_tasks` (source: competitive-scan)
6. **Health Score Updater** — Recalculate from fresh scan data

### Future Phases (Not Started)
- Content review queue (editor workflow)
- Client-facing monthly PDF reports
- Upsell detection from scan deltas
- Discovery engine (automated lead sourcing)
- Voice profile system (brand-consistent content)
- Client portal (self-service reporting)

## Known Issues

None currently. All builds passing clean.

## Recent Commits

```
9c61602 docs: add PROJECT_STATUS.md for session continuity
3ac3b72 fix: deactivate client profile when lead leaves won, reactivate on re-win
a1f201c fix: add won column to kanban, add client page error boundaries
fa790fd feat: back cycle phase 1 - client portfolio, tasks, notes, competitive scorecard
```

## Deployment

- **Branch:** main (push triggers Vercel auto-deploy)
- **Build:** `prisma generate && next build`
- **Database:** PostgreSQL via Prisma (`DATABASE_URL` in `.env`)
- **No pending migrations**

## Session Instructions

When starting a new session on this project:
1. Read `PROJECT_STATUS.md` for architecture and file map
2. Read `BUSINESS_DNA.yaml` for business context
3. Read this file for current phase and what to build next
4. Check `git log --oneline -5` for latest changes
