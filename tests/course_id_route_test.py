#!/usr/bin/env python3
"""The course-id route (S653): the MIS suffix reading, the scorer's rename, the self-recall test with its floor,
and the proof that every retired prefix_aliases pair's matches are reproduced on the filed records.

The route: kb/_course_id_route.py. The proof and the self-recall test: kb/_course_id_route_census.py, rebuilt here
from committed files (about 35 s; stdlib plus openpyxl) and compared with the committed plan.
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(ROOT, "kb"))

import _course_id_route as CI  # noqa: E402
import _program_requirements_reconcile as RC  # noqa: E402
import _program_requirements_score as S  # noqa: E402

FAILS = []


def check(ok, what):
    print(("ok   " if ok else "FAIL ") + what)
    if not ok:
        FAILS.append(what)


# ── The suffix reading (p-mis-codes-carry-record-id-suffix-s652) ──────────────────────────────────
check(CI.mis_code("ENGL304-2507") == "ENGL304", "ENGL304-2507 reads as ENGL 304")
check(CI.mis_code("ENG303-26954 ") == "ENG303", "a five-digit record id is set aside too")
check(CI.mis_code("NC-1001") == "NC1001", "a subject and a number (Southwestern's NC-1001) stay as written")
check(CI.mis_code("PSYC-C1000") == "PSYCC1000", "a common-course number's hyphen is no record id")
check(CI.mis_code("NURS 117-MS") == "NURS117MS", "letters after the hyphen are no record id (NURS 117-MS)")
check(CI.mis_code("ACCT-101") == "ACCT101", "a hyphen before the number is no record id (ACCT-101)")
check(CI.mis_code("HIST14") == "HIST14" and CI.mis_code(None) == "", "a plain id reads as itself")
check(CI.spaced("HIST14") == "HIST 14" and CI.spaced("MATHC2220") == "MATH C2220" and CI.spaced("CPSC17") == "CPSC 17",
      "the capture's printed twin spaces the subject from the number, a common-course C kept with the number")

# ── The scorer's rename ───────────────────────────────────────────────────────────────────────────
rec = {"program": {"total_units": {"min": 6, "max": 6}, "measure": "units"},
       "blocks": [{"name": "Required", "rule": "all",
                   "courses": [{"code": "HIST 14", "units": 3}, {"code": "ENGL 1A", "units": 3}]}]}
closed = [{"code": "HIS 14", "units": 3, "crsid": "HIST14"}, {"code": "ENGL 1A", "units": 3}]
sc = S.score(rec, closed, "x", "A.A. Degree")
check(not sc["coverage"]["missing"] and not sc["invented"]["codes"],
      "Riverside City's HIST 14 meets the listed HIS 14 by the file's id, with no alias")
check(S.score(rec, [{"code": "HIS 14", "units": 3}, {"code": "ENGL 1A", "units": 3}], "x",
              "A.A. Degree")["coverage"]["missing"] == ["HIS14"], "without an id, HIST 14 stays unmatched")
both = [{"code": "HIS 14", "units": 3, "crsid": "HIST14"}, {"code": "HIS 15", "units": 3, "crsid": "HIST14"},
        {"code": "ENGL 1A", "units": 3}]
check(CI.listed_ids(both) == {}, "an id naming two listed courses names neither")
check(CI.listed_ids([{"code": "HIS 14", "crsid": "HIST14"}, {"code": "HIST 14"}]) == {},
      "an id the list holds as a code of its own is never a second code")
check(CI.listed_ids([{"code": "ENGWR 301", "crsid": "ENGL301-2507"}]) == {"ENGL301": "ENGWR301"},
      "an id is read through the suffix reading")
laney = {"program": {"total_units": {"min": 3, "max": 3}, "measure": "units"},
         "blocks": [{"name": "Electives", "rule": "choose_units", "minimum": 3,
                     "courses": [{"code": "COMM C1004", "units": 3}, {"code": "COMM 20", "units": 3}]}]}
renamed = S.with_course_ids(laney, {"COMM20": 3}, {"COMMC1004": "COMM20"})
check(not S.repeated(renamed) and renamed["blocks"][0]["courses"][0]["code"] == "COMM C1004",
      "a listed course the record already places is never named a second time (Laney 35261)")
# A listed course placed only through a kept alias (SPCH 20 for COMM 20) is placed: the route never names
# COMM C1004 onto it a second time (S653 review).
spch = {"program": {"total_units": {"min": 3, "max": 3}, "measure": "units"},
        "blocks": [{"name": "Required", "rule": "all",
                    "courses": [{"code": "COMM C1004", "units": 3, "catalog_addition": True},
                                {"code": "SPCH 20", "units": 3}]}]}
sc = S.score(spch, [{"code": "COMM 20", "units": 3, "crsid": "COMMC1004"}], "x", "A.A. Degree", {"SPCH": "COMM"})
check(sc["repeated"]["pass"] and not sc["repeated"]["codes"],
      "a course placed through a kept alias is never repeated by the route: %s" % sc["repeated"]["codes"])
check(not sc["coverage"]["missing"], "and SPCH 20 still covers the listed COMM 20")
check(S.with_course_ids(rec, {"HIS14": 3, "ENGL1A": 3}, {"HIST14": "HIS14"})["blocks"][0]["courses"][0]
      == {"code": "HIS14", "units": 3, "printed_code": "HIST14", "matched_by": "course_id"},
      "the rename keeps the printed code and names its route")
# The tag stays on the filed score through a reread and reaches the display (S653 review, item 2).
filed = {"record": rec, "score": S.score(rec, closed, "x", "A.A. Degree")}
check(filed["score"]["coverage"].get("course_id") == [{"printed": "HIST14", "listed": "HIS14", "matched_by": "course_id"}],
      "the filed score names the course-id match: %s" % filed["score"]["coverage"].get("course_id"))
check(filed["record"]["blocks"][0]["courses"][0]["code"] == "HIST 14", "the filed record keeps the code as printed")
reread = json.loads(json.dumps(filed))     # the reread loads the filed record and rescores it (reconcile's step)
check(S.score(reread["record"], closed, "x", "A.A. Degree") == filed["score"],
      "a reread's rescore of the filed record keeps the course-id tag, and nothing else moves")
check("course_id" not in S.score(rec, [{"code": "HIST 14", "units": 3}, {"code": "ENGL 1A", "units": 3}], "x",
                                 "A.A. Degree")["coverage"], "a score with no course-id match carries no tag")
import _build_roep_display as D  # noqa: E402
shown = D.tag_course_id({"HIST 14": {"title": "x"}, "ENGL 1A": {"title": "y"}}, reread["score"])
check(shown["HIST 14"].get("matched_by") == "course_id" and shown["HIST 14"].get("listed_as") == "HIS14"
      and "matched_by" not in shown["ENGL 1A"], "the display's course names its course-id route: %s" % shown)

# The capture carries both twins: a kept alias's printed code and the id (S653 review, item 1).
import _program_requirements_college as PC  # noqa: E402
import _program_requirements_pilot as PP  # noqa: E402
prog = PC.with_renumbers([{"closed_list": [{"code": "COMM 20", "units": 3, "crsid": "COMMC1004"},
                                           {"code": "COMM 1", "units": 3}]}], {}, {"SPCH": "COMM"})[0]
c20 = prog["closed_list"][0]
check(c20.get("printed") == "SPCH 20" and c20.get("printed_also") == ["COMM C1004"],
      "COMM 20 keeps the alias's SPCH 20 and gains the id COMM C1004: %s" % c20)
check(prog["closed_list"][1].get("printed") == "SPCH 1" and "printed_also" not in prog["closed_list"][1],
      "a course with no id keeps the alias alone")
for page, what in (("SPCH 20 and SPCH 1", "the alias's code"), ("COMM C1004 and SPCH 1", "the id")):
    check(PC.net_hits(prog["closed_list"], PC.page_codes(page)) == 2,
          "net_hits counts COMM 20 by %s (%s)" % (what, page))
    check(PP.coverage(PP.find_codes(page, prog["closed_list"]), prog["closed_list"]) == 1.0,
          "find_codes finds COMM 20 by %s" % what)
idonly = PC.with_renumbers([{"closed_list": [{"code": "HIS 14", "crsid": "HIST14"}]}], {}, {})[0]["closed_list"][0]
check(idonly.get("printed") == "HIST 14" and "printed_also" not in idonly, "with no alias the id is the printed twin")
same = PC.with_renumbers([{"closed_list": [{"code": "HIS 14", "crsid": "HIST14"}]}], {}, {"HIST": "HIS"})[0]["closed_list"][0]
check(same.get("printed") == "HIST 14" and "printed_also" not in same, "an alias and an id that agree carry one form")

ids = CI.load_ids()
check(ids.get("CCC000520542") == "HIST1", "the Program Course File's id for Moreno Valley's HIST 1 control number")

# ── The proof and the self-recall test, rebuilt from committed files ──────────────────────────────
import _course_id_route_census as K  # noqa: E402

# The dated plan is a record of S653, never compared byte for byte: a newly filed record moves it. The
# invariants below hold on whatever records are filed today.
plan = K.build()

recall = plan["self_recall"]["counts"]
# Floor (S653): 385 held matches named right by the route, none wrong. The 267 missed are matches whose file id
# agrees with the listed code (Merced's POLS, Barstow's POLI): the aliases keep those.
check(recall.get("wrong", 0) == 0, "self-recall: the route names no held match wrong (%s)" % recall)
check(recall.get("right", 0) >= 385, "self-recall: at least 385 held matches named right (floor; %s)" % recall)
check(plan["new_matches"]["counts"].get("conflict", 0) == 0,
      "no new match names a course the college lists under another control number and title")
check(not plan["status_change"].get("committed_list", {}).get("pass_to_fail")
      and not plan["status_change"].get("filed_list", {}).get("pass_to_fail"),
      "no filed record passing today fails under the route and the retired pairs")

conf = RC.load_steps()
retired, kept = [], []
for college, c in plan["colleges"].items():
    aliases = {k.replace(" ", "").upper(): v.replace(" ", "").upper()
               for k, v in ((conf.get(college) or {}).get("prefix_aliases") or {}).items()}
    for p in c["pairs"]:
        (retired if p["verdict"] == "retire" else kept).append((college, p["printed"]))
        if p["verdict"] == "retire":
            check(p["alias_matches"] > 0 and p["id_route_reproduces"] == p["alias_matches"]
                  and p["filed_list_reproduced"] == p["filed_list_matches"] and not p["missed_count"]
                  and not p["filed_list_missed_count"],
                  "%s %s for %s: every match the pair made is reproduced (%d of %d; filed lists %d of %d)"
                  % (college, p["printed"], p["file"], p["id_route_reproduces"], p["alias_matches"],
                     p["filed_list_reproduced"], p["filed_list_matches"]))
            check(p["printed"] not in aliases, "%s's retired %s is out of the config" % (college, p["printed"]))
        else:
            check(aliases.get(p["printed"]) == p["file"],
                  "%s keeps %s for %s as the fallback" % (college, p["printed"], p["file"]))
# S653 retired 7 and kept 10. S684 (2026-11-19): the S683 re-read of City College of San Francisco 43116 prints COMM 38,
# and against the list its score was taken against the route reproduces 38 of that pair's 39 matches, so the rule above
# keeps COMM for CMST as the fallback again: 6 retire, 11 stay.
check(len(retired) == 6 and len(kept) == 11, "6 of slice C's 17 pairs retire, 11 stay (%d, %d)" % (len(retired), len(kept)))

print("\n%d failed" % len(FAILS) if FAILS else "\nall passed")
sys.exit(1 if FAILS else 0)
