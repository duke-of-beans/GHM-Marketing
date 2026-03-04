# SPRINT 38-40 — TRACK H BRIEF
# Task: Seed the Ridgeline Media LLC demo tenant with full realistic data

## Context
Project: D:\Work\SEO-Services\ghm-dashboard
All previous tracks must be complete (models must exist in the DB before seeding).
This script must be idempotent — running it twice produces the same result as running it once.
Use upsert, not create. Model your approach on scripts/seed-tenants.ts.

## Step 1: Read the existing seed script first
Read: scripts/seed-tenants.ts
Copy the same upsert pattern and DB connection approach.

## Step 2: Create scripts/seed-ridgeline.ts

The script seeds data in this order:
1. Ridgeline tenant record
2. 12 Sites
3. AffiliatePrograms per site
4. DisplayAdNetworks per site
5. RevenueEntries (12 months per active site)
6. AcquisitionTargets (6 total)
7. AffiliateContentBriefs (46 total)
8. SiteValuations (2 total)

At the end, log counts: "Seeded: 12 sites, X programs, X networks, X revenue entries, 46 briefs, 6 targets, 2 valuations"
On individual upsert errors: log the error and continue. Do not abort the full script.

---

## TENANT

Upsert the ridgeline tenant in the meta-DB tenants table:
- slug: 'ridgeline'
- displayName: 'Ridgeline Media LLC'
- config.verticalType: 'affiliate_portfolio'
- config.timezone: 'America/Denver'

---

## 12 SITES (upsert on slug)

| slug | domain | niche | status | monthlyRevenueCurrent | monthlyTrafficCurrent | domainAuthority |
|---|---|---|---|---|---|---|
| trailgearreviews | trailgearreviews.com | Outdoor gear | ACTIVE | 4800 | 68000 | 42 |
| peakpackinglist | peakpackinglist.com | Outdoor gear | ACTIVE | 3200 | 41000 | 38 |
| budgetbackpacker | budgetbackpacker.net | Outdoor gear | ACTIVE | 1400 | 22000 | 29 |
| firsttimeinvestor | firsttimeinvestor.io | Personal finance | ACTIVE | 2100 | 18000 | 31 |
| simplesavingsguide | simplesavingsguide.com | Personal finance | ACTIVE | 890 | 12000 | 24 |
| mortgagecalchelp | mortgagecalchelp.net | Personal finance | ACTIVE | 1650 | 15500 | 27 |
| weekendrenovator | weekendrenovator.com | Home improvement | ACTIVE | 640 | 9200 | 21 |
| tiledaddy | tiledaddy.com | Home improvement | DORMANT | 120 | 2100 | 18 |
| drywallpro | drywallpro.net | Home improvement | DORMANT | 0 | 800 | 14 |
| pawsandplans | pawsandplans.com | Pet care | ACTIVE | 1780 | 24000 | 33 |
| seniorpetguide | seniorpetguide.com | Pet care | FOR_SALE | 2400 | 31000 | 36 |
| smalldogworld | smalldogworld.net | Pet care | SOLD | 0 | 0 | 34 |

Set monetizationMix values:
- trailgearreviews, peakpackinglist: 'both' (Mediavine + Amazon)
- budgetbackpacker, firsttimeinvestor, mortgagecalchelp, pawsandplans: 'both' (Ezoic + affiliate)
- weekendrenovator, seniorpetguide: 'both'
- tiledaddy, drywallpro: 'affiliate'
- smalldogworld: 'sold' (set notes: "Sold via Motion Invest, March 2025")

---

## AFFILIATE PROGRAMS

Upsert on [tenantId, siteId, networkName, merchantName].

trailgearreviews:
- Amazon Associates | Amazon | 3% | 24hr cookie | APPROVED | lifetimeEarnings: 18400
- REI Affiliate | ShareASale | 5% | 30d | APPROVED | lifetimeEarnings: 6200
- Backcountry | CJ | 6% | 45d | APPROVED | lifetimeEarnings: 4100
- Patagonia | Impact | 8% | 60d | PENDING | lifetimeEarnings: 0

peakpackinglist:
- Amazon Associates | Amazon | 3% | 24hr | APPROVED | lifetimeEarnings: 9800
- REI Affiliate | ShareASale | 5% | 30d | APPROVED | lifetimeEarnings: 3400

budgetbackpacker:
- Amazon Associates | Amazon | 3% | 24hr | APPROVED | lifetimeEarnings: 4200
- Osprey | Impact | 7% | 45d | APPROVED | lifetimeEarnings: 1100

firsttimeinvestor:
- Personal Capital | Impact | flat $100/lead | APPROVED | lifetimeEarnings: 8400
- Betterment | CJ | flat $25/signup | APPROVED | lifetimeEarnings: 3200
- M1 Finance | Impact | flat $30/signup | PENDING | lifetimeEarnings: 0

simplesavingsguide:
- Betterment | CJ | flat $25 | APPROVED | lifetimeEarnings: 1800
- Marcus by Goldman | Impact | flat $50 | APPROVED | lifetimeEarnings: 900

mortgagecalchelp:
- LendingTree | CJ | flat $35/lead | APPROVED | lifetimeEarnings: 5600
- Rocket Mortgage | Impact | flat $40/lead | APPROVED | lifetimeEarnings: 2900

weekendrenovator:
- Amazon Associates | Amazon | 3% | 24hr | APPROVED | lifetimeEarnings: 2800
- Home Depot | Impact | 2% | 24hr | APPROVED | lifetimeEarnings: 800

pawsandplans:
- Chewy | ShareASale | 4% | 15d | APPROVED | lifetimeEarnings: 4200
- Amazon Associates | Amazon | 3% | 24hr | APPROVED | lifetimeEarnings: 2100
- Ollie Pet Food | Impact | 8% | 30d | APPROVED | lifetimeEarnings: 1400

seniorpetguide:
- Chewy | ShareASale | 4% | 15d | APPROVED | lifetimeEarnings: 7800
- Amazon Associates | Amazon | 3% | 24hr | APPROVED | lifetimeEarnings: 3200
- Hill's Pet Nutrition | Impact | 6% | 30d | APPROVED | lifetimeEarnings: 2100

---

## DISPLAY AD NETWORKS

Upsert on [tenantId, siteId, networkName].

trailgearreviews: Mediavine | ACTIVE | monthlySessionsRequired: 50000 | currentMonthlySessions: 68000 | currentRPM: 28.40
peakpackinglist: Mediavine | ACTIVE | monthlySessionsRequired: 50000 | currentMonthlySessions: 41000 | currentRPM: 24.80
budgetbackpacker: Ezoic | ACTIVE | currentMonthlySessions: 22000 | currentRPM: 11.20
firsttimeinvestor: Ezoic | ACTIVE | currentMonthlySessions: 18000 | currentRPM: 14.60
mortgagecalchelp: Ezoic | ACTIVE | currentMonthlySessions: 15500 | currentRPM: 13.80
pawsandplans: Ezoic | ACTIVE | currentMonthlySessions: 24000 | currentRPM: 12.40
weekendrenovator: Mediavine | NOT_QUALIFIED | monthlySessionsRequired: 50000 | currentMonthlySessions: 9200
seniorpetguide: Mediavine | NOT_QUALIFIED | monthlySessionsRequired: 50000 | currentMonthlySessions: 31000

---

## REVENUE ENTRIES (12 months, upsert on unique constraint)

For each month from 12 months ago to 1 month ago, upsert RevenueEntry records.
Compute the month and year values from the current date minus N months.

Revenue curves (month -12 → month -1, interpolate linearly):

trailgearreviews: total $2100 → $4800
  Split: 60% to Mediavine (DISPLAY), 40% to Amazon Associates (AFFILIATE)

peakpackinglist: total $1400 → $3200
  Split: 60% Mediavine (DISPLAY), 40% Amazon Associates (AFFILIATE)

budgetbackpacker: total $600 → $1400
  Split: 40% Ezoic (DISPLAY), 60% Amazon Associates (AFFILIATE)

firsttimeinvestor: total $900 → $2100
  Split: 40% Ezoic (DISPLAY), 40% Personal Capital (AFFILIATE), 20% Betterment (AFFILIATE)

simplesavingsguide: total $400 → $890
  Split: 100% affiliate — 60% Betterment, 40% Marcus

mortgagecalchelp: total $700 → $1650
  Split: 40% Ezoic (DISPLAY), 40% LendingTree (AFFILIATE), 20% Rocket Mortgage (AFFILIATE)

weekendrenovator: total $300 → $640
  Split: 60% Amazon (AFFILIATE), 40% Home Depot (AFFILIATE)

tiledaddy: flat $130 declining slightly to $120 (dormant)
  Split: 100% Amazon (AFFILIATE)

drywallpro: $60 declining to $0 over 12 months (dormant)
  Split: 100% Amazon (AFFILIATE)

pawsandplans: total $700 → $1780
  Split: 40% Ezoic (DISPLAY), 30% Chewy (AFFILIATE), 30% Amazon (AFFILIATE)

seniorpetguide: total $1600 → $2400
  Split: 50% Chewy (AFFILIATE), 30% Amazon (AFFILIATE), 20% Hill's (AFFILIATE)

For each RevenueEntry, also set sessions to a reasonable value proportional to the site's traffic (e.g., trailgearreviews Mediavine entry for a month with $1800 display revenue and 68000 sessions would have rpm ≈ 26.47 — compute accordingly).

---

## ACQUISITION TARGETS (6 total, upsert on [tenantId, domain])

1. hikingbootsexpert.com | stage: RESEARCHING | niche: Outdoor gear | currentMonthlyTraffic: 14000 | currentMonthlyRevenue: 800 | domainAuthority: 28 | source: Expired domain auction
2. campingchecklist.org | stage: DUE_DILIGENCE | niche: Outdoor gear | askingPrice: 28000 | currentMonthlyTraffic: 22000 | currentMonthlyRevenue: 1200 | domainAuthority: 31 | broker: Motion Invest
3. budgetinvesting101.com | stage: NEGOTIATING | niche: Personal finance | askingPrice: 45000 | offeredPrice: 38000 | currentMonthlyTraffic: 19000 | currentMonthlyRevenue: 1600 | domainAuthority: 34 | broker: Empire Flippers
4. homepaintingguide.net | stage: RESEARCHING | niche: Home improvement | domainAuthority: 22 | domainAge: 8 | source: Expired domain — GoDaddy Auctions | dueDiligenceNotes: Aged domain, clean link profile, no content yet
5. puppytrainingfirst.com | stage: DUE_DILIGENCE | niche: Pet care | askingPrice: 15000 | currentMonthlyTraffic: 8000 | currentMonthlyRevenue: 420 | domainAuthority: 26 | broker: Flippa
6. gardeningbasics.net | stage: PASSED | niche: Home improvement | askingPrice: 55000 | currentMonthlyTraffic: 28000 | currentMonthlyRevenue: 1400 | domainAuthority: 38 | decisionNotes: Revenue multiple too high at 39x. Passed.

---

## AFFILIATE CONTENT BRIEFS (46 total, upsert on [tenantId, siteId, targetKeyword])

Distribute across sites proportionally to traffic (higher traffic sites get more briefs).

STATUS DISTRIBUTION:
- 8 briefs: status=PUBLISHED, refreshDue=true (peak position was 1-3, current is 6-12, decayed)
- 14 briefs: status=PUBLISHED, refreshDue=false (healthy, position 1-8, with traffic and revenue data)
- 10 briefs: status=REVIEW
- 8 briefs: status=IN_PROGRESS
- 6 briefs: status=BRIEFED

Keywords to use (assign site by niche):

OUTDOOR GEAR (assign to trailgearreviews, peakpackinglist, budgetbackpacker):
Published+refreshDue:
- "osprey atmos vs stratos" | trailgearreviews | peakPos: 1, currentPos: 9 | traffic: 800 | revenue: 120
- "best trekking pole brands" | peakpackinglist | peakPos: 2, currentPos: 8 | traffic: 600 | revenue: 80
Published+healthy:
- "best trekking poles 2025" | trailgearreviews | pos: 3 | traffic: 2400 | revenue: 380
- "ultralight backpacking gear" | trailgearreviews | pos: 7 | traffic: 1800 | revenue: 290
- "best hiking boots for wide feet" | trailgearreviews | pos: 4 | traffic: 1200 | revenue: 190
- "lightweight sleeping bag comparison" | peakpackinglist | pos: 5 | traffic: 900 | revenue: 140
- "best budget backpacking tent" | budgetbackpacker | pos: 6 | traffic: 700 | revenue: 90
In progress / review / briefed: "how to pack a backpacking pack", "trekking pole height guide", "best trail running shoes 2025", "backpacking food ideas", "osprey aura review"

PERSONAL FINANCE (assign to firsttimeinvestor, simplesavingsguide, mortgagecalchelp):
Published+refreshDue:
- "betterment vs wealthfront" | firsttimeinvestor | peakPos: 2, currentPos: 7 | traffic: 1200 | revenue: 180
- "roth ira income limits 2025" | firsttimeinvestor | peakPos: 3, currentPos: 10 | traffic: 800 | revenue: 110
Published+healthy:
- "how to start investing with $1000" | firsttimeinvestor | pos: 4 | traffic: 2100 | revenue: 320
- "index fund vs etf for beginners" | firsttimeinvestor | pos: 6 | traffic: 1400 | revenue: 210
- "best high yield savings account 2025" | simplesavingsguide | pos: 5 | traffic: 900 | revenue: 130
- "how much house can i afford" | mortgagecalchelp | pos: 3 | traffic: 1600 | revenue: 240
In progress / review / briefed: "401k contribution limits 2025", "what is a brokerage account", "best robo advisors", "mortgage refinance calculator", "how to read a credit report"

HOME IMPROVEMENT (assign to weekendrenovator, tiledaddy):
Published+refreshDue:
- "best tile saw for diy" | tiledaddy | peakPos: 2, currentPos: 11 | traffic: 400 | revenue: 40
Published+healthy:
- "how to tile a bathroom floor" | tiledaddy | pos: 4 | traffic: 1100 | revenue: 90
- "weekend deck build cost" | weekendrenovator | pos: 5 | traffic: 800 | revenue: 70
- "drywall patching guide" | weekendrenovator | pos: 7 | traffic: 600 | revenue: 50
In progress / review / briefed: "ceramic vs porcelain tile", "how to grout tile", "deck stain comparison"

PET CARE (assign to pawsandplans, seniorpetguide):
Published+refreshDue:
- "best dog food for senior dogs" | seniorpetguide | peakPos: 1, currentPos: 6 | traffic: 1800 | revenue: 260
- "senior dog joint supplements" | seniorpetguide | peakPos: 2, currentPos: 8 | traffic: 1100 | revenue: 160
- "how often to walk a 10 year old dog" | seniorpetguide | peakPos: 3, currentPos: 9 | traffic: 700 | revenue: 90
Published+healthy:
- "small dog apartment guide" | pawsandplans | pos: 4 | traffic: 1400 | revenue: 210
- "puppy vs adult food transition" | pawsandplans | pos: 6 | traffic: 900 | revenue: 130
- "best dog food for small breeds" | pawsandplans | pos: 5 | traffic: 1200 | revenue: 180
- "dog supplements for joint health" | seniorpetguide | pos: 3 | traffic: 800 | revenue: 120
In progress / review / briefed: "best dog leash for pulling", "crate training guide", "puppy vaccination schedule", "how to introduce a new dog", "senior dog diet guide"

---

## SITE VALUATIONS (2 total, upsert on [tenantId, siteId] taking most recent)

seniorpetguide:
- monthlyNetProfit: 2000
- multipleUsed: 36
- estimatedValue: 72000
- brokerListingStatus: LISTED
- listedPrice: 82000
- broker: 'Empire Flippers'

smalldogworld:
- monthlyNetProfit: 1900
- multipleUsed: 36
- estimatedValue: 68400
- brokerListingStatus: SOLD
- salePrice: 68000
- saleDate: 8 months before today (compute this from current date)
- broker: 'Motion Invest'

---

## Step 3: Run the script
```
npx tsx scripts/seed-ridgeline.ts
```
Confirm output shows expected counts. Report any individual errors.

## Done
Report: "Track H complete — Ridgeline tenant seeded with 12 sites, X programs, X networks, X revenue entries, 46 briefs, 6 acquisition targets, 2 valuations."
