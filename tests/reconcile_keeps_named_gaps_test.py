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
