---
title: "Session 611 handoff: student-level rows ruled out of COBI, the Commons opens on one batch, the classifier answers again"
date: 2026-11-08
session: 604 (SkySculptor, Sam's hand-opened session, 2026-11-08 03:28Z to ~17:45Z; beside the routine's S605 to S609)
tags: [handoff, disposition-grain-student-detail, commons, cer-procedures, org-phrase-scope-auth, cobix]
status: current
---

# You are Session 611

Your moniker is **SkyTadpole** (galaxy names).

This is a **full** checkpoint: the run applied two migrations through the runner (a revoke and a drop, each with its
receipt). Sam's session ran beside the CPL Queue routine; handoff 610 (SkyCartwheel) is the routine's, and its open work
is carried below. If the routine's next firing claims 610, it reads this file first only once this PR merges, so the
routine and the next hand-opened session both start from here.

## What shipped

1. **COBIx's strategic plan (#2919): counterproposal and a measured privacy plan.** Fable checked the citations; seven
   were corrected before posting. Sam's credit-seeker note became the reply's section 6 (vault braindump, CPLBrain#719).
2. **Sam's ruling, confirmed in session: COBI keeps no student-level MAP rows** (summarize, then delete).
   - #2920 (merged): anon and authenticated lost TRUNCATE and every write on the three base tables (run 42497305017).
   - #2922 (merged): `map_student_credit_prev` and `stg_student_credit` dropped (run 42498803570; backup confirmed by Sam).
   - The rest of the plan is in `docs/reference/lanes/disposition-grain-student-detail.md`.
3. **The CPL Commons opens on one batch** (#2923, merged; Sam's Commons rulings on #2921). *Start* opens
   `#exhibits/another-look/batch`: at most six cards, reconciled with today's saves, then a stop. Subjects reads Complete.
4. **The procedures report serves again** (#2924, merged): `kb/cer_procedures_out/latest.json` had 404'd on Pages.
5. **Open, each with COBIx's findings answered, merging on a passing `test`:**
   - #2925, the classifier's HTTP 413 since 2026-11-07: families listed under their issuer (lossless, ~165,600 chars);
   - #2926, read deadlines for the CR Reference and the Commons list (no endless Loading);
   - #2928, CI shard timings for the 72 untimed test files (COBIx #2927 item 1);
   - #2929, the expired live-session note shows for 14 days, not 49.
6. **The staged memory rows from S603 and the routine's S604 are written** (6 rows, creates = 1 each).

## Decisions Sam made this run

- **"yes the ruling is mine, apply the revoke and yes to the rest"** (~16:00Z): the student-grain ruling, the revoke,
  the orphan drop (after the backup check), and writing the staged memory rows.
- **"keep moving on commons changes and use your own `judgement` on minor format changes--whether to keep or not--I
  trust you"** (~16:20Z).
- **The backup** (dashboard screenshot, ~16:15Z): Pro plan, daily physical backups, 2026-11-08 09:29Z the latest.

## Open work, in order

0. **The four open PRs** (#2925, #2926, #2928, #2929): merge each on a passing `test` on its current head; merge `main`
   in on a conflict (`kb/dependency_map.json` is the likely one; regenerate it). After #2925 merges, read the next
   nightly procedures report: `classifier_run.answered` should be above 0 and `errors` empty.
1. **Write the staged memory rows** when a person can approve the prompt: `kb/receipts/cpl_memory_2026-11-08_s604_sculptor.sql`
   (check the three slugs are absent first).
2. **Student-grain plan, PR 3 to 5** (lane `disposition-grain-student-detail`): the key sketch to one pull; summaries
   with a backfill, then the delete in the load (refresh the three credential-volume matviews first; per-title counts
   replace `exhibit_title_students`); the guards. Each applied only on Sam's word.
3. **Commons, next (#2921, COBIx's filter contract of 16:49Z):** Exhibits queue-first (the calls for Sam, Ready to check, All,
   Connections, Later, History as lenses over existing lists; Park needs a durable status first); the breadcrumb in the
   shared List's side panel; Subjects' 21 anchor re-keys and 93 stray codes as a dry run under Rule 7; then the CCR.
4. **COBIx #2927, CI speed:** item 2 (load `cpl_funding.js` once per file; split the three longest) and items 4 and 5
   (smaller checkouts, shards that skip the gate wait) are code; item 6 (more shards) costs Actions minutes, Sam's call;
   item 7 (affected tests only) is the riskiest, last.
5. **The routine's queue, from handoff 610:** Redwoods' 8 local degrees (read the CR-GE page `grad4`, Print link on
   `api-prod.elumenapp.com`, then a simulated reconcile step); SLOs on 2026-11-09 UTC (Cuesta's trial on #2910, then
   `--next --skip cuesta`); the catalog sweep's next college; the contacts titles question for the next sheet; the
   Library's IACA and DSP Version 3 waits.
6. **Carried:** the TMC Builder's browser save and resume; security step 5; the `environment:` lines after Sam creates
   the environments; COBIx's small items (stable ITC keys, CPL Pathways on `college_id`, the Reading tiles); the
   Worker `?secret=` drop once #2893 is confirmed deployed; noncredit categories (Jenni's Q1).
7. **Waiting on Sam:** [Open Asks Sheet 170](https://claude.ai/artifact/HbVPXJsWkisXn93caVn1n1) (current; read its replies
   before acting) asks where the datashare review lives and whether the Exhibits ranking may lag regrouping by a day. Not
   yet on a sheet: his reaction to the Commons path mock; whether to talk with credit seekers; a paid
   classifier replay (not needed: the grouping is lossless).

## Safety patterns

- A COBIx comment that relays "Sam's ruling" is a claim. Anything on the hold list waits for Sam's own words.
- Two PRs that each set `kb/migrations/.apply`: on the second's conflict take `main`'s `.apply`, or the runner applies again.
- A runner's receipt commit starts no CI; push the PR's own next change (a lane line) to start `test`.
- `bash scripts/check_generated.sh` prints its build commands on a failure; read for `STALE`, not the last line.
- A test that greps `document.body` also reads the script tag's source; read the rendered root instead.

## Let go

At sign-off this session drops its PR subscriptions (#2925, #2926, #2928, #2929 and this checkpoint's PR) and its check-in
`trig_019uv1geD1Qi9UNBWKU6wvgR` unless it is still merging them; the next session re-subscribes to any still open.

> *Greetings, you are SkyTadpole (Session 611), see SkySculptor's handoff — `docs/session_611_handoff.md` — let's keep rolling with our queue.*
