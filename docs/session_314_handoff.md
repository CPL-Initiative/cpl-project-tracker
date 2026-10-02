---
title: Session 314 handoff — sheet 16's verdicts, the AWS fold, and the deadline re-render
date: 2026-10-02
session: 313 (SkyReel)
tags: [handoff, implementation-funding, funding-video, sierra, partner-crosswalks, decision-sheet]
status: current
---

# You are Session 314

Your moniker is **SkyVerdict**. S313 cleared its queue: Sierra v77, both CER renames, the video round
and the explainer's progress lines. What remains waits on Sam, and sheet 16 asks him all of it. This
is a full checkpoint; every Rule 9 artifact is current except the Pipeline tab (the pipeline did not
move) and `README.md` / `kb/README.md` (no user-facing surface or generator changed beyond what the
lanes record).

## First, in this order

1. **#1809 and this checkpoint.** If either is open, merge it on a green `test` (squash). #1809 is the
   video round and the explainer port; the checkpoint PR carries the docs.
2. **Read sheet 16's `replies`** (https://claude.ai/artifact/49Rh1tw4TZy4MS9o1jF7UH; the high-water
   mark rule applies, `docs/reference/decision_sheets.md`). Five cards:
   1. **Sierra's CCSF answer on v77.** "Right" closes it; "Wrong" carries his words: compare them
      with that day's `map_college_credit_summary` / `_bucket` / `map_college_exhibit_credit` rows
      for college_id 30 before touching code.
   2. **The AWS merge and the Microsoft title.** When he confirms the merge, dispatch
      `cred-rename-apply.yml` once the daily dry run lists it under Confirmed merges. The workflow now
      rebuilds the three derived files itself.
   3. **Cards 23-24.** "Apply them" means you write both scenarios through
      `funding-config-edit-apply.yml`, dry run first.
   4. **The confirmation deadline.** Set the answer in `prototype/funding_video/build.py` (`timing()`
      and `deadline` for Scenario 2), re-render both introductions (`render.sh`, about five minutes
      each, re-versioned names, update the explainer's links and `tests/funding_video_page.test.js`).
      If he picks Dec 30, `participationDeadline` changes too: that is a config edit (his, or the
      workflow on his word), and the explainer and the Confirm chips follow.
   5. **The new introduction.** "Use $8,959,692" changes the s2 reported box (`prios[2][3]` in
      `build.py`) and re-renders Scenario 2.
3. **Smoke run 36943057866 (23:52 UTC, against v77) failed one wording assertion**, seven minutes after the
   dispatched run 36942436624 passed every mode on the same v77. Read its `::error::` lines first; a mode
   that fails once and passes once is a prompt that half-holds, so decide whether v77 needs a change.
4. **ElevenLabs** waits on Sam's Scenario 2 script (sheet 6 card 1). With it: `creative_list_voices`,
   pick an American English female voice and say which, voice each scene, and feed the audio to
   `narrate.py`'s layout and `cues.py --listen` in place of Kokoro.

## What shipped

- **#1808 (Sierra v77, deployed 23:23 UTC):** the college matcher strips a possessive, so "City
  College of San Francisco's" resolves; LEAD WITH THE ANSWER keeps 7c's first sentence to the course.
  The dispatched smoke on v77 passed every mode. It also rebuilt the files the rename left stale.
- **CER:** `cred-rename-apply.yml` applied Sam's two renames (CCNA Cybersecurity; AWS CloudOps
  Engineer - Associate) at 22:46 UTC; receipt `kb/cred_rename_out/2026-10-01/`.
- **#1809:** the introductions get a slide on how a target is set (statewide funding ÷ $2,824.82),
  the statewide funding under each priority, Access as every applied unit, the Targets kick led by
  the priority, dates from the config, a plain closing label, sweep card 25's wording at 100 seconds;
  MP4s `_v4` and `_Scenario_2_v5`. The explainer prints each priority's target, price and progress
  and each condition's count from the tab's new `_publicProgress()`. The FAQ's Access answer counts
  every request. The rename workflow rebuilds its derived files.
- **Sheet 16** replaces sheet 15 (no replies had come in).

## Sam's rulings this run

- None new in chat. The video round and card 6 executed his S312-evening asks. One adaptation he
  should see: card 25 said "90-second", and the slide took the film to 100 seconds, so the page says
  so (sheet 16 card 5).

## Safety patterns

- ⚠️ **In the video source the clock shift is `LS`, never `L`:** `buildK` declares its own `var L`.
  jsdom cannot run `buildK`'s measured path or the offline score, so stills on the render page
  (`build.py <v> --render`, both scenarios) and the `m0` source guard are the checks.
- ⚠️ **Prove a narrated draft unchanged with a stage-DOM dump, not screenshots** (JPEG bytes differ
  run to run).
- ⚠️ **A stored config for the engine: transcribe it and match `md5(config::text)`**
  (`docs/kb-notes/methodology-a-postgres-md5-proves-a-transcribed-jsonb-copy.md`).
- ⚠️ **Grep `tests/` for every retired string, links included:** a Scenario 2 test pinned the
  `?scenario=Scenario%202` address and cost #1809 a CI cycle.
- ⚠️ Budgets at the edge: `CLAUDE.md` 59,975 / 60,000; lanes `implementation-funding` 19,990,
  `sierra-retrieval-corpus` 19,986, `partner-crosswalks` 19,990 of 20,000. Delete before you add.
