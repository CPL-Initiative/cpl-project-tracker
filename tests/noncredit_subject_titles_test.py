#!/usr/bin/env python3
"""kb/_build_noncredit_subject_titles.py: the draft noncredit subject title list (S700; Sam, 2026-11-21, relayed by
COBIx on #3655: build it from the four large noncredit programs' catalogs).

Failure modes: a fifth catalog read into the list; two headings merged that the synonym list does not name; a
category read from a heading's words instead of counted from the export; a category given a common code it does not
hold; a heading dropped; a rerun that writes other bytes; a committed file the daily build would rewrite.

Run from repo root: python3 tests/noncredit_subject_titles_test.py
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _build_noncredit_subject_titles as N  # noqa: E402

results = []


def check(name, cond):
    results.append(bool(cond))
    print(("  ok  " if cond else "FAIL  ") + name)


check("the list reads the four large noncredit programs and no other catalog", N.PROGRAMS == [
    "north_orange_continuing_education", "san_diego_of_continuing_education", "mt_san_antonio", "santa_ana"])
check("the brief's four pairs are one title each", N.group_title("ESL Classes")[1] == "English as a Second Language"
      and N.group_title("Adult Basic Education")[1] == "Basic Skills" and N.group_title("Parenting")[1] == "Parent Education"
      and N.group_title("Emeritus")[1] == N.group_title("Older Adult")[1] == "Older Adults")
check("a trailing campus mark folds; nothing else merges", N.group_title("Music - NOCE")[0] == N.group_title("Music")[0]
      and N.group_title("Health")[0] != N.group_title("Health Education")[0]
      and N.group_title("Business")[0] != N.group_title("Business Management")[0])
canon = json.load(open(os.path.join(ROOT, "kb", "discipline_canonical_subj4.json"), encoding="utf-8"))["disciplines"]
held = {v["canonical_subj4"]: n for n, v in canon.items()}
check("every common code a category names is that discipline's code in the canonical file",
      all(held.get(code) == disc for disc, code in N.MQ.values() if code))
cats = json.load(open(os.path.join(ROOT, N.CATEGORIES), encoding="utf-8"))
export = {c[0] for c in cats["categories"]} - {N.NO_CATEGORY}
check("every category the export names is in the MQ table, spelled as the export spells it", export <= set(N.MQ))

doc = N.build(ROOT)
T = doc["totals"]
members = [m for t in doc["titles"] for m in t["members"]]
check("every heading sits under exactly one title", len(members) == T["headings"] == len({(m["college"], m["code"]) for m in members}))
check("the four pairs span programs: English as a Second Language and Basic Skills in all four",
      {t["title"]: t["programs"] for t in doc["titles"]}.get("English as a Second Language") == 4
      and {t["title"]: t["programs"] for t in doc["titles"]}.get("Basic Skills") == 4)
by = {(h["college"], h["code"]): h for h in doc["headings"]}
check("a category is counted from the export: Mt. San Antonio VOC reads Short-term Vocational with Workforce Preparation beside it",
      by[("mt_san_antonio", "VOC")]["category"] == "Short-term Vocational" and by[("mt_san_antonio", "VOC")]["other_categories"][0][0] == "Workforce Preparation")
check("a code the export does not hold has no category: none is read from its words",
      by[("north_orange_continuing_education", "KIDS")]["category"] is None)
check("a title's common code is its category's, or none", all(t["common_code"] == (N.MQ.get(t["category"], (None, None))[1] if t["category"] else None) for t in doc["titles"]))
check("the totals add up", T["titles"] == T["with_common_code"] + T["category_without_code"] + T["no_noncredit_course_in_coci"] == sum(T["by_category"].values()))
check("two builds write the same bytes", N.dump(doc) == N.dump(N.build(ROOT)))
path = os.path.join(ROOT, N.OUT)
check("the committed file is the one the daily build would write", os.path.exists(path) and open(path, encoding="utf-8").read() == N.dump(doc))

print("%d/%d checks passed" % (sum(results), len(results)))
sys.exit(0 if all(results) else 1)
