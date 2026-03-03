Execute Sprint 37 — Magic Moments + Platform Polish per the blueprint at `D:\Work\SEO-Services\ghm-dashboard\docs\blueprints\SPRINT37_BLUEPRINT.md`. Read it completely before writing any code.

Use Desktop Commander for all file reads, writes, greps, and terminal commands throughout this sprint.

ZERO-DECISION SPRINT: Every implementation decision is pre-made in the blueprint. If anything is genuinely ambiguous, skip that item and move to the next one. Do not stop. Do not ask. Execute the spec.

MANDATORY READS BEFORE ANY WORK:
1. `D:\Work\SEO-Services\ghm-dashboard\docs\blueprints\SPRINT37_BLUEPRINT.md` — full spec
2. `D:\Work\SEO-Services\ghm-dashboard\docs\PSYCH_UX_AUDIT.md` — source of all recommendations
3. `D:\Work\SEO-Services\ghm-dashboard\docs\ROUTE_AUDIT.md` — dead routes and missing confirms
4. `D:\Work\SEO-Services\ghm-dashboard\STATUS.md` — current platform state

PHASE 1 — run all four tracks in parallel:

Track A — confirm() → AlertDialog migration: Grep `grep -r "confirm(" D:\Work\SEO-Services\ghm-dashboard\src --include="*.tsx" --include="*.ts"`. Replace all 4 instances with AlertDialog using exact copy from the blueprint. Files: vault-file-tile, TeamFeed, TeamFeedSidebar, recurring-tasks-client. Use existing shadcn/ui AlertDialog — no new dependencies.

Track B — Generic error toast cleanup: Grep `grep -rn "Something went wrong\|An error occurred\|toast.error(\"Error\"\|toast.error('Error'" D:\Work\SEO-Services\ghm-dashboard\src --include="*.tsx" --include="*.ts"`. Replace each generic message with action-specific copy per the blueprint pattern. Touch only generic messages — leave specific ones alone.

Track C — Dead route deletion + missing confirms: Delete `D:\Work\SEO-Services\ghm-dashboard\src\app\api\clients\[id]\gbp\reviews\route.ts` and `D:\Work\SEO-Services\ghm-dashboard\src\app\api\leads\[id]\audit\route.ts` — verify each contains only `export {}` or no handlers before deleting. Add AlertDialog confirms to TeamManagementTab (deactivate user) and territories-client (deactivate territory) using exact copy from blueprint.

Track D — Breadcrumb component + wiring: Create `D:\Work\SEO-Services\ghm-dashboard\src\components\ui\breadcrumb.tsx` using exact implementation from blueprint. Grep `grep -r "clientId\|client" D:\Work\SEO-Services\ghm-dashboard\src\app\(dashboard) --include="page.tsx" -l` to find nested client pages. Wire breadcrumb into: client detail, keywords, scans, tasks, content, vault pages. Use `businessName` from existing page data — no new fetches.

PHASE 2 — after Phase 1 complete, run all three tracks in parallel:

Track E — Onboarding completion celebration: Find both onboarding wizard final step components via `grep -r "onboarding\|AdminSetupWizard" D:\Work\SEO-Services\ghm-dashboard\src --include="*.tsx" -l`. Add success card with CSS-only animation on completion (no confetti library). Exact implementation in blueprint. Use `useEffect` with 2500ms timeout → `router.push('/dashboard')`. Add `@keyframes progress` to `D:\Work\SEO-Services\ghm-dashboard\src\app\globals.css`.

Track F — Settings tab grouping: Find Settings page via `grep -r "Settings" D:\Work\SEO-Services\ghm-dashboard\src\app\(dashboard)\settings --include="*.tsx" -l`. Read the current tab list. Group into 4 sections per blueprint (Team & Access / Platform Config / Integrations / Data & Ops). Add section label spans between tab groups — no URL changes, no routing restructure, labels only.

Track G — AI progress indicators: Grep `grep -r "generate\|voice\|audit" D:\Work\SEO-Services\ghm-dashboard\src\app\(dashboard) --include="*.tsx" -l`. Replace static spinners on content generation, voice capture, and website audit with the AIProgressIndicator component from the blueprint. Step labels per operation type are in the blueprint — use them exactly.

PHASE 3 — after all prior tracks complete:

Track H — TypeScript gate + regression + sprint close:

Run: `cd D:\Work\SEO-Services\ghm-dashboard && npx tsc --noEmit` — zero new errors. Fix any introduced before closing.

Regression checks:
- vault-file-tile delete → AlertDialog (not browser confirm)
- TeamFeed delete → AlertDialog
- TeamManagementTab deactivate → AlertDialog
- Client detail page → breadcrumb visible "Clients / [Name]"
- Client nested page → breadcrumb shows full trail
- Settings page → 4 section labels visible
- Content generation loading → stepped progress text visible
- Onboarding final step → success card shows, auto-redirects after 2.5s
- Dead routes → confirmed 404 on gbp/reviews and leads/audit

Sprint close using Desktop Commander:
1. Write updated `D:\Work\SEO-Services\ghm-dashboard\STATUS.md`
2. Prepend Sprint 37 entry to `D:\Work\SEO-Services\ghm-dashboard\CHANGELOG.md`
3. Update `D:\Work\SEO-Services\ghm-dashboard\BACKLOG.md` — close addressed PSYCH_UX_AUDIT items
4. Run: `cd D:\Work\SEO-Services\ghm-dashboard && git add -A && git commit -m "feat(ux): Sprint 37 — Magic moments + platform polish"` then `git push origin main`
