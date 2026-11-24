#!/usr/bin/env python3
"""S720, lane 2's cheap piles at Santa Monica: the 23 records S713 held for Sky, collected with their gaps named.

S713's receipt (program_requirement_records_piles_2026-11-23_s713.json, `held`) held 26 Santa Monica records under the
census's reconcile_steps lever: 6 on a runner page-text step (the wording step for "If completed entirely at SMC"
and the reconcile repeat step), 17 on a reread, and 3 for a person (03281, 10345, 43765; left to the lane's
person list, PERSON below, and untouched here). Today's census (kb/status/harvest_gap_census.json, run 45319725062)
lists the same 26. Sam's ruling (2026-11-17, sam-collect-with-gaps-2026-11-17): never drop a record for failing;
collect it with its gaps noted and confidence scores, a gap noted instead of a reread. The committed files hold no
page text, so neither runner step can run here, and no rule from the files alone passes a record: each of the 23 is
collected with a named gap where one is honest: 20 are, and 3 are held (41797, 43767, 21026).

THE REVIEWED LIST (REVIEWED below, a hand reading of each record's own notes, the shape of #3753 and #3755). An
entry names the gap, the words of the record's note that show it, and the computed and stated figures the record
holds; the rule names the gap only where the record still carries those words, coverage and invented pass, the
arithmetic fails, and its figures are exactly the entry's. The kinds, reused before any is added:

  lists_not_closed           (#3753) a list prints no unit figure of its own. 03256, 03272, 33339.
  noted_figures_differ       (#3753) the note quotes two printed figures that disagree. 03282, 03302, 33270, 33271,
                             35284, 37452.
  pool_figure_not_read       (#3755) one figure over several lists or options, read as its parts. 03263, 08970,
                             21007, 32792.
  pair_read_as_alternatives  (#3755) courses or groups taken together read as separate alternatives. 39671, 44004,
                             46189, and 39680 (each language track's culture course and its list, two blocks
                             taken together, the shape of 44004 and 46189: #3755's reader).
  catalog_figures_differ     (existing, S681) each list matches its printed figure and the lists sum past the
                             printed total; filed only where figures_differ_fails reads the record meeting the
                             sentence. It holds 41797 (the lists meet the printed total's high end), so 41797 is
                             held: the one record of the 23 with no honest kind.
  repeat_read_once           (new, 60) a course taken more than once counted once. 43655, 43743, 44720. No existing
                             kind fits: the page's own figures agree with each other (so neither figures kind), and
                             the record names every course (so no list or pool kind); the shortfall is exactly the
                             repeats, which the entry's arithmetic check proves.

THE CLAIM CHECK (p-claim-check-reads-current-capture-s713), today's capture (sources.json), a source the rule's
fields do not supply: every course an entry names is among the codes the capture found.

THE SELF-RECALL: HAND is the hand reading of the 23; precision runs the rule and the claim check over each against
it; boundary readings: the note's words gone, the stated total one unit off, coverage failing, and a repeat one
time short; each names no gap.

    python3 kb/_program_piles_s720_smc.py --dry-run
    python3 kb/_program_piles_s720_smc.py --tag s720s

Guard: tests/program_piles_s720_smc_test.py.
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
COLLEGE = "Santa Monica College"
SLUG = "santa_monica"
CENSUS = NG.CENSUS
LEVERS = ("reconcile_steps",)
PERSON = ("03281", "10345", "43765")

REVIEWED = {
    "03256": {"gap": "lists_not_closed", "computed": [22, 28], "stated": [28, 28],
              "words": "List B has no fixed minimum"},
    "03272": {"gap": "lists_not_closed", "computed": [22, 37], "stated": [39, 39],
              "words": "Option 2 electives block prints no unit minimum"},
    "33339": {"gap": "lists_not_closed", "computed": [17, 20], "stated": [18, 18],
              "words": "it is a substitution path, not an additional requirement, so minimum and stated were left null"},
    "03282": {"gap": "noted_figures_differ", "computed": [82, 82], "stated": [82.5, 82.5],
              "words": "the 2nd Year Fall Semester block is stated as 14.5 units while its printed course units sum to 14",
              "courses": ["RC11L"]},
    "03302": {"gap": "noted_figures_differ", "computed": [27.5, 27.5], "stated": [26.5, 26.5],
              "words": "which does not match the stated 26.5 units"},
    "33270": {"gap": "noted_figures_differ", "computed": [19, 22], "stated": [18, 18],
              "words": "'If completed entirely at SMC, the Area of Emphasis requires 19 units'"},
    "33271": {"gap": "noted_figures_differ", "computed": [21, 24], "stated": [20, 20],
              "words": "'If completed entirely at SMC, the Area of Emphasis requires 21 units.'"},
    "35284": {"gap": "noted_figures_differ", "computed": [27, 28], "stated": [26, 26],
              "words": "'If completed entirely at SMC, the academic path requires 27 units.'"},
    "37452": {"gap": "noted_figures_differ", "computed": [21, 22], "stated": [18, 18],
              "words": "The core block prints '(9 units)' for 'Select 2 courses' of 3 units each (6 units)"},
    "03263": {"gap": "pool_figure_not_read", "computed": [15, 17], "stated": [18, 18],
              "words": "the 8-unit minimum applies to the elective area combined (Group A + Group B)"},
    "08970": {"gap": "pool_figure_not_read", "computed": [18, 23], "stated": [27, 27],
              "words": "the student selects 2 of the 5 groups (12 units), not one"},
    "21007": {"gap": "pool_figure_not_read", "computed": [18, 23], "stated": [27, 27],
              "words": "the student selects 2 of the 5 groups (12 units), not 1"},
    "32792": {"gap": "pool_figure_not_read", "computed": [15, 21], "stated": [18, 18],
              "words": "the remaining 3 units may come from either list"},
    "39680": {"gap": "pair_read_as_alternatives", "computed": [9, 13], "stated": [16, 16],
              "words": "is printed as one option of 'Select 1 Language Track' with '(10 units minimum)'"},
    "39671": {"gap": "pair_read_as_alternatives", "computed": [7, 10], "stated": [9, 9],
              "words": "the alternative to ANTHRO 35s is the pair ERTHSC 88A and ERTHSC 88B taken together",
              "courses": ["ERTHSC88A", "ERTHSC88B"]},
    "44004": {"gap": "pair_read_as_alternatives", "computed": [13, 17], "stated": [14, 19],
              "words": "The second path requires BOTH group blocks"},
    "46189": {"gap": "pair_read_as_alternatives", "computed": [21, 25], "stated": [22, 27],
              "words": "The second path requires BOTH group blocks"},
    "41797": {"gap": "catalog_figures_differ", "computed": [14, 15], "stated": [13, 15],
              "words": "the printed block total is 5-6", "figures_differ": True},
    "43655": {"gap": "repeat_read_once", "computed": [3, 3], "stated": [12, 12],
              "words": "The catalog lists MUSIC 92 (2 units) four times and MUSIC 94 (1 unit) four times",
              "repeats": [["MUSIC 92", 2, 4], ["MUSIC 94", 1, 4]], "courses": ["MUSIC92", "MUSIC94"]},
    "43743": {"gap": "repeat_read_once", "computed": [10, 10], "stated": [12, 12],
              "words": "MUSIC 64 (Piano Ensemble, 2 units) is printed twice in the required list",
              "repeats": [["MUSIC 64", 2, 2]], "courses": ["MUSIC64"]},
    "44720": {"gap": "repeat_read_once", "computed": [10, 10], "stated": [12, 12],
              "words": "MUSIC 49 (2 units) is printed twice under Required Courses",
              "repeats": [["MUSIC 49", 2, 2]], "courses": ["MUSIC49"]},
}
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}
# figures_differ_fails holds 41797 off catalog_figures_differ (its lists, 5-6, 3 and 6, meet the printed 15 at the
# high end), and its note quotes no second total for noted_figures_differ.
# #3753's second reader's BLOCKER class: 43767's note infers its Barbering heading (it sits on a page the read did not
# hold), and capture.json's shared_pages puts its page with 03302 and 40812, so whether it read its own section is a
# page read: held, never a gap.
HAND["43767"] = ("held: its Barbering heading is inferred (on a page the read did not hold) and capture.json's "
                 "shared_pages puts its page with 03302 and 40812: whether it read its own section is a page read")
# #3755's reader (MAJOR 1): 21026's cited note quotes one figure (26.5); none of its own notes quotes the 27.5 its
# courses add to (03302's does), so noted_figures_differ's sentence does not hold on its own words.
HAND["21026"] = ("held: its notes quote only the printed 26.5 (none quotes the 27.5 its courses add to, which "
                 "03302's note does), so no kind's sentence holds on its own words")
HAND["41797"] = ("held: the lists print 5-6, 3 and 6 (14-15) under a printed 13-15; catalog_figures_differ needs the "
                 "lists past the total at both ends, and the note quotes no second total; a person or a page read")


def census_members(path: str = CENSUS) -> list[str]:
    """The 23: the census's reconcile_steps members at the college, less the three left for a person."""
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
    if e.get("repeats") and not repeats_close(filed, e):
        return None
    if e.get("figures_differ") and NG.figures_differ_fails(filed):
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
    ap.add_argument("--tag", default="s720s")
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
    path = os.path.join(NG.RECEIPTS, "program_requirement_records_piles_smc_%s_%s.json" % (day, a.tag))
    body = {"rule": NG.RULING + "; S720: Santa Monica's 23 records S713 held for Sky, collected with their gaps "
                                "named (no reread)",
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
    hdr = ("-- %s lane 2's cheap piles at Santa Monica (named gaps %d). Each row's checks become the\n"
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
