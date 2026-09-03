#!/usr/bin/env python3
"""Authority subject codes for the CSR — item 19 of the 2026-09-03 rulings.

Sam ruled (kb/csr_authority_codes_rulings_2026-09-03.json, rule 19): wherever a
discipline's canonical Common SUBJ differs from the code the authority uses
for the same courses, the CSR tab, the CCR tab and SkyView show a chip with
the verbatim C-ID code. The chip is data plus a display; the canonical code,
its four-letter invariant, the parsers and the fold are untouched.

This script builds that data. It is MEASUREMENT plus RULINGS, no judgment of
its own beyond a small name-home table that is printed in the receipt:

  1. Universe of codes: every C-ID subject code in kb/reference/cid_descriptors.json
     and every CCN subject in kb/reference/ccn_courses.json.
  2. Evidence: kb/promotions.json records, per minted identity, the official
     C-ID / CCN targets its members carry. The identity's discipline (curation
     overlay first, then the catalog) is where that code lives in our corpus.
     Counted per (code, discipline).
  3. Attribution of a code to a discipline, in precedence order:
       ruled    — the rulings file names the code under the discipline
       canonical — a discipline's canonical_subj4 IS the code (the ones already
                   on an authority code)
       dismissed — the item-17 pairs (codes seen on mis-filed rows; Sam:
                   "inference cleanup, not code decisions") never attach
       majority — the discipline carrying most of the code's rows, when it
                   carries at least MAJORITY_FLOOR of them (item 17's own
                   threshold: one to three rows is noise)
       name      — a curated home for a code whose corpus rows are too few or
                   too scattered but whose C-ID name matches one MQ discipline
     A code can attach to more than one discipline (CMUS: Music by ruling,
     Commercial Music by name); a discipline can carry several codes.
  4. Seed fields, per discipline (the rulings file's seed_fields):
       ccn_subject_code   the CCN code attributed to the discipline (or null)
       cid_subject_codes  the C-ID codes attributed to it, chip-first
       canonical_source   ccn | c-id | csr — who owns the canonical code
       authority_chips    what the three displays show: every attributed code
                          that differs from the canonical, as {system, code}
       authority_flag     "proposed" for the 95 csr disciplines (item 18: the
                          CSR code is a proposal until an authority publishes)
       authority_note     one line of provenance
  5. Receipt: kb/reference/authority_subject_codes.json — every code, its
     evidence counts, its attribution(s) and the basis word, so the table is
     reviewable by number and a later ruling is one line.

canonical_source flips by itself when a canonical code changes: THEA reads
csr with a C-ID THTR chip today, and c-id with no chip once the fold lands.
Re-run after any fold (kb/_post_apply_chain.py runs it after csr-seed).

Run from repo root:  python3 kb/_seed_authority_codes.py [--check]
--check computes everything and writes nothing (CI-safe).
"""
from __future__ import annotations

import json
import os
import re
import sys
from collections import Counter, defaultdict
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
SEED = os.path.join(HERE, "discipline_canonical_subj4.json")
RULINGS = os.path.join(HERE, "csr_authority_codes_rulings_2026-09-03.json")
PROMOTIONS = os.path.join(HERE, "promotions.json")
COURSES = os.path.join(HERE, "coci_minted_courses.json")
SINGLETONS = os.path.join(HERE, "coci_minted_singletons.json")
CURATION = os.path.join(HERE, "coci_curation.json")
CID_REF = os.path.join(HERE, "reference", "cid_descriptors.json")
CCN_REF = os.path.join(HERE, "reference", "ccn_courses.json")
OUT_TABLE = os.path.join(HERE, "reference", "authority_subject_codes.json")

SUBJ4_RE = re.compile(r"^[A-Z]{4}$")
OFFICIAL_RE = re.compile(r"^(C-ID|CCN):([A-Z]+(?:-[A-Z]+)?) ")
# Item 17's threshold, in Sam's words on the sheet: "one to three C-ID or CCN
# rows whose machine-inferred discipline is wrong" say nothing about a code.
MAJORITY_FLOOR = 4

# Item 17 (ruled 2026-09-03, "dismissed as inference cleanup"): these codes were
# seen under these disciplines on mis-filed rows. They never attach here.
# (PH, Health) left this set the same day: card 10 of the readings sheet
# (kb/remint_series_readings_rulings_2026-09-03.json) reversed the dismissal for
# that one pair — 30 Health identities align to C-ID PH — so PH attaches to
# Health by majority like any other code.
DISMISSED = {
    ("PH", "Kinesiology"), ("KIN", "Health"),
    ("BIOL", "Interdisciplinary Studies"), ("POLS", "Ethnic Studies"),
    ("COMM", "Humanities"), ("ADS", "Counseling"), ("SWHS", "Counseling"),
    ("ARTS", "Photography"), ("PHYS", "Physical Sciences"),
    ("ASTR", "Physical Sciences"), ("GLST", "Social Science"),
    ("SJS", "Social Science"),
}

# Codes whose corpus rows are too few or too scattered to clear the floor, but
# whose C-ID subject name matches exactly one MQ discipline. Printed in the
# receipt with the evidence so the call is visible; one line to change.
NAME_HOMES = {
    "AFS": (["Ethnic Studies"], "C-ID Africana Studies (one of Ethnic Studies' four codes)"),
    "AG-EH": (["Ornamental Horticulture"],
              "C-ID Environmental Horticulture — 7 of its 12 corpus rows sit under "
              "Ornamental Horticulture, a discipline the 2026-09-03 sheet did not list "
              "(item 14 reading to confirm)"),
    "AINA": (["Ethnic Studies"], "C-ID American Indian / Native American Studies"),
    "ALTF": (["Automotive Technology"], "C-ID Alternative Fuels"),
    "ASAM": (["Ethnic Studies"], "C-ID Asian American Studies"),
    "CHS": (["Ethnic Studies", "Chicano Studies"], "C-ID Chicana and Chicano Studies"),
    "CMUS": (["Commercial Music"], "C-ID Commercial Music"),
    "DENA": (["Dental Technology"], "C-ID Dental Assisting"),
    "DMGR": (["Multimedia"], "C-ID Digital Media / Graphics"),
    "EET": (["Electronics"], "C-ID Electronics and Electrical Technology"),
    "EMS": (["Emergency Medical Technologies"], "C-ID Emergency Medical Services"),
    "STAT": (["Mathematics"], "CCN Statistics (AB 1111) — the second CCN code under Mathematics"),
    "WWTR": (["Environmental Technologies"], "C-ID Water and Wastewater Technology"),
}
# Left unhomed on purpose, listed in the receipt: ADS (no Addiction MQ discipline
# in the seed; Counseling dismissed by item 17), SWHS (no Social Work MQ
# discipline; Counseling dismissed), ENVS and MIS (scattered), GLST and SJS
# (Social Science dismissed), PH (Health dismissed by item 17 although the
# promotions evidence carries 30 rows there — a reading for Sam).
# Rulings whose `to` describes an umbrella: every ruled code is a discipline-
# level chip (one family each), not just the first.
UMBRELLA_RULED = {"Agriculture", "Agricultural Production", "Foreign Languages"}


def _load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def code_universe():
    """[(system, code)] for every authority subject code we know of."""
    universe = set()
    for d in _load(CID_REF).get("descriptors", []):
        m = re.match(r"^([A-Z]+(?:-[A-Z]+)?)\s", (d.get("descriptor") or "").strip())
        if m:
            universe.add(("c-id", m.group(1)))
    for c in _load(CCN_REF).get("courses", []):
        s = (c.get("subject") or "").strip()
        if s:
            universe.add(("ccn", s))   # ARTH is both a C-ID and a CCN code: two rows
    return sorted(universe)


def evidence(courses, singletons, curations):
    """(system, code) -> Counter(discipline) from the promotions manifest."""
    def disc_of(cid):
        rec = courses.get(cid) or singletons.get(cid) or {}
        return (curations.get(cid) or {}).get("discipline") or rec.get("discipline") or ""
    ev = defaultdict(Counter)
    body = _load(PROMOTIONS)
    body = body.get("promotions") or body
    for cid, v in body.items():
        if not isinstance(v, dict):
            continue
        d = disc_of(cid)
        for target in (v.get("official_targets") or {}):
            m = OFFICIAL_RE.match(target)
            if not m:
                continue
            system = "c-id" if m.group(1) == "C-ID" else "ccn"
            ev[(system, m.group(2))][d or "(blank)"] += 1
    return ev


def ruled_attributions(rulings, disciplines):
    """(system, code) -> {discipline: chip_primary(bool)} from the rulings file.

    The rulings file lists, per changed discipline, the authority codes under
    it. The first C-ID code named is the discipline-level chip (Sam: "one chip
    per discipline to start"); the rest attach at identity level later. A
    discipline the rulings name with `also` (Media Production, Health
    Information Technology) is read the same way."""
    out = defaultdict(dict)

    def names(label):
        # "Agriculture (+ Agricultural Production)" names two seed keys.
        parts = re.split(r"\s*\(\+\s*|\s*\)\s*|\s+/\s+", label or "")
        return [p.strip() for p in parts if p.strip() in disciplines]

    def take(entry, inherited=None):
        auth = entry.get("authority") or inherited or {}
        for disc in names(entry.get("discipline")):
            umbrella = disc in UMBRELLA_RULED
            for i, code in enumerate(auth.get("c-id") or []):
                out[("c-id", code)][disc] = umbrella or (i == 0)
            if auth.get("ccn"):
                out[("ccn", auth["ccn"])][disc] = True

    for change in rulings.get("changes", []):
        take(change)
        if change.get("also"):     # Media Production shares Film's authority
            take(change["also"], change.get("authority"))
    return out


def attribute(universe, ev, rulings, disciplines):
    """Return {(system, code): [ {discipline, basis, rows} ... ]}."""
    ruled = ruled_attributions(rulings, disciplines)
    canonical_of = {d: (e.get("canonical_subj4") or "") for d, e in disciplines.items()}
    by_canonical = defaultdict(list)
    for d, c in canonical_of.items():
        if c:
            by_canonical[c].append(d)

    table = {}
    for system, code in universe:
        key = (system, code)
        counts = ev.get(key, Counter())
        rows = []
        seen = set()

        def add(disc, basis, primary=True):
            if disc in seen or disc not in disciplines:
                return
            seen.add(disc)
            rows.append({"discipline": disc, "basis": basis,
                         "rows": int(counts.get(disc, 0)),
                         "chip": code != canonical_of.get(disc, ""),
                         "chip_primary": bool(primary)})

        # A code with a RULED home attaches there and nowhere else; a code that
        # IS some discipline's canonical attaches there and nowhere else — its
        # rows under another discipline are the item-17 class (mis-filed rows,
        # discipline-inference cleanup), not a second home. Only a code with
        # neither goes to the majority discipline, above the floor.
        if ruled.get(key):
            for disc, primary in ruled[key].items():
                add(disc, "ruled", primary)
        elif by_canonical.get(code):
            for disc in by_canonical[code]:
                add(disc, "canonical")
        elif counts:
            top, n = counts.most_common(1)[0]
            if (top != "(blank)" and n >= MAJORITY_FLOOR
                    and (code, top) not in DISMISSED):
                add(top, "majority")
        for disc in NAME_HOMES.get(code, ([], None))[0]:
            add(disc, "name")
        dismissed = sorted(d for (c, d) in DISMISSED if c == code and counts.get(d))
        table[key] = {
            "system": system, "code": code,
            "evidence": dict(counts.most_common()),
            "attributed": rows,
            "dismissed": [{"discipline": d, "rows": counts[d]} for d in dismissed],
            "name_home_reason": NAME_HOMES.get(code, (None, None))[1],
        }
    return table


def fold_into_seed(seed, table):
    """Write the per-discipline fields. Returns a per-discipline summary."""
    disciplines = seed["disciplines"]
    per = defaultdict(lambda: {"ccn": [], "cid": [], "chip_primary": []})
    for (system, code), rec in table.items():
        for a in rec["attributed"]:
            slot = per[a["discipline"]]
            (slot["ccn"] if system == "ccn" else slot["cid"]).append(code)
            if a.get("chip_primary"):
                slot["chip_primary"].append(code)
    # Sam: "one chip per discipline to start and per identity once members are
    # classified" — the discipline-level chip is the ruled primary (or every
    # code when none was ruled); ACCT and BSOT under Business, LPPS under
    # Administration of Justice, CMUS under Music wait for identity-level chips.
    summary = Counter()
    for d, e in disciplines.items():
        canon = e.get("canonical_subj4") or ""
        slot = per.get(d, {"ccn": [], "cid": [], "chip_primary": []})
        ccn_codes = slot["ccn"]
        # The CCN code the canonical follows (rule 2: CCN first). If several
        # CCN codes sit under one discipline (Mathematics: MATH and STAT), the
        # one equal to the canonical is THE code; the others are chips.
        ccn_code = canon if canon in ccn_codes else (ccn_codes[0] if ccn_codes else None)
        # Chip order: the ruled primary first, then the rest by evidence.
        cid_codes = sorted(slot["cid"], key=lambda c: (c not in slot["chip_primary"],
                                                       -table[("c-id", c)]["evidence"].get(d, 0), c))
        if ccn_code and canon == ccn_code:
            source = "ccn"
        elif canon and canon in cid_codes:
            source = "c-id"
        else:
            source = "csr" if canon else None
        primary = slot["chip_primary"]
        chips, shown = [], set()
        for system, codes in (("CCN", ccn_codes), ("C-ID", cid_codes)):
            for c in codes:
                # A code both authorities publish (CDEV) is one chip, CCN first.
                if c == canon or c in shown:
                    continue
                if system == "C-ID" and primary and c not in primary:
                    continue
                chips.append({"system": system, "code": c})
                shown.add(c)
        e["ccn_subject_code"] = ccn_code
        e["cid_subject_codes"] = cid_codes
        e["canonical_source"] = source
        e["authority_chips"] = chips
        e["authority_flag"] = "proposed" if source == "csr" else None
        if source == "ccn":
            note = f"Common SUBJ {canon} is the CCN subject code (rule 2: CCN first)."
        elif source == "c-id":
            note = f"Common SUBJ {canon} is the C-ID subject code."
        elif source == "csr" and chips:
            note = (f"Common SUBJ {canon} is the CSR's four-letter code; the authority says "
                    + ", ".join(f"{c['system']} {c['code']}" for c in chips)
                    + " (rule 3: four letters, verbatim code on the chip).")
        elif source == "csr":
            note = (f"Common SUBJ {canon} is proposed by the CSR; no C-ID or CCN code "
                    "names this discipline's courses yet (item 18).")
        else:
            note = "No canonical code picked yet."
        e["authority_note"] = note
        summary[source or "none"] += 1
        summary["with_chips"] += bool(chips)
    seed["_authority_codes"] = {
        "_about": ("Item 19 of kb/csr_authority_codes_rulings_2026-09-03.json: per discipline, "
                   "the CCN / C-ID subject codes attributed from kb/promotions.json evidence "
                   "plus the rulings; canonical_source says who owns the canonical code; "
                   "authority_chips is what the CSR, CCR and SkyView show. Rebuilt by "
                   "kb/_seed_authority_codes.py; the attribution table with its evidence is "
                   "kb/reference/authority_subject_codes.json."),
        "_built_at": date.today().isoformat(),
        "counts": {"ccn": summary["ccn"], "c-id": summary["c-id"], "csr": summary["csr"],
                   "no_canonical": summary["none"], "with_chips": summary["with_chips"]},
    }
    return summary


def main(argv=None):
    argv = list(sys.argv[1:] if argv is None else argv)
    check = "--check" in argv
    seed = _load(SEED)
    disciplines = seed.get("disciplines") or {}
    rulings = _load(RULINGS)
    courses = _load(COURSES)["courses"]
    singletons = _load(SINGLETONS)["courses"]
    curations = _load(CURATION).get("curations") or {}

    universe = code_universe()
    ev = evidence(courses, singletons, curations)
    table = attribute(universe, ev, rulings, disciplines)
    summary = fold_into_seed(seed, table)

    unhomed = [f"{s} {c}" for (s, c), r in table.items() if not r["attributed"]]
    receipt = {
        "_about": ("Every C-ID / CCN subject code in kb/reference, the disciplines its rows "
                   "sit under in kb/promotions.json (evidence), and where it is attributed "
                   "(basis: ruled | canonical | majority | name); dismissed pairs are item 17 "
                   "of the 2026-09-03 rulings. Built by kb/_seed_authority_codes.py."),
        "_built_at": date.today().isoformat(),
        "_rules": {"majority_floor": MAJORITY_FLOOR,
                   "dismissed_pairs": sorted(f"{c} under {d}" for c, d in DISMISSED),
                   "name_homes": {c: v[0] for c, v in NAME_HOMES.items()},
                   "umbrella_ruled": sorted(UMBRELLA_RULED)},
        "counts": {"codes": len(table),
                   "attributed": sum(1 for r in table.values() if r["attributed"]),
                   "unhomed": len(unhomed)},
        "unhomed": unhomed,
        "codes": {f"{s} {c}": r for (s, c), r in sorted(table.items())},
    }
    print(f"[seed_authority_codes] {len(table)} codes; "
          f"{receipt['counts']['attributed']} attributed, {len(unhomed)} unhomed "
          f"({', '.join(unhomed) or 'none'})")
    print(f"  disciplines: ccn {summary['ccn']} · c-id {summary['c-id']} · csr {summary['csr']} "
          f"· no canonical {summary['none']} · with chips {summary['with_chips']}")
    if check:
        print("  --check: nothing written")
        return 0
    with open(OUT_TABLE, "w", encoding="utf-8") as f:
        json.dump(receipt, f, indent=2, ensure_ascii=False)
        f.write("\n")
    with open(SEED, "w", encoding="utf-8") as f:
        json.dump(seed, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"  wrote {os.path.relpath(OUT_TABLE, os.path.dirname(HERE))} and the seed fields")
    return 0


if __name__ == "__main__":
    sys.exit(main())
