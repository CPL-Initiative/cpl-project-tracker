#!/usr/bin/env python3
"""Every local subject code statewide (kb/_statewide_subject_codes.py, S712; Sam's asks of 2026-11-23).

WHAT THIS GUARDS (each a way the list would send a person to the wrong common code, or hide a code):
  (1) every subject code in the state course list appears once, with every college that files a course under it, and
      the pairs and courses add up to the state list's own (a code a college renamed counts under its new code there);
  (2) every code carries a call and a confidence between 0 and 1 (Sam: "always provide a recommendation ... and
      always provide a confidence score, even if it's 5%"), the call a common code of the Common Subjects Reference or
      of a noncredit category, and the runner-up never the call itself;
  (3) a person's statewide filing is settled at 100% on the code the person filed;
  (4) no vote comes from an M-ID whose discipline rests on a TOP code alone, and no M-ID votes for the code that named
      it: Cerritos AED, whose courses gave ELEC M90xx their discipline, is not called ELEC;
  (5) a code whose courses are mostly noncredit takes its leading COCI category's common code (ESLNC is ESLN), and a
      code whose titles are another code's numbers ("AJ 359") takes that code's call;
  (6) the confidence holds where it is highest: on the labelled codes, the top band is right 95% or more;
  (7) a rerun writes the same bytes as the committed file.

Run from repo root: python3 tests/statewide_subject_codes_test.py
"""
import collections
import importlib.util
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(ROOT, "kb"))
spec = importlib.util.spec_from_file_location("ssc", os.path.join(ROOT, "kb", "_statewide_subject_codes.py"))
ssc = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ssc)
import _build_subject_courses as B  # noqa: E402
import subject_decisions as sd  # noqa: E402

FAILS, N = [], [0]


def check(name, ok, detail=""):
    N[0] += 1
    print(("PASS " if ok else "FAIL ") + name + ("" if ok else "  " + str(detail)[:300]))
    if not ok:
        FAILS.append(name)


rows_of = {}
doc = ssc.build(ROOT, courses_out=rows_of)
codes = {c["code"]: c for c in doc["codes"]}
state = B.read_state(ROOT)
names = [ssc.college_name(n) for n in state["colleges"]]
# A renamed code counts under the code its college uses now (kb/subject_code_history.py, S715), so the expected
# pairs go through the same history.
import subject_code_history as SCH  # noqa: E402
_hist = SCH.load(ROOT)
pairs = collections.defaultdict(set)
for r in state["rows"]:
    if sd.map_key(r[2]):
        pairs[sd.map_key(SCH.resolve(_hist, B.college_key(names[r[0]]), r[2], by="by_college"))].add(names[r[0]])

# (1)
check("(1) every state-list code appears once", set(codes) == set(pairs) and len(codes) == len(doc["codes"]),
      (len(codes), len(pairs)))
check("(1) each code names every college that files a course under it",
      all({c for c, _ in codes[k]["colleges"]} == pairs[k] for k in pairs))
check("(1) pairs and courses add up to the state list's", doc["totals"]["pairs"] == sum(len(v) for v in pairs.values())
      and doc["totals"]["courses"] == sum(1 for r in state["rows"] if sd.map_key(r[2])))

# (2)
with open(os.path.join(ROOT, sd.CANONICAL), encoding="utf-8") as f:
    _bc, by_disc = sd.canonical_codes(json.load(f))
allowed = set(by_disc.values()) | {v for v in sd.nc_codes_table().values() if v}
bad = [k for k, c in codes.items() if not c["recommend"]["common"] or c["recommend"]["common"] not in allowed
       or not (0 < c["recommend"]["confidence"] <= 1)]
check("(2) every code has a call among the common codes and a confidence in (0, 1]", not bad, bad[:5])
same = [k for k, c in codes.items() if c["recommend"].get("next") and c["recommend"]["next"]["common"] == c["recommend"]["common"]]
check("(2) the runner-up is never the call itself", not same, same[:5])
check("(2) the classes cover every code", sum(v["codes"] for v in doc["totals"]["by_class"].values()) == len(codes))

# (3)
filings = json.load(open(os.path.join(ROOT, "kb", "status", "subject_decisions.json"), encoding="utf-8")).get("statewide") or []
settled = [c for c in doc["codes"] if c["class"] == "settled"]
check("(3) a statewide filing is settled at 100%", len(settled) >= 1 and all(c["recommend"]["confidence"] == 1.0 and c["filing"] for c in settled),
      len(settled))
check("(3) every filed code that the state list holds is settled", all(codes[sd.map_key(f["code"])]["class"] == "settled"
      for f in filings if sd.map_key(f["code"]) in codes))

# (4)
nv = doc["totals"]["no_vote"]
check("(4) TOP-only disciplines and an M-ID's own modal subject are kept out of the vote",
      nv.get("discipline from a TOP code only", 0) > 0 and nv.get("the M-ID's own modal subject", 0) > 0, nv)
aed = codes.get("AED")
check("(4) Cerritos AED is not called ELEC", aed is not None and aed["recommend"]["common"] != "ELEC", aed and aed["recommend"])

# (5)
eslnc = codes.get("ESLNC")
check("(5) a noncredit code takes its category's common code (ESLNC is ESLN)",
      eslnc is not None and eslnc["class"] == "noncredit" and eslnc["recommend"]["common"] == "ESLN", eslnc and eslnc["recommend"])
named = [c for c in doc["codes"] if c["class"] == "named_code"]
lawen = codes.get("LAWEN")
# A person's statewide filing outranks the rule (person-settled wins, Sam 2026-11-16): LAWEN was filed CRIM by
# 2026-11-25's daily build, so it reads `settled`. The rule still decides the other named codes; LAWEN keeps CRIM
# either way, and only a person's filing may settle it.
lawen_ok = lawen is not None and lawen["recommend"]["common"] == "CRIM" and (
    lawen["class"] == "named_code"
    or (lawen["class"] == "settled" and lawen["recommend"]["why"] == "a person filed it statewide"))
check("(5) a code whose titles are another code's numbers takes that code's call (LAWEN's AJ courses are CRIM)",
      bool(named) and lawen_ok, lawen and (lawen["class"], lawen["recommend"]))

emls = codes.get("EMLS")
check("(5) a noncredit code with credit courses carries a credit call beside its category call",
      emls is not None and (emls["class"] != "noncredit" or (emls["credit"] == 0) or (emls.get("credit_call") or {}).get("common") not in (None, emls["recommend"]["common"])),
      emls and (emls["class"], emls["recommend"], emls.get("credit_call")))

# (6)
top = doc["self_recall"][0]
check("(6) the top confidence band is right 95% or more on the labelled codes",
      top["tried"] >= 100 and top["accuracy"] >= 0.95, top)

check("(1) a college COCI lists twice (\"... Credit\") is one college: 118 in all",
      doc["totals"]["colleges"] == len(set(names)) and not any(n.endswith(" Credit") for n in names), doc["totals"]["colleges"])

# (7)
with open(os.path.join(ROOT, ssc.OUT), encoding="utf-8") as f:
    committed = f.read()
check("(7) a rerun writes the committed file's bytes", committed == ssc.dump(doc))

# (8) S722: the course files by code, which the MQ view's and the statewide list's Courses counts open.
files = ssc.course_files(doc["codes"], rows_of)
filed = {}
for k, t in files.items():
    filed.update(json.loads(t)["codes"])
check("(8) every code's course file holds exactly the courses the statewide list counts for it",
      set(filed) == set(codes) and all(len(filed[k]["rows"]) == codes[k]["courses"] for k in codes),
      [k for k in codes if len(filed.get(k, {}).get("rows", [])) != codes[k]["courses"]][:5])
check("(8) each course sits at one of its code's colleges, in the statewide list's order",
      all(filed[k]["colleges"] == [x[0] for x in codes[k]["colleges"]] for k in codes))
check("(8) a code's file is named by its first character, as commons_subjects.js reads it",
      all(k in json.loads(files[ssc.shard_of(k)])["codes"] for k in codes) and ssc.shard_of("ab") == "A" and ssc.shard_of("#X") == "_")
check("(8) no course file passes 3 MB (the page reads one per Courses count)", max(len(t.encode()) for t in files.values()) < 3 * 1024 * 1024)
check("(8) a rerun writes the committed course files' bytes",
      all(os.path.exists(os.path.join(ROOT, ssc.COURSES_DIR, k + ".json")) and open(os.path.join(ROOT, ssc.COURSES_DIR, k + ".json"), encoding="utf-8").read() == t for k, t in files.items()))
js = open(os.path.join(ROOT, "commons_subjects.js"), encoding="utf-8").read()
check("(8) the page reads the course files, never the 17 MB state list, for a Courses count",
      'CODE_COURSES_DIR = "kb/status/statewide_code_courses/"' in js and "coci_lookup_data.js\"" not in js and "loadScript(" not in js.split("function loadCodeCourses")[1].split("function coursesOf")[0])

print("\n%d of %d checks passed" % (N[0] - len(FAILS), N[0]))
sys.exit(1 if FAILS else 0)
