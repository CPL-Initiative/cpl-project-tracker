#!/usr/bin/env python3
"""Rebuild the daily dashboard on a new main, inside the same job (COBIx #3110 finding 8, S641).

The daily's "Commit and push to main" step calls this once, when its push meets a rebase conflict: another
writer reached `main` while the run was building, and the two touched the same generated file. Such a
conflict is never resolved by picking a side: the files are rebuilt from the new main. So this script:

  1. resets the work tree and the branch to --onto (the new origin/main), discarding the run's commit;
  2. runs the build steps again, read from .github/workflows/daily-dashboard.yml itself, so every command
     stays written once, in the workflow (the step names, their order, their env and their run scripts).

The steps it runs are update-dashboard's, from FIRST up to END (not included), less SETUP. Each runs as
GitHub runs a `run:` step: `bash --noprofile --norc -eo pipefail`, from the repo root, with the step's env.
A value written to $GITHUB_ENV reaches the later steps here and, through the real $GITHUB_ENV, the steps
after the push. A step that fails stops the rebuild with exit 1, as it would fail the job.

The script refuses (exit 2) a step it cannot run the way GitHub would: an `if:` other than the recheck's
(true inside this job by the time the push runs), an env value other than a literal or `${{ secrets.NAME }}`,
a `${{` inside a run script, or a key such as `uses`, `shell` or `working-directory`.

Reused, not run again (REUSE): the network fetches whose result is not derived from main.
  - The CustomReport fetch writes CustomReport_latest.json, which is untracked (gitignored: student
    detail) and so survives the reset. The run already holds today's copy.
  - The scrape (the Cloudflare Worker in front of the CCCCO dashboard API) and the MIL/JST fetch (the
    CCCCO potential-savings API) write live_metrics.json and veteran_jst.json, which are committed. When
    main's copy did not change between the commit the run built on and the new main, the run's own
    result (read from its commit) is put back and the fetch is not repeated. When another writer did
    change it, the fetch runs again, so the rebuild never lays the run's file over a newer one on main.

Usage: python3 scripts/daily_rebuild.py --onto origin/main
       python3 scripts/daily_rebuild.py --list            (the plan, nothing run)
       --workflow PATH reads another workflow file (the scratch-repo test uses one).
"""
import argparse
import os
import re
import subprocess
import sys
import tempfile

import yaml

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORKFLOW = os.path.join(REPO, ".github", "workflows", "daily-dashboard.yml")
JOB = "update-dashboard"
FIRST = "Fetch CustomReport from MAP API"
END = "Commit and push to main"
# Environment set-up, already done in this job and untouched by the reset (node_modules is gitignored).
SETUP = {"Install node docx (Word reports)"}
REUSE = {
    "Fetch CustomReport from MAP API": (),
    "Scrape live metrics from Cloudflare Worker": ("live_metrics.json",),
    "Fetch MIL/JST veteran data": ("veteran_jst.json",),
}
RECHECK_IF = "steps.recheck.outputs.run == 'true'"
SECRET_RE = re.compile(r"^\$\{\{\s*secrets\.([A-Za-z_][A-Za-z0-9_]*)\s*\}\}$")
ALLOWED_KEYS = {"name", "run", "env", "if"}


class Refuse(Exception):
    pass


def plan(workflow):
    with open(workflow, encoding="utf-8") as f:
        doc = yaml.safe_load(f)
    steps = ((doc.get("jobs") or {}).get(JOB) or {}).get("steps") or []
    names = [s.get("name") for s in steps]
    if FIRST not in names or END not in names:
        raise Refuse("%s: job %s has no step named %r or %r" % (workflow, JOB, FIRST, END))
    chosen = []
    for s in steps[names.index(FIRST):names.index(END)]:
        name = s.get("name") or "(unnamed)"
        if name in SETUP:
            continue
        extra = sorted(set(s) - ALLOWED_KEYS)
        if extra:
            raise Refuse("step %r carries %s, which this rebuild cannot run as GitHub would" % (name, extra))
        if "if" in s and str(s["if"]).strip() != RECHECK_IF:
            raise Refuse("step %r has if: %r; only %r is true by the time the push runs" % (name, s["if"], RECHECK_IF))
        run = s.get("run")
        if not isinstance(run, str) or not run.strip():
            raise Refuse("step %r has no run script" % name)
        if "${{" in run:
            raise Refuse("step %r has an expression inside its run script" % name)
        env = {}
        for k, v in (s.get("env") or {}).items():
            v = "" if v is None else str(v)
            m = SECRET_RE.match(v.strip())
            if m:
                env[k] = ("secret", m.group(1))
            elif "${{" in v:
                raise Refuse("step %r: env %s is an expression other than a secret: %r" % (name, k, v))
            else:
                env[k] = ("literal", v)
        chosen.append({"name": name, "run": run, "env": env, "reuse": REUSE.get(name)})
    return chosen


def may_run(step):
    """False for a reused step with no tracked output: nothing on main can make it run again."""
    return step["reuse"] is None or bool(step["reuse"])


def secrets_named(steps):
    """The secrets the rebuild can need: the push step's env carries exactly these."""
    return sorted({v for s in steps if may_run(s) for kind, v in s["env"].values() if kind == "secret"})


def git(*args, check=True):
    p = subprocess.run(["git", *args], cwd=os.getcwd(), capture_output=True)
    if check and p.returncode != 0:
        raise SystemExit("git %s failed: %s" % (" ".join(args), p.stderr.decode(errors="replace").strip()))
    return p


def read_env_file(path):
    """The KEY=VALUE and KEY<<DELIM forms GitHub reads from $GITHUB_ENV."""
    out = {}
    try:
        lines = open(path, encoding="utf-8", errors="replace").read().split("\n")
    except OSError:
        return out
    i = 0
    while i < len(lines):
        line = lines[i]
        if "<<" in line and ("=" not in line or line.index("<<") < line.index("=")):
            key, delim = line.split("<<", 1)
            body = []
            i += 1
            while i < len(lines) and lines[i] != delim:
                body.append(lines[i])
                i += 1
            out[key] = "\n".join(body)
        elif "=" in line:
            key, val = line.split("=", 1)
            out[key] = val
        i += 1
    return out


def run_step(step, carried, tmp):
    env = dict(os.environ)
    env.update(carried)
    for k, (kind, v) in step["env"].items():
        env[k] = os.environ.get(v, "") if kind == "secret" else v
    script = os.path.join(tmp, "step.sh")
    with open(script, "w", encoding="utf-8") as f:
        f.write(step["run"])
    step_env = os.path.join(tmp, "github_env")
    open(step_env, "w").close()
    env["GITHUB_ENV"] = step_env
    env["GITHUB_OUTPUT"] = os.path.join(tmp, "github_output")
    print("::group::Rebuild: " + step["name"], flush=True)
    rc = subprocess.run(["bash", "--noprofile", "--norc", "-eo", "pipefail", script], env=env).returncode
    print("::endgroup::", flush=True)
    written = read_env_file(step_env)
    carried.update(written)
    real = os.environ.get("GITHUB_ENV")
    if written and real:
        with open(real, "a", encoding="utf-8") as f, open(step_env, encoding="utf-8") as src:
            f.write(src.read().rstrip("\n") + "\n")
    return rc


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--onto", help="the ref to rebuild on (the new origin/main)")
    ap.add_argument("--list", action="store_true", help="print the plan and run nothing")
    ap.add_argument("--workflow", default=WORKFLOW)
    a = ap.parse_args()
    try:
        steps = plan(a.workflow)
    except Refuse as e:
        print("::error title=Rebuild refused::%s" % e)
        return 2
    if a.list:
        for s in steps:
            tag = "" if s["reuse"] is None else "  [reused: %s]" % (", ".join(s["reuse"]) or "untracked output")
            print(s["name"] + tag)
        print("secrets: " + " ".join(secrets_named(steps)))
        return 0
    if not a.onto:
        ap.error("--onto is required unless --list")

    new = git("rev-parse", "--verify", a.onto + "^{commit}").stdout.decode().strip()
    base = git("merge-base", "HEAD", new).stdout.decode().strip()
    kept, rerun = {}, set()
    for s in steps:
        if s["reuse"] is None:
            continue
        for path in s["reuse"]:
            changed = git("diff", "--quiet", base, new, "--", path, check=False).returncode != 0
            ours = git("show", "HEAD:" + path, check=False)
            if changed or ours.returncode != 0:
                rerun.add(s["name"])
                print("%s: main's %s changed since %s (or the run has none); the fetch runs again."
                      % (s["name"], path, base[:8]))
            else:
                kept[path] = ours.stdout

    print("Rebuilding on %s (the run built on %s)." % (new[:8], base[:8]), flush=True)
    git("reset", "--hard", new)
    for path, data in kept.items():
        with open(path, "wb") as f:
            f.write(data)

    carried = {}
    with tempfile.TemporaryDirectory(prefix="daily_rebuild_") as tmp:
        for s in steps:
            if s["reuse"] is not None and s["name"] not in rerun:
                print("Reused, not run again: %s" % s["name"])
                continue
            rc = run_step(s, carried, tmp)
            if rc != 0:
                print("::error title=Rebuild failed::step %r exited %d on the new main; nothing is pushed."
                      % (s["name"], rc))
                return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
