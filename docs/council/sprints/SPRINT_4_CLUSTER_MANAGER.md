# SPRINT 4 — CLUSTER MANAGER
## Approval Workflow on Existing Website Studio
*Dependency: Sprint 1 (task checklists for build approval steps)*

---

## GOAL

Add operational approval workflow to existing WebProperty → BuildJob → ComposerPage pipeline. No new domain tables — this sprint adds governance to the existing Website Studio system.

---

## EXISTING INFRASTRUCTURE (Use, Don't Rebuild)

| Component | Location | Status |
|-----------|----------|--------|
| WebProperty | Schema | ✅ slug, tier, brandSegment, targetUrl, deployStatus, dnsVerified, sslActive |
| BuildJob | Schema | ✅ stage, assignedTo, scaffoldManifest, pageCount, pagesCleared, pagesApproved |
| ComposerPage | Schema | ✅ scrvnrStatus, reviewStatus, reviewNote |
| ScrvnrGateResult | Schema | ✅ gateOpen, gateStatus, pass scores |
| DnaCapture + Overrides | Schema | ✅ Token extraction + manual overrides |
| Website Studio page | /website-studio | ✅ Exists in nav |

---

## DELIVERABLES

### D1: Approval Workflow Engine

**Location:** `src/lib/ops/cluster-approval.ts`

**Workflow stages (mapped to existing BuildJob.stage):**
1. `scaffolded` — Initial site generated
2. `content_review` — SCRVNR gate results pending human review
3. `approved` — All pages approved, ready for deploy
4. `deployed` — Live and monitored

**Approval logic:**
- When all ComposerPage records for a BuildJob have reviewStatus = "approved" → auto-transition BuildJob to "approved"
- When BuildJob transitions to "approved" → create ClientTask for deployment checklist
- Apply TaskChecklistTemplate: "website_deployment" (DNS verification, SSL check, analytics setup, etc.)

### D2: Bulk Approval UI

Extend existing Website Studio page:
- "Pending Review" tab showing BuildJobs in content_review stage
- Batch approve/reject ComposerPages
- SCRVNR score display (pass1Score, pass2Score, gateStatus)
- Override controls (override with note when gateStatus = "FAIL" but content is acceptable)

### D3: Deployment Task Integration

When BuildJob reaches "approved":
- Auto-create ClientTask (category: "website_deployment", priority: P2)
- Apply "website_deployment" checklist template with items:
  - DNS records configured
  - SSL certificate active
  - Google Analytics installed
  - Search Console verified
  - Client approval received
  - Go-live notification sent

### D4: Staleness Monitoring

- Check WebProperty.stalenessThresholdDays (default 90)
- If lastDeployedAt + threshold < now → feed to alert engine
- "Website content may be stale — no deploy in {days} days" → warning

---

## FILE CREATION ORDER

1. `src/lib/ops/cluster-approval.ts` — Approval workflow logic
2. Extend Website Studio page with approval UI
3. Create "website_deployment" TaskChecklistTemplate seed
4. Wire staleness check into daily-scans cron or new cron
5. Seed staleness alert rule

---

## TESTING CRITERIA

- [x] Approving all pages auto-transitions BuildJob to "approved"
- [x] ClientTask auto-created on BuildJob approval with deployment checklist
- [x] Staleness alert fires when site hasn't been deployed in threshold days
- [x] SCRVNR override works with required note
- [x] Existing Website Studio functionality unbroken

**Status: ✅ COMPLETE — February 23, 2026**
