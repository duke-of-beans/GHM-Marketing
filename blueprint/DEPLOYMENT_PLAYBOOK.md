# GHM Content Studio — Deployment Playbook
**Version:** 1.0  
**Created:** February 18, 2026  
**Purpose:** Step-by-step process to deploy any Content Studio property for any client

---

## Principle: Minimum Client Burden

Every step below is labeled with who does it. GHM steps require no client involvement. Client steps are designed to be copy-paste simple and take under 5 minutes total.

---

## New Client Onboarding

### Step 1 — GHM: Site DNA Capture
1. Open germanautodoctorsimivalley.com (or client URL) in Chrome
2. Run DevTools extraction protocol (see SITE_DNA_EXTRACTION.md)
3. Save output as `clients/[client-slug]/site-dna/[client]-site-dna.json`
4. Verify token file has: colors, fonts, nav HTML, footer HTML, spacing, breakpoints

### Step 2 — GHM: Voice Profile
1. Read at least 10 pages of client's existing site
2. Generate SCRVNR profile: formality, contraction rate, vocabulary, trust signals
3. Save as `clients/[client-slug]/VOICE_PROFILE.md`

### Step 3 — GHM: Brand Matrix
1. List all segments (brands, services, product types — see PRODUCT_BLUEPRINT.md for methodology)
2. For each segment: confirm satellite domain availability, confirm hub subdomain naming
3. Register all satellite domains (GHM pays, GHM owns)
4. Save as `clients/[client-slug]/BRAND_MATRIX.md`

### Step 4 — CLIENT: One DNS Record per Subdomain (5 min total)
Provide client with exact instructions:

> "To get your [Brand] hub page live, add this one record to your DNS settings. Log into [Registrar — Namecheap, GoDaddy, etc.], go to DNS management for [domain.com], and add:
> Type: CNAME
> Host: audi (or bmw, mercedes, etc.)
> Value: cname.vercel-dns.com
> TTL: Auto
> 
> That's it. Takes 30 seconds. Or send us your registrar login and we'll add all of them at once."

**Alternative:** Ask for registrar login, add all CNAME records at once, hand back login. Fastest path for clients who aren't technical.

### Step 5 — GHM: Vercel Project Setup
For each satellite domain:
1. Create new Vercel project
2. Connect to GitHub repo (one repo per brand, or monorepo with path routing)
3. Add custom domain in Vercel dashboard
4. Deploy

For each hub subdomain:
1. Create new Vercel project
2. Connect to appropriate hub extension code
3. Add custom domain: `audi.clientdomain.com`
4. Deploy

---

## Per-Brand Property Build

### Hub Extension Build Order
1. Load site-dna.json tokens into template
2. Generate content using SCRVNR profile + HVE (Human Voice Engine) scoring
3. Run HVE scoring loop until ≥ 78
4. Insert image placeholders with descriptions
5. Source best available stock images (Unsplash/Pexels) matching descriptions
6. Review queue — human eyes on all content
7. Verify: internal links, CTAs routing to main site, mobile responsive
8. Deploy to subdomain

### Satellite Site Build Order
1. Load brand design system (each brand has its own — Audi red/black, BMW blue/white, etc.)
2. Generate all page content using SCRVNR + HVE
3. Score and iterate until ≥ 78 on all pages
4. Source images
5. Review queue
6. Verify: UTM parameters on all CTAs, routing to main site booking, mobile
7. Deploy to owned domain

---

## Domain Naming Conventions

### Satellites
`[brand]specialists[city].com` — e.g. `audispecialistssimivalley.com`  
`[brand]repair[city].com` — alternate if specialists taken  
`[brand]mechanic[city].com` — tertiary option  
`[brand]service[city].com` — quaternary option

Check all four options at registration, pick whichever is available and most keyword-rich.

### Hub Subdomains
`[brand].[clientdomain].com` — e.g. `audi.germanautodoctorsimivalley.com`  
Short, clean, brand-specific. Never use `www2`, `hub`, `content`, etc.

---

## Image Sourcing Protocol

Priority order:
1. **Real client photos** — shop interior, actual technicians, actual vehicles being serviced. Request from client on onboarding. Even phone photos are better than stock if well-composed.
2. **Unsplash/Pexels** — search specifically for brand + context (e.g. "Audi engine bay", "auto repair shop European"). Commercial license. Download originals, don't hotlink.
3. **AI-generated** — for technical close-ups (engine components, specific part details) where stock is inadequate. Use Midjourney or Flux. Prompt for photorealistic, specific model context.
4. **OEM press photos** — brand media centers (press.audi.com, bmwgroup.com/en/content/2024/BMW-Group-PressClub) for brand shots. These are licensed for editorial use. Do not claim ownership.

All images: compressed for web (WebP preferred), sized appropriately for each slot, descriptive alt text always.

---

## Monitoring Schedule (Post-Launch)

### Monthly
- Run all pages through Originality.ai AI detection scan
- Check Google Search Console for impressions/clicks on target keywords
- Check uptime (Vercel provides this automatically)
- Update any satellite site content flagged by competitive scan

### Quarterly  
- Full content audit — voice consistency, accuracy, HCU compliance
- Keyword ranking review — are target terms moving?
- Domain renewal check (satellites)
- Site DNA re-capture if client redesigns their site

### Triggered (When Competitive Scan Fires)
- Keyword spike in service area → generate new content brief
- New model year releases → update model-specific pages
- New recall or TSB → add to problem pages

---

**Document status:** Complete  
**Companion documents:** PRODUCT_BLUEPRINT.md, VOICE_ENGINE.md, DASHBOARD_WIREFRAME.md
