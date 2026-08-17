#!/usr/bin/env python3
"""EACR matrix payload — sandbox exclusion, name folding, per-college units.

Guards three changes made for the CER Adoption Matrix sub-tab (session 163,
2026-08-17), all of them in `_build_statewide_adoption`:

  1. SANDBOX EXCLUSION. MAP's own test orgs must never be counted as adopters
     or offered as potential adopters. This is not cosmetic: before the fix,
     `CA MAP INITIATIVE COLLEGE` (map_colleges id 120, entity_kind='test') was
     counted as a real adopter on the statewide card "California Real Estate
     Broker License", publishing 7 adopters where the true count is 6.

  2. NAME FOLDING. Three institutions are entered twice in the raw MAP export,
     once plain and once suffixed " Credit" (Calbright, North Orange Continuing
     Education, San Diego College of Continuing Education). map_colleges holds
     exactly one row for each, so the duplicate is an export artifact. Sam,
     2026-08-17: "CAlbright, etc. should only be in once and CAMAP can be left
     out altogether—it's our sandbox."

     The fold is written as a SUM. All six spellings happen to carry zero
     adoptions today, so nothing is at stake — but a fold that DROPS instead of
     merging is silently wrong the first day one of them articulates something,
     and that day will not announce itself.

  3. PER-COLLEGE UNITS. The raw row carries (Articulation College, Course,
     Credit Recommendation) together; the payload was discarding the
     attribution. `adopter_units` re-emits it. Deduped on the (college, course,
     credit) TRIPLE, not the (course, credit) pair — two colleges articulating
     the same recommendation must both count, while one college's row repeated
     across merged exhibit IDs must count once.

Also covers `peer_units_median`, which is the "opportunity" number the matrix
renders in brown. It is deliberately NOT the sum of the credit recommendations:
measured over live peer data, colleges articulate a median 3.07 of 9.26
available lines and no college has ever reached the line total, so publishing
the total as an opportunity would promise roughly triple what the strongest peer
has ever obtained.

Not wired into `npm test` (the JS runner only discovers *.test.js) because it
imports the Python pipeline. Run from the repo root:

    python3 tests/eacr_matrix_payload_test.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import excel_to_dashboard as gen

CHECKS = []


def check(name, cond, detail=""):
    CHECKS.append((name, bool(cond), detail))


def val(fn, default=None):
    """Evaluate a check expression that may legitimately blow up on a payload
    shape the fix has not produced yet. A missing key must FAIL ITS OWN CHECK,
    never take the file down — the trap that has now bitten three harnesses in
    this repo (handoff 163)."""
    try:
        return fn()
    except Exception:
        return default


# ── Column layout of View_ArticulatedMAPExhibits, as _build_statewide_adoption
#    indexes it. Names, not positions, are what the builder reads.
COLS = ["College", "ExhibitID", "Exhibit Title", "spare3", "Articulation College",
        "Course", "Credit Recommendation", "Collaborative Type", "TOP Code",
        "CID Number", "s10", "s11", "s12", "CPL Type Description"]
CM = {c: i for i, c in enumerate(COLS)}


def row(exhibit_id, title, artic, course, credit, collab="CCC Collaborative",
        top="0956.00", cid="", cpl="Industry Certification", college="Host College"):
    r = [""] * len(COLS)
    r[CM["College"]] = college
    r[CM["ExhibitID"]] = exhibit_id
    r[CM["Exhibit Title"]] = title
    r[CM["Articulation College"]] = artic
    r[CM["Course"]] = course
    r[CM["Credit Recommendation"]] = credit
    r[CM["Collaborative Type"]] = collab
    r[CM["TOP Code"]] = top
    r[CM["CID Number"]] = cid
    r[CM["CPL Type Description"]] = cpl
    return r


def programs_of_study(pairs):
    """View_ProgramsofStudy rows — the TOP-code potential-adopter source."""
    names = ["College"] + [f"c{i}" for i in range(1, 9)] + ["Top Code"]
    return {"viewName": "View_ProgramsofStudy_APIDataset",
            "columnName": names,
            "columnValue": [[c] + [""] * 8 + [t] for c, t in pairs]}


def build(rows, all_data=None):
    try:
        out = gen._build_statewide_adoption(all_data or [], rows, CM)
    except Exception:
        return {}
    return {e["unified_title"]: e for e in (out or [])}


def fn(name, fallback):
    """Fetch a pipeline function, or a stand-in that lets the checks below FAIL
    individually instead of killing the run with AttributeError. Verifying a
    harness against the pre-fix source is the point — and it only works if the
    harness survives the pre-fix source long enough to report."""
    return getattr(gen, name, fallback)


_canon = fn("_canon_college", lambda n, s, f: (n or "").strip())
_units = fn("_rec_units", lambda t: None)
_med = fn("_median", lambda v: None)
_rules = fn("_load_map_roster_rules", lambda: (set(), {}))

# ─────────────────────────── 1. the reference file ───────────────────────────
sandbox, fold = val(lambda: _rules(), (set(), {}))
check("roster rules load", sandbox and fold, f"{len(sandbox)} sandbox, {len(fold)} fold")
check("CA MAP INITIATIVE COLLEGE is listed sandbox", "CA MAP INITIATIVE COLLEGE" in sandbox)
check("all 8 test orgs listed", len(sandbox) == 8, f"got {len(sandbox)}")
check("3 fold pairs", len(fold) == 3, f"got {len(fold)}")
check("fold targets are canonical, not themselves folded",
      all(v not in fold for v in fold.values()),
      "a chained fold would depend on iteration order")

# ─────────────────────────── 2. _canon_college ───────────────────────────────
check("sandbox name canonicalises to empty",
      _canon("CA MAP INITIATIVE COLLEGE", sandbox, fold) == "")
check("' Credit' twin folds onto the canonical",
      _canon("Calbright College Credit", sandbox, fold) == "Calbright College Non-Credit")
check("ordinary college passes through",
      _canon("Chabot College", sandbox, fold) == "Chabot College")
check("whitespace is stripped before matching",
      _canon("  Calbright College Credit  ", sandbox, fold) == "Calbright College Non-Credit")
check("blank stays blank", _canon("", sandbox, fold) == "")
check("None does not raise", _canon(None, sandbox, fold) == "")

# ─────────────────────────── 3. _rec_units / _median ─────────────────────────
check("units parse from rec text", _units("4 hours in Heavy-Duty Truck Systems") == 4.0)
check("decimal units parse", _units("2.5 units") == 2.5)
check("non-numeric rec is 0, not a crash", _units("Credit Is Not Recommended") == 0.0)
check("median of empty is 0", _med([]) == 0.0)
check("median is the middle, not the mean", _med([1.0, 2.0, 9.0]) == 2.0,
      "mean would be 4.0 — one deep adopter must not inflate 'what peers get'")
check("even-length median averages the pair", _med([1.0, 3.0]) == 2.0)

# ─────────────────────────── 4. sandbox never becomes an adopter ─────────────
res = build([
    row("E-1", "Real Estate Broker", "CA MAP INITIATIVE COLLEGE", "RE 100", "3 hours in Real Estate"),
    row("E-1", "Real Estate Broker", "Chabot College", "RE 100", "3 hours in Real Estate"),
    row("E-1", "Real Estate Broker", "Citrus College", "RE 101", "4 hours in Practice"),
])
e = res.get("Real Estate Broker")
check("card built", e is not None)
names = val(lambda: e["adopter_names"], [])
check("sandbox excluded from adopter_names", "CA MAP INITIATIVE COLLEGE" not in names, str(names))
check("real adopters survive", sorted(names) == ["Chabot College", "Citrus College"], str(names))
check("adopter COUNT excludes the sandbox", val(lambda: e["adopters"]) == 2,
      "this is the 7-vs-6 defect on California Real Estate Broker License")
check("sandbox carries no units",
      "CA MAP INITIATIVE COLLEGE" not in val(lambda: e["adopter_units"], {}))

# ─────────────────────────── 5. folding SUMS, never drops ────────────────────
res = build([
    row("E-2", "Medical Assisting", "North Orange Continuing Education", "MA 1", "3 hours in MA Basics"),
    row("E-2", "Medical Assisting", "North Orange Continuing Education Credit", "MA 2", "2 hours in MA Clinical"),
])
e = res.get("Medical Assisting")
names = val(lambda: e["adopter_names"], [])
check("twin spellings collapse to one adopter", len(names) == 1, str(names))
check("the canonical name is the survivor", names == ["North Orange Continuing Education"], str(names))
units = val(lambda: e["adopter_units"], {})
check("folded units are SUMMED, not replaced",
      abs(units.get("North Orange Continuing Education", 0) - 5.0) < 1e-9,
      f"expected 3+2=5.0, got {units}")

# ─────────────────────────── 6. per-college unit attribution ─────────────────
res = build([
    # two colleges, same recommendation — both must count
    row("E-3", "CompTIA A Plus", "Chabot College", "CIS 1", "3 hours in Intro to Computing"),
    row("E-3", "CompTIA A Plus", "Citrus College", "CIS 10", "3 hours in Intro to Computing"),
    # one college, second distinct recommendation — adds
    row("E-3", "CompTIA A Plus", "Chabot College", "CIS 2", "4 hours in Hardware"),
    # SAME college + course + credit repeated across a merged exhibit id — counts once
    row("E-3b", "CompTIA A Plus", "Chabot College", "CIS 1", "3 hours in Intro to Computing"),
])
e = res.get("CompTIA A Plus")
units = val(lambda: e["adopter_units"], {})
check("college A sums its two distinct recs", abs(units.get("Chabot College", 0) - 7.0) < 1e-9,
      f"expected 3+4=7.0, got {units}")
check("college B counted despite sharing a rec with A",
      abs(units.get("Citrus College", 0) - 3.0) < 1e-9, f"got {units}")
check("a repeated (college,course,credit) triple is not double counted",
      abs(units.get("Chabot College", 0) - 7.0) < 1e-9,
      "10.0 here would mean the dedup key is the pair, not the triple")
lines = val(lambda: e["adopter_lines"], {})
check("line counts track alongside units", lines.get("Chabot College") == 2, str(lines))

# ─────────────────────────── 7. the brown number ─────────────────────────────
check("peer median is over ADOPTERS, not over recommendations",
      val(lambda: e["peer_units_median"]) == 5.0,
      f"adopters hold 7.0 and 3.0 → median 5.0; got {val(lambda: e.get('peer_units_median'))}")
check("peer max is reported", val(lambda: e["peer_units_max"]) == 7.0)
check("rec_units_total is emitted separately",
      abs(val(lambda: e["rec_units_total"], 0) - 10.0) < 1e-9,
      "3+3+4 across the three DISTINCT (course,credit) recs")
check("peer median is BELOW the line total",
      val(lambda: e["peer_units_median"], 0) < val(lambda: e["rec_units_total"], 0),
      "the whole reason the brown number is not rec_units_total")

# ─────────────────────────── 8. potential adopters are cleaned too ───────────
res = build(
    [row("E-4", "Welding Cert", "Chabot College", "WELD 1", "3 hours in Welding")],
    all_data=[programs_of_study([
        ("CA MAP INITIATIVE COLLEGE", "0956.00"),
        ("Calbright College Credit", "0956.00"),
        ("Citrus College", "0956.00"),
    ])],
)
e = res.get("Welding Cert")
pot = val(lambda: e["potential_names"], [])
check("sandbox is not offered as a potential adopter", "CA MAP INITIATIVE COLLEGE" not in pot, str(pot))
check("potential twin is folded to the canonical",
      "Calbright College Credit" not in pot and "Calbright College Non-Credit" in pot, str(pot))
check("real potential survives", "Citrus College" in pot, str(pot))
check("potential COUNT matches the cleaned list", val(lambda: e["potential"]) == len(pot))

# ─────────────────────────── 9. a card with no adopters ──────────────────────
res = build([row("E-5", "Unadopted Cert", "", "X 1", "3 hours in Something")])
e = res.get("Unadopted Cert")
check("zero-adopter card still builds", e is not None,
      "Sam's standing rule: unadopted exhibits stay prominent")
check("zero-adopter card has empty units", val(lambda: e["adopter_units"], None) == {})
check("zero-adopter peer median is 0, not an error", val(lambda: e["peer_units_median"]) == 0.0)

# ─────────────────────────── report ──────────────────────────────────────────
passed = sum(1 for _, ok, _ in CHECKS if ok)
failed = [(n, d) for n, ok, d in CHECKS if not ok]
print(f"\neacr_matrix_payload_test — {passed}/{len(CHECKS)} checks passed")
for n, d in failed:
    print(f"  FAIL  {n}" + (f"\n        {d}" if d else ""))
sys.exit(1 if failed else 0)
