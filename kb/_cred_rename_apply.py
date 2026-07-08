"""
Cred-Ref PR-5b/1 — Credential-title rename APPLY step (Mode B).

Consumes kb/cred_rename_dryrun/alias_map.json (produced by
kb/_cred_rename_dryrun.py) and re-keys, in place, the three source-of-
truth JSONs:

  * kb/credentials.json      — KEY rewrite (the dict is keyed by unified_title)
  * kb/unified_titles.json   — VALUE rewrite (entry.unified_title field on
                                each raw_title that pointed at the old name)
  * kb/coci_articulations.json — VALUE rewrite (articulation.unified_title
                                  field on each record)

Writes audit artifacts to kb/cred_rename_out/<YYYY-MM-DD>/:

  * alias_map.json   — frozen snapshot of the alias map used (rollback basis)
  * validation.md    — pre/post counts per file (the apply receipt)

DOES NOT touch Supabase. The Supabase row migration lives in
kb/_cred_rename_apply_supabase.py and runs as a separate workflow step
AFTER this script's git mutations land.

DOES NOT mutate raw college-authored titles. The supersede-don't-mutate
ADR (docs/kb-notes/adr-supersede-dont-mutate-synthetic-layer.md) is
honored: kb/unified_titles.json dict KEYS (the raw exhibit titles) stay
byte-for-byte identical; only the synthetic unified_title VALUES on the
right side change.

Apply gates (V1–V4):
  V1 — Dry-run already validated apply_safe=true. We re-verify by
       re-reading the dryrun alias_map and checking the summary.
  V2 — Source unified_title exists in credentials.json OR
       unified_titles.json (so the rename has something to re-key).
  V3 — Target unified_title is collision-free in credentials.json
       (a stale collision the dry-run missed because credentials.json
       drifted between dry-run and apply).
  V4 — Articulation record count for each old name BEFORE matches the
       count of NEW name records AFTER (rename, not delete/duplicate).

Safety:
  * Refuses to run if alias_map.json is missing or empty.
  * Refuses to run if dryrun reported apply_safe=false.
  * Atomic writes (tmp file + rename) so a crash mid-write can't leave
    a half-written kb file on disk.
  * Idempotent: re-running on already-applied state mutates nothing
    (every alias' old name is gone from the files; the apply log
    captures "0 records re-keyed" and exits clean).

Rollback: the frozen alias_map.json snapshot at
kb/cred_rename_out/<date>/alias_map.json carries the round-trip. To
revert, swap old↔new in the snapshot's "renames" and re-run.

Run from repo root:  python3 kb/_cred_rename_apply.py
"""
from __future__ import annotations

import json
import os
import sys
from collections import Counter
from datetime import date, datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
DRYRUN_OUT = os.path.join(HERE, "cred_rename_dryrun")
ALIAS_PATH = os.path.join(DRYRUN_OUT, "alias_map.json")
OUT_ROOT = os.path.join(HERE, "cred_rename_out")

CREDENTIALS = os.path.join(HERE, "credentials.json")
UNIFIED_TITLES = os.path.join(HERE, "unified_titles.json")
ARTICULATIONS = os.path.join(HERE, "coci_articulations.json")

TODAY = date.today().isoformat()
NOW_ISO = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _atomic_write_json(path, obj):
    """Write JSON to a temp sibling and rename. Crash-safe."""
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2, ensure_ascii=False)
        f.write("\n")
    os.replace(tmp, path)


def load_alias_map():
    if not os.path.exists(ALIAS_PATH):
        sys.exit(f"Missing {ALIAS_PATH} — run kb/_cred_rename_dryrun.py first.")
    with open(ALIAS_PATH, encoding="utf-8") as f:
        doc = json.load(f)
    summary = doc.get("summary") or {}
    renames = doc.get("renames") or {}
    merges = doc.get("merges") or {}
    if not renames and not merges:
        sys.exit(f"{ALIAS_PATH} has no renames or merges — nothing to apply.")
    # V1 — refuse if dry-run flagged unsafe
    if not summary.get("apply_safe"):
        sys.exit(
            f"Dry-run reported apply_safe=false (a V1/V2/V3 gate failed, or "
            f"there are no clean renames — queued collisions alone never "
            f"gate). Re-run kb/_cred_rename_dryrun.py, resolve the gate "
            f"failures, then re-run apply.\n"
            f"Gate status: v1={summary.get('v1_intra_batch_collisions_pass')} "
            f"v2={summary.get('v2_source_exists_pass')} "
            f"v3={summary.get('v3_target_collision_free_pass')} "
            f"collisions={summary.get('collisions')}"
        )
    return doc, renames, merges


def rekey_credentials(renames: dict):
    """Re-key the top-level dict in kb/credentials.json.

    V3 — verify each target is absent BEFORE the rename. If credentials.json
    has drifted between dry-run and apply (e.g., a new credential was added
    that collides with a proposed target), abort.
    """
    with open(CREDENTIALS, encoding="utf-8") as f:
        creds = json.load(f)
    before_count = len(creds)
    # V3 re-check (dry-run validated; this catches drift since then)
    drift_collisions = []
    for old, new in renames.items():
        if new in creds and old != new and old in creds:
            drift_collisions.append({"old": old, "new": new})
    if drift_collisions:
        sys.exit(
            f"V3 drift: credentials.json gained a collision target between "
            f"dry-run and apply: {drift_collisions[:3]}. Re-run dry-run and "
            f"resolve."
        )
    rekeyed = 0
    already_applied = 0
    not_found = 0
    for old, new in renames.items():
        if old not in creds:
            # Already applied (or never present — V2 warned in the dry-run).
            if new in creds:
                already_applied += 1
            else:
                not_found += 1
            continue
        creds[new] = creds.pop(old)
        rekeyed += 1
    after_count = len(creds)
    if before_count != after_count:
        sys.exit(
            f"credentials.json record count changed: before={before_count}, "
            f"after={after_count}. Re-key should preserve totals; aborting "
            f"to prevent data loss."
        )
    _atomic_write_json(CREDENTIALS, creds)
    return {
        "before_count": before_count,
        "after_count": after_count,
        "rekeyed": rekeyed,
        "already_applied": already_applied,
        "not_found": not_found,
    }


def _norm_agency(s):
    return " ".join((s or "").split()).casefold()


def fold_credentials(merges: dict):
    """PR-5b/2 — fold each merge source's credential records into the
    EXISTING target key (curator-confirmed; Rule 4 multi-record shape).

    Dedupe: a moving record whose normalized (issuing_agency, training_agency)
    pair already exists on the target is dropped (the target's own curator
    data wins; the frozen alias_map snapshot preserves everything).

    Gates: the target must still exist (drift check — a target renamed away
    between dry-run and apply aborts); the post-fold key count must equal
    before − (sources actually folded).
    """
    with open(CREDENTIALS, encoding="utf-8") as f:
        creds = json.load(f)
    before_count = len(creds)
    folded = 0
    already_applied = 0
    records_moved = 0
    records_deduped = 0
    drift = [t for o, t in merges.items() if o in creds and t not in creds]
    if drift:
        sys.exit(
            f"Merge-target drift: {drift[:3]} no longer exist in "
            f"credentials.json (renamed away between dry-run and apply?). "
            f"Re-run the dry-run and resolve."
        )
    for old, target in merges.items():
        if old not in creds:
            already_applied += 1  # re-run idempotency (or V2-warned ghost)
            continue
        moving = creds.pop(old) or []
        existing = creds.get(target) or []
        have = {( _norm_agency(x.get("issuing_agency")),
                  _norm_agency(x.get("training_agency")) ) for x in existing}
        for rec in moving:
            key = (_norm_agency(rec.get("issuing_agency")),
                   _norm_agency(rec.get("training_agency")))
            if key in have:
                records_deduped += 1
                continue
            existing.append(rec)
            have.add(key)
            records_moved += 1
        creds[target] = existing
        folded += 1
    after_count = len(creds)
    if after_count != before_count - folded:
        sys.exit(
            f"credentials.json fold count check failed: before={before_count}, "
            f"after={after_count}, folded={folded}. Aborting to prevent "
            f"data loss."
        )
    _atomic_write_json(CREDENTIALS, creds)
    return {
        "before_count": before_count,
        "after_count": after_count,
        "keys_folded": folded,
        "already_applied": already_applied,
        "records_moved": records_moved,
        "records_deduped": records_deduped,
    }


def rewrite_unified_titles_values(renames: dict):
    """Rewrite the `unified_title` VALUE on each raw_title entry that
    points at an old name. Dict KEYS (raw_titles) stay untouched per the
    supersede-don't-mutate ADR.
    """
    with open(UNIFIED_TITLES, encoding="utf-8") as f:
        ut = json.load(f)
    before_count = len(ut)
    rewrites = 0
    untouched = 0
    for raw_title, rec in ut.items():
        old_ut = (rec or {}).get("unified_title")
        if old_ut and old_ut in renames:
            rec["unified_title"] = renames[old_ut]
            rewrites += 1
        else:
            untouched += 1
    if before_count != len(ut):
        sys.exit("unified_titles.json count mutated (would never happen — defensive).")
    _atomic_write_json(UNIFIED_TITLES, ut)
    return {"before_count": before_count, "rewrites": rewrites, "untouched": untouched}


def rewrite_articulations_values(renames: dict):
    """Rewrite the `unified_title` VALUE on each articulation record that
    points at an old name. The dict structure is preserved verbatim.

    V4 — count records per old name before, count per new name after.
    Should match (rename preserves cardinality).
    """
    with open(ARTICULATIONS, encoding="utf-8") as f:
        art_doc = json.load(f)
    arts = art_doc.get("articulations") or []
    # V4 pre-counts: how many records reference each old name?
    pre_counts_old = Counter(
        r.get("unified_title") for r in arts if r.get("unified_title") in renames
    )
    # V4 pre-counts: how many records ALREADY reference each new name?
    # (idempotency: a re-run sees the renames already applied; old counts
    # would be 0, new counts would equal the original old counts.)
    pre_counts_new = Counter(
        r.get("unified_title") for r in arts if r.get("unified_title") in set(renames.values())
    )
    rewrites = 0
    for r in arts:
        ut = r.get("unified_title")
        if ut and ut in renames:
            r["unified_title"] = renames[ut]
            rewrites += 1
    # V4 post-counts: every new name's record count should equal
    # (old_pre_count + new_pre_count).
    post_counts_new = Counter(
        r.get("unified_title") for r in arts if r.get("unified_title") in set(renames.values())
    )
    v4_failures = []
    for old, new in renames.items():
        expected = pre_counts_old.get(old, 0) + pre_counts_new.get(new, 0)
        actual = post_counts_new.get(new, 0)
        if expected != actual:
            v4_failures.append({"old": old, "new": new, "expected": expected, "actual": actual})
    if v4_failures:
        sys.exit(
            f"V4 articulation count mismatch — apply would have changed "
            f"cardinality. NOT writing the file. Failures: {v4_failures[:3]}"
        )
    _atomic_write_json(ARTICULATIONS, art_doc)
    return {
        "articulation_records": len(arts),
        "rewrites": rewrites,
        "pre_counts_old": dict(pre_counts_old),
        "post_counts_new": dict(post_counts_new),
    }


def write_snapshot(alias_doc, results):
    out_dir = os.path.join(OUT_ROOT, TODAY)
    if not os.path.isdir(out_dir):
        os.makedirs(out_dir)
    # Frozen alias_map (the rollback basis).
    snap = dict(alias_doc)
    snap["_applied_at"] = NOW_ISO
    snap["_apply_results"] = results
    _atomic_write_json(os.path.join(out_dir, "alias_map.json"), snap)
    # validation.md — the apply receipt.
    md_path = os.path.join(out_dir, "validation.md")
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(_render_validation_md(snap, results))
    return out_dir


def _render_validation_md(snap, results):
    lines = []
    lines.append(f"# Credential Rename Apply Receipt — {TODAY}")
    lines.append("")
    lines.append(f"Applied: `{NOW_ISO}`")
    lines.append("")
    lines.append(f"**{len(snap.get('renames') or {})} renames + "
                 f"{len(snap.get('merges') or {})} confirmed merges applied** "
                 f"across credentials.json + unified_titles.json + "
                 f"coci_articulations.json.")
    lines.append("")
    lines.append("## Renames applied")
    lines.append("")
    if not snap.get("renames"):
        lines.append("_None._")
    else:
        lines.append("| Old unified_title | → | New unified_title |")
        lines.append("|---|---|---|")
        for old, new in sorted((snap.get("renames") or {}).items()):
            lines.append(f"| `{old}` | → | `{new}` |")
    lines.append("")
    lines.append("## Confirmed merges applied (records folded into the existing key)")
    lines.append("")
    if not snap.get("merges"):
        lines.append("_None._")
    else:
        lines.append("| Old unified_title | ⇒ folded into |")
        lines.append("|---|---|")
        for old, target in sorted((snap.get("merges") or {}).items()):
            lines.append(f"| `{old}` | ⇒ `{target}` |")
    lines.append("")
    lines.append("## Per-file results")
    lines.append("")
    for fname, res in results.items():
        lines.append(f"### `{fname}`")
        lines.append("")
        for k, v in res.items():
            if isinstance(v, dict):
                lines.append(f"- **{k}**: `{json.dumps(v, ensure_ascii=False)}`")
            else:
                lines.append(f"- **{k}**: {v}")
        lines.append("")
    lines.append("## Rollback")
    lines.append("")
    lines.append("To revert RENAMES, swap `old` and `new` in the frozen alias_map.json "
                 "at this path and re-run `kb/_cred_rename_apply.py`. The "
                 "supersede-don't-mutate ADR preserves the round-trip. "
                 "MERGES are not swap-reversible (records fold + dedupe): revert "
                 "them from git history using this receipt's merge list as the map.")
    lines.append("")
    return "\n".join(lines) + "\n"


def main():
    alias_doc, renames, merges = load_alias_map()
    print(f"[cred_rename_apply] {TODAY} — applying {len(renames)} rename(s) "
          f"+ {len(merges)} confirmed merge(s)")
    creds_res = rekey_credentials(renames)
    print(f"  credentials.json:        rekeyed={creds_res['rekeyed']}, "
          f"already_applied={creds_res['already_applied']}, "
          f"not_found={creds_res['not_found']}")
    results = {"credentials.json": creds_res}
    if merges:
        fold_res = fold_credentials(merges)
        print(f"  credentials.json fold:   keys_folded={fold_res['keys_folded']}, "
              f"records_moved={fold_res['records_moved']}, "
              f"records_deduped={fold_res['records_deduped']}")
        results["credentials.json (merge fold)"] = fold_res
    # Renames and merges are both old→new value rewrites downstream — the V4
    # cardinality formula (old_pre + new_pre) is additive-correct for merges.
    combined = dict(renames)
    combined.update(merges)
    ut_res = rewrite_unified_titles_values(combined)
    print(f"  unified_titles.json:     value-rewrites={ut_res['rewrites']}, "
          f"untouched={ut_res['untouched']}")
    art_res = rewrite_articulations_values(combined)
    print(f"  coci_articulations.json: value-rewrites={art_res['rewrites']} "
          f"(V4 gate passed)")
    results["unified_titles.json"] = ut_res
    results["coci_articulations.json"] = art_res
    out_dir = write_snapshot(alias_doc, results)
    print(f"  receipt: {out_dir}/{{alias_map.json, validation.md}}")


if __name__ == "__main__":
    main()
