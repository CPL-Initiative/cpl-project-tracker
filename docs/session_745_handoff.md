---
title: "Session 745 handoff (from SkyCurlew, S744, Sam's plain session of 2026-11-27: the campus letter fold, exhibit deep links, stackable programs, the compact cards)"
created: 2026-11-27
updated: 2026-11-27
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

# You are SkyTattler (Session 745), Sam's next plain session

From SkyCurlew (S744), Sam's plain session of 2026-11-27 from 16:00Z. A **full checkpoint** (a KB generator,
`kb/_build_coci_lookup.py`, changed): three lanes moved (`common-subjects-reference`, `library`,
`program-requirements-harvest` for CPL Pathways), nine `cpl_memory` rows landed (receipt
`kb/receipts/cpl_memory_s744_rows_2026-11-27.sql`), two KB notes added. Skipped: step 7 (no re-mint, no auditor counts
moved) and `kb/status/program-requirements.json` in step 12 (the routine's harvest log; this run did not move the
harvest). `kb/status/subjects.json` stamped. 745 was the next free number. No `## Conductor settings` block (conductor mode is retired, checkpoint step 8).

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
3. **Merge order:** none waiting. SkyCurlew merged its checkpoint (#3912), its CPLBrain twin (#877) and the
   compact-cards PR (#3913) before signing off; only this sign-off note's PR follows.

4. **At start, read the training notes** (`kb_curation` rows with `field = 'procedure_note'` since 2026-11-26; once
   open work 5 lands, those with `value->>'act' = 'true'`) and act on what they ask.

## Sam's words and decisions

- **RULED** `r-all-lp-links-open-bottom-bar-sam-2026-11-27`: *"have the get credit link open a bottom bar so the user
  doesn't get stranded. bottom bars for wide (lots of) information and sidebars for more compact details..."*; *"again,
  all links to lp go to bottom bar iframe of the lp"*.
- **RULED** `r-cpl-glyph-map-pointer-sam-2026-11-27`: *"I think we may want to incorporate a CPL glyph symbol that
  becomes recognizable over time. Thinking of using the MAP directional pointer we incorporate into the A in MAP."* Right
  of CPL, crimson, tilted 25 degrees, a little larger, no chip border or fill, the course's font size, not bold,
  centered on CPL. **The 27th ruled mark beside the 26 of 2026-09-09: an a11y sweep keeps it.**
- **RULED** `r-compact-course-cards-sam-2026-11-27`: *"the '- 2' in the cpl chips doesn't mean anything to the user at
  this point...so let's take the numbers out"*; *"delete Details link since cpl chip does same thing"*; *"make course
  clickable to show course details in sidebar"*; *"now we could get rid of the cpl type label because user will need to
  click the cpl chip anyway"*; *"OK, let's go with that"*.
- **RULED** `r-stackable-programs-top-row-sam-2026-11-27`: *"the stackable programs is very exciting development! would
  be nice to see a very compact set of cards in a top section of the pathway view showing the stackable
  possibilities..."*; *"yes, measure and build it."*
- **RULED** `r-get-credit-on-pathways-cards-sam-2026-11-27`: *"we could use the CPL Pathways views to add the 'Get
  Credit' button that goes to the lp."*
- **DECIDED** `d-icc-not-folded-s744`: Cerro Coso's ICC stays (no IC subject, not on the schedule).
- He asked why the B.S. Field Ironworker Supervisor view uses rows: it is the first, hand-built pathway
  (`cpl_pathways_data.js`); Cerritos has not published the B.S. curriculum. He likes its metric cards.

## What shipped (all merged)

- S736's checkpoint pair: tracker #3906, CPLBrain #876.
- **#3908** (`c66c805b`) the campus letter fold: `kb/coci_campus_letter.py`, 130 rows folded, 20 twins dropped, saves
  follow the fold (Sam's ADMJC lands on ADMJ); statewide subject codes 2,924 to 2,896.
- **#3909** (`3ef5933a`) Library buttons open the landing page on the exhibit (`?Exhibit=`;
  `f-map-landing-exhibit-param-pattern-s744`; KB note `reference-map-landing-page-exhibit-parameter`).
- **#3910** (`45349aae`) CPL Pathways *CPL here* lines link to the landing page on the course's exhibits.
- **#3911** (`1d798625`) Stackable programs (`kb/_build_program_ladders.py`; KB note
  `methodology-stackable-programs-by-course-containment`).

## Read in order

1. `docs/reference/lanes/program-requirements-harvest.md`, *CPL Pathways (S744)*; `docs/cpl_pathways_lessons.md`, S744.
2. `docs/reference/lanes/library.md`, the deep link and the Cable Splicer paragraphs.
3. `docs/reference/lanes/common-subjects-reference.md`, *NEXT (S744)*.

## Open work, in order (from the lanes' NEXT lines)

1. **Look at the compact cards live** (#3913, merged e16800c): open Cerritos 42158 in CPL Pathways after the deploy and
   check the bottom bar's frame of MAP's landing page, the hover list and the sidebar in a real browser (no one has; the
   a11y routes do not open them; add routes for them in `a11y.config.js`). Confirm the COCI description lookup
   (`coci_program_courses` control numbers) fills most courses. Mock-up https://claude.ai/artifact/BQjk5FcRjeHPGZp57bpDJe.
1a. **Industry certifications beside a program** (Sam, 2026-11-27: *"when you find that there are also stackable industry
   certs associated with a program though a CPL exhibit or becasue the program teaches to a cert like CompTIA or both,
   can you note it with a chip that clicks to a sidebar for deatils?"*). Build an "Industry certs" chip on the program
   card opening a sidebar with two groups: *Earns CPL here* (industry-certification exhibits articulated to the
   program's courses, each with its courses and a link that opens the bottom bar) and *The program prepares for* (certs
   the catalog names, quoting its line; only 153 of 18,976 records name one in outcomes or careers today: EMT 50, NATEF
   35, NCLEX 20, ASE 13, CNA 10). A cert in both is marked both. Measure the text matcher's recall and false hits before
   shipping (S652 rule). Proposal for the routine's lane, not built: a certifications field in the catalog reads, since
   most colleges name the cert in the program description, which the harvest does not keep.
2. **The display build reads the apprenticeship exhibits** (`f-cerritos-ironworkers-all-24-cpl-s744`): all 24 Cerritos
   Field Ironworkers A.S. courses carry CPL, but `kb/coci_articulations.json` feeds `kb/_build_roep_display.py` only
   `MAPCXA-*`, so the view says 15 of 24. `library/adopt/adopt_data.json` has the exhibits (`a`, `m`). Its own PR; then
   correct the B.S. page's "the Structural option carries none yet".
3. **Library:** the Cable Splicer re-point is Sam's press (*Revise* on the card; the ask and the expected buttons are in
   the lane); ask whether "Foothill Sheet Metal" is filed under another title; Ashley's flyers go through Start.
4. **COCI description cleanup at build** (`f-coci-description-shards-mojibake-s744`): `_x000D_` and cp1252 mojibake in
   `coci_lookup_desc_*.js`, fixed in `kb/_build_coci_lookup.py`.
5. **A training note that asks COBI to act** (`commons` NEXT 1; Sam, 2026-11-27: *"there should be a way to ask you
   to run a routine to reparse based on the note"*): an *Ask COBI to act on this* checkbox (`value.act = true`) on the
   note box in `commons_subjects.js`, and the session-start read in standing item 4.
6. **Then the common-subjects-reference NEXT:** the builder honors `not_a_subject`; LACCD's 41 untitled codes and the 87
   schedule titles as one list for Sam; the schedule-tool sweep (Allan Hancock 77 untitled first); the Accounting apply,
   **BLOCKED** on Sam's four Business saves; the 35 held and the 50 under 90 (Sam's picks).

Beside the queue: **program-requirements-harvest**'s collection is the routine's; **implementation-funding** waits on
the team.

## Patterns that worked

- Verify a MAP behavior live and read its bundle before building on a report of it: the pattern and the 10-value
  all-or-nothing rule came from the bundle, not the report.
- A conductor's design mock-up iterated live with Sam, then ported by a worker.
- Explicit code lists beat a suffix rule where real codes share the ending (PSYC, EMTC, HOSP).

## Safety

- Rule 10: a bulk write is insert-only under a cohort email with a committed receipt; a re-mint follows the playbook.
- Person-settled wins: Sam's Business filings block the Accounting apply.
- A session cannot write a Library public field or call the revise function; those presses are Sam's.

## Let go

SkyCurlew dropped every PR subscription (#3908 to #3913, CPLBrain#877) and holds the mock-up's artifact watch
(https://claude.ai/artifact/BQjk5FcRjeHPGZp57bpDJe) only until the session ends; no COBIx watcher, no check-in.

Spend: not available; 2026-11-27T16:00Z to 2026-11-27T19:30Z.

Opening line: *Greetings, you are SkyTattler (Session 745), see SkyCurlew's handoff — `docs/session_745_handoff.md` — let's keep rolling with our queue.*
