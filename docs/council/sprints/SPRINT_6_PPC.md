# SPRINT 6 — PPC
## Google Ads Snapshot System + Performance Monitoring
*Dependency: Sprint 0 (alert engine), Sprint 2 pattern (snapshot + cron)*

---

## GOAL

Structured PPC performance tracking via PpcSnapshot, automated alerting on spend/performance anomalies. Wires existing Google Ads provider into operational monitoring.

---

## EXISTING INFRASTRUCTURE (Use, Don't Rebuild)

| Component | Location | Status |
|-----------|----------|--------|
| Google Ads provider | src/lib/enrichment/providers/google-ads/ | ✅ client.ts, campaigns.ts |
| Google Ads OAuth | src/lib/oauth/google-ads.ts + GoogleAdsConnection table | ✅ Built |
| Report section | src/lib/reports/sections/ppc-performance.ts | ✅ Built |
| Alert engine | src/lib/ops/alert-engine.ts | ✅ Sprint 0 |

---

## DELIVERABLES

### D1: PpcSnapshot Table

```prisma
model PpcSnapshot {
  id                Int       @id @default(autoincrement())
  clientId          Int       @map("client_id")
  impressions       Int?
  clicks            Int?
  cost              Float?    // Total spend in period
  conversions       Int?
  cpc               Float?    // Cost per click
  ctr               Float?    // Click-through rate
  conversionRate    Float?    @map("conversion_rate")
  costPerConversion Float?    @map("cost_per_conversion")
  campaigns         Json?     // Per-campaign breakdown
  previousCost      Float?    @map("previous_cost")
  previousConversions Int?    @map("previous_conversions")
  periodStart       DateTime  @map("period_start")
  periodEnd         DateTime  @map("period_end")
  scanDate          DateTime  @default(now()) @map("scan_date")

  client            ClientProfile @relation(fields: [clientId], references: [id], onDelete: Cascade)

  @@index([clientId, scanDate(sort: Desc)])
  @@map("ppc_snapshots")
}
```

### D2: PPC Snapshot Cron

**Location:** `/api/cron/ppc-snapshot/route.ts` (weekly, add to vercel.json)
- For each client with active GoogleAdsConnection
- Fetch campaign data via existing google-ads/campaigns.ts
- Create PpcSnapshot with deltas from previous snapshot
- Feed deltas to alert engine (sourceType: "ppc")
- Update DataSourceStatus for google_ads provider

### D3: PPC Dashboard Section

Extend client detail page with "PPC Performance" section:
- Key metrics cards (impressions, clicks, cost, conversions, CPC, CTR)
- Trend charts from PpcSnapshot history
- Campaign breakdown table
- Cost vs conversion efficiency chart
- Connection status from GoogleAdsConnection.isActive

### D4: PPC API

| Route | Method | Purpose |
|-------|--------|---------|
| /api/clients/[id]/ppc | GET | PPC snapshot history for a client |
| /api/clients/[id]/ppc/latest | GET | Latest snapshot with delta indicators |

### D5: Default Alert Rules (seed)

- "CPC increased > 30% month-over-month" → warning
- "Conversion rate dropped > 25%" → critical
- "Daily spend exceeded budget by > 20%" → critical
- "Zero conversions in past 7 days" → critical
- "CPC decreased > 20%" → info (positive efficiency gain)

---

## FILE CREATION ORDER

1. Schema migration (PpcSnapshot + ClientProfile relation)
2. `/api/cron/ppc-snapshot/route.ts`
3. `/api/clients/[id]/ppc/route.ts` — PPC metrics API
4. Client detail page PPC section (component)
5. Seed alert rules
6. Wire cron to vercel.json

---

## TESTING CRITERIA

- [ ] PPC snapshot cron creates records for clients with GoogleAdsConnection
- [ ] Delta calculation works correctly (vs previous snapshot)
- [ ] Alert fires on spend anomalies and conversion drops
- [ ] Client detail PPC section renders with real data
- [ ] Clients without GoogleAdsConnection gracefully skipped
- [ ] DataSourceStatus updated on Google Ads API calls
- [ ] Cost tracking logged to EnrichmentCostLog
