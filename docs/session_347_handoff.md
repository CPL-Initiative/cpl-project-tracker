---
title: Session 347 handoff — Sam's headline for the Chancellor, Sheet 51's two calls, then Palo Verde
date: 2026-10-08
session: 346 (SkyCairn)
tags: [handoff, program-requirements-harvest, cpl-pathways, decision-sheets]
status: current
---

# You are Session 347

Your moniker is **SkyTrellis**. SkyCairn (S346, `session_01CjWaye8qcXH3Hn9rizYsAr`) was a Sam-driven session that
checkpointed at the context warning line. The CPL Queue routine (`trig_01L8K64ZKYb5eALdT4HW6NAV`) still reads
`enabled: false`; it is Sam's to turn back on.

## First, in this order

1. **One writer.** `list_sessions` (`mine: true`).
2. **Open PRs.** CPL-Initiative/cpl-project-tracker#1911 (the map reads and the 28 procedure records; the receipt is
   already applied, so the PR only files it) and this checkpoint's PR. Merge each once `test` passes on its head.
3. **Sheet 51's replies.** [Open Asks Sheet 51](https://claude.ai/artifact/AYuPisSF5Tc4rmftgCYvb2) (current):
   `ArtifactData` `list` on collection `replies` before anything else. Card 1: build the write path. Card 2: apply
   display build 2360b83e8100.
4. **Rule 8:** `cpl_memory` tags `program-requirements-harvest`, `cpl-pathways`, `skyview`. Read
   `sam-roep-headline-for-chancellor-2026-10-08` first.

## Priority 1: Sam's headline for the Chancellor

Sam, in chat at 18:5xZ: *"add to our ROEP dashboard the total count of college active program control numbers from
COCI and the ones with complete harvested ROEP data... I want to be able to show this to the Chancellor so she can get
the BIG vision and progress"*; SkyView becomes the hub later. Mock-up: [Program Requirements
Headline](https://claude.ai/artifact/ME23x5taJpTKpx4RBwQ2Tr) (`prototype/roep_headline_mockup.html`). It shows
20,282 active programs at 118 colleges (COCI, one control number each) and 20 read and checked at 5 colleges, plus a
line beneath: 19 with outcomes, and maps (0 checked live; 2 after card 2). It proposes that complete means the four
checks. S346 asked for his yes in chat. **If he said yes:** build a two-number band at the top of the Progress view
(`program_requirements.js`, live reads only: the COCI count the view already reads and the checked records). Have the
Every program milestone read *20 of 20,282*. Record the pair at each checkpoint so a trend exists (a field in
`kb/queue_status.json`, validated by `scripts/queue_status.py`). Add a jsdom test and run `npm run a11y` on the
Progress targets. **If he has not answered,** put it on Sheet 52 as card 3, under a fresh `SHEET_ID`, with a NEEDS SAM
on the harvest lane. Republish Sheet 51 titled *(superseded by 52)*.

## Priority 2: Sheet 51's two cards

- **Card 1, the reading write path (Build it):** a log `program_record_verdicts` (record, verdict confirm or fix,
  note, who, when, the requirements fingerprint the page showed) and one function `program_record_verdict_add` for a
  signed-in reviewer. Confirm sets `checked` only while the fingerprint matches and the machine checks pass. Needs a
  fix appends the note to the college's procedure `open`. Map it in `kb/governance_surface_map.json` (Rule 10 a3).
  Then the flags and buttons go into `recordCard()` as the mock-up shows. Irvine Valley 10265 and Santa Monica 43767
  stay unchecked until Sam reads them there.
- **Card 2 (Go):** fresh read, then apply `kb/receipts/program_requirement_records_display_2026-10-06_2360b83e8100.sql`
  (or a delta of the rows that differ: 03086, 33876, the Irvine Valley gap text). Run `--verify-sql` for 22 of 22.
  Sierra then places Fire Technology's and Early Childhood Education's courses by term.

## Priority 3: Palo Verde, the last unsettled map

31 of 32 published maps are settled; Palo Verde reads `not_read` (its one lead does not resolve), and the settled rule
counts refused or unreached hosts only. S346's search restricted to paloverde.edu found no map (curriculum guides,
program reviews, catalogs from 2010-11 and 2023-25). Record that search as a workaround on its procedure. Then decide
with the registry's sequence columns whether its access is `unreached`.

## What shipped (S346)

- **#1910 (merged, 35a9db6):** sheet 50 card 4 (`accepts()`, off-list marks, no pick on a two-option map), Mt. San
  Antonio's ECE map filed, display build 2360b83e8100 on the page, the College select on CPL Pathways, and the flags
  mock-up.
- **#1911 (open):** seven read plans; procedure records for 28 colleges (receipt applied, md5-guarded). Result: 31 of
  32 maps settled, 34 of 118 colleges with a procedure.
- **Vault #274 (merged):** Open Asks Sheet 51.
- **This checkpoint:** the harvest lane compacted below its limit, lessons S346, the KB note
  `methodology-a-site-search-needs-the-domain-filter`, memory rows, the queue status file.

## Decisions Sam made this run

- The headline ask above, with SkyView as the later hub.
- His sheet 50 rulings were carried out: card 4 built, cards 1-2 answered with a mock-up and a sheet card.

## Waiting on Sam

Sheet 51 cards 1-2; the headline yes; the Microsoft 365 connector (RCCD account); the Summit v2 MP4s in the SharePoint
Drafts folder; the CPL Queue routine.

## Patterns that worked

- **Restrict a site search with `allowed_domains`.** `site:` in the query is ignored (lessons S346 item 1).
- **Write procedure records server-side:** `r.procedure || jsonb_build_object(...)` guarded by the md5 read just
  before. Prove first records byte for byte by reproducing jsonb's text form.
- **Plan files change only in the commit that should read them.** A push reads the plans its last commit changes, so
  put a plan fix before the commit you push last.

## Safety patterns

- A vault PR whose check reads the tracker's `main` waits for the tracker PR. Merge that first, then re-run once.
- A checked program's display changes only on Sam's go (card 2).
- Each card on a sheet carries a measured premise with a fixture in `open_asks_sheet_coverage_test.py`.

## What S346 let go of at sign-off

PR subscriptions: #1911 and this checkpoint's PR, if still open at sign-off; the sign-off message says which. Check-ins:
none. Artifact watches: Sheet 51, Program Records Review, Program Requirements Headline.
