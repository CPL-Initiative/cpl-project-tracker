#!/usr/bin/env python3
"""Statewide Exhibits KPI card — generator-side verification.

Guards the failure modes of the statewide (CCC Collaborative) per-category
rollup in _parse_exhibits() + the card built in merge_exhibit_metrics():

  1. Credit recs are DISTINCT (course, credit) pairs per group; adoptions are
     raw CCC rows carrying an Articulation College — a duplicated rec across
     two colleges must count once as a rec but twice as adoptions.
  2. A rec row with a blank Articulation College counts as a rec, not an
     adoption.
  3. Local rows of a mixed (Local + CCC) group never leak into the statewide
     rec/adoption counts, but the group itself counts as statewide.
  4. Program-area categories come from kb/statewide_exhibit_categories.json
     (exact title first, then ordered ^-anchorable keyword patterns, then the
     fallback bucket); when the JSON is absent the rollup falls back to broad
     TOP-code disciplines so the card still renders.
  5. Residual buckets (fallback / Not Mapped) sort last and are excluded from
     the headline Program Areas count; in-progress workgroups append to the
     footnote; the card renders doublewide (kpi-card-wide) after the CCC
     Collaborative Adoption card.

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


# ════ Mode A — committed kb/statewide_exhibit_categories.json sanity ════
gen._STATEWIDE_CATS_CACHE = None
real_cats = gen._load_statewide_categories()
check("categories JSON loads", bool(real_cats), True)
for title, want in [
    ("CompTIA Server+", "Computer Information Systems"),       # exact title
    ("ASE A5 — Brakes", "Automotive Technology"),               # exact title
    # rule-order traps, via PATTERNS (titles not in the seeded map):
    ("ASE A9 — Light Vehicle Diesel Engines", "Automotive Technology"),
    ("AWS D1.2 GTAW Qualified Welder", "Welding"),
    ("AWS Certified Solutions Architect", "Computer Information Systems"),
    ("Wildland Firefighter 2", "Fire Technology - Wildland"),
    ("Advanced EMT Certification", "Emergency Medical Services"),
    ("Some Brand New Credential", "Other Statewide"),           # fallback
]:
    check(f"classify {title!r}", gen._statewide_category(title, real_cats), want)
check("in-progress workgroups present", len(real_cats["in_progress"]) >= 1, True)

# ════ Synthetic View_ArticulatedMAPExhibits dataset ════
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
    # Exhibit B (CCC, second TOP discipline)
    mk("E2", "Test Statewide Cert Beta", "College Three", "ACCT 101", "3 Units", "CCC Collaborative", t2),
    # Exhibit C (CCC, no TOP code; title unmapped → residual bucket)
    mk("E3", "Test Statewide Cert Gamma", "College One", "X 1", "2 Units", "CCC Collaborative", ""),
    # Exhibit D (Local only — must not appear in the statewide rollup)
    mk("E4", "Test Local Cert", "College Four", "LOC 1", "3 Units", "Other", t1),
    # Exhibit E (mixed group): CCC row on t2, Local row on t1. Group is
    # statewide; only the CCC row's rec/adoption count.
    mk("E5", "Test Mixed Cert", "College Five", "MIX 1", "3 Units", "CCC Collaborative", t2),
    mk("E6", "Test Mixed Cert", "College Six",  "MIX 2", "4 Units", "Local", t1),
]

datasets = {"View_ArticulatedMAPExhibits_APIDataset": {
    "rows": rows, "col_map": {c: i for i, c in enumerate(cols)}}}

# ════ Mode B — categories JSON absent → TOP-discipline fallback ════
gen._STATEWIDE_CATS_CACHE = {}
result = gen._parse_exhibits(datasets)
ccc = result["ccc_collaborative"]

check("total rows parsed", result["total_credit_recs"], 9)
check("statewide exhibit groups", ccc["unique_exhibits"], 4)
check("raw CCC rows (historical credit_recs metric)", ccc["credit_recs"], 7)
check("fallback: category count excludes Not Mapped", ccc["category_count"], 2)
check("distinct credit recs (deduped)", ccc["distinct_credit_recs"], 6)
check("rec adoptions (blank-adopter row excluded)", ccc["rec_adoptions"], 6)

by_cat = {r["category"]: r for r in ccc["by_category"]}
check("fallback rollup buckets", sorted(by_cat), sorted({disc1, disc2, "Not Mapped"}))
check(f"fallback {disc1} row (A + mixed E)", by_cat.get(disc1),
      {"category": disc1, "exhibits": 2, "credit_recs": 4, "adoptions": 4})
check("fallback: mixed group discipline uses ALL rows' TOPs",
      by_cat[disc1]["exhibits"], 2)
check("fallback: Not Mapped row kept, sorted last",
      ccc["by_category"][-1]["category"], "Not Mapped")
check("fallback: no in-progress entries", ccc["in_progress"], [])

# ════ Mode C — synthetic categories active ════
gen._STATEWIDE_CATS_CACHE = {
    "titles": {"test statewide cert alpha": "Welding",
               "test mixed cert": "Fire Technology"},
    "patterns": [("^test statewide cert beta", "Computer Information Systems")],
    "fallback": "Other Statewide",
    "in_progress": ["HVAC — faculty currently meeting"],
}
result = gen._parse_exhibits(datasets)
ccc = result["ccc_collaborative"]

by_cat = {r["category"]: r for r in ccc["by_category"]}
check("category rollup buckets", sorted(by_cat),
      sorted({"Welding", "Computer Information Systems", "Fire Technology", "Other Statewide"}))
check("Welding row (exact-title match, dedup + blank-adopter)", by_cat.get("Welding"),
      {"category": "Welding", "exhibits": 1, "credit_recs": 3, "adoptions": 3})
check("CIS row (^-anchored pattern match)", by_cat.get("Computer Information Systems"),
      {"category": "Computer Information Systems", "exhibits": 1, "credit_recs": 1, "adoptions": 1})
check("Fire Technology row (mixed group: Local rec/adoption excluded)",
      by_cat.get("Fire Technology"),
      {"category": "Fire Technology", "exhibits": 1, "credit_recs": 1, "adoptions": 1})
check("unmapped title lands in fallback bucket", by_cat.get("Other Statewide"),
      {"category": "Other Statewide", "exhibits": 1, "credit_recs": 1, "adoptions": 1})
check("fallback bucket sorted last", ccc["by_category"][-1]["category"], "Other Statewide")
check("category count excludes fallback bucket", ccc["category_count"], 3)
check("in-progress passthrough", ccc["in_progress"], ["HVAC — faculty currently meeting"])

# ════ Card build + render (categories active) ════
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
          {"Program Areas": "3", "Credit Recommendations": "6", "Adoptions": "6"})
    check("footnote rows (header + 4 categories + 1 in-progress)",
          len(card["footnote"]), 6)
    check("footnote per-category line", "Welding: 1 · 3 · 3" in card["footnote"], True)
    check("footnote in-progress tail", card["footnote"][-1],
          "<em>HVAC — faculty currently meeting</em>")
    check("card is doublewide", card.get("wide"), True)

html = gen.render_kpi_section_html(kpis)
check("card rendered", "Statewide Exhibits" in html, True)
check("doublewide class rendered", 'class="kpi-card kpi-card-wide"' in html, True)
check("normal cards keep plain class", 'class="kpi-card"' in html, True)
check("per-category footnote rendered", "Welding: 1 · 3 · 3" in html, True)
i_ccc = html.find("CCC Collaborative Adoption")
i_sw = html.find("Statewide Exhibits")
check("card ordered after CCC Collaborative Adoption", i_ccc != -1 and i_sw > i_ccc, True)
check("methodology entry exists", "statewide_exhibits" in gen.ALGO_DESCRIPTIONS, True)
check("doublewide CSS shipped in injected block",
      ".kpi-card-wide" in gen.EXHIBIT_ANALYSIS_CSS, True)

print()
if failures:
    print(f"{len(failures)} FAILURE(S)")
    sys.exit(1)
print("ALL PASS")
