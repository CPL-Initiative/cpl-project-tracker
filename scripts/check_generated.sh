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
#
# It covers every committed kb/status/*.json (S718, Sam 2026-11-24: a PR rebuilt local_subject_titles.json, and
# statewide_subject_codes.json and subject_sources.json, which read it, failed CI's lints job one round each after
# this script said all was current). Each file is named below beside its check, or in NOT_CHECKED of
# tests/check_generated_covers_status_test.py with the reason no check can hold it; that test fails a file in
# neither, so a new status file must pick one.
set -u
cd "$(dirname "$0")/.."
fail=0
run() {
  printf '%-46s ' "$1"
  if out=$(eval "$2" 2>&1); then echo "ok"; else echo "STALE"; echo "$out" | tail -4 | sed 's/^/    /'; fail=1; fi
}
# A report line that never fails the gate. The dependency map is its one user (Sam, 2026-11-18).
report() {
  printf '%-46s ' "$1"
  if eval "$2" >/dev/null 2>&1; then echo "ok"; else echo "$3"; fi
}
# The kb/status checks are the slow ones (mid_readiness ~25s, statewide_subject_codes ~20s, alone), so they start
# here in the background and their lines print last, in this order. Every one is a --check: it writes nothing.
st=$(mktemp -d); trap 'rm -rf "$st"' EXIT
slabels=()
srun() {
  local i=${#slabels[@]}; slabels+=("$1")
  ( eval "$2" >"$st/$i.out" 2>&1; echo $? >"$st/$i.rc" ) &
}
# The subject family, in the daily run's order (scripts/daily_build.sh): each reads the one before it.
srun "status: local_subject_titles.json"          "python3 kb/_build_local_subject_titles.py --check"
srun "status: held_subject_codes.json"            "python3 kb/_held_subject_codes.py --check"
srun "status: noncredit_categories.json"          "python3 kb/_build_noncredit_categories.py --check"
srun "status: noncredit_subject_titles.json"      "python3 kb/_build_noncredit_subject_titles.py --check"
srun "status: local_subject_recommendations.json" "python3 kb/_build_local_subject_recommendations.py --check"
srun "status: mid_readiness.json"                 "python3 kb/_mid_readiness.py --check"
srun "status: outline_hunt.json"                  "python3 kb/_outline_hunt.py --check"
srun "status: statewide_subject_codes.json"       "python3 kb/_statewide_subject_codes.py --check"
srun "status: subject_sources.json"               "python3 kb/_subject_sources.py --check"
srun "status: mq_view.json"                       "python3 kb/_mq_view.py --check"
srun "status: csr_proposed_codes.json"            "python3 kb/_csr_propose_codes.py --check"
# The harvest's committed-file builds.
srun "status: commons_data.json"                  "python3 kb/_build_commons_data_status.py --check --quiet"
srun "status: program_discontinued.json"          "python3 kb/_program_discontinued.py --check"
# The session side of each Progress view, written at checkpoints: course.json, cr.json, exhibit.json,
# subjects.json and program-requirements.json. Hand-kept, so the check is their shape, never their bytes.
srun "status: five checkpoint-written files"      "q() { python3 scripts/queue_status.py --check --project \$1; }; q course && q cr && q exhibit && q subjects && q program-requirements"
run "docs index + catalogs"   "python3 kb/_build_docs_index.py --check"
# The dependency map is a report line, never a failure (Sam, 2026-11-18: "No dependency-map rebuild inside PRs.
# kb/dependency_map.json and docs/reference/dependency_map.md are rebuilt by one job on main after each merge.").
# .github/workflows/dependency-map.yml rebuilds it, with cobi_admin_surface.js, once an hour (S698). A PR
# leaves both map files as main has them; do not run the builder or commit its output.
report "dependency map"       "python3 kb/_build_dependency_map.py --check" \
  "behind this tree (notice only: the main job rebuilds it within the hour; do not commit it)"
run "re-mint blast radius"    "python3 kb/_build_remint_blast_radius.py --check"
run "docs corpus lint"        "python3 tests/docs_audit_test.py"
run "docs index builder"      "python3 tests/docs_index_build_test.py"
run "American spelling"       "python3 tests/american_spelling_test.py"
run "dependency map contents" "python3 tests/dependency_map_test.py"
run "refresh button, no secret" "python3 tests/refresh_button_no_secret_test.py"
# ⚠️ ADDED AFTER THIS SCRIPT ALREADY MISSED ONE. The first version had the two
# generators I happened to have tripped over that day; admin_tab.test.js then
# failed on cobi_admin_surface.js, a THIRD generated file, for the same reason.
# These two are found by their own suites rather than a --check flag, so they
# only surface in a full `node tests/run.js` — which is exactly the run this
# script exists to save you.
# A new COBI tab also stales the UI pass ledger (kb/ui_pass_ledger.json): CI's lints job refuses a
# nav tab it does not list, and this gate missed the Exhibits tab on 2026-10-31 (#2602).
run "UI pass ledger lists every view" "python3 scripts/ui_pass.py --check"
run "COBI admin surface"      "python3 kb/_build_cobi_admin_surface.py --check 2>/dev/null || node tests/admin_tab.test.js >/dev/null"
run "Sierra rule defaults"    "node tests/sierra_rules.test.js >/dev/null 2>&1 || python3 kb/_build_sierra_rule_defaults.py --check"
# The funding FAQ Sierra reads (S518): funding-model/faq.json is built from the FAQ's
# house text in cpl_funding.js, so an edit to the FAQ stales it here.
run "funding FAQ for Sierra"  "node scripts/build_funding_faq.js --check"
# Sierra's statewide catalog (S398) is built from statewide_data.js,
# kb/statewide_exhibit_categories.json and fact_sheet_metrics.json. The daily run
# rebuilds it beside them; an edit to the categories or to the builder stales it here.
run "statewide catalog (Fact Sheet + Sierra)" "python3 fact-sheet/_build_statewide_catalog.py --check"
# The discipline-blank worklist (S243) derives from unified_courses_data.js AND
# the subject map, so a map edit staled it in the same commit that made it.
run "discipline blanks worklist" "python3 kb/_build_discipline_blanks_worklist.py --check"
run "orphan-parent worklist"   "python3 kb/_build_orphan_parent_worklist.py --check"
# College Data Collection's data dictionary (#3310): kb/cdc_data_dictionary.json is hand-kept; the status file and the
# doc are built from it, so an edit to the JSON stales both here (kb/status/cdc_sharing.json, kb/status/cdc_integrations.json).
run "CDC data dictionary"      "python3 kb/_build_cdc_sharing.py --check"
# A stored credential title is resolved at read time through the applied renames (S641): the browser reads
# kb/credential_title_moves.json, which the one resolver writes, so a new rename snapshot stales it here.
run "credential title moves"    "python3 kb/credential_aliases.py --check"
run "slash-to-and title plan"    "python3 kb/slash_titles.py --check"
# The daily spend file's sessions key is read from the handoffs' Spend: lines (S680): a checkpoint that adds one
# stales it here, so the session's dollars land with its handoff instead of waiting a day for the census job.
run "daily spend, sessions"       "python3 kb/_build_spend_daily.py --sessions-only --check"
run "credential title resolver, one copy" "python3 tests/credential_title_resolver_single_source_test.py >/dev/null"
# ⚠️ AND IT MISSED ONE MORE, WHICH SHIPPED (2026-09-18, #1618). prototype/skyview.html
# is assembled by prototype/build_ccr_atlas.py, and step 4d2 of daily-dashboard.yml
# re-runs that build whenever the unified-courses artifacts move. A session edited the
# served page directly; it passed review, merged and deployed, and #1617's rebuild
# stripped it out of main twenty minutes later. The SkyView lane file already told
# people to run THIS script before a push — the page just was not in it.
run "SkyView built page"      "python3 tests/skyview_built_from_source_test.py >/dev/null"
# The public veteran map is built by veteran-sprint-map/build_selfcontained.py (S350
# ported it to First Light); an edit made in the page is lost at the next build.
run "veteran map built page"  "python3 veteran-sprint-map/build_selfcontained.py --check"
# The standing open-asks sheet (Sam, 2026-09-22: "Always give me a decision
# sheet for any outstanding items for me"). This is a COVERAGE check, never a
# byte-equality one: the cards are hand-written, so what has to stay true is
# that every lane carrying a NEEDS-SAM marker is asked about or dismissed by
# name. A lane that gains an ask fails here until somebody puts it on the sheet.
# The builder lives in the private vault since 2026-10-06 (Sam's call 9): find the
# vault beside the tracker (CPLBrain in the cloud, COG-second-brain on Sam's machine).
SHEETS=""
for v in "${CPL_VAULT_ROOT:-}" ../CPLBrain ../COG-second-brain; do
  if [ -n "$v" ] && [ -f "$v/decision-sheets/_build_open_asks_decision_sheet.py" ]; then SHEETS="$v/decision-sheets"; break; fi
done
if [ -n "$SHEETS" ]; then
  run "open-asks sheet coverage" "CPL_TRACKER_ROOT=\"$PWD\" python3 \"$SHEETS/_build_open_asks_decision_sheet.py\" --check >/dev/null"
else
  printf '%-46s %s\n' "open-asks sheet coverage" "NOT RUN: the vault is not beside the tracker (attach CPLBrain, or set CPL_VAULT_ROOT)"
  fail=1
fi
wait
for i in "${!slabels[@]}"; do
  printf '%-46s ' "${slabels[$i]}"
  if [ "$(cat "$st/$i.rc" 2>/dev/null)" = 0 ]; then echo "ok"; else echo "STALE"; tail -4 "$st/$i.out" | sed 's/^/    /'; fail=1; fi
done
echo
if [ "$fail" -ne 0 ]; then
  echo "Regenerate, re-run this, THEN push:"
  echo "  python3 kb/_build_docs_index.py \\"
  echo "    && python3 kb/_build_cobi_admin_surface.py && python3 kb/_build_sierra_rule_defaults.py \\"
  echo "    && python3 fact-sheet/_build_statewide_catalog.py && python3 kb/credential_aliases.py \\"
  echo "    && python3 kb/slash_titles.py && python3 kb/_build_spend_daily.py --sessions-only"
  echo "A STALE status: line names its builder; run the subject family in its order, from the first stale one:"
  echo "  kb/_build_local_subject_titles.py, _held_subject_codes.py, _build_noncredit_subject_titles.py,"
  echo "  _build_local_subject_recommendations.py, _mid_readiness.py, _outline_hunt.py, _statewide_subject_codes.py,"
  echo "  _subject_sources.py, _mq_view.py, _csr_propose_codes.py"
  exit 1
fi
echo "All generated files are current (the dependency map is the main job's to rebuild)."
