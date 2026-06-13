---
title: "Playbook: gated bulk auto-curation (dry-run → md5-pinned server-side apply)"
date: 2026-06-12
kb-status: published
type: playbook
tags: [curation, auto-merge, supabase, receipts, apply-equals-spec, kb_curation]
artifacts:
  - kb/_auto_merge_worklist.py
  - kb/automerge_out/2026-06-12/ (plan.json · report.md · supabase_ops.sql · apply_log.json)
related:
  - docs/kb-notes/methodology-apply-equals-spec-via-shared-allocator.md
  - docs/ccr_cluster_cleanup_lessons.md (Session 53)
---

# Gated bulk auto-curation

When the curator has hand-validated a sample of a machine-generated worklist
and asks to bulk-apply the rest ("the first 80 were dependable"), use this
shape. First production instance: auto-merge pass 1, 2026-06-12 — 2,272
worklist groups / 5,838 `kb_curation` rows applied with zero conflicts.

## The pattern

1. **Scope to the lanes the human actually sampled.** Auto-apply only the
   deterministic-signature lanes (anchored same-title, cross-college
   singleton mints). Similarity lanes (title/description cosine), contested
   evidence, and same-college groups stay human until separately sampled.

2. **Gate, don't trust.** Each group passes ALL: ≥2 live members after the
   curation overlay; not Keep-as-is dismissed (signature match); no
   contested members; **band purity** (credit M1xxx and noncredit M9xxx
   never merge across — this single gate caught 325 groups the title
   signature could not see); target not itself consumed. Failures land in
   named report buckets — they're the human residue, not errors.

3. **Deterministic title pick, no research.** Official target → no title
   write (authoritative). Curator title on target → kept, never overwritten.
   Else `normalize(longest member title)` + domain nit rules (Honors
   de-dash/case). Per-group external research does not scale and the
   second-look queue catches residue.

4. **Write exactly what the human button writes.** Mirror the UI's save
   shape (`merge_into` per member + `unified_title` on non-official
   targets). Write **nothing that implies human verification** (no
   discipline rows — merge ≠ verify).

5. **Cohort marker.** Every row carries a distinct machine marker
   (`reviewer_email='automerge-v1@bot'`): queryable, chip-able, and
   bulk-revertible (`delete … where reviewer_email = marker` un-does the
   whole pass; the daily sync un-folds the rows).

6. **Dry-run receipt → human skim → apply.** Receipt = `plan.json` (full
   machine plan), `report.md` (gate buckets, units-spread histogram, title
   showcase, seeded random sample), `supabase_ops.sql` (guarded). Verify
   pre-apply: plan **deterministic across re-runs**, write keys **unique**
   (this caught a payload quirk + 20 degenerate self-groups), **zero
   collisions** with existing curation.

7. **Apply = spec, provably.** Commit the receipt to `main` first. Fresh-read
   the live table (counts + latest timestamp vs the plan's input state).
   Then apply **server-side**: `create extension http` → one
   `INSERT … SELECT` over `http_get(<raw.githubusercontent SHA-pinned
   plan.json>)` gated on `status = 200 AND md5(content) = '<local md5>'` →
   `ON CONFLICT (course_id, field) DO NOTHING` so any human row written in
   the gap **always wins** → `drop extension http`. The DB applies the
   exact reviewed bytes; nothing large transits the session.

8. **Restamp.** `plan.json` `_status` → APPLIED; `apply_log.json` records
   authorization quote, method, freshness gate, result counts, post-verify
   numbers, and the revert procedure.

## Traps hit in production

- **The live schema is the truth.** The setup SQL suggested `reviewed_by`;
  the live column is `reviewer_email`. Check `information_schema.columns`
  before writing.
- **Worklist payloads can duplicate an id** (same id under two member
  kinds). Dedupe per group at intake; assert global write-key uniqueness.
- **Session-container egress allowlists** block direct Drive/Supabase REST;
  the Supabase MCP and DB-side `http_get` of public GitHub raw URLs are the
  channels that work.
- **raw.githubusercontent caching**: always fetch by commit SHA, never by
  branch — and md5-gate regardless.

## Surfacing the cohort for second-look (added Session 54, 2026-06-13)

A bulk-applied cohort is only trustworthy if the curator can find and audit it
in one click. The cohort marker (`reviewer_email` / `reviewed_by` ==
`automerge-v1@bot`) is both the **revert handle** and the **review handle**:

- **Generator**: in the *single* place merge targets are emitted (the
  `merge_members` loop of `export_unified_courses()`), count each surviving
  target's folded members that carry the cohort marker and stamp the row with
  `auto_n` (emit `>0` only — lean). No other emit path can carry the marker, so
  one add covers the whole cohort. (Verified end-to-end: `auto_n` landed on
  exactly 2,272 rows = the planned group count, 0 leakage onto non-targets.)
- **Consumer**: a distinct chip (`⚙ auto-merged`, amber — set apart from the
  cobalt `⛓ merged` consolidation badge) + a **row-level** Triage lane
  (`r.auto_n > 0`). Crucially the lane is special-cased **before** the
  audit-overlay lookup, so it works without sign-in and without the audit index
  loaded — the cohort is public, reversible, and reviewable by anyone.
- **Reversibility, restated for the reviewer**: whole-cohort revert = delete the
  `reviewer_email='automerge-v1@bot'` rows; per-row revert = drop that row's
  `merge_into` (a follow-up affordance). The chip tooltip says so.

This closes the loop the apply opened: *apply == spec* gets the rows in safely;
the chip + lane get them *seen*. Pattern instance: PR #428.
