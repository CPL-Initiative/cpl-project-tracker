#!/usr/bin/env python3
"""Build program_course_graph.json — the authoritative program → courses join.

THE POINT: COCI has a real course→program membership (the CCCCO Data Mart's
"College Master Course/Program File" → the *Program Course File*), so we no
longer have to *guess* which courses belong to a program from its TOP code (the
TOP-proxy the CPL-pathways CCR engine used — see
docs/kb-notes/methodology-top-is-a-last-in-line-signal.md). This assembles the
three files into one graph:

    coci_program_export.csv  (Program Control Number → title / award / TOP / CIP)
  ⋈ coci_program_course_file.csv  (Program Control Number → Course Control Number)   [the missing link]
  ⋈ coci_course_list.xlsx  (Course Control Number → units / subject / number / C-ID)

Output: one node per program, keyed "<NORMCOLLEGE>|<program_control_number>",
carrying its course list with units + C-ID + subject/number. Consumers (the CPL
pathways / CCR generators) get authoritative course lists for every credential.

WHAT THIS FILE DOES *NOT* HAVE (the remaining gap, by design): the
required / elective / optional *designation* and the unit rules per requirement
group. COCI never collects that — it lives only in local college catalogs. That
stays a curation / CTDL layer (faculty mark it once per program). See the lessons
doc for the strategy.

The program_course_file is produced by kb/_fetch_program_course_files.py
(Playwright, run in .github/workflows/program-course-fetch.yml — the Data Mart
has no "Select All", so a headless browser loops every college). This generator
NO-OPS gracefully when that file is absent, so it is safe to run any time.

Run: python3 kb/_build_program_course_graph.py
"""
import csv
import gzip
import json
import os
import re
from collections import OrderedDict

SCRIPT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KB = os.path.join(SCRIPT_DIR, "kb")

PC_FILE = os.path.join(KB, "reference", "coci_program_course_file.csv")  # .csv or .csv.gz
PROG_EXPORT = os.path.join(SCRIPT_DIR, "tmc", "source_data", "coci_program_export_2026-06-17.csv")
COURSE_LIST = os.path.join(KB, "reference", "coci_course_list.xlsx")
CB_MASTER = os.path.join(KB, "reference", "cb_course_basic_fall2025.csv")  # CB_COLLEGE_ID -> College_name_long
OUT = os.path.join(KB, "program_course_graph.json")

# The full-export Program Course File uses compact headers + a numeric CollegeCode;
# the single-college Data Mart download uses spaced headers + a college NAME. Map
# both onto one canonical schema. NOTE: all values stay STRINGS — control numbers
# and college codes are zero-padded (e.g. "07200", "021"); never int() them.
_PC_ALIASES = {
    "Program Control Number": ("Program Control Number", "ProgramControlNumber"),
    "Program Status":         ("Program Status", "ProgramStatus"),
    "Course Control Number":  ("Course Control Number", "CourseControlNumber"),
    "Course Status":          ("Course Status", "CourseStatus"),
    "Course Id":              ("Course Id", "CrsId"),
    "Course Title":           ("Course Title", "Title"),
    "Course TOP Code":        ("Course TOP Code", "TopCode"),
    "Course Classification Code": ("Course Classification Code", "CourseClassificationCode"),
}

# Which program / course lifecycle states count as "current". The Data Mart file
# carries every state ever (Active / Approved / Inactive / Deleted / Draft /
# Revision); we keep only the live ones so a pathway shows the real catalog.
PROGRAM_STATUSES = {"Active", "Approved"}
COURSE_STATUSES = {"Active", "Approved"}


def _norm(c):
    return str(c or "").strip().upper()


def _nnum(x):
    return re.sub(r"\.0+$", "", str(x or "").strip()).upper()


def _units(x):
    try:
        return float(x)
    except (TypeError, ValueError):
        return None


def assemble(pc_rows, prog_meta, course_meta,
             program_statuses=PROGRAM_STATUSES, course_statuses=COURSE_STATUSES):
    """Pure join. Returns OrderedDict keyed "<NORMCOLLEGE>|<control>".

    pc_rows      : iterable of dicts with the Program Course File columns
                   (College, Program Control Number, Program Status,
                   Course Control Number, Course Status, Course Id,
                   Course Title, Course TOP Code, Course Classification Code).
    prog_meta    : {(NORMCOLLEGE, control): {"title","award","top","cip","status"}}
    course_meta  : {course_control_number: {"subj","num","title","units","cid","top"}}

    A course that doesn't resolve into course_meta (retired / not in the current
    course list) still lands, using the Program Course File's own Course Title +
    TOP + the raw Course Id — just without units / clean subject-number / C-ID
    (resolved=False). Never dropped silently: the node counts both.
    """
    graph = OrderedDict()
    for r in pc_rows:
        if (r.get("Program Status") or "").strip() not in program_statuses:
            continue
        if (r.get("Course Status") or "").strip() not in course_statuses:
            continue
        college = _norm(r.get("College"))
        control = (r.get("Program Control Number") or "").strip()
        if not college or not control:
            continue
        key = "%s|%s" % (college, control)
        node = graph.get(key)
        if node is None:
            pm = prog_meta.get((college, control), {})
            node = graph[key] = {
                "college": r.get("College", "").strip(),
                "control": control,
                "title": pm.get("title"),          # None if not in the program export
                "award": pm.get("award"),
                "top": pm.get("top"),
                "cip": pm.get("cip"),
                "program_meta_found": bool(pm),
                "courses": [],
                "_seen": set(),
            }
        ccn = (r.get("Course Control Number") or "").strip()
        if not ccn or ccn in node["_seen"]:
            continue
        node["_seen"].add(ccn)
        cm = course_meta.get(ccn)
        node["courses"].append({
            "ccn": ccn,
            "course_id": (r.get("Course Id") or "").strip(),
            "subj": cm["subj"] if cm else None,
            "num": cm["num"] if cm else None,
            "title": (cm["title"] if cm else (r.get("Course Title") or "").strip()),
            "units": cm["units"] if cm else None,
            "cid": cm["cid"] if cm else "",
            "top": (cm["top"] if cm else (r.get("Course TOP Code") or "").strip()),
            "classification": (r.get("Course Classification Code") or "").strip(),
            "resolved": bool(cm),
        })
    # finalize
    for node in graph.values():
        del node["_seen"]
        courses = node["courses"]
        node["n_courses"] = len(courses)
        node["n_resolved"] = sum(1 for c in courses if c["resolved"])
        node["units_resolved"] = round(
            sum(c["units"] for c in courses if isinstance(c["units"], (int, float))), 1)
    return graph


# ── I/O loaders ──────────────────────────────────────────────────────────────

def load_program_meta(path=PROG_EXPORT):
    meta = {}
    if not os.path.exists(path):
        return meta
    with open(path, encoding="utf-8-sig") as f:
        for r in csv.DictReader(f):
            key = (_norm(r.get("COLLEGE")), (r.get("CONTROL NUMBER") or "").strip())
            if not key[0] or not key[1]:
                continue
            meta[key] = {
                "title": (r.get("TITLE") or "").strip(),
                "award": (r.get("AWARD") or "").strip(),
                "top": (r.get("TOP CODE") or "").strip(),
                "cip": (r.get("CIP CODE") or "").strip(),
                "status": (r.get("STATUS") or "").strip(),
            }
    return meta


def load_course_meta(path=COURSE_LIST):
    meta = {}
    if not os.path.exists(path):
        return meta
    import openpyxl
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    ws = wb.active
    it = ws.iter_rows(values_only=True)
    hdr = [str(c).strip() if c is not None else "" for c in next(it)]
    H = {h: i for i, h in enumerate(hdr)}
    for row in it:
        ccn = str(row[H["CourseControlNumber"]] or "").strip()
        if not ccn:
            continue
        meta[ccn] = {
            "subj": str(row[H["Subject"]] or "").strip().upper(),
            "num": _nnum(row[H["Course_Number"]]),
            "title": str(row[H["CourseTitle"]] or "").strip(),
            "units": _units(row[H["UnitValue"]]),
            "cid": str(row[H["CIDNumber"]] or "").strip(),
            "top": str(row[H["TopCode"]] or "").strip(),
        }
    return meta


def load_college_code_map(path=CB_MASTER):
    """CB numeric college code (e.g. '073') -> college long name, from the CB
    Master Course File. The full Program Course export keys colleges by code."""
    m = {}
    if not os.path.exists(path):
        return m
    with open(path, encoding="utf-8-sig") as f:
        for r in csv.DictReader(f):
            code = (r.get("CB_COLLEGE_ID") or "").strip()
            name = (r.get("College_name_long") or "").strip()
            if code and name:
                m.setdefault(code, name)
    return m


def _open_text(path):
    """Open .csv or .csv.gz transparently (utf-8-sig to drop the BOM)."""
    if path.endswith(".gz"):
        return gzip.open(path, "rt", encoding="utf-8-sig")
    return open(path, encoding="utf-8-sig")


def load_pc_rows(path=PC_FILE, college_map=None):
    """Load + normalize the Program Course File onto the canonical schema,
    handling BOTH the full export (compact headers, numeric CollegeCode) and the
    single-college download (spaced headers, college name). Values stay strings —
    leading zeros on control numbers / college codes are preserved."""
    real = path if os.path.exists(path) else (path + ".gz" if os.path.exists(path + ".gz") else None)
    if real is None:
        return None
    college_map = college_map or {}
    with _open_text(real) as f:
        raw = list(csv.DictReader(f))
    if not raw:
        return []
    cols = set(raw[0].keys())
    # Resolve which source header supplies each canonical field.
    picked = {canon: next((s for s in srcs if s in cols), None) for canon, srcs in _PC_ALIASES.items()}
    has_name = "College" in cols
    has_code = "CollegeCode" in cols
    out = []
    for r in raw:
        rec = {canon: (r.get(src) or "") for canon, src in picked.items() if src}
        if has_name:
            rec["College"] = r.get("College") or ""
        elif has_code:
            code = (r.get("CollegeCode") or "").strip()
            rec["College"] = college_map.get(code) or ("CC" + code)  # fall back to code, never int
        out.append(rec)
    return out


def main():
    from datetime import datetime, timezone
    pc_rows = load_pc_rows(college_map=load_college_code_map())
    if pc_rows is None:
        print("NO-OP: %s not present yet — run kb/_fetch_program_course_files.py "
              "(or the program-course-fetch workflow) to produce it." % PC_FILE)
        return
    prog_meta = load_program_meta()
    course_meta = load_course_meta()
    graph = assemble(pc_rows, prog_meta, course_meta)
    resolved = sum(n["n_resolved"] for n in graph.values())
    total = sum(n["n_courses"] for n in graph.values())
    payload = {
        "_generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "_generated_by": "kb/_build_program_course_graph.py",
        "_source": "CCCCO Data Mart College Master Course/Program File (Program Course File) "
                   "⋈ coci_program_export ⋈ coci_course_list",
        "_note": ("Authoritative program→course membership with units/C-ID. Does NOT carry the "
                  "required/elective/optional designation (catalog/CTDL curation layer)."),
        "_filters": {"program_status": sorted(PROGRAM_STATUSES), "course_status": sorted(COURSE_STATUSES)},
        "count": len(graph),
        "courses_total": total,
        "courses_resolved": resolved,
        "programs": graph,
    }
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))
        f.write("\n")
    print("wrote %s — %d programs, %d/%d courses resolved into the course list (%.0f%%)"
          % (OUT, len(graph), resolved, total, 100 * resolved / max(total, 1)))


if __name__ == "__main__":
    main()
