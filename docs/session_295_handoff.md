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
Four PRs merged: #1701, #1702, #1703, #1704.

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
   the data paste ([#1704](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1704); see *Waiting on Sam*).
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
- **The ESL changes: Sam said go (2026-09-27), and he does not run SQL.** His words on the pastes S294 first handed him: *"Why do I need to run the apply.sql process in supabase? It's not feasible for me to run one-off procedures like this..."* (`cpl_memory` `sam-no-one-off-sql-procedures-2026-09-27`). **Never hand him SQL.** Sessions carry the writes through `.github/workflows/esl-sheet-apply.yml` (dispatch with `plan_dir` and `mode` dry-run, commit or rollback), which runs `kb/_esl_sheet_apply.py` with the service key: a fresh read, pending-confirm and curator-row holds, guarded updates, duplicate-ignoring inserts, and a receipt per run (`applied_<ts>.json` in the plan dir) that `--rollback` restores from.
  - **First, read the receipts** in `kb/esl_sheet_out/2026-09-26/` and `2026-09-27/`, and the counts: `select reviewer_email, count(*) from kb_curation where reviewer_email like 'esl-%-s294@bot' group by 1 order by 1;` A full apply reads `esl-catalog` 6 · `esl-health` 18 · `esl-ladder` 30 · `esl-newfold` 89 · `esl-transfer` 3 · `esl-vesl` 2. If a plan dir has no commit receipt, dispatch it (dry-run, then commit).
  - Then resolve his Complete comments on both sheets (threads `ecbd0076` and `19286036`); the daily run publishes.

## The queue, in Sam's order

0. **Before the queue: clean up `CLAUDE.md` with a prompt audit** (Sam, 2026-09-27: *"Thinking we should clean up claude.md"*, asked at the end of S294, which had no runway left for it). Use `/claude-api` prompt-audit at the start of a fresh session, with the full budget.
1. **The narrated video:** built, waiting on his OK. The refinement he may ask for next is to cue each reveal to the word that names it. The layout carries cue times, but today `ft()` stretches each scene uniformly.
2. **ESL:** confirm the apply (above), then take up what stays open:
   - item 4 and his follow-up verdict keep six transfer composition identities apart: the five item 4 names and `ESOL M9309`;
   - item 8, the monthly pass. `kb/_esl_new_identities_dryrun.py` is the pass. The apply workflow writes it; it starts once the first apply lands.

   Then the Jev CCR's misfit ruling (nest or cross-list, [handoff 283](session_283_handoff.md) "first sitting") and its next rung.
3. **SkyView.**
4. **The EACR grid review**, whenever he opens it.

## Read in order

1. The cohort count above, then `kb/esl_sheet_out/2026-09-26/plan.json`, then `kb/esl_sheet_out/2026-09-27/plan.json`.
2. [`lanes/esl-packaging.md`](reference/lanes/esl-packaging.md).
3. `prototype/funding_video/README.md`, *The narrated draft*.
4. [`lanes/implementation-funding.md`](reference/lanes/implementation-funding.md), the video paragraph.

## Patterns that worked

- **Measure a spelling in its sentence, then transcribe the read.** The recognizer caught "the 2627 year" and "do November first", which the phonemes could not show. See the note [`methodology-hear-a-synthetic-voice-through-a-recognizer`](kb-notes/methodology-hear-a-synthetic-voice-through-a-recognizer.md).
- **Verify an agent's inventory before it reaches a sheet.** It said 84 renamed Z ids; the alias map says 91. It said 46 staged re-levels; the actionable file carries no such count.
- **Resolve stored ids through `kb/alias_chain.py` (Rule 7).** 428 of the 2026-07-15 plan's ids were re-keyed since.
- **`kb/_build_dependency_map.py` reads the git index.** Rebuild it after `git add` of new files, or `check_generated.sh` reads it as stale.
- **`cpl_memory` rows:** five written and one superseded, all logged (receipt `kb/receipts/cpl_memory_2026-09-26_s294.sql`). The first send failed on `cpl_memory_summary_check` (one sentence, at most 400 characters) and wrote nothing.
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
