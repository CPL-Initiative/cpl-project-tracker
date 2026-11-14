#!/usr/bin/env python3
"""Every file under tests/ runs in CI, or sits on the list below with its reason (S653b, 2026-11-14).

WHY. A test no workflow runs goes red unseen (cpl_memory pitfall-test-outside-every-workflow-s640). The census of
2026-11-14 found 34 Python files under tests/ that no workflow named; four were red on main
(standards_2_ruled_renames_test.py, ccc_metric_test.py, custom_report_duplicate_view_test.py,
powershell_ascii_test.py), each turned red by a later change nobody saw fail. `tests/run.js` discovers
`tests/*.test.js` only, so a `*_test.py` runs nowhere until a workflow step names it.

THE RULE this file enforces, for each file directly under tests/:
  * a `*.test.js` runs when a workflow runs `node tests/run.js` and run.js still discovers `.test.js` files;
  * any other `.py` or `.js` file runs when a workflow's `run:` line names it as `python3 tests/<file>` or
    `node tests/<file>` (comments do not count), or a shell script such a line runs names it the same way;
  * a `.js` helper with no test suffix passes when a file that runs names it (a `require` or a path);
  * otherwise it must be in UNRUN below with a one-line reason. A reason of the form "run by tests/<file>" is
    checked: that file must run and must name this one.
  * Any `*_test.py` or `*.test.js` in a subfolder fails: no runner looks there.
The list may not go stale: an entry that is missing on disk, or that CI now runs, fails too.

The guard proves it can fail on every run: it is handed a made-up unrun file and must name it.

Run from the repo root: python3 tests/every_test_runs_test.py
"""
import glob
import os
import re
import sys

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


def code_lines(text):
    """The lines of a workflow or shell script with comments cut off."""
    out = []
    for line in text.splitlines():
        s = line.lstrip()
        if s.startswith("#"):
            continue
        out.append(line.split(" # ", 1)[0])
    return out


def named_runs(texts):
    found = set()
    for t in texts:
        for line in code_lines(t):
            found.update(RUN_LINE.findall(line))
    return found


def unrun(files, workflows, scripts, run_js, file_text, allow):
    """Return (problems, runs). files: names directly under tests/; workflows/scripts: {path: text};
    run_js: run.js's text; file_text(name) reads a test file; allow: the UNRUN map."""
    problems = []
    wf_texts = list(workflows.values())
    runs = named_runs(wf_texts)
    # Shell scripts a workflow line runs.
    for path, text in scripts.items():
        if any(path in line for t in wf_texts for line in code_lines(t)):
            runs |= named_runs([text])
    suite = "run.js" in runs and 'f.endsWith(".test.js")' in run_js
    if not suite:
        problems.append("no workflow runs `node tests/run.js` that discovers *.test.js; every .test.js is unrun")
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
        problems.append(f"{f}: no workflow runs it and it is not on the UNRUN list in tests/every_test_runs_test.py "
                        "(name it in a step of .github/workflows/js-tests.yml, or list it with its reason)")
    for f in sorted(allow):
        if f not in files:
            problems.append(f"{f}: on the UNRUN list but not in tests/; remove the entry")
    return problems, runs


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

# The guard must be able to fail: a made-up unrun test, a comment naming one, a stale entry, a false "run by".
fake = files + ["zz_scratch_unrun_test.py"]
fake_text = lambda n: "" if n == "zz_scratch_unrun_test.py" else file_text(n)  # noqa: E731
p1, _ = unrun(fake, workflows, scripts, run_js, fake_text, UNRUN)
check("fail-first: a new unrun test file is named", any(x.startswith("zz_scratch_unrun_test.py:") for x in p1), p1[:2])
wf_comment = dict(workflows)
wf_comment["x.yml"] = "      # python3 tests/zz_scratch_unrun_test.py\n"
p2, _ = unrun(fake, wf_comment, scripts, run_js, fake_text, UNRUN)
check("fail-first: a workflow comment naming the file does not count as running it",
      any(x.startswith("zz_scratch_unrun_test.py:") for x in p2))
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
