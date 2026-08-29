#!/bin/bash
#
# Context-pressure hook — REPO COPY (Session 206, 2026-08-29).
#
# Sibling of scripts/stop-hook-git-check.sh. INSTALL on a new machine / after a
# container reset:
#     cp scripts/context-pressure-hook.sh ~/.claude/context-pressure-hook.sh
#     chmod +x ~/.claude/context-pressure-hook.sh
# and register it as a PostToolUse hook in ~/.claude/settings.json (see
# CLAUDE.md Rule 9a for the exact block).
#
# WHY A HOOK AND NOT A RULE
#   A rule that says "checkpoint before you run out of context" is a rule whose
#   trigger nobody can observe -- which is precisely how we auto-compacted at
#   786,077 tokens on 2026-08-29 with a 150K-stale checkpoint. The measurement
#   exists (kb/_context_budget.py reads the exact counter Claude Code writes to
#   the transcript), but a measurement nothing calls is the same as no
#   measurement. PostToolUse fires on EVERY tool call, so this catches a long
#   agentic run that blows through both thresholds without a single human turn
#   -- the actual failure mode. UserPromptSubmit would have missed it.
#
# ANNOUNCE-ONCE
#   Each threshold is announced once per session, tracked in a state file keyed
#   by session id. Escalation warn -> emergency still speaks; a repeat of the
#   same level stays quiet. Without this it would shout on every tool call and
#   get tuned out, which is its own kind of not-firing.
#
# FAIL SOFT, ALWAYS
#   Every failure path exits 0. A broken meter must never block a session.

set -uo pipefail

input=$(cat)

# jq is used by the sibling stop hook, so it is a fair dependency -- but never
# hard-fail on its absence.
command -v jq >/dev/null 2>&1 || exit 0
command -v python3 >/dev/null 2>&1 || exit 0

transcript=$(printf '%s' "$input" | jq -r '.transcript_path // empty' 2>/dev/null)
session=$(printf '%s' "$input" | jq -r '.session_id // "unknown"' 2>/dev/null)
hook_cwd=$(printf '%s' "$input" | jq -r '.cwd // empty' 2>/dev/null)

# Locate the meter. The hook runs from ~/.claude/, so it cannot use a relative
# path; probe the places the repo is actually checked out.
meter=""
for root in "${CLAUDE_PROJECT_DIR:-}" "$hook_cwd" \
            "/home/user/cpl-project-tracker" \
            "$HOME/Documents/GitHub/cpl-project-tracker"; do
  [[ -n "$root" && -f "$root/kb/_context_budget.py" ]] && { meter="$root/kb/_context_budget.py"; break; }
done
[[ -z "$meter" ]] && exit 0

if [[ -n "$transcript" ]]; then
  report=$(python3 "$meter" --transcript "$transcript" 2>/dev/null)
else
  report=$(python3 "$meter" 2>/dev/null)
fi
code=$?

# 0 = ok, 1 = unmeasurable, 3 = warn, 4 = emergency
case "$code" in
  3) level="warn" ;;
  4) level="emergency" ;;
  *) exit 0 ;;
esac

state="$HOME/.claude/.context-pressure.${session}"
prev=$(cat "$state" 2>/dev/null || echo "")
[[ "$prev" = "$level" || ( "$prev" = "emergency" && "$level" = "warn" ) ]] && exit 0
mkdir -p "$HOME/.claude" 2>/dev/null
printf '%s' "$level" > "$state" 2>/dev/null

if [[ "$level" = "emergency" ]]; then
  cat >&2 <<MSG
${report}

EMERGENCY CHECKPOINT — do this now, before the next substantive tool call.
There is room for roughly ONE checkpoint and nothing else, and a single heavy
turn has been measured at 50,425 tokens, so "one more thing first" can cost the
whole margin.

Write ONLY these four, then commit and push:
  1. docs/session_<N+1>_handoff.md  — the artifact that makes this session
     recoverable at all. Say in it, explicitly, that this was an EMERGENCY
     checkpoint and list which of the 13 Rule 9 artifacts were NOT refreshed.
  2. docs/reference/lanes/<lane>.md — only the lanes this run actually moved.
  3. cpl_memory rows for this run's durable, uncaptured learnings.
  4. git commit + push.

Everything else in the Rule 9 list (INDEX rebuild, To-Do feed, pipeline tab,
kb/README, root README, lessons doc, KB notes, vault note) is DEFERRED to the
next session -- which is why the handoff has to name them.

Tell Sam you are doing this and why. Do not ask permission first; a compaction
mid-question loses the answer.
MSG
else
  cat >&2 <<MSG
${report}

Runway is down to about one heavy turn plus one checkpoint. Finish the thought
you are on, then run
/checkpoint -- a full one, while it still fits. Tell Sam the number rather than
checkpointing silently; he may want to redirect the remaining runway.

At one checkpoint of runway this escalates to EMERGENCY and the full list no
longer fits.
MSG
fi
exit 2
