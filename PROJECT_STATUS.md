# GHM Dashboard — Project Status

> Internal sales + client delivery dashboard for **GHM Digital Marketing**
> Repo: `duke-of-beans/GHM-Marketing` · Deployed: Vercel · DB: PostgreSQL (Prisma)

## Stack

Next.js 14 (App Router) · TypeScript · Prisma ORM · NextAuth · Tailwind CSS · shadcn/ui · dnd-kit (Kanban)

## Architecture

The dashboard has two cycles:

**Front Cycle (Sales)** — Lead acquisition through deal close:
- Territory-scoped lead management with role-based access (master/rep)
- Drag-and-drop Kanban pipeline: Available → Scheduled → Contacted → Follow Up → Paperwork → Won
- Lead enrichment: Outscraper (reviews/GMB), Ahrefs (DR/keywords), PageSpeed Insights
- Smart CSV/XLSX import with territory auto-matching and lead scoring
- Product catalog with deal builder (MRR/ARR/LTV calculations)
- Work order PDF generation and email delivery
- Rep performance tracking and territory analytics

**Back Cycle (Client Service Delivery)** — Post-sale client management:
- Won-lead trigger auto-creates ClientProfile (reverse: leaving Won deactivates, re-winning reactivates)
- Client portfolio with health scores, retainer tracking
- 5-tab client detail: Scorecard, Tasks, Domains, Notes, Reports
- Task workflow: queued → in-progress → in-review → approved → deployed → measured
- Pinned "client standards" (voice/style notes for content production)
- Competitive scan infrastructure (schema complete, engine NOT yet built)

## Database: 21 Models

**Front Cycle (12):** User, Territory, LeadSource, Lead, Note, LeadHistory, CompetitiveIntel, Product, DealProduct, WorkOrder, StageMetrics, RepPerformance

**Back Cycle (9):** ClientProfile, ClientCompetitor, ClientDomain, ClientTask, ClientNote, CompetitiveScan, ClientReport, DiscoveryRun, LocationPreset

## Directory Structure

```
src/
├── app/
│   ├── (auth)/          # Login
│   ├── (dashboard)/     # All authenticated pages
│   │   ├── analytics/   # Pipeline analytics & charts
│   │   ├── clients/     # Client portfolio + [id] detail
│   │   ├── leads/       # Kanban pipeline board
│   │   ├── master/      # Master dashboard (admin view)
│   │   ├── products/    # Product catalog management
│   │   ├── reports/     # Territory performance reports
│   │   ├── sales/       # Sales rep personal dashboard
│   │   ├── team/        # User/rep management
│   │   └── territories/ # Territory CRUD
│   └── api/
│       ├── clients/     # Client CRUD + tasks + notes
│       ├── enrichment/  # Outscraper, Ahrefs, PageSpeed
│       ├── leads/       # Lead CRUD, import, enrich
│       ├── products/    # Product catalog API
│       ├── territories/ # Territory API
│       ├── users/       # User management API
│       └── work-orders/ # PDF generation + email
├── components/
│   ├── clients/         # portfolio.tsx, profile.tsx
│   ├── dashboard/       # metric-card, nav
│   ├── leads/           # kanban-board, lead-card, lead-detail-sheet, csv-import
│   ├── shared/          # Reusable components
│   └── ui/              # shadcn/ui primitives
├── lib/
│   ├── auth/            # NextAuth config, session helpers, RBAC
│   ├── db/              # Prisma query modules (leads.ts, clients.ts)
│   ├── email/           # Nodemailer work order delivery
│   ├── enrichment/      # API clients: outscraper, ahrefs, pagespeed
│   ├── pdf/             # Work order PDF generation
│   ├── utils/           # Shared utilities
│   └── validations/     # Zod schemas
└── types/               # TypeScript types, lead status config, constants
```

## What's Built (Complete)

- Full authentication with role-based access (master sees all, reps see own territory)
- Lead pipeline with drag-and-drop Kanban (6 active stages + Won + Lost)
- Lead enrichment (Outscraper, Ahrefs, PageSpeed)
- Smart import: CSV/XLSX with territory matching, scoring, dedup
- Product catalog with pricing models (monthly/annual/one-time)
- Work order generation (PDF) and email delivery
- Territory management with geographic scoping
- Team management with role assignments
- Analytics page with pipeline funnel charts
- Client portfolio page (cards with health scores)
- Client detail page (5-tab UI: scorecard, tasks, domains, notes, reports)
- Task CRUD with full status workflow
- Note system with pinned client standards
- Error boundaries on client pages

## What's Next — Phase 2: Competitive Scan Engine

The scan infrastructure (database tables, API routes shell) exists. The engine itself needs to be built:

1. **Scan Executor** — background job that runs scans on schedule per client's `scanFrequency` (weekly/biweekly/monthly)
2. **Data Fetcher** — reuses enrichment APIs (Outscraper, Ahrefs, PageSpeed) to pull fresh metrics for client + their tracked competitors
3. **Delta Calculator** — compares current scan vs previous scan, identifies gaps between client and competitors
4. **Alert Generator** — flags significant changes (competitor gained keywords, client lost rankings, review count dropped)
5. **Task Auto-Creator** — converts competitive gaps into actionable tasks in `client_tasks` with source="competitive-scan"
6. **Health Score Updater** — recalculates client health score from scan data

## Environment

- **Local dev:** `npm run dev` (port 3000)
- **Database:** PostgreSQL via `DATABASE_URL` in `.env`
- **Deploy:** Push to `main` → Vercel auto-deploys
- **Prisma:** `npm run db:migrate` for migrations, `npm run db:studio` for GUI

## Key Files for Context

| Purpose | File |
|---------|------|
| Database schema | `prisma/schema.prisma` |
| Lead status config | `src/types/index.ts` |
| Lead queries + won trigger | `src/lib/db/leads.ts` |
| Client queries + creation | `src/lib/db/clients.ts` |
| Enrichment APIs | `src/lib/enrichment/` |
| Kanban board | `src/components/leads/kanban-board.tsx` |
| Client profile (852 lines) | `src/components/clients/profile.tsx` |
| Client portfolio | `src/components/clients/portfolio.tsx` |
| API: clients | `src/app/api/clients/` |
| Auth + RBAC | `src/lib/auth/` |
