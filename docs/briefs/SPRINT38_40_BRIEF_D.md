# SPRINT 38-40 — TRACK D BRIEF
# Task: API routes for RevenueEntry, AcquisitionTarget, AffiliateContentBrief, SiteValuation, and CSV Import

## Context
Project: D:\Work\SEO-Services\ghm-dashboard
Track C must be complete before this track runs.
Same route pattern applies: withAuth, withPermission, tenantId from session, where: { tenantId } on all queries.

## Step 1: Create RevenueEntry routes

Create src/app/api/affiliate/sites/[id]/revenue/route.ts
- GET: return all RevenueEntries for this siteId, ordered by year desc, month desc
- POST: create a new RevenueEntry
  Before saving, compute:
  - rpm = sessions > 0 ? (revenue / sessions) * 1000 : null
  - epc = clicks > 0 ? revenue / clicks : null
  Store rpm and epc in the database row.

Create src/app/api/affiliate/revenue/[id]/route.ts
- PUT: update RevenueEntry; recompute rpm and epc using the same logic before saving

## Step 2: Create AcquisitionTarget routes

Create src/app/api/affiliate/acquisitions/route.ts
- GET: return all AcquisitionTargets for this tenant, ordered by createdAt desc
- POST: create a new AcquisitionTarget

Create src/app/api/affiliate/acquisitions/[id]/route.ts
- GET: return single AcquisitionTarget
- PUT: update AcquisitionTarget (including stage changes)
- DELETE: delete AcquisitionTarget

## Step 3: Create AffiliateContentBrief routes

Create src/app/api/affiliate/sites/[id]/briefs/route.ts
- GET: return all AffiliateContentBriefs for this siteId; accepts optional ?status= query param to filter by BriefStatus
- POST: create a new AffiliateContentBrief

Create src/app/api/affiliate/briefs/[id]/route.ts
- GET: return single AffiliateContentBrief
- PUT: update AffiliateContentBrief
  When currentRankingPosition is included in the update payload, apply this logic:
  1. If peakRankingPosition is null OR currentRankingPosition < peakRankingPosition (lower = better ranking):
     set peakRankingPosition = currentRankingPosition
  2. If peakRankingPosition is set AND (currentRankingPosition - peakRankingPosition) > 5:
     set refreshDue = true
- DELETE: delete AffiliateContentBrief

## Step 4: Create SiteValuation routes

Create src/app/api/affiliate/sites/[id]/valuations/route.ts
- GET: return all SiteValuations for this siteId, ordered by valuationDate desc
- POST: create a new SiteValuation
  Before saving, compute: estimatedValue = monthlyNetProfit * multipleUsed
  Store the computed value in the database.

Create src/app/api/affiliate/valuations/[id]/route.ts
- PUT: update SiteValuation; recompute estimatedValue = monthlyNetProfit * multipleUsed before saving

## Step 5: Create CSV Import route

Create src/app/api/affiliate/import/route.ts
This is a POST route that accepts multipart form data with three fields:
- source: string — one of: shareasale | amazon | cj | generic
- siteId: string (parse to Int)
- file: the CSV file

Parse the CSV. Use papaparse if it is already a dependency. If not, write a simple parser that splits on newlines and commas.

Source-specific parsing rules:

shareasale: Find columns whose headers contain "date", "merchant", and "commission" (case-insensitive). Group rows by month+year+merchant. Create one RevenueEntry per group: sourceType = AFFILIATE, sourceName = merchant name, revenue = sum of commissions for that group.

amazon: Find columns whose headers contain "date" and either "shipped revenue" or "earnings" (case-insensitive). Group all rows by month+year. Create one RevenueEntry per month: sourceType = AFFILIATE, sourceName = "Amazon Associates", revenue = sum for that month.

cj: Find columns whose headers contain "date", "advertiser", and "commission" (case-insensitive). Group rows by month+year+advertiser. Create one RevenueEntry per group: sourceType = AFFILIATE, sourceName = advertiser name, revenue = sum.

generic: Expect columns named exactly: month, year, source_type, source_name, revenue. Optional columns: sessions, pageviews, clicks. Map each row directly to one RevenueEntry.

Deduplication: Before inserting each row, check if a RevenueEntry already exists with the same [tenantId, siteId, month, year, sourceType, sourceName]. If it exists, skip it and increment a skipped counter.

Return: { imported: number, skipped: number, errors: string[] }
Errors array should contain row-level error messages. Do not abort on row errors — collect them and continue.

## Done
Report: "Track D complete — RevenueEntry, AcquisitionTarget, AffiliateContentBrief, SiteValuation routes created. CSV import route created with shareasale/amazon/cj/generic parsers and dedup logic."
