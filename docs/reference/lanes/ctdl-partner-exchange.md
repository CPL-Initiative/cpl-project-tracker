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

🔨 **Scoped (S428, 2026-10-20); nothing built.** The plan in one line: one owner per fact, one writer per store,
partners file into a private exchange repository Malone administers, and COBI's contribution is the crosswalk from
every COBI record to the state's numbers and, once published, its CTID.

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

## NEEDS SAM ([Open Asks Sheet 102](https://claude.ai/artifact/4VKzfjdbAUTmUqPfNaNoD4), `SHEET_ID` `2026-10-20-open-asks-102`, published 2026-10-20, store empty at publish)

1. Where partners work: a private exchange repository under CPL-Initiative that Malone administers, or folders in the
   tracker.
2. The pilot: CE's ten Ready to Publish colleges at once, keyed on COCI control numbers, or two of them first.
3. The Commons: a Linked step at the end of each reference, or a sixth Commons row.
4. The CCR in the Registry: hold the M-IDs out until the layer is declared faculty-published, or publish settled
   clusters now.
5. WestEd and the CCR: reviewers proposing on COBI's surfaces with COBI curators confirming, or a WestEd-hosted copy
   synced back.
6. The three decision rights the crosswalk creates (partner intake, match confirmation, Registry publishing) and their
   owners.

## NEXT

- On Sheet 102's answers: the exchange repository's `README`, `CLAUDE.md` and contract v0 (Malone's lane; a session
  drafts them as files for him), then the pilot's crosswalk and three sample Pathways in CTDL JSON-LD.
- The crosswalk table goes on `kb/governance_surface_map.json` before it is built (Rule 10 a3), with the three decision
  rights in `kb/governance_register.json`.
- Ask CE (Sam or Malone, not a session): whether a re-upload matches on External Identifier, and how they plan to
  publish requirement structures (their `doc/future-direction.md` names it as their next step).
