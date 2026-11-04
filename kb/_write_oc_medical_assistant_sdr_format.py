#!/usr/bin/env python3
"""Write the OpenClassrooms Medical Assistant crosswalk in the layout of the team's
OpenClassrooms SDR crosswalk (OpenClassrooms_SDR_CPL_Crosswalk_V1.xlsx), at Ashley's
request (2026-11-03): two sheets, Crosswalk (eight columns) and Notes, same styling.

Rows: every existing approved CPL row in MAP, plus every High potential alignment, from
kb/oc_medical_assistant_out/crosswalk.json (run _build_oc_medical_assistant_crosswalk.py
first). The Medium and Low matches stay in the full workbook.

Run:  python3 kb/_write_oc_medical_assistant_sdr_format.py
"""
import datetime as dt
import json
import os
import re

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "oc_medical_assistant_out", "crosswalk.json")

CERT = "Medical Assistant"
NO_ID = "TBD — no exhibit exists in MAP yet"
NO_TITLE = "No Exhibit Title in MAP"
COLS = ["Certificate Name", "Region", "Credit Recommendation Title", "Discipline", "Exhibit ID",
        "Exhibit Title", "College", "Course Name"]
WIDTHS = {"A": 30, "B": 26, "C": 40, "D": 34, "E": 28, "F": 26, "G": 28, "H": 52}
EDGE = Side(style="thin", color="FFBFBFBF")
BOX = Border(left=EDGE, right=EDGE, top=EDGE, bottom=EDGE)
REGION = {"San Diego/Imperial": "San Diego–Imperial", "Statewide (online college)": "Statewide (online)"}


def fix(s):
    s = "" if s is None else str(s)
    try:
        t = s.encode("cp1252").decode("utf-8")
        s = t if t != s else s
    except (UnicodeEncodeError, UnicodeDecodeError):
        pass
    return re.sub(r"\s+", " ", s.replace("_x000D_", " ")).strip()


def units(u, credit):
    if credit and credit != "Credit":
        return "noncredit"
    try:
        f = float(u)
    except (TypeError, ValueError):
        return "units: verify"
    n = int(f) if f == int(f) else f
    return f"{n} unit" if f == 1 else f"{n} units"


def discipline(top, credit):
    t = (top or "")[:4]
    d = ("Medical Assisting" if t == "1208" else
         "Medical Office Technology" if t == "0514" else
         "Health Information Technology" if t == "1223" else
         "Phlebotomy" if t == "1205" else
         "Electrocardiography" if t in ("1215", "1213") else
         "Nursing / Health Occupations" if t == "1230" else
         "Health Occupations")
    return d + (" (noncredit)" if credit and credit != "Credit" else "")


def course_name(code, title, u):
    title = fix(title)
    return f"{code} {title.title() if title.isupper() else title} ({u})"


def main():
    d = json.load(open(SRC))
    rows = []
    for c in d["map_rows"]:
        u = units(c["units"], "Credit")
        rows.append((REGION.get(c["region"], c["region"]), c["college"], 0, c["course_id"], [
            CERT, REGION.get(c["region"], c["region"]), fix(c["credit_rec"]), discipline(c["top"], "Credit"),
            c["exhibit_id"].split(" | ")[0], c["exhibit_title"], c["college"],
            course_name(c["course_id"], c["course_title"], u)]))
    for c in d["courses"]:
        if c["strength"] != "High":
            continue
        u = units(c["units"], c["credit"])
        reg = REGION.get(c["region"], c["region"])
        rows.append((reg, c["college"], 1, c["course_id"], [
            CERT, reg, f"Proposed — {c['lens']}", discipline(c["top"], c["credit"]), NO_ID, NO_TITLE,
            c["college"], course_name(c["course_id"], c["course_title"], u)]))
    rows.sort(key=lambda r: (r[0], r[1], r[2], r[3]))

    wb = Workbook()
    ws = wb.active
    ws.title = "Crosswalk"
    ws.append(COLS)
    for r in rows:
        ws.append(r[4])
    head = Font(name="Arial", size=10, bold=True, color="FFFFFFFF")
    fill = PatternFill("solid", fgColor="FF0A2240")
    for cell in ws[1]:
        cell.font, cell.fill, cell.border = head, fill, BOX
        cell.alignment = Alignment(vertical="center", wrap_text=True)
    for row in ws.iter_rows(min_row=2):
        ws.row_dimensions[row[0].row].height = 25.5
        for cell in row:
            cell.font = Font(name="Arial", size=10)
            cell.alignment = Alignment(vertical="top", wrap_text=True)
            cell.border = BOX
    for k, w in WIDTHS.items():
        ws.column_dimensions[k].width = w
    ws.freeze_panes = "A2"
    ws.auto_filter.ref = f"A1:H{ws.max_row}"

    n_ex = len(d["map_rows"])
    n_hi = sum(1 for c in d["courses"] if c["strength"] == "High")
    notes = wb.create_sheet("Notes")
    notes.column_dimensions["A"].width = 120
    for line in [
        "No MAP exhibit, articulation, or statewide credit recommendation currently exists for this certificate. "
        f"Rows with an Exhibit ID ({n_ex}) are CPL a college has already approved in MAP for the same course through another "
        "credential (medical terminology exams, medical assisting certification, military medical training); they show the "
        "course accepts CPL. Rows marked TBD are proposed alignments; Exhibit ID / Exhibit Title stay pending creation in MAP.",
        f"Regions follow CCC regional consortia. Courses ({n_hi} proposed) are the strongest matches to the OpenClassrooms "
        "work processes, verified against COCI course data and the MIS Fall 2025 course inventory; confirm each in the "
        "college's official catalog. Every proposed alignment needs faculty review before CPL can be approved.",
        f"Medium and Low matches, course descriptions and competency evidence are in "
        f"{d['_built_at'].replace('-', '')}_OpenClassrooms_Medical_Assistant_CPL_Crosswalk.xlsx.",
    ]:
        notes.append([line])
        c = notes.cell(row=notes.max_row, column=1)
        c.font = Font(name="Arial", size=10)
        c.alignment = Alignment(wrap_text=True, vertical="top")

    out = os.path.join(HERE, "oc_medical_assistant_out",
                       f"{dt.date.today():%Y%m%d}_OpenClassrooms_MA_CPL_Crosswalk_V1.xlsx")
    wb.save(out)
    print(out, f"{len(rows)} rows ({n_ex} existing, {n_hi} proposed)")


if __name__ == "__main__":
    main()
