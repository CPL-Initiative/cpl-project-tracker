---
title: An additive sync cannot carry a correction
created: 2026-10-05
updated: 2026-10-05
tags: [methodology, sync, cer, issuing-agency, kb-curation, supabase]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/program_requirements_harvest_lessons]]"
  - "[[docs/kb-notes/methodology-two-mode-sync]]"
  - "[[docs/kb-notes/adr-supersede-dont-mutate-synthetic-layer]]"
artifacts:
  - kb/_apply_credential_review.py
  - kb/_fold_unclassified.py
  - kb/_cer_decision_apply.py
  - kb/cer_decisions_out/2026-10-05-2/plan.json
---

# An additive sync cannot carry a correction

> **One-sentence summary** — When a file is fed by a sync that only adds (fill when empty, append when absent,
> never overwrite), a correction has to be made in the file itself and at every source the sync reads, in the
> same window; a new override row alone appends beside the old value or changes nothing.

## Context

Sam ruled on open-asks sheet 39 (2026-10-05) that OSHA takes one name as issuer across the Credential
Reference (CER), and that a trainer is never the issuer. The card proposed writing issuer override rows into
`kb_curation`. Reading the two syncs that carry those rows into `kb/credentials.json` showed the proposal would
not have worked. Story: [`program_requirements_harvest_lessons`](../program_requirements_harvest_lessons.md), S333.

## The claim

### Read the merge rule before choosing the write

`kb/_apply_credential_review.py` (curator overrides) and `kb/_fold_unclassified.py` (triage assignments) both
promote an issuer into `credentials.json` the same way. They fill the first record when its issuer is empty and
unreviewed. They append a new record when no record names that issuer under any spelling: exact, trailing
acronym, or containment of eight characters or more. They never overwrite. Rule 4 makes this right for its
purpose, since one credential may have several certifying bodies. It also means the sync can only add.

Measured against the OSHA ruling, an override row would have done three different wrong things:

- **On the two OSHA cards** (issuer *U.S. Department of Labor*), it appends OSHA as a second issuer.
- **On the OSHA 10-hour Construction entry** (issuer CTCNC, the trainer), it appends OSHA beside CTCNC.
- **On the two Agriculture entries** (issuer *Occupational Safety and Health Administration (OSHA)*), it does
  nothing, because the new spelling contains the old.

### Change the file and every source together

A correction under an additive sync has two parts, and they land in the same window:

1. **The file.** Edit the record itself in a pull request; `git revert` is its rollback.
2. **Every source the sync reads.** If any source still holds the old value, the next nightly run appends it
   back. The OSHA cards' *Department of Labor* came from three `_UNCLASSIFIED::` triage assignments, rows the
   card never named. Find each source by searching every namespace the syncs read, never only the one the
   card is about.

A source row a curator wrote changes by guarded update, and only where the reviewed plan names it.
`kb/_cer_decision_apply.py` carries this as `replaces: {value, reviewer_email}`. The row changes only while it
still holds exactly that value from that reviewer, and the receipt keeps the before-value, reviewer and date
for `--rollback` (Rule 10a, a2).

### When the mechanism on a ruled card turns out wrong

The ruling is the outcome. The session corrects the mechanism and tells the person **before** any write: which
of their rows change, and how many more than the card said. Here the card named two of Sam's rows and the real
set was five. The correction went into the sheet's own thread with a "hold" offered, then the dry-run, then the
commit.

## How we got here

S333 widened the applier to the agency fields, then read `promote_issuers` before writing the plan, to see how
an override reaches `credentials.json`. The add-only rule was in its docstring ("an existing record's issuer is
never overwritten"). Tracing the OSHA cards' issuer to `kb/unclassified_assignments.json` found the three
triage rows. The commit replaced all five at 16:28Z, and each was read back.

## Related

- [`methodology-two-mode-sync`](methodology-two-mode-sync.md): which syncs are safe to rerun.
- [`adr-supersede-dont-mutate-synthetic-layer`](adr-supersede-dont-mutate-synthetic-layer.md): why raw keys are
  never edited. This note edits a synthetic record's field, which is ours.
