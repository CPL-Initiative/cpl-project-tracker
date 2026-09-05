#!/usr/bin/env python3
"""Patch the harness-provisioned Stop hook so it stops crying wolf.

THE NAG. Every remote session ends turns with:

    [~/.claude/stop-hook-git-check.sh]: There are 1 unpushed commit(s) on
    branch 'claude/<slug>'. Please push these changes to the remote repository.

on a branch that is level with `origin/main` and holds nothing of ours.
Measured 2026-09-04 on `claude/teleport-k4v8f3`:

    refs/remotes/origin/claude/teleport-k4v8f3 -> 92c60ee   (LOCAL ref, exists)
    git ls-remote --heads origin claude/teleport-k4v8f3     (nothing — never pushed)

    git rev-list origin/claude/teleport-k4v8f3..HEAD --count  = 1   <- what the hook asks
    git rev-list HEAD --not --remotes --count                 = 0   <- the truth

THE MECHANISM. The environment manager creates a LOCAL remote-tracking ref for
the session branch, pinned at the session's starting commit, for a branch that
has never existed on GitHub. The hook tests `git rev-parse "origin/$branch"`,
which resolves that local ref, so it believes there is a published upstream
frozen at session start. Anything that lands on the branch afterwards counts as
unpushed — including a fast-forward onto already-published `main`.

THE FIX. The hook ALREADY uses the right predicate for its signature check —
`git rev-list HEAD --not --remotes`, "commits that are on no remote ref". Only
its unpushed check still uses `$upstream..HEAD`. This makes the two agree. The
predicate is strictly more correct, and it subsumes all three known variants:

  · upstream never existed (this one — branch never pushed)
  · upstream stale after a squash-merge + auto-deleted head branch (Session 128)
  · upstream stale after `git reset --hard origin/main` (Session 32)

It never hides real work: a genuine local commit is on no remote ref, so it
still counts. See tests/stop_hook_git_check_test.py, which pins both directions.

⚠️ WHY A PATCHER AND NOT A FILE WE INSTALL. `scripts/stop-hook-git-check.sh` is
this repo's own copy of the hook, and CLAUDE.md has said "install it to
~/.claude/" since Session 32. That works on a local machine and has NEVER worked
in a remote session: the harness provisions its own `~/.claude/stop-hook-git-check.sh`
(with `session-start-git-identity.sh`, `stop-hook-reply-gate.py`,
`user-prompt-submit-reply-reminder.py` and `launcher-settings.json` — all five
share one mtime to the microsecond), so the repo copy is overwritten and the
Session-32 guard it carries has never once run in the cloud. Copying our file
over theirs would also DISCARD their improvements, which are real: SSH-signature
detection (`%G?` reports `N` for correctly SSH-signed CCR commits, so our copy's
check is simply wrong under CCR), `--not --remotes` scoping on the signature
check, and the non-linear-history rebase advice.

So: patch the installed file in place, whatever version it is, changing one
line. Fail safe in every direction — if the file is absent, already patched, or
does not contain the exact line we know how to fix, do nothing and say so. A
hook that nags is annoying; a hook we corrupt is a broken session.

Usage:  python3 scripts/patch_stop_hook.py [path-to-hook] [--check]
        --check reports what it would do and writes nothing (exit 0 always).
"""

import os
import shutil
import stat
import sys
import tempfile

MARKER = "# cpl-patch: unpushed = commits on NO remote ref (see scripts/patch_stop_hook.py)"

# The exact line carried by every version of the hook seen so far — this repo's
# copy and the harness's. Matched as a FIXED STRING, never a regex: it contains
# `$`, `"`, `(` and `|`, and a regex over those is how a patcher corrupts a file.
TARGET = '  unpushed=$(git rev-list "$upstream..HEAD" --count 2>/dev/null) || unpushed=0'

REPLACEMENT = (
    "  " + MARKER + "\n"
    "  unpushed=$(git rev-list HEAD --not --remotes --count 2>/dev/null) || unpushed=0"
)


def default_hook_path():
    return os.path.join(os.path.expanduser("~"), ".claude", "stop-hook-git-check.sh")


def patch_text(text):
    """Return (new_text, status). Pure — no I/O, so the test can drive it directly.

    status is one of: 'patched', 'already', 'no-target'.
    """
    if MARKER in text:
        return text, "already"
    if TARGET not in text:
        return text, "no-target"
    # Fixed-string replace, and only the first occurrence: the line appears once,
    # and replacing every occurrence would be a silent surprise if it ever didn't.
    return text.replace(TARGET, REPLACEMENT, 1), "patched"


def main(argv):
    args = [a for a in argv[1:] if a != "--check"]
    check_only = "--check" in argv[1:]
    path = args[0] if args else default_hook_path()

    if not os.path.isfile(path):
        # Not an error: a local checkout with no Claude Code hook installed, or a
        # CI runner. Nothing to fix, nothing to say.
        return 0

    try:
        with open(path, "r", encoding="utf-8") as fh:
            text = fh.read()
    except OSError as exc:
        print("patch_stop_hook: cannot read %s (%s) — leaving it alone" % (path, exc),
              file=sys.stderr)
        return 0

    new_text, status = patch_text(text)

    if status == "already":
        return 0
    if status == "no-target":
        # The hook changed shape upstream. Do NOT guess — a wrong edit here breaks
        # every Stop in the session. Say it once so the next session knows the
        # patch needs re-deriving rather than silently wondering why the nag is back.
        print(
            "patch_stop_hook: %s does not contain the line this patch knows how to "
            "fix; leaving it untouched. If the unpushed-commit false positive is "
            "back, re-derive TARGET in scripts/patch_stop_hook.py." % path,
            file=sys.stderr,
        )
        return 0

    if check_only:
        print("patch_stop_hook: would patch %s" % path, file=sys.stderr)
        return 0

    # Write atomically and preserve the exec bit: a half-written or non-executable
    # hook fails every Stop.
    directory = os.path.dirname(path) or "."
    try:
        fd, tmp = tempfile.mkstemp(dir=directory, prefix=".stop-hook-patch-")
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as fh:
                fh.write(new_text)
            shutil.copymode(path, tmp)
            mode = os.stat(tmp).st_mode
            os.chmod(tmp, mode | stat.S_IXUSR)
            os.replace(tmp, path)
        except BaseException:
            if os.path.exists(tmp):
                os.unlink(tmp)
            raise
    except OSError as exc:
        print("patch_stop_hook: cannot write %s (%s) — leaving it alone" % (path, exc),
              file=sys.stderr)
        return 0

    print("patch_stop_hook: patched %s (unpushed check now uses HEAD --not --remotes)"
          % path, file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
