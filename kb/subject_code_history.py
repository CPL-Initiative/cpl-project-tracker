#!/usr/bin/env python3
"""A college's subject code history: the codes and titles a college used before (S715).

WHY. Sam, 2026-11-23: "do we have a correct way of documenting the formerly codes and titles? it happens all the
time..." and, to the plan, "yes, build it". A college renames a subject code (Clovis's ANTHRO became ANTH) or a
subject's title (its ECE was Child Development), and COCI often keeps filing the courses under the old code. Without
a record, the old code reads as an untitled code that only COCI holds, the statewide list counts it apart from the new
code, and the only place a person could write the history was the title itself ("(formerly COTR) ...").

WHAT. One file per college, kb/reference/subject_code_history/<slug>.json, each change one entry:

  from_code, to_code     the code before and after (equal for a title change alone)
  from_title, to_title   the subject's title before and after, in Title Case (to_title may repeat from_title)
  catalog_year           the catalog that prints the change
  printed                the line as the source prints it
  source                 where it is printed: a page address, or a person's word
  recorded_by, recorded_at   who recorded it, and when

The file names the college and its slug. A person's word is a source of its own (a curator knows what the catalog
does not print), recorded with the person's name.

WHO READS IT. kb/_build_local_subject_titles.py titles an old code with its subject's current title and marks the row
`renamed_to`; kb/_statewide_subject_codes.py counts an old code's courses under the new code at that college, so a
renamed code is one subject, never two. Each imports `load` and `resolve` from here and never restates them.

Usage: python3 kb/subject_code_history.py --check    (every file parses, names its source and keeps no cycle)
"""
import glob
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DIR = os.path.join("kb", "reference", "subject_code_history")
FIELDS = ("from_code", "to_code", "from_title", "to_title", "catalog_year", "printed", "source", "recorded_by", "recorded_at")


def code_key(s):
    """The Subjects rows' code (kb/_build_local_subject_titles.py code_key)."""
    return str(s or "").strip().upper()


def college_key(s):
    """kb/_build_local_subject_titles.py college_key."""
    return re.sub(r"[^a-z0-9]+", " ", str(s or "").lower()).strip()


def load(root=ROOT):
    """{"by_slug": {slug: {OLD CODE: entry}}, "by_college": {college_key: {OLD CODE: entry}},
    "titles": {slug: {CODE: [entries that changed its title alone]}}}. An empty record where no file is filed."""
    out = {"by_slug": {}, "by_college": {}, "titles": {}}
    for path in sorted(glob.glob(os.path.join(root, DIR, "*.json"))):
        with open(path, encoding="utf-8") as f:
            d = json.load(f)
        slug, ck = d.get("slug"), college_key(d.get("college"))
        moved, titled = {}, {}
        for e in d.get("changes") or []:
            a, b = code_key(e.get("from_code")), code_key(e.get("to_code"))
            if a and b and a != b:
                moved[a] = dict(e, from_code=a, to_code=b)
            elif a:
                titled.setdefault(a, []).append(e)
        out["by_slug"][slug] = moved
        out["by_college"][ck] = moved
        out["titles"][slug] = titled
    return out


def resolve(hist, where, code, by="by_slug"):
    """The code a college uses now for `code`, following its history; `where` is a slug (by="by_slug") or a college
    key (by="by_college"). A code with no history comes back as it is; a cycle stops where it would repeat."""
    moved = (hist or {}).get(by, {}).get(where) or {}
    k, seen = code_key(code), set()
    while k in moved and k not in seen:
        seen.add(k)
        k = moved[k]["to_code"]
    return k


def check(root=ROOT):
    bad = []
    for path in sorted(glob.glob(os.path.join(root, DIR, "*.json"))):
        name = os.path.basename(path)
        d = json.load(open(path, encoding="utf-8"))
        if not d.get("college") or d.get("slug") != name[:-5]:
            bad.append("%s: college or slug" % name)
        moved = {}
        for i, e in enumerate(d.get("changes") or []):
            missing = [k for k in FIELDS if not e.get(k)]
            if missing:
                bad.append("%s: change %d lacks %s" % (name, i, ", ".join(missing)))
            a, b = code_key(e.get("from_code")), code_key(e.get("to_code"))
            if a != b:
                if a in moved:
                    bad.append("%s: %s renamed twice" % (name, a))
                moved[a] = b
        for a in moved:
            k, seen = a, set()
            while k in moved:
                if k in seen:
                    bad.append("%s: a cycle through %s" % (name, a))
                    break
                seen.add(k)
                k = moved[k]
    return bad


if __name__ == "__main__":
    if "--check" in sys.argv[1:]:
        problems = check()
        for p in problems:
            print("FAIL " + p)
        print("subject code history: %s" % ("ok" if not problems else "%d problem(s)" % len(problems)))
        sys.exit(1 if problems else 0)
    print(__doc__)
