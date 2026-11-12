---
title: "CER procedures and the simpler CER tab — lane state"
created: 2026-10-18
updated: 2026-11-12
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
- **The fold keeps one issuer, in one pass (#3116):** `kb/fold_issuer.py` holds the rules in order: (1) a person's
  issuer saved at or after the group's earliest fold save wins, (2) a cert-form target keeps its issuer, (2b) an "(ASE
  ... standards)" target keeps the college, (3) additive. The decision is one `issuer_resolution` row per folded target
  (cohort `cred-fold-s638@bot`); no issuer row a person wrote is changed; every reader resolves through
  `effective_issuer` (`issuer_resolution.js` in the browser). `kb/_cred_rename_undo.py <receipt>` reverses an apply.
  The guarded writes and the undo have run only against a test double.
- **The applier for CER decision plans** (`kb/_cer_decision_apply.py`, `cer-decision-apply.yml`) has a `reviewed_at`
  guard, a `because` line and `over_machine_draft` (#3118). The workflow accepts a plan folder named `<date>` or
  `<date>-<2-9>` only (run 43104136989 refused the first names); #3120 renamed them `kb/cer_decisions_out/2026-11-11`,
  `-2`, `-3`. **Phases 1 and 2 applied** (22:13Z and 22:26Z; receipts in each folder): every insert, replace and
  exhibit re-point stands. They also retired 17 rows on the titles they emptied; the 13 a person saved were restored
  by `kb/cer_decisions_out/2026-11-11-4` (below), and the 4 July `reviewed_marker` ticks stay retired. The applier's `reinstates` put a row back
  exactly as its receipt kept it, under the person's own reviewer and stamp, insert-only; `while_emptied` holds the
  plan until the committed map shows the title empty (the committed `kb/unified_titles.json`, which only the nightly
  fold moves; a commit is refused off origin/main's current copy, and the workflow checks out main); `--rollback`
  deletes exactly those rows, and leaves one that phase 1's own rollback has since found in place or put back.
- **The applier's undo never reads a write's echo (S639 review, #3123).** `Rest._call` retries a request whose response
  was lost, and the retry echoes nothing for a write that landed. So the receipt is `pending` with the planned lists
  before the first write, a fresh read files each row after the writes, and `--rollback` works from the planned lists
  of every receipt (pending ones too), each step guarded by live value and reviewer (and stamp) and read back
  (`tests/cer_decision_apply_retry_test.py`, a PostgREST-level fake). `load_plan` refuses a retire of a person's row
  but a `reviewed_marker` unless the plan names `ruling_allows_retire_of_saved_rows`; applied plans load for rollback.
- **Readers ignore a saved row on an emptied title** (a title no `kb/unified_titles.json` raw maps to, the fold's own
  test). `fold_issuer.hold_emptied_folds` keeps its saved fold out of the rename dry run and the apply (`held_emptied`
  in the alias map), so it leads no fold, raises no issuer conflict (Heating and Air Conditioning's 15:47Z issuer) and
  renames nothing; the same rows act again once a raw maps to the title (`tests/emptied_title_guard_test.py`). The
  nightly fold reads only `_UNCLASSIFIED::` rows, and `effective_issuer` resolves only a title a fold targeted. The
  fold's `credential_retires` list these titles' panel rows under `panel_rows_left`: they stay where they are.
  **DECIDED (Sky and COBIx, 2026-11-11, #3110):** a plan never retires a person's saved row on an emptied title;
  readers ignore it.
- **Exhibit subject fill (#3119):** `kb/_exhibit_subject_fill.py` gives a credential with no Common SUBJ the subject of
  the courses colleges credit for it (several colleges first, then one), else its issuer family's; title words, TOP and
  CIP never decide. First live run (cer-procedures run 43104720166, 21:41Z): 747 `subj_override` and 747 `subj_source`
  rows under `exhibit-subject-s638@bot`; undo is the cohort delete. `kb/exhibit_subject_out/worklist.json` lists the
  rest (362 credentials, 429 exhibits, 70 with a suggestion); the Commons' Exhibit card counts `no_subject`.
- **A credential family is a field, never a fold (#3117, merged; the write, S639):** `kb/reference/credential_families.json`
  declares the family; `kb/_family_tag_plan.py` gives insert rows, never SQL: 24 titles take `credential_family = ASE
  Certificate Bundles`, 7 are held. ASE bundles keep their titles (Sam: *"A, C as recommended"*). Sam's 31 saved fold
  rows stay beside the tags, never edited or deleted; `kb/fold_issuer.py` `hold_family_folds` (called by
  `_cred_rename_dryrun.py` and `_cred_rename_apply.py`) holds any fold whose target is a family title, and the rename
  batch (`_build_exhibits_related.py`) reads a member's fold into its family as no rename. The write is
  `credential-family-apply.yml` (`kb/_family_tag_apply.py`): it reads live at dispatch (Range-paged), gates on the
  SET (a hash of the sorted title-family pairs, never a count), refuses on a conflict (a pending merge confirm naming a
  member as its target, or a member's family row holding another value), pushes a pending receipt of the planned rows
  to `main` before the insert, inserts only under `credential-family-s638@bot`, and files each row as ours or a
  person's by a live read-back, never by the INSERT's echo; receipts land in
  `kb/receipts/credential_family_2026-11-11_s638/`. Undo: `mode=rollback` deletes each planned row (pending receipts
  included) only while it still holds the cohort, the field and the value written; a row a person changed since stays
  and is reported as taken since. #3117's `plan.sql` never ran and is retired.
- **DECIDED (Sam, Open Asks Sheet 183 card 6, 12:17Z 2026-11-12, his word: "delete"; `d-sheet-183-replies-2026-11-12`; carried out S642, #3158):** Sierra's ghost rows are deleted. `chatbox-ghost-delete.yml` (dispatch only: plan, apply, undo) removed 230 rows of `chatbox_credentials` absent from the reference at 13:46Z 2026-11-12; live count 2,719, the reference's own. The sync now adds each retired name to its successor's `raw_variants`, and apply holds a ghost until its successors carry it. Receipt and undo: `kb/receipts/chatbox_ghost_delete_2026-11-12T13-37-23Z/` (`mode=undo`, `plan_dir` that directory). `d-sierra-ghost-rows-deleted-s642`.
- **DECIDED (Sam, in session S642, 2026-11-12; `sam-classifier-suggests-title-in-use-2026-11-12`, `sam-cert-title-official-name-not-mid-2026-11-12`):** the classifier proposes the title already in use (a statewide exhibit first, then the most used) before a new one; an M-ID course title fits a credit-by-exam exhibit, and an industry certification, license or training program takes its official name.
- **The family is live on 25 titles** under `credential-family-s638@bot`: the 24 bundles (#3122; dry run 43120144849,
  commit 43120939284, set `038293de0093`, receipt `applied_2026-11-11T23-38-21Z.json`), then the two any-one-test
  members *ASE C1 or G1* and *ASE Certification (any A1–A8)* (commit 01:28Z 2026-11-12, set `3a4d0f3d969b`, receipt
  `applied_2026-11-12T01-28-47Z.json`), less the bot tag removed on the merged A2 + A3 + A6 twin. Of the 25, 22 sit
  on renamed bundle titles, 1 on *ASE Bundle — A6 or T6 + L3*, 2 are any-one-test. Undo:
  `credential-family-apply.yml` `mode=rollback`. `kb/credentials.json` carries 23 `family` values until the next daily run.
- **Applied and standing, records in `docs/exhibit_canonicalization_lessons.md`, *Moved from the lane (S640)*:** the restore (`kb/cer_decisions_out/2026-11-11-4`, 13 rows; undo `-4` before phase 1) and Sheet 181's ruled renames (`kb/cred_rename_out/2026-11-12/`, 22 renames and 2 merges; undo `kb/_cred_rename_undo.py kb/cred_rename_out/2026-11-12`, `--supabase-plan` for the `kb_curation` reversal). No dry-run-only mode: run `kb/_cred_rename_dryrun.py --only-plan <id>` locally first.
- **The "standards" folds, first plan, applied (S640):** `standards-2026-11-12` (#3142, `cc327236`): the A5, A7 and A8 titles to their *(ASE A5 standards)*-style names, and *Engine Performance (ASE A8 Engine Performance)* merged into the A8 one. Dispatched 05:12Z, filed `99d4ff32`, receipt `kb/cred_rename_out/2026-11-12-2/`: 13 `kb_curation` steps, 0 failed (7 of Sam's fulfilled approval rows deleted, before-rows kept; 6 bot subject rows superseded or moved), one `issuer_resolution` insert (`cred-fold-s638@bot`); the 6 held rows untouched. Published by `138779a4`. Undo: `kb/_cred_rename_undo.py kb/cred_rename_out/2026-11-12-2` (`--supabase-plan`), after `-3`.
- **DECIDED (the S640 conductor, 2026-11-12; `d-standards-plan-four-entries-s640`):** the standards plan is four entries, not five. The lane's "five" counted Sam's saved folds at ruling time; phases 1 and 2 emptied four source titles, and what remained were his four saves of 15:26Z 2026-11-11.
- **DECIDED (the S640 conductor; `d-rename-apply-drops-fulfilled-approvals-s640`):** a rename apply drops the approval rows it fulfils (a person's override or merge confirm saying "fold this title into that one"), each before-row kept in the receipt (`kb/_cred_rename_apply_supabase.py`, *Why DELETE + PATCH*). S639's rule still protects a saved row whose instruction was never carried out. Told to COBIx before the dispatch (#3110, comment 6814772340).
- **DECIDED (the S640 conductor; `d-standards-second-plan-s640`), applied:** the other seven standards folds, Sam's saved renames of 15:26:54Z 2026-11-11 for ASE L1, A2, A6, L3, A9, A3 and A4, ran as `standards-2-2026-11-12` (#3143, `bf8c576a`; dispatched 05:45Z after a fresh read: 19 rows on the sources, 7 Sam's, 12 bot subject rows). Filed `838e9320` (05:48Z), receipt `kb/cred_rename_out/2026-11-12-3/`: 7 renames, 19 row steps, 0 failed (7 of Sam's fulfilled overrides deleted, 12 subject rows moved); count 05:48:59Z: 0 on the old keys, 3,484 `_CREDENTIAL_REVIEW::` rows. Undo newest first: `kb/_cred_rename_undo.py kb/cred_rename_out/2026-11-12-3`, then `-2`. The A6 *Automotive Electrical/Electronics 1* and *2* saves sit on emptied titles and stay out.
- **DECIDED (the S640 conductor; `d-rename-repoint-stopped-resolve-at-read-s640`):** re-pointing saved machine values at apply time is stopped. #3140 went five review rounds (20, 12, 9, 3, 1 findings), each a new wrong-data fault; the S641 first firing closed it, and a stored title now resolves at read time through the applied alias map (`kb/credential_aliases.py`, #3148), as `kb/alias_chain.py` does for M-IDs; no live row is rewritten.
- **DECIDED (the S641 first firing, D1; #3148):** a live title (a `kb/credentials.json` key) is itself at every step; any other resolves through every in-force snapshot in `_applied_at` order, no era guard; a returned title is no alias.
- **DECIDED (the S641 first firing, D2; #3148):** retire aliases read the fold's append-only `kb/unclassified_fold/retires.json`.
- **DECIDED (the S641 first firing, D3; #3148):** a resolution ends on a live title or is reported: a dead end takes the ledger's one live target, else the table's `report` lists it; no alias on a dead title.
- **DECIDED (Open Asks Sheet 181, Sam, 22:55Z 2026-11-11; `d-sheet-181-replies-2026-11-11`):** ASE Master is one
  Automobile title and one Truck title, both canonical; *ASE Certification (any A1–A8)* and *ASE C1 or G1* keep their
  titles as any-one-test family members, no fold; *Advanced Electrical and Electronic Systems* follows the emptied-title
  rule; the bundle renames run with the old names kept as aliases. All four are carried out above.
- **DECIDED (the S639 conductor):** *ASE Master Automobile Technician (A1–A8) or L3* keeps its own title (L3 alone
  qualifies, so an L3 holder is no Master) and *ASE Bundle — A6 or T6 + L3* stays unrenamed; both are left for a
  person. Restored 13 rows, not 12: the map@rccd.edu issuer row is a person's.
- **NEXT, in order:** (1) read-time resolution is built (S641, #3148, `kb/credential_aliases.py`); left for the apply side: #3140's old-title count, dashboard job and newest-first undo guard; the Fact Sheet's categories (`excel_to_dashboard.py`) want their own PR, a public count; (2) done (S641): plan 2's seven titles stand in `kb/credentials.json` on `main` (`838e9320`), and the daily runs `98ac7d6a` and `eb2ad8a2` followed; (3) done (S641 first firing, 06:30Z): ASE plan phase 3 applied, five `kb_curation` `unified_title_assignment` rows under `cer-s638@bot`, read back 5, receipt `kb/cer_decisions_out/2026-11-11-3/applied_2026-11-12T06-30-30Z.json` (`8fb7712d`), rollback by that cohort's rows in the receipt; (4) done (S641): retire aliases; check 4 passes (four renames resolve, five rulings `recurated`). For Sam's Exhibits review, 11 titles in `kb/credential_title_moves.json` `report`: 3 returned, 6 dead ends, 2 dead retires; (5) done (S642, #3158): the ghost rows are deleted and the sync prints the ghost count each night; run `chatbox-ghost-delete.yml` (plan, then apply with the plan's count) when it is above zero. Left: 148 of the 230 had no recorded rename (*AP U.S. History* to *AP United States History*), so their old names are no search alias; (5a) the classifier's proposal step ranks titles in use (statewide, then most used, same issuer) and names an industry certification by its official name, never its M-ID's course title (Sam's two rulings above); count the Proposed cards it changes first; (6) the Exhibits list shows a kept fold row as "Saved" where "Family set" is true; (7) the rename batch offers only titles outside the ruled plans; (8) the 362 credentials without a subject as one batch (web search an anomaly first); (9) the hourly trigger for the fold apply; (10) the issuer registry (official name, short tag, aliases: AWS the Welding Society, ACE the Council on Education); (11) H and N verification, then the trainer move (130 titles, the 10 duplicate spellings and the *alifornia Veterinary Medical Association* typo); (12) a Review step for the 181 college-issued titles holding an industry-certification exhibit. Then CompTIA, AWS, NCCER, a batch each (`cert_naming.FAMILIES`).
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

The AP fold (Sheet 149 card 1) applied on 2026-10-31; its receipts are in the lessons doc.

**IB and CLEP on the AP pattern (SkyInkberry and SkyTeaberry, 2026-11-01; Sam kept both, Sheet 150 cards 1 and 2)** moved verbatim to `docs/cer_v2_redesign_lessons.md` (*Moved from the lane, SkyBeacon, 2026-11-06*).

**NEXT:** (0) After each of Sam's runs through *Another look*, read the next fold's `credential_moves` and
`credential_retires` and move the panel rows they list (receipts `kb/receipts/credential_panel_move_*.json`; a row
that cannot fan in, or whose rename the fold carried out, stays under its old key, named in the receipt).
Sheet 161, applied 16:08Z 2026-11-03: lessons. (1) The Catalog's *Courses that may align*,
once a source names courses. (2) Training sites for a held title new to the reference, and the *Held titles by group*
table, only if Sam asks.
