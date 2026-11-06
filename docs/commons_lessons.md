---
title: "The Commons — lessons"
date: 2026-10-18
updated: 2026-10-20
tags: [lessons, commons, program-requirements, cer-procedures, skyview, common-cr-reference]
artifacts:
  - commons_progress.js
  - commons.js
  - kb/_build_commons_status.py
  - kb/status/commons.json
  - tests/commons.test.js
  - tests/commons_status_build_test.py
  - program_requirements.js
  - tests/commons_progress.test.js
  - kb/status/program-requirements.json
  - scripts/queue_status.py
related:
  - docs/reference/lanes/commons.md
  - docs/program_requirements_harvest_lessons.md
  - docs/kb-notes/methodology-a-shared-view-borrows-the-host-s-primitives.md
---

# The Commons — lessons

The lane ([`docs/reference/lanes/commons.md`](reference/lanes/commons.md)) states where the Commons stands; this doc
keeps what each step taught, once. Sam's framing (2026-10-18): *"each of our 'common' projects should have the same
approach and tracking and feedback system... It all needs to culminate in a 'Commons' dash."* The ruled order (Open
Asks Sheet 95 card 1): a shared Progress module, then each reference's Progress view, then the Commons tab.

## S437 SkySagebrush (2026-10-20): the CR Progress view, the C-ID site found, Sheet 108 answered, decision lock

- **A greeting can be five sessions stale.** Sam pasted handoff 432's opening line at 04:47Z; the session started
  near 12:40Z, after the routine had run S432 to S436. The highest handoff (437) is the authority; claim its moniker
  and say so in one line rather than repeating finished work.
- **Pick the unit a reader settles, then make the Commons row count it.** The CR row counted groups (156 by rule,
  30 decided), but a curator's fold settles a *wording* whose own group stays undecided (41 such), so groups
  undercount. Complete = a wording a rung 1 to 4 rule places or a decision names (confirmed or not a topic):
  459 of 2,344, 5,750 of 9,413 articulations. The builder's `row_cr()` and the tab's `SETTLES` apply one rule, and a
  fixture guards it (a split-out wording and a deferred decision settle nothing).
- **The tab's first queue was not the reference's backlog.** Needs a decision listed 138 groups, all rule-folded; the
  real backlog is 1,885 single wordings at rung 5, which no filter showed. The view's counts needed two new filters
  (No rule or decision, Name to check) to open what they count.
- **An inline style on a shell placeholder outranks injected CSS.** `#cr-reference-root` kept its loading stub's
  dashed box and centered muted text under every render since the tab shipped; a screenshot found it, no test did.
  The module now clears the root's style on first paint. Look at the screen before calling a view done.
- **Hosts move; probe the current address.** The C-ID site moved from c-id.net to c-idsystem.org (ASCCC), its data on
  data-c-idsystem.org with no `www`. A 2025 training deck named the new host; WebFetch read the site's own links; the
  sandbox proxy refuses the data host, a runner reads it. `/descriptors/final/csv` hashed the same twice, so it is the
  `authority_tables` baseline.
- **The generator check runs on every branch you push, not only the main one.** #2289's lints went red on a stale
  dependency map (the probe's URLs are read edges) because the check ran on the other branch only.
- **A vault check that reads the tracker's `main` goes red until the tracker PR merges.** CPLBrain#411's coverage
  measured card 5's premise against `main`, which lacked the CR view; order the merges and re-run once.
- **Decision lock is two things.** Doctrine routed re-key windows and migrations to Sam's reply; the permission check
  refuses data writes it cannot tie to his approval, and refused this session's commit of the new auto-mark rule as
  Self-Modification. The rule change and any allow-list growth need his explicit word; the check is right to ask.

## S433 SkyCoffeeberry (2026-10-20): the ENVR pairs queued, the quarterly comparison on a cron, the CSR lane compacted

- **A merge a session can see is still a reviewer's call.** The two ENVR pairs left by the forestry window (Dendrology
  beside Wildland Trees and Shrubs (Dendrology); Silviculture beside Silviculture and Fire Ecology) went to
  `kb/_merge_candidate_queue.py` as a new `surfaced` lane: a pair a card or a receipt put side by side, recorded with
  where it came from and no named survivor, so the rule proposes one. The queue writes nothing (ruling 6, 2026-09-05).
- **A test that reads "the newest" output directory breaks the day a second kind lands beside it.** The queue test read
  `sorted(os.listdir(...))[-1]`, and `2026-10-20-forestry` sorted after `2026-09-05`; it now picks the newest Welding
  queue by its `discipline` field.
- **The baseline for a source the sandbox cannot reach comes from a runner's job log.** `get_job_logs` with
  `return_content` and a tail long enough to pass the post-job cleanup (50 lines) returned the `PROBE` line with the
  handbook PDF's hash; `kb/reference/csr_quarterly_baseline.json` records it with the run and job ids. A comparison
  that reads a page's own hash would flag every reload, so the verdict reads the edition and the PDF's hash only.
- **A routine that finds a change should read red.** `--compare` exits 1 on `changed` and 0 on `unread` or
  `no_baseline`, so the quarterly run is green when the handbook holds and red when it moved, and the step summary
  says a session opens the card.
- **A lane over budget moves its applied rulings, not its NEXT.** The CSR lane passed 20 KB (22,013); Sheet 99's six
  applied rulings moved verbatim below, and the lane keeps a two-line pointer (12.9 KB).

### Sheet 99's rulings as the lane carried them (moved verbatim, S433)

#### RULED on Open Asks Sheet 99 (Sam, 16:37Z 2026-10-19, all six his own call; `cpl_memory` `sam-sheet-99-rulings-2026-10-19`)

1. ✅ **settled** (S427): complete means confirmed, on the authority rule, in no collision (the pair as built). The
   pair as built counts a cohort's confirmation beside a person's (`isConfirmed` reads the stamp, not who made it), so
   with ruling 2 on, the words on the headline and the Commons row say *confirmed (by a person, or by the nightly
   procedure where the code is the authority's own)*; a code this reference minted still waits for a person.
2. ✅ **on** (S427): `kb/_csr_confirm_authority.py`, run nightly at 08:17 UTC by `csr-confirm.yml` (governance DR-04).
   It confirms a pick whose code is the CCN subject code or one of the C-ID subject codes, that no person has confirmed,
   and that no finding names except the two that corroborate (`cs7_unreviewed`, the state it clears; `cs4_aligned`,
   the alignment it rests on), under `csr-confirm-authority@bot`, as the tab's own save would write it: a fresh read
   first (a live code row, whoever wrote it, holds the save), the receipt under `kb/csr_out/confirm/` before the insert,
   duplicates ignored; `--undo` is one delete by the cohort and clears the seed's stamps. The offline plan on
   2026-10-19 names the thirteen: Anthropology, Astronomy, Communication Studies, Economics, English, History and
   Mathematics on CCN; Chemistry, Earth Science, Engineering, Geography, Philosophy and Physics/Astronomy on C-ID.
   ✅ **The first run landed** (2026-10-19: preview run 39331625751 listed the thirteen, none held; the `on` run
   39332576973 inserted all thirteen at 22:09:21Z, receipt commit `2ef70839` under `kb/csr_out/confirm/`; read back
   live: 13 rows under `csr-confirm-authority@bot`). The cron carries it from here; the daily sync folds the rows
   into the seed, so the Commons row reads 122 by a person and 13 by the procedure after the next daily run.
   `tests/csr_confirm_authority_test.py` (26) guards the selection, the receipt-before-write and the undo.
3. ✅ **agab** (S427, the re-key window of 2026-10-19): Agricultural Business and Related Services takes AGAB (the
   pick under `csr-s427@bot` with the ruling in its note, `kb/receipts/csr_agab_pick_2026-10-19_s427.sql` through
   `supabase-migrate.yml`, run 39333423480, both rows live 22:15:43Z under `csr-s427@bot`; the seed edited to match); AUTB M1006 Supervision and Management in Agriculture is
   AGAB M1006 (kept number) with the discipline Sam's own 2026-07-13 curation row names, under
   `kb/_agab_one_remint.py` (ten gates), receipt `kb/agab_remint_out/2026-10-19/alias_map.json` registered in
   `kb/alias_chain.py`, the post-apply chain run (promotions, crnc mirrors, the re-seed, the authority seed, the
   row audit: `subject_collision_signal` 113 to 114), SkyView's layout re-keyed and its payloads rebuilt. The
   scan reads 0 collisions, 146 canonical codes and 26 umbrella codes. The tab's SUBJ check learned the ruled
   shape: a family code one MQ discipline is canonical on while the umbrellas declare it is shared by design
   (`tests/csr_shared_family_code.test.js`). **Live steps after the merge:** dispatch `supabase-rekey.yml` with
   `alias_map_path=kb/agab_remint_out/2026-10-19/alias_map.json` (the one live row keyed to AUTB M1006, Sam's
   discipline row, follows the id), and read the pick back under `csr-s427@bot`.
   ✅ **AUTB M1071 Import Body Customizing returned to Auto Body Technology** (Sam, [Open Asks Sheet 101](https://claude.ai/artifact/5EiqK5XHMrTA4MubpAqyLT)
   card 1, 22:38Z 2026-10-19, his own call: autobody; `cpl_memory` `sam-sheet-101-ruling-2026-10-19`). His 2026-07-13
   curation row had set its discipline to Agricultural Business and Related Services too, while its title, its TOP
   (0949.00 Automotive Collision Repair) and its two members (Body Panel Customizing, Auto Body Technology at Cerritos;
   Import Body Customizing, Automotive Technology at Victor Valley) read auto body; a human-sourced row is never
   superseded by a session's inference (Rule 8), so it was his card. One discipline field, no re-key: the record and the
   overlay say Auto Body Technology (receipt `kb/receipts/csr_m1071_autobody_2026-10-19_s427.json`), his row updated
   under his own email with `reviewed_at` set to the ruling, and the AGAB pick's cohort note saying how he ruled, through
   `kb/receipts/csr_m1071_autobody_2026-10-19_s427.sql` (guarded UPDATEs, before-values in the header;
   `supabase-migrate.yml` run 39339086222 applied it, status 201, receipt commit `f3a5b6da`; read back live 23:14Z:
   his row reads Auto Body Technology at 22:38:25Z under his email, the note names Sheet 101). Agricultural Business
   carries AGAB M1006 alone; the row audit's
   `subject_collision_signal` reads 113 (114 before), the scan 0 collisions and no row off its code.
4. ✅ **sitting** (S430): Jev proposed a C-ID family for each of the 404 AGRI identities twice (runs 39352507898 and
   39353307914, 0 errors each), read from the job logs because the artifacts sit on a blob host the sandbox refuses:
   `kb/jev_agri_families/2026-10-20.json`. The two sittings agree on 397 of 404; 229 stay AGRI both times. 56 passed
   the gate (same family both times, both at 0.9 or above). **Sam, Open Asks Sheet 103, 01:49Z 2026-10-20: "Confirm
   the 44"** (the 56 less ten forestry courses and two wine-appreciation courses, marked `second_look`). Applied in one
   window: `kb/_agri_family_remint.py`, receipt `kb/agri_family_remint_out/2026-10-20/alias_map.json` in ALIAS_MAPS,
   stamps `_agri_family_remint_from`: AGPS 19, AGEH 10, AGMA 7, AGAB 4, AGAS 4 (39 kept their number, 5 gap-filled),
   each record's discipline unchanged; kb_curation re-keyed by `supabase-rekey.yml` after merge. The twelve
   `second_look` stay on AGRI, a discipline question for the Forestry/Natural Resources row. Two findings the report
   names: AGRI M1093 Fertilizers & Plant Nutrition is merged into FDNT M1014, and AGRI M10AL Management Accounting for
   Agriculture carries Auto Body Technology on its record (the overlay reads Agriculture).
   kb_curation re-keyed live by `supabase-rekey.yml` run 39362668144 (S431, 03:08Z): read back, no row on an old id,
   23 rows keyed and 8 `merge_into` pointers on the new ids.
   **Sam, Open Asks Sheet 104 (https://claude.ai/artifact/5rzvgKxmPpmDJfUiRbDrRo), 03:31-03:32Z 2026-10-20, both his
   own call as proposed (`cpl_memory` `sam-sheet-104-rulings-2026-10-20`): "move-ten"** (the ten forestry courses
   the sitting set aside re-key from AGRI to ENVR under Forestry/Natural Resources, Shasta's three AGNR-filed and
   Sierra's AGRI-filed ones included; five of the ten held an Agriculture discipline from the TOP division alone)
   **and "agpr"** (the four wine courses on AGRI, Wines of France, Wines of Italy, Wine Service and Hospitality and
   Beginning Wine Sensory Analysis, re-key to AGPR under Agricultural Production). **Applied (S432, #2276)**:
   `kb/_forestry_wine_remint.py`, receipt `kb/forestry_wine_remint_out/2026-10-20/alias_map.json` in ALIAS_MAPS, stamps
   `_forestry_wine_remint_from`: ENVR 10, AGPR 4 (13 kept their number; AGRI M10AX gap-filled to ENVR M10EO). Each
   record's discipline follows its code, and its TOP-derived `discipline_source` is cleared to the manual state
   (`_kin_pe_pass2.py`'s `flip_disc`), so the TOP gate never holds the ruling out. 9 curation keys and 15
   `merge_into` pointers re-keyed; kb_curation re-keyed live by `supabase-rekey.yml` after merge.
   Two findings it surfaced: ENVR M10CM and M10DI already merge into the moved parents (ENVR M1069, M1103), so the
   merge candidates left are ENVR M1009 *Dendrology* with ENVR M1064 *Wildland Trees and Shrubs (Dendrology)*, and
   ENVR M1025 *Silviculture* with ENVR M10OP *Silviculture and Fire Ecology*. And two forestry identities the
   sitting never named stay on AGRI while merged into ENVR M1069: AGRI M10SY *Forest Surveying* (Agriculture from
   `top_division` alone) and AGRI M1104 *Introduction to Forest Operations* (4 members).
5. ✅ **hide** (S427): the Validate column, its control and the *Validated* filter left the Reference view; the data
   (`validated_at`, `validated_by`) stays in the store, the seed and the sync, and the stage returns at the
   faculty-published moment. The Progress card's foot now names the nightly procedure instead of the unused stage.
6. ✅ **rename** (S430, one window): the eight Title 5-numbered names and the cut-short one take `mq_sections.json`'s
   `index_name` verbatim, *(DSPS)* and *(ESL)* included (Sam's reply: *"Rename as the handbook spells them"*).
   `kb/_mq_title5_rename.py` renamed 355 whole strings across eight stores (the identity files 329), dropped the
   now-redundant `index_name`, and filed the nine under `renamed` in `kb/discipline_aliases.json`, which
   `kb/_alias_canon.py` resolves for the inference passes and the CSR's chips never read. The four live `kb_curation`
   rows (Sam's ESLN and BSKL picks keyed `_CANON_SUBJ4::<old name>`, the discipline rows on BSKL M9001 and M9252) moved
   by guarded UPDATE, `kb/receipts/mq_title5_rename_2026-10-20_s430.sql`, before-values and rollback in it.
   `tests/mq_title5_rename_test.py` (7) fails on an old spelling in any store.

S425 recorded them at context EMERGENCY; S427 executes them in this order (1, 2 and 5 landed together as one code
change; 3, 4 and 6 are data windows and follow). The six cards left the vault builder in CPLBrain#395.

## S432 SkyYerbaSanta (2026-10-20): Sheet 104 applied, the forestry stragglers asked, the probe read twice

- **A ruling that moves a course out of an umbrella moves its discipline with the key, and the TOP source goes too.**
  Sheet 103's family codes sat inside the Agriculture umbrella, so S430 kept each record's discipline; Sheet 104's
  ENVR and AGPR are other MQ disciplines, so `kb/_forestry_wine_remint.py` sets the discipline from the target code and
  clears `discipline_source`/`_confidence`/`_inferred_at` to the manual state (`_kin_pe_pass2.py`'s `flip_disc`).
  Left as `top_division`, eight of the fourteen would have been held out of the fold by the TOP gate even though a
  curator ruled their home (#2276).
- **A card names the set it measured; the re-key finds the rest by their pointers.** Two forestry identities merged
  into Forest Ecology (AGRI M10SY, M1104) were never in the sitting's `second_look`, because Jev placed them in AGPS
  below the gate. After the window they sat on AGRI under an ENVR parent. List what points at each moved id
  (`merge_into`) and what each moved id points at before writing the receipt. Of the four "same-subject" ENVR courses
  the handoff queued for merging, two already merge into the moved parents.
- **The CSR seeder drops the overlay's provenance fields.** `kb/_seed_canonical_subj4.py` (post-apply step 2) rewrote
  `discipline_canonical_subj4.json` without `_notes_by`/`_notes_at` (13 disciplines) and the top-level `_synced_*`;
  the cron's `_apply_canonical_subj4.py` puts them back, so the commit restores them from HEAD to keep the diff to the
  re-key alone.
- **A permission-check denial converts a proceeded-on call into an ask, the same turn.** The stragglers' apply was
  refused; the dry run stays committed, the card on Sheet 105 asks instead of reporting, and the lane carries NEEDS
  SAM 9. Proceeding means the session acts; when it cannot act, the card cannot say it did.
- **A fixture with fixed stamps needs a fixed clock.** `tests/commons.test.js` held `NOW` for its unit checks while
  `boot()` rendered on the real clock, so the "inside 36 hours reads current" check failed at 05:47Z on 2026-10-20,
  36 hours after its stamp, on every branch. The test now pins the window's `Date` to `NOW`.
- **The quarterly probe reads the same twice.** MQ page 200 and edition 19 both runs; c-id.net 403 to a runner;
  www.data-c-idsystem.org does not resolve. The comparison mode needs a C-ID source a runner can reach.

## S431 SkyChaparral (2026-10-20): the 44 live, Sheet 104 asked and ruled, the handbook's live page, the probe

- **A card's measured context can overturn its own first proposal; measure before writing the rec.** The wine card
  started as Culinary Arts (CULN holds French Wines and Italian Wines). Counting where the two colleges' own wine
  courses sit (Santa Rosa 15 of 24 and Canyons 5 of 9 under AGPR) moved it to Agricultural Production, which Sam
  took. Count the colleges' siblings, not only the title twins.
- **Check `discipline_source` on a set the fold placed.** Five of the ten forestry identities carried Agriculture from
  `top_division` alone, and their `_subj4_fold_from` stamps show each sat on its college's forestry code (ENVR, FNR,
  NRM) before the fold. The 2026-07-16 ruling holds such a row out of the fold; the AGPR wine identities rest on TOP
  too (38 of 61). A curator's ruling is what corroborates the home.
- **A fixed sleep in a jsdom test is a load test in disguise.** `sierra_one_cobi.test.js` waited 20 ms for a
  hashchange and failed 5 of 16 runs under eight-way load; polling for the checked state (up to 2 s) failed 0 of 16
  (#2271). Reproduce with concurrent copies before calling a failure a flake.
- **Rehearse a known merge conflict while CI runs.** #2270 shared files with #2269; a trial merge in a worktree found
  the three conflicts, the resolution and a clean `check_generated.sh` before #2269 landed, so the real merge took one
  push.
- **WebFetch reaches cccco.edu from the sandbox where Python cannot.** It found the live Minimum Qualifications page
  (19th edition) and confirmed the old `.../Curriculum/MQ-Handbook` link answers 404 (#2273). The runner probe
  (#2274) still owns the unattended quarterly read.
- **A coverage check passes for a card whose lane carries no marker yet**: CPLBrain#404 went green against a tracker
  main without NEEDS SAM 8. Merge the lane PR first anyway, so the record never shows a sheet asking what no lane asks.

## S430 SkyLupine (2026-10-20): the AGRI sitting, Sheet 103's 44 re-keyed, the nine MQ names renamed

**Ruling 4 (sitting).** Jev read the 404 AGRI identities twice (runs 39352507898, 39353307914; 0 errors). Each run's
artifact sits on a blob host the sandbox refuses, so the sitting is read from the job logs; the first log printed the
word `plain` for any non-zero noul (a probability), fixed in #2268 with a test that fails on the old line. The runs
agree on 397 of 404; 56 passed a both-runs 0.9 gate; Sam confirmed 44 on Sheet 103 (forestry and wine appreciation held
back, since Forestry/Natural Resources is its own MQ discipline). `kb/_agri_family_remint.py` re-keyed them in one
window (#2270): every gate passed, the receipt in ALIAS_MAPS, kb_curation by `supabase-rekey.yml` after merge.

**Ruling 6 (rename).** Sam's reply was *"Rename as the handbook spells them"*, so the nine names took `index_name`
verbatim, parentheticals included (#2269). Text replacement of whole JSON strings kept the large identity files
byte-stable outside the changed values; the old spellings go to `renamed` in `kb/discipline_aliases.json`, which the
inference passes resolve and the CSR's chips never read (a chip would have shown the broken names).

**Lessons.** A gate measured on self-agreement across two runs is the only calibration a new Jev question has; set it
before the ruling and say so. A generated worklist that reads a nightly payload shows a transient false state after a
source rename; commit what CI checks and dispatch the daily run after merge. Fold-verify's 7 `re_key` (CNSC, COMP,
FCSH, HLTH, ITIS, OSHA) are discipline drift outside this run, recorded in #2270.

## S419 SkyCottonwood (2026-10-18): step 1, the shared Progress module (#2237)

- **What moved, what stayed.** `commons_progress.js` owns the renderer (run status, headline pair and bar, whole
  measure, milestone line, parts grid, side column), `readStatus()`, the milestone arithmetic, `partView()`,
  `wholeFacts()`, `since()`, the status words, the time words and the Progress CSS. `program_requirements.js` kept its
  definitions (`MILESTONES`, `PARTS`, `WHOLE`, `TO`, `SOURCE`), its live reads and `progressContext()`, gained a
  declarative `HEADLINE` and a `PROGRESS` spec (its words), and delegates `viewProgress()`. The host lends `section()`,
  `goControl()` and its call-card helpers through one object, so a count opens the tab's own list and the sections
  remember like their neighbors'.
- **The guard was the first host's own suite, unchanged in what it asserts.** The 417 checks of
  `tests/program_requirements.test.js` passed with the module loaded first; the harness loads the module before the
  tab's script, three CSS regexes read the module's source, and the status path moved. The class names kept their
  `prh-pg-` prefix on purpose: a rename changes nothing a reader sees and would have loosened the guard (SkyView keeps
  its `ccr_atlas_*` paths the same way). `tests/commons_progress.test.js` (30 checks, floored by hand) guards only what
  a shared module can get wrong: a second host's classes substituted into a style of its own, a spec with no whole
  measure drawing no band, a failed read saying so in both headline numbers, `readStatus` refusing a file with no
  `written_at`, the host tab drawing its other views when the module's lazy load fails, the boot order in both HTMLs.
- **A shared module fails soft or it fails the tab.** `CPL_TABS.loadScript` calls back on error as on load, so a 404 on
  the module would have reached `program_requirements.js` with the global undefined and killed the tab at load. A
  nine-line stub answers every helper safely and draws one line on the Progress view; the other four views read as
  usual.
- **CSS with the host's classes substituted, one style per host set.** The module's CSS names the host's section
  pattern (`prh-sec`, `prh-sec-b`, `prh-sec-t`, `prh-sec-label`) and its quiet text as `%name%` marks, filled from
  `h.classes` at injection under `cpg-css-<sec>`; with the defaults the injected CSS is byte-identical to the host's
  former block. A second host passes its own names and gets its own style.
- **One status file per project.** `kb/queue_status.json` became `kb/status/program-requirements.json` with a `project`
  field; `scripts/queue_status.py --project` names another project's file; checkpoint step 12, the a11y seed comment,
  the lane files and the dependency map followed (a seed records the read `commons_progress.js` makes on the host's
  behalf, which the literal scan no longer sees). The deploy-time asset manifest covers every root-level `.js`, so the
  new module is cache-busted without a change.
- **The one-writer carve-out worked across three sessions.** Sam told S417 at 19:08Z: *"Commons looks good. Just make
  sure I can collapse each and we have a collapse all button."* S417 took the mock-up file and artifact (version 4,
  #2239), S418 closed its competing record PR unmerged and named the branch to lift from, and this session recorded
  the ruling in the lane, section 11 and the status file with the time corrected (19:08Z, not 17:31Z) and the one
  memory row cited (`sam-approves-commons-mockup-collapse-2026-10-18`). Read the queued messages before writing.
- **Next, step 2.** Each reference's Progress view drawn from the module, in the ruled order (Exhibit on the CER tab,
  then Course, CR, Subjects), each with its definition of complete on a card for Sam and a status file under
  `kb/status/`. The CER tab's host object must lend a section pattern with its class names, a count control that opens
  its own lists, and call-card helpers (or none, with `callRecords` returning null and `callAnswered` reading the
  sheet's store); the collapse pattern Sam asked for belongs in step 3's Commons row component.

## S417 SkyManzanita (2026-10-18): the Commons tab, on Sam's word (step 3 before step 2)

- **The mock-up's figures reproduce from the committed files alone.** Every number the mock-up showed, measured
  against live tables at 16:35Z, came back from a committed file: the harvest's record files and
  `coci_programs_data.js` give the Program Requirements pair; `kb/exhibit_audit/latest.json` carries "left MAP" (the
  raw export is gitignored for PII); the auditor's `latest.json`, the CR worklist's `_stats` and the SUBJ4 seed carry
  the rest. So the builder needs no key and runs in the daily workflow after the steps that write those files.
- **A figure's stamp is the file's own field, never the clock.** The auditor's `_generated_at`, the fold report's
  `_generated_at`, the seed's `_synced_at`, a receipt's `at` (hyphens in its time part: `17-37-29Z`, normalized). The
  CR worklist carries no stamp, so its "last changed" comes from git, which a shallow checkout cannot answer; the
  builder writes null there and the row reads *Could not be read*.
- **A cohort's stamp is the reviewer's `@bot` suffix, never the day:** 2026-07-07 holds 258 person stamps beside the
  158 preseed ones. Splitting by day would have misread the Exhibit pair.
- **"No words on the cards" is the prose, not the labels.** Sam waved the definitions and the where-it-stands
  narrative; a known issue still needs its words and its owner to mean anything, and the test behind a count stays as
  a chip. The lane keeps the definitions for the cards each Progress view will carry.
- **A screenshot of the served monolith waits for the load event.** The container's proxy fails every outbound
  request, so `domcontentloaded` plus a selector wait timed out while `load` plus a function wait rendered the tab in
  two seconds; the a11y sweep's own server does the same.

## S423 SkyLaurel (2026-10-19): the four run logs

- **The tab was already wired for them.** `kb/_build_commons_status.py` sets each row's `status_file` when the file
  exists and `commons.js` reads it, so step 2 was content and a checkpoint line, no code. Each log's next step is its
  lane's NEXT, written in plain words because the validator refuses markdown and glyphs.
- **Stamp only what moved.** A run log that a checkpoint restamps without work behind it reads fresh and says nothing;
  step 12 refreshes the logs this run touched and leaves the others to age into *stale*, which is the true state.


## S425 SkyMadrone (2026-10-19): the first per-reference Progress view, Subjects (#2260)

- **The host contract held for a second host in sixty lines.** `canonical_subj4.js` lends a `section()` on a
  `<details>` with its own classes (`cs-sec`, remembered in `localStorage`), a `goControl()` whose targets are the
  table's filters, the SUBJ check or a section of the view, and call helpers that answer nothing (a call is answered
  on its sheet). The module needed one addition, an optional `more(x)` word per part for the card's procedure; the
  first host's 417 checks stayed as they were, and a shared CSS rule split into two so the first host's regex still
  matched its own line.
- **A check must know every sharing by design or it over-reports.** The tab's SUBJ check listed six ruled sharings
  as collisions (the five agriculture family codes both umbrellas declare, the FTVE fan-in) beside the one real one,
  and the dash would have said seven. The scanner's CS2 knew the fan-in; the tab's check knew only the alias file.
  Both exceptions now come from the entries themselves (`umbrella_codes`, `fan_in_with`), as
  `methodology-subj4-consumer-semantics` says every consumer must.
- **The pick's reviewer is the code row's.** The sync and the overlay took the latest row across fields, so a note
  a cohort wrote in July overwrote the person who picked the code in May on eleven entries, and the Commons row read
  "111 by a person, 11 by a session cohort" of 122 picks a person made. A field's provenance stays with the field.
- **A pattern written for the common case silently dropped a third of the file.** The C-ID descriptor regex had no
  room for the " X" suffix (172 of 495 descriptors, 17 of 65 subjects), so the chips never saw ADS, the three
  agriculture families, WELD or FIRE. Count the file's rows against the index's rows before trusting either.
- **`hidden` loses to `display:flex`.** The toolbar stayed on screen under Progress until a `[hidden] { display:none }`
  rule outranked the toolbar's own display; the served page showed it, jsdom could not.
- **The deep link behind a count is the hash's second segment.** `#canonical-subj4/pre_seeded` opens the tab (tabs.js
  routes the first segment) and the tab applies the second as a filter, a view or the check; the Commons builder
  writes the same addresses into its `open` fields, so both dashes point at one list.

## S427 SkyMadrona (2026-10-19): Sheet 99's rulings 1, 2, 3 and 5 applied; the sitting for 4 built

- **A ruling names a record; the store may count another.** Sheet 99 card 3 named AUTB M1006 (Supervision and
  Management in Agriculture) as Agricultural Business's one identity, and the seed's count of one came from AUTB M1071
  (Import Body Customizing), whose record carries that discipline while M1006's record said Auto Body. Both carry Sam's
  own 2026-07-13 discipline row, three seconds apart. The ruling moved the record it named; the other is a card, never a
  silent correction (Rule 8), and the Reference view says one row sits off its code, which is true.
- **The tab's shared-by-design rule had to learn the ruled shape before the re-key.** AGAB is declared by two umbrellas
  and is now Agricultural Business's own; the old rule (every owner an umbrella, none canonical) would have replaced the
  one collision it closed with a false one. Two disciplines canonical on one code stays the collision.
- **A known issue with nothing in it is not an issue.** The Commons row's collisions issue at zero failed the no-bare-zero
  rule; the builder drops it and `facts.shared` keeps the measure. The test finds the issue by its words, never by position.
- **"No finding names" needs its two corroborators spelled out.** The scan names every unconfirmed pick (cs7) and the
  aligned ones (cs4_aligned); read literally, the confirm procedure would have confirmed four of thirteen. The procedure
  says which rules corroborate and which hold.
- **Parallel Bash calls share one shell and one working directory.** A `cd` in one call moved the other mid-command: a
  tracker `checkout -B` ran in the vault and reset its branch to main (recovered from the pushed remote). Use `git -C` and
  absolute paths, and never two `cd`s in one turn.
- **A merged claude/* branch is deleted, and the stale tracking ref makes `--force-with-lease` refuse.** Fetch the ref or
  drop it, then push plain.
- **A ruling that changes a human's own row changes it under his email, with the ruling as its time.** Sam answered
  Sheet 101 at 22:38Z (autobody): AUTB M1071's discipline row is his 2026-07-13 row, so the write is a guarded UPDATE
  pinned to the before-values (value, email, `reviewed_at`), keeps `map@rccd.edu`, sets `reviewed_at` to the reply's
  stamp so the daily sync takes it, and names the sheet's store as its source. The receipt's header carries the
  before-images and the rollback; the session's own JSON receipt carries the identity file and overlay before/after.
  A cohort note that said the identity waits on his card is updated in the same file, so no store keeps the old state.

## S435 SkyToyon (2026-10-20): the 110 strays, sorted by whether the answer can be checked

- **A stray splits two ways.** 9 of the 110 codes (12 identities) already carry a discipline, Foreign Languages. Their
  answer is a code, which the umbrella's 2026-06-09 model gives: one code per language, FL plus two letters where no
  authority code exists. The other 101 carry none and are the curator's (Sam, 2026-09-08).
- **A stray has no prefix-mates, so the blank worklist's signal is empty for it.** `kb/_csr_stray_triage.py` reads the
  colleges' own signal instead: for each member course, the discipline that college's other identities on the same
  local subject carry. 15 codes pass 85% of at least 10 votes. The titles agree on 8 (79 identities) and disagree on
  3 (SGNG's sign-making reads Work Experience, CMPE's drone course Computer Information Systems, RTVF's radio course
  Film); 4 are a single course each. A vote that passes the gate still needs the second signal.
- **The re-key went on a card.** S432's apply of the same shape was held by the session's permission check, and one
  window can carry the forestry stragglers, the twelve FL re-keys and the eight blanks together. Open Asks Sheet 106,
  cards 1 to 3; the FL dry run (`kb/_fl_stray_remint.py`) passes every gate.

## S436 SkyTanbark (2026-10-20): the Exhibit Progress view, the third host

- **One definition, two readers.** The view reads its headline pair from the Exhibit row of `kb/status/commons.json`
  instead of recomputing it in the browser, so the Commons row and the view cannot disagree. The builder carries the
  auditor's tallies the cards need (`map_titles`, `unclassified`, `left_map`, `below_80`, `below_60`); the 2 MB audit
  and the 1.9 MB title map stay out of the browser.
- **A host with its own state lends it through an api.** The Exhibit tab is a closed IIFE of 5,700 lines; the
  definitions live in `exhibit_progress.js`, and the tab hands over its procedures report, its three worklists and its
  lane switch. The worklists load late, so a card that needs them reads *Could not be read (still loading)* until the
  tab re-renders, never a zero.
- **The third host needed no change to the module.** The contract held: a spec, a context, a host lending
  `section()` and `goControl()`.
- **A draft PR runs no CI here.** `get_check_runs` read zero runs on #2285 until it was marked ready; never park in draft.
- **`npm test` does not finish inside a 10-minute sandbox call**, even in four background shards. CI's sharded `test`
  check is the gate; locally, run the changed tests and the ones that pin the view.
- **A gap-fill must not take a slot SkyView still draws.** SkyView's layout is hand-built and keeps points under ids
  an earlier re-mint vacated, so the first Sheet 107 apply drew six ids twice and the lints job failed. The allocator
  in the three Sheet 107 scripts now treats `er.ever_minted_ids()` and `er.skyview_ids()` as taken, and the window
  was re-applied from the pre-apply files: no reused slot, no duplicate.

## S544 SkySombrero (2026-11-02): the List norms' steps 1 and 2 in the engine

**What shipped.** #2673, the engine's `suggest` slot and the visit's changed set. CR's rung proposals read *Suggested groups*, with Confirm the group; Subjects' open picks read *Suggested picks*, with Confirm this pick. #2675, every filter word carries its count, `counts()` for a tab that already counted (Program Requirements, Courses), `uncounted(id)`, and *Selected* on every List. #2674 rebuilds `kb/status/commons.json` in the nightly procedures run, so the Exhibits tile agrees with Review the same night (it had read 351 held against Review's 1). The norms note records both steps; step 3, bands from a spec's `groupOf(r)`, is next.

**A suggestion never proposes a call a person must make.** The Subjects fixture offered Agricultural Business the code AUTB, which another MQ discipline owns. Confirming it would have written a collision through the same path as every other confirm. The open pick in a collision now gets no suggestion. The general rule: before a machine proposes a fold, run the refusal the write itself would apply (one code, one MQ discipline), and leave anything that fails it to the person.

**A count is honest only when its data has arrived.** S343's rule (a failed read is never an empty list) reaches filter counts: *Suggested folds (0)* before the AI sort's file arrives reads as "no suggestions". `uncounted(id)` leaves the word bare until the data is read, and a test boots the Exhibits List with that file unread to pin it.

**A test that finds a control by its exact label breaks when the label gains a number.** Seven suites found filter words with `txt(b) === t`. They now match the label with or without a trailing count. Match the label's stable part, not its whole text.

**Run a long local test loop in its own worktree.** A loop over 33 suites ran in the checkout while the session switched branches under it, so its results could not be trusted and it was stopped. `git worktree add` in the scratchpad, with `node_modules` linked, keeps the loop on one commit.

**Never put an unmeasured number in a PR body, even as an example.** #2675's first body showed *Needs a decision (156)* and *Decided (30)* as examples; neither was measured. It was corrected to *(n)* within minutes. An example figure in a PR reads as a finding.

## S545 SkyWhirlpool (2026-11-02): the List norms' step 3, and Exhibits on the engine's slot

**What shipped.** #2679: step 3 was half done (#2670 had built the engine's read-only `bands` hook for the Courses List
and made `listRows` filter before it sorts), so the engine gained `bands.order(key, members)`, the text bands sort by
when the key is an internal one, and the CR List bands its 2,344 wordings by group: 156 bands of two or more, each named
and ordered by the group's reference, a group of one under *Single wording*, read only. #2680: the Exhibits List's
spelling-twin folds and changed set moved onto the engine's suggestion slot, so all three steps have landed and every
folding List takes suggestions, the changed set, filter counts and bands from the engine.

**Order bands by what the reader sees, not by the key.** The CR group key is a normalized string ("engine performance");
ordered by key, a band named *Engine Performance (3 to 5 units)* sorted before *4 hours in Welding*. The test pins the
reference order with exactly that pair, and fails when `order` is removed.

**Two keys that read alike need two places.** Ranking band keys with the shared text ranker gave keys equal under the
collation one rank, so their rows would interleave and the band header would alternate. Each key now takes its own
place, ties broken by the raw key.

**Read a handoff's next step against the code before building it.** Handoff 545 described step 3 as "so the Courses List
stops hand-rolling its M-ID bands"; the Courses List had used the engine's hook since #2670 (handoff 544 said "half
done"). The remaining work was CR's bands and the norms note's bookkeeping.

**Two PRs that edit adjacent lines of one table wait for each other.** The Exhibits code went on a sibling branch while
#2679 ran CI; its docs waited for the merge, because both edit the norms note's *Where each List stands* rows.

## S552 SkyCentaurus, 2026-11-02: the CPL Commons, named twice in a quarter hour

- **A working name is a working name.** Sam opened with *CCC Commons* and, on seeing it on the mock, moved to *CPL
  Commons* (*"less of a wholesale take over of the system"*). Everything that carried the first name (the mock, the
  lane, the vault README, the memory row, the sheet) was renamed in the same hour; the cost was low because each
  surface named its source. A name on a shared surface (the side menu) waited on his word, which is why it is a card.
- **Play the whole's name through the cards.** The eight cards became *Common Programs, Common Subjects, Common
  Exhibits, Common Credit Recommendations, Common Courses, Common Credentials, Common Outcomes, Common Skills*: the live
  tab's row pattern (Common Exhibit Reference, Common Course Reference, Common CR Reference, Common Subjects Reference)
  with "Reference" dropped because the Commons says it. "Register" was retired. The focus elements (the decisions band,
  the sort note, the skip link, the footer) carry the same words, so the page reads as one vocabulary.
- **A hand edit on the canvas shows up as a stray style.** The Exhibits artboard's root `main` had gained
  `position: absolute; left: 13px; top: 16px` between publishes, the trace of a drag in the editor on a fill page; the
  republish dropped it and said so. Read the canvas again before every publish; the view context's `edits` count says
  when someone touched it.
- **A look is a token layer, even when it is someone else's.** The CPL Commons tab is the one COBI tab in Malone's
  look (Sam, Sheet 158). The palette went in once, as `--cmn` tokens scoped to `#tab-commons`, every rule below it
  reading a token; the dark theme maps each role onto a First Light dark token instead of a second palette. The
  "no raw hex in the injected CSS" test kept its teeth by reading the rule block alone and a new check reads the token
  block, so a hex can live in exactly one place.
- **A card needs a session side and a machine side.** The status file gives a card its pair and stamp; the run log
  gives it *Your decision*, *Recently* and *Next*. A reference with no run log still draws, with its machine stamp as
  Recently and no Next, which is the truth of it. The three building references got `building` rows rather than a
  place in `rows`, because the builder's test holds `rows` to a definition of complete they do not have yet.
- **The sheet builder's test needs a fixture per predicate.** S551's Sheet 157 predicate shipped without one, so the
  coverage test read 29 of 30 before this run touched it; both predicates now have fixtures and the test passes 30 of 30.

## Moved from the lane, 2026-11-02 (S552; the lane passed its 20,000-byte budget)

**Step 1 landed (S419, #2237, merged 19:28Z):** the Progress view the Program Requirements tab drew since S343 is
drawn by `commons_progress.js`, the shared module: the renderer, `readStatus()`, the milestone arithmetic, the shared
status words, the time words and the Progress CSS. A project brings a spec (its words, `MILESTONES`, `PARTS`, `WHOLE`,
a declarative `HEADLINE`, its read names), a context from its own live reads and a host lending its `section()`,
`goControl()` and call-card helpers; a host's classes are substituted into the CSS, one style per host; a spec with no
whole measure draws no band; a failed module load leaves the other views drawing. Nothing changed on screen:
`tests/program_requirements.test.js` passes its 417 checks with the module loaded first; `tests/commons_progress.test.js`
(30 checks) guards what only a shared module can get wrong. The status file is `kb/status/program-requirements.json`,
the first of one per common reference (`scripts/queue_status.py --project`); checkpoint step 12 names it. Lessons:
`docs/commons_lessons.md`.

**Step 2, the run logs (S423):** `kb/status/exhibit.json`, `course.json`, `cr.json` and `subjects.json` carry a session stamp, the lane's NEXT as the next step and no calls (nothing on any of the four waits on Sam); checkpoint step 12 names them, stamped with `scripts/queue_status.py --project <id> --stamp`, and refreshes the ones a run touched. A run log older than a week reads stale on the tab, which is true of a reference no session worked.

### Step 3's three Progress views (moved from the lane, 2026-11-02, S552)

**Step 3's first Progress view, Subjects (S425, cpl-project-tracker#2260).** Sam, 2026-10-19: *"Can you develop a
dash for CSR similar to the one you created for PR? Seems like each of our Commons consolidation projects should
follow the same process"*; his ask moved Subjects ahead of Exhibit, Course and CR in the ruled order. The tab opens on
Progress, drawn by the shared module from its own definitions (a card per step, the procedures under the cards, the
findings), and a count opens the table with its filter through `#canonical-subj4/<filter>`, the deep link behind a
count; the Commons row's counts link the same way. The second host proved the contract: a 60-line host object, its
own section classes, no change to the module but an optional second word per part. Lane:
[common-subjects-reference](common-subjects-reference.md).

**Step 3's second Progress view, Exhibit (S436, 2026-10-20).** The Common Exhibit Reference tab gains a fourth view,
*Progress*, first in its row; the tab still opens on Needs you (S413), so nothing a curator lands on moved. The
definitions live in `exhibit_progress.js`, loaded with `commons_progress.js` the first time the view opens. **One
definition, two readers:** the headline pair and the auditor's tallies come from the Exhibit row of
`kb/status/commons.json` (the builder now writes `map_titles`, `unclassified`, `left_map`, `below_80`, `below_60`), so
the Commons row and the view cannot disagree; the rest is the tab's live state lent through an `api` (last night's
procedures report, the Unclassified, No issuer and Merge confirms queues, the lane switch). Definition of complete,
carried from the Commons row: a title carries a review stamp, a person's or a procedure's cohort's (1,729 of 4,915).
Five milestones (every MAP title classified, the held titles decided, an issuer for every credential, the reference
matches MAP, every title stamped) and eight cards. A count opens the lane that lists it, and
`#credential-reference/<lane>` (progress, held, unc, noiss, merge, procs, all, industry; `needs` and `ref` name a view)
routes from the address; the Commons row's counts now link there. Guard `tests/exhibit_progress.test.js` (30 checks);
`npm run a11y -- cer-progress cer-progress-dark` passes. The third host needed no change to the module.

**RULED (Sam, Open Asks Sheet 107 card 4, 13:09Z 2026-10-20, and again on Sheet 108 card 4, 13:24Z, his own call:
keep).** The Exhibit Progress view stays as S436 built it: complete = a title with a review stamp (the Commons row's
pair), and the tab opens on Needs you.

**Step 3's third Progress view, CR (S437, 2026-10-20).** The Common CR Reference tab gains a view row, *Progress* and
*Worklist*; the tab still opens on the worklist's Needs a decision. The definitions live in `cr_progress.js`, loaded with
`commons_progress.js` the first time the view opens. **Complete changed unit:** a *wording* colleges wrote resolves to a
settled reference when a rung 1 to 4 rule places it or a curator's decision names it (confirmed or not a topic; deferred
and cleared settle nothing), so the Commons row's pair moved from two group counts (156 by rule, 30 decided) to one:
**459 of 2,344 wordings, 5,750 of 9,413 articulations** (408 by a rule, 51 more by Sam's 2026-09-20 sitting). The
builder (`row_cr()`) and the tab (`SETTLES`) apply one rule; the builder reads the committed receipts, and the view's
Curator decisions card says when the live table and the receipts differ. Milestones walk the head-heavy corpus: the
rules applied, the top 50, 100 and 250 wordings settled, every wording settled; You are here is the head (44 of 50; the
six left are the POST community-relations wordings, Criminal Court Process, Elective Course Credits and Engine
Performance I). Two new worklist filters back the counts, *No rule or decision* (1,885) and *Name to check* (37), and
`#cr-reference/<view or filter>` routes from the address. The tab had drawn inside its loading placeholder's inline
style (a dashed box, muted centered text) since it shipped; the module now clears it on first paint. Guards
`tests/cr_progress.test.js` (42) and `tests/commons_status_build_test.py` (77, a fixture for the settling rule);
`npm run a11y -- cr-progress cr-progress-dark` passes. The fourth host needed no change to the module.

**RULED (Sam, Open Asks Sheet 108 card 5, 13:24Z 2026-10-20, his own call: keep; `cpl_memory`
`sam-sheet-108-rulings-2026-10-20`).** The CR Progress view stays as built: complete = a wording a rule places or a
curator decides, and the tab opens on its worklist.

## S559 SkyAndromeda, 2026-11-03: the Common Course Reference takes the opened page, the last of them

- **Read the Commons' row, never recount.** The Course page reads `kb/status/commons.json`'s `course` row and its run
  log, as Exhibits' tiles do, so the S490 to-do (every tab agreeing with the Commons summary) holds by construction
  here. The three questions needed counts the row lacked, so the builder writes the auditor's six tag counts into
  `facts.tags` rather than the page fetching the 10 MB `kb/row_audit/latest.json`.
- **The auditor counts a tag once a card** (checked: the per-card set counter equals `stats.tag_counts`), so *cards free
  of a tag* = total less the tag's count is a sound row over the one denominator.
- **commons_page.js's links fall under 24px** in a row (`a` gets no min-height, its buttons do): a host whose rows link out
  (here SkyView, an external page) adds `a { display:inline-block; min-height:24px }` under its prefix. A host with no
  h2 above the page skips h1 to h3; COCI Lookup's header is a span, so the view adds its own h2.

## Moved from the lane, 2026-11-03 (S562; the lane passed its 20,000-byte budget again)

The per-reference opened-page paragraphs, verbatim as the lane carried them on 2026-11-03:

**The opened page, one renderer (S556, 2026-11-03).** `commons_page.js` (`window.CPL_COMMONS_PAGE.render(spec)`) draws
the mock's opened page for any reference: the progress line over its one denominator, *Needs attention* with an action
each and the team's next step, and the three question groups with every count over one denominator; an unread count says
*Could not be read*. First Light tokens (the Commons tab alone wears Malone's look). **Exhibits carries it** as its
**Progress** view, first in the views row, at `#exhibits/progress`, and the Common Exhibits card opens there; the tab
still opens on Review (Sheet 147). The headline is the Commons row's pair (Sam's keep, Sheets 107 and 108); the groups
read `credCounts()`, the Credentials tiles' own counts. The CER tab's S436 Progress view stands as kept. Guards
`tests/exhibits_progress_page.test.js` (41), a11y `exhibits-progress` and `exhibits-progress-dark`. **The CR Reference
carries it too (S556):** its Progress view draws the page first and the S437 milestones and parts under *Details*,
closed; the three questions are counted per wording from the worklist the tab holds (grouped, official number, statewide
line; units stated, units agree; two or more colleges, two or more credentials), and the card opens
`#cr-reference/progress` while the tab still opens on the worklist. Guard `tests/cr_progress.test.js` (54). **Subjects
too (S556):** the page over the 147 MQ disciplines with courses, with questions that fit a code (what it is called, whose
code it is, how it reaches the courses); the milestones and steps under *Details*, the procedures and findings below.
Guard `tests/csr_progress.test.js` (78), a11y `canonical-subj4-progress` (320 to 1440) and `-dark`.

**CPL Pathways too (S558, 2026-11-03):** the Program Requirements tab's Progress view draws the page first and the
dash (milestones, parts, the whole harvest, the calls) under *Details*, closed; opening a call opens Details. The
denominator is COCI's active program, the headline's own unit, and the three questions fit a program: where it is read
from (a college with a catalog address, with a reading procedure), what it requires (read, units add up, nothing
added), whether it matches the state's record (every course COCI lists placed, complete). A record on a program COCI
does not list never counts; a failed active read says *Could not be read*. `commons_page.js` loads on the first
Progress render. Guard `tests/program_requirements_page.test.js` (16); a11y `program-requirements-progress` and
`-dark` wait for the page and open Details.

**The Common Course Reference too (S559, 2026-11-03, #2720):** COCI Lookup's **Progress** view, first in its views row
(the tab still opens on the Courses List), at `#coci-lookup/progress`; the Commons card's third word, *Open Progress*.
It reads the Commons' own row (`kb/status/commons.json`, key `course`) and the run log it names, so its headline is the
card's pair: ready (the auditor's 0.85 or better) of the auditor's cards, 3,205 of 27,581. Needs attention: needs
repair, then the row's issues with who fixes each, Open SkyView on each. The three questions (what it is called, where
it sits, whether its courses agree) count the cards free of one auditor tag; the builder writes those six tag counts
into the row's `facts.tags`. **NEEDS SAM (Open Asks Sheet 160, S559, 2026-11-03): complete is the auditor's *ready*,** proceeded on the
recommendation; reply to reverse (*curator* would count only a person's confirmation in SkyView). Sheet: https://claude.ai/artifact/KWSqdMPag3RXkwpvqGZqE9 Guard `tests/coci_progress.test.js` (29); a11y `coci-lookup-progress` (320 to 1440) and `-dark`.
Every reference now carries the opened page.

## Sheet 160 answered (S563 SkyBode, 2026-11-03)

Sam answered card 1 *keep* at 12:44Z with a note, the whole sheet reviewed: *"We should count a common course reference even
when a person has not confirmed it. The personal confirmation is an attribute we can give the reference when it occurs and we
can then count confirmed CCRs, until which time we can use the CCRs to crosswalk local titles as best they can--even knowing
they may need more work, folding with other courses or CCRs, or reminting. We will use them for what we can, and in the
process of using them, reveal opportunities and gaps and misalignments to correct and then confirm when confidence is high
enough. Hopefully, in the process of using imperfect CCRs, we can add lessons, rules, principles that will sharpen and
strengthen our AI routines designed to create and manage the CCRs and all our common references."* The Course page keeps
the auditor's *ready* as complete; the lane's NEXT is a confirmed count beside it.

## The confirmed count (S564 SkyHoag, 2026-11-03)

Built Sheet 160's attribute: *Confirmed by a person in SkyView*, 812 of the auditor's 27,581 cards (#2726). Three things
learned on the way. The auditor's cards are not identities: an M-ID that is also a merge target is scored twice (kinds
`C` and `X`), so the count is taken in cards to share the page's one denominator (542 identities). SkyView's explicit
Verify (`validated_at`, Sam's 2026-06-10 *"it shouldn't change to Verified until I verify it"*) has never been pressed,
so the count reads person-made saves instead (a title, a discipline, a cross-listing, a merge). And
`kb/coci_curation.json` keeps one reviewer a card, the latest, so a cohort save after a person's hides the person: the
count is a floor until the overlay keeps a reviewer a field.

**On all five (S565, 2026-11-03).** Sam: *"yes to both, build them for all four"*, answering whether a course placed into
a card confirms that card too, and whether the other references should count the same attribute. Each row now carries
`confirmed_pair()` as its second pair, over the first pair's denominator, with the share also complete: Programs 32 checked
by a person (28 complete); Exhibits 1,173 titles a person stamped (complete is the stamp, so no share); Courses 957 cards
(a person's save keyed on the card, 812, or placing a course into it, 145 more; 152 ready); CR 97 wordings a curator's
decision names (all settled); Subjects 122 MQ disciplines a person confirmed (all settled). CPL Pathways' Confirm writes
only to `program_requirement_records`, so the committed records undercount (20 against 32 live); `kb/_sync_program_checked.py`
commits the checked list daily, college, number and day, never the address. Each Progress page draws it as one line under
its bar (`progress.confirmed`), the Commons card as one line under its figure. The lesson: S564 and S565 built the first
version at the same hour because a scheduled firing is not in `list_sessions`; read `main`'s commits before starting a
queue item, not only at session start.

## The List norms, steps 1 to 3 (moved from the lane, S564, 2026-11-03)

Step 1 of its three landed in S544: the engine's `suggest` slot and the visit's changed set, with CR's rung proposals (*Suggested groups*, Confirm the group) and the Subjects open picks (*Suggested picks*, Confirm this pick) wired in; step 2 put every filter word's count in the engine (S544), and *Selected* on every List; step 3, bands from the spec (the engine's `bands` hook, with `order` for a band named by something other than its key), landed in S543 for Courses and S545 for CR's groups. The Exhibits List moved onto the engine's suggestion slot and changed set in S545, so all three steps have landed.

## Moved from the lane, 2026-11-04 (S573 SkyNeedle; the lane passed its 20,000-byte budget)

**The Catalog Commons tab (S542, #2662):** full width; each row's calls cell reads **Decision Sheet Library**, its count
bold, a 0 in green; answered calls sit under **Completed Decision Sheets**, one line each that opens (Sam, 2026-11-01).
**The Exhibits tiles carry the Commons' Exhibit row** (Sam, 2026-11-01: *"capture everything from 1st into Exhibits view"*): its pair, tests, known issues, procedures, the Decision Sheet Library and the last run, read from `kb/status/commons.json` and its run log, never copied (`exhibits.js`, *The Commons' row, carried on the Credentials view's tiles*); the row's `facts` feed the Progress view. Done; S562 found it built.

**A to-do closes here (S555, 2026-11-02).** Sam: *"There is one decision in the queue that doesn't give me a way to close it, just links to review."* A run-log call with a `todo_id` is a to-do; the Commons now reads the marks (`queue_todo_done`, for a signed-in reviewer), a standing mark answers its call, and an open to-do offers **Mark done** with a note in the band, through `rpc/queue_todo_done_add`. Guard `tests/commons.test.js` (todo 1-5).

**The List norms (Sam, 2026-11-01: *"consistent views for all the folding and consolidation work"*):** every reference's List follows [`reference-catalog-commons-list-norms`](../../kb-notes/reference-catalog-commons-list-norms.md); a PR names which of the ten norms it carries and why it leaves any out. All three steps have landed (history in the lessons, *The List norms, steps 1 to 3*).

**The CPL Commons, the working name (Sam, S552, 2026-11-02).** *"Let's call the Catalog Common the CCC Commons for now
and you can play off of that for the card titles and focus elements."*, then, on seeing it: *"Let's go with these designs for now. I'm chickening out on the CCC Commons...let's go with CPL Commons for now as less of a wholesale take over of the system:)"* The first-view mock
(https://claude.ai/artifact/TG8LPUBATV8WFfrmvPwKEG, a Design canvas, version 8, locked by Sam; source in
`CPLBrain/04-projects/cpl-initiative/catalog-commons-mock/`) now reads **CPL Commons**, with its lede (*eight common references the
California Community Colleges keep together for credit for prior learning*), and each of its eight cards is a **Common**
reference, this tab's own row pattern with "Reference" dropped: Common Programs, Common Subjects, Common Exhibits,
Common Credit Recommendations, Common Courses, Common Credentials, Common Outcomes, Common Skills. The decisions band,
the sort note, the skip link and the footer carry the same words; the Programs card opens CPL Pathways. "Register"
(S551's advice) is retired. The mock is in Malone's CPL/AI look at Sam's ask (S551), which is the public pages' look,
so the port into this tab waits on his call on the look.

## S573 SkyNeedle, 2026-11-04: the path, the order, the queue and the confidence count (Sam's session)

- **The path mock** (https://claude.ai/artifact/PYzUNKC3Ni6F8nhbcKdSr9, v8; source `CPLBrain/04-projects/cpl-initiative/commons-path-mock/`):
  six steps every reference shares, the CPL Commons view and the Common Subjects view, in Malone's look (Sam: *"Use the
  new UI format rather than first light on this and all commons views"*, now the CLAUDE.md presentation rule).
- **Sam's additions, in order** (verbatim in the vault braindump `braindump-2026-11-04-1415-commons-path-one-look.md`):
  where to start (Subjects then Courses, Exhibits then Credit Recommendations, Programs last); teach the daily check
  (Teach a rule, try it switched off, turn it on, watch what a person changes); who carries the work (the routines carry
  the volume, a person is asked only for one of four reasons); the daily check's wish list of data sources, which became
  the register `docs/reference/data_sources.md` with its four steps and a `CLAUDE.md` line.
- **Built:** the one queue (#2766) and the confidence count (#2767) on the CPL Commons tab; the daily dashboard was
  dispatched at 16:57Z so the status file carries both.
- **The confidence lesson:** a first comparison read 71 of the 94 person-touched exhibit titles as changed; every one was
  a family a person renamed or merged. The count now separates kept, renamed with its family, and moved; the KB note
  `methodology-a-renamed-family-is-not-a-correction` holds the rule.
- **`kb_curation` forgets:** its primary key is (course_id, field), so a person's save replaces a procedure's row. The
  receipts are the only record of what a procedure wrote; a confidence measure for another reference needs receipts in
  the same row shape (only the CER saves and the Subjects confirm have them today).

## Moved from the lane, 2026-11-04 (S574)

**What the tab leaves for the build.** A count opens its reference's tab at the top, since no tab reads a
list from its address (the deep link is a build item). The gaps across the harvest's five parts are a live
read of the records' display facts, so the Program Requirements row carries two known issues, the failing
and the unread. The CR row's curator decisions come from the committed receipt, so a new sitting lands a
receipt under `kb/receipts/` or the figure stays at 30 (the live table is the authority). A call reads from
the run log and stays open until a checkpoint removes it; the decision sheet's store is read only where the
Progress view's `callAnswered` resolves a record. The machine stamps: Program Requirements the last college
read (on dispatch), Exhibit the later of the saving run and the fold, Course the auditor, CR the worklist's
last change from git, Subjects the daily sync; a daily stamp older than 36 hours reads stale, a run log
older than a week reads stale.

## Moved from the lane, 2026-11-04 (SkyJujube; the lane passed its 20,000-byte budget)

The S417 record of the Commons tab's first build, verbatim. The Course row's *SkyView alone* ruling it records was reversed on 2026-11-04 (S574: the Courses List first, SkyView beside it).

**LIVE: the Commons tab, `#commons` (S417, 2026-10-18).** Sam, 20:10Z: *"Build it as a tab now. I can
live without the words on the cards—pretty self explanatory and I am the main user."* The tab is the
mock-up's row without its prose: five rows in his order, each with the complete pair and the test behind
it, the known issues each naming an owner, the settled procedures, the calls in the run log and the two
stamps. Every row collapses on its own word to its count and meter (19:08Z: *"Commons looks good. Just
make sure I can collapse each and we have a collapse all button."*; 20:03Z: *"Keep the count and meter
when collapsed."*), Collapse all folds the page, the words on a row move it, and the order and the fold
stay in the browser. Sam's three rulings of the day carry the `cpl_memory` row
`sam-approves-commons-mockup-collapse-2026-10-18` (verified).

- **The machine side** is `kb/status/commons.json`, written daily by `kb/_build_commons_status.py`
  (daily-dashboard.yml, after the builds it reads) from the committed files alone: Program Requirements
  from `coci_programs_data.js` and the harvest's record files (the mock-up's own method); Exhibit from
  `kb/unified_titles.json`, `kb/credentials.json`, the exhibit audit, the procedures run's `latest.json`,
  the saving receipts and the fold report; Course from the auditor's `kb/row_audit/latest.json`,
  `prototype/ccr_universe.json` and the stand-alone build; CR from `kb/cr_reference_worklist.json` and
  the curator receipts under `kb/receipts/`; Subjects from `kb/discipline_canonical_subj4.json`. A figure
  a source cannot supply is null beside its error and reads *Could not be read* (the S343 rule). Guard:
  `tests/commons_status_build_test.py` (66 checks).
- **The session side** is each project's run log, `kb/status/<project>.json`: today Program Requirements
  alone has one, so four rows read *no run log*. The tab reads a run log's session stamp, next step and
  calls as its last checkpoint left them. A call Sam answered on its sheet carries `answer` {by, at, words}: listed
  with his words, counted answered (Sam, 2026-10-21: *"the open asks on The Commons doesn't seem to record that I
  responded"*; #2329).
- **The tab** is `commons.js` (jsdom guard `tests/commons.test.js`, 77 checks), booted after
  `commons_progress.js` (step 1's shared module, whose date helpers it reuses); `npm run a11y -- cobi:commons`
  passes at both widths; UI pass ledger `cobi:commons`.
- **The Course row is SkyView alone** (Sam, 2026-10-18 20:40Z: *"the CCR should be the same as SkyView now,
  right?"*; 20:46Z: *"SkyView alone, since CCR is included as part of it"*): its one word is *Open SkyView*, the map,
  and every count on the row opens it. The Common Course Reference list left the COBI menu at 20:51Z through
  `supabase-migrate.yml` (`kb/receipts/cobi_nav_unified_courses_hidden_2026-10-18_s417.sql`, the rollback in its
  header; the run's receipt `kb/receipts/migration_cobi_nav_unified_courses_hidden_2026_10_18_s417_39165056506.json`;
  the session's SQL guard holds an UPDATE for that path): `cobi_nav` row `unified-courses` is `hidden`, the `skyview`
  launcher row kept. The tab and its list view stay reachable by deep link (`#unified-courses`,
  `#unified-courses/list`) and the Admin tab can show the entry again.
- The mock-up stays the design record: https://claude.ai/artifact/JmaUvTxUqqrL4aPaq2rizi (version 4;
  source `docs/visuals/2026-10-18-commons-mockup.html`).


## SkyJujube, 2026-11-04: retiring the Common Course Reference tab (a side session)

- **The inventory read what the module does at load.** `unified_courses.js` ran `consumeAuthHash()` as it loaded, for
  every tab: the hidden Common Course Reference landed every COBI magic link, and deleting it would have ended
  signing in. Its pointers (SkyView's three links, Quickstart, Subjects' *Fix on CCR*) were the expected part. The
  landing moved into `cpl_session.js` first (#2775).
- **Measured use sized the carry.** `kb_curation` by field, all time and the last 30 days, before porting anything:
  merges 23,143 / 0, renames 7,787 / 0, discipline 245 / 1, description edits and merge notes never. Three edits carried
  (#2776); the rest wait on Sam's call or retire with the tab.
- **The List's panel is the Courses workspace for a common course,** reached from any of its local courses. The card
  reads `unified_courses_data.js` the first time a panel opens (16,389 common courses in the browser file).
- **A panel's sign-in fold must not be a direct-child `<details>`:** the engine places the Title drawer before the
  first one, so the fold pulled the drawer into the common course. The screenshot showed it; jsdom passed.
- **Every view has an address** (asked in session, 2026-11-04): a sign-in link opens a new browser tab, so only the
  address carries the view back. 27 tabs now open the view their address names and report it (#2775, #2779).

## Moved from the lane (SkyBeacon, 2026-11-06)

Verbatim from `docs/reference/lanes/commons.md`, when the lane passed its 20 KB budget.

**Fable's advice, carried (2026-10-18):** complete differs in kind, so each row names the test behind its
count and no column sorts on a share; the machine stamp and the session stamp stay apart, each against a
declared cadence; a call has one source, which today is the run log, with the sheet's store a build item.

**RULED (Sam, Open Asks Sheet 95 card 1, 14:43Z, his own call, "build"; `cpl_memory`
`sam-sheet-95-rulings-2026-10-18`):** *"Yes, and include Common Subjects in the mix."* Step 1, the shared
Progress module (`commons_progress.js`, S419, #2237), is on main; the Commons tab came next on Sam's
20:10Z word. What remains of the order: a run log per project written at checkpoints, each reference's
Progress view (Exhibit, Course, CR, Subjects) from the module, each with its definition of complete on a
card for Sam.

**Step 3's Progress views, Subjects (S425, #2260), Exhibit (S436) and CR (S437), with Sam's keep rulings (Sheets 107 and 108):** the record moved verbatim to `docs/commons_lessons.md` (*Moved from the lane, 2026-11-02*). Each host brought a 60-line spec to the shared module and needed no change to it.
