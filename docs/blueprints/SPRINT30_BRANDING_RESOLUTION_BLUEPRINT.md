# SPRINT 30 — BLUEPRINT
# Tenant Branding Completion + Resolution Hardening
**Date:** February 27, 2026
**Prerequisite:** Sprint 29 complete (covosdemo.covos.app live)
**Estimated time:** 1 session (~2–3 hrs Cowork)
**Goal:** covosdemo.covos.app shows COVOS branding (not GHM logo). Tenant resolution is verified and hardened.

---

## CONTEXT

Sprint 29 dry-run exposed two gaps:
1. Logo is still `/logo.png` (static, GHM branding) — not tenant-aware
2. No way to verify at runtime which tenant config is being resolved for a given request

Both must be closed before any real client sees the platform.

---

## TRACK A — Per-Tenant Logo Serving
**Files:** config.ts, branding/route.ts, nav.tsx, login/page.tsx
**No conflicts with Track B**

### A1. Extend TenantConfig

File: `src/lib/tenant/config.ts`

Add `logoUrl` field to the `TenantConfig` interface:

```ts
export interface TenantConfig {
  slug: string;
  name: string;
  companyName: string;
  companyTagline: string;
  fromEmail: string;
  fromName: string;
  supportEmail: string;
  dashboardUrl: string;
  databaseUrl?: string;
  active: boolean;
  providers: { ... };
  logoUrl?: string; // NEW — full URL or absolute path. Falls back to /logo.png if unset.
}
```

Update GHM registry entry — no logoUrl needed (falls back to /logo.png, which IS the GHM logo).

Update covosdemo registry entry — add:
```ts
logoUrl: "/logos/covos.png", // placeholder — actual asset TBD
```

### A2. Update /api/public/branding

File: `src/app/api/public/branding/route.ts`

Add `logoUrl` to the response:
```ts
return NextResponse.json({
  companyName: tenant.companyName,
  supportEmail: tenant.supportEmail,
  logoUrl: tenant.logoUrl ?? "/logo.png",  // NEW
  // ... existing fields
});
```

### A3. Update nav.tsx logo

File: `src/components/nav.tsx`

The nav logo currently renders `<Image src="/logo.png" ... />`.

Change to: fetch `logoUrl` from `useBranding()` hook (or directly from the branding context if already available), render `<Image src={logoUrl} ... />` with fallback to `/logo.png`.

If no branding hook exists yet, read from `/api/public/branding` via `useEffect` on mount (same pattern as `welcome/[token]/page.tsx`).

### A4. Update login page logo

File: `src/app/(auth)/login/page.tsx`

Login page already fetches from `/api/public/branding` on mount (FEAT-018). Extend to also use `logoUrl` from the response:

```ts
const [branding, setBranding] = useState({ logoUrl: "/logo.png", companyName: "" });

// in the useEffect fetch:
setBranding({
  logoUrl: data.logoUrl ?? "/logo.png",
  companyName: data.companyName,
});

// in JSX:
<Image src={branding.logoUrl} alt={branding.companyName} ... />
```

### A5. Create placeholder logo for covosdemo

Create `/public/logos/` directory.
Copy `/public/logo.png` to `/public/logos/covos.png` as placeholder.
(Real COVOS logo asset can replace this later with no code change.)

### A6. Verification

1. `npx tsc --noEmit` — zero new errors
2. Visit `covosdemo.covos.app/login` — logo should be covos.png (visually same as GHM for now, but wired correctly)
3. Visit `ghm.covos.app/login` — logo should be /logo.png (unchanged)

### A7. Commit

```
git add src/lib/tenant/config.ts src/app/api/public/branding/route.ts src/components/nav.tsx src/app/(auth)/login/page.tsx public/logos/covos.png
git commit -m "feat: per-tenant logo serving via TenantConfig.logoUrl"
git push
```

---

## TRACK B — Tenant Resolution Smoke Test + Hardening
**Files:** tenant/server.ts (new debug route), middleware or getTenant()
**No conflicts with Track A**

### B1. Add /api/debug/tenant endpoint

File: `src/app/api/debug/tenant/route.ts` (NEW)

Admin-gated — returns current resolved tenant config (minus databaseUrl for security):

```ts
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards"; // use existing admin guard
import { getTenant } from "@/lib/tenant/server";

export async function GET(request: Request) {
  await requireAdmin(); // throws 401/403 if not admin
  
  const tenant = await getTenant();
  
  return NextResponse.json({
    slug: tenant.slug,
    name: tenant.name,
    companyName: tenant.companyName,
    dashboardUrl: tenant.dashboardUrl,
    hasDatabaseUrl: !!tenant.databaseUrl,
    active: tenant.active,
    resolvedFrom: request.headers.get("host") ?? "unknown",
  });
}
```

### B2. Verify getTenant() hostname parsing

File: `src/lib/tenant/server.ts` (or wherever getTenant() lives)

Verify the hostname slug extraction handles these cases:
- `covosdemo.covos.app` → slug = `covosdemo` ✅
- `ghm.covos.app` → slug = `ghm` ✅
- `localhost:3000` → slug fallback (should default to `ghm` or first active tenant)
- `ghm-marketing.vercel.app` → slug fallback
- Unknown slug not in registry → should NOT crash, should return a safe fallback + log warning

If any of these cases are unhandled, add guards:

```ts
export async function getTenant(): Promise<TenantConfig> {
  const host = headers().get("host") ?? "";
  const subdomain = host.split(".")[0];
  
  const tenant = TENANT_REGISTRY[subdomain];
  
  if (!tenant || !tenant.active) {
    console.warn(`[getTenant] Unknown or inactive tenant slug: "${subdomain}", falling back to ghm`);
    return TENANT_REGISTRY["ghm"];
  }
  
  return tenant;
}
```

### B3. Test the debug endpoint

After deploy, hit:
- `https://covosdemo.covos.app/api/debug/tenant` (as admin) → should show `slug: "covosdemo"`, `hasDatabaseUrl: true`
- `https://ghm.covos.app/api/debug/tenant` (as admin) → should show `slug: "ghm"`, `hasDatabaseUrl: false`

If either shows wrong slug → resolution is broken and needs fix before Sprint 31.

### B4. Commit

```
git add src/app/api/debug/tenant/route.ts src/lib/tenant/server.ts
git commit -m "feat: tenant debug endpoint + resolution hardening"
git push
```

---

## PARALLEL EXECUTION STRATEGY

These tracks have zero file overlap. Run as two simultaneous Cowork sessions:

**Session 1:** Execute Track A (logo wiring)
**Session 2:** Execute Track B (debug endpoint + resolution hardening)

Both can push to main — no merge conflicts possible given disjoint file sets.

---

## TRACK C — DNS / Vercel Domain Fixes (No Code — Browser Only)
**Handled by Claude in Browser — not a Cowork task**

Issues to resolve:
1. `ghm.covos.app` — "DNS Change Recommended" → needs CNAME `ghm` → `cname.vercel-dns.com` in Namecheap (wildcard `*` should cover this — investigate why Vercel still flags it)
2. `covos.app` — "DNS Change Recommended" → Vercel wants an A record `76.76.21.21` or CNAME; check current Namecheap A record
3. `*.covos.app` — "Invalid Configuration" → wildcard CNAMEs may not be supported at Vercel free tier; may need to remove `*.covos.app` from Vercel and rely on explicit subdomain entries instead

---

## POST-SPRINT CHECKLIST

- [ ] `covosdemo.covos.app/login` shows correct (non-GHM) logo
- [ ] `/api/debug/tenant` returns correct slug for each subdomain
- [ ] DB isolation confirmed: covosdemo tenant has `hasDatabaseUrl: true`
- [ ] No TypeScript errors
- [ ] STATUS.md updated

---

## NEXT SPRINT (31) — Easter Agency Tenant

Once The Easter Agency LLC forms (~2 weeks), run the full TENANT_PROVISIONING.md checklist:
1. Create `easter` Neon database
2. Add `easter` to TENANT_REGISTRY with real logo, emails, branding
3. Add `easter.covos.app` (or custom domain) to Vercel
4. Push schema, verify isolation
5. Migrate GHM clients → Easter as needed
