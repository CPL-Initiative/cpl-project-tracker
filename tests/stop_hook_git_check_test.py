#!/usr/bin/env python3
"""Guard the Stop hook's unpushed check — both directions.

The failure this pins is a hook that CRIES WOLF: it nagged "There are 1 unpushed
commit(s)" at the end of nearly every remote session, on branches holding nothing
of ours, until sessions learned to ignore it. A hook people ignore is worse than
no hook, because the one time it is right, nobody looks.

So both directions matter and both are tested:

  QUIET  — the session-branch shape the environment manager actually creates:
           a LOCAL refs/remotes/origin/<branch> pinned at the session's starting
           commit, for a branch that has never existed on the remote, with HEAD
           fast-forwarded onto already-published main. Nothing is unpushed.

  LOUD   — the same shape plus one real local commit. That commit is on no
           remote ref, so the hook must still fire. A fix that silences the
           false positive by silencing the check would pass the first test and
           fail this one.

Pure stdlib, no network. Wired as its own step in .github/workflows/js-tests.yml
because `npm test` discovers only *.test.js — a guard nothing executes is not a
guard (the same reason the merge-chain and docs-corpus lints are wired there).
"""

import os
import shutil
import subprocess
import sys
import tempfile

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(REPO, "scripts"))

import patch_stop_hook  # noqa: E402

HOOK = os.path.join(REPO, "scripts", "stop-hook-git-check.sh")

failures = []


def check(label, condition, detail=""):
    if condition:
        print("  ok   %s" % label)
    else:
        print("  FAIL %s %s" % (label, detail))
        failures.append(label)


def git(cwd, *args):
    return subprocess.run(
        ["git"] + list(args), cwd=cwd, check=True,
        stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True,
    ).stdout.strip()


def run_hook(cwd, hook_path):
    """Run the hook the way Claude Code does: JSON on stdin. Returns (rc, stderr)."""
    proc = subprocess.run(
        ["bash", hook_path], cwd=cwd, input='{"stop_hook_active": false}',
        stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True,
    )
    return proc.returncode, proc.stderr.strip()


def build_session_repo(root, with_local_commit):
    """Reproduce the env-manager session-branch shape, measured 2026-09-04.

    remote (bare)          main -> B
    clone   refs/remotes/origin/main            -> B
            refs/remotes/origin/claude/<slug>   -> A   (synthetic: never pushed)
            HEAD on claude/<slug>               -> B   (fast-forwarded onto main)
    """
    remote = os.path.join(root, "remote.git")
    work = os.path.join(root, "work")
    os.makedirs(remote)
    git(root, "init", "--bare", "-b", "main", remote)

    os.makedirs(work)
    git(work, "init", "-b", "main")
    git(work, "config", "user.email", "test@example.com")
    git(work, "config", "user.name", "Test")
    git(work, "remote", "add", "origin", remote)

    with open(os.path.join(work, "a.txt"), "w") as fh:
        fh.write("a\n")
    git(work, "add", "a.txt")
    git(work, "commit", "-m", "A")
    base = git(work, "rev-parse", "HEAD")
    git(work, "push", "-q", "origin", "main")

    with open(os.path.join(work, "b.txt"), "w") as fh:
        fh.write("b\n")
    git(work, "add", "b.txt")
    git(work, "commit", "-m", "B")
    git(work, "push", "-q", "origin", "main")

    branch = "claude/session-xyz123"
    git(work, "checkout", "-q", "-b", branch)
    # The synthetic remote-tracking ref: pinned at the session's STARTING commit,
    # for a branch the remote has never heard of. This one line is the whole bug.
    git(work, "update-ref", "refs/remotes/origin/" + branch, base)

    if with_local_commit:
        with open(os.path.join(work, "c.txt"), "w") as fh:
            fh.write("c\n")
        git(work, "add", "c.txt")
        git(work, "commit", "-m", "C — real local work, on no remote ref")

    return work, branch


def main():
    print("stop-hook unpushed check")

    # --- the pure transform -------------------------------------------------
    vendor_shaped = (
        "#!/bin/bash\n"
        "current_branch=$(git branch --show-current)\n"
        + patch_stop_hook.TARGET + "\n"
        'if [[ "$unpushed" -gt 0 ]]; then exit 2; fi\n'
    )
    patched, status = patch_stop_hook.patch_text(vendor_shaped)
    check("patches a vendor-shaped hook", status == "patched", status)
    check("patched text uses --not --remotes",
          "git rev-list HEAD --not --remotes --count" in patched)
    check("patched text drops the stale-upstream range",
          patch_stop_hook.TARGET not in patched)

    again, status2 = patch_stop_hook.patch_text(patched)
    check("second pass is a no-op (idempotent)", status2 == "already" and again == patched,
          status2)

    _, status3 = patch_stop_hook.patch_text("#!/bin/bash\necho nothing to patch\n")
    check("unknown hook shape is left alone", status3 == "no-target", status3)

    # --- the repo copy must already carry the fix ---------------------------
    with open(HOOK, "r", encoding="utf-8") as fh:
        hook_text = fh.read()
    check("scripts/stop-hook-git-check.sh carries the marker",
          patch_stop_hook.MARKER in hook_text)
    check("scripts/stop-hook-git-check.sh has no stale-upstream range left",
          patch_stop_hook.TARGET not in hook_text)

    # --- end to end, both directions ----------------------------------------
    #
    # ⚠️ TESTED AGAINST A VENDOR-SHAPED HOOK, NOT scripts/stop-hook-git-check.sh,
    # and that distinction IS the finding. The repo copy carries the Session-32
    # early-exit ("HEAD is an ancestor of origin/main -> exit 0"), which already
    # masks this case: run the UNFIXED repo copy on the QUIET fixture and it
    # exits 0 anyway, so an end-to-end test against it would pass with or
    # without the fix and guard nothing. Verified by perturbation, 2026-09-04.
    #
    # The copy that actually runs in a remote session is the harness's
    # ~/.claude/stop-hook-git-check.sh, which has NO such guard — that is why
    # the nag survived a fix written in June. VENDOR_UNPUSHED_BLOCK mirrors its
    # branch/upstream/unpushed logic verbatim; the patcher is what must fix it.
    VENDOR_UNPUSHED_BLOCK = (
        "#!/bin/bash\n"
        "input=$(cat)\n"
        'current_branch=$(git branch --show-current)\n'
        'if [[ -n "$current_branch" ]]; then\n'
        '  if git rev-parse "origin/$current_branch" >/dev/null 2>&1; then\n'
        '    upstream="origin/$current_branch"\n'
        "  else\n"
        '    upstream="origin/HEAD"\n'
        "  fi\n"
        + patch_stop_hook.TARGET + "\n"
        '  if [[ "$unpushed" -gt 0 ]]; then\n'
        '    echo "There are $unpushed unpushed commit(s) on branch '
        "'$current_branch'.\" >&2\n"
        "    exit 2\n"
        "  fi\n"
        "fi\n"
        "exit 0\n"
    )

    for with_commit, label, want_unfixed, want_fixed in (
        (False, "QUIET: synthetic upstream, HEAD published on main", 2, 0),
        (True, "LOUD: same shape plus one real local commit", 2, 2),
    ):
        root = tempfile.mkdtemp(prefix="stophook-")
        try:
            work, branch = build_session_repo(root, with_commit)

            # The fixture is only interesting if it really is the buggy shape.
            old = git(work, "rev-list", "origin/%s..HEAD" % branch, "--count")
            new = git(work, "rev-list", "HEAD", "--not", "--remotes", "--count")
            if not with_commit:
                check("  fixture reproduces the bug (old=1, new=0)",
                      old == "1" and new == "0", "old=%s new=%s" % (old, new))
            else:
                check("  fixture has genuine local work (old=2, new=1)",
                      old == "2" and new == "1", "old=%s new=%s" % (old, new))

            unfixed = os.path.join(root, "vendor.sh")
            with open(unfixed, "w", encoding="utf-8") as fh:
                fh.write(VENDOR_UNPUSHED_BLOCK)
            rc_before, err_before = run_hook(work, unfixed)
            check("  %s -- unfixed vendor hook exits %d" % (label, want_unfixed),
                  rc_before == want_unfixed,
                  "got exit %d: %s" % (rc_before, err_before))

            fixed_text, status = patch_stop_hook.patch_text(VENDOR_UNPUSHED_BLOCK)
            check("  patcher applied", status == "patched", status)
            fixed = os.path.join(root, "vendor-patched.sh")
            with open(fixed, "w", encoding="utf-8") as fh:
                fh.write(fixed_text)
            rc_after, err_after = run_hook(work, fixed)
            check("  %s -- patched vendor hook exits %d" % (label, want_fixed),
                  rc_after == want_fixed, "got exit %d: %s" % (rc_after, err_after))
            if want_fixed == 2:
                check("  and it still says which branch", branch in err_after, err_after)

            # The repo copy must never go quiet on genuine work either.
            if with_commit:
                repo_hook = os.path.join(root, "repo.sh")
                shutil.copy(HOOK, repo_hook)
                rc_repo, err_repo = run_hook(work, repo_hook)
                check("  repo copy also fires on genuine local work",
                      rc_repo == 2, "got exit %d: %s" % (rc_repo, err_repo))
        finally:
            shutil.rmtree(root, ignore_errors=True)

    print()
    if failures:
        print("FAILED (%d): %s" % (len(failures), ", ".join(failures)))
        return 1
    print("all checks passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
