#!/usr/bin/env python3
"""The Commons data dashboard's builder (kb/_build_commons_data_status.py, #3215 slice 1).

What it guards, each a way the page could mislead:
  (1) the universe is the identity crosswalk's colleges and continuing-education campuses, partners left off,
      every college once;
  (2) every committed harvest folder, SLO queue row and scout row resolves to a crosswalk college (an unmatched
      name would drop a college's figures silently);
  (3) the statewide figures are the sums of the college rows, and the program figures equal the gap census's own
      committed-files count, so the page and the census cannot drift apart;
  (4) a college with no committed harvest carries null figures (unread), never a zero;
  (5) confidence is TBA until a spot-check receipt is committed, and every field carries a College-view flag;
  (6) the age thresholds live in the file, once.

Run from the repo root: python3 tests/commons_data_status_build_test.py
"""
import importlib.util
import json
import os
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("build_cdd", os.path.join(ROOT, "kb", "_build_commons_data_status.py"))
B = importlib.util.module_from_spec(spec)
spec.loader.exec_module(B)

results = []


def check(name, cond, detail=""):
    results.append((name, bool(cond)))
    print(("PASS " if cond else "FAIL ") + name + ((" — " + str(detail)) if (detail and not cond) else ""))


with tempfile.TemporaryDirectory() as tmp:
    out = os.path.join(tmp, "commons_data.json")
    r = subprocess.run([sys.executable, os.path.join(ROOT, "kb", "_build_commons_data_status.py"), "--root", ROOT, "--out", out, "--quiet"],
                       capture_output=True, text=True, timeout=300)
    check("the builder exits 0 on the repo", r.returncode == 0, r.stderr[-400:])
    with open(out, encoding="utf-8") as f:
        d = json.load(f)

cw = json.load(open(os.path.join(ROOT, B.CROSSWALK), encoding="utf-8"))["colleges"]
in_scope = [e for e in cw if e["entity_kind"] in ("college", "continuing_education")]
C = d["colleges"]
S = d["statewide"]

# (1) the universe
check("(1) the universe is the crosswalk's colleges and continuing-education campuses", len(C) == len(in_scope) == S["colleges"],
      (len(C), len(in_scope)))
check("(1) no partner entity is listed", not any(c["kind"] == "partner" for c in C))
check("(1) every college once", len({c["id"] for c in C}) == len(C))
check("(1) the continuing-education campuses are in", S["continuing_education"] == sum(1 for e in in_scope if e["entity_kind"] == "continuing_education") > 0)

# (2) every name resolves
check("(2) every harvest folder, SLO queue row and scout row resolves to a crosswalk college", d["unmatched"] == [], d["unmatched"][:5])
folders = [p for p in os.listdir(os.path.join(ROOT, B.COLLEGE_DIR)) if os.path.isdir(os.path.join(ROOT, B.COLLEGE_DIR, p))]
check("(2) every committed harvest folder is one harvested college", S["harvested"] == len(folders) == len({c["slug"] for c in C if c["harvested"]}),
      (S["harvested"], len(folders)))

# (3) the sums
hv = [c for c in C if c["harvested"]]
for k in ("programs", "passing", "gap"):
    check("(3) statewide %s is the sum of the college rows" % k, S[k] == sum(c[k] for c in hv), (S[k], sum(c[k] for c in hv)))
check("(3) each college's passing plus still-to-pass is its listed programs", all(c["passing"] + c["gap"] == c["programs"] for c in hv))
check("(3) each college's still-to-pass is the sum of its causes", all(sum(c["causes"].values()) == c["gap"] for c in hv))
check("(3) the program figures equal the gap census's committed-files count",
      (S["programs"], S["passing"], S["gap"]) == (d["census_check"]["universe"], d["census_check"]["passing"], d["census_check"]["gap"]), d["census_check"])
check("(3) unread is the universe less the harvested", S["unread"] == len(C) - S["harvested"] == sum(1 for c in C if not c["harvested"]))

# (4) unread is null, never zero
unread = [c for c in C if not c["harvested"]]
check("(4) a college with no committed harvest carries null figures, never a zero",
      all(c["programs"] is None and c["passing"] is None and c["gap"] is None and c["read_at"] is None for c in unread))
check("(4) every harvested college names its read date and kind", all(c["read_at"] and c["read_kind"] in ("capture", "capture_preview") for c in hv))

# (5) TBA and the field flags
check("(5) confidence is TBA while no spot-check receipt is committed", ("confidence" in d["tba"]) == (S["spot_checked"] == 0))
check("(5) every field a college row carries has a flag, shareable or internal",
      all(set(c) == set(d["fields"]) for c in C) and set(d["fields"].values()) <= {"shareable", "internal"}, sorted(set(C[0]) ^ set(d["fields"])))
check("(5) dollars and process notes are internal", all(d["fields"][k] == "internal" for k in ("cost_usd", "passed_at_read", "causes", "slo_queue", "scout")))
check("(5) the overall bar, the API checklist and the JST funnel are TBA with reasons", all(d["tba"].get(k) for k in ("overall", "apis", "jst")))

# (6) the thresholds, once
check("(6) the age thresholds are in the file", d["rule"]["age_days"] == {"fresh": 7, "recent": 30})

# No staleness check here on purpose: a harvest wave commits per-college files without rebuilding this one, so a
# byte check would turn main red on every wave. The census workflow rebuilds it; the page names its build date.
committed = json.load(open(os.path.join(ROOT, B.OUT), encoding="utf-8"))
check("the committed file has the builder's shape", set(committed) == set(d) and committed["schema"] == d["schema"])

failed = [n for n, ok in results if not ok]
print("\n%d/%d checks passed" % (len(results) - len(failed), len(results)))
sys.exit(1 if failed else 0)
