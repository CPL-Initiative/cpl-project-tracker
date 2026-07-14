#!/usr/bin/env python3
"""Build cpl_baccalaureates_data.js — the CPL Pathways *directory* data file.

The 🎓 CPL Pathways tab has two tiers:
  · FEATURED pathways (cpl_pathways_data.js) — a handful of deeply hand-curated,
    course-by-course maps (Cerritos Ironworker, Foothill DH / Respiratory).
  · DIRECTORY pathways (THIS file) — one lightweight card per *every* CCC
    baccalaureate degree in the system, auto-generated from the COCI program
    export. The card carries only PROGRAM METADATA (college, title, degree,
    TOP code, units, approval status); the CPL picture itself — which courses
    in the field this college already articulates, and which credentials peer
    colleges articulate that this college could adopt — is DERIVED LIVE at
    render time in cpl_pathways.js from the CER dataset (credential_reference_
    data.js), joined by TOP code + college. So a college that articulates a new
    credential tomorrow lights up on its card with no edit here.

The one thing this builder resolves that JS can't do cheaply is the college-name
bridge: the COCI export shouts short names ("FOOTHILL", "WEST L.A.") while the
CER data uses full names ("Foothill College", "West Los Angeles College"). We
resolve each to its exact CER key here and store it as `cer_college`, so the
render-time join is an exact (uppercased) match. A college with no CPL
articulations in CER resolves to null — its card honestly reads "no CPL
articulated in MAP yet" (the frontier).

Source: tmc/source_data/coci_program_export_2026-06-17.csv (COCI program export;
the AWARD field carries "Baccalaureate of Science (B.S.) Degree." / "…Arts
(B.A.)…"). Refresh by dropping a newer COCI program export in and re-running.

Usage:  python3 kb/_build_baccalaureate_pathways.py
Output: cpl_baccalaureates_data.js  (window.CPL_BACCALAUREATES)
"""
import csv
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
EXPORT = os.path.join(ROOT, "tmc", "source_data", "coci_program_export_2026-06-17.csv")
CER = os.path.join(ROOT, "credential_reference_data.js")
OUT = os.path.join(ROOT, "cpl_baccalaureates_data.js")

EXPORT_DATE = "2026-06-17"  # the COCI export snapshot date (shown on the tab)

# Statuses we surface. Inactive rows are dropped (a superseded duplicate, e.g.
# the old 36-unit Rio Hondo Automotive that a live 45-unit row replaces).
INCLUDE_STATUS = {"Active", "Approved", "Revision", "Review", "Draft"}

# COCI short name -> a probe string that matches the CER full name. Only the
# non-obvious ones need a hint; the rest fall out of the normalized matcher.
COLLEGE_HINTS = {
    "L.A. MISSION": "Los Angeles Mission",
    "L.A. PIERCE": "Los Angeles Pierce",
    "L.A. VALLEY": "Los Angeles Valley",
    "EAST L.A.": "East Los Angeles",
    "WEST L.A.": "West Los Angeles",
    "SAN DIEGO CITY": "San Diego City",
    "SAN DIEGO MESA": "San Diego Mesa",
    "SAN DIEGO MIRAMAR": "San Diego Miramar",
    "MT. SAN ANTONIO": "Mt. San Antonio",
    "MIRA COSTA": "MiraCosta",
    "CANYONS": "College of the Canyons",
    "SAN BERNARDINO": "San Bernardino Valley",
    "MISSION": "Mission College",          # Santa Clara — NOT Los Angeles Mission
    "MODESTO": "Modesto Junior",
}


def norm(s):
    s = (s or "").upper().replace(".", "").replace(",", "").replace("'", "")
    s = re.sub(r"\b(COLLEGE|COMMUNITY|JUNIOR|CITY|OF|THE)\b", " ", s)
    return re.sub(r"\s+", "", s)


def load_cer_colleges():
    txt = open(CER, encoding="utf-8").read()
    m = re.match(r"\s*window\.[A-Z_]+\s*=\s*", txt)
    d = json.loads(txt[m.end():].rstrip().rstrip(";"))
    cols = set()
    for u in d["unified_titles"]:
        for a in u.get("articulations", []):
            for loc in a.get("local", []):
                for c in loc.get("colleges", []):
                    cols.add(c)
    return sorted(cols)


def resolve_cer(coci_name, cer_colleges):
    hint = COLLEGE_HINTS.get(coci_name, coci_name)
    hn = norm(hint)
    if not hn:
        return None
    # exact, then startswith, then substring — most specific first
    for pred in (lambda cn: cn == hn,
                 lambda cn: cn.startswith(hn),
                 lambda cn: hn in cn):
        for cer in cer_colleges:
            if pred(norm(cer)):
                return cer
    return None


def degree_of(award):
    if "B.S." in award or "Science" in award:
        return ("Bachelor of Science", "B.S.")
    if "B.A." in award or "Arts" in award:
        return ("Bachelor of Arts", "B.A.")
    return ("Baccalaureate", "B.")


def parse_top(top_code):
    """'1210.00* Respiratory Care' -> ('1210.00', '1210', 'Respiratory Care')."""
    raw = (top_code or "").strip()
    m = re.match(r"^\s*(\d{4})\.(\d{2})", raw)
    code = raw.split(" ", 1)[0].replace("*", "") if raw else ""
    top4 = m.group(1) if m else (code[:4] if code else "")
    label = re.sub(r"^\s*\d{4}\.\d{2}\*?\s*", "", raw).strip() or "Other"
    return code, top4, label


def parse_units(major_units):
    """'68.00-68.00/68.00-68.00' -> 68.0 (the high end of the semester range)."""
    if not major_units:
        return None
    sem = major_units.split("/")[0]
    nums = re.findall(r"\d+(?:\.\d+)?", sem)
    if not nums:
        return None
    hi = max(float(n) for n in nums)
    return round(hi, 1)


def clean_program_title(title, degree_abbr):
    """Strip embedded degree phrases so the card doesn't read
    'Bachelor of Science — Bachelor of Science in Biomanufacturing'."""
    t = (title or "").strip()
    t = re.sub(r",?\s*Bachelor(?:'s)?\s+(?:of|in)\s+Science(?:\s+in)?\s*:?\s*", " ", t, flags=re.I)
    t = re.sub(r",?\s*Bachelor(?:'s)?\s+in\s+Science\s*", " ", t, flags=re.I)
    t = re.sub(r":\s*Bachelor(?:'s)?.*$", "", t, flags=re.I)
    t = re.sub(r"\s+", " ", t).strip(" :,-")
    return t or title


def slug(*parts):
    s = " ".join(p for p in parts if p)
    s = re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")
    return s


def main():
    cer_colleges = load_cer_colleges()
    rows = [r for r in csv.DictReader(open(EXPORT, encoding="utf-8"))
            if "Baccalaureate" in (r.get("AWARD") or "")]

    programs = []
    seen_ids = set()
    unresolved = []
    for r in rows:
        status = (r.get("STATUS") or "").strip()
        if status not in INCLUDE_STATUS:
            continue
        coci_college = (r.get("COLLEGE") or "").strip()
        award = (r.get("AWARD") or "").strip()
        degree, abbr = degree_of(award)
        title = clean_program_title((r.get("TITLE") or "").strip(), abbr)
        code, top4, field = parse_top(r.get("TOP CODE"))
        cer_college = resolve_cer(coci_college, cer_colleges)
        if cer_college is None:
            unresolved.append(coci_college)
        pid = slug(top4, coci_college, title)
        if pid in seen_ids:
            pid = slug(top4, coci_college, title, r.get("CONTROL NUMBER") or "")
        seen_ids.add(pid)
        programs.append({
            "id": pid,
            "college": cer_college or (coci_college.title().replace("L.A.", "L.A.")),
            "coci_college": coci_college,
            "cer_college": cer_college,
            "program": title,
            "degree": degree,
            "degree_abbr": abbr,
            "top": code,
            "top4": top4,
            "field": field,
            "cip": (r.get("CIP CODE") or "").strip() or None,
            "control": (r.get("CONTROL NUMBER") or "").strip() or None,
            "units": parse_units(r.get("MAJOR UNITS")),
            "status": status,
            "approved": (r.get("APPROVED DATE") or "").strip() or None,
        })

    # Group-then-flatten so the file is ordered by field, then college — the
    # dropdown builds its optgroups off this order.
    programs.sort(key=lambda p: (p["field"].lower(), p["college"].lower(), p["program"].lower()))

    data = {
        "_as_of": EXPORT_DATE,
        "_source": "COCI program export (%s); AWARD = Baccalaureate of Science/Arts. "
                   "CPL marks derive live from the CER dataset at render time." % EXPORT_DATE,
        "_generated_by": "kb/_build_baccalaureate_pathways.py",
        "_note": "Directory tier of the CPL Pathways tab. Program metadata only — "
                 "the CPL landscape is live-derived in cpl_pathways.js by TOP + college.",
        "count": len(programs),
        "programs": programs,
    }

    header = (
        "// CPL Pathways — baccalaureate DIRECTORY data (auto-generated, static).\n"
        "// Generated by kb/_build_baccalaureate_pathways.py from the COCI program\n"
        "// export. One card per CCC baccalaureate degree; the CPL picture is\n"
        "// DERIVED LIVE in cpl_pathways.js from the CER dataset (TOP + college join),\n"
        "// so cards track the MAP platform as colleges add articulations. Program\n"
        "// metadata only here. Do NOT hand-edit — re-run the builder.\n"
    )
    body = "window.CPL_BACCALAUREATES = " + json.dumps(data, indent=1, ensure_ascii=False) + ";\n"
    open(OUT, "w", encoding="utf-8").write(header + body)

    # Console receipt
    fields = {}
    for p in programs:
        fields.setdefault(p["field"], []).append(p)
    print("Wrote %s" % OUT)
    print("  %d baccalaureate programs, %d fields" % (len(programs), len(fields)))
    print("  cer_college resolved: %d / %d" % (
        sum(1 for p in programs if p["cer_college"]), len(programs)))
    if unresolved:
        print("  no CER CPL data (frontier colleges): %s" % ", ".join(sorted(set(unresolved))))
    print("  fields:")
    for f, ps in sorted(fields.items(), key=lambda x: -len(x[1])):
        print("    %-42s %d" % (f[:42], len(ps)))


if __name__ == "__main__":
    sys.exit(main())
