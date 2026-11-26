#!/usr/bin/env python3
"""S740: the cited course renumbers at Shasta and Los Angeles Trade-Technical (kb/program_requirements_reconcile.json).

WHY. Three records held in S739 on codes the catalog prints otherwise than the state's file lists them: Shasta 18655
(SOC C1000 for SOCI C1000), Los Angeles Trade-Technical 31089 (BLDGTCQ 007, 008 and 009 for BLDGCTQ, PLUMBING 028 for
PLUMBNG 28) and 41150 (DIGMD 100, 101 and 104 for DIGLMD). S739's second reader held 41150's rename until a catalog
line showed the same course. College-page-read run 45837455365 read those lines, and each pair is filed as a course
renumber, cited by the title and units both print. Pinned here:

  * each pair carries its citation: the printed code, the file's code, a title, units, the session, and evidence that
    names the page read; the pairs and the citations are the same set;
  * each file's code is on the state's list of the program it was read for, with the cited units, and the printed
    code is on no such list (a renumber is never read where the file lists the printed code);
  * BLDGTCQ 014 is no pair: the catalog's title for it is not the file's;
  * with the pairs read, a fresh score (the scorer with the college's renumbers, no page text) finds 18655 and 31089
    collectable (coverage and invented pass) with their arithmetic still failing, 41150 passing, and 31280 still not
    collectable (CRPNTRY 111C unplaced);
  * no other college's entry changed: the pairs name whole courses, never a subject prefix.

Run from repo root: python3 tests/program_renumbers_s740_test.py
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_named_gaps as NG  # noqa: E402
import _program_piles_s714_ccsf as C  # noqa: E402
import _program_requirements_reconcile as R  # noqa: E402
import _program_requirements_score as S  # noqa: E402

RUN = "45837455365"
SHASTA, LATTC = "Shasta College", "Los Angeles Trade Technical College"
PAIRS = {
    SHASTA: {"SOC C1000": ("SOCIC1000", ("18655",))},
    LATTC: {"BLDGTCQ 007": ("BLDGCTQ 7", ("31089",)), "BLDGTCQ 008": ("BLDGCTQ 8", ("31089",)),
            "BLDGTCQ 009": ("BLDGCTQ 9", ("31089",)), "PLUMBING 028": ("PLUMBNG 28", ("31089", "31280")),
            "DIGMD 100": ("DIGLMD100", ("41150",)), "DIGMD 101": ("DIGLMD 101", ("41150",)),
            "DIGMD 104": ("DIGLMD 104", ("41150",))},
}
n, failures = 0, []


def check(cond, msg):
    global n
    n += 1
    if not cond:
        failures.append(msg)


def record(slug, cn):
    with open(os.path.join(NG.COLLEGE_DIR, slug, "records", cn + ".json"), encoding="utf-8") as fh:
        return json.load(fh)


steps = R.load_steps()
for college, pairs in PAIRS.items():
    conf = steps[college]
    check(conf["course_renumbers"] == {k: v[0] for k, v in pairs.items()} and not conf.get("prefix_aliases")
          and conf["steps"] == [], "%s: the entry holds its pairs, no prefix alias and no reconcile step" % college)
    cited = {c["printed"]: c for c in conf["course_renumbers_cited"]}
    check({k: c["file"] for k, c in cited.items()} == conf["course_renumbers"], "%s: each pair is cited" % college)
    for printed, (file_code, programs) in pairs.items():
        c = cited[printed]
        check(c["title"] and c["units"] and c["session"] == "S740" and RUN in c["evidence"]
              and c["catalog_sources"] == ["college_page_read"],
              "%s %s: its citation names a title, units and the page read" % (college, printed))
        for cn in programs:
            listed = {S.norm_code(x.get("code")): x for x in C.closed_list(college, cn)}
            check(S.norm_code(file_code) in listed and S.norm_code(printed) not in listed,
                  "%s %s: %s lists the file's code and not the printed one" % (college, printed, cn))
            units = listed.get(S.norm_code(file_code), {}).get("units")
            check(units in (None, float(c["units"])), "%s %s: the cited units are the file's" % (college, printed))
    check(R.prefix_aliases(college) == conf["course_renumbers"], "%s: the scorer reads exactly these pairs" % college)
check("BLDGTCQ 014" not in steps[LATTC]["course_renumbers"]
      and "BLDGTCQ 014 is left out" in json.dumps(steps[LATTC]["course_renumbers_cited"]),
      "BLDGTCQ 014 is no pair: the catalog's title for it is not the file's")
check("Introduction to Digital Video" in next(c for c in steps[LATTC]["course_renumbers_cited"]
                                              if c["printed"] == "DIGMD 100")["evidence"],
      "DIGMD 100's citation names both titles the catalog prints for DIGLMD 100")

# What the pairs move, on a fresh score. A record a later reconcile has rescored already carries the pairs, so the
# fresh score is read each time, never the filed one.
for slug, cn, collectable, passes in (("shasta", "18655", True, False),
                                      ("los_angeles_trade_technical", "31089", True, False),
                                      ("los_angeles_trade_technical", "41150", True, True),
                                      ("los_angeles_trade_technical", "31280", False, False)):
    f = record(slug, cn)
    fr = C.fresh_score(f)
    check(NG.collectable(fr) is collectable, "%s %s: collectable %s with the pairs read" % (slug, cn, collectable))
    check(bool(collectable and (fr.get("arithmetic") or {}).get("pass")) is passes,
          "%s %s: passing %s with the pairs read" % (slug, cn, passes))
f = record("los_angeles_trade_technical", "31280")
check("CRPNTRY111C" in (C.fresh_score(f).get("coverage") or {}).get("unexplained", []),
      "31280: CRPNTRY 111C is still unplaced, so it is not collectable")

print("%d checks, %d failures" % (n, len(failures)))
for m in failures:
    print("FAIL:", m)
sys.exit(1 if failures else 0)
