---
title: "Data sources: the register of datasets that could fill a Commons gap"
created: 2026-11-04
updated: 2026-11-04
tags: [reference, commons, data-sources, wishlist, procedures]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference
related:
  - "[[CLAUDE]]"
  - "[[commons]]"
  - "[[ctdl-partner-exchange]]"
---

# Data sources

**Why this exists (Sam, 2026-11-04, S573, in chat):** *"There are so many disconnected hidyholes of data out there and
one of our procedures should be to document them when they are discovered, see how they could be plugged in and how we
might get the connections made."* The day's earlier ask named the first of them: *"datasets at the CO that if connected
could fill gaps and bolster the data you need to make better recommendations and decision"*. The Commons path mock
shows this register as the daily check's wish list (https://claude.ai/artifact/PYzUNKC3Ni6F8nhbcKdSr9).

**Why it matters to the procedures:** each source is a second, independent signal. When two signals agree, a
procedure can settle an item without a person; when they disagree, that is the item a person should see (the TOP
doctrine's two-signals-agree gate, carried to every source).

## The procedure, whenever a session or a person finds a source

1. **Record it.** Add an entry below: what it is, who holds it, what it holds, where it lives, and who found it and
   when (a person's find carries their name; a session names itself).
2. **See how it plugs in.** Name the common reference it would feed, the gap it fills with a measured count, and the
   procedure it would give a second signal. Where it is public, read a small sample and say what it showed.
3. **Plan the connection.** Say what connecting takes: a public read on a schedule, a partner exchange, a data-share
   agreement, or a note to the holder. A session drafts a note and never sends it; an agreement, a cost or an outward
   note is the lead's call, so it goes on the decision sheet.
4. **Connect and schedule.** Build the read, put it on a schedule, and show its date in the Commons status, so a source
   that goes stale becomes an item for the team.

**Stages:** Found (recorded), Assessed (step 2 done), Asked (a request is out or a partner is engaged), Connected (read
at least once), Scheduled (read on a routine). An entry states its current stage only; replace it when it moves.

## The register

| Source | Stage | Would feed | Next step |
|---|---|---|---|
| CPL-AI, the Foundation and ASCCC's certification recommendations | Connected | Credit Recommendations, Exhibits, Courses, Programs | The lead chooses a schedule for the read |
| Credential Engine's top 50 | Connected | Credentials, Exhibits | Schedule the fetch; widen the catalog beyond IT |
| MIS | Connected, in part | Courses, Programs, CPL counts | Name the course elements a nightly read would use; the student match needs an agreement |
| WestEd | Asked | Courses, Subjects, Programs | The partner exchange's seed, with Malone |
| PPM, the Program Pathways Mapper | Assessed | Programs | Confirm whether the October 17 note went out |
| ASSIST | Assessed | Courses, Programs | Read a sample of public agreements to measure the second-signal yield |
| CVC, the California Virtual Campus | Assessed | Courses, Programs | Find who holds the exchange's course equivalencies; draft a note |
| Common Cloud Data Platform | Assessed | Courses, Programs, CPL counts | Ask the CO's data team what it exposes and to whom; draft a note for the lead |
| The Foundation's certification skills | Assessed | Skills, Outcomes, Credit Recommendations | Confirm what the Foundation holds and how it shares it; draft a note for the lead |
| ACE, the new partnership | Found | Credit Recommendations, Exhibits | The lead shares the partnership's details |
| WestEd's environmental scan of datasets and connections | Found | Every reference | The lead shares the scan; each dataset in it gets its own entry |
| Credit for Being You, the student portal's requests | Found | Credentials (the harvested standing), Exhibits | Ask Malone what the portal records when a student names a credential no exhibit covers, and whether a request can arrive with the credential already named |

### CPL-AI, the Foundation and ASCCC's certification recommendations
Faculty-reviewed credit recommendations for 115 industry certifications, each paired with courses colleges could
award. Public at https://map.rccd.edu/CPL-AI/ (its data at `preview-data/catalog.json`). Read by hand on 2026-10-31
by `kb/_build_cpl_ai.py --fetch` into `kb/cpl_ai/pairs.json`: 33,232 college and course pairs at 121 colleges, 20,166
of them strong evidence or faculty interpretation. The Program Requirements dialog reads it; Sierra and the public
pages wait on the lead's word. Gap: 31 of the 115 join a common exhibit (16 exact); the rest wait on canonical titles.
Named by Sam, 2026-11-04; first connected S541 (2026-10-31).

### Credential Engine's top 50
The 50 credentials in the most Credential Registry collections, with their CTDL terms. `kb/_fetch_ce_top50.py` writes
`kb/reference/credential_engine_top50.json` from the Registry's public JSON-LD. Gap: 22 of the 50 have a MAP exhibit
and 28 do not (`kb/reference/credential_engine_top50_map_check.json`); the 28 are the first invitation for faculty
review. Named by Sam, 2026-11-04.

### MIS
The course and student records every college reports to the Chancellor's Office. The course file is read for single
crosswalks (it abbreviates titles, which reads as "none found" when matched naively). Gap: the MAP-to-MIS student match
that would count students with CPL statewide is not built; it falls under the student-detail disclosure ADR. Named by
Sam, 2026-11-04.

### WestEd
The full, current COCI, its work on the Common Course Reference, and reviewers who would propose on COBI's screens
while a curator confirms (Open Asks Sheet 102). Gap: our COCI copy is from July, and 21,761 of its 141,738 courses
have no common course yet. Lane: [`ctdl-partner-exchange`](lanes/ctdl-partner-exchange.md). Named by Sam, 2026-11-04.

### PPM, the Program Pathways Mapper
Program maps colleges publish: each program's courses, term by term. Gap: 3,349 active programs have no record and
3,380 fail a check; a published map is a second reading of the same requirements. A note asking the mapper's team for
access was drafted on 2026-10-17 (`CPLBrain/04-projects/cpl-initiative/20261017_Catalog_Reader_Access_Notes_Draft_1.md`,
section 5); the record does not show it sent. Named by Sam, 2026-11-04.

### ASSIST
Course-to-course articulation from each community college to UC and CSU. Gap: two colleges' courses that articulate
to the same UC or CSU course are a second signal for one common course, and ASSIST supplies the CSU-transferable flag
program requirements need. Named by Sam, 2026-11-04.

### CVC, the California Virtual Campus
The statewide catalog of online courses and its course exchange between colleges. Gap: the exchange's record of which
course one college accepts for another's is a second signal for common courses, and it shows which courses run online.
What the exchange records is this register's reading, to confirm. Named by Sam, 2026-11-04.

### Common Cloud Data Platform
Where college data comes together for the system. Gap: current sections and enrollments would show which courses and
programs are in use now. Sam named it earlier as part of the scalable catalog read (catalog reading, Common Cloud and
CVC together). Named by Sam, 2026-11-04.

### The Foundation's certification skills
The skills each certification teaches, matched to course outcomes. Gap: 39 credentials list their issuer's skills
today, and outcomes are read from 6,095 courses at 8 colleges; skills matched to outcomes would suggest which local
course a credit recommendation should pair with. What the Foundation holds is this register's reading, to confirm.
Named by Sam, 2026-11-04.

### ACE, the new partnership
Sam, 2026-11-04 (S573): *"We have a new partnership with ace I need to get you info on."* ACE's reviews already supply
most of MAP's credit recommendation rows (the military half, lane
[`military-ace-cr-reference`](lanes/military-ace-cr-reference.md)). Steps 2 to 4 wait on the details he shares.

### Credit for Being You, the student portal's requests
The CO's student portal (https://creditforbeingyou.org/, linked from the public header as *add what you have learned
and request credit*) is the front door a student uses to ask a college for credit; its requests land in MAP as
activity (`docs/map_dataset_spec_for_malone.md` notes that the better the portal performs, the more activity arrives
through it). Found by SkyAerial on 2026-11-06 while mocking the Credential Catalog's *Request an evaluation* route,
which asks a college the same question a portal request asks. Two feeds would matter. What students ask for that no
exhibit covers is the demand signal the statewide priority list would run on (7,401 harvested credentials have no
exhibit today). And a hand-off in the other direction: a catalog row opening the portal with the credential already
named, so the page keeps one intake rather than building a second. Malone holds the portal's data model; the
questions above are his to answer, and a request that the portal expose or accept either is the lead's call.

### WestEd's environmental scan of datasets and connections
Sam, 2026-11-04 (S573): *"west ed has a whole environmental scan of datasets and connections I need to feed to you."*
When it arrives, each dataset it names gets its own entry here and walks the four steps; a dataset already listed
gains what the scan says about it.
