#!/usr/bin/env python3
"""Build SkyView's CPL UNIVERSE — prototype/ccr_cpl_universe.json.

Sam's ruling of 2026-09-10, his words: "It's like another universe where the
entities are exhibits rather than courses, but just like in course view,
circles around the exhibits can indicate that courses are articulated to them."

⚠️ THIS IS NOT prototype/ccr_cpl.json. That payload is the shipped CPL *face*
(S238) and is keyed the INVERSE way — course identity -> the credentials that
reach it — so it cannot be reused here. This one turns the axis over: the
CREDENTIAL is the entity and the courses are what orbit it.

The CER carries every axis already (measured 2026-09-10):

  credential_reference_data.js `unified_titles`
    ut                        the identity      1,987
    raw_variants              its members       3,813 local MAP exhibits
    disc_modal                its island        96 disciplines, 543 blank
    n_articulation_lines      its ring          1,603 carry one
    issuer / issuers / trainer  its agencies    172 / 208 / 67
    statewide                 84, and they are the well-formed subset
    cpl_types                 six

⚠️ AGENCIES COME FROM THE CER, NEVER FROM kb/coci_articulations.json. That
crosswalk inlines an `issuing_agency` captured 2026-05-21 which disagrees with
the curated CER on 1,743 of 4,592 records (`cpl_memory`:
the-crosswalks-inlined-issuer-is-a-stale-snapshot).

⚠️ AND NEVER MIX IN THE CREDIT FUNNEL'S EXHIBIT COUNT. The funnel
(map_college_cr_unit, 6,388 ids, 6,291 of them ACE) and the articulation feed
share only 570 ids. Any coverage line takes BOTH its numbers from one universe
(`cpl_memory`: a-coverage-line-takes-both-numbers-from-one-universe).

TWO RULINGS SHAPE WHAT IS DRAWN (Sam, 2026-09-10):
  · A singleton draws like any other identity — a group of one. 73% of CER
    titles hold exactly one local exhibit, and Courses mode already draws
    3,217 identities carrying a single satellite the same way.
  · The 543 with no discipline SHIP AS A VISIBLE PILE, in the "(no discipline
    yet)" island, rather than blocking the build on a curator pass. There is
    no mechanical route to a discipline for them: TOP recovers 4 (and Rule 7
    bars TOP as a primary discipline call regardless) and issuer recovers 11.

The layout is IMPORTED from kb/_build_ccr_universe.py, never copied — one
`layout_island`, one packer, one set of gaps, so the two universes cannot drift
apart. That builder's layout_island/build_islands take a `point_fn`; this module
passes the exhibit point shape.

Run:
    python3 kb/_build_ccr_cpl_universe.py           # writes the payload
    python3 kb/_build_ccr_cpl_universe.py --check   # rebuild and compare, no write
"""
import argparse
import hashlib
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _build_ccr_universe import (          # noqa: E402  the ONE layout
    BLANK, build_islands, slug,
)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CER_JS = os.path.join(ROOT, "credential_reference_data.js")
OUT = os.path.join(ROOT, "prototype", "ccr_cpl_universe.json")

# Six CPL types, coded so the payload carries an int per point rather than the
# strings repeated 1,987 times. Order is by population, measured 2026-09-10.
CPL_TYPES = ["Credit By Exam", "Industry Certification", "Portfolio Review",
             "Standardized Assessment", "Military", "Other"]
CPL_CODE = {t: i for i, t in enumerate(CPL_TYPES)}


def load_js_object(path):
    with open(path, encoding="utf-8") as fh:
        src = fh.read()
    i = src.index("{")
    j = src.rindex("}")
    return json.loads(src[i:j + 1])


def ident_id(ut):
    """A stable id for a CER unified title.

    The CER has no surrogate key for `ut` — the title IS the key — so the id is
    its slug under a `CPL-` prefix, which keeps it distinguishable from an M-ID
    at a glance and from a course id in any shared code path.

    ⚠️ THE HASH SUFFIX IS LOAD-BEARING, NOT DECORATION. slug() truncates at 60
    characters because it names a description shard FILE, and two long CER
    titles collide there: "Carpenters Training Committee for Northern California
    Apprenticeship — CARP 710" and "... — CARP 707" differ only past the cut.
    Appending a short digest of the EXACT title separates them while keeping the
    readable stem. slug() itself must not be widened — it names every committed
    shard, and changing it renames all of them.

    ⚠️ This id is derived from the TITLE, so a curator renaming a unified title
    re-mints its id. That is safe today because the payload is a read-only
    layout rebuilt daily and nothing stores a reference to these ids. The first
    feature that persists one (a curation queue, a saved pick) needs a real
    surrogate key on the CER instead — see Critical Rule 7 on re-mints.
    """
    return "CPL-%s-%s" % (slug(ut), hashlib.blake2s(ut.encode("utf-8"),
                                                    digest_size=3).hexdigest())


def cpl_point_of(row, x, y):
    """One exhibit identity as a drawable point.

    Deliberately NOT point_of()'s shape: there is no id_system, no units and no
    credit status on a credential. What it keeps in common is i/x/y/t/n so the
    canvas's shared helpers (hit-testing, labelling, the members count) work
    unchanged on both universes.
    """
    pt = {
        "i": row["id"],
        "x": round(x, 1), "y": round(y, 1),
        "t": row.get("title") or "",
        "n": int(row.get("members") or 0),      # local MAP exhibits folded in
    }
    ar = int(row.get("articulations") or 0)
    if ar:
        pt["ar"] = ar                            # the RING: courses articulated
    if row.get("statewide"):
        pt["sw"] = 1                             # Sam: show these visibly
    if row.get("cpl_codes"):
        pt["c"] = row["cpl_codes"]
    if row.get("issuer"):
        pt["g"] = row["issuer"]
    if row.get("served"):
        pt["ss"] = row["served"]
    return pt


def rows_from_cer(cer):
    """CER unified titles -> identity rows, plus the collision check."""
    rows, seen = [], {}
    for u in cer["unified_titles"]:
        ut = (u.get("ut") or "").strip()
        if not ut:
            continue
        rid = ident_id(ut)
        if rid in seen:
            raise SystemExit(
                f"id collision: {ut!r} and {seen[rid]!r} both slug to {rid!r}. "
                "Two credentials would silently merge into one entity."
            )
        seen[rid] = ut
        rows.append({
            "id": rid,
            "title": ut,
            "members": int(u.get("raw_count") or 0),
            "disc": (u.get("disc_modal") or "").strip() or BLANK,
            "articulations": int(u.get("n_articulation_lines") or 0),
            "statewide": bool(u.get("statewide")),
            "cpl_codes": sorted(CPL_CODE[t] for t in (u.get("cpl_types") or [])
                                if t in CPL_CODE),
            "issuer": u.get("issuer") or "",
            "served": int(u.get("students_served") or 0),
        })
    return rows


def build(cer):
    rows = rows_from_cer(cer)
    by_disc = {}
    for r in rows:
        by_disc.setdefault(r["disc"], []).append(r)
    # Same ordering rule as the course universe: heaviest island first, so the
    # golden-angle spiral keeps the centre dense.
    order = sorted(by_disc, key=lambda d: (-len(by_disc[d]), d))
    islands, bounds = build_islands(order, by_disc, {}, {}, {}, point_fn=cpl_point_of)

    sw = [r for r in rows if r["statewide"]]
    return {
        "_about": ("SkyView CPL universe — the entities are EXHIBITS, not courses "
                   "(Sam, 2026-09-10). One point per CER unified title; `n` is how "
                   "many local MAP exhibits it folds in; `ar` is how many courses "
                   "articulate to it (the ring); `sw` marks a statewide exhibit. "
                   "READ-ONLY extract: the browser draws these coordinates."),
        "_generated_by": "kb/_build_ccr_cpl_universe.py",
        "_generated_from": {
            "identities": "credential_reference_data.js unified_titles (the curated CER)",
            "agencies": ("credential_reference_data.js — NEVER kb/coci_articulations.json's "
                         "inlined issuing_agency, a 2026-05-21 snapshot wrong on 1,743 of 4,592"),
            "layout": "kb/_build_ccr_universe.py layout_island/build_islands (imported, not copied)",
            "cer_generated_at": cer.get("_generated_at", ""),
        },
        "cpl_types": CPL_TYPES,
        "counts": {
            "identities": len(rows),
            "members": sum(r["members"] for r in rows),
            "disciplines": len(order),
            "articulated": sum(1 for r in rows if r["articulations"]),
            "statewide": len(sw),
            "statewide_articulated": sum(1 for r in sw if r["articulations"]),
            "no_discipline": len(by_disc.get(BLANK, [])),
            "grouped": sum(1 for r in rows if r["members"] >= 2),
            "singleton": sum(1 for r in rows if r["members"] == 1),
        },
        "bounds": bounds,
        "islands": islands,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=OUT)
    ap.add_argument("--quiet", action="store_true",
                    help="write the payload without the summary (the daily cron)")
    ap.add_argument("--check", action="store_true",
                    help="rebuild and compare against the committed payload; write nothing")
    args = ap.parse_args()

    out = build(load_js_object(CER_JS))
    blob = json.dumps(out, separators=(",", ":"))

    if args.check:
        if not os.path.exists(args.out):
            raise SystemExit(f"{args.out} missing — run without --check first")
        with open(args.out, encoding="utf-8") as fh:
            if fh.read() != blob:
                raise SystemExit(f"{args.out} is stale — re-run kb/_build_ccr_cpl_universe.py")
        print(f"{os.path.basename(args.out)} up to date")
        return

    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as fh:
        fh.write(blob)

    if args.quiet:
        return
    c = out["counts"]
    print(f"wrote {args.out}  ({len(blob)/1e6:.2f} MB)")
    print(f"  {c['identities']:,} exhibit identities folding {c['members']:,} local exhibits "
          f"in {c['disciplines']} islands")
    print(f"  articulated (drawn with a ring): {c['articulated']:,}  ·  "
          f"grouped {c['grouped']:,} / singleton {c['singleton']:,}")
    print(f"  statewide: {c['statewide']} ({c['statewide_articulated']} articulated)  ·  "
          f"no discipline yet: {c['no_discipline']:,}")


if __name__ == "__main__":
    main()
