# CPR-IE-001 — IE Phase Reclassification Audit

**Sprint:** COVOS-CPR-01
**Date:** 2026-03-14
**Author:** Claude (autonomous — COVOS-CPR-01 session)
**Status:** COMPLETE

---

## Summary Finding

**The entire Intelligence Engine stack contains zero AI calls.**

Every IE call site — scan orchestration, delta calculation, threshold evaluation, task generation, and all four pattern detectors (upsell, seasonal, cannibalization, cross-client) — operates exclusively on local, deterministic logic or database reads. No LLM invocations are present anywhere in `src/lib/intel/`.

This means:
- PERF-001 cache headers: `ai-client.ts` created as forward infrastructure. Zero current IE call sites to patch.
- PERF-002 Haiku routing: Zero Class 1 calls exist. Nothing to re-route.
- The IE's AI cost today: **$0.00.**

The IE's task descriptions and reasoning strings are produced by local template interpolation (string `.replace()` calls), not by language models.

---

## Classification Table

| # | Call site | File | Current model | CPR class | Rationale | Recommended action | Status |
|---|-----------|------|--------------|-----------|-----------|-------------------|--------|
| 1 | Sensor dispatch loop | `scan-orchestrator.ts:387` | N/A — no AI | **Class 0** | External HTTP sensor calls (PageSpeed, Ahrefs, SerpAPI, GSC, GA4, Outscraper). No AI involved. Hardened with exponential backoff + dead letter queue. | No change. Fully local. | ✅ Confirmed local |
| 2 | Index anomaly detection | `scan-orchestrator.ts:254–316` | N/A — no AI | **Class 0** | Rule-based threshold checks: `manualActions.length > 0`, index ratio drop ≥ 20%. Pure arithmetic. | No change. Fully local. | ✅ Confirmed local |
| 3 | Health score computation | `scan-orchestrator.ts:508` | N/A — no AI | **Class 0** | Delegates to `computeAndPersistHealthScore()` — numeric rollup from sensor metrics. | No change. Fully local. | ✅ Confirmed local |
| 4 | Delta + velocity calculation | `delta-engine.ts:calculateDeltas()` | N/A — no AI | **Class 0** | Mathematical delta over two snapshots. Velocity classified by 5% threshold rule. Alert generation is threshold comparison. | No change. Fully local. | ✅ Confirmed local |
| 5 | Task title/description generation | `task-generator.ts:generateTasks()` | N/A — no AI | **Class 0** | Template interpolation via local `interpolate()` + `buildContext()` from `task-templates.ts`. Priority adjustment is a local heuristic (`adjustPriority()`). | No change. Fully local. | ✅ Confirmed local |
| 6 | Upsell opportunity detection | `patterns/upsell.ts:detectUpsellOpportunities()` | N/A — no AI | **Class 0** | Rule-based evaluation of 4 `UPSELL_RULES` against competitor metrics (delta_pct, absolute_min, presence checks). Reasoning text is local `interpolateReasoning()` string template fill. | No change. Fully local. | ✅ Confirmed local |
| 7 | Upsell reasoning text | `patterns/upsell.ts:interpolateReasoning()` | N/A — no AI | **Class 0** | String `.replace()` on a static template string. No AI. | No change. Fully local. | ✅ Confirmed local |
| 8 | Seasonal pattern detection | `patterns/seasonal.ts:detectSeasonalPatterns()` | N/A — no AI | **Class 0** | Statistical spike detection: monthly bucket mean vs global mean, 40% threshold filter. Calendar math for lead time. Entire pipeline is deterministic. | No change. Fully local. | ✅ Confirmed local |
| 9 | Seasonal task description | `patterns/seasonal.ts:persistSeasonalTasks()` | N/A — no AI | **Class 0** | Task titles and descriptions built from pattern struct via string interpolation. No AI. | No change. Fully local. | ✅ Confirmed local |
| 10 | Keyword cannibalization detection | `patterns/cannibalization.ts:detectCannibalization()` | N/A — no AI | **Class 0** | Keyword overlap detection across asset snapshots via `Map` intersection. `recommendAction()` is a pure position-gap decision tree (both-top-10 → differentiate, gap>15 → deindex, else → consolidate). | No change. Fully local. | ✅ Confirmed local |
| 11 | Cannibalization recommendation rationale | `patterns/cannibalization.ts:recommendAction()` | N/A — no AI | **Class 0** | Hardcoded rationale strings keyed to 3 action types. No AI. | No change. Fully local. | ✅ Confirmed local |
| 12 | Cross-client insight synthesis | `patterns/cross-client.ts:generateCrossClientInsights()` | N/A — no AI | **Class 0** | DB aggregation + threshold comparisons (local pack loss ≥ LOCAL_PACK_DROP_THRESHOLD, failure rate ≥ 40%, competitor appearances ≥ 3). Headlines and detail strings are static templates. | No change. Fully local. | ✅ Confirmed local |
| 13 | Content approval rate analysis | `patterns/cross-client.ts:analyzeContentApproval()` | N/A — no AI | **Class 0** | DB count queries + keyword frequency count over cancellation descriptions. Pure local aggregation. | No change. Fully local. | ✅ Confirmed local |

---

## Search Evidence

Searches executed against `src/lib/intel/**` (all files, all subdirectories):

| Search pattern | Results |
|----------------|---------|
| `anthropic` | 0 matches |
| `claude\|model.*sonnet\|model.*haiku\|openai\|createMessage\|generateText` | 0 matches |

**Conclusion: The IE is AI-free. All logic is Class 0 — deterministic local computation.**

---

## PERF-001 Impact

`src/lib/intel/ai-client.ts` created as **forward infrastructure** — the canonical wrapper for any future IE AI calls. Its existence satisfies the acceptance criteria and establishes the pattern for model selection + cache headers before any IE AI calls are introduced.

No existing IE call sites were patched (none qualified).

---

## PERF-002 Impact

Zero Class 1 calls exist in the IE. No Haiku re-routing was performed. This is the correct outcome — the IE is entirely Class 0.

---

## Audit Methodology

Files audited:
- `src/lib/intel/scan-orchestrator.ts` (634 lines)
- `src/lib/intel/task-generator.ts` (253 lines)
- `src/lib/intel/delta-engine.ts` (198 lines)
- `src/lib/intel/patterns/upsell.ts` (403 lines)
- `src/lib/intel/patterns/seasonal.ts` (396 lines)
- `src/lib/intel/patterns/cannibalization.ts` (290 lines)
- `src/lib/intel/patterns/cross-client.ts` (466 lines)
- `src/lib/intel/task-templates.ts` (imports confirmed local)
- `src/lib/ai-security.ts` (sanitizer only — not a call site)

Additional files confirmed no AI: `health-score.ts`, `scan-hardening.ts`, `threshold-engine.ts`, `threshold-rules/*.ts`, `fleet/*.ts`, `sensors/*.ts`, `verticals/*.ts`, `notify-p1.ts`, `types.ts`
