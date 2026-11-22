#!/usr/bin/env python3
"""Each college's courses under each local subject code, for the Subjects page's course panel (S700, #3655).

WHY. Sam's brief on #3655, item 3: a local code opens the courses under it at that college: code, number, title,
where the course is listed (the catalog, COCI or both) and its C-ID or CCN. On 2026-11-21 he added that credit and
noncredit courses are shown apart, because the MQs keep their disciplines apart. The state course list
(coci_lookup_data.js) is 17 MB, so the page cannot load it for a panel; this script files one small file per
college, kb/status/subject_courses/<slug>.json, and the panel fetches the one it opens.

WHAT A ROW IS. A course is matched between the catalog (kb/hand_filed_catalogs/courses/<slug>.json.gz) and the
state list when the college, the subject code (trimmed, upper case) and the course number (upper case, spaces
and leading zeros dropped) are equal; nothing looser. The title is the catalog's where the catalog lists the
course, else the state list's. The band is the state list's: C credit, N noncredit, E noncredit enhanced (S701: the panel lists N and E apart),
blank where the course is in the catalog only (the catalog files do not say). C-ID, CCN and M-ID are the state list's columns as they stand.
category is the COCI export's Non_Credit_Category for a noncredit course (kb/reference/coci_course_list.xlsx, joined on
the course control number), blank for a credit course, a catalog-only course, or where the export cannot be read (S705:
Sam, 2026-11-22, "the appearance makes it seem like I am changing all the listed courses to AED, even though I maybe be
just moving the AED out and associating them with the common subject VOCE"; a noncredit decision touches one category's
courses, so the panel shows each course's category).

Each file: {"college", "slug", "columns", "codes": {CODE: [row, ...]}}, rows sorted by number.
No clock is read, so the same inputs write the same bytes.

Usage: python3 kb/_build_subject_courses.py            (write every college's file)
       python3 kb/_build_subject_courses.py --check    (fail if a committed file is stale or missing)
"""
import gzip
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CATALOGS = os.path.join("kb", "hand_filed_catalogs", "courses")
STATE = "coci_lookup_data.js"
OUT_DIR = os.path.join("kb", "status", "subject_courses")
COLUMNS = ["number", "title", "band", "listed", "units", "cid", "ccn", "mid", "category"]
EXPORT = os.path.join("kb", "reference", "coci_course_list.xlsx")
NO_CAT = "(no category in the export)"   # kb/_build_noncredit_categories.py names a blank category so


def code_key(s):
    return str(s or "").strip().upper()


def college_key(s):
    return re.sub(r"[^a-z0-9]+", " ", str(s or "").lower()).strip()


def num_key(s):
    """A course number for matching: upper case, no spaces, no leading zeros (022A is 22A)."""
    k = re.sub(r"\s+", "", str(s or "").upper())
    return re.sub(r"^0+(?=[0-9A-Z])", "", k)


def sort_key(n):
    m = re.match(r"^([A-Z]*?)(\d+)(.*)$", num_key(n))
    return (m.group(1), int(m.group(2)), m.group(3)) if m else (num_key(n), 0, "")


def catalog_number(row):
    """The number part of a catalog row's code: the code less its subject."""
    code, subj = str(row.get("code") or "").strip(), str(row.get("subject") or "").strip()
    return code[len(subj):].strip() if subj and code.upper().startswith(subj.upper()) else code.split(" ")[-1]


def read_categories(root):
    """{course control number: Non_Credit_Category} for the export's noncredit courses; {} where it cannot be read."""
    path = os.path.join(root, EXPORT)
    if not os.path.exists(path):
        return {}
    try:
        import openpyxl
    except ImportError:
        return {}
    wb = openpyxl.load_workbook(path, read_only=True)
    it = wb[wb.sheetnames[0]].iter_rows(values_only=True)
    ix = {str(h or "").strip(): i for i, h in enumerate(next(it))}
    if "CourseControlNumber" not in ix or "Non_Credit_Category" not in ix or "CreditType" not in ix:
        return {}
    out = {}
    for r in it:
        ctl, ct = str(r[ix["CourseControlNumber"]] or "").strip(), str(r[ix["CreditType"]] or "").strip().lower()
        # As kb/_build_noncredit_categories.py tallies: a credit course and a blank CreditType take no category.
        if not ctl or not ct or ct == "credit course":
            continue
        out[ctl] = " ".join(str(r[ix["Non_Credit_Category"]] or "").split()) or NO_CAT
    return out


def build_college(college, slug, catalog_rows, state_rows, cats=None):
    """state_rows: the state list's rows for this college (index, control, subj, number, title, units, band, top,
    cid, ccn, mid)."""
    codes = {}
    for r in state_rows:
        k = (code_key(r[2]), num_key(r[3]))
        e = codes.setdefault(k[0], {}).setdefault(k[1], {"number": str(r[3]).strip(), "listed": "COCI"})
        # C credit, N noncredit, E noncredit enhanced (Sam, 2026-11-22, f-coci-credit-status-three-values-sam-2026-11-22:
        # "Coci has a credit, noncredit, noncredit enhanced indicator"); any other mark reads N, a noncredit course.
        band = r[6] if r[6] in ("C", "N", "E") else ("N" if r[6] else "")
        if "band" in e:        # a second state row for one number: the first row stands; credit wins a mixed pair
            if band == "C":
                e["band"] = "C"
            continue
        e.update({"title": str(r[4]).strip(), "band": band, "units": r[5], "cid": r[8] or "", "ccn": r[9] or "",
                  "mid": r[10] or "", "category": (cats or {}).get(str(r[1]).strip(), "") if band in ("N", "E") else ""})
    for r in catalog_rows:
        subj, num = code_key(r.get("subject")), catalog_number(r)
        if not subj or not num:
            continue
        e = codes.setdefault(subj, {}).get(num_key(num))
        if e is None:
            e = codes[subj][num_key(num)] = {"number": num, "listed": "Catalog", "band": "", "units": r.get("units") or "",
                                             "cid": "", "ccn": "", "mid": ""}
        elif e["listed"] == "COCI":
            e["listed"] = "Both"
        if r.get("title"):
            e["title"] = str(r["title"]).strip()
    out = {}
    for code in sorted(codes):
        rows = sorted(codes[code].values(), key=lambda e: sort_key(e["number"]))
        out[code] = [[e.get(c, "") for c in COLUMNS] for e in rows]
    return {"college": college, "slug": slug, "columns": COLUMNS, "codes": out}


def read_state(root):
    src = open(os.path.join(root, STATE), encoding="utf-8").read()
    return json.loads(src[src.index("{"):src.rindex("}") + 1])


def build(root=ROOT):
    index = json.load(open(os.path.join(root, CATALOGS, "index.json"), encoding="utf-8"))
    state = read_state(root)
    by_name = {college_key(n): i for i, n in enumerate(state["colleges"])}
    by_college = {}
    for r in state["rows"]:
        by_college.setdefault(r[0], []).append(r)
    docs, cats = {}, read_categories(root)
    for c in sorted(index["colleges"], key=lambda x: x["slug"]):
        with gzip.open(os.path.join(root, CATALOGS, c["file"]), "rt", encoding="utf-8") as f:
            rows = json.load(f).get("rows") or []
        docs[c["slug"]] = build_college(c["college"], c["slug"], rows, by_college.get(by_name.get(college_key(c["college"])), []), cats)
    return docs


def dump(doc):
    return json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n"


def main(argv):
    docs = build()
    stale = []
    os.makedirs(os.path.join(ROOT, OUT_DIR), exist_ok=True)
    for slug, doc in docs.items():
        path, text = os.path.join(ROOT, OUT_DIR, slug + ".json"), dump(doc)
        if "--check" in argv:
            if not os.path.exists(path) or open(path, encoding="utf-8").read() != text:
                stale.append(slug)
            continue
        with open(path, "w", encoding="utf-8") as f:
            f.write(text)
    if "--check" in argv:
        if stale:
            print("STALE: %s under %s. Run python3 kb/_build_subject_courses.py" % (", ".join(stale), OUT_DIR))
            return 1
        print("ok: %d files under %s are current" % (len(docs), OUT_DIR))
        return 0
    print("wrote %d files under %s: %d courses" % (len(docs), OUT_DIR, sum(len(v) for d in docs.values() for v in d["codes"].values())))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
