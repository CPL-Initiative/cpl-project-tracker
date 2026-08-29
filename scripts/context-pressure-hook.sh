#!/bin/bash
#
# Context-pressure hook — macOS/Linux wrapper (Session 206, 2026-08-29).
#
# All the behavior lives in kb/_context_budget.py --hook: the measurement, the
# announce-once state, the warning text, and the fail-soft guarantee. This file
# only finds the repo and pipes stdin through.
#
# WHY IT IS ONLY A WRAPPER
#   The first version did the work here, in bash, with jq. That is fine on this
#   container and wrong everywhere Sam actually runs: Windows has no jq and only
#   Git-Bash. Worse, a hook that cannot parse its input fails silently, which is
#   indistinguishable from a quiet session -- the exact failure this tool exists
#   to prevent, reintroduced by its own installer. Python is already required by
#   this repo and is cross-platform, so Windows can skip this file entirely and
#   point the hook straight at the module (see CLAUDE.md Rule 9a).
#
# INSTALL (macOS/Linux):
#     cp scripts/context-pressure-hook.sh ~/.claude/context-pressure-hook.sh
#     chmod +x ~/.claude/context-pressure-hook.sh
# then register it as a PostToolUse hook in ~/.claude/settings.json.
# Windows: use scripts/install-context-hook.ps1 instead.

set -uo pipefail

input=$(cat)
command -v python3 >/dev/null 2>&1 || exit 0

# The hook runs from ~/.claude/, so it cannot use a relative path. CLAUDE_PROJECT_DIR
# is set by Claude Code; the rest are the places this repo is actually checked out.
meter=""
for root in "${CLAUDE_PROJECT_DIR:-}" \
            "/home/user/cpl-project-tracker" \
            "$HOME/Documents/GitHub/cpl-project-tracker" \
            "$HOME/Documents/GitHub/COG-second-brain/cpl-project-tracker"; do
  [[ -n "$root" && -f "$root/kb/_context_budget.py" ]] && { meter="$root/kb/_context_budget.py"; break; }
done
[[ -z "$meter" ]] && exit 0

printf '%s' "$input" | python3 "$meter" --hook
