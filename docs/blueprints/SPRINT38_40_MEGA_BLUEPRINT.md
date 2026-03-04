# SPRINT 38–40 MEGA-SPRINT — Affiliate Vertical: Complete Build
**Created:** March 3, 2026
**Status:** READY TO RUN
**Cowork prompt:** `docs/blueprints/SPRINT38_40_COWORK_PROMPT.md`
**Depends on:** Sprints 34–37 complete ✅ (commit dfe0d5c)
**Replaces:** Individual SPRINT38, SPRINT39, SPRINT40 blueprints (retained for reference)

---

## Objective

Build the complete COVOS Vertical 2 (Affiliate / Domain Portfolio) in a single Cowork run. Data layer, UI, demo tenant, and intelligence layer — delivered end-to-end. Parallelized wherever the dependency chain allows.

**Done = `ridgeline.covos.app` is a fully populated, showable affiliate portfolio demo. Proper Sluice can be onboarded as a real tenant through the standard provisioning flow with zero code changes.**

---

## Done Criteria

### Data Layer (Sprint 38 scope)
- [ ] All 6 Prisma models in schema, migrated to Neon: `Site`, `AffiliateProgram`, `DisplayAdNetwork`, `RevenueEntry`, `AcquisitionTarget`, `AffiliateContentBrief`, `SiteValuation`
- [ ] All enums created: `SiteStatus`, `AffiliateProgramStatus`, `AdNetworkStatus`, `RevenueSourceType`, `AcquisitionStage`, `ContentType`, `BriefStatus`, `ValuationListingStatus`
- [ ] `AFFILIATE_MODULE_DEFAULTS` exported from config
- [ ] `AFFILIATE_TERMINOLOGY` wired into tenant resolver for `verticalType === 'affiliate_portfolio'`
- [ ] `verticalType` field added to `TenantConfig`
- [ ] Full CRUD API routes under `/api/affiliate/` — all models covered
- [ ] Calculated fields computed server-side: RPM, EPC, estimatedValue, qualificationProgress, refreshDue
- [ ] `npx prisma validate` passes clean

### UI Layer (Sprint 39 scope)
- [ ] `/sites` — Site Portfolio page with list, create/edit modal, status badges
- [ ] `/sites/[id]` — Site Detail with 6 tabs: Overview, Programs, Ad Networks, Revenue, Content, Valuation
- [ ] `/revenue` — Revenue Dashboard: portfolio totals, per-site table, monthly trend chart, source breakdown
- [ ] `/acquisitions` — Acquisition Pipeline kanban (5 stages), add/edit drawer, Purchased → create Site prompt
- [ ] Content Calendar affiliate mode: site filter, post-publish tracking, Needs Refresh queue
- [ ] Portfolio Intelligence Dashboard widgets: top earners, site health scores, qualification tracker, content velocity, portfolio valuation summary
- [ ] Nav renders affiliate vertical correctly; GHM tenant sees zero change
- [ ] Empty states on every new surface
- [ ] All new pages behind auth + tenant scope

### Demo Tenant (Sprint 40 scope)
- [ ] `ridgeline` tenant seeded in meta-DB tenants table, `verticalType: 'affiliate_portfolio'`
- [ ] 12 sites seeded across 4 niches with all fields populated
- [ ] 38+ affiliate programs across all active sites (2–4 per site)
- [ ] Display ad networks seeded (Mediavine active ×2, Ezoic ×4, not-qualified rest)
- [ ] 12 months revenue history per active site per source — realistic growth curves
- [ ] 6 acquisition targets across all pipeline stages
- [ ] 46 content briefs (mix of statuses, published ones have position/traffic data, 8 flagged refreshDue)
- [ ] 2 site valuations (1 listed, 1 sold)
- [ ] Seed script is idempotent — safe to run multiple times
- [ ] All data looks real: real niches, real keywords, plausible revenue figures

### Intelligence Layer (Sprint 40 scope)
- [ ] `gscPropertyId`, `ga4PropertyId`, `gscConnectedAt`, `ga4ConnectedAt` added to `Site` model and migrated
- [ ] GSC/GA4 fetch logic parameterized to accept `{ type: 'client' | 'site', id: number }`
- [ ] GSC pull updates `AffiliateContentBrief.currentRankingPosition`, `currentMonthlyTraffic`, `lastRankCheck`
- [ ] Rank decay logic: if position decayed >5 from peak, set `refreshDue = true`; if improved, update `peakRankingPosition`
- [ ] GA4 pull updates `DisplayAdNetwork.currentMonthlySessions`
- [ ] GSC/GA4 connection UI on Site Detail (same pattern as client GSC connection)
- [ ] CSV import API: `POST /api/affiliate/import` — ShareASale, Amazon Associates, CJ, generic
- [ ] Duplicate detection: skip existing `[tenantId, siteId, month, year, sourceType, sourceName]` combinations
- [ ] Import UI: Settings → Data Import tab with source selector, site selector, file upload, preview, confirm, success/error states

### Gate
- [ ] TypeScript: zero new errors across all Sprint 38–40 files
- [ ] End-to-end: ridgeline tenant loads all 7 surfaces with data, zero console errors
- [ ] GHM regression: all existing GHM pages work exactly as before
- [ ] CSV import round-trip tested (upload → preview → confirm → entries appear in Revenue tab)
- [ ] CHANGELOG.md, STATUS.md, BACKLOG.md updated
- [ ] Committed and pushed to `origin/main`

---

## Dependency Map

```
PHASE 1 ──────────────────────────────────────────────────────── SEQUENTIAL
  Track A: Prisma schema (6 models + enums + gscPropertyId/ga4PropertyId on Site)
  Track B: npx prisma migrate dev --name affiliate-vertical-complete
  Track C: Module toggle config + Terminology config
  (All three can be written in parallel; migration runs after schema is final)

PHASE 2 ──────────────────────────────────────────────────────── SEQUENTIAL
  Track D: API routes — Site, AffiliateProgram, DisplayAdNetwork
  Track E: API routes — RevenueEntry, AcquisitionTarget, AffiliateContentBrief, SiteValuation
  Track F: API route — POST /api/affiliate/import (CSV parser, all 4 source types, dedup logic)
  (D, E, F can run in parallel within Phase 2 — all depend only on Phase 1 migration)

PHASE 3 ──────────────────────────────────────────────────────── PARALLEL
  Track G: Sprint 39 UI — all 7 surfaces (largest track)
  Track H: Ridgeline seed script (scripts/seed-ridgeline.ts) + run it
  Track I: GSC/GA4 Site extension (parameterize existing fetch logic, add connection UI to Site Detail)

PHASE 4 ──────────────────────────────────────────────────────── PARALLEL
  Track J: Import UI (Settings → Data Import tab) — depends on Track F API route
  Track K: End-to-end verification (ridgeline tenant, GHM regression, CSV import test) — depends on Tracks G + H

PHASE 5 ──────────────────────────────────────────────────────── SEQUENTIAL
  Track L: TypeScript gate (npx tsc --noEmit — zero new errors)
  Track M: Sprint close (CHANGELOG, STATUS, BACKLOG, git commit, push)
```

---

## Phase 1 — Schema + Config

### Track A: Prisma Schema

Add to `prisma/schema.prisma` after existing models. All models have `tenantId Int` and `@@index([tenantId])`.

**Site:**
```prisma
model Site {
  id                    Int        @id @default(autoincrement())
  tenantId              Int
  slug                  String
  domain                String
  displayName           String
  niche                 String?
  category              String?
  status                SiteStatus @default(ACTIVE)
  launchDate            DateTime?
  acquisitionDate       DateTime?
  acquisitionCost       Float?
  monthlyRevenueCurrent Float?
  monthlyTrafficCurrent Int?
  domainAuthority       Int?
  domainRating          Int?
  cms                   String?
  hostingProvider       String?
  hostingCostMonthly    Float?
  monetizationMix       String     @default("both")
  gscPropertyId         String?
  ga4PropertyId         String?
  gscConnectedAt        DateTime?
  ga4ConnectedAt        DateTime?
  notes                 String?
  createdAt             DateTime   @default(now())
  updatedAt             DateTime   @updatedAt

  affiliatePrograms  AffiliateProgram[]
  adNetworks         DisplayAdNetwork[]
  revenueEntries     RevenueEntry[]
  contentBriefs      AffiliateContentBrief[]
  valuations         SiteValuation[]
  acquisitionTarget  AcquisitionTarget?

  @@unique([tenantId, slug])
  @@index([tenantId])
}

enum SiteStatus { ACTIVE DORMANT FOR_SALE SOLD }
```

**AffiliateProgram:**
```prisma
model AffiliateProgram {
  id                Int                    @id @default(autoincrement())
  tenantId          Int
  siteId            Int
  networkName       String
  merchantName      String
  merchantUrl       String?
  commissionRate    Float?
  commissionType    String                 @default("percent")
  cookieWindowDays  Int?
  payoutThreshold   Float?
  paymentSchedule   String?
  applicationStatus AffiliateProgramStatus @default(NOT_APPLIED)
  approvedDate      DateTime?
  lifetimeEarnings  Float                  @default(0)
  lastPayoutAmount  Float?
  lastPayoutDate    DateTime?
  notes             String?
  createdAt         DateTime               @default(now())
  updatedAt         DateTime               @updatedAt
  site              Site                   @relation(fields: [siteId], references: [id], onDelete: Cascade)
  @@index([tenantId, siteId])
}

enum AffiliateProgramStatus { NOT_APPLIED PENDING APPROVED REJECTED }
```

**DisplayAdNetwork:**
```prisma
model DisplayAdNetwork {
  id                      Int             @id @default(autoincrement())
  tenantId                Int
  siteId                  Int
  networkName             String
  status                  AdNetworkStatus @default(NOT_QUALIFIED)
  monthlySessionsRequired Int?
  currentMonthlySessions  Int?
  currentRPM              Float?
  monthlyRevenueCurrent   Float?
  activeSince             DateTime?
  notes                   String?
  createdAt               DateTime        @default(now())
  updatedAt               DateTime        @updatedAt
  site                    Site            @relation(fields: [siteId], references: [id], onDelete: Cascade)
  @@index([tenantId, siteId])
}

enum AdNetworkStatus { ACTIVE PENDING NOT_QUALIFIED REJECTED }
```

**RevenueEntry:**
```prisma
model RevenueEntry {
  id         Int               @id @default(autoincrement())
  tenantId   Int
  siteId     Int
  month      Int
  year       Int
  sourceType RevenueSourceType
  sourceName String
  revenue    Float
  sessions   Int?
  pageviews  Int?
  clicks     Int?
  rpm        Float?
  epc        Float?
  notes      String?
  createdAt  DateTime          @default(now())
  updatedAt  DateTime          @updatedAt
  site       Site              @relation(fields: [siteId], references: [id], onDelete: Cascade)
  @@unique([tenantId, siteId, month, year, sourceType, sourceName])
  @@index([tenantId, siteId])
}

enum RevenueSourceType { AFFILIATE DISPLAY SPONSORED SALE OTHER }
```

**AcquisitionTarget:**
```prisma
model AcquisitionTarget {
  id                    Int              @id @default(autoincrement())
  tenantId              Int
  siteId                Int?             @unique
  domain                String
  niche                 String?
  category              String?
  stage                 AcquisitionStage @default(RESEARCHING)
  source                String?
  askingPrice           Float?
  offeredPrice          Float?
  purchasePrice         Float?
  currentMonthlyTraffic Int?
  currentMonthlyRevenue Float?
  domainAuthority       Int?
  domainAge             Int?
  broker                String?
  dueDiligenceNotes     String?
  decisionNotes         String?
  targetPurchaseDate    DateTime?
  purchasedDate         DateTime?
  createdAt             DateTime         @default(now())
  updatedAt             DateTime         @updatedAt
  site                  Site?            @relation(fields: [siteId], references: [id])
  @@index([tenantId])
}

enum AcquisitionStage { RESEARCHING DUE_DILIGENCE NEGOTIATING PURCHASED PASSED }
```

**AffiliateContentBrief:**
```prisma
model AffiliateContentBrief {
  id                       Int         @id @default(autoincrement())
  tenantId                 Int
  siteId                   Int
  targetKeyword            String
  searchVolume             Int?
  keywordDifficulty        Int?
  contentType              ContentType @default(ARTICLE)
  assignedWriterUserId     Int?
  assignedWriterName       String?
  wordCountTarget          Int?
  status                   BriefStatus @default(BRIEFED)
  dueDate                  DateTime?
  publishedDate            DateTime?
  publishedUrl             String?
  currentRankingPosition   Int?
  peakRankingPosition      Int?
  currentMonthlyTraffic    Int?
  attributedMonthlyRevenue Float?
  lastRankCheck            DateTime?
  lastTrafficPull          DateTime?
  refreshDue               Boolean     @default(false)
  notes                    String?
  createdAt                DateTime    @default(now())
  updatedAt                DateTime    @updatedAt
  site                     Site        @relation(fields: [siteId], references: [id], onDelete: Cascade)
  @@index([tenantId, siteId])
}

enum ContentType { ARTICLE REVIEW COMPARISON LISTICLE LANDING OTHER }
enum BriefStatus { BRIEFED IN_PROGRESS REVIEW PUBLISHED NEEDS_REFRESH }
```

**SiteValuation:**
```prisma
model SiteValuation {
  id                  Int                    @id @default(autoincrement())
  tenantId            Int
  siteId              Int
  valuationDate       DateTime               @default(now())
  monthlyNetProfit    Float
  multipleUsed        Float                  @default(36)
  estimatedValue      Float
  brokerListingStatus ValuationListingStatus @default(NOT_LISTED)
  listedPrice         Float?
  salePrice           Float?
  saleDate            DateTime?
  broker              String?
  notes               String?
  createdAt           DateTime               @default(now())
  updatedAt           DateTime               @updatedAt
  site                Site                   @relation(fields: [siteId], references: [id], onDelete: Cascade)
  @@index([tenantId, siteId])
}

enum ValuationListingStatus { NOT_LISTED LISTED UNDER_OFFER SOLD }
```

After writing all models: `npx prisma migrate dev --name affiliate-vertical-complete`
Then: `npx prisma validate`

### Track B + C: Config

Add to `TenantConfig`:
```typescript
verticalType?: 'seo_agency' | 'affiliate_portfolio' | 'generic'
```

Export from config file:
```typescript
export const AFFILIATE_MODULE_DEFAULTS = {
  sitePortfolio: true, contentCalendar: true, taskManagement: true,
  acquisitionPipeline: true, affiliateProgramRegistry: true,
  displayAdNetworks: true, revenueDashboard: true, portfolioIntelligence: true,
  siteValuation: true, vault: true, teamManagement: true, reporting: true,
  waveBilling: false, partnerManagement: false, googleBusinessProfile: false,
  googleAds: false, workOrders: false, proposals: false, clientPortal: false,
  territories: false, timeTracking: false, leadPipeline: false,
}

export const AFFILIATE_TERMINOLOGY = {
  client: 'Site', clients: 'Sites', clientSingular: 'site',
  lead: 'Target', leads: 'Targets', pipeline: 'Acquisition Pipeline',
  rep: 'Content Manager', reps: 'Content Managers', workOrder: null,
  partner: 'Contractor', partners: 'Contractors',
  clientHealth: 'Site Health', newClient: 'Add Site',
}
```

Wire into terminology resolver: when `verticalType === 'affiliate_portfolio'`, return `AFFILIATE_TERMINOLOGY`.

---

## Phase 2 — API Routes

All routes under `src/app/api/affiliate/`. All routes: `withAuth` + `withPermission`. All routes: `tenantId` from resolved session, never from request body. All queries filter by `tenantId`.

**Site routes:** `GET/POST /api/affiliate/sites`, `GET/PUT/DELETE /api/affiliate/sites/[id]`

**Program routes:** `POST/GET /api/affiliate/sites/[id]/programs`, `PUT/DELETE /api/affiliate/programs/[id]`

**Network routes:** `POST/GET /api/affiliate/sites/[id]/networks`, `PUT /api/affiliate/networks/[id]`

**Revenue routes:** `POST/GET /api/affiliate/sites/[id]/revenue`, `PUT /api/affiliate/revenue/[id]`
- On create/update: compute `rpm = (revenue / sessions) * 1000` if sessions > 0; compute `epc = revenue / clicks` if clicks > 0
- GET response: include virtual field `qualificationProgress` on network records

**Acquisition routes:** `GET/POST /api/affiliate/acquisitions`, `GET/PUT/DELETE /api/affiliate/acquisitions/[id]`

**Brief routes:** `POST/GET /api/affiliate/sites/[id]/briefs`, `GET/PUT/DELETE /api/affiliate/briefs/[id]`
- On PUT: if `currentRankingPosition` updated, compare to `peakRankingPosition`; decay >5 → set `refreshDue = true`; improvement → update `peakRankingPosition`

**Valuation routes:** `POST/GET /api/affiliate/sites/[id]/valuations`, `PUT /api/affiliate/valuations/[id]`
- On create/update: compute `estimatedValue = monthlyNetProfit * multipleUsed`

**Import route:** `POST /api/affiliate/import` — multipart form (source, siteId, CSV file)
- Source parsers: ShareASale (Transaction Date, Merchant, Commission → group by month/merchant), Amazon (Date, Shipped Revenue → group by month), CJ (Transaction Date, Advertiser, Commission → group by month/advertiser), Generic (month, year, source_type, source_name, revenue columns required)
- Duplicate detection before insert: check `@@unique([tenantId, siteId, month, year, sourceType, sourceName])`
- Return: `{ imported: number, skipped: number, errors: string[] }`

---

## Phase 3 — Parallel Tracks

### Track G: UI (Sprint 39 scope — all 7 surfaces)

Read before starting: `src/app/(dashboard)/clients/page.tsx`, `src/app/(dashboard)/clients/[id]/page.tsx`, `src/app/(dashboard)/pipeline/page.tsx`, `src/app/(dashboard)/content/page.tsx`, `src/components/ui/empty-state.tsx`, `src/components/ui/status-badge.tsx`, `src/components/ui/metric-tile.tsx`

**1. `/sites` — Site Portfolio**
- Header: "Sites" + "Add Site" button
- Table: Domain, Niche, Status badge, Monthly Revenue, Monthly Traffic, DA, Monetization Mix, Actions
- Add/Edit modal: all Site fields
- Wire to `/api/affiliate/sites`
- Empty state: "No sites yet. Add your first site to start tracking your portfolio."

**2. `/sites/[id]` — Site Detail (6 tabs)**
- Header: domain, status badge, quick stats (Revenue, Traffic, DA/DR, Program count, Brief count)
- **Overview tab:** all Site fields, editable
- **Programs tab:** table (Network, Merchant, Commission Rate, Cookie Window, Status badge, Lifetime Earnings, Last Payout). Status colors: Approved=green, Pending=amber, Rejected=red. Add Program → modal.
- **Ad Networks tab:** table with Qualification Progress bar (`currentMonthlySessions / monthlySessionsRequired * 100`). Green ≥100%, Amber 50–99%, Red <50%. Helper text: "X sessions needed to qualify."
- **Revenue tab:** monthly entries table + sparkline + totals (YTD, all-time). RPM and EPC as read-only calculated fields. Add Revenue Entry → modal.
- **Content tab:** brief list per site. Filter by status. Post-publish columns on published rows (URL, Position, Traffic, Revenue). Needs Refresh badge. Bulk assign writer. Add Brief → modal/drawer.
- **Valuation tab:** current valuation card (Net Profit / Multiple / Estimated Value live-calculated). History table. Add Valuation → modal with live `estimatedValue` preview as user types.

**3. `/revenue` — Revenue Dashboard**
- 4 metric tiles: Portfolio MRR, Total Traffic, Avg RPM, Total Sites (Active/Dormant/For Sale breakdown)
- Revenue by Site table (sortable, MoM change column)
- Monthly trend line chart — recharts, last 12 months, total portfolio
- Revenue by Source — pie or bar chart (affiliate vs display vs sponsored)
- Empty state when no revenue entries

**4. `/acquisitions` — Acquisition Pipeline**
- Kanban: 5 columns (Researching / Due Diligence / Negotiating / Purchased / Passed)
- Cards: Domain, Niche, Asking Price, Monthly Revenue, DA, Source badge
- Passed column: collapsed by default, expandable
- Add Target → drawer (all AcquisitionTarget fields)
- Click card → detail drawer (all fields, editable)
- Stage = Purchased: prompt to create Site record (pre-fill from target)
- Empty states per column

**5. Content Calendar — Affiliate Mode**
- Conditional on `verticalType === 'affiliate_portfolio'` — do NOT break SEO vertical for GHM
- Site filter dropdown at top
- Post-publish columns: Published URL, Current Position, Monthly Traffic, Attributed Revenue, Refresh Due flag
- Writer field: free-text (contractor support) + user picker
- Bulk assign writer (checkbox select + action)
- Needs Refresh sub-tab: `refreshDue === true` briefs, sorted by attributed revenue desc
- Wire to `/api/affiliate/briefs`

**6. Portfolio Intelligence Dashboard**
- Top Earners widget: top 5 sites by revenue (bar chart or ranked list)
- Site Health widget: green/amber/red composite (traffic trend + revenue trend + content freshness)
- Qualification Tracker: progress bars for sites approaching Mediavine (50K) / AdThrive (100K)
- Content Velocity: articles published per site per month (table)
- Portfolio Valuation: total estimated value across all sites (sum of latest SiteValuation.estimatedValue)
- Empty states on all widgets

**7. Nav Updates**
- `verticalType === 'affiliate_portfolio'`: render Sites (with Acquisition Pipeline sub-item) + Revenue as standalone
- Hide: Invoicing, Partners, Work Orders, Proposals, Client Portal, Territories from nav
- All labels pulled from terminology config, not hardcoded
- GHM tenant: zero change

---

### Track H: Ridgeline Seed Script

Create `scripts/seed-ridgeline.ts`. Idempotent upsert pattern (see `scripts/seed-tenants.ts`).

**Tenant:** `{ slug: 'ridgeline', displayName: 'Ridgeline Media LLC', verticalType: 'affiliate_portfolio', timezone: 'America/Denver' }`

**12 Sites:**
| Domain | Niche | Status | Monthly Revenue | Monthly Sessions |
|--------|-------|--------|----------------|-----------------|
| trailgearreviews.com | Outdoor gear | Active | $4,800 | 68,000 |
| peakpackinglist.com | Outdoor gear | Active | $3,200 | 41,000 |
| budgetbackpacker.net | Outdoor gear | Active | $1,400 | 22,000 |
| firsttimeinvestor.io | Personal finance | Active | $2,100 | 18,000 |
| simplesavingsguide.com | Personal finance | Active | $890 | 12,000 |
| mortgagecalchelp.net | Personal finance | Active | $1,650 | 15,500 |
| weekendrenovator.com | Home improvement | Active | $640 | 9,200 |
| tiledaddy.com | Home improvement | Dormant | $120 | 2,100 |
| drywallpro.net | Home improvement | Dormant | $0 | 800 |
| pawsandplans.com | Pet care | Active | $1,780 | 24,000 |
| seniorpetguide.com | Pet care | For Sale | $2,400 | 31,000 |
| smalldogworld.net | Pet care | Sold | (historical) | — |

**Revenue curves:** trailgearreviews grows $2,100 → $4,800 over 12 months (linear). Other sites scale proportionally. Dormant sites: flat or declining. Split: Mediavine-active sites 60% display / 40% affiliate; Ezoic-active 40% display / 60% affiliate; affiliate-only 100% affiliate split across programs.

**Affiliate programs per site (sample — generate realistic equivalents for all):**
- trailgearreviews: Amazon Associates (3%, 24hr, APPROVED, $18,400 lifetime), REI/ShareASale (5%, 30d, APPROVED), Backcountry/CJ (6%, 45d, APPROVED), Patagonia/Impact (8%, 60d, PENDING)
- firsttimeinvestor.io: Personal Capital/Impact (flat $100/lead, APPROVED), Betterment/CJ (flat $25, APPROVED), M1 Finance/Impact (flat $30, PENDING)

**Display networks:**
- Mediavine ACTIVE on trailgearreviews + peakpackinglist (50K threshold, both above it)
- Ezoic ACTIVE on budgetbackpacker + firsttimeinvestor + mortgagecalchelp + pawsandplans
- Not-qualified on all others

**6 Acquisition Targets:**
1. hikingbootsexpert.com — Researching — 14K sessions, $800/mo, DA 28
2. campingchecklist.org — Due Diligence — $28,000 asking — 22K sessions, $1,200/mo, DA 31
3. budgetinvesting101.com — Negotiating — $45K ask / $38K offered — 19K sessions, $1,600/mo, DA 34
4. homepaintingguide.net — Researching — aged expired domain, DA 22
5. puppytrainingfirst.com — Due Diligence — $15K asking — 8K sessions, $420/mo
6. gardeningbasics.net — Passed — $55K ask, too high for revenue multiple

**Content briefs (46 total):**
- 8 published, refreshDue=true (position decayed from peak): real keywords for each niche
- 14 published, healthy (position + traffic data present)
- 10 in review
- 8 in progress
- 6 briefed

Sample keywords (trailgearreviews): "best trekking poles 2025" (pos 4, 2,400/mo), "ultralight backpacking gear" (pos 7, 1,800/mo), "osprey atmos vs stratos" (pos 9, was pos 1 — refreshDue=true)

**2 Valuations:** seniorpetguide LISTED at $82,000 on Empire Flippers (36× multiple); smalldogworld SOLD at $68,000 via Motion Invest 8 months ago.

**Log final counts:** `"Seeded: 12 sites, X programs, X networks, X revenue entries, 46 briefs, 6 targets, 2 valuations"`

---

### Track I: GSC/GA4 Site Extension

1. Site model already has `gscPropertyId`, `ga4PropertyId` fields from Phase 1 migration — no new migration needed.

2. Find existing GSC/GA4 integration code. Read fully before modifying.

3. Parameterize fetch functions to accept `{ type: 'client' | 'site', id: number }` — existing client behavior unchanged.

4. On GSC fetch for Site: match GSC URL data to `AffiliateContentBrief.publishedUrl`. Update `currentRankingPosition`, `currentMonthlyTraffic`, `lastRankCheck`. Apply decay/peak logic for `refreshDue` and `peakRankingPosition`.

5. On GA4 fetch for Site: update `DisplayAdNetwork.currentMonthlySessions` for active network.

6. Add GSC/GA4 connection fields to Site Detail Overview tab — same UI pattern as client GSC connection.

---

## Phase 4 — Import UI + Verification

### Track J: Import UI

Add "Data Import" tab to Settings page (`src/app/(dashboard)/settings/page.tsx`):
- Source selector: ShareASale / Amazon Associates / CJ Affiliate / Generic CSV
- Site selector: dropdown of all tenant sites
- File input (accept .csv)
- Upload → parse client-side → show preview (first 5 rows) + duplicate count
- Confirm → POST `/api/affiliate/import`
- Success: "Imported X entries. Skipped Y duplicates."
- Error: per-row error display

### Track K: End-to-End Verification

1. Log into ridgeline tenant in browser
2. Site Portfolio: all 12 sites visible with correct status badges
3. Revenue Dashboard: portfolio totals correct, 12-month trend chart renders
4. Acquisition Pipeline: all 6 targets in correct stages
5. Content Calendar: 46 briefs distributed, Needs Refresh queue shows 8
6. Site Detail (trailgearreviews): Programs tab (4 programs), Networks tab (Mediavine active with progress bar), Revenue tab (12 months history + sparkline), Valuation tab
7. GHM tenant: log in, verify zero regressions on all existing pages
8. CSV import: create a minimal 3-row test ShareASale CSV, upload via Settings → Data Import, verify entries appear in site Revenue tab

---

## Phase 5 — Gate + Close

### Track L: TypeScript Gate
`npx tsc --noEmit`
Zero new errors across any Sprint 38–40 files. Document pre-existing error count (was 12 at Sprint 37 close).

### Track M: Sprint Close

**CHANGELOG.md** — single entry covering Sprints 38–40 combined:
```
## Sprint 38–40 — Affiliate Vertical Complete (March 3, 2026) — commit [hash]
Data layer: 6 Prisma models, module/terminology config, full CRUD API routes.
UI: 7 new surfaces (site portfolio, site detail, revenue dashboard, acquisition pipeline,
content calendar affiliate mode, portfolio intelligence, nav updates).
Demo: Ridgeline Media LLC tenant seeded (12 sites, 46 briefs, 6 acquisition targets,
12mo revenue history). Intelligence: GSC/GA4 wired to Site records. CSV import
(ShareASale, Amazon, CJ, generic) with preview + dedup. Vertical 2 demo-ready.
Proper Sluice onboards via standard provisioning — no code changes required.
```

**STATUS.md** — update Last Updated: "Sprint 38–40 shipped [commit]. Vertical 2 demo-ready. ridgeline.covos.app live. Next: Sprint 34-OPS (David manual, THIRD_PARTY_MIGRATION.md). Proper Sluice to onboard as real tenant via standard flow."

**BACKLOG.md** — mark Sprint 38, Sprint 39, Sprint 40 rows as ✅ SHIPPED with commit hash. Delete Sprint 38/39/40 detail items from the open work section.

Then: `git add -A && git commit -m "Sprints 38-40: Affiliate vertical complete — data layer, 7 UI surfaces, Ridgeline demo tenant, GSC/GA4 Site integration, CSV network import" && git push origin main`

---

## Files To Read Before Starting (Priority Order)

```
prisma/schema.prisma                              — existing models, conventions
src/lib/tenant/config.ts                          — TenantConfig shape + registry
src/lib/tenant/server.ts                          — getTenant() + terminology resolver
src/app/api/clients/route.ts                      — API route pattern
src/middleware.ts                                 — auth/permission guards
src/app/(dashboard)/clients/page.tsx              — client list pattern → replicate for Sites
src/app/(dashboard)/clients/[id]/page.tsx         — client detail tabs → replicate for Site Detail
src/app/(dashboard)/pipeline/page.tsx             — kanban pattern → replicate for Acquisitions
src/app/(dashboard)/content/page.tsx              — content calendar → extend for affiliate mode
src/components/ui/empty-state.tsx                 — reuse everywhere
src/components/ui/status-badge.tsx                — reuse for all status displays
src/components/ui/metric-tile.tsx                 — reuse for Revenue Dashboard
src/lib/integrations/gsc.ts (or equivalent)      — extend for Site records
scripts/seed-tenants.ts                           — seed pattern for Ridgeline script
docs/VERTICAL_2_AFFILIATE_STRATEGY.md            — full vertical context
```

---

## Constraints (Non-Negotiable)

- Do NOT modify existing models (Client, Lead, existing ContentBrief if any)
- Do NOT modify GHM tenant config, GHM pages, or SEO vertical behavior
- Do NOT hardcode Proper Sluice data anywhere — Ridgeline is the generic template tenant
- All queries scoped to `tenantId` — zero cross-tenant data leakage
- Seed script must be idempotent — running twice = same result as running once
- Affiliate UI invisible to GHM tenant — `verticalType` gate on every new surface
- No `any` types in TypeScript
- No placeholder seed data — Ridgeline must look like a real company
