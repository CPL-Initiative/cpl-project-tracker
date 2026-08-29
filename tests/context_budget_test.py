#!/usr/bin/env python3
"""
kb/_context_budget.py + scripts/context-pressure-hook.sh — the compact warning.

WHY THIS TEST EXISTS
--------------------
On 2026-08-29 this session auto-compacted at 786,077 tokens with a checkpoint
150K tokens stale. Nothing warned, because Rule 9's trigger said "Claude Code
doesn't expose an exact counter; use proxies" — a condition nothing can
observe, and the same defect that left `04-projects/` 41 days stale behind
"when the run worked inside a project folder".

The claim was false. Claude Code writes the exact counter to the transcript
every turn, and writes `compactMetadata.preTokens` at every compaction. The
meter reads it. This test pins the three ways that could quietly stop being
true:

  1. **A threshold that fires too late is the original bug.** The regression
     check replays the REAL context values from 2026-08-29 and asserts the
     warning arrives with at least two checkpoints of runway — not that it
     arrives at all. A warning at 780K would "pass" a naive test and still lose
     the session.

  2. **A threshold that fires too early gets tuned out**, which is its own kind
     of not-firing. So it must stay quiet at 633,409 — the point where Sam had
     just asked for a checkpoint and got one.

  3. **Announce-once must not become announce-never.** The state file that stops
     the hook shouting on every tool call is one typo away from suppressing the
     escalation to EMERGENCY too.

Run: `python3 tests/context_budget_test.py` (also a CI step in
.github/workflows/js-tests.yml).
"""
import json
import os
import shutil
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
METER = os.path.join(ROOT, "kb", "_context_budget.py")
HOOK = os.path.join(ROOT, "scripts", "context-pressure-hook.sh")

CHECKS = []


def check(name, ok, why=""):
    CHECKS.append((name, bool(ok), why))


def transcript(path, context, boundaries=()):
    """A minimal transcript: optional compact_boundary lines, then a usage row.
    Order matters — the meter must take the NEWEST usage row, so a boundary
    written before it must not be mistaken for the live size."""
    with open(path, "w") as fh:
        for pre, trigger in boundaries:
            fh.write(json.dumps({
                "type": "system", "subtype": "compact_boundary",
                "compactMetadata": {"trigger": trigger, "preTokens": pre},
            }) + "\n")
        fh.write(json.dumps({
            "type": "assistant",
            "message": {"usage": {
                "input_tokens": 2,
                "cache_read_input_tokens": context - 2,
                "cache_creation_input_tokens": 0,
                "output_tokens": 10,
            }},
        }) + "\n")
    return path


def meter(path):
    r = subprocess.run([sys.executable, METER, "--transcript", path, "--json"],
                       capture_output=True, text=True, cwd=ROOT)
    try:
        return r.returncode, json.loads(r.stdout)
    except ValueError:
        return r.returncode, {}


def run_hook(home, path, session):
    payload = json.dumps({"transcript_path": path, "session_id": session,
                          "cwd": ROOT})
    env = dict(os.environ, HOME=home)
    env.pop("CLAUDE_PROJECT_DIR", None)
    r = subprocess.run([HOOK], input=payload, capture_output=True, text=True,
                       env=env, cwd=ROOT)
    return r.returncode, r.stderr


def _report():
    passed = 0
    for name, ok, why in CHECKS:
        print(("  ok  " if ok else "FAIL  ") + name
              + (("\n        > " + why) if (not ok and why) else ""))
        if ok:
            passed += 1
    print("\ncontext_budget_test.py: %d/%d checks passed" % (passed, len(CHECKS)))
    return 0 if passed == len(CHECKS) else 1


tmp = tempfile.mkdtemp()
try:
    # ---- (1) thresholds ---------------------------------------------------
    code_ok, m_ok = meter(transcript(os.path.join(tmp, "a.jsonl"), 400_000))
    code_w, m_w = meter(transcript(os.path.join(tmp, "b.jsonl"), 700_000))
    code_e, m_e = meter(transcript(os.path.join(tmp, "c.jsonl"), 760_000))
    check("(1a) comfortable context is 'ok' / exit 0",
          code_ok == 0 and m_ok.get("status") == "ok")
    check("(1b) a heavy-turn-plus-checkpoint of runway warns / exit 3",
          code_w == 3 and m_w.get("status") == "warn")
    check("(1c) one checkpoint of runway is an emergency / exit 4",
          code_e == 4 and m_e.get("status") == "emergency")

    # ---- (2) self-calibration --------------------------------------------
    _, m_cal = meter(transcript(os.path.join(tmp, "d.jsonl"), 300_000,
                                [(500_000, "auto")]))
    check("(2a) an observed auto-compaction overrides the fallback ceiling",
          m_cal.get("limit") == 500_000,
          "hard-coding 786,077 as truth breaks on a different model/config")
    _, m_two = meter(transcript(os.path.join(tmp, "e.jsonl"), 300_000,
                                [(600_000, "auto"), (500_000, "auto")]))
    check("(2b) multiple observations take the conservative minimum",
          m_two.get("limit") == 500_000)
    _, m_man = meter(transcript(os.path.join(tmp, "f.jsonl"), 300_000,
                                [(200_000, "manual")]))
    check("(2c) a MANUAL /compact is not evidence of the auto ceiling",
          m_man.get("limit") != 200_000,
          "a user compacting early would permanently mis-calibrate the meter")

    # ---- (3) post-compaction reads the newest row, not the peak ----------
    _, m_post = meter(transcript(os.path.join(tmp, "g.jsonl"), 8_000,
                                 [(786_077, "auto")]))
    check("(3) after a compaction the meter reports the SMALL live context",
          m_post.get("used") == 8_000 and m_post.get("status") == "ok",
          "reporting the pre-compaction peak would warn forever after")

    # ---- (4) fail soft ----------------------------------------------------
    empty = os.path.join(tmp, "empty.jsonl")
    open(empty, "w").close()
    code_empty, _ = meter(empty)
    check("(4a) a transcript with no usage rows is unmeasurable, not a crash",
          code_empty == 1)
    code_missing, _ = meter(os.path.join(tmp, "nope.jsonl"))
    check("(4b) a missing transcript is unmeasurable, not a crash",
          code_missing == 1)

    # ---- (5) the hook: announce once, escalate once ----------------------
    # The hook fail-softs to exit 0 when jq is absent (by design -- a broken
    # meter must never block a session). On a runner without jq that would
    # surface below as a *threshold* failure, which is a symptom naming the
    # wrong thing -- a mistake this session made three times in one day. Say it
    # plainly instead.
    if shutil.which("jq") is None:
        check("(5) hook checks SKIPPED — jq absent, not a threshold failure",
              False, "install jq to exercise the hook; the meter checks above "
                     "still ran and are the substance of this guard")
        raise SystemExit(_report())
    home = os.path.join(tmp, "home")
    os.makedirs(os.path.join(home, ".claude"))
    warn_t = transcript(os.path.join(tmp, "w.jsonl"), 700_000)
    emerg_t = transcript(os.path.join(tmp, "x.jsonl"), 760_000)
    ok_t = transcript(os.path.join(tmp, "o.jsonl"), 400_000)

    c1, e1 = run_hook(home, warn_t, "S")
    c2, _ = run_hook(home, warn_t, "S")
    c3, e3 = run_hook(home, emerg_t, "S")
    c4, _ = run_hook(home, emerg_t, "S")
    c5, _ = run_hook(home, warn_t, "S")
    c6, _ = run_hook(home, ok_t, "S")
    check("(5a) the first warn speaks, with exit 2 so Claude actually sees it",
          c1 == 2 and "CONTEXT PRESSURE" in e1,
          "exit 0 would print into the void")
    check("(5b) a repeated warn stays quiet", c2 == 0)
    check("(5c) warn ESCALATES to emergency", c3 == 2 and "EMERGENCY" in e3)
    check("(5d) the emergency names the reduced artifact set, not all 13",
          "session_<N+1>_handoff.md" in e3 and "DEFERRED" in e3,
          "a full checkpoint does not fit in one checkpoint of runway")
    check("(5e) a repeated emergency stays quiet", c4 == 0)
    check("(5f) falling back to warn does not re-announce", c5 == 0)
    check("(5g) comfortable context is silent", c6 == 0)

    c7, _ = run_hook(home, warn_t, "OTHER-SESSION")
    check("(5h) a different session gets its own warning",
          c7 == 2, "state keyed globally would mute every later session")

    r_garbage = subprocess.run([HOOK], input="not json", capture_output=True,
                               text=True, env=dict(os.environ, HOME=home),
                               cwd=ROOT)
    check("(5i) garbage input fails soft", r_garbage.returncode == 0,
          "a broken meter must never block a session")

    # ---- (6) REGRESSION: the failure we actually had ---------------------
    # Real context values from session 29f0b5fd, 2026-08-29, which auto-
    # compacted at 786,077 with the checkpoint 150K stale.
    _, at_ckpt = meter(transcript(os.path.join(tmp, "r1.jsonl"), 633_409))
    check("(6a) quiet at 633,409 — Sam had just asked for a checkpoint",
          at_ckpt.get("status") == "ok",
          "crying wolf right after a checkpoint is how a warning gets ignored")

    _, at_warn = meter(transcript(os.path.join(tmp, "r2.jsonl"), 686_967))
    check("(6b) warns at 686,967 — 8 human turns before the real compaction",
          at_warn.get("status") == "warn")
    # The guarantee is a property of the THRESHOLD, not of any sample point:
    # once warned, a session must be able to absorb its worst measured turn and
    # still afford a full checkpoint. 50,425 + 49,723 = 100,148.
    check("(6c) the warn threshold fits a heavy turn AND a full checkpoint",
          at_warn.get("warn_below", 0) >= 50_425 + 49_723,
          "a 100,000 threshold misses this by 336 tokens and still 'passes'")

    _, at_late = meter(transcript(os.path.join(tmp, "r3.jsonl"), 780_941))
    check("(6d) the last pre-compaction turn is a full emergency",
          at_late.get("status") == "emergency"
          and at_late.get("remaining", 1e9) < 49_723)
finally:
    shutil.rmtree(tmp, ignore_errors=True)

sys.exit(_report())
