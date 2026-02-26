# SPRINT 26 — Visual Redesign: Signal Expression
**Last Updated:** February 26, 2026
**Scope:** Transform dashboard from stock shadcn components to COVOS Signal visual identity
**Execution:** 4-pass Cowork execution — each pass is collision-free
**Codebase:** D:\Work\SEO-Services\ghm-dashboard
**Reference:** David's COVOS mockup (deep navy sidebar, minimal metric cards, clean typography)

---

## Context & Problem

The COVOS Signal color token system is fully defined and live in `globals.css`. Semantic tokens (`--background`, `--foreground`, `--primary`, `--card`, `--sidebar-*`, `--status-*`, etc.) are correct. Sprints 23–25 standardized spacing, typography scale, icon sizes, dark mode, and eliminated hardcoded colors.

**But the components still look like stock shadcn/ui.** The tokens are defined — the visual identity is not expressed. The sidebar uses `bg-muted/50` instead of the dedicated `--sidebar-*` tokens. Metric cards are default bordered Card components. Quick Actions use chunky colored row backgrounds. Buttons are generic. Nothing says "premium platform."

**Target:** The dashboard should feel like Linear, Xero, or Stripe Dashboard — restrained, dense, confident. Not flashy. Not a tutorial app. A tool for someone who uses it 8 hours a day.

### Reference Mockup Annotations

David provided a COVOS concept mockup showing:
- Deep navy sidebar (permanent, same in light/dark) with COVOS wordmark, indigo active highlight, muted inactive items, "Powered by COVOS" footer
- Minimal metric cards — large number, small label above, colored accent badges (green "+3", red "high", amber "today")
- Clean Client Health list — colored dot indicators, numeric scores, no card borders
- Amber "New Lead" CTA button using the accent token
- Overall: maximum information density, minimum visual noise

### Current State (problems)

1. **Sidebar** (`nav.tsx`) — Uses `bg-muted/50` (light gray in light, transparent in dark). Active link: `bg-primary text-primary-foreground` = loud indigo rectangle. Groups use `text-muted-foreground/70`. Bottom section uses generic `border-t`. No COVOS wordmark. No "Powered by" footer. No persistent dark navy.
2. **Metric cards** (`metric-card.tsx`) — Stock Card with `CardHeader` (p-6) + `CardContent` (p-6 pt-0). Too much padding. Border visible. Shadow visible. Result: each card looks like a separate island rather than part of an information-dense row.
3. **Quick Actions** (`dashboard-widgets.tsx`) — Hardcoded per-action colors (`bg-blue-50`, `bg-purple-50`, etc.). Each row has its own background fill, icon background, and description text. Result: looks like a colorful tutorial app.
4. **Revenue Performance** (`dashboard-widgets.tsx`) — Hardcoded green gradient `from-green-50 to-emerald-50` with dark overrides. Border: `border-status-success-border`. Should use token-based neutral card with accent text only.
5. **Goals widget** (`dashboard-widgets.tsx`) — Progress bars use `bg-blue-500` (hardcoded) and `bg-status-success-bg` (too light for a bar). Should use `bg-primary` and `bg-status-success`.
6. **Dashboard heading** (`manager/page.tsx`) — Generic `text-2xl font-bold` + subtitle text. No contextual CTA. Mockup shows "New Lead" amber button in the heading row.
7. **Card base** (`ui/card.tsx`) — Default: `rounded-lg border bg-card text-card-foreground shadow`. The `shadow` and `border` together create a heavy double-emphasis. Premium dashboards use one or the other, not both.
8. **Button base** (`ui/button.tsx`) — `outline` variant hovers to `bg-accent text-accent-foreground`. Accent is amber, which causes the yellow flash visible in the Settings screenshot. Ghost variant same issue. These should hover to `bg-muted` instead.

---

## Pass Architecture

| Pass | Focus | Touches | Collision Risk |
|------|-------|---------|---------------|
| 1 | Sidebar Redesign | `nav.tsx`, `globals.css` (utility classes) | None with 2/3/4 |
| 2 | Dashboard Widgets | `metric-card.tsx`, `dashboard-widgets.tsx`, `MetricsRow.tsx`, `manager/page.tsx` | None with 1/3/4 |
| 3 | Core Component Polish | `ui/card.tsx`, `ui/button.tsx`, `ui/select.tsx`, `ui/badge.tsx` + global overrides in `globals.css` | None with 1/2/4 |
| 4 | Page-Level Sweep | All `(dashboard)/**/*.tsx` pages — clean up any remaining stock patterns | None with 1/2/3 |

---

## ═══════════════════════════════════════════════════════════════════
## PASS 1: SIDEBAR REDESIGN
## ═══════════════════════════════════════════════════════════════════

### What Changes

The sidebar currently uses generic semantic tokens (`bg-muted/50`, `text-muted-foreground`, `hover:bg-muted`). Signal defines dedicated sidebar tokens that give it the permanent deep navy appearance from the mockup. Those tokens exist in `globals.css` but `nav.tsx` doesn't use them.

### Token Reference (already in globals.css — DO NOT MODIFY)

```
--sidebar: 220 38% 9%;                /* #0c1222 — deep navy */
--sidebar-foreground: 213 17% 64.5%;  /* #93a3b8 — muted silver */
--sidebar-muted: 215 21% 37%;         /* #4b5c72 — dimmed group labels */
--sidebar-active: 229.7 93.8% 81.8%;  /* indigo-300 #a5b4fc — active text */
--sidebar-active-bg: 229 93% 81% / 0.10;  /* indigo-300 at 10% — active bg */
--sidebar-border: 220 30% 18%;        /* slate-800 #1e293b — divider */
```

These are IDENTICAL in light and dark mode — the sidebar never changes appearance.

### Tailwind Utility Classes to Add (globals.css — @layer utilities)

Add these below the existing `touch-target` utility:

```css
/* Sidebar token utilities */
.sidebar-bg         { background-color: hsl(var(--sidebar)); }
.sidebar-text       { color: hsl(var(--sidebar-foreground)); }
.sidebar-text-muted { color: hsl(var(--sidebar-muted)); }
.sidebar-text-active { color: hsl(var(--sidebar-active)); }
.sidebar-active-bg  { background-color: hsl(var(--sidebar-active-bg)); }
.sidebar-border     { border-color: hsl(var(--sidebar-border)); }
.sidebar-hover      { }
.sidebar-hover:hover { background-color: hsl(220 38% 13%); } /* slightly lighter than --sidebar */
```

### nav.tsx — Desktop Sidebar Changes

**File:** `src/components/dashboard/nav.tsx`

#### 1. Sidebar `<aside>` wrapper (line ~268)

BEFORE:
```tsx
<aside className="hidden md:flex md:flex-col md:w-56 md:h-screen border-r bg-muted/50 p-4 overflow-hidden">
```

AFTER:
```tsx
<aside className="hidden md:flex md:flex-col md:w-56 md:h-screen sidebar-bg p-4 overflow-hidden">
```

Remove `border-r` — the sidebar's dark navy naturally separates from the content area without a border.

#### 2. Logo area (line ~272)

BEFORE:
```tsx
<p className="text-xs text-muted-foreground">{user.name}</p>
```

AFTER:
```tsx
<p className="text-xs sidebar-text-muted">{user.name}</p>
```

Also update the logo `dark:brightness-0 dark:invert` — since the sidebar is ALWAYS dark, the logo always needs the invert:
```tsx
className="mb-1 brightness-0 invert hover:opacity-80 transition-opacity"
```

#### 3. Dashboard pinned link (line ~295)

BEFORE:
```tsx
isActivePath(dashboardHref)
  ? "bg-primary text-primary-foreground"
  : "text-muted-foreground hover:bg-muted dark:hover:bg-card hover:text-foreground"
```

AFTER:
```tsx
isActivePath(dashboardHref)
  ? "sidebar-active-bg sidebar-text-active font-semibold"
  : "sidebar-text sidebar-hover"
```

#### 4. NavGroupSection — group header button (line ~198)

BEFORE:
```tsx
"text-muted-foreground/70 hover:text-muted-foreground hover:bg-muted dark:hover:bg-card"
```

AFTER:
```tsx
"sidebar-text-muted hover:sidebar-text sidebar-hover"
```

Note: `hover:sidebar-text` won't work directly since these are custom utilities, not Tailwind variants. Instead use:
```tsx
"text-[hsl(var(--sidebar-muted))] hover:text-[hsl(var(--sidebar-foreground))] sidebar-hover"
```

OR define the utilities with Tailwind plugin. Simpler approach: use inline arbitrary values:
```tsx
"text-[hsl(var(--sidebar-muted))] hover:text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(220_38%_13%)]"
```

#### 5. NavGroupSection — link items (line ~218)

BEFORE:
```tsx
isActivePath(link.href)
  ? "bg-primary text-primary-foreground"
  : "text-muted-foreground hover:bg-muted dark:hover:bg-card hover:text-foreground"
```

AFTER:
```tsx
isActivePath(link.href)
  ? "bg-[hsl(var(--sidebar-active-bg))] text-[hsl(var(--sidebar-active))] font-medium"
  : "text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(220_38%_13%)] hover:text-[hsl(var(--sidebar-active))]"
```

The active state is now: light indigo text on a very subtle 10% indigo background — NOT a solid indigo rectangle. This matches the mockup where "Dashboard" has a subtle highlight, not a loud button.

#### 6. Bottom actions — Profile, Settings, Sign Out (line ~335)

Same token swap as links above:

BEFORE:
```tsx
isActivePath("/profile")
  ? "bg-primary text-primary-foreground"
  : "text-muted-foreground hover:bg-muted dark:hover:bg-card hover:text-foreground"
```

AFTER:
```tsx
isActivePath("/profile")
  ? "bg-[hsl(var(--sidebar-active-bg))] text-[hsl(var(--sidebar-active))] font-medium"
  : "text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(220_38%_13%)] hover:text-[hsl(var(--sidebar-active))]"
```

Apply the same to Settings link and Sign Out button. The `border-t` divider above bottom actions becomes:
```tsx
"border-t border-[hsl(var(--sidebar-border))] pt-3 mt-3"
```

#### 7. Add "Powered by COVOS" footer

After the Sign Out button, before closing `</aside>`:

```tsx
{/* Platform attribution */}
<div className="flex-shrink-0 pt-3 mt-auto">
  <p className="text-[10px] text-[hsl(var(--sidebar-muted))] text-center tracking-wide">
    Powered by COVOS
  </p>
</div>
```

#### 8. ChevronDown icon in group headers

BEFORE: Inherits parent text color.
AFTER: Same — no change needed, the parent color swap handles it.

### Mobile Bottom Nav — NO CHANGES

The mobile bottom nav uses `bg-background border-t` which is correct — it should match the content area, not the sidebar. Leave it alone.

### Verification

After Pass 1:

1. **Light mode:** Sidebar is deep navy (#0c1222). Active link shows indigo text on subtle bg. Inactive links are silver. Group labels are dimmed.
2. **Dark mode:** Sidebar looks IDENTICAL to light mode (tokens are the same).
3. **Logo:** Always white/inverted (no more conditional `dark:` class).
4. **"Powered by COVOS"** visible at bottom.
5. **No other pages affected** — only `nav.tsx` and `globals.css` were touched.

### Commit

```
feat: Sprint 26 Pass 1 — Sidebar Signal redesign

Replaced generic bg-muted/50 sidebar with dedicated --sidebar-* tokens.
Deep navy (#0c1222) permanent sidebar, same in light/dark mode.
Active links: subtle indigo text + 10% bg instead of solid indigo rectangle.
Added "Powered by COVOS" footer.
Logo always inverted (sidebar always dark).
```

---

## ═══════════════════════════════════════════════════════════════════
## PASS 2: DASHBOARD WIDGETS REDESIGN
## ═══════════════════════════════════════════════════════════════════

### What Changes

The master dashboard widgets use stock Card styling with too much padding, visible borders, shadows, and hardcoded color backgrounds. The mockup shows: minimal cards with large numbers as focal point, no visible card borders, colored accent badges instead of backgrounds, and a "New Lead" amber CTA in the page header.

### File: `src/components/dashboard/metric-card.tsx`

#### Complete Rewrite

The current MetricCard uses `Card > CardHeader > CardTitle` + `Card > CardContent` which brings 2x `p-6` padding. The mockup shows a much denser layout.

BEFORE (current structure):
```tsx
<Card className={cn("", className)}>
  <CardHeader className="pb-2">
    <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-2xl md:text-3xl font-bold">{value}</p>
    ...
  </CardContent>
</Card>
```

AFTER (new structure):
```tsx
<div className={cn("rounded-lg bg-card p-4", className)}>
  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{title}</p>
  <div className="flex items-baseline gap-2">
    <p className="text-3xl font-bold tabular-nums">{value}</p>
    {trend && (
      <span className={cn(
        "text-xs font-semibold px-1.5 py-0.5 rounded",
        trend.value >= 0
          ? "text-status-success bg-status-success-bg"
          : "text-status-danger bg-status-danger-bg"
      )}>
        {trend.value >= 0 ? "+" : ""}{trend.value}%
      </span>
    )}
  </div>
  {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
  {tooltip && (
    <Tooltip>
      <TooltipTrigger asChild>
        <HelpCircle className="absolute top-3 right-3 h-3.5 w-3.5 text-muted-foreground/50 cursor-help" />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs"><p className="text-sm">{tooltip}</p></TooltipContent>
    </Tooltip>
  )}
</div>
```

Key changes:
- No `<Card>` wrapper — removes the default border+shadow double emphasis
- `rounded-lg bg-card p-4` — keeps card surface but tighter padding
- Title: `text-xs uppercase tracking-wide` — small label, not a card title
- Value: `text-3xl font-bold tabular-nums` — the number IS the card
- Trend: inline badge next to number (like mockup's green "+3", red "high")
- Tooltip: absolutely positioned, not taking up header space
- Need to add `relative` to the outer div for tooltip positioning

### File: `src/components/dashboard/MetricsRow.tsx`

BEFORE:
```tsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-3 h-full content-start">
```

AFTER:
```tsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-2 h-full content-start">
```

Tighter gap (gap-2 instead of gap-3). The metric cards are now denser, so they can be closer together.

### File: `src/components/dashboard/dashboard-widgets.tsx`

#### QuickActions — Neutralize

BEFORE: Each action has its own `bgColor`, `iconBg`, `color` — creates a rainbow of colored rows.

AFTER: All actions use neutral background with only the icon itself carrying color:

```tsx
const actions = [
  {
    label: "Add Lead",
    icon: Plus,
    href: "/discovery",
    description: "Find new prospects",
    iconColor: "text-primary",
  },
  {
    label: "Review Content",
    icon: FileText,
    href: "/review",
    description: "Approve pending work",
    iconColor: "text-primary",
  },
  {
    label: "View Pipeline",
    icon: TrendingUp,
    href: "/leads",
    description: "Check sales progress",
    iconColor: "text-status-success",
  },
  {
    label: "Manage Team",
    icon: Users,
    href: "/settings?tab=team",
    description: "Update team members",
    iconColor: "text-muted-foreground",
  },
];
```

Each row renders as:
```tsx
<Link key={action.href} href={action.href}>
  <div className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted transition-colors group">
    <action.icon className={cn("h-4 w-4 shrink-0", action.iconColor)} />
    <div className="flex flex-col min-w-0">
      <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{action.label}</span>
      <span className="text-xs text-muted-foreground">{action.description}</span>
    </div>
  </div>
</Link>
```

No more colored backgrounds. No icon background circles. The icon color is the only accent. Hover highlights the whole row with `bg-muted`. Clean and professional.

Remove the wrapping `<Card>`, `<CardHeader>`, `<CardContent>` and the Zap icon title. Replace with:
```tsx
<div className="rounded-lg bg-card p-4">
  <h3 className="text-sm font-semibold text-foreground mb-3">Quick Actions</h3>
  <div className="flex flex-col gap-0.5">
    {/* ...action rows... */}
  </div>
</div>
```

#### RevenueMetricsWidget — Neutralize

BEFORE: `bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-status-success-border`

AFTER:
```tsx
<div className="rounded-lg bg-card p-4">
  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
    <DollarSign className="h-4 w-4 text-status-success" />
    Revenue
  </h3>
  <div className="space-y-3">
    <div>
      <p className="text-xs text-muted-foreground">Monthly Recurring</p>
      <p className="text-2xl font-bold text-status-success tabular-nums">${mrr.toLocaleString()}</p>
      <p className="text-xs text-muted-foreground mt-0.5">ARR: ${arr.toLocaleString()}</p>
    </div>
    <div className="pt-2 border-t">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Growth</span>
        <span className={cn("text-sm font-semibold tabular-nums", isPositiveGrowth ? "text-status-success" : "text-muted-foreground")}>
          {isPositiveGrowth ? "+" : ""}{growth.toFixed(1)}%
        </span>
      </div>
    </div>
  </div>
</div>
```

No gradient background. No colored border. The green is only in the MRR number and the icon — the card itself is neutral `bg-card`. The border-t divider uses default `border-border`.

#### GoalsWidget — Neutralize

Same pattern: remove the `<Card>` wrapper. Replace with `<div className="rounded-lg bg-card p-4">`. Remove the blue icon from the title. Progress bars use `bg-primary` (indigo) instead of `bg-blue-500`:

```tsx
<div className="w-full bg-muted rounded-full h-1.5">
  <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
</div>
```

Note: `h-1.5` instead of `h-2` — thinner progress bars look more refined.

### File: `src/app/(dashboard)/manager/page.tsx`

#### Page heading with CTA

BEFORE:
```tsx
<div>
  <h1 className="text-2xl font-bold">Dashboard</h1>
  <p className="text-sm text-muted-foreground">
    {/* context stats */}
  </p>
</div>
```

AFTER:
```tsx
<div className="flex items-center justify-between">
  <div>
    <h1 className="text-2xl font-bold">Dashboard</h1>
    <p className="text-sm text-muted-foreground">
      {/* context stats */}
    </p>
  </div>
  <Link href="/discovery">
    <Button className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
      <Plus className="h-4 w-4" />
      New Lead
    </Button>
  </Link>
</div>
```

This gives the amber "New Lead" CTA from the mockup. Import `Button` from `@/components/ui/button`, `Plus` from `lucide-react`, `Link` from `next/link`.

### Verification

After Pass 2:

1. **Metric cards** are dense — large number, tiny label, inline trend badge. No visible card border.
2. **Quick Actions** are neutral rows — icon color only, no rainbow backgrounds.
3. **Revenue widget** has no green gradient. MRR number is green, card is white/card.
4. **Goals** progress bars are thin, use primary (indigo) color.
5. **"New Lead" amber button** visible in dashboard heading.
6. **TypeScript check** passes (no new errors).

### Commit

```
feat: Sprint 26 Pass 2 — Dashboard widgets Signal redesign

Metric cards: dense layout, large numbers, inline trend badges, no borders.
Quick Actions: neutralized backgrounds, icon-only color accents.
Revenue: removed green gradient, neutral card with accent text.
Goals: thinner progress bars, primary color.
Dashboard heading: added amber "New Lead" CTA.
Replaced Card wrappers with lightweight divs across all dashboard widgets.
```

---

## ═══════════════════════════════════════════════════════════════════
## PASS 3: CORE COMPONENT POLISH
## ═══════════════════════════════════════════════════════════════════

### What Changes

The shadcn/ui primitive components carry defaults that create the "stock" appearance. This pass adjusts the primitives themselves so every page benefits automatically.

### File: `src/components/ui/card.tsx`

BEFORE:
```tsx
"rounded-lg border bg-card text-card-foreground shadow"
```

AFTER:
```tsx
"rounded-lg border bg-card text-card-foreground shadow-sm"
```

Change `shadow` → `shadow-sm`. The default shadow is too heavy. `shadow-sm` gives a subtle lift without the chunky dropshadow. This single change affects EVERY card in the app.

### File: `src/components/ui/button.tsx`

The `outline` and `ghost` variants hover to `bg-accent text-accent-foreground`. Since accent is amber, this creates a jarring yellow highlight on every ghost/outline button hover — visible in David's settings screenshot.

BEFORE:
```tsx
outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
ghost: "hover:bg-accent hover:text-accent-foreground",
```

AFTER:
```tsx
outline: "border border-input bg-background shadow-sm hover:bg-muted hover:text-foreground",
ghost: "hover:bg-muted hover:text-foreground",
```

This makes outline/ghost buttons hover to a neutral muted background instead of amber. The amber accent is reserved for intentional callouts (like the "New Lead" button), not every hover state.

Also add an `accent` variant for intentional amber buttons:
```tsx
accent: "bg-accent text-accent-foreground shadow-sm hover:bg-accent/90 font-semibold",
```

### File: `src/components/ui/select.tsx`

The Select dropdown item highlight likely inherits from Radix's default which may use `bg-accent`. Check `SelectItem`:

Look for the highlighted/focused item styling. If it uses `data-[highlighted]:bg-accent`, change to `data-[highlighted]:bg-muted data-[highlighted]:text-foreground`.

### File: `src/components/ui/badge.tsx`

Check current badge variants. If any use raw colors (e.g., `bg-green-100 text-green-800`), they should already be using status tokens from Sprint 23-E. Verify only — likely no changes needed.

### File: `globals.css` — Scrollbar Styling

Add at the end of the `@layer base` block:

```css
/* Refined scrollbars */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: hsl(var(--border)); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: hsl(var(--muted-foreground)); }
.dark ::-webkit-scrollbar-thumb { background: hsl(var(--sidebar-border)); }
```

Thinner scrollbars match the refined aesthetic. Uses token colors.

### File: `globals.css` — Focus Ring Refinement

Check the ring width. Default shadcn uses `ring-1`. If `focus-visible:ring-1` is the base, that's good. If it's `ring-2`, consider thinning to `ring-1` in the button base class. (Likely already correct — verify only.)

### Verification

After Pass 3:

1. **All cards** have `shadow-sm` instead of `shadow` — subtle lift.
2. **Ghost/outline buttons** hover to neutral gray, NOT amber.
3. **Select dropdowns** highlight in neutral, not amber.
4. **Scrollbars** are thin and use token colors.
5. **No component API changes** — only default styling. All existing usage sites work unchanged.

### Commit

```
feat: Sprint 26 Pass 3 — Core component polish

Card: shadow → shadow-sm (lighter elevation).
Button: outline/ghost hover to bg-muted instead of bg-accent (no more amber flash).
Button: added accent variant for intentional amber CTAs.
Select: item highlight uses muted instead of accent.
Scrollbars: thin 6px, token-colored, dark mode aware.
```

---

## ═══════════════════════════════════════════════════════════════════
## PASS 4: PAGE-LEVEL SWEEP
## ═══════════════════════════════════════════════════════════════════

### What Changes

After Passes 1–3 handle the sidebar, dashboard, and primitive components, this pass sweeps all other pages for remaining stock patterns. This is the "consistency audit" pass.

### Systematic Check (every file in `src/app/(dashboard)/`)

For each page, verify:

1. **Page heading** follows the pattern: `<h1 className="text-2xl font-bold">` + optional subtitle + optional CTA button aligned right.
2. **No remaining hardcoded color backgrounds** — grep for `bg-blue-`, `bg-green-`, `bg-purple-`, `bg-yellow-`, `bg-red-`, `bg-orange-` in JSX (not in excluded files). Replace with token equivalents.
3. **No remaining double-emphasis cards** — if a component wraps content in `<Card>` AND adds its own border/shadow, remove the redundant one.
4. **Tables** use `text-sm` body text, `text-xs text-muted-foreground uppercase tracking-wide` headers. Verify consistent across all table views (leads, clients, tasks, payments, etc.).
5. **Empty states** use the professional voice from Sprint 24 Pass 2. No emoji, no exclamation marks.

### Specific Pages to Check

**Pipeline (`leads/client.tsx`):**
- The "Import Leads", "Bulk Actions", "Export CSV" buttons in the page header (visible in David's screenshot) — should be `variant="outline"` with the new neutral hover, NOT amber hover.
- Kanban cards: verify they use `bg-card` not `bg-white`.

**Clients (`clients/page.tsx`):**
- Client health scores should use colored dots (green/yellow/red) + numeric score, similar to mockup's Client Health list.
- If using Card wrappers for client rows, verify `shadow-sm` is now inherited.

**Settings (`settings/page.tsx`):**
- Theme selector: the "Light" option highlight in David's screenshot was yellow (amber accent). After Pass 3's Select fix, this should now be neutral gray. Verify.
- Tab bar at top: verify consistent styling.

**Analytics, Payments, Tasks, Content Studio:**
- Quick scan for any remaining hardcoded colors or stock patterns.
- Focus on table headers, filter bars, and action buttons.

### Verification Commands

```powershell
# Remaining hardcoded color backgrounds in JSX (should be near-zero outside excluded files)
Get-ChildItem -Recurse -Include "*.tsx" -Path "src/components","src/app/(dashboard)" |
  Select-String -Pattern "bg-(blue|green|purple|yellow|red|orange|pink|emerald|teal|cyan|violet|lime|amber|rose)-[0-9]" |
  Where-Object { $_.Path -notmatch "node_modules|\.next|email|template\.ts|work-order|brochure|comp-sheet|territory-map|status-badge|BrandThemeInjector" } |
  Group-Object Path | Select-Object Count, Name | Format-Table -AutoSize

# Expected: 0 files (or only intentional status-badge exceptions)
```

```powershell
# TypeScript check — 0 new errors
npx tsc --noEmit 2>&1 | Select-String -Pattern "error TS" | Where-Object { $_.Line -notmatch "scripts[/\\]basecamp|import-wave-history" } | Measure-Object | Select-Object -Exp Count
```

### Commit

```
feat: Sprint 26 Pass 4 — Page-level consistency sweep

Verified all dashboard pages follow Signal design patterns.
Removed N remaining hardcoded color classes across N files.
Standardized page headings, table headers, and empty states.
```

---

## ═══════════════════════════════════════════════════════════════════
## FINAL: DOCS + CLOSE
## ═══════════════════════════════════════════════════════════════════

### Update Docs

1. **CHANGELOG.md** — Add 4 entries (one per pass) with date, commit hash, summary
2. **BACKLOG.md** — Close UI-CONST-001 Groups 1–4 if fully addressed, or update remaining scope
3. **STATUS.md** — Update "Last Updated" line
4. **UXUI_DESIGN_SPEC.md** — Update the COLOR SYSTEM and NAVIGATION DESIGN sections to reflect what was actually built (Signal expression, not the older mockup specs)

### Final Commit

```
docs: Sprint 26 completion — Signal visual identity shipped
```

### Push

```
git push origin main
```

---

## ═══════════════════════════════════════════════════════════════════
## COWORK PROMPT (copy-paste into Cowork)
## ═══════════════════════════════════════════════════════════════════

```
Execute SPRINT_26_VISUAL_REDESIGN.md in the GHM Dashboard project (D:\Work\SEO-Services\ghm-dashboard).

This is a 4-pass visual redesign that transforms stock shadcn/ui components into the COVOS Signal visual identity. Each pass is collision-free — they touch different files. Execute in order:

PASS 1: Sidebar Redesign — Replace bg-muted/50 with dedicated --sidebar-* tokens (deep navy #0c1222, permanent in both light/dark). Active links become subtle indigo text + 10% bg instead of solid indigo rectangles. Add "Powered by COVOS" footer. Logo always inverted. Only touches nav.tsx + globals.css utility classes.

PASS 2: Dashboard Widgets — Rewrite metric-card.tsx (dense layout, large numbers, inline trend badges, no Card border). Neutralize QuickActions (remove rainbow backgrounds, icon-only color). Neutralize RevenueMetricsWidget (remove green gradient, accent text only). Thin progress bars in GoalsWidget. Add amber "New Lead" CTA button to manager/page.tsx heading. Replace Card wrappers with lightweight divs.

PASS 3: Core Component Polish — Card: shadow → shadow-sm. Button: outline/ghost hover to bg-muted instead of bg-accent (fixes amber flash). Add accent variant for intentional amber buttons. Select: item highlight uses muted. Add thin scrollbar styling to globals.css.

PASS 4: Page-Level Sweep — Verify all (dashboard)/**/*.tsx pages follow Signal patterns. Remove remaining hardcoded color backgrounds. Standardize page headings (title + subtitle + optional CTA). Verify tables, empty states, filter bars.

The blueprint contains exact token references, before/after code blocks, verification commands, and commit messages for each pass. Read it thoroughly before starting. Run verification greps and TypeScript check after each pass. Four separate commits (one per pass) plus a final docs commit.

CRITICAL: The --sidebar-* tokens already exist in globals.css. Do NOT modify globals.css token values. Only ADD utility classes and CONSUME existing tokens in components.
```
