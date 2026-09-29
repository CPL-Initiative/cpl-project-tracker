#!/usr/bin/env python3
"""Guards kb/_funding_config_edit_apply.py, the reviewed write into the stored funding config.

Sam allowed the workflow that runs it on 2026-09-29 (open-asks sheet 3, card 7). Curators edit
cpl_funding_config on the Implementation Funding tab, so these checks pin what keeps a session's
write from ever overwriting a curator: nothing is written unless every path still holds its
reviewed before-value, the one PATCH is filtered on the updated_at the fresh read returned, the
receipt exists before the PATCH, and --rollback restores only the paths nobody has touched since.

Runs against an in-memory row; no network. Run from repo root:
    python3 tests/funding_config_edit_apply_test.py
"""
import copy
import glob
import json
import os
import re
import shutil
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _funding_config_edit_apply as app  # noqa: E402

results = []


def check(name, cond, why=""):
    results.append((name, bool(cond), why))


CONFIG = {"projects": {"cpl-implementation": {"scenarios": {
    "Scenario 1": {"timing": [{"label": "a"}, {"label": "Old label"}], "text": {"elig_intro": "Old intro"}},
    "Scenario 2": {"timing": [{"label": "a"}, {"label": "Old label"}], "text": {"elig_intro": "Old intro"}},
}}}}
P = ["projects", "cpl-implementation", "scenarios"]
PLAN = {"row_id": "default", "ruling": "test ruling", "cohort": "test-s0@bot", "edits": [
    {"path": P + ["Scenario 1", "timing", 1, "label"], "before": "Old label", "after": "New label"},
    {"path": P + ["Scenario 1", "text", "elig_intro"], "before": "Old intro", "after": "New intro"},
    {"path": P + ["Scenario 2", "timing", 1, "label"], "before": "Old label", "after": "New label"},
]}


class FakeRest:
    """One cpl_funding_config row in memory, answering the applier's read and filtered PATCH."""

    def __init__(self, config, plan_dir, updated_at="2026-09-29 10:00:00+00"):
        self.row = {"id": "default", "config": copy.deepcopy(config),
                    "updated_at": updated_at, "updated_by": "curator@cccco.edu"}
        self.plan_dir = plan_dir
        self.writes = []
        self.receipt_before_write = None
        self.before_write = None
        self.n = 0

    def read(self, row_id):
        return copy.deepcopy(self.row) if row_id == self.row["id"] else None

    def write(self, row_id, updated_at, config, updated_by):
        got = sorted(glob.glob(os.path.join(self.plan_dir, "applied_*.json")) +
                     glob.glob(os.path.join(self.plan_dir, "rolled_back_*.json")), key=os.path.getmtime)
        self.receipt_before_write = bool(got) and json.load(open(got[-1]))["result"] == "pending"
        if self.before_write:
            self.before_write(self)
        self.writes.append({"updated_at": updated_at, "updated_by": updated_by})
        if row_id != self.row["id"] or updated_at != self.row["updated_at"]:
            return []
        self.n += 1
        self.row.update(config=copy.deepcopy(config), updated_by=updated_by,
                        updated_at="2026-09-29 10:00:%02d+00" % self.n)
        return [copy.deepcopy(self.row)]


def plan_dir(plan=PLAN):
    d = tempfile.mkdtemp(prefix="fcfg_")
    with open(os.path.join(d, "plan.json"), "w", encoding="utf-8") as fh:
        json.dump(plan, fh)
    return d


def run(d, mode, rest):
    lines = []
    code = app.run(d, mode, rest, out=lines.append)
    return code, lines


def at(rest, i):
    return app.get_path(rest.row["config"], PLAN["edits"][i]["path"])


# ── dry run reads and reports, and writes nothing ────────────────────────────
d = plan_dir()
r = FakeRest(CONFIG, d)
code, lines = run(d, "dry-run", r)
check("a dry run over unchanged paths exits 0", code == 0, lines)
check("a dry run writes nothing and leaves no receipt",
      not r.writes and not glob.glob(os.path.join(d, "applied_*.json")))
moved = copy.deepcopy(CONFIG)
moved["projects"]["cpl-implementation"]["scenarios"]["Scenario 2"]["timing"][1]["label"] = "Curator's words"
r = FakeRest(moved, d)
code, lines = run(d, "dry-run", r)
check("a dry run that finds a path a curator moved exits 1", code == 1, lines)
check("the dry run names the moved path",
      [x.split()[0] for x in lines if x.strip().endswith("Scenario 2/timing/1/label")] == ["moved"])
shutil.rmtree(d)

# ── commit writes once, filtered on the read, with the receipt first ─────────
d = plan_dir()
r = FakeRest(CONFIG, d)
code, lines = run(d, "commit", r)
check("a commit over unchanged paths exits 0", code == 0, lines)
check("the commit makes one PATCH, filtered on the updated_at the read returned",
      len(r.writes) == 1 and r.writes[0]["updated_at"] == "2026-09-29 10:00:00+00")
check("the PATCH stamps the plan's cohort as updated_by", r.writes[0]["updated_by"] == "test-s0@bot")
check("the receipt exists, marked pending, before the PATCH", r.receipt_before_write is True)
check("every edited path reads its after-value",
      [at(r, i) for i in range(3)] == ["New label", "New intro", "New label"])
check("a path the plan does not name is untouched",
      r.row["config"]["projects"]["cpl-implementation"]["scenarios"]["Scenario 2"]["text"]["elig_intro"] == "Old intro")
rec = json.load(open(glob.glob(os.path.join(d, "applied_*.json"))[0]))
check("the receipt records the before-values, the read and a written result",
      rec["result"] == "written" and rec["read"]["updated_by"] == "curator@cccco.edu"
      and [e["before"] for e in rec["edits"]] == ["Old label", "Old intro", "Old label"])
code, lines = run(d, "commit", r)
check("a second commit refuses, since the paths now hold their after-values",
      code == 1 and len(r.writes) == 1)

# ── rollback restores only what nobody has touched since ─────────────────────
app.set_path(r.row["config"], PLAN["edits"][2]["path"], "Curator changed it")
code, lines = run(d, "rollback", r)
check("a rollback exits 0", code == 0, lines)
check("the rollback restores the untouched paths",
      at(r, 0) == "Old label" and at(r, 1) == "Old intro")
check("the rollback holds out the path a curator changed after the write",
      at(r, 2) == "Curator changed it")
rb = json.load(open(glob.glob(os.path.join(d, "rolled_back_*.json"))[0]))
check("the rollback receipt lists the held-out path",
      len(rb["held_out"]) == 1 and rb["held_out"][0]["live"] == "Curator changed it")
shutil.rmtree(d)

# ── a curator's save between the read and the write wins ─────────────────────
d = plan_dir()
r = FakeRest(CONFIG, d)


def curator_saves(rest):
    rest.row["updated_at"] = "2026-09-29 10:00:30+00"
    app.set_path(rest.row["config"], PLAN["edits"][0]["path"], "Curator's newer label")


r.before_write = curator_saves
code, lines = run(d, "commit", r)
check("a save between the read and the write matches no row and exits 1", code == 1, lines)
check("the curator's newer save stands", at(r, 0) == "Curator's newer label" and at(r, 1) == "Old intro")
rec = json.load(open(glob.glob(os.path.join(d, "applied_*.json"))[0]))
check("the receipt says nothing was written", rec["result"].startswith("no row matched"))
shutil.rmtree(d)

# ── a commit refuses when any path has moved ─────────────────────────────────
d = plan_dir()
r = FakeRest(moved, d)
code, lines = run(d, "commit", r)
check("a commit refuses when one path has moved, and writes none of them",
      code == 1 and not r.writes and at(r, 0) == "Old label")
shutil.rmtree(d)

# ── the plan and path rules ──────────────────────────────────────────────────
try:
    app.set_path(copy.deepcopy(CONFIG), P + ["Scenario 1", "text", "no_such_key"], "x")
    check("set_path refuses a key that does not exist", False)
except KeyError:
    check("set_path refuses a key that does not exist", True)
bad = copy.deepcopy(PLAN)
bad["edits"][0]["after"] = bad["edits"][0]["before"]
d = plan_dir(bad)
try:
    app.load_plan(d)
    check("a plan whose edit changes nothing is rejected", False)
except SystemExit:
    check("a plan whose edit changes nothing is rejected", True)
shutil.rmtree(d)

# ── the committed plans are reviewed ones ────────────────────────────────────
plans = glob.glob(os.path.join(ROOT, "kb", "funding_config_edits_out", "*", "plan.json"))
check("a committed plan exists", bool(plans))
RETIRED = ("accrue", "relevel", "undispersed", "baseline", "rolled")
# Whole words: "rolled" is retired ("Rolled to Year 2"), and "enrolled veteran" is
# the veteran condition's own wording (S303, sheet 4 card 6). A word may carry a
# suffix (accrues, releveled); it may not sit inside another word.
_RETIRED_RE = re.compile(r"\b(?:%s)\w*" % "|".join(RETIRED), re.I)
for p in plans:
    pl = json.load(open(p, encoding="utf-8"))
    name = os.path.relpath(p, ROOT)
    check("%s names its row, ruling and cohort" % name,
          pl.get("row_id") and pl.get("ruling") and str(pl.get("cohort", "")).endswith("@bot"))
    check("%s writes only strings into existing text paths" % name,
          all(isinstance(e["after"], str) and isinstance(e["before"], str) for e in pl["edits"]))
    check("%s writes none of the retired words" % name,
          not any(_RETIRED_RE.search(e["after"]) for e in pl["edits"]))
check("the retired-word check reads whole words, and still catches each one",
      not _RETIRED_RE.search("uploaded for enrolled veterans")
      and all(_RETIRED_RE.search(t) for t in ("Rolled to Year 2", "Releveled", "accrue funding",
                                              "Undispersed Funds", "Baseline outcomes")))

passed = 0
for name, ok, why in results:
    print(f"{'  ok' if ok else 'FAIL'}  {name}" + ("" if ok else f"  — {why}"))
    passed += ok
print(f"\n{passed}/{len(results)} checks passed")
sys.exit(0 if passed == len(results) else 1)
