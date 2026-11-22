#!/usr/bin/env python3
"""Noncredit subject decisions, keyed by COCI noncredit category, honored by the daily build (#3655).

The Subjects page saves a code's noncredit courses one kb_curation row per category, SUBJ:<college>|<code>|nc:<slug>
(d-subject-save-key-three-part-s698), the slugs from one committed list (kb/status/noncredit_categories.json slugs,
kb/_build_noncredit_categories.py). Rulings: r-subject-save-path-kb-curation-sam-2026-11-22 (a person's save wins);
r-noncredit-disciplines-separate-in-mqs-sam-2026-11-21 (a noncredit decision touches the code's noncredit courses in
its category only); d-noncredit-four-categories-no-code-s701 (a category with no common code takes a title only).

WHAT THIS GUARDS (each a way a noncredit save would be lost, misapplied, or leak into the mint):
  (1) a category name with spaces, a slash or an ampersand takes a clean slug, one per category, and the page reads
      the same list the decisions reader does;
  (2) an nc: decision changes only that category's noncredit courses at that college: never a credit course, never
      another category, never another college;
  (3) on the committed data, an nc: decision changes only its own row, and the titles and recommendations builders
      stop recommending for the part a person decided;
  (4) a noncredit decision never routes a mint: the pile mint's plan is the plan with no decision, section for section;
  (5) an unknown or malformed category slug, and a code on a category with none, are refused and listed;
  (6) the sync accepts credit, whole and nc:<a listed slug> and lists every other band as unreadable.

Run from repo root: python3 tests/subject_decisions_noncredit_test.py
"""
import importlib.util
import json
import os
import re
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(ROOT, "kb"))
sys.path.insert(0, HERE)


def load(name, rel):
    spec = importlib.util.spec_from_file_location(name, os.path.join(ROOT, rel))
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


import subject_decisions as sd  # noqa: E402
import _build_noncredit_categories as ncat  # noqa: E402
lst = load("lst_nc", "kb/_build_local_subject_titles.py")
sync = load("sync_nc", "kb/_sync_subject_decisions.py")
R = load("rec_nc", "kb/_build_local_subject_recommendations.py")
import _pile_mint_dryrun as pm  # noqa: E402
import pile_mint_fixture as pmf  # noqa: E402

FAILS = []


def check(name, cond, why=""):
    print(("PASS " if cond else "FAIL ") + name + ("" if cond or not why else "  [%s]" % why))
    if not cond:
        FAILS.append(name)


def dec(key, common=None, title=None, who="a reviewer", at="2026-11-22T05:00:00Z"):
    k = sd.parse_key(key)
    return {"key": key, "college": k[0], "code": k[1], "band": k[2], "local_title": title, "common_code": common,
            "who": who, "at": at}


# ── (1) the slugs ────────────────────────────────────────────────────────────
check("(1) ⭐ an ampersand reads and; a slash, a parenthesis and spaces fold to one hyphen",
      ncat.category_slug("Health & Safety") == "health-and-safety"
      and ncat.category_slug("Arts/Crafts & Design") == "arts-crafts-and-design"   # the page test's fixture category
      and ncat.category_slug("English as a Second Language (ESL)") == "english-as-a-second-language-esl"
      and ncat.category_slug("  Short-term   Vocational ") == "short-term-vocational"
      and ncat.category_slug(ncat.NO_CATEGORY) == "uncategorized")
try:
    ncat.slugs_of(["Health & Safety", "Health and Safety"])
    clash = False
except SystemExit as e:
    clash = "slugs to" in str(e)
check("(1) two categories that would share a slug are refused", clash)
cats_doc = json.load(open(os.path.join(ROOT, ncat.OUT), encoding="utf-8"))
slugs = cats_doc.get("slugs") or {}
check("(1) ⭐ the committed list names a slug for every category the export counts, each unique and clean",
      set(slugs) == {c for c, _n in cats_doc["categories"]} and len(set(slugs.values())) == len(slugs)
      and all(sd.NC_SLUG_RE.match(s) for s in slugs.values()), json.dumps(slugs)[:300])
titles = json.load(open(os.path.join(ROOT, lst.OUT), encoding="utf-8"))
check("(1) ⭐ the page reads the same list: the titles file's noncredit_slugs is the categories file's slugs",
      titles.get("noncredit_slugs") == slugs and sd.read_slugs(ROOT) == {v: k for k, v in slugs.items()})
check("(1) the titles file lists each code's noncredit decisions in its own column", "noncredit_decisions" in titles["columns"])

# ── (2), (5) the reader ──────────────────────────────────────────────────────
CANON = {"disciplines": {"Vocational": {"canonical_subj4": "VOCE"}, "Older Adults: Noncredit": {"canonical_subj4": "OLAD"},
                         "Kinesiology": {"canonical_subj4": "KINE"}}}
NCS = {"short-term-vocational": "Short-term Vocational", "courses-for-older-adults": "Courses for Older Adults",
       "workforce-preparation": "Workforce Preparation", "uncategorized": sd.NO_CATEGORY}
NCC = {"Short-term Vocational": "VOCE", "Courses for Older Adults": "OLAD", "Workforce Preparation": None}
D = sd.Decisions({"decisions": [
    dec("SUBJ:cerritos|AED|nc:short-term-vocational", "VOCE", "Electrical Apprenticeship"),
    dec("SUBJ:cerritos|AED|nc:workforce-preparation", None, "Work Readiness", at="2026-11-23T01:00:00Z"),
    dec("SUBJ:cerritos|AED|credit", "KINE"),
    dec("SUBJ:cerritos|AED|nc:bogus", "VOCE"),
    dec("SUBJ:cerritos|AED|nc:Bad_Slug", "VOCE"),
    dec("SUBJ:cerritos|AED|nc:workforce-preparation-2", "VOCE"),
    dec("SUBJ:cerritos|WP|nc:workforce-preparation", "VOCE"),
    dec("SUBJ:cerritos|AED|noncredit", "VOCE")]}, CANON, NCS, NCC)
check("(2) ⭐ a noncredit decision is kept apart from the credit and whole decisions the mint reads",
      set(D.noncredit) == {("cerritos", "AED", "short-term-vocational"), ("cerritos", "AED", "workforce-preparation")}
      and set(D.college) == {("cerritos", "AED", "credit")})
v = D.for_noncredit_course("cerritos", "aed", "N", "Short-term Vocational")
e = D.for_noncredit_course("cerritos", "AED", "E", "Short-term Vocational")
check("(2) ⭐ it gives its code to a noncredit and a noncredit enhanced course of its category at its college",
      v and v["common_code"] == "VOCE" and e and e["key"] == v["key"])
check("(2) ⭐ never a credit course, another category, another college, or a title-only decision",
      D.for_noncredit_course("cerritos", "AED", "C", "Short-term Vocational") is None
      and D.for_noncredit_course("cerritos", "AED", "N", "Courses for Older Adults") is None
      and D.for_noncredit_course("other", "AED", "N", "Short-term Vocational") is None
      and D.for_noncredit_course("cerritos", "AED", "N", "Workforce Preparation") is None)
check("(2) ⭐ the credit course reads the credit decision alone", D.for_course("cerritos", "AED", "C")["key"] == "SUBJ:cerritos|AED|credit"
      and D.for_course("cerritos", "AED", "N") is None)
t = D.noncredit_title("cerritos", "AED", "short-term-vocational")
t2 = D.noncredit_title("cerritos", "AED", "courses-for-older-adults")
check("(2) the title is the dominant category's; where it has none, another category's stands, marked moved",
      t["local_title"] == "Electrical Apprenticeship" and not t["moved"] and t2["local_title"] == "Work Readiness" and t2["moved"])
check("(2) the dominant category: most courses, ties A to Z, a named category before the export's blank one",
      sd.dominant([["B", 3], ["A", 3], ["C", 1]]) == "A" and sd.dominant([[sd.NO_CATEGORY, 9], ["Parenting", 2]]) == "Parenting"
      and sd.dominant([[sd.NO_CATEGORY, 2]]) == sd.NO_CATEGORY and sd.dominant(None) is None)
why = {r["key"]: r["why"] for r in D.refused}
check("(5) ⭐ an unknown slug, a malformed one, a code on a category with none, and a bare noncredit band are refused and listed",
      "is not one kb/status/noncredit_categories.json names" in why.get("SUBJ:cerritos|AED|nc:bogus", "")
      and "is not credit, whole or nc:" in why.get("SUBJ:cerritos|AED|nc:Bad_Slug", "")
      and "is not one" in why.get("SUBJ:cerritos|AED|nc:workforce-preparation-2", "")
      and "has no common subject code, so it takes a title only" in why.get("SUBJ:cerritos|WP|nc:workforce-preparation", "")
      and "is not credit, whole or nc:" in why.get("SUBJ:cerritos|AED|noncredit", ""), json.dumps(why))
check("(5) with no slug list given, every nc: band is refused", not sd.Decisions({"decisions": [dec("SUBJ:a|B|nc:parenting", None, "P")]}, CANON).noncredit)

# ── (3) the committed data, end to end ───────────────────────────────────────
NC_DECS = [dec("SUBJ:los_angeles_pierce|OLD|nc:courses-for-older-adults", "OLAD", "Older Adult Education", who="Sam"),
           dec("SUBJ:el_camino|ESL|nc:english-as-a-second-language-esl", "ESLN"),
           dec("SUBJ:el_camino|ESL|nc:parenting", "PARN"),
           dec("SUBJ:el_camino|ESL|nc:bogus", "ESLN"),
           dec("SUBJ:el_camino|ESL|nc:health-and-safety", "ESLN")]
committed = json.load(open(os.path.join(ROOT, sd.STATUS), encoding="utf-8"))
real_read = lst.SD.read_status
lst.SD.read_status = lambda root=None, path=None: dict(committed, decisions=(committed.get("decisions") or []) + NC_DECS)
try:
    out = lst.build(ROOT)
finally:
    lst.SD.read_status = real_read
cols = out["columns"]
NCD = cols.index("noncredit_decisions")
before = {(c["slug"], r[0]): r for c in titles["colleges"] for r in c["rows"]}
after = {(c["slug"], r[0]): r for c in out["colleges"] for r in c["rows"]}
OLD = dict(zip(cols, after[("los_angeles_pierce", "OLD")]))
check("(3) ⭐ a noncredit-only code takes its title and its dominant category's code from the person's save",
      OLD["printed_name"] == "Older Adult Education" and OLD["title_state"] == "person" and OLD["common"] == "OLAD"
      and OLD["common_source"] == "person" and OLD["decision"]["band"] == "nc:courses-for-older-adults"
      and OLD["decision"]["was"]["printed_name"] is None and [d["holds"] for d in OLD["noncredit_decisions"]] == [True])
ESL = dict(zip(cols, after[("el_camino", "ESL")]))
check("(3) ⭐ a code with credit courses keeps its credit row: its title, its code and no decision",
      ESL["printed_name"] == dict(zip(cols, before[("el_camino", "ESL")]))["printed_name"] and ESL["common"] == "ESOL" and ESL["decision"] is None
      and [(d["category"], d["holds"]) for d in ESL["noncredit_decisions"]] == [("English as a Second Language (ESL)", True), ("Parenting", False)])
changed = sorted(k for k in after if [x for i, x in enumerate(after[k]) if i != NCD] != [x for i, x in enumerate(before.get(k, [])) if i != NCD])
listed = sorted(k for k in after if after[k][NCD])
check("(3) ⭐ nothing else moves: no other row at any college, and no other row lists a noncredit decision",
      changed == [("los_angeles_pierce", "OLD")] and listed == [("el_camino", "ESL"), ("los_angeles_pierce", "OLD")], json.dumps(changed[:6]))
check("(3) the decision whose category the code no longer holds is listed as not applied; the bad ones as refused",
      [r["key"] for r in out["decisions"]["not_applied"]] == ["SUBJ:el_camino|ESL|nc:parenting"]
      and {"SUBJ:el_camino|ESL|nc:bogus", "SUBJ:el_camino|ESL|nc:health-and-safety"} <= {r["key"] for r in out["decisions"]["refused"]}
      and out["decisions"]["applied"] == titles["decisions"]["applied"] + 2)
tmp = tempfile.mkdtemp()
try:
    p = os.path.join(tmp, "local_subject_titles.json")
    open(p, "w", encoding="utf-8").write(lst.dump(out))
    real_titles, R.TITLES = R.TITLES, p
    try:
        rb = R.build(ROOT)
    finally:
        R.TITLES = real_titles
finally:
    for f in os.listdir(tmp):
        os.remove(os.path.join(tmp, f))
    os.rmdir(tmp)
rec = {(c["slug"], r["code"]): r for c in rb["colleges"] for r in c["rows"]}
old_rec = {(c["slug"], r["code"]): r for c in json.load(open(os.path.join(ROOT, R.OUT), encoding="utf-8"))["colleges"] for r in c["rows"]}
check("(3) ⭐ the recommendations stop for the part a person decided, and stand where nobody did",
      ("los_angeles_pierce", "OLD") in old_rec and ("los_angeles_pierce", "OLD") not in rec
      and rec.get(("el_camino", "NENG")) == old_rec.get(("el_camino", "NENG")))

# ── (4) the mint ─────────────────────────────────────────────────────────────
inp0 = pmf.fixture()
plan0 = pm.compute_plan(inp0, "2026-11-22")
inp1 = pmf.fixture()
codes = {c: (k or None) for c, k in NCC.items()}
inp1["subject_decisions"] = sd.Decisions({"decisions": [
    dec("SUBJ:c|MATH|nc:short-term-vocational", "VOCE"),      # C College's MATH course is noncredit (P3)
    dec("SUBJ:a|ZZZ|nc:short-term-vocational", "VOCE"),       # A College's held unmapped code
    dec("SUBJ:a|MATH|nc:courses-for-older-adults", "OLAD", "Older Adults")]}, dict(inp0["canon_doc"], disciplines=dict(
        inp0["canon_doc"].get("disciplines") or {}, **CANON["disciplines"])), NCS, codes)
inp1["decision_slugs"] = {"a college": "a", "b college": "b", "c college": "c", "d college": "d"}
plan1 = pm.compute_plan(inp1, "2026-11-22")
check("(4) ⭐ a noncredit decision never routes a mint: nothing is decided and the plan is the plan with no decision",
      len(inp1["subject_decisions"].noncredit) == 3 and not plan1["decided"]
      and all(json.dumps(plan1[k], sort_keys=True) == json.dumps(plan0[k], sort_keys=True) for k in plan0))

# ── (6) the sync ─────────────────────────────────────────────────────────────
ROW = lambda cid, v: {"course_id": cid, "field": "subject_decision", "value": json.dumps(v), "reviewed_at": "2026-11-22T05:00:00Z", "reviewer_label": "a reviewer"}
sh = sync.shape([ROW("SUBJ:cerritos|AED|nc:short-term-vocational", {"local_title": "Electrical Apprenticeship", "common_code": "voce"}),
                 ROW("SUBJ:cerritos|AED|credit", {"common_code": "KINE"}), ROW("SUBJ:cerritos|ZZZ|whole", {"local_title": "Z"}),
                 ROW("SUBJ:cerritos|AED|nc:bogus", {"common_code": "VOCE"}), ROW("SUBJ:cerritos|AED|nc:Bad_Slug", {"common_code": "VOCE"}),
                 ROW("SUBJ:cerritos|AED|nc:", {"common_code": "VOCE"}), ROW("SUBJ:cerritos|AED|noncredit", {"common_code": "VOCE"})], slugs=NCS)
un = {u["key"]: u["why"] for u in sh["unreadable"]}
check("(6) ⭐ the sync accepts credit, whole and nc:<a listed slug>, the band kept as it was keyed",
      [(d["band"], d["common_code"]) for d in sh["decisions"]] == [("credit", "KINE"), ("nc:short-term-vocational", "VOCE"), ("whole", None)]
      and sh["totals"]["by_band"] == {"credit": 1, "nc:short-term-vocational": 1, "whole": 1})
check("(6) ⭐ it lists an unknown slug, a malformed one, an empty one and a bare noncredit band as unreadable, each with why",
      sorted(un) == ["SUBJ:cerritos|AED|nc:", "SUBJ:cerritos|AED|nc:Bad_Slug", "SUBJ:cerritos|AED|nc:bogus", "SUBJ:cerritos|AED|noncredit"]
      and "is not one" in un["SUBJ:cerritos|AED|nc:bogus"] and "lower-case letters" in un["SUBJ:cerritos|AED|nc:Bad_Slug"]
      and "is not credit, whole or nc:" in un["SUBJ:cerritos|AED|noncredit"], json.dumps(un))
check("(6) with no list given, the sync reads the committed one", sync.shape([ROW("SUBJ:x|Y|nc:parenting", {"common_code": "PARN"})])["totals"]["decisions"] == 1)

print("\n%s" % ("all passed" if not FAILS else "%d failed" % len(FAILS)))
sys.exit(1 if FAILS else 0)
