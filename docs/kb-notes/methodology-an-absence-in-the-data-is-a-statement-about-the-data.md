---
title: An absence in the data is a statement about the data — say what the catalog shows, never that the county has none
created: 2026-09-18
updated: 2026-09-18
tags: [methodology, sierra, house-voice, retrieval, epistemics]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[methodology-a-place-is-an-anchor-not-a-college]]"
  - "[[methodology-what-might-qualify-is-a-different-question-from-who-already-grants-it]]"
  - "[[reference-cccco-house-voice]]"
artifacts:
  - chatbox/supabase/functions/cpl-chat/index.ts
  - chatbox/smoke_test.sh
---

# An absence in the data is a statement about the data — say what the catalog shows, never that the county has none

> **One-sentence summary** — When the data we hold lists nothing for a place, the honest sentence names the instrument ("the COCI catalog lists no LVN entry program at an Orange County college") and the related entries it does hold, because "no Orange County college teaches LVN" is a claim about the world that a reader who knows the county will call flat wrong.

## Context

cpl-chat v69 answered Sam's Orange County question with *"No college in
Orange County currently teaches an LVN program in the catalog I have."* Sam,
2026-09-18: *"She says no OC colleges have LVN, which is flat wrong."* The
export the assistant reads holds no Vocational Nursing entry program at an
Orange County college — its LVN entries there are the LVN-to-RN bridges at
Cypress, Golden West and Saddleback, and no course under TOP 1230.20 — so
the sentence was what the catalog shows, phrased as a fact about the county.
Every "no college in the place" line in the assistant's context had told the
model to *"say so plainly"*, a rule written the day before to stop it
hedging.

## The claim

1. **Name the instrument.** "The COCI catalog lists no LVN entry program at
   an Orange County community college" is true and checkable; "no Orange
   County college teaches LVN" is neither ours to assert nor true to a reader
   who knows the bridges, the ROPs, or a program the export missed.
2. **Name what the instrument does hold there.** The related entries in the
   place — the bridges, the noncredit courses, the same TOP at a different
   award — are what the knowing reader is thinking of. Naming them shows the
   absence is measured, and it tells the visitor why those entries are not
   the answer (a bridge is for people who already hold the license).
3. **Then lead with the nearest that do**, with county and distance, so the
   absence is a step in the answer rather than its headline.
4. **"Plainly" and "as a fact about the world" are different instructions.**
   The hedge Sam rejected earlier (*"my data only surfaced two"*) hid the
   catalog; the flat claim he rejected here overstated it. The sentence that
   satisfies both is positive, active, and anchored to the named source —
   the house voice's own rule.

## How we got here

Measured 2026-09-18 on `coci_college_programs`, `coci_college_offerings` and
`chatbox_college_courses`: three Orange County LVN entries, all bridges;
zero rows under TOP 1230.20 in the county. The prospective rule, the three
catalog builders, the place block and the offerings rule were reworded
(PR #1611); smoke 7c fails any sentence that states the absence as Orange
County's, and passed on the candidate. Which Orange County college runs an
LVN entry program remains Sam's to name (`s271-sam-lvn-oc`); the wording
holds either way.

## When this applies (and when it doesn't)

Every surface that speaks from a dataset to a reader who may know the
ground: Sierra, the My College page, a college report, a funding table. "Not
in this dataset" is already the rule for a college absent from the credit
data; this is the same rule for a program absent from a catalog. It does not
apply where the dataset is the system of record for the claim — an
articulation absent from MAP is absent, because MAP is where articulations
live — and even there the sentence names MAP.

## See also

- `[[docs/cpl_assistant_lessons]]` — 2026-09-18 (S275) entry
- `cpl_memory` `sam-v69-orange-county-answer-three-misses-2026-09-18` — Sam's words
- PR #1611 — the reworded lines and the 7c assertion

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
