# SPRINT 30 WAVE — PARALLEL EXECUTION BLUEPRINTS
## Three independent instances, zero file overlap
**Date:** March 1, 2026
**Project:** D:\Work\SEO-Services\ghm-dashboard
**Branch:** main (each instance commits independently, last one to finish runs docs sync)

---

## FILE COLLISION ANALYSIS — CONFIRMED CLEAN

| Instance | Primary Files | Overlap Risk |
|----------|--------------|-------------|
| 30-A (TeamFeed Two-Pane) | `TeamFeedSidebar.tsx`, `TeamFeed.tsx`, `team-messages/stream/route.ts`, `globals.css` (@layer utilities section only) | NONE |
| 30-B (Contrast Audit + Fix) | `globals.css` (:root/.dark token values only), `tailwind.config.ts` | NONE with 30-A — different sections |
| 30-C (Vault Preview) | `vault-file-tile.tsx`, `vault-client.tsx`, `format.ts` | NONE |

**30-A and 30-B both touch `globals.css`.** 30-A adds utility classes in `@layer utilities` (bottom of file). 30-B modifies HSL values in `:root`/`.dark` blocks (top of file). Different sections = clean merge. Assign 30-B to pull before pushing if 30-A commits first.

---

# INSTANCE 30-A: TeamFeed Two-Pane Layout

## Mission
Upgrade TeamFeed from a single-column sidebar panel to a Slack-grade two-pane communication hub: resizable panel, people/channels list on the left, message thread on the right, presence indicators.

## Scope

### A1 — Resizable Panel
- Drag handle on left edge of TeamFeed panel div
- Width stored in localStorage `"ghm:teamfeed-width"`
- Default 320px, min 240px, max 520px
- Drag handle: 4px wide, `cursor-col-resize`, `hover:bg-primary/20` feedback
- Mouse events (`onMouseDown` → `document.addEventListener('mousemove'/'mouseup')`) — no library
- CSS custom property `--teamfeed-width` on panel container
- Clean up listeners on unmount

### A2 — Two-Pane Layout
**Left Rail (80px collapsed / 180px expanded):**
- Chevron toggle at top, state in localStorage `"ghm:teamfeed-rail"`
- User list with presence dots (green = active last 5min, grey = offline)
- Data from `GET /api/team/presence` (see A3)
- Each row: initials avatar, display name, presence dot
- Clicking user sets DM audience
- "DIRECT" / "TEAM" section headers
- Rail scrollable on overflow

**Right Thread:**
- Existing message list + compose moves here, no rendering changes

### A3 — Presence API (build this first)
New file: `src/app/api/team/presence/route.ts`

```typescript
type PresenceUser = {
  id: number
  name: string
  role: string
  isActive: boolean   // last DashboardEvent < 5 min ago
  lastSeen: string    // ISO timestamp
}
```

- Auth-gated with `requirePermission` or `getCurrentUserWithPermissions`
- Query `dashboardEvent.findFirst` per user ordered by `createdAt desc`
- No new schema — `DashboardEvent` already exists

### A4 — Typing Indicators (attempt; abort cleanly if too complex)
- POST /api/team-messages/typing `{ userId, isTyping: bool }` — in-memory Map on server
- SSE stream includes `event: typing` messages
- "X is typing..." footer text, dismisses after 3 seconds
- If integration is ugly: skip and note in MORNING_BRIEFING

## Files
**Create:** `src/app/api/team/presence/route.ts`
**Modify:** `src/components/team-feed/TeamFeedSidebar.tsx`, `src/components/team-feed/TeamFeed.tsx`
**globals.css:** Add `--teamfeed-width` default ONLY in `@layer utilities` at BOTTOM. Never touch `:root` HSL blocks.
**Do NOT touch:** `src/app/api/team-messages/` routes, `TeamFeedAttachment.tsx`, `TeamFeedMultimedia.tsx`

## Quality Gates
1. `npx tsc --noEmit` — zero new errors (5 pre-existing in scripts/basecamp OK)
2. Panel resizes 240–520px
3. Rail collapses/expands, persists on refresh
4. Presence route returns 200 with correct shape
5. Existing SSE/send/receive unaffected

## Stopping Conditions
- Requires touching commission/salary/tenant files → BLOCKED.md
- TypeScript fails after 2 fix attempts → BLOCKED.md
- Presence needs schema changes → skip user list, implement placeholder rail, note in MORNING_BRIEFING

## Commit
`feat(team-feed): two-pane layout with resizable panel, presence indicators, rail nav`

**Do not run docs sync — that belongs to whichever instance finishes last.**

---

# INSTANCE 30-B: WCAG Contrast Audit + Fix

## Mission
Audit all foreground/background token pairs in `globals.css` against WCAG AA (4.5:1 normal, 3:1 large text). Fix failing pairs by adjusting HSL lightness only. Never change hue or saturation.

## Scope

### B1 — Audit These Pairs (both light and dark mode)
```
text-foreground on bg-background
text-foreground on bg-card
text-muted-foreground on bg-background
text-muted-foreground on bg-card
text-muted-foreground on bg-muted
text-primary on bg-background
text-status-success on bg-status-success-bg
text-status-warning on bg-status-warning-bg
text-status-danger on bg-status-danger-bg
text-status-info on bg-status-info-bg
text-status-neutral on bg-status-neutral-bg
sidebar-text on sidebar-bg
sidebar-text-muted on sidebar-bg
sidebar-text-active on sidebar-active-bg
accent-foreground on accent (amber CTA buttons)
```

### B2 — Fix Failing Pairs
- Adjust L value in HSL only — never H or S
- Light mode: push foreground darker. Dark mode: push lighter.
- Cap: never below 15% lightness in light, never above 92% in dark
- If a pair can't hit 4.5:1 within cap → document as large-text exception at 3:1 if applicable

### B3 — Sidebar Foreground
Sidebar is always dark navy (`hsl(220 38% 9%)`). Verify `--sidebar-foreground`, `--sidebar-muted`, `--sidebar-active` pass 4.5:1 against it.

### B4 — Accent Button
Amber backgrounds often fail contrast. If `--accent-foreground` on `--accent` fails 4.5:1, darken `--accent-foreground` to near-black.

## Files
**Modify:** `src/app/globals.css` — `:root` and `.dark` HSL blocks ONLY (top of file)
**Do NOT touch:** `@layer utilities` (bottom of file — 30-A owns that), any .tsx files, `chart-tokens.ts`

**globals.css coordination:** Pull 30-A's commit before pushing if 30-A finishes first.

## Quality Gates
1. `npx tsc --noEmit` — zero new errors
2. All audited pairs pass 4.5:1 (or documented as large-text 3:1 exception)
3. Signal palette identity preserved — no hue changes, sidebar still navy, accent still amber
4. MORNING_BRIEFING contains contrast audit table: `| Token Pair | Light Ratio | Dark Ratio | Pass/Fail | Action Taken |`

## Stopping Conditions
- Fix requires changing hue → document, leave token, note in MORNING_BRIEFING (do not block)
- TypeScript gate fails unexpectedly → BLOCKED.md

## Commit
`fix(tokens): WCAG AA contrast pass — foreground lightness adjustments, sidebar + status tokens`

**Do not run docs sync.**

---

# INSTANCE 30-C: Vault Preview Before Download

## Mission
Replace click-to-download on vault tiles with a preview-first modal. PDFs show in iframe, images inline, other types show metadata. Download is a secondary action inside the modal.

## Scope

### C1 — VaultPreviewModal Component
New file: `src/components/vault/VaultPreviewModal.tsx`

Props: `{ file: VaultFileRecord | null, open: boolean, onClose: () => void, onDownload: (file: VaultFileRecord) => void }`

Content by MIME type:
- `application/pdf` → `<iframe src={file.url} className="w-full h-[500px] rounded border" />`
- `image/*` → `<img src={file.url} className="max-w-full max-h-[500px] object-contain rounded" />`
- `video/*` → `<video controls src={file.url} className="w-full max-h-[400px]" />`
- All others → Lucide file icon + "Preview not available" + metadata

Header: file name (truncated 60 chars, full name in Tooltip), upload date, uploader, formatted size
Footer: Download (primary) + Close (outline)
If `file.space === "shared"` → amber "Always use files from the Shared folder. Local copies become outdated." notice inside modal (not toast)

### C2 — Wire VaultFileTile
- Tile click → opens VaultPreviewModal (via onPreview callback prop)
- Three-dot "Download" → still direct download (no modal)
- Three-dot "Open" → opens VaultPreviewModal
- Remove any remaining toast that fires on tile click

### C3 — Wire VaultClient
- Add `previewFile: VaultFileRecord | null` state (default null)
- Mount `VaultPreviewModal`
- Pass `onPreview` handler down to tiles

### C4 — formatFileSize
If missing from `src/lib/format.ts`:
```typescript
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
```

## Files
**Create:** `src/components/vault/VaultPreviewModal.tsx`
**Modify:** `src/components/vault/vault-file-tile.tsx`, `src/components/vault/vault-client.tsx`, `src/lib/format.ts` (only if formatFileSize missing)
**Do NOT touch:** `src/app/api/vault/` routes, `vault-upload-button.tsx`

## Quality Gates
1. `npx tsc --noEmit` — zero new errors
2. PDF tile → iframe preview modal
3. Image tile → inline image modal
4. .docx/.xlsx tile → metadata + "Preview not available"
5. Download button inside modal → file download
6. Three-dot Download → still direct download
7. Delete flow unchanged
8. Shared-space amber warning in modal, not toast
9. Scrollable at 375px viewport

## Stopping Conditions
- VaultFileRecord missing a required field AND it's not in the DB select query → BLOCKED.md
- TypeScript fails after 2 attempts → BLOCKED.md

## Commit
`feat(vault): preview-before-download modal — PDF iframe, image lightbox, metadata card for other types`

**Do not run docs sync.**

---

# POST-WAVE DOCS SYNC
*Whichever instance finishes last handles this after pulling all commits.*

1. `git pull origin main`
2. `npx tsc --noEmit` — verify clean across all changes
3. BACKLOG.md: delete `UX-FEAT-002`, `UX-AUDIT-027`, `FEAT-035`
4. CHANGELOG.md: prepend Sprint 30 entry with all three commit hashes
5. STATUS.md: update Last Updated header
6. `git add -A && git commit -m "docs: Sprint 30 wave sync" && git push`
