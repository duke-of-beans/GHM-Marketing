# SPRINT 38-40 — TRACK B BRIEF
# Task: Add module toggle config and terminology config for Affiliate Vertical

## Context
Project: D:\Work\SEO-Services\ghm-dashboard
Track A (Prisma models) must be complete before this track runs.

## Step 1: Read these files first
Read: src/lib/tenant/config.ts
Read: src/lib/tenant/server.ts
Understand how TenantConfig is typed and how terminology/module resolution currently works.

## Step 2: Add verticalType to TenantConfig

In src/lib/tenant/config.ts, find the TenantConfig type and add this field:
```typescript
verticalType?: 'seo_agency' | 'affiliate_portfolio' | 'generic'
```

## Step 3: Add AFFILIATE_MODULE_DEFAULTS to src/lib/tenant/config.ts

Export this constant from the config file:
```typescript
export const AFFILIATE_MODULE_DEFAULTS = {
  // ON — core affiliate operations
  sitePortfolio: true,
  contentCalendar: true,
  taskManagement: true,
  acquisitionPipeline: true,
  affiliateProgramRegistry: true,
  displayAdNetworks: true,
  revenueDashboard: true,
  portfolioIntelligence: true,
  siteValuation: true,
  vault: true,
  teamManagement: true,
  reporting: true,
  // OFF — SEO agency modules not needed for affiliate ops
  waveBilling: false,
  partnerManagement: false,
  googleBusinessProfile: false,
  googleAds: false,
  workOrders: false,
  proposals: false,
  clientPortal: false,
  territories: false,
  timeTracking: false,
  leadPipeline: false,
}
```

## Step 4: Add AFFILIATE_TERMINOLOGY to src/lib/tenant/config.ts

Export this constant from the config file:
```typescript
export const AFFILIATE_TERMINOLOGY = {
  client: 'Site',
  clients: 'Sites',
  clientSingular: 'site',
  lead: 'Target',
  leads: 'Targets',
  pipeline: 'Acquisition Pipeline',
  rep: 'Content Manager',
  reps: 'Content Managers',
  partner: 'Contractor',
  partners: 'Contractors',
  clientHealth: 'Site Health',
  newClient: 'Add Site',
  workOrder: null,
}
```

## Step 5: Wire terminology into the tenant resolver

In src/lib/tenant/server.ts, find the function that returns terminology (however it is currently structured). Add a condition: when tenant.config.verticalType === 'affiliate_portfolio', return AFFILIATE_TERMINOLOGY instead of the default terms. Preserve all existing behavior for other verticalType values.

Import AFFILIATE_TERMINOLOGY from config.ts if needed.

## Done
Report: "Track B complete — verticalType added to TenantConfig, AFFILIATE_MODULE_DEFAULTS and AFFILIATE_TERMINOLOGY exported, terminology resolver wired."
