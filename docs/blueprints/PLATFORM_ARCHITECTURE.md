# GHM Platform — Architecture Document
**Version:** 1.0
**Date:** February 18, 2026
**Owner:** David Kirsch
**Status:** Canonical — all builds reference this document

---

## What This Platform Is

GHM Platform is a client intelligence and web production system for local SEO agencies. It consists of a core dashboard and two production modules — Content Studio and Website Studio — delivered as a single SaaS product with module access controlled by subscription tier.

The platform does three things no combination of existing tools does together:

1. **Identifies opportunity** — competitive scans generate a product matrix showing exactly what web presence a client is missing and what it's worth
2. **Produces the work** — Content Studio and Website Studio turn that matrix into live, deployed web properties
3. **Owns the infrastructure** — deployed properties live on GHM-controlled Vercel, creating structural lock-in that compounds over time

The intelligence layer feeds the production layer. The production layer creates infrastructure that feeds the intelligence layer with real performance data. The loop is the moat.

---

## The Three Products

### GHM Dashboard
The core platform. Sold standalone. Has enough value without either studio that an agency or solo operator would pay for it as their client intelligence and CRM layer.

**What it includes:**
- Client card management (full profile, contacts, retainer data)
- Competitive scan engine and scan history
- Product matrix generation (what to build and why)
- Domain registry per client
- Task board
- Reports
- Team management with permission controls
- Upsell opportunity tracking

**What it does not include:**
- Content production tools (Content Studio)
- Site build and deployment tools (Website Studio)

---

### Content Studio
First upsell module. Unlocks the content production pipeline within each client card.

**What it adds:**
- SCRVNR voice capture and profile management
- AI detection defense processing with pass/fail gating
- Content brief generation from scan data
- Content queue (draft → review → approved → published)
- Voice profile history and override management

**Dependency:** Requires Dashboard (base).

---

### Website Studio
Second upsell module. Unlocks the full site build and deployment pipeline within each client card.

**What it adds:**
- Visual DNA capture and token management
- Voice DNA capture (SCRVNR profile per web property)
- Three-tier site scaffolding (Extension, Branded Satellite, Pure Satellite)
- Page composer with live preview
- SCRVNR gate enforced at submission (hard block, not advisory)
- Vercel deployment management
- Domain registry integration (deploy status, DNS, SSL)
- Live site monitoring (uptime, last deploy, staleness flag)

**Dependency:** Requires Dashboard (base). Does not require Content Studio, but integrates with it when both are active — SCRVNR profiles and content queue are shared resources.

---

## Subscription Stack

```
GHM Dashboard          ← Base. Client intelligence, scans, matrix, domains.
+ Content Studio       ← Unlocks content pipeline per client.
+ Website Studio       ← Unlocks site build and deployment per client.
```

Feature access is controlled by a permission toggle in account settings. Module tabs are visible but locked for users without access — showing capability without granting it is intentional. The locked state is part of the sales motion.

---

## Design Philosophy

### 1. Automation Proposes. Human Approves.
No automated output — visual DNA tokens, voice profiles, AI detection scores, generated copy, scaffold structures — is treated as final. Every output is a strong first draft with a documented confidence level. Operators accept, override, or recapture. Overrides are first-class citizens with required notes, timestamps, and operator attribution. Override patterns surface as system improvement signals.

### 2. Overrides Are a Log, Not an Escape Hatch
When a human corrects an automated output, that correction is saved with context. The system learns from friction. Repeated overrides on the same token type flag an automation gap. The audit trail is a product feature, not a compliance artifact.

### 3. Locks Protect Human Work
Any token, profile value, or configuration that a human has reviewed and set can be locked. Locked values are not overwritten by future automated recaptures without explicit unlock and confirmation. Manual work is never silently erased.

### 4. Permission Controls Are Universal
Every role-sensitive feature — content approval, site deployment, client data access, module usage — is governed by a permission toggle. The platform is built for teams from day one. Solo operators run with all toggles open. Agencies configure granular access. Permission state is always visible in context, never hidden.

### 5. The Gap Is the Product
The most powerful thing the platform shows an operator is not what exists — it's what's missing. Empty cells in the product matrix and Website Studio grid are not blank space. They are opportunity, quantified and actionable. The UI is designed to make the gap legible, beautiful, and impossible to ignore.

### 6. Lock-In Is Structural, Not Contractual
Infrastructure owned by GHM — Vercel deployments, domain registrations, DNS configurations — creates switching costs that compound over time. This is by design. The more a client's web presence is built on GHM infrastructure, the more continuity they need to preserve. The product sells ease; the architecture ensures retention.

---

## Shared Infrastructure Layer

Both studios draw from a shared set of resources that live at the platform level, not the module level:

**Client DNA** — visual and voice tokens captured per client and per web property brand. Consumed by Website Studio for page rendering and SCRVNR alignment. Consumed by Content Studio for voice-consistent content generation.

**SCRVNR Engine** — AI detection defense and voice alignment processor. Runs as a service called by both studios. Profiles are stored per web property brand (not per client — a client can have multiple brands with different voices).

**Domain Registry** — all domains associated with a client, regardless of tier or studio. The registry is the source of truth for what's live, what's in progress, and what the matrix recommends but hasn't been built yet. DNS status, SSL status, deploy history, and Vercel project mapping all live here.

**Vercel Integration** — a single authenticated Vercel connection manages all deployments across all clients. Projects are namespaced by client and property. Deployment is triggered from Website Studio but the connection is platform-level infrastructure.

**Scan Engine** — competitive scan data feeds the product matrix, which feeds both the content queue (Content Studio) and the site build recommendations (Website Studio). Scan output is platform-level data, not module-specific.

---

## Team and Permissions Model

The platform supports three default role types. All roles are configurable — this is a starting template, not a rigid hierarchy.

**Owner** — full access to all modules, all clients, all settings, billing. Can configure permissions for all other roles.

**Account Manager** — full access to assigned clients. Can run scans, manage tasks, view reports. Module access determined by subscription. Cannot access billing or team settings.

**Producer** — content and build access on assigned clients. Can compose pages, submit for review, manage build queue. Cannot approve and deploy without elevated permission. Cannot access client financials.

Permission toggles exist at the module level (can this user access Content Studio? Website Studio?), the action level (can this user approve content? deploy sites? manage DNS?), and the client level (which clients can this user see?).

Solo operators run as Owner with all toggles open. The permission UI is present but not obtrusive — it doesn't get in the way of single-operator use.

---

## File System Architecture (Target State)

```
D:\Work\GHM-Platform\
├── dashboard\                    ← Next.js app (migrated from ghm-dashboard)
│   ├── src\
│   ├── prisma\
│   ├── docs\
│   │   └── blueprints\           ← All platform blueprint docs live here
│   └── ...
├── content-studio\               ← Migrated from D:\Work\ContentStudio\
│   ├── blueprint\
│   ├── templates\
│   └── clients\                  ← Client work output (symlink or reference to platform clients\)
├── website-studio\               ← New — built from scratch
│   ├── blueprint\
│   ├── templates\
│   │   ├── tier-1-extension\
│   │   ├── tier-2-branded-satellite\
│   │   └── tier-3-pure-satellite\
│   └── clients\
├── shared\                       ← Shared infrastructure, consumed by both studios
│   ├── dna-engine\               ← Visual DNA capture scripts and token schemas
│   ├── scrvnr\                   ← Voice capture, AI detection, alignment engine
│   ├── vercel\                   ← Vercel API integration, project management
│   └── schemas\                  ← Shared data schemas (DNA tokens, voice profiles, etc.)
└── clients\                      ← All client output organized by client slug
    └── german-auto-doctor\
        ├── dna\
        │   ├── visual-dna.json
        │   └── voice-profiles\
        │       ├── gad-main.json
        │       └── quattro-authority.json
        ├── hub-extensions\
        ├── satellites\
        │   ├── branded\
        │   └── pure\
        └── content\
```

---

## Integration Points Between Modules

**Scan → Product Matrix → Both Studios**
A competitive scan produces opportunity data. The product matrix surfaces that data as actionable recommendations. Website Studio reads the matrix to populate the brand/tier grid with opportunity scores per empty cell. Content Studio reads the matrix to generate content briefs.

**DNA Lab → Page Composer**
Visual and voice DNA captured in Website Studio's DNA Lab is consumed directly by the page composer — visual tokens drive the live preview rendering, voice tokens set the SCRVNR profile for that property's copy.

**SCRVNR → Both Studios**
SCRVNR runs as a shared engine. Content Studio calls it for all content pieces. Website Studio calls it as a hard gate before any page can advance to review. Profiles are stored in the shared clients\ directory and referenced by both.

**Domain Registry → Website Studio Deploy**
When a Website Studio deploy completes, the domain registry is updated automatically — deploy timestamp, Vercel project URL, DNS status, SSL status. The registry is the live source of truth; Website Studio writes to it, the dashboard reads from it.

---

## What Makes This a Moat

1. **Site DNA capture** — does not exist as a product anywhere. Competitors offer templates; we offer pixel-perfect replication of what the client already has.

2. **Structural infrastructure ownership** — Vercel deployments, domain registrations, DNS records. The more we build, the harder it is to leave.

3. **Intelligence → production loop** — scan data feeds build recommendations, which create infrastructure, which generates performance data, which improves future scans. The system gets smarter with every client and every build.

4. **SCRVNR as a hard gate** — AI content risk is real and growing. Making AI detection defense mandatory rather than optional is a product differentiator that protects clients in a way competitors don't.

5. **Marginal cost compression** — after the first brand build for a client, every subsequent brand costs a fraction. The matrix model means one client can generate 10+ deployed properties. Revenue scales; cost doesn't.

---

**Document status:** Canonical v1.0
**Next document:** MIGRATION_PLAN.md
