# SPRINT 38-40 — TRACK I BRIEF
# Task: GSC/GA4 Site extension, CSV Import UI, and end-to-end verification

## Context
Project: D:\Work\SEO-Services\ghm-dashboard
All previous tracks must be complete.

---

## PART 1: GSC/GA4 Site Extension

### Step 1: Find the existing GSC integration code
Run: grep -r "search-console\|searchConsole\|gsc" src/ --include="*.ts" --include="*.tsx" -l
Read whichever file is returned. Understand how it currently works for clients.

### Step 2: Parameterize the fetch functions
The existing function(s) probably accept a clientId. Change the signature to accept:
{ type: 'client', id: number } | { type: 'site', id: number }

Preserve all existing client behavior exactly — the client path must work identically to before.

### Step 3: Wire the site path

For GSC + Site:
After fetching GSC data, loop through the URL performance rows.
For each URL, find the matching AffiliateContentBrief where publishedUrl = that URL and tenantId matches.
When a match is found:
- Set currentRankingPosition = the GSC position value
- Set currentMonthlyTraffic = the GSC clicks value
- Set lastRankCheck = new Date()
- If peakRankingPosition is null → set peakRankingPosition = currentRankingPosition
- If currentRankingPosition < peakRankingPosition (lower number = better rank) → update peakRankingPosition = currentRankingPosition
- If (currentRankingPosition - peakRankingPosition) > 5 → set refreshDue = true

For GA4 + Site:
After fetching GA4 session data, find the active DisplayAdNetwork for this site (status = ACTIVE).
Update currentMonthlySessions on that network record.

### Step 4: Add connection UI to Site Detail
In src/app/(dashboard)/sites/[id]/page.tsx, on the Overview tab, add GSC and GA4 connection fields.
Use exactly the same component or pattern already used for client GSC/GA4 connection — just pass siteId instead of clientId.

---

## PART 2: CSV Import UI

### Step 5: Add Data Import tab to Settings
Read: src/app/(dashboard)/settings/page.tsx
Find where tabs are defined. Add a "Data Import" tab. Guard it as admin-only, same as other admin tabs.

Tab content:
- Heading: "Import Revenue Data"
- Source dropdown (label: "Source"): options are ShareASale | Amazon Associates | CJ Affiliate | Generic CSV
- Site dropdown (label: "Site"): fetch from GET /api/affiliate/sites, show domain as label
- File input: accept=".csv"
- When a file is selected: parse it client-side using PapaParse (install if not present: npm install papaparse @types/papaparse)
  Show a preview table of the first 5 detected rows
  Show "X rows detected" below the preview
- "Import" button: on click, POST to /api/affiliate/import as FormData (source, siteId, file)
- Show loading state while importing
- On success: show "Imported X entries. Skipped Y duplicates."
- On error: show the errors[] array from the API response, one per line

Only show this tab when verticalType === 'affiliate_portfolio'. Hide it for GHM.

---

## PART 3: End-to-End Verification

### Step 6: Verify ridgeline tenant

Check each of these — report pass or fail for each:

1. /sites — 12 sites visible with correct status badges (ACTIVE, DORMANT, FOR_SALE, SOLD)
2. /sites/[trailgearreviews id] — Programs tab: 4 programs, Patagonia shows PENDING (amber). Ad Networks tab: Mediavine shows ACTIVE with progress bar >100%. Revenue tab: 12 monthly entries and sparkline visible.
3. /revenue — Portfolio MRR tile shows a value above $18,000. Monthly trend chart renders 12 months of data. Source breakdown chart renders.
4. /acquisitions — 6 targets distributed correctly: Researching×2, Due Diligence×2, Negotiating×1, Passed×1. Passed column is collapsed by default.
5. Content calendar — Shows 46 briefs total. Needs Refresh tab shows exactly 8 briefs sorted by revenue.
6. /sites/[seniorpetguide id] Valuation tab — Shows LISTED status, $82,000 listed price, Empire Flippers.
7. Dashboard portfolio intelligence — Top Earners widget shows trailgearreviews at the top. Qualification Tracker shows weekendrenovator and seniorpetguide working toward Mediavine 50K.

### Step 7: GHM regression check

Log into GHM tenant. Check each — report pass or fail:
1. /clients — client list loads normally, no console errors
2. /leads — pipeline loads normally, no console errors
3. /settings — no "Data Import" tab visible
4. Nav — shows same nav items as before this sprint, no new items, no missing items
5. Browser console — zero new errors on any GHM page

### Step 8: CSV import round-trip

Create a small test CSV file with this content (ShareASale format):
```
Transaction Date,Merchant,Commission
2025-10-15,REI Affiliate,24.50
2025-10-22,REI Affiliate,18.75
2025-11-03,Backcountry,31.20
```

Upload it via Settings → Data Import, selecting source=ShareASale and site=trailgearreviews.
Confirm: 2 entries imported (Oct grouped, Nov grouped).
Upload the same file again.
Confirm: skipped count = 2 (duplicate detection working).

---

## PART 4: TypeScript Gate

### Step 9: Run TypeScript check
```
npx tsc --noEmit
```
Zero new errors allowed in any Sprint 38-40 file.
The pre-existing error count at Sprint 37 close was 12. That number must not increase.
Fix any errors in new files before proceeding.

---

## PART 5: Sprint Close

### Step 10: Update docs and commit

Update CHANGELOG.md — add this entry at the very top:
```
## Sprints 38-40 — Affiliate Vertical Complete ([today's date]) — commit [hash after committing]
Data layer: 7 new Prisma models + 8 enums. AFFILIATE_MODULE_DEFAULTS and AFFILIATE_TERMINOLOGY configs.
30+ API routes under /api/affiliate/. CSV import with shareasale/amazon/cj/generic parsers + dedup.
UI: /sites (portfolio list), /sites/[id] (6-tab detail), /revenue (dashboard), /acquisitions (kanban),
content calendar affiliate mode, portfolio intelligence widgets (5), nav updates.
Demo: Ridgeline Media LLC — 12 sites, 12mo revenue history, 38+ programs, 46 briefs, 6 targets, 2 valuations.
Intelligence: GSC/GA4 extended to Site records. CSV import UI in Settings.
TypeScript: zero new errors. GHM regression: clean.
Vertical 2 demo-ready. Proper Sluice onboards via standard provisioning — no code changes required.
```

Update STATUS.md — change the Last Updated line to:
"Last Updated: [today's date] — Sprints 38-40 shipped [commit hash]. Vertical 2 affiliate portfolio complete. ridgeline.covos.app demo-ready. Next: Sprint 34-OPS (David manual, THIRD_PARTY_MIGRATION.md). Proper Sluice onboards as real tenant via standard provisioning flow."

Update BACKLOG.md:
- In the sprint sequence table, mark Sprint 38, Sprint 39, and Sprint 40 rows as SHIPPED with the commit hash
- Delete the "VERTICAL 2 — Affiliate Portfolio Sprints" section from the open work area

Then commit and push:
```
git add -A
git commit -m "Sprints 38-40: Affiliate vertical complete — 7 Prisma models, 30+ API routes, 7 UI surfaces, Ridgeline demo tenant, GSC/GA4 Site integration, CSV import. Vertical 2 demo-ready."
git push origin main
```

## Done
Report: "Track I complete — GSC/GA4 extended to Sites, CSV import UI live, all verification checks passed, TypeScript clean, committed and pushed. Sprint 38-40 closed."
