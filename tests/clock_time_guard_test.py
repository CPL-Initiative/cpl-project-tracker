#!/usr/bin/env python3
"""The clock guard: a time a comment, PR or commit claims is "now" must match the clock.

    python3 tests/clock_time_guard_test.py

Drives scripts/clock_time_guard.py with fixture hook input and a pinned clock
(CPL_HOOK_NOW). The catches are S652's real mistakes of 2026-11-14: "written
13:05Z" posted at 12:59Z, and "RUN by the conductor at 14:50Z" at 14:42Z. The
passes keep the rule narrow: a time within 3 minutes, a past event (`at about`,
`merged`, `dispatched`, `pressed`, another day's date), a quotation, and text
with no claim word. Pure stdlib, no network.
"""
import json
import os
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GUARD = os.path.join(ROOT, "scripts", "clock_time_guard.py")


def run(payload, now, raw=None):
    env = dict(os.environ, CPL_HOOK_NOW=now)
    out = subprocess.run([sys.executable, GUARD], input=raw if raw is not None else json.dumps(payload),
                         capture_output=True, text=True, env=env)
    try:
        body = json.loads(out.stdout) if out.stdout.strip() else {}
    except ValueError:
        body = {"_unparsed": out.stdout}
    return out.returncode, body


def comment(text):
    return {"hook_event_name": "PreToolUse", "tool_name": "mcp__github__add_issue_comment",
            "tool_input": {"owner": "o", "repo": "r", "issue_number": 1, "body": text}}


def bash(cmd):
    return {"hook_event_name": "PreToolUse", "tool_name": "Bash", "tool_input": {"command": cmd}}


def denied(body):
    return (body.get("hookSpecificOutput") or {}).get("permissionDecision") == "deny"


def reason(body):
    return (body.get("hookSpecificOutput") or {}).get("permissionDecisionReason", "")


DAY = "2026-11-14T"
CATCHES = [
    ("S652: \"written 13:05Z\" posted at 12:59Z",
     comment("## Sky (S652 SkyAvocet, conductor; written 13:05Z)\n\nThe review is folded."),
     DAY + "12:59:00Z", "13:05Z"),
    ("S652: \"RUN by the conductor at 14:50Z\" at 14:42Z",
     comment("The capture is RUN by the conductor at 14:50Z on main."),
     DAY + "14:42:00Z", "14:50Z"),
    ("`date -u` read, 6 minutes off",
     comment("## Sky (S652; `date -u` read 15:47Z)"), DAY + "15:41:00Z", "15:47Z"),
    ("\"at writing\" with seconds, 5 minutes off",
     comment("At writing 10:00:30Z the run is queued."), DAY + "10:05:31Z", "10:00:30Z"),
    ("a PR body on create_pull_request",
     {"hook_event_name": "PreToolUse", "tool_name": "mcp__github__create_pull_request",
      "tool_input": {"title": "x", "body": "Opened; written 09:00Z."}}, DAY + "09:10:00Z", "09:00Z"),
    ("a PR title on update_pull_request",
     {"hook_event_name": "PreToolUse", "tool_name": "mcp__github__update_pull_request",
      "tool_input": {"pullNumber": 1, "title": "Status (read 09:00Z)"}}, DAY + "09:10:00Z", "09:00Z"),
    ("a git commit message in a heredoc",
     bash("git commit -m \"$(cat <<'EOF'\nReceipt; written 13:05Z\nEOF\n)\""), DAY + "12:59:00Z", "13:05Z"),
    ("today's date before the time still counts",
     comment("2026-11-14, written 13:05Z"), DAY + "12:59:00Z", "13:05Z"),
]
PASSES = [
    ("a time within 3 minutes", comment("written 13:01Z"), DAY + "12:59:00Z"),
    ("the clock's own minute", comment("RUN by the conductor at 14:42Z"), DAY + "14:42:40Z"),
    ("across midnight, within 3 minutes", comment("written 23:59Z"), "2026-11-15T00:01:00Z"),
    ("\"at about\" reports the past", comment("written at about 13:05Z"), DAY + "12:59:00Z"),
    ("merged before the claim word", comment("#3296 merged, its review read 12:47Z"), DAY + "12:59:00Z"),
    ("dispatched", comment("dispatched and read 11:00Z"), DAY + "12:59:00Z"),
    ("pressed", comment("Sam pressed Fine; read 11:00Z"), DAY + "12:59:00Z"),
    ("another day's date on the line", comment("2026-11-13, written 13:05Z"), DAY + "12:59:00Z"),
    ("inside a quotation", comment("Today's mistake: \"written 13:05Z\" posted early."), DAY + "12:59:00Z"),
    ("inside curly quotes", comment("the line “RUN by the conductor at 14:50Z”"), DAY + "14:42:00Z"),
    ("inside a code span", comment("the form `written 13:05Z` is the house form"), DAY + "12:59:00Z"),
    ("a time with no claim word", comment("The cron runs at 06:17Z and 09:17Z."), DAY + "12:59:00Z"),
    ("a claim word with no time", comment("I read the thread to the last page."), DAY + "12:59:00Z"),
    ("lower-case run is not the RUN marker", comment("the run at 06:17Z failed"), DAY + "12:59:00Z"),
    ("a Bash command that does not commit", bash("echo 'written 13:05Z' > notes.txt"), DAY + "12:59:00Z"),
    ("another tool", {"hook_event_name": "PreToolUse", "tool_name": "Write",
                      "tool_input": {"content": "written 13:05Z"}}, DAY + "12:59:00Z"),
]


def main():
    checks = []
    for label, payload, now, found in CATCHES:
        rc, body = run(payload, now)
        r = reason(body)
        checks.append(("catches " + label, rc == 0 and denied(body)
                       and found in r and now[11:16] + "Z" in r))
    for label, payload, now in PASSES:
        rc, body = run(payload, now)
        checks.append(("passes " + label, rc == 0 and body == {}))

    with tempfile.TemporaryDirectory() as tmp:
        msg = os.path.join(tmp, "msg.txt")
        open(msg, "w").write("Receipt\n\nwritten 13:05Z\n")
        rc, body = run(bash("git commit -F %s" % msg), DAY + "12:59:00Z")
        checks.append(("reads the message file a git commit -F names", denied(body)))

    rc, body = run(None, DAY + "12:59:00Z", raw="[not, json")
    checks.append(("unreadable hook input fails open with a visible warning",
                   rc == 0 and "systemMessage" in body and not denied(body)))
    rc, body = run(comment("written 13:05Z"), "not-a-time")
    checks.append(("a clock the guard cannot read fails open with a warning",
                   rc == 0 and "systemMessage" in body and not denied(body)))
    env = dict(os.environ)
    env.pop("CPL_HOOK_NOW", None)
    out = subprocess.run([sys.executable, GUARD], input=json.dumps(comment("no times here")),
                         capture_output=True, text=True, env=env)
    checks.append(("runs against the real clock with nothing to say", out.returncode == 0
                   and out.stdout.strip() == ""))

    failed = [label for label, ok in checks if not ok]
    for label, ok in checks:
        print(("ok   " if ok else "FAIL ") + label)
    if failed:
        print("\n%d of %d checks failed" % (len(failed), len(checks)))
        return 1
    print("\nok - %d/%d clock_time_guard checks passed" % (len(checks), len(checks)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
