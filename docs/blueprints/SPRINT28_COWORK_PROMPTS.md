# SPRINT 28 — COWORK LAUNCH PROMPTS
# Copy-paste one section per Cowork session. Nothing else needed.
# Sequence: Track A first (solo). After A is pushed → B and C simultaneously.

---

## ══════════════════════════════════════════════════════════════════
## TRACK A LAUNCH PROMPT  (copy everything between the ═══ lines)
## ══════════════════════════════════════════════════════════════════

You are operating as a Cowork autonomous agent on the GHM Dashboard project.

**Project root:** `D:\Work\SEO-Services\ghm-dashboard`

**Your mission:** Execute Sprint 28 Track A — extend TenantConfig and extract all hardcoded GHM strings from the email, template, report, audit-PDF, and work-order layers. This is a pure extraction: zero behavior change for GHM, zero new features.

---

### BOOTSTRAP (do this before touching any code)

Load these files in order:

1. `D:\Work\SEO-Services\ghm-dashboard\CLAUDE_INSTRUCTIONS.md`
2. `D:\Work\SEO-Services\ghm-dashboard\STATUS.md`
3. `D:\Work\SEO-Services\ghm-dashboard\BACKLOG.md`
4. `D:\Work\SEO-Services\ghm-dashboard\docs\blueprints\COVOS_EXTRACTION_AUDIT.md` ← read fully
5. `D:\Work\SEO-Services\ghm-dashboard\docs\blueprints\SPRINT28_TRACK_A_BLUEPRINT.md` ← this is your execution spec

Then output:
```
TRACK A SESSION INITIALIZED
✅ CLAUDE_INSTRUCTIONS.md loaded
✅ STATUS.md loaded
✅ BACKLOG.md loaded
✅ COVOS_EXTRACTION_AUDIT.md loaded
✅ SPRINT28_TRACK_A_BLUEPRINT.md loaded
Ready to execute.
```

---

### CRITICAL CONSTRAINTS (active the entire session)

- `prisma db push` only — never `prisma migrate dev`
- `npx tsc --noEmit` must pass before commit — zero NEW errors (pre-existing errors in scripts/basecamp-crawl.ts, scripts/import-wave-history.ts, and src/lib/basecamp/client.ts are acceptable)
- `SALARY_ONLY_USER_IDS = [4]` — do not touch calculations.ts unless executing optional Step 7
- No raw role string comparisons — always `isElevated()`
- No raw `anthropic.messages.create()` outside `src/lib/ai/`
- Docs before git — always (STATUS.md → then commit)

---

### EXECUTION ORDER

Execute blueprint steps 1–6 in order. Step 7 (SALARY_ONLY extraction) is optional — do it if time permits.

**Step 1 — TenantConfig interface extension** (`src/lib/tenant/config.ts`)
Add these fields to the interface and update the `ghm` registry entry with exact values as specified in the blueprint. This step unlocks all downstream steps.

**Step 2 — `src/lib/email/index.ts`**
Remove module-level `FROM_EMAIL` / `FROM_NAME` constants. Add `tenant: TenantConfig` param to every exported email function. Replace all hardcoded GHM strings using the substitution table in the blueprint.

**Step 3 — `src/lib/email/templates.ts`**
Same pattern: remove `FROM_EMAIL` constant, add tenant param, replace 5 hardcoded strings.

**Step 4 — `src/lib/reports/template.ts`**
Add tenant param, replace 1 footer string. Update the caller.

**Step 5 — `src/lib/audit/template.ts`**
Add tenant param, replace 5 hardcoded strings. Update callers.

**Step 6 — `src/lib/pdf/work-order-template.tsx`**
Add tenant param to component props, replace 2 hardcoded strings. Update callers.

After each step: read the file you just modified and confirm no GHM strings remain in runtime code.

---

### VERIFICATION (run before committing)

```powershell
# From D:\Work\SEO-Services\ghm-dashboard

# 1. TypeScript
npx tsc --noEmit

# 2. Scan modified files — expect zero matches in all 5
$files = "src/lib/email/index.ts","src/lib/email/templates.ts","src/lib/reports/template.ts","src/lib/audit/template.ts","src/lib/pdf/work-order-template.tsx"
foreach ($f in $files) {
  Write-Host "=== $f ===" -ForegroundColor Cyan
  Get-Content $f | Select-String "ghmmarketing|ghmdigital|GHM Marketing|GHM Digital Marketing"
}

# 3. Confirm TenantConfig has new fields
Get-Content src/lib/tenant/config.ts | Select-String "fromEmail|companyName|dashboardUrl|supportEmail"
```

All scans must return zero matches. TypeScript must pass. Do not commit until both are clean.

---

### SYNC PROTOCOL (after verification passes)

1. **STATUS.md** — update the `Last Updated:` header line to: `February 26, 2026 — Sprint 28 Track A complete. TenantConfig extended (6 new fields). Email/template/report/audit/work-order extraction done. ~50 GHM runtime references removed from non-tenant layer. Tracks B+C ready to launch.`
2. `git add -A`
3. Use this commit message exactly:

```
feat: extract tenant identity from email and template layer (Sprint 28 Track A)

- Extend TenantConfig: companyName, fromEmail, fromName, supportEmail,
  dashboardUrl, companyTagline, aiContext fields added
- Update TENANT_REGISTRY.ghm with all new field values
- email/index.ts: remove FROM_EMAIL/FROM_NAME constants; all functions
  now accept tenant param; 14 GHM strings removed
- email/templates.ts: same pattern; 5 GHM strings removed
- reports/template.ts: footer now reads tenant.companyName
- audit/template.ts: all 5 company name refs now from TenantConfig
- pdf/work-order-template.tsx: company name and tagline from TenantConfig
- Zero GHM hardcoding in email/template/pdf layer
- TypeScript: zero new errors
```

4. `git push`
5. Post completion message: "Track A complete and pushed. Tracks B and C can now launch in parallel."

---

## ══════════════════════════════════════════════════════════════════
## TRACK B LAUNCH PROMPT  (copy everything between the ═══ lines)
## Launch AFTER Track A is confirmed pushed
## ══════════════════════════════════════════════════════════════════

You are operating as a Cowork autonomous agent on the GHM Dashboard project.

**Project root:** `D:\Work\SEO-Services\ghm-dashboard`

**Your mission:** Execute Sprint 28 Track B — extract hardcoded GHM strings from the AI prompt layer, push notifications, and dashboard layout title. Small scope, high precision. This runs in parallel with Track C — your file set does not overlap with Track C at all.

**Prerequisite:** Track A must already be pushed (TenantConfig has `fromEmail`, `companyName`, `dashboardUrl`, `supportEmail`, `aiContext` fields). Pull latest before starting:
```
git pull
```

---

### BOOTSTRAP

Load these files in order:

1. `D:\Work\SEO-Services\ghm-dashboard\CLAUDE_INSTRUCTIONS.md`
2. `D:\Work\SEO-Services\ghm-dashboard\STATUS.md`
3. `D:\Work\SEO-Services\ghm-dashboard\docs\blueprints\COVOS_EXTRACTION_AUDIT.md` ← sections 1B and 2 specifically
4. `D:\Work\SEO-Services\ghm-dashboard\docs\blueprints\SPRINT28_TRACK_B_BLUEPRINT.md` ← your execution spec

Then output:
```
TRACK B SESSION INITIALIZED
✅ CLAUDE_INSTRUCTIONS.md loaded
✅ STATUS.md loaded
✅ COVOS_EXTRACTION_AUDIT.md loaded
✅ SPRINT28_TRACK_B_BLUEPRINT.md loaded
✅ git pull complete — Track A changes present
Ready to execute.
```

---

### CRITICAL CONSTRAINTS

- `npx tsc --noEmit` zero NEW errors before commit
- Do not touch any file in Track C's set: `nav.tsx`, `client-portal-dashboard.tsx`, `onboarding-panel.tsx`, `(onboarding)/` pages
- Do not touch any file in Track A's set: `email/`, `reports/`, `audit/`, `work-order-template.tsx`, `tenant/config.ts`

---

### YOUR FILES (touch only these four)

```
src/lib/ai/context/system-prompt-builder.ts
src/lib/ai/search-prompt.ts
src/lib/push.ts
src/app/(dashboard)/layout.tsx
```

**`system-prompt-builder.ts`:** Update `buildBaseContext()` and the exported `buildSystemPrompt()` to accept `tenant: TenantConfig`. Replace the hardcoded `"GHM Marketing Dashboard, an enterprise SEO services platform"` string using `tenant.name` + `tenant.aiContext`. Replace two inline GHM references (satellite tier description line, upsell feature line). Update all callers.

**`search-prompt.ts`:** Add `tenant: TenantConfig` param. Replace `"GHM Marketing Dashboard"` with `${tenant.name} Dashboard`. Update callers.

**`push.ts`:** Find the VAPID_SUBJECT fallback `"mailto:admin@ghmmarketing.com"`. Replace with `"mailto:support@covos.app"`. No tenant param needed — VAPID is platform-level.

**`layout.tsx`:** Find the metadata title `"GHM Marketing Dashboard"`. If using `export const metadata`, convert to `export async function generateMetadata()` and derive title from `getTenant()`. If that's disproportionate complexity, acceptable fallback: `"Business Dashboard"` as a static string — and log a TODO comment to finish in Sprint 29.

---

### VERIFICATION

```powershell
$files = "src/lib/ai/context/system-prompt-builder.ts","src/lib/ai/search-prompt.ts","src/lib/push.ts","src/app/(dashboard)/layout.tsx"
foreach ($f in $files) {
  Write-Host "=== $f ===" -ForegroundColor Cyan
  Get-Content $f | Select-String "ghmmarketing|ghmdigital|GHM Marketing|GHM Digital Marketing"
}
npx tsc --noEmit
```

Zero matches. Zero new TypeScript errors.

---

### SYNC PROTOCOL

1. **STATUS.md** — update `Last Updated:` to include: `Sprint 28 Track B complete. AI prompts, push, dashboard title extracted.`
2. Commit:

```
feat: extract tenant identity from AI prompts and dashboard (Sprint 28 Track B)

- system-prompt-builder.ts: platform description from tenant.name + aiContext
- search-prompt.ts: tenant name in COVOS search layer prompt
- push.ts: remove GHM email fallback from VAPID_SUBJECT
- layout.tsx: dashboard title derived from tenant context
- TypeScript: zero new errors
```

3. `git push`
4. Post: "Track B complete and pushed."

---

## ══════════════════════════════════════════════════════════════════
## TRACK C LAUNCH PROMPT  (copy everything between the ═══ lines)
## Launch AFTER Track A is confirmed pushed (parallel with Track B)
## ══════════════════════════════════════════════════════════════════

You are operating as a Cowork autonomous agent on the GHM Dashboard project.

**Project root:** `D:\Work\SEO-Services\ghm-dashboard`

**Your mission:** Execute Sprint 28 Track C — extract hardcoded GHM strings from UI components, public-facing onboarding pages, and the client portal. This runs in parallel with Track B — your file sets do not overlap.

**Prerequisite:** Track A must already be pushed. Pull latest before starting:
```
git pull
```

---

### BOOTSTRAP

1. `D:\Work\SEO-Services\ghm-dashboard\CLAUDE_INSTRUCTIONS.md`
2. `D:\Work\SEO-Services\ghm-dashboard\STATUS.md`
3. `D:\Work\SEO-Services\ghm-dashboard\docs\blueprints\COVOS_EXTRACTION_AUDIT.md` ← section 1C specifically
4. `D:\Work\SEO-Services\ghm-dashboard\docs\blueprints\SPRINT28_TRACK_C_BLUEPRINT.md` ← your execution spec

Then output:
```
TRACK C SESSION INITIALIZED
✅ CLAUDE_INSTRUCTIONS.md loaded
✅ STATUS.md loaded
✅ COVOS_EXTRACTION_AUDIT.md loaded
✅ SPRINT28_TRACK_C_BLUEPRINT.md loaded
✅ git pull complete — Track A changes present
Ready to execute.
```

---

### CRITICAL CONSTRAINTS

- `npx tsc --noEmit` zero NEW errors before commit
- Do not touch any file in Track B's set: `system-prompt-builder.ts`, `search-prompt.ts`, `push.ts`, `layout.tsx`
- Do not touch any file in Track A's set: `email/`, `reports/`, `audit/`, `work-order-template.tsx`, `tenant/config.ts`
- The territory city/state content in `territory-map/page.tsx` is GHM tenant DATA — do not touch it, only the `companyName` string

---

### YOUR FILES

```
src/components/layout/nav.tsx
src/components/clients/client-portal-dashboard.tsx
src/components/clients/onboarding-panel.tsx
src/app/(onboarding)/brochure/page.tsx
src/app/(onboarding)/comp-sheet/page.tsx
src/app/(onboarding)/territory-map/page.tsx
src/app/(onboarding)/**/page.tsx  ← whichever file has the 3x support@ghmdigital.com instances
src/app/api/public/branding/route.ts  ← add companyName to response
```

**`nav.tsx`:** Find `alt="GHM Digital Marketing"` on the logo `<Image>`. Replace with `alt={tenant?.name ?? "Dashboard"}` using the tenant from `useTenant()` hook or server-side context. Confirm how branding data already flows into nav (logoUrl was wired in Sprint 17) — follow the same pattern.

**`client-portal-dashboard.tsx`:** Find `© ... GHM Digital Marketing Inc. All rights reserved.`. Replace company name with `companyName` from the `/api/public/branding` response (the portal already calls this endpoint). If `companyName` isn't in that response yet, add it in `branding/route.ts` first.

**`onboarding-panel.tsx`:** Find the SSR fallback `"https://app.ghmdigital.com"`. If the component is `"use client"`, replace the whole ternary with just `window.location.origin`. If it renders server-side, use `tenant.dashboardUrl` from props.

**`brochure/page.tsx`, `comp-sheet/page.tsx`, `territory-map/page.tsx`:** For each, import `getTenant` from `@/lib/tenant/server`, resolve `companyName = tenant?.companyName ?? "COVOS"`, then replace all `GHM Digital Marketing Inc` occurrences with the variable. Leave territory names, city lists, and all business content untouched.

**Support email (3 instances):** Find the file(s) containing `support@ghmdigital.com` (onboarding flow pages). Resolve `supportEmail = tenant?.supportEmail ?? "support@covos.app"`. Replace all three instances.

**`/api/public/branding/route.ts`:** Add `companyName: tenant?.companyName ?? "COVOS"` to the JSON response if not already present.

---

### VERIFICATION

```powershell
$files = @(
  "src/components/layout/nav.tsx",
  "src/components/clients/client-portal-dashboard.tsx",
  "src/components/clients/onboarding-panel.tsx",
  "src/app/(onboarding)/brochure/page.tsx",
  "src/app/(onboarding)/comp-sheet/page.tsx",
  "src/app/(onboarding)/territory-map/page.tsx",
  "src/app/api/public/branding/route.ts"
)
foreach ($f in $files) {
  Write-Host "=== $f ===" -ForegroundColor Cyan
  Get-Content $f | Select-String "ghmmarketing|ghmdigital|GHM Marketing|GHM Digital Marketing"
}

# Support email check
Get-ChildItem -Recurse -Include "*.tsx","*.ts" src/app/(onboarding)/ | Select-String "ghmdigital.com"

npx tsc --noEmit
```

Zero matches (territory content won't match these patterns — only GHM company name strings will). Zero new TypeScript errors.

---

### SYNC PROTOCOL

1. **STATUS.md** — update `Last Updated:` to include: `Sprint 28 Track C complete. UI components, public pages, client portal extracted.`
2. Commit:

```
feat: extract tenant identity from UI components and public pages (Sprint 28 Track C)

- nav.tsx: logo alt text from tenant.name
- client-portal-dashboard.tsx: copyright footer from tenant.companyName
- onboarding-panel.tsx: remove hardcoded ghmdigital.com fallback URL
- brochure/comp-sheet/territory-map pages: companyName from TenantConfig
- onboarding form: support email from tenant.supportEmail (3 instances)
- /api/public/branding: companyName added to response
- TypeScript: zero new errors
```

3. `git push`
4. Post: "Track C complete and pushed."

---

## POST-SPRINT VERIFICATION (run after B and C are both pushed)

One final full-codebase scan to confirm Sprint 28 is clean:

```powershell
cd D:\Work\SEO-Services\ghm-dashboard

# Should return ONLY: config.ts (ghm registry values) + comment headers in lib/ai/*.ts
Get-ChildItem -Recurse -Include "*.ts","*.tsx" src/ | `
  Select-String "GHM Marketing|ghmmarketing\.com|ghmdigital\.com|GHM Digital Marketing" | `
  Format-Table Filename, LineNumber, Line -AutoSize

npx tsc --noEmit
```

Expected remaining matches after Sprint 28:
- `src/lib/tenant/config.ts` — `ghm` registry entry values (correct — this IS the tenant data)
- `src/lib/ai/*.ts` — comment headers saying `// GHM Dashboard` (harmless — Track D, Sprint 30)
- Zero runtime string interpolations anywhere else
