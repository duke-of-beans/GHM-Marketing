@echo off
cd /d "D:\Work\SEO-Services\ghm-dashboard"
"d:\Program Files\Git\cmd\git.exe" add -A
"d:\Program Files\Git\cmd\git.exe" status --short
"d:\Program Files\Git\cmd\git.exe" commit -m "feat: 29-A tenant hardening verified, docs: ARCH-002 ADR (PROPOSED), feat: 31-A/B/C data display foundations

- 29-A: getTenant() hardening confirmed complete (Sprint 30). No code changes needed.
- ARCH-002: docs/blueprints/ARCH_002_REPO_SEPARATION.md created. Status PROPOSED.
  Recommendation: Option A (stay monorepo) for 6-month COVOS sellability window.
- 31-A: src/components/ui/data-table.tsx created. Sortable headers, skeleton loading,
  empty state, hover:bg-muted/50, standard column width API via ColumnDef.width.
- 31-B: src/components/dashboard/metric-card.tsx updated. min-h-[120px], delta prop
  with TrendingUp/TrendingDown icons, isLoading skeleton, backward-compat trend prop.
- 31-C: src/lib/chart-tokens.ts created. CHART_COLORS, grid/axis/tooltip constants,
  getChartColorScale() helper. globals.css --chart-1--5 verified present.
- Supporting: src/lib/format.ts created. formatMetric, formatCurrency,
  formatCurrencyCompact, formatDelta. Central number formatting utility.
- TypeScript gate: 5 pre-existing errors only. Zero new errors."
"d:\Program Files\Git\cmd\git.exe" push
