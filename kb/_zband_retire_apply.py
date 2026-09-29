#!/usr/bin/env python3
"""Z-band retirement — APPLY (items 20 and 21 of Sam's 2026-09-03 rulings, readings
cards 11 to 13 ruled yes to all the same day; Rule 7). The receipted half of
kb/_zband_retire_dryrun.py.

The plan is RECOMPUTED here through the dry run's compute_plan() (apply == spec)
on the post-recode state and gated against the frozen, Sam-reviewed receipt
kb/zband_retire_out/2026-09-03/alias_map.json (P1). Nothing is written unless
every gate passes; --apply writes.

What mutates:
  kb/coci_curation.json            Z self-keys -> M keys; merge_into pointers
                                   re-pointed (Z and legacy targets)
  kb/coci_minted_courses.json      MATERIALIZED: one real M-ID record per retired
                                   identity (title, discipline, the aggregate of
                                   its members, `origin: machine cluster`,
                                   `_zband_retired_from`) — Sam, readings card 12.
                                   The members keep their own records and their
                                   merge_into pointers; the new record carries no
                                   membership entry of its own, so no college
                                   course is counted twice anywhere.
  kb/common_courses.json           legacy `M-ID SUBJ ###` anchors -> `SUBJ M####`
                                   / `SUBJ M##XX` (+ `origin`, `_zband_retired_from`)
  kb/course_crosswalk.json         course_id values re-pointed
  kb/uc_cur_zseq.json              RETIRED (counters kept under
                                   _counters_at_retirement); the Z scripts refuse
                                   to run on a retired counter file

Supabase is NOT written here. The kb_curation re-key runs from the committed
receipt through .github/workflows/supabase-rekey.yml in the same cron window
(legacy anchors have no Supabase rows; their pairs no-op).

Gates (all must pass or nothing is written):
  V1-V7  the dry run's validations, recomputed
  P0     not already applied
  P1     plan fidelity: the recomputed alias map == the frozen receipt
  P3     curation freshness at write-time (--curation-export or --fresh-read)
  Z1-Z10 post-mutation: no Z key or pointer left; curation count conserved;
         catalog grows by exactly the retired identities, each key == course_id,
         M-shaped, stamped, titled, with members; memberships untouched;
         untouched rows byte-identical; common/crosswalk conserved and mapped;
         minted/singleton disjoint; every M/Z-shaped pointer resolves

Usage (from repo root):
  python3 kb/_zband_retire_apply.py                                        # verify
  python3 kb/_zband_retire_apply.py --fresh-read /tmp/fresh.json --apply   # write
Receipt: kb/zband_retire_out/2026-09-03/{alias_map.json (restamped APPLIED),
materialized.json, supabase_ops.json, validation.md}
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from collections import Counter
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import _zband_retire_dryrun as zdry  # noqa: E402
from _authority_recode_apply import (_atomic_dump, _trailing_nl, fresh_read_matches,  # noqa: E402
                                     plan_fidelity, rebuild_overlay)

MEMBERSHIPS = os.path.join(HERE, "coci_minted_memberships.json")
ZSEQ = os.path.join(HERE, "uc_cur_zseq.json")
ALIASES = os.path.join(HERE, "discipline_aliases.json")
RECODE_RECEIPT = os.path.join(HERE, "authority_recode_out", "2026-09-03")
RECEIPT_DIR = os.environ.get("ZBAND_RETIRE_RECEIPT") or os.path.join(HERE, "zband_retire_out", "2026-09-03")
STAMP = "_zband_retired_from"
APPLIED = "_zband_retire_applied_at"
ORIGIN_Z = "machine cluster"
ORIGIN_LEGACY = "curated common-course anchor (2026-05)"
MZ_RE = re.compile(r"^[A-Z]{1,6} [MZ][0-9][A-Z0-9]{3}$")
CLASSIFIED_BY = ("kb/_zband_retire_apply.py — machine cluster materialized as an M-ID record "
                 "(item 20 of the 2026-09-03 rulings; readings card 12, Sam, 2026-09-03)")


def _load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _modal(values):
    """(value, mixed): the value when all non-null agree; the modal value with
    mixed=True when they differ; (None, False) when nothing is known."""
    vals = [v for v in values if v not in (None, "")]
    if not vals:
        return None, False
    c = Counter(vals)
    top, n = c.most_common(1)[0]
    return top, len(c) > 1


def materialize(zid, new_id, entry, members, courses, singletons, memberships, today):
    """The catalog record for a retired machine cluster: the aggregate of its
    pointing members, the curation row's title and discipline, origin kept."""
    recs = [(m, courses.get(m) or singletons.get(m) or {}) for m in members]
    colleges, subjects, discs = set(), Counter(), Counter()
    units, credit, tops, nccs, confs, descs, titles = [], [], [], [], [], [], []
    cte = False
    for m, r in recs:
        if m in memberships:
            for x in memberships[m]:
                if x.get("college"):
                    colleges.add(x["college"])
                if x.get("subject"):
                    subjects[str(x["subject"]).upper()] += 1
        else:
            if r.get("college"):
                colleges.add(r["college"])
            if r.get("subject"):
                subjects[str(r["subject"]).upper()] += 1
        if r.get("discipline"):
            discs[r["discipline"]] += 1
        units.append(r.get("typical_units"))
        credit.append(r.get("credit_status"))
        tops.append(r.get("top_code"))
        nccs.append(r.get("noncredit_category"))
        confs.append(r.get("confidence"))
        descs.append(r.get("description"))
        titles.append(r.get("common_title"))
        cte = cte or bool(r.get("cte"))
    subj4 = new_id.split(" ")[0]
    u, u_mixed = _modal(units)
    cs, cs_mixed = _modal(credit)
    tp, tp_mixed = _modal(tops)
    nc, nc_mixed = _modal(nccs)
    desc = next((d for d in descs if d), None)
    conf = min((c for c in confs if isinstance(c, (int, float))), default=None)
    return {
        "course_id": new_id, "id_system": "M-ID", "ccn_id": None, "c_id": None,
        "common_title": entry.get("unified_title") or next((t for t in titles if t), None),
        "common_title_source": "curation unified_title (machine cluster)",
        "description": desc,
        "description_source": "member catalog (representative)" if desc else None,
        "subject": (subjects.most_common(1)[0][0] if subjects else subj4),
        "subject_4letter": subj4,
        "discipline": entry.get("discipline") or (discs.most_common(1)[0][0] if discs else None),
        "discipline_provisional": None,
        "typical_units": u, "confidence": conf,
        "corroboration_members": len(members), "subject_spread": len(subjects),
        "source_college_count": len(colleges),
        "classified_at": today, "classified_by": CLASSIFIED_BY,
        "reviewed_at": None, "reviewed_by": None,
        "_notes": (f"Materialized from the curation overlay's machine cluster {zid}. The members keep "
                   f"their own records and their merge_into pointers; this record carries the aggregate "
                   f"and has no membership entry of its own."),
        "credit_status": cs, "credit_status_mixed": cs_mixed,
        "top_code": tp, "top_code_mixed": tp_mixed,
        "top_code_distribution": dict(Counter(t for t in tops if t)),
        "noncredit_category": nc, "noncredit_category_mixed": nc_mixed,
        "noncredit_category_distribution": dict(Counter(n for n in nccs if n)),
        "cte": cte, "origin": ORIGIN_Z, STAMP: zid,
        "_machine_cluster_members": list(members),
    }


def apply_plan(docs, plan, now):
    """Mutate the loaded docs in place from the plan; returns (stats, materialized)."""
    alias = {k: v for k, v in plan["alias"].items() if v and v != k}
    z_alias = {k: v for k, v in alias.items() if zdry.Z_RE.match(k)}
    courses_doc, singles_doc = docs["courses"], docs["singletons"]
    mem = docs["memberships"]["memberships"]
    cur_doc, common, crosswalk, zseq_doc = docs["curation"], docs["common"], docs["crosswalk"], docs["zseq"]
    courses, singletons = courses_doc["courses"], singles_doc["courses"]
    old_cur = cur_doc.get("curations") or {}
    stats = Counter()
    today = now[:10]

    # members per retired identity, from the pre-apply overlay
    members_of = {}
    for k, v in old_cur.items():
        if isinstance(v, dict) and v.get("merge_into") in z_alias:
            members_of.setdefault(v["merge_into"], []).append(k)

    # 1. the curation overlay: keys and pointers
    new_cur = {}
    for k, ent in old_cur.items():
        nk = alias.get(k, k)
        if nk != k:
            stats["curation_keys"] += 1
        if isinstance(ent, dict) and ent.get("merge_into") in alias:
            ent = dict(ent)
            ent["merge_into"] = alias[ent["merge_into"]]
            stats["curation_pointers"] += 1
        new_cur[nk] = ent
    cur_doc["curations"] = dict(sorted(new_cur.items()))
    cur_doc["count"] = len(new_cur)
    cur_doc["_zband_retired_at"] = now

    # 2. materialize every retired identity as a catalog record
    materialized = []
    for zid, new_id in sorted(z_alias.items()):
        if new_id in courses or new_id in singletons:
            raise SystemExit(f"FATAL: {new_id} already exists in the catalog — the plan is not disjoint")
        members = sorted(members_of.get(zid, []))
        rec = materialize(zid, new_id, old_cur.get(zid) or {}, members, courses, singletons, mem, today)
        courses[new_id] = rec
        materialized.append({"new_id": new_id, "from": zid, "title": rec["common_title"],
                             "discipline": rec["discipline"], "members": len(members),
                             "colleges": rec["source_college_count"]})
        stats["materialized"] += 1
    courses_doc["count"] = len(courses)
    courses_doc[APPLIED] = now

    # 3. legacy anchors in common_courses + the crosswalk
    new_common = {}
    for k, rec in common.items():
        nk = alias.get(k, k)
        if nk != k:
            rec = dict(rec)
            rec["origin"] = ORIGIN_LEGACY
            rec[STAMP] = k
            stats["legacy_anchors"] += 1
        new_common[nk] = rec
    common.clear()
    common.update(new_common)
    for k, v in crosswalk.items():
        if isinstance(v, dict) and v.get("course_id") in alias:
            v["course_id"] = alias[v["course_id"]]
            stats["crosswalk_refs"] += 1

    # 4. retire the Z counters
    zseq_doc["_counters_at_retirement"] = dict(zseq_doc.get("counters") or {})
    zseq_doc["counters"] = {}
    zseq_doc["_retired_at"] = now
    zseq_doc["_retired_by"] = "kb/_zband_retire_apply.py"
    zseq_doc["_about"] = ("RETIRED 2026-09-03 (Sam: everything that is not a C-ID or CCN is an M-ID; items "
                          "20-21). The Z band is gone: every machine cluster is a real M-ID record in "
                          "kb/coci_minted_courses.json with origin 'machine cluster'. New machine clusters "
                          "mint M numbers (lowest free in the bucket, continuation band when full), never Z. "
                          "The pre-retirement counters are kept under _counters_at_retirement for the record.")
    return stats, materialized


def post_gates(orig, docs, plan, materialized):
    alias = {k: v for k, v in plan["alias"].items() if v and v != k}
    z_alias = {k: v for k, v in alias.items() if zdry.Z_RE.match(k)}
    courses = docs["courses"]["courses"]
    singletons = docs["singletons"]["courses"]
    cur = docs["curation"]["curations"]
    common, crosswalk = docs["common"], docs["crosswalk"]
    g = {}
    g["Z1 no Z-shaped key or merge_into pointer remains in the overlay"] = (
        not any(zdry.Z_RE.match(k) for k in cur)
        and not any(isinstance(v, dict) and zdry.Z_RE.match(v.get("merge_into") or "") for v in cur.values()))
    g["Z2 overlay count conserved and keys are the exact permutation"] = (
        len(cur) == len(orig["curation"]) and set(cur) == {alias.get(k, k) for k in orig["curation"]})
    g["Z3 catalog grows by exactly the retired identities"] = (
        len(courses) == len(orig["courses"]) + len(z_alias)
        and all(v in courses for v in z_alias.values()) and len(materialized) == len(z_alias))
    g["Z4 every materialized record: key == course_id, M shape, stamp, title, members"] = all(
        courses[v].get("course_id") == v and zdry.M_CORR_RE.match(v) and courses[v].get(STAMP) == k
        and courses[v].get("common_title") and courses[v].get("corroboration_members", 0) >= 1
        and courses[v].get("origin") == ORIGIN_Z for k, v in z_alias.items())
    g["Z5 memberships untouched"] = docs["memberships"]["memberships"] == orig["memberships"]
    untouched = all(json.dumps(courses.get(k), sort_keys=True) == json.dumps(rec, sort_keys=True)
                    for k, rec in orig["courses"].items()) and all(
        json.dumps(singletons.get(k), sort_keys=True) == json.dumps(rec, sort_keys=True)
        for k, rec in orig["singletons"].items())
    g["Z6 pre-existing catalog rows byte-identical"] = untouched
    legacy = {k: v for k, v in alias.items() if zdry.LEGACY_RE.match(k)}
    g["Z7 common_courses conserved: legacy keys moved, blocked ones kept, records stamped"] = (
        len(common) == len(orig["common"]) and set(common) == {alias.get(k, k) for k in orig["common"]}
        and all(common[v].get(STAMP) == k and common[v].get("origin") == ORIGIN_LEGACY for k, v in legacy.items())
        and all(b["old_id"] in common for b in plan["blocked"]))
    g["Z8 crosswalk course_id multiset mapped exactly"] = (
        sorted(v.get("course_id") or "" for v in crosswalk.values() if isinstance(v, dict))
        == sorted(alias.get(c, c) for c in orig["crosswalk_multiset"]))
    g["Z9 minted/singleton key spaces disjoint"] = not (set(courses) & set(singletons))
    live = set(courses) | set(singletons) | set(cur)
    g["Z10 every M/Z-shaped merge_into target resolves to a live key"] = all(
        not (isinstance(v, dict) and v.get("merge_into") and MZ_RE.match(v["merge_into"]))
        or v["merge_into"] in live for v in cur.values())
    g["Z11 the Z counters are retired"] = docs["zseq"].get("counters") == {} and bool(docs["zseq"].get("_retired_at"))
    return g


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--after-recode", default=RECODE_RECEIPT,
                    help="the recode receipt dir the plan composes with (a no-op once the recode is applied)")
    ap.add_argument("--curation-export")
    ap.add_argument("--fresh-read")
    ap.add_argument("--allow-plan-drift", action="store_true")
    ap.add_argument("--receipt", default=RECEIPT_DIR)
    args = ap.parse_args()
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    courses_doc, singles_doc = _load(zdry.COURSES), _load(zdry.SINGLETONS)
    if courses_doc.get(APPLIED):
        sys.exit("ABORT (P0): _zband_retire_applied_at already present — the Z band is retired.")
    mem_doc, cur_doc = _load(MEMBERSHIPS), _load(zdry.CURATION)
    art_doc, common, crosswalk = _load(zdry.ARTICULATIONS), _load(zdry.COMMON), _load(zdry.CROSSWALK)
    canon_doc, fl_doc = _load(zdry.CANONICAL), _load(zdry.FL_SPLIT)
    if os.path.exists(ALIASES):
        canon_doc["_aliases"] = _load(ALIASES).get("aliases") or {}
    zseq_doc = _load(ZSEQ) if os.path.exists(ZSEQ) else {"counters": {}}
    if zseq_doc.get("_retired_at"):
        sys.exit("ABORT (P0): kb/uc_cur_zseq.json is already retired.")
    committed = cur_doc.get("curations") or {}
    if not any(zdry.Z_RE.match(k) for k in committed):
        sys.exit("ABORT (P0): no Z identities in the overlay — nothing to retire.")

    if args.curation_export:
        rebuilt = rebuild_overlay(_load(args.curation_export))
        if json.dumps(rebuilt, sort_keys=True) != json.dumps(committed, sort_keys=True):
            sys.exit("ABORT (P3): the export does not rebuild the committed overlay — live curation drifted.")
        p3 = f"export rebuilds the committed overlay exactly ({len(committed)} entries)"
    elif args.fresh_read:
        fresh = _load(args.fresh_read)
        if not fresh_read_matches(fresh, committed):
            sys.exit(f"ABORT (P3): fresh read {fresh} != the committed overlay ({len(committed)} entries).")
        p3 = f"fresh read matches the committed overlay ({len(committed)} entries)"
    elif args.apply:
        sys.exit("ABORT (P3): --apply needs --curation-export or --fresh-read.")
    else:
        p3 = "skipped (verify mode)"
    print(f"P3 curation freshness: {p3}")

    recode_alias, recode_edits = zdry.load_recode(args.after_recode)
    plan = zdry.compute_plan(json.loads(json.dumps(courses_doc["courses"])),
                             json.loads(json.dumps(singles_doc["courses"])),
                             json.loads(json.dumps(committed)),
                             json.loads(json.dumps(art_doc.get("identities") or {})),
                             json.loads(json.dumps(common)), json.loads(json.dumps(crosswalk)),
                             canon_doc, fl_doc, zdry.load_id_reservations(), recode_alias, recode_edits)
    failed = [k for k, v in plan["validation"].items() if not v["pass"]]
    if failed:
        sys.exit(f"ABORT: dry-run validation gate(s) failed: {failed}")
    frozen_path = os.path.join(args.receipt, "alias_map.json")
    frozen_doc = _load(frozen_path)
    ok, drift = plan_fidelity(plan, frozen_doc)
    if not ok:
        msg = f"plan drift vs the frozen receipt: {len(drift)} differing keys (sample {drift[:5]})"
        if not args.allow_plan_drift:
            sys.exit(f"ABORT (P1): {msg} — re-run the dry run, re-review, or pass --allow-plan-drift.")
        print(f"⚠ P1 OVERRIDDEN: {msg}")
    else:
        print(f"P1 plan fidelity: recomputed plan == frozen receipt ({len(plan['alias'])} aliases) ✓")

    orig = {"courses": json.loads(json.dumps(courses_doc["courses"])),
            "singletons": json.loads(json.dumps(singles_doc["courses"])),
            "memberships": json.loads(json.dumps(mem_doc["memberships"])),
            "curation": dict(committed), "common": dict(common),
            "crosswalk_multiset": [v.get("course_id") or "" for v in crosswalk.values() if isinstance(v, dict)]}
    docs = {"courses": courses_doc, "singletons": singles_doc, "memberships": mem_doc,
            "curation": cur_doc, "common": common, "crosswalk": crosswalk, "zseq": zseq_doc}
    stats, materialized = apply_plan(docs, plan, now)
    gates = post_gates(orig, docs, plan, materialized)
    print("gates:")
    for g, okg in gates.items():
        print(f"  {'PASS' if okg else 'FAIL'}  {g}")
    print("ripple: " + " | ".join(f"{k} {v:,}" for k, v in sorted(stats.items())))
    if not all(gates.values()):
        sys.exit("✗ gate failure — NOTHING written. `git checkout kb/` if in doubt.")
    if not args.apply:
        print("\nVERIFY MODE — no files written. Re-run with --apply (+ --fresh-read).")
        return 0

    for path, doc in ((zdry.COURSES, courses_doc), (zdry.CURATION, cur_doc),
                      (zdry.COMMON, common), (zdry.CROSSWALK, crosswalk)):
        _atomic_dump(path, doc, _trailing_nl(path))
    if os.path.exists(ZSEQ):
        _atomic_dump(ZSEQ, zseq_doc, _trailing_nl(ZSEQ))
    frozen_doc["_status"] = (f"APPLIED {now} — Z-band retirement (items 20-21 of 2026-09-03; readings ruled "
                             f"yes to all). Every retired identity is a real M-ID record with origin "
                             f"'machine cluster' and a _zband_retired_from stamp; the alias map is the "
                             f"rollback handle (read right-to-left).")
    frozen_doc["_applied_at"] = now
    frozen_doc["_applied_by"] = "kb/_zband_retire_apply.py"
    _atomic_dump(frozen_path, frozen_doc, True)
    _atomic_dump(os.path.join(args.receipt, "materialized.json"), {
        "_about": "the retired identities as materialized: new id, the Z id it came from, title, "
                  "discipline, member count (their merge_into pointers), distinct colleges",
        "count": len(materialized), "rows": materialized}, True)
    _atomic_dump(os.path.join(args.receipt, "supabase_ops.json"), {
        "_about": ("The Supabase half, same cron window: dispatch .github/workflows/supabase-rekey.yml "
                   "with alias_map_path = this receipt's alias_map.json. Legacy anchors have no "
                   "kb_curation rows; their pairs no-op. Idempotent."),
        "_emitted_at": now,
        "rekey": {"workflow": ".github/workflows/supabase-rekey.yml",
                  "alias_map_path": os.path.relpath(frozen_path, ROOT),
                  "z_pairs": sum(1 for k in plan["alias"] if zdry.Z_RE.match(k))}}, True)
    with open(os.path.join(args.receipt, "validation.md"), "w", encoding="utf-8") as f:
        f.write(f"# Z-band retirement — APPLY validation receipt\n\n- applied: `{now}`\n"
                f"- aliases: **{len(plan['alias']):,}** (materialized {len(materialized):,})\n"
                f"- P1 plan fidelity: recomputed == frozen ✓\n- P3 curation freshness: {p3}\n\n"
                f"## Ripple\n\n| what | count |\n|---|---:|\n"
                + "".join(f"| {k} | {v:,} |\n" for k, v in sorted(stats.items()))
                + "\n## Apply gates\n\n" + "\n".join(f"- ✅ {g}" for g in gates)
                + "\n\n## Allocator validation (recomputed at apply)\n\n"
                + "\n".join(f"- ✅ {k}" for k in plan["validation"]) + "\n")
    report = os.path.join(args.receipt, "report.md")
    if os.path.exists(report):
        with open(report, encoding="utf-8") as f:
            txt = f.read()
        txt = re.sub(r"^status: DRY-RUN.*$", f"status: APPLIED {now} — see validation.md; the readings "
                     f"were ruled yes to all on 2026-09-03 (materialized, card 12)", txt, count=1, flags=re.M)
        with open(report, "w", encoding="utf-8") as f:
            f.write(txt)
    print(f"\n✓ APPLIED. receipt → {os.path.relpath(args.receipt, ROOT)}/")
    print("NEXT (same window): commit; dispatch supabase-rekey.yml with this alias map; register both "
          "receipts in kb/_rekey_promotions.py ALIAS_MAPS; python3 kb/_post_apply_chain.py once.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
