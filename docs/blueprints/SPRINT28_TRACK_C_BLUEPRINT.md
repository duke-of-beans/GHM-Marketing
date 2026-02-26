# SPRINT 28 — TRACK C BLUEPRINT
# COVOS Core Extraction: UI Components + Public Pages + Client Portal
**Date:** February 26, 2026
**Track:** C (starts after Track A defines TenantConfig interface)
**Estimated time:** 2–3 hrs
**Dependency:** Track A must complete before this track begins
**Files touched (exclusive — no overlap with A or B):**
- `src/components/layout/nav.tsx`
- `src/components/clients/client-portal-dashboard.tsx`
- `src/components/clients/onboarding-panel.tsx`
- `src/app/(onboarding)/brochure/page.tsx`
- `src/app/(onboarding)/comp-sheet/page.tsx`
- `src/app/(onboarding)/territory-map/page.tsx`
- `src/app/(onboarding)/` — page(s) with `support@ghmdigital.com`

**TypeScript must be clean after this track. Run `npx tsc --noEmit` before marking done.**

---

## STEP 1 — Extract `src/components/layout/nav.tsx`

### 1A. Locate the logo Image element

Find (near line 282):
```tsx
alt="GHM Digital Marketing"
```

It's on a `<Image>` element rendering the tenant logo.

### 1B. Thread tenant into nav

The nav is a server component or receives props from `DashboardLayoutClient`. Check how the nav gets branding data.

If it reads from the `useTenant()` hook (client component):
```tsx
const tenant = useTenant();
// ...
<Image src={tenant?.logoUrl ?? "/logo.png"} alt={tenant?.name ?? "Dashboard"} ... />
```

If it reads from server props, update the prop type to include `tenantName: string` and pass `tenant.name` from the layout.

### 1C. Confirm logoUrl already works

Per Sprint 9, `logoUrl` from `GlobalSettings` is already passed to nav. This step is just ensuring the `alt` text is also dynamic.

---

## STEP 2 — Extract `src/components/clients/client-portal-dashboard.tsx`

### 2A. Locate the copyright footer

Find (near line 198):
```tsx
© {new Date().getFullYear()} GHM Digital Marketing Inc. All rights reserved.
```

### 2B. Thread tenant name into the component

The client portal is loaded with a token — it has access to company info via the `ClientProfile` relation or a branding API call. Two options:

Option A (quickest): Pass `companyName` as a prop
```tsx
interface ClientPortalDashboardProps {
  // existing props...
  companyName: string;
}

// In component:
© {new Date().getFullYear()} {props.companyName}. All rights reserved.
```

Option B: Fetch from `/api/public/branding` (already exists from Sprint 17)
```tsx
// The portal page already calls /api/public/branding for logo/colors
// Use the companyName field from that response
```

Use Option B — it's already wired. Add `companyName` to the `/api/public/branding` response (it should read from `GlobalSettings` or `TenantConfig`).

**Update `/api/public/branding/route.ts`** to include `companyName` from `TenantConfig`:
```ts
// In the route handler:
const tenant = await getTenant();
return NextResponse.json({
  logoUrl: settings?.logoUrl ?? null,
  companyName: tenant?.companyName ?? tenant?.name ?? "COVOS",
  primaryColor: settings?.brandColorPrimary ?? null,
  // ...
});
```

Then in `client-portal-dashboard.tsx` use the `companyName` from the branding response.

---

## STEP 3 — Extract `src/components/clients/onboarding-panel.tsx`

### 3A. Locate the hardcoded base URL

Find (near line 91):
```ts
const base = typeof window !== "undefined" ? window.location.origin : "https://app.ghmdigital.com";
```

### 3B. Replace fallback URL

The `window.location.origin` path is correct — it uses the actual current origin in the browser.

The SSR fallback `"https://app.ghmdigital.com"` is the only GHM-specific piece.

Fix (use tenant config):
```ts
// Option A: Remove the SSR fallback and rely on client-side only
// (safe if this component only renders client-side)
const base = typeof window !== "undefined" ? window.location.origin : "";

// Option B: Pass dashboardUrl as a prop from the server component wrapper
const base = typeof window !== "undefined" ? window.location.origin : props.dashboardUrl;
```

Check whether `onboarding-panel.tsx` renders server-side. If it's a `"use client"` component, Option A is fine — `window.location.origin` will always be available.

**Simplest correct fix:** If client-only, just remove the GHM fallback:
```ts
const base = window.location.origin;
```
This runs in a browser context where `window` is always defined.

---

## STEP 4 — Extract `src/app/(onboarding)/brochure/page.tsx`

### 4A. Current hardcoded strings

- Page `<title>`: `GHM Digital Marketing Inc — Local SEO That Dominates`
- Header: `GHM Digital Marketing Inc` (line 31)
- Footer: `GHM Digital Marketing Inc · All-inclusive local SEO · Month-to-month` (line 493)

### 4B. Strategy

These pages are GHM's public sales collateral. Two approaches:

**Sprint 28 approach (recommended):** Fetch tenant branding from `/api/public/branding` (already exists) and interpolate company name. The pages are public routes with no auth requirement — they can call the public branding endpoint.

```tsx
// Add at page component level:
const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/public/branding`);
const { companyName } = await res.json();
// Then use companyName in JSX
```

Or use server-side `getTenant()` since these are server components:
```tsx
import { getTenant } from "@/lib/tenant/server";
// In component:
const tenant = await getTenant();
const companyName = tenant?.companyName ?? "COVOS";
```

### 4C. Replace all three string occurrences

| Old | New |
|-----|-----|
| `GHM Digital Marketing Inc — Local SEO That Dominates` | `${companyName} — Local SEO That Dominates` |
| `GHM Digital Marketing Inc` (body header) | `{companyName}` |
| `GHM Digital Marketing Inc · All-inclusive...` | `{companyName} · All-inclusive...` |

---

## STEP 5 — Extract `src/app/(onboarding)/comp-sheet/page.tsx`

Same pattern as Step 4.

Strings to replace:
| Old | New |
|-----|-----|
| `GHM Digital Marketing Inc — Sales Partner Opportunity` | `${companyName} — Sales Partner Opportunity` |
| `GHM Digital Marketing Inc` (line 40) | `{companyName}` |
| `GHM Digital Marketing Inc · Commission-Only...` | `{companyName} · Commission-Only...` |

---

## STEP 6 — Extract `src/app/(onboarding)/territory-map/page.tsx`

Same pattern.

Strings to replace:
| Old | New |
|-----|-----|
| `GHM Digital Marketing Inc — Territory Map` | `${companyName} — Territory Map` |
| `"Initial territory definitions for GHM Digital Marketing Inc sales partners..."` | Replace GHM mention with `${companyName}` |
| `GHM Digital Marketing Inc` (line 48) | `{companyName}` |
| `GHM Digital Marketing Inc · Phase 1 Territory Map...` | `{companyName} · Phase 1 Territory Map...` |

**Note:** Territory names (city/state coverage areas, phase roadmap descriptions) are GHM-specific data. Leave those unchanged — they're correct tenant content, not hardcoded platform strings.

---

## STEP 7 — Extract Support Email from Onboarding Page(s)

### 7A. Locate the three instances

The onboarding/client-facing page(s) contain:
- Line 1161: `<p ...>Or reach us at support@ghmdigital.com</p>`
- Line 1214: `Questions? Reach us at support@ghmdigital.com`
- Line 1261: `Need help? Contact us at support@ghmdigital.com`

These appear to be in the same file. Identify the filename (likely `src/app/(onboarding)/[token]/page.tsx` or `ClientOnboardingForm`).

### 7B. Replace with tenant supportEmail

Use the same `getTenant()` pattern:
```tsx
const tenant = await getTenant();
const supportEmail = tenant?.supportEmail ?? "support@covos.app";
```

Then replace all three hardcoded occurrences:
```tsx
// Before
<p>Or reach us at support@ghmdigital.com</p>

// After
<p>Or reach us at <a href={`mailto:${supportEmail}`}>{supportEmail}</a></p>
```

---

## STEP 8 — Update `/api/public/branding` Response (if not done in Step 2)

File: `src/app/api/public/branding/route.ts`

Ensure the response includes `companyName`:

```ts
const tenant = await getTenant();
return NextResponse.json({
  logoUrl: settings?.logoUrl ?? null,
  companyName: tenant?.companyName ?? "COVOS",
  primaryColor: settings?.brandColorPrimary ?? null,
  secondaryColor: settings?.brandColorSecondary ?? null,
  accentColor: settings?.brandColorAccent ?? null,
});
```

This is used by the login page (Sprint 17) and now the client portal and onboarding pages.

---

## VERIFICATION (Run before committing Track C)

```powershell
# 1. TypeScript clean
Set-Location "D:\Work\SEO-Services\ghm-dashboard"
npx tsc --noEmit

# 2. No hardcoded GHM strings remain in these files
$files = @(
  "src/components/layout/nav.tsx",
  "src/components/clients/client-portal-dashboard.tsx",
  "src/components/clients/onboarding-panel.tsx",
  "src/app/(onboarding)/brochure/page.tsx",
  "src/app/(onboarding)/comp-sheet/page.tsx",
  "src/app/(onboarding)/territory-map/page.tsx"
)
foreach ($f in $files) {
  Write-Host "=== $f ===" -ForegroundColor Cyan
  Select-String "ghmmarketing|ghmdigital|GHM Marketing|GHM Digital Marketing" $f
}
# Expected: zero matches (territory city/state content is not a match — that's tenant data)

# 3. Support email removed from onboarding page
Get-ChildItem -Recurse -Include "*.tsx","*.ts" src/app/(onboarding)/ | Select-String "ghmdigital.com"
# Expected: zero matches
```

---

## COMMIT MESSAGE

```
feat: extract tenant identity from UI components and public pages (Track C)

- nav.tsx: logo alt text dynamic from tenant.name
- client-portal-dashboard.tsx: copyright footer from tenant.companyName
- onboarding-panel.tsx: remove GHM hardcoded fallback URL
- brochure/comp-sheet/territory-map pages: companyName from TenantConfig
- Client onboarding form: support email from tenant.supportEmail
- /api/public/branding: include companyName in response
- TypeScript: zero new errors
```
