---
title: "The Commons — lessons"
date: 2026-10-18
updated: 2026-10-18
tags: [lessons, commons, program-requirements, cer-procedures, skyview, common-cr-reference]
artifacts:
  - commons_progress.js
  - commons.js
  - kb/_build_commons_status.py
  - kb/status/commons.json
  - tests/commons.test.js
  - tests/commons_status_build_test.py
  - program_requirements.js
  - tests/commons_progress.test.js
  - kb/status/program-requirements.json
  - scripts/queue_status.py
related:
  - docs/reference/lanes/commons.md
  - docs/program_requirements_harvest_lessons.md
  - docs/kb-notes/methodology-a-shared-view-borrows-the-host-s-primitives.md
---

# The Commons — lessons

The lane ([`docs/reference/lanes/commons.md`](reference/lanes/commons.md)) states where the Commons stands; this doc
keeps what each step taught, once. Sam's framing (2026-10-18): *"each of our 'common' projects should have the same
approach and tracking and feedback system... It all needs to culminate in a 'Commons' dash."* The ruled order (Open
Asks Sheet 95 card 1): a shared Progress module, then each reference's Progress view, then the Commons tab.

## S419 SkyCottonwood (2026-10-18): step 1, the shared Progress module (#2237)

- **What moved, what stayed.** `commons_progress.js` owns the renderer (run status, headline pair and bar, whole
  measure, milestone line, parts grid, side column), `readStatus()`, the milestone arithmetic, `partView()`,
  `wholeFacts()`, `since()`, the status words, the time words and the Progress CSS. `program_requirements.js` kept its
  definitions (`MILESTONES`, `PARTS`, `WHOLE`, `TO`, `SOURCE`), its live reads and `progressContext()`, gained a
  declarative `HEADLINE` and a `PROGRESS` spec (its words), and delegates `viewProgress()`. The host lends `section()`,
  `goControl()` and its call-card helpers through one object, so a count opens the tab's own list and the sections
  remember like their neighbors'.
- **The guard was the first host's own suite, unchanged in what it asserts.** The 417 checks of
  `tests/program_requirements.test.js` passed with the module loaded first; the harness loads the module before the
  tab's script, three CSS regexes read the module's source, and the status path moved. The class names kept their
  `prh-pg-` prefix on purpose: a rename changes nothing a reader sees and would have loosened the guard (SkyView keeps
  its `ccr_atlas_*` paths the same way). `tests/commons_progress.test.js` (30 checks, floored by hand) guards only what
  a shared module can get wrong: a second host's classes substituted into a style of its own, a spec with no whole
  measure drawing no band, a failed read saying so in both headline numbers, `readStatus` refusing a file with no
  `written_at`, the host tab drawing its other views when the module's lazy load fails, the boot order in both HTMLs.
- **A shared module fails soft or it fails the tab.** `CPL_TABS.loadScript` calls back on error as on load, so a 404 on
  the module would have reached `program_requirements.js` with the global undefined and killed the tab at load. A
  nine-line stub answers every helper safely and draws one line on the Progress view; the other four views read as
  usual.
- **CSS with the host's classes substituted, one style per host set.** The module's CSS names the host's section
  pattern (`prh-sec`, `prh-sec-b`, `prh-sec-t`, `prh-sec-label`) and its quiet text as `%name%` marks, filled from
  `h.classes` at injection under `cpg-css-<sec>`; with the defaults the injected CSS is byte-identical to the host's
  former block. A second host passes its own names and gets its own style.
- **One status file per project.** `kb/queue_status.json` became `kb/status/program-requirements.json` with a `project`
  field; `scripts/queue_status.py --project` names another project's file; checkpoint step 12, the a11y seed comment,
  the lane files and the dependency map followed (a seed records the read `commons_progress.js` makes on the host's
  behalf, which the literal scan no longer sees). The deploy-time asset manifest covers every root-level `.js`, so the
  new module is cache-busted without a change.
- **The one-writer carve-out worked across three sessions.** Sam told S417 at 19:08Z: *"Commons looks good. Just make
  sure I can collapse each and we have a collapse all button."* S417 took the mock-up file and artifact (version 4,
  #2239), S418 closed its competing record PR unmerged and named the branch to lift from, and this session recorded
  the ruling in the lane, section 11 and the status file with the time corrected (19:08Z, not 17:31Z) and the one
  memory row cited (`sam-approves-commons-mockup-collapse-2026-10-18`). Read the queued messages before writing.
- **Next, step 2.** Each reference's Progress view drawn from the module, in the ruled order (Exhibit on the CER tab,
  then Course, CR, Subjects), each with its definition of complete on a card for Sam and a status file under
  `kb/status/`. The CER tab's host object must lend a section pattern with its class names, a count control that opens
  its own lists, and call-card helpers (or none, with `callRecords` returning null and `callAnswered` reading the
  sheet's store); the collapse pattern Sam asked for belongs in step 3's Commons row component.

## S417 SkyManzanita (2026-10-18): the Commons tab, on Sam's word (step 3 before step 2)

- **The mock-up's figures reproduce from the committed files alone.** Every number the mock-up showed, measured
  against live tables at 16:35Z, came back from a committed file: the harvest's record files and
  `coci_programs_data.js` give the Program Requirements pair; `kb/exhibit_audit/latest.json` carries "left MAP" (the
  raw export is gitignored for PII); the auditor's `latest.json`, the CR worklist's `_stats` and the SUBJ4 seed carry
  the rest. So the builder needs no key and runs in the daily workflow after the steps that write those files.
- **A figure's stamp is the file's own field, never the clock.** The auditor's `_generated_at`, the fold report's
  `_generated_at`, the seed's `_synced_at`, a receipt's `at` (hyphens in its time part: `17-37-29Z`, normalized). The
  CR worklist carries no stamp, so its "last changed" comes from git, which a shallow checkout cannot answer; the
  builder writes null there and the row reads *Could not be read*.
- **A cohort's stamp is the reviewer's `@bot` suffix, never the day:** 2026-07-07 holds 258 person stamps beside the
  158 preseed ones. Splitting by day would have misread the Exhibit pair.
- **"No words on the cards" is the prose, not the labels.** Sam waved the definitions and the where-it-stands
  narrative; a known issue still needs its words and its owner to mean anything, and the test behind a count stays as
  a chip. The lane keeps the definitions for the cards each Progress view will carry.
- **A screenshot of the served monolith waits for the load event.** The container's proxy fails every outbound
  request, so `domcontentloaded` plus a selector wait timed out while `load` plus a function wait rendered the tab in
  two seconds; the a11y sweep's own server does the same.

## S423 SkyLaurel (2026-10-19): the four run logs

- **The tab was already wired for them.** `kb/_build_commons_status.py` sets each row's `status_file` when the file
  exists and `commons.js` reads it, so step 2 was content and a checkpoint line, no code. Each log's next step is its
  lane's NEXT, written in plain words because the validator refuses markdown and glyphs.
- **Stamp only what moved.** A run log that a checkpoint restamps without work behind it reads fresh and says nothing;
  step 12 refreshes the logs this run touched and leaves the others to age into *stale*, which is the true state.

