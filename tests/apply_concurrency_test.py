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

3. A CONFLICTED RUN THAT PUBLISHED NOTHING ENDS GREEN, OR PICKS A SIDE (finding 8). The gate stands the
   later rungs down after any success, so a lost push that exits 0 leaves the day without a dashboard and
   kpi_history.json with a gap (Rules 1 and 3); and a generated file is rebuilt from the new main, never
   taken from one side. The daily's own push loop and scripts/daily_rebuild.py run in a scratch repo:
   a clean push; a clean rebase; a conflict, then one rebuild on the new main that carries the other
   writer's commit and a file derived from it, with the scrape reused (and run again when main's copy
   changed); two conflicts (exit 1, nothing pushed, no side picked); a failure that is no conflict (the
   5-attempt retry, no rebuild). The rebuild reads its steps from the workflow, so they are written once;
   the commit step's env is exactly the secrets they name. The daily holds no `actions: write` and
   dispatches nothing.

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

# ── 3. A lost push rebuilds once, in the job; the daily dispatches nothing ────
perms = [daily.get("permissions")] + [j.get("permissions") for j in dj.values()]
check("daily: no `actions: write` anywhere in the workflow",
      not any(isinstance(p, dict) and p.get("actions") == "write" for p in perms)
      and daily.get("permissions") != "write-all", perms)
commit_step = step(ud, "Commit and push to main")
script = (commit_step or {}).get("run", "")
REBUILD_PY = os.path.join(REPO, "scripts", "daily_rebuild.py")
rebuild_text = open(REBUILD_PY, encoding="utf-8").read()
check("daily: the commit step exists", bool(script))
for label, text in (("the commit step", script), ("scripts/daily_rebuild.py", rebuild_text)):
    check("daily: %s dispatches no workflow" % label,
          "gh workflow" not in text and "/dispatches" not in text and "gh api" not in text)
# The step defines `stage` (its git add list, written once) and the loop after it calls `stage` twice at
# most: before the commit, and after the rebuild. The scratch repo runs that loop with a `stage` of its own.
m = re.search(r"^stage\(\) \{\n.*?^\}\n", script, re.M | re.S)
loop = script[m.end():] if m else "exit 99\n"
check("daily: the commit step defines `stage`, then the loop", m is not None
      and script.lstrip().startswith("set -euo pipefail") and "\nstage\n" in loop, bool(m))
check("daily: the loop's default rebuild is scripts/daily_rebuild.py --onto origin/main",
      '${DAILY_REBUILD:-python3 scripts/daily_rebuild.py}' in loop and '$daily_rebuild --onto origin/main' in loop)
check("daily: the loop pushes HEAD:main and never forces",
      "git push origin HEAD:main" in loop and "--force" not in loop and " -f " not in loop)

sys.path.insert(0, os.path.join(REPO, "scripts"))
import daily_rebuild  # noqa: E402
real_plan = daily_rebuild.plan(os.path.join(WF, "daily-dashboard.yml"))
names = [s["name"] for s in real_plan]
check("rebuild plan: the real workflow's build steps, from the first fetch to the copy to index.html",
      names[:1] == [daily_rebuild.FIRST] and names[-1:] == ["Copy dashboard to index.html"]
      and "Run dashboard pipeline" in names and not (set(names) & daily_rebuild.SETUP), names[:3] + names[-2:])
check("rebuild plan: every reused step is a step of the workflow",
      set(daily_rebuild.REUSE) <= set(names), sorted(set(daily_rebuild.REUSE) - set(names)))
check("rebuild plan: the scrape is reused, by its committed file",
      daily_rebuild.REUSE.get("Scrape live metrics from Cloudflare Worker") == ("live_metrics.json",))
want = {k: "${{ secrets.%s }}" % k for k in daily_rebuild.secrets_named(real_plan)}
check("daily: the commit step's env is exactly the secrets the rebuild can need",
      (commit_step or {}).get("env") == want, ((commit_step or {}).get("env"), want))

# The real push script and the real rebuild runner, in a scratch repo, over a workflow of the same shape:
# the fetches count their runs, and the build derives kb/report.md from kb/src.md on whatever tree it has.
FAKE_WF = r"""
jobs:
  update-dashboard:
    steps:
      - name: Checkout repo
        uses: actions/checkout@v7
      - name: Fetch CustomReport from MAP API
        if: steps.recheck.outputs.run == 'true'
        run: echo x >> "$CNT/custom"
      - name: Scrape live metrics from Cloudflare Worker
        if: steps.recheck.outputs.run == 'true'
        env:
          CPL_SCRAPE_SECRET: ${{ secrets.CPL_SCRAPE_SECRET }}
        run: |
          echo x >> "$CNT/scrape"
          echo "rescraped with $CPL_SCRAPE_SECRET" > live_metrics.json
          echo "LIVE_METRICS_STATUS=rescraped" >> "$GITHUB_ENV"
      - name: Fetch MIL/JST veteran data
        if: steps.recheck.outputs.run == 'true'
        run: echo x >> "$CNT/vet"; echo "refetched" > veteran_jst.json
      - name: Install node docx (Word reports)
        if: steps.recheck.outputs.run == 'true'
        run: exit 7
      - name: Build the report
        if: steps.recheck.outputs.run == 'true'
        env:
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
        run: |
          echo x >> "$CNT/build"
          printf 'built from %s; %s; %s; key %s\n' "$(cat kb/src.md)" "$(cat live_metrics.json)" \
            "$LIVE_METRICS_STATUS" "$SUPABASE_SERVICE_KEY" > kb/report.md
          if [ -n "${RACE:-}" ]; then
            cd "$OTHER" && echo "theirs again" > kb/report.md && git commit -qam "a second merge" && git push -q origin main
          fi
      - name: Copy dashboard to index.html
        if: steps.recheck.outputs.run == 'true'
        run: cp kb/report.md kb/copy.md
      - name: Commit and push to main
        run: "true"
"""
HOOK = """#!/bin/sh
n=$(cat "{cnt}" 2>/dev/null || echo 0); n=$((n + 1)); echo "$n" > "{cnt}"
if [ "$n" -le {fails} ]; then echo "rejected by the test hook" >&2; exit 1; fi
exit 0
"""


def git(cwd, *args):
    subprocess.run(["git", *args], cwd=cwd, check=True, capture_output=True, text=True)


def count(cnt, name):
    p = os.path.join(cnt, name)
    return sum(1 for _ in open(p)) if os.path.exists(p) else 0


def push_case(other_edits=None, race=False, reject=0):
    """other_edits: files the other writer changes on main while the run builds. reject: pushes the origin
    refuses before it accepts one (99: all of them)."""
    tmp = tempfile.mkdtemp(prefix="apply_conc_")
    try:
        origin, work, other, cnt = (os.path.join(tmp, d) for d in ("origin.git", "work", "other", "cnt"))
        os.makedirs(cnt)
        subprocess.run(["git", "init", "-q", "--bare", "-b", "main", origin], check=True)
        for d, who in ((work, "w"), (other, "o")):
            os.makedirs(os.path.join(d, "kb"))
            git(d, "init", "-q", "-b", "main")
            git(d, "config", "user.email", who + "@example.org")
            git(d, "config", "user.name", who)
            git(d, "remote", "add", "origin", origin)

        def write(d, files):
            for fn, text in files.items():
                with open(os.path.join(d, fn), "w") as f:
                    f.write(text + "\n")

        write(work, {"kb/src.md": "base", "kb/report.md": "built from base", "kb/side.md": "base",
                     "live_metrics.json": "scrape 0", "veteran_jst.json": "vet 0"})
        git(work, "add", "-A")
        git(work, "commit", "-q", "-m", "base")
        git(work, "push", "-q", "origin", "main")
        git(other, "pull", "-q", "origin", "main")
        if other_edits:
            write(other, other_edits)
            git(other, "commit", "-qam", "a merge to main")
            git(other, "push", "-q", "origin", "main")
        if reject:
            hook = os.path.join(origin, "hooks", "pre-receive")
            with open(hook, "w") as f:
                f.write(HOOK.format(cnt=os.path.join(cnt, "rejected"), fails=reject))
            os.chmod(hook, 0o755)
        # The run's first pass, on the main it checked out.
        write(work, {"kb/report.md": "ours, first pass", "live_metrics.json": "scrape of the first pass",
                     "veteran_jst.json": "vet of the first pass"})
        wf = os.path.join(tmp, "wf.yml")
        with open(wf, "w") as f:
            f.write(FAKE_WF)
        genv = os.path.join(tmp, "github_env")
        open(genv, "w").close()
        env = dict(os.environ, GITHUB_RUN_ID="111", GITHUB_REPOSITORY="o/r", GITHUB_ENV=genv,
                   GITHUB_STEP_SUMMARY=os.path.join(tmp, "summary.md"), CNT=cnt, OTHER=other,
                   RACE="1" if race else "", DAILY_PUSH_BACKOFF="0", LIVE_METRICS_STATUS="first",
                   CPL_SCRAPE_SECRET="s3", SUPABASE_SERVICE_KEY="k9",
                   DAILY_REBUILD="%s %s --workflow %s" % (sys.executable, REBUILD_PY, wf))
        body = ("set -euo pipefail\nstage() {\n  git add kb/report.md kb/src.md live_metrics.json veteran_jst.json\n"
                "  git add kb/copy.md 2>/dev/null || true\n}\n" + loop)
        p = subprocess.run(["bash", "-c", body], cwd=work, env=env, capture_output=True, text=True, timeout=120)

        def show(path):
            return subprocess.run(["git", "--git-dir", origin, "show", "main:" + path],
                                  capture_output=True, text=True).stdout.strip()

        log = subprocess.run(["git", "--git-dir", origin, "log", "--format=%s", "main"],
                             capture_output=True, text=True).stdout.splitlines()
        return {"rc": p.returncode, "out": p.stdout + p.stderr, "log": log, "report": show("kb/report.md"),
                "side": show("kb/side.md"), "metrics": show("live_metrics.json"), "vet": show("veteran_jst.json"),
                "genv": open(genv).read(), **{k: count(cnt, k) for k in ("custom", "scrape", "vet", "build")}}
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def ours_landed(r):
    return any(s.startswith("Daily dashboard update") for s in r["log"])


r = push_case()
check("push: a clean push lands the first pass and rebuilds nothing",
      r["rc"] == 0 and r["report"] == "ours, first pass" and r["build"] == 0, r)
r = push_case(other_edits={"kb/side.md": "theirs"})
check("push: a clean rebase pushes both writers' files and rebuilds nothing",
      r["rc"] == 0 and r["report"] == "ours, first pass" and r["side"] == "theirs" and r["build"] == 0, r)

r = push_case(other_edits={"kb/src.md": "theirs", "kb/report.md": "the other writer's report"})
check("push: a conflict then a clean rebuild exits 0", r["rc"] == 0, r["out"][-1500:])
check("push: the rebuild's push carries the other writer's commit",
      "a merge to main" in r["log"] and r["log"][0].startswith("Daily dashboard update")
      and "(rebuilt on " in r["log"][0], r["log"])
check("push: the rebuilt file derives from the new main, neither side picked",
      r["report"] == "built from theirs; scrape of the first pass; first; key k9", r["report"])
check("push: the rebuild ran once and reused the scrape and both fetches (main's copies unchanged)",
      (r["build"], r["scrape"], r["vet"], r["custom"]) == (1, 0, 0, 0)
      and r["metrics"] == "scrape of the first pass", (r["build"], r["scrape"], r["vet"], r["custom"], r["metrics"]))
check("push: the rebuild never ran the set-up step (it exits 7 in the scratch workflow)", "exited 7" not in r["out"])

r = push_case(other_edits={"kb/src.md": "theirs", "kb/report.md": "the other writer's report",
                           "live_metrics.json": "a newer scrape on main"})
check("push: when main's live_metrics.json changed, the rebuild scrapes again (and only that fetch)",
      r["rc"] == 0 and (r["scrape"], r["vet"], r["custom"]) == (1, 0, 0)
      and r["metrics"] == "rescraped with s3", (r["rc"], r["scrape"], r["vet"], r["metrics"], r["out"][-800:]))
check("push: a value the rebuilt scrape writes to $GITHUB_ENV reaches the later rebuilt steps and the job",
      r["report"] == "built from theirs; rescraped with s3; rescraped; key k9"
      and "LIVE_METRICS_STATUS=rescraped" in r["genv"], (r["report"], r["genv"]))

r = push_case(other_edits={"kb/src.md": "theirs", "kb/report.md": "the other writer's report"}, race=True)
check("push: a second conflict exits 1 after one rebuild", r["rc"] == 1 and r["build"] == 1,
      (r["rc"], r["build"], r["out"][-800:]))
check("push: a second conflict pushes nothing and picks no side",
      not ours_landed(r) and r["log"][0] == "a second merge" and r["report"] == "theirs again", (r["log"], r["report"]))

r = push_case(reject=99)
check("push: a failure that is no conflict retries 5 times, then exits 1 with nothing pushed or rebuilt",
      r["rc"] == 1 and "Push attempt 5 failed" in r["out"] and "Push failed after 5 attempts." in r["out"]
      and r["build"] == 0 and not ours_landed(r), (r["rc"], r["build"], r["out"][-600:]))
r = push_case(reject=1)
check("push: a failure that is no conflict, then a good push, lands on attempt 2 with no rebuild",
      r["rc"] == 0 and "Push succeeded on attempt 2." in r["out"] and r["build"] == 0
      and r["report"] == "ours, first pass", (r["rc"], r["out"][-600:]))

# The runner refuses a step it cannot run as GitHub would, rather than running it differently.
for label, bad in (("an expression in a run script", "run: echo ${{ github.run_id }}"),
                   ("a `uses` step", "uses: actions/setup-python@v7"),
                   ("an `if` other than the recheck's", "if: always()\n        run: true")):
    tmp = tempfile.mkdtemp(prefix="rebuild_refuse_")
    try:
        wf = os.path.join(tmp, "wf.yml")
        with open(wf, "w") as f:
            f.write("jobs:\n  update-dashboard:\n    steps:\n      - name: Fetch CustomReport from MAP API\n"
                    "        run: true\n      - name: odd\n        " + bad +
                    "\n      - name: Commit and push to main\n        run: true\n")
        p = subprocess.run([sys.executable, REBUILD_PY, "--list", "--workflow", wf], capture_output=True, text=True)
        check("rebuild runner: refuses %s (exit 2)" % label, p.returncode == 2, p.stdout + p.stderr)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

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
