#!/usr/bin/env python3
"""The Common Subjects Reference's procedures store (kb/csr_procedures.json, S425).

Sam, 2026-10-19: "We should have a CSR dash card for each key step that needs monitoring and
stores the procedures needed by agents." The tab's Progress view (canonical_subj4.js) draws
one procedure under each of its cards and kb/_build_commons_status.py reads their names for
the Commons row, so what has to stay true is the join and the words:

  - every procedure names a card the view defines (PARTS ids), and every card has one;
  - each carries a name, a kind (routine, rule or check), on, a cadence, an owner, a rule in
    plain words, its steps, what it reads and its source (who, when, the words);
  - the words are plain: no glyph, no markdown, American spelling (the view shows them as text).

Run from the repo root: python3 tests/csr_procedures_test.py
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STORE = os.path.join(ROOT, "kb", "csr_procedures.json")
TAB = os.path.join(ROOT, "canonical_subj4.js")
GLYPH = re.compile("[←-⇿☀-➿⬀-⯿\U0001f300-\U0001faff]")
BRITISH = re.compile(r"\b(colour|behaviour|organisation|analyse|centre|cancelled|catalogue|whilst|amongst|licence|programme|grey)\b", re.I)

fails = []


def check(cond, msg):
    print(("ok   " if cond else "FAIL ") + msg)
    if not cond:
        fails.append(msg)


def part_ids(src):
    m = re.search(r"var PARTS = \[(.*?)\n  \];", src, re.S)
    return re.findall(r'\{ id: "([a-z_]+)", title:', m.group(1)) if m else []


def plain(text, where):
    check(isinstance(text, str) and text.strip() != "", where + " is non-empty text")
    if isinstance(text, str):
        check(not GLYPH.search(text), where + " carries no glyph")
        check("**" not in text and not re.match(r"^\s*[-*]\s", text), where + " carries no markdown")
        check(not BRITISH.search(text), where + " is spelled the American way")


doc = json.load(open(STORE, encoding="utf-8"))
procs = doc.get("procedures")
check(isinstance(procs, list) and len(procs) >= 1, "the store holds a list of procedures")
check(isinstance(doc.get("_about"), str) and "docs/reference/lanes/" in doc["_about"], "the store names its lane file")

src = open(TAB, encoding="utf-8").read()
ids = part_ids(src)
check(len(ids) == 8, "the view defines eight cards (Sam's eight steps, consolidated): %r" % (ids,))
proc_ids = [p.get("id") for p in procs]
check(sorted(proc_ids) == sorted(ids), "one procedure per card, no more and no less: %r vs %r" % (sorted(proc_ids), sorted(ids)))
check(len(set(proc_ids)) == len(proc_ids), "procedure ids are unique")

for p in procs:
    w = "procedures[%s]" % p.get("id")
    plain(p.get("name"), w + ".name")
    check(p.get("kind") in ("routine", "rule", "check"), w + ".kind is routine, rule or check")
    check(isinstance(p.get("on"), bool), w + ".on is true or false")
    plain(p.get("cadence"), w + ".cadence")
    plain(p.get("owner"), w + ".owner")
    plain(p.get("status"), w + ".status")
    plain(p.get("rule"), w + ".rule")
    check(isinstance(p.get("steps"), list) and len(p["steps"]) >= 1, w + ".steps is a non-empty list")
    for i, s in enumerate(p.get("steps") or []):
        plain(s, w + ".steps[%d]" % i)
    check(isinstance(p.get("reads"), list) and len(p["reads"]) >= 1, w + ".reads names what it reads")
    for r in p.get("reads") or []:
        check(os.path.exists(os.path.join(ROOT, r)) or r.startswith("kb/csr_out/"), w + " reads an existing file: " + str(r))
    srcd = p.get("source") or {}
    check(isinstance(srcd, dict) and srcd.get("who") and srcd.get("date") and srcd.get("words"), w + ".source names who, when and the words")
    check(re.match(r"^\d{4}-\d{2}-\d{2}$", str(srcd.get("date") or "")) is not None, w + ".source.date is a date")

# The confirmation procedure is proposed, not on, until Sam rules (a write to a shared table).
conf = [p for p in procs if p.get("id") == "confirmation"]
check(bool(conf) and conf[0].get("on") is False, "the cohort confirm is off until Sam rules it")
# The daily scan is on: the step the daily workflow runs.
wf = open(os.path.join(ROOT, ".github", "workflows", "daily-dashboard.yml"), encoding="utf-8").read()
check("python3 kb/_csr_trail.py --latest" in wf, "the daily workflow runs the scan with --latest")
check("git add kb/csr_out/latest.json" in wf, "the daily workflow commits kb/csr_out/latest.json")
check(wf.index("_csr_trail.py --latest") < wf.index("_build_commons_status.py"), "the scan runs before the Commons status build")

if fails:
    print("\n%d check(s) failed" % len(fails))
    sys.exit(1)
print("\nall checks passed")
