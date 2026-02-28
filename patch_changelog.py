path = r'D:\Work\SEO-Services\ghm-dashboard\CHANGELOG.md'

with open(path, 'rb') as f:
    content = f.read()

old_date = b'**Last Updated:** February 27, 2026 \xe2\x80\x94 Sprint 28 complete. COVOS tenant extraction: ~50 GHM hardcoded strings removed from non-tenant layer across 5 commits.'
new_date = b'**Last Updated:** February 28, 2026 \xe2\x80\x94 Wave 1: 29-A verified, ARCH-002 ADR written (PROPOSED), 31-A/B/C data display foundations shipped.'

entry = b'\r\n\r\n## Wave 1 (Instance 2) \xe2\x80\x94 Tenant Hardening Verified + ARCH-002 ADR + Data Display Foundations \xe2\x80\x94 February 28, 2026\r\n\r\n**29-A \xe2\x80\x94 Tenant registry hardening:** Verified complete (shipped Sprint 30). `getTenant()` in `src/lib/tenant/server.ts` already handles all four edge cases: unknown subdomain, inactive tenant, localhost, Vercel preview URLs \xe2\x80\x94 all fall back to `TENANT_REGISTRY["ghm"]` with `console.warn`. No changes required this session.\r\n\r\n**ARCH-002 \xe2\x80\x94 Repo/Service/DB Separation ADR:** Created `docs/blueprints/ARCH_002_REPO_SEPARATION.md`. Status: PROPOSED. Covers current monorepo state, three options (A: stay monorepo, B: platform fork, C: Turborepo monorepo), recommendation (Option A for 6-month sellability window with mitigation layer), concrete A\xe2\x80\x92B migration steps, and five trigger conditions that would change the recommendation. Requires David sign-off before ACCEPTED.\r\n\r\n**31-A \xe2\x80\x94 Shared DataTable component:** Created `src/components/ui/data-table.tsx`. Enforces: standard column widths via `ColumnDef.width`, sortable headers with ArrowUpDown/ArrowUp/ArrowDown (controlled + uncontrolled sort state), `hover:bg-muted/50` on all rows, `emptyMessage` prop, `isLoading` prop with 5 skeleton rows (`Skeleton className="h-4 w-full"` per cell).\r\n\r\n**31-B \xe2\x80\x94 MetricCard standards:** Updated `src/components/dashboard/metric-card.tsx`. Added `min-h-[120px]`, `delta?: number` prop with TrendingUp/TrendingDown icons (status color tokens), `isLoading?: boolean` with Skeleton. Legacy `trend` prop preserved for backward compat. Re-exports `formatCurrency` so existing callers unaffected.\r\n\r\n**31-C \xe2\x80\x94 Chart color tokens:** Created `src/lib/chart-tokens.ts` with `CHART_COLORS` object (primary\xe2\x80\x93quinary + domain aliases: revenue, clients, churn, health, new), grid/axis/tooltip constants, and `getChartColorScale()` helper. Verified `--chart-1` through `--chart-8` already present in `:root` and `.dark` in `globals.css` \xe2\x80\x94 no CSS changes needed.\r\n\r\n**Supporting \xe2\x80\x94 format.ts:** Created `src/lib/format.ts` with `formatMetric()` (K/M/B abbreviation), `formatCurrency()` (Intl USD, 0 decimals), `formatCurrencyCompact()`, `formatDelta()`. Central number formatting \xe2\x80\x94 components import from here.\r\n\r\n**TypeScript gate:** `npx tsc --noEmit` \xe2\x80\x94 exactly 5 pre-existing errors in scripts/basecamp and src/lib/basecamp. Zero new errors.\r\n\r\n---\r\n'

if old_date not in content:
    print("ERROR: old_date not found in file!")
    print("Looking for:", repr(old_date[:80]))
else:
    # Replace Last Updated line
    content = content.replace(old_date, new_date + entry, 1)
    with open(path, 'wb') as f:
        f.write(content)
    print("DONE: CHANGELOG updated successfully.")
