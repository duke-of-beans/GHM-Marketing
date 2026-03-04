# SPRINT 39 — COWORK PROMPT
**Affiliate Vertical UI**
**Date:** March 3, 2026

---

You are a senior full-stack engineer working on COVOS, a multi-tenant vertical ERP platform built in Next.js 14 / TypeScript / Prisma / Neon / Tailwind.

## Your Mission

Build all UI for COVOS Vertical 2 (Affiliate / Domain Portfolio). Sprint 38 built the data layer — your job is to wire up every surface. Seven distinct page/feature areas. Use existing components throughout. No new design patterns. Render gracefully with empty states on every surface — no demo data yet (Sprint 40 handles that).

## MANDATORY: Read These Files First

```
src/app/(dashboard)/clients/page.tsx
src/app/(dashboard)/clients/[id]/page.tsx
src/app/(dashboard)/pipeline/page.tsx
src/app/(dashboard)/content/page.tsx
src/components/ui/status-badge.tsx
src/components/ui/empty-state.tsx
src/components/ui/metric-tile.tsx
docs/blueprints/SPRINT39_BLUEPRINT.md
docs/blueprints/SPRINT38_BLUEPRINT.md
docs/VERTICAL_2_AFFILIATE_STRATEGY.md
```

The blueprint is your specification. The existing pages are your pattern library — replicate their structure, don't reinvent.

## Phase 1 — Four Parallel Tracks

**Track A — Site Portfolio + Site Detail Shell**
- Create `/src/app/(dashboard)/sites/page.tsx` — site list page
  - Header: "Sites" + "Add Site" button
  - Filterable table with columns: Domain, Niche, Status, Monthly Revenue, Monthly Traffic, DA, Monetization Mix, Actions
  - Status badges using existing `StatusBadge` component
  - Add/Edit modal with all Site fields from the schema
  - Empty state component when no sites exist
  - Wire to `GET /api/affiliate/sites` and `POST /api/affiliate/sites`

- Create `/src/app/(dashboard)/sites/[id]/page.tsx` — site detail shell
  - Page header: domain name, status badge, quick stats row (Revenue, Traffic, DA/DR, Program count, Brief count)
  - Tab navigation: Overview / Programs / Ad Networks / Revenue / Content / Valuation
  - Overview tab: all Site metadata fields, editable
  - Other tabs: render tab shell with empty state — content filled in Phase 2

**Track B — Revenue Dashboard**
- Create `/src/app/(dashboard)/revenue/page.tsx`
  - Top row: 4 metric tiles (Portfolio MRR, Total Traffic, Avg RPM, Total Sites)
  - Revenue by Site table (sortable, all active sites with this month vs last month)
  - Monthly trend line chart using recharts (last 12 months, total portfolio)
  - Revenue by Source pie/bar chart (affiliate vs display vs sponsored breakdown)
  - All data from `GET /api/affiliate/sites` + `GET /api/affiliate/sites/[id]/revenue`
  - Empty state when no revenue entries exist

**Track C — Acquisition Pipeline**
- Create `/src/app/(dashboard)/acquisitions/page.tsx`
  - Kanban board with 5 columns: Researching / Due Diligence / Negotiating / Purchased / Passed
  - Cards show: Domain, Niche, Asking Price, Monthly Revenue, DA, Source badge
  - "Passed" column collapsed by default with expand toggle
  - Add Target button → drawer with all AcquisitionTarget fields
  - Click card → detail drawer (all fields editable)
  - When moved to "Purchased": show modal prompting to create Site record (pre-fill from target)
  - Wire to full CRUD on `/api/affiliate/acquisitions`
  - Empty state on each column

**Track D — Nav + Module Toggle + Terminology**
- Update left nav to render affiliate vertical nav when `verticalType === 'affiliate_portfolio'`:
  - "Sites" replaces "Clients"
  - "Acquisition Pipeline" as sub-item under Sites
  - "Revenue" as standalone nav item
  - Hide: Invoicing, Partners, Work Orders, Proposals, Client Portal, Territories
- Audit all new page headers, labels, button text — ensure they pull from terminology config not hardcoded strings
- Test: GHM tenant should see zero change. Affiliate tenant sees affiliate nav.

## Phase 2 — Site Detail Tabs (depends on Track A shell)

**Track E — Programs + Ad Networks tabs**

Programs tab (`/sites/[id]` — Programs):
- Table: Network, Merchant, Commission Rate, Cookie Window, Status badge, Lifetime Earnings, Last Payout
- Status color: Approved=green, Pending=amber, Rejected=red, Not Applied=gray
- Add Program button → modal/drawer with all AffiliateProgram fields
- Edit inline or via drawer
- Wire to `/api/affiliate/sites/[id]/programs`

Ad Networks tab (`/sites/[id]` — Ad Networks):
- Table: Network, Status, Current RPM, Monthly Revenue, Current Sessions, Qualification Progress
- Qualification Progress: visual progress bar — `(currentMonthlySessions / monthlySessionsRequired) * 100`
  - Green ≥100% (qualified), Amber 50–99%, Red <50%
  - Show sessions needed to qualify as helper text below bar
- Add Network button → modal
- Wire to `/api/affiliate/sites/[id]/networks`

**Track F — Revenue + Valuation tabs**

Revenue tab (`/sites/[id]` — Revenue):
- Monthly entries table (sortable by month, grouped optionally by source)
- Columns: Month, Source Type, Source Name, Revenue, Sessions, RPM (calculated, read-only), EPC (calculated, read-only)
- Monthly trend sparkline (small recharts within tab)
- Add Revenue Entry button → modal: Month (picker), Year, Source Type, Source Name, Revenue, Sessions, Pageviews, Clicks
- RPM and EPC display as calculated read-only previews in the modal as user types
- Totals: YTD Revenue, All-time Revenue displayed at top of tab
- Wire to `/api/affiliate/sites/[id]/revenue`

Valuation tab (`/sites/[id]` — Valuation):
- Current valuation card: Monthly Net Profit / Multiple / Estimated Value (large display)
- Listing Status badge
- History table of all valuations for this site (date, net profit, multiple, estimated value, status)
- Add Valuation button → modal:
  - Monthly Net Profit (input)
  - Multiple (number input, default 36)
  - Estimated Value: live-calculated preview = `monthlyNetProfit × multiple` — updates as user types, no submit needed
  - Broker Listing Status (select)
  - Listed Price (if listed/under offer)
  - Sale Price + Sale Date (if sold)
  - Notes
- Wire to `/api/affiliate/sites/[id]/valuations`

## Phase 3 — Parallel

**Track G — Content Calendar Affiliate Mode**
- Read existing `/src/app/(dashboard)/content/page.tsx` carefully before touching it
- Add conditional rendering: when `verticalType === 'affiliate_portfolio'`:
  - Replace "Client" with "Site" in all labels
  - Show Site filter dropdown at top (filter briefs by site)
  - Add post-publish columns to published rows: Published URL, Current Position, Monthly Traffic, Attributed Revenue, Refresh Due flag
  - Writer field renders as free-text input (not just user picker) — external contractor support
  - Add bulk assign writer action (checkbox select → "Assign Writer" dropdown)
  - Add "Needs Refresh" tab showing all briefs where `refreshDue === true`, sorted by attributed revenue desc
- Wire to `/api/affiliate/briefs` routes
- Do NOT break existing SEO vertical content calendar for GHM tenant

**Track H — Portfolio Intelligence Dashboard**
- Add affiliate intelligence widgets to dashboard when `verticalType === 'affiliate_portfolio'`
- Top Earners widget: ranked list of top 5 sites by monthly revenue (bar chart or list with revenue)
- Site Health widget: per-site health badge (green/amber/red composite of traffic trend + revenue trend + content freshness)
  - Traffic trend: compare last 3 months from RevenueEntry sessions data
  - Revenue trend: compare last 3 months from RevenueEntry revenue data
  - Content freshness: % of published briefs not flagged refreshDue
- Qualification Tracker widget: sites approaching Mediavine (50K) or AdThrive (100K) — progress bars
- Content Velocity widget: articles published per month per site (small table)
- Portfolio Valuation Summary: total estimated value across all sites with latest SiteValuation
- Empty states on all widgets when insufficient data

## Phase 4 — Sequential Gate

**Track I — Empty States Pass**
Walk every new surface. Confirm `EmptyState` component renders with appropriate message and action when:
- No sites exist
- A site exists but has no programs
- A site exists but has no revenue entries
- A site exists but has no content briefs
- Acquisition pipeline has no targets in a stage
- Revenue dashboard has no data

**Track J — TypeScript Gate**
`npx tsc --noEmit`
Zero new errors in any Sprint 39 file. Document pre-existing error count.

**Track K — Sprint Close**
- `CHANGELOG.md` — Sprint 39 entry
- `STATUS.md` — update Last Updated
- `BACKLOG.md` — mark Sprint 39 ✅ SHIPPED
- `git add -A && git commit -m "Sprint 39: Affiliate vertical UI — 7 surfaces, site portfolio, revenue dashboard, acquisition pipeline, content calendar affiliate mode" && git push origin main`

## Constraints

- Use ONLY existing UI components — StatusBadge, EmptyState, MetricTile, recharts, drawer/modal patterns
- Do NOT create new component primitives
- Do NOT modify GHM tenant pages or SEO vertical behavior
- Do NOT add demo data — empty states are correct
- All new routes must be behind auth + tenant scope
- Affiliate UI must be invisible to GHM tenant — `verticalType` gate on every affiliate surface
- No `any` types in TypeScript
