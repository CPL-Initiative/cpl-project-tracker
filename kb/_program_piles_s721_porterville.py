#!/usr/bin/env python3
"""S721, lane 2's cheap piles at Porterville: the census's 19 wording-rule records, one passed, 14 collected with gaps.

Today's census (kb/status/harvest_gap_census.json, run 45371224551) lists 19 Porterville College records under the
reconcile_steps lever ("correction rules from the catalog's own wording, then rescores the saved record"). Sam's
ruling (2026-11-17, sam-collect-with-gaps-2026-11-17): never drop a record for failing; collect it with its gaps
noted and confidence scores, a gap noted instead of a reread. Porterville's five reader_page_search records (36021,
36022, 36023, 37239, 44014) are another lever, left alone.

THE RULE THAT PASSES ONE (RENAMED below). Popular Music Studies 43554's page prints 'CGRAP P152 - Digital Portfolio',
the catalog's own misprint of CGRA P152 Digital Portfolio, the course the state's file lists; its note says so. The
plan rescores the filed score with that one rename (P.rescore_common_numbers, the S713 rename of the same shape), so
coverage and invented pass beside the arithmetic that already passed. The record is unchanged. The rename stays in
this plan: a course_renumbers step in kb/program_requirements_reconcile.json would send every Porterville capture
looking for 'CGRAP P152', and User Experience Design 45517 lists CGRA P152 too.

THE REVIEWED LIST (REVIEWED below, a hand reading of each record's own notes, the shape of S720's piles), with three
guards: scorer_passes (a record today's scorer passes is never gap-filed), on_live_run (the committed record's run
must be its live row's) and the own-section guard (a record whose page shared_pages lists another program on holds
unless a note names its own section). The kinds, all existing:

  noted_no_total          (40) the note says the catalog prints no total for the program (06797, 09520, 35256, 36704,
                          37377, 41689, 44409, 44926, 45626).
  pool_figure_not_read    (40) 'at least 18 combined units from Groups I and II', read as each group's floor (06773,
                          30235).
  noted_section_cut_off   (20) the note says the A.A.'s requirements likely continue on page 85, which the capture did
                          not hold (06809). Course-list match is capped at 50 in confidence().
  noted_figures_differ    (40) a prerequisite block printed at 11-13 and a core at 16 against a printed 29 (35239).
  repeat_read_once        (60) MUSC P108, 1 unit, 'repeatable up to three times' toward its block's 4 units, read once
                          (40122): with P108 taken four times the courses add to the printed 23-24 at both ends.

Held (4): 09528 and 35229 (page 83, which shared_pages lists with Business Management-Global Entrepreneurship; their
records match course for course, the Accounting Emphasis, and no note names a printed section of either: the
own-section guard); 35449 (page 77, shared with the two Administration of Justice A.S.-T records, and no note names
its own section); 45511 (coverage and invented fail, and its text is cut off after KIN P315: not collectable).

THE CLAIM CHECK (p-claim-check-reads-current-capture-s713): every course an entry names is among the codes today's
capture (sources.json) found, and a page the note says the read lacked is not among the capture's pages. THE
SELF-RECALL: HAND is the hand reading of the 19; precision runs the rules and the claim check over each; boundary
readings: the note's words gone, the stated total one unit off, coverage failing, a repeat one time short, and the
rename's misprint absent.

    python3 kb/_program_piles_s721_porterville.py --dry-run
    python3 kb/_program_piles_s721_porterville.py --tag s721c

Guard: tests/program_piles_s721_porterville_test.py.
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
COLLEGE = "Porterville College"
SLUG = "porterville"
CENSUS = NG.CENSUS
LEVERS = ("reconcile_steps",)
PERSON = ()
PASSES = "passes"

# The catalog's own misprint, named by the record's note: {control number: {printed code: listed code, the words}}.
RENAMED = {
    "43554": {"printed": "CGRAP P152", "listed": "CGRAP152",
              "words": "Catalog prints 'CGRAP P152 - Digital Portfolio', apparently a typo for CGRA P152",
              "own_section": "The Popular Music Studies Certificate of Achievement"},
}

REVIEWED = {
    "06773": {"gap": "pool_figure_not_read", "computed": [9, 9], "stated": [18, 18],
              "words": "Major requires at least 18 combined units from Groups I and II"},
    "30235": {"gap": "pool_figure_not_read", "computed": [8, 8], "stated": [18, 18],
              "words": "Major requires at least 18 combined units from Groups I and II"},
    "06797": {"gap": "noted_no_total", "computed": [48.5, 48.5], "stated": None,
              "words": "The catalog prints no total units for the certificate",
              "own_section": "The prose names the award 'Psychiatric Technology Certificate of Achievement'"},
    "09520": {"gap": "noted_no_total", "computed": [21, 21], "stated": None,
              "words": "No total for the major is printed",
              "own_section": "The Commercial Art Associate in Arts Degree"},
    "35256": {"gap": "noted_no_total", "computed": [15, 16], "stated": None,
              "words": "No separate certificate total is printed",
              "own_section": "before the Industrial Maintenance section"},
    "36704": {"gap": "noted_no_total", "computed": [33, 33], "stated": None,
              "words": "no separate certificate total is printed",
              "own_section": "naming the Early Child Care Administration Specialization Certificate of Achievement"},
    "37377": {"gap": "noted_no_total", "computed": [39, 48], "stated": None,
              "words": "No total for the major or the degree is printed"},
    "41689": {"gap": "noted_no_total", "computed": [23, 23], "stated": None,
              "words": "No total for the certificate is printed",
              "own_section": "The Personal Training Certificate"},
    "44409": {"gap": "noted_no_total", "computed": [12, 12], "stated": None,
              "words": "No separate certificate total is printed"},
    "44926": {"gap": "noted_no_total", "computed": [9, 9], "stated": None,
              "words": "The Culinary Arts section prints no total units for the certificate",
              "own_section": "The Culinary Arts section"},
    "45626": {"gap": "noted_no_total", "computed": [55, 55], "stated": None,
              "words": "The catalog prints no total units for the certificate",
              "own_section": "for the Vocational Nursing program, which this certificate"},
    "06809": {"gap": "noted_section_cut_off", "computed": [18, 18], "stated": None,
              "words": "the A.A. requirements likely continue on the next page", "not_page": 85,
              "own_section": "The section heading is printed as 'Child Development Associate in Arts'"},
    "35239": {"gap": "noted_figures_differ", "computed": [27, 29], "stated": [29, 29],
              "words": "block totals (11-13 + 16) give 27-29, so the 29 is the high end"},
    "40122": {"gap": "repeat_read_once", "computed": [20, 21], "stated": [23, 24],
              "words": "MUSC P108 is a single 1-unit course listed as 'repeatable up to three times' with a block "
                       "total of 4 units",
              "repeats": [["MUSC P108", 1, 4]], "courses": ["MUSCP108"]},
}
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}
HAND.update({cn: PASSES for cn in RENAMED})
HAND.update({
    "09528": "held: page 83 is shared with Business Management-Global Entrepreneurship and -Accounting, its record "
             "is 35229's course for course (the Accounting Emphasis), and no note names a printed section of its own "
             "(the own-section guard): a page-finding step",
    "35229": "held: page 83 is shared with Business and Business Management-Global Entrepreneurship, its record is "
             "09528's course for course, and its note says its heading was taken from the program name, not printed "
             "text (the own-section guard): a page-finding step",
    "35449": "held: page 77 is shared with the two Administration of Justice A.S.-T records, and no note names the "
             "record's own section (the own-section guard)",
    "45511": "held: coverage and invented fail (KIN 211A and STATS C1000 as printed, KIN P316 and P317 missing) and "
             "its text is cut off after KIN P315, which carries no units: not collectable, a reread",
})


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


def _pair(v):
    return None if v is None else [float(v[0]), float(v[1])]


def _same(a, b) -> bool:
    a, b = _pair(a), _pair(b)
    if a is None or b is None:
        return a is b
    return all(abs(x - y) <= NG.FIG_EPS for x, y in zip(a, b))


def _course(filed: dict, code: str) -> list[dict]:
    return [c for b in (filed.get("record") or {}).get("blocks") or [] for c in b.get("courses") or []
            if c.get("code") == code]


def _notes(filed: dict) -> list[str]:
    return [str(n) for n in (filed.get("record") or {}).get("notes") or []]


def repeats_close(filed: dict, e: dict) -> bool:
    """Each repeated course appears once in the record at its printed units, and the repeats (times - 1 at its units)
    close the sum to the stated total at both ends."""
    extra = 0.0
    for code, units, times in e["repeats"]:
        rows = _course(filed, code)
        if len(rows) != 1 or rows[0].get("units") != units:
            return False
        extra += units * (times - 1)
    comp, st = _pair(e["computed"]), _pair(e["stated"])
    return all(abs(c + extra - s) <= NG.FIG_EPS for c, s in zip(comp, st))


def scorer_passes(filed: dict) -> bool:
    """Today's scorer passes the record's own arithmetic (S.score with no closed list and no text, so no electives
    fill): such a record is rescored, never gap-filed (#3753's second reader, MAJOR)."""
    a = S.score(filed.get("record") or {}, [], "", filed.get("award")).get("arithmetic") or {}
    return a.get("status") == "equal"


def shared_with(cn: str) -> list[str]:
    """The other programs capture.json's shared_pages lists on the record's page (#3753's second reader, BLOCKER:
    reported in the receipt; a PDF page holds several sections, so a shared page alone holds no record here)."""
    with open(os.path.join(NG.COLLEGE_DIR, SLUG, "capture.json"), encoding="utf-8") as fh:
        sp = json.load(fh).get("shared_pages") or {}
    return sorted({str(m) for v in sp.values() if str(cn) in [str(x) for x in v] for m in v if str(m) != str(cn)})


_POSTED = None


def posted_runs() -> dict:
    """{control number: [(at, extracted_run), ...]} the committed receipts posted to the college's live rows: a load
    (program_requirement_records_college_<slug>_<run>.json: inserted_keys under its extracted_runs), a reread
    (..._college_reread_<slug>_<run>.json: replaced_keys and carried_keys under its extracted_run) and every guarded
    plan's records (each guarded on the row's live run)."""
    global _POSTED
    if _POSTED is not None:
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
            if not glob.glob(os.path.join(NG.RECEIPTS, "migration_%s_prreq_*.json" % tag)):
                continue
            rows = d.get("records") if isinstance(d.get("records"), list) else d.get("moved")
            for r in rows if isinstance(rows, list) else []:
                if isinstance(r, dict) and r.get("college") == COLLEGE and r.get("extracted_run"):
                    out.setdefault(str(r.get("control_number")), []).append((at, str(r["extracted_run"])))
    # A load over two runs names no run per key, so it posts none here; a later reread that kept the row (the row's
    # run is the reread's or newer: chatbox/supabase_program_requirement_records_college_reread.sql) posts the
    # reread's run, only for a key no other receipt posts (30235 and 36704: load 44490130510 inserted them over
    # runs 39046786897 and 44477695238, and reread 44545037444 kept them at 44477695238). The pre-read's on_run
    # count is the check on the live row itself.
    for k, at, run in kept:
        if k not in out:
            out[k] = [(at, run)]
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
    if e.get("repeats") and not repeats_close(filed, e):
        return None
    return e["gap"], words


def renamed(filed: dict, table: dict | None = None) -> dict | None:
    """The filed score rescored with the record's one reviewed misprint renamed to the listed course, where the record
    still prints it, its note still says so, and the rescore passes as the live table counts a pass; else None."""
    cn = str(filed.get("control_number"))
    e = (RENAMED if table is None else table).get(cn)
    if not e or filed.get("college") != COLLEGE:
        return None
    if not any(e["words"] in n for n in _notes(filed)) or not _course(filed, e["printed"]):
        return None
    if not on_live_run(filed):
        return None
    sc = filed.get("score") or {}
    if [(r.get("printed"), r.get("listed")) for r in sc.get("course_renumbers") or []] == [(e["printed"], e["listed"])]:
        # The plan's own rescore, as filed: the rule stands where the filed score still passes.
        return sc if S.passes_live(sc) else None
    if S.passes_live(sc):
        return None
    rn = P.rescore_common_numbers(filed, name_of=lambda code: e["listed"] if S.norm_code(code) == S.norm_code(
        e["printed"]) else None, key="course_renumbers")
    if not rn or not rn["exact"] or not S.passes_live(rn["score"]):
        return None
    return rn["score"]


def _sources() -> dict:
    with open(os.path.join(NG.COLLEGE_DIR, SLUG, "sources.json"), encoding="utf-8") as fh:
        return {str(x.get("control_number")): x for x in json.load(fh)}


def claim(filed: dict, src: dict | None = None) -> str:
    cn = str(filed.get("control_number"))
    e = REVIEWED.get(cn) or RENAMED.get(cn)
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
    if cn in RENAMED and S.norm_code(e["listed"]) in found:
        # A misprint: the capture, looking for the listed code, did not find it on the page.
        return "the capture found the listed code on the page"
    return "stands"


def outcome(filed: dict, src: dict | None = None) -> tuple[str, str | None, str, dict | None]:
    """(answer, words, claim, rescored score): answer is a gap's name, PASSES, or 'none'."""
    cn = str(filed.get("control_number"))
    if cn in RENAMED:
        sc = renamed(filed)
        if sc is None:
            return "none", None, "the rename does not stand", None
        c = claim(filed, src)
        return (PASSES, RENAMED[cn]["words"], c, sc) if c == "stands" else ("none", None, c, None)
    j = gap_noted(filed)
    if not j:
        return "none", None, "no entry stands", None
    c = claim(filed, src)
    return (j[0], j[1], c, None) if c == "stands" else ("none", None, c, None)


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
        if f is None or not (gap_noted(f) or renamed(f)):
            continue
        c = claim(f, src)
        out[c] += 1
        if c != "stands":
            not_standing.append([cn, c])
    return {"counts": dict(out), "not_standing": not_standing}


def boundaries(census_path: str = CENSUS) -> dict:
    out, wrong = collections.Counter(), []

    def tally(name, ok, cn):
        out["%s %s" % (name, "right" if ok else "wrong")] += 1
        if not ok:
            wrong.append([cn, name])

    for cn in census_members(census_path):
        f = _load(cn)
        if f is None:
            continue
        if cn in RENAMED and renamed(f):
            e = RENAMED[cn]
            g = copy.deepcopy(f)
            g["record"]["notes"] = [str(n).replace(e["words"], "") for n in g["record"].get("notes") or []]
            tally("the note's words gone", renamed(g) is None, cn)
            g = copy.deepcopy(f)
            for b in g["record"].get("blocks") or []:
                for c in b.get("courses") or []:
                    if c.get("code") == e["printed"]:
                        c["code"] = "CGRA P152"
            tally("the misprint absent", renamed(g) is None, cn)
            g = copy.deepcopy(f)
            g["score"]["arithmetic"] = dict(g["score"]["arithmetic"], status="unequal", **{"pass": False})
            tally("the arithmetic failing", renamed(g) is None, cn)
            continue
        if not gap_noted(f):
            continue
        g = copy.deepcopy(f)
        g["record"]["notes"] = [str(n).replace(REVIEWED[cn]["words"], "") for n in g["record"].get("notes") or []]
        tally("the note's words gone", gap_noted(g) is None, cn)
        g = copy.deepcopy(f)
        a = g["score"]["arithmetic"]
        a["stated"] = [a["stated"][0] + 1, a["stated"][1] + 1] if a.get("stated") is not None else [1.0, 1.0]
        tally("the stated total one unit off", gap_noted(g) is None, cn)
        g = copy.deepcopy(f)
        g["score"]["coverage"] = dict(g["score"]["coverage"], **{"pass": False})
        tally("coverage failing", gap_noted(g) is None, cn)
        e = REVIEWED[cn]
        if e.get("repeats"):
            short = dict(e, repeats=[[c, u, t - 1] for c, u, t in e["repeats"]])
            tally("a repeat one time short", gap_noted(f, dict(REVIEWED, **{cn: short})) is None, cn)
    return {"counts": dict(out), "wrong": wrong}


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
        gap, words, c, rescored = outcome(f, src)
        if gap == "none":
            held.append({"control_number": cn, "why": HAND.get(cn, "not hand-held"), "claim": c})
            continue
        img = images.get((COLLEGE, cn))
        if img is None or F.row_passes(img["checks"]):
            held.append({"control_number": cn, "why": "the load leaves it out, or its image passes"})
            continue
        if gap == PASSES:
            score = rescored
        else:
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
        if gap == PASSES:
            row["renamed"] = score.get("course_renumbers")
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
            want = [] if r["moves_to"] == PASSES else [r["moves_to"]]
            if img["record"] != r["before_image"]["record"] or (img["checks"].get("gaps") or []) != want:
                raise SystemExit("%s: the record changed, or its image does not carry the gap" % r["control_number"])
            if r["moves_to"] == PASSES and not F.row_passes(img["checks"]):
                raise SystemExit("%s: the rescored image does not pass" % r["control_number"])
            r["after_image"] = {"checks": img["checks"]}
    for i, r in enumerate(rows, 1):
        r["i"] = i
    return {"rows": rows, "held": held}


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--tag", default="s721c")
    a = ap.parse_args(argv)
    pr, cc, bd = precision(), claim_checks(), boundaries()
    print("precision: %s" % json.dumps(pr))
    print("claim checks: %s" % json.dumps(cc))
    print("boundaries: %s" % json.dumps(bd))
    if pr["wrong"] or pr["not_hand_held"] or bd["wrong"] or cc["not_standing"]:
        raise SystemExit("the self-recall reads a wrong answer: no plan is written")
    res = plan(write=not a.dry_run)
    by = dict(collections.Counter(r["moves_to"] for r in res["rows"]))
    print("plan: %d rows %s; held %d" % (len(res["rows"]), by, len(res["held"])))
    if a.dry_run or not res["rows"]:
        return 0
    rows = res["rows"]
    stamp = time.gmtime()
    day = time.strftime("%Y-%m-%d", stamp)
    path = os.path.join(NG.RECEIPTS, "program_requirement_records_piles_s721_porterville_%s_%s.json" % (day, a.tag))
    body = {"rule": NG.RULING + "; S721: Porterville's 19 wording-rule records, one passed by its catalog's own "
                                "misprint, the rest collected with their gaps named where one is honest (no reread)",
            "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", stamp), "college": COLLEGE,
            "census": {"file": os.path.relpath(CENSUS, ROOT), "levers": list(LEVERS), "person": list(PERSON),
                       "members": census_members()},
            "gaps": {g: NG.GAPS[g] for g in sorted(by) if g != PASSES},
            "renamed": {cn: {k: e[k] for k in ("printed", "listed", "words")} for cn, e in RENAMED.items()},
            "moved": len(rows), "by": by,
            "precision": pr, "claim_checks": cc, "boundaries": bd, "held": res["held"], "records": rows,
            "shared_pages": {r["control_number"]: shared_with(r["control_number"]) for r in rows
                             if shared_with(r["control_number"])},
            "representation": "checks.gaps and checks.confidence added as the load reads the filed score; "
                              "checks.arithmetic, coverage, invented and the record unchanged. The renamed row's "
                              "checks.coverage and checks.invented pass from its rescored score; its record unchanged",
            "claim_check_reads": ("Today's capture (sources.json): every course an entry names among the codes it "
                                  "found, and a page a note says the read lacked not among the capture's pages. The "
                                  "capture keeps no page text, so a note's quoted figures are the reader's words, "
                                  "never re-read here."),
            "follow_verdict": P.FOLLOW_VERDICT,
            "pre_read": P.confirm_pre_read(rows), "pre_read_md5": F.md5_pre_read(rows),
            "apply": P.confirm_guarded_apply(rows, a.tag + " piles"),
            "rollback": NG.rollback_sql(rows, a.tag + " piles rollback")}
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(body, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    rel = os.path.relpath(path, ROOT)
    hdr = ("-- %s lane 2's cheap piles at Porterville (%d rows: %s). Each row's checks become the\n"
           "-- college load's image of its committed record (load_rows): checks.gaps and checks.confidence added, or\n"
           "-- for the renamed row coverage and invented passing; the record unchanged. Receipt: %s (before_image\n"
           "-- per row).\n" % (a.tag.upper(), len(rows), ", ".join("%s %d" % kv for kv in sorted(by.items())), rel))
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
