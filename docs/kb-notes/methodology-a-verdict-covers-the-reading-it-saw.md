---
title: A verdict covers the reading it saw
created: 2026-10-05
updated: 2026-10-05
tags: [methodology, program-requirements-harvest, extraction, human-review, provenance]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/program_requirements_harvest_lessons]]"
  - "[[docs/kb-notes/methodology-an-additive-sync-cannot-carry-a-correction]]"
artifacts:
  - kb/_program_requirements_score.py
  - kb/_program_requirements_load.py
  - kb/_program_requirements_file.py
  - kb/program_requirements_pilot/reviewed_readings.json
---

# A verdict covers the reading it saw

> **One-sentence summary** — When a person approves a model's extraction, bind the approval to a fingerprint
> of what they read, and let a later run add only fields a machine can check against the source; a rerun that
> replaces the record carries the approval onto something nobody read.

## Context

The program requirements harvest checks each catalog record four ways, and the fourth is a person's reading
(Sam read the 20 pilot records on 2026-10-04). Record shape 3 (S334) asked the model for one more thing, the
program outcomes as printed, which meant rerunning the extraction on records Sam had already approved. The
loader keyed his verdict by file name, so a rerun would have kept the label "checked" on whatever the new run
wrote.

## The claim

### A rerun changes what it was not asked to change

Rerun 37345734457 returned the requirements Sam read, byte for byte, on 14 of the 20 programs. The other six
differed in words the model chooses afresh each run: a section heading, a trailing colon on a block name, an
option group called `anatomy_physiology_sequence` one day and `Anatomy/Physiology sequence` the next, and on
one record the alternatives' units filled in. None of it changes what a student must take. All of it is
something the person never saw.

### So hold the verdict to a fingerprint, not a name

`requirements_md5()` hashes the parts a person reads (the program's figures and every block) and leaves out
the parts a machine checks. `reviewed_readings.json` stores that hash for each verdict, and the loader counts
the verdict only while the record still carries it. The guard costs one comparison and makes the failure
loud: a rerun that moves a block drops the record to "not yet checked" until someone reads it again.

### And let the rerun add, not replace

The filer (`kb/_program_requirements_file.py`) keeps a read record's blocks, notes and reasons, and takes
from the new run only the outcomes. Every outcome must appear in the same catalog text word for word, and the
re-scored record must pass as it did. The person's reading still describes the record. The new field has its
own proof, so it needs no second reading.

## How we got here

S334 built record shape 3 (PR CPL-Initiative/cpl-project-tracker#1870), measured the six relabeled records,
and chose the graft over asking Sam to re-read six records whose requirements had not changed. A side effect
confirmed the design: because the display facts depend only on the requirements, the display build stayed at
799bfb9a7dbf, and Sierra's facts did not move. The Mt. San Antonio follow-up (#1871) filed four more records
the same way.

## When this applies (and when it doesn't)

It applies wherever a model's output is approved by a person and later regenerated: requirements records,
crosswalk proposals, any extraction a curator signs. It needs a split between fields a person must judge and
fields a deterministic check can prove. Where no such check exists for the new field, the rerun's output is a
new reading and goes back to a person. When the person's reading itself was wrong, the fix goes into the
prompt or the procedure and the record is read again; the fingerprint then changes on purpose.

## See also

- `[[docs/program_requirements_harvest_lessons]]` — S334, lessons 1-2 and 6a
- `[[docs/kb-notes/methodology-an-additive-sync-cannot-carry-a-correction]]` — the opposite direction: a
  correction a sync will not carry
- PR CPL-Initiative/cpl-project-tracker#1870 and #1871

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
