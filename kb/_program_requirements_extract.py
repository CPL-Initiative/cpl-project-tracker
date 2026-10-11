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
import difflib
import glob
import json
import math
import os
import re
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from _program_requirements_score import score  # noqa: E402
from _program_requirements_pilot import code_pattern, find_codes, norm_code  # noqa: E402

SOURCES = os.path.join(HERE, "program_requirements_pilot", "sources")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://hvuwhnbuahrtptokpqfh.supabase.co").rstrip("/")
FUNCTION = "program-requirements-extract"
MIN_COVERAGE = 0.5      # a fixture whose page named fewer listed codes was not the program's page
# The record shape the function writes (its header names each version). Shape 3
# (S334, Sam's sheet 33 card 4): program and course outcomes as printed, which
# the scorer checks word for word against the catalog text. Shape 4 (S360, Sam's
# rules 4 and 5, Open Asks Sheet 61 card 1): a block of rule "recommended" for
# courses the catalog recommends, and program.careers as printed.
RECORD_SHAPE = 4

# A program read in parts (S361; Sam, 2026-10-11: "go with splitting the program
# into two calls"). A record holds about 54 output tokens per course: 215 listed
# courses came to about 11,500 of a call's 16,000 in about 80 s, and Humanities,
# Philosophy & Arts (316) ran past it at all three RCCD colleges. The gateway
# ends a request that sends nothing back for 150 s (Mt. San Antonio 24171), so
# one longer call cannot hold such a record. The function's version 6 reads one
# part of it; call() sends the parts at once and merge_parts() joins them.
SPLIT_AT = 240     # listed courses above which a program is read in parts from the start
PART_SIZE = 200    # listed courses one part carries at most
SPLIT_WHEN = ("ran past max_tokens", "IDLE_TIMEOUT")   # a single call's error that sends it to parts

# Dollars per million tokens, Claude Opus 5.5 (claude-api skill, cached 2026-09-25).
PRICE = {"claude-opus-5-5": {"input": 4.00, "output": 20.00, "cache_read": 0.20, "cache_write": 5.00}}


def load_sources(only: str = "") -> list[dict]:
    out = []
    for path in sorted(glob.glob(os.path.join(SOURCES, "*.json"))):
        with open(path) as fh:
            src = json.load(fh)
        # A comma-separated list matches any of its parts ("cerritos_41982,ivc,smc"), the file's name included.
        hay = (src["college"] + " " + src["control_number"] + " " + os.path.basename(path)).lower()
        if only and not any(t.strip().lower() in hay for t in only.split(",") if t.strip()):
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
    """The record for one program: one call, or, for a program too long for one
    reply, a call per part (call_in_parts). A single call that runs past
    max_tokens or the gateway's idle limit is read again in parts."""
    body = {"college": src["college"], "title": src["title"], "award": src["award"],
            "catalog_year": src.get("catalog_year"), "source_url": (src.get("source") or {}).get("url"),
            "text": src["text"], "closed_list": src["closed_list"]}
    if len(src["closed_list"]) > SPLIT_AT:
        return call_in_parts(src, key, body)
    got = _post(body, key)
    if any(w in (got.get("error") or "") for w in SPLIT_WHEN):
        return call_in_parts(src, key, body, first=got)
    return got


def _post(body: dict, key: str) -> dict:
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


def split_codes(closed: list[dict], text: str, n: int) -> list[list[str]]:
    """The closed list in n parts, by where each course first appears in the
    catalog text, so each part reads about 1/n of the section and its blocks.
    The courses the text never names come last (the last part reports them in
    missing_explained). Each part is non-empty; fewer courses than n give fewer
    parts."""
    seen, uniq = set(), []
    for c in closed:
        k = norm_code(c.get("code"))
        if k and k not in seen:
            seen.add(k)
            uniq.append(c["code"])
    found = find_codes(text or "", [{"code": c} for c in uniq])
    order = [c for _, _, c in sorted((min(found[norm_code(c)]), i, c)
                                     for i, c in enumerate(uniq) if norm_code(c) in found)]
    order += [c for c in uniq if norm_code(c) not in found]
    n = max(1, min(n, len(order)))
    size = math.ceil(len(order) / n) if order else 1
    return [p for p in (order[i * size:(i + 1) * size] for i in range(n)) if p]


def _block_key(b: dict) -> tuple:
    return (re.sub(r"\s+", " ", (b.get("name") or "").strip().lower()), b.get("rule"))


def _codes_in(entry: dict) -> list[str]:
    return [norm_code(x.get("code") if isinstance(x, dict) else x)
            for x in [entry] + list(entry.get("alternatives") or []) if x]


def _merge_block(a: dict, b: dict, part: int, problems: list[str]) -> dict:
    out = dict(a, courses=list(a.get("courses") or []) + list(b.get("courses") or []))
    for f in ("minimum", "option_group"):
        if out.get(f) is None:
            out[f] = b.get(f)
        elif b.get(f) is not None and b.get(f) != out.get(f):
            problems.append("the parts read '%s' with different %s (%s; part %d: %s)"
                            % (a.get("name"), f, out.get(f), part, b.get(f)))
    sa, sb = a.get("stated") or {}, b.get("stated") or {}
    if sa.get("min") is None and sa.get("max") is None:
        out["stated"] = {"min": sb.get("min"), "max": sb.get("max")}
    elif (sb.get("min"), sb.get("max")) not in ((None, None), (sa.get("min"), sa.get("max"))):
        problems.append("the parts read '%s' with different stated totals (%s-%s; part %d: %s-%s)"
                        % (a.get("name"), sa.get("min"), sa.get("max"), part, sb.get("min"), sb.get("max")))
    return out


def merge_parts(records: list[dict], text: str) -> tuple[dict, list[str]]:
    """One record from the parts of a program read in parts. Blocks align by
    name and rule in the catalog's order (a block one part left out is kept from
    the other); each block's entries join, an entry whose first code the block
    already places is dropped, and the entries take the catalog's order. Outcomes,
    missing_explained and notes join; program comes from part 1, its outcomes and
    careers from the first part that read any. A disagreement the merge cannot
    settle (two stated totals, blocks named differently) is returned and kept in
    notes for the reviewer."""
    problems: list[str] = []
    base = records[0]
    blocks = [dict(b, courses=list(b.get("courses") or [])) for b in base.get("blocks") or []]
    for part, rec in enumerate(records[1:], start=2):
        other = rec.get("blocks") or []
        sm = difflib.SequenceMatcher(a=[_block_key(b) for b in blocks],
                                     b=[_block_key(b) for b in other], autojunk=False)
        merged = []
        for tag, a0, a1, b0, b1 in sm.get_opcodes():
            if tag == "equal":
                merged += [_merge_block(blocks[a0 + k], other[b0 + k], part, problems) for k in range(a1 - a0)]
                continue
            if tag == "replace":
                problems.append("part %d names blocks part 1 does not: %s (kept beside %s)" % (
                    part, ", ".join("'%s'" % b.get("name") for b in other[b0:b1]),
                    ", ".join("'%s'" % b.get("name") for b in blocks[a0:a1])))
            merged += blocks[a0:a1] + [dict(b, courses=list(b.get("courses") or [])) for b in other[b0:b1]]
        blocks = merged

    def positions(code: str) -> list[int]:
        pat = code_pattern(code or "")
        return [m.start() for m in pat.finditer(text or "")] if pat else []

    # The catalog prints its blocks in order, so each entry is placed at its
    # code's first appearance after the previous block's last course: a course
    # printed in two blocks (AAA 1 required, and again among the electives)
    # sorts by where this block prints it.
    end = 0
    placed: set[str] = set()
    for b in blocks:
        kept, here = [], set()
        for c in b["courses"]:
            codes = _codes_in(c)
            if not codes or codes[0] in here:
                continue
            here.update(codes)
            kept.append(c)
        at = []
        for i, c in enumerate(kept):
            ps = positions(c.get("code"))
            later = [p for p in ps if p >= end]
            at.append((later[0] if later else (ps[0] if ps else math.inf), i, c))
        at.sort(key=lambda o: (o[0], o[1]))
        b["courses"] = [c for _, _, c in at]
        found = [p for p, _, _ in at if p != math.inf]
        end = max(found) if found else end
        placed |= here

    program = dict(base.get("program") or {})
    for f in ("outcomes", "careers"):
        if not program.get(f):
            program[f] = next((r["program"][f] for r in records[1:]
                               if (r.get("program") or {}).get(f)), program.get(f) or [])
    outs, seen_out = [], set()
    for r in records:
        for o in r.get("course_outcomes") or []:
            k = norm_code(o.get("code"))
            if k not in seen_out:
                seen_out.add(k)
                outs.append(o)
    missing, seen_m = [], set()
    for r in records:
        for m in r.get("missing_explained") or []:
            k = norm_code(m.get("code"))
            if k and k not in placed and k not in seen_m:
                seen_m.add(k)
                missing.append(m)
    notes = list(base.get("notes") or [])
    for part, r in enumerate(records[1:], start=2):
        notes += ["Part %d: %s" % (part, n) for n in r.get("notes") or []]
    notes.append("Read in %d parts, because one reply could not hold the whole record." % len(records))
    notes += ["Reviewer: " + p for p in problems]
    return {"program": program, "blocks": blocks, "course_outcomes": outs,
            "missing_explained": missing, "notes": notes}, problems


def _sum_usage(results: list[dict]) -> dict:
    total: dict = {}
    for r in results:
        for k, v in (r.get("usage") or {}).items():
            if isinstance(v, (int, float)) and not isinstance(v, bool):
                total[k] = total.get(k, 0) + v
    return total


def call_in_parts(src: dict, key: str, body: dict, first: dict | None = None,
                  post=None) -> dict:
    """The record read in parts, sent at once. The usage covers every call made
    for the program, a single call that failed first included, so the cost is
    what the program spent."""
    post = post or _post
    closed = src["closed_list"]
    parts = split_codes(closed, src["text"], max(2, math.ceil(len(closed) / PART_SIZE)))
    bodies = [dict(body, part={"index": i + 1, "of": len(parts), "codes": codes})
              for i, codes in enumerate(parts)]
    with ThreadPoolExecutor(max_workers=len(bodies)) as pool:
        gots = list(pool.map(lambda b: post(b, key), bodies))
    every = ([first] if first else []) + gots
    models = {g.get("model") for g in every if g.get("model")}
    out = {"model": models.pop() if len(models) == 1 else None, "usage": _sum_usage(every),
           "ms": (first or {}).get("ms", 0) + max((g.get("ms") or 0) for g in gots),
           "parts": len(parts),
           "split_because": (first or {}).get("error") or "the closed list holds %d courses" % len(closed),
           "stop_reason": None, "record": None, "error": None}
    for i, g in enumerate(gots, start=1):
        if g.get("error") or not isinstance(g.get("record"), dict):
            out["stop_reason"] = g.get("stop_reason")
            out["error"] = "part %d of %d: %s" % (i, len(gots), g.get("error") or "no record")
            return out
    out["record"], _ = merge_parts([g["record"] for g in gots], src["text"])
    out["stop_reason"] = gots[-1].get("stop_reason")
    return out


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--only", default="", help="programs whose college, number or file name contains this (comma-separated: any)")
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
               "record_shape": RECORD_SHAPE,
               "model": got.get("model"), "stop_reason": got.get("stop_reason"),
               "usage": got.get("usage"), "cost_usd": cost(got.get("model"), got.get("usage")),
               "ms": got.get("ms"), "seconds": round(time.time() - t0, 1), "parts": got.get("parts"),
               "error": got.get("error"), "score": sc, "record": rec}
        rows.append(row)
        print("%-26s %-6s %-20s %s cov %-5s inv %-2s arith %-10s out %-7s $%s  %s" % (
            src["college"][:26], src["control_number"], src["shape"],
            "PASS" if sc and sc["pass"] else "fail",
            sc and sc["coverage"]["share"], sc and sc["invented"]["count"],
            sc and sc["arithmetic"]["status"],
            sc and "%d%s" % (sc["outcomes"]["count"], "" if sc["outcomes"]["pass"] else " BAD"),
            row["cost_usd"], row["error"] or ""), flush=True)
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
