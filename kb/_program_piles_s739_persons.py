#!/usr/bin/env python3
"""S739, lane 2: the records s727f held for a person, outside lane 1's colleges: two at Clovis collected, one named gap.

S727's plan s727f (kb/_program_piles_s727_persons.py) collected five of the records earlier sessions held "for a
person" and held seven. Sam's ruling, as kb/_program_piles_s739.py carries it: a record held for a gap is collected
with its gap named and a lower score, never held, unless the record is not the program's own. East Los Angeles 33013
is lane 1's (collected by its lever, #3881). The rest are read again here from the committed files. No catalog read,
no reconcile, no record changed, no new kind.

CLOVIS, plan s739h, 2 rows (REVIEWED below):
  lists_not_closed (30)     36326 Geography A.A.-T: 'List B also allows Any course from List A not already used', and
        List A any core course not already used, so the lists alone cannot add its units (14-20 against the printed
        18-21). S727f held it on capture.json's shared_pages, which lists 44475 on its page; the own-page guard reads
        the pages the records were read from (p-own-page-guard-reads-read-pages-s727), and no other record was read
        from p.168.
  heading_not_in_text (20)  39539 Occupational Therapy Assistant A.S.: its section_heading and its note say the
        heading is not in the excerpt, which begins mid-description on p.145; its lists' printed figures add to the
        printed 69.5-70.5, and its courses to 66.5-67.5 (ENGL C1000, a prerequisite, is 'not in the text'). S713c and
        s727f held it for a reread on the catalog's own figures; the gap names the missing heading, which its record
        states, and files the note on the figures beside it.

LOS ANGELES MISSION 44849, a named gap with no record (NAMED below; no live row, no write): the Cal-GETC certificate.
Its read (44475511939) took PDF pp.220-223, which print the district's local general education plan and a Program
Completion table row 'Cal-GETC', never the certificate's requirements, and placed 0 of 146 listed courses. Filed in
kb/program_requirements_college/los_angeles_mission/named_gaps_s739.json (no_own_page_found, s727f's reason).

STILL HELD (ELSEWHERE below), each with what would move it:
  Santa Monica 03281   not collectable: coverage places 12 of 27 and invented fails on 'NURSING 6/6L/7/7L'; its note
                       puts the section's start on the preceding page. A misprint alias and a read of that page.
  Glendale 44488       not collectable: invented fails on ESL 156 (not in the state's file) and 'MATH 102+'; the
                       arithmetic passes. Which course the 'MATH 102/102+' row names is the college's to say.
  Los Angeles City 32832   a failing live row with no committed record file (the reconcile 44511401763 dropped it),
                       and today's capture finds no page: no image of its record can be built here. A read.
  Cerritos 44984       the live row holds run 37961137169 and reads unequal; both committed reads pass, so no gap is
                       honest: a reload of the passing committed read (a load, the conductor's to dispatch).

    python3 kb/_program_piles_s739_persons.py --dry-run
    python3 kb/_program_piles_s739_persons.py --tag s739h

Guard: tests/program_piles_s739_persons_test.py.
"""
from __future__ import annotations

import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_named_gaps as NG  # noqa: E402
import _program_piles_s727_persons as PERSONS  # noqa: E402
import _program_piles_s739 as B  # noqa: E402

COLLEGE = "Clovis Community College"
SLUG = "clovis_community"
TAG = "s739h"
HELD_BY = "kb/receipts/program_requirement_records_piles_s727_persons_2026-11-25_s727f.json"
KEYS = ("36326", "39539")
_LIST_A = "List A: Select two to three courses"
_LIST_B = "List B: Select two course (6 units)"


class PRIOR:
    """s727f's module reads every college's receipts; these give it Clovis's, in the one-college shape the Pile asks."""

    @staticmethod
    def on_live_run(filed: dict, skip: tuple = ()) -> bool:
        return PERSONS.on_live_run(filed, skip)

    @staticmethod
    def posted_runs(skip: tuple = ()) -> dict:
        return PERSONS.posted_runs(COLLEGE, skip)


def also_takes(filed: dict, e: dict) -> bool:
    """lists_not_closed: each named list is a choice list of the record, and the entry's notes say each also takes a
    course of another list, so the record's short low end cannot be closed from the lists alone."""
    a = (filed.get("score") or {}).get("arithmetic") or {}
    comp, st = B.pair(a.get("computed")), B.pair(a.get("stated"))
    lists = [B.blocks(filed, n) for n in e["also_takes"]]
    return all(len(bs) == 1 and bs[0].get("rule") in ("choose_courses", "choose_units") for bs in lists) \
        and comp is not None and st is not None and comp[0] + NG.FIG_EPS < st[0] \
        and all(any(w in n and "also allows" in n for n in B.notes(filed)) for w in ("List A", "List B"))


REVIEWED = {
    "36326": {"gap": "lists_not_closed", "computed": [14, 20], "stated": [18, 21],
              "words": "List B also allows 'Any course from List A not already used' (3 units).",
              "also_words": "List A also allows 'Any course in Required Core not already used' (3 units)",
              "shape": ["also_takes"], "also_takes": [_LIST_B, _LIST_A]},
    "39539": {"gap": "heading_not_in_text", "computed": [66.5, 67.5], "stated": [69.5, 70.5],
              "words": "The excerpt starts mid-section on page 145; the program heading, any program learning outcomes "
                       "and earlier description are not in the excerpt",
              "also_words": "it includes the prerequisite block (26-27) and the core blocks (12.5+7+11+13)",
              "shape": ["heading_gone"]},
}
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}

NAMED_REASON = PERSONS.NAMED_REASONS["no_own_page_found"]
NAMED = {
    "college": "Los Angeles Mission College", "slug": "los_angeles_mission", "control_number": "44849",
    "title": "California General Education Transfer Curriculum (Cal-GETC)",
    "award": "Certificate of Achievement requiring 30S/45Q to fewer than 60S/90Q units",
    "reason": "no_own_page_found", "run": "44475511939",
    "note": "The read 44475511939 took PDF pp.220-223, which print the district's local general education plan and a "
            "Program Completion table row 'Cal-GETC', never the certificate's requirements, and placed 0 of the 146 "
            "listed courses; its own note asks a reviewer to locate the certificate's pages. No live row holds it.",
}
ELSEWHERE = {
    ("Santa Monica College", "santa_monica", "03281"):
        "held: not collectable: coverage places 12 of 27 and invented fails on the catalog's 'NURSING 6/6L/7/7L'; its "
        "note puts the section's start on the preceding page: a misprint alias and a read of that page",
    ("Glendale Community College", "glendale_community", "44488"):
        "held: not collectable: invented fails on ESL 156 (not in the state's file) and 'MATH 102+'; the arithmetic "
        "passes; which course the 'MATH 102/102+' row names is the college's to say in COCI",
    ("Los Angeles City College", "los_angeles_city", "32832"):
        "held: a failing live row with no committed record file (the reconcile 44511401763 dropped it), and today's "
        "capture finds no page, so no image of its record can be built here: a read",
    ("Cerritos College", "cerritos", "44984"):
        "held: the live row holds run 37961137169 and reads unequal; both committed reads pass, so no gap is honest: "
        "a reload of the passing committed read (a load)",
}

W = B.Pile(college=COLLEGE, slug=SLUG, tag=TAG, name="Clovis", prior=PRIOR, keys=KEYS, reviewed=REVIEWED, hand=HAND,
           held_by=HELD_BY, shapes={"also_takes": also_takes})


def named_path() -> str:
    return os.path.join(NG.COLLEGE_DIR, NAMED["slug"], "named_gaps_s739.json")


def named_stands() -> bool:
    """The named gap's facts, read from the committed record: its run, none of its listed courses placed, and a note
    of its own saying the text does not hold the certificate's requirements."""
    p = os.path.join(NG.COLLEGE_DIR, NAMED["slug"], "records", NAMED["control_number"] + ".json")
    if not os.path.isfile(p):
        return False
    with open(p, encoding="utf-8") as fh:
        f = json.load(fh)
    cov = (f.get("score") or {}).get("coverage") or {}
    return str(f.get("extracted_run")) == NAMED["run"] and cov.get("placed") == 0 and cov.get("listed") == 146 \
        and any("does not contain the Cal-GETC Certificate of Achievement requirements" in n for n in B.notes(f))


def write_named() -> str:
    written = subprocess.run(["date", "-u", "+%Y-%m-%dT%H:%M:%SZ"], capture_output=True, text=True).stdout.strip()
    body = {"_readme": "S739 (plan s739h's module, lane 2): 1 program of Los Angeles Mission College held for a "
                       "person, collected as a named gap with no record (Sam's collect-with-gaps ruling). It has no "
                       "live row and a record that places none of its courses, so no load posts it; the reason names "
                       "what the page leaves open. No model call, no Supabase write. Built by "
                       "kb/_program_piles_s739_persons.py.",
            "college": NAMED["college"], "written": written, "capture": NAMED["run"], "page_reads": [],
            "reasons": {NAMED["reason"]: NAMED_REASON},
            "programs": [{k: NAMED[k] for k in ("control_number", "title", "award", "reason", "note")}]}
    with open(named_path(), "w", encoding="utf-8") as fh:
        json.dump(body, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    return named_path()


if __name__ == "__main__":
    if not named_stands():
        raise SystemExit("Los Angeles Mission 44849: the named gap's facts do not stand")
    rc = W.main(doc=__doc__)
    if "--dry-run" not in sys.argv and not os.path.isfile(named_path()):
        print("named gap %s" % os.path.relpath(write_named(), B.ROOT))
    sys.exit(rc)
