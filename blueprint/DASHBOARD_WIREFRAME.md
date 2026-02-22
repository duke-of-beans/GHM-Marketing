# GHM Content Studio — Dashboard Integration Wireframe
**Version:** 1.0  
**Created:** February 18, 2026  
**Status:** Vision spec — not yet built  
**Target:** GHM Marketing Dashboard (Next.js, Vercel, Prisma/Neon)

---

## Where It Lives in the Dashboard

Content Studio becomes a top-level nav item in the GHM dashboard, visible to Manager and Admin roles. It sits alongside Client Portfolio, Sales Pipeline, Analytics, etc.

The Content Studio home page is a command center showing all active client web properties across all brands — status, traffic, content freshness, and pending actions in one view.

---

## Database Schema Additions (When Built)

```prisma
model ContentClient {
  id              String   @id @default(cuid())
  clientId        String   @unique // links to existing Client model
  siteDnaJson     Json?    // captured token file
  siteDnaCapturedAt DateTime?
  voiceProfileMd  String?  // SCRVNR profile text
  
  brands          ContentBrand[]
  createdAt       DateTime @default(now())
}

model ContentBrand {
  id              String   @id @default(cuid())
  contentClientId String
  contentClient   ContentClient @relation(fields: [contentClientId], references: [id])
  
  brand           String   // "audi", "bmw", "mercedes", etc.
  phase           String   @default("1") // "1" or "2"
  
  satellite       SatelliteSite?
  hubExtension    HubExtension?
}

model SatelliteSite {
  id              String   @id @default(cuid())
  brandId         String   @unique
  brand           ContentBrand @relation(fields: [brandId], references: [id])
  
  domain          String   // "audispecialistssimivalley.com"
  vercelProjectId String?
  status          String   @default("draft") // draft/live/needs_refresh
  lastDeployedAt  DateTime?
  pages           ContentPage[]
}

model HubExtension {
  id              String   @id @default(cuid())
  brandId         String   @unique
  brand           ContentBrand @relation(fields: [brandId], references: [id])
  
  subdomain       String   // "audi.germanautodoctorsimivalley.com"
  vercelProjectId String?
  status          String   @default("draft")
  lastDeployedAt  DateTime?
  pages           ContentPage[]
}

model ContentPage {
  id              String   @id @default(cuid())
  satelliteId     String?
  hubId           String?
  
  title           String
  slug            String
  pageType        String   // "hub", "model", "service", "problem", "resource"
  targetKeyword   String
  contentMd       String?  // full page content
  hvScore         Int?     // Human Voice Score 0-100
  status          String   @default("draft") // draft/review/approved/live
  
  lastScoredAt    DateTime?
  lastPublishedAt DateTime?
  refreshAlertAt  DateTime? // when competitive scan triggers refresh
}
```

---

## Content Studio UI — Page-by-Page

### /content-studio (Home)

Header: "Content Studio" + "New Client" button

**Active Properties panel** — card grid, one card per client:
- Client name + logo
- X satellites live | Y hub extensions live
- "Needs attention" badge if any property has: low HV score, refresh alert, or is overdue for audit
- Click → goes to client's Content Studio page

**Pending Actions panel** — list:
- Pages in review queue (click → review)
- Refresh alerts from competitive scan (click → generate brief)
- Domain renewals within 60 days

---

### /content-studio/[clientId]

Header: Client name, Site DNA status (last captured date + "Recapture" button)

**Tabs:** Satellites | Hub Extensions | Content Queue | Settings

**Satellites tab:**
- One row per brand
- Columns: Brand | Domain | Pages | Status | Last Deploy | Traffic (if GSC connected)
- "Add brand" button
- Click brand row → brand detail page

**Hub Extensions tab:**
- Same structure as satellites

**Content Queue tab:**
- All pages across all properties in draft/review states
- Filter by property, by status, by brand
- Sortable by HV score (low scores bubble up)
- Reviewer can approve/reject/request changes inline

**Settings tab:**
- Voice profile viewer/editor
- Site DNA token file viewer (JSON)
- DNS record helper (shows all required CNAME records to send to client)
- Brand matrix (add/remove brands, set phase)

---

### /content-studio/[clientId]/brand/[brand]

**Satellite section:**
- Domain, status, Vercel link
- Page list: title, type, keyword, HV score, status, last published
- "Generate new page" button → opens content brief form → generates → adds to queue
- "Deploy" button (if approved pages pending deploy)

**Hub Extension section:**
- Same structure

**Competitive Scan Alerts panel:**
- Feed from the main competitive scan system filtered to this brand's keywords
- "Keyword spike: 'BMW timing chain' +34% last 30 days → [Generate brief]" 

---

## Site DNA Capture (Future Automation)

The "Capture Site DNA" button triggers a headless browser job (Playwright or Puppeteer running in a Vercel Edge Function or a dedicated worker):

1. Open the client's URL
2. Extract computed styles on: `nav`, `header`, `.menu-item`, `h1`, `h2`, `p`, `.btn`, `footer`, `.card` and any other selectors found
3. Extract the full HTML of the `<header>` and `<footer>` elements
4. Extract all external font `<link>` tags
5. Take a screenshot for visual reference
6. Package into `site-dna.json`
7. Store in DB, display preview in UI

Until this is automated, the manual DevTools extraction process is documented in SITE_DNA_EXTRACTION.md.

---

## Human Voice Score Display

Every content page shows its HVE score as a colored badge:
- 90–100: green — "Excellent"
- 78–89: blue — "Pass"
- 60–77: yellow — "Needs work" (can't publish)
- 0–59: red — "Rewrite" (flagged for human review)

Hovering the badge shows the dimension breakdown (Specificity / Burstiness / Phrase Cleanliness / Voice / Structure).

---

## Integration Points with Existing Dashboard

**Competitive Scan → Content Studio**
When a scan fires a keyword alert for a client's service area, it checks if Content Studio has a page targeting that keyword. If yes → mark page as "needs refresh." If no → suggest new page brief.

**Client Profile → Content Studio**
Client profile gets a "Web Properties" section showing satellite/hub summary with quick links.

**Analytics → Content Studio**
If Google Search Console is connected, surface impressions and clicks per content page directly in the page detail view.

**Push Notifications**
Notify Admin when: HV score drops on a published page (re-scan triggered), domain renewal within 30 days, refresh alert fires.

---

**Document status:** Vision complete — ready for sprint planning when dashboard integration begins  
**Estimated build time:** 3–4 weeks for full Content Studio dashboard feature  
**Priority:** After current GHM feature backlog (see FEATURE_ROADMAP.md)
