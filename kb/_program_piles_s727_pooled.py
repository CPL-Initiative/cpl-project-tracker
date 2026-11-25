#!/usr/bin/env python3
"""S727, lane 1 (pooled): what the pooled reading opens beyond plan s721p, collected as plan s727p.

#3764 (db49ae39) taught the scorer to read one figure printed over several named lists as one pool (pooled_figures and
pool_span in kb/_program_requirements_score.py); plan s721p applied 15 of its rows at eight colleges. This plan takes
the rest at five colleges, Modesto Junior, El Camino, Rio Hondo, Cuyamaca and Golden West, with s721p's own classify
(kb/_program_pooled_s721.py, imported, never copied): each record is scored against its own state list with no page
text, once with the reading off and once on, and moves only where the reading-off score gives the filed arithmetic.
Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17) stands beside it: a record that still fails is collected
with its gap, and a record today's scorer passes is never gap-filed (p-scorer-passes-guard-s720).

THE ROWS (REVIEWED, 11, every one "passes": its arithmetic rescored, the live row's checks the load's image of it):
  Modesto Junior 08104, 08111, 33944, 37300, 38067: five of the 13 records S720's plan s720j held
                (f-modesto-s720j-holds-pass-pooled-s721). Each prints an Agriculture Science Breadth heading
                "COMPLETE 9 UNITS" over two or three sub-lists, which the record adds as 3-12 or 6-12; read as one
                9, each adds to its printed total.
  Rio Hondo 19274, 19275, 19276; Cuyamaca 18629, 18631; Golden West 19461: the flips outside s721p
                (f-pooled-flips-elsewhere-s721). Each page prints "at least one course (or 3 units) from each list,
                then additional courses from the lists to total 18 units"; the record holds the per-list floors, and
                the 18 read over the lists together is the program's printed 18. Golden West 19461's degree fill was
                made by its filed score against its page text at capture, so it is no new fill.

THE HOLDS (HELD, by key, each with its reason; the receipt lists them):
  El Camino 02513, 02515, 02517: the pool reads their 18, and the pass then rests on a degree electives fill (major
                18 and ECC GE 24 against the printed 60) the filed score never made. The fill is checked against the
                page text (electives_named), and no copy of it is reachable from here: the capture keeps none, and
                the run's artifact (program-requirements-38631686677) and the catalog host are both refused by this
                container's egress proxy. Each is already collected with pool_figure_not_read (plan s720m) and stays
                so until a runner reads its page.
  Modesto 08109: the reading moves its sum (23-43 to 26-37) and it still fails against its printed 29; one of the
                s720j holds, left as it is (no reviewed note names its gap).
  Modesto 06655, 06683, 10602, 35127, 38869, 42664, 43164: the reading moves nothing, and today's scorer passes
                none of them (42664's arithmetic is equal, its coverage and invented checks fail).
  Cuyamaca 18635: the reading reads the major's 18, and the degree then adds to 52 (18 and Cal-GETC 34) against the
                printed 60. Its own note says the page implies the rest but prints no electives line; a Cuyamaca
                reconcile wording rule (the page's own "Complete 60 transferable units", as Grossmont's
                electives_fill_words reads) may pass it, so it is not gap-filed here
                (p-gap-filing-leaves-census-lever-s721): it stays as it is.

Guards on every row (lessons S720 and S721): the outcome is "passes" under s721p's classify; on_live_run (the
record's run is the run a committed receipt posted to the live row); own page (W.own_page: a page capture.json's
shared_pages lists another program on is the record's own only in its own PDF section); the live row does not pass
already; the load posts it, its image passes with no gap after the write and its record is unchanged.

    python3 kb/_program_piles_s727_pooled.py --dry-run     # the outcomes and the plan's counts; writes nothing
    python3 kb/_program_piles_s727_pooled.py --tag s727p   # rewrite the scores, the receipt and the four SQL files

Guard: tests/program_piles_s727_pooled_test.py.
"""
from __future__ import annotations

import argparse
import collections
import contextlib
import json
import os
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_named_gaps as NG  # noqa: E402
import _program_piles_s713 as P  # noqa: E402
import _program_piles_s714_fullerton as F  # noqa: E402
import _program_piles_s721_paloverde as PV  # noqa: E402
import _program_pooled_s721 as W  # noqa: E402
import _program_requirements_rescore as RS  # noqa: E402
import _program_requirements_score as S  # noqa: E402

ROOT = os.path.dirname(HERE)
RULING = ("S727 (lane 1, pooled): the rest of what #3764's pooled reading opens beyond s721p, at five colleges "
          "(f-modesto-s720j-holds-pass-pooled-s721, f-pooled-flips-elsewhere-s721); Sam, 2026-11-17, "
          "sam-collect-with-gaps-2026-11-17; p-scorer-passes-guard-s720")
MODESTO, ELC, RIO, CUY, GWC = ("Modesto Junior College", "El Camino College", "Rio Hondo College", "Cuyamaca College",
                               "Golden West College")
LANE = {MODESTO: "modesto_junior", ELC: "el_camino", RIO: "rio_hondo", CUY: "cuyamaca", GWC: "golden_west"}

# The hand reading of each row (S727, from each record's own notes and blocks): the figures the page prints over
# lists together, as the reading takes them, and the total the record then adds to, which is its printed total.
# Modesto 37300's Career Courses "Total 5" is a pool the reading refuses (its note hedges; s721p's POOLS_MISSED), and
# its career courses add to 5 at both ends anyway.
REVIEWED = {
    (MODESTO, "08104"): {"pools": (9,), "total": 29},
    (MODESTO, "08111"): {"pools": (9,), "total": 30},
    (MODESTO, "33944"): {"pools": (5, 9), "total": 29},   # its Career Courses "(Total 5)" too
    (MODESTO, "37300"): {"pools": (9,), "total": 14},
    (MODESTO, "38067"): {"pools": (9,), "total": 30},
    (RIO, "19274"): {"pools": (18,), "total": 18},
    (RIO, "19275"): {"pools": (18,), "total": 18},
    (RIO, "19276"): {"pools": (18,), "total": 18},
    (CUY, "18629"): {"pools": (18,), "total": 18},
    (CUY, "18631"): {"pools": (18,), "total": 18},
    (GWC, "19461"): {"pools": (18,), "total": 18},
}
_ELC_WHY = ("the pool reads its 18, and the pass then rests on a degree electives fill the filed score never made; "
            "the fill is checked against the page text, which neither the capture nor this container can reach "
            "(artifact program-requirements-38631686677 and the catalog host refused by the egress proxy): it stays "
            "collected with pool_figure_not_read (s720m) until a runner reads its page")
HELD = {
    (ELC, "02513"): _ELC_WHY, (ELC, "02515"): _ELC_WHY, (ELC, "02517"): _ELC_WHY,
    (MODESTO, "08109"): "the reading moves its sum and it still fails against its printed 29; an s720j hold, left as "
                        "it is (no reviewed note names its gap)",
    (CUY, "18635"): "the reading reads the major's 18, and the degree adds to 52 against the printed 60; its note says "
                    "the page prints no electives line, and a Cuyamaca reconcile wording rule may pass it, so it is "
                    "not gap-filed (p-gap-filing-leaves-census-lever-s721)",
}
# Modesto's other s720j holds: the reading moves nothing, and today's scorer passes none of them.
UNMOVED_S720J = ("06655", "06683", "10602", "35127", "38869", "42664", "43164")


@contextlib.contextmanager
def lane():
    """s721p's helpers (shared_with, posted_runs) key a college by W.LANE; these five join it for the call only."""
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


def outcome(key: tuple) -> tuple[str, dict, dict, str]:
    """s721p's classify on the committed record: "passes" both before this plan's write (the reading moves it) and
    after (rescored already, the outcome the reading gave it)."""
    f = load(key)
    if f is None:
        return "no record file", {}, {}, "no record file"
    with lane():
        return W.classify(f)


def scorer_passes(f: dict) -> bool:
    """Today's scorer passes the record whole, with no page text: arithmetic (no electives fill: an empty text names
    none), coverage and invented."""
    sc = S.score(f.get("record") or {}, [], "", f.get("award"))
    keep = f.get("score") or {}
    return ((sc.get("arithmetic") or {}).get("status") == "equal"
            and (keep.get("coverage") or {}).get("pass") is not False
            and (keep.get("invented") or {}).get("pass") is not False)


def decide(key: tuple) -> tuple[str, str, dict | None, dict, dict]:
    """(kind: "passes" or "held", why, the filed record, off, on)."""
    f = load(key)
    if f is None:
        return "held", "no record file", None, {}, {}
    what, off, on, why = outcome(key)
    fa = (f.get("score") or {}).get("arithmetic") or {}
    if key in HELD:
        return "held", HELD[key], f, off, on
    if key[0] == MODESTO and key[1] in UNMOVED_S720J:
        if scorer_passes(f):
            return "held", "an s720j hold today's scorer passes with no pool: a rescore's, outside this plan", f, off, on
        return "held", "an s720j hold: the reading %s, and today's scorer does not pass it" % (
            "moves nothing" if what == "unmoved" else "gives it " + what), f, off, on
    if key not in REVIEWED:
        return "held", "not reviewed (%s under the reading)" % what, f, off, on
    if fa == on or fa.get("pooled"):
        return "held", "rescored already by this plan (%s)" % what, f, off, on
    if what != "passes":
        return "held", "%s under the reading: %s" % (what, why), f, off, on
    if on.get("rescored") == RS.RULING_LOCAL_OVERLAP:
        return "held", "passes only through Sam's ruling 1 (ge_overlap), which this plan does not write", f, off, on
    if S.passes_live(f["score"]):
        return "held", "passes already", f, off, on
    with lane():
        if not W.on_live_run(f):
            return "held", "the committed record's run is not the run a committed receipt posted", f, off, on
        if not W.own_page(f):
            return "held", "read from a page shared_pages lists with %s" % ", ".join(
                W.shared_with(key[0], key[1])), f, off, on
    return "passes", why, f, off, on


def plan(write: bool) -> dict:
    keys = sorted(set(REVIEWED) | set(HELD) | {(MODESTO, cn) for cn in UNMOVED_S720J})
    decided = [(k, *decide(k)) for k in keys]
    moving = [d for d in decided if d[1] == "passes"]
    before = NG._load_images({k[0] for k, *_ in moving})
    rows, held = [], []
    for key, kind, why, f, off, on in decided:
        if kind == "held":
            held.append({"college": key[0], "control_number": key[1], "why": why})
            continue
        img = before.get(key)
        if img is None:
            held.append({"college": key[0], "control_number": key[1], "why": "the load does not post it"})
            continue
        with lane():
            path = W._path(*key)
        entry = {"college": key[0], "control_number": key[1], "award": f.get("award"),
                 "extracted_run": f.get("extracted_run"), "moves_to": "passes",
                 "computed": [off.get("computed"), on.get("computed")], "stated": on.get("stated"),
                 "pooled": [{"blocks": p["blocks"], "figure": p["figure"], "minimum": p["minimum"],
                             "words": p["words"]} for p in on.get("pooled") or []],
                 "path": os.path.relpath(path, ROOT)}
        if write:
            entry["before_image"] = {k: img[k] for k in ("program_title", "award", "catalog_year", "source_url",
                                                         "measure", "total_min", "total_max", "record", "checks",
                                                         "extracted_run")}
            with open(path, "w", encoding="utf-8") as fh:
                json.dump(dict(f, score=W.passing_score(f, on)), fh, ensure_ascii=False, indent=1)
                fh.write("\n")
        rows.append(entry)
    if write and rows:
        after = NG._load_images({r["college"] for r in rows})
        for r in rows:
            img = after[(r["college"], r["control_number"])]
            if img["record"] != r["before_image"]["record"]:
                raise SystemExit("%s %s: the record changed" % (r["college"], r["control_number"]))
            if not F.row_passes(img["checks"]) or img["checks"].get("gaps"):
                raise SystemExit("%s %s: the image does not pass with no gap" % (r["college"], r["control_number"]))
            r["after_image"] = {"checks": img["checks"]}
    for i, r in enumerate(rows, 1):
        r["i"] = i
    return {"rows": rows, "held": held}


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--tag", default="s727p")
    a = ap.parse_args(argv)
    res = plan(write=not a.dry_run)
    print("plan: %d rows; held %d" % (len(res["rows"]), len(res["held"])))
    for r in res["rows"]:
        print("  %s %s passes %s -> %s" % (r["college"], r["control_number"], r["computed"][0], r["computed"][1]))
    for h in res["held"]:
        print("  held %s %s: %s" % (h["college"], h["control_number"], h["why"][:110]))
    if a.dry_run or not res["rows"]:
        return 0
    rows = res["rows"]
    stamp = time.gmtime()
    day = time.strftime("%Y-%m-%d", stamp)
    path = os.path.join(NG.RECEIPTS, "program_requirement_records_piles_s727_pooled_%s_%s.json" % (day, a.tag))
    with lane():
        shared = {r["control_number"]: W.shared_with(r["college"], r["control_number"]) for r in rows
                  if W.shared_with(r["college"], r["control_number"])}
    body = {"rule": RULING, "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", stamp), "colleges": sorted(LANE),
            "moved": len(rows), "by": {"passes": len(rows)},
            "by_college": dict(sorted(collections.Counter(r["college"] for r in rows).items())),
            "held": res["held"], "records": rows, "shared_pages": shared,
            "supersedes": "none; Modesto's plan s720j (claude/s720-piles-modesto) stays superseded by s721p",
            "representation": "checks.arithmetic as the load reads the rescored score, checks.gaps and "
                              "checks.confidence dropped; coverage, invented and the record unchanged",
            "follow_verdict": P.FOLLOW_VERDICT,
            "pre_read": P.confirm_pre_read(rows), "pre_read_md5": PV.md5_pre_read(rows),
            "apply": P.confirm_guarded_apply(rows, a.tag + " pooled"),
            "rollback": NG.rollback_sql(rows, a.tag + " pooled rollback")}
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(body, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    rel = os.path.relpath(path, ROOT)
    hdr = ("-- %s lane 1's pooled figures at five colleges (%d rows, every one passes). Each row's checks become the\n"
           "-- college load's image of its rescored record (load_rows); the record unchanged. Receipt: %s\n"
           "-- (before_image per row).\n" % (a.tag.upper(), len(rows), rel))
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
