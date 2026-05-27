---
title: Methodology — Two-mode sync (safe Mode A vs identity-touching Mode B)
created: 2026-05-27
updated: 2026-05-27
tags: [methodology, supabase, sync, re-mint, knowledge-base, cred-ref, unified-courses]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/coursecontrolnumber_remint]]"
  - "[[docs/exhibit_canonicalization_lessons]]"
artifacts:
  - kb/_apply_curation.py
  - kb/_apply_credential_review.py
  - kb/_apply_canonical_subj4.py
---

# Methodology — Two-mode sync (safe Mode A vs identity-touching Mode B)

> **One-sentence summary** — When syncing curator edits from Supabase into
> git-canonical JSON, classify every field as **identity-touching** or
> **decoration-only** and ship the decoration sync first; identity changes
> need the full re-mint playbook.

## Context

Multiple workstreams in this repo have the same shape: a curator UI in the
dashboard writes overrides to Supabase (`kb_curation` rows with a synthesized
key namespace like `_CREDENTIAL_REVIEW::<unified_title>`), and a sync script
folds those overrides into a git-canonical overlay JSON the daily cron picks
up. Examples:

- `kb/_apply_curation.py` — discipline overrides → `kb/coci_curation.json`
- `kb/_apply_canonical_subj4.py` — SUBJ4 canonical mapping → `kb/discipline_canonical_subj4.json`
- `kb/_apply_credential_review.py` — credential overrides → `kb/credential_review_overlay.json`

Some of those overrides are safe to fold in daily — they decorate a record
without changing what it IS. Others (renames, primary-key changes) ripple
into joined files (`coci_articulations.json` inlines `unified_title`, for
instance, as the credential identity for earned articulations) and require
the full re-mint discipline from `docs/coursecontrolnumber_remint.md`.

The first instinct is to defer the entire sync to "after the re-mint
question is answered." The disciplined move is to split it.

## The claim

**Every curator-overlay → JSON sync should classify its fields into two modes:**

### Mode A — decoration / non-identity overrides

- **Definition:** the override changes a property of the record but NOT
  any field that other JSON files key off of, inline as a value, or use
  as a join target.
- **Examples:** issuing-agency override, training-agency override,
  quality-flag toggle, "marked initiated" sentinel, descriptive notes.
- **Discipline:** ship in any session. Daily cron picks up automatically.
  Clears revert correctly (overlay rebuilt from scratch each run).
  Idempotent + re-runnable. **No alias map required.**

### Mode B — identity-touching renames

- **Definition:** the override changes the record's primary key, its
  `unified_title` (which is keyed by joined files), its discipline (if
  M-IDs are organized by discipline-subject), or any field that downstream
  joins reference by value.
- **Examples:** `unified_title_override` → real rename; M-ID re-key;
  discipline canonical-subject change.
- **Discipline:** full re-mint playbook required. Dry-run → alias map
  committed → atomic land within one 10:17 UTC cron window → Supabase
  override row cleared in lock-step. Mandatory `docs/coursecontrolnumber_remint.md`.
- **Recording vs applying:** even in Mode A, the script SHOULD record
  Mode-B-pending overrides in the overlay so the audit trail exists.
  Just don't apply them as renames.

## How we got here

**Cred-Ref PR-4 (Bruh Hept, Session 7, PR #134)** shipped overlay-only
curator edits on the Credential Reference tab — 4 override fields plus a
"reviewed" marker. The commit message explicitly deferred the entire
JSON sync to "PR-5" because of the rename risk.

**Cred-Ref PR-5a (Bruh El, Session 11, PR #150)** broke that monolith
into Mode A / Mode B:
- Mode A — issuer / trainer / quality_flag / reviewed_marker — shipped.
- Mode B — `unified_title_override` rename promotion — recorded in
  overlay (audit trail) but NOT applied; deferred to PR-5b with the
  full re-mint playbook.

The split unlocked a small, safe daily sync that took ~2 hours to build
and ship. Without it, the entire workstream was blocked on the re-mint
project (which is a substantial multi-day effort).

The pattern has prior art in the repo:
- `kb/_apply_curation.py` (PR-Cred-Ref earlier) ALREADY did this implicitly
  — it folded `discipline`, `merge_into`, `unified_title`, `description`
  fields, all of which are decoration-or-staging vs identity-touching.
- The 2026-05-22 CourseControlNumber re-mint (PR #84) was the canonical
  example of Mode B — the playbook lives in
  [`docs/coursecontrolnumber_remint.md`](../coursecontrolnumber_remint.md).

## When this applies (and when it doesn't)

**Applies:**
- Any curator UI → Supabase → JSON sync.
- Any case where some overrides are "safe to apply per cron" and others
  require multi-file atomic re-keys.

**Does NOT apply:**
- Pure-decoration overlays where no field could possibly be identity-touching
  (rare — most CPL data has at least one key field).
- One-shot data migrations (those use the re-mint playbook from the start).
- Live-data sync (live metrics, KPI snapshots — those don't have curator
  edits, just pipeline output).

## See also

- `[[docs/exhibit_canonicalization_lessons]]` — the 2026-05-27 section
  captures the PR-5a split decision and follow-up.
- `[[docs/coursecontrolnumber_remint]]` — Mode B's mandatory playbook.
- `[[CLAUDE]]` Rule 7 — M-ID staging-cleanup phase notes; identity
  re-mints are permitted under the playbook.

---

*Authoring check: durable across re-mints, reusable across curator
workstreams (Cred-Ref, CSC tab, CCR all face this question), distilled
to one concept (the Mode A/B split), self-contained.*
