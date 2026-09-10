#!/usr/bin/env python3
"""Build the MEMBERS of SkyView's CPL universe — prototype/ccr_cpl_universe_members.json.

The CPL universe (kb/_build_ccr_cpl_universe.py) places one point per curated
credential and carries only counts: `n` local MAP exhibits folded in, `ar`
courses articulated. This payload carries the rows behind those counts, the way
prototype/ccr_universe_members.json carries the college courses behind a course
identity — fetched beside the universe, never inlined, so the layout stays small.

Sam, 2026-09-10: "a Firefighter 1 Exhibit would be like a MID grouping showing
all the local exhibits as members of the group as if they were courses. Then we
would show the course(s), perhaps on the exhibit cards, that have CPL based on
the exhibit."  Both halves are here, per identity:

  m[id]        the LOCAL MAP EXHIBITS folded into the credential — the CER's
               raw_variants: [title, confidence, quality flag or ""]
  courses[id]  the COURSE IDENTITIES articulated to it — the CER's
               articulations: [course id, id system, title, discipline,
               local receiving courses]

⚠️ ONE ID FUNCTION, IMPORTED. The point ids are minted by ident_id() in the
universe builder; this file imports it rather than restating the slug-plus-digest
rule, for the reason kb/alias_chain.py is imported — a copied key function
drifts, and a members payload keyed one character differently is a universe of
identities with no members, which reads as a corpus with nothing in it.

⚠️ ARTICULATED COURSES COME FROM THE CER, NEVER FROM prototype/ccr_cpl.json.
That payload is keyed the inverse way (course -> credentials) and reaches only
the 1,490 identities a receiving course names; the CER's `articulations` list is
the same join as the universe's `ar` ring, so the card and the ring agree.

Run:
    python3 kb/_build_ccr_cpl_universe_members.py           # writes the payload
    python3 kb/_build_ccr_cpl_universe_members.py --check   # rebuild and compare, no write
"""
import argparse
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _build_ccr_cpl_universe import CER_JS, ident_id, load_js_object   # noqa: E402  the ONE id

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "prototype", "ccr_cpl_universe_members.json")


def members_of(u):
    """[title, confidence, quality flag] per local exhibit, best confidence first."""
    rows = []
    for v in u.get("raw_variants") or []:
        title = (v.get("r") or "").strip()
        if not title:
            continue
        conf = v.get("c")
        rows.append([title, round(float(conf), 2) if isinstance(conf, (int, float)) else None,
                     (v.get("q") or "")])
    rows.sort(key=lambda r: (-(r[1] if r[1] is not None else 0), r[0].lower()))
    return rows


def courses_of(u):
    """[course id, system, title, discipline, [[subj num, title, colleges]]] per articulated identity."""
    rows = []
    for a in u.get("articulations") or []:
        cid = (a.get("cid") or "").strip()
        if not cid:
            continue
        local = []
        for l in a.get("local") or []:
            code = ((l.get("subj") or "") + " " + (l.get("num") or "")).strip()
            local.append([code, (l.get("t") or ""), list(l.get("colleges") or [])])
        rows.append([cid, a.get("sys") or "", a.get("title") or "", a.get("disc") or "", local])
    rows.sort(key=lambda r: (-len(r[4]), r[0]))
    return rows


def build(cer):
    m, courses, n_members, n_courses, n_local = {}, {}, 0, 0, 0
    for u in cer["unified_titles"]:
        ut = (u.get("ut") or "").strip()
        if not ut:
            continue
        rid = ident_id(ut)
        mem = members_of(u)
        if mem:
            m[rid] = mem
            n_members += len(mem)
        crs = courses_of(u)
        if crs:
            courses[rid] = crs
            n_courses += len(crs)
            n_local += sum(len(c[4]) for c in crs)
    return {
        "_about": ("The rows behind SkyView's CPL universe: per credential identity, the local "
                   "MAP exhibits it folds in (m) and the course identities articulated to it "
                   "(courses). READ-ONLY extract; fetched beside prototype/ccr_cpl_universe.json."),
        "_generated_by": "kb/_build_ccr_cpl_universe_members.py",
        "_generated_from": {
            "members": "credential_reference_data.js unified_titles[].raw_variants",
            "courses": "credential_reference_data.js unified_titles[].articulations (the ring's own join)",
            "ids": "kb/_build_ccr_cpl_universe.py ident_id (imported, never copied)",
            "cer_generated_at": cer.get("_generated_at", ""),
        },
        "counts": {
            "identities_with_members": len(m),
            "members": n_members,
            "identities_with_courses": len(courses),
            "courses": n_courses,
            "local_receiving_courses": n_local,
        },
        "m": m,
        "courses": courses,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=OUT)
    ap.add_argument("--quiet", action="store_true", help="write the payload without the summary (the daily cron)")
    ap.add_argument("--check", action="store_true", help="rebuild and compare against the committed payload; write nothing")
    args = ap.parse_args()

    out = build(load_js_object(CER_JS))
    blob = json.dumps(out, separators=(",", ":"), ensure_ascii=False)

    if args.check:
        if not os.path.exists(args.out):
            raise SystemExit(f"{args.out} missing — run without --check first")
        with open(args.out, encoding="utf-8") as fh:
            if fh.read() != blob:
                raise SystemExit(f"{args.out} is stale — re-run kb/_build_ccr_cpl_universe_members.py")
        print(f"{os.path.basename(args.out)} up to date")
        return

    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as fh:
        fh.write(blob)
    if args.quiet:
        return
    c = out["counts"]
    print(f"wrote {args.out}  ({len(blob.encode('utf-8'))/1e6:.2f} MB)")
    print(f"  {c['members']:,} local exhibits under {c['identities_with_members']:,} identities  ·  "
          f"{c['courses']:,} articulated course identities under {c['identities_with_courses']:,} "
          f"({c['local_receiving_courses']:,} receiving college courses)")


if __name__ == "__main__":
    main()
