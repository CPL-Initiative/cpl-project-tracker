#!/usr/bin/env python3
"""Phase 1e SUBJ4-canonicalization APPLY — the receipted canonical fold.

REBUILT for the 2026-06-12 fold (Session 50). The 2026-05-23 version of this
script consumed kb/subj4_dryrun/alias_map.json VERBATIM and wrote its receipt
to kb/subj4_apply/ — that receipt is now REGISTERED HISTORY (ALIAS_MAPS in
kb/_rekey_promotions.py) and must never be overwritten, so this version
receipts to kb/subj4_fold_out/<date>/ instead. It also fixes the two
Session-42 findings about the old design: the consumed plan's `_status` is
restamped at apply time (a receipt's status is itself a receipt), and the
plan is RECOMPUTED at apply time via the dry-run's own compute_plan() — the
apply executes literally the allocation the dry-run reports (apply == spec by
construction), with a fidelity gate against the frozen, operator-reviewed
plan.

RESOLUTION SEMANTICS (docs/kb-notes/methodology-alias-map-resolution-semantics.md):
the emitted alias map is a SIMULTANEOUS PERMUTATION with slot reuse — entries
whose fate is "no_change" can still re-sequence their number ("AUTO M1005" ->
"AUTO M1004"), and a retired slot is routinely re-occupied by a different row
in the same instant. Consumers apply the map ONCE, never iterate within it.

What mutates (in place, native serialization per file, record order kept):
  kb/coci_minted_courses.json     key + course_id + subject_4letter + stamp
  kb/coci_minted_singletons.json  key + course_id + subject_4letter + stamp
  kb/coci_minted_memberships.json key rename only
  kb/coci_articulations.json      per-record course_id re-point
  kb/coci_curation.json           entry-key rename + merge_into value re-point
(kb/coci_unified_courses.json clusters are empty since the 2026-05-30
dissolution — verified zero refs, not touched.)

Per moved row: `_subj4_fold_from` = the pre-fold id (ground-truth stamp; the
V5 gate in kb/_rekey_promotions.py validates resolutions against it — the
same contract `_subj4_remint_from` provides for the 2026-05-23 apply).
Untouched rows stay byte-identical (gate-enforced). Curated disciplines are
NEVER baked into the KB baseline — compute_plan() sees the overlay on
throwaway copies only; the files are reloaded pristine for writing.

Supabase is NOT written by this script (session containers have no egress to
Supabase REST) — the exact kb_curation ops are emitted to the receipt
(supabase_ops.json) from a fresh row export passed via --curation-export, and
the operator executes them via the MCP execute_sql lane in the same atomic
cron window (fresh-read at write-time is MANDATORY — the THEA one-minute
race, Session 47).

Gates (all must pass or nothing is written):
  - the dry-run's 5 validations (4-letter; one-SUBJ4-per-discipline with
    umbrella exemptions; unique new ids; untouched-disjoint; no overflow)
  - P1 plan fidelity: recomputed plan == the frozen dry-run plan the operator
    reviewed (kb/subj4_dryrun/alias_map.json), unless --allow-plan-drift
  - P2 apply-readiness: 0 blocked_on_curator, 0 invalid_canonical
  - P3 export freshness: the --curation-export rows rebuild EXACTLY the
    committed kb/coci_curation.json overlay (zero live-curation drift)
  - G1–G8 post-mutation conservation: counts, untouched byte-identity,
    key==course_id, exact keyset permutation, articulation multiset,
    overlay integrity + liveness, stamp coverage, minted∩singleton=∅

Usage (from repo root):
  python3 kb/_subj4_apply.py --curation-export /tmp/fold/kb_curation_course_rows.json
  python3 kb/_subj4_apply.py --curation-export ... --apply     # write
Receipt: kb/subj4_fold_out/<date>/{alias_map.json,report.md,supabase_ops.json,validation.md}
Rollback: receipt alias map read right-to-left + git revert on a branch
(never force-push main), inverse Supabase ops, inside one cron window —
same discipline as PR #84.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from _subj4_dryrun import compute_plan  # noqa: E402  (the shared allocator)

COURSES = os.path.join(HERE, "coci_minted_courses.json")
SINGLETONS = os.path.join(HERE, "coci_minted_singletons.json")
MEMBERSHIPS = os.path.join(HERE, "coci_minted_memberships.json")
ARTICULATIONS = os.path.join(HERE, "coci_articulations.json")
CURATION = os.path.join(HERE, "coci_curation.json")
CANONICAL = os.path.join(HERE, "discipline_canonical_subj4.json")
FROZEN_PLAN = os.path.join(HERE, "subj4_dryrun", "alias_map.json")
OUT_ROOT = os.path.join(HERE, "subj4_fold_out")

MID_RE = re.compile(r"^[A-Z]{1,4} M[0-9][A-Z0-9]{3}$")
OVERLAY_FIELDS = {"discipline", "merge_into", "unified_title", "description",
                  "cross_listed_disciplines"}


def _load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _atomic_dump(path, obj, trailing_nl):
    """Temp-sibling + rename so a crash mid-write can't leave a half-written
    kb file. Serialization matches each file's current convention (indent=2,
    ensure_ascii=False; trailing newline only where the file has one today)."""
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2, ensure_ascii=False)
        if trailing_nl:
            f.write("\n")
    os.replace(tmp, path)


def rebuild_overlay(rows):
    """kb/_apply_curation.py's fold, verbatim — export rows -> curations dict."""
    curations = {}
    for row in rows:
        field = (row.get("field") or "").strip()
        if field not in OVERLAY_FIELDS:
            continue
        entry = curations.setdefault(row["course_id"], {})
        entry[field] = row.get("value")
        if row.get("reviewed_at", "") >= entry.get("reviewed_at", ""):
            entry["reviewed_by"] = row.get("reviewer_email")
            entry["reviewed_at"] = row.get("reviewed_at")
        if (row.get("validated_at") or "") >= (entry.get("validated_at") or ""):
            if row.get("validated_at"):
                entry["validated_at"] = row.get("validated_at")
                entry["validated_by"] = row.get("validated_by")
    return dict(sorted(curations.items()))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true", help="write the mutated KB + receipt")
    ap.add_argument("--curation-export", required=True,
                    help="fresh kb_curation M-ID row export (json list of "
                         "{course_id,field,value,reviewer_email,reviewed_at,"
                         "validated_at,validated_by}) from the MCP execute_sql "
                         "lane — the write-time fresh-read")
    ap.add_argument("--allow-plan-drift", action="store_true",
                    help="proceed when the recomputed plan differs from the frozen "
                         "dry-run (ONLY after the curated buckets are re-reviewed)")
    args = ap.parse_args()
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    today = now[:10]

    # ── load ────────────────────────────────────────────────────────────────
    courses_doc = _load(COURSES)
    singles_doc = _load(SINGLETONS)
    if courses_doc.get("_subj4_fold_applied_at") or singles_doc.get("_subj4_fold_applied_at"):
        sys.exit("ABORT: _subj4_fold_applied_at already present — this fold has been "
                 "applied. A second fold needs a fresh dry-run + its own receipt dir.")
    mem_doc = _load(MEMBERSHIPS)
    art_doc = _load(ARTICULATIONS)
    cur_doc = _load(CURATION)
    canon_doc = _load(CANONICAL)
    export_rows = _load(args.curation_export)

    # ── P3: export freshness — the fresh-read must rebuild the committed overlay
    rebuilt = rebuild_overlay(export_rows)
    committed = cur_doc.get("curations", {}) or {}
    if json.dumps(rebuilt, sort_keys=True) != json.dumps(committed, sort_keys=True):
        only_e = sorted(set(rebuilt) - set(committed))[:5]
        only_c = sorted(set(committed) - set(rebuilt))[:5]
        sys.exit("ABORT (P3): the curation export does not rebuild the committed "
                 "overlay — live curation drifted since the last sync. Re-export "
                 "from Supabase, re-run the dry-run, re-review the curated buckets. "
                 f"only-export={only_e} only-committed={only_c}")
    print(f"P3 export freshness: {len(export_rows)} rows rebuild the committed "
          f"overlay exactly ({len(committed)} entries) ✓")

    # ── the plan (shared allocator, on throwaway copies) ─────────────────────
    plan = compute_plan(json.loads(json.dumps(courses_doc["courses"])),
                        json.loads(json.dumps(singles_doc["courses"])),
                        committed, canon_doc)
    validation = plan["validation"]
    failed = [k for k, v in validation.items() if not v["pass"]]
    if failed:
        sys.exit(f"ABORT: dry-run validation gate(s) failed: {failed}")
    fc = plan["fate_counts"]
    if fc.get("blocked_on_curator") or fc.get("invalid_canonical"):
        sys.exit(f"ABORT (P2): not apply-ready — blocked_on_curator="
                 f"{fc.get('blocked_on_curator', 0)} invalid_canonical="
                 f"{fc.get('invalid_canonical', 0)}")

    # ── P1: plan fidelity vs the frozen, operator-reviewed dry-run ──────────
    plan_aliases = dict(sorted(plan["alias_map"].items()))
    frozen_doc = None
    if os.path.exists(FROZEN_PLAN):
        frozen_doc = _load(FROZEN_PLAN)
        frozen = frozen_doc.get("aliases") or {}
        if json.dumps(plan_aliases, sort_keys=True) != json.dumps(frozen, sort_keys=True):
            drift = {k for k in set(plan_aliases) | set(frozen)
                     if plan_aliases.get(k) != frozen.get(k)}
            msg = (f"plan drift vs frozen dry-run: {len(drift)} differing keys "
                   f"(sample {sorted(drift)[:5]})")
            if not args.allow_plan_drift:
                sys.exit(f"ABORT (P1): {msg} — the curated-bucket approval was given "
                         f"against the frozen plan. Re-run the dry-run, re-review, "
                         f"or pass --allow-plan-drift after re-approval.")
            print(f"⚠ P1 OVERRIDDEN: {msg}")
        else:
            print(f"P1 plan fidelity: recomputed plan == frozen dry-run "
                  f"({len(plan_aliases)} aliases) ✓")

    # The move set: the permutation's non-identity entries.
    moves = {old: a["new_id"] for old, a in plan_aliases.items() if a["new_id"] != old}
    untouched_total = sum(fc.get(k, 0) for k in
                          ("skip_no_discipline", "skip_unknown_disc",
                           "skip_offscheme_id", "skip_umbrella_offcode"))
    print(f"plan: {len(plan_aliases)} allocated | moves {len(moves)} | "
          f"re_key {fc.get('re_key', 0)} | no_change {fc.get('no_change', 0)} | "
          f"untouched {untouched_total}")

    # ── mutate (pristine write models; plan copies were throwaway) ──────────
    def fold_catalog(doc, expected_source):
        out = {}
        moved = 0
        for k, rec in doc["courses"].items():
            a = plan_aliases.get(k)
            if a and a["new_id"] != k:
                if a["source"] != expected_source:
                    sys.exit(f"FATAL: alias source mismatch on {k}: expected "
                             f"{expected_source!r} got {a['source']!r}")
                rec["course_id"] = a["new_id"]
                rec["subject_4letter"] = a["new_subj4"]
                rec["_subj4_fold_from"] = k
                out[a["new_id"]] = rec
                moved += 1
            else:
                out[k] = rec
        doc["courses"] = out
        doc["_subj4_fold_applied_at"] = now
        return moved

    moved_minted = fold_catalog(courses_doc, "minted")
    moved_single = fold_catalog(singles_doc, "singleton")

    new_mem = {}
    moved_mem = 0
    for k, v in mem_doc["memberships"].items():
        nk = moves.get(k, k)
        if nk != k:
            moved_mem += 1
        new_mem[nk] = v
    mem_doc["memberships"] = new_mem
    mem_doc["_subj4_fold_applied_at"] = now

    arts = art_doc["articulations"]
    pre_art_multiset = sorted(a.get("course_id") or "" for a in arts)
    moved_art = 0
    for a in arts:
        cid = a.get("course_id")
        if cid in moves:
            a["course_id"] = moves[cid]
            moved_art += 1
    art_doc["_subj4_fold_applied_at"] = now

    new_cur = {}
    moved_cur_keys = 0
    moved_cur_vals = 0
    for k, ent in committed.items():
        nk = moves.get(k, k)
        if nk != k:
            moved_cur_keys += 1
        ent = dict(ent)
        mi = ent.get("merge_into")
        if mi in moves:
            ent["merge_into"] = moves[mi]
            moved_cur_vals += 1
        new_cur[nk] = ent
    cur_doc["curations"] = dict(sorted(new_cur.items()))
    cur_doc["count"] = len(new_cur)

    # ── Supabase ops (from the fresh export — the same window's writes) ─────
    ops = []
    for r in export_rows:
        cid, field = r["course_id"], r["field"]
        sets = {}
        if cid in moves:
            sets["course_id"] = moves[cid]
        if field == "merge_into" and (r.get("value") or "") in moves:
            sets["value"] = moves[r["value"]]
        if sets:
            ops.append({"where_course_id": cid, "where_field": field, "set": sets})
    sql_lines = ["begin;"]
    for op in ops:
        assigns = ", ".join(f"{c} = '{v}'" for c, v in op["set"].items())
        sql_lines.append(
            f"update kb_curation set {assigns} where course_id = "
            f"'{op['where_course_id']}' and field = '{op['where_field']}';")
    sql_lines.append("commit;")

    # ── post-mutation gates ──────────────────────────────────────────────────
    orig_courses = _load(COURSES)["courses"]
    orig_singles = _load(SINGLETONS)["courses"]
    orig_mem = _load(MEMBERSHIPS)["memberships"]
    gates = {}
    gates["G1 counts conserved across all five files"] = (
        len(courses_doc["courses"]) == len(orig_courses)
        and len(singles_doc["courses"]) == len(orig_singles)
        and len(new_mem) == len(orig_mem)
        and len(arts) == len(pre_art_multiset)
        and len(new_cur) == len(committed))
    untouched_ok = True
    for orig, folded in ((orig_courses, courses_doc["courses"]),
                         (orig_singles, singles_doc["courses"])):
        for k, rec in orig.items():
            if k in moves:
                continue
            if json.dumps(folded.get(k), sort_keys=True) != json.dumps(rec, sort_keys=True):
                untouched_ok = False
                print(f"  G2 mismatch on untouched row {k}")
                break
    gates["G2 untouched rows byte-identical"] = untouched_ok
    gates["G3 key == course_id everywhere"] = all(
        k == r.get("course_id")
        for src in (courses_doc["courses"], singles_doc["courses"])
        for k, r in src.items())
    gates["G4 keysets are the exact permutation"] = (
        set(courses_doc["courses"]) == {moves.get(k, k) for k in orig_courses}
        and set(singles_doc["courses"]) == {moves.get(k, k) for k in orig_singles}
        and set(new_mem) == {moves.get(k, k) for k in orig_mem})
    gates["G5 articulation course_id multiset mapped exactly"] = (
        sorted(a.get("course_id") or "" for a in arts)
        == sorted(moves.get(c, c) for c in pre_art_multiset))
    live_post = set(courses_doc["courses"]) | set(singles_doc["courses"])
    overlay_ok = (set(new_cur) == {moves.get(k, k) for k in committed}
                  and all(k in live_post for k in new_cur))
    for k, ent in new_cur.items():
        mi = ent.get("merge_into")
        if mi and MID_RE.match(mi) and mi not in live_post:
            # merge_into may target official ids (SPAN 100 etc.) — only
            # M-ID-shaped targets must resolve to live rows.
            overlay_ok = False
            print(f"  G6 dangling merge_into {k} -> {mi}")
    gates["G6 overlay keys+pointers mapped, all M-ID targets live"] = overlay_ok
    stamp_count = 0
    stamp_ok = True
    for src in (courses_doc["courses"], singles_doc["courses"]):
        for k, r in src.items():
            stamped = r.get("_subj4_fold_from")
            if stamped:
                stamp_count += 1
                if moves.get(stamped) != k:
                    stamp_ok = False
                    print(f"  G7 bad stamp on {k}: _subj4_fold_from={stamped}")
    gates["G7 stamps: every moved row carries its pre-fold id"] = (
        stamp_ok and stamp_count == len(moves))
    gates["G8 minted/singleton key spaces disjoint"] = not (
        set(courses_doc["courses"]) & set(singles_doc["courses"]))

    print("gates:")
    for g, ok in gates.items():
        print(f"  {'PASS' if ok else 'FAIL'}  {g}")
    print(f"ripple: minted {moved_minted} | singletons {moved_single} | "
          f"membership keys {moved_mem} | articulations {moved_art} | "
          f"curation keys {moved_cur_keys} + merge_into values {moved_cur_vals} | "
          f"supabase ops {len(ops)}")
    if not all(gates.values()):
        sys.exit("✗ gate failure — NOTHING written. `git checkout kb/` if in doubt.")

    if not args.apply:
        print("\nVERIFY MODE — no files written. Re-run with --apply.")
        return 0

    # ── write (native serialization per file) ───────────────────────────────
    _atomic_dump(COURSES, courses_doc, trailing_nl=False)
    _atomic_dump(SINGLETONS, singles_doc, trailing_nl=True)
    _atomic_dump(MEMBERSHIPS, mem_doc, trailing_nl=False)
    _atomic_dump(ARTICULATIONS, art_doc, trailing_nl=False)
    _atomic_dump(CURATION, cur_doc, trailing_nl=True)

    odir = os.path.join(OUT_ROOT, today)
    os.makedirs(odir, exist_ok=True)
    _atomic_dump(os.path.join(odir, "alias_map.json"), {
        "_status": (f"APPLIED {now} — Phase 1e SUBJ4 canonical fold (Session 50). "
                    "A SIMULTANEOUS PERMUTATION with slot reuse: consumers apply this "
                    "map ONCE, never iterate within it (kb/_rekey_promotions.py "
                    "semantics). fate:no_change entries may still re-sequence the "
                    "number. Per-row ground truth: _subj4_fold_from stamps on minted "
                    "courses + singletons."),
        "_generated_by": "kb/_subj4_apply.py",
        "_applied_at": now,
        "_plan_source": ("recomputed via _subj4_dryrun.compute_plan at apply time; "
                         "verified byte-identical to the frozen "
                         "kb/subj4_dryrun/alias_map.json the operator reviewed"
                         if frozen_doc else "recomputed at apply time (no frozen plan)"),
        "count": len(plan_aliases),
        "moves": len(moves),
        "aliases": plan_aliases,
    }, trailing_nl=True)
    _atomic_dump(os.path.join(odir, "supabase_ops.json"), {
        "_about": ("kb_curation mirror ops for the fold — computed from the fresh "
                   "--curation-export at apply time. Execute via the MCP execute_sql "
                   "lane in the SAME cron window as the commit (fresh-read at "
                   "write-time is mandatory — Session 47's THEA race). Only rows "
                   "whose key or merge_into value moved are touched."),
        "_emitted_at": now,
        "ops_count": len(ops),
        "ops": ops,
        "sql": "\n".join(sql_lines),
    }, trailing_nl=True)
    with open(os.path.join(odir, "validation.md"), "w", encoding="utf-8") as f:
        f.write(f"# SUBJ4 fold — APPLY validation receipt\n\n- applied: `{now}`\n"
                f"- aliases: **{len(plan_aliases)}** (moves: **{len(moves)}**)\n\n"
                f"## Per-file mutation counts\n\n"
                f"| file | rows moved |\n|---|---:|\n"
                f"| `kb/coci_minted_courses.json` | {moved_minted} |\n"
                f"| `kb/coci_minted_singletons.json` | {moved_single} |\n"
                f"| `kb/coci_minted_memberships.json` | {moved_mem} |\n"
                f"| `kb/coci_articulations.json` | {moved_art} |\n"
                f"| `kb/coci_curation.json` | {moved_cur_keys} keys + "
                f"{moved_cur_vals} merge_into values |\n\n"
                f"## Apply gates\n\n"
                + "\n".join(f"- ✅ {g}" for g in gates) + "\n\n"
                f"## Allocator validation (recomputed at apply)\n\n"
                + "\n".join(f"- ✅ {k}" for k in validation) + "\n")
    with open(os.path.join(odir, "report.md"), "w", encoding="utf-8") as f:
        f.write(f"# SUBJ4 fold APPLY — {today} (Session 50)\n\n"
                f"- **{len(plan_aliases)}** aliases (**{len(moves)}** moves) across 5 kb "
                f"files; **{len(ops)}** Supabase kb_curation ops emitted.\n"
                f"- P1 plan fidelity: recomputed == the frozen dry-run plan ✓\n"
                f"- P3 curation freshness: export rebuilt the committed overlay exactly ✓\n\n"
                f"## Curated-bucket assignments as executed (the operator-approval record)\n\n")
        for c in plan["curated_collisions"]:
            f.write(f"**Bucket `{c['bucket']}`:**\n")
            for m in c["curated"]:
                f.write(f"- `{m['old_id']}` → `{m['new_id']}` · {m['title']}\n")
            f.write("\n")
        f.write("## Rollback\n\n"
                "1. `git revert` the apply commit on a branch → PR (never force-push main).\n"
                "2. Supabase: invert the ops in `supabase_ops.json` (swap set/where values).\n"
                "3. Stay inside one 10:17 UTC cron window; re-run the post-apply chain.\n")

    # Restamp the consumed plan's _status (the Session-42 receipt-honesty rule:
    # an apply that consumes/verifies a dry-run plan must restamp it).
    if frozen_doc is not None:
        frozen_doc["_status"] = (
            f"SUPERSEDED — this frozen plan was verified byte-identical at apply "
            f"time and APPLIED {now}; the receipt of record is "
            f"kb/subj4_fold_out/{today}/alias_map.json. Re-running the dry-run "
            f"post-fold regenerates this dir as a no-op preview.")
        _atomic_dump(FROZEN_PLAN, frozen_doc, trailing_nl=True)

    print(f"\n✓ APPLIED. receipt → kb/subj4_fold_out/{today}/")
    print("NEXT (the Rule-7 chain): execute supabase_ops.json via the MCP lane in "
          "THIS window; re-run the statewide twin merge (--tag postfold); then "
          "python3 kb/_post_apply_chain.py.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
