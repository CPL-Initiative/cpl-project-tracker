#!/usr/bin/env bash
# Every generated file CI verifies, checked in one command.
#
# ⚠️ WHY THIS EXISTS. `node tests/run.js` covers NONE of these. It passed
# 310/310 locally while the docs catalogs and the dependency map were both
# stale, and three CI cycles this session (S242) were spent finding exactly
# that — each time because a generator was run BEFORE the last edit of the run,
# so what got committed was already behind.
#
# Run it as the LAST thing before a push, not the first.
set -u
cd "$(dirname "$0")/.."
fail=0
run() {
  printf '%-46s ' "$1"
  if out=$(eval "$2" 2>&1); then echo "ok"; else echo "STALE"; echo "$out" | tail -4 | sed 's/^/    /'; fail=1; fi
}
run "docs index + catalogs"   "python3 kb/_build_docs_index.py --check"
run "dependency map"          "python3 kb/_build_dependency_map.py --check"
run "docs corpus lint"        "python3 tests/docs_audit_test.py"
run "docs index builder"      "python3 tests/docs_index_build_test.py"
run "American spelling"       "python3 tests/american_spelling_test.py"
run "dependency map contents" "python3 tests/dependency_map_test.py"
echo
if [ "$fail" -ne 0 ]; then
  echo "Regenerate, re-run this, THEN push:"
  echo "  python3 kb/_build_docs_index.py && python3 kb/_build_dependency_map.py"
  exit 1
fi
echo "All generated files are current."
