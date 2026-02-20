# GHM DASHBOARD — INTEGRATION & ENRICHMENT STRATEGY
**Created:** February 19, 2026  
**Updated:** February 19, 2026 (DataForSEO + NAP Scraper + Report Roadmap)  
**Purpose:** Data enrichment methodology, API selection, scaling costs, and integration architecture.

---

## Core Philosophy

The value of this platform is intelligence, not monitoring. Every data point exists to either close a sale or generate a work order. The enrichment stack is chosen for maximum actionable signal at minimal cost, with a caching strategy that keeps API spend flat as client count grows.

Clients pay $2,400/month for standard services. The entire enrichment stack should never exceed the cost of a single client's monthly fee, even at 250 clients. At every scale, tooling cost is a rounding error against revenue.

---

## The Data Loop (Per Client, Per Cycle)

Each client scan cycle pulls data on the client + ~3 competitors (4 domains per cycle). Two cycles per month = 8 domain-level data pulls per client per month.

Each pull hits:
- **Ahrefs** — DR, backlinks, keyword rankings, content gaps, organic traffic estimate
- **Outscraper** — GBP metrics, review count/rating, business info
- **Google PageSpeed API** — Core Web Vitals, performance score
- **Google Ads API** (read-only) — campaign performance, spend, CTR, conversions
- **Google Business Profile API** — local search impressions, direction requests, calls, posts

The delta calculator compares current scan to previous scan. Gaps between client and competitors automatically generate work orders:
- Competitor gained backlinks → link-building task
- Competitor review count jumped → review generation campaign
- Client page speed dropped → technical optimization task
- Competitor published new content on target keywords → content brief
- Client GBP metrics declining → listing optimization task

This is the engine that creates the sales leverage (competitive scorecards for pitches) and methodologically keeps clients at #1 (auto-generated work orders from real competitive movement).

---

## API Selection & Rationale

### Ahrefs (SEO Intelligence Layer)
- **What it provides:** Domain rating, backlink profiles, keyword rankings, organic traffic estimates, content gap analysis, competitor keyword overlap
- **Why Ahrefs over BrightLocal:** BrightLocal is a monitoring tool — rank tracking and citation audits. Ahrefs is a full intelligence platform — keyword research, backlink analysis, content gaps, competitive overlap. Ahrefs data is deeper and feeds directly into work order generation.
- **API approach:** "Scan light, drill deep on demand" — pull high-value summary metrics (DR, referring domains, traffic estimate) on every cycle. Deep keyword gap analysis only triggers when lightweight scan detects meaningful change, or when manually requested before a strategy session.
- **Caching:** 14-day TTL for client domains, 30-day TTL for competitors. Competitors whose metrics haven't moved in 3 months get lightweight checks only.

### Outscraper (Business Data Layer)
- **What it provides:** Google Maps business data, review counts/ratings, business hours, contact info, competitor business profiles
- **Why Outscraper:** Free tier (500 requests/month) covers operations through ~60 clients. Pennies after that. Already integrated in the enrichment engine.
- **Usage:** Lead enrichment on import + client/competitor GBP data refresh on scan cycles

### Google PageSpeed API (Performance Layer)
- **What it provides:** Core Web Vitals, performance/accessibility/SEO scores, specific optimization recommendations
- **Cost:** Free. 25,000 queries/day limit (effectively unlimited).
- **Usage:** Every scan cycle checks client + competitor site performance. Score drops auto-generate technical tasks.

### Google Ads API (Campaign Intelligence — READ ONLY)
- **What it provides:** Campaign performance, ad spend, CTR, conversion data, keyword performance
- **Cost:** Free. Requires OAuth per client ad account.
- **Important:** Clients pay Google directly. We pull performance data for reporting and analysis only. No billing complexity.
- **Usage:** Feeds into client analytics tab, monthly reports, and upsell detection (declining campaign performance → pitch optimization services).

### Google Business Profile API (Local Presence Layer)
- **What it provides:** Listing management, review monitoring/response, post publishing, local search insights (impressions, calls, direction requests)
- **Cost:** Free. Requires OAuth per client GBP account. Must apply for API access (Google gates it, but agencies qualify).
- **Usage:** Replaces manual GBP management. Monitor reviews, publish posts, track local search performance — all from the dashboard. Auto-generates tasks when reviews go unanswered or listing data goes stale.
- **Note:** Q&A API was discontinued November 2025. Core listing/review/insights APIs still active.

### GoDaddy API (Hosting & Deployment Layer)
- **What it provides:** Domain purchase, DNS management, SSL provisioning, hosting deployment
- **Cost:** Standard GoDaddy hosting/domain pricing (client pays). API access is free.
- **Usage:** Website Studio deploys directly through API. Live Sites panel monitors real deployment status. Domain provisioning on client onboarding. Nobody ever logs into GoDaddy manually.

### Wave API (Financial Layer)
- **What it provides:** Invoice generation, payment tracking, expense categorization, revenue reporting
- **Cost:** Wave is free for invoicing. API access included.
- **Usage:** Commission engine pushes real invoices. Client payment status feeds back into dashboard. Revenue/profitability widgets show real numbers instead of estimates.

### DataForSEO SERP API (Local Rank Tracking Layer)
- **What it provides:** SERP results with local pack positions for any keyword from any zip code/GPS coordinate. Returns structured JSON with organic rankings, local pack positions, SERP features, competitor positions.
- **Why DataForSEO over BrightLocal:** BrightLocal charges $150/mo for rank tracking (100 keywords from client zip). DataForSEO costs $0.0006/request in standard queue. 100 keywords × 2 scans/month = $0.12/client/month. At 250 clients that's $30/mo vs BrightLocal scaling to $400+/mo. Data comes back as structured JSON that feeds directly into rank cluster visualization and report generation — no screen-scraping a third-party UI.
- **Core workflow it replaces:** Track 100 keywords per client from their primary zip code. Show local pack position + organic position per keyword. Calculate rank clusters (groups of keywords where client dominates vs. where competitors own the space). This cluster data is the primary sales leverage tool AND the work order generation engine.
- **API approach:** Standard queue ($0.0006/request, ~5 min turnaround) for scheduled scans. Live mode ($0.002/request, ~6 sec) for on-demand sales presentation generation. Pay-as-you-go with $50 minimum deposit (balance never expires).
- **Caching:** Same 14-day client / 30-day competitor TTL. Keyword lists are stable — same 100 keywords tracked month over month unless strategy changes.

### NAP Citation Scraper (Custom Build — Directory Health Layer)
- **What it provides:** NAP (Name, Address, Phone) consistency auditing across 35-40 business directories (Yelp, YellowPages, BBB, Foursquare, Apple Maps, Facebook, Bing Places, MapQuest, Hotfrog, Superpages, etc.).
- **Why custom vs. BrightLocal/Whitespark:** Citation auditing is BrightLocal's strongest feature, but it's the only thing keeping BrightLocal relevant once DataForSEO handles rank tracking. Building our own means zero ongoing SaaS cost, full control over directory list, and direct integration with the task system (mismatches auto-generate correction tasks).
- **Architecture:**
  - Canonical NAP record per client (from `ClientProfile` — already in DB)
  - `DirectoryRegistry` — JSON config of ~35 directories with search URL patterns and scraping selectors
  - `DirectoryAdapter` — modular per-directory scraper. Each adapter extracts listed NAP and validates against canonical.
  - Fuzzy matching for NAP comparison ("123 Main St" = "123 Main Street" = "123 Main St.")
  - `DirectoryHealth` table — tracks adapter status: last success, last failure, consecutive failures, degraded flag
  - Health sentry: weekly adapter health checks (faster cadence than actual scans). Adapter hits 2+ consecutive failures → auto-excluded from scores + admin notification via Resend + dashboard alert in bug report system.
  - Scan cadence: quarterly full scans per client (citation data changes slowly). On-demand scan on new client onboarding.
- **Output:** Citation health score per client, directory-level match/mismatch/missing status, auto-generated correction tasks for mismatches.
- **Maintenance:** Directory sites redesign ~1-2x/year each. With 35 adapters, expect 3-5 selector fixes per quarter. Modular adapters mean one breaking doesn't affect the other 34.
- **Cost:** $0. Custom infrastructure on existing stack.

### Claude API (AI Intelligence Layer)
- **What it provides:** Content brief generation, competitive analysis summaries, report narratives
- **Cost:** ~$0.03-0.10 per content brief depending on model and length
- **Usage:** Already integrated via `callAI()` unified client. Model router selects optimal model per task. Cost tracked per-client via `ai_cost_logs` table.

---

## Caching Strategy (Critical for Cost Control)

The scanning engine must be smart about what it re-fetches:

1. **Client domains:** 14-day cache TTL. Scanned biweekly.
2. **Competitor domains:** 30-day cache TTL. Scanned monthly.
3. **Competitor deduplication:** In a local market, the same competitors appear across multiple clients. Scan once, share data. A competitor scanned for Client A doesn't get re-scanned for Client B in the same cycle.
4. **Delta-triggered deep scans:** Lightweight checks (DR, traffic estimate, review count) run every cycle. Full deep scans (keyword gaps, backlink analysis, content audit) only trigger when the lightweight check detects meaningful movement (>5% change in key metrics).
5. **Stale competitor pruning:** Competitors whose metrics haven't moved in 3+ months get flagged for review. Maybe they closed, maybe they're irrelevant. Don't waste credits scanning dead businesses.

This approach means actual API calls grow sublinearly with client count. At 50 clients in the same metro area, you might only have 80 unique competitor domains to scan instead of 150.

---

## Scaling Cost Projections

Based on 2 scan cycles/month, 4 domains per cycle, smart caching, and competitor deduplication within markets.

### 5-10 Clients (~$12K-24K/mo revenue)
| Service | Plan | Monthly Cost |
|---------|------|-------------|
| Ahrefs | Starter ($29/mo) | $29 |
| DataForSEO | Pay-as-you-go (~$0.12/client) | $1-2 |
| Outscraper | Free tier | $0 |
| Google APIs | Free | $0 |
| Claude API | Minimal usage | $2-5 |
| Vercel | Free tier | $0 |
| Neon Postgres | Free tier | $0 |
| Resend | Free tier | $0 |
| **Total** | | **~$32-36/mo** |

### 25 Clients (~$60K/mo revenue)
| Service | Plan | Monthly Cost |
|---------|------|-------------|
| Ahrefs | Starter (with smart caching) | $29 |
| DataForSEO | Pay-as-you-go (~$0.12/client) | $3 |
| Outscraper | Free tier (~200 requests) | $0 |
| Google APIs | Free | $0 |
| Claude API | ~100 briefs | $5-10 |
| Vercel | Free tier | $0 |
| Neon Postgres | Free tier | $0 |
| Resend | Free tier | $0 |
| **Total** | | **~$38-43/mo** |

### 50 Clients (~$120K/mo revenue)
| Service | Plan | Monthly Cost |
|---------|------|-------------|
| Ahrefs | Lite ($129/mo) | $129 |
| DataForSEO | Pay-as-you-go (~$0.12/client) | $6 |
| Outscraper | Minimal paid (~$5) | $5 |
| Google APIs | Free | $0 |
| Claude API | ~200 briefs | $10-15 |
| Vercel | Free or Pro ($20) | $0-20 |
| Neon Postgres | Free or Pro ($19) | $0-19 |
| Resend | Free tier | $0 |
| **Total** | | **~$150-195/mo** |

### 100 Clients (~$240K/mo revenue)
| Service | Plan | Monthly Cost |
|---------|------|-------------|
| Ahrefs | Standard ($249/mo) | $249 |
| DataForSEO | Pay-as-you-go (~$0.12/client) | $12 |
| Outscraper | Paid (~$10) | $10 |
| Google APIs | Free | $0 |
| Claude API | ~400 briefs | $30-50 |
| Vercel | Pro ($20) | $20 |
| Neon Postgres | Pro ($19) | $19 |
| Resend | Pro ($20) if >3K emails | $0-20 |
| **Total** | | **~$340-380/mo** |

### 250 Clients (~$600K/mo revenue) — SaaS Pivot Territory
| Service | Plan | Monthly Cost |
|---------|------|-------------|
| Ahrefs | Standard or Advanced ($249-449) | $249-449 |
| DataForSEO | Pay-as-you-go (~$0.12/client) | $30 |
| Outscraper | Paid (~$6) | $6 |
| Google APIs | Free | $0 |
| Claude API | ~1000 briefs | $80-100 |
| Vercel | Pro ($20) | $20 |
| Neon Postgres | Scale ($69) | $69 |
| Resend | Pro ($20) | $20 |
| **Total** | | **~$475-695/mo** |

### Cost as % of Revenue
| Clients | Revenue/mo | Stack Cost/mo | % of Revenue |
|---------|-----------|---------------|-------------|
| 5 | $12,000 | ~$34 | 0.28% |
| 25 | $60,000 | ~$40 | 0.07% |
| 50 | $120,000 | ~$170 | 0.14% |
| 100 | $240,000 | ~$360 | 0.15% |
| 250 | $600,000 | ~$585 | 0.10% |

*Note: NAP Citation Scraper adds $0 at all tiers — runs on existing infrastructure. BrightLocal ($150/mo) fully eliminated.*

---

## BrightLocal Disposition

BrightLocal ($150/mo currently — Track plan with 100 keywords) becomes fully redundant once:
- **DataForSEO SERP API** → replaces rank tracking (100 keywords from zip code, local pack + organic positions). This is the core BrightLocal workflow at 1/1000th the cost.
- **Ahrefs API** → covers backlink analysis, competitive intelligence, content gaps (deeper than BrightLocal ever offered)
- **Google Business Profile API** → covers GBP audit, review monitoring, local search insights
- **NAP Citation Scraper (custom)** → replaces Citation Tracker (BrightLocal's last unique feature)

**Phase-out plan:**
1. Keep BrightLocal running during DataForSEO integration buildout as validation baseline
2. Once rank tracking data from DataForSEO matches BrightLocal output for 2+ scan cycles, cancel
3. NAP scraper can be built in parallel or after — citation data changes slowly, so quarterly manual checks bridge the gap
4. Target: BrightLocal fully eliminated within 60 days of DataForSEO integration going live

**Savings:** $150/mo immediate ($1,800/yr). At scale with multiple locations, savings compound significantly.

---

## Integration Build Priority

1. **Ahrefs API** — Highest value. Feeds competitive scan engine, generates work orders, powers sales scorecards. Wire into existing enrichment layer at `src/lib/enrichment/ahrefs.ts`.
2. **DataForSEO SERP API** — Core rank tracking. 100 keywords per client from zip code, local pack + organic positions, rank cluster data. This is the sales leverage engine. Wire into `src/lib/enrichment/dataforseo.ts`. Immediately eliminates BrightLocal ($150/mo).
3. **Google Business Profile API** — Local presence monitoring, review management, listing updates. Requires Google API access application (agency approval).
4. **GoDaddy API** — Connects to Website Studio. Domain provisioning, DNS, deployments.
5. **Wave API** — Connects to commission engine. Real invoicing, payment tracking.
6. **Google Ads API** — Read-only campaign data. Feeds analytics and reports.
7. **NAP Citation Scraper** — Custom build. Directory adapter architecture with health sentry. Lower priority because citation data changes slowly and BrightLocal can bridge until built.

---

## Client Report Upgrade Roadmap

Existing report system (`src/lib/reports/generator.ts` + `template.ts`) already generates branded HTML/PDF reports with health score trends, completed tasks, wins, and gaps. This is stronger than BrightLocal's reports because it connects data to work performed. Upgrade path adds data sections as each integration comes online:

### Phase 1: Rank Tracking Table (after DataForSEO integration)
- Keyword rank grid: each keyword → current local pack position, organic position, change from last period, which competitor holds #1
- Rank cluster visualization: keyword groupings showing where client dominates vs. competitor territory
- This is the primary client-facing deliverable — the data that justifies $2,400/mo

### Phase 2: GBP Performance Snapshot (after GBP API integration)
- Profile views, search impressions, calls, direction requests, month-over-month trends
- Review summary: total reviews, average rating, new reviews this month, sentiment highlights
- Replaces BrightLocal's GBP audit section with richer, more actionable data

### Phase 3: Citation Health Score (after NAP Scraper build)
- NAP consistency percentage across 35+ directories
- Directory-level status: match/mismatch/missing breakdown
- Auto-linked to correction tasks that were created and completed

### Phase 4: Site Performance (after PageSpeed integration)
- Core Web Vitals scores, performance/accessibility/SEO audit
- Month-over-month performance trend
- Technical tasks completed in response to score changes

### Phase 5: PPC Performance Summary (after Google Ads API integration)
- Campaign spend, CTR, conversion data, top performing keywords
- Negative keyword additions made, budget optimization recommendations

### Design Advantage Over BrightLocal
BrightLocal reports are just data dumps — they show metrics but don't connect them to action. GHM reports show the data AND the work orders generated AND the tasks completed in response. The narrative is: "Here's what changed in your competitive landscape, here's what we did about it, here's where you stand now." No third-party reporting tool tells that story because none of them know what work was actually performed.

---

## File Index Reference

This document is referenced in `STATUS.md` under **Specs (still valid)**.

Related files:
- `BUILD_PLAN.md` — Master build plan (architecture decisions)
- `COMMISSION_SYSTEM_SPEC.md` — Commission structure that Wave API will feed
- `QUICK_REFERENCE.md` — API keys, env vars, deployment info
- `src/lib/enrichment/` — Current enrichment implementation (Outscraper, Ahrefs, PageSpeed)
- `D:\Work\SEO-Services\specs\API_INTEGRATION_BLUEPRINT.md` — Full build blueprint with schema, wireframes, 56-hour task breakdown
- `D:\Work\SEO-Services\specs\WAVE_PAYMENTS_BLUEPRINT.md` — Wave payments integration blueprint
