#!/usr/bin/env python3
"""kb/_build_session_spend.py: the sessions' own spend from the handoffs' Spend: lines (Sam, 2026-11-15, #3358).

Guards the failure modes: a free-text extraction note read as a session's spend; "not available" read as $0; a model's
figure added to the total; a session credited to the handoff's number rather than the session that wrote it; a day
taken from the start rather than the end; the file committed or built where the daily rebase logic would miss a docs change.

Run from repo root: python3 tests/session_spend_build_test.py
"""
import importlib.util
import os
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("ss", os.path.join(ROOT, "kb", "_build_session_spend.py"))
ss = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ss)
results = []


def check(name, cond, detail=""):
    results.append(bool(cond))
    print(("PASS " if cond else "FAIL ") + name + ((" — " + str(detail)) if (detail and not cond) else ""))


a = ss.parse_line("$123.45 (Opus 5.5 $120.00, Fable 5.2 $3.45); 2026-11-15T22:06Z to 2026-11-16T01:19Z.")
check("a total, its models, and the day the session ended", a and a["usd"] == 123.45 and a["models"] == {"Opus 5.5": 120.0, "Fable 5.2": 3.45}
      and a["day"] == "2026-11-16" and a["start"] == "2026-11-15T22:06Z", a)
na = ss.parse_line("not available; 2026-11-15T23:38Z to 2026-11-16T01:10Z.")
check("not available is no figure, never $0", na and na["available"] is False and na["usd"] is None, na)
check("a free-text extraction note with no session window is left out", ss.parse_line("Merced $9.14, De Anza's six about $0.50.") is None)
check("a thousands separator reads", ss.parse_line("$1,826.40; 2026-11-13T01:00Z to 2026-11-13T09:00Z")["usd"] == 1826.4)

with tempfile.TemporaryDirectory() as tmp:
    os.makedirs(os.path.join(tmp, "docs"))
    files = {"session_700_handoff.md": "# x\n\nSpend: $10.00 (Opus 5.5 $10.00); 2026-11-20T01:00Z to 2026-11-20T03:00Z.\n",
             "session_701_handoff.md": "- Spend: not available; 2026-11-20T04:00Z to 2026-11-20T05:00Z.\n",
             "session_702_handoff.md": "Spend: $2.50; 2026-11-20T06:00Z to 2026-11-20T07:00Z.\n",
             "session_703_handoff.md": "- Spend: Merced $9.14.\n"}
    for k, v in files.items():
        with open(os.path.join(tmp, "docs", k), "w", encoding="utf-8") as f:
            f.write(v)
    d = ss.build(tmp)
    check("handoff N's line is session N-1's spend", [s["session"] for s in d["sessions"]] == [699, 700, 701], d["sessions"])
    check("a day sums the sessions that gave a figure and counts the ones that did not",
          d["by_day"] == {"2026-11-20": {"usd": 12.5, "sessions": 2, "not_available": 1}}, d["by_day"])

m = ss.parse_line("$9.00 (Claude Opus 5.5 $8.00, sonnet-4 $1.00); 2026-11-20T01:00Z to 2026-11-20T02:00Z")
check("a two-word or hyphenated model name reads whole", m["models"] == {"Claude Opus 5.5": 8.0, "sonnet-4": 1.0}, m["models"])
with tempfile.TemporaryDirectory() as tmp:
    os.makedirs(os.path.join(tmp, "docs"))
    with open(os.path.join(tmp, "docs", "session_800_handoff.md"), "w", encoding="utf-8") as f:
        f.write("Spending notes: $5 ; 2026-11-20T01:00Z to 2026-11-20T02:00Z\n"
                "Spend: `" + ss.EXAMPLE + "`\n"
                "Spend: $7.00; 2026-11-21T01:00Z to 2026-11-21T02:00Z.\n"
                "Spend: $8.00; 2026-11-22T01:00Z to 2026-11-22T02:00Z.\n")
    got = ss.build(tmp)["sessions"]
    check("Spend: needs its colon, the checkpoint's example is skipped, and the first real line wins",
          len(got) == 1 and got[0]["usd"] == 7.0, got)
for form in ("Spend:", "**Spend:**", "**Spend**:", "spend:", "- **Spend**:"):
    mm = ss.LINE.match(form + " $3.00; 2026-11-23T01:00Z to 2026-11-23T02:00Z.")
    check("the line reads as " + form, mm is not None and ss.parse_line(mm.group(1))["usd"] == 3.0)
check("Spending: is never a Spend line", ss.LINE.match("Spending: $3.00; 2026-11-23T01:00Z to 2026-11-23T02:00Z") is None)
_pg = open(os.path.join(ROOT, ".github", "workflows", "pages.yml"), encoding="utf-8").read()
check("the cache-busting comment sits over the stamp step, after the spend step",
      _pg.index("Build the sessions' spend") < _pg.index("# Cache-bust the published assets") < _pg.index("Stamp asset versions"))
# Built at Pages deploy into _site, never committed: two handoff PRs never fight over it (COBIx on #3379), and the
# daily build, which may not read docs/, never runs it.
_rd = lambda *p: open(os.path.join(ROOT, *p), encoding="utf-8").read()
check("Pages builds the file into _site at deploy; the daily build never runs it; git ignores it",
      "python3 kb/_build_session_spend.py --out _site/kb/status/session_spend.json" in _rd(".github", "workflows", "pages.yml")
      and "_build_session_spend" not in _rd("scripts", "daily_build.sh")
      and "kb/status/session_spend.json" in _rd(".gitignore").split()
      and "session_spend" not in _rd(".github", "pages_allowlist.txt"))
with tempfile.TemporaryDirectory() as tmp:
    o = os.path.join(tmp, "_site", "kb", "status", "session_spend.json")
    r = subprocess.run([sys.executable, os.path.join(ROOT, "kb", "_build_session_spend.py"), "--out", o], capture_output=True, text=True)
    check("--out writes the file where the deploy asks, making its folders", r.returncode == 0 and os.path.exists(o), r.stderr)

print("\n%d/%d checks passed" % (sum(results), len(results)))
sys.exit(0 if all(results) else 1)
