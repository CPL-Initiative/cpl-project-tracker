---
title: A person's write must survive the next reload
created: 2026-10-08
updated: 2026-10-08
tags: [methodology, supabase, governance, program-requirements-harvest]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[program_requirements_harvest_lessons]]"
  - "[[adr-student-detail-aggregate-disclosure-control]]"
artifacts:
  - chatbox/supabase_program_record_verdicts.sql
  - kb/_program_requirements_load.py
  - tests/program_record_verdicts_sql_test.py
---

# A person's write must survive the next reload

> **When a person's write lands in a column a pipeline also writes, the database has to carry the person's value forward on every later write, or the next reload erases it with nothing to show it happened.**

## Context

The Program Requirements tab gained its first write on 2026-10-08 (Sam, Open Asks Sheet 51 card 1): a reviewer's
Confirm marks a program record `checked`, and Sierra quotes checked records to the public. The same column is
written by the loader, `kb/_program_requirements_load.py`, whose upsert sets `checked` from the repo's files on every
reload. Lessons: `docs/program_requirements_harvest_lessons.md`, S347.

## The claim

**Ask what else writes the column before shipping a person's write to it.** A write path that touches only its own
table looks complete in review. A column shared with a pipeline has two writers. The pipeline's next run is the one
that wins, and it raises no error. The person sees their reading vanish, or never learns that it did.

**Put the rule in the database, beside the column.** A trigger on the shared table applied the latest verdict on
every insert and update. A reload could then reset `checked`, and the trigger restored the person's value before the
row landed. Fixing the loader instead would protect only that one writer, and the next writer (a delta receipt, a
rename, a future script) would reopen the gap.

**Bind the person's value to what they read.** The verdict holds a fingerprint of the requirements the page showed.
The trigger carries the reading forward only while the row's fingerprint still matches. A reload of the same
requirements keeps it. A reload that changes a block drops it, and the record waits for a person to read it again,
which is the same rule the repo's own readings follow (`requirements_md5()`).

**Prove it with a test that cannot leave a row.** The self-test ran as a migration whose last statement raises with
its results, so Postgres rolled everything back. Its ten cases included the reload that resets the column and the
reload that changes a block. A read-back confirmed no verdict, no changed record and no migration was recorded.

## How we got here

S347 built the write path from the approved mock-up (`prototype/roep_record_flags_mockup.html`). The log, the
function and the grants were straightforward. The question that changed the design was what happens to a Confirm when
the loader runs next. The answer was that it would be overwritten. The trigger
(`program_requirement_records_follow_verdict`) and its fingerprint guard came from that question. Case 4 of the
rolled-back self-test reset `checked` the way a reload would, and the trigger kept the reading. Case 5 changed a
block, and the reading lapsed. `tests/program_record_verdicts_sql_test.py` pins both rules in the source.

## When this applies (and when it doesn't)

It applies to any human write to a field a generator, loader, receipt or nightly job also sets. Examples in this
repo are a curator's override beside a computed value, a verdict on a generated record, and a status a cron
refreshes.

It does not apply when the person's write goes to a column only people write (an append-only log, a note field).
There the log itself is the record and no reload touches it. It also does not apply when the pipeline reads the
person's value back as an input (the CER curation flow reads `kb_curation` before it builds), because then the
pipeline already carries the value forward.

## See also

- `chatbox/supabase_program_record_verdicts.sql`: the trigger, the fingerprint and the gated write.
- `kb/receipts/program_record_verdicts_2026-10-08_s347.sql`: the apply, the read-backs and the self-test.
- CLAUDE.md Rule 8: a human-sourced memory row may not be silently superseded by a session's inference. This note is
  the same principle, applied to data.
