#!/usr/bin/env python3
"""Two cheap-piles lists for S683 (COBIx's brief on #3358, section 2; harvest lane NEXT (0a) and (2)): no run, no write.

1. UNITS RULE A5'S 31 WRONG ANSWERS, BY CAUSE (cpl_memory d-a5-five-rows-stay-applied-s680: A5 runs on nothing
   further until its misses are listed by cause). The self-check in kb/_program_requirements_units_rules.py applies
   A5 to the records whose units check already lands (the held answers) and calls a record wrong when the corrected
   record stops landing. a5_misses() repeats that loop record by record and keeps the keys; the test holds its count
   to self_check()'s own. Each miss takes the first cause below that its record meets:

     baseline_reads_degree      today's arithmetic, run on the record as filed with no page text, reads it against
                                the degree total and cannot close it; the major sum A5 leaves is the held answer.
     baseline_no_longer_lands   the record as filed no longer lands under today's arithmetic, and A5 leaves its sum
                                where it was.
     target_mentions_the_list   A5 also took courses from a list whose name only mentions List X ("List C: any
                                course from List A or List B"); taking List X alone lands the record.
     top_end_counts_a_used_course  A5 let the top end count a course List X's own top pick already uses (the
                                catalog's "not already used"); adding only List X's surplus lands it.
     top_end_takes_a_heavier_course  A5 added a List X course heavier than any of the list's own options, past the
                                list's printed figure; leaving those out lands it.
     other                      none of the above.

   The first two are misses of the self-check, not of A5: A5 leaves the sum the held answer names. The other three
   are A5's own, and narrower() measures a narrower A5 that excludes them (label, surplus, cap below).

2. THE 33 HELD-OUT RECORDS, READ FREE. S681's second reader held 33 of #3502's 54 records
   (kb/program_requirements_reread_plan_s680.json, lanes gap_catalog and gap_no_units) out of #3497's plan because
   the record does not support the label (the S681 receipt's held_out list on claude/cheap-piles-named-gaps-s680).
   VERDICTS gives each one cause, read from the committed record and its notes, and the named gap from
   kb/_program_named_gaps.py's GAPS that describes it truly, or None.

    python3 kb/_program_requirements_cheap_piles_s683.py           # writes kb/program_requirements_cheap_piles_s683.json
    python3 kb/_program_requirements_cheap_piles_s683.py --print   # counts only

Guard: tests/program_requirements_cheap_piles_s683_test.py.
"""
from __future__ import annotations

import collections
import copy
import hashlib
import json
import os
import re
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_requirements_score as S  # noqa: E402
import _program_requirements_units_rules as U  # noqa: E402

ROOT = os.path.dirname(HERE)
OUT = os.path.join(HERE, "program_requirements_cheap_piles_s683.json")
PLAN = os.path.join(HERE, "program_requirements_reread_plan_s680.json")
COLLEGE_DIR = os.path.join(HERE, "program_requirements_college")
LIST = re.compile(r"\blist\s+[A-Z0-9]{1,2}\b", re.I)

A5_CAUSES = {
    "baseline_reads_degree": "today's arithmetic reads the record as filed against the degree total, which it cannot "
                             "close without page text; A5 leaves the major sum at the held answer",
    "baseline_no_longer_lands": "the record as filed no longer lands under today's arithmetic; A5 leaves its sum as it was",
    "target_mentions_the_list": "A5 also took courses from a list whose name only mentions the named list",
    "top_end_counts_a_used_course": "the top end counts a course the named list's own top pick already uses",
    "top_end_takes_a_heavier_course": "A5 added a course heavier than any of the list's own options",
    "other": "none of the causes above",
}
A5_NARROWER = {"target_mentions_the_list": "label", "top_end_counts_a_used_course": "surplus",
               "top_end_takes_a_heavier_course": "cap"}

HELD_CAUSES = {
    "no_units_beside_courses": "the catalog prints list totals and no units beside the courses, so the sum takes the "
                               "state file's units, which do not add to the printed figures",
    "list_figure_disagrees": "a list's printed figure differs from the units the catalog prints beside its own courses",
    "range_couples_lists": "a list printed as a range because a course may be waived, with a later list that depends "
                           "on the path; the record sums each list's top end on its own",
    "prerequisites_outside_total": "the record counts prerequisites that the printed total leaves out",
    "nested_option_read_flat": "an option printed inside a list is recorded as its own requirement",
    "alternate_path_not_recorded": "a list's 'or any course from List A' path is not recorded, so it cannot reach its "
                                   "printed figure",
    "pair_units_counted_twice": "a pair printed with one figure carries it on the first code, and the sum adds the "
                                "second code's units from the state file",
    "requirements_not_in_read": "the read did not include the requirements table",
}
NUP, NONE = "no_units_printed", None
# (college, control_number) -> (cause, the named gap that describes it truly or None, why, from the record's notes)
VERDICTS = {
    ("Bakersfield College", "32783"): ("nested_option_read_flat", NONE,
        "the notes say Statistics (4) likely sits inside List A (6) with 'any course not selected from Core', giving "
        "9 + 6 + 3 = 18; read flat, the lists add to 22"),
    ("Bakersfield College", "43434"): ("alternate_path_not_recorded", NONE,
        "List B also allows any List A course not already used, recorded only in List A, so List B cannot reach its "
        "6-8.5; the page also prints 18-19.5 and 18-20.5 as totals. catalog_figures_differ may fit once List B carries "
        "those courses"),
    ("Cerritos College", "02219"): ("no_units_beside_courses", NUP,
        "the notes say no units are printed beside the A&P courses, a required choice printed 4.0-10.0 as a whole"),
    ("Cerritos College", "33343"): ("no_units_beside_courses", NUP,
        "the notes say no units are printed beside GEOG 115, and the GEOG 101 & 101L pair prints 4.0 for the pair"),
    ("College of the Sequoias", "37744"): ("prerequisites_outside_total", NONE,
        "the notes say the printed 24 covers only the certificate courses and leaves out the 2-8 prerequisite units"),
    ("College of the Sequoias", "45030"): ("no_units_beside_courses", NUP,
        "the notes say the catalog prints no units beside individual courses, ENGL C1000 among them (area 1A's one "
        "course), and Areas 3 and 5 print totals not attached to a sub-area"),
    ("Cuesta College", "14441"): ("list_figure_disagrees", NONE,
        "the notes say the required list prints 28.0-31.0 while its courses sum to 29-32"),
    ("Cuesta College", "32562"): ("range_couples_lists", NONE,
        "the notes say a student with SPAN 201 or 202 through prior learning skips to the next level, so the core "
        "prints 10-20, and List B applies only to students who begin in SPAN 203"),
    ("Cuyamaca College", "21069"): ("pair_units_counted_twice", NONE,
        "the notes say BOT-101A & 101B and BOT-102A & 102B print 3 units per pair, filed on the first code; the state "
        "file's 1.5 for each second code makes 24 into 27"),
    ("Cypress College", "39887"): ("pair_units_counted_twice", NONE,
        "the notes say GEOL 100 C & GEOL 101 C print 4 for the pair, filed on GEOL 100 C; the state file's 1 for "
        "GEOL 101 C makes 41 into 42 (the STAT and ECON rows also print no units)"),
    ("De Anza College", "41861"): ("range_couples_lists", NONE,
        "the notes say KORE D001 may be skipped (core 10-15) and List A takes one course after 15 core units or two "
        "after 10; the record adds the core's 15 to List A's top"),
    ("De Anza College", "41863"): ("range_couples_lists", NONE,
        "the notes say SPAN D001 may be skipped (core 10-15) and List A takes one course after 15 core units or two "
        "after 10; the record adds the core's 15 to List A's top"),
    ("Foothill College", "32281"): ("no_units_beside_courses", NUP,
        "the notes say the catalog prints no units beside individual courses, the core options included; List B's "
        "count also depends on the core option"),
    ("Fullerton College", "08420"): ("list_figure_disagrees", NONE,
        "the notes say the Restricted Electives heading prints 2 units and its units column 6-7, likely a stale "
        "figure; 25 + 2 is the printed 27"),
    ("Grossmont College", "35805"): ("no_units_beside_courses", NONE,
        "the notes say no units are printed beside the courses of Lists A, B and C; every required course carries "
        "units, so no required course lacks them"),
    ("Long Beach City College", "41220"): ("list_figure_disagrees", NONE,
        "the notes say the catalog prints 4 beside CS 11, CS 21 and CS 31 and 3 as the choice's subtotal"),
    ("Long Beach City College", "42970"): ("no_units_beside_courses", NUP,
        "the notes say the catalog prints no units beside BCOM 15, a required course, and its printed total 5 leaves "
        "BCOM 15 out"),
    ("Los Angeles Harbor College", "44271"): ("list_figure_disagrees", NONE,
        "the notes say the required list prints 8-9 while its courses as printed sum to 9-10 (ENGLISH 032 prints 3, "
        "the state file 2)"),
    ("Los Angeles Mission College", "35913"): ("no_units_beside_courses", NUP,
        "the notes say the catalog prints no units beside individual courses, the required core included; List A "
        "also lists the core courses not used"),
    ("Mt. San Antonio College", "38731"): ("no_units_beside_courses", NONE,
        "the notes say units are printed for the required courses and not beside the track electives, which are "
        "choose lists"),
    ("Mt. San Jacinto College", "08690"): ("no_units_beside_courses", NUP,
        "the notes say the requirements list prints no units beside the option courses (the Program Map gives "
        "BIOL-125 4, CHEM-107 5)"),
    ("Mt. San Jacinto College", "43979"): ("prerequisites_outside_total", NONE,
        "the notes say the printed 53 is Semesters One-Four (38) plus the additional requirements (15) and excludes "
        "the 18-19 prerequisite units"),
    ("Napa Valley College", "32409"): ("no_units_beside_courses", NUP,
        "the notes say the catalog prints no units beside individual courses, the required options included; List "
        "B's minimum also depends on the option"),
    ("Palomar College", "10883"): ("list_figure_disagrees", NONE,
        "the notes say the electives' printed 3.5-7.0 does not match three courses of their printed units (the "
        "lowest is 4.0)"),
    ("Pasadena City College", "36777"): ("no_units_beside_courses", NONE,
        "the notes say the catalog prints no units beside individual courses; every list is a choose list, so no "
        "required course lacks units"),
    ("San Bernardino Valley College", "39483"): ("nested_option_read_flat", NONE,
        "the notes say List A ('one to two courses') appears to include the biology sequences, recorded as their own "
        "required option group"),
    ("Santa Ana College", "35673"): ("list_figure_disagrees", NONE,
        "the notes say the printed 22.0-25.0 does not match the listed courses' 24-27"),
    ("Santa Monica College", "33271"): ("no_units_beside_courses", NONE,
        "the 83 movement courses, a choose list, carry no units as read, and the notes say the page prints 20 units "
        "in the heading and 21 in the introduction"),
    ("Santa Rosa Junior College", "45486"): ("pair_units_counted_twice", NONE,
        "the notes say CHEM 3A & 3AL print 5 for the pair, filed on CHEM 3A with CHEM 3AL null"),
    ("Sierra College", "45624"): ("pair_units_counted_twice", NONE,
        "the notes say ESCI 0010 & 0010L print 4 for the pair, filed on ESCI 0010 with ESCI 0010L null; the two "
        "choose lists carry no units as read"),
    ("Ventura College", "39961"): ("prerequisites_outside_total", NONE,
        "the notes say the 17 prerequisite units count apart from the 52-unit major total"),
    ("Ventura College", "44994"): ("requirements_not_in_read", NONE,
        "the notes say the requirements tab was not in the text and the block comes from the overview sentence"),
    ("Victor Valley College", "40161"): ("no_units_beside_courses", NUP,
        "the notes say the catalog prints no units beside individual courses, the required core's four included"),
}


# ── A5 ─────────────────────────────────────────────────────────────────────
def _major(a: dict) -> dict:
    return (a.get("major") or {}) if a.get("against") == "degree" else a


def _units(c: dict):
    return S._num(c.get("units_max")) or S._num(c.get("units"))


def _label_is(name: str, listed: str) -> bool:
    m = LIST.search(name or "")
    return bool(m) and " ".join(m.group(0).lower().split()) == " ".join(listed.lower().split())


def narrower(record: dict, label: bool, surplus: bool, cap: bool) -> dict:
    """A5 with three optional limits: label takes only the list whose own label is the named list; surplus leaves out
    the courses the named list's own top pick uses (all of an "all" list); cap leaves out a course heavier than the
    receiving list's heaviest option. With every limit off it adds what a5_any_course_from adds."""
    out = copy.deepcopy(record)
    blocks = out.get("blocks") or []
    note_text = " ".join(str(n) for n in (out.get("notes") or []))
    for i, b in enumerate(blocks):
        if b.get("rule") not in ("choose_courses", "choose_units"):
            continue
        said = U.ANY_FROM.search(b.get("name") or "")
        if not said and b.get("name"):
            for m in U.ANY_FROM.finditer(note_text):
                if (b.get("name") or "").lower()[:40] in note_text[max(0, m.start() - 120):m.end()].lower():
                    said = m
                    break
        if not said:
            continue
        named = said.group(1)
        have = {U._code_key(c.get("code")) for c in b.get("courses") or []}
        own_max = max([_units(c) or 0 for c in b.get("courses") or []] or [0])
        for j in U._target_blocks(blocks, named, i):
            t = blocks[j]
            if label and named.lower().startswith("list") and not _label_is(t.get("name"), named):
                continue
            cs = list(t.get("courses") or [])
            if surplus:
                if t.get("rule") == "all":
                    cs = []
                elif t.get("rule") == "choose_courses" and t.get("minimum"):
                    top = {id(c) for c in sorted(cs, key=lambda c: -(_units(c) or 0))[:int(t["minimum"])]}
                    cs = [c for c in cs if id(c) not in top]
            for c in cs:
                k = U._code_key(c.get("code"))
                if cap and (_units(c) or 0) > own_max:
                    continue
                if k and k not in have:
                    have.add(k)
                    b.setdefault("courses", []).append(copy.deepcopy(c))
    return out


def _lands_major(record: dict, award) -> bool:
    return U.lands(_major(U.arith(record, award)))


def a5_population():
    """The records the self-check applies A5 to: (path, filed, kind) with kind right, wrong or not_exact."""
    pairs = U.load_files()
    for path, f in pairs:
        a = (f.get("score") or {}).get("arithmetic") or {}
        rec, award = f.get("record") or {}, f.get("award")
        if a.get("status") != "equal" or not U.lands(a) or not (U.self_contained(rec) or U.reproduces(f)):
            continue
        new, notes = U.a5_any_course_from(rec)
        if not notes:
            continue
        if not U.exact(f, new):
            yield path, f, "not_exact", new, notes
            continue
        yield path, f, ("right" if U.lands(U.arith(new, award)) else "wrong"), new, notes


def _digest(paths: list[str]) -> str:
    h = hashlib.sha256()
    for p in sorted(paths):
        with open(p, "rb") as fh:
            h.update(os.path.relpath(p, ROOT).encode() + b"\0" + hashlib.sha256(fh.read()).digest())
    return h.hexdigest()


def a5_cause(f: dict, new: dict) -> str:
    rec, award = f.get("record") or {}, f.get("award")
    held = (f.get("score") or {}).get("arithmetic") or {}
    today = U.arith(rec, award)
    after = U.arith(new, award)
    if not U.lands(today):
        if today.get("against") == "degree" and U._pair(_major(after).get("computed")) == U._pair(held.get("computed")):
            return "baseline_reads_degree"
        if U._pair(_major(after).get("computed")) == U._pair(_major(today).get("computed")):
            return "baseline_no_longer_lands"
    if _lands_major(narrower(rec, True, False, False), award):
        return "target_mentions_the_list"
    if _lands_major(narrower(rec, True, True, False), award):
        return "top_end_counts_a_used_course"
    if _lands_major(narrower(rec, True, False, True), award):
        return "top_end_takes_a_heavier_course"
    return "other"


def a5_misses() -> dict:
    rows, applies, measured = [], [], collections.Counter()
    for path, f, kind, new, notes in a5_population():
        applies.append(path)
        rec, award = f.get("record") or {}, f.get("award")
        if kind in ("right", "wrong"):
            for name, args in (("label", (True, False, False)), ("label_surplus", (True, True, False)),
                               ("label_surplus_cap", (True, True, True))):
                measured[(name, kind, _lands_major(narrower(rec, *args), award))] += 1
        if kind != "wrong":
            continue
        held = f["score"]["arithmetic"]
        after = U.arith(new, award)
        cause = a5_cause(f, new)
        rows.append({"college": f["college"], "control_number": str(f["control_number"]), "award": award,
                     "path": os.path.relpath(path, ROOT),
                     "held_answer": {"computed": held.get("computed"), "stated": held.get("stated"),
                                     "against": held.get("against")},
                     "a5_answered": {"computed": after.get("computed"), "stated": after.get("stated"),
                                     "against": after.get("against"), "status": after.get("status"),
                                     "major_computed": _major(after).get("computed")},
                     "a5_words": [n["words"] for n in notes],
                     "cause": cause})
    by = collections.Counter(r["cause"] for r in rows)
    narrow = {}
    for name in ("label", "label_surplus", "label_surplus_cap"):
        narrow[name] = {"right_still_lands": measured[(name, "right", True)],
                        "right_stops_landing": measured[(name, "right", False)],
                        "wrong_now_lands_on_the_major": measured[(name, "wrong", True)]}
    files = [d for _, d in U.load_files()]
    return {"self_check": U.self_check(files, U.college_ge_totals(files))["A5"],
            "applies": len(applies), "population_digest": _digest(applies),
            "causes": A5_CAUSES, "by_cause": dict(by.most_common()),
            "a narrower A5 excludes": {c: A5_NARROWER[c] for c in by if c in A5_NARROWER},
            "narrower_measured": narrow, "misses": rows}


# ── the 33 ────────────────────────────────────────────────────────────────
def plan_keys() -> dict:
    with open(PLAN, encoding="utf-8") as fh:
        lanes = json.load(fh)["lanes"]["units_unequal"]
    out = {}
    for lane, gap in (("gap_catalog", "catalog_figures_differ"), ("gap_no_units", "no_units_printed")):
        for c in lanes[lane]["colleges"]:
            for it in c["items"]:
                out[(c["college"], str(it["control_number"]))] = (gap, it.get("cause"))
    return out


def record_paths() -> dict:
    out = {}
    for slug in sorted(os.listdir(COLLEGE_DIR)):
        d = os.path.join(COLLEGE_DIR, slug, "records")
        if not os.path.isdir(d):
            continue
        for fn in sorted(os.listdir(d)):
            if fn.endswith(".json"):
                with open(os.path.join(d, fn), encoding="utf-8") as fh:
                    f = json.load(fh)
                out[(f.get("college"), str(f.get("control_number")))] = os.path.join(d, fn)
    return out


def held_out(paths: dict | None = None) -> dict:
    plan, paths = plan_keys(), paths if paths is not None else record_paths()
    rows = []
    for (college, cn), (cause, gap, why) in VERDICTS.items():
        rows.append({"college": college, "control_number": cn, "labeled": plan.get((college, cn), (None,))[0],
                     "path": os.path.relpath(paths[(college, cn)], ROOT) if (college, cn) in paths else None,
                     "cause": cause, "true_gap": gap, "why": why})
    return {"source": "the S681 receipt's held_out list (kb/receipts/program_requirement_records_named_gaps_"
                      "2026-11-18_s681.json on claude/cheap-piles-named-gaps-s680), #3502's records the S681 second "
                      "reader held out of #3497's plan",
            "causes": HELD_CAUSES,
            "by_cause": dict(collections.Counter(r["cause"] for r in rows).most_common()),
            "by_true_gap": dict(collections.Counter(r["true_gap"] or "none" for r in rows).most_common()),
            "records": rows}


def build() -> dict:
    a5, held = a5_misses(), held_out()
    excl = sum(n for c, n in a5["by_cause"].items() if c in A5_NARROWER)
    base = sum(n for c, n in a5["by_cause"].items() if c.startswith("baseline_"))
    fits = len(held["records"]) - held["by_true_gap"].get("none", 0)
    return {"written": time.strftime("%Y-%m-%dT%H:%MZ", time.gmtime()),
            "summary": {
                "a5": ("A5's %d wrong answers of %d applied: %d are misses of the self-check (it reads the record as "
                       "filed against a total it no longer lands; A5 leaves the sum the held answer names), %d are A5's "
                       "own. A narrower A5 (take only the list whose label is the named list, add only that list's "
                       "surplus, add no course heavier than the list's own options) excludes the %d and keeps every "
                       "right answer landing; the %d need a self-check that compares the sum A5 changes."
                       % (len(a5["misses"]), a5["applies"], base, excl, excl, base)),
                "held_out": ("%d of the %d held-out records fit a named gap, all no_units_printed (its matcher is "
                             "off and misses their notes' wording); %d fit none: the record misreads the page or the "
                             "catalog's figures disagree inside one list, which catalog_figures_differ's sentence "
                             "does not cover" % (fits, len(held["records"]), len(held["records"]) - fits)),
                "next": "no table write, no plan SQL: these are lists for a later session"},
            "a5": a5, "held_out": held}


def main(argv=None) -> int:
    argv = sys.argv[1:] if argv is None else argv
    d = build()
    print(json.dumps(d["summary"], indent=1))
    print("a5 by cause:", d["a5"]["by_cause"])
    print("held out by cause:", d["held_out"]["by_cause"], "by gap:", d["held_out"]["by_true_gap"])
    if "--print" not in argv:
        with open(OUT, "w", encoding="utf-8") as fh:
            json.dump(d, fh, ensure_ascii=False, indent=1)
            fh.write("\n")
        print("wrote", os.path.relpath(OUT, ROOT))
    return 0


if __name__ == "__main__":
    sys.exit(main())
