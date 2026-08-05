#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Partner occupation → CPL crosswalk engine — generator-side verification.

Guards the failure modes of kb/_build_partner_crosswalk.py + the shared
kb/occupation_credential_map.json:

  1. STATEWIDE COMES FROM THE ADOPTION FILE. statewide_data.js
     (collaborative_type == "CCC Collaborative") and credential_reference_data.js
     (`statewide: true`) disagree — the credential reference flags a strict
     SUBSET. The tool deliberately takes the larger adoption-file set because the
     delta is the newer contractor-licence / apprenticeship / NCCER cohort that
     workforce partner lists are full of. If the subset relationship ever
     inverts, that choice needs re-examining rather than silently shipping.

  2. ADOPTERS ARE A UNION across every exhibit record sharing a unified title
     (statewide adoptions AND local articulations), because the partner's
     question is "where can my student get credit?", not "who adopted the
     statewide recommendation?". A credential's adopter count here can legally
     exceed the count on the statewide tab.

  3. OCCUPATION KEYS NORMALIZE. "PLUMBER" / "Plumber" / "plumber " must collapse
     to one ruling, or the shared map fragments and coverage stops compounding
     across partners — the entire point of the file.

  4. NO STALE CREDENTIAL TITLES. Every title in the map must resolve against the
     live index. A re-mint or title consolidation upstream silently orphans a
     ruling; the engine reports these as `stale_credential_titles` and this test
     fails the build so they get re-curated.

  5. "NO CPL" ≠ "NOT YET REVIEWED". An empty credentials list is a CURATED
     FINDING ("we looked, nothing exists"); an absent key means nobody has
     looked. Collapsing the two would launder unreviewed occupations into
     confident "no CPL anywhere" claims in a partner-facing deliverable.

  6. HEADER ROWS AND DUPLICATES. Partner lists arrive with a header row and
     repeated occupations; read_occupations must drop the header, dedupe, and
     keep an honest times-listed count.

  7. REGION PRESETS RESOLVE. A mistyped college name in
     kb/partner_crosswalk_regions.json yields an EMPTY region silently rather
     than an error — the Regional Capacity sheet would just quietly under-report.

Not wired into `npm test` (the JS runner only discovers *.test.js) because it
needs the Python pipeline deps (openpyxl). Run from the repo root:

    python3 tests/partner_crosswalk_test.py
"""
import json
import os
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))

import importlib.util
spec = importlib.util.spec_from_file_location(
    "partner_crosswalk", os.path.join(ROOT, "kb", "_build_partner_crosswalk.py"))
pc = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pc)

failures = []


def check(label, got, want):
    ok = got == want
    print("%s  %s" % ("PASS" if ok else "FAIL", label))
    if not ok:
        print("        expected: %r" % (want,))
        print("        got     : %r" % (got,))
        failures.append(label)


def check_true(label, got):
    check(label, bool(got), True)


# ---------------------------------------------------------------------------
print("── 3. occupation key normalization ──")
check("uppercase collapses", pc.norm_key("PLUMBER"), "plumber")
check("trailing space collapses", pc.norm_key("plumber "), "plumber")
check("punctuation collapses", pc.norm_key("Drama/Theater  Arts!"), "drama theater arts")
check("case+punct agree", pc.norm_key("Electrician - Electric & Hydro"),
      pc.norm_key("ELECTRICIAN   ELECTRIC  HYDRO"))
check("empty stays empty", pc.norm_key("  "), "")
check("None is safe", pc.norm_key(None), "")

# ---------------------------------------------------------------------------
print()
print("── 6. partner list reading ──")
with tempfile.TemporaryDirectory() as td:
    p = os.path.join(td, "list.csv")
    with open(p, "w", encoding="utf-8") as fh:
        fh.write("Occupation\nPLUMBER\nPlumber\nWelder\n\nplumber \n")
    occ = pc.read_occupations(p, 1, None)
check("header row dropped", [o[0] for o in occ], ["PLUMBER", "Welder"])
check("duplicates collapse to first-seen label", occ[0][0], "PLUMBER")
check("times_listed counts every appearance", occ[0][1], 3)
check("blank lines ignored", len(occ), 2)
check("key is the normalized form", occ[0][2], "plumber")

# ---------------------------------------------------------------------------
print()
print("── 1. statewide definition + 2. adopter union ──")
idx = pc.build_credential_index()
check_true("index is non-trivial", len(idx) > 1500)

adoption_sw = {t for t, r in idx.items() if r["statewide"]}
cref_sw = {t for t, r in idx.items() if r["cref_statewide"]}
check_true("adoption file flags statewide titles", len(adoption_sw) > 0)
check_true("credential reference flags statewide titles", len(cref_sw) > 0)
check("credential-reference statewide is a SUBSET of the adoption file",
      cref_sw - adoption_sw, set())
check_true("the adoption file is the LARGER set (why the tool uses it)",
           len(adoption_sw) > len(cref_sw))

# A credential the tool reports as statewide must really carry a CCC
# Collaborative record in the adoption file — not merely a cref flag.
raw = pc.load_window_json("statewide_data.js")["exhibits"]
ccc_titles = {e["unified_title"] for e in raw
              if e.get("collaborative_type") == "CCC Collaborative"}
check("statewide flag == CCC Collaborative in the adoption file",
      adoption_sw, ccc_titles)

# Adopter union: for at least one title carrying both a CCC Collaborative and a
# Local record, the index's adopter count exceeds the CCC record's alone.
sw_only, unioned = {}, 0
for e in raw:
    if e.get("collaborative_type") == "CCC Collaborative":
        sw_only.setdefault(e["unified_title"], set()).update(e.get("adopter_names") or [])
for t, cols in sw_only.items():
    if len(idx[t]["adopters"]) > len(cols):
        unioned += 1
check_true("local articulations fold into the adopter list (union semantics)", unioned > 0)
check_true("no title loses adopters in the union",
           all(set(sw_only[t]) <= set(idx[t]["adopters"]) for t in sw_only))

# ---------------------------------------------------------------------------
print()
print("── 4. shared map has no stale credential titles ──")
occ_map = pc.load_occupation_map()
entries = occ_map.get("occupations", {})
check_true("map is populated", len(entries) > 0)
stale = sorted({c["title"] for e in entries.values() for c in e.get("credentials", [])
                if c["title"] not in idx})
check("every mapped credential resolves in the live index", stale, [])
bad_tier = sorted({c.get("tier") for e in entries.values() for c in e.get("credentials", [])
                   if c.get("tier") not in ("D", "R")})
check("every ruling carries a D/R tier", bad_tier, [])
bad_key = [k for k in entries if pc.norm_key(k) != k]
check("every map key is already normalized", bad_key, [])

# ---------------------------------------------------------------------------
print()
print("── 5. curated 'no CPL' is distinct from 'not yet reviewed' ──")
sample_key = next(k for k, v in entries.items() if not v.get("credentials"))
occs = [("Totally Novel Occupation", 1, "totally novel occupation"),
        (entries[sample_key]["label"], 1, sample_key)]
rows, summary, unmapped, bad = pc.resolve(occs, occ_map, idx)
by_status = {s["occupation"]: s["status"] for s in summary}
check("absent from the map reads 'Not yet mapped'",
      by_status["Totally Novel Occupation"], "Not yet mapped")
check("curated empty list reads 'No CPL found'",
      by_status[entries[sample_key]["label"]], "No CPL found")
check("only the unreviewed one lands on the curator worklist",
      [u["occupation"] for u in unmapped], ["Totally Novel Occupation"])
check("no stale titles surfaced for this sample", bad, [])

# A mapped occupation with real credentials reports a live status.
mapped_key = next(k for k, v in entries.items()
                  if v.get("credentials") and
                  any(c["title"] in idx and idx[c["title"]]["statewide"]
                      for c in v["credentials"]))
rows2, summary2, _, _ = pc.resolve(
    [(entries[mapped_key]["label"], 1, mapped_key)], occ_map, idx)
check("a statewide-backed occupation reports 'Statewide CPL available'",
      summary2[0]["status"], "Statewide CPL available")
check_true("…and counts at least one statewide credential", summary2[0]["statewide"] > 0)
check_true("…and names at least one college", summary2[0]["colleges"] > 0)

# ---------------------------------------------------------------------------
print()
print("── 7. region presets resolve against real college names ──")
with open(os.path.join(ROOT, "kb", "partner_crosswalk_regions.json"), encoding="utf-8") as fh:
    presets = json.load(fh)["presets"]
check_true("at least one preset defined", len(presets) > 0)
every_adopter = set()
for r in idx.values():
    every_adopter |= set(r["adopters"])
for name, preset in sorted(presets.items()):
    unknown = [c for c in preset["colleges"] if c not in every_adopter]
    # A college with zero articulations is legitimate (that IS the finding) — but
    # it must at least be a real MAP college name, so check against the potential
    # (eligible-adopter) roster too before calling it a typo.
    every_potential = set()
    for r in idx.values():
        every_potential |= set(r["potential"])
    typos = [c for c in unknown if c not in every_potential]
    check("preset %r: every college is a real MAP college name" % name, typos, [])

print()
if failures:
    print("%d FAILURE(S)" % len(failures))
    sys.exit(1)
print("ALL PASS")
