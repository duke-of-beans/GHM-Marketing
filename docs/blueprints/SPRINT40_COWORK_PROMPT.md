# SPRINT 40 — COWORK PROMPT
**Demo Tenant + Intelligence Layer**
**Date:** March 3, 2026

---

You are a senior full-stack engineer working on COVOS, a multi-tenant vertical ERP platform built in Next.js 14 / TypeScript / Prisma / Neon / Tailwind.

## Your Mission

Two deliverables: (1) seed a realistic demo tenant "Ridgeline Media LLC" with a full 12-site affiliate portfolio and 12 months of revenue history, and (2) wire the intelligence layer — GSC/GA4 to Site records and CSV import for major affiliate networks. When this sprint is done, `ridgeline.covos.app` is a fully populated, showable demo.

## MANDATORY: Read These Files First

```
scripts/seed-tenants.ts
src/lib/integrations/gsc.ts (or nearest equivalent)
src/lib/integrations/ga4.ts (or nearest equivalent)
src/app/(dashboard)/settings/page.tsx
src/app/api/affiliate/sites/route.ts
docs/blueprints/SPRINT40_BLUEPRINT.md
docs/blueprints/SPRINT38_BLUEPRINT.md
docs/VERTICAL_2_AFFILIATE_STRATEGY.md
docs/THIRD_PARTY_MIGRATION.md
```

## Phase 1 — Three Parallel Tracks

**Track A — Ridgeline Seed Script**

Create `scripts/seed-ridgeline.ts`. Use upsert pattern from `scripts/seed-tenants.ts` — idempotent, safe to run multiple times.

Seed exactly what the blueprint specifies:
- Ridgeline tenant in meta-DB tenants table (slug: ridgeline, verticalType: affiliate_portfolio)
- 12 sites with all fields populated (see blueprint table)
- Affiliate programs per site (2–4 per active site, realistic networks and rates)
- Display ad networks per site (Mediavine active on trailgearreviews + peakpackinglist, Ezoic on 4 growing sites, not-qualified on rest)
- Revenue entries: 12 months per active site per source — use the growth curve logic from the blueprint (trailgearreviews grows from $2,100 to $4,800 over 12 months, proportional scaling for others, flat/declining for dormant)
- 46 content briefs distributed across all statuses as specified, with realistic keywords for each niche
- 6 acquisition targets across all pipeline stages
- 2 site valuations (seniorpetguide.com listed, smalldogworld.net sold)

Revenue split logic:
- Sites with Mediavine active: split monthly revenue 60% display (Mediavine), 40% affiliate
- Sites with Ezoic: split 40% display, 60% affiliate  
- Affiliate-only sites: 100% affiliate, split proportionally across programs

Log final counts. If any upsert fails, log the error and continue — don't abort full seed on one failure.

After writing script: `npx tsx scripts/seed-ridgeline.ts`
Verify it completes without errors and reports expected counts.

**Track B — GSC + GA4 Site Extension**

1. Add two new fields to `Site` model in `prisma/schema.prisma`:
```prisma
gscPropertyId   String?
ga4PropertyId   String?
gscConnectedAt  DateTime?
ga4ConnectedAt  DateTime?
```
Run: `npx prisma migrate dev --name site-gsc-ga4-fields`

2. Find existing GSC/GA4 integration code. Read it fully before modifying.

3. Parameterize the fetch functions to accept `{ type: 'client' | 'site', id: number }` — existing client behavior unchanged, new site behavior added alongside.

4. When GSC data is fetched for a Site, update matching `AffiliateContentBrief` records:
   - Match by `publishedUrl` against GSC URL data
   - Update `currentRankingPosition`, `currentMonthlyTraffic`, `lastRankCheck`
   - If position has declined >5 spots from `peakRankingPosition`, set `refreshDue = true`
   - If position is better than `peakRankingPosition`, update `peakRankingPosition`

5. When GA4 data is fetched for a Site, update `DisplayAdNetwork.currentMonthlySessions` for the active network on that site.

6. Add GSC/GA4 connection UI to Site Detail settings (or Site Overview tab) — same pattern as client GSC connection UI.

**Track C — CSV Import System**

Create `src/app/api/affiliate/import/route.ts` — POST endpoint accepting multipart form data.

Parameters: `source` (shareasale | amazon | cj | generic), `siteId`, CSV file

Parsing logic per source:
- **ShareASale:** Find columns Transaction Date, Merchant, Commission. Group by month. Create RevenueEntry per month per merchant with sourceType=AFFILIATE.
- **Amazon Associates:** Find columns Date, Shipped Revenue. Group by month. Create single RevenueEntry per month with sourceName='Amazon Associates', sourceType=AFFILIATE.
- **CJ Affiliate:** Find columns Transaction Date, Advertiser, Commission. Group by month per advertiser. Create RevenueEntry per month per advertiser.
- **Generic:** Require columns: month, year, source_type, source_name, revenue. Optional: sessions, pageviews, clicks.

Duplicate detection: before inserting, check if RevenueEntry already exists for same `[tenantId, siteId, month, year, sourceType, sourceName]`. If exists, skip and count as duplicate.

Return response: `{ imported: number, skipped: number, errors: string[] }`

## Phase 2 — Parallel

**Track D — Run + Verify Seed**

After Track A seed script is confirmed working:
1. Log into ridgeline tenant in browser
2. Verify Site Portfolio shows all 12 sites
3. Verify Revenue Dashboard shows portfolio totals and 12-month trend chart
4. Verify Acquisition Pipeline shows all 6 targets in correct stages
5. Verify Content Calendar shows briefs with correct statuses and "Needs Refresh" queue has 8 items
6. Verify Site Detail for trailgearreviews.com shows programs, networks, revenue history, valuation tab
7. Log any visual issues (data shows but formatting broken) — fix in this track

**Track E — Import UI**

Add "Data Import" tab to Settings page:
- Source selector: dropdown (ShareASale / Amazon Associates / CJ Affiliate / Generic CSV)
- Site selector: dropdown of all tenant sites
- File upload input (accept .csv)
- Upload triggers preview:
  - Parse CSV client-side to show first 5 rows in a preview table
  - Show "X rows detected, Y appear to be duplicates" before confirm
- Confirm Import button → POST to `/api/affiliate/import`
- Success state: "Imported X entries. Skipped Y duplicates."
- Error state: show errors per row

## Phase 3 — Sequential Gate

**Track F — End-to-End Verification**
- Ridgeline tenant: every page loads with data, no blank screens, no console errors
- GHM tenant: zero regressions — all existing pages work exactly as before
- CSV import: upload a test ShareASale CSV (create a small 3-row test file) → verify entries appear in Site Revenue tab
- GSC flow: verify the connection UI renders for a Site (don't need a real GSC property — just verify the UI and flow are wired)

**Track G — TypeScript Gate**
`npx tsc --noEmit`
Zero new errors in Sprint 40 files.

**Track H — Sprint Close**
- `CHANGELOG.md` — Sprint 40 entry with full detail
- `STATUS.md` — "Vertical 2 demo-ready. Ridgeline tenant live. Sprint 40 shipped [commit]."
- `BACKLOG.md` — mark Sprint 40 ✅ SHIPPED
- `git add -A && git commit -m "Sprint 40: Affiliate vertical demo tenant (Ridgeline Media) + GSC/GA4 Site integration + CSV network import" && git push origin main`

## Quality Standards

- Seed data must look real — specific domain names, real niches, real keyword examples, plausible revenue figures with realistic growth curves
- No placeholder text like "Test Site" or "Lorem ipsum" anywhere in seed data
- Revenue trends should be coherent — growing sites should have growing revenue, dormant sites should be flat or declining
- All seed data is tenant-scoped to ridgeline — never leaks into GHM tenant
- CSV import is safe — duplicate detection prevents double-importing

## Constraints

- Do NOT modify GHM tenant data or SEO vertical behavior
- Do NOT hardcode Proper Sluice data anywhere — the template is generic
- Seed script must be idempotent — running twice produces same result as running once
- CSV parsing must handle messy real-world CSVs: extra whitespace, different date formats, missing optional columns
- All API routes behind auth + tenant scope
