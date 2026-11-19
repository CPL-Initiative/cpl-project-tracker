#!/usr/bin/env python3
"""The sessions' own spend, read from the handoffs' `Spend:` lines, for the Commons ETA clock.

Sam, 2026-11-15 (COBIx's brief on #3358): each session's handoff ends with a `Spend:` line giving the session's model
spend in dollars, from its own cost readout (by model if available), and its start and end times in UTC, so the ETA
chart and the cost lines can use it; "Spend: not available" rather than a guess. This reads that line from every
`docs/session_<N>_handoff.md` and writes `kb/status/session_spend.json`. No billing credentials: the figures are what
each session wrote. Billing totals stay in `kb/reference/model_spend_daily.json`, a separate meter that will not match.

The line's shape (one line, anywhere in the handoff; the first one wins, and the checkpoint's own example is skipped):

    Spend: $123.45 (Opus 5.5 $120.00, Fable 5.2 $3.45); 2026-11-15T17:06Z to 2026-11-15T23:19Z.
    Spend: not available; 2026-11-15T23:38Z to 2026-11-16T01:10Z.

The first dollar figure is the session's total; `Name $x` pairs inside parentheses are its models. A session counts on
the UTC day it ended.

Since S680 (COBIx's Nov 17 brief on #3358) the line may also say what the dollars bought, as `<tag> $x` pairs after the
models and before the times, each tag one of collection, curation or infrastructure:

    Spend: $123.45 (Opus 5.5 $123.45); collection $100.00, curation $20.00, infrastructure $3.45; 2026-11-15T17:06Z to 2026-11-15T23:19Z.

A line without tags reads as before, its dollars untagged. The tags need not add up to the total; what they leave is
`untagged_usd`, and a tag sum past the total is warned about and kept as written. A line without the two times still records the figure, with no day. Older free-text `Spend:`
lines (per-run extraction notes such as "Merced $9.14") do not carry the times and are left out of the daily series.

    python3 kb/_build_session_spend.py           # write kb/status/session_spend.json for a local look (gitignored)
    python3 kb/_build_session_spend.py --out _site/kb/status/session_spend.json   # what pages.yml runs at deploy

The file is built at Pages deploy and never committed (COBIx on #3379): a committed copy rebuilt from every handoff
would fight between parallel PRs, and the daily build may not read docs/.
"""
import argparse
import glob
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = "kb/status/session_spend.json"
# Spend:, **Spend:**, **Spend**: and lowercase spend: all read (COBIx on #3379); Spending: never does.
LINE = re.compile(r"^\s*(?:[-*]\s*)?\**[Ss]pend(?::\**|\**:)\s*(.*)$")
STAMP = r"(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?Z)"
# A daytime session adds a dated section to the newest handoff instead of a new one (S683,
# d-daytime-session-appends-handoff-s683): "## Daytime session, <moniker> (S<N> daytime), <date>". Its own Spend: line,
# under that heading, is session N daytime's figure; the file's first line outside such a section stays session N-1's.
DAYTIME = re.compile(r"^##\s+Daytime session\b.*\(S(\d+) daytime\)")
TIMES = re.compile(STAMP + r"\s*(?:to|–|-)\s*" + STAMP)
USD = re.compile(r"\$\s*([0-9][0-9,]*(?:\.[0-9]+)?)")
MODEL = re.compile(r"([A-Za-z][A-Za-z0-9.-]*(?: [A-Za-z0-9.-]+)*?)\s+\$\s*([0-9][0-9,]*(?:\.[0-9]+)?)")
# What a session's dollars bought (S680): collection, curation or infrastructure, each "<tag> $x".
TAGS = ("collection", "curation", "infrastructure")
TAG = re.compile(r"\b(" + "|".join(TAGS) + r")\s*:?\s*\$\s*([0-9][0-9,]*(?:\.[0-9]+)?)", re.I)
# The examples in .claude/commands/checkpoint.md step 8, pasted bare, are never a session's spend (COBIx on #3379).
EXAMPLE = "$123.45 (Opus 5.5 $123.45); 2026-11-15T17:06Z to 2026-11-15T23:19Z."
EXAMPLES = (EXAMPLE, "$123.45 (Opus 5.5 $123.45); collection $100.00, curation $20.00, infrastructure $3.45; "
                     "2026-11-15T17:06Z to 2026-11-15T23:19Z.")


def money(s):
    return round(float(s.replace(",", "")), 2)


def parse_line(text):
    """One `Spend:` line's body: {usd, models, start, end, day, available} or None when it names no session window."""
    t = TIMES.search(text)
    if not t:
        return None
    body = text[:t.start()]
    na = re.search(r"\bnot available\b", body, re.I) is not None
    m = None if na else USD.search(body)
    models = {}
    p = re.search(r"\(([^)]*)\)", body)
    if p and not na:
        for part in p.group(1).split(","):
            mm = MODEL.search(part.strip())
            if mm:
                models[mm.group(1).strip()] = money(mm.group(2))
            elif "$" in part:
                print("warning: no model name read from %r" % part.strip(), file=sys.stderr)
    tags = {}
    if not na:
        # Outside the models' parentheses only, so a model named like a tag is never read as one.
        for tm in TAG.finditer(re.sub(r"\([^)]*\)", "", body)):
            k = tm.group(1).lower()
            tags[k] = round(tags.get(k, 0.0) + money(tm.group(2)), 2)
    out = {"available": m is not None, "usd": money(m.group(1)) if m else None, "models": models,
           "start": t.group(1), "end": t.group(2), "day": t.group(2)[:10]}
    if tags:
        if out["usd"] is not None and sum(tags.values()) > out["usd"] + 0.005:
            print("warning: the tags add up to $%.2f, past the total $%.2f" % (sum(tags.values()), out["usd"]),
                  file=sys.stderr)
        out["tags"] = tags
    return out


def build(root):
    sessions = []
    for path in glob.glob(os.path.join(root, "docs", "session_*_handoff.md")):
        n = re.search(r"session_(\d+)_handoff\.md$", path)
        if not n:
            continue
        found = None
        daytime = {}
        day_n = None
        with open(path, encoding="utf-8") as f:
            for raw in f:
                dh = DAYTIME.match(raw)
                if dh:
                    day_n = int(dh.group(1))
                    continue
                if raw.startswith("## "):
                    day_n = None
                mm = LINE.match(raw)
                if mm and mm.group(1).strip().strip("`") not in EXAMPLES:
                    got = parse_line(mm.group(1))
                    if not got:
                        continue
                    if day_n is not None:
                        daytime.setdefault(day_n, got)
                    elif found is None:
                        found = got
        if found:
            # The handoff N is written by session N-1: the spend belongs to the writer.
            sessions.append(dict(session=int(n.group(1)) - 1, handoff=os.path.relpath(path, root), **found))
        for dn, got in sorted(daytime.items()):
            sessions.append(dict(session=dn, daytime=True, handoff=os.path.relpath(path, root), **got))
    sessions.sort(key=lambda s: s["session"])
    by_day = {}
    for s in sessions:
        d = by_day.setdefault(s["day"], {"usd": 0.0, "sessions": 0, "not_available": 0})
        if s["available"]:
            d["usd"] = round(d["usd"] + s["usd"], 2)
            d["sessions"] += 1
            # Tags by day only where a session tagged its line, so an untagged day keeps its old shape.
            if s.get("tags") or "tags" in d:
                tg = d.setdefault("tags", {})
                for k, v in (s.get("tags") or {}).items():
                    tg[k] = round(tg.get(k, 0.0) + v, 2)
        else:
            d["not_available"] += 1
    for d in by_day.values():
        if "tags" in d:
            d["untagged_usd"] = round(d["usd"] - sum(d["tags"].values()), 2)
    return {"schema": 1, "source": "the Spend: line of each docs/session_<N>_handoff.md (kb/_build_session_spend.py)",
            "sessions": sessions, "by_day": {k: by_day[k] for k in sorted(by_day)}}


def dump(data):
    return json.dumps(data, indent=1, ensure_ascii=False) + "\n"


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default=ROOT)
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--out", help="write here instead (pages.yml writes it into _site at deploy)")
    a = ap.parse_args(argv)
    text = dump(build(a.root))
    out = a.out or os.path.join(a.root, OUT)
    if a.check:
        cur = open(out, encoding="utf-8").read() if os.path.exists(out) else ""
        if cur != text:
            print("session spend is STALE — run: python3 kb/_build_session_spend.py")
            return 1
        print("session spend: current")
        return 0
    os.makedirs(os.path.dirname(out) or ".", exist_ok=True)
    with open(out, "w", encoding="utf-8") as f:
        f.write(text)
    print("wrote %s (%d sessions with a Spend: line)" % (out, len(json.loads(text)["sessions"])))
    return 0


if __name__ == "__main__":
    sys.exit(main())
