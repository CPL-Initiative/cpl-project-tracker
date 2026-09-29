#!/usr/bin/env python3
"""Build coci_programs_data.js — the COCI program inventory for the COCI Lookup
tab's Programs view.

Source: tmc/source_data/coci_program_export_2026-06-17.csv — the authoritative
COCI program export (29,147 programs statewide; the same file that seeds the
TMC Builder's ADT overlay). Columns: COLLEGE, CONTROL NUMBER, TITLE, TOP CODE,
CIP CODE, GOAL, AWARD, SUB AWARD, APPROVED DATE, CERT UNITS, MAJOR UNITS, STATUS.

Emits window.CPL_COCI_PROGRAMS — compact (college / award / status referenced by
index) with a derived TRANSFER flag: unlike courses (where C-ID is the only
transfer proxy), a program's transfer intent is explicit — ADTs (Associate
Degrees for Transfer: A.A.-T / A.S.-T, SUB AWARD "ADT Degree", and UC Transfer
Pathway degrees) ARE the transfer programs.

  {
    _built_at, _built_by, _source, _note,
    colleges: [...], awards: [...], statuses: [...],
    # ROW: [collegeIdx, ctrl, title, topCode, cipCode, awardIdx, statusIdx, units, xfer(0|1), cte(0|1)]
    rows: [...]
  }

Rebuild on a fresh COCI program extract:
  python kb/_build_coci_programs.py   (writes coci_programs_data.js at repo root)
"""
import csv
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
SRC = os.path.join(REPO, "tmc", "source_data", "coci_program_export_2026-06-17.csv")
OUT = os.path.join(REPO, "coci_programs_data.js")
BUILT_AT = "2026-07-14"
SRC_LABEL = "tmc/source_data/coci_program_export_2026-06-17.csv (COCI program export, 2026-06-17)"


def clean(v):
    return ("" if v is None else str(v)).strip()


def code_only(s):
    """'2203.00 Ethnic Studies' -> '2203.00'  ·  '05.0200 Ethnic Studies.' -> '05.0200'.

    Also strips a trailing '*' — in the CCCCO TOP taxonomy the asterisk marks a
    CTE/vocational TOP code (67% of programs). We keep the code CLEAN so it
    cross-references the CIP crosswalk's keys; the CTE distinction can be
    resurfaced from the raw export later if needed.
    """
    s = clean(s)
    return s.split(" ", 1)[0].rstrip("*") if s else ""


def units_of(major, cert):
    """Pick a compact units display: major-units range, else cert-units."""
    m = clean(major)
    if m:
        return m.split("/", 1)[0]  # semester portion, e.g. "18.00-18.00"
    return clean(cert)


def is_transfer(award, sub):
    a = clean(award).upper()
    s = clean(sub).upper()
    if "ADT" in s or "UCTP" in s:
        return True
    if "-T" in a.replace(" ", ""):   # "A.A- T Degree" -> "A.A-TDEGREE"
        return True
    if " T DEGREE" in a:             # "A.S. T Degree"
        return True
    return False


def main():
    colleges, awards, statuses = [], [], []
    ci, ai, si = {}, {}, {}

    def idx(val, arr, m):
        if val not in m:
            m[val] = len(arr)
            arr.append(val)
        return m[val]

    rows = []
    xfer_n = cip_n = 0
    with open(SRC, newline="", encoding="utf-8-sig", errors="replace") as f:
        r = csv.reader(f)
        hdr = next(r)
        h = {name: i for i, name in enumerate(hdr)}
        for row in r:
            def g(name):
                j = h.get(name)
                return clean(row[j]) if j is not None and j < len(row) else ""
            college = g("COLLEGE")
            ctrl = g("CONTROL NUMBER")
            title = g("TITLE")
            if not (college or title):
                continue
            top = code_only(g("TOP CODE"))
            cip = code_only(g("CIP CODE"))
            award = g("AWARD")
            sub = g("SUB AWARD")
            status = g("STATUS")
            units = units_of(g("MAJOR UNITS"), g("CERT UNITS"))
            xf = 1 if is_transfer(award, sub) else 0
            # GOAL encodes CTE: "C - CTE" and "CT - Career Technical Education (CTE) and Transfer"
            # both start with "C" (the only GOAL values that do). CTE is a big factor for CIP coding,
            # so surface it as a per-program flag for the CIP tab's Programs-review CTE chip.
            cte = 1 if g("GOAL").strip().startswith("C") else 0
            if xf:
                xfer_n += 1
            if cip:
                cip_n += 1
            rows.append([
                idx(college, colleges, ci), ctrl, title, top, cip,
                idx(award, awards, ai), idx(status, statuses, si), units, xf, cte,
            ])

    payload = {
        "_built_at": BUILT_AT,
        "_built_by": "kb/_build_coci_programs.py",
        "_source": SRC_LABEL,
        "_note": "COCI program inventory for the COCI Lookup > Programs view. "
                 "xfer=1 marks Associate Degrees for Transfer (ADT: A.A.-T / A.S.-T / "
                 "UC Transfer Pathway) — the explicit transfer programs. Rows carry the "
                 "college-entered TOP code and (where present) the CIP code. cte=1 marks a "
                 "CTE program (GOAL 'C - CTE' or 'CT - CTE and Transfer').",
        "colleges": colleges,
        "awards": awards,
        "statuses": statuses,
        "rows": rows,
    }
    body = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    with open(OUT, "w", encoding="utf-8") as f:
        f.write("// coci_programs_data.js — GENERATED by kb/_build_coci_programs.py. Do not edit by hand.\n")
        f.write("// Source: COCI program export (2026-06-17). Rebuild: python kb/_build_coci_programs.py\n")
        f.write("window.CPL_COCI_PROGRAMS = ")
        f.write(body)
        f.write(";\n")

    print(f"programs:  {len(rows):,}")
    print(f"colleges:  {len(colleges)} | awards: {len(awards)} | statuses: {len(statuses)}")
    print(f"transfer (ADT/UCTP): {xfer_n:,} ({100*xfer_n/len(rows):.0f}%)")
    print(f"with a CIP code:     {cip_n:,} ({100*cip_n/len(rows):.0f}%)")
    print(f"wrote {OUT}  ({os.path.getsize(OUT)/1024:.0f} KB)")


if __name__ == "__main__":
    main()
