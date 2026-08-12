#!/usr/bin/env python3
"""Build the ONE college/district identity crosswalk.

WHY THIS EXISTS
---------------
Three systems name California's community colleges, and until now none of them
knew about the others:

  1. MAP            -- Supabase `map_colleges`: college_id (authoritative for
                       everything CPL measures) + college_name, Title Case.
                       Its `variants` column exists and is EMPTY on all 128 rows.
  2. This repo      -- `kb/college_short_names.json`: canonical / aliases /
                       short / short_caps, curator-owned, NO id of any kind.
  3. CCCCO MIS      -- `kb/reference/mis_district_college_codes.json`
                       (Appendix A of the MIS Data Element Dictionary, supplied
                       by Sam): district_code + college_code, ALL CAPS names,
                       and the ONLY authoritative DISTRICT structure we hold.

Measured 2026-08-12: 24 of 116 colleges are spelled differently between (1) and
(2) -- including `Mt. San Antonio College` vs `Mt San Antonio College`, which is
the mismatch Sam kept hitting. And MIS names are abbreviated so hard
(`LA SWEST`, `DESERT`, `SAN FRANCISCO`) that only 80 of 116 join to MAP on a
normalised name.

`mis_district_college_codes.json` says it plainly in its own `_warning`:

    "the join is by NAME and should be done ONCE, curated, with non-matches
     reported rather than fuzzy-matched."

This script is that once. It emits a crosswalk keyed on MAP's college_id, plus
a receipt naming every row a human still has to decide.

WHAT IT DOES NOT DO
-------------------
It does NOT write to Supabase. It emits a proposal. Populating
`map_colleges.variants` changes name resolution for every consumer at once, and
that lands under its own reviewed PR.

Usage:
  python3 kb/_build_college_identity_crosswalk.py            # dry run + receipt
  python3 kb/_build_college_identity_crosswalk.py --map-json path.json
"""
import argparse
import json
import os
import re
import sys
import unicodedata
from collections import defaultdict
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
MIS_PATH = os.path.join(HERE, "reference", "mis_district_college_codes.json")
SHORT_PATH = os.path.join(HERE, "college_short_names.json")
OUT_DIR = os.path.join(HERE, "college_identity")

# ── Known defects in the Appendix A parse (found 2026-08-12) ────────────────
# The PDF text layer carried one district label forward and doubled a college
# name. The CODES are sound -- 971 correctly sits under 970, and every other
# row in the file has a college_code sharing its district_code's first two
# digits -- so only the labels are repaired, never a code.
#
# Detection, not assumption: CONTRA COSTA CCD is the ONLY district name in the
# file mapping to two different district_codes. That is what gave it away, and
# `verify_source()` below re-checks the property so a future re-parse that
# fixes it upstream makes this patch a no-op rather than a silent overwrite.
MIS_PATCHES = {
    # (district_code, college_code): {field: corrected value}
    ("970", "971"): {
        "district": "COPPER MOUNTAIN CCD",
        "college": "COPPER MOUNTAIN",
        "_repaired": "district label carried over from the previous row; "
                     "college name doubled by the PDF parse",
    },
    ("470", "471"): {
        "college": "EVERGREEN VALLEY",
        "_repaired": "spelling: source read EVERYGREEN VALLEY",
    },
}

# ── Curated MIS -> MAP name bridges ────────────────────────────────────────
# MIS abbreviates aggressively and inconsistently. Every entry here was read
# against the district it sits in, because the abbreviation alone is ambiguous
# (`MARIN` is College of Marin; `SAN FRANCISCO` is City College of San
# Francisco). Keyed by (district_code, college_code) -- NOT by name -- so a
# later name repair upstream cannot silently re-point a bridge.
#
# ⚠ `LA SWEST` is the string that broke cplCollegeShort() on 2026-08-11: the
# resolver emitted it and then could not resolve its own output. It comes from
# here.
MIS_TO_MAP = {
    ("480", "482"): "Chabot College",
    ("970", "971"): "Copper Mountain College",
    ("930", "931"): "College of the Desert",
    ("030", "031"): "Imperial Valley College",
    ("840", "841"): "Long Beach City College",
    ("740", "741"): "Los Angeles City College",
    ("740", "742"): "Los Angeles Harbor College",
    ("740", "743"): "Los Angeles Mission College",
    ("740", "744"): "Los Angeles Pierce College",
    ("740", "745"): "Los Angeles Southwest College",
    ("740", "746"): "Los Angeles Trade Technical College",
    ("740", "747"): "Los Angeles Valley College",
    ("740", "748"): "East Los Angeles College",
    ("740", "749"): "West Los Angeles College",
    ("330", "334"): "College of Marin",
    ("460", "461"): "Monterey Peninsula College",
    ("240", "241"): "Napa Valley College",
    ("770", "771"): "Pasadena City College",
    ("340", "341"): "College of Alameda",
    ("160", "161"): "College of the Redwoods",
    ("960", "961"): "Riverside City College",
    ("980", "982"): "San Bernardino Valley College",
    ("360", "361"): "City College of San Francisco",
    ("470", "471"): "Evergreen Valley College",
    # Renamed since Appendix A was published — the college is the same entity,
    # MAP simply carries the current name. Verified against the district each
    # sits in, not the name alone.
    ("580", "581"): "Coalinga College",            # was West Hills College Coalinga
    ("580", "582"): "Lemoore College",             # was West Hills College Lemoore
    ("890", "892"): "Irvine Valley College",       # MIS: IRVINE
    ("590", "592"): "Modesto Junior College",      # MIS: MODESTO
    ("650", "651"): "Santa Barbara City College",  # MIS: SANTA BARBARA
    ("260", "261"): "Santa Rosa Junior College",   # MIS: SANTA ROSA (Sonoma CCD)
}

# Colleges MAP knows that Appendix A genuinely does not carry — verified 2026-08-12
# by searching the file for every plausible spelling, including former names.
# Both post-date the supplied edition (Madera became a college in 2020, formerly
# the Willow International Center; Calbright launched 2018). Recorded so a future
# reader sees a MEASURED ABSENCE rather than assuming the join failed.
KNOWN_ABSENT_FROM_MIS = {
    "Madera College": "not in the supplied Appendix A (searched MADERA, WILLOW); "
                      "State Center CCD holds only Clovis/Fresno City/Reedley there",
    "Calbright College Non-Credit": "not in the supplied Appendix A (searched CALBRIGHT); "
                                    "statewide online college, launched 2018",
}


def norm(s):
    """Fold to a comparison key: strip accents, punctuation, casing, and the
    structural words that differ between namespaces ('College', 'Community',
    'CCD'). Deliberately lossy -- it is a JOIN key, never a display value."""
    s = unicodedata.normalize("NFKD", s or "")
    s = "".join(c for c in s if not unicodedata.combining(c)).lower()
    s = re.sub(r"\b(community college|college|ccd|district|the|of)\b", " ", s)
    return re.sub(r"[^a-z0-9]", "", s)


def verify_source(rows):
    """Re-derive the defects rather than trusting the patch list. Returns the
    findings so the receipt can state whether each patch was still needed."""
    by_name = defaultdict(set)
    for r in rows:
        by_name[r["district"]].add(r["district_code"])
    split = {k: sorted(v) for k, v in by_name.items() if len(v) > 1}
    misfiled = [r for r in rows if r["college_code"][:2] != r["district_code"][:2]]
    doubled = [r for r in rows
               if len(r["college"].split()) >= 4
               and r["college"].split()[: len(r["college"].split()) // 2]
               == r["college"].split()[len(r["college"].split()) // 2:]]
    return {"district_name_split_across_codes": split,
            "college_code_outside_district": misfiled,
            "doubled_college_name": doubled}


def load_mis():
    raw = json.load(open(MIS_PATH, encoding="utf-8"))
    rows = [dict(r) for r in raw["districts"]]
    findings = verify_source(rows)
    applied = []
    for r in rows:
        key = (r["district_code"], r["college_code"])
        if key in MIS_PATCHES:
            patch = dict(MIS_PATCHES[key])
            why = patch.pop("_repaired", "")
            before = {k: r[k] for k in patch}
            if before != patch:
                r.update(patch)
                applied.append({"key": list(key), "before": before,
                                "after": patch, "why": why})
    return raw, rows, findings, applied


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--map-json", default=None,
                    help="JSON array of {college_id, college_name} exported from "
                         "Supabase map_colleges (entity_kind='college'). The "
                         "sandbox cannot reach *.supabase.co, so this is passed in.")
    ap.add_argument("--out", default=None)
    args = ap.parse_args()

    if not args.map_json:
        sys.exit("--map-json is required: export map_colleges via the Supabase MCP "
                 "and pass the file. This script never invents the authority.")

    mis_raw, mis, findings, patched = load_mis()
    short = json.load(open(SHORT_PATH, encoding="utf-8"))["colleges"]
    mapc = json.load(open(args.map_json, encoding="utf-8"))

    # index the repo crosswalk by every name it knows
    repo_by = {}
    for e in short:
        for n in [e["canonical"]] + list(e.get("aliases") or []):
            repo_by.setdefault(norm(n), e)
        for f in ("short", "short_caps"):
            if e.get(f):
                repo_by.setdefault(norm(e[f]), e)

    mis_by_norm = defaultdict(list)
    for m in mis:
        mis_by_norm[norm(m["college"])].append(m)
    mis_by_key = {(m["district_code"], m["college_code"]): m for m in mis}
    curated = {v: k for k, v in MIS_TO_MAP.items()}

    out, unresolved = [], []
    used_mis = set()
    for c in mapc:
        cid, cname = c["college_id"], c["college_name"]
        k = norm(cname)

        m, how = None, None
        if cname in curated and curated[cname] in mis_by_key:
            m, how = mis_by_key[curated[cname]], "curated"
        elif len(mis_by_norm.get(k, [])) == 1:
            m, how = mis_by_norm[k][0], "normalised-name"
        elif len(mis_by_norm.get(k, [])) > 1:
            how = "ambiguous"

        repo = repo_by.get(k)
        # every spelling we have ever seen for this college, deduplicated
        variants = {cname}
        if repo:
            variants.add(repo["canonical"])
            variants.update(repo.get("aliases") or [])
            for f in ("short", "short_caps"):
                if repo.get(f):
                    variants.add(repo[f])
        if m:
            variants.add(m["college"])
            used_mis.add((m["district_code"], m["college_code"]))

        row = {
            "college_id": cid,
            "college_name": cname,
            "variants": sorted(v for v in variants if v and v != cname),
            "short": (repo or {}).get("short"),
            "mis_college_code": (m or {}).get("college_code"),
            "mis_district_code": (m or {}).get("district_code"),
            "district": (m or {}).get("district"),
            "mis_name": (m or {}).get("college"),
            "mis_match": how,
        }
        if not m and cname in KNOWN_ABSENT_FROM_MIS:
            row["mis_match"] = "absent-from-source"
            row["mis_absent_why"] = KNOWN_ABSENT_FROM_MIS[cname]
        out.append(row)
        if not m and cname not in KNOWN_ABSENT_FROM_MIS:
            unresolved.append(row)

    orphans = [m for m in mis
               if (m["district_code"], m["college_code"]) not in used_mis]

    stamp = date.today().isoformat()
    outdir = args.out or os.path.join(OUT_DIR, stamp)
    os.makedirs(outdir, exist_ok=True)

    payload = {
        "_about": "The one college/district identity crosswalk: MAP college_id "
                  "<-> CCCCO MIS district/college codes <-> every spelling any "
                  "of our systems uses. Keyed on MAP college_id, which is "
                  "authoritative for everything CPL measures.",
        "_generated": stamp,
        "_sources": {
            "map_colleges": os.path.basename(args.map_json),
            "mis_appendix_a": "kb/reference/mis_district_college_codes.json",
            "repo_crosswalk": "kb/college_short_names.json",
        },
        "_counts": {
            "colleges": len(out),
            "with_mis_code": sum(1 for r in out if r["mis_college_code"]),
            "curated_bridges": sum(1 for r in out if r["mis_match"] == "curated"),
            "unresolved": len(unresolved),
            "absent_from_source": sum(1 for r in out
                                      if r.get("mis_match") == "absent-from-source"),
            "mis_rows_unused": len(orphans),
            "districts": len({r["mis_district_code"] for r in out
                              if r["mis_district_code"]}),
        },
        "_source_defects_found": {
            k: (v if k == "district_name_split_across_codes"
                else [f"{r['district_code']}/{r['college_code']} {r['college']}"
                      for r in v])
            for k, v in findings.items()
        },
        "_patches_applied": patched,
        "colleges": out,
        "mis_rows_not_matched_to_a_map_college": orphans,
    }
    with open(os.path.join(outdir, "crosswalk.json"), "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)

    lines = [
        f"# College identity crosswalk — dry run {stamp}", "",
        "MAP `college_id` is the key. Nothing here is written to Supabase.", "",
        f"- Colleges: **{len(out)}**",
        f"- Carrying an MIS district/college code: **{payload['_counts']['with_mis_code']}**"
        f" ({payload['_counts']['curated_bridges']} via a curated bridge)",
        f"- Districts reached: **{payload['_counts']['districts']}**",
        f"- Still unresolved: **{len(unresolved)}**",
        f"- MIS rows matching no MAP college: **{len(orphans)}**", "",
        "## Source defects found in Appendix A", "",
    ]
    if patched:
        for p in patched:
            lines.append(f"- `{p['key'][0]}/{p['key'][1]}` — {p['why']}  ")
            lines.append(f"  before `{p['before']}` → after `{p['after']}`")
    else:
        lines.append("- None still present (upstream re-parse appears to have fixed them).")
    absent = [r for r in out if r.get("mis_match") == "absent-from-source"]
    lines += ["", "## Colleges Appendix A does not carry (measured, not a join failure)", ""]
    for r in absent:
        lines.append(f"- **{r['college_name']}** (MAP id {r['college_id']}) — {r['mis_absent_why']}")
    if not absent:
        lines.append("- None.")
    lines += ["", "## Colleges with no MIS code — need a curator", ""]
    if unresolved:
        lines.append("| MAP id | MAP name |")
        lines.append("|---|---|")
        for r in unresolved:
            lines.append(f"| {r['college_id']} | {r['college_name']} |")
    else:
        lines.append("None — every MAP college reached a district.")
    lines += ["", "## MIS rows matching no MAP college", "",
              "Mostly standalone adult/continuing-education SITES, which Sam ruled "
              "worth keeping (they are a funded population). Not defects.", "",
              "| district/college | name | district |", "|---|---|---|"]
    for m in orphans:
        lines.append(f"| {m['district_code']}/{m['college_code']} | {m['college']} | {m['district']} |")
    with open(os.path.join(outdir, "receipt.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")

    print(f"colleges           {len(out)}")
    print(f"  with MIS code    {payload['_counts']['with_mis_code']}"
          f" ({payload['_counts']['curated_bridges']} curated)")
    print(f"  districts        {payload['_counts']['districts']}")
    print(f"  unresolved       {len(unresolved)}")
    print(f"mis rows unused    {len(orphans)}")
    print(f"patches applied    {len(patched)}")
    print(f"-> {outdir}/crosswalk.json + receipt.md")


if __name__ == "__main__":
    main()
