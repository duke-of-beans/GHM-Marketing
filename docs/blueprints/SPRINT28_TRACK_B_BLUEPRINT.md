# SPRINT 28 — TRACK B BLUEPRINT
# COVOS Core Extraction: AI Prompts + Push + Dashboard Title
**Date:** February 26, 2026
**Track:** B (starts after Track A defines TenantConfig interface)
**Estimated time:** 1–2 hrs
**Dependency:** Track A must complete before this track begins
**Files touched (exclusive — no overlap with A or C):**
- `src/lib/ai/context/system-prompt-builder.ts`
- `src/lib/ai/search-prompt.ts`
- `src/lib/push.ts`
- `src/app/(dashboard)/layout.tsx`

**TypeScript must be clean after this track. Run `npx tsc --noEmit` before marking done.**

---

## STEP 1 — Extract `src/lib/ai/context/system-prompt-builder.ts`

### 1A. Update `buildBaseContext()` function

This function is called with a `FeatureContext` object. Check whether `FeatureContext` has access to tenant. If not, update the type and injection point.

Option A (if FeatureContext can be extended with tenant):
```ts
// Add to FeatureContext type:
tenant?: TenantConfig;
```

Option B (simpler, if the function is only called from request context):
Pass tenant separately:
```ts
function buildBaseContext(ctx: FeatureContext, tenant: TenantConfig): string {
```

### 1B. Replace hardcoded platform description

Find:
```ts
return `You are an AI assistant embedded in the GHM Marketing Dashboard, an enterprise SEO services platform.
```

Replace with (using tenant):
```ts
const platformDescription = tenant.aiContext
  ? `${tenant.name} Dashboard, a ${tenant.aiContext}`
  : `${tenant.name} Dashboard`;

return `You are an AI assistant embedded in the ${platformDescription}.
```

Result for GHM: `"GHM Digital Marketing Dashboard, a enterprise SEO services platform for local businesses"` — identical behavior, now tenant-configurable.

### 1C. Replace inline GHM references in other prompt sections

Find (line 121, in satellite tier description):
```ts
tier3: "This is a Pure Satellite — independent brand, GHM-owned. Establish credibility and trust from scratch.",
```

Replace with:
```ts
tier3: `This is a Pure Satellite — independent brand, ${tenant.name}-owned. Establish credibility and trust from scratch.`,
```

Find (line 193, in upsell/feature context):
```ts
3. There is a specific GHM service that directly addresses it
```

Replace with:
```ts
3. There is a specific ${tenant.name} service that directly addresses it
```

### 1D. Update the main exported `buildSystemPrompt()` function

Wherever `buildBaseContext(ctx)` is called, update to pass tenant:
```ts
const base = buildBaseContext(ctx, tenant);
```

And update `buildSystemPrompt()` signature to accept or derive tenant:
```ts
export function buildSystemPrompt(ctx: FeatureContext, tenant: TenantConfig): string {
```

### 1E. Update callers

Search for `buildSystemPrompt(` in `src/lib/ai/` and `src/app/api/`. Pass tenant context (available via `requireTenant()` in all API routes).

---

## STEP 2 — Extract `src/lib/ai/search-prompt.ts`

### 2A. Locate the function with the GHM reference

The function returns a prompt string starting with:
```ts
return `You are the COVOS search intelligence layer for GHM Marketing Dashboard.
```

### 2B. Update function signature

Accept `tenant: TenantConfig`:
```ts
export function buildSearchPrompt(/* existing params */, tenant: TenantConfig): string {
```

### 2C. Replace hardcoded string

```ts
// Before
return `You are the COVOS search intelligence layer for GHM Marketing Dashboard.

// After
return `You are the COVOS search intelligence layer for ${tenant.name} Dashboard.
```

### 2D. Update callers

Search for usages of `buildSearchPrompt` and pass tenant.

---

## STEP 3 — Extract `src/lib/push.ts`

### 3A. Locate the VAPID_SUBJECT line

Find:
```ts
process.env.VAPID_SUBJECT ?? "mailto:admin@ghmmarketing.com",
```

### 3B. Replace GHM fallback with COVOS platform email

The `VAPID_SUBJECT` env var is the correct control point for this. The fallback should not be GHM-specific — it should be a platform-level contact or simply not have a GHM fallback.

Option A (recommended): Use COVOS platform email as fallback
```ts
process.env.VAPID_SUBJECT ?? "mailto:support@covos.app",
```

Option B: Remove the hardcoded fallback entirely and require the env var
```ts
const subject = process.env.VAPID_SUBJECT;
if (!subject) {
  console.error("[push] VAPID_SUBJECT env var not set. Push notifications disabled.");
  return; // or throw
}
```

Use Option A for Sprint 28 (safe default). Update the env var on Vercel for GHM to `mailto:admin@ghmmarketing.com` if not already set.

**No tenant parameter needed here** — VAPID keys are platform-level, one set per deployment.

---

## STEP 4 — Extract `src/app/(dashboard)/layout.tsx`

### 4A. Locate the metadata title

Find:
```ts
title: "GHM Marketing Dashboard",
```

Or find the `metadata` export / `generateMetadata()` call at the top of the file.

### 4B. Make title dynamic from tenant

If using static `export const metadata`:
```ts
// Cannot be dynamic with static metadata — switch to generateMetadata()
export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenant();
  return {
    title: tenant ? `${tenant.name} Dashboard` : "COVOS Dashboard",
    // ... other metadata fields
  };
}
```

If `generateMetadata()` is already used, simply update the title interpolation.

**Note:** If making this change adds significant complexity (async metadata wasn't used before), acceptable fallback for Sprint 28 is a more generic title:
```ts
title: "Business Dashboard",  // Tenant-agnostic placeholder
```
And follow up in Sprint 29 with the proper `generateMetadata()` pattern.

---

## VERIFICATION (Run before committing Track B)

```powershell
# 1. TypeScript clean
Set-Location "D:\Work\SEO-Services\ghm-dashboard"
npx tsc --noEmit

# 2. No hardcoded GHM strings remain in AI files or push
$files = "src/lib/ai/context/system-prompt-builder.ts","src/lib/ai/search-prompt.ts","src/lib/push.ts","src/app/(dashboard)/layout.tsx"
foreach ($f in $files) {
  Write-Host "=== $f ===" -ForegroundColor Cyan
  Select-String "ghmmarketing|ghmdigital|GHM Marketing|GHM Digital Marketing" $f
}
# Expected: zero runtime matches (comment headers in ai/*.ts are Track D, not blocking)
```

---

## COMMIT MESSAGE

```
feat: extract tenant identity from AI prompts and dashboard layout (Track B)

- buildSystemPrompt() now accepts TenantConfig; platform description
  derived from tenant.name + tenant.aiContext
- buildSearchPrompt() now accepts TenantConfig; no GHM hardcoding
- push.ts: remove GHM email as VAPID_SUBJECT fallback; use covos.app
- dashboard layout: page title derived from tenant name
- TypeScript: zero new errors
```
