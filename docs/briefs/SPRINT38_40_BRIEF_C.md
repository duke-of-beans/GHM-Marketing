# SPRINT 38-40 — TRACK C BRIEF
# Task: API routes for Site, AffiliateProgram, DisplayAdNetwork

## Context
Project: D:\Work\SEO-Services\ghm-dashboard
Tracks A and B must be complete before this track runs.

## Step 1: Read the existing API route pattern first
Read: src/app/api/clients/route.ts
Read: src/middleware.ts

Every route you write must follow the same pattern:
- Import withAuth and withPermission from middleware
- Get tenantId from the authenticated session — NEVER from the request body
- Every Prisma query includes where: { tenantId }
- Proper HTTP status codes (200, 201, 400, 404, 500)
- Try/catch on every handler

## Step 2: Create Site routes

Create src/app/api/affiliate/sites/route.ts
- GET: return all Sites where tenantId matches, ordered by domain
- POST: create a new Site; generate slug from domain if not provided

Create src/app/api/affiliate/sites/[id]/route.ts
- GET: return single Site with all relations (affiliatePrograms, adNetworks, revenueEntries, contentBriefs, valuations)
- PUT: update Site fields
- DELETE: delete Site (Prisma cascade handles related records)

## Step 3: Create AffiliateProgram routes

Create src/app/api/affiliate/sites/[id]/programs/route.ts
- GET: return all AffiliatePrograms for this siteId where tenantId matches
- POST: create a new AffiliateProgram for this site

Create src/app/api/affiliate/programs/[id]/route.ts
- PUT: update AffiliateProgram
- DELETE: delete AffiliateProgram

## Step 4: Create DisplayAdNetwork routes

Create src/app/api/affiliate/sites/[id]/networks/route.ts
- GET: return all DisplayAdNetworks for this siteId; for each network add a virtual field:
  qualificationProgress = Math.round((currentMonthlySessions / monthlySessionsRequired) * 100)
  Only compute if both values exist and monthlySessionsRequired > 0. Otherwise return null.
  Do NOT store qualificationProgress in the database — add it to the response object only.
- POST: create a new DisplayAdNetwork for this site

Create src/app/api/affiliate/networks/[id]/route.ts
- PUT: update DisplayAdNetwork

## Done
Report: "Track C complete — Site routes (list/detail/create/update/delete), AffiliateProgram routes (list/create/update/delete), DisplayAdNetwork routes (list/create/update) all created."
