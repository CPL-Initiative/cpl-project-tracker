#!/usr/bin/env python3
"""S727, lane 2's cheap piles at Shasta: the census's 19 wording-rule records, 4 collected with gaps, and 18153.

Today's census (kb/status/harvest_gap_census.json, run 45526918442) lists 19 Shasta College records under the
reconcile_steps lever ("correction rules from the catalog's own wording, then rescores the saved record"). Sam's
ruling (2026-11-17, sam-collect-with-gaps-2026-11-17): never drop a record for failing; collect it with its gaps
noted and confidence scores, a gap noted instead of a reread. Shasta carries no reconcile steps
(kb/program_requirements_reconcile.json) and the capture keeps no page text, so no rule from the committed files
changes a record here; a record takes a named gap where one is honest, and a record a correction rule would pass
stays on the lever (p-gap-filing-leaves-census-lever-s721).

THE REVIEWED LIST (REVIEWED below, a hand reading of each record's own notes, the shape of S721's piles), with three
guards: scorer_passes (a record today's scorer passes is never gap-filed), on_live_run (the committed record's run
must be its live row's) and the own-section guard (a record whose page shared_pages lists another program on holds
unless a note names its own section). The kinds, all existing:

  noted_section_cut_off   (20) 09113 Medical Office Professional A.S.: the note says the excerpt starts mid-list and
                          the missing 8.5 units (BSOT 10, 11, 51, 52, 64) are likely on the prior page, page 64,
                          which the capture did not hold. Course-list match is capped at 50 in confidence().
  lists_not_closed        (30) 35607 Agriculture Business A.S.-T (List B, '0-9 units', takes 'Any course not already
                          used OR AGMA 42') and 37774 Hospitality Management A.S.-T (List B also takes 'Any course
                          from List A not already used', and the footnote says to select unit variations from Lists
                          A and B).
  noted_no_total          (40) 45360 the Cal-GETC certificate: the note says the catalog prints no units beside any
                          course and no total for the certificate.

Held (15), each reason in HAND: four University Studies and General Studies emphases (18080, 18098, 18143, 18144)
whose second list prints 'the remaining' or 'additional' units under the heading's 18: read as one pool with the
list before it they pass today's scorer (POOLED_REMAINING below proves it on a copy), so they stay on the lever;
18087 and 18659, whose heading, where Shasta's University Studies emphases print their unit figure, is on a page the
capture did not hold; 18625, whose blocks are the Coastal Science Technician emphasis 18626's record prints under
the Geosciences Technician degree; 18626 and 18655, emphases of two or three lists each under one option group (the
shape American River's worker named option_lists_read_apart on claude/s727-piles-arc, not on main, so not copied
here; 18655's coverage also fails); 31845 and 32162, whose sums sit inside their printed ranges (no disagreement);
34005, the B.S. whose record holds two gaps (its major counts the 9 units of upper-division general education the
printed 45 leaves out, and its degree total holds the Health Information Technology A.S. as one line); 09501, 35606
and 43618, on shared pages with no note naming their own section (43618's record is 30580's course for course).

SHASTA 18153 (General Studies: Food & Beverage & Lodging Management), held for a person since S653: the re-read of
run 44513230805 found no section for it on the pages the capture handed it (61 to 64, which print the Business
Administration programs five other records are bound to), its record places none of the state's 54 listed courses,
and it has no filed record and no live row; the load skips a record that places none. It is collected as a named gap
for a program with no record (kb/program_requirements_college/shasta/named_gaps_s727.json, the shape of S721's
named_gaps files), with its five confidence scores, and its record stays in held_for_person/.

THE CLAIM CHECK (p-claim-check-reads-current-capture-s713): every course an entry names is among the codes today's
capture (sources.json) found, and a page a note says the read lacked is not among the capture's pages. THE
SELF-RECALL: HAND is the hand reading of the 19; precision runs the rules and the claim check over each; boundary
readings: the note's words gone, the stated total one unit off, coverage failing, the own-section words gone.

    python3 kb/_program_piles_s727_shasta.py --dry-run
    python3 kb/_program_piles_s727_shasta.py --tag s727c

Guard: tests/program_piles_s727_shasta_test.py.
"""
from __future__ import annotations

import argparse
import collections
import copy
import json
import os
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_named_gaps as NG  # noqa: E402
import _program_piles_s713 as P  # noqa: E402
import _program_piles_s714_fullerton as F  # noqa: E402
import _program_requirements_score as S  # noqa: E402

ROOT = os.path.dirname(HERE)
COLLEGE = "Shasta College"
SLUG = "shasta"
CENSUS = NG.CENSUS
LEVERS = ("reconcile_steps",)
PERSON = ()
NO_RECORD_OUT = os.path.join(NG.COLLEGE_DIR, SLUG, "named_gaps_s727.json")

REVIEWED = {
    "09113": {"gap": "noted_section_cut_off", "computed": [26.5, 26.5], "stated": [35, 35],
              "words": "the missing 8.5 units match BSOT 10, 11, 51, 52 and 64 (1+1+3+3+0.5), likely on the prior page",
              "not_page": 64,
              "own_section": "the A.S. degree heading, description, outcomes and the first courses of the major are "
                             "on the previous page"},
    "35607": {"gap": "lists_not_closed", "computed": [22, 36], "stated": [25, 30],
              "words": "List B is printed as '0-9 units' with 'Any course not already used OR AGMA 42'",
              "courses": ["AGMA42"],
              "own_section": "The degree requirements table is headed 'ASSOCIATE IN SCIENCE IN AGRICULTURAL BUSINESS "
                             "FOR TRANSFER DEGREE REQUIREMENTS'"},
    "37774": {"gap": "lists_not_closed", "computed": [15, 25], "stated": [18, 24],
              "words": "List B also allows 'Any course from List A not already used'",
              "own_section": "belongs to the preceding Hospitality Management A.S. program, not this A.S.-T"},
    "45360": {"gap": "noted_no_total", "computed": [30, 41], "stated": None,
              "words": "The catalog prints no units beside any course and no total for the certificate",
              "own_section": "This certificate is the Cal-GETC pattern itself"},
}
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}
HAND.update({
    "18080": "held: 'Choose the remaining 0 - 6 units' completes the 'Choose 12 - 18 units' list to the heading's 18 "
             "(University Studies - 18 Unit Emphasis); read as one pool the record passes today's scorer, so it stays "
             "on the reconcile lever that passes it",
    "18098": "held: 'Select the remaining 0 - 8 units' completes the 'Choose 10-18 units' list to the heading's 18; read "
             "as one pool the record passes today's scorer, so it stays on the reconcile lever",
    "18143": "held: 'Choose the remaining 0-3 units' completes the 'Choose 15-18 units' list to the heading's 18; read "
             "as one pool the record passes today's scorer, so it stays on the reconcile lever",
    "18144": "held: 'Choose 0 - 6 additional units' completes the 'Choose 12 - 18 units' list to the heading's 18 (the "
             "note: the two blocks together make the 18-unit emphasis); read as one pool the record passes today's "
             "scorer, so it stays on the reconcile lever",
    "18087": "held: the excerpt begins mid-section at 'Engineering.' on page 79, and its heading, where Shasta's "
             "University Studies emphases print their unit figure ('18 Unit Emphasis'), is on page 78, which the "
             "capture did not hold, so 'no total is printed' is not the page's word: a read that holds page 78",
    "18659": "held: the excerpt begins mid-description on page 74, and its heading and any unit figure are on page 73, "
             "which the capture did not hold (the note: 'possibly including a unit total'): a read that holds page 73",
    "18625": "held: its blocks are the 'Emphasis in Coastal Science Technician' that 18626's record prints under the "
             "Geosciences Technician degree (pages 77 to 79), and its note puts its own heading on page 77, which the "
             "capture did not hold: which program the section belongs to needs that page",
    "18626": "held: three emphases of two or three lists each share one option group, and the record holds each list "
             "as an alternative of its own (the shape American River's worker names option_lists_read_apart on "
             "claude/s727-piles-arc, not on main): named for the conductor, not copied",
    "18655": "held: coverage fails (not collectable), its live run is not confirmed by a receipt (load 44518684470 "
             "inserted it over two runs), and its emphases take several lists each under one option group (the "
             "option_lists_read_apart shape)",
    "31845": "held: its 37 sits inside the printed 37-39, and the note says GEOG 94's printed 1-3 accounts for the "
             "range; a sum inside a printed range is no disagreement, and read at 1-3 the major is 37-39 (a "
             "correction rule)",
    "32162": "held: its 23-27 sits inside the printed 22-27 (a sum inside a printed range is no disagreement), and its "
             "heading is on the preceding page",
    "34005": "held: two gaps, one row: its major counts HIMS 408, ENGL 401 and PSYC 401, the 9 units of upper-division "
             "general education the printed Upper Division Major Core 45 leaves out, and its degree total 120-126 "
             "holds the Health Information Technology A.S. (66-72) as one line",
    "09501": "held: page 50 is shared with Agriculture - Forest Science and Technology (17479), and no note names the "
             "record's own section (the own-section guard)",
    "35606": "held: pages 52 to 55 are shared with Agriculture - Natural Resources (09505, 18063), and no note names the "
             "record's own section (the own-section guard)",
    "43618": "held: page 66 is shared with Communication Studies (30580), whose record is this one course for course "
             "(both read the 2.0 section), and no note names a printed section of either (the own-section guard)",
})

# The no-record named gap: Shasta 18153, held for a person since S653 (its record in held_for_person/).
NO_RECORD = {
    "18153": {"reason": "pages_hold_other_programs",
              "pages": [61, 62, 63, 64],
              "bound_there": ["09478", "13196", "18143", "38138", "39683"],
              "heading": "Not found in the provided text",
              "note": "The capture handed the read pages 61 to 64, which print the Business Administration degrees "
                      "and certificates (09478, 13196, 18143, 38138 and 39683 are bound to them); the read found no "
                      "section headed by the program's title, and the pages print none of the 15 Culinary Arts "
                      "courses the state lists for it."},
}
NO_RECORD_REASONS = {
    "pages_hold_other_programs":
        "The pages the capture handed the read print other programs' sections and none headed by this program's "
        "title; the record places none of the state's listed courses, and no read has found the program's own "
        "section.",
}

# The four 'remaining' emphases: read as one pool with the list before it under the heading's figure, today's
# scorer passes each (pooled_remaining proves it on a copy; the scorer is unchanged here).
POOLED_REMAINING = ("18080", "18098", "18143", "18144")


def census_members(path: str = CENSUS) -> list[str]:
    """The keys: the census's members under LEVERS at the college, less PERSON."""
    with open(path, encoding="utf-8") as fh:
        d = json.load(fh)
    out = []
    for lv in d.get("levers") or []:
        if lv.get("lever") in LEVERS and lv.get("scope") == COLLEGE:
            out += [m for m in lv.get("members") or [] if m not in out and m not in PERSON]
    return out


def _path(cn: str) -> str:
    return os.path.join(NG.COLLEGE_DIR, SLUG, "records", cn + ".json")


def _load(cn: str) -> dict | None:
    if not os.path.isfile(_path(cn)):
        return None
    with open(_path(cn), encoding="utf-8") as fh:
        return json.load(fh)


def _held_path(cn: str) -> str:
    return os.path.join(NG.COLLEGE_DIR, SLUG, "held_for_person", cn + ".json")


def _pair(v):
    return None if v is None else [float(v[0]), float(v[1])]


def _same(a, b) -> bool:
    a, b = _pair(a), _pair(b)
    if a is None or b is None:
        return a is b
    return all(abs(x - y) <= NG.FIG_EPS for x, y in zip(a, b))


def _notes(filed: dict) -> list[str]:
    return [str(n) for n in (filed.get("record") or {}).get("notes") or []]


def scorer_passes(filed: dict) -> bool:
    """Today's scorer passes the record's own arithmetic (S.score with no closed list and no text, so no electives
    fill): such a record is rescored, never gap-filed (#3753's second reader, MAJOR)."""
    a = S.score(filed.get("record") or {}, [], "", filed.get("award")).get("arithmetic") or {}
    return a.get("status") == "equal"


def pooled_remaining(filed: dict) -> bool:
    """The record's first two lists read as one pool under the program's printed total passes today's scorer: the
    'remaining' reading, on a copy (the record and the scorer unchanged)."""
    g = copy.deepcopy(filed)
    rec = g.get("record") or {}
    bl = rec.get("blocks") or []
    tot = (rec.get("program") or {}).get("total_units") or {}
    if len(bl) < 2 or S._span(tot) is None or any(b.get("rule") != "choose_units" for b in bl[:2]):
        return False
    rec["blocks"] = [dict(bl[0], courses=(bl[0].get("courses") or []) + (bl[1].get("courses") or []),
                          stated=dict(tot), minimum=tot.get("min"))] + bl[2:]
    return scorer_passes(g)


def shared_with(cn: str) -> list[str]:
    """The other programs capture.json's shared_pages lists on the record's page (#3753's second reader, BLOCKER:
    reported in the receipt; a PDF page holds several sections, so a shared page alone holds no record here)."""
    with open(os.path.join(NG.COLLEGE_DIR, SLUG, "capture.json"), encoding="utf-8") as fh:
        sp = json.load(fh).get("shared_pages") or {}
    return sorted({str(m) for v in sp.values() if str(cn) in [str(x) for x in v] for m in v if str(m) != str(cn)})


_POSTED = None


def posted_runs(skip: tuple = ()) -> dict:
    """{control number: [(at, extracted_run), ...]} the committed receipts posted to the college's live rows: a load
    (program_requirement_records_college_<slug>_<run>.json: inserted_keys under its extracted_runs), a reread
    (..._college_reread_<slug>_<run>.json: replaced_keys and carried_keys under its extracted_run) and every guarded
    plan's records (each guarded on the row's live run). skip names plan tags whose receipts are left out (the test
    reads the receipts as they stood before this plan's own s727c apply); a skip is never cached."""
    global _POSTED
    if _POSTED is not None and not skip:
        return _POSTED
    import glob
    out: dict = {}
    kept = []
    for path in glob.glob(os.path.join(NG.RECEIPTS, "program_requirement_records_*.json")):
        name = os.path.basename(path)
        try:
            with open(path, encoding="utf-8") as fh:
                d = json.load(fh)
        except (OSError, ValueError):
            continue
        if not isinstance(d, dict):
            continue
        at = str(d.get("at") or "")
        if name.startswith("program_requirement_records_college_reread_%s_" % SLUG):
            for k in (d.get("replaced_keys") or []) + (d.get("carried_keys") or []):
                out.setdefault(str(k), []).append((at, str(d.get("extracted_run"))))
            kept += [(str(k), at, str(d.get("extracted_run"))) for k in d.get("kept_keys") or []]
        elif name.startswith("program_requirement_records_college_%s_" % SLUG):
            runs = [str(r) for r in d.get("extracted_runs") or []]
            for k in d.get("inserted_keys") or []:
                if len(runs) == 1:
                    out.setdefault(str(k), []).append((at, runs[0]))
        else:
            # A plan's rows reached the live table only when its migration receipt was filed (an unapplied plan,
            # this module's own receipt among them, posts nothing).
            tag = name[:-len(".json")].rsplit("_", 1)[-1]
            if tag in skip:
                continue
            if not glob.glob(os.path.join(NG.RECEIPTS, "migration_%s_prreq_*.json" % tag)):
                continue
            rows = d.get("records") if isinstance(d.get("records"), list) else d.get("moved")
            for r in rows if isinstance(rows, list) else []:
                if isinstance(r, dict) and r.get("college") == COLLEGE and r.get("extracted_run"):
                    out.setdefault(str(r.get("control_number")), []).append((at, str(r["extracted_run"])))
    # A load over two runs names no run per key, so it posts none here; a reread that kept the row posts the reread's
    # run, only for a key no other receipt posts (Porterville's rule, S721). The pre-read's on_run count is the check
    # on the live row itself.
    for k, at, run in kept:
        if k not in out:
            out[k] = [(at, run)]
    if not skip:
        _POSTED = out
    return out


def on_live_run(filed: dict) -> bool:
    """The committed record's run is the run the latest committed receipt posted for the row (the pre-read class of
    East Los Angeles 02456: a reconcile rewrote the file, and its run never reached the live row)."""
    rows = posted_runs().get(str(filed.get("control_number"))) or []
    return bool(rows) and max(rows)[1] == str(filed.get("extracted_run"))


def gap_noted(filed: dict, reviewed: dict | None = None) -> tuple[str, str] | None:
    """(gap, words) where a reviewed entry stands on the record as it is filed; else None."""
    e = (REVIEWED if reviewed is None else reviewed).get(str(filed.get("control_number")))
    if not e or filed.get("college") != COLLEGE:
        return None
    sc = filed.get("score") or {}
    a = sc.get("arithmetic") or {}
    words = next((n for n in _notes(filed) if e["words"] in n), None)
    if not words or not NG.collectable(sc) or a.get("pass") or S.passes_live(sc):
        return None
    if not _same(a.get("computed"), e["computed"]) or not _same(a.get("stated"), e["stated"]):
        return None
    if scorer_passes(filed):
        return None
    if not on_live_run(filed):
        return None
    return e["gap"], words


def _sources() -> dict:
    with open(os.path.join(NG.COLLEGE_DIR, SLUG, "sources.json"), encoding="utf-8") as fh:
        return {str(x.get("control_number")): x for x in json.load(fh)}


def claim(filed: dict, src: dict | None = None, reviewed: dict | None = None) -> str:
    cn = str(filed.get("control_number"))
    e = (REVIEWED if reviewed is None else reviewed).get(cn)
    s = (_sources() if src is None else src).get(cn)
    if not e or not s:
        return "no capture"
    if shared_with(cn) and not any(e.get("own_section") and e["own_section"] in n for n in _notes(filed)):
        # #3753's own_page guard, for PDF pages: a page shared_pages lists another program on is the record's own
        # only where a note names the record's own section (East Los Angeles's second reader, 38168).
        return "the page is shared and no note names the record's own section"
    found = {S.norm_code(x) for x in s.get("codes_found") or []}
    if any(S.norm_code(c) not in found for c in e.get("courses") or []):
        return "a named course not found"
    if e.get("not_page") is not None and e["not_page"] in ((s.get("source") or {}).get("pages") or []):
        return "the capture holds the page the note says the read lacked"
    return "stands"


def outcome(filed: dict, src: dict | None = None) -> tuple[str, str | None, str]:
    j = gap_noted(filed)
    if not j:
        return "none", None, "no entry stands"
    c = claim(filed, src)
    return (j[0], j[1], c) if c == "stands" else ("none", None, c)


def precision(census_path: str = CENSUS) -> dict:
    out = {"read": 0, "right": 0, "wrong": [], "no_record_file": 0, "not_hand_held": 0,
           "by_answer": collections.Counter()}
    src = _sources()
    for cn in census_members(census_path):
        if cn not in HAND:
            out["not_hand_held"] += 1
            continue
        f = _load(cn)
        truth = "none" if HAND[cn].startswith("held") else HAND[cn]
        out["read"] += 1
        out["by_answer"][truth] += 1
        if f is None:
            out["no_record_file"] += 1
            got = "none"
        else:
            got = outcome(f, src)[0]
        if got == truth:
            out["right"] += 1
        else:
            out["wrong"].append([cn, truth, got])
    out["by_answer"] = dict(out["by_answer"])
    return out


def claim_checks(census_path: str = CENSUS) -> dict:
    out, not_standing = collections.Counter(), []
    src = _sources()
    for cn in census_members(census_path):
        f = _load(cn)
        if f is None or not gap_noted(f):
            continue
        c = claim(f, src)
        out[c] += 1
        if c != "stands":
            not_standing.append([cn, c])
    return {"counts": dict(out), "not_standing": not_standing}


def boundaries(census_path: str = CENSUS) -> dict:
    out, wrong = collections.Counter(), []
    src = _sources()

    def tally(name, ok, cn):
        out["%s %s" % (name, "right" if ok else "wrong")] += 1
        if not ok:
            wrong.append([cn, name])

    for cn in census_members(census_path):
        f = _load(cn)
        if f is None or not gap_noted(f):
            continue
        e = REVIEWED[cn]
        g = copy.deepcopy(f)
        g["record"]["notes"] = [str(n).replace(e["words"], "") for n in g["record"].get("notes") or []]
        tally("the note's words gone", gap_noted(g) is None, cn)
        g = copy.deepcopy(f)
        a = g["score"]["arithmetic"]
        a["stated"] = [a["stated"][0] + 1, a["stated"][1] + 1] if a.get("stated") is not None else [1.0, 1.0]
        tally("the stated total one unit off", gap_noted(g) is None, cn)
        g = copy.deepcopy(f)
        g["score"]["coverage"] = dict(g["score"]["coverage"], **{"pass": False})
        tally("coverage failing", gap_noted(g) is None, cn)
        if shared_with(cn):
            g = copy.deepcopy(f)
            g["record"]["notes"] = [str(n).replace(e["own_section"], "") for n in g["record"].get("notes") or []]
            tally("the own-section words gone", claim(g, src) != "stands", cn)
    return {"counts": dict(out), "wrong": wrong}


def no_record_gaps() -> dict:
    """The named-gap file for programs with no record: each NO_RECORD entry stands where its held record still places
    none, names the pages the capture lists, has no record in records/, and the pages hold the programs it names."""
    src = _sources()
    with open(os.path.join(NG.COLLEGE_DIR, SLUG, "capture.json"), encoding="utf-8") as fh:
        cap = json.load(fh)
    progs = []
    for cn, e in NO_RECORD.items():
        with open(_held_path(cn), encoding="utf-8") as fh:
            f = json.load(fh)
        s = src.get(cn) or {}
        cov = (f.get("score") or {}).get("coverage") or {}
        pages = (s.get("source") or {}).get("pages") or []
        if os.path.isfile(_path(cn)) or not cov.get("none_placed") or pages != e["pages"]:
            raise SystemExit("%s: the no-record gap no longer stands" % cn)
        if (f.get("record") or {}).get("program", {}).get("section_heading") != e["heading"]:
            raise SystemExit("%s: the held record's heading moved" % cn)
        if any(cn2 not in shared_with(cn) for cn2 in e["bound_there"]):
            raise SystemExit("%s: a program the note names is not bound to its pages" % cn)
        if any(S.norm_code(c).startswith("CULA") for c in s.get("codes_found") or []):
            raise SystemExit("%s: the pages print a Culinary Arts course" % cn)
        conf = NG.confidence(f, None, s.get("method"), (s.get("catalog_year") or f.get("catalog_year"))
                             in (None, cap.get("catalog_year")))
        progs.append({"control_number": cn, "title": s.get("title") or f.get("title"), "award": f.get("award"),
                      "reason": e["reason"], "note": e["note"], "pages": pages,
                      "listed": cov.get("listed"), "placed": cov.get("placed"),
                      "cula_listed": sum(1 for k in cov.get("missing") or [] if k.startswith("CULA")),
                      "confidence": conf, "record": os.path.relpath(_held_path(cn), ROOT)})
    return {"_readme": ("S727 (lane 2, plan s727c): Shasta College's programs with no record, collected as named gaps "
                        "with their confidence scores (Sam, 2026-11-17, sam-collect-with-gaps-2026-11-17; COBIx's brief "
                        "of 2026-11-25: a record held for a person is collected with its gap named). The held record "
                        "stays in held_for_person/ (the load skips a record that places none, and no live row holds "
                        "it). No model call, no Supabase write."),
            "college": COLLEGE, "capture": str(cap.get("run")), "catalog_year": cap.get("catalog_year"),
            "reasons": dict(NO_RECORD_REASONS), "programs": progs}


def plan(write: bool, census_path: str = CENSUS) -> dict:
    rows, held, hits = [], [], []
    src = _sources()
    year = None
    cap = os.path.join(NG.COLLEGE_DIR, SLUG, "capture.json")
    if os.path.isfile(cap):
        with open(cap, encoding="utf-8") as fh:
            year = json.load(fh).get("catalog_year")
    images = NG._load_images({COLLEGE})
    for cn in census_members(census_path):
        f = _load(cn)
        if f is None:
            held.append({"control_number": cn, "why": HAND.get(cn, "no record file")})
            continue
        if S.passes_live(f.get("score")) or (f.get("score") or {}).get("gaps"):
            continue
        gap, words, c = outcome(f, src)
        if gap == "none":
            held.append({"control_number": cn, "why": HAND.get(cn, "not hand-held"), "claim": c})
            continue
        img = images.get((COLLEGE, cn))
        if img is None or F.row_passes(img["checks"]):
            held.append({"control_number": cn, "why": "the load leaves it out, or its image passes"})
            continue
        e = src.get(cn) or {}
        score = copy.deepcopy(f["score"])
        score["gaps"] = [{"gap": gap, "label": NG.GAPS[gap], "words": words}]
        score["confidence"] = NG.confidence(dict(f, score=score), gap, e.get("method"),
                                            (e.get("catalog_year") or year) == year)
        hits.append((cn, f, score, gap, words, img))
    for cn, f, score, gap, words, img in hits:
        row = {"college": COLLEGE, "control_number": cn, "award": f.get("award"),
               "extracted_run": f.get("extracted_run"), "moves_to": gap, "words": words,
               "confidence": score.get("confidence"), "path": os.path.relpath(_path(cn), ROOT)}
        if write:
            row["before_image"] = {k: img[k] for k in ("program_title", "award", "catalog_year", "source_url",
                                                       "measure", "total_min", "total_max", "record", "checks",
                                                       "extracted_run")}
            with open(_path(cn), "w", encoding="utf-8") as fh:
                json.dump(dict(f, score=score), fh, ensure_ascii=False, indent=1)
                fh.write("\n")
        rows.append(row)
    if write and rows:
        after = NG._load_images({COLLEGE})
        for r in rows:
            img = after[(COLLEGE, r["control_number"])]
            if img["record"] != r["before_image"]["record"] or (img["checks"].get("gaps") or []) != [r["moves_to"]]:
                raise SystemExit("%s: the record changed, or its image does not carry the gap" % r["control_number"])
            r["after_image"] = {"checks": img["checks"]}
    for i, r in enumerate(rows, 1):
        r["i"] = i
    return {"rows": rows, "held": held}


def md5_pre_read(rows: list[dict]) -> str:
    """F.md5_pre_read, its query sent to the local Postgres on stdin (Palo Verde's form, S721): the Cal-GETC image of
    178 courses passes the kernel's argument limit as one -c argument. The SQL is F's own, never a copy."""
    import subprocess
    real = F.subprocess.run

    def run(cmd, **kw):
        if "-c" in cmd:
            i = cmd.index("-c")
            return real(cmd[:i] + cmd[i + 2:], input=cmd[i + 1], **kw)
        return real(cmd, **kw)

    F.subprocess.run = run
    try:
        return F.md5_pre_read(rows)
    finally:
        F.subprocess.run = real
        assert subprocess.run is real


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--tag", default="s727c")
    a = ap.parse_args(argv)
    pr, cc, bd = precision(), claim_checks(), boundaries()
    pooled = {cn: pooled_remaining(_load(cn)) for cn in POOLED_REMAINING}
    nr = no_record_gaps()
    print("precision: %s" % json.dumps(pr))
    print("claim checks: %s" % json.dumps(cc))
    print("boundaries: %s" % json.dumps(bd))
    print("pooled remaining: %s" % json.dumps(pooled))
    print("no record: %s" % json.dumps([(p["control_number"], p["reason"], p["confidence"]) for p in nr["programs"]]))
    if pr["wrong"] or pr["not_hand_held"] or bd["wrong"] or cc["not_standing"] or not all(pooled.values()):
        raise SystemExit("the self-recall reads a wrong answer: no plan is written")
    res = plan(write=not a.dry_run)
    by = dict(collections.Counter(r["moves_to"] for r in res["rows"]))
    print("plan: %d rows %s; held %d" % (len(res["rows"]), by, len(res["held"])))
    if a.dry_run or not res["rows"]:
        return 0
    rows = res["rows"]
    stamp = time.gmtime()
    day = time.strftime("%Y-%m-%d", stamp)
    nr["written"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", stamp)
    with open(NO_RECORD_OUT, "w", encoding="utf-8") as fh:
        json.dump(nr, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    path = os.path.join(NG.RECEIPTS, "program_requirement_records_piles_s727_shasta_%s_%s.json" % (day, a.tag))
    body = {"rule": NG.RULING + "; S727: Shasta's 19 wording-rule records, collected with their gaps named where one "
                                "is honest (no reread), and 18153 collected as a named gap with no record",
            "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", stamp), "college": COLLEGE,
            "census": {"file": os.path.relpath(CENSUS, ROOT), "levers": list(LEVERS), "person": list(PERSON),
                       "members": census_members()},
            "gaps": {g: NG.GAPS[g] for g in sorted(by)}, "moved": len(rows), "by": by,
            "precision": pr, "claim_checks": cc, "boundaries": bd, "pooled_remaining": pooled,
            "held": res["held"], "records": rows,
            "no_record": {"file": os.path.relpath(NO_RECORD_OUT, ROOT),
                          "programs": [p["control_number"] for p in nr["programs"]]},
            "shared_pages": {r["control_number"]: shared_with(r["control_number"]) for r in rows
                             if shared_with(r["control_number"])},
            "representation": "checks.gaps and checks.confidence added as the load reads the filed score; "
                              "checks.arithmetic, coverage, invented and the record unchanged",
            "claim_check_reads": ("Today's capture (sources.json): every course an entry names among the codes it "
                                  "found, and a page a note says the read lacked not among the capture's pages. The "
                                  "capture keeps no page text, so a note's quoted figures are the reader's words, "
                                  "never re-read here."),
            "follow_verdict": P.FOLLOW_VERDICT,
            "pre_read": P.confirm_pre_read(rows), "pre_read_md5": md5_pre_read(rows),
            "apply": P.confirm_guarded_apply(rows, a.tag + " piles"),
            "rollback": NG.rollback_sql(rows, a.tag + " piles rollback")}
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(body, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    rel = os.path.relpath(path, ROOT)
    hdr = ("-- %s lane 2's cheap piles at Shasta (%d rows: %s). Each row's checks become the\n"
           "-- college load's image of its committed record (load_rows): checks.gaps and checks.confidence added;\n"
           "-- the record unchanged. Receipt: %s (before_image per row).\n"
           % (a.tag.upper(), len(rows), ", ".join("%s %d" % kv for kv in sorted(by.items())), rel))
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
