# COVOS Vertical 2 — Affiliate / Domain Portfolio
**Created:** March 3, 2026
**Status:** ACTIVE — Strategy complete. Sprints 38–40 in design.
**Owner:** David Kirsch
**First tenant:** Proper Sluice (onboarded post-template completion via standard provisioning flow)

---

## What This Vertical Is

An affiliate / domain portfolio company operates a collection of content websites that earn passive revenue through affiliate commissions, display advertising, and/or site sales. The operator owns the sites (or licenses the domains), produces or commissions content, manages affiliate relationships with networks and merchants, tracks performance across the portfolio, and either holds sites long-term or flips them for a multiple of monthly earnings.

COVOS serves this vertical the same way it serves the SEO agency vertical — as the single operating environment that replaces a fragmented stack of Ahrefs, spreadsheets, Notion content calendars, ShareASale dashboards, Amazon Associates reports, Google Analytics tabs, and domain registrar accounts.

**The CANCEL list for a mid-size affiliate portfolio company (~$20K/month):**

| Tool | Monthly Cost | Action |
|------|-------------|--------|
| Ahrefs / Semrush | $400 | REPLACE (rank tracking per site) |
| Notion / ClickUp | $200 | REPLACE (content calendar, task management) |
| Google Sheets / Airtable | $100 | REPLACE (revenue tracking, site inventory) |
| Surfer SEO | $199 | REPLACE (content briefs) |
| Link Whisper | $77/yr | REPLACE (internal linking — future sprint) |
| SurferSEO | $199 | REPLACE |
| Zapier | $100 | REPLACE (automation middleware) |
| **Net saved** | **~$1,076/mo** | |

At COVOS Starter tier ($500/mo), operator is cash-positive from month one.

---

## Two Customer Archetypes

### Archetype A — The Existing Portfolio Operator
Already has sites, already earning. Data scattered across 8–12 tools. Onboards to COVOS to consolidate and cancel. The migration experience is the product for them — import existing sites, connect affiliate networks, see their full portfolio state from day one without rebuilding everything manually.

**Scale range:** Solo doing $5K/month across 10 sites → 10-person team doing $300K/month across 200+ sites.

**Primary pain:** No single view of the portfolio. Revenue data lives in 6 different network dashboards. Ranking data lives in Ahrefs. Content status lives in Notion or a spreadsheet. Site health lives in Google Search Console. Nothing talks to anything else.

**What they need on day one:** Portfolio import, revenue history entry, affiliate program registry, and a dashboard that shows them what they were already tracking — just in one place.

### Archetype B — The Startup Operator
Has a plan and maybe a few domains but no revenue yet. Buys the platform before they need it because they want to operate professionally from day one, not retrofit a system later. The acquisition pipeline and content planning tools are what they live in initially.

**Scale range:** Pre-revenue → first $1K/month.

**Primary pain:** No system. They're making decisions (which niche, which domain, which content topics) without a structured framework, and they know it.

**What they need on day one:** Domain acquisition pipeline to evaluate targets, content calendar to plan their attack, keyword tracking to set baselines before content goes live, affiliate program registry to track applications and approval status.

---

## Full Operator Lifecycle

Both archetypes move through the same lifecycle — Archetype A enters at Phase 3 or 4 already, Archetype B enters at Phase 1.

### Phase 1 — Acquisition
Researching niches, evaluating domains (aged, expired, fresh builds), due diligence on sites being bought (traffic history, revenue history, link profile, penalty check), negotiating purchase, closing.

**COVOS feature:** Acquisition Pipeline — domain as a record moving through stages: Researching → Due Diligence → Negotiating → Purchased / Passed. Each record holds: domain, niche, asking price, current monthly traffic, current monthly revenue, DA/DR, source (broker / expired auction / outreach), and due diligence notes.

**Key insight:** Many operators track 50–100 acquisition targets simultaneously. The pipeline view is not a nice-to-have — it's daily-use infrastructure.

### Phase 2 — Launch
Hosting setup, CMS configuration, initial keyword research, affiliate program applications (many require manual approval — Amazon Associates, Mediavine, ShareASale merchants, individual brand programs all have gates), display ad network qualification tracking (Mediavine requires 50K monthly sessions; AdThrive/Raptive requires 100K monthly pageviews — tracking where each site sits relative to those thresholds is operationally important).

**COVOS feature:** Site record with launch status, monetization readiness checklist, affiliate program application status tracker.

### Phase 3 — Content Production
The core ongoing operation. This is more central here than in the SEO vertical. In SEO, content is a deliverable to a client. Here, content IS the product — it directly generates revenue. A site that stops publishing decays. The content calendar is not a feature, it's the engine.

**COVOS feature:** Content Calendar per site — brief creation, keyword assignment, writer assignment (internal or contractor), editorial review status, publish date, published URL. Post-publish: the URL gets tracked for rankings, traffic, and attributed revenue. The loop closes automatically.

**Key insight:** High-volume operators publish 50–200 articles per month across a portfolio. The content calendar must handle volume, filtering by site, filtering by status, bulk actions (assign writer to 10 articles at once), and deadline visibility.

### Phase 4 — Growth
Rank tracking per keyword per site, traffic monitoring (sessions, pageviews, RPM trends), link building campaigns (guest posts, HARO, digital PR), content refresh scheduling (competitive topics decay in 12–18 months and need updates), site health monitoring (Core Web Vitals, crawl errors, indexed page count).

**COVOS feature:** Rank tracking wired to site records (GSC integration), content refresh queue (articles flagged for update by ranking decay signal), link building task tracker.

### Phase 5 — Monetization Management
The revenue layer. Multiple affiliate programs per site, different commission rates, different cookie windows (Amazon: 24 hours; most ShareASale/CJ merchants: 30–90 days), multiple payout thresholds across networks, monthly revenue reconciliation, 1099 tax documentation from networks.

Display ad management is parallel: RPM tracking per site per month, network switching decisions (Ezoic → Mediavine at 50K sessions, Mediavine → AdThrive at 100K pageviews), ad placement optimization.

**COVOS feature:** Affiliate Program Registry (per site or global), Revenue Entry (monthly snapshot per site per source), Payout tracking, Network dashboard showing cross-network earnings.

### Phase 6 — Portfolio Intelligence
Cross-site performance comparison. Which sites are growing vs. stagnant vs. declining? What's the revenue per article across sites? Which content categories are most monetizable? Where is the next dollar of investment best deployed — new content on a winner, rescuing an underperformer, or acquiring a new site?

**COVOS feature:** Portfolio Dashboard — revenue per site, RPM per site, revenue per article (calculated), growth trajectory, health score per site (composite of traffic trend, ranking trend, revenue trend), cross-portfolio totals.

### Phase 7 — Exit / Flip
For operators whose primary model is building and flipping (Empire Flippers, Motion Invest, Flippa), this phase IS the business model. Sites typically sell for 30–40x monthly net profit on major brokers.

**COVOS feature:** Site Valuation module — monthly net profit (revenue minus hosting, content, tooling costs), calculated multiple range, estimated valuation, broker listing status, sale price when sold. Portfolio shows which sites are approaching flip-ready status.

---

## Data Models

### `Site` *(replaces "Client" as core entity)*
```
slug, domain, displayName, niche, category
status: active | dormant | for_sale | sold
launchDate, acquisitionDate, acquisitionCost
monthlyRevenueCurrent, monthlyTrafficCurrent
domainAuthority, domainRating
cms: wordpress | webflow | custom | other
hostingProvider, hostingCostMonthly
monetizationMix: affiliate | display | both | flip
affiliatePrograms → AffiliateProgram[]
adNetworks → DisplayAdNetwork[]
contentBriefs → ContentBrief[]
revenueEntries → RevenueEntry[]
valuations → SiteValuation[]
notes
```

### `AffiliateProgram`
```
site → Site
networkName: amazon | shareasale | cj | impact | rakuten | awin | direct | other
merchantName, merchantUrl
commissionRate, commissionType: percent | flat
cookieWindowDays
payoutThreshold, paymentSchedule: monthly | bimonthly | weekly
applicationStatus: not_applied | pending | approved | rejected
approvedDate, lifetimeEarnings, lastPayoutAmount, lastPayoutDate
notes
```

### `DisplayAdNetwork`
```
site → Site
networkName: mediavine | adthrive | ezoic | adsense | other
status: active | pending | not_qualified | rejected
monthlySessionsRequired (qualification threshold)
currentMonthlySessions
qualificationProgress: calculated %
currentRPM, monthlyRevenueCurrent
activeSince
notes
```

### `RevenueEntry` *(monthly snapshot)*
```
site → Site
month, year
sourceType: affiliate | display | sponsored | sale | other
sourceName (program or network)
revenue, sessions, pageviews
rpm: calculated (revenue / sessions * 1000)
epc: calculated (revenue / clicks) — for affiliate
notes
```

### `AcquisitionTarget` *(the pipeline)*
```
domain, niche, category
stage: researching | due_diligence | negotiating | purchased | passed
source: broker | expired_auction | marketplace | outreach
askingPrice, offeredPrice, purchasePrice
currentMonthlyTraffic, currentMonthlyRevenue
domainAuthority, domainAge
broker (Empire Flippers / Motion Invest / Flippa / GoDaddy / other)
dueDiligenceNotes, decisionNotes
targetedPurchaseDate, purchasedDate
assignedTo → User
```

### `ContentBrief` *(extends existing content model)*
```
site → Site
targetKeyword, searchVolume, keywordDifficulty
contentType: article | review | comparison | listicle | landing
assignedWriter → User (or contractor name)
wordCountTarget
status: briefed | in_progress | review | published | needs_refresh
dueDate, publishedDate, publishedUrl
-- post-publish tracking --
currentRankingPosition, currentMonthlyTraffic
lastRankCheck, lastTrafficPull
attributedMonthlyRevenue (from RevenueEntry correlation)
refreshDue: boolean (flag when position decays >5 spots)
```

### `SiteValuation` *(for exit/flip workflow)*
```
site → Site
valuationDate
monthlyNetProfit (revenue minus costs)
multipleUsed (30x / 36x / 40x — market standard)
estimatedValue: calculated
brokerListingStatus: not_listed | listed | under_offer | sold
listedPrice, salePrice, saleDate, broker
notes
```

---

## Module Toggle Configuration (Affiliate Vertical)

### ON
- Site Portfolio (new — replaces Client module)
- Content Calendar / Content Studio (extended)
- Task Management
- Acquisition Pipeline (new — adapted from Lead Pipeline)
- Affiliate Program Registry (new)
- Display Ad Network Tracker (new)
- Revenue Dashboard (new)
- Portfolio Intelligence Dashboard (new)
- Site Valuation / Exit Module (new)
- Vault (document management — domain purchase agreements, tax docs, content assets)
- Team Management (writers, VAs, link builders as internal/contractor users)
- Reporting

### OFF (toggle disabled for this vertical)
- Wave billing / invoicing (revenue comes from networks, not clients)
- Partner / Rep management
- Google Business Profile integration
- Google Ads integration
- Work Orders
- Proposals / DocuSign (keep for domain purchase agreements — partially on)
- Client Portal
- Territories
- Time Tracking (optional — useful for content teams, off by default)

### ADAPTED (terminology pass)
- "Clients" → "Sites"
- "Lead Pipeline" → "Acquisition Pipeline"
- "Lead" → "Target"
- "Client Health" → "Site Health"
- "Work Order" → disabled
- "Partner" → "Contractor" (writers, VAs, link builders)
- "Sales Rep" → "Content Manager"

---

## The Intelligence Loop

The killer differentiator over spreadsheets is closing the full data loop automatically:

**Content published → ranks → drives traffic → traffic converts → revenue**

This chain needs to be visible per article, per site, and across the portfolio — without manual data entry.

**Data sources and integration approach:**

| Source | Data | Integration |
|--------|------|-------------|
| Google Search Console | Impressions, clicks, average position per URL | API — already partially in platform from SEO vertical |
| Google Analytics 4 | Sessions, pageviews, revenue events | API — partial in platform |
| Amazon Associates | Clicks, orders, earnings | API (Product Advertising API) |
| ShareASale | Clicks, transactions, commissions | API |
| CJ Affiliate | Transactions, commissions | API |
| Impact | Conversions, commissions | API |
| Mediavine | RPM, sessions, revenue | CSV export (API limited) |
| AdThrive/Raptive | RPM, pageviews, revenue | CSV export |
| Ezoic | RPM, sessions, revenue | API available |

**Sprint 40 scope:** GSC + GA4 wired to Site records (already in platform from SEO vertical — redirect to Site model). Affiliate network CSV import (all major networks). API connections for Amazon, ShareASale, CJ as stretch goals.

---

## Content Calendar — Extension Approach

Extend existing Content Studio with "site mode" rather than building parallel module.

**What changes:**
- Content briefs attach to a `Site` record instead of a `Client` record
- Post-publish tracking added: `publishedUrl`, `currentRankingPosition`, `currentMonthlyTraffic`, `attributedRevenue`
- Refresh flag: auto-set when ranking position decays >5 spots from peak
- Volume handling: bulk assignment UI for high-volume operators (50+ briefs at once)
- Writer management: contractor name field for external writers (not just internal users)

**What stays the same:**
- Brief creation flow
- Status pipeline (briefed → in progress → review → published)
- Keyword and topic fields
- Assignee and due date

---

## Scale Considerations

The platform needs to work cleanly at both ends of the scale spectrum:

**Solo / Proper Sluice scale (5–20 sites, $1K–$20K/month):**
Clean, simple, fast to use alone. Every view should be navigable without configuration. Defaults should be sensible.

**Mid-size portfolio (50–200 sites, $20K–$300K/month):**
Bulk operations everywhere. Filtering by site, niche, status, monetization type. Fast content calendar with bulk assignment. Revenue dashboard with drill-down from portfolio → site → article.

**Large portfolio company (200+ sites, $300K+/month):**
Team management with multiple content managers, editors, writers, link builders. Role-based access per site (content manager sees their assigned sites only). Cross-portfolio reporting with custom date ranges.

---

## Sprint Sequence

| Sprint | Focus | Key Deliverables |
|--------|-------|-----------------|
| 38 | Vertical data layer | Prisma models, module toggle config, terminology config, basic CRUD |
| 39 | Vertical UI | Site portfolio view, affiliate program management, revenue dashboard, content calendar extension, acquisition pipeline, exit/flip module |
| 40 | Demo tenant + intelligence layer | Generic demo tenant seeded with realistic data, GSC/GA4 wired to Site records, affiliate network CSV import |

**Post-Sprint 40:** Proper Sluice onboarded as a real tenant through standard provisioning flow. No Proper Sluice-specific code in the platform — it's just a configured tenant.

---

## Reference Documents

- `D:\Work\SEO-Services\ghm-dashboard\docs\blueprints\SPRINT38_BLUEPRINT.md`
- `D:\Work\SEO-Services\ghm-dashboard\docs\blueprints\SPRINT39_BLUEPRINT.md`
- `D:\Work\SEO-Services\ghm-dashboard\docs\blueprints\SPRINT40_BLUEPRINT.md`
- `D:\Work\SEO-Services\ghm-dashboard\docs\COVOS_PLATFORM_STRATEGY.md`
- `D:\Work\Covos_Business_Opportunity_Assessment.docx`
- `D:\Work\SEO-Services\ghm-dashboard\docs\borrowed-light-formation-guide.html` (Borrowed Light Group structure)
