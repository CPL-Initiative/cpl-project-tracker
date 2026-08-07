#!/usr/bin/env python3
"""Governance drift detector — what OUGHT to be on the register but isn't.

WHY THIS EXISTS (Sam, 2026-08-07, OQ-08)
----------------------------------------
`kb/governance_register.json` is hand-authored. The system grows surfaces far
faster than anyone remembers to add rows, and the only detector today is a human
noticing: Sam noticed Sierra was missing from the register; nothing else would
have. Measured that day — 6 cadences listed against 9 scheduled workflows,
11 decision rights against dozens of write-capable tables.

WHAT IT DOES NOT DO
-------------------
It PROPOSES. It never adds a row. `decides`, `load_bearing` and `when_empty` are
judgment, and a register auto-filled with 50 plausible rows nobody decided would
be governance theatre — the exact failure the tab exists to expose. Its whole
credibility rests on every row being deliberate.

THE NOISE PROBLEM IS THE DESIGN PROBLEM
---------------------------------------
A detector that proposes 50 things proposes nothing. That is not hypothetical
here: the Sierra feedback queue went unread for five weeks partly because 28 of
its 53 rows were our own CI smoke test. So every scan below carries a filter
whose job is to *not* report things, and `kb/governance_surface_map.json` is the
persistent memory of what has already been judged — mapped to a row, or
dismissed with a reason. A candidate is something nobody has ruled on yet.

Dismissal lives in a committed file rather than a database on purpose: the
reason is reviewable in a diff, and it cannot silently diverge from the register
it annotates.

PURE STATIC ANALYSIS — no Supabase, no secrets, no network. The filter we want
for tables ("ones a human curates through the dashboard") is *definitionally*
discoverable from the consumer JS, so the DB is not needed to find it.

Run:  python kb/_build_governance_candidates.py [--check]
      --check exits 1 if the committed artifact is stale (for CI).
"""
from __future__ import annotations

import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REGISTER = os.path.join(ROOT, "kb", "governance_register.json")
SURFACE_MAP = os.path.join(ROOT, "kb", "governance_surface_map.json")
OUT = os.path.join(ROOT, "kb", "governance_candidates.json")
WORKFLOWS = os.path.join(ROOT, ".github", "workflows")
DASHBOARD = os.path.join(ROOT, "CPL_Dashboard.html")

# Quality gates, not governance loops. A scheduled job only earns a cadence row
# when a HUMAN owns its outcome; nobody is accountable for "CodeQL ran".
CI_HYGIENE = {"codeql.yml", "secret-scan.yml", "js-tests.yml"}

# Table-name shapes that are derived, append-only or pipeline-internal. These are
# artifacts OF decisions, not surfaces WHERE decisions are made.
DERIVED_SUFFIXES = ("_log", "_cache", "_history", "_snapshot", "_seed", "_out",
                    "_staging", "_tmp", "_audit", "_probe", "_raw")

WRITE_METHODS = ("POST", "PATCH", "PUT", "DELETE")
# How far after a table reference we look for the method that writes it.
WRITE_WINDOW = 400


def read_json(path, default=None):
    try:
        with open(path, "r", encoding="utf-8") as fh:
            return json.load(fh)
    except FileNotFoundError:
        return default if default is not None else {}


def js_files():
    """Consumer JS at the repo root — the tab implementations."""
    return sorted(f for f in os.listdir(ROOT)
                  if f.endswith(".js") and not f.startswith("."))


def scan_workflows(register):
    """Scheduled workflows with no cadence row.

    Rule: a .yml under .github/workflows with a `schedule:` trigger, excluding
    the CI-hygiene denylist. Highest-signal scan — each hit is unambiguously a
    recurring loop, and there is no judgment call about whether it runs.
    """
    out = []
    if not os.path.isdir(WORKFLOWS):
        return out
    for fn in sorted(os.listdir(WORKFLOWS)):
        if not fn.endswith((".yml", ".yaml")):
            continue
        if fn in CI_HYGIENE:
            continue
        try:
            body = open(os.path.join(WORKFLOWS, fn), encoding="utf-8").read()
        except OSError:
            continue
        if not re.search(r"^\s{2}schedule:", body, re.M):
            continue
        crons = re.findall(r"cron:\s*['\"]([^'\"]+)['\"]", body)
        name = re.search(r"^name:\s*(.+)$", body, re.M)
        out.append({
            "key": "workflow:" + fn,
            "kind": "cadence",
            "label": (name.group(1).strip() if name else fn),
            "detail": "Scheduled: " + (", ".join(crons) if crons else "(cron not parsed)"),
            "where": ".github/workflows/" + fn,
        })
    return out


def scan_tables():
    """Tables a human writes to THROUGH THE DASHBOARD.

    Rule: a table referenced from consumer JS in the same file as a write method,
    excluding derived-name shapes. This is the filter that keeps the scan honest —
    the schema has dozens of write-policied tables, but the overwhelming majority
    are written by pipelines, not people. A surface where a *person* changes
    shared state is what needs a named owner.
    """
    hits = {}
    for fn in js_files():
        try:
            body = open(os.path.join(ROOT, fn), encoding="utf-8").read()
        except OSError:
            continue
        if not any(m in body for m in WRITE_METHODS):
            continue
        # The write must belong to THIS table's call, not merely exist somewhere
        # in the file. Without the window, governance.js — which POSTs to
        # governance_owners — flagged every table it merely READS, including the
        # read-only map_contact_gaps view. Precision matters more than recall
        # here: a missed table is a quiet gap a human can still add by hand, but
        # a false positive is noise, and noise is what makes the whole strip
        # ignorable.
        for m in re.finditer(r'(?:REST\s*\+\s*"|/rest/v1)/([a-z0-9_]+)', body):
            t = m.group(1)
            if t in ("rpc",) or t.endswith(DERIVED_SUFFIXES):
                continue
            window = body[m.end():m.end() + WRITE_WINDOW]
            if not re.search(r'method:\s*["\'](%s)["\']' % "|".join(WRITE_METHODS), window):
                continue
            hits.setdefault(t, set()).add(fn)
    return [{
        "key": "table:" + t,
        "kind": "decision_right",
        "label": t,
        "detail": "Written from " + ", ".join(sorted(files)),
        "where": sorted(files)[0],
    } for t, files in sorted(hits.items())]


def scan_tabs():
    """Dashboard tabs through which a human CHANGES shared state.

    Rule: a tab whose lazy-loaded JS performs a write. A read-only chart is not a
    governance surface no matter how prominent — this is the scan most at risk of
    noise, so the write requirement does the heavy lifting (most tabs are views).
    """
    out = []
    try:
        html = open(DASHBOARD, encoding="utf-8").read()
    except OSError:
        return out
    # tab -> js comes from the BOOT dispatch, not from proximity in the document:
    # a tab's nav button and its loadScript sit ~1.2M characters apart, so any
    # window-based match silently finds nothing (it did).
    pairs = re.findall(r"onActivate\('([a-z0-9-]+)'[\s\S]{0,800}?loadScript\('([a-z0-9_]+\.js)'", html)
    for tab, js in sorted(set(pairs)):
        path = os.path.join(ROOT, js)
        if not os.path.exists(path):
            continue
        try:
            body = open(path, encoding="utf-8").read()
        except OSError:
            continue
        if not any('"%s"' % m in body or "'%s'" % m in body for m in WRITE_METHODS):
            continue
        out.append({
            "key": "tab:" + tab,
            "kind": "decision_right",
            "label": tab,
            "detail": "Writes shared state from " + js,
            "where": js,
        })
    return out


def scan_stale(register):
    """The INVERSE sweep — register rows pointing at things that no longer exist.

    Cheap, and stale rows quietly destroy the register's credibility: a row citing
    a deleted script reads as authoritative right up until someone checks.

    Deliberately strict. Only a token that clearly denotes a repo path (contains a
    slash and a known extension, or names a workflow) is checked; prose and table
    names are skipped, because a false "this is stale" is worse than a miss — it
    sends someone hunting for a problem that is not there.
    """
    out = []
    rows = (register.get("decision_rights") or []) + (register.get("cadences") or [])
    path_re = re.compile(r"\b((?:[\w.\-]+/)+[\w.\-]+\.(?:py|js|json|yml|yaml|sql|md|html))\b")
    for row in rows:
        blob = " ".join(str(row.get(k) or "") for k in
                        ("maintained_in", "drives", "when_empty", "note", "loop", "element"))
        missing = [p for p in sorted(set(path_re.findall(blob)))
                   if not os.path.exists(os.path.join(ROOT, p))]
        if missing:
            out.append({
                "key": "stale:" + str(row.get("id")),
                "kind": "stale_row",
                "label": str(row.get("id")) + " — " + str(row.get("element") or row.get("loop") or ""),
                "detail": "References path(s) that no longer exist: " + ", ".join(missing),
                "where": "kb/governance_register.json",
            })
    return out


# Ordering: the strip must put the five most actionable things first, or it is a
# list nobody finishes reading. Stale rows first (an actively wrong register row
# is worse than a missing one), then unlisted recurring loops, then curated
# surfaces, then tabs.
RANK = {"stale_row": 0, "cadence": 1, "decision_right": 2}


def build():
    register = read_json(REGISTER, {})
    smap = read_json(SURFACE_MAP, {})
    known = smap.get("mapped", {})          # key -> register id it already covers
    dismissed = smap.get("dismissed", {})   # key -> why it needs no row

    found = scan_stale(register) + scan_workflows(register) + scan_tables() + scan_tabs()

    candidates, covered, ignored = [], [], []
    for item in found:
        k = item["key"]
        if k in known:
            covered.append({**item, "covers": known[k]})
        elif k in dismissed:
            ignored.append({**item, "why": dismissed[k]})
        else:
            candidates.append(item)

    candidates.sort(key=lambda c: (RANK.get(c["kind"], 9), c["label"].lower()))

    return {
        "_about": ("Surfaces that look governable but have no row in "
                   "governance_register.json — PROPOSALS ONLY, never auto-added. "
                   "Generated by kb/_build_governance_candidates.py. To dismiss one "
                   "or record that a row already covers it, edit "
                   "kb/governance_surface_map.json — the reason then lives in a diff."),
        "_generated_by": "kb/_build_governance_candidates.py",
        "_counts": {
            "candidates": len(candidates),
            "already_mapped": len(covered),
            "dismissed": len(ignored),
            "scanned": len(found),
        },
        "candidates": candidates,
        "dismissed": ignored,
    }


def main():
    doc = build()
    payload = json.dumps(doc, indent=2, ensure_ascii=False) + "\n"
    if "--check" in sys.argv:
        cur = ""
        if os.path.exists(OUT):
            cur = open(OUT, encoding="utf-8").read()
        if cur != payload:
            sys.stderr.write("governance_candidates.json is STALE — run "
                             "python kb/_build_governance_candidates.py\n")
            return 1
        print("governance candidates up to date (%d candidate(s))" % doc["_counts"]["candidates"])
        return 0
    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write(payload)
    c = doc["_counts"]
    print("wrote %s — %d candidate(s), %d already mapped, %d dismissed, %d scanned"
          % (os.path.relpath(OUT, ROOT), c["candidates"], c["already_mapped"],
             c["dismissed"], c["scanned"]))
    for item in doc["candidates"][:12]:
        print("  [%s] %s — %s" % (item["kind"], item["label"], item["detail"]))
    return 0


if __name__ == "__main__":
    sys.exit(main())
