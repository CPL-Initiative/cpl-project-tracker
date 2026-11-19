#!/usr/bin/env bash
# The COBIx watcher (Sam, 2026-11-18 about 1:17 PM PT, relayed by COBIx on #3358: "watch for COBIx comments yourself,
# so Sam doesn't have to relay them"). Every 5 minutes it asks GitHub search for the tracker's issues and pull requests
# that cobi-cto commented on and that changed since the last poll, and prints one line per (number, updated_at) not
# seen before. The session then reads that thread and acts on each new `<!-- cobix -->` comment.
#
# Usage: bash scripts/cobix_watch.sh [STATE_DIR]   (run it in the background; every handoff restarts it)
#   STATE_DIR keeps `seen` and `since`, so a restart resumes where the last poll stopped. Default: this session's
#   scratchpad (/tmp/claude-*/*/<CLAUDE_CODE_SESSION_ID>/scratchpad/cobix-watch), else ${TMPDIR:-/tmp}/cobix-watch.
#   COBIX_WATCH_ONCE=1 polls once and exits (the test); COBIX_WATCH_SINCE seeds `since` on a first run.
#
# The two-search shape is deliberate: in a cloud session `gh` may only run `gh api -X GET search/issues`, so the
# watcher never calls another endpoint. tests/cobix_watch_test.py fails any other gh call.
set -u
REPO="CPL-Initiative/cpl-project-tracker"
S="${1:-}"
if [ -z "$S" ]; then
  pad=""
  if [ -n "${CLAUDE_CODE_SESSION_ID:-}" ]; then
    pad=$(ls -d /tmp/claude-*/*/"$CLAUDE_CODE_SESSION_ID"/scratchpad 2>/dev/null | head -1)
  fi
  S="${pad:-${TMPDIR:-/tmp}}/cobix-watch"
fi
mkdir -p "$S"
touch "$S/seen"
[ -s "$S/since" ] || echo "${COBIX_WATCH_SINCE:-$(date -u -d '-1 hour' +%Y-%m-%dT%H:%M:%SZ)}" > "$S/since"
echo "COBIx-watch: state in $S, since $(cat "$S/since")"
while true; do
  since=$(cat "$S/since")
  now=$(date -u -d '-2 min' +%Y-%m-%dT%H:%M:%SZ)
  for t in issue pull-request; do
    gh api -X GET search/issues -f q="repo:$REPO is:$t commenter:cobi-cto updated:>=$since" \
      --jq '.items[] | "\(.number) \(.updated_at)"' 2>/dev/null || true
  done | sort -u | while read -r n u; do
    [ -z "$n" ] && continue
    grep -qx "$n $u" "$S/seen" && continue
    echo "$n $u" >> "$S/seen"
    echo "COBIx-watch: #$n changed at $u"
  done
  echo "$now" > "$S/since"
  [ "${COBIX_WATCH_ONCE:-0}" = "1" ] && exit 0
  sleep 300
done
