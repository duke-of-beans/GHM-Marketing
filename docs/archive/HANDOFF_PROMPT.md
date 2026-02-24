# HANDOFF PROMPT — GHM DASHBOARD
**Last Updated:** February 21, 2026
**Project:** GHM Dashboard — Unified Agency Intelligence Platform
**Status:** Production. In daily use. Stress-testing before SaaS productization.

---

## READ THIS FIRST — MANDATORY FOR ANY NEW INSTANCE

This product is not a collection of features. It is a unified data layer connecting
leads, clients, tasks, invoices, content, and site performance into one coherent
operating environment. Read `VISION.md` before making any UI/UX or architectural
decision. That document is the gospel — it was written after deep competitive research
across 25+ products (February 21, 2026) and represents the full product philosophy.

**The design law:** Context never breaks. Every decision gets evaluated against the
question: "Does this require the user to open another tab to complete the thought?"
If yes, it is a context break. We eliminate them.

---

## CRITICAL FILES — READ IN THIS ORDER

1. **`VISION.md`** — Product philosophy, competitive positioning, module visions,
   cross-module data flows, build philosophy. The new gospel. Read before anything else.
2. **`STATUS.md`** — Single source of truth for what's built, what's pending, active sprint.
3. **`BUSINESS_DNA.yaml`** — Company identity, pricing, team structure, metrics.

Supporting specs (read only when working on that module):
- `D:\Work\SEO-Services\specs\WAVE_PAYMENTS_BLUEPRINT.md`
- `D:\Work\SEO-Services\specs\API_INTEGRATION_BLUEPRINT.md`
- `D:\Work\SEO-Services\specs\ONBOARDING_PORTAL_SPEC.md`
- `D:\Work\SEO-Services\ghm-dashboard\COMMISSION_SYSTEM_SPEC.md`

---

## WHAT EXISTS TODAY (February 21, 2026)

The product is fully built and in production at Vercel. Built in approximately 4 days
of intensive development. Every module is functional. The work now is perfection —
stress testing, UX refinement, and cross-module data flow improvements.

### Modules Live
- **Lead Generation** — Pipeline kanban, discovery engine, Outscraper enrichment,
  audit/demo PDF generator, shareable audit links, territory system
- **Client Management** — Full client detail with 13 tabs (Scorecard, Tasks, Rankings,
  Citations, Local Presence, Content, Website Studio, Reports, Domains, Compensation,
  Billing, Integrations, Notes). Decomposed from monolith — each tab is a standalone
  component.
- **Task System** — Kanban board, status groups, AI content briefs (Claude Sonnet),
  task-to-client linkage, history tracking
- **Billing (Wave API)** — Monthly invoice cron, overdue escalation, partner payments,
  financial overview dashboard, billing tab per client
- **Content Studio** — Content briefs, review queue, top-level nav entry with client picker
- **Website Studio** — Property matrix, build queue, page composer, top-level nav entry
  with client picker
- **Commission Engine** — Monthly cron, tiered residuals, master fees, 3-role dashboard
  widgets (sales/master/owner)
- **Competitive Intelligence** — DataForSEO SERP rank tracking, NAP citation scraper
  (35 directories), daily scan cron, auto-task creation on drops
- **Admin Systems** — 3-tier roles (admin > master > sales), bug report system,
  permission system (16 API routes migrated), onboarding portal

### Tech Stack
```
Frontend: Next.js 14 + TypeScript + Tailwind + shadcn/ui
Database: Neon PostgreSQL + Prisma
Auth: NextAuth v5
Hosting: Vercel (auto-deploy on push)
APIs: Wave (billing), Ahrefs, DataForSEO, Outscraper, Google PageSpeed,
       Google Business Profile (pending OAuth approval), Claude API
AI: Claude Sonnet via callAI() unified entry point with cost tracking
```

**Repo:** https://github.com/duke-of-beans/GHM-Marketing
**Local path:** `D:\Work\SEO-Services\ghm-dashboard`
**Dev command:** `npm run dev`
**Deploy:** `git push origin main` (auto-deploys to Vercel ~2 min)

---

## PRODUCT VISION SUMMARY (read VISION.md for full detail)

GHM is a unified agency intelligence platform. The individual modules are entry points
into one connected data layer. The product's core value is what happens at the seams
between modules — where no competitor currently operates.

**Five cross-module data flows no competitor can replicate:**
1. Lead source → invoiced revenue attribution (true channel ROI)
2. Task completion → Wave invoice auto-generation
3. Website performance → content recommendations → task creation
4. Client Health Score (5-module composite: tasks, payments, rankings, content, communications)
5. Content → lead capture → conversion attribution

**The Client Health Score** is the most important cross-module feature. A single green/
yellow/red dot visible everywhere a client appears — list, billing, task rows, nav.
Answers "who needs attention today" without opening a single module.

**Design law:** Context never breaks. Every piece of data the user needs to make a
decision should be present where they are making that decision. If they have to open
another tab, we failed.

**Build philosophy:** Use it at GHM. Break it until it is hard to break. Then think
about SaaS productization. We do not sell until every module works flawlessly.

---

## MODULE UI/UX TARGETS (derived from competitive research)

### Lead Generation
- Pipeline kanban as default first screen (never list)
- Four-stat strip above kanban: Leads This Week, Pipeline Value, Avg Time in Stage, Win Rate
- Lead card click → expandable detail drawer on RIGHT (not page navigation)
- Convert to Client → pre-fills entire client record from lead data (no re-entry)
- Per-client email domain isolation via SendGrid (solves GoHighLevel's biggest weakness)

### Billing
- Six KPIs above fold: MRR, ARR, Outstanding, Overdue, Avg Days to Pay, Collected MTD
- Accounts aging visualization (0-30, 31-60, 61-90, 90+ day buckets)
- Invoice read receipts (rep sees when client opened invoice)
- Revenue by Lead Source widget — no competitor offers this
- Task-to-invoice: when task marked Deployed, Wave invoice line item auto-created

### Tasks
- "My Day" global view as first screen — tasks across all clients, grouped by date
- Client Context column: each row shows client name + health score dot
- Board view as default (not List) — research confirms faster adoption
- Optimistic UI for status transitions — no loading spinners on card moves

### Content Studio
- Two-pane first screen: editorial calendar (left) + Content Opportunities panel (right)
- Content Opportunities pulls from GSC + Ahrefs — answers "what should I write next"
- Editor: writing canvas (left) + persistent SEO panel (right, always visible)
- SEO panel: Content Score gauge (live, 0-100), keyword checklist, word/heading counts
- Publish action sends blog post, schedules GBP post, queues social — one click

### Website Studio
- Portfolio landing: card tiles with thumbnail, domain, deploy timestamp, PageSpeed, health dot
- Site Intelligence bar: persistent strip showing PageSpeed, GSC impressions, ranking count,
  crawl errors — always visible while editing, never hidden
- GBP API: auto-sync business info, hours, posts between GBP and website
- All forms auto-create CRM leads with full page/campaign attribution

---

## COMPETITIVE CONTEXT (why we win)

Every competitor fails at the seams between tools. GoHighLevel comes closest to
unification but does each module at 60% quality — users run ClickUp alongside it
for real task management, apologize when the website builder glitches.

We do not compete module-by-module against specialists. We wrap around them.
Agencies currently paying $400-600/month across GoHighLevel + ClickUp + Ahrefs
+ FreshBooks + a website builder. GHM replaces all five. The comparison is not
feature-by-feature — it is context-break-by-context-break.

When we productize: target agencies paying $400-600/month for fragmented tools.
The ROI calculation is not subtle.

---

## ACTIVE SPRINT STATUS

See `STATUS.md` for the full task list. As of February 21, 2026:

**Completed this sprint:**
- UX-001: Client detail monolith decomposed (489 lines from 1057)
- UX-002: Content Studio + Website Studio promoted to top-level nav
- UX-003: Grouped collapsible sidebar navigation
- UX-004: Client detail Approvals tab
- BUG-007: D3 verification fix
- BUG-008: [see STATUS.md]
- Permission system: all 16 API routes migrated

**Pending:**
- D4: Audit → Demo one-click workflow
- D5: Territory map visualization
- I4: Google Business Profile OAuth (pending Google approval)
- Commission system: end-to-end test with live client
- S3-S7: External sales collateral (brochure, comp sheet, territory map, agreement, job ad)

---

## DEVELOPMENT PRINCIPLES (non-negotiable)

- **Option B perfection** — 10x improvement, not 10%. Never ship at 60%.
- **Foundation first** — backend and data model before surface UI
- **Zero technical debt** — no temporary solutions, no TODOs left in code
- **Zero context breaks** — the design law; evaluated on every UI decision
- **Lean-out** — use existing APIs and tools, do not build custom plumbing
- **TypeScript strict** — 0 errors before any commit
- **No mocks or stubs** — real data, real APIs, real behavior in development

---

## KEY DECISIONS MADE — DO NOT REVISIT WITHOUT CAUSE

- **Website Studio built last** — most expensive to do right, justified after other
  modules are stable. Done once, done right.
- **Board view as default for Tasks** — not List. Research-backed. Non-negotiable.
- **Wave API for billing** — not QuickBooks, not Stripe invoicing. Wave is live.
- **DataForSEO for rank tracking** — replacing BrightLocal. Live.
- **Per-client email domain isolation** — future implementation via SendGrid.
- **Client Health Score** — 5-module composite. The connective tissue of the product.
  Must be surfaced everywhere a client appears. Same color, position, meaning.
- **SENTRY/content intel** — build a simple GHM-specific system (~250 lines).
  Do NOT port Gregore's SENTRY (800+ lines, wrong complexity).

---

## DAVID'S CONTEXT

Operations executive and COO of GHM Digital Marketing (Gavin's company).
David manages all operations, sales team, systems, and strategy. His comp is
$240/mo per active client — expects to renegotiate at 10+ clients.

Philosophy: "Option B perfection. Do it right first time. Climb mountains. Fight Goliaths.
Zero technical debt." Builds complete foundational systems, not MVPs. Prefers direct,
honest feedback over diplomatic responses.

**Current GHM clients:** ~9 clients × $2,400/mo = ~$21,600 MRR
**Retention rate:** ~97% monthly (7 clients retained 2+ years)

Sales team: Arian Germani (first sales rep). Hiring 4 total.
Sales comp: $1,000 close bonus + tiered residual locked at close ($200-$300/mo).
