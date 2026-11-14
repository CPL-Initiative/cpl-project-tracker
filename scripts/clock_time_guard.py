#!/usr/bin/env python3
"""Refuse a published "now" time that the clock does not agree with.

    <hook-json-on-stdin> python3 scripts/clock_time_guard.py

PreToolUse on the tools that publish text: mcp__github__add_issue_comment,
mcp__github__update_issue_comment, mcp__github__create_pull_request,
mcp__github__update_pull_request, and Bash commands that run `git commit`. It
scans the outgoing text for a time in the house form `HH:MMZ` or `HH:MM:SSZ`
that a word claims is the present (`written`, `read`, `at writing`,
`date -u read`, `run by the conductor at`, `RUN ... at`) and denies the call when
that time differs from the machine's UTC clock by more than 3 minutes, naming the
time found and the clock's.

WHY THIS EXISTS
---------------
S652 (SkyAvocet, 2026-11-14) wrote a time from memory five times, each wrong by 2
to 10 minutes: "written 13:05Z" posted at 12:59Z, "RUN by the conductor at
14:50Z" at 14:42Z. The rule ("`date -u` before any time") was on the page and
recurred anyway, which is the case for a hook (issue #3306; Sam, 2026-11-14).

KEPT NARROW ON PURPOSE
----------------------
A guard that nags gets removed. It reads only a time a claim word introduces, and
leaves alone a time that reports the past or quotes someone:
  - `at about` before the time, or `dispatched`, `pressed`, `merged` just before
    the claim word;
  - a date other than today's UTC date earlier on the same line;
  - a time inside a quotation ("...", the curly pair, or a `code span`), counted
    by the quote marks before it on its line.
A claim word with no house-form time after it (`read the thread`) never fires.

FAILS OPEN, VISIBLY
-------------------
Any error inside this script exits 0 with a `systemMessage` warning naming the
error, and the call goes ahead unchecked. Only the deliberate refusal blocks.
`CPL_HOOK_NOW` (an ISO time or epoch seconds) pins the clock for tests.

Tests: tests/clock_time_guard_test.py
"""
import datetime as dt
import json
import os
import re
import shlex
import sys

TOOLS_TEXT = {
    "mcp__github__add_issue_comment": ("body",),
    "mcp__github__update_issue_comment": ("body",),
    "mcp__github__create_pull_request": ("title", "body"),
    "mcp__github__update_pull_request": ("title", "body"),
}
TOLERANCE_S = 3 * 60

TIME = r"(?P<h>[01]\d|2[0-3]):(?P<m>[0-5]\d)(?::(?P<s>[0-5]\d))?Z\b"
# Claim words, case-insensitive. Each must sit right before the time.
CLAIM = re.compile(
    r"(?P<claim>\bdate\s+-u`?\s+read|\bat\s+writing|\brun\s+by\s+the\s+conductor\s+at"
    r"|\bwritten(?:\s+at)?|\bread(?:\s+at)?)\s*[:,]?\s*" + TIME, re.I)
# `RUN ... at` is the upper-case run marker the conductor writes; case-sensitive.
RUN_AT = re.compile(r"(?P<claim>\bRUN\b[^\n]{0,60}?\bat)\s+" + TIME)
PAST_BEFORE_CLAIM = re.compile(r"\b(dispatched|pressed|merged)\b[^\n]{0,40}$", re.I)
AT_ABOUT = re.compile(r"\bat\s+about\s*$", re.I)
DATE = re.compile(r"\b(\d{4}-\d{2}-\d{2})\b")
GIT_COMMIT = re.compile(r"\bgit\b(?:\s+-[cC]\s+\S+)*\s+commit\b")


def clock():
    pinned = os.environ.get("CPL_HOOK_NOW")
    if pinned:
        try:
            return dt.datetime.fromtimestamp(float(pinned), dt.timezone.utc)
        except ValueError:
            return dt.datetime.fromisoformat(pinned.replace("Z", "+00:00")).astimezone(dt.timezone.utc)
    return dt.datetime.now(dt.timezone.utc)


def quoted(line_before):
    """True when the text before a match on its line leaves a quotation open."""
    if line_before.count('"') % 2 or line_before.count("`") % 2:
        return True
    return line_before.count("“") > line_before.count("”")


def claims(text, today):
    """Yield (claim text, seconds of day) for each present-tense time claim."""
    for rx in (CLAIM, RUN_AT):
        for m in rx.finditer(text):
            line_start = text.rfind("\n", 0, m.start()) + 1
            before_claim = text[line_start:m.start()]
            before_time = text[line_start:m.start("h")]
            if quoted(before_time):
                continue
            if AT_ABOUT.search(text[m.start("claim"):m.start("h")]):
                continue
            if PAST_BEFORE_CLAIM.search(before_claim):
                continue
            if any(d != today for d in DATE.findall(before_time)):
                continue
            secs = int(m.group("h")) * 3600 + int(m.group("m")) * 60 + int(m.group("s") or 0)
            yield m.group(0).strip(), secs


def commit_text(command):
    """The text a `git commit` command would publish: the command itself, plus
    the file a `-F`/`--file` names when it can be read."""
    if not GIT_COMMIT.search(command):
        return None
    parts = [command]
    try:
        toks = shlex.split(command, posix=True)
    except ValueError:
        toks = []
    for i, t in enumerate(toks):
        path = None
        if t in ("-F", "--file") and i + 1 < len(toks):
            path = toks[i + 1]
        elif t.startswith("--file="):
            path = t.split("=", 1)[1]
        if path and path != "-" and os.path.isfile(path):
            with open(path, encoding="utf-8", errors="replace") as fh:
                parts.append(fh.read())
    return "\n".join(parts)


def outgoing_text(payload):
    tool = payload.get("tool_name")
    ti = payload.get("tool_input") or {}
    if tool in TOOLS_TEXT:
        return "\n".join(str(ti.get(f) or "") for f in TOOLS_TEXT[tool])
    if tool == "Bash":
        return commit_text(str(ti.get("command") or ""))
    return None


def decide(text, now):
    """None when the text passes; else the refusal sentence."""
    today = now.date().isoformat()
    now_s = now.hour * 3600 + now.minute * 60 + now.second
    for found, secs in claims(text, today):
        diff = abs(secs - now_s)
        diff = min(diff, 86400 - diff)
        if diff > TOLERANCE_S:
            return ("Refused by the clock guard: the text says \"%s\" but the machine's UTC clock "
                    "reads %sZ (%d minutes apart); run `date -u` and write the time it prints, or "
                    "word a past event as one (\"at about\", \"merged\", a date)."
                    % (found, now.strftime("%H:%M"), round(diff / 60)))
    return None


def main():
    try:
        payload = json.loads(sys.stdin.read() or "{}")
        if not isinstance(payload, dict):
            raise ValueError("hook input is not a JSON object")
        if payload.get("hook_event_name", "PreToolUse") != "PreToolUse":
            return 0
        text = outgoing_text(payload)
        if not text:
            return 0
        reason = decide(text, clock())
        if reason:
            print(json.dumps({"hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "deny",
                "permissionDecisionReason": reason,
            }}))
        return 0
    except Exception as e:  # fail open, and say so
        print(json.dumps({"systemMessage":
                          "clock guard failed (%s: %s); the text goes out unchecked. "
                          "Run `date -u` before writing a time." % (type(e).__name__, e)}))
        return 0


if __name__ == "__main__":
    sys.exit(main())
