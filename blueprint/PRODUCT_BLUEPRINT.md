# GHM Content Studio — Master Product Blueprint
**Version:** 1.0  
**Created:** February 18, 2026  
**Owner:** David Kirsch / GHM Marketing  
**Status:** Active — Phase 1 in production (GAD)  
**Dashboard Integration:** Designed and pending (see DASHBOARD_WIREFRAME.md)

---

## What This Product Is

Content Studio is GHM's core revenue product and primary moat. It is a managed web publishing platform that creates two types of web properties for local service businesses:

**1. Hub Extensions** — Pages that appear to be part of the client's existing website. Same header, footer, nav, CSS, fonts — pixel-indistinguishable from the original. Hosted by GHM on Vercel, served under the client's domain via subdomain CNAME delegation. Client never touches their WordPress. We own the path, the content, and the infrastructure. Lock-in is structural.

**2. Satellite Sites** — Standalone brand-specific domains we own and manage. A visitor searching "BMW mechanic Simi Valley" lands on a site that looks and breathes BMW — not a generic multi-brand shop. Qualifies the visitor, routes them to the client to book. We own the domains. Client can't fire GHM and keep them.

Together these create a managed network of web properties around a single local business — indistinguishable from their own site, monitored by competitive scan data, and automatically briefed for content refresh. No other agency offers this. Most can't explain what it is.

---

## Why This Works (The Strategic Synthesis)

This product exists because of a fundamental asymmetry in local SEO: **intent is brand-specific, but most local businesses present generically.**

A person searching "Audi DSG service near me" has high purchase intent and a specific car. They don't want to land on a page that says "we service European cars." They want Audi. They want someone who knows what DSG means without explanation. The satellite site gives them that. The hub extension gives the client's existing domain the topical depth to rank for dozens of long-tail brand+service+city queries it currently can't touch.

The hub/spoke architecture is proven SEO methodology. The satellite domain strategy is proven local SEO methodology. Combining them with pixel-perfect site matching, AI-generated but human-verified content, and automated competitive monitoring is what makes this a product rather than a service.

### The Product Matrix Logic (How to Apply This to Any Industry)

The core question for any new client type is: **what are the natural audience segments, and does each segment have a distinct search identity?**

For an auto repair shop — segments are brands. Someone with a Porsche thinks of themselves as a Porsche owner first, a car owner second.

For a dental practice — segments could be procedure type (invisalign, implants, veneers) or patient type (pediatric, geriatric, anxiety patients).

For a law firm — segments are practice areas (personal injury, family law, estate planning) — each with completely different searcher intent and emotional state.

For a restaurant group — segments are cuisine type, occasion type (date night, business lunch, private events), or neighborhood.

**The rule:** if a person would use a different Google search depending on which segment they belong to, that segment deserves its own web presence. Build the matrix by listing every meaningful search identity your client's customers have, then build one satellite and one hub extension set per identity. The more specific, the higher the conversion rate.

**The value of this thinking belongs in the product itself.** When onboarding a new client type in the dashboard, the system should ask: "What are the distinct ways your customers would search for you?" and use that to generate the initial brand/segment matrix — not just auto-fill from a category template. The synthesis is the product.

---

## The Two Core Technical Capabilities

### 1. Site DNA Capture

The process of extracting a client's exact visual identity from their live website so hub extensions are indistinguishable from their original pages.

**What it captures:**
- Every computed CSS property on: nav, hero sections, content areas, cards, buttons, CTAs, footer, forms
- Font CDN links (exact URLs, not font name guesses)
- Exact hex color values (read from rendered pixels, not stylesheet — stylesheets can reference variables)
- Spacing, padding, margin values at each breakpoint
- Animation/transition timing
- The actual DOM structure of header and footer (copied verbatim so our pages include the real nav)
- Image dimensions and aspect ratios for hero areas
- Any custom JS behaviors (sticky nav, scroll effects, mobile menu)

**Output:** `site-dna.json` — a structured token file that any hub extension page imports. Change the client, swap the DNA file. Every hub page for every brand derives from one source of truth.

**This is a GHM capability, not a one-time task.** When built into the dashboard, "Capture Site DNA" is a button. Point it at any URL, run the extraction, get the token file. It works for any client. It is the CSS equivalent of SCRVNR (voice capture).

**Current status:** Manual DevTools extraction process documented. Automation is a future dashboard build item.

### 2. Human Voice Engine (SCRVNR + AI Detection Defense)

Content generation that passes as human-written across every detection vector currently in use. This is non-negotiable. Getting flagged as AI content by Google or third-party detection tools damages client SEO, damages GHM's reputation, and creates remediation work at scale.

**See VOICE_ENGINE.md for full specification.**

---

## Hosting & Deployment Architecture

### Design Principle: Maximum Turnkey, Minimum Client Burden

Collecting technical access from clients is friction. Friction kills deals and strains relationships. Every deployment decision optimizes for "what can we do without needing anything from them?"

### Satellite Sites
- GHM registers and owns the domain (`bmwspecialistssimivalley.com`)
- Deployed to Vercel — one project per domain
- Client provides: nothing. Zero. We build it, host it, manage it.
- Client sees: a satellite site driving them calls and bookings
- Lock-in: we own the domain and the content

### Hub Extensions
- Deployed to Vercel under a subdomain: `audi.germanautodoctorsimivalley.com`
- Requires one DNS record from the client: a CNAME pointing `audi` to our Vercel deployment
- We provide them the exact record to add (copy-paste, 30 seconds in their registrar)
- Alternatively: we ask for registrar login once, add it ourselves, hand back access
- **Do not use path-level reverse proxy until relationship is established.** Subdomains first — they require no WordPress access, no server config, no risk to their existing site.
- Long-term option: once trusted, switch to path-level via Vercel rewrite so URLs become `germanautodoctorsimivalley.com/audi/` — fully transparent, requires one DNS change at root level

### The "One DNS Record" Pitch
When presenting to clients: "We need you to add one line to your DNS settings — like a 30-second task. Or just give us your registrar login for 5 minutes and we'll do it for you. After that, you never touch it again." This framing turns a technical ask into a trivial one. Most clients will give you the login.

---

## Content Generation Workflow

For each page:

1. **Segment brief:** What brand/topic/service is this page about? What is the searcher's intent? What stage of the buyer journey are they on?
2. **Keyword targeting:** Primary keyword + 5-10 long-tail variations. Local modifier always included.
3. **SCRVNR pass:** Generate using client's voice profile. See voice profile for formality level, contraction rate, technical depth, trust signal patterns.
4. **AI Detection Defense pass:** Run through the human voice scoring system (see VOICE_ENGINE.md). Flag and rewrite any flagged sections. Re-score. Must pass before publication.
5. **Internal linking:** Minimum 8 contextual links per page. Hub → spokes, spokes → hub, cross-links between related pages. All anchor text descriptive.
6. **Image placement:** Mark image slots with dimensions and subject description. Replace with real photos when available. Interim: best available stock from Unsplash/Pexels with strong commercial license. AI-generated imagery is acceptable for specific technical shots where stock is inadequate.
7. **Review queue:** All content goes to review before publishing. Reviewer checks voice, accuracy, links, image quality.
8. **Publish + monitoring:** Page goes live. Competitive scan data feeds refresh alerts when search volume on the page's keywords moves significantly.

---

## AI Detection Defense (Overview)

Full specification in VOICE_ENGINE.md. Summary of the threat model:

**What detection tools measure:**
- **Perplexity:** How predictable is each word choice? AI favors high-probability next tokens. Humans are more surprising.
- **Burstiness:** Variance in sentence length. Humans write short punchy sentences then long complex ones. AI is rhythmically consistent.
- **Phrase fingerprinting:** Known AI-ism phrases that appear at statistically elevated rates in LLM output.
- **Structural tells:** Over-use of parallel list structures, perfect transitions, hedging qualifiers, generic examples.
- **Specificity deficit:** AI avoids commitment. Real experts say specific things. "We see this in about 60% of B8 generation A4s with over 80,000 miles" vs "this is a common issue."

**Our defense is not to avoid AI generation — it's to make the output indistinguishable from what an expert human would write.** The post-processing pass is where this happens. It is recursive, scored, and gated. Content doesn't ship until it passes.

---

## Phase 1 Client: German Auto Doctor (GAD)

**Business:** German Auto Doctor, Simi Valley CA  
**Contact:** Gavin (via GHM)  
**URL:** germanautodoctorsimivalley.com  
**Phone:** (805) 624-7576  
**Address:** 521 East Los Angeles Avenue E & F, Simi Valley, CA 93065  
**Hours:** M–F 7am–4pm PST

**Brands serviced (confirmed):**
- Audi *(hub + satellite — Phase 1, in production)*
- BMW *(hub + satellite — Phase 1, in production)*
- Mercedes-Benz *(hub + satellite — Phase 1, in production)*
- Porsche *(hub + satellite — Phase 1, in production)*
- Volkswagen *(hub + satellite — Phase 1, in production)*
- MINI *(Phase 2)*
- Land Rover *(Phase 2)*
- Rolls Royce *(Phase 2)*
- Bentley *(Phase 2)*
- Aston Martin *(Phase 2)*
- Maserati *(Phase 2)*

**Site DNA status:** Extraction in progress (see site-dna/ directory)  
**Voice profile:** See clients/german-auto-doctor/VOICE_PROFILE.md  
**Brand matrix:** See clients/german-auto-doctor/BRAND_MATRIX.md

---

## File Structure

```
D:\Work\ContentStudio\
├── blueprint\
│   ├── PRODUCT_BLUEPRINT.md        ← This file
│   ├── VOICE_ENGINE.md             ← AI detection defense + SCRVNR spec
│   ├── DASHBOARD_WIREFRAME.md      ← Future GHM dashboard integration spec
│   └── DEPLOYMENT_PLAYBOOK.md      ← Step-by-step deploy for any client
├── templates\
│   ├── hub-extension\              ← Master hub page template (derives from site-dna)
│   └── satellite\                  ← Master satellite template (derives from brand-design)
└── clients\
    └── german-auto-doctor\
        ├── site-dna\
        │   └── gad-site-dna.json   ← Computed CSS token file (from DevTools extraction)
        ├── hub-extensions\
        │   ├── audi\
        │   ├── bmw\
        │   ├── mercedes\
        │   ├── porsche\
        │   └── volkswagen\
        ├── satellites\
        │   ├── audi\               ← audispecialistssimivalley.com
        │   ├── bmw\                ← bmwspecialistssimivalley.com
        │   ├── mercedes\           ← mercedesspecialistssimivalley.com
        │   ├── porsche\            ← porschespecialistssimivalley.com
        │   └── volkswagen\         ← vwspecialistssimivalley.com
        ├── VOICE_PROFILE.md
        └── BRAND_MATRIX.md
```

---

## Dashboard Integration Vision (Future State)

When Content Studio is integrated into the GHM dashboard, a client profile gains:

**Site DNA tab:** Capture button, last capture date, token file viewer, re-capture on site redesign.

**Hub Extensions tab:** List of all live extension pages per brand. Status (live/draft/needs refresh). Last published date. Traffic from GSC (if connected). "Generate new page" button → fires content workflow → review queue → publish.

**Satellites tab:** Same as hub extensions but for standalone domains. Domain expiry dates. Uptime status. Traffic.

**Content queue:** All content in draft/review/approved/published states across all properties. Reviewer workflow. AI detection score shown per piece.

**Competitive triggers:** When scan data shows a brand keyword spiking in the client's service area, auto-generate a content brief and surface it in the queue. Reviewer one-clicks to generate, reviews, publishes.

**Brand matrix generator:** On new client onboarding, prompt: "What are the distinct ways your customers would search for you?" System suggests a matrix. Operator approves. System scaffolds the full property structure — all satellite domains registered, all hub extension subdirectory stubs created, all voice profiles initialized.

---

## What Makes This a Moat

Nobody else is selling this because:
1. The Site DNA capture capability doesn't exist as a product anywhere
2. The domain ownership model creates structural lock-in no other agency replicates
3. The competitive scan integration means content stays relevant without manual monitoring
4. The satellite + hub combination attacks both brand-specific and geographic-specific intent simultaneously
5. Building it for 11 brands per client from one template system means marginal cost per additional brand is near zero after the first

The client sees: their SEO working better every month, their phone ringing more.
What's actually happening: GHM owns an expanding network of web infrastructure around that client that becomes more valuable over time and harder to walk away from.

---

**Document status:** Complete for Phase 1 planning  
**Next:** VOICE_ENGINE.md → Site DNA extraction → Build
