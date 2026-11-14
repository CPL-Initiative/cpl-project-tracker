#!/usr/bin/env python3
"""The clock guard: a published time may not run ahead of the clock, and a "now" claim may not be stale.

    python3 tests/clock_time_guard_test.py

Drives scripts/clock_time_guard.py with fixture hook input and a pinned clock
(CPL_HOOK_NOW). The catches are S652's four real mistakes of 2026-11-14, every
one ahead of the clock: 13:05Z at 12:59Z, 14:50Z at 14:42Z, 14:56Z at 14:54Z,
15:44Z at 15:42Z. The passes are the false blocks a second reader found in the
first version on #3307, read at a 15:00Z clock, plus the shell forms a commit
message arrives in. Pure stdlib, no network.
"""
import json
import os
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GUARD = os.path.join(ROOT, "scripts", "clock_time_guard.py")
DAY = "2026-11-14T"
AT15 = DAY + "15:00:00Z"


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


def bash(cmd, cwd=None):
    p = {"hook_event_name": "PreToolUse", "tool_name": "Bash", "tool_input": {"command": cmd}}
    if cwd:
        p["cwd"] = cwd
    return p


def denied(body):
    return (body.get("hookSpecificOutput") or {}).get("permissionDecision") == "deny"


def reason(body):
    return (body.get("hookSpecificOutput") or {}).get("permissionDecisionReason", "")


CATCHES = [
    ("13:05Z written at 12:59Z", comment("## Sky (S652 SkyAvocet, conductor; written 13:05Z)"),
     DAY + "12:59:00Z", "13:05Z"),
    ("14:50Z at 14:42Z", comment("The capture is RUN by the conductor at 14:50Z on main."),
     DAY + "14:42:00Z", "14:50Z"),
    ("14:56Z at 14:54Z", comment("Merged #3301; COBIx told 14:56Z."), DAY + "14:54:00Z", "14:56Z"),
    ("15:44Z at 15:42Z", comment("## Sky (S652; `date -u` read 15:44Z)"), DAY + "15:42:00Z", "15:44Z"),
    ("a stale `written` claim, today's date", comment("2026-11-14, written 13:05Z"), AT15, "13:05Z"),
    ("a stale `date -u` read claim", comment("## Sky (`date -u` read 14:40Z)"), AT15, "14:40Z"),
    ("a stale `at writing,` claim with seconds", comment("At writing, 14:50:30Z the run is queued."),
     AT15, "14:50:30Z"),
    ("a PR body on create_pull_request",
     {"hook_event_name": "PreToolUse", "tool_name": "mcp__github__create_pull_request",
      "tool_input": {"title": "x", "body": "Opened 15:20Z."}}, AT15, "15:20Z"),
    ("a PR title on update_pull_request",
     {"hook_event_name": "PreToolUse", "tool_name": "mcp__github__update_pull_request",
      "tool_input": {"pullNumber": 1, "title": "Status 15:20Z"}}, AT15, "15:20Z"),
    ("a double-quoted git commit -m message", bash('git commit -m "Receipt; applied 15:20Z"'), AT15, "15:20Z"),
    ("a git commit message in a quoted heredoc",
     bash("git add -A && git commit -m \"$(cat <<'EOF'\nReceipt 15:20Z\nEOF\n)\""), AT15, "15:20Z"),
    ("a git commit -F - heredoc", bash("git commit -F - <<'EOF'\nReceipt 15:20Z\nEOF"), AT15, "15:20Z"),
    ("a commit after cd on another line", bash("cd repo\ngit -C . commit -m 'Done 15:20Z'"), AT15, "15:20Z"),
]
PASSES = [
    ("Receipt: RUN at 14:42Z by the conductor", comment("Receipt: RUN at 14:42Z by the conductor")),
    ("The sweep RUN started at 13:40Z", comment("The sweep RUN started at 13:40Z")),
    ("Receipt written 18:04Z on 2026-11-13", comment("Receipt written 18:04Z on 2026-11-13")),
    ("a fenced code block", comment("Plan:\n```\nwritten 18:04Z\nnext 16:00Z\n```\nDone.")),
    ("SQL in single quotes", comment("where created_at > '2026-11-14 15:30Z' and t < '16:00Z'")),
    ("Read: 12:00Z (COBIx review)", comment("Read: 12:00Z (COBIx review)")),
    ("already read 12:00Z", comment("already read 12:00Z")),
    ("the next firing is 22:12 Pacific, 06:12Z", comment("the next firing is 22:12 Pacific, 06:12Z")),
    ("a future time after `next`", comment("The next check-in is at 16:30Z.")),
    ("a future time after `due`", comment("Review due 17:00Z.")),
    ("a time less than 2 minutes ahead", comment("written 15:01Z")),
    ("`by` as an actor does not exempt, `by` right before a time does", comment("Land it by 16:00Z.")),
    ("a fresh `written` claim", comment("written 14:57Z")),
    ("a past report with no claim", comment("The cron ran at 06:17Z and 09:17Z.")),
    ("an inline code span", comment("the form `written 13:05Z` is the house form")),
    ("a time more than 6 hours ahead (another day's report)", comment("Merged 22:10Z.")),
    ("a Bash command that only greps for git commit", bash("grep -n 'git commit' notes.md 15:20Z")),
    ("an unrelated heredoc that mentions git commit",
     bash("cat > notes.md <<'EOF'\ngit commit -m 'x 15:20Z'\nEOF")),
    ("another tool", {"hook_event_name": "PreToolUse", "tool_name": "Write",
                      "tool_input": {"content": "written 15:20Z"}}),
]


def main():
    checks = []
    for label, payload, now, found in CATCHES:
        rc, body = run(payload, now)
        r = reason(body)
        checks.append(("catches " + label, rc == 0 and denied(body)
                       and found in r and now[11:16] + "Z" in r and "date -u" in r))
    for label, payload in PASSES:
        rc, body = run(payload, AT15)
        checks.append(("passes " + label, rc == 0 and body == {}))

    with tempfile.TemporaryDirectory() as tmp:
        open(os.path.join(tmp, "msg.txt"), "w").write("Receipt\n\napplied 15:20Z\n")
        rc, body = run(bash("git commit -F msg.txt", cwd=tmp), AT15)
        checks.append(("reads a relative -F file from the command's working directory", denied(body)))
        rc, body = run(bash("git commit -F %s" % os.path.join(tmp, "msg.txt")), AT15)
        checks.append(("reads an absolute -F file", denied(body)))
        rc, body = run(bash("git commit -F msg.txt"), AT15)
        checks.append(("a relative -F file with no working directory is skipped with a warning",
                       rc == 0 and "systemMessage" in body and not denied(body)))

    rc, body = run(None, AT15, raw="[not, json")
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
