---
title: A settled ruling does not enforce itself — the consumer has to change
created: 2026-08-13
updated: 2026-08-13
kb-status: published
tags: [methodology, memory, governance, data-quality, process, cpl-memory, pitfall]
obsidian-folder: cpl-project-tracker
related:
  - "[[docs/sierra_credit_recs_lessons]]"
  - "[[docs/kb-notes/playbook-cpl-memory-auto-write-at-checkpoint]]"
---

# A settled ruling does not enforce itself — the consumer has to change

## The claim

Writing a decision down — even correctly, even somewhere sessions genuinely read —
changes nothing about code that already made the wrong choice. A ruling is
enforced only when a **consumer** is changed or a **check** is added. Otherwise the
same symptom is re-reported indefinitely, and each report costs a human their
credibility a little.

## What happened

`cpl_memory` carried this row, verified, for weeks:

> **`statewide-is-138-not-84`** — *"Two data files disagree on which credentials are
> statewide, and the smaller number is a strict SUBSET… **Use the adoption file.**"*

Meanwhile `kb/_sync_credential_catalog.py` kept publishing Sierra's `statewide`
flag from `credential_reference_data.js` — the file the note says not to use. 84
titles flagged statewide; the adoption file carries 137. **42 credentials that
exist in both read as local**, including Paramedic License, CompTIA, OSHA 10/30 and
the NCCER and Carpenters ladders.

So Sierra contradicted the organization's own public Fact Sheet, which reads the
adoption file.

Sam reported the symptom **across several sessions**: *"your analysis says EMT and
Paramedic aren't marked as statewide in MAP, but they show up correctly in the fact
sheet."* He was right every time. The note that would have explained it was sitting
in the table, `status='verified'`, unread by the one script that needed it.

## Why the memory table did not save us

The Rule 8 loop is *ingest* (write at checkpoint) and *query* (read at session
start). Neither touches **code that already exists**. A note is a message to future
*readers*; a sync script is not a reader. The gap is structural, not a lapse:

- the note was written **after** the sync;
- nothing re-audits old consumers when a new ruling lands;
- the ruling's subject (`statewide`) does not appear in the sync's diff surface,
  so no reviewer would connect them.

## The rule

When a ruling establishes that **source A beats source B**:

1. **Grep for every reader of B, that day.** The ruling is not filed until you have
   the list. `grep -rl` on the artifact filename is usually enough.
2. **Change the consumer, or add the check.** Preferably in the same PR as the
   note. Here: the sync now UNIONs both files, so the flag cannot regress to the
   narrower source.
3. **Record the blast radius as a number** in the note (*"42 rows differ"*), so a
   future session can tell in one query whether it has drifted back.
4. **When a human re-reports the same symptom, treat the repetition itself as the
   finding.** Someone saying it twice means the first fix didn't reach the code.
   That is a stronger signal than the symptom.

## The tell

A human reporting the *same* discrepancy in more than one session, especially when
they are confident and specific about it. Don't re-derive their claim — go looking
for the consumer that never got the memo.

## Worked example

2026-08-13: `statewide_titles()` added to `kb/_sync_credential_catalog.py`, unioning
`statewide_data.js` into the flag; 42 live rows corrected; sync now reports
**126 statewide, up from 84**. Twelve titles remain statewide in the adoption file
but absent from `chatbox_credentials` entirely — recorded, not yet closed.
