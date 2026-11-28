---
title: "Session 752 handoff (from SkyGannet, S749, Sam's plain session of 2026-11-28: Sam's subject alignment, COBI's picks, the CIP taxonomy, the re-mint dry run)"
created: 2026-11-28
updated: 2026-11-28
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

# You are SkyPuffin (Session 752), Sam's next plain session

From SkyGannet (S749), Sam's plain session of 2026-11-28 12:01Z to about 17:30Z. A **full checkpoint** (a data receipt,
lanes moved, KB generators changed). **Numbering:** the CPL Queue routine took S748 and S750 (its open #3950 writes
handoff 751, for the routine); this plain session is S749 and writes 752. Lanes moved: `common-subjects-reference`,
`commons`, `program-requirements-harvest` (a NEXT paragraph only). No CIP lane carries TOP to CIP, so the taxonomy result
sits in the subjects lane. Skipped: step 7, the Pipeline tab (the re-mint is not applied yet; the next session refreshes
it after #3958); `README.md` and `kb/README.md` (no tab joined or left). KB note added:
`methodology-a-person-named-value-can-live-in-a-memory-ruling`. No `## Conductor settings` block (conductor mode is
retired).

## Open with the standing block

1. **No COBIx watcher** (Sam's word; `d-cobix-watcher-stopped-on-sam-word-s714`). Start `bash scripts/cobix_watch.sh`
   only if he asks. Read a PR's whole thread before you merge it.
1a. **Clone light (Sam, 2026-11-19):** `git clone --filter=blob:none` (or `--depth=1`); fetch `main` by name.
2. **Merge rules:** at most 3 open PRs (plus #3511 and dependabot's), the oldest finished first, one update from `main`
   right before its merge, `test` green on the head; no dependency-map rebuild inside a PR; no full rerun when the input
   fingerprints match; never a PR on a branch holding another open PR's commits.
2a. **Sam's work order (2026-11-20):** collection first, data waves before fixes (`r-collection-first-sam-2026-11-20`);
   collection's fixes rank by the M-ID cards they unblock (`r-collect-for-mids-work-order-sam-2026-11-20`).
2b. **Before a push, `bash scripts/check_generated.sh` must read all ok.**
3. **Merge order:** #3950 (the routine's S750 checkpoint), then #3958 (the re-mint apply, below), then this checkpoint's
   PR. This checkpoint and #3950 both write `program-requirements.json` and the harvest lane: take #3950's, then re-add
   S749's lines.
4. **At start, read the training notes** (`kb_curation`, `field = 'procedure_note'`, newest first, and any with
   `value.act = true`) and act on what they ask.

## Sam's words this run (in `cpl_memory`)

`r-cobi-coci-titles-file-and-sam-names-win-sam-2026-11-28`, `r-common-subject-alignment-rulings-sam-2026-11-28`,
`r-full-remint-for-new-joins-sam-2026-11-28`, `r-remint-dryrun-defaults-sam-2026-11-28` (*"fine on defaults"*),
`r-ccr-procedures-firstaid-sport-pe-recr-sam-2026-11-28`, `r-clarity-recs-after-remint-sam-2026-11-28`,
`r-catalog-speedup-recs-sam-2026-11-28`. Decisions: `d-cobi-common-picks-csv-precedence-s749`,
`d-person-folds-read-from-retired-or-fix-s749`, `d-minted-codes-applied-held-s749`,
`d-cip-taxonomy-sept-2026-authority-s749`. Pitfalls: `p-person-settled-lives-in-memory-too-s749`,
`f-program-verdict-needs-signed-in-reviewer-s749`. Drafted for the conductor: `kb/receipts/cpl_memory_s749_rows_2026-11-28.sql`.

## What shipped (merged)

- **#3947** COBIx's Nov 27-28 titles; Sam's 103 folds (LA Southwest ENG to ENGL held: engineering); COBI's COCI-read
  titles; Sam's names replace the filed headings. Untitled 1,032 to 137.
- **#3948** the final CIP Taxonomy, September 2026: 5 codes change category; no MQ discipline's category moves.
- **#3949** COBI's common-picks CSV filer: person save, pick, statewide filing, map; *Picked by COBI* with the bar.
- **#3952** Sam's Nov 28 alignment from COBIx's #3951: 56 codes (HMEN kept), ASAM/AFAM, language codes under FLNG,
  83 wrappers `not_a_subject`, 1,662 of 1,663 picks apply.
- **#3955** the re-mint dry run: 346 M-IDs (NUTR to FDNT 320, AERO to MILS 9, PHTC to PHOT 4, PUBR to PREL 1, TOUR to TRVL 12).
- Closed #3937 (superseded). Filed live: 12 `kb_curation` rows, cohort `sam-rulings-s749@bot`, receipt
  `kb/receipts/sam_morning_rulings_ccr_exhibits_2026-11-28_s749.sql` (4 CCR doubt cards with procedures, 4 Exhibit titles).

## Read in order

1. `docs/reference/lanes/common-subjects-reference.md`, *LIVE (S749)* and *NEXT (S749)*; `docs/common_subject_code_tab_lessons.md`, S749.
2. `docs/coursecontrolnumber_remint.md` before you touch #3958.
3. `docs/reference/lanes/commons.md`, *NEXT, Commons Clarity*.
4. `docs/reference/lanes/program-requirements-harvest.md`, *NEXT from S749*.

## Open work, in order (from the lanes' NEXT lines)

1. **#3958, the re-mint apply** (`claude/remint-apply-s749`, head `961471c9`): `test` green; run
   `kb/migrations/2026-11-28_s749_remint_kb_curation_preread.sql` through the Supabase MCP and require `go: true`; run the
   `_apply.sql`, commit its returned row as a receipt; update #3958 from `main`, merge; dispatch `daily-dashboard.yml`
   (`unified_courses_member_desc.js` and `_details.js` are the runner's); confirm 1,663 picks apply, 0 refused. Not
   blocking: SkyView's *Dietetics/Nutritional Science* island; stale `_machine_cluster_members` and `current_home`.
   Then step 7 (the Pipeline tab's re-mint card).
2. **Commons Clarity** (`commons` NEXT): one rebuild with forwarding live (Needs you 432 to about 137); *Saved by you,
   goes live in tonight's update* and visible procedure notes; Needs you items open their queue, with *Back to Needs
   you*; the Exhibits issuer and training-site lists that show 0 of 0.
3. **COBIx's #3956** (titles for the 137, Sam's rulings, folds, chips): file it.
4. **The rest of COBIx's list** (subjects NEXT 3): display chips and the noncredit flag; noncredit picks; 33 duplicate
   college and code keys; CIP-family headers; course-level moves.
5. **Program records for Sam, signed in:** San Jose City 22225, Allan Hancock 19928, Sierra 33639 (total 60); East LA
   31017 (20-27 of 60 confirms); Reedley 20762 needs_fix, reread from the Teacher page. Sierra 21525's reread and the
   catalog speed-up are the routine's (harvest NEXT from S749).
6. **Then** the subjects lane's S744 list (LACCD, the schedule sweep, the Accounting apply blocked on Sam's four saves,
   the 35 held and the 50 under 90).

## Patterns that worked

- File a contributor's round on `main` in one PR with its receipt, and keep a code rename that touches M-IDs for the
  re-mint's own dry run.
- Measure a taxonomy change against the final document (5 codes, not 245).

## Safety

- Before overwriting a value as nobody's, search `cpl_memory` for a ruling too (HMEN).
- A second reader before the re-mint's apply; its rollback must abort on person rows on new ids.
- A program verdict needs Sam's signed-in session; never route around it.

## Let go

The brief named no PR subscription, check-in or artifact watch held by this session; at sign-off drop any on #3958 and
this checkpoint's PR. No COBIx watcher.

Spend: not available; 2026-11-28T12:01Z to 2026-11-28T17:30Z.

Opening line: *Greetings, you are SkyPuffin (Session 752), see SkyGannet's handoff — `docs/session_752_handoff.md` — let's keep rolling with our queue.*
