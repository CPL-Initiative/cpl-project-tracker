#!/usr/bin/env python3
"""Statewide Exhibits KPI card — generator-side verification.

Guards the failure modes of the statewide (CCC Collaborative) by-discipline
rollup in _parse_exhibits() + the card built in merge_exhibit_metrics():

  1. Credit recs are DISTINCT (course, credit) pairs per group; adoptions are
     raw CCC rows carrying an Articulation College — a duplicated rec across
     two colleges must count once as a rec but twice as adoptions.
  2. A rec row with a blank Articulation College counts as a rec, not an
     adoption.
  3. Local rows of a mixed (Local + CCC) group never leak into the statewide
     rec/adoption counts, but the group itself counts as statewide and its
     discipline pick considers ALL rows' TOP codes (first sorted TOP — the
     same representative-pick rule as _build_statewide_adoption, so the card
     reconciles with the EACR table).
  4. Groups with no TOP code land in "Not Mapped", which is kept as a rollup
     row but excluded from the headline Discipline Areas count.
  5. The card renders with the per-discipline footnote and sits after the
     CCC Collaborative Adoption card in the default order.

Not wired into `npm test` (the JS runner only discovers *.test.js) because it
needs the Python pipeline deps (openpyxl). Run from the repo root:

    python3 tests/statewide_kpi_test.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import excel_to_dashboard as gen

failures = []


def check(label, actual, expected):
    if actual == expected:
        print(f"PASS  {label}")
    else:
        print(f"FAIL  {label}: expected {expected!r}, got {actual!r}")
        failures.append(label)


# ── Pick two real TOP codes with distinct disciplines from the lookup ──
top_lookup = gen._load_top_code_lookup()
if not top_lookup:
    print("FAIL  TOP_Code_Lookup.xlsx missing or unreadable — cannot run")
    sys.exit(1)

t1 = t2 = None
for code in sorted(top_lookup):
    disc = gen._top_disc(top_lookup, code)
    if disc in ("Not Mapped", "Unknown", ""):
        continue
    if t1 is None:
        t1 = code
    elif disc != gen._top_disc(top_lookup, t1):
        t2 = code
        break
if not (t1 and t2):
    print("FAIL  could not pick two TOP codes with distinct disciplines")
    sys.exit(1)
disc1 = gen._top_disc(top_lookup, t1)
disc2 = gen._top_disc(top_lookup, t2)
# t1 < t2 (sorted pick) so the mixed group below deterministically resolves
# to disc1 via the first-sorted-TOP rule.

# ── Synthetic View_ArticulatedMAPExhibits dataset ──
cols = ["College", "ExhibitID", "Exhibit Title", "Status", "Articulation College",
        "Course", "Credit Recommendation", "Collaborative Type", "TOP Code",
        "CID Number", "Filler", "CPL Mode of Learning", "Filler2",
        "CPL Type Description"]
CPL = "Industry Certification"


def mk(eid, title, artic, course, credit, collab, top):
    return ["Origin College", eid, title, "", artic, course, credit, collab, top,
            "", "", "Exam", "", CPL]


rows = [
    # Exhibit A (CCC): dup rec across two colleges + a rec with no adopter
    mk("E1", "Test Statewide Cert Alpha", "College One", "WELD 100", "3 Units", "CCC Collaborative", t1),
    mk("E1", "Test Statewide Cert Alpha", "College Two", "WELD 100", "3 Units", "CCC Collaborative", t1),
    mk("E1", "Test Statewide Cert Alpha", "College Two", "WELD 200", "2 Units", "CCC Collaborative", t1),
    mk("E1", "Test Statewide Cert Alpha", "",            "WELD 300", "1 Unit",  "CCC Collaborative", t1),
    # Exhibit B (CCC, second discipline)
    mk("E2", "Test Statewide Cert Beta", "College Three", "ACCT 101", "3 Units", "CCC Collaborative", t2),
    # Exhibit C (CCC, no TOP code → Not Mapped)
    mk("E3", "Test Statewide Cert Gamma", "College One", "X 1", "2 Units", "CCC Collaborative", ""),
    # Exhibit D (Local only — must not appear in the statewide rollup)
    mk("E4", "Test Local Cert", "College Four", "LOC 1", "3 Units", "Other", t1),
    # Exhibit E (mixed group): CCC row on t2, Local row on t1. Group is
    # statewide; discipline = disc(sorted({t1,t2})[0]) = disc1; only the CCC
    # row's rec/adoption count.
    mk("E5", "Test Mixed Cert", "College Five", "MIX 1", "3 Units", "CCC Collaborative", t2),
    mk("E6", "Test Mixed Cert", "College Six",  "MIX 2", "4 Units", "Local", t1),
]

datasets = {"View_ArticulatedMAPExhibits_APIDataset": {
    "rows": rows, "col_map": {c: i for i, c in enumerate(cols)}}}

result = gen._parse_exhibits(datasets)
ccc = result["ccc_collaborative"]

# ── 1-4: rollup semantics ──
check("total rows parsed", result["total_credit_recs"], 9)
check("statewide exhibit groups", ccc["unique_exhibits"], 4)
check("raw CCC rows (historical credit_recs metric)", ccc["credit_recs"], 7)
check("discipline areas exclude Not Mapped", ccc["disciplines"], 2)
check("distinct credit recs (deduped)", ccc["distinct_credit_recs"], 6)
check("rec adoptions (blank-adopter row excluded)", ccc["rec_adoptions"], 6)

by_disc = {r["discipline"]: r for r in ccc["by_discipline"]}
check("rollup disciplines", sorted(by_disc), sorted({disc1, disc2, "Not Mapped"}))
check(f"{disc1} row (A + mixed E)", by_disc.get(disc1),
      {"discipline": disc1, "exhibits": 2, "credit_recs": 4, "adoptions": 4})
check(f"{disc2} row", by_disc.get(disc2),
      {"discipline": disc2, "exhibits": 1, "credit_recs": 1, "adoptions": 1})
check("Not Mapped row kept", by_disc.get("Not Mapped"),
      {"discipline": "Not Mapped", "exhibits": 1, "credit_recs": 1, "adoptions": 1})
check("rollup sorted by exhibits desc", ccc["by_discipline"][0]["discipline"], disc1)

# ── 5: card build + render ──
kpis = gen.merge_exhibit_metrics({}, result)
card = kpis.get("statewide_exhibits")
if not card:
    print("FAIL  statewide_exhibits card missing from kpis")
    failures.append("card present")
else:
    print("PASS  statewide_exhibits card present")
    check("card value", card["value"], "4")
    bd = {b["label"]: b["value"] for b in card["breakdowns"]}
    check("card breakdown values", bd,
          {"Discipline Areas": "2", "Credit Recommendations": "6", "Adoptions": "6"})
    check("footnote rows (header + 3 disciplines)", len(card["footnote"]), 4)
    check("footnote per-discipline line", f"{disc1}: 2 · 4 · 4" in card["footnote"], True)

html = gen.render_kpi_section_html(kpis)
check("card rendered", "Statewide Exhibits" in html, True)
check("per-discipline footnote rendered", f"{disc1}: 2 · 4 · 4" in html, True)
i_ccc = html.find("CCC Collaborative Adoption")
i_sw = html.find("Statewide Exhibits")
check("card ordered after CCC Collaborative Adoption", i_ccc != -1 and i_sw > i_ccc, True)
check("methodology entry exists", "statewide_exhibits" in gen.ALGO_DESCRIPTIONS, True)

print()
if failures:
    print(f"{len(failures)} FAILURE(S)")
    sys.exit(1)
print("ALL PASS")
