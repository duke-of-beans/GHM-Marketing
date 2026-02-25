# ROUTE AUDIT — GHM Dashboard
**Completed:** February 24, 2026 — Sprint 12
**Auditor:** Claude (COVOS session)
**Scope:** All routes under `src/app/(dashboard)/` and their permission enforcement

---

## §1 Permission Architecture

### Role Hierarchy
`admin` > `master` > `sales`

`isElevated(role)` returns `true` for `admin` or `master`. Defined in `src/lib/auth/roles.ts`.

### Permission Keys (`src/lib/auth/permissions.ts`)
| Key | Granted By Default To |
|-----|----------------------|
| `view_all_leads` | master_full, master_lite, sales_advanced, admin |
| `manage_leads` | all presets, admin |
| `view_all_clients` | master_full, master_lite, sales_advanced, admin |
| `manage_clients` | all presets, admin |
| `view_analytics` | master_full, master_lite, sales_advanced, admin |
| `manage_team` | master_full, master_lite, admin |
| `manage_territories` | master_full, admin |
| `manage_products` | master_full, master_lite, admin |
| `view_payments` | master_full, master_lite, sales_advanced, admin |
| `manage_payments` | master_full, master_lite, admin |
| `manage_settings` | master_full, master_lite, admin |

**Note:** Admin role bypasses all presets and always receives all permissions (see `getUserPermissions()`).

---

## §2 Route Inventory

### Dashboard Routes — Permission Map

| Route | Page Type | Permission Gate | Notes |
|-------|-----------|----------------|-------|
| `/master` | Server | `requirePermission("view_analytics")` | ✅ Correct |
| `/sales` | Server | `getCurrentUser()` + role check | ✅ Sales reps redirect through rep-setup wizard on first login |
| `/leads` | Server | `getCurrentUser()` + role awareness | ✅ Filter/enrich/import buttons gated per `userRole` in client |
| `/clients` | — | (not directly audited; profile sub-routes checked) | |
| `/analytics` | Server | `requirePermission("view_analytics")` | ✅ Correct |
| `/content-studio` | Server | `requirePermission("manage_clients")` | ✅ Correct |
| `/website-studio` | Server | `requirePermission("manage_clients")` | ✅ Correct |
| `/live-sites` | Server | `requirePermission("view_analytics")` | ⚠️ Semantically weak — live sites aren't analytics. Acceptable until a `view_sites` key is added. |
| `/reports` | Server | `requirePermission("view_analytics")` | ✅ Correct |
| `/payments` | Server | `requirePermission("view_payments")` | ✅ **Fixed Sprint 12** — was unguarded |
| `/products` | Server | `requirePermission("manage_products")` | ✅ Correct |
| `/settings` | Server | Session check + tab-level guards | ✅ Admin-only tabs gate inside component |
| `/permissions` | Server | `requirePermission("manage_team")` | ✅ Correct |
| `/audit` | Server | `requirePermission("manage_settings")` | ✅ Correct |
| `/bugs` | Server | `requirePermission("manage_settings")` | ✅ **Fixed Sprint 12** — was unguarded client component |
| `/territories` | Server | `requirePermission("manage_territories")` | ✅ **Fixed Sprint 12** — was unguarded client component |
| `/tasks` | Server | Session check only, no permission key | ⚠️ See §3 |
| `/recurring-tasks` | Server | `getCurrentUserWithPermissions()` + `isElevated()` | ✅ Correct — non-elevated users redirect to `/tasks` |
| `/team` | Server | Immediate redirect → `/settings?tab=team` | ✅ Correct |
| `/review` | Server | Immediate redirect → `/tasks?tab=approvals` | ✅ Correct |
| `/discovery` | — | (not directly audited this sprint) | |
| `/profile` | Server | No gate — any logged-in user | ✅ Intentional (personal profile) |

---

## §3 Findings & Fixes

### FIXED — /bugs: No server-side permission gate (CRITICAL)
**Before:** Pure `"use client"` page, no `requirePermission`. Any logged-in user navigated to `/bugs` and saw the page. The API returned an empty response for non-elevated roles (403 → `data.bugs` undefined), but the page itself was fully accessible.
**Secondary bug:** `setBugs(data.bugs)` — GET API returns `{ data: BugReport[] }`, not `{ bugs: BugReport[] }`. Caused silent empty state for elevated users too.
**Fix:** Extracted `BugsPageClient` to `src/components/bugs/bugs-page-client.tsx`. Replaced page with server wrapper calling `requirePermission("manage_settings")`. Fixed response key to `json.data`.
**Files:** `src/app/(dashboard)/bugs/page.tsx`, `src/components/bugs/bugs-page-client.tsx`

### FIXED — /territories: No server-side permission gate (CRITICAL)
**Before:** Pure `"use client"` page component, no `requirePermission`. Any logged-in sales rep could navigate to `/territories`, view all territory definitions, and make PATCH/DELETE API calls (API route enforcement not verified — assumed present but not confirmed).
**Fix:** Extracted `TerritoriesClient` to `src/components/territories/territories-client.tsx`. Replaced page with server wrapper calling `requirePermission("manage_territories")`.
**Files:** `src/app/(dashboard)/territories/page.tsx`, `src/components/territories/territories-client.tsx`

### FIXED — /payments: No top-level permission gate (HIGH)
**Before:** Only checked `session?.user` existence. Any logged-in user could load the full payments page including all client invoice data and pending commission breakdowns.
**Secondary:** FinancialOverviewSection used raw `role === "admin"` string check.
**Fix:** Added `await requirePermission("view_payments")` at page top. Replaced role string with `isElevated(role ?? "")`.
**Files:** `src/app/(dashboard)/payments/page.tsx`

### FIXED — /api/bug-reports GET: Admin-only instead of isElevated (MEDIUM)
**Before:** `user?.role !== "admin"` — blocked master-role users from retrieving bug reports despite them being elevated.
**Fix:** Replaced with `isElevated(user?.role ?? "")`.
**Files:** `src/app/api/bug-reports/route.ts`

### FIXED — /master isOwner: Stale hardcoded user ID (LOW)
**Before:** `[1, 2].includes(Number(user.id))` — id=2 (Alex Johnson, seed account) was permanently deleted February 22. Stale reference was harmless but incorrect.
**Fix:** `Number(user.id) === 1`
**Files:** `src/app/(dashboard)/master/page.tsx`

---

## §4 Open Items (Not Fixed This Sprint)

### /tasks — Session-only gate
`TasksPage` checks `session?.user` but applies no `requirePermission`. The client component (`TasksPageClient`) is expected to filter task visibility by `currentUserRole`. This is acceptable for now — tasks are a universal feature for all roles — but the API routes for task mutation should enforce role checks independently. **Recommend:** audit `/api/tasks` routes for mutation permission enforcement.

### /territories API routes — Not audited
The PATCH/DELETE endpoints at `/api/territories/[id]` were not read during this sprint. Given the page now requires `manage_territories`, a direct API call from a non-elevated client is the remaining attack surface. **Recommend:** verify `/api/territories` and `/api/territories/[id]` enforce `isElevated()` on all mutation methods.

### /live-sites — Semantic permission mismatch
`requirePermission("view_analytics")` is used for what is really a site monitoring feature. No functional security gap, but the permission label is misleading. **Recommend:** add `view_sites` permission key in a future permissions refactor, or move to `manage_clients`.

### /discovery — Not audited
Discovery page was not read during this sprint. **Recommend:** verify permission gate exists and is appropriate.

---

## §5 API Route Spot-Check

Routes confirmed to have auth guards:
- `POST /api/bug-reports` — any authenticated user (correct — reps should be able to submit bugs)
- `GET /api/bug-reports` — `isElevated()` required (fixed this sprint)
- `POST/DELETE /api/settings/branding` — admin-only (confirmed in Sprint 9)
- `GET/PATCH /api/admin/onboarding` — admin-only (confirmed in Sprint 9)
- `POST /api/leads/enrich-batch` — (not read this sprint; assumed guarded by session)
- `POST /api/bulk/leads` — (not read this sprint; assumed guarded by session)

**Recommended next step:** Run a full API route scan (`src/app/api/**`) focused on mutation endpoints (POST/PATCH/DELETE) that lack `isElevated()` checks. This is the remaining surface area not covered by page-level gates.

---

## §6 Nav Visibility vs. Route Protection

Page-level protection is server-enforced (good). Nav visibility is a separate concern — if nav links are visible to roles that can't access the route, users see 403 redirects on click. This was not audited for the nav component in this sprint.

**Recommend:** cross-reference `src/components/layout/nav.tsx` (or equivalent) against this route map to ensure non-elevated users don't see links to `/territories`, `/bugs`, `/payments`, `/audit`, `/permissions`, `/recurring-tasks`.
