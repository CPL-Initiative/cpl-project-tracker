---
title: "Session 577 handoff: two Claude Team accounts, Our Process's Getting set up, the Library's draft label and order"
date: 2026-11-05
session: 576 (SkyMice, Sam's session, 2026-11-04 22:40Z to 2026-11-05 01:30Z)
tags: [handoff, governance, onboarding, claude-team, library, co-academic-affairs]
status: current
---

# You are Session 577

Your moniker is **SkyBarnard** (galaxy names; Barnard's Galaxy, NGC 6822, in Sagittarius). SkyMice (S576) ran beside
SkyJujube on the evening of 2026-11-04; SkyJujube wrote the side-session handoff `docs/cer_redesign_handoff.md` (to
SkyKumquat) and reverted the 00:15Z Subjects sync in #2787. **This handoff carries the main queue** from
`docs/session_575_handoff.md` plus this run. The checkpoint was **light**: no Roadmap row moved, no re-mint, no Rule 10
data write. It skipped the Roadmap row, `kb/README.md`, `README.md`, the pipeline view, the decision sheet rebuild (the
open asks below were put to Sam in chat this run and await his reply; card them if they stay open) and
`kb/status/*.json` (no reference moved).

## What SkyMice shipped

- **The CO Academic Affairs pilot kit** (CPLBrain #662, #664): `CPLBrain/04-projects/co-academic-affairs-pilot/` holds
  the CLAUDE.md draft for the CO's repo and managed settings, the shared Project instructions for Claude chat, and the
  `aa_memory` schema for their own Supabase.
- **Malone's runbook** for the MAP team account: `CPLBrain/04-projects/map-team-claude-accounts/README.md`.
- **Our Process, Getting set up** (#2784 merged; #2786 open): Start here for Sam and Malone, a card per account (MAP team,
  Academic Affairs pilot), each person's first day. No email address on the tab; the test pins it.
- **The Library** (#2788 open): a ready draft names its version (*Version 3 is ready to review*; *Version 2 stays public
  until you replace it*); the register sorts by last modified; the project card's "2 pieces" tile is a small label to
  the title's right. Lane `library` records it as item 17.
- A draft note to Malone, given to Sam in chat (he sends it).

## Sam's decisions this run (verbatim in `CPLBrain/03-professional/braindumps/braindump-2026-11-04-2250-claude-team-accounts-co-and-map.md`)

- The CO's repo is **CO-owned, as long as Sam and Malone can make changes along the way.**
- `facultypd@CCCCO.edu` is a shared mailbox, **one person for now**.
- **CPLBrain is open to the MAP team and the CO pilot** ("both"): its PII is public already; nothing goes public without
  the MAP team's or the CO's review.
- **Malone is an Owner** of the MAP team's Claude account and manages it.
- Library: **sort by modified date, newest first**; the project count **small and to the right** so the title leads.

## Open work, in order

1. **#2786 and #2788**: both carry `main` with #2787's revert; merge each on a passing `test` (`lints` was red only
   because of the reverted sync). Then dispatch nothing: neither touches a generated artifact.
2. **Sam's open asks (put in chat, unanswered at sign-off):** the plan for **revising a visual from the Library card
   without a session** (an edge function drafts from the card's notes; an Action publishes the Pages copy on *Replace
   the public copy*; a new write surface, so Rule 10 (a3) first); **the ELL IET Version 3 draft**
   (https://claude.ai/artifact/5JMF3L4sEFZHrAPZrHSmH3) waits on his *Replace the public copy*, then
   `scripts/library_page.py ell-iet-cpl-starting-points` per lane `library`. If either is still open, card it.
3. **Sam's own steps:** add Malone as a CPLBrain collaborator, then transfer CPLBrain to `CPL-Initiative`. After the
   transfer, update the live references to `samueltlee/CPLBrain` (about 60 files; leave past notes alone).
4. **Carried from handoff 575:** #2763's docs-index conflict; the routine's night (step 0 dispatch, Columbia's SLO read,
   the credential slice, the UI pass on funding-model, contacts harvest 2026-11-08); the Commons asks (lane `commons`);
   data sources when Sam shares ACE and WestEd; `CLAUDE.md` at about 60.9 KB against 60 KB.

## Lessons to honor

- **A status line names the version it speaks of.** "Version 2" over "A draft is ready" read as "Version 3 is missing."
- **`main` red on a data lint holds every PR.** Reproduce on a clean checkout of `main`, comment once, tell the owning
  session, and merge `main` back in when the fix lands.
- **`git push` can hang in this sandbox**; wrap it in `timeout` and retry once.

## Let go

At sign-off this session drops its PR subscriptions on #2786 and #2788 and its 01:35Z check-in; the next session picks
the two PRs up from item 1.
