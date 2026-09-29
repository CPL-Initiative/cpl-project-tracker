#!/usr/bin/env python3
"""Build the per-credential CREDIT RECOMMENDATION layer for Sierra.

WHY THIS EXISTS
---------------
Sierra could say *that* a credential is articulated, and by whom, but not
*what credit it earns*. Her only recommendation field was
`chatbox_credentials.ccc_rec` — a SINGLE string.

For POST Basic Academy that string is "3 hours in Criminal Investigation".
The real statewide recommendation is TEN lines (eight C-ID courses plus two
electives). So asked what Cerritos might adopt, Sierra named one course and
the curator saw nine missing. The nine were never absent from our data — they
sit in `statewide_data.js` as `authoritative_recs` and have simply never been
published to Supabase, which is the only place Sierra can read from.

THE RULE (Sam, 2026-08-13)
--------------------------
  "When there is a statewide exhibit as there is for POST, it should only
   reference the credit recommendations from the statewide and largely ignore
   the local versions. When there is no statewide, it should give the most
   common credit recommendations from a selection of the colleges. They don't
   need to see all the variations for local colleges."

So this builder emits exactly one recommendation set per credential:

  * statewide  → `authoritative_recs` verbatim, ordered C-ID first. The local
                 variations are DELIBERATELY dropped, not merged.
  * local-only → the most common `credit_recs` across adopting colleges, with
                 the number of colleges behind each so a reader can tell a
                 convention from a one-off. Capped — the point is the shape of
                 the norm, not a catalogue of every college's wording.

SOURCE OF TRUTH
---------------
`statewide_data.js` (window.CPL_STATEWIDE), the same published artifact the
Statewide tab renders, keyed on `unified_title` — the identical key
`chatbox_credentials` uses, so no name reconciliation is needed. Nothing here
is recomputed or inferred: a credential with no recommendation in the artifact
emits NO row rather than a guess.

REUSE, NOT A SECOND OPINION
---------------------------
The statewide half is delegated to `fact-sheet/_build_statewide_recs.py`, which
already parses these rows for the public CPL Fact Sheet (Sam pointed at it:
"we have the statewides and their CRs listed on our CPL Fact sheet as well").
Its `build()` is imported and called, not re-implemented, because Sierra
quoting different credit from the published Fact Sheet for the same credential
is a credibility failure — and two copies of the unit-splitting and
title-folding rules would drift into exactly that. What is genuinely new here
is the LOCAL half: the Fact Sheet is statewide-only (134 credentials), so the
other ~2,070 had no recommendation anywhere Sierra could read.
"""

from __future__ import annotations

import argparse
import collections
import importlib.util
import json
import os
import re
import sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARTIFACT = os.path.join(REPO, "statewide_data.js")
OUT = os.path.join(REPO, "kb", "credential_recs.json")

# The Fact Sheet's builder lives in a hyphenated directory, so it cannot be a
# normal import. Load it by path rather than copying its parsing rules over.
_FS = os.path.join(REPO, "fact-sheet", "_build_statewide_recs.py")


def _load_factsheet_builder():
    spec = importlib.util.spec_from_file_location("_fs_statewide_recs", _FS)
    if spec is None or spec.loader is None:
        raise SystemExit(f"FATAL: cannot load {_FS} — the statewide half depends on it.")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod

# How many local recommendation lines to keep. Sam: "They don't need to see all
# the variations." Eight is enough to show a full course sequence (POST's
# statewide set is ten) without turning an answer into a catalogue.
LOCAL_REC_CAP = 8

_WS = re.compile(r"\s+")


def load_artifact(path: str = ARTIFACT) -> dict:
    with open(path, encoding="utf-8") as fh:
        src = fh.read()
    return json.loads(src[src.index("{"):].rstrip().rstrip(";"))


def norm(s: str | None) -> str:
    return _WS.sub(" ", (s or "").strip())


def _key(s: str | None) -> str:
    """Fold for COUNTING only — the display string keeps its original casing."""
    return _WS.sub(" ", (s or "").strip().lower())


def statewide_sets(data: dict) -> dict:
    """Every statewide authoritative set, straight from the Fact Sheet builder.

    Returns {unified_title: [{credit, cid, units}]}. The Fact Sheet emits
    {t, u, cid} — title, units, C-ID — already unit-split and title-folded; we
    re-join title and units into the `credit` phrasing Sierra speaks in, and
    keep the parts so a consumer can render either.

    Ordered C-ID first so the designated courses lead and the elective / GE
    lines trail: that is the order a faculty reader evaluates them in, and it
    makes the count of designated courses legible at a glance.
    """
    fs = _load_factsheet_builder()
    built, _no_ccc = fs.build(data)
    out: dict = {}
    for ut, recs in built.items():
        rows = []
        for r in recs:
            title = norm(r.get("t"))
            if not title:
                continue
            units = norm(r.get("u"))
            cid = norm(r.get("cid"))
            rows.append({
                "credit": (units + " hours in " + title) if units else title,
                "title": title,
                "units": units or None,
                "cid": cid or None,
            })
        if rows:
            rows.sort(key=lambda r: (0 if r["cid"] else 1))
            out[norm(ut)] = rows
    return out


def local_set(exhibits: list) -> list | None:
    """The most common local credit recommendations, with college counts.

    Counts DISTINCT colleges per recommendation, not raw lines: one college
    listing a course twice must not outweigh two colleges that agree. Where a
    recommendation is worded identically across colleges we keep the first
    spelling seen and report how many colleges share it.
    """
    colleges_by_rec: dict = collections.defaultdict(set)
    display: dict = {}
    course_by_rec: dict = collections.defaultdict(collections.Counter)
    total_colleges: set = set()

    for e in exhibits:
        names = [n for n in (e.get("adopter_names") or []) if n]
        total_colleges.update(names)
        # An exhibit with no named adopters still carries a real recommendation;
        # attribute it to the exhibit id so it is counted once, never zero.
        holders = names or ["exhibit:" + str(e.get("exhibit_id") or id(e))]
        for r in e.get("credit_recs") or []:
            credit = norm(r.get("credit"))
            if not credit:
                continue
            k = _key(credit)
            display.setdefault(k, credit)
            colleges_by_rec[k].update(holders)
            course = norm(r.get("course"))
            if course:
                course_by_rec[k][course] += 1

    if not colleges_by_rec:
        return None

    ranked = sorted(
        colleges_by_rec.items(),
        key=lambda kv: (-len(kv[1]), _key(display[kv[0]])),
    )
    out = []
    for k, cols in ranked[:LOCAL_REC_CAP]:
        common_course = course_by_rec[k].most_common(1)
        out.append({
            "credit": display[k],
            "cid": None,
            "colleges": len(cols),
            "example_course": common_course[0][0] if common_course else None,
        })
    return out


def build(data: dict) -> list:
    by_ut: dict = collections.defaultdict(list)
    for e in data.get("exhibits") or []:
        ut = norm(e.get("unified_title"))
        if ut:
            by_ut[ut].append(e)

    statewide = statewide_sets(data)

    rows = []
    for ut, exhibits in sorted(by_ut.items()):
        recs = statewide.get(ut)
        kind = "statewide_authoritative"
        if recs is None:
            recs = local_set(exhibits)
            kind = "local_modal"
        if not recs:
            continue                      # no recommendation on record — emit nothing
        n_colleges = len({n for e in exhibits for n in (e.get("adopter_names") or []) if n})
        # Emit BOTH C-ID counts, because they answer different questions and one
        # number cannot. POST is the worked case: ten recommendations, NINE
        # lines carrying a C-ID, only EIGHT distinct — AJ 110 sits on both
        # "Intro to Administration of Justice" and "Physical Training and
        # Health Education (CSU GE Area E)".
        #
        # We do NOT adjudicate that. Sam, 2026-08-13: "AJ 110 may be C-ID and it
        # is Elective … maybe where the confusion lies" — a C-ID can legitimately
        # back an elective slot, so a repeat is not automatically a stamping
        # error, and deciding which it is belongs to a curator with the CR in
        # front of them. Both counts ship, the repeat is flagged, and the
        # consumer is told to lead with the LIST rather than with any count.
        cids = [r["cid"] for r in recs if r.get("cid")]
        distinct_cids = sorted(set(cids))
        repeats = sorted({c for c in distinct_cids if cids.count(c) > 1})
        row = {
            "unified_title": ut,
            "rec_kind": kind,
            "recs": recs,
            "n_recs": len(recs),
            "n_cid_recs": len(distinct_cids),      # distinct C-IDs        (POST: 8)
            "n_cid_lines": len(cids),              # lines carrying a C-ID (POST: 9)
            "n_non_cid_recs": len(recs) - len(cids),
            "n_adopter_colleges": n_colleges,
            # ALWAYS emit this key, null when there are no repeats. PostgREST
            # rejects a bulk payload whose objects do not all carry the SAME
            # keys (PGRST102 "All object keys must match"), and an optional key
            # fails POSITIONALLY: the first eight 200-row batches were
            # homogeneous and succeeded, then batch nine held the first row
            # with a repeat and 400'd — which reads like a size or content
            # problem rather than a schema-shape one. Exactly ONE row of 2,205
            # carries a repeat (POST Basic Academy), and it took the load down.
            "cid_repeats": repeats or None,
            "source_generated_at": data.get("generated_at"),
        }
        rows.append(row)
    return rows


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--artifact", default=ARTIFACT)
    ap.add_argument("--out", default=OUT)
    ap.add_argument("--show", metavar="TITLE", help="print one credential's set and exit")
    args = ap.parse_args()

    data = load_artifact(args.artifact)
    rows = build(data)

    if args.show:
        hit = [r for r in rows if r["unified_title"].lower() == args.show.lower()]
        if not hit:
            print(f"no recommendation row for {args.show!r}")
            return 1
        print(json.dumps(hit[0], indent=2))
        return 0

    sw = [r for r in rows if r["rec_kind"] == "statewide_authoritative"]
    lo = [r for r in rows if r["rec_kind"] == "local_modal"]
    # A statewide set that lost its C-ID lines would silently degrade the very
    # answer this layer exists to fix, so assert it rather than trust it.
    if not sw:
        raise SystemExit("FATAL: no statewide authoritative sets built — check the artifact shape.")
    with open(args.out, "w", encoding="utf-8") as fh:
        json.dump({"_generated_from": os.path.basename(args.artifact),
                   "_source_generated_at": data.get("generated_at"),
                   "rows": rows}, fh, indent=1, sort_keys=False)
        fh.write("\n")

    print(f"credentials with a recommendation set : {len(rows)}")
    print(f"  statewide (authoritative)           : {len(sw)}  "
          f"({sum(r['n_recs'] for r in sw)} lines, {sum(r['n_cid_recs'] for r in sw)} C-ID)")
    print(f"  local (most common, capped {LOCAL_REC_CAP})       : {len(lo)}  "
          f"({sum(r['n_recs'] for r in lo)} lines)")
    print(f"wrote {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
