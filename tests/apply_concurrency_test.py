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
   taken from one side. Pinned: the build is one step running scripts/daily_build.sh, whose blocks run in
   `bash -e` with only the secrets their former steps declared; the shard upload runs after the push. The
   commit step's own shell runs in a scratch repo with a stand-in scripts/daily_build.sh: a clean push; a
   clean rebase; a conflict, then one rebuild on the new main (the other writer's commit plus a file built
   from it, the fetches reused, run again when main's copy changed, the new main's build script used); two
   conflicts and a failed rebuild (exit 1, nothing pushed, no side picked); a conflict on the last attempt
   (the rebuilt commit still pushed); a failure that is no conflict (the 5-attempt retry, no rebuild). The
   daily holds no `actions: write` and dispatches nothing.

3b. A CLEAN REBASE BRINGS IN A CHANGED INPUT AND THE RUN ENDS GREEN ON OLD OUTPUTS (COBIx #3110 point 4, S643).
   No conflict, so before S643 the commit carried outputs built from the old input. Pinned: a clean rebase that
   changes any path outside the commit step's `not_inputs` (docs/ and tests/) rebuilds once, by the same
   daily_rebuild; only those paths changed, nothing rebuilds; one rebuild a run, so an input that changes again
   after it is pushed over with a warning, never a second rebuild; a failed input rebuild pushes the run's first
   build, rebased, as before the rule (a failed conflict rebuild still exits 1). `not_inputs` is kept honest by a walk of
   every file the build runs (scripts/daily_build.sh's commands, their imports, the modules they load by path and
   the scripts they launch): one that names a path under either prefix, or walks the tree, fails here.

4. A MISTYPED PLAN WAITS IN THE GROUP BEFORE IT FAILS (finding 9). cer-decision-apply 43121987424 queued about
   10 minutes, then failed on its plan_dir in seconds. Pinned: each apply's `check` job sits outside the
   group, reads no secret, and the apply job needs it; the check scripts are run against this tree.

Also pinned: the lints job rebuilds the Commons status file and runs its readers on the output (S639's
lesson 1, #3111), runs this test, and runs tests/partner_crosswalk_test.py as its last step, so a red
crosswalk test hides no other check.

Run from repo root: python3 tests/apply_concurrency_test.py
"""
import ast
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
BUILD_SH = os.path.join(REPO, "scripts", "daily_build.sh")
build_text = open(BUILD_SH, encoding="utf-8").read()
commit_step = step(ud, "Commit and push to main")
script = (commit_step or {}).get("run", "")
check("daily: the commit step exists, with id push", bool(script) and (commit_step or {}).get("id") == "push")
for label, text in (("the commit step", script), ("scripts/daily_build.sh", build_text)):
    check("daily: %s dispatches no workflow" % label,
          "gh workflow" not in text and "/dispatches" not in text and "gh api" not in text)

# 3a. The build is ONE step calling the one script, which runs each former step in `bash -e`, the shell GitHub
# gave a `run:` with no `shell:`; and each block gets only the secrets its step declared.
# Each former step that declared a secret, and exactly what it declared (the S641 head, before the move).
SECRETS_BY_STEP = {
    "Fetch CustomReport from MAP API": ["MAP_API_KEY", "MAP_API_AUTH_HEADER", "MAP_API_AUTH_SCHEME"],
    "Scrape live metrics from Cloudflare Worker": ["CPL_SCRAPE_SECRET"],
    "Sync curation overlay from Supabase": ["SUPABASE_SERVICE_KEY"],
    "Run dashboard pipeline": ["SUPABASE_SERVICE_KEY"],
    "Build funding priority-metric actuals": ["SUPABASE_SERVICE_KEY"],
    "Build the Exhibits List's Outcomes match hints": ["SUPABASE_SERVICE_KEY"],
    "Build the catalog's skills-to-outcomes analysis": ["SUPABASE_SERVICE_KEY"],
    "Sync CPL Pathways' confirmed records": ["SUPABASE_SERVICE_KEY"],
}
ALL_SECRETS = ["MAP_API_KEY", "MAP_API_AUTH_HEADER", "MAP_API_AUTH_SCHEME", "CPL_SCRAPE_SECRET", "SUPABASE_SERVICE_KEY"]
calls = [s for s in ud_steps if "daily_build.sh" in str(s.get("run", ""))]
build_step = step(ud, "Build the dashboard and its kb files")
check("daily: exactly one build step, and it runs scripts/daily_build.sh",
      build_step is not None and str(build_step.get("run", "")).strip() == "bash scripts/daily_build.sh"
      and [c.get("name") for c in calls] == ["Build the dashboard and its kb files", "Commit and push to main"],
      [c.get("name") for c in calls])
check("daily: the build step's env is the union of the secrets its blocks declared",
      (build_step or {}).get("env") == {k: "${{ secrets.%s }}" % k for k in ALL_SECRETS}, (build_step or {}).get("env"))
check("daily: no builder runs as a workflow step any more (one place for the commands)",
      not [s.get("name") for s in ud_steps if re.search(r"python3? (kb|funding|fact-sheet)/_build", str(s.get("run", "")))
           and s.get("name") != "Publish SkyView description shards (after the push, from the pushed tree)"])
top = [ln for ln in build_text.split("\n") if ln.strip() and not ln.lstrip().startswith("#")]
check("build script: one stated shell mode, `set -e`, and each block in `bash -e` (GitHub's default for `run:`)",
      bool(top) and top[0] == "set -e" and "pipefail" not in build_text.split("\nstep() {")[0]
      and 'env "${drop[@]}" bash -e -c "$body" || rc=$?' in build_text, top[:1])
check("build script: DAILY_SECRETS names every secret a block may take",
      'DAILY_SECRETS="%s"' % " ".join(ALL_SECRETS) in build_text)
# Outside the heredoc bodies, every line is a `step` call, a reuse switch, or the preamble: no bare command.
body_lines = build_text.split("\n")
start_i = next(i for i, ln in enumerate(body_lines) if "DAILY_BUILD_FUNCTIONS_ONLY" in ln and ln.startswith("if")) + 1
blocks, stray, inside = [], [], False
ALLOWED = [r'if \[ "\$\{DAILY_REUSE_(CUSTOM_REPORT|SCRAPE|VETERAN):-\}" = 1 \]; then', r'  reused "[^"]+"', "else", "fi"]
for ln in body_lines[start_i:]:
    if inside:
        inside = ln != "STEP"
        continue
    if not ln.strip() or ln.startswith("#"):
        continue
    m = re.fullmatch(r'step "([^"]+)"((?: [A-Z_]+)*) <<\'STEP\'', ln)
    if m:
        blocks.append((m.group(1), m.group(2).split()))
        inside = True
    elif not any(re.fullmatch(a, ln) for a in ALLOWED):
        stray.append(ln)
check("build script: every command sits in a `step` block (none runs outside the secrets wrapper)",
      not stray and not inside, stray[:3])
check("build script: 40 blocks (the 41 former steps less the shard upload, which runs after the push)",
      len(blocks) == 40 and blocks[0][0] == "Fetch CustomReport from MAP API"
      and blocks[-1][0] == "Copy dashboard to index.html", len(blocks))
check("build script: each block takes exactly the secrets its step declared, and the rest none",
      {n: s for n, s in blocks if s} == SECRETS_BY_STEP, {n: s for n, s in blocks if s})


def wrapper(secrets, body):
    env = dict(os.environ, DAILY_BUILD_FUNCTIONS_ONLY="1", **{k: "set" for k in ALL_SECRETS})
    sh = 'source "%s"\nstep "t"%s <<\'STEP\'\n%s\nSTEP\necho after' % (
        BUILD_SH, "".join(" " + s for s in secrets), body)
    p = subprocess.run(["bash", "-c", sh], env=env, capture_output=True, text=True)
    return p.returncode, p.stdout


SHOW = "env | cut -d= -f1 | grep -E '^(MAP_API|CPL_SCRAPE|SUPABASE)' | sort | tr '\\n' ' '"
rc, out = wrapper(["SUPABASE_SERVICE_KEY"], SHOW)
check("secrets wrapper: a block that named SUPABASE_SERVICE_KEY sees it alone", rc == 0 and "SUPABASE_SERVICE_KEY" in out
      and "CPL_SCRAPE" not in out and "MAP_API" not in out, out)
rc, out = wrapper([], SHOW)
check("secrets wrapper: a block that named none sees none", rc == 0 and "SECRET" not in out and "MAP_API" not in out, out)
rc, out = wrapper([], "exit 0\necho never")
check("secrets wrapper: a block's `exit 0` ends that block only", rc == 0 and "never" not in out and "after" in out, out)
rc, out = wrapper([], "false\necho never")
check("secrets wrapper: a failing command fails the build (`bash -e`), and nothing after it runs",
      rc == 1 and "never" not in out and "after" not in out, out)

# 3b. The shard upload runs after the push, from the pushed tree.
names = [s.get("name") for s in ud_steps]
sh_step = step(ud, "Publish SkyView description shards (after the push, from the pushed tree)")
sh_run = str((sh_step or {}).get("run", ""))
check("shards: the upload comes after the push and cuts from the pushed tree (unstaged leftovers dropped)",
      sh_step is not None and names.index(sh_step["name"]) == names.index("Commit and push to main") + 1
      and -1 < sh_run.find("\ngit checkout -- .\n") < sh_run.find("--shards-only")
      and (sh_step.get("env") or {}).get("DAILY_START") == "${{ steps.push.outputs.start }}"
      and 'git diff --quiet "$DAILY_START" HEAD' in sh_run and "--shards-only" not in build_text, names)

# 3c. The commit step's own shell, run in a scratch repo with a stand-in scripts/daily_build.sh committed
# there: the real loop calls that path, on whatever tree it has.
m = re.search(r"^stage\(\) \{\n.*?^\}\n", script, re.M | re.S)
loop = script[m.end():] if m else "exit 99\n"
check("daily: the commit step defines `stage`, then the loop", m is not None
      and script.lstrip().startswith("set -euo pipefail") and "\nstage\n" in loop, bool(m))
check("daily: the commit step's env is the secrets the rebuild can need",
      (commit_step or {}).get("env") == {k: "${{ secrets.%s }}" % k for k in ("CPL_SCRAPE_SECRET", "SUPABASE_SERVICE_KEY")},
      (commit_step or {}).get("env"))
check("daily: the rebuild reinstalls requirements and runs the new main's build script",
      "pip install -r requirements.txt || return 1" in loop and "bash scripts/daily_build.sh || return 1" in loop
      and loop.index('git reset --hard "$new"') < loop.index("pip install -r requirements.txt"))
check("daily: the loop pushes HEAD:main and never forces",
      "git push origin HEAD:main" in loop and "--force" not in loop and " -f " not in loop)

STANDIN = r"""set -e
V=v1
if [ "${DAILY_REUSE_CUSTOM_REPORT:-}" != 1 ]; then echo x >> "$CNT/custom"; fi
if [ "${DAILY_REUSE_SCRAPE:-}" != 1 ]; then
  echo x >> "$CNT/scrape"
  [ -e live_metrics_new.json ] && echo x >> "$CNT/leftover"
  echo "rescraped with ${CPL_SCRAPE_SECRET:-}" > live_metrics.json
  echo "LIVE_METRICS_STATUS=rescraped" >> "$GITHUB_ENV"
fi
if [ "${DAILY_REUSE_VETERAN:-}" != 1 ]; then echo x >> "$CNT/vet"; echo refetched > veteran_jst.json; fi
echo "$V" >> "$CNT/build"
printf '%s built from %s; %s; key %s\n' "$V" "$(cat kb/src.md)" "$(cat live_metrics.json)" \
  "${SUPABASE_SERVICE_KEY:-}" > kb/report.md
(
if [ -n "${RACE_INPUT:-}" ]; then
  cd "$OTHER" && echo "theirs again" > kb/src.md && git commit -qam "a second input change" && git push -q origin main
fi
)
if [ -n "${FAIL_BUILD:-}" ]; then exit 3; fi
if [ -n "${RACE:-}" ]; then
  cd "$OTHER" && echo "theirs again" > kb/report.md && git commit -qam "a second merge" && git push -q origin main
fi
"""
HOOK = """#!/bin/sh
n=$(cat "{cnt}" 2>/dev/null || echo 0); n=$((n + 1)); echo "$n" > "{cnt}"
if [ "$n" -le {fails} ]; then
  if [ "$n" = "{land_at}" ]; then
    env -u GIT_QUARANTINE_PATH -u GIT_OBJECT_DIRECTORY -u GIT_ALTERNATE_OBJECT_DIRECTORIES \\
      git --git-dir="{origin}" update-ref refs/heads/main refs/heads/staged
  fi
  echo "rejected by the test hook" >&2; exit 1
fi
exit 0
"""


def git(cwd, *args):
    subprocess.run(["git", *args], cwd=cwd, check=True, capture_output=True, text=True)


def count(cnt, name):
    p = os.path.join(cnt, name)
    return sum(1 for _ in open(p)) if os.path.exists(p) else 0


CONFLICT = {"kb/src.md": "theirs", "kb/report.md": "the other writer's report"}


def push_case(other_edits=None, race=False, reject=0, land_at=0, fail_build=False, untracked=None, race_input=False,
              other_moves=None, first_pass=None, fail_range=False, first_status=""):
    """other_edits: files the other writer changes on main while the run builds (land_at > 0: its commit
    lands on main during that rejected push instead). reject: pushes the origin refuses (99: all)."""
    tmp = tempfile.mkdtemp(prefix="apply_conc_")
    try:
        origin, work, other, cnt, bin_ = (os.path.join(tmp, d) for d in ("origin.git", "work", "other", "cnt", "bin"))
        os.makedirs(cnt)
        os.makedirs(bin_)
        with open(os.path.join(bin_, "pip"), "w") as f:
            f.write('#!/bin/sh\necho "$*" >> "%s/pip"\n' % cnt)
        os.chmod(os.path.join(bin_, "pip"), 0o755)
        if fail_range:   # the incoming range cannot be read: the step's one `diff --no-renames` call fails
            with open(os.path.join(bin_, "git"), "w") as f:
                f.write('#!/bin/sh\nif [ "$1 $2 $3" = "diff --name-only --no-renames" ]; then echo "fatal: unreadable" >&2;'
                        ' exit 128; fi\nexec "%s" "$@"\n' % shutil.which("git"))
            os.chmod(os.path.join(bin_, "git"), 0o755)
        subprocess.run(["git", "init", "-q", "--bare", "-b", "main", origin], check=True)
        for d, who in ((work, "w"), (other, "o")):
            os.makedirs(os.path.join(d, "kb"))
            os.makedirs(os.path.join(d, "scripts"))
            git(d, "init", "-q", "-b", "main")
            git(d, "config", "user.email", who + "@example.org")
            git(d, "config", "user.name", who)
            git(d, "remote", "add", "origin", origin)

        def write(d, files):
            for fn, text in files.items():
                os.makedirs(os.path.dirname(os.path.join(d, fn)), exist_ok=True)
                with open(os.path.join(d, fn), "w") as f:
                    f.write(text if fn.endswith(".sh") else text + "\n")

        write(work, {"kb/src.md": "base", "kb/report.md": "built from base", "kb/side.md": "base",
                     "live_metrics.json": "scrape 0", "veteran_jst.json": "vet 0", "requirements.txt": "",
                     "kb/old.json": "an input that moves",
                     "scripts/daily_build.sh": STANDIN})
        git(work, "add", "-A")
        git(work, "commit", "-q", "-m", "base")
        git(work, "push", "-q", "origin", "main")
        git(other, "pull", "-q", "origin", "main")
        if other_edits or other_moves:
            write(other, other_edits or {})
            for src, dst in (other_moves or {}).items():
                os.makedirs(os.path.join(other, os.path.dirname(dst)), exist_ok=True)
                git(other, "mv", src, dst)
            git(other, "add", "-A")
            git(other, "commit", "-qm", "a merge to main")
            git(other, "push", "-q", "origin", "HEAD:staged" if land_at else "main")
        if reject:
            hook = os.path.join(origin, "hooks", "pre-receive")
            with open(hook, "w") as f:
                f.write(HOOK.format(cnt=os.path.join(cnt, "rejected"), fails=reject, land_at=land_at, origin=origin))
            os.chmod(hook, 0o755)
        # The run's first pass, on the main it checked out, and a leftover of its scrape.
        write(work, first_pass or {"kb/report.md": "ours, first pass", "live_metrics.json": "scrape of the first pass",
                                   "veteran_jst.json": "vet of the first pass", "live_metrics_new.json": "first pass download"})
        write(work, untracked or {})
        genv, gout = os.path.join(tmp, "github_env"), os.path.join(tmp, "github_output")
        open(genv, "w").close()
        env = dict(os.environ, PATH=bin_ + os.pathsep + os.environ["PATH"], GITHUB_ENV=genv, GITHUB_OUTPUT=gout,
                   CNT=cnt, OTHER=other, RACE="1" if race else "", RACE_INPUT="1" if race_input else "", FAIL_BUILD="1" if fail_build else "",
                   DAILY_PUSH_BACKOFF="0", CPL_SCRAPE_SECRET="s3", SUPABASE_SERVICE_KEY="k9",
                   LIVE_METRICS_STATUS=first_status, SCRAPE_DETAIL="")
        body = ("set -euo pipefail\nstage() {\n  git add kb/report.md kb/src.md live_metrics.json veteran_jst.json\n}\n"
                + loop)
        p = subprocess.run(["bash", "-c", body], cwd=work, env=env, capture_output=True, text=True, timeout=120)

        def show(path):
            return subprocess.run(["git", "--git-dir", origin, "show", "main:" + path],
                                  capture_output=True, text=True).stdout.strip()

        log = subprocess.run(["git", "--git-dir", origin, "log", "--format=%s", "main"],
                             capture_output=True, text=True).stdout.splitlines()
        return {"rc": p.returncode, "out": p.stdout + p.stderr, "log": log, "report": show("kb/report.md"),
                "side": show("kb/side.md"), "docs_side": show("docs/side.md"), "src": show("kb/src.md"),
                "metrics": show("live_metrics.json"), "genv": open(genv).read(),
                "gout": open(gout).read() if os.path.exists(gout) else "",
                **{k: count(cnt, k) for k in ("custom", "scrape", "vet", "build", "pip", "leftover")}}
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def ours_landed(r):
    return any(s.startswith("Daily dashboard update") for s in r["log"])


r = push_case()
check("push: a clean push lands the first pass and rebuilds nothing",
      r["rc"] == 0 and r["report"] == "ours, first pass" and r["build"] == 0 and r["pip"] == 0
      and r["gout"].startswith("start="), r)
r = push_case(other_edits={"docs/side.md": "theirs", "tests/side_test.py": "theirs"})
check("push: a clean rebase that changes only docs/ and tests/ pushes both writers' files and rebuilds nothing",
      r["rc"] == 0 and r["report"] == "ours, first pass" and r["docs_side"] == "theirs" and r["build"] == 0
      and "changed input" not in r["out"], (r["rc"], r["build"], r["out"][-600:]))

# 3b. A clean rebase that changes a build input rebuilds once, by the conflict path's daily_rebuild (S643).
INPUT = {"kb/src.md": "theirs"}
r = push_case(other_edits=INPUT)
check("push: a clean rebase that changes an input rebuilds once on the new main and exits 0",
      r["rc"] == 0 and r["build"] == 1 and r["report"] == "v1 built from theirs; scrape of the first pass; key k9"
      and "a merge to main" in r["log"] and "(rebuilt on " in r["log"][0], (r["rc"], r["report"], r["log"]))
check("push: the clean-rebase rebuild says so in its own log line, naming the input",
      "::warning title=Daily push rebased over a changed input::Main changed 1 build input(s)" in r["out"]
      and "(first: kb/src.md)" in r["out"] and "  changed input: kb/src.md" in r["out"]
      and "Daily push conflicted" not in r["out"], r["out"][-900:])
check("push: the clean-rebase rebuild reuses the fetches and reinstalls requirements, as the conflict path does",
      (r["pip"], r["scrape"], r["vet"], r["custom"]) == (1, 0, 0, 0) and r["metrics"] == "scrape of the first pass",
      (r["pip"], r["scrape"], r["vet"], r["custom"], r["metrics"]))
r = push_case(other_edits={"kb/tests/x.md": "theirs", "docs/side.md": "theirs"})
check("push: a not-input prefix matches from the path's start only (kb/tests/x.md is an input)",
      r["rc"] == 0 and r["build"] == 1 and "(first: kb/tests/x.md)" in r["out"], (r["rc"], r["build"], r["out"][-600:]))
r = push_case(other_edits=INPUT, race_input=True)
check("push: the bound: an input changed again after the rebuild is pushed over with a warning, no second rebuild",
      r["rc"] == 0 and r["build"] == 1 and "::warning title=Daily input changed again::" in r["out"]
      and r["log"][0].startswith("Daily dashboard update") and "(rebuilt on " in r["log"][0]
      and "a second input change" in r["log"] and r["src"] == "theirs again"
      and r["report"] == "v1 built from theirs; scrape of the first pass; key k9", (r["rc"], r["build"], r["log"], r["out"][-900:]))
r = push_case(other_edits=INPUT, fail_build=True)
check("push: a failed input rebuild publishes the run's first build, rebased, and says so",
      r["rc"] == 0 and r["build"] == 1 and ours_landed(r) and r["report"] == "ours, first pass"
      and r["src"] == "theirs" and "a merge to main" in r["log"] and "(rebuilt on " not in r["log"][0]
      and "::warning title=Daily input rebuild failed; published the first build::" in r["out"]
      and "Push succeeded on attempt 2." in r["out"], (r["rc"], r["report"], r["log"], r["out"][-600:]))
def last_status(genv):
    vals = [ln.split("=", 1)[1] for ln in genv.splitlines() if ln.startswith("LIVE_METRICS_STATUS=")]
    return vals[-1] if vals else None


r = push_case(other_edits={"live_metrics.json": "a newer scrape on main"}, fail_build=True, first_status="success",
              first_pass={"kb/report.md": "ours, first pass", "veteran_jst.json": "vet of the first pass"})
check("push: a failed input rebuild that scraped again writes the first pass's scrape status back",
      r["rc"] == 0 and r["scrape"] == 1 and ours_landed(r) and "published the first build" in r["out"]
      and "LIVE_METRICS_STATUS=rescraped" in r["genv"] and last_status(r["genv"]) == "success",
      (r["rc"], r["scrape"], r["genv"], r["out"][-500:]))
r = push_case(other_edits=INPUT, fail_build=True, race_input=True)
check("push: after a fallback, an input changed again says the first build is what is pushed",
      r["rc"] == 0 and "::warning title=Daily input changed again::" in r["out"]
      and "the run's first build is pushed" in r["out"] and "the rebuilt commit is pushed" not in r["out"]
      and r["report"] == "ours, first pass", (r["rc"], r["report"], r["out"][-700:]))
r = push_case(other_edits=INPUT, race_input=True)
check("push: after a rebuild, an input changed again says the rebuilt commit is what is pushed",
      r["rc"] == 0 and "the rebuilt commit is pushed" in r["out"], r["out"][-500:])
r = push_case(other_moves={"kb/old.json": "tests/old.json"})
check("push: an input moved under tests/ still counts (both names listed, no rename folding)",
      r["rc"] == 0 and r["build"] == 1 and "(first: kb/old.json)" in r["out"], (r["rc"], r["build"], r["out"][-600:]))
r = push_case(other_edits={"docs/side.md": "theirs"}, fail_range=True)
check("push: an incoming range that cannot be read counts as a changed input (a rebuild, never a red run)",
      r["rc"] == 0 and r["build"] == 1 and "(the incoming range could not be read)" in r["out"]
      and "(rebuilt on " in r["log"][0], (r["rc"], r["build"], r["out"][-600:]))
r = push_case(other_edits=INPUT, fail_build=True, reject=5, land_at=5)
check("push: a failed input rebuild on the last attempt still gets its push",
      r["rc"] == 0 and ours_landed(r) and r["report"] == "ours, first pass"
      and "Push succeeded on attempt 6." in r["out"], (r["rc"], r["report"], r["out"][-600:]))
r = push_case(other_edits=INPUT, reject=5, land_at=5)
check("push: a changed input first seen on the last attempt still pushes the rebuilt commit",
      r["rc"] == 0 and "Push succeeded on attempt 6." in r["out"] and r["build"] == 1
      and r["report"] == "v1 built from theirs; scrape of the first pass; key k9", (r["rc"], r["report"], r["out"][-900:]))

r = push_case(other_edits=CONFLICT)
check("push: a conflict then a clean rebuild exits 0", r["rc"] == 0, r["out"][-1500:])
check("push: the rebuild's push carries the other writer's commit",
      "a merge to main" in r["log"] and r["log"][0].startswith("Daily dashboard update")
      and "(rebuilt on " in r["log"][0], r["log"])
check("push: the rebuilt file derives from the new main, neither side picked",
      r["report"] == "v1 built from theirs; scrape of the first pass; key k9", r["report"])
check("push: one rebuild, requirements reinstalled, the scrape and both fetches reused (main's copies unchanged)",
      (r["build"], r["pip"], r["scrape"], r["vet"], r["custom"]) == (1, 1, 0, 0, 0)
      and r["metrics"] == "scrape of the first pass", (r["build"], r["pip"], r["scrape"], r["vet"], r["custom"]))

r = push_case(other_edits=dict(CONFLICT, **{"live_metrics.json": "a newer scrape on main"}))
check("push: when main's live_metrics.json changed, the rebuild scrapes again (and only that fetch)",
      r["rc"] == 0 and (r["scrape"], r["vet"], r["custom"]) == (1, 0, 0)
      and r["metrics"] == "rescraped with s3" and "LIVE_METRICS_STATUS=rescraped" in r["genv"],
      (r["rc"], r["scrape"], r["vet"], r["metrics"], r["out"][-800:]))
check("push: the second scrape never sees the first pass's download", r["leftover"] == 0, r["leftover"])

r = push_case(other_edits=dict(CONFLICT, **{"scripts/daily_build.sh": STANDIN.replace("V=v1", "V=v2")}))
check("push: the rebuild runs the NEW main's build script, not the run's copy",
      r["rc"] == 0 and r["report"].startswith("v2 built from theirs"), (r["rc"], r["report"]))

r = push_case(other_edits=CONFLICT, race=True)
check("push: a second conflict exits 1 after one rebuild", r["rc"] == 1 and r["build"] == 1,
      (r["rc"], r["build"], r["out"][-800:]))
check("push: a second conflict pushes nothing and picks no side",
      not ours_landed(r) and r["log"][0] == "a second merge" and r["report"] == "theirs again", (r["log"], r["report"]))

r = push_case(other_edits=CONFLICT, fail_build=True)
check("push: a failed conflict rebuild still exits 1 with nothing pushed (no clean first build to fall back to)",
      r["rc"] == 1 and r["build"] == 1 and not ours_landed(r) and r["report"] == "the other writer's report"
      and "::error title=Daily rebuild failed::" in r["out"] and "published the first build" not in r["out"],
      (r["rc"], r["log"], r["out"][-600:]))

r = push_case(other_edits=CONFLICT, reject=5, land_at=5)
check("push: a conflict first seen on the last attempt still pushes the rebuilt commit",
      r["rc"] == 0 and "Push attempt 5 failed" in r["out"] and "Push succeeded on attempt 6." in r["out"]
      and r["build"] == 1
      and r["report"] == "v1 built from theirs; scrape of the first pass; key k9" and "a merge to main" in r["log"],
      (r["rc"], r["report"], r["log"], r["out"][-900:]))

r = push_case(other_edits={"kb/new.json": "the other writer's new file"}, untracked={"kb/new.json": "ours, untracked"})
check("push: a rebase that fails with no conflict (an untracked file in the way) keeps the retry, ends with ::error",
      r["rc"] == 1 and "Push attempt 5 failed" in r["out"] and "::error title=Daily push failed::Push failed after 5 attempts."
      in r["out"] and "failed without a conflict" in r["out"] and r["build"] == 0 and not ours_landed(r),
      (r["rc"], r["build"], r["out"][-700:]))

r = push_case(reject=99)
check("push: a failure that is no conflict retries 5 times, then exits 1 with nothing pushed or rebuilt",
      r["rc"] == 1 and "Push attempt 5 failed" in r["out"] and "Push failed after 5 attempts." in r["out"]
      and r["build"] == 0 and not ours_landed(r), (r["rc"], r["build"], r["out"][-600:]))
r = push_case(reject=1)
check("push: a failure that is no conflict, then a good push, lands on attempt 2 with no rebuild",
      r["rc"] == 0 and "Push succeeded on attempt 2." in r["out"] and r["build"] == 0
      and r["report"] == "ours, first pass", (r["rc"], r["out"][-600:]))

# 3d. `not_inputs` holds only paths no build command reads. The build's inputs cannot be listed from the code
# (its builders glob kb/, list .github/workflows and the root, and load modules by path), so the commit step
# keeps the other list, and this walk is what keeps it honest: every file the build runs, followed from
# scripts/daily_build.sh's commands through Python imports, modules loaded by path or by import_module, and
# the scripts a subprocess launches, must name no path under a not-input prefix and walk no tree.
nm = re.search(r'^not_inputs="([^"]*)"$', loop, re.M)
NOT_INPUTS = nm.group(1).split() if nm else []
check("daily: the commit step names its not-input prefixes, docs/ and tests/ (a change here is a decision)",
      NOT_INPUTS == ["docs/", "tests/"], NOT_INPUTS)
check("daily: a clean rebase compares the incoming range against them and rebuilds through daily_rebuild",
      'base=$(git merge-base "$pre" origin/main)' in loop and 'inputs=$(build_inputs_changed "$base")' in loop
      and loop.count("daily_rebuild;") == 1 and 'git reset -q --hard "$pre"' in loop
      and loop.index("pre=$(git rev-parse HEAD)") < loop.index("if git rebase origin/main; then"))
LAUNCH_RE = re.compile(r"(?:python3?|node|bash)\s+([\w./\-]+\.(?:py|mjs|js|sh))\b")
SEARCH_DIRS = ["", "kb", "funding", "fact-sheet", "prototype", "scripts"]
# A not-input path the build writes into its output as a pointer and never opens: (file, string) -> why.
NAMED_NOT_READ = {
    ("kb/_build_cr_reference.py", "docs/common_cr_reference_scope.md"):
        "the worklist's `_doc` field, a pointer written into kb/cr_reference_worklist.json",
    ("kb/test_mix.py", "tests"):
        "an ASE test mix's field name (`out[\"tests\" if _is_ase(p) else \"with\"]`), never a directory",
}


def _resolve(base, name):
    for d in [base] + SEARCH_DIRS:
        p = os.path.normpath(os.path.join(d, name)).replace("\\", "/")
        if not p.startswith("..") and os.path.isfile(os.path.join(REPO, p)):
            return p
    return None


def _code(text, mark):
    return "\n".join(ln for ln in text.split("\n") if not ln.lstrip().startswith(mark))


def _strings(tree):
    """String constants a script can use as a path: not docstrings, not dict keys."""
    skip = set()
    for n in ast.walk(tree):
        body = getattr(n, "body", None)
        if isinstance(n, (ast.Module, ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)) and body \
                and isinstance(body[0], ast.Expr) and isinstance(body[0].value, ast.Constant):
            skip.add(id(body[0].value))
        if isinstance(n, ast.Dict):
            skip.update(id(k) for k in n.keys if k is not None)
    return [n for n in ast.walk(tree) if isinstance(n, ast.Constant) and isinstance(n.value, str)
            and id(n) not in skip]


def runs_next(rel, text):
    """The repo files `rel` runs: launched scripts, imports, modules loaded by path."""
    base, out = os.path.dirname(rel), set()
    if rel.endswith(".py"):
        tree = ast.parse(text)
        for n in ast.walk(tree):
            mods = []
            if isinstance(n, ast.Import):
                mods = [a.name for a in n.names]
            elif isinstance(n, ast.ImportFrom) and n.module and not n.level:
                mods = [n.module] + ["%s.%s" % (n.module, a.name) for a in n.names]
            elif isinstance(n, ast.Call) and ast.unparse(n.func).endswith("import_module") and n.args \
                    and isinstance(n.args[0], ast.Constant) and isinstance(n.args[0].value, str):
                mods = [n.args[0].value]
            for m in mods:
                r = _resolve(base, m.replace(".", "/") + ".py") or _resolve(base, m.replace(".", "/") + "/__init__.py")
                if r:
                    out.add(r)
        for c in _strings(tree):   # spec_from_file_location and friends: a bare path to a .py file
            if re.fullmatch(r"[\w./\-]+\.py", c.value) and _resolve(base, c.value):
                out.add(_resolve(base, c.value))
        for fn in ast.walk(tree):  # a script a subprocess launches (excel_to_dashboard.py runs generate_reports.js)
            if isinstance(fn, (ast.FunctionDef, ast.AsyncFunctionDef)) and any(
                    isinstance(c, ast.Call) and re.search(r"subprocess|Popen|os\.system", ast.unparse(c.func))
                    for c in ast.walk(fn)):
                for c in _strings(fn):
                    if re.fullmatch(r"[\w./\-]+\.(?:py|mjs|js|sh)", c.value) and _resolve(base, c.value):
                        out.add(_resolve(base, c.value))
    else:
        body = _code(text, "#" if rel.endswith(".sh") else "//")
        for s in LAUNCH_RE.findall(body):
            if _resolve(base, s):
                out.add(_resolve(base, s))
        for s in re.findall(r"require\(\s*['\"](\.{1,2}/[\w./\-]+)['\"]", body):
            r = _resolve(base, s if s.endswith((".js", ".mjs")) else s + ".js")
            if r:
                out.add(r)
    return out


def not_input_reads(rel, text, prefixes):
    """(line, what) for each place `rel` names a path under a prefix, or walks a tree."""
    names = [p.strip("/") for p in prefixes]
    hits = []
    if rel.endswith(".py"):
        tree = ast.parse(text)
        parent = {id(c): n for n in ast.walk(tree) for c in ast.iter_child_nodes(n)}
        for c in _strings(tree):
            v = c.value
            as_dir = v.strip("/") in names and not isinstance(parent.get(id(c)), ast.Subscript)
            as_path = re.fullmatch(r"[\w./\-{}]+", v) and any(re.search(r"(?:^|/)%s/" % re.escape(n), v) for n in names)
            if (as_dir or as_path) and (rel, v) not in NAMED_NOT_READ:
                hits.append((c.lineno, v))
        for c in ast.walk(tree):
            if isinstance(c, ast.Call):
                f, whole = ast.unparse(c.func), ast.unparse(c)
                if re.search(r"(?:^|\.)(?:walk|rglob)$", f) or (re.search(r"(?:^|\.)i?glob$", f) and (
                        "**" in whole or "recursive" in whole)) or "ls-files" in whole or "'grep'" in whole:
                    hits.append((c.lineno, "walks: " + whole[:80]))
    else:
        for i, ln in enumerate(_code(text, "#" if rel.endswith(".sh") else "//").split("\n"), 1):
            if ln.lstrip().startswith("*"):
                continue
            if not rel.endswith(".sh"):
                ln = re.sub(r"\s//.*$", "", ln)   # a trailing comment
            if re.search(r"(?:^|[\s\"'=(:])(?:\./)?(?:%s)/" % "|".join(re.escape(n) for n in names), ln) or (
                    not rel.endswith(".sh") and re.search(r"['\"`](?:%s)/?['\"`]" % "|".join(re.escape(n) for n in names), ln)):
                hits.append((i, ln.strip()[:80]))
            if re.search(r"(?:^|[\s;|(])find\s|ls-files|git grep|readdirSync\([^)]*recursive", ln):
                hits.append((i, "walks: " + ln.strip()[:80]))
    return hits


ran, todo = set(), ["scripts/daily_build.sh"]
while todo:
    f = todo.pop()
    if f not in ran:
        ran.add(f)
        todo.extend(runs_next(f, open(os.path.join(REPO, f), encoding="utf-8").read()) - ran)
check("not_inputs walk: it reaches the build's scripts, their imports, path-loaded modules and launched scripts",
      len(ran) >= 60 and {"excel_to_dashboard.py", "generate_reports.js", "kb/_build_governance_candidates.py",
                          "kb/_build_commons_status.py", "kb/alias_chain.py", "kb/_seed_college_short_names.py",
                          "kb/_sweep_exhibit_titles.py"} <= ran, len(ran))
found = {f: h for f in sorted(ran)
         for h in [not_input_reads(f, open(os.path.join(REPO, f), encoding="utf-8").read(), NOT_INPUTS)] if h}
check("not_inputs walk: no file the build runs names a path under docs/ or tests/, or walks the tree",
      bool(NOT_INPUTS) and not found, found)
stale = [k for k in NAMED_NOT_READ if k[0] not in ran
         or k[1] not in open(os.path.join(REPO, k[0]), encoding="utf-8").read()]
check("not_inputs walk: each pointer it excuses is still in the build", not stale, stale)
# The walk can fail: each planted reader is caught, and the shapes that are not reads are not.
PLANTED = {
    'open(os.path.join(ROOT, "docs", "x.md"))': True, 'json.load(open(ROOT / "tests" / "f.json"))': True,
    'P = "docs/reference/lanes/x.md"': True, 'p = f"{ROOT}/tests/{name}.json"': True,
    'glob.glob("**/*.md", recursive=True)': True, "for d, _, fs in os.walk(ROOT): pass": True,
    'D = "docs"': True, 'DIRS = ("kb", "tests")': True,
    'x = {"tests": [], "with": []}': False, 'y = got["tests"]': False, 'def f():\n    """See docs/x.md."""': False,
    'print("python3 kb/_build_dependency_map.py writes docs/reference/dependency_map.md")': False,
}
wrong = [src for src, want in PLANTED.items() if bool(not_input_reads("kb/planted.py", src, NOT_INPUTS)) != want]
wrong += [src for src, want in {"var d = 'docs';": True, "x.tests = 1; // see 'docs'": False}.items()
          if bool(not_input_reads("planted.js", src, NOT_INPUTS)) != want]
wrong += [src for src, want in {"cat docs/x.md > out": True, "find . -name '*.json'": True,
                                "# see tests/apply_concurrency_test.py": False}.items()
          if bool(not_input_reads("scripts/planted.sh", src, NOT_INPUTS)) != want]
check("not_inputs walk: catches a planted reader of either prefix and a tree walk, passes keys and prose", not wrong, wrong)

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
