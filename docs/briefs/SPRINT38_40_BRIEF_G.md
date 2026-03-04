# SPRINT 38-40 — TRACK G BRIEF
# Task: UI — Content Calendar affiliate mode and Portfolio Intelligence Dashboard

## Context
Project: D:\Work\SEO-Services\ghm-dashboard
All previous tracks must be complete.
CRITICAL: Do NOT modify the content calendar for GHM. Every change must be gated on verticalType === 'affiliate_portfolio'. GHM must work exactly as before.

## Step 1: Read the content calendar first
Read: src/app/(dashboard)/content/page.tsx
Understand fully how it works before touching it.

## Step 2: Extend the Content Calendar for affiliate mode

All of the following changes must be wrapped in a condition that checks verticalType === 'affiliate_portfolio'. If the tenant is not an affiliate portfolio, render the page exactly as it does today.

When verticalType === 'affiliate_portfolio', add these changes to the content page:

SITE FILTER: Add a dropdown at the top of the page. Fetch from GET /api/affiliate/sites to populate options. When a site is selected, filter the displayed briefs to only show AffiliateContentBriefs for that siteId. When no site is selected, show all briefs across all sites.

DATA SOURCE: For affiliate tenants, fetch briefs from GET /api/affiliate/sites/[id]/briefs (or a summary endpoint if you need to show all sites at once). Not from the regular content endpoint.

EXTRA COLUMNS on published rows: Published URL (linked), Current Position, Monthly Traffic, Attributed Revenue. Only show these columns for rows where status = PUBLISHED.

REFRESH DUE INDICATOR: For rows where refreshDue = true, show an amber "Needs Refresh" badge in the status column. Give these rows a subtle amber row background.

WRITER FIELD: Make the writer assignment field accept free text (contractor name string), not just a user ID picker. The assignedWriterName field on AffiliateContentBrief is a plain string.

BULK ASSIGN: When one or more rows are selected via checkbox, show an "Assign Writer" button in the toolbar. Clicking it opens a small popover/modal with a single text input. Submitting calls PUT /api/affiliate/briefs/[id] for each selected brief to set assignedWriterName.

NEEDS REFRESH SUB-TAB: Add a "Needs Refresh" tab to the filter tabs. This tab shows only briefs where refreshDue = true, sorted by attributedMonthlyRevenue descending (highest revenue impact first). Include a "Mark Refreshed" button per row that sets refreshDue = false via PUT /api/affiliate/briefs/[id].

## Step 3: Add Portfolio Intelligence Dashboard widgets

Read the main dashboard page (src/app/(dashboard)/page.tsx or wherever the dashboard widgets are rendered). Understand how existing widgets are structured.

When verticalType === 'affiliate_portfolio', add these 5 widgets to the dashboard. Add them as a new section or replace the existing widget area for this vertical — match whatever pattern is already used for conditional dashboard content.

WIDGET 1 — Top Earners
Title: "Top Earners"
Show the top 5 Sites by monthlyRevenueCurrent.
Use a recharts BarChart or a simple ranked list with the site domain and revenue figure.
Empty state: "Add revenue data to your sites to see top earners."

WIDGET 2 — Site Health
Title: "Site Health"
For each site, compute a health score:
- Traffic trend: compare the last 3 months of RevenueEntry sessions totals. Up = good, flat = neutral, down = concern.
- Revenue trend: same comparison for revenue. Up = good, flat = neutral, down = concern.
- Content freshness: what % of PUBLISHED briefs have refreshDue = false.
Overall: Green = all good, Amber = one concern, Red = two or more concerns.
Display as a compact list with a colored badge per site.
Empty state: "Not enough data yet to calculate site health."

WIDGET 3 — Qualification Tracker
Title: "Qualification Tracker"
Show only Sites that have a DisplayAdNetwork with status NOT_QUALIFIED or PENDING and a monthlySessionsRequired value set.
For each: show the network name, a progress bar (qualificationProgress from the API), and a label like "28,400 / 50,000 sessions to Mediavine".
Empty state: "No sites are currently working toward ad network qualification."

WIDGET 4 — Content Velocity
Title: "Content Velocity"
Table: Site domain | Briefs published this month | Briefs published last month | Change
"Published this month" = AffiliateContentBriefs where status = PUBLISHED and publishedDate is in the current calendar month.
Highlight rows in amber where "published this month" = 0 (stalled sites).
Empty state: "No published briefs yet."

WIDGET 5 — Portfolio Valuation
Title: "Portfolio Valuation"
A single MetricTile showing: sum of estimatedValue from the most recent SiteValuation per active Site.
Sub-label: "across X sites"
Empty state: "Add site valuations to see total portfolio value."

## Done
Report: "Track G complete — content calendar extended for affiliate mode (site filter, post-publish columns, refresh due, bulk assign, Needs Refresh tab), 5 portfolio intelligence widgets added to dashboard."
