#!/usr/bin/env python3
"""Each college's noncredit courses by local subject code and noncredit category (S698, #3655).

WHY. Sam, 2026-11-21: "the noncredit and credit disciplines are often different and are separated in the MQs, which
are the basis for the common subject codes we are associating with all the local titles"; and, relayed by COBIx on
#3655, a noncredit code that holds several disciplines (Cerritos AED, Southwestern NC) splits by its noncredit
category rather than taking one common code. The state course list the pages read (coci_lookup_data.js) carries a
course's credit mark and not its category, so this file counts, for every college and local subject code, its
noncredit courses under each category the COCI export names (Non_Credit_Category), and its credit courses beside
them. It decides nothing: the Subjects page and the recommender read it.

Reads kb/reference/coci_course_list.xlsx (the export kb/_build_coci_lookup.py reads). No clock is read; a rerun on
the same export writes the same bytes.

  python3 kb/_build_noncredit_categories.py           write kb/status/noncredit_categories.json
  python3 kb/_build_noncredit_categories.py --check   exit 1 if the committed file is behind the export
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
XLSX = os.path.join("kb", "reference", "coci_course_list.xlsx")
OUT = os.path.join("kb", "status", "noncredit_categories.json")
NO_CATEGORY = "(no category in the export)"


def is_credit(credit_type):
    return (credit_type or "").strip().lower() == "credit course"


def tally(rows):
    """rows: (college, subject, credit_type, category) -> {college: {code: {"credit": n, "noncredit": {category: n}}}}.
    A code is the export's Subject, trimmed and upper-cased, as the local subject titles compare codes. A course
    with a blank CreditType is left out: this file does not guess a band."""
    out = {}
    for college, subject, credit_type, category in rows:
        college, code = str(college or "").strip(), str(subject or "").strip().upper()
        if not college or not code or not str(credit_type or "").strip():
            continue
        e = out.setdefault(college, {}).setdefault(code, {"credit": 0, "noncredit": {}})
        if is_credit(credit_type):
            e["credit"] += 1
        else:
            cat = " ".join(str(category or "").split()) or NO_CATEGORY
            e["noncredit"][cat] = e["noncredit"].get(cat, 0) + 1
    return out


def read_export(root=ROOT):
    import openpyxl
    wb = openpyxl.load_workbook(os.path.join(root, XLSX), read_only=True)
    ws = wb[wb.sheetnames[0]]
    it = ws.iter_rows(values_only=True)
    hdr = [str(h or "").strip() for h in next(it)]
    ix = {h: i for i, h in enumerate(hdr)}
    need = ("College", "Subject", "CreditType", "Non_Credit_Category")
    missing = [n for n in need if n not in ix]
    if missing:
        raise SystemExit("%s has no column %s" % (XLSX, ", ".join(missing)))
    for r in it:
        yield tuple(r[ix[n]] for n in need)


def build(rows):
    by = tally(rows)
    colleges, cats, T = [], {}, {"colleges": 0, "codes_with_noncredit": 0, "noncredit_only": 0, "credit_and_noncredit": 0,
                                "noncredit_courses": 0, "codes_in_two_or_more_categories": 0}
    for college in sorted(by):
        codes = []
        for code in sorted(by[college]):
            e = by[college][code]
            if not e["noncredit"]:
                continue
            n = sum(e["noncredit"].values())
            codes.append([code, e["credit"], n, [[c, e["noncredit"][c]] for c in sorted(e["noncredit"], key=lambda c: (-e["noncredit"][c], c))]])
            T["codes_with_noncredit"] += 1
            T["noncredit_only" if not e["credit"] else "credit_and_noncredit"] += 1
            T["noncredit_courses"] += n
            T["codes_in_two_or_more_categories"] += 1 if len(e["noncredit"]) > 1 else 0
            for c, k in e["noncredit"].items():
                cats[c] = cats.get(c, 0) + k
        if codes:
            colleges.append({"college": college, "codes": codes})
            T["colleges"] += 1
    return {
        "_what": ("Each college's local subject codes that hold noncredit courses, from the COCI export: per code its credit "
                  "courses, its noncredit courses, and the noncredit courses under each category the export names "
                  "(Non_Credit_Category), most courses first. Built by kb/_build_noncredit_categories.py for the Subjects "
                  "page and the recommender (#3655); it decides nothing."),
        "_source": XLSX.replace(os.sep, "/"),
        "columns": ["code", "credit_courses", "noncredit_courses", "categories"],
        "totals": T,
        "categories": [[c, cats[c]] for c in sorted(cats, key=lambda c: (-cats[c], c))],
        "colleges": colleges,
    }


def dump(obj):
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":")) + "\n"


def main(argv):
    text = dump(build(read_export()))
    path = os.path.join(ROOT, OUT)
    if "--check" in argv:
        ok = os.path.exists(path) and open(path, encoding="utf-8").read() == text
        print("%s is %s" % (OUT, "current" if ok else "behind the export: run python3 kb/_build_noncredit_categories.py"))
        return 0 if ok else 1
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)
    d = json.loads(text)
    print("%s: %s" % (OUT, json.dumps(d["totals"])))
    for c, n in d["categories"]:
        print("  %6d  %s" % (n, c))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
