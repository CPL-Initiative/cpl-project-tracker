---
title: "CER redesign handoff: the Rules view, Send to the routine, and Sam's ASE naming (SkyBilberry)"
date: 2026-10-31
session: CER redesign build, side session after S536 (SkyBilberry)
tags: [handoff, cer, exhibits, exhibit-canonicalization, funding]
status: current
---

# You are SkyHuckleberry, the Exhibits tab's next build

SkyBilberry ran on 2026-10-31 from 18:43Z beside Sam, who was working through Review and Another look. No other session
was live on these files; SkyCloudberry's funding session was closed, so this session also took one funding ask. This is a
**light checkpoint**: the lane files moved in their PRs (`cer-procedures`, `implementation-funding`), with history moved
verbatim to the lessons docs; the index, the memory rows, the Exhibit status file and the vault note moved here. No
Roadmap row moved, no re-mint was made, and the session wrote no Rule 10 data (the tab's writes are Sam's own). Skipped:
`README.md`, `kb/README.md`, the pipeline view, the KB notes and the decision sheet (Sam's one open call was asked in chat
while he was live; see *Open work* 1).

## What shipped

- **#2625: conflict cards save; names to pick from.** A conflict card's Change and Keep write `unified_title_supersedes`
  naming the reviewed title, as Another look does, so the fold's revise lane re-points it while that title stands. The
  issuer and training-site boxes list the reference's names as words to click (`issuers`, `sites` in
  `kb/exhibits_review.json`, from the review builder). Sam's Auto card (Irvine High School MLR) was also stale: its saved
  title had left `kb_curation`, and the Review file reads the 07:47Z procedures report.
- **#2626: the Rules view and Send to the routine (Sheet 149 card 2).** `#exhibits/rules` lists every procedure (words,
  who, amendments, last run's tallies), Another look's rules and the rules sent. Teach a rule's *Send to the routine*
  writes `_CER_PROCEDURE_REQUEST::<when>-<tag>`; the CPL queue routine works it from step 7 of
  `docs/reference/scheduled_sessions.md` (build off, `kb/_cer_procedures.py --try <id>`, merge, write
  `cer_procedure_built`; carry out `cer_procedure_switch`). An off rule's lanes now reach nobody. DR-07 maps the fields.
- **ASE issuer, narrowed (Sam: "Agree on your call on the college as issuer").** ASE fills only a title that opens with
  ASE, the certification; a course aligned to a test keeps its college or school.
- **#2627: Funding Follow up:** beside Accept and Deny on a waiting request, an editable email to the requester with the CO
  Monitor's note in it (a standing attestation keeps Reject alone). A draft's From is the mail program's account; map@rccd.edu for everything is Sheet 146 card 3's
  Microsoft 365 path, waiting on RCCD IT.
- **The daily run** (dispatched ~19:27Z) put the name lists in the review file: 268 issuers, 73 sites.

## Read first

`docs/reference/lanes/cer-procedures.md` (*Rules*, NEXT), then `docs/cer_v2_redesign_lessons.md` (the two SkyBilberry
sections, with Sam's words).

## Open work, in order

0. **Funding Nudge (Sam, ~20:35Z):** *"add a Nudge button at the top of the college rows internal funding tab that
   allows me to send nudge emails to all the colleges who have not yet requested participation or attested to the NC
   lead? I realize this would open a gazzilion email messages to send, so advise ... Maybe we should set up the ability
   for you to send automatically once we get that set up with RCCD IT."* Measured: 6 participation requests and 4
   noncredit attestations, so about 110 colleges. Advised in chat: a preview list first (who, what is missing, the
   deadline), sent today as one Outlook mail merge from a CSV (or one BCC draft), and later sent by COBI as map@rccd.edu
   through Microsoft 365 with a send log and a 14-day skip, after Governance. **Recipients (Sam, ~20:45Z):** *"the CPL
   Coordinator or if there is none, the Ambassador or if there is none, initiator, then VPAA, then whomever we have on
   file"*. Measured on `map_college_contacts` (124 colleges): CPL Coordinator 58; of the 66 without one, MAP's primary
   CPL contact covers 49, the lead Initiator 5 more, the VPAA 6 more, and 6 have none of the four. Colleges average 5.8
   active Ambassadors (up to 16) in `map_college_users`, so advised: read his "Ambassador" step as MAP's primary CPL
   contact (one person, the one MAP routes student requests to), with all active Ambassadors only as the last resort;
   the preview names which step chose each recipient. Sam then added the **CEO** (*"could go to the CEO...I think we may
   have those emails in our dataset. I could get the list from the CO if not"*): `ceo_email` covers 70 of 124 and fills
   none of the six with no contact, which are not funded institutions (Calbright College Credit, Cal State LA, Futuro
   Health, Launch Apprenticeship, and the Credit listings of North Orange and San Diego Continuing Education). Every
   funded college reaches someone before the CEO step; the CO's list would complete it. **The list comes from the
   funding tab's institutions, never `map_college_contacts`:** Cal State LA and Launch Apprenticeship are not CCCs or
   noncredit programs and are not eligible (Sam, ~20:50Z; neither appears in the funding tab; the model skips the
   names in `kb/non_ccc_institutions.json`, which lists only Cal State LA today).
5. **Later, an idea of Sam's (~20:50Z):** *"set up a scheduled task to harvest the key position emails, names, titles to
   add to our MAP Colleges table"*, then the spec (~20:55Z): *"would want the cron to run weekly...District CEO, College
   CEO, VPAA, VPSS, VPBS, Dean CTE, Dean Instruction, Dean or Director of A&R, VRC Director or Coordinator, Articulation
   Officer"*. Title variants to match (Sam): a CEO is a Chancellor (district), a Superintendent/President or a President;
   VPAA is also Provost, VP Instruction, VP Instruction and Student Services, or Chief Instructional Officer (CIO); VPSS is also Chief Student Services Officer (CSSO); VPBS is also Chief Business Officer
   (CBO) or VP Business Services and Facilities. Ask him for others. `map_college_contacts` already carries CEO, VPAA, VPSS and Articulation Officer from MAP; the rest are new.
   A weekly scheduled task needs Sam to create it on claude.ai's routines page (S490), and writing staff contacts into a
   shared table routes through Governance first (Rule 10 a3). Not yet asked to build. The tab's PII guard forbids these addresses today: a reviewer-only
   read is the build's first piece. Build on his reply; if none, put it on the next sheet.
1. **Sam's ASE naming call, asked in chat (19:30Z):** the course title as the ASE test's name plus a short tag,
   *Engine Performance (ASE A8)*, with the level kept where a college teaches a sequence. On **ASE short**, change
   Another look's ASE rule (`kb/_sweep_exhibit_titles.py`) to propose that form, including the six reference titles that
   start *Automotive Technology (ASE …)*, and the `ase-paren` procedure's words. If no reply, put it on the next sheet.
2. **Read Sam's run through Another look** (his `reviewer_email`, `unified_title_supersedes` or `title_sweep_kept` rows
   after 18:20Z), then the next fold's receipt (`revise`, `credential_moves`, `credential_retires`, `held`), and **move
   the panel rows** a move or retire lists (a guarded UPDATE with before-values, Rule 10 a2).
3. **The first rule sent to the routine:** when the Rules view shows one, confirm the overnight firing worked it by
   step 7; the first real run is the test of the step.
4. **Carried:** IB on the AP pattern (its titles are already near-canonical: casing and an HL suffix), then CLEP's
   official names; the Catalog's *Courses that may align*; training sites for a held title new to the reference, only if
   Sam asks.

## Lessons to honor

- `git add`, then `scripts/check_generated.sh`, after the **last** commit: the dependency map records line numbers.
- A `.test.js` that reads `docs/` must run on docs-only PRs (`tests/js_suite_gate_test.py`); check docs from Python.
- `pgrep -f` and `pkill -f` match the shell that runs them; wait on a test by running it in the background.
- The funding jsdom tests take minutes (4 m 28 s for the attestation file); a long local run is the suite.
- In a long function, a `var` name may already be taken: the card's `typed` was an element.

## Let go

At sign-off this session drops its PR watches and holds no check-in or artifact watch.
