"""
Phase 1e SUBJ4-canonicalization APPLY step (Session 5c).

Consumes kb/subj4_dryrun/alias_map.json (produced by kb/_subj4_dryrun.py) and
re-keys, in place:

  * kb/coci_minted_courses.json     — minted M-ID catalog
  * kb/coci_minted_singletons.json  — single-college M-IDs
  * kb/coci_minted_memberships.json — M-ID → member courses join
  * kb/coci_articulations.json      — earned articulations resolved to identity
  * kb/coci_unified_courses.json    — variant-unified clusters (members[] refs)
  * kb/coci_curation.json           — curation overlay (keys themselves)

Writes audit artifacts to kb/subj4_apply/:

  * report.md       — human-readable summary + per-file counts
  * alias_map.json  — frozen copy of the alias map used for this apply (for rollback)
  * validation.md   — pre/post counts per file (the apply receipt)

DOES NOT touch Supabase. Supabase row updates are done by the apply workflow
(phase-1e-apply.yml) AFTER this script's git mutations land, so the two writes
sequence safely (kb in commit, Supabase in same cron window).

Safety:
  * Reads alias_map.json — refuses to run if it's missing or unparseable.
  * Verifies each old_id resolves to exactly one new_id (no fan-out).
  * Tracks every mutation; on any unexpected state (e.g. a singletons entry
    whose new_id isn't a valid M-ID shape) raises rather than silently
    corrupts.
  * Idempotent enough: re-running on already-applied state mutates nothing
    (every alias' old_id is gone from the files; the apply log captures
    "0 records re-keyed" and exits clean).

Run from repo root:  python3 kb/_subj4_apply.py
"""
from __future__ import annotations

import json
import os
import re
import sys
from collections import Counter
from datetime import date, datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
DRYRUN_OUT = os.path.join(HERE, "subj4_dryrun")
ALIAS_PATH = os.path.join(DRYRUN_OUT, "alias_map.json")
OUT_DIR = os.path.join(HERE, "subj4_apply")

COURSES = os.path.join(HERE, "coci_minted_courses.json")
SINGLETONS = os.path.join(HERE, "coci_minted_singletons.json")
MEMBERSHIPS = os.path.join(HERE, "coci_minted_memberships.json")
ARTICULATIONS = os.path.join(HERE, "coci_articulations.json")
UNIFIED_COURSES = os.path.join(HERE, "coci_unified_courses.json")
CURATION = os.path.join(HERE, "coci_curation.json")

NEW_ID_RE = re.compile(r"^[A-Z]{4} M\d[A-Z0-9]{3}$")


def load_alias_map():
    if not os.path.exists(ALIAS_PATH):
        sys.exit(f"Missing {ALIAS_PATH} — run kb/_subj4_dryrun.py first.")
    with open(ALIAS_PATH, encoding="utf-8") as f:
        doc = json.load(f)
    aliases = doc.get("aliases") or {}
    if not aliases:
        sys.exit(f"{ALIAS_PATH} has no aliases — nothing to apply.")

    # Sanity: every record has a new_id of the right shape (or is a no_change
    # — same old/new — which we still treat as canonical for downstream re-keys).
    bad = []
    for old, rec in aliases.items():
        new = rec.get("new_id")
        if not new or not NEW_ID_RE.match(new):
            bad.append((old, new))
    if bad:
        sys.exit(f"alias_map has {len(bad)} malformed new_ids (showing 5): {bad[:5]}")

    return doc, aliases


def _atomic_write_json(path, obj):
    """Write JSON to a temp sibling and rename, so a crash mid-write can't
    leave a half-written kb file on disk. Indented, UTF-8, with terminating
    newline — same convention as the rest of the kb/."""
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2, ensure_ascii=False)
        f.write("\n")
    os.replace(tmp, path)


def remap_minted_or_singletons(path: str, aliases: dict, expected_source: str):
    """Re-key minted/singleton catalog entries. Mutates each row's
    course_id + subject_4letter and stamps a _subj4_remint_from audit
    field. Returns counts.

    Aborts on key collision: if a row's new_id would land on a key already
    in use by an untouched (passed-through) row, the apply would silently
    overwrite it. The dry-run's V4 validation should have caught this; this
    is a defensive belt-and-suspenders.
    """
    with open(path, encoding="utf-8") as f:
        blob = json.load(f)
    courses = blob.get("courses") or {}
    rekeyed = 0
    nochange = 0
    not_in_alias = 0
    new_courses = {}
    collisions = []
    # First pass: place untouched rows (they keep their old_id).
    for old_id, rec in courses.items():
        a = aliases.get(old_id)
        if a is None:
            new_courses[old_id] = rec
            not_in_alias += 1
    # Second pass: place re-keyed rows, asserting no clobber.
    for old_id, rec in courses.items():
        a = aliases.get(old_id)
        if a is None:
            continue
        if a.get("source") != expected_source:
            sys.exit(f"alias source mismatch: {old_id} expected {expected_source!r} "
                     f"got {a.get('source')!r}")
        new_id = a["new_id"]
        new_subj4 = a["new_subj4"]
        if new_id == old_id:
            nochange += 1
            new_courses[old_id] = rec
            continue
        if new_id in new_courses:
            # Would clobber an untouched row OR a previously-placed re-key.
            # Either case is a fatal apply error — the dry-run's V4 gate
            # (new_id_disjoint_from_untouched) should have prevented this.
            collisions.append((old_id, new_id))
            continue
        rec = dict(rec)
        rec["course_id"] = new_id
        rec["subject_4letter"] = new_subj4
        rec.setdefault("_subj4_remint_from", old_id)
        new_courses[new_id] = rec
        rekeyed += 1
    if collisions:
        sys.exit(f"FATAL: {len(collisions)} key collisions during apply on {path}. "
                 f"Sample: {collisions[:5]}. Re-run the dry-run; V4 gate should fail.")
    blob["courses"] = new_courses
    blob["_subj4_remint_applied_at"] = NOW_ISO
    _atomic_write_json(path, blob)
    return {"rekeyed": rekeyed, "no_change": nochange, "untouched": not_in_alias}


def remap_memberships(path: str, aliases: dict):
    """Re-key the membership map's keys. Member-course payloads are unchanged."""
    with open(path, encoding="utf-8") as f:
        blob = json.load(f)
    memberships = blob.get("memberships") or {}
    rekeyed = 0
    nochange = 0
    untouched = 0
    new_memberships = {}
    for old_id, members in memberships.items():
        a = aliases.get(old_id)
        if a is None:
            new_memberships[old_id] = members
            untouched += 1
            continue
        new_id = a["new_id"]
        if new_id == old_id:
            nochange += 1
            new_memberships[old_id] = members
            continue
        new_memberships[new_id] = members
        rekeyed += 1
    blob["memberships"] = new_memberships
    blob["_subj4_remint_applied_at"] = NOW_ISO
    _atomic_write_json(path, blob)
    return {"rekeyed": rekeyed, "no_change": nochange, "untouched": untouched}


def remap_articulations(path: str, aliases: dict):
    """Re-key the course_id field on every articulation record."""
    with open(path, encoding="utf-8") as f:
        blob = json.load(f)
    arts = blob.get("articulations") or []
    rekeyed = 0
    nochange = 0
    untouched = 0
    for r in arts:
        old = r.get("course_id")
        if not old:
            continue
        a = aliases.get(old)
        if a is None:
            untouched += 1
            continue
        new = a["new_id"]
        if new == old:
            nochange += 1
            continue
        r["course_id"] = new
        rekeyed += 1
    blob["_subj4_remint_applied_at"] = NOW_ISO
    _atomic_write_json(path, blob)
    return {"rekeyed": rekeyed, "no_change": nochange, "untouched": untouched}


def remap_unified_clusters(path: str, aliases: dict):
    """Re-key M-IDs inside clusters[].members[]. A cluster's `members` is a
    list of M-ID/cluster strings — only the M-ID-shaped ones map through."""
    with open(path, encoding="utf-8") as f:
        blob = json.load(f)
    clusters = blob.get("clusters") or {}
    members_rekeyed = 0
    clusters_touched = 0
    for cid, c in clusters.items():
        members = c.get("members") or []
        new_members = []
        touched = False
        for m in members:
            a = aliases.get(m)
            if a and a["new_id"] != m:
                new_members.append(a["new_id"])
                members_rekeyed += 1
                touched = True
            else:
                new_members.append(m)
        c["members"] = new_members
        if touched:
            clusters_touched += 1
    blob["_subj4_remint_applied_at"] = NOW_ISO
    _atomic_write_json(path, blob)
    return {"member_refs_rekeyed": members_rekeyed, "clusters_touched": clusters_touched}


def remap_curation_overlay(path: str, aliases: dict):
    """Re-key keys in kb/coci_curation.json. Values are unchanged
    (merge_into pointers happen to point at UC-CUR-* cluster ids, not M-IDs,
    so they don't need re-keying for this re-mint; we DO verify that
    invariant before writing)."""
    with open(path, encoding="utf-8") as f:
        blob = json.load(f)
    curations = blob.get("curations") or {}
    rekeyed = 0
    nochange = 0
    untouched = 0
    new_cur = {}
    suspicious_pointers = []
    for old_key, rec in curations.items():
        a = aliases.get(old_key)
        # Verify merge_into pointer — if it points at a key in alias_map,
        # we'd need to update it; we don't expect that today but check.
        mi = (rec or {}).get("merge_into")
        if mi and mi in aliases and aliases[mi]["new_id"] != mi:
            suspicious_pointers.append((old_key, "merge_into", mi, aliases[mi]["new_id"]))
        if a is None:
            new_cur[old_key] = rec
            untouched += 1
            continue
        new_id = a["new_id"]
        if new_id == old_key:
            nochange += 1
            new_cur[old_key] = rec
            continue
        new_cur[new_id] = rec
        rekeyed += 1
    blob["curations"] = new_cur
    blob["_subj4_remint_applied_at"] = NOW_ISO
    _atomic_write_json(path, blob)
    return {
        "rekeyed": rekeyed, "no_change": nochange, "untouched": untouched,
        "suspicious_pointers": suspicious_pointers,
    }


def main():
    global NOW_ISO
    NOW_ISO = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    today = date.today().isoformat()

    doc, aliases = load_alias_map()
    print(f"[subj4_apply] {today}")
    print(f"  alias_map source: {doc.get('_generated_at')!r}  (count: {len(aliases)})")

    # Apply each file.
    print()
    print("  applying mutations...")
    counts = {}
    counts["coci_minted_courses"] = remap_minted_or_singletons(COURSES, aliases, "minted")
    print(f"    coci_minted_courses.json    {counts['coci_minted_courses']}")
    counts["coci_minted_singletons"] = remap_minted_or_singletons(SINGLETONS, aliases, "singleton")
    print(f"    coci_minted_singletons.json {counts['coci_minted_singletons']}")
    counts["coci_minted_memberships"] = remap_memberships(MEMBERSHIPS, aliases)
    print(f"    coci_minted_memberships.json {counts['coci_minted_memberships']}")
    counts["coci_articulations"] = remap_articulations(ARTICULATIONS, aliases)
    print(f"    coci_articulations.json      {counts['coci_articulations']}")
    counts["coci_unified_courses"] = remap_unified_clusters(UNIFIED_COURSES, aliases)
    print(f"    coci_unified_courses.json    {counts['coci_unified_courses']}")
    counts["coci_curation"] = remap_curation_overlay(CURATION, aliases)
    print(f"    coci_curation.json           {counts['coci_curation']}")

    # Write apply receipt.
    os.makedirs(OUT_DIR, exist_ok=True)
    # Freeze a copy of the alias map alongside the apply log — rollback consumer.
    _atomic_write_json(os.path.join(OUT_DIR, "alias_map.json"), doc)

    # Write validation summary.
    val_md = _render_validation_md(today, doc, counts)
    with open(os.path.join(OUT_DIR, "validation.md"), "w", encoding="utf-8") as f:
        f.write(val_md)

    # Write the apply report.
    rpt_md = _render_apply_md(today, doc, counts)
    with open(os.path.join(OUT_DIR, "report.md"), "w", encoding="utf-8") as f:
        f.write(rpt_md)

    print()
    print(f"  artifacts: {OUT_DIR}/{{report.md, validation.md, alias_map.json}}")
    print("  apply complete — kb files mutated, ready for downstream Supabase update + verification.")


def _render_validation_md(today, doc, counts):
    lines = [
        "# SUBJ4 Canonicalization — APPLY validation receipt",
        "",
        f"- generated: `{NOW_ISO}`",
        f"- alias_map sourced from: `kb/subj4_dryrun/alias_map.json` (run: {doc.get('_generated_at')})",
        f"- aliases applied: **{doc.get('count')}**",
        "",
        "## Per-file mutation counts",
        "",
        "| file | rekeyed | no_change | untouched |",
        "|---|---:|---:|---:|",
    ]
    for f, c in counts.items():
        if f == "coci_unified_courses":
            lines.append(f"| `kb/{f}.json` | {c['member_refs_rekeyed']} (refs) | — | {c['clusters_touched']} clusters touched |")
        else:
            lines.append(f"| `kb/{f}.json` | {c.get('rekeyed', 0)} | {c.get('no_change', 0)} | {c.get('untouched', 0)} |")
    sus = counts["coci_curation"].get("suspicious_pointers") or []
    if sus:
        lines += ["", "## ⚠ Suspicious curation pointers (operator review)", ""]
        for s in sus:
            lines.append(f"- `{s[0]}` field `{s[1]}` points at `{s[2]}` → re-key target `{s[3]}`")
    else:
        lines += ["", "✓ No suspicious curation pointers (merge_into values all clean)."]
    lines.append("")
    return "\n".join(lines)


def _render_apply_md(today, doc, counts):
    lines = [
        "---",
        "title: SUBJ4 Canonicalization Apply — Phase 1e",
        f"date: {today}",
        "session: 5c (Bruh Quad)",
        "status: APPLIED — kb files mutated in place",
        "tags: [remint, phase-1e, subj4-canonicalization, apply, m-id]",
        "artifacts:",
        "  - kb/subj4_apply/alias_map.json",
        "  - kb/subj4_apply/validation.md",
        "  - kb/subj4_dryrun/alias_map.json (source of truth pre-apply)",
        "---",
        "",
        "# SUBJ4 Canonicalization Apply — Phase 1e",
        "",
        "## TL;DR",
        "",
        f"- **{doc.get('count')}** aliases applied across 6 kb files.",
        f"- Apply timestamp: `{NOW_ISO}`",
        f"- Source alias_map: dry-run dated `{doc.get('_generated_at')}`.",
        "",
        "## Per-file mutation counts",
        "",
        "See `kb/subj4_apply/validation.md` for the per-file table.",
        "",
        "## Downstream verification (handled by the apply workflow)",
        "",
        "1. **Re-run dry-run** (`kb/_subj4_dryrun.py`) on the mutated state. Expected:",
        "   - 0 `re_key` fates remaining (everything's now on canonical)",
        "   - 100% `no_change` for all M-IDs with a discipline",
        "   - 0 `subject_collision_signal` flags (post-apply receipt)",
        "2. **Re-run auditor** (`kb/_row_audit.py`). Expected:",
        "   - `subject_collision_signal` rule fires **zero** times",
        "   - `mid_id_off_scheme` rule fires zero times (4-letter invariant clean)",
        "3. **Apply Supabase live updates** — workflow loops through `aliases`,",
        "   issuing `UPDATE kb_curation SET course_id = new_id WHERE course_id = old_id`",
        "   for each. Best-effort per record with verbose logging — a single",
        "   transient failure shouldn't strand the apply (operator can re-run",
        "   the Supabase sweep from the alias map).",
        "",
        "## Rollback (if needed)",
        "",
        "Inverse alias map = `kb/subj4_apply/alias_map.json` read right-to-left",
        "(new_id → old_id). Same rollback discipline as the 2026-05-22 re-mint:",
        "",
        "1. `git revert` the apply commit on `main`.",
        "2. Supabase: re-loop, swapping the UPDATE direction.",
        "3. Stay inside one 10:17 UTC cron window — daily-dashboard.yml's",
        "   simplified workflow doesn't touch the kb files, but its concurrency",
        "   group serializes against the apply workflow.",
        "",
    ]
    return "\n".join(lines)


if __name__ == "__main__":
    main()
