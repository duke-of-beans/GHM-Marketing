# SPRINT 37 BLUEPRINT — Magic Moments + Platform Polish
**Created:** March 3, 2026
**Type:** Overnight / unattended execution
**Estimated:** 1 Cowork session
**Goal:** Implement the PSYCH_UX_AUDIT.md recommendations in priority order. Every decision is pre-made. No forks, no ambiguity, no stops needed.

---

## ZERO-DECISION GUARANTEE

Every item below has exactly one correct implementation path. If anything is genuinely ambiguous, skip it and move to the next item. Do not stop to ask. Do not make architectural decisions. Execute the spec.

---

## DONE CRITERIA

1. All 4 `confirm()` dialogs replaced with AlertDialog
2. All generic "Something went wrong" error toasts include action context
3. Onboarding wizard completion triggers celebration card (no confetti library — CSS only)
4. Breadcrumb component built and wired into all nested client routes
5. Settings tabs grouped into 4 sections
6. AI operation progress indicators on content generation, voice capture, website audit
7. Dead routes deleted: `/api/clients/[id]/gbp/reviews/route.ts`, `/api/leads/[id]/audit/route.ts`
8. Missing confirm dialogs added: TeamManagementTab deactivate user, territories deactivate
9. `npx tsc --noEmit` — zero new errors
10. STATUS.md, CHANGELOG.md, BACKLOG.md updated, committed, pushed

---

## PARALLELIZATION MAP

```
PHASE 1 (parallel — all independent)
├── Track A: confirm() → AlertDialog migration (4 instances)
├── Track B: Generic error toast cleanup (~15% of toast.error() calls)
├── Track C: Dead route deletion + missing confirm additions
└── Track D: Breadcrumb component + nested route wiring

PHASE 2 (parallel — independent of each other, sequential after Phase 1)
├── Track E: Onboarding completion celebration
├── Track F: Settings tab grouping
└── Track G: AI operation progress indicators

PHASE 3 (sequential)
└── Track H: TypeScript gate + regression + sprint close
```

---

## PHASE 1 — PARALLEL

---

### TRACK A — confirm() → AlertDialog Migration

**Source:** PSYCH_UX_AUDIT.md §3, ROUTE_AUDIT.md destructive actions table.

Grep for all `confirm(` calls:
```
grep -r "confirm(" D:\Work\SEO-Services\ghm-dashboard\src --include="*.tsx" --include="*.ts"
```

Expected: 4 instances per the audit. Replace each with an AlertDialog pattern.

**Standard AlertDialog pattern to use — no new component needed, use existing shadcn/ui AlertDialog:**
```tsx
const [showConfirm, setShowConfirm] = useState(false);

// Trigger:
<Button variant="destructive" onClick={() => setShowConfirm(true)}>Delete</Button>

// Dialog:
<AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>[Context-specific title]</AlertDialogTitle>
      <AlertDialogDescription>[Context-specific description]</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
        [Action label]
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**The 4 instances and their context-specific copy:**

1. `vault-file-tile` — Title: "Delete file?" / Description: "This file will be permanently removed from the vault. This cannot be undone." / Action: "Delete file"
2. `TeamFeed` — Title: "Delete message?" / Description: "This message will be removed for everyone in the feed." / Action: "Delete message"
3. `TeamFeedSidebar` — Title: "Delete message?" / Description: "This message will be removed for everyone in the feed." / Action: "Delete message"
4. `recurring-tasks-client` — Title: "Delete recurring rule?" / Description: "This rule will stop generating future tasks. Existing tasks are not affected." / Action: "Delete rule"

---

### TRACK B — Generic Error Toast Cleanup

**Source:** PSYCH_UX_AUDIT.md §3 — "Error toasts show generic messages in ~15% of cases."

Grep for generic error toasts:
```
grep -rn "Something went wrong\|An error occurred\|toast.error(\"Error\"\|toast.error('Error'" D:\Work\SEO-Services\ghm-dashboard\src --include="*.tsx" --include="*.ts"
```

For each instance found, replace the generic message with an action-specific one.

**Replacement pattern:**
- "Something went wrong" in a save handler → "Failed to save [thing] — please try again"
- "Something went wrong" in a delete handler → "Failed to delete [thing] — please try again"
- "Something went wrong" in a fetch handler → "Failed to load [thing] — refresh to try again"
- "An error occurred" → same pattern, use the surrounding function name to determine [thing]
- If context is genuinely unclear from surrounding code → "Action failed — please try again" (still better than generic)

Do not change any toast that already has specific language. Only touch the generic ones.

---

### TRACK C — Dead Route Deletion + Missing Confirms

**Dead routes to delete (per ROUTE_AUDIT.md):**

Delete these two files — they are tombstones with no HTTP methods:
- `D:\Work\SEO-Services\ghm-dashboard\src\app\api\clients\[id]\gbp\reviews\route.ts`
- `D:\Work\SEO-Services\ghm-dashboard\src\app\api\leads\[id]\audit\route.ts`

Verify each file contains only `export {}` or no exported handlers before deleting. If either file has actual handler code, skip deletion and flag it in ROUTE_AUDIT.md instead.

**Missing confirm dialogs to add (per ROUTE_AUDIT.md):**

1. `TeamManagementTab` — deactivate user action currently has no confirmation. Add AlertDialog:
   - Title: "Deactivate user?"
   - Description: "This user will lose access immediately. You can reactivate them from this panel."
   - Action: "Deactivate"

2. `territories-client` — deactivate territory has no confirmation. Add AlertDialog:
   - Title: "Deactivate territory?"
   - Description: "Leads in this territory will be unassigned. This can be reversed."
   - Action: "Deactivate"

Use the same AlertDialog pattern from Track A.

---

### TRACK D — Breadcrumb Component + Nested Route Wiring

**Source:** PSYCH_UX_AUDIT.md §4 — "No breadcrumbs on client detail pages."

**Create `D:\Work\SEO-Services\ghm-dashboard\src\components\ui\breadcrumb.tsx`:**

```tsx
// Simple breadcrumb — no library needed
interface BreadcrumbItem {
  label: string;
  href?: string; // omit for current page (last item)
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-muted-foreground/50">/</span>}
          {item.href ? (
            <a href={item.href} className="hover:text-foreground transition-colors">{item.label}</a>
          ) : (
            <span className="text-foreground font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
```

**Wire breadcrumbs into these nested routes (grep to find the exact page.tsx files):**

```
grep -r "client\|clientId" D:\Work\SEO-Services\ghm-dashboard\src\app\(dashboard) --include="page.tsx" -l
```

Target pages:
- Client detail page → `[Clients] / [Client Name]`
- Client keywords/rank tracking → `[Clients] / [Client Name] / Keywords`
- Client scan detail → `[Clients] / [Client Name] / Scans`
- Client tasks → `[Clients] / [Client Name] / Tasks`
- Client content → `[Clients] / [Client Name] / Content`
- Client vault → `[Clients] / [Client Name] / Vault`

Place the `<Breadcrumb />` component at the top of each page, above the page title. Use the client's `businessName` as the client label, fetched from the same data load already on the page — no new fetch needed.

For the top-level "Clients" link: `href="/clients"`. Current page: no href.

---

## PHASE 2 — PARALLEL (AFTER PHASE 1)

---

### TRACK E — Onboarding Completion Celebration

**Source:** PSYCH_UX_AUDIT.md §1 — "After finishing setup, the user is dumped to the dashboard with no acknowledgment."

**No confetti library.** CSS animation only — keep bundle size zero.

Find the final step of both onboarding flows:
```
grep -r "onboarding\|setup-wizard\|AdminSetupWizard" D:\Work\SEO-Services\ghm-dashboard\src --include="*.tsx" -l
```

On the completion screen (last step, after user clicks the final CTA), render a success card before redirecting to dashboard:

```tsx
// Show this for 2.5s then redirect via router.push('/dashboard')
<div className="flex flex-col items-center justify-center gap-4 py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
    <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
  </div>
  <h2 className="text-2xl font-semibold">You're all set</h2>
  <p className="text-muted-foreground text-center max-w-sm">
    Your platform is ready. Taking you to your dashboard now.
  </p>
  <div className="w-32 h-1 bg-muted rounded-full overflow-hidden">
    <div className="h-full bg-green-500 animate-[progress_2.5s_linear_forwards]" />
  </div>
</div>
```

Add the progress bar keyframe to `globals.css`:
```css
@keyframes progress {
  from { width: 0%; }
  to { width: 100%; }
}
```

Use `useEffect` with a 2500ms timeout → `router.push('/dashboard')`.

---

### TRACK F — Settings Tab Grouping

**Source:** PSYCH_UX_AUDIT.md §4 — "Settings page has 10+ tabs but no visual grouping."

Find the Settings page tab configuration:
```
grep -r "Settings\|settings" D:\Work\SEO-Services\ghm-dashboard\src\app\(dashboard)\settings --include="*.tsx" -l
```

Read the current tab list and group into 4 logical sections. Apply grouping visually using a section label above each group — not a new navigation paradigm, just labels between tabs:

**Group 1 — Team & Access:** Users/Team, Roles/Permissions, Positions, Territories
**Group 2 — Platform Config:** General/Branding, Goals, Products/Services, Notifications
**Group 3 — Integrations:** Wave, Google Business Profile, Google Ads, DataForSEO
**Group 4 — Data & Ops:** Cost Dashboard, Audit Logs, Compensation Config, Import

Implementation: if tabs are rendered in a flat list, wrap groups in a `<div>` with a small section label (`<span className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-1">Team & Access</span>`) above each group's tabs. Match the label to the existing tab styling. Do not restructure the Settings routing — labels only, no URL changes.

If the exact tabs don't map cleanly to these groups based on the actual code, use good judgment to group them logically. The principle is: reduce visual search time, don't create new confusion.

---

### TRACK G — AI Operation Progress Indicators

**Source:** PSYCH_UX_AUDIT.md §8 — "No progress indicators for long-running AI operations."

Target operations: content generation (blog, social, PPC, meta, strategy), voice capture, website audit. These can take 10–30 seconds.

Find the AI operation trigger points:
```
grep -r "generate\|voice\|audit" D:\Work\SEO-Services\ghm-dashboard\src\app\(dashboard) --include="*.tsx" -l
```

**Pattern to apply at each AI operation:**

Replace a static spinner with a stepped progress indicator that gives the user a sense of forward motion:

```tsx
const AI_STEPS = [
  "Analyzing your request...",
  "Applying brand voice...",
  "Generating content...",
  "Reviewing quality...",
  "Almost done...",
];

// In the loading state during AI call:
function AIProgressIndicator() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const intervals = [1500, 3000, 5000, 8000]; // advance steps at these ms marks
    const timers = intervals.map((delay, i) =>
      setTimeout(() => setStep(i + 1), delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex flex-col items-center gap-3 py-8">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground animate-in fade-in duration-300 key={step}">
        {AI_STEPS[Math.min(step, AI_STEPS.length - 1)]}
      </p>
    </div>
  );
}
```

The step labels should be adjusted per operation type:
- Content generation: "Analyzing brief...", "Applying brand voice...", "Drafting content...", "Reviewing quality...", "Finalizing..."
- Voice capture: "Analyzing writing sample...", "Identifying tone patterns...", "Building voice profile...", "Calibrating...", "Almost done..."
- Website audit: "Fetching page data...", "Running performance checks...", "Analyzing SEO signals...", "Scoring results...", "Almost done..."

Apply to each trigger point found. The component is stateless and reusable — just pass a `steps` prop array if variants are needed.

---

## PHASE 3 — SEQUENTIAL

### TRACK H — TypeScript Gate + Regression + Sprint Close

**TypeScript:**
```
cd D:\Work\SEO-Services\ghm-dashboard && npx tsc --noEmit
```
Zero new errors. Fix any introduced — do not leave them. Pre-existing 12 errors are acceptable if untouched.

**Regression spot checks:**
- Vault file tile: delete button opens AlertDialog (not browser confirm())
- TeamFeed: delete message opens AlertDialog
- Deactivate user in TeamManagementTab: AlertDialog appears
- Client detail page: breadcrumb shows "Clients / [Business Name]"
- Client nested page (keywords or tasks): breadcrumb shows "Clients / [Business Name] / Keywords"
- Settings page: section labels visible between tab groups
- Content generation: stepped progress text visible during generation
- Onboarding final step: success card shows before redirect (test on covosdemo)
- Generic error toasts: trigger a failing API call and verify specific message appears
- Dead routes confirmed deleted: 404 on `/api/clients/[id]/gbp/reviews` and `/api/leads/[id]/audit`

**Sprint close — use Desktop Commander write_file for docs, terminal for git:**

1. Update `D:\Work\SEO-Services\ghm-dashboard\STATUS.md`
2. Add Sprint 37 to `D:\Work\SEO-Services\ghm-dashboard\CHANGELOG.md`
3. Update `D:\Work\SEO-Services\ghm-dashboard\BACKLOG.md` — close all items addressed, update PSYCH_UX_AUDIT items 1–10 completion status
4. `cd D:\Work\SEO-Services\ghm-dashboard && git add -A && git commit -m "feat(ux): Sprint 37 — Magic moments + platform polish"` then `git push origin main`

---

## COMMIT MESSAGE

```
feat(ux): Sprint 37 — Magic moments + platform polish

- confirm() → AlertDialog migration (4 instances: vault, TeamFeed x2, recurring tasks)
- Missing confirm dialogs added: deactivate user, deactivate territory
- Generic error toast cleanup — action-specific messages across ~15% of toast.error() calls
- Dead route cleanup: gbp/reviews and leads/audit tombstones deleted
- Breadcrumb component built, wired into 6 nested client routes
- Onboarding completion celebration (CSS animation, 2.5s, auto-redirect)
- Settings tab grouping — 4 labelled sections
- AI progress indicators (stepped text) on content gen, voice capture, website audit
- TypeScript: zero new errors
```
