---
title: A page whose promise is narrower than its table's delete policy filters on the owner
created: 2026-11-22
updated: 2026-11-22
tags: [methodology, supabase, kb-curation, write-surface, commons]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[commons]]"
artifacts:
  - commons_subjects.js
  - tests/commons_subjects_save.test.js
---

# A page whose promise is narrower than its table's delete policy filters on the owner

> **One-sentence summary** — when a page promises "take back your own save" over a table whose row-level DELETE
> policy lets any allowed reviewer delete any row, the page's delete names the owner as well as the key, and the
> control shows only on the owner's row.

## Context

The Subjects page (`#commons/subjects`, S701, #3666) writes one `kb_curation` row per decision under the reviewer's own
email, and offers *Take it back*. The table's live DELETE policy is wider: any allowed reviewer may delete any row. The
lessons are in [`docs/commons_lessons.md`](../commons_lessons.md), S701.

## The claim

The policy is the outer bound; the page's promise is a narrower contract, and the page enforces it.

- **The delete carries the owner.** `DELETE ... ?course_id=eq.<key>&field=eq.<field>&reviewer_email=eq.<signed-in
  email>`, so a press can remove only the presser's row, whatever the policy allows.
- **The control shows only where it can act.** *Take it back* is drawn on the reviewer's own save alone; on another
  person's save, or a bot-filed one, the reviewer saves a new decision instead.
- **A test pins both.** `tests/commons_subjects_save.test.js` checks the delete's filter and that the control is absent
  on another's row.

## How we got here

The first build of Take it back deleted by key alone. A second reader, reading the live policy before the merge, saw
that a press would delete another reviewer's save or one of the 30 rows filed for Sam under `subjects-s701@bot`, and
the fix went in before #3666 merged.

## When this applies (and when it doesn't)

Any write surface over a shared human-write table (Rule 10) whose policy grants more than the page means to: deletes
first, guarded updates the same way. It does not apply where the policy already keys on `auth.email()`; the filter then
repeats the policy, which is harmless. Tightening the policy itself is a governance change (Rule 10 a3), not a page fix.

## See also

- [`docs/reference/data_write_rollback.md`](../reference/data_write_rollback.md)
- [`adr-student-detail-aggregate-disclosure-control`](adr-student-detail-aggregate-disclosure-control.md)
