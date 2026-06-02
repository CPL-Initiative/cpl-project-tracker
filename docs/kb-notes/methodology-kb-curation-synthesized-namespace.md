---
title: Adding a curation surface with a synthesized kb_curation namespace (zero schema migration)
created: 2026-06-02
updated: 2026-06-02
tags: [methodology, supabase, curation, kb_curation]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[exhibit_canonicalization_lessons]]"
artifacts:
  - credential_reference.js
  - kb/_apply_unclassified_triage.py
  - kb/_apply_credential_review.py
---

# Adding a curation surface with a synthesized kb_curation namespace (zero schema migration)

> **One-sentence summary** — Supabase `public.kb_curation` is a generic
> `(course_id, field, value, reviewer_email, reviewed_at)` table, so a brand-new
> curation surface needs only a new `course_id` *prefix* + new `field` values —
> never a schema migration.

## Context

The dashboard has accreted several reviewer-curation surfaces (credential
overrides, Common Subject Code canonicalization, EACR stale/dup flags, the
unclassified-exhibit triage worklist). Each needs to persist per-row edits to
Supabase, but the project rule is "no schema migrations without sign-off" and
RLS is already wired. The recurring question: where do new editable fields go?

## The claim

**`kb_curation` is a key/value bag keyed by `(course_id, field)`.** To add a new
curation surface:

1. Pick a **synthesized `course_id` namespace** — a sentinel prefix that can't
   collide with a real course id, e.g. `_CREDENTIAL_REVIEW::<unified_title>`,
   `_CANON_SUBJ4::<discipline>`, `_EACR_FLAG::<card_key>`,
   `_UNCLASSIFIED::<raw_title>`.
2. Pick **`field` names** for each editable attribute (e.g.
   `unified_title_assignment`, `issuing_agency_assignment`). The composite PK
   `(course_id, field)` lets a row-per-field stack cleanly; upsert with
   `Prefer: resolution=merge-duplicates`.
3. **Read** with a server-side filter so you only pull your namespace:
   `?course_id=like.<PREFIX>%25` (URL-encode the prefix). Never pull the whole
   table — it holds every other overlay too.
4. **Persist** to a git-canonical overlay with a tiny `_apply_*.py` that mirrors
   `_apply_credential_review.py` (service-role key, namespace filter, idempotent
   write), wired into the daily "Sync curation overlay" step guarded on
   `SUPABASE_SERVICE_KEY`.

No `ALTER TABLE`, no new table, no RLS change — the existing
`is_allowed_reviewer()` policies already gate writes to `kb_curation`.

## How we got here

The pattern emerged across four surfaces and was reconfirmed building the CER
unclassified-triage worklist (PR #266/#267, Session 30): the worklist's
raw-title→unified-title assignments went straight into a new
`_UNCLASSIFIED::<raw_title>` namespace with `unified_title_assignment` /
`issuing_agency_assignment` fields, with **zero** Supabase DDL. The browser
write path is a verbatim copy of the existing `saveOverride()` (swap the prefix);
the daily sync is a verbatim copy of `_apply_credential_review.py` (swap the
prefix + fields).

## When this applies (and when it doesn't)

- **Applies** to any *additive* per-row curator edit that fits a key/value
  shape and is gated by the existing allowed-reviewer RLS.
- **Does NOT apply** when the edit must be queried/joined relationally by the DB
  (key/value bags are opaque to SQL joins), when it needs its own RLS policy
  distinct from `is_allowed_reviewer()`, or when the *value* is structured
  enough to warrant real columns. Those justify a real table + migration.
- **The overlay sync only RECORDS** — folding an assignment into a curated KB
  file (`unified_titles.json`, `coci_articulations.json`, …) is a separate
  dry-run-first apply, because that mutation ripples and is not reversible by a
  DELETE of one `kb_curation` row.

## See also

- `[[docs/exhibit_canonicalization_lessons]]` — the CER workstream (Session 30 section)
- PR `#266` (worklist UI) + `#267` (daily overlay sync) — the latest instance
- `kb/_apply_credential_review.py` — the reference `_apply_*` sync this mirrors

---

*Authoring check: durable (the table shape is stable), reusable (every future
curation surface), distilled (one concept), self-contained.*
