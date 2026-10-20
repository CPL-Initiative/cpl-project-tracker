---
title: CTDL and the partner exchange — Decisions & Lessons
date: 2026-10-20
tags: [ctdl, credential-engine, wested, program-requirements, commons, lessons]
artifacts:
  - docs/reference/lanes/ctdl-partner-exchange.md
  - docs/kb-notes/reference-ctdl-classes-for-cobi-records.md
  - kb/status/program-requirements.json
  - kb/status/course.json
related:
  - "[[docs/reference/lanes/ctdl-partner-exchange]]"
  - "[[docs/kb-notes/reference-ctdl-classes-for-cobi-records]]"
  - "[[docs/program_requirements_harvest_lessons]]"
  - "[[docs/commons_lessons]]"
---

# CTDL and the partner exchange — Decisions & Lessons

## S430 SkyLupine (2026-10-20): the exchange's seed and the three decision rights

**What shipped.** Sheet 102's card 1 as files: `partners/ctdl-exchange/seed/` is the private exchange repository
Malone copies, and `partners/ctdl-exchange/README.md` carries his paste. Card 6 on the register: DR-27 (Malone),
DR-28 and DR-29 (Sam), and `table:identifier_crosswalk` mapped to DR-28 before the table exists.

**Decisions taken in the drafting, each open at the joint read that sets version 1.**

- Credential Engine files xTRA's CSVs as they are; the contract requires only the columns a join needs
  (`External Identifier` and a name, read from `server/src/csv.ts` at `03a9a1b`). Asking CE to reshape its files
  would cost the pilot its premise, that it costs CE nothing beyond what it already makes.
- COCI's course control number is `CCC` and nine digits (141,694 of 141,738 rows in the 2026-05-21 list; the other 44
  read `NULL`), a program control number five digits (all 15,964 harvest records, read live). The crosswalk schema
  pins both shapes.
- M-IDs, CR groups and exhibit keys stay out of the exchange in version 0. Card 4 ruled only on the Registry; the same
  reason (a CTID names one version for good, and the layer still re-mints) covers a partner's copy of a key.
- The exchange's people are recorded by name or role, never by email address (the 2026-10-14 measurement of reviewer
  emails on public rows is the reason).

**How it is built to be checked.**

- The seed's `CLAUDE.md` is stored as `CLAUDE.exchange.md`. A nested `CLAUDE.md` loads into any tracker session that
  reads its folder, and would tell that session it works in the exchange. The test fails if a `CLAUDE.md` appears.
- `tools/check_drop.py` is standard library only, so the tracker's lints job can run it. It implements the JSON Schema
  keywords the contract's schemas use and refuses a schema with any other, so a schema cannot ask for a check that
  does not run.
- The CI workflow passes branch names through the environment, never through `${{ }}` inside the script: a branch
  name is text a partner chooses.

**One writer per store.** The seed lives in the tracker only until the exchange exists; the PR that records the
repository's address deletes `partners/ctdl-exchange/`.

## S428 SkyPinyon (2026-10-20): the strategy, Credential Engine's code and extracts read, Sheet 102

**The ask.** Sam opened S428 at ~23:37Z with a new direction for the harvest: a collaborative element with WestEd and
Credential Engine, instructional data coded in CTDL, COBI kept authoritative, and Malone integral (verbatim in
`cpl_memory` `sam-ctdl-partners-cobi-authoritative-2026-10-19`). The run read CE's repository and its sheet, verified the
CTDL vocabulary, measured our side, and wrote the strategy as a Claude Doc
(https://claude.ai/artifact/MYxdr83s2HjDQbKTXaGr6C) with six calls on Open Asks Sheet 102
(https://claude.ai/artifact/4VKzfjdbAUTmUqPfNaNoD4).

**What the code says.** `CredentialEngine/ctdl-xtra@03a9a1b` (branch `xtra-backup`): four lists extracted separately,
written as bulk-upload CSVs (`server/src/csv.ts`). A course's External Identifier is its printed code, a repeat
suffixed `-2`; a credential's is a fresh `randomUUID()` on every export; a program's id defaults to its name. No list
links to another, and the program prompt drops the requirements section. The repo's `doc/future-direction.md` names
the missing hierarchy as its next step: the harvest's records are that hierarchy.

**What the extracts say.** The tracker sheet (114 colleges, 12 High Priority, 10 Ready to Publish) links 33 datasets.
CE's review step adds CTIDs in Google Sheets; only Berkeley City links programs to courses (9 credentials, 17 course
CTIDs, all resolving); no file carries a COCI control number or a CIP code. A second reading caught six defects before
publishing (the lane lists them). The harvest holds 1,822 records at the ten, and `course_outcomes` covers Coastline,
Moreno Valley and Norco.

**How the run went wrong twice and caught it.**

- The Drive connector's `read_file_content` returns a sample of a large sheet (14 rows per tab). Read from it, the
  first draft named 2 Ready to Publish colleges; the xlsx export holds 10, the subset Sam named. Count from an export,
  never from the connector's text rendering.
- The helper agent's counts drifted on two findings: Taft's CTID collision is 237 of 237 credential rows (it reported
  83), and Mt. San Antonio has 96 of 140 course rows without a course code (it reported 65 degrees or certificates).
  Every figure that reached the doc or a memory row was re-measured from the saved files first.

**Smaller lessons.**

- `credreg.net` answers 403 at the proxy; `CredentialEngine/Schema-Development` carries CTDL as JSON-LD. Two names that
  sound right are not CTDL terms: `SelectionComponent` and `hasTransferIntermediary`.
- The repo's Supabase guard holds a session's UPDATE on `cpl_memory`. A correction is a new row naming the row it
  corrects.
- The open-asks builder refuses a chip label carrying `;`, and the coverage test refuses a measured predicate without a
  fixture.

**State at checkpoint.** Scoped, nothing built. The lane's NEEDS SAM is Sheet 102's six cards; nothing with CE or
WestEd moves until card 1 (the exchange) is answered.

**Next.** Apply Sheet 102's rulings; on *exchange*, draft the exchange repository's files for Malone; then the pilot's
crosswalk and three sample Pathways.
