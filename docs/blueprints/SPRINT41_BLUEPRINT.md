# SPRINT 41 — Affiliate Vertical Polish + UI Constitution Groups 6–7
**Date:** March 4, 2026
**Commit target:** Single commit after TypeScript gate passes
**Cowork:** Single agent, sequential phases

---

## CONTEXT

Sprint 38–40 shipped the Ridgeline affiliate vertical (7 Prisma models, 30+ API routes, 7 UI surfaces, seed data). The vertical is structurally complete but the dashboard experience is broken for non-GHM tenants:

1. Post-login redirect always lands on `/sales` — this is a GHM SEO hardcode in `auth.config.ts`
2. `/sales` and `/manager` pages render GHM-specific widgets (SalesToolsPanel, MyBookWidget, MyEarningsWidget, TerritoryHealthBanner) regardless of `verticalType`
3. `affiliate-widgets.tsx` exists and exports 5 correct widgets but is only wired into `/manager` as a conditional block — not as a first-class dashboard
4. The "Test Account" subtitle and "GHM" logo appear because `GlobalSettings` is being read from the GHM DB — needs tenant-aware fallback display
5. UI Constitution Groups 6 (Communication) and 7 (Content/Tutorial) are not yet built for the affiliate vertical — onboarding tour, tooltips, guide character tips, empty state copy all reference SEO context

---

## PHASE 1 — Fix Post-Login Redirect (tenant-aware routing)

**File:** `src/lib/auth/auth.config.ts`

Current code (line ~92):
```ts
const dest = user?.role === "manager" || user?.role === "admin" ? "/manager" : "/sales";
```

**Problem:** This redirect fires when a logged-in user hits a public path (e.g. `/login`). It always sends to `/manager` or `/sales` regardless of vertical. The tenant header is NOT available in edge auth config — `verticalType` cannot be read here.

**Solution:** Both `/manager` and `/sales` already exist and must remain. Instead, make each page detect its vertical and redirect internally if needed.

- In `src/app/(dashboard)/sales/page.tsx`: Add tenant read at top. If `tenant.verticalType === "affiliate_portfolio"`, redirect to `/dashboard` (new affiliate dashboard route).
- In `src/app/(dashboard)/manager/page.tsx`: Same pattern — if affiliate vertical, redirect to `/dashboard`.
- Create `src/app/(dashboard)/dashboard/page.tsx` — the affiliate vertical home page (see Phase 2).

No changes to `auth.config.ts` needed. Auth redirect stays as-is; the individual pages handle vertical routing.

---

## PHASE 2 — Affiliate Dashboard Page

**Create:** `src/app/(dashboard)/dashboard/page.tsx`

This is the landing page for `affiliate_portfolio` vertical users. It replaces `/sales` and `/manager` for Ridgeline.

**Data to fetch (server component):**
```ts
const tenant = await requireTenant();
// Redirect non-affiliate tenants away
if (tenant.verticalType !== "affiliate_portfolio") redirect("/manager");

const [sites, revenueEntries, networks, briefs, valuations] = await Promise.all([
  prisma.affiliateSite.findMany({ where: { tenantId: ... }, select: { id, domain, status, monthlyRevenueCurrent, monthlyTrafficCurrent } }),
  prisma.affiliateRevenueEntry.findMany({ where: { tenantId: ... }, orderBy: [{ year: "desc" }, { month: "desc" }], take: 120 }),
  prisma.displayAdNetwork.findMany({ where: { tenantId: ... } }),
  prisma.affiliateContentBrief.findMany({ where: { tenantId: ... } }),
  prisma.siteValuation.findMany({ where: { tenantId: ... }, orderBy: { valuationDate: "desc" } }),
])
```

**Layout:**
```
<page header: "My Dashboard" + tenant.companyName subtitle>
<MetricsRow: 4 tiles — Total Sites | Active Sites | Portfolio MRR | Portfolio Value>
<grid: 2 cols>
  <AffiliateWidgetPanel /> (imports all 5 widgets from affiliate-widgets.tsx)
<RefreshOnFocus />
```

**MetricsRow tiles (calculated server-side):**
- Total Sites: `sites.length`
- Active Sites: `sites.filter(s => s.status === "ACTIVE").length`
- Portfolio MRR: sum of `monthlyRevenueCurrent` across all active sites
- Portfolio Value: latest valuation `estimatedValue` or "—" if none

Pass all data as props to a client wrapper component `AffiliateDashboardClient` (similar to `MasterPageClient` pattern).

---

## PHASE 3 — Affiliate Widget Panel Wire-Up

**File:** `src/components/dashboard/affiliate-widgets.tsx`

The 5 widgets already exist: `TopEarnersWidget`, `RevenueOverTimeWidget`, `DisplayAdProgressWidget`, `ContentVelocityWidget`, `PortfolioValuationWidget`.

**Current problem:** `AffiliateWidgetPanel` in `manager/page.tsx` is a conditional branch inside the GHM dashboard, not a standalone component. Extract it properly.

**Task:** Ensure `AffiliateWidgetPanel` is exported and accepts the full `WidgetProps` type. No new widgets needed — the 5 are correct. Just make sure they wire cleanly into the new `/dashboard` page.

---

## PHASE 4 — Dashboard Display Name Fix

**Problem:** Dashboard header shows "Test Account" as subtitle and "GHM" as logo because `GlobalSettings` hasn't been seeded for the Ridgeline tenant.

**Fix — two parts:**

**Part A:** `src/app/(dashboard)/dashboard/page.tsx` — use `tenant.companyName` directly from `TenantConfig` as the subtitle. Do NOT read from `GlobalSettings` on this page. Pattern:
```tsx
<p className="text-muted-foreground text-sm">{tenant.companyName}</p>
```

**Part B:** `src/components/dashboard/nav.tsx` — the logo area currently reads from `GlobalSettings.logoUrl`. Add a fallback: if `logoUrl` is null/empty, display `tenant.name` as text (same as TenantLogo component fallback). This is already how `TenantLogo` works — ensure nav uses `TenantLogo` component rather than a raw `<Image>` with no fallback.

---

## PHASE 5 — GHM Widget Suppression on `/manager` and `/sales`

**Files:** `src/app/(dashboard)/manager/page.tsx`, `src/app/(dashboard)/sales/page.tsx`

These pages already redirect affiliate tenants (Phase 1), so this is a belt-and-suspenders guard plus cleanup.

In `manager/page.tsx`: The `AffiliateWidgetPanel` conditional block that currently exists should be removed — that logic now lives in `/dashboard/page.tsx`. Keep the page clean for SEO vertical only.

In `sales/page.tsx`: Add vertical redirect (Phase 1 action). No widget changes needed since the page redirects before rendering.

---

## PHASE 6 — Guide Character: Affiliate Tips

**File:** `src/components/guide/guide-config.ts`

The Guide Character (sardonic tips per route) currently only has SEO routes. Add affiliate routes:

```ts
"/dashboard": [
  "Your portfolio's not going to grow itself. Check what's ranking.",
  "Revenue sitting flat? Might be time to refresh some content.",
],
"/sites": [
  "Every site here is either climbing or sliding. No in-between.",
  "That dormant site isn't resting — it's dying.",
],
"/sites/[id]": [
  "Deep dive time. This site either has a future or it doesn't.",
],
"/acquisitions": [
  "The best time to buy a domain was yesterday. Second best: now.",
  "Due diligence isn't optional. It just feels that way.",
],
"/revenue": [
  "Numbers don't lie. Unfortunately.",
  "If you're not tracking it, you're guessing.",
],
"/content-studio": [
  "Content is how sites eat. Don't let them starve.",
  "Every article is a lottery ticket. Buy more tickets.",
],
```

Use dynamic route matching pattern already in place in guide-config.ts (check how existing routes handle `/clients/[id]` pattern).

---

## PHASE 7 — Onboarding Tour: Affiliate Vertical

**File:** `src/components/onboarding/onboarding-tutorial.tsx` (or wherever Driver.js tours are defined)

First check: read the current tour implementation to understand how steps are structured. Tours are currently defined for the SEO vertical. Add an affiliate-vertical tour that fires for Ridgeline tenant users.

**Trigger:** Same first-visit logic as existing tour. Add vertical detection: if `verticalType === "affiliate_portfolio"`, use affiliate steps instead of SEO steps.

**Affiliate tour steps (7 steps):**

1. **Welcome** — "This is your portfolio command center. Everything about your sites, revenue, and content lives here."
2. **Sites** (highlight nav link) — "Your Sites list is the heart of the platform. Each site has its own detail view with revenue, content, and affiliate programs."
3. **Revenue** (highlight nav link) — "Track earnings across every site and every affiliate network in one place."
4. **Acquisition Pipeline** (highlight nav link) — "Evaluating a new site to buy? Track your targets here from research through close."
5. **Content** (highlight nav link) — "Content is what drives rankings and revenue. Manage briefs, track publish dates, and see what's actually earning."
6. **Top Earners widget** (highlight widget) — "Your top 5 earners at a glance. If one drops off, you'll know immediately."
7. **Help menu** (highlight) — "You can restart this tour anytime from the Help menu."

**Implementation:** Read the existing tour to understand the Driver.js step format before writing. Match the exact API already in use. Do NOT install new libraries.

---

## PHASE 8 — Affiliate Empty State Copy Audit

**Files:** Any component that renders an `EmptyState` component for affiliate vertical routes.

Check these files and update copy to be affiliate-appropriate (not SEO-agency copy):

- `src/app/(dashboard)/sites/page.tsx` — empty state should say something like "No sites yet. Add your first affiliate property to get started."
- `src/app/(dashboard)/acquisitions/page.tsx` — "No acquisition targets yet. Start tracking domains you're evaluating."
- `src/app/(dashboard)/revenue/page.tsx` — "No revenue data yet. Connect your first affiliate program or add a manual entry."
- Any other affiliate route with a generic or SEO-flavored empty state

Pattern: read each page, find EmptyState usage, rewrite copy if it's generic/wrong vertical.

---

## PHASE 9 — TypeScript Gate + Commit

```bash
cd D:\Work\SEO-Services\ghm-dashboard
npx tsc --noEmit
```

**Acceptable:** ≤10 errors, all pre-existing (basecamp-crawl, import-wave-history, team/presence/route, GuideCharacter, lead-filter-bar-advanced, basecamp/client, typing-store). Zero new errors in any Sprint 41 file.

If new errors exist, fix them before committing.

**Commit message:**
```
feat: Sprint 41 — affiliate dashboard, vertical routing, guide tips, onboarding tour
```

Then update STATUS.md and BACKLOG.md (close Sprint 41, update Last Updated header).

---

## DONE CRITERIA

- [ ] Logging in as `test@account.com` on Ridgeline tenant lands on `/dashboard`, not `/sales`
- [ ] `/dashboard` shows affiliate widgets: Total Sites, Portfolio MRR, Top Earners, Revenue Over Time, Display Ad Progress, Content Velocity, Portfolio Valuation
- [ ] Dashboard header shows "Ridgeline Media" subtitle, not "Test Account" or "GHM"
- [ ] Nav shows affiliate groups (Portfolio, Operations, Resources) — no SEO groups visible
- [ ] Guide Character shows affiliate-specific tips on `/dashboard`, `/sites`, `/revenue`, `/acquisitions`
- [ ] Onboarding tour fires on first visit and walks through 7 affiliate-specific steps
- [ ] Empty state copy on Sites, Acquisitions, Revenue pages is affiliate-appropriate
- [ ] GHM tenant unaffected — `/manager` and `/sales` still work normally
- [ ] TypeScript gate: zero new errors
- [ ] STATUS.md + BACKLOG.md updated, commit pushed

---

## FILES EXPECTED TO CHANGE

**New files:**
- `src/app/(dashboard)/dashboard/page.tsx`
- `src/components/dashboard/AffiliateDashboardClient.tsx`

**Modified files:**
- `src/app/(dashboard)/sales/page.tsx` (add vertical redirect)
- `src/app/(dashboard)/manager/page.tsx` (add vertical redirect, remove affiliate widget block)
- `src/components/dashboard/nav.tsx` (logo fallback fix)
- `src/components/guide/guide-config.ts` (affiliate routes)
- `src/components/onboarding/onboarding-tutorial.tsx` (affiliate tour)
- `src/app/(dashboard)/sites/page.tsx` (empty state copy)
- `src/app/(dashboard)/acquisitions/page.tsx` (empty state copy)
- `src/app/(dashboard)/revenue/page.tsx` (empty state copy)
- `src/components/dashboard/affiliate-widgets.tsx` (export cleanup if needed)
- `STATUS.md`, `BACKLOG.md`
