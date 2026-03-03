# Route Audit — Sprint 36

Generated: 2026-03-03
Sprint: 36 (Demo-Ready)
Script: `scripts/route-audit.js`

## Summary

| Category | Count |
|----------|-------|
| Total API routes | 239 |
| Guarded (permission check) | 140 |
| Guarded (session only) | 68 |
| Guarded (tenant only) | 2 |
| Guarded (cron secret) | 13 |
| Public (intentional) | 6 |
| Public (token-based) | 3 |
| Dead code (tombstone) | 1 |
| **Genuinely unguarded (pre-fix)** | **3** |
| **Fixed in Sprint 36** | **3** |

> **Note:** The original automated scan (`scripts/route-audit.js`) flagged 17 routes as UNGUARDED. Manual review revealed that 7 of those use `requirePermission()` — a guard function the script didn't detect. The remaining routes broke down as: 6 intentionally public, 1 dead code, 1 token-validated, and 3 genuinely unguarded (all fixed below).

## Unguarded Routes — Triage

### Acceptable (by design)

These routes are unguarded intentionally — they serve public or pre-auth flows:

| Route | Methods | Reason |
|-------|---------|--------|
| `/api/auth/forgot-password` | POST | Pre-auth password reset — no session exists |
| `/api/auth/reset-password` | POST | Token-validated password reset — no session exists |
| `/api/oauth/google/callback` | GET | OAuth redirect from Google — session established after |
| `/api/oauth/google/connect/[clientId]` | GET | OAuth initiation — redirects to Google |
| `/api/oauth/google-ads/callback` | GET | OAuth redirect from Google Ads |
| `/api/oauth/google-ads/connect/[clientId]` | GET | OAuth initiation — redirects to Google Ads |
| `/api/onboarding/refresh-token` | POST | Refreshes onboarding token — validated internally via token |

### False Positives (script missed `requirePermission()`)

These routes were originally flagged as UNGUARDED but actually use `requirePermission()` — a guard function the audit script did not detect. They are properly secured:

| Route | Methods | Actual Guard |
|-------|---------|--------------|
| `/api/admin/onboarding` | GET, PATCH | `requirePermission("manage_settings")` |
| `/api/analytics/dashboard-usage` | GET | `requirePermission("manage_settings")` |
| `/api/clients/[id]/ads/campaigns` | GET | `requirePermission("manage_clients")` |
| `/api/debug/tenant` | GET | `requirePermission("manage_settings")` |
| `/api/domains/search` | GET | `requirePermission("manage_clients")` |
| `/api/settings/branding` | POST, DELETE | `requirePermission("manage_settings")` |

### Dead Code

| Route | Issue |
|-------|-------|
| `/api/clients/[id]/gbp/reviews` | ~~Tombstone — file contains only `export {}`. No HTTP methods.~~ **Deleted in Sprint 37.** |
| `/api/leads/[id]/audit` | **NOT dead — Sprint 37 review found active GET + POST handlers (79 lines, `handleAudit`). Incorrectly flagged by audit script. Do not delete.** |

### Fixed in Sprint 36

These routes were genuinely unguarded and have been patched:

| Route | Methods | Risk | Fix Applied |
|-------|---------|------|-------------|
| `/api/clients/[id]/gbp/posts` | POST | **HIGH** | Added `withPermission(req, "manage_clients")` |
| `/api/clients/[id]/gbp/reviews/[reviewId]/reply` | POST | **HIGH** | Added `withPermission(req, "manage_clients")` |
| `/api/checklist-templates` | GET | **LOW** | Added `getCurrentUser()` session guard |

## Potentially Dead Routes

Routes with no exported HTTP methods or suspicious patterns:

| Route | Issue |
|-------|-------|
| `/api/clients/[id]/gbp/reviews` | **Deleted Sprint 37** — was a tombstone (`export {}` only) |
| `/api/leads/[id]/audit` | **FALSE POSITIVE** — Sprint 37 manual review confirmed active GET + POST handlers. Audit script missed them (uses `handleAudit` helper pattern). Route is live and should not be deleted. |

## Guard Pattern Reference

The codebase uses three guard patterns:

**`withPermission(req, "permission_name")`** — Full permission check. Validates session + tenant + specific permission. Returns error response if unauthorized. Used by 134 routes.

**`getCurrentUser()` / `getCurrentUserWithPermissions()`** — Session-level auth. Validates the user is logged in but doesn't check specific permissions. Used by 67 routes.

**`requireTenant()`** — Tenant isolation only. Ensures multi-tenant header is present. Used by 2 routes (both also have session guards from other paths).

**`CRON_SECRET`** — Header-based secret for scheduled jobs. Used by 13 cron routes.

## Recommended Actions (Track D) — RESOLVED

All genuinely unguarded routes have been fixed in Sprint 36. Remaining backlog items:

1. ~~**DEAD CODE** — `/api/clients/[id]/gbp/reviews` — Tombstone file (`export {}`). Safe to delete when convenient.~~ **Deleted Sprint 37.**
2. ~~**DEAD CODE** — `/api/leads/[id]/audit` — No HTTP methods detected. Verify and clean up.~~ **NOT dead — Sprint 37 manual review found active GET + POST handlers. Do not delete.**


## Button + Logic Chain Audit

### Destructive Actions (DELETE operations)

All client-side DELETE operations were audited for: confirmation dialog, toast feedback, API route guard status.

| Component | Action | Confirm? | Toast? | API Route | Guarded? |
|-----------|--------|----------|--------|-----------|----------|
| vault-file-tile | Delete file | ✅ confirm() | ✅ | /api/vault/files | ✅ GUARDED_SESSION |
| TeamFeed | Delete message | ✅ confirm() | ✅ | /api/team-messages/[id] | ✅ GUARDED_PERM |
| TeamFeedSidebar | Delete message | ✅ confirm() | ✅ | /api/team-messages/[id] | ✅ GUARDED_PERM |
| task-checklist | Delete item | ❌ no confirm | ✅ | /api/tasks/[id]/checklist/[itemId] | ✅ GUARDED_SESSION |
| recurring-tasks-client | Delete rule | ✅ confirm() | ✅ | /api/recurring-tasks/[id] | ✅ GUARDED_SESSION |
| TeamManagementTab | Deactivate user | ❌ no confirm | ✅ | /api/users/[id] | ✅ GUARDED_PERM |
| TeamManagementTab | Hard delete user | ✅ dialog | ✅ | /api/users/[id]?permanent | ✅ GUARDED_PERM |
| PositionsTab | Delete position | ✅ dialog | ✅ | /api/positions/[id] | ✅ GUARDED_PERM |
| territories-client | Deactivate territory | ❌ no confirm | ✅ | /api/territories/[id] | ✅ GUARDED_PERM |
| CostDashboard | Purge cache | unknown | ✅ | /api/settings/costs | ✅ GUARDED_PERM |

### Missing Confirmations (Low Risk)

Three DELETE actions lack user confirmation:

1. **task-checklist: delete item** — Low risk, easily undoable by re-adding. No fix needed.
2. **TeamManagementTab: deactivate user** — Medium risk. User is soft-deleted (can be restored). Consider adding confirm().
3. **territories-client: deactivate territory** — Low risk, soft-delete pattern. Consider confirm().

### Button → Route Integrity

All audited buttons correctly target existing API routes. No broken links or orphaned fetch calls were found. All destructive routes are properly permission-gated.

### Orphaned Routes (No Frontend Callers Found)

These routes exist in the API but could not be matched to any frontend fetch call — may be dead or only used by cron/external:

| Route | Status | Likely Reason |
|-------|--------|---------------|
| /api/clients/[id]/gbp/reviews | No methods | Dead stub |
| /api/leads/[id]/audit | No methods | Dead or WIP |
| /api/enrichment | Not found in tree | May have been deleted |

---

*Audit generated programmatically via `scripts/route-audit.js` + manual button chain review.*
