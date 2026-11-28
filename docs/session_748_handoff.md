---
title: "Session 748 handoff (from SkyShearwater, S747, Sam's plain session of 2026-11-28: the 38-unit B.S., panels beside the view, Commons Clarity 3 and 4, the click-through, COCI descriptions)"
created: 2026-11-28
updated: 2026-11-28
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

# You are SkyGannet (Session 748), Sam's next plain session

From SkyShearwater (S747), Sam's plain session of 2026-11-28 04:27Z to 07:55Z. A **full checkpoint** (a KB generator
changed: `kb/_build_coci_lookup.py`, and `kb/_text_repair.py` in #3943). Lanes moved: `program-requirements-harvest`
and `commons` (trimmed back under budget, 19,374 bytes). Skipped: step 7 (no roadmap status, auditor count or re-mint
moved), `README.md` and `kb/README.md` (no tab joined or left; the COCI builder's outputs are the same files). KB note
updated, not added: `methodology-a-double-decoded-string-needs-the-codec-that-decoded-it` (S747 section). No `##
Conductor settings` block (conductor mode is retired).

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
3. **Merge order:** #3943 (COCI descriptions on the one repair module; `test` was pending at sign-off), then this
   checkpoint's PR. COBIx's #3917 and #3926 stay open for Sam or COBIx to close (superseded by #3929 and #3932).
4. **At start, read the training notes** (`kb_curation` rows, `field = 'procedure_note'`, newest first, and any with
   `value.act = true`) and act on what they ask. S747 found none new since 2026-11-27.

## Sam's words this run

None: Sam opened the session with the standing line and made no rulings. Nothing for 0b.

Memory rows written and logged this run (`creates = 1` each): `f-older-display-builds-are-unrefiled-reads-s747`,
`d-featured-bs-counts-catalog-structure-s747`, `d-commons-clarity-items-3-4-s747`, `f-coci-desc-one-repair-module-s747`,
`p-look-at-a-shipped-view-live-s747`.

## What shipped (merged)

- **#3936** the featured Field Ironworker Supervisor B.S. lays out the A.S. major as the catalog prints it and counts
  38 units of CPL (was 31.5); `.cplpw-panel` (Request Adopt, SLOs) opens beside the view from 900px. Both checked live.
- **#3938** Commons Clarity 3 and 4: Exhibits always carries *Back to CPL Commons*; *None held* in place of *0 of 0*;
  *Saved, waiting* only while a save waits.
- **#3939** `adopt_panel.js` adds its stylesheet with the model, so a B.S. directory card's Request Adopt paints
  styled (checked live on Foothill Dental Hygiene).
- **#3941** the click-through's `#exhibits/list/nosubj` rule is an equality (597 both sides). Dispatched run
  46117050856 on main: 13 of 15.
- **#3942** COCI descriptions cleaned at build: 78,796 `_x000D_` and cp1252 mojibake (26,533 of 130,478 changed).
- **Checked after the 06:26Z daily run:** Cerritos Field Ironworkers' Trained by lists Ironworker JATC with the
  Reinforcing and Structural Period credentials.

## Read in order

1. `docs/reference/lanes/commons.md`, the click-through and *NEXT, Commons Clarity*; `docs/commons_lessons.md`, S747.
2. `docs/reference/lanes/program-requirements-harvest.md`, *CPL Pathways*; `docs/cpl_pathways_lessons.md`, S747;
   `docs/program_requirements_harvest_lessons.md`, S747.
3. `docs/reference/lanes/common-subjects-reference.md`, *NEXT (S744)*.

## Open work, in order (from the lanes' NEXT lines)

1. **#3943**: merge once `test` is green on its head (update from `main` first if behind).
2. **#3555** (`commons` NEXT): close it once a click-through run comes back clean. The run near 14:17Z on 2026-11-28 is
   the next one; if `#program-requirements/list/fail` misses its landing again, read that run's
   `out/commons_clickthrough.json` for what the Programs List showed.
3. **Commons Clarity items waiting on Sam** (`commons` NEXT): (1) where he saw 514 against 433 (not reproduced);
   (2) whether Needs you should open the lightning round directly, which reverses his S723 landing ruling; (5) whether
   procedure notes stay hidden and whether a signed-out viewer may see the credentials. Ask in one plain line each
   when he is in session; nothing waits on them.
4. **The 32 older-build records** (harvest lane): no action of ours; De Anza's 15 come in when the routine extracts them,
   the other 17 are recall work.
5. **Earlier queue:** the CVC sketch (waits on Sam's `.mhtml`); Library records for the PPM and ASSIST sketches; a
   session-start read of `procedure_note` rows with act true.
6. **common-subjects-reference NEXT:** LACCD's 41 untitled and 87 differing titles as one list; the schedule-tool sweep
   (Glendale 31, Santa Barbara City, North Orange CE, MiraCosta first); the Accounting apply, **BLOCKED** on Sam's four
   Business saves; the 35 held and the 50 under 90 (Sam's picks). S746's session also holds Sam's open question on 38
   differing batch-4 names and Glendale STV's title.

Beside the queue: the three outside-tool request drafts go out only on Sam's word; the harvest's collection is the
routine's; **implementation-funding** waits on the team.

## Patterns that worked

- Look at the shipped view live after the merge: two defects (the panel over the view, the unstyled chips) passed every
  test and were plain on the page.
- Read a failing check's figures before calling it a regression: the click-through's nosubj miss was the two sides
  coming to agree.
- A read-only workflow with `workflow_dispatch` can run on demand instead of waiting on a late cron.

## Safety

- Search `docs/kb-notes/` for the problem's words before writing a fix: S747 reimplemented `kb/_text_repair.py` and
  folded it back in (#3943). The consult-doctrine skill exists for this.
- A test that pins a figure or a tab's membership is re-pointed with its reason in a comment, never bent to pass.
- A permission-check denial is never routed around: S747's local browser check was denied, so it verified on the live
  site after merge instead.
- Outward requests are drafts; a human presses send.

## Let go

At sign-off the session drops its PR subscriptions (#3943, this checkpoint's PR, the CPLBrain note's PR) and holds no
check-in or artifact watch. No COBIx watcher.

Spend: not available; 2026-11-28T04:27Z to 2026-11-28T07:55Z.

Opening line: *Greetings, you are SkyGannet (Session 748), see SkyShearwater's handoff — `docs/session_748_handoff.md` — let's keep rolling with our queue.*
