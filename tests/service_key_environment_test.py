#!/usr/bin/env python3
"""Every job that reads the service key runs in the `live-counts` environment, or is on the list below.

Why (governance lessons, S647): Sam made the GitHub environment `live-counts` (deployment branch `main` only) and put
SUPABASE_SERVICE_KEY in it, beside the repository copy. A job that declares the environment reads the environment's
copy; every other job still reads the repository copy, so the environment protects the key only once the repository
copy is gone, and that copy can go only when no job needs it. This census is the guard on the way there: a job that
names `secrets.SUPABASE_SERVICE_KEY` either declares `environment: live-counts` or sits on PENDING with the group it
is planned for and a one-line reason. A new workflow that reads the key fails here until it chooses one.

The list lives here, in this file, so the test and the plan cannot drift apart; each group's PR moves its jobs off
PENDING and adds the environment line (one PR per group: the governance lane's NEXT (1)). When PENDING is empty the
repository copy can go, which is Sam's setting.

KEY ROTATION MEANS TWO COPIES UNTIL PENDING IS EMPTY (COBIx on #3334). The jobs in `live-counts` read the
environment's copy of SUPABASE_SERVICE_KEY and the jobs on PENDING read the repository copy. Whoever rotates the
Supabase service key updates both secrets. Updating one leaves half the workflows failing auth while the other half
keeps working, which reads like a code bug and is not one. The census prints this as one line on every run while
PENDING holds a job.

Three more checks keep the list honest:
  * a PENDING entry that names no job reading the key, or a job that already declares the environment, fails (the
    list only ever shrinks to what is true);
  * a job in `live-counts` whose workflow can run off `main` fails: the environment refuses a job on any other ref,
    so a `pull_request` or `pull_request_target` trigger, or a `push` not limited to `branches: [main]`, would stop
    that run (`schedule`, `workflow_dispatch` and `workflow_run` run on the default branch and pass);
  * the census runs against a few made-up workflows first, so a census that finds nothing cannot pass.

Needs PyYAML (installed by the step that runs it in .github/workflows/js-tests.yml).
"""
import glob
import os
import re
import sys

import yaml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORKFLOWS = os.path.join(ROOT, ".github", "workflows")
ENVIRONMENT = "live-counts"

# `secrets.SUPABASE_SERVICE_KEY` or `secrets['SUPABASE_SERVICE_KEY']`, inside an expression. YAML drops comments, so a
# comment that names the key is not a read.
KEY_READ = re.compile(r"""secrets\s*(?:\.\s*SUPABASE_SERVICE_KEY\b|\[\s*['"]SUPABASE_SERVICE_KEY['"]\s*\])""")

# The planned group of every job that still reads the repository copy, and why it has not moved.
# Group 1 moved in #3334 (S653b) and group 2 in S668 (14 jobs, every run on main by its triggers and its last 30
# runs); a job that moves leaves this list, and its group leaves GROUPS once the list holds none of it.
#   "daily"          daily-dashboard.yml: its own PR after group 1 has run on a real schedule.
#   "branch"         runs on a branch by design or by its recent history; moves only after it dispatches on main with
#                    an input naming the data branch, so the workflow's code is always main's.
#   "other-session"  a file another session is the one writer of today (S653); it also runs on branches.
PENDING = {
    ("cer-decision-apply.yml", "apply"): ("branch", "one of its last 30 runs was dispatched on a claude/ branch"),
    ("coci-offerings-sync.yml", "sync"): ("branch", "recent runs on claude/ and dependabot branches"),
    ("college-contacts-harvest.yml", "read"): ("branch", "dispatched on claude/ branches by the contacts harvest"),
    ("college-contacts-harvest.yml", "apply"): ("branch", "dispatched on claude/ branches by the contacts harvest"),
    ("course-outcomes-load.yml", "load"): ("branch", "push to claude/** fires it; the other session's step 11 does"),
    ("course-outline-census.yml", "census"): ("branch", "push to claude/** fires it"),
    ("cpl-landing-pages.yml", "sync"): ("branch", "push to claude/** fires it; recent runs on claude/ branches"),
    ("cpl-news.yml", "harvest"): ("branch", "push to claude/** fires it, though its last 30 runs were on main"),
    ("daily-dashboard.yml", "update-dashboard"): ("daily", "the daily run; its own PR after group 1 runs on schedule"),
    ("phase-1e-apply.yml", "apply"): ("branch", "one of its last 30 runs was on claude/phase-1e-apply (a push, May)"),
    ("program-requirements-college.yml", "read"): ("other-session", "the harvest's file today; runs on claude/ branches"),
    ("program-requirements-college.yml", "load"): ("other-session", "the harvest's file today; runs on claude/ branches"),
    ("program-requirements-college.yml", "display"): (
        "other-session", "the harvest's file today; runs on claude/ branches"),
    ("program-requirements-college.yml", "fetch"): (
        "other-session", "the harvest's file today; reads a stored receipt for a session on any branch (S680)"),
    ("program-requirements-dated-reads.yml", "read"): (
        "other-session", "the harvest's file today; dispatched on claude/ branches"),
    ("program-requirements-extract.yml", "extract"): ("other-session", "the harvest's file today; push to claude/**"),
    ("program-requirements-wave.yml", "read"): ("other-session", "the harvest's file today; dispatched on claude/ branches"),
    ("receipt-move.yml", "move"): (
        "branch", "the one-time move of the display receipts (S680), started by a trigger push on a claude/ branch"),
    ("program-source-census.yml", "census"): ("branch", "push to claude/** fires it; recent runs on claude/ branches"),
    ("second-reader.yml", "read"): ("other-session", "the harvest's second reader, the other session's file today"),
}
GROUPS = {"daily", "branch", "other-session"}


def triggers(doc):
    """The workflow's `on:` as a dict (YAML 1.1 reads a bare `on` as True)."""
    on = doc.get(True, doc.get("on"))
    if isinstance(on, str):
        return {on: None}
    if isinstance(on, list):
        return {k: None for k in on}
    return on or {}


def off_main_triggers(doc):
    """The triggers that can start a run on a ref other than main."""
    out = []
    for name, spec in triggers(doc).items():
        if name in ("schedule", "workflow_dispatch", "workflow_run"):
            # a schedule and a workflow_run run on the default branch; a dispatch names its ref (checked by run
            # history). COBIx on #3334: a workflow_run group would otherwise fail the census for no reason.
            continue
        if name == "push":
            spec = spec or {}
            branches = spec.get("branches")
            if branches != ["main"] or "branches-ignore" in spec or "tags" in spec:
                out.append("push " + repr(branches))
            continue
        out.append(name)
    return out


def environment_name(job):
    env = job.get("environment")
    if isinstance(env, dict):
        return env.get("name")
    return env


def key_readers(doc):
    """Each job that reads the key: its own text, or the workflow-level env when that names it."""
    workflow_env = KEY_READ.search(yaml.safe_dump(doc.get("env") or {})) is not None
    for name, job in (doc.get("jobs") or {}).items():
        reads = workflow_env or KEY_READ.search(yaml.safe_dump(job, width=10**6)) is not None
        if not reads and job.get("uses") and job.get("secrets") == "inherit":
            reads = True  # a reusable workflow handed every secret
        if reads:
            yield name, job


def census(workflows, pending):
    """workflows: {file name: YAML text}. Returns (findings, moved, pending_seen)."""
    findings, moved, seen = [], [], set()
    for fname, text in sorted(workflows.items()):
        doc = yaml.safe_load(text) or {}
        for job_name, job in key_readers(doc):
            key = (fname, job_name)
            if environment_name(job) == ENVIRONMENT:
                moved.append(key)
                if key in pending:
                    findings.append("%s job %s declares %s and is still on PENDING: take it off" % (fname, job_name, ENVIRONMENT))
                bad = off_main_triggers(doc)
                if bad:
                    findings.append("%s job %s is in %s (main only) but the workflow can run off main: %s"
                                    % (fname, job_name, ENVIRONMENT, ", ".join(bad)))
                continue
            if key in pending:
                seen.add(key)
                continue
            findings.append("%s job %s reads secrets.SUPABASE_SERVICE_KEY without `environment: %s` and is not on "
                            "PENDING in tests/service_key_environment_test.py: declare the environment (only if every "
                            "run is on main) or list it with its group and a reason" % (fname, job_name, ENVIRONMENT))
    for key in sorted(set(pending) - seen - set(moved)):
        findings.append("PENDING names %s job %s, which reads no service key: drop the entry" % key)
    for key, (group, reason) in sorted(pending.items()):
        if group not in GROUPS or not reason.strip():
            findings.append("PENDING %s job %s needs a group in %s and a reason" % (key[0], key[1], sorted(GROUPS)))
    return findings, moved, seen


FIXTURE_KEYED = """
on: {schedule: [{cron: '1 2 * * *'}]}
jobs:
  a:
    runs-on: ubuntu-latest
    steps:
      - env: {K: "${{ secrets.SUPABASE_SERVICE_KEY }}"}
        run: true
"""
FIXTURE_MOVED_ON_PR = """
on: {pull_request: {}, workflow_dispatch: {}}
jobs:
  a:
    environment: live-counts
    runs-on: ubuntu-latest
    steps:
      - env: {K: "${{ secrets['SUPABASE_SERVICE_KEY'] }}"}
        run: true
"""
FIXTURE_MOVED_OK = """
on: {push: {branches: [main]}, schedule: [{cron: '1 2 * * *'}]}
env: {K: "${{ secrets.SUPABASE_SERVICE_KEY }}"}
jobs:
  a:
    environment: {name: live-counts}
    runs-on: ubuntu-latest
    steps: [{run: true}]
  b:
    environment: live-counts
    runs-on: ubuntu-latest
    steps: [{run: true}]
"""
FIXTURE_MOVED_TEMPLATE = """
on: %s
jobs:
  a:
    environment: live-counts
    runs-on: ubuntu-latest
    steps:
      - env: {K: "${{ secrets.SUPABASE_SERVICE_KEY }}"}
        run: true
"""
FIXTURE_COMMENT_ONLY = """
on: {workflow_dispatch: {}}
jobs:
  a:
    runs-on: ubuntu-latest
    # secrets.SUPABASE_SERVICE_KEY is named in a comment only
    steps: [{run: true}]
"""


def self_test():
    """The census on made-up workflows: each fault it exists for is found, and a clean case passes."""
    problems = []
    f, _, _ = census({"x.yml": FIXTURE_KEYED}, {})
    if not (len(f) == 1 and "without `environment: live-counts`" in f[0]):
        problems.append("an unlisted key reader was not found: %r" % f)
    f, _, seen = census({"x.yml": FIXTURE_KEYED}, {("x.yml", "a"): ("branch", "a reason")})
    if f or seen != {("x.yml", "a")}:
        problems.append("a listed key reader did not pass: %r" % f)
    f, _, _ = census({"x.yml": FIXTURE_MOVED_ON_PR}, {})
    if not (len(f) == 1 and "can run off main: pull_request" in f[0]):
        problems.append("an environment job on a pull_request workflow was not found: %r" % f)
    f, moved, _ = census({"x.yml": FIXTURE_MOVED_OK}, {})
    if f or sorted(moved) != [("x.yml", "a"), ("x.yml", "b")]:
        problems.append("a workflow-level key read in two environment jobs did not pass: %r %r" % (f, moved))
    f, _, _ = census({"x.yml": FIXTURE_MOVED_OK}, {("x.yml", "a"): ("branch", "a reason")})
    if not (len(f) == 1 and "still on PENDING" in f[0]):
        problems.append("a moved job left on PENDING was not found: %r" % f)
    f, moved, _ = census({"x.yml": FIXTURE_MOVED_TEMPLATE % "{workflow_run: {workflows: [Daily], types: [completed]}}"},
                         {})
    if f or moved != [("x.yml", "a")]:
        problems.append("an environment job on a workflow_run trigger (it runs on the default branch) failed: %r" % f)
    for on, want in (("{pull_request_target: {}}", "pull_request_target"), ("{push: {}}", "push None"),
                     ("{push: {branches: [main, 'claude/**']}}", "push ['main', 'claude/**']")):
        f, _, _ = census({"x.yml": FIXTURE_MOVED_TEMPLATE % on}, {})
        if not (len(f) == 1 and f[0].endswith("can run off main: " + want)):
            problems.append("an environment job on %s was not flagged: %r" % (on, f))
    f, _, _ = census({"x.yml": FIXTURE_COMMENT_ONLY}, {("x.yml", "a"): ("branch", "a reason")})
    if not (len(f) == 1 and "reads no service key" in f[0]):
        problems.append("a stale PENDING entry (the key named only in a comment) was not found: %r" % f)
    f, _, _ = census({"x.yml": FIXTURE_KEYED}, {("x.yml", "a"): ("someday", "")})
    if not (len(f) == 1 and "needs a group" in f[0]):
        problems.append("a PENDING entry without a known group and a reason was not found: %r" % f)
    return problems


def rotation_warning(in_env, pending):
    return ("KEY ROTATION: %d jobs in %s read the environment's SUPABASE_SERVICE_KEY and %d on PENDING read the "
            "repository copy; whoever rotates the Supabase service key updates both secrets, or half the "
            "workflows fail auth while the rest keep working." % (in_env, ENVIRONMENT, pending))


def main():
    problems = self_test()
    if problems:
        print("FAIL: the census cannot catch what it exists for:")
        for p in problems:
            print("  " + p)
        return 1
    workflows = {os.path.basename(p): open(p, encoding="utf-8").read()
                 for p in sorted(glob.glob(os.path.join(WORKFLOWS, "*.yml")))}
    findings, moved, seen = census(workflows, PENDING)
    if PENDING:
        print(rotation_warning(len(moved), len(seen)))
    if findings:
        print("FAIL: %d finding(s)" % len(findings))
        for f in findings:
            print("  " + f)
        return 1
    files = {k[0] for k in moved} | {k[0] for k in seen}
    print("ok: %d workflow files read the service key; %d jobs in %s, %d jobs on PENDING (%s)" % (
        len(files), len(moved), ENVIRONMENT, len(seen),
        ", ".join("%s %d" % (g, sum(1 for k in seen if PENDING[k][0] == g)) for g in sorted(GROUPS))))
    return 0


if __name__ == "__main__":
    sys.exit(main())
