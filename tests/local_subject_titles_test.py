#!/usr/bin/env python3
"""kb/_build_local_subject_titles.py on a small fixture (S694, the Commons' Subjects card).

WHAT THIS GUARDS:
  (1) a catalog that prints a subject name gives that name as the draft title; one that prints none gives null (TBA);
  (2) a code both sides print reads both; a code only the catalog prints reads catalog; a code only the state list
      carries reads state, so the curator's list is the one-sided codes;
  (3) codes compare exactly after trimming and upper-casing, and nothing looser ("ENGL " is ENGL; "ENG" is not ENGL);
  (4) a college whose names differ only by punctuation is the same college (Trade-Technical, Trade Technical);
  (5) the common subject code comes from the subject map and the canonical SUBJ, blank where either has nothing;
  (6) two runs on the same inputs write the same bytes, and --check passes on what it wrote.

Run from repo root: python3 tests/local_subject_titles_test.py
"""
import gzip
import importlib.util
import json
import os
import shutil
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("lst", os.path.join(HERE, "..", "kb", "_build_local_subject_titles.py"))
lst = importlib.util.module_from_spec(spec)
spec.loader.exec_module(lst)

FAILS = []


def check(name, cond):
    print(("PASS " if cond else "FAIL ") + name)
    if not cond:
        FAILS.append(name)


def gz(path, obj):
    with open(path, "wb") as f:
        f.write(gzip.compress(json.dumps(obj).encode("utf-8"), mtime=0))


def fixture(root):
    cat = os.path.join(root, "kb", "hand_filed_catalogs", "courses")
    os.makedirs(cat)
    os.makedirs(os.path.join(root, "kb", "reference"))
    os.makedirs(os.path.join(root, "kb", "status"))
    json.dump({"colleges": [
        {"slug": "alpha", "file": "alpha.json.gz", "college": "Alpha College", "catalog_year": "2026-2027", "read_at": "2026-11-20T10:00:00Z"},
        {"slug": "beta_trade_technical", "file": "beta_trade_technical.json.gz", "college": "Beta Trade-Technical College",
         "catalog_year": "2026-2027", "read_at": "2026-11-20T11:00:00Z"}]}, open(os.path.join(cat, "index.json"), "w"))
    gz(os.path.join(cat, "alpha.json.gz"), {"rows": [
        {"college": "Alpha College", "subject": "ENGL ", "subject_name": "English", "code": "ENGL 1", "title": "Composition"},
        {"college": "Alpha College", "subject": "ENGL", "subject_name": "English", "code": "ENGL 2", "title": "Critical Thinking"},
        {"college": "Alpha College", "subject": "WELD", "subject_name": "Welding Technology", "code": "WELD 10", "title": "Arc"},
        {"college": "Alpha College", "subject": "ZZZ", "subject_name": "Catalog Only", "code": "ZZZ 1", "title": "Only here"}]})
    gz(os.path.join(cat, "beta_trade_technical.json.gz"), {"rows": [
        {"college": "Beta Trade-Technical College", "subject": "ENG", "code": "ENG 101", "title": "Composition"},
        {"college": "Beta Trade-Technical College", "subject": "weld", "code": "WELD 20", "title": "Gas"}]})
    state = {"_built_at": "2026-07-09", "colleges": ["Alpha College", "Beta Trade Technical College"], "rows": [
        [0, "CCC1", "ENGL", "1", "Composition"], [0, "CCC2", "ENGL", "2", "Critical Thinking"],
        [0, "CCC3", "WELD", "10", "Arc", 3, "C"], [0, "CCC4", "MATH", "1", "Algebra", 0, "N"], [0, "CCC7", "WELD", "11", "Arc Lab", 0, "E"],
        [1, "CCC5", "ENGL", "101", "Composition"], [1, "CCC6", "WELD", "20", "Gas"]]}
    open(os.path.join(root, "coci_lookup_data.js"), "w").write("window.CPL_COCI_LOOKUP = " + json.dumps(state) + ";\n")
    json.dump({"map": {"ENGL": "English", "WELD": "Welding", "ENG": "English"}},
              open(os.path.join(root, "kb", "reference", "subject_discipline_map.json"), "w"))
    json.dump({"disciplines": {"English": {"canonical_subj4": "ENGL"}}},
              open(os.path.join(root, "kb", "discipline_canonical_subj4.json"), "w"))


root = tempfile.mkdtemp()
try:
    fixture(root)
    out = lst.build(root)
    cols = out["columns"]
    by = {c["slug"]: {r[0]: dict(zip(cols, r)) for r in c["rows"]} for c in out["colleges"]}
    A, B = by["alpha"], by["beta_trade_technical"]
    check("(1) the printed name is the draft title", A["ENGL"]["printed_name"] == "English" and A["WELD"]["printed_name"] == "Welding Technology")
    check("(1) a catalog that prints no name gives null (TBA)", B["WELD"]["printed_name"] is None and B["ENG"]["printed_name"] is None)
    check("(2) a code both sides print reads both", A["ENGL"]["side"] == "both" and A["ENGL"]["catalog_courses"] == 2 and A["ENGL"]["state_courses"] == 2)
    check("(2) a code only the catalog prints reads catalog", A["ZZZ"]["side"] == "catalog" and A["ZZZ"]["state_courses"] == 0)
    check("(2) a code only the state list carries reads state", A["MATH"]["side"] == "state" and A["MATH"]["catalog_courses"] == 0 and A["MATH"]["printed_name"] is None)
    check("(3) trimmed and upper-cased, nothing looser: ENG is not ENGL", B["ENG"]["side"] == "catalog" and B["ENGL"]["side"] == "state" and B["WELD"]["side"] == "both")
    check("(4) Trade-Technical is Trade Technical", all(c["in_state_list"] for c in out["colleges"]))
    check("(5) the common code where both maps give one, blank otherwise",
          A["ENGL"]["common"] == "ENGL" and B["ENG"]["common"] == "ENGL" and A["WELD"]["common"] is None and A["WELD"]["discipline"] == "Welding" and A["ZZZ"]["common"] is None)
    T = out["totals"]
    check("totals add up", T["colleges"] == 2 and T["courses"] == 6 and T["catalog_codes"] == 5 and T["both"] == 3
          and T["catalog_only"] == 2 and T["state_only"] == 2 and T["named"] == 3 and T["colleges_named"] == 1)
    check("the rule is stated in the file", "trimming and upper-casing" in out["_rule"])
    # ── S698 (#3655): the filed headings, Title Case and why a row has no title ──
    check("(7) a row with a title reads catalog; its source is named", A["ENGL"]["title_state"] == "catalog" and A["ENGL"]["title_source"] == "course pages")
    check("(7) courses under a code and no heading read for it yet: not_read", B["WELD"]["title_state"] == "not_read" and B["ENG"]["title_state"] == "not_read")
    check("(7) a code in the state list and nowhere in the catalog: not_in_catalog", B["ENGL"]["title_state"] == "not_in_catalog")
    check("(7) an untitled code whose courses in the state list are all noncredit is on hold (Sam, 2026-11-21)",
          A["MATH"]["title_state"] == "noncredit_hold" and A["MATH"]["noncredit_courses"] == 1 and A["MATH"]["credit_courses"] == 0)
    check("(7) credit and noncredit courses are counted apart, enhanced funding as noncredit; a titled code is never held",
          A["WELD"]["credit_courses"] == 1 and A["WELD"]["noncredit_courses"] == 1 and A["WELD"]["title_state"] == "catalog"
          and A["ENGL"]["noncredit_courses"] == 0 and out["totals"]["noncredit_hold"] == 1 and out["totals"]["credit_and_noncredit"] == 1)
    check("(7) every state is one of the four", all(r["title_state"] in lst.TITLE_STATES for c in by.values() for r in c.values()))
    sub = os.path.join(root, "kb", "hand_filed_catalogs", "subjects")
    os.makedirs(sub)
    json.dump({"college": "Beta Trade-Technical College", "run": "1", "rows": [
        {"code": "WELD", "heading": "Welding Technology", "heading_printed": "WELDING TECHNOLOGY", "rule": "caps", "candidate": None},
        {"code": "ENG", "heading": None, "rule": "none", "candidate": "English and Humanities"}]}, open(os.path.join(sub, "beta_trade_technical.json"), "w"))
    json.dump({"college": "Alpha College", "run": "2", "rows": [
        {"code": "MATH", "heading": "Mathematics", "rule": "index", "codes": ["MATH", "STAT"], "address": "https://catalog.alpha.example.edu/course-descriptions/math/"},
        {"code": "STAT", "heading": "Mathematics", "rule": "index", "codes": ["MATH", "STAT"], "address": "https://catalog.alpha.example.edu/course-descriptions/math/"},
        {"code": "ENGL", "heading": "ENGLISH LANGUAGE", "rule": "index", "address": "https://catalog.alpha.example.edu/course-descriptions/engl/"},
        {"code": "WELD", "heading": "Welding", "rule": "index"}, {"code": "ZZZ", "heading": "Catalog Only", "rule": "index"}]},
        open(os.path.join(sub, "alpha.json"), "w"))
    out2 = lst.build(root)
    by2 = {c["slug"]: {r[0]: dict(zip(cols, r)) for r in c["rows"]} for c in out2["colleges"]}
    A2, B2 = by2["alpha"], by2["beta_trade_technical"]
    check("(8) a heading filed from above the first course titles the code", B2["WELD"]["printed_name"] == "Welding Technology"
          and B2["WELD"]["title_state"] == "catalog" and B2["WELD"]["title_source"] == "heading above the first course")
    check("(8) a code with no heading keeps its candidate and stays not_read, never titled by it",
          B2["ENG"]["printed_name"] is None and B2["ENG"]["candidate"] == "English and Humanities" and B2["ENG"]["title_state"] == "not_read")
    check("(8) a code the index lists is in the catalog with its heading, though no course of its page is filed",
          A2["MATH"]["printed_name"] == "Mathematics" and A2["MATH"]["side"] == "both" and A2["MATH"]["catalog_courses"] == 0
          and A2["MATH"]["address"].endswith("/math/") and A2["STAT"]["side"] == "catalog" and A2["STAT"]["printed_name"] == "Mathematics")
    check("(8) the course pages' own name wins over the index's", A2["ENGL"]["printed_name"] == "English" and A2["ENGL"]["title_source"] == "course pages")
    check("(8) pages the index links with no course filed are counted", out2["totals"]["pages_not_read"] == 2)
    check("(8) an index lists every subject: a catalog code it leaves out has no title in the catalog",
          lst.build(root)["colleges"][0]["not_in_catalog"] == 0)
    gz(os.path.join(root, "kb", "hand_filed_catalogs", "courses", "beta_trade_technical.json.gz"), {"rows": [
        {"college": "Beta Trade-Technical College", "subject": "ENG", "subject_name": "ENGLISH AS A SECOND LANGUAGE", "code": "ENG 101", "title": "Composition"},
        {"college": "Beta Trade-Technical College", "subject": "weld", "code": "WELD 20", "title": "Gas"}]})
    out3 = lst.build(root)
    named = [r[1] for c in out3["colleges"] for r in c["rows"] if r[1]]
    check("(9) every title is saved in Title Case, never in capitals (Sam, 2026-11-21)",
          "English as a Second Language" in named and not any(n.isupper() and len(n) > 4 for n in named))
    shutil.rmtree(sub)
    gz(os.path.join(root, "kb", "hand_filed_catalogs", "courses", "beta_trade_technical.json.gz"), {"rows": [
        {"college": "Beta Trade-Technical College", "subject": "ENG", "code": "ENG 101", "title": "Composition"},
        {"college": "Beta Trade-Technical College", "subject": "weld", "code": "WELD 20", "title": "Gas"}]})
    first, second = lst.dump(lst.build(root)), lst.dump(lst.build(root))
    check("(6) two runs write the same bytes", first == second)
    lst_root = lst.ROOT
    lst.ROOT = root
    try:
        lst.main([])
        check("(6) --check passes on what it wrote", lst.main(["--check"]) == 0)
        p = os.path.join(root, lst.OUT)
        d = json.load(open(p))
        d["_sources"]["state_list_built_at"] = "2026-12-01"
        open(p, "w").write(lst.dump(d))
        check("(6) --check passes when only the state list's stamp moved", lst.main(["--check"]) == 0)
        d["colleges"][0]["rows"][0][1] = "Changed"
        open(p, "w").write(lst.dump(d))
        check("(6) --check fails on a changed file", lst.main(["--check"]) == 1)
    finally:
        lst.ROOT = lst_root
finally:
    shutil.rmtree(root)

print(("FAILED " + str(len(FAILS))) if FAILS else "all passed")
sys.exit(1 if FAILS else 0)
