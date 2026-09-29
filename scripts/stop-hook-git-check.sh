#!/bin/bash
#
# Stop-hook git check — REPO COPY (Session 32, 2026-06-04).
#
# This is the durable, reviewable copy of Claude Code's Stop hook. Sam's machine
# runs a copy at ~/.claude/stop-hook-git-check.sh. INSTALL on a new machine /
# after a container reset:
#     cp scripts/stop-hook-git-check.sh ~/.claude/stop-hook-git-check.sh
#     chmod +x ~/.claude/stop-hook-git-check.sh
#
# WHY THIS COPY EXISTS — squash-merge-then-reset false-positive fixes:
#   Both fixes below target the SAME root cause: after a squash-merge +
#   `git reset --hard origin/main`, local HEAD is main's tip (a GitHub squash
#   commit) while the feature-branch ref is stale, so HEAD-vs-stale-upstream
#   comparisons misfire. Fix 1 (the primary one) bails early when HEAD is already
#   an ancestor of origin/main — killing BOTH the "Unverified" and the "N unpushed
#   commit(s)" false-positives. Fix 2 (defense-in-depth) is the awk note below.
#   The previous version flagged EVERY commit on HEAD whose committer email
#   wasn't noreply@anthropic.com. After a squash-merge + `git reset --hard
#   origin/main` (the standard session-branch-reuse flow), local HEAD becomes
#   *GitHub's own squash-merge commit* — committer `noreply@github.com` — which
#   the hook flagged on every Stop, even though (a) GitHub signs those as
#   Verified and (b) they CANNOT be amended without force-pushing main (Rule 5).
#   It fired 4× in one session. The one-line fix: skip commits committed by
#   `noreply@github.com` (GitHub's merge/squash bot is never a Claude local
#   commit, so this never hides a real problem). See CLAUDE.md "Engineering &
#   UI practices" + docs/kb-notes/playbook-cer-credential-merge.md sibling notes.

# Read the JSON input from stdin
input=$(cat)

# Check if stop hook is already active (recursion prevention)
stop_hook_active=$(echo "$input" | jq -r '.stop_hook_active')
if [[ "$stop_hook_active" = "true" ]]; then
  exit 0
fi

# Check if we're in a git repository - bail if not
if ! git rev-parse --git-dir >/dev/null 2>&1; then
  exit 0
fi

# Bail if there's no remote to push to.
if [[ -z "$(git remote)" ]]; then
  exit 0
fi

# Check for uncommitted changes (both staged and unstaged)
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "There are uncommitted changes in the repository. Please commit and push these changes to the remote branch." >&2
  exit 2
fi

# Check for untracked files that might be important
untracked_files=$(git ls-files --others --exclude-standard)
if [[ -n "$untracked_files" ]]; then
  echo "There are untracked files in the repository. Please commit and push these changes to the remote branch." >&2
  exit 2
fi

current_branch=$(git branch --show-current)
if [[ -n "$current_branch" ]]; then
  # If HEAD is already merged into origin/main, the work is on the remote and the
  # feature-branch ref is merely stale — this is the session-branch-reuse flow
  # (squash-merge, then `git reset --hard origin/main`), which leaves HEAD AT
  # main's tip: a GitHub squash commit that is already pushed and must NOT be
  # amended or force-pushed (Rule 5). Skip the unverified + unpushed checks below
  # (they otherwise false-positive every single cycle — first as "Unverified
  # noreply@github.com", then as "1 unpushed commit"). The uncommitted/untracked
  # checks above already ran, so genuine in-flight work is still caught.
  if git rev-parse --verify -q origin/main >/dev/null 2>&1 \
     && git merge-base --is-ancestor HEAD origin/main 2>/dev/null; then
    exit 0
  fi

  if git rev-parse "origin/$current_branch" >/dev/null 2>&1; then
    upstream="origin/$current_branch"
  else
    upstream="origin/HEAD"
  fi

  # Check for local commits that GitHub will show as "Unverified": either no
  # signature at all (%G? == N), or signed with a committer email other than
  # noreply@anthropic.com. EXCLUDE commits committed by noreply@github.com —
  # those are GitHub's own merge/squash commits (Verified by GitHub, and never
  # a Claude local commit), which the session-branch-reuse flow leaves at HEAD.
  # ALSO EXCLUDE github-actions[bot]@users.noreply.github.com — the daily
  # dashboard cron pushes to main 3x/day (06:17/09:17/12:17 UTC), so any session
  # that merges or rebases main picks up a cron commit it did not author and can
  # never amend (it is on main — Rule 5). Without this the hook demands an
  # `--amend --reset-author` on the CRON's commit, which would rewrite main.
  # (The HEAD-is-ancestor-of-main early-exit above already covers the common
  # reset-to-main case; this covers the case where the session has local commits
  # sitting ON TOP of a cron commit, where that early-exit does not fire.)
  if [[ "$(git config --type=bool commit.gpgsign 2>/dev/null)" == "true" ]]; then
    unverifiable=$(git log --format='%h %G? %ce' "$upstream..HEAD" 2>/dev/null | awk '$3 != "noreply@github.com" && $3 != "github-actions[bot]@users.noreply.github.com" && ($2 == "N" || $3 != "noreply@anthropic.com")')
    if [[ -n "$unverifiable" ]]; then
      echo "There are commit(s) on branch '$current_branch' that GitHub will show as Unverified (missing signature, or committer email is not noreply@anthropic.com):" >&2
      echo "$unverifiable" >&2
      echo "Please run 'git config user.email noreply@anthropic.com && git config user.name Claude', then 'git commit --amend --no-edit --reset-author' for the tip commit, or 'git rebase --exec \"git commit --amend --no-edit --reset-author\" $upstream' for earlier commits, then push." >&2
      exit 2
    fi
  fi

  # cpl-patch: unpushed = commits on NO remote ref (see scripts/patch_stop_hook.py)
  unpushed=$(git rev-list HEAD --not --remotes --count 2>/dev/null) || unpushed=0
  if [[ "$unpushed" -gt 0 ]]; then
    if [[ "$upstream" == "origin/$current_branch" ]]; then
      echo "There are $unpushed unpushed commit(s) on branch '$current_branch'. Please push these changes to the remote repository." >&2
    else
      echo "Branch '$current_branch' has $unpushed unpushed commit(s) and no remote branch. Please push these changes to the remote repository." >&2
    fi
    exit 2
  fi
fi

exit 0
