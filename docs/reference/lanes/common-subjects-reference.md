---
title: "Common Subjects Reference (CSR) — one Common SUBJ per MQ discipline — lane state"
created: 2026-10-19
updated: 2026-10-19
tags: [reference, roadmap-lane, csr, commons, subjects, mq-disciplines]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference/lanes
related:
  - "[[CLAUDE]]"
  - "[[commons]]"
  - "[[mid_lifecycle]]"
  - "[[discipline-crosslist]]"
---

# Common Subjects Reference (CSR)

**What this lane is:** the four-letter Common SUBJ each MQ discipline carries, the key layer every M-ID is
minted under (Sam, 2026-07-10: *"they are used to mint MIDs; the CSR, CCR, CER constitute the heart of our
ability to scale CPL statewide then nationwide"*), run the Commons way: a Progress dash on the tab, a
procedure per card, a daily scan, a run log. Sam, 2026-10-19 (vault braindump
`braindump-2026-10-19-1515-finish-the-csr-first-and-the-commons-as-moonshot`): *"I should finish the CSR
before moving to CCR, both of which will enable the PR data to be crosswalked and adoptable"*; *"a CSR dash
card for each key step that needs monitoring and stores the procedures needed by agents"*; the prize is *"a
nearly fully automated, self-curating and monitoring procedure to maintain the CSR"*. The re-mint
mechanics and the M-ID invariants stay in [`mid_lifecycle`](../mid_lifecycle.md) (Phase 1e); this file
holds the reference's state.

**Vocabulary (Sam, 2026-10-19: "MQ Discipline ... will help me remember the difference between SUBJECT and
DISCIPLINE").** The **MQ discipline** is the handbook's discipline (`kb/reference/mq_disciplines.json`, 248
titles). The **Common SUBJ** is our four-letter code for it, the M-ID's prefix. The **Local SUBJ** is each
college's own code, display only. One Common SUBJ belongs to one MQ discipline; one MQ discipline usually has
one Common SUBJ and an umbrella has several
([`reference-common-vs-local-subj-and-discipline-cardinality`](../../kb-notes/reference-common-vs-local-subj-and-discipline-cardinality.md)).

## Status

**LIVE: the Progress view (S425, 2026-10-19).** `#canonical-subj4` opens on Progress, the Commons' dash
for this reference, drawn by the shared `commons_progress.js` from `canonical_subj4.js`'s definitions: the
run status from `kb/status/subjects.json`, the headline pair, five milestones with You are here, a card for
each of Sam's eight steps (consolidated to eight: the MQ list, the C-ID and CCN tables, the authority rule,
the identity codes, one code one MQ discipline, the cross-listings, confirmation, the scan), the procedures
under the cards (`kb/csr_procedures.json`) and the findings waiting on a judgment. Reference is the table.
A count opens the table with its filter; `#canonical-subj4/<filter>`, `/progress`, `/reference` and `/check`
route from the address (the Commons' step 3). Guard `tests/csr_progress.test.js`; a11y
`canonical-subj4-progress-dark`, `canonical-subj4-reference`.

**The definition of complete (proposed, a card for Sam):** an MQ discipline with courses whose Common SUBJ a
person confirmed, that follows the authority rule, and that is in no collision with another MQ discipline.
Measured 2026-10-19: **121 of 147** (122 confirmed, Auto Body Technology in the AUTB collision). Confirmed
alone would read 122; adding "no finding needing a judgment" would read 106.

**The measured state, 2026-10-19:**

| what | measure |
|---|---|
| MQ disciplines in the handbook's index | 248 (19th edition, read 2026-05-20, re-validated 2026-07-10); 147 carry courses on the map, 101 carry none |
| picks confirmed by a person | 122 of 147 (the live table holds 121 code rows, all Sam's; Physical Education Disabled Students is a seed-only override); 25 on the data's modal code, 13 of them on the authority's own code; 0 through the validate stage |
| on an authority code | 13 CCN, 20 C-ID, 114 minted here, 23 with a chip; 0 missed alignments |
| C-ID and CCN subject codes | 65 C-ID (495 descriptors), 14 CCN (58 courses), both read 2026-05-20; 11 shared; CCN adds ASTR, PSYC, STAT; CCN wins on Psychology (PSYC over PSY) |
| identity codes | 282 codes on 75,581 minted identities: 145 canonical, 27 umbrella, 110 strays on 396 identities (101 of the stray codes sit on identities with no discipline) |
| collisions | 1 (AUTB: Auto Body Technology and Agricultural Business and Related Services, whose one identity is AUTB M1006 Supervision and Management in Agriculture) |
| by design | 4 umbrellas carrying 27 codes beside their own; 3 fan-in alias families (4 alternate names); the FTVE pair; the five agriculture family codes both agriculture umbrellas carry |
| the daily scan | 63 findings: 25 unconfirmed, 19 aligned, 13 weak mnemonics, 2 modal choices without a note, 1 collision, 1 anchor key in the dead format, 2 divergences a note records |
| procedures | 8 written, 5 in force; 2 quarterly routines to build; the cohort confirm proposed |

**The machine side.** `kb/_csr_trail.py --latest` runs daily from `daily-dashboard.yml` after the picks sync
and before the Commons build, read-only, and writes `kb/csr_out/latest.json` (the nine canon rules, every
minted identity's code under `_mid_codes`); a session's run without the flag writes the dated receipt too.
Its missed-alignment rule honors a recorded note (CMUS, HIT). `kb/_apply_canonical_subj4.py` and the tab's
overlay read the pick's reviewer from the code row (a cohort's later note had been read as the pick's
reviewer on eleven entries; the next daily sync rewrites the seed). The tab's SUBJ check reads a code both
agriculture umbrellas declare, and a fan-in pair both entries declare, as shared by design. The tab's C-ID index
now takes a descriptor ending in X (172 of the 495, in 17 subjects: ADS, the three agriculture families, ALTF, AUTO,
BIOT, BSOT, CMUS, DENA, DMGR, EET, EMS, FIRE, HIT, WELD, WWTR), which it had skipped since May, so its chips and
suggestions saw 48 of the 65 C-ID subjects.

**The Commons row** (`kb/_build_commons_status.py` `row_subjects`) reads the same files: the settled pair,
four known issues with owners, the procedures in force, and deep links into the table.

## Sam's eight steps against the record (S425's check, 2026-10-19)

- **CSR before CCR.** Right for the keys: every M-ID is minted under the discipline's Common SUBJ, so a
  settled code first makes every later re-mint cheap. The Program Requirements crosswalk runs through the
  identity layer's memberships (a program's course joins an identity by its COCI control number; the Common
  SUBJ is the identity's label): 67,991 of 84,475 distinct active courses on active programs (80.5%) sit under
  an identity, and 21,761 of the 141,738 COCI courses in the July extract (15.4%) have none, because the
  identities were minted from the 2026-05-22 extract and not re-minted since. The CCR's freshness is the
  larger crosswalk dependency; the CSR's stability is what makes that re-mint safe.
- **One process for every common reference.** Ruled on Open Asks Sheet 95 card 1 (2026-10-18): the shared
  module and the run logs landed; the per-reference Progress views are the open step, in the order Exhibit,
  Course, CR, Subjects. Sam's ask today moved Subjects first; his call, recorded.
- **Steps 1 and 2, the quarterly routines.** The three sources were last read in May (the handbook re-validated
  in July). A check that diffs and opens a card is the right routine; an automatic rewrite would rename
  disciplines that carry picks. The tab's handbook link answers 404; c-id.net is unreachable from the sandbox and
  reachable from a runner. Eight MQ names carry a Title 5 section number from the PDF read and one is cut short
  (*Disabled Student Programs and*); Sam's rename ruling of 2026-09-08 has not been applied.
- **Step 3, the AG example.** The authority recode of 2026-09-03 already adopted every four-letter CCN and C-ID
  code (0 missed alignments); the five hyphenated agriculture codes became the umbrella codes AGAB, AGAS, AGEH,
  AGMA, AGPS, and Sam ruled AGRI and AGPR the residuals (cards 4 to 6). The chips on the Agriculture row say the
  authority splits the discipline finer than the MQ list does; they are sub-subjects, not a competing code. What
  step 3 can still do is empty the residual: 216 Agriculture identities sit under AGRI, and a Jev sitting can
  propose a family for each from the descriptors, Sam confirming, the rest staying residual (a card). The
  strays are the unnecessary codes: 110 on 396 identities, most on identities with no discipline yet.
- **Steps 4 and 5.** Every MQ discipline with courses carries a code; the 101 without courses take one when
  their first course appears. One code sits on two MQ disciplines (AUTB); the identity layer's disagreements
  (a few rows under a code naming a second discipline; 96 identities with no discipline) are the cross-list
  and discipline-blank lanes' work. The tab's own check had listed six ruled sharings as collisions.
- **Step 6, cross-listed.** Three senses, and the procedure names all three: a code on two disciplines (a
  collision, forbidden except a ruled fan-in), a discipline with several codes (an umbrella, allowed), and a
  course with two homes (`xdisc`, 9 rows today; 535 candidates wait on the cross-list sheet).
- **Steps 7 and 8.** Both exist as rulings (2026-09-03, items 1 to 3 and 15) and run at every mint and re-seed;
  the one live difference is Psychology (PSYC over PSY). What was missing was the measure on a dash.
- **Forgotten along the way.** The validate stage has never been used (0 of 147 in five months); the scan was
  never scheduled and asked two settled questions at every run; the tab's C-ID index skipped 17 of the 65
  subjects; the Jev next step for the CSR (fix AUTB, the 2026-09-29 sheet's card 11) is still open.

## RULED on Open Asks Sheet 99 (Sam, 16:37Z 2026-10-19, all six his own call; `cpl_memory` `sam-sheet-99-rulings-2026-10-19`)

1. **settled**: complete means confirmed by a person, on the authority rule, in no collision (the pair as built).
2. **on**: the nightly procedure confirms the authority-coded picks under a cohort reviewer, insert-only with a receipt
   (to build: `kb/csr_procedures.json` `confirmation` on, the run and its receipt).
3. **agab**: Agricultural Business and Related Services takes AGAB; its one identity is re-keyed under the playbook.
4. **sitting**: a Jev sitting proposes a C-ID family for each AGRI identity, Sam confirms, the rest stay residual.
5. **hide**: the Validate column and word leave the tab until the faculty-published moment; the data stays.
6. **rename**: the eight Title 5-numbered names and the cut-short one take the handbook's spellings, through the alias
   file and one re-key window.

None is applied yet (S425 recorded them at context EMERGENCY); Session 426 executes them in this order. The six cards
left the vault builder in CPLBrain#395.

## NEXT

The two quarterly routines on a runner (the handbook check; the C-ID and CCN refresh), probe mode first; the
cohort confirm once ruled; the strays through the discipline-blank worklist and one re-key window; the dead
handbook link replaced by the live page; the Commons' remaining Progress views (Exhibit, Course, CR) from the
same module.
