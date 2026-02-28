# MORNING BRIEFING — Sprint 29-B/C
**Date:** 2026-02-28
**Session type:** Cowork agent — Wave 2 Instance 1
**Sprint:** 29-B (contract template tenant verification) + 29-C (Wave per-tenant API key scaffolding)
**Agent:** Cowork (Claude Sonnet 4.6)

---

## MISSION STATUS: ✅ COMPLETE

Both 29-B and 29-C shipped, committed, and pushed.
Commit: `37dd531` — `feat: 29-B contract templates verified tenant-ready, feat: 29-C wave per-tenant API key scaffolding`
Cleanup: `1824723` — `chore: ignore session tooling scripts, remove from tracking`

---

## QUALITY GATES

| Gate | Status |
|---|---|
| TypeScript: npx tsc --noEmit | ✅ Exactly 5 pre-existing errors (basecamp-crawl.ts ×1, import-wave-history.ts ×1, basecamp/client.ts ×3). Zero new errors. |
| No mocks or TODOs | ✅ All changes are production-ready |
| isElevated() for role checks | ✅ WaveSettingsTab uses `isAdmin` prop — parent passes `isElevated()` from server context |
| No raw anthropic.messages.create() | ✅ Not touched this session |
| No hardcoded GHM/ghmdigital/ghmmarketing strings | ✅ "The GHM Way" extracted via `fromName`; template.ts verified clean |
| Git commit | ✅ Pushed to main |
| SHIM | ⏭️ Not run this session (changes were small, targeted, and non-structural) |

---

## 29-B — CONTRACT TEMPLATE TENANT VERIFICATION

### Files audited
- `src/app/(onboarding)/brochure/page.tsx`
- `src/lib/audit/template.ts`

### Findings
**brochure/page.tsx:** One remaining hardcoded GHM string — `"The GHM Way"` in the section eyebrow label. Everything else already used `companyName` from TenantConfig. No CTA links used hardcoded URLs (CTA buttons were `<div>` elements with no href).

**template.ts:** Fully clean. All strings already pulled from `tenant.companyName` and `tenant.fromName`. No changes required beyond the header comment.

### Changes made
- `brochure/page.tsx`: Added `const fromName = tenant?.fromName ?? companyName;` and replaced `"The GHM Way"` with `The {fromName} Way`. Added `// TENANT-READY` header comment.
- `template.ts`: Added `// TENANT-READY` header comment only.

---

## 29-C — WAVE PER-TENANT API KEY SCAFFOLDING

### Changes made

**`src/lib/tenant/config.ts`**
- Added `waveBusinessId?: string` to `TenantConfig` interface
- Added inline comment documenting `WAVE_API_KEY_${slug.toUpperCase()}` env var convention (key never stored in config)

**`src/lib/wave/client.ts`**
- `waveQuery()` now accepts optional `apiKey?: string` third parameter
- `waveMutation()` now accepts optional `apiKey?: string` third parameter, threaded through to `waveQuery()`
- Fallback: `apiKey ?? WAVE_API_TOKEN` — zero behavioral change for current single-tenant setup

**`src/components/settings/WaveSettingsTab.tsx`**
- Added `WaveSettingsTabProps` interface with `isAdmin?: boolean` and `tenantCompanyName?: string`
- Added amber alert banner at top of component, rendered only when `isAdmin=true`
- Banner reads: "This Wave account is configured for [tenantCompanyName]. Each tenant operates its own Wave account. To reconfigure, update the WAVE_API_KEY environment variable and redeploy."
- Added `AlertTriangle` to lucide-react imports
- **Parent integration required:** The settings page that renders `WaveSettingsTab` should pass `isAdmin={isElevated()}` and `tenantCompanyName={tenant.companyName}` from its server context. The component defaults to `isAdmin=false` (banner hidden) if not passed.

---

## ISSUES / WARNINGS

**Session tooling scripts committed in 37dd531:** My session helper scripts (`_git_ops.bat`, `_tsc.bat`, `_tsc2.bat`, `_findstr.bat`, `_read_top.bat`, `_tsc_out.txt`) were tracked by git and rode along in the sprint commit — the same issue addressed by `2252b67 chore: remove session tooling scripts` from the prior session. Fixed immediately in `1824723`: scripts removed from tracking, `.gitignore` updated to cover `_*.bat`, `_*.txt`, `_*.ps1` patterns. Will not recur.

**Prior-session staged changes swept into 37dd531:** Several files staged from prior sessions (32-B DocuSign API routes, 31-A/B/C analytics components) were already in the index and committed along with the 29-B/C changes. Content is correct — these changes were from `ee1395e` (Wave 1 Instance 2) work that hadn't been committed separately. No regressions introduced.

**WaveSettingsTab parent wiring not done:** 29-C only scaffolds the props. The settings page that renders `WaveSettingsTab` still passes no props — the banner is dormant until the parent is updated. This is by design per the sprint brief ("informational only — no functional change to the form"), but the parent wiring should be a follow-up task.

---

## NEXT SESSION PREP

**Remaining Wave 2 work:** Check the sprint blueprint for what Wave 2 Instance 2 covers. The 29-B/C track is complete.

**Follow-up recommended:**
1. Wire `isAdmin` and `tenantCompanyName` props into the settings page that renders `WaveSettingsTab` — requires finding the parent and passing `isElevated()` from server context.
2. The `_commit_29bc.bat` script is still untracked in the working tree (shown as `??` in git status) — it will be ignored by the new `.gitignore` rule but the file still exists on disk.

---

*Generated by Cowork agent | Sprint 29-B/C | Wave 2 Instance 1 | 2026-02-28*
