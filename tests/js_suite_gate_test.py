#!/usr/bin/env python3
"""Guards for the E gate (required-but-conditional-fast, Sam 2026-08-29).

Three failure modes, each measured or observed before this file existed:

1. THE BOUNDARY DRIFTS. scripts/js_suite_gate.sh decides when `npm test` may
   be skipped. The decision table below pins the boundary from BOTH sides —
   widen the inert set (say, to `kb/*`) and a run-case fails; narrow it and a
   skip-case fails. A gate only tested on the side it was built for rots on
   the other one.

2. A NEW TEST STARTS READING AN INERT PATH. The skip design is sound only
   while docs/catalog/** is the sole suite input a docs-shaped diff can
   change (measured 2026-08-30 by scanning every read call in tests/). If a
   future test reads another docs/ or root-*.md path, a docs-only PR would
   skip it — a green required check over an unexercised input. The scanner
   here re-derives the set of inert-path readers on every run and requires
   each one to be executed in the workflow's skip branch.

3. THE WORKFLOW REGRESSES TO THE FOREVER-BLOCK SHAPE. `paths-ignore:` (or an
   `if:` on the job) makes a REQUIRED check never report, which blocks the
   PR forever. Pinned as a never here, beside the wiring the gate needs.

Run from repo root: python3 tests/js_suite_gate_test.py
"""
import os
import re
import subprocess
import sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GATE = os.path.join(REPO, "scripts", "js_suite_gate.sh")
WORKFLOW = os.path.join(REPO, ".github", "workflows", "js-tests.yml")

results = []


def check(name, cond):
    results.append((name, bool(cond)))


def decide(paths):
    out = subprocess.run(
        ["sh", GATE], input="\n".join(paths) + ("\n" if paths else ""),
        capture_output=True, text=True, cwd=REPO,
    )
    return out.stdout.strip()


# ── 1. Decision table — the boundary, pinned from both sides ──────────────
SKIP_CASES = {
    "one handoff": ["docs/session_211_handoff.md"],
    "kb-note + regenerated catalog + index (the checkpoint shape)": [
        "docs/kb-notes/methodology-foo.md",
        "docs/catalog/index.json",
        "docs/INDEX.md",
    ],
    "lane file": ["docs/reference/lanes/esl-packaging.md"],
    "root CLAUDE.md": ["CLAUDE.md"],
    "root README.md": ["README.md"],
    "checkpoint command": [".claude/commands/checkpoint.md"],
    "docs-audit output": ["kb/docs_audit/2026-08-30.md", "kb/docs_audit/2026-08-30.json"],
}
RUN_CASES = {
    "consumer JS": ["governance.js"],
    "mixed docs + JS": ["docs/kb-notes/methodology-foo.md", "admin.js"],
    "the workflow itself": [".github/workflows/js-tests.yml"],
    "the gate rule itself": ["scripts/js_suite_gate.sh"],
    "nested .md outside docs/ (a real suite input)": [
        "kb/college_identity/2026-08-23_test_org_removal.md"
    ],
    "HTML (120 readFileSync sites in tests/)": ["CPL_Dashboard.html"],
    "kb JSON (would fail if inert set widened to kb/*)": ["kb/unified_titles.json"],
    "package.json": ["package.json"],
    "prototype asset": ["prototype/first_light_theme_v1.html"],
    "empty diff fails safe": [],
}
for name, paths in SKIP_CASES.items():
    check("skip: " + name, decide(paths) == "skip")
for name, paths in RUN_CASES.items():
    check("run: " + name, decide(paths) == "run")

check("gate script is executable (the workflow pipes into it bare)",
      os.access(GATE, os.X_OK))

# ── 2. Rot guard — every inert-path reader must run in the skip branch ────
READ_CALL = re.compile(
    r"(?:readFileSync|readdirSync|existsSync|statSync|createReadStream)"
    r"\s*\(\s*(?:path\.join\(\s*)?[\"']([^\"']+)[\"']"
)


def inert(p):
    if p.startswith(("docs/", ".claude/", "kb/docs_audit/")):
        return True
    return "/" not in p and p.endswith(".md")


# The scanner must itself be proven to fire (and not over-fire) before its
# empty result can mean anything.
check("scanner: flags a direct read of an inert path",
      READ_CALL.search('fs.readFileSync("docs/kb-notes/foo.md", "utf8")'))
check("scanner: flags a path.join read",
      READ_CALL.search('fs.readFileSync(path.join("docs/catalog/", slug))'))
check("scanner: flags a concatenated prefix read",
      READ_CALL.search('fs.readFileSync("docs/catalog/" + l.slug + ".md")'))
check("scanner: ignores a fixture string that is not a read",
      not READ_CALL.search('source: "docs/kb-notes/reference-ccr.md",'))

workflow_text = open(WORKFLOW, encoding="utf-8").read()
tests_dir = os.path.join(REPO, "tests")
readers = {}
for fname in sorted(os.listdir(tests_dir)):
    if not (fname.endswith(".test.js") or fname == "run.js"):
        continue
    text = open(os.path.join(tests_dir, fname), encoding="utf-8").read()
    hits = [p for p in READ_CALL.findall(text) if inert(p)]
    if hits:
        readers[fname] = hits

check("exactly the known reader reads inert paths today "
      "(if this fails, a test gained or lost a docs/ input — re-measure, "
      "then update the workflow's skip branch AND this line)",
      set(readers) == {"governance_docs_panel.test.js"})
for fname in readers:
    check("workflow skip branch runs " + fname,
          ("node tests/" + fname) in workflow_text)

# ── 3. The wiring, and the forever-block shape ────────────────────────────
# Comments are stripped first: the header WARNING against `paths-ignore`
# must not trip the check that enforces it (same failure class as the
# spelling rule that corrected its own word list — see CLAUDE.md).
yaml_only = "\n".join(
    l for l in workflow_text.splitlines() if not l.lstrip().startswith("#")
)


def job_block(name):
    """The YAML of one top-level job (two-space indent) with comments gone."""
    m = re.search(r"^  %s:\n((?:(?:    .*|\s*)\n)*)" % re.escape(name), yaml_only, re.M)
    return m.group(1) if m else None


check("workflow pipes the diff through the gate script",
      "scripts/js_suite_gate.sh" in workflow_text)
# Since 2026-09-24 the suite is a matrix of shard jobs (one runner each) and
# `test` is the fan-in. The gate's conditional therefore sits on the SHARD
# jobs — the one place an `if:` cannot make the reporting check disappear.
suite = job_block("suite")
check("a `suite` job exists (the sharded jsdom suite)", suite is not None)
check("the shard jobs are conditioned on the gate decision",
      suite is not None and "if: needs.gate.outputs.decision == 'run'" in suite)
check("the shard count is the matrix and nowhere else (strategy.job-total)",
      suite is not None
      and "node tests/run.js --shard ${{ matrix.shard }}/${{ strategy.job-total }}" in suite
      and re.search(r"^\s+shard: \[\d+(?:, \d+)*\]", suite, re.M))
check("every shard reports (fail-fast is off)",
      suite is not None and "fail-fast: false" in suite)
check("skip branch is conditioned on the gate decision",
      "if: needs.gate.outputs.decision == 'skip'" in yaml_only)
# The fan-in is the check the merge doctrine polls (CLAUDE.md: "the `test`
# check must have SUCCEEDED on the current head"). It has to REPORT on every
# run, which a bare `needs` chain does not give: a job whose needs failed or
# were skipped is itself skipped, and a skipped required check blocks the PR
# forever. `!cancelled()` is the one condition allowed on it.
fanin = job_block("test")
check("a job named `test` exists (the check the merge doctrine polls)",
      fanin is not None)
check("`test` needs the gate, the shards and the lints",
      fanin is not None and re.search(r"needs:\s*\[gate, suite, lints\]", fanin))
check("`test` runs on !cancelled(), so it reports when a need failed or was skipped",
      fanin is not None and "if: ${{ !cancelled() }}" in fanin)
check("no other `if:` on the `test` job (a skipped required check never reports)",
      fanin is not None and len(re.findall(r"^\s+if:", fanin, re.M)) == 1)
check("`test` reads every need's result and the gate's decision",
      fanin is not None and all(s in fanin for s in (
          "needs.gate.result", "needs.suite.result", "needs.lints.result",
          "needs.gate.outputs.decision")))
check("no paths-ignore/paths trigger filter (a skipped required check "
      "never reports and blocks the PR forever)",
      "paths-ignore" not in yaml_only
      and not re.search(r"^\s+paths:", yaml_only, re.M))

failed = 0
for name, ok in results:
    print(("PASS " if ok else "FAIL ") + name)
    if not ok:
        failed += 1
print("\n%d/%d passed" % (len(results) - failed, len(results)))
sys.exit(1 if failed else 0)
