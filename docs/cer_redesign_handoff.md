---
title: "CER redesign handoff: Nudge, the fold's panel rows, ASE's long form, balanced test shards (SkyHuckleberry)"
date: 2026-10-31
session: CER redesign build, side session after S536 (SkyHuckleberry)
tags: [handoff, cer, exhibits, exhibit-canonicalization, funding, tests]
status: current
---

# You are SkyInkberry, the Exhibits tab's next build

SkyHuckleberry ran on 2026-10-31 from 21:07Z beside Sam. No other session was live on these files; SkyBilberry had
signed off. This is a **full checkpoint** in content (the run wrote Rule 10 data and a migration) on the side line's
shape: this file is the handoff, and `docs/session_536_handoff.md` stays the CPL queue's, which tonight's routine
supersedes with 537. Skipped, each with its reason: `README.md` and `kb/README.md` (no KB structure change; Nudge is
documented in its lane), the pipeline view (no roadmap, auditor or re-mint movement), the KB notes (the durable
learnings went to the lessons docs and `cpl_memory`), the decision sheet (Sam answered both asks in chat while live,
and no lane carries a new marker) and `kb/status/program-requirements.json` (the program-requirements line was not
worked).

## What shipped

- **#2629 Nudge, the fold's panel rows, ASE.** A *Nudge* word above the funding tab's college rows (signed-in reviewer,
  internal tab) lists every roster institution missing a participation confirmation or a noncredit attestation, with
  one recipient in Sam's order and an editable mail-merge email; the addresses live in `cpl_funding_nudge.js` so
  `cpl_funding.js` keeps the public page's PII guard. The fold's four panel rows moved to the renamed *Automotive
  Electrical/Electronics 1* and *2*, then Sam's *"Drop the ASE override; go with the long form"*: the two ASE issuer
  rows deleted, the colleges named in `kb/credentials.json`. Receipt
  `kb/receipts/credential_panel_move_2026-10-31_skyhuckleberry.json` holds both writes and their rollbacks.
- **#2630 balanced test shards** (Sam: *"If there are any other ways to shave test time, feel free"*). The runner
  times each file and prints the ten slowest; `tests/lib/shard.js` assigns files longest-first by
  `tests/durations.json` (519 files measured locally, all passing); `npm run test:durations` re-measures. Simulated at
  six shards: the slowest shard's file time falls from 504 s to 362 s. CI's first balanced run read 6:00 to 7:50 on
  four shards while two ran past 8 minutes, so CI's spread is not the local one; see *Open work* 2.
- **Nudge v2** (its PR follows #2630 on this branch name): a box on every institution with *Select all* and *Clear all*;
  a *Send to* list of roles (Primary contact by default; CEOs; VPs; Ambassadors and Initiators, every active one in
  MAP; *Deans and directors* disabled until the harvest); **declined participation** on the CO Monitor's notes row
  (`cpl_funding_notes.declined_at`/`declined_by`, migration applied live 2026-10-31), marked and cleared in the drill-in,
  the word *Declined* on the row, grayed and unchecked in Nudge with its own box as the override. 34/34 in
  `tests/cpl_funding_nudge.test.js`.
- **The college contacts harvest is armed** as step 8 of the CPL queue (`docs/reference/scheduled_sessions.md`, Sam:
  *"go"*), with the build order (Governance, the reviewer-only `college_contacts_harvest` table, the runner, the read)
  and the cadence: nightly, 15 colleges, until the first full pass, then weekly. The spec and Sam's position list,
  including the Vice and Deputy Chancellors, Associate Vice Chancellors and Associate Vice Presidents he added, are in
  `docs/reference/lanes/map-users-student-contact.md`. The queue routine owns it, not this line.

## Sam's rulings this run

- ASE: **drop** the override on the two local titles; **the long form**, *Automotive Technology (ASE A5 Brakes)*, for
  local exhibits alone (college courses, high school and Cx); the ASE certification keeps its own name and issuer.
- Nudge: per-institution boxes, *Select all* and *Clear all*; recipient roles with Primary contact the default;
  declined participation noted on the row, grayed in Nudge with an override.
- The contacts harvest: daily first (*"until we get a good dataset"*), then weekly; on the queue's runners; *"go"*.

## Read first

`docs/reference/lanes/cer-procedures.md` (NEXT), `docs/reference/lanes/implementation-funding.md` (*Nudge*), and the
SkyHuckleberry sections of `docs/cer_v2_redesign_lessons.md` and `docs/cpl_funding_lessons.md`.

## Open work, in order

1. **After each of Sam's runs through Another look,** read the next fold's `credential_moves` and `credential_retires`
   and move the panel rows they list (a guarded UPDATE of `course_id`, before-values in the receipt, as this run's).
   Tonight's sweep will offer *Engine Performance (ASE A8 Engine Performance)* as *Automotive Technology (ASE A8 Engine
   Performance)*, the long form.
2. **Read #2630's CI timings** once the balanced split has run on a few PRs (each shard log ends with its ten slowest
   files). If CI's spread stays wide, re-measure on CI rather than locally: add a step that writes `--durations-out`
   into the run's artifact and fold the six shards' tables into `tests/durations.json`. The next real gain is splitting
   the slowest files (`cpl_funding_college_dashboard` 349 s, `cpl_funding_render` 310 s, `cpl_funding_nc_attestation`
   306 s locally), since one file bounds a shard.
3. **The first rule sent to the routine** (carried): when the Rules view shows one, confirm the overnight firing worked
   it by step 7.
4. **Carried:** IB on the AP pattern, then CLEP's official names; the Catalog's *Courses that may align*; training sites
   for a held title new to the reference, only if Sam asks.
5. **Nudge, later:** COBI sends as map@rccd.edu with a send log and a 14-day skip, on the Microsoft 365 path (Sheet 146
   card 3, waiting on RCCD IT), after Governance maps the sender. The Letters, Memos, Reports tab reuses the role
   picker once the harvest fills the table (Sam).

## Lessons to honor

- `git add`, then `scripts/check_generated.sh`, after the **last** commit: the dependency map records line numbers.
- A public-rendering module keeps its PII grep; put an address read in a module of its own, loaded on a reviewer's press.
- A full local `npm test` takes about 45 minutes now (8,694 s of file time at 4-wide); never run a fifth jsdom process
  beside it on a 15 GB box.
- The decision-sheet builder scans lane files for its marker word; never write it in a sentence that says there is none.

## Let go

At sign-off this session drops its PR watches (#2630 and the Nudge v2 PR, once merged) and holds no check-in or
artifact watch.
