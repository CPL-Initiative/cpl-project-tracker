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

**The definition of complete (ruled, Sheet 99 card 1, 2026-10-19):** an MQ discipline with courses whose Common
SUBJ is confirmed (by a person, or by the nightly procedure where the code is the authority's own), that follows
the authority rule, and that is in no collision with another MQ discipline. Measured 2026-10-19: **121 of 147**
(122 confirmed, Auto Body Technology in the AUTB collision). Confirmed alone would read 122; adding "no finding
needing a judgment" would read 106.

**The measured state, 2026-10-19:**

| what | measure |
|---|---|
| MQ disciplines in the handbook's index | 248 (19th edition, read 2026-05-20, re-validated 2026-07-10); 147 carry courses on the map, 101 carry none |
| picks confirmed by a person | 122 of 147 (the live table holds 121 code rows, all Sam's; Physical Education Disabled Students is a seed-only override); 25 on the data's modal code, 13 of them on the authority's own code, which the nightly confirm takes from its first run; 0 through the validate stage, whose column left the tab (ruling 5) |
| on an authority code | 13 CCN, 20 C-ID, 114 minted here, 23 with a chip; 0 missed alignments |
| C-ID and CCN subject codes | 65 C-ID (495 descriptors), 14 CCN (58 courses), both read 2026-05-20; 11 shared; CCN adds ASTR, PSYC, STAT; CCN wins on Psychology (PSYC over PSY) |
| identity codes | 282 codes on 75,581 minted identities: 146 canonical, 26 umbrella, 110 strays on 396 identities (101 of the stray codes sit on identities with no discipline); measured 2026-10-19 after the AGAB re-key |
| collisions | 0 since the AGAB re-key of 2026-10-19 (S427); the AUTB pair was the one: Agricultural Business and Related Services now AGAB, AUTB M1006 re-keyed to AGAB M1006; AUTB M1071 Import Body Customizing returned to Auto Body Technology on Sam's Sheet 101 ruling (22:38Z), so no row sits off its code |
| by design | 4 umbrellas carrying 26 codes beside their own; 3 fan-in alias families (4 alternate names); the FTVE pair; the five agriculture family codes both agriculture umbrellas carry, one of them (AGAB) now also Agricultural Business's own |
| the daily scan | 61 findings (2026-10-19, after the AGAB re-key and the M1071 ruling): 24 unconfirmed, 19 aligned, 13 weak mnemonics, 2 modal choices without a note, 1 anchor key in the dead format, 2 divergences a note records; no collision |
| procedures | 8 written, 6 in force; 2 quarterly routines to build; the cohort confirm on since 2026-10-19 (S427), first run after the merge |

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
  step 3 can still do is empty the residual: 404 identities sit under AGRI (measured 2026-10-19 by key prefix in
  `kb/coci_minted_courses.json` and `kb/coci_minted_singletons.json`: 86 clustered, 318 stand-alone; 403 under
  Agriculture), and a Jev sitting can propose a family for each from the descriptors, Sam confirming, the rest
  staying residual (a card). The
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

1. ✅ **settled** (S427): complete means confirmed, on the authority rule, in no collision (the pair as built). The
   pair as built counts a cohort's confirmation beside a person's (`isConfirmed` reads the stamp, not who made it), so
   with ruling 2 on, the words on the headline and the Commons row say *confirmed (by a person, or by the nightly
   procedure where the code is the authority's own)*; a code this reference minted still waits for a person.
2. ✅ **on** (S427): `kb/_csr_confirm_authority.py`, run nightly at 08:17 UTC by `csr-confirm.yml` (governance DR-04).
   It confirms a pick whose code is the CCN subject code or one of the C-ID subject codes, that no person has confirmed,
   and that no finding names except the two that corroborate (`cs7_unreviewed`, the state it clears; `cs4_aligned`,
   the alignment it rests on), under `csr-confirm-authority@bot`, as the tab's own save would write it: a fresh read
   first (a live code row, whoever wrote it, holds the save), the receipt under `kb/csr_out/confirm/` before the insert,
   duplicates ignored; `--undo` is one delete by the cohort and clears the seed's stamps. The offline plan on
   2026-10-19 names the thirteen: Anthropology, Astronomy, Communication Studies, Economics, English, History and
   Mathematics on CCN; Chemistry, Earth Science, Engineering, Geography, Philosophy and Physics/Astronomy on C-ID.
   ✅ **The first run landed** (2026-10-19: preview run 39331625751 listed the thirteen, none held; the `on` run
   39332576973 inserted all thirteen at 22:09:21Z, receipt commit `2ef70839` under `kb/csr_out/confirm/`; read back
   live: 13 rows under `csr-confirm-authority@bot`). The cron carries it from here; the daily sync folds the rows
   into the seed, so the Commons row reads 122 by a person and 13 by the procedure after the next daily run.
   `tests/csr_confirm_authority_test.py` (26) guards the selection, the receipt-before-write and the undo.
3. ✅ **agab** (S427, the re-key window of 2026-10-19): Agricultural Business and Related Services takes AGAB (the
   pick under `csr-s427@bot` with the ruling in its note, `kb/receipts/csr_agab_pick_2026-10-19_s427.sql` through
   `supabase-migrate.yml`, run 39333423480, both rows live 22:15:43Z under `csr-s427@bot`; the seed edited to match); AUTB M1006 Supervision and Management in Agriculture is
   AGAB M1006 (kept number) with the discipline Sam's own 2026-07-13 curation row names, under
   `kb/_agab_one_remint.py` (ten gates), receipt `kb/agab_remint_out/2026-10-19/alias_map.json` registered in
   `kb/alias_chain.py`, the post-apply chain run (promotions, crnc mirrors, the re-seed, the authority seed, the
   row audit: `subject_collision_signal` 113 to 114), SkyView's layout re-keyed and its payloads rebuilt. The
   scan reads 0 collisions, 146 canonical codes and 26 umbrella codes. The tab's SUBJ check learned the ruled
   shape: a family code one MQ discipline is canonical on while the umbrellas declare it is shared by design
   (`tests/csr_shared_family_code.test.js`). **Live steps after the merge:** dispatch `supabase-rekey.yml` with
   `alias_map_path=kb/agab_remint_out/2026-10-19/alias_map.json` (the one live row keyed to AUTB M1006, Sam's
   discipline row, follows the id), and read the pick back under `csr-s427@bot`.
   ✅ **AUTB M1071 Import Body Customizing returned to Auto Body Technology** (Sam, [Open Asks Sheet 101](https://claude.ai/artifact/5EiqK5XHMrTA4MubpAqyLT)
   card 1, 22:38Z 2026-10-19, his own call: autobody; `cpl_memory` `sam-sheet-101-ruling-2026-10-19`). His 2026-07-13
   curation row had set its discipline to Agricultural Business and Related Services too, while its title, its TOP
   (0949.00 Automotive Collision Repair) and its two members (Body Panel Customizing, Auto Body Technology at Cerritos;
   Import Body Customizing, Automotive Technology at Victor Valley) read auto body; a human-sourced row is never
   superseded by a session's inference (Rule 8), so it was his card. One discipline field, no re-key: the record and the
   overlay say Auto Body Technology (receipt `kb/receipts/csr_m1071_autobody_2026-10-19_s427.json`), his row updated
   under his own email with `reviewed_at` set to the ruling, and the AGAB pick's cohort note saying how he ruled, through
   `kb/receipts/csr_m1071_autobody_2026-10-19_s427.sql` (guarded UPDATEs, before-values in the header;
   `supabase-migrate.yml` run 39339086222 applied it, status 201, receipt commit `f3a5b6da`; read back live 23:14Z:
   his row reads Auto Body Technology at 22:38:25Z under his email, the note names Sheet 101). Agricultural Business
   carries AGAB M1006 alone; the row audit's
   `subject_collision_signal` reads 113 (114 before), the scan 0 collisions and no row off its code.
4. **sitting** (S430, run; the confirmation is Sam's): Jev proposed a C-ID family for each of the 404 AGRI identities
   twice (runs 39352507898 and 39353307914, 0 errors each), read from the job logs because the artifacts sit on a
   blob host the sandbox refuses: `kb/jev_agri_families/2026-10-20.json`. The two sittings agree on 397 of 404; 229 stay
   AGRI both times. **56 pass the gate** (both sittings name the same family, both at 0.9 or above): AGPS 31, AGEH 10,
   AGMA 7, AGAB 4, AGAS 4. Ten of the 56 are forestry courses (Forestry/Natural Resources is its own MQ discipline)
   and two are wine appreciation, so the proposal is the other 44. The first sitting's log printed `plain` for any
   non-zero probability; `kb/_jev_agri_families.py` now prints the value (cpl-project-tracker#2268).
   **NEEDS SAM 7 (S430):** confirm the 44 at the gate (they re-key to their family codes under the playbook, one dry
   run and one alias map), the 56 including forestry and wine, or review each.
5. ✅ **hide** (S427): the Validate column, its control and the *Validated* filter left the Reference view; the data
   (`validated_at`, `validated_by`) stays in the store, the seed and the sync, and the stage returns at the
   faculty-published moment. The Progress card's foot now names the nightly procedure instead of the unused stage.
6. ✅ **rename** (S430, one window): the eight Title 5-numbered names and the cut-short one take `mq_sections.json`'s
   `index_name` verbatim, *(DSPS)* and *(ESL)* included (Sam's reply: *"Rename as the handbook spells them"*).
   `kb/_mq_title5_rename.py` renamed 355 whole strings across eight stores (the identity files 329), dropped the
   now-redundant `index_name`, and filed the nine under `renamed` in `kb/discipline_aliases.json`, which
   `kb/_alias_canon.py` resolves for the inference passes and the CSR's chips never read. The four live `kb_curation`
   rows (Sam's ESLN and BSKL picks keyed `_CANON_SUBJ4::<old name>`, the discipline rows on BSKL M9001 and M9252) moved
   by guarded UPDATE, `kb/receipts/mq_title5_rename_2026-10-20_s430.sql`, before-values and rollback in it.
   `tests/mq_title5_rename_test.py` (7) fails on an old spelling in any store.

S425 recorded them at context EMERGENCY; S427 executes them in this order (1, 2 and 5 landed together as one code
change; 3, 4 and 6 are data windows and follow). The six cards left the vault builder in CPLBrain#395.

## NEXT

Ruling 4 waits on Sam's card (NEEDS SAM 7); on his answer, the confirmed identities re-key to their family codes
under the playbook (one dry run, one alias map, one window, modeled on `kb/_agab_one_remint.py`). The two quarterly routines on a runner (the handbook check; the C-ID and
CCN refresh), probe mode first; the strays through the discipline-blank worklist and one re-key window; the dead
handbook link replaced by the live page; the Commons' remaining Progress views (Exhibit, Course, CR) from the
same module.
