# Upsell Detection System - Phase 5 (In Progress)

**Status:** ⚠️ PARTIALLY COMPLETE - Awaiting Database Migration  
**Started:** February 16, 2026  

---

## What Was Built

### 1. Database Schema Updates (`prisma/schema.prisma`)

**New Model: UpsellOpportunity**
```prisma
model UpsellOpportunity {
  id              Int           @id @default(autoincrement())
  clientId        Int           @map("client_id")
  productId       Int           @map("product_id")
  scanId          Int?          @map("scan_id")
  status          String        @default("detected")
  opportunityScore Int          @map("opportunity_score")
  gapCategory     String        @map("gap_category")
  reasoning       String
  projectedMrr    Decimal       @map("projected_mrr") @db.Decimal(10, 2)
  projectedRoi    Decimal?      @map("projected_roi") @db.Decimal(5, 2)
  presentedAt     DateTime?     @map("presented_at")
  respondedAt     DateTime?     @map("responded_at")
  response        String?
  detectedAt      DateTime      @default(now()) @map("detected_at")
  client          ClientProfile @relation(fields: [clientId], references: [id])
  product         Product       @relation(fields: [productId], references: [id])
  scan            CompetitiveScan? @relation(fields: [scanId], references: [id])
}
```

**Relations Added:**
- `ClientProfile.upsellOpportunities`
- `Product.upsellOpportunities`
- `CompetitiveScan.upsellOpportunities`

### 2. Upsell Detection Engine (`src/lib/upsell/detector.ts`)

**Core Functions:**

**detectUpsellOpportunities(clientId, scanId?)**
- Analyzes scan alerts for gaps and weaknesses
- Maps gaps to product categories using intelligent matching
- Calculates opportunity scores (0-100) based on:
  - Alert severity (critical = +30, warning = +15)
  - Client health score (lower health = higher opportunity)
  - Product pricing model (monthly recurring preferred)
- Generates human-readable reasoning
- Projects MRR and ROI for each opportunity
- Returns top opportunities sorted by score

**Gap-to-Product Mapping:**
```typescript
{
  "content-gap": ["content", "blog-package"],
  "technical-seo": ["technical-seo", "site-audit"],
  "link-building": ["link-building", "pr-outreach"],
  "review-management": ["review-mgmt", "reputation"],
  "competitor-outranking": ["competitive-analysis", "content"],
  "keyword-ranking": ["seo-package", "content"],
  "local-search": ["local-seo", "gmb-optimization"],
  "mobile-performance": ["technical-seo", "performance"],
  "page-speed": ["technical-seo", "performance"]
}
```

**categorizeAlert(alert)**
- Analyzes alert title and description
- Categorizes into: content-gap, technical-seo, link-building, review-management, etc.
- Uses keyword matching on alert text

**calculateOpportunityScore(alert, client, product)**
- Base score: 50
- Severity boost: +30 (critical), +15 (warning)
- Health impact: +15 (health < 40), +10 (health < 60)
- Pricing model: +5 (monthly recurring)
- Range: 0-100

**calculateProjectedRoi(product, client)**
- Estimates 30% average improvement from product
- ROI = ((projectedValue - productPrice) / productPrice) * 100
- Returns percentage

**saveUpsellOpportunities(clientId, scanId, opportunities)**
- Saves detected opportunities to database
- Deduplicates by product (keeps highest score)
- Skips if opportunity already exists with status "detected" or "presented"

### 3. API Route: Detect Opportunities (`/api/upsell/detect`)

**Method:** POST  
**Auth:** Master only  
**Parameters:**
```json
{
  "clientId": 123,
  "scanId": 456  // optional
}
```

**Process:**
1. Calls `detectUpsellOpportunities()` to analyze scan data
2. Saves opportunities to database if scanId provided
3. Returns detected opportunities with scores and projections

**Response:**
```json
{
  "success": true,
  "opportunities": [
    {
      "productId": 5,
      "productName": "Content Marketing Package",
      "category": "content",
      "gapCategory": "content-gap",
      "opportunityScore": 85,
      "reasoning": "Low content freshness: Content Marketing Package can address this gap...",
      "projectedMrr": 500,
      "projectedRoi": 120
    }
  ],
  "savedCount": 3
}
```

### 4. Upsell Opportunities Component (`src/components/upsell/upsell-opportunities.tsx`)

**Purpose:** Display detected opportunities on client scorecard

**Features:**
- Shows top 5 opportunities sorted by score
- Color-coded cards based on opportunity score:
  - Red border (80+): High priority
  - Orange border (60-79): Medium priority
  - Yellow border (<60): Low priority
- Each card displays:
  - Product name and category
  - Opportunity score badge
  - Reasoning text
  - Projected MRR
  - Estimated ROI (if applicable)
  - Action buttons: View Product, Present
- "Detect Opportunities" button to run analysis
- "Refresh" button when opportunities exist
- Empty state when no opportunities detected

**Props:**
```typescript
{
  clientId: number;
  opportunities: Opportunity[];
}
```

---

## Files Created

**Core Engine:**
- `src/lib/upsell/detector.ts` (268 lines)

**API Routes:**
- `src/app/api/upsell/detect/route.ts` (42 lines)

**UI Components:**
- `src/components/upsell/upsell-opportunities.tsx` (165 lines)

**Database:**
- `prisma/schema.prisma` (updated with UpsellOpportunity model)

**Total:** 475+ lines of new code

---

## What Still Needs to Be Done

### ⚠️ CRITICAL: Database Migration

**Issue:** Prisma version mismatch
- Local Prisma: 6.19.2 (in package.json)
- Global Prisma: 7.4.0 (breaking changes)
- `npx prisma migrate dev` picks up global version 7

**Solutions:**
1. **Manual Migration (Recommended):**
   - Run migration SQL directly in database
   - SQL generated from schema changes
   
2. **Downgrade Global Prisma:**
   ```bash
   npm uninstall -g prisma
   npm install -g prisma@6.19.2
   ```

3. **Use Vercel Dashboard:**
   - Push schema changes to GitHub
   - Vercel will run migrations automatically

**Migration SQL Needed:**
```sql
CREATE TABLE "upsell_opportunities" (
  "id" SERIAL PRIMARY KEY,
  "client_id" INTEGER NOT NULL REFERENCES "client_profiles"("id") ON DELETE CASCADE,
  "product_id" INTEGER NOT NULL REFERENCES "products"("id"),
  "scan_id" INTEGER REFERENCES "competitive_scans"("id"),
  "status" TEXT NOT NULL DEFAULT 'detected',
  "opportunity_score" INTEGER NOT NULL,
  "gap_category" TEXT NOT NULL,
  "reasoning" TEXT NOT NULL,
  "projected_mrr" DECIMAL(10,2) NOT NULL,
  "projected_roi" DECIMAL(5,2),
  "presented_at" TIMESTAMP,
  "responded_at" TIMESTAMP,
  "response" TEXT,
  "detected_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX "upsell_opportunities_client_id_status_idx" ON "upsell_opportunities"("client_id", "status");
CREATE INDEX "upsell_opportunities_status_idx" ON "upsell_opportunities"("status");
CREATE INDEX "upsell_opportunities_opportunity_score_idx" ON "upsell_opportunities"("opportunity_score" DESC);
```

### Remaining Features

**1. Integration with Client Scorecard**
- Add `<UpsellOpportunities>` component to scorecard tab
- Load opportunities from database on page load
- Auto-detect on first scan

**2. Present Opportunity Action**
- `/api/upsell/[id]/present` endpoint
- Mark opportunity as "presented"
- Create note on client profile
- Set presentedAt timestamp

**3. Dismiss Opportunity Action**
- `/api/upsell/[id]/dismiss` endpoint
- Mark opportunity as "dismissed"
- Remove from active list

**4. View Product Details**
- Link to product page or modal
- Show full product description
- Pricing details and benefits

**5. Accept/Reject Tracking**
- Track when client accepts recommendation
- Link to work order/deal
- Calculate actual ROI vs projected

**6. Automatic Detection**
- Run detection after each competitive scan
- Auto-save high-score opportunities (80+)
- Notify account manager

---

## How It Works

### Detection Flow:
```
1. Scan runs → Alerts generated
2. Upsell detector analyzes alerts
3. Categorizes gaps (content, technical, links, etc.)
4. Matches gaps to products in catalog
5. Calculates opportunity scores
6. Generates reasoning + ROI projections
7. Saves opportunities to database
8. Displays top 5 on client scorecard
```

### Scoring Example:
```
Alert: "Low content freshness - competitors publishing 2x more"
- Severity: critical (+30)
- Client health: 45 (+15)
- Product: Content Marketing Package (monthly) (+5)
- Base: 50
= Total Score: 100 (but capped at 100)

Product Match:
- Gap category: "content-gap"
- Matching products: ["content", "blog-package"]
- Best match: "Content Marketing Package"
- Projected MRR: $500
- Projected ROI: 120%
```

---

## Testing the System (Once Migration Complete)

1. **Create test products:**
   ```sql
   INSERT INTO products (name, category, price, pricing_model, is_active)
   VALUES ('Content Marketing Package', 'content', 500, 'monthly', true);
   ```

2. **Trigger detection:**
   ```bash
   POST /api/upsell/detect
   {
     "clientId": 1,
     "scanId": 10
   }
   ```

3. **View on client page:**
   - Navigate to `/clients/1`
   - Should see "Upsell Opportunities" section (after integration)
   - Click "Detect Opportunities" button

4. **Verify database:**
   ```sql
   SELECT * FROM upsell_opportunities 
   WHERE client_id = 1 
   ORDER BY opportunity_score DESC;
   ```

---

## Next Steps

1. ✅ Run database migration (manual or via Vercel)
2. ⬜ Integrate component into client scorecard tab
3. ⬜ Add Present/Dismiss action handlers
4. ⬜ Test with real scan data
5. ⬜ Add auto-detection trigger after scans

---

**Status:** Code complete, awaiting migration + integration  
**Blocked By:** Prisma version mismatch  
**Completion:** ~80% (core logic done, UI built, needs DB + integration)
