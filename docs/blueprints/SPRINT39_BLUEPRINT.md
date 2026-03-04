# SPRINT 39 — Affiliate Vertical UI
**Created:** March 3, 2026
**Status:** READY AFTER SPRINT 38
**Cowork prompt:** `docs/blueprints/SPRINT39_COWORK_PROMPT.md`
**Depends on:** Sprint 38 complete (all models + API routes live)
**Blocks:** Sprint 40 (demo tenant needs UI to be meaningful)

---

## Objective

Build all UI for COVOS Vertical 2. Seven distinct surfaces, all wired to the Sprint 38 API routes. Design language follows existing UI Constitution (Groups 1–6 complete). No new design patterns — use existing components. No demo data — the UI should render gracefully with empty states everywhere.

---

## Done Criteria

- [ ] Site Portfolio page — list view, create/edit modal, status badges
- [ ] Site Detail page — tabbed: Overview / Affiliate Programs / Ad Networks / Revenue / Content / Valuation
- [ ] Affiliate Program management — CRUD within Site Detail tab
- [ ] Display Ad Network management — CRUD within Site Detail tab
- [ ] Revenue Dashboard — portfolio totals + per-site breakdown + monthly trend chart
- [ ] Revenue Entry — monthly entry form per site, per source
- [ ] Content Calendar (affiliate mode) — brief list per site, status pipeline, post-publish tracking fields visible
- [ ] Acquisition Pipeline — kanban or list by stage, target detail drawer
- [ ] Site Valuation module — valuation form, estimated value display, exit status
- [ ] Portfolio Intelligence Dashboard — cross-site summary, top earners, health indicators
- [ ] Module toggle enforcement — affiliate vertical hides disabled modules from nav
- [ ] Terminology rendering — all labels pull from tenant terminology config
- [ ] Empty states on every new surface
- [ ] TypeScript: zero new errors
- [ ] CHANGELOG, STATUS, BACKLOG updated and committed

---

## Surface Specifications

### 1. Site Portfolio Page
**Route:** `/sites`
**Replaces:** `/clients` for affiliate vertical tenants
**Layout:** Same structure as client list — header with "Sites" title + "Add Site" button, filterable table/card list

**Columns/fields visible in list:**
- Domain (linked to Site Detail)
- Niche
- Status badge (Active / Dormant / For Sale / Sold)
- Monthly Revenue (current)
- Monthly Traffic (current)
- DA/DR
- Monetization mix badge (Affiliate / Display / Both)
- Quick actions (edit, view)

**Add/Edit modal fields:**
- Domain, Display Name, Niche, Category
- Status
- Launch Date, Acquisition Date, Acquisition Cost
- Monthly Revenue (current), Monthly Traffic (current)
- DA, DR
- CMS, Hosting Provider, Hosting Cost/Month
- Monetization Mix (select: affiliate / display / both / flip)
- Notes

**Empty state:** "No sites yet. Add your first site to start tracking your portfolio."

---

### 2. Site Detail Page
**Route:** `/sites/[id]`
**Layout:** Page header (domain name, status badge, quick stats row) + tabbed body

**Quick stats row (always visible):**
- Monthly Revenue
- Monthly Traffic
- DA/DR
- Active Affiliate Programs (count)
- Content Briefs (count, with published/total breakdown)

**Tabs:**

**Overview tab:**
- Site metadata (all fields from the Site model, editable inline or via modal)
- Monetization mix summary
- Launch/acquisition timeline

**Affiliate Programs tab:**
- Table of all programs for this site
- Columns: Network, Merchant, Commission Rate, Cookie Window, Status badge, Lifetime Earnings, Last Payout
- Add Program button → drawer/modal with all AffiliateProgram fields
- Status color coding: Approved (green), Pending (amber), Rejected (red), Not Applied (gray)

**Ad Networks tab:**
- Table of all display networks for this site
- Columns: Network, Status, Current RPM, Monthly Revenue, Sessions, Qualification Progress bar
- Qualification Progress: progress bar showing currentMonthlySessions / monthlySessionsRequired — green when qualified, amber when >50%, red when <50%
- Add Network button → drawer/modal

**Revenue tab:**
- Monthly revenue entries for this site
- Toggle: view by month (table) / view by source (grouped)
- Monthly trend sparkline
- Add Revenue Entry button → modal with: Month/Year, Source Type, Source Name, Revenue, Sessions, Pageviews, Clicks
- RPM and EPC display as calculated read-only fields after entry
- Totals row: YTD revenue, all-time revenue

**Content tab:**
- List of AffiliateContentBriefs for this site
- Filter by status (Briefed / In Progress / Review / Published / Needs Refresh)
- Columns: Keyword, Type, Writer, Status, Due Date, Published URL (if published), Current Position, Traffic, Attributed Revenue, Refresh Due flag
- "Needs Refresh" status highlighted in amber
- Add Brief button → modal/drawer
- Bulk assign writer: checkbox select + "Assign Writer" bulk action
- Post-publish fields (URL, position, traffic, attributed revenue) editable inline on published rows

**Valuation tab:**
- Current valuation card: Monthly Net Profit, Multiple, Estimated Value (calculated)
- Listing Status badge
- History table of past valuations
- Add Valuation button → modal: Monthly Net Profit, Multiple (default 36x), Broker Listing Status, Listed Price, Sale Price (if sold), Notes
- Estimated Value displays live as user enters Monthly Net Profit × Multiple

---

### 3. Revenue Dashboard
**Route:** `/revenue` (or `/dashboard/revenue`)
**Layout:** Full-width dashboard page

**Sections:**

**Portfolio Totals (top row — metric tiles):**
- Total Portfolio MRR (sum of all active site revenues this month)
- Total Portfolio Traffic (sum of all sites this month)
- Average RPM across portfolio
- Total Sites (with Active / For Sale / Dormant breakdown)

**Revenue by Site (table):**
- Site, This Month Revenue, Last Month Revenue, MoM Change (%), Traffic, RPM, Primary Monetization
- Sortable by any column
- Click row → Site Detail Revenue tab

**Monthly Trend Chart:**
- Line chart: total portfolio revenue by month (last 12 months)
- Use existing recharts implementation from platform

**Revenue by Source (breakdown):**
- Pie or bar chart: what % comes from affiliate vs. display vs. sponsored

**Empty state:** "Add revenue entries to your sites to see portfolio performance here."

---

### 4. Acquisition Pipeline
**Route:** `/acquisitions`
**Layout:** Kanban board by stage (same pattern as Lead Pipeline if it exists, else build kanban)

**Stages (columns):**
Researching → Due Diligence → Negotiating → Purchased / Passed

**Card shows:**
- Domain
- Niche
- Asking Price
- Current Monthly Revenue
- DA
- Source badge

**Passed stage:** Collapsed by default, expandable

**Add Target button** → drawer with all AcquisitionTarget fields
**Click card** → detail drawer (all fields, editable, notes section prominent)

**When stage moves to "Purchased":** Prompt to create a Site record from this acquisition target (pre-fill domain, niche, acquisition cost, acquisition date from target record)

**Empty state:** "No acquisition targets yet. Start tracking domains you're evaluating."

---

### 5. Content Calendar (Affiliate Mode)
**Route:** `/content` (shared route, renders affiliate version when verticalType === 'affiliate_portfolio')

The existing Content Studio renders differently for affiliate tenants:
- Brief list shows `site.domain` instead of `client.name`
- Adds post-publish columns to published briefs (URL, Position, Traffic, Revenue)
- Adds "Needs Refresh" filter and visual flag
- Adds Site filter dropdown at top (filter briefs by site)
- Writer field accepts free-text name (not just user picker) for external contractors
- Bulk assign writer action available

**Needs Refresh queue:** Separate tab showing all briefs where `refreshDue === true`, sorted by attributed revenue descending (refresh your highest-earners first).

---

### 6. Portfolio Intelligence Dashboard
**Route:** `/dashboard` or as a dashboard widget set

**Widgets:**

**Top Earners:** Top 5 sites by monthly revenue — bar chart or ranked list with revenue figures.

**Site Health Scores:** Each active site gets a composite score based on:
- Traffic trend (up/flat/down over 3 months)
- Revenue trend (up/flat/down over 3 months)
- Content freshness (% of published briefs not flagged for refresh)
- Display as colored health badges on site list and dashboard

**Qualification Tracker:** Sites approaching Mediavine (50K sessions) or AdThrive (100K pageviews) threshold — progress bars, estimated time to qualify based on traffic trend.

**Content Velocity:** Articles published per site per month — table or small multiples chart. Identify sites where publishing has stalled.

**Portfolio Valuation Summary:** Total estimated portfolio value (sum of latest SiteValuation.estimatedValue across all active sites).

---

### 7. Nav Updates (Affiliate Vertical)

When `verticalType === 'affiliate_portfolio'`, the left nav renders:

```
Dashboard
Sites              ← was "Clients"
  └ Acquisition Pipeline
Revenue
Content
Tasks
Vault
Settings
```

Hidden from nav (module toggle off):
- Invoicing/Billing
- Pipeline (lead pipeline)
- Partners
- Work Orders
- Proposals
- Client Portal
- Territories

---

## Parallelization Map

**Phase 1 — Parallel:**
- Track A: Site Portfolio page (`/sites`) + Site Detail page shell (header + tabs, no tab content yet)
- Track B: Revenue Dashboard page (wired to revenue API, chart components)
- Track C: Acquisition Pipeline kanban (`/acquisitions`)
- Track D: Nav updates + module toggle enforcement + terminology rendering audit

**Phase 2 — Parallel (depends on Site Detail shell from Track A):**
- Track E: Site Detail — Affiliate Programs tab + Ad Networks tab
- Track F: Site Detail — Revenue tab + Valuation tab
- Track G: Site Detail — Content tab (affiliate mode content calendar)

**Phase 3 — Parallel:**
- Track H: Portfolio Intelligence Dashboard widgets
- Track I: Content Calendar affiliate mode (route-level changes, needs-refresh queue)

**Phase 4 — Sequential:**
- Track J: Empty states pass — every new surface has a proper empty state
- Track K: TypeScript gate + regression check
- Track L: Sprint close (CHANGELOG, STATUS, BACKLOG, commit, push)

---

## Component Reuse Guidelines

Use these existing components without modification:
- `StatusBadge` — for Site Status, Program Status, Ad Network Status, Listing Status
- `MetricTile` / dashboard metric cards — for Portfolio Totals row
- Recharts line/bar/pie — for Revenue Dashboard charts
- `EmptyState` — for all new empty states
- `AlertDialog` — for delete confirmations
- Existing drawer/modal pattern — for all add/edit forms
- `AIProgressIndicator` — if AI content generation is triggered from brief creation

Do NOT create new design patterns. If a component doesn't exist for something, use the closest existing pattern and adapt it.

---

## Files To Read Before Starting

```
src/app/(dashboard)/clients/page.tsx          — client list pattern to replicate for sites
src/app/(dashboard)/clients/[id]/page.tsx     — client detail tabbed pattern
src/app/(dashboard)/pipeline/page.tsx         — pipeline/kanban pattern for acquisitions
src/app/(dashboard)/content/page.tsx          — content calendar to extend
src/components/ui/status-badge.tsx            — reuse for all status displays
src/components/ui/empty-state.tsx             — reuse for all empty states
src/components/ui/metric-tile.tsx             — reuse for dashboard metrics
docs/blueprints/SPRINT38_BLUEPRINT.md         — data models and API routes
docs/VERTICAL_2_AFFILIATE_STRATEGY.md        — full vertical context and lifecycle
docs/PSYCH_UX_AUDIT.md                       — UX principles to apply
```
