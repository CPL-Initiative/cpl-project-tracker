#!/usr/bin/env python3
"""Guards the standing open-asks sheet — Sam, 2026-09-22:

    "Always give me a decision sheet for any outstanding items for me..."

⚠️ THE RULE IS "ALWAYS", AND AN ALWAYS THAT DEPENDS ON A SESSION REMEMBERING IS
NOT ONE. The builder's `audit_coverage()` is what makes it mechanical: a lane
that carries a NEEDS-SAM marker and no matching item REFUSES the build. This
suite proves the refusal actually fires, because a guard that only ever passes
is indistinguishable from no guard — the same lesson `alias_chain_single_source`
learned when a copy drifted to 7 maps against 15 under a comment promising
lockstep.

⚠️ AND IT PROVES THE DISMISSAL PATH IS NARROW. `NO_OPEN_ASK` exists so a marker
that is not an open ask can be named rather than deleted, but a bare exclusion
list would let a real ask be silenced with one line — so every dismissal must
carry a reason, and this checks that it does.

Run from repo root:  python3 tests/open_asks_sheet_coverage_test.py
"""
import importlib.util
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUILDER = os.path.join(ROOT, "kb", "_build_open_asks_decision_sheet.py")
SHEET = os.path.join(ROOT, "docs", "visuals", "2026-09-22-open-asks.html")

results = []


def check(name, cond, why=""):
    results.append((name, bool(cond), why))


def load():
    spec = importlib.util.spec_from_file_location("_open_asks", BUILDER)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


check("the builder exists", os.path.exists(BUILDER), BUILDER)
mod = load()
items = mod.items()
found = mod.lanes_with_asks()

# ── the sheet is built and complete ──────────────────────────────────────────
check("the sheet is committed", os.path.exists(SHEET), SHEET)
html = open(SHEET, encoding="utf-8").read() if os.path.exists(SHEET) else ""
cards = html.count('class="card"')
check("every item rendered a card", cards == len(items),
      "%d cards vs %d items" % (cards, len(items)))
check("⭐ every item carries a reply control",
      html.count('class="reply" data-item=') == len(items),
      "an item with no way to answer it is a status report, not a decision sheet")

# ── every item is answerable ─────────────────────────────────────────────────
check("every item names its lane",
      all(it.get("lane") for it in items))
check("every item states what it is, why, and a proposal",
      all(it.get("facts") and it.get("why") and it.get("rec") for it in items),
      "an ask with no proposal makes the reader do the work the sheet exists to do")
check("⭐ every proposal says how it could be wrong",
      all("might be wrong if" in it["rec"] for it in items),
      "a recommendation with no failure condition is an assertion — the reader "
      "cannot weigh what they cannot see the other side of")
check("every item offers a way to defer",
      all(any(v == "later" for _, v in it.get("chips", [])) for it in items),
      "a sheet that cannot be deferred item-by-item gets deferred whole")
check("chips name an outcome, never agreement",
      not any(lbl.strip().lower() in ("yes", "no", "ok", "agree", "approve")
              for it in items for lbl, _ in it.get("chips", [])),
      "'Yes' records assent to a proposal nobody will remember; the outcome is the record")

# ── the coverage guard actually refuses ──────────────────────────────────────
_f, missing, _s, _d = mod.audit_coverage(items)
check("coverage passes as committed", not missing, f"uncovered: {missing}")

orphaned = [dict(it, lane=it["lane"] + "-NOPE") for it in items]
_f2, missing2, _s2, _d2 = mod.audit_coverage(orphaned)
check("⭐ THE GUARD REFUSES when no item covers a lane",
      len(missing2) == len(set(found) - set(mod.NO_OPEN_ASK)) and len(missing2) > 0,
      "orphaning every item must surface every lane that carries a marker — "
      "otherwise the audit is decorative")

one_lane = sorted(set(found) - set(mod.NO_OPEN_ASK))[:1]
if one_lane:
    dropped = [it for it in items if it["lane"] != one_lane[0]]
    _f3, missing3, _s3, _d3 = mod.audit_coverage(dropped)
    check("⭐ dropping ONE lane's items is caught",
          missing3 == one_lane,
          f"expected {one_lane}, got {missing3} — a partial miss is the realistic failure, "
          "not a total one")

# ── the dismissal path stays narrow ──────────────────────────────────────────
check("⭐ every dismissal carries a reason",
      all(isinstance(v, str) and len(v.strip()) > 40
          for v in mod.NO_OPEN_ASK.values()),
      "a bare exclusion list silences a real ask with one line; the reason is the point")
check("no lane is both covered and dismissed",
      not ({it["lane"] for it in items} & set(mod.NO_OPEN_ASK)),
      "a lane answered in two places drifts")

passed = 0
for name, ok, why in results:
    print(f"{'  ok' if ok else 'FAIL'}  {name}" + ("" if ok else f"  — {why}"))
    passed += ok
print(f"\n{passed}/{len(results)} checks passed")
sys.exit(0 if passed == len(results) else 1)
