---
title: "CPL Implementation Funding tab — archived lessons, part 4 (2026-09-22 onward)"
date: 2026-10-24
updated: 2026-10-25
tags: [lessons, archive, funding, implementation-funding, dashboard-tab]
related:
  - "[[cpl_funding_lessons]]"
  - "[[cpl_funding_lessons_archive]]"
---

# CPL Implementation Funding — archived lessons, part 4

Sections moved verbatim from [`cpl_funding_lessons.md`](cpl_funding_lessons.md) when it passed its budget; it reads after the first
archive, [`cpl_funding_lessons_archive.md`](cpl_funding_lessons_archive.md), and its parts 2 and 3 (split 2026-10-25). Read these only for the
reasoning behind a decision you are about to change.

## 2026-09-22 — S283 (SkyFund): the leadership-review pass

Sam's last content edits before he reviews the tab with CO leadership, shipped in #1660; the four
calls still his ride the [funding review sheet](https://claude.ai/artifact/9MfbN6jqio8as9mY4LwPB2).

### "$0 demonstrated" was true of one number and false of the program

In Sam's signed-in scenario every institution was gated (0 of 118 confirmed), so `winEarned` read
$0 while $2,174,757 sat in `winHeld`: funding MAP had demonstrated, reserved until confirmation. The
Summary printed *"$0 demonstrated so far"* over a reserve bullet saying the opposite. The allocation
bullet now counts `winEarned + winHeld` as demonstrated and ends on local confirmation, which is the
one fact the reserve line carried. **A figure that excludes gated funding reads as nothing
happened.**

### One word, two figures

The formula box called the per-priority ceiling *"the cap"*, and the next bullet called the
$400,000 bound *"Cap"*. A leadership reader has no way to tell them apart. The per-priority figure is
now the **max award**, Sam's own term for it (2026-09-01), and *cap* names the bound alone.

### The fifth identity-join miss

The baseline counts ran over `base().colleges` (115) and so left out Calbright, which Sam counts as a
college (116). The coordinator match had the same blind spot: its roster came from the same list, so
no noncredit-only row could ever match, and MAP spells the institution *"Calbright College Credit"*
and *"Calbright College Non-Credit"*. It changed nothing today (neither has a coordinator), which is
exactly how a join failure stays invisible. `eligColleges()` is the one list now.

### Ten suites pinned phrasing, not facts

A style ruling (positive-first, no "this, not that") broke ten suites, because each asserted the
retired sentence: *"not its targets"*, *"placed on the table"*, *"rather than a carve-out line"*,
*"the annual tranche buys"*. Each now asserts the FACT the phrase carried (*targets stay proportional
to the pre-cap share*), so the next wording ruling costs a sentence, not a suite.

### Verify against Sam's screen

The local render runs on baked defaults (no remote config on localhost), so it showed $10.9M
demonstrated where Sam's scenario showed $0 and a reserve line. His screenshots were the ground
truth for every Summary edit; the local render verified layout only. The tab's a11y failures were
measured against `origin/main` in a worktree before any were called pre-existing.


## 2026-09-23 — S283 (SkyFund), second pass: a fourth priority, and a button that saved nothing

Sam's P2/P3/P4 asks, shipped in #1662. The detail is in the lane file and the PR.

### A count typed as three broke eighteen suites and two live surfaces

Adding Priority 4 broke every test that had assumed three priorities, and it would also have broken two
live surfaces the tests did not cover. The briefing's count gate would have sent every college's steps to
the standalone list. The explainer typed "three" in three sentences. Sam's stored `[0, 2, 1]` failed
`isPermutation(v, 4)` and fell back to the natural order, which swaps P2 and P3 with nothing on screen to
say so. **An order written before a priority existed is extended, not reset**, in `cpl_funding.js` and
`college_briefing.js` alike. Tests count from `NPRIO`.

### Read the request log before the handler

Sam said the (D) card's Designate button did nothing. In jsdom the code worked. The edge logs showed nine
200 PATCHes, the last four his releases, and **no request after them**, so the click never reached a
save. The likeliest cause is that nothing was selected in the list when he clicked, and the button returned
without a word. It now says what it needs. The log split the problem in two (the client never sent a
request, or the server refused it) before any code was read.
[note](kb-notes/methodology-a-control-that-does-nothing-read-the-request-log-first.md)

### A ruling superseded by the same person is replaced, and says so

The (C) note quoted Sam's 2026-08-30 *"not measurable at this time, and may never be"*, and a test pinned
it. His 2026-09-22 EDD ruling replaces it on the page with both dates named, and `cpl_memory` records the
supersession explicitly.

### Three rulings, built the same hour

He held P4 at 0% until the first import, let CO research define the outcome, and took the drill-in
consolidation as proposed. The follow-up PR shipped the one-line Baseline and the import receiver.

## 2026-09-23 — S284 (SkyWage): Scenario 3, a base that read $149k, and a scenario nobody published

**What Sam asked.** Scenario 3 matches the statute's four outcomes: delete the second completion priority, number
Career attainment P3, retitle the (D) card "Innovation Projects" as P4, a per-card "show on college rows" toggle,
an editable Measured-from list, plain-language Metric wiring, the NOCE/Calbright unmatched note, the ~$149k at the
base, a tighter drill-in, and a check that a new scenario stays wired to every surface. Shipped as #1664.

- **The ~$149k was a label on the wrong figure.** All 51 institutions at the base receive exactly $150,000; the
  table showed only the credit share ($149,321 at Clovis) beside "(at base)" and the NC share beside it. The base
  binds the COMBINED award, so the fix is a Max award column carrying the bound word and the one qualifying line.
  It brings back a combined column R6/R7 retired on 2026-08-31, so it is item 4 on his sheet.
  [note](kb-notes/methodology-label-a-bound-where-it-binds.md)
- **A new scenario was NOT wired to the public.** Every surface read the scenario the viewer's browser had
  selected: a college (no selection) saw Scenario 1 on the explainer, Sam's browser showed his working scenario
  there, and `college_briefing.js` named "Scenario 1" in code. A stored `published` name per project now decides
  what the explainer, the briefing and an unchosen browser read, with a Publish control on the strip; unset keeps
  Scenario 1. The report writer says when it drafts from an unpublished scenario.
- **A deleted share must move.** An award is W times the SUM of the shares, so a share deleted in place removes
  that part of the funding from every award; Delete asks which priority takes it, and the totals row now warns
  whenever the shares stop adding up to 100%. Sam, mid-session: *"I want to put the 33% into Career Attainment"*
  (not into Completion). Measured on Scenario 3, the statewide Current Total goes from $2,613,990 to $1,354,241,
  because Career attainment waits on the first EDD import; the sheet proposes holding Scenario 1 published until then.
- **His NC base/cap idea is the live model.** Per-lane bounds proportional to each institution's NC FTES share,
  the NC base taken from the CR base, reproduce every award to $0.00. NC gets parity (7.12% of FTES, 7.07% of the
  funding); the cap on the combined award trims Mt. SAC's NC share to $115,102 against $237,441 proportional.
  A weight is the clean lever (x1.25 gives $2,106,330). Calbright's data file says 21,438 NC FTES, which is 8.6 per
  student and stays behind the 1,000 stand-in.
- **The unmatched note was a lane-word gap in the builder.** MAP spells the credit locations "North Orange
  Continuing Education Credit" and "Calbright College Credit"; `_feeder_resolver` now folds the trailing word, as
  the shared identity file already does. The artifact moves on the next daily run.
- **One numbering, two card kinds.** A reported card is still no entry in `priorities(slot)`; the label reads a
  STORED unified order (`cardOrder` + an explicit `reportedCards`), because deriving the reported set inside
  `priorities()` recurses. `priorityOrder()` stays the truth for the measured cards' relative order.
- **Tests read columns by header now.** Thirteen suites indexed drill-in and row cells by position; the Max award
  column and the six-column drill-in broke them for layout reasons alone.
- **Supabase notice (Sam, 2026-09-23):** from 2026-10-30 a NEW table in `public` needs explicit grants for the Data
  API. Next session: grants in every table-creating SQL file, and a lint beside the function-grants one.

## 2026-09-24 — S285 (SkyGrant): the config after the stale save, and the briefing's funding box

**What Sam asked.** Nothing new in the tab; the queue was SkyWage's handoff, and two of its items touched this lane.

- **The config had not moved since the stale-window save.** Read 2026-09-24 00:2x UTC: `updated_at` 2026-09-23 21:30:12,
  `projects.cpl-implementation.published` unset, Scenario 1 Year 1 slot 3 (Career attainment) at share 0.33, factor 0.5,
  six strategies; slot 2 (Completion) seven. Both of Sam's evening-sheet edits (press Publish on Scenario 1 again, move
  the six strategies to Completion) remain his, and colleges see Scenario 1 by the unset-marker fallback. The read went
  through the JSON path this lane records, with each `strategies` array reduced to its length so one query answered.
- **The briefing's funding box carried the retired words** (handoff carryover; #1675): *earns against*, *drawable*, *the
  dollars*, *money*, *pool*, *modelled*. The two guards that hold the funding tab read the tab's DOM and `cpl_funding.js`;
  the briefing is a third file neither opens, the shape S265 met on the explainer. Swept by Sam's map: the measures count
  toward the figure; a capped college qualifies for funding at the same rate; the funding rolls forward and the college
  receives its demonstrated funding once it confirms; only noncredit results count toward the noncredit share; *What
  counts toward it*; reaching a target qualifies the college for the whole share. Three sentences restated positively
  (the base note, the off-roster note, the failed-load notice). *Credit students have earned that has not been acted on*
  stays, by the subject test. Guard: `tests/college_briefing_earn_retired.test.js` reads the source with the
  identifier-sparing lookarounds and one named exemption; two checks in `college_briefing.test.js` that pinned the old
  sentences now pin the new ones. Text only inside an existing box, so no a11y re-measure.
- **Four unfloored files got floors** by hand from isolated runs, twice each: the new guard at 9, and S284's
  delete_confirm 11, press_hold 11, save_over_newer 15. The first commit wrote them beside `_readme` and `_note`; the
  ledger reads `files`, so a second commit moved them. Read a JSON ledger's shape before writing to it.
- **Sam's ruling on the SQL prompts,** recorded here because the config read spent two of the dozen: stop working the
  swarm and budget the calls. The approval doc carries it verbatim; this lane's reads are one statement each from now on.

## 2026-09-24 — S286 (SkyTally) and S287 (SkyLane): the review sheet, the lane tables, and a suite cut to seven minutes

**What Sam asked.** S286 opened the tab to him as a review sheet — the tab as its live config paints it, every section an
item, every line tagged N.k, with reply chips and, at his ask (*"revise the text in, say, 3.1 in the 3.1 box"*), edits in
place. He reviewed through item 7. S286 shipped two PRs from it and left a third in draft; S287 landed the third and,
between the two, halved the wait every PR pays.

- **From the sheet, on main the same day.** #1677: a gold Veteran Star beside the 59 flagged college names, the drill-in
  headers over their columns (the outer `.cplfund-table th` and `tr.cplfund-detail td` rules had reached the nested cells;
  three rules at `(0,2,1)+` restate the geometry), the tabs renamed *2026-28 Funding* and *2025-26 Funding*. #1678: the
  Baseline line reads *60 of 116 colleges meet this. 59 hold the Veteran Star* (Calbright meets it with certificates); the
  Timeline closes with his note as a `TEXT_BLOCKS` entry; MAP partner agencies (`entity_kind: "partner"`: Launch
  Apprenticeship, Futuro Health) are skipped at the row by the builder, since they are not colleges and belong nowhere on
  the CCC funding model; first column left, the rest centered — his house format for tables.
- **The lane tables and the one-line card head (#1679).** One table per lane in his six columns, Outcomes · Max FTES ·
  Max Funds · Actual FTES · Actual Funds · Difference, credit first, then noncredit or a *Credit only* line, so *"the NCs
  [don't] get lost in the shuffle"*; the card head reads *Priority N · (A) Access* with the pickers inline and the law on one
  line. Seven suites had pinned the old surface. The rewrite kept every check in force and moved each to where its fact now
  lives: the percent that sat in the Actual cell rides the Actual FTES hover; *To go* is the Difference column with the FTES
  gap in its hover; the CR/NC split that the Total Possible hover carried is the second table. Two crashes were selector
  faults rather than assertion failures: `colOf(dtl, "Actual")` found no column named that, and `.cplfund-dtl-table tr`
  returned the noncredit table's header row as a priority row — a suite that reads the drill-in selects the lane table.
  Floors raised by hand for the four suites whose counts grew (statewide_expand 37 → 40). `npm run a11y` unchanged: the
  pre-existing four small targets and the 390px prose line.
- **The suite cut from twenty minutes to seven (#1682).** Sam: *"would it make sense to chunk our npm tests for
  git--they're taking 20 mins + each now ... It's probably suite growth."* Timed file by file, this lane's family is
  **56 files and 87% of the suite's 3,592 s** of serial work (28 files and 78% on 2026-08-28), and the runner was already
  at one machine's memory ceiling, so the suite now runs as four shards on four runners fanned into the one check named
  `test`. The cost that matters here: the next twenty `cpl_funding_*` files cost more than the next two hundred elsewhere,
  and a slower boot in `tests/lib/cpl_funding_harness.js` moves every shard at once. The note:
  [`methodology-a-memory-bound-suite-scales-across-machines-not-workers`](kb-notes/methodology-a-memory-bound-suite-scales-across-machines-not-workers.md).
- **Two sessions, one number.** The EACR session ran beside this lane's and also called itself S287; it wrote handoff 288
  and took the receipt name `cpl_memory_2026-09-24_s287.sql`. This session's handoff is 289 and its receipt carries a
  `_skylane` suffix; the four rows S286 staged (partners outside the model; the six columns; the house table format; edits
  in place) are written and logged, creates = 1 each, in one `execute_sql` call.
- **Still Sam's, in the tab.** The config had no save after 2026-09-23 21:30 UTC: the two section renames, the five
  timeline edits from the sheet's `edits` store, Publish on Scenario 1, and the six carried strategies to Completion in
  Year 1. Items 8 to 10 of the sheet carry no verdict.

## 2026-09-25 — S291 (SkyReel): a guide video for colleges, in three drafts

Sam asked for a 30-second whimsical stipple explainer. That became a funding guide built on screenshots, and then a 90-second guide in animated text alone. He preferred the text, saying it explains more than a screenshot does. Three lessons:

- **Pasted images reach the session as files only when they come in a message of their own.** Screenshots pasted into a message that arrived while a turn was running never reached the disk. A full-page capture arrives at thumbnail width (319 px) and can't be read.
- **The preview panel would not play a 1.8 MB self-contained HTML file.** A 166 KB file played. Screenshots embedded as PNGs inflated the page, and recompressing them to WebP did not rescue it. The text-only version is 75 KB and plays.
- **Rendering an MP4 from a page.** Drive Chromium over DevTools, seek the clock and capture each frame (about 15 frames per second), and render the Web Audio score with an OfflineAudioContext. Pull the 29 MB base64 WAV back in 1 MB slices, because one large DevTools message stalls without an error. Playwright's bundled ffmpeg has only VP8, so use the `imageio-ffmpeg` wheel for libx264 and aac. Details are in [`methodology-render-an-html-animation-to-mp4`](kb-notes/methodology-render-an-html-animation-to-mp4.md).

Sam's rulings are in the lane file: Sample College, no releveling, and the figures and link cleared for his walk-through.

## 2026-09-26 — S294 (SkyCadence): the narration reads naturally, and the narrated draft is built

Sam heard the v2 narration as stilted, "especially when sounding out C-P-L rather than just saying it quickly--same with sounding out the year numbers." Three lessons:

- **A spelling is measured in its sentence.** Unspaced `CPL` reads as one quick word, but unspaced `FTES` reads as the word "eftess", and `EDD` and `MAP` read differently alone and inside a sentence. `narrate.py` fixes what spelling cannot at the phoneme level, requires every fix to fire, and fails a run that carries a reading Sam rejected. Durable version: [`methodology-hear-a-synthetic-voice-through-a-recognizer`](kb-notes/methodology-hear-a-synthetic-voice-through-a-recognizer.md).
- **A recognizer hears what the phonemes hide.** `faster-whisper` heard "the 2627 year" (a comma fixed it) and "do November first" ("by", the headline's word, fixed it). Its word timings put each "CPL" at 570 ms against v2's 702 ms.
- **One film clock, mapped, makes a narrated cut.** Every picture in the introduction is a function of one film time, so the narrated cut maps the player's time into it scene by scene (`ft()`), and the score keeps its tempo by arriving section by section just ahead of each stretched scene. Rewriting the score's bar-numbered rules as positions within a section reproduced all 1,293 events of the introductions' score.

### Moved verbatim from the lane file (2026-09-26 compaction)

✅ **THE INTRODUCTION VIDEO: CPL Funding in Motion** (S291 SkyReel #1691/#1694; S292 SkyRelay #1697/#1698; S293 SkyBeam). A 90-second **introduction** for colleges in `prototype/funding_video/`, one per scenario from ONE source (`funding_in_motion.src.html` + `CONFIG` in `build.py`), each an HTML page and a 1080p MP4 (`20260926_*`). ⭐ **An introduction, not a guide** (Sam, 2026-09-26: *"a guide would be much longer and more detailed"*): the explainer's header link reads "Watch the 90-second introduction" beside a downloadable MP4, and switches to Scenario 2's page and MP4 when the explainer shows Scenario 2 (`VIDEOS` in its painter). A real guide is a separate, longer piece. The player opens filling the window, with Full screen and Download MP4, and every scene is sized to fill the frame. The CPL Initiative logo leads with the MAP wordmark beneath it at three-fifths the width (Sam: CPL Initiative most prominent, MAP second fiddle with special treatment). The MAP logo's red arrow flies every scene (Sam: *"like a student searching for its pathway and CPL helps it speed and find its direction home"*), shoots down five pixel barriers to CPL at scene seams (*"like the old Space Invaders arcade game... have to be sly with it"*), and nests back into the A at the close; its keyframes are measured from the scene elements. The orchestral score builds over one theme to a key change (*"should build rather than just repeat"*). ⚠️ **ITS FIGURES ARE TYPED IN, NOT READ LIVE:** Scenario 1 (config read 2026-09-24) gives Sample College $345,220 and an Access target of 44.3 FTES / $112,484; Scenario 2 (stored 2026-09-25) is 50/50 with Career attainment and innovation projects as a reported card, Access target 67.1 FTES / $170,431, computed in jsdom by adopting the stored config through a stubbed config fetch. If the dials move, edit `CONFIG` and run `render.sh [s2]`, about 5 minutes each. ⭐ **Sam's rulings (2026-09-25):** Sample College stands in for Chaffey and may keep Chaffey's real numbers. Year-one funding **carries forward to year two for the same college** and **is NOT releveled**; releveling happens only in a possible year 3 and isn't mentioned. The explainer link and the dollar figures are cleared for his sunshine walk-through with colleges. ⚠️ **The explainer timeline still reads "Undispersed Funds Rolled to Year 2 and Releveled" (Aug 2027), which contradicts that ruling.** Its wording is a curator edit on the tab. `tests/funding_video_page.test.js` guards the naming, the controls, the download targets, the barriers and the narration's spoken form; details in `prototype/funding_video/README.md`. ⭐ **The narrated draft is built, awaiting Sam's OK on the read and the cut** (S294, 2026-09-26): variant `n1`, `funding_in_motion_n1.html` and `20260926_CPL_Funding_in_Motion_Narrated_Draft_2.mp4`, three minutes. The Heart voice (Kokoro-82M, run locally) reads `narration_s1.json` through `narrate.py`, whose phoneme fixes and bans answer his v2 note (*"stilted, especially when sounding out C-P-L... same with sounding out the year numbers"*); the narration drives the clock, each reveal lands on the word that names it (draft 2, 2026-09-29: Sam's 2026-09-27 ask, `cues` in `narration_s1.json` pinned by `cues.py`), the score is a bed under the voice, and captions ride the page and the MP4. It is not linked from the explainer until he approves it.

⓪a ✅ Sam ran the [receipt SQL](../../../kb/receipts/cpl_funding_config_titles_timing_2026-09-24_s287.sql) in the SQL editor 2026-09-24 20:15 UTC (rows_updated 1): both stored scenarios now read "Introduction", "Minimum Conditions", *Confirmation Deadline*, no " in MAP". Still his in the tab: Publish on Scenario 1 (optional; an unset marker falls back to it) and moving the six carried strategies to Completion in Year 1.

## 2026-09-28 (S296 SkyBeacon) — the Annual view compares a year with a year

Sam's funding asks card 1 (year against year) landed in #1721: under Annual funding
each award cell set one year's tranche over the whole window's qualifying figure, so
a college could read 191%. `collegeAlloc` now keeps held and lane figures per year,
`cellFig()` reads the viewed year's, and the district and SYSTEM rows add them alike.
**A sheet's measured premise must know the fix's shape:** card 1's predicate read the
new `cellFig(row, "earned_total")` call as the old window read, so it would have kept
the answered card on the sheet; it left with the card (#1722). The timeline default
dropped "Releveled"; the live label is Sam's saved wording (To-Do
`s296-sam-timeline-label`), since no session writes `cpl_funding_config`.

## 2026-09-29 — S301 (SkyShuttle): draft 3 of the narrated video, and the tab's last small targets

- **A retired word survives on every rendered surface nobody swept.** The brief said minimum conditions on 28 September (#1736), and the video still said *baseline* in the picture of all three pages and in the narrated voice. #1745 fixed both, and `tests/funding_video_page.test.js` now fails on the word in any narration, cue, caption or rendered text.
- **A longer heading takes a smaller type, not a second line.** "Meet the minimum conditions by November 1, 2026" wrapped into the first row at 5.2cqw; at 3.9cqw it keeps the old heading's width on one line.
- **Re-versioning a file breaks every link to it.** The explainer linked the introductions' MP4s by name, so the `_v2` files moved the links in the same change, and the test fails on a link to a missing file.
- **Re-read only the scene that changed.** The other nine clips came out sample-identical, so the cue pass carried over (39 pinned, 33 on their word).
- **NEXT ③, measured with `npm run a11y` before and after:** four targets under 24px, fixed with the house patterns (`padding-block`; padding with negative margins for a raised letter; `min-height` on a wrapping label). Every dead class was checked across the repo and against names built by concatenation before 22 rules went.
- ⚠️ **A test loop with a 120-second cap reports false failures on this tab.** `cpl_funding_calm` alone takes 2 min 11 s; run the funding suites uncapped and read each file's exit code.

## 2026-09-29 — S302 (SkyWeft): sheet 3's funding verdicts, in the cards' own words

Sam answered all eighteen cards of sheet 3 ([XzQMks96QszUDAyXADP3Ag](https://claude.ai/artifact/XzQMks96QszUDAyXADP3Ag), `replies/done` through 18
at 12:39Z). The lane records each ruling; the words the cards proposed, which the work
uses verbatim, are here.

- **Card 4, *demonstrated*.** Each Priority Outcomes card reads *Demonstrated: $X of $Y
  Total Possible*. Demonstrated is the statute's verb, §78093.2(d)(2); the Curr columns
  keep the qualifying figure.
- **Card 5, *use*.** The thank-you: *"Thank you. Your participation is confirmed, and your
  college counts as participating from today."* The form's note: *"Your name and email are
  recorded for the Chancellor's Office and are not shown publicly."*
- **Card 6, a note with no chip.** *"The explainer is wrong. Colleges will be funded for FTES
  that meet the priority outcomes. The full outcomes-based funding is available within the
  two-year window once minimum conditions are met."* The card had proposed *"Every
  institution keeps its full max award. The model counts every outcome an institution
  demonstrates toward that award, and the institution receives the funding once it meets
  all three minimum conditions."* and the heading *Funding by institution*; his note
  replaces the premise, so the rewrite starts from his words.
- **Card 7, *write*.** The timeline's August 2027 entry becomes *"Remaining Funds Carried
  Forward to Year 2"*; the Minimum Conditions introduction becomes *"Minimum conditions to
  qualify for implementation funding:"*. Both scenarios, a receipt of the before-values.
- **Card 16, as proposed.** Re-read the Timing scene with its first two sentences swapped, so
  the voice names the release dates first and the two-year amount second.
- **Card 17, as proposed.** After the quarter-system line: *"Sample College's Access target,
  for example, is about forty-four FTES, behind about a hundred twelve thousand dollars."*
- **Card 18, *keep them all*.** The counter on *million*, the barriers' own pace, the years
  and *One-time funding for 2026–27* arriving about 3 and 3.7 seconds early, the Minimum
  conditions heading typing in on its words, the eased motion, and the arrow pointing about
  2 seconds before its figure.

**Moved verbatim from the lane (S302), the 2026-09-24 dial read:**

⭐ **THE DIALS (config read 2026-09-24 00:2x UTC; unchanged since the 21:30 UTC save of 2026-09-23).** **Scenario 1 is the published scenario** (a stale window's 21:30 save cleared the marker; unset falls back to it): P1 Access `ppa_u` 33% · P2 Completion `ptc_u` 34%, outcome B · P3 Career attainment `ca_u` 33%, factor 0.5, carrying the six transcription strategies of the deleted slot 1 (`prioRemoved: [1]`) · (D) Innovation Projects. The 115 maximum awards total the $24,757,639 allocation. Scenario 3 sums to 133%, unpublished. ⭐ Do not build a combined ORIGIN+counselor source (Sam split them 2026-09-15; `pa_u` + `ppa_u` buys 0.3%).

## 2026-09-29 — S302 (SkyWeft): round 8 of the College Dashboard, and a write that needs Sam's permission

**What worked.**
- **Draw the mockup from the running code again, and keep the harness this time.** `prototype/mockup_harness/` renders the tab in Chromium with Supabase answered from fixtures, opens every shown drill-in and captures markup plus matching CSS. The priority rows became rows of the college table itself, so they line up by construction and the Columns menu hides them with the same child-combinator rules.
- **Look for a published copy before building a new read.** The CPL Coordinator's name was already public in `map_college_contacts_pub` (My College reads it); only the primary contact needs the reviewer-gated table.
- **Measure what a condition's wording claims against what its check reads.** Sam defined the first condition as three parts; the check reads the coordinator alone (49 against 43).

**What bit.**
- ⚠️ **A new workflow that writes Supabase with the service key is refused by the session's permission check.** Card 7's applier is built; its workflow is Sam's call. Ask before building one.
- **The live config moves while a session plans a write** (Sam saved at 13:58Z, after the plan's read). The applier guards every path on its before-value and writes only over the version it reads.
- **The npm Playwright's browser path does not exist in this container**; launch at `/opt/pw-browsers/chromium`.

**Moved verbatim from the lane (S302, to stay under the 20,000-byte budget):**

⚠️ **THE ORIGINATION CUTOVER IS ASYMMETRIC.** The **NC side** (`LocID2`) is wired downstream and lands once a session adds the column to the daily fetch (`fetch_custom_report.py` asks MAP for a fixed list; a column a view lacks fails the whole view). The **credit side waits on a person**: the builder prints *"the ppa cutover … stays PENDING"* with an `origin_values` histogram, so the switch is made on CONFIRMED spellings. ⚠️ **A lane file is a summary of a measurement, not the measurement** (`scripts/funding_effective.js`; [note](../../kb-notes/methodology-a-lane-file-is-a-summary-of-a-measurement.md)). Full text before the S300 compaction: the lessons archive.

✅ **The explainer is titled "2026-2028 CPL Initiative Funding: How It Works"** (S292), with a statutory intro (SB 135; Ed. Code §78093–78093.2); three suites pin the tab's own link text. ⚠️ `funding_model_page.test.js`'s vocabulary scan lifts the statute's "advancing career attainment" out before scanning; every other *advance* stays banned.

✅ **SCENARIO 3'S CONTROLS (#1664, 2026-09-23).** A **published scenario** per project (`projects.<pid>.published`) is what the explainer, the college briefing and an unchosen browser read; unset keeps Scenario 1. ⚠️ **A window saves only over the version it read** (the PATCH names `updated_at`; [note](../../kb-notes/methodology-a-window-saves-only-over-the-version-it-read.md)). Add/Delete a priority (`prioRemoved`, `prioAdded`; ⚠️ **a deleted share must move**, so Delete asks which priority takes it). One numbering for reported cards (`cardOrder`, `reportedCards`; ⚠️ the label inside `priorities()` reads stored data only). ⚠️ **A redraw during a press swallows the click**: `render()` waits while a press begun in the mount is open (`cpl_funding_press_hold`). Full text before the S300 compaction: the lessons archive.

## 2026-09-29 — S302 close-out: the lessons doc that one line erased

- ⚠️ **`open(p, 'w').write(rd(p) + more)` erases the file before it reads it.** Python opens, and truncates, before it evaluates the argument, so the S302 checkpoint wrote 847 bytes over this 113,895-byte doc. `docs_index_build_test`'s frontmatter-less check caught it: the doc lost its frontmatter, so its title fell back to its slug. The doc was rebuilt from main plus the S302 passages, recovered verbatim from the session transcript. Read into a variable first, or append with mode `'a'`, and compare a doc's size after any scripted write.
- **Sam allowed `funding-config-edit-apply.yml` (2026-09-29): *"Allow workflow and I'll type in myself."*** The workflow landed for reviewed config edits (#1757); he types card 7's two lines himself, and a dry run confirms them. The permission check passed the same file once he had said so.
- **A Dependabot PR's runs get no repository secrets.** #854's red `sync` check read `SUPABASE_SERVICE_KEY unset`; setup-python v7 itself installed and ran. Merging a bump that touches a workflow triggered by its own file runs that workflow on main with the real key (`coci-offerings-sync.yml` writes).

## 2026-09-29 — S303 (SkyWarp): round 9, sheet 4, and a card that asked about a setting nothing reads

**What worked.**
- **The live `<details>` is the truth, not its `toggle` event.** The Introduction reopened after Hide because a browser fires `toggle` as a queued task: a redraw landing between the click and that task (a remote load, or the press-hold redraw) rebuilt the section from state that had not heard of the click. `render()` now reads every section's open state from the DOM first. Reproduced in Chromium by holding the button down and redrawing mid-press; it reopened and stayed open (#1761, `tests/cpl_funding_round9.test.js`).
- **Bake no percent beside a masked count.** The veteran line shows veterans, JSTs and the percent (`vet_jst`, `vet_jst_counts()`); a count of 1–9 bakes as `<10` and the builder then bakes no percent, because a percent beside a masked count gives the count back.
- **A gray figure never enters a total.** Gated Curr cells show the held figure by lane (`held_cr`, `held_nc`, `earned_withheld`; Sam: *"should not be 0"*); subtotals and the Statewide row still add qualifying funding alone.
- **Answer a public check with booleans.** The first condition's three parts (card 1) live partly in a reviewer-only column; `map_coordinator_summary()` answers each part as a boolean, so the public page and the tab run one check and no name leaves the table. A return type change needs DROP + CREATE; restate the grant (#1765).

**What bit.**
- ⚠️ **Sheet 4 card 5 asked Sam to rule on a stored block the model never reads.** Its premise came from a `cpl_memory` row that read `yearPriorities["2"]`; `mirrorYears` is on in both scenarios, so `prioSlot()` gives every year Year 1's priorities. Scenario 2's Year 2 already followed P1 and P2. Read what the model computes (`_effective()`, `scripts/funding_effective.js`), never the stored dial, before writing a card about it.
- **A retired-word lint that matches substrings flags the house's own wording**: "rolled" inside "enrolled veteran". Whole words, with a check that each retired word is still caught.
- **Decision sheets carry just the items** (Sam, 2026-09-29): no framing, count line or how-to box.

**State.** Round 9 live (#1761); sheet 4 answered 22:26Z, nine of nine his own call; cards 4 and 6 done (#1764; the config write at 22:53Z, receipt on main), card 5 already true, card 1 in #1765 (the RPC is live). Next: card 3 (0 hours reads noncredit), card 9 (Grossmont's four to ATHL), then the P3/P4 mockup (7), the Scenario 2 narrated draft (8) and the Reporting box (2, Governance first).


The funding lane's S303 relocations moved on to the [archive](cpl_funding_lessons_archive.md) at S305.
