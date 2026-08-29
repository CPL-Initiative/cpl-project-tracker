#!/usr/bin/env python3
"""Context-pressure meter — how close is this session to an auto-compact?

WHY THIS EXISTS (Session 206, 2026-08-29)
-----------------------------------------
Rule 9's original checkpoint trigger read "roughly every ~100K tokens… Claude
Code doesn't expose an exact counter; use proxies." That claim is FALSE, and it
cost us a session: on 2026-08-29 the conversation auto-compacted at 786,077
tokens with a checkpoint 150K tokens stale, and the only warning Sam got was the
compaction itself.

Claude Code writes an EXACT counter to disk, every turn, in the session
transcript (`~/.claude/projects/<slug>/<session-id>.jsonl`):

  * every assistant line carries `message.usage` with `input_tokens`,
    `cache_read_input_tokens`, `cache_creation_input_tokens`. Their sum IS the
    live context size for that turn.
  * every compaction writes a `subtype: compact_boundary` line whose
    `compactMetadata.preTokens` is the exact size at which it fired.

So the trigger does not need a proxy. It needs a file read.

THRESHOLDS ARE DERIVED, NOT PICKED
----------------------------------
The unit of runway is ONE CHECKPOINT, because a checkpoint is the thing the
warning exists to make room for. Measured on this repo's own transcript, a full
Rule 9 checkpoint (13 artifacts) cost 49,723 tokens.

  EMERGENCY  remaining <= 50,000    room for a checkpoint and nothing else
  WARN       remaining <= 110,000   room for the WORST measured turn (50,425)
                                    AND a full checkpoint (49,723), plus slack

WARN is a SUM, not a multiple, and the first draft got this wrong: 2x the
checkpoint cost is 100,000, but one heavy turn plus one checkpoint is 100,148 --
so the "two checkpoints of runway" threshold did not actually fit the two things
it existed to make room for. The test caught it by 336 tokens. Thresholds
derived from a round multiple look principled and are not; these two are the
measured cost of the work the warning is buying time for.

SELF-CALIBRATING
----------------
The compaction point is model- and configuration-dependent, so this does not
hard-code it as truth. It reads every `compact_boundary` in the transcript and
uses the SMALLEST observed auto-compaction (the most conservative real
evidence). `OBSERVED_COMPACT_AT` below is only the fallback for a session that
has not compacted yet, and it is an observation with a date, not a constant.

USAGE
    python3 kb/_context_budget.py                  # human-readable report
    python3 kb/_context_budget.py --json           # machine-readable
    python3 kb/_context_budget.py --transcript P   # explicit transcript
    <hook-json-on-stdin> python3 kb/_context_budget.py --hook

EXIT CODES
    0  ok        3  warn threshold crossed        4  emergency threshold crossed
    1  could not measure (no transcript / no usage rows) -- FAIL SOFT, never
       block a session because the meter itself broke.
"""

import argparse
import glob
import json
import os
import sys

# Observed on 2026-08-29, session 29f0b5fd, claude-opus-5 via the remote
# entrypoint: compactMetadata {trigger: "auto", preTokens: 786077,
# postTokens: 7678, cumulativeDroppedTokens: 778399}. Fallback ONLY -- a
# transcript that has actually compacted overrides this with its own evidence.
OBSERVED_COMPACT_AT = 786_077

# Measured cost of one full Rule 9 checkpoint (13 artifacts), same session:
# context went 634,111 -> 683,834 across the /checkpoint run.
CHECKPOINT_COST = 50_000

# Largest single-turn context growth measured over the same session's last ten
# turns (median 9,715, mean 14,803, max 50,425). One turn really can cost an
# entire checkpoint, so WARN must leave room for a heavy turn AND the checkpoint
# that follows it -- otherwise the warning fires and the runway is already gone.
HEAVY_TURN = 51_000

EMERGENCY_BELOW = CHECKPOINT_COST                       #  50,000
WARN_BELOW = CHECKPOINT_COST + HEAVY_TURN + 9_000       # 110,000

OK, WARN, EMERGENCY, UNKNOWN = "ok", "warn", "emergency", "unknown"


def discover_transcript():
    """Newest .jsonl under ~/.claude/projects/. The live session writes
    continuously, so mtime is a reliable selector."""
    pats = os.path.join(
        os.path.expanduser("~"), ".claude", "projects", "*", "*.jsonl"
    )
    found = glob.glob(pats)
    if not found:
        return None
    return max(found, key=lambda p: os.path.getmtime(p))


def read_transcript(path):
    """Single pass. JSON-parse only the lines that can possibly matter -- a
    substring gate keeps this cheap enough to run from a PostToolUse hook on a
    multi-megabyte transcript."""
    live = None
    boundaries = []
    try:
        with open(path, "r", errors="replace") as fh:
            for line in fh:
                has_usage = '"usage"' in line
                has_bound = "compact_boundary" in line
                if not (has_usage or has_bound):
                    continue
                try:
                    rec = json.loads(line)
                except (ValueError, TypeError):
                    continue
                if has_bound and rec.get("subtype") == "compact_boundary":
                    meta = rec.get("compactMetadata") or {}
                    pre = meta.get("preTokens")
                    if isinstance(pre, int) and pre > 0:
                        boundaries.append(
                            {"pre": pre, "trigger": meta.get("trigger", "?")}
                        )
                usage = (rec.get("message") or {}).get("usage")
                if isinstance(usage, dict):
                    total = (
                        usage.get("input_tokens", 0)
                        + usage.get("cache_read_input_tokens", 0)
                        + usage.get("cache_creation_input_tokens", 0)
                    )
                    if total > 0:
                        live = total
    except OSError:
        return None, []
    return live, boundaries


def measure(path=None):
    path = path or discover_transcript()
    if not path or not os.path.exists(path):
        return {"status": UNKNOWN, "reason": "no transcript found"}

    used, boundaries = read_transcript(path)
    if used is None:
        return {"status": UNKNOWN, "reason": "no usage rows in transcript",
                "transcript": path}

    # Calibrate from real evidence when the session has actually compacted.
    auto = [b["pre"] for b in boundaries if b["trigger"] == "auto"]
    if auto:
        limit, source = min(auto), "observed in this transcript"
    else:
        limit, source = OBSERVED_COMPACT_AT, "fallback (2026-08-29 observation)"

    remaining = limit - used
    warn_at, emerg_at = WARN_BELOW, EMERGENCY_BELOW

    if remaining <= emerg_at:
        status = EMERGENCY
    elif remaining <= warn_at:
        status = WARN
    else:
        status = OK

    return {
        "status": status,
        "transcript": path,
        "used": used,
        "limit": limit,
        "limit_source": source,
        "remaining": remaining,
        "pct": round(100.0 * used / limit, 1) if limit else 0.0,
        "checkpoint_cost": CHECKPOINT_COST,
        "checkpoints_of_runway": round(remaining / CHECKPOINT_COST, 2),
        "warn_below": warn_at,
        "emergency_below": emerg_at,
        "compactions_seen": len(boundaries),
    }


BANNER = {
    WARN: "CONTEXT PRESSURE — checkpoint while you still can",
    EMERGENCY: "CONTEXT EMERGENCY — checkpoint NOW, nothing else",
}


def human(m):
    if m["status"] == UNKNOWN:
        return "context budget: unmeasurable (%s)" % m.get("reason", "?")
    head = "context: {used:,} / {limit:,} ({pct}%) — {remaining:,} left, " \
           "{checkpoints_of_runway} checkpoint(s) of runway".format(**m)
    if m["status"] == OK:
        return head
    return "%s\n%s" % (BANNER[m["status"]], head)


EXIT = {OK: 0, WARN: 3, EMERGENCY: 4, UNKNOWN: 1}


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--transcript", help="path to the session .jsonl")
    ap.add_argument("--json", action="store_true", dest="as_json")
    ap.add_argument("--hook", action="store_true",
                    help="read Claude Code hook JSON from stdin for the path")
    args = ap.parse_args()

    path = args.transcript
    if args.hook and not path:
        try:
            payload = json.loads(sys.stdin.read() or "{}")
            path = payload.get("transcript_path") or None
        except (ValueError, TypeError):
            path = None

    m = measure(path)
    print(json.dumps(m, indent=2) if args.as_json else human(m))
    return EXIT[m["status"]]


if __name__ == "__main__":
    sys.exit(main())
