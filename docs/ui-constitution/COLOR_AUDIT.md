# GHM DASHBOARD — COLOR AUDIT
**Generated:** 2026-02-25
**Audited by:** Cowork agent (read-only session)
**Purpose:** Foundation for UI Constitution Phase 1 — Color Token System
**Status:** COMPLETE — ready for token design session

---

## 1. Tailwind Config — Custom Color Definitions

**File:** `tailwind.config.ts` (63 lines)

### Dark Mode Configuration
- `darkMode: ["class"]` — class-based dark mode strategy

### Content Glob Patterns
```
./src/pages/**/*.{js,ts,jsx,tsx,mdx}
./src/components/**/*.{js,ts,jsx,tsx,mdx}
./src/app/**/*.{js,ts,jsx,tsx,mdx}
```

### Custom Color Definitions (`theme.extend.colors`)

All custom colors reference CSS custom properties — no raw hex/HSL values in the Tailwind config.

| Token Name | Value |
|---|---|
| `background` | `hsl(var(--background))` |
| `foreground` | `hsl(var(--foreground))` |
| `card.DEFAULT` | `hsl(var(--card))` |
| `card.foreground` | `hsl(var(--card-foreground))` |
| `popover.DEFAULT` | `hsl(var(--popover))` |
| `popover.foreground` | `hsl(var(--popover-foreground))` |
| `primary.DEFAULT` | `hsl(var(--primary))` |
| `primary.foreground` | `hsl(var(--primary-foreground))` |
| `secondary.DEFAULT` | `hsl(var(--secondary))` |
| `secondary.foreground` | `hsl(var(--secondary-foreground))` || `muted.DEFAULT` | `hsl(var(--muted))` |
| `muted.foreground` | `hsl(var(--muted-foreground))` |
| `accent.DEFAULT` | `hsl(var(--accent))` |
| `accent.foreground` | `hsl(var(--accent-foreground))` |
| `destructive.DEFAULT` | `hsl(var(--destructive))` |
| `destructive.foreground` | `hsl(var(--destructive-foreground))` |
| `border` | `hsl(var(--border))` |
| `input` | `hsl(var(--input))` |
| `ring` | `hsl(var(--ring))` |
| `chart.1` | `hsl(var(--chart-1))` |
| `chart.2` | `hsl(var(--chart-2))` |
| `chart.3` | `hsl(var(--chart-3))` |
| `chart.4` | `hsl(var(--chart-4))` |
| `chart.5` | `hsl(var(--chart-5))` |

### Border Radius (non-color, noted for completeness)
- `lg`: `var(--radius)`
- `md`: `calc(var(--radius) - 2px)`
- `sm`: `calc(var(--radius) - 4px)`

### Plugins
- `tailwindcss-animate`

**Note:** No raw color values (hex, RGB, HSL) exist in tailwind.config.ts. All colors delegate to CSS custom properties. The chart tokens (`chart.1`–`chart.5`) reference `--chart-1` through `--chart-5` variables, but these are **not defined** in `globals.css` — they appear to be unused or defined elsewhere at runtime.

---

## 2. CSS Custom Properties (globals.css)
**File:** `src/app/globals.css` (66 lines)

### `:root` (Light Mode)

| Variable | HSL Value | Approximate Color |
|---|---|---|
| `--background` | `0 0% 100%` | White |
| `--foreground` | `222.2 84% 4.9%` | Near-black blue |
| `--card` | `0 0% 100%` | White |
| `--card-foreground` | `222.2 84% 4.9%` | Near-black blue |
| `--popover` | `0 0% 100%` | White |
| `--popover-foreground` | `222.2 84% 4.9%` | Near-black blue |
| `--primary` | `221.2 83.2% 53.3%` | Blue (≈ blue-600) |
| `--primary-foreground` | `210 40% 98%` | Near-white |
| `--secondary` | `210 40% 96.1%` | Light gray-blue |
| `--secondary-foreground` | `222.2 47.4% 11.2%` | Dark blue-gray |
| `--muted` | `210 40% 96.1%` | Light gray-blue |
| `--muted-foreground` | `215.4 16.3% 46.9%` | Medium gray |
| `--accent` | `210 40% 96.1%` | Light gray-blue |
| `--accent-foreground` | `222.2 47.4% 11.2%` | Dark blue-gray |
| `--destructive` | `0 84.2% 60.2%` | Red |
| `--destructive-foreground` | `210 40% 98%` | Near-white |
| `--border` | `214.3 31.8% 91.4%` | Light gray |
| `--input` | `214.3 31.8% 91.4%` | Light gray |
| `--ring` | `221.2 83.2% 53.3%` | Blue (matches primary) |
| `--radius` | `0.5rem` | *(non-color)* |

### `.dark` (Dark Mode)

| Variable | HSL Value | Approximate Color |
|---|---|---|
| `--background` | `222.2 84% 4.9%` | Near-black blue |
| `--foreground` | `210 40% 98%` | Near-white |
| `--card` | `222.2 84% 4.9%` | Near-black blue |
| `--card-foreground` | `210 40% 98%` | Near-white || `--popover` | `222.2 84% 4.9%` | Near-black blue |
| `--popover-foreground` | `210 40% 98%` | Near-white |
| `--primary` | `217.2 91.2% 59.8%` | Lighter blue |
| `--primary-foreground` | `222.2 47.4% 11.2%` | Dark blue-gray |
| `--secondary` | `217.2 32.6% 17.5%` | Dark blue-gray |
| `--secondary-foreground` | `210 40% 98%` | Near-white |
| `--muted` | `217.2 32.6% 17.5%` | Dark blue-gray |
| `--muted-foreground` | `215 20.2% 65.1%` | Medium gray |
| `--accent` | `217.2 32.6% 17.5%` | Dark blue-gray |
| `--accent-foreground` | `210 40% 98%` | Near-white |
| `--destructive` | `0 62.8% 30.6%` | Dark red |
| `--destructive-foreground` | `210 40% 98%` | Near-white |
| `--border` | `217.2 32.6% 17.5%` | Dark blue-gray |
| `--input` | `217.2 32.6% 17.5%` | Dark blue-gray |
| `--ring` | `224.3 76.3% 48%` | Deep blue |

### Global Base Styles
- `* { @apply border-border; }` — all elements default to `border-border`
- `body { @apply bg-background text-foreground; }` — body uses semantic tokens

### Non-Color Custom Property
- `--radius: 0.5rem` — border radius base (no dark mode override)

---

## 3. Runtime Brand Color Injection (BrandThemeInjector.tsx)

**File:** `src/components/branding/BrandThemeInjector.tsx` (42 lines)

### Injected Properties

| CSS Custom Property | Source | Fallback Value | Fallback Color |
|---|---|---|---|
| `--brand-primary` | `props.colors.primary` (from DB via layout.tsx) | `#2563eb` | Tailwind blue-600 |
| `--brand-secondary` | `props.colors.secondary` (from DB via layout.tsx) | `#64748b` | Tailwind slate-500 |
| `--brand-accent` | `props.colors.accent` (from DB via layout.tsx) | `#f59e0b` | Tailwind amber-500 |

### Mechanism
- Client component using `useEffect` to call `document.documentElement.style.setProperty()`
- Rendered from `(dashboard)/layout.tsx` (server component passes brand colors from TenantSettings)
- Renders nothing visible — side-effect only component
- Values are hex strings, not HSL — **different format from shadcn tokens**

### Related Files
- `src/components/settings/BrandingTab.tsx` — UI for editing brand colors (defaults: `#2563eb`, `#64748b`, `#f59e0b`)
- `src/components/onboarding/AdminSetupWizard.tsx` — brand color setup during onboarding (same defaults)
- `src/app/admin-setup/page.tsx` — admin setup page (same defaults)

---

## 4. Hardcoded Color Classes — Components

**Scope:** All `*.tsx` files under `src/components/` (recursive)
**Total hardcoded color class usages found:** 1,066 (362 bg + 580 text + 121 border + 3 ring)
### Category A — Background Colors (362 usages)

| Color + Shade | Count | Top Files |
|---|---|---|
| `bg-gray-100` | ~30 | nav.tsx, audit-logs-viewer.tsx, ContentStrategyPanel.tsx |
| `bg-gray-50` | ~20 | CitationsTab.tsx, discovery-dashboard.tsx, LocalPresenceTab.tsx |
| `bg-white` | ~20 | LocalPresenceTab.tsx, CitationsTab.tsx, portal-dashboard.tsx |
| `bg-green-100` | ~18 | portfolio.tsx, lead-card.tsx, ContentList.tsx |
| `bg-blue-100` | ~14 | dashboard-widgets.tsx, ContentCalendar.tsx, DomainFinderSection.tsx |
| `bg-yellow-100` | ~12 | portfolio.tsx, lead-card.tsx, CampaignsTab.tsx |
| `bg-red-100` | ~12 | portfolio.tsx, churn-risk-badge.tsx, audit-logs-viewer.tsx |
| `bg-green-50` | ~10 | AdminSetupWizard.tsx, onboarding-wizard.tsx, territory-health-banner.tsx |
| `bg-blue-50` | ~10 | onboarding-wizard.tsx, LocalPresenceTab.tsx, ContentCalendar.tsx |
| `bg-orange-100` | ~8 | churn-risk-badge.tsx, BugReportsTab.tsx, dashboard-widgets.tsx |
| `bg-amber-50` | ~6 | vault-client.tsx, ClientNotesTab.tsx, CitationsTab.tsx |
| `bg-purple-100` | ~6 | ContentCalendar.tsx, ContentStrategyPanel.tsx, BugReportsTab.tsx |
| `bg-green-500` | ~6 | portfolio.tsx, DomainFinderSection.tsx, realtime-status.tsx |
| `bg-red-50` | ~5 | csv-import-dialog.tsx, upsell-opportunities.tsx, ContentList.tsx |
| `bg-blue-600` | ~4 | onboarding-tutorial.tsx, review-queue.tsx |
| `bg-black` | ~5 | alert-dialog.tsx, AISearchBar.tsx, LocalPresenceTab.tsx |
| `bg-transparent` | ~5 | lead-filter-bar-advanced.tsx, CompetitiveIntelBadge.tsx, profile.tsx |
| `bg-amber-100` | ~3 | LocalPresenceTab.tsx |
| `bg-green-600` | ~3 | review-queue.tsx, review-task-modal.tsx, onboarding-tutorial.tsx |
| `bg-red-500` | ~3 | portfolio.tsx, CompetitiveIntelBadge.tsx |
| `bg-red-600` | ~2 | ContentList.tsx, CompetitorsTab.tsx |
| `bg-yellow-500` | ~2 | portfolio.tsx |
| `bg-indigo-50` | 1 | ContentStrategyPanel.tsx |
| `bg-slate-100` | 1 | ContentList.tsx |
| `bg-teal-100` | 1 | audit-logs-viewer.tsx |
| `bg-yellow-50` | ~3 | csv-import-dialog.tsx, upsell-opportunities.tsx |
| `bg-orange-50` | ~3 | dashboard-widgets.tsx, upsell-opportunities.tsx |
| `bg-purple-50` | 1 | dashboard-widgets.tsx |
| `bg-gray-200` | ~2 | dashboard-widgets.tsx |
| `bg-gray-300` | 1 | onboarding-tutorial.tsx |
### Category B — Text Colors (580 usages)

| Color + Shade | Count | Top Files |
|---|---|---|
| `text-gray-600` | ~30 | welcome page, BugReportsTab.tsx, discovery-dashboard.tsx |
| `text-gray-700` | ~25 | welcome page, ContentStrategyPanel.tsx, ContentList.tsx |
| `text-gray-800` | ~20 | welcome page, BugReportsTab.tsx, ContentCalendar.tsx |
| `text-blue-600` | ~40 | welcome page, onboarding-tutorial.tsx, BugReportsTab.tsx |
| `text-green-600` | ~25 | onboarding-tutorial.tsx, FinancialOverviewSection.tsx, dashboard-widgets.tsx |
| `text-red-600` | ~15 | FinancialOverviewSection.tsx, BugReportsTab.tsx, company-profitability-widget.tsx |
| `text-orange-600` | ~15 | my-earnings-widget.tsx, FinancialOverviewSection.tsx, BugReportsTab.tsx |
| `text-green-800` | ~8 | AdminSetupWizard.tsx, ContentList.tsx, onboarding-wizard.tsx |
| `text-amber-800` | ~6 | territory-health-banner.tsx, AdminSetupWizard.tsx, onboarding-wizard.tsx |
| `text-blue-800` | ~6 | ContentStrategyPanel.tsx, BugReportsTab.tsx, onboarding-wizard.tsx |
| `text-purple-600` | ~5 | dashboard-widgets.tsx, onboarding-tutorial.tsx, management-fees-widget.tsx |
| `text-green-500` | ~8 | onboarding-wizard.tsx, AdminSetupWizard.tsx, rep-onboarding-wizard.tsx |
| `text-red-500` | ~6 | AdminSetupWizard.tsx, FinancialOverviewSection.tsx, welcome page |
| `text-yellow-700` | ~5 | lead-card.tsx, csv-import-dialog.tsx, CompetitiveIntelBadge.tsx |
| `text-amber-600` | ~6 | FinancialOverviewSection.tsx |
| `text-violet-600` | ~4 | onboarding-tutorial.tsx, sales-tools-panel.tsx |
| `text-emerald-500` | ~2 | my-book-widget.tsx, ApprovalModal.tsx |
| `text-emerald-600` | 1 | my-book-widget.tsx |
| `text-emerald-800` | 1 | ApprovalModal.tsx |
| `text-indigo-600` | 1 | onboarding-tutorial.tsx |
| `text-indigo-700` | 1 | ContentStrategyPanel.tsx |
| `text-slate-500` | 1 | ContentList.tsx |
| `text-slate-600` | ~3 | onboarding-tutorial.tsx |
| `text-teal-600` | 1 | sales-tools-panel.tsx |
| `text-pink-600` | 1 | sales-tools-panel.tsx |
| `text-violet-500` | ~3 | onboarding-wizard.tsx, rep-onboarding-wizard.tsx |
| `text-orange-500` | ~3 | onboarding-wizard.tsx, rep-onboarding-wizard.tsx |
| `text-white` | ~6 | welcome page, ApprovalModal.tsx |
| `text-gray-400` | ~4 | welcome page |
| `text-gray-500` | ~15 | welcome page |
| `text-gray-900` | ~10 | welcome page |
### Category C — Border Colors (121 usages)

| Color + Shade | Count | Top Files |
|---|---|---|
| `border-green-200` | ~18 | portfolio.tsx, SiteHealthTab.tsx, CampaignsTab.tsx |
| `border-amber-200` | ~10 | onboarding-wizard.tsx, PermissionEditor.tsx, ClientNotesTab.tsx |
| `border-red-200` | ~10 | SiteHealthTab.tsx, ApprovalQueue.tsx, ContentList.tsx |
| `border-blue-200` | ~6 | onboarding-wizard.tsx, ContentStrategyPanel.tsx, DomainFinderSection.tsx |
| `border-yellow-200` | ~8 | portfolio.tsx, SiteHealthTab.tsx, CompetitiveIntelBadge.tsx |
| `border-orange-200` | ~6 | portfolio.tsx, DataImportTab.tsx, WaveSettingsTab.tsx |
| `border-purple-200` | ~3 | ContentStrategyPanel.tsx, PropertyMatrix.tsx |
| `border-amber-300` | ~6 | approvals-tab.tsx, ApprovalQueue.tsx, BuildQueue.tsx |
| `border-amber-400` | ~2 | TeamFeed.tsx, PropertyMatrix.tsx |
| `border-emerald-300` | ~3 | ApprovalQueue.tsx, ApprovalModal.tsx |
| `border-emerald-200` | 1 | ApprovalModal.tsx |
| `border-green-400` | 1 | task-queue-client.tsx |
| `border-green-500` | ~3 | vault-upload-button.tsx, WebsiteAuditPanel.tsx, profile.tsx |
| `border-blue-400` | ~2 | task-queue-client.tsx, NewPropertyModal.tsx |
| `border-blue-600` | 1 | LocalPresenceTab.tsx |
| `border-red-300` | ~2 | FinancialOverviewSection.tsx, task-queue-client.tsx |
| `border-red-400` | 1 | PageComposer.tsx |
| `border-purple-400` | ~2 | task-queue-client.tsx, NewPropertyModal.tsx |
| `border-orange-400` | 1 | task-queue-client.tsx |
| `border-gray-200` | ~4 | ContentStrategyPanel.tsx |
| `border-gray-300` | 1 | task-queue-client.tsx |
| `border-yellow-600` | 1 | scan-history.tsx |
| `border-indigo-200` | 1 | ContentStrategyPanel.tsx |

### Category D — Ring/Outline Colors (3 usages)

| Color + Shade | Count | File |
|---|---|---|
| `ring-red-400` | 2 | toast.tsx, PageComposer.tsx |
| `ring-black` | 1 | bulk-action-bar.tsx |

### Category E — shadcn Semantic Colors

shadcn semantic classes are **in active use** across the codebase. The following semantic tokens are used via Tailwind utility classes:

- **Text:** `text-foreground`, `text-muted-foreground`, `text-primary`, `text-secondary-foreground`, `text-destructive`
- **Background:** `bg-background`, `bg-muted`, `bg-primary`, `bg-secondary`, `bg-destructive`, `bg-card`, `bg-popover`, `bg-accent`
- **Border:** `border-border`, `border-input`, `border-destructive`
- **Ring:** `ring-ring`

These semantic classes resolve to the CSS custom properties defined in `globals.css` and are the **already-tokenized layer** of the color system.

---

## 5. Hardcoded Color Classes — Pages & App Router
**Scope:** All `*.tsx` files under `src/app/` (recursive)
**Total hardcoded color class usages found:** 163 (42 bg + 121 text)

### Background Colors (42 usages)

The majority of app-level bg- usages concentrate in the onboarding welcome page (`welcome/[token]/page.tsx`).

| Color + Shade | Count | Top Files |
|---|---|---|
| `bg-blue-600` | ~14 | welcome/[token]/page.tsx |
| `bg-gray-50` | ~10 | welcome/[token]/page.tsx, portal/page.tsx, login/page.tsx |
| `bg-blue-50` | ~4 | welcome/[token]/page.tsx |
| `bg-white` | ~4 | comp-sheet/page.tsx, territory-map/page.tsx, brochure/page.tsx |
| `bg-green-50` | ~4 | clients/onboarding pages |
| `bg-red-50` | 1 | error.tsx |
| `bg-red-100` | 1 | error.tsx |
| `bg-amber-50` | 1 | leads/client.tsx |
| `bg-blue-100` | 1 | welcome/[token]/page.tsx |
| `bg-yellow-50` | 1 | welcome/[token]/page.tsx |

### Text Colors (121 usages)

Dominated by `welcome/[token]/page.tsx` (a large onboarding flow with ~90 text color usages).

| Color + Shade | Count | Top Files |
|---|---|---|
| `text-gray-500` | ~15 | welcome/[token]/page.tsx |
| `text-gray-800` | ~12 | welcome/[token]/page.tsx |
| `text-blue-600` | ~15 | welcome/[token]/page.tsx |
| `text-gray-700` | ~10 | welcome/[token]/page.tsx |
| `text-gray-900` | ~8 | welcome/[token]/page.tsx |
| `text-white` | ~5 | welcome/[token]/page.tsx |
| `text-gray-400` | ~3 | welcome/[token]/page.tsx |
| `text-gray-600` | ~3 | welcome/[token]/page.tsx |
| `text-red-600` | ~5 | error.tsx, login/page.tsx, reset-password/page.tsx |
| `text-green-600` | ~4 | sales/page.tsx, reports/page.tsx, welcome page |
| `text-amber-500` | 1 | sales/page.tsx |
| `text-amber-800` | 1 | leads/client.tsx |
| `text-green-700` | 1 | reset-password/page.tsx |
| `text-blue-700` | 1 | welcome/[token]/page.tsx |
| `text-red-500` | 1 | welcome/[token]/page.tsx |
| `text-red-700` | 1 | welcome/[token]/page.tsx |
| `text-yellow-700` | 1 | welcome/[token]/page.tsx |
| `text-green-500` | 1 | welcome/[token]/page.tsx |
| `text-gray-300` | 1 | login/page.tsx |

**Note:** No color classes found in API route files (`src/app/api/`).

---

## 6. Inline Style Color Values

**Scope:** All `*.tsx` files under `src/` (recursive)
**Total inline style color values found:** 50 matches across 3 component files + 3 app page files

### Component Inline Styles (3 usages — dynamic only)

| File | Component | Value | Purpose |
|---|---|---|---|
| `settings/BrandingTab.tsx` | Color swatch preview | `backgroundColor: val` | Dynamic — renders user-selected brand color |
| `onboarding/AdminSetupWizard.tsx` | Color swatch preview | `backgroundColor: val` | Dynamic — renders user-selected brand color |
| `clients/website-studio/DnaLab.tsx` | Token swatch | `backgroundColor: token.value` | Dynamic — renders design token colors |

### App Page Inline Styles (47 usages — heavily concentrated)

**`src/app/(onboarding)/brochure/page.tsx`** — 20+ inline color values
This is a PDF-rendered brochure page using `@react-pdf/renderer` which requires inline styles.

| Hex Value | Tailwind Equivalent | Usage Count |
|---|---|---|
| `#2563eb` | blue-600 | 5 |
| `#6b7280` | gray-500 | 5 |
| `#4b5563` | gray-600 | 3 |
| `#1e40af` | blue-800 | 2 |
| `#374151` | gray-700 | 2 |
| `#1e3a5f` | *(custom navy)* | 2 |
| `#111827` | gray-900 | 1 |
| `#10b981` | emerald-500 | 1 |
| `#1d4ed8` | blue-700 | 1 |
| `#9ca3af` | gray-400 | 2 |

**`src/app/(onboarding)/comp-sheet/page.tsx`** — 15+ inline color values
Also a PDF-rendered page using `@react-pdf/renderer`.

| Hex Value | Tailwind Equivalent | Usage Count |
|---|---|---|
| `#64748b` | slate-500 | 2 |
| `#1e3a5f` | *(custom navy)* | 2 |
| `#2563eb` | blue-600 | 2 |
| `#94a3b8` | slate-400 | 2 |
| `#16a34a` | green-600 | 2 (conditional) |
| `#1e40af` | blue-800 | 1 |
| `#475569` | slate-600 | 1 |
| `#60a5fa` | blue-400 | 1 |
| `#0f2027` | *(custom dark)* | 1 |
| `#f8fafc` | slate-50 | 1 |
| `#e2e8f0` | slate-200 | 1 |

**`src/app/(onboarding)/territory-map/page.tsx`** — 12+ inline color values
Also a PDF-rendered page.

| Hex Value | Tailwind Equivalent | Usage Count |
|---|---|---|
| `#64748b` | slate-500 | 2 |
| `#94a3b8` | slate-400 | 2 |
| `#1e3a5f` | *(custom navy)* | 1 |
| `#78350f` | amber-900 | 1 |
| `#2563eb` | blue-600 | 1 |
| `#7c3aed` | violet-600 | 1 |
| `#059669` | emerald-600 | 1 |
| `#475569` | slate-600 | 1 |
| `#1e40af` | blue-800 | 1 |
| `#92400e` | amber-800 | 1 |
| `#fffbeb` | amber-50 | 1 |
| `#f1f5f9` | slate-100 | 1 |

**Key finding:** The custom hex `#1e3a5f` appears across all three PDF pages. It is not a standard Tailwind color — it appears to be a **GHM brand navy** used specifically in PDF/print contexts.

---

## 7. SVG Color Values

**Scope:** All `*.tsx` files under `src/` for inline SVG, plus `public/` for `.svg` files
**No standalone `.svg` files found** in the project.
**Total inline SVG color values found:** 44 usages across 8 files
### Recharts Components (stroke/fill attributes)

| File | Attribute | Value | Tailwind Equivalent | Purpose |
|---|---|---|---|---|
| `analytics/advanced-charts.tsx` | `stroke` | `#10b981` | emerald-500 | MRR line, revenue line |
| `analytics/advanced-charts.tsx` | `stroke` | `#3b82f6` | blue-500 | Comparison lines |
| `analytics/advanced-charts.tsx` | `stroke` | `#f59e0b` | amber-500 | Churn line |
| `analytics/advanced-charts.tsx` | `fill` | `#3b82f6` | blue-500 | Bar charts |
| `analytics/advanced-charts.tsx` | `fill` | `#10b981` | emerald-500 | Bar charts |
| `analytics/advanced-charts.tsx` | `fill` | `#f59e0b` | amber-500 | Bar charts |
| `analytics/advanced-charts.tsx` | `fill` | `#8b5cf6` | violet-500 | Bar charts |
| `analytics/intelligence-trends.tsx` | `stroke` | `#10b981` | emerald-500 | Revenue trend |
| `analytics/intelligence-trends.tsx` | `stroke` | `#3b82f6` | blue-500 | Lead trend |
| `analytics/intelligence-trends.tsx` | `stroke` | `#f59e0b` | amber-500 | Churn trend |
| `analytics/intelligence-trends.tsx` | `fill` | `#10b981` | emerald-500 | Positive bar |
| `analytics/intelligence-trends.tsx` | `fill` | `#ef4444` | red-500 | Negative bar |
| `monitoring/performance-dashboard.tsx` | `stroke` | `#3b82f6` | blue-500 | Response time |
| `monitoring/performance-dashboard.tsx` | `stroke` | `#10b981` | emerald-500 | Uptime |
| `monitoring/performance-dashboard.tsx` | `fill` | `#ef4444` | red-500 | Error bar |
| `analytics/dashboard-usage-panel.tsx` | `stroke` | `hsl(var(--primary))` | *(semantic)* | Usage trend |
| `analytics/dashboard-usage-panel.tsx` | `fill` | `hsl(var(--primary))` | *(semantic)* | Usage area |

### Client-Facing Charts

| File | Attribute | Value | Tailwind Equivalent | Purpose |
|---|---|---|---|---|
| `clients/site-health/SiteHealthTab.tsx` | `stroke` | `#2563eb` | blue-600 | Health score line |
| `clients/site-health/SiteHealthTab.tsx` | `stroke` | `#16a34a` | green-600 | Performance line |
| `clients/site-health/SiteHealthTab.tsx` | `stroke` | `#9333ea` | purple-600 | SEO score line |
| `clients/site-health/SiteHealthTab.tsx` | `stroke` | `hsl(var(--border))` | *(semantic)* | Grid lines |
| `clients/local-presence/LocalPresenceTab.tsx` | `stroke` | `#3b82f6` | blue-500 | Visibility line |
| `clients/local-presence/LocalPresenceTab.tsx` | `stroke` | `#10b981` | emerald-500 | Accuracy line |
| `clients/local-presence/LocalPresenceTab.tsx` | `stroke` | `#f0f0f0` | *(custom light gray)* | Grid |
| `clients/health-sparkline.tsx` | `stroke` | `#10b981` | emerald-500 | Sparkline |
| `clients/health-sparkline.tsx` | color | `#10b981` / `#ef4444` | emerald-500 / red-500 | Delta indicator |

### Brochure SVG (PDF context)

| File | Attribute | Value | Tailwind Equivalent |
|---|---|---|---|
| `(onboarding)/brochure/page.tsx` | `fill` | `#dbeafe` | blue-100 |
| `(onboarding)/brochure/page.tsx` | `fill` | `#bfdbfe` | blue-200 |
| `(onboarding)/brochure/page.tsx` | `fill` | `#1e40af` | blue-800 |
| `(onboarding)/brochure/page.tsx` | `fill` | `#3b82f6` | blue-500 |
| `(onboarding)/brochure/page.tsx` | `fill` | `#1e3a5f` | *(custom navy)* |
| `(onboarding)/brochure/page.tsx` | `fill` | `#2563eb` | blue-600 |

**Key finding:** Chart colors are **entirely hardcoded hex values** — not referencing CSS variables or Tailwind classes. The Recharts integration bypasses the Tailwind/CSS variable system completely, with the exception of `dashboard-usage-panel.tsx` which uses `hsl(var(--primary))`.

---

## 8. Status & State Color Patterns

### 8.1 Client Health Score Colors

**Files:** `portfolio.tsx`, `profile.tsx`, `churn-risk-badge.tsx`, `health-sparkline.tsx`

| Health Level | Background | Text | Border |
|---|---|---|---|
| Healthy / Good (≥80) | `bg-green-100` | `text-green-700` | `border-green-200` |
| Warning / At Risk (50-79) | `bg-yellow-100` | `text-yellow-700` | `border-yellow-200` |
| Critical / Declining (<50) | `bg-red-100` | `text-red-700` | `border-red-200` |

### 8.2 Churn Risk Badge Colors

**File:** `churn-risk-badge.tsx`

| Risk Level | Background | Border |
|---|---|---|
| Low | `bg-green-100` | `border-green-200` |
| Medium | `bg-yellow-100` | `border-yellow-200` |
| High | `bg-orange-100` | `border-orange-200` |
| Critical | `bg-red-100` | `border-red-200` |
### 8.3 Territory Health Banner Colors

**File:** `territory-health-banner.tsx`

| Health State | Background | Text | Border | Dot |
|---|---|---|---|---|
| Good | `bg-green-50` | `text-green-800` | `border-green-200` | `bg-green-500` |
| Warning | `bg-amber-50` | `text-amber-800` | `border-amber-200` | `bg-amber-500` |
| Critical | `bg-red-50` | `text-red-800` | `border-red-200` | `bg-red-500` |

### 8.4 Lead Pipeline Stage Colors

**Files:** `lead-card.tsx`, `csv-import-dialog.tsx`

| Stage/Status | Background | Text |
|---|---|---|
| Qualified / Won | `bg-green-100` | `text-green-700` |
| In Progress | `bg-yellow-100` | `text-yellow-700` |
| Lost / Cold | `bg-red-100` | `text-red-700` |

### 8.5 Task Priority Colors

**File:** `my-tasks-widget.tsx`

| Priority | Background | Text |
|---|---|---|
| Urgent | `bg-red-100` | `text-red-700` |
| High | `bg-orange-100` | `text-orange-700` |
| Normal | `bg-blue-100` | `text-blue-700` |
| Low | `bg-gray-100` | `text-gray-600` |

### 8.6 Task Status Colors (Task Queue)

**File:** `task-queue-client.tsx`

Task queue uses border-left colors for status indication:

| Status | Border |
|---|---|
| Default / Backlog | `border-gray-300` |
| In Progress | `border-blue-400` |
| Blocked | `border-amber-400` |
| Done | `border-green-400` |
| Overdue | `border-red-300` |
| Follow-up | `border-orange-400` |
| Review | `border-purple-400` |

### 8.7 Audit Log Event Type Colors

**File:** `audit-logs-viewer.tsx`

| Event Type | Background |
|---|---|
| Create | `bg-green-100` |
| Delete | `bg-red-100` |
| Login | `bg-blue-100` |
| Permission | `bg-purple-100` |
| Billing | `bg-green-100` |
| Security | `bg-red-100` |
| Integration | `bg-orange-100` |
| Export | `bg-teal-100` |
| Import | `bg-yellow-100` |
| Error | `bg-red-100` |
| Default | `bg-gray-100` |

### 8.8 Bug Report Severity/Status Colors

**File:** `BugReportsTab.tsx`

| Category | Background | Text |
|---|---|---|
| Feature Request | `bg-yellow-100` | `text-yellow-800` |
| Bug | `bg-blue-100` | `text-blue-800` |
| Improvement | `bg-purple-100` | `text-purple-800` |
| Resolved | `bg-green-100` | `text-green-800` |
| Default | `bg-gray-100` | `text-gray-800` |

Severity:
| Severity | Background | Text |
|---|---|---|
| Critical | `bg-red-100` | `text-red-800` |
| High | `bg-orange-100` | `text-orange-800` |
| Medium | `bg-yellow-100` | `text-yellow-800` |
| Low | `bg-gray-100` | `text-gray-600` |

### 8.9 Content Status Colors

**Files:** `ContentList.tsx`, `ContentCalendar.tsx`

| Status | Background | Text |
|---|---|---|
| Draft | `bg-gray-100` | `text-gray-700` |
| In Review | `bg-yellow-100` | `text-yellow-800` |
| Approved | `bg-green-100` | `text-green-800` |
| Scheduled | `bg-blue-100` | `text-blue-800` |
| Published | `bg-purple-100` | `text-purple-800` |
| Archived | `bg-slate-100` | `text-slate-500` |

### 8.10 Competitive Intelligence Badge

**File:** `CompetitiveIntelBadge.tsx`

| Level | Background | Text | Border |
|---|---|---|---|
| Behind | `bg-red-500` | `text-red-700` | `border-red-200` |
| Competitive | `bg-yellow-400` | `text-yellow-700` | `border-yellow-200` |
| Ahead | `bg-green-500` | `text-green-700` | `border-green-200` |

### 8.11 Financial Indicator Colors

**Files:** `FinancialOverviewSection.tsx`, `company-profitability-widget.tsx`, `my-earnings-widget.tsx`

| State | Text Color |
|---|---|
| Positive / Profit / Up | `text-green-600` or `text-green-500` |
| Warning / Pending | `text-amber-600` or `text-orange-600` |
| Negative / Loss / Down | `text-red-600` or `text-red-500` |
| Neutral / Info | `text-blue-600` |

### 8.12 Upsell Opportunity Priority

**File:** `upsell-opportunities.tsx`

| Priority | Background | Text | Border |
|---|---|---|---|
| High | `bg-red-50` | `text-red-600` | `border-red-200` |
| Medium | `bg-orange-50` | `text-orange-600` | `border-orange-200` |
| Low | `bg-yellow-50` | `text-yellow-600` | `border-yellow-200` |

---

## 9. Dark Mode Coverage Assessment
### Approach

The codebase uses a **hybrid approach** to dark mode:

1. **CSS variables in `.dark {}` selector** — the shadcn base tokens (globals.css) automatically adapt via `darkMode: ["class"]` in Tailwind config. The `next-themes` package (in dependencies) controls the class toggle.
2. **`dark:` class variants** on hardcoded Tailwind utility classes — used for component-level dark mode overrides.

### Coverage by the Numbers

- **Total `dark:` variant usages found:** 201 across `src/`
- **Total hardcoded color classes (without dark:):** ~1,229 (components + pages)
- **Rough coverage ratio:** ~16% of hardcoded color usages have explicit `dark:` overrides

This means approximately **84% of hardcoded color classes lack explicit dark mode handling** and rely entirely on either:
- The shadcn CSS variable system (which handles dark mode automatically)
- Having no dark mode alternative (which means they render as-is in dark mode)

### Components WITH Good Dark Mode Coverage

These components have systematic `dark:` variants on most/all hardcoded color classes:

1. **`task-queue-client.tsx`** — 30+ dark: variants (most comprehensive dark mode component)
2. **`dashboard-widgets.tsx`** — 16+ dark: variants
3. **`sales-tools-panel.tsx`** — 14 dark: variants (all categories covered)
4. **`territory-health-banner.tsx`** — 6 dark: variants (full coverage of health states)
5. **`BugReportsTab.tsx`** — 9+ dark: variants
6. **`onboarding-wizard.tsx`** / `rep-onboarding-wizard.tsx` — 10+ dark: variants each
7. **`DataImportTab.tsx`** — 6+ dark: variants
8. **`website-studio/` components** — DnaLab.tsx, PageComposer.tsx, BuildQueue.tsx, ApprovalModal.tsx, NewPropertyModal.tsx, PropertyMatrix.tsx — all have dark: variants

### Top 5 Areas LACKING Dark Mode Coverage

1. **PDF/Print Pages** (`brochure/page.tsx`, `comp-sheet/page.tsx`, `territory-map/page.tsx`) — All inline styles with hardcoded hex. No dark mode consideration. **Acceptable** — these are print-context pages rendered by `@react-pdf/renderer` which doesn't support dark mode.

2. **Recharts/Analytics Charts** (`analytics/advanced-charts.tsx`, `intelligence-trends.tsx`, `performance-dashboard.tsx`) — All chart colors are hardcoded hex in stroke/fill attributes. No dark mode consideration for chart backgrounds, gridlines, or data series colors.

3. **Welcome/Onboarding Flow** (`welcome/[token]/page.tsx`) — 90+ text color usages, very few dark: variants. Heavy use of gray-500/600/700/800/900 text colors.

4. **Financial Widgets** (`FinancialOverviewSection.tsx`, `my-earnings-widget.tsx`, `company-profitability-widget.tsx`) — Status colors (green/red/orange for profit/loss) have no dark: variants.

5. **Client Portfolio & Profile** (`portfolio.tsx`, `profile.tsx`) — Health score color badges use bg-green/yellow/red-100 without dark: variants.

### Dark Mode Strategy Assessment

The codebase has a **two-tier dark mode architecture:**

- **Tier 1 (Automatic):** All components using only shadcn semantic classes (`bg-background`, `text-foreground`, `bg-card`, etc.) get dark mode for free via the CSS variable layer. This covers layout shells, cards, dialogs, and most shadcn/ui primitives.

- **Tier 2 (Manual):** Components using hardcoded Tailwind color classes need explicit `dark:` variants. Coverage here is **inconsistent** — some newer components (task queue, dashboard widgets, sales tools, website studio) have thorough dark mode support, while older components (portfolio, analytics, onboarding) do not.

---

## 10. External Library Color Dependencies

### recharts (v3.7.0)

**Configuration approach:** Colors are hardcoded as hex strings directly on `<Line>`, `<Bar>`, `<Area>` component props (`stroke`, `fill`). No centralized chart theme or color palette configuration exists.

**Colors used in charts:**

| Hex | Tailwind Equivalent | Semantic Meaning |
|---|---|---|
| `#10b981` | emerald-500 | Revenue, positive metrics, uptime |
| `#3b82f6` | blue-500 | Primary metric, leads, comparisons |
| `#f59e0b` | amber-500 | Churn, warning metrics |
| `#ef4444` | red-500 | Errors, negative metrics |
| `#8b5cf6` | violet-500 | Supplementary data series |
| `#2563eb` | blue-600 | Health score line |
| `#16a34a` | green-600 | Performance line |
| `#9333ea` | purple-600 | SEO score line |

**Note:** `dashboard-usage-panel.tsx` is the **only** chart component that uses semantic CSS variables (`hsl(var(--primary))`) instead of hardcoded hex. This is the pattern the token system should expand to all charts.

### shadcn/ui

shadcn/ui uses the CSS custom properties defined in `globals.css` as its theming layer. No additional shadcn theme configuration files exist beyond `globals.css`. The `components.json` file (if present) may specify the shadcn style preset, but all color customization flows through the CSS variables.

### @react-pdf/renderer (v4.3.2)

Used for PDF generation in onboarding pages. Requires inline styles — cannot use Tailwind classes or CSS variables. All colors in PDF pages are hardcoded hex values. This is an inherent library limitation.

### next-themes (v0.4.6)

Provides the dark mode class toggle mechanism. Works with Tailwind's `darkMode: ["class"]` configuration. No color configuration — it only manages the class.

### Other Libraries

- **emoji-mart** — Uses its own internal color scheme, no project-level color configuration.
- **driver.js** — Onboarding tour overlay — uses its own color scheme, no project-level override found.
- **react-grid-layout** — Layout only, no color configuration.
- **sonner** (toast library) — Inherits shadcn theme tokens from globals.css.

---

## AUDIT SUMMARY

**Total hardcoded color classes found:** ~1,229 (1,066 in components + 163 in pages)
**Total inline color values found:** 109 (50 inline styles + 59 hex color references in style objects)
**Total SVG/chart color values found:** 44
**shadcn semantic tokens in use:** Yes — background, foreground, card, popover, primary, secondary, muted, accent, destructive, border, input, ring (full shadcn set)
**Runtime brand injection:** Yes — 3 properties (`--brand-primary`, `--brand-secondary`, `--brand-accent`)
**Dark mode approach:** Hybrid (CSS variables for base layer + `dark:` class variants for hardcoded colors)
**Estimated dark mode coverage:** **Few** (~16% of hardcoded color usages have dark: variants; base layer via CSS variables covers structural elements automatically)

**Top 5 areas of concern for token migration:**

1. **Status/state color systems (12 distinct patterns)** — Health scores, churn risk, task priority, content status, lead stages, competitive intel, financial indicators, bug severity, audit events, upsell priority, territory health, and approval states all use the same green/yellow/orange/red pattern but define colors independently in each component. A unified semantic token system (`color.status.success`, `color.status.warning`, `color.status.danger`, `color.status.info`) would eliminate ~400+ hardcoded class usages.

2. **Chart colors completely bypass the token system** — 44 hardcoded hex values across recharts components. Only 1 of 8 chart components uses CSS variables. All chart colors need to migrate to semantic tokens for dark mode support and brand consistency.

3. **PDF/print pages use a custom navy (#1e3a5f) not in any token system** — This appears to be a GHM brand color that should be formalized as a brand token. These pages also duplicate standard Tailwind colors as hex values because @react-pdf/renderer can't use CSS classes.

4. **Welcome onboarding page is a color-class hotspot** — `welcome/[token]/page.tsx` alone accounts for ~90 text color usages and ~30 bg color usages, almost entirely without dark mode variants. This single file represents ~10% of all hardcoded color usage in the project.

5. **Inconsistent shade usage across the same semantic concept** — "positive/success" is variously `green-500`, `green-600`, `green-700`, `green-800`, `emerald-500`, and `emerald-600` depending on the component. "Warning" is variously `yellow-*`, `amber-*`, and `orange-*`. Standardizing on a single shade per semantic intent would improve visual consistency.