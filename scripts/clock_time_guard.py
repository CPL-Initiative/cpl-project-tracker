#!/usr/bin/env python3
"""Refuse a published time that runs ahead of the clock, or a stale "now" claim.

    <hook-json-on-stdin> python3 scripts/clock_time_guard.py

PreToolUse on the tools that publish text: mcp__github__add_issue_comment,
mcp__github__update_issue_comment, mcp__github__create_pull_request,
mcp__github__update_pull_request, and Bash commands that run `git commit` (the
message from `-m`/`--message`, a `-F` file, or a `-F -` heredoc). Two rules:

  a. A TIME LATER THAN THE CLOCK. Any `HH:MMZ` or `HH:MM:SSZ` that falls 2
     minutes or more after the machine's UTC clock (a written minute against a
     clock at :00 seconds; 14:56Z at 14:54Z was one of the mistakes) and less
     than 6 hours after it is refused, unless another date (not today's) sits
     within 40 characters before or after it, or a future-intent word (`due`,
     `next`, `until`, `fires`, `firing`, `scheduled`, `expires`, `window`,
     `cron`, `slot`, `tomorrow`) sits within 40 characters before it, or `by`
     sits right before it (`by 16:00Z`).
  b. A STALE PRESENT CLAIM. Only `written HH:MMZ`, `` `date -u` read HH:MMZ ``
     and `at writing[,] HH:MMZ`, refused when more than 5 minutes behind the
     clock, with the same date exemption.

A time inside a fenced code block, an inline code span or a single-quoted SQL
literal is never read.

WHY THIS SHAPE
--------------
S652 (SkyAvocet, 2026-11-14) wrote a time from memory of elapsed time, and every
wrong one ran AHEAD of the clock: 13:05Z at 12:59Z, 14:50Z at 14:42Z, 14:56Z at
14:54Z, 15:44Z at 15:42Z. A past time is almost always a legitimate report, so
rule (a) refuses only the future, and rule (b) keeps the three explicit "now"
forms honest. The first version read `read` and `RUN ... at` as claims and
refused real receipts; a second reader on #3307 listed them, and they are this
version's pass fixtures (issue #3306; Sam, 2026-11-14).

FAILS OPEN, VISIBLY
-------------------
Any error inside this script exits 0 with a `systemMessage` warning naming the
error, and the call goes ahead unchecked; so does a `-F` file it cannot find.
Only the deliberate refusal blocks. `CPL_HOOK_NOW` (ISO time or epoch seconds)
pins the clock for tests.

Tests: tests/clock_time_guard_test.py
"""
import datetime as dt
import json
import os
import re
import sys

TOOLS_TEXT = {
    "mcp__github__add_issue_comment": ("body",),
    "mcp__github__update_issue_comment": ("body",),
    "mcp__github__create_pull_request": ("title", "body"),
    "mcp__github__update_pull_request": ("title", "body"),
}
AHEAD_MIN_S = 2 * 60
AHEAD_MAX_S = 6 * 3600
STALE_S = 5 * 60
NEAR = 40

TIME = re.compile(r"(?<![\d:])(?P<h>[01]\d|2[0-3]):(?P<m>[0-5]\d)(?::(?P<s>[0-5]\d))?Z\b")
CLAIM = re.compile(r"(?:\bwritten|`date\s+-u`\s+read|\bat\s+writing,?)\s*$", re.I)
FUTURE = re.compile(r"\b(due|next|until|fires|firing|scheduled|expires|window|cron|slot|tomorrow)\b", re.I)
# `by` marks a deadline only right before the time ("by 16:00Z"); "RUN by the
# conductor at 14:50Z" is an actor, and that line is one of the four mistakes.
BY = re.compile(r"\bby\s+$", re.I)
DATE = re.compile(r"\b(\d{4}-\d{2}-\d{2})\b")
# Regions never read: fenced blocks, inline code spans, single-quoted literals (no
# letter on either side, so an apostrophe in prose never opens one).
CODE = re.compile(r"(```|~~~)[\s\S]*?(\1|\Z)|`[^`\n]*`|(?<![A-Za-z0-9])'[^'\n]*'(?![A-Za-z0-9])")


def clock():
    pinned = os.environ.get("CPL_HOOK_NOW")
    if pinned:
        try:
            return dt.datetime.fromtimestamp(float(pinned), dt.timezone.utc)
        except ValueError:
            return dt.datetime.fromisoformat(pinned.replace("Z", "+00:00")).astimezone(dt.timezone.utc)
    return dt.datetime.now(dt.timezone.utc)


def masked(text):
    """Blank out code and literals, keeping offsets."""
    return CODE.sub(lambda m: " " * len(m.group(0)), text)


def decide(text, now):
    """None when the text passes; else the refusal sentence."""
    today = now.date().isoformat()
    now_s = now.hour * 3600 + now.minute * 60 + now.second
    clean = masked(text)
    for m in TIME.finditer(clean):
        secs = int(m.group("h")) * 3600 + int(m.group("m")) * 60 + int(m.group("s") or 0)
        delta = (secs - now_s + 43200) % 86400 - 43200   # signed, within half a day
        around = clean[max(0, m.start() - NEAR):m.end() + NEAR]
        if any(d != today for d in DATE.findall(around)):
            continue
        before = clean[max(0, m.start() - NEAR):m.start()]
        found = m.group(0)
        if AHEAD_MIN_S <= delta < AHEAD_MAX_S and not FUTURE.search(before) \
                and not BY.search(before):
            return ("Refused by the clock guard: the text says %s, %d minutes after the machine's "
                    "UTC clock (%sZ). Read `date -u` in the same command that writes the time, "
                    "or name a future time as one (\"next\", \"due\", \"by\")."
                    % (found, round(delta / 60), now.strftime("%H:%M")))
        line_start = clean.rfind("\n", 0, m.start()) + 1
        if delta < -STALE_S and CLAIM.search(text[line_start:m.start()]):
            return ("Refused by the clock guard: the text claims %s as the present, but the machine's "
                    "UTC clock reads %sZ (%d minutes later). Read `date -u` in the same command that "
                    "writes the time." % (found, now.strftime("%H:%M"), round(-delta / 60)))
    return None


# ── Bash: find the message of a real `git commit` ──────────────────────────
SEPARATORS = {";", "&", "|", "\n", "(", ")"}


def shell_commands(cmd):
    """Split a shell command into simple commands of unquoted words, skipping
    heredoc bodies. Returns [(words, [heredoc bodies])]. Quote removal is done;
    a double-quoted `$(...)` stays one word."""
    cmds, words, bodies, cur, have = [], [], [], [], False
    pending_heredocs = []
    i, n = 0, len(cmd)

    def end_word():
        nonlocal cur, have
        if have:
            words.append("".join(cur))
        cur, have = [], False

    def end_cmd():
        nonlocal words, bodies
        end_word()
        if words:
            cmds.append((words, bodies))
        words, bodies = [], []

    while i < n:
        c = cmd[i]
        if c == "\\" and i + 1 < n:
            cur.append(cmd[i + 1]); have = True; i += 2; continue
        if c == "'":
            j = cmd.find("'", i + 1)
            j = n if j < 0 else j
            cur.append(cmd[i + 1:j]); have = True; i = j + 1; continue
        if c == '"':
            j, depth = i + 1, 0
            while j < n:
                if cmd[j] == "\\":
                    j += 2; continue
                if cmd.startswith("$(", j):
                    depth += 1; j += 2; continue
                if cmd[j] == ")" and depth:
                    depth -= 1
                elif cmd[j] == '"' and not depth:
                    break
                j += 1
            cur.append(cmd[i + 1:j]); have = True; i = j + 1; continue
        if cmd.startswith("<<", i):
            end_word()
            m = re.match(r"<<-?\s*(['\"]?)([A-Za-z_][A-Za-z0-9_]*)\1", cmd[i:])
            if m:
                pending_heredocs.append(m.group(2))
                words.append("<<")
                i += m.end(); continue
        if c == "\n" and pending_heredocs:
            j = i + 1
            for delim in pending_heredocs:
                end = re.compile(r"^[ \t]*" + re.escape(delim) + r"[ \t]*$", re.M).search(cmd, j)
                body_end = end.start() if end else n
                bodies.append(cmd[j:body_end])
                j = end.end() if end else n
            pending_heredocs = []
            end_cmd()
            i = j; continue
        if c in SEPARATORS:
            end_cmd(); i += 1; continue
        if c in " \t":
            end_word(); i += 1; continue
        cur.append(c); have = True; i += 1
    end_cmd()
    return cmds


def commit_messages(command, cwd):
    """(texts, warnings) for every real `git commit` in the command."""
    texts, warnings = [], []
    for words, bodies in shell_commands(command):
        k = 0
        while k < len(words) and re.match(r"^[A-Za-z_][A-Za-z0-9_]*=", words[k]):
            k += 1
        if k >= len(words) or os.path.basename(words[k]) != "git":
            continue
        k += 1
        while k < len(words) and words[k].startswith("-"):
            k += 2 if words[k] in ("-C", "-c", "--git-dir", "--work-tree") else 1
        if k >= len(words) or words[k] != "commit":
            continue
        args = words[k + 1:]
        for a, w in enumerate(args):
            nxt = args[a + 1] if a + 1 < len(args) else None
            if w in ("-m", "--message") and nxt is not None:
                texts.append(nxt)
            elif w.startswith("--message="):
                texts.append(w.split("=", 1)[1])
            elif w.startswith("-m") and len(w) > 2 and not w.startswith("--"):
                texts.append(w[2:])
            path = None
            if w in ("-F", "--file") and nxt is not None:
                path = nxt
            elif w.startswith("--file="):
                path = w.split("=", 1)[1]
            if path == "-":
                texts.extend(bodies)
            elif path:
                if not os.path.isabs(path):
                    if not cwd:
                        warnings.append("cannot resolve -F %s without a working directory" % path)
                        continue
                    path = os.path.join(cwd, path)
                try:
                    with open(path, encoding="utf-8", errors="replace") as fh:
                        texts.append(fh.read())
                except OSError as e:
                    warnings.append("cannot read -F %s (%s)" % (path, e.strerror))
    return texts, warnings


def outgoing_text(payload):
    """(text or None, warnings)."""
    tool = payload.get("tool_name")
    ti = payload.get("tool_input") or {}
    if tool in TOOLS_TEXT:
        return "\n".join(str(ti.get(f) or "") for f in TOOLS_TEXT[tool]), []
    if tool == "Bash":
        texts, warnings = commit_messages(str(ti.get("command") or ""), payload.get("cwd"))
        return ("\n\n".join(texts) if texts else None), warnings
    return None, []


def main():
    try:
        payload = json.loads(sys.stdin.read() or "{}")
        if not isinstance(payload, dict):
            raise ValueError("hook input is not a JSON object")
        if payload.get("hook_event_name", "PreToolUse") != "PreToolUse":
            return 0
        text, warnings = outgoing_text(payload)
        reason = decide(text, clock()) if text else None
        if reason:
            print(json.dumps({"hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "deny",
                "permissionDecisionReason": reason,
            }}))
        elif warnings:
            print(json.dumps({"systemMessage": "clock guard skipped part of a commit message: %s."
                              % "; ".join(warnings)}))
        return 0
    except Exception as e:  # fail open, and say so
        print(json.dumps({"systemMessage":
                          "clock guard failed (%s: %s); the text goes out unchecked. "
                          "Run `date -u` before writing a time." % (type(e).__name__, e)}))
        return 0


if __name__ == "__main__":
    sys.exit(main())
