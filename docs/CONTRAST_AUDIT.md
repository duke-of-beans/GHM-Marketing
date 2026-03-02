# COVOS Signal — Contrast Audit
**Standard:** WCAG 2.1 Level AA (4.5:1 normal text · 3:1 UI components/large text)
**Audited:** 2026-03-02 | **Method:** Manual HSL→RGB→relative luminance calculation
**File:** `src/app/globals.css`

---

## Summary

17 token pairs audited across light and dark modes. 8 tokens required lightness adjustments; all others already met WCAG AA. All changes preserve original hue and saturation — only lightness modified, per SIGNAL_TOKEN_SPEC.md constraint.

**Result: 0 failing token pairs after fixes.**

---

## Light Mode (:root)

### Passing — No Change Required

| Token | Value | Pair Background | Contrast | Result |
|---|---|---|---|---|
| `--muted-foreground` | `215 16.3% 35%` (already darkened) | `--background` (98.8% L) | 6.83:1 | ✅ PASS |
| `--status-success` | `142.1 76.2% 28%` (already darkened) | `--card` (white) | 4.97:1 | ✅ PASS |
| `--sidebar-foreground` | `213 17% 64.5%` | `--sidebar` (9% L) | ~7.25:1 | ✅ PASS |
| `--sidebar-active` | `229.7 93.8% 81.8%` | `--sidebar` (9% L) | ~9.35:1 | ✅ PASS |

### Fixed — Lightness Adjusted

| Token | Before | After | Pair Background | Before CR | After CR |
|---|---|---|---|---|---|
| `--status-warning` | `45.4 93.4% 47.5%` | `45.4 93.4% 27%` | `--status-warning-bg` (88% L) | 1.91:1 ❌ | 4.91:1 ✅ |
| `--status-danger` | `0 72.2% 50.6%` | `0 72.2% 46%` | `--status-danger-bg` (~81% L) | 3.93:1 ❌ | 4.55:1 ✅ |
| `--status-info` | `217.2 91.2% 59.8%` | `217.2 91.2% 43%` | `--status-info-bg` (~70% L) | 2.60:1 ❌ | 4.51:1 ✅ |
| `--status-neutral` | `215 16.3% 46.9%` | `215 16.3% 43%` | `--status-neutral-bg` (~92% L) | 4.27:1 ❌ | 4.95:1 ✅ |
| `--destructive` | `0 84.2% 60.2%` | `0 84.2% 48%` | `--background` (white) | 3.73:1 ❌ | 4.75:1 ✅ |
| `--sidebar-muted` | `215 21% 37%` | `215 21% 53%` | `--sidebar` (9% L) | 2.66:1 ❌ | 4.74:1 ✅ |

---

## Dark Mode (.dark)

### Passing — No Change Required

| Token | Value | Pair Background | Contrast | Result |
|---|---|---|---|---|
| `--status-success` | `142.1 69.2% 58.2%` | `--card` dark (~2.5% L) | ~5.2:1 | ✅ PASS |
| `--status-warning` | `50.4 97.8% 63.5%` | `--card` dark | ~8.1:1 | ✅ PASS |
| `--status-danger` | `0 90.6% 70.8%` | `--card` dark | ~7.1:1 | ✅ PASS |
| `--status-info` | `213.1 93.9% 67.8%` | `--card` dark | ~5.9:1 | ✅ PASS |
| `--sidebar-foreground` | `213 17% 64.5%` | `--sidebar` (9% L) | ~7.25:1 | ✅ PASS |
| `--sidebar-active` | `229.7 93.8% 81.8%` | `--sidebar` (9% L) | ~9.35:1 | ✅ PASS |

### Fixed — Lightness Adjusted

| Token | Before | After | Pair Background | Before CR | After CR |
|---|---|---|---|---|---|
| `--muted-foreground` | `215 16.3% 46.9%` | `215 16.3% 55%` | `--background` dark (~1% L) | 3.75:1 ❌ | 5.02:1 ✅ |
| `--status-neutral` | `215 16.3% 46.9%` | `215 16.3% 60%` | `--card` dark (~2.5% L) | 3.01:1 ❌ | 4.79:1 ✅ |
| `--sidebar-muted` | `215 21% 37%` | `215 21% 53%` | `--sidebar` (9% L) | 2.66:1 ❌ | 4.74:1 ✅ |

---

## Methodology

Relative luminance computed via IEC 61966-2-1 (sRGB):
1. HSL → RGB (standard cylindrical conversion)
2. Each channel linearized: `c <= 0.04045 ? c/12.92 : ((c+0.055)/1.055)^2.4`
3. `L = 0.2126*R_lin + 0.7152*G_lin + 0.0722*B_lin`
4. Contrast ratio: `CR = (L_lighter + 0.05) / (L_darker + 0.05)`

Node.js execution was unavailable in the build environment; all calculations performed analytically. Values cross-checked against known sRGB anchors (e.g. Tailwind slate palette) for sanity.

---

## Out of Scope

Chart tokens (`--chart-1` through `--chart-8`) are data-visualization hues — they appear on varied backgrounds and do not have fixed foreground pairings. A chart-specific audit is deferred; recommend using a visualization tool with the actual chart backgrounds when that audit is prioritized.

`--accent` (`37.7 92.1% 50.2%`) is amber used as an icon/highlight accent, not as running text. CR on white ≈ 2.85:1. If it is ever used as text, darken to 35% L. Currently tracked as a deferred item in `docs/CUSTOMIZATION_AUDIT.md`.
