#!/usr/bin/env python3
"""Build the COCI *offerings* catalog for Sierra (the CPL Assistant).

WHY: the shared `cpl-chat` Edge Function can search the EARNED-exhibit set
(`chatbox_exhibits` — what colleges have already articulated for CPL) but has no
view of what each college actually TEACHES. So it cannot reason like:
"College X hasn't articulated NCCER, but DOES it teach construction courses that
could map? If not, which nearby college does?" — the Boys & Girls Club case.

This builder rolls the 141k-row COCI course list up to a slim, searchable
(college x TOP-program) catalog + a per-college program/award list, plus loads a
committed geography map, and writes a payload the sync step lands into Supabase
tables the function can query.

INPUTS
  kb/reference/coci_course_list.xlsx        (141k courses — the offerings)
  tmc/source_data/coci_program_export_*.csv (programs/awards; loose college names)
  chatbox/college_geo.json                  (curated college -> region/county)
  kb/college_short_names.json               (name reconciliation taxonomy)

OUTPUT
  chatbox/coci_offerings_payload.json  { offerings:[...], programs:[...], geo:[...], _meta:{...} }

Run from repo root:  python3 chatbox/build_coci_offerings.py
STATIC artifact — rebuild only on a fresh COCI extract (like tmc_college_courses.js).
"""
import os, re, json, glob, collections, datetime
import openpyxl

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
XLSX = os.path.join(ROOT, "kb", "reference", "coci_course_list.xlsx")
PROG_GLOB = os.path.join(ROOT, "tmc", "source_data", "coci_program_export_*.csv")
GEO_JSON = os.path.join(ROOT, "chatbox", "college_geo.json")
TAXONOMY_JSON = os.path.join(ROOT, "kb", "college_short_names.json")
OUT = os.path.join(ROOT, "chatbox", "coci_offerings_payload.json")

SAMPLE_PER_TOP = 8
TITLES_TEXT_CAP = 900
TITLES_MAX = 40  # distinct titles kept for the searchable blob


# ---- college-name reconciliation (program loose label -> course-list full) ----
def fix_moji(s):
    """Repair the double-encoded 'CaÃ±ada College' the COCI export carries so our
    names match the correct-unicode form used by chatbox_college_profilies."""
    if s and "Ã" in s:
        try:
            return s.encode("latin-1").decode("utf-8")
        except (UnicodeEncodeError, UnicodeDecodeError):
            return s
    return s


def norm_college(s):
    s = (s or "").lower()
    s = re.sub(r"\b(college|community|the|of|center|centers|ctrs|ctr|district)\b", " ", s)
    s = re.sub(r"[^a-z0-9]+", " ", s)
    return re.sub(r"\s+", " ", s).strip()


# Explicit program-export spelling -> course-list full name, for forms neither
# normalize() nor the taxonomy bridges (mostly "L.A." vs "Los Angeles").
# Mirrors tmc/_build_college_adts.py so the two builders reconcile identically.
PROGRAM_COLLEGE_ALIASES = {
    "CANADA": "Cañada College",
    "EAST L.A.": "East Los Angeles College",
    "L.A. CITY": "Los Angeles City College",
    "L.A. HARBOR": "Los Angeles Harbor College",
    "L.A. MISSION": "Los Angeles Mission College",
    "L.A. PIERCE": "Los Angeles Pierce College",
    "L.A. SOUTHWEST": "Los Angeles Southwest College",
    "L.A. TRADE-TECH": "Los Angeles Trade Technical College",
    "L.A. VALLEY": "Los Angeles Valley College",
    "MIRA COSTA": "MiraCosta College",
    "SAN FRANCISCO CITY": "City College of San Francisco",
    "SAN FRANCISCO CTRS": "City College of San Francisco",
    "SANTA BARBARA CED": "Santa Barbara City College",
    "WEST L.A.": "West Los Angeles College",
    "CALBRIGHT": "Calbright College Credit",
}


def make_college_resolver(full_names):
    by_norm = {}
    for nm in full_names:
        by_norm.setdefault(norm_college(nm), nm)
    tax_to_full = {}
    if os.path.exists(TAXONOMY_JSON):
        cols = json.load(open(TAXONOMY_JSON, encoding="utf-8"))["colleges"]
        for e in cols:
            forms = [e.get("canonical"), e.get("short"), e.get("short_caps")] + (e.get("aliases") or [])
            canon_full = by_norm.get(norm_college(e.get("canonical", "")))
            if canon_full:
                for f in forms:
                    if f:
                        tax_to_full.setdefault(norm_college(f), canon_full)

    def resolve(prog_name):
        p = (prog_name or "").strip()
        if p in PROGRAM_COLLEGE_ALIASES:
            return PROGRAM_COLLEGE_ALIASES[p]
        n = norm_college(p)
        return by_norm.get(n) or tax_to_full.get(n)

    return resolve


def split_top(raw):
    """'0952.00: Construction Crafts Technology' -> ('0952.00', 'Construction Crafts Technology')."""
    raw = str(raw or "").strip()
    if not raw:
        return ("", "")
    m = re.match(r"\s*([0-9]{4}\.[0-9]{2})\s*[:\-]?\s*(.*)$", raw)
    if m:
        return (m.group(1), m.group(2).strip())
    return ("", raw)


def build_offerings():
    wb = openpyxl.load_workbook(XLSX, read_only=True, data_only=True)
    ws = wb.active
    ci = {}
    # rollup[(college, top_code)] -> aggregate
    roll = {}
    colleges = set()
    n_rows = 0
    for i, row in enumerate(ws.iter_rows(values_only=True)):
        if i == 0:
            ci = {h: j for j, h in enumerate(row)}
            continue
        n_rows += 1
        college = fix_moji(str(row[ci["College"]] or "").strip())
        if not college:
            continue
        colleges.add(college)
        subj = str(row[ci["Subject"]] or "").strip()
        num = str(row[ci["Course_Number"]] or "").strip()
        title = str(row[ci["CourseTitle"]] or "").strip()
        units = row[ci["UnitValue"]]
        credit_type = str(row[ci["CreditType"]] or "").strip()
        top_code, top_title = split_top(row[ci["TopCode"]])
        cid = str(row[ci["CIDNumber"]] or "").strip()
        cid = "" if cid.upper() in ("", "NULL", "N/A", "NA", "-") else cid
        key = (college, top_code)
        agg = roll.get(key)
        if agg is None:
            agg = roll[key] = {
                "college": college, "top_code": top_code, "top_title": top_title,
                "course_count": 0, "credit_count": 0, "noncredit_count": 0,
                "cid_count": 0, "_titles": set(), "_samples": [],
            }
        agg["course_count"] += 1
        if credit_type == "Credit Course":
            agg["credit_count"] += 1
        else:
            agg["noncredit_count"] += 1
        if cid:
            agg["cid_count"] += 1
        if top_title and not agg["top_title"]:
            agg["top_title"] = top_title
        if title:
            agg["_titles"].add(title)
        if len(agg["_samples"]) < SAMPLE_PER_TOP:
            try:
                u = round(float(units), 1) if units not in (None, "") else None
            except (TypeError, ValueError):
                u = None
            agg["_samples"].append({
                "code": f"{subj} {num}".strip(), "title": title[:80], "units": u,
                "cid": cid or None,
            })

    out = []
    for agg in roll.values():
        titles = sorted(agg.pop("_titles"))[:TITLES_MAX]
        txt = "; ".join(titles)
        agg["titles_text"] = txt[:TITLES_TEXT_CAP]
        agg["sample_courses"] = agg.pop("_samples")
        out.append(agg)
    return out, sorted(colleges), n_rows


def build_programs(full_names):
    path = sorted(glob.glob(PROG_GLOB))[-1]
    import csv
    resolve = make_college_resolver(full_names)
    rows, unresolved = [], collections.Counter()
    with open(path, encoding="utf-8-sig", newline="") as f:
        for r in csv.DictReader(f):
            status = (r.get("STATUS") or "").strip()
            # keep active/approved-ish programs (what a college currently offers)
            if status not in ("Active", "Approved", "Active - Teachout Only"):
                continue
            college = resolve(r.get("COLLEGE", ""))
            if not college:
                unresolved[(r.get("COLLEGE") or "").strip()] += 1
                continue
            top_code, top_title = split_top(r.get("TOP CODE"))
            rows.append({
                "college": college,
                "program_title": (r.get("TITLE") or "").strip()[:200],
                "award": (r.get("AWARD") or "").strip()[:80],
                "top_code": top_code,
                "top_title": top_title,
                "status": status,
            })
    return rows, os.path.basename(path), dict(unresolved)


def main():
    offerings, colleges, n_rows = build_offerings()
    programs, prog_src, prog_unresolved = build_programs(colleges)
    geo = json.load(open(GEO_JSON, encoding="utf-8")) if os.path.exists(GEO_JSON) else []
    geo_names = {g["college"] for g in geo}
    missing_geo = [c for c in colleges if c not in geo_names]

    payload = {
        "_meta": {
            "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "course_rows_read": n_rows,
            "offerings_rows": len(offerings),
            "programs_rows": len(programs),
            "programs_source": prog_src,
            "programs_unresolved_colleges": prog_unresolved,
            "colleges": len(colleges),
            "geo_rows": len(geo),
            "colleges_missing_geo": missing_geo,
        },
        "offerings": offerings,
        "programs": programs,
        "geo": geo,
    }
    json.dump(payload, open(OUT, "w", encoding="utf-8"), ensure_ascii=False)
    sz = os.path.getsize(OUT) / 1e6
    print(json.dumps(payload["_meta"], indent=2))
    print(f"\nwrote {OUT}  ({sz:.1f} MB)")
    if missing_geo:
        print(f"\n⚠ {len(missing_geo)} colleges missing geo (first 20):")
        for c in missing_geo[:20]:
            print("   ", c)


if __name__ == "__main__":
    main()
