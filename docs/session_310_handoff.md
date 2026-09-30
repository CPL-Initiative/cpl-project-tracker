---
title: Session 310 handoff — the funding, Sierra and credential chains, joined; sheet 11 answered
date: 2026-09-30
session: 308 + 309 in one session (SkyBracket, SkyCensus), carrying Sam's credential-catalog side session
tags: [handoff, implementation-funding, public-view, reporting-box, sierra, partner-crosswalks, credential-registry, decision-sheet]
status: current
---

# You are Session 310

Your moniker is **SkyTandem**. Sam joined the two chains on 2026-09-30: he pasted the Sierra handoff (309)
into the funding session (308), and one session carried both. **This file replaces 308 and 309 for both
lanes.** Sam also ran a credential-catalog side session the same evening (session_015L54vXSQjVaGJRhbTZsXyN).
It wrote no handoff and asked this one to carry its lane, **partner-crosswalks**; its section is below.
Ashley's OpenClassrooms session (#1760) touches none of this. Whoever checkpoints next takes the next free
number (`ls docs/session_*_handoff.md`).

## First, in this order

1. **Sheet 11 is answered; build what it ruled.** Sam answered all nine at 22:48Z (each his own call; rulings in
   the lanes). To build: rename the three renamed credentials in the CER with the old names as aliases
   (exhibit-canonicalization); route issuer-skill verification by college faculty and a statewide group through
   Governance and the privacy ADRs before any table (Rule 10 a3). The Pedro note is his to edit and send.
   **Read sheet 12's replies** ([B6Gnzmha8kArgiSQw1SdTe](https://claude.ai/artifact/B6Gnzmha8kArgiSQw1SdTe),
   collection `replies`): one card, the CCSF check he marked Later.
2. **Read the Sierra smoke on `main` after #1796** (`cpl-chat-smoke.yml`): 7c, 7s and 7p should all pass.
   Then `pg_stat_statements` for `search_college_programs` after a day of traffic; it read a mean of
   2,353 ms before the stored vectors.
3. **The three roster names** (*LA Swest*, *Mt San Antonio*, *MiraCosta*) resolve to no `map_colleges` row,
   so those colleges' staff see no reports on My College. Add them through the identity crosswalk's own
   reviewed PR ([college-district-identity](reference/lanes/college-district-identity.md)), then re-read.
4. **After 2026-10-05, read the first Monday watch run's PR** (routine `trig_019tTcardPfntFz6ctWU9Jg1`). File
   anything its body flags for `cpl_memory`; the run itself has no Supabase.

## Sam's decisions this run

- The Public view, verbatim: *"1. For all text views possible on this tab eliminate the gray background box
  to simplify visually 2. Eliminate any unnecessary line breaks or font size changes with text to enhance
  readability 3. Delete the 2 marked chips 4. Fix the dates so they are appropriately spaced."*
- *"Go ahead with the stored column"* (Sierra's catalog timeout) and *"Go ahead with the stored vectors"*
  (Sierra's program search).
- One session for both chains; *"Hold it until the credential session finishes"* (this checkpoint).
- **Sheet 11 (22:48Z):** P1 keeps every applied unit, Needs Action included; the Timeline size, the card boxes and
  the sign-in form stay; he edits the Pedro note himself; **both** college faculty and a statewide group verify
  issuer skills; rename the three in the CER with aliases; the issuer hosts are added; the CCSF check later.
- `cpl_memory`: `sam-public-view-text-tweaks-2026-09-30`, `sam-stored-title-norm-go-2026-09-30`,
  `sam-two-chains-one-session-2026-09-30`, `sam-stored-vectors-go-2026-09-30`.

## What shipped

- **#1788** Public view: no boxes around text, the prose size, each minimum condition one paragraph, the two
  chips internal only, the Timeline dates in their own spans.
- **#1789** `chatbox_college_courses.title_norm` (stored); `program_typical_courses()` reads it: 88 ms.
- **#1790** the Reporting box's college half: `cpl_funding_my_reports()` + My College's *Reported
  expenditures*; DR-09; two seeded a11y targets.
- **#1791, #1794** smoke 7c/7s: an absence claim fails, an absence report passes, and the 7s negation takes a
  word boundary (`no` had matched inside *notes*).
- **#1796** `coci_college_programs` stores its four search vectors; `search_college_programs` builds none.
  Output identical on 13 term sets; a 4-term call 1,473 → 415 ms, the 30-term call 2,724 → 1,943 ms. Receipt
  `kb/receipts/search_college_programs_stored_vectors_2026-09-30.sql`.
- KB notes: [`methodology-a-revoke-must-name-every-role-the-grant-named`](kb-notes/methodology-a-revoke-must-name-every-role-the-grant-named.md),
  [`methodology-a-stored-value-does-not-follow-its-function`](kb-notes/methodology-a-stored-value-does-not-follow-its-function.md)
  (now with the second use and the tie-safe baseline).

## The credential lane, carried (partner-crosswalks)

- **#1793** `kb/_build_it_ai_credential_catalog.py` → `kb/it_ai_credential_catalog.json`: 1,165 IT,
  cybersecurity, data and AI credentials, 62 issuers, 48 articulated in MAP; CIP sector and CIP 2020 code
  on every row; `kb/reference/industry_credential_watch.json` (issuer-verified, `formerly` for renames);
  `kb/_diff_credential_watch.py`.
- **#1795** the watch agent is armed on Sam's go: Mondays 05:51 Pacific, first run 2026-10-05, no claude.ai
  connectors ([`credential_watch_agent`](reference/credential_watch_agent.md)).
- Vault: samueltlee/CPLBrain#207 and #208 (deck `20260929_CPL_IT_AI_Credentials_3.pptx`, the catalog
  workbook, the braindump *the CER as a phase 0 credential registry*).
- `cpl_memory` tag `credential-registry` (six rows).
- **Open work:** a badge-course slide and an issuer-skills example once the Monday runs harvest skills;
  then a mock-up of the CER with the second population (credentials not yet in MAP) for Sam to react to.
- **Rulings:** sheet 11 cards 7-9 (above); the watch page records the hosts.

## For Sam, when he asks (the Pedro draft he will edit; sheet 12's CCSF check)

**The note to Pedro** (his to edit and send, sheet 11 card 5):

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
Francisco's applied units, and which exhibits are they from?"* The live answer's figures are on sheet 12's card.

## Read in order

1. This file. 2. [`implementation-funding`](reference/lanes/implementation-funding.md),
[`sierra-retrieval-corpus`](reference/lanes/sierra-retrieval-corpus.md) (its S308/S309 paragraph) and
[`partner-crosswalks`](reference/lanes/partner-crosswalks.md). 3. The S308 section of
[`cpl_funding_lessons`](cpl_funding_lessons.md) and the 2026-09-30 section of
[`cpl_assistant_lessons`](cpl_assistant_lessons.md). 4. `cpl_memory` tags `implementation-funding`, `sierra`,
`credential-registry`.

## Patterns that worked

- **Reproduce a UI ask in Chromium with the live config injected** (route-fulfill `cpl_funding_config`).
- **Measure a slow RPC in its PostgREST shape** and read `pg_stat_statements`; a direct call hides variance.
- **Baseline only what the order determines.** A full ordered hash changed between two identical calls
  (rows sharing college and title swap); hash the (college, title) sequence plus the sorted row set, and
  expect a limit that cuts through a tie to have more than one set.
- **Measure the next step before taking it:** dropping the materialized copy measured 177 vs 190 ms, so it stayed.
- **Test a caller-scoped function as a caller:** `set_config('request.jwt.claims', …)`; reset it after.
- **Mutation-check every guard,** one break at a time.

## Safety patterns

- ⚠️ **Revoke from `public, anon, authenticated`** (Rule 10 b2), then read `proacl`.
- ⚠️ **A generated column keeps its old values** when its function changes: recompute in the file that
  defines the function (`cx_search_norm` now does), never name it in an INSERT.
- ⚠️ **The repo's Supabase guard refuses `create`, `do` and `truncate` in `execute_sql`, temp tables
  included.** Measure with `explain analyze` selects; DDL goes through `apply_migration`.
- ⚠️ **A wording guard must pass the sentence the doctrine recommends;** fixture both directions, and give
  a negation a word boundary.
- ⚠️ `CLAUDE.md` (59,975 of 60,000), the funding lane (19,997 of 20,000) and partner-crosswalks (19,817)
  sit at their caps: move settled text out before adding.
- ⚠️ `scripts/check_generated.sh` after the last edit, then push; install `openpyxl` first in a fresh sandbox.

## Carryover

- From 308: Sam's rewritten Scenario 2 script (ElevenLabs, then rebuild `n2`); P1's new wording and the
  When and Where on the reported cards, his to type; card 7's two old lines; the Supabase tool setting question.
- The style guide's rendered-text divergences wait with the other UI changes; cpl-knowledge-base#24 waits on Sam.
- Not refreshed: `kb/README.md`, `README.md` (no structure change); the Pipeline tab (the pipeline did not move).
