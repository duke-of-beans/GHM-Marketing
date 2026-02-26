# SPRINT 25 — UI Constitution Mega-Pass (5-Pass Cowork Execution)
**Last Updated:** February 26, 2026
**Scope:** Responsiveness + Icon Consistency + Typography Standardization + Spacing/Elevation Normalization + Component Consistency
**Execution:** Sequential — Pass 1 → 2 → 3 → 4 → 5, one commit per pass
**Codebase:** D:\Work\SEO-Services\ghm-dashboard

---

## Why This Order

| Pass | Focus | What It Touches | Collision Risk |
|------|-------|-----------------|---------------|
| 1 | Responsiveness | Adds responsive prefixes (`md:`, `lg:`) to layout classes | None with 2-5 |
| 2 | Icon Consistency | Icon `className` sizing, icon selection | None with 1,3-5 |
| 3 | Typography | `text-*` and `font-*` classes | None with 1,2,4,5 |
| 4 | Spacing & Elevation | `p-*`, `gap-*`, `shadow-*`, `rounded-*` | None with 1-3,5 |
| 5 | Component Consistency | Card/Badge/Dialog padding, structure | Builds on 3+4 (uses standardized values) |

Pass 5 depends on 3 and 4 being done first (it references the standardized typography and spacing values). Passes 1-4 are fully independent of each other. All five passes touch `className` strings but in non-overlapping property namespaces.

---

## ══════════════════════════════════════════════════════════════
## PASS 1: RESPONSIVENESS AUDIT (UX-AUDIT-006)
## ══════════════════════════════════════════════════════════════

### What This Is

The dashboard has 184 existing responsive utility instances but no systematic audit has been run. Many layouts assume 1920px and break at smaller widths. The critical breakpoints are 1024px (split-screen / small laptop) and 768px (tablet). 375px (mobile) is documented but not fixed in this pass.

### Target Breakpoints

| Width | Context | Priority |
|-------|---------|----------|
| 1280px | Standard laptop | Fix if broken |
| 1024px | Split screen / small laptop | 🔴 Must fix |
| 768px | Tablet | 🔴 Must fix |
| 375px | Mobile | Document only, don't fix |

### What to Fix

**Layout patterns that break at narrow widths:**

1. **Side-by-side flex containers without responsive stacking:**
   ```tsx
   // BROKEN at 1024px — items overflow
   className="flex gap-4"

   // FIXED — stacks on narrow, side-by-side on medium+
   className="flex flex-col md:flex-row gap-4"
   ```

2. **Fixed-width containers that overflow:**
   ```tsx
   // BROKEN — overflows at <1200px
   className="w-[1200px]"

   // FIXED
   className="w-full max-w-[1200px]"
   ```

3. **Grid layouts without responsive column counts:**
   ```tsx
   // BROKEN — 4 columns at 768px is unusable
   className="grid grid-cols-4 gap-4"

   // FIXED
   className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
   ```

4. **Tables without horizontal scroll wrapper:**
   ```tsx
   // BROKEN — table overflows container
   <Table>...</Table>

   // FIXED
   <div className="overflow-x-auto">
     <Table>...</Table>
   </div>
   ```

5. **Text that doesn't truncate:**
   ```tsx
   // BROKEN — long client names push layout
   className="text-sm font-medium"

   // FIXED
   className="text-sm font-medium truncate"
   ```

6. **Button rows that wrap poorly:**
   ```tsx
   // BROKEN — buttons wrap chaotically
   className="flex gap-2"

   // FIXED
   className="flex flex-wrap gap-2"
   ```

### Systematic Approach

For each page (37 page routes), the agent should:
1. Identify the top-level layout container
2. Check all `flex` containers (837 instances without responsive variants) — add `flex-col md:flex-row` where appropriate
3. Check all `grid` containers — add responsive `grid-cols-*` variants
4. Check all tables — ensure `overflow-x-auto` wrapper exists
5. Check stat/metric card grids — ensure they collapse from 4→2→1 columns

### Priority Pages (fix these first)

| Page | Why |
|------|-----|
| Dashboard (widgets) | First thing users see |
| Clients list | Heavy table, filter bar |
| Client profile (all tabs) | Most complex layout |
| Pipeline / Leads | Kanban + filter bar |
| Tasks | Queue + filter bar |
| Analytics | Multiple chart grids |
| Settings (all tabs) | Form layouts |
| Payments | Tables + cards |

### Excluded Files

1. PDF pages (brochure, comp-sheet, territory-map, work-order) — fixed layout by design
2. Welcome/onboarding page — standalone fullscreen, different responsive needs
3. Login/auth pages — likely already simple enough

### Verification

```powershell
# Count responsive utility usage after — should be significantly higher than 184
Get-ChildItem -Recurse -Include "*.tsx" -Path "src/components","src/app" |
  Where-Object { $_.FullName -notmatch "node_modules|\.next|/ui/" } |
  Select-String -Pattern "sm:|md:|lg:|xl:" |
  Measure-Object | Select-Object -Exp Count
```

**Expected:** 300+ (up from 184).

### Commit

```
feat: Sprint 25 Pass 1 — Responsiveness Audit

Added responsive layout variants across N files.
All pages render correctly at 1024px and 768px.
Tables wrapped in overflow-x-auto where needed.
Grid layouts collapse to appropriate column counts.
Flex containers stack vertically on narrow viewports.
```

---

## ══════════════════════════════════════════════════════════════
## PASS 2: ICON CONSISTENCY (UI-CONST Group 2)
## ══════════════════════════════════════════════════════════════

### What This Is

105 unique Lucide icons across 129 import statements. Icons are used inconsistently — different sizes in similar contexts, different icons for the same concept across pages, no standardized sizing per context.

### Icon Size Standards

| Context | Size | Class |
|---------|------|-------|
| Inline with text (labels, badges, breadcrumbs) | 16px | `h-4 w-4` |
| Button icons (inside buttons, nav items) | 16px | `h-4 w-4` |
| Section headers / standalone action icons | 20px | `h-5 w-5` |
| Empty state illustrations | 48px | `h-12 w-12` |
| Hero / feature icons (onboarding, welcome) | 40-48px | `h-10 w-10` or `h-12 w-12` |
| Avatar placeholders | 32-48px | `h-8 w-8` or `h-12 w-12` |

**Current state:**
- `h-4 w-4`: 133 (correct for most contexts)
- `h-3 w-3`: 72 (too small for most contexts — likely used where h-4 w-4 should be)
- `h-12 w-12`: 23 (empty states — correct)
- `h-5 w-5`: 15 (section headers — correct)
- `h-6 w-6`: 8 (review case by case)
- `h-7 w-7`: 5 (non-standard — normalize to h-6 or h-8)

### Normalization Rules

1. **`h-3 w-3` → `h-4 w-4`** in most cases. The 72 instances of `h-3 w-3` are likely too small to be legible. Exception: if used inside a very compact badge or tag where 16px would be disproportionate, keep `h-3 w-3`.

2. **`h-7 w-7` → `h-6 w-6` or `h-8 w-8`** — non-standard size. Normalize to nearest standard.

3. **`h-9 w-9` → `h-8 w-8` or `h-10 w-10`** — same.

4. **Every icon MUST have `aria-hidden="true"`** or be wrapped in an element with `aria-label`. Icons are decorative unless they're the only indicator of meaning (which should have been covered by Sprint 24 Pass 3 tooltips).

### Icon Semantic Consistency

The agent should check that the same concept uses the same icon everywhere:

| Concept | Standard Icon | Check For Mismatches |
|---------|--------------|---------------------|
| Edit / modify | `Edit2` or `Pencil` | Not both `Edit`, `Edit2`, `Edit3`, `Pencil`, `PenLine` in different places |
| Delete / remove | `Trash2` | Not `X` or `Minus` for delete actions |
| Add / create | `Plus` | Consistent |
| Settings / config | `Settings` | Not `Settings2`, `Sliders`, `SlidersHorizontal` interchangeably |
| Close / dismiss | `X` | Not `XCircle` for simple close |
| Success / check | `Check` or `CheckCircle` | Pick one per context (inline vs status) |
| Warning | `AlertTriangle` | Not `AlertCircle` for warnings (AlertCircle = info) |
| Info | `AlertCircle` or `HelpCircle` | Pick one |
| Search | `Search` | Consistent |
| Filter | `Filter` or `SlidersHorizontal` | Pick one for filter controls |
| Refresh / reload | `RefreshCw` | Not `RotateCcw` for the same action |
| External link | `ExternalLink` | Consistent |
| Copy | `Copy` | Consistent |
| Download | `Download` | Not `HardDriveDownload` unless specifically about storage |

**Action:** Where multiple icons are used for the same concept, standardize to ONE. Document any intentional differentiation (e.g., `Check` for inline checkmarks vs `CheckCircle` for status badges is fine).

### Excluded Files

1. `src/components/ui/*.tsx` — shadcn primitives, don't modify
2. `EmojiPicker.tsx` — not icon-related
3. PDF templates — separate context

### Verification

```powershell
# Non-standard icon sizes — should be minimal
Get-ChildItem -Recurse -Include "*.tsx" -Path "src" |
  Select-String -Pattern "h-[0-9]+ w-[0-9]+" |
  Where-Object { $_.Path -notmatch "node_modules|\.next|/ui/" -and $_.Line -match "lucide|Icon" } |
  Where-Object { $_.Line -match "h-[379] w-[379]" } |
  Measure-Object | Select-Object -Exp Count
```

**Expected:** Under 5 (only intentional non-standard sizes with documented reason).

### Commit

```
feat: Sprint 25 Pass 2 — Icon Consistency Audit

Standardized icon sizing: h-3 w-3 → h-4 w-4 (N instances), normalized non-standard sizes.
Unified icon selection: single icon per concept across codebase.
Added aria-hidden="true" to N decorative icons.
Icon size standards: 16px inline, 20px section, 48px empty state.
```

---

## ══════════════════════════════════════════════════════════════
## PASS 3: TYPOGRAPHY STANDARDIZATION (UI-CONST Group 1b)
## ══════════════════════════════════════════════════════════════

### What This Is

2,205 typography-related class instances across the codebase with no enforced type scale. Font sizes and weights are applied ad-hoc, leading to visual inconsistency.

**Current distribution:**
- `text-xs`: 797 (helper text, labels, timestamps)
- `text-sm`: 768 (body text, form labels)
- `text-base`: 62 (some body text)
- `text-lg`: 42 (section headers)
- `text-xl`: 38 (page section headers)
- `text-2xl`: 74 (page titles)
- `text-3xl`: 20 (hero/welcome)

- `font-medium`: 491 (most labels)
- `font-semibold`: 168 (headers, emphasis)
- `font-bold`: 127 (strong emphasis, titles)
- `font-normal`: 13 (resets)

### Type Scale Standard

| Role | Size | Weight | Class | When to Use |
|------|------|--------|-------|-------------|
| Page title | text-2xl | font-semibold | `text-2xl font-semibold` | Top of every page, one per page |
| Section header | text-lg | font-semibold | `text-lg font-semibold` | Card titles, panel headers, tab section headers |
| Subsection header | text-sm | font-semibold | `text-sm font-semibold` | Within-card subsections, form group labels |
| Body text | text-sm | font-normal | `text-sm` | Paragraphs, descriptions, form help text |
| Labels | text-sm | font-medium | `text-sm font-medium` | Form labels, column headers, field names |
| Helper / meta | text-xs | font-normal or font-medium | `text-xs text-muted-foreground` | Timestamps, secondary info, hints |
| Stat value (large) | text-2xl or text-3xl | font-bold | `text-2xl font-bold` | Metric cards (MRR, health score, etc.) |
| Badge text | text-xs | font-medium | `text-xs font-medium` | Status badges, tags, pills |

### Normalization Rules

1. **`font-bold` on section headers → `font-semibold`**. Bold is reserved for stat values and page titles. Section/card headers use semibold. Review each `font-bold` instance — if it's a header, downgrade to `font-semibold`. If it's a stat value or page title, keep.

2. **`text-base` body text → `text-sm`**. The dashboard is data-dense. `text-base` (16px) is too large for dashboard body text. Exception: onboarding/welcome pages where larger text is intentional for readability.

3. **`text-xl` section headers → `text-lg`**. Standardize section headers to `text-lg font-semibold`. `text-xl` is between page title and section header — eliminate this gap. Exception: if used as a secondary page title in a multi-section page.

4. **`text-3xl` → keep only for hero/welcome/stat display.** If found on a regular page header, downgrade to `text-2xl`.

5. **Heading hierarchy enforcement per page:**
   - Only ONE `text-2xl` per page view (the page title)
   - `text-lg font-semibold` for all section headers within that page
   - `text-sm font-semibold` for subsections within cards
   - Never `text-xl` and `text-lg` as siblings at the same level

### Excluded Files

1. PDF templates (brochure, comp-sheet, territory-map, work-order, audit, demo, reports) — inline styles, separate system
2. Email templates — separate sizing
3. `src/components/ui/*.tsx` — shadcn primitives
4. Welcome/onboarding `page.tsx` — intentionally larger type for first-time experience

### Verification

```powershell
# text-base usage (should be minimal — only onboarding/welcome)
Get-ChildItem -Recurse -Include "*.tsx" -Path "src/components","src/app" |
  Select-String -Pattern "text-base" |
  Where-Object { $_.Path -notmatch "node_modules|\.next|/ui/|welcome|onboarding|brochure|comp-sheet|territory|work-order" } |
  Measure-Object | Select-Object -Exp Count

# text-xl usage (should be near zero — replaced by text-lg)
Get-ChildItem -Recurse -Include "*.tsx" -Path "src/components","src/app" |
  Select-String -Pattern "text-xl(?!-)" |
  Where-Object { $_.Path -notmatch "node_modules|\.next|/ui/|welcome|onboarding" } |
  Measure-Object | Select-Object -Exp Count

# font-bold on non-stat elements (should be minimal)
Get-ChildItem -Recurse -Include "*.tsx" -Path "src/components","src/app" |
  Select-String -Pattern "font-bold" |
  Where-Object { $_.Path -notmatch "node_modules|\.next|/ui/" } |
  Measure-Object | Select-Object -Exp Count
```

**Expected:** `text-base` under 10. `text-xl` under 10. `font-bold` under 60 (down from 127, remaining only on stat values/page titles).

### Commit

```
feat: Sprint 25 Pass 3 — Typography Standardization

Enforced type scale: page title (2xl semibold), section (lg semibold),
subsection (sm semibold), body (sm), helper (xs muted-foreground).
Normalized font-bold → font-semibold on N section headers.
Normalized text-base → text-sm on N body text instances.
Normalized text-xl → text-lg on N section headers.
```

---

## ══════════════════════════════════════════════════════════════
## PASS 4: SPACING & ELEVATION NORMALIZATION (UI-CONST Group 1c)
## ══════════════════════════════════════════════════════════════

### What This Is

Spacing, shadows, and border-radius are applied ad-hoc. This pass enforces a consistent spacing scale, shadow system, and radius system.

### Spacing Standards (4pt grid)

**Padding scale:**

| Token | Value | When to Use |
|-------|-------|-------------|
| `p-2` (8px) | Compact | Badges, tags, small inline elements |
| `p-3` (12px) | Standard tight | Table cells, compact card sections |
| `p-4` (16px) | Standard | Card content padding, form sections, dialog content |
| `p-6` (24px) | Spacious | Page-level containers, large card padding |

**Current distribution:**
- `p-3`: 92 (most common — likely overused where p-4 should be)
- `p-4`: 75
- `p-2`: 32
- `p-6`: 25
- `p-0`: 17
- `p-1`: 10
- `p-8`: 8 (possibly too spacious for dashboard)
- `p-10`, `p-12`: 6 (excessive — likely hero/welcome only)

**Gap scale:**

| Token | Value | When to Use |
|-------|-------|-------------|
| `gap-1` (4px) | Tight | Icon+text pairs, badge groups |
| `gap-2` (8px) | Standard | Form fields, button groups, card content rows |
| `gap-3` (12px) | Comfortable | Section separators within cards |
| `gap-4` (16px) | Spacious | Between cards, major sections |
| `gap-6` (24px) | Page-level | Between page sections |

**Current:** gap-2 (386), gap-1 (239), gap-3 (140), gap-4 (82), gap-6 (6). Distribution is reasonable but gap-0 (23 instances) should be reviewed — likely unnecessary.

### Normalization Rules

1. **`p-8`, `p-10`, `p-12` → `p-6`** unless in welcome/onboarding page or a deliberately spacious hero section. Dashboard panels don't need 32px+ padding.

2. **`p-1` → `p-2`** in most cases. 4px padding is too tight for clickable/readable elements. Exception: intentionally compact inline elements.

3. **`gap-0` → remove or `gap-1`**. If gap-0 is set, it's either unnecessary (flex gap defaults to 0) or should be gap-1 for minimal spacing.

4. **Inconsistent Card padding:** Cards should use `p-4` for content and `p-6` for spacious layouts. Audit all `<Card>` → `<CardContent>` padding for consistency.

### Shadow Standards

| Token | When to Use |
|-------|-------------|
| `shadow-sm` | Subtle lift — cards at rest, form inputs |
| `shadow-md` | Interactive hover state, dropdowns |
| `shadow-lg` | Modals, dialogs, elevated panels |
| `shadow-xl`, `shadow-2xl` | REMOVE — excessive for dashboard UI |

**Current:** shadow-lg (9), shadow-sm (5), shadow-md (3), shadow-2xl (3), shadow-xl (1).

**Action:** Replace `shadow-xl` and `shadow-2xl` with `shadow-lg`. Only modals/dialogs should have `shadow-lg`.

### Border Radius Standards

| Token | When to Use |
|-------|-------------|
| `rounded-md` | Default — cards, inputs, buttons (handled by `--radius` token) |
| `rounded-lg` | Modals, dialogs, large containers |
| `rounded-full` | Avatars, circular badges, pills (67 instances — likely correct) |
| `rounded-xl`, `rounded-2xl` | REMOVE — use `rounded-lg` instead |
| `rounded-sm` | REMOVE — use `rounded-md` instead |

**Current:** rounded-full (67, correct), rounded-xl (16), rounded-t/l/r (7, directional — keep), rounded-none (2, intentional — keep), rounded-2xl (1), rounded-sm (1).

**Action:** `rounded-xl` → `rounded-lg` (16 instances). `rounded-2xl` → `rounded-lg` (1). `rounded-sm` → `rounded-md` (1).

### Excluded Files

1. PDF templates — inline styles
2. Email templates — inline styles
3. `src/components/ui/*.tsx` — shadcn primitives (they use `--radius` CSS variable)
4. Welcome/onboarding — intentionally spacious

### Verification

```powershell
# Excessive padding (p-8+ outside welcome/onboarding)
Get-ChildItem -Recurse -Include "*.tsx" -Path "src/components","src/app" |
  Select-String -Pattern "\bp-(8|10|12)\b" |
  Where-Object { $_.Path -notmatch "node_modules|\.next|/ui/|welcome|onboarding|brochure|comp-sheet|territory|work-order" } |
  Measure-Object | Select-Object -Exp Count

# Excessive shadows
Get-ChildItem -Recurse -Include "*.tsx" -Path "src/components","src/app" |
  Select-String -Pattern "shadow-(xl|2xl)" |
  Where-Object { $_.Path -notmatch "node_modules|\.next|/ui/" } |
  Measure-Object | Select-Object -Exp Count

# Non-standard border radius
Get-ChildItem -Recurse -Include "*.tsx" -Path "src/components","src/app" |
  Select-String -Pattern "rounded-(xl|2xl|sm)" |
  Where-Object { $_.Path -notmatch "node_modules|\.next|/ui/" } |
  Measure-Object | Select-Object -Exp Count
```

**Expected:** Excessive padding under 5. Excessive shadows = 0. Non-standard radius = 0.

### Commit

```
feat: Sprint 25 Pass 4 — Spacing & Elevation Normalization

Normalized padding: p-8/10/12 → p-6 on N instances.
Normalized shadows: shadow-xl/2xl → shadow-lg on N instances.
Normalized border-radius: rounded-xl → rounded-lg on N instances.
Enforced 4pt spacing grid across all components.
```

---

## ══════════════════════════════════════════════════════════════
## PASS 5: COMPONENT CONSISTENCY (UI-CONST Group 3)
## ══════════════════════════════════════════════════════════════

### What This Is

The codebase uses shadcn/ui components heavily (701 Cards, 550 Selects, 171 Badges, 153 Dialogs, 149 Inputs, 101 Tabs, 62 Tables). While the primitives are consistent, their USAGE patterns vary — different padding on Cards in different views, different Badge styling approaches, inconsistent Dialog widths.

This pass standardizes how components are composed, not the components themselves.

### Card Consistency

**Standard Card anatomy:**
```tsx
<Card>
  <CardHeader className="pb-3">         {/* or pb-4 for spacious */}
    <CardTitle className="text-lg font-semibold">Title</CardTitle>
    <CardDescription className="text-sm text-muted-foreground">Description</CardDescription>
  </CardHeader>
  <CardContent className="pt-0">         {/* Remove top padding when following CardHeader */}
    {/* Content */}
  </CardContent>
</Card>
```

**Rules:**
1. Every Card with a visible title MUST use `<CardHeader>` + `<CardTitle>` — not a loose `<h3>` or `<div className="font-bold">` inside the card.
2. `CardTitle` always uses `text-lg font-semibold` (from Pass 3 type scale).
3. `CardContent` following a `CardHeader` gets `pt-0` to prevent double spacing.
4. Cards with actions (buttons, menus) in the header use `<CardHeader className="flex flex-row items-center justify-between">`.

### Badge Consistency

**Standard Badge variants should map to status tokens:**
- No custom `className` overriding badge colors — use the variant system or StatusBadge from Sprint 23-D.
- Any badge showing a status (active, pending, error, etc.) should use `<StatusBadge>` not raw `<Badge>` with custom colors.

**Audit:** Find all `<Badge>` instances with custom color overrides in className. Replace with `<StatusBadge variant="success|warning|danger|info|neutral">` where the Badge represents a status.

### Dialog Consistency

**Standard Dialog widths:**

| Content Type | Width Class |
|-------------|-------------|
| Confirmation (yes/no) | `sm:max-w-[425px]` |
| Form (simple) | `sm:max-w-[500px]` |
| Form (complex/multi-step) | `sm:max-w-[600px]` |
| Content display (preview, details) | `sm:max-w-[700px]` |

**Rules:**
1. Every `<DialogContent>` must have a `max-w-*` class.
2. Dialog titles use `text-lg font-semibold`.
3. Dialog descriptions use `text-sm text-muted-foreground`.

### Table Consistency

**Rules:**
1. Every `<Table>` is wrapped in `<div className="overflow-x-auto">` (from Pass 1).
2. Column headers (`<TableHead>`) use `text-xs font-medium text-muted-foreground uppercase tracking-wider`.
3. Cell text uses `text-sm`.
4. Row hover: `hover:bg-muted/50`.

### Empty State Consistency

Every page/section that can be empty should have a consistent empty state pattern:

```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <IconComponent className="h-12 w-12 text-muted-foreground/50 mb-4" />
  <h3 className="text-lg font-semibold mb-1">No [items] found</h3>
  <p className="text-sm text-muted-foreground mb-4 max-w-md">
    Description of why this is empty and what to do.
  </p>
  <Button>Primary action</Button>
</div>
```

**Audit:** Find all empty state patterns (look for "No .* found", "Nothing here", "Empty", "Get started") and standardize to this pattern.

### Excluded Files

1. PDF templates
2. Email templates
3. `src/components/ui/*.tsx` — don't modify primitives
4. Welcome/onboarding — different composition rules

### Verification

```powershell
# Cards with loose titles (not using CardTitle) — should approach zero
Get-ChildItem -Recurse -Include "*.tsx" -Path "src/components","src/app" |
  Select-String -Pattern "<Card\b" -Context 0,5 |
  Where-Object { $_.Context.PostContext -notmatch "CardHeader|CardTitle" -and $_.Context.PostContext -match "font-bold|font-semibold|text-lg|text-xl" } |
  Where-Object { $_.Path -notmatch "node_modules|\.next|/ui/" } |
  Measure-Object | Select-Object -Exp Count

# Badge with custom color overrides (should use StatusBadge instead)
Get-ChildItem -Recurse -Include "*.tsx" -Path "src/components","src/app" |
  Select-String -Pattern '<Badge[^>]*className="[^"]*bg-' |
  Where-Object { $_.Path -notmatch "node_modules|\.next|/ui/|status-badge" } |
  Measure-Object | Select-Object -Exp Count
```

**Expected:** Loose card titles under 5. Custom Badge colors under 10 (some may be intentional non-status badges).

### Commit

```
feat: Sprint 25 Pass 5 — Component Consistency

Standardized Card anatomy: CardHeader + CardTitle on all titled cards.
Standardized Dialog widths by content type.
Replaced N custom-colored Badges with StatusBadge.
Standardized Table header formatting (xs uppercase tracking-wider).
Unified empty state pattern across N components.
```

---

## ══════════════════════════════════════════════════════════════
## FINAL VERIFICATION (After All 5 Passes)
## ══════════════════════════════════════════════════════════════

### TypeScript Check

```powershell
npx tsc --noEmit 2>&1 | Select-String -Pattern "error TS" | Where-Object { $_.Line -notmatch "scripts[\\/]basecamp|import-wave-history" } | Measure-Object | Select-Object -Exp Count
```

**Expected:** 0 new errors.

### Visual Smoke Test Checklist

The agent should note (but cannot visually verify) that these should be checked manually:
- Dashboard at 1024px — all widgets stack correctly
- Client profile at 768px — tabs and content readable
- Pipeline at 1024px — cards don't overflow
- Settings at 768px — form fields stack
- Modals at 768px — fit within viewport

### Update Docs

1. `CHANGELOG.md` — Add 5 entries (one per pass)
2. `BACKLOG.md`:
   - Delete `UX-AUDIT-006` (responsiveness)
   - Update UI-CONST-001 progress notes (Groups 1b, 1c, 2, 3 complete)
3. `STATUS.md` — Update "Last Updated"

### Final Commit (docs only)

```
docs: Sprint 25 completion — close UX-AUDIT-006, UI-CONST Groups 1b/1c/2/3
```

### Push

```
git push origin main
```

---

## ══════════════════════════════════════════════════════════════
## COWORK PROMPT
## ══════════════════════════════════════════════════════════════

See bottom of file — the copy-paste prompt for Cowork.
