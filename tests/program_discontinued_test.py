#!/usr/bin/env python3
"""A discontinued program is flagged from its own catalog section, and the flag takes it out of the gap.

WHY. Sam approved flagging discontinued programs out of the CPL Queue on 2026-11-17 (relayed by COBIx on
#3480, comment 6967372099): flag, keep the record, never delete, never show as needing attention.
kb/_program_discontinued.py reads the mark; kb/_harvest_gap_census.py lists each flagged program beside the
gap. A matcher that read a course row's "(Being Deactivated)" or a reader's guess as a program mark would
pull offered programs out of the queue, so both are pinned here, beside the ask's own two tests:

  * a fixture program whose catalog text says "teach-out" is flagged and leaves the queue count;
  * a program merely missing a unit total is not flagged;
  * a course row marked deactivated, and "may have been discontinued", flag nothing;
  * a prior-year read's program is flagged with its source line, a _preview read is not;
  * the collection lane's colleges are left out (one writer per college, S680).

Run from repo root: python3 tests/program_discontinued_test.py
"""
import json
import os
import shutil
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_discontinued as D  # noqa: E402
import _harvest_gap_census as G  # noqa: E402

checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


TEACH_OUT = ("Accounting, Certificate of Achievement\n"
             "This program is in teach-out. Students who began it before Fall 2025 may complete it.\n"
             "Required Courses\nACCT 101 Financial Accounting 4\nACCT 102 Managerial Accounting 4\nTotal Units 18")
NO_TOTAL = ("Business, A.S.\nThe Business degree prepares students for careers in management.\n"
            "BUS 101 Introduction to Business 3\nBUS 120 Business Law 3")
COURSE_MARK = ("Communication Studies, A.A.\nComplete the following.\n"
               "SPCH 121 Critical Thinking and Persuasion (Being Deactivated)\nSPCH 128 Debate 3\nTotal Units 18")
GUESS = "Women's Studies, A.A.\nThe program may have been discontinued or folded into Liberal Arts."
HEADING_MARK = "Drafting Technology, Certificate (Inactive)\nNo longer accepting students.\nDRFT 101 Drafting 3"

check(D.section_mark(TEACH_OUT, "Accounting, Certificate of Achievement") is not None, "teach-out text is flagged")
check("teach-out" in (D.section_mark(TEACH_OUT) or ""), "the source line is the line that carries the mark")
check(D.section_mark(NO_TOTAL, "Business, A.S.") is None, "a program missing a unit total is not flagged")
check(D.section_mark(COURSE_MARK) is None, "a course row marked deactivated says nothing about the program")
check(D.section_mark(GUESS) is None, "a guess is never a mark")
check(D.section_mark(HEADING_MARK) is not None, "a heading or line saying no longer accepting students is flagged")
check(D.section_mark("") is None and D.section_mark(None) is None, "no text, no flag")
# The mark must sit before the first course row: a later section's teach-out belongs to another program.
LATER = ("Business Administration 2.0, A.S.-T\nBUS 101 Intro 3\nBUS 120 Law 3\n"
         "Business Administration 1.0 A.S.-T (teach-out for veterans)")
check(D.section_mark(LATER, "Business Administration 2.0") is None, "a mark below the first course row is not the program's")

tmp = tempfile.mkdtemp()
try:
    base = os.path.join(tmp, "colleges")
    for slug, college in (("butte", "Butte College"), ("lassen", "Lassen College")):
        d = os.path.join(base, slug, "records")
        os.makedirs(d)
        with open(os.path.join(base, slug, "capture.json"), "w") as fh:
            json.dump({"college": college, "catalog_year": "2026-2027"}, fh)
        prior = {"college": college, "catalog_year": "2025-2026", "run": "1",
                 "prior": {"catalog_year": "2025-2026", "only": ["31950"]}, "filed": ["31950"]}
        with open(os.path.join(base, slug, "prior_2025-2026.json"), "w") as fh:
            json.dump(prior, fh)
        with open(os.path.join(base, slug, "prior_2026-2027_preview.json"), "w") as fh:
            json.dump(dict(prior, prior={"catalog_year": "x", "only": ["99999"]}), fh)
        with open(os.path.join(d, "31950.json"), "w") as fh:
            json.dump({"title": "Physics", "award": "A.S. T Degree"}, fh)
    # S687: rule D's mark in a committed capture-only preview lists the program under not_printed, never as a flag.
    with open(os.path.join(base, "butte", "capture_preview.json"), "w") as fh:
        json.dump({"college": "Butte College", "catalog_year": "2026-2027", "run": "7", "not_found": [
            {"control_number": "20001", "title": "Basic Peace Officer", "award": "Certificate",
             "near_miss": {"rule": "D", "why": "rule D: no line of the catalog prints the program's title"}},
            {"control_number": "20002", "title": "Finance", "award": "A.S. Degree",
             "near_miss": {"url": "https://x/catalog.pdf#page=3", "coverage": 0.2}}]}, fh)
    # COBIx on #3569: only the newest read counts. Lassen's later capture finds a page for the preview's mark (cleared);
    # an older capture under a newer preview leaves the preview's mark standing (Butte above: capture.json has no run).
    with open(os.path.join(base, "lassen", "capture_preview.json"), "w") as fh:
        json.dump({"college": "Lassen College", "catalog_year": "2026-2027", "run": "5", "not_found": [
            {"control_number": "20003", "title": "Welding", "award": "Certificate", "near_miss": {"rule": "D"}}]}, fh)
    with open(os.path.join(base, "lassen", "capture.json"), "w") as fh:
        json.dump({"college": "Lassen College", "catalog_year": "2026-2027", "run": "9", "not_found": []}, fh)
    # COBIx's third point on #3569 (S688): a newer read scoped to some programs (limit, force) speaks only for those.
    os.makedirs(os.path.join(base, "chico"))
    with open(os.path.join(base, "chico", "capture_preview.json"), "w") as fh:
        json.dump({"college": "Chico College", "catalog_year": "2026-2027", "run": "3", "fingerprints": {},
                   "not_found": [{"control_number": c, "title": t, "near_miss": {"rule": "D"}}
                                 for c, t in (("20004", "Forestry"), ("20005", "Geology"))]}, fh)
    with open(os.path.join(base, "chico", "capture.json"), "w") as fh:
        json.dump({"college": "Chico College", "catalog_year": "2026-2027", "run": "8",
                   "fingerprints": {"20005": {"sha256": "x"}}, "not_found": []}, fh)
    _np = [r["control_number"] for r in D.committed_not_printed(base)]
    check("20004" in _np, "an older read's rule D mark stands for a program a newer scoped read never covered")
    check("20005" not in _np, "a newer scoped read that found a page for a program clears the older mark")
    check(D.read_covers({"fingerprints": {"1": {}}, "not_found": [{"control_number": "2"}],
                         "page_claimed": [{"control_number": "3"}]}) == {"1", "2", "3"},
          "a read covers what it fingerprinted, filed as not found, or filed as claimed")
    check("20003" not in _np, "a later full capture clears an older preview's rule D mark")
    check("20001" in _np, "a newer preview's mark stands over an older capture")
    cap = os.path.join(tmp, "out")
    os.makedirs(os.path.join(cap, "sources"))
    with open(os.path.join(cap, "capture.json"), "w") as fh:
        json.dump({"college": "Butte College"}, fh)
    for cn, text in (("10001", TEACH_OUT), ("10002", NO_TOTAL), ("10003", COURSE_MARK)):
        with open(os.path.join(cap, "sources", cn + ".json"), "w") as fh:
            json.dump({"control_number": cn, "text": text}, fh)
    out = D.build([cap], base=base)
    got = {(f["college"], f["control_number"]): f for f in out["flags"]}
    check(("Butte College", "31950") in got and got[("Butte College", "31950")]["how"] == "prior_year_only",
          "a prior-year read's program is flagged prior_year_only")
    check("2025-2026" in got[("Butte College", "31950")]["source_line"], "the prior-year flag names the year")
    check(("Butte College", "99999") not in got, "a _preview read flags nothing")
    check(("Butte College", "10001") in got and got[("Butte College", "10001")]["how"] == "catalog_mark",
          "the capture's teach-out program is flagged catalog_mark")
    check(("Butte College", "10002") not in got and ("Butte College", "10003") not in got,
          "the capture's unflagged programs stay unflagged")
    np = {(r["college"], r["control_number"]): r for r in out["not_printed"]}
    check(("Butte College", "20001") in np and np[("Butte College", "20001")]["gap"] == "not printed in the 2026-2027 catalog"
          and ("Butte College", "20001") not in got,
          "a committed preview's rule D program is listed not printed, with the catalog year, and never flagged")
    check(("Butte College", "20002") not in np, "a no-page program without rule D's mark is not listed")
    check(any(r["control_number"] == "20001" for r in D.build([], base=base)["not_printed"]),
          "the committed list reads without --capture")
    check(not any(k[0] == "Lassen College" for k in got) and out["left_out_held"] == 1,
          "the collection lane's college is left out, and counted as left out")

    # The census: the flagged program leaves the gap, and the count drops by exactly the flagged number.
    universe = [{"college": "Butte College", "control_number": cn} for cn in ("10001", "10002")]
    committed = {"butte": {"college": "Butte College", "read": True, "records": {}, "methods": {}, "sources": {}}}
    base_r = G.census(universe, committed, None, {})
    with_r = G.census(universe, committed, None, {}, discontinued=got)
    check(with_r["gap"] == base_r["gap"] - 1, "the queue count drops by the flagged number (%s vs %s)"
          % (with_r["gap"], base_r["gap"]))
    check(with_r["discontinued"]["programs"] == 1
          and with_r["discontinued"]["members"][0]["control_number"] == "10001"
          and "teach-out" in with_r["discontinued"]["members"][0]["source_line"],
          "the flagged program shows discontinued with its source line")
    check(not any(g["control_number"] == "10001" for g in with_r["programs"]), "the flagged program is no gap row")
finally:
    shutil.rmtree(tmp)

# S691: a not-printed program the prior-year preview read and its extract did not file is printed in neither year. It
# takes the named gap, never a flag; a program the prior year filed is flagged and never named; a program no preview
# read, a preview with no extract beside it (College of the Desert's, behind robots.txt) and a refused preview are no
# evidence.
tmp = tempfile.mkdtemp()
try:
    base = os.path.join(tmp, "colleges")
    for slug, college, access, with_ext in (("marin", "Marin College", "ok", True),
                                            ("desert", "Desert College", "ok", False),
                                            ("walled", "Walled College", "refused", True)):
        os.makedirs(os.path.join(base, slug, "records"))
        with open(os.path.join(base, slug, "capture_preview.json"), "w") as fh:
            json.dump({"college": college, "catalog_year": "2026-2027", "run": "4", "fingerprints": {},
                       "not_found": [{"control_number": c, "title": "T" + c, "near_miss": {"rule": "D"}}
                                     for c in ("30001", "30002", "30003")]}, fh)
        with open(os.path.join(base, slug, "prior_2025-2026_preview.json"), "w") as fh:
            json.dump({"college": college, "catalog_year": "2025-2026", "run": "11", "pdf": {"access": access},
                       "fingerprints": {c: {"sha256": "x"} for c in ("30001", "30002")},
                       "would_extract": {"list": [{"control_number": "30001", "url": "https://x/c.pdf#page=9",
                                                   "coverage": 0.5}]}}, fh)
        if with_ext:
            with open(os.path.join(base, slug, "prior_2025-2026.json"), "w") as fh:
                json.dump({"college": college, "catalog_year": "2025-2026", "run": "12",
                           "prior": {"catalog_year": "2025-2026", "only": ["30002"]}, "filed": ["30002"]}, fh)
    out = D.build([], base=base)
    np = {(r["college"], r["control_number"]): r for r in out["not_printed"]}
    flags = {(f["college"], f["control_number"]) for f in out["flags"]}
    named = {k for k, r in np.items() if r.get("named_gap") == D.NOT_PRINTED_GAP}
    check(named == {("Marin College", "30001")}, "only the read-and-unfiled program is printed in neither year (%s)"
          % sorted(named))
    check("page=9" in np[("Marin College", "30001")]["prior_read"] and "run 12" in np[("Marin College", "30001")]["prior_read"],
          "the named gap cites the prior year's best page and the extract that did not file it")
    check(("Marin College", "30002") in flags and ("Marin College", "30002") not in np,
          "the program the prior year filed is flagged, never named")
    check(("Marin College", "30003") in np and ("Marin College", "30003") not in named,
          "a program no prior-year preview read stays a plain not-printed candidate")
    check(not any(k[0] in ("Desert College", "Walled College") for k in named),
          "a preview with no extract beside it, or a refused one, names nothing")
    check(out["not_printed_named"] == 1, "the file counts the named programs")
    # The census shows the gap's words in place of a failure, only for a page not found.
    col = {"college": "Marin College"}
    check(G.named_gap(col, "30001", "page_not_found", "T30001", named) == (D.NOT_PRINTED_GAP, None),
          "the census names a page-not-found program printed in neither year")
    check(G.named_gap(col, "30001", "units_unequal", "T30001", named) is None,
          "a program with another cause is not named by this gap")
    check(D.NOT_PRINTED_GAP in G.NAMED_GAPS, "the census carries the gap's words")
finally:
    shutil.rmtree(tmp)

# The committed file is what the builder writes from the committed files.
check(D.main(["--check"]) == 0, "kb/status/program_discontinued.json is current")

if failures:
    for f in failures:
        print("FAIL:", f)
    sys.exit(1)
print("%d/%d checks passed: program discontinued" % (checks[0], checks[0]))
