---
title: "Implementation Funding tab / the $35M model — lane state"
created: 2026-08-28
updated: 2026-10-30
tags: [reference, roadmap-lane]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference/lanes
related:
  - "[[CLAUDE]]"
---

# Implementation Funding tab / the $35M model

> **Always-current lane state, not an archive** (compacted through 2026-10-27; narratives live in the [lessons](../../cpl_funding_lessons.md), which hold each dated section this file cites).

**What this lane is:** The four priorities, their shares and factors, what each counts toward, and the college-by-college allocation.

## Status

✅ **COLLEGE DASHBOARD ROUNDS 8 AND 9 LIVE**; `map_coordinator_summary()` answers booleans, never a name. ✅ **THE REPORTING BOX** (one report a year, eight NOVA categories): `cpl_funding_reports`, INSERT-only, newest per year counts, Withdraw unreports (`markReports`); college half via `cpl_funding_my_reports()`. Guards `cpl_funding_reporting_box`, `cpl_funding_reports_college_half`.

✅ **Refresh everything, the published scenario on every visit, and My CPL Funding (Sam, 2026-09-30):** moved verbatim to [`cpl_funding_lessons.md`](../../cpl_funding_lessons.md), *Moved from the lane (S480)*. ⭐ **No "funding model" in college-facing text** (card 14); ⭐ **"through apportionment" is for the seed grant only.**

⭐ **SCENARIO 4 IS PUBLISHED (Sam, on the tab, 2026-10-23 22:06Z; `cpl_funding_config.updated_by` his account, read S465).** Every scenario since Scenario 2 (Sam, 2026-09-30, sheet 6 card 6: *"We're going with Scenario 2."*) funds colleges on P1 and P2 (50% each, both years; `mirrorYears` makes the stored Year-2 block inert); P3 Career Attainment and P4 Innovation Projects are **reported cards** (`reportedAsReports`, `reportedCards` [C,D]) with no target, FTES or funding line. Scenario 1 keeps its cards; Scenarios 3 and 4 set noncredit's portion to 15%; Scenario 4 adds the noncredit outcomes lane (below).

✅ **THE INTRODUCTION VIDEO: CPL Funding in Motion** ([README](../../../prototype/funding_video/README.md)): ⭐ the introduction link is always the published film; its figures script and Scenario 4 words lessons, *Moved from the lane (S480)*.

✅ **Sam's phone asks of 2026-10-29 (S518, #2558):** lessons, *Moved from the lane (S530)*.

✅ **THE TAB:** introduction first (`ABOUT_DEFAULT_HTML` is **Sam's own approved introduction**), then the institution table; sections build into an id-keyed map joined in a stored order (`secOrder`; the public page's `pubSecOrder`). ⭐ **ID-KEYED, NEVER POSITIONAL** (an unknown id is ignored, an unnamed one appends). A card's goal derives from its metric's milestone by default (`prioGoals()`). Prose blocks edit in curate (`TEXT_BLOCKS`); one curator section holds the explainer's and My CPL Funding's passages, an emptied passage stays empty (`TEXT_BLANK`) and bullets nest (lessons, *S506*). ⚠️ **A REPORTED CARD IS NEVER AN ENTRY IN `priorities(slot)`**: share 0 there still enters every sum, column, export and memo. ⚠️ **The register is INLINE in both HTMLs**, never loaded from `CPL_Data.js`; the designated NAME rides the config, the weekly STATUS does not.

✅ **THE EXPLAINER IS THE ONE PUBLIC PAGE** (`funding-model/index.html`, in the public library's look, light only): its full description lessons, *Moved from the lane (S491)*. The memo's Contents item reads *(TBA)* until the CO publishes it (lessons, *S506*).

⛔ **NEVER PIN A FIGURE THE DAILY CRON REGENERATES** (it turned `main` red on 2026-09-16), **nor its absence** (#1666). Derive every expectation from the artifact, keyed to a measure, the rival asserted absent. ⚠️ **A mutation that changes nothing proves nothing.** [note](../../kb-notes/methodology-a-test-that-pins-a-generated-figure-fails-on-a-data-refresh.md)

✅ **2026-10-19:** the memo and report lead with SB 135 (`MEMO_BLOCKS`); the opening follows `x_lede` until saved.

✅ **The FAQ's six groups (Sam, 2026-10-29, S518, #2559):** "## " lines in the settled order, a heading over each and a line of links to each; Sierra reads the same FAQ ([lane](sierra-retrieval-corpus.md)). Guards `cpl_funding_faq_groups`, `sierra_funding_faq`.

✅ **The funding FAQ: 45 questions in eight groups in `FAQ_DEFAULT_PLAIN`** (the tab and the public page; no `faq` or `x_faq` override, read live 10-29; `funding-model/faq.json` files it for Sierra, `scripts/build_funding_faq.js --check` guards it). Sam's settled 25 (Open Asks Sheet 138; card 8 left out; card 9 names apportionment as he wrote it, Sheet 139 card 2), Malone's twelve (Sam, 10-28: *"push them as written by Malone"*; `cpl_funding_calm` and `cpl_funding_earn_retired` exempt his sentences by name), and Sam's eight of 10-29 (*"Please review these new FAQs and add to funding model"*; his two NOVA questions on his Sheet 140 rulings) in two new groups, **Reporting in NOVA** and **Apprenticeship CPL**, in his words but for four edits named in the code's comment (lists as sentences, *Yes.* for *Absolutely!*, the MAP platform for *the MAP Initiative*, *Colleges may describe* for *The presentation identifies*). Guards `cpl_funding_faq_sheet138`, `cpl_funding_faq_groups`, `sierra_funding_faq`.

**An address without github.io is Sam's, with Malone (Sheet 146 card 1, 2026-10-30, "later": *"No need to ask about this anymore. I will work on it with Malone later"*):** no card asks it again; the options (a map.rccd.edu forwarding address, or a custom domain) and Sheet 140's other three cards: lessons, *Moved from the lane (S520)*.

✅ **The CSM team's test fixes before the Summit (Sam, 2026-10-29; S519):** Funds Qualified So Far for *Curr* and the sums that add the rows (above); the table's short names *Coalinga*, *Imperial Valley*, *Norco*, *Reedley*, *Cañada* and *Mt. San Antonio* (`display` in `cpl_funding_data.js`; the join keys stay); the Sources line's FTES link at DataMart's current address (`/Students/FTES_Summary.aspx`; `/Outcomes/` answers 404); a **Clear** word beside the search box, shown while it holds a search. On main since #2560 (S520, 22:36Z), with #2563 (the public page paints the published scenario first). Guards `cpl_funding_college_dashboard`, `cpl_funding_pool`. ✅ **Sam renamed his three saved Scenario 4 passages himself (Open Asks Sheet 141 card 1, *pasted*, 23:28Z 2026-10-29):** the reading note, the college introduction and the table introduction say *Funds Qualified So Far*, read back at 23:30Z. Scenarios 2 and 3, which do not publish, still say *Curr* in three passages.

✅ **Sam's 10-28 page asks (S508) are on main:** the public page's footer gone; the tab opens on the published scenario (`CONFIG_HOLD_MS`, test `cpl_funding_published_first`); one link to the public page; Natalie's (CSM lead) hovers on Max Funds, Curr Funds, Base and Cap. Still his: the Priority 2 bullet and FTES spelled out in `x_table_intro`.

⏳ **The memo's opening waits on Sam's paste (Sheet 129 card 1; `cpl_memory` `sam-sheet-129-rulings-2026-10-26`).**
The memo's opening follows the explainer's Overview (`x_lede`) until `memo_lead` is saved, so the Word export printed two
passages twice. He chose the proposed opening (`MEMO_LEAD_PROPOSED_128` in
`CPLBrain/decision-sheets/_build_open_asks_decision_sheet.py`) and pastes it under *Edit the memo's text* (curator text,
never SQL). Read S503 (10-27): *This page* is back in the Overview (18:16Z 10-26); `memo_lead` is unsaved.
Still open beside it: his text says 115 credit colleges and three noncredit campuses where the memo's Funding Overview
says 116 and 2, and a Priority 3 strategy still ends in *studentsr*.

✅ **The My College view and the one public page (Sam, 2026-10-15):** lessons, *Moved from the lane (S491)*.

⭐ **THE EXPLAINER READS THE MODEL, NOT COPIES OF IT (S265):** the card sentence is the config's `description`; the requirements and the deadline come from `_requirements()`; each priority's target, FTES reimbursement rate and progress and each condition's count from `_publicProgress()` (#1809). ⚠️ **The two vocabulary guards cannot see it**: `funding_model_page.test.js` scans its prose. ⚠️ **Its print stylesheet is the PDF's design**: never hide `.cplfund-caret`.

✅ **THE MEASURES.** Credit: `pe` · `pa` · `p3` units. Access: `ppe`/`ppa` (+`_u`) among portal-origin students, disjoint from `pe`/`pa`, until CollegeID2 lands. Completion with Counseling: `pac`/`pac_u`, serving **(B) alone** (Sam, 2026-09-22); ⭐ **the counselor step is a policy attestation, never a technical guarantee** (Sam, 2026-09-01). Transcribed + Counselor: `ptc`/`ptc_u`. Career: `ca_u` / `nc_ca_u` (`origin: "co"`), imported by the CO; `srcByCo()` keeps every surface from saying "MAP" about them. ⚠️ `srcDelivered()` reads an undelivered key as **$0, never a cap**: pinning a priority to an undelivered measure strands its share. ⭐ **MAP partner agencies are outside the model** (Sam, 2026-09-24; the builder skips `entity_kind: "partner"`).

✅ **COUNTS MASK UNDER 10; UNITS CARRY THE FUNDING; PUBLIC DOLLARS COARSEN** (Sam, 2026-09-03; [the ADR](../../kb-notes/adr-funding-counts-mask-under-10-units-carry-the-money.md)). Per-college unit sums are never masked; a lone masked college gets a complementary mask; public demonstrated figures coarsen to the nearest $1,000, caps and dials exact.

**Durable rulings:** ⭐ **SUNSHINE RULE (Sam, 2026-09-01)**: outward materials carry the model's SHAPE only (no dollar figures, weights, institution counts or the explainer link) until he confirms with CO leadership. **FUNDED and MEASURED are two axes**; a priority's goal derives from its MEASURE's milestone, never its title. Unearned funds anchor to §78093.2(d)(1). **N3 a:** Calbright's 1,000-FTES stand-in never publishes or disburses. Curating requires a magic-link reviewer; shares, factors, titles, pins and text are curator edits through the tab, never SQL. The explainer video frames the institution table, never blurs (Sam, 2026-09-12).

✅ **THE VOCABULARY RULES LIVE IN `CLAUDE.md` (Naming & terminology), NOT HERE.** Guards, one per file because a rendered-text ban covers only the branches a fixture paints: `cpl_funding_calm` (the DOM), `cpl_funding_earn_retired` (the source), `college_briefing_earn_retired` (the briefing), `funding_model_page.test.js` (the explainer).

⭐ **THE OUTCOME SECTION IS ONE FLAT CARD FAMILY** (Sam, 2026-09-14; PR #1574). Each card carries key, name, citation, the statute's sentence and a picker, with the measure-derived goal as DEFAULT. ⚠️ **Clearing stores the sentinel `"derived"`, never a deleted key** (a deleted key lets a SHARED value resurface). Every card renders always; the **totals row** names every statutory goal, served or not. The reported cards' Serves boxes (S480): lessons, *Moved from the lane (S507)*. ⭐ **The project allocation SPLITS across (C)/(D)**, fixing a double claim — [note](../../kb-notes/methodology-a-figure-tagged-to-two-owners-is-claimed-twice.md). Guard: `cpl_funding_outcome_cards.test.js` (77).

⭐ **THE COLLEGE DASHBOARD** (Sam, 2026-10-25): Institution · Max Funds (`total`) · Curr Funds (`current_total`); the CR/NC split waits in the Columns menu (store `cplfund_cols_v3`), the CSV keeps it. The Base/Cap chip hangs left of the amount; the Confirm word (`participationDeadline()`, the ONE Confirm control) sits at the Institution cell's right edge. Fixed layout on `.cplfund-coltable` ONLY, `min-width` from `COL_MIN_PX`. ⭐ **Curr cells read `cellFig()`'s RELEASED figure via `earnedMoney()`**; held funding shows only in the CSV (Sam: *"colleges need to meet all 3 baselines to receive any funding"*). ⭐ **The drill-in opens on Minimum Conditions** (`baselineStatusHtml()`); a reviewer sees the attester and **Reject**, then the Report word: the Reporting box folds behind it, naming the nearest report deadline not met (`nextReportDue`, the timeline's report milestones).

⭐ **THE DRILL-IN'S PRIORITIES ARE ROWS OF THE TABLE** (`prioSubRowsHtml`, college + statewide), one cell per column: each priority and noncredit outcome carries its own figure in Max Funds and Funds Qualified So Far, hovers and Unit sources with it; `diffMoney()` subtracts the COARSE figure. No measure yet reads **TBA** (Sam, 2026-09-28). Each row's outcome chips (S480): lessons, *Moved from the lane (S507)*. ⭐ **FUNDS QUALIFIED SO FAR** (the CSM team's word via Sam, 2026-10-29, for *Curr*; every header, hover, the CSV and the house passages; the word is prose only, keys keep `current`). ⭐ **Every sum adds what the rows show, gray included** (Sam relaying the CSM team, 2026-10-29: *"Statewide Curr total is 0 but should add everything in curr college rows"*): `curFig()` is one rule for an institution, a district subtotal and the Statewide row, and the Statewide expand adds `earnAgg()`'s gate-agnostic `crEarned` / `ncEarned`; a sum reads gray only while none of it qualifies, its hover naming the gray part; a lane's cell grays on that lane's own gate (`nc_gate_blocked` for noncredit). From 09-28 to 10-29 the sums added only the released part and read $0 beside gray rows. The cards' Progress line keeps the demonstrated figure. **The public figures round to $1,000** (the 09-03 ADR), and the public Sources line now says so. ⚠️ **The scope supplies the figures; the renderer never derives them.** ⚠️ **The statewide row must NOT carry `.cplfund-row`.** Guards `cpl_funding_statewide_expand`, `cpl_funding_dtl_align`, `cpl_funding_row_legibility`.

⭐ **P1 (ACCESS) MEASURES `pa_u`, EVERY APPLIED UNIT (Sam, 2026-09-30, his save 13:41Z),** Needs Action credit included (sheet 11 card 1: "keep"; `pa_u` exceeds its student view's plan units by the Needs Action share, [map-custom-reports](map-custom-reports.md)). ⚠️ `pa_u` leaves out portal-origin students (`ppa_u`, disjoint). ⭐ Do not build a combined ORIGIN+counselor source (Sam split them 2026-09-15).

⚠️ **THE CONFIG PATH IS NOT `config->'priorities'`:** `config -> projects -> <project> -> scenarios -> <scenario> -> yearPriorities -> <year> -> <slot>` (`jsonb_each`).

⭐ **GOAL (C) IS MEASURED BY THE CO FROM EDD WAGE DATA (Sam, 2026-09-22).** Career attainment (`ca_u`) derives (C) and qualifies nothing until the first import. Receiver: `funding/career_attainment_import.json` ([format](../../kb-notes/reference-career-attainment-import.md)) → `read_career_attainment()`; units only, an unmasked count under 10 stops the import (`tests/funding_career_import_test.py`). **CO research sends the first file.**

✅ **My Institution is hidden and its code kept (Sam, 2026-10-27; S502):** lessons, *Moved from the lane (S506)*; switch `oneViewOn()`, guard `cpl_funding_my_institution_hidden`.

✅ **My College's funding lives here (Sam, 2026-10-21), and the public page forgets the chosen institution on reload (Sheet 111 card 2):** lessons, *Moved from the lane (S506)*.

**NEXT (credit lane):** ⭐ **"FTES reimbursement rate", never price (Sam, 2026-10-02)**; `cpl_funding_calm` bans it. ⓪a Still Sam's in the tab: card 11's two measure texts (Access *Applied CPL units (FTES) in MAP*; Completion *Transcribed CPL units (FTES) for students with the Counselor step checked in MAP*) and moving the six carried strategies to Completion in Year 1. Confirmation deadline **Dec 31, 2026** in Scenario 4 (`participationDeadline`; Scenario 3 kept Dec 30). ⓪e **ONE REQUEST TO PEDRO** (Sam waits for Pedro, 2026-09-27; no session drafts it): Origin / CollegeID2, **completions** and a **per-CPL-type unit portion**. ⚠️ **That third ask is why the builder refuses per-type unit sums**: a source row carries the STUDENT's total credits. ① **The `ppa` cutover** the day CollegeID2 lands. ② Sweep the college briefing's display names (college-district-identity).

⭐ **The noncredit lane as Sam ruled it (Open Asks Sheets 113 and 114, 2026-10-22; verbatim in `cpl_memory` `sam-sheet-113-rulings-2026-10-22`, `sam-sheet-114-rulings-2026-10-22`).** Conditions gate the noncredit share: a **Noncredit CPL Lead** named and published on the college's one landing page, attested each year in COBI until MAP carries the role (the strike-team condition retired 2026-10-25: Sam struck it, his first condition now reading *"CPL Coordinator and Noncredit CPL Lead assigned … and meeting regularly"*; `ncTeamShown()` off unless a layer restores it). Two funded outcomes split it 50/50: NC-1 exhibits built or adopted for the program's learning, the greater of 2 and 5% of its CDCP noncredit courses, capped at 10, counted through four channels (the noncredit-titled exhibit, a target course mirroring a noncredit course, a credential the program's courses name, the strike team's attested list; a standalone counts at its district's credit colleges); NC-2 a noncredit CPL portfolio-development course chaptered in a CDCP program by the end of Year 1 and offered with enrollment attested in Year 2. The count of former noncredit students awarded CPL rides the annual attestation as a reported figure; the CCCID path is held (*"We’ll take this one as a long term integration request with CCCApply."*). No small-program threshold.

✅ **Scenario 4 (built S449, 2026-10-22) and the public requests' MAP team review (S502):** verbatim in `docs/cpl_funding_lessons.md`, *Moved from the lane (S519)*; guards `cpl_funding_nc_outcomes`, `cpl_funding_nc_attestation`.

**Email-first forms and *Awaiting CPL Initiative Confirmation* (S506); a row's submitted word with a reviewer's Accept (Sam, 2026-10-30; S530):** lessons *S506*, *S530*; guards `cpl_funding_optin` G1–G6 and R1–R3, `cpl_funding_nc_attestation` C1b–C1d and D0r–D0t; a district's own domain lives in `cpl_funding_district_domains`. **Sam chose Microsoft 365 for Accept's email (Sheet 146 card 3, *m365*):** COBI sends as map@rccd.edu once RCCD IT grants the one mailbox; the request is drafted for him (lessons S530). NEXT: map the sender in `kb/governance_surface_map.json`, then build it.

✅ **Follow up (Sam, 2026-10-31, SkyBilberry):** beside Accept and Deny on a waiting request, a word opening Accept's window to the requester, its email editable and the CO Monitor's note in its middle; it changes no record. The From is the mail program's own account until COBI sends as map@rccd.edu (Sheet 146 card 3). Guards `cpl_funding_nc_attestation` D0u–D0y; lessons *SkyBilberry*.

✅ **Who sent it, and one response email (Sam, 2026-10-31, SkyCloudberry, #2619 and #2621):** a reviewer's requester line reads *name (title) · MAP role · landing page* (*find title* for Other; the Lead's listing on an attestation), from `cpl_funding_requester_context()` over `map_college_users` and the daily mirror `map_landing_contacts`; Accept opens the one editable `accept_email` passage (Minimum Conditions, *Response email*) in a window with *Copy and open draft*. Detail: lessons, *SkyCloudberry*.

✅ **The attestation form in Sam's words (#2476):** lessons, *Moved from the lane (S494)*; `NC_LEAD_TYPES` matches `cna_lead_chk`.

✅ **COBI's Share menu opens the public page (Sam, 2026-10-29, S520, #2565):** *CPL Funding* (`data-nav-link="public-funding"`, `funding-model/`), after the Public Library; his words: lessons, *S520*. Guard `tests/share_public_funding.test.js`.

✅ **THE PUBLIC PAGE'S HEADER (Sam, 2026-10-26, #2478).** Its links and their order: lessons, *Moved from the lane (S507)*; the version's place: lessons, *Moved from the lane (S506)*. **Edit this page shows only inside COBI's Public page view** (`edit_page.js`: `window.self !== window.top`), never at the public address. Step 1 names the chosen view in words (Sheet 133 card 2).

⭐ **WCAG 2.2 AA (the Summit sweep, 10-30):** keep `funding-model-mycpl` in every sweep, the one target that opens My Institution; the rest moved verbatim to lessons, *Moved from the lane (SkyCloudberry)*.

✅ **How NC-2 is counted (Sam, Open Asks Sheet 125 card 1, 2026-10-24: *name-then-attest*):** lessons, *Moved from the lane (S503)*.
