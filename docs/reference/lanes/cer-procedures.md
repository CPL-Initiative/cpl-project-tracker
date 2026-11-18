---
title: "CER procedures and the simpler CER tab — lane state"
created: 2026-10-18
updated: 2026-11-18
tags: [reference, roadmap-lane, cer, exhibit-canonicalization]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference/lanes
related:
  - "[[CLAUDE]]"
---

# CER procedures and the simpler CER tab

**What this lane is:** the Common Exhibit Reference (COBI's *Common Exhibit Reference* tab, `credential_reference.js`)
run on procedures. Sam adds a rule in plain words; the nightly run applies the rules, then the classifier
(`kb/classify_exhibits.py`, which reads the exhibit-canonicalization skill as its system prompt) settles the rest; Sam
sees only the exceptions. Sam, 2026-10-18 ~02:55Z (vault braindump
`braindump-2026-10-18-0300-cer-procedures-automate-curation`): *"I want to be able to add more procedures to have you
classify and complete common exhibit titles and elements as we go. I don't have enough time to curate the growing list
and want to further automate so curation is manageable."*

**The classifier's HTTP 413 (2026-11-07 to #2925, S604) and the procedures report's Pages fix (#2924):** `docs/exhibit_canonicalization_lessons.md`, *Moved from the lane (S640)*. Read each nightly report's `classifier_run.answered` and `errors`.

## Titles that have left MAP (S678, 2026-11-17; nightly, Rename and Combine, the guard, S679)

**LIVE (#3466 `a9f7eec2`, item 2):** on the Exhibits List a leftover title takes Keep, Move or Remove (`_LEFT_MAP::`
rows, `left_map_decision`; a link only, nothing deleted), split and bulk, CPL type labels, and the graded and
cert-based guard on Move and an accepted combine. `kb/_build_left_map.py` writes `kb/exhibit_left_map.json`;
`kb/_apply_left_map.py` carries decisions out; `excel_to_dashboard.py` leaves a removed title out.

**LIVE (S679, #3477 `ed6b1162`):** `scripts/daily_build.sh` runs `kb/_apply_left_map.py --live --apply` nightly before
the reference bake; it writes repo files only (`kb/unified_titles.json`, and a `kb/receipts/left_map_apply_<stamp>.json`
carrying `before_left_map`), and a failure keeps yesterday's links and turns the run red after the push. The newest
decision per title is in force; undo is a newer `keep` row, never a `git revert`. Each undecided leftover row also
offers Rename and Combine on its canonical title. **DECIDED (the S679 conductor):** Move and Remove only on a title
nothing uses; a used title takes Keep, Rename or Combine, and the apply holds a saved Move on a used title.
**DECIDED (the S679 conductor, the third-round redesign):** every fold goes through one choke point (`foldWrite` for a
single fold, `foldGate` for a save that folds many, both reading `foldLanding` along `listChainPath`); it fails
closed while the CPL types are unread, keys the second press per surface and pair, and logs an override as a
`cpl_type_group_override` row. The build detail as it stood: `docs/exhibit_canonicalization_lessons_archive.md`,
*Moved from the lane (S679 checkpoint)*. Tests `tests/exhibits_list_left.test.js`, `tests/left_map_build_test.py`.

**OPEN: #3482 (draft):** the shared `combine_guard.js` for the Common Exhibit Reference tab's five writers. A worker
is fixing the second reader's findings: an untyped title (1,025 of 2,849) gets an `unknown` two-press check with the
override logged, the reject in `load` is caught, and the undo handles a double rename. **DECIDED (the S679
conductor):** an untyped title takes the two-press check, never a silent pass.
**OPEN: #3472 (draft, head `4ca0f456`, item 6):** one re-point list keyed by MAP exhibit id and local title
(`kb/exhibit_repoint_list.json`) and `--pairs` in the reviewed apply, with undo; new keys take the "and" form and C-ID
titles are exempt; the dry run reads 590 applied and 89 held; no real apply has run.
**NEXT:** (1) #3482: merge on green `test` once the worker's fixes and a second read land; (2) #3472: rebuild on
`main`'s renamed titles, then the MAP snapshot run, then the reviewed apply; (3) read the first nightly's receipt and
the leftover count once Sam's first decisions land.

## Certification naming, the fold, the subject fill and the ASE plans (S637, S638; 2026-11-11)

The S637 build record (Sam's title ruling, the rename batch, related titles, aliases, the canonical model, the fold
precedence) moved verbatim to `docs/exhibit_canonicalization_lessons.md`, *Moved from the lane (S638)*. What stands:

- **Titles:** the certification's official name first, the code in parentheses (*Medium/Heavy Truck Parts Specialist
  (ASE P1)*; Sam, 2026-11-11; `kb/cert_naming.py`). No card or builder renames a reference title; only the rename batch
  (`#exhibits/rename-batch`) does, by Sam's approval. Old titles stay search aliases (`kb/credential_aliases.py`). The
  canonical title carries the issuer, each local exhibit its path and assessor
  (`docs/reference/canonical_credential_model.md`, DR-34). The ASE Military Tactical Wheeled Vehicle series MIL1 to MIL8
  carries ASE's official titles, and `ASE_SERIES_CIP` places MIL and A6/A7/T6/T7 in automotive (#3118; Sam: *"so the
  hvac mil should be in auto not hvac subj"*).
- **A slash joining words is written "and" (Sam, in session S679, 2026-11-18):** *"I believe I replaced the / with and
  to avoid formatting issues and should be a general rule for other titles. UA Plumbers and Pipefitters"*. The S679
  conductor drew the line, which Sam can revise: a code slash (a code on each side, a digit or capitals: *SP/2*,
  *CAD/CAM*) and an official name's slash (an ASE test name's pair in an ASE title, or a phrase in `OFFICIAL_PHRASES`:
  *Fire Apparatus Driver/Operator*, *Division/Group Supervisor*, *Medical/Surgical*) stay. On COBIx's review (#3479)
  the conductor added two lines: a spaced slash between two whole names (either side holds "and", or both sides run
  two words or more: *DSST A History of the Vietnam War / Civil War and Reconstruction*) is held for a person, and a
  combine is found case-folded and whitespace squashed, against every credential and search alias.
  `kb/slash_titles.py` holds the rule, writes the plan `kb/cred_rename_plans/2026-11-18_slash_to_and.json` (80
  renames; 7 whole-name titles held, 0 combines; 64 code and official-name titles kept, listed in it), and its
  `--check` (in `scripts/check_generated.sh`) fails a new word-joining slash title the plan does not cover. Test
  `tests/slash_titles_test.py`. **NEEDS A PERSON:** the 7 held titles, listed under `held_for_a_person` in the preview.
  **APPLIED (S679):** `cred-rename-apply.yml` run 44227947795 (`only_plan=slash-to-and-2026-11-18`, 03:09Z
  2026-11-18, commit `64f13edc`): 80 keys, 95 local-title values, 103 articulations, `kb_curation` 81 ok, 0 failed,
  22 no-op; receipt `kb/cred_rename_out/2026-11-18/`, undo `kb/_cred_rename_undo.py kb/cred_rename_out/2026-11-18`
  (`--supabase-plan` for the `kb_curation` reversal). **NEXT:** rebuild #3472's list, whose CTCNC family read
  *Drywall/Lather*; the 7 held titles stay as printed until a person answers.
- **Moved verbatim to `docs/exhibit_canonicalization_lessons_archive.md`:** the CER decision-plan applier (#3118, #3120; *Moved from the lane (S678 checkpoint)*), and in *Moved from the lane (S679 checkpoint)* the fold's one issuer (#3116, `kb/fold_issuer.py`, `effective_issuer`), readers ignoring a saved row on an emptied title (**DECIDED** Sky and COBIx, 2026-11-11, #3110), the exhibit subject fill (#3119; `kb/exhibit_subject_out/worklist.json`), a person's save never returning (`d-person-saved-never-returns-s666`), the *(ASE <code> standards)* title rule, and a decided Review card staying decided (`d-exhibits-review-reads-saved-titles-s649`, `d-review-builder-anon-read-s649`). All stand.
- **Moved verbatim to `docs/exhibit_canonicalization_lessons.md`, *Moved from the lane (S642)*:** the applier's retry-safe undo (S639, #3123; `tests/cer_decision_apply_retry_test.py`), the family live on 25 titles under `credential-family-s638@bot` (undo `credential-family-apply.yml` `mode=rollback`), Sheet 181's four rulings (all carried out; `d-sheet-181-replies-2026-11-11`) and the S639 conductor's two titles left for a person.
- **A credential family is a field, never a fold (#3117; the write, S639)** moved verbatim to `docs/exhibit_canonicalization_lessons_archive.md`, *Moved from the lane (S648 checkpoint)*. It stands: `kb/reference/credential_families.json` declares the family, `credential-family-apply.yml` writes it under `credential-family-s638@bot` (undo `mode=rollback`), and Sam's 31 fold rows stay beside the tags.
- **Moved verbatim to `docs/cer_v2_redesign_lessons.md`, *Moved from the lane (S647)*:** Sierra's ghost-row delete (Sheet 183 card 6) and the S642 ghost-delete DECIDED line, the S640 and S641 read-time resolution decisions (D1 to D3), and the S643 returned-titles list.
- **The Exhibits fixes of #3223 and #3228 (S647, #3233)** moved verbatim to `docs/exhibit_canonicalization_lessons.md`, *Moved from the lane (S649 checkpoint)*, with **DECIDED** `d-exhibits-course-title-gate-s647`; all stand.
- **The #3223 and #3228 follow-ups (S648, #3241, #3248) and Sheet 195 card 4's CVMA fix (#3275, S649)** moved verbatim to `docs/exhibit_canonicalization_lessons.md`, *Moved from the lane (S666 checkpoint)*. Their decisions stand: `d-named-credential-issuer-tag-or-half-s648`, `d-or-between-tests-coded-as-written-s648`, `d-comptia-series-is-alias-s648`, `d-official-name-source-confidence-s648`, `d-comptia-after-ase-s648`, `d-cvma-three-rows-guarded-s649`, `d-cvma-three-rows-applied-s649` (rollback in `kb/receipts/migration_s649_cvma_three_rows_43542969094.json`). Sam's card 4 answer is written to `kb/status/exhibit.json` on draft #3398 (S666; one writer). **NEXT:** the rename to *ASE Certificate Bundles: A6 or T6 + L3* rides the next rename batch for Sam's approval there, never applied by a session; the all-family view is the next Exhibits slice.
- **The Exhibits Review side panel (S642; #3157, #3160)** moved verbatim to `docs/cer_v2_redesign_lessons.md`, *Moved from the lane (S647 afternoon)*, with the S642 DECIDED lines `d-side-panel-folds-reuse-rename-rows-s642` and `d-alignment-line-same-issuer-s642`; all stand.
- **DECIDED (Sam, in session S642, 2026-11-12; `sam-classifier-suggests-title-in-use-2026-11-12`, `sam-cert-title-official-name-not-mid-2026-11-12`):** the classifier proposes the title already in use (a statewide exhibit first, then the most used) before a new one; an M-ID course title fits a credit-by-exam exhibit, and an industry certification, license or training program takes its official name.
- **Applied and standing, records in `docs/exhibit_canonicalization_lessons.md`, *Moved from the lane (S640)*:** the restore (`kb/cer_decisions_out/2026-11-11-4`, 13 rows; undo `-4` before phase 1) and Sheet 181's ruled renames (`kb/cred_rename_out/2026-11-12/`, 22 renames and 2 merges; undo `kb/_cred_rename_undo.py kb/cred_rename_out/2026-11-12`, `--supabase-plan` for the `kb_curation` reversal). No dry-run-only mode: run `kb/_cred_rename_dryrun.py --only-plan <id>` locally first.
- **The standards folds (S640, both plans applied; receipts `kb/cred_rename_out/2026-11-12-2/` and `-3/`; undo `kb/_cred_rename_undo.py` newest first, `-3` then `-2`) and the S640 conductor's three decisions** (`d-standards-plan-four-entries-s640`, `d-rename-apply-drops-fulfilled-approvals-s640`, `d-standards-second-plan-s640`) moved verbatim to `docs/exhibit_canonicalization_lessons.md`, *Moved from the lane (S642)*. What stands: a rename apply drops the approval rows it fulfils, each before-row kept in its receipt.
- **NEXT, in order:** (0) done (S650): each saved-titles read rebuilds what the reads settled, so a title cleared in another browser tab or session reopens its card with no reload (a card decided on this page stays decided; Back reopens it), and the read also runs when the browser tab comes back into view (`tests/exhibits_review_reconcile.test.js`); (0a) done (S650): **DECIDED** the two `kb/cred_rename_dryrun/` reads publish (`alias_map.json`, `collisions.json`, each its own line in `.github/pages_allowlist.txt`; the folder stays withheld): without the alias map the Related panel turned off every fold on the deployed site, and the reviewer address in it is already public in `kb/credential_review_overlay.json`; `tests/exhibits_served_paths.test.js` fails any kb/ read in `exhibits.js` that no publish line covers; (0b) the Exhibits rename batch for Sam, the ASE Certificate Bundles title in it; (0c) `series_aliases` wired into `kb/credential_aliases.py`; (0d) no session has yet seen the Exhibits Review fix (#3260) on the deployed site (verified in tests, a local browser review and committed data only); (1) read-time resolution is built (S641, #3148, `kb/credential_aliases.py`); left for the apply side: #3140's old-title count, dashboard job and newest-first undo guard; the Fact Sheet's categories (`excel_to_dashboard.py`) want their own PR, a public count; (2) to (4) done (S641), moved verbatim to `docs/cer_v2_redesign_lessons.md`, *Moved from the lane (S648)*; (5) done (S642, #3158, #3166): the ghost rows are deleted and the sync prints the ghost count each night; run `chatbox-ghost-delete.yml` (plan, then apply with the plan's count) when it is above zero. Left: 148 of the 230 had no recorded rename (*AP U.S. History* to *AP United States History*), so their old names are no search alias; (5a) done (S642, #3168), moved verbatim to `docs/cer_v2_redesign_lessons.md`, *Moved from the lane (S648)*, with its open `cbeCard` note from COBIx; (6) the Exhibits list shows a kept fold row as "Saved" where "Family set" is true; (7) the rename batch offers only titles outside the ruled plans; (8) the 362 credentials without a subject as one batch (web search an anomaly first); (9) the hourly trigger for the fold apply; (10) the issuer registry (official name, short tag, aliases: AWS the Welding Society, ACE the Council on Education); (11) H and N verification, then the trainer move (130 titles, the 10 duplicate spellings; the *alifornia Veterinary Medical Association* rows and their `kb/credentials.json` copies were corrected by #3275, S649); (12) a Review step for the 181 college-issued titles holding an industry-certification exhibit. Then CompTIA, AWS, NCCER, a batch each (`cert_naming.FAMILIES`).
- Tests: `tests/credential_family_test.py`, `tests/credential_family_apply_test.py`,
  `tests/cert_naming_test.py`, `tests/exhibits_related.test.js`, `tests/fold_issuer_resolution_test.py`,
  `tests/emptied_title_guard_test.py`, `tests/cer_decision_apply_test.py`, `tests/cer_decision_apply_retry_test.py`,
  `tests/issuer_resolution_parity.test.js`, `tests/exhibit_progress.test.js`.

## The redesign (2026-10-30, side session beside S531)

Sam, 2026-10-30: *"Have a good look at the current CER and notice how crowded it is and not intuitive to navigate. It is
now part of our Catalog Commons overall project and I want you to help me make it much more manageable and simple."*
Design record: mock-up https://claude.ai/artifact/6fTBpjkrGseEb7h3gaPnSM (version 26), source
`docs/visuals/2026-10-30-cer-exhibits-redesign-mockup.html` (#2595, merged). Built so far: the high school and ROP
rule and the CPL-AI dialog (#2601); the Exhibits tab's Review queue (SkyRowanberry, 2026-10-31, below). What Sam ruled in the
mock-up, each his words in the lessons doc (`docs/cer_v2_redesign_lessons.md`, 2026-10-30):

**The List view** (S540, S541; live): its record moved verbatim to `docs/library_lessons.md` (*Moved from the lane, SkyFern*).

**Re-analysis (first run S626, 2026-11-10):** a press of the List's re-analyze box runs the checks (`kb/_exhibit_reanalysis_checks.py`), then the Jev runner (`typesafe-smoke.yml`, input `reanalysis`); Sheet 180's rulings are carried out. The record moved verbatim to `docs/cer_v2_redesign_lessons.md`, *Moved from the lane (S639)*. **NEXT:** the next request runs both.

Sam's mock-up rulings, item by item, moved verbatim to `docs/cer_v2_redesign_lessons.md`, *Moved from the lane (SkyCloudberry)*.

**Sam's rulings, Open Asks Sheet 147** (completed 2026-10-31, all five built or standing; cpl_memory `sam-sheet-147-rulings-2026-10-31`) moved verbatim to `docs/cer_v2_redesign_lessons.md`, *Moved from the lane (S634)*. Two still govern: the public adoption page lists settled credentials only, and it takes Malone's CPL/AI look.

**The Exhibits tab** (`#exhibits`, `exhibits.js`; built 2026-10-31 in #2602 to #2604): the record moved verbatim to `docs/exhibit_canonicalization_lessons.md`, *Moved from the lane (S639)*.

The review queue's builder, the students function and the buttons: `docs/exhibit_canonicalization_lessons.md`, *Moved from the lane (S640)*.

**CPL-AI (SkyLantern, 2026-11-06).** Hosted frozen and on public view (Sam); the record moved verbatim to `docs/exhibit_canonicalization_lessons.md`, *Moved from the lane (S639)*; detail in `docs/library_lessons.md`.

**The Credential Catalog** (`library/adopt/`, SkyTwinberry, 2026-10-31) and **the Commons Exhibits List's shape** (Sam, 2026-11-06; what is there and what is still to add) moved verbatim to `docs/cer_v2_redesign_lessons.md`, *Moved from the lane (S639)*. Ruled and standing: settled means a local title under the credential carries a review stamp; the statewide route is a public request to prioritize review, never an evaluation promise.

Sheet 148's rulings (the Credential Catalog's name and links, the CER and EACR tabs retired) and Sheet 149's (fold, routine) are in the lessons doc.

**Rules (SkyBilberry, 2026-10-31; Sam: "a link to a view of all the rules used to suggest or fold exhibit titles", and
Sheet 149 card 2).** The tab's **Rules** view (`#exhibits/rules`, also from Another look's rule filter) lists every
procedure with its words, who set it and the last run's tallies, Another look's rules, and the rules sent to the routine.
Teach a rule's *Send to the routine* writes `_CER_PROCEDURE_REQUEST::<when>-<tag>` / `cer_procedure_request`; the CPL
queue routine (step 7 of `scheduled_sessions.md`) builds the procedure off (`request` names the row; an off rule's
lanes reach nobody), writes `cer_procedure_built` from `kb/_cer_procedures.py --try`, and applies *Turn on* or *Discard*
(`cer_procedure_switch`) at its next firing. DR-07 maps the three fields; the rows carry no student detail.
Guards: `tests/exhibits_rules.test.js`, `tests/cer_procedures_test.py`.

**IB and CLEP on the AP pattern (SkyInkberry and SkyTeaberry, 2026-11-01; Sam kept both, Sheet 150 cards 1 and 2)** moved verbatim to `docs/cer_v2_redesign_lessons.md` (*Moved from the lane, SkyBeacon, 2026-11-06*).

**NEXT:** (0) After each of Sam's runs through *Another look*, read the next fold's `credential_moves` and
`credential_retires` and move the panel rows they list (receipts `kb/receipts/credential_panel_move_*.json`; a row
that cannot fan in, or whose rename the fold carried out, stays under its old key, named in the receipt).
Sheet 161, applied 16:08Z 2026-11-03: lessons. (1) The Catalog's *Courses that may align*,
once a source names courses. (2) Training sites for a held title new to the reference, and the *Held titles by group*
table, only if Sam asks.
