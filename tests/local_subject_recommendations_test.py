#!/usr/bin/env python3
"""kb/_build_local_subject_recommendations.py (S700, #3655; Sam, 2026-11-21: a recommendation beside every row
with no catalog title, its confidence measured before it shows).

Failure modes: a titled code's own heading counted in its own vote (every source would read 100%); a score that is
not the one its source measured; program titles reaching 90 (Sam: they inform, never set); a Low, Medium or High level
left anywhere in the file after Sam's ruling of 2026-11-25 (r-confidence-0-100-in-all-commons-procedures-sam-2026-11-25:
"confidence bars 0-100 rather than low, med, high throughout all commons procedures"); a confidence written on the old
0-1 scale; a row left on the
noncredit hold after it lifted (S701), or a noncredit title guessed from a category name; a noncredit score claimed
above its measured share; a category with no common code given one; a differing source left out of sight; the subject map or Sam's 30 decisions read as a
source; a committed file that the daily build would rewrite.

Run from repo root: python3 tests/local_subject_recommendations_test.py
"""
import json
import os
import re
import sys
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _build_local_subject_recommendations as R  # noqa: E402

results = []


def check(name, cond):
    results.append(bool(cond))
    print(("  ok  " if cond else "FAIL  ") + name)


check("a title is right when it equals the heading after folding case, '&' and punctuation",
      R.same("Anatomy & Physiology", "ANATOMY AND PHYSIOLOGY") and not R.same("Chicano Studies", "Computer Science"))
check("a title that names the other whole is right; a shared word alone is not",
      R.same("Welding", "Welding Technology") and not R.same("Business Law", "Business Management"))
check("a vote folds spellings of one title and breaks a tie by the text, never by order",
      R.vote(["Art", "ART", "Music"])[1:] == (2, 3) and R.vote(["B", "A"])[0] == R.vote(["A", "B"])[0])

data = R.Data(ROOT)
titled = [r for r in data.rows if r["printed_name"]]
alone = [r for r in titled if len(data.titled[r["code"]]) == 1]
check("a code titled at one college only gets no vote from other colleges or its district: its own heading is out",
      alone and all("other_colleges" not in R.sources(data, r["slug"], r["code"])
                    and "district" not in R.sources(data, r["slug"], r["code"]) for r in alone[:200]))
src = open(os.path.join(ROOT, "kb", "_build_local_subject_recommendations.py"), encoding="utf-8").read()
check("the subject map is never opened", "subject_discipline_map" not in src)
check("Sam's 30 decisions are read for the score only", src.count("DECISIONS") == 2)

doc = R.build(ROOT)
table = doc["measured_on_titled_codes"]
for s, conds in table.items():
    for c, m in conds.items():
        want = int(round(100 * m["right"] / m["asked"] + 1e-9))
        if m["asked"] < 20:
            want = min(want, 59)
        if s == "program_titles":
            want = min(want, 89)
        check("%s, %s: %d of %d right scores %d" % (s, c, m["right"], m["asked"], want), m["score"] == want)
check("program titles never score 90 or more", all(m["score"] < 90 for m in table.get("program_titles", {}).values()))
check("a cell measured on fewer than 20 codes scores under 60 (sibling same letters, 2 of 2)",
      all(m["score"] <= R.THIN_CAP for conds in table.values() for m in conds.values() if m["asked"] < 20))


def walk(x, path=""):
    if isinstance(x, dict):
        for k, v in x.items():
            yield from walk(v, path + "/" + k)
            yield path + "/" + k, k, v
    elif isinstance(x, list):
        for i, v in enumerate(x):
            yield from walk(v, path + "[%d]" % i)


text = R.dump(doc)
leaks = [p for p, k, v in walk(doc) if k == "level" or k.endswith("_level") or k == "levels"
         or (isinstance(v, str) and v in ("Low", "Medium", "High"))]
check("⭐ Sam, 2026-11-25: no Commons recommendation output carries a Low, Medium or High level %s" % leaks[:3], not leaks)
check("⭐ no totals key is named by a level (title_high, common_medium, ...)",
      not [k for k in doc["totals"] if re.search(r"_(high|medium|low)$", k)])
confs = [v for p, k, v in walk(doc) if k == "confidence" and v is not None]
check("⭐ every confidence is a whole number from 0 to 100, never the old 0-1 share",
      confs and all(isinstance(v, int) and 0 <= v <= 100 for v in confs) and any(v > 1 for v in confs))

recs = {(c["slug"], r["code"]): r for c in doc["colleges"] for r in c["rows"]}
# ── S701: the hold lifted (r-noncredit-title-list-go-sam-2026-11-22) ──
check("no row is left on the noncredit hold", not [r for r in data.rows if r["title_state"] == "noncredit_hold"])
nct, ncc = doc["noncredit"]["title_from_the_list"], doc["noncredit"]["common_code_from_the_category"]
for c, m in sorted(nct.items()) + [("common code", ncc)]:
    want = int(round(100 * m["right"] / m["asked"] + 1e-9)) if m["asked"] else 0
    if m["asked"] < 20:
        want = min(want, 59)
    check("noncredit %s: %d right, %d wrong of %d scores %d, never above its measured share" % (c, m["right"], m["wrong"], m["asked"], want),
          m["score"] == want and m["right"] + m["wrong"] == m["asked"])
nc_only = [r for r in data.rows if r["noncredit_courses"] and not r["credit_courses"]]
listed = {t["title"]: t for t in data.nc_titles}
ok = True
for r in nc_only:
    t = recs.get((r["slug"], r["code"]), {}).get("title")
    if t:
        lt = listed.get(t["title"])
        ok = ok and t["from"] == "noncredit_list" and lt is not None and lt["category"] == R.dominant(r)[0]
check("⭐ every noncredit title recommendation is a title of the standing list under the row's own dominant category", ok)
fed = Counter()
for r in nc_only:
    t_ = recs.get((r["slug"], r["code"]), {}).get("title")
    if t_ and t_["from"] == "noncredit_list":
        got = R.noncredit_list(data, r)
        fed[got[1] if got else None] += 1
check("⭐ no noncredit title condition measured under 50% right feeds a recommendation",
      fed and all(c is not None and nct[c]["share"] >= 0.5 and nct[c]["used"] for c in fed)
      and all(m["used"] == (m["share"] >= 0.5) for m in nct.values()))
check("all four conditions stay measured in the file, the two guesses marked unused",
      set(nct) == {"same code", "letters, one title", "letters, several titles", "courses match"}
      and not nct["letters, several titles"]["used"] and not nct["courses match"]["used"])
check("the common code's note names the subject map as its answer key, which reads a code without its band",
      "subject map" in doc["noncredit"]["note"] and "without its credit or noncredit band" in doc["noncredit"]["note"] and ncc["score"] < 60)
nocode = [(r, recs[(r["slug"], r["code"])]["common"]) for r in nc_only if (r["slug"], r["code"]) in recs
          and recs[(r["slug"], r["code"])].get("common", {}).get("code", "x") is None]
check("⭐ a noncredit-only code under a category with no common code names the category and recommends no code",
      nocode and all(c["category"] and c["category"] in c["why"] and "no common subject code yet" in c["why"]
                     and not (data.nc_mq.get(c["category"]) or {}).get("common_code") for _, c in nocode))
check("a category that holds a code recommends that code", all(
    recs[k]["common"]["code"] == data.nc_mq[recs[k]["common"]["category"]]["common_code"]
    for k in recs if recs[k].get("common", {}).get("from") == "noncredit_category" and recs[k]["common"]["code"]))
spans = [recs[(r["slug"], r["code"])] for r in nc_only if len([p for p in (r["categories"] or []) if p[0] != R.NO_CATEGORY]) > 1
         and (r["slug"], r["code"]) in recs and recs[(r["slug"], r["code"])].get("common")]
check("a code spanning several categories names its dominant one and says the share", spans and all("%)" in x["common"]["why"] for x in spans))
check("a titled row is never given a title", all("title" not in recs[(r["slug"], r["code"])]
                                                   for r in titled if (r["slug"], r["code"]) in recs))
check("a row that already holds a common code is never given one",
      all("common" not in recs[(r["slug"], r["code"])] for r in data.rows
          if r["common"] and (r["slug"], r["code"]) in recs))
differs = [r["title"] for r in recs.values() if r.get("title", {}).get("also")]
check("where sources differ every candidate scores 89 at most and the other title shows (S722: each candidate carries its own bar)",
      differs and all(t["confidence"] <= R.DISAGREE_CAP and all(c["confidence"] <= R.DISAGREE_CAP for c in t["candidates"])
                      and len(t["candidates"]) == len(t["also"]) + 1 for t in differs))
agree = [r["title"] for r in recs.values() if len((r.get("title", {}).get("candidates") or [{}])[0].get("from") or []) > 1
         and len(r["title"]["candidates"]) == 1]
check("sources that agree join at 1 - the product of their misses, 99 at most, never below the strongest alone",
      agree and all(t["confidence"] <= R.JOIN_CAP for t in agree))
cands = [r["title"]["candidates"] for r in recs.values() if r.get("title", {}).get("candidates")]
check("S722: every candidate title is listed, most confident first, the first is the recommendation",
      cands and all([c["confidence"] for c in cs] == sorted([c["confidence"] for c in cs], reverse=True) for cs in cands)
      and all(r["title"]["title"] == r["title"]["candidates"][0]["title"] for r in recs.values() if r.get("title", {}).get("candidates")))
mech = [r["title"] for (sl, cd), r in recs.items() if sl == "clovis_community" and cd == "MECH"]
# The runner-up is whatever the other sources say today (Law in S722; Business once S730's catalog reads joined more
# courses): the guard is that the search's title leads over a source that reads differently.
# S749: COBI's COCI-read title for Clovis MECH (batch 5, Sam's "Yes all" of 2026-11-28) is the search's title, filed, so
# a titled MECH takes no title recommendation ("a titled row is never given a title"). Where it is filed, the guard is
# that the filed title is the one the search found; where it is not, the search's title must lead as before.
_mech_filed = [r for r in json.load(open(os.path.join(ROOT, "kb", "hand_filed_catalogs", "subjects", "clovis_community.json")))["rows"]
               if r["code"] == "MECH" and r.get("heading")]
check("S722, Sam: a web search on the college's own site that found the title lifts it (Clovis MECH reads Mechatronics over a differing source)",
      (_mech_filed and _mech_filed[0]["heading"] == "Mechatronics/Industrial Automation" and not (mech and mech[0].get("candidates")))
      or (mech and mech[0]["title"] == "Mechatronics/Industrial Automation" and len(mech[0]["candidates"]) > 1
          and mech[0]["candidates"][1]["title"] != mech[0]["candidates"][0]["title"] and "web_search" in mech[0]["candidates"][0]["from"]))
s30 = doc["common_code"]["sams_30"]
check("Sam's 30 are all accounted for: agree, diverge or no recommendation",
      s30["agree"] + s30["diverge"] + len(s30["no_recommendation"]) == s30["decisions"] == 30)
check("every divergence names Sam's code beside the recommended one", all(d["sam"] != d["recommended"] for d in s30["divergences"]))
check("two builds write the same bytes", R.dump(doc) == R.dump(R.build(ROOT)))
path = os.path.join(ROOT, R.OUT)
check("the committed file is the one the daily build would write",
      os.path.exists(path) and open(path, encoding="utf-8").read() == R.dump(doc))
sr = json.load(open(os.path.join(ROOT, R.SEARCHES), encoding="utf-8"))["searches"]
check("every filed search names its query, its date and where its result sits",
      all(x.get("query") and x.get("searched_on") and x.get("where") in ("catalog", "college site", "none") for x in sr))
check("a title or a label is recorded only from the college's own site", all(x["where"] != "none" for x in sr if x.get("title") or x.get("label")))
alone = [r["title"] for r in recs.values() if (r.get("title", {}).get("candidates") or [{}])[0].get("from") == ["web_search"]]
# Sam, 2026-11-24 (S722), updating his 2026-11-21 word that a search "lifts or lowers": "If you did a web search and found
# a match ... your confidence bar should get higher". A title from the college's own site reads at WEB_SCORE["title"]
# (80), a label at WEB_SCORE["label"] (55); neither reaches 90 alone.
check("a search by itself scores 80 for a title and 55 for a label, never 90 (Sam, S722)", alone and all(
    t["confidence"] < 90 and t["confidence"] in (R.WEB_SCORE["title"], R.WEB_SCORE["label"]) for t in alone))
labeled = {(x["college"], x["local_code"]) for x in sr if x.get("label") and not x.get("title")}
check("a department label is kept and read: a row it alone names says it is a label",
      labeled and all("label" in recs[k]["title"]["why"] for k in labeled if k in recs and recs[k].get("title", {}).get("from") == "web_search"))
T = doc["totals"]
check("the totals add up", T["no_title"] == sum(T.get(k, 0) for k in ("title_90_plus", "title_60_to_89", "title_under_60", "title_none")))
check("the title bands count the scores they name", T.get("title_90_plus", 0) == sum(
    1 for r in recs.values() if r.get("title") and r["title"]["confidence"] >= 90))

print("%d/%d checks passed" % (sum(results), len(results)))
sys.exit(0 if all(results) else 1)
