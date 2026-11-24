#!/usr/bin/env python3
"""S720, lane 2's cheap piles at Contra Costa: the census's 22 wording-rule records, collected with gaps named.

Today's census (kb/status/harvest_gap_census.json, run 45319725062) lists 22 Contra Costa records under the
reconcile_steps lever ("correction rules from the catalog's own wording, then rescores the saved record"). Sam's
ruling (2026-11-17, sam-collect-with-gaps-2026-11-17): never drop a record for failing; collect it with its gaps
noted and confidence scores, a gap noted instead of a reread. No rule from the committed files passes one without
changing its record, so each record takes a named gap where one is honest.

THE REVIEWED LIST (REVIEWED below, a hand reading of each record's own notes, the shape of #3753 and #3755), with
three guards: scorer_passes (a record today's scorer passes on its own record is never gap-filed), on_live_run (the
committed record's run must be its live row's, East Los Angeles 02456's pre-read class) and the own-section guard (a
record whose page shared_pages lists another program on holds unless a note names its own section). The kinds:

  degree_summary_ge_none  (new, 50) 16 local degrees whose page's unit summary prints Total Program 60 and prints
                          general education and electives as None or N/A, while the major adds up to its printed
                          major total (the entry checks the major's own check is equal and no GE pattern is named).
                          No existing kind fits: ge_units_not_read needs a named pattern, and the page names none.
                          Its GE score is ge_units_not_read's 50 (NG.GE_NOT_PRINTED, inside NG.confidence). 14 are
                          collected; 01400 holds on on_live_run, and 33660 because no note of it says its electives
                          are None. 01387's cited note names its GE; its next note prints its electives as None.
  lists_not_closed        (#3753) an elective list prints no rule or unit figure (36158, 42085).
  noted_unit_floor        (#3753) CIS 099, printed 1-4 units, is required at the 2 units the description names
                          (40761): with 2 the courses add to the printed 22 exactly, which the entry checks; held
                          tonight on on_live_run.

Held (6): 01400 and 40761 (no committed receipt posts their committed run to a live row: on_live_run); 01415 (its
19-22 range's high end comes from 'or both' pairs read singly: a reread); 01417 (the 24.3-48.9 summary range is two
entry paths, LVN and basic: a person); 33370 (its core heading's .5-unit figures differ from the 0.5-5.5 ranges
printed beside them, and the record's sum takes neither reading exactly); 33660 (no note says its electives are
None, so the kind's sentence is not its own).

THE CLAIM CHECK (p-claim-check-reads-current-capture-s713): every course an entry names is among the codes today's
capture (sources.json) found. THE SELF-RECALL: HAND is the hand reading of the 22; precision runs the rule and the
claim check over each; boundary readings: the note's words gone, the stated total one unit off, coverage failing.

    python3 kb/_program_piles_s720_contracosta.py --dry-run
    python3 kb/_program_piles_s720_contracosta.py --tag s720k

Guard: tests/program_piles_s720_contracosta_test.py.
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
COLLEGE = "Contra Costa College"
SLUG = "contra_costa"
CENSUS = NG.CENSUS
LEVERS = ("reconcile_steps",)
PERSON = ()

REVIEWED = {
    "01381": {"gap": "degree_summary_ge_none", "computed": [19, 21], "stated": [60, 60], "major_equal": True,
              "words": "GE Local is 'None', CSU/IGETC 'N/A'"},
    "01384": {"gap": "degree_summary_ge_none", "computed": [20, 23], "stated": [60, 60], "major_equal": True,
              "words": 'General Education Units None, Elective Units to reach 60 None'},
    "01387": {"gap": "degree_summary_ge_none", "computed": [18, 18], "stated": [60, 60], "major_equal": True,
              "words": "The unit summary lists general education (local) as 'None' and CSU/IGETC as 'N/A'"},
    "01393": {"gap": "degree_summary_ge_none", "computed": [34, 37], "stated": [60, 60], "major_equal": True,
              "words": "the summary lists General Education Units and Elective Units to reach 60 as 'None'"},
    "01400": {"gap": "degree_summary_ge_none", "computed": [37, 37], "stated": [60, 60], "major_equal": True,
              "words": "The summary lists Local GE as 'None', CSU/IGETC GE as 'N/A' and electives as 'None'"},
    "01408": {"gap": "degree_summary_ge_none", "computed": [33, 33], "stated": [60, 60], "major_equal": True,
              "words": "General Education Units and Elective Units to reach 60 are printed as 'None'; no GE pattern"},
    "01437": {"gap": "degree_summary_ge_none", "computed": [21, 21], "stated": [60, 60], "major_equal": True,
              "words": 'GE local and CSU/IGETC units printed as None/N/A, and electives as None'},
    "01443": {"gap": "degree_summary_ge_none", "computed": [18, 18], "stated": [60, 60], "major_equal": True,
              "words": 'GE (local and CSU/IGETC) shown as None/N/A'},
    "01447": {"gap": "degree_summary_ge_none", "computed": [18, 18], "stated": [60, 60], "major_equal": True,
              "words": "General Education Units and Elective Units to reach 60 printed as 'None'"},
    "01448": {"gap": "degree_summary_ge_none", "computed": [18, 18], "stated": [60, 60], "major_equal": True,
              "words": "General Education Units and Elective Units to reach 60 are printed as 'None'"},
    "07602": {"gap": "degree_summary_ge_none", "computed": [22, 22], "stated": [60, 60], "major_equal": True,
              "words": "The unit summary lists General Education (Local) as 'None', CSU/IGETC as 'N/A'"},
    "07614": {"gap": "degree_summary_ge_none", "computed": [28, 28], "stated": [60, 60], "major_equal": True,
              "words": "The summary lists General Education Local as 'None', CSU/IGETC as 'N/A', and Electives as 'None'"},
    "07616": {"gap": "degree_summary_ge_none", "computed": [18, 18], "stated": [60, 60], "major_equal": True,
              "words": "The Unit Summary lists local GE as 'None', CSU/IGETC as 'N/A' and Electives as 'None'"},
    "11702": {"gap": "degree_summary_ge_none", "computed": [29, 30], "stated": [60, 60], "major_equal": True,
              "words": "the summary prints General Education Units 'None' and Elective Units to reach 60 'None'"},
    "18984": {"gap": "degree_summary_ge_none", "computed": [18, 18], "stated": [60, 60], "major_equal": True,
              "words": "GE units printed as 'None', no GE pattern named"},
    "36158": {"gap": "lists_not_closed", "computed": [9, 9], "stated": [12, 12],
              "words": "The Elective Courses list prints no selection rule or unit count"},
    "42085": {"gap": "lists_not_closed", "computed": [6, 6], "stated": [18, 18],
              "words": "The catalog prints no selection rule or unit minimum for the 'African American Classes' and "
                       "'La Raza Courses' lists", "courses": ["AFRAM110"]},
    "40761": {"gap": "noted_unit_floor", "computed": [21, 24], "stated": [22, 22],
              "words": "the description says the program requires 2 units of occupational work experience",
              "floor": {"code": "CIS099", "printed": [1, 4], "units": 2}, "courses": ["CIS099"]},
}
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}
HAND.update({
    # on_live_run: no committed receipt names the run either live row holds (both files on 44687786167).
    "01400": "held: no committed receipt posts its committed run (44687786167) to a live row (on_live_run); its "
             "live row's run is unknown here",
    "40761": "held: no committed receipt posts its committed run (44687786167) to a live row (on_live_run); its "
             "live row's run is unknown here",
    "01415": "held: the 19-22 range's high end comes from 'or both' pairs read singly in the 9-unit choice: a reread",
    "01417": "held: the summary's 24.3-48.9 is two entry paths (LVN/LPN and basic nursing): a person or a reread",
    "33660": "held: its notes print general education as None/N/A and say nothing of its electives, so "
             "degree_summary_ge_none's sentence (general education and electives as None or N/A) is not its own "
             "(the second reader, S720)",
    "33370": "held: the core heading's .5-unit figures differ from the 0.5-5.5 ranges printed beside them, and the "
             "record's 42.5-73.5 takes neither reading exactly",
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
    words = next((str(n) for n in (filed.get("record") or {}).get("notes") or [] if e["words"] in str(n)), None)
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
    if e.get("figures_differ") and NG.figures_differ_fails(filed):
        return None
    if e.get("major_equal"):
        # The degree's major passes its own check and the page names no general education pattern.
        m = a.get("major") or {}
        prog = (filed.get("record") or {}).get("program") or {}
        if m.get("status") != "equal" or a.get("against") != "degree" or prog.get("ge_pattern"):
            return None
    if e.get("floor"):
        # A variable-unit course required at one figure: the sum with it at that figure is the stated total exactly.
        fl = e["floor"]
        rows = _course(filed, fl["code"])
        if len(rows) != 1 or [rows[0].get("units"), rows[0].get("units_max")] != fl["printed"]:
            return None
        comp, st = _pair(e["computed"]), _pair(e["stated"])
        if abs(comp[0] + fl["units"] - fl["printed"][0] - st[0]) > NG.FIG_EPS \
                or abs(comp[1] - (fl["printed"][1] - fl["units"]) - st[1]) > NG.FIG_EPS:
            return None
    if e.get("less"):
        # The record counts a block the printed total leaves out: the sum less it is the stated total exactly.
        comp, st, less = _pair(e["computed"]), _pair(e["stated"]), _pair(e["less"])
        if any(abs(c - x - s) > NG.FIG_EPS for c, x, s in zip(comp, less, st)):
            return None
    if e.get("double"):
        # The page lets e["double"] units count twice: the stated total lies inside the sum less them.
        comp, st = _pair(e["computed"]), _pair(e["stated"])
        if not (comp[0] - e["double"] - NG.FIG_EPS <= st[0] <= st[1] <= comp[1] - e["double"] + NG.FIG_EPS):
            return None
    return e["gap"], words


def _sources() -> dict:
    with open(os.path.join(NG.COLLEGE_DIR, SLUG, "sources.json"), encoding="utf-8") as fh:
        return {str(x.get("control_number")): x for x in json.load(fh)}


def claim(filed: dict, src: dict | None = None) -> str:
    cn = str(filed.get("control_number"))
    e = REVIEWED.get(cn)
    s = (_sources() if src is None else src).get(cn)
    if not e or not s:
        return "no capture"
    if shared_with(cn) and not any(e.get("own_section") and e["own_section"] in str(n)
                                   for n in (filed.get("record") or {}).get("notes") or []):
        # #3753's own_page guard, for PDF pages: a page shared_pages lists another program on is the record's own
        # only where a note names the record's own section (East Los Angeles's second reader, 38168).
        return "the page is shared and no note names the record's own section"
    found = {S.norm_code(x) for x in s.get("codes_found") or []}
    if any(S.norm_code(c) not in found for c in e.get("courses") or []):
        return "a named course not found"
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

    def tally(name, ok, cn):
        out["%s %s" % (name, "right" if ok else "wrong")] += 1
        if not ok:
            wrong.append([cn, name])

    for cn in census_members(census_path):
        f = _load(cn)
        if f is None or not gap_noted(f):
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
               "confidence": score["confidence"], "path": os.path.relpath(_path(cn), ROOT)}
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


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--tag", default="s720k")
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
    path = os.path.join(NG.RECEIPTS, "program_requirement_records_piles_s720_contracosta_%s_%s.json" % (day, a.tag))
    body = {"rule": NG.RULING + "; S720: Contra Costa's 22 wording-rule records, collected with their gaps named where one is honest (no reread)",
            "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", stamp), "college": COLLEGE,
            "census": {"file": os.path.relpath(CENSUS, ROOT), "levers": list(LEVERS), "person": list(PERSON),
                       "members": census_members()},
            "gaps": {g: NG.GAPS[g] for g in sorted(by)}, "moved": len(rows), "by": by,
            "precision": pr, "claim_checks": cc, "boundaries": bd, "held": res["held"], "records": rows,
            "shared_pages": {r["control_number"]: shared_with(r["control_number"]) for r in rows
                             if shared_with(r["control_number"])},
            "representation": "checks.gaps and checks.confidence added as the load reads the filed score; "
                              "checks.arithmetic, coverage, invented and the record unchanged",
            "claim_check_reads": ("Today's capture (sources.json): every course an entry names among the codes it "
                                  "found. The capture keeps no page text, so a note's quoted figures are the "
                                  "reader's words, never re-read here."),
            "follow_verdict": P.FOLLOW_VERDICT,
            "pre_read": P.confirm_pre_read(rows), "pre_read_md5": F.md5_pre_read(rows),
            "apply": P.confirm_guarded_apply(rows, a.tag + " piles"),
            "rollback": NG.rollback_sql(rows, a.tag + " piles rollback")}
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(body, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    rel = os.path.relpath(path, ROOT)
    hdr = ("-- %s lane 2's cheap piles at Contra Costa (named gaps %d). Each row's checks become the\n"
           "-- college load's image of its committed record (load_rows): checks.gaps and checks.confidence added; the\n"
           "-- record unchanged. Receipt: %s (before_image per row).\n" % (a.tag.upper(), len(rows), rel))
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
