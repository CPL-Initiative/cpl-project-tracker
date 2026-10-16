#!/usr/bin/env python3
"""Build fact-sheet/statewide_catalog.json: every statewide exhibit, grouped by
program area exactly as the CPL Fact Sheet groups them, with each exhibit's total
units and its credit recommendation lines.

WHY THIS EXISTS (S398, 2026-10-16)
----------------------------------
Sam wrote a Sierra Training rule on 2026-10-15: asked for "a complete list of
statewide exhibit titles categorized by sector", Sierra's first response should
be a table of every title with its total units, and the Fact Sheet should arrive
as a link. He then asked her that question three times on the public page, and
every answer said she did not have the full list. She did not: her retrieval is
topical (search_statewide_recommendations returns the four best matches for a
phrase), no table she reads carries a program area, and chatbox_credentials lacks
37 of the 164 statewide titles, which never reached the credential reference
artifact it syncs from.

ONE BUILD, TWO READERS
----------------------
The Fact Sheet already holds this answer in three places: the per-area counts in
fact_sheet_metrics.json, the recommendation lines in statewide_recs.js, and the
title lists baked into its HTML. This file puts the titles, the units and the lines
in one place, from the same inputs, so Sierra reads what the Fact Sheet reads.
Sierra fetches it at request time from main (the same commit GitHub Pages serves),
so a change in MAP reaches her with the next daily run, with no deploy.

The baked HTML lists are the one part that does not follow MAP: they hold the 132
titles of kb/statewide_exhibit_categories.json, and on 2026-10-16 only 114 of them
were current statewide titles while the page's own area counts summed to 164. This
file follows MAP, so its lists agree with the page's counts; rendering the page's
lists from this file would make the two agree title by title.

Nothing here is a second opinion:
  * the exhibit set is statewide_data.js's CCC Collaborative exhibits, the set
    fact_sheet_metrics.json counts (164 on 2026-10-16);
  * the program area is excel_to_dashboard._statewide_category(), the function
    that builds the Fact Sheet's per-area counts, imported rather than copied;
  * the lines are fact-sheet/_build_statewide_recs.py's build(), the function
    that writes the Fact Sheet's own wedges (and, through kb/_build_credential_recs.py,
    chatbox_credential_recs);
  * the program-area order and counts are read from fact_sheet_metrics.json, and the
    build FAILS if its own grouping disagrees with them.

UNITS
-----
An exhibit's total is the sum of its published lines, each read as the Fact Sheet
prints it: the `u` figure ("3", or a range "6–7" for a line published at two unit
values), or, where the Fact Sheet keeps the line whole ("3-4 hours in ...", "3 or 4
hours in ..."), the low and high figures in its text. MAP's lines say "hours"; the
Fact Sheet labels the figures units, and so does this file. The total is a range
when any line is. An exhibit with no published line carries `units: null` and
`recs: 0`: its standard is published in MAP and its lines are not.

USAGE
    python3 fact-sheet/_build_statewide_catalog.py          # write the JSON
    python3 fact-sheet/_build_statewide_catalog.py --check  # exit 1 if it would change

Runs in daily-dashboard.yml right after the Fact Sheet's statewide recs, and in
scripts/check_generated.sh. Needs the pipeline's Python deps (openpyxl), because the
categorizer lives in excel_to_dashboard.py.
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import os
import re
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(SCRIPT_DIR)
OUT = os.path.join(SCRIPT_DIR, "statewide_catalog.json")
STATEWIDE = os.path.join(ROOT, "statewide_data.js")
METRICS = os.path.join(ROOT, "fact_sheet_metrics.json")
RECS_BUILDER = os.path.join(SCRIPT_DIR, "_build_statewide_recs.py")

FACT_SHEET_URL = "https://cpl-initiative.github.io/cpl-project-tracker/fact-sheet/"
# The statewide section's own id. The Fact Sheet gives no exhibit or program area
# an anchor of its own, so this is the deepest link it offers.
FACT_SHEET_ANCHOR = "#statewide-exhibits"


def fail(msg: str) -> None:
    sys.stderr.write("ERROR: %s\n" % msg)
    raise SystemExit(2)


def load_recs_builder():
    """fact-sheet/_build_statewide_recs.py, loaded by path (the directory name has
    a hyphen, so it cannot be a normal import)."""
    spec = importlib.util.spec_from_file_location("_fs_statewide_recs", RECS_BUILDER)
    if spec is None or spec.loader is None:
        fail("cannot load %s" % RECS_BUILDER)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def load_categorizer():
    """The Fact Sheet's own program-area rule: exact title, then the ordered
    patterns, then the fallback bucket (excel_to_dashboard._statewide_category)."""
    if ROOT not in sys.path:
        sys.path.insert(0, ROOT)
    try:
        import excel_to_dashboard as gen  # noqa: E402 — the pipeline module
    except ImportError as e:
        fail("cannot import excel_to_dashboard (%s); install requirements.txt "
             "(openpyxl) and re-run" % e)
    cats = gen._load_statewide_categories()
    if not cats:
        fail("kb/statewide_exhibit_categories.json did not load; the Fact Sheet "
             "would fall back to TOP disciplines and this catalog would not match it")
    return lambda title: gen._statewide_category(title, cats)


# A line the Fact Sheet keeps whole: "3-4 hours in ...", "3 - 4 hour in ...",
# "3 or 4 hours in ...". The single-figure form is what split_units already took.
_RANGE = re.compile(r"^\s*(\d+(?:\.\d+)?)\s*(?:-|–|—|or|to)\s*(\d+(?:\.\d+)?)\s*"
                    r"(?:semester\s+)?(?:hours?|units?)\b", re.I)
_SINGLE = re.compile(r"^\s*(\d+(?:\.\d+)?)\s*(?:semester\s+)?(?:hours?|units?)\b", re.I)


def line_span(rec: dict):
    """(low, high) units of one published line, or None when it states no figure."""
    u = (rec.get("u") or "").strip()
    if u:
        nums = [float(p) for p in re.split(r"\s*[-–]\s*", u) if re.fullmatch(r"\d*\.?\d+", p)]
        if nums:
            return min(nums), max(nums)
    t = rec.get("t") or ""
    m = _RANGE.match(t)
    if m:
        a, b = float(m.group(1)), float(m.group(2))
        return min(a, b), max(a, b)
    m = _SINGLE.match(t)
    if m:
        v = float(m.group(1))
        return v, v
    return None


def fmt(v: float) -> str:
    v = round(v, 2)
    return str(int(v)) if v == int(v) else ("%g" % v)


def total_units(lines: list):
    """The exhibit's total as the Fact Sheet's lines state it: "9", "21–28", or
    None when no line states a figure. Also returns how many lines state none."""
    lo = hi = 0.0
    stated = unstated = 0
    for r in lines:
        span = line_span(r)
        if span is None:
            unstated += 1
            continue
        stated += 1
        lo += span[0]
        hi += span[1]
    if not stated:
        return None, unstated
    return (fmt(lo) if round(lo, 2) == round(hi, 2) else fmt(lo) + "–" + fmt(hi)), unstated


def build(sw: dict, metrics: dict, categorize, recs_builder) -> dict:
    lines_by_title, _no_lines = recs_builder.build(sw)

    titles = sorted({(e.get("unified_title") or e.get("title") or "").strip()
                     for e in sw.get("exhibits") or []
                     if e.get("collaborative_type") == "CCC Collaborative"} - {""})
    by_sector: dict = {}
    for t in titles:
        by_sector.setdefault(categorize(t), []).append(t)

    swm = (metrics or {}).get("statewide_exhibits") or {}
    order = [r.get("sector") for r in swm.get("by_sector") or []]
    want = {r.get("sector"): int(r.get("exhibits") or 0) for r in swm.get("by_sector") or []}
    if not order:
        fail("fact_sheet_metrics.json carries no statewide_exhibits.by_sector; run the "
             "dashboard build first (this catalog takes the Fact Sheet's order from it)")
    # The Fact Sheet's counts and this grouping come from the same rows through two
    # paths (_parse_exhibit_data over the raw report, _build_statewide_adoption into
    # statewide_data.js). If they ever disagree, refuse rather than publish a list
    # whose program areas do not add up to the page beside it.
    got = {s: len(v) for s, v in by_sector.items()}
    if got != want:
        diff = sorted(set(got) | set(want))
        detail = ", ".join("%s: catalog %s vs Fact Sheet %s" % (s, got.get(s, 0), want.get(s, 0))
                           for s in diff if got.get(s, 0) != want.get(s, 0))
        fail("program-area counts disagree with fact_sheet_metrics.json (%s)" % detail)
    total = int(str(swm.get("total") or "0").replace(",", "") or 0)
    if total != len(titles):
        fail("fact_sheet_metrics.json counts %s statewide exhibits; statewide_data.js holds %d"
             % (swm.get("total"), len(titles)))

    sectors = []
    n_lines = n_without = 0
    for sector in order:
        items = []
        for t in by_sector.get(sector, []):
            lines = lines_by_title.get(t) or []
            units, unstated = total_units(lines)
            items.append({
                "title": t,
                "units": units,
                "recs": len(lines),
                **({"lines_without_units": unstated} if unstated else {}),
                "lines": [{"t": r.get("t") or "", "u": r.get("u") or "", "cid": r.get("cid") or ""}
                          for r in lines],
            })
            n_lines += len(lines)
            n_without += 0 if lines else 1
        sectors.append({
            "sector": sector,
            "exhibits": len(items),
            "recs": sum(i["recs"] for i in items),
            "items": items,
        })

    return {
        "_about": "Every statewide (CCC Collaborative) exhibit, grouped by program area as "
                  "the CPL Fact Sheet groups them, with each exhibit's total units and its "
                  "credit recommendation lines. GENERATED by fact-sheet/_build_statewide_catalog.py "
                  "from statewide_data.js, kb/statewide_exhibit_categories.json and "
                  "fact_sheet_metrics.json; do not hand-edit. Sierra reads it at request time.",
        "source_generated_at": sw.get("generated_at") or None,
        "fact_sheet_url": FACT_SHEET_URL,
        "fact_sheet_anchor": FACT_SHEET_ANCHOR,
        "unit_kind": "units",
        "exhibits": len(titles),
        "program_areas": int(str(swm.get("program_areas") or "0").replace(",", "") or 0),
        "recs": n_lines,
        "exhibits_without_lines": n_without,
        "sectors": sectors,
    }


def render(doc: dict) -> str:
    return json.dumps(doc, ensure_ascii=False, indent=1) + "\n"


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--check", action="store_true", help="exit 1 if the file would change")
    args = ap.parse_args()

    recs_builder = load_recs_builder()
    if not os.path.exists(STATEWIDE):
        fail("statewide_data.js not found at %s" % STATEWIDE)
    sw = recs_builder.load_statewide(STATEWIDE)
    try:
        with open(METRICS, encoding="utf-8") as f:
            metrics = json.load(f)
    except (OSError, ValueError) as e:
        fail("cannot read fact_sheet_metrics.json (%s)" % e)

    text = render(build(sw, metrics, load_categorizer(), recs_builder))
    rel = os.path.relpath(OUT, ROOT)
    if args.check:
        try:
            with open(OUT, encoding="utf-8") as f:
                current = f.read()
        except OSError:
            current = ""
        if current != text:
            print("%s is STALE; run: python3 fact-sheet/_build_statewide_catalog.py" % rel)
            return 1
        print("%s is current" % rel)
        return 0

    with open(OUT, "w", encoding="utf-8") as f:
        f.write(text)
    doc = json.loads(text)
    print("wrote %s: %d exhibits in %d program areas, %d recommendation lines, "
          "%d exhibits with no published line"
          % (rel, doc["exhibits"], len(doc["sectors"]), doc["recs"], doc["exhibits_without_lines"]))
    return 0


if __name__ == "__main__":
    sys.exit(main())
