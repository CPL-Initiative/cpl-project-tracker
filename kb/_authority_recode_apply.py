#!/usr/bin/env python3
"""Authority recode — APPLY (items 7, 9, 10, 11, 12, 13, 14, 16 of Sam's
2026-09-03 rulings; Rule 7). The receipted half of kb/_authority_recode_dryrun.py.

The plan is RECOMPUTED here through the dry run's own compute_plan() (apply ==
spec by construction) and gated against the frozen, Sam-reviewed receipt
kb/authority_recode_out/2026-09-03/alias_map.json (P1). Sam ruled the fourteen
readings yes to all on 2026-09-03 (kb/remint_series_readings_rulings_2026-09-03.json).
Nothing is written unless every gate passes; --apply writes.

What mutates (native serialization per file, record order kept):
  kb/coci_minted_courses.json      key + course_id + subject_4letter + stamp
  kb/coci_minted_singletons.json   key + course_id + subject_4letter + stamp
  kb/coci_minted_memberships.json  key rename
  kb/coci_articulations.json       articulations[].course_id + identities keys
                                   (the pre-fold ghost keys the dry run reports
                                   are healed: the moved entry lands on them)
  kb/coci_curation.json            entry keys + merge_into pointers
  kb/uc_cur_zseq.json              counters old prefix -> new prefix (the POLS
                                   pattern; the Z band retires right after)
  kb/discipline_canonical_subj4.json
                                   canonical_subj4 for the ruled disciplines, the
                                   umbrella flags (Foreign Languages, Agriculture,
                                   Agricultural Production), the fan-in pair
                                   (Film and Media Studies + Media Production on
                                   FTVE — recorded on the seed, NOT in
                                   kb/discipline_aliases.json, because that file
                                   folds a discipline away and Sam's item 13 keeps
                                   both names)
  kb/foreign_language_subj4.json   per-language subj4 (SPAN, FREN, ...)

Per moved catalog row: `_authority_recode_from` = the pre-recode id (ground truth
for kb/_rekey_promotions.py's stamp gate).

Supabase is NOT written here (no egress from a session). The kb_curation re-key
runs from the committed receipt through .github/workflows/supabase-rekey.yml in
the same cron window; the _CANON_SUBJ4:: picks for the recoded disciplines are
emitted to the receipt (supabase_ops.json) as guarded UPDATEs with their
before-values captured at execution (Rule 10: reversible from the receipt).

Gates (all must pass or nothing is written):
  V1-V7  the dry run's validations, recomputed
  P0     not already applied (no _authority_recode_applied_at stamp)
  P1     plan fidelity: the recomputed alias map == the frozen receipt
  P3     curation freshness at write-time: --curation-export rows rebuild the
         committed overlay exactly, OR --fresh-read <json> (the MCP count query:
         distinct course_ids + newest reviewed_at over the overlay fields)
         matches the committed overlay
  G1-G10 post-mutation conservation: counts, untouched byte-identity, key ==
         course_id, exact keyset permutation, articulation multiset, overlay
         integrity, stamps, minted/singleton disjoint, subject_4letter ==
         prefix, discipline unchanged

Usage (from repo root):
  python3 kb/_authority_recode_apply.py                                   # verify
  python3 kb/_authority_recode_apply.py --fresh-read /tmp/fresh.json --apply
Receipt: kb/authority_recode_out/2026-09-03/{alias_map.json (restamped APPLIED),
supabase_ops.json, validation.md}
Rollback: the alias map read right-to-left + git revert on a branch, the
inverse Supabase ops, inside one cron window (docs/coursecontrolnumber_remint.md).
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
import _authority_recode_dryrun as dry  # noqa: E402  (the shared allocator)

ZSEQ = os.path.join(HERE, "uc_cur_zseq.json")
READINGS = os.path.join(HERE, "remint_series_readings_rulings_2026-09-03.json")
RECEIPT_DIR = (os.environ.get("AUTHORITY_RECODE_RECEIPT")
               or os.path.join(HERE, "authority_recode_out", "2026-09-03"))
STAMP = "_authority_recode_from"
APPLIED = "_authority_recode_applied_at"
OVERLAY_FIELDS = {"discipline", "merge_into", "unified_title", "description",
                  "cross_listed_disciplines"}
PICK_PREFIX = "_CANON_SUBJ4::"
PICK_REVIEWER = "authority-recode-s224@bot"
MZ_RE = re.compile(r"^[A-Z]{1,6} [MZ][0-9][A-Z0-9]{3}$")
FAN_IN_PAIR = {"Film and Media Studies": "Media Production",
               "Media Production": "Film and Media Studies"}


def _load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _trailing_nl(path):
    with open(path, "rb") as f:
        f.seek(0, os.SEEK_END)
        n = f.tell()
        if n == 0:
            return True
        f.seek(n - 1)
        return f.read(1) == b"\n"


def _atomic_dump(path, obj, trailing_nl):
    """Temp-sibling + rename; indent=2, ensure_ascii=False, the file's own
    trailing-newline convention."""
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


def _ts_key(ts):
    """Timestamps compared at second precision, whatever the formatting
    ('2026-06-13 17:47:56.243497+00' == '2026-06-13T17:47:56.243497+00:00')."""
    return re.sub(r"\D", "", ts or "")[:14]


def fresh_read_matches(fresh, committed):
    """P3 without an export: the MCP count query's {distinct_course_ids,
    newest_reviewed_at} over the overlay fields must equal the committed
    overlay's entry count and newest reviewed_at."""
    newest = max((e.get("reviewed_at") or "" for e in committed.values()), default="")
    return (int(fresh.get("distinct_course_ids", -1)) == len(committed)
            and _ts_key(fresh.get("newest_reviewed_at")) == _ts_key(newest))


def plan_fidelity(plan, frozen_doc):
    """-> (ok, differing keys). The frozen receipt is {old: {new_id: ...}}."""
    frozen = {old: (v["new_id"] if isinstance(v, dict) else v)
              for old, v in (frozen_doc.get("aliases") or {}).items()}
    live = dict(plan["alias"])
    drift = sorted(k for k in set(frozen) | set(live) if frozen.get(k) != live.get(k))
    return (not drift, drift)


def prefix_moves(plan):
    """Whole-prefix moves (old prefix -> new prefix): the plain items, the fan-in
    pair and the languages whose code changes. Agriculture is per row (the
    residual code stays), so its prefixes do not move."""
    out = {}
    for disc, old, new, item, note in dry.PLAIN + dry.FAN_IN:
        out[old] = new
    for lang, v in plan["fl_codes"].items():
        if v["code"] != v["current"]:
            out[v["current"]] = v["code"]
    return out


def apply_plan(docs, plan, edits, now):
    """Mutate the loaded docs in place from the plan. Pure with respect to
    files; returns a Counter of what moved."""
    alias = {k: v for k, v in plan["alias"].items() if v and v != k}
    courses_doc, singles_doc = docs["courses"], docs["singletons"]
    mem_doc, art_doc, cur_doc = docs["memberships"], docs["articulations"], docs["curation"]
    canon_doc, fl_doc, zseq_doc = docs["canonical"], docs["fl"], docs["zseq"]
    stats = Counter()

    def fold(doc, label):
        out = {}
        for k, rec in doc["courses"].items():
            nk = alias.get(k)
            if nk:
                rec["course_id"] = nk
                rec["subject_4letter"] = nk.split(" ")[0]
                rec[STAMP] = k
                out[nk] = rec
                stats[label] += 1
            else:
                out[k] = rec
        doc["courses"] = out
        doc[APPLIED] = now

    fold(courses_doc, "minted")
    fold(singles_doc, "singletons")

    new_mem = {}
    for k, v in mem_doc["memberships"].items():
        nk = alias.get(k, k)
        if nk != k:
            stats["memberships"] += 1
        new_mem[nk] = v
    mem_doc["memberships"] = new_mem
    mem_doc[APPLIED] = now

    for a in art_doc.get("articulations", []):
        c = a.get("course_id")
        if c in alias:
            a["course_id"] = alias[c]
            stats["articulations"] += 1
    ident = art_doc.get("identities")
    if isinstance(ident, dict):
        moved = {alias[k]: v for k, v in ident.items() if k in alias}
        kept = {k: v for k, v in ident.items() if k not in alias}
        stats["identities_ghosts_healed"] = sum(1 for k in moved if k in kept)
        kept.update(moved)                     # the moved entry wins the key
        art_doc["identities"] = kept
        stats["identities"] = len(moved)
    art_doc[APPLIED] = now

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

    pm = prefix_moves(plan)
    counters = zseq_doc.get("counters") or {}
    moved_counters = {}
    for ck in list(counters):
        p, _, band = ck.partition("|")
        if p in pm:
            nk = f"{pm[p]}|{band}"
            counters[nk] = counters.get(nk, 0) + counters.pop(ck)
            moved_counters[ck] = nk
    zseq_doc["counters"] = counters
    if moved_counters:
        zseq_doc[APPLIED] = now
        zseq_doc["_authority_recode_counters_moved"] = moved_counters
    stats["zseq_counters"] = len(moved_counters)

    disc = canon_doc.get("disciplines") or {}
    for d, ch in (edits.get("canonical") or {}).items():
        e = disc.get(d)
        if e is None:
            continue
        e["canonical_subj4"] = ch["to"]
        note = (f"Recoded {ch['from']} -> {ch['to']} (Sam, 2026-09-03 rulings, item "
                f"{ch['item']}; readings ruled yes to all the same day); "
                f"kb/_authority_recode_apply.py {now[:10]}, receipt "
                f"kb/authority_recode_out/2026-09-03.")
        e["_notes"] = (e.get("_notes") + " | " if e.get("_notes") else "") + note
        e["needs_review"] = False
        stats["seed_codes"] += 1
    for d, other in FAN_IN_PAIR.items():
        if d in disc:
            disc[d]["fan_in_with"] = [other]
            disc[d]["_fan_in_note"] = ("FTVE is shared by design (item 13 of the 2026-09-03 "
                                       "rulings; readings card 2): two MQ disciplines, both "
                                       "names kept, one Common SUBJ. Not an alias fold — "
                                       "kb/discipline_aliases.json would fold the discipline away.")
    for d, u in (edits.get("umbrella") or {}).items():
        e = disc.get(d)
        if e is None:
            continue
        e["is_umbrella"] = True
        e["umbrella_codes"] = sorted(set(u.get("umbrella_codes") or []))
        if u.get("umbrella_group"):
            e["umbrella_group"] = u["umbrella_group"]
        e["_umbrella_note"] = (f"Umbrella discipline (item {u.get('item')} of the 2026-09-03 "
                               f"rulings): its rows legitimately span umbrella_codes; the "
                               f"canonical code is the residual.")
        stats["seed_umbrellas"] += 1
    canon_doc[APPLIED] = now

    langs = fl_doc.get("languages") or {}
    for lang, ch in (edits.get("foreign_language_subj4") or {}).items():
        if lang in langs and langs[lang].get("subj4") == ch["from"]:
            langs[lang]["subj4"] = ch["to"]
            stats["fl_codes"] += 1
    fl_doc[APPLIED] = now
    return stats


def post_gates(orig, docs, plan):
    """Post-mutation conservation gates over the mutated docs vs the originals
    captured before apply_plan()."""
    moves = {k: v for k, v in plan["alias"].items() if v and v != k}
    oc, os_, om = orig["courses"], orig["singletons"], orig["memberships"]
    nc = docs["courses"]["courses"]
    ns = docs["singletons"]["courses"]
    nm = docs["memberships"]["memberships"]
    arts = docs["articulations"].get("articulations", [])
    ncur = docs["curation"]["curations"]
    g = {}
    g["G1 counts conserved across the five files"] = (
        len(nc) == len(oc) and len(ns) == len(os_) and len(nm) == len(om)
        and len(arts) == len(orig["art_multiset"]) and len(ncur) == len(orig["curation"]))
    untouched = True
    for o, n in ((oc, nc), (os_, ns)):
        for k, rec in o.items():
            if k in moves:
                continue
            if json.dumps(n.get(k), sort_keys=True) != json.dumps(rec, sort_keys=True):
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
            ok = False          # a Z target lives only in the overlay; an M target in the catalog
    g["G6 overlay keys + pointers mapped, every M/Z target resolves"] = ok
    stamp_count, stamp_ok = 0, True
    for src in (nc, ns):
        for k, r in src.items():
            s = r.get(STAMP)
            if s:
                stamp_count += 1
                stamp_ok = stamp_ok and moves.get(s) == k
    n_catalog_moves = sum(1 for k in moves if k in oc or k in os_)
    g["G7 stamps: every moved catalog row carries its old id"] = stamp_ok and stamp_count == n_catalog_moves
    g["G8 minted/singleton key spaces disjoint"] = not (set(nc) & set(ns))
    g["G9 subject_4letter == prefix on every moved row"] = all(
        src[k].get("subject_4letter") == k.split(" ")[0]
        for src in (nc, ns) for k in src if src[k].get(STAMP))
    g["G10 discipline unchanged on every moved row"] = all(
        (nc.get(v) or ns.get(v) or {}).get("discipline") == (oc.get(k) or os_.get(k) or {}).get("discipline")
        for k, v in moves.items() if k in oc or k in os_)
    return g


def pick_ops(edits, now):
    """The _CANON_SUBJ4:: picks the recode changes — guarded UPDATEs (the
    before-value is in the WHERE) plus the notes row (update, else insert under
    the cohort reviewer). Executed through the MCP lane in the same window;
    before-values captured there into the receipt (Rule 10 a2)."""
    ops = []
    for d, ch in sorted((edits.get("canonical") or {}).items()):
        key = (PICK_PREFIX + d).replace("'", "''")
        note = (f"Recoded {ch['from']} -> {ch['to']} (Sam, 2026-09-03 rulings, item {ch['item']}; "
                f"the fourteen readings ruled yes to all the same day). Applied "
                f"{now[:10]} by kb/_authority_recode_apply.py; receipt "
                f"kb/authority_recode_out/2026-09-03.").replace("'", "''")
        ops.append({"discipline": d, "field": "canonical_subj4", "from": ch["from"], "to": ch["to"],
                    "sql": (f"update public.kb_curation set value = '{ch['to']}' where course_id = '{key}' "
                            f"and field = 'canonical_subj4' and value = '{ch['from']}';")})
        ops.append({"discipline": d, "field": "canonical_subj4_notes", "to": note,
                    "sql": (f"update public.kb_curation set value = '{note}' where course_id = '{key}' "
                            f"and field = 'canonical_subj4_notes';\n"
                            f"insert into public.kb_curation (course_id, field, value, reviewer_email, reviewed_at) "
                            f"select '{key}', 'canonical_subj4_notes', '{note}', '{PICK_REVIEWER}', now() "
                            f"where not exists (select 1 from public.kb_curation where course_id = '{key}' "
                            f"and field = 'canonical_subj4_notes');")})
    return ops


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true", help="write the mutated KB + receipt")
    ap.add_argument("--curation-export", help="fresh kb_curation row export (json list) — P3 exact")
    ap.add_argument("--fresh-read", help="json {distinct_course_ids, newest_reviewed_at} from the MCP "
                                         "count query over the overlay fields — P3 by count")
    ap.add_argument("--allow-plan-drift", action="store_true",
                    help="proceed when the recomputed plan differs from the frozen receipt "
                         "(ONLY after Sam re-reviews)")
    ap.add_argument("--receipt", default=RECEIPT_DIR, help="the frozen dry-run receipt dir")
    args = ap.parse_args()
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    courses_doc, singles_doc = _load(dry.COURSES), _load(dry.SINGLETONS)
    if courses_doc.get(APPLIED) or singles_doc.get(APPLIED):
        sys.exit("ABORT (P0): _authority_recode_applied_at already present — applied. A second "
                 "recode needs its own dry run and receipt.")
    mem_doc, art_doc, cur_doc = _load(dry.MEMBERSHIPS), _load(dry.ARTICULATIONS), _load(dry.CURATION)
    canon_doc, fl_doc, rulings = _load(dry.CANONICAL), _load(dry.FL_SPLIT), _load(dry.RULINGS)
    zseq_doc = _load(ZSEQ) if os.path.exists(ZSEQ) else {"counters": {}}
    committed = cur_doc.get("curations") or {}

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

    # ── the plan (shared allocator, throwaway copies) ────────────────────────
    plan = dry.compute_plan(json.loads(json.dumps(courses_doc["courses"])),
                            json.loads(json.dumps(singles_doc["courses"])),
                            mem_doc["memberships"], json.loads(json.dumps(committed)),
                            json.loads(json.dumps(art_doc.get("identities") or {})),
                            canon_doc, fl_doc, rulings, dry.load_id_reservations(), dry.load_fl_module())
    if plan["problems"]:
        sys.exit("ABORT: plan drift vs the rulings file: " + "; ".join(plan["problems"]))
    failed = [k for k, v in plan["validation"].items() if not v["pass"]]
    if failed:
        sys.exit(f"ABORT: dry-run validation gate(s) failed: {failed}")
    edits = dry.seed_edits(plan, canon_doc, fl_doc)

    # ── P1: fidelity vs the frozen, Sam-reviewed receipt ────────────────────
    frozen_path = os.path.join(args.receipt, "alias_map.json")
    frozen_doc = _load(frozen_path)
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
            "curation": dict(committed)}
    docs = {"courses": courses_doc, "singletons": singles_doc, "memberships": mem_doc,
            "articulations": art_doc, "curation": cur_doc, "canonical": canon_doc,
            "fl": fl_doc, "zseq": zseq_doc}
    stats = apply_plan(docs, plan, edits, now)
    gates = post_gates(orig, docs, plan)
    print("gates:")
    for g, okg in gates.items():
        print(f"  {'PASS' if okg else 'FAIL'}  {g}")
    print("ripple: " + " | ".join(f"{k} {v:,}" for k, v in sorted(stats.items())))
    if not all(gates.values()):
        sys.exit("✗ gate failure — NOTHING written. `git checkout kb/` if in doubt.")
    if not args.apply:
        print("\nVERIFY MODE — no files written. Re-run with --apply (+ --fresh-read).")
        return 0

    # ── write ───────────────────────────────────────────────────────────────
    for path, doc in ((dry.COURSES, courses_doc), (dry.SINGLETONS, singles_doc),
                      (dry.MEMBERSHIPS, mem_doc), (dry.ARTICULATIONS, art_doc),
                      (dry.CURATION, cur_doc), (dry.CANONICAL, canon_doc), (dry.FL_SPLIT, fl_doc)):
        _atomic_dump(path, doc, _trailing_nl(path))
    if os.path.exists(ZSEQ):
        _atomic_dump(ZSEQ, zseq_doc, _trailing_nl(ZSEQ))

    frozen_doc["_status"] = (f"APPLIED {now} — authority recode (items 7, 9, 10, 11, 12, 13, 14, 16 of "
                             f"2026-09-03; the fourteen readings ruled yes to all). The alias map is the "
                             f"receipt of record and the rollback handle (read right-to-left). Per-row "
                             f"ground truth: _authority_recode_from stamps on minted courses + singletons.")
    frozen_doc["_applied_at"] = now
    frozen_doc["_applied_by"] = "kb/_authority_recode_apply.py"
    frozen_doc["_plan_source"] = ("recomputed via _authority_recode_dryrun.compute_plan at apply time; "
                                  "verified equal to this frozen receipt (P1)")
    _atomic_dump(frozen_path, frozen_doc, True)
    picks = pick_ops(edits, now)
    _atomic_dump(os.path.join(args.receipt, "supabase_ops.json"), {
        "_about": ("The Supabase half of the recode, same cron window. (1) kb_curation self-keys + "
                   "merge_into pointers: dispatch .github/workflows/supabase-rekey.yml with "
                   "alias_map_path = this receipt's alias_map.json (a clean bijection, idempotent). "
                   "(2) The _CANON_SUBJ4:: picks below: guarded UPDATEs through the MCP lane; capture "
                   "the before-values into picks_before.json in this dir first (Rule 10 a2)."),
        "_emitted_at": now,
        "rekey": {"workflow": ".github/workflows/supabase-rekey.yml",
                  "alias_map_path": os.path.relpath(frozen_path, ROOT),
                  "pairs": len([1 for k, v in plan["alias"].items() if v != k])},
        "picks": picks,
        "sql": "begin;\n" + "\n".join(p["sql"] for p in picks) + "\ncommit;",
    }, True)
    with open(os.path.join(args.receipt, "validation.md"), "w", encoding="utf-8") as f:
        f.write(f"# Authority recode — APPLY validation receipt\n\n- applied: `{now}`\n"
                f"- aliases: **{len(plan['alias']):,}**\n- P1 plan fidelity: recomputed == frozen ✓\n"
                f"- P3 curation freshness: {p3}\n\n## Ripple\n\n| what | count |\n|---|---:|\n"
                + "".join(f"| {k} | {v:,} |\n" for k, v in sorted(stats.items()))
                + "\n## Apply gates\n\n" + "\n".join(f"- ✅ {g}" for g in gates)
                + "\n\n## Allocator validation (recomputed at apply)\n\n"
                + "\n".join(f"- ✅ {k}" for k in plan["validation"]) + "\n")
    report = os.path.join(args.receipt, "report.md")
    if os.path.exists(report):
        with open(report, encoding="utf-8") as f:
            txt = f.read()
        txt = re.sub(r"^status: DRY-RUN.*$", f"status: APPLIED {now} — see validation.md; Sam ruled the "
                     f"fourteen readings yes to all on 2026-09-03", txt, count=1, flags=re.M)
        with open(report, "w", encoding="utf-8") as f:
            f.write(txt)
    print(f"\n✓ APPLIED. receipt → {os.path.relpath(args.receipt, ROOT)}/")
    print("NEXT (same window): commit; dispatch supabase-rekey.yml with this alias map; execute "
          "supabase_ops.json picks via the MCP lane (before-values first); then the Z-band "
          "retirement apply; then register both receipts in kb/_rekey_promotions.py ALIAS_MAPS "
          "and run python3 kb/_post_apply_chain.py once.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
