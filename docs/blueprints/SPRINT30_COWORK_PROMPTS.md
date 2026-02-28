# SPRINT 30 COWORK PROMPTS
**Date:** February 27, 2026

Two prompts below. Run them as simultaneous Cowork sessions — zero file overlap.

---

## TRACK A — Per-Tenant Logo Serving

```
Project: D:\Work\SEO-Services\ghm-dashboard
Task: Wire per-tenant logo serving through TenantConfig

STEP 1 — Extend TenantConfig interface
File: src/lib/tenant/config.ts

Add optional field to TenantConfig interface:
  logoUrl?: string;

Add to covosdemo registry entry:
  logoUrl: "/logos/covos.png",

GHM entry needs no logoUrl (undefined falls back to /logo.png).

STEP 2 — Update /api/public/branding response
File: src/app/api/public/branding/route.ts

Add logoUrl to the JSON response:
  logoUrl: tenant.logoUrl ?? "/logo.png",

STEP 3 — Update login page to use dynamic logo
File: src/app/(auth)/login/page.tsx

The page already fetches /api/public/branding on mount. Extend the branding state to include logoUrl:
  - Add logoUrl to the state object (default: "/logo.png")
  - Set it from the fetch response: data.logoUrl ?? "/logo.png"
  - Replace the static <Image src="/logo.png" ... /> with <Image src={branding.logoUrl} ... />

STEP 4 — Update nav logo
File: src/components/nav.tsx

Nav currently uses a static <Image src="/logo.png" />. 
Add a useEffect that fetches /api/public/branding on mount and stores logoUrl in local state.
Replace static src with the dynamic logoUrl (default "/logo.png" while loading).

STEP 5 — Create placeholder logo directory and file
Run: mkdir public\logos
Copy public\logo.png to public\logos\covos.png
(This is a placeholder — same image, just wired correctly for per-tenant override later)

STEP 6 — TypeScript check
Run: npx tsc --noEmit
Expected: exactly 5 pre-existing errors in scripts/basecamp. Zero new errors.

STEP 7 — Commit
git add src/lib/tenant/config.ts src/app/api/public/branding/route.ts src/components/nav.tsx src/app/(auth)/login/page.tsx public/logos/covos.png
git commit -m "feat: per-tenant logo serving via TenantConfig.logoUrl"
git push
```

---

## TRACK B — Tenant Debug Endpoint + Resolution Hardening

```
Project: D:\Work\SEO-Services\ghm-dashboard
Task: Add /api/debug/tenant endpoint and harden getTenant() resolution

STEP 1 — Harden getTenant() resolution
File: src/lib/tenant/server.ts (or wherever getTenant() is defined)

Read the current implementation of getTenant(). Then ensure it handles these edge cases safely:
- Unknown subdomain not in TENANT_REGISTRY → log a warning, return TENANT_REGISTRY["ghm"] as fallback (do NOT throw/crash)
- Inactive tenant (active: false) → same fallback behavior
- localhost / vercel.app preview URLs → same fallback behavior

The hardened logic should look roughly like:
  const subdomain = host.split(".")[0];
  const tenant = TENANT_REGISTRY[subdomain];
  if (!tenant || !tenant.active) {
    console.warn(`[getTenant] Unknown slug "${subdomain}", falling back to ghm`);
    return TENANT_REGISTRY["ghm"];
  }
  return tenant;

STEP 2 — Create debug endpoint
File: src/app/api/debug/tenant/route.ts (CREATE NEW)

Admin-gated endpoint that returns the currently resolved tenant for the request's hostname.
Use the existing admin auth guard pattern (requireAdmin() or equivalent — look at other admin routes to find the right pattern).

Return JSON:
{
  slug: tenant.slug,
  name: tenant.name,
  companyName: tenant.companyName,
  dashboardUrl: tenant.dashboardUrl,
  hasDatabaseUrl: !!tenant.databaseUrl,
  active: tenant.active,
  resolvedFrom: request.headers.get("host") ?? "unknown",
}

Do NOT include databaseUrl in the response (security).

STEP 3 — TypeScript check
Run: npx tsc --noEmit
Expected: exactly 5 pre-existing errors in scripts/basecamp. Zero new errors.

STEP 4 — Commit
git add src/lib/tenant/server.ts src/app/api/debug/tenant/route.ts
git commit -m "feat: tenant debug endpoint + getTenant() resolution hardening"
git push
```

---

## AFTER BOTH TRACKS MERGE

Verify live:
1. https://covosdemo.covos.app/api/debug/tenant → { slug: "covosdemo", hasDatabaseUrl: true }
2. https://ghm.covos.app/api/debug/tenant → { slug: "ghm", hasDatabaseUrl: false }
3. https://covosdemo.covos.app/login → logo renders from /logos/covos.png
4. https://ghm.covos.app/login → logo unchanged (/logo.png)
