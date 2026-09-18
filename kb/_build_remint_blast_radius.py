#!/usr/bin/env python3
"""What a re-mint of ONE identity would touch — precomputed, for SkyView.

    python3 kb/_build_remint_blast_radius.py            # write the payload
    python3 kb/_build_remint_blast_radius.py --check     # CI: is it current?
    python3 kb/_build_remint_blast_radius.py --id "REAL M1032"   # one identity

WHY THIS EXISTS
---------------
Sam, 2026-09-18, asked for the blast-radius view as the first step toward
re-mint in SkyView, and named its urgency himself: *"I don't plan to remint
until I do significant merge work later, so I'm not really worried about
this."* So this is the instrument a curator reaches for AFTER a run of merges,
when a queue of re-mint candidates has built up and the question is what
landing them would move.

It is READ-ONLY and computes nothing new: the registry of id-keyed artifacts
that must move together at every re-key was written down in
`docs/kb-notes/methodology-rekey-every-id-keyed-artifact.md` after 53% of the
promotions evidence was found pointing at dead ids. This script counts that
registry per identity so the count arrives before the re-mint rather than
after.

⚠️ THREE READINGS THIS GOT WRONG BEFORE IT GOT RIGHT, all of them the kind
`kb/doctrine.py` exists to catch. They are recorded here because the next
person will reach for the same three.

  1. **The articulation join key is `course_id`, and `course_id` IS the
     identity id** — not a control number. Joining through member control
     numbers matched 2 records out of 4,592.

  2. **DO NOT resolve these keys through the alias chain.**
     `kb/coci_articulations.json` carries five applied markers, through
     `_identities_rekeyed` at 2026-09-05, so its keys are ALREADY current-era.
     Resolving again double-applies the permutation: measured, it moved 1,662
     already-live keys onto live but unrelated identities while the homeless
     count went UP by 4. That is exactly the direction test in
     `methodology-alias-map-resolution-semantics` — dead RISING on resolution
     means the keys were already current. The era guard is
     `alias_chain.pending_maps()`; this script asserts the file is current and
     refuses rather than guessing.

  3. **A C-ID identity is not re-mintable.** The articulation store holds 172
     of them beside 2,118 M-IDs. Rule 7 governs M-IDs; an official C-ID anchor
     is firewalled and must never appear in a re-mint footprint.

⚠️ NOTHING IS DROPPED SILENTLY (Sam's ruling 5, 2026-09-05). Articulation
records whose identity is not in the minted universe go to a worklist in the
payload with enough per row to act on, never into a discarded remainder.

WHAT SHIPS
----------
`prototype/ccr_remint_blast.json`, deliberately SPARSE. SkyView already loads
the member roster, so member counts are free in the browser and are not
repeated here; only the three registries a curator cannot see from the map
travel — articulations, curation, promotions — and only where non-zero.
"""

from __future__ import annotations

import argparse
import collections
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)

import alias_chain as AC  # noqa: E402  (path set above)

MEMBERSHIPS = os.path.join(ROOT, "kb", "coci_minted_memberships.json")
ARTICULATIONS = os.path.join(ROOT, "kb", "coci_articulations.json")
CURATION = os.path.join(ROOT, "kb", "coci_curation.json")
PROMOTIONS = os.path.join(ROOT, "kb", "promotions.json")
# TWO outputs, because they have two audiences and two sizes.
#   OUT      ships to the browser. Sparse, and it must stay small — SkyView
#            already carries ~1.4 MB of universe payload.
#   WORKLIST is the operator's copy of what could not be attached (ruling 5).
#            It carries exhibit titles so a curator can act on a row, which is
#            ~500 KB of text no render needs; keeping it out of OUT is the
#            difference between a 200 KB payload and a 700 KB one.
OUT = os.path.join(ROOT, "prototype", "ccr_remint_blast.json")
WORKLIST = os.path.join(ROOT, "kb", "remint_blast_worklist.json")

# The applied-marker keys `coci_articulations.json` uses to say which re-keys
# its own ids have already been through. Their presence is what lets this
# script treat the keys as current-era instead of guessing.
APPLIED_MARKERS = (
    "_subj4_remint_applied_at",
    "_subj4_fold_applied_at",
    "_authority_recode_applied_at",
    "_prefix_fold_applied",
    "_identities_rekeyed",
)


def _load(path):
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


def assert_current_era(arts):
    """Refuse to run if the articulations file is not already re-keyed.

    The whole point of reading #2 above: if a future rebuild ships this file
    at an older era, counting its keys directly would under-report, and
    resolving them would double-apply. Neither is safe to do quietly, so the
    script stops and names the maps that are missing.
    """
    applied = [k for k in APPLIED_MARKERS if arts.get(k)]
    if len(applied) != len(APPLIED_MARKERS):
        missing = [k for k in APPLIED_MARKERS if not arts.get(k)]
        raise SystemExit(
            "ABORT: kb/coci_articulations.json is missing applied markers "
            + ", ".join(missing)
            + " — its keys may not be current-era. Counting them directly would "
            "under-report and resolving them would double-apply the permutation. "
            "Re-key the file (kb/_remint_apply_articulations.py) before building."
        )
    return len(AC.ALIAS_MAPS)


def build():
    mem = _load(MEMBERSHIPS)["memberships"]
    arts = _load(ARTICULATIONS)
    cur = _load(CURATION)["curations"]
    prom = _load(PROMOTIONS)["promotions"]

    chain_len = assert_current_era(arts)
    ident = arts["identities"]
    cid_only = {i for i, v in ident.items() if v.get("identity_system") == "C-ID"}

    live = set(mem)  # the minted identity universe — what a re-mint can move

    art = collections.Counter()
    homeless = []
    for r in arts["articulations"]:
        iid = r.get("course_id")
        if iid in live and iid not in cid_only:
            art[iid] += 1
        else:
            # Ruling 5: a record we cannot attach is a worklist row, never a
            # silent drop. Carry enough to act on it.
            homeless.append({
                "identity": iid,
                "system": (ident.get(iid) or {}).get("identity_system"),
                "exhibit_id": r.get("exhibit_id"),
                "exhibit_title": r.get("exhibit_title"),
                "unified_title": r.get("unified_title"),
                "why": ("official C-ID anchor — not re-mintable" if iid in cid_only
                        else "identity carries no minted members"),
            })

    rows = {}
    for iid in live:
        if iid in cid_only:
            continue
        a, c, p = art.get(iid, 0), (1 if iid in cur else 0), (1 if iid in prom else 0)
        if a or c or p:
            # [articulations, curation rows, promotion records]. Members are
            # omitted on purpose — SkyView already holds the roster.
            rows[iid] = [a, c, p]

    payload = {
        "_about": (
            "Per-identity re-mint footprint for SkyView. SPARSE: only identities "
            "with a non-member footprint appear, and member counts are omitted "
            "because the browser already holds the roster. Built by "
            "kb/_build_remint_blast_radius.py; CI --checks it."
        ),
        "_schema": "{identity: [articulations, curation_rows, promotion_records]}",
        "_registry": (
            "docs/kb-notes/methodology-rekey-every-id-keyed-artifact.md — the "
            "artifact classes that must move together at every re-key."
        ),
        "_era": {
            "articulations_applied_markers": list(APPLIED_MARKERS),
            "alias_chain_len": chain_len,
            "note": (
                "Keys are counted DIRECTLY. coci_articulations.json is already "
                "current-era; resolving it again double-applies (measured: 1,662 "
                "live keys moved, homeless rose by 4)."
            ),
        },
        "totals": {
            "minted_identities": len(live),
            "cid_anchors_excluded": len(cid_only),
            "with_footprint": len(rows),
            "articulation_records_attached": sum(art.values()),
            "articulation_records_homeless": len(homeless),
        },
        "identities": rows,
        "homeless_count": len(homeless),
        "homeless_worklist": os.path.relpath(WORKLIST, ROOT),
    }
    worklist = {
        "_about": (
            "Articulation records whose identity is not a minted, re-mintable "
            "one. Ruling 5 (Sam, 2026-09-05): ids resolving to nothing become a "
            "worklist, never a silent drop. Each row carries enough to act on."
        ),
        "_built_by": "kb/_build_remint_blast_radius.py",
        "count": len(homeless),
        "by_reason": dict(collections.Counter(h["why"] for h in homeless)),
        "records": sorted(homeless, key=lambda h: (h["why"], str(h["identity"]))),
    }
    return payload, worklist


def write(payload, worklist):
    for path, doc in ((OUT, payload), (WORKLIST, worklist)):
        with open(path, "w", encoding="utf-8") as fh:
            json.dump(doc, fh, separators=(",", ":"), sort_keys=True)
            fh.write("\n")
    size = os.path.getsize(OUT) / 1024
    wsize = os.path.getsize(WORKLIST) / 1024
    t = payload["totals"]
    print(f"wrote {os.path.relpath(OUT, ROOT)}  ({size:.0f} KB — ships to the browser)")
    print(f"wrote {os.path.relpath(WORKLIST, ROOT)}  ({wsize:.0f} KB — operator worklist)")
    print(f"  {t['with_footprint']} of {t['minted_identities']} identities carry a "
          f"non-member footprint; {t['cid_anchors_excluded']} C-ID anchors excluded")
    print(f"  articulations attached {t['articulation_records_attached']}, "
          f"homeless {t['articulation_records_homeless']} (worklist, not dropped)")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true",
                    help="exit 1 if the committed payload is not what we would write")
    ap.add_argument("--id", help="print one identity's footprint and exit")
    args = ap.parse_args()

    payload, worklist = build()

    if args.id:
        mem = _load(MEMBERSHIPS)["memberships"]
        a, c, p = payload["identities"].get(args.id, [0, 0, 0])
        m = len(mem.get(args.id, []))
        if args.id not in mem:
            print(f"{args.id}: not a minted identity (nothing to re-mint)")
            return 1
        print(f"{args.id} — a re-mint would move:")
        print(f"  {m:>5} member course{'' if m == 1 else 's'}")
        print(f"  {a:>5} articulation record{'' if a == 1 else 's'}")
        print(f"  {c:>5} curation row{'' if c == 1 else 's'}")
        print(f"  {p:>5} promotion record{'' if p == 1 else 's'}")
        print(f"  {m + a + c + p:>5} TOTAL, plus one alias-map entry in kb/alias_chain.py")
        return 0

    if args.check:
        for path, doc in ((OUT, payload), (WORKLIST, worklist)):
            rel = os.path.relpath(path, ROOT)
            if not os.path.exists(path):
                print(f"{rel} is MISSING — run: python3 kb/_build_remint_blast_radius.py")
                return 1
            if json.dumps(_load(path), sort_keys=True) != json.dumps(doc, sort_keys=True):
                print(f"{rel} is STALE — run: python3 kb/_build_remint_blast_radius.py")
                return 1
        print("remint blast radius is up to date")
        return 0

    write(payload, worklist)
    return 0


if __name__ == "__main__":
    sys.exit(main())
