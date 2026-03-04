# SPRINT 38-40 — TRACK E BRIEF
# Task: UI — Site Portfolio page and Site Detail page (6 tabs)

## Context
Project: D:\Work\SEO-Services\ghm-dashboard
Tracks A, B, C, D must be complete before this track runs.
GHM tenant must see zero changes. All new pages are only accessible when verticalType === 'affiliate_portfolio'.

## Step 1: Read these existing pages first — you will copy their structure exactly
Read: src/app/(dashboard)/clients/page.tsx
Read: src/app/(dashboard)/clients/[id]/page.tsx
Read: src/components/ui/empty-state.tsx
Read: src/components/ui/status-badge.tsx
Read: src/components/ui/metric-tile.tsx

Do not invent new UI patterns. Replicate what already exists.

## Step 2: Create the Site Portfolio page

Create src/app/(dashboard)/sites/page.tsx

This page is structurally identical to clients/page.tsx but shows Sites instead of Clients.
- Fetch from GET /api/affiliate/sites
- Table columns: Domain (linked to /sites/[id]), Niche, Status (use StatusBadge with SiteStatus values), Monthly Revenue, Monthly Traffic, DA, Monetization Mix, Edit and View action buttons
- "Add Site" button opens a modal/drawer with fields: domain, displayName, niche, category, status, launchDate, acquisitionDate, acquisitionCost, monthlyRevenueCurrent, monthlyTrafficCurrent, domainAuthority, domainRating, cms, hostingProvider, hostingCostMonthly, monetizationMix (select: affiliate / display / both / flip), notes
- Empty state: "No sites yet. Add your first site to start tracking your portfolio."

## Step 3: Create the Site Detail page

Create src/app/(dashboard)/sites/[id]/page.tsx

This page is structurally identical to clients/[id]/page.tsx — pinned header, tab navigation, scrollable tab content.

Page header shows: domain name, SiteStatus badge, and a quick stats strip with: Monthly Revenue | Monthly Traffic | DA/DR | Programs count | Briefs count.

Implement all 6 tabs:

TAB 1 — Overview
All Site fields displayed and editable (via inline edit or modal — match the pattern used in clients/[id]).
Show monetizationMix summary, launch date, acquisition date and cost.

TAB 2 — Programs (AffiliateProgram)
Fetch from GET /api/affiliate/sites/[id]/programs
Table columns: Network, Merchant, Commission Rate (%), Cookie Window (days), Status badge (Approved=green / Pending=amber / Rejected=red / Not Applied=gray), Lifetime Earnings, Last Payout.
"Add Program" button opens modal with all AffiliateProgram fields.
Edit and delete actions per row.

TAB 3 — Ad Networks (DisplayAdNetwork)
Fetch from GET /api/affiliate/sites/[id]/networks
Table columns: Network Name, Status badge, Current RPM, Monthly Revenue, Current Sessions.
Show a Qualification Progress bar for each network:
- Value = qualificationProgress from the API response (already computed server-side)
- Color: green if >= 100, amber if 50-99, red if < 50
- Helper text below bar: "X more sessions needed to qualify" when status is NOT_QUALIFIED
"Add Network" button opens modal with all DisplayAdNetwork fields.

TAB 4 — Revenue (RevenueEntry)
Fetch from GET /api/affiliate/sites/[id]/revenue
Table columns: Month/Year, Source Type, Source Name, Revenue, Sessions, RPM (read-only, from API), EPC (read-only, from API).
Show a small sparkline chart of monthly revenue totals (use recharts LineChart — match existing chart patterns in the codebase).
Show totals strip: YTD Revenue (current calendar year sum), All-time Revenue (total sum).
"Add Revenue Entry" button opens modal with fields: Month (number 1-12), Year, Source Type (select from RevenueSourceType enum), Source Name, Revenue, Sessions, Pageviews, Clicks.
In the modal, show a live RPM preview: if the user has entered Revenue and Sessions, compute (revenue / sessions) * 1000 and display it as they type.

TAB 5 — Content (AffiliateContentBrief)
Fetch from GET /api/affiliate/sites/[id]/briefs
Show status filter tabs: All | Briefed | In Progress | Review | Published | Needs Refresh
Table columns: Keyword, Type badge (ContentType), Writer, Status badge (BriefStatus), Due Date.
For rows where status = PUBLISHED, also show: Published URL (linked), Current Position, Monthly Traffic, Attributed Revenue, and a "Needs Refresh" amber badge if refreshDue = true.
"Needs Refresh" rows get an amber row highlight.
"Add Brief" button opens modal/drawer with all AffiliateContentBrief fields. Writer field is a free-text input (not a user picker — affiliate sites use freelance contractors by name).
Bulk assign: checkboxes on rows, "Assign Writer" button appears when rows are selected, opens a simple text input to set assignedWriterName on all selected briefs.

TAB 6 — Valuation (SiteValuation)
Fetch from GET /api/affiliate/sites/[id]/valuations
Show a "Current Valuation" card at the top with the most recent valuation: Monthly Net Profit, Multiple, Estimated Value (display large), Listing Status badge.
Show a history table of all past valuations below.
"Add Valuation" button opens modal with fields: Monthly Net Profit (number), Multiple (number, default 36), Estimated Value (read-only, computed live as user types: netProfit * multiple), Broker Listing Status (select from ValuationListingStatus), Listed Price (shown when status is LISTED or UNDER_OFFER), Sale Price and Sale Date (shown when status is SOLD or UNDER_OFFER), Broker, Notes.

## Done
Report: "Track E complete — /sites page and /sites/[id] page (6 tabs: Overview, Programs, Ad Networks, Revenue, Content, Valuation) created."
