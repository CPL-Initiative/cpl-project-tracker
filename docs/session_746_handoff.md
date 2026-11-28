---
title: "Session 746 handoff (from SkyTattler, S745, Sam's plain session of 2026-11-27: the Chabot fold, the credentials bar, industry certs, the CPL chip, PPM, CVC and ASSIST)"
created: 2026-11-27
updated: 2026-11-27
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
superseded: true
superseded_by: session_747_handoff.md
---

# You are SkyPetrel (Session 746), Sam's next plain session

From SkyTattler (S745), Sam's plain session of 2026-11-27 from 19:55Z. A **full checkpoint** (KB generators changed:
`kb/_build_program_certs.py`, `kb/coci_campus_letter.py`): lanes moved `commons` (Connections), `program-requirements-harvest`
(CPL Pathways), `common-subjects-reference` (the Chabot fold) and `library` (sketch records), with `data_sources` for PPM,
CVC and ASSIST; one Rule 10 data write (the trainer fill, open work 1). Skipped: step 7 (no roadmap status or auditor counts moved) and `README.md` (no tab joined or left).
`kb/status/subjects.json` refreshed; `kb/status/program-requirements.json` took a change line, and its session fields stay
the routine's. No `## Conductor settings` block (conductor mode is retired, checkpoint step 8).

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
3. **Merge order:** #3922 (the live CPL chip) if SkyTattler did not merge it, then this checkpoint's PR. Branch
   `claude/assist-capture` holds only the ASSIST read plan (no PR); branch `claude/ironworker-period-trainer` holds the
   applied trainer fill's receipt (open work 1).
4. **At start, read the training notes** (`kb_curation` rows with `field = 'procedure_note'` since 2026-11-26) and act on
   what they ask. S745 read Chabot's (acted on, #3918) and EMTCC's (already folded by #3908).

## Sam's words and decisions

- **RULED** `r-partner-chips-like-cpl-sam-2026-11-27`: a partner's chip on a course, like the CPL chip.
- **RULED** `r-co-owned-no-vendor-lockin-sam-2026-11-27`: *"we all want to do this as a CO owned endeavor ... itpi is the
  vendor for map and CO owns the ip"*.
- **VISION** `v-grand-consolidation-sam-2026-11-27`: *"somewhere along this big endeavor, we will combine our datasets
  and procedures for the grand consolidation:)"*.
- **RULED** `r-cpl-chip-white-tile-sam-2026-11-27` (refines `r-cpl-glyph-map-pointer-sam-2026-11-27`): 25 to 30 degrees,
  a white tile, no underline; the 27th ruled mark stays an exception. The turn on open: *"that's cool!"*
- **FACT** `f-ppm-cvc-advisors-hayward-hadsell-sam-2026-11-27`: Craig Hayward (PPM) and Jory Hadsell (CVC), both
  advisory, *"all in on interconnecting"*. **FACT** `f-ppm-invoke-learning-integration-sam-2026-11-27`; **FINDING**
  `f-ppm-share-print-403-lockout-s745`.
- *"cvc chip simple is fine"*, *"make it Online CVC"*; *"yes, this is what we could want to show: Trained by Ironworker
  JATC"*; on #3919: *"they should open to a bottom bar rather than a new tab"*.
- **DECIDED:** the wider `code_address` exception (11 titles at five colleges) is held for its own measured change.

## What shipped (merged)

- **#3916** Pages waits 20 s before `deploy-pages` and retries once after 60 s ("Found 0 artifact(s)"; live since run
  46063125125).
- **#3918** the Chabot glue fold: 25 explicit codes, 159 rows, statewide subject codes 2,896 to 2,871, 47 decisions kept.
- **#3919** CPL Pathways' Credentials list: Programs blue, bottom bar.
- **#3920** the Industry certs chip: 1,326 programs earn CPL on a cert, 634 prepare for one, 45 both.
- **#3921** the frame check and the Commons' priority connections (PPM, CVC, ASSIST).

## Read in order

1. `docs/reference/lanes/program-requirements-harvest.md`, *CPL Pathways (S744, S745)*; `docs/cpl_pathways_lessons.md`, S745.
2. `docs/reference/data_sources.md`, PPM, ASSIST and CVC; `docs/kb-notes/reference-outside-tools-framing-and-reading.md`.
3. `docs/reference/lanes/commons.md`, *Connections*; `docs/reference/lanes/common-subjects-reference.md`, *NEXT (S744)*.
4. The vault note `CPLBrain/07-session-notes/2026-11-27-s745-connections-ppm-cvc-assist.md` (the three request drafts).

## Open work, in order (from the lanes' NEXT lines)

1. **Confirm the credential sync folded the 16 Ironworker trainers into `kb/credentials.json`, then build the live
   Trained-by chip** on CPL Pathways cards wherever a credential names a training agency. The fill is **APPLIED**
   (Rule 10): `public.kb_curation`, field `training_agency_override`, value "Ironworker Joint Apprenticeship Training
   Committee", 16 rows under `credentials-s745@bot`; issuer rows left alone (a person's save by `map@rccd.edu` holds
   them). Receipt `kb/receipts/credential_trainer_fill_s745_2026-11-27.sql` on `claude/ironworker-period-trainer`
   (its PR is the conductor's). Rollback: delete by `reviewer_email`, then `git revert` the sync commit. The sketch:
   https://claude.ai/artifact/VbgjS2qtA86E8CUDHJvQxe (private until Sam shares it; source
   `CPLBrain/04-projects/cpl-initiative/connections/20261127_trained_by_cpl_pathways_sketch.html`, CPLBrain#878).
2. **Merge #3922 if open, then look at the live cards** in a real browser (the chip's turn, the credentials bar, the
   Industry certs sidebar).
3. **The CVC sketch** when Sam sends his saved ENGL C1000 search (`.mhtml`, private window).
4. **Library records for the PPM and ASSIST sketches** (`library` NEXT; private until Sam shares).
5. **The display build reads the apprenticeship exhibits** (`f-cerritos-ironworkers-all-24-cpl-s744`), then the B.S.
   page's text.
6. **COCI description cleanup at build** (`f-coci-description-shards-mojibake-s744`, `kb/_build_coci_lookup.py`).
7. **The training note's act checkbox** (`commons` NEXT 1: *Ask COBI to act on this*, `value.act = true`).
8. **common-subjects-reference NEXT:** the builder honors `not_a_subject`; LACCD's 41 untitled and 87 differing
   titles as one list; the schedule-tool sweep (Allan Hancock 77 first); the Accounting apply, **BLOCKED** on Sam's
   four Business saves; the 35 held and the 50 under 90 (Sam's picks).

Beside the queue: the three request drafts (Craig Hayward with the Invoke and IP sentence, Jory Hadsell, ASSIST) go out
only on Sam's word; **program-requirements-harvest**'s collection is the routine's; **implementation-funding** waits on
the team.

## Patterns that worked

- Check an outside tool's framing and robots rules on a runner before designing a bottom bar around it.
- A sketch in the partner's own logo and terms, iterated live with Sam, then the lane and the register.
- Measure a matcher's precision and recall before its chip ships, and name the misses.

## Safety

- Rule 10: the trainer fill rolls back by its `reviewer_email`; a bulk write is insert-only under a cohort email.
- Never open PPM maps through Share or Print from a session's browser: one 403 locks every map out.
- Outward requests are drafts; a human presses send.

## Let go

At sign-off the conductor drops its PR subscriptions (#3922, CPLBrain#878, this checkpoint's PR) and its artifact
watches (https://claude.ai/artifact/4rRKYwJaeTwXmfiYQ6DW7v, https://claude.ai/artifact/Vi6yN9NUH2cckKJYqt7KxQ,
https://claude.ai/artifact/VbgjS2qtA86E8CUDHJvQxe); no COBIx
watcher, no check-in.

Spend: not available; 2026-11-27T19:55Z to 2026-11-27T22:06Z.

Opening line: *Greetings, you are SkyPetrel (Session 746), see SkyTattler's handoff — `docs/session_746_handoff.md` — let's keep rolling with our queue.*
