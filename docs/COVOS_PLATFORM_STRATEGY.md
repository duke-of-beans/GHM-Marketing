# COVOS Platform Strategy
**Last Updated:** March 2, 2026
**Status:** ACTIVE — SEO vertical in progress. GHM → pure tenant migration underway.
**Owner:** David Kirsch

---

## What COVOS Is

COVOS is a lightweight, vertically specialized ERP platform targeting $1M–20M revenue businesses with 10–100 employees. It replaces 6–25 standalone SaaS subscriptions with a single, industry-configured system — delivered in weeks, not months, at a fraction of traditional ERP cost.

**The core verb is CANCEL.** Every onboarding includes a literal cancellation checklist — subscriptions the client terminates because COVOS handles those functions natively. Hard-dollar savings from month one.

COVOS earns revenue through two streams:
- One-time build fee: $10K–$50K (industry discovery, data migration, deployment)
- Flat monthly platform fee: $500–$2,000/month by company size, never per-seat

---

## Architecture Model — Settled Decisions

### Multi-Tenancy: Single Codebase, Data Isolation
COVOS uses a **single codebase** with per-tenant data isolation via separate Neon databases. This is the permanent architectural choice — not white-label (separate deployments), not monolith (shared DB).

**Domain schema:** `covos.app` is the platform. Tenants live at `{slug}.covos.app`. GHM is `ghm.covos.app`. Future tenants follow the same pattern.

**Why not white-label:** White-label means code forks, version drift, and losing the ability to ship one commit that fixes everyone. Module toggles in TenantConfig serve as the commercial lever instead — tenants buy capabilities, not deployments.

### Meta-DB Architecture (Option A — SELECTED)
One central COVOS-owned Neon meta-database stores the tenant registry. Each tenant record contains their slug, subdomain, config JSON, and a pointer to their own isolated database URL. `getTenant()` queries the meta-DB, resolves the tenant, and connects to their isolated DB for all operational data.

**Resilience:** Meta-DB runs with a Neon read replica in a second region. Combined with a 5–10 minute in-memory cache on `getTenant()`, the meta-DB is effectively bulletproof — a brief outage doesn't affect active sessions.

**Security:** Tenant DB connection strings are encrypted at rest (Neon default + application-level encryption on `databaseUrl` field before storage).

**Scaling:** Adding a new tenant is a DB insert. No code deploys, no env var changes.

### COVOS Vault — Compliance Tier (Future Add-On)
For tenants in regulated industries (healthcare/HIPAA, government, defense, financial services), COVOS will offer a premium **COVOS Vault** tier. Credentials live in AWS Secrets Manager or Azure Key Vault instead of the meta-DB. Field-level encryption. Comprehensive audit logging. HIPAA, FedRAMP-lite, SOC 2 checkboxes.

**Architecture:** `TenantConfig.securityTier: "standard" | "vault"`. `getTenant()` uses the appropriate credential resolver based on tier. Standard and Vault tenants coexist on the same platform — no fork required.

**Pricing:** ~$500–$1,000/month premium on top of platform tier.

**Status:** FUTURE — build when first regulated client needs it. Architecture is noted so it doesn't get designed around.

### ARCH-002 — CLOSED AS REJECTED
Repo/service/DB separation was explored in Sprint ARCH. **Decision:** Single repo, single codebase, data isolation via per-tenant DB URLs. This decision is final. The rationale: COVOS is true multi-tenant SaaS, not white-label. Module toggles replace per-deployment customization. No separation needed.

---

## Vertical Sequencing

### Current: SEO/Digital Marketing Agency Vertical
**Status:** Feature-complete. GHM dashboard IS the first vertical template. Sprint 28/29 completed the tenant extraction. Remaining work: infrastructure inversion (GHM becomes a clean tenant on COVOS infrastructure, not the other way around).

**Done means:** COVOS doesn't know it's GHM anymore. GHM is just a tenant. The platform has no default-to-GHM fallback. All infrastructure is COVOS-owned with GHM as a configured tenant within it.

### Second Vertical: Affiliate/Domain Companies
**Status:** NOT STARTED. Will begin after SEO vertical is fully done (infrastructure inversion complete).

### Third Vertical: First Inbound Client
**Status:** Opportunistic. Whatever client we land first shapes the third vertical template.

**Flywheel rule:** No vertical #2 or #3 work until vertical #1 (SEO) is declared done.

---

## Phase 1 Core Modules (Horizontal Foundation)

These 10 modules collectively kill the most subscriptions across the most verticals. Every COVOS deployment shares them regardless of industry.

| # | Module | Replaces | Status |
|---|--------|----------|--------|
| 1 | CRM / Pipeline | HubSpot, Pipedrive | ✅ Built |
| 2 | Project Management | Asana, Monday, ClickUp | ✅ Built |
| 3 | Time Tracking | Toggl, Harvest, Clockify | Partial |
| 4 | Invoicing / Billing | FreshBooks, Wave | ✅ Built (Wave) |
| 5 | Proposals + E-Signatures | PandaDoc, DocuSign | ✅ Built (Sprint 32) |
| 6 | Client Portal | SuiteDash, Copilot | ✅ Built |
| 7 | Help Desk / Ticketing | Freshdesk, Zendesk | ✅ Built (bug system) |
| 8 | Approval Workflows | Kissflow, Process Street | ✅ Built |
| 9 | Document Management | Box, Revver | ✅ Built (Vault) |
| 10 | Reporting / Dashboards | Databox, Geckoboard | ✅ Built |

**Assessment:** Phase 1 is effectively complete for the SEO vertical. The GHM dashboard IS the first vertical template.

---

## The "CANCEL" Checklist — SEO Agency Example

| Tool | Monthly Cost | COVOS Action | Saved |
|------|-------------|--------------|-------|
| HubSpot Sales Pro | $500 | REPLACE | $500 |
| Asana Advanced | $625 | REPLACE | $625 |
| Toggl Track | $250 | REPLACE | $250 |
| FreshBooks Plus | $200 | REPLACE | $200 |
| Proposify | $300 | REPLACE | $300 |
| Notion Team | $200 | REPLACE | $200 |
| Typeform | $75 | REPLACE | $75 |
| Client Portal | $150 | REPLACE | $150 |
| QuickBooks Online | $90 | INTEGRATE (keep) | $0 |
| Gusto Payroll | $300 | INTEGRATE (keep) | $0 |
| **TOTAL SAVED** | | | **$2,300/mo** |

At COVOS Growth tier ($1,000/mo), the agency saves $1,300/month net from day one.

---

## Pricing Architecture

### One-Time Build Fee
| Client Type | Build Fee |
|------------|-----------|
| First-in-vertical (R&D partner) | $0–$5,000 |
| Same vertical, template (clients 2–20) | $10,000–$25,000 |
| Complex / multi-location | $25,000–$50,000 |

### Monthly Platform Fee (Flat, Not Per-Seat)
| Tier | Company Size | Monthly | Annual |
|------|-------------|---------|--------|
| Starter | 1–15 employees | $500/mo | $6,000/yr |
| Growth | 16–50 employees | $1,000/mo | $12,000/yr |
| Scale | 51–100 employees | $2,000/mo | $24,000/yr |
| Enterprise | 100+ employees | Custom | Custom |
| COVOS Vault add-on | Any | +$500–$1,000/mo | — |

---

## Revenue Projections

| Milestone | Clients | Build Revenue | Monthly Recurring | Year 1 Total | Year 2 Recurring |
|-----------|---------|--------------|-------------------|-------------|-----------------|
| Proof of concept | 3 | $30K | $3K/mo | $66K | $36K |
| Early traction | 10 | $150K | $10K/mo | $270K | $120K |
| Product-market fit | 25 | $375K | $25K/mo | $675K | $300K |
| Scaling | 50 | $750K | $50K/mo | $1.35M | $600K |
| Growth | 100 | $1.5M | $100K/mo | $2.7M | $1.2M |

---

## What COVOS Never Replaces

These categories are integrate-only — too compliance-heavy, too specialized, or too network-effect-dependent:

- Full GL Accounting (QuickBooks, Xero, Sage)
- Payroll Processing (Gusto, ADP, Paychex)
- Payment Processing (Stripe, Square, PayPal)
- Banking & Treasury
- Email/Calendar Suite (Google Workspace, M365)
- Video Conferencing (Zoom, Meet)
- Creative Tools (Adobe, Figma, Canva)
- Industry Clinical Systems (Epic, Dentrix, Clio)
- POS Systems (Square, Toast, Lightspeed)
- Tax Calculation Engines (Avalara, TaxJar)

---

## Strategic Moats

1. **Flat pricing** — competitors' per-seat pricing punishes growth. COVOS stays flat within tier. The larger a client grows, the more they save relative to alternatives.
2. **Cancellation checklist as marketing asset** — completed checklists become case study material. "This company cancelled 8 subscriptions" is more compelling than any feature comparison.
3. **Migration tooling** — each API integration built for data migration becomes a permanent reusable asset. First client in a vertical pays; clients 2–20 benefit automatically.
4. **Domain knowledge** — Good Day Farm (cannabis ops), THICCLES (CPG/manufacturing), GHM (SEO agency). Multiple vertical templates partially loaded from lived experience.
5. **Speed-to-value** — 2–4 week deployment vs. 6–18 months for traditional ERP.

---

## Reference Documents

- `D:\Work\Covos_Business_Opportunity_Assessment.docx` — Full market analysis, 82-category module map, vertical rankings, revenue projections
- `D:\Work\SEO-Services\ghm-dashboard\docs\COVOS_INFRASTRUCTURE.md` — Infrastructure inversion plan (to be written)
- `D:\Work\SEO-Services\ghm-dashboard\docs\THIRD_PARTY_MIGRATION.md` — Third-party credential migration checklist (to be written)
- `D:\Work\SEO-Services\ghm-dashboard\BACKLOG.md` — Sprint-level work queue
- `D:\Work\SEO-Services\ghm-dashboard\STATUS.md` — Current platform state
- `D:\Work\SEO-Services\ghm-dashboard\docs\blueprints\TENANT_EXTRACTION_SPRINT.md` — GHM→tenant migration blueprint (to be written)
