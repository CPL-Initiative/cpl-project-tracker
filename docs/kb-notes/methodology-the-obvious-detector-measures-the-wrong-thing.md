---
title: "The obvious detector measures the wrong thing: boilerplate is not repetition"
created: 2026-09-10
updated: 2026-09-10
tags: [methodology, curation, descriptions, ccr, skyview]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
---

# The obvious detector measures the wrong thing

Sam, 2026-09-10: *"Some of the course descriptions have boilerplate test for
descriptions."*

The obvious detector for boilerplate is repetition. Text that appears on many
courses is boilerplate; text that appears once is a description. It is the first
thing anyone reaches for, it is cheap to compute, and on this corpus it is
almost exactly backwards.

## What repetition actually finds

Measured against `unified_courses_member_desc.js`, 127,266 non-empty
description rows across 46,317 identities. The six most-reused strings:

| rows | what it is |
|---|---|
| 239 | the C-ID descriptor for introductory statistics |
| 190 | the C-ID descriptor for introductory psychology |
| 183 | the C-ID descriptor for academic reading and writing |
| 181 | the C-ID descriptor for US and California government |
| 178 | the C-ID descriptor for public speaking |
| 178 | the C-ID descriptor for critical thinking |

That is 1,149 rows of the **best** text in the corpus. Colleges publish it
identically because a statewide descriptor exists and they adopted it — which
is the outcome the whole C-ID program is for. A repetition detector ranks them
first and deletes them.

The one real placeholder does show up in that list, at rank 10 with 49 rows:

> This text field is blank due to the March 2012 data migration and CCC
> Curriculum Inventory Version 1 protocol. In an effort to maximize the accuracy
> of your college data in the CCC Curriculum Inventory, it is recommended but
> not required that the college takes action to amend via "correction" this data
> field to update the inventory record.

345 characters whose entire content is that the field is blank. It is not junk
because it repeats. It is junk because of what it says.

## The detector that works

Match text that **announces it is not a description**, anchored to the whole
trimmed string. Two shapes cover the corpus:

- the migration boilerplate, identified by its opening clause;
- a whole string that is only an empty marker (`N/A`, `TBD`, `.`, `xx`) or only
  the words *Experimental course* / *Experimental Offering in \<subject\>* /
  *See Experimental Offerings*.

**247 of 127,266 rows — 0.19% — across 171 identities and 107 distinct
strings.** Small enough that every one of the 107 was read before the rule
shipped, which is the point: a rule you can audit in full is a different kind of
object from one you can only sample.

The consequences on the card are the measurement, not a guess. 65 identities go
from quoting a stub to saying they have no description. 106 keep a real
description and stop losing the medoid vote to stubs beside them — because the
medoid is *the description most typical of the others*, and where two of three
colleges publish the identical migration notice, the notice is the most typical
thing on the card and wins outright. It is not a tie the rule breaks.

## Never by length

"Study of selected works of Shakespeare." is 38 characters and a real
description. Every length threshold that catches `N/A` also catches it. The
short-string bucket in this corpus holds both, mixed, and only the words tell
them apart.

## The false positive the measurement could not see

The first version of the rule allowed a comma inside the subject clause and put
no bound on it, so *"Experimental course in advanced welding techniques,
covering plate and pipe."* matched — a real sentence, discarded. **No such row
exists in the corpus today, so re-running the measurement said 247 either way
and looked like confirmation.** The predicate's own unit check caught it, with
strings written to be near the boundary rather than sampled from the data.

A measurement over the data you have cannot find a rule that is wrong about data
you do not have yet. Write the adversarial strings by hand.

## What is not hidden

Nothing is deleted. The map panel still prints the stub verbatim when a curator
opens that college's course — that list is each college's own record, and
suppressing it would launder the data. The outline's member list marks the row
with the word *placeholder*. Only the derived layers — the quoted description
and the imputed skills — refuse to build on text that says nothing, and the
Description layer says how many rows it set aside and why.

The two silences are different work: *nobody wrote one* is a gap to fill, and
*somebody wrote a placeholder* is a row to correct. A card that renders them
identically hides the second one.

## See also

- `prototype/ccr_universe.js` — `olIsPlaceholder`, `olDescs`
- `tests/ccr_skyview_outline.test.js` §12
- [`methodology-a-check-on-the-message-says-nothing-about-where-it-lands`](methodology-a-check-on-the-message-says-nothing-about-where-it-lands.md)
