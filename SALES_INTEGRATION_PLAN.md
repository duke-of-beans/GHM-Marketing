# SALES FEATURES — DASHBOARD INTEGRATION PLAN
**Created:** February 20, 2026
**Source of Truth for:** All sales-related feature work mapped to existing dashboard architecture
**Reference:** `SALES_OPERATIONS.md` for business rules

---

## INVENTORY: WHAT EXISTS vs WHAT'S NEEDED

### ✅ ALREADY BUILT (Foundation Solid)

**Territory System**
- Schema: `Territory` model with name, cities, zipCodes, states, isActive
- API: Full CRUD at `/api/territories` + `/api/territories/[id]` (GET, POST, PATCH, DELETE)
- UI: `/territories` page with create/edit/delete
- User-Territory Link: `User.territoryId` FK, `territoryFilter()` helper in session.ts
- Lead Scoping: Leads already filter by territory via `territoryFilter()`
- **Gap:** Territory not prominently visible on sales dashboard. Rep sees territory name in subtitle but no detail card, no map, no boundary awareness.

**Commission System**
- Schema: `UserCompensationConfig` (per-user defaults), `ClientCompensationOverride` (per-client overrides), `PaymentTransaction` (ledger)
- API: Monthly cron at `/api/cron/generate-payments`, earnings at `/api/payments/my-earnings`, profitability at `/api/payments/profitability`, management fees at `/api/payments/management-fees`
- Calculation Engine: `src/lib/payments/calculations.ts` — commission, residual, master fee, profit breakdown
- UI: `MyEarningsWidget`, `CompanyProfitabilityWidget`, `ManagementFeesWidget`, `CompensationConfigSection` in settings
- **Gap:** Residual is flat $200/user — no tiered logic ($200/$250/$300 based on close volume). No upsell commission tracking. No "locked at close" behavior.

**Sales Dashboard**
- Page: `/sales` with personal stats (available, active, wins, revenue), quick actions (view pipeline, claim leads), pipeline funnel, earnings widget, tasks widget, needs attention list
- **Gap:** No prospect audit button. No demo generation. No territory detail card. No residual book view (which clients are generating residual, at what rate).

**Pipeline / Leads Page**
- Page: `/leads` with Kanban view, filters, drag-and-drop between stages
- Lead Detail: Domain rating, review count, deal value, assignee, notes, enrichment data
- **Gap:** No "Generate Audit" action on a lead. No "Create Demo" action on a hot lead. No quick-prospect workflow from the leads page.

**Discovery / Lead Gen**
- Page: `/discovery` with search, import, batch enrichment
- API: `/api/discovery/search`, `/api/discovery/import`
- **Gap:** This is the internal tool. Reps need a prospect-facing output from this data, not the raw internal view.

---

## 🔴 NEW FEATURES REQUIRED

### F1: Prospect Competitive Audit Generator
**Business Context:** Every sales call starts with this. Rep runs prospect's domain, gets a branded report showing competitive gaps. The door opener.

**Where it lives:**
- Primary: Button on lead detail view ("Generate Audit")
- Secondary: Standalone tool accessible from sales dashboard Quick Actions ("Run Prospect Audit" — enter any domain, doesn't need to be an existing lead)
- Output: Branded PDF/HTML report shareable via link

**What it does:**
1. Takes prospect domain as input
2. Pulls Ahrefs data (domain rating, backlinks, organic keywords, top pages)
3. Identifies top 3 local competitors automatically (or uses existing scan data if lead is already in system)
4. Generates comparison matrix: prospect vs competitors on key metrics
5. Highlights specific gaps and opportunities
6. Wraps in branded GHM template with rep's contact info
7. Outputs shareable link (hosted HTML) or downloadable PDF

**Technical approach:**
- New API: `POST /api/prospects/audit` — accepts domain, returns audit data
- New component: `ProspectAuditGenerator` — form + preview + share
- Reuses: Existing Ahrefs integration from competitive scan engine, existing report generation patterns from `ClientReport`
- New: Branded audit template (HTML), shareable link generation (static hosting or signed URL)

**Schema impact:** Minimal — could store as a new `ProspectAudit` model or just use existing `CompetitiveScan` with a "prospect" flag. Lean toward new model for clean separation.

---

### F2: Interactive Demo Generator
**Business Context:** The closer's weapon. Only used when prospect is engaged and leaning in. Rep hits button during call, demo spins up in ~2 minutes, prospect visits live URL.

**Where it lives:**
- Button on lead detail view ("Create Demo") — only visible on leads in active sales stages (contacted, follow_up, paperwork)
- NOT on every lead by default — this is a resource-intensive action

**What it does:**
1. Takes prospect's business info + competitive scan data
2. Generates a branded HTML mini-dashboard showing what their account would look like
3. Includes: their competitive position, sample satellite cluster preview, mock monthly report, ranking trajectory
4. Deploys to a temp URL (Vercel preview deploy, or static hosting)
5. URL is live for 30 days, then auto-expires
6. Rep shares URL verbally on the call or via text/email

**Technical approach:**
- New API: `POST /api/prospects/demo` — accepts lead ID, generates and deploys demo
- Reuses: Website Studio deploy patterns, existing competitive scan data, report HTML generation
- New: Demo HTML template (simplified version of client dashboard), temp deployment pipeline
- Token cost: ~$0.50-1.00 per demo (Claude API for content generation + Ahrefs data pull)

**Schema impact:** New `ProspectDemo` model — leadId, deployUrl, expiresAt, status, generatedAt

---

### F3: Territory Visibility on Sales Dashboard
**Business Context:** Rep needs to feel territory ownership. "This is MY market." Currently just a name in the subtitle.

**Where it lives:**
- New card on `/sales` dashboard: "My Territory" with name, scope (cities/states), lead counts, penetration rate
- Territory badge visible on pipeline page header
- Territory info on lead cards (confirms lead is in-territory)

**What it does:**
1. Shows territory name and geographic scope prominently
2. Displays: total addressable leads in territory, claimed leads, available leads, won clients
3. Shows penetration rate (won clients / total addressable)
4. Links to territory detail view
5. Shows production threshold status (rolling 90-day average vs minimum 2/month)

**Technical approach:**
- New component: `MyTerritoryCard` — fetches territory details + lead stats
- New API: `GET /api/territories/my-territory` — returns territory details with computed stats for current user
- Modification: Sales dashboard page to include territory card in layout

**Schema impact:** None — all data derivable from existing Territory + Lead tables

---

### F4: Tiered Residual System (Lock-at-Close)
**Business Context:** Residual rate ($200/$250/$300) is determined by rep's close volume in the month the client was signed, and locked permanently at that rate.

**Updated February 22, 2026:** The payments architecture spec (`D:\Work\SEO-Services\specs\PAYMENTS_ARCHITECTURE.md`) defines the full compensation track model. F4 is the sales-layer implementation of Track 1 (Sales Track). Key changes from that spec:

- The commission engine now triggers on **Wave `invoice.paid` webhook** (primary) rather than monthly cron
- Monthly reconciliation cron runs on the 5th as a safety net only
- `lockedResidualRate` lives on `ClientProfile` (not `ClientCompensationOverride`) — set once at close, never recalculated

**What changes:**
1. **Schema:** Add `lockedResidualRate Decimal?` to `ClientProfile` — stores the permanently locked rate at time of close
2. **Close trigger:** When lead status → "won" and client profile is created, calculate the rep's close count for that month, determine tier, write locked rate to `ClientProfile.lockedResidualRate`
3. **Engine update:** `calculateResidual()` reads `client.lockedResidualRate` first; falls back to `UserCompensationConfig.residualAmount` only if null (for legacy clients)
4. **UI update:** `CompensationConfigSection` shows tier table ($200 / $250 / $300 + lock-at-close explanation). `MyEarningsWidget` shows per-client breakdown with locked rates.

**Technical approach:**
- Add `lockedResidualRate Decimal?` to `ClientProfile` schema
- New function: `calculateResidualTier(closesThisMonth: number): Decimal` — returns 200/250/300
- Modify: Lead → Won transition handler to compute and lock rate
- Modify: `calculateResidual()` in `src/lib/payments/calculations.ts` to prefer `client.lockedResidualRate`
- Modify: `MyEarningsWidget` to show per-client breakdown with locked rates
- Update: `CompensationConfigSection` to display tier table

**Status:** Not yet built. Prerequisite: PAYMENTS-001 (webhook handler) should be built first so the lock-at-close trigger fires on the correct event.

---

### F5: Upsell Commission Tracking
**Business Context:** 10% commission on all upsells (websites, consultations). Currently not tracked.

**What changes:**
1. **Schema:** Add `type: "upsell_commission"` to `PaymentTransaction` type enum
2. **Trigger:** When upsell is marked as sold/completed, generate commission transaction
3. **UI:** Show upsell commissions in MyEarningsWidget breakdown

**Technical approach:**
- Modify: `PaymentTransaction.type` to accept "upsell_commission"
- New: Upsell → Sold handler generates payment transaction (10% of product price)
- Modify: `MyEarningsWidget` and `CompanyProfitabilityWidget` to include upsell commission category
- Reuses: Existing `UpsellOpportunity` model + `Product` catalog

---

### F6: Production Threshold Monitoring
**Business Context:** Reps must maintain 2 closes/month averaged over rolling 90 days. Dashboard should make this visible without being punitive.

**Where it lives:**
- MyTerritoryCard: Shows rolling 90-day average alongside minimum
- Manager dashboard: Shows per-rep production status (green/yellow/red)
- Settings/Team: Production threshold warnings in team management view

**Technical approach:**
- New utility: `calculateRolling90DayAverage(userId: number): number` — counts won leads in last 90 days / 3
- New component: `ProductionThresholdIndicator` — green (≥3/mo), yellow (2-3/mo), red (<2/mo)
- Modify: Territory card, manager dashboard widgets

---

### F7: Residual Book View
**Business Context:** Rep wants to see their compounding residual portfolio — which clients, what rate, how long active, total monthly residual income.

**Where it lives:**
- New page or tab: `/sales/residuals` or accordion on sales dashboard
- Shows: Client name, locked rate, months active, total earned to date, status

**Technical approach:**
- New API: `GET /api/payments/my-residual-book` — returns all clients with locked rates and payment history for current user
- New component: `ResidualBookTable` — sortable table with totals
- Links from: MyEarningsWidget "View details →"

---

## IMPLEMENTATION PRIORITY ORDER

Based on "what do we need before we can hire reps" vs "what makes the platform better over time":

### Phase A: Pre-Hire (Must have before posting job ad)
| ID | Feature | Effort | Depends On |
|----|---------|--------|------------|
| F1 | Prospect Audit Generator | Medium (3-4 sessions) | Ahrefs integration exists |
| F3 | Territory Visibility on Sales Dashboard | Small (1 session) | Territory system exists |
| F4 | Tiered Residual System | Medium (2 sessions) | Commission system exists |

### Phase B: First Week of Reps (Need within days of first hire)
| ID | Feature | Effort | Depends On |
|----|---------|--------|------------|
| F5 | Upsell Commission Tracking | Small (1 session) | Payment system exists |
| F6 | Production Threshold Monitoring | Small (1 session) | Lead data exists |
| F7 | Residual Book View | Small (1 session) | Payment system exists |

### Phase C: Sales Acceleration (Build as reps start closing)
| ID | Feature | Effort | Depends On |
|----|---------|--------|------------|
| F2 | Interactive Demo Generator | Large (4-5 sessions) | F1 + deploy pipeline |

---

## STATUS.md TASK MAPPING

These features map to the following entries in STATUS.md under "Sales Launch Tools":

| STATUS.md ID | This Plan | Notes |
|-------------|-----------|-------|
| S1 | F1 (Prospect Audit Generator) | Exact match |
| S2 | F2 (Interactive Demo Generator) | Exact match |
| S3 | Non-dashboard (digital brochure) | Static asset, not a dashboard feature |
| S4 | Non-dashboard (comp sheet) | Static asset for recruiting |
| S5 | F3 partially (territory map) | Dashboard shows territory; formal map may be separate |
| S6 | Non-dashboard (sales agreement) | Legal doc, not dashboard |
| S7 | Non-dashboard (job ad) | Posting, not dashboard |
| — | F4 (Tiered Residual) | New — update STATUS.md |
| — | F5 (Upsell Commission) | New — update STATUS.md |
| — | F6 (Production Threshold) | New — update STATUS.md |
| — | F7 (Residual Book View) | New — update STATUS.md |

---

## REVISION HISTORY
| Date | Version | Changes |
|------|---------|---------|
| 2026-02-20 | 1.0.0 | Initial integration plan — 7 features mapped, prioritized, effort estimated |
