# SPRINT 38-40 — TRACK A BRIEF
# Task: Add Prisma models and enums for Affiliate Vertical

## Context
Project: D:\Work\SEO-Services\ghm-dashboard
This is a Next.js 14 / TypeScript / Prisma / Neon / Tailwind multi-tenant ERP platform.
You are adding new models only. Do NOT modify any existing models.

## Step 1: Read the existing schema first
Read: prisma/schema.prisma
Understand the existing model conventions (field naming, relation patterns, index patterns).

## Step 2: Add these enums to the END of prisma/schema.prisma

```prisma
enum SiteStatus {
  ACTIVE
  DORMANT
  FOR_SALE
  SOLD
}

enum AffiliateProgramStatus {
  NOT_APPLIED
  PENDING
  APPROVED
  REJECTED
}

enum AdNetworkStatus {
  ACTIVE
  PENDING
  NOT_QUALIFIED
  REJECTED
}

enum RevenueSourceType {
  AFFILIATE
  DISPLAY
  SPONSORED
  SALE
  OTHER
}

enum AcquisitionStage {
  RESEARCHING
  DUE_DILIGENCE
  NEGOTIATING
  PURCHASED
  PASSED
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

enum ValuationListingStatus {
  NOT_LISTED
  LISTED
  UNDER_OFFER
  SOLD
}
```

## Step 3: Add these 7 models to the END of prisma/schema.prisma

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

  affiliatePrograms AffiliateProgram[]
  adNetworks        DisplayAdNetwork[]
  revenueEntries    RevenueEntry[]
  contentBriefs     AffiliateContentBrief[]
  valuations        SiteValuation[]
  acquisitionTarget AcquisitionTarget?

  @@unique([tenantId, slug])
  @@index([tenantId])
}

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

model AffiliateContentBrief {
  id                       Int         @id @default(autoincrement())
  tenantId                 Int
  siteId                   Int
  targetKeyword            String
  searchVolume             Int?
  keywordDifficulty        Int?
  contentType              ContentType @default(ARTICLE)
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
```

## Step 4: Validate and migrate

Run:
```
npx prisma validate
```
Fix any errors. Then run:
```
npx prisma migrate dev --name affiliate-vertical-complete
```
If migration fails, stop and report the error. Do not proceed.

## Done
Report: "Track A complete — 7 models, 8 enums, migration succeeded."
