# COWORK HANDOFF PROMPTS — Sprint 30 Wave + Sprint 33
## Copy each block into a separate Cowork instance
## March 1, 2026

---

## INSTANCE 30-A — TeamFeed Two-Pane Layout

```
BUSINESS SESSION — COWORK AGENT — SPRINT 30-A

You are an autonomous Cowork agent executing Sprint 30-A for the GHM Dashboard project.

BOOTSTRAP (execute before any code):
1. Filesystem:read_file D:\Work\SEO-Services\ghm-dashboard\AGENT_PROTOCOL.md
2. Filesystem:read_file D:\Work\SEO-Services\ghm-dashboard\CLAUDE_INSTRUCTIONS.md
3. Filesystem:read_file D:\Work\SEO-Services\ghm-dashboard\STATUS.md
4. Filesystem:read_file D:\Work\SEO-Services\ghm-dashboard\CHANGELOG.md (first 60 lines)
5. Run: git -C D:\Work\SEO-Services\ghm-dashboard log --oneline -10

Read the full blueprint at: D:\Work\SEO-Services\ghm-dashboard\docs\blueprints\SPRINT_30_WAVE_BLUEPRINTS.md

SPRINT BRIEF:
Upgrade the TeamFeed from a single-column sidebar into a Slack-grade two-pane communication hub with a resizable panel and presence indicators.

BUILD ORDER:
1. A3 FIRST — GET /api/team/presence route. Reads DashboardEvent recency per user. Returns { id, name, role, isActive, lastSeen }. isActive = last event < 5 min ago. New file: src/app/api/team/presence/route.ts. Auth-gated.

2. A1 — Resizable panel. Drag handle on left edge of TeamFeed panel. Width in localStorage "ghm:teamfeed-width". Default 320px, min 240px, max 520px. CSS custom property --teamfeed-width on container. Mouse events, clean up on unmount.

3. A2 — Two-pane layout. Left rail (80px collapsed / 180px expanded). Presence API populates user list with dots. Clicking user sets DM audience. Right pane = existing message thread. Rail state in localStorage "ghm:teamfeed-rail".

4. A4 — Typing indicators (attempt; abort cleanly if too complex — no tech debt).

FILES TO CREATE: src/app/api/team/presence/route.ts
FILES TO MODIFY: src/components/team-feed/TeamFeedSidebar.tsx, src/components/team-feed/TeamFeed.tsx
globals.css: ONLY add --teamfeed-width in @layer utilities at BOTTOM. DO NOT touch :root HSL blocks — another instance owns those.

IMMUTABLE CONSTRAINTS:
- SALARY_ONLY_USER_IDS = [4]
- prisma db push only
- isElevated() for role checks
- No raw anthropic.messages.create() outside src/lib/ai/
- npx tsc --noEmit must show zero NEW errors before commit

QUALITY GATES:
□ npx tsc --noEmit — zero new errors (5 pre-existing scripts/basecamp OK)
□ Panel resizes 240–520px
□ Presence route returns 200 with correct shape
□ Existing SSE/send/receive unaffected
□ No layout breakage at 1280px or 1440px

STOPPING CONDITIONS → write BLOCKED.md:
- TypeScript fails after 2 fix attempts
- Requires touching commission/salary/tenant files
- Presence needs schema changes

COMMIT: feat(team-feed): two-pane layout with resizable panel, presence indicators, rail nav
DO NOT run docs sync. Just commit and push.
KERNL checkpoint every 5-8 tool calls.
```

---

## INSTANCE 30-B — WCAG Contrast Audit + Fix

```
BUSINESS SESSION — COWORK AGENT — SPRINT 30-B

You are an autonomous Cowork agent executing Sprint 30-B for the GHM Dashboard project.

BOOTSTRAP (execute before any code):
1. Filesystem:read_file D:\Work\SEO-Services\ghm-dashboard\AGENT_PROTOCOL.md
2. Filesystem:read_file D:\Work\SEO-Services\ghm-dashboard\CLAUDE_INSTRUCTIONS.md
3. Filesystem:read_file D:\Work\SEO-Services\ghm-dashboard\STATUS.md
4. Filesystem:read_file D:\Work\SEO-Services\ghm-dashboard\CHANGELOG.md (first 60 lines)
5. Run: git -C D:\Work\SEO-Services\ghm-dashboard log --oneline -10

Read the full blueprint at: D:\Work\SEO-Services\ghm-dashboard\docs\blueprints\SPRINT_30_WAVE_BLUEPRINTS.md

SPRINT BRIEF:
Audit all foreground/background token pairs in globals.css against WCAG AA (4.5:1 normal, 3:1 large text). Fix failing pairs by adjusting HSL lightness only. Never change hue or saturation.

BUILD ORDER:
1. Read src/app/globals.css — extract all :root and .dark HSL values
2. Audit all pairs listed in blueprint section B1 in both light and dark mode
3. Fix failing pairs: adjust L only. Light mode → push darker. Dark mode → push lighter. Cap: never below 15% light, never above 92% dark.
4. Special checks: sidebar foreground against hsl(220 38% 9%) navy, accent-foreground on amber.
5. Document everything in MORNING_BRIEFING contrast table.

FILES TO MODIFY: src/app/globals.css — :root and .dark blocks ONLY (top of file)
DO NOT touch: @layer utilities (bottom of file — 30-A owns it), any .tsx files, chart-tokens.ts

GLOBALS.CSS COORDINATION: 30-A writes to @layer utilities (bottom). You write to :root/.dark (top). Different sections — clean merge. Pull before pushing if 30-A commits first.

IMMUTABLE CONSTRAINTS:
- Lightness adjustments only — never change H or S
- If a fix needs a hue change → document, skip, note in MORNING_BRIEFING
- npx tsc --noEmit zero NEW errors
- No component changes

QUALITY GATES:
□ All audited pairs pass 4.5:1 (or documented large-text 3:1 exceptions)
□ Signal palette preserved — sidebar navy, accent amber, status colors recognizable
□ MORNING_BRIEFING has full contrast table: | Token Pair | Light Ratio | Dark Ratio | Pass/Fail | Action Taken |

STOPPING CONDITIONS → write BLOCKED.md:
- Fix requires hue change (document and skip the pair, don't block)
- TypeScript gate fails unexpectedly

COMMIT: fix(tokens): WCAG AA contrast pass — foreground lightness adjustments, sidebar + status tokens
DO NOT run docs sync. Just commit and push.
KERNL checkpoint every 5-8 tool calls.
```

---

## INSTANCE 30-C — Vault Preview Modal

```
BUSINESS SESSION — COWORK AGENT — SPRINT 30-C

You are an autonomous Cowork agent executing Sprint 30-C for the GHM Dashboard project.

BOOTSTRAP (execute before any code):
1. Filesystem:read_file D:\Work\SEO-Services\ghm-dashboard\AGENT_PROTOCOL.md
2. Filesystem:read_file D:\Work\SEO-Services\ghm-dashboard\CLAUDE_INSTRUCTIONS.md
3. Filesystem:read_file D:\Work\SEO-Services\ghm-dashboard\STATUS.md
4. Filesystem:read_file D:\Work\SEO-Services\ghm-dashboard\CHANGELOG.md (first 60 lines)
5. Run: git -C D:\Work\SEO-Services\ghm-dashboard log --oneline -10

Then read before writing any code:
- src/components/vault/vault-file-tile.tsx
- src/components/vault/vault-client.tsx
- src/types/index.ts (find VaultFileRecord type)
- src/lib/format.ts (check if formatFileSize exists)

Read the full blueprint at: D:\Work\SEO-Services\ghm-dashboard\docs\blueprints\SPRINT_30_WAVE_BLUEPRINTS.md

SPRINT BRIEF:
Replace click-to-download on vault tiles with a preview-first modal. PDFs in iframe, images inline, others show metadata card. Download is a secondary action inside the modal.

BUILD ORDER:
1. formatFileSize — if missing from src/lib/format.ts, add it: (bytes: number) => "1.2 MB" / "340 KB" / "512 B"

2. VaultPreviewModal — new file: src/components/vault/VaultPreviewModal.tsx
   Props: { file: VaultFileRecord | null, open: boolean, onClose: () => void, onDownload: (file: VaultFileRecord) => void }
   Content by mimeType: pdf → iframe h-[500px], image → img max-h-[500px] object-contain, video → video controls, all else → Lucide file icon + "Preview not available"
   Header: truncated file name (Tooltip for full), date, uploader, formatted size
   Footer: Download (primary) + Close (outline)
   If file.space === "shared" → amber "Always use files from the Shared folder. Local copies become outdated." in modal (NOT toast)

3. Wire vault-file-tile.tsx — tile click → onPreview callback. Three-dot Download → still direct download. Remove any tile-click toast.

4. Wire vault-client.tsx — previewFile state, mount VaultPreviewModal, pass onPreview to tiles.

FILES TO CREATE: src/components/vault/VaultPreviewModal.tsx
FILES TO MODIFY: vault-file-tile.tsx, vault-client.tsx, format.ts (only if formatFileSize missing)
DO NOT touch: src/app/api/vault/ routes, vault-upload-button.tsx

IMMUTABLE CONSTRAINTS:
- SALARY_ONLY_USER_IDS = [4]
- npx tsc --noEmit zero NEW errors
- No schema changes

QUALITY GATES:
□ PDF tile → iframe preview modal
□ Image tile → inline image modal
□ .docx/.xlsx tile → metadata + "Preview not available"
□ Modal Download button → download
□ Three-dot Download → direct download (no modal)
□ Delete flow unchanged
□ Shared-space amber warning inside modal
□ Scrollable at 375px

STOPPING CONDITIONS → write BLOCKED.md:
- VaultFileRecord missing a required preview field AND not in DB select query
- TypeScript fails after 2 attempts

COMMIT: feat(vault): preview-before-download modal — PDF iframe, image lightbox, metadata card for other types
DO NOT run docs sync. Just commit and push.
KERNL checkpoint every 5-8 tool calls.
```

---

## INSTANCE 33 — Customization Audit (runs in parallel with Sprint 30 wave)

```
BUSINESS SESSION — COWORK AGENT — SPRINT 33

You are an autonomous Cowork agent executing Sprint 33 for the GHM Dashboard project.
This is a documentation-only sprint. Read source files and produce a comprehensive audit document.
DO NOT modify any .tsx, .ts, .css, .prisma, or config files.

BOOTSTRAP (execute before any code):
1. Filesystem:read_file D:\Work\SEO-Services\ghm-dashboard\AGENT_PROTOCOL.md
2. Filesystem:read_file D:\Work\SEO-Services\ghm-dashboard\CLAUDE_INSTRUCTIONS.md
3. Filesystem:read_file D:\Work\SEO-Services\ghm-dashboard\STATUS.md
4. Filesystem:read_file D:\Work\SEO-Services\ghm-dashboard\CHANGELOG.md (first 60 lines)
5. Run: git -C D:\Work\SEO-Services\ghm-dashboard log --oneline -10

Read the full blueprint at: D:\Work\SEO-Services\ghm-dashboard\docs\blueprints\SPRINT_33_BLUEPRINT.md

SPRINT BRIEF:
Produce docs/CUSTOMIZATION_AUDIT.md — comprehensive audit of every configurable surface. Read source, document current state + proposed UX + storage + scope + effort + priority per surface. No code changes.

READ THESE FILES FIRST (in order):
1. src/components/dashboard/DashboardLayoutClient.tsx
2. src/components/dashboard/dashboard-widgets.tsx
3. src/hooks/use-keyboard-shortcuts.ts
4. src/components/layout/ (list dir, read nav/sidebar file)
5. src/components/settings/GeneralSettingsTab.tsx
6. src/components/settings/CompensationTab.tsx
7. src/components/clients/portfolio.tsx
8. src/app/(dashboard)/leads/client.tsx
9. src/app/(dashboard)/tasks/page.tsx
10. src/components/analytics/analytics-dashboard.tsx
11. src/components/vault/vault-client.tsx
12. src/types/index.ts
13. prisma/schema.prisma (UserSettings + GlobalSettings)
14. src/lib/format.ts

PRODUCE: docs/CUSTOMIZATION_AUDIT.md
Sections: Executive Summary, Priority Matrix, then 11 numbered sections (Dashboard Widgets, Data Tables, Navigation, Notifications, Page Defaults, Display Preferences, Quick Actions, Pipeline Customization, Keyboard Shortcuts, Content Studio, Reports), then Implementation Sequence.

Per subsurface: Current State / Proposed UX / Storage / Scope (per-user/tenant/global) / Effort (S/M/L) / Priority (Must/Should/Would/Future)

TARGET: >200 lines. Substantive — not placeholders.

CONSTRAINTS:
- DO NOT modify any source file
- If file not found → note "NOT FOUND" and continue

QUALITY GATES:
□ docs/CUSTOMIZATION_AUDIT.md exists, >200 lines
□ All 11 sections present and substantive
□ Priority Matrix covers every surface
□ git diff shows only docs/ changes

DOCS SYNC (this instance handles its own sync — no parallel coordination needed):
1. Delete FEAT-034 from BACKLOG.md
2. Add to CHANGELOG.md: | March 2026 | [hash] | FEAT-034: CUSTOMIZATION_AUDIT.md — 11-section surface audit |
3. Update STATUS.md Last Updated
4. git add -A && git commit -m "docs: CUSTOMIZATION_AUDIT.md — comprehensive personalization surface audit (FEAT-034)" && git push

KERNL checkpoint every 5-8 tool calls.
```

---

## SPRINT 30 POST-WAVE SYNC
## Run this AFTER all three 30-A/B/C instances have committed and pushed.

```
BUSINESS SESSION — COWORK AGENT — SPRINT 30 POST-WAVE DOCS SYNC

You are an autonomous Cowork agent performing the post-wave documentation sync for Sprint 30.
All three code instances (30-A, 30-B, 30-C) have already committed and pushed. Docs only.

BOOTSTRAP:
1. Filesystem:read_file D:\Work\SEO-Services\ghm-dashboard\AGENT_PROTOCOL.md
2. Filesystem:read_file D:\Work\SEO-Services\ghm-dashboard\CLAUDE_INSTRUCTIONS.md
3. Run: git -C D:\Work\SEO-Services\ghm-dashboard pull origin main
4. Run: git -C D:\Work\SEO-Services\ghm-dashboard log --oneline -15
5. Run: cd D:\Work\SEO-Services\ghm-dashboard && npx tsc --noEmit

If TypeScript gate shows NEW errors (beyond the 5 pre-existing in scripts/basecamp): write BLOCKED.md with exact errors. Stop. Do not proceed.

If TypeScript is clean:
1. BACKLOG.md — delete: UX-FEAT-002 (TeamFeed Major Overhaul), UX-AUDIT-027 (Contrast Pass), FEAT-035 (Vault Preview)
2. CHANGELOG.md — prepend entry with actual commit hashes from git log:

## Sprint 30 — Communication + Polish — March 2026
TeamFeed upgraded to two-pane layout with resizable panel (drag handle, 240–520px, localStorage), left rail with presence indicators (online/offline via DashboardEvent recency), and user-list direct-message targeting. GET /api/team/presence route added. WCAG AA contrast audit complete — all foreground/background token pairs adjusted to meet 4.5:1 ratio; sidebar, status, and accent tokens verified. Vault preview-before-download modal added — PDFs in iframe, images inline, other types show metadata card; download is secondary action; shared-space amber warning moved from toast into modal. Commits: [30-A hash], [30-B hash], [30-C hash].

3. STATUS.md — update Last Updated: "March 2026 — Sprint 30 complete. TeamFeed two-pane, WCAG contrast audit, vault preview. Next: Sprint 34 COVOS module expansion per ARCH-003 roadmap."
4. git add -A
5. git commit -m "docs: Sprint 30 wave sync — TeamFeed two-pane, contrast audit, vault preview"
6. git push

No code changes. Docs sync only.
```
