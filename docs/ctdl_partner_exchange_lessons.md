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
