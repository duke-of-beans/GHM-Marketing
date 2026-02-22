# GAD Satellite Expansion — Master Build Status
**Project:** German Auto Doctor (GAD) — 7 SEO Satellites
**Client site:** germanautodoctorsimivalley.com
**Location:** D:\Work\ContentStudio\clients\german-auto-doctor\satellites\
**Last updated:** 2026-02-21
**Status:** 5 of 7 satellites COMPLETE and deployed. 2 remaining (Land Rover, European).

---

## Satellite Status Overview

| # | Make | Directory | Domain | Status | Pages | Deployed |
|---|------|-----------|--------|--------|-------|---------|
| 1 | Audi | /audi/ | audirepairspecialistsimivalley.com | ✅ COMPLETE | 31 HTML | Yes |
| 2 | BMW | /bmw/ | bmwrepairspecialistsimivalley.com | ✅ COMPLETE | 31 HTML | Yes |
| 3 | Mercedes | /mercedes/ | mercedesautorepairsimivalley.com | ✅ COMPLETE | 29 HTML | Yes |
| 4 | VW | /vw/ | vwrepairspecialistsimivalley.com | ✅ COMPLETE | 31 HTML | Yes |
| 5 | Porsche | /porsche/ | porscheautospecialistsimivalley.com | ✅ COMPLETE | 31 HTML | Yes |
| 6 | Land Rover | /landrover/ | (TBD) | ❌ NOT STARTED | 1 (homepage stub only) | No |
| 7 | European | /european/ | (TBD) | ❌ NOT STARTED | 1 (homepage stub only) | No |

**Note:** Page counts include all index.html files (root + all sub-pages). Directory listings from filesystem on 2026-02-21.

---

## Architecture — How All Satellites Are Built

### Template Pattern
Every satellite is a pure static HTML site. No framework, no build step, no npm.
- CSS: single `assets/{make}.css` file (all styles inline, no external dependencies beyond Google Fonts)
- Snippets: `snippets/{make}-header.html`, `snippets/{make}-cta.html`, `snippets/{make}-footer.html`
- Snippet injection: vanilla JS `fetch()` at runtime, keyed off a `ROOT` variable pointing to the satellite root
- Deployment: Vercel CLI (`npx vercel deploy --prod`) from the satellite directory
- Each satellite has its own `.vercel/project.json` with Vercel project ID

### ROOT Variable Pattern (Critical)
Pages use a `ROOT` variable to build snippet paths. Depth depends on how far down the directory tree the page is:
- Root page (index.html): `const ROOT='./'`
- One level deep (models/index.html): `const ROOT='../'`
- Two levels deep (models/911/index.html): `const ROOT='../../'`
- CSS href follows same pattern: `href="../../assets/{make}.css"`

### Standard Page Structure (27 sub-pages per satellite)
Each satellite targets 27 sub-pages beyond the homepage:

```
models/
  index.html              — models hub
  {model-1}/index.html   — individual model guide (typically 8–9 models)
  {model-2}/index.html
  ...
common-problems/
  index.html              — problems hub
  {problem-1}/index.html — individual problem page (typically 5–6 problems)
  ...
services/
  index.html              — services hub
  {service-1}/index.html — individual service page (typically 6–7 services)
  ...
guides/
  index.html              — owner resources hub
blog/
  index.html              — blog hub
  {post-1}/index.html    — individual blog post (typically 3–4 posts)
  ...
```

### Design System Per Satellite
Each satellite has its own color palette and CSS variables — all use Syne (headings) + Inter (body) from Google Fonts.

| Satellite | Primary Accent | Background | CSS Prefix |
|-----------|---------------|------------|------------|
| Audi | #BB0A21 (Audi red) | #F5F5F5 | `.a-` |
| BMW | #1C69D4 (BMW blue) | #F4F4F4 | `.b-` |
| Mercedes | #1A1A1A + silver | #F5F5F0 | `.m-` |
| VW | #003D8F (VW blue) | #F4F4F2 | `.vw-` |
| Porsche | #C0392B (Porsche red) | #F4F4F2 | `.p-` |

---

## Completed Satellites — Detailed Page Inventory

### Audi (31 pages) ✅
**Vercel project:** gad-audi-satellite
**Domain:** audirepairspecialistsimivalley.com
**Design:** --a-red: #BB0A21 accent, dark charcoal header

Models: A3, A4, A6, Q5, Q7, RS models (Audi Sport), e-tron
Common Problems: timing chain, DSG shudder, carbon buildup, HPFP, oil consumption
Services: DSG, oil spec, timing chain, carbon cleaning, Haldex, coolant
Blog: S4 B8 vs B9, Q5 buyer's guide, DSG vs S-tronic explainer

### BMW (31 pages) ✅
**Vercel project:** gad-bmw-satellite
**Domain:** bmwrepairspecialistsimivalley.com

Models: 3 Series, 5 Series, X3, X5, M3/M4, 7 Series, i-series
Common Problems: N54/N55 HPFP, valve cover gasket, cooling system, timing chain, oil leaks
Services: oil spec, VANOS, cooling system, spark plugs, DSC/brake
Blog: F30 vs G20 3 Series, X5 E70 buyer's guide, N54 vs N55

### Mercedes (29 pages) ✅
**Vercel project:** gad-mercedes-satellite
**Domain:** mercedesautorepairsimivalley.com

Models: C-Class, E-Class, GLE, GLC, AMG, S-Class
Common Problems: air suspension, 7G-Tronic, balance shaft, fuel pump, coolant
Services: oil spec, transmission, air suspension, spark plugs, brake service
Blog: W204 vs W205, GLE buyer's guide, AMG ownership costs

### VW (31 pages) ✅
**Vercel project:** gad-vw-satellite
**Domain:** vwrepairspecialistsimivalley.com
**Design:** --vw-black: #0C0C0E, --vw-blue: #003D8F

Models: Golf GTI, Jetta, Passat, Tiguan, Atlas, Golf R, Touareg, ID.4
Common Problems: timing chain (EA888), PCV valve, DSG shudder, carbon buildup, HPFP
Services: DSG, oil spec, timing chain, carbon cleaning, Haldex, PCV
Blog: GTI vs Golf R, Tiguan 2nd gen buyer's guide, DSG reliability guide

### Porsche (31 pages) ✅
**Vercel project:** gad-porsche-satellite
**Domain:** porscheautospecialistsimivalley.com
**Design:** --p-red: #C0392B, --p-black: #0C0C0D

Models (9):
- models/index.html — hub
- models/911/ — 996/997/991/992 generation guide, IMS bearing focus, 2009 dividing line
- models/boxster/ — 986/987/981/718, 987.2 as best value
- models/cayman/ — 987c/981c/718c, GT4 appreciation
- models/cayenne/ — 9PA coolant pipes/bore scoring, 958 as sweet spot, 9YA
- models/macan/ — 95B VAG platform, PDK + PTM service, oil consumption
- models/panamera/ — 970 vs 971, coolant pipe shared with 9PA
- models/gt3-gt4-turbo/ — 991.1 GT3 engine recall, GT4 NA 4.0, Turbo S costs
- models/taycan/ — EV service, 12V aux battery, software updates

Common Problems (6):
- common-problems/index.html — hub
- common-problems/ims-bearing/ — M96/M97 bearing, affected models, retrofit vs replacement
- common-problems/bore-scoring/ — 9PA/Panamera V8 Nikasil wear, detection, repair
- common-problems/coolant-pipes/ — 9PA/Panamera plastic pipe failure, replacement cost
- common-problems/pdk-service/ — PDK fluid degradation, service intervals, consequences
- common-problems/macan-oil-consumption/ — EA888 consumption, spec oil importance

Services (7):
- services/index.html — hub
- services/oil-service/ — Porsche-approved spec (0W-40), interval, why spec matters
- services/pdk/ — PDK fluid change procedure, interval (40K), fluid spec
- services/ims-retrofit/ — LN Engineering retrofit, what's included, pricing
- services/coolant/ — coolant flush schedule, 9PA pipe inspection
- services/brakes/ — PCCB service, pad spec, brake fluid biennial flush
- services/spark-plugs/ — flat-six intervals, DFI engine considerations

Guides (1):
- guides/index.html — owner resources hub (pre-purchase checklist, service intervals)

Blog (4):
- blog/index.html — hub
- blog/997-1-vs-997-2-comparison/ — detailed 997.1 vs 997.2 comparison, 2009 dividing line
- blog/cayenne-9pa-958-buyers-guide/ — 9PA vs 958 buyer's decision guide
- blog/ims-bearing-guide/ — comprehensive IMS guide (most detailed technical content)

---

## Remaining Satellites — What Needs Building

### Land Rover (6/7) — NOT STARTED
**Directory:** D:\Work\ContentStudio\clients\german-auto-doctor\satellites\landrover\
**Current state:** index.html homepage stub only (no CSS, no snippets, no sub-pages)
**Domain:** TBD — needs to be determined before deploy

**Planned content themes:**
- Models: Defender, Discovery, Range Rover (L322/L405/L460), Range Rover Sport, Evoque, Velar, Freelander/LR2, LR4
- Known issues: air suspension (all models), ZF 8HP transfer case, oil cooler lines, ACE system, coolant system
- Services: air suspension service, terrain response calibration, oil spec, transfer case, battery drain diagnosis
- Blog: Range Rover L322 buyers guide, Air suspension repair vs aftermarket, Defender reliability guide

**Design direction (suggested):**
- Primary: deep forest green #1A4A2E or British Racing Green #004225
- Accent: gold/cream #C9A84C
- CSS prefix: `.lr-`
- Same Syne + Inter typography

**Critical note:** Land Rover/Range Rover have extremely complex electronics and air suspension — content needs to be authoritative about the cost of air suspension repair ($3K–$8K range) and the tradeoff between OEM and Arnott/KW aftermarket.

### European (7/7) — NOT STARTED
**Directory:** D:\Work\ContentStudio\clients\german-auto-doctor\satellites\european\
**Current state:** index.html homepage stub only
**Domain:** TBD

**Planned content themes:**
This is the catch-all for any European brand not covered by the dedicated satellites. Likely content:
- Volvo service (S60, XC60, XC90 — turbo service, transmission)
- MINI (R56 timing chain, N14 engine, Cooper S)
- Fiat (500 Abarth, gearbox)
- Alfa Romeo (Giulia, Stelvio — 2.0T service)
- Peugeot/Citroën if local demand

**Design direction:** More neutral/universal — could use a simple navy or charcoal with orange accent. CSS prefix: `.eu-`

---

## Deployment Reference

### How to Deploy Any Satellite
```powershell
Set-Location "D:\Work\ContentStudio\clients\german-auto-doctor\satellites\{make}"
npx vercel deploy --prod
```
Vercel project ID and org ID are stored in each satellite's `.vercel/project.json`.

### Vercel Project IDs (for dashboard reference)
- Audi: check .vercel/project.json in /audi/
- BMW: check .vercel/project.json in /bmw/
- Mercedes: check .vercel/project.json in /mercedes/
- VW: check .vercel/project.json in /vw/
- Porsche: prj_nyKJESFv4lk5lmcz00XwqCeT7r1A (gad-porsche-satellite)
- Land Rover: not yet created
- European: not yet created

### Domain Wiring
Each completed satellite has domains wired in Vercel. Domains are managed via the Vercel dashboard or `vercel domains` CLI. The file `wire-all-domains.ps1` in the satellites root contains domain wiring commands.

---

## Build Process — How to Resume a Satellite

When starting a new satellite (Land Rover or European):

1. **Read an existing completed satellite** (Porsche is the most recent and cleanest reference) to get the current template pattern before writing any code
2. **Create directory structure** with PowerShell one-liner (see Porsche session for the command)
3. **Create assets/{make}.css** — adapt from porsche.css, update CSS prefix and color variables
4. **Create snippets/** — header, cta, footer
5. **Build all sub-pages** — models hub → individual models → common-problems hub → individual problems → services hub → individual services → guides → blog hub → individual posts
6. **Verify page count** with `(Get-ChildItem -Recurse -Filter "index.html").Count`
7. **Deploy:** `npx vercel deploy --prod`
8. **Wire domain** in Vercel dashboard

### Content Quality Standard
All content is written at a technical enthusiast level — not generic "bring your car to our shop" copy. Each page should contain:
- Specific part numbers, generation codes, year ranges where relevant
- Concrete cost estimates (parts + labor ranges)
- Failure consequence vs prevention cost framing
- Generation comparison tables where applicable
- Sidebar with quick reference facts + related links

---

## Next Session — Pick Up Here

**Immediate next action:** GHM Dashboard work (switched priorities 2026-02-21)

**When returning to satellites:**
1. Start with Land Rover — build full 27+ page satellite
2. Then European catch-all satellite
3. Both need domain decisions before final deploy

**Reference file for Porsche session transcript:**
- Transcript stored at: /mnt/transcripts/2026-02-21-10-54-24-gad-porsche-satellite-start.txt
- Also see journal.txt in same directory for catalog

---

## File Locations Quick Reference

```
D:\Work\
├── ContentStudio\
│   └── clients\german-auto-doctor\satellites\
│       ├── BUILD_STATUS.md          ← THIS FILE
│       ├── audi\                    ✅ complete
│       ├── bmw\                     ✅ complete
│       ├── mercedes\                ✅ complete
│       ├── vw\                      ✅ complete
│       ├── porsche\                 ✅ complete
│       ├── landrover\               ❌ stub only
│       └── european\                ❌ stub only
└── SEO-Services\
    └── ghm-dashboard\               ← GHM Dashboard (separate git repo → github.com/duke-of-beans/GHM-Marketing)
```
