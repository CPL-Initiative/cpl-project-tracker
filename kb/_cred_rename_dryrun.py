"""
Cred-Ref PR-5b/0 — Credential-title rename dry-run.

MEASUREMENT ONLY. Reads `kb/credential_review_overlay.json` (synced from
Supabase by `kb/_apply_credential_review.py`), projects every
`unified_title_override` onto post-rename state, and writes reviewable
artifacts under `kb/cred_rename_dryrun/`:

  report.md        — human-readable summary + per-rename impact + collision
                     warnings + V1/V2/V3 validation checklist results.
  alias_map.json   — old unified_title → new unified_title (only clean
                     non-colliding renames; collisions live in collisions.json).
  collisions.json  — rename targets that collide with an existing credential
                     key (curator must pick a non-colliding target or
                     explicitly confirm a merge via the deferred PR-5b/2 UX).

Re-runnable. Daily cron runs this as a report-only step so the queue stays
visible (and the artifact gets committed daily). Apply is a separate
manual `workflow_dispatch` event (Cred-Ref PR-5b/1).

Architectural invariant (see docs/kb-notes/adr-supersede-dont-mutate-synthetic-layer.md):
the rename only touches the SYNTHETIC unified layer. Raw college-authored
titles in `kb/unified_titles.json` dict KEYS are immutable and stay
untouched; only the `unified_title` VALUE on each raw-title entry is
rewritten in the projected state.

Run from repo root:  python3 kb/_cred_rename_dryrun.py
"""
from __future__ import annotations

import json
import os
from collections import defaultdict
from datetime import date, datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
OVERLAY = os.path.join(HERE, "credential_review_overlay.json")
UNIFIED_TITLES = os.path.join(HERE, "unified_titles.json")
CREDENTIALS = os.path.join(HERE, "credentials.json")
ARTICULATIONS = os.path.join(HERE, "coci_articulations.json")
OUT_DIR = os.path.join(HERE, "cred_rename_dryrun")

TODAY = date.today().isoformat()
NOW_ISO = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _load(path, default):
    """Load JSON; gracefully return the default if file is missing."""
    if not os.path.isfile(path):
        return default
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def main():
    overlay = _load(OVERLAY, {"overrides": {}})
    overrides = (overlay.get("overrides") or {})
    unified_titles = _load(UNIFIED_TITLES, {})
    credentials = _load(CREDENTIALS, {})
    art_doc = _load(ARTICULATIONS, {"articulations": []})
    articulations = (art_doc.get("articulations") or [])

    # ── Build raw_title-by-unified and articulation-by-unified indexes ────────
    # Forward joins: who points at each unified_title? (Drives the per-rename
    # impact counts in the report.)
    raw_titles_by_ut = defaultdict(list)
    for raw_title, rec in unified_titles.items():
        ut = (rec or {}).get("unified_title")
        if ut:
            raw_titles_by_ut[ut].append(raw_title)

    art_records_by_ut = defaultdict(int)
    for r in articulations:
        ut = r.get("unified_title")
        if ut:
            art_records_by_ut[ut] += 1

    # ── Walk overrides and classify each rename ───────────────────────────────
    # Three outcomes per override:
    #   * skipped     — no override value, no-op (override cleared), or
    #                   override equals the original (curator entered the
    #                   same name — display change but no rename)
    #   * collision   — new name already exists as a key in credentials.json
    #                   (apply would clobber; reject + decision queue)
    #   * clean       — safe rename; goes into alias_map
    renames_clean = {}        # old_ut -> new_ut
    collisions = []           # list of dicts with the collision detail
    skipped = []              # list of dicts with skip reason
    no_credential_record = [] # rename of a unified_title with no credentials.json entry

    for old_ut, ov in sorted(overrides.items()):
        new_ut = (ov or {}).get("unified_title_override")
        if not new_ut:
            continue  # only iterating renames; non-rename overrides are PR-5a's job
        if new_ut == old_ut:
            skipped.append({
                "old_unified_title": old_ut,
                "reason": "override_equals_original",
                "reviewed_by": ov.get("reviewed_by"),
                "reviewed_at": ov.get("reviewed_at"),
            })
            continue
        # V2-precursor: warn if the source unified_title isn't in credentials.json.
        # The rename would still re-key unified_titles.json + coci_articulations.json,
        # but credentials.json has no record to migrate. Surface it; don't block.
        if old_ut not in credentials:
            no_credential_record.append(old_ut)
        if new_ut in credentials:
            collisions.append({
                "old_unified_title": old_ut,
                "proposed_new_title": new_ut,
                "reason": "collision_with_existing_credential",
                "existing_credential_records": len(credentials.get(new_ut) or []),
                "rename_would_touch": {
                    "raw_titles_in_unified_titles_json": len(raw_titles_by_ut.get(old_ut, [])),
                    "articulation_records": art_records_by_ut.get(old_ut, 0),
                    "credentials_json_key_exists": old_ut in credentials,
                },
                "reviewed_by": ov.get("reviewed_by"),
                "reviewed_at": ov.get("reviewed_at"),
                "policy": "reject_pending_curator_decision",
            })
            continue
        renames_clean[old_ut] = new_ut

    # ── V1/V2/V3 validation gates ─────────────────────────────────────────────
    # V1 — every clean rename target is unique among the proposed set (two
    #      curators can't both rename to "Foo" in one batch).
    target_counts = defaultdict(list)
    for old_ut, new_ut in renames_clean.items():
        target_counts[new_ut].append(old_ut)
    intra_batch_collisions = [
        {"proposed_new_title": k, "would_be_renamed_from": v}
        for k, v in target_counts.items() if len(v) >= 2
    ]
    v1_pass = len(intra_batch_collisions) == 0

    # V2 — every old name resolves to either credentials.json OR unified_titles.json
    #      (so the rename has SOMETHING to re-key; renaming a ghost ut is a no-op
    #      and probably a curator mistake — block).
    v2_blocked = []
    for old_ut in renames_clean.keys():
        if old_ut not in credentials and old_ut not in raw_titles_by_ut:
            v2_blocked.append(old_ut)
    v2_pass = len(v2_blocked) == 0

    # V3 — every clean rename target is collision-free against credentials.json
    #      (already enforced above; verify defensively).
    v3_blocked = [k for k in renames_clean.values() if k in credentials]
    v3_pass = len(v3_blocked) == 0

    apply_safe = bool(v1_pass and v2_pass and v3_pass and not collisions and renames_clean)

    # ── Write artifacts ───────────────────────────────────────────────────────
    if not os.path.isdir(OUT_DIR):
        os.makedirs(OUT_DIR)

    alias_map_payload = {
        "_about": (
            "Credential title rename alias map (DRY-RUN — not yet applied). "
            "old_unified_title -> new_unified_title. Generated by "
            "kb/_cred_rename_dryrun.py from kb/credential_review_overlay.json. "
            "Apply via kb/_cred_rename_apply.py (Cred-Ref PR-5b/1, manual "
            "workflow_dispatch only)."
        ),
        "_generated_at": NOW_ISO,
        "summary": {
            "total_overrides_in_overlay": sum(
                1 for v in overrides.values() if (v or {}).get("unified_title_override")),
            "clean_renames": len(renames_clean),
            "collisions": len(collisions),
            "skipped": len(skipped),
            "renames_of_titles_with_no_credentials_record": len(no_credential_record),
            "apply_safe": apply_safe,
            "v1_intra_batch_collisions_pass": v1_pass,
            "v2_source_exists_pass": v2_pass,
            "v3_target_collision_free_pass": v3_pass,
        },
        "renames": renames_clean,
    }
    with open(os.path.join(OUT_DIR, "alias_map.json"), "w", encoding="utf-8") as f:
        json.dump(alias_map_payload, f, indent=2, ensure_ascii=False)
        f.write("\n")

    collisions_payload = {
        "_about": (
            "Credential rename collisions detected by the dry-run. Each entry "
            "is a proposed rename whose target already exists as a key in "
            "credentials.json. Policy: reject + decision queue — curator picks "
            "a non-colliding target, or explicitly confirms a merge via the "
            "deferred PR-5b/2 UX. NEVER auto-merged; NEVER auto-disambiguated."
        ),
        "_generated_at": NOW_ISO,
        "count": len(collisions),
        "collisions": collisions,
    }
    with open(os.path.join(OUT_DIR, "collisions.json"), "w", encoding="utf-8") as f:
        json.dump(collisions_payload, f, indent=2, ensure_ascii=False)
        f.write("\n")

    md = _render_md(renames_clean, collisions, skipped, no_credential_record,
                    intra_batch_collisions, v2_blocked,
                    raw_titles_by_ut, art_records_by_ut, credentials,
                    apply_safe)
    with open(os.path.join(OUT_DIR, "report.md"), "w", encoding="utf-8") as f:
        f.write(md)

    # ── Console summary ───────────────────────────────────────────────────────
    print(f"[cred_rename_dryrun] {TODAY}")
    print(f"  overrides in overlay:    {sum(1 for v in overrides.values() if (v or {}).get('unified_title_override'))}")
    print(f"  clean renames:           {len(renames_clean)}")
    print(f"  collisions:              {len(collisions)}")
    print(f"  skipped (no-op):         {len(skipped)}")
    print(f"  V1 (intra-batch):        {'PASS' if v1_pass else f'FAIL ({len(intra_batch_collisions)})'}")
    print(f"  V2 (source exists):      {'PASS' if v2_pass else f'FAIL ({len(v2_blocked)})'}")
    print(f"  V3 (target collision):   {'PASS' if v3_pass else f'FAIL ({len(v3_blocked)})'}")
    print(f"  apply-safe:              {apply_safe}")
    print(f"  wrote: {OUT_DIR}/{{report.md, alias_map.json, collisions.json}}")


def _render_md(renames_clean, collisions, skipped, no_credential_record,
               intra_batch_collisions, v2_blocked,
               raw_titles_by_ut, art_records_by_ut, credentials,
               apply_safe):
    lines = []
    lines.append(f"# Credential Rename Dry-Run — {TODAY}")
    lines.append("")
    lines.append(f"Generated: `{NOW_ISO}`")
    lines.append("")
    lines.append("**Mode B preview** — projects `unified_title_override` curator entries from "
                 "`kb/credential_review_overlay.json` onto the post-rename state of the three "
                 "credential-identity files (`unified_titles.json`, `credentials.json`, "
                 "`coci_articulations.json`). Reports collisions + downstream impact. "
                 "**Does NOT apply.** Apply is Cred-Ref PR-5b/1, manual workflow_dispatch.")
    lines.append("")
    lines.append("## Apply gates")
    lines.append("")
    lines.append("| Gate | Description | Status |")
    lines.append("|---|---|---|")
    lines.append(f"| V1 | No two renames target the same new name | "
                 f"{'PASS ✓' if not intra_batch_collisions else f'FAIL ({len(intra_batch_collisions)}) ✗'} |")
    lines.append(f"| V2 | Every source unified_title exists somewhere | "
                 f"{'PASS ✓' if not v2_blocked else f'FAIL ({len(v2_blocked)}) ✗'} |")
    lines.append(f"| V3 | No target collides with existing credentials.json key | "
                 f"{'PASS ✓' if not collisions else f'FAIL ({len(collisions)}) ✗'} |")
    lines.append(f"| **Apply safe** | All gates pass + at least one clean rename | "
                 f"{'**YES — PR-5b/1 can dispatch**' if apply_safe else '**NO**'} |")
    lines.append("")
    lines.append("## Clean renames (would land on apply)")
    lines.append("")
    if not renames_clean:
        lines.append("_None today._ Infrastructure populates the moment a curator enters a rename.")
    else:
        lines.append("| Old unified_title | → | New unified_title | raw_titles | articulations | credentials.json |")
        lines.append("|---|---|---|---:|---:|---|")
        for old_ut, new_ut in sorted(renames_clean.items()):
            n_raw = len(raw_titles_by_ut.get(old_ut, []))
            n_art = art_records_by_ut.get(old_ut, 0)
            has_cr = "✓" if old_ut in credentials else "—"
            lines.append(f"| `{old_ut}` | → | `{new_ut}` | {n_raw} | {n_art} | {has_cr} |")
    lines.append("")
    lines.append("## Collisions (rejected — curator decision required)")
    lines.append("")
    if not collisions:
        lines.append("_None._")
    else:
        lines.append("Each row's proposed new title already exists as a key in `credentials.json`. "
                     "Policy: reject + decision queue (PR-5b/2 deferred until a curator hits one).")
        lines.append("")
        lines.append("| Old | → | New (collides) | Existing records on target |")
        lines.append("|---|---|---|---:|")
        for c in collisions:
            lines.append(f"| `{c['old_unified_title']}` | → | `{c['proposed_new_title']}` "
                         f"| {c['existing_credential_records']} |")
    lines.append("")
    lines.append("## Skipped")
    lines.append("")
    if not skipped:
        lines.append("_None._")
    else:
        lines.append("| unified_title | reason |")
        lines.append("|---|---|")
        for s in skipped:
            lines.append(f"| `{s['old_unified_title']}` | {s['reason']} |")
    lines.append("")
    if no_credential_record:
        lines.append("## Warning — renames of unified_titles with no `credentials.json` record")
        lines.append("")
        lines.append("These renames would re-key `unified_titles.json` + `coci_articulations.json` "
                     "but find no record to migrate in `credentials.json`. Likely a curator "
                     "mistake (renaming a ghost unified_title), but not blocking — surface for review.")
        lines.append("")
        for ut in sorted(no_credential_record):
            lines.append(f"- `{ut}`")
        lines.append("")
    if intra_batch_collisions:
        lines.append("## Intra-batch collisions (V1)")
        lines.append("")
        lines.append("Two or more renames in the current batch target the same new name. "
                     "V1 fails until the curator resolves which source wins.")
        lines.append("")
        for ic in intra_batch_collisions:
            sources = ", ".join(f"`{s}`" for s in ic["would_be_renamed_from"])
            lines.append(f"- `{ic['proposed_new_title']}` ← {sources}")
        lines.append("")
    if v2_blocked:
        lines.append("## V2 blocked — source unified_title not found")
        lines.append("")
        lines.append("These overrides target a unified_title that exists in neither "
                     "`credentials.json` nor `unified_titles.json`. Probably a stale Supabase row.")
        lines.append("")
        for ut in sorted(v2_blocked):
            lines.append(f"- `{ut}`")
        lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("**See also:**")
    lines.append("")
    lines.append("- `docs/exhibit_canonicalization_lessons.md` — Cred-Ref PR-5b scoping notes")
    lines.append("- `docs/kb-notes/adr-supersede-dont-mutate-synthetic-layer.md` — why raw "
                 "college-authored titles stay immutable when the synthetic layer renames")
    lines.append("- `docs/coursecontrolnumber_remint.md` — the re-mint playbook this dry-run "
                 "follows the discipline of")
    return "\n".join(lines) + "\n"


if __name__ == "__main__":
    main()
