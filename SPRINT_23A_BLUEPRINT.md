# SPRINT 23-A — UI CONSTITUTION PHASE 1: COLOR TOKEN AUDIT
**Environment:** DEV (GHM Dashboard)
**Project path:** D:\Work\SEO-Services\ghm-dashboard
**Created:** February 24, 2026
**Status:** READY FOR AGENT EXECUTION
**Type:** READ-ONLY AUDIT — no code changes in this session

---

## MISSION

Produce `docs/ui-constitution/COLOR_AUDIT.md` — a complete, structured catalog of every color value used in the GHM dashboard codebase, sufficient for David and Claude to design the color token system in the next Chat session without needing to re-examine the codebase.

When this session is done, David should be able to open `COLOR_AUDIT.md`, see the full picture of how color is currently used across the codebase, and make informed decisions about the token architecture.

---

## DECISIONS ALREADY MADE

- **Framework:** The platform runs Tailwind CSS with shadcn/ui base components. Color tokens will be implemented as CSS custom properties on `:root`, already partially established in `BrandThemeInjector.tsx` (`--brand-primary`, `--brand-secondary`, `--brand-accent`). The audit informs what additional tokens are needed.
- **Token strategy:** Semantic token layer over raw values (e.g., `color.surface.primary` not raw hex). Audit findings will drive the exact token names — those decisions happen in Chat, not in this session.
- **Scope is audit only:** No code changes in this session. Agent reads and catalogs. Nothing is modified, refactored, or "improved."
- **tailwind.config.ts is the canonical Tailwind config file** for this project.
- **CSS custom properties** for brand colors already live in `src/components/branding/BrandThemeInjector.tsx`.
- **shadcn/ui base tokens** live in `src/app/globals.css` — these are the HSL variable definitions (`--background`, `--foreground`, `--primary`, etc.).

---

## SCOPE BOUNDARY

This session does NOT touch:
- Any `.ts` or `.tsx` source files (read-only)
- Typography, spacing, shadow, border-radius, animation — those are separate audit sessions
- `prisma/schema.prisma` — not relevant to this audit
- API routes — not relevant to this audit
- Test files — not relevant to this audit
- `docs/archive/` — skip archived files entirely
- Any file outside `D:\Work\SEO-Services\ghm-dashboard\`

The agent does NOT make any recommendations in the audit output. It catalogs what exists. Recommendations are made in the subsequent Chat session.

---

## STOPPING CONDITIONS

Beyond standard GHM AGENT_PROTOCOL stops:
- If `src/app/globals.css` does not exist: write BLOCKED.md — the shadcn token layer cannot be audited without it
- If `tailwind.config.ts` does not exist: write BLOCKED.md — Tailwind config is required context

---

## AMBIGUITY RESOLUTION

- If a color value appears in both `globals.css` (as a CSS variable) and also as a hardcoded Tailwind class in a component, record it in BOTH sections of the audit
- If a file has more than 50 unique color usages, record the top 20 most common and note "50+ usages total — truncated to top 20 by frequency"
- Dynamic color classes (e.g., `text-${color}-400` in template literals) — record the pattern and the file, note as DYNAMIC (cannot be statically audited)
- Dark mode variants (`dark:text-blue-400`) — record both light and dark variants as separate entries
- `className` values inside `cn()` calls — treat identically to standard `className`

---

## BOOTSTRAP FILES

```
1. D:\Work\SEO-Services\ghm-dashboard\AGENT_PROTOCOL.md  (GHM override)
2. D:\Work\SEO-Services\ghm-dashboard\CLAUDE_INSTRUCTIONS.md
3. D:\Work\SEO-Services\ghm-dashboard\STATUS.md
4. First 60 lines of CHANGELOG.md
```

No git verification needed — this is read-only, no commits in this session.

---

## WORK ITEMS

Execute in order. All items are independent reads — no item depends on output from another.

---

### Item 1: Tailwind Config — Color Definitions

**Files:** `tailwind.config.ts`

**What to do:**
Extract and record:
- All custom color definitions in `theme.extend.colors` (names, values, HSL/hex/variable reference)
- Any color aliases or CSS variable references (`hsl(var(--primary))` etc.)
- The Tailwind content glob patterns (so we know which files Tailwind scans)
- Any `darkMode` configuration

**Expected result in audit:** Section `## 1. Tailwind Config — Custom Color Definitions` with a table of all custom colors and their values.

**Done when:** Every key in `theme.extend.colors` (if present) is recorded with its value or variable reference.

---

### Item 2: CSS Custom Properties — shadcn Base Tokens

**Files:** `src/app/globals.css`

**What to do:**
Extract and record:
- Every CSS custom property defined in `:root` (light mode)
- Every CSS custom property defined in `.dark` (dark mode override)
- The HSL values for each
- Any non-color custom properties (note them but do not catalog in depth)

**Expected result in audit:** Section `## 2. CSS Custom Properties (globals.css)` with two subsections: `:root (light)` and `.dark`. Format: `--variable-name: [value]`.

**Done when:** Every CSS custom property in globals.css is recorded.

---

### Item 3: BrandThemeInjector — Runtime Color Injection

**Files:** `src/components/branding/BrandThemeInjector.tsx`

**What to do:**
Extract and record:
- Which CSS custom properties it injects (`--brand-primary`, etc.)
- Where it reads the values from (props, DB, context?)
- What fallback values it uses if brand values aren't set

**Expected result in audit:** Section `## 3. Runtime Brand Color Injection (BrandThemeInjector.tsx)` with the injected property names, their sources, and fallback values.

**Done when:** All injected properties and their data sources are documented.

---

### Item 4: Hardcoded Color Classes — Component Scan

**Files:** All `*.tsx` files under `src/components/` (recursive)

**What to do:**
Scan every `.tsx` file for hardcoded Tailwind color utility classes. Catalog:

**Category A — Background colors:**
`bg-{color}-{shade}`, `bg-white`, `bg-black`, `bg-transparent`

**Category B — Text colors:**
`text-{color}-{shade}`, `text-white`, `text-black`, `text-foreground`, `text-muted-foreground`, `text-primary`, `text-destructive`

**Category C — Border colors:**
`border-{color}-{shade}`, `border-primary`, `border-destructive`, `border-muted`

**Category D — Ring/outline colors:**
`ring-{color}-{shade}`, `focus:ring-{color}-{shade}`

**Category E — shadcn semantic colors (already tokenized):**
`text-foreground`, `text-muted-foreground`, `text-primary`, `text-secondary`, `text-destructive`, `bg-background`, `bg-muted`, `bg-primary`, `bg-secondary`, `bg-destructive`, `bg-card`, `bg-popover`, `border-border`, `border-input`

**For each hardcoded color found (Category A-D only):**
Record: color name + shade + count of usages + which files it appears in (top 3 files by frequency if it appears in many)

**For Category E:** Just confirm "shadcn semantic classes in use" — no need to enumerate every occurrence.

**Expected result in audit:** Section `## 4. Hardcoded Color Classes — Components` with subsections A through E.

**Done when:** All hardcoded color classes in `src/components/` are cataloged by category.

---

### Item 5: Hardcoded Color Classes — Page Scan

**Files:** All `*.tsx` files under `src/app/` (recursive)

**What to do:** Same as Item 4 but for page files and API route files. API route files rarely have color classes — note if any are found, otherwise just record "No color classes found in API routes."

**Expected result in audit:** Section `## 5. Hardcoded Color Classes — Pages & App Router` in same format as Item 4.

**Done when:** All hardcoded color classes in `src/app/` are cataloged.

---

### Item 6: Inline Styles — Color Values

**Files:** All `*.tsx` files under `src/` (recursive)

**What to do:**
Search for inline `style={{ }}` attributes that contain color values:
- `color: "#..."` or `color: "rgb..."` or `color: "hsl..."`
- `backgroundColor: "#..."` etc.
- `stroke: "#..."`, `fill: "#..."` (SVG inline styles)

Record: file, component name, the specific inline color value.

**Expected result in audit:** Section `## 6. Inline Style Color Values` — table of file + component + value. If none found, write "No inline color values found."

**Done when:** All inline color styles across `src/` are recorded.

---

### Item 7: SVG Color Values

**Files:** Any `.svg` files under `public/` or `src/`, plus inline SVG in `.tsx` files

**What to do:**
- For `.svg` files: record any hardcoded `fill`, `stroke`, `stop-color` values
- For inline SVG in `.tsx`: record file + color attribute + value

**Expected result in audit:** Section `## 7. SVG Color Values` — table of source + attribute + value. If none found, write "No hardcoded SVG colors found."

**Done when:** All SVG color values are recorded.

---

### Item 8: Status/State Color Patterns

**Files:** `src/types/index.ts`, `src/lib/` (recursive), `src/components/` (recursive)

**What to do:**
Identify repeating color patterns used for status/state — the kind that need their own semantic tokens. Look for:
- Health score colors (green/amber/red for scores)
- Churn risk colors (color per risk level)
- Lead status colors (per pipeline stage)
- Task status colors
- Role/permission colors (admin/manager/sales badge colors)
- Alert/notification severity colors (critical/warning/info)
- Any other color-coded status system

For each pattern, record: what it represents, the colors used per state, and which files define the mapping.

**Expected result in audit:** Section `## 8. Status & State Color Patterns` — one subsection per color-coded system, with state → color mapping and file locations.

**Done when:** All repeating status/state color systems in the codebase are documented.

---

### Item 9: Dark Mode Coverage Assessment

**Files:** All `*.tsx` files under `src/` (recursive), `src/app/globals.css`

**What to do:**
Identify the current dark mode approach:
- What percentage of hardcoded color classes have `dark:` variants? (rough estimate — "most", "some", "few")
- Which major component groups appear to lack `dark:` variants on color classes? List the top 5 areas of concern.
- Does the codebase use `dark:` class variants, CSS variables in `.dark {}`, or both?

This is an assessment, not a full enumeration.

**Expected result in audit:** Section `## 9. Dark Mode Coverage Assessment` — qualitative summary (3-5 paragraphs), list of top 5 coverage gaps, approach used (class vs variable vs hybrid).

**Done when:** The dark mode coverage summary is written.

---

### Item 10: External Library Color Dependencies

**Files:** `package.json`, any theme configuration files for recharts, shadcn

**What to do:**
Identify any library-specific color configurations:
- recharts — does the codebase configure default chart colors?
- shadcn/ui — does it extend or override the default theme beyond globals.css?
- Any other library that requires color configuration (date pickers, emoji mart, etc.)

**Expected result in audit:** Section `## 10. External Library Color Dependencies` — library name + where/how its colors are configured.

**Done when:** All external library color dependencies are identified.

---

## AUDIT OUTPUT FORMAT

Write all findings to: `docs/ui-constitution/COLOR_AUDIT.md`

Create the directory `docs/ui-constitution/` if it doesn't exist.

The file must open with:
```markdown
# GHM DASHBOARD — COLOR AUDIT
**Generated:** [ISO date]
**Audited by:** Cowork agent (read-only session)
**Purpose:** Foundation for UI Constitution Phase 1 — Color Token System
**Status:** COMPLETE — ready for token design session
```

Then one section per work item (Items 1-10) in order.

Close the file with:
```markdown
---
## AUDIT SUMMARY

**Total hardcoded color classes found:** [count across Items 4+5]
**Total inline color values found:** [count from Item 6]
**shadcn semantic tokens in use:** [yes/no, and list them]
**Runtime brand injection:** [yes — N properties]
**Dark mode approach:** [class variants / CSS variables / hybrid]
**Estimated dark mode coverage:** [most / some / few]

**Top 5 areas of concern for token migration:**
1. [area]
2. [area]
3. [area]
4. [area]
5. [area]
```

---

## QUALITY GATES

This session has no TypeScript gate (read-only — no code changes).

### Gate 1: Output File Exists
`docs/ui-constitution/COLOR_AUDIT.md` must exist at session end.

### Gate 2: All 10 Sections Present
Audit must contain all 10 sections. Missing section = BLOCKED state, not a complete session.

### Gate 3: No Code Modified
Run `git status --short` at session end. Expected: working tree clean (no changes). If any `.ts` or `.tsx` or `.css` files appear modified, that is a CRITICAL ERROR — write BLOCKED.md immediately.

---

## REPORT INSTRUCTIONS

MORNING_BRIEFING for this sprint should note:

- Whether `docs/ui-constitution/COLOR_AUDIT.md` was successfully created
- The AUDIT SUMMARY section contents (copy verbatim into briefing)
- Any files that couldn't be read or were unexpectedly structured
- The "Top 5 areas of concern" from the audit summary
- Git status confirmation (working tree clean)

This briefing is the signal that the audit is done and the next Chat session (token design) can proceed.

---

## NEXT SESSION PREP

**Next session is:** Sprint 23-B — Color Token Design (Chat session, not agent)
**What it needs:** `docs/ui-constitution/COLOR_AUDIT.md` fully populated
**This session should surface:** The audit summary + top 5 concern areas in MORNING_BRIEFING so the Chat session can start designing tokens immediately without re-reading the full audit

---

*Blueprint: SPRINT_23A_BLUEPRINT.md | Format: Agent-Ready v1.0.0*
*See D:\AGENT_ARCHITECTURE.md for full operating model*
