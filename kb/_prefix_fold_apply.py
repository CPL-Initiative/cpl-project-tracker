#!/usr/bin/env python3
"""Prefix fold — APPLY (the worklist the 2026-09-03 land surfaced; Rule 7). The
receipted half of kb/_prefix_fold_dryrun.py.

The plan is RECOMPUTED here through the dry run's own compute_plan() (apply ==
spec by construction) and gated against the frozen, Sam-reviewed receipt
kb/prefix_fold_out/<date>/alias_map.json (P1). The sheet's verdicts arrive as
the receipt's two flags — `--scope all|materialized|legacy` (item 2's "hold"
cuts the legacy strays out) and `--ruled-held "<who, when: what>"` (item 3's
"fold them" moves the TOP-only rows on the ruling) — and the apply refuses a
receipt cut under different flags. Nothing is written unless every gate
passes; --apply writes, and needs --ruling naming the human's yes.

What mutates (native serialization per file, record order kept):
  kb/coci_minted_courses.json      key + course_id + subject_4letter + stamp;
                                   `_machine_cluster_members` lists re-keyed
                                   where a listed member moved (a materialized
                                   record names its members by id)
  kb/coci_minted_singletons.json   key + course_id + subject_4letter + stamp
  kb/coci_minted_memberships.json  key rename
  kb/coci_articulations.json       articulations[].course_id + identities keys
                                   (a moved entry wins its new key; a stale
                                   entry already sitting on a landing key — the
                                   S110 ghosts, which the catalog already
                                   overrides — is dropped, since the key now
                                   names a different row)
  kb/coci_curation.json            entry keys + merge_into pointers

NOT touched: kb/uc_cur_zseq.json (retired 2026-09-03; a fold is per row and
mints nothing); the seed and the language file (a fold changes no canonical
code — that is what makes it a fold, so there are no _CANON_SUBJ4:: picks);
kb/promotions.json (the post-apply chain's kb/_rekey_promotions.py re-keys it
once this receipt is registered in ALIAS_MAPS — register it in the SAME commit
as the mutation, never before, or the chain folds an unapplied map).

Per moved catalog row: `_prefix_fold_from` = the pre-fold id. Earlier stamps
(`_authority_recode_from`, `_zband_retired_from`, `_subj4_fold_from` ...) are
kept — every receipt has its own stamp, so provenance chains instead of
overwriting.

Supabase is NOT written here (no egress from a session). The kb_curation
re-key runs from the committed receipt through
.github/workflows/supabase-rekey.yml in the same cron window (a chained key is
applied vacate-first since #1455).

Gates (all must pass or nothing is written):
  V1-V9  the dry run's validations, recomputed; V8 parity with fold-verify
         unless --no-parity
  P0     THIS receipt not already applied — its own _applied_at stamp, and the
         docs' `_prefix_fold_applied` era list (a later fold runs from its own
         receipt; the held rows are its worklist)
  P1     plan fidelity: scope and ruled-held match the frozen receipt, and the
         recomputed alias map == the frozen receipt
  P3     curation freshness at write-time: --curation-export rows rebuild the
         committed overlay exactly, OR --fresh-read <json> (the MCP count
         query over kb/_apply_curation.py's seven fields:
           select count(distinct course_id) as distinct_course_ids,
                  max(reviewed_at)::text as newest_reviewed_at
           from public.kb_curation where field in (<the seven>);
         ) matches the committed overlay's entry count and newest reviewed_at
  G1-G13 post-mutation conservation: counts, untouched byte-identity, key ==
         course_id, exact keyset permutation, articulation multiset, overlay
         integrity, stamps, minted/singleton disjoint, subject_4letter ==
         prefix, discipline unchanged, member lists re-keyed, identities
         ghosts handled, no old id left on any keyed surface

After the land, fold-verify's `re_key` equals the rows this receipt HELD plus
the rows outside its scope — they stay counted until a second signal or a
ruling arrives. The apply prints that number so the post-apply chain's
fold-verify line is checkable.

Usage (from repo root):
  python3 kb/_prefix_fold_apply.py                                        # verify
  python3 kb/_prefix_fold_apply.py --fresh-read fresh.json --ruling "Sam, <date>: 1-7 yes" --apply
  python3 kb/_prefix_fold_apply.py --scope materialized --receipt kb/prefix_fold_out/<date> ...
Receipt: kb/prefix_fold_out/<date>/{alias_map.json (restamped APPLIED),
supabase_ops.json, validation.md}
Rollback: the alias map read right-to-left + git revert on a branch, the
inverse Supabase re-key, inside one cron window (docs/coursecontrolnumber_remint.md).
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
import _authority_recode_dryrun as rec  # noqa: E402  (paths, parse_id, the allocator)
import _prefix_fold_dryrun as pf  # noqa: E402  (the planner: apply == spec)
from _authority_recode_apply import (MZ_RE, _atomic_dump, _trailing_nl,  # noqa: E402
                                     fresh_read_matches, plan_fidelity, rebuild_overlay)

RECEIPT_DIR = (os.environ.get("PREFIX_FOLD_RECEIPT")
               or os.path.join(HERE, "prefix_fold_out", "2026-09-03"))
STAMP = pf.STAMP                       # _prefix_fold_from
APPLIED = "_prefix_fold_applied"       # era list on every mutated doc: [{receipt, at}, ...]
MEMBERS_KEY = "_machine_cluster_members"
SCOPES = ("all", "materialized", "legacy")


def _load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def receipt_rel(receipt_dir):
    """The receipt's repo-relative path — the key of its era-list entry."""
    return os.path.relpath(os.path.abspath(receipt_dir), ROOT).replace(os.sep, "/")


# ── the pre-write gates ──────────────────────────────────────────────────────
def already_applied(frozen_doc, docs, rel):
    """P0 — THIS receipt: stamped APPLIED in the alias map, or named in any
    mutated doc's era list. Returns the reason, or None when clean."""
    if frozen_doc.get("_applied_at"):
        return f"the receipt {rel} is stamped APPLIED {frozen_doc['_applied_at']}"
    for name, doc in docs.items():
        for e in (doc.get(APPLIED) or []):
            if isinstance(e, dict) and e.get("receipt") == rel:
                return f"{name} carries {rel} in its {APPLIED} era list"
    return None


def receipt_matches(frozen_doc, scope, ruled_held):
    """P1a — the frozen receipt was cut under the same scope and ruling as this
    run; a mismatch means Sam's yes was given to a different plan."""
    problems = []
    if (frozen_doc.get("scope") or "all") != scope:
        problems.append(f"receipt scope {frozen_doc.get('scope') or 'all'!r} != --scope {scope!r}")
    if (frozen_doc.get("ruled_held") or None) != (ruled_held or None):
        problems.append(f"receipt ruled_held {frozen_doc.get('ruled_held')!r} != --ruled-held {ruled_held!r}")
    return problems


def expected_residual(plan):
    """What fold-verify must read after this receipt lands: the held rows plus
    the rows outside the scope — still off their code, by design."""
    return len(plan["held"]) + len(plan["out_of_scope"])


# ── the mutation ─────────────────────────────────────────────────────────────
def apply_plan(docs, plan, now, rel):
    """Mutate the loaded docs in place from the plan. Pure with respect to
    files; returns a Counter of what moved."""
    alias = {k: v for k, v in plan["alias"].items() if v and v != k}
    courses_doc, singles_doc = docs["courses"], docs["singletons"]
    mem_doc, art_doc, cur_doc = docs["memberships"], docs["articulations"], docs["curation"]
    stats = Counter()
    era = {"receipt": rel, "at": now}

    def fold(doc, label):
        out = {}
        for k, r in doc["courses"].items():
            nk = alias.get(k)
            if nk:
                r["course_id"] = nk
                r["subject_4letter"] = nk.split(" ")[0]
                r[STAMP] = k
                out[nk] = r
                stats[label] += 1
            else:
                out[k] = r
            members = r.get(MEMBERS_KEY)
            if isinstance(members, list) and any(m in alias for m in members):
                stats["member_lists"] += 1
                stats["member_ids"] += sum(1 for m in members if m in alias)
                r[MEMBERS_KEY] = [alias.get(m, m) for m in members]
        doc["courses"] = out
        doc.setdefault(APPLIED, []).append(dict(era))

    fold(courses_doc, "minted")
    fold(singles_doc, "singletons")

    new_mem = {}
    for k, v in mem_doc["memberships"].items():
        nk = alias.get(k, k)
        if nk != k:
            stats["memberships"] += 1
        new_mem[nk] = v
    mem_doc["memberships"] = new_mem
    mem_doc.setdefault(APPLIED, []).append(dict(era))

    for a in art_doc.get("articulations", []):
        c = a.get("course_id")
        if c in alias:
            a["course_id"] = alias[c]
            stats["articulations"] += 1
    ident = art_doc.get("identities")
    if isinstance(ident, dict):
        moved = {alias[k]: v for k, v in ident.items() if k in alias}
        kept = {k: v for k, v in ident.items() if k not in alias}
        landing = set(alias.values())
        ghost_keys = {k for k in kept if k in landing}      # stale entries on keys this fold fills
        healed = ghost_keys & set(moved)                     # the moved entry wins the key
        dropped = sorted(ghost_keys - set(moved))            # nothing arrives with an entry: drop the ghost
        for k in dropped:
            del kept[k]
        kept.update(moved)
        art_doc["identities"] = kept
        stats["identities"] = len(moved)
        stats["identities_ghosts_healed"] = len(healed)
        stats["identities_ghosts_dropped"] = len(dropped)
    art_doc.setdefault(APPLIED, []).append(dict(era))

    new_cur = {}
    for k, ent in (cur_doc.get("curations") or {}).items():
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
    cur_doc.setdefault(APPLIED, []).append(dict(era))
    return stats


# ── the post-mutation gates ──────────────────────────────────────────────────
def post_gates(orig, docs, plan, stats):
    """Conservation gates over the mutated docs vs the originals captured
    before apply_plan()."""
    moves = {k: v for k, v in plan["alias"].items() if v and v != k}
    # A CHAINED key (vacated by one row and filled by another in the same plan,
    # `ANTH M1099` on 2026-09-03) is legitimately live afterward, occupied by the
    # arriving row; G4-G6 prove those exactly. The leftover sweeps look for old
    # ids that no row should occupy any more.
    stale = set(moves) - set(moves.values())
    oc, os_, om = orig["courses"], orig["singletons"], orig["memberships"]
    nc = docs["courses"]["courses"]
    ns = docs["singletons"]["courses"]
    nm = docs["memberships"]["memberships"]
    arts = docs["articulations"].get("articulations", [])
    ident = docs["articulations"].get("identities") or {}
    ncur = docs["curation"]["curations"]
    g = {}
    g["G1 counts conserved across the five files"] = (
        len(nc) == len(oc) and len(ns) == len(os_) and len(nm) == len(om)
        and len(arts) == len(orig["art_multiset"]) and len(ncur) == len(orig["curation"]))
    untouched = True
    for o, n in ((oc, nc), (os_, ns)):
        for k, r in o.items():
            if k in moves:
                continue
            members = r.get(MEMBERS_KEY)
            if isinstance(members, list) and any(m in moves for m in members):
                continue                                     # G11 owns this row
            if json.dumps(n.get(k), sort_keys=True) != json.dumps(r, sort_keys=True):
                untouched = False
                break
    g["G2 untouched rows byte-identical"] = untouched
    g["G3 key == course_id everywhere"] = all(
        k == r.get("course_id") for src in (nc, ns) for k, r in src.items())
    g["G4 keysets are the exact permutation"] = (
        set(nc) == {moves.get(k, k) for k in oc}
        and set(ns) == {moves.get(k, k) for k in os_}
        and set(nm) == {moves.get(k, k) for k in om})
    g["G5 articulation course_id multiset mapped exactly"] = (
        sorted(a.get("course_id") or "" for a in arts)
        == sorted(moves.get(c, c) for c in orig["art_multiset"]))
    live = set(nc) | set(ns)
    ok = set(ncur) == {moves.get(k, k) for k in orig["curation"]}
    for k, ent in ncur.items():
        mi = ent.get("merge_into") if isinstance(ent, dict) else None
        if mi and MZ_RE.match(mi) and mi not in live and mi not in ncur:
            ok = False
    g["G6 overlay keys + pointers mapped, every M target resolves"] = ok
    stamp_count, stamp_ok = 0, True
    for src in (nc, ns):
        for k, r in src.items():
            s = r.get(STAMP)
            if s:
                stamp_count += 1
                stamp_ok = stamp_ok and moves.get(s) == k
    n_catalog_moves = sum(1 for k in moves if k in oc or k in os_)
    prior_stamps = sum(1 for src in (oc, os_) for r in src.values() if r.get(STAMP))
    g["G7 stamps: every moved catalog row carries its old id"] = (
        stamp_ok and stamp_count == n_catalog_moves + prior_stamps)
    g["G8 minted/singleton key spaces disjoint"] = not (set(nc) & set(ns))
    g["G9 subject_4letter == prefix on every moved row"] = all(
        src[moves[k]].get("subject_4letter") == moves[k].split(" ")[0]
        for src, o in ((nc, oc), (ns, os_)) for k in moves if k in o)
    g["G10 discipline unchanged on every moved row"] = all(
        (nc.get(v) or ns.get(v) or {}).get("discipline") == (oc.get(k) or os_.get(k) or {}).get("discipline")
        for k, v in moves.items() if k in oc or k in os_)
    lists_ok = True
    for k, r in oc.items():
        members = r.get(MEMBERS_KEY)
        if not isinstance(members, list):
            continue
        after = (nc.get(moves.get(k, k)) or {}).get(MEMBERS_KEY)
        if after != [moves.get(m, m) for m in members]:
            lists_ok = False
            break
    g["G11 member lists re-keyed exactly, none left on an old id"] = (
        lists_ok and not any(m in stale for r in nc.values() for m in (r.get(MEMBERS_KEY) or [])))
    landed = set(plan.get("identities_ghosts", {}).get("healed_by_this_fold") or [])
    g["G12 identities: no old key remains; every landed ghost healed or dropped"] = (
        not (stale & set(ident))
        and stats.get("identities_ghosts_healed", 0) + stats.get("identities_ghosts_dropped", 0) == len(landed)
        and len(ident) == len(orig["identities"]) - stats.get("identities_ghosts_dropped", 0)
        - stats.get("identities_ghosts_healed", 0))          # a healed ghost collapses two entries into one
    g["G13 no old id left on any keyed surface"] = not (
        (stale & set(nc)) or (stale & set(ns)) or (stale & set(nm)) or (stale & set(ncur))
        or any(a.get("course_id") in stale for a in arts)
        or any(isinstance(e, dict) and e.get("merge_into") in stale for e in ncur.values()))
    return g


# ── the receipt ──────────────────────────────────────────────────────────────
def write_receipt(receipt_dir, frozen_doc, plan, stats, gates, p3, now, ruling):
    frozen_path = os.path.join(receipt_dir, "alias_map.json")
    scope = plan["scope"]
    ruled = plan.get("ruled_held")
    frozen_doc["_status"] = (
        f"APPLIED {now} — prefix fold (scope {scope}"
        + (f"; TOP-only rows folded on the ruling {ruled!r}" if ruled else "")
        + f"). Ruling: {ruling}. The alias map is the receipt of record and the rollback handle "
        f"(read right-to-left). Per-row ground truth: {STAMP} stamps on minted courses + singletons.")
    frozen_doc["_applied_at"] = now
    frozen_doc["_applied_by"] = "kb/_prefix_fold_apply.py"
    frozen_doc["_ruling"] = ruling
    frozen_doc["_plan_source"] = ("recomputed via _prefix_fold_dryrun.compute_plan at apply time; "
                                  "verified equal to this frozen receipt (P1)")
    _atomic_dump(frozen_path, frozen_doc, True)
    alias = {k: v for k, v in plan["alias"].items() if v and v != k}
    chained = sorted(set(alias) & set(alias.values()))
    _atomic_dump(os.path.join(receipt_dir, "supabase_ops.json"), {
        "_about": ("The Supabase half of the fold, same cron window: kb_curation self-keys + "
                   "merge_into pointers. Dispatch .github/workflows/supabase-rekey.yml with "
                   "alias_map_path = this receipt's alias_map.json (a clean bijection, idempotent; "
                   "chained keys are applied vacate-first and excluded from the verify, #1455). "
                   "A fold changes no canonical code, so there are no _CANON_SUBJ4:: picks."),
        "_emitted_at": now,
        "rekey": {"workflow": ".github/workflows/supabase-rekey.yml",
                  "alias_map_path": os.path.relpath(frozen_path, ROOT).replace(os.sep, "/"),
                  "pairs": len(alias), "chained_keys": chained},
        "picks": [],
    }, True)
    with open(os.path.join(receipt_dir, "validation.md"), "w", encoding="utf-8") as f:
        f.write(f"# Prefix fold — APPLY validation receipt\n\n- applied: `{now}`\n"
                f"- scope: `{scope}`" + (f" · ruled-held: `{ruled}`" if ruled else "") + "\n"
                f"- ruling: {ruling}\n"
                f"- aliases: **{len(alias):,}**\n- P1 plan fidelity: recomputed == frozen ✓\n"
                f"- P3 curation freshness: {p3}\n"
                f"- fold-verify must read `re_key` **{expected_residual(plan)}** after the land "
                f"({len(plan['held'])} held + {len(plan['out_of_scope'])} outside the scope)\n\n"
                "## Ripple\n\n| what | count |\n|---|---:|\n"
                + "".join(f"| {k} | {v:,} |\n" for k, v in sorted(stats.items()))
                + "\n## Apply gates\n\n" + "\n".join(f"- ✅ {g}" for g in gates)
                + "\n\n## Allocator validation (recomputed at apply)\n\n"
                + "\n".join(f"- ✅ {k}" for k in plan["validation"]) + "\n")
    report = os.path.join(receipt_dir, "report.md")
    if os.path.exists(report):
        with open(report, encoding="utf-8") as f:
            txt = f.read()
        txt = re.sub(r"^status: DRY-RUN.*$", f"status: APPLIED {now} — see validation.md; ruling: {ruling}",
                     txt, count=1, flags=re.M)
        with open(report, "w", encoding="utf-8") as f:
            f.write(txt)


# ── main ─────────────────────────────────────────────────────────────────────
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true", help="write the mutated KB + receipt")
    ap.add_argument("--scope", choices=SCOPES, default="all", help="the receipt's scope (item 2)")
    ap.add_argument("--ruled-held", default=None, metavar="TEXT",
                    help="the receipt's ruling on the TOP-only held rows (item 3), verbatim")
    ap.add_argument("--ruling", default=None, metavar="TEXT",
                    help="who said yes, when, to what — required with --apply (Rule 7)")
    ap.add_argument("--curation-export", help="fresh kb_curation row export (json list) — P3 exact")
    ap.add_argument("--fresh-read", help="json {distinct_course_ids, newest_reviewed_at} from the MCP "
                                         "count query over the overlay fields — P3 by count")
    ap.add_argument("--allow-plan-drift", action="store_true",
                    help="proceed when the recomputed plan differs from the frozen receipt "
                         "(ONLY after Sam re-reviews)")
    ap.add_argument("--no-parity", action="store_true", help="skip V8 (fold-verify, ~5 s)")
    ap.add_argument("--receipt", default=RECEIPT_DIR, help="the frozen dry-run receipt dir")
    args = ap.parse_args()
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    rel = receipt_rel(args.receipt)
    if args.apply and not args.ruling:
        sys.exit("ABORT: --apply needs --ruling '<who, when: what>' — the receipt names the human's yes (Rule 7).")

    courses_doc, singles_doc = _load(rec.COURSES), _load(rec.SINGLETONS)
    mem_doc, art_doc, cur_doc = _load(rec.MEMBERSHIPS), _load(rec.ARTICULATIONS), _load(rec.CURATION)
    canon_doc = _load(rec.CANONICAL)
    committed = cur_doc.get("curations") or {}
    docs = {"courses": courses_doc, "singletons": singles_doc, "memberships": mem_doc,
            "articulations": art_doc, "curation": cur_doc}

    # ── P0: this receipt, once ──────────────────────────────────────────────
    frozen_path = os.path.join(args.receipt, "alias_map.json")
    frozen_doc = _load(frozen_path)
    why = already_applied(frozen_doc, docs, rel)
    if why:
        sys.exit(f"ABORT (P0): {why} — a second fold needs its own dry run and receipt.")

    # ── P3: freshness at write-time ─────────────────────────────────────────
    if args.curation_export:
        rebuilt = rebuild_overlay(_load(args.curation_export))
        if json.dumps(rebuilt, sort_keys=True) != json.dumps(committed, sort_keys=True):
            only_e = sorted(set(rebuilt) - set(committed))[:5]
            only_c = sorted(set(committed) - set(rebuilt))[:5]
            sys.exit(f"ABORT (P3): the export does not rebuild the committed overlay — live curation "
                     f"drifted. only-export={only_e} only-committed={only_c}")
        p3 = f"export rebuilds the committed overlay exactly ({len(committed)} entries)"
    elif args.fresh_read:
        fresh = _load(args.fresh_read)
        if not fresh_read_matches(fresh, committed):
            newest = max((e.get("reviewed_at") or "" for e in committed.values()), default="")
            sys.exit(f"ABORT (P3): fresh read {fresh} != committed overlay ({len(committed)} entries, "
                     f"newest {newest}) — re-sync kb/coci_curation.json and re-run.")
        p3 = (f"fresh read matches the committed overlay ({len(committed)} entries, newest "
              f"{fresh.get('newest_reviewed_at')})")
    elif args.apply:
        sys.exit("ABORT (P3): --apply needs --curation-export or --fresh-read (fresh-read at write-time).")
    else:
        p3 = "skipped (verify mode)"
    print(f"P3 curation freshness: {p3}")

    # ── the plan (the planner's own allocator, throwaway copies) ────────────
    s4 = pf._s4()
    courses_copy = json.loads(json.dumps(courses_doc["courses"]))
    singles_copy = json.loads(json.dumps(singles_doc["courses"]))
    cur_copy = json.loads(json.dumps(committed))
    plan = pf.compute_plan(courses_copy, singles_copy, cur_copy,
                           json.loads(json.dumps(art_doc.get("identities") or {})),
                           canon_doc, s4.load_umbrella_allowances(), rec.load_id_reservations(),
                           scope=args.scope, ruled_held=args.ruled_held)
    if not args.no_parity:
        pf.parity(plan, courses_copy, singles_copy, cur_copy, canon_doc)
    failed = [k for k, v in plan["validation"].items() if not v["pass"]]
    if failed:
        sys.exit(f"ABORT: dry-run validation gate(s) failed: {failed}")
    print(f"plan: {len(plan['alias']):,} aliases · held {len(plan['held'])} · out of scope "
          f"{len(plan['out_of_scope'])} · validation {len(plan['validation'])}/{len(plan['validation'])} ✓")

    # ── P1: fidelity vs the frozen, Sam-reviewed receipt ────────────────────
    problems = receipt_matches(frozen_doc, args.scope, args.ruled_held)
    if problems:
        sys.exit("ABORT (P1): " + "; ".join(problems) + " — cut a receipt under these flags and have it reviewed.")
    ok, drift = plan_fidelity(plan, frozen_doc)
    if not ok:
        msg = f"plan drift vs the frozen receipt: {len(drift)} differing keys (sample {drift[:5]})"
        if not args.allow_plan_drift:
            sys.exit(f"ABORT (P1): {msg} — Sam's yes was given against the frozen plan. Re-run the "
                     f"dry run, re-review, or pass --allow-plan-drift after re-approval.")
        print(f"⚠ P1 OVERRIDDEN: {msg}")
    else:
        print(f"P1 plan fidelity: recomputed plan == frozen receipt ({len(plan['alias'])} aliases) ✓")

    # ── mutate (pristine docs) + gates ───────────────────────────────────────
    orig = {"courses": json.loads(json.dumps(courses_doc["courses"])),
            "singletons": json.loads(json.dumps(singles_doc["courses"])),
            "memberships": dict(mem_doc["memberships"]),
            "art_multiset": [a.get("course_id") or "" for a in art_doc.get("articulations", [])],
            "identities": dict(art_doc.get("identities") or {}),
            "curation": dict(committed)}
    stats = apply_plan(docs, plan, now, rel)
    gates = post_gates(orig, docs, plan, stats)
    print("gates:")
    for g, okg in gates.items():
        print(f"  {'PASS' if okg else 'FAIL'}  {g}")
    print("ripple: " + " | ".join(f"{k} {v:,}" for k, v in sorted(stats.items())))
    print(f"after the land, fold-verify must read re_key {expected_residual(plan)} "
          f"({len(plan['held'])} held + {len(plan['out_of_scope'])} outside the scope)")
    if not all(gates.values()):
        sys.exit("✗ gate failure — NOTHING written. `git checkout kb/` if in doubt.")
    if not args.apply:
        print("\nVERIFY MODE — no files written. Re-run with --apply (+ --fresh-read + --ruling).")
        return 0

    # ── write ───────────────────────────────────────────────────────────────
    for path, doc in ((rec.COURSES, courses_doc), (rec.SINGLETONS, singles_doc),
                      (rec.MEMBERSHIPS, mem_doc), (rec.ARTICULATIONS, art_doc),
                      (rec.CURATION, cur_doc)):
        _atomic_dump(path, doc, _trailing_nl(path))
    write_receipt(args.receipt, frozen_doc, plan, stats, gates, p3, now, args.ruling)
    print(f"\n✓ APPLIED. receipt → {rel}/")
    print("NEXT (same window, in this order): commit the mutation WITH this receipt's path appended to "
          "kb/_rekey_promotions.py ALIAS_MAPS (stamps: _prefix_fold_from); run python3 kb/_post_apply_chain.py "
          f"once (fold-verify must read re_key {expected_residual(plan)}); merge; dispatch "
          "supabase-rekey.yml with this alias map; dispatch daily-dashboard.yml; rebuild SkyView "
          "(python3 kb/_build_ccr_universe.py) and commit it.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
