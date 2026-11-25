#!/usr/bin/env python3
"""File the title hunt's finds into the record: kb/subject_title_hunt/found/<slug>.json -> kb/hand_filed_catalogs/subjects/<slug>.json.

WHY (S730; Sam, 2026-11-25). The titles a runner reads from a catalog's subject index go straight into the subject
headings record the Subjects build already reads (kb/_build_local_subject_titles.py), so no one copies them through a
spreadsheet; the CSV in kb/subject_title_hunt/ is left for the codes the machine could not title. Sam's procedure
p-subject-title-carries-its-source-sam-2026-11-25: every title records its source, where it was found, the method, the
date and the finder. Those ride on each row as `address` (the source), `where`, `method`, `found_on` and `found_by`.

RULES.
  - A row already filed for a code is never replaced: a heading already in the record (a runner's earlier read, or a
    person's) stands, and the find is counted as agreeing or differing in the report.
  - A find with no title, or one that only repeats its code, is not filed; nor is a code the find prints under two
    different headings, which is left for a person.
  - A heading is saved in Title Case (subject_title_case), with the catalog's own spelling in `heading_printed`.
  - `--backfill` adds where, method, found_on and found_by to the rows filed before S730, from the file's own run and
    rule, and changes nothing else.

  - `--csv PATH` files a filled leftovers CSV instead of the finds (S733, for COBIx's rows on #3837 and #3838): a row
    with a title and its source URL is a find for its college; a `department label` row stays a hint, as above.

Usage:  python3 kb/_file_found_subject_titles.py [--dry-run] [--backfill] [--csv PATH]
"""
import glob
import json
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
from subject_title_case import title_case  # noqa: E402

FOUND = os.path.join(ROOT, "kb", "subject_title_hunt", "found")
SUBJECTS = os.path.join(ROOT, "kb", "hand_filed_catalogs", "subjects")
WHAT = ("The subjects {college}'s catalog prints: each code with its heading as the catalog's subject index or prefix legend "
        "prints it, and where it was read (Sam's rule on #3655: a local subject title comes only from the catalog's "
        "subject heading). Filed by kb/_file_found_subject_titles.py from the title hunt (S730); each row carries its "
        "source (`address`), where, method, found_on and found_by (p-subject-title-carries-its-source-sam-2026-11-25).")
# The rule a pre-S730 row was read by, as the procedure's method.
RULE_METHOD = {"index": "subject heading", "code_address": "subject heading", "search_page": "subject heading",
               "caps": "subject heading", "named": "subject heading", "section": "subject heading", "fits": "subject heading"}


def code_key(s):
    return re.sub(r"[^A-Z0-9&]", "", str(s or "").upper())


def dump(path, doc):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(doc, f, indent=1, ensure_ascii=False)
        f.write("\n")


def file_one(found, dry):
    slug = os.path.basename(found)[:-5]
    with open(found, encoding="utf-8") as f:
        d = json.load(f)
    return file_doc(slug, d, dry)


def file_doc(slug, d, dry):
    titles = d.get("titles") or []
    path = os.path.join(SUBJECTS, slug + ".json")
    doc = None
    if os.path.exists(path):
        with open(path, encoding="utf-8") as f:
            doc = json.load(f)
    if doc is None:
        if not titles:
            return {"slug": slug, "added": 0, "agree": 0, "differ": 0, "skipped": 0, "not_read": d.get("not_read")}
        doc = {"_what": WHAT.format(college=d.get("college")), "college": d.get("college"),
               "catalog_year": d.get("catalog_year"), "read_at": d.get("read_at"), "run": d.get("run"),
               "source": sorted({t.get("url") for t in titles if t.get("url")}), "rows": []}
    have = {code_key(r.get("code")): r for r in doc.get("rows") or []}
    added = agree = differ = skipped = 0
    # A code the find prints under two different headings (Santa Monica prints sections without codes) is left for a
    # person: neither heading is filed, and the leftovers list names it.
    seen = {}
    for t in titles:
        k = code_key(t.get("code"))
        if k and str(t.get("title") or "").strip():
            seen.setdefault(k, set()).add(title_case(str(t["title"]).strip()).lower())
    split = {k for k, v in seen.items() if len(v) > 1}
    for t in titles:
        # A title the catalog does not print over the code itself (a worker's "no heading of its own" note: the code's
        # first course sits under another code's heading) is an inference, left for a person under the rule on #3655.
        # A department label informs a title and never settles one (p-subject-title-carries-its-source-sam-2026-11-25):
        # it stays in the found file, for the leftovers list to show beside the code.
        if (code_key(t.get("code")) in split or str(t.get("note") or "").lower().startswith("no heading of its own")
                or str(t.get("method") or "").lower() == "department label"):
            skipped += 1
            continue
        code, printed = str(t.get("code") or "").strip(), str(t.get("title") or "").strip()
        k = code_key(code)
        if not k or not printed or code_key(printed) == k:
            skipped += 1
            continue
        old = have.get(k)
        if old and old.get("heading"):
            if title_case(printed).lower() == str(old["heading"]).lower():
                agree += 1
            else:
                differ += 1
            continue
        row = {"code": code, "heading": title_case(printed), "heading_printed": printed, "rule": "index", "codes": [code],
               "candidate": None, "address": t.get("url"), "where": t.get("where") or "catalog",
               "method": t.get("method") or "subject heading",
               "found_on": t.get("found_on") or (d.get("read_at") or "")[:10] or None,
               "found_by": t.get("found_by") or "COBI, a runner read (run %s)" % d.get("run"), "run": d.get("run")}
        if old:
            old.update(row)
        else:
            doc.setdefault("rows", []).append(row)
            have[k] = row
        added += 1
    doc["rows"] = sorted(doc.get("rows") or [], key=lambda r: code_key(r.get("code")))
    doc["subjects"] = len(doc["rows"])
    doc["with_heading"] = sum(1 for r in doc["rows"] if r.get("heading"))
    if added and not dry:
        dump(path, doc)
    return {"slug": slug, "added": added, "agree": agree, "differ": differ, "skipped": skipped, "not_read": d.get("not_read")}


def college_slugs():
    """College name (lower-cased) -> its slug, from the filed subjects, the finds and the printed catalogs' index."""
    m = {}
    paths = glob.glob(os.path.join(SUBJECTS, "*.json")) + glob.glob(os.path.join(FOUND, "*.json"))
    for path in paths:
        with open(path, encoding="utf-8") as f:
            name = (json.load(f).get("college") or "").strip().lower()
        if name:
            m.setdefault(name, os.path.basename(path)[:-5])
    index = os.path.join(ROOT, "kb", "hand_filed_catalogs", "courses", "index.json")
    if os.path.exists(index):
        with open(index, encoding="utf-8") as f:
            for c in json.load(f).get("colleges") or []:
                m.setdefault(str(c.get("college") or "").strip().lower(), c.get("slug"))
    return m


def read_csv_finds(path):
    """The leftovers CSV, filled in by a person or COBIx, as one find per college (S733).

    A row is a find only when it carries both a title and its source URL (p-subject-title-carries-its-source-sam-2026-11-25);
    its where, method, searched_on and found_by ride along. A `department label` row passes through and file_doc keeps
    it out of the record, as a hint. A college with no known slug is reported, never guessed."""
    import csv
    slugs = college_slugs()
    finds, unknown = {}, set()
    with open(path, encoding="utf-8", newline="") as f:
        for r in csv.DictReader(f):
            title, url = (r.get("local_subject_title") or "").strip(), (r.get("title_source_url") or "").strip()
            if not title or not url:
                continue
            college = (r.get("college") or "").strip()
            slug = slugs.get(college.lower())
            if not slug:
                unknown.add(college)
                continue
            d = finds.setdefault(slug, {"college": college, "catalog_year": None, "read_at": None, "run": None,
                                        "csv": os.path.relpath(path, ROOT), "titles": []})
            d["titles"].append({"code": r.get("local_subject_code"), "title": title, "url": url,
                                "where": (r.get("title_where") or "").strip() or "catalog",
                                "method": (r.get("title_method") or "").strip() or "subject heading",
                                "found_on": (r.get("searched_on") or "").strip() or None,
                                "found_by": (r.get("found_by") or "").strip() or None})
    return finds, sorted(unknown)


def committed_on(path):
    try:
        out = subprocess.run(["git", "log", "-1", "--format=%cs", "--", path], cwd=ROOT, capture_output=True, text=True).stdout
        return out.strip() or None
    except OSError:
        return None


def backfill(dry):
    n = 0
    for path in sorted(glob.glob(os.path.join(SUBJECTS, "*.json"))):
        with open(path, encoding="utf-8") as f:
            doc = json.load(f)
        on = committed_on(path)
        by = doc.get("read_by") or "COBI, a runner read (run %s)" % doc.get("run")
        changed = False
        for r in doc.get("rows") or []:
            if not r.get("heading") or r.get("found_by"):
                continue
            r.setdefault("where", "college site" if r.get("rule") == "search_page" else "catalog")
            r.setdefault("method", RULE_METHOD.get(r.get("rule"), "subject heading"))
            r.setdefault("found_on", on)
            r["found_by"] = by
            changed, n = True, n + 1
        if changed and not dry:
            dump(path, doc)
    return n


def main(argv):
    dry = "--dry-run" in argv
    if "--backfill" in argv:
        print("backfilled the source fields on %d filed headings%s" % (backfill(dry), " (dry run)" if dry else ""))
    tot = {"added": 0, "agree": 0, "differ": 0, "skipped": 0}
    if "--csv" in argv:
        finds, unknown = read_csv_finds(argv[argv.index("--csv") + 1])
        jobs = [(lambda s=s, d=d: file_doc(s, d, dry)) for s, d in sorted(finds.items())]
        for name in unknown:
            print("no slug for college %r: its rows are not filed" % name)
    else:
        jobs = [(lambda p=p: file_one(p, dry)) for p in sorted(glob.glob(os.path.join(FOUND, "*.json")))]
    for job in jobs:
        r = job()
        for k in tot:
            tot[k] += r[k]
        print("%-36s added %4d  agree %3d  differ %3d  skipped %3d%s" % (r["slug"], r["added"], r["agree"], r["differ"], r["skipped"],
              ("  not read: " + str(r["not_read"])[:80]) if r["not_read"] and not r["added"] else ""))
    print("total: " + json.dumps(tot) + (" (dry run)" if dry else ""))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
