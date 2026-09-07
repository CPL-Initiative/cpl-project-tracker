#!/usr/bin/env python3
"""Build SkyView's CPL payload — prototype/ccr_cpl.json.

Sam's rulings of 2026-09-07 (decision sheet items 1-3): the map gets a CPL face
and an articulations light. Both stand on ONE join — a MAP exhibit reaches a
point on the map only through the receiving college course — and this file is
where that join is materialized for the browser.

WHAT IT READS, AND WHY EACH SOURCE
  kb/coci_articulations.json         the articulation crosswalk: exhibit -> the
                                     identity its receiving course resolves to.
                                     ⚠️ This is the join the map's `ar` badge is
                                     already counted from (kb/_build_ccr_universe.py
                                     articulation_counts), so the lit set and the
                                     CPL face agree by construction. Its inlined
                                     issuing_agency is a 2026-05-21 snapshot and is
                                     NOT used here — see the next line.
  credential_reference_data.js       the curated credential vocabulary (CER), one
                                     row per unified title with the curated ISSUER
                                     and TRAINER, regenerated daily. Agencies come
                                     from here: measured 2026-09-07, the crosswalk's
                                     inlined issuer disagreed with the CER on 1,743
                                     of 4,592 records, mostly a null where the CER
                                     had been curated since.
  statewide_data.js                  MAP's articulated-exhibit feed as the daily run
                                     mirrors it (View_ArticulatedMAPExhibits). It is
                                     the DENOMINATOR universe for the coverage line,
                                     and it flags a crosswalk exhibit that today's
                                     feed no longer carries.
  prototype/ccr_universe.json        which identities are on the map at all.
  kb/ccr_cpl_funnel.json             a dated, hand-refreshed read of MAP's credit
                                     funnel (public.map_college_cr_unit). Carried
                                     for the record, NOT for the coverage line.

⚠️ THE COVERAGE LINE TAKES BOTH NUMBERS FROM THE SAME UNIVERSE. The sheet's
proposed line read "1,490 of 6,388 exhibits reach a course on this map", and
neither number belongs in it: 1,490 is the count of IDENTITIES that carry an
articulation (the numerator mislabeled), and 6,388 is the credit funnel's exhibit
count — a universe that shares only 570 exhibit ids with the 1,924 that reach the
map, because the funnel is ACE-keyed (6,291 of its 6,388 ids are ACE exhibits, the
JST military record) and the crosswalk is MAP-keyed (industry certification,
credit by exam, assessments). Measured 2026-09-07 through the Supabase MCP. So the
numerator is the crosswalk's exhibits that reach the map and the denominator is
the union of the articulated feed and the crosswalk — the surface computes it
from this file and never quotes a figure.

⚠️ STRUCTURAL COUNTS ONLY. No student figure enters this payload: the funnel
sidecar carries rows, exhibits and colleges, never distinct_students or a credit
sum, and nothing here reads map_student_credit.

⚠️ A STALE EXHIBIT IS FLAGGED, NEVER DROPPED (Sam's ruling 5, 2026-09-05: ids
resolving to nothing become a worklist, never a silent drop). A crosswalk exhibit
absent from today's feed keeps its point and carries `s:1`; the report below
names them.

Run from the repo root:
    python3 kb/_build_ccr_cpl.py            # writes prototype/ccr_cpl.json
    python3 kb/_build_ccr_cpl.py --check    # exit 1 if the committed file is stale
"""
import argparse
import datetime as dt
import json
import os
import sys
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

CROSSWALK = os.path.join(ROOT, "kb", "coci_articulations.json")
CER_JS = os.path.join(ROOT, "credential_reference_data.js")
STATEWIDE_JS = os.path.join(ROOT, "statewide_data.js")
UNIVERSE = os.path.join(ROOT, "prototype", "ccr_universe.json")
FUNNEL = os.path.join(ROOT, "kb", "ccr_cpl_funnel.json")
OUT = os.path.join(ROOT, "prototype", "ccr_cpl.json")


def load_js_object(path):
    """`window.X = {...};` -> the object. The daily artifacts are JS, not JSON."""
    with open(path, encoding="utf-8") as fh:
        src = fh.read()
    i = src.index("{")
    j = src.rindex("}")
    return json.loads(src[i:j + 1])


def load_json(path):
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


def build(root=ROOT):
    xw = load_json(os.path.join(root, "kb", "coci_articulations.json"))
    cer = load_js_object(os.path.join(root, "credential_reference_data.js"))
    sw = load_js_object(os.path.join(root, "statewide_data.js"))
    uni = load_json(os.path.join(root, "prototype", "ccr_universe.json"))
    funnel = load_json(os.path.join(root, "kb", "ccr_cpl_funnel.json"))

    # ── what is on the map ────────────────────────────────────────────────────
    on_map = {}            # identity id -> discipline
    points = 0
    lit_by_ar = 0
    for isl in uni.get("islands") or []:
        for p in isl.get("p") or []:
            points += 1
            on_map[p["i"]] = isl.get("d") or ""
            if p.get("ar"):
                lit_by_ar += 1

    # ── the curated agencies, keyed by unified title ─────────────────────────
    agencies = {}
    for row in cer.get("unified_titles") or []:
        ut = row.get("ut")
        if not ut:
            continue
        issuer = (row.get("issuer") or "").strip() or None
        trainer = (row.get("trainer") or "").strip() or None
        agencies[ut] = (issuer, trainer)

    # ── the articulated-exhibit universe, and what today's feed still carries ─
    feed_ids = set()
    for e in sw.get("exhibits") or []:
        for x in (e.get("exhibit_ids") or [e.get("exhibit_id")]):
            if x:
                feed_ids.add(x)

    # ── the join ──────────────────────────────────────────────────────────────
    recs = [r for r in (xw.get("articulations") or []) if r.get("course_id") in on_map]
    all_xw_exhibits = {r.get("exhibit_id") for r in (xw.get("articulations") or []) if r.get("exhibit_id")}

    types, type_idx = [], {}
    colleges, college_idx = [], {}
    creds, cred_idx = [], {}

    def tix(t):
        t = (t or "").strip() or "Type not recorded"
        if t not in type_idx:
            type_idx[t] = len(types)
            types.append(t)
        return type_idx[t]

    def cix(c):
        c = (c or "").strip()
        if not c:
            return None
        if c not in college_idx:
            college_idx[c] = len(colleges)
            colleges.append(c)
        return college_idx[c]

    def kix(ut, rec_issuer):
        if ut not in cred_idx:
            issuer, trainer = agencies.get(ut, (None, None))
            if issuer is None:
                issuer = (rec_issuer or "").strip() or None
            # The trainer is carried only where it DIFFERS from the issuer — the
            # ruled display is "issuing agency and training agency where they
            # differ", and a trainer equal to the issuer would print twice.
            ta = trainer if (trainer and trainer != issuer) else None
            cred_idx[ut] = len(creds)
            creds.append([ut, issuer, ta])
        return cred_idx[ut]

    # identity -> credential -> [exhibit rows]
    by = defaultdict(lambda: defaultdict(list))
    exhibits_on_map = set()
    stale = set()
    for r in recs:
        ut = r.get("unified_title") or r.get("exhibit_title") or "(untitled exhibit)"
        ex_id = r.get("exhibit_id") or ""
        k = kix(ut, r.get("issuing_agency"))
        cols = sorted({c for c in (cix(c) for c in (r.get("earned_by_colleges") or [])) if c is not None})
        row = [ex_id, r.get("exhibit_title") or "", tix(r.get("cpl_type_description")),
               list(r.get("credit_recommendations") or []), cols]
        if ex_id and feed_ids and ex_id not in feed_ids:
            row.append(1)          # s:1 — not in today's feed; flagged, never dropped
            stale.add(ex_id)
        by[r["course_id"]][k].append(row)
        if ex_id:
            exhibits_on_map.add(ex_id)

    # order: within an identity, the credential held by the most colleges first;
    # within a credential, the exhibit held by the most colleges first.
    out_by = {}
    for cid, per_cred in by.items():
        entries = []
        for k, rows in per_cred.items():
            rows.sort(key=lambda x: (-len(x[4]), x[0]))
            held = len({c for x in rows for c in x[4]})
            entries.append((-(held), creds[k][0].lower(), [k, rows]))
        entries.sort(key=lambda e: (e[0], e[1]))
        out_by[cid] = [e[2] for e in entries]

    issuers = {c[1] for c in creds if c[1]}
    trainers = {c[2] for c in creds if c[2]}
    creds_with_trainer = sum(1 for c in creds if c[2])
    universe_exhibits = feed_ids | all_xw_exhibits
    by_type = Counter(types[x[2]] for rows in by.values() for lst in rows.values() for x in lst)

    payload = {
        "_about": ("SkyView's CPL payload: for every course identity on the map, the MAP exhibits that "
                   "reach it through a receiving college course, led by the curated credential name with "
                   "the issuing agency and, where it differs, the training agency. Read-only; nothing "
                   "writes back. Structural counts only — no student figure."),
        "_generated_by": "kb/_build_ccr_cpl.py",
        "_generated_at": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "_sources": {
            "join": "kb/coci_articulations.json (exhibit -> identity through the receiving course; the same join the map's `ar` badge counts)",
            "agencies": "credential_reference_data.js (the curated CER: issuer and trainer per unified title, daily)",
            "universe": "statewide_data.js (MAP's articulated-exhibit feed, daily) unioned with the crosswalk's exhibits",
            "map": "prototype/ccr_universe.json",
            "funnel": "kb/ccr_cpl_funnel.json (public.map_college_cr_unit, dated read; for the record, not the coverage line)",
        },
        "counts": {
            "points": points,
            "identities_reached": len(out_by),
            "identities_with_ar": lit_by_ar,
            "records": len(recs),
            "exhibits_on_map": len(exhibits_on_map),
            "exhibits_articulated": len(universe_exhibits),
            "exhibits_in_feed": len(feed_ids),
            "exhibits_on_map_not_in_feed": len(stale),
            "credentials": len(creds),
            "issuers": len(issuers),
            "credentials_with_trainer": creds_with_trainer,
            "trainer_names": len(trainers),
            "colleges": len(colleges),
            "by_type": dict(by_type.most_common()),
            "funnel": {k: v for k, v in funnel.items() if not k.startswith("_")},
            "funnel_read_at": funnel.get("_read_at"),
        },
        "types": types,
        "colleges": colleges,
        "creds": creds,
        "by": out_by,
    }
    report = {"stale": sorted(stale)}
    return payload, report


def strip_volatile(p):
    q = dict(p)
    q.pop("_generated_at", None)
    return q


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--out", default=OUT)
    ap.add_argument("--check", action="store_true",
                    help="exit 1 if the committed payload differs from a fresh build (ignoring the timestamp)")
    ap.add_argument("--quiet", action="store_true")
    args = ap.parse_args()

    payload, report = build()
    c = payload["counts"]
    if not args.quiet:
        print(f"identities reached {c['identities_reached']:,} (points with ar: {c['identities_with_ar']:,}) · "
              f"records {c['records']:,} · exhibits on map {c['exhibits_on_map']:,} of {c['exhibits_articulated']:,} "
              f"articulated · credentials {c['credentials']:,} · issuers {c['issuers']:,} · "
              f"credentials with a training agency that differs {c['credentials_with_trainer']:,} "
              f"({c['trainer_names']:,} agencies) · colleges {c['colleges']:,}")
        print("by type: " + " · ".join(f"{k} {v:,}" for k, v in c["by_type"].items()))
        if report["stale"]:
            print(f"⚠️ {len(report['stale'])} exhibit(s) on the map are not in today's feed (flagged s:1, kept): "
                  + ", ".join(report["stale"][:12]) + (" …" if len(report["stale"]) > 12 else ""))
    if c["identities_reached"] != c["identities_with_ar"]:
        print(f"⚠️ the CPL join reaches {c['identities_reached']:,} identities but {c['identities_with_ar']:,} "
              f"points carry `ar` — rebuild the universe layout or the two surfaces will disagree", file=sys.stderr)

    if args.check:
        try:
            committed = load_json(args.out)
        except (OSError, ValueError):
            print(f"STALE: {os.path.relpath(args.out, ROOT)} is missing or unreadable", file=sys.stderr)
            return 1
        if strip_volatile(committed) != strip_volatile(payload):
            print(f"STALE: {os.path.relpath(args.out, ROOT)} differs from a fresh build — "
                  f"run python3 kb/_build_ccr_cpl.py and commit it", file=sys.stderr)
            return 1
        print(f"{os.path.relpath(args.out, ROOT)} is current")
        return 0

    with open(args.out, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, ensure_ascii=False, separators=(",", ":"))
        fh.write("\n")
    if not args.quiet:
        print(f"wrote {os.path.relpath(args.out, ROOT)} ({os.path.getsize(args.out) / 1024:.0f} KB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
