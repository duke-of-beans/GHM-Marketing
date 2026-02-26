# SPRINT 24 — Unified UX Quality Blueprint (3-Pass Cowork Execution)
**Last Updated:** February 26, 2026
**Scope:** Dark Theme Audit + Voice Audit + Tooltip/Help Text Audit
**Execution:** Sequential — Pass 1 → Pass 2 → Pass 3, one commit per pass
**Codebase:** D:\Work\SEO-Services\ghm-dashboard

---

## Execution Order & Rationale

| Pass | Focus | Touches | Collision Risk |
|------|-------|---------|---------------|
| 1 | Dark Theme — structural color classes | CSS class names in `className` strings | None with Pass 2/3 |
| 2 | Voice Audit — UI copy strings | Text content, labels, headings, placeholders | None with Pass 1/3 |
| 3 | Tooltip / Help Text — new JSX props & wrappers | Adds `title=`, `aria-label=`, `<Tooltip>` wrappers | None with Pass 1/2 |

Zero collision: Pass 1 edits class names. Pass 2 edits string literals. Pass 3 adds new JSX attributes/elements. They never touch the same code.

---

## ══════════════════════════════════════════════════════════════
## PASS 1: DARK THEME AUDIT
## ══════════════════════════════════════════════════════════════

### What This Is

The codebase has a complete CSS custom property token system (`globals.css`) with both light and dark mode values. Components that use semantic tokens (`bg-background`, `text-foreground`, `bg-card`, `text-muted-foreground`, `bg-status-success-bg`, etc.) automatically adapt to dark mode.

The problem: **273 hardcoded Tailwind color classes across 54 files** bypass the token system. These render correctly in light mode but break in dark mode (e.g., `bg-white` stays white on a dark background, `text-gray-600` becomes invisible on dark surfaces).

Additionally, **116 explicit `dark:` variant classes across 30 files** are manual dark mode overrides. Most of these exist because the light-mode class was hardcoded — once the light-mode class is replaced with a semantic token, the `dark:` override becomes unnecessary and should be removed.

### Scope — What Gets Migrated

**Structural/surface colors (migrate to tokens):**

| Hardcoded Class | Semantic Token Replacement | When to Use |
|----------------|---------------------------|-------------|
| `bg-white` | `bg-card` or `bg-background` | `bg-card` for cards, panels, modals, dropdowns. `bg-background` for page-level surfaces. |
| `bg-black` | `bg-foreground` | Rare — only where true black background is needed for contrast (e.g., overlay). Review each instance. |
| `text-white` | `text-card-foreground` or `text-primary-foreground` | `text-primary-foreground` when on a `bg-primary` button. `text-card-foreground` when on a card. If on a colored status badge, leave as-is (intentional contrast). |
| `text-black` | `text-foreground` | Primary text color. |
| `bg-gray-50`, `bg-gray-100`, `bg-slate-50`, `bg-slate-100` | `bg-muted` or `bg-background` | `bg-muted` for subtle section backgrounds, hover states. `bg-background` for page chrome. |
| `bg-gray-200`, `bg-slate-200` | `bg-secondary` | Panel backgrounds, secondary surfaces. |
| `bg-gray-800`, `bg-gray-900`, `bg-slate-800`, `bg-slate-900` | `bg-card` (in dark context) or `bg-background` | These are often dark-mode-specific already — remove if covered by token. |
| `text-gray-400`, `text-gray-500`, `text-slate-400`, `text-slate-500` | `text-muted-foreground` | Secondary/helper text, timestamps, labels. |
| `text-gray-600`, `text-gray-700`, `text-slate-600`, `text-slate-700` | `text-foreground` or `text-muted-foreground` | `text-foreground` for body text. `text-muted-foreground` for secondary emphasis. Context-dependent — read surrounding code. |
| `text-gray-800`, `text-gray-900`, `text-slate-800`, `text-slate-900` | `text-foreground` | Primary headings, strong labels. |
| `border-gray-200`, `border-gray-300`, `border-slate-200`, `border-slate-300` | `border-border` | Standard borders. |
| `border-gray-100`, `border-slate-100` | `border-border` | Lighter borders — still use `border-border` (the token handles the value). |
| `divide-gray-200`, `divide-slate-200` | `divide-border` | Table/list dividers. |

**Context-dependent decisions (READ CODE, DON'T BLINDLY REPLACE):**

- `bg-white` inside a dropdown/popover → `bg-popover`
- `bg-white` inside a modal → `bg-card`
- `bg-white` as a hover state on already-white background → `bg-muted` (needs contrast shift)
- `text-gray-500` as a label → `text-muted-foreground`
- `text-gray-500` as disabled text → keep or use `text-muted-foreground/50` (opacity)
- `bg-gray-100` as selected/active state → `bg-accent` or `bg-muted`
- `bg-gray-100` as zebra-stripe → `bg-muted/50`

### What Gets Removed — `dark:` Variants

After replacing a hardcoded class with its semantic token, remove the paired `dark:` override.

**Pattern:**
```
BEFORE: className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
AFTER:  className="bg-card text-foreground"
```

**Rule:** Only remove a `dark:` variant if the corresponding light-mode class was replaced with a semantic token in the same edit. Do NOT remove orphaned `dark:` variants without also fixing the light-mode class.

**Exception — keep `dark:` variants for:**
- Status badge dot indicators in `status-badge.tsx` (EXCLUDED FILE)
- Any class that has no semantic token equivalent (e.g., `dark:shadow-none` — structural, keep)
- Intentional dark-mode-only visibility (`dark:block hidden` patterns)

### Excluded Files (DO NOT MODIFY)

1. `src/app/globals.css` — token definitions, not consumer
2. `tailwind.config.ts` — config, not consumer
3. `src/components/branding/BrandThemeInjector.tsx` — programmatic token injection
4. `src/components/ui/status-badge.tsx` — intentional raw Tailwind for dot variants
5. `src/lib/email/index.ts` — HTML email templates use inline hex (email clients don't support CSS variables)
6. `src/lib/email/templates.ts` — same reason
7. `src/lib/audit/template.ts` — PDF generation, inline styles
8. `src/lib/demo/template.ts` — PDF generation, inline styles
9. `src/lib/reports/template.ts` — PDF generation, inline styles
10. `src/lib/pdf/work-order-template.tsx` — react-pdf inline styles
11. `src/app/(onboarding)/brochure/page.tsx` — react-pdf
12. `src/app/(onboarding)/comp-sheet/page.tsx` — react-pdf
13. `src/app/(onboarding)/territory-map/page.tsx` — react-pdf
14. `src/components/ui/*.tsx` — shadcn/ui primitives already use tokens correctly. Only modify if grep shows hardcoded colors.
15. `src/types/index.ts` — type definitions, `dark:` strings are in type unions/constants, not rendered classes

### Top Files by Usage (attack order)

| File | Hardcoded | `dark:` | Total |
|------|-----------|---------|-------|
| welcome/[token]/page.tsx | 101 | 0 | 101 |
| LocalPresenceTab.tsx | 45 | 0 | 45 |
| CitationsTab.tsx | 26 | 0 | 26 |
| RankingsTab.tsx | 16 | 0 | 16 |
| task-queue-client.tsx | 6 | 12 | 18 |
| nav.tsx | 7 | 8 | 15 |
| dashboard-widgets.tsx | 2 | 10 | 12 |
| sales-tools-panel.tsx | 0 | 8 | 8 |
| rep-onboarding-wizard.tsx | 0 | 6 | 6 |
| onboarding-wizard.tsx | 0 | 4 | 4 |

### Verification

After all replacements:

```powershell
# Should return ONLY excluded files (emails, PDFs, status-badge, types, globals, tailwind.config)
Get-ChildItem -Recurse -Include "*.tsx","*.ts" -Path "src" |
  Select-String -Pattern "bg-white|bg-black|text-white|text-black|bg-gray-[0-9]+|text-gray-[0-9]+|border-gray-[0-9]+|bg-slate-[0-9]+|text-slate-[0-9]+|border-slate-[0-9]+|bg-zinc-[0-9]+|text-zinc-[0-9]+|border-zinc-[0-9]+" |
  Where-Object { $_.Path -notmatch "node_modules|\.next|globals\.css|tailwind\.config|email|template\.ts|work-order|brochure|comp-sheet|territory-map|status-badge|BrandThemeInjector|types[\\/]index" } |
  Group-Object Path | Select-Object Count, Name | Format-Table -AutoSize
```

**Expected result:** Empty (zero files) or only shadcn/ui primitives that were intentionally skipped.

```powershell
# dark: variant check — should be minimal (only intentional structural dark: variants)
Get-ChildItem -Recurse -Include "*.tsx","*.ts" -Path "src" |
  Select-String -Pattern "dark:" |
  Where-Object { $_.Path -notmatch "node_modules|\.next|globals\.css|tailwind\.config|status-badge|types[\\/]index" } |
  Measure-Object | Select-Object -Exp Count
```

**Expected result:** Under 15 remaining (structural `dark:` variants with no token equivalent).

### Commit

```
feat: Sprint 24 Pass 1 — Dark Theme Token Migration

Replaced N hardcoded Tailwind color classes with semantic tokens across N files.
Removed N dark: variant overrides (tokens handle dark mode automatically).
Excluded: email templates, PDF generators, status-badge, type definitions.
```

---

## ══════════════════════════════════════════════════════════════
## PASS 2: VOICE AUDIT (UI COPY)
## ══════════════════════════════════════════════════════════════

### What This Is

All user-facing text in the dashboard must sound like a professional B2B marketing platform — not a consumer app, not a startup MVP, not an internal tool. The voice is reserved, confident, precise. No emoji in functional UI. No exclamation marks in labels. No casual language in controls.

### Voice Rules

**Tone:** Reserved, professional, B2B SaaS. Think Xero, Linear, Stripe Dashboard.

**BANNED in functional UI:**
- Emoji in headings, labels, buttons, column headers, badge text, status text, metric labels, empty states
- Emoji ARE allowed in: TeamFeed posts (user-generated content), EmojiPicker component, notification celebration moments (sparingly)
- Exclamation marks in labels, headers, or status text (allowed in onboarding congratulations only)
- "Awesome", "Cool", "Sweet", "Yay", "Boom", "Nice!", "Great job!", "You're all set!"
- "Check out", "Don't miss", "Get started!" (with exclamation)
- "Upsell" / "upsell" — replace with "Additional services" or "Expansion opportunities"
- Consumer-sounding CTAs ("Try it now!", "Unlock this feature!")

**PREFERRED voice:**
- "No [items] found" not "Nothing here yet! 🎉"
- "Additional services available" not "Upsells available"
- "Setup complete" not "You're all set! 🚀"
- "Action required" not "Hey! Don't forget to..."
- "Import complete — 24 records processed" not "Awesome! Your import worked!"
- "Commission earned" not "💰 Ka-ching!"
- Labels: "Revenue" not "💰 Revenue". "Health Score" not "🏥 Health Score"

**EXCEPTION — keep emoji in:**
- `src/components/team-feed/EmojiPicker.tsx` — this IS an emoji picker
- TeamFeed compose/display — user content, not platform UI
- Achievement/celebration toasts — sparingly, max 1 emoji per toast

### Scope

All `.tsx` files in `src/components/` and `src/app/` — every string literal that renders as visible UI text.

**What to scan for:**
1. Emoji characters in JSX text content, string literals, template literals
2. "upsell" / "Upsell" terminology (replace with professional alternative)
3. Casual/excited copy patterns (see BANNED list)
4. Inconsistent capitalization in labels (e.g., some say "health score", others "Health Score" — standardize to Title Case for labels, Sentence case for descriptions)

**Top files from audit:**

| File | Emoji | Issues |
|------|-------|--------|
| my-earnings-widget.tsx | 16 | Heavy emoji in financial UI |
| upsell-opportunities.tsx | 8 | "Upsell" terminology + emoji |
| profile.tsx | 5 | Emoji in client profile labels |
| compensation-config.tsx | 5 | Emoji in compensation UI |
| brochure/page.tsx | 5 | Marketing PDF — emoji in professional document |
| analytics-dashboard.tsx | 4 | Emoji in analytics labels |
| onboarding-wizard.tsx | 2 | Casual copy |
| rep-onboarding-wizard.tsx | 2 | Casual copy |
| AdminSetupWizard.tsx | 2 | Casual copy |
| nav.tsx | 1 | Emoji in navigation |

### Excluded Files

1. `src/components/team-feed/EmojiPicker.tsx` — this IS an emoji picker
2. `src/components/team-feed/` — all TeamFeed components render user content where emoji are appropriate
3. Email templates (`src/lib/email/`) — separate voice, separate audit
4. PDF templates — separate branding audit
5. `src/types/index.ts` — type definitions, not rendered

### Decision Guide for Ambiguous Cases

- **Onboarding wizard congratulations:** Replace emoji, keep warm-but-professional tone. "Setup complete. Your dashboard is ready." not "🎉 Awesome! You're all set!"
- **Dashboard metric labels:** Remove all emoji prefixes. "Revenue" not "💰 Revenue". "Tasks" not "📋 Tasks".
- **Empty states:** Professional and helpful. "No clients match these filters." not "😕 Nothing found."
- **Celebration toasts (achievement unlocked, milestone):** MAY keep 1 emoji per toast. "🎯 First client added" is acceptable. "🎉🚀💪 AWESOME! You added a client!!!" is not.
- **Financial displays:** Zero emoji. "Commission: $2,450" not "💰 Commission: $2,450 🤑"

### Verification

```powershell
# Emoji scan — should return ONLY TeamFeed/EmojiPicker files
Get-ChildItem -Recurse -Include "*.tsx" -Path "src" |
  Select-String -Pattern '[\x{1F300}-\x{1F9FF}\x{2600}-\x{26FF}\x{2700}-\x{27BF}]' |
  Where-Object { $_.Path -notmatch "node_modules|\.next|EmojiPicker|team-feed" } |
  Group-Object Path | Select-Object Count, Name | Format-Table -AutoSize

# "upsell" terminology — should return zero
Get-ChildItem -Recurse -Include "*.tsx","*.ts" -Path "src" |
  Select-String -Pattern "upsell|Upsell" -CaseSensitive |
  Where-Object { $_.Path -notmatch "node_modules|\.next" } |
  Measure-Object | Select-Object -Exp Count
```

**Expected:** Emoji grep returns only TeamFeed/EmojiPicker. Upsell grep returns 0.

### Commit

```
feat: Sprint 24 Pass 2 — Voice Audit (Professional B2B Copy)

Removed N emoji from functional UI across N files.
Replaced "upsell" terminology with professional alternatives.
Standardized label capitalization to Title Case.
Preserved emoji in TeamFeed (user content) and EmojiPicker.
```

---

## ══════════════════════════════════════════════════════════════
## PASS 3: TOOLTIP / HELP TEXT AUDIT
## ══════════════════════════════════════════════════════════════

### What This Is

Interactive elements and data displays throughout the dashboard lack contextual help. Icon-only buttons have no labels. Metric cards show numbers without explaining what they mean. Filter controls assume domain knowledge. New users (and new tenants) are left guessing.

### Existing Infrastructure

The codebase already has a Radix UI Tooltip component at `src/components/ui/tooltip.tsx`:
```tsx
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
```

The app likely already wraps the root in `<TooltipProvider>`. If not, add it to the root layout.

### What Gets Tooltips

**Priority 1 — Icon-only buttons (no visible text label):**
Every `<Button>` with `variant="ghost"` or `variant="outline"` that contains only an icon and no text label MUST get a tooltip. Currently ~135 such buttons lack tooltips.

Pattern:
```tsx
// BEFORE
<Button variant="ghost" size="icon" onClick={handleRefresh}>
  <RefreshCw className="h-4 w-4" />
</Button>

// AFTER
<Tooltip>
  <TooltipTrigger asChild>
    <Button variant="ghost" size="icon" onClick={handleRefresh}>
      <RefreshCw className="h-4 w-4" />
    </Button>
  </TooltipTrigger>
  <TooltipContent>Refresh data</TooltipContent>
</Tooltip>
```

Also add `aria-label` to the button for screen readers:
```tsx
<Button variant="ghost" size="icon" aria-label="Refresh data" onClick={handleRefresh}>
```

**Priority 2 — Metric displays and scores:**
Any numeric display that isn't self-explanatory needs a tooltip explaining what it measures and how.

Examples:
- Health Score (0-100) → "Composite score reflecting GBP engagement, citation accuracy, and ranking trends over 30 days"
- Churn Risk → "Likelihood of client cancellation based on engagement decline, ticket volume, and contract age"
- Impact Score → "Estimated business impact of addressing this issue, based on traffic potential and competitive gap"
- Close Likelihood → "Probability of converting this lead, based on engagement signals and pipeline stage duration"
- MRR, ARR, LTV → Standard financial tooltips

**Priority 3 — Non-obvious controls:**
- Filter dropdowns with domain-specific options
- Toggle switches that aren't self-labeling
- Action buttons whose consequences aren't clear ("Archive", "Sync", "Process")

### Tooltip Voice

Reserved, informational, brief. One sentence. No exclamation marks. No emoji.

**Good:** "Health score reflects GBP engagement, citation accuracy, and ranking position over 30 days."
**Bad:** "Check out your health score! It shows how your client is doing! 🏥"
**Good:** "Delete this lead permanently. This action cannot be undone."
**Bad:** "Are you sure? This is permanent!"

### Implementation Rules

1. **Import Tooltip at the top** of every file that gets tooltips added:
   ```tsx
   import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
   ```
   Only add the import if the file doesn't already have it.

2. **TooltipProvider must wrap the app.** Check `src/app/layout.tsx` or equivalent root. If `<TooltipProvider>` is not present, add it wrapping `{children}`.

3. **Every tooltip also gets `aria-label`** on the trigger element for accessibility.

4. **Don't tooltip everything.** Buttons with visible text labels ("Save Changes", "Add Client", "Export CSV") do NOT need tooltips — the label is the tooltip. Only icon-only buttons, abbreviated labels, and non-obvious metrics.

5. **Tooltip content must be concise** — max 15 words. If more explanation is needed, that's a help panel, not a tooltip.

### Top Files Needing Tooltips

Based on the audit, these files have the most icon-only buttons and unlabeled controls:

| File | Est. Tooltips Needed | Focus |
|------|---------------------|-------|
| nav.tsx | 5-8 | Nav icon buttons |
| task-queue-client.tsx | 8-12 | Action buttons, status icons |
| dashboard-widgets.tsx | 6-10 | Metric cards, action icons |
| analytics-dashboard.tsx | 5-8 | Chart controls, metric labels |
| profile.tsx (client) | 8-12 | Score displays, action buttons |
| pipeline views | 5-8 | Lead card actions, stage controls |
| settings tabs | 4-6 | Config toggles, action buttons |
| discovery-dashboard.tsx | 4-6 | Scan controls, score displays |
| ApprovalQueue.tsx | 3-5 | Approval action buttons |
| ContentList.tsx | 3-5 | Content action buttons |

### Tooltip Content Guide (What Each Metric Means)

The agent should read the context around each metric to write accurate tooltips. Here are known metrics:

| Metric | Tooltip |
|--------|---------|
| Health Score | "Composite score: GBP engagement, citation accuracy, and ranking trends (30 days)" |
| Churn Risk | "Cancellation likelihood based on engagement, support volume, and contract age" |
| Impact Score | "Business impact estimate based on traffic potential and competitive gap" |
| Close Likelihood | "Conversion probability based on engagement signals and stage duration" |
| MRR | "Monthly recurring revenue from active subscriptions" |
| ARR | "Annual recurring revenue (MRR × 12)" |
| LTV | "Estimated lifetime value based on average contract length and MRR" |
| Domain Authority | "Third-party score (0-100) estimating search ranking strength" |
| Citation Score | "Accuracy and consistency of business listings across directories" |
| GBP Score | "Google Business Profile optimization completeness" |
| Ranking Position | "Average position in local search results for tracked keywords" |

For metrics NOT in this table, the agent should read the surrounding code (variable names, comments, data source) to write an accurate 10-15 word tooltip.

### Verification

```powershell
# Icon-only buttons without tooltip or aria-label — should be zero
Get-ChildItem -Recurse -Include "*.tsx" -Path "src/components" |
  Select-String -Pattern '<Button[^>]*variant=.(ghost|outline|icon)' |
  Where-Object {
    $_.Line -match 'size=.icon' -or
    ($_.Line -notmatch '>[A-Za-z]' -and $_.Line -match '<[A-Z][a-z]+\s+className')
  } |
  Where-Object { $_.Line -notmatch "title=|aria-label=|Tooltip" } |
  Measure-Object | Select-Object -Exp Count
```

**Expected:** Under 10 remaining (some buttons may be inside mapped arrays where the tooltip is on a parent).

### Commit

```
feat: Sprint 24 Pass 3 — Tooltip & Help Text Audit

Added tooltips to N icon-only buttons across N files.
Added metric tooltips to N score/data displays.
Added aria-labels for accessibility on all tooltipped elements.
Verified TooltipProvider wraps app root.
```

---

## ══════════════════════════════════════════════════════════════
## FINAL VERIFICATION (After All 3 Passes)
## ══════════════════════════════════════════════════════════════

### TypeScript Check

```powershell
npx tsc --noEmit 2>&1 | Select-String -Pattern "error TS" | Where-Object { $_.Line -notmatch "scripts[\\/]basecamp|import-wave-history" } | Measure-Object | Select-Object -Exp Count
```

**Expected:** 0 new errors (5 pre-existing in scripts/basecamp, import-wave-history, basecamp/client unchanged).

### Update Docs

1. `CHANGELOG.md` — Add 3 entries (one per pass) with date, commit hash, summary
2. `BACKLOG.md` — Delete UX-AUDIT-001, UX-AUDIT-002, UX-AUDIT-005
3. `STATUS.md` — Update "Last Updated" line

### Final Commit (docs only)

```
docs: Sprint 24 completion — close UX-AUDIT-001, UX-AUDIT-002, UX-AUDIT-005
```

### Push

```
git push origin main
```

---

## ══════════════════════════════════════════════════════════════
## COWORK PROMPT (copy-paste into Cowork)
## ══════════════════════════════════════════════════════════════

```
Execute SPRINT_24_BLUEPRINT.md in the GHM Dashboard project root (D:\Work\SEO-Services\ghm-dashboard).

This is a 3-pass UX quality sprint. Each pass is independent — they touch different parts of each file (class names, string content, JSX structure). Execute them in order:

PASS 1: Dark Theme Token Migration — Replace all hardcoded Tailwind gray/white/black/slate color classes with semantic CSS variable tokens (bg-card, text-foreground, text-muted-foreground, bg-muted, border-border, etc.). Remove paired dark: variant overrides when the base class is tokenized. Context-dependent: read surrounding code to pick the right token. ~273 replacements across ~54 files. Excludes: email templates, PDF generators, status-badge, type definitions, globals.css, tailwind.config.

PASS 2: Voice Audit — Remove all emoji from functional UI (keep only in TeamFeed/EmojiPicker). Replace "upsell" with professional alternatives. Fix casual/excited copy to reserved B2B tone. ~58 emoji instances across ~15 files.

PASS 3: Tooltip & Help Text — Add Tooltip wrappers + aria-labels to all icon-only buttons (~135). Add metric tooltips to score displays. Use existing Radix Tooltip component from src/components/ui/tooltip.tsx. Tooltip voice: reserved, informational, max 15 words.

The blueprint contains complete mapping tables, excluded file lists, verification commands, and commit messages for each pass. Read it thoroughly before starting. Run verification greps and TypeScript check after each pass. Three separate commits (one per pass) plus a final docs commit.
```
