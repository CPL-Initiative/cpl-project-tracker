#!/usr/bin/env python3
"""S750, the cheap piles, batch s750a: eight records at six colleges whose pages omit a state-listed course.

The reading is S748's, state_course_not_on_page (kb/_program_named_gaps.py), and the plan is s748c's
(kb/_program_piles_s748c.py) in every part: its Pile, its evidence, its rescore, its Batch. Handoff 749 left eleven
records to assign under the reading, evidence standing (NEXT (6)); the S750 conductor's brief gives this lane nine of
them and keeps Diablo Valley 39775 and Porterville 33085 out tonight. Each record fails on coverage alone: the
state's list names a course the record neither places nor explains, its units add up, and the committed capture of
the program's own page finds that course on no line.

  Cerritos 02235        PHOT 242    Photography A.A.
  Citrus 02333          ART 149     Visual Arts A.A.
  College of Marin 46242  ART 135   Studio Arts A.A.-T
  Foothill 11827        APPT 190    Plumbing and Pipefitting Apprenticeship, Certificate of Achievement
  Foothill 43194        PHIL 7      Communication Studies 2.0 A.A.-T
  Irvine Valley 44922   DMA 75      Digital Media Art, Certificate of Achievement
  Palomar 08929         AP C 730    Apprenticeship-Carpentry A.S.
  Palomar 22528         AP C 730    Apprenticeship-Carpentry, Certificate of Achievement

WHAT THE PLAN WRITES. checks.coverage turns true, and nothing else, as s748c's rows did: the one unexplained course
is explained by the capture's finding. The record is unchanged, the committed score keeps the scorer's own coverage
beside the rescored one (coverage.as_scored, coverage.not_on_page, coverage.rescored), no gap is filed, and each row
then passes as the live table counts it. A later reconcile rescores from the record and reads the course as
unexplained again: the plan's record files are kept after one, as after every reconcile (S742, Santa Barbara City).

THE EVIDENCE is the capture's finder, checked per record (NG.state_course_evidence), and its fires on held answers
are wrong about 4 times in 100 (NG.state_course_recall, pinned in tests/program_piles_s748c_test.py). So each row is
checked against a free read of its own page, an answer the finder did not make. College page read 46149637666 (the
plans kb/college_reads/s750_piles_<college>_coverage.json, each with what the session read under _quoted):

  Cerritos 02235   the page prints 17 PHOT rows (100 to 299, with 234 and 252) and '242' on no line.
  Citrus 02333     the page prints its ART rows from 101 to 268 and '149' on no line (146, then 150).
  Foothill 11827   the page prints APPT 161 to 171, 185 to 187, 189, 191 to 196 and 198, and '190' on no line. Its
                   page-mate 41696, the A.S. read from the same page, explains APPT 190 as 'not in the text' in its
                   reader's own words, and passes.
  Foothill 43194   the page prints one PHIL row, PHIL 1; PSYC 7 and SOC 7 are its only other 7s.
  Irvine Valley 44922  the entry, read as the capture reads it, prints 12 DMA rows (10 to 195) and no DMA 75.
  Palomar 08929, 22528  the rendered page prints 69 course codes: AP C 729, then AP WE 730 to 733, then AP C 735;
                   no AP C 730. The page's own data call holds 'AP C 729' and 'AP C 735' and no 'AP C 730'.
  College of Marin 46242  read 46149637666 printed the page with PROGRAM REQUIREMENTS collapsed and no course row;
                   read 46150287204 reads the page's own content call, the call the capture reads: it prints 27 ART
                   codes (ART134, then ART140) and '135' on no line.

A PAGE TWO RECORDS WERE READ FROM. s748c's three rows each had a page of their own. Three of these do not, and the
own-page guard (kb/_program_piles_s739.py Pile.own) asks each for the note that shows the section is its own
(own_section, the words in the record's notes): Foothill 11827's page prints one course list 'shared by the A.S. and
the Certificate of Achievement'; Palomar's page is headed 'Apprenticeship-Carpentry - A.S. Degree Major/Cert.
Achievement (18 units or more)', one section for the degree (08929) and the certificate (22528). The page read prints
both headings. boundaries() reads each of those rows with the words changed and with no words, and each must pass
nothing; it also reads every row off its live run, as another college's record, with the course explained by the
record's own reader, and with its units unstated.

HELD, with its reason in MADERA's HAND (no row, so no pile of the batch):
  Madera 39810  Elementary Teacher Education A.A.-T. The capture's evidence stands (the entry prints no POLSC C1000
        and no POLSC C1000H, and page read 46149637666 agrees: no political science course on any line). The page
        disagrees with itself: it heads the list 'Required Core Courses (41-47 units)' over courses that add to the
        39.5 it prints beneath, and the state's POLSC C1000, 3 units, is what brings the core to 42.5, inside the
        heading's range. So the page's own heading counts a course its list leaves out: a true gap in the page, which
        this reading would pass with no gap named. No filed kind names a gap on a row whose coverage is rescored, and
        the entry is the 2025-2026 catalog's (its address says so, and the record's note). For a person: compare
        the college's 2026-2027 catalog.

    python3 kb/_program_piles_s750a.py --dry-run
    python3 kb/_program_piles_s750a.py

Guard: tests/program_piles_s750a_test.py.
"""
from __future__ import annotations

import collections
import copy
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_piles_s748c as C8  # noqa: E402
import _program_piles_s750 as B11  # noqa: E402

B, NG, S = C8.B, C8.NG, C8.S
C = C8.C
ROOT = C8.ROOT
PASSES = C8.PASSES
TAG = "s750a"
READING = C8.READING
RESCORED = ("S750 (plan s750a): the unexplained course is explained by the capture, which finds it on no line of "
            "the program's own page (state_course_not_on_page), and a free read of the page agrees (college page read "
            "46149637666; College of Marin's, 46150287204); the scorer's own reading is kept in as_scored")
REPRESENTATION = C8.REPRESENTATION
as_scored = C8.as_scored
HELD_BY = "docs/session_749_handoff.md (NEXT (6): the coverage-omits records S748 left to assign)"
PAGE_READS = ("46149637666", "46150287204")


class Pile(C8.Pile):
    """s748c's Pile under S750's receipt name and this plan's name in the rescore, with the self-recall read on the
    record as the scorer scored it (so it reads the same before and after the plan writes its record files) and six
    more boundary readings."""

    receipt_path = B11.receipt_path

    def passing_score(self, filed: dict, skip: tuple = (), src: dict | None = None, passed: dict | None = None):
        """s748c's rescore, naming this plan and its page reads in the committed score."""
        got = super().passing_score(filed, skip, src, passed)
        if got and (got[0].get("coverage") or {}).get("rescored") == C8.RESCORED:
            got[0]["coverage"]["rescored"] = RESCORED
        return got

    def outcome(self, filed: dict, src: dict | None = None, skip: tuple = ()) -> tuple:
        return super().outcome(as_scored(filed), src, skip)

    def boundaries(self) -> dict:
        """s748c's nine readings a row, and: the row off its live run; the record as another college's; the record's
        own reader explaining the course under a filed score older than the record; the units check passing with
        no printed total; and, for a row whose page another record was read from, its own-section words changed and
        taken away. Each must pass nothing."""
        base = super().boundaries()
        out, wrong = collections.Counter(base["counts"]), list(base["wrong"])

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
            tally("the row off its live run", self.passing_score(
                dict(f, extracted_run=str(f.get("extracted_run")) + "1")) is None, cn)
            tally("the record as another college's", self.passing_score(dict(f, college="Another College")) is None, cn)
            # The filed score is older than the record: the reader's own reason for the course is in the record, so
            # today's scorer explains it and no reading is needed.
            g = copy.deepcopy(f)
            g["record"]["missing_explained"] = list(g["record"].get("missing_explained") or []) + [
                {"code": e["not_on_page"][0], "why": "not in the text"}]
            tally("the record's own reader explains the course", self.passing_score(g) is None, cn)
            # The units check passing with no total to check against: the row would not pass as the live table
            # counts it (equal only), so no rescore is filed.
            g = copy.deepcopy(f)
            g["score"]["arithmetic"] = dict(g["score"]["arithmetic"], **{"pass": True, "status": "unstated"})
            tally("the units unstated", self.passing_score(g) is None, cn)
            if not self.shared_with(cn):
                continue
            saved = self.passed
            try:
                self.passed = dict(saved, **{cn: dict(e, own_section=str(e.get("own_section") or "") + " x")})
                changed = self.outcome(f)[0] == "none"
                self.passed = dict(saved, **{cn: {k: v for k, v in e.items() if k != "own_section"}})
                gone = self.outcome(f)[0] == "none"
            finally:
                self.passed = saved
            tally("the own-section words changed", changed, cn)
            tally("no own-section words on a shared page", gone, cn)
        return {"counts": dict(out), "wrong": wrong}


class Batch(C8.Batch):
    """s748c's Batch (each receipt and SQL header says what the plan writes to checks.coverage) under S750's name."""

    session = B11.Batch.session
    ruling = B11.Batch.ruling


def _entry(code: str, own_section: str | None = None) -> dict:
    e = {"reading": READING, "not_on_page": [code]}
    if own_section:
        e["own_section"] = own_section
    return e


def _pile(college: str, slug: str, name: str, rows: dict) -> Pile:
    return Pile(college=college, slug=slug, tag=TAG, name=name, prior=B11.LiveRead(college, slug),
                keys=tuple(rows), reviewed={}, passed=dict(rows), hand={cn: PASSES for cn in rows}, held_by=HELD_BY)


CERRITOS = _pile("Cerritos College", "cerritos", "Cerritos", {"02235": _entry("PHOT 242")})
CITRUS = _pile("Citrus College", "citrus", "Citrus", {"02333": _entry("ART 149")})
MARIN = _pile("College of Marin", "college_of_marin", "College of Marin", {"46242": _entry("ART 135")})
FOOTHILL = _pile("Foothill College", "foothill", "Foothill", {
    "11827": _entry("APPT 190", "shared by the A.S. and the Certificate of Achievement"),
    "43194": _entry("PHIL 7")})
IRVINE = _pile("Irvine Valley College", "irvine_valley", "Irvine Valley", {"44922": _entry("DMA 75")})
PALOMAR = _pile("Palomar College", "palomar", "Palomar", {
    "08929": _entry("AP C 730", "The page heading names an A.S. Degree Major/Cert. Achievement together"),
    "22528": _entry("AP C 730", "The catalog prints one shared section for the A.S. Degree Major and the Certificate "
                                "of Achievement; this record reads that shared section for the certificate")})
# Madera plans no row, so it is no pile of the batch; the guard reads its key as held.
MADERA = Pile(college="Madera College", slug="madera", tag=TAG, name="Madera",
              prior=B11.LiveRead("Madera College", "madera"), keys=("39810",), reviewed={}, passed={},
              hand={"39810": ("held: the entry prints no POLSC C1000 and no POLSC C1000H (the capture, and page read "
                              "46149637666), and it heads its list 'Required Core Courses (41-47 units)' over courses "
                              "that add to the 39.5 it prints beneath; the state's POLSC C1000, 3 units, brings the "
                              "core to 42.5, inside the heading's range, so the page's own heading counts a course "
                              "its list leaves out: a true gap in the page, which this reading would pass with no "
                              "gap named. The entry is the 2025-2026 catalog's. For a person: compare the college's "
                              "2026-2027 catalog")},
              held_by=HELD_BY)
PILES = [CERRITOS, CITRUS, MARIN, FOOTHILL, IRVINE, PALOMAR]
BATCH = Batch(tag=TAG, piles=PILES)


if __name__ == "__main__":
    sys.exit(BATCH.main(doc=__doc__))
