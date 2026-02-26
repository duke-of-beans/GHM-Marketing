# SECURITY FIX — Permission Gaps in Content & Client Sub-Routes
**Created:** February 26, 2026
**Scope:** Add `withPermission` auth checks to 16 unprotected API handlers
**Severity:** CRITICAL — 5 AI generation endpoints callable without authentication
**Execution:** Single-pass, one commit. ~30 minutes.
**Codebase:** D:\Work\SEO-Services\ghm-dashboard

---

## Problem

The FEAT-011 route audit found that the entire `src/app/api/content/` namespace (minus `bulk/` and `review/`) has zero authentication. Any unauthenticated HTTP request can hit the AI generation endpoints (burning OpenAI credits and writing to the DB), read all content, delete content, schedule, publish, and restore — with no identity check.

Two `clients/[id]` sub-routes (`gbp` and `voice-profile`) have the same gap.

**Already secured (no changes needed):**
- `content/bulk/route.ts` — has `auth()` + `isElevated()` check
- `content/review/route.ts` — has `withPermission(req, "manage_clients")`
- `clients/[id]/capture-voice/route.ts` — has `withPermission(request, "manage_clients")`

---

## The Fix

Every handler gets the same 3-line pattern at the top of the function body:

```typescript
import { withPermission } from "@/lib/auth/api-permissions";

// Inside the handler, FIRST thing:
const permissionError = await withPermission(request, "manage_clients");
if (permissionError) return permissionError;
```

`withPermission` handles: session check, user lookup, permission evaluation, audit logging, and returns a `NextResponse` with 401/403 if denied, or `null` if allowed.

The `request` parameter name varies — some handlers use `request`, some use `req`, some use `_req`. Match whatever the existing handler signature uses. If the handler uses `_req` (unused), rename it to `request` (now used).

---

## File-by-File Checklist

### Content Generation (5 files — HIGHEST PRIORITY — burns AI credits)

**1. `src/app/api/content/generate-blog/route.ts`**
- Handler: `POST`
- Current import: `prisma` from `@/lib/prisma`, `callAI` from `@/lib/ai`
- ADD import: `import { withPermission } from "@/lib/auth/api-permissions";`
- ADD at top of POST body (after `try {`): `const permissionError = await withPermission(request, "manage_clients"); if (permissionError) return permissionError;`

**2. `src/app/api/content/generate-meta/route.ts`**
- Handler: `POST`
- Same pattern as above.

**3. `src/app/api/content/generate-ppc/route.ts`**
- Handler: `POST`
- Same pattern.

**4. `src/app/api/content/generate-social/route.ts`**
- Handler: `POST`
- Same pattern.

**5. `src/app/api/content/generate-strategy/route.ts`**
- Handler: `POST`
- Same pattern.

### Content CRUD (5 files)

**6. `src/app/api/content/list/route.ts`**
- Handler: `GET`
- ADD import + permission check. Same pattern.

**7. `src/app/api/content/[id]/route.ts`**
- Handlers: `DELETE` and likely `GET` and/or `PATCH`
- ADD import once at top of file.
- ADD permission check at the top of EACH exported handler function.

**8. `src/app/api/content/batch/route.ts`**
- Handler: `DELETE` (bulk delete by contentIds array)
- ADD import + permission check.

**9. `src/app/api/content/schedule/route.ts`**
- Handler: `POST`
- ADD import + permission check.

**10. `src/app/api/content/publish/[id]/route.ts`**
- Handler: `POST`
- ADD import + permission check.

**11. `src/app/api/content/[id]/restore/route.ts`**
- Handler: `POST`
- ADD import + permission check.

**12. `src/app/api/content/[id]/versions/route.ts`**
- Handler: `GET`
- ADD import + permission check.

### Client Sub-Routes (2 files, 4 handlers)

**13. `src/app/api/clients/[id]/gbp/route.ts`**
- Handlers: `GET` and `DELETE`
- Current: no auth on either.
- `_req` parameter on GET — rename to `request` (now needed by `withPermission`).
- `_req` parameter on DELETE — rename to `request`.
- ADD import: `import { withPermission } from "@/lib/auth/api-permissions";`
- ADD at top of GET: `const permissionError = await withPermission(request, "manage_clients"); if (permissionError) return permissionError;`
- ADD at top of DELETE: `const permissionError = await withPermission(request, "manage_clients"); if (permissionError) return permissionError;`

**14. `src/app/api/clients/[id]/voice-profile/route.ts`**
- Handlers: `GET` and `DELETE`
- Current: no auth on either.
- ADD import + permission check to both handlers.

---

## Additional Fix: Hardcoded `createdBy: 1`

**File:** `src/app/api/content/[id]/restore/route.ts` (line ~74)
**Current:** `createdBy: 1, // TODO: Use session user ID`

Once `withPermission` is added to this handler, the session is available. After the permission check, extract the user ID:

```typescript
const permissionError = await withPermission(request, "manage_clients");
if (permissionError) return permissionError;

// Get session for user ID (withPermission already validated it exists)
const { auth } = await import("@/lib/auth");
const session = await auth();
const userId = parseInt(session!.user.id);
```

Then replace `createdBy: 1` with `createdBy: userId`.

**Note:** There's also a `createdBy: version.createdBy` elsewhere in the versions route — that one is correct (copies from original version, not the current user). Leave it.

---

## Verification

```powershell
# Every content route should now import withPermission (except bulk which uses auth() directly)
Get-ChildItem -Recurse -Include "route.ts" -Path "src/app/api/content" |
  Where-Object { $_.FullName -notmatch "bulk" } |
  ForEach-Object {
    $has = (Select-String -Path $_.FullName -Pattern "withPermission" -Quiet)
    if (-not $has) { Write-Output "MISSING AUTH: $($_.FullName)" }
  }
# Expected: no output (all routes have withPermission)

# GBP and voice-profile should have withPermission
Select-String -Path "src/app/api/clients/[id]/gbp/route.ts","src/app/api/clients/[id]/voice-profile/route.ts" -Pattern "withPermission"
# Expected: 4 matches (2 handlers × 2 files)

# No remaining createdBy: 1 hardcodes
Get-ChildItem -Recurse -Include "route.ts" -Path "src/app/api/content" |
  Select-String -Pattern "createdBy:\s*1[^0-9]" |
  ForEach-Object { "$($_.Filename):$($_.LineNumber): $($_.Line.Trim())" }
# Expected: no output
```

### TypeScript Check

```powershell
npx tsc --noEmit 2>&1 | Select-String -Pattern "error TS" |
  Where-Object { $_.Line -notmatch "scripts[/\\]basecamp|import-wave-history" } |
  Measure-Object | Select-Object -Exp Count
# Expected: 0 new errors
```

---

## Commit

```
fix(security): add auth to 16 unprotected API handlers — CRITICAL

Added withPermission("manage_clients") to all content/* handlers:
- 5 AI generation endpoints (generate-blog, generate-meta, generate-ppc,
  generate-social, generate-strategy) — previously callable without auth,
  burning OpenAI credits
- 7 content CRUD endpoints (list, [id], batch delete, schedule,
  publish, restore, versions)
- 2 client sub-route files (gbp GET/DELETE, voice-profile GET/DELETE)

Fixed createdBy: 1 hardcode in content/[id]/restore — now uses session user ID.

Already secured (unchanged): content/bulk (auth+isElevated), content/review
(withPermission), clients/[id]/capture-voice (withPermission).

Closes: PG-01 through PG-18 from ROUTE_AUDIT.md.
```

---

## Cowork Prompt

```
SECURITY FIX — Execute SECURITY_FIX_PERMISSION_GAPS.md in the GHM Dashboard (D:\Work\SEO-Services\ghm-dashboard).

This is a single-pass fix adding withPermission auth checks to 16 unprotected API route handlers. The blueprint lists every file, every handler, and the exact 3-line pattern to add.

Pattern for each handler:
1. Add import: import { withPermission } from "@/lib/auth/api-permissions";
2. Add at the top of the handler body (inside try block if one exists):
   const permissionError = await withPermission(request, "manage_clients");
   if (permissionError) return permissionError;
3. If the handler parameter is _req (unused), rename to request.

14 files, 16 handlers total. Plus fix createdBy: 1 hardcode in content/[id]/restore/route.ts.

Do NOT modify content/bulk/route.ts or content/review/route.ts — they already have auth.

Run TypeScript check after all changes. One commit.

CRITICAL: Do NOT run this until Sprint 26 (visual redesign) has finished and been committed. This sprint touches different files (API routes only, no components), but wait for clean git state.
```
