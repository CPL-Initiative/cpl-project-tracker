#!/usr/bin/env python3
"""Verify (and prototype) the EACR prescriptive-layer join — PR-4.

The EACR "Credential view" (v2) wants, per credential, the list of colleges that
COULD adopt it and the *specific local course* each one would articulate. That
data is NOT on the EACR card (its `potential_names` come from TOP/CID program
matching). It lives in two committed KB files, joined on the M-ID `course_id`:

  kb/coci_articulations.json   articulations[].adoption_leverage = leverage
                               college NAMES (peer colleges teaching the same
                               identity that have NOT yet earned the articulation)
  kb/coci_minted_memberships.json  memberships[course_id] = [{college, subject,
                               course_number, units, …}]  → the local course each
                               college teaches for that identity

This script builds the same `unified_title -> {colleges:[…]}` map the producer
emits and validates it: the documented CNST M1029 spot-check, coverage stats,
the over-merge guardrail, the CompTIA-A+ multi-M-ID aggregation, and the payload
size. It is the in-session test for a change whose full regen ISN'T testable here
(the raw CustomReport isn't in the container). Run: `python3 kb/_verify_prescriptive_join.py`.

The build_prescriptive() function below is the reference implementation that is
ported verbatim into excel_to_dashboard.py::_build_statewide_prescriptive().
"""
import json
import os
import sys

KB = os.path.dirname(os.path.abspath(__file__))


def build_prescriptive(art_doc, mem_doc):
    """unified_title -> {colleges:[{college, courses:[{subject,number,units}], n_ids}],
                         n_colleges, withheld}.

    M-ID leverage only (resolves 100% from committed JSON). Over-merged course_ids
    are WITHHELD (counted, not emitted) per the §6a guardrail. The (subject,number)
    membership key is lossy, so recommendations are "likely", not certain.
    """
    identities = art_doc.get("identities", {}) or {}
    records = art_doc.get("articulations", []) or []
    memberships = mem_doc.get("memberships", {}) or {}

    # unified_title -> college -> {courses: set[(subject,number,units)], ids: set[cid]}
    acc = {}
    withheld = {}   # unified_title -> set(colleges withheld via over_merged ids)
    stats = {"slots_total": 0, "slots_resolved": 0, "slots_unresolved": 0,
             "records_mid": 0, "records_over_merged": 0, "cid_missing_membership": 0}

    for r in records:
        if r.get("identity_system") != "M-ID":
            continue
        lev = r.get("adoption_leverage")
        if not isinstance(lev, list) or not lev:
            continue
        ut = r.get("unified_title") or ""
        if not ut:
            continue
        cid = r.get("course_id")
        over = bool(r.get("over_merged")) or bool((identities.get(cid) or {}).get("over_merged"))
        stats["records_mid"] += 1
        stats["slots_total"] += len(lev)

        if over:
            stats["records_over_merged"] += 1
            w = withheld.setdefault(ut, set())
            for c in lev:
                w.add(c)
            continue

        members = memberships.get(cid)
        if not members:
            stats["cid_missing_membership"] += 1
        # college -> list of member course dicts at that college
        by_college = {}
        for m in (members or []):
            by_college.setdefault((m.get("college") or "").strip(), []).append(m)

        ut_acc = acc.setdefault(ut, {})
        for college in lev:
            college = (college or "").strip()
            if not college:
                continue
            entry = ut_acc.setdefault(college, {"courses": set(), "ids": set()})
            entry["ids"].add(cid)
            ms = by_college.get(college, [])
            if ms:
                stats["slots_resolved"] += 1
                for m in ms:
                    subj = (m.get("subject") or "").strip()
                    num = (m.get("course_number") or "").strip()
                    units = m.get("units")
                    if subj or num:
                        entry["courses"].add((subj, num, units))
            else:
                stats["slots_unresolved"] += 1

    # Materialize → JSON-serializable, sorted, deduped.
    out = {}
    for ut, colleges in acc.items():
        rows = []
        for college, e in colleges.items():
            courses = sorted(e["courses"], key=lambda t: (t[0], t[1]))
            rows.append({
                "college": college,
                "courses": [{"subject": s, "number": n, "units": u} for (s, n, u) in courses[:4]],
            })
        rows.sort(key=lambda x: x["college"])
        w = withheld.get(ut, set())
        # Don't double-count a college that also has a clean recommendation.
        clean = {r["college"] for r in rows}
        w_only = sorted(w - clean)
        out[ut] = {"colleges": rows, "n_colleges": len(rows), "withheld": len(w_only)}
    # Fold in titles that were ENTIRELY withheld (all their ids over_merged).
    for ut, w in withheld.items():
        if ut not in out:
            clean = set()
            out[ut] = {"colleges": [], "n_colleges": 0, "withheld": len(w)}
    return out, stats


def main():
    art = json.load(open(os.path.join(KB, "coci_articulations.json"), encoding="utf-8"))
    mem = json.load(open(os.path.join(KB, "coci_minted_memberships.json"), encoding="utf-8"))
    pres, stats = build_prescriptive(art, mem)

    failures = []

    def check(label, cond):
        print(("  OK  " if cond else "  FAIL ") + label)
        if not cond:
            failures.append(label)

    print("\n=== STATS ===")
    for k, v in stats.items():
        print(f"  {k}: {v:,}")
    print(f"  unified_titles with a prescriptive entry: {len(pres):,}")
    n_colleges = sum(p["n_colleges"] for p in pres.values())
    print(f"  total (title,college) recommendations: {n_colleges:,}")
    size = len(json.dumps(pres, ensure_ascii=False))
    print(f"  payload size (raw json): {size:,} bytes ({size/1024:.0f} KB)")

    print("\n=== SPOT-CHECK: CNST M1029 (Carpenters Apprenticeship — Drywall/Lather) ===")
    # The articulation record's unified_title:
    cnst = [r for r in art["articulations"] if r.get("course_id") == "CNST M1029"]
    ut = cnst[0]["unified_title"] if cnst else None
    print(f"  unified_title: {ut!r} | leverage: {cnst[0].get('adoption_leverage') if cnst else None}")
    entry = pres.get(ut, {})
    check("CNST M1029's unified_title has a prescriptive entry", bool(entry))
    colmap = {c["college"]: c for c in entry.get("colleges", [])}
    check("Palomar College is a recommended adopter", "Palomar College" in colmap)
    check("Rio Hondo College is a recommended adopter", "Rio Hondo College" in colmap)
    for cn in ("Palomar College", "Rio Hondo College"):
        if cn in colmap:
            crs = colmap[cn]["courses"]
            txt = ", ".join(f"{c['subject']} {c['number']} ({c['units']}u)" for c in crs)
            print(f"    {cn} -> {txt or '(course not resolved)'}")
            check(f"{cn} resolves to a named local course", bool(crs))

    print("\n=== OVER-MERGE GUARDRAIL ===")
    # The guarantee (§6a): a college is never recommended SOLELY because of an
    # over_merged cluster. A college may still legitimately appear if a *clean*
    # (non-over-merged) M-ID for the same unified_title also lists it. So the
    # real invariant is: every emitted (title, college) recommendation has a
    # clean source. Recompute the clean / over-merged-only pair sets independently.
    clean_pairs, overmerged_pairs = set(), set()
    for r in art["articulations"]:
        if r.get("identity_system") != "M-ID":
            continue
        lev = r.get("adoption_leverage")
        if not isinstance(lev, list) or not lev:
            continue
        ut = r.get("unified_title") or ""
        cid = r.get("course_id")
        over = bool(r.get("over_merged")) or bool((art["identities"].get(cid) or {}).get("over_merged"))
        for c in lev:
            pair = (ut, (c or "").strip())
            (overmerged_pairs if over else clean_pairs).add(pair)
    emitted_pairs = {(ut, c["college"]) for ut, p in pres.items() for c in p["colleges"]}
    over_merged_only = overmerged_pairs - clean_pairs
    print(f"  clean (title,college) pairs: {len(clean_pairs):,} | "
          f"over-merged-only pairs (must NOT be emitted): {len(over_merged_only):,}")
    check("every emitted recommendation has a clean (non-over-merged) source",
          emitted_pairs <= clean_pairs)
    check("no over-merged-ONLY pair leaked into the output",
          not (emitted_pairs & over_merged_only))
    total_withheld = sum(p["withheld"] for p in pres.values())
    check("the over-merge guardrail actually fired somewhere (withheld > 0)",
          total_withheld > 0)
    print(f"  total colleges withheld (over-merged, no clean source): {total_withheld:,}")

    print("\n=== CompTIA A+ multi-M-ID aggregation ===")
    aplus = [r for r in art["articulations"]
             if "CompTIA A+" in (r.get("unified_title") or "") and r.get("identity_system") == "M-ID"]
    uts = sorted({r["unified_title"] for r in aplus})
    print(f"  CompTIA A+ M-ID articulation records: {len(aplus)} across unified_titles: {uts}")
    for u in uts:
        if u in pres:
            print(f"    {u!r}: {pres[u]['n_colleges']} colleges, {pres[u]['withheld']} withheld")

    print("\n" + ("ALL CHECKS PASSED" if not failures else f"{len(failures)} CHECK(S) FAILED"))
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
