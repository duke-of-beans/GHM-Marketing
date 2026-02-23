# GHM DASHBOARD — SYNC PROTOCOL
**Version:** 1.0 — February 23, 2026
**Rule:** Docs FIRST. Git SECOND. Never just git.

---

## The Three Files and What They Own

| File | Owns | Never Contains |
|------|------|----------------|
| `BACKLOG.md` | Open work only. Tiered by priority. | Completed items. No ✅. |
| `CHANGELOG.md` | Every completed item. Permanent. Never pruned. | Future or open work. |
| `STATUS.md` | Current sprint + critical constraints + file index. | Long lists of completed items. |

These three files are the single source of truth together. They don't overlap. If something is done, it is in CHANGELOG.md and nowhere else.

---

## Closing an Item (Every Time Something Ships)

**Step 1 — Add to CHANGELOG.md**
Append a row to the table:
```
| YYYY-MM-DD | commit_hash | What shipped — one line summary |
```
If the commit isn't known yet, use `(pending)` and fill it in after committing.

**Step 2 — Delete from BACKLOG.md**
Find the item. Delete it entirely. No ✅, no "COMPLETE" label. Gone.

**Step 3 — Update STATUS.md**
Update the "Last Updated" line at the top:
```
**Last Updated:** February 23, 2026 — [what you just shipped]
```
If the item was in an active sprint section, check it off or remove it.

**Step 4 — git add -A**

**Step 5 — git commit -m "..."**
Use the commit hash to fill in CHANGELOG.md if you used `(pending)`.

**Step 6 — git push**

---

## Adding a New Item to the Backlog

When you identify new work mid-session or at the end of a session:
1. Open BACKLOG.md
2. Add the item to the correct tier (MUST / SHOULD / WOULD / FUTURE)
3. Include: what it is, why it exists, scope, size estimate, any file paths
4. Do NOT add it to STATUS.md (that file doesn't track future work)
5. Commit the backlog update with the rest of the session

---

## The commit.bat Reminder

`commit.bat` prints this checklist before running git. If you haven't done these steps, stop and do them first.

---

## What "Sync, Commit, and Push" Means — No Exceptions

1. For each thing completed this session → CHANGELOG.md row added, BACKLOG.md item deleted
2. STATUS.md "Last Updated" line updated
3. `git add -A`
4. `git commit -m "..."`
5. `git push`

This is the complete definition. If git runs without steps 1–2 happening, the process was skipped.

---

## Common Failure Mode

> "I'll update the docs after the commit."

This never happens. Docs before git, every time. The commit message itself should describe what shipped — if you can't write the commit message, you haven't finished closing the item in the docs first.
