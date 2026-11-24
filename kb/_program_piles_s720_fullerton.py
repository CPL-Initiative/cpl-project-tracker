#!/usr/bin/env python3
"""S720, lane 2's cheap piles at Fullerton: the 13 records S714 held, collected with their gaps named, no reread.

Handoff 716's blocks list 13 Fullerton records S714 held (#3719's receipt, `held`). Today's census
(kb/status/harvest_gap_census.json, run 45319725062) lists the same 13 under the reconcile_steps lever. Sam's ruling
(2026-11-17, sam-collect-with-gaps-2026-11-17): never drop a record for failing; collect it with its gaps noted and
confidence scores, and note a gap instead of paying for a reread. No free rule from the committed files passes any
of the 13 (a units floor would change the record, and the plans of this lane change checks alone), so each record
whose coverage and invented checks pass is collected with a named gap, and the three whose coverage fails stay held:
the census counts a gap as collected only where coverage and invented pass.

THE REVIEWED LIST (REVIEWED below, a hand reading of each record's own notes, never a pattern over free text). An
entry names the gap, the words of the record's note that show it, and the computed and stated figures the record
holds. The rule names the gap only where the record still carries those words, coverage and invented pass, the
arithmetic fails, and its figures are exactly the entry's; a rescore that moves a figure withdraws the gap. Four
gaps, added to kb/_program_named_gaps.py's GAPS:

  noted_figures_differ  the reader's note quotes two figures from the page that disagree (a description and a table,
                        or a heading and its Total Units line), and the record's sum and stated total are those two
                        figures. Unit arithmetic 40.
  noted_unit_floor      the page sets a minimum for a variable-unit course above the units printed beside it, and
                        with that minimum the courses add exactly to the printed total. Unit arithmetic 70.
  lists_not_closed      a choice list prints no unit figure of its own, one that depends on another choice, or also
                        takes courses from another list, so the lists alone cannot add the program's units. Unit
                        arithmetic 30.
  no_own_page_total     the record was read from another award's page, which prints this program's courses inside
                        its own requirements and no total for this program. Unit arithmetic 20.

  pool_figure_not_read  (#3755's kind, by #3753's second reader) one figure over several lists, read as its parts
                        (18163). Unit arithmetic 40.

#3753'S SECOND READER (FIX THEN APPLY): a page capture.json's shared_pages lists another program on is never the
record's own, so 35174 is held with 36798 (both on the UC-transfer page); a record today's scorer passes on its own
record (S.score, no closed list, no text) is rescored, never gap-filed, so 33680 and 42143 are held for a closed-list
rescore; no_own_page_total and one_option_of_shared_page score their source at most 50 (OTHER_PAGE_SOURCE). Six rows
remain: 03853, 03866, 18163, 08420, 42394, 08422.

THE CLAIM CHECK (p-claim-check-reads-current-capture-s713), a second source the rule's fields do not supply: today's
capture (sources.json) must show the page the entry says the record was read from (its h1 names the program's award
for an own-page gap, another award for no_own_page_total), and every course an entry names must be among the codes
the capture found. A record whose claim does not stand is held.

THE SELF-RECALL (p-self-recall-reads-rule-fields-s703): HAND is the hand reading of all 13; the precision count runs
the rule and the claim check over every census member against it; boundary readings: the note's words gone, the
stated total one unit off, coverage failing, and the floor's course one unit off, each naming no gap.

    python3 kb/_program_piles_s720_fullerton.py --dry-run
    python3 kb/_program_piles_s720_fullerton.py --tag s720f

Guard: tests/program_piles_s720_fullerton_test.py.
"""
from __future__ import annotations

import argparse
import collections
import copy
import json
import os
import re
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_named_gaps as NG  # noqa: E402
import _program_piles_s713 as P  # noqa: E402
import _program_piles_s714_fullerton as F  # noqa: E402
import _program_requirements_score as S  # noqa: E402

ROOT = os.path.dirname(HERE)
COLLEGE = F.COLLEGE
SLUG = F.SLUG
LEVER = F.LEVER
CENSUS = NG.CENSUS
GAPS = ("noted_figures_differ", "noted_unit_floor", "lists_not_closed", "no_own_page_total")

# The hand reading of each record's own notes (S720). "page": "own" where the capture's h1 must name the record's
# own award, "other" where it must name another award (no_own_page_total). "courses": codes the capture must find.
REVIEWED = {
    "08420": {"gap": "noted_figures_differ", "computed": [31, 32], "stated": [27, 27], "page": "own",
              "words": "but the table prints 'Total Units 31-32'", "courses": ["MUS108F", "MUS291F"]},
    "35174": {"gap": "noted_figures_differ", "computed": [48, 48], "stated": [47, 48], "page": "own",
              "words": "the course table heading and footer print 48 units ('Required Core (48 units)', "
                       "'Total Units 48')", "courses": []},
    "42394": {"gap": "noted_unit_floor", "computed": [14, 16], "stated": [16, 16], "page": "own",
              "words": "A footnote requires 4 units of NUTR 295 F (printed 2-4)", "courses": ["NUTR295F"],
              "floor": {"code": "NUTR 295 F", "printed": 2, "floor": 4}},
    "42143": {"gap": "noted_unit_floor", "computed": [17, 19], "stated": [18, 19], "page": "own",
              "words": "ARTH 295 F must be taken for a minimum of 3 units", "courses": ["ARTH295F"],
              "floor": {"code": "ARTH 295 F", "printed": 2, "floor": 3}},
    "03853": {"gap": "lists_not_closed", "computed": [18, 19], "stated": [18, 22], "page": "own",
              "words": "no unit minimum is printed for the block, so minimum is null", "courses": []},
    "03866": {"gap": "lists_not_closed", "computed": [16, 22], "stated": [19, 19], "page": "own",
              "words": "List C minimum depends on the core option", "courses": []},
    "18163": {"gap": "pool_figure_not_read", "computed": [4, 10], "stated": [18, 22], "page": "own",
              "words": "the 18-22 unit total applies to A and B together", "courses": []},
    "33680": {"gap": "lists_not_closed", "computed": [20, 26], "stated": [22, 26], "page": "own",
              "words": "List B also allows 'any LIST A course not already used'", "courses": []},
    "08422": {"gap": "no_own_page_total", "computed": [20.5, 25], "stated": None, "page": "other",
              "words": "The source text is the Musical Theatre Level 2 Certificate page", "courses": []},
    # Read from the UC-transfer degree's page: the claim check holds it (its h1 names the A.S.-UCT, not the A.S.-T).
    "36798": {"gap": "noted_figures_differ", "computed": [48, 48], "stated": [47, 48], "page": "own",
              "words": "the course table prints 'Required Core (48 units)' and 'Total Units 48'", "courses": []},
}
# The hand answer for every census member: the gap it should take, or "held: why".
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}
HAND.update({
    # #3753's second reader (BLOCKER): capture.json's shared_pages puts 35174 and 36798 on the UC-transfer page, and
    # the state's UCTP Chemistry (41936) is the program that page prints; 35174's own note cites 2S41936.
    "35174": "held: capture.json's shared_pages puts it on the Chemistry Associate in Science Degree for UC Transfer "
             "page with 36798, and its own note cites program 2S41936 (the state's UCTP Chemistry, 41936); a "
             "page-finding step (reader_page_assignment), never a gap",
    # #3753's second reader (MAJOR): today's scorer passes both on their own records (the 2026-10-30 printed floor,
    # S.score with no closed list: 18-19 and 22-26), so neither takes a gap; a closed-list rescore settles them.
    "42143": "held: today's scorer passes it on its record (18-19, equal); a closed-list rescore, never a gap",
    "33680": "held: today's scorer passes it on its record (22-26, equal; the ESC lecture-lab pair); a closed-list "
             "rescore, never a gap",
    "36798": "held: today's capture reads it from the Chemistry Associate in Science Degree for UC Transfer page, "
             "not its own A.S.-T page; a page-finding step (reader_page_assignment), never a gap",
    "18166": "held: coverage fails (BUS 101 F, WELL 230 F, CISG 100 F and F PE248 not placed): the Category C list is "
             "cut off after PE 144 F (MAY_CONTINUE_REVIEWED); the census counts a gap only where coverage passes",
    "18749": "held: coverage fails: the state's file lists THEA 231 F, which the page does not print; a retired-course "
             "reading needs the course catalog's own page, not in the committed files",
    "36863": "held: coverage fails: the state's file lists PE 108 F, which the page does not print; as 18749",
})


def _pair(v):
    return None if v is None else [float(v[0]), float(v[1])]


def _same(a, b) -> bool:
    a, b = _pair(a), _pair(b)
    if a is None or b is None:
        return a is b
    return all(abs(x - y) <= NG.FIG_EPS for x, y in zip(a, b))


def _course(filed: dict, code: str) -> dict | None:
    for b in (filed.get("record") or {}).get("blocks") or []:
        for c in b.get("courses") or []:
            if c.get("code") == code:
                return c
    return None


def scorer_passes(filed: dict) -> bool:
    """Today's scorer passes the record's own arithmetic (S.score with no closed list and no text, so no electives
    fill): such a record is rescored, never gap-filed (#3753's second reader, MAJOR)."""
    a = S.score(filed.get("record") or {}, [], "", filed.get("award")).get("arithmetic") or {}
    return a.get("status") == "equal"


def shared_with(cn: str) -> list[str]:
    """The other programs capture.json's shared_pages lists on the record's page."""
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
    notes = [str(n) for n in (filed.get("record") or {}).get("notes") or []]
    words = next((n for n in notes if e["words"] in n), None)
    if not words or not NG.collectable(sc) or a.get("pass") or S.passes_live(sc):
        return None
    if not _same(a.get("computed"), e["computed"]) or not _same(a.get("stated"), e["stated"]):
        return None
    if scorer_passes(filed):
        return None
    fl = e.get("floor")
    if fl:
        c = _course(filed, fl["code"])
        st, comp = _pair(e["stated"]), _pair(e["computed"])
        if (not c or c.get("units") != fl["printed"]
                or abs(comp[0] + fl["floor"] - fl["printed"] - st[0]) > NG.FIG_EPS or abs(comp[1] - st[1]) > NG.FIG_EPS):
            return None
    return e["gap"], words


AWARD_H1 = (("T Degree", "for Transfer"), ("A.A.", "Associate in Arts"), ("A.S.", "Associate in Science"),
            ("Certificate", "Certificate"))


def _sources() -> dict:
    with open(os.path.join(NG.COLLEGE_DIR, SLUG, "sources.json"), encoding="utf-8") as fh:
        return {str(x.get("control_number")): x for x in json.load(fh)}


def own_page(filed: dict, e: dict) -> bool:
    """The capture's h1 names the record's title and its award: a transfer degree's page says 'for Transfer' (never
    'for UC Transfer'), an A.A. 'Associate in Arts', an A.S. 'Associate in Science', a certificate 'Certificate'; and
    the title's level ('Level 1') is the h1's. A page capture.json's shared_pages lists another program on is never
    the record's own (#3753's second reader, BLOCKER)."""
    return not shared_with(filed.get("control_number")) and own_h1(filed, e)


def own_h1(filed: dict, e: dict) -> bool:
    """The capture's h1 alone names the record's title, award and level."""
    h1 = ((e.get("source") or {}).get("h1") or "")
    award = str(filed.get("award") or "")
    title = str(e.get("title") or "")
    if title.lower() not in h1.lower():
        return False
    for key, want in AWARD_H1:
        if key in award:
            if want not in h1 or (want == "for Transfer" and "UC Transfer" in h1):
                return False
            break
    lv = re.search(r"\bLevel\s+\d\b", title)
    return not lv or lv.group(0) in h1


def claim(filed: dict, src: dict | None = None, reviewed: dict | None = None) -> str:
    """'stands' where today's capture shows the page the entry names and finds every course it names."""
    e = (REVIEWED if reviewed is None else reviewed).get(str(filed.get("control_number")))
    s = (src if src is not None else _sources()).get(str(filed.get("control_number")))
    if not e or not s:
        return "no capture"
    found = {S.norm_code(x) for x in s.get("codes_found") or []}
    if any(S.norm_code(c) not in found for c in e.get("courses") or []):
        return "a named course not found"
    own = own_page(filed, s)
    if e["page"] == "own" and not own:
        return "the capture's page is not the program's own"
    if e["page"] == "other":
        title = str(s.get("title") or "")
        h1 = (s.get("source") or {}).get("h1") or ""
        if own_h1(filed, s) or not re.sub(r"\s*Level\s+\d\b", "", title).lower() in h1.lower():
            return "the capture's page is not another award's"
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
    for cn in F.census_members(census_path):
        f = F._load(cn)
        if f is None:
            out["no_record_file"] += 1
            continue
        if cn not in HAND:
            out["not_hand_held"] += 1
            continue
        truth = HAND[cn] if not HAND[cn].startswith("held") else "none"
        out["read"] += 1
        out["by_answer"][truth] += 1
        got = outcome(f, src)[0]
        if got == truth:
            out["right"] += 1
        else:
            out["wrong"].append([cn, truth, got])
    out["by_answer"] = dict(out["by_answer"])
    return out


def claim_checks(census_path: str = CENSUS) -> dict:
    out = collections.Counter()
    not_standing = []
    src = _sources()
    for cn in F.census_members(census_path):
        f = F._load(cn)
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

    for cn in F.census_members(census_path):
        f = F._load(cn)
        if f is None or not gap_noted(f):
            continue
        g = copy.deepcopy(f)
        e = REVIEWED[cn]
        g["record"]["notes"] = [str(n).replace(e["words"], "") for n in g["record"].get("notes") or []]
        tally("the note's words gone", gap_noted(g) is None, cn)
        g = copy.deepcopy(f)
        a = g["score"]["arithmetic"]
        if a.get("stated") is not None:
            a["stated"] = [a["stated"][0] + 1, a["stated"][1] + 1]
        else:
            a["stated"] = [1.0, 1.0]
        tally("the stated total one unit off", gap_noted(g) is None, cn)
        g = copy.deepcopy(f)
        g["score"]["coverage"] = dict(g["score"]["coverage"], **{"pass": False})
        tally("coverage failing", gap_noted(g) is None, cn)
        if e.get("floor"):
            g = copy.deepcopy(f)
            _course(g, e["floor"]["code"])["units"] = e["floor"]["printed"] + 1
            tally("the floor's course one unit off", gap_noted(g) is None, cn)
    return {"counts": dict(out), "wrong": wrong}


def plan(write: bool, census_path: str = CENSUS) -> dict:
    rows, held, hits = [], [], []
    src = _sources()
    year = None
    cap = os.path.join(NG.COLLEGE_DIR, SLUG, "capture.json")
    if os.path.isfile(cap):
        with open(cap, encoding="utf-8") as fh:
            year = json.load(fh).get("catalog_year")
    for cn in F.census_members(census_path):
        f = F._load(cn)
        if f is None:
            held.append({"control_number": cn, "why": "no record file"})
            continue
        if S.passes_live(f.get("score")) or (f.get("score") or {}).get("gaps"):
            continue
        gap, words, c = outcome(f, src)
        if gap == "none":
            held.append({"control_number": cn, "why": HAND.get(cn, "not hand-held"), "claim": c})
            continue
        e = src.get(cn) or {}
        score = copy.deepcopy(f["score"])
        score["gaps"] = [{"gap": gap, "label": NG.GAPS[gap], "words": words}]
        score["confidence"] = NG.confidence(dict(f, score=score), gap, e.get("method"),
                                            (e.get("catalog_year") or year) == year)
        hits.append((cn, f, score, gap, words))
    before = NG._load_images({COLLEGE}) if write and hits else {}
    for cn, f, score, gap, words in hits:
        row = {"college": COLLEGE, "control_number": cn, "award": f.get("award"),
               "extracted_run": f.get("extracted_run"), "moves_to": gap, "words": words,
               "confidence": score["confidence"], "path": os.path.relpath(F._path(cn), ROOT)}
        if write:
            img = before.get((COLLEGE, cn))
            if img is None or F.row_passes(img["checks"]):
                raise SystemExit("%s: the load leaves it out, or its image passes" % cn)
            row["before_image"] = {k: img[k] for k in ("program_title", "award", "catalog_year", "source_url",
                                                       "measure", "total_min", "total_max", "record", "checks",
                                                       "extracted_run")}
            with open(F._path(cn), "w", encoding="utf-8") as fh:
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
    ap.add_argument("--tag", default="s720f")
    a = ap.parse_args(argv)
    pr, cc, bd = precision(), claim_checks(), boundaries()
    print("precision: %s" % json.dumps(pr))
    print("claim checks: %s" % json.dumps(cc))
    print("boundaries: %s" % json.dumps(bd))
    if pr["wrong"] or pr["not_hand_held"] or bd["wrong"]:
        raise SystemExit("the self-recall reads a wrong answer: no plan is written")
    res = plan(write=not a.dry_run)
    print("plan: %d rows %s; held %d" % (len(res["rows"]), dict(collections.Counter(r["moves_to"] for r in res["rows"])),
                                          len(res["held"])))
    if a.dry_run or not res["rows"]:
        return 0
    rows = res["rows"]
    stamp = time.gmtime()
    day = time.strftime("%Y-%m-%d", stamp)
    path = os.path.join(NG.RECEIPTS, "program_requirement_records_piles_fullerton_%s_%s.json" % (day, a.tag))
    body = {"rule": NG.RULING + "; S720: Fullerton's 13 S714 held, collected with their gaps named (no reread)",
            "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", stamp), "college": COLLEGE,
            "census": {"file": os.path.relpath(CENSUS, ROOT), "lever": LEVER, "members": F.census_members()},
            "gaps": {g: NG.GAPS[g] for g in GAPS}, "moved": len(rows),
            "by": dict(collections.Counter(r["moves_to"] for r in rows)),
            "precision": pr, "claim_checks": cc, "boundaries": bd, "held": res["held"], "records": rows,
            "representation": "checks.gaps and checks.confidence added as the load reads the filed score; "
                              "checks.arithmetic, coverage, invented and the record unchanged",
            "claim_check_reads": ("Today's capture (sources.json): the page's h1 names the record's own award (another "
                                  "award's for no_own_page_total), and every course an entry names is among the codes "
                                  "it found. The capture keeps no page text, so the note's quoted figures are the "
                                  "reader's words, never re-read here."),
            "follow_verdict": P.FOLLOW_VERDICT,
            "pre_read": P.confirm_pre_read(rows), "pre_read_md5": F.md5_pre_read(rows),
            "apply": P.confirm_guarded_apply(rows, a.tag + " piles"),
            "rollback": NG.rollback_sql(rows, a.tag + " piles rollback")}
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(body, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    rel = os.path.relpath(path, ROOT)
    hdr = ("-- %s lane 2's cheap piles at Fullerton (named gaps %d). Each row's checks become the college load's\n"
           "-- image of its committed record (load_rows): checks.gaps and checks.confidence added; the record unchanged.\n"
           "-- Receipt: %s (before_image per row).\n" % (a.tag.upper(), len(rows), rel))
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
