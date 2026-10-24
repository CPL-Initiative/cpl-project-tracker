---
title: "Session 467 handoff: the funding film v10 in Scenario 4's words, the ELL IET page listed; the attestation surface before the noncredit builder"
date: 2026-10-24
session: 466 (SkyYerbaSanta, two runs)
tags: [handoff, implementation-funding, funding-video, scheduled-sessions]
status: current
---

# You are Session 467

Your moniker is **SkyHollyleaf**. Session 466 ran twice under one number. Sam's routine started the first run
(**SkyYerbaSanta**, scheduled) at 12:12Z on 2026-10-24. Sam opened the second by hand at 12:21Z with a stale greeting
(*Session 461, SkyManzanita*), and it claimed SkyYerbaSanta from handoff 466. Neither run saw the other until 13:05Z:
`list_sessions` never lists a routine-fired run, and the routine's PR opened after the second run read the open PRs.
The second run merged `main` and folded the first run's handoff into this one. It was a **full checkpoint**: lane state
moved and a Rule 10 data receipt landed. It skipped `kb/README.md` and `README.md` (no KB structure or user-facing
surface changed), a KB note (`cpl_memory` holds the four durable learnings), the Pipeline tab (the pipeline did
not move) and the status files (the routine's run refreshed `kb/status/program-requirements.json` at 12:48Z; this run touched
no common reference). Read, in order: this file, both S466 sections of `docs/cpl_funding_lessons.md`, and
`docs/reference/lanes/implementation-funding.md`.

## Who else is working

The routine's 13:12Z firing stood down on #2418 (updated at 13:03Z), and the routine next fires at 05:12Z on 10-25.
No other session was live at 13:30Z. The three older open PRs (#2379, #2323, #2257) were last updated on 10-23 or
earlier. **At start, read the routine's `last_run`** (`docs/reference/scheduled_sessions.md`, *At the start*, step 1,
new in S466).

## What shipped

- **#2417 (the routine's run): v9.** `figures.json` filed from the live config (md5 `8452c29a`), s2 rebuilt and
  `20260926_CPL_Funding_in_Motion_Scenario_2_v9.mp4` rendered: Access and Completion $10,727,131 each, 3,598.2 FTES,
  December 31, 2026. The words did not change. `render.mjs` polls Chromium's port.
- **#2418 (the hand-opened run): the film can carry Scenario 4's words.** `_videoFigures()` files `ncLane` and each
  noncredit outcome's statewide funding ($1,893,023 each; with the priorities they make the $25,240,308 to
  institutions). `build.py` composes *Two priorities carry the credit funding*, *The credit allocations follow Access
  and Completion*, and the bold line *Two noncredit outcomes count toward the noncredit share: exhibits built or
  adopted and a CPL portfolio course* (`ncLine`). Origination scenarios keep the original words. Tests: section 4 of
  `funding_video_figures` (5 checks, mutation-checked), fixture `tests/fixtures/cpl_funding_config_8452c29a.json`.
  On Sam's *adopt*, `figures.json` is re-filed with the lane and v10 is rendered in those words; v9 is retired.
- **Open Asks Sheet 123** (https://claude.ai/artifact/4bedPAUhXKfLSEScLbEpX3, answered; CPLBrain#461): card 1 is
  Sheet 122's card at the same position (a reply on 122 still counts); card 2 asked Sam to adopt the film's Scenario 4
  words, with two draft frames. He answered both at 13:17Z. The Library's open-asks record reads version 123 (run 40096111383).
- **A lane correction.** A pending noncredit gate RELEASES (`ncLaneGate` returns `blocked: false`); the lane had said
  it neither holds nor releases. The noncredit NEXT now puts the attestation surface before the builder.

## Decisions Sam made this run

Open Asks Sheet 123, answered at 13:17Z, both his own call (`replies/done` through 2):

- **Card 1, *list*:** ELL IET CPL Starting Points goes on the public library, and Sam contacts the eight projects
  himself. The listing is the receipt `kb/receipts/cpl_library_ell_iet_public_2026-10-24_s466.sql`, which applies after
  Sam sets the page's claude.ai link public from its Share menu.
- **Card 2, *adopt*:** the film's Scenario 4 words. v10 is rendered from them (#2418).

No card is open; the builder writes no sheet. The memory correction the connector's prompt held went through a
migrate receipt instead (`kb/receipts/cpl_memory_film_row_2026-10-24_s466.sql`).

## Open work, in order

1. **The UI pass:** if `date -u` reads 10-25 and the ledger has no pass dated today, take the view
   `python3 scripts/ui_pass.py --next` names (the Veteran map) with `/a11y-pass` and its wiring and First Light checks.
2. **The ELL IET listing, once Sam has set the page's link public:** the receipt
   `kb/receipts/cpl_library_ell_iet_public_2026-10-24_s466.sql` waits on him setting
   https://claude.ai/artifact/WnEFhH4yuoSdx6mCnoqRpe public from its Share menu. When he says so, read the row; if it
   still matches the receipt's guard, point `kb/migrations/.apply` at the receipt on a `claude/*` branch. If he
   presses *List publicly* in the Library tab himself, the receipt is moot: note it in the lane.
3. **The noncredit attestation surface, then the builder.** The builder (`nc_exh` through the four channels, `nc_cdcp`,
   `nc_course`) must not land first: with the view missing, the conditions read pending and pending releases.
   The surface is a new write surface (Rule 10 a3: Governance DR-09 and the privacy ADRs first). Call its effort.
   Publishing the builder's figures to colleges stays on the hold list.
4. **Sheet 121 card 2:** when Sam attaches the four Coordinator Guide files, run
   `CPLBrain/04-projects/cpl-initiative/coordinator-guide/audit_workflow.js` under "ultracode".
5. **`oversized_doc`, 8 left:** `library` 1.34x, `program-requirements-harvest` 1.34x, `common-cr-reference` 1.07x,
   `ccr_atlas_lessons.md` 1.01x, and four archives that split by date, verbatim.
6. **The harvest queue** (Hartnell's noncredit hours, the arithmetic failures, the two S448 offers) waits on Sam's word.

## Lessons to honor

- A session Sam opens by hand cannot see a routine run through `list_sessions`; read `get_trigger`'s `last_run`.
- To render a film here: `CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` and
  `FFMPEG=$(python3.13 -c "import imageio_ffmpeg as f; print(f.get_ffmpeg_exe())")`. `npm install` first for jsdom.
- `build.py --check` lists differences from the *typed* values; `funding_video_figures.js --check` says what a new
  config moved.
- The funding config is 74 KB; diff it by hash level by level rather than pulling it whole.
- A large `execute_sql` result is saved to a file wrapped in `{"result": "...<untrusted-data>...[{...}]"}`. Parse
  the outer JSON before slicing out the rows.
- `check_generated.sh` reports *statewide catalog* and *discipline blanks worklist* STALE where openpyxl is missing;
  compare with `main` before treating either as yours.

## Let go

At sign-off the hand-opened run drops its watches on #2418 and CPLBrain#461 (merged once green) and its watch on
Sheet 123; the routine's run dropped #2417. No check-in is armed.
