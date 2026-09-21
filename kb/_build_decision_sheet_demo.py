#!/usr/bin/env python3
"""Ten real items off the 2026-09-20 CR Reference sheet, rendered in the
rebuilt template — the eight Sam ruled on twice and two he ruled on once.

Rule 1's habit: the sheet has a generator, so a change to the template
regenerates it rather than being hand-edited into the HTML.

    python3 kb/_build_decision_sheet_demo.py
"""
import json, sys, html
sys.path.insert(0, 'kb')
import _decision_sheet_replies as m
E = html.escape

r = json.load(open('kb/receipts/cr_reference_decisions_2026-09-20_s280.json'))
by_n = {it['item']: it for it in r['items']}
FLIPPED = r['verdicts']['flipped_keep_to_fold']          # 26 27 28 29 32 35 37 38
KEPT = r['calibration']['kept_after_review']

# The eight he reversed, then two he ruled on once — one high-probability fold
# and one he held separate — so the template is shown against both outcomes.
picks = FLIPPED + [1, KEPT[0]]
items, rows_total = [], 0
for n in picks:
    it = by_n[n]
    flipped = n in FLIPPED
    rows_total += it['rows']
    items.append({
        'title': it['ref'],
        'ref': f"item {n} on the 2026-09-20 sheet",
        'facts': (f'A college wrote <strong>&ldquo;{E(it["cand_rec"])}&rdquo;</strong>. '
                  f'The published statewide line reads <strong>&ldquo;{E(it["anchor_rec"])}&rdquo;</strong>. '
                  f'Carries <strong>{it["rows"]} articulation row{"s" if it["rows"] != 1 else ""}</strong> '
                  f'across {it["colleges"]} college{"s" if it["colleges"] != 1 else ""}.'),
        'why': (f'Jev put the probability they are the same at <strong>{it["p_same"]}</strong>. '
                + ('You ruled on this one first as keep and then flipped it to fold, '
                   'which is the reversal this template is built to prevent.'
                   if flipped else
                   ('You folded it first time.' if n == 1 else 'You held it separate, and it stayed separate.'))),
        'rec': ('Fold this wording into the published line. One recommendation where there '
                f'are two, and {it["rows"]} articulation row'
                f'{"s" if it["rows"] != 1 else ""} collapse. '
                '<em>It might be wrong if</em> the two lines differ in level or scope rather than wording.'),
        'rows': it['rows'],
    })

out = m.build_sheet(
    "The decision sheet, rebuilt",
    items,
    curator="Sam Lee",
    # No colleges clause: the receipt carries per-item COUNTS, and a union of
    # invented ids would report a reach these ten items do not have.
    counts=f"{len(items)} items · {rows_total} articulation rows",
    sheet_id="2026-09-21-decision-sheet-template",
    howto=("These are ten real items off the 2026-09-20 sheet — the eight you ruled on twice, "
           "and two you ruled on once — rendered in the rebuilt template. Nothing here writes "
           "to the reference; it is the shape, for you to react to."),
    heading="Ten items, in the new shape",
)
open('docs/visuals/2026-09-21-decision-sheet-template.html', 'w', encoding='utf-8').write(out)
print(f"{len(items)} items · {rows_total} rows · {len(out)} bytes")
