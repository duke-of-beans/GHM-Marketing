Execute Sprint 36 — Communication Layer + Platform Hygiene per the blueprint at docs/blueprints/SPRINT35_36_BLUEPRINT.md. Read the Sprint 36 sections completely before writing any code.

CONTEXT: Sprint 35 made COVOS visually tenant-ready. Sprint 36 makes it communication-ready and functionally airtight. This sprint closes the UI Constitution Group 6 (Communication), audits and fixes every route/button chain in the platform, and produces the psychological UX spec for the next design pass. After this sprint the platform is demo-ready for Vertical 2 prospects and external eyes.

MANDATORY READS BEFORE ANY WORK:
1. docs/blueprints/SPRINT35_36_BLUEPRINT.md — Sprint 36 sections
2. src/lib/email/ — find all email templates and sendEmail() calls
3. Grep for toast() calls: grep -r "toast(" src/ --include="*.tsx" --include="*.ts"
4. src/app/api/ — full directory listing to understand handler inventory
5. Any existing ROUTE_AUDIT.md or docs/audits/ — check what's already documented

PHASE 1 — run all three tracks in parallel:

Track A — UI-CONST-001 Group 6 (Communication Layer):

A1 Email Templates: Create src/lib/email/templates/base.tsx — base layout component for all outbound emails. Layout: tenant logo header on brand color bar, clean white card body (600px max-width), Inter/system font, CTA button in brandColor, footer with tenant supportEmail + "Powered by COVOS." All values read from TenantConfig/GlobalSettings with safe fallbacks. Rebuild these templates extending the base: reset-password, work-order, report-delivery, onboarding-invite, notification (generic). No more scattered inline styles — all through the base component.

A2 Toast + Alert Audit: Audit every toast() call. Check: consistent success/error/warning/info variants used correctly, no raw alert() calls anywhere, loading states have toast feedback, destructive actions (delete, archive) show confirmation, error toasts have actionable language. Produce docs/TOAST_AUDIT.md with findings. Fix all critical issues inline during this track.

A3 Empty States Pass: Audit every page and panel for generic "no data" / "nothing here" empty states. Replace with context-aware EmptyState component: icon + heading + subtext + CTA action. Context-aware means: new tenant (prompt to set up) vs. data exists but filtered to zero (prompt to clear filter). Pages to cover: Tasks, Content Studio, Reports, Pipeline (filtered-to-zero state), Team Feed, Vault, Onboarding (no tokens), any other blank panels found. Build a shared EmptyState component if one doesn't exist.

Track B — FEAT-011 Route + Button + Logic Audit: Enumerate every button, Link, router.push(), and form onSubmit in the codebase. Map each to its handler and API route. Run the grep commands from the blueprint. Produce docs/ROUTE_AUDIT.md as a table: Button/Link | Handler | Route exists? | Permission guard? | Status (OK/DEAD/BROKEN/UNGUARDED/DUPLICATE/ORPHAN). Flag all DEAD, BROKEN, UNGUARDED, DUPLICATE, ORPHAN entries. Do not fix yet — that's Phase 2.

Track C — UX-AUDIT-009 Psychological UX Audit (spec only, no build): Walk each user archetype flow and document the 3 most emotionally resonant moments: Admin ("platform came alive" — first live data, health scores moving, tasks auto-generated), Sales Rep ("automation did my job" — AI brief saves time, scan alert auto-creates task, assist is visible), Manager ("I can see everything" — full team pipeline, client health across book, earnings by rep). For each moment: what currently happens, what should happen (micro-interaction, copy, animation, state transition), estimated implementation size. Output: docs/PSYCH_UX_AUDIT.md. This is a documentation sprint, not a build sprint.

PHASE 2 — after Track B complete:

Track D — Fix Pass: Work through docs/ROUTE_AUDIT.md in priority order. UNGUARDED first (add withPermission or role gate — follow the Sprint SEC pattern), BROKEN second (fix handler, verify response shape matches UI expectation), DEAD third (remove the dead UI element, or build the handler if the feature is intentional — no dead buttons in a demo-ready platform). Log each fix in ROUTE_AUDIT.md as FIXED with commit reference.

PHASE 3 — after all prior tracks complete:

Track E — TypeScript Gate + Full Regression + Sprint Close:
npx tsc --noEmit — zero new errors across all Sprint 35 and 36 changed files.

Full regression spot check:
- GHM tenant: login → dashboard → brochure generate → audit PDF → work order → email preview (full happy path, all GHM branding correct)
- covosdemo tenant: same path, all COVOS Demo branding, zero GHM text
- Sales rep first login: widget layout matches role default
- Unknown subdomain: redirects to not-a-tenant page
- All toast variants render (success, error, warning, info) — trigger one of each manually
- Empty states render on all audited pages (verify with empty filter or new tenant state)
- Route audit: spot check 5 previously-DEAD or UNGUARDED routes — all fixed

CONSTRAINTS:
- No Prisma migrations in this sprint
- Zero new TypeScript errors
- No behavior changes for any existing working feature — audit and fix only
- docs/ outputs (ROUTE_AUDIT.md, TOAST_AUDIT.md, PSYCH_UX_AUDIT.md) are real deliverables — complete them properly

CLOSE THE SPRINT:
1. Update STATUS.md — note UI-CONST-001 Group 6 complete, platform demo-ready
2. Add Sprint 36 to CHANGELOG.md
3. Update BACKLOG.md — close Sprint 36 items (FEAT-016, FEAT-018, FEAT-017, FEAT-021, UX-FEAT-003, LEGAL-001, UI-CONST-001 Group 6, FEAT-011, UX-AUDIT-009), confirm Sprint 34-OPS (manual) and Sprint 37+ (Vertical 2 scoping) are next
4. Update docs/ARCH.md — UI-CONST-001 Group 6 (Communication) complete
5. git sync/commit/push with the commit message from the blueprint
