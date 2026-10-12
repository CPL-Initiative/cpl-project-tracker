#!/usr/bin/env python3
"""The Vision 2030 tab's first UI pass (S365, cobi:vision-2030).

The section is written by excel_to_dashboard.py's render_vision_2030_html(), so a
fix made in index.html would be undone by the next daily run (Rule 1). `npm run
a11y` passed the tab in light and dark before the pass; these faults were found by
measuring at 320 and 390 px and by reading the tab beside the annual report:

  1. The page scrolled 44px sideways at 320px: the grid's columns had a 300px
     floor. They now take min(300px, 100%).
  2. Each progress bar shared a row with its label, which took the row: the bars
     were 0px wide on a phone and Goal 1's was 12px at 1024. The bar now sits
     above its label (flex: none, so a column cannot collapse its 6px height).
  3. The two Action cards carried wording found in no source, while the annual
     report carried a paraphrase of the CPL Workplan. Both now read
     V2030_ACTIONS, the workplan's own words (July 2025, p. 1).
  4. Goal 1's fill was written width:1419.5% (14,195 credit recommendations over
     a target of 1,000). Every width is held to 0-100; the bars are aria-hidden,
     because the label beside each carries its numbers.
  5. The goal cards' inline styles became classes, with tokens only.

The figures: Sam ruled on Open Asks Sheet 66 card 1 (2026-10-11 23:44Z, "One set,
as proposed"). vision_2030_goals() states them once for the tab and the annual
report: Goal 1 measures students against 250,000 and names the credit
recommendation count without a percent; Goals 2 and 3 show the figure set in
kb/dashboard_config.json and TBA until then, with no bar (an empty bar reads as
0%); Goal 2 keeps its active-colleges line (section 6 below).

Run:  python3 tests/vision_2030_first_light_test.py
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
import excel_to_dashboard as gen  # noqa: E402

failures = []


def ok(label, cond):
    print(("PASS  " if cond else "FAIL  ") + label)
    if not cond:
        failures.append(label)


def read(rel):
    with open(os.path.join(ROOT, rel), encoding="utf-8") as f:
        return f.read()


KPIS = {"credit_recommendations": {"value": "14,195"},
        "cumulative_students": {"value": "54,964"},
        "active_colleges": {"value": "103"}}
html = gen.render_vision_2030_html(KPIS)
SRC = read("excel_to_dashboard.py")

# ── the section's frame ──────────────────────────────────────────────────────
ok("the section runs from its start marker to its end marker",
   html.startswith("<!-- Vision 2030 Section -->")
   and html.rstrip().endswith("<!-- End Vision 2030 Section -->"))
ok("main() writes the section through render_vision_2030_html, not an inline copy",
   "render_vision_2030_html(kpis, config_overrides)" in SRC and "new_v2030" not in SRC)

# ── 3. the actions: one list, the workplan's words ──────────────────────────
ok("V2030_ACTIONS holds Action 1a and Action 5 in the workplan's words",
   [a["id"] for a in gen.V2030_ACTIONS] == ["Action 1a", "Action 5"]
   and gen.V2030_ACTIONS[0]["desc"].endswith("including service corps programs.")
   and gen.V2030_ACTIONS[1]["desc"].endswith("in an efficient timeline."))
for a in gen.V2030_ACTIONS:
    ok(f"the tab states {a['id']} from V2030_ACTIONS",
       f"<h3>Vision 2030 {a['id']}</h3>" in html
       and f"<p>{gen.html_escape(a['desc'])}</p>" in html)
ok("CPL_DATA.vision2030 reads the same list (the annual report)",
   re.search(r'"actions":\s*\[dict\(a\) for a in V2030_ACTIONS\]', SRC) is not None)
ok("no second wording of the actions remains in the generator",
   SRC.count("Scale Credit for Prior Learning opportunities") == 1
   and "Scale CPL opportunities with focus" not in SRC
   and "multiple pathways to a baccalaureate" not in SRC)

# ── 4. the bars ──────────────────────────────────────────────────────────────
SET = {"V2030_G2_PROGRESS": "40", "V2030_G2_CURRENT": "CCCApply sends CPL interest",
       "V2030_G3_PROGRESS": 130, "V2030_G3_CURRENT": "Title 5 package filed"}
html_set = gen.render_vision_2030_html(KPIS, SET)
widths = [float(w) for w in re.findall(r'class="goal-progress-fill" style="width:([\d.]+)%;"', html_set)]
ok("with every figure set, three goal bars, each 0-100 wide (Goal 1 was written 1419.5%)",
   len(widths) == 3 and all(0 <= w <= 100 for w in widths))
ok("a count far past its target still paints a full bar, not a wider one",
   gen._bar_width(1419.5) == "100.0" and gen._bar_width(-3) == "0.0")
ok("every bar is aria-hidden: its label carries the numbers",
   html_set.count('class="goal-progress-bar" aria-hidden="true"') == 3
   and html_set.count('class="goal-progress-bar"') == 3
   and html.count('class="goal-progress-bar" aria-hidden="true"') == html.count('class="goal-progress-bar"'))
ok("every bar has a label beside it",
   html.count('class="goal-progress-label"') == 3)

# ── 5. classes, tokens only ──────────────────────────────────────────────────
styles = re.findall(r'style="([^"]*)"', html)
ok("the only inline style left is each fill's width",
   len(styles) == html.count('class="goal-progress-fill"')
   and all(re.fullmatch(r"width:[\d.]+%;", s) for s in styles))
ok("no raw hex in the section", not re.search(r"#[0-9A-Fa-f]{3,8}\b", html))
ok("the goal cards carry their classes",
   html.count('class="goal-title"') == 3 and html.count('class="goal-target"') == 3
   and html.count('class="goal-bullets"') == 3)
ok("text from the goal definitions is escaped (& as &amp;)",
   "Access &amp; Boost" in html and " & " not in re.sub(r"&nbsp;\|&nbsp;", "", html))

# ── 1-2. the template's CSS, both HTMLs (Rule 4) ─────────────────────────────
def vision_css(src):
    m = re.search(r"/\* Vision 2030 Section \*/[\s\S]*?(?=/\* Footer \*/)", src)
    return m.group(0) if m else ""


css = {f: vision_css(read(f)) for f in ("index.html", "CPL_Dashboard.html")}
ok("both HTMLs carry the same Vision 2030 CSS", css["index.html"] and css["index.html"] == css["CPL_Dashboard.html"])
c = css["index.html"]


def rule(sel):
    m = re.search(re.escape(sel) + r"\s*\{([^}]*)\}", c)
    return m.group(1) if m else ""


ok("the grid's columns never ask for more than the pane holds (320px)",
   "minmax(min(300px, 100%), 1fr)" in rule(".vision-grid"))
ok("the bar sits above its label",
   "flex-direction: column" in rule(".goal-progress") and "align-items: stretch" in rule(".goal-progress"))
ok("the bar keeps its height in the column (flex: none, not flex: 1)",
   "flex: none" in rule(".goal-progress-bar") and "flex: 1" not in rule(".goal-progress-bar"))
ok("the classes paint what the inline styles did",
   "var(--mustard-text)" in rule(".vision-card h3.goal-title")
   and "0.85rem" in rule(".vision-card .goal-target")
   and "var(--text-muted)" in rule(".vision-card .goal-bullets")
   and "600" in rule(".goal-progress-label"))
ok("the Vision 2030 CSS uses tokens, no raw hex", not re.search(r"#[0-9A-Fa-f]{3,8}\b", c))

# ── 6. one set of figures (Sam, Open Asks Sheet 66 card 1) ───────────────────
cards = re.findall(r'<div class="vision-card">\s*<h3 class="goal-title">(.*?)</h3>(.*?)</span>', html, re.S)
labels = [re.search(r'class="goal-progress-label">(.*)$', body, re.S).group(1) for _, body in cards]
ok("three goal cards", len(labels) == 3)
fill1 = re.findall(r'class="goal-progress-fill" style="width:([\d.]+)%;"', html)
ok("Goal 1's bar measures students against 250,000 (54,964 is 22%)", fill1[:1] == ["22.0"] and "Progress: 22%" in labels[0])
ok("Goal 1 names the credit recommendation count without a percent of the workgroup target",
   "Credit recommendations in MAP: 14,195" in labels[0] and "1419" not in html and "/1,000" not in html)
ok("with nothing set, Goals 2 and 3 say TBA and paint no bar (an empty bar reads as 0%)",
   labels[1].startswith("Progress: TBA") and labels[2].startswith("Progress: TBA") and len(fill1) == 1)
ok("Goal 2 keeps its active-colleges line", "Active colleges: 103 of 116" in labels[1])
ok("no default figure or line stands in for an unset one",
   "65," not in html and "1,000+ trained" not in labels[2]
   and 'V2030_G2_PROGRESS", 55' not in SRC and 'V2030_G3_PROGRESS", 60' not in SRC
   and "Portal launching" not in SRC and "AB 123 chaptered; $20M allocated" not in SRC)
labels_set = re.findall(r'class="goal-progress-label">(.*?)</span>', html_set, re.S)
ok("a set figure and line show, held to 0-100 (130 shows as 100)",
   "Progress: 40%" in labels_set[1] and "CCCApply sends CPL interest" in labels_set[1]
   and "Progress: 100%" in labels_set[2] and "Title 5 package filed" in labels_set[2])
G = {g["id"]: g for g in gen.vision_2030_goals(KPIS, {})}
ok("the annual report reads the same figures (CPL_DATA.vision2030 from vision_2030_goals)",
   re.search(r'_v2030 = \{g\["id"\]: g for g in vision_2030_goals\(kpis, config_overrides\)\}', SRC) is not None
   and '"progress": _v2030["Goal 1"]["progress"]' in SRC and G["Goal 1"]["progress"] == 22
   and G["Goal 2"]["progress"] is None and G["Goal 3"]["progress"] is None)
ok("the annual report says TBA where no figure is set",
   '"Progress: TBA"' in read("annual_report.js"))

print(f"\n{'FAILED' if failures else 'OK'} — {len(failures)} failure(s)")
sys.exit(1 if failures else 0)
