#!/usr/bin/env python3
"""PreToolUse guard for Bash — auto-approve read-only commands, ask for the rest.

WHY THIS EXISTS
---------------
Sam, 2026-09-19: *"the swarm of 'Allow Once' approval requests I am getting
yesterday and today. It's making the work unsustainable."*

`scripts/supabase_sql_guard.py` already proved the mechanism: `permissions.allow`
is the PERMISSION layer, and auto mode runs a SEPARATE classifier that judges
each call on its CONTENT — which is why the prompt offers no "Always allow",
and why #1617's allowlist made things worse rather than better. A PreToolUse
hook returning `allow` short-circuits the classifier outright.

That guard covers ONE tool. This one covers the bulk of what is left: a session
spends its day on `git status`, `git log`, `grep`, `sed -n`, `cat`, `wc`,
`npm test` and the repo's own read-only Python checks, and every one of them
reaches the classifier today.

⚠️ A HOOK RETURNING `allow` IS A REAL GRANT — IT REMOVES THE HUMAN CHECK.
That is the whole point and the whole risk. So:

  * The default is `ask`. Always. An unrecognized command, an unparseable one,
    a recognized one carrying a flag this file does not know — all fall through
    to the prompt, never past it.
  * Every allowed command is read-only BY ITS OWN NATURE, not by intent. `sed`
    is allowed only with `-n` and never with `-i`; `find` is refused the moment
    it carries `-exec` or `-delete`; `git` gets a closed list of subcommands
    that cannot write, so `push`, `commit`, `checkout`, `reset` and `restore`
    are simply absent rather than denied.
  * Redirection and command substitution END the analysis. `cat a > b` writes,
    `$(…)` and backticks run something this file never saw. A segment carrying
    any of them is asked about, whatever its verb.

⚠️ THIS IS A GUARDRAIL AGAINST THE PROMPT STORM, NOT A SECURITY BOUNDARY — the
same caveat the SQL guard carries. Shell is not a regular language and anyone
deliberately trying to slip a write past a token check can. It exists so that
the hundredth `git status` of the day does not cost a human decision, and so
that the ones that DO deserve a decision still get one.

⚠️ AND A HOOK THAT DOES NOT FIRE PROTECTS NOTHING AND SAVES NOTHING. Hooks load
at SESSION START, and only from the project root's `.claude/settings.json` — so
a session whose working directory is the repo's PARENT (the remote runner's
layout on 2026-09-19: cwd `/home/user`, repo at `/home/user/cpl-project-tracker`)
loads none of this, and neither its convenience nor its restraint applies.
`scripts/check_hooks_live.py` reports which of the two worlds a session is in.

Tests: tests/bash_read_guard_test.py
"""
import json
import re
import shlex
import sys

# ── what ends the analysis, wherever it appears ────────────────────────────
# Redirection writes. Command substitution runs something we never inspected.
# Backgrounding detaches from the decision entirely. A process substitution
# `<(…)` is a command in disguise. None of these are worth parsing around.
DISQUALIFIERS = ("`", "$(", "<(", ">(", ">", "<", "&")

# Separators we DO understand. Every segment between them must pass on its own,
# so `git status && rm -rf /` fails on the second segment rather than the first.
SEGMENT_SPLIT = re.compile(r"\|\||&&|;|\|")

# ── git: a closed list of subcommands that cannot write ────────────────────
# `push`, `commit`, `checkout`, `restore`, `reset`, `clean`, `rebase`, `merge`,
# `stash`, `apply`, `fetch` and `pull` are ABSENT rather than denied — the list
# is what may run, so a subcommand nobody thought about is asked about.
GIT_READ = {
    "status", "log", "diff", "show", "rev-list", "rev-parse", "ls-files",
    "ls-remote", "ls-tree", "merge-base", "blame", "cat-file", "shortlog",
    "describe", "count-objects", "whatchanged", "grep",
}
# `git branch -D` deletes and `git branch -m` renames, so branch is allowed
# only with flags that list.
GIT_BRANCH_OK = {"-a", "-r", "-v", "-vv", "--list", "--show-current", "--all", "--remotes"}

# ── per-command flag refusals ──────────────────────────────────────────────
# Each entry: a flag that turns a reader into a writer. Matched against the
# whole token AND against its `--flag=value` prefix.
DENY_FLAGS = {
    "sed": {"-i", "--in-place", "-s"},          # -i edits in place
    "find": {"-exec", "-execdir", "-delete", "-ok", "-okdir", "-fls",
             "-fprint", "-fprint0", "-fprintf"},
    "sort": {"-o", "--output"},
    "rg": {"--replace", "-r"},                   # ripgrep's replace writes nothing
                                                 # to disk, but keep the surface small
}

# Commands that are read-only with no further argument analysis.
PLAIN_READERS = {
    "cat", "head", "tail", "wc", "nl", "cut", "uniq", "tr", "column",
    "basename", "dirname", "realpath", "file", "stat", "du", "df", "echo",
    "printf", "date", "pwd", "whoami", "hostname", "uname", "which", "type",
    "ls", "tree", "diff", "cmp", "md5sum", "sha1sum", "sha256sum", "jq",
    "grep", "egrep", "fgrep", "rg", "sort", "comm", "seq", "true", "false",
    "cd", "test",
}

# ── the repo's own read-only checks ────────────────────────────────────────
# A script that WRITES is not here. `kb/_build_*.py` writes by default and only
# reads with `--check`, so the flag is required rather than assumed.
PY_READONLY = {"kb/_docs_audit.py", "kb/_context_budget.py", "kb/_row_audit.py"}
PY_CHECK_ONLY = re.compile(r"^kb/_build_[a-z_]+\.py$")
NPM_READONLY = {"test", "run"}
NPM_RUN_OK = {"sweep", "a11y", "test"}
NODE_READONLY = re.compile(r"^(tests/[\w./-]+\.js|prototype/check_[\w.-]+\.js|scripts/a11y\.js)$")
SH_READONLY = {"scripts/check_generated.sh"}


def _flag_denied(cmd, tokens):
    deny = DENY_FLAGS.get(cmd)
    if not deny:
        return None
    for t in tokens:
        base = t.split("=", 1)[0]
        if t in deny or base in deny:
            return t
        # Bundled short flags: -ni contains -i. Only for single-dash tokens.
        if cmd == "sed" and re.match(r"^-[a-zA-Z]+$", t) and "i" in t[1:]:
            return t
    return None


def check_segment(seg):
    """Return (ok, reason). ok=True only when the segment is certainly a read."""
    seg = seg.strip()
    if not seg:
        return True, ""                      # an empty segment does nothing

    for bad in DISQUALIFIERS:
        if bad in seg:
            return False, f"contains {bad!r} (redirection or substitution)"

    try:
        tokens = shlex.split(seg)
    except ValueError as e:
        return False, f"could not be parsed ({e})"
    if not tokens:
        return True, ""

    # `FOO=bar cmd` — an assignment prefix hides the real command. Not worth
    # parsing; `env` is refused for the same reason.
    if re.match(r"^[A-Za-z_]\w*=", tokens[0]):
        return False, "starts with an environment assignment"

    cmd, args = tokens[0], tokens[1:]
    cmd = cmd.rsplit("/", 1)[-1]             # /usr/bin/grep -> grep

    if cmd == "git":
        if not args:
            return True, ""
        sub = args[0]
        if sub == "branch":
            bad = [a for a in args[1:] if a.startswith("-") and a not in GIT_BRANCH_OK]
            if bad:
                return False, f"git branch with {bad[0]}"
            return True, ""
        if sub in GIT_READ:
            return True, ""
        return False, f"git subcommand {sub!r} is not on the read-only list"

    if cmd in PLAIN_READERS or cmd == "sed" or cmd == "find":
        if cmd == "sed" and not any(t == "-n" or (re.match(r"^-[a-zA-Z]+$", t) and "n" in t[1:])
                                    for t in args):
            return False, "sed without -n may print more than it is asked to"
        bad = _flag_denied(cmd, args)
        if bad:
            return False, f"{cmd} with {bad}"
        return True, ""

    if cmd in ("python3", "python"):
        if not args:
            return False, "bare python REPL"
        script = args[0]
        if script in PY_READONLY:
            return True, ""
        if PY_CHECK_ONLY.match(script) and "--check" in args:
            return True, ""
        return False, f"python script {script!r} is not on the read-only list"

    if cmd == "npm":
        if args[:1] == ["test"]:
            return True, ""
        if args[:1] == ["run"] and len(args) > 1 and args[1] in NPM_RUN_OK:
            return True, ""
        return False, "npm command is not on the read-only list"

    if cmd == "node":
        if args and NODE_READONLY.match(args[0]):
            return True, ""
        return False, "node script is not on the read-only list"

    if cmd in ("bash", "sh"):
        if args and args[0] in SH_READONLY:
            return True, ""
        return False, "shell script is not on the read-only list"

    return False, f"{cmd!r} is not on the read-only list"


def decide(command):
    if not command or not command.strip():
        return "ask", "Empty command."
    segments = SEGMENT_SPLIT.split(command)
    for seg in segments:
        ok, why = check_segment(seg)
        if not ok:
            return "ask", (
                "Not auto-approved by the repo's Bash guard: "
                + (seg.strip()[:80] or "(empty)")
                + " — " + why + "."
            )
    return "allow", "Read-only command (auto-approved by the repo's Bash guard)."


def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        # A guard that cannot read its input must not be the thing that decides.
        print(json.dumps({"hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "ask",
            "permissionDecisionReason": "Bash guard could not parse the hook payload.",
        }}))
        return 0

    if payload.get("tool_name") != "Bash":
        return 0

    command = (payload.get("tool_input") or {}).get("command", "")
    decision, reason = decide(command)
    # Only ever SPEAK to allow. Staying silent on `ask` leaves the harness's own
    # flow untouched, which is the behavior we want for everything unrecognized.
    if decision != "allow":
        return 0
    print(json.dumps({"hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": decision,
        "permissionDecisionReason": reason,
    }}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
