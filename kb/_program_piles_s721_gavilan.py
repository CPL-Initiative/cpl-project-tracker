#!/usr/bin/env python3
"""S721, lane 2's cheap piles at Gavilan: the census's 18 wording-rule records, collected with gaps named.

The census on main (kb/status/harvest_gap_census.json, run 45384590964) lists 18 Gavilan College records under the
reconcile_steps lever ("correction rules from the catalog's own wording, then rescores the saved record"). Sam's
ruling (2026-11-17, sam-collect-with-gaps-2026-11-17): never drop a record for failing; collect it with its gaps
noted and confidence scores, a gap noted instead of a reread. No rule its own catalog page prints passes one
without changing its record, so each record takes a named gap where one is honest.

THE REVIEWED LIST (REVIEWED below, a hand reading of each record's own notes and blocks, the shape of S720's El
Camino and Contra Costa piles), with the three guards: scorer_passes, on_live_run and the own-section guard (no
member's page is shared). Every kind is reused, and each entry carries a check on the record's own figures:

  noted_figures_differ  (#3753) a figure the page prints over courses that add to another, and the record's sum
                        differs from its stated total by exactly that difference at both ends (the "noted" check):
                        08460 (30-36 over 36), 15555 (13 over 3 + 3 + 8 = 14), 19378 (14-24 over 14 + 10 = 24),
                        37750 (27-34 over 32-35), 38787 (the core's 42-48 over 47-48). 08460 and 38787 are two of
                        the six S703 held from lists_past_their_figure (d-lists-gap-holds-range-sums-s703: the sum
                        sits inside the printed range). That kind says the courses carry past the figure; this one
                        says only that the two printed figures disagree, which the notes quote.
  pool_figure_not_read  (#3755) one figure the page prints over several lists, and the record adds the parts; with
                        the pool at its figure the page's figures add to the stated total exactly (the "closes"
                        check): 06129 (the core's 13-15, the section's 11 and general education's 35-39 make the
                        printed 59-65), 39624 (the core choice's 12-20 and the placement list's 0-22 make the printed
                        12-42).
  lists_not_closed      (#3753) an elective list whose figure depends on another choice, or one more course taken
                        from any list: 14041 (electives to a total 18 in the major), 18453 (an additional course from
                        any area to reach 18), 38119 (electives whose units vary by option).

Held (8): 06128 (MUS 12's printed 1-4 puts the printed 21 inside the record's 20-23, and no list prints a figure:
nearest #3762's figure_within_variable_units, which is not on main); 06132 (two gaps at once: the BIO pair read
singly and the prerequisites' printed 46.5-51.5 over courses adding to 22-26); 08464 (no notes, and its committed
run is not its live row's: on_live_run); 18541 (two printed figures differ from their courses, ACCT 20 sits in both
lists and the last core choice is ambiguous); 24369 (noncredit: a printed 0 over figures the note says may be
hours); 37896 (the core's 23 against its printed 22 explains the low end only); 41394 (its note reads the 3-4 block
as a 3-unit option the record does not hold); 45357 (a two-part read with empty duplicate blocks, and Areas 4 and 7
print figures their rules contradict).

THE CLAIM CHECK (p-claim-check-reads-current-capture-s713): every course an entry names is among the codes today's
capture (sources.json) found. THE SELF-RECALL: HAND is the hand reading of the 18; precision runs the rule and the
claim check over each; boundary readings: the note's words gone, the stated total one unit off, coverage failing,
and each entry's own figure check moved one unit.

    python3 kb/_program_piles_s721_gavilan.py --dry-run
    python3 kb/_program_piles_s721_gavilan.py --tag s721d

Guard: tests/program_piles_s721_gavilan_test.py.
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
COLLEGE = "Gavilan College"
SLUG = "gavilan"
CENSUS = NG.CENSUS
LEVERS = ("reconcile_steps",)
PERSON = ()

REVIEWED = {
    # noted_figures_differ: "noted" is the two figures the note quotes, the printed one and what its courses add to;
    # the record's computed less its stated is their difference at both ends.
    "08460": {"gap": "noted_figures_differ", "computed": [36, 36], "stated": [30, 36],
              "noted": {"printed": [30, 36], "sum": [36, 36]},
              "words": "The requirements block states 'Units: 30- 36', but the three listed courses total 36 units"},
    "15555": {"gap": "noted_figures_differ", "computed": [62, 68], "stated": [61, 67],
              "noted": {"printed": [13, 13], "sum": [14, 14]},
              "words": "Note 3 + 3 + 8 = 14, which does not match the printed 13"},
    "19378": {"gap": "noted_figures_differ", "computed": [24, 24], "stated": [14, 24],
              "noted": {"printed": [14, 24], "sum": [24, 24]},
              "words": "the two blocks (14 + 10) sum to 24, so the low end of 14 looks inconsistent"},
    "37750": {"gap": "noted_figures_differ", "computed": [32, 35], "stated": [27, 34],
              "noted": {"printed": [27, 34], "sum": [32, 35]},
              "words": "Summing the listed courses gives 32-35 major units, which does not match 27-34"},
    "38787": {"gap": "noted_figures_differ", "computed": [53, 60], "stated": [48, 60],
              "noted": {"printed": [42, 48], "sum": [47, 48]},
              "words": "The Required Core prints 'Units: 42- 48', while the listed courses sum to 47-48 units"},
    # pool_figure_not_read: "closes" names the figures the page prints, the pool once, which add to the stated total.
    "06129": {"gap": "pool_figure_not_read", "computed": [22, 30], "stated": [59, 65],
              "closes": [["block", "CORE COURSES"], ["block", "ADDITIONAL REQUIREMENTS (11 unit minimum)"], ["ge"]],
              "words": "section's stated 11 units covers the whole section (THEA 13B/13C/13D, the choose-two list, and "
                       "the additional-units list)"},
    "39624": {"gap": "pool_figure_not_read", "computed": [0, 42], "stated": [12, 42],
              "closes": [["figure", [12, 20], "prints 'Units: 12- 20'"], ["block", "Depending on placement"]],
              "words": "The CORE heading prints 'Units: 12- 20' for the two-sequence choice as a whole"},
    # lists_not_closed: "open" names the choose-units elective list whose figure depends on another choice; "short"
    # says the lists alone fall short of the stated total at the high end.
    "14041": {"gap": "lists_not_closed", "computed": [17, 19], "stated": [18, 18], "open": "Electives",
              "words": "the actual rule is enough elective units to reach 18 in the major"},
    "18453": {"gap": "lists_not_closed", "computed": [15, 17], "stated": [18, 18], "short": True,
              "words": "an additional course may be taken from any area to reach the 18-unit minimum"},
    "38119": {"gap": "lists_not_closed", "computed": [2, 29], "stated": [18, 18], "open": "ELECTIVES",
              "words": "Electives block minimum left null because its required units vary by option"},
}
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}
HAND.update({
    "06128": "held: MUS 12's printed 1-4 puts the printed 21 inside the record's 20-23, and no list prints a figure "
             "of its own; the nearest kind is #3762's figure_within_variable_units, which is not on main",
    "06132": "held: two gaps at once, the BIO pair (BIO 7 and BIO 9 together) read as alternatives and the "
             "prerequisites' printed 46.5-51.5 over courses adding to 22-26, so the record's 93.5-98.5 takes "
             "neither reading exactly",
    "08464": "held: the record carries no notes, so no gap's sentence stands on its own words; and no committed "
             "receipt posts its committed run (44090922437) to its live row (on_live_run)",
    "18541": "held: the core's printed 9-19 and the additional requirements' 13.5-14.5 both differ from their "
             "courses, ACCT 20 sits in both lists and the last core choice is ambiguous: a reread or a person",
    "24369": "held: noncredit, its printed 'Total: 0' is a credit figure and the note says the course figures (6 and "
             "1-6) may be hours: a measure question no kind names",
    "37896": "held: the core's 23 against its printed 22 explains the low end (65 against 64) only; the high end's 72 "
             "comes from general education read at 26-32 and ENGR 3's 4 units: a reread",
    "41394": "held: its note reads the 3-4 block (BUS 11 or STAT C1000, both 4) as a 3-unit option the record does "
             "not hold, a missing course rather than two figures that disagree: a reread",
    "45357": "held: read in two parts that left empty duplicate blocks, and Areas 4 and 7 print figures their rules "
             "contradict (6 units over three courses; 6 under a '(3 units)' heading): a reread",
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
    if isinstance(v, dict):
        v = [v.get("min"), v.get("max")]
    if v is None or v[0] is None or v[1] is None:
        return None
    return [float(v[0]), float(v[1])]


def _same(a, b) -> bool:
    a, b = _pair(a), _pair(b)
    if a is None or b is None:
        return a is b
    return all(abs(x - y) <= NG.FIG_EPS for x, y in zip(a, b))


def _blocks(filed: dict) -> list[dict]:
    return (filed.get("record") or {}).get("blocks") or []


def _block(filed: dict, prefix: str) -> list[dict]:
    return [b for b in _blocks(filed) if str(b.get("name") or "").startswith(prefix)]


def _notes(filed: dict) -> list[str]:
    return [str(n) for n in (filed.get("record") or {}).get("notes") or []]


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


def noted_closes(e: dict) -> bool:
    """noted_figures_differ's figures: the record's computed less its stated is the noted sum less the noted printed
    figure, at both ends (the difference is the one the note quotes, and nothing else)."""
    comp, st = _pair(e["computed"]), _pair(e["stated"])
    pr, sm = _pair(e["noted"]["printed"]), _pair(e["noted"]["sum"])
    return all(abs((c - s) - (m - p)) <= NG.FIG_EPS for c, s, m, p in zip(comp, st, sm, pr))


def pool_closes(filed: dict, e: dict) -> bool:
    """pool_figure_not_read's figures: the figures the page prints (each named block's stated figure, the program's
    general education units, a figure a note quotes), the pool counted once, add to the stated total at both ends."""
    lo = hi = 0.0
    notes = " ".join(_notes(filed))
    for src in e["closes"]:
        if src[0] == "block":
            bs = _block(filed, src[1])
            v = _pair(bs[0].get("stated")) if len(bs) == 1 else None
        elif src[0] == "ge":
            v = _pair(((filed.get("record") or {}).get("program") or {}).get("ge_units"))
        else:
            v = _pair(src[1]) if src[2] in notes else None
        if v is None:
            return False
        lo, hi = lo + v[0], hi + v[1]
    st = _pair(e["stated"])
    return abs(lo - st[0]) <= NG.FIG_EPS and abs(hi - st[1]) <= NG.FIG_EPS


def list_open(filed: dict, e: dict) -> bool:
    """lists_not_closed's figures: the named elective list is one choose-units list (its figure is the one that
    depends on another choice), or the lists alone fall short of the stated total at the high end."""
    comp, st = _pair(e["computed"]), _pair(e["stated"])
    if e.get("open"):
        bs = _block(filed, e["open"])
        if len(bs) != 1 or bs[0].get("rule") != "choose_units":
            return False
    if e.get("short") and not comp[1] + NG.FIG_EPS < st[0]:
        return False
    return bool(e.get("open") or e.get("short"))


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
    if e.get("noted") and not noted_closes(e):
        return None
    if e.get("closes") and not pool_closes(filed, e):
        return None
    if e["gap"] == "lists_not_closed" and not list_open(filed, e):
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
    if shared_with(cn) and not any(e.get("own_section") and e["own_section"] in n for n in _notes(filed)):
        # #3753's own_page guard: a page shared_pages lists another program on is the record's own only where a
        # note names the record's own section (East Los Angeles's second reader, 38168).
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


def _moved(e: dict) -> dict:
    """The entry with its own figure check one unit off: the noted sum, the pool's stated total, or the open list's
    name (an elective list the record does not hold) and the short list's total brought within reach."""
    e = copy.deepcopy(e)
    if e.get("noted"):
        e["noted"]["sum"] = [e["noted"]["sum"][0] + 1, e["noted"]["sum"][1] + 1]
    elif e.get("closes"):
        e["closes"] = e["closes"][:-1]
    elif e.get("open"):
        e["open"] = e["open"] + " (not a list)"
    elif e.get("short"):
        e["stated"] = [e["computed"][1], e["computed"][1]]
    return e


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
        moved = _moved(REVIEWED[cn])
        if moved.get("short"):
            # The short list's case: the record's own stated total brought within the lists' reach.
            g = copy.deepcopy(f)
            g["score"]["arithmetic"]["stated"] = moved["stated"]
            tally("its own figure check moved", gap_noted(g, dict(REVIEWED, **{cn: moved})) is None, cn)
        else:
            tally("its own figure check moved", gap_noted(f, dict(REVIEWED, **{cn: moved})) is None, cn)
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
    ap.add_argument("--tag", default="s721d")
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
    path = os.path.join(NG.RECEIPTS, "program_requirement_records_piles_s721_gavilan_%s_%s.json" % (day, a.tag))
    body = {"rule": NG.RULING + "; S721: Gavilan's 18 wording-rule records, collected with their gaps named where one "
                                "is honest (no reread)",
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
    hdr = ("-- %s lane 2's cheap piles at Gavilan (named gaps %d). Each row's checks become the\n"
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
