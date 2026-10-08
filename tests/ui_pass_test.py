#!/usr/bin/env python3
"""Guard for kb/ui_pass_ledger.json and scripts/ui_pass.py (S347).

Sam, 2026-10-08: the checkpoint picks one view a run for a UI audit and fix (wired to
every view that shares its data, AA, mobile, First Light), in place of the retired To-Do
step. The failures this guards: a tab added to COBI's nav that the pass never reaches; a
ledger row naming a view that is gone; a pass stamped with no outcome; --next choosing a
view on hold, or a COBI tab before a public page nobody has audited.

Run from repo root: python3 tests/ui_pass_test.py
"""
import copy
import json
import os
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "scripts"))
import ui_pass as M  # noqa: E402

results = []


def check(name, ok, why=""):
    results.append((name, bool(ok), why))


Q = M.load()
bad = M.faults(Q)
check("the committed ledger lists every view, and only views", not bad, "; ".join(bad))
tabs = [t for t, _ in M.nav_tabs()]
check("COBI's nav is read from index.html (40 tabs on 2026-10-08, the Program Requirements tab among them)",
      len(tabs) >= 40 and "program-requirements" in tabs and "dashboard" in tabs, len(tabs))
pages = M.standalone_pages()
check("the standalone pages come from a11y.config.js",
      "sierra/index.html" in pages and "fact-sheet/index.html" in pages and "index.html" not in pages, pages)

q = copy.deepcopy(Q)
q["surfaces"] = [r for r in q["surfaces"] if r["id"] != "cobi:program-requirements"]
check("refuses a ledger missing a nav tab", any("cobi:program-requirements" in b for b in M.faults(q)))
q = copy.deepcopy(Q)
q["surfaces"].append({"id": "cobi:no-such-tab", "name": "x", "page": "index.html#x", "audience": "staff"})
check("refuses a view that is not in the nav", any("no view" in b for b in M.faults(q)))
q = copy.deepcopy(Q)
q["surfaces"][0]["last"] = "2026-10-08"
q["surfaces"][0]["outcome"] = None
check("refuses a pass with no outcome", any("no outcome" in b for b in M.faults(q)))
q = copy.deepcopy(Q)
q["surfaces"].append(dict(q["surfaces"][0]))
check("refuses a view listed twice", any("twice" in b for b in M.faults(q)))

rows = [
    {"id": "cobi:a", "name": "A", "page": "index.html#a", "audience": "staff", "last": None},
    {"id": "pub-old", "name": "P", "page": "p.html", "audience": "public", "last": "2026-09-01", "outcome": "x"},
    {"id": "pub-held", "name": "H", "page": "h.html", "audience": "public", "last": None, "hold": "redesign"},
    {"id": "pub-new", "name": "N", "page": "n.html", "audience": "public", "last": None},
    {"id": "cobi:b", "name": "B", "page": "index.html#b", "audience": "staff", "last": "2026-08-01", "outcome": "y"},
]
order = [r["id"] for r in M.rank(rows)]
check("--next: a public page never audited first, a held one never",
      order == ["pub-new", "pub-old", "cobi:a", "cobi:b"], order)

deps = {"datasets": {
    "table:t1": {"consumers": [{"tabs": ["program-requirements", "cpl-pathways"]}, {"pages": ["sierra/index.html"]}]},
    "table:t2": {"consumers": [{"tabs": ["dashboard"]}]},
    "external:www.w3.org": {"consumers": [{"tabs": ["program-requirements"]}]}}}
w = M.wiring("cobi:program-requirements", deps)
check("--wiring names the other views reading each dataset, and skips the SVG namespace",
      w == {"table:t1": ["cobi:cpl-pathways", "sierra/index.html"]}, w)

with tempfile.TemporaryDirectory() as d:
    p = os.path.join(d, "l.json")
    with open(p, "w", encoding="utf-8") as f:
        json.dump(Q, f)
    rc = M.main(["--record", "cobi:program-requirements", "The headline band passes AA in both themes.", "--path", p])
    with open(p, encoding="utf-8") as f:
        s = json.load(f)
    row = next(r for r in s["surfaces"] if r["id"] == "cobi:program-requirements")
    check("--record stamps today and the outcome", rc == 0 and row["last"] and row["outcome"].startswith("The headline"), row)
    check("--record refuses an unknown view", M.main(["--record", "cobi:nope", "x", "--path", p]) == 1)

pass_n = sum(1 for r in results if r[1])
for name, ok, why in results:
    print(("  ok  " if ok else "FAIL  ") + name + ("" if ok or not why else "\n        > " + str(why)))
print("\nui_pass_test.py: %d/%d checks passed" % (pass_n, len(results)))
sys.exit(0 if pass_n == len(results) else 1)
