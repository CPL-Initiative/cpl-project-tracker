#!/usr/bin/env python3
"""Every file under tests/ runs in CI, or sits on the list below with its reason (S653b, 2026-11-14).

WHY. A test no workflow runs goes red unseen (cpl_memory pitfall-test-outside-every-workflow-s640). The census of
2026-11-14 (#3332) found 32 Python tests under tests/ that no workflow named; four were red on main
(standards_2_ruled_renames_test.py, ccc_metric_test.py, custom_report_duplicate_view_test.py,
powershell_ascii_test.py), each turned red by a later change nobody saw fail. #3332 put the 32 in js-tests.yml beside
this guard. `tests/run.js` discovers `tests/*.test.js` only, so a `*_test.py` runs nowhere until a workflow step
names it. COBIx's review of #3332 found the guard still counted a workflow no pull request starts, and a step that
cannot go red; the rule below closes both, and found one more file (custom_report_payload_test.py, named only by the
scheduled map-custom-report-load.yml), which js-tests.yml now runs too.

THE RULE this file enforces, for each file directly under tests/. Only a GATING STEP counts: a step of a workflow
with a `pull_request` trigger (a push to main runs after the merge; a schedule or dispatch later still), in a job and
step with no `continue-on-error` and no `if: false`. Within a gating step, a line that swallows its status after the
test (`|| true`, `|| :`, `|| exit 0`, `|| echo ...`) does not count; `|| exit <nonzero>` and `|| false` still fail
the step and count. A test followed by `&&` on its line does not count (neither `-e` nor the collector's ERR trap
sees it fail), and no line counts in a step that runs `set +e` without sourcing the collector first.
  * a `*.test.js` runs when a gating step runs `node tests/run.js` and run.js still discovers `.test.js` files;
  * any other `.py` or `.js` file runs when a gating step's line names it as `python3 tests/<file>` or
    `node tests/<file>` (comments do not count), or a shell script such a line runs names it the same way;
  * a `.js` helper with no test suffix passes when a file that runs names it (a `require` or a path);
  * otherwise it must be in UNRUN below with a one-line reason. A reason of the form "run by tests/<file>" is
    checked: that file must run and must name this one.
  * Any `*_test.py` or `*.test.js` in a subfolder fails: no runner looks there.
  * A gating step that names two or more tests sources scripts/test_group.sh first and ends with `test_group_end`,
    so a red test does not hide the tests after it in the same step.
The list may not go stale: an entry that is missing on disk, or that CI now runs, fails too.

The guard proves it can fail on every run: it is handed made-up workflows for each rule and must name the file.

Run from the repo root: python3 tests/every_test_runs_test.py
"""
import glob
import os
import re
import sys

import yaml

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TESTS = os.path.join(REPO, "tests")

# file -> why CI does not run it. One line each. Add a file here only when a workflow cannot run it.
UNRUN = {
    "lattc_worklist_page_test.py":
        "drives a real Chromium through playwright; js-tests.yml skips the browser download, so a session runs it",
    "kb_curation_guarded_sql_proof.py":
        "needs a live Postgres (PGHOST/PGPORT); a session runs it before a guarded kb_curation apply",
    "statewide_catalog_build_test.py":
        "run by tests/sierra_statewide_catalog.test.js",
}

RUN_LINE = re.compile(r"\b(?:python3?|node)\s+(?:-\S+\s+)*tests/([\w.\-]+\.(?:py|js))\b")
SCRIPT_LINE = re.compile(r"\b(scripts/[\w.\-]+\.sh)\b")
RUN_BY = re.compile(r"^run by tests/([\w.\-]+)$")
# A line whose status is swallowed after the test runs (`|| true`, `|| :`, `|| exit 0`, `|| echo ...`) can never go
# red. `|| exit <nonzero>` and `|| false` still fail the step, so they count (the second reader on #3337).
SWALLOWED = re.compile(r"\|\|")
STILL_FAILS = re.compile(r"\|\|\s*(?:exit\s+0*[1-9]\d*|false)\s*;?\s*$")
# A test on the left of `&&` hides its status: bash runs neither the ERR trap nor `-e` for a command that is not the
# last of an `&&` list, so a red test there ends nothing and is collected by nothing (the second reader on #3337).
AND_AFTER = re.compile(r"&&")
SET_PLUS_E = re.compile(r"^\s*set\s+\+e\b")
COLLECTOR = "source scripts/test_group.sh"
NEVER = {False, "false", "${{ false }}", "${{false}}"}


def code_lines(text):
    """The lines of a workflow `run:` block or shell script with comments cut off."""
    out = []
    for line in text.splitlines():
        s = line.lstrip()
        if s.startswith("#"):
            continue
        out.append(line.split(" # ", 1)[0])
    return out


def swallowed(rest):
    """True when the text after a test on its line keeps the line from failing: an `||` that is not
    `|| exit <nonzero>` or `|| false`, or an `&&` (the test is then not the list's last command)."""
    if AND_AFTER.search(rest):
        return True
    return bool(SWALLOWED.search(rest)) and not STILL_FAILS.search(rest)


def runnable(text):
    """The code lines of a run block or script that can fail. A line that swallows its status does not count, and
    neither does any line of a block that turns `-e` off (`set +e`) without the collector, which records each red
    command itself."""
    lines = code_lines(text)
    code = [l.strip() for l in lines if l.strip()]
    if any(SET_PLUS_E.match(l) for l in code) and (not code or code[0] != COLLECTOR):
        return []
    out = []
    for line in lines:
        m = RUN_LINE.search(line) or SCRIPT_LINE.search(line)
        if m and swallowed(line[m.end():]):
            continue
        out.append(line)
    return out


def triggers(doc):
    on = doc.get("on", doc.get(True)) if isinstance(doc, dict) else None
    if isinstance(on, str):
        return {on}
    if isinstance(on, (list, dict)):
        return set(on)
    return set()


def can_fail(block):
    """A job or step whose failure can turn the run red: no `continue-on-error` and no `if: false`."""
    coe = block.get("continue-on-error", False)
    if coe not in (False, "false"):
        return False
    return block.get("if", True) not in NEVER


def gate_runs(workflows):
    """The `run:` text of every step that gates a pull request: the workflow has a `pull_request` trigger
    (a push to main runs after the merge, a schedule or dispatch later still) and neither the job nor the
    step can be told to pass whatever the test says. Returns (texts, problems)."""
    texts, problems = [], []
    for path, text in sorted(workflows.items()):
        try:
            doc = yaml.safe_load(text)
        except yaml.YAMLError as e:
            problems.append(f"{path}: not YAML ({str(e).splitlines()[0]})")
            continue
        if "pull_request" not in triggers(doc):
            continue
        for job in ((doc.get("jobs") or {}).values()):
            if not isinstance(job, dict) or not can_fail(job):
                continue
            for step in job.get("steps") or []:
                if isinstance(step, dict) and can_fail(step) and isinstance(step.get("run"), str):
                    texts.append(step["run"])
    return texts, problems


def named_runs(texts):
    found = set()
    for t in texts:
        for line in runnable(t):
            found.update(RUN_LINE.findall(line))
    return found


def unrun(files, workflows, scripts, run_js, file_text, allow):
    """Return (problems, runs). files: names directly under tests/; workflows/scripts: {path: text};
    run_js: run.js's text; file_text(name) reads a test file; allow: the UNRUN map."""
    wf_texts, problems = gate_runs(workflows)
    runs = named_runs(wf_texts)
    # Shell scripts a gating step runs.
    gate_lines = [line for t in wf_texts for line in runnable(t)]
    for path, text in scripts.items():
        if any(path in line for line in gate_lines):
            runs |= named_runs([text])
    suite = "run.js" in runs and 'f.endsWith(".test.js")' in run_js
    if not suite:
        problems.append("no pull-request workflow runs `node tests/run.js` that discovers *.test.js; "
                        "every .test.js is unrun")
    for f in files:
        if f.endswith(".test.js") and suite:
            runs.add(f)
    running_texts = [file_text(f) for f in sorted(runs) if f in files]
    for f in sorted(files):
        if f in runs:
            if f in allow:
                problems.append(f"{f}: CI runs it now, so take it off the UNRUN list")
            continue
        if f.endswith(".js") and not f.endswith(".test.js") and f not in allow:
            stem = f[:-3]
            if any(re.search(r"[\"'/]" + re.escape(stem) + r"(?:\.js)?[\"']", t) for t in running_texts):
                continue
        if f in allow:
            m = RUN_BY.match(allow[f])
            if m:
                runner = m.group(1)
                if runner not in runs:
                    problems.append(f"{f}: listed as run by tests/{runner}, which CI does not run")
                elif f not in file_text(runner):
                    problems.append(f"{f}: listed as run by tests/{runner}, which never names it")
            continue
        problems.append(f"{f}: no pull-request step that can fail runs it, and it is not on the UNRUN list in "
                        "tests/every_test_runs_test.py (name it in a step of .github/workflows/js-tests.yml, "
                        "or list it with its reason)")
    for f in sorted(allow):
        if f not in files:
            problems.append(f"{f}: on the UNRUN list but not in tests/; remove the entry")
    return problems, runs


def ungrouped(texts):
    """Gating `run:` blocks that name two or more tests without the collector around them (the runner's `bash -e`
    would end the step at the first red test and hide the rest)."""
    bad = []
    for t in texts:
        lines = [l.strip() for l in code_lines(t) if l.strip()]
        named = [n for l in lines for n in RUN_LINE.findall(l)]
        if len(named) < 2:
            continue
        if lines[0] != COLLECTOR or lines[-1] != "test_group_end":
            bad.append(named[0])
    return bad


def read(path):
    with open(path, encoding="utf-8", errors="replace") as fh:
        return fh.read()


results = []


def check(name, cond, why=""):
    results.append((name, bool(cond), why))


files = sorted(f for f in os.listdir(TESTS)
               if os.path.isfile(os.path.join(TESTS, f)) and f.endswith((".py", ".js")))
workflows = {os.path.relpath(p, REPO): read(p) for p in glob.glob(os.path.join(REPO, ".github", "workflows", "*.y*ml"))}
scripts = {os.path.relpath(p, REPO): read(p) for p in glob.glob(os.path.join(REPO, "scripts", "*.sh"))}
run_js = read(os.path.join(TESTS, "run.js"))


def file_text(name):
    return read(os.path.join(TESTS, name))


problems, runs = unrun(files, workflows, scripts, run_js, file_text, UNRUN)
check("every file under tests/ runs in CI or is listed with its reason", not problems, "; ".join(problems))
check("every UNRUN reason is one line", all(r and "\n" not in r for r in UNRUN.values()))
nested = sorted(os.path.relpath(p, REPO) for p in glob.glob(os.path.join(TESTS, "**", "*"), recursive=True)
                if os.path.dirname(p) != TESTS and re.search(r"(_test\.py|\.test\.js)$", p))
check("no test file sits in a subfolder of tests/, where no runner looks", not nested, ", ".join(nested))
check("the census sees the suite and the Python steps (a parse that finds nothing passes nothing)",
      "run.js" in runs and sum(f.endswith("_test.py") for f in runs) >= 150, f"{len(runs)} files found running")

gating, _ = gate_runs(workflows)
loose = ungrouped(gating)
check("every gating step that names two or more tests collects every red one (scripts/test_group.sh)",
      not loose, "steps starting with " + ", ".join(loose))
check("the collector exists and ends a red group nonzero",
      os.path.isfile(os.path.join(REPO, "scripts", "test_group.sh"))
      and "exit 1" in read(os.path.join(REPO, "scripts", "test_group.sh")))

# The guard must be able to fail. Each made-up workflow names a made-up test in one way that must not count, and
# a control proves the same test counts when the workflow gates a pull request plainly.
FAKE = "zz_scratch_unrun_test.py"
fake = files + [FAKE]
fake_text = lambda n: "" if n == FAKE else file_text(n)  # noqa: E731
ZZ_SH = dict(scripts, **{"scripts/zz.sh": "python3 tests/" + FAKE + "\n"})


def named_unrun(extra_workflow, scr=scripts):
    wf = dict(workflows, **{"zz.yml": extra_workflow})
    probs, _ = unrun(fake, wf, scr, run_js, fake_text, UNRUN)
    return any(x.startswith(FAKE + ":") for x in probs)


def workflow(on, step, job=""):
    return "on:\n" + on + "jobs:\n  t:\n    runs-on: ubuntu-latest\n" + job + "    steps:\n" + step


PR = "  pull_request:\n"
PLAIN = "      - run: python3 tests/" + FAKE + "\n"
check("fail-first: a new unrun test file is named", named_unrun(""))
check("control: a plain step of a pull-request workflow counts as running it", not named_unrun(workflow(PR, PLAIN)))
check("fail-first: a workflow comment naming the file does not count as running it",
      named_unrun(workflow(PR, "      - run: |\n          # python3 tests/" + FAKE + "\n          true\n")))
check("fail-first: a test named only in a scheduled or dispatched workflow does not count (COBIx #3332, 1)",
      named_unrun(workflow("  schedule:\n    - cron: '0 0 * * *'\n  workflow_dispatch:\n", PLAIN)))
check("fail-first: a test named only in a push workflow does not count (it runs after the merge)",
      named_unrun(workflow("  push:\n    branches: [main]\n", PLAIN)))
check("fail-first: a continue-on-error step does not count (COBIx #3332, 2)",
      named_unrun(workflow(PR, "      - continue-on-error: true\n        run: python3 tests/" + FAKE + "\n")))
check("fail-first: a step in a continue-on-error job does not count",
      named_unrun(workflow(PR, PLAIN, job="    continue-on-error: true\n")))
check("fail-first: an `if: false` step does not count",
      named_unrun(workflow(PR, "      - if: false\n        run: python3 tests/" + FAKE + "\n")))
check("fail-first: a test line ending `|| true` does not count (COBIx #3332, 2)",
      named_unrun(workflow(PR, "      - run: python3 tests/" + FAKE + " || true\n")))
check("fail-first: a test on the left of `&&` does not count (the second reader on #3337)",
      named_unrun(workflow(PR, "      - run: python3 tests/" + FAKE + " && echo done\n")))
check("fail-first: a step that runs `set +e` without the collector does not count (the second reader on #3337)",
      named_unrun(workflow(PR, "      - run: |\n          set +e\n          python3 tests/" + FAKE + "\n"
                                  "          echo done\n")))
check("control: `set +e` inside a step that sources the collector first still counts",
      not named_unrun(workflow(PR, "      - run: |\n          source scripts/test_group.sh\n          set +e\n"
                                      "          python3 tests/" + FAKE + "\n          test_group_end\n")))
for tail in (" || exit 1", " || false", " || exit 2;"):
    check(f"control: a test line ending `{tail.strip()}` still fails the step, so it counts",
          not named_unrun(workflow(PR, "      - run: python3 tests/" + FAKE + tail + "\n")))
for tail in (" || :", " || exit 0", " || echo skipped"):
    check(f"fail-first: a test line ending `{tail.strip()}` does not count",
          named_unrun(workflow(PR, "      - run: python3 tests/" + FAKE + tail + "\n")))
check("control: a script a gating step runs counts the tests it names",
      not named_unrun(workflow(PR, "      - run: bash scripts/zz.sh\n"), ZZ_SH))
check("fail-first: a script run with `|| true` does not count the tests it names",
      named_unrun(workflow(PR, "      - run: bash scripts/zz.sh || true\n"), ZZ_SH))
check("fail-first: a step naming two tests without the collector is named (COBIx #3332, 3)",
      ungrouped(["python3 tests/a_test.py\npython3 tests/b_test.py\n"]) == ["a_test.py"])
check("control: the same step inside the collector passes",
      not ungrouped(["source scripts/test_group.sh\npython3 tests/a_test.py\npython3 tests/b_test.py\n"
                     "test_group_end\n"]))
p3, _ = unrun(files, workflows, scripts, run_js, file_text, dict(UNRUN, **{"gone_test.py": "a reason"}))
check("fail-first: an entry for a file that is gone is named", any(x.startswith("gone_test.py:") for x in p3))
p4, _ = unrun(files, workflows, scripts, run_js, file_text,
              dict(UNRUN, **{"kb_curation_guarded_sql_proof.py": "run by tests/check_ledger.test.js"}))
check("fail-first: a 'run by' runner that never names the file is caught",
      any("never names it" in x for x in p4))
p5, _ = unrun(files, workflows, scripts, run_js.replace('f.endsWith(".test.js")', "x"), file_text, UNRUN)
check("fail-first: a run.js that stops discovering *.test.js leaves every .test.js unrun",
      any("run.js" in x for x in p5))

ok = sum(1 for _, c, _ in results if c)
for name, cond, why in results:
    print(("PASS  " if cond else "FAIL  ") + name + ("" if cond or not why else "  — " + str(why)))
print(f"\n{ok}/{len(results)} checks passed")
sys.exit(0 if ok == len(results) else 1)
