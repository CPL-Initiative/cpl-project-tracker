#!/usr/bin/env python3
"""Seed the college short-name dataset + the on-page resolver.

ONE-SHOT (kept for provenance; re-runnable + idempotent). Produces, from the
curator-provided CollegeName -> CollegeShortName table (MAP@rccd.edu, 2026-06):

  kb/college_short_names.json   -- KB source of truth (records + _meta)
  college_short_names.js        -- on-page artifact: window.CPL_COLLEGE_SHORT
                                   data + window.cplCollegeShort(name, style)
                                   resolver (exact -> normalized fallback).

Why a normalized resolver (not a flat exact-key map): the same campus shows up
under several spellings across the data sources -- funding suffixes
("... Credit" / "... Non-Credit"), "Community College" vs "College", a
`Cañada` / `Canada` / mojibake `CaÃ±ada` trio, and the West Hills ->
Coalinga/Lemoore rename (old + new names both still appear). normalize() folds
those so one short name covers every spelling. Aliases are belt-and-suspenders
+ they drive the coverage assertion.

Run from the repo root:  python3 kb/_seed_college_short_names.py
"""
import json
import os
import re
import sys
from datetime import date

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JSON_OUT = os.path.join(REPO, "kb", "college_short_names.json")
JS_OUT = os.path.join(REPO, "college_short_names.js")

# ---------------------------------------------------------------------------
# 1. The authoritative curator-provided mapping (CollegeName -> SHORT, ALL CAPS)
#    Cleanups applied below: EVERYGREEN->EVERGREEN typo, REEDLEY COLLEGE->REEDLEY
#    (drop stray "COLLEGE"), trailing-space trim.
# ---------------------------------------------------------------------------
RAW = """\
Allan Hancock College\tALLAN HANCOCK
American River College\tAMERICAN RIVER
Antelope Valley College\tANTELOPE VALLEY
Bakersfield College\tBAKERSFIELD
Barstow College\tBARSTOW
Berkeley City College\tBERKELEY CITY
Butte College\tBUTTE
Cabrillo College\tCABRILLO
Calbright College\tCALBRIGHT
Canada College\tCANADA
Cerritos College\tCERRITOS
Cerro Coso Community College\tCERRO COSO
Chabot College\tCHABOT
Chaffey College\tCHAFFEY
Citrus College\tCITRUS
City College Of San Francisco\tSAN FRANCISCO
Clovis Community College\tCLOVIS
Coastline Community College\tCOASTLINE
College of Alameda\tALAMEDA
College Of Marin\tMARIN
College of San Mateo\tSAN MATEO
College Of The Canyons\tCANYONS
College Of The Desert\tDESERT
College Of The Redwoods\tREDWOODS
College Of The Sequoias\tSEQUOIAS
College Of The Siskiyous\tSISKIYOUS
Columbia College\tCOLUMBIA
Compton College\tCOMPTON
Contra Costa College\tCONTRA COSTA
Copper Mountain College\tCOPPER MOUNTAIN
Cosumnes River College\tCOSUMNES RIVER
Crafton Hills College\tCRAFTON HILLS
Cuesta College\tCUESTA
Cuyamaca College\tCUYAMACA
Cypress College\tCYPRESS
De Anza College\tDEANZA
Diablo Valley College\tDIABLO VALLEY
East Los Angeles College\tEAST LA
El Camino College\tEL CAMINO
Evergreen Valley College\tEVERYGREEN VALLEY
Feather River College\tFEATHER RIVER
Folsom Lake College\tFOLSOM LAKE
Foothill College\tFOOTHILL
Fresno City College\tFRESNO CITY
Fullerton College\tFULLERTON
Gavilan College\tGAVILAN
Glendale Community College\tGLENDALE
Golden West College\tGOLDEN WEST
Grossmont College\tGROSSMONT
Hartnell College\tHARTNELL
Imperial Valley College\tIMPERIAL
Irvine Valley College\tIRVINE
Lake Tahoe Community College\tLAKE TAHOE
Laney College\tLANEY
Las Positas College\tLAS POSITAS
Lassen Community College\tLASSEN
Long Beach City College\tLONG BEACH
Los Angeles City College\tLA CITY
Los Angeles Harbor College\tLA HARBOR
Los Angeles Mission College\tLA MISSION
Los Angeles Pierce College\tLA PIERCE
Los Angeles Southwest College\tLA SWEST
Los Angeles Trade Technical College\tLA TRADE
Los Angeles Valley College\tLA VALLEY
Los Medanos College\tLOS MEDANOS
Madera Community College\tMADERA
Mendocino College\tMENDOCINO
Merced College\tMERCED
Merritt College\tMERRITT
Miracosta College\tMIRA COSTA
Mission College\tMISSION
Modesto Junior College\tMODESTO
Monterey Peninsula College\tMONTEREY
Moorpark College\tMOORPARK
Moreno Valley College\tMORENO VALLEY
Mt San Antonio College\tMT SAN ANTONIO
Mt San Jacinto College\tMT. SAN JACINTO
Napa Valley College\tNAPA
Norco College\tNORCO
North Orange Continuing Education\tNORTH ORANGE ADULT
Ohlone College\tOHLONE
Orange Coast College\tORANGE COAST
Oxnard College\tOXNARD
Palo Verde College\tPALO VERDE
Palomar College\tPALOMAR
Pasadena City College\tPASADENA
Porterville College\tPORTERVILLE
Reedley College\tREEDLEY COLLEGE
Rio Hondo College\tRIO HONDO
Riverside City College\tRIVERSIDE
Sacramento City College\tSACRAMENTO CITY
Saddleback College\tSADDLEBACK
San Bernardino Valley College\tSAN BERNARDINO
San Diego City College\tSAN DIEGO CITY
San Diego College of Continuing Education\tSAN DIEGO ADULT
San Diego Mesa College\tSAN DIEGO MESA
San Diego Miramar College\tSAN DIEGO MIRAMAR
San Joaquin Delta College\tSAN JOAQUIN DELTA
San Jose City College\tSAN JOSE CITY
Santa Ana College\tSANTA ANA
Santa Barbara City College\tSANTA BARBARA
Santa Monica College\tSANTA MONICA
Santa Rosa Junior College\tSANTA ROSA
Santiago Canyon College\tSANTIAGO CANYON
Shasta College\tSHASTA
Sierra College\tSIERRA
Skyline College\tSKYLINE
Solano Community College\tSOLANO
Southwestern Community College\tSOUTHWESTERN
Taft College\tTAFT
Ventura College\tVENTURA
Victor Valley College\tVICTOR VALLEY
West Hills College Coalinga\tWEST HILLS COALINGA
West Hills College Lemoore\tWEST HILLS LEMOORE
West Los Angeles College\tWEST LA
West Valley College\tWEST VALLEY
Woodland Community College\tWOODLAND
Yuba College\tYUBA
"""

# CollegeName-level cleanups (typos in the short value).
SHORT_FIXES = {
    "EVERYGREEN VALLEY": "EVERGREEN VALLEY",   # typo
    "REEDLEY COLLEGE": "REEDLEY",              # drop stray "COLLEGE"
}

# Title-case overrides where naive .capitalize() would be wrong.
SPECIAL_TITLE = {
    "EAST LA": "East LA", "LA CITY": "LA City", "LA HARBOR": "LA Harbor",
    "LA MISSION": "LA Mission", "LA PIERCE": "LA Pierce", "LA SWEST": "LA Southwest",
    "LA TRADE": "LA Trade", "LA VALLEY": "LA Valley", "WEST LA": "West LA",
    "DEANZA": "De Anza", "MIRA COSTA": "Mira Costa", "SAN FRANCISCO": "San Francisco",
    "MT SAN ANTONIO": "Mt. San Antonio", "MT. SAN JACINTO": "Mt. San Jacinto",
    "NORTH ORANGE ADULT": "North Orange Adult", "SAN DIEGO ADULT": "San Diego Adult",
    "SAN DIEGO CITY": "San Diego City", "SAN DIEGO MESA": "San Diego Mesa",
    "SAN DIEGO MIRAMAR": "San Diego Miramar", "WEST HILLS COALINGA": "West Hills Coalinga",
    "WEST HILLS LEMOORE": "West Hills Lemoore",
}

# Extra full-name spellings that do NOT normalize-match the curator name and so
# must be aliased explicitly. Keyed by curator CollegeName.
EXTRA_ALIASES = {
    # Chabot's prior short ("Chabot Hayward", renamed 2026-06-11 per Sam) so
    # any data still carrying the old short keeps resolving.
    "Chabot College": ["Chabot Hayward"],
    # West Hills rename: old district-prefixed name + the bare new official name.
    "West Hills College Coalinga": ["Coalinga College", "Coalinga"],
    "West Hills College Lemoore": ["Lemoore College", "Lemoore"],
    # Cañada: proper diacritic, plain ASCII, and the mojibake already in the data.
    "Canada College": ["Cañada College", "CaÃ±ada College"],
}


def clean_short(caps):
    caps = caps.strip()
    return SHORT_FIXES.get(caps, caps)


def to_title(caps):
    if caps in SPECIAL_TITLE:
        return SPECIAL_TITLE[caps]
    return " ".join(w.capitalize() for w in caps.split())


def normalize(s):
    """Fold a college-name string to a match key. MUST mirror the JS normalize()."""
    s = (s or "").strip().lower()
    s = s.replace("Ã±", "n").replace("ñ", "n")  # mojibake + real n-tilde
    s = re.sub(r"[.,'’]", "", s)
    s = s.replace("-", " ")
    s = re.sub(r"\b(non[\s]?credit|noncredit|credit)\b", " ", s)
    s = re.sub(r"\b(community|junior)\b", " ", s)
    s = re.sub(r"\buniversity\b", " ", s)
    s = re.sub(r"\bcollege\b", " ", s)
    s = re.sub(r"\bof the\b", " ", s)
    s = re.sub(r"\bof\b", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def build_records():
    records = []
    for line in RAW.splitlines():
        if not line.strip():
            continue
        canonical, short_raw = line.split("\t", 1)
        canonical = canonical.strip()
        caps = clean_short(short_raw)
        title = to_title(caps)
        aliases = sorted(set([canonical] + EXTRA_ALIASES.get(canonical, [])))
        records.append({
            "canonical": canonical,
            "short": title,
            "short_caps": caps,
            "aliases": aliases,
        })
    records.sort(key=lambda r: r["canonical"].lower())
    return records


def check_collisions(records):
    """No two distinct records may share a normalized key (would over-merge)."""
    seen = {}
    bad = []
    for r in records:
        for nm in [r["canonical"]] + r["aliases"]:
            k = normalize(nm)
            if k in seen and seen[k] != r["canonical"]:
                bad.append((k, seen[k], r["canonical"]))
            seen[k] = r["canonical"]
    return bad


def build_index(records):
    exact, norm = {}, {}
    for r in records:
        for nm in [r["canonical"]] + r["aliases"]:
            exact[nm] = r
            norm[normalize(nm)] = r
    return exact, norm


def resolve(name, records, exact, norm, style="short"):
    r = exact.get(name) or norm.get(normalize(name))
    if not r:
        return None
    return r.get(style) or r["short"]


# ---------------------------------------------------------------------------
# Coverage: pull every chip-name string from the live data + assert it resolves.
# ---------------------------------------------------------------------------
def chip_name_universe():
    names = set()
    # colleges[] from unified_courses_data.js
    p = os.path.join(REPO, "unified_courses_data.js")
    if os.path.exists(p):
        txt = open(p, encoding="utf-8").read()
        m = re.search(r'"colleges"\s*:\s*(\[)', txt)
        if m:
            i = m.end() - 1
            depth = 0
            for j in range(i, len(txt)):
                if txt[j] == "[":
                    depth += 1
                elif txt[j] == "]":
                    depth -= 1
                    if depth == 0:
                        names |= set(json.loads(txt[i:j + 1]))
                        break
    # college name strings from the two big lazy payloads (grep-style, no full parse)
    for fn in ("statewide_data.js", "credential_reference_data.js"):
        fp = os.path.join(REPO, fn)
        if not os.path.exists(fp):
            continue
        blob = open(fp, encoding="utf-8").read()
        for key in ("adopter_names", "potential_names", "potential_colleges"):
            for arr in re.findall(re.escape('"' + key + '"') + r'\s*:\s*(\[[^\]]*\])', blob):
                try:
                    names |= set(json.loads(arr))
                except Exception:
                    pass
    return names


# Entities in the data that are NOT one of the 116 CCC colleges (districts,
# county offices, CSUs, private colleges) -> legitimately have no short name.
def is_noncollege(name):
    n = name.lower()
    return any(t in n for t in (
        "district", "county", "office", "university", "k12", "k-12",
        "high school", "unified", "(ceu)", "consortium",
    ))


def main():
    records = build_records()
    collisions = check_collisions(records)
    if collisions:
        print("FATAL: normalized-key collisions (would over-merge distinct colleges):")
        for k, a, b in collisions:
            print(f"   {k!r}: {a!r} vs {b!r}")
        sys.exit(1)
    exact, norm = build_index(records)

    universe = chip_name_universe()
    misses, noncollege = [], []
    for nm in sorted(universe):
        if resolve(nm, records, exact, norm):
            continue
        (noncollege if is_noncollege(nm) else misses).append(nm)

    print(f"records: {len(records)}")
    print(f"chip-name strings scanned: {len(universe)}")
    print(f"  resolved:        {len(universe) - len(misses) - len(noncollege)}")
    print(f"  non-college (ok):{len(noncollege)}")
    print(f"  UNRESOLVED:      {len(misses)}")
    for nm in misses:
        print("   MISS:", repr(nm))
    if noncollege:
        print("non-college entities (no short expected):")
        for nm in noncollege:
            print("   ~", repr(nm))

    # ---- write KB JSON ----
    meta = {
        "_meta": {
            "description": "College full-name -> short-name lookup for compact "
                           "chips/badges across the CPL dashboard views (CCR / EACR / CER).",
            "source": "Curator-provided mapping (MAP@rccd.edu).",
            "casing": "Both forms stored: 'short' (Title Case, the chip default) "
                      "and 'short_caps' (ALL CAPS, as originally provided).",
            "matching": "Resolve via college_short_names.js cplCollegeShort(name). "
                        "Exact match on canonical/aliases, then a normalize() fallback "
                        "that folds funding suffixes (Credit/Non-Credit), Community/Junior, "
                        "n-tilde + the data's CaÃ±ada mojibake, and punctuation.",
            "notes": [
                "West Hills College Coalinga/Lemoore were renamed to Coalinga College / "
                "Lemoore College; both old + new spellings are aliased to one short.",
                "Cleanups vs the raw input: EVERGREEN VALLEY typo fix, REEDLEY (dropped "
                "stray 'COLLEGE'), trailing-space trim on NAPA.",
                "Calbright + the noncredit Continuing-Ed campuses (North Orange, "
                "San Diego) included; their Credit/Non-Credit variants fold to one short.",
            ],
            "count": len(records),
            "generated": date.today().isoformat(),
            "generator": "kb/_seed_college_short_names.py",
        },
        "colleges": records,
    }
    with open(JSON_OUT, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print("wrote", os.path.relpath(JSON_OUT, REPO))

    write_js(records)
    print("wrote", os.path.relpath(JS_OUT, REPO))


def write_js(records):
    data_json = json.dumps(records, ensure_ascii=False, separators=(",", ":"))
    js = JS_TEMPLATE.replace("__GENERATED__", date.today().isoformat()) \
                    .replace("__COUNT__", str(len(records))) \
                    .replace("__DATA__", data_json)
    with open(JS_OUT, "w", encoding="utf-8") as f:
        f.write(js)


JS_TEMPLATE = r"""/* College short-name resolver -- auto-generated by kb/_seed_college_short_names.py
 * (generated __GENERATED__, __COUNT__ colleges). DO NOT hand-edit: edit the seed
 * script / kb/college_short_names.json and re-run. Source of truth:
 * kb/college_short_names.json (curator-provided, MAP@rccd.edu).
 *
 * window.CPL_COLLEGE_SHORT        -> [{canonical, short, short_caps, aliases}, ...]
 * window.cplCollegeShort(name[,style])
 *      style: "short" (Title Case, default) | "caps" | "full"
 *      Exact match on canonical/aliases, then a normalize() fallback that folds
 *      Credit/Non-Credit suffixes, Community/Junior, n-tilde + the Ca<mojibake>ada
 *      spelling, and punctuation. Returns the original name if unmatched (safe
 *      fallback -- chips never render blank). MUST mirror the Python normalize().
 */
(function () {
  "use strict";
  var RECORDS = __DATA__;
  window.CPL_COLLEGE_SHORT = RECORDS;

  function normalize(s) {
    s = (s == null ? "" : String(s)).trim().toLowerCase();
    s = s.replace(/Ã±/g, "n").replace(/ñ/g, "n");
    s = s.replace(/[.,'’]/g, "");
    s = s.replace(/-/g, " ");
    s = s.replace(/\b(non[\s]?credit|noncredit|credit)\b/g, " ");
    s = s.replace(/\b(community|junior)\b/g, " ");
    s = s.replace(/\buniversity\b/g, " ");
    s = s.replace(/\bcollege\b/g, " ");
    s = s.replace(/\bof the\b/g, " ");
    s = s.replace(/\bof\b/g, " ");
    s = s.replace(/\s+/g, " ").trim();
    return s;
  }

  var EXACT = {}, NORM = {};
  RECORDS.forEach(function (r) {
    var spellings = [r.canonical].concat(r.aliases || []);
    spellings.forEach(function (nm) {
      EXACT[nm] = r;
      NORM[normalize(nm)] = r;
    });
  });

  window.cplCollegeShort = function (name, style) {
    if (name == null || name === "") return name;
    var r = EXACT[name] || NORM[normalize(name)];
    if (!r) return name;                       // safe fallback: original name
    if (style === "full") return r.canonical;
    if (style === "caps") return r.short_caps;
    return r.short;
  };
})();
"""


if __name__ == "__main__":
    main()
