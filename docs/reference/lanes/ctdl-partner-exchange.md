---
title: "CTDL and the partner exchange (Credential Engine, WestEd) — lane state"
created: 2026-10-20
updated: 2026-10-20
tags: [reference, roadmap-lane, ctdl, credential-engine, wested, program-requirements, commons, partners]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference/lanes
related:
  - "[[CLAUDE]]"
  - "[[program-requirements-harvest]]"
  - "[[commons]]"
  - "[[partner-crosswalks]]"
  - "[[governance-team-enablement]]"
  - "[[docs/kb-notes/reference-ctdl-classes-for-cobi-records]]"
---

# CTDL and the partner exchange

**What this lane is:** how COBI's records carry their CTDL identity, and how Credential Engine (catalog extraction,
the Credential Registry) and WestEd (the full COCI, the CCR) plug in, with COBI kept as the record for what it decides.
Sam, 2026-10-19 ~23:37Z, opening S428 (verbatim in the vault braindump
`braindump-2026-10-19-2337-ctdl-partners-and-cobi-authoritative`; `cpl_memory`
`sam-ctdl-partners-cobi-authoritative-2026-10-19`): *"A key in all this is to code instructional data with CTDL so it
is portable and interchangeable with other systems--increasing visibility and portability and interconnectivity,
setting us up for national scaling."* And: *"Let's keep COBI authoritative in all this and plug in where it makes
sense."* He named Malone integral: *"he's our tech lead and is involved on all fronts."*

**The strategy** is a Claude Doc Sam edits and comments on:
[CTDL Partner Strategy](https://claude.ai/artifact/MYxdr83s2HjDQbKTXaGr6C) (S428). The verified CTDL vocabulary, the
block-by-block mapping of a harvest record to a Pathway, and what xTRA's keys are:
[`reference-ctdl-classes-for-cobi-records`](../../kb-notes/reference-ctdl-classes-for-cobi-records.md).

## Status

🔨 **Ruled (Sheet 102, 2026-10-20); the exchange's seed is drafted and waits on Malone.** The plan in one line: one
owner per fact, one writer per store, partners file into a private exchange repository Malone administers, and
COBI's contribution is the crosswalk from every COBI record to the state's numbers and, once published, its CTID.

**The exchange's seed** (S430, card 1): [`partners/ctdl-exchange/`](../../../partners/ctdl-exchange/README.md) holds
the repository Malone copies (the README, the exchange's `CLAUDE.md` kept as `CLAUDE.exchange.md` so it never loads
into a tracker session, contract v0 with its identifier rules, CTDL mapping, file kinds and four JSON Schemas,
`tools/check_drop.py`, the CI workflow, CODEOWNERS and decisions 0001 and 0002) and the paste that creates it.
The check refuses a drop whose folder, manifest, checksums, row counts, required columns or CTIDs disagree with the
contract, a CTID that names two resources (Taft's case), a column named for student data, an edit to a merged drop,
and a party branch writing another party's folder; `tests/ctdl_exchange_seed_test.py` (24 cases) runs it in the lints
job. Version 0 holds M-IDs, CR groups and exhibit keys out of the exchange, by card 4's reasoning.

**The three decision rights** (card 6) are on the register: DR-27 partner intake (Malone), DR-28 match confirmation
(Sam, until he delegates it), DR-29 Registry publishing (Sam); the crosswalk table is mapped to DR-28 on
`kb/governance_surface_map.json` as `table:identifier_crosswalk` before its migration. The table is named
`identifier_crosswalk` because the partner-crosswalks lane already uses "crosswalk" for occupations.

**What Credential Engine runs** (read 2026-10-20, `CredentialEngine/ctdl-xtra@03a9a1b`, branch `xtra-backup`): xTRA
crawls a catalog and a model extracts four separate lists (courses, learning programs, credentials, competencies)
into Credential Registry bulk-upload CSVs; a person reviews and uploads them. A course is keyed on its printed code
(a repeat becomes `-2`), a credential on a fresh random UUID per export, a program on its name; no list links to
another, and the program prompt drops the requirements section. The harvest holds exactly what xTRA leaves out.

**CE's tracker sheet** (["California Community Colleges - xTRA Extracts"](https://docs.google.com/spreadsheets/d/1r--t46ng0LlcqePe993pjcuEHAv3Guk8N2iq-Z8uJEs),
owner jscholten@credentialengine.org, modified 2026-10-19): 114 colleges, catalog vendor and URLs per college, four
dataset columns (courses, credentials, credential competencies, course competencies) and a Finder URL. Twelve are
High Priority; ten read *Ready to Publish*, the subset of ten Sam named: Antelope Valley, Berkeley City, City College
of San Francisco, Coastline, El Camino, Fullerton, Moreno Valley, Mt. San Antonio, Norco and Taft. San Bernardino
Valley and West Los Angeles are High Priority and not started. The harvest holds 1,822 records at the ten. Its 33 linked
datasets (read through the Google Drive connector, 2026-10-20; copies in the session scratchpad only) show CE's review
step adding CTIDs (course CTIDs at four colleges, credential CTIDs at four), program-to-course links only at Berkeley
City (9 credentials, 17 course CTIDs), and no COCI number or CIP anywhere. A second reading caught, before publishing:
Antelope Valley's credential web addresses one row off (184 of 185), Taft's 237 credential CTIDs equal to its own
competency `@id`s, masked course codes at Norco (112) and Moreno Valley (75), degrees filed as courses at Mt. San Antonio
(96 of 140 rows without a course code), one Coastline framework holding 4,604 competencies, and two tracker links
opening another college's file (City College of San Francisco's courses, Taft's course competencies).

**Measured on our side (2026-10-20, live):** 15,964 harvest records at 114 colleges, 36,090 requirement blocks: `all`
19,374, `choose_courses` 8,482, `choose_units` 7,603, `recommended` 631. The first three map to stable CTDL terms except
the unit minimum, which needs `Constraint`/`hasConstraint` (unstable, CE's conditions-and-constraints proposal).
`course_outcomes` holds 7,450 courses at nine colleges, three of them among CE's ten (Coastline 522, Moreno
Valley 674, Norco 817), so CE's course competencies there have a second reading on our side.

## RULED (Sam, [Open Asks Sheet 102](https://claude.ai/artifact/4VKzfjdbAUTmUqPfNaNoD4), 00:29-00:31Z 2026-10-20, all six his own call; `cpl_memory` `sam-sheet-102-rulings-2026-10-20`)

1. *exchange*: a private exchange repository under CPL-Initiative that Malone administers.
2. *all-ten*: CE's ten Ready to Publish colleges at once, keyed on COCI control numbers, with his condition
   *"Provided you think it's as good as our pull."* S428's answer: for program requirements it is not, since xTRA reads
   none; for courses, credentials and outcomes the pilot measures it, college by college, against COCI and our records.
   CE's rows enter as a second reading and a source of CTIDs and outcomes, and replace nothing of ours.
   Sam, ~00:50Z, on that answer: *"Good call! I suspected our pulls would be better than theirs, so the real benefit will be dragging in their CtdL and any missing data they have compared to ours."* The pilot's deliverable is CE's CTIDs and the fields CE holds that we lack.
3. *linked-step*: a Linked step at the end of each Commons reference, after Complete.
4. *hold*: the CCR stays out of the Registry until the M-ID layer is declared faculty-published.
5. *reviewers*: WestEd's reviewers propose on COBI's surfaces; a COBI curator confirms; M-ID minting stays with the CPL
   Initiative.
6. *as-proposed*: three new decision rights, partner intake (Malone), match confirmation (Sam, until he delegates it to
   a curator) and Registry publishing (Sam).

## NEXT

- Malone runs the paste in `partners/ctdl-exchange/README.md` (Sam hands it to him; a session cannot create a
  repository in the CPL-Initiative organization). When the repository exists, the PR that records its address here
  also deletes `partners/ctdl-exchange/`, so the contract has one home.
- Card 2: once the exchange holds CE's ten extracts, the crosswalk to COCI and our records, the agreement rate per
  college (the answer to Sam's condition), three sample Pathways in CTDL JSON-LD, and the findings back to CE.
- Card 3: the Linked step in `commons_progress.js`, Program Requirements first, with its procedure card and check.
- Ask CE (Sam or Malone, not a session): whether a re-upload matches on External Identifier, and how CE plans to link
  programs to courses.
