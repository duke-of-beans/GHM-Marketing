# SPRINT 2 — SITE HEALTH
## PageSpeed Snapshots + Automated Monitoring
*Dependency: Sprint 0 (alert engine, DataSourceStatus)*

---

## GOAL

Structured site health tracking with automated alerting on performance degradation. Creates SiteHealthSnapshot records from existing PageSpeed provider, wires into alert engine.

---

## EXISTING INFRASTRUCTURE (Use, Don't Rebuild)

| Component | Location | Status |
|-----------|----------|--------|
| PageSpeed provider | src/lib/enrichment/providers/pagespeed.ts | ✅ Built |
| Enrichment cache | src/lib/enrichment/cache.ts | ✅ Built |
| Cost tracker | src/lib/enrichment/cost-tracker.ts | ✅ Built |
| DataSourceStatus | Sprint 0 table | ✅ Built in Sprint 0 |
| Alert engine | src/lib/ops/alert-engine.ts | ✅ Built in Sprint 0 |
| ClientDomain table | Schema | ✅ Has domain, hosting, wpUrl, sslActive, etc. |

---

## DELIVERABLES

### D1: SiteHealthSnapshot Table

```prisma
model SiteHealthSnapshot {
  id                Int       @id @default(autoincrement())
  clientId          Int       @map("client_id")
  domainId          Int       @map("domain_id")
  performanceMobile Int?      @map("performance_mobile")   // 0-100
  performanceDesktop Int?     @map("performance_desktop")  // 0-100
  lcp               Float?    // Largest Contentful Paint (seconds)
  fid               Float?    // First Input Delay (ms)
  cls               Float?    // Cumulative Layout Shift
  ttfb              Float?    // Time to First Byte (ms)
  seoScore          Int?      @map("seo_score")            // 0-100 (Lighthouse SEO)
  accessibilityScore Int?     @map("accessibility_score")  // 0-100
  bestPracticesScore Int?     @map("best_practices_score") // 0-100
  previousMobile    Int?      @map("previous_mobile")      // For delta calculation
  previousDesktop   Int?      @map("previous_desktop")
  scanDate          DateTime  @default(now()) @map("scan_date")

  client            ClientProfile @relation(fields: [clientId], references: [id], onDelete: Cascade)

  @@index([clientId, scanDate(sort: Desc)])
  @@index([domainId, scanDate(sort: Desc)])
  @@map("site_health_snapshots")
}
```

### D2: Site Health Cron

**Location:** `/api/cron/site-health/route.ts`
- Add to vercel.json (weekly)
- For each active client with domains:
  - Call existing PageSpeed provider for each domain
  - Create SiteHealthSnapshot record
  - Calculate delta from previous snapshot
  - Feed deltas to alert engine (sourceType: "health")
  - Update DataSourceStatus for pagespeed provider

### D3: Site Health API

| Route | Method | Purpose |
|-------|--------|---------|
| /api/clients/[id]/site-health | GET | Get site health history for a client |
| /api/clients/[id]/site-health/latest | GET | Latest snapshot with delta indicators |

### D4: Client Detail Extension

Extend existing client detail page with "Site Health" section:
- Current scores with trend arrows (vs previous snapshot)
- Core Web Vitals breakdown
- Historical chart (last 12 snapshots)

### D5: Default Alert Rules (seed)

- "Mobile performance drop > 10 points" → warning
- "Mobile performance drop > 20 points" → critical
- "LCP > 4s" → warning
- "CLS > 0.25" → warning

---

## FILE CREATION ORDER

1. Schema migration (SiteHealthSnapshot + ClientProfile relation)
2. `/api/cron/site-health/route.ts`
3. `/api/clients/[id]/site-health/route.ts`
4. Client detail page extension (component)
5. Seed default alert rules
6. Wire to vercel.json

---

## TESTING CRITERIA

- [ ] Cron creates SiteHealthSnapshot records for all active clients
- [ ] Delta calculation compares to previous snapshot correctly
- [ ] Alert fires when performance drops below threshold
- [ ] DataSourceStatus updates on PageSpeed calls
- [ ] Client detail page shows site health section
- [ ] Historical chart renders with real data
