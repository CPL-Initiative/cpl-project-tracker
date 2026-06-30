"""
Light-theme guard for the converted dark surfaces (Session 87, SkyGuy).

Sam asked for a consistent light/glass look: the KPI Trends card, the CPL
Analytics + EACR exhibit tables (shared .exhibit-*/.sw-* CSS), and the College
Activity card were flipped from dark navy to light, with chips/trendlines
recolored for contrast on white. The exhibit CSS is INJECTED at generate-time
(only when MAP exhibit data is present), so the sandbox can't render it — these
guard the SOURCE so a future edit can't silently reintroduce a dark surface.

Run from repo root:  python3 kb/_test_light_theme.py
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import excel_to_dashboard as e  # noqa: E402

fails = []


def check(name, cond):
    print(("PASS " if cond else "FAIL ") + name)
    if not cond:
        fails.append(name)


# ── EXHIBIT_ANALYSIS_CSS — the .exhibit-*/.sw-* families (CPL Analytics + EACR) ──
css = e.EXHIBIT_ANALYSIS_CSS
# Isolate the dark-prone region (.exhibit-cards-grid .. before the already-light
# .proj-* editor block) so the legit `color:var(--navy-primary)` KEEPs (dark text
# on gold buttons / the light proj widget) outside it don't trip the guard.
region = css[css.find(".exhibit-cards-grid"):css.find(".proj-auth-widget")]
check("exhibit-card is a LIGHT surface (var(--surface-opaque), not navy)",
      ".exhibit-card {" in css and "background: var(--surface-opaque)" in css)
check("no dark navy BACKGROUND remains in the exhibit/sw region",
      "background: var(--navy-primary)" not in region and
      "background:var(--navy-primary)" not in region)
check("no -on-dark colors remain in the exhibit/sw region",
      "-on-dark" not in region)
check("no white text/borders (rgba(255,255,255,...)) remain in the exhibit/sw region",
      "rgba(255,255,255," not in region)
check("the only var(--navy-primary) uses are KEEP text-on-gold (color:, not background:)",
      all("color" in ln for ln in region.splitlines() if "var(--navy-primary)" in ln))
check("exhibit table header is a light band (surface-muted)",
      "background: var(--surface-muted)" in region)
check("badge TEXT uses readable light tokens (--hunter/--cobalt/--mustard-text/--crimson)",
      "color:var(--hunter)" in region and "color:var(--cobalt)" in region and
      "color:var(--mustard-text)" in region)

# ── KPI Trends delta chips — readable green/red on white, not the dark variants ──
up, _ = e._delta_badge(110, 100)
down, _ = e._delta_badge(90, 100)
check("delta chip UP uses --hunter (dark green, readable on white)",
      "var(--hunter)" in up and "-on-dark" not in up)
check("delta chip DOWN uses --crimson (dark red, readable on white)",
      "var(--crimson)" in down and "-on-dark" not in down)
flat, _ = e._delta_badge(100, 100)
check("delta chip neutral uses --text-muted (not white)",
      "var(--text-muted)" in flat and "255,255,255" not in flat)

# ── KPI Trends container HTML — light card, darkened sparkline ──
hist = [{"date": "2026-06-%02d" % d, "students": 40000 + d * 100,
         "credit_recs": 9000 + d * 50} for d in range(1, 29)]
trends = e.render_kpi_history_card(hist)
check("KPI Trends container is a light card (surface-opaque, not navy)",
      "background:var(--surface-opaque)" in trends and
      "background:var(--navy-primary)" not in trends)
check("KPI Trends sparkline stroke is the darkened gold (#8B6800), not #E3B341",
      'stroke="#8B6800"' in trends and 'stroke="#E3B341"' not in trends)
check("KPI Trends title + values use --mustard-text (readable gold on white)",
      "var(--mustard-text)" in trends)

# ── College Activity template — light container ──
tmpl = open(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                         "college_activity_template.html"), encoding="utf-8").read()
check("College Activity card container is light (surface-opaque)",
      "background:var(--surface-opaque)" in tmpl)
check("College Activity template has no dark navy background",
      "background:var(--navy-primary)" not in tmpl and "background: var(--navy-primary)" not in tmpl)

print()
if fails:
    print(f"{len(fails)} FAILED: {fails}")
    sys.exit(1)
print("All light-theme assertions passed.")
