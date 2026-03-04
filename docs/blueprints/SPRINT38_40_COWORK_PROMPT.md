# SPRINTS 38–40 MEGA-SPRINT — COWORK PROMPT
**Affiliate Vertical: Complete Build (Data + UI + Demo + Intelligence)**
**Date:** March 3, 2026

---

You are a senior full-stack engineer working on COVOS, a multi-tenant vertical ERP platform built in Next.js 14 / TypeScript / Prisma / Neon / Tailwind. You are building the complete COVOS Vertical 2 (Affiliate / Domain Portfolio) in a single run — data layer, full UI, demo tenant with realistic seed data, and intelligence layer integrations.

When this sprint is done, `ridgeline.covos.app` is a fully populated, showable affiliate portfolio company. Proper Sluice (the owner's real company) can be onboarded as a tenant through the standard provisioning flow with zero code changes.

---

## MANDATORY: Read These Files First (In Order)

Before writing a single line of code, read all of these:

```
prisma/schema.prisma
src/lib/tenant/config.ts
src/lib/tenant/server.ts
src/app/api/clients/route.ts
src/middleware.ts
src/app/(dashboard)/clients/page.tsx
src/app/(dashboard)/clients/[id]/page.tsx
src/app/(dashboard)/pipeline/page.tsx
src/app/(dashboard)/content/page.tsx
src/components/ui/empty-state.tsx
src/components/ui/status-badge.tsx
src/components/ui/metric-tile.tsx
scripts/seed-tenants.ts
src/lib/integrations/gsc.ts (or equivalent — find it)
src/app/(dashboard)/settings/page.tsx
docs/blueprints/SPRINT38_40_MEGA_BLUEPRINT.md
docs/VERTICAL_2_AFFILIATE_STRATEGY.md
```

The mega-blueprint is your specification. The existing files are your pattern library. Do not deviate from existing conventions. Do not invent new patterns when existing ones work.

---

## Execution Order — Follow This Exactly

### PHASE 1 — Foundation (Sequential)

Run Tracks A, B, C in parallel (write them simultaneously), then run the migration once all three are complete.

**Track A — Write all 7 Prisma models**

Add to `prisma/schema.prisma` after existing models. Exact schemas are in the blueprint. Summary:

- `Site` — core entity, replaces "Client" for affiliate vertical. Includes `gscPropertyId`, `ga4PropertyId`, `gscConnectedAt`, `ga4ConnectedAt`. `@@unique([tenantId, slug])`.
- `AffiliateProgram` → belongs to Site
- `DisplayAdNetwork` → belongs to Site
- `RevenueEntry` → belongs to Site, `@@unique([tenantId, siteId, month, year, sourceType, sourceName])`
- `AcquisitionTarget` → optional relation to Site (when purchased)
- `AffiliateContentBrief` → belongs to Site, includes post-publish tracking fields + `refreshDue Boolean @default(false)` + `peakRankingPosition Int?`
- `SiteValuation` → belongs to Site

Enums to add: `SiteStatus`, `AffiliateProgramStatus`, `AdNetworkStatus`, `RevenueSourceType`, `AcquisitionStage`, `ContentType`, `BriefStatus`, `ValuationListingStatus`

**Track B — Module + Terminology Config**

In `src/lib/tenant/config.ts` (or wherever TenantConfig lives):
- Add `verticalType?: 'seo_agency' | 'affiliate_portfolio' | 'generic'` to TenantConfig type
- Export `AFFILIATE_MODULE_DEFAULTS` object (see blueprint for full list — 12 on, 10 off)
- Export `AFFILIATE_TERMINOLOGY` object (see blueprint — client→Site, lead→Target, etc.)

In `src/lib/tenant/server.ts` (or terminology resolver):
- Wire: when `tenant.config.verticalType === 'affiliate_portfolio'`, return `AFFILIATE_TERMINOLOGY` instead of default terms

**Track C — Validate schema is complete**

After writing all models, run:
```bash
npx prisma validate
```
Fix any validation errors before proceeding.

Then run:
```bash
npx prisma migrate dev --name affiliate-vertical-complete
```

If migration fails, fix schema errors and retry. Do not proceed to Phase 2 until migration succeeds.

---

### PHASE 2 — API Routes (Sequential, after Phase 1 migration)

Tracks D, E, F can run in parallel within Phase 2 — all depend only on Phase 1 migration being complete.

**Pattern for every route (copy from existing `/api/clients/route.ts`):**
1. Import `withAuth` / `withPermission` from middleware
2. Get `tenantId` from authenticated session — NEVER from request body
3. All Prisma queries include `where: { tenantId }` — always
4. Return proper HTTP status codes
5. Try/catch on every handler

**Track D — Site, AffiliateProgram, DisplayAdNetwork routes**

```
GET    /api/affiliate/sites              → list all sites for tenant
POST   /api/affiliate/sites              → create site
GET    /api/affiliate/sites/[id]         → get single site with all relations
PUT    /api/affiliate/sites/[id]         → update site
DELETE /api/affiliate/sites/[id]         → delete site (cascade deletes relations)

POST   /api/affiliate/sites/[id]/programs  → create program
GET    /api/affiliate/sites/[id]/programs  → list programs for site
PUT    /api/affiliate/programs/[id]        → update program
DELETE /api/affiliate/programs/[id]        → delete program

POST   /api/affiliate/sites/[id]/networks  → create network
GET    /api/affiliate/sites/[id]/networks  → list networks; include virtual qualificationProgress in response
PUT    /api/affiliate/networks/[id]        → update network
```

**Track E — RevenueEntry, AcquisitionTarget, AffiliateContentBrief, SiteValuation routes**

```
POST   /api/affiliate/sites/[id]/revenue   → create entry; compute rpm + epc server-side before save
GET    /api/affiliate/sites/[id]/revenue   → list entries for site
PUT    /api/affiliate/revenue/[id]         → update; recompute rpm + epc

POST   /api/affiliate/acquisitions         → create target
GET    /api/affiliate/acquisitions         → list all targets for tenant
GET    /api/affiliate/acquisitions/[id]    → get single target
PUT    /api/affiliate/acquisitions/[id]    → update target (including stage changes)
DELETE /api/affiliate/acquisitions/[id]    → delete target

POST   /api/affiliate/sites/[id]/briefs    → create brief
GET    /api/affiliate/sites/[id]/briefs    → list briefs for site (filterable by status)
GET    /api/affiliate/briefs/[id]          → get single brief
PUT    /api/affiliate/briefs/[id]          → update; apply rank decay/peak logic on currentRankingPosition change
DELETE /api/affiliate/briefs/[id]          → delete brief

POST   /api/affiliate/sites/[id]/valuations  → create valuation; compute estimatedValue = monthlyNetProfit × multipleUsed
GET    /api/affiliate/sites/[id]/valuations  → list valuations for site
PUT    /api/affiliate/valuations/[id]        → update; recompute estimatedValue
```

**Calculated field logic (implement in route handlers):**
- `RevenueEntry.rpm` = `(revenue / sessions) * 1000` — compute if `sessions > 0`, else null
- `RevenueEntry.epc` = `revenue / clicks` — compute if `clicks > 0`, else null
- `SiteValuation.estimatedValue` = `monthlyNetProfit * multipleUsed` — always compute, store result
- `DisplayAdNetwork.qualificationProgress` = `(currentMonthlySessions / monthlySessionsRequired) * 100` — virtual, include in GET response, do NOT store in DB
- `AffiliateContentBrief` on PUT: if `currentRankingPosition` is in the update payload:
  - If `peakRankingPosition` is null or new position is better (lower number) → update `peakRankingPosition = currentRankingPosition`
  - If decay = `currentRankingPosition - peakRankingPosition > 5` → set `refreshDue = true`

**Track F — CSV Import route**

Create `src/app/api/affiliate/import/route.ts` — POST, multipart form data.

Accepts: `source` (shareasale | amazon | cj | generic), `siteId` (Int), CSV file

Parsing logic:
- **ShareASale:** Find columns containing "date", "merchant", "commission" (case-insensitive header matching). Group rows by month+year+merchant. Create one RevenueEntry per group with `sourceType: 'AFFILIATE'`, `sourceName: merchantName`, `revenue: sumOfCommissions`.
- **Amazon:** Find columns containing "date" and "shipped revenue" or "earnings". Group by month+year. Single RevenueEntry per month: `sourceName: 'Amazon Associates'`, `sourceType: 'AFFILIATE'`.
- **CJ:** Find columns containing "date", "advertiser", "commission". Group by month+year+advertiser. RevenueEntry per group.
- **Generic:** Required columns: `month`, `year`, `source_type`, `source_name`, `revenue`. Optional: `sessions`, `pageviews`, `clicks`. Map directly to RevenueEntry.

Duplicate detection before insert: query existing `RevenueEntry` records matching `[tenantId, siteId, month, year, sourceType, sourceName]`. Skip if exists. Count as `skipped`.

Return: `{ imported: number, skipped: number, errors: string[] }`

CSV parsing: use `papaparse` if available in the project, otherwise write a simple header-detect + row-map parser. Handle: extra whitespace in headers, mixed date formats (parse month/year from any reasonable format), empty rows (skip silently).

---

### PHASE 3 — Parallel Tracks (after Phase 2 complete)

Start all three simultaneously.

---

**Track G — Complete UI (7 surfaces)**

Read the existing client list and client detail pages BEFORE writing a single UI component. Replicate their structure exactly — don't reinvent.

**G1: `/sites` — Site Portfolio Page**

Create `src/app/(dashboard)/sites/page.tsx`.

Structure: identical to `/clients/page.tsx` but for Sites. Server component fetching from `/api/affiliate/sites`.

Table columns: Domain (linked to `/sites/[id]`), Niche, Status (StatusBadge), Monthly Revenue, Monthly Traffic, DA, Monetization Mix badge, Edit/View actions.

Add Site modal/drawer: all Site fields — domain, displayName, niche, category, status, launchDate, acquisitionDate, acquisitionCost, monthlyRevenueCurrent, monthlyTrafficCurrent, domainAuthority, domainRating, cms, hostingProvider, hostingCostMonthly, monetizationMix (select: affiliate/display/both/flip), notes.

Empty state: "No sites yet. Add your first site to start tracking your portfolio."

Only renders when `verticalType === 'affiliate_portfolio'` OR accessible regardless — your call based on how routing works for the tenant. Either way: GHM cannot see this page.

**G2: `/sites/[id]` — Site Detail (6 tabs)**

Create `src/app/(dashboard)/sites/[id]/page.tsx`. Structure: identical to `/clients/[id]/page.tsx` — pinned header, tab navigation, scrollable tab content.

Page header: domain name + status badge + quick stats strip (Monthly Revenue | Monthly Traffic | DA/DR | Programs count | Briefs count).

Tabs (implement all 6):

*Overview:* All Site fields editable inline or via modal. Monetization mix summary. Timeline (launch/acquisition dates).

*Programs (AffiliateProgram):* Table: Network, Merchant, Commission Rate (%), Cookie Window (days), Status badge (Approved=green/Pending=amber/Rejected=red/Not Applied=gray), Lifetime Earnings, Last Payout. Add Program button → modal with all fields. Edit/delete inline.

*Ad Networks (DisplayAdNetwork):* Table: Network, Status badge, Current RPM, Monthly Revenue, Current Sessions. Qualification Progress bar: `(currentMonthlySessions / monthlySessionsRequired) * 100`, color coded (green ≥100%, amber 50–99%, red <50%), helper text "X sessions needed to qualify" when not qualified. Add Network → modal.

*Revenue (RevenueEntry):* Monthly entries table. Columns: Month/Year, Source Type, Source Name, Revenue, Sessions, RPM (read-only calculated), EPC (read-only calculated). Monthly sparkline (small recharts). Add Revenue Entry → modal (Month picker, Year, Source Type, Source Name, Revenue, Sessions, Pageviews, Clicks; show live RPM/EPC preview in modal as user types). Totals strip: YTD Revenue, All-time Revenue.

*Content (AffiliateContentBrief):* Brief list. Status filter tabs (All / Briefed / In Progress / Review / Published / Needs Refresh). Table columns: Keyword, Type badge, Writer, Status badge, Due Date, [if published: URL, Position, Traffic, Revenue, Refresh Due flag]. "Needs Refresh" rows highlighted amber. Add Brief → modal/drawer. Bulk assign: checkbox select + "Assign Writer" button. Writer field accepts free text (not just user picker).

*Valuation (SiteValuation):* Current valuation card: Monthly Net Profit / Multiple / Estimated Value (large, prominent). Listing Status badge. Past valuations history table. Add Valuation → modal: Monthly Net Profit input, Multiple input (default 36), Estimated Value live preview (updates as user types: `netProfit × multiple`), Broker Listing Status select, Listed Price (conditional), Sale Price + Sale Date (if sold), Notes.

**G3: `/revenue` — Revenue Dashboard**

Create `src/app/(dashboard)/revenue/page.tsx`.

Top row: 4 MetricTile components: Portfolio MRR (total all active sites this month), Total Traffic (sum sessions), Average RPM, Total Sites with breakdown (Active X / Dormant X / For Sale X).

Revenue by Site table: Site name, This Month, Last Month, MoM Change (% with up/down arrow), Traffic, RPM, Primary Monetization. Sortable. Click row → site detail.

Monthly Trend Chart: recharts LineChart, last 12 months, total portfolio revenue. Use existing chart patterns from the codebase.

Revenue by Source: recharts PieChart or BarChart showing % affiliate vs % display vs % other.

Data: fetch from `/api/affiliate/sites` (for site list + current revenue) + `/api/affiliate/sites/[id]/revenue` for history. Or build a dedicated summary endpoint if needed.

Empty state: "Add revenue entries to your sites to see portfolio performance here."

**G4: `/acquisitions` — Acquisition Pipeline**

Create `src/app/(dashboard)/acquisitions/page.tsx`.

Kanban board pattern — look at `/pipeline/page.tsx` first. 5 columns: Researching | Due Diligence | Negotiating | Purchased | Passed.

Cards: Domain (bold), Niche, Asking Price (if set), Monthly Revenue (if set), DA (if set), Source badge.

Passed column: collapsed by default (show "X passed" label), click to expand.

Add Target button → drawer with all AcquisitionTarget fields.

Click card → detail drawer: all fields editable, notes section prominent, stage selector.

When stage changes to Purchased: show inline prompt "Create a site record for this domain?" with pre-filled modal (domain, niche, acquisitionCost = purchasePrice, acquisitionDate = purchasedDate).

Empty state per column.

**G5: Content Calendar — Affiliate Mode**

Read `/src/app/(dashboard)/content/page.tsx` carefully. Do NOT break it for GHM.

Add conditional blocks gated on `verticalType === 'affiliate_portfolio'`:

- Site filter dropdown at top (GET `/api/affiliate/sites` for options, filter displayed briefs)
- Extra columns on published rows: Published URL (linked), Current Position, Monthly Traffic, Attributed Revenue
- Refresh Due indicator: amber badge on rows where `refreshDue === true`
- Writer field: allow free text entry (contractor name) not just user ID picker
- Bulk assign: when multiple rows selected, show "Assign Writer" action
- Needs Refresh sub-tab: separate tab showing only `refreshDue === true` briefs, sorted by `attributedMonthlyRevenue` desc, with "Mark Refreshed" action

All of this should be invisible to GHM tenant.

**G6: Portfolio Intelligence Dashboard**

Add affiliate intelligence widgets to the dashboard when `verticalType === 'affiliate_portfolio'`. Add as a new section or replace/augment the existing dashboard widget area for this vertical.

Widgets:

*Top Earners:* Top 5 sites by `monthlyRevenueCurrent`. Small BarChart or ranked list with revenue figures next to site names.

*Site Health:* Per-site health badge (green/amber/red). Health = composite of: traffic trend (last 3 months RevenueEntry sessions: up/flat/down), revenue trend (last 3 months revenue: up/flat/down), content freshness (% of published briefs where `refreshDue === false`). Green = all good, Amber = one concern, Red = two+ concerns.

*Qualification Tracker:* Sites where `DisplayAdNetwork.status === 'NOT_QUALIFIED'` or `'PENDING'`. Show progress bar: `currentMonthlySessions / monthlySessionsRequired`. Label: "X sessions to Mediavine" or "X sessions to AdThrive".

*Content Velocity:* Table: Site name | Briefs published this month | Briefs published last month | Change. Highlight stalled sites (0 published this month).

*Portfolio Valuation:* Single metric tile: total estimated value = sum of the most recent `SiteValuation.estimatedValue` per active site.

All widgets: empty state when insufficient data.

**G7: Nav Updates**

Find the sidebar/nav component. Add `verticalType === 'affiliate_portfolio'` conditional rendering:

Show in nav:
- Sites (with "Acquisition Pipeline" as sub-item)
- Revenue (standalone)
- Content (shared with SEO vertical, filtered)

Hide from nav (module toggle off):
- Invoicing / Billing
- Lead Pipeline / Prospects
- Partners
- Work Orders
- Proposals
- Client Portal
- Territories

All nav labels: pull from terminology config, not hardcoded strings.

GHM tenant: zero change. Test this.

---

**Track H — Ridgeline Seed Script**

Create `scripts/seed-ridgeline.ts`. Use upsert pattern from `scripts/seed-tenants.ts`. Idempotent — safe to run multiple times, produces identical result.

**Step 1:** Upsert ridgeline tenant in meta-DB tenants table. Set `verticalType: 'affiliate_portfolio'` in config JSON.

**Step 2:** Using ridgeline's DB connection, upsert all 12 sites (see blueprint table for exact domains, niches, statuses, revenue figures).

**Step 3:** For each active site, upsert affiliate programs. Use realistic networks (amazon, shareasale, cj, impact), realistic commission rates, realistic lifetime earnings proportional to the site's revenue and age.

**Step 4:** For each site, upsert display ad networks. Mediavine ACTIVE on trailgearreviews + peakpackinglist (currentMonthlySessions above the 50K threshold). Ezoic ACTIVE on budgetbackpacker, firsttimeinvestor, mortgagecalchelp, pawsandplans. AdSense NOT_QUALIFIED on home improvement sites.

**Step 5:** For each active site, upsert 12 months of RevenueEntry records. Growth curves:
- trailgearreviews: month -12 = $2,100 → month -1 = $4,800, steady linear growth
- peakpackinglist: $1,400 → $3,200
- budgetbackpacker: $600 → $1,400
- firsttimeinvestor: $900 → $2,100
- simplesavingsguide: $400 → $890
- mortgagecalchelp: $700 → $1,650
- weekendrenovator: $300 → $640
- tiledaddy: flat $120–140 (dormant, slight decline)
- drywallpro: $60 → $0 (declining → dormant)
- pawsandplans: $700 → $1,780

For Mediavine-active sites: each month split 60% display (Mediavine) + 40% affiliate (Amazon).
For Ezoic-active sites: 40% display (Ezoic) + 60% affiliate split across programs.
For affiliate-only sites: split proportionally across the site's programs.

**Step 6:** Upsert 6 acquisition targets with correct stages (see blueprint for all 6 details).

**Step 7:** Upsert 46 content briefs. Distribute across sites — higher-traffic sites get more briefs. Use real keyword examples:
- Outdoor gear: "best trekking poles 2025", "ultralight backpacking gear", "osprey atmos vs stratos", "best hiking boots for wide feet", "lightweight sleeping bag comparison"
- Personal finance: "how to start investing with $1000", "betterment vs wealthfront", "index fund vs ETF for beginners", "best high yield savings account", "roth IRA income limits 2025"
- Home improvement: "how to tile a bathroom floor", "drywall patching guide", "weekend deck build cost", "best tile saw for DIY", "ceramic vs porcelain tile"
- Pet care: "best dog food for senior dogs", "senior dog joint supplements", "how often to walk a 10 year old dog", "small dog apartment guide", "puppy vs adult food transition"

Status distribution: 8 published+refreshDue=true (use decayed position: was pos 1-3, now pos 6-12), 14 published+healthy (pos 1-8, with traffic + attributed revenue), 10 in review, 8 in progress, 6 briefed.

**Step 8:** Upsert 2 valuations:
- seniorpetguide.com: `monthlyNetProfit: 2000, multipleUsed: 36, estimatedValue: 72000, brokerListingStatus: 'LISTED', listedPrice: 82000, broker: 'Empire Flippers'`
- smalldogworld.net: `monthlyNetProfit: 1900, multipleUsed: 36, estimatedValue: 68400, brokerListingStatus: 'SOLD', salePrice: 68000, saleDate: [8 months ago], broker: 'Motion Invest'`

**Run the script:**
```bash
npx tsx scripts/seed-ridgeline.ts
```

Confirm output logs expected counts. If any individual upsert fails, log the error and continue — don't abort the full seed.

---

**Track I — GSC/GA4 Site Extension**

1. Schema already has the new Site fields from Phase 1 migration (`gscPropertyId`, `ga4PropertyId`, etc.) — no new migration needed.

2. Find the existing GSC integration code. Search for `gsc` or `search-console` in `src/lib/` or `src/app/api/`. Read the entire file before touching it.

3. The existing function probably looks like `fetchGSCData(clientId: number)`. Refactor to accept `{ type: 'client', id: number } | { type: 'site', id: number }`. Preserve existing client behavior exactly.

4. For Site type: after fetching GSC data, loop through URL rows. For each URL, find matching `AffiliateContentBrief` where `publishedUrl` matches the GSC URL. When found:
   - Update `currentRankingPosition` from GSC position
   - Update `currentMonthlyTraffic` from GSC clicks
   - Update `lastRankCheck = new Date()`
   - If `peakRankingPosition` is null → set it to current position
   - If current position is better (lower) than peak → update `peakRankingPosition`
   - If `currentRankingPosition - peakRankingPosition > 5` → set `refreshDue = true`

5. For GA4: similarly parameterize. For Site type: update `DisplayAdNetwork.currentMonthlySessions` for the active network on that site using GA4 session data.

6. Add GSC/GA4 connection UI to Site Detail Overview tab. Use exactly the same component/pattern as the existing client GSC connection UI — just pass `siteId` instead of `clientId`.

---

### PHASE 4 — Import UI + Verification (Parallel)

**Track J — Import UI**

Find `src/app/(dashboard)/settings/page.tsx`. Add a "Data Import" tab (admin-only, same guard as existing admin tabs).

Tab content:
- Heading: "Import Revenue Data"
- Source selector (`<select>`): ShareASale | Amazon Associates | CJ Affiliate | Generic CSV
- Site selector (`<select>`): fetch from `/api/affiliate/sites`, list all tenant sites
- File input (`<input type="file" accept=".csv">`)
- When file selected: parse client-side using PapaParse (or similar) to show preview
  - Preview table: first 5 rows of detected data
  - "X rows detected" summary
- Confirm Import button → `POST /api/affiliate/import` with FormData (source, siteId, file)
- Loading state while importing
- Success state: "Imported X entries. Skipped Y duplicates."
- Error state: show `errors[]` array from API response

Only show this tab when `verticalType === 'affiliate_portfolio'` OR show to all tenants (import is additive, harmless if accessed by SEO tenant — your call based on existing settings tab pattern).

**Track K — End-to-End Verification**

Log into the ridgeline tenant (or simulate it via the debug endpoint if browser access isn't available).

Check each surface:
1. `/sites` — 12 sites visible, correct status badges, revenue figures visible
2. `/sites/trailgearreviews.com-id` — Programs tab shows 4 programs with correct status colors; Ad Networks shows Mediavine as ACTIVE with progress bar at 100%+; Revenue tab shows 12 monthly entries + sparkline; Valuation tab (no valuation for this site — shows empty state)
3. `/revenue` — Portfolio MRR > $18,000 (sum of all active sites); monthly trend chart shows 12 months of growth; source breakdown shows affiliate vs display split
4. `/acquisitions` — 6 targets across 5 columns (Researching×2, Due Diligence×2, Negotiating×1, Passed×1); Passed column collapsed
5. Content Calendar — 46 briefs; Needs Refresh tab shows 8 items sorted by attributed revenue
6. `/sites/seniorpetguide.com-id` Valuation tab — shows LISTED status, $82,000, Empire Flippers
7. Portfolio intelligence dashboard — Top Earners widget shows trailgearreviews leading; Qualification Tracker shows sites working toward Mediavine

GHM regression check:
- Log into GHM tenant
- `/clients` — client list loads normally
- `/leads` — pipeline loads normally
- `/settings` — no new tabs visible that shouldn't be there
- Console: zero errors

CSV round-trip:
- Create a test CSV file with 3 rows in ShareASale format
- Upload via Settings → Data Import
- Verify 3 entries appear in a site's Revenue tab
- Upload again — verify skipped count = 3 (duplicate detection working)

---

### PHASE 5 — Gate + Close (Sequential)

**Track L — TypeScript Gate**

```bash
npx tsc --noEmit
```

Zero new errors in any Sprint 38–40 file. Pre-existing errors in untouched files are acceptable — count them and include in commit message. At Sprint 37 close there were 12 pre-existing errors — that number should not increase.

Fix any errors in new files before proceeding.

**Track M — Sprint Close**

1. Update `CHANGELOG.md` — add entry at the top:
```
## Sprints 38–40 — Affiliate Vertical Complete (March 3, 2026) — commit [hash]
Data layer: 6 new Prisma models (Site, AffiliateProgram, DisplayAdNetwork, RevenueEntry, 
AcquisitionTarget, AffiliateContentBrief, SiteValuation) + 7 enums. Module toggle config 
(AFFILIATE_MODULE_DEFAULTS). Terminology config (AFFILIATE_TERMINOLOGY). Full CRUD API routes 
under /api/affiliate/ (30+ routes). CSV import route with 4 source parsers + dedup detection.
UI: 7 new surfaces — site portfolio (/sites), site detail (6 tabs), revenue dashboard (/revenue),
acquisition pipeline (/acquisitions), content calendar affiliate mode, portfolio intelligence 
dashboard widgets, nav updates. Empty states on all new surfaces.
Demo: Ridgeline Media LLC tenant seeded — 12 sites (4 niches), 12mo revenue history per site,
38+ affiliate programs, display ad networks, 46 content briefs (8 needs-refresh), 6 acquisition
targets, 2 site valuations. All data realistic and specific.
Intelligence: GSC/GA4 parameterized to accept Site records. Brief rank/traffic updates on GSC 
pull. Display network session updates on GA4 pull. Import UI in Settings → Data Import.
TypeScript: zero new errors ([X] pre-existing unaffected).
Vertical 2 demo-ready. Proper Sluice onboards as real tenant via standard provisioning — no code
changes required.
```

2. Update `STATUS.md` — change Last Updated line:
```
Last Updated: March 3, 2026 — Sprints 38–40 shipped [commit]. Vertical 2 affiliate portfolio 
complete. ridgeline.covos.app demo-ready. Next: Sprint 34-OPS (David manual, 
THIRD_PARTY_MIGRATION.md). Proper Sluice onboards as real tenant via standard provisioning flow.
```

3. Update `BACKLOG.md`:
- Find Sprint 38, 39, 40 rows in the sprint sequence table — mark each ✅ SHIPPED [commit]
- Delete the "VERTICAL 2 — Affiliate Portfolio Sprints" section from the open work area (the three sprint detail blocks)

4. Commit and push:
```bash
git add -A
git commit -m "Sprints 38-40: Affiliate vertical complete — 6 Prisma models, 30+ API routes, 7 UI surfaces, Ridgeline demo tenant, GSC/GA4 Site integration, CSV network import. Vertical 2 demo-ready."
git push origin main
```

---

## Quality Standards

**Seed data quality:** Every site has a real-looking domain, a specific niche (not just "outdoor"), realistic monthly revenue, and keywords that actually exist. No "Test Site", no "Lorem ipsum", no placeholder text anywhere in the Ridgeline data.

**Revenue coherence:** Growing sites have growing revenue curves. Dormant sites have flat or declining curves. The numbers make sense together — the portfolio earns ~$18,000/month total which is believable for a 12-site operation.

**UI consistency:** Every new page looks like it was designed by the same person who designed the existing pages. Same spacing, same component choices, same interaction patterns. No new patterns introduced.

**GHM isolation:** Log into GHM after every major UI change and confirm nothing is visible that shouldn't be. The affiliate vertical is invisible to GHM.

**Tenant isolation:** Every single Prisma query in every route has `where: { tenantId }`. No exceptions.

---

## Hard Constraints

- Never modify existing models (Client, Lead, existing ContentBrief if it exists)
- Never modify GHM tenant config, GHM seed data, or any existing GHM page behavior
- Never hardcode "Proper Sluice" anywhere — Ridgeline is the generic template
- Seed script must be idempotent — running it twice produces the same database state as running it once
- No `any` types in TypeScript — use Prisma generated types
- CSV parser must handle real-world messiness: extra whitespace in headers, mixed date formats, empty rows
- All new routes: auth + tenant scope, no exceptions
- All new pages: behind auth, no exceptions
