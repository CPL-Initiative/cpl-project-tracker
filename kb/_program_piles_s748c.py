#!/usr/bin/env python3
"""S748, lane 2's cheap piles, batch s748c: three records at two colleges whose pages omit a state-listed course.

The reading is new and named: state_course_not_on_page (kb/_program_named_gaps.py). Each record fails on coverage
alone: the state's list names one course the record neither places nor explains, its units add up, and the committed
capture of the program's own page (kb/program_requirements_college/<slug>/sources.json) finds that course on no
line. S720 held each as 'coverage fails: the state's file lists a course the page does not print'. Sam's ruling
(2026-11-17, sam-collect-with-gaps-2026-11-17) collects a record rather than holding it; the S748 conductor's brief
names this pile.

  Orange Coast 43100   PSYC A160   OCC
  Fullerton 18749      THEA 231 F  FULLERTON
  Fullerton 36863      PE 108 F    FULLERTON

WHAT THE PLAN WRITES. checks.coverage turns true, and nothing else: the one unexplained course is explained by the
capture's finding, as a reader's own 'not in the text' explains a missing course on thousands of passing records.
The record is unchanged, and the committed score keeps the scorer's own coverage beside the rescored one
(coverage.as_scored, coverage.not_on_page, coverage.rescored). With coverage true and the units equal each row
passes as the live table counts it.

NO GAP IS FILED, and that is this plan's one departure from the conductor's brief, which asked for a named gap. A
row whose coverage, invented and units checks pass is a passing row, and a passing score carries no gap: the
reconcile's keep_named_gaps drops one, and tests/reconcile_keeps_named_gaps_test.py pins that for every committed
record. A gap on a row whose coverage still fails is not counted as collected either (kb/_harvest_gap_census.py
collected_with_gaps). So the name is the reading's: the receipt row carries it, and the score carries the course.
The row's course-list share stays on the live row as checks.placed and checks.listed (22 of 23).

A later reconcile rescores from the record and reads the course as unexplained again: the plan's record files are
kept after one, as after every reconcile (S742, Santa Barbara City).

THE EVIDENCE is the capture's finder, checked per record (NG.state_course_evidence): it read the record's own
address, whole; it finds on the page every placed course the state's file writes with a space or a hyphen; the
unexplained course is so written and found on no line; no note says the list is cut off. Measured against the
readers' own answers statewide (NG.state_course_recall, pinned in tests/program_piles_s748c_test.py): of 201,004
placed courses asked it misses 248 (it would name a course the page prints, about 1 in 800); of 6,496 courses readers
call not in the text it agrees on 5,655. Put as the reading's own fires on held answers: 5,655 right and 248 wrong, 4
wrong in 100. So it is no record rule: it is filed from this reviewed list, by key, and each row is checked against
a free page read of its own page: college page read 45955333186 prints Orange Coast 43100's page with no PSYC A160,
and kb/college_reads/s748_piles_fullerton_coverage.json reads Fullerton's two pages on this plan's push.

HELD, each reason in CCSF's HAND (no row, so no pile of the batch):
  City College of San Francisco 32079  the capture finds MATH 115 on no line, but the own-page guard refuses the
        record: its section is headed 'Mathematics 2.0' on a PDF page 46300 was read from too.
  City College of San Francisco 41315  the capture finds PSYC 23 somewhere in its PDF window: a page read says where.
No pile: Santa Barbara City 30746. Page read 45837455365 prints its page with no PSY 200, but the capture misses
three cross-listed courses the record places there (ETHS 107, ENVS 112, ENVS 115), so the capture's finding is not
its evidence: a reading from a committed page read's text is its lever. Fullerton 18166 fails invented too.

    python3 kb/_program_piles_s748c.py --dry-run
    python3 kb/_program_piles_s748c.py

Guard: tests/program_piles_s748c_test.py. Shared code (a new reading and its evidence): needs a second reader.
"""
from __future__ import annotations

import collections
import copy
import json
import os
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s748 as B10  # noqa: E402

B, NG, S = B10.B, B10.NG, B10.S
C = B.C
ROOT = B10.ROOT
PASSES = B10.PASSES
TAG = "s748c"
READING = NG.STATE_COURSE
RESCORED = ("S748 (plan s748c): the unexplained course is explained by the capture, which finds it on no line of "
            "the program's own page (state_course_not_on_page); the scorer's own reading is kept in as_scored")
REPRESENTATION = ("checks.coverage to true, and nothing else: the listed course the record leaves unexplained is "
                  "explained by the capture's finding that the page does not print it (state_course_not_on_page). "
                  "checks.invented, checks.arithmetic and the record unchanged; no gap is filed, since the row then "
                  "passes as the live table counts it")


def as_scored(filed: dict) -> dict:
    """The record with the scorer's own coverage: what the plan read, whether or not it has written."""
    g = copy.deepcopy(filed)
    cov = (g.get("score") or {}).get("coverage") or {}
    if isinstance(cov.get("as_scored"), dict):
        cov.update(cov.pop("as_scored"))
        cov.pop("not_on_page", None)
        cov.pop("rescored", None)
        g["score"]["pass"] = C._overall(g["score"])
    return g


class Pile(B10.Pile):
    """S748's Pile for the one reading whose evidence is the capture, not a note: a PASSED entry names the course
    (not_on_page), and its check is NG.state_course_evidence on the record as the scorer scored it."""

    def capture_run(self) -> str:
        with open(os.path.join(NG.COLLEGE_DIR, self.slug, "capture.json"), encoding="utf-8") as fh:
            return str(json.load(fh).get("run"))

    def evidence(self, filed: dict, src: dict | None = None) -> dict | None:
        cn = str(filed.get("control_number"))
        entry = self.sources().get(cn) if src is None else src
        return NG.state_course_evidence(filed, entry, C.closed_list(self.college, cn))

    def passing_score(self, filed: dict, skip: tuple = (), src: dict | None = None, passed: dict | None = None):
        """(the filed score with coverage rescored, the capture's words) where the entry stands, else None."""
        cn = str(filed.get("control_number"))
        e = (self.passed if passed is None else passed).get(cn)
        if not e or filed.get("college") != self.college:
            return None
        if e.get("reading") != READING:
            return super().passing_score(filed, skip)
        ev = self.evidence(filed, src)
        if not ev or sorted(S.norm_code(c) for c in ev["not_on_page"]) != sorted(S.norm_code(c) for c in e["not_on_page"]):
            return None
        # Today's scorer, on the record's own state list, still reads the course unexplained (a record whose reader
        # or reconcile has since explained it needs no reading), and the row is on its live run.
        if (C.fresh_score(filed).get("coverage") or {}).get("pass") or not self.on_live_run(filed, skip):
            return None
        entry = self.sources().get(cn) if src is None else src
        words = NG.state_course_not_on_page(filed, entry, C.closed_list(self.college, cn), self.capture_run())
        sc = copy.deepcopy(filed["score"])
        cov = sc["coverage"]
        sc["coverage"] = dict(cov, **{"pass": True, "unexplained": [], "not_on_page": list(cov["unexplained"]),
                                      "rescored": RESCORED,
                                      "as_scored": {"pass": cov.get("pass"), "unexplained": list(cov["unexplained"])}})
        sc["pass"] = C._overall(sc)
        return (sc, words) if S.passes_live(sc) else None

    def boundaries(self) -> dict:
        """The reading's own boundary readings, each of which must pass nothing: the capture finds the course; the
        capture read another address; the capture's text at its cap; a placed course the capture does not find; the
        record explains the course itself; invented failing; the units check failing; a note that the list is cut
        off; the entry naming another course."""
        out, wrong = collections.Counter(), []

        def tally(name, ok, cn):
            out["%s %s" % (name, "right" if ok else "wrong")] += 1
            if not ok:
                wrong.append([cn, name])

        for cn in self.keys:
            e = self.passed.get(cn)
            f = self.load(cn)
            if not e or e.get("reading") != READING or f is None:
                continue
            f = as_scored(f)
            if not self.passing_score(f):
                continue
            src = self.sources()[cn]
            closed = C.closed_list(self.college, cn)
            code = e["not_on_page"][0]
            tally("the capture finds the course", self.passing_score(
                f, src=dict(src, codes_found=list(src.get("codes_found") or []) + [code])) is None, cn)
            tally("the capture read another address", self.passing_score(
                f, src=dict(src, source=dict(src["source"], url=src["source"]["url"] + "x"))) is None, cn)
            tally("the capture's text at its cap", self.passing_score(
                f, src=dict(src, text_chars=NG.STATE_COURSE_TEXT_CAP)) is None, cn)
            missing = {S.norm_code(c) for c in f["score"]["coverage"].get("missing") or []}
            placed = [S.norm_code(c["code"]) for c in closed if S.norm_code(c["code"]) not in missing
                      and NG._spaced(c["code"])]
            tally("a placed course the capture does not find", bool(placed) and self.passing_score(
                f, src=dict(src, codes_found=[c for c in src.get("codes_found") or []
                                              if S.norm_code(c) != placed[0]])) is None, cn)
            g = copy.deepcopy(f)
            g["score"]["coverage"].update({"unexplained": [], "pass": True})
            tally("the record explains the course itself", self.passing_score(g) is None, cn)
            g = copy.deepcopy(f)
            g["score"]["invented"] = dict(g["score"]["invented"], **{"pass": False})
            tally("invented failing", self.passing_score(g) is None, cn)
            g = copy.deepcopy(f)
            g["score"]["arithmetic"] = dict(g["score"]["arithmetic"], **{"pass": False, "status": "unequal"})
            tally("the units check failing", self.passing_score(g) is None, cn)
            g = copy.deepcopy(f)
            g["record"]["notes"] = list(g["record"].get("notes") or []) + [
                "The requirements table is cut off at the end of the provided text."]
            tally("a note that the list is cut off", self.passing_score(g) is None, cn)
            tally("the entry naming another course", self.passing_score(
                f, passed={cn: dict(e, not_on_page=[code + "9"])}) is None, cn)
        return {"counts": dict(out), "wrong": wrong}


class Batch(B10.Batch):
    """S748's Batch; each receipt and SQL header says what this plan writes to checks.coverage."""

    def main(self, argv=None, doc: str = "") -> int:
        rc = super().main(argv, doc)
        day = time.strftime("%Y-%m-%d", time.gmtime())
        for w in self.piles:
            path = w.receipt_path(day, self.tag)
            if not os.path.isfile(path):
                continue
            with open(path, encoding="utf-8") as fh:
                body = json.load(fh)
            body["representation"] = REPRESENTATION
            with open(path, "w", encoding="utf-8") as fh:
                json.dump(body, fh, ensure_ascii=False, indent=1)
                fh.write("\n")
        old = ("-- college load's image of its committed record (load_rows): checks.gaps and checks.confidence added,\n"
               "-- or checks.arithmetic to equal for a rescore; the record unchanged.")
        new = ("-- college load's image of its committed record (load_rows): checks.coverage to true and nothing else\n"
               "-- (the unexplained course is explained by the capture: the page does not print it); no gap filed;\n"
               "-- checks.invented, checks.arithmetic and the record unchanged.")
        for part in ("preread_md5", "preread", "apply", "rollback"):
            path = os.path.join(HERE, "migrations", "%s_%s_prreq_piles_%s.sql" % (day, self.tag, part))
            if os.path.isfile(path):
                with open(path, encoding="utf-8") as fh:
                    text = fh.read()
                if old in text:
                    with open(path, "w", encoding="utf-8") as fh:
                        fh.write(text.replace(old, new, 1))
        return rc


def _entry(code: str) -> dict:
    return {"reading": READING, "not_on_page": [code]}


OCC = Pile(college="Orange Coast College", slug="orange_coast", tag=TAG, name="Orange Coast",
           prior=B10.LiveRead("Orange Coast College", "orange_coast"), keys=("43100",),
           reviewed={}, passed={"43100": _entry("PSYC A160")}, hand={"43100": PASSES},
           held_by="kb/receipts/program_requirement_records_piles_s748_orange_coast_2026-11-28_s748b.json")
FULLERTON = Pile(college="Fullerton College", slug="fullerton", tag=TAG, name="Fullerton",
                 prior=B10.LiveRead("Fullerton College", "fullerton"), keys=("18749", "36863"),
                 reviewed={}, passed={"18749": _entry("THEA 231 F"), "36863": _entry("PE 108 F")},
                 hand={"18749": PASSES, "36863": PASSES},
                 held_by="kb/receipts/program_requirement_records_piles_fullerton_2026-11-24_s720f.json")
# City College of San Francisco plans no row, so it is no pile of the batch; the guard reads both keys as held.
CCSF = Pile(college="City College of San Francisco", slug="city_of_san_francisco", tag=TAG,
            name="City College of San Francisco",
            prior=B10.LiveRead("City College of San Francisco", "city_of_san_francisco"), keys=("32079", "41315"),
            reviewed={}, passed={},
            hand={"32079": ("held: the capture finds MATH 115 on no line, but the record is not shown to be the "
                            "program's own: its section is headed 'Mathematics 2.0 – AS-T Degree' on PDF p.341, a "
                            "page 46300 was read from too (the Cal-GETC dry run's, a plain session's), and the "
                            "state's file titles 32079 'Mathematics': the own-page guard refuses it"),
                  "41315": ("held: coverage fails on PSYC 23, which the record neither places nor explains, and the "
                            "capture finds PSYC 23 somewhere in the text of its PDF window, so the capture does not "
                            "show the program's section omits it: a page read that says where the page prints it")},
            held_by="kb/receipts/program_requirement_records_piles_ccsf_2026-11-24_s720c.json")
BATCH = Batch(tag=TAG, piles=[OCC, FULLERTON])


if __name__ == "__main__":
    sys.exit(BATCH.main(doc=__doc__))
