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
  V4 — Articulation record counts are cardinality-preserved, grouped by
       TARGET: each new name's AFTER count == Σ of its source names'
       BEFORE counts + its own BEFORE count (rename/fold, not
       delete/duplicate — fan-in from confirmed merges sums correctly).

Safety:
  * Refuses to run if alias_map.json is missing or empty.
  * Refuses to run if dryrun reported apply_safe=false.
  * Atomic writes (tmp file + rename) so a crash mid-write can't leave
    a half-written kb file on disk.
  * Idempotent: re-running on already-applied state mutates nothing
    (every alias' old name is gone from the files; the apply log
    captures "0 records re-keyed" and exits clean).

Rollback: kb/cred_rename_out/<date>/undo.json holds the before and after of
every value this apply changed; `python3 kb/_cred_rename_undo.py <that folder>`
reverses renames and merges alike. A second apply the same day writes
<date>-2/ so the first receipt survives.

Saved assignments (#3110, after the 2026-11-12 apply): every saved value a bot left on an old title moves to the new
title in the same step (kb/_cred_rename_repoint.py: the classifier's cache, the occupation map, MAP's by_title; a
saved assignment moves through its kb_curation row in the workflow's step 4.1, and its copy is re-read); a person's
row, or one naming no saver, is held, unchanged, and listed. A planned write that did not land fails the apply after
its receipt is written. repoint.json beside the receipt holds
the planned list and a fresh read of each file; the undo reverses it.

Issuer precedence (#3110 build step 1): which issuer a folded title keeps is
kb/fold_issuer.py's decision; the plan is frozen into the snapshot as
issuer_resolution for the Supabase carry and the undo.

Run from repo root:  python3 kb/_cred_rename_apply.py
"""
from __future__ import annotations

import json
import os
import sys
from collections import Counter, defaultdict
from datetime import date, datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _cred_rename_repoint as repoint  # noqa: E402
import fold_issuer  # noqa: E402
import ruled_renames  # noqa: E402

OVERLAY = os.path.join(HERE, "credential_review_overlay.json")
PLANS_DIR = ruled_renames.PLANS_DIR
RELATED = os.path.join(HERE, "exhibits_related.json")
FAMILIES = os.path.join(HERE, "reference", "credential_families.json")
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


def fold_credentials(merges: dict, issuer_plan: dict | None = None):
    """PR-5b/2 — fold each merge source's credential records into the
    EXISTING target key (curator-confirmed; Rule 4 multi-record shape).

    Which issuer the folded title keeps is kb/fold_issuer.py's decision, one
    per target (#3110 build step 1): a person's explicit issuer in the group
    wins; else a certification-format target keeps its issuer and drops a
    folded college record; else each distinct (issuer, trainer) pair is kept
    (the behavior before the precedence). `issuer_plan` is fold_issuer.plan()'s
    output; None means every target is additive.

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
    issuer_log = {}
    drift = [t for o, t in merges.items() if o in creds and t not in creds]
    if drift:
        sys.exit(
            f"Merge-target drift: {drift[:3]} no longer exist in "
            f"credentials.json (renamed away between dry-run and apply?). "
            f"Re-run the dry-run and resolve."
        )
    by_target = defaultdict(list)
    for old, target in sorted(merges.items()):
        if old not in creds:
            already_applied += 1  # re-run idempotency (or V2-warned ghost)
            continue
        by_target[target].append(old)
    for target, olds in sorted(by_target.items()):
        group = (issuer_plan or {}).get(target)
        res = group["resolution"] if group else {"target": target, "rule": "additive"}
        moving = [(o, creds.pop(o) or []) for o in olds]
        recs, log = fold_issuer.fold_records(res, creds.get(target) or [], moving)
        creds[target] = recs
        folded += len(olds)
        records_moved += log["moved"]
        records_deduped += log["deduped"]
        issuer_log[target] = log
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
        "issuer_log": issuer_log,
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
    changed = {}
    for raw_title, rec in ut.items():
        old_ut = (rec or {}).get("unified_title")
        if old_ut and old_ut in renames:
            rec["unified_title"] = renames[old_ut]
            changed[raw_title] = {"before": old_ut, "after": renames[old_ut]}
            rewrites += 1
        else:
            untouched += 1
    if before_count != len(ut):
        sys.exit("unified_titles.json count mutated (would never happen — defensive).")
    _atomic_write_json(UNIFIED_TITLES, ut)
    return {"before_count": before_count, "rewrites": rewrites, "untouched": untouched,
            "_changed": changed}


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
    changed = []
    for r in arts:
        ut = r.get("unified_title")
        if ut and ut in renames:
            r["unified_title"] = renames[ut]
            changed.append({"course_id": r.get("course_id"), "exhibit_id": r.get("exhibit_id"),
                            "exhibit_title": r.get("exhibit_title"),
                            "before": ut, "after": renames[ut]})
            rewrites += 1
    # V4 post-counts: every new name's record count should equal
    # (Σ old_pre_count over ALL sources mapping to it + new_pre_count).
    # Grouped by TARGET, not per-source: confirmed merges (and a rename +
    # merges converging) legitimately fan several olds into one new — a
    # per-source check under-expects on every fan-in target and falsely
    # aborts (rename-apply run #3, 2026-07-08: the AoJ folds).
    post_counts_new = Counter(
        r.get("unified_title") for r in arts if r.get("unified_title") in set(renames.values())
    )
    by_target = defaultdict(list)
    for old, new in renames.items():
        by_target[new].append(old)
    v4_failures = []
    for new, olds in sorted(by_target.items()):
        expected = sum(pre_counts_old.get(o, 0) for o in olds) + pre_counts_new.get(new, 0)
        actual = post_counts_new.get(new, 0)
        if expected != actual:
            v4_failures.append({"olds": sorted(olds), "new": new,
                                "expected": expected, "actual": actual})
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
        "_changed": changed,
    }


def _out_dir():
    """kb/cred_rename_out/<date>/, or <date>-2, -3 … when an earlier apply the same day already wrote
    its receipt there (a second dispatch used to overwrite the first's rollback basis)."""
    base = os.path.join(OUT_ROOT, TODAY)
    out_dir, n = base, 1
    while os.path.isfile(os.path.join(out_dir, "alias_map.json")):
        n += 1
        out_dir = f"{base}-{n}"
    os.makedirs(out_dir, exist_ok=True)
    return out_dir


def write_snapshot(alias_doc, results, undo=None, issuer_plan=None, out_dir=None, resolution_rows=None):
    out_dir = out_dir or _out_dir()
    # Frozen alias_map (the rollback basis).
    snap = dict(alias_doc)
    snap["_applied_at"] = NOW_ISO
    snap["_apply_results"] = {f: {k: v for k, v in r.items() if not k.startswith("_")}
                              for f, r in results.items()}
    # The issuer decision per fold group, frozen for the receipt and the undo.
    snap["issuer_resolution"] = {t: {"resolution": g["resolution"], "exceptions": g["exceptions"],
                                     "members": g["members"]}
                                 for t, g in (issuer_plan or {}).items()}
    # The rows kb/_cred_fold_resolution_write.py writes to kb_curation, one per folded target
    # (field issuer_resolution, cohort fold_issuer.COHORT). Nothing else in kb_curation changes for
    # the issuer: the nightly enforces these (kb/_apply_credential_review.py).
    snap["resolution_rows"] = resolution_rows or []
    _atomic_write_json(os.path.join(out_dir, "alias_map.json"), snap)
    # undo.json — the exact before/after of every value this apply changed (kb/_cred_rename_undo.py).
    if undo is not None:
        _atomic_write_json(os.path.join(out_dir, "undo.json"), undo)
    # validation.md — the apply receipt.
    md_path = os.path.join(out_dir, "validation.md")
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(_render_validation_md(snap, snap["_apply_results"], issuer_plan, results))
    return out_dir


def _render_validation_md(snap, results, issuer_plan=None, full_results=None):
    lines = []
    lines.append(f"# Credential Rename Apply Receipt — {TODAY}")
    lines.append("")
    lines.append(f"Applied: `{NOW_ISO}`")
    lines.append("")
    rows = snap.get("resolution_rows") or []
    if rows:
        v = rows[0].get("value") or {}
        lines.append(f"Issuer resolutions decided at `{v.get('decided_at')}` (the latest reviewed_at among the "
                     f"rows read); the runner read them at `{v.get('read_at')}`. A row saved after decided_at "
                     f"wins over the fold.")
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
    if snap.get("held_family"):
        lines.append("## Held: folds into a family title (never folded)")
        lines.append("")
        for h in snap["held_family"]:
            lines.append(f"- `{h['old']}` ({h['kind']}) into `{h['target']}`: {h['why']}")
        lines.append("")
    lines.append("## Issuer of each folded title (kb/fold_issuer.py)")
    lines.append("")
    if not issuer_plan:
        lines.append("_No folds._")
    else:
        ilog = ((full_results or {}).get("credentials.json (merge fold)") or {}).get("issuer_log") or {}
        for target, g in issuer_plan.items():
            lines += fold_issuer.receipt_lines(g["resolution"], ilog.get(target), g["exceptions"])
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
    lines.append("`python3 kb/_cred_rename_undo.py <this folder>` puts back every value this apply "
                 "changed, renames and merges alike, from `undo.json` beside this receipt; it refuses a "
                 "value changed since, unless `--force`, which skips each drifted fold group whole. "
                 "`--supabase-plan` writes the kb_curation reversal from every `supabase_log*.json` "
                 "as guarded SQL for a person to run under Rule 10.")
    lines.append("")
    return "\n".join(lines) + "\n"


def main():
    alias_doc, renames, merges = load_alias_map()
    # A fold into a declared family title is never applied (Sam's ruling C), whatever the alias map says.
    renames, merges, held_family = fold_issuer.hold_family_folds(renames, merges, fold_issuer.family_titles(FAMILIES))
    # A saved fold on a title that holds no exhibit is never applied (#3110), read against the raws as they
    # stand now, so an alias map written before the nightly emptied a title does not fold it.
    renames, merges, held_emptied = fold_issuer.hold_emptied_folds(
        renames, merges, fold_issuer.titles_holding_exhibits(_load_optional(UNIFIED_TITLES)))
    for h in held_family + held_emptied:
        print(f"  {h['old']} into {h['target']}: {h['why']}")
    alias_doc = dict(alias_doc, renames=renames, merges=merges,
                     held_family=(alias_doc.get("held_family") or []) + held_family,
                     held_emptied=(alias_doc.get("held_emptied") or []) + held_emptied)
    if not renames and not merges:
        print("  nothing to apply once the family and emptied-title folds are held")
        return
    print(f"[cred_rename_apply] {TODAY} — applying {len(renames)} rename(s) "
          f"+ {len(merges)} confirmed merge(s)")
    with open(CREDENTIALS, encoding="utf-8") as f:
        creds_before = json.load(f)
    touched = sorted(set(renames) | set(renames.values()) | set(merges) | set(merges.values()))
    # The same ruled plans the dry run laid over the overlay (kb/ruled_renames.py), so a ruled fold's save time is the
    # ruling's and the preview and the apply decide the issuer on one set of rows.
    overlay, _ = ruled_renames.overlay(
        _load_optional(OVERLAY).get("overrides") or {}, ruled_renames.load(PLANS_DIR),
        fold_issuer.family_titles(FAMILIES), creds_before,
        fold_issuer.titles_holding_exhibits(_load_optional(UNIFIED_TITLES)))
    issuer_plan = fold_issuer.plan(renames, merges, overlay, creds_before,
                                   fold_issuer.path_tallies(_load_optional(RELATED)))
    # Every merge target must exist once the renames land, checked BEFORE any file is written: a
    # same-run lead with no credentials.json record creates no key, and finding that out after the
    # re-key left credentials.json half-applied and every later dispatch failing.
    after_keys = set(creds_before) | {n for o, n in renames.items() if o in creds_before}
    missing = sorted({t for o, t in merges.items() if o in creds_before and t not in after_keys})
    if missing:
        sys.exit(f"Merge-target drift: {missing[:3]} will not exist after the renames (a same-run lead "
                 f"with no credentials.json record?). Nothing written. Re-run the dry-run and resolve.")
    # The re-point's plan, before any file is written: a rename chain stops the apply here (kb/_cred_rename_repoint.py).
    combined_moves = dict(renames, **merges)
    rp_root = repoint.root_of(CREDENTIALS)
    try:
        repoint.check_no_chain(combined_moves)
    except repoint.RenameChain as e:
        sys.exit(f"{e}. Nothing written.")
    creds_res = rekey_credentials(renames)
    print(f"  credentials.json:        rekeyed={creds_res['rekeyed']}, "
          f"already_applied={creds_res['already_applied']}, "
          f"not_found={creds_res['not_found']}")
    results = {"credentials.json": creds_res}
    if merges:
        fold_res = fold_credentials(merges, issuer_plan)
        print(f"  credentials.json fold:   keys_folded={fold_res['keys_folded']}, "
              f"records_moved={fold_res['records_moved']}, "
              f"records_deduped={fold_res['records_deduped']}")
        results["credentials.json (merge fold)"] = fold_res
    # Renames and merges are both old→new value rewrites downstream — the V4
    # cardinality gate groups by TARGET so fan-in (several olds folding into
    # one confirmed-merge target) sums correctly.
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
    # The saved assignments and title-keyed files still on an old title (kb/_cred_rename_repoint.py): a bot's row moves
    # with the rename, a person's is held for a ruling and never changed. The files beside CREDENTIALS only.
    # Every APPLIED rename, earlier applies' included, each followed to the title live now, so this apply re-points
    # the machine values an earlier apply left too (each change names the apply it comes from, from_apply).
    with open(CREDENTIALS, encoding="utf-8") as f:
        live_keys = set(json.load(f))
    rp_moves, rp_origin = repoint.history_moves(OUT_ROOT, combined, live_keys)
    rp_changes, rp_held = repoint.plan(rp_moves, rp_root, rp_origin)
    repoint.apply_changes(rp_changes, rp_root)
    print(f"  saved assignments:       re-pointed={len(rp_changes)}, held (a person's row)={len(rp_held)}")
    for h in rp_held:
        print(f"  HELD {h['file']} {h['key']}: {h['why']}")
    results["saved assignments (re-point)"] = {"re_pointed": len(rp_changes), "held_person_rows": len(rp_held)}
    with open(CREDENTIALS, encoding="utf-8") as f:
        creds_after = json.load(f)
    if (creds_after == creds_before and not ut_res["_changed"] and not art_res["_changed"]
            and not [c for c in rp_changes if not c.get("via")]):
        # A row move a planned re-point still waits on re-runs through the repoint_only input, from its receipt.
        # A re-dispatch after a failed Supabase step finds everything applied. A new <date>-N snapshot
        # would shadow the first run's, whose renames and issuer carry the Supabase retry must replay.
        print("  nothing changed (already applied): no new receipt; the newest snapshot stays the "
              "Supabase step's input")
        return
    groups = defaultdict(list)
    for o, n in combined.items():
        groups[n].append(o)
    undo = {
        # Each fold group (a target and every title renamed or merged onto it) undoes as one unit.
        "groups": {n: sorted(os_) for n, os_ in sorted(groups.items())},
        "_about": "Every value kb/_cred_rename_apply.py changed in this apply, before and after. "
                  "kb/_cred_rename_undo.py reverses it. A key absent before (a rename's new title) or "
                  "after (a folded or renamed-away title) is null.",
        "_applied_at": NOW_ISO,
        "credentials": {k: {"before": creds_before.get(k), "after": creds_after.get(k)} for k in touched},
        "unified_titles": ut_res["_changed"],
        "articulations": art_res["_changed"],
    }
    for t, g in issuer_plan.items():
        for e in g["exceptions"]:
            print(f"  EXCEPTION (for a person, does not block): {t}: {e['ic_exhibits']} industry-"
                  f"certification exhibit(s), issuer set to {e['issuer']}")
        if g["resolution"].get("conflict"):
            c = g["resolution"]["conflict"]
            print(f"  issuer conflict: {t}: target override {c['target_override_before']['issuer']} "
                  f"becomes {c['winner']}")
    out_dir = _out_dir()
    fold_id = "%s@%s" % (os.path.basename(out_dir), NOW_ISO)
    # decided_at: the latest reviewed_at among the rows this apply read (COBIx's guard): one stamp source,
    # the rows' own, so a runner's clock never decides against a person's stamp. The runner's read time is
    # kept beside it (read_at) for the receipt. The durable fix is a server-set stamp (a schema change for
    # the Governance queue; docs/reference/canonical_credential_model.md).
    ovdoc = _load_optional(OVERLAY)
    read_at = ovdoc.get("_read_at") or ovdoc.get("_synced_at") or NOW_ISO
    decided_at = ovdoc.get("_max_reviewed_at") or read_at
    # The resolutions already in force on each group's titles: this apply's row replaces the target's, and
    # a merged title's is deleted with its rows, so their decisions carry forward (fold_issuer.resolution_value).
    applied, undone = fold_issuer.applied_fold_ids(OUT_ROOT), fold_issuer.undone_fold_ids(OUT_ROOT)
    resolution_rows = []
    for t, g in sorted(issuer_plan.items()):
        titles = [t] + [m for m, _ in g["members"]]
        before = [r for x in titles for r in creds_before.get(x) or []]
        priors = [p for x in titles
                  for p in [fold_issuer.parse_resolution((overlay.get(x) or {}).get(fold_issuer.RESOLUTION_FIELD))]
                  if fold_issuer.in_force(p, x, applied, undone)]
        value = fold_issuer.resolution_value(g, before, creds_after.get(t) or [], decided_at, fold_id,
                                             priors, [overlay.get(x) for x in titles if overlay.get(x)])
        value["read_at"] = read_at
        resolution_rows.append({"course_id": "_CREDENTIAL_REVIEW::" + t, "field": fold_issuer.RESOLUTION_FIELD,
                                "value": value, "reviewer_email": fold_issuer.COHORT})
    undo["fold_id"] = fold_id
    out_dir = write_snapshot(alias_doc, results, undo, issuer_plan, out_dir, resolution_rows)
    # repoint.json: the planned re-points (the undo's input), each filed from a fresh read of its file.
    _, rp_filed = repoint.write_receipt(out_dir, rp_moves, rp_changes, rp_held, rp_root)
    print(f"  receipt: {out_dir}/{{alias_map.json, undo.json, validation.md, repoint.json}}")
    if os.environ.get("GITHUB_OUTPUT"):  # the workflow's failure step rolls back this receipt's rows
        with open(os.environ["GITHUB_OUTPUT"], "a", encoding="utf-8") as f:
            f.write("receipt=%s\n" % os.path.relpath(out_dir, os.path.dirname(HERE)))
    bad = repoint.not_landed(rp_filed)
    if bad:
        # The receipt is on disk and named in GITHUB_OUTPUT, so the workflow's failure step commits it alone.
        sys.exit("A planned re-point did not land: " + "; ".join("%s %s (%s)" % (c["file"], c["key"], c["filed"])
                                                                for c in bad[:5]))
    return out_dir


def _load_optional(path):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f) or {}
    except (OSError, ValueError):
        return {}


if __name__ == "__main__":
    main()
