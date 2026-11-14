# Source this at the top of a `run: |` step that runs several tests, one command per line, and call
# `test_group_end` as the step's last line (S653b, 2026-11-14; COBIx on #3332, finding 3).
#
# A step runs under the runner's `bash -e`, so without this the first red test ends the step and hides every test
# after it. Here each command runs whatever the one before it did; a command that exits nonzero is recorded, and
# `test_group_end` names every one of them and exits 1. tests/every_test_runs_test.py fails a pull-request step
# that names two or more tests without both lines.
#
#   run: |
#     source scripts/test_group.sh
#     python3 tests/a_test.py
#     python3 tests/b_test.py
#     test_group_end
set +e
TEST_GROUP_FAILED=()
trap 'TEST_GROUP_FAILED+=("$BASH_COMMAND")' ERR

test_group_end() {
  trap - ERR
  if [ "${#TEST_GROUP_FAILED[@]}" -gt 0 ]; then
    for c in "${TEST_GROUP_FAILED[@]}"; do
      echo "::error::red in this group: $c"
    done
    echo "${#TEST_GROUP_FAILED[@]} command(s) in this group failed"
    exit 1
  fi
  echo "every command in this group passed"
}
