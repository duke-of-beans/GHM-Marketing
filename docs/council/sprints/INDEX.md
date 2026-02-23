# OPERATIONS LAYER — SPRINT INDEX
## Reality-Adjusted Build Plan
*Last updated: 2026-02-23*

---

## AUTHORITATIVE DOCUMENTS

| Document | Purpose |
|----------|---------|
| `CODEBASE_REALITY_MAP.md` | Pre-build dependency audit — conflicts, existing infra, revised table plan |
| `FINAL_SYNTHESIS.md` | Original council output — architectural principles (still valid, implementation adjusted) |
| `sprints/SPRINT_0_FOUNDATION.md` | Schema + alert engine + notifications + data source monitoring |
| `sprints/SPRINT_1_EXECUTION_SPINE.md` | Checklists + recurring tasks + alert-to-task linking |
| `sprints/SPRINT_2_SITE_HEALTH.md` | PageSpeed snapshots + automated monitoring |
| `sprints/SPRINT_3_SEO_GMB.md` | GBP snapshots + rank tracking UI + AI post drafting |
| `sprints/SPRINT_4_CLUSTER_MANAGER.md` | Approval workflow on Website Studio |
| `sprints/SPRINT_5_REPORTS.md` | AI narratives + auto-generation via recurring tasks |
| `sprints/SPRINT_6_PPC.md` | Google Ads snapshots + performance monitoring |
| `sprints/SPRINT_7_HUB_REDESIGN.md` | Ops nav group + dashboard widgets + alert feed + health monitor |
| `sprints/SPRINT_8_HEALTH_SCORE.md` | Unified health score from all domain snapshots |

---

## SPRINT DEPENDENCY GRAPH

```
Sprint 0 (Foundation)
  ├── Sprint 1 (Execution Spine)
  │     └── Sprint 4 (Cluster Manager) — needs checklists
  │     └── Sprint 5 (Reports) — needs recurring tasks
  ├── Sprint 2 (Site Health) — needs alert engine
  ├── Sprint 3 (SEO + GMB) — needs alert engine
  ├── Sprint 6 (PPC) — needs alert engine
  └── Sprint 7 (Hub Redesign) — needs all backend (0-6)
        └── Sprint 8 (Health Score) — needs all domain snapshots (2,3,6)
```

**Critical path:** 0 → 1 → 7 → 8
**Parallel tracks (after Sprint 0):** Sprints 2, 3, 6 can run in parallel. Sprint 4 needs Sprint 1. Sprint 5 needs Sprints 1+2+3.

---

## SCOPE SUMMARY

| Metric | Count |
|--------|-------|
| New database tables | 11 |
| Column migrations | 2 |
| New API routes | ~30 |
| New pages | 4 (alerts, health, data-sources, recurring-tasks) |
| New dashboard widgets | 3 + notification bell |
| New cron jobs | 4 (recurring-tasks, site-health, gbp-snapshot, ppc-snapshot) |
| Modified existing files | ~15 |
| Existing tables touched | 0 (schema-breaking) |
| Existing systems modified | 0 (behavioral changes) |

---

## KEY PRINCIPLES (from CODEBASE_REALITY_MAP)

1. **Extend, don't replace.** ClientTask, status machine, competitive scan pipeline, report system — all get enhanced, none get rewritten.
2. **Wire, don't build.** Enrichment providers, OAuth, AI client, cost tracking — all exist and get wired into new snapshot/alert systems.
3. **Int IDs everywhere.** No String UUIDs. No tenantId columns.
4. **Read GlobalSettings.** Feature flags, notification preferences, API keys — don't create parallel config.
5. **Post-scan hook pattern.** Alert engine runs after existing pipelines complete, consuming their output.
6. **Dashboard grid extension.** New widgets added to existing MasterDashboardGrid, user layouts preserved.

---

## PRE-BUILD RITUAL (Every Sprint)

Before writing any code:
1. Re-read CODEBASE_REALITY_MAP.md §1 (conflicts) and §2 (existing infra)
2. Re-read the sprint's build plan
3. Verify sprint dependencies are met
4. Run `npx prisma validate` (if schema changes)
5. Run existing test suite (if any)
6. Check that no existing routes/components conflict with planned additions
