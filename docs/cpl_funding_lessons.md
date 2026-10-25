---
title: CPL Implementation Funding tab — workstream lessons
created: 2026-06-11
updated: 2026-10-25
tags: [lessons, funding, implementation-funding, dashboard-tab, parallel-session]
artifacts:
  - CPL_Dashboard.html / index.html (tab shell — PR #352)
  - funding/CPL_Funding_Model_2026.xlsx (committed source workbook)
  - funding/_build_funding_data.py (one-shot extractor)
  - cpl_funding_data.js (static data artifact, window.CPL_FUNDING)
  - cpl_funding.js (renderer, window.CPL_FUNDING_TAB)
  - tests/cpl_funding_*.test.js (nine suites; split 2026-08-20)
  - tests/lib/cpl_funding_harness.js
  - tests/cpl_funding_reorder.test.js
  - prototype/funding_model_explainer.html (the audience-facing explainer)
  - prototype/build_funding_model_explainer.js (regenerates its data)
  - tests/cobi_prose_measure.test.js (the full-width prose rule, COBI-wide)
  - college_briefing.js (My College funding box — the identity join)
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/methodology-standing-pii-guard]]"
  - "[[docs/cpl_funding_handoff]]"
---

# CPL Implementation Funding tab — lessons

Workstream scratchpad for the **Implementation Funding** dashboard tab
(hash `#implementation-funding`), built 2026-06-11 in a session running
**parallel to an active CCR session** — hence the unusual constraint set:
shell-first, then new-files-only.

> **Earlier sections archived.** The 2026-06-11 → **2026-08-06** build-out — the tab
> itself, the Chancellor-facing 2-year rework, the equity refinements
> (front-load · floor · rural allowance · eligibility badges), the
> achievement-based cap-and-earn model, the $35M reframe, the Budget-tab ledger
> reconciliation and the move to credit FTES — moved verbatim to
> [`cpl_funding_lessons_archive.md`](cpl_funding_lessons_archive.md) on
> 2026-08-20, the 2026-08-01 → 2026-08-06 sections (the units answer, the
> per-priority price factor, the NC decision, the opt-in v1 and the $50k
> groundwork) on **2026-08-27**, and the 2026-08-22 → 2026-08-23 sections (the
> explainer rework, the maximum allocation, the rural carve-out's retirement,
> the noncredit lane's first shape, Sam's dial-moving day and the docx
> migration) on **2026-09-01**, and the 2026-08-31 → 2026-09-01 sections (the
> one-pool port, its test family and the deck run: S215–S217) on **2026-09-24**, and the 2026-09-01 section on
the two consolidations (Session 219) on **2026-09-30** (S306), and the 2026-09-02 explainer audit (S219) on
> **2026-09-30** (S307), and the 2026-09-02 calm pass (S220) on **2026-09-30** (S308), and S260 SkyKey's 2026-09-13 section on **2026-10-20** (the side session beside S438) — each time because the doc crossed its size
> budget and the checkpoint needed to append. Those phases are shipped and settled; read the archive only for the
> reasoning behind a decision you are about to change.

*The S262 to S265 sections (2026-09-14 to 09-16) moved verbatim to the [archive](cpl_funding_lessons_archive.md) at the two 2026-10-22 side sessions.*

*The two S283 sections (2026-09-22 and 09-23) moved verbatim to [`cpl_funding_lessons_archive_4.md`](cpl_funding_lessons_archive_4.md) at S468 (2026-10-24; part 2 until S474 split the first archive into three parts).*

*The S285 to S303 sections (2026-09-24 to 09-29) moved verbatim to [`cpl_funding_lessons_archive_4.md`](cpl_funding_lessons_archive_4.md) at S475 (2026-10-25).*

## S304 (2026-09-30, SkyHinge): card 7, P3 and P4 as reports

**State.** Sam approved the card 7 mockup (*"go ahead with the card 7 mockup"*, artifact `RRTSSiTW1k6jk6gvxUAQ1D`) and #1771 ported it: a scenario setting, `reportedAsReports`, makes a reported card a report (a Reported word, a description, What is reported, When reading TBA, Where left off the public card until set; no Metric block, no Project allocation, no detail row). Scenario 1 derives its reported cards and keeps the card it had. The Scenario 2 write (`kb/funding_config_edits_out/2026-09-30/`) removes the measured 0%-share Career Attainment card (`prioRemoved` [1] → [1,3]), splits the combined reported card into C and D, and turns the setting on. It is the first plan to add a key: the applier now takes `"create": true` with a null `before`, an undeclared new key still refuses, and rollback removes a created key.

**Lesson.** Card 7 said "a reported card that is also a funding priority still enters every sum"; the live read showed the real shape: Scenario 2 carried a *measured* Career Attainment card at a 0% share beside a *reported* card whose title also said Career Attainment. Read the stored scenario before designing the fix: the answer was to remove a card, not to change the sums.

## S305 (2026-09-30, SkyLatch): card 8's narrated Scenario 2 draft, and the Reporting box through Governance

**State.** Card 7's Scenario 2 write read back live (03:56Z, unchanged since). Card 3's rename landed on the corpus (seven groups *(noncredit)*, three ranges; A30 holds). Card 8: the Scenario 2 narrated draft, variant `n2`, 3:06 (#1774), eight scenes as draft 4 and two of Scenario 2's own, waiting on Sam and unlinked until the Chancellor finalizes Scenario 2. Card 2: `cpl_funding_reports` folds into DR-09, and the mockup ([BV2Xqt49vCYicX5xdEKP5E](https://claude.ai/artifact/BV2Xqt49vCYicX5xdEKP5E)) records quarterly expenditures in NOVA's eight categories (#1773); the build waits on three calls on sheet 5.

**What worked.**
- **A copied config is safe once its hash matches.** `funding_effective.js` warns against transcribing the config, and the sandbox cannot reach Supabase. The session copied the Scenario 2 block from an MCP read, then compared its md5 with Postgres's `md5(... ::text)` of the same jsonb before the model read it. A match means the copy is byte for byte the stored text, so `T._alloc('Chaffey')` answers for the live config.
- **Reuse a script and change only what the figures change.** Eight of ten scenes kept draft 4's words because the model gave them the same figures under Scenario 2; the recognizer and the cue pins then only had two new scenes to prove.
- **Keep the scenario out of the voice.** The picture says Scenario 2; the voice does not, so the read survives the Chancellor's finalizing it.

**What bit.**
- ⚠️ **A typed figure slipped a decimal.** The Scenario 2 introduction showed 67.1 FTES; the model gives 67.17 (67.2). 44.3 × 50/33 = 67.12 is the likely source: another scenario's rounded figure, scaled. Read every figure from the model.
- ⚠️ **A helper that builds a filename hides the read from the dependency map.** `narration('s1')` formatting `narration_%s_layout.json` dropped `build.py`'s read from `kb/dependency_map.json`; the literal filename at each call keeps it.
- ⚠️ **`check_generated.sh` is the last step before a push, after every edit.** #1773's first push ran it before a lane trim changed the `updated:` date, and `lints` failed on the stale catalog.

## S306 (2026-09-30, SkyRivet): P1 on `pa_u`, Refresh everything, and where the units come from

**State.** Sam moved P1 (Access) from `ppa_u` to `pa_u` in both scenarios (his save, 13:41Z) and asked whether Chaffey's Curr CR of 634.0 FTES was a calculation error. It is not: 19,020 applied units ÷ 30 = 634.0, and the priority counts up to its 67.2-FTES target, so Chaffey qualifies for the whole $170,431. The model reproduced his screenshot to the dollar (total $345,220). Under `pa_u`, 49 of 115 colleges reach the P1 target (0 under `ppa_u`); 7 reach P2. His Sierra reading holds: Chaffey's applied units are mostly AP exams (MAPSAS exhibits), a use he called *"valid and useful"*. Shipped in one PR: the drill-in hovers, the frozen header, Refresh everything and its splash, My College following the model, My CPL Funding beside the table on the public renderings, and Unit sources.

**What worked.**
- **Reproduce the screenshot through the model before judging a figure.** A minimal Scenario 2 config (the dials, not the whole row) reproduced every figure in Sam's screenshot, which is what made "the arithmetic is right" a finding rather than an opinion.
- **Measure the grain before adding a table's units.** `map_college_cr_unit` sums Chaffey's applied units to 19,405 against the measure's 19,020, so its rows carry each row's own units and add by exhibit and by recommendation. Student counts do not add (a student sits on several rows), so the panel shows units only.
- **Measure a proxy against the flag it stands in for.** The credit report has no military column. "ACE source or a military course type" agrees with MAP's own MilitaryCredits flag on 99.5% of applied units statewide (1,193 of 238,043 differ), so the split carries its rule in its label.

**What bit.**
- ⚠️ **Subscribers heard the model before its caches cleared.** `render()` called `notifyModel()` first and cleared the caches only past the mount guard; a subscriber reading `_alloc()` in its handler got the previous model. My College escaped only because `fundingFor()` calls `_model()` first.
- ⚠️ **My College kept its own copy of the config.** The box read the module on every paint, but its strategies came from the copy read at load and the scenario chosen then; after a publish it showed Scenario 2's funding and dropped every strategy. It now adopts the module's config on every model change, once the module has read the shared one.
- ⚠️ **A frozen header never froze.** The header was `sticky` since 2026-08-30, inside a wrap whose `overflow-x: auto` made it the scroll container, and a wrap with no height never scrolls up and down. A 75vh cap fixed it; print releases the cap.
- ⚠️ **A control in a figure cell broke the harness's reading of the figure.** `readCells()` takes the figure as the cell's text less its FTES line; the Unit sources word came after the line. The harness now drops `.cplfund-srclink` before reading.
- ⚠️ **`:scope > tbody > tr`, not `tbody tr`, inside a nested table.** The outer table's tbody is an ancestor of the inner header row too.

**Sheet 6, answered at 15:26Z (all seven).** Yearly reports, all eight categories, each college sees its own; Scenario 2 final; reword P1; the two My College figures renamed (built). Card 1: Sam rewrites the Scenario 2 script and voices it with ElevenLabs. ⚠️ **A parallel session read the same Chaffey figure from Sierra's side** (#1776): the credit report's applied column equals the articulated units on every row, whatever the plan status (74,697 units statewide at Needs Action), so Unit sources now splits by plan status. Read `main` before pushing: a sibling session can land beside yours on the same question.

**Moved from the funding lane at the S306 checkpoint (verbatim):**

✅ **COLLEGE DASHBOARD ROUNDS 8 AND 9 ARE LIVE** (S302–S303, Sam: *"mockup looks good!"*): gray Curr figures until an institution meets all its minimum conditions, showing what its measures compute to; the drill-in in the row's own columns; the coordinator, primary contact and landing page under the met first condition; the veteran count, JST count and percent beside the third. Guards: `tests/cpl_funding_round8.test.js`, `tests/cpl_funding_round9.test.js`; harness `prototype/mockup_harness/`. Detail moved verbatim to the [lessons archive](../../cpl_funding_lessons_archive.md) (S305). ⭐ **Sheet 4 rulings (Sam, 2026-09-29, all nine his own call):** the first condition's check reads **all three parts**, and the Reporting box starts with **spending** (a new write surface: Governance first). ⭐ **Card 2, S305: Governance done, mockup with Sam. NEEDS SAM (sheet 5, cards 2–4).** `cpl_funding_reports` folds into DR-09 beside `cpl_funding_notes` (`kb/governance_surface_map.json` and the register row, 2026-09-30); a report is an institution's dollars with no student record, so the student-detail disclosure boundary does not reach it, and it is reviewer-gated like the note. The mockup ([BV2Xqt49vCYicX5xdEKP5E](https://claude.ai/artifact/BV2Xqt49vCYicX5xdEKP5E), `prototype/cplfund_reporting_box_v1.html`) records a college's reported expenditures per quarter in NOVA's categories (object codes 1000 to 7000 and indirect costs), totals them to date beside the maximum award, keeps who reported and who recorded, and treats a correction as a new report. The build waits on three calls: quarterly or yearly, all eight categories, and whether a college sees its own figures on My College. ✅ **Card 1 built (S303):** `map_coordinator_summary()` answers `has_coordinator`, `has_primary_contact` and `has_landing_page` as booleans, never a name, so the public page and the tab run one check (live 2026-09-29: 49 coordinators, 43 all three); an unmet line names the missing part. Guard: `tests/cpl_funding_first_condition.test.js`.

**Moved from the funding lane at the S306 checkpoint (verbatim):** Moved verbatim to the [lessons](cpl_funding_lessons.md) (S302): the origination cutover's asymmetry and the explainer's title.

## S307 (2026-09-30, SkyGusset): the Reporting box's reviewer half

- **Built on Sam's sheet 6 calls:** `cpl_funding_reports`, INSERT-only, reviewer-gated on read and write, the recorder
  stamped by trigger from the session (the body's `recorded_by` is overwritten: a reviewer cannot record in another's
  name). Re-keyed from the mockup's quarters to fiscal years; the window's years plus the close-out year, since funds
  close out the year after the window.
- **Reversible without SQL.** INSERT-only rules out an edit, so a mistaken entry needed a way back that a reviewer can
  take from the tab: **Withdraw** is itself a newer row (`withdrawn`, no figures), after which the year counts as
  unreported. The table's CHECKs make a withdrawal empty and a report name its reporter.
- **The repo's Supabase guard blocks any statement containing INSERT,** even in a rolled-back transaction as a role
  test. The live gate was verified from the catalog instead (`pg_policy` expressions, `has_table_privilege`) and
  matches `cpl_funding_notes`; the first reviewer save is the live proof, and the tab's re-read confirms it (#598).
- ⚠️ **Two mutation runs against one file, sharing one backup path, raced.** A foreground run copied the file while a
  background run held its mutation, and both restored from that copy: the print-clone line vanished from the source
  and every test still passed. Found by re-grepping the mutated lines after both finished. Give each run its own
  backup, and never run two against the same file at once.
- **Open (sheet 7 card 1):** how a college's staff sign in to see their own. MAP lists a CPL coordinator or primary
  contact address for 105 of 123 colleges (49 and 99); three district staff are listed for three or four colleges.
- **Sam's Public view asks (same day):** the published scenario opens every visit; *As colleges see it* flips the
  curator choices off in the Public view; My CPL Funding at the top of both public renderings, by college or district,
  with Save as PDF through one printer (`printPanel`). The margin audit measured edges in Chromium: the a11y sweep
  passed every page while the explainer's header ran flush to a phone's edge, because a `padding` shorthand's 0 sides
  erased the `.wrap` gutter. **A sweep that measures contrast and targets does not measure alignment; probe the edges.**
- ⚠️ **A district's blocks never named their institution:** `fundingPanel` omits the name because the chooser carries it
  in the one-college view. Only the screenshot showed it; each member now sits under its name.
- **The dashed frame around the tab is COBI's placeholder on 18 tab roots:** measure a pattern's reach before calling it
  one tab's defect.

### Moved from the funding lane at S307 (verbatim)

✅ **S306 (Sam, 2026-09-30):** the drill-in hovers say how each figure is reached (label: goal, measure, share, price; Max: funding × share, target = proportional funding ÷ price; Curr: units ÷ units per FTES, fraction × Max); the college table scrolls inside a 75vh wrap under a frozen header; **Refresh everything** (Internal view) re-reads the saved model here and in every other window of the browser (BroadcastChannel `cpl-funding-model`; a save posts it too) and lists what it reached, what is built when opened, and what is not live; My College adopts the module's config on every model change; **My CPL Funding** sits beside the table on the public renderings (`fundingPanel`, one renderer); **Unit sources** (reviewer, Internal only) reads `map_college_cr_unit`: military (ACE or a military course type, 99.5% agreement with MAP's flag) vs non-military, the exhibits and the recommendations. Guards: `cpl_funding_refresh_sources.test.js`, `college_briefing_funding_sync.test.js`.

⭐ **SCENARIO 2 IS FINAL AND PUBLISHED (Sam, 2026-09-30, sheet 6 card 6; chosen 2026-09-29 after the CO demo):** *"We're going with Scenario 2."* College funding follows P1 and P2 (Year 1: 50% each); *"I will be reporting on P3 Career Attainment together with P4 projects using more qualitative data rather than tying it to FTES."* **Ruled on sheet 4 (cards 5–8):** Year 2 follows P1 and P2 at 50% each (already true: `mirrorYears` gives Year 2 Year 1's priorities, so no write; the stored Year-2 block is inert); both of Scenario 1's phrases carry to Scenario 2 (✅ written 2026-09-29 by `funding-config-edit-apply.yml`; receipt in `kb/funding_config_edits_out/2026-09-29/`); P3 and P4 get a mockup before any port (✅ **approved 2026-09-30**, *"go ahead with the card 7 mockup"*, artifact `RRTSSiTW1k6jk6gvxUAQ1D`: in Scenario 2 the measured 0%-share Career Attainment card leaves, and Career Attainment (C) and Innovation Projects (D) are reported cards that say what is reported, when (TBA) and where, with no target, FTES or funding line; `reportedAsReports` turns the shape on per scenario, so Scenario 1 keeps its card; ✅ written 2026-09-30, receipt in `kb/funding_config_edits_out/2026-09-30/`, the first plan to declare a new key, `"create": true`, and read back live in S305: `prioRemoved` [1,3], `reportedCards` [C,D], the two titles, `reportedAsReports` true); ✅ the Scenario 2 narrated draft is built (card 8, below). Card 1 (Sam, sheet 6): *"I want to rewrite it and then use the ElevenLabs connector to add a natural narration voiceover."* Unlinked until his rewrite is voiced.

## S308 (2026-09-30, SkyBracket, joined with S309 SkyCensus): the Public view reads as text, and the Reporting box's college half

**Sam's four asks, verbatim:** *"1. For all text views possible on this tab eliminate the gray background box to simplify visually 2. Eliminate any unnecessary line breaks or font size changes with text to enhance readability 3. Delete the 2 marked chips 4. Fix the dates so they are appropriately spaced."* Shipped as #1788.

- **The dates were a DOM bug, not a spacing choice.** In public mode `edText()` returns the bare value, and two bare text nodes inside a flex row join into ONE anonymous flex item, so the label and date printed as "Funding Model FinalizedSep 2026" with the row's `justify-content` doing nothing. The curator view never showed it (its inputs are elements). Any public-mode emitter that returns text into a flex row needs its own element.
- **Box removal went to both views;** the chips left the Public view only (the memo and brief are curator tools). The priority cards kept their boxes (a grid needs edges); sheet 10 card 3 asks.
- **The size change met a July ruling.** C9e in `cpl_funding_rollup.test.js` pinned the Timeline to the cards' .8rem (Sam, 2026-07-23, when it sat under the cards). CI's shard 4 caught it; the newer ruling governs, the assertion now pins .92rem and says why, and sheet 10 card 2 lets Sam reverse it. ⚠️ A local run of 69 funding suites takes ~50 minutes serially; `xargs -P 4` with a 1-hour background limit finished them.
- **The Minimum Conditions status runs into its requirement** in the Public view (`reqItem()`), with the deadline read into the text through `partReqText()` ("Local confirmation on file by 2026-11-01.").

**The college half (#1790, Sam's sheet 7 card 1: MAP's two contacts).**
- **Names meet through `map_colleges`, never through each other.** Reports carry the roster's short name, contacts carry MAP's; both resolve to a `college_id` (canonical first, then a variant, trimmed). 112 of 115 roster names resolve; *LA Swest*, *Mt San Antonio* and *MiraCosta* fail closed until the identity crosswalk carries them.
- **A contact field is a list.** 26 of 148 filled fields held two or more addresses (comma and newline); each is split before matching. Measured as a caller through `request.jwt.claims`, printing counts only: a four-college address reached 4, an unlisted one 0.
- **Return one row per listed college even with no report,** or the page cannot tell "none yet" from "not listed".
- ⚠️ **`revoke ... from public` left `anon=X`.** This project's default privileges grant anon and authenticated by name on every new function; the function stayed callable until the revoke named anon. Rule 10 b2 now says so, and the grants lint's docstring. Exposure check: no rebuild, replace or clear function is anon-callable.
- **The page never decides who sees what.** My College only asks `cpl_funding_my_reports()` with the person's own token; the team phrase is not a person and gets the sign-in. `markReports()` is the one "newest counts" rule for both views.
- **The seeded a11y sweep found the Resources links at 15px** (SC 2.5.8); they are 24px now. A section behind the scope question needs its own seeded target, one per state, because the sweep seeds once per width.

## S310 (2026-10-01, SkyTandem): My CPL Funding in Sam's words

**Sam's ask, verbatim:** *"See screenshot for My CPL Funding view and make a mockup with revised language that follows the norms and examples in our rules and memory. Show me in the mockup your revisions before we make any changes to prod."* Round 1 #1797 (artifact C5crxcr1KY7t1JgX3HTXMx, 16 cards); the port #1798.

- **The Today half came from the product.** `prototype/mockup_harness/capture_mycpl.mjs` renders the Public view with the tab's own scripts and answers Supabase from a fixture whose config is md5-checked against Postgres; the same harness verified the port (Coastline read as approved).
- **His replies were the spec.** A note-only reply stores `v: ""` and the note is the verdict; his Follow up flags (cards 1, 2, 4, 7, 8, 12, 14) meant "use my wording". He wrote eight of the sixteen sentences himself.
- **The mockup found a dead line.** Do this next never showed the implementation step: `topStrategy()` read `pr.strategies`, `buildBriefing()` carries `pr.items`, and the test fed it the config's field name ([note](kb-notes/methodology-a-guard-that-supplies-its-own-input-tests-only-half.md)).
- **The conditions list reads the module's own list.** `_conditions()` builds on `eligReqList`, so the block, the pie and the drill-in agree.
- ⚠️ **Six tests pinned the retired sentences, and the local run missed one.** CI's shard 2 caught `cpl_funding_refresh_sources`. Before pushing a wording change, grep `tests/` for a fragment of every sentence it retires.
- **Rulings (verbatim in `cpl_memory`):** no "funding model" in college-facing text (*"as it's finalized, it's no longer a model but now a procedure"*), extended the same day to the explainer and the tab's public text (*"Yes replace model on other surfaces as well"*); "through apportionment" for the seed grant only; the 84 are CER credentials, and MAP's statewide set is 134 exhibits with 354 recommendations; the seed grant's expend-by date stays off (*"Leave this off"*).

## 2026-10-01 — S312 (SkyLantern): the explainer takes the Fact Sheet's layout, and the average replaces the typical

**What Sam asked.** The explainer, "likely the main view for the colleges," in the Fact Sheet's layout (a link per section that opens it), Ask Sierra, projects and staff in one box, and "the average funding rather than typical" in the explainer and the video. Shipped as #1806; the sheet 14 rulings followed the same evening (#1807 ports the "model" sweep).

**What we learned.**
- **A token the page adds can switch on a rule the embedded tab wrote.** Defining `--seal-blue` on the explainer's `:root` painted the institution table's header navy behind body text (1.13:1); `cpl_funding.js` reads it with a fallback the page relied on. Scope page tokens to the page's chrome (`.actionbar, .masthead, .fs-sra-drawer`). The mirror of the 2026-09-29 lesson (a token the page lacks paints nothing).
- **The average splits by averaging each institution's own shares** (`avgCr = avg − avgNc`, so the pair sums to the printed average): $213,901 = $198,542 + $15,359 under config md5 `e21658f9`. The median stays in one sentence, because most institutions sit below the average.
- **The video's preview font is narrower than the render's.** "The average allocation splits in two" fit the Playwright preview and wrapped into the figures in the MP4 (fontsource Playfair 900). Check a heading change on `build.py <v> --render` before a five-minute render.
- **Keep a voiced draft frame-identical by config, not by leaving it alone.** `SAMPLE` / `SPLIT_THREE` keep the narrated drafts on Sample College while the introductions show the average; a rebuild proves it (same frames at every sampled time, seek order held constant).
- **A sheet's "port" answer can be a page change, not a link.** Card 6 ("bring the progress over") replaced giving colleges a second page; the FAQ already came over in #1806 through `T.publicFaqHtml()`.
- **`pkill -f` on a pattern your own command line contains kills your shell** (exit 144, twice). Match with a bracketed first character.

**Open.** Card 6's port (statewide progress per priority and the condition counts on the explainer); the video round (Sam's four asks of 2026-10-01 evening, in the S313 handoff); the confirmation deadline (Timeline Dec 30, 2026 against `participationDeadline` 2026-11-01).

## 2026-10-01 — S313 (SkyReel): the video round, and the explainer carries the Public view's progress

**Sam's asks** (the S312 evening round, sheet 14 card 6 "port", sweep card 25), shipped in #1809.

**What we learned.**
- **A film's figures come from the engine over a hashed config, and the hash is the proof of the copy.** The sandbox cannot reach Supabase's REST endpoint, so the stored config came through the MCP and was transcribed to a file; a jsonb-order encoder reproduced Postgres's `md5(config::text)` exactly (`e21658f9`, 23,594 characters), which proves every character. The copy is committed as `tests/fixtures/cpl_funding_config_e21658f9.json`; booting the tab over it with `T._setConfig()` and reading the Public view's own cards gave every figure the slide prints.
- **The statewide division is exact; the per-institution one is not.** $12,620,154 ÷ $2,824.82 = 4,467.6 FTES statewide. An institution's target rides its size while its award is clamped between base and cap, so the average target (34.49) is not the average funding over the price (35.14), and the 118 targets sum to 4,366.66. The slide and the explainer state only the statewide division (`cpl_memory` `statewide-target-exceeds-institution-sum-2026-10-01`).
- **A new scene shifts the clock, and a shift function named `L` was shadowed.** `buildK` declares its own `var L`; inside it, `L(48.2)` threw in Chromium (a blank film), and a missed `.map(L)` silenced the score. jsdom never runs `buildK`'s measured path (zero-width stage) or the offline score, so test `m0` reads the source; `render.mjs` now stops on a score with no length rather than capture five minutes of frames over an empty WAV.
- **Prove "frame-identical" with the DOM, not screenshots.** `main`'s build against itself differed at 11 of 41 JPEG frames; the stage's `outerHTML` after each seek matched 82 of 82, and the one real difference it found (a `white-space:nowrap` the narrated kick did not need) was made conditional.
- **Check a layout change on the render page with the render fonts**, every scenario: Scenario 1's third box and its slide's two-line closing sentence overflowed where Scenario 2's fit.
- **`earnAgg()` caches per render.** An API read between a config change and the render that clears the cache returns the old model; `_publicProgress()` clears all three caches first.
- **Student headcount is never a metric** (Sam, 2026-09-15): the baked defaults still carry legacy headcount priorities, so the explainer prints a target only for an FTES priority with a target above zero.

**Rulings (Sam).** The video round's asks are verbatim in the S312 chat and the S313 handoff; card 6's "port"; card 25's wording, adapted to the film's true length (100 seconds, since the slide took it past 90).

**Open.** The confirmation deadline (sheet 15) re-renders the Timing and conditions scenes; Sam's Scenario 2 script for the ElevenLabs voice; the 2.3% gap between the statewide target and the institutions' sum.

## 2026-10-02 — S314 (SkyVerdict): Dec 30 is the confirmation deadline

**Sam's rulings (sheet 16, 00:36Z).** Card 4: **Dec 30, 2026** is the right confirmation deadline (the Timeline's date, over `participationDeadline`'s 2026-11-01). Card 5: keep **$9,759,692** in the video's reported box. Card 3: *"I don't know what cards 23 and 24 are. Advise"* (sheet 17 now shows today's text beside each revision).

**What we did and learned.**
- **The ruling was the authority for the write.** The question was "which date is right"; the config held the date he ruled wrong. `funding-config-edit-apply.yml` wrote Scenario 2's `participationDeadline` from a committed plan (`kb/funding_config_edits_out/2026-10-02`): dry run (1 at before), then commit at 01:46Z under `implementation-funding-s314@bot`, receipt on `main`. The config md5 moved from `e21658f9` to `7e59830b`; the film's money figures are untouched by a date. Moving the date later only softens `partDeadlinePassed()`.
- **A longer date wrapped the conditions heading.** "December 30, 2026" is one character past what the 3.9cqw heading holds; the first `_v6` render put the year on its own line. The heading now shrinks for a date over 16 characters (`3.9 × 16 / length`), so Scenario 1 and the narrated drafts render byte-identical. Caught on the MP4's stills, as the S312 memory row on render fonts says to.
- **Scenario 2's introduction is `_Scenario_2_v7.mp4`** (100.6 s, S316: the target slide prints the institutions' summed target, 4,366.7, and says FTES reimbursement rate); `_v6` left the repo; the explainer links `_v7` and its choices-table fallback reads 30 Dec 2026.

**Open.** Cards 23–24 (sheet 17 card 2: apply, or he types them); card 11's measure texts and card 7's two lines, still his on the tab; the Scenario 2 narration script for the ElevenLabs voice.

## 2026-10-02 — S315 (SkyLedger): the last "model" in the saved text, and where the 2.3% gap comes from

**Sam's rulings (sheet 17, 04:18Z, through 2, both his own call).** Card 2: *"Apply them"*, the model sweep's cards 23-24. Card 1: "Done" (the CER entry; see `docs/partner_crosswalk_lessons.md`).

**What we did and learned.**
- **Cards 23-24 are written.** `funding-config-edit-apply.yml` wrote six paths at 04:52Z (#1815, plan `kb/funding_config_edits_out/2026-10-02-2/`): in both scenarios the Introduction's last paragraph now reads "The Chancellor's Office measures outcomes..." and "CPL funding relies on data in the MAP platform...", and the Timeline reads "CPL Funding Procedure Finalized" and "Guidance Memo Release". Config md5 `7e59830b` → `764fd264`, read back at after. No saved text in either scenario says "model".
- **One plan per directory, so the workflow takes a suffix.** The `2026-10-02` directory already held the deadline plan and its receipt, and rollback reads every receipt in a directory, so a second plan there would have tied the two writes together. The workflow now accepts `<date>-2` to `-9`.
- **`about` is one string, so its before-value is the whole field.** The plan rebuilt the 1,600-character field from the live read and hashed it locally; the md5 matched the live field in both scenarios (`48e7e484`) before the plan was committed, and the dry run read 6 at before.
- **The 2.3% gap is the maximum award.** The engine over the `e21658f9` fixture: with the $400,000 maximum the 118 institutions' Access targets sum to 4,366.66 FTES; with it lifted they sum to 4,467.60, the statewide division, exactly. `prioEntitlement` scales a capped institution's target by `capScale()`, so the seven at the maximum each carry 78.8 FTES (Mt. San Antonio −62.0 of the 100.9); no other target moves. The Access card prints the division and the Statewide row's detail prints the sum, so which one the state publishes is sheet 19 card 2.
- **The built-in `DEFAULT_TIMING` and introduction in `cpl_funding.js` still say "model"** (and "Undispersed ... Rolled"). They render only for a scenario with no saved text, and both scenarios have it; left as inert fallbacks.

**Open.** Sheet 19 card 2 (the sum or the division; "sum" re-renders the film); card 11's measure texts and card 7's two lines, still his on the tab; the Scenario 2 narration script for the ElevenLabs voice.

**Ruled later the same day (sheet 19 card 2, 11:52Z): "sum".** The card, the explainer and the Scenario 2 film print the institutions' summed Access target (4,366.7 FTES on the fixture), the figure at which every institution qualifies for its full award. Built in S316: re-measure over the live config first; the card reads `prioTarget(null, p)` today and the detail sums `earnAgg()`'s `crTarget + ncTarget`.

## 2026-10-02 — S316 (SkyTally): the statewide target is the sum, and the FTES reimbursement rate

**Sam's rulings.** Sheet 19 card 2 (11:52Z): *"sum"*. In session: *"I'll go with you recommendation on script revisions. Stay away from commercial terms like 'price'"*, then *"instead of price per FTES, it should be 'FTES reimbursement rate'"* (`cpl_memory` `sam-no-price-on-funding-surfaces-2026-10-02`, `sam-ftes-reimbursement-rate-term-2026-10-02`).

**What we did and learned.**
- **The live config was rebuilt, not transcribed.** The `e21658f9` fixture plus the two committed edit plans (`2026-10-02`, `2026-10-02-2`) hashed to `764fd264`, the live `md5(config::text)`, once serialized the way `jsonb` prints itself ([methodology note](kb-notes/methodology-rebuild-a-jsonb-from-receipts-and-check-its-md5.md)). The S315 figures held: 4,366.66 summed, 4,467.60 divided.
- **`sysTarget(p, slot)` is the published target** (#1821): each institution's credit target plus its noncredit twin, the terms `earnAgg()` adds for the Statewide detail. The card, the Statewide CSV row and `_publicProgress()` read it; `prioTarget(null, p)` stays where the division is meant. Completion takes it too: same share, same factor, same gap.
- **The sum breaks an identity a test pinned.** Target times rate no longer equals the Total Possible ($12,335,010 against $12,620,154), so p5 now checks "at most", and the explainer's target line says why in one sentence from the payload's `atMax`.
- **The slide carries the difference as arithmetic**: funding ÷ rate − 100.9 = 4,366.7, so every printed figure checks. A fourth row and the longer term overflowed 1920×1080; a screenshot of the render page with the render's own fonts caught it before a 25-minute render. Four rows now set a step smaller; Scenario 1 keeps three.
- **Three traps.** A rendered-text scan must drop `<script>` first (p3c matched `pr.price`). The explainer's `word()` is assigned later in the same painter, so the target line uses its own list. Killing `render.sh` leaves Chrome on port 9333; kill it before the next render.

**Open.** The Scenario 2 script for the ElevenLabs voice (sheet 6 card 1); card 11's measure texts, still Sam's on the tab; Scenario 1's unpublished v4 still says "price per CPL FTES" on its slide (re-render on request).

## 2026-10-02 — S317 (SkyCompass): Sierra narrates Scenario 2

Sam asked for "a script for the scenario 2 video for an ElevenLabs narrator... very simple and focused... a female voice model... the name Sierra on the video", with the music at background level. The script runs 329 words, one or two sentences a scene, over the introduction's own picture (draft 1 had read 430 over Sample College's frames). Sierra is ElevenLabs' premade Bella, read one scene at a time; the clips live in `prototype/funding_video/voice_s2/` (#1823, then this run's PR).

- **An outside service can stop mid-batch.** ElevenLabs disabled the account's free tier after ten reads ("unusual activity... a proxy or VPN"): ten parallel calls from a cloud container. The narration carried the eleventh scene as `pending` with that reason, so the sample shipped with one silent scene and a test that requires the reason. Sam moved the account to a paid plan the same day, which also carries a commercial license; the free tier excludes commercial use.
- **A clip read outside the repo is tied to its text by hash.** `read.text_sha1` makes `narrate.py` refuse a clip whose scene text changed after its read.
- **The background bed, measured on the mix:** her voice about 16.5 dB over the score; -17.4 LUFS integrated.
- **Two fixed checks rested on the old draft.** Check 5b expected the old `?scenario=Scenario%202` address "until it is re-voiced", and a2 matched a one-line label. Each was updated with the change it described.
- **Sam's rulings:** "Narration sounds good to start with"; the explainer's Scenario 2 view links the cut (`_Draft_3`, 2:37). `cpl_memory` `sam-sierra-narration-approved-2026-10-02`.

## Moved from the lane (S328, 2026-10-04)

The lane passed its 20 KB budget; this closed ruling moved here verbatim.

✅ **Kept (Sam, sheet 11 cards 2-4, 2026-09-30):** the Timeline at the prose size; the priority cards keep their boxes; the sign-in form shows to every reader of a college's *Reported expenditures*.

## 2026-10-14 — the funding session beside S392: noncredit's portion, the three boxes, Bold and Italic

Sam's five asks and his note to wire them into Refresh everything (verbatim: `cpl_memory`
`sam-funding-noncredit-portion-and-boxes-2026-10-14`) shipped in #2132, live 22:36Z.

- **Noncredit's portion is a solved weight.** `pool.nc_portion_pct`; blank keeps the teaching mix
  (7.18%). Set, one weight on noncredit FTES enters the size and the split alike, found by bisection,
  inside the one solve and its bounds. 15% needs 2.72; 20% needs 4.23. Method and the measured table:
  [the note](kb-notes/methodology-a-share-target-inside-a-bounded-allocation-is-a-solved-weight.md).
- **The explainer's guard wants an id on every typed copy of a figure.** `funding_model_page`'s
  unpainted-figure check reads `id=` only, so the noncredit total's second copy took its own alias id
  (`f-nc2` through `FIG_ID_ALIAS`), the `l-floor`/`l-cap` pattern. A `data-fig` copy is painted, and the
  guard cannot see it. CI shard 3 caught this on the first run.
- **A test that pins a layout pins a ruling.** The statewide-box check counted Sam's two boxes of
  2026-10-01; his 2026-10-14 ask made the row three. The count moved; its purpose (one statewide figure,
  no staff box) stayed.
- **Refresh everything carries any setting the config holds**, because `render()` clears the caches
  before the subscribers repaint. Test 6a-6g proves it across two windows on one channel.
- **A still-running local file is not a pass.** One local process reached about 62 of 430 test files in
  30 minutes; `xargs -P 6` over the 99 funding, explainer and briefing files finished 98, and the one it
  had not finished was the file CI failed. CI's four shards decide.
- **Sam's calls:** the control he wants is a percentage; *"Keep in mind to wire in the Refresh
  Everything procedure"*; he sets 15% on a Scenario 3 copy himself through the tab (*"It's OK if not; I
  can make the change"*), which keeps the curator edit where the lane says it belongs. Bold in the editor:
  the asterisks show in the edit box and render as bold on the page; a second press of Bold removes them.
- **Parallel sessions:** S392 held the checkpoint, and a `send_message` put #2132 into its handoff 393.
  A third session (the queue, from 22:37Z) then held the next handoff, so this checkpoint wrote only the
  funding files and the shared generated ones.

## 2026-10-15 — SkyHarbor (side session beside S395): the My College view

Sam's asks for "the My College view of Implementation Funding" (verbatim: `cpl_memory`
`sam-my-college-funding-view-asks-2026-10-15`), mocked up first
(https://claude.ai/artifact/FvKVtQkj8z1GFpMtPUj4rm), nine calls answered as proposed.

- **"The My College view" named two pages.** His quoted sentence lived only on the explainer, yet the intro he
  called "a repeat from the explainer" was the tab's. One question settled it: "Both pages". Ask when an ask's
  evidence splits between surfaces; a mockup of the wrong page costs more than the question.
- **The explainer's Timeline had no dates.** The tab's `titles.timing` ("Timeline") retitles the explainer's
  disbursement step through the shared `timing` id, so a section named Timeline held only the two timing
  settings while the dates sat under the outcomes (the 2026-09-15 placement). Read the page under the live
  config before believing its markup's headings.
- **Every redraw re-reads the live folds (the 2026-09-29 fix), so a per-view default needs a view-switch
  exception.** The Internal view's open Introduction carried into the Public view until `render()` skipped
  the re-read for `about` across a switch (`_lastRenderPublic`).
- **A grid with `auto-fit` cannot collapse a track a spanning label occupies.** The priorities filled two of
  three columns; a wrapping flex row fixed it.
- **A sentence moved out of code keeps its code copy as the fallback**, and a source pin on its line breaks
  breaks when the fallback re-wraps: two `college_briefing` checks matched `"...the " + "following..."` and
  failed until they matched the sentence. Pin the words, not where a string literal splits.
- **Sam missed the calls at the foot of a long mockup** and answered in chat, then pressed Complete, which
  arrived as an artifact comment. A mockup's calls want a line at its top saying they are there.

## 2026-10-15 — SkyMeridian (side session beside the queue): one public page, calls back, build handed on

Sam's ask after #2152 (verbatim: `cpl_memory` `sam-one-public-funding-view-ask-2026-10-15`), mocked up with eight
calls (https://claude.ai/artifact/XtrzM3LoNcQfdZRGuFKwWM) and answered the same evening, all his own call
(`sam-one-public-page-calls-2026-10-15`). The build brief: `CPLBrain/decision-sheets/one-public-funding-page/BUILD.md`.

- **The consolidation was half built.** The explainer already kept its own block order (`pubSecOrder`, never set) and
  its fourteen `x_*` passages were its alone; it borrowed only the FAQ, the table introduction and Timeline's title (the
  shared `timing` id). The missing piece is an editing surface on the page, not a second page.
- **The black box is a redraw, measured.** Once a college is opened, My College's `onModelChange` subscriber redraws
  the whole tab on every model update, replacing `#cb-college` seven times in eight seconds; the funding pages' Step 1
  list five times while loading. A MutationObserver counting insertions found it in one run; a reading of the code had
  pointed at the funding page, and Sam's answer put the box on My College.
- **Render a mockup with the anon feeds, not without them.** Answering `map_coordinator_summary`, the contacts and
  the ledger from an anon-role read let every condition show Met or Not yet as a college sees it.
- **Sam overruled two proposals:** the Introduction joins the page beside the Overview (call 3), and the black-box
  fix ships with the rest (call 7).
- **Screenshots spend context fast.** About a dozen full-page images took this session from 15% to 87% of its window
  before the build began; crop to the region a question needs.

## Moved from the lane (SkyHarbor, 2026-10-15)

The lane sits at its 20 KB budget; these moved here verbatim (the fourth, `target_rate`, by SkyMeridian).

✅ **CSU LA stays out by name (Sam, sheet 33 card 2, 2026-10-04):** *"funding is only provided to CCC colleges and campuses. We do have project funding that supports our work with our partners, but no need to focus on that in our materials--also no need to hide it"*. `_build_funding_performance.py` reads `kb/non_ccc_institutions.json` and skips Cal State LA at the row, beside the partners; `tests/funding_origination_test.py` §4 guards it.

⚠️ **EVERY COMBINATOR IN `colHideStyleHtml()` IS A CHILD COMBINATOR** — a descendant one reached into the nested drill-in and hid its third cell for every reader; only `Element.matches()` can see it (`cpl_funding_col_hide_scope`).

**HELD (Sam, 2026-09-12: "Hold, no action"):** the **LWDA partnership** stays undesignated on the (C) card — no register project names it and he chose to leave it; do **not** designate it on inference.

⚠️ **`target_rate` IS DEAD ON BOTH ENDS — LEAVE IT THAT WAY.** `prioTarget()` reads it only on the students path; no control
renders it. Sam had S263's wiring (#1579) REVERTED (#1580): `rate = k/factor` reproduces every target. **Do not rebuild it.**

## 2026-10-15 — SkyLantern (side session beside the queue): the one public page, built

- **A frame taken out of the page reloads.** `render()` rewrites the mount on every remote load, so the Public page
  view keeps its `<iframe>` in place and rewrites only the chrome above it (`renderPagePreview`).
- **The model's subscribers hear before the mount is rewritten** (`notifyModel()` leads `render()`), so the page's
  editor puts nothing inside `#cplFundingMount`: the table introduction's Edit sits just above the table.
- **`.btn{display:inline-flex}` beats `[hidden]`**: a hidden masthead word needs its own `display:none`.
- **A seed read beats a seed write.** `x_about` follows `about` until saved; no shared-config write was needed.

## 2026-10-19 — the side session beside S427: Sam's five interface asks, and the film reads the model

**Sam's words, verbatim** (21:48Z, *"Implementation Funding side job while 427 is grinding on PR harvest"*): *"1. Revise the memo and report generator to rely more on the Explainer text along with KB and other artifacts for the text. For example, rather than lead with AB 123 (last year's bill), lead with SB 135, which resulted in the new funding and Ed Code 78093. 1.1 Make the generated reports and memo editable. 2. Can you add to the refresh all procedure the ability to revise the video and other text based on live info rather than hard coded data? 3. Move the Funding by Institution and its buttons up in the Step 1 box to the right so the user is prompted to select a view after a college. Add hover over instructions for each button. 4. We can delete the button links to restoring default order and funding defaults--I would just create a new scenario and make any changes needed to do that. 5. Move the Scenario selector and text up to the right of the Project selector (save real estate)."*

- **The memo follows the explainer rather than copying it.** The memo's opening (`memo_lead`) reads `x_lede`, the explainer's Overview passage, with "this page" read as "this memorandum", until a curator saves the memo's own. Sam had already edited `x_lede` on Scenario 3 (*"Senate Bill 135 (Chapter 79)…"*), and the memo showed his words on the first render, which is the point: one statutory statement, written once. The alternative, a second house text quoting the statute, drifts the day one of them is edited.
- **Every memo sentence is a passage; the figures are never text.** Nineteen `memo_*` passages under `TEXT_BLOCKS` (`rich`), rendered through the My CPL Funding passages' mode (`richPlainToHtml(…, "mc", figs)`), so `{to institutions}`, `{deadline}` and `{seed grant}` fill from `memoModel()`. The priorities, their strategies and the allocation table stay generated: a passage there would freeze a card the dials have moved. The editor sits under the document on the Report sub-view, where the curator is looking, and the document redraws on save.
- ⚠️ **A guard that pins a sentence pins its line.** `cpl_funding_earn_retired` exempts one student-sense sentence by its text (*"documenting the CPL they earn in the"*) and skips the LINE that carries it; the rewrite kept that phrase on one source line inside `memo_history`. A sweep that re-wraps the house text breaks the guard without changing a word a reader sees.
- ⚠️ **A test that reads `document.body.textContent` reads the scripts it appended.** The first guard for ask 4 searched the body for "Restore the default section order" and found the source's own comment. Read the mount.
- **The film's figures were stale, and nothing said so.** The introductions were typed from config `e21658f9` (2026-10-01); the published scenario moved to Scenario 3 on 2026-10-15 (noncredit 15%) and Completion moved from `ptc_u` to `p3_u`. `scripts/funding_video_figures.js` files the model's answer per scenario (`figures.json`, stamped with the md5 a SQL read gives: jsonb prints keys sorted by length then bytes with `", "` and `": "`, reproduced in the script so the stamp matches the fixture's name); `build.py --check` reported, first run: the average splits $181,816 / $32,085, targets 4,268.6 FTES, the average Access target 31.3 FTES behind $90,908, and Completion counts transcribed units without the counselor step. **Refresh everything** now reads the file and compares; the splash hands over the command rather than claiming a render.
- **The narrated cuts keep what their voice speaks.** `n1`/`n2` are made from the typed values before `figures.json` is read, so a rebuild reproduces the frames the voice was laid out on; `--check` says a narration needs a new read, which is a different act from re-rendering.
- **The view switch moved into the Step 1 box as Step 2.** The box's `<select>` survives every redraw (call 7, 2026-10-15), so the buttons beside it are redrawn on every patch; a button that survived would hear each click twice because `wire()` adds a listener per render.
- **The strip never wraps a block under the other.** `flex-wrap: nowrap` on the strip, `flex-wrap: wrap` on each block, the scenario block `1 1 18rem`: the published sentence drops under its selector when the window is narrow, and the phone rule (≤640px) still stacks. Measured in Chromium at 1440 and 390.
- **Two controls retired, one kept.** Reset scenario to defaults and Restore the default section order are gone (a new scenario is the way to start over); the locked what-if's Reset exploration stays, because it clears a private overlay, never the shared model.

## 2026-10-20 — the side session beside S438: the view first, and the outcome cards follow the institution

**Sam's words, verbatim** (~16:49Z, *"While another session is working on PR harvest, I need a few more changes on the Funding tab"*): *"1. Refine the Step 1 and 2 by having the user select first which view they want: "All Institutions" or "My Institution" (note that I'm using Institution rather than spelling our "College or District" to save space...but the hover over should clarify this 2. Once a view is chosen, if user selects My Institutions, require them to choose one (either college or district) 3. For the Funding Outcomes section, adjust the numbers to match the selected institution rather than the whole state (if an institution is selected)"*

- **One function adds an institution into the priority figures, for both scopes.** `earnAgg()`'s loop body became `addInstPrios()`; the statewide cards sum it over the roster and a chosen college or district sums it over its members. The test asserts the identity outright rather than re-deriving a figure: every institution's lanes (`_prios` + `_ncPrios`) add up to the statewide target and Total Possible.
- ⚠️ **`_publicProgress()` re-solves the model on every call (~0.9 s in jsdom),** because it clears the caches for a caller reading between a config change and a render. A test that called it once per college took 2.5 minutes; the identity reads the cached per-institution API instead, and the scoped path runs on four colleges chosen for the rule each bites on (both lanes, credit only, quarter calendar, the maximum award).
- **The remembered choice now returns before `render()` notifies.** It returned after, so the explainer's first paint drew statewide cards and only a later paint corrected them.
- **A renamed button renames the sentences that name it.** Three My CPL Funding sentences said *"under All institutions"*; the live config held no saved copy, so the house defaults changed with the button.
- **The list stays in the box, hidden, under All Institutions.** Hiding the column rather than removing it keeps the one `<select>` call 7 protects.
- ⚠️ **Renaming rendered text: grep every test for the old words before the push.** Five suites were updated for *All institutions* → *All Institutions*; a sixth (`college_briefing_funding_sync`) pinned the same sentence and turned CI shard 3 red. `grep -rn "<old words>" tests/` would have named all six.

## 2026-10-20 — S439 SkySaltbush: JST counts, help links, Funding Model Numbers, and the film that stuck on three priorities

**Sam's asks, verbatim in substance** (two marked screenshots): delete the struck text; *"add the current JST count on MAP or the college and the number of enrolled vets according to MIS and number needed to hit 75% for the qualifying step"*, on both the seed and the implementation card; the Coordinator's How to meet it links office hours and notes *"they can get quick help by using the chat feature on the MAP Dashboard"*; the Contents gains office hours and the selected college's CPL Landing Page, with a hover recommending office hours and the training video (youtube xW0I6iFgRuk); *"Change title on all views for section What is a choice, and what is a given to Funding Model Numbers"*; Step 1/2 fonts agree and *Choose another institution* moves beside the Step 2 title. Then: *"The 100-second video is an old version with the 3 priorities instead of 2"*, and *"I don't need the voice over version."*

- **The counts were already in the feed.** `funding/_build_funding_performance.py` writes `vet_jst` (vets, jst, pct, masked under the floor); `jstNeedWords()` adds the 75% need. Nothing new to build upstream.
- ⚠️ **The explainer's first paint reads Scenario 1.** It paints before the live config loads; a per-scenario lookup with no reset on a later paint kept the three-priority film after Scenario 3 was published. The first fix (key the default to the published film, Scenario 1 named) passed every test and still failed for Sam: the switch fired on the first paint. Removing the switch fixed it. A rendered check in a real browser after the config loads would have caught it; the jsdom tests paint once.
- **The film is built, not live.** `funding_in_motion_s2.html` and its MP4 carried Scenario 2's figures (Completion "with the MAP counselor step checked", 34.5 FTES) until `build.py s2` and `render.sh s2` ran (5 minutes in the cloud sandbox with `/opt/pw-browsers/chromium` and the system ffmpeg). Three tests pinned the old numbers; they now read the film's config or `figures.json`.
- **A Supabase MCP write hangs on the English word for removing a table.** S438's three timed-out `cpl_memory` writes and S439's first two all carried it in prose; rephrased, they landed at once (`cpl_memory` `supabase-mcp-write-hangs-on-the-word-2026-10-20`).


## 2026-10-22 — the side session beside S448: the noncredit share without LocID2

**What Sam asked** (verbatim: `cpl_memory` `sam-noncredit-funding-outcomes-2026-10-22`; the vault braindump of the same hour). The team's feedback moved him off the `LocID2` plan: *"turns out we don't have a reliable way to do that...and won't for a while...so...the idea is to continue using the same funding based on their share of the FTES but ask them to achieve basic outcomes that aren't measured in FTES and set their current funding based on their outcomes."* Two outcomes of his (a noncredit CPL coordinator leading a strike team, attested, the coordinator on the landing page; exhibits for the program's mirrored courses, industry certifications, portfolios and noncredit credit, at least 5% of its noncredit courses), a third asked of us, and *"Is there any analysis you might be able to do on the second metric to see if it is feasible or appropriate? 5% is just my guestimate."*

**What the model does today, which is what changes.**
- `METRIC_SOURCES` pins the noncredit lane to the origination rungs (`nc_pe_u` / `nc_pa_u` / `nc_pt_u` / `nc_ca_u`), `ncPriorities()` re-points credit's two priorities at them by milestone, and `earnFraction()` answers `undelivered` (f = 0, never an advance, N2 b) while the daily pull carries no `LocID2`. So every noncredit share reads $0 released and the whole $3,786,046 held (Scenario 3, 15%, config 9c944a82 of 17:32Z).
- The noncredit-only three carry a third condition in place of the veteran JSTs, *noncredit certificates posted as exhibits* (N1 a), scored by the builder's F1 feeder count.
- The words that say origination: the explainer's *How noncredit funding is calculated* (`nc-body`), `nc_rules`, the FAQ, `mc_nc` on My CPL Funding, the NC-only chip and expand, the CSV header, the film's figures. The drill-in's noncredit table is in FTES columns (`prioDetailTableHtml`).
- The builder emits `nc_*` only when `LocID2` is in the pull; the `pool.nc_threshold_ftes` dial (300) is stored and read by nothing since one-pool.

**The measurement** (`funding/nc_outcome_feasibility/2026-10-22/`; the model under config 9c944a82 joined to `chatbox_college_courses` by COCI funding category, `coci_college_programs`, `chatbox_exhibits`): 111 of 118 institutions carry a noncredit share; 45 hold under $10,000 ($204,308 together), 10 hold over $100,000 ($1,979,638). COCI noncredit courses at the 111: 11,390 (median 75, p90 225, max 460 at Santa Barbara City); CDCP (enhanced funding: ESL, basic skills, short-term vocational, workforce preparation) 7,129 (median 39, max 310 at SD Cont. Ed); non-enhanced (parenting, older adults, home economics, health and safety, disabilities, immigrant education) 4,261, where a credit counterpart rarely exists. Title-identical credit and noncredit courses at the same college, CDCP: 1,212 (median 4, p90 31, max 80 at Long Beach; Saddleback's are ESL levels, Canyons' are fire officer courses, Monterey's the bakeshop series). Credential-like CDCP titles: 991 (median 5). MAP exhibits: 2,301 rows at the 111, median 1; 56 institutions hold none ($1,703,114 of noncredit share). Exhibits each rule requires per institution and statewide: 5% of all noncredit courses, median 4, p90 12, max 23, 623, 17 institutions above their own mirrored plus credential-like supply; 5% of CDCP, median 2, p90 9, max 16, 406, 6 above; 10% of CDCP, 759, 14 above; the greater of 2 and 5% of CDCP capped at 10, median 2, max 10, 428, 19 above (the floor at the smallest programs). Threshold 300 noncredit FTES: 42 institutions at or above hold $3,246,934 and need 235 exhibits under the capped rule, 37 have the supply in their own catalog, 16 hold no exhibit of any kind; 69 below hold $539,112, the largest $27,623. `map_coordinator_summary()` at 17:42Z: 55 of 124 rows with a coordinator, 49 with all three parts; NOCE has a primary contact and a landing page and no coordinator. Trainer tags: 67 of 2,446 unified titles name a high school, ROP or adult school; none names a college noncredit program.

**The proposal (Open Asks Sheet 113, five cards).** The noncredit lane takes the credit lane's shape: conditions gate it (a noncredit CPL coordinator named and published; a strike-team attestation renewed each year, the Confirm flow's shape with the reviewer's Confirm and Reject), two outcomes split it 50/50 and release toward their targets as the credit priorities do, frontloaded, the remainder rolling forward: NC-1 exhibits built or adopted for the program's own learning (the greater of 2 and 5% of CDCP noncredit courses, capped at 10; adopted statewide exhibits count; the same target both years), NC-2 students awarded credit through those exhibits (one by the end of Year 1, ten in Year 2, ten being the smallest count the public page prints), measured from MAP's per-exhibit transcriptions, so no `LocID2`. Programs under 300 noncredit FTES ride the credit lane (the dormant dial). COBI takes the attestation now and publishes the coordinator beside the CPL coordinator; *Noncredit CPL Coordinator* joins the standing request to Pedro and the check cuts over to `map_coordinator_summary()` when MAP carries the role. Built as Scenario 4, a copy of 3, published when he says. The thinking doc's §11 ladder of 2026-08-05 (NC-1 standing articulations, NC-2 credit awarded through them, NC-3 landing-page requests) is the same order; this run read it before proposing.

**Build notes for the session that gets the rulings.** (1) Two new sources in `METRIC_SOURCES`, `nc_exh` (count, lane nc) and `nc_exh_used` (students, masked under 10), emitted by `_build_funding_performance.py` from the daily exhibit pull where the exhibit's training agency names the noncredit program (the F1 resolver's convention, extended to in-college programs as *<College> Noncredit*), with the CDCP course count per college from the COCI sync as the denominator. (2) `ncPriorities()` takes its own `src`, `unit: "count"` and a `target_rule` per scenario instead of the milestone pairing; `prioTarget()` and `prioDetailTableHtml()` learn a count lane (Outcome · Target · Actual · Max Funds · Actual Funds · Difference). (3) The attestation: a `kind` on `cpl_funding_participation` or a sibling table, through the Governance map and the privacy ADRs first (Rule 10 a3; names publish as the CPL coordinator's does). (4) The words: `nc-body`, `nc_rules`, the FAQ, `mc_nc`, the NC-only chip and expand, the CSV, the film (`figures.json` re-filed). (5) Guards to extend: `cpl_funding_nc_portion`, `cpl_funding_outcome_cards`, `cpl_funding_statewide_expand`, `my_cpl_funding_words`, `funding_model_page.test.js`, `funding_origination_test.py`. (6) The open-asks series record in `cpl_library` still reads version 61, last edited by Sam; sheets 62 to 113 never updated it, and this run did not either.

**What bit.** The MCP's result file is the tool text wrapped in JSON with a `result` key, and the block inside the untrusted tags is JSON-escaped: parse the wrapper, then the block. `scripts/funding_effective.js` needs `npm install` first in a fresh container (jsdom), and a script outside the repo must require the repo's `node_modules/jsdom` by path. The roster's short names join COCI's spellings by token subset with four overrides (West Hills Coalinga and Lemoore, LA Swest, Calbright).

## 2026-10-22, later the same session: Sheet 113 answered in minutes, and the count he asked for

**His rulings (18:46-18:51Z, reviewed through 5).** Card 2 floor-cap, as recommended. Card 4 none: no threshold, against the recommended 300 noncredit FTES line, so every one of the 111 institutions with a noncredit share meets the noncredit conditions, the 23 under $5,000 included. Card 5 cobi-then-map, as recommended. Cards 1 and 3 without a verdict, with two notes (verbatim in `cpl_memory` `sam-sheet-113-rulings-2026-10-22`): MAP cannot count the noncredit students awarded credit through an exhibit, because the exhibit ID is shared with the credit students who use it, which is what `LocID2` was for; and noncredit programs at credit colleges source no exhibits of their own and keep no landing page of their own, only the standalones do. Then in chat: *"sheet answered but needs more analysis from you based on my notes"*, *"I like the way you narrowed to CDCP"*, a third candidate outcome (a noncredit CPL portfolio-development course the program creates and offers; *"somewhat uncontrollable becasue if would require buy in from the credit faculty"*), and *"SDCCD also does a good bit of Cx for NC students in their continuing ed college."*

**What the data says about the count.**
- The daily MAP pull carries the internal MAP student id and no CCCID (`_build_funding_performance.py`, `_student_detail_local.py`), so a Chancellor's Office match of MAP transcriptions to MIS noncredit enrollment needs MAP to export CCCID first (a Pedro ask, smaller than `LocID2`: an export of a field MAP holds rather than a new one). The college's own SIS holds both its noncredit enrollment history and its CPL transcriptions, so the college can count former noncredit students awarded CPL credit today and report it.
- Santa Ana already titles its credit-by-exam exhibits with the noncredit course itself (*VCNST 101: Introduction to Welding* to WELD 101; *VAUTO 668* to automotive): 15 exhibits under noncredit-only subject codes, 4 of them in the credit table, none applied or transcribed yet. An exhibit built that way is used only by the noncredit completer who holds the evidence, so its count is pure; no other college does it.
- Exhibits whose sample credit course mirrors a noncredit course at the same college: 82 at 14 colleges (Cabrillo 33, Santa Ana 19, Las Positas 9, Norco 5, De Anza 3), none showing a transcription (masked counts read as none). Industry-certification exhibits serve credit and noncredit students alike and carry no origin.
- Noncredit courses with *portfolio* in the title: 13 at 11 colleges, discipline portfolios (fashion, photography, early childhood) all but Lassen's AJ 150 *College Success Skills and Credit for Prior Learning* (workforce preparation). The thinking doc's §10 course does not exist yet in COCI anywhere, so the outcome starts from zero everywhere.
- SDCCD's three credit colleges hold 96 exhibits, 65 of them credit by exam, none titled to the continuing-education college, so its Cx for continuing-education students runs through MAP untagged if it runs through MAP at all; COCI lists SDCCE's courses under its own name, so a standalone's mirrored candidates are a district-wide join.

**The revised proposal (Open Asks Sheet 114).** Conditions gate the noncredit share as before. Two funded outcomes the program controls: NC-1 exhibits built or adopted (his ruled target), counted through four channels (the noncredit-titled exhibit, the target course that mirrors a noncredit course, the credential the program prepares for, the strike team's attested list; for a standalone, at the district's credit colleges); NC-2 a noncredit CPL portfolio-development course approved in COCI by the end of Year 1 and offered in Year 2. The student award count becomes a reported card on the annual attestation (the college's SIS count), funded only once the CO match or a MAP CCCID export makes it measurable. The fourth card asks whether to add the CCCID export to the standing MAP request and put the MIS match to CO research.

**The CDCP question (Sam, ~19:02Z: *"See if the NC counseling (portfolio) course would qualify as CDCP"*, *"maybe if the protfolio course were required for certain CDCP NC certs..."*, *"The PCAH would probably be the best resource for CDCP info"*).** Read from the Chancellor's Office copy of the PCAH 8th edition (cccco.edu; the college-hosted copies did not resolve from the container) and 5 CCR §55151 on law.cornell.edu. The handbook puts the condition on the program: *"Once a program is approved and chaptered, the noncredit courses that comprise a CDCP program will be eligible for enhanced funding"* (p. 140), in four categories (basic skills, workforce preparation, short-term vocational with high employment potential, ESL); Workforce Preparation is *"instruction for speaking, listening, reading, writing, mathematics, decision-making and problem-solving skills that are necessary to participate in job-specific technical training"* (p. 118; CB22 J, CB24 program-applicable). §55151(b) names the two program outcomes: a Certificate of Completion *"leading to improved employability or job opportunities"*, or a Certificate of Competency that *"prepares students … to take degree-applicable credit coursework leading to … completion of a credit certificate; an associate in arts degree; or transfer."* So the course qualifies two ways: required in a short-term vocational Certificate of Completion (his idea; CO review and labor-market evidence those programs already carry), or as a two-course Certificate of Competency, *CPL pathway*, whose stated outcome is the one (b)(2) names. COCI today: 167 CDCP noncredit courses at 54 colleges teach career exploration, college success or job readiness under enhanced funding; 1,952 of 2,632 active noncredit programs at 99 colleges are mostly CDCP; the CPL portfolio course itself exists nowhere (13 portfolio-titled noncredit courses are discipline portfolios; Lassen's AJ 150 is the one CPL-named course). The thinking doc's §10 verification item (a) is closed. A September 2026 memo (ESS 26-62) moves noncredit to CIP codes with CDCP-eligible programs aligned to their category through June 2027, the noncredit CIP categories lane's business.

**Sheet 114 answered (~20:08Z, reviewed through 4; `cpl_memory` `sam-sheet-114-rulings-2026-10-22`).** Cards 1 to 3 as recommended: exhibits and the CPL portfolio course are the two funded noncredit outcomes, the student award count reported on the attestation, the four counting channels, the course chaptered by the end of Year 1. Card 4 held: *"We’ll take this one as a long term integration request with CCCApply."* No card is open; the lane carries NEXT: build Scenario 4.

## 2026-10-22 — the side session beside S449: Scenario 4 built

**What Sam asked.** ~20:26Z, to the funding side session: *"go ahead and build Scenario 4"*. That session was at its context line and handed the build on (`cpl_memory` `sam-build-scenario-4-go-2026-10-22`). This session opened on the S449 line nineteen minutes after SkyBuckwheat, agreed one writer per file with it (it kept the harvest queue and handoff 450), and took the build.

**The shape, and why each call went the way it did.**
- **A scenario setting, not a global change.** `ncLane: "outcomes"` on the scenario; unset, the model is the origination lane of Scenarios 1 to 3, byte for byte. The published page is Scenario 3 and must not move until he publishes 4, so the mode could not be a code default.
- **Counts, not FTES.** The credit priorities are priced (target = funding ÷ rate); the noncredit outcomes are counted, so `unit: "count"` is the seam every shared helper branches on: `prioTarget` reads the rule first, `earnFraction` converts nothing, `prioUnitLabel` says *exhibits*. The target rule lives in the scenario (`pct_floor_cap`: floor 2, 5% of `nc_cdcp`, cap 10; `fixed`: 1), so the rule he ruled is data a curator can read, never a number in code.
- **Its own list, not the twins.** `ncPriorities()` was built index-aligned with `priorities()`: `addInstPrios` writes `perPrio[i]` for both lanes, the drill-in pairs `ncPs[i]` with credit row `i`, `scopeProgress` adds `crTarget + ncTarget`. An outcome that is not credit's twin cannot ride those paths, so the outcomes lane gets `perNc`, `ncOut` and rows of its own, and `ncPriorities()` returns the outcomes only to the consumers that never assumed alignment (the pay loop, the share sum, `sysTarget`, `_ncPrios`).
- **The credit cards' Total Possible.** `prioCap(sp.w, …)` on a credit card quietly carried the noncredit money because the twins shared credit's shares; under the outcomes lane the credit cards take `sp.cr` and the noncredit cards carry the rest, and the two add up to what the one card family showed before (guard B10).
- **The gate is per lane.** One `baselineGate` held the whole award. Now `collegeAlloc` holds by lane: the credit share on the credit conditions, the noncredit share on `ncLaneGate` (the confirmation, the noncredit coordinator, the strike team). A standalone's list *is* the lane's, so its pie and its gate agree by construction (`baselineGate` reads `eligReqList` once instead of re-deriving two of its items).
- **The sum rule.** Statewide, a count target is the institutions' targets added up, as Sam ruled for FTES on sheet 19; `countTarget(null, p)` sums, and reads TBA while no institution's denominator has landed.
- **Never an advance.** A count outcome whose measure the feed lacks reads undelivered; one whose target waits on a denominator the feed lacks for that institution reads undelivered too (a new branch before the `target <= 0` reading, which would have printed *none*); an outcome with no pin is pinned to `nc_unmapped`, the loud bad_src $0, so a wording can never resolve the noncredit share onto a credit measure.

**What bit.** The roster spells *Mt San Antonio* and *Santa Barbara*, without the dot or the *City*; a smoke that typed the display names got `null` from `rosterRow` and read it as a model fault. A pending gate releases and a read-and-empty one holds: the attestation view missing (a 404) leaves the noncredit conditions pending, which holds nothing, so the measures are what keep the money at $0 until the builder emits them; the day the view exists and is empty, the conditions read not met and the share is held. The explainer paints from the payload alone, so the lane reaches it through `buildPayload` (`ncMode`, `ncOutcomes`, `ncRule`, `ncReported`, `ncCondWords`) and `_publicProgress` (`ncPrios`, the two extra `conditions` entries), never through a second rendering.

**Left for the next session.** The builder (`nc_exh` through the four channels, `nc_cdcp` for every roster institution, `nc_course` from the attested control number confirmed in COCI), the attestation surface (table, form, reviewer Reject, the `_pub` view; Governance DR-09 and the privacy ADRs first), the film's figures once he publishes, How to meet it for the two noncredit conditions.

## 2026-10-22 to 23 — S450 (SkyMariposa): Scenario 4 on Sam's screen, the county line, Sheet 115

**The deploy and the browser.** Sam reviewed Scenario 4 minutes after #2362 reached Pages (22:18Z) and saw the origination twins and no outcome cards: his tab held the script from before the deploy, and Pages caches `cpl_funding.js` for ten minutes (`cache-control: max-age=600`, no cache-busting on the script tag). The config was right (four scenarios, Scenario 4 with `ncLane: outcomes`, two outcomes, one reported line; Scenario 3 published). A reload answered it. Check the deployed script (`curl` the Pages URL and grep the new key) before reading a screenshot as a build defect.

**The county line is gone (Sam, 2026-10-22: "you can delete the line about county residents"; #2363).** Every drill-in's closing row printed the county's working adults and the district after the lane's rule; the district name went with the line, the county keeps its hidden column, the search and the CSV. Guard in `cpl_funding_scenarios.test.js`.

**Sheet 115 (#2364, CPLBrain#439; S449 built one card, S450 added Scenario 4's two auto-mark cards and published it).** Sam answered it 2026-10-23 12:23-12:26Z: card 1 remove, cards 2 and 3 keep, each his own call (`cpl_memory` `sam-sheet-115-rulings-2026-10-23`). Cards 2 and 3 are recorded in the lane as kept (#2377). Card 1 went to S455, the harvest queue's writer that morning, with a live read taken at write time: of the card's 25 rows, 16 were still stale, 7 Sierra rows had been re-filed, 2 were alive again after that morning's Sierra read, Victor Valley 38852 was already gone, and five rows of the same kind had appeared since the card (never asked, so a card on the next sheet). A card's count is the day it was built; re-measure before a delete.

**Two runner facts worth a line.** `supabase-migrate.yml` skips a head commit whose message starts with "Merge" (a `git pull` merge hides the `.apply` change; push the pointer on a plain commit), and `cpl_memory.summary` is checked at 400 characters (the first apply failed on 593; the rest rides `detail`).

## 2026-10-24 — S466 (SkyYerbaSanta): the introduction film under Scenario 4, and a pending gate that releases

**What prompted it.** Handoff 466's third item: Sam published Scenario 4 on the tab (2026-10-23 22:06Z) and the introduction link still played the film built from Scenario 3. The handoff's test: if only figures moved, rebuild and render; if the film's noncredit words describe origination, put a draft on the sheet.

**What the check found.** `build.py --check` over the live config (md5 8452c29a) moved fifteen figures in s2. Under the outcomes lane each priority's funding is credit alone, $10,727,131 statewide against Scenario 3's $12,620,154, so each target falls from 4,268.6 to 3,598.2 FTES, and the confirmation deadline reads December 31. The average allocation and the average Access target (31.3 FTES, $90,908) did not move: they were always credit. The words moved too. The reported box said *the institutions' allocations follow Access and Completion*, true under origination, where the noncredit twins ride the same shares, and false under the outcomes lane, where the noncredit share releases on exhibits and the portfolio course. So the rebuild became Open Asks Sheet 123 card 2, with two draft frames.

**The shape.** `_videoFigures()` now files `ncLane` and each outcome's statewide funding (`agg.perNc[i].ncCap`); the priorities and the outcomes add up to the funding to institutions ($21,454,262 + $3,786,046 = $25,240,308). `build.py` composes the words from the filed figures (*carry the credit funding*, *The credit allocations follow*, `ncLine` from `NC_COUNTS`), and the source reads `CFG.ncLine` with the original sentence as its default, so an origination build keeps its words. Four boxes would not fit the priorities scene (three columns at 30.8cqw, the arrow's keyframes visit three), so the noncredit outcomes are named in the scene before rather than given a box.

**What bit.** The 39-character heading wrapped and hid *funding* behind the boxes; it now shrinks past 36 characters, the precedent the minimum conditions date already set. The longer reported text pushed its statewide figure down; *The credit allocations follow* is shorter than the original. And `funding_model_page` p3b compares the committed film with `figures.json`'s published scenario, so the filed figures and the rebuilt film have to land together. The PR kept `figures.json` on Scenario 3 until Sam answers.

**Getting the live config.** The config is about 74 KB, and the sandbox cannot reach supabase.co. Hashing each level in SQL (`left(md5(value::text),10)` over `jsonb_each`) and locally (the script's `pgJsonbText`) found the differences from the 10-19 fixture in four queries: about 5 KB of values, patched onto the fixture, with the full md5 matching the live row (`cpl_memory` `procedure-live-config-by-hash-diff-2026-10-24`).

**The pending gate.** The lane said the noncredit conditions, pending until the attestation view exists, *neither hold nor release*. `ncLaneGate` returns `blocked: false` when pending, and only blocked withholds, so pending releases, as the 2026-10-22 build notes above already said. The builder (`nc_exh`, `nc_cdcp`, `nc_course`) must therefore land after the attestation surface, never before, or colleges would see released noncredit funding with no condition met. The lane's NEXT now puts the surface first (`cpl_memory` `pitfall-nc-pending-gate-releases-2026-10-24`).

## 2026-10-24 — S466, the hand-opened run beside the routine's: the film's words under Scenario 4, and a pending gate that releases

**Two runs, one number.** Sam opened this session at 12:21Z with a stale greeting (*Session 461, SkyManzanita*); handoff 466 named SkyYerbaSanta, and his routine had started a second S466 at 12:12Z. `list_sessions` omits routine-fired runs, and the routine's PR opened after this run's 12:24Z read of the open PRs, so each worked handoff 466's third item without the other. The routine's run shipped v9 (#2417, above); this one found it at 13:05Z, merged `main`, and carried its own work on top.

**Where the two runs differ: the words.** The routine's run judged the words unchanged, since the noncredit scene already says only noncredit outcomes count toward the noncredit share. That sentence holds. Two others do not. The reported box says *the institutions’ allocations follow Access and Completion*, and the heading says *Two priorities carry the funding*: true under origination, where the noncredit twins ride the same shares, and false under the outcomes lane, where the boxes now add to $21,454,262 of the $25,240,308 and the noncredit share follows exhibits and the portfolio course. So the draft says the priorities carry the *credit* funding, ends the box with *The credit allocations follow*, and names the two outcomes in the scene before (`ncLine`). New words on a public film are Sam's call: Open Asks Sheet 123 card 2.

**The shape.** `_videoFigures()` files `ncLane` and each outcome's statewide funding (`agg.perNc[i].ncCap`); `build.py` composes the words from the filed figures (`NC_COUNTS`); the source reads `CFG.ncLine` with the original sentence as its default, so an origination build keeps its words. Four boxes would not fit the priorities scene (three columns at 30.8cqw; the arrow visits three), so the outcomes are named in the scene before. The 39-character heading wrapped and hid *funding* behind the boxes; it shrinks past 36 characters, the precedent the minimum conditions date set. `figures.json` stays as v9 filed it, without `ncLane`, so Refresh everything reads the film as origination against the model's outcomes, which is what the film says until the words are rebuilt.

**Getting the live config.** It is about 74 KB, and the sandbox cannot reach supabase.co. Hashing each level in SQL (`left(md5(value::text),10)` over `jsonb_each`) and locally (`pgJsonbText`) found the differences from the 10-19 fixture in four queries, about 5 KB of values; patched onto the fixture, the full md5 matched the live row (`cpl_memory` `procedure-live-config-by-hash-diff-2026-10-24`).

**The pending gate.** The lane said the noncredit conditions, pending until the attestation view exists, *neither hold nor release*. `ncLaneGate` returns `blocked: false` when pending, and only blocked withholds, so pending releases, as the 2026-10-22 build notes above said. The builder must land after the attestation surface, never before, or colleges would see released noncredit funding with no condition met; the lane's NEXT now puts the surface first (`cpl_memory` `pitfall-nc-pending-gate-releases-2026-10-24`).

**Sam's answer (Open Asks Sheet 123, 13:17Z, both his own call).** Card 2 *adopt*: `figures.json` re-filed with the lane, s2 rebuilt in the new words and rendered as v10, v9 retired. Card 1 *list* (the library lane's ELL IET page) rode the same PR as a guarded listing receipt.

## Moved from the lane (S468, 2026-10-24)

Settled sections of `docs/reference/lanes/implementation-funding.md`, moved verbatim when the lane passed its 20 KB budget (the lint's `oversized_doc`).

✅ **The memo's Word file keeps its format (Sam, 2026-10-22).** The export walks the document as the browser holds it (Chrome's `<div>` lines, `<br>`, label spans) and carries the memo's styles; the Contents and the memo page offer it (`memo/?download=word`). ⚠️ **Text typed into the Report view's document is export-only**; a lasting edit goes in *The memo's text* (**Edit the memo's text**). Guard `funding_memo_docx`.

✅ **The funding page's help and figures (S439, 2026-10-20).** The seed JST outcome and implementation condition 3 print the JSTs in MAP, the enrolled veterans MIS reports and the JSTs that reach 75% (`jstNeedWords()` over `perf().vet_jst`; a masked count prints nothing). The Coordinator's How to meet it (`mc_how_coord`) names office hours and the MAP Dashboard chat. The Contents ends with the introduction, office hours, the college's landing page (`CPL_FUNDING_TAB.landingPage()`) and its training video. *What is a choice, and what is a given* is **Funding Model Numbers**. Guard `funding_jst_counts_and_help`.

✅ **The view first, then the institution (Sam, 2026-10-20).** Step 1 is the view, *All Institutions* · *My Institution* (`VIEW_ITEMS`; hover: "An institution is a college or a district"); Step 2, the chooser, shows under My Institution alone (`.cplfund-step1-pick[hidden]`), no figures until one is chosen. With one chosen, the Funding outcomes are its own: `scopeProgress()` sums `addInstPrios()` (a district = its colleges); quarter units for De Anza and Foothill. Guards `cpl_funding_step_two_view`, `cpl_funding_outcomes_follow_institution`.

## S468 SkyMatilija (2026-10-24): Sam's four funding asks

- **Why Sam saw no edit fields on the NC cards.** `ncOutcomesSectionHtml()` set `ro = publicMode() || !unlocked()` while
  `prioritiesHtml()` sets `ro = false` for the credit cards beside them, whose edits go to `activeOverride()` (the team's
  config signed in, a what-if signed out). Two card families on one tab read as one editor; editability follows one rule.
  The NC cards now follow the credit cards' and carry the editors they lacked (measure, target rule, Serves, strategies).
- **An NC edit replaces the whole year's list.** `setNcOutcome()` copies `ncOutcomeRows(slot)` and writes the array into
  the active layer, so a test that passes a fixture object to `T._setShared()` shares its arrays with the model and a
  later edit rewrites the fixture (G2 and G3 read Sheet 113's target from the edited copy until the test cloned it).
- **`parseNum("two")` is 0.** It strips every non-digit before `Number()`, so free text becomes zero; the target-rule
  fields require a digit before they parse.
- **Cabrillo, counted** (`funding/nc_outcome_feasibility/2026-10-24_cabrillo/`): NC-1's mirror channel (an exhibit whose
  target credit course has a CDCP twin by `title_norm`) counts 33 exhibits against a target of 9, and Cabrillo numbers
  its twins 400 above the credit course. Statewide 4 of 102 colleges meet on it. 61 exhibits carry no `exhibit_id`, so
  a distinct count keyed by id alone drops them (29, then 33 once keyed by id or title). NC-2: COCI confirms a named
  control number and cannot find the course by title; two Cabrillo "portfolio" courses are professional portfolios.
- **The coordinator sources.** The credit condition, the landing page and Sierra's cascade read MAP's College Contacts
  `CPL Coordinator` fields (56 of 124 colleges filled, 2026-10-24); the noncredit condition reads COBI's attestation row.
- The NC outcomes test runs about 2.5 minutes locally; run it alone rather than the full `npm test`.


## S470 SkyBlueCurls (2026-10-25): the noncredit attestation surface

- **What shipped** (#2433, `kb/supabase_cpl_funding_nc_attestation.sql`): one row per college and fiscal year, attest-first
  as the participation opt-in, the CO's Reject then Re-confirm or Remove; the published view carries the coordinator's
  name and title, the year, the status and the dates; the review RPC carries the rest. The view keeps this fiscal year and
  the next (`cpl_funding_fy()`, July to June), so *renewed each year* is the view's filter and no session has to remember it.
- **A `security_invoker` view over column grants cannot leak a column.** Revoke table SELECT from anon and authenticated,
  grant back the published columns, and the view runs with the reader's own grants: a view that names a hidden column
  fails for anon instead of showing it. The test pins the view's columns against the grant list and the page's `select=`
  against the view's.
- **`tests/cpl_funding_equity` forbids the string `coordinator_email` anywhere in `cpl_funding.js`.** The first build
  collected the noncredit coordinator's optional email and failed that guard. The email came out: the condition needs the
  name, the attestor's email already reaches the CO, and MAP's directory will carry the role's contact.
- **The order of apply.** A missing view reads the noncredit conditions *pending* (no hold, no form); an empty one reads
  *not yet on file* (the share held). The schema applies after the code is on Pages, so the live page never shows an empty
  view without the form that fills it; the noncredit share is $0 either way until the builder emits its measures.
- **The award count masks for the team phrase.** It is a per-college student count: the review RPC returns it whole to a
  signed-in reviewer (`is_allowed_reviewer()`, the student-detail ADR's gate) and null for 1 to 9 to the team phrase (the
  funding ADR's floor of 10).
- **A form inside the funding table on a phone.** The drill-in is as wide as the table (898 px at 390), which scrolls
  inside `.cplfund-tablewrap` (299 px). Making the wrapper a size container (`container-type: inline-size`) lets the form
  take `100cqi` and stay sticky at the cell's left: one column, every field in view. The wrapper holds no fixed-position
  element (the splash attaches to `body`); a fixed child would have taken the wrapper as its containing block.
- **Testing the SQL.** Native Postgres 16 ran this time (`su postgres`, the cluster under `/var/tmp`): seventeen cases
  as anon, the team phrase and a reviewer. Notes on the method are in the PGlite playbook.

## Moved from the lane (S470, 2026-10-25)

From the implementation-funding lane's noncredit paragraph, verbatim:

✅ **Sam's four asks of 10-24, worked by S468 (#2422).** (1) The NC cards edit as the credit cards do (signed in for the team, signed out a what-if; they had been read-only unsigned, so his screenshot showed no fields), with the measure, target rule, outcomes served and strategies added (`tests/cpl_funding_nc_outcomes.test.js` E0 to E8). (2) Cabrillo: NC-1's mirror channel counts from COCI and MAP, 33 exhibits against 9; 4 of 102 colleges meet on it; NC-2 is confirmable, never findable (`funding/nc_outcome_feasibility/2026-10-24_cabrillo/`). (3) The credit coordinator condition reads MAP's College Contacts; the noncredit one reads `coordinator_name` on COBI's attestation row and swaps to a `has_nc_cpl_lead` boolean from `map_coordinator_summary()` once MAP carries the role. (4) The map-users lane.

## S471 SkyPenstemon (2026-10-25): the noncredit builder

- **What shipped** (#2437): `cpl_funding_nc_counts()` (`kb/supabase_cpl_funding_nc_counts.sql`, service role alone)
  returns the sets; `funding/_build_funding_performance.py` matches them into `nc_cdcp`, `nc_exh` and `nc_course`. The
  matching lives in Python so a fixture tests it (`tests/funding_nc_counts_test.py`); the SQL only gathers.
- **A subquery per exhibit ran past the MCP's minute.** 2,400 exhibits each scanning 142,000 COCI rows timed out; the
  same lookup as a join on (college, code) returns the 727 KB payload in seconds. Write the target-title lookup as a join.
- **Absent, never zero, for the denominator.** A 0 in `nc_cdcp` sets NC-1's floor of 2; COCI rows with no funding
  category (Calbright's 57, all blank) are a data hole, not a count. The builder emits `nc_cdcp` only for an institution
  whose COCI courses carry a category: Fresno City and Calbright read TBA.
- **A standalone's counts go in `origination.in_scope`, never `colleges`.** `perfFor()` reads `colleges` first, so a
  standalone there would shadow its origination cut under Scenarios 1 to 3.
- **Measured before it ran:** channel 2 reproduced S468 exactly (Cabrillo 33, Santa Ana 17, Las Positas 9, Norco 3);
  channel 1 by title adds one at Cabrillo (*Understanding Infant Development*, no target course in the sample).
- **The migrate runner applies SQL from `chatbox/`, `kb/` or `supabase/` only.** The first run refused
  `funding/…sql` and committed no receipt; the file moved under `kb/`. A server-only function nothing calls can apply
  before its code merges, so one PR carried both.
- **How to meet it** for the two noncredit conditions is S471's draft (`mc_how_nc_coord`, `mc_how_nc_team`), for Sam
  to curate in the text editor.

## S473 SkyClarkia (2026-10-25): NC-1's channel 3, the credential crosswalk

- **A curated pair is a file row with a status, and only `confirmed` counts.** `funding/nc_credential_crosswalk.json`
  holds 13 `proposed` rows (Cabrillo 3, LA Trade-Tech 9, Saddleback 1). Counted, they move LA Trade-Tech from 0 to 9
  of 4, a funding figure colleges read, so confirmation went to Sam (Open Asks Sheet 127), not a session.
- **A keyword scan proposes; the eye rejects.** Exhibit titles against CDCP course titles at the same college, per
  credential (A+, CCNA, EMT/National Registry, ASE, ServSafe ...). Rejected and recorded so no scan re-proposes them:
  salesperson to appraiser, A9 to A1/A3/A6 courses, ASE T-series to A-series courses.
- **A row still needs its course to be CDCP today.** The builder checks a row's `title_norm` against the RPC's CDCP
  titles, so a retired course drops its pair with no edit. No RPC change was needed.

## S476 SkyFiddleneck (2026-10-25): the first daily run with the noncredit builder

- **The RPC came back 500 and every nc key stayed absent** (run 40189454249, 11:40Z). The Postgres log at 11:40:38
  reads *canceling statement due to statement timeout*. PostgREST runs a call under the authenticator's 8 s
  `statement_timeout`; the function's own `set statement_timeout = '60s'` does not lift it, because Postgres arms the
  timer when the outer statement starts. Warm, the RPC answers in 1.1 s; cold, 6.1 s from the MCP, and longer while the
  daily run loads the database.
- **The fix is a retry** (#2443): `call_nc_counts_rpc()` tries up to three times on a 5xx or a dropped connection, never
  on a 4xx. The first call warms the cache. Absent-never-zero holds on a final failure.
- **A function-level timeout is no protection for a PostgREST caller.** If the RPC ever runs past 8 s warm, the fix is
  in the SQL (or a role-level setting, which reaches every service-role call and is shared ground), never a longer
  client timeout.
