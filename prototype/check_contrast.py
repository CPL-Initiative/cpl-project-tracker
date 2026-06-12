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


# ═══════════════════════════════════════════════════════════════════════
# --live mode: lint the LIVE dashboard's :root against the spec.
# Run from repo root:  python3 prototype/check_contrast.py --live
# Used as a (non-required) CI step. Checks:
#   1. CPL_Dashboard.html and index.html carry byte-identical :root blocks
#      (Rule 4).
#   2. Every First Light token is present with the exact spec value
#      (drift-pin — the daily regen or a hand edit can't silently repaint).
#   3. The text grades + accent text grades measure AA on the documented
#      worst-case backdrops (recomputed, not trusted).
#   4. Legacy alias tokens resolve to the intended palette roles.
# ═══════════════════════════════════════════════════════════════════════
import sys

if "--live" in sys.argv:
    import re as _re

    def _root_block(path):
        html = open(path, encoding="utf-8").read()
        m = _re.search(r":root\s*\{(.*?)\}", html, _re.S)
        if not m:
            print(f"✗ {path}: no :root block found")
            raise SystemExit(1)
        return m.group(1)

    def _parse_tokens(block):
        toks = {}
        for mm in _re.finditer(r"--([A-Za-z0-9-]+)\s*:\s*([^;]+);", block):
            toks[mm.group(1)] = mm.group(2).strip()
        return toks

    def _resolve(toks, name, depth=0):
        if depth > 10:
            return None
        v = toks.get(name)
        if v is None:
            return None
        mv = _re.fullmatch(r"var\(--([A-Za-z0-9-]+)\)", v)
        return _resolve(toks, mv.group(1), depth + 1) if mv else v

    blocks = {p: _root_block(p) for p in ("CPL_Dashboard.html", "index.html")}
    fails = []
    if blocks["CPL_Dashboard.html"] != blocks["index.html"]:
        fails.append("Rule 4: :root blocks differ between CPL_Dashboard.html and index.html")
    toks = _parse_tokens(blocks["CPL_Dashboard.html"])

    # 2. drift-pins — the spec values (prototype v1.6, Sam-blessed 2026-06-12)
    SPEC = {
        "paper": "#F4F2ED",
        "text-strong": "#1C1C1A", "text-body": "#3A3A36",
        "text-muted": "#5C5C55", "text-faint": "#87877F",
        "surface-opaque": "#FFFFFF",
        "surface-subtle": "#F7F5F1", "surface-muted": "#ECE9E2",
        "crimson": "#920000", "cobalt": "#0047AB", "hunter": "#2C601A",
        "violet": "#6D28D9",
        "mustard-fill": "#E3B341", "mustard-text": "#8B6800",
        "crimson-on-dark": "#CF8F8F", "cobalt-on-dark": "#7DA1D4",
        "hunter-on-dark": "#89A67F", "violet-on-dark": "#B28DEB",
        "mustard-on-dark": "#E3B341",
    }
    for name, want in SPEC.items():
        got = _resolve(toks, name)
        if got is None:
            fails.append(f"missing token --{name}")
        elif got.upper() != want.upper():
            fails.append(f"--{name} is {got}, spec says {want}")

    # 4. legacy aliases resolve onto the palette
    ALIASES = {
        "navy-primary": "#1C1C1A", "navy-secondary": "#3A3A36",
        "gold-accent": "#E3B341", "light-blue": "#7DA1D4",
        "bg-off-white": "#F4F2ED", "text-gray": "#3A3A36",
        "green-progress": "#2C601A", "red-alert": "#920000",
        "yellow-warning": "#8B6800", "accent-link": "#0047AB",
        "status-completed": "#2C601A", "status-on-track": "#8B6800",
        "status-at-risk": "#920000", "status-proposed": "#5C5C55",
    }
    for name, want in ALIASES.items():
        got = _resolve(toks, name)
        if got is None:
            fails.append(f"missing legacy alias --{name}")
        elif got.upper() != want.upper():
            fails.append(f"legacy --{name} resolves to {got}, expected {want}")

    # 3. AA measurements on worst-case backdrops (recomputed)
    _PAPER = h2rgb("#F4F2ED")
    _ART = mix(_PAPER, (0, 0, 0), 0.10)
    _GLASS = mix(_ART, (255, 255, 255), 0.78)
    _DARK = mix(_PAPER, h2rgb("#15151D"), 0.92)
    _INK = h2rgb("#1C1C1A")

    def _aa(name, bg, bgname, target=4.5):
        hexv = _resolve(toks, name)
        if not hexv or not hexv.startswith("#"):
            return
        r = ratio(h2rgb(hexv), bg)
        if r < target:
            fails.append(f"--{name} {hexv} measures {r:.2f}:1 vs {bgname} (needs {target}:1)")

    for t in ("text-strong", "text-body", "text-muted",
              "crimson", "cobalt", "hunter", "violet", "mustard-text"):
        _aa(t, _PAPER, "paper")
        _aa(t, _GLASS, "glass-worst")
    for t in ("crimson-on-dark", "cobalt-on-dark", "hunter-on-dark",
              "violet-on-dark", "mustard-on-dark"):
        _aa(t, _DARK, "dark-worst")
        _aa(t, _INK, "ink card")
    # banner/badge pairs the live dashboard uses
    if ratio(h2rgb("#1C1C1A"), h2rgb("#E3B341")) < 4.5:
        fails.append("ink on mustard-fill banner pair under 4.5:1")
    if ratio((255, 255, 255), h2rgb("#0047AB")) < 4.5:
        fails.append("white on cobalt button pair under 4.5:1")

    if fails:
        print(f"✗ live :root lint — {len(fails)} failure(s):")
        for f in fails:
            print("   ", f)
        raise SystemExit(1)
    print(f"✓ live :root lint — both HTMLs identical, {len(SPEC)} spec tokens + "
          f"{len(ALIASES)} aliases pinned, AA verified on worst-case backdrops")
    raise SystemExit(0)

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

# Mustard: bright fill (dots/banners; ink on it) + on-dark + the dark TEXT
# grade (variant-B "glass & quiet" chips use darker accent text on a subtle
# translucent fill — mustard's bright hue still can't be text).
add("--ink on --mustard fill", "#1C1C1A", "text", h2rgb(MUSTARD_FILL), "mustard fill", 4.5)
text_mustard, _ = derive(MUSTARD_SEED, PAPER, 4.5, "black")  # paper binds for dark text
add("--mustard-text (variant-B chip labels)", text_mustard, "text", PAPER, "paper", 4.5)
add("--mustard-text (variant-B chip labels)", text_mustard, "text", GLASS_WORST, "glass-worst", 4.5)
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
