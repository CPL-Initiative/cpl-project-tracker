#!/usr/bin/env python3
"""A reconcile's rescore keeps a record's named gap (S720, f-rescore-drops-ge-units-not-read-gaps-s714).

THE CASE. S714's three free Los Rios reconciles rescored records outside the programs they were run for. The
rescore (kb/_program_requirements_college.py, reconcile_filed) replaced each record's score with the scorer's, and
the scorer writes no named gap (score.gaps, score.confidence; kb/_program_named_gaps.py), so 16 records lost their
ge_units_not_read gap and were stamped with the run as changed. They were put back to main's filings by hand.

THE FIX. keep_named_gaps carries a filed gap onto the fresh score while the fresh score fails and the gap's own rule
still names it on the record as now scored; a fresh score that passes needs no gap; a gap whose rule no longer names
it is dropped, said aloud.

WHAT THIS PINS, on a pinned fixture (tests/fixtures/reconcile_named_gaps/, Sacramento City 04662 as filed on main at
56c38abf, never the live census):
  1. reconcile_filed on the fixture with a fresh page keeps its ge_units_not_read gap and confidence, and, the score
     unchanged, never stamps the record with the run (step=reread would post it).
  2. keep_named_gaps: the gap stays on a failing fresh score; a passing fresh score carries none; a fresh score
     whose major no longer adds up drops ge_units_not_read (its rule no longer names it).
  2b. A record a reconcile step rewrites (a synthetic Cabrillo degree, its degree total filled) keeps its gap, with
     the rule's words now.
  2c. A gap's rule found through by_measure (Berkeley City 37797's no_hours_read is no_units_read's rule on an hours
     program) and #3502's planned catalog_figures_differ (Bakersfield 20269, read by its own sentence): each stays
     while it holds and drops when it no longer does (an unequal hours sum is hours_total_differs).
  3. Every committed record that files a gap: its own score, rescored to itself, keeps every gap and the confidence
     unchanged, so a reconcile that reads nothing new changes no gap anywhere.

    python3 tests/reconcile_keeps_named_gaps_test.py
"""
from __future__ import annotations

import contextlib
import copy
import glob
import io
import json
import os
import shutil
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_requirements_college as C  # noqa: E402
import _program_requirements_score as S  # noqa: E402

FAILS: list[str] = []


def check(ok: bool, what: str) -> None:
    print(("ok   " if ok else "FAIL ") + what)
    if not ok:
        FAILS.append(what)


FIXTURE = os.path.join(ROOT, "tests", "fixtures", "reconcile_named_gaps", "sacramento_city_04662.json")
with open(FIXTURE, encoding="utf-8") as fh:
    filed = json.load(fh)
gaps = filed["score"].get("gaps") or []
check([g.get("gap") for g in gaps] == ["ge_units_not_read"] and not filed["score"].get("pass"),
      "the fixture is Sacramento City 04662 filing a ge_units_not_read gap, failing")


def closed_list(f: dict) -> list[dict]:
    """The state file's courses as the record placed them, with their units: the closed list the reconcile reads."""
    out = []
    for b in (f["record"].get("blocks") or []):
        for c in b.get("courses") or []:
            for alt in [c] + list(c.get("alternatives") or []):
                if alt.get("code") and not alt.get("catalog_addition"):
                    out.append({"code": alt["code"], "units": alt.get("units")})
    # The listed courses the record explains as missing, as the filed coverage names them.
    return out + [{"code": k, "units": None} for k in (f["score"].get("coverage") or {}).get("missing") or []]


# ── 1. reconcile_filed keeps the gap ─────────────────────────────────────────────────────────────
tmp = tempfile.mkdtemp()
try:
    keep, outd = os.path.join(tmp, "keep"), os.path.join(tmp, "out")
    os.makedirs(os.path.join(keep, "records"))
    os.makedirs(os.path.join(outd, "sources"))
    with open(os.path.join(keep, "records", "04662.json"), "w", encoding="utf-8") as fh:
        json.dump(filed, fh)
    heading = filed["record"]["program"].get("section_heading") or filed["title"]
    prog = filed["record"]["program"]
    # The page as the read held it: the heading, the courses, the outcomes and careers the record keeps as printed.
    text = "%s\n%s\nElectives as needed to reach 60 units.\nProgram Student Learning Outcomes\n%s\nCareer Information\n%s\n" % (
        heading, "\n".join("%s %s" % (c["code"], c.get("units")) for c in closed_list(filed)),
        "\n".join(prog.get("outcomes") or []), "\n".join(prog.get("careers") or []))
    with open(os.path.join(outd, "sources", "04662.json"), "w", encoding="utf-8") as fh:
        json.dump({"control_number": "04662", "award": filed.get("award"), "closed_list": closed_list(filed),
                   "text": text}, fh)
    with contextlib.redirect_stdout(io.StringIO()):
        C.reconcile_filed("Sacramento City College", outd, "45999999999", keep)
    with open(os.path.join(outd, "records", "04662.json"), encoding="utf-8") as fh:
        got = json.load(fh)
    check(not got["score"].get("pass"), "the reconcile's fresh score still fails (the GE units are still not read)")
    check([g.get("gap") for g in got["score"].get("gaps") or []] == ["ge_units_not_read"],
          "the reconcile keeps the ge_units_not_read gap (%s)" % [g.get("gap") for g in got["score"].get("gaps") or []])
    check(got["score"].get("confidence") == filed["score"].get("confidence"),
          "the confidence stays as filed (%s)" % got["score"].get("confidence"))
    moved = sorted(k for k in set(got["score"]) | set(filed["score"]) if got["score"].get(k) != filed["score"].get(k))
    check(got.get("extracted_run") == filed.get("extracted_run") and "read_run" not in got and not moved,
          "a score the reconcile left unchanged is not stamped with the run, so step=reread never posts it (%s; %s)"
          % (moved, [n.get("field") for n in got.get("reconciled") or []]))
finally:
    shutil.rmtree(tmp, ignore_errors=True)

# ── 2. keep_named_gaps, by case ───────────────────────────────────────────────────────────────────
keep_gaps = getattr(C, "keep_named_gaps", None)
check(callable(keep_gaps), "the reconcile has a gap keeper (keep_named_gaps)")
if callable(keep_gaps):
    fresh = {k: v for k, v in filed["score"].items() if k not in ("gaps", "confidence", "confidence_notes")}
    with contextlib.redirect_stdout(io.StringIO()):
        kept = keep_gaps("04662", filed["score"], fresh, filed)
    check(kept == filed["score"], "a failing fresh score takes the filed gap and confidence back whole")
    passing = copy.deepcopy(fresh)
    passing["arithmetic"] = {"pass": True, "status": "equal", "computed": [60.0, 60.0], "stated": [60.0, 60.0],
                             "against": "degree", "why": []}
    passing["pass"] = True
    with contextlib.redirect_stdout(io.StringIO()):
        out = keep_gaps("04662", filed["score"], passing, filed)
    check("gaps" not in out and "confidence" not in out, "a fresh score that passes carries no gap")
    broken = copy.deepcopy(fresh)
    broken["arithmetic"]["major"] = dict(broken["arithmetic"]["major"], **{"pass": False, "status": "unequal"})
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        out = keep_gaps("04662", filed["score"], broken, filed)
    check("gaps" not in out and "no longer holds" in buf.getvalue(),
          "a fresh score whose major no longer adds up drops ge_units_not_read, said aloud")

# ── 2b. The changed-record branch: a reconcile step writes the record, and the gap still rides ──────
# Cabrillo's step fills the degree total the page prints ("Complete the following number of credits: 60"); the GE
# pattern's units stay unread, so the record still takes ge_units_not_read (a synthetic record, the S392 shape).
tmp = tempfile.mkdtemp()
try:
    keep, outd = os.path.join(tmp, "keep"), os.path.join(tmp, "out")
    os.makedirs(os.path.join(keep, "records"))
    os.makedirs(os.path.join(outd, "sources"))
    gap = {"gap": "ge_units_not_read", "label": "x", "words": "filed words"}
    cab = {"college": "Cabrillo College", "control_number": "06326", "award": "A.S. Degree", "extracted_run": 38442109713,
           "record": {"program": {"section_heading": "Astronomy - Associate in Science (A.S.)",
                                  "total_units": {"min": 30, "max": 30}, "measure": "units",
                                  "ge_pattern": "Cabrillo College General Education"},
                      "blocks": [{"name": "Major", "rule": "all", "courses": [{"code": "ASTRO 3", "units": 30}]}]},
           "score": {"pass": False, "arithmetic": {"pass": False, "status": "incomplete", "against": "degree"},
                     "coverage": {"pass": True}, "invented": {"pass": True}, "gaps": [gap],
                     "confidence": {"catalog_year": 100, "source": 80}}}
    with open(os.path.join(keep, "records", "06326.json"), "w", encoding="utf-8") as fh:
        json.dump(cab, fh)
    with open(os.path.join(outd, "sources", "06326.json"), "w", encoding="utf-8") as fh:
        json.dump({"control_number": "06326", "award": "A.S. Degree", "closed_list": [{"code": "ASTRO 3", "units": 30}],
                   "text": "Program Requirements\nAstronomy - Associate in Science (A.S.)\n"
                           "Complete the following number of credits: 60\nASTRO 3 Stars 30\n"}, fh)
    with contextlib.redirect_stdout(io.StringIO()):
        C.reconcile_filed("Cabrillo College", outd, "45999999998", keep)
    with open(os.path.join(outd, "records", "06326.json"), encoding="utf-8") as fh:
        got = json.load(fh)
    gg = got["score"].get("gaps") or [{}]
    check([n.get("field") for n in got.get("reconciled") or []] == ["degree_total"]
          and [g.get("gap") for g in gg] == ["ge_units_not_read"] and gg[0].get("words", "").startswith(
              "the degree names the Cabrillo College General Education pattern")
          and got["score"]["confidence"].get("source") == 80,
          "a record a reconcile step rewrote keeps its gap, with the rule's words now and the filed source score")
finally:
    shutil.rmtree(tmp, ignore_errors=True)

# ── 2c. A gap found through by_measure, and a planned gap ────────────────────────────────────────
import _program_named_gaps as NG  # noqa: E402
if callable(keep_gaps):
    with open(os.path.join(os.path.dirname(FIXTURE), "berkeley_city_37797.json"), encoding="utf-8") as fh:
        bc = json.load(fh)
    fresh = {k: v for k, v in bc["score"].items() if k not in ("gaps", "confidence", "confidence_notes")}
    with contextlib.redirect_stdout(io.StringIO()):
        same = keep_gaps("37797", bc["score"], fresh, bc)
    check(bc["score"]["gaps"][0]["gap"] == "no_hours_read" and same == bc["score"],
          "Berkeley City 37797's no_hours_read (no_units_read's rule on an hours program) stays while it holds")
    fresh["arithmetic"] = {"pass": False, "status": "unequal", "computed": [100.0, 100.0], "stated": [120.0, 120.0],
                           "against": "program", "why": ["the blocks sum to 100-100; the catalog states 120-120"]}
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        out = keep_gaps("37797", bc["score"], fresh, bc)
    check("gaps" not in out and "no_hours_read no longer holds" in buf.getvalue()
          and NG.answer(dict(bc, score=fresh))[0] == "hours_total_differs",
          "given an unequal hours sum, 37797 drops no_hours_read (the named gaps would give hours_total_differs)")
    with open(os.path.join(os.path.dirname(FIXTURE), "bakersfield_20269.json"), encoding="utf-8") as fh:
        bk = json.load(fh)
    fresh = {k: v for k, v in bk["score"].items() if k not in ("gaps", "confidence", "confidence_notes")}
    with contextlib.redirect_stdout(io.StringIO()):
        same = keep_gaps("20269", bk["score"], fresh, bk)
    check(bk["score"]["gaps"][0]["gap"] == "catalog_figures_differ" and same == bk["score"],
          "Bakersfield 20269's planned catalog_figures_differ stays while the record meets the gap's sentence")
    fresh["arithmetic"] = dict(fresh["arithmetic"], computed=[30.0, 30.0])
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        out = keep_gaps("20269", bk["score"], fresh, bk)
    check("gaps" not in out and "catalog_figures_differ no longer holds" in buf.getvalue(),
          "a sum no longer past the printed total drops catalog_figures_differ")

# ── 3. Every committed record that files a gap keeps it on its own score ─────────────────────────
n = same = 0
by = {}
for path in sorted(glob.glob(os.path.join(ROOT, "kb", "program_requirements_college", "*", "records", "*.json"))):
    with open(path, encoding="utf-8") as fh:
        f = json.load(fh)
    sc = f.get("score")
    if not isinstance(sc, dict) or not sc.get("gaps") or not callable(keep_gaps):
        continue
    n += 1
    fresh = {k: v for k, v in sc.items() if k not in ("gaps", "confidence", "confidence_notes")}
    with contextlib.redirect_stdout(io.StringIO()):
        out = keep_gaps(f.get("control_number"), sc, fresh, f)
    if out == sc:
        same += 1
    else:
        name = (sc["gaps"][0] or {}).get("gap") if isinstance(sc["gaps"][0], dict) else sc["gaps"][0]
        by[name] = by.get(name, 0) + 1
check(n >= 300 and same == n, "every committed record filing a gap keeps it on its own score: %d of %d (%s)"
      % (same, n, by))

print("\n%d failed" % len(FAILS) if FAILS else "\nall passed")
sys.exit(1 if FAILS else 0)
