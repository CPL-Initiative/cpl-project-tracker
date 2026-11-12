#!/usr/bin/env python3
"""Guards for the shared concurrency group and the rebuild after a lost push (COBIx #3110 findings 7 to 9, S641).

Failure modes, each observed before this file existed:

1. TWO WRITERS PUSH THE SAME GENERATED FILES OUTSIDE ONE GROUP (finding 7). cer-procedures.yml commits four
   files the daily also commits (kb/exhibits_adoption.json, exhibits_review.json, exhibits_related.json,
   the Commons status file) from a group of its own. Pinned: on main it joins `daily-dashboard`, and every
   workflow in that group keeps cancel-in-progress false (a cancelled apply leaves a half-written state).

2. A LOST PUSH ENDS THE RUN (finding 8). Run 43121820272 (2026-11-11 23:42Z) aborted its rebase on a conflict
   in kb/cred_rename_dryrun/report.md, a file it regenerates. The push loop is run here in a scratch repo:
   a conflict dispatches one rebuild marked rebuild_of; a rebuild never dispatches another; nothing is
   dispatched while a run waits in the group (GitHub would cancel the waiting run), or when the run list
   cannot be read; a clean rebase still pushes.

3. A MISTYPED PLAN WAITS IN THE GROUP BEFORE IT FAILS (finding 9). cer-decision-apply 43121987424 queued about
   10 minutes, then failed on its plan_dir in seconds. Pinned: each apply's `check` job sits outside the
   group, reads no secret, and the apply job needs it; the check scripts are run against this tree.

4. A STANDING-DOWN RUNG DISPLACES A WAITING APPLY. With the group on the whole daily workflow, every
   scheduled rung queued in it, though most only stand down. Pinned: the group sits on update-dashboard,
   and the gate and the three crons are untouched.

Also pinned: the lints job rebuilds the Commons status file and runs its readers on the output (S639's
lesson 1, #3111), and runs tests/partner_crosswalk_test.py.

Run from repo root: python3 tests/apply_concurrency_test.py
"""
import glob
import os
import shutil
import subprocess
import sys
import tempfile

import yaml

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WF = os.path.join(REPO, ".github", "workflows")
GROUP = "daily-dashboard"

results = []


def check(name, cond, why=""):
    results.append((name, bool(cond), why))


def load(name):
    with open(os.path.join(WF, name), encoding="utf-8") as f:
        return yaml.safe_load(f)


def on_block(doc):
    return doc.get("on", doc.get(True)) or {}   # YAML 1.1 reads a bare `on` key as True


def step(job, name):
    for s in job.get("steps") or []:
        if s.get("name") == name:
            return s
    return None


# ── 1. Finding 7: CER procedures joins the group on main ─────────────────────
cer = load("cer-procedures.yml")
grp = str((cer.get("concurrency") or {}).get("group", ""))
check("cer-procedures: on main its group is daily-dashboard",
      "github.ref == 'refs/heads/main'" in grp and "'daily-dashboard'" in grp, grp)
check("cer-procedures: a branch dispatch keeps a group of its own",
      "cer-procedures-" in grp, grp)
check("cer-procedures: cancel-in-progress is false",
      (cer.get("concurrency") or {}).get("cancel-in-progress") is False)
cer_text = open(os.path.join(WF, "cer-procedures.yml"), encoding="utf-8").read()
check("cer-procedures: the header no longer says the daily never writes its files",
      "the daily run never writes these files" not in cer_text)

in_group = []
for path in sorted(glob.glob(os.path.join(WF, "*.yml"))):
    doc = yaml.safe_load(open(path, encoding="utf-8"))
    blocks = [doc.get("concurrency")] + [j.get("concurrency") for j in (doc.get("jobs") or {}).values()]
    for c in blocks:
        if isinstance(c, dict) and GROUP in str(c.get("group", "")):
            in_group.append(os.path.basename(path))
            check(os.path.basename(path) + ": cancel-in-progress is false in the daily-dashboard group",
                  c.get("cancel-in-progress") is False)
check("the group holds the daily, the three applies this PR touches and CER procedures",
      {"daily-dashboard.yml", "cer-procedures.yml", "cer-decision-apply.yml",
       "cred-rename-apply.yml"} <= set(in_group), sorted(set(in_group)))

# ── 4. The daily: group on update-dashboard, gate and ladder untouched ────────
daily = load("daily-dashboard.yml")
dj = daily.get("jobs") or {}
check("daily: no workflow-level concurrency (a standing-down rung must not queue in the group)",
      "concurrency" not in daily)
check("daily: the gate job has no concurrency", "concurrency" not in (dj.get("gate") or {}))
ud = dj.get("update-dashboard") or {}
check("daily: update-dashboard holds the group, cancel-in-progress false",
      ud.get("concurrency") == {"group": GROUP, "cancel-in-progress": False}, ud.get("concurrency"))
check("daily: update-dashboard still needs the gate and its decision",
      ud.get("needs") == "gate" and ud.get("if") == "needs.gate.outputs.run == 'true'")
crons = [c.get("cron") for c in on_block(daily).get("schedule") or []]
check("daily: the 3-cron ladder is unchanged (Rule 1)",
      crons == ["17 6 * * *", "17 9 * * *", "17 12 * * *"], crons)
check("daily: update-dashboard may dispatch its one rebuild",
      (ud.get("permissions") or {}).get("actions") == "write")
inputs = (on_block(daily).get("workflow_dispatch") or {}).get("inputs") or {}
check("daily: a dispatch takes rebuild_of, empty by default",
      "rebuild_of" in inputs and inputs["rebuild_of"].get("default") == "")

# ── 3. Finding 9: the plan-name check runs outside the group ──────────────────
for name in ("cer-decision-apply.yml", "cred-rename-apply.yml"):
    doc = load(name)
    jobs = doc.get("jobs") or {}
    chk, app = jobs.get("check") or {}, jobs.get("apply") or {}
    check(name + ": no workflow-level concurrency", "concurrency" not in doc)
    check(name + ": a check job exists outside the group", chk and "concurrency" not in chk)
    check(name + ": the check job reads no secret", "secrets." not in yaml.safe_dump(chk))
    check(name + ": the apply needs the check", app.get("needs") == "check")
    check(name + ": the apply holds the group, cancel-in-progress false",
          app.get("concurrency") == {"group": GROUP, "cancel-in-progress": False}, app.get("concurrency"))


def run_check(name, step_name, env):
    s = step((load(name).get("jobs") or {}).get("check") or {}, step_name)
    if s is None:
        return None, "no check job step named %r in %s" % (step_name, name)
    e = dict(os.environ, **env)
    p = subprocess.run(["bash", "-c", s["run"]], cwd=REPO, env=e, capture_output=True, text=True)
    return p.returncode, p.stdout + p.stderr


plan_dirs = sorted(d for d in glob.glob(os.path.join(REPO, "kb", "cer_decisions_out", "20*"))
                   if os.path.isfile(os.path.join(d, "plan.json")))
cd_step = "Check plan_dir names a committed plan"
if plan_dirs:
    rel = os.path.relpath(plan_dirs[-1], REPO)
    rc, out = run_check("cer-decision-apply.yml", cd_step, {"PLAN_DIR": rel})
    check("cer-decision check: a committed plan passes", rc == 0, out)
rc, out = run_check("cer-decision-apply.yml", cd_step, {"PLAN_DIR": "kb/cer_decisions_out/2026-11-11-3/"})
check("cer-decision check: a trailing slash fails fast", rc == 1, out)
rc, out = run_check("cer-decision-apply.yml", cd_step, {"PLAN_DIR": "kb/cer_decisions_out/1999-01-01"})
check("cer-decision check: a well-formed name with no plan.json fails fast", rc == 1, out)

sys.path.insert(0, os.path.join(REPO, "kb"))
import ruled_renames  # noqa: E402
plan_ids = sorted(p["plan_id"] for p in ruled_renames.load(ruled_renames.PLANS_DIR))
cr_step = "Check only_plan names a ruled plan"
if plan_ids:
    rc, out = run_check("cred-rename-apply.yml", cr_step, {"ONLY_PLAN": plan_ids[0]})
    check("cred-rename check: a ruled plan passes", rc == 0, out)
    rc, out = run_check("cred-rename-apply.yml", cr_step, {"ONLY_PLAN": " " + plan_ids[0] + " "})
    check("cred-rename check: surrounding spaces pass, as the dry run strips them", rc == 0, out)
rc, out = run_check("cred-rename-apply.yml", cr_step, {"ONLY_PLAN": ""})
check("cred-rename check: empty passes (every planned rename)", rc == 0, out)
rc, out = run_check("cred-rename-apply.yml", cr_step, {"ONLY_PLAN": "   "})
check("cred-rename check: blank fails fast", rc == 1, out)
rc, out = run_check("cred-rename-apply.yml", cr_step, {"ONLY_PLAN": "no-such-plan-2026-01-01"})
check("cred-rename check: an unknown plan fails fast", rc == 1 and "no-such-plan" in out, out)

# ── 2. Finding 8: the push loop, run in a scratch repo ────────────────────────
script = (step(ud, "Commit and push to main") or {}).get("run", "")
marker = 'git commit -m "Daily dashboard update'
loop = "set -euo pipefail\n" + script[script.index(marker):]

GH_STUB = r"""#!/usr/bin/env bash
echo "$*" >> "$GH_LOG"
case "$1" in
  api)
    [ "${GH_API_FAIL:-}" = 1 ] && exit 1
    case "$*" in *status=pending*) printf '%s' "${GH_PENDING:-}" | tr ',' '\n' ;; esac ;;
  workflow) : ;;
esac
exit 0
"""


def git(cwd, *args):
    subprocess.run(["git", *args], cwd=cwd, check=True, capture_output=True, text=True)


def push_case(conflict=True, rebuild_of="", pending="", api_fail=False):
    tmp = tempfile.mkdtemp(prefix="apply_conc_")
    try:
        origin, work, other, binp = (os.path.join(tmp, d) for d in ("origin.git", "work", "other", "bin"))
        subprocess.run(["git", "init", "-q", "--bare", "-b", "main", origin], check=True)
        git(tmp, "clone", "-q", origin, work)
        for d in (work,):
            git(d, "config", "user.email", "t@example.org")
            git(d, "config", "user.name", "t")
            git(d, "checkout", "-q", "-b", "main")
        os.makedirs(os.path.join(work, ".github", "workflows"))
        os.makedirs(os.path.join(work, "kb"))
        with open(os.path.join(work, ".github", "workflows", "apply.yml"), "w") as f:
            f.write("name: x\nconcurrency:\n  group: daily-dashboard\n  cancel-in-progress: false\n")
        with open(os.path.join(work, ".github", "workflows", "other.yml"), "w") as f:
            f.write("name: y\nconcurrency:\n  group: other\n")
        for fn in ("report.md", "side.md"):
            with open(os.path.join(work, "kb", fn), "w") as f:
                f.write("base\n")
        git(work, "add", "-A")
        git(work, "commit", "-q", "-m", "base")
        git(work, "push", "-q", "origin", "main")
        git(tmp, "clone", "-q", origin, other)
        git(other, "config", "user.email", "o@example.org")
        git(other, "config", "user.name", "o")
        with open(os.path.join(other, "kb", "report.md" if conflict else "side.md"), "w") as f:
            f.write("theirs\n")
        git(other, "commit", "-qam", "a merge to main")
        git(other, "push", "-q", "origin", "main")
        with open(os.path.join(work, "kb", "report.md"), "w") as f:
            f.write("ours\n")
        git(work, "add", "kb/report.md")
        os.makedirs(binp)
        with open(os.path.join(binp, "gh"), "w") as f:
            f.write(GH_STUB)
        os.chmod(os.path.join(binp, "gh"), 0o755)
        log, summary = os.path.join(tmp, "gh.log"), os.path.join(tmp, "summary.md")
        open(log, "w").close()
        env = dict(os.environ, PATH=binp + os.pathsep + os.environ["PATH"], GH_LOG=log,
                   GH_PENDING=pending, GH_API_FAIL="1" if api_fail else "", REBUILD_OF=rebuild_of,
                   GITHUB_RUN_ID="111", GITHUB_REPOSITORY="o/r", GITHUB_STEP_SUMMARY=summary)
        p = subprocess.run(["bash", "-c", loop], cwd=work, env=env, capture_output=True, text=True, timeout=120)
        calls = open(log).read()
        head = subprocess.run(["git", "--git-dir", origin, "log", "-1", "--format=%s", "main"],
                              capture_output=True, text=True).stdout.strip()
        return p.returncode, calls, head, p.stdout + p.stderr
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


rc, calls, head, out = push_case()
check("push loop: a conflict dispatches one rebuild and the run succeeds",
      rc == 0 and "workflow run daily-dashboard.yml --ref main -f rebuild_of=111" in calls, out)
check("push loop: the lost commit never reaches main (no side picked)", head == "a merge to main", head)
rc, calls, head, out = push_case(rebuild_of="99")
check("push loop: a rebuild that conflicts fails and dispatches nothing",
      rc == 1 and "workflow run" not in calls, out)
rc, calls, head, out = push_case(pending=".github/workflows/apply.yml")
check("push loop: a run waiting in the group holds the dispatch and fails the run",
      rc == 1 and "workflow run" not in calls and "apply.yml" in out, out)
rc, calls, head, out = push_case(pending=".github/workflows/other.yml@refs/heads/main")
check("push loop: a run waiting in another group does not hold the dispatch",
      rc == 0 and "rebuild_of=111" in calls, out)
rc, calls, head, out = push_case(api_fail=True)
check("push loop: an unreadable run list holds the dispatch and fails the run",
      rc == 1 and "workflow run" not in calls, out)
rc, calls, head, out = push_case(conflict=False)
check("push loop: a clean rebase pushes and dispatches nothing",
      rc == 0 and "workflow run" not in calls and head.startswith("Daily dashboard update"), out)

# ── Lesson 1 and the crosswalk, in the lints job ──────────────────────────────
lints = (load("js-tests.yml").get("jobs") or {}).get("lints") or {}
runs = "\n".join(str(s.get("run", "")) for s in lints.get("steps") or [])
# The file's name is spelled in two parts here so the lints step's reader search does not count this test.
COMMONS = "kb/status/commons" + ".json"
check("lints: rebuilds the Commons status file from the tree, history untouched",
      "python3 kb/_build_commons_status.py --out " + COMMONS in runs)
check("lints: runs every test that reads the Commons status file against the rebuild",
      "grep -l 'commons\\.json' tests/*.test.js tests/*_test.py" in runs)
check("lints: runs the partner crosswalk test", "python3 tests/partner_crosswalk_test.py" in runs)
check("lints: runs this test", "python3 tests/apply_concurrency_test.py" in runs)

failed = [r for r in results if not r[1]]
for name, ok, why in results:
    print(("PASS " if ok else "FAIL ") + name + ("" if ok else "  " + repr(why)[:600]))
print("%d checks, %d failed" % (len(results), len(failed)))
sys.exit(1 if failed else 0)
