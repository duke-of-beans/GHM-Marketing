# SPRINT 23-E BLUEPRINT — Status Color Token Migration (Cowork Agent)

**Type:** Cowork autonomous agent task  
**Scope:** Migrate ALL hardcoded status-semantic Tailwind color classes to COVOS semantic tokens  
**Constraint:** Code modification task — edits component files, NO logic changes  
**Estimated files:** ~85 component/page files  
**Estimated replacements:** ~490 class swaps  

---

## OBJECTIVE

Replace every hardcoded Tailwind status-color class (green-*, red-*, yellow-*, orange-*, amber-*, emerald-*) with the corresponding COVOS semantic token class from the status token system defined in `globals.css` and `tailwind.config.ts`.

After this sprint, `grep` for `text-green-`, `bg-green-`, `text-red-`, `bg-red-`, etc. across `src/` should return ONLY:
1. PDF pages (excluded — `@react-pdf/renderer` requires inline styles)
2. The `status-badge.tsx` dot classes (intentional — dots use raw Tailwind for the filled circle)
3. `health-sparkline.tsx` (1 usage — deferred, needs trend-direction tokens not status tokens)

Everything else should use `text-status-{variant}`, `bg-status-{variant}-bg`, `border-status-{variant}-border`.

---

## SEMANTIC MAPPING RULES

These are the ONLY valid replacements. When in doubt about which variant a color represents, READ THE SURROUNDING CODE to understand the semantic intent (variable names like `isHealthy`, `churnRisk`, `status === 'active'` tell you what the color means).

### Success (green family → status-success)
**Intent:** healthy, active, complete, positive, good, low risk, approved, online  
```
bg-green-50    → bg-status-success-bg
bg-green-100   → bg-status-success-bg
bg-emerald-50  → bg-status-success-bg
bg-emerald-100 → bg-status-success-bg

text-green-500 → text-status-success
text-green-600 → text-status-success
text-green-700 → text-status-success
text-green-800 → text-status-success
text-emerald-500 → text-status-success
text-emerald-600 → text-status-success
text-emerald-700 → text-status-success

border-green-200 → border-status-success-border
border-green-300 → border-status-success-border
border-emerald-200 → border-status-success-border
```

### Warning (yellow/amber family → status-warning)
**Intent:** at risk, watch, pending, needs attention, medium priority, expiring  
```
bg-yellow-50   → bg-status-warning-bg
bg-yellow-100  → bg-status-warning-bg
bg-amber-50    → bg-status-warning-bg
bg-amber-100   → bg-status-warning-bg

text-yellow-500 → text-status-warning
text-yellow-600 → text-status-warning
text-yellow-700 → text-status-warning
text-yellow-800 → text-status-warning
text-amber-500  → text-status-warning
text-amber-600  → text-status-warning
text-amber-700  → text-status-warning

border-yellow-200 → border-status-warning-border
border-yellow-300 → border-status-warning-border
border-amber-200  → border-status-warning-border
```

### Danger (red/orange family → status-danger)
**Intent:** critical, error, failed, high risk, churning, overdue, rejected, offline  
```
bg-red-50     → bg-status-danger-bg
bg-red-100    → bg-status-danger-bg
bg-orange-50  → bg-status-danger-bg
bg-orange-100 → bg-status-danger-bg

text-red-500  → text-status-danger
text-red-600  → text-status-danger
text-red-700  → text-status-danger
text-red-800  → text-status-danger
text-orange-500 → text-status-danger
text-orange-600 → text-status-danger
text-orange-700 → text-status-danger

border-red-200    → border-status-danger-border
border-red-300    → border-status-danger-border
border-orange-200 → border-status-danger-border
```

### ORANGE AS WARNING (context-dependent)
**IMPORTANT:** Orange sometimes means "warning" not "danger." Read context:
- `high` risk (but not `critical`) → often **warning**, not danger  
- "at risk" → **warning**  
- "overdue" → **danger**  
- orange used alongside red (where orange = medium, red = high) → orange is **warning**

### Neutral (gray/slate family → status-neutral)
**Intent:** inactive, draft, paused, unknown, default, N/A  
Colors like `bg-gray-100 text-gray-600` when used as a status badge → `bg-status-neutral-bg text-status-neutral border-status-neutral-border`

**SKIP gray classes that are structural** (card backgrounds, text colors, borders that aren't status indicators). Only migrate grays that are clearly status/state semantics.

---

## DARK MODE

When replacing status classes, also check if the component has `dark:` variants for those colors. If it does, REMOVE the explicit `dark:` variants — the semantic tokens handle dark mode automatically via CSS variables. If it doesn't, no action needed (the tokens will provide dark mode for free).

Example:
```
// BEFORE
bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300

// AFTER (dark: variants removed — tokens handle it)
bg-status-success-bg text-status-success
```

---

## EXCLUDED FILES (DO NOT MODIFY)

1. **PDF pages** — `@react-pdf/renderer` requires inline styles, cannot use Tailwind classes:
   - `src/app/(onboarding)/brochure/page.tsx`
   - `src/app/(onboarding)/comp-sheet/page.tsx`
   - `src/app/(onboarding)/territory-map/page.tsx`
   - `src/lib/pdf/work-order-template.tsx`

2. **status-badge.tsx** — This IS the semantic component. Its dot classes intentionally use raw Tailwind.

3. **health-sparkline.tsx** — Uses green/red for trend direction (up=green, down=red), not status. Needs separate trend-direction tokens.

4. **Chart files already migrated in Sprint 23-D** — `advanced-charts.tsx`, `intelligence-trends.tsx`, `analytics-dashboard.tsx`, `performance-dashboard.tsx`. These use `CHART_FALLBACKS` now. Do not re-migrate.

---

## WORK ITEMS

### ITEM 1: Welcome page (highest density — ~28 status color usages)
**File:** `src/app/(onboarding)/welcome/[token]/page.tsx`  
**Action:** Replace all status-semantic green/red/yellow/orange classes with status tokens. This page is the onboarding wizard — expect health scores, completion states, step indicators.

### ITEM 2: Top 10 component files by usage count
Migrate in order (highest count first):
1. `portfolio.tsx` (~23 usages) — client portfolio view, health scores, risk indicators
2. `ApprovalModal.tsx` (~20) — approval states
3. `task-queue-client.tsx` (~18) — task status indicators
4. `DataImportTab.tsx` (~17) — import status, validation results
5. `FinancialOverviewSection.tsx` (~16) — financial health indicators
6. `ApprovalQueue.tsx` (~14) — approval states
7. `dashboard-widgets.tsx` (~13) — dashboard metric status badges
8. `onboarding-wizard.tsx` (~13) — step completion states
9. `edit-client-dialog.tsx` (~13) — form validation states
10. `CitationsTab.tsx` (~13) — citation health/status

### ITEM 3: Medium-count files (7-12 usages each)
- `SiteHealthTab.tsx` (~12) — site health indicators
- `PageComposer.tsx` (~11)
- `csv-import-dialog.tsx` (~10)
- `audit-logs-viewer.tsx` (~10)
- `TeamFeedSidebar.tsx` (~10)
- `BugReportsTab.tsx` (~9)
- `territory-health-banner.tsx` (~9)
- `LocalPresenceTab.tsx` (~9)
- `PropertyMatrix.tsx` (~9)
- `WaveSettingsTab.tsx` (~8)
- `onboarding-tutorial.tsx` (~8)
- `rep-onboarding-wizard.tsx` (~8)
- `profile.tsx` (~8)
- `BuildQueue.tsx` (~7)
- `UserPermissionCard.tsx` (~7)
- `approvals-tab.tsx` (~7)
- `sales-tools-panel.tsx` (~7)

### ITEM 4: Low-count files (1-6 usages each)
All remaining files with 1-6 status color usages. ~40 files. Same rules apply — read context, determine semantic intent, replace.

### ITEM 5: Verification sweep
After all replacements, run this grep to verify:
```powershell
Get-ChildItem -Path src/components,src/app -Filter *.tsx -Recurse | Select-String -Pattern 'text-green-[0-9]+|bg-green-[0-9]+|border-green-[0-9]+|text-red-[0-9]+|bg-red-[0-9]+|border-red-[0-9]+|text-yellow-[0-9]+|bg-yellow-[0-9]+|border-yellow-[0-9]+|text-orange-[0-9]+|bg-orange-[0-9]+|border-orange-[0-9]+|text-emerald-[0-9]+|bg-emerald-[0-9]+|text-amber-[0-9]+|bg-amber-[0-9]+'
```
**Expected result:** Only hits in excluded files (PDF pages, status-badge.tsx dots, health-sparkline.tsx).

### ITEM 6: TypeScript check
```powershell
cd D:\Work\SEO-Services\ghm-dashboard; npx tsc --noEmit
```
**Expected:** Only pre-existing errors in `scripts/basecamp-crawl.ts`, `scripts/import-wave-history.ts`, `src/lib/basecamp/client.ts`. Zero new errors.

---

## QUALITY GATES

- [ ] All 85+ files migrated (or documented as excluded)
- [ ] Verification grep returns only excluded files
- [ ] TypeScript check passes (no new errors)
- [ ] No logic changes — only class name replacements
- [ ] Dark mode `dark:` variants for status colors removed where tokens replace them
- [ ] Git working tree shows only expected files modified
- [ ] Commit message follows format: `feat: Sprint 23-E Status Color Token Migration — N files, N replacements`

---

## CRITICAL CONSTRAINTS (from project DNA)

- **Gavin (userId=4) SALARY_ONLY** — never receives engine-generated payments
- **David (id=1) legitimately receives $240/mo management fee** as master_fee transactions
- **Test account (userId=6)** never assigned real clients
- **DO NOT** run `prisma migrate dev` — use `prisma db push` only
- **"master" stays as DB enum** — UI shows "Manager" via ROLE_LABELS
- **Admin hierarchy:** admin > master > sales, `isElevated()` = admin|master
- **DO NOT modify any logic, state management, API calls, or component behavior. CLASS NAMES ONLY.**

---

## COMMIT PROTOCOL

When complete:
1. Update `STATUS.md` header: "Sprint 23-E Status Color Token Migration shipped"
2. Update `BACKLOG.md` header  
3. Add `CHANGELOG.md` entry with file count and replacement count
4. `git add -A && git commit -m "feat: Sprint 23-E Status Color Token Migration — N files, N replacements"`
5. `git push`
