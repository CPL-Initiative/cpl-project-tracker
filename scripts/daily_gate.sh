#!/usr/bin/env bash
# The daily dashboard's stand-down check (S527, Sam, 2026-10-30), called twice by daily-dashboard.yml:
# by the `gate` job, before the run waits in the daily-dashboard group, and again by update-dashboard's
# first step once it holds the group (S641, #3147 review). A rung that passed the gate while another run
# was still building waits in the group, so it must look again once that build has finished.
#
# A scheduled run stands down when the day (UTC) already has a successful run. A dispatch always runs.
# If the lookup itself fails, the run goes ahead. Writes run=true or run=false to $GITHUB_OUTPUT.
# Reads EVENT (github.event_name), GITHUB_REPOSITORY and GH_TOKEN.
set -uo pipefail
out="${GITHUB_OUTPUT:-/dev/stdout}"
if [ "${EVENT:-}" != "schedule" ]; then echo "run=true" >> "$out"; exit 0; fi
today=$(date -u +%F)
n=$(gh run list -R "$GITHUB_REPOSITORY" --workflow daily-dashboard.yml --status success \
      --created ">=$today" --limit 20 --json databaseId -q 'length' 2>/dev/null || echo "")
if [ -n "$n" ] && [ "$n" -gt 0 ]; then
  echo "A successful run already exists for $today ($n): this scheduled run stands down."
  echo "run=false" >> "$out"
else
  echo "run=true" >> "$out"
fi
