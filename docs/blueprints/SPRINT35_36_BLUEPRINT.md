# SPRINT 35 + 36 BLUEPRINT — Tenant Identity + Platform Polish
**Created:** March 3, 2026
**Commits target:** 2 Cowork sessions
**Goal:** By the end of Sprint 36, COVOS can be demoed to Vertical 2 prospects without a single GHM fingerprint visible anywhere in the UI, every marketing deliverable is tenant-branded, the platform looks and communicates like a professional product, and the codebase has zero known functional dead-ends.

---

## SPRINT 35 — Tenant Visual Identity + Brand System
**Codename:** "Second Tenant Ready"
**Done criteria:** A second tenant can log in and see their logo, their colors, their voice — not GHM's.

---

### PARALLELIZATION MAP — SPRINT 35

```
PHASE 1 (parallel — all independent)
├── Track A: FEAT-016 — Tenant voice + visual style schema + settings UI
├── Track B: FEAT-018 — Logo swap (navbar + login pull from TenantConfig)
└── Track C: UX-FEAT-003 — Dashboard widget default layouts per role

PHASE 2 (sequential — Track A must complete first)
├── Track D: FEAT-017 — Brochure structural redesign (tenant-variable slots)
└── Track E: FEAT-021 — Brand asset injection into audit PDFs + comp sheet

PHASE 3 (sequential — all prior tracks complete)
└── Track F: TypeScript gate + visual spot check + LEGAL-001 draft
```

---

## SPRINT 35 — PHASE 1 (PARALLEL)

---

### TRACK A — FEAT-016: Tenant Voice + Visual Style Capture

**What:** The settings schema and UI for each tenant to define their identity — voice, tone, colors, logo, fonts. Everything downstream (brochure, audit PDFs, emails, AI prompts) reads from this.

**Schema additions to `GlobalSettings` (already has brand fields — extend, don't duplicate):**

Audit existing `GlobalSettings` model. It already has:
- `companyName`, `companyTagline`, `logoUrl`
- `brandColor`, `brandColorSecondary`, `brandColorAccent`
- `voiceTone`, `voiceKeywords`, `voiceAntiKeywords`, `voiceSampleCopy`, `voiceIndustry`, `voiceAudience`
- `styleFontHeading`, `styleFontBody`, `styleCornerRadius`, `styleDensity`

**Schema is complete. No migration needed.** The fields exist. The gap is in the Settings UI — these fields are either missing from the UI or partially built. This track is primarily a Settings UI completion sprint.

**Settings UI — Branding tab audit:**
- Confirm `brandColor` (primary), `brandColorSecondary`, `brandColorAccent` all have pickers with role labels ("Primary — CTAs", "Secondary — UI elements", "Accent — highlights/badges")
- "Reset to defaults" button per color
- "Not set — using COVOS default" indicator when null

**Settings UI — Voice + Style tab (create if missing):**
Build a "Brand Voice" settings tab with:
- Tone field (text input: "Confident, direct, professional")
- Keywords (tag input — terms to use)
- Anti-keywords (tag input — terms to avoid)
- Sample approved copy (textarea — a paragraph the tenant likes)
- Industry + Audience fields (text inputs)
- Font heading + body (select or text)

**AI prompt injection:** Every AI call in the platform that generates copy (content studio, work orders, audit summaries) must read `tenant.voiceTone`, `tenant.voiceKeywords`, `tenant.voiceAntiKeywords` and inject them into the system prompt. Audit all AI routes:
- `src/app/api/content/` — inject voice
- `src/app/api/work-orders/` — inject voice
- `src/app/api/reports/` — inject voice
- Any `generateText()` or `openai.chat` call — grep and inject

Pattern:
```typescript
const voice = tenant?.voiceTone
  ? `\n\nVoice guidelines: ${tenant.voiceTone}. Use these terms: ${tenant.voiceKeywords}. Avoid: ${tenant.voiceAntiKeywords}.`
  : '';
const systemPrompt = `${basePrompt}${voice}`;
```

---

### TRACK B — FEAT-018: Logo Swap (Navbar + Login)

**What:** Navbar and login screen logos are hardcoded. Pull from `GlobalSettings.logoUrl` with fallback to COVOS default.

**Files to update:**
- `src/components/layout/sidebar.tsx` (or nav component) — replace hardcoded logo with `<TenantLogo />`
- `src/app/(auth)/login/page.tsx` — replace hardcoded logo with `<TenantLogo />`

**Create `src/components/ui/tenant-logo.tsx`:**
```tsx
// Reads logoUrl from tenant GlobalSettings
// Falls back to COVOS wordmark SVG
// Accepts size prop: "sm" | "md" | "lg"
// Never throws — always renders something
```

**Logo upload in Settings:**
- Settings → Branding tab → Logo section
- Upload button → Vercel Blob → saves URL to `GlobalSettings.logoUrl`
- Preview renders immediately
- "Remove logo" clears to null (reverts to COVOS default)
- Max 2MB, PNG/SVG/WEBP only

**BrandThemeInjector** (likely already exists from Sprint 17) — confirm it reads `brandColor`, `brandColorSecondary`, `brandColorAccent` from GlobalSettings and injects CSS custom properties at root. If not, build it here.

---

### TRACK C — UX-FEAT-003: Dashboard Widget Default Layouts per Role

**What:** First-time login for any role shows a thoughtful widget arrangement instead of undefined order.

**Role defaults:**

Admin/Manager layout (priority order):
1. Revenue metrics (top-left wide)
2. Client Health overview (top-right)
3. Team Activity feed (mid-left)
4. Goals tracker (mid-right, if goalsEnabled)
5. Quick Actions panel (bottom)

Sales Rep layout:
1. My Pipeline (top-left)
2. My Book / assigned clients (top-right)
3. Needs Attention (alerts/overdue tasks, mid-left)
4. Sales Tools (audit, brochure, quick entry, mid-right)
5. My Earnings (bottom)

**Implementation:**
- Check `user.dashboardLayout` on first render — if null, inject role default
- After first render, `dashboardLayout` is set (even if unchanged) so defaults never overwrite a customized layout
- One `PATCH /api/users/me/dashboard-layout` call on first mount if layout is null
- Default layout objects defined in `src/lib/dashboard/default-layouts.ts` — one export per role

---

## SPRINT 35 — PHASE 2 (SEQUENTIAL, AFTER PHASE 1)

---

### TRACK D — FEAT-017: Brochure Structural Redesign

**Depends on:** Track A complete (voice/style schema in place so brochure reads from it)

**What:** The brochure represents a marketing company selling marketing services. It needs to look like something a sharp agency would send. This is a design sprint — layout, hierarchy, density.

**Design direction:**
- Strong typographic hierarchy: company name large, tagline medium, section headers bold
- Bold section breaks with brand color bar (reads from `brandColor`)
- Purposeful whitespace — not a wall of text
- Client logo top-right if `logoUrl` set, COVOS attribution bottom
- Sections: About → Services → Process → Results → Next Steps → Contact
- No stock photography, no clip art — clean typographic layout

**Tenant variable slots (populated from GlobalSettings):**
- `companyName` — top header
- `companyTagline` — below name
- `logoUrl` — top right logo
- `brandColor` — section bars and accent elements
- `voiceIndustry` — "Specialized in [industry]"
- Any hardcoded "GHM" strings — replace with tenant vars

**Audit the brochure generator:** Find every hardcoded GHM string. Replace. Leave no GHM fingerprint.

---

### TRACK E — FEAT-021: Brand Asset Injection (Audit PDFs + Comp Sheet)

**Depends on:** Track A + Track B complete

**What:** Same tenant variable treatment for audit PDFs and comp sheet that Track D does for brochure. These are the three sales documents — all three need to be tenant-branded before Vertical 2 demo.

**For each document (audit PDF, comp sheet, proposal if exists):**
- Replace hardcoded company name with `tenant.companyName`
- Replace hardcoded logo with `tenant.logoUrl` (fallback to text name)
- Replace hardcoded colors with `tenant.brandColor`
- Replace hardcoded tagline/descriptor with `tenant.companyTagline`
- Grep for "GHM" strings — replace all

**Output verification:** Generate a test audit PDF and comp sheet as `covosdemo` tenant. No GHM text, COVOS Demo branding renders correctly.

---

## SPRINT 35 — PHASE 3 (SEQUENTIAL, ALL PRIOR COMPLETE)

---

### TRACK F — TypeScript Gate + Visual Spot Check + LEGAL-001

**TypeScript:** `npx tsc --noEmit` — zero new errors.

**Visual spot check (covosdemo tenant):**
- Login page shows COVOS Demo logo (or placeholder), not GHM logo
- Navbar shows correct logo
- Brochure generates with COVOS Demo branding
- Audit PDF generates with COVOS Demo branding
- Dashboard widget layout on first login matches role default

**LEGAL-001 — Partner Agreement Language:**
Add to `SERVICE_AGREEMENT.md` (or equivalent contract template):

> The dashboard is licensed for use solely in connection with the partner's sales and client management activities conducted on behalf of [Company]. Use of the dashboard — including access to client data, marketing tools, pipeline intelligence, or any platform features — for the partner's own clients, third-party clients, or any purpose unrelated to [Company] business is strictly prohibited and constitutes a material breach of this agreement.

Replace `[Company]` with `{{tenantName}}` if the agreement is auto-generated. Otherwise note it as a template placeholder. No code change if the agreement is a static document.

**Sprint 35 close:** STATUS.md + CHANGELOG.md + BACKLOG.md, then git sync/commit/push.

---
---

## SPRINT 36 — Communication Layer + Platform Hygiene
**Codename:** "Demo-Ready"
**Done criteria:** Platform communicates like a professional product. No dead routes, no broken chains, no UX-AUDIT gaps that would embarrass in front of a second tenant or an investor.

---

### PARALLELIZATION MAP — SPRINT 36

```
PHASE 1 (parallel — all independent)
├── Track A: UI-CONST-001 Group 6 — Communication layer
│   ├── A1: Email templates (HTML, tenant-branded)
│   ├── A2: Toast + alert system audit
│   └── A3: Empty states pass (all remaining)
├── Track B: FEAT-011 — Route + button + logic audit
└── Track C: UX-AUDIT-009 — Psychological UX audit (doc + spec only, no build)

PHASE 2 (sequential — Track B must complete first)
└── Track D: Fix pass — all critical findings from Track B

PHASE 3 (sequential — all prior complete)
└── Track E: TypeScript gate + full regression + sprint close
```

---

## SPRINT 36 — PHASE 1 (PARALLEL)

---

### TRACK A — UI-CONST-001 Group 6: Communication Layer

**A1 — Email Templates**

Current state: HTML emails are inline-styled and basic. They should look as good as Mailchimp's own emails.

Audit all outbound email templates:
- Forgot password / reset
- Work order delivery
- Partner/rep notification emails
- Report delivery emails
- Onboarding portal invitation
- Any other `sendEmail()` call

**Design system for emails:**
- Header: tenant logo (if set) + company name on brand color bar
- Body: clean white card, Inter or system font, 600px max-width
- CTA button: brand color, rounded, centered
- Footer: tenant support email + "Powered by COVOS" (or just tenant name if white-label)
- All values read from TenantConfig / GlobalSettings

**Create `src/lib/email/templates/base.tsx`** — React Email or mjml base layout component. All individual templates extend it. No more scattered inline styles.

Individual templates to rebuild:
- `reset-password.tsx`
- `work-order.tsx`
- `report-delivery.tsx`
- `onboarding-invite.tsx`
- `notification.tsx` (generic)

**A2 — Toast + Alert System Audit**

Audit every `toast()` call in the codebase. Check:
- Consistent use of success/error/warning/info variants
- No raw `alert()` calls anywhere
- Loading states have toasts (not just spinners with no feedback)
- Destructive actions (delete, archive) always show confirmation + undo where possible
- Error toasts include actionable language ("Failed to save — try again" not "Error 500")

Produce `docs/TOAST_AUDIT.md` with findings. Fix all critical issues inline.

**A3 — Empty States Pass**

Remaining empty states that aren't context-aware. Audit every page/panel:
- No "No data" or "Nothing here" — every empty state should tell the user what to do
- Consistent empty state component: icon + heading + subtext + CTA button
- Context-aware: new tenant (prompt to set up) vs. tenant with data but filtered to zero (prompt to clear filter)

Pattern:
```tsx
<EmptyState
  icon={<TaskIcon />}
  heading="No tasks yet"
  subtext="Tasks are created automatically from scan alerts, or add one manually."
  action={{ label: "Add task", href: "/tasks/new" }}
/>
```

Pages to audit: Tasks, Content Studio, Reports, Pipeline (filtered-to-zero), Team Feed, Vault, Onboarding (no tokens yet).

---

### TRACK B — FEAT-011: Route + Button + Logic Audit

**What:** Full enumeration of every button-to-route-to-handler chain. Find dead routes, broken routes, orphaned handlers, duplicate logic, permission gaps that Sprint 12 didn't cover.

**Method:**
```bash
# Find all router.push and Link hrefs
grep -r "router\.push\|href=" src/ --include="*.tsx" --include="*.ts" | grep -v node_modules

# Find all API route handlers
find src/app/api -name "route.ts" | sort

# Find all onClick handlers that aren't just state setters
grep -r "onClick" src/ --include="*.tsx" | grep -v "setState\|set[A-Z]"
```

**Output:** `docs/ROUTE_AUDIT.md` — table format:

| Button/Link | Handler | Route exists? | Permission guard? | Status |
|-------------|---------|--------------|-------------------|--------|
| ...         | ...     | ✅/❌         | ✅/❌              | OK/DEAD/BROKEN |

**Flag categories:**
- DEAD — route exists in UI, no API handler responds
- BROKEN — handler exists, throws or returns wrong shape
- UNGUARDED — handler has no `withPermission` or role check
- DUPLICATE — same logic in 2+ places, should be extracted
- ORPHAN — API route exists, nothing in UI calls it

Fix all DEAD, BROKEN, UNGUARDED immediately in Track D. Flag DUPLICATE and ORPHAN as tech debt items in BACKLOG.md.

---

### TRACK C — UX-AUDIT-009: Psychological UX Audit (Spec Only)

**What:** Document only — no build. Walk each user archetype flow, identify the 3 most emotionally resonant moments, spec the micro-interactions and copy improvements that amplify them.

**Archetypes:**

Admin — magic moment: "The platform came alive." First time they see live data populated, health scores moving, tasks auto-generated from a scan. Make this moment undeniable. What does the UI do to mark it? What copy appears?

Sales Rep — magic moment: "Automation did my job." First time a scan alert auto-generates a task, or an AI content brief saves them 45 minutes. Make the assist visible and creditable.

Manager — magic moment: "I can see everything." First time they see the full team pipeline, client health across book, earnings by rep in one view. Make the overview feel like control, not surveillance.

**Output:** `docs/PSYCH_UX_AUDIT.md` with findings per archetype + intervention spec (what to build, where, estimated size). This becomes a future sprint's blueprint.

---

## SPRINT 36 — PHASE 2 (SEQUENTIAL, AFTER TRACK B)

---

### TRACK D — Fix Pass: Route Audit Findings

Work through `docs/ROUTE_AUDIT.md` findings in priority order: UNGUARDED first, BROKEN second, DEAD third.

For UNGUARDED routes — add `withPermission` or role gate. Pattern from Sprint SEC:
```typescript
export const GET = withPermission('view_clients', async (req, context, user) => {
  // handler
});
```

For BROKEN routes — fix the handler. Verify response shape matches what the UI expects.

For DEAD routes — remove the UI element, or build the handler if the feature is intentional. No dead buttons in a demo-ready platform.

---

## SPRINT 36 — PHASE 3 (SEQUENTIAL, ALL PRIOR COMPLETE)

---

### TRACK E — TypeScript Gate + Full Regression + Sprint Close

**TypeScript:** `npx tsc --noEmit` — zero new errors across both Sprint 35 and 36 changed files.

**Regression spot check:**
- GHM tenant: login → dashboard → brochure generate → audit PDF → work order → email preview. Full happy path.
- covosdemo tenant: same path. All COVOS Demo branding, no GHM text anywhere.
- Sales rep first login: widget layout matches role default.
- Unknown subdomain: redirects to not-a-tenant page.
- All toast variants render correctly (success, error, warning, info).
- Empty states render on all audited pages.

**Sprint 36 close:** STATUS.md + CHANGELOG.md + BACKLOG.md close Sprint 35 + 36. Update ARCH.md: UI-CONST-001 Groups 6 complete.

---

## COMBINED FILE CHANGE SUMMARY

| Track | Files | Sprint |
|-------|-------|--------|
| A (FEAT-016) | GlobalSettings UI (branding + voice tabs), AI route voice injection (5–8 files) | 35 |
| B (FEAT-018) | `tenant-logo.tsx`, sidebar, login page, Settings logo upload | 35 |
| C (UX-FEAT-003) | `default-layouts.ts`, dashboard first-render logic | 35 |
| D (FEAT-017) | Brochure generator — all GHM strings → tenant vars | 35 |
| E (FEAT-021) | Audit PDF + comp sheet generators — tenant vars | 35 |
| F (LEGAL-001) | `SERVICE_AGREEMENT.md` — partner restriction language | 35 |
| A1 (email) | `src/lib/email/templates/` — 5 rebuilt templates + base layout | 36 |
| A2 (toasts) | Toast audit fixes + `docs/TOAST_AUDIT.md` | 36 |
| A3 (empty states) | 7–8 page empty state components | 36 |
| B (route audit) | `docs/ROUTE_AUDIT.md` | 36 |
| C (psych audit) | `docs/PSYCH_UX_AUDIT.md` | 36 |
| D (fix pass) | Variable — depends on audit findings | 36 |

**Schema changes:** None (GlobalSettings fields already exist).
**Prisma:** No migrations needed for either sprint.
**TypeScript:** Zero new errors target for both sprints.

---

## GIT COMMIT MESSAGES

**Sprint 35:**
```
feat(identity): Sprint 35 — Tenant visual identity + brand system

- FEAT-016: Voice/style settings UI complete — tone, keywords, font, color pickers
- FEAT-016: AI voice injection in content/report/work-order routes
- FEAT-018: TenantLogo component — navbar + login pull from GlobalSettings.logoUrl
- FEAT-018: Logo upload in Settings → Vercel Blob
- UX-FEAT-003: Dashboard widget default layouts per role (admin/manager/sales)
- FEAT-017: Brochure redesign — tenant-variable slots, zero GHM hardcodes
- FEAT-021: Audit PDF + comp sheet — full tenant branding
- LEGAL-001: Partner agreement restriction language added
- TypeScript: zero new errors
```

**Sprint 36:**
```
feat(platform): Sprint 36 — Communication layer + platform hygiene

- UI-CONST-001 Group 6: Email templates rebuilt (base layout + 5 templates, tenant-branded)
- UI-CONST-001 Group 6: Toast audit — consistent variants, actionable copy, TOAST_AUDIT.md
- UI-CONST-001 Group 6: Empty states pass — context-aware on 7+ pages
- FEAT-011: Route audit complete — ROUTE_AUDIT.md, all DEAD/BROKEN/UNGUARDED fixed
- UX-AUDIT-009: PSYCH_UX_AUDIT.md — 3-archetype emotional flow spec
- TypeScript: zero new errors
- ARCH.md: UI-CONST-001 Group 6 complete
```
