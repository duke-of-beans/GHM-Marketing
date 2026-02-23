# SPRINT 8 — HEALTH SCORE INTEGRATION
## Unified Health Score from All Domain Snapshots
*Dependency: Sprints 2, 3, 5, 6 (all domain snapshots exist)*

---

## GOAL

Replace the current competitive-scan-only health score with a unified score that weighs all operational domains: site health, rankings, GMB, PPC, citation health, payment status, and content freshness. The unified score becomes the single number that drives operational prioritization.

---

## EXISTING INFRASTRUCTURE

| Component | Location | Status |
|-----------|----------|--------|
| Current health score | src/lib/competitive-scan/health-score.ts | ✅ Weighted: Digital Assets 20%, Reviews 20%, Speed 15%, Momentum 25%, Competitive 20% |
| ClientProfile.healthScore | Schema | ✅ Updated by scan executor |
| SiteHealthSnapshot | Sprint 2 | ✅ Core Web Vitals + Lighthouse scores |
| GbpSnapshot | Sprint 3 | ✅ Views, clicks, reviews |
| RankSnapshot | Existing | ✅ Keyword positions |
| PpcSnapshot | Sprint 6 | ✅ Spend, conversions, CPC |
| CitationScan | Existing | ✅ NAP consistency score |
| InvoiceRecord | Existing | ✅ Payment status |
| ClientTask | Existing | ✅ Task completion rates |

---

## DELIVERABLES

### D1: Unified Health Score Calculator

**Location:** `src/lib/ops/unified-health-score.ts`

**Weighted components (all 0-100 normalized):**

| Component | Weight | Source | Calculation |
|-----------|--------|--------|-------------|
| Site Performance | 15% | SiteHealthSnapshot | Average of mobile + desktop Lighthouse scores |
| Rankings | 20% | RankSnapshot | % of tracked keywords in top 10 + momentum (improving vs declining) |
| GMB Engagement | 15% | GbpSnapshot | Composite of views trend, review score, click rate |
| Content Freshness | 10% | ClientTask + ClientContent | % of content tasks completed on time, recency of published content |
| Citation Health | 10% | CitationScan | NAP consistency healthScore from latest scan |
| PPC Efficiency | 10% | PpcSnapshot | Conversion rate vs benchmark, CPC trend |
| Payment Health | 10% | ClientProfile.paymentStatus | current=100, grace=70, overdue=30, paused=10, collections/terminated=0 |
| Competitive Position | 10% | CompetitiveScan | Existing competitive analysis from scan deltas |

**Graceful degradation:** If a client doesn't have a data source (e.g., no PPC), redistribute that weight proportionally across available components. Flag which components contributed to the score.

**Output interface:**
```typescript
interface UnifiedHealthScore {
  overall: number;        // 0-100 weighted composite
  components: {
    sitePerformance: { score: number; weight: number; available: boolean };
    rankings: { score: number; weight: number; available: boolean };
    gmbEngagement: { score: number; weight: number; available: boolean };
    contentFreshness: { score: number; weight: number; available: boolean };
    citationHealth: { score: number; weight: number; available: boolean };
    ppcEfficiency: { score: number; weight: number; available: boolean };
    paymentHealth: { score: number; weight: number; available: boolean };
    competitivePosition: { score: number; weight: number; available: boolean };
  };
  trend: "improving" | "stable" | "declining"; // vs 30-day average
  calculatedAt: Date;
}
```

### D2: Health Score Cron Update

**Modify:** Existing `daily-scans` cron or create `/api/cron/health-score/route.ts`
- Run daily for all active clients
- Calculate unified health score
- Update ClientProfile.healthScore
- Store component breakdown in new Json field on ClientProfile (or separate HealthScoreHistory table if trending needed)
- Feed to alert engine when score drops below thresholds

### D3: Health Score Dashboard

**Extend Health Monitor page (Sprint 7):**
- Replace simple health score display with component breakdown radar chart
- Show which components are dragging score down
- Historical score trend line
- "What's hurting this client" — top 3 weakest components with actionable suggestions

**Extend Client Detail page:**
- Health score breakdown card showing all 8 components
- Traffic light indicators (green/yellow/red per component)
- "Generate Action Plan" button → AI-powered prioritized task suggestions based on weakest components

### D4: AI-Powered Recommendations

**Location:** `src/lib/ops/health-recommendations.ts`

Using existing AI client + model router:
- Analyze health score components
- Generate prioritized action items targeting weakest areas
- Create ClientTask suggestions (not auto-created — presented for approval)
- Factor in existing tasks (don't suggest what's already in queue)

### D5: Default Alert Rules (seed)

- "Overall health score dropped below 50" → critical
- "Overall health score dropped below 70" → warning
- "Any component dropped below 30" → warning
- "Health score declined > 15 points in 30 days" → critical
- "Health score improved > 15 points in 30 days" → info (positive)

---

## MIGRATION NOTE

**Current health-score.ts** in competitive-scan/ should be preserved but deprecated in favor of unified score. The competitive scan executor should continue writing its local healthScore to CompetitiveScan records for audit trail, but ClientProfile.healthScore should be updated by the unified calculator.

**Transition:**
1. Deploy unified calculator alongside existing
2. Run both in parallel for 1 week
3. Compare outputs to validate
4. Switch ClientProfile.healthScore source to unified calculator
5. Keep competitive-scan/health-score.ts for CompetitiveScan record-level scoring

---

## FILE CREATION ORDER

1. `src/lib/ops/unified-health-score.ts` — Score calculator
2. `src/lib/ops/health-recommendations.ts` — AI recommendation engine
3. `/api/cron/health-score/route.ts` or modify daily-scans
4. `/api/clients/[id]/health-score/route.ts` — Per-client breakdown API
5. Extend Health Monitor page (radar chart, breakdown)
6. Extend Client Detail page (component breakdown card)
7. Seed alert rules
8. Wire cron to vercel.json

---

## TESTING CRITERIA

- [ ] Unified score calculates with all 8 components for fully-connected client
- [ ] Graceful degradation works (client without PPC still gets valid score)
- [ ] Weight redistribution is correct when components unavailable
- [ ] Trend calculation compares to 30-day average correctly
- [ ] Alert fires when score drops below threshold
- [ ] Radar chart renders component breakdown
- [ ] AI recommendations target weakest components
- [ ] Recommendations don't duplicate existing queued tasks
- [ ] Parallel running shows comparable results to existing health score
- [ ] ClientProfile.healthScore updated by unified calculator

---

## POST-SPRINT: OPERATIONS LAYER COMPLETE

After Sprint 8, the full operations layer is live:
- **Foundation:** Alert engine, notification system, data source monitoring
- **Task system:** Checklists, recurring tasks, alert-to-task linking
- **Domain monitoring:** Site health, rankings, GMB, PPC snapshots with automated alerting
- **Website governance:** Approval workflow on existing Website Studio
- **Reporting:** AI-powered narratives with auto-generation
- **Hub:** Centralized ops dashboard with alert feed, health monitor, notification center
- **Intelligence:** Unified health score with AI-powered recommendations

**Total new tables:** 11 (AlertEvent, AlertRule, NotificationEvent, TaskAlertLink, DataSourceStatus, TaskChecklistItem, TaskChecklistTemplate, RecurringTaskRule, SiteHealthSnapshot, GbpSnapshot, PpcSnapshot)
**Total column migrations:** 2 (ClientTask extensions, ClientProfile alertEvents relation)
**Existing tables untouched:** 40+
**Existing systems unmodified:** Lead pipeline, commission engine, Wave billing, discovery, onboarding, content versioning, bug reporting, team messaging, audit logging, enrichment cache, OAuth flows, SCRVNR/Voice
