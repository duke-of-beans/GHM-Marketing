# GHM DASHBOARD — AGENT PROTOCOL (PROJECT OVERRIDE)
## Overrides D:\Work\AGENT_PROTOCOL.md for this project
**Version:** 1.0.0
**Created:** February 24, 2026
**Project path:** D:\Work\SEO-Services\ghm-dashboard

---

## §1 BOOTSTRAP SEQUENCE (GHM-specific)

Execute in this order before any code changes:

1. `Filesystem:read_file D:\Work\SEO-Services\ghm-dashboard\AGENT_PROTOCOL.md` — this file
2. `Filesystem:read_file D:\Work\SEO-Services\ghm-dashboard\CLAUDE_INSTRUCTIONS.md`
3. `Filesystem:read_file D:\Work\SEO-Services\ghm-dashboard\STATUS.md`
4. First 60 lines of `CHANGELOG.md` — recent history, avoid re-doing work
5. Read the sprint blueprint specified in the session brief
6. Run `git log --oneline -10` — triangulate against STATUS.md
7. Check for `BLOCKED.md` in project root — if found, stop and surface to user

If STATUS.md and git log conflict: git log is ground truth. Note the discrepancy in MORNING_BRIEFING.

---

## §2 IMMUTABLE CONSTRAINTS (always active, no blueprint can override)

- **`SALARY_ONLY_USER_IDS = [4]`** — Gavin never receives commissions or engine payments. Never touch this.
- **No Wave AP bypass** — commissions always generate `PaymentTransaction` records → human approval in Approvals tab → Wave AP pays. Never bypass.
- **`prisma db push` only** — never `prisma migrate dev` in this project.
- **No raw `anthropic.messages.create()`** outside `src/lib/ai/`
- **`isElevated()` for all role checks** — never raw role string comparisons
- **Multi-tenant safety** — `src/lib/tenant/` handles tenant detection. No GHM-specific logic hardcoded outside the tenant registry.

---

## §3 QUALITY GATES

### Gate 1: TypeScript (BLOCKING)
```bash
cd D:\Work\SEO-Services\ghm-dashboard; npx tsc --noEmit
```
Zero new errors required. Pre-existing errors acceptable only in:
- `scripts/basecamp-crawl.ts`
- `scripts/import-wave-history.ts`
- `src/lib/basecamp/client.ts`

Any new TypeScript error = BLOCKED. Write BLOCKED.md with the exact error(s).

### Gate 2: SHIM
Run SHIM against all modified files.
Write findings to `SHIM_REPORT.md` in project root.
Findings go in MORNING_BRIEFING under QUALITY GATES.
SHIM findings surface but do not block unless critical.

### Gate 3: Git Clean
```bash
git status --short
```
Only committed changes should remain. No orphaned changes.

---

## §4 SYNC PROTOCOL (docs before git — always)

In this order:
1. **BACKLOG.md** — delete shipped items (no checkmarks, just delete)
2. **CHANGELOG.md** — add row: `| [date] | [commit hash] | [what shipped] |`
3. **STATUS.md** — update `Last Updated:` line
4. `git add -A` → `git commit -m "type(scope): description"` → `git push`

Never commit without updated docs. The SYNC_PROTOCOL.md in project root has full detail.

---

## §5 FORBIDDEN OPERATIONS (GHM-specific additions)

Beyond the base BUSINESS AGENT_PROTOCOL forbidden list:
- Modify `SALARY_ONLY_USER_IDS` or any commission guard
- Modify `src/lib/tenant/` without explicit blueprint spec
- Run `prisma migrate dev`
- Bypass Wave AP approval flow (any code that sends AP payments without `PaymentTransaction` record)
- Remove or truncate CHANGELOG.md — it is permanent
- Commit without updated STATUS/CHANGELOG/BACKLOG

---

## §6 STOPPING CONDITIONS (GHM-specific additions)

Beyond the base stopping conditions:
- TypeScript gate fails with new errors (not pre-existing)
- Blueprint requires schema changes not specified in detail
- Any item requires touching commission or salary guard logic not explicitly specced
- Any item requires multi-tenant infrastructure changes not explicitly specced

---

## §7 KERNL CHECKPOINTING

```typescript
KERNL:auto_checkpoint({
  project: "ghm-dashboard",
  operation: "Exact description of current task",
  currentStep: "Which file, which component, what change",
  decisions: ["Every judgment call — no exceptions"],
  nextSteps: ["Exact next file and action"],
  activeFiles: ["All files modified this session"]
})
```

Every 5-8 tool calls. Non-negotiable.

---

## §8 SESSION END CHECKLIST

```
□ TypeScript gate: PASS (0 new errors)
□ SHIM: Run, findings in SHIM_REPORT.md
□ Git status: Clean after commit
□ BACKLOG.md: Shipped items deleted
□ CHANGELOG.md: Row(s) added
□ STATUS.md: Last Updated updated
□ MORNING_BRIEFING.md: Written to project root
□ git add -A → git commit → git push: Complete
□ KERNL mark_complete: Called
```

---

*Version: 1.0.0 | Created: February 24, 2026*
*Overrides: D:\Work\AGENT_PROTOCOL.md*
*See: D:\AGENT_ARCHITECTURE.md for full operating model*
