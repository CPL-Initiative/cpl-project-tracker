#!/usr/bin/env python3
"""Guard for .github/workflows/workflow-failure-watch.yml (COBIx #2891 item 3, S602).

Every workflow that runs on a schedule must be either watched (named in the watcher's
`workflow_run.workflows`) or excused here with its reason, so a new cron cannot fail
unseen. Every name the watcher lists must be a real workflow `name:`, since
workflow_run matches names exactly and a typo silently watches nothing.
"""
import glob
import os
import re
import sys

import yaml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WF_DIR = os.path.join(ROOT, ".github", "workflows")
WATCHER = os.path.join(WF_DIR, "workflow-failure-watch.yml")

# Scheduled workflows that alert on their own, by name, with the reason.
EXCUSED = {
    "Sierra health (hourly uptime probe)": "raises and closes its own sierra-outage issue",
    "MAP Users sync (gated, PII-safe)": "raises and closes its own college-identity issue",
}

results = []


def check(name, cond):
    results.append((name, bool(cond)))


def load(path):
    with open(path, encoding="utf-8") as f:
        return yaml.safe_load(f)


def triggers(doc):
    # PyYAML reads the bare key `on` as True.
    return doc.get("on", doc.get(True)) or {}


workflows = {}
for path in sorted(glob.glob(os.path.join(WF_DIR, "*.yml"))):
    doc = load(path)
    workflows[doc.get("name") or os.path.basename(path)] = (path, triggers(doc))

watch = load(WATCHER)
watched = (triggers(watch).get("workflow_run") or {}).get("workflows") or []

check("the watcher listens for completed runs",
      (triggers(watch).get("workflow_run") or {}).get("types") == ["completed"])
check("the watcher can write issues and nothing else beyond reading",
      watch.get("permissions") == {"contents": "read", "issues": "write"})

unknown = [n for n in watched if n not in workflows]
check("every watched name is a real workflow name (%s)" % (", ".join(unknown) or "all match"), not unknown)

scheduled = [n for n, (_, t) in workflows.items() if isinstance(t, dict) and "schedule" in t]
uncovered = [n for n in scheduled if n not in watched and n not in EXCUSED]
check("every scheduled workflow is watched or excused (%s)" % (", ".join(uncovered) or "none left"), not uncovered)

both = [n for n in EXCUSED if n in watched]
check("no excused workflow is also watched (it would raise two issues)", not both)

stale = [n for n in EXCUSED if n not in workflows]
check("every excused name is a real workflow name", not stale)

src = open(WATCHER, encoding="utf-8").read()
check("only unattended runs alert (a schedule, or main)",
      "workflow_run.event == 'schedule'" in src and "workflow_run.head_branch == 'main'" in src)
check("a success closes the issue", re.search(r"success\)\s*\n\s*if \[ -n \"\$NUM\" \]; then\s*\n\s*gh issue close", src))
check("one issue per workflow, found by its title", 'TITLE="Failing: $WF"' in src and "select(.title == $t)" in src)

for name, ok in results:
    print(("  ok   " if ok else "  FAIL ") + name)
failed = [n for n, ok in results if not ok]
print("workflow_failure_watch_test.py: %d/%d checks passed" % (len(results) - len(failed), len(results)))
sys.exit(1 if failed else 0)
