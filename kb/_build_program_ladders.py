#!/usr/bin/env python3
"""Where each program leads and what it starts from, for CPL Pathways' catalog-record view (Sam, 2026-11-27).

WHY. Sam, 2026-11-27: "is it feasible to add a section ... that could expand to show a program such as the field iron
worker BS that the AS feeds into?", then, on the data-based indicators: "yes, measure and build it", and "would be
nice to see a very compact set of cards in a top section of the pathway view showing the stackable possibilities".
The catalog-record view fetches one small file per college, kb/status/program_ladders/<slug>.json, and draws the
stack (the certificates a program starts from, the program, the degrees and bachelor's it leads to) above its
requirement blocks.

THE RECORDS. Every program record under kb/program_requirements_college/<slug>/records/, with the skip rules of
kb/_build_roep_display.py college_records(): no record, an error, or a record that places none of its listed courses
(places_none) is left out. The pilot's records (kb/program_requirements_pilot/records/) stand in for their college
folder's copy, since CPL Pathways shows the pilot's copy for those programs; the title, award and shape come from the
folder's copy, or, for a pilot program the folder lacks, the award from cpl_pathways_roep_data.js and the shape from
the award's words (Noncredit, Certificate, Degree). A record's course set is every course
code in its blocks, alternatives included, through file_code (the one rewrite of a stored code), upper case, spaces
collapsed.

WHICH RECORD IS WHICH. The record's shape decides: "certificate" is a certificate; "degree" and "adt" are associate
degrees, except a degree whose award reads Baccalaureate, which is a bachelor's; "noncredit" and "other" take no link.

THE THREE LINKS.
  contains    Same college. Every course code of a certificate with at least 3 codes appears in a degree's set.
  mostly      Same college. At least 80% of such a certificate's codes appear in a degree's set, short of all;
              shared and of give the counts.
  same_field  Same college. An associate degree and an active bachelor's in the COCI program export
              (tmc/source_data/coci_program_export_2026-06-17.csv) whose program CIP codes agree on the first 4 digits.
              Sam ruled a PROGRAM's CIP reliable (2026-09-25). TOP codes are never read: repo doctrine makes TOP a
              last-in-line signal (docs/kb-notes/methodology-top-is-a-last-in-line-signal.md).
  curated     A hand-built ladder that no file holds yet (CURATED below, each with its source).
A link is written both ways: a certificate's leads_to names the degree, the degree's comes_from names the certificate.

THE EXPORT'S COLLEGES. The export names a college in upper-case short form (CERRITOS, MIRA COSTA). It maps to a
record college through kb/college_short_names.json (short_caps, then its canonical name), then through that file's
normalize(); an export college that maps to no record college takes no link, and main() prints the count.

Each file: {"college", "slug", "programs": {control_number: {"leads_to": [...], "comes_from": [...]}}}, only programs
with a link. An entry: control_number (null for a curated target with none), title, award, kind, and where they
apply shared, of, cip, units ([min, max] from the record), pathway (a CPL Pathways pathway id: the curated ladder's,
or the baccalaureate directory's card), record (true when a catalog record for it is listed), note.
kb/status/program_ladders/index.json maps each college's name to its slug. No clock is read, so the same inputs
write the same bytes.

Usage: python3 kb/_build_program_ladders.py            (write every file)
       python3 kb/_build_program_ladders.py --check    (fail if a committed file is stale or missing)
"""
import csv
import glob
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)

from _program_requirements_score import places_none  # noqa: E402  (the skip rule _build_roep_display.py applies)
from _program_requirements_college import file_code  # noqa: E402  (the one rewrite of a stored code)
from _seed_college_short_names import normalize  # noqa: E402  (the one college-name fold)

COLLEGE_RECORDS = os.path.join("kb", "program_requirements_college")
PILOT_RECORDS = os.path.join("kb", "program_requirements_pilot", "records")
EXPORT = os.path.join("tmc", "source_data", "coci_program_export_2026-06-17.csv")
SHORT_NAMES = os.path.join("kb", "college_short_names.json")
BACC = "cpl_baccalaureates_data.js"
PILOT_DISPLAY = "cpl_pathways_roep_data.js"
OUT_DIR = os.path.join("kb", "status", "program_ladders")
MIN_CODES = 3
MOSTLY = 0.8

# Hand-built ladders no file holds yet. Source: cpl_pathways_data.js, the Cerritos ironworker ladder
# (id "cerritos-ironworker-ladder"), whose "bachelor" step opens the pathway "cerritos-field-ironworker-bs";
# Sam, 2026-11-27, asked for the B.S. the A.S. (42158) feeds into.
CURATED = [
    {"college": "Cerritos College", "from": "42158",
     "to": {"control_number": None, "title": "B.S., Field Ironworker Supervisor", "award": "Baccalaureate of Science",
            "pathway": "cerritos-field-ironworker-bs", "note": "First cohort Spring 2027"}},
]

# The export's spellings the short-name file and normalize() do not fold (measured 2026-11-27: "L.A." is spelled
# out below, and these two read in another order or form).
EXPORT_SPELLING = {"L.A. TRADE-TECH": "Los Angeles Trade Technical", "SAN FRANCISCO CITY": "City of San Francisco",
                   "EAST L.A.": "East Los Angeles", "WEST L.A.": "West Los Angeles"}

KIND_ORDER ={"curated": 0, "contains": 1, "mostly": 2, "same_field": 3}


def code_key(code):
    return re.sub(r"\s+", " ", str(file_code(code) or "").strip().upper())


def course_set(record):
    out = set()
    for b in (record or {}).get("blocks") or []:
        for c in b.get("courses") or []:
            for x in [c] + list(c.get("alternatives") or []):
                k = code_key(x.get("code")) if isinstance(x, dict) else ""
                if k:
                    out.add(k)
    return out


def level(shape, award):
    if shape == "certificate":
        return "certificate"
    if shape in ("degree", "adt"):
        return "bachelor" if re.match(r"\s*baccalaureate", str(award or ""), re.I) else "associate"
    return None


def shape_from_award(award):
    a = str(award or "")
    if re.search(r"noncredit", a, re.I):
        return "noncredit"
    if re.search(r"certificate", a, re.I):
        return "certificate"
    if re.search(r"degree|baccalaureate", a, re.I):
        return "degree"
    return "other"


def read_pilot_awards(root):
    path = os.path.join(root, PILOT_DISPLAY)
    if not os.path.exists(path):
        return {}
    src = open(path, encoding="utf-8").read()
    d = json.loads(src[src.index("{"):src.rindex("}") + 1])
    return {(p.get("college"), str(p.get("control_number"))): str(p.get("award") or "") for p in d.get("programs") or []}


def usable(filed):
    return filed and not filed.get("error") and filed.get("record") and not places_none(filed.get("score"))


def units_of(record):
    t = ((record or {}).get("program") or {}).get("total_units") or {}
    lo, hi = t.get("min"), t.get("max")
    if lo is None and hi is None:
        return None
    lo = hi if lo is None else lo
    hi = lo if hi is None else hi
    return [int(v) if float(v).is_integer() else v for v in (lo, hi)]


def read_records(root):
    """{slug: {"college": name, "programs": {control: program}}}; a program: title, award, level, codes, units."""
    colleges, slug_of = {}, {}
    for cap in sorted(glob.glob(os.path.join(root, COLLEGE_RECORDS, "*", "capture.json"))):
        folder = os.path.dirname(cap)
        slug = os.path.basename(folder)
        progs, name = {}, None
        for path in sorted(glob.glob(os.path.join(folder, "records", "*.json"))):
            filed = json.load(open(path, encoding="utf-8"))
            name = name or filed.get("college")
            if usable(filed):
                progs[str(filed["control_number"])] = filed
        name = name or json.load(open(cap, encoding="utf-8")).get("college")
        if not name:
            continue
        colleges[slug] = {"college": name, "filed": progs}
        slug_of[name] = slug
    pilot_award = read_pilot_awards(root)
    for path in sorted(glob.glob(os.path.join(root, PILOT_RECORDS, "*.json"))):
        filed = json.load(open(path, encoding="utf-8"))
        slug = slug_of.get(filed.get("college"))
        if not (slug and usable(filed)):
            continue
        ctl = str(filed["control_number"])
        mine = colleges[slug]["filed"].get(ctl) or {}
        # The pilot's record carries its own shape words and no award: the folder's copy names them where it has
        # the program, else the pilot display build's award does (cpl_pathways_roep_data.js).
        award = mine.get("award") or pilot_award.get((filed["college"], ctl)) or ""
        colleges[slug]["filed"][ctl] = dict(filed, award=award, title=mine.get("title") or filed.get("title"),
                                            shape=mine.get("shape") or shape_from_award(award))
    out = {}
    for slug, c in colleges.items():
        progs = {}
        for ctl, f in c["filed"].items():
            progs[ctl] = {"title": str(f.get("title") or "").strip(), "award": str(f.get("award") or "").strip(),
                          "level": level(f.get("shape"), f.get("award")), "codes": course_set(f["record"]),
                          "units": units_of(f["record"])}
        out[slug] = {"college": c["college"], "programs": progs}
    return out


def read_export(root):
    path = os.path.join(root, EXPORT)
    with open(path, encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def cip4(cip):
    m = re.match(r"\s*(\d{2})\.(\d{2})", str(cip or ""))
    return m.group(1) + "." + m.group(2) if m else None


def export_college_map(root, export_names, record_names):
    """{export college: record college name}."""
    by_norm = {}
    for n in record_names:
        by_norm.setdefault(normalize(n), n)
    short = {}
    try:
        d = json.load(open(os.path.join(root, SHORT_NAMES), encoding="utf-8"))
        for k, rows in d.items():
            if k == "_meta" or not isinstance(rows, list):
                continue
            for r in rows:
                short.setdefault(str(r.get("short_caps") or "").strip().upper(), r.get("canonical"))
    except (OSError, ValueError):
        pass
    out = {}
    for e in export_names:
        canon = short.get(e.strip().upper())
        hit = by_norm.get(normalize(canon)) if canon else None
        spelled = EXPORT_SPELLING.get(e.strip().upper(), e)
        out[e] = hit or by_norm.get(normalize(spelled)) or by_norm.get(normalize(spelled.replace("L.A.", "Los Angeles")))
    return out


def read_bacc_ids(root):
    """{(export college, control): directory pathway id} from the baccalaureate directory."""
    path = os.path.join(root, BACC)
    if not os.path.exists(path):
        return {}
    src = open(path, encoding="utf-8").read()
    d = json.loads(src[src.index("{"):src.rindex("}") + 1])
    return {(str(p.get("coci_college") or "").strip(), str(p.get("control") or "").strip()): p["id"]
            for p in d.get("programs") or [] if p.get("id")}


def entry(ctl, p, kind, **extra):
    e = {"control_number": ctl, "title": p["title"], "award": p["award"], "kind": kind}
    e.update({k: v for k, v in extra.items() if v is not None})
    if p.get("units"):
        e["units"] = p["units"]
    return e


def link(ladders, a, a_entry, b, b_entry):
    """a leads to b."""
    ladders.setdefault(a, {"leads_to": [], "comes_from": []})["leads_to"].append(b_entry)
    ladders.setdefault(b, {"leads_to": [], "comes_from": []})["comes_from"].append(a_entry)


def order(items):
    lv = {"certificate": 0, "associate": 1, "bachelor": 2}
    return sorted(items, key=lambda e: (lv.get(e.pop("_level", "associate"), 1), KIND_ORDER.get(e["kind"], 9),
                                        -(e.get("shared") or 0), e["title"].lower(), str(e.get("control_number") or "")))


def build(root=ROOT, records=None, export=None, bacc_ids=None):
    records = read_records(root) if records is None else records
    export = read_export(root) if export is None else export
    bacc_ids = read_bacc_ids(root) if bacc_ids is None else bacc_ids
    stats = {"certificates": 0, "contained": 0, "contains_pairs": 0, "mostly_pairs": 0, "mostly_certs": 0,
             "bachelors_active": 0, "bachelors_mapped": 0, "bachelors_linked": 0, "same_field_pairs": 0,
             "curated": 0, "export_colleges": 0, "export_colleges_mapped": 0}
    ladders = {slug: {} for slug in records}

    for slug, c in records.items():
        progs = c["programs"]
        certs = [(k, p) for k, p in progs.items() if p["level"] == "certificate" and len(p["codes"]) >= MIN_CODES]
        degrees = [(k, p) for k, p in progs.items() if p["level"] in ("associate", "bachelor")]
        stats["certificates"] += sum(1 for p in progs.values() if p["level"] == "certificate")
        for ck, cp in certs:
            inside = mostly = False
            for dk, dp in degrees:
                shared = len(cp["codes"] & dp["codes"])
                of = len(cp["codes"])
                if shared == of:
                    kind, inside = "contains", True
                    stats["contains_pairs"] += 1
                elif shared >= MOSTLY * of:
                    kind, mostly = "mostly", True
                    stats["mostly_pairs"] += 1
                else:
                    continue
                link(ladders[slug], ck, dict(entry(ck, cp, kind, shared=shared, of=of, record=True), _level="certificate"),
                     dk, dict(entry(dk, dp, kind, shared=shared, of=of, record=True), _level=dp["level"]))
            stats["contained"] += inside
            stats["mostly_certs"] += mostly or inside

    # Associate -> bachelor's by program CIP, same college. TOP CODE is never read.
    active = [r for r in export if str(r.get("STATUS") or "").strip().lower() == "active"]
    names = sorted({str(r.get("COLLEGE") or "").strip() for r in active if r.get("COLLEGE")})
    cmap = export_college_map(root, names, [c["college"] for c in records.values()])
    stats["export_colleges"] = len(names)
    stats["export_colleges_mapped"] = sum(1 for n in names if cmap.get(n))
    slug_by_name = {c["college"]: s for s, c in records.items()}
    by_college = {}
    for r in active:
        by_college.setdefault(str(r.get("COLLEGE") or "").strip(), []).append(r)
    for ename in names:
        rows = by_college[ename]
        bachelors = [r for r in rows if re.match(r"\s*baccalaureate", r.get("AWARD") or "", re.I)]
        stats["bachelors_active"] += len(bachelors)
        slug = slug_by_name.get(cmap.get(ename))
        if not slug:
            continue
        stats["bachelors_mapped"] += len(bachelors)
        progs = records[slug]["programs"]
        cip_of = {str(r.get("CONTROL NUMBER") or "").strip(): cip4(r.get("CIP CODE")) for r in rows}
        for b in bachelors:
            bctl, bcip = str(b.get("CONTROL NUMBER") or "").strip(), cip4(b.get("CIP CODE"))
            if not bcip:
                continue
            bp = progs.get(bctl) or {"title": str(b.get("TITLE") or "").strip(),
                                     "award": str(b.get("AWARD") or "").strip(), "units": None}
            hit = False
            for ak, ap in sorted(progs.items()):
                if ap["level"] != "associate" or cip_of.get(ak) != bcip:
                    continue
                hit = True
                stats["same_field_pairs"] += 1
                link(ladders[slug], ak, dict(entry(ak, ap, "same_field", cip=bcip, record=True), _level="associate"),
                     bctl, dict(entry(bctl, bp, "same_field", cip=bcip, pathway=bacc_ids.get((ename, bctl)),
                                      record=bctl in progs), _level="bachelor"))
            stats["bachelors_linked"] += hit

    for cur in CURATED:
        slug = slug_by_name.get(cur["college"])
        src = slug and records[slug]["programs"].get(cur["from"])
        if not src:
            continue
        t = dict(cur["to"])
        e = {"control_number": t.pop("control_number"), "title": t.pop("title"), "award": t.pop("award"),
             "kind": "curated", "_level": "bachelor"}
        e.update(t)
        ladders[slug].setdefault(cur["from"], {"leads_to": [], "comes_from": []})["leads_to"].append(e)
        stats["curated"] += 1

    docs = {}
    for slug in sorted(ladders):
        progs = {}
        for ctl in sorted(ladders[slug]):
            v = ladders[slug][ctl]
            progs[ctl] = {"leads_to": order(v["leads_to"]), "comes_from": order(v["comes_from"])}
        if progs:
            docs[slug] = {"college": records[slug]["college"], "slug": slug, "programs": progs}
    index = {"colleges": {d["college"]: s for s, d in sorted(docs.items())}}
    return docs, index, stats


def dump(doc):
    return json.dumps(doc, ensure_ascii=False, separators=(",", ":"), sort_keys=False) + "\n"


def main(argv):
    docs, index, stats = build()
    files = {os.path.join(OUT_DIR, s + ".json"): dump(d) for s, d in docs.items()}
    files[os.path.join(OUT_DIR, "index.json")] = dump(index)
    out = os.path.join(ROOT, OUT_DIR)
    os.makedirs(out, exist_ok=True)
    stray = sorted(p for p in glob.glob(os.path.join(out, "*.json")) if os.path.relpath(p, ROOT) not in files)
    if "--check" in argv:
        stale = [p for p, t in files.items() if not os.path.exists(os.path.join(ROOT, p))
                 or open(os.path.join(ROOT, p), encoding="utf-8").read() != t]
        stale += [os.path.relpath(p, ROOT) for p in stray]
        if stale:
            print("STALE: %d files under %s (%s). Run python3 kb/_build_program_ladders.py"
                  % (len(stale), OUT_DIR, ", ".join(sorted(stale)[:5])))
            return 1
        print("ok: %d files under %s are current" % (len(files), OUT_DIR))
        return 0
    for p in stray:
        os.remove(p)
    for p, t in files.items():
        with open(os.path.join(ROOT, p), "w", encoding="utf-8") as f:
            f.write(t)
    print("wrote %d files under %s" % (len(files), OUT_DIR))
    print("  certificates %(certificates)d; wholly inside a degree %(contained)d (%(contains_pairs)d pairs); "
          "inside at 80%% or more %(mostly_certs)d (%(mostly_pairs)d pairs short of all)" % stats)
    print("  export colleges %(export_colleges_mapped)d of %(export_colleges)d mapped; active bachelor's "
          "%(bachelors_active)d, %(bachelors_mapped)d at a mapped college, %(bachelors_linked)d linked "
          "(%(same_field_pairs)d associate pairs); curated %(curated)d" % stats)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
