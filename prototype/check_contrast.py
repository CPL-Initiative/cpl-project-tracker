#!/usr/bin/env python3
"""First Light theme — WCAG 2.2 AA contrast verifier + token derivation.

Derives the final accent hex values for the First Light prototype
(prototype/first_light_theme_v1.html) by nudging each brand hue toward
black (light-background text grades) or white (on-dark grades) until the
WCAG contrast target passes, then prints the token spec table that is
embedded in the mock. The mock's :root values MUST match this output —
the mock is the spec.

Backgrounds are checked against documented worst cases, not best cases:
  - PAPER          #F4F2ED  the page background
  - GLASS_WORST    white @ .78 over (10% black art ghost over paper) —
                   the darkest composite a glass card can sit on
  - DARK_WORST     #15151D @ .92 over paper — the lightest composite the
                   dark masthead scrim can produce over a bright painting

Targets: 4.5:1 text · 3:1 non-text UI (WCAG 1.4.3 / 1.4.11).
Run: python3 prototype/check_contrast.py   (exit 1 if anything fails)
"""

def h2rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))

def rgb2h(c):
    return "#%02X%02X%02X" % tuple(round(x) for x in c)

def lin(v):
    v /= 255.0
    return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4

def lum(c):
    r, g, b = (lin(x) for x in c)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b

def ratio(a, b):
    la, lb = lum(a), lum(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)

def mix(c1, c2, t):
    """t=0 -> c1, t=1 -> c2 (simple sRGB lerp — fine at these deltas)."""
    return tuple(c1[i] + (c2[i] - c1[i]) * t for i in range(3))

def derive(start_hex, bg, target, toward):
    """Nudge start color toward black/white until ratio(bg) >= target."""
    start = h2rgb(start_hex)
    end = (0, 0, 0) if toward == "black" else (255, 255, 255)
    for step in range(0, 101):
        c = mix(start, end, step / 100.0)
        if ratio(c, bg) >= target:
            return rgb2h(c), ratio(c, bg)
    return rgb2h(end), ratio(end, bg)

# ── Worst-case backgrounds ──────────────────────────────────────────────
PAPER = h2rgb("#F4F2ED")
BLACK, WHITE = (0, 0, 0), (255, 255, 255)
ART_OVER_PAPER = mix(PAPER, BLACK, 0.10)            # 10% grayscale ghost
GLASS_WORST = mix(ART_OVER_PAPER, WHITE, 0.78)      # glass card composite
DARK_WORST = mix(PAPER, h2rgb("#15151D"), 0.92)     # masthead scrim composite

# ── Brand hues (starting points) ────────────────────────────────────────
BRAND = {
    "crimson": "#C8102E",
    "cobalt":  "#0047AB",
    "hunter":  "#355E3B",
    "violet":  "#6D28D9",
}
MUSTARD_FILL = "#E3B341"   # chip fill only — NEVER text on light surfaces
MUSTARD_SEED = "#9A7400"   # seed for the border/icon (3:1) grade

GRAYS = {
    "--text-strong (ink)": "#1C1C1A",
    "--text-body":         "#3A3A36",
    "--text-muted":        "#5C5C55",
}

rows, failures = [], []

def add(name, hexv, role, bg, bgname, target):
    r = ratio(h2rgb(hexv), bg)
    ok = r >= target
    if not ok:
        failures.append(name)
    rows.append((name, hexv, role, f"{r:.2f}:1 vs {bgname}", f"≥{target}", "PASS" if ok else "FAIL"))

# Gray text on both light worst cases
for name, hexv in GRAYS.items():
    add(name, hexv, "text", PAPER, "paper", 4.5)
    add(name, hexv, "text", GLASS_WORST, "glass-worst", 4.5)

# Accent text grades on light (derived), graphic grades, and on-dark grades
print("── Derived accent tokens ──────────────────────────────────────────")
for name, seed in BRAND.items():
    text_hex, _ = derive(seed, GLASS_WORST, 4.5, "black")   # glass-worst is the harder light bg
    add(f"--{name} (text/icon grade)", text_hex, "text", PAPER, "paper", 4.5)
    add(f"--{name} (text/icon grade)", text_hex, "text", GLASS_WORST, "glass-worst", 4.5)
    # 5.5 target (not 4.5) so on-dark tints carry luminosity headroom —
    # minimum-pass tints read dusty on the masthead scrim
    dark_hex, _ = derive(seed, DARK_WORST, 5.5, "white")
    add(f"--{name}-on-dark", dark_hex, "text", DARK_WORST, "dark-worst", 4.5)
    print(f"  {name:8s} seed {seed} → light {text_hex} · on-dark {dark_hex}")

# Mustard: fill + ink-on-fill + deep (border/icon) + on-dark
add("--ink on --mustard fill", "#1C1C1A", "text", h2rgb(MUSTARD_FILL), "mustard fill", 4.5)
deep_hex, _ = derive(MUSTARD_SEED, GLASS_WORST, 3.0, "black")
add("--mustard-deep (border/icon)", deep_hex, "ui", PAPER, "paper", 3.0)
add("--mustard-deep (border/icon)", deep_hex, "ui", GLASS_WORST, "glass-worst", 3.0)
mustard_dark, _ = derive(MUSTARD_FILL, DARK_WORST, 4.5, "white")
add("--mustard-on-dark", mustard_dark, "text", DARK_WORST, "dark-worst", 4.5)
print(f"  mustard  fill {MUSTARD_FILL} · deep {deep_hex} · on-dark {mustard_dark}")

# Focus ring (cobalt graphic grade) must clear 3:1 against paper
cobalt_text, _ = derive(BRAND["cobalt"], GLASS_WORST, 4.5, "black")
add("--focus-ring (cobalt)", cobalt_text, "ui", PAPER, "paper", 3.0)

# White text on dark scrim
add("#FFFFFF on dark scrim", "#FFFFFF", "text", DARK_WORST, "dark-worst", 4.5)

print()
print(f"Worst-case backgrounds: paper {rgb2h(PAPER)} · glass {rgb2h(GLASS_WORST)} · dark {rgb2h(DARK_WORST)}")
print()
print(f"{'Token':38s} {'Value':9s} {'Measured':22s} {'Target':7s} {'Status'}")
print("─" * 88)
for n, v, _role, meas, tgt, st in rows:
    print(f"{n:38s} {v:9s} {meas:22s} {tgt:7s} {st}")

print()
if failures:
    print(f"✗ {len(failures)} FAILURES: {sorted(set(failures))}")
    raise SystemExit(1)
print(f"✓ all {len(rows)} checks pass WCAG 2.2 AA targets")
