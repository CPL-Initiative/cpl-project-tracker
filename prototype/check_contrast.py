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
        # evaluate the ROUNDED hex we'd actually return — rounding can
        # nudge a borderline candidate back under the target
        c = h2rgb(rgb2h(mix(start, end, step / 100.0)))
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
    "crimson": "#920000",   # deepened 2026-06-12 (Sam) — was #C8102E
    "cobalt":  "#0047AB",
    "hunter":  "#2C601A",   # greened 2026-06-12 (Sam) — was #355E3B
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

# Mustard: bright fill (dots/banners; ink on it) + on-dark.
add("--ink on --mustard fill", "#1C1C1A", "text", h2rgb(MUSTARD_FILL), "mustard fill", 4.5)
mustard_dark, _ = derive(MUSTARD_FILL, DARK_WORST, 4.5, "white")
add("--mustard-on-dark", mustard_dark, "text", DARK_WORST, "dark-worst", 4.5)
print(f"  mustard  fill {MUSTARD_FILL} · on-dark {mustard_dark}")

# ── v1.3 (Sam): SOLID chip fills with WHITE labels (the Primary-action
# look). White text must clear 4.5:1 on every fill. Crimson, cobalt and
# hunter pass as their core hues; violet darkens a touch for extra pop
# (Sam), and mustard's chip fill MUST darken to a deep ochre — white on
# true mustard is ~2:1, physically unfixable. The bright hue keeps its
# dot/banner jobs.
WHITE_BG = (255, 255, 255)
for name, seed in BRAND.items():
    add(f"white label on --{name} chip fill", "#FFFFFF", "text", h2rgb(seed), f"{name} fill", 4.5)
violet_chip, _ = derive(BRAND["violet"], WHITE_BG, 8.0, "black")   # aesthetic darken, big margin
add("white label on --violet-chip", "#FFFFFF", "text", h2rgb(violet_chip), "violet-chip", 4.5)
mustard_chip, _ = derive(MUSTARD_SEED, WHITE_BG, 4.6, "black")     # the dijon trade-off
add("white label on --mustard-chip", "#FFFFFF", "text", h2rgb(mustard_chip), "mustard-chip", 4.5)
add("--mustard-chip vs paper (chip vs page)", mustard_chip, "ui", PAPER, "paper", 3.0)
print(f"  chips    violet-chip {violet_chip} · mustard-chip {mustard_chip} (white labels)")

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
