---
title: "Common Subjects Reference (CSR) — one Common SUBJ per MQ discipline — lane state"
created: 2026-10-19
updated: 2026-11-23
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
DISCIPLINE").** The **MQ discipline** is the handbook's discipline (`kb/reference/mq_handbook_20th.json`, the 20th
edition of November 2026: 251 disciplines; the 19th-edition read, `kb/reference/mq_disciplines.json`, holds 248). The
**Common SUBJ** is our four-letter code for it, the M-ID's prefix. The **Local SUBJ** is each college's own code,
display only. One Common SUBJ belongs to one MQ discipline; one MQ discipline usually has one Common SUBJ and an
umbrella has several
([`reference-common-vs-local-subj-and-discipline-cardinality`](../../kb-notes/reference-common-vs-local-subj-and-discipline-cardinality.md)).

## Status

**ON #3726 (S717, open; merge it first): a Common SUBJ for every MQ discipline.** The reference was seeded from the
M-IDs' disciplines, so 95 of the handbook's disciplines had no code and the statewide calls could pick only an
existing one (`f-csr-seeded-from-mids-left-95-mq-disciplines-uncoded-s717`;
[`methodology-a-reference-seeded-from-its-consumers-cannot-see-what-they-never-reached`](../../kb-notes/methodology-a-reference-seeded-from-its-consumers-cannot-see-what-they-never-reached.md)).
`kb/_csr_propose_codes.py` proposes one for each and `kb/_csr_assign_codes.py --apply` wrote all 95 into
`kb/discipline_canonical_subj4.json` (source `assigned`, reviewer `csr-s717@bot`, confidence, level, basis; receipt
`kb/receipts/csr_assigned_codes_s717.json`, undone by `git revert`): 2 from C-ID (ACCT, HOSP), 18 from codes colleges
use (LING at 24 colleges, AERO, FINA from FINANCE, ADST from C-ID's ADS), 75 minted and read for connotation (CRMT,
DSCS, MDVT, SANI, RSPC). FLTA (Foreign Languages: Filipino) and ESTI (Esthetics' M-IDs) were taken: Flight Attendant
Training is FLTR (Sam's pick, formerly FATR), Estimating ESTG. Of the 251 disciplines, 156 read a person's pick and 95
an assigned code (8 Confident, 84 Likely, 3 Leaning: ECOL, HOSP, UASY); no M-ID sits under an assigned code yet.
`statewide_subject_codes.json` and `local_subject_recommendations.json` were rebuilt, since both read the code list.

**The 20th edition and the MQ view (#3726).** `kb/_mq_handbook_parse.py` writes `kb/reference/mq_handbook_20th.json`
from the CO's PDF (address and sha256 recorded, the PDF out of the repo): 251 disciplines, 3 new since the 19th
(Counseling: Mental Health is printed in the master's list and missing from the index), each with its list type per CCR 53407(a)(2)-(4)
(master's 91, a degree in the discipline plus experience 20, any degree plus experience 146) and the Title 5
provisions read from printed pages 56-67 (printed page = PDF page - 6: 53410.1 licenses, 53412 to 53417). The
19th-edition `kb/reference/mq_sections.json` folds the second list into the third (`f-mq-20th-edition-vs-dataset-s717`).
`kb/_mq_view.py` writes `kb/status/mq_view.json` nightly: each discipline's list type, provisions, code and confidence,
M-IDs, vocational TOP share, local codes, noncredit categories and *To look at* (46 today: 26 list type against
vocational share, 15 names, 4 codes on a C-ID or CCN prefix attributed elsewhere, 3 new). Guards
`tests/mq_view_test.py`, `tests/csr_code_history_test.py`. Mock: https://claude.ai/artifact/SHS5eNN4nb5vLkNCzzWvVE.

**RULED (Sam, 2026-11-23).** `r-csr-codes-settled-on-list-confidence-not-confirmation-sam-2026-11-23`: every MQ
discipline takes a code without waiting for a course; a code on the list is settled; confidence informs, and a person
looks only at a low one; Sam changes a code with a note on the CSR tab; a check flags a collision. It supersedes item 6
of the 2026-09-03 authority sheet (C-ID's ACCT as a chip on Business). The check: `kb/_apply_canonical_subj4.py`
refuses a save that takes a code in use; `mq_view.json` names a code on two disciplines (none) or on another's C-ID or
CCN prefix. `f-mq-handbook-revised-yearly-sam-2026-11-23`: the handbook changes yearly and codes rarely, so
`record_former` keeps `{code, title, until, by, note}` in an entry's `formerly` when a save changes its code.
`r-top-vocational-flag-sets-mq-type-sam-2026-11-23`: the TOP vocational asterisk sets a course's MQ type (master's or
experience), never its discipline ([`methodology-top-is-a-last-in-line-signal`](../../kb-notes/methodology-top-is-a-last-in-line-signal.md)).
`r-mq-view-more-than-codes-sam-2026-11-23`: the MQ view joins disciplines, codes and decisions. **DECIDED**
`d-next-cip-for-mq-type-sam-2026-11-23`.

**Correction:** commit `8afaa532` says "LING now calls LING"; it does not. The statewide calls still read BUSI for
ACCT, ACCTG, ACC and ACTG (1,012 courses), ANTH for LING, CULN for HOSP, REAL, HUMA or HIST for the religion codes,
JOUR for MCOM and AVIA for AERO: the model votes from where the M-IDs sit. They move at the re-point re-mint.

**LIVE: the Progress view (S425, 2026-10-19).** `#canonical-subj4` opens on Progress, the Commons' dash
for this reference, drawn by the shared `commons_progress.js` from `canonical_subj4.js`'s definitions: the
run status from `kb/status/subjects.json`, the headline pair, five milestones with You are here, a card for
each of Sam's eight steps (consolidated to eight: the MQ list, the C-ID and CCN tables, the authority rule,
the identity codes, one code one MQ discipline, the cross-listings, confirmation, the scan), the procedures
under the cards (`kb/csr_procedures.json`) and the findings waiting on a judgment. A count opens the List on
its filter; `#canonical-subj4/<filter>`, `/progress`, `/list` and `/check` route from the address (the Commons'
step 3). Guard `tests/csr_progress.test.js`; a11y `canonical-subj4-progress-dark`.

**LIVE: the List view (2026-11-01).** `#canonical-subj4/list`, the third word beside Progress and Reference, is the
Catalog Commons' shared List (`commons_list.js`, lazy-loaded) with this reference's spec in `canonical_subj4.js` (Sam,
2026-11-01: *"I want one now for each of our Catalog Commons groups"*): one row per MQ discipline (147; 246 once #3726 lands), A to Z, with its
Common SUBJ, status (confirmed by a person, by the nightly procedure `csr-confirm-authority@bot`, by a session cohort,
or open), any collision, the Local SUBJs colleges use and how many, local courses, M-IDs, authority and note. Edit, Edit
every row and the Status drawer's Confirm this pick write through one path (`canonCheck`, `writeCanon`,
`writeNote`): the same `_CANON_SUBJ4::` kb_curation rows, no new write surface. No flag
column (no flag field) and no find and replace (a replace on Common SUBJ hands one code to several MQ disciplines; a
note where no code row exists stands in as the review, so a replace across notes would confirm picks). Guard
`tests/csr_list.test.js`; a11y `canonical-subj4-list`, `canonical-subj4-list-dark`. **A pick waiting for a person
opens the List on Open** (`#canonical-subj4/open`, `TO.confirm`): the Commons card's unconfirmed issue and the Progress
view's *Confirm them* once led to a filter whose box saved only a changed code, so Sam found nothing to press
(2026-11-03). **The List is the workspace
(2026-11-04, the List norms):** over the List, the engine's line of the subjects row in `kb/status/commons.json` (Open
and Confirmed by a person set the List's own filters), and the Progress view's opened page folded behind *Hide the
summary* (prefix `csl-pg-`). A press on a row opens its edit row and its side panel: its local subjects (most used first, each
share), the codes it shares (a collision, or shared by design; another MQ discipline's name opens its panel),
*Confirm this pick* with its own status line, and the authority, note and identity codes folded. Guard
`tests/csr_list_panel.test.js`. **The Reference view retired into the List (2026-11-04, SkyPawpaw):** its lists are
List filters (*No code yet*, *Confirmed*, *On the CCN code*, *On the C-ID code*, *An official code differs*, *Proposed*),
and every Progress count, old address (`/reference` too) and quickstart hint opens the List; a TOP column takes the TOP
filter's place (a fuzzy filter only); the head carries the sign-in and *Run the SUBJ check*, whose *show* opens a
discipline's panel; the panel folds the CPL window and the C-ID and CCN courses on its codes, and lists the *Codes it
could take* (the box's suggestions, each a *Take* word). Guards `tests/csr_list_reference_port.test.js` and the
table's suites ported onto the List (`csr_alias_chip`, `csr_authority_chip`, `csr_fl_split`, `csr_ui_tweaks`,
`csr_subj_check`; harness `tests/csr_list_harness.js`). The table's rules left the tab's `<style>` (both HTMLs) and
the injected box CSS with it. **The List as Sam's workspace (SkyJujube, 2026-11-04/05; the story in `docs/common_subject_code_tab_lessons.md`):** saves
read the session at write time (`freshSess`) and a lapsed sign-in says so; a row press edits the row and moves the panel
(engine `editByRow`); *Check alignment* audits a typed code (`edit.extra`; Exhibits carries its own); a code edit seeds
the Note, keeping a code asks its reason; the panel's local codes show Colleges beside Courses (from
`kb/discipline_local_courses/`, `kb/_build_discipline_local_courses.py`), name their courses, and carry *Use <code>*;
a row saved since the scan ran leaves *A scan finding to confirm or note*; *What a Common SUBJ is*
(`prototype/common_subj_explainer.html`). Every Commons view: *Hide the top*, side panels resize, both remembered.
**Sync:** `phase-1e-sync.yml` is manual, and a code change must land with its re-mint: the 2026-11-05 00:15Z sync put
Sam's new codes in the file ahead of the M-IDs, broke `tests/csr_trail_rules_test.py` on main, and was reverted. His
saves stay in `kb_curation`; the re-mint run syncs and folds them in one window. The evening's codes landed
(*APPLIED*, under NEXT below; re-key 41958042347 green; S583 read back no row left on an old code). **NEXT:** ECONMT and Electricity's
adult-education codes, his refile in Local subjects.
**The Local subjects List** (Sam, 2026-11-03: *"yes on
local subjects"*; `csr_local_subjects.js`, the fourth view, `#canonical-subj4/local[/<filter>]`): one row per local
code the subject map names (320), leaves out on purpose (18) or the seed's courses use (1,376 more), with its MQ
discipline, Common SUBJ, courses and where they land. *Confirm* records a filing as `_SUBJ_DISC::<CODE>` /
`subject_discipline_confirm`, a note as `subject_discipline_note` (both DR-25, Sam's); the map file changes only when a
session applies the filings under DR-25 with its ripple check. Guard `tests/csr_local_subjects.test.js`; a11y
`canonical-subj4-local`, `-dark`. NEXT: the Commons card's second count (local codes confirmed by a person) needs the
confirms synced to a committed file.

**The definition of complete (Sam, 2026-11-23, `r-csr-codes-settled-on-list-confidence-not-confirmation-sam-2026-11-23`):**
every MQ discipline carries a Common SUBJ on the list, the code follows the authority rule, and no code sits on two
disciplines; a person looks only at a code of low confidence. It replaces the confirmation bar of Sheet 99 card 1
(2026-10-19). That definition and the measured state of 2026-10-19 and 2026-11-04 moved verbatim to
[`docs/common_subject_code_tab_lessons.md`](../../common_subject_code_tab_lessons.md), *Moved from the lane (S717)*.
Measured 2026-11-23 on #3726: 251 of 251 carry a code (164 Confident, 84 Likely, 3 Leaning), none on two disciplines.

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
four known issues with owners, the procedures in force, and deep links into the List.

## Sam's eight steps against the record (S425's check, 2026-10-19)

Moved verbatim to [`docs/common_subject_code_tab_lessons.md`](../../common_subject_code_tab_lessons.md), *Moved from
the lane (S717)*; the 2026-11-23 ruling replaced its steps 4 and 5 (a code waited for a course). Still open from it:
the AGRI residual (404 identities; a Jev sitting proposes a family each, Sam confirming) and the stray identity codes.

## Sheet 99's six rulings (Sam, 2026-10-19), all applied

Their record moved verbatim to [`docs/common_subject_code_tab_lessons.md`](../../common_subject_code_tab_lessons.md), *Moved from the lane (S577)*.

## NEXT

**NEXT (S717), in order:** (1) merge #3726 on a green `test`; (2) the MQ view in COBI, `#commons/subjects/mq`
([`commons`](commons.md)); (3) re-point the folded local codes, a re-mint under
[`docs/coursecontrolnumber_remint.md`](../../coursecontrolnumber_remint.md), dry run first: ACCT, ACCTG, ACC and ACTG
to ACCT under Accounting, LING, HOSP, the religion codes (RLST, RELS, RELG) to RLST, MCOM, AERO (its AFROTC courses
to MILS); `kb/reference/subject_discipline_map.json` still sends ACC, ACCT and ACCTG to Business; AT and INS are
homonyms (Automotive, tutoring), read college by college; (4) test CIP in place of TOP for MQ type; (5) collect the
outline's MQ discipline in the SLO pass ([`data_sources`](../data_sources.md)); (6) `csr-quarterly.yml`'s baseline
holds the 19th edition's sha256, so re-baseline it on the 20th before its January compare.

**The Subjects card (S694, #3620):** each college's local subject codes and printed names beside the common subject codes, on the Commons front at `#commons/subjects`; where it stands and its NEXT: [`commons`](commons.md).

**DECIDED** `d-step-b-owner-courses-bot-2026-11-20` (the plain session of 2026-11-20, under Sam's delegation: *"want you to go with your recommendation"*): the Courses bot owns curation step b, the local subject title. It drafts each title from the state subject code and the catalog's subject heading, as COBIx suggested on #3584; a curator settles the ones that disagree. No view builds step b yet. His to revise.

**Sheet 107 cards 1-3 (S436, 2026-10-20), applied:** the record moved verbatim to [`docs/common_subject_code_tab_lessons.md`](../../common_subject_code_tab_lessons.md), *Moved from the lane (S577): Sheet 107*.

**For a curator (found in the file-eight fresh read):** five of the 79 are merged into a parent in another discipline:
BRDC M10AV into JOUR M1016 *Broadcast Journalism*, BRDC M10BF into FTVE M1144, and three noncredit drawing and painting
courses into BIOL M9004 (*Fundamentals of Drawing for Commercial Artists*, filed under Biological Sciences), FCSH M9055
and OLAD M9054. The re-key changed no merge; the BIOL parent reads misfiled.

**The two ENVR merge candidates wait for a faculty reviewer (S433, #2278).** `kb/_merge_candidate_queue.py` carries
them as `surfaced` pairs (`kb/merge_candidates/2026-10-20-forestry/report.md`), survivors proposed by the rule: ENVR
M1009 *Dendrology* over M1064 (4 colleges to 3), ENVR M1025 *Silviculture* over M10OP (2 to 1), no articulations on
any. The merge is a curriculum judgment made in the curation UI (ruling 6, 2026-09-05).

**The quarterly routine compares on a cron (S433, #2279).** `csr-quarterly.yml` runs
`kb/_csr_quarterly_probe.py --compare` at 13:17Z on the 1st of January, April, July and October, and on dispatch. It
reads each source against `kb/reference/csr_quarterly_baseline.json` (the 19th edition and the handbook PDF's sha256,
from run 39374671352), prints `COMPARE` lines (same, changed, unread, no_baseline) and a step summary, and reads red on
`changed`; a session then diffs the Disciplines Index and opens a card. **The C-ID source a runner reaches (S437,
#2289):** the site moved to c-idsystem.org (ASCCC), and its search pages live on data-c-idsystem.org with no `www`
(the probe had asked c-id.net, a runner 403, and www.data-c-idsystem.org, no such host). `/descriptors/final` links its
own export, `/descriptors/final/csv` (217,763 bytes, `text/csv`); the probe follows and hashes it, and two runs (13:16Z
and 13:18Z) read the same sha256, now the `cid_data` baseline. `/approved-courses` answers 200 with no export link, so
`cid_courses` and `cid_home` stay `no_baseline`. Next for it: diff that CSV against `kb/reference/cid_descriptors.json`
(495 descriptors, the CCCCO file of 2026-05-20) on a runner, so a `changed` names the descriptors that moved. `mq_list` stays `on: false` (half built) until the index diff runs on the runner too.

**The anchor re-key, APPLIED (S612 SkySunflower, 2026-11-08):** 20 anchor keys onto their Common SUBJ, receipt `kb/anchor_rekey_out/2026-11-08/` (last in `kb/alias_chain.py`); held, the three dead-format HOSP keys (the curator worklist). The paragraph as it stood: [`docs/roadmap_archive.md`](../../roadmap_archive.md), *Moved from lanes/common-subjects-reference.md (plain session, 2026-11-20)*.

**Then:** the strays Sheet 106 does not cover (86 codes with no checkable answer, and the seven set aside) stay on
the discipline-blank worklist for a curator; the Commons' remaining Progress
views (Exhibit, Course, CR) from the same module.
