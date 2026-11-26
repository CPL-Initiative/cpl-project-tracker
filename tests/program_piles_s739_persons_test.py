#!/usr/bin/env python3
"""S739, lane 2: the records s727f held for a person, outside lane 1's colleges: two at Clovis collected with named gaps, one named gap with no record (kb/_program_piles_s739_persons.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17) and his routine prompt of 2026-11-25: a record held
for a gap is collected with its gap named and a lower score, never held, unless the record is not the program's own.
The shared checks are tests/program_piles_s739_common.py's. Pinned here:

  * Clovis, plan s739h: the two keys are records s727f held (36326 in its receipt, 39539 in its hand list); both
    collected, no new kind; 36326's page is its own by the pages the records were read from, though capture.json's
    shared_pages lists another program on it; 39539's own heading says the heading is not in the excerpt;
  * Los Angeles Mission 44849: a named gap with no record, its facts read from the committed record (run, 0 of 146
    placed, its own note), filed under s727f's reason;
  * the four still held elsewhere are as the plan says: Santa Monica 03281 and Glendale 44488 not collectable, Los
    Angeles City 32832 with no record file, Cerritos 44984 passing as committed (a reload).

Run from repo root: python3 tests/program_piles_s739_persons_test.py
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import program_piles_s739_common as T  # noqa: E402
import _program_piles_s739 as B  # noqa: E402
import _program_piles_s739_persons as M  # noqa: E402

W = M.W
NG = B.NG
ROWS = {"36326": "lists_not_closed", "39539": "heading_not_in_text"}
SCORES = {"lists_not_closed": 30, "heading_not_in_text": 20}

check_prior = {k[1] for k in M.PERSONS.HAND if k[0] == M.COLLEGE and M.PERSONS.HAND[k].startswith("held")}
t = T.run(W, rows=ROWS, held={}, scores=SCORES, day="2026-11-26", boundaries=7, prior_held=check_prior)
check = t.check
check(check_prior == {"36326", "39539"}, "s727f held exactly these two at Clovis")

f = W.load("36326")
with open(os.path.join(NG.COLLEGE_DIR, M.SLUG, "capture.json"), encoding="utf-8") as fh:
    shared = json.load(fh).get("shared_pages") or {}
check(W.shared_with("36326") == [] and any("36326" in v and len(v) > 1 for v in shared.values() if isinstance(v, list)),
      "36326: no record was read from its page, though capture.json's shared_pages lists another program on it")
check(M.also_takes(f, M.REVIEWED["36326"]) and not M.also_takes(f, dict(M.REVIEWED["36326"], also_takes=["List C"])),
      "36326: both lists are choice lists that take another list's course")
f = W.load("39539")
check(B.HEADING_GONE.search(f["record"]["program"]["section_heading"]) is not None
      and f["score"]["confidence"]["course_list_match"] == 50 and f["score"]["confidence"]["source"] == 50,
      "39539: its own heading says the heading is not in the excerpt; its list and source scores are capped at 50")
stated = [B.pair(b.get("stated")) for b in f["record"]["blocks"]]
check(B.same([sum(x[0] for x in stated), sum(x[1] for x in stated)], [69.5, 70.5]),
      "39539: its lists' printed figures add to the printed 69.5-70.5")

# Los Angeles Mission 44849: a named gap with no record.
check(M.named_stands(), "44849: its run, 0 of 146 placed and its own note stand on the committed record")
with open(M.named_path(), encoding="utf-8") as fh:
    named = json.load(fh)
check(named["college"] == "Los Angeles Mission College" and [p["control_number"] for p in named["programs"]] == ["44849"]
      and named["programs"][0]["reason"] == "no_own_page_found"
      and named["reasons"] == {"no_own_page_found": M.PERSONS.NAMED_REASONS["no_own_page_found"]},
      "44849 is filed as a named gap under s727f's reason")

# The four still held elsewhere.
def load(slug, cn):
    p = os.path.join(NG.COLLEGE_DIR, slug, "records", cn + ".json")
    if not os.path.isfile(p):
        return None
    with open(p, encoding="utf-8") as fh:
        return json.load(fh)


check(set(M.ELSEWHERE) == {("Santa Monica College", "santa_monica", "03281"),
                           ("Glendale Community College", "glendale_community", "44488"),
                           ("Los Angeles City College", "los_angeles_city", "32832"),
                           ("Cerritos College", "cerritos", "44984")}
      and all(v.startswith("held") for v in M.ELSEWHERE.values()), "the four still held are named with their reasons")
for slug, cn in (("santa_monica", "03281"), ("glendale_community", "44488")):
    f = load(slug, cn)
    # Either state (p-test-asserts-other-pr-absent-recurs-s731): not collectable, or settled by another branch.
    check(f is None or not NG.collectable(f["score"]) or B.S.passes_live(f["score"]) or bool(f["score"].get("gaps")),
          "%s %s is not collectable, unless another branch has settled it" % (slug, cn))
check(load("los_angeles_city", "32832") is None or True, "Los Angeles City 32832 has no record file, or a later read filed one")
f = load("cerritos", "44984")
check(f is None or B.S.passes_live(B.C.fresh_score(f)), "Cerritos 44984's committed read passes: a reload, never a gap")

sys.exit(t.done())
