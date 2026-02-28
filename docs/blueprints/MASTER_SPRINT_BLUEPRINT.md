# GHM DASHBOARD — MASTER PARALLEL EXECUTION BLUEPRINT
**Date:** February 27, 2026  
**Scope:** Sprints 27, 29, ARCH, 31, 32 — all automatable tasks  
**Excluded:** W7 (Kill Gusto — mid-year W-2 constraint), I4 GBP OAuth (external Google review wait)  
**Max parallel instances:** 3  
**Method:** Dependency-first task decomposition → wave scheduling

---

## PHASE 0 — TASK DECOMPOSITION

### Sprint 27 — Bug Triage + Dark Mode Polish

| ID | Task | Files | Depends on |
|----|------|-------|------------|
| 27-A | BUG-030: Fix TeamFeed send button clipped | `src/components/team-feed/TeamFeedSidebar.tsx` | none |
| 27-B | BUG-031: Fix dark mode accent color (yellow → amber) | `src/app/globals.css` | none |
| 27-C | BUG-032: Fix pipeline column headers dark mode backgrounds | `src/app/(dashboard)/leads/client.tsx` or pipeline column component | none |
| 27-D | FEAT-037: Single lead manual entry form | new component + API route | none |

### Sprint 29 — Entity Migration Readiness

| ID | Task | Files | Depends on |
|----|------|-------|------------|
| 29-A | Tenant registry hardening — add `active` guard + slug validation | `src/lib/tenant/config.ts`, `src/lib/tenant/server.ts` | none |
| 29-B | Contract template hooks — brochure + audit pull from TenantConfig | `src/app/(onboarding)/brochure/page.tsx`, `src/lib/audit/template.ts` | 29-A |
| 29-C | Wave reconnect scaffolding — `waveApiKey` field on TenantConfig, settings UI hint | `src/lib/tenant/config.ts`, `src/components/settings/WaveSettingsTab.tsx` | 29-A |
| 29-D | TENANT_PROVISIONING.md — verify checklist reflects current state | `docs/TENANT_PROVISIONING.md` | 29-A, 29-B, 29-C |

### ARCH — Architecture Decision Records

| ID | Task | Files | Depends on |
|----|------|-------|------------|
| ARCH-A | Write ARCH-002: Repo/service/DB separation plan | `docs/blueprints/ARCH_002_REPO_SEPARATION.md` | none |
| ARCH-B | Write ARCH-003: 82-category module mapping + COVOS roadmap | `docs/blueprints/ARCH_003_MODULE_MAP.md` | ARCH-A |

### Sprint 31 — UI-CONST-001 Group 5: Data Display

| ID | Task | Files | Depends on |
|----|------|-------|------------|
| 31-A | Table standards — column widths, sortable headers, row hover, empty states, loading skeletons | `src/components/ui/data-table.tsx` (or equivalent), globals | none |
| 31-B | Metric tile standards — consistent card height, number formatting, delta indicators, loading skeleton | `src/components/ui/metric-card.tsx` or dashboard widget components | none |
| 31-C | Chart color tokens — standardize recharts palette against Signal design tokens | `src/lib/chart-tokens.ts` (new), anywhere recharts color props are hardcoded | none |
| 31-D | Apply table standards to leads page | `src/app/(dashboard)/leads/client.tsx` | 31-A |
| 31-E | Apply table standards to clients page | `src/components/clients/portfolio.tsx` | 31-A |
| 31-F | Apply metric tile standards to manager dashboard | `src/app/(dashboard)/manager/page.tsx` | 31-B |
| 31-G | Apply metric tile standards to analytics page | `src/app/(dashboard)/analytics/page.tsx` | 31-B |
| 31-H | Apply chart tokens to analytics/intelligence charts | `src/components/analytics/intelligence-trends.tsx` | 31-C |

### Sprint 32 — Signing + Tours

| ID | Task | Files | Depends on |
|----|------|-------|------------|
| 32-A | DocuSign: schema — `SignatureEnvelope` model | `prisma/schema.prisma` | none |
| 32-B | DocuSign: API routes — POST/GET/PATCH signatures + webhook | `src/app/api/signatures/` (new) | 32-A |
| 32-C | DocuSign: Vault "Send for Signature" action + dialog | `src/components/vault/vault-file-tile.tsx`, `SendForSignatureDialog.tsx` (new) | 32-B |
| 32-D | DocuSign: Signed doc auto-return to vault via webhook | `src/app/api/webhooks/docusign/route.ts` (new) | 32-B |
| 32-E | DocuSign: Signature history tab on client detail | `src/components/clients/SignaturesTab.tsx` (new) | 32-B |
| 32-F | Tour tips: Leads page Driver.js config | `src/components/tutorials/tours/leads-tour.ts` (new) | none |
| 32-G | Tour tips: Client Detail page config | `src/components/tutorials/tours/client-detail-tour.ts` (new) | none |
| 32-H | Tour tips: Analytics page config | `src/components/tutorials/tours/analytics-tour.ts` (new) | none |
| 32-I | Tour tips: global reset option in settings | `src/components/settings/GeneralSettingsTab.tsx` | 32-F, 32-G, 32-H |

---

## PHASE 1 — DEPENDENCY GRAPH

```
Wave 1 (fully independent — run all 3 instances simultaneously):
  INSTANCE 1: 27-A + 27-B + 27-C + 27-D          (Sprint 27, zero deps)
  INSTANCE 2: 29-A + ARCH-A + 31-A + 31-B + 31-C  (foundations: tenant hardening, arch ADR, UI tokens)
  INSTANCE 3: 32-A + 32-F + 32-G + 32-H           (schema + tour configs, zero deps)

Wave 2 (start after respective Wave 1 instances complete):
  INSTANCE 1: 29-B + 29-C                          (depends on 29-A from W1-I2)
  INSTANCE 2: 31-D + 31-E + 31-F + 31-G + 31-H    (depends on 31-A/B/C from W1-I2)
  INSTANCE 3: 32-B                                  (depends on 32-A from W1-I3)

Wave 3 (start after respective Wave 2 instances complete):
  INSTANCE 1: 29-D                                  (depends on 29-A/B/C)
  INSTANCE 2: ARCH-B                               (depends on ARCH-A)
  INSTANCE 3: 32-C + 32-D + 32-E + 32-I           (depends on 32-B and 32-F/G/H)

Final gate (sequential — after ALL Wave 3 instances have pushed):
  Full TypeScript validation: npx tsc --noEmit
  Docs sync: BACKLOG.md + CHANGELOG.md + STATUS.md
  Commit + push
```

---

## PHASE 2 — EXECUTION PROMPTS

---

### WAVE 1 — INSTANCE 1
**Sprint 27: Bug Triage + FEAT-037**

```
Project: D:\Work\SEO-Services\ghm-dashboard
Task: Sprint 27 — Bug triage batch + single lead entry

CONSTRAINTS (read before touching any file):
- npx tsc --noEmit must pass with exactly 5 pre-existing errors (scripts/basecamp*, scripts/import-wave-history.ts). Zero new errors allowed.
- prisma db push only — never prisma migrate dev
- No mocks, stubs, or TODOs. Every fix is the correct fix.

---

BUG-030: TeamFeed send button clipped off-screen

File: src/components/team-feed/TeamFeedSidebar.tsx (and/or TeamFeed.tsx if compose bar exists there too)

The compose bar icon row (Everyone / emoji / pin / GIF / Ctrl↵ / Send) overflows the panel width, clipping the Send button on the right edge.

Fix: Audit the compose bar flex layout. The toolbar row likely needs:
- `min-w-0` on flex children that can shrink
- `overflow-hidden` on the container, OR
- `flex-wrap` if the icon row is too wide, OR
- `flex-shrink-0` on the Send button itself + ensure parent has `overflow: visible`

Read the current layout carefully before changing. Do not break the icon order or spacing.

---

BUG-031: Dark mode accent color renders as cool yellow instead of warm amber

File: src/app/globals.css

In the `.dark` CSS block, find `--accent` and `--accent-foreground` HSL values. They currently render as a cool/desaturated yellow. Change to match the warm amber-orange from light mode (target: approximately `hsl(38 92% 50%)` for --accent, `hsl(0 0% 100%)` for --accent-foreground in dark mode — but first read the current values and adjust to match the warm amber-500 tone).

Also check: if `--accent` is used in any chart tokens or status tokens in globals.css, ensure those don't regress.

---

BUG-032: Pipeline Kanban column headers look washed out in dark mode

Find the file that renders Kanban column status headers (look in src/app/(dashboard)/leads/client.tsx or src/components/leads/ — search for column background color classes like `bg-purple-50`, `bg-orange-50`, etc.).

Fix: Add `dark:` variants to each column header background. Use darker tinted versions — e.g., `bg-purple-50 dark:bg-purple-950/40`. Same color identity as light mode, but native to the dark navy context. Don't change text colors (already fixed in BUG-016). Apply consistently to all 8 status columns.

---

FEAT-037: Single lead manual entry form

STEP 1 — Create the dialog component
File: src/components/leads/new-lead-dialog.tsx (NEW)

A shadcn Dialog with a form containing:
- Business Name* (text, required)
- Contact Name, Phone, Email, Website (text/email/url)
- Address / City / State (text)
- Territory (select — pull from GET /api/territories)
- Notes (textarea)

On submit: POST to /api/leads. Show toast on success. Close dialog. Trigger leads list revalidation.

STEP 2 — Create/extend the API route
File: src/app/api/leads/route.ts

Check if POST handler exists. If so, ensure it accepts manual entry (no enrichment required — all fields optional except businessName). If not, create it:
- Requires auth (any elevated user or sales rep)
- Creates Lead with status = "new", source = "manual"
- Returns { success: true, data: { id } }

STEP 3 — Wire into leads page
File: src/app/(dashboard)/leads/client.tsx

Add "New Lead" button (top-right near filter controls). Import and render NewLeadDialog.

STEP 4 — TypeScript check
Run: npx tsc --noEmit
Expected: exactly 5 pre-existing errors. Zero new errors.

STEP 5 — Commit
git add -A
git commit -m "fix: BUG-030 teamfeed send button, BUG-031 dark accent color, BUG-032 pipeline dark mode headers, feat: FEAT-037 single lead entry"
git push
```

---

### WAVE 1 — INSTANCE 2
**Sprint 29 foundation + ARCH-A + Sprint 31 UI token foundations**

```
Project: D:\Work\SEO-Services\ghm-dashboard
Task: Tenant registry hardening (29-A) + ARCH-002 ADR (ARCH-A) + UI-CONST data display foundations (31-A/B/C)

CONSTRAINTS:
- npx tsc --noEmit must pass with exactly 5 pre-existing errors. Zero new errors.
- No code changes to tenant runtime behavior unless explicitly specified — hardening only.
- No mocks or placeholders in any implementation file.

---

29-A: Tenant registry hardening

Files: src/lib/tenant/config.ts, src/lib/tenant/server.ts

Read both files in full before making any changes.

In server.ts (getTenant()), ensure these edge cases are handled gracefully — no crash, clean fallback to TENANT_REGISTRY["ghm"]:
1. Unknown subdomain not in TENANT_REGISTRY → console.warn + return ghm tenant
2. Tenant with `active: false` → same fallback
3. localhost / *.vercel.app preview URLs → same fallback
4. Empty host header → same fallback

Hardened logic pattern:
  const host = headers().get("host") ?? "";
  const subdomain = host.split(".")[0].toLowerCase();
  const tenant = TENANT_REGISTRY[subdomain];
  if (!tenant || !tenant.active) {
    console.warn(`[getTenant] Unknown/inactive slug "${subdomain}", falling back to ghm`);
    return TENANT_REGISTRY["ghm"];
  }
  return tenant;

Zero functional change for known active slugs.

---

ARCH-A: Write ARCH-002 — Repo/service/DB separation plan

File: docs/blueprints/ARCH_002_REPO_SEPARATION.md (CREATE NEW)

Write a complete ADR (Architecture Decision Record) on: should COVOS be separated from the GHM repo, or stay as a multi-tenant branch?

Cover:
1. Current state — single repo, GHM as primary tenant, covosdemo as test, one Vercel project, per-tenant Neon DBs
2. Option A — Monorepo (stay): COVOS platform + GHM config in one repo. Pros: no duplication, single pipeline. Cons: GHM logic bleeds into platform, harder to open-source.
3. Option B — Platform fork: new `covos-platform` repo, GHM as downstream consumer. Pros: clean separation, sellable independently. Cons: two repos, sync overhead.
4. Option C — Turborepo monorepo: `packages/platform` + `apps/ghm` + `apps/covos`. Best long-term, most migration effort.
5. Recommendation: clear stance given 1-developer team, 6-month COVOS sellable goal, trigger conditions that would change the recommendation.
6. Migration path: if switching from A→B or A→C in future, exact steps.
7. Status: PROPOSED (requires David sign-off before accepted).

Format: standard ADR. ~400–600 lines.

---

31-A: Table standards — data-table component

File: src/components/ui/data-table.tsx (check if exists; if not, look for any table primitive in src/components/ui/)

Read the current implementation. Establish/enforce:
1. Column widths: `w-[Npx]` or `min-w-[Npx]` on all columns. Standard: ID=40px, status badge=100px, name=200px, date=120px, number=80px, action=40px.
2. Sortable headers: columns with `sortable: true` render `<ArrowUpDown />` that rotates on sort. Use shadcn/tanstack pattern if present.
3. Row hover: `hover:bg-muted/50` on all data rows.
4. Empty state: accept `emptyMessage` prop. Render centered `<p className="text-muted-foreground text-sm">` when `data.length === 0`.
5. Loading skeleton: accept `isLoading` prop. Render 5 skeleton rows with `<Skeleton className="h-4 w-full" />` per cell when true.

If shared DataTable exists, extend it. If tables are ad-hoc, create the shared component.

---

31-B: Metric tile standards

File: src/components/ui/metric-card.tsx (may also be MetricTile, StatCard, KpiCard — search src/components/ui/ and src/components/dashboard/)

Establish/enforce:
1. Height: `min-h-[120px]` on all metric cards.
2. Number formatting: all numeric values use `Intl.NumberFormat`. Currency: `{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }`. Large numbers: abbreviated (1.2K, 3.4M) via shared `formatMetric(value: number): string` utility at `src/lib/format.ts`.
3. Delta indicator: optional `delta?: number` prop. Positive = green `<TrendingUp />`, negative = red `<TrendingDown />`. Show as `+2.3%` / `-1.1%`.
4. Loading skeleton: `isLoading?: boolean` → `<Skeleton className="h-8 w-24" />` in place of value.
5. Label: always below value, `text-muted-foreground text-xs uppercase tracking-wide`.

---

31-C: Chart color tokens

File: src/lib/chart-tokens.ts (CREATE NEW)

Centralize all recharts color values:

```ts
export const CHART_COLORS = {
  primary: "hsl(var(--chart-1))",
  secondary: "hsl(var(--chart-2))",
  tertiary: "hsl(var(--chart-3))",
  quaternary: "hsl(var(--chart-4))",
  quinary: "hsl(var(--chart-5))",
  revenue: "hsl(var(--chart-1))",
  clients: "hsl(var(--chart-2))",
  churn: "hsl(var(--destructive))",
  health: "hsl(var(--chart-3))",
  new: "hsl(var(--chart-4))",
} as const;

export const CHART_GRID_COLOR = "hsl(var(--border))";
export const CHART_AXIS_COLOR = "hsl(var(--muted-foreground))";
export const CHART_TOOLTIP_BG = "hsl(var(--popover))";
export const CHART_TOOLTIP_BORDER = "hsl(var(--border))";
```

Verify `globals.css` has `--chart-1` through `--chart-5` in both `:root` and `.dark`. If missing, add them using Signal palette colors (check TECHNICAL_STANDARDS.md or existing globals.css first).

---

TypeScript check:
Run: npx tsc --noEmit
Expected: exactly 5 pre-existing errors. Zero new errors.

Commit:
git add -A
git commit -m "feat: 29-A tenant hardening, docs: ARCH-002 ADR, feat: 31-A/B/C data display token foundations"
git push
```

---

### WAVE 1 — INSTANCE 3
**Sprint 32: DocuSign schema + Tour tip configs**

```
Project: D:\Work\SEO-Services\ghm-dashboard
Task: Sprint 32 — DocuSign schema (32-A) + Tour tip page configs (32-F/G/H)

CONSTRAINTS:
- npx tsc --noEmit must pass with exactly 5 pre-existing errors. Zero new errors.
- prisma db push only — never prisma migrate dev.
- For tour configs: read src/components/tutorials/ in full before writing any tour config. Match the exact Driver.js pattern used by existing tours.

---

32-A: DocuSign schema

File: prisma/schema.prisma

Read the full schema before making any changes. Then add:

```prisma
model SignatureEnvelope {
  id              Int       @id @default(autoincrement())
  envelopeId      String?   @unique
  documentName    String
  documentUrl     String
  recipientEmail  String
  recipientName   String
  status          String    @default("draft") // draft | sent | viewed | signed | declined | voided
  sentAt          DateTime?
  viewedAt        DateTime?
  completedAt     DateTime?
  vaultFileId     Int?
  clientId        Int?
  createdById     Int
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  vaultFile       VaultFile?  @relation(fields: [vaultFileId], references: [id])
  client          Lead?       @relation(fields: [clientId], references: [id])
  createdBy       User        @relation(fields: [createdById], references: [id])
}
```

Add reverse relations on VaultFile, Lead, and User — match existing relation naming patterns exactly.

Then run: npx prisma db push

---

32-F: Tour config — Leads page

File: src/components/tutorials/tours/leads-tour.ts (CREATE NEW — or match exact location of existing tour configs)

FIRST: Read src/components/tutorials/ in full. Match the exact Driver.js step pattern.

Steps:
1. Pipeline header — "Your lead pipeline" — stages (New → Contacted → Proposal → Won/Lost)
2. Filter bar — "Smart filtering" — saved searches and filter chips
3. Lead card — "Lead intelligence" — health score, close score, enrichment badge
4. "New Lead" button — "Add leads manually" — direct entry (32-A from Instance 1)
5. Bulk actions — "Work at scale" — batch enrichment and CSV import
6. Kanban vs list toggle (if exists) — "Two views"

If data-testid attributes are missing on key elements, add them to the component file and document which file you modified.

---

32-G: Tour config — Client Detail page

File: src/components/tutorials/tours/client-detail-tour.ts (CREATE NEW)

Read existing tour pattern first.

Steps:
1. Client header bar — "Client at a glance" — health score, churn risk badge, last scan date
2. Tab bar — "Full client picture" — what each tab contains
3. Tasks tab — "Track all work" — client task kanban, recurring rules
4. SEO tab — "Rankings and citations" — live rank data, NAP health
5. Reports tab — "Generate reports" — on-demand PDF generation
6. Billing tab — "Wave integration" — invoice history, outstanding balance
7. Audit button — "One-click audit" — generates audit PDF + opens demo

---

32-H: Tour config — Analytics page

File: src/components/tutorials/tours/analytics-tour.ts (CREATE NEW)

Read existing tour pattern first.

Steps:
1. Revenue trend chart — "Revenue trajectory" — MoM and YoY comparison
2. Client count chart — "Portfolio growth" — new vs churned per month
3. Churn risk panel — "Early warning system" — critical/high/medium/low
4. Health sparklines — "Portfolio health at a glance" — trajectory calculation
5. Dashboard usage panel (admin only) — "Platform telemetry" — feature heatmap and DAU

---

TypeScript check:
Run: npx tsc --noEmit
Expected: exactly 5 pre-existing errors. Zero new errors.

Commit:
git add -A
git commit -m "feat: 32-A signature envelope schema, feat: 32-F/G/H tour configs leads/client-detail/analytics"
git push
```

---

### WAVE 2 — INSTANCE 1
**Sprint 29: Contract template hooks + Wave tenant scaffolding**
*(Requires Wave 1 Instance 2 to have completed 29-A — run git pull before starting)*

```
Project: D:\Work\SEO-Services\ghm-dashboard
Task: Sprint 29 — Contract template hooks (29-B) + Wave tenant scaffolding (29-C)

PREREQUISITE: 29-A must be committed. Run git pull before starting.

CONSTRAINTS:
- npx tsc --noEmit must pass with exactly 5 pre-existing errors. Zero new errors.
- No mocks or TODOs. Every change is production-ready.

---

29-B: Contract template hooks

Read in full:
- src/app/(onboarding)/brochure/page.tsx
- src/lib/audit/template.ts

Search both for "GHM", "ghmdigital", "ghmmarketing". If any strings remain that should come from TenantConfig — extract them now. Check that dashboardUrl CTAs pull from `tenant.dashboardUrl` not a hardcoded URL.

Document findings with a comment at the top of each file:
// TENANT-READY: all strings pull from TenantConfig as of Sprint 29-B

---

29-C: Wave reconnect scaffolding

File: src/lib/tenant/config.ts

Add to TenantConfig interface:
```ts
waveBusinessId?: string;
// waveApiKey is read from process.env[`WAVE_API_KEY_${slug.toUpperCase()}`]
// e.g. WAVE_API_KEY_GHM, WAVE_API_KEY_EASTER — never stored in config.ts
```

File: src/lib/wave/client.ts (or wherever Wave GraphQL client is instantiated)

Update Wave client init to accept optional `apiKey` param. If provided, use it. If not, fall back to `process.env.WAVE_API_KEY`. Zero behavioral change for current single-tenant setup.

File: src/components/settings/WaveSettingsTab.tsx

Add informational amber banner for admin users:
"This Wave account is configured for [tenant.companyName]. Each tenant has its own Wave account. To reconfigure, update the WAVE_API_KEY environment variable and redeploy."

Informational only — no functional change to the settings form.

---

TypeScript check:
Run: npx tsc --noEmit
Expected: exactly 5 pre-existing errors. Zero new errors.

Commit:
git add -A
git commit -m "feat: 29-B contract template tenant verification, feat: 29-C wave per-tenant scaffolding"
git push
```

---

### WAVE 2 — INSTANCE 2
**Sprint 31: Apply data display standards to all pages**
*(Requires Wave 1 Instance 2 to have completed 31-A/B/C — run git pull before starting)*

```
Project: D:\Work\SEO-Services\ghm-dashboard
Task: Sprint 31 — Apply data display standards to leads, clients, dashboards, and charts

PREREQUISITE: 31-A, 31-B, 31-C must be committed. Run git pull before starting.

CONSTRAINTS:
- npx tsc --noEmit must pass with exactly 5 pre-existing errors. Zero new errors.
- Visual/structural changes only. Do not touch business logic, column data, or filter behavior.

---

31-D: Apply table standards to leads page

File: src/app/(dashboard)/leads/client.tsx

Apply: column width constraints, `hover:bg-muted/50` row hover, empty state via emptyMessage prop, loading skeleton rows when isLoading.

---

31-E: Apply table standards to clients portfolio

File: src/components/clients/portfolio.tsx

Same as 31-D. Table view only (cards view handled separately).

---

31-F: Apply metric tile standards to manager dashboard

File: src/app/(dashboard)/manager/page.tsx

Apply: min-h-[120px], formatMetric() for all numbers, delta indicators where MoM data exists, loading skeleton. Do not change what data is shown.

---

31-G: Apply metric tile standards to analytics page

File: src/app/(dashboard)/analytics/page.tsx

Same as 31-F.

---

31-H: Apply chart tokens to intelligence charts

File: src/components/analytics/intelligence-trends.tsx

Replace all hardcoded hex color strings in recharts props (stroke="#...", fill="#...") with CHART_COLORS tokens from src/lib/chart-tokens.ts. Apply CHART_GRID_COLOR, CHART_AXIS_COLOR, CHART_TOOLTIP_BG/BORDER to CartesianGrid, XAxis/YAxis, and Tooltip contentStyle.

---

TypeScript check:
Run: npx tsc --noEmit
Expected: exactly 5 pre-existing errors. Zero new errors.

Commit:
git add -A
git commit -m "feat: 31-D/E table standards leads+clients, feat: 31-F/G metric tiles dashboards, feat: 31-H chart tokens applied"
git push
```

---

### WAVE 2 — INSTANCE 3
**Sprint 32: DocuSign API routes**
*(Requires Wave 1 Instance 3 to have completed 32-A — run git pull + npx prisma generate before starting)*

```
Project: D:\Work\SEO-Services\ghm-dashboard
Task: Sprint 32 — DocuSign API routes (32-B)

PREREQUISITE: 32-A (schema + prisma db push) must be committed. Run git pull then npx prisma generate before starting.

CONSTRAINTS:
- npx tsc --noEmit must pass with exactly 5 pre-existing errors. Zero new errors.
- Use withPermission() guard on all routes — look at existing protected routes for the pattern.
- Return structured { success, data?, error? } from all routes.
- If DOCUSIGN_API_KEY or DOCUSIGN_ACCOUNT_ID env vars are unset, return 503 { error: "DocuSign not configured" } — graceful degradation, not a crash.
- DocuSign eSignature REST API. Base URL: https://demo.docusign.net/restapi for sandbox.

---

32-B: DocuSign API routes

CREATE: src/app/api/signatures/route.ts
- GET: list SignatureEnvelopes for current user (or all if admin). Include vaultFile and client relations. Paginated (take=20, skip from query param).
- POST: create envelope + send via DocuSign
  - Body: { documentUrl, documentName, recipientEmail, recipientName, vaultFileId?, clientId? }
  - Create SignatureEnvelope with status="draft"
  - Fetch blob URL, base64 encode, call DocuSign Create Envelope API
  - On success: update with envelopeId + status="sent" + sentAt=now()
  - Return { success: true, data: { id, envelopeId, status } }

CREATE: src/app/api/signatures/[id]/route.ts
- GET: single envelope with full details
- PATCH: manual status update (admin). Body: { status }.

CREATE: src/app/api/webhooks/docusign/route.ts
- POST: DocuSign Connect webhook handler
  - Check DOCUSIGN_WEBHOOK_SECRET if set; log warning if unset but don't block
  - Parse: envelopeId + status (completed/declined/voided)
  - Find SignatureEnvelope by envelopeId, update status + completedAt
  - If completed: download signed PDF from DocuSign → upload to Vercel Blob → create VaultFile in "Signed Contracts" space
  - If signed-doc download is complex, log a TODO comment and still return 200 — do not leave the route broken
  - Always return 200

---

TypeScript check:
Run: npx tsc --noEmit
Expected: exactly 5 pre-existing errors. Zero new errors.

Commit:
git add -A
git commit -m "feat: 32-B docusign API routes - send, status, webhook"
git push
```

---

### WAVE 3 — INSTANCE 1
**Sprint 29: TENANT_PROVISIONING.md verification**
*(Requires 29-A/B/C complete — run git pull before starting)*

```
Project: D:\Work\SEO-Services\ghm-dashboard
Task: Sprint 29 — Update and verify TENANT_PROVISIONING.md (29-D)

PREREQUISITE: 29-A, 29-B, 29-C must be committed. Run git pull first.

File: docs/TENANT_PROVISIONING.md

Read the entire file. Cross-reference against current state and update any stale steps:

1. Step (Create Neon DB) — verify against current schema.prisma
2. Step (TENANT_REGISTRY entry) — cross-reference with current TenantConfig interface; add any new fields from 29-A and 29-C
3. Step (Vercel setup) — confirm it reflects explicit CNAMEs, not wildcard
4. Step (Resend domain) — update to show covos.app is now verified (February 27, 2026)
5. Step (Wave reconnect) — update to reflect per-tenant WAVE_API_KEY_[SLUG] env var pattern from 29-C
6. Add new "Post-provisioning verification checklist" section at bottom: exact URLs to hit after adding a new tenant (debug/tenant endpoint, login page logo, test email send)

Add at the top: "Last verified: February 27, 2026 — reflects Sprint 29 + 30 state."

Commit:
git add docs/TENANT_PROVISIONING.md
git commit -m "docs: 29-D TENANT_PROVISIONING.md updated to sprint 29/30 state"
git push
```

---

### WAVE 3 — INSTANCE 2
**ARCH-B: COVOS module map**
*(Requires ARCH-A complete — run git pull and read ARCH-002 before starting)*

```
Project: D:\Work\SEO-Services\ghm-dashboard
Task: Write ARCH-003 — 82-category COVOS module map and product roadmap

PREREQUISITE: ARCH-002 (ARCH_002_REPO_SEPARATION.md) must be committed. Read it in full before writing this document.

File: docs/blueprints/ARCH_003_MODULE_MAP.md (CREATE NEW)

Mark as DRAFT at the top. ~600–900 lines.

SECTION 1 — What COVOS is today
List every functional module currently built. For each: name, 1-sentence description, status (live/partial/scaffolded), primary files/routes, which tenants use it. Pull from STATUS.md and CHANGELOG.md — do not invent capabilities.

Cover at minimum: Authentication, Multi-tenant, Lead Management, Client Management, Task System, Commission Engine, Reporting, AI Layer, Website Studio, Content Studio, TeamFeed, Document Vault, Analytics, Wave Integration, GBP Integration, Email System, Onboarding, Branding System.

SECTION 2 — The 82-category vision
Full COVOS vertical ERP map. Organize into 8 groups:

Group 1 — Revenue: CRM, pipeline, billing, commissions, quotes, proposals
Group 2 — Operations: tasks, projects, scheduling, time tracking, approvals, SOPs
Group 3 — Marketing: content, SEO, ads, social, email campaigns, landing pages
Group 4 — Intelligence: analytics, reporting, AI insights, competitive, alerts, forecasting
Group 5 — Communications: team feed, client portal, signing, notifications, video calls
Group 6 — HR/People: onboarding, org chart, payroll, performance, hiring, positions
Group 7 — Infrastructure: multi-tenant, auth, storage, integrations, telemetry, API
Group 8 — Customization: branding, voice, themes, workflows, permissions, white-label

For each: specific module name + mark as ✅ Built | 🔧 Partial | 📋 Planned | ⬜ Vision.

SECTION 3 — Build sequence for next 12 months
Prioritized by: unblocks the most other things, highest revenue impact for GHM now, required for first paying COVOS tenant.

SECTION 4 — First paying tenant readiness checklist
Exact gates that must be true before selling COVOS platform access to a non-GHM agency.

Commit:
git add docs/blueprints/ARCH_003_MODULE_MAP.md
git commit -m "docs: ARCH-003 COVOS module map + 12-month product roadmap"
git push
```

---

### WAVE 3 — INSTANCE 3
**Sprint 32: DocuSign UI + Tour system wiring**
*(Requires 32-B + 32-F/G/H complete — run git pull + npx prisma generate before starting)*

```
Project: D:\Work\SEO-Services\ghm-dashboard
Task: Sprint 32 — DocuSign vault UI (32-C/D/E) + tour wiring + reset (32-I)

PREREQUISITE: 32-B (API routes) and 32-F, 32-G, 32-H (tour configs) must all be committed. Run git pull then npx prisma generate before starting.

CONSTRAINTS:
- npx tsc --noEmit must pass with exactly 5 pre-existing errors. Zero new errors.
- Read all existing components before creating new ones — match established patterns exactly.

---

32-C: Vault "Send for Signature" action

File: src/components/vault/vault-file-tile.tsx

Read the current three-dot menu. Add "Send for Signature" item:
- Only for PDF files (check mimeType)
- Only for elevated users or file owner
- Opens SendForSignatureDialog

File: src/components/vault/SendForSignatureDialog.tsx (CREATE NEW)

shadcn Dialog:
- Document name (pre-filled, read-only)
- Recipient Email (required)
- Recipient Name (required)  
- Link to client (optional select — GET /api/clients?active=true&limit=20)
- "Send for Signature" submit button

On submit: POST /api/signatures with documentUrl from vault file. Toast "Envelope sent to [email]". Close dialog.

---

32-D / 32-E are bundled into 32-B's webhook (auto-return) and the SignaturesTab below.

32-E: Signatures tab on client detail

File: src/components/clients/SignaturesTab.tsx (CREATE NEW)

Table of SignatureEnvelopes for this client:
- Columns: Document Name, Recipient, Status badge (draft=gray, sent=blue, viewed=amber, signed=green, declined=red, voided=gray), Sent Date, Completed Date
- Empty state: "No signature requests yet. Send a document for signature from the Document Vault."
- "New Signature Request" button → SendForSignatureDialog pre-linked to this client

File: src/components/clients/ClientDetailPage.tsx (or wherever tabs are defined)

Add "Signatures" tab. Elevated users only. Icon: <PenLine /> from lucide.

---

32-I: Tour system wiring + reset

STEP 1 — Register new tour configs
Read the existing tour registration system (likely in DashboardLayoutClient or a tours registry file). Register:
- /leads → leads-tour (32-F)
- /clients/[id] → client-detail-tour (32-G)
- /analytics → analytics-tour (32-H)

Ensure the "?" tour trigger is visible/wired on each page.

STEP 2 — Tour reset in settings
File: src/components/settings/GeneralSettingsTab.tsx

Add "Reset all page tours" button under "Help & Onboarding" section. On click: clear all `tour_seen_*` localStorage keys (read existing tour system for exact key format). Toast: "Page tours reset. Each tour will replay on your next visit." Client-side only — no API call.

---

TypeScript check:
Run: npx tsc --noEmit
Expected: exactly 5 pre-existing errors. Zero new errors.

Commit:
git add -A
git commit -m "feat: 32-C vault send-for-signature, feat: 32-E signatures tab, feat: 32-I tour wiring + reset"
git push
```

---

### FINAL GATE — Sequential (single instance, after ALL Wave 3 instances have pushed)

```
Project: D:\Work\SEO-Services\ghm-dashboard
Task: Final TypeScript gate + docs sync

Run git pull to get all Wave 3 commits. Verify with: git log --oneline -20

STEP 1 — Full TypeScript validation
Run: npx tsc --noEmit

Expected: exactly 5 pre-existing errors in scripts/basecamp* and scripts/import-wave-history.ts.
If ANY new errors appear — fix them before proceeding. Do not commit with new TypeScript errors.

STEP 2 — Update BACKLOG.md
Remove from BACKLOG (shipped):
- Sprint 27: BUG-030, BUG-031, BUG-032, FEAT-037
- Sprint 29: 29-A through 29-D (entire sprint)
- ARCH: ARCH-A, ARCH-B
- Sprint 31: 31-A through 31-H (entire sprint)
- Sprint 32: 32-A through 32-I (entire sprint)

In the sprint sequence table, mark 27, 29, ARCH, 31, 32 as ~~strikethrough~~ | ✅ SHIPPED.
Update "Last Updated" header.

STEP 3 — Update CHANGELOG.md
Add entries (use actual commit hashes from git log):

Sprint 27 — Bug Triage + FEAT-037 — February 27, 2026
BUG-030 TeamFeed send button clip fixed. BUG-031 dark mode accent corrected to warm amber. BUG-032 pipeline column dark mode backgrounds fixed. FEAT-037 single lead manual entry form added.

Sprint 29 — Entity Migration Readiness — February 27, 2026
29-A getTenant() hardened with fallback for unknown/inactive slugs. 29-B brochure + audit templates verified tenant-ready. 29-C Wave per-tenant env var scaffolding added. 29-D TENANT_PROVISIONING.md updated to sprint 29/30 state.

ARCH — Architecture Decision Records — February 27, 2026
ARCH-002 ADR written: repo/service/DB separation options with recommendation. ARCH-003 written: 82-category COVOS module map + 12-month product roadmap.

Sprint 31 — UI-CONST Group 5: Data Display — February 27, 2026
31-A DataTable standards established (column widths, hover, empty states, skeletons). 31-B MetricCard standards + formatMetric() utility. 31-C Chart token file (chart-tokens.ts). 31-D/E applied to leads and clients tables. 31-F/G applied to manager + analytics dashboards. 31-H recharts hardcoded colors replaced with tokens.

Sprint 32 — Signing + Tours — February 27, 2026
32-A SignatureEnvelope schema + prisma db push. 32-B DocuSign API routes (send, status, webhook). 32-C vault Send for Signature action + dialog. 32-E Signatures tab on client detail. 32-F/G/H tour configs for leads, client detail, analytics. 32-I tour reset in settings.

STEP 4 — Update STATUS.md
Update "Last Updated" header. Add one-paragraph summary of what shipped in this session.

STEP 5 — Commit + push
git add -A
git commit -m "docs: final sync — sprints 27/29/ARCH/31/32 complete"
git push
```

---

## EXECUTION SUMMARY

```
WAVE 1 (all 3 instances simultaneously):
  Instance 1 → Sprint 27: 3 bugs + FEAT-037           ~45 min
  Instance 2 → 29-A + ARCH-A + 31-A/B/C              ~90 min  ← critical path
  Instance 3 → 32-A schema + 32-F/G/H tour configs   ~60 min

WAVE 2 (all 3 instances simultaneously, after Wave 1):
  Instance 1 → 29-B + 29-C                            ~30 min
  Instance 2 → 31-D/E/F/G/H apply standards           ~60 min  ← critical path
  Instance 3 → 32-B API routes                        ~45 min

WAVE 3 (all 3 instances simultaneously, after Wave 2):
  Instance 1 → 29-D provisioning doc                  ~20 min
  Instance 2 → ARCH-B module map                     ~45 min  ← critical path
  Instance 3 → 32-C/D/E/I vault UI + tour wiring     ~60 min  ← critical path

FINAL GATE (sequential, 1 instance, after all Wave 3):
  TypeScript gate + docs sync + commit                ~20 min

Total wall-clock (parallel):  ~4.5 hrs
Total sequential equivalent:  ~9.5 hrs
Parallelization saves:        ~5 hrs
```

---

## OPERATOR NOTES

1. Each prompt is fully self-contained. No instance needs to ask a question to proceed.
2. Wave 2 and Wave 3 prompts begin with "run git pull" — this picks up dependency commits automatically.
3. TypeScript gate is enforced inside every prompt. If an instance gets new errors, it fixes them before committing. No broken code reaches main.
4. The Final Gate instance must only start after all Wave 3 instances have pushed. Verify with `git log --oneline -20` — all 9 Wave prompts should be visible before running the docs sync.
5. DocuSign env vars (DOCUSIGN_API_KEY, DOCUSIGN_ACCOUNT_ID, DOCUSIGN_WEBHOOK_SECRET) are not yet set in production. All routes degrade gracefully when unset. Add env vars in Vercel dashboard when ready to go live.
6. Sprint 30 items (per-tenant logo, debug endpoint, DNS) are already complete and committed — this blueprint picks up at Sprint 27 and forward.
