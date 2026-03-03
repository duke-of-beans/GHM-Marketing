# Toast + Alert Audit — Sprint 36

**Audit date:** 2026-03-03
**Scope:** All `toast.*` calls in `src/`, all `alert()` / `window.alert()` calls, all `console.error` in `.tsx` files.

## Executive Summary

380 toast call sites across ~50 components. The codebase uses **sonner** (`import { toast } from "sonner"`) as the primary toast library. A legacy shadcn/ui `useToast` hook exists in `src/hooks/use-toast.ts` but is **not used by any component** — all components import directly from sonner. Zero raw `window.alert()` calls found. ~50 `console.error` calls in `.tsx` components, most of which are paired with a `toast.error()` call (correct pattern).

## Library Status

| Library | Import | Status |
|---------|--------|--------|
| sonner | `import { toast } from "sonner"` | **ACTIVE** — used by all ~50 components |
| shadcn/ui useToast | `import { useToast } from "@/hooks/use-toast"` | **DEAD CODE** — hook exists but no component imports it |
| window.alert() | N/A | **NOT FOUND** — zero instances |

### Finding: Dead Code — `use-toast.ts`

`src/hooks/use-toast.ts` (195 lines) and `src/components/ui/toaster.tsx` are remnants of the original shadcn/ui toast system. Every component has migrated to sonner. These files can be safely removed in a future cleanup sprint. **Not removing in Sprint 36** to avoid breaking any edge case.

## Toast Method Distribution

| Method | Count | Usage |
|--------|-------|-------|
| `toast.error()` | ~220 | Error feedback after failed API calls |
| `toast.success()` | ~120 | Confirmation after successful mutations |
| `toast.warning()` | ~15 | Validation warnings, partial failures |
| `toast.info()` | ~5 | Informational (push permission, strategy tips) |
| `toast.dismiss()` | 0 | Not used |

## Component Coverage

### Heavy Users (10+ toast calls)

| Component | toast calls | Notes |
|-----------|-------------|-------|
| `leads/lead-detail-sheet.tsx` | ~35 | Largest single consumer — covers status changes, emails, WO generation, onboarding |
| `settings/DataImportTab.tsx` | ~22 | CSV/data import with many validation + error paths |
| `settings/TeamManagementTab.tsx` | ~18 | User CRUD, role changes, invite flows |
| `tasks/task-queue-client.tsx` | ~12 | Task status transitions, brief generation |
| `tasks/approvals-tab.tsx` | ~12 | Approve/reject/deploy/rollback flows |
| `clients/website-studio/PageComposer.tsx` | ~11 | Page save, preview, publish |
| `settings/ProfileForm.tsx` | ~10 | Profile + password update flows |
| `settings/BrandingTab.tsx` | ~10 | Logo, color, tagline saves |

### Medium Users (5–9 toast calls)

`territories-client.tsx`, `vault-file-tile.tsx`, `SendForSignatureDialog.tsx`, `compensation-config.tsx`, `discovery-dashboard.tsx`, `edit-client-dialog.tsx`, `CompetitorsTab.tsx`, `DnaLab.tsx`, `ApprovalQueue.tsx`, `add-client-dialog.tsx`, `client-compensation.tsx`, `ContentStrategyPanel.tsx`, `AdminSetupWizard.tsx`, `bulk-action-bar.tsx`, `csv-import-dialog.tsx`

### Light Users (1–4 toast calls)

`LiveSitesPanel.tsx`, `task-checklist.tsx`, `recurring-tasks-client.tsx`, `recurring-task-form.tsx`, `upsell-opportunities.tsx`, `vault-upload-button.tsx`, `ResetToursCard.tsx`, `TeamFeedAttachment.tsx`, `TeamFeedMultimedia.tsx`, `TeamFeedSidebar.tsx`, `TeamFeed.tsx`, `GeneralSettingsTab.tsx`, `IntegrationsTab.tsx`, `CostDashboard.tsx`, `CompensationTab.tsx`, `BugReportsTab.tsx`, `report-builder.tsx`, `onboarding-wizard.tsx`, `PushPermissionPrompt.tsx`, `product-catalog.tsx`, `permission-manager.tsx`, `ContentList.tsx`, `VersionHistoryDialog.tsx`, `ClientIntegrationsTab.tsx`, `WebsiteAuditPanel.tsx`, `VoiceProfileDialog.tsx`, `BuildQueue.tsx`, `ClientTasksTab.tsx`, `ApprovalModal.tsx`, `NewPropertyModal.tsx`, `WebsiteStudioTab.tsx`, `StockPhotoPicker.tsx`, `PPCGenerator.tsx`, `ClientNotesTab.tsx`, `EditContentDialog.tsx`, `blog-generator.tsx`, `content-studio-tab.tsx`, `onboarding-panel.tsx`, `new-lead-dialog.tsx`, `lead-filter-bar-advanced.tsx`, `kanban-board.tsx`, `bugs-page-client.tsx`, `bulk-import-dialog.tsx`, `BugReportDialog.tsx`, `audit-logs-viewer.tsx`, `clients/onboarding/[id]/page.tsx`, `leads/client.tsx`

## Patterns Observed

### Correct Patterns (keep as-is)

1. **Error/success pairs:** Most API mutation handlers follow `try { ... toast.success() } catch { toast.error() }`. This is correct.
2. **Console + toast pairing:** `console.error()` followed by `toast.error()` in catch blocks. Good for debugging + user feedback.
3. **Sonner direct import:** All components use `import { toast } from "sonner"` — consistent, no wrapper indirection.

### Issues Found

#### ISSUE-1: Duplicate error toasts in nested catch blocks (LOW)

Some components show the same error twice when a parent and child function both catch and toast. Example: `DataImportTab.tsx` has inner validation toasts plus outer catch toasts that can fire for the same error.

**Fix:** No inline fix needed — the inner toasts are more specific, the outer is a fallback. Acceptable pattern.

#### ISSUE-2: Dead code — shadcn/ui toast system (LOW)

`src/hooks/use-toast.ts` + `src/components/ui/toaster.tsx` + `src/components/ui/toast.tsx` are unused. All 50+ components import from sonner instead.

**Fix:** Tag for removal in next cleanup sprint. Not blocking.

#### ISSUE-3: No toast for some `console.error` calls (MEDIUM)

~8 component `console.error` calls silently swallow errors without showing a toast to the user:

- `upsell-opportunities.tsx` lines 57, 77, 96 — detection/accept/dismiss failures log but don't toast
- `TeamFeedMultimedia.tsx` line 111 — GIF search failure logs but no user feedback
- `ServiceWorkerRegistration.tsx` line 14 — SW registration failure (acceptable, no user action needed)

**Fix:** Add `toast.error()` calls to the 4 non-SW locations listed above.

#### ISSUE-4: Generic error messages (LOW)

~30% of `toast.error()` calls use generic messages like "Something went wrong", "Failed to save", "An error occurred". These don't help users understand what failed.

**Fix:** Improve incrementally. Not blocking for Sprint 36.

#### ISSUE-5: Missing loading/optimistic feedback (LOW)

Some slow operations (report generation, voice capture, bulk import) don't show a loading toast. Users get no feedback between clicking and the success/error toast appearing.

**Fix:** Consider `toast.loading()` for operations >2s. Backlog item.

## Inline Fixes Applied (Sprint 36)

None required for demo readiness. The toast system is functional and consistent. The issues found are LOW/MEDIUM severity and appropriate for backlog.

## Recommendations for Backlog

1. **Remove dead shadcn/ui toast code** — `use-toast.ts`, `toaster.tsx`, `toast.tsx` (3 files)
2. **Add toast.error() to silent console.error calls** — 4 locations in upsell-opportunities.tsx and TeamFeedMultimedia.tsx
3. **Introduce voice.ts toast messages** — The `src/lib/voice.ts` file defines branded copy for toast messages but adoption is minimal. Consider migrating generic messages to use `voice.errors.*` and `voice.success.*` constants.
4. **Add toast.loading() for slow operations** — Report generation, voice capture, bulk CSV import
5. **Standardize error messages** — Replace generic "Something went wrong" with specific context
