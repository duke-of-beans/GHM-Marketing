# SPRINT 3 — SEO + GMB
## Rank Tracking Dashboard + GBP Snapshot System
*Dependency: Sprint 0 (alert engine), Sprint 2 pattern (snapshot + cron)*

---

## GOAL

Structured GMB metrics tracking via GbpSnapshot, enhanced rank tracking UI, and AI-powered GMB post drafting sidecar. Wires existing providers into operational monitoring.

---

## EXISTING INFRASTRUCTURE (Use, Don't Rebuild)

| Component | Location | Status |
|-----------|----------|--------|
| GBP provider | src/lib/enrichment/providers/google-business/ | ✅ client, insights, posts, reviews |
| GBP OAuth | src/lib/oauth/google.ts + GBPConnection table | ✅ Built |
| Rank tracking | KeywordTracker + RankSnapshot tables | ✅ Built |
| Rank crons | /api/cron/rank-tracking + /api/cron/rank-poll | ✅ Built |
| Rankings lib | src/lib/enrichment/rankings.ts | ✅ Built |
| DataForSEO | src/lib/enrichment/providers/dataforseo.ts | ✅ Built |
| AI client | src/lib/ai/client.ts + router | ✅ Built |
| Alert engine | src/lib/ops/alert-engine.ts | ✅ Sprint 0 |

---

## DELIVERABLES

### D1: GbpSnapshot Table

```prisma
model GbpSnapshot {
  id                  Int       @id @default(autoincrement())
  clientId            Int       @map("client_id")
  searchViews         Int?      @map("search_views")
  mapViews            Int?      @map("map_views")
  websiteClicks       Int?      @map("website_clicks")
  phoneClicks         Int?      @map("phone_clicks")
  directionClicks     Int?      @map("direction_clicks")
  reviewCount         Int?      @map("review_count")
  reviewAvg           Float?    @map("review_avg")
  newReviews          Int?      @map("new_reviews")        // Since last snapshot
  photosCount         Int?      @map("photos_count")
  postsCount          Int?      @map("posts_count")
  previousSearchViews Int?      @map("previous_search_views")
  previousMapViews    Int?      @map("previous_map_views")
  periodStart         DateTime  @map("period_start")
  periodEnd           DateTime  @map("period_end")
  scanDate            DateTime  @default(now()) @map("scan_date")

  client              ClientProfile @relation(fields: [clientId], references: [id], onDelete: Cascade)

  @@index([clientId, scanDate(sort: Desc)])
  @@map("gbp_snapshots")
}
```

### D2: GBP Snapshot Cron

**Location:** `/api/cron/gbp-snapshot/route.ts`
- Weekly (add to vercel.json)
- For each client with active GBPConnection:
  - Fetch insights via existing google-business/insights.ts
  - Fetch review stats via existing google-business/reviews.ts
  - Create GbpSnapshot record with deltas from previous
  - Feed to alert engine (sourceType: "gbp")
  - Update DataSourceStatus for google_business

### D3: Enhanced Rank Tracking UI

Extend existing client detail page with "Rankings" section:
- Keyword table with current position, previous position, delta arrow
- Filter by category (existing KeywordTracker.category)
- Historical position chart per keyword
- "Map Pack" vs "Organic" split view (localPackPosition vs organicPosition from RankSnapshot)

### D4: GMB Dashboard Section

Extend existing client detail page with "Google Business Profile" section:
- Current period metrics (views, clicks, reviews)
- Trend charts from GbpSnapshot history
- Review count + average with delta
- "Connection status" from GBPConnection.isActive

### D5: AI Sidecar — GMB Post Drafts

**API route:** `/api/clients/[id]/gbp/draft-post`
- Uses existing AI client + model router
- Reads VoiceProfile for client tone
- Generates post content optimized for GBP
- Returns draft for review (not auto-published)

### D6: Default Alert Rules (seed)

- "Review average dropped below 4.0" → critical
- "Zero new reviews in 30 days" → warning
- "Search views dropped > 25% month-over-month" → warning
- "Keyword lost top 3 position" → warning
- "Keyword entered top 3" → info (positive alert)

---

## FILE CREATION ORDER

1. Schema migration (GbpSnapshot + ClientProfile relation)
2. `/api/cron/gbp-snapshot/route.ts`
3. `/api/clients/[id]/gbp/route.ts` — GBP metrics API
4. `/api/clients/[id]/gbp/draft-post/route.ts` — AI post drafting
5. Client detail extensions (Rankings section + GMB section)
6. Seed default alert rules
7. Wire cron to vercel.json

---

## TESTING CRITERIA

- [ ] GBP snapshot cron creates records for clients with GBPConnection
- [ ] Rank tracking UI shows current + historical positions
- [ ] GMB dashboard shows metrics from GbpSnapshot
- [ ] AI post draft generates voice-appropriate content
- [ ] Alert fires when review average drops
- [ ] Alert fires when keyword leaves top 3
- [ ] Clients without GBPConnection don't error (graceful skip)
