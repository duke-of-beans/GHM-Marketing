# SPRINT 38 — Affiliate Vertical Data Layer
**Created:** March 3, 2026
**Status:** READY TO RUN
**Cowork prompt:** `docs/blueprints/SPRINT38_COWORK_PROMPT.md`
**Depends on:** Sprints 34–37 complete ✅
**Blocks:** Sprint 39 (UI layer)

---

## Objective

Build the complete data foundation for COVOS Vertical 2 (Affiliate / Domain Portfolio). No UI beyond basic API routes — that comes in Sprint 39. This sprint is schema, migrations, seed data structures, module toggle config, and terminology config. Zero GHM or Proper Sluice specifics baked in — this is the generic vertical template.

---

## Done Criteria

- [ ] All 6 new Prisma models migrated to Neon
- [ ] All models have basic CRUD API routes (list, get, create, update, delete)
- [ ] Module toggle config for `affiliate` vertical type wired into `TenantConfig`
- [ ] Terminology config for `affiliate` vertical wired into tenant resolver
- [ ] Existing `Content` model extended with post-publish tracking fields
- [ ] `AcquisitionTarget` stage pipeline works end-to-end via API
- [ ] `RevenueEntry` monthly snapshot creates and calculates RPM/EPC
- [ ] `SiteValuation` calculates estimated value from net profit × multiple
- [ ] TypeScript: zero new errors across all Sprint 38 files
- [ ] `npx prisma validate` passes clean
- [ ] CHANGELOG.md, STATUS.md, BACKLOG.md updated and committed

---

## New Prisma Models

Add to `prisma/schema.prisma` after existing models. All models scoped to `tenantId`.

### Site
```prisma
model Site {
  id                    Int       @id @default(autoincrement())
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
  monetizationMix       String    @default("both")
  notes                 String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  affiliatePrograms  AffiliateProgram[]
  adNetworks         DisplayAdNetwork[]
  revenueEntries     RevenueEntry[]
  contentBriefs      AffiliateContentBrief[]
  valuations         SiteValuation[]
  acquisitionTarget  AcquisitionTarget?

  @@unique([tenantId, slug])
  @@index([tenantId])
}

enum SiteStatus {
  ACTIVE
  DORMANT
  FOR_SALE
  SOLD
}
```

### AffiliateProgram
```prisma
model AffiliateProgram {
  id                  Int       @id @default(autoincrement())
  tenantId            Int
  siteId              Int
  networkName         String
  merchantName        String
  merchantUrl         String?
  commissionRate      Float?
  commissionType      String    @default("percent")
  cookieWindowDays    Int?
  payoutThreshold     Float?
  paymentSchedule     String?
  applicationStatus   AffiliateProgramStatus @default(NOT_APPLIED)
  approvedDate        DateTime?
  lifetimeEarnings    Float     @default(0)
  lastPayoutAmount    Float?
  lastPayoutDate      DateTime?
  notes               String?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  site   Site @relation(fields: [siteId], references: [id], onDelete: Cascade)

  @@index([tenantId, siteId])
}

enum AffiliateProgramStatus {
  NOT_APPLIED
  PENDING
  APPROVED
  REJECTED
}
```

### DisplayAdNetwork
```prisma
model DisplayAdNetwork {
  id                         Int      @id @default(autoincrement())
  tenantId                   Int
  siteId                     Int
  networkName                String
  status                     AdNetworkStatus @default(NOT_QUALIFIED)
  monthlySessionsRequired    Int?
  currentMonthlySessions     Int?
  currentRPM                 Float?
  monthlyRevenueCurrent      Float?
  activeSince                DateTime?
  notes                      String?
  createdAt                  DateTime @default(now())
  updatedAt                  DateTime @updatedAt

  site   Site @relation(fields: [siteId], references: [id], onDelete: Cascade)

  @@index([tenantId, siteId])
}

enum AdNetworkStatus {
  ACTIVE
  PENDING
  NOT_QUALIFIED
  REJECTED
}
```

### RevenueEntry
```prisma
model RevenueEntry {
  id          Int      @id @default(autoincrement())
  tenantId    Int
  siteId      Int
  month       Int
  year        Int
  sourceType  RevenueSourceType
  sourceName  String
  revenue     Float
  sessions    Int?
  pageviews   Int?
  clicks      Int?
  rpm         Float?
  epc         Float?
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  site   Site @relation(fields: [siteId], references: [id], onDelete: Cascade)

  @@unique([tenantId, siteId, month, year, sourceType, sourceName])
  @@index([tenantId, siteId])
}

enum RevenueSourceType {
  AFFILIATE
  DISPLAY
  SPONSORED
  SALE
  OTHER
}
```

### AcquisitionTarget
```prisma
model AcquisitionTarget {
  id                    Int                     @id @default(autoincrement())
  tenantId              Int
  siteId                Int?  @unique
  domain                String
  niche                 String?
  category              String?
  stage                 AcquisitionStage        @default(RESEARCHING)
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
  assignedToId          Int?
  createdAt             DateTime                @default(now())
  updatedAt             DateTime                @updatedAt

  site         Site? @relation(fields: [siteId], references: [id])

  @@index([tenantId])
}

enum AcquisitionStage {
  RESEARCHING
  DUE_DILIGENCE
  NEGOTIATING
  PURCHASED
  PASSED
}
```

### AffiliateContentBrief
```prisma
model AffiliateContentBrief {
  id                      Int           @id @default(autoincrement())
  tenantId                Int
  siteId                  Int
  targetKeyword           String
  searchVolume            Int?
  keywordDifficulty       Int?
  contentType             ContentType   @default(ARTICLE)
  assignedWriterUserId    Int?
  assignedWriterName      String?
  wordCountTarget         Int?
  status                  BriefStatus   @default(BRIEFED)
  dueDate                 DateTime?
  publishedDate           DateTime?
  publishedUrl            String?
  currentRankingPosition  Int?
  peakRankingPosition     Int?
  currentMonthlyTraffic   Int?
  attributedMonthlyRevenue Float?
  lastRankCheck           DateTime?
  lastTrafficPull         DateTime?
  refreshDue              Boolean       @default(false)
  notes                   String?
  createdAt               DateTime      @default(now())
  updatedAt               DateTime      @updatedAt

  site   Site @relation(fields: [siteId], references: [id], onDelete: Cascade)

  @@index([tenantId, siteId])
}

enum ContentType {
  ARTICLE
  REVIEW
  COMPARISON
  LISTICLE
  LANDING
  OTHER
}

enum BriefStatus {
  BRIEFED
  IN_PROGRESS
  REVIEW
  PUBLISHED
  NEEDS_REFRESH
}
```

### SiteValuation
```prisma
model SiteValuation {
  id                   Int                   @id @default(autoincrement())
  tenantId             Int
  siteId               Int
  valuationDate        DateTime              @default(now())
  monthlyNetProfit     Float
  multipleUsed         Float                 @default(36)
  estimatedValue       Float
  brokerListingStatus  ValuationListingStatus @default(NOT_LISTED)
  listedPrice          Float?
  salePrice            Float?
  saleDate             DateTime?
  broker               String?
  notes                String?
  createdAt            DateTime              @default(now())
  updatedAt            DateTime              @updatedAt

  site   Site @relation(fields: [siteId], references: [id], onDelete: Cascade)

  @@index([tenantId, siteId])
}

enum ValuationListingStatus {
  NOT_LISTED
  LISTED
  UNDER_OFFER
  SOLD
}
```

---

## Module Toggle Config

In `src/lib/tenant/config.ts` (or wherever `TenantConfig` module toggles live), add `verticalType` field and affiliate module set:

```typescript
// Add to TenantConfig type
verticalType?: 'seo_agency' | 'affiliate_portfolio' | 'generic'

// Affiliate vertical module defaults
export const AFFILIATE_MODULE_DEFAULTS = {
  // ON
  sitePortfolio: true,
  contentCalendar: true,
  taskManagement: true,
  acquisitionPipeline: true,
  affiliateProgramRegistry: true,
  displayAdNetworks: true,
  revenueDashboard: true,
  portfolioIntelligence: true,
  siteValuation: true,
  vault: true,
  teamManagement: true,
  reporting: true,

  // OFF
  waveBilling: false,
  partnerManagement: false,
  googleBusinessProfile: false,
  googleAds: false,
  workOrders: false,
  proposals: false,
  clientPortal: false,
  territories: false,
  timeTracking: false,
  leadPipeline: false,
}
```

---

## Terminology Config

Add to tenant resolver / terminology system. When `verticalType === 'affiliate_portfolio'`:

```typescript
export const AFFILIATE_TERMINOLOGY = {
  client: 'Site',
  clients: 'Sites',
  clientSingular: 'site',
  lead: 'Target',
  leads: 'Targets',
  pipeline: 'Acquisition Pipeline',
  rep: 'Content Manager',
  reps: 'Content Managers',
  workOrder: null, // disabled
  partner: 'Contractor',
  partners: 'Contractors',
  clientHealth: 'Site Health',
  newClient: 'Add Site',
}
```

---

## API Routes Required

Create under `src/app/api/affiliate/` to avoid collision with existing routes:

```
POST   /api/affiliate/sites
GET    /api/affiliate/sites
GET    /api/affiliate/sites/[id]
PUT    /api/affiliate/sites/[id]
DELETE /api/affiliate/sites/[id]

POST   /api/affiliate/sites/[id]/programs
GET    /api/affiliate/sites/[id]/programs
PUT    /api/affiliate/programs/[id]
DELETE /api/affiliate/programs/[id]

POST   /api/affiliate/sites/[id]/networks
GET    /api/affiliate/sites/[id]/networks
PUT    /api/affiliate/networks/[id]

POST   /api/affiliate/sites/[id]/revenue
GET    /api/affiliate/sites/[id]/revenue
PUT    /api/affiliate/revenue/[id]

POST   /api/affiliate/acquisitions
GET    /api/affiliate/acquisitions
GET    /api/affiliate/acquisitions/[id]
PUT    /api/affiliate/acquisitions/[id]
DELETE /api/affiliate/acquisitions/[id]

POST   /api/affiliate/sites/[id]/briefs
GET    /api/affiliate/sites/[id]/briefs
GET    /api/affiliate/briefs/[id]
PUT    /api/affiliate/briefs/[id]
DELETE /api/affiliate/briefs/[id]

POST   /api/affiliate/sites/[id]/valuations
GET    /api/affiliate/sites/[id]/valuations
PUT    /api/affiliate/valuations/[id]
```

All routes: `withAuth` + `withPermission` guards. All routes: tenant-scoped (`tenantId` from resolved tenant, never from request body).

---

## Calculated Fields (server-side, not stored)

`RevenueEntry.rpm` = `(revenue / sessions) * 1000` — calculate on create/update if sessions > 0
`RevenueEntry.epc` = `revenue / clicks` — calculate on create/update if clicks > 0
`SiteValuation.estimatedValue` = `monthlyNetProfit × multipleUsed` — calculate on create/update
`DisplayAdNetwork.qualificationProgress` = `(currentMonthlySessions / monthlySessionsRequired) * 100` — virtual, not stored, returned in API response
`AffiliateContentBrief.refreshDue` = set to `true` server-side when `currentRankingPosition` is updated and has decayed >5 spots from `peakRankingPosition`

---

## Parallelization Map

**Phase 1 — Parallel (no dependencies between tracks):**
- Track A: Write all 6 Prisma models + run migration
- Track B: Module toggle config + terminology config
- Track C: `AffiliateContentBrief` extension of existing content model (careful: read existing Content model first, extend don't duplicate)

**Phase 2 — Sequential (depends on Phase 1 migration):**
- Track D: API routes for Site, AffiliateProgram, DisplayAdNetwork
- Track E: API routes for RevenueEntry, AcquisitionTarget, AffiliateContentBrief, SiteValuation

**Phase 3 — Sequential (depends on Phase 2):**
- Track F: Calculated field logic (RPM, EPC, estimatedValue, qualificationProgress, refreshDue)
- Track G: TypeScript gate (`npx tsc --noEmit`) + validation (`npx prisma validate`)
- Track H: Sprint close (CHANGELOG, STATUS, BACKLOG, commit, push)

---

## Files To Read Before Starting

```
prisma/schema.prisma                          — existing models, understand conventions
src/lib/tenant/config.ts                      — existing TenantConfig shape
src/lib/tenant/server.ts                      — getTenant() and terminology resolver
src/app/api/clients/route.ts                  — pattern to follow for new API routes
src/middleware.ts                             — withAuth / withPermission patterns
docs/VERTICAL_2_AFFILIATE_STRATEGY.md        — full vertical context
```

---

## What This Sprint Does NOT Do

- No UI (Sprint 39)
- No demo tenant seeding (Sprint 40)
- No GSC/GA4 integration (Sprint 40)
- No affiliate network API connections (Sprint 40)
- No changes to existing SEO vertical modules
- No changes to GHM tenant config
