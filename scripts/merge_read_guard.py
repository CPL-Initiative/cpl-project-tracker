#!/usr/bin/env python3
"""Refuse a merge unless this session read that PR's comments in the last 10 minutes.

    <hook-json-on-stdin> python3 scripts/merge_read_guard.py

One script, two hook events, told apart by `hook_event_name`:

  PostToolUse on mcp__github__issue_read (method get_comments) and
  mcp__github__pull_request_read (get_comments, get_review_comments or
  get_reviews): write a stamp (session, owner/repo, PR number, time) to a small
  state file.

  PreToolUse on mcp__github__merge_pull_request: allow (say nothing) when a stamp
  for that PR in this session is at most 10 minutes old; otherwise deny, with one
  sentence telling the session to read the PR's comments to the last page first.

WHY THIS EXISTS
---------------
S652 (SkyAvocet, 2026-11-14) merged #3296 twelve minutes after COBIx's review
posted on it, without reading the review. The rule was already written down in
`docs/reference/conductor_mode.md` (*Start*, step 6: "Before merging any PR, read
its own comments to the last page") and it recurred anyway, which is the case for
a hook (issue #3306; Sam, 2026-11-14: "excellent! go for it").

WHAT IT CANNOT SEE
------------------
It knows a read happened, not that the read reached the last page: the tool's
answer does not say how many pages there are. The deny sentence asks for the last
page, and the stamp is keyed to the PR, so reading page 1 of a long thread still
satisfies it. A stamp is keyed by `session_id`, which a subagent shares with the
session that spawned it, so a reader agent's read counts for its conductor.

FAILS OPEN, VISIBLY
-------------------
A broken hook must not block every merge. Any error inside this script (bad
input, an unwritable state directory, a bug) exits 0 with a `systemMessage`
warning naming the error, and the merge goes ahead unchecked. Only the one
deliberate refusal blocks.

STATE
-----
`$CPL_HOOK_STATE_DIR` when set (tests), else `$CLAUDE_PROJECT_DIR/.claude/state/`
(gitignored in this repo; in a three-repo cloud session that is
`/home/user/.claude/state/`, outside every clone), else `~/.claude/state/`.
Stamps older than a day are dropped on each write.

Tests: tests/merge_read_guard_test.py
"""
import json
import os
import sys
import time

MERGE_TOOL = "mcp__github__merge_pull_request"
READ_TOOLS = {
    "mcp__github__issue_read": {"get_comments"},
    "mcp__github__pull_request_read": {"get_comments", "get_review_comments", "get_reviews"},
}
MAX_AGE = 10 * 60          # seconds a read stays fresh
KEEP = 24 * 3600           # stamps older than this are pruned
STATE_NAME = "merge_read_stamps.json"


def state_path():
    base = os.environ.get("CPL_HOOK_STATE_DIR")
    if not base:
        proj = os.environ.get("CLAUDE_PROJECT_DIR")
        base = (os.path.join(proj, ".claude", "state") if proj
                else os.path.join(os.path.expanduser("~"), ".claude", "state"))
    return os.path.join(base, STATE_NAME)


def now():
    """The clock; CPL_HOOK_NOW (epoch seconds) pins it for tests."""
    pinned = os.environ.get("CPL_HOOK_NOW")
    return float(pinned) if pinned else time.time()


def key(payload, ti, number):
    sess = str(payload.get("session_id") or "unknown")
    repo = "%s/%s" % (str(ti.get("owner") or "").lower(), str(ti.get("repo") or "").lower())
    return "%s|%s#%d" % (sess, repo, int(number))


def load(path):
    try:
        with open(path, encoding="utf-8") as fh:
            data = json.load(fh)
        return data if isinstance(data, dict) else {}
    except FileNotFoundError:
        return {}


def stamp(payload):
    ti = payload.get("tool_input") or {}
    methods = READ_TOOLS.get(payload.get("tool_name"))
    if not methods or ti.get("method") not in methods:
        return 0
    number = ti.get("issue_number") if payload.get("tool_name") == "mcp__github__issue_read" \
        else ti.get("pullNumber")
    if number is None:
        return 0
    path = state_path()
    data = load(path)
    t = now()
    data = {k: v for k, v in data.items() if isinstance(v, (int, float)) and t - v < KEEP}
    data[key(payload, ti, number)] = t
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as fh:
        json.dump(data, fh)
    os.replace(tmp, path)
    return 0


def check_merge(payload):
    ti = payload.get("tool_input") or {}
    number = ti.get("pullNumber")
    if number is None:
        raise ValueError("merge call carries no pullNumber")
    k = key(payload, ti, number)
    seen = load(state_path()).get(k)
    age = None if seen is None else now() - seen
    if age is not None and 0 <= age <= MAX_AGE:
        return 0
    where = "%s/%s#%s" % (ti.get("owner"), ti.get("repo"), number)
    when = ("never in this session" if age is None
            else "%d minutes ago" % int(age // 60))
    reason = ("Refused by the merge-read guard: read %s's comments to the last page "
              "(pull_request_read get_comments and get_reviews, or issue_read get_comments) "
              "before merging; this session last read them %s, and a read counts for 10 minutes."
              % (where, when))
    print(json.dumps({"hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": "deny",
        "permissionDecisionReason": reason,
    }}))
    return 0


def main():
    try:
        payload = json.loads(sys.stdin.read() or "{}")
        if not isinstance(payload, dict):
            raise ValueError("hook input is not a JSON object")
        event = payload.get("hook_event_name")
        tool = payload.get("tool_name")
        if event == "PostToolUse" and tool in READ_TOOLS:
            return stamp(payload)
        if event == "PreToolUse" and tool == MERGE_TOOL:
            return check_merge(payload)
        return 0
    except Exception as e:  # fail open, and say so
        print(json.dumps({"systemMessage":
                          "merge-read guard failed (%s: %s); the call goes ahead unchecked. "
                          "Read the PR's comments to the last page before merging."
                          % (type(e).__name__, e)}))
        return 0


if __name__ == "__main__":
    sys.exit(main())
