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
                     key. NON-BLOCKING decision queue (Session 107): a queued
                     collision waits for the curator to pick a non-colliding
                     target or explicitly confirm a merge; the CLEAN renames
                     apply regardless. (Blanket-holding the whole batch on any
                     collision stranded 49 recorded renames behind Sam's 6
                     deliberate merge-shaped retitles on 2026-07-08.)

PR-5b/2 (Session 107) — curator-confirmed MERGES: when the CER triage lane's
✓ Confirm merge writes a `unified_title_merge_confirm` row naming the exact
colliding target, the collision graduates into the alias map's `merges`
section and the apply FOLDS the old title's credential records into the
existing key (dedupe on issuer+trainer; raws + articulations re-keyed like a
rename). A confirm naming a DIFFERENT target than the current override is
stale and stays queued; a merge whose target is itself retitled in the same
batch stays queued (chain hazard). NEVER inferred, never auto-merged.

One pass (#3110 build step 1, 2026-11-11): when several sources retitle to the same NEW name, the
source with no merge confirm leads (a plain rename that creates the title) and every source whose
`unified_title_merge_confirm` names that new title folds into it in the same apply. Only an
unconfirmed sibling still waits as `intra_batch_same_target`. `issuer_preview` in the alias map shows
each fold group's issuer under kb/fold_issuer.py's rules.

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
import sys
from datetime import date, datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _cred_rename_repoint as repoint  # noqa: E402
import fold_issuer  # noqa: E402
import ruled_renames  # noqa: E402

OVERLAY = os.path.join(HERE, "credential_review_overlay.json")
PLANS_DIR = ruled_renames.PLANS_DIR
RELATED = os.path.join(HERE, "exhibits_related.json")
FAMILIES = os.path.join(HERE, "reference", "credential_families.json")  # owned by the family-tag converter
UNIFIED_TITLES = os.path.join(HERE, "unified_titles.json")
CREDENTIALS = os.path.join(HERE, "credentials.json")
ARTICULATIONS = os.path.join(HERE, "coci_articulations.json")
OUT_DIR = os.path.join(HERE, "cred_rename_dryrun")
OUT_ROOT = os.path.join(HERE, "cred_rename_out")   # the applied receipts the re-point preview follows

TODAY = date.today().isoformat()
NOW_ISO = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _load(path, default):
    """Load JSON; gracefully return the default if file is missing."""
    if not os.path.isfile(path):
        return default
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def main(argv=None):
    import argparse
    ap = argparse.ArgumentParser(description="Credential-title rename dry-run.")
    ap.add_argument("--only-plan", default="", help="plan the renames and merges of this one ruled plan (its "
                    "plan_id under kb/cred_rename_plans/) and defer every other")
    raw_plan = ap.parse_args(argv or []).only_plan or ""
    only_plan = raw_plan.strip()
    if raw_plan and not only_plan:
        # A blank scope must never fall back to the unscoped run, which carries every planned rename.
        raise SystemExit("--only-plan is blank (%r): name a plan_id, or leave it out to plan everything" % raw_plan)
    overlay = _load(OVERLAY, {"overrides": {}})
    overrides = (overlay.get("overrides") or {})
    unified_titles = _load(UNIFIED_TITLES, {})
    credentials = _load(CREDENTIALS, {})
    # A rename a person ruled on a decision sheet, committed as a plan (kb/ruled_renames.py: Sheet 181's ASE renames,
    # whose rows' slot already holds Sam's family-tag folds). Laid over the overlay here and again in the apply, so the
    # two read one set of rows.
    overrides, ruled = ruled_renames.overlay(
        overrides, ruled_renames.load(PLANS_DIR), fold_issuer.family_titles(FAMILIES), credentials,
        fold_issuer.titles_holding_exhibits(unified_titles))
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
    # Four outcomes per override:
    #   * skipped     — no override value, no-op (override cleared), or
    #                   override equals the original (curator entered the
    #                   same name — display change but no rename)
    #   * merge       — new name already exists as a key in credentials.json
    #                   AND the curator explicitly confirmed the merge
    #                   (unified_title_merge_confirm == the same target —
    #                   PR-5b/2, Session 107): the apply FOLDS the old
    #                   title's credential records into the existing key.
    #   * collision   — new name already exists as a key in credentials.json
    #                   with NO matching merge confirm (non-blocking decision
    #                   queue — curator confirms the merge or re-titles)
    #   * clean       — safe rename; goes into alias_map
    renames_clean = {}        # old_ut -> new_ut
    merges_confirmed = {}     # old_ut -> existing target key (fold on apply)
    merge_details = []        # report rows for confirmed merges
    collisions = []           # list of dicts with the collision detail
    skipped = []              # list of dicts with skip reason
    no_credential_record = [] # rename of a unified_title with no credentials.json entry

    # A saved fold on a title that holds no exhibit (no raw maps to it) is held below, before the twin
    # and collision lanes, so it leads no group, joins no fold and its issuer row never reaches rule 1
    # (Sky and COBIx, 2026-11-11, #3110). The same rows act again once a raw maps to the title.
    holding = fold_issuer.titles_holding_exhibits(unified_titles)

    # Every override that carries a title rename, keyed by source — used by
    # the merge-target chain guard below (a confirmed merge must not target a
    # credential that is itself being renamed/merged away in the same batch).
    # A held emptied title renames nothing this batch, so it is no chain; nor does a title whose saved fold
    # names a family title, which is a family tag held below (Sam's ruling C). Counted as a chain, it held
    # every merge into a title carrying such a tag (Sheet 181's Master merge) as a retitled target.
    families = fold_issuer.family_titles(FAMILIES)
    retitled_sources = {
        o: (v or {}).get("unified_title_override")
        for o, v in overrides.items()
        if (v or {}).get("unified_title_override")
        and (v or {}).get("unified_title_override") != o
        and (v or {}).get("unified_title_override") not in families
        and o in holding
    }

    # A title saved into a declared family title (Sam's ruling C) is held here, before the twin and
    # collision lanes, with or without a merge confirm: it never becomes a group's lead (a clean rename
    # that would mint the family name as a credential) nor a collision a curator could confirm into a merge.
    held_early = []
    held_emptied = []

    for old_ut, ov in sorted(overrides.items()):
        new_ut = (ov or {}).get("unified_title_override")
        if not new_ut:
            continue  # only iterating renames; non-rename overrides are PR-5a's job
        if new_ut != old_ut and old_ut not in holding:
            held_emptied.append({"old": old_ut, "target": new_ut,
                                 "kind": "merge" if (ov or {}).get("unified_title_merge_confirm") == new_ut
                                 else "rename", "why": fold_issuer.EMPTIED_HELD_LINE})
            continue
        if new_ut in families and new_ut != old_ut:
            held_early.append({"old": old_ut, "target": new_ut,
                               "kind": "merge" if (ov or {}).get("unified_title_merge_confirm") == new_ut
                               else "rename", "why": fold_issuer.FAMILY_HELD_LINE})
            continue
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
            confirm = (ov or {}).get("unified_title_merge_confirm")
            target_also_retitled = new_ut in retitled_sources
            if confirm == new_ut and not target_also_retitled:
                # Curator-confirmed merge (PR-5b/2). NEVER inferred — the
                # confirm row must name this exact target.
                merges_confirmed[old_ut] = new_ut
                merge_details.append({
                    "old_unified_title": old_ut,
                    "merge_into": new_ut,
                    "records_folding": len(credentials.get(old_ut) or []),
                    "existing_records_on_target": len(credentials.get(new_ut) or []),
                    "raw_titles": len(raw_titles_by_ut.get(old_ut, [])),
                    "articulations": art_records_by_ut.get(old_ut, 0),
                    "confirmed_by": ov.get("reviewed_by"),
                    "confirmed_at": ov.get("reviewed_at"),
                })
                continue
            collisions.append({
                "old_unified_title": old_ut,
                "proposed_new_title": new_ut,
                "reason": ("merge_target_itself_retitled_this_batch"
                           if (confirm == new_ut and target_also_retitled)
                           else ("stale_merge_confirm"
                                 if confirm else
                                 "collision_with_existing_credential")),
                "existing_credential_records": len(credentials.get(new_ut) or []),
                "merge_confirm_recorded": confirm or None,
                "rename_would_touch": {
                    "raw_titles_in_unified_titles_json": len(raw_titles_by_ut.get(old_ut, [])),
                    "articulation_records": art_records_by_ut.get(old_ut, 0),
                    "credentials_json_key_exists": old_ut in credentials,
                },
                "reviewed_by": ov.get("reviewed_by"),
                "reviewed_at": ov.get("reviewed_at"),
                "policy": "queued_pending_curator_decision",
            })
            continue
        renames_clean[old_ut] = new_ut

    # ── Intra-batch same-target twins (Session 107, evening) ─────────────────
    # Sam retitled PAIRS of different rows to the same NEW name ("C++
    # Programming I" + "II" → "C++ Programming") — a Rule-3 level convergence
    # whose merge target doesn't exist yet, so the collision lane can't see
    # it. Applying both would clobber (the second re-key overwrites the
    # first). Resolution WITHOUT inferring a merge: the EARLIEST-saved source
    # proceeds as a plain rename (its target exists nowhere — safe); the
    # REST move to the non-blocking decision queue. After the first lands +
    # the next bake, the queued twins become ORDINARY collisions against the
    # now-existing credential → the CER pending-merges strip surfaces them →
    # the curator's ✓ Confirm merge folds them (never automatic).
    target_groups = defaultdict(list)
    for o, n in renames_clean.items():
        target_groups[n].append(o)
    for new_ut, sources in target_groups.items():
        if len(sources) < 2:
            continue
        # The lead is a source with no merge confirm (the one that creates the title); the earliest
        # saved among those, or among all when every source confirmed. An entry's reviewed_at is its
        # latest field's, so an issuer edited after the batch must not make a sibling the lead.
        # Saved-at is the rename row's own stamp where the overlay carries one (field_reviews).
        def _saved(o):
            e = overrides.get(o) or {}
            st = (e.get("field_reviews") or {}).get("unified_title_override") or {}
            return st.get("at") or e.get("reviewed_at") or ""
        sources.sort(key=lambda o: (
            (overrides.get(o) or {}).get("unified_title_merge_confirm") == new_ut, _saved(o), o))
        for o in sources[1:]:
            del renames_clean[o]
            ov = overrides.get(o) or {}
            # Only when the lead has a credentials.json record: a lead with none creates no key, so
            # the fold would find no target (it then waits as below, as before the one-pass apply).
            if ov.get("unified_title_merge_confirm") == new_ut and sources[0] in credentials:
                # One-pass apply (#3110 build step 1): the curator already confirmed this sibling's
                # merge into the title the group's lead creates, so it folds in the same run. The
                # apply re-keys the lead first (rekey_credentials), then folds (fold_credentials), so
                # the target exists by the time the fold reads it. A sibling with no confirm still
                # waits, as below.
                merges_confirmed[o] = new_ut
                merge_details.append({
                    "old_unified_title": o,
                    "merge_into": new_ut,
                    "same_run_lead": sources[0],
                    "records_folding": len(credentials.get(o) or []),
                    "existing_records_on_target": len(credentials.get(sources[0]) or []),
                    "raw_titles": len(raw_titles_by_ut.get(o, [])),
                    "articulations": art_records_by_ut.get(o, 0),
                    "confirmed_by": ov.get("reviewed_by"),
                    "confirmed_at": ov.get("reviewed_at"),
                })
                continue
            if ov.get("unified_title_merge_confirm") == new_ut:
                # Confirmed, but the lead that creates the title has no credentials.json record, so this
                # run makes no key to fold into. Said plainly: it does not become a collision on its
                # own later, and the fold's issuer rules never run for this group until a person acts.
                collisions.append({
                    "old_unified_title": o,
                    "proposed_new_title": new_ut,
                    "reason": "lead_has_no_credentials_record",
                    "first_of_group": sources[0],
                    "existing_credential_records": 0,
                    "rename_would_touch": {
                        "raw_titles_in_unified_titles_json": len(raw_titles_by_ut.get(o, [])),
                        "articulation_records": art_records_by_ut.get(o, 0),
                        "credentials_json_key_exists": o in credentials,
                    },
                    "reviewed_by": ov.get("reviewed_by"),
                    "reviewed_at": ov.get("reviewed_at"),
                    "policy": ("held: its merge into %r is confirmed, but that title is created by %r, which "
                               "has no credentials.json record, so no key exists to fold into. Nothing is "
                               "folded and the confirm is not applied. A person gives the lead a record, or "
                               "points this title's confirm at a title that exists." % (new_ut, sources[0])),
                })
                continue
            collisions.append({
                "old_unified_title": o,
                "proposed_new_title": new_ut,
                "reason": "intra_batch_same_target",
                "first_of_group": sources[0],
                "existing_credential_records": 0,
                "rename_would_touch": {
                    "raw_titles_in_unified_titles_json": len(raw_titles_by_ut.get(o, [])),
                    "articulation_records": art_records_by_ut.get(o, 0),
                    "credentials_json_key_exists": o in credentials,
                },
                "reviewed_by": ov.get("reviewed_by"),
                "reviewed_at": ov.get("reviewed_at"),
                "policy": ("queued_pending_curator_decision — becomes a "
                           "regular collision (confirmable in the CER strip) "
                           "once the group's first rename lands"),
            })

    # ── Family titles: a fold into one is not a merge (Sam's ruling C) ──────
    renames_clean, merges_confirmed, held_family = fold_issuer.hold_family_folds(
        renames_clean, merges_confirmed, families)
    held_family = held_early + held_family
    held_old = {h["old"] for h in held_family}
    merge_details = [m for m in merge_details if m["old_unified_title"] not in held_old]

    # ── One ruled plan alone (--only-plan; cred-rename-apply.yml's only_plan input) ─
    # The plan's renames and merges and nothing else, so the first live use of the guarded writes runs on a small
    # scope (S639 conductor). Every other rename and merge waits, listed as deferred, for a dispatch without it.
    deferred = []
    if only_plan:
        if only_plan not in {p["plan_id"] for p in ruled_renames.load(PLANS_DIR)}:
            raise SystemExit("--only-plan %r: no such plan under %s" % (only_plan, PLANS_DIR))
        mine = {e["old"] for e in ruled["applied"] if e["plan_id"] == only_plan}
        deferred = sorted([{"old": o, "target": t, "kind": "rename"} for o, t in renames_clean.items() if o not in mine]
                          + [{"old": o, "target": t, "kind": "merge"} for o, t in merges_confirmed.items()
                             if o not in mine], key=lambda d: d["old"])
        renames_clean = {o: t for o, t in renames_clean.items() if o in mine}
        merges_confirmed = {o: t for o, t in merges_confirmed.items() if o in mine}
        merge_details = [m for m in merge_details if m["old_unified_title"] in mine]

    # ── Issuer preview (kb/fold_issuer.py) ───────────────────────────────────
    # What each fold group's issuer will be, decided by the same rules the apply runs. A preview only:
    # the apply recomputes it on the fresh overlay and freezes it into its receipt.
    issuer_plan = fold_issuer.plan(renames_clean, merges_confirmed, overrides, credentials,
                                   fold_issuer.path_tallies(_load(RELATED, {})))

    # ── Re-point preview (kb/_cred_rename_repoint.py) ─────────────────────────
    # The saved assignments and title-keyed files the apply would move off each old title, the person's rows it would
    # hold, and the old titles it would leave under kb/ (the apply's own count after its writes reads the same way).
    rp_root = repoint.root_of(CREDENTIALS)
    try:
        # Every applied rename too (kb/_cred_rename_repoint.py history_moves), so the preview shows the machine values
        # earlier applies left, each with the apply it comes from (from_apply).
        rp_live = (set(credentials) - set(renames_clean) - set(merges_confirmed)) | set(renames_clean.values())
        rp_moves, rp_origin = repoint.history_moves(OUT_ROOT, dict(renames_clean, **merges_confirmed), rp_live)
        rp_changes, rp_held = repoint.plan(rp_moves, rp_root, rp_origin)
        would_leave = repoint.predict_left(renames_clean, merges_confirmed, rp_root)
        rp_chain = None
    except repoint.RenameChain as e:  # the apply would stop before writing; so does apply_safe below
        rp_changes, rp_held, would_leave, rp_chain = [], [], None, str(e)

    # ── V1/V2/V3 validation gates ─────────────────────────────────────────────
    # V1 — every clean rename target is unique among the proposed set
    #      (defensive; the twin-group pruning above guarantees it).
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

    # Queued collisions do NOT gate the clean set (Session 107): a collision
    # source always exists as a credentials.json key while a clean target
    # never does, so the two sets are disjoint — applying the clean renames
    # can't touch a queued collision's source or target. Confirmed merges
    # count as applicable work alongside clean renames.
    # An apply with no rename still has work when earlier applies left machine values to re-point.
    apply_safe = bool(v1_pass and v2_pass and v3_pass and not rp_chain
                      and (renames_clean or merges_confirmed or rp_changes))

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
            "confirmed_merges": len(merges_confirmed),
            "held_as_family_tags": len(held_family),
            "held_emptied_titles": len(held_emptied),
            "ruled_applied": len(ruled["applied"]),
            "ruled_held": len(ruled["held"]),
            "collisions": len(collisions),
            "skipped": len(skipped),
            "renames_of_titles_with_no_credentials_record": len(no_credential_record),
            "apply_safe": apply_safe,
            "v1_intra_batch_collisions_pass": v1_pass,
            "v2_source_exists_pass": v2_pass,
            "v3_target_collision_free_pass": v3_pass,
        },
        "renames": renames_clean,
        # Curator-CONFIRMED merges (PR-5b/2): old title → EXISTING credential
        # key. The apply FOLDS the old title's credential records into the
        # target (dedupe on issuer+trainer) and re-keys raws + articulations.
        "merges": merges_confirmed,
        "merge_details": merge_details,
        # Saved folds into a declared family title (kb/reference/credential_families.json): not merges, never
        # folded; the family-tag converter turns these rows into family tags.
        "held_family": held_family,
        # Saved folds on a title that holds no exhibit: left in kb_curation, never folded (#3110).
        "held_emptied": held_emptied,
        # --only-plan: the one ruled plan this run applies, and every other rename and merge it defers.
        "only_plan": only_plan or None,
        "deferred": deferred,
        # Renames and merges a person ruled on a decision sheet (kb/cred_rename_plans/, kb/ruled_renames.py): applied
        # stand in the renames and merges above; held wait for a person; done already landed.
        "ruled": ruled,
        # Preview of kb/fold_issuer.py's decision per fold group (the apply's receipt freezes its own).
        # The apply's re-point of saved assignments (kb/_cred_rename_repoint.py): what moves, and what it holds.
        "repoint_preview": {"changes": rp_changes, "held_person_rows": rp_held, "chain": rp_chain},
        # The old titles the apply would leave under kb/ (prediction; target 0). None outside a kb/ tree.
        "would_leave_old_titles": would_leave,
        "issuer_preview": {t: {"rule": g["resolution"]["rule"], "winner": g["resolution"]["winner"],
                               "conflict": g["resolution"]["conflict"],
                               "humans": g["resolution"]["humans"],
                               "exceptions": g["exceptions"]}
                           for t, g in issuer_plan.items()},
    }
    with open(os.path.join(OUT_DIR, "alias_map.json"), "w", encoding="utf-8") as f:
        json.dump(alias_map_payload, f, indent=2, ensure_ascii=False)
        f.write("\n")

    collisions_payload = {
        "_about": (
            "Credential rename collisions detected by the dry-run. Each entry "
            "is a proposed rename whose target already exists as a key in "
            "credentials.json. Policy: NON-BLOCKING decision queue — the entry "
            "waits here (clean renames apply without it) until the curator "
            "picks a non-colliding target or explicitly confirms a merge "
            "(PR-5b/2). NEVER auto-merged; NEVER auto-disambiguated."
        ),
        "_generated_at": NOW_ISO,
        "count": len(collisions),
        "collisions": collisions,
    }
    with open(os.path.join(OUT_DIR, "collisions.json"), "w", encoding="utf-8") as f:
        json.dump(collisions_payload, f, indent=2, ensure_ascii=False)
        f.write("\n")

    md = _render_md(renames_clean, merge_details, collisions, skipped,
                    no_credential_record,
                    intra_batch_collisions, v2_blocked, v3_blocked,
                    raw_titles_by_ut, art_records_by_ut, credentials,
                    apply_safe)
    if held_family:
        fam = ["## Held: folds into a family title", ""]
        fam += ["- `%s` (%s) into `%s`: %s" % (h["old"], h["kind"], h["target"], h["why"]) for h in held_family]
        md = md.replace("## Clean renames (would land on apply)",
                        "\n".join(fam) + "\n\n## Clean renames (would land on apply)", 1)
    if held_emptied:
        emp = ["## Held: saved folds on a title that holds no exhibit", ""]
        emp += ["- `%s` (%s) into `%s`: %s" % (h["old"], h["kind"], h["target"], h["why"]) for h in held_emptied]
        md = md.replace("## Clean renames (would land on apply)",
                        "\n".join(emp) + "\n\n## Clean renames (would land on apply)", 1)
    if ruled["applied"] or ruled["held"]:
        rl = ["## Ruled on a decision sheet (kb/cred_rename_plans/)", ""]
        rl += ["- `%s` (%s) into `%s`, plan %s" % (e["old"], e.get("kind", "rename"), e["new"], e["plan_id"])
               for e in ruled["applied"]]
        rl += ["- HELD `%s` into `%s`, plan %s: %s" % (e["old"], e["new"], e["plan_id"], e["why"]) for e in ruled["held"]]
        md = md.replace("## Clean renames (would land on apply)",
                        "\n".join(rl) + "\n\n## Clean renames (would land on apply)", 1)
    md = md.replace("## Clean renames (would land on apply)",
                    _render_issuer_md(issuer_plan) + "## Clean renames (would land on apply)", 1)
    with open(os.path.join(OUT_DIR, "report.md"), "w", encoding="utf-8") as f:
        f.write(md)

    # ── Console summary ───────────────────────────────────────────────────────
    print(f"[cred_rename_dryrun] {TODAY}")
    print(f"  overrides in overlay:    {sum(1 for v in overrides.values() if (v or {}).get('unified_title_override'))}")
    print(f"  clean renames:           {len(renames_clean)}")
    print(f"  confirmed merges:        {len(merges_confirmed)}")
    print(f"  collisions:              {len(collisions)}")
    print(f"  held (title empty):      {len(held_emptied)}")
    print(f"  ruled (sheet plans):     {len(ruled['applied'])} applied, {len(ruled['held'])} held, "
          f"{len(ruled['done'])} done")
    if only_plan:
        print(f"  only plan {only_plan}: {len(deferred)} other rename(s) and merge(s) deferred")
    print(f"  skipped (no-op):         {len(skipped)}")
    print(f"  V1 (intra-batch):        {'PASS' if v1_pass else f'FAIL ({len(intra_batch_collisions)})'}")
    print(f"  V2 (source exists):      {'PASS' if v2_pass else f'FAIL ({len(v2_blocked)})'}")
    print(f"  V3 (target collision):   {'PASS' if v3_pass else f'FAIL ({len(v3_blocked)})'}")
    print(f"  apply-safe:              {apply_safe}")
    print(f"  re-point preview:        {len(rp_changes)} saved value(s) move, {len(rp_held)} person row(s) held")
    for h in rp_held:
        print(f"    HELD {h['file']} {h['key']}: {h['why']}")
    if would_leave is not None:
        print(f"  would_leave_old_titles:  {would_leave['count']} (kept by rule: {len(would_leave['kept'])})")
        for x in would_leave["locations"][:20]:
            print(f"    LEFT {x['location']}")
    print(f"  wrote: {OUT_DIR}/{{report.md, alias_map.json, collisions.json}}")


def _render_issuer_md(issuer_plan):
    """The fold groups' issuer preview: which rule decides each, conflicts, and exceptions for a person."""
    lines = ["## Issuer of each folded title (preview, kb/fold_issuer.py)", ""]
    if not issuer_plan:
        lines += ["_No folds._", ""]
        return "\n".join(lines) + "\n"
    lines.append("Rule 1, reviewer: a person's explicit issuer in the group wins (newest on a disagreement). "
                 "Rule 2, cert form: the target's issuer stays and a folded college record is dropped. "
                 "Rule 3, additive.")
    lines.append("")
    for target, g in issuer_plan.items():
        lines += fold_issuer.receipt_lines(g["resolution"], None, g["exceptions"])
    lines.append("")
    return "\n".join(lines) + "\n"


def _render_md(renames_clean, merge_details, collisions, skipped,
               no_credential_record,
               intra_batch_collisions, v2_blocked, v3_blocked_report,
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
    lines.append(f"| V3 | No CLEAN rename target collides with an existing credentials.json key | "
                 f"{'PASS ✓' if not v3_blocked_report else f'FAIL ({len(v3_blocked_report)}) ✗'} |")
    lines.append(f"| — | Queued collisions (non-blocking — wait for a curator decision) | "
                 f"{len(collisions) if collisions else '0'} |")
    lines.append(f"| **Apply safe** | V1–V3 pass + at least one clean rename or confirmed merge (queued collisions don't block) | "
                 f"{'**YES — PR-5b/1 can dispatch**' if apply_safe else '**NO**'} |")
    lines.append("")
    lines.append("## Confirmed merges (would FOLD on apply — PR-5b/2)")
    lines.append("")
    if not merge_details:
        lines.append("_None._ A queued collision becomes a confirmed merge when the curator "
                     "clicks **✓ Confirm merge** in the CER triage lane (writes "
                     "`unified_title_merge_confirm` naming the exact target).")
    else:
        lines.append("| Old unified_title | ⇒ folds into | Records folding | Already on target | raw_titles | articulations |")
        lines.append("|---|---|---:|---:|---:|---:|")
        for m in merge_details:
            lines.append(f"| `{m['old_unified_title']}` | ⇒ `{m['merge_into']}` "
                         f"| {m['records_folding']} | {m['existing_records_on_target']} "
                         f"| {m['raw_titles']} | {m['articulations']} |")
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
    lines.append("## Collisions (queued, non-blocking — curator decision required)")
    lines.append("")
    if not collisions:
        lines.append("_None._")
    else:
        lines.append("Each row's proposed new title already exists as a key in `credentials.json`. "
                     "Policy: non-blocking decision queue — these wait (clean renames + confirmed "
                     "merges apply without them) until the curator picks a non-colliding target or "
                     "explicitly confirms the merge in the CER triage lane (PR-5b/2).")
        lines.append("")
        lines.append("| Old | → | New (collides) | Existing records on target | Why queued |")
        lines.append("|---|---|---|---:|---|")
        for c in collisions:
            lines.append(f"| `{c['old_unified_title']}` | → | `{c['proposed_new_title']}` "
                         f"| {c['existing_credential_records']} | {c.get('reason', '')} |")
        held = [c for c in collisions if c.get("reason") == "lead_has_no_credentials_record"]
        if held:
            lines.append("")
            lines.append("**Held for a person** (the merge is confirmed, but the title it merges into would "
                         "be created by a title with no credentials.json record):")
            lines.append("")
            for c in held:
                lines.append(f"- `{c['old_unified_title']}`: {c['policy']}")
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
    main(sys.argv[1:])
