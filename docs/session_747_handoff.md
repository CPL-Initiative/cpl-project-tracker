---
title: "Session 747 handoff (from SkyPetrel, S746, Sam's plain session of 2026-11-27 to 11-28: Trained by, MAP's live view, the click-through, COBIx's bundle, Request Adopt)"
created: 2026-11-28
updated: 2026-11-28
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

# You are SkyShearwater (Session 747), Sam's next plain session

From SkyPetrel (S746), Sam's plain session of 2026-11-27 22:46Z to 2026-11-28 02:15Z. A **full checkpoint** (KB
generators changed: `kb/_build_program_certs.py`, `kb/_build_roep_display.py`, `kb/_build_commons_status.py`,
`kb/coci_subject_folds.py`; one Rule 10 display write). Lanes moved: `common-subjects-reference` (compacted to 19,542
bytes) and `commons` (compacted to 19,026); `program-requirements-harvest` (compacted to 18,549; the S744 and S745 CPL Pathways text moved verbatim to
`roadmap_archive_8`). Skipped: step 7 (no roadmap status or auditor counts moved), `README.md` (no tab joined or left) and a KB note
(the dated-feed lesson is already `methodology-a-dispatch-only-feed-goes-stale-without-a-sound`). No `## Conductor
settings` block (conductor mode is retired, checkpoint step 8).

## Open with the standing block

1. **No COBIx watcher.** Sam said no COBIx check-ins for now (`d-cobix-watcher-stopped-on-sam-word-s714`). Start
   `bash scripts/cobix_watch.sh [state dir]` only if he asks. Read a PR's whole thread before you merge it.
1a. **Clone light (Sam, 2026-11-19):** `git clone --filter=blob:none` (or `--depth=1`), never a full clone; fetch `main`
   by name.
2. **Merge rules:** at most 3 open PRs (plus #3511 and dependabot's), the oldest finished first, one update from `main`
   right before its merge, `test` green on the head; no dependency-map rebuild inside a PR; no full rerun when the input
   fingerprints match; never a PR on a branch holding another open PR's commits.
2a. **Sam's work order (2026-11-20):** collection first, data waves before fixes (`r-collection-first-sam-2026-11-20`);
   collection's fixes rank by the M-ID cards they unblock (`r-collect-for-mids-work-order-sam-2026-11-20`).
2b. **Before a push, `bash scripts/check_generated.sh` must read all ok.**
3. **Merge order:** this checkpoint's PR; #3930 merged (`6713dc48`). COBIx's #3917 and #3926 are
   superseded by #3929 and #3932 and stay open for Sam or COBIx to close; #3888 closes after Sam checks it on his phone.
4. **At start, read the training notes** (`kb_curation` rows, `field = 'procedure_note'`, newest first, and any with
   `value.act = true`) and act on what they ask.

## Sam's words and rulings (S746)

- On the Trained by sketch: *"That looks good. please use it"*. On the display reading MAP's live view: *"yes, that's
  the way to go. please roll with it"*.
- *"the new request adopt is not just for BS directory but all cpl pathway programs, right?"* Yes:
  **RULED** `r-request-adopt-one-form-sam-2026-11-28`.
- On #3917: retarget the Hancock targets to Hancock's own codes before merge:
  **RULED** `r-folds-take-the-colleges-own-codes-sam-2026-11-28`.
- *"may help to note in memory that when you open a cobi view, you will always get interrupted with the painting of the
  day--expect it and no need to note it in the chat"* (`p-cobi-view-painting-of-the-day-expect-it-sam-2026-11-28`).
- *"i changed queue to fable"*: the CPL queue routine had been stored on Opus 5.5 since 2026-11-26 03:50Z
  (`f-cpl-queue-model-was-opus-since-nov-26-s746`).
- #3888 closes after Sam checks it on his phone.

Memory rows written and logged this run (step 10, by the conductor): `d-trained-by-committees-only-s746`,
`f-trainer-field-names-one-site-s746`, `r-request-adopt-one-form-sam-2026-11-28`,
`r-folds-take-the-colleges-own-codes-sam-2026-11-28`, `p-cobi-view-painting-of-the-day-expect-it-sam-2026-11-28`,
`f-cpl-queue-model-was-opus-since-nov-26-s746`, `f-pages-header-is-the-daily-run-s746`,
`f-saves-on-a-folded-code-go-unseen-s746`.

## What shipped (merged)

- **#3925** *Trained by* on CPL Pathways program cards, training committees only: 19 programs (Carpenters Training
  Committee 9, IBEW JATC 7, Ironworker JATC 3). The 15 Cerritos Period trainers (receipt #3923) fold with the 06:17Z run.
- **#3927** the display build reads `kb/exhibits_adoption.json` (MAP's live view) as a third CPL-here source: 2,395
  programs gain CPL here (1,573 from none), 8,264 course entries, nothing drops; Cerritos Field Ironworkers 24 of 24, up
  to 38 units. **Rule 10:** run 46092611343 applied build `229a759101f7` to 18,751 `program_requirement_records`;
  rollback is re-applying the previous indexed build.
- **#3928** the Commons click-through (#3555): the scan rule, nosubj re-read 597 and 1,344, one rule for a confirmed
  subject (person 138; confirmed and settled 151 to 246).
- **#3929** COBIx's #3917 on main: 38 Hancock remaps to Hancock's codes, 9 bad splits, `not_a_subject` honored, the *Ask
  COBI to act* checkbox; lightning round 494 to 416. **#3932** COBIx's 22 #3926 titles filed.
- **#3930** (merged `6713dc48`): Request Adopt in one form on every CPL Pathways view (mocks
  https://claude.ai/artifact/HNTRY9Rjymb9pTkZbdJfsp, https://claude.ai/artifact/74oA2cnB2wJ66LNaKtHSLf).

## Read in order

1. `docs/reference/lanes/program-requirements-harvest.md`, *CPL Pathways*; `docs/cpl_pathways_lessons.md`, S746.
2. `docs/reference/lanes/commons.md`, the click-through and *NEXT, Commons Clarity*.
3. `docs/reference/lanes/common-subjects-reference.md`, #3929 and *NEXT (S744)*; `docs/common_subject_code_tab_lessons.md`, S746.

## Open work, in order (from the lanes' NEXT lines)

1. **Look at #3930 live** on a catalog card, the Field Ironworker Supervisor B.S. and a B.S. directory card (one chip,
   one sidebar, the nearest-exhibit link).
2. **Commons Clarity** (`commons` NEXT, none worked in S746): the 433 against 514 counts; Needs you opens the card, not
   the lightning round, with no link back; the Exhibits pages lack back links; the Exhibits tiles read *0 of 0* and
   *Saved, waiting* 0 with no Needs you route; Sam's question whether procedure notes stay hidden and whether a
   signed-out viewer may see the credentials.
3. **After the 06:17Z daily run:** confirm Cerritos Field Ironworkers' Trained by lists the Period credentials; confirm
   #3555's click-through comes back clean, then close #3555.
4. **The 31 records on older display builds** (`0874a3a15f22` x16, `bef8ef819af7` x15): not examined; find why.
5. **The featured B.S. page's hero figures** (`cpl_pathways_data.js`) still say 31.5 units of CPL; check against 38 and
   fix at the generator or data.
6. Earlier queue: the CVC sketch (waits on Sam's `.mhtml`); Library records for the PPM and ASSIST sketches; COCI
   description cleanup at build (`kb/_build_coci_lookup.py`); a session-start read of `procedure_note` rows with act true.
7. **common-subjects-reference NEXT:** LACCD's 41 untitled and 87 differing titles as one list; the schedule-tool sweep
   (Glendale 31, Santa Barbara City, North Orange CE, MiraCosta first); the Accounting apply, **BLOCKED** on Sam's four
   Business saves; the 35 held and the 50 under 90 (Sam's picks).

Beside the queue: the three outside-tool request drafts go out only on Sam's word; the harvest's collection is the
routine's; **implementation-funding** waits on the team.

## Patterns that worked

- Sketch first, Sam's word, then the build: Trained by and Request Adopt each went mock, *"please use it"*, PR.
- A third source added only where the others are silent: nothing drops, and a sample checks it against MAP's lines.
- Rebuild a stale outside PR on main and leave the original open, rather than merging it over a fold it predates.

## Safety

- Rule 10: the display write rolls back by re-applying the previous indexed build; a bulk write is insert-only under a
  cohort email with a committed receipt.
- A test that pins a figure is re-pinned with its reason in a comment, never bent to pass.
- Opening a COBI view paints the painting of the day first; expect it and do not mention it.
- Outward requests are drafts; a human presses send.

## Let go

At sign-off the conductor drops its PR subscriptions (this checkpoint's PR, CPLBrain#879) and its artifact watches
(https://claude.ai/artifact/HNTRY9Rjymb9pTkZbdJfsp, https://claude.ai/artifact/74oA2cnB2wJ66LNaKtHSLf); no COBIx
watcher, no check-in.

Spend: not available; 2026-11-27T22:46Z to 2026-11-28T02:40Z.

Opening line: *Greetings, you are SkyShearwater (Session 747), see SkyPetrel's handoff — `docs/session_747_handoff.md` — let's keep rolling with our queue.*
