#!/usr/bin/env python3
"""Glendale's STV-for-OBT prefix alias applies at Glendale alone (S703, d-glendale-obt-stv-prefix-alias-s703).

Customer Service 38973's own Coursedog tab NCCS (its program data names 38973; college page read 45016708970)
prints STV11, STV35, STV40 and STV50, where the state's file lists OBT 11, 35, 40 and 50. The pair sits in
Glendale's reconcile entry (kb/program_requirements_reconcile.json, prefix_aliases), a per-college entry; no shared
function changed. This test guards the failure modes:
  A. the pair is Glendale's and no other college's;
  B. with it, the capture's coarse net names all four listed courses on the NCCS page, and without it none;
  C. the scorer reads a placed STV code as the listed OBT one, and never renames an STV code the file lists as
     printed (40846 and 40847 list STV 40);
  D. on the committed records, the pair changes no filed Glendale record's renaming.
"""
import glob
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))

import _program_requirements_reconcile as RC  # noqa: E402
import _program_requirements_score as S  # noqa: E402
import _program_requirements_college as PC  # noqa: E402

GLENDALE = "Glendale Community College"
FAILS = []


def check(ok, what):
    print(("PASS " if ok else "FAIL ") + what)
    if not ok:
        FAILS.append(what)


steps = RC.load_steps()
# ── A. Glendale's alone ─────────────────────────────────────────────────────────────────────────────
check((steps[GLENDALE].get("prefix_aliases") or {}).get("STV") == "OBT", "A Glendale's entry maps STV to OBT")
others = [c for c, v in steps.items() if c != GLENDALE and isinstance(v, dict)
          and ("STV" in (v.get("prefix_aliases") or {}) or "OBT" in (v.get("prefix_aliases") or {}).values())]
check(others == [], "A no other college carries the STV or OBT pair: %s" % others)
cites = [c for c in steps[GLENDALE].get("prefix_aliases_cited") or [] if c.get("printed") == "STV"]
check(len(cites) == 1 and cites[0].get("file") == "OBT" and cites[0].get("session") == "S703",
      "A the pair names its evidence (S703, college page read 45016708970)")

# ── B. The coarse net on the NCCS page ──────────────────────────────────────────────────────────────
NCCS = ("Customer Service Certificate of Completion · Hours · Required Courses: · STV11 Beginning Keyboarding · 50 · "
        "STV35 On-The-Job Communication · 32 · STV40 21st Century Employment Strategies · 96 · STV50 Customer Service "
        "Skills · 32 · Total Required Hours · 210")
OBT = ["OBT 11", "OBT 35", "OBT 40", "OBT 50"]


def listed_with(aliases):
    progs = [{"closed_list": [{"code": c} for c in OBT]}]
    PC.with_renumbers(progs, {}, aliases)
    return progs[0]["closed_list"]


codes = PC.page_codes(NCCS)
glen = listed_with(RC.load_steps()[GLENDALE]["prefix_aliases"])
check([c.get("printed") for c in glen] == ["STV 11", "STV 35", "STV 40", "STV 50"],
      "B each listed OBT course carries the STV code the catalog prints: %s" % glen)
check(PC.net_hits(glen, codes) == 4, "B with the pair, the coarse net names 4 of 4 on NCCS")
check(PC.net_hits(listed_with(None), codes) == 0, "B with no pair, it names 0 of 4 (the refusal of capture 44915445658)")
canyons = (steps.get("College of the Canyons") or {}).get("prefix_aliases")
check(PC.net_hits(listed_with(canyons), codes) == 0, "B another college's aliases name none of them")

# ── C. The scorer ───────────────────────────────────────────────────────────────────────────────────
rec = {"program": {"total_units": {"min": 210, "max": 210}, "measure": "hours"},
       "blocks": [{"name": "Required Courses", "rule": "all",
                   "courses": [{"code": "STV11", "hours": 50}, {"code": "STV35", "hours": 32},
                               {"code": "STV40", "hours": 96}, {"code": "STV50", "hours": 32}]}]}
LIST = [{"code": c, "units": 0} for c in OBT]
now = RC.prefix_aliases(GLENDALE)
with_pair = S.score(rec, LIST, "x", "Noncredit program", now)
check(with_pair["coverage"]["pass"] and not with_pair["invented"]["codes"],
      "C with Glendale's aliases, STV11 to STV50 read as the listed OBT courses: %s" % json.dumps(with_pair["coverage"]))
without = S.score(rec, LIST, "x", "Noncredit program", None)
check(not without["coverage"]["pass"], "C with none, the four are missing")
stv40 = {"blocks": [{"name": "Required", "rule": "all", "courses": [{"code": "STV 40"}]}]}
kept = S.with_prefix_aliases(stv40, {"STV40": None, "OBT40": None}, now)
check(kept["blocks"][0]["courses"][0]["code"] == "STV 40", "C an STV code the file lists as printed is never renamed")

# ── D. The committed records ────────────────────────────────────────────────────────────────────────
import _prefix_alias_census as PA  # noqa: E402
before = {k: v for k, v in now.items() if k != "STV"}
moved = []
for path in sorted(glob.glob(os.path.join(ROOT, "kb", "program_requirements_college", "glendale_community",
                                          "records", "*.json"))):
    with open(path) as fh:
        f = json.load(fh)
    if not isinstance(f.get("record"), dict) or not f.get("score"):
        continue
    lst = PA.rebuilt_list(f, before)
    if S.with_prefix_aliases(f["record"], lst, now) != S.with_prefix_aliases(f["record"], lst, before):
        moved.append(f.get("control_number"))
check(moved == [], "D the pair renames nothing in a filed Glendale record: %s" % moved)

if FAILS:
    print("%d failed" % len(FAILS))
    sys.exit(1)
print("all checks passed")
