# SPRINT 40 — Demo Tenant + Intelligence Layer
**Created:** March 3, 2026
**Status:** READY AFTER SPRINT 39
**Cowork prompt:** `docs/blueprints/SPRINT40_COWORK_PROMPT.md`
**Depends on:** Sprints 38 + 39 complete
**Blocks:** Nothing — this is the demo-ready gate for Vertical 2

---

## Objective

Two things in one sprint: seed a realistic, generic demo tenant for the affiliate vertical so the platform is showable to prospects, and wire the intelligence layer (GSC + GA4 to Site records, affiliate network CSV import) so the platform can ingest real data without manual entry.

The demo tenant is NOT Proper Sluice. It is a fictional company — "Ridgeline Media LLC" — with believable data across a realistic portfolio. It demonstrates the full lifecycle: a mix of established earners, growing sites, dormant sites, acquisition targets in pipeline, and one site marked for sale.

---

## Done Criteria

### Demo Tenant
- [ ] `ridgeline` tenant seeded in meta-DB tenants table
- [ ] `verticalType: 'affiliate_portfolio'` set in TenantConfig
- [ ] 12 sites seeded across 4 niches (outdoor gear, personal finance, home improvement, pet care)
- [ ] 3 sites: established earners ($2K–$5K/month, 30K–80K monthly sessions)
- [ ] 4 sites: growing ($500–$2K/month, 10K–30K sessions)
- [ ] 3 sites: dormant (published, low traffic, no active content)
- [ ] 1 site: for sale (listed with SiteValuation record, broker listed)
- [ ] 1 site: sold (historical, shows in portfolio as closed)
- [ ] Affiliate programs seeded for each active site (2–4 programs per site, mix of networks)
- [ ] Display ad networks seeded (Mediavine active on top 2 earners, Ezoic on growing sites, not-qualified on rest)
- [ ] Revenue entries seeded: last 12 months per active site per source (realistic growth curves)
- [ ] 6 acquisition targets in pipeline across all stages
- [ ] 40+ content briefs across all sites (mix of all statuses including published with position/traffic data, needs-refresh flagged on 8)
- [ ] 2 site valuations (one active listing, one sold)
- [ ] All data looks real — niches are specific, keywords are real, revenue figures are plausible

### Intelligence Layer
- [ ] GSC integration wired to Site records (not just Client records)
- [ ] GA4 integration wired to Site records
- [ ] CSV import: ShareASale transaction export → RevenueEntry records
- [ ] CSV import: Amazon Associates earnings report → RevenueEntry records
- [ ] CSV import: CJ Affiliate transaction export → RevenueEntry records
- [ ] CSV import: generic revenue CSV (manual fallback for any network)
- [ ] Import UI: Settings → Data Import → select source → upload CSV → preview → confirm
- [ ] TypeScript: zero new errors
- [ ] CHANGELOG, STATUS, BACKLOG updated and committed

---

## Demo Tenant Seed Data

### Ridgeline Media LLC — Portfolio Overview

**Tenant config:**
```
slug: ridgeline
displayName: Ridgeline Media LLC
verticalType: affiliate_portfolio
timezone: America/Denver
```

**Sites:**

| Domain | Niche | Status | Monthly Revenue | Monthly Sessions | Monetization |
|--------|-------|--------|----------------|-----------------|--------------|
| trailgearreviews.com | Outdoor gear | Active | $4,800 | 68,000 | Both (Mediavine + Amazon) |
| peakpackinglist.com | Outdoor gear | Active | $3,200 | 41,000 | Both (Mediavine + ShareASale) |
| budgetbackpacker.net | Outdoor gear | Active | $1,400 | 22,000 | Both (Ezoic + Amazon + CJ) |
| firsttimeinvestor.io | Personal finance | Active | $2,100 | 18,000 | Affiliate only (Impact + CJ) |
| simplesavingsguide.com | Personal finance | Active | $890 | 12,000 | Affiliate only (ShareASale) |
| mortgagecalchelp.net | Personal finance | Active | $1,650 | 15,500 | Both (Ezoic + Impact) |
| weekendrenovator.com | Home improvement | Active | $640 | 9,200 | Both (Ezoic + Amazon) |
| tiledaddy.com | Home improvement | Dormant | $120 | 2,100 | Affiliate only (Amazon) |
| drywallpro.net | Home improvement | Dormant | $0 | 800 | Not monetized |
| pawsandplans.com | Pet care | Active | $1,780 | 24,000 | Both (Mediavine-pending + Amazon + Chewy via ShareASale) |
| seniorpetguide.com | Pet care | For Sale | $2,400 | 31,000 | Both — listed on Empire Flippers at $82,000 |
| smalldogworld.net | Pet care | Sold | $1,900 (at sale) | — | Sold for $68,000 via Motion Invest 8 months ago |

**Revenue seed pattern (trailgearreviews.com example — use proportional logic for all sites):**
Month -12: $2,100 / Month -11: $2,400 / Month -10: $2,800 / Month -9: $3,100 / Month -8: $3,300 / Month -7: $3,600 / Month -6: $3,900 / Month -5: $4,100 / Month -4: $4,300 / Month -3: $4,500 / Month -2: $4,650 / Month -1: $4,800. Split each month: 60% display (Mediavine), 40% affiliate (Amazon). Growing sites follow shallower curves. Dormant sites show flat or declining.

**Affiliate Programs (sample — trailgearreviews.com):**
- Amazon Associates / amazon / 3% avg / 24hr cookie / APPROVED / $18,400 lifetime
- REI Affiliate (ShareASale) / shareasale / 5% / 30 day / APPROVED / $4,200 lifetime
- Backcountry.com (CJ) / cj / 6% / 45 day / APPROVED / $2,100 lifetime
- Patagonia Direct (Impact) / impact / 8% / 60 day / PENDING

**Acquisition Pipeline targets:**
1. hikingbootsexpert.com — Researching — $0 asking (not yet contacted) — 14K sessions, $800/mo revenue, DA 28
2. campingchecklist.org — Due Diligence — $28,000 asking — 22K sessions, $1,200/mo, DA 31 — Empire Flippers listing
3. budgetinvesting101.com — Negotiating — $45,000 asking / $38,000 offered — 19K sessions, $1,600/mo, DA 34
4. homepaintingguide.net — Researching — aged domain, no content yet — DA 22 expired auction
5. puppytrainingfirst.com — Due Diligence — $15,000 asking — 8K sessions, $420/mo
6. gardeningbasics.net — Passed — $55,000 ask, too high for revenue multiple — noted: revisit in 6 months

**Content briefs (sample distribution across all active sites):**
- 8 briefs: Published + position tracked + traffic attributed + refreshDue=true (declining rankings)
- 14 briefs: Published + position tracked + traffic data present
- 10 briefs: In Review (submitted by writer, pending editorial)
- 8 briefs: In Progress (assigned to writers)
- 6 briefs: Briefed (keyword assigned, not yet assigned to writer)

Sample keywords (trailgearreviews.com): "best trekking poles 2025" (pos 4, 2,400 searches/mo), "ultralight backpacking gear" (pos 7, 1,800/mo), "osprey atmos vs stratos" (pos 2, 880/mo — refreshDue=true, was pos 1 last quarter)

---

## Intelligence Layer

### GSC + GA4 → Site Records

The SEO vertical already has GSC/GA4 integration wired to Client records. Extend to support Site records:

**What changes:**
- GSC property selection in Site settings (same OAuth flow, different data target)
- GA4 property selection in Site settings
- Site record gains `gscPropertyId` and `ga4PropertyId` fields (add to Prisma schema via migration)
- Existing GSC/GA4 fetch logic parameterized to accept either clientId or siteId
- Rank tracking pulls per-URL data and updates `AffiliateContentBrief.currentRankingPosition` and `currentMonthlyTraffic` on match by `publishedUrl`
- Traffic data feeds into `DisplayAdNetwork.currentMonthlySessions` for qualification progress

**New fields on Site (migration):**
```prisma
gscPropertyId   String?
ga4PropertyId   String?
gscConnectedAt  DateTime?
ga4ConnectedAt  DateTime?
```

---

### CSV Import System

**UI location:** Settings → Data Import (new tab)

**Supported import types:**

**1. ShareASale Transaction Export**
ShareASale exports a CSV with columns: Transaction Date, Merchant, Sale Amount, Commission, Click Date
Map to: `RevenueEntry` with sourceType=AFFILIATE, sourceName=merchantName, revenue=Commission
Match to site by: user selects which Site this import belongs to

**2. Amazon Associates Earnings Report**
Amazon exports with: Date, Program, Clicks, Ordered Items, Ordered Revenue, Shipped Revenue (Commission)
Map to: `RevenueEntry` with sourceType=AFFILIATE, sourceName='Amazon Associates', revenue=Shipped Revenue (Commission)

**3. CJ Affiliate Transaction Export**
CJ exports: Transaction Date, Advertiser, Sale Amount, Commission
Map to: `RevenueEntry` sourceType=AFFILIATE, sourceName=Advertiser

**4. Generic Revenue CSV**
Manual fallback. Required columns: month, year, source_type, source_name, revenue
Optional columns: sessions, pageviews, clicks

**Import flow UI:**
1. Select Source (dropdown: ShareASale / Amazon Associates / CJ / Generic)
2. Select Site (dropdown of all tenant sites)
3. Upload CSV file
4. Preview table: show parsed rows, flag duplicates (already have entry for that month/source)
5. Confirm import → create RevenueEntry records, skip duplicates
6. Success summary: "Imported 11 entries. Skipped 2 duplicates."

**API route:** `POST /api/affiliate/import` — accepts multipart form data (source, siteId, CSV file)

---

## Parallelization Map

**Phase 1 — Parallel:**
- Track A: Seed script (`scripts/seed-ridgeline.ts`) — all 12 sites + programs + networks + revenue + briefs + acquisitions + valuations
- Track B: GSC/GA4 Site extension (new Prisma fields + migration + parameterize existing fetch logic)
- Track C: CSV import API route + parsing logic for all 4 source types

**Phase 2 — Parallel:**
- Track D: Run seed script against Neon (`npx tsx scripts/seed-ridgeline.ts`) — verify all data looks correct in the ridgeline tenant
- Track E: Import UI (Settings → Data Import tab)

**Phase 3 — Sequential:**
- Track F: End-to-end test — log into ridgeline tenant, verify every page shows data, verify GSC connection flow, verify CSV import round-trip
- Track G: TypeScript gate
- Track H: Sprint close (CHANGELOG, STATUS, BACKLOG, commit, push)

---

## Seed Script Approach

Use upsert pattern (same as `scripts/seed-tenants.ts`). Script is idempotent — safe to run multiple times.

```typescript
// scripts/seed-ridgeline.ts
// 1. Upsert ridgeline tenant in tenants table
// 2. Get ridgeline tenant DB connection
// 3. Upsert all 12 sites
// 4. For each site: upsert programs, networks, revenue entries (12 months), briefs, valuations
// 5. Upsert 6 acquisition targets
// Log counts at end: "Seeded: 12 sites, 38 programs, 11 networks, 144 revenue entries, 46 briefs, 6 targets, 2 valuations"
```

---

## Files To Read Before Starting

```
scripts/seed-tenants.ts                             — seed pattern to replicate
src/lib/integrations/gsc.ts (or similar)            — existing GSC integration to extend
src/lib/integrations/ga4.ts (or similar)            — existing GA4 integration to extend
src/app/api/affiliate/sites/route.ts               — Sprint 38 output
src/app/(dashboard)/settings/page.tsx              — settings page to add Data Import tab
docs/blueprints/SPRINT38_BLUEPRINT.md
docs/blueprints/SPRINT39_BLUEPRINT.md
docs/VERTICAL_2_AFFILIATE_STRATEGY.md
docs/THIRD_PARTY_MIGRATION.md                       — integration credential patterns
```

---

## Post-Sprint 40: Platform State

With Sprint 40 complete, COVOS Vertical 2 is demo-ready:
- `ridgeline.covos.app` shows a believable, populated affiliate portfolio company
- Every surface has real-looking data
- The intelligence loop works: GSC/GA4 pull into Site records, CSV import ingests affiliate earnings
- Proper Sluice can be onboarded as a real tenant through the standard provisioning flow — no code changes needed
- Vertical 2 template is generic and reusable for any affiliate portfolio prospect
