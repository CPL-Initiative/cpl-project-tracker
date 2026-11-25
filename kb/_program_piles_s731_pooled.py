#!/usr/bin/env python3
"""S731, lane 1 (pooled): the pooled reading's next records at four colleges, collected as plan s731p.

S727's plan s727p (kb/_program_piles_s727_pooled.py, #3812) put 11 records to passing under the pooled reading and held
the rest. This plan takes the next of them (the lane's NEXT (4)) at El Camino, Modesto Junior, Cuyamaca and Porterville:
El Camino 02513, 02515 and 02517; Modesto Junior's 8 other s720j holds; Cuyamaca 18635; and the real pools the reading
refused, Porterville 06773 and 30235 and Cuyamaca 18634, 18636 and 18637 (f-porterville-cuyamaca-real-pools-refused-s727).
Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17) stands beside it: a record that still fails is collected
with its gap named and a lower confidence, and a record today's scorer or a cheaper lever passes is never gap-filed
(p-gap-filing-leaves-census-lever-s721).

THE SCORER CHANGE (kb/_program_requirements_score.py, POOLED_S731; a shared reading, so a second reader goes over it
before any apply): four figure shapes the readers wrote and the reading lacked ("at least 18 combined units from Groups
I and II", "choose a minimum of 18 units total", "requires 'a minimum of 18 units'", "a parent group totaling 9
units"), "N combined units from" as words saying the groups complete the total, a list heading's closing count
("LIST A - SELECT THREE") read as the heading beside it, a heading the page marks continued read with the heading
before it, and no run of blocks inside one option group. THE SELF-RECALL (self_recall, over every committed record):
the reading with and without POOLED_S731 differs on 18 records, every one a real pool by hand (S731_FIRES, the hand
answers in kb/_program_pooled_s721.py POOLS_HELD); its verdict moves only the four passes rows below and Porterville
06773 (held), all at these colleges; Grossmont 19608, 19822 and 19824 read their 18 and still fail (the degree adds to 52
against 60), as Cuyamaca's do, and Canada's six and College of Marin 46243 passed already.

THE ROWS (each by its hand reading, from the record's own notes):
  passes      Porterville 30235 (18 over Groups I and II); Modesto Junior 38869 (Elective Courses' 6 over the BUSAD
              list and its continued BIT list) and 43164 (List A's 9 over its two sub-lists); Cuyamaca 18628 (18 over
              Communication and Language Arts; a local A.A. with no degree total, so no fill). Each pass rests on no
              electives fill: its score with an empty text, which refuses every fill, passes.
  option_lists_read_apart   Modesto 06655: three options of a required core and electives each (21, 19, 21), every
              block its own alternative in one option group, so the record reads 9-12 against 19-21.
  pool_figure_not_read      Modesto 08109 (its Career Courses "Total 5" over AG 115 and the CONT. sub-list; with it
              and the Breadth 9 the reading takes, 5 + 9 + 12 + 3 = 29) and 10602 (its Breadth 9 over two differently
              headed lists and its Major Electives 6 "combines" two lists; 5 + 9 + 9 + 6 = 29).

THE HOLDS (HELD, by key, each with its reason; the receipt lists them): El Camino 02513, 02515 and 02517 (a degree
electives fill the page text must check: a free reconcile is the lever) and the census's four (19861, 19866, 38948,
43993: a page read); Cuyamaca 18634, 18635 and 18636 (a Cuyamaca reconcile wording rule on "Complete 60 transferable
units") and 18637 (Grossmont's page); Modesto 06683, 35127 and 42664 (no kind names their gap); Porterville 06773
(its read opens mid-section with no heading, so it keeps s721c's gap: d-porterville-06773-keeps-s721c-gap-s731).

Guards on every row (lessons S720 to S727): on_live_run (the record's run is the run a committed receipt posted to the
live row); own page (p-own-page-guard-reads-read-pages-s727: the pages the records were read from, sources.json's
source.url and each record file's source_url, never capture.json's shared_pages; a shared PDF page is the record's own
only where its heading names the program's award); the live row does not pass already; today's scorer does not pass a
gap row; the load posts it, its image after the write passes with no gap (a passes row) or carries exactly its gap,
and its record is unchanged.

    python3 kb/_program_piles_s731_pooled.py --dry-run     # the self-recall, the outcomes and the plan's counts
    python3 kb/_program_piles_s731_pooled.py --tag s731p   # rewrite the scores, the receipt and the four SQL files

Guard: tests/program_piles_s731_pooled_test.py.
"""
from __future__ import annotations

import argparse
import collections
import contextlib
import copy
import glob
import json
import os
import re
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_named_gaps as NG  # noqa: E402
import _program_piles_s713 as P  # noqa: E402
import _program_piles_s714_ccsf as C  # noqa: E402
import _program_piles_s714_fullerton as F  # noqa: E402
import _program_piles_s721_paloverde as PV  # noqa: E402
import _program_pooled_s721 as W  # noqa: E402
import _program_requirements_reconcile as R  # noqa: E402
import _program_requirements_score as S  # noqa: E402

ROOT = os.path.dirname(HERE)
TAG = "s731p"
RULING = ("S731 (lane 1, pooled): the pooled reading's next records at four colleges "
          "(f-porterville-cuyamaca-real-pools-refused-s727, f-cuyamaca-18635-wording-rule-s727); Sam, 2026-11-17, "
          "sam-collect-with-gaps-2026-11-17; p-gap-filing-leaves-census-lever-s721")
MODESTO, ELC, CUY, POR = ("Modesto Junior College", "El Camino College", "Cuyamaca College", "Porterville College")
LANE = {MODESTO: "modesto_junior", ELC: "el_camino", CUY: "cuyamaca", POR: "porterville"}

# The records the reading reads differently with POOLED_S731 (self_recall), each a real pool by hand: the figure the
# page prints over the lists, as each record's note quotes it. The hand answers live in W.POOLS_HELD.
S731_KEYS = (
    ("Cañada College", "30825"), ("Cañada College", "30834"), ("Cañada College", "32295"),
    ("Cañada College", "32452"), ("Cañada College", "43478"), ("Cañada College", "43537"),
    ("College of Marin", "46243"), (CUY, "18628"), (CUY, "18634"), (CUY, "18636"), (CUY, "18637"),
    ("Grossmont College", "19608"), ("Grossmont College", "19822"), ("Grossmont College", "19824"),
    (MODESTO, "38869"), (MODESTO, "43164"), (POR, "06773"), (POR, "30235"))
S731_FIRES = {k: W.POOLS_HELD[k] for k in S731_KEYS}

# The hand reading of each passes row: the figures the page prints over lists together, and the printed total the
# record then adds to.
REVIEWED = {
    (POR, "30235"): {"pools": (18,), "total": 18},
    (MODESTO, "38869"): {"pools": (6,), "total": 18},
    (MODESTO, "43164"): {"pools": (9,), "total": 18},
    (CUY, "18628"): {"pools": (18,), "total": 18},
}
# The gap rows: the kind, and the words of the record's own note that name it (the note is filed whole as the gap's
# words).
GAP_ROWS = {
    (MODESTO, "06655"): ("option_lists_read_apart", "Each option consists of two blocks"),
    (MODESTO, "08109"): ("pool_figure_not_read", "The 'Total 5' is printed for the whole Agriculture Career Courses"),
    (MODESTO, "10602"): ("pool_figure_not_read", "combines the 6-9 unit 'AGRICULTURE BREADTH COURSES' list"),
}
_ELC_WHY = ("the pool reads its 18, and the pass then rests on a degree electives fill (major 18 and ECC GE 24 against "
            "the printed 60) that the scorer checks against the page text; neither the capture nor this container "
            "holds it (catalog.elcamino.edu refused by the egress proxy). A free El Camino reconcile (extract=0, a page "
            "read under today's scorer) is the cheaper lever, so it is not gap-filed again: it stays collected with "
            "pool_figure_not_read (s720m)")
_ELC_WAVE = ("the census's Next wave at El Camino (extracted, places none of its courses): a page read is the lever, "
             "and the catalog host is refused by this container's egress proxy, so no free reading reaches it here; a "
             "paid read (about $0.26 for the four) is a dispatch, outside this plan")
_CUY_WHY = ("the major reads its 18 under the pooled reading%s, and the degree adds to 52 (18 and Cal-GETC 34) against "
            "the printed 60. The page prints 'Complete 60 transferable units' and no electives line (its note); a "
            "Cuyamaca reconcile step filing that sentence as electives_fill_words, with electives_fill_degree, on a "
            "local degree with no degree_elective_units (as Grossmont's 'Complete transferable units as needed to "
            "reach 60' reads) is the cheaper lever, and it reads the page text, which this container cannot reach: "
            "not gap-filed (p-gap-filing-leaves-census-lever-s721), held for that step and a free reconcile")
HELD = {
    (ELC, "02513"): _ELC_WHY, (ELC, "02515"): _ELC_WHY, (ELC, "02517"): _ELC_WHY,
    (ELC, "19861"): _ELC_WAVE, (ELC, "19866"): _ELC_WAVE, (ELC, "38948"): _ELC_WAVE, (ELC, "43993"): _ELC_WAVE,
    (CUY, "18635"): _CUY_WHY % "",
    (CUY, "18634"): _CUY_WHY % " (S731's 'choose a minimum of 18 units total')",
    (CUY, "18636"): _CUY_WHY % " (S731's \"requires 'a minimum of 18 units'\")",
    (CUY, "18637"): ("the reading takes its 18, and the record was read from Grossmont College's page (its note: the "
                     "source address is catalog.gcccd.edu/grossmont, its course list Grossmont's, coverage 64 of 92), "
                     "with no units printed beside any course: it is not the program's own page"),
    (POR, "06773"): ("the reading takes its 18 over Groups I and II, but its read opens mid-section on page 81 and "
                     "the program's heading is not in the text (its note), so the list is this program's by its title "
                     "alone: it does not flip to passing, and it keeps the pool_figure_not_read s721c filed "
                     "(the conductor, d-porterville-06773-keeps-s721c-gap-s731)"),
    (MODESTO, "06683"): ("its printed 75.5-77.5 includes a 15-unit general education block (MJC areas 1B, 2, 3, 6 and "
                         "7) the record leaves out (its note); with ge_units 15 the scorer's ge_included adds it to "
                         "exactly the printed total, a reconcile fill from the page's own words; no gap kind names it"),
    (MODESTO, "35127"): ("the page lays out two paths (non-native and native or heritage learners) that the eLumen "
                         "structure does not encode (its note: 'reviewer should check'); its 23 is the range's top. No "
                         "kind names a range over two learner paths (entry_path_range names a licensed entry), so it is "
                         "held for a reviewed reading"),
    (MODESTO, "42664"): ("its arithmetic is equal (30-35); its invented check fails on COMM 130 and PSYCH 121, catalog "
                         "additions the closed list lacks, which no unit gap names and no pool reading moves"),
}


@contextlib.contextmanager
def lane():
    """s721p's helpers (load, _path, posted_runs) key a college by W.LANE; these four join it for the call only."""
    saved = dict(W.LANE)
    W.LANE.update(LANE)
    try:
        yield
    finally:
        W.LANE.clear()
        W.LANE.update(saved)


def load(key: tuple) -> dict | None:
    with lane():
        return W.load(*key)


def path_of(key: tuple) -> str:
    with lane():
        return W._path(*key)


# ── the rescore ───────────────────────────────────────────────────────────
def fresh(filed: dict, text: str | None) -> dict:
    """The record scored against its own state list, renumbers and aliases, with this text ("" names no electives, so
    the scorer refuses every fill; None is the rescore's no-text reading)."""
    college = filed.get("college")
    return S.score(filed.get("record") or {}, C.closed_list(college, filed.get("control_number")), text,
                   filed.get("award"), R.prefix_aliases(college, year=filed.get("catalog_year")),
                   R.packed_codes(college))


def arithmetic(filed: dict) -> dict:
    """{off: every pooled reading off, no fill; on: the reading on, no fill; on_none: the reading on, the rescore's
    no-text reading}, each under the rescore's current verdicts (W.current)."""
    saved = S.POOLED_ON
    S.POOLED_ON = False
    try:
        off = W.current(filed, fresh(filed, "")["arithmetic"])
    finally:
        S.POOLED_ON = saved
    return {"off": off, "on": W.current(filed, fresh(filed, "")["arithmetic"]),
            "on_none": W.current(filed, fresh(filed, None)["arithmetic"])}


def scorer_passes(filed: dict) -> bool:
    """Today's scorer passes the record whole with no fill (an empty text names none): arithmetic, coverage and
    invented as filed."""
    a = arithmetic(filed)["on"]
    return W.verdict(filed, a)


# ── the own-page guard (p-own-page-guard-reads-read-pages-s727) ───────────
_READ: dict = {}


def read_pages(college: str) -> dict:
    """{control number: {read page urls}}: sources.json's source.url and each record file's source_url."""
    if college in _READ:
        return _READ[college]
    d = os.path.join(NG.COLLEGE_DIR, LANE[college])
    out: dict = collections.defaultdict(set)
    with open(os.path.join(d, "sources.json"), encoding="utf-8") as fh:
        for e in json.load(fh):
            u = (e.get("source") or {}).get("url") if isinstance(e.get("source"), dict) else None
            if u:
                out[str(e.get("control_number"))].add(u)
    for p in glob.glob(os.path.join(d, "records", "*.json")):
        try:
            with open(p, encoding="utf-8") as fh:
                f = json.load(fh)
        except (OSError, ValueError):
            continue
        if isinstance(f, dict) and f.get("source_url"):
            out[str(f.get("control_number"))].add(f["source_url"])
    _READ[college] = dict(out)
    return _READ[college]


def shared_with(college: str, cn: str) -> list[str]:
    pages = read_pages(college)
    mine = pages.get(str(cn)) or set()
    return sorted(k for k, v in pages.items() if k != str(cn) and v & mine)


def _words(s) -> set:
    return set(re.findall(r"[a-z0-9]+(?:\.[0-9]+)?", str(s or "").lower()))


def own_page(filed: dict) -> bool:
    """No other program was read from the record's read page; or the page is a PDF page (which holds several sections)
    and the record's own heading names the program's award (W.own_page's reading); or the page's h1 prints every word
    of the record's title and a word no other program read from it carries in its title (Modesto 43164's
    "Communication Studies 2.0" on the page whose h1 is "Communication Studies for Transfer Degree 2.0", which the
    pre-2.0 award 30643 was also read from: the page is 43164's, and 30643, its title lacking "2.0", is not). Over the
    183 shared-page records it passes 43164 alone. Every word counts, stopwords too, since a stopword can be the word
    that tells two titles apart ("and" against "&")."""
    college, cn = filed.get("college"), str(filed.get("control_number"))
    others = shared_with(college, cn)
    if not others:
        return True
    src, _ = NG._sources(path_of((college, cn)))
    e = src.get(cn) or {}
    if e.get("method") == "pdf_pages":
        return S.heading_award_check(filed.get("record"), filed.get("award"), cn,
                                     filed.get("title"))["status"] == "agrees"
    mine, h1 = _words(filed.get("title")), _words((e.get("source") or {}).get("h1"))
    theirs = [_words((src.get(o) or {}).get("title")) for o in others]
    return bool(mine) and mine <= h1 and all(t and (mine - t) for t in theirs)


def on_live_run(filed: dict) -> bool:
    with lane():
        return W.on_live_run(filed)


# ── the decision ──────────────────────────────────────────────────────────
def note_with(filed: dict, words: str) -> str | None:
    return next((str(n) for n in (filed.get("record") or {}).get("notes") or [] if words in str(n)), None)


def decide(key: tuple) -> tuple[str, str, dict | None, dict]:
    """(kind: "passes", a gap kind or "held", why, the filed record, the arithmetic)."""
    f = load(key)
    if f is None:
        return "held", HELD.get(key, "no record file"), None, {}
    if key in HELD:
        return "held", HELD[key], f, {}
    a = arithmetic(f)
    fa = (f.get("score") or {}).get("arithmetic") or {}
    filed_gaps = [g.get("gap") for g in (f.get("score") or {}).get("gaps") or []]
    if (key in REVIEWED and fa.get("pooled")) or (key in GAP_ROWS and filed_gaps == [GAP_ROWS[key][0]]):
        return "held", "rescored already by this plan", f, a
    if S.passes_live(f.get("score") or {}):
        return "held", "passes already", f, a
    if not on_live_run(f):
        return "held", "the committed record's run is not the run a committed receipt posted", f, a
    if not own_page(f):
        return "held", "read from a page another program was read from (%s)" % ", ".join(
            shared_with(key[0], key[1])), f, a
    if key in REVIEWED:
        if not W.exact(fa, a["off"]):
            return "held", "with the reading off, the scorer does not give the filed arithmetic", f, a
        if not W.verdict(f, a["on"]):
            return "held", "does not pass under the reading with no fill", f, a
        if a["on"] != a["on_none"]:
            return "held", "its pass differs between an empty text and none (a fill would be read)", f, a
        return "passes", "passes under the pooled reading, with no fill", f, a
    if key in GAP_ROWS:
        gap, words = GAP_ROWS[key]
        if scorer_passes(f):
            return "held", "today's scorer passes it: a rescore's, never a gap (p-scorer-passes-guard-s720)", f, a
        if NG.answer(f):
            return "held", "a record rule names %s for it" % NG.answer(f)[0], f, a
        if not note_with(f, words):
            return "held", "its note no longer carries the words the gap names", f, a
        return gap, "collected with %s, named from its own note" % gap, f, a
    return "held", "not reviewed", f, a


def new_score(f: dict, kind: str, a: dict, key: tuple) -> dict:
    if kind == "passes":
        return W.passing_score(f, a["on_none"])
    sc = copy.deepcopy(f.get("score") or {})
    # The gap row's arithmetic: the reading's sum where it moves one (08109's Breadth 9), else as filed.
    if a["on"] != a["off"]:
        sc["arithmetic"] = a["on"]
    sc["pass"] = C._overall(sc)
    gap, words = GAP_ROWS[key]
    src, year = NG._sources(path_of(key))
    e = src.get(key[1]) or {}
    sc["gaps"] = [{"gap": gap, "label": NG.GAPS[gap], "words": note_with(f, words)}]
    sc["confidence"] = NG.confidence(dict(f, score=sc), gap, e.get("method"), (e.get("catalog_year") or year) == year)
    return sc


def keys() -> list[tuple]:
    return sorted(set(REVIEWED) | set(GAP_ROWS) | set(HELD))


def plan(write: bool) -> dict:
    decided = [(k, *decide(k)) for k in keys()]
    moving = [d for d in decided if d[1] != "held"]
    before = NG._load_images({k[0] for k, *_ in moving})
    rows, held = [], []
    for key, kind, why, f, a in decided:
        if kind == "held":
            held.append({"college": key[0], "control_number": key[1], "why": why})
            continue
        img = before.get(key)
        if img is None:
            held.append({"college": key[0], "control_number": key[1], "why": "the load does not post it"})
            continue
        sc = new_score(f, kind, a, key)
        on = sc["arithmetic"]
        entry = {"college": key[0], "control_number": key[1], "award": f.get("award"),
                 "extracted_run": f.get("extracted_run"), "moves_to": kind,
                 "computed": [a["off"].get("computed"), on.get("computed")], "stated": on.get("stated"),
                 "pooled": [{"blocks": p["blocks"], "figure": p["figure"], "minimum": p["minimum"],
                             "words": p["words"]} for p in on.get("pooled") or []],
                 "path": os.path.relpath(path_of(key), ROOT)}
        if kind != "passes":
            entry["words"] = sc["gaps"][0]["words"]
            entry["confidence"] = sc["confidence"]
        if write:
            entry["before_image"] = {k: img[k] for k in ("program_title", "award", "catalog_year", "source_url",
                                                         "measure", "total_min", "total_max", "record", "checks",
                                                         "extracted_run")}
            with open(path_of(key), "w", encoding="utf-8") as fh:
                json.dump(dict(f, score=sc), fh, ensure_ascii=False, indent=1)
                fh.write("\n")
        rows.append(entry)
    if write and rows:
        after = NG._load_images({r["college"] for r in rows})
        for r in rows:
            k = (r["college"], r["control_number"])
            img = after[k]
            if img["record"] != r["before_image"]["record"]:
                raise SystemExit("%s %s: the record changed" % k)
            chk = img["checks"]
            if r["moves_to"] == "passes" and (not F.row_passes(chk) or chk.get("gaps")):
                raise SystemExit("%s %s: the image does not pass with no gap" % k)
            if r["moves_to"] != "passes" and (chk.get("gaps") or []) != [r["moves_to"]]:
                raise SystemExit("%s %s: the image does not carry its gap" % k)
            r["after_image"] = {"checks": chk}
    for i, r in enumerate(rows, 1):
        r["i"] = i
    return {"rows": rows, "held": held}


# ── the self-recall (the S652 review rule) ────────────────────────────────
def _figs(record: dict) -> set:
    return {int(p["figure"][0]) if float(p["figure"][0]).is_integer() else p["figure"][0]
            for p in S.pooled_figures(record)}


# The continued-heading joins across two different headings that are right, by hand (the second reader's recall,
# S731 round 1): Modesto 38869's "ELECTIVES CONTINUED" under Elective Courses, 08109's and 45983's Career Courses
# "CONT." sub-list, Palo Verde 40017's continued list.
CONTINUED_RIGHT = {(MODESTO, "38869"), (MODESTO, "08109"), (MODESTO, "45983"), ("Palo Verde College", "40017")}


def continued_joins(every: list | None = None) -> dict:
    """Every place a heading the page marks continued follows a block with a different heading, over every committed
    record: joined (the first words agree, so the reading joins them) and refused (they do not). right: the joined
    records in CONTINUED_RIGHT; wrong: any other joined record."""
    every = every if every is not None else W.every_record()
    joined, refused = set(), 0
    for _, f in every:
        b = (f.get("record") or {}).get("blocks") or []
        for i in range(len(b) - 1):
            n = str(b[i + 1].get("name") or "")
            st = S._stem(b[i].get("name"))
            if not st or not S.CONTINUED_HEADING.search(n) or S._stem(n) == st:
                continue
            if S._first_word(S._stem(n)) == S._first_word(st):
                joined.add((f.get("college"), str(f.get("control_number"))))
            else:
                refused += 1
    return {"joined": sorted(joined), "right": len(joined & CONTINUED_RIGHT),
            "wrong": sorted(joined - CONTINUED_RIGHT), "refused": refused}


def self_recall(every: list | None = None) -> dict:
    """POOLED_S731 off against on over every committed record: the records whose pooled figures differ (each must be
    S731_FIRES, its figures the hand answer: right, else wrong), and the records whose verdict moves, with an empty
    text and with none (each must be at these four colleges and in this plan, as a row or a hold)."""
    every = every if every is not None else W.every_record()
    out = {"records": len(every), "differ": 0, "right": 0, "wrong": [], "missed": [], "moved": [],
           "moved_outside": [], "pass_to_fail": []}
    saved = S.POOLED_S731
    seen = set()
    try:
        for _, f in every:
            key = (f.get("college"), str(f.get("control_number")))
            S.POOLED_S731 = False
            was = _figs(f["record"])
            S.POOLED_S731 = True
            now = _figs(f["record"])
            if was == now:
                continue
            seen.add(key)
            out["differ"] += 1
            want = S731_FIRES.get(key)
            if want is None or (now - was) - want:
                out["wrong"].append([key[0], key[1], sorted(now), sorted(want or ())])
            else:
                out["right"] += 1
            for text in ("", None):
                S.POOLED_S731 = False
                v0 = W.verdict(f, W.current(f, fresh(f, text)["arithmetic"]))
                S.POOLED_S731 = True
                v1 = W.verdict(f, W.current(f, fresh(f, text)["arithmetic"]))
                if v0 != v1:
                    rec = [key[0], key[1], "empty" if text == "" else "none", "pass" if v1 else "fail"]
                    out["moved"].append(rec)
                    if v0 and not v1:
                        out["pass_to_fail"].append(rec)
                    if key[0] not in LANE or key not in set(keys()):
                        out["moved_outside"].append(rec)
    finally:
        S.POOLED_S731 = saved
    out["missed"] = sorted([list(k) for k in set(S731_FIRES) - seen])
    return out


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--tag", default=TAG)
    a = ap.parse_args(argv)
    rc = self_recall()
    print("self-recall over %d records: %d differ, %d right, wrong %s, missed %s" % (
        rc["records"], rc["differ"], rc["right"], rc["wrong"], rc["missed"]))
    print("  verdicts moved: %s; outside the plan: %s" % (rc["moved"], rc["moved_outside"]))
    if rc["wrong"] or rc["missed"] or rc["moved_outside"] or rc["pass_to_fail"]:
        raise SystemExit("the self-recall reads a wrong answer, a miss, a move outside the plan or a pass-to-fail")
    res = plan(write=not a.dry_run)
    by = dict(collections.Counter(r["moves_to"] for r in res["rows"]))
    print("plan: %d rows %s; held %d" % (len(res["rows"]), by, len(res["held"])))
    for r in res["rows"]:
        print("  %s %s %s %s -> %s" % (r["college"], r["control_number"], r["moves_to"], r["computed"][0],
                                       r["computed"][1]))
    for h in res["held"]:
        print("  held %s %s: %s" % (h["college"], h["control_number"], h["why"][:110]))
    if a.dry_run or not res["rows"]:
        return 0
    rows = res["rows"]
    stamp = time.gmtime()
    day = time.strftime("%Y-%m-%d", stamp)
    path = os.path.join(NG.RECEIPTS, "program_requirement_records_piles_s731_pooled_%s_%s.json" % (day, a.tag))
    shared = {r["control_number"]: shared_with(r["college"], r["control_number"]) for r in rows
              if shared_with(r["college"], r["control_number"])}
    gaps = sorted({r["moves_to"] for r in rows if r["moves_to"] != "passes"})
    body = {"rule": RULING, "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", stamp), "colleges": sorted(LANE),
            "scorer_change": "kb/_program_requirements_score.py POOLED_S731 (the shared pooled reading)",
            "self_recall": rc, "gaps": {g: NG.GAPS[g] for g in gaps},
            "moved": len(rows), "by": by,
            "by_college": dict(sorted(collections.Counter(r["college"] for r in rows).items())),
            "held": res["held"], "records": rows, "shared_pages": shared,
            "supersedes": ("none; s727p's holds Modesto 06655, 08109, 10602, 38869 and 43164 and s721c's gap row "
                           "Porterville 30235 move here; 06773 keeps s721c's gap"),
            "representation": "checks.arithmetic, checks.gaps and checks.confidence as the load reads the rescored "
                              "score; coverage, invented and the record unchanged",
            "follow_verdict": P.FOLLOW_VERDICT,
            "pre_read": P.confirm_pre_read(rows), "pre_read_md5": PV.md5_pre_read(rows),
            "apply": P.confirm_guarded_apply(rows, a.tag + " pooled"),
            "rollback": NG.rollback_sql(rows, a.tag + " pooled rollback")}
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(body, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    rel = os.path.relpath(path, ROOT)
    hdr = ("-- %s lane 1's pooled reading at four colleges (%d rows: %s). Each row's checks become the college\n"
           "-- load's image of its rescored record (load_rows); the record unchanged. Receipt: %s\n"
           "-- (before_image per row).\n" % (a.tag.upper(), len(rows),
                                            ", ".join("%s %d" % kv for kv in sorted(by.items())), rel))
    base = os.path.join(HERE, "migrations", "%s_%s_prreq_piles_" % (day, a.tag))
    parts = {
        "preread_md5.sql": ("-- Compact pre-read, read-only: one SELECT, one JSON value; md5 of each image's jsonb text\n"
                            "-- (the full before-values, the fallback where a hash does not match, are in "
                            "..._preread.sql).\n" + body["pre_read_md5"]),
        "preread.sql": "-- Pre-read, read-only: one SELECT, one JSON value.\n" + body["pre_read"],
        "apply.sql": ("-- Guarded UPDATE: only where the row holds the filed run, the before-image's record and checks,\n"
                      "-- and no person's check. It aborts, writing nothing, unless it matches the plan's %d rows less\n"
                      "-- those a person checked (listed as skipped_checked), or a row holds a matching confirm.\n"
                      % len(rows) + body["apply"]),
        "rollback.sql": ("-- Rollback, NOT applied: the before-image's checks back where the row still holds the\n"
                         "-- after-image, skipping and listing a row a person checked. A rollback lasts only until the\n"
                         "-- next load of that college: revert the record files too (git revert of this plan's commit).\n"
                         + body["rollback"]),
    }
    for name, text in parts.items():
        with open(base + name, "w", encoding="utf-8") as fh:
            fh.write(hdr + text + "\n")
    print("receipt %s" % rel)
    return 0


if __name__ == "__main__":
    sys.exit(main())
