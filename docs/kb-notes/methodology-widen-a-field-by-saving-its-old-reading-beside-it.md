---
title: Widen a field by saving its old reading beside it
created: 2026-10-31
updated: 2026-10-31
tags: [methodology, curation, kb-curation, cer, data-model]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[cer_v2_redesign_lessons]]"
artifacts:
  - exhibits.js
  - kb/_apply_credential_review.py
  - tests/credential_review_sites_test.py
---

# Widen a field by saving its old reading beside it

> **When a curated field that holds one value must hold a list, save the list in a new field and, in the same save, the list's old reading in the old field; resolve the two by content first and time second.**

## Context

Sam asked for many training sites per credential (2026-10-30: *"could be multiple training sites"*). The CER stored one
trainer per credential in `kb_curation` (`training_agency_override`), and five readers took it as one string: the bake,
the overlay sync's Mode A3, MAP export, the CER tab and the Exhibits builder. Lessons: `docs/cer_v2_redesign_lessons.md`,
2026-10-31 (SkyBunchberry).

## The claim

**Write two fields in one save.** The new field holds the list (`training_sites_override`, JSON of `{site, college}`).
The old field gets what an old reader should see, the sites joined (`training_agency_override`). Every one-value reader
is right from the first save without a change, and only the readers that want the list learn the new field. The
migration then happens reader by reader, each in its own PR, with nothing broken in between.

**Resolve by content, then time.** Two surfaces can now write the old field: the new editor (with its list) and the old
one (a single value). The list stands unless the old field says something other than the list's joined reading *and*
was saved after the list. Content comes first because the editor's own two writes are separate requests, so the old
field routinely lands a few milliseconds after the list; a rule of "the newest row wins" would read every save from the
new editor as an edit from the old one.

**One rule, one table of cases.** Where the rule is implemented twice (a browser reading live rows, a nightly sync
reading the same rows), a single test runs one table of cases through both.

## How we got here

#2603 built the Exhibits tab's credential panel. The first sketch replaced the trainer field and would have touched
five readers and their tests; the second wrote only the list and left the readers to disagree with the editor. Writing
both, and stating the precedence once, kept the change to the editor, the sync and the bake.

## When this applies (and when it doesn't)

It applies when the old field has a faithful reading of the list (a join, a first element, a count). It does not apply
when the list changes the meaning of the old value (one issuer of record against several co-equal issuers, say): there
an old reader shown a joined string would be wrong, and the readers have to learn the list first. Removal is the other
boundary: a promotion that only fills or appends (Mode A3) never takes a removed list entry out of the canonical store,
so the overlay, which the readers consult, has to stay the truth for the list.

## See also

- `docs/kb-notes/methodology-paginate-postgrest-reads.md`: the live read of the two fields pages the same way.
- `docs/reference/lanes/cer-procedures.md`: the credential panel.
