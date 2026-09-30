---
title: Session 310 handoff — the funding and Sierra chains, joined; sheet 10 is the queue
date: 2026-09-30
session: 308 + 309 in one session (SkyBracket, SkyCensus)
tags: [handoff, implementation-funding, public-view, reporting-box, sierra, map-custom-reports, decision-sheet]
status: current
---

# You are Session 310

Your moniker is **SkyTandem**. Sam joined the two chains on 2026-09-30: he pasted the Sierra handoff (309)
into the funding session (308), and one session carried both. **This file replaces 308 and 309 for both
lanes**; there is one chain again. Ashley ran her own session the same evening (the OpenClassrooms crosswalk,
#1760); it touches none of this. Whoever checkpoints next takes the next free number (`ls docs/session_*_handoff.md`).

## First, in this order

1. **#1791** (smoke 7c/7s wording checks): merge it on a green `test`, then dispatch `cpl-chat-smoke.yml`
   on `main` and read the run. 7c's catalog probe already passes (50 colleges, run 36779373913).
2. **Read sheet 10's replies FIRST** ([DSky8iUvxg5WeemRm4wpW2](https://claude.ai/artifact/DSky8iUvxg5WeemRm4wpW2),
   collection `replies`; sheet 9's store too, XnHFDLys7WRGjHC26NY9KP, for card 1). Six cards: P1 at Needs
   Action; the Timeline at the prose size; the priority cards keep their boxes; the My College sign-in
   placement; send Pedro the two-view note; the CCSF check in Sierra. When a card is answered, change its
   lane's NEEDS SAM marker in the same PR and drop the card from `kb/_build_open_asks_decision_sheet.py`.
3. **The three roster names** (*LA Swest*, *Mt San Antonio*, *MiraCosta*) resolve to no `map_colleges` row,
   so those colleges' staff see no reports on My College. Add them through the identity crosswalk's own
   reviewed PR ([college-district-identity](reference/lanes/college-district-identity.md)), then re-read.
4. **`search_college_programs` (smoke 7p)** averages 2.3 s over 1,297 calls against anon's 3 s. Measure it
   the way S308 measured `program_typical_courses` (EXPLAIN on the PostgREST shape, `pg_stat_statements`).

## Sam's decisions this run

- The Public view, verbatim: *"1. For all text views possible on this tab eliminate the gray background box
  to simplify visually 2. Eliminate any unnecessary line breaks or font size changes with text to enhance
  readability 3. Delete the 2 marked chips 4. Fix the dates so they are appropriately spaced."*
- *"Go ahead with the stored column"* (Sierra's catalog timeout).
- One session for both chains; *"no other sessions live"*, then *"Ashley has another session live"*.
- `cpl_memory`: `sam-public-view-text-tweaks-2026-09-30`, `sam-stored-title-norm-go-2026-09-30`,
  `sam-two-chains-one-session-2026-09-30`.

## What shipped

- **#1788** Public view: no boxes around text (both views), the prose size (.92rem), each minimum condition
  one paragraph, the two chips internal only, the Timeline dates in their own spans. C9e now pins .92rem.
- **#1789** `chatbox_college_courses.title_norm` (generated, stored; receipt in `kb/receipts/`);
  `program_typical_courses()` reads it: 88 ms, identical output.
- **#1790** the Reporting box's college half: `cpl_funding_my_reports()` + My College's *Reported
  expenditures* (sign-in · not listed · none yet · table); DR-09; two seeded a11y targets.
- **#1791** (open) `answer_must_not_claim_absence` for smoke 7c/7s.
- KB notes: [`methodology-a-revoke-must-name-every-role-the-grant-named`](kb-notes/methodology-a-revoke-must-name-every-role-the-grant-named.md),
  [`methodology-a-stored-value-does-not-follow-its-function`](kb-notes/methodology-a-stored-value-does-not-follow-its-function.md);
  a section added to `methodology-an-absence-in-the-data-is-a-statement-about-the-data`.

## For Sam, when he asks (sheet 10 cards 5 and 6)

**The note to Pedro** (send only on his word):

> Pedro, the nightly load reads two of your custom report views, and they now disagree on units applied to
> the CPL plan. Rows at Applied to CPL Plan sum to 171,078 units in View_CollegeExhibitCRByCatalogYear_APIDataset
> and 162,603 in View_StudentDetailsCredits_APIDataset, a gap of 8,474 units across 26 colleges.
>
> Most of the gap has one shape. For 253 combinations of college, exhibit, catalog year and credit
> recommendation, at 24 colleges, the catalog-year view reports exactly twice the units the student view
> reports, with the same number of students. One example: college 79, exhibit MAPSAS-ASL2-1-001, catalog year
> 2024-2025, credit recommendation "3 hours in CSU GE C2". Both views count 918 students. The student view
> sums 2,754 units, three per student, which matches the recommendation. The catalog-year view sums 5,508.
> The remaining 1,692 units are smaller differences spread across other rows.
>
> Could you check whether that view's applied-credits sum picks up a second row per student for these
> records? The ASL example should show it quickly.

**The CCSF question for Sierra:** *"What is the military and non-military split of City College of San
Francisco's applied units, and which exhibits are they from?"* The live answer's figures are on card 6.

## Read in order

1. This file. 2. [`implementation-funding`](reference/lanes/implementation-funding.md) and
[`sierra-retrieval-corpus`](reference/lanes/sierra-retrieval-corpus.md) (its S308/S309 paragraph).
3. The S308 section of [`cpl_funding_lessons`](cpl_funding_lessons.md) and the 2026-09-30 section of
[`cpl_assistant_lessons`](cpl_assistant_lessons.md). 4. `cpl_memory` tags `implementation-funding`, `sierra`.

## Patterns that worked

- **Reproduce a UI ask in Chromium with the live config injected** (route-fulfill `cpl_funding_config`).
- **Measure a slow RPC in its PostgREST shape** and read `pg_stat_statements`; a direct call hides variance.
- **Test a caller-scoped function as a caller:** `set_config('request.jwt.claims', …)` with an address
  picked inside SQL, printing counts only; reset the claim after.
- **Mutation-check every guard,** one break at a time.

## Safety patterns

- ⚠️ **Revoke from `public, anon, authenticated`** (Rule 10 b2, corrected this run), then read `proacl`.
- ⚠️ **A generated column keeps its old values** when its function changes: recompute in the schema of
  record; never name it in an INSERT.
- ⚠️ **A wording guard must pass the sentence the doctrine recommends;** fixture both directions.
- ⚠️ The funding lane (19,997 of 20,000 bytes) and `CLAUDE.md` (59,988 of 60,000) sit at their caps: move
  settled text out before adding.
- ⚠️ `scripts/check_generated.sh` after the last edit, then push; install `openpyxl` first in a fresh sandbox.

## Carryover

- From 308: Sam's rewritten Scenario 2 script (ElevenLabs, then rebuild `n2`); P1's new wording and the
  When and Where on the reported cards, his to type; card 7's two old lines; the Supabase tool setting question.
- The style guide's rendered-text divergences wait with the other UI changes; cpl-knowledge-base#24 waits on Sam.
- Not refreshed: `kb/README.md`, `README.md` (no structure change); the Pipeline tab (the pipeline did not move).
