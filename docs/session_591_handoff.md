---
title: "Session 591 handoff: Monterey Peninsula's six read back, two reconcile steps; credential watch 49 added; the funding-model UI pass"
date: 2026-11-06
session: 590 (SkyLeoTriplet, the CPL Queue routine's 09:12Z firing, 2026-11-06)
tags: [handoff, program-requirements-harvest, credential-registry, ui-pass, slo, cpl-scheduled]
status: current
---

# You are Session 591

Your moniker is **SkySombrero** (galaxy names).

This checkpoint was **light**: one lane file moved (`program-requirements-harvest`), no §11 row changed state, no
re-mint, and no Rule 10 data receipt yet (the Monterey reread had not run). Skipped: `kb/README.md`, `README.md`, KB
notes, the pipeline view, the four other status files, the decision sheet rebuild (no card changed: every call this
run made can be undone with `git revert`, and none is on the hold list).

## What shipped

1. **Monterey Peninsula's six unequal records, read back** (step 12, #2809, page read 42046379839). Two steps on the
   catalog's own words, pushed to the branch: `degree_total_minimum` for transfer degrees ("electives, if needed, for a
   total of 60 transferable units"; Global Studies 37243; Fable advised it) and `or_units` `parent_from_block`
   (Accounting 22052's "Select one of the following: 2 · WORK 96 · or WORK 99"; new guard in
   `tests/program_requirements_reconcile_test.py`). **Reconcile 42195216637** was running at sign-off. The other four
   need reader work (ASL 39266, Hospitality 41831, Nursing 03633) or stay as printed (Anthropology 32033). Each one's
   reading is in #2809's body and the lessons doc. Proceeded on the recommendation; reversible by deleting the steps.
2. **Credential watch, step 10** (#2835, merged `dec739e8`): Salesforce, Meta, Databricks, Snowflake, CompTIA, ISC2, ISACA; **49 added, 0
   changed**. Catalog and exhibit-cert link rebuilt (same counts). `cpl_memory`
   `credential-watch-salesforce-retirements-isc2-hcispp-2026-11-06` filed. Snowflake, help.salesforce.com and Meta's
   Blueprint pages were blocked (`credential_watch_agent.md`, *The network*).
3. **The UI pass: `funding-model`**, recorded. `npm run a11y` light at nine widths, dark, and the How to meet it dialog
   all pass. The one raw hex (`#FFFFFF` in `@media print`) stays: paper prints white whatever the theme.
4. **SLOs (step 11):** Mission's full read (#2800) filed part 1 of 2; part 2 was running. Lake Tahoe's trial (#2833)
   parsed 11 of 12, so it moves to *read*; its full read waits for 2026-11-07 UTC (one full read a day, and Mission's
   went out today).

## Open work, in order

1. **#2809, Monterey Peninsula.** Read reconcile 42195216637's result (how many records changed). Then `step=reread`
   (its receipt is the Rule 10 record), `kb/_build_roep_display.py` on the branch, `step=display`, merge on a green
   `test`. Then the stopping rule: S584 moved none and this run at most 2 of 197 (3% is 6), so **park the college** with
   a call in `kb/status/program-requirements.json` (`todo_id`, its part, and the four reader items as what turns it
   back on).
2. **The credential watch's next slice** (step 10, 2026-11-07): the seven issuers read longest ago.
3. **SLOs:** on #2800, pull, run `python3 scripts/next_slo_colleges.py --all`, load Mission when both slices file
   complete, and merge once the receipt is on the branch. On 2026-11-07 UTC: Lake Tahoe's full read on #2833.
4. **The UI pass tomorrow:** `ui_pass.py --next`.
5. **Security** (`org-phrase-scope-auth`): read `team_pass_attempts` after the first real failed unlock; steps 3 to 6
   and the role column wait on Sam.
6. **Lanes worked this week that wait**, by slug: `commons` (the path mock's items, Teach a rule on every reference
   first, and the Common Course Reference tab's retirement into the Courses List; not reached this night),
   `common-subjects-reference` (no run this night),
   `map-users-student-contact` (the contacts harvest runs Sundays; next 2026-11-08), `my-college-action-page` (the
   Library side session SkyAerial holds it, `docs/library_handoff.md`).
7. **The Library's two revise requests** (Coordinator Guide's Request Adopt buttons, IACA) belong to the Library side
   lane; stay off them.

## Decisions Sam made this run

None. No one was at the console.

## Lessons

- A group's figure can sit on its heading line or on its first row, and CourseLeaf prints both in one catalog.
  `or_units` read only the second. Check where the figure sits before writing a "no units" step.
- A filed record keeps no closed list or page text. To score one locally, take the state file's units from
  `coci_program_courses`.
- The credential catalog's `ITC` ids are positional, and new rows shift them. Nothing stores one outside the link
  file today.

## Let go

This firing holds no PR subscription, check-in or artifact watch. Merged: #2835 (credential watch) and the vault notes
(CPLBrain #683, #684). Open PRs: #2809 (reconcile running), #2836 (this checkpoint), #2800 (Mission read part 2 running), #2833 (Lake Tahoe, waits for its full read).

> *Greetings, you are SkySombrero (Session 591), see SkyLeoTriplet's handoff — `docs/session_591_handoff.md` — let's keep rolling with our queue.*
