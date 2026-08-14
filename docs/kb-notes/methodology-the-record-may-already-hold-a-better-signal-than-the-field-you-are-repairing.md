---
title: Before repairing a field, check whether the record already holds a better signal
created: 2026-08-14
updated: 2026-08-14
tags: [methodology, data-quality, cip, top-cip, curation]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/noncredit_cip_category_scope]]"
  - "[[docs/cip_crosswalk_lessons]]"
  - "[[docs/kb-notes/methodology-top-is-a-last-in-line-signal]]"
artifacts:
  - docs/noncredit_cip_category_scope.md
---

# Before repairing a field, check whether the record already holds a better signal

**Claim.** When a field looks wrong across thousands of rows, the cheapest and
most likely explanation is not that thousands of people erred — it is that the
field is being *read* for something it was never meant to carry, while the
record already holds a field that answers the question directly. Look for that
field before scoping a correction project.

## The instance

The CIP work opened with what looked like a large data-quality backlog: **1,796
noncredit programs sitting on a "wrong" credit CIP code**. The obvious project
was a TOP-driven correction pass — derive the right noncredit code from each
program's TOP and propose a repair at scale.

Then Jenni supplied the actual rule: a Short-Term Vocational noncredit program is
CIP **`32.0111` plus a secondary credit CIP aligning with the subject**. The
1,796 "wrong" codes **were the secondary CIP**. Nothing was broken. The
correction project would have overwritten a correct, deliberately-assigned value
with a derived one — and it would have been *scored as a success*, because every
row would afterwards have matched the rule we had wrong.

The corroboration was already sitting in the data too: **1,789 of the 1,796
(99.6%)** already fall inside their own TOP's crosswalk. The college's assignment
and the TOP agree. There was never a discrepancy to repair.

## Why this is not just "understand the domain first"

The useful, checkable version is narrower:

- **A defect rate that implausibly high is a hypothesis about your reading, not
  about the data.** 56% of a population being wrong the same way is evidence of a
  systematic cause. The systematic cause is usually a second, legitimate meaning.
- **Ask what the field is doing for the people who fill it in.** They are not
  populating your model; they are satisfying a rule of their own. Find that rule
  before proposing a value against it.
- **The signal you need is often already in the record.** Here it was literally
  the field being "corrected". Elsewhere it has been `map_colleges.variants`
  (existed, empty), `landing_page_url` (populated for 123 of 130 colleges, never
  read), `map_colleges.entity_kind` (tagged every sandbox org `test`, never read)
  and `statewide_data.js` `authoritative_recs` (published on the Fact Sheet,
  unread by Sierra). **Curated-data-nobody-reads is this project's most repeated
  finding** — check for it before generating a new derivation.

## The check, before scoping any bulk repair

1. **State the rule the field is supposed to satisfy, and name who told you.** If
   nobody with authority has said it, that is the first task — not the repair.
2. **Ask what fraction of rows violate it.** If it is a large minority or more,
   suspect the rule, not the rows.
3. **Look for a second field that already encodes the answer** — including the
   one you were about to overwrite.
4. **Check whether two independent signals already agree.** If they do (99.6%
   here), there is no discrepancy; there is a reading error upstream of you.
5. Only then scope the repair — and confirm the category **before** concluding
   anything downstream that is funding-bearing.

## The cost of getting it wrong

A blanket rule (*all noncredit programs → `32.0111`*) shipped and was reverted
about twenty minutes later. Had it persisted, it would have been wrong for the
**majority** of 3,187 programs, and — because CTE noncredit is funding-bearing
while non-CTE is not — a wrong category is not a cosmetic error. The guards that
survived the revert are the durable part: **computed never stored** (a
rule-driven default must not be written as thousands of curator revisions nobody
made), and a proposal must say `proposed · COCI has X` rather than borrowing
*"changed from"*, which claims a human decision that never happened.

## See also

- `[[docs/noncredit_cip_category_scope]]` — the authority for the population and the ladder
- `[[docs/kb-notes/methodology-top-is-a-last-in-line-signal]]` — why TOP could not have decided this anyway
- PRs #1192 (the blanket rule) → #1194 (the revert) → #1198 / #1199

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
