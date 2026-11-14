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
check(S.with_course_ids(rec, {"HIS14": 3, "ENGL1A": 3}, {"HIST14": "HIS14"})["blocks"][0]["courses"][0]
      == {"code": "HIS14", "units": 3, "printed_code": "HIST14", "matched_by": "course_id"},
      "the rename keeps the printed code and names its route")
ids = CI.load_ids()
check(ids.get("CCC000520542") == "HIST1", "the Program Course File's id for Moreno Valley's HIST 1 control number")

# ── The proof and the self-recall test, rebuilt from committed files ──────────────────────────────
import _course_id_route_census as K  # noqa: E402

plan = K.build()
text = json.dumps(plan, indent=1, sort_keys=True, ensure_ascii=False) + "\n"
with open(K.OUT, encoding="utf-8") as fh:
    check(fh.read() == text, "the committed plan is current (python3 kb/_course_id_route_census.py)")

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
check(len(retired) == 7 and len(kept) == 10, "7 of slice C's 17 pairs retire, 10 stay (%d, %d)" % (len(retired), len(kept)))

print("\n%d failed" % len(FAILS) if FAILS else "\nall passed")
sys.exit(1 if FAILS else 0)
