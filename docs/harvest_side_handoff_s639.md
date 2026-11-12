---
title: Program requirements harvest — side-session handoff (S639, second session)
date: 2026-11-12
tags: [handoff, program-requirements, harvest, side-lane]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
related:
  - "[[docs/reference/lanes/program-requirements-harvest]]"
  - "[[docs/program_requirements_harvest_lessons]]"
  - "[[docs/reference/conductor_mode]]"
---

# Program requirements harvest: side session beside the S639 conductor

Sam opened a second session from iOS at 00:33Z 2026-11-12 with handoff 639's opening line while SkyQuail (S639, the
conductor, session `…wbUp`) was working. The two agreed one writer by message at 00:44Z: the conductor keeps the
moniker, handoff 640, the COBIx threads, Sheet 181, `kb_curation`, every cer, rename and family apply, and the
`cer-procedures`, `commons` and governance lanes. This session takes the `program-requirements-harvest` lane and
writes this file instead of a numbered handoff. **The numbered handoff is 640** (the conductor's, on `main` through #3134); this file stands beside it and covers the harvest lane alone.

**Scope (declared for the CPL Queue routine):** `docs/reference/lanes/program-requirements-harvest.md`, the harvest
lessons docs, `kb/program_requirements_reconcile.json`, `kb/_program_requirements_*.py`, `kb/college_reads/`,
`kb/program_requirements_college/`, `kb/receipts/program_requirement_records_*`, the ROEP display build and their
tests; table `program_requirement_records` through `program-requirements-college.yml` only.

**Agreed with the conductor:** receipt-only pushes from harvest runs are fine at any time. A merge that changes
generated `kb/` files waits until no `daily-dashboard`, `cer-decision-apply`, `cred-rename-apply` or
`credential-family-apply` run is in flight (read `list_workflow_runs` first).

## Read first, in order

1. This file. 2. The lane, [`program-requirements-harvest`](reference/lanes/program-requirements-harvest.md), its
*S639 side session* block. 3. The lessons, [`program_requirements_harvest_lessons`](program_requirements_harvest_lessons.md),
its last section, *S639 side session*. 4. For the three colleges not started:
[`harvest_wave3_diagnoses_s639`](harvest_wave3_diagnoses_s639.md). 5. Each open PR's body below: it states its
evidence, its simulation and its dispatch inputs.

## What is live and what is not (02:27Z 2026-11-12)

**Live** (`program_requirement_records`, measured 01:20Z): 17,580 rows, 14,963 pass the machine checks. Headline at
01:26Z: 20,282 active programs, 13,779 complete, 114 colleges. The shared cause at about a dozen colleges: a degree
names a general education pattern and prints no units for it.

**Not live yet:** nothing from this wave has been reread into the table except what a reread run below names. No
harvest PR has merged. Victor Valley has posted nothing. American River's run 43134279776 is neither loaded nor
reread. The conductor will correct the live counts at its end; read them fresh before you cite one.

## Ledger (02:27Z 2026-11-12)

| College | PR, branch | State at 02:27Z |
|---|---|---|
| Los Angeles City (156 of 223 live) | #3130, `claude/harvest-los-angeles-city-s639` | Two local steps from the catalog's own words (the heading's *Total Units: Minimum of 60* a floor; GE the printed 18-27, pages 59 and 60 quoted beside it), `only_with` on `set` steps, and `heading_above_code` in the capture (this college only). Reconciles 43136137275 and 43138495821: 25 moved to passing, none regressed, about 181 of 223. Two reviews, no wrong record, test gaps closed. First reread 43141074738 (`force=43136137275`) dispatched 02:23Z; the second follows. |
| Orange Coast (187 of 259 live) | #3133, `claude/harvest-orange-coast-s639` | 64 of 72 live failures carry the S395 extraction. Ten steps (*Up to 21*, the A.A.'s *Up to 27*, Cal-GETC *up to 34*, an exact 21). Simulated 194 to 202 on nine read pages, ceiling 234 of 274 filed. Reconcile 43136182950 dispatched 01:41Z, in flight. Review: no wrong record, one nit (no test holds the degree-total step's adjacency guard), not sent while the run is in flight. |
| Victor Valley (108 of 168 live) | #3131, `claude/harvest-victor-valley-s639` | `hours_file` for `course_hours`, the scorer's `hours_meets_top`, `tabs_with_prose`, a Cal-GETC step. Reach 22, all Victor Valley. The review at 587882fc confirmed eight minor findings; all fixed in 1f6e110b2, held unpushed until reconcile 43139057384 (pre-fix head, dispatched 02:06Z) files. Nothing posted live. 37006 and 38352 stay as read (Sheet 85). |
| American River | `claude/harvest-american-river-s639`, no PR | Read 43134279776 ($12.99): 154 records rewritten, 16 improved, 30 passing now fail. Not loaded, not reread; kept for reference. |
| The PDF reader | #3135, `claude/harvest-pdf-reader-s639` | `text_sha` (a moved page with unchanged text keeps its record, no model call) and the list-page rule. Capture-only proofs on that branch: American River and Los Angeles City dispatched about 02:15Z; Sacramento City, Los Angeles Valley and College of the Desert to dispatch. |
| Rio Hondo (245 of 288 live) | #3136, `claude/harvest-rio-hondo-s639` | The catalog prints Cal-GETC by area, no total. Decided *count* (34, the sum of its own printed areas); the worker is writing the step. Simulated 276 of 288. No run yet. |
| West Valley (93 of 133 live) | #3137, `claude/harvest-west-valley-s639` | The same; decided *count*, 34. Simulated 120 of 133. No run yet. |
| Berkeley City (35 of 89 live) | #3138, `claude/harvest-berkeley-city-s639` | Local degrees take *at least 18 units in general education* and its electives rule; simulated 35 to 49. Reconcile dispatched 02:28Z. Its 21 transfer degrees wait: the Cal-GETC tab prints no units. |
| San Bernardino Valley, Grossmont, East Los Angeles | none | Diagnosed, not started: [`harvest_wave3_diagnoses_s639`](harvest_wave3_diagnoses_s639.md). |
| De Anza tail | none | 15 rows on 2025-2026 left behind by the wave (Sheet 118 card 1, the S456 method); 24 rows with no display; the display build after this wave's rereads. |

## Next, in order

Every dispatch is `program-requirements-college.yml` (`mcp__github__actions_run_trigger`, `run_workflow`) with the
inputs named. **Before each:** read `list_workflow_runs` for that workflow and confirm no run is in flight on the same
branch or the same college's host (one run per host; a push to a branch with a run in flight collides with the run's
filing commit). **Before any merge:** the PR's review is clean, `test` has succeeded on the current head, and the
conductor's hold is lifted (it asked that no merge changing generated `kb/` files land until it messages that its next
`daily-dashboard` run has committed; at 02:27Z the hold stood). A reread's receipt commit leaves the head with no
checks, so the next real push follows it before you read `get_check_runs`.

1. **Los Angeles City, second reread.** When 43141074738 has finished and filed its receipt: ref
   `claude/harvest-los-angeles-city-s639`, college `Los Angeles City College`, step `reread`, extract `0`, force
   `43138495821`. Gate: the first reread's receipt committed, 0 errors.
2. **Orange Coast, reread.** When reconcile 43136182950 has filed: ref `claude/harvest-orange-coast-s639`, college
   `Orange Coast College`, step `reread`, extract `0`, force `43136182950`. Then push the adjacency-guard test (the
   review's nit). Gate: the run filed; its changed count read from the log.
3. **Victor Valley.** When 43139057384 has filed: push 1f6e110b2 (the worker holds it; if the worker is gone, the
   review findings are in the PR's review threads); restore to `main`'s version any record that run filed outside the
   fixed scope (the Cal-GETC step's about 20 extra transfer degrees, the two extra tab pages); then reconcile: ref
   `claude/harvest-victor-valley-s639`, college `Victor Valley College`, step `reconcile`, extract `0`, force empty;
   then reread with force `<that run>`. Gate: `test` green on the fixed head; reach still 22.
4. **Berkeley City, reread.** When the 02:28Z reconcile has filed: ref `claude/harvest-berkeley-city-s639`, college
   `Berkeley City College`, step `reread`, extract `0`, force `<the reconcile run>`.
5. **Rio Hondo and West Valley, reconcile, one at a time.** When the worker has pushed the *count* step and its test:
   ref `claude/harvest-rio-hondo-s639`, college `Rio Hondo College`, step `reconcile`, extract `0`; then the reread
   with force `<that run>`. The same for `claude/harvest-west-valley-s639`, college `West Valley College`. Gate: the
   step's pattern checked against the read's own lines, review clean.
6. **The PDF reader's proofs (#3135).** One capture-only run at a time on ref `claude/harvest-pdf-reader-s639`, step
   `read`, extract `0`, force empty, college in turn `Sacramento City College`, `Los Angeles Valley College`,
   `College of the Desert` (after American River and Los Angeles City finish). Read each capture's `would_extract`
   and its picks against `main`'s. Gate: a review of #3135 after the five proofs.
7. **The paid re-extractions, after step 6's review.** American River: ref `claude/harvest-pdf-reader-s639`, college
   `American River College`, step `read`, extract `1`, force empty, so only what `would_extract` names goes to the
   model. Run the same capture with extract `0` first and price it from the count; the $40 a college go holds. Los
   Angeles City's records read past their heading: the same, college `Los Angeles City College`, force `<their
   control numbers from #3130's body>`. Run 43134279776's records stay unloaded.
8. **San Bernardino Valley, Grossmont, East Los Angeles.** One writer for the two scorer readings in the diagnoses
   doc, each measured at every college first; then each college's free reads, steps, reconcile and reread as that doc
   says.
9. **De Anza tail**, then the display build: run `kb/_build_roep_display.py` on a branch, commit its two outputs, and
   dispatch step `display`. After this wave's rereads only.

Merge each PR once its gates hold (squash).

## Decisions recorded (status `proposed` in `kb/receipts/cpl_memory_s639_harvest_side_2026-11-12.sql`)

- `d-lacc-heading-minimum-60-s639`: Los Angeles City's local degrees take the heading's *Minimum of 60* as a floor and GE 18-27 as printed.
- `d-occ-up-to-ge-maximum-s639`: Orange Coast's *Up to N* GE lines are that pattern's maximum.
- `d-hours-meets-top-term-length-s639`: the term-length hours reading (eight ninths, single figures, exactly the top); this session's call for Sam to revise, told to him in chat at about 01:50Z and 02:05Z, no reply. Sheet 120 card 1 unchanged.
- `d-rio-hondo-cal-getc-areas-count-s639`, `d-west-valley-cal-getc-areas-count-s639`: Cal-GETC 34 counted from each college's printed areas, extending Sam's *count* (Sheet 180 cards 2 and 4); the lane conductor's call for Sam to revise.

## Held, and dropped at sign-off

**Subscriptions:** #3129, #3130, #3131, #3133, #3135, #3136, #3137, #3138. **Check-ins:** `trig_01GUfkzz7UZ8qgB8rbbMVw2D`
(02:31Z) and `trig_01SDe23s95ViUGX1wKkJyQcu` (02:38Z). A successor that takes the lane takes these; at sign-off it
unsubscribes each PR and deletes each check-in, naming them in its own note.

## Limits

**Disk:** about 5.4 GB free with four worker checkouts at 4.4 GB each, so no fifth; a worker done with its branch
removes its checkout first. **Context:** each new PR's subscription notice costs the conductor about 8,000 tokens, so
open a PR only when it has something to merge.

**Workers do not survive a container restart.** To brief a fresh one: give it the PR number, the branch, this file's
ledger row and its *Next* step; tell it to read the PR body (evidence, steps, simulation), the PR's review threads, and
the lessons section; and name the gate it must report on before any dispatch. It works in its own checkout of that
branch and writes nothing outside the PR's declared scope.
