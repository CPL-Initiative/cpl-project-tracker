#!/usr/bin/env python3
"""Guard the guard: `scripts/bash_read_guard.py` must never auto-approve a write.

    python3 tests/bash_read_guard_test.py

The hook returns `allow` for read-only shell so auto mode stops prompting on the
hundredth `git status` of the day, and that convenience is only safe while
everything else falls through to the prompt. The asymmetry is the whole point:

  * A FALSE ALLOW is the failure that matters — a command that writes, deletes,
    pushes or runs something unexamined, with no human in the loop. A hook
    returning `allow` is a REAL grant; it removes the check rather than
    deferring it.
  * A FALSE ASK is an annoyance and nothing more: the session gets one prompt,
    exactly as it does today. So this file is deliberately lopsided — the
    write cases are exhaustive and the read cases only cover what a session
    actually runs all day.

⚠️ THE BYPASS CASES ARE THE POINT OF THIS FILE. `git status` is easy. What a
token check gets wrong is the second half of a compound command, a redirection
that turns a reader into a writer, a `$(…)` carrying something never inspected,
and a flag that flips a command's nature (`sed -i`, `find -delete`). Each has a
case below, and each was written before the guard passed it.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
GUARD = os.path.join(os.path.dirname(HERE), "scripts", "bash_read_guard.py")

# (command, expected) — "allow" or "ask". There is no "deny": an unrecognized
# command is not wrong, it is merely unproven, and the prompt is the right home
# for it. Denying would make the guard an obstacle instead of a shortcut.
CASES = [
    # ── the day's actual traffic, which is what this exists for ───────────
    ("git status", "allow"),
    ("git status --short", "allow"),
    ("git log --oneline -5", "allow"),
    ("git diff HEAD~1", "allow"),
    ("git show origin/main:prototype/ccr_universe.js", "allow"),
    ("git rev-list --count HEAD", "allow"),
    ("git ls-files", "allow"),
    ("git branch --show-current", "allow"),
    ("grep -rn 'curationRung' prototype/", "allow"),
    ("rg --files-with-matches canStage", "allow"),
    ("sed -n '1,40p' prototype/ccr_universe.js", "allow"),
    ("cat package.json", "allow"),
    ("head -20 docs/INDEX.md", "allow"),
    ("tail -3 docs/ccr_atlas_lessons.md", "allow"),
    ("wc -l tests/run.js", "allow"),
    ("ls -la prototype/", "allow"),
    ("find . -name '*.test.js'", "allow"),
    ("npm test", "allow"),
    ("npm run sweep", "allow"),
    ("npm run a11y", "allow"),
    ("node tests/run.js", "allow"),
    ("node tests/ccr_skyview_read_only.test.js", "allow"),
    ("python3 kb/_docs_audit.py", "allow"),
    ("python3 kb/_context_budget.py", "allow"),
    ("python3 kb/_build_dependency_map.py --check", "allow"),
    ("bash scripts/check_generated.sh", "allow"),
    ("cd /home/user/cpl-project-tracker && git status", "allow"),
    ("git status | head -5", "allow"),
    ("grep -c foo bar.js || true", "allow"),

    # ── writes, which must never be auto-approved ─────────────────────────
    ("rm -rf prototype/", "ask"),
    ("git push origin main", "ask"),
    ("git commit -m 'x'", "ask"),
    ("git checkout main", "ask"),
    ("git restore --worktree prototype/skyview.html", "ask"),
    ("git reset --hard origin/main", "ask"),
    ("git clean -fd", "ask"),
    ("git stash", "ask"),
    ("npm install", "ask"),
    ("npm run build", "ask"),
    ("python3 kb/_build_dependency_map.py", "ask"),   # writes without --check
    ("python3 prototype/build_ccr_atlas.py", "ask"),
    ("python3 -c 'import os; os.remove(\"x\")'", "ask"),
    ("node -e 'require(\"fs\").writeFileSync(\"x\",\"y\")'", "ask"),
    ("mv a b", "ask"),
    ("cp a b", "ask"),
    ("chmod +x scripts/x.sh", "ask"),
    ("curl https://example.com", "ask"),
    ("bash scripts/deploy.sh", "ask"),

    # ── ⚠️ the bypasses: a reader in front, a writer behind ───────────────
    ("git status && rm -rf /", "ask"),
    ("cat x.js; git push", "ask"),
    ("ls || npm install", "ask"),
    ("grep foo bar | xargs rm", "ask"),
    ("cat a.js > b.js", "ask"),
    ("cat a.js >> b.js", "ask"),
    ("echo hi > /etc/passwd", "ask"),
    ("git log $(rm -rf /)", "ask"),
    ("git log `whoami`", "ask"),
    ("cat <(rm -rf /)", "ask"),
    ("npm test &", "ask"),
    ("FOO=1 rm -rf /", "ask"),
    ("env rm -rf /", "ask"),

    # ── ⚠️ flags that flip a command's nature ─────────────────────────────
    ("sed -i 's/a/b/' file.js", "ask"),
    ("sed -i.bak 's/a/b/' file.js", "ask"),
    ("sed -ni 's/a/b/' file.js", "ask"),        # bundled -i
    ("sed 's/a/b/' file.js", "ask"),            # no -n: prints the whole stream
    ("find . -name '*.tmp' -delete", "ask"),
    ("find . -name '*.js' -exec rm {} ;", "ask"),
    ("sort -o out.txt in.txt", "ask"),
    ("git branch -D claude/old", "ask"),
    ("git branch -m old new", "ask"),

    # ── unparseable and empty fall to the prompt, never past it ───────────
    ("git log 'unterminated", "ask"),
    ("", "ask"),
    ("   ", "ask"),
]


def run(command):
    payload = json.dumps({"tool_name": "Bash", "tool_input": {"command": command}})
    out = subprocess.run([sys.executable, GUARD], input=payload,
                         capture_output=True, text=True).stdout.strip()
    if not out:
        return "ask"            # silence means the guard declined to speak
    try:
        return json.loads(out)["hookSpecificOutput"]["permissionDecision"]
    except Exception:
        return "unparseable:" + out[:60]


def main():
    failures = []
    for command, expected in CASES:
        got = run(command)
        if got != expected:
            failures.append("  %-46r expected %-5s got %s" % (command[:46], expected, got))

    # A non-Bash payload must produce NOTHING — this hook has no opinion about
    # another tool's call, and printing one would override a different guard.
    other = subprocess.run(
        [sys.executable, GUARD],
        input=json.dumps({"tool_name": "Read", "tool_input": {"file_path": "/etc/passwd"}}),
        capture_output=True, text=True).stdout.strip()
    if other:
        failures.append("  a non-Bash tool_name produced output: %r" % other[:80])

    total = len(CASES) + 1
    if failures:
        print("FAIL - %d of %d bash guard cases wrong:\n%s"
              % (len(failures), total, "\n".join(failures)))
        return 1
    print("ok - %d/%d bash_read_guard cases" % (total, total))
    return 0


if __name__ == "__main__":
    sys.exit(main())
