# SPRINT 28 — TRACK A BLUEPRINT
# COVOS Core Extraction: TenantConfig + Email/Templates
**Date:** February 26, 2026
**Track:** A (must run before Tracks B and C)
**Estimated time:** 3–4 hrs
**Files touched (exclusive — no overlap with B or C):**
- `src/lib/tenant/config.ts`
- `src/lib/email/index.ts`
- `src/lib/email/templates.ts`
- `src/lib/reports/template.ts`
- `src/lib/audit/template.ts`
- `src/lib/pdf/work-order-template.tsx`

**TypeScript must be clean after this track. Run `npx tsc --noEmit` before marking done.**

---

## STEP 1 — Extend TenantConfig Interface

File: `src/lib/tenant/config.ts`

### 1A. Add new fields to the interface

Find the current interface:
```ts
export interface TenantConfig {
  slug: string;
  name: string;
  databaseUrl?: string;
  logoUrl?: string;
  primaryColor?: string;
  active: boolean;
  providers?: Partial<TenantProviderConfig>;
}
```

Replace with:
```ts
export interface TenantConfig {
  // Core identity
  slug: string;
  name: string;           // Short display name: "GHM Digital Marketing"
  companyName: string;    // Full legal entity: "GHM Digital Marketing Inc"
  companyTagline?: string; // Footer/subheading: "Digital Marketing Solutions"

  // Email
  fromEmail: string;      // Outbound from address: "noreply@ghmmarketing.com"
  fromName: string;       // From display name: "GHM Marketing"
  supportEmail: string;   // Contact/help links: "support@ghmdigital.com"

  // URLs
  dashboardUrl: string;   // Base app URL: "https://ghm.covos.app"

  // AI
  aiContext?: string;     // Injected into AI system prompts as platform description

  // Branding (future use — read from GlobalSettings for now)
  logoUrl?: string;
  primaryColor?: string;

  // Infrastructure
  databaseUrl?: string;   // Override DATABASE_URL for this tenant
  active: boolean;

  // Vendors
  providers?: Partial<TenantProviderConfig>;
}
```

### 1B. Update the GHM registry entry

Find:
```ts
  ghm: {
    slug: "ghm",
    name: "GHM Digital Marketing",
    active: true,
    providers: {
      accounting: 'wave',
      domain:     'godaddy',
      payroll:    'wave',
      email:      'resend',
    },
  },
```

Replace with:
```ts
  ghm: {
    slug: "ghm",
    name: "GHM Digital Marketing",
    companyName: "GHM Digital Marketing Inc",
    companyTagline: "Digital Marketing Solutions",
    fromEmail: "noreply@ghmmarketing.com",
    fromName: "GHM Marketing",
    supportEmail: "support@ghmdigital.com",
    dashboardUrl: "https://ghm.covos.app",
    aiContext: "enterprise SEO services platform for local businesses",
    active: true,
    providers: {
      accounting: 'wave',
      domain:     'godaddy',
      payroll:    'wave',
      email:      'resend',
    },
  },
```

**Verification:** `npx tsc --noEmit` — TypeScript will flag every place `TenantConfig` is used without the new required fields. That's correct behavior — follow the errors to find any other registry entries or usages that need updating.

---

## STEP 2 — Extract `src/lib/email/index.ts`

### 2A. Remove module-level hardcoded constants (top of file)

Find:
```ts
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@ghmmarketing.com";
const FROM_NAME = "GHM Marketing";
```

Replace with (remove entirely — these will come from tenant parameter):
```ts
// FROM_EMAIL and FROM_NAME are now per-tenant. See TenantConfig.fromEmail / .fromName
```

### 2B. Update every email-sending function signature

Each public function in this file needs to accept `tenant: TenantConfig` as a parameter. Pattern:

```ts
// Before
export async function sendWorkOrderEmail(params: WorkOrderEmailParams) {
  const from = `${FROM_NAME} <${FROM_EMAIL}>`;
  ...
}

// After
import type { TenantConfig } from "@/lib/tenant/config";

export async function sendWorkOrderEmail(
  params: WorkOrderEmailParams,
  tenant: TenantConfig,
) {
  const from = `${tenant.fromName} <${tenant.fromEmail}>`;
  ...
}
```

Apply this pattern to EVERY exported function in the file.

### 2C. Replace all hardcoded strings inside email templates

For each occurrence, use the tenant parameter:

| Old string | Replacement |
|-----------|-------------|
| `GHM Marketing` (in h1/header) | `${tenant.fromName}` |
| `GHM Digital Marketing Inc` (in footer) | `${tenant.companyName}` |
| `GHM Marketing · Digital Marketing Solutions` | `${tenant.fromName} · ${tenant.companyTagline ?? ""}` |
| `from GHM Marketing.` | `from ${tenant.fromName}.` |
| `https://app.ghmdigital.com/clients/onboarding/${submissionId}` | `${tenant.dashboardUrl}/clients/onboarding/${submissionId}` |
| `"GHM's payment system"` | `"${tenant.fromName}'s payment system"` |
| `"The GHM Team"` | `"The ${tenant.name} Team"` |
| `GHM Marketing Dashboard — automated notification` | `${tenant.name} Dashboard — automated notification` |

### 2D. Update all callers of email functions

Search for every call to email functions in `src/app/api/`:
```powershell
Get-ChildItem -Recurse -Include "*.ts" src/app/api/ | Select-String "sendWorkOrderEmail|sendStatusNotification|sendContractorWaveInvite|sendPartnerOnboardingEmail|sendNotificationEmail|sendReportEmail"
```

Each call site must now pass `tenant` as the final argument. The API route already has access to tenant context via `requireTenant()`. Pattern:

```ts
// Before
await sendNotificationEmail({ ... });

// After
const tenant = await requireTenant();
await sendNotificationEmail({ ... }, tenant);
```

---

## STEP 3 — Extract `src/lib/email/templates.ts`

### 3A. Remove module-level FROM_EMAIL constant

Find:
```ts
const FROM_EMAIL = process.env.FROM_EMAIL || "reports@ghmdigital.com";
```

Remove entirely. Functions must accept tenant parameter (same pattern as Step 2).

### 3B. Update function signatures

Same pattern as Step 2B — add `tenant: TenantConfig` parameter.

### 3C. Replace hardcoded strings

| Old string | Replacement |
|-----------|-------------|
| `GHM Digital Marketing Inc` (copyright footers × 3) | `${tenant.companyName}` |
| `hello@ghmdigital.com` (contact link) | `${tenant.supportEmail}` |

---

## STEP 4 — Extract `src/lib/reports/template.ts`

### 4A. Update function signature

`generateReportHTML(reportData: any)` → `generateReportHTML(reportData: any, tenant: TenantConfig)`

### 4B. Replace footer string

Find:
```ts
<p>Generated by GHM Digital Marketing Inc • ${formatDate(new Date())}</p>
```

Replace with:
```ts
<p>Generated by ${tenant.companyName} • ${formatDate(new Date())}</p>
```

### 4C. Update caller

Search for `generateReportHTML(` — the call site must pass tenant context.

---

## STEP 5 — Extract `src/lib/audit/template.ts`

### 5A. Update function signature(s)

Add `tenant: TenantConfig` parameter to all exported functions.

### 5B. Replace hardcoded strings

| Old string | Replacement |
|-----------|-------------|
| `GHM Digital Marketing Inc — Your SEO Preview:` (title tag) | `${tenant.companyName} — Your SEO Preview:` |
| `GHM Digital Marketing Inc` (brand header / logo text × 2) | `${tenant.companyName}` |
| `GHM Digital Marketing Inc` (footer) | `${tenant.companyName}` |
| `Contact GHM Digital Marketing Inc for a comprehensive strategy session.` | `Contact ${tenant.companyName} for a comprehensive strategy session.` |
| `<div class="cover-logo">GHM Digital Marketing Inc</div>` | `<div class="cover-logo">${tenant.companyName}</div>` |

### 5C. Update callers

Search for usages of audit template functions in `src/app/api/` and pass tenant.

---

## STEP 6 — Extract `src/lib/pdf/work-order-template.tsx`

### 6A. Update component/function props

Add `tenant: TenantConfig` to the props or function parameters.

### 6B. Replace hardcoded strings

| Old string | Replacement |
|-----------|-------------|
| `<Text style={styles.companyName}>GHM Marketing</Text>` | `<Text style={styles.companyName}>{tenant.fromName}</Text>` |
| `GHM Marketing · Digital Marketing Solutions{"\n"}` | `{tenant.fromName} · {tenant.companyTagline ?? ""}{"\n"}` |

### 6C. Update callers

Search for `work-order-template` or `WorkOrderTemplate` usage. Pass tenant.

---

## STEP 7 — (Optional, Sprint 28) SALARY_ONLY_USER_IDS

If time permits, move to TenantConfig.

File: `src/lib/payments/calculations.ts`

Find:
```ts
const SALARY_ONLY_USER_IDS = [4];
```

Move to `TenantConfig`:
```ts
// In TenantConfig interface:
salaryOnlyUserIds?: number[];  // User IDs who receive salary only, never engine-generated payments

// In TENANT_REGISTRY.ghm:
salaryOnlyUserIds: [4],  // Gavin
```

In calculations.ts:
```ts
// Pass tenant to calculatePayments / relevant functions
const salaryOnlyIds = tenant.salaryOnlyUserIds ?? [];
if (salaryOnlyIds.includes(masterManagerId)) { ... }
```

This is the correct permanent home for this rule. Skip to Sprint 29 if time is tight.

---

## VERIFICATION (Run before committing Track A)

```powershell
# 1. TypeScript clean
Set-Location "D:\Work\SEO-Services\ghm-dashboard"
npx tsc --noEmit

# 2. No hardcoded GHM strings remain in email/templates/reports/audit/pdf
$files = "src/lib/email/index.ts","src/lib/email/templates.ts","src/lib/reports/template.ts","src/lib/audit/template.ts","src/lib/pdf/work-order-template.tsx"
foreach ($f in $files) {
  Write-Host "=== $f ===" -ForegroundColor Cyan
  Select-String "ghmmarketing|ghmdigital|GHM Marketing|GHM Digital Marketing" $f
}
# Expected: zero matches in all 5 files

# 3. TenantConfig has all new fields
Select-String "fromEmail|companyName|dashboardUrl|supportEmail" src/lib/tenant/config.ts
# Expected: definitions present in interface AND ghm registry entry
```

---

## COMMIT MESSAGE

```
feat: extract tenant identity from hardcoded GHM strings (Track A)

- Extend TenantConfig interface with companyName, fromEmail, fromName,
  supportEmail, dashboardUrl, companyTagline, aiContext
- Update TENANT_REGISTRY.ghm with all new field values
- Parameterize email/templates/report/audit/work-order functions with tenant
- Remove module-level FROM_EMAIL/FROM_NAME constants
- All email templates now render from TenantConfig — zero GHM hardcoding
  in email/template/pdf layer
- TypeScript: zero new errors
```
