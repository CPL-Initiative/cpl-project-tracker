#!/usr/bin/env python3
"""S720, lane 2's cheap piles at City College of San Francisco: the 26 keys S714 held, collected with gaps named.

#3714's receipt (S714) held 26 keys at the college: 20 of the census's reconcile_steps lever and S713's six. Today's
census (kb/status/harvest_gap_census.json, run 45319725062) lists the same 20 under reconcile_steps, 17954 under
reconcile_then_load, and four of S713's six under reader_page_search. Sam's ruling (2026-11-17,
sam-collect-with-gaps-2026-11-17): never drop a record for failing; collect it with its gaps noted and confidence
scores, a gap noted instead of a reread. No free rule from the committed files passes any of them (each rule the
S714 reasons name, a wrapper fill, an own-option reading, pool_lists with floors, a fill_to, is a reconcile step
over page text the committed files do not hold), so each record whose coverage and invented checks pass is collected
with a named gap, and the rest stay held with their reasons.

THE REVIEWED LIST (REVIEWED below, a hand reading of each record's own notes). An entry names the gap, the words of
the record's note that show it, and the computed and stated figures the record holds. The rule names the gap only
where the record still carries those words, coverage and invented pass, the arithmetic fails, and its figures are
exactly the entry's. The gaps (kb/_program_named_gaps.py):

  noted_no_total             (new, 40) the note says the catalog prints no total. 05482. total_not_printed itself is
                             filed only from kb/program_total_not_printed.json's page reads.
  noted_section_cut_off      (new, 20) the note says the section runs onto a page the read did not hold. 33208,
                             37781, 38907. section_cut_off itself is filed only at CUT_OFF_COLLEGES. Course-list
                             match is capped at 50, as for section_cut_off.
  lists_not_closed           (#3753's) a choice list prints no unit figure of its own. 16990, 38267.
  noted_figures_differ       (#3753's) the note quotes two figures that disagree. 40157, 41361.
  pool_figure_not_read       (new, 40) one figure over several lists or nested options, read as its parts. 16991,
                             38909.
  one_option_of_shared_page  (new, 30) one option of a shared page whose record holds every option. 17614-17619.
  pair_read_as_alternatives  (new, 50) two courses taken together read as separate alternatives. 39727.

THE CLAIM CHECK (p-claim-check-reads-current-capture-s713), today's capture (sources.json), a source the rule's
fields do not supply: every course an entry names is among the codes the capture found; a page the note says the
read did not hold is not among the capture's pages; the six CNIT programs share one capture page.

THE SELF-RECALL: HAND is the hand reading of all 21 records and the five with no record file; precision runs the
rule and the claim check over every key against it; boundary readings: the note's words gone, the stated total one
unit off, coverage failing; each names no gap.

    python3 kb/_program_piles_s720_ccsf.py --dry-run
    python3 kb/_program_piles_s720_ccsf.py --tag s720c

Guard: tests/program_piles_s720_ccsf_test.py.
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
COLLEGE = "City College of San Francisco"
SLUG = "city_of_san_francisco"
CENSUS = NG.CENSUS
LEVERS = ("reconcile_steps", "reconcile_then_load")
# S713's six (#3714's receipt): four in today's census under reader_page_search, 17954 under reconcile_then_load.
S713_SIX = ("17954", "09178", "17952", "31602", "36964", "42318")
CNIT = ("17614", "17615", "17616", "17617", "17618", "17619")
CNIT_WORDS = "Choose option 1, 2, 3, 4, 5, or 6"

REVIEWED = {
    "05482": {"gap": "noted_no_total", "computed": [42, 42], "stated": None,
              "words": "but the catalog prints no overall major total", "courses": ["VMD100", "VMD105"]},
    "33208": {"gap": "noted_section_cut_off", "computed": [3, 24], "stated": [21, 27],
              "words": "The text is cut off at the end of page 184", "not_page": 185},
    "37781": {"gap": "noted_section_cut_off", "computed": [10, 11], "stated": [14, 15],
              "words": "the start of the required course list are on page 252 and are not in the text", "not_page": 252},
    "38907": {"gap": "noted_section_cut_off", "computed": [17, 17], "stated": [16, 17],
              "words": "The supplied text begins mid-section on page 186", "not_page": 185},
    "16990": {"gap": "lists_not_closed", "computed": [5, 6], "stated": [18, 18],
              "words": "The catalog prints no unit figure for the Electives block"},
    "38267": {"gap": "lists_not_closed", "computed": [5, 6], "stated": [16, 18],
              "words": "the electives block prints no separate unit minimum"},
    "40157": {"gap": "noted_figures_differ", "computed": [17.5, 27], "stated": [19, 27],
              "words": "Both option headings print 'Units 2.0-5.0'", "courses": ["BTEC22", "BTEC24"]},
    "41361": {"gap": "noted_figures_differ", "computed": [20.5, 23.5], "stated": [20, 23.5],
              "words": "Required block stated 12.0-12.5 although the listed required courses sum to 12.5"},
    "16991": {"gap": "pool_figure_not_read", "computed": [19, 21], "stated": [18, 18],
              "words": "sit under a wrapper 'Choose 15 units from the following Units 15.0'", "courses": ["ITAL3A"]},
    "38909": {"gap": "pool_figure_not_read", "computed": [24, 24], "stated": [27, 27],
              "words": "Students must take a total of 12 elective units not already used in the core section"},
    "39727": {"gap": "pair_read_as_alternatives", "computed": [14, 18], "stated": [16, 18],
              "words": "recorded as CHIN 3 with alternatives CHIN 3A and CHIN 3B, where 3A and 3B must both be taken "
                       "together to substitute", "courses": ["CHIN3A", "CHIN3B"]},
}
for _cn in CNIT:
    REVIEWED[_cn] = {"gap": "one_option_of_shared_page", "computed": [18, 22], "stated": [21, 22],
                     "words": CNIT_WORDS, "shared": CNIT}
REVIEWED["17616"] = dict(REVIEWED["17616"], words="The option group is printed as 'Units 9.0-10.0'")

HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}
HAND.update({
    "19037": "held: the record's note says its page (p.207) reads as Liberal Arts and Sciences: Emphasis in Science "
             "and Mathematics, 17954's own section, not Biological Sciences: collecting it would show another "
             "program's requirements; whether the catalog prints Biological Sciences A.S. is a page read",
    "17954": "held: no live row (never loaded; the census's reconcile_then_load lever): a guarded UPDATE has no row "
             "to write; its 18-unit list read as two blocks waits on 19037's page read",
    "32079": "held: coverage fails: the state's file lists CS 110A, MATH 115 and STAT C1000, which the 2026-2027 page "
             "does not print; the census counts a gap only where coverage passes",
    "41315": "held: coverage fails: the state's file lists PSYC 23, which the page does not print; as 32079",
    "09178": "held: no record (S713): its list matches a third of the state's list",
    "17952": "held: no record (S713): the pages from its heading name none of the state's listed courses",
    "31602": "held: no record (S713): its requirements name none of the state's listed courses",
    "36964": "held: no record (S713): its list prints ESLN courses in hours, none on the state's list",
    "42318": "held: no record (S713): its list prints ESLN courses in hours, none on the state's list",
})


def census_members(path: str = CENSUS) -> list[str]:
    """The keys #3714 held: the census's members under LEVERS at the college, then S713's six not among them."""
    with open(path, encoding="utf-8") as fh:
        d = json.load(fh)
    out = []
    for lv in d.get("levers") or []:
        if lv.get("lever") in LEVERS and lv.get("scope") == COLLEGE:
            out += [m for m in lv.get("members") or [] if m not in out]
    return out + [cn for cn in S713_SIX if cn not in out]


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
    return e["gap"], words


def _sources() -> dict:
    with open(os.path.join(NG.COLLEGE_DIR, SLUG, "sources.json"), encoding="utf-8") as fh:
        return {str(x.get("control_number")): x for x in json.load(fh)}


def claim(filed: dict, src: dict | None = None) -> str:
    cn = str(filed.get("control_number"))
    e = REVIEWED.get(cn)
    src = _sources() if src is None else src
    s = src.get(cn)
    if not e or not s:
        return "no capture"
    found = {S.norm_code(x) for x in s.get("codes_found") or []}
    if any(S.norm_code(c) not in found for c in e.get("courses") or []):
        return "a named course not found"
    if e.get("not_page") is not None and e["not_page"] in ((s.get("source") or {}).get("pages") or []):
        return "the capture holds the page the note says the read lacked"
    if e.get("shared"):
        pages = {tuple((((src.get(o) or {}).get("source") or {}).get("pages") or [])) for o in e["shared"]}
        if len(pages) != 1 or not next(iter(pages)):
            return "the shared programs' capture pages differ"
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
        if gap == "noted_section_cut_off" and score["confidence"]["course_list_match"] is not None:
            score["confidence"]["course_list_match"] = min(score["confidence"]["course_list_match"],
                                                           NG.MAY_CONTINUE_CAP)
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
    ap.add_argument("--tag", default="s720c")
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
    path = os.path.join(NG.RECEIPTS, "program_requirement_records_piles_ccsf_%s_%s.json" % (day, a.tag))
    body = {"rule": NG.RULING + "; S720: City College of San Francisco's 26 keys S714 held, collected with their "
                                "gaps named (no reread)",
            "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", stamp), "college": COLLEGE,
            "census": {"file": os.path.relpath(CENSUS, ROOT), "levers": list(LEVERS), "s713_six": list(S713_SIX),
                       "members": census_members()},
            "gaps": {g: NG.GAPS[g] for g in sorted(by)}, "moved": len(rows), "by": by,
            "precision": pr, "claim_checks": cc, "boundaries": bd, "held": res["held"], "records": rows,
            "shared_pages": {r["control_number"]: shared_with(r["control_number"]) for r in rows
                             if shared_with(r["control_number"])},
            "representation": "checks.gaps and checks.confidence added as the load reads the filed score; "
                              "checks.arithmetic, coverage, invented and the record unchanged",
            "claim_check_reads": ("Today's capture (sources.json): every course an entry names among the codes it "
                                  "found; a page the note says the read lacked not among its pages; the six CNIT "
                                  "programs on one page. The capture keeps no page text, so a note's quoted figures "
                                  "are the reader's words, never re-read here."),
            "follow_verdict": P.FOLLOW_VERDICT,
            "pre_read": P.confirm_pre_read(rows), "pre_read_md5": F.md5_pre_read(rows),
            "apply": P.confirm_guarded_apply(rows, a.tag + " piles"),
            "rollback": NG.rollback_sql(rows, a.tag + " piles rollback")}
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(body, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    rel = os.path.relpath(path, ROOT)
    hdr = ("-- %s lane 2's cheap piles at City College of San Francisco (named gaps %d). Each row's checks become the\n"
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
