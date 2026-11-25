"""The title hunt files its finds into the subject headings record (S730; kb/_file_found_subject_titles.py), and the
Subjects build lists a college by its headings alone (kb/_build_local_subject_titles.py headings_only).

WHAT THIS GUARDS:
  (1) a find for a college with no record files one row per code, with its source, where, method, date and finder;
  (2) a heading already in the record is never replaced, and the find is counted as agreeing or differing;
  (3) a find that only repeats its code, or has no title, is not filed;
  (4) a college whose catalog was not read files nothing;
  (5) the Subjects build lists a headings-only college, and never a college with a course file twice.
Run from repo root: `python3 tests/file_found_subject_titles_test.py`.
"""
import json
import os
import sys
import tempfile

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "kb"))
import _file_found_subject_titles as F  # noqa: E402
import _build_local_subject_titles as B  # noqa: E402

results = []


def check(name, cond, why=""):
    results.append((name, bool(cond), why))


def put(path, doc):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(doc, f)


with tempfile.TemporaryDirectory() as root:
    F.FOUND = os.path.join(root, "kb", "subject_title_hunt", "found")
    F.SUBJECTS = os.path.join(root, "kb", "hand_filed_catalogs", "subjects")
    put(os.path.join(F.FOUND, "alpha.json"), {"college": "Alpha College", "catalog_year": "2026-2027", "read_at": "2026-11-25T14:00:00Z",
        "run": "111", "titles": [
            {"code": "ACCT", "title": "ACCOUNTING", "url": "https://alpha.example/courses/", "where": "catalog", "method": "subject heading"},
            {"code": "AT", "title": "Flight Attendant", "url": "https://alpha.example/courses/", "where": "catalog", "method": "prefix legend"},
            {"code": "ART", "title": "ART", "url": "https://alpha.example/courses/"},
            {"code": "BIO", "title": "", "url": "https://alpha.example/courses/"},
            {"code": "ERTH", "title": "Anthropology", "url": "u"}, {"code": "ERTH", "title": "Geology", "url": "u"}]})
    r = F.file_one(os.path.join(F.FOUND, "alpha.json"), False)
    doc = json.load(open(os.path.join(F.SUBJECTS, "alpha.json")))
    rows = {x["code"]: x for x in doc["rows"]}
    a = rows.get("ACCT") or {}
    check("(1) a new college files one row per titled code, with its source fields",
          r["added"] == 2 and a.get("heading") == "Accounting" and a.get("heading_printed") == "ACCOUNTING"
          and a.get("address") == "https://alpha.example/courses/" and a.get("where") == "catalog" and a.get("method") == "subject heading"
          and a.get("found_on") == "2026-11-25" and "111" in (a.get("found_by") or "") and rows["AT"]["method"] == "prefix legend", json.dumps(r))
    check("(3) a find that repeats its code, has no title, or names one code under two headings is not filed",
          "ART" not in rows and "BIO" not in rows and "ERTH" not in rows and r["skipped"] == 4, json.dumps(r))

    put(os.path.join(F.SUBJECTS, "beta.json"), {"college": "Beta College", "run": "9", "rows": [
        {"code": "MATH", "heading": "Mathematics", "rule": "index", "codes": ["MATH"]}]})
    put(os.path.join(F.FOUND, "beta.json"), {"college": "Beta College", "run": "222", "read_at": "2026-11-25T15:00:00Z", "titles": [
        {"code": "MATH", "title": "Math and Statistics", "url": "u"}, {"code": "PHYS", "title": "Physics", "url": "u"}]})
    r = F.file_one(os.path.join(F.FOUND, "beta.json"), False)
    rows = {x["code"]: x for x in json.load(open(os.path.join(F.SUBJECTS, "beta.json")))["rows"]}
    check("(2) a heading already filed stands; the find is counted as differing", rows["MATH"]["heading"] == "Mathematics"
          and r["differ"] == 1 and r["added"] == 1 and rows["PHYS"]["heading"] == "Physics", json.dumps(r))

    put(os.path.join(F.FOUND, "gamma.json"), {"college": "Gamma College", "titles": [], "not_read": "robots.txt refuses /catalog/"})
    r = F.file_one(os.path.join(F.FOUND, "gamma.json"), False)
    check("(4) a college not read files nothing", r["added"] == 0 and not os.path.exists(os.path.join(F.SUBJECTS, "gamma.json")))

    B_SUBJ = B.SUBJECTS
    got = B.headings_only(root, {"colleges": [{"slug": "beta", "file": "beta.json.gz", "college": "Beta College"}]})
    check("(5) the build lists a headings-only college once, never one with a course file",
          [c["slug"] for c in got] == ["alpha"] and got[0]["college"] == "Alpha College" and got[0]["file"] is None, json.dumps(got))

fail = 0
for n, ok, why in results:
    print(("PASS " if ok else "FAIL ") + n + ("" if ok else "\n     " + why))
    fail += 0 if ok else 1
print("%d/%d checks passed" % (len(results) - fail, len(results)))
sys.exit(1 if fail else 0)
