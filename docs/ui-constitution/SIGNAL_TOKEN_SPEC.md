# COVOS Signal — Color Token Specification

**Palette:** Signal  
**Neutrals:** Slate  
**Dark mode:** Sidebar-stable (content inverts)  
**Chart tokens:** 8  
**Status:** LOCKED — ready for implementation  
**Sprint:** 23-B  

---

## Architecture

### Layer Model

**Layer 0 — COVOS Platform** (this document)  
Sidebar, neutral scale, status colors, chart palette, typography tokens. Always present. Never overridden by tenant branding. Defined in `globals.css` as CSS custom properties.

**Layer 1 — Tenant Brand**  
Primary action color, accent color, logo. Overrides Layer 0 selectively via `BrandThemeInjector`. Only touches `--brand-primary`, `--brand-secondary`, `--brand-accent` (and potentially `--brand-navy` in future).

**Layer 2 — Dark Mode**  
Both layers provide dark variants. Toggled via `class` strategy on `<html>`. Sidebar stays identical in both modes.

### Token Format

All tokens use HSL components (no `hsl()` wrapper) to match shadcn convention:
```
--token-name: H S% L%;
```
Consumed in Tailwind as `hsl(var(--token-name))`.

Brand injection tokens (`--brand-*`) remain hex strings for backward compatibility with BrandThemeInjector.

---

## Semantic Token Map — Light Mode (`:root`)

### Structural Surfaces

| Token | HSL | Hex | Role |
|---|---|---|---|
| `--background` | 210 40% 98.8% | #f8fafc | Page background (slate-50) |
| `--foreground` | 222.2 47.4% 11.2% | #0f172a | Default text (slate-900) |
| `--card` | 0 0% 100% | #ffffff | Card/panel surface |
| `--card-foreground` | 222.2 47.4% 11.2% | #0f172a | Card text (slate-900) |
| `--popover` | 0 0% 100% | #ffffff | Popover/dropdown surface |
| `--popover-foreground` | 222.2 47.4% 11.2% | #0f172a | Popover text |

### Interactive Colors

| Token | HSL | Hex | Role |
|---|---|---|---|
| `--primary` | 243.4 75.4% 58.6% | #4f46e5 | Primary actions — buttons, links, active states (indigo-600) |
| `--primary-foreground` | 226.5 100% 93.9% | #e0e7ff | Text on primary bg (indigo-100) |
| `--secondary` | 214.3 31.8% 91.4% | #e2e8f0 | Secondary surfaces (slate-200) |
| `--secondary-foreground` | 222.2 47.4% 11.2% | #0f172a | Text on secondary |
| `--accent` | 37.7 92.1% 50.2% | #d97706 | Accent — badges, highlights, callouts (amber-600) |
| `--accent-foreground` | 222.2 47.4% 11.2% | #0f172a | Text on accent bg |
| `--destructive` | 0 84.2% 60.2% | #ef4444 | Destructive actions (red-500) |
| `--destructive-foreground` | 210 40% 98% | #f8fafc | Text on destructive bg |
| `--ring` | 243.4 75.4% 58.6% | #4f46e5 | Focus ring (matches primary) |

### Borders & Inputs

| Token | HSL | Hex | Role |
|---|---|---|---|
| `--border` | 214.3 31.8% 91.4% | #e2e8f0 | Default borders (slate-200) |
| `--input` | 214.3 31.8% 91.4% | #e2e8f0 | Input borders (slate-200) |

### Muted

| Token | HSL | Hex | Role |
|---|---|---|---|
| `--muted` | 210 40% 96.1% | #f1f5f9 | Muted surfaces — subtle bg, zebra stripes (slate-100) |
| `--muted-foreground` | 215 16.3% 46.9% | #64748b | Muted text — secondary labels, timestamps (slate-500) |

### Sidebar

| Token | HSL | Hex | Role |
|---|---|---|---|
| `--sidebar` | 220 38% 9% | #0c1222 | Sidebar background (custom deep navy) |
| `--sidebar-foreground` | 213 17% 64.5% | #93a3b8 | Sidebar text |
| `--sidebar-muted` | 215 21% 37% | #4b5c72 | Sidebar muted text |
| `--sidebar-active` | 229.7 93.8% 81.8% | #a5b4fc | Sidebar active text (indigo-300) |
| `--sidebar-active-bg` | 229 93% 81% / 0.10 | rgba(165,180,252,0.10) | Sidebar active item bg |
| `--sidebar-border` | 220 30% 18% | #1e293b | Sidebar separator (slate-800) |

---

## Semantic Token Map — Dark Mode (`.dark`)

### Structural Surfaces

| Token | HSL | Hex | Role |
|---|---|---|---|
| `--background` | 222.2 47.4% 11.2% | #0f172a | Page background (slate-900) |
| `--foreground` | 210 40% 98.8% | #f8fafc | Default text (slate-50) |
| `--card` | 217.2 32.6% 17.5% | #1e293b | Card surface (slate-800) |
| `--card-foreground` | 210 40% 98.8% | #f8fafc | Card text |
| `--popover` | 217.2 32.6% 17.5% | #1e293b | Popover surface |
| `--popover-foreground` | 210 40% 98.8% | #f8fafc | Popover text |

### Interactive Colors

| Token | HSL | Hex | Role |
|---|---|---|---|
| `--primary` | 234.5 89.5% 73.9% | #818cf8 | Primary — lightened for dark bg contrast (indigo-400) |
| `--primary-foreground` | 243.5 47.1% 20.4% | #1e1b4b | Text on primary bg (indigo-950) |
| `--secondary` | 217.2 32.6% 17.5% | #1e293b | Secondary surfaces (slate-800) |
| `--secondary-foreground` | 210 40% 98.8% | #f8fafc | Text on secondary |
| `--accent` | 45.4 93.4% 47.5% | #eab308 | Accent — brightened for dark bg (yellow-500) |
| `--accent-foreground` | 222.2 47.4% 11.2% | #0f172a | Text on accent bg |
| `--destructive` | 0 72.2% 50.6% | #dc2626 | Destructive (red-600) |
| `--destructive-foreground` | 210 40% 98% | #f8fafc | Text on destructive bg |
| `--ring` | 234.5 89.5% 73.9% | #818cf8 | Focus ring (indigo-400) |

### Borders & Inputs

| Token | HSL | Hex | Role |
|---|---|---|---|
| `--border` | 217.2 32.6% 17.5% | #1e293b | Borders (slate-800) |
| `--input` | 215 25% 27% | #334155 | Input borders — slightly lighter for visibility (slate-700) |

### Muted

| Token | HSL | Hex | Role |
|---|---|---|---|
| `--muted` | 217.2 32.6% 17.5% | #1e293b | Muted surfaces (slate-800) |
| `--muted-foreground` | 215 16.3% 46.9% | #64748b | Muted text (slate-500) |

### Sidebar (IDENTICAL to light mode)

| Token | HSL | Hex | Role |
|---|---|---|---|
| `--sidebar` | 220 38% 9% | #0c1222 | Same as light — already dark |
| `--sidebar-foreground` | 213 17% 64.5% | #93a3b8 | Same |
| `--sidebar-muted` | 215 21% 37% | #4b5c72 | Same |
| `--sidebar-active` | 229.7 93.8% 81.8% | #a5b4fc | Same |
| `--sidebar-active-bg` | 229 93% 81% / 0.10 | rgba | Same |
| `--sidebar-border` | 220 30% 18% | #1e293b | Same |

---

## Status Token System

Universal across all tenants. Never overridden by brand injection.

### Light Mode

| Token | HSL | Hex | Role |
|---|---|---|---|
| `--status-success` | 142.1 76.2% 36.3% | #16a34a | Success text (green-600) |
| `--status-success-bg` | 138.5 76.5% 96.7% | #dcfce7 | Success background (green-100) |
| `--status-success-border` | 141.7 76.6% 73.1% | #bbf7d0 | Success border (green-200) |
| `--status-warning` | 45.4 93.4% 47.5% | #eab308 | Warning text (yellow-500) |
| `--status-warning-bg` | 54.9 96.7% 88% | #fef9c3 | Warning background (yellow-100) |
| `--status-warning-border` | 47.9 95.8% 76.1% | #fde68a | Warning border (yellow-200) |
| `--status-danger` | 0 72.2% 50.6% | #dc2626 | Danger text (red-600) |
| `--status-danger-bg` | 0 93.3% 94.1% | #fee2e2 | Danger background (red-100) |
| `--status-danger-border` | 0 95.7% 89.8% | #fecaca | Danger border (red-200) |
| `--status-info` | 217.2 91.2% 59.8% | #2563eb | Info text (blue-600) |
| `--status-info-bg` | 213.8 93.9% 87.8% | #dbeafe | Info background (blue-100) |
| `--status-info-border` | 211.7 96.4% 78.4% | #bfdbfe | Info border (blue-200) |
| `--status-neutral` | 215 16.3% 46.9% | #64748b | Neutral text (slate-500) |
| `--status-neutral-bg` | 210 40% 96.1% | #f1f5f9 | Neutral background (slate-100) |
| `--status-neutral-border` | 214.3 31.8% 91.4% | #e2e8f0 | Neutral border (slate-200) |

### Dark Mode

| Token | HSL | Hex | Role |
|---|---|---|---|
| `--status-success` | 142.1 69.2% 58.2% | #4ade80 | green-400 |
| `--status-success-bg` | 149.3 80.4% 10% | #052e16 | green-950 |
| `--status-success-border` | 148.6 64.4% 16.9% | #14532d | green-900 |
| `--status-warning` | 50.4 97.8% 63.5% | #facc15 | yellow-400 |
| `--status-warning-bg` | 31 81.1% 9.4% | #422006 | custom dark amber |
| `--status-warning-border` | 32.1 74.9% 25.5% | #713f12 | yellow-900 |
| `--status-danger` | 0 90.6% 70.8% | #f87171 | red-400 |
| `--status-danger-bg` | 0 74.7% 15.5% | #450a0a | red-950 |
| `--status-danger-border` | 0 62.5% 30.6% | #7f1d1d | red-900 |
| `--status-info` | 213.1 93.9% 67.8% | #60a5fa | blue-400 |
| `--status-info-bg` | 224 64.3% 21.6% | #172554 | blue-950 |
| `--status-info-border` | 216 44.4% 24.7% | #1e3a5f | custom dark blue |
| `--status-neutral` | 215 16.3% 46.9% | #64748b | slate-500 |
| `--status-neutral-bg` | 217.2 32.6% 17.5% | #1e293b | slate-800 |
| `--status-neutral-border` | 215 25% 27% | #334155 | slate-700 |

---

## Chart Token System

8 tokens, designed for maximum distinguishability including colorblind safety. First two derive from Signal's primary and accent. Remaining six chosen from well-separated hue families.

### Light Mode

| Token | HSL | Hex | Name | Role |
|---|---|---|---|---|
| `--chart-1` | 243.4 75.4% 58.6% | #4f46e5 | Indigo | Primary data series |
| `--chart-2` | 37.7 92.1% 50.2% | #d97706 | Amber | Secondary data series |
| `--chart-3` | 172.5 66% 50.4% | #2ba8a0 | Teal | Tertiary |
| `--chart-4` | 346.8 77.2% 49.8% | #e11d48 | Rose | Quaternary |
| `--chart-5` | 258.3 89.5% 66.3% | #8b5cf6 | Violet | Fifth |
| `--chart-6` | 188.7 94.5% 42.7% | #0891b2 | Cyan | Sixth |
| `--chart-7` | 84.8 85.2% 34.5% | #65a30d | Lime | Seventh |
| `--chart-8` | 24.6 95% 53.1% | #ea580c | Orange | Eighth |

### Dark Mode

| Token | HSL | Hex | Name |
|---|---|---|---|
| `--chart-1` | 234.5 89.5% 73.9% | #818cf8 | Indigo-400 |
| `--chart-2` | 45.4 96.7% 64.5% | #fbbf24 | Amber-400 |
| `--chart-3` | 170.6 76.9% 64.3% | #5eead4 | Teal-300 |
| `--chart-4` | 343.4 81.5% 68.6% | #fb7185 | Rose-400 |
| `--chart-5` | 255.1 91.7% 76.3% | #a78bfa | Violet-400 |
| `--chart-6` | 187.9 85.7% 53.3% | #22d3ee | Cyan-400 |
| `--chart-7` | 82.7 78% 55.5% | #a3e635 | Lime-400 |
| `--chart-8` | 20.5 90.2% 48.2% | #fb923c | Orange-400 |

---

## Brand Injection Surface (Layer 1)

BrandThemeInjector sets these at runtime. They are hex strings (not HSL) for backward compatibility.

| Token | Default (COVOS) | GHM Override | Role |
|---|---|---|---|
| `--brand-primary` | #4f46e5 | #4a77b5 | Tenant primary action color |
| `--brand-secondary` | #94a3b8 | #64748b | Tenant secondary color |
| `--brand-accent` | #d97706 | #e87d2f | Tenant accent / highlight |

**Note:** BrandThemeInjector defaults should be updated to match Signal palette (currently defaulting to `#2563eb` / `#64748b` / `#f59e0b`).

**Future (deferred):** `--brand-navy` for GHM's `#1e3a5f` PDF color.

---

## Tailwind Config Changes

Add chart tokens 6-8 and sidebar tokens to `tailwind.config.ts`:

```typescript
chart: {
  '1': 'hsl(var(--chart-1))',
  '2': 'hsl(var(--chart-2))',
  '3': 'hsl(var(--chart-3))',
  '4': 'hsl(var(--chart-4))',
  '5': 'hsl(var(--chart-5))',
  '6': 'hsl(var(--chart-6))',
  '7': 'hsl(var(--chart-7))',
  '8': 'hsl(var(--chart-8))',
},
sidebar: {
  DEFAULT: 'hsl(var(--sidebar))',
  foreground: 'hsl(var(--sidebar-foreground))',
  muted: 'hsl(var(--sidebar-muted))',
  active: 'hsl(var(--sidebar-active))',
  'active-bg': 'var(--sidebar-active-bg)',
  border: 'hsl(var(--sidebar-border))',
},
status: {
  success: 'hsl(var(--status-success))',
  'success-bg': 'hsl(var(--status-success-bg))',
  'success-border': 'hsl(var(--status-success-border))',
  warning: 'hsl(var(--status-warning))',
  'warning-bg': 'hsl(var(--status-warning-bg))',
  'warning-border': 'hsl(var(--status-warning-border))',
  danger: 'hsl(var(--status-danger))',
  'danger-bg': 'hsl(var(--status-danger-bg))',
  'danger-border': 'hsl(var(--status-danger-border))',
  info: 'hsl(var(--status-info))',
  'info-bg': 'hsl(var(--status-info-bg))',
  'info-border': 'hsl(var(--status-info-border))',
  neutral: 'hsl(var(--status-neutral))',
  'neutral-bg': 'hsl(var(--status-neutral-bg))',
  'neutral-border': 'hsl(var(--status-neutral-border))',
},
```

---

## Migration Impact

### What this replaces (from COLOR_AUDIT.md)

**Status colors (~400 hardcoded usages):** All 12 independent status systems collapse into 5 semantic tokens (success, warning, danger, info, neutral). Components will use `text-status-success` instead of ad-hoc `text-green-600` / `text-emerald-600` / `text-green-500`.

**Chart colors (44 hardcoded hex values):** All recharts components migrate from inline hex to `hsl(var(--chart-N))`.

**Structural tokens (shadcn defaults):** `:root` values shift from stock shadcn blue to Signal indigo/slate. No component changes needed — everything already consumes `bg-background`, `text-foreground`, etc.

**Sidebar tokens (new):** Sidebar components gain semantic tokens instead of hardcoded navy hex.

### What this does NOT change

- BrandThemeInjector architecture (still runtime hex injection)
- PDF page inline styles (library limitation — `@react-pdf/renderer` requires inline)
- shadcn component internals (they already consume the tokens)
- `--radius` value (stays `0.5rem`)

---

## Implementation Order

1. `globals.css` — Replace `:root` and `.dark` blocks with Signal token values
2. `tailwind.config.ts` — Add chart 6-8, sidebar, and status token mappings
3. `BrandThemeInjector.tsx` — Update DEFAULTS to Signal palette values
4. Status badge utility component — `<StatusBadge variant="success" />`
5. Chart color migration — recharts components consume `--chart-N`
6. Welcome page migration (10% of all hardcoded color usage)
7. Component-by-component migration (highest usage first)
