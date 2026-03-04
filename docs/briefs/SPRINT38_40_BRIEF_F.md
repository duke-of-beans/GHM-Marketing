# SPRINT 38-40 — TRACK F BRIEF
# Task: UI — Revenue Dashboard, Acquisition Pipeline, Nav Updates

## Context
Project: D:\Work\SEO-Services\ghm-dashboard
Tracks A-D must be complete. Track E (Sites pages) should also be complete.
GHM tenant must see zero changes.

## Step 1: Read the existing kanban pipeline page first
Read: src/app/(dashboard)/pipeline/page.tsx
Read: src/components/ui/metric-tile.tsx
You will copy the kanban structure for the Acquisitions page.

## Step 2: Create the Revenue Dashboard

Create src/app/(dashboard)/revenue/page.tsx

Top row: 4 MetricTile components:
- Portfolio MRR: sum of monthlyRevenueCurrent across all active Sites for this tenant
- Total Traffic: sum of monthlyTrafficCurrent across all active Sites
- Average RPM: average currentRPM across all active DisplayAdNetworks with status = ACTIVE
- Total Sites: count with breakdown text "X active / X dormant / X for sale"

Revenue by Site table (below the metric tiles):
- Columns: Site (domain, linked to /sites/[id]), This Month Revenue, Last Month Revenue, MoM Change (percentage with up/down arrow colored green/red), Traffic, RPM, Primary Monetization
- Table is sortable by clicking column headers
- Clicking a row navigates to /sites/[id]

Monthly Trend Chart:
- recharts LineChart
- X axis: last 12 months (month labels)
- Y axis: total portfolio revenue
- Aggregate all RevenueEntries across all sites by month
- Match the chart styling patterns used elsewhere in the codebase

Revenue by Source chart:
- recharts PieChart or BarChart
- Shows percentage split: Affiliate vs Display vs Sponsored vs Other
- Aggregate all RevenueEntries for the current tenant

Empty state (when no revenue entries exist): "Add revenue entries to your sites to see portfolio performance here."

## Step 3: Create the Acquisition Pipeline

Create src/app/(dashboard)/acquisitions/page.tsx

Kanban board — copy the structure from pipeline/page.tsx.
5 columns: Researching | Due Diligence | Negotiating | Purchased | Passed

Cards show: Domain (bold), Niche, Asking Price (if set), Monthly Revenue (if set), Domain Authority (if set), Source badge.

The Passed column is collapsed by default — show "X passed" as a label with a toggle to expand.

"Add Target" button opens a drawer with all AcquisitionTarget fields.

Clicking a card opens a detail drawer showing all fields. All fields are editable in the drawer. Notes section is prominent. Stage can be changed via a select input.

When stage is changed TO Purchased, show an inline prompt inside the drawer:
"Create a site record for this domain?" with a button that opens the Add Site modal pre-filled with: domain = target domain, niche = target niche, acquisitionCost = purchasePrice, acquisitionDate = purchasedDate.

Empty state per column (each column shows its own empty state when no cards exist).

## Step 4: Update the nav/sidebar

Read the sidebar or nav component file (find it — look for the main layout component).

When tenant.config.verticalType === 'affiliate_portfolio', change the nav to:
SHOW: Dashboard, Sites, Acquisition Pipeline (sub-item under Sites), Revenue, Content, Tasks, Vault, Settings, Team
HIDE: Invoicing/Billing, Lead Pipeline/Prospects, Partners, Work Orders, Proposals, Client Portal, Territories

All nav labels must come from the terminology config (already wired in Track B), not hardcoded strings. "Sites" comes from terminology.clients. "Acquisition Pipeline" is a new label (hardcode this one — it has no SEO equivalent).

Log into GHM tenant after making nav changes and confirm the nav looks exactly the same as before this sprint. Zero change for GHM.

## Done
Report: "Track F complete — /revenue dashboard created, /acquisitions kanban created (5 columns, card drawer, purchase prompt), nav updated for affiliate vertical, GHM nav regression confirmed."
