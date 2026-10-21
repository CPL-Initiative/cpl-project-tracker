#!/usr/bin/env python3
"""Annual Workplan Goals: the description drafting procedure (S426, 2026-10-19).

Sam: "add a procedure that drafts a description to insert in the Descriptions box
on the annual goals ... take your best guess and I'll edit it." The procedure is
kb/_draft_workplan_descriptions.py: --brief lists the empty rows with their facts,
--check validates kb/workplan_description_drafts.json, --sql prints the guarded
UPDATE the runner applies. These prove the guard refuses a stale or careless draft
and the SQL writes only where the description is still null, with its rollback.

Not wired into `npm test` (python). Run from the repo root:
    python3 tests/workplan_description_drafts_test.py
"""
import json
import os
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPT = os.path.join(ROOT, "kb", "_draft_workplan_descriptions.py")
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _draft_workplan_descriptions as d  # noqa: E402

failures = []


def check(label, ok):
    print(("PASS  " if ok else "FAIL  ") + label)
    if not ok:
        failures.append(label)


def run(*args):
    return subprocess.run([sys.executable, SCRIPT, *args], capture_output=True, text=True, cwd=ROOT)


def tmp_drafts(obj):
    f = tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8")
    json.dump(obj, f)
    f.close()
    return f.name


rows = d.projects()
filled = next(pid for pid in sorted(rows, key=d._natural) if not d.empty(rows[pid]))
check("the committed drafts validate", run("--check").returncode == 0)
brief = run("--brief")
check("the brief runs and names no row that has a description",
      brief.returncode == 0 and f"== {filled} " not in brief.stdout)

good = {"draft": "A partnership that turns a training program into college credit at the colleges that teach the same thing.",
        "sources": ["a document"], "best_guess": True, "drafted_by": "test", "drafted_at": "2026-10-19"}
empty_id = next((pid for pid in sorted(rows, key=d._natural) if d.empty(rows[pid])), None)
if empty_id:
    check("a draft for a row that is empty passes", not d.check(tmp_drafts({empty_id: good}), quiet=True))
check("a draft for a row that already has a description is refused as stale",
      any("already carries" in p for p in d.check(tmp_drafts({filled: good}), quiet=True)))
landed_row = {filled: dict(good, draft=rows[filled]["description"])}
check("a draft the runner already wrote is a record, not a stale draft",
      not d.check(tmp_drafts(landed_row), quiet=True)
      and f"where id = '{filled}'" not in d.sql(tmp_drafts(landed_row)))
check("a draft for an id the snapshot does not hold is refused",
      any("no such" in p for p in d.check(tmp_drafts({"9.9": good}), quiet=True)))
if empty_id:
    check("business register is refused",
          any("business register" in p for p in d.check(tmp_drafts({empty_id: dict(good, draft="We will leverage a robust partnership to operationalize CPL for its graduates at scale.")}), quiet=True)))
    check("a draft with no sources or no drafter is refused",
          any("sources" in p for p in d.check(tmp_drafts({empty_id: dict(good, sources=[])}), quiet=True))
          and any("drafter" in p for p in d.check(tmp_drafts({empty_id: dict(good, drafted_by="")}), quiet=True)))
    check("a draft under 40 characters is refused",
          any("shorter" in p for p in d.check(tmp_drafts({empty_id: dict(good, draft="Too short.")}), quiet=True)))

    out = d.sql(tmp_drafts({empty_id: good}))
    check("the SQL writes only where the description is still null",
          f"where id = '{empty_id}'" in out and "and description is null;" in out)
    check("the SQL carries its rollback, clearing only the draft it wrote",
          f"--   update public.projects set description = null where id = '{empty_id}' and description = $d$" in out)
    check("the SQL quotes the draft so an apostrophe cannot break it",
          "$d$" + good["draft"] + "$d$" in out)
    check("the SQL ends with a read-back", "select id, left(description, 80)" in out)
    check("--sql refuses a stale drafts file",
          run("--sql", "--drafts", tmp_drafts({filled: good})).returncode == 1)

print()
if failures:
    print(f"{len(failures)} FAILURE(S): {failures}")
    sys.exit(1)
print("workplan description drafts: all checks pass")
