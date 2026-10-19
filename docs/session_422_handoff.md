---
title: "Session 422 handoff: the second reader built, three Jev sittings read, Cañada's Cal-GETC step and the six-row rollback; Taft's local GE step is next"
date: 2026-10-19
session: 421 (SkyTupelo)
tags: [handoff, program-requirements-harvest, jev, second-reader, reconcile, rollback]
status: current
---

# You are Session 422

Your moniker is **SkyWillow**. Session 421 (**SkyTupelo**, `session_017JbZwQvQrwXMpRCHc4KQXm`, Sam's hand-opened session
from 04:02Z on 2026-10-19) checkpointed at about 06:40Z with the full Rule 9 list in cpl-project-tracker on the
designated branch `claude/session-421-handoff-t2utah` (merge its PR once `test` passes if it is still open). If the
routine started you, follow `docs/reference/scheduled_sessions.md` first. The routine's firing at 06:15Z found S421
working and stood down; the next is 07:12Z.

## Sam's words this run

None: Sam did not write during this session. Rulings in force: Sheet 97 (Build with Grok, 03:11Z), Sheet 94, 95, 96,
the Commons mock-up approval, and his go of 2026-10-17 (harvest calls proceed on their procedures without a card; a
write the Supabase guard holds goes through `supabase-migrate.yml`).

## What shipped (S421)

- **The second reader (#2246, merged 04:42Z):** `program-requirements-extract` version 11 takes `provider`
  (`anthropic` or `xai`; the same prompt, message and schema; the model never guessed; the key scrubbed from errors).
  `kb/_second_reader.py` reads a college's failing records from the page the first reading came from and scores both
  readings with the one scorer (`agree` · `second_passes` · `both_fail_same_checks` · `disagree`); `second-reader.yml`
  runs it and uploads the comparison; nothing is written. 24 checks in `tests/second_reader_test.py`.
- **Three Jev sittings, read:** Cañada (22 rows), Taft (24), San Joaquin Delta (49); no errors. A session's verdicts
  beside every row in `kb/jev_harvest_verdicts/<slug>.json`. Jev's cause held on 16 of 16 settled rows at Cañada and
  15 of 21 at Taft (Delta: cause held on 17 of 49 (12 agree, 5 owner differs), and 29 of the 32 misses are one shape: Delta prints every total as a floor and the record's sum is a range whose low end meets it, so a scorer floor rule for the program total clears them). Its owner leans wrong everywhere the same way (the scorer or the extraction
  for a figure a procedure step supplies, or a page the reader cut). No gate set: these are a session's verdicts.
- **Cañada's Cal-GETC step (#2247, merged 05:30Z):** every Cal-GETC transfer page closes its block with "Completion of
  Cal-GETC (California General Education Transfer Curriculum)", and the catalog's GE page states 34 units minimum
  (page 79), so the step cites Cañada itself. Transfer degrees only: `awards_match` gained `transfer` after the first
  run filled six local degrees whose captured page spans the sibling transfer section. 20 transfer records reread,
  the five that failed for want of the figure pass; display build 3d92deb7a816 applied on main (run 39204942046).
  Cañada's failing records: 22 to 17. Headline 11,630 to 11,635 complete.
- **The six-row rollback:** a reread dispatched on the wrong fills posted before its cancel landed; the six local rows
  were restored from the receipt's before-images through `supabase-migrate.yml` (run 39202436931), verified live,
  with a rollback receipt beside the original.
- **The page reader takes `pdf_span` and `pdf_after`** (three reads to reach Cañada's program pages).
- Lessons S421, the lane compacted under its budget, `kb/status/program-requirements.json` stamped, the docs audit.

## In flight at sign-off (check each first)

1. **cpl-project-tracker#2248** (this checkpoint, the Taft and Delta verdicts, the S421 memory receipt): merge once `test` passes. **CPLBrain#389** (the vault's session note): merge it. S421 dropped both watches and every check-in at sign-off (Sam, 2026-10-05).
2. **No run is pending.** The display apply on main (39204942046) completed; its applied record is on main.
3. **The second reader waits on Sam:** `XAI_API_KEY` and `XAI_MODEL` as Edge Function secrets on
   `program-requirements-extract`, then one `cpl-chat-deploy.yml` dispatch (function `program-requirements-extract`,
   confirm DEPLOY). Then `second-reader.yml` with `college=Cañada College`. The repo secret `xai-smoke.yml` reads only
   proves the key. Not an ask: Sam ruled, and the secrets are his step; the status file's `calls` carries it.

## Priority after that

1. **Taft's local-degree GE step:** a page read (`kb/college_reads/`, `pdf_span`/`pdf_after` if a PDF) of how Taft's
   local A.S. pages word general education and where the catalog states its Local General Education Pattern (27 units
   per the first reader's note on 38662); then a `set` step beside Taft's Cal-GETC one with `awards` for local degrees
   (add a `local` kind to `awards_match` if needed, with a test); reconcile on a college branch, reread, display build,
   PR, `step=display` on main. Clears 16725 and 36928. Dispatch one runner step at a time.
2. **Each college's one fix from its verdicts file:** Delta's reading paragraph names a scorer floor rule for the program total, as `degree_total_minimum` reads the degree total (29 rows); a subject-prefix alias in the scorer for ANTHR/ANTH, ENG/ENGL, ART/ARTH, COM ST/COMM (6 rows); a noncredit rule for pages printing only contact hours (7 rows); Taft's cause_differs
   rows (38661, 38662, 46186, 30284) are wrong-page reads for the picker; the careers-only failures at Cañada (five
   records) need the page to say whether the model paraphrased.
3. **Merced's 18 unfound** (8 whose Coursedog page prints few of COCI's listed codes, 10 whose own page the search never
   returned).
4. **The Commons' step 2** (unchanged): a run log per reference under `kb/status/`, the deep link behind a count.
5. **The UI pass:** `cobi:sierra-training` is due (never audited); skipped this run for room.

## Patterns that worked

- Build the step from the catalog's own words: three page reads, each narrowing (front matter, heading pages, the page
  after each heading), then the pattern proven locally on the words and on the two cases it must not touch.
- Prove a step on one college branch with a free reconcile, read which records it changed before any reread.
- The receipt is the rollback: before-images, the live read first, the SQL cut to the rows, the migrate workflow when
  the guard holds the write, a rollback receipt beside the original.
- A subagent reads a 100 KB job log and returns the sentences; the session never loads the page text.

## Lessons to honor

- A reconcile step for a figure only transfer degrees carry says `awards: transfer`; a local degree's captured page can
  span the sibling transfer section.
- Never dispatch a reread until the filed records are what they should be; a cancel does not beat a reread already
  posting.
- The Supabase guard holds every UPDATE from `execute_sql`; the sanctioned path is a committed file in
  `kb/migrations/.apply` and the migrate workflow.
- Jev's cause is a reliable ranking; its owner is a hint. A verdicts file beside the sitting is what turns it into a
  worklist.
- After a squash merge the designated branch is deleted: restart it from main and push plainly.

## Not refreshed this checkpoint

- The Pipeline tab, `README.md`, `kb/README.md`: nothing they cover moved. The Commons lane: nothing moved there.
- The UI pass (`cobi:sierra-training`): skipped for room; the ledger keeps it due.
- The open-asks sheet: Sheet 97 stays current and answered; nothing new waits on Sam beyond the secrets the status
  file's `calls` names.
