#!/usr/bin/env python3
"""S721, lane 1 (pooled): one figure printed over several lists together, read as one pool, and the plan s721p.

S720 filed the named gap pool_figure_not_read on records whose notes name one parent figure printed over several
lists or nested options (Modesto Junior's "SELECT 6 UNITS MINIMUM FROM THE LISTS BELOW", its Agriculture Science
Breadth "COMPLETE 9 UNITS", Ventura's "Lists B and C together require a total of 9 units"), and found that most pass
once the figure is read as one pool (f-pool-figure-gaps-pass-when-pooled-s720), so it held Modesto's plan s720j
unapplied (d-modesto-held-pooled-rule-s720). The scorer now reads the pool (pooled_figures and pool_span in
kb/_program_requirements_score.py): the units chosen across the parts together meet the figure, and each part's own
printed figure still binds. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17) stands beside it: a record
that still fails is collected with its gap, and a record today's scorer passes is never gap-filed
(p-scorer-passes-guard-s720).

THE RESCORE (the S714 option-parts shape, kb/_program_piles_s714_ccsf.py): each record is scored against its own state
list (coci_program_courses as the table is built) with no page text, once with the pooled reading off and once on.
A record moves only where the reading-off score gives the filed arithmetic on every field the filed arithmetic
carries, so the rescore re-judges nothing but the pool. A pass that rests on an electives fill the filed score never
made is held: the fill is checked against the page text (electives_named), which the capture does not keep. The
record itself is never changed; its score is, and the live row's checks follow as the college load's image.

THE PLAN (s721p) covers the eight colleges this lane holds: Modesto Junior, El Camino, Santa Monica, Ventura, City
College of San Francisco, Clovis, College of the Sequoias and Fullerton. Two kinds of row:
  passes                a failing record the pooled reading passes: its arithmetic rescored, its named gap dropped
                        (S720's pool_figure_not_read rows; Modesto's s720j records, never applied).
  pool_figure_not_read  a Modesto s720j record that still fails under the reading: its arithmetic rescored and the gap
                        S720's hand reading named (REVIEWED_S720J) filed.
Modesto's 13 records s720j held stay as they are (the brief). Flips at every other college are counted and left for
the next run. Guards: on_live_run (the record's run is the run a committed receipt posted), own page (a page
capture.json's shared_pages lists another program on is held, unless a PDF page whose section heading names the
program's award: own_page), the load posts it, and the image does not pass already.

THE SELF-RECALL (the S652 review rule): the reading over every committed record, reading off against on, by college;
every fail-to-pass shows the sentence that prints its figure, and pass-to-fail must be 0. HELD_ANSWERS pins the
outcome each pinned record must have (S720's #3756 negatives, Modesto's eight, the sixteen applied rows).

    python3 kb/_program_pooled_s721.py --dry-run     # the self-recall and the plan's counts; writes nothing
    python3 kb/_program_pooled_s721.py --tag s721p   # rewrite the scores, the receipt and the four SQL files

Guard: tests/program_pooled_figure_s721_test.py.
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
import _program_piles_s714_ccsf as C  # noqa: E402
import _program_piles_s714_fullerton as F  # noqa: E402
import _program_requirements_rescore as RS  # noqa: E402
import _program_requirements_score as S  # noqa: E402

ROOT = os.path.dirname(HERE)
COLLEGE_DIR = NG.COLLEGE_DIR
RECEIPTS = NG.RECEIPTS
RULING = ("S721 (lane 1, pooled): one figure printed over several lists together read as one pool "
          "(f-pool-figure-gaps-pass-when-pooled-s720, d-modesto-held-pooled-rule-s720); Sam, 2026-11-17, "
          "sam-collect-with-gaps-2026-11-17; p-scorer-passes-guard-s720")
LANE = {"Modesto Junior College": "modesto_junior", "El Camino College": "el_camino",
        "Santa Monica College": "santa_monica", "Ventura College": "ventura",
        "City College of San Francisco": "city_of_san_francisco", "Clovis Community College": "clovis_community",
        "College of the Sequoias": "college_of_the_sequoias", "Fullerton College": "fullerton"}
MODESTO = "Modesto Junior College"
# Modesto's plan s720j (claude/s720-piles-modesto, a6d019a4, never applied): the hand reading of its eight
# pool_figure_not_read records, each with the words of the note that names the parent figure.
REVIEWED_S720J = {
    "06639": 'The Agriculture Science Breadth section requires 9 units total, split as 6-9 units',
    "06642": 'is a container over two nested blocks',
    "08103": 'AGRICULTURE SCIENCE BREADTH COURSES - COMPLETE 9 UNITS (Total 9) is split into three sub-blocks',
    "30675": 'An overarching rule spans Lists A and B',
    "32226": 'LIST B - SELECT 1 COURSE FROM EACH AREA (6 UNITS) prints a total of 6',
    "33945": "Science breadth parent group prints 'COMPLETE 9 UNITS' (Total 9) split into two sub-lists",
    "35276": 'is split into two blocks: AG115 required (1 unit) plus a nested',
    "35277": 'The Agriculture Science Breadth section requires 9 units total, split into a 6-9 unit sub-block',
}
# The 13 s720j held; left as they are here (the brief), each counted in the receipt with what the reading gives it.
HELD_S720J = ("06655", "06683", "08104", "08109", "08111", "10602", "33944", "35127", "37300", "38067", "38869",
              "42664", "43164")
GAP = "pool_figure_not_read"

# The held answers: what the pooled reading must give each pinned record. "passes": the rescore passes it; "fails":
# it moves the sum and the record still fails; "unmoved": the reading moves nothing. Read by hand from each record's
# notes and blocks (S721).
HELD_ANSWERS = {
    # S720's #3756 negatives: records whose gaps the reconcile keeps; the pool has nothing to read.
    ("Cypress College", "37246"): "unmoved", ("Riverside City College", "43896"): "unmoved",
    ("Folsom Lake College", "33791"): "unmoved", ("Cerritos College", "20493"): "unmoved",
    # Modesto's eight: the Breadth 9 (or 6, 35276) over its sub-lists, Lists A and B's 6 minimum, Area 1's 3.
    (MODESTO, "06639"): "passes", (MODESTO, "08103"): "passes", (MODESTO, "30675"): "passes",
    (MODESTO, "32226"): "passes", (MODESTO, "33945"): "passes", (MODESTO, "35276"): "passes",
    (MODESTO, "35277"): "passes",
    # 06642: the Breadth 9 is read, and its Major Courses 12 over a required block and an option group is not.
    (MODESTO, "06642"): "fails",
    # The sixteen applied pool_figure_not_read rows.
    ("El Camino College", "02513"): "passes_untexted_fill", ("El Camino College", "02515"): "passes_untexted_fill",
    ("El Camino College", "02517"): "passes_untexted_fill", ("El Camino College", "02528"): "unmoved",
    ("Santa Monica College", "03263"): "passes", ("Santa Monica College", "32792"): "passes",
    ("Santa Monica College", "08970"): "unmoved", ("Santa Monica College", "21007"): "unmoved",
    ("Ventura College", "20576"): "passes",
    # 06957: its major adds up once Lists B and C read their 9, and its major and general education run past the
    # degree total by its 6 double-counted units, which Sam's ruling 1 of 2026-11-17 passes as overlap.
    ("Ventura College", "06957"): "passes",
    ("Ventura College", "45731"): "unmoved",
    ("City College of San Francisco", "16991"): "unmoved", ("City College of San Francisco", "38909"): "unmoved",
    ("Clovis Community College", "33489"): "passes", ("College of the Sequoias", "35415"): "passes",
    ("Fullerton College", "18163"): "passes",
    # Fullerton 18166: its reader's note says the Category C list is cut off, so no pool is read.
    ("Fullerton College", "18166"): "unmoved",
}


# ── the rescore ───────────────────────────────────────────────────────────
def current(filed: dict, arith: dict) -> dict:
    """The arithmetic under the rescore's current verdicts (kb/_program_requirements_rescore.py: Sam's rulings of
    2026-11-17 and the Sheet 81, 82 and 120 readings of a stored sum), as a filed record carries them."""
    return RS.rescore(dict(filed, score=dict(filed.get("score") or {}, arithmetic=arith))) or arith


def arithmetic(filed: dict) -> tuple[dict, dict]:
    """(the arithmetic with the pooled reading off, with it on), against the record's own state list, no text, each
    under the rescore's current verdicts (current)."""
    saved = S.POOLED_ON
    S.POOLED_ON = False
    try:
        off = C.fresh_score(filed)["arithmetic"]
    finally:
        S.POOLED_ON = saved
    return current(filed, off), current(filed, C.fresh_score(filed)["arithmetic"])


def exact(filed_arith: dict, off: dict) -> bool:
    """The reading-off score gives the filed arithmetic on every field the filed arithmetic carries (a field a later
    scorer adds, such as "against" or a degree check, may stand beside it)."""
    return bool(filed_arith) and all(off.get(k) == v for k, v in filed_arith.items())


def _fills(a: dict) -> bool:
    return any(isinstance(x, dict) and x.get("pass") and x.get("fill") and max(x["fill"]) > S.TOL
               for x in (a, a.get("degree"), a.get("major")))


def untexted_fill(filed_arith: dict, on: dict) -> bool:
    """A pass resting on an electives fill the filed score never made: the fill is checked against the page text
    (electives_named), and the rescore reads none."""
    return _fills(on) and not _fills(filed_arith)


def verdict(filed: dict, arith: dict) -> bool:
    """The record's live verdict with this arithmetic in place of the filed one, every other check as filed."""
    return S.passes_live(dict(filed.get("score") or {}, arithmetic=arith))


def passing_score(filed: dict, on: dict) -> dict:
    """The filed score with the pooled arithmetic, its named gaps and their scores dropped (keep_named_gaps: a fresh
    score that passes as the live table counts it needs no gap)."""
    sc = copy.deepcopy(filed.get("score") or {})
    sc["arithmetic"] = on
    for k in ("gaps", "confidence", "confidence_notes"):
        sc.pop(k, None)
    sc["pass"] = C._overall(sc)
    return sc


def classify(filed: dict) -> tuple[str, dict, dict, str]:
    """(outcome, off, on, why): "unmoved", "not_exact", "passes", "passes_untexted_fill" or "fails"."""
    off, on = arithmetic(filed)
    if off == on:
        return "unmoved", off, on, "the reading moves nothing"
    fa = (filed.get("score") or {}).get("arithmetic") or {}
    if fa == on:
        # Rescored already (this plan's own write, read again): the outcome the reading gave it.
        return ("passes" if verdict(filed, on) else "fails"), off, on, "rescored already under the pooled reading"
    if not exact(fa, off):
        return "not_exact", off, on, "with the reading off, the scorer does not give the filed arithmetic"
    if verdict(filed, on):
        if untexted_fill(fa, on):
            return ("passes_untexted_fill", off, on,
                    "passes on an electives fill the filed score never made; the fill is checked against the page "
                    "text, which the capture does not keep: the next reconcile with a capture rescores it")
        return "passes", off, on, "passes under the pooled reading"
    return "fails", off, on, "the reading moves the sum and the record still fails"


# ── the files and the guards ──────────────────────────────────────────────
def slugs() -> dict:
    out = {}
    for p in glob.glob(os.path.join(COLLEGE_DIR, "*", "summary.json")):
        try:
            with open(p, encoding="utf-8") as fh:
                out[json.load(fh).get("college")] = os.path.basename(os.path.dirname(p))
        except (OSError, ValueError):
            continue
    return out


def every_record() -> list[tuple[str, dict]]:
    out = []
    for p in sorted(glob.glob(os.path.join(COLLEGE_DIR, "*", "records", "*.json"))):
        try:
            with open(p, encoding="utf-8") as fh:
                f = json.load(fh)
        except (OSError, ValueError):
            continue
        if isinstance(f.get("record"), dict) and isinstance(f.get("score"), dict):
            out.append((p, f))
    return out


def _path(college: str, cn: str) -> str:
    return os.path.join(COLLEGE_DIR, LANE.get(college) or slugs()[college], "records", str(cn) + ".json")


def load(college: str, cn: str) -> dict | None:
    p = _path(college, cn)
    if not os.path.isfile(p):
        return None
    with open(p, encoding="utf-8") as fh:
        return json.load(fh)


def shared_with(college: str, cn: str) -> list[str]:
    """The other programs capture.json's shared_pages lists on the record's page."""
    cap = os.path.join(COLLEGE_DIR, LANE[college], "capture.json")
    if not os.path.isfile(cap):
        return []
    with open(cap, encoding="utf-8") as fh:
        sp = json.load(fh).get("shared_pages") or {}
    return sorted({str(m) for v in sp.values() if str(cn) in [str(x) for x in v] for m in v if str(m) != str(cn)})


def own_page(filed: dict) -> bool:
    """The own-page guard (p-own-page-guard-shared-pages-s720): a page capture.json's shared_pages lists another
    program on is the record's own only where it is a PDF page (which holds several sections) and the record's own
    section heading names the program's award (heading_award_check agrees: Santa Monica 32792's "Theatre Arts,
    Associate Degree for Transfer" beside the Theatre A.A. 03273 on page 199)."""
    college, cn = filed.get("college"), str(filed.get("control_number"))
    if not shared_with(college, cn):
        return True
    src, _ = NG._sources(_path(college, cn))
    if (src.get(cn) or {}).get("method") != "pdf_pages":
        return False
    return S.heading_award_check(filed.get("record"), filed.get("award"), cn, filed.get("title"))["status"] == "agrees"


_POSTED: dict = {}


def posted_runs(college: str) -> dict:
    """{control number: [(at, extracted_run), ...]} the committed receipts posted to the college's live rows (the
    S720 piles' posted_runs, for any college of the lane)."""
    if college in _POSTED:
        return _POSTED[college]
    slug = LANE[college]
    out: dict = {}
    for path in glob.glob(os.path.join(RECEIPTS, "program_requirement_records_*.json")):
        name = os.path.basename(path)
        try:
            with open(path, encoding="utf-8") as fh:
                d = json.load(fh)
        except (OSError, ValueError):
            continue
        if not isinstance(d, dict):
            continue
        at = str(d.get("at") or "")
        if name.startswith("program_requirement_records_college_reread_%s_" % slug):
            for k in (d.get("replaced_keys") or []) + (d.get("carried_keys") or []):
                out.setdefault(str(k), []).append((at, str(d.get("extracted_run"))))
        elif name.startswith("program_requirement_records_college_%s_" % slug):
            runs = [str(r) for r in d.get("extracted_runs") or []]
            for k in d.get("inserted_keys") or []:
                if len(runs) == 1:
                    out.setdefault(str(k), []).append((at, runs[0]))
        else:
            # A plan's rows reached the live table only when its migration receipt was filed.
            tag = name[:-len(".json")].rsplit("_", 1)[-1]
            if not glob.glob(os.path.join(RECEIPTS, "migration_%s_prreq_*.json" % tag)):
                continue
            rows = d.get("records") if isinstance(d.get("records"), list) else d.get("moved")
            for r in rows if isinstance(rows, list) else []:
                if isinstance(r, dict) and r.get("college") == college and r.get("extracted_run"):
                    out.setdefault(str(r.get("control_number")), []).append((at, str(r["extracted_run"])))
    _POSTED[college] = out
    return out


def on_live_run(filed: dict) -> bool:
    rows = posted_runs(filed.get("college")).get(str(filed.get("control_number"))) or []
    return bool(rows) and max(rows)[1] == str(filed.get("extracted_run"))


# ── the self-recall ───────────────────────────────────────────────────────
def recall_all(every: list | None = None) -> dict:
    """The reading over every committed record: reading off against on, as each record's live verdict counts it."""
    moved = collections.defaultdict(list)
    n = 0
    for _, f in every if every is not None else every_record():
        n += 1
        off, on = arithmetic(f)
        if off == on:
            continue
        was, now = verdict(f, off), verdict(f, on)
        kind = "%s_to_%s" % ("pass" if was else "fail", "pass" if now else "fail")
        moved[kind].append({"college": f.get("college"), "control_number": str(f.get("control_number")),
                            "computed": [off.get("computed"), on.get("computed")], "stated": on.get("stated"),
                            "exact": exact((f.get("score") or {}).get("arithmetic") or {}, off),
                            "untexted_fill": untexted_fill(off, on),
                            "pooled": [{"blocks": p["blocks"], "figure": p["figure"], "minimum": p["minimum"],
                                        "words": p["words"]} for p in on.get("pooled") or []]})
    by = {k: dict(sorted(collections.Counter(m["college"] for m in v).items())) for k, v in moved.items()}
    return {"records": n, "by_college": by, "counts": {k: len(v) for k, v in moved.items()},
            "members": {k: sorted(v, key=lambda m: (m["college"], m["control_number"])) for k, v in moved.items()}}


def held_answers() -> dict:
    out = {"read": 0, "right": 0, "wrong": []}
    for (college, cn), want in sorted(HELD_ANSWERS.items()):
        f = load(college, cn)
        out["read"] += 1
        got = classify(f)[0] if f else "no record file"
        if got == want:
            out["right"] += 1
        else:
            out["wrong"].append([college, cn, want, got])
    return out


# ── the plan ──────────────────────────────────────────────────────────────
def candidates() -> list[dict]:
    """Every record at the lane's eight colleges the reading moves, with its outcome and the guards it meets."""
    out = []
    for college, slug in sorted(LANE.items()):
        for p in sorted(glob.glob(os.path.join(COLLEGE_DIR, slug, "records", "*.json"))):
            with open(p, encoding="utf-8") as fh:
                f = json.load(fh)
            if not isinstance(f.get("record"), dict) or not isinstance(f.get("score"), dict):
                continue
            cn = str(f.get("control_number"))
            what, off, on, why = classify(f)
            if what == "unmoved":
                continue
            out.append({"college": college, "control_number": cn, "path": p, "filed": f, "outcome": what,
                        "off": off, "on": on, "why": why})
    return out


def decide(c: dict) -> tuple[str, str]:
    """(the row it takes: "passes", GAP, "rescored" or "held", why)."""
    f, college, cn = c["filed"], c["college"], c["control_number"]
    if ((f.get("score") or {}).get("arithmetic") or {}) == c["on"]:
        return "held", "rescored already by this plan (%s)" % c["outcome"]
    if college == MODESTO and cn in HELD_S720J:
        return "held", "one of the 13 records s720j held: left as it is (%s under the reading)" % c["outcome"]
    if S.passes_live(f["score"]):
        return "held", "passes already (%s under the reading)" % c["outcome"]
    if c["outcome"] in ("not_exact", "passes_untexted_fill"):
        return "held", c["why"]
    if not on_live_run(f):
        return "held", "the committed record's run is not the run a committed receipt posted to the live row"
    if not own_page(f):
        return "held", "read from a page capture.json's shared_pages lists with %s" % ", ".join(shared_with(college, cn))
    if c["outcome"] == "passes":
        return "passes", c["why"]
    # Still failing: a Modesto s720j record takes the gap S720 read; a record with a filed gap keeps it (rescored).
    if college == MODESTO and cn in REVIEWED_S720J:
        if not any(REVIEWED_S720J[cn] in str(n) for n in f["record"].get("notes") or []):
            return "held", "the s720j note's words are not on the record"
        if not NG.collectable(dict(f["score"], arithmetic=c["on"])):
            return "held", "not collectable"
        return GAP, "still fails under the reading; s720j's note names the parent figure the reading does not reach"
    return "rescored", "still fails; its filed gaps stand, its arithmetic rescored on disk"


def new_score(c: dict, kind: str) -> dict:
    f = c["filed"]
    if kind == "passes":
        return passing_score(f, c["on"])
    sc = copy.deepcopy(f["score"])
    sc["arithmetic"] = c["on"]
    sc["pass"] = C._overall(sc)
    if kind == GAP:
        words = next(str(n) for n in f["record"].get("notes") or [] if REVIEWED_S720J[c["control_number"]] in str(n))
        src, year = NG._sources(c["path"])
        e = src.get(c["control_number"]) or {}
        sc["gaps"] = [{"gap": GAP, "label": NG.GAPS[GAP], "words": words}]
        sc["confidence"] = NG.confidence(dict(f, score=sc), GAP, e.get("method"),
                                         (e.get("catalog_year") or year) == year)
    return sc


def plan(write: bool) -> dict:
    cands = candidates()
    decided = [(c, *decide(c)) for c in cands]
    moving = [(c, k, w) for c, k, w in decided if k in ("passes", GAP, "rescored")]
    before = NG._load_images({c["college"] for c, _, _ in moving})
    rows, held, rescored = [], [], []
    for c, kind, why in decided:
        key = (c["college"], c["control_number"])
        if kind == "held":
            held.append({"college": c["college"], "control_number": c["control_number"], "outcome": c["outcome"],
                         "why": why})
            continue
        img = before.get(key)
        if img is None:
            held.append({"college": c["college"], "control_number": c["control_number"], "outcome": c["outcome"],
                         "why": "the load does not post it"})
            continue
        sc = new_score(c, kind)
        entry = {"college": c["college"], "control_number": c["control_number"], "award": c["filed"].get("award"),
                 "extracted_run": c["filed"].get("extracted_run"), "moves_to": kind,
                 "computed": [c["off"].get("computed"), c["on"].get("computed")], "stated": c["on"].get("stated"),
                 "pooled": [{"blocks": p["blocks"], "figure": p["figure"], "minimum": p["minimum"],
                             "words": p["words"]} for p in c["on"].get("pooled") or []],
                 "path": os.path.relpath(c["path"], ROOT)}
        if kind == GAP:
            entry["words"] = sc["gaps"][0]["words"]
            entry["confidence"] = sc["confidence"]
        if write:
            entry["before_image"] = {k: img[k] for k in ("program_title", "award", "catalog_year", "source_url",
                                                         "measure", "total_min", "total_max", "record", "checks",
                                                         "extracted_run")}
            with open(c["path"], "w", encoding="utf-8") as fh:
                json.dump(dict(c["filed"], score=sc), fh, ensure_ascii=False, indent=1)
                fh.write("\n")
        (rescored if kind == "rescored" else rows).append(entry)
    if write:
        after = NG._load_images({r["college"] for r in rows + rescored})
        for r in rows + rescored:
            img = after[(r["college"], r["control_number"])]
            if img["record"] != r["before_image"]["record"]:
                raise SystemExit("%s %s: the record changed" % (r["college"], r["control_number"]))
            chk = img["checks"]
            if r["moves_to"] == "passes" and (not F.row_passes(chk) or chk.get("gaps")):
                raise SystemExit("%s %s: the image does not pass with no gap" % (r["college"], r["control_number"]))
            if r["moves_to"] == GAP and (chk.get("gaps") or []) != [GAP]:
                raise SystemExit("%s %s: the image does not carry its gap" % (r["college"], r["control_number"]))
            if r["moves_to"] == "rescored" and chk != r["before_image"]["checks"]:
                raise SystemExit("%s %s: a rescore moved the live image" % (r["college"], r["control_number"]))
            r["after_image"] = {"checks": chk}
        for r in rescored:
            r.pop("before_image", None)
            r.pop("after_image", None)
    for i, r in enumerate(rows, 1):
        r["i"] = i
    return {"rows": rows, "held": held, "rescored": rescored}


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--tag", default="s721p")
    a = ap.parse_args(argv)
    ha = held_answers()
    print("held answers: %d of %d right %s" % (ha["right"], ha["read"], ha["wrong"]))
    rc = recall_all()
    print("self-recall over %d records: %s" % (rc["records"], json.dumps(rc["by_college"])))
    if ha["wrong"] or rc["counts"].get("pass_to_fail"):
        raise SystemExit("the self-recall reads a wrong answer or a pass-to-fail: no plan is written")
    res = plan(write=not a.dry_run)
    by = dict(collections.Counter(r["moves_to"] for r in res["rows"]))
    print("plan: %d rows %s; rescored on disk %d; held %d" % (len(res["rows"]), by, len(res["rescored"]),
                                                             len(res["held"])))
    for r in res["rows"]:
        print("  %s %s %s %s -> %s" % (r["college"], r["control_number"], r["moves_to"], r["computed"][0],
                                       r["computed"][1]))
    for h in res["held"]:
        print("  held %s %s: %s" % (h["college"], h["control_number"], h["why"][:120]))
    if a.dry_run or not res["rows"]:
        return 0
    rows = res["rows"]
    stamp = time.gmtime()
    day = time.strftime("%Y-%m-%d", stamp)
    path = os.path.join(RECEIPTS, "program_requirement_records_pooled_s721_%s_%s.json" % (day, a.tag))
    lane_flips = {k: v for k, v in rc["by_college"].get("fail_to_pass", {}).items() if k in LANE}
    body = {"rule": RULING, "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", stamp), "colleges": sorted(LANE),
            "gaps": {GAP: NG.GAPS[GAP]}, "moved": len(rows), "by": by,
            "by_college": dict(sorted(collections.Counter(r["college"] for r in rows).items())),
            "held_answers": ha, "self_recall": rc,
            "elsewhere_left_for_next_run": {k: v for k, v in rc["by_college"].get("fail_to_pass", {}).items()
                                            if k not in LANE},
            "lane_fail_to_pass": lane_flips,
            "held": res["held"], "rescored_not_planned": res["rescored"], "records": rows,
            "shared_pages": {r["control_number"]: shared_with(r["college"], r["control_number"]) for r in rows
                             if shared_with(r["college"], r["control_number"])},
            "supersedes": "Modesto Junior's plan s720j (claude/s720-piles-modesto, a6d019a4), never applied",
            "representation": "checks.arithmetic, checks.gaps and checks.confidence as the load reads the rescored "
                              "score; coverage, invented and the record unchanged",
            "follow_verdict": P.FOLLOW_VERDICT,
            "pre_read": P.confirm_pre_read(rows), "pre_read_md5": F.md5_pre_read(rows),
            "apply": P.confirm_guarded_apply(rows, a.tag + " pooled"),
            "rollback": NG.rollback_sql(rows, a.tag + " pooled rollback")}
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(body, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    rel = os.path.relpath(path, ROOT)
    hdr = ("-- %s lane 1's pooled figures at eight colleges (%d rows: %s). Each row's checks become the college\n"
           "-- load's image of its rescored record (load_rows); the record unchanged. Receipt: %s (before_image per\n"
           "-- row).\n" % (a.tag.upper(), len(rows), ", ".join("%s %d" % kv for kv in sorted(by.items())), rel))
    base = os.path.join(HERE, "migrations", "%s_%s_prreq_pooled_" % (day, a.tag))
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
