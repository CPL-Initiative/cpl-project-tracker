#!/usr/bin/env python3
"""Annual Workplan Goals — AA contrast and the keyboard-reachable table (S361 UI pass).

The checkpoint's UI pass on cobi:workplan-goals (2026-10-11) measured, with
`npm run a11y`:
  * light: the id ("1.1", #888, 3.54:1), "Contributes to:" (#888), the
    separator "·" (#999, 2.62:1) and the manual-value pencil (#bbb, 1.92:1);
  * dark: the primary chip (--mustard-text on a fixed #FBF3DA ground, 1.75:1)
    and the subsidiary marker "↳" (the fixed navy --seal-blue, 1.15:1);
  * 390px: the table's overflow wrapper was not keyboard reachable.
Each now uses a themed token, and the wrapper is a named, focusable region.
These checks fail on the colors and the bare wrapper they replaced.

Not wired into `npm test` (the JS runner only discovers *.test.js) because it
imports the Python pipeline. Run from the repo root:

    python3 tests/annual_goals_contrast_test.py
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
import excel_to_dashboard as gen

failures = []


def check(label, ok):
    print(("PASS  " if ok else "FAIL  ") + label)
    if not ok:
        failures.append(label)


YEAR_KEYS = ["yr_2025_26", "yr_2026_27", "yr_2027_28", "yr_2028_29", "yr_2029_30"]
ACTS = {"1": "Activity 1: Infrastructure", "4": "Activity 4: Sprints and Partnerships"}
PROJECTS = [("1.1", "Platform build", "1"), ("4.1", "Veteran Sprint", "4"), ("4.1.1", "29 Palms", "4")]


def pair(aid, name, kind):
    rows = []
    for rt in ("GOAL", "STRETCH"):
        r = {k: 0 for k in YEAR_KEYS}
        r.update({"activity_id": aid, "name": name, "row_type": rt, "kind": kind,
                  "description": "", "current": None})
        rows.append(r)
    return rows


rows = []
for aid, nm in ACTS.items():
    rows += pair(aid, nm, "activity")
for pid, nm, _ in PROJECTS:
    rows += pair(pid, nm, "project")
projects = [{"id": pid, "name": nm, "activity": ACTS[home], "description": "", "kpi_metric": 0}
            for pid, nm, home in PROJECTS]
associations = [{"project_id": pid, "activity_id": home, "is_primary": True} for pid, _, home in PROJECTS]
associations.append({"project_id": "1.1", "activity_id": "4", "is_primary": False})

_, _, annual_goals = gen.build_workplan_goals_from_supabase(rows, associations, projects)
html = gen.render_annual_goals_table_html(annual_goals, [{"id": k, "name": v} for k, v in ACTS.items()])

check("the table renders (fixture reaches the renderer)", "Annual Workplan Goals" in html and "29 Palms" in html)

with open(os.path.join(ROOT, "workplan_goals.js")) as fh:
    js = fh.read()


def css_rule(selector):
    """The declaration block of one rule in workplan_goals.js's injected CSS."""
    m = re.search(re.escape(selector) + r" \{([^}]*)\}", js)
    return m.group(1) if m else ""


# S375 UI pass: the table prints classes and workplan_goals.js paints them, so the
# checks read the markup for the class and the injected CSS for the color.
# S426: the title sits in a head row with the sign-in slot; the wrapper follows the head.
wrap = re.search(r'<div class="wpg-annual-head">.*?</div>\s*(?:<p class="wpg-annual-note">[^<]*</p>\s*)?<div ([^>]*)>', html, re.S)
attrs = wrap.group(1) if wrap else ""
check("the scrolling wrapper is keyboard reachable and named (tabindex 0, role region, aria-label)",
      'class="wpg-annual-scroll"' in attrs and "overflow-x:auto" in css_rule(".wpg-annual-scroll")
      and 'tabindex="0"' in attrs and 'role="region"' in attrs
      and 'aria-label="Annual Workplan Goals table"' in attrs)

marker = re.search(r'<span class="wpg-sub-marker" aria-hidden="true">↳ </span>', html)
marker_css = css_rule(".wpg-annual-table .wpg-sub-marker")
check("the subsidiary marker ↳ renders for 4.1.1 in the themed text grade (--seal-blue-text), at full strength",
      bool(marker) and "var(--seal-blue-text" in marker_css and "opacity" not in marker_css)

check("the id and 'Contributes to:' use --text-muted, not #888",
      '<span class="wpg-pid">4.1.1</span>' in html
      and '<span class="wpg-assoc-label">Contributes to:</span>' in html
      and "color:var(--text-muted)" in css_rule(".wpg-annual-table .wpg-pid")
      and "color:var(--text-muted)" in css_rule(".wpg-annual-table .wpg-assoc-cell")
      and "#888" not in html and "#999" not in html)

chip = re.search(r"\.wpg-act-chip-primary \{([^}]*)\}", gen.EXHIBIT_ANALYSIS_CSS)
check("the primary chip's ground themes (var(--gold-soft,#FBF3DA)), so --mustard-text reads in dark",
      bool(chip) and "background:var(--gold-soft,#FBF3DA)" in chip.group(1))

# S426: the pencil hint and the "·" separator are gone (the Current row is a ladder
# like Goal and Stretch; the sign-in controls sit in the card's head row). The muted
# words that remain are the live and year-end notes, in --text-muted.
check("no pencil hint and no '·' separator remain in the editor",
      ".wpg-manual-hint" not in js and '["·"]' not in js)
check("the live and year-end notes use --text-muted",
      "color:var(--text-muted)" in css_rule(".wpg-live-badge") and "color:var(--text-muted)" in css_rule(".wpg-val-note"))
check("the sign-in widget carries no inline color",
      not re.search(r'wpg-auth-widget[^\n]*"style"', js))

print()
if failures:
    print(f"{len(failures)} failure(s)")
    sys.exit(1)
print("annual goals contrast: all checks pass")
