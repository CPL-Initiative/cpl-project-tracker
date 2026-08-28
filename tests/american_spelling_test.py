#!/usr/bin/env python3
"""Unit tests for the American-spelling lint and its fixer.

Sam, 2026-08-21: *"As a Yank, I prefer American, of course."* The lint
(`american_spelling` in kb/_docs_audit.py) reports the drift; the fixer
(kb/_fix_american_spelling.py) applies it. The defects worth guarding are all
the same species — a substitution that lands somewhere it must not, and a lint
that reports work nobody can do:

  1. A markdown corpus is full of things that are NAMES, not spellings: `grey`
     is a CSS keyword, five KB notes carry a British form in their own FILENAME,
     and a replacement inside `](...)` or `[[...]]` silently breaks navigation.
  2. Sam, 2026-08-28: *"No need to fix any spellings we import...like COCI
     catalog or MAP Custom Reports data."* Quoted spans are someone else's text.
     One of the three hits this rule caught was Sam himself, quoted verbatim.
  3. The lint and the fixer must share ONE definition of prose. When the lint
     scanned raw text it reported 25 findings the fixer deliberately refuses to
     touch — the muted-guard failure in
     docs/kb-notes/methodology-a-guard-that-fails-on-truth-gets-muted.md.

Run: python3 tests/american_spelling_test.py   (exit 0 = all pass)
"""
import importlib.util
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _load(name, relpath):
    spec = importlib.util.spec_from_file_location(name, os.path.join(ROOT, relpath))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


da = _load("_docs_audit", "kb/_docs_audit.py")
fx = _load("_fix_american_spelling", "kb/_fix_american_spelling.py")

results = []


def check(name, cond):
    results.append((name, bool(cond)))


def lint(text):
    """Run the rule the way main() does, on a synthetic doc."""
    return da.rule_american_spelling({"text": text})


# ── prose_only masks what must never be edited ────────────────────────────
CASES = [
    ("inline code", "use `normalise()` here"),
    ("fenced code", "```\nnormalise()\n```"),
    ("link target", "see [the note](methodology-normalise-a-join.md)"),
    ("wikilink", 'related: "[[docs/kb-notes/methodology-normalise-a-join]]"'),
    ("bare .md filename", "see methodology-normalise-a-join.md for this"),
    ("quoted span", 'Sam said "use your best judgement here"'),
    ("smart-quoted span", "Sam said “use your best judgement here”"),
    ("bare URL", "https://example.test/normalise/x"),
]
for name, text in CASES:
    check(f"mask: {name} is not prose", lint(text) is None)

check("mask: real prose IS scanned", lint("we normalise the behaviour here") is not None)
check("mask: prose beside code is still scanned",
      lint("`grey` is fine but we normalise here") is not None)

# ── the lint reports what it finds ────────────────────────────────────────
f = lint("colour, behaviour and judgement all drift")
check("lint: reports every distinct form", f and f["detail"]["total"] == 3)
check("lint: names the American preference",
      f and "colour→color" in f["message"])
check("lint: `analyses` (correct American plural) is not flagged",
      lint("the analyses and the analyst agree") is None)
check("lint: `analyse` (British verb) IS flagged",
      lint("we analyse the rows") is not None)

# ── the fixer ─────────────────────────────────────────────────────────────
out, n = fx.fix("we normalise the behaviour")
check("fix: rewrites prose", out == "we normalize the behavior" and n == 2)

check("fix: preserves lower case", fx.fix("behaviour")[0] == "behavior")
check("fix: preserves Title case", fx.fix("Behaviour")[0] == "Behavior")
check("fix: preserves UPPER case", fx.fix("BEHAVIOUR")[0] == "BEHAVIOR")

for name, text in CASES:
    check(f"fix: leaves {name} untouched", fx.fix(text)[0] == text)

check("fix: is idempotent", fx.fix(fx.fix("we normalise")[0])[0] == "we normalize")

# ── the invariant: lint and fixer can never disagree ──────────────────────
# Anything the lint reports must be something the fixer will actually change,
# and vice versa. Both read prose_only(), so this holds by construction — the
# test is what keeps a future edit from forking them again.
probe = ("we normalise the behaviour, `normalise` stays, "
         '"judgement" stays, [x](a-colour.md) stays')
lf = lint(probe)
_fixed, fn = fx.fix(probe)
check("invariant: lint count equals fixer count", lf and lf["detail"]["total"] == fn)
check("invariant: both agree there are exactly 2", fn == 2)
# Asserted on SOURCE, not identity: importlib gives this test its own module
# objects, so `fx.prose_only is da.prose_only` can never hold here even when the
# import is correct. What actually needs guarding is that the fixer keeps
# importing the mask instead of growing a second copy.
_fx_src = open(os.path.join(ROOT, "kb", "_fix_american_spelling.py"),
               encoding="utf-8").read()
check("invariant: the fixer imports prose_only from the auditor",
      re.search(r"from _docs_audit import \([^)]*prose_only", _fx_src, re.S))
check("invariant: the fixer defines no second mask",
      not re.search(r"^def (mask|prose_only)\(", _fx_src, re.M))

# ── the committed corpus is swept ─────────────────────────────────────────
# One file is left: docs/cpl_funding_lessons_archive.md belongs to a concurrent
# session's lane. Any OTHER file appearing here means the sweep regressed.
findings = []
for path in da.collect(ROOT):
    r = da.rel(path)
    if da.rule_american_spelling({"text": open(path, encoding="utf-8").read()}):
        findings.append(r)
check(f"corpus: only the concurrently-owned funding doc remains ({findings})",
      set(findings) <= {"docs/cpl_funding_handoff.md",
                        "docs/cpl_funding_lessons.md",
                        "docs/cpl_funding_lessons_archive.md"})

# ── summary ───────────────────────────────────────────────────────────────
failed = [n for n, ok in results if not ok]
for n, ok in results:
    print(("  ok   " if ok else "  FAIL ") + n)
print(f"\n{len(results) - len(failed)}/{len(results)} passed")
sys.exit(1 if failed else 0)
