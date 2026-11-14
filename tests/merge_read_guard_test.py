#!/usr/bin/env python3
"""The merge-read guard: a merge waits until this session read the PR's comments.

    python3 tests/merge_read_guard_test.py

Drives scripts/merge_read_guard.py with fixture hook input, as Claude Code would:
a PostToolUse read writes the stamp, a PreToolUse merge reads it. Pins allow,
block, a stale stamp, a stamp for another PR or another session, a read method
that does not count, that a broken hook fails open with a visible warning, and
that a `gh` merge by graphql mutation or inside a `bash -c` / `sh -c` / `eval`
wrapper is refused.
The failure it guards: S652 merged #3296 twelve minutes after a review posted,
unread. Pure stdlib, no network; the clock is pinned with CPL_HOOK_NOW.
"""
import json
import os
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GUARD = os.path.join(ROOT, "scripts", "merge_read_guard.py")
T0 = 1_800_000_000


def run(payload, state, at, raw=None):
    env = dict(os.environ, CPL_HOOK_STATE_DIR=state, CPL_HOOK_NOW=str(at))
    out = subprocess.run([sys.executable, GUARD], input=raw if raw is not None else json.dumps(payload),
                         capture_output=True, text=True, env=env)
    try:
        body = json.loads(out.stdout) if out.stdout.strip() else {}
    except ValueError:
        body = {"_unparsed": out.stdout}
    return out.returncode, body


def read(method="get_comments", tool="mcp__github__pull_request_read", number=3296, session="s1"):
    ti = {"owner": "CPL-Initiative", "repo": "cpl-project-tracker", "method": method}
    ti["issue_number" if tool.endswith("issue_read") else "pullNumber"] = number
    return {"hook_event_name": "PostToolUse", "session_id": session, "tool_name": tool,
            "tool_input": ti, "tool_response": {"content": []}}


def merge(number=3296, session="s1", owner="cpl-initiative"):
    return {"hook_event_name": "PreToolUse", "session_id": session,
            "tool_name": "mcp__github__merge_pull_request",
            "tool_input": {"owner": owner, "repo": "cpl-project-tracker", "pullNumber": number,
                           "merge_method": "squash"}}


def denied(body):
    return (body.get("hookSpecificOutput") or {}).get("permissionDecision") == "deny"


def main():
    checks = []
    with tempfile.TemporaryDirectory() as st:
        rc, body = run(merge(), st, T0)
        reason = (body.get("hookSpecificOutput") or {}).get("permissionDecisionReason", "")
        checks.append(("a merge with no read in this session is denied", rc == 0 and denied(body)))
        checks.append(("the refusal tells the session to read the comments to the last page",
                       "to the last page" in reason and "never in this session" in reason))

        run(read(), st, T0)
        rc, body = run(merge(), st, T0 + 2 * 60 + 50)
        checks.append(("a merge 2 minutes 50 after get_comments is allowed (no output, exit 0)",
                       rc == 0 and body == {}))
        rc, body = run(merge(owner="CPL-Initiative"), st, T0 + 60)
        checks.append(("owner case does not matter", rc == 0 and body == {}))
        rc, body = run(merge(), st, T0 + 4 * 60)
        reason = (body.get("hookSpecificOutput") or {}).get("permissionDecisionReason", "")
        checks.append(("a 4-minute-old stamp is refused and says how old it is (COBIx on #3307)",
                       denied(body) and "4 minutes ago" in reason and "3 minutes" in reason))
        rc, body = run(merge(number=3297), st, T0 + 60)
        checks.append(("a read of another PR does not open this one", denied(body)))
        rc, body = run(merge(session="s2"), st, T0 + 60)
        checks.append(("a read in another session does not count", denied(body)))

    # Auto-merge and `gh` merges skip the read, so they are refused even right after one.
    with tempfile.TemporaryDirectory() as st:
        run(read(), st, T0)
        auto = {"hook_event_name": "PreToolUse", "session_id": "s1",
                "tool_name": "mcp__github__enable_pr_auto_merge",
                "tool_input": {"owner": "cpl-initiative", "repo": "cpl-project-tracker", "pullNumber": 3296}}
        rc, body = run(auto, st, T0 + 10)
        reason = (body.get("hookSpecificOutput") or {}).get("permissionDecisionReason", "")
        checks.append(("enable_pr_auto_merge is refused even right after a read",
                       rc == 0 and denied(body) and "merge_pull_request" in reason))

        def bash(cmd):
            return {"hook_event_name": "PreToolUse", "session_id": "s1", "tool_name": "Bash",
                    "tool_input": {"command": cmd}}
        for cmd in ("gh pr merge 3296 --squash", "cd x && gh pr merge 3296 --auto",
                    "GH_TOKEN=x gh api -X PUT repos/o/r/pulls/3296/merge"):
            rc, body = run(bash(cmd), st, T0 + 10)
            checks.append(("Bash `%s` is refused" % cmd, rc == 0 and denied(body)))
        # COBIx on #3307 (comment 6880706352): a graphql mutation and a shell wrapper got past.
        for cmd in ("gh api graphql -f query='mutation { mergePullRequest(input: {pullRequestId: \"x\"}) { clientMutationId } }'",
                    "gh api graphql -f query='mutation { enablePullRequestAutoMerge(input: {pullRequestId: \"x\"}) { clientMutationId } }'",
                    "Q='mutation { MERGEPULLREQUEST(input: {}) { clientMutationId } }'; gh api graphql -f query=\"$Q\"",
                    "bash -c \"gh pr merge 12 --squash\"",
                    "sh -c 'gh pr merge 12'",
                    "bash -lc 'cd x && gh pr merge 12'",
                    "eval gh pr merge 12",
                    "env GH_TOKEN=x gh pr merge 12",
                    "bash -c \"sh -c 'gh api -X PUT repos/o/r/pulls/12/merge'\""):
            rc, body = run(bash(cmd), st, T0 + 10)
            checks.append(("Bash `%s` is refused" % cmd, rc == 0 and denied(body)))
        for cmd in ("gh search prs merge", "grep -n 'gh pr merge' notes.md", "gh pr view 3296",
                    "git merge --no-edit origin/main", "git merge origin/main",
                    "gh api -X GET search/code -f q=mergePullRequest",
                    "gh api graphql -f query='query { repository(owner: \"o\", name: \"r\") { pullRequest(number: 12) { mergeable } } }'",
                    "bash -c 'gh pr view 12'", "echo mergePullRequest", "sh -c 'git merge origin/main'"):
            rc, body = run(bash(cmd), st, T0 + 10)
            checks.append(("Bash `%s` passes" % cmd, rc == 0 and body == {}))
        rc, body = run(None, st, T0, raw=json.dumps({"hook_event_name": "PreToolUse", "tool_name": "Bash",
                                                      "tool_input": {"command": ["not", "a", "string"]}}))
        checks.append(("a Bash input the guard cannot read fails open", rc == 0 and not denied(body)))

    # The failure marker is keyed by session: one session's failed stamp opens only its own merges.
    with tempfile.TemporaryDirectory() as st:
        os.makedirs(os.path.join(st, "merge_read_stamps.json.tmp"))   # the write fails, the dir stays writable
        rc, body = run(read(session="s1"), st, T0)
        checks.append(("a failed stamp warns", "systemMessage" in body))
        rc, body = run(merge(session="s1"), st, T0 + 30)
        checks.append(("that session's merge fails open with a warning",
                       "systemMessage" in body and not denied(body)))
        rc, body = run(merge(session="s2"), st, T0 + 30)
        checks.append(("another session's unread merge is still refused", denied(body)))

    for method, tool in (("get_review_comments", "mcp__github__pull_request_read"),
                         ("get_reviews", "mcp__github__pull_request_read"),
                         ("get_comments", "mcp__github__issue_read")):
        with tempfile.TemporaryDirectory() as st:
            run(read(method=method, tool=tool), st, T0)
            rc, body = run(merge(), st, T0 + 60)
            checks.append(("%s %s counts as reading the comments" % (tool.split("__")[-1], method),
                           rc == 0 and body == {}))

    with tempfile.TemporaryDirectory() as st:
        run(read(method="get"), st, T0)
        run(read(method="get_check_runs"), st, T0)
        rc, body = run(merge(), st, T0 + 60)
        checks.append(("get and get_check_runs do not count as reading the comments", denied(body)))
        path = os.path.join(st, "merge_read_stamps.json")
        checks.append(("a read that does not count writes no stamp", not os.path.exists(path)))

    with tempfile.TemporaryDirectory() as st:
        run(read(number=1), st, T0)
        run(read(number=2), st, T0 + 2 * 86400)
        stamps = json.load(open(os.path.join(st, "merge_read_stamps.json")))
        checks.append(("stamps older than a day are pruned on the next write",
                       len(stamps) == 1 and list(stamps)[0].endswith("#2")))

    with tempfile.TemporaryDirectory() as st:
        run(read(), st, T0 + 100)
        rc, body = run(merge(), st, T0)
        checks.append(("a stamp 100 seconds in the future counts (clock skew)", rc == 0 and body == {}))
        rc, body = run(merge(), st, T0 - 200)
        checks.append(("a stamp 300 seconds in the future does not", denied(body)))

    # The second reader's repro on #3307: an unwritable state directory denied every merge.
    rc, body = run(read(number=5), "/proc/nope", T0)
    checks.append(("a stamp that cannot be written warns instead of failing silently",
                   rc == 0 and "systemMessage" in body))
    rc, body = run(merge(number=5), "/proc/nope", T0 + 60)
    checks.append(("an unwritable state directory lets the merge through with a warning",
                   rc == 0 and "systemMessage" in body and not denied(body)))

    with tempfile.TemporaryDirectory() as st:
        path = os.path.join(st, "merge_read_stamps.json")
        open(path, "w").write("{truncated")
        rc, body = run(merge(), st, T0)
        checks.append(("a corrupt state file lets the merge through with a warning",
                       rc == 0 and "systemMessage" in body and not denied(body)))
        run(read(), st, T0)
        rc, body = run(merge(), st, T0 + 60)
        checks.append(("the next stamp replaces a corrupt state file, so it heals",
                       rc == 0 and body == {} and isinstance(json.load(open(path)), dict)))
        rc, body = run(merge(number=7), st, T0 + 60)
        checks.append(("after healing, an unread PR is denied again", denied(body)))

    with tempfile.TemporaryDirectory() as st:
        rc, body = run(None, st, T0, raw="{not json")
        checks.append(("unreadable hook input fails open with a visible warning",
                       rc == 0 and "systemMessage" in body and not denied(body)))
        rc, body = run({"hook_event_name": "PreToolUse", "tool_name": "mcp__github__merge_pull_request",
                        "tool_input": {"owner": "o", "repo": "r"}}, st, T0)
        checks.append(("a merge input the guard cannot read fails open with a warning",
                       rc == 0 and "systemMessage" in body and not denied(body)))
        bad = os.path.join(st, "merge_read_stamps.json")
        os.makedirs(bad)  # a directory where the state file should be: reading it errors
        rc, body = run(merge(), st, T0)
        checks.append(("a broken state file fails open with a warning",
                       rc == 0 and "systemMessage" in body and not denied(body)))
        rc, body = run({"hook_event_name": "PreToolUse", "tool_name": "Read", "tool_input": {}}, st, T0)
        checks.append(("another tool passes untouched", rc == 0 and body == {}))

    failed = [label for label, ok in checks if not ok]
    for label, ok in checks:
        print(("ok   " if ok else "FAIL ") + label)
    if failed:
        print("\n%d of %d checks failed" % (len(failed), len(checks)))
        return 1
    print("\nok - %d/%d merge_read_guard checks passed" % (len(checks), len(checks)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
