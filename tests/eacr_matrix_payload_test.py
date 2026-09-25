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
# Four since 2026-08-17: the three " Credit" twins plus the Ca\u00f1ada mojibake
# encoding (the rules file's `_mojibake` note). The count was left at 3 when
# the fourth landed, so this check read FAIL on every run for a month.
check("4 fold pairs", len(fold) == 4, f"got {len(fold)}")
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

# ─────────────────────────── 8b. the 2026-09-24 fields ───────────────────────
# Sam's EACR tweaks: the matrix drill-down shows each MAP record's TITLE and
# TOTAL UNITS rather than its ID; a cell's hover lists what THAT college
# articulated; the Career Cluster filter becomes CIP Sectors. Each needs a field
# the payload did not carry.
res = build([
    row("E-6", "Bookkeeping Cert", "Chabot College", "ACCT 1", "3 hours in Accounting", top="5"),
    row("E-6", "Bookkeeping Cert", "Citrus College", "ACCT 10", "3 hours in Accounting", top="5"),
    row("E-6", "Bookkeeping Cert", "Chabot College", "ACCT 2", "4 hours in Bookkeeping", top="5"),
    # a second MAP record under the same card, repeating one line
    row("E-7", "Bookkeeping Cert", "Chabot College", "ACCT 1", "3 hours in Accounting", top="5"),
])
e = res.get("Bookkeeping Cert")
recs = val(lambda: e["exhibit_records"], [])
check("exhibit_records: one entry per MAP record", [r["id"] for r in recs] == ["E-6", "E-7"], str(recs))
check("exhibit_records: carries the title as entered",
      val(lambda: recs[0]["title"]) == "Bookkeeping Cert")
check("exhibit_records: total units sum the record's DISTINCT lines (3+3+4)",
      abs(val(lambda: recs[0]["units"], 0) - 10.0) < 1e-9, str(recs))
check("exhibit_records: a one-line record totals that line",
      abs(val(lambda: recs[1]["units"], 0) - 3.0) < 1e-9 and val(lambda: recs[1]["lines"]) == 1)
idx = val(lambda: e["adopter_rec_idx"], {})
cr = val(lambda: e["credit_recs"], [])
check("adopter_rec_idx: indices point INTO credit_recs",
      all(0 <= i < len(cr) for ix in idx.values() for i in ix), str(idx))
check("adopter_rec_idx: a college lists only what IT articulated",
      val(lambda: sorted(cr[i]["course"] for i in idx["Citrus College"])) == ["ACCT 10"], str(idx))
check("adopter_rec_idx: ...and every line it articulated, once",
      val(lambda: sorted(cr[i]["course"] for i in idx["Chabot College"])) == ["ACCT 1", "ACCT 2"], str(idx))
check("top_codes: the group's MAP TOP ids travel with the card",
      val(lambda: e["top_codes"]) == ["5"])
check("cip_sector: a two-digit CIP family resolves through the 4-digit TOP",
      val(lambda: e["cip_sector"]) == "52",
      "MAP TOP 5 → CCC 0502 (Accounting) → CIP 52 Business; got %r" % val(lambda: e.get("cip_sector")))
res = build([row("E-8", "Unmapped TOP Cert", "Chabot College", "X 1", "3 hours in X", top="no-such-code")])
check("cip_sector: an unmapped TOP reads as empty, never as a crash",
      val(lambda: res["Unmapped TOP Cert"]["cip_sector"]) == "")
fam = val(lambda: gen._load_cip_families()[1], {})
check("the complete CIP family vocabulary loads (50 two-digit families)", len(fam) == 50, f"got {len(fam)}")

# ─────────────────────────── 8c. CIP sectors from the title (2026-09-25) ─────
# Sam: "We only need the CIP sector on this tab for filter and quick
# categorization. I would be just as happy if you used your own analysis from
# your knowledge to create the sectors yourself." The rules live in
# kb/reference/eacr_cip_title_rules.json. An exam reads its title first (MAP's
# TOP id for an exam is a coarse general-education code: AP Chemistry sat under
# 24 Liberal Arts); every other card reads TOP first and the title only where
# TOP finds nothing.
tr = val(lambda: gen._load_cip_title_rules(), ({}, []))
check("the title rules load (30+ ordered rules)", len(tr[1]) >= 30, f"got {len(tr[1])}")
check("every title-rule family is a real CIP family",
      all(f in fam for _rx, f in tr[1]) and all(f in fam for f in tr[0].values()),
      str(sorted({f for _rx, f in tr[1]} - set(fam))))
for title, want in [("AP Chemistry", "40"), ("AP Statistics", "27"), ("AP U.S. History", "54"),
                    ("CLEP Spanish with Writing 2", "16"), ("AP Art History", "50"),
                    ("AP Environmental Science", "03"), ("AP African American Studies", "05"),
                    ("DSST Ethics in America", "38"), ("IB Language A: Literature HL", "23"),
                    ("Elementary Italian I", "16"), ("PHIL 1B: Social and Political Philosophy", "38"),
                    ("Growth and Development of the Child", "19"), ("Engineering Drawing", "15"),
                    ("Credit by Exam - ESL 083 F (High Intermediate)", "32"),
                    ("Automotive Collision Investigation - Credit by Exam (ACRP 20 )", "43")]:
    got = val(lambda: gen._cip_sector_for_title(title, tr))
    check(f"title rule: {title} → {want}", got == want, f"got {got!r}")
check("a title no rule names reads empty, so TOP keeps it (OSHA 10)",
      val(lambda: gen._cip_sector_for_title("OSHA 10 — Outreach (10-hour)", tr)) == "")
res = build([row("E-9", "AP Chemistry", "Chabot College", "CHEM 1A", "5 hours in Chemistry", top="5",
                 cpl="Standardized Assessment"),
             row("E-10", "Introduction to Philosophy", "Chabot College", "PHIL 1", "3 hours in Philosophy",
                 top="no-such-code", cpl="Credit By Exam"),
             row("E-11", "OSHA 10", "Chabot College", "CON 1", "1 hour in Safety", top="5",
                 cpl="Standardized Assessment")])
check("an exam reads its title before TOP (AP Chemistry → 40, TOP said 52)",
      val(lambda: res["AP Chemistry"]["cip_sector"]) == "40", str(val(lambda: res["AP Chemistry"]["cip_sector"])))
check("a card TOP cannot place reads its title (Introduction to Philosophy → 38)",
      val(lambda: res["Introduction to Philosophy"]["cip_sector"]) == "38")
check("an exam no title rule names keeps its TOP sector (OSHA 10 → 52)",
      val(lambda: res["OSHA 10"]["cip_sector"]) == "52")
check("...keyed by two-digit code, titled in words",
      all(len(k) == 2 and k.isdigit() for k in fam) and bool(fam.get("43")))

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
