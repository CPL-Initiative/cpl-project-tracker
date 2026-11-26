#!/usr/bin/env python3
"""S721, lane 2's cheap piles at Orange Coast: the census's 20 wording-rule records, collected with gaps named.

Today's census (kb/status/harvest_gap_census.json, run 45371224551) lists 20 Orange Coast records under the
reconcile_steps lever ("correction rules from the catalog's own wording, then rescores the saved record"). Sam's
ruling (2026-11-17, sam-collect-with-gaps-2026-11-17): never drop a record for failing; collect it with its gaps
noted and confidence scores, a gap noted instead of a reread. The committed files hold no page text, so no
reconcile step can run here: a record a wording rule would pass is held as tomorrow's free rule (Cabrillo's
precedent), never gap-filed, and each other record takes a named gap where one is honest.

THE REVIEWED LIST (REVIEWED below, a hand reading of each record's own notes, the shape of S720's piles), with
three guards: scorer_passes (a record today's scorer passes is never gap-filed), on_live_run (the committed record's
run must be its live row's) and the own-page guard, strict here: a record whose page capture.json's shared_pages
lists with another program holds (p-own-page-guard-shared-pages-s720; Orange Coast's pages are one program each,
so no note names a section of a shared page). The kinds, all reused:

  noted_figures_differ   (#3753, 40) the Math block printed 5-10 over MATH A180 and MATH A185, both required, so the
                         record adds 31 against the printed 26-31 (35182).
  lists_not_closed       (#3753, 30) List B takes one course or two by the Core option chosen, and also any unused
                         List A course (32189).
  unit_line_not_read     (East Los Angeles's branch, 40) the Level 2 A.S.'s general education line, which the page's
                         Subtotal 67 counts at 18 over its Program Major Units 49; the record leaves the line out, and
                         with it 60-62 is the printed 78-80 (19547; the entry checks 67 less 49 is the 18).

Held (17), each with its reason in HAND: 03954, 08664, 31217 (the Requirements tab is not in the text the reader
saw: an incomplete read, Ventura's precedent); 08628, 19473, 19474, 43100 (coverage or invented fails: no named gap's
record); 08663 (its page is the Advanced certificate's, which is 43362's: another award's page); 41373, 43362 (their
pages are shared with 32086 and 08663); 08670 and 32737 (tomorrow's free rules: 'Minimum 60 units required for the
degree' as degree_total_minimum, and a 'Substitution Courses ... 15 Units Maximum' list read as no requirement;
today's scorer passes each so read); 32737, 32790, 36732 (no committed receipt posts their committed run to a live
row: on_live_run); 42331 (today's scorer passes it); 36032 (major plus Cal-GETC fall short of 60 and the page prints
its electives as 'Varies': #3762's degree_electives_not_printed, after that PR merges); 03993 (its notes support no
honest kind).

THE CLAIM CHECK (p-claim-check-reads-current-capture-s713): every course an entry names is among the codes today's
capture (sources.json) found. THE SELF-RECALL: HAND is the hand reading of the 20; precision runs the rule and the
claim check over each; boundary readings: the note's words gone, the stated total one unit off, coverage failing.

    python3 kb/_program_piles_s721_orangecoast.py --dry-run
    python3 kb/_program_piles_s721_orangecoast.py --tag s721b

Guard: tests/program_piles_s721_orangecoast_test.py.
"""
from __future__ import annotations

import argparse
import collections
import copy
import glob
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
COLLEGE = "Orange Coast College"
SLUG = "orange_coast"
CENSUS = NG.CENSUS
LEVERS = ("reconcile_steps",)
PERSON = ()

REVIEWED = {
    "35182": {"gap": "noted_figures_differ", "computed": [31, 31], "stated": [26, 31],
              "words": "Math Required Courses block prints 5-10 units while listing MATH A180/A180H AND MATH A185/A185H",
              "courses": ["MATHA180", "MATHA185"]},
    "32189": {"gap": "lists_not_closed", "computed": [16, 23], "stated": [19, 19],
              "words": "List B minimum depends on the Core option"},
    "19547": {"gap": "unit_line_not_read", "computed": [60, 62], "stated": [78, 80], "less": [-18, -18],
              "line": {"Program Major Units": 49, "Subtotal": 67},
              "words": "Program Major Units 49, AS OCC General Education up to 21, Subtotal 67"},
}
FREE_RULE = "held: tomorrow's free rule passes it (%s); a rescore wording rule, never a gap"
HAND = {cn: e["gap"] for cn, e in REVIEWED.items()}
HAND.update({
    "03954": "held: the Requirements tab is not in the text the reader saw (an incomplete read, never a gap): a reread",
    "08664": "held: the Requirements tab is not in the text the reader saw (an incomplete read, never a gap): a reread",
    "31217": "held: the Requirements tab is not in the text the reader saw (an incomplete read, never a gap): a reread",
    "08628": "held: coverage and invented fail (CNST A196 and A197 unplaced; 11 catalog codes off the closed list), so "
             "no named gap's record; its heading names Building Construction, not Residential Construction Development",
    "19473": "held: coverage and invented fail (CNST A196 and A197 unplaced), so no named gap's record; its heading "
             "names the Building Construction Second Award",
    "19474": "held: coverage and invented fail (CNST A196 and A197 unplaced), so no named gap's record; its heading "
             "names the Building Construction Third Award",
    "43100": "held: coverage fails (PSYC A160 on the closed list, not placed), so no named gap's record",
    "08663": "held: its page is the Food and Beverage Management, Advanced certificate's, which shared_pages gives "
             "43362 too; 08663 is the Food and Beverage Management certificate, so the record is another award's: a "
             "page-finding step",
    "43362": "held: its page is shared (shared_pages lists 08663 on it); the page's title is 43362's, and 08663's "
             "page-finding step releases it (then noted_figures_differ: the prerequisite list's 20.5 heading against "
             "its printed 22)",
    "41373": "held: its page is shared (shared_pages lists 32086 on it); the page's title is 41373's, and 32086's "
             "page-finding step releases it (then noted_figures_differ: the printed 28-29 against the courses' 29)",
    "08670": FREE_RULE % "the page prints 'Minimum 60 units required for the degree' over 60-63.5: read as "
                         "degree_total_minimum, today's scorer passes it",
    "32737": FREE_RULE % "a 'Required Core (Substitution Courses) 15 Units Maximum' list, which its note says does not "
                         "add to the 23-25, read as no requirement: today's scorer passes it" +
             "; and no committed receipt posts its committed run to its live row (on_live_run)",
    "32790": "held: its text is cut off mid-Area 5A and it reads no total, so its arithmetic is incomplete; and no "
             "committed receipt posts its committed run to its live row (on_live_run)",
    "36732": "held: no committed receipt posts its committed run (39726645292) to its live row (on_live_run: the load "
             "that inserted it held three runs); then noted_figures_differ (the overview's 18 plus 6 against the "
             "table's 12 core plus 3-7 electives in 18-19)",
    "42331": "held: today's scorer passes it on its own record; a closed-list rescore, never a gap",
    "36032": "held: its major plus Cal-GETC fall short of the printed 60 and the page prints its electives as 'Varies': "
             "#3762's degree_electives_not_printed, after that PR merges",
    "03993": "held: its notes support no honest kind (18-21 against the printed 20; the core's 'or' alternatives "
             "carry no units): a reread",
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


# Plan tags posted_runs leaves out, set by a test that pins this plan's own reading: a later plan that collects
# a record this one held for its live run posts that run once it is applied (s739j: 36732), and this plan's
# reading is the receipts as they stood before it (p-test-reads-own-apply-receipt-s721).
SKIP: tuple = ()
_POSTED = None


def posted_runs() -> dict:
    """{control number: [(at, extracted_run), ...]} the committed receipts posted to the college's live rows: a load
    with one extracted run (its inserted_keys), a reread (replaced_keys and carried_keys under its extracted_run) and
    every applied guarded plan's records. A load holding several runs names no run per key, so it posts none here."""
    global _POSTED
    if _POSTED is not None:
        return _POSTED
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
            # A plan's rows reached the live table only when its migration receipt was filed.
            tag = name[:-len(".json")].rsplit("_", 1)[-1]
            if tag in SKIP or not glob.glob(os.path.join(NG.RECEIPTS, "migration_%s_prreq_*.json" % tag)):
                continue
            rows = d.get("records") if isinstance(d.get("records"), list) else d.get("moved")
            for r in rows if isinstance(rows, list) else []:
                if isinstance(r, dict) and r.get("college") == COLLEGE and r.get("extracted_run"):
                    out.setdefault(str(r.get("control_number")), []).append((at, str(r["extracted_run"])))
    _POSTED = out
    return out


def on_live_run(filed: dict) -> bool:
    """The committed record's run is the run the latest committed receipt posted for the row."""
    rows = posted_runs().get(str(filed.get("control_number"))) or []
    return bool(rows) and max(rows)[1] == str(filed.get("extracted_run"))


def line_closes(words: str, e: dict) -> bool:
    """The units line the record leaves out is the page's own figures: each named figure is printed in the words,
    and the subtotal less the major is the units the entry adds (unit_line_not_read at 19547)."""
    line = e.get("line")
    if not line:
        return True
    if any("%s %s" % (label, fig) not in words for label, fig in line.items()):
        return False
    added = line["Subtotal"] - line["Program Major Units"]
    return all(abs(-x - added) <= NG.FIG_EPS for x in _pair(e["less"]))


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
    if scorer_passes(filed) or not on_live_run(filed):
        return None
    if e.get("less"):
        # The record leaves out (less < 0) or counts (less > 0) a block the printed total does the other way: the sum
        # less it is the stated total exactly.
        comp, st, less = _pair(e["computed"]), _pair(e["stated"]), _pair(e["less"])
        if any(abs(c - x - s) > NG.FIG_EPS for c, x, s in zip(comp, less, st)):
            return None
        if not line_closes(words, e):
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
    if shared_with(cn):
        # The own-page guard, strict at Orange Coast: a page shared_pages lists another program on is never the
        # record's own (p-own-page-guard-shared-pages-s720).
        return "the page is shared"
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
        if e.get("line"):
            off = dict(e, line=dict(e["line"], Subtotal=e["line"]["Subtotal"] + 1))
            tally("the subtotal one unit off", gap_noted(f, dict(REVIEWED, **{cn: off})) is None, cn)
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
    ap.add_argument("--tag", default="s721b")
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
    path = os.path.join(NG.RECEIPTS, "program_requirement_records_piles_s721_orangecoast_%s_%s.json" % (day, a.tag))
    body = {"rule": NG.RULING + "; S721: Orange Coast's 20 wording-rule records, collected with their gaps named where "
                                "one is honest (no reread)",
            "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", stamp), "college": COLLEGE,
            "census": {"file": os.path.relpath(CENSUS, ROOT), "levers": list(LEVERS), "person": list(PERSON),
                       "members": census_members()},
            "gaps": {g: NG.GAPS[g] for g in sorted(by)}, "moved": len(rows), "by": by,
            "precision": pr, "claim_checks": cc, "boundaries": bd, "held": res["held"], "records": rows,
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
    hdr = ("-- %s lane 2's cheap piles at Orange Coast (named gaps %d). Each row's checks become the\n"
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
