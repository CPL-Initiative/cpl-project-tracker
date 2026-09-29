#!/bin/sh
# Decide whether the full jsdom suite (`npm test`, ~8.5 min) must run for a
# changed-file list, one path per line on stdin. Prints "run" or "skip".
# Caller: the gate step in .github/workflows/js-tests.yml (E — Sam's
# required-but-conditional-fast ruling, 2026-08-29).
#
# This is a SKIP-LIST, not a run-list. Measured 2026-08-30: the suite reads
# .js, .html, .json, .css, .sql, .ts and more, so any "run when JS changes"
# whitelist under-triggers silently — the worst failure a required check can
# have. Instead, skip ONLY when every changed file is provably inert:
#
#   docs/**           kb-notes, lane files, handoffs, lessons, catalog
#   .claude/**        commands, skills
#   kb/docs_audit/**  the lint's dated output
#   *.md at repo root CLAUDE.md, README.md
#
# Anything else — including anything unrecognized — runs the suite.
# ⚠️ docs/catalog/** is deliberately inert even though one test reads it;
# the workflow runs that test file in the skip branch. The boundary on both
# sides is pinned by tests/js_suite_gate_test.py — change one, run the other.
decision=skip
saw_any=false
while IFS= read -r f; do
  [ -z "$f" ] && continue
  saw_any=true
  case "$f" in
    docs/*|.claude/*|kb/docs_audit/*) ;;
    */*) decision=run ;;
    *.md) ;;
    *) decision=run ;;
  esac
done
# An empty list means the diff could not be measured — fail safe, run.
[ "$saw_any" = true ] || decision=run
echo "$decision"
