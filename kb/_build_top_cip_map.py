#!/usr/bin/env python3
"""TOP -> CIP, from what colleges actually assigned to real programs.

Sam, 2026-09-21, on the Jev ladder's rung order: *"title then CIP then course
description"*, and then, correcting a session that had looked on the minted
M-ID records and reported it missing: *"course records do carry CIP"*. He is
right, and the level is the PROGRAM: `coci_college_programs.cip_code`, joined
to a course through its TOP code.

⚠️ THE OBSERVED CIP BEATS THE PUBLISHED CROSSWALK BY ROUGHLY 3x, WHICH IS WHY
THIS FILE EXISTS RATHER THAN A READ OF `cip_crosswalk_data.js`. Measured
2026-09-21 over 19,349 real programs against the CO's own TOP->CIP crosswalk
file:

                              observed (here)   published crosswalk
    TOP codes carrying CIP          387                 419
    mean CIPs per TOP              2.85                 8.4
    worst case                       14               1,032
    resolve to exactly one CIP  136 (35%)           38 (9%)

A signal that returns eight answers corroborates nothing. The modal CIP here
holds a mean 86.5% of its TOP's programs, so it is usable as the ladder's
second rung.

⚠️ CIP CORROBORATES, IT NEVER GATES. The only route from a course to a CIP is
its TOP code, so CIP inherits TOP's entry unreliability whole — Rule 7's TOP
caveat applies to it unchanged, and `CLAUDE.md` already rules the posture for
the fall-2026 cutover: *"apply the same 'corroborate, don't gate' posture to CIP
until it earns trust."* Carry `share` and `cips` beside every code so a consumer
can see how thin the agreement is rather than reading the code as fact.

REFRESHING IT. The sandbox cannot reach `*.supabase.co` (Rule 10c) — all
Supabase access goes through the MCP tools — so a session runs this query with
`mcp__Supabase__execute_sql`, saves the rows, and re-runs this builder:

    with c as (
      select top_code, cip_code, cip_title, count(*) as n
      from coci_college_programs
      where cip_code is not null and cip_code <> ''
        and top_code is not null and top_code <> ''
      group by top_code, cip_code, cip_title
    ), r as (
      select *, sum(n) over (partition by top_code) as tot,
             count(*) over (partition by top_code) as distinct_cips,
             row_number() over (partition by top_code
                                order by n desc, cip_code) as rk
      from c
    )
    select json_agg(json_build_object(
             'top', top_code, 'cip', cip_code, 'title', cip_title,
             'share', round((n::numeric/tot), 3),
             'programs', tot, 'cips', distinct_cips
           ) order by top_code)::text as j
    from r where rk = 1;

    python3 kb/_build_top_cip_map.py --from <rows.json>
    python3 kb/_build_top_cip_map.py --check      # structure + staleness gate
"""
import argparse
import json
import os
import sys
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "top_cip_map.json")
SOURCE = "coci_college_programs (Supabase) — modal CIP per TOP code"

REQUIRED = ("top", "cip", "title", "share", "programs", "cips")


def build(rows):
    """One entry per TOP, carrying the modal CIP and how thin its majority is."""
    seen, out = set(), {}
    for r in rows:
        missing = [k for k in REQUIRED if k not in r]
        if missing:
            raise SystemExit(f"row missing {missing}: {r}")
        top = str(r["top"]).strip()
        if top in seen:
            raise SystemExit(f"duplicate TOP {top} — the query returns rk=1 only")
        seen.add(top)
        out[top] = {
            "cip": str(r["cip"]).strip(),
            "title": str(r["title"]).strip(),
            # How much of this TOP's program population the modal CIP holds, and
            # how many distinct CIPs it competes with. A consumer that ignores
            # these reads a 3-way split as though it were a fact.
            "share": round(float(r["share"]), 3),
            "cips": int(r["cips"]),
            "programs": int(r["programs"]),
        }
    return out


def payload(mapping):
    shares = [v["share"] for v in mapping.values()]
    return {
        "_doc": ("TOP -> modal CIP, observed on real college programs. CIP "
                 "CORROBORATES, NEVER GATES (Rule 7's TOP caveat reaches it, "
                 "because a course's only route to a CIP is its TOP code). "
                 "Read `share` and `cips` beside every code."),
        "_generated_by": "kb/_build_top_cip_map.py",
        "_generated_at": date.today().isoformat(),
        "_source": SOURCE,
        "_stats": {
            "top_codes": len(mapping),
            "one_cip_only": sum(1 for v in mapping.values() if v["cips"] == 1),
            "mean_cips_per_top": round(
                sum(v["cips"] for v in mapping.values()) / max(len(mapping), 1), 2),
            "mean_modal_share": round(sum(shares) / max(len(shares), 1), 3),
        },
        "map": mapping,
    }


def load():
    if not os.path.exists(OUT):
        return None
    return json.load(open(OUT, encoding="utf-8"))


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--from", dest="src", metavar="ROWS.json",
                    help="rows fetched with the query in this file's docstring")
    ap.add_argument("--check", action="store_true",
                    help="verify the committed file's shape; spend no network")
    a = ap.parse_args(argv)

    if a.check:
        blob = load()
        if not blob:
            print(f"missing {OUT} — run with --from <rows.json>")
            return 1
        m = blob.get("map") or {}
        bad = [t for t, v in m.items() if not all(k in v for k in ("cip", "share", "cips"))]
        if bad:
            print(f"{len(bad)} entr(ies) missing cip/share/cips: {bad[:5]}")
            return 1
        # ⚠️ The file must never lose the corroboration fields — a consumer that
        # sees only `cip` reads a 3-way split as a fact.
        print(f"top_cip_map is well formed — {len(m)} TOP codes, "
              f"mean {blob['_stats']['mean_cips_per_top']} CIPs each")
        return 0

    if not a.src:
        ap.error("pass --from <rows.json> or --check")
    rows = json.load(open(a.src, encoding="utf-8"))
    mapping = build(rows)
    blob = payload(mapping)
    json.dump(blob, open(OUT, "w", encoding="utf-8"), indent=1, sort_keys=False)
    s = blob["_stats"]
    print(f"wrote {OUT} — {s['top_codes']} TOP codes, {s['one_cip_only']} with one CIP, "
          f"mean {s['mean_cips_per_top']} CIPs, mean modal share {s['mean_modal_share']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
