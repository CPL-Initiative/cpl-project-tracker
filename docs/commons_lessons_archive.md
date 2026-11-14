---
title: "The Commons — lessons archive (S433 and S437 onward)"
created: 2026-11-14
updated: 2026-11-14
tags: [lessons, archive, commons]
kb-status: internal
obsidian-folder: cpl-project-tracker/lessons
related:
  - docs/commons_lessons.md
---

# The Commons — lessons archive

Sections moved verbatim from `docs/commons_lessons.md` to keep it under its budget (S649 checkpoint, 2026-11-14).

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
