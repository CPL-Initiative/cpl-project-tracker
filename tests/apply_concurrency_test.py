#!/usr/bin/env python3
"""Guards for the daily-dashboard concurrency group and the apply workflows' plan checks (COBIx #3110, S641).

Failure modes, each observed before this file existed:

1. A MEMBER LEAVES THE GROUP, OR A WIDER GROUP CANCELS RUNS. GitHub keeps one pending run per group and
   cancels the older pending run, with no alert, when another queues. The group's membership is pinned
   exactly as it stands, so a member leaving fails here and a new member is added on purpose; every member
   keeps cancel-in-progress false (a canceled apply leaves a half-written state). cer-procedures.yml keeps a
   group of its own (the S641 conductor): finding 7's overlap costs less than the cancellations a wider
   group would bring.

2. A STANDING-DOWN RUNG DISPLACES A WAITING APPLY. With the group on the whole daily workflow, every
   scheduled rung queued in it, though most only stand down. Pinned: the group sits on update-dashboard,
   and the gate and the three crons are untouched.

3. A CONFLICTED RUN THAT PUBLISHED NOTHING ENDS GREEN. The gate stands the later rungs down after any
   success, so a lost push that exits 0 leaves the day without a dashboard and kpi_history.json with a gap
   (Rules 1 and 3). The daily's push loop is run in a scratch repo: a rebase conflict exits non-zero and
   leaves main as it was; a clean rebase pushes. The daily holds no `actions: write` and dispatches nothing
   (finding 8, a rebuild in the job, is left for its own PR).

4. A MISTYPED PLAN WAITS IN THE GROUP BEFORE IT FAILS (finding 9). cer-decision-apply 43121987424 queued about
   10 minutes, then failed on its plan_dir in seconds. Pinned: each apply's `check` job sits outside the
   group, reads no secret, and the apply job needs it; the check scripts are run against this tree.

Also pinned: the lints job rebuilds the Commons status file and runs its readers on the output (S639's
lesson 1, #3111), runs this test, and runs tests/partner_crosswalk_test.py as its last step, so a red
crosswalk test hides no other check.

Run from repo root: python3 tests/apply_concurrency_test.py
"""
import glob
import os
import re
import shutil
import subprocess
import sys
import tempfile

import yaml

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WF = os.path.join(REPO, ".github", "workflows")
GROUP = "daily-dashboard"
# The group's members on S641's head. A change here is a decision: say why in the PR that makes it.
MEMBERS = {
    "cer-decision-apply.yml", "cred-rename-apply.yml", "credential-family-apply.yml", "daily-dashboard.yml",
    "docket-process.yml", "esl-sheet-apply.yml", "library-publish.yml", "overmerge-apply.yml",
    "phase-1e-apply.yml", "projects-seed-apply.yml", "workplan-goals-seed-apply.yml",
}

results = []


def check(name, cond, why=""):
    results.append((name, bool(cond), why))


def load(name):
    with open(os.path.join(WF, name), encoding="utf-8") as f:
        return yaml.safe_load(f)


def on_block(doc):
    return doc.get("on", doc.get(True)) or {}   # YAML 1.1 reads a bare `on` key as True


def step(job, name):
    for s in (job or {}).get("steps") or []:
        if s.get("name") == name:
            return s
    return None


def needs(job):
    n = (job or {}).get("needs") or []
    return [n] if isinstance(n, str) else list(n)


# ── 1. The group's membership, and CER procedures outside it ─────────────────
in_group = set()
for path in sorted(glob.glob(os.path.join(WF, "*.yml"))):
    doc = yaml.safe_load(open(path, encoding="utf-8"))
    blocks = [doc.get("concurrency")] + [j.get("concurrency") for j in (doc.get("jobs") or {}).values()]
    for c in blocks:
        if isinstance(c, dict) and GROUP in str(c.get("group", "")):
            in_group.add(os.path.basename(path))
            check(os.path.basename(path) + ": cancel-in-progress is false in the daily-dashboard group",
                  c.get("cancel-in-progress") is False)
check("the daily-dashboard group holds exactly its pinned members",
      in_group == MEMBERS,
      {"left": sorted(MEMBERS - in_group), "joined": sorted(in_group - MEMBERS)})

cer = load("cer-procedures.yml")
grp = str((cer.get("concurrency") or {}).get("group", ""))
check("cer-procedures: keeps a group of its own", grp.startswith("cer-procedures-") and GROUP not in grp, grp)
check("cer-procedures: cancel-in-progress is false",
      (cer.get("concurrency") or {}).get("cancel-in-progress") is False)
cer_text = open(os.path.join(WF, "cer-procedures.yml"), encoding="utf-8").read()
check("cer-procedures: the header no longer says the daily never writes its files",
      "the daily run never writes these files" not in cer_text)

# ── 2. The daily: group on update-dashboard, gate and ladder untouched ────────
daily = load("daily-dashboard.yml")
dj = daily.get("jobs") or {}
check("daily: no workflow-level concurrency (a standing-down rung must not queue in the group)",
      "concurrency" not in daily)
check("daily: the gate job has no concurrency", "concurrency" not in (dj.get("gate") or {}))
ud = dj.get("update-dashboard") or {}
check("daily: update-dashboard holds the group, cancel-in-progress false",
      ud.get("concurrency") == {"group": GROUP, "cancel-in-progress": False}, ud.get("concurrency"))
check("daily: update-dashboard still needs the gate and its decision",
      "gate" in needs(ud) and "needs.gate.outputs.run == 'true'" in str(ud.get("if", "")))
crons = [c.get("cron") for c in on_block(daily).get("schedule") or []]
check("daily: the 3-cron ladder is unchanged (Rule 1)",
      crons == ["17 6 * * *", "17 9 * * *", "17 12 * * *"], crons)

# ── 2b. The stand-down check runs again once update-dashboard holds the group ─
# A rung that passes the gate while another run is building waits in the group, then would build a second
# time after that run succeeds (#3147 review). The gate and the recheck call one script, never two copies.
GATE_CALL = "bash scripts/daily_gate.sh"
gate_job = dj.get("gate") or {}
gate_check = next((s for s in gate_job.get("steps") or [] if s.get("id") == "check"), {})
check("daily: the gate calls the shared stand-down script", gate_check.get("run", "").strip() == GATE_CALL,
      gate_check.get("run"))
ud_steps = ud.get("steps") or []
rc_i = next((i for i, s in enumerate(ud_steps) if s.get("id") == "recheck"), None)
check("daily: update-dashboard rechecks with the same script, right after the checkout",
      rc_i == 1 and ud_steps[rc_i].get("run", "").strip() == GATE_CALL
      and "actions/checkout" in str(ud_steps[0].get("uses", "")), rc_i)
check("daily: the stand-down query is written once, in the script (no inline copy in the workflow)",
      "gh run list" not in open(os.path.join(WF, "daily-dashboard.yml"), encoding="utf-8").read())
unguarded = [s.get("name") or s.get("uses") for s in ud_steps[(rc_i or 0) + 1:]
             if "steps.recheck.outputs.run == 'true'" not in str(s.get("if", ""))]
check("daily: every step after the recheck runs only when it says build", rc_i is not None and not unguarded,
      unguarded)
check("daily: update-dashboard may read runs for the recheck",
      (ud.get("permissions") or {}).get("actions") == "read")

GATE_GH = r"""#!/usr/bin/env bash
[ "${GH_FAIL:-}" = 1 ] && exit 1
echo "${GH_SUCCESSES:-0}"
"""


def gate_case(event, successes="0", gh_fail=False):
    tmp = tempfile.mkdtemp(prefix="daily_gate_")
    try:
        os.makedirs(os.path.join(tmp, "bin"))
        with open(os.path.join(tmp, "bin", "gh"), "w") as f:
            f.write(GATE_GH)
        os.chmod(os.path.join(tmp, "bin", "gh"), 0o755)
        out = os.path.join(tmp, "out")
        env = dict(os.environ, PATH=os.path.join(tmp, "bin") + os.pathsep + os.environ["PATH"], EVENT=event,
                   GH_SUCCESSES=successes, GH_FAIL="1" if gh_fail else "", GITHUB_OUTPUT=out,
                   GITHUB_REPOSITORY="o/r", GH_TOKEN="x")
        subprocess.run(["bash", os.path.join(REPO, "scripts", "daily_gate.sh")], env=env, capture_output=True)
        return open(out).read().strip() if os.path.exists(out) else ""
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


check("stand-down script: a scheduled run on a day with a success stands down",
      gate_case("schedule", "1") == "run=false")
check("stand-down script: a scheduled run on a day with none builds", gate_case("schedule", "0") == "run=true")
check("stand-down script: a failed lookup builds", gate_case("schedule", gh_fail=True) == "run=true")
check("stand-down script: a dispatch builds even after a success",
      gate_case("workflow_dispatch", "3") == "run=true")

# ── 3. A conflicted run never ends green; the daily dispatches nothing ────────
perms = [daily.get("permissions")] + [j.get("permissions") for j in dj.values()]
check("daily: no `actions: write` anywhere in the workflow",
      not any(isinstance(p, dict) and p.get("actions") == "write" for p in perms)
      and daily.get("permissions") != "write-all", perms)
commit_step = step(ud, "Commit and push to main")
script = (commit_step or {}).get("run", "")
check("daily: the commit step exists", bool(script))
check("daily: the commit step dispatches no workflow", "gh workflow" not in script and "/dispatches" not in script)
m = re.search(r"^[ \t]*git commit\b", script, re.M)
check("daily: the commit step commits before its push loop", m is not None)
loop = "set -euo pipefail\n" + (script[m.start():] if m else "exit 99\n")


def git(cwd, *args):
    subprocess.run(["git", *args], cwd=cwd, check=True, capture_output=True, text=True)


def push_case(conflict):
    tmp = tempfile.mkdtemp(prefix="apply_conc_")
    try:
        origin, work, other = (os.path.join(tmp, d) for d in ("origin.git", "work", "other"))
        subprocess.run(["git", "init", "-q", "--bare", "-b", "main", origin], check=True)
        for d, who in ((work, "w"), (other, "o")):
            os.makedirs(os.path.join(d, "kb"))
            git(d, "init", "-q", "-b", "main")
            git(d, "config", "user.email", who + "@example.org")
            git(d, "config", "user.name", who)
            git(d, "remote", "add", "origin", origin)
        for fn in ("report.md", "side.md"):
            with open(os.path.join(work, "kb", fn), "w") as f:
                f.write("base\n")
        git(work, "add", "-A")
        git(work, "commit", "-q", "-m", "base")
        git(work, "push", "-q", "origin", "main")
        git(other, "pull", "-q", "origin", "main")
        with open(os.path.join(other, "kb", "report.md" if conflict else "side.md"), "w") as f:
            f.write("theirs\n")
        git(other, "commit", "-qam", "a merge to main")
        git(other, "push", "-q", "origin", "main")
        with open(os.path.join(work, "kb", "report.md"), "w") as f:
            f.write("ours\n")
        git(work, "add", "kb/report.md")
        env = dict(os.environ, GITHUB_RUN_ID="111", GITHUB_REPOSITORY="o/r",
                   GITHUB_STEP_SUMMARY=os.path.join(tmp, "summary.md"))
        p = subprocess.run(["bash", "-c", loop], cwd=work, env=env, capture_output=True, text=True, timeout=120)
        tip = subprocess.run(["git", "--git-dir", origin, "show", "main:kb/report.md"],
                             capture_output=True, text=True).stdout.strip()
        return p.returncode, tip, p.stdout + p.stderr
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


rc, tip, out = push_case(conflict=True)
check("push loop: a rebase conflict never exits 0 (the later rungs stay the backstop)", rc != 0, out)
check("push loop: a conflict picks no side (main keeps the merge's file)", tip == "theirs", tip)
rc, tip, out = push_case(conflict=False)
check("push loop: a clean rebase pushes and exits 0", rc == 0 and tip == "ours", out)

# ── 4. Finding 9: the plan-name check runs outside the group ──────────────────
for name in ("cer-decision-apply.yml", "cred-rename-apply.yml"):
    doc = load(name)
    jobs = doc.get("jobs") or {}
    chk, app = jobs.get("check") or {}, jobs.get("apply") or {}
    check(name + ": no workflow-level concurrency", "concurrency" not in doc)
    check(name + ": a check job exists outside the group", chk and "concurrency" not in chk)
    check(name + ": the check job reads no secret", "secrets." not in yaml.safe_dump(chk))
    check(name + ": the apply needs the check", "check" in needs(app))
    check(name + ": the apply holds the group, cancel-in-progress false",
          app.get("concurrency") == {"group": GROUP, "cancel-in-progress": False}, app.get("concurrency"))


def run_check(name, step_name, env):
    s = step((load(name).get("jobs") or {}).get("check"), step_name)
    if s is None:
        return None, "no check job step named %r in %s" % (step_name, name)
    p = subprocess.run(["bash", "-c", s["run"]], cwd=REPO, env=dict(os.environ, **env),
                       capture_output=True, text=True)
    return p.returncode, p.stdout + p.stderr


plan_dirs = sorted(d for d in glob.glob(os.path.join(REPO, "kb", "cer_decisions_out", "20*"))
                   if os.path.isfile(os.path.join(d, "plan.json")))
cd_step = "Check plan_dir names a committed plan"
if plan_dirs:
    rc, out = run_check("cer-decision-apply.yml", cd_step, {"PLAN_DIR": os.path.relpath(plan_dirs[-1], REPO)})
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
check("cred-rename check: an unknown plan fails fast", rc == 1 and "no-such-plan" in str(out), out)

# ── Lesson 1, this test, and the crosswalk, in the lints job ──────────────────
lint_steps = ((load("js-tests.yml").get("jobs") or {}).get("lints") or {}).get("steps") or []
runs = "\n".join(str(s.get("run", "")) for s in lint_steps)
# The file's name is spelled in two parts here so the lints step's reader search does not count this test.
COMMONS = "kb/status/commons" + ".json"
check("lints: rebuilds the Commons status file from the tree, history untouched",
      "python3 kb/_build_commons_status.py --out " + COMMONS in runs)
check("lints: runs every test that reads the Commons status file against the rebuild",
      "grep -l 'commons\\.json' tests/*.test.js tests/*_test.py" in runs)
check("lints: runs this test", "python3 tests/apply_concurrency_test.py" in runs)
check("lints: the partner crosswalk test is the job's last step (a red step hides none after it)",
      bool(lint_steps) and "python3 tests/partner_crosswalk_test.py" in str(lint_steps[-1].get("run", "")))

failed = [r for r in results if not r[1]]
for name, ok, why in results:
    print(("PASS " if ok else "FAIL ") + name + ("" if ok else "  " + repr(why)[:600]))
print("%d checks, %d failed" % (len(results), len(failed)))
sys.exit(1 if failed else 0)
