#!/usr/bin/env python3
"""Refuse a merge unless this session read that PR's comments in the last 3 minutes.

    <hook-json-on-stdin> python3 scripts/merge_read_guard.py

One script, two hook events, told apart by `hook_event_name`:

  PostToolUse on mcp__github__issue_read (method get_comments) and
  mcp__github__pull_request_read (get_comments, get_review_comments or
  get_reviews): write a stamp (session, owner/repo, PR number, time) to a small
  state file.

  PreToolUse on mcp__github__merge_pull_request: allow (say nothing) when a stamp
  for that PR in this session is at most 3 minutes old, so the read and the merge
  sit in the same step; otherwise deny, with one sentence telling the session to
  read the PR's comments to the last page first.

  PreToolUse on mcp__github__enable_pr_auto_merge, and on a Bash `gh pr merge`,
  `gh api .../merge`, or `gh api graphql` in a line that names `mergePullRequest` or
  an auto-merge mutation (`enablePullRequestAutoMerge`): deny always. The Bash check
  also reads the string a `bash -c`, `sh -c` or `eval` wrapper runs. Auto-merge
  lands later with no read at all (with no required check it merges at once;
  `CLAUDE.md` and conductor_mode say never use it), and this environment allows
  `gh` only for search. Both refusals say to merge with merge_pull_request after
  reading the thread (COBIx on #3307).

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

The stamp records WHEN the thread was read, not what it held. A review posted
after the read and before the merge passes; the 3-minute window narrows that gap
and does not close it. `pr-gate` step 4 (is a reviewer comment newer than the
head commit, or newer than the read) is the check that sees it.

EVERY REPOSITORY
----------------
It holds for a merge in any repository, the vault's included: a merge there
reads its comments first too. The stamp is keyed by owner/repo and number.

FAILS OPEN, VISIBLY
-------------------
A broken hook must not block every merge. Any error inside this script (bad
input, a bug) exits 0 with a `systemMessage` warning naming the error, and the
merge goes ahead unchecked. The same holds when the guard cannot know whether a
read happened: the state directory cannot be written, the last stamp attempt
failed (a marker in the system temp directory records it), or the state file
will not parse. A corrupt state file is replaced by the next stamp that writes,
so it heals. Only the deliberate refusals block.

The failure marker is keyed by state directory AND session, so one session's
failed stamp lets only that session's merges through, until one of its stamps
succeeds. A shared state directory (`/home/user/.claude/state/` in a cloud
session) that cannot be written still lets every session's merges through, with
the warning: that is the fail-open choice, made on purpose.

STATE
-----
`$CPL_HOOK_STATE_DIR` when set (tests), else `$CLAUDE_PROJECT_DIR/.claude/state/`
(gitignored in this repo; in a three-repo cloud session that is
`/home/user/.claude/state/`, outside every clone), else `~/.claude/state/`.
Stamps older than a day are dropped on each write. A stamp up to 2 minutes in
the future counts (clock skew between hook processes).

Tests: tests/merge_read_guard_test.py
"""
import json
import os
import sys
import tempfile
import time

MERGE_TOOL = "mcp__github__merge_pull_request"
READ_TOOLS = {
    "mcp__github__issue_read": {"get_comments"},
    "mcp__github__pull_request_read": {"get_comments", "get_review_comments", "get_reviews"},
}
MAX_AGE = 3 * 60           # seconds a read stays fresh: the read and the merge in one step
AUTO_MERGE_TOOL = "mcp__github__enable_pr_auto_merge"
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


SKEW = 120                 # a stamp this far in the future still counts


class Unknowable(Exception):
    """The guard cannot tell whether a read happened; the merge goes ahead with a warning."""


def failure_marker(payload):
    """Where a failed stamp is recorded: the system temp directory, which a broken
    state directory does not take with it. Keyed by state directory and session."""
    raw = os.path.dirname(state_path()) + "|" + str(payload.get("session_id") or "unknown")
    tag = "".join(c if c.isalnum() else "_" for c in raw)[-120:]
    return os.path.join(tempfile.gettempdir(), "cpl_merge_read_stamp_failed_" + tag)


def load(path):
    """The stamps. A missing file is an empty set; a corrupt one raises ValueError."""
    try:
        with open(path, encoding="utf-8") as fh:
            data = json.load(fh)
    except FileNotFoundError:
        return {}
    if not isinstance(data, dict):
        raise ValueError("state file is not a JSON object")
    return data


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
    t = now()
    try:
        try:
            data = load(path)
        except (ValueError, UnicodeDecodeError):
            data = {}   # corrupt: this write replaces it, so the file heals
        data = {k: v for k, v in data.items() if isinstance(v, (int, float)) and t - v < KEEP}
        data[key(payload, ti, number)] = t
        os.makedirs(os.path.dirname(path), exist_ok=True)
        tmp = path + ".tmp"
        with open(tmp, "w", encoding="utf-8") as fh:
            json.dump(data, fh)
        os.replace(tmp, path)
    except OSError as e:
        try:
            with open(failure_marker(payload), "w") as fh:
                fh.write("%s %s\n" % (t, e))
        except OSError:
            pass   # the merge check also tests the directory, so it still fails open
        print(json.dumps({"systemMessage": "merge-read guard could not record this read (%s); "
                          "the next merge goes ahead unchecked." % e}))
        return 0
    try:
        os.remove(failure_marker(payload))
    except OSError:
        pass
    return 0


def writable_state_dir():
    """Measured, not inferred: os.access says yes to root almost everywhere."""
    d = os.path.dirname(state_path())
    try:
        os.makedirs(d, exist_ok=True)
        fd, probe = tempfile.mkstemp(dir=d, prefix=".probe")
        os.close(fd)
        os.remove(probe)
        return True
    except OSError:
        return False


def check_merge(payload):
    ti = payload.get("tool_input") or {}
    number = ti.get("pullNumber")
    if number is None:
        raise ValueError("merge call carries no pullNumber")
    if os.path.exists(failure_marker(payload)):
        raise Unknowable("the last attempt to record a read failed")
    if not writable_state_dir():
        raise Unknowable("the state directory %s cannot be written" % os.path.dirname(state_path()))
    try:
        stamps = load(state_path())
    except (ValueError, UnicodeDecodeError) as e:
        raise Unknowable("the state file will not parse (%s)" % e)
    k = key(payload, ti, number)
    seen = stamps.get(k)
    age = None if not isinstance(seen, (int, float)) else now() - seen
    if age is not None and -SKEW <= age <= MAX_AGE:
        return 0
    where = "%s/%s#%s" % (ti.get("owner"), ti.get("repo"), number)
    when = ("never in this session" if age is None
            else "%d minutes ago" % int(age // 60) if age > 0
            else "with a stamp %d seconds in the future" % int(-age))
    reason = ("Refused by the merge-read guard: read %s's comments to the last page "
              "(pull_request_read get_comments and get_reviews, or issue_read get_comments) "
              "before merging; this session last read them %s, and a read counts for 3 minutes, so read and merge in one step."
              % (where, when))
    print(json.dumps({"hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": "deny",
        "permissionDecisionReason": reason,
    }}))
    return 0


OTHER_PATH = ("Merge with merge_pull_request after reading the PR's comments to the last page; "
              "auto-merge and `gh` merges skip that read.")


def deny(reason):
    print(json.dumps({"hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": "deny",
        "permissionDecisionReason": reason,
    }}))
    return 0


SHELLS = {"bash", "sh", "zsh", "dash", "ksh"}
PREFIXES = {"env", "command", "exec", "sudo", "nohup", "time"}
GRAPHQL_MERGE_WORDS = ("mergepullrequest", "automerge")
MAX_DEPTH = 4              # wrappers inside wrappers, as deep as the guard looks


def _program(words):
    """Skip VAR=value assignments and plain prefixes (`env`, `sudo` ...); return the
    index of the program word, or len(words)."""
    k = 0
    while k < len(words):
        w = words[k]
        if "=" in w and not w.startswith("-"):
            k += 1
        elif os.path.basename(w) in PREFIXES:
            k += 1
            while k < len(words) and words[k].startswith("-"):
                k += 1
        else:
            break
    return k


def _wrapped(words, k):
    """The command string a `bash -c STR`, `sh -lc STR` or `eval ARGS` hands to a
    shell, or None. Quote removal is already done, so STR is plain text."""
    prog = os.path.basename(words[k])
    rest = words[k + 1:]
    if prog == "eval":
        return " ".join(rest) or None
    if prog in SHELLS:
        for i, w in enumerate(rest):
            if w.startswith("-") and not w.startswith("--") and "c" in w[1:]:
                return rest[i + 1] if i + 1 < len(rest) else None
    return None


def gh_merge(command, depth=0):
    """True when a simple command in the Bash line, or in a `bash -c` / `sh -c` /
    `eval` string inside it, is `gh pr merge`, a `gh api` call on a merge endpoint,
    or a `gh api graphql` call in a line that names `mergePullRequest` or an
    auto-merge mutation (COBIx on #3307, comment 6880706352)."""
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from clock_time_guard import shell_commands   # one shell reader for both hooks
    for words, _ in shell_commands(command):
        k = _program(words)
        if k >= len(words):
            continue
        inner = _wrapped(words, k)
        if inner is not None and depth < MAX_DEPTH and gh_merge(inner, depth + 1):
            return True
        if os.path.basename(words[k]) != "gh":
            continue
        rest = words[k + 1:]
        if rest[:2] == ["pr", "merge"]:
            return True
        if rest[:1] == ["api"] and any(w.rstrip("/").endswith("/merge") for w in rest[1:]):
            return True
        # The mutation may sit in a variable set earlier in the line, so the whole
        # line is read: a graphql call beside the word is refused.
        if rest[:1] == ["api"] and "graphql" in rest[1:] \
                and any(m in command.lower() for m in GRAPHQL_MERGE_WORDS):
            return True
    return False


def main():
    try:
        payload = json.loads(sys.stdin.read() or "{}")
        if not isinstance(payload, dict):
            raise ValueError("hook input is not a JSON object")
        event = payload.get("hook_event_name")
        tool = payload.get("tool_name")
        if event == "PostToolUse" and tool in READ_TOOLS:
            return stamp(payload)
        if event == "PreToolUse" and tool == AUTO_MERGE_TOOL:
            return deny("Refused by the merge-read guard: auto-merge is never used here (with no "
                        "required check it merges at once, with no read at all). " + OTHER_PATH)
        if event == "PreToolUse" and tool == "Bash" \
                and gh_merge(str((payload.get("tool_input") or {}).get("command") or "")):
            return deny("Refused by the merge-read guard: this environment allows `gh` for search "
                        "only, and a `gh` merge skips the read. " + OTHER_PATH)
        if event == "PreToolUse" and tool == MERGE_TOOL:
            return check_merge(payload)
        return 0
    except Unknowable as e:
        print(json.dumps({"systemMessage":
                          "merge-read guard cannot tell whether this PR's comments were read (%s); "
                          "the merge goes ahead unchecked. Read them to the last page first." % e}))
        return 0
    except Exception as e:  # fail open, and say so
        print(json.dumps({"systemMessage":
                          "merge-read guard failed (%s: %s); the call goes ahead unchecked. "
                          "Read the PR's comments to the last page before merging."
                          % (type(e).__name__, e)}))
        return 0


if __name__ == "__main__":
    sys.exit(main())
