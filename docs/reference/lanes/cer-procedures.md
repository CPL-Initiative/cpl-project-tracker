---
title: "CER procedures and the simpler CER tab — lane state"
created: 2026-10-18
updated: 2026-11-11
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

**The classifier answered nothing from 2026-11-07 to the merge of #2925 (S604).** Every call came back HTTP 413: the
house families pushed the standing rules to 251,866 characters against `cer-classify`'s `MAX_RULES` 250,000. #2925 lists
the families under their issuer over a 240,000 budget (lossless, ~165,600), drops far families only as a last resort,
and stops the run rather than send a refused call. COBIx asked for a replay: the first trim kept every family line but
stripped the issuer from 156 of 1,115 saved joined answers; the grouping keeps all 1,115 (`tests/cer_classifier_rules_size_test.py`).
Read the next nightly report's `classifier_run.answered` and `errors` after it lands. Also #2924: the procedures report
`kb/cer_procedures_out/latest.json` is served by Pages again (it 404'd for Exhibits, the CER tab and the progress).

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
  exhibit re-point stands. They also retired 17 rows on the titles they emptied; **the 13 a person saved are restored
  by `kb/cer_decisions_out/2026-11-11-4`** (12 of Sam's as slee@cccco.edu, and Automotive Air Conditioner's July issuer
  row as map@rccd.edu), and the 4 July `reviewed_marker` ticks stay retired. The applier's `reinstates` put a row back
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
- **Held for Sam:** nothing in this lane.
- **The family tags are live:** 24 `credential_family` rows under `credential-family-s638@bot` (#3122; dry run
  43120144849, commit 43120939284, set `038293de0093`). Undo: `credential-family-apply.yml` `mode=rollback`.
- **DECIDED (Open Asks Sheet 181, Sam, 22:55Z 2026-11-11, cards taken as decided; `d-sheet-181-replies-2026-11-11`):**
  ASE Master is one Automobile title and one Truck title, both canonical.
- **DECIDED (Sheet 181):** *ASE Certification (any A1-A8)* and *ASE C1 or G1* keep their own titles, tagged with the
  family as any-one-test members; no fold.
- **DECIDED (Sheet 181):** *Advanced Electrical and Electronic Systems* is an emptied title (its one exhibit went to ASE
  MIL6) and follows the emptied-title rule.
- **DECIDED (Sheet 181):** the rename batch to "ASE Certificate Bundles: A4 + A5" runs, with the old names kept as
  aliases.
- **NEXT, in order:** (0) the two any-one-test family tags (Sheet 181: *ASE Certification (any A1–A8)* and *ASE C1
  or G1* join the family as members any one of whose tests qualifies, declared under `any_one_test` in
  `kb/reference/credential_families.json`; the 24 bundle tags landed, receipt `applied_2026-11-11T23-38-21Z.json`):
  dispatch `credential-family-apply.yml` `mode=dry-run`; a correct summary reads *2 to write, 24 already written, 5
  held for Sam, 0 conflicts; set `<hash>` (26 tags)* (4 held once (3) has merged the A1–A8 + L1 Master); then `mode=commit expect=<hash>`. Either order with (3) works: the
  rename moves each tag to its new title (the new title is the bundle) and Sam's fold rows stay on the old one; the
  family dry run counts a tag at the renamed title as written, and its rollback finds it there (`kb/credential_aliases.py`
  `moves`); (0b) `daily-dashboard.yml` carries the family onto `kb/credentials.json` (the restore brings back Advanced Electrical and Electronic Systems'
  fold into ASE Certificate Bundles on an emptied title, which the converter must leave as it is); (1) the next nightly fold, then the
  restore (`-4`): dry run, then commit, before anything else touches these titles; to undo both, roll back `-4` before
  phase 1 (the other order is safe too: `-4`'s undo leaves what phase 1's put back); (2) the retired names as search
  aliases of where their exhibits went (Automotive Air Conditioner and Heating and Air Conditioning to the A7 and MIL7
  titles, Automotive Braking Systems to MIL3 and MIL4): `kb/credential_aliases.py` reads only applied rename
  snapshots, never the fold's `credential_retires`, so none resolves today; (3) `cred-rename-apply.yml` with `only_plan=sheet181-2026-11-12` applies Sheet
  181's ruled plan alone, the small first live use of #3116; a dispatch without it also carries the five "standards" folds. The plan
  (`kb/cred_rename_plans/2026-11-12_sheet181.json`, read by `kb/ruled_renames.py` in the dry run and the apply) holds 22
  bundle renames to *ASE Certificate Bundles: …* (the A2 + A3 + A6 pair one title by a merge) and *ASE Master Automobile
  Technician (A1–A8 + L1)* merged into *ASE Master Automobile Technician* (issuer rule 3, additive; no conflict); the
  Truck Master, the any-one-test titles, *ASE Bundle — A6 or T6 + L3* and *ASE Master Automobile Technician (A1–A8) or
  L3* (L3 alone qualifies, so an L3 holder is no Master; S639 conductor) keep their titles, left for a person.
  The plan stands in for the rename rows because each title's slot holds Sam's family-tag fold, which no plan edits;
  the row move leaves those rows in place (op `keep`), logs every planned move with its before-row before the first
  write, files what landed from a fresh read, and a rerun carries what landed. Read the dry-run's `ruled` and
  `issuer_preview` first, then `daily-dashboard.yml`; undo is `kb/_cred_rename_undo.py` on the receipt, built from
  the planned moves, each guarded on the live row; (3b) Sierra's `chatbox_credentials` keeps a retired title as a
  ghost row after any rename: `kb/_sync_credential_catalog.py` `upsert` (line 198) only merges by `unified_title` and
  never deletes or aliases a title the artifact dropped; a guarded delete of rows absent from
  `credential_reference_data.js` (receipted, Rule 10) is the fix; (4) ASE
  plan phase 3 (`-3`); (6) the ASE rename batch now offers only titles outside the ruled
  plan; (7) the credentials still without a subject, as one
  batch (try a web search on an anomaly first, Sam 2026-11-11); (8) the hourly trigger for the fold apply; (9) the issuer
  registry (official name, short tag, aliases: AWS the Welding Society, ACE the Council on Education); (10) the trainer
  move (130 titles, with the 10 duplicate spellings and the *alifornia Veterinary Medical Association* typo); (11) a
  Review step for the 181 college-issued titles holding an industry-certification exhibit. Then CompTIA, AWS, NCCER as
  one batch each (`cert_naming.FAMILIES`).
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

**Re-analysis (first run S626, 2026-11-10).** A press of the List's re-analyze box runs the checks (`kb/_exhibit_reanalysis_checks.py`; findings `kb/exhibits_reanalysis/<date>.json`, `latest.json`), then the Jev runner (`kb/_exhibit_reanalysis_jev.py` on `typesafe-smoke.yml`, input `reanalysis`): two questions, no gate, each answer Jev's probability for Sam's word. The findings panel under the box leads with what needs the sender's word. **Sheet 180's rulings are carried out (cards 3 and 6, 2026-11-10):** Wildland Fire-Basics reads *California State Fire Training (SFT)* (S633); 10-Key Data Entry's issuer reads *California Community Colleges* alone (S634, receipt `kb/receipts/kb_curation_10key_issuer_2026-11-10_s634.json`); CSTI, Johnson Controls Training Institute and Spaulding Marine Center stay as issuers. **DECIDED (S634):** the two *Graduate Level Institution of Higher Education* rows are Los Angeles Pierce's doctorate exhibits (MAP 63381, 64857); MAP names no conferring university, so Sam's rows stand until Pierce names one (ask its CSM). The Ph.D. exhibit sits under *Clinical Counseling Laws and Ethics*, a course it awards; the row is Sam's to move. `kb/_apply_credential_review.py` never removes an issuer; it names any a changed override leaves (`stale_override_issuers`); edit the reference too. The five verdicts are the exhibits' first calibration set. History: lessons, *Moved from the lane (S634)*. **NEXT:** the next request runs both.

Sam's mock-up rulings, item by item, moved verbatim to `docs/cer_v2_redesign_lessons.md`, *Moved from the lane (SkyCloudberry)*.

**Sam's rulings, Open Asks Sheet 147** (completed 2026-10-31, all five built or standing; cpl_memory `sam-sheet-147-rulings-2026-10-31`) moved verbatim to `docs/cer_v2_redesign_lessons.md`, *Moved from the lane (S634)*. Two still govern: the public adoption page lists settled credentials only, and it takes Malone's CPL/AI look.

**The Exhibits tab** (`#exhibits`, `exhibits.js`; built 2026-10-31 in #2602 to #2604): the record moved verbatim to `docs/exhibit_canonicalization_lessons.md`, *Moved from the lane (S639)*.

- `kb/_build_exhibits_review.py` writes `kb/exhibits_review.json` and the lazy `kb/exhibits_review_courses.json` from the
  procedures run's `needs_you`, the `aligned` course, `statewide_data.js`, the identity members, the reference and the
  overlay's training sites; nightly at the end of `cer-procedures.yml` and daily. A title settled or saved since the
  run leaves the queue. First published 2026-10-31 02:12Z: 468 held (401, 36, 13, 18), 209 aligned.
- **Students:** `exhibit_title_students(p_keys, p_ids)` (`kb/migrations/2026-10-31_exhibit_title_students.sql`),
  distinct students per title, an allowed reviewer only, k=10 inside the function. Governance:
  `rpc:exhibit_title_students` dismissed, `tab:exhibits` mapped to DR-07.
- **The buttons** write the CER's own `_UNCLASSIFIED::<local title>` rows (title and issuer). A conflict's *Change to
  Proposed Title* with the reference's title clears the saved assignment; any other title on a conflict re-keys a
  person-reviewed entry and stays a session's change. *Teach a rule* copies the rule for a session.

**CPL-AI (SkyLantern, 2026-11-06).** Hosted frozen and on public view (Sam); the record moved verbatim to `docs/exhibit_canonicalization_lessons.md`, *Moved from the lane (S639)*; detail in `docs/library_lessons.md`.

**The Credential Catalog (built SkyTwinberry, 2026-10-31; Sheets 147 and 148).** `library/adopt/`, Pages-served, linked
from the Library and the public header; `kb/_build_adopt_page.py` writes `adopt_data.json` daily from
`kb/exhibits_adoption.json`, and **settled means a local title under the credential carries a review stamp**, a person's
or a cohort's. It offers both CSVs and Create Handout, writes nothing but the asks, remembers no filter, and `?college=`
follows the pick. Today's shape is the port below.
**The Credential Catalog's port from the mock (SkyAerial, 2026-11-06) and the statewide request route (Sheet 162,
DR-31, `credential_priority_request()`)** moved verbatim to `docs/cer_v2_redesign_lessons.md`, *Moved from the lane
(S638)*. Ruled and standing: the statewide route is a public request to prioritize review, never an evaluation promise.

**The Commons Exhibits List carries the same shape next (Sam, 2026-11-06: "make sure that any needed formatting or
functionality from this mock is also reflected if needed on the commons exhibits"; the Credential Catalog is the public
face of the Exhibits reference plus the harvested lane).** Already there: the resizable side panel, drill-downs, the
could-adopt courses behind a chip, Request Quick Adopt, the held and conflict queues, the industry lane, the SLO neighbor
hints, procedure requests, and (SkyLoop, 2026-11-06) **the public requests as the Requests view** (`#exhibits/requests`):
one line per credential, most asked first, the colleges named or *Statewide only*, emails counted and never shown, first
and last asked; the views row counts the asks still new and Progress lists them with *Read them*; the read goes behind the
phrase or a reviewer sign-in (`tests/exhibits_requests.test.js`, 19). **To add:** credit status as one band and filter
across all four classes (held, conflict and industry are separate lanes today); routing a request to a college or the
statewide list from its line (a status stamp, service role today); the analysis for faculty in the side panel; A for a
could-adopt cell wherever a matrix shows; the table shape with 0 carrying the action. Public only: Start with, the photos,
the portal hand-off.

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
