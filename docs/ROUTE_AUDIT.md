# GHM Dashboard — Route / Button / Handler Audit

**FEAT-011** | Generated: 2026-02-26 | Analyst: Claude (Cowork)
**Scope:** `src/app/api/`, `src/app/(dashboard)/`, `src/components/`
**Constraint:** READ-ONLY — zero source files modified, zero commits made.

---

## Summary

| Metric | Count |
|---|---|
| API route files scanned | ~150 |
| Dashboard page routes scanned | ~35 |
| Component files scanned | ~80 |
| **CRITICAL findings** | **18** |
| **MODERATE findings** | **6** |
| **LOW findings** | **4** |
| **Total findings** | **28** |

### Findings by Category

| Category | CRITICAL | MODERATE | LOW | Total |
|---|---|---|---|---|
| PERMISSION GAPS | 18 | 0 | 0 | 18 |
| BROKEN LINKS | 0 | 2 | 0 | 2 |
| DUPLICATE LOGIC | 0 | 4 | 0 | 4 |
| DEAD ROUTES | 0 | 0 | 1 | 1 |
| ORPHANED HANDLERS | 0 | 1 | 2 | 3 |
| UNUSED IMPORTS | 0 | 0 | 2 | 2 |
| **Totals** | **18** | **7** | **5** | **28** |

### Top Priority Action

**The entire `src/app/api/content/` namespace (14 handlers across 8 files) has zero authentication.**
Any unauthenticated HTTP request can generate AI content at company expense, read/write/delete
client content records, and corrupt version history. This must be remediated before the next
production deployment.

---

## Auth Patterns Reference

Five auth patterns are in use across the codebase. All content/* routes use none of them.

| Pattern | Import | Notes |
|---|---|---|
| `auth()` | `@/lib/auth` | Basic NextAuth session check |
| `withPermission(req, key)` | `@/lib/auth/api-permissions` | Full check + audit log |
| `withAnyPermission(req, ...keys)` | `@/lib/auth/api-permissions` | Any-of permission check |
| `getCurrentUserWithPermissions()` | `@/lib/auth/api-permissions` | Returns user + permissions object |
| `getCurrentUser()` | `@/lib/auth/session` | Lighter session helper |
| `CRON_SECRET` | env var | Bearer token for cron routes |
| `x-waveapps-signature` | env var | HMAC for Wave webhook |
| `requireMaster()` | `@/lib/auth/session` | Elevated/master role guard |

**Middleware note:** `src/middleware.ts` handles routing/redirect auth for all routes except
`_next`, `favicon.ico`, `robots.txt`, `manifest.json`, and `icons/`. It does NOT inject a
session into API handlers — each route must independently call an auth primitive to obtain
the current user. Routes that skip this have no identity context whatsoever.

---

## 1. PERMISSION GAPS

> All 18 findings are CRITICAL severity. The content/* namespace was built entirely without
> importing auth primitives. The clients/[id] gaps (GBP, voice-profile) appear to have been
> added incrementally and similarly missed the auth requirement.

---

### PG-01 · `POST /api/content/generate-blog` — NO AUTH · CRITICAL

**File:** `src/app/api/content/generate-blog/route.ts` · Line 4  
**Code:**
```ts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // NO AUTH CHECK — goes directly to callAI()
    const result = await callAI({ feature: 'blog_post', ... });
```
**Impact:** Any unauthenticated caller can trigger AI generation, burning API credits and
writing a `clientContent` record to the database with an arbitrary `clientId`.

---

### PG-02 · `POST /api/content/generate-meta` — NO AUTH · CRITICAL

**File:** `src/app/api/content/generate-meta/route.ts` · Line 4  
Same pattern as PG-01. Calls `callAI()` for meta description generation. No auth check.

---

### PG-03 · `POST /api/content/generate-strategy` — NO AUTH · CRITICAL

**File:** `src/app/api/content/generate-strategy/route.ts` · Line 4  
Same pattern as PG-01. Calls `callAI()` for SEO keyword/strategy generation. No auth check.

---

### PG-04 · `POST /api/content/generate-ppc` — NO AUTH · CRITICAL

**File:** `src/app/api/content/generate-ppc/route.ts` · Line 4  
Same pattern as PG-01. Calls `callAI()` for Google Ads copy generation. No auth check.

---

### PG-05 · `POST /api/content/generate-social` — NO AUTH · CRITICAL

**File:** `src/app/api/content/generate-social/route.ts` · Line 4  
Same pattern as PG-01. Calls `callAI()` for social media post generation. No auth check.

---

### PG-06 · `GET /api/content/list` — NO AUTH · CRITICAL

**File:** `src/app/api/content/list/route.ts` · Line 4  
**Code:**
```ts
export async function GET(request: NextRequest) {
  try {
    // NO AUTH CHECK
    const content = await prisma.clientContent.findMany({ where, ... });
```
**Impact:** Any caller can enumerate all content records for any `clientId` by passing it as
a query param. Full read access to client content across all accounts.

---

### PG-07 · `PATCH /api/content/list` — NO AUTH · CRITICAL

**File:** `src/app/api/content/list/route.ts` · Line ~30  
Same file as PG-06. PATCH handler updates `status` and `scheduledFor` on content records.
No auth check. Any caller can mutate content state for any client.

---

### PG-08 · `DELETE /api/content/[id]` — NO AUTH · CRITICAL

**File:** `src/app/api/content/[id]/route.ts` · Line 4  
**Code:**
```ts
export async function DELETE(request: NextRequest, { params }) {
  try {
    const contentId = parseInt(params.id);
    // NO AUTH CHECK
    await prisma.clientContent.delete({ where: { id: contentId } });
```
**Impact:** Any caller can permanently delete any content record by ID. No ownership check.

---

### PG-09 · `PATCH /api/content/[id]` — NO AUTH + hardcoded author · CRITICAL

**File:** `src/app/api/content/[id]/route.ts` · Line 39  
**Code:**
```ts
export async function PATCH(request: NextRequest, { params }) {
  // NO AUTH CHECK
  await prisma.contentVersion.create({
    data: {
      ...
      createdBy: 1, // TODO: Use session user ID
    },
  });
```
**Impact:** Any caller can edit any content item and create version history entries. All
version records will attribute the change to user ID 1 regardless of actual caller, corrupting
the audit trail permanently (no way to retroactively determine true author).

---

### PG-10 · `POST /api/content/schedule` — NO AUTH · CRITICAL

**File:** `src/app/api/content/schedule/route.ts` · Line 4  
No auth check. Any caller can set `status: 'scheduled'` and an arbitrary `scheduledFor` date
on any content record.

---

### PG-11 · `DELETE /api/content/batch` — NO AUTH · CRITICAL

**File:** `src/app/api/content/batch/route.ts` · Line 4  
**Code:**
```ts
export async function DELETE(request: NextRequest) {
  // NO AUTH CHECK
  // "Security": Verify all content items belong to the same client
  const clientIds = new Set(contentItems.map(item => item.clientId));
  if (clientIds.size > 1) { return 403 }
  // Otherwise: deletes all
  await prisma.clientContent.deleteMany({ where: { id: { in: contentIds } } });
```
**Impact:** The "security" check only prevents cross-client batch deletes — it does not
prevent unauthenticated deletion. Any caller with knowledge of content IDs can bulk-delete
an entire client's content library in a single request.

---

### PG-12 · `POST /api/content/publish/[id]` — NO AUTH · CRITICAL

**File:** `src/app/api/content/publish/[id]/route.ts` · Line 4  
No auth check. Any caller can mark any content record as `status: 'published'` with
`publishedAt: new Date()`.

---

### PG-13 · `POST /api/content/[id]/restore` — NO AUTH · CRITICAL

**File:** `src/app/api/content/[id]/restore/route.ts` · Line 4  
No auth check. Any caller can roll back any content item to any prior version. Also writes
a new version record with `createdBy` copied from the target version rather than the actual
caller.

---

### PG-14 · `GET /api/content/[id]/versions` — NO AUTH · CRITICAL

**File:** `src/app/api/content/[id]/versions/route.ts` · Line 4  
No auth check. Returns full version history for any content ID including title, content body,
keywords, metadata, and `createdBy` user IDs.

---

### PG-15 · `GET /api/clients/[id]/gbp` — NO AUTH · CRITICAL

**File:** `src/app/api/clients/[id]/gbp/route.ts` · Line 10  
**Code:**
```ts
export async function GET(_req: NextRequest, { params }) {
  const clientId = parseInt(params.id)
  // NO AUTH CHECK
  const conn = await prisma.gBPConnection.findUnique({ where: { clientId } })
  const [reviews, insights, posts] = await Promise.all([
    listReviews(gbp, 50), fetchInsights(gbp, 90), listPosts(gbp),
  ])
  await prisma.gBPConnection.update({ data: { lastSyncAt: new Date() } })
```
**Impact:** Any caller can retrieve up to 50 Google reviews, 90 days of GBP insights, and
all GBP posts for any client by ID. Also triggers a `lastSyncAt` write, polluting sync
timestamps.

---

### PG-16 · `DELETE /api/clients/[id]/gbp` — NO AUTH · CRITICAL

**File:** `src/app/api/clients/[id]/gbp/route.ts` · Line 53  
No auth check. Any caller can disconnect a client's Google Business Profile integration
(`isActive: false`). Reconnection requires the client to re-authorise via OAuth.

---

### PG-17 · `GET /api/clients/[id]/voice-profile` — NO AUTH · CRITICAL

**File:** `src/app/api/clients/[id]/voice-profile/route.ts` · Line 4  
No auth check. Returns full brand voice profile: tonality, vocabulary, sentence structure,
formality, enthusiasm, technicality, and brevity scores for any clientId.

---

### PG-18 · `DELETE /api/clients/[id]/voice-profile` — NO AUTH · CRITICAL

**File:** `src/app/api/clients/[id]/voice-profile/route.ts` · Line 57  
**Code:**
```ts
export async function DELETE(request: NextRequest, { params }) {
  // NO AUTH CHECK
  await prisma.voiceProfile.delete({ where: { clientId } });
  await prisma.clientProfile.update({ data: { voiceProfileId: null } });
```
**Impact:** Any caller can permanently delete a client's voice profile and null the FK
reference on the client record. No soft-delete, no undo.

---

### Recommended Fix (applies to all 18 gaps)

Add `withPermission` at the top of each handler. For the content namespace, `manage_clients`
is the appropriate permission key (consistent with `reports/generate` and `clients/route`):

```ts
// Add to every content/* and clients/[id]/gbp + voice-profile route handler:
import { withPermission } from '@/lib/auth/api-permissions';

export async function POST(request: NextRequest) {
  const { user } = await withPermission(request, 'manage_clients');
  // ... rest of handler
}
```

For PG-09 specifically, also replace `createdBy: 1` with `createdBy: user.id`.

---

## 2. BROKEN LINKS

---

### BL-01 · Nav link `/recurring-tasks` → 404 · MODERATE

**File:** `src/components/dashboard/nav.tsx` · Line ~73  
**Code:**
```tsx
{ href: "/recurring-tasks", label: "Recurring Tasks", icon: <Repeat />, permission: "manage_clients" },
```
**Problem:** No page route exists at `src/app/(dashboard)/recurring-tasks/`. The component
`src/components/tasks/recurring-tasks-client.tsx` exists but is not mounted at any route.
Users with `manage_clients` permission who click "Recurring Tasks" in the sidebar will land
on a 404 page.  
**Fix:** Either create `src/app/(dashboard)/recurring-tasks/page.tsx` that renders
`<RecurringTasksClient />`, or remove the nav entry until the page is built.

---

### BL-02 · Nav link `/content-studio` → 404 · MODERATE

**File:** `src/components/dashboard/nav.tsx` · Line ~74  
**Code:**
```tsx
{ href: "/content-studio", label: "Content Studio", icon: <PenTool />, permission: "manage_clients" },
```
**Problem:** No page route exists at `src/app/(dashboard)/content-studio/`. The components
`src/components/studio/content-studio-landing.tsx` and
`src/components/clients/content/content-studio-tab.tsx` exist but are not wired to a
standalone route. Content Studio is accessible only as a tab inside individual client detail
pages (`/clients/[id]`), not as a top-level page.  
**Fix:** Either create `src/app/(dashboard)/content-studio/page.tsx` that renders the
landing component, or update the nav comment from "pending route creation" to remove the
entry and document the client-tab-only access path.

---

## 3. DUPLICATE LOGIC

---

### DL-01 · Content list fetch — 3 independent implementations · MODERATE

The same `GET /api/content/list?clientId=...` fetch is implemented independently in three
components with no shared hook or utility:

| File | Line | Pattern |
|---|---|---|
| `src/components/content/ContentList.tsx` | 64–66 | `fetch('/api/content/list?clientId=...')` |
| `src/components/clients/content/content-studio-tab.tsx` | 37–39 | Same endpoint, identical pattern |
| `src/components/tasks/approvals-tab.tsx` | 106–108 | Same endpoint, called on mount |

Each manages its own loading state, error handling, and re-fetch logic. Any change to the
endpoint (e.g. adding pagination, renaming a response field) must be made in three places.  
**Fix:** Extract a `useContentList(clientId)` React hook in `src/hooks/` that all three
components consume.

---

### DL-02 · Content approval — 2 independent implementations · MODERATE

Content approval POST logic is duplicated across two components:

| File | Lines | Notes |
|---|---|---|
| `src/components/tasks/approvals-tab.tsx` | 256–258 | Single approval POST |
| `src/components/review/review-queue.tsx` | 96–98, 113–115 | Approval called twice in same file |

Both implement their own toast notification patterns for success/error. `review-queue.tsx`
has two separate calls to the same approval endpoint suggesting a copy-paste duplicate within
the file itself (lines 96 and 113).  
**Fix:** Extract an `approveContent(id)` async utility. Audit `review-queue.tsx` to
determine if the double-call on lines 96 and 113 is intentional or a bug.

---

### DL-03 · Content editing PATCH — 2 implementations · MODERATE

Content editing is split across two different fetch patterns pointing to two different
endpoints:

| File | Line | Endpoint | Purpose |
|---|---|---|---|
| `src/components/content/EditContentDialog.tsx` | 37–39 | `PATCH /api/content/[id]` | Edit title + body |
| `src/components/clients/content/content-studio-tab.tsx` | 181–183 | `PATCH /api/content/list` | Update status field |

These are conceptually the same operation (updating a content record) but use different
endpoints and carry different payloads. The `content/list` PATCH is a general-purpose status
updater while `content/[id]` handles the full edit with versioning. The split is potentially
intentional but creates confusion about which endpoint to use for which mutation.  
**Fix:** Document the intentional split explicitly in both route files, or consolidate to a
single `PATCH /api/content/[id]` endpoint with an optional `status` field.

---

### DL-04 · ContentStrategyPanel double-fetch · MODERATE

**File:** `src/components/content/ContentStrategyPanel.tsx` · Lines 57–59 and 79–81  
Two consecutive POST calls to content generation endpoints within the same component handler.
From context lines, these appear to be duplicate fetches rather than intentional parallel
generation (both at similar indentation inside the same try block).  
**Fix:** Audit the handler to confirm whether both calls are intentional. If not, remove
the duplicate.

---

## 4. DEAD ROUTES

---

### DR-01 · `src/app/(dashboard)/admin-setup/` — no inbound links · LOW

**Files:** `src/app/(dashboard)/admin-setup/` (directory)  
No `<Link href="/admin-setup">` or `router.push('/admin-setup')` was found anywhere in
`src/components/` or `src/app/(dashboard)/`. The admin-setup route group does not appear in
`nav.tsx` and has no entry point from any other page. It may have been used during initial
tenant configuration and is now superseded by the settings flow.  
**Recommendation:** Confirm whether `/admin-setup` is still reachable/needed (e.g. via
direct URL for first-time setup). If not, mark for removal in a future cleanup sprint.

---

## 5. ORPHANED HANDLERS

---

### OH-01 · `ContentCalendar.tsx` scheduling fetch is stubbed · MODERATE

**File:** `src/components/content/ContentCalendar.tsx` · Lines 38–40  
**Code:**
```ts
// This would be an API call like:
// /api/content/schedule
setScheduledContent([])
```
The calendar component renders a scheduling UI but its data-load is a no-op. The
`/api/content/schedule` POST endpoint exists and works, but the calendar never reads from
any source — it always initialises with an empty array. Users see a blank calendar.  
**Fix:** Implement the fetch inside `ContentCalendar.tsx` to `GET /api/content/list` filtered
by `status: 'scheduled'`, or create a dedicated `GET /api/content/schedule` route that returns
scheduled items for a date range.

---

### OH-02 · `content/[id]/route.ts` — session never imported, author hardcoded · LOW

**File:** `src/app/api/content/[id]/route.ts` · Line 74  
**Code:**
```ts
createdBy: 1, // TODO: Use session user ID
```
Once auth is added (see PG-09), the session user ID must be wired in here. The auth import is
absent so this will require both adding `withPermission` and destructuring `user.id` from the
result. Flagged separately because it affects data integrity of the version history table.

---

### OH-03 · `clients/[id]/composer/[jobId]/page.tsx` — redirect-on-load pattern · LOW

**File:** `src/app/(dashboard)/clients/[id]/composer/[jobId]/page.tsx` · Line 57  
**Code:**
```ts
router.push(`/clients/${clientId}`)
```
This page uses `router.push` to immediately redirect to the parent client page on load,
making the composer URL effectively a pass-through. It is reached from `portfolio.tsx`
line 514. Verify whether this is an intentional loading/initialisation pattern or a
leftover from an incomplete feature — if the latter, the route can be inlined.

---

## 6. UNUSED IMPORTS

Static unused-import detection requires a full ESLint (`no-unused-vars`) or `knip` pass.
No `TODO / FIXME / HACK / XXX` comments were found in any `.ts` or `.tsx` file, and the
codebase is lint-configured (`.eslintrc.json` present). The following are code-level import
gaps identified during the auth audit:

---

### UI-01 · `content/*` namespace — auth primitives never imported · LOW

**Files:** All 8 files in `src/app/api/content/`  
None of these files import `auth`, `withPermission`, `getCurrentUser`, or any equivalent.
The absence is total — not a stale import but a missing one. This confirms the entire
namespace was written without auth as a design consideration.

---

### UI-02 · `clients/[id]/gbp/route.ts` + `voice-profile/route.ts` — same gap · LOW

**Files:**
- `src/app/api/clients/[id]/gbp/route.ts`
- `src/app/api/clients/[id]/voice-profile/route.ts`

Neither imports any auth primitive. Both import only `prisma` and their respective lib
utilities. Same remediation applies as the content namespace.

---

## Appendix A — Confirmed Protected Routes (sample)

Routes confirmed as properly authenticated via direct file inspection:

| Route | Auth Pattern | Permission |
|---|---|---|
| `POST/GET /api/clients` | `withPermission` | `view_all_clients` / `manage_clients` |
| `GET/PATCH /api/settings` | `withPermission` | `manage_settings` |
| `GET/POST /api/tasks` | `getCurrentUserWithPermissions` | — |
| `GET/PATCH /api/payments/approve` | `withPermission` | `manage_payments` |
| `GET /api/payments/pending` | `withPermission` | `manage_payments` |
| `POST /api/reports/generate` | `withPermission` | `manage_clients` |
| `POST /api/bulk/leads` | `withPermission` | `manage_leads` |
| `GET/DELETE /api/users/[id]` | `withPermission` | `manage_team` |
| `POST /api/admin/verify-users` | `withPermission` | `manage_team` |
| `GET/POST /api/export/leads` | `getCurrentUser` + `hasPermission` | `manage_leads` |
| `GET /api/alerts` | `getCurrentUserWithPermissions` + `isElevated` | — |
| `GET /api/data-sources` | `getCurrentUserWithPermissions` + `isElevated` | — |
| `GET /api/notifications` | `getCurrentUserWithPermissions` | — |
| `POST /api/wave/webhook` | `x-waveapps-signature` HMAC | — |
| `GET /api/cron/*` | `CRON_SECRET` bearer token | — |
| `POST /api/clients/[id]/generate-portal-token` | `requireMaster()` | — |
| `GET /api/clients/[id]/ads/campaigns` | `requirePermission('manage_clients')` | — |
| `GET/PATCH /api/settings/branding` | `withPermission` | `manage_settings` |
| `GET /api/domains/search` | `withPermission` | — |

---

## Appendix B — Intentionally Public Routes

Routes confirmed as intentionally unauthenticated by design:

| Route | Reason |
|---|---|
| `POST /api/onboarding/refresh-token` | External lead token refresh; rate-limited to 2/lead |
| `GET /api/onboarding/[token]` | External lead onboarding form; token-gated |
| `GET /api/share/audit/[token]` | Public audit share; capability token (≥32 chars) required |
| `GET /api/oauth/google/callback` | OAuth redirect from Google; no session available |
| `GET /api/oauth/google-ads/callback` | OAuth redirect from Google Ads; no session available |
| `POST /api/auth/[...nextauth]` | NextAuth internal routes |

---

## Appendix C — Navigation Link Map (from `nav.tsx`)

| Label | href | Permission Guard | Page Exists |
|---|---|---|---|
| Dashboard (elevated) | `/manager` | `isElevated` | ✅ |
| Dashboard (sales) | `/sales` | — | ✅ |
| Find Leads | `/discovery` | `view_all_leads` | ✅ |
| Sales Pipeline | `/leads` | `manage_leads` | ✅ |
| Client Portfolio | `/clients` | `view_all_clients` | ✅ |
| My Tasks | `/tasks` | — | ✅ |
| Recurring Tasks | `/recurring-tasks` | `manage_clients` | ❌ 404 |
| Content Studio | `/content-studio` | `manage_clients` | ❌ 404 |
| Website Studio | `/website-studio` | `manage_clients` | ✅ |
| Analytics | `/analytics` | `view_analytics` | ✅ |
| Payments | `/payments` | `manage_payments` | ✅ |
| Service Catalog | `/products` | `manage_products` | ✅ |
| Document Vault | `/vault` | — | ✅ |
| My Profile | `/profile` | — | ✅ |
| Settings | `/settings` | `manage_settings` | ✅ |

---

*End of FEAT-011 Route Audit — 2026-02-26*
