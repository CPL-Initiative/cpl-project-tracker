#!/usr/bin/env python3
"""S739's own-page guard, on made-up page-mates (kb/_program_piles_s739.py own, _heading_apart).

WHY. A record read from a page another program was read from stands only where its section is shown its own. The
own_heading form trusts the record's section heading, so it must never let two records claim one heading. S739's
third reader found the hole: Palomar prints one heading for a degree and its certificate ('Accounting A.A. Degree
Major or Certificate of Achievement'), both sisters carry it, and each passed the guard, 27 of 348 identical-heading
sister pairs on the committed records. The rule now asks that the heading name this record's award and not the
mate's. Pinned here, on records made up in the shape of each case (no committed record is read):

  * the Palomar shape: one heading naming both awards shows neither sister its own;
  * a sister pair whose headings each name their own award: each is shown its own;
  * one award the state's file lists twice (Long Beach City 43021 and 02677): neither is shown its own, however the
    two readers worded the heading;
  * a heading that goes beyond the mate's title (Communication Studies 2.0 beside Communication Studies): the longer
    title owns it, the shorter does not;
  * a record whose notes say the heading is not in the text never owns a heading;
  * award_kind and kinds_named read the state's award words and a heading's;
  * the live-run reading's kept keys (LiveRuns.posted_runs, S739's reader, MINOR): a reread keeps a row whose run is
    at least its own, so a kept key posts the reread's run only where that run is the latest of the one load that
    inserted the key; a reread at an earlier run of that load, a key two loads inserted, and a key no load names
    post none. On made-up receipts in a scratch folder.

Run from repo root: python3 tests/program_piles_s739_guard_test.py
"""
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_piles_s739 as B  # noqa: E402

checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


URL = "https://catalog.example.edu/catalog.pdf#page=10"
CERT = "Certificate of Achievement requiring 16S/24Q to fewer than 30S/45Q units"


def record(cn, title, award, heading, notes=()):
    return {"college": "A College", "control_number": cn, "title": title, "award": award, "source_url": URL,
            "score": {"coverage": {"pass": True, "share": 1.0, "placed": 3, "listed": 3}, "invented": {"pass": True},
                      "arithmetic": {"status": "unequal", "computed": [9, 9], "stated": [12, 12]}},
            "record": {"program": {"section_heading": heading}, "notes": list(notes),
                       "blocks": [{"name": "Required", "rule": "all", "courses": [{"code": "ACCT 1", "units": 3}]}]}}


class Prior:
    @staticmethod
    def on_live_run(filed, skip=()):
        return True

    @staticmethod
    def posted_runs(skip=()):
        return {}


def pile(records):
    w = B.Pile(college="A College", slug="a_college", tag="test", name="A College", prior=Prior, keys=tuple(records),
               reviewed={}, hand={})
    w.load = lambda cn: records.get(str(cn))
    w._sources = {cn: {"control_number": cn, "source": {"url": URL, "heading_named": True}} for cn in records}
    w._read_pages = {cn: {URL} for cn in records}
    return w


def own(w, records, cn):
    f = records[cn]
    return w.own(f, {"gap": "noted_figures_differ", "own_heading": f["record"]["program"]["section_heading"]})


# The Palomar shape: one heading that names both awards.
both = "Accounting A.A. Degree Major or Certificate of Achievement"
recs = {"00001": record("00001", "Accounting", "A.A. Degree", both), "00002": record("00002", "Accounting", CERT, both)}
w = pile(recs)
check(w.shared_with("00001") == ["00002"], "the made-up sisters share their page")
check(own(w, recs, "00001") is None and own(w, recs, "00002") is None,
      "a heading that names both awards shows neither sister its own")
check(B.kinds_named(both) == {"arts", "certificate"}, "that heading names both kinds")

# Sisters whose headings each name their own award.
recs = {"00001": record("00001", "Accounting", "A.A. Degree", "Associate in Arts Degree: Accounting"),
        "00002": record("00002", "Accounting", CERT, "Certificate of Achievement: Accounting")}
w = pile(recs)
check(own(w, recs, "00001") == "own_heading" and own(w, recs, "00002") == "own_heading",
      "sisters whose headings name their own award are each shown their own")
# The degree's record carrying the certificate's heading is not shown its own.
recs["00001"] = record("00001", "Accounting", "A.A. Degree", "Certificate of Achievement: Accounting")
check(own(pile(recs), recs, "00001") is None, "a degree under the certificate's heading is not shown its own")

# One award listed twice: nothing tells them apart, however the heading is worded.
recs = {"00001": record("00001", "Registered Nursing", "A.S. Degree", "Registered Nursing A.S. Degree (Plan Code: 2621)"),
        "00002": record("00002", "Registered Nursing", "A.S. Degree", "Registered Nursing - Associate in Science")}
w = pile(recs)
check(own(w, recs, "00001") is None and own(w, recs, "00002") is None, "one award listed twice: neither is shown its own")

# A heading that goes beyond the mate's title.
head = "Communication Studies 2.0 Associate in Arts for Transfer"
recs = {"00001": record("00001", "Communication Studies 2.0", "A.A- T Degree", head + ": SC Program: AA-T.4005"),
        "00002": record("00002", "Communication Studies", "A.A- T Degree", head)}
w = pile(recs)
check(own(w, recs, "00001") == "own_heading" and own(w, recs, "00002") is None,
      "the title the heading goes beyond does not own it; the longer title does")

# A note saying the heading is not in the text.
recs = {"00001": record("00001", "Accounting", "A.A. Degree", "Associate in Arts Degree: Accounting",
                        notes=["The program heading is not printed in the text; section_heading uses the title."]),
        "00002": record("00002", "Business", CERT, "Certificate of Achievement: Business")}
check(own(pile(recs), recs, "00001") is None, "a record whose note says the heading is not in the text owns none")
# A page no other program was read from needs no showing.
recs = {"00001": record("00001", "Accounting", "A.A. Degree", both)}
check(own(pile(recs), recs, "00001") == "its page is its own", "a page no other program was read from is its own")

for award, kind in (("A.A. Degree", "arts"), ("A.S. Degree", "science"), ("A.A- T Degree", "transfer"),
                    ("A.S. T Degree", "transfer"), ("Baccalaureate of Science (B.S.) Degree.", "bachelor"),
                    (CERT, "certificate"), ("Noncredit program", "noncredit")):
    check(B.award_kind(award) == kind, "%s is %s" % (award, kind))
check(B.kinds_named("Associate in Science for Transfer Degree: Public Health") == {"transfer"}
      and B.kinds_named("PLUMBING Associate in Science Degree") == {"science"}
      and B.kinds_named("Certificate of Achievement: Interior Design") == {"certificate"}
      and B.kinds_named("Geosciences Technician") == set(), "kinds_named reads a heading's award words")

# The live-run reading's kept keys, on made-up receipts.
import json  # noqa: E402
import tempfile  # noqa: E402

with tempfile.TemporaryDirectory() as tmp:
    def receipt(name, body):
        with open(os.path.join(tmp, name), "w", encoding="utf-8") as fh:
            json.dump(body, fh)
    receipt("program_requirement_records_college_madeup_100.json",
            {"at": "2026-01-01T00:00:00Z", "extracted_runs": ["7", "8", "12"], "inserted_keys": ["A", "B", "C"]})
    receipt("program_requirement_records_college_madeup_200.json",
            {"at": "2026-01-02T00:00:00Z", "extracted_runs": ["7", "8", "12", "20"], "inserted_keys": ["C"]})
    receipt("program_requirement_records_college_reread_madeup_300.json",
            {"at": "2026-01-03T00:00:00Z", "extracted_run": "12", "kept_keys": ["A", "C", "D"]})
    receipt("program_requirement_records_college_reread_madeup_400.json",
            {"at": "2026-01-04T00:00:00Z", "extracted_run": "8", "kept_keys": ["B"]})
    saved = B.NG.RECEIPTS
    B.NG.RECEIPTS = tmp
    try:
        live = B.LiveRuns("Made-up College", "madeup")
        posted = live.posted_runs()
        check(posted.get("A") == [("2026-01-03T00:00:00Z", "12")]
              and live.on_live_run({"control_number": "A", "extracted_run": "12"}),
              "a key kept at the latest run of the one load that inserted it is on that run")
        check("B" not in posted and not live.on_live_run({"control_number": "B", "extracted_run": "8"}),
              "a key kept at an earlier run of its load posts none: its row may hold a later run")
        check("C" not in posted, "a key two loads inserted posts none")
        check("D" not in posted, "a kept key no load names posts none")
    finally:
        B.NG.RECEIPTS = saved

print("%d checks, %d failures" % (checks[0], len(failures)))
for m in failures:
    print("FAIL:", m)
sys.exit(1 if failures else 0)
