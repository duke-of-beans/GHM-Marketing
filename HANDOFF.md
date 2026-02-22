# GAD CONTENT STUDIO — SESSION HANDOFF
**Date:** 2026-02-18  
**Project:** German Auto Doctor — Hub Extension Network  
**Status:** Audi hub COMPLETE. Audi satellite COMPLETE. Ready to build BMW, Mercedes, Porsche, VW hubs.

---

## WHAT THIS PROJECT IS

Content Studio is a productized SEO service. For German Auto Doctor (GAD), we're building an 11-brand web property network — one "hub" page per brand (Audi, BMW, Mercedes, Porsche, VW, MINI, Land Rover, Rolls-Royce, Bentley, Aston Martin, Maserati) plus satellite sites for the top 5 brands.

The hub pages live on GAD's domain as subpages (e.g., `/audi-hub/`) or subdomains. The satellite sites are separate deployed properties (e.g., `audi.germanautodoctorsimivalley.com`).

**Client:** German Auto Doctor, Simi Valley CA  
**Live site:** https://germanautodoctorsimivalley.com  
**Phone:** (805) 624-7576  
**Address:** 521 East Los Angeles Avenue E & F, Simi Valley, California 93065  
**Hours:** Mon–Fri 8:00 AM – 6:00 PM, Sat 9:00 AM – 2:00 PM, Sun Closed

---

## DIRECTORY STRUCTURE

```
D:\Work\ContentStudio\
├── blueprint\
│   ├── PRODUCT_BLUEPRINT.md        (230 lines — full product spec)
│   ├── VOICE_ENGINE.md             (198 lines — tone/copy guidelines)
│   ├── DEPLOYMENT_PLAYBOOK.md      (135 lines)
│   └── DASHBOARD_WIREFRAME.md      (200 lines)
├── templates\
│   └── gad-mirror.css              (430 lines — MASTER STYLESHEET, all hub pages use this)
├── clients\
│   └── german-auto-doctor\
│       ├── site-dna\
│       │   └── gad-site-dna.json   (178 lines — ground truth: colors, fonts, nav, footer, hours, socials)
│       ├── snippets\               ← CRITICAL — shared header/footer for ALL hub pages
│       │   ├── gad-header.html     (43 lines — top bar + red nav + schedule bar)
│       │   └── gad-footer.html     (72 lines — 4-col footer: contact|company|services|hours+social)
│       ├── hub-extensions\
│       │   └── audi\
│       │       └── index.html      (346 lines — COMPLETE, production-quality)
│       └── satellites\
│           └── audi\
│               └── index.html      (INCOMPLETE — started but abandoned, needs full rebuild)
```

---

## SNIPPET ARCHITECTURE (CRITICAL — READ THIS)

All hub pages load their header and footer from shared snippet files via JS fetch:

```html
<!-- In each hub page's <body>: -->
<div id="gad-header-mount"></div>

<!-- ... page content ... -->

<div id="gad-footer-mount"></div>

<script>
const SNIPPETS = '../../snippets/';
async function loadSnippet(url, mountId) {
  try {
    const r = await fetch(url);
    document.getElementById(mountId).innerHTML = await r.text();
  } catch(e) { console.warn('Snippet load failed:', url); }
}
loadSnippet(SNIPPETS + 'gad-header.html', 'gad-header-mount');
loadSnippet(SNIPPETS + 'gad-footer.html', 'gad-footer-mount');
</script>
```

**Path math:** All hub pages are at `hub-extensions/[brand]/index.html`. That's 2 levels deep from `clients/german-auto-doctor/`. So `../../snippets/` is correct.

**CSS path:** `../../../../templates/gad-mirror.css` (4 levels up to reach ContentStudio root).

**To update header/footer for ALL pages:** Edit one snippet file. Done.

---

## WHAT'S PIXEL-MATCHED TO THE LIVE SITE

### Header
- Black top bar (77px): address left with `ads-icon.png`, phone right with `cal-icon.png` — real CDN images
- Red main header (105px, sticky): GAD circular logo (130px wide), full 9-item nav with `▾` dropdown indicators
- Nav items: Home | Repair & Service ▾ | Brands ▾ | Reviews | Performance ▾ | Blog | Videos | Contact Us | Schedule Appointment
- Black schedule bar below nav: "SCHEDULE APPOINTMENT"

### Footer
- 4-column grid: Contact | Company | Our Services | Hours + Social
- Col 1: "Call Us Anytime" + phone icon + number, "Visit Our Location" + address icon + address
- Col 2: 6 company nav links
- Col 3: 7 service links (exact URLs)
- Col 4: Hours table (Mon–Fri 8–6, Sat 9–2, Sun Closed) + "Follow us on" + 4 social icons (Yelp, Google, Facebook, YouTube with real URLs)
- Bottom bar: "Copyright © 2025 The German Auto Doctor, All Right Reserved."

### CDN Asset URLs (real GAD images, load from their server)
- Logo: `https://cdn-ilbdbhb.nitrocdn.com/.../new-lgogo.png`
- Phone icon: `https://cdn-ilbdbhb.nitrocdn.com/.../cal-icon.png`
- Address icon: `https://cdn-ilbdbhb.nitrocdn.com/.../ads-icon.png`

---

## HOW TO BUILD THE NEXT HUB (BMW, Mercedes, Porsche, VW)

**Template:** Copy `hub-extensions/audi/index.html` → `hub-extensions/bmw/index.html`

**Things to change per brand:**
1. `<title>` and `<meta name="description">`
2. `<link rel="canonical">` href
3. Breadcrumb: change "Audi" → "BMW"  
4. Hero: eyebrow text, H1, subheadline, hero body copy
5. CTA button text: "Schedule BMW Service"
6. Trust strip (keep same 4 items — they're universal)
7. Stats grid (adjust numbers if brand-specific, otherwise keep)
8. Spoke cards section (brand-specific sub-pages: models, services, known issues)
9. Model coverage section (BMW models: 3 Series, 5 Series, 7 Series, X3, X5, M cars, etc.)
10. FAQ section (BMW-specific questions: N54/N55/B58 engine issues, DSC, iDrive, etc.)
11. CTA section body copy (mention BMW-specific things)

**Things that DON'T change:** Header, footer, CSS path, snippet loader script, trust strip text, nav structure.

### Brand-Specific Content Guides

**BMW:** 3/5/7 Series, X3/X5, M3/M5, MINI (separate). Common issues: N54 HPFP, N55 wastegate rattle, B58 oil consumption, coolant system failures. DSG = ZF 8-speed. Mention: dealer pricing vs independent, BMW-specific scan tools (ISTA).

**Mercedes:** C/E/S Class, GLC/GLE, AMG lines. Common issues: airmatic suspension, 7G-Tronic valve body, M272/M273 balance shaft failure, rust on older models. Mention: XENTRY/DAS diagnostics.

**Porsche:** 911 (996/997/991/992), Cayenne, Macan, Boxster/Cayman. Famous issues: 996/997 IMS bearing, bore scoring on 3.8, coolant tubes on GT2/GT3/Turbo (GAD does coolant line pinning per the blueprint). Mention: PIWIS diagnostics.

**Volkswagen:** Golf/GTI/R, Jetta, Passat, Tiguan, Atlas. Common issues: DSG (DQ250/DQ200), timing chain on 2.0 TSI EA888 Gen 1, carbon buildup on direct injection, DSG mechatronic. VAG-specific: VCDS mentioned in trust strip.

---

## LOCAL DEV SERVER

```bash
cd D:\Work\ContentStudio
python -m http.server 8765
```

Preview URL: `http://localhost:8765/clients/german-auto-doctor/hub-extensions/audi/index.html`

---

## PHASE PLAN

### Phase 1 — Hub Extensions (11 pages)
- [x] Audi — COMPLETE
- [ ] BMW
- [ ] Mercedes  
- [ ] Porsche
- [ ] Volkswagen
- [ ] MINI Cooper
- [ ] Land Rover
- [ ] Rolls-Royce
- [ ] Bentley
- [ ] Aston Martin
- [ ] Maserati

### Phase 1b — Satellite Sites (5 properties)
- [x] audi.germanautodoctorsimivalley.com — COMPLETE
- [ ] bmw.germanautodoctorsimivalley.com
- [ ] mercedes.germanautodoctorsimivalley.com
- [ ] porsche.germanautodoctorsimivalley.com
- [ ] vw.germanautodoctorsimivalley.com

### Phase 2
- [ ] Deploy all to Vercel
- [ ] Provide client DNS CNAME records
- [ ] 6 remaining brand satellites

---

## KNOWN ISSUES / GOTCHAS

1. **Snippet loader requires a running HTTP server** — won't work opened as file:// due to CORS on fetch(). Always use `python -m http.server 8765`.

2. **Site DNA icons are NitroPack CDN** — these are GAD's own CDN-hosted images. They'll load fine in production. In dev they load over the internet (fine).

3. **Nav wraps at narrow viewports** — we added `white-space: nowrap` and reduced padding to 8px to keep all 9 items on one line at 952px. At true mobile widths the hamburger button shows instead.

4. **Audi satellite at `satellites/audi/index.html` is INCOMPLETE** — started but abandoned when we shifted to fixing the hub first. Needs full build from scratch using the satellite design spec (silver/black/white + red, brand-specific positioning).

5. **Footer hours table "6:00 PM" may wrap** — acceptable at narrow viewports, matches live site behavior. The 4th column gets extra width via `1.4fr` in the grid.

---

## NEXT SESSION STARTUP COMMAND

Tell Claude: "Read D:\Work\ContentStudio\HANDOFF.md and then build the Audi satellite site."

Gavin's deliverables are: (1) Audi hub extension — DONE. (2) Audi satellite site — NEXT.

### Audi Satellite Design Brief
- **Location:** `satellites/audi/index.html` (file exists but is incomplete — rebuild from scratch)
- **Deployment:** Standalone property, e.g. `audi.germanautodoctorsimivalley.com`
- **Design language:** Different from the hub. Silver/black/white with red accent. Audi rings visual. Premium specialist positioning — "Simi Valley's dedicated Audi specialists."
- **Snippet paths from satellites/audi/index.html depth (3 levels from clients/german-auto-doctor/):**
  - Snippets: `../../../snippets/`
  - CSS: `../../../../../templates/gad-mirror.css`
- **Shares the same gad-header.html and gad-footer.html snippets** — same loader pattern, just different relative paths
- **Content:** Deeper Audi-only focus than the hub. More model detail, more known issues depth, dedicated landing page feel rather than hub-and-spoke architecture
