---
title: "Session 638 handoff (from SkyPorpoise, S637)"
created: 2026-11-11
updated: 2026-11-11
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

# You are SkyTamarind (Session 638)

Written by SkyPorpoise (S637) at a full checkpoint, 16:10Z 2026-11-11, at the context warning (108,922 tokens left).
Sam drove; COBIx wrote several of his briefs, which is why they speak of him in the third person.

## At the start

Read `cpl_memory` first (Rule 8, tags `cer-procedures`, `exhibits`, `program-requirements`). All three repos attached.
Then read **#3110 and #3111 for COBIx's replies to Sky** before any Exhibits or planning work.

## What shipped (S637)

- **#3108, merged.** Exhibits: a Related titles panel beside every Review and Another look card (*Use this title*);
  the certification naming rule (`kb/cert_naming.py`: *Medium/Heavy Truck Parts Specialist (ASE P1)*); the ASE rename
  batch as one card in Review (`#exhibits/rename-batch`, 68 titles, 33 with a proposed title); old titles kept as
  search aliases (`kb/credential_aliases.py`). The daily run rebuilt the P1 card with the ruled title.
- **#3112, merged.** `scripts/install_browser.sh`: one browser install for thirteen workflows, after the runners'
  DNS fault. The npm path (`cpl-stories.yml`) is proven only as far as the launch; Monday's scheduled run tests the site.
- **#3114, open draft, watched until sign-off.** The canonical credential model (Sam's six rulings on #3110): each
  local exhibit's path and assessor on the panel and the batch (`kb/exhibit_paths.py`), ASE as issuer on a title in the
  format, `docs/reference/canonical_credential_model.md`, DR-34. **Merge it on a green `test`.**
- **#3109, open draft.** De Anza: `el_fix_codes` reads the eLumen feed's packed codes (`ACCTD001A`) as the page shows
  them (`ACCT 1A`); the page read's plan; this checkpoint. A free capture was dispatched at 15:30Z on the branch.

## Open work, in order (built from the lanes)

1. **`program-requirements-harvest`, De Anza (#3109).** `git pull` the branch and read
   `kb/program_requirements_college/de_anza/capture_preview.json` (`found`, `by_method`, `coverage_bands`; it was 1 of
   243). If the capture failed, have a subagent read the failing step. If most programs are found: **tell Sam the
   extraction's expected cost against his standing $40 go before `extract=1`** (the 2025-26 run cost $20.33 for 233).
   Then load, a `ge_units` step from the `daweb2` GE pages, the registry read refresh, display. #3109 carries the inline
   install in two workflows; merging `main` brings `scripts/install_browser.sh`: take main's side in both.
   Then the sweep's next college: Orange Coast 72, Los Angeles City 67, Victor Valley 60.
2. **`cer-procedures`, the model (#3110).** Sky's reply proposes, in order: (a) a fold into an issuer-awarded title
   keeps the target's issuer records (`fold_credentials` in `kb/_cred_rename_apply.py` keeps every distinct issuer
   today), with a test, **before the 16 ASE merges apply**; (b) an issuer registry (official name, one short tag,
   aliases), which settles AWS and ACE; (c) the trainer move (130 titles) with receipts, the 10 duplicate spellings
   and the *alifornia Veterinary Medical Association* typo; (d) a Review step for the 181 college-issued titles that
   hold an industry-certification exhibit. Wait for COBIx's answer on (a), then build it.
   **Do not dispatch `cred-rename-apply.yml` for merges until (a) lands.** Sam approving the batch only saves rows.
3. **The strategic plan (#3111).** Sky's nine recommendations are posted. COBIx works it through with Sky, then takes
   a final version to Sam. Not checked by Sky: the August drop in transcribed units, Sierra's test traffic, a
   page-count source, the funding figure of record, the line-by-line match with #2919.
4. **#3107** (COBIx's design principles v3): Sam pointed to it; not read this run.
5. **Carried from handoff 637, untouched:** American River's 23 reworded programs (`step=read`, `extract=1`,
   `force=` the control numbers in handoff 637, about $1.50); `library` NEXT 0; `csm-workspace` NEXT 0 and 1; `commons`
   NEXT; #2894 is Sam's to review; CPLBrain#758's second-stretch addendum.

## Decisions to honor

- **Sam, 2026-11-11, the title format:** the cert's official name first, the code in parentheses; the program name
  does not lead. Existing titles move only by his approved batch; old titles stay search aliases; CompTIA, AWS and
  NCCER follow as separate batches (`cpl_memory` `sam-cert-name-first-2026-11-11`).
- **Sam on #3110, relayed by COBIx (rows `sam-canonical-credential-model-2026-11-11`,
  `sam-canonical-model-rulings-3-6-2026-11-11`, both `proposed` until he confirms in session):** the title carries the
  credential's issuer, each local exhibit its path and assessor; hold the 16 merges until exhibits show both; a
  college's set of tests is local, ASE Master stays; AWS is the Welding Society, ACE the Council on Education; trainers
  leave the issuer field; the ITPI ask is his. His 06:20 PT *"Keep the college as issuer on the P1 title"* (confirmed
  in session) was replaced 30 minutes later; its row is superseded.
- **Sam, in session:** finish the current work before a big ask; the order De Anza, #3110, #3111.
- **Session calls:** the rulings file should be generated from `cpl_memory` (proposed on #3111, not built).

## Not refreshed at this checkpoint

The pipeline view (it did not move), `kb/README.md`, `README.md`, a KB note (none crossed the bar), the four other
references' run logs, the routine's `next_run` and today's headline pair in the status file, a decision sheet (no card
is open). **Owed:** `docs/reference/lanes/cer-procedures.md` is 23.4 KB against 20: move its S637 section's detail to
the lessons doc once #3114 merges (both touch it).

## Patterns that worked

- Read a capture's near-miss reasons before trusting a handoff's diagnosis.
- A free page read (a plan under `kb/college_reads/`) settles a reader question in six minutes.
- Hand a job log to a subagent with the exact lines wanted; `list_workflow_runs` and a PR's `get` return whole commit
  messages, so give those to a subagent too.
- A sibling `claude/*` branch in a git worktree keeps a second concern off a PR under review.

## Safety patterns to honor

- `git add`, then `bash scripts/check_generated.sh`, and read its last line before the commit. A chained `&&` after
  `| tail` commits past a stale file (it happened again on #3112).
- A `subscription.created` notice costs about 8,000 tokens of context, and they arrive in pairs. Watch few PRs at once.
- `cpl_memory.summary` is capped at 400 characters, and `kind` is required.
- A reference doc is named by full path in a lane file; `CLAUDE.md` has no room (59,974 of 60,000 bytes).

## Let go

At sign-off drop the watches on #3109 and #3114 and cancel check-in `trig_01DrjWUGtBYFU3uwGp1wkHF1` (16:16Z, De
Anza's capture) if it has not fired. #3108 and #3112 are merged and unwatched.
