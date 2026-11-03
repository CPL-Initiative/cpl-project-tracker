#!/usr/bin/env python3
"""Write the OpenClassrooms Medical Assistant crosswalk workbook from
kb/oc_medical_assistant_out/crosswalk.json (run _build_oc_medical_assistant_crosswalk.py first).

Ashley's sixteen columns lead the crosswalk tabs in her order; the evidence columns a
faculty reviewer needs follow them.

Run:  python3 kb/_write_oc_medical_assistant_workbook.py [OUT.xlsx]
"""
import collections
import datetime as dt
import json
import os
import sys

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "oc_medical_assistant_out", "crosswalk.json")

EXISTING = "Existing Approved Opportunity"
POTENTIAL = "Potential New Alignment"
COCI_URL = "https://coci2.ccctechcenter.net/courses"
MAP_URL = "https://map.rccd.edu/cpllandingpages/"

FONT = "Arial"
HEAD_FILL = PatternFill("solid", fgColor="002F6D")   # First Light seal blue
BAND = {"High": "EAF4EC", "Medium": "FFFFFF", "Low": "F5F5F5"}
EXIST_FILL = "E3EDF9"
thin = Side(style="thin", color="C8CED6")

COLS = ["Certificate Name", "Region", "Credit Recommendation Title", "Discipline", "Exhibit ID", "Exhibit Title",
        "College Name", "Course Name", "Course ID", "Units", "Course Description",
        "Work Processes / Competency Alignment", "Match Strength", "CPL Status", "Source / Verification Link", "Notes",
        # evidence columns
        "Proposed Credit Area", "OpenClassrooms Projects", "Competency Groups Evidenced (count)", "MAP Status",
        "Active (MIS Fall 2025)", "TOP Code", "COCI Control Number", "Course Already Accepts CPL Via"]
WIDTHS = [30, 18, 34, 24, 24, 30, 26, 32, 13, 7, 60, 60, 10, 22, 40, 60, 30, 22, 12, 22, 22, 24, 17, 30]


def clean(s):
    s = "" if s is None else str(s)
    for _ in range(3):
        try:
            t = s.encode("cp1252").decode("utf-8")
        except (UnicodeEncodeError, UnicodeDecodeError):
            break
        if t == s:
            break
        s = t
    return s.replace("_x000D_", " ").replace("\r", " ").replace("\n", " ").strip()


def header(ws, cols, widths):
    ws.append(cols)
    for i, w in enumerate(widths, 1):
        c = ws.cell(row=1, column=i)
        c.font = Font(name=FONT, bold=True, color="FFFFFF")
        c.fill = HEAD_FILL
        c.alignment = Alignment(wrap_text=True, vertical="center")
        ws.column_dimensions[get_column_letter(i)].width = w
    ws.freeze_panes = "A2"
    ws.row_dimensions[1].height = 34


def body(ws, fills=None, link_cols=()):
    for r in ws.iter_rows(min_row=2):
        for c in r:
            c.font = Font(name=FONT, size=10)
            c.alignment = Alignment(wrap_text=True, vertical="top")
            c.border = Border(bottom=thin)
            if fills and fills.get(r[0].row):
                c.fill = PatternFill("solid", fgColor=fills[r[0].row])
        for li in link_cols:
            c = r[li - 1]
            v = str(c.value or "")
            if v.startswith("http"):
                c.hyperlink = v.split(" ")[0]
                c.font = Font(name=FONT, size=10, color="1F4E8C", underline="single")
    if ws.max_row > 1:
        ws.auto_filter.ref = f"A1:{get_column_letter(ws.max_column)}{ws.max_row}"


def alignment_text(hits):
    return "; ".join(f"{n} ({wp})" for n, wp, _ in hits) or "No competency evidenced in the catalog description (title match only)"


def rows_for(d):
    cert = d["certificate"]
    cat = d["catalog"]
    out = []
    for c in d["map_rows"]:
        link = cat.get(c["college"]) or COCI_URL
        out.append({
            "status": EXISTING, "strength": c["strength"], "college": c["college"], "region": c["region"],
            "vals": [cert, c["region"], c["credit_rec"], c["discipline"], c["exhibit_id"], c["exhibit_title"],
                     c["college"], c["course_title"], c["course_id"], c["units"], clean(c["description"]) or
                     "Description not found in COCI - verify in the college catalog",
                     alignment_text(c["hits"]), c["strength"], EXISTING,
                     f"{MAP_URL} (MAP exhibit {c['exhibit_id'].split(' | ')[0]}); catalog: {link}",
                     c["note"], c["lens"], c["projects"], len(c["hits"]), c["map_status"], c["active"],
                     c["top"], c["ctrl"], f"{c['exhibit_title']} ({c['source']})"],
        })
    for c in d["courses"]:
        link = cat.get(c["college"]) or COCI_URL
        notes = []
        if c["on_map"]:
            notes.append(f"This course already accepts CPL in MAP for {c['on_map']}.")
        if c["evidence"] == "Catalog description":
            notes.append("Found by its catalog description, not its title.")
        if c["credit"] and c["credit"] != "Credit":
            notes.append(f"{c['credit']} course.")
        if not c["active"].startswith("Yes"):
            notes.append("Not in the MIS Fall 2025 inventory; confirm it is still offered.")
        if c["note"]:
            notes.append(c["note"])
        notes.append("Needs faculty review of the course outline of record before any CPL approval.")
        out.append({
            "status": POTENTIAL, "strength": c["strength"], "college": c["college"], "region": c["region"],
            "vals": [cert, c["region"], f"None in MAP. Proposed: {c['lens']}", c["discipline"],
                     "None (new exhibit needed)", "None", c["college"], c["course_title"], c["course_id"],
                     c["units"], clean(c["description"]) or "No catalog description in COCI - verify in the college catalog",
                     alignment_text(c["hits"]), c["strength"], POTENTIAL,
                     f"{link} (COCI {c['ctrl']}: {COCI_URL})", " ".join(notes), c["lens"], c["projects"],
                     len(c["hits"]), "Not in MAP for this training", c["active"], c["top"], c["ctrl"],
                     c["on_map"] or ""],
        })
    return out


def write_rows(ws, rows):
    header(ws, COLS, WIDTHS)
    fills = {}
    for i, r in enumerate(rows, 2):
        ws.append([clean(v) if isinstance(v, str) else v for v in r["vals"]])
        fills[i] = EXIST_FILL if r["status"] == EXISTING else BAND[r["strength"]]
    body(ws, fills, link_cols=(15,))


def main():
    d = json.load(open(SRC))
    today = dt.date.today()
    out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
        HERE, "oc_medical_assistant_out", f"{today:%Y%m%d}_OpenClassrooms_Medical_Assistant_CPL_Crosswalk.xlsx")
    rows = rows_for(d)
    order = {"High": 0, "Medium": 1, "Low": 2}
    ex = [r for r in rows if r["status"] == EXISTING]
    po = sorted([r for r in rows if r["status"] == POTENTIAL],
                key=lambda r: (order[r["strength"]], r["region"], r["college"]))
    colleges_rev = d["colleges_reviewed"]
    match_cols = {r["college"] for r in rows}
    high_cols = {r["college"] for r in po if r["strength"] == "High"}
    ex_cols = {r["college"] for r in ex}

    wb = Workbook()
    # ------------------------------------------------------------- Summary ---
    ws = wb.active
    ws.title = "Summary"
    ws.column_dimensions["A"].width = 46
    for col in "BCDEFG":
        ws.column_dimensions[col].width = 16
    lines = [
        (f"OpenClassrooms Medical Assistant Registered Apprenticeship: statewide CPL crosswalk", True),
        (f"California Community Colleges. Prepared {today:%B %-d, %Y} by the MAP team. A snapshot: COCI and MAP change daily.", False),
        ("", False),
        ("Training", True),
        ("O*NET-SOC 31-9092.00 Medical Assistants; RAPIDS 1085CB; competency-based and degree-granting; "
         "24 work processes (28 competencies); 400 hours of related instruction in eight online projects; "
         "about 18 months. Credential: DOL Certificate of Completion of Apprenticeship.", False),
        ("", False),
        ("Headline counts", True),
    ]
    for t, b in lines:
        ws.append([t])
        ws.cell(row=ws.max_row, column=1).font = Font(name=FONT, bold=b, size=14 if ws.max_row == 1 else 11,
                                                      color="002F6D" if b else "000000")
        ws.cell(row=ws.max_row, column=1).alignment = Alignment(wrap_text=True, vertical="top")
    ws.merge_cells(start_row=5, start_column=1, end_row=5, end_column=7)
    ws.row_dimensions[5].height = 48
    ws.merge_cells(start_row=2, start_column=1, end_row=2, end_column=7)
    stats = [
        ("Colleges reviewed (every college in COCI)", len(colleges_rev)),
        ("Colleges with at least one aligned course or CPL", len(match_cols)),
        ("Existing approved CPL rows in MAP (for other credentials)", len(ex)),
        ("Colleges with existing approved CPL in these subjects", len(ex_cols)),
        ("Potential new course alignments", len(po)),
        ("   High", sum(1 for r in po if r["strength"] == "High")),
        ("   Medium", sum(1 for r in po if r["strength"] == "Medium")),
        ("   Low", sum(1 for r in po if r["strength"] == "Low")),
        ("Colleges with a High alignment (lead partnership prospects)", len(high_cols)),
        ("Active medical assisting / medical office programs (Programs tab)", len(d["programs"])),
        ("MAP statewide or OpenClassrooms exhibits for this training", 0),
    ]
    for k, v in stats:
        ws.append([k, v])
    ws.append([])
    ws.append(["By region"])
    ws.cell(row=ws.max_row, column=1).font = Font(name=FONT, bold=True, color="002F6D")
    ws.append(["Region", "Colleges with a match", "Existing approved", "High", "Medium", "Low", "Programs"])
    hr = ws.max_row
    for c in range(1, 8):
        ws.cell(row=hr, column=c).font = Font(name=FONT, bold=True, color="FFFFFF")
        ws.cell(row=hr, column=c).fill = HEAD_FILL
    regs = sorted({r["region"] for r in rows})
    for g in regs:
        rr = [r for r in rows if r["region"] == g]
        ws.append([g, len({r["college"] for r in rr}), sum(1 for r in rr if r["status"] == EXISTING),
                   sum(1 for r in rr if r["status"] == POTENTIAL and r["strength"] == "High"),
                   sum(1 for r in rr if r["status"] == POTENTIAL and r["strength"] == "Medium"),
                   sum(1 for r in rr if r["status"] == POTENTIAL and r["strength"] == "Low"),
                   sum(1 for p in d["programs"] if p["region"] == g)])
    ws.append([])
    ws.append(["Top prospects: colleges by number of High alignments"])
    ws.cell(row=ws.max_row, column=1).font = Font(name=FONT, bold=True, color="002F6D")
    ws.append(["College", "Region", "High", "Medium", "Existing approved", "MA programs"])
    hr = ws.max_row
    for c in range(1, 7):
        ws.cell(row=hr, column=c).font = Font(name=FONT, bold=True, color="FFFFFF")
        ws.cell(row=hr, column=c).fill = HEAD_FILL
    per = collections.defaultdict(lambda: [0, 0, 0])
    for r in rows:
        k = per[r["college"]]
        if r["status"] == EXISTING:
            k[2] += 1
        elif r["strength"] == "High":
            k[0] += 1
        elif r["strength"] == "Medium":
            k[1] += 1
    reg_of = {r["college"]: r["region"] for r in rows}
    progs = collections.Counter(p["college"] for p in d["programs"] if p["fit"] == "Medical assisting program")
    for col, (h, m, e) in sorted(per.items(), key=lambda kv: (-kv[1][0], -kv[1][2], -kv[1][1], kv[0]))[:25]:
        ws.append([col, reg_of.get(col, ""), h, m, e, progs.get(col, 0)])
    for row in ws.iter_rows(min_row=8):
        for c in row:
            if c.font is None or not c.font.bold:
                c.font = Font(name=FONT, size=10)
    ws.column_dimensions["B"].width = 22

    # ------------------------------------------------- crosswalk tabs ---
    write_rows(wb.create_sheet("Existing Approved CPL"), ex)
    write_rows(wb.create_sheet("Potential New Alignments"), po)
    write_rows(wb.create_sheet("All Crosswalk"), ex + po)

    # ------------------------------------------------- work processes ---
    ws = wb.create_sheet("OC Work Processes")
    header(ws, ["ID", "Work process (Appendix A)", "Competencies", "Competency group in this crosswalk",
                "Courses evidencing the group"], [8, 60, 13, 46, 16])
    grp_count = collections.Counter(h[0] for c in d["courses"] for h in c["hits"])
    for w in d["work_processes"]:
        gs = [g for g in d["competency_groups"] if w["id"] in [x.strip() for x in g["work_processes"].split(",")]]
        ws.append([w["id"], w["name"], w["competencies"], "; ".join(g["group"] for g in gs),
                   sum(grp_count[g["group"]] for g in gs)])
    ws.append([])
    ws.append(["", "Related instruction projects (Appendix A, p. A-10)", "Hours"])
    for p in d["projects"]:
        ws.append([p["id"], p["name"], p["hours"] or "~250 (degree path)"])
    body(ws)

    # ------------------------------------------------------- programs ---
    ws = wb.create_sheet("Programs")
    header(ws, ["College Name", "Region", "Program", "Award", "Fit", "TOP Code", "CIP", "Status", "Units",
                "Catalog"], [28, 20, 44, 22, 34, 22, 10, 12, 8, 40])
    for p in sorted(d["programs"], key=lambda p: (p["fit"], p["region"], p["college"])):
        ws.append([p["college"], p["region"], p["program"], p["award"], p["fit"], p["top"], p["cip"], p["status"],
                   p["units"], d["catalog"].get(p["college"], "")])
    body(ws, link_cols=(10,))

    # ---------------------------------------------- military CR reference ---
    ws = wb.create_sheet("MAP Military CR Reference")
    header(ws, ["Exhibit ID", "Military training (ACE)", "Credit recommendation", "Colleges holding it in MAP",
                "Colleges with a course attached", "Courses attached"], [16, 34, 40, 12, 12, 70])
    for r in d["ace_recs"]:
        att = [c for c in r["colleges"] if c["course"]]
        ws.append([r["exhibit_id"], r["exhibit_title"], r["credit_rec"], len(r["colleges"]), len(att),
                   "; ".join(f"{c['college']}: {c['course']} ({c['status']})" for c in att)])
    body(ws)

    # ------------------------------------------------ colleges reviewed ---
    ws = wb.create_sheet("Colleges Reviewed")
    header(ws, ["College Name", "Region", "Existing approved", "High", "Medium", "Low", "Programs", "Catalog"],
           [34, 22, 10, 8, 8, 8, 9, 50])
    allreg = {r["college"]: r["region"] for r in rows}
    for col in colleges_rev:
        rr = [r for r in rows if r["college"] == col]
        ws.append([col, allreg.get(col, ""), sum(1 for r in rr if r["status"] == EXISTING),
                   sum(1 for r in rr if r["status"] == POTENTIAL and r["strength"] == "High"),
                   sum(1 for r in rr if r["status"] == POTENTIAL and r["strength"] == "Medium"),
                   sum(1 for r in rr if r["status"] == POTENTIAL and r["strength"] == "Low"),
                   sum(1 for p in d["programs"] if p["college"] == col), d["catalog"].get(col, "")])
    body(ws, link_cols=(8,))

    # ------------------------------------------------------------- notes ---
    ws = wb.create_sheet("Notes & Limitations")
    ws.column_dimensions["A"].width = 130
    notes = [
        "How to read this workbook",
        "Existing Approved Opportunity: a college has already approved CPL in MAP for this course, for another credential "
        "(a MAP exhibit or a military ACE credit recommendation). The course accepts CPL; it is not yet approved for OpenClassrooms.",
        "Potential New Alignment: a course in the college's COCI record whose title and catalog description match the "
        "OpenClassrooms work processes. No CPL exists for it in MAP. A course match does not qualify the course for CPL: "
        "faculty in the discipline review the course outline of record and the apprentice's evidence.",
        "Match Strength. High: a medical assisting, front-office, billing/coding or EHR course whose catalog description evidences "
        "three or more of the 14 competency groups (two for a course titled medical assisting). Medium: the subject is in the training "
        "but the description evidences fewer groups, or the course is a narrow specialty (phlebotomy, EKG, pharmacology, lab) that the "
        "training covers in a short project. Low: the training touches the subject without a module for it (medical terminology), or "
        "the description is too thin to judge.",
        "",
        "Sources",
        f"COCI course list and catalog descriptions (built {d.get('coci_built_at')}); MIS Fall 2025 course inventory (active check); "
        "COCI program inventory; MAP exhibits and credit recommendations (statewide_data.js, refreshed daily); MAP military (ACE) "
        "credit recommendations read from the MAP data store on 2026-11-03; college catalog addresses from the program source registry.",
        "OpenClassrooms documents: Appendix A Work Process Schedule and Related Instruction Outline (Medical Assistant, degree-granting) "
        "and the Medical Assistant Degree Path syllabus.",
        "",
        "Limitations and items to verify",
        "Course descriptions come from COCI, the college-entered summary. Student learning outcomes and the course outline of record were "
        "not read for each course; faculty review should start from the outline.",
        "Course numbers, units and active status are as COCI and MIS Fall 2025 report them. A course absent from MIS Fall 2025 may be "
        "inactive or renumbered; those rows say so.",
        "Units are as COCI reports them; noncredit courses show 0 units.",
        "No MAP exhibit, statewide (CCC Collaborative) credit recommendation, or college course series exists for OpenClassrooms' "
        "Medical Assistant training. No college carries a course series that mirrors the OpenClassrooms projects (unlike Bakersfield's "
        "APPR B73 series for the Digital Marketer program).",
        "Appendix A's wage table is headed 'Sales Development Representative', apparently carried over from another program; worth "
        "confirming with OpenClassrooms.",
        "California limits the injections and venipuncture a medical assistant may perform to those with documented training "
        "(16 CCR 1366.1), and phlebotomy certification requires a CDPH-approved program. Clinical CPL will need the apprenticeship's "
        "skill-check records.",
        "The OpenClassrooms syllabus has no stand-alone medical terminology, anatomy and physiology, or CPR module. Anatomy courses are "
        "excluded; terminology is listed at Low, where credit by exam is the usual CPL route.",
    ] + [f"MAP data flag: {f}" for f in d["data_flags"]] + [
        "",
        "Rebuild: python3 kb/_build_oc_medical_assistant_crosswalk.py, then kb/_write_oc_medical_assistant_workbook.py "
        "(cpl-project-tracker).",
    ]
    for n in notes:
        ws.append([n])
        c = ws.cell(row=ws.max_row, column=1)
        bold = n in ("How to read this workbook", "Sources", "Limitations and items to verify")
        c.font = Font(name=FONT, bold=bold, size=11 if bold else 10, color="002F6D" if bold else "000000")
        c.alignment = Alignment(wrap_text=True, vertical="top")

    wb.save(out)
    print(out)
    print(f"existing {len(ex)}  potential {len(po)}  colleges matched {len(match_cols)}/{len(colleges_rev)}  "
          f"high-colleges {len(high_cols)}")


if __name__ == "__main__":
    main()
