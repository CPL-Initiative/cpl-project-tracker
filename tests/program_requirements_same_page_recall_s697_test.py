#!/usr/bin/env python3
"""The reread gate's same-page calls, measured over every committed folder (S697 self-recall of #3641).

    python3 tests/program_requirements_same_page_recall_s697_test.py

#3641 put the gate's same-page calls in one place (same_page, same_file, names_page; d-reread-gate-same-page-
calls-s690). Its second reader measured their effect over every committed college folder, the decision the
extraction makes for each filed program with its own sources.json entry as the fresh source, old module against
new: 320 programs newly kept (Butte 163 and Cuyamaca 155 by an address spelled two ways, College of the Canyons 2
by the catalog's edition, v2 against v3), none of the 176 programs whose record sits one PDF page from its entry
(S411's pairs), and none of the 164 others. The edition token joins one pair of files, Canyons' v2 and v3.

The fixture (tests/fixtures/program_requirements_same_page_recall_s697.json) freezes that evidence, so the counts
move only when the code does, never when a college is read again:
  * rows: the 660 programs whose record's address differs from its entry's as written (every other program
    decides alike under both modules), each with what the gate reads (the two addresses, the coverage, the
    fingerprints and code lists as short digests, whether the record passes as the live table counts it) and the
    decision the module before #3641 (a31976ca) made;
  * edition_near_misses: the committed file addresses (13,051 of them, from 16,342 addresses) whose file names
    differ only in their digits, grouped: every pair an edition token could join.
A change to the same-page calls fails here with the count it moved; when the move is intended, change the count
here in the same PR and say why.
"""
import collections
import json
import os
import shutil
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_requirements_college as C  # noqa: E402
from _program_requirements_score import passes_live  # noqa: E402

FIXTURE = os.path.join(ROOT, "tests", "fixtures", "program_requirements_same_page_recall_s697.json")
PASSING = {"pass": True, "coverage": {"pass": True, "share": 1.0}, "invented": {"pass": True},
           "arithmetic": {"status": "equal"}}
FAILS = []
N = [0]


def check(ok, what):
    N[0] += 1
    print(("ok   " if ok else "FAIL ") + what)
    if not ok:
        FAILS.append(what)


with open(FIXTURE) as fh:
    FX = json.load(fh)
rows = FX["rows"]
check(passes_live(PASSING) and not passes_live({"pass": False}),
      "fixture: the test's two scores pass and fail as the live table counts them")
check(len(rows) == 660 and collections.Counter(r["cat"] for r in rows)
      == {"spelling": 318, "one_page_off": 176, "edition": 2, "other": 164},
      "fixture: 660 programs, 318 spelled two ways, 176 one page off, 2 a new edition, 164 others (%s)"
      % dict(collections.Counter(r["cat"] for r in rows)))


def decide(path, entry):
    """The extraction's keep decision for one program (extract's keep loop, as would_extract applies it)."""
    src = dict(entry, text="x")
    if C.filed_from(path, src, entry) and C.unchanged(entry, src):
        return "kept"
    if C.moved_unchanged(path, src):
        return "kept_moved"
    h = C.held(path, entry, src)
    return h["reason"] if h else "list"


tmp = tempfile.mkdtemp(prefix="same_page_recall_s697_")
try:
    now = []
    for i, r in enumerate(rows):
        rec = dict(r["rec"])
        rec["record"] = {"blocks": []} if rec.pop("record") else None
        rec["score"] = PASSING if rec.pop("passes") else {"pass": False}
        path = os.path.join(tmp, "%d.json" % i)
        with open(path, "w") as fh:
            json.dump(rec, fh)
        e = r["entry"]
        source = {k: e[k] for k in ("url", "text_from", "text_sha", "pinned", "page_check", "opens_on_list") if k in e}
        entry = {"control_number": r["cn"], "coverage": e.get("coverage"), "codes_found": e.get("codes_found"),
                 "source": source}
        now.append(decide(path, entry))
finally:
    shutil.rmtree(tmp, ignore_errors=True)

moved = collections.Counter((r["old"], d) for r, d in zip(rows, now) if r["old"] != d)
check(dict(moved) == {("list", "kept"): 320},
      "every change from the module before #3641 is a program newly kept, 320 of them (%s)" % dict(moved))
newly = [r for r, d in zip(rows, now) if r["old"] != "kept" and d == "kept"]
by_college = collections.Counter(r["slug"] for r in newly)
check(by_college == {"butte": 163, "cuyamaca": 155, "college_of_the_canyons": 2},
      "newly kept: Butte 163, Cuyamaca 155, College of the Canyons 2 (%s)" % dict(by_college))
by_cat = collections.Counter(r["cat"] for r in newly)
check(by_cat == {"spelling": 318, "edition": 2},
      "newly kept by the address spelled two ways (318) and the edition (2); none one page off, none other (%s)"
      % dict(by_cat))
check(not any(d.startswith("kept") for r, d in zip(rows, now) if r["cat"] in ("one_page_off", "other")),
      "none of the 176 one-page-off programs (S411's pairs) and none of the 164 others is kept")

groups = FX["edition_near_misses"]
check(len(groups) == 32 and sum(map(len, groups)) == 70 and FX["files_surveyed"] == 13051,
      "fixture: 70 near-miss file addresses in 32 groups, from 13,051 committed files")
joined = []
for g in groups:
    for i, a in enumerate(g):
        for b in g[i + 1:]:
            if C.same_file(a, b) and not C.same_address(a, b):
                joined.append((a, b))
canyons = "https://www.canyons.edu/_documents/administration/academicaffairs/collegecatalog/2026-27-Catalog-%s-508.pdf"
check(joined == [(canyons % "v2", canyons % "v3")],
      "the edition token joins one pair among the committed files, Canyons' Catalog v2 and v3 (%s)" % joined[:4])

if FAILS:
    print("FAIL: %d of %d" % (len(FAILS), N[0]))
    for f in FAILS:
        print("  - " + f)
    sys.exit(1)
print("ok: same-page recall S697 (%d checks)" % N[0])
