#!/usr/bin/env python3
"""The Budget tab's First Light pass (S363 UI pass, cobi:budget).

The Budget section is written by excel_to_dashboard.py's render_budget_html(), so
a fix made in index.html would be undone by the next daily run (Rule 1). The pass
measured four faults on the live tab and fixed each in the generator:

  1. The bar's labels were white on every fill. In dark, --navy-primary turns
     light (#ECE9E2) and "18%" read 1.21:1. Each fill now carries the text color
     that reads on it in both themes.
  2. "Budget data as of" was #888 (3.26:1 light, 4.28:1 dark); now --text-muted.
  3. The holders that scroll at 390px were not keyboard reachable; each now has
     tabindex="0", role="region" and a name.
  4. Raw hex in the section (#ddd, #eee, #f9f9f9: the personnel total row stayed
     near-white in dark). Tokens only now.

And the editor's buttons are underlined words (First Light, Sam 2026-10-09).

Run:  python3 tests/budget_section_first_light_test.py
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import excel_to_dashboard as gen  # noqa: E402

failures = []


def ok(label, cond):
    print(("PASS  " if cond else "FAIL  ") + label)
    if not cond:
        failures.append(label)


# Five sources of equal size, so every segment carries a label (> 8%).
BUDGET = {
    "funding_sources": [{"name": "Source %d" % i, "total": 1_000_000,
                         "years": [200_000] * 5} for i in range(5)],
    "expenditures": [{"type": "Personnel", "description": "Analyst", "category": "Salary",
                      "area": "MAP", "years": [10_000] * 5, "total": 50_000}],
    "expense_categories": [], "expense_areas": [],
    "personnel": [{"title": "Analyst", "fte": 1, "years": [10_000] * 5, "total": 50_000}],
    "personnel_totals": {"years": [10_000] * 5, "total": 50_000},
    "factors": {}, "year_labels": ["2025-26", "2026-27", "2027-28", "2028-29", "2029-30"],
    "grand_total": 5_000_000,
}
html = gen.render_budget_html(BUDGET, data_source_stamp="2026-10-11")

ok("the section carries no raw hex color and no hard-coded white text",
   not re.findall(r"#[0-9A-Fa-f]{3,6}\b|color:\s*white", html))

pairs = re.findall(r"background-color:(var\(--[a-z-]+\));display:flex;align-items:center;"
                   r"justify-content:center;color:(var\(--[a-z-]+\));", html)
expected = [("var(--navy-primary)", "var(--on-accent)"), ("var(--navy-secondary)", "var(--on-accent)"),
            ("var(--green-progress)", "var(--on-accent)"), ("var(--gold-accent)", "var(--on-mustard)"),
            ("var(--light-blue)", "var(--on-mustard)")]
ok("each bar segment pairs its fill with the text color that reads on it in both themes: %s" % pairs,
   pairs == expected)

ok("the as-of stamp is --text-muted",
   'color:var(--text-muted);font-size:0.75rem;margin:0 0 1.25rem 0;">Budget data as of 2026-10-11' in html)

scrollers = re.findall(r"<div[^>]*overflow-x:auto[^>]*>|<div class=\"budget-funding-overview\"[^>]*>", html)
ok("every holder that scrolls is focusable and named (%d found)" % len(scrollers),
   scrollers and all('tabindex="0"' in d and 'role="region"' in d and 'aria-label="' in d for d in scrollers))

css = gen.EXHIBIT_ANALYSIS_CSS if hasattr(gen, "EXHIBIT_ANALYSIS_CSS") else open(gen.__file__).read()
btn = re.search(r"\.budget-btn \{([^}]*)\}", css)
ok("the editor's buttons are underlined words with no fill",
   btn and "text-decoration:underline" in btn.group(1) and "background:none" in btn.group(1)
   and "min-height:24px" in btn.group(1))

# S364 finished the pass: the editor's own rules carry no raw color. The save states
# were pastels under dark mode's light text ($15.0M read 1.35:1 on #FFF6D9 in the seeded
# a11y.config.js budget-editor-dark sweep); a hex survives only as the light fallback
# of a dark-only tint, the repo's pattern for those tokens (tests/cpl_theme.test.js).
editor = css[css.index("/* ─── Budget inline editor"):css.index("/* ─── Doublewide KPI card")]
bare = re.sub(r"var\(--[a-z-]+, ?#[0-9A-Fa-f]{6}\)", "", editor)
ok("the editor's CSS carries no raw color outside a dark-only token's fallback: %s"
   % (re.findall(r"#[0-9A-Fa-f]{3,6}\b|rgba?\(", bare) or "none"),
   not re.findall(r"#[0-9A-Fa-f]{3,6}\b|rgba?\(", bare))
ok("a failed save is a red outline, never a fill that only color reads",
   re.search(r"\.budget-cell\.budget-error \{[^}]*outline:2px solid var\(--red-alert\)", editor))
js = open(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "budget_editor.js")).read()
ok("budget_editor.js sets no raw color inline (the status line and a rejected input)",
   not re.findall(r"style\.\w+\s*=\s*\"#", js))

if failures:
    print("\n%d failure(s)" % len(failures))
    sys.exit(1)
print("\nok: the Budget section's First Light pass")
