---
title: Session 294 handoff — narration v3, the ESL merging sheet, and the narrated draft
date: 2026-09-26
session: 294 (SkyCadence)
tags: [handoff, implementation-funding, video, esl-packaging]
status: current
---

# You are Session 295

Your moniker is **SkyHarbor**. SkyCadence (S294) took the queue from
[`session_293_handoff.md`](session_293_handoff.md) and, on Sam's one-word
instruction **"Automate"** (2026-09-26), worked it without stopping for
check-ins: end a turn only at a real wait, with a scheduled wake to resume.
Three PRs merged: #1701, #1702, #1703.

## What shipped

1. **Narration v3** ([#1701](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1701)).
   Sam heard v2 as *"stilted, especially when sounding out C-P-L... same with
   sounding out the year numbers."* v3 writes the acronyms unspaced and says years
   the way people say them. Measured in Kokoro's tokenizer, in context: unspaced
   `FTES` reads as the word "eftess", so it takes the letters' phonemes. `EDD` and
   `MAP` read differently alone and in a sentence. `narrate.py` applies the phoneme
   fixes, requires each to fire, and fails a run that carries a reading Sam
   rejected. A local recognizer (`faster-whisper` small) hears v3 as written. Each
   "CPL" takes 570 ms, against 702 ms in v2. v3 audio went to Sam in the session.
2. **The ESL merging procedure sheet**
   ([#1702](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1702)), his
   ask of 2026-09-21. It has nine items at
   https://claude.ai/artifact/LaZmu7NYj11DigAEbxsUMS, built by
   `kb/_build_esl_merging_decision_sheet.py`. Sam completed it the same day, all
   nine as proposed. S294 shipped the reader fixes and the ladder tests, and built
   the data paste (see *Waiting on Sam*).
   - **In use:** the level reader and its three misreads; the Beginning default (102 catalog re-levels); purpose before level, with 18 healthcare courses sitting in level groups; transfer composition (3 of 8 are not transfer courses).
   - **Queued:** the 92 ESL identities that arrived after the fold; the 30 re-levels the 2026-08-24 rulings clear, out of 122; the nine over-claims, where his 08-24 ruling and a 09-22 default disagree; a monthly pass; the film course FTVE M1018 inside Enrichment.
   - It retired the standing open-asks sheet's four ESL cards, which re-asked questions settled on 2026-08-24.
3. **The narrated draft**
   ([#1703](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1703)): variant `n1`, `funding_in_motion_n1.html` plus the MP4 (3:00.9).
   - The narration drives the clock. `ft()` stretches each scene's picture across its narrated span.
   - The score is a bed 14 dB down that dips 6 dB under the voice, normalized to −17.1 LUFS; the introductions measure −17.2.
   - Captions show on the page and ride as a subtitle track in the MP4.
   - The 90-second introductions are unchanged (all 1,293 score events kept). The MP4 went to Sam in the session.

## Waiting on Sam

- **The narrated draft:** watch it and say OK or what to change. It is not linked from the explainer until he approves.
- **The ESL paste.** Sam completed the ESL sheet on 2026-09-26: all nine items as proposed, none ruled one by one. The rule changes shipped in code. The data changes went to him in the session as one SQL paste, `kb/esl_sheet_out/2026-09-26/apply.sql`, with `rollback.sql`, `plan.json` and `preflight.json`. Running it is his go.
  - **Before anything ESL, check whether it ran:** `select reviewer_email, count(*) from kb_curation where reviewer_email like 'esl-%-s294@bot' group by 1 order by 1;`
  - A good run shows `esl-catalog` 6 · `esl-health` 18 · `esl-ladder` 30 · `esl-newfold` 89 · `esl-transfer` 3. Once it has run, resolve his Complete comment on the sheet (thread `ecbd0076`), and let the daily cron publish.
  - **If the counts come up short:** each UPDATE is guarded on the row's value and cohort, so a short count means a curator moved that row after the 19:40 UTC read. Compare the plan against a fresh read; never force a row.

## The queue, in Sam's order

1. **The narrated video:** built, waiting on his OK. The refinement he may ask for next is to cue each reveal to the word that names it. The layout carries cue times, but today `ft()` stretches each scene uniformly.
2. **ESL:** verify the paste (above), then take up what stays open:
   - the six held identities: transfer composition is unruled, and the two *Optical Technician* rows belong outside ESL;
   - item 8, the monthly pass. `kb/_esl_new_identities_dryrun.py` is the pass. Scheduling it is a new standing cadence, so it waits until the paste lands.

   Then the Jev CCR's misfit ruling (nest or cross-list, [handoff 283](session_283_handoff.md) "first sitting") and its next rung.
3. **SkyView.**
4. **The EACR grid review**, whenever he opens it.

## Read in order

1. The cohort count above, then `kb/esl_sheet_out/2026-09-26/plan.json`.
2. [`lanes/esl-packaging.md`](reference/lanes/esl-packaging.md).
3. `prototype/funding_video/README.md`, *The narrated draft*.
4. [`lanes/implementation-funding.md`](reference/lanes/implementation-funding.md), the video paragraph.

## Patterns that worked

- **Measure a spelling in its sentence, then transcribe the read.** The recognizer caught "the 2627 year" and "do November first", which the phonemes could not show. See the note [`methodology-hear-a-synthetic-voice-through-a-recognizer`](kb-notes/methodology-hear-a-synthetic-voice-through-a-recognizer.md).
- **Verify an agent's inventory before it reaches a sheet.** It said 84 renamed Z ids; the alias map says 91. It said 46 staged re-levels; the actionable file carries no such count.
- **Resolve stored ids through `kb/alias_chain.py` (Rule 7).** 428 of the 2026-07-15 plan's ids were re-keyed since.
- **`kb/_build_dependency_map.py` reads the git index.** Rebuild it after `git add` of new files, or `check_generated.sh` reads it as stale.
- **Loudness is measured, not assumed.** The narrated mix came out 5 dB under the introductions until `loudnorm` joined `render.sh`.

## Safety patterns

- **ESL writes:** the verdicts are in and the paste carries them. Any further ESL write gets its own cohort with a before-value receipt (Rule 10 a, a2), a fresh read, and the pending-merge-target cross-check. `kb/_esl_sheet_apply_build.py` is the worked example: guarded UPDATEs, ON CONFLICT DO NOTHING inserts, a rollback from before-values.
- **Two-hop chains are by design.** 88 of the paste's 147 identities already hold courses from earlier merges. `flatten_merge_chains` in `excel_to_dashboard.py` carries those courses to the survivor, and no survivor carries a merge row, so no cycle can form.
- **Open-asks artifact:** do not republish it onto its store. It is keyed to the 21 cards Sam answered, and the builder now holds 10.

## Carryover

- The explainer timeline's "Releveled" wording (a curator edit).
- `BASE` in `build.py` must point at the public repo before production.
- The video pages are not in `a11y.config.js`.
- The ladder script's whole-corpus derivation has no assertion yet ([esl-packaging Open](reference/lanes/esl-packaging.md)).
- Oversized docs flagged by the lint:
  - `docs/roadmap_archive.md` 4.5×;
  - `cpl_funding_lessons_archive.md` 2×;
  - `exhibit_canonicalization_lessons.md` 1.26×;
  - `ccr_atlas_lessons_archive.md` 1.11×;
  - `lanes/implementation-funding.md` 1.08× (S294 cut it from 23.5 KB to 21.6 KB);
  - `CLAUDE.md` 1.03×, which predates S294.
