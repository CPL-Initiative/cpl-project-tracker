---
title: A person-named value can live in a memory ruling, not only in a curation row
created: 2026-11-28
updated: 2026-11-28
tags: [methodology, person-settled, curation, cpl-memory, commons]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[methodology-a-curator-ruling-must-be-attributed-data]]"
  - "[[methodology-a-settled-ruling-does-not-enforce-itself]]"
  - "[[common-subjects-reference]]"
artifacts:
  - kb/_apply_minted_codes_s749.py
  - kb/_alignment_remint_dryrun.py
---

# A person-named value can live in a memory ruling, not only in a curation row

> **Before a machine overwrites a value as "nobody's", check the memory rulings as well as the curation table: a person
> may have named it in conversation, and the ruling row is the only place that says so.**

## Context

The Commons rule is that a person's save is terminal: a machine reopens it only on new source evidence. Code that
enforces the rule usually looks for a person's row in `kb_curation` (a reviewer who is not a `@bot` cohort). On
2026-11-28 (S749, #3952) the minted-codes applier did exactly that, found no person row on Home Economics: Noncredit,
and re-coded HMEN. Sam had named HMEN on 2026-11-22, in session, and the session recorded it as a `cpl_memory` ruling
(`r-noncredit-four-mq-codes-sam-2026-11-22`), never as a curation row.

## The claim

A person settles a value in two ways: a save in a tool, which writes a curation row, and a ruling in conversation,
which a session writes to `cpl_memory` and a lane. The second is as terminal as the first. A guard that protects
person-settled values must read both, or carry the ruled values into the code as a named, cited constant
(`PERSON_NAMED = {"CTZN", "HLSN", "HMEN", "DSPN"}` in `kb/_apply_minted_codes_s749.py`, with the slug beside it).

The cheaper fix, at the time a ruling is recorded, is to file a curation row for it too, so the one guard the code
already has sees it. Where the ruling names a whole class rather than a value, the constant with its slug is the record.

## How we got here

S749 applied Sam's Nov 28 alignment (56 minted codes). HMEN was in the PR's first change list; a follow-up commit on
the same PR, citing the 2026-11-22 ruling, kept HMEN and froze the four noncredit codes Sam named that
day, and the re-mint dry run (#3955) carries the same list as `KEPT_ANSWER`. Recorded as
`p-person-settled-lives-in-memory-too-s749`.

## When this applies (and when it doesn't)

It applies to any bulk write that decides whether a value is machine-owned: codes, titles, folds, disciplines. It does
not mean every memory row is a ruling: only a row whose `verified_by` names a person and whose text settles a value
(Rule 8's second paragraph). A machine's own proposed row is not person-settled.

## See also

- [`methodology-a-settled-ruling-does-not-enforce-itself`](methodology-a-settled-ruling-does-not-enforce-itself.md)
- [`methodology-a-curator-ruling-must-be-attributed-data`](methodology-a-curator-ruling-must-be-attributed-data.md)
- `docs/common_subject_code_tab_lessons.md`, S749
