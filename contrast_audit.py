#!/usr/bin/env python3
"""WCAG AA Contrast Ratio Auditor — stdlib only, no external deps"""

import re
from typing import Tuple

def hex_to_rgb(hex_color: str) -> Tuple[int, int, int]:
    """Convert #rrggbb to (r, g, b) with values 0-255"""
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def hsl_to_rgb(h: float, s: float, l: float) -> Tuple[int, int, int]:
    """Convert HSL (h: 0-360, s: 0-100, l: 0-100) to RGB (0-255)"""
    s /= 100
    l /= 100
    
    c = (1 - abs(2 * l - 1)) * s
    hp = h / 60
    x = c * (1 - abs(hp % 2 - 1))
    
    if 0 <= hp < 1:
        r, g, b = c, x, 0
    elif 1 <= hp < 2:
        r, g, b = x, c, 0
    elif 2 <= hp < 3:
        r, g, b = 0, c, x
    elif 3 <= hp < 4:
        r, g, b = 0, x, c
    elif 4 <= hp < 5:
        r, g, b = x, 0, c
    else:
        r, g, b = c, 0, x
    
    m = l - c / 2
    r = int(round((r + m) * 255))
    g = int(round((g + m) * 255))
    b = int(round((b + m) * 255))
    
    return (r, g, b)

def rgb_to_luminance(r: int, g: int, b: int) -> float:
    """Compute relative luminance per WCAG spec (sRGB)"""
    def linearize(c: float) -> float:
        c = c / 255.0
        if c <= 0.04045:
            return c / 12.92
        else:
            return ((c + 0.055) / 1.055) ** 2.4
    
    r_lin = linearize(r)
    g_lin = linearize(g)
    b_lin = linearize(b)
    
    return 0.2126 * r_lin + 0.7152 * g_lin + 0.0722 * b_lin

def contrast_ratio(lum1: float, lum2: float) -> float:
    """WCAG contrast ratio: (L1 + 0.05) / (L2 + 0.05) where L1 >= L2"""
    l_light = max(lum1, lum2)
    l_dark = min(lum1, lum2)
    return (l_light + 0.05) / (l_dark + 0.05)

def rgb_to_hex(r: int, g: int, b: int) -> str:
    """Convert RGB to hex"""
    return f"#{r:02x}{g:02x}{b:02x}"

def hsl_string_to_values(s: str) -> Tuple[float, float, float]:
    """Parse 'h s% l%' to (h, s, l)"""
    parts = s.split()
    h = float(parts[0])
    s = float(parts[1].rstrip('%'))
    l = float(parts[2].rstrip('%'))
    return h, s, l

# Token definitions from globals.css
LIGHT_MODE = {
    'background': '210 40% 98.8%',
    'foreground': '222.2 47.4% 11.2%',
    'card': '0 0% 100%',
    'card-foreground': '222.2 47.4% 11.2%',
    'primary': '243.4 75.4% 58.6%',
    'primary-foreground': '226.5 100% 93.9%',
    'secondary': '214.3 31.8% 91.4%',
    'secondary-foreground': '222.2 47.4% 11.2%',
    'muted': '210 40% 96.1%',
    'muted-foreground': '215 16.3% 35%',  # ALREADY DARKENED in current CSS
    'accent': '37.7 92.1% 50.2%',
    'accent-foreground': '222.2 47.4% 11.2%',
    'destructive': '0 84.2% 60.2%',
    'destructive-foreground': '210 40% 98%',
    'sidebar': '220 38% 9%',
    'sidebar-foreground': '213 17% 64.5%',
    'sidebar-muted': '215 21% 37%',
    'sidebar-active': '229.7 93.8% 81.8%',
    'status-success': '142.1 76.2% 28%',  # ALREADY DARKENED
    'status-success-bg': '138.5 76.5% 96.7%',
    'status-warning': '45.4 93.4% 47.5%',
    'status-warning-bg': '54.9 96.7% 88%',
    'status-danger': '0 72.2% 50.6%',
    'status-danger-bg': '0 93.3% 94.1%',
    'status-info': '217.2 91.2% 59.8%',
    'status-info-bg': '213.8 93.9% 87.8%',
    'status-neutral': '215 16.3% 46.9%',
    'status-neutral-bg': '210 40% 96.1%',
}

DARK_MODE = {
    'background': '222.2 47.4% 11.2%',
    'foreground': '210 40% 98.8%',
    'card': '217.2 32.6% 17.5%',
    'card-foreground': '210 40% 98.8%',
    'primary': '234.5 89.5% 73.9%',
    'primary-foreground': '243.5 47.1% 20.4%',
    'secondary': '217.2 32.6% 17.5%',
    'secondary-foreground': '210 40% 98.8%',
    'muted': '217.2 32.6% 17.5%',
    'muted-foreground': '215 16.3% 46.9%',
    'accent': '38 92% 50%',
    'accent-foreground': '222.2 47.4% 11.2%',
    'destructive': '0 72.2% 50.6%',
    'destructive-foreground': '210 40% 98%',
    'sidebar': '220 38% 9%',
    'sidebar-foreground': '213 17% 64.5%',
    'sidebar-muted': '215 21% 37%',
    'sidebar-active': '229.7 93.8% 81.8%',
    'status-success': '142.1 69.2% 58.2%',
    'status-success-bg': '149.3 80.4% 10%',
    'status-warning': '50.4 97.8% 63.5%',
    'status-warning-bg': '31 81.1% 9.4%',
    'status-danger': '0 90.6% 70.8%',
    'status-danger-bg': '0 74.7% 15.5%',
    'status-info': '213.1 93.9% 67.8%',
    'status-info-bg': '224 64.3% 21.6%',
    'status-neutral': '215 16.3% 46.9%',
    'status-neutral-bg': '217.2 32.6% 17.5%',
}

def audit_pair(name: str, fg_hsl: str, bg_hsl: str, threshold: float, mode: str) -> dict:
    """Audit a foreground/background pair"""
    h, s, l = hsl_string_to_values(fg_hsl)
    r, g, b = hsl_to_rgb(h, s, l)
    fg_hex = rgb_to_hex(r, g, b)
    fg_lum = rgb_to_luminance(r, g, b)
    
    h, s, l = hsl_string_to_values(bg_hsl)
    r, g, b = hsl_to_rgb(h, s, l)
    bg_hex = rgb_to_hex(r, g, b)
    bg_lum = rgb_to_luminance(r, g, b)
    
    ratio = contrast_ratio(fg_lum, bg_lum)
    status = "PASS" if ratio >= threshold else "FAIL"
    
    return {
        'name': name,
        'mode': mode,
        'fg': fg_hex,
        'bg': bg_hex,
        'ratio': ratio,
        'threshold': threshold,
        'status': status,
        'fg_hsl': fg_hsl,
        'bg_hsl': bg_hsl,
    }

# Priority pairs to audit
AUDITS = [
    # Light mode — normal text threshold 4.5:1
    ('muted-foreground on background (light)', LIGHT_MODE['muted-foreground'], LIGHT_MODE['background'], 4.5, 'light'),
    ('muted-foreground on muted (light)', LIGHT_MODE['muted-foreground'], LIGHT_MODE['muted'], 4.5, 'light'),
    ('muted-foreground on card (light)', LIGHT_MODE['muted-foreground'], LIGHT_MODE['card'], 4.5, 'light'),
    ('sidebar-foreground on sidebar', LIGHT_MODE['sidebar-foreground'], LIGHT_MODE['sidebar'], 4.5, 'light'),
    ('sidebar-muted on sidebar', LIGHT_MODE['sidebar-muted'], LIGHT_MODE['sidebar'], 4.5, 'light'),
    ('sidebar-active on sidebar', LIGHT_MODE['sidebar-active'], LIGHT_MODE['sidebar'], 3.0, 'light'),
    ('status-success on status-success-bg', LIGHT_MODE['status-success'], LIGHT_MODE['status-success-bg'], 4.5, 'light'),
    ('status-warning on status-warning-bg', LIGHT_MODE['status-warning'], LIGHT_MODE['status-warning-bg'], 4.5, 'light'),
    ('status-danger on status-danger-bg', LIGHT_MODE['status-danger'], LIGHT_MODE['status-danger-bg'], 4.5, 'light'),
    ('status-info on status-info-bg', LIGHT_MODE['status-info'], LIGHT_MODE['status-info-bg'], 4.5, 'light'),
    ('status-neutral on status-neutral-bg', LIGHT_MODE['status-neutral'], LIGHT_MODE['status-neutral-bg'], 4.5, 'light'),
    ('destructive on destructive-foreground (light)', LIGHT_MODE['destructive'], LIGHT_MODE['destructive-foreground'], 4.5, 'light'),
    
    # Dark mode — normal text threshold 4.5:1
    ('muted-foreground on background (dark)', DARK_MODE['muted-foreground'], DARK_MODE['background'], 4.5, 'dark'),
    ('muted-foreground on card (dark)', DARK_MODE['muted-foreground'], DARK_MODE['card'], 4.5, 'dark'),
    ('sidebar-foreground on sidebar (dark)', DARK_MODE['sidebar-foreground'], DARK_MODE['sidebar'], 4.5, 'dark'),
    ('sidebar-muted on sidebar (dark)', DARK_MODE['sidebar-muted'], DARK_MODE['sidebar'], 4.5, 'dark'),
    ('sidebar-active on sidebar (dark)', DARK_MODE['sidebar-active'], DARK_MODE['sidebar'], 3.0, 'dark'),
    ('status-success on status-success-bg (dark)', DARK_MODE['status-success'], DARK_MODE['status-success-bg'], 4.5, 'dark'),
    ('status-warning on status-warning-bg (dark)', DARK_MODE['status-warning'], DARK_MODE['status-warning-bg'], 4.5, 'dark'),
    ('status-danger on status-danger-bg (dark)', DARK_MODE['status-danger'], DARK_MODE['status-danger-bg'], 4.5, 'dark'),
    ('status-info on status-info-bg (dark)', DARK_MODE['status-info'], DARK_MODE['status-info-bg'], 4.5, 'dark'),
    ('status-neutral on status-neutral-bg (dark)', DARK_MODE['status-neutral'], DARK_MODE['status-neutral-bg'], 4.5, 'dark'),
    ('destructive on destructive-foreground (dark)', DARK_MODE['destructive'], DARK_MODE['destructive-foreground'], 4.5, 'dark'),
]

# Run audits
results = []
for name, fg_hsl, bg_hsl, threshold, mode in AUDITS:
    result = audit_pair(name, fg_hsl, bg_hsl, threshold, mode)
    results.append(result)

# Print results
print("\n" + "="*100)
print("WCAG AA CONTRAST AUDIT — COVOS Signal Palette")
print("="*100 + "\n")

failing = []
passing = []

for r in results:
    status_icon = "✅" if r['status'] == "PASS" else "❌"
    print(f"{status_icon} {r['name']}")
    print(f"   {r['fg']} on {r['bg']} | Ratio: {r['ratio']:.2f}:1 | Threshold: {r['threshold']}:1 | {r['status']}")
    
    if r['status'] == "FAIL":
        failing.append(r)
    else:
        passing.append(r)

print("\n" + "="*100)
print(f"SUMMARY: {len(passing)} PASS, {len(failing)} FAIL")
print("="*100 + "\n")

if failing:
    print("FAILING PAIRS (require adjustment):\n")
    for r in failing:
        print(f"• {r['name']}")
        print(f"  Current: {r['fg']} ({r['ratio']:.2f}:1, need {r['threshold']}:1)")
        print(f"  HSL: {r['fg_hsl']} on {r['bg_hsl']}")
