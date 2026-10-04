#!/usr/bin/env python3
"""The program requirements pilot, extraction pass: draft each record and score it.

Phase 1 of the program requirements harvest
(docs/reference/lanes/program-requirements-harvest.md). The capture pass
(kb/_program_requirements_pilot.py) filed each pilot program's catalog text and
closed course list under kb/program_requirements_pilot/sources/. This pass
reads those files and nothing else: it never loads a college's site. For each
program it posts the text and the closed list to the
program-requirements-extract Edge Function (Sam's call 6 on sheet 23: model
calls go through an Edge Function that holds the Anthropic key), then scores
the record it gets back against the closed list
(kb/_program_requirements_score.py): coverage, no invented courses, unit
arithmetic. The scorer also reads the catalog text, so a record that states no
figure passes only when the page prints none. The fourth check is Sam's
reading of the same 20 programs.

It writes nothing. It prints a line per program and one JSON object per
program between markers, which a session reads from the job log and files.
The cost of each call is priced from the usage the function returns, so the
pilot can compare methods by cost per program (the plan's fifth measure).

Run (on the runner, with SUPABASE_SERVICE_KEY):
    python3 kb/_program_requirements_extract.py [--only TEXT]
"""
from __future__ import annotations

import argparse
import glob
import json
import os
import sys
import time
import urllib.error
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from _program_requirements_score import score  # noqa: E402

SOURCES = os.path.join(HERE, "program_requirements_pilot", "sources")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://hvuwhnbuahrtptokpqfh.supabase.co").rstrip("/")
FUNCTION = "program-requirements-extract"
MIN_COVERAGE = 0.5      # a fixture whose page named fewer listed codes was not the program's page

# Dollars per million tokens, Claude Opus 5.5 (claude-api skill, cached 2026-09-25).
PRICE = {"claude-opus-5-5": {"input": 4.00, "output": 20.00, "cache_read": 0.20, "cache_write": 5.00}}


def load_sources(only: str = "") -> list[dict]:
    out = []
    for path in sorted(glob.glob(os.path.join(SOURCES, "*.json"))):
        with open(path) as fh:
            src = json.load(fh)
        if only and only.lower() not in (src["college"] + " " + src["control_number"]).lower():
            continue
        src["_file"] = os.path.relpath(path, os.path.dirname(HERE))
        out.append(src)
    return out


def cost(model: str | None, usage: dict | None) -> float | None:
    """The call's price from its usage. A fallback model the table does not
    price reads None rather than a wrong number."""
    p, u = PRICE.get(model or ""), usage or {}
    if not p:
        return None
    return round((u.get("input_tokens", 0) * p["input"]
                  + u.get("output_tokens", 0) * p["output"]
                  + (u.get("cache_read_input_tokens") or 0) * p["cache_read"]
                  + (u.get("cache_creation_input_tokens") or 0) * p["cache_write"]) / 1e6, 5)


def call(src: dict, key: str) -> dict:
    body = {"college": src["college"], "title": src["title"], "award": src["award"],
            "catalog_year": src.get("catalog_year"), "source_url": (src.get("source") or {}).get("url"),
            "text": src["text"], "closed_list": src["closed_list"]}
    req = urllib.request.Request(
        "%s/functions/v1/%s" % (SUPABASE_URL, FUNCTION), data=json.dumps(body).encode(),
        headers={"Authorization": "Bearer " + key, "apikey": key,
                 "Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=300) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as exc:
        return {"error": "HTTP %d: %s" % (exc.code, exc.read().decode()[:300])}
    except Exception as exc:
        return {"error": str(exc).splitlines()[0][:300]}


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--only", default="", help="programs whose college or number contains this")
    args = ap.parse_args(argv)
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not key:
        print("SUPABASE_SERVICE_KEY is not set; the Edge Function takes only the service key.")
        return 2
    sources = [s for s in load_sources(args.only) if (s.get("coverage") or 0) >= MIN_COVERAGE]
    print("program requirements pilot, extraction: %d programs, writes nothing" % len(sources), flush=True)
    rows = []
    for src in sources:
        t0 = time.time()
        got = call(src, key)
        rec = got.get("record")
        sc = score(rec, src["closed_list"], src["text"]) if isinstance(rec, dict) else None
        row = {"college": src["college"], "control_number": src["control_number"],
               "shape": src["shape"], "title": src["title"], "source_file": src["_file"],
               "model": got.get("model"), "stop_reason": got.get("stop_reason"),
               "usage": got.get("usage"), "cost_usd": cost(got.get("model"), got.get("usage")),
               "ms": got.get("ms"), "seconds": round(time.time() - t0, 1),
               "error": got.get("error"), "score": sc, "record": rec}
        rows.append(row)
        print("%-26s %-6s %-20s %s cov %-5s inv %-2s arith %-10s $%s  %s" % (
            src["college"][:26], src["control_number"], src["shape"],
            "PASS" if sc and sc["pass"] else "fail",
            sc and sc["coverage"]["share"], sc and sc["invented"]["count"],
            sc and sc["arithmetic"]["status"], row["cost_usd"], row["error"] or ""), flush=True)
    total = sum(r["cost_usd"] or 0 for r in rows)
    print("\npassed %d of %d; model cost $%.4f ($%.4f a program)" % (
        sum(1 for r in rows if r["score"] and r["score"]["pass"]), len(rows), total,
        total / len(rows) if rows else 0))
    print("=== PILOT RECORDS JSON BEGIN ===")
    for r in rows:
        print(json.dumps(r, ensure_ascii=False))
    print("=== PILOT RECORDS JSON END ===")
    return 0


if __name__ == "__main__":
    sys.exit(main())
