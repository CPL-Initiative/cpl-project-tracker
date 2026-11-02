---
title: "Sierra retrieval + corpus — lane state"
created: 2026-08-28
updated: 2026-11-01
tags: [reference, roadmap-lane]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference/lanes
related:
  - "[[CLAUDE]]"
---

# Sierra retrieval + corpus

**What this lane is:** Sierra answers credential questions off the CURATED layer, not the raw freehand titles colleges typed into MAP.

## Status

✅ **`chatbox_credentials` LIVE (1,987 rows)** — public-read/no-write, loaded by `kb/_sync_credential_catalog.py` from the PUBLISHED artifact so suppression is inherited by construction. Routes CRED·STD, CRED·VOLUME, COLLEGE·ADOPT, ALIGN live. ✅ **`chatbox_credential_recs` — 2,205 rows LIVE** (134 statewide/351 lines · 2,071 local/3,357) on the nightly `credential-catalog-sync`. ⭐ **Sam's rule:** statewide exists → quote the **statewide set ONLY**; no statewide → the **most common** local recs with their college counts. Never both. ⭐ **The builder REUSES `fact-sheet/_build_statewide_recs.py`** — Sierra quoting different credit from the Fact Sheet is a credibility failure. ⚠️ **Lead with the LIST, never a count:** POST measures **10 lines · 9 carrying a C-ID · 8 DISTINCT · 1 with none**, and the `AJ 110` repeat is **flagged, never auto-resolved** (Sam: *"AJ 110 may be C-ID and it is Elective"*). **Standing retrieval rules, each earned by a failing probe:** search is **TRIGRAM, never `tsquery`** (`to_tsquery('english','aed:*')` → `'a':*` took the CPR corpus out); score the **best single name**, never the concatenation (length-normalized similarity ranks the BEST-CURATED record WORST); **`statewide` is a FILTER, not a tie-break**; **no pure-fuzzy** (tier-4 floor 0.25 + `matched_via`); **zero rows is a RESULT**, not a license to offer a neighbour. ⚠️ **Every student count is a FLOOR and the denominator ships as a COLUMN** — only 4.2% of student rows are nameable; `students_suppressed=true` must never render like `colleges_with_student_data=0`. ⚠️ **The statewide-rec gate is `ccc_rec` OR a published statewide set** — `ccc_rec` is derived from ADOPTIONS, so gating on it alone hid **38 statewide credentials with zero adopters, 36 of them carrying 75 published rec lines** (Carpenters ladder, NCCER, CSLB, ICC, OSHA 10/30) from *every* credential route. ⚠️ **Rec lines are ENRICHMENT, never a filter** — the map is declared OUTSIDE the try and a credential with no line is **still named**; dropping it re-creates the false zero. Every credential route renders through the **shared** `renderRecLines` off **one** batched `credential_recs_for_titles()` — a second lookup is a second matcher that can drift. ✅ **`surface` live since v56 (2026-08-22):** `KNOWN_SURFACES` (8), `sierra_guidance.surface` (the live CHECK allows `skyview-ask`), the Training-tab picker; 2 of 7 rows are scoped `my-college`. ✅ v66 (#1568, 2026-09-17) shipped `deriveViewer()` — `reviewer` · `team` · `public` through PostgREST with the ANON key and the caller's own credential, fails closed to `public`, files `viewer` + `surface` on `chat_interactions` (guard `sierra_viewer` 63); its five unshipped days were an INVISIBLE OUTAGE (the function ships only on a deploy dispatch). ⚠️ It widens nothing: a verified reviewer seeing COBI data is the SECOND build, routed through Governance and the student-detail disclosure ADR (Rule 10 a3) first. **Open:** corpus covers **59 of 123** colleges; `chatbox_college_profiles` stale since 2026-06-25 **except contacts** (live); 12 adoption-file statewide titles absent from `chatbox_credentials`. ✅ **PROGRAM SEARCH · PLACE ANCHOR · PROSPECTIVE CREDIT (v67–v73).** `coci_college_programs` (22,335 rows / 118 colleges) is read by `search_college_programs` — title AND code, neither gating. ⚠️ **NEVER INDEX IT** (#1602). A county, a region OR a NAMED SUB-REGION anchors `askedGeo` and orders both catalog RPCs INSIDE the query (`anchor_county` / `anchor_region`, never a filter). ⭐ **`SUBREGIONS` (v73, 13 names) carries its OWN anchor campuses** — the county sets the band, their centroid orders within it (LA County runs Lancaster to Long Beach); ambiguous names are omitted (*South Bay*), and the block says the rest of the county is close, so the list is no fence. ⚠️ **SAM'S BAR: a COURSE-LEVEL answer — what might qualify, so the visitor can ask where it has not been granted; the exhibit answer is a miss even when every fact is true.** The block answers it: per core TOP, the full course lists of the three nearest colleges, ordered by `COLLEGE_POINTS` (119 points, unverified: `s275-fable-verify-campus-points`) inside a band (county > region > `REGION_NEIGHBORS` > elsewhere), with distances on the headings. The first sentence is the answer and the first course named is in the TARGET program (the holding phrase says which is held; the training program is BACKGROUND, last). An absence is what the CATALOG shows, at EVERY mention — the closing caveat as much as the opener, where v72 lapsed — and names the bridges. Articulations come after, only for the credential held. **v73 live 2026-09-18 23:01Z:** ⭐ **Sam's quick list and flyer** (`sam-quick-list-and-flyer-...-2026-09-18`). `program_typical_courses()` aggregates `chatbox_college_courses` statewide per TOP, in COLLEGES (never rows). ⚠️ The title-norm pitfall (one flat expression, no CTE): `docs/cpl_assistant_lessons.md`, *Moved from the lane (S521)*. The block renders a QUICK LIST (held program first); the rule asks for a two-column table after paragraph one — **no row quota** (it made the model restate one course under six names; a program is often ONE course plus add-ons), and the columns are independent lists, never row-by-row pairings. `RELATED_PROGRAMS` (Sam's list, keyed by CNA 1230.30) renders the FLYER, every entry checked against the catalog data. The PRECEDENT ON RECORD renders inside the block (a college is paired to a course only where the record names ONE adopter). **Every course line carries its college.** ⭐ **Sam: never "COCI" — say "catalog data"** (swept; the always-on rule carries the ban; the smoke fails any answer saying it). **Route time limit** (#1612): 5,000 ms per retrieval read, `CPL_ROUTE_TIMEOUT_MS` overrides with no deploy; cuts fail safe (`s275-fable-programs-route-latency`). A/B doctrine: lessons, *Moved from the lane (S521)*. ✅ **PROGRAM COURSE LISTS LIVE (S318–S319; Sam: "list the courses in particular programs at a given college").** `coci_program_courses` (#1826, #1829): 313,710 rows, 20,451 of 22,335 programs, joined on `control_number` (all filled). `college_program_courses()` replaces the TOP proxy (median 33%) when one college is asked about courses; deployed 2026-10-03 14:15Z (#1832, smoke 7l). A program LISTS a course: never "required", never a unit total, and a student takes one course of each honors pair (an A/B catch, #1832). ⭐ **Except a checked record (Sam, sheet 29):** `program_requirement_records` renders CATALOG REQUIREMENTS; Sierra may say required and give the printed total, naming catalog and year (smoke 7q). **S370:** the request goes to the course's own college, the answer written once (#2032, smoke 7c). ✅ **The no-match fallback reads one college by equality** (S400, #2173; the timings in `docs/cpl_assistant_lessons.md`, *Moved from the lane (S465)*). ⚠️ **The program search copied its table to temp on every call** (S521: mean 2.0 s under load; smoke 7c's timeout). The no-copy rewrite applied 2026-10-30 (s521 00:38Z, s521b 01:03Z; 149 ms, no temp): `kb/migrations/2026-10-30_s521_search_college_programs_no_copy.sql` (its header names the receipt). **NEXT:** read timings over real traffic before choosing what to cut; switch the prospective block from TOP to the real lists. **Open:** extend `RELATED_PROGRAMS` beyond the CNA. Guards: `sierra_prospective_credit` (172) · `sierra_program_courses` (33) · `sierra_timing_log` (31) · `sierra_route_time_limit` · `sierra_place_anchor` (96) · `sierra_program_search` (37) · `sierra_program_search_fallback` (10) · `sierra_program_search_no_copy` (13) · `coci_program_cip_test.py` · `course_title_mojibake_test.py` · smoke 7p, 7c, 7s, 7l. Story: `docs/cpl_assistant_lessons.md`.

**Sam, Open Asks Sheet 142, 00:21Z 2026-10-30 (his calls):** card 1 *tonight*, built (#2570); card 2 *retry-report*, built (#2571: reads retry once, answer checks warn, rule guards fail), first live at the next deploy.

**NEXT (Sam, 00:57Z 2026-10-30):** *"Would have been perfect if it gave the request quick adopt links for courses not yet approved"*; links render only for an unadopted credential.


## The endpoint itself — model, cost, reliability (added 2026-09-11)

**MODEL is `claude-sonnet-5`**, committed default since v63 (deployed
`2026-09-10T22:35:17Z`, Sam's dispatch). The `CPL_CHAT_MODEL` Supabase secret
still overrides it with **no deploy** and is the fast revert lever — ⚠️ **do not
delete it**, which reverses the advice given earlier that same day. Reverting to
`claude-haiku-4-5-20251001` is one secret and no code change.

⚠️ **THINKING IS OFF, AND THAT IS WHAT FIXED THE BLANK ANSWERS.** On Sonnet 5 a
request that OMITS `thinking` runs adaptive thinking, those tokens count against
`max_tokens`, and the loop collects only text — so a broad question spent the whole
2,048-token budget before the first word (39 of 137 turns blank on 09-11, three of
them real users). **#1551 sends `thinking: { type: "disabled" }`**, and ⭐ **Sam
ruled it STAYS OFF** (2026-09-11, sheet *Two Calls on Sierra* item 1: *"Let's keep
it off but test for better options if they exist. Currently, it's giving fantastic
answers!"*) — any trial runs on the preview slug (`cpl-chat-preview-ab.yml`), never
live. The guard `tests/sierra_model_choice.test.js` block 5 keys the thinking
default to the model id (adaptive-by-default / always-on, where `disabled` is a
400 / off) and fails closed on an unknown id. ⚠️ **The secret can still point
`MODEL` at a model whose default differs; the guard reads only the committed
default.** ⭐ **`MAX_TOKENS` is 8,192** (same sheet, item 2: *"Let's make it high
for now so folks playing around with it always get a complete answer"*; #1555) — a
ceiling, not a spend. #1550's instrumentation rides
along: a blank turn logs `EMPTY ANSWER` with its `stop_reason` and the client gets
`event: error` before `done`. Full story:
[`cpl_assistant_lessons`](../../cpl_assistant_lessons.md). ⚠️ **The health probe
cannot see this class** — one simple question, and it passed straight through two
hours of blanks on broad questions.


**Cost (measured 2026-09-11):** Sonnet 5 runs 1.72× Haiku per input token and the spend is trivial, so choose on answer quality; price is a tiebreak. The table: lessons, *Moved from the lane (beside S539)*.

⭐ **The cache line names the model that answered** (Sam's ruling, sheet item 3) — from
`event.message.model`, never the `MODEL` constant. ⚠️ **Nothing on our side can see which
Anthropic ACCOUNT pays** — filter the Console by key.

## The standalone page on a phone (2026-09-11)

Moved verbatim to `docs/cpl_assistant_lessons.md` (*Moved from the lane (S469)*); the page is now the library look
([lane](sierra-page-redesign.md)). **Open:** a floating Sierra bubble on every COBI tab (`kb/cpl_todos.json`
`s255-sam-sierra-bubble-on-every-tab`); `sierra/sidebar.js` is the vehicle.

## The Sierra Training tab — round 1 (2026-09-29)

✅ **Round 1 of Sam's approved mockup is live** (#1733, 2026-09-29; approved
2026-09-28, `cpl_memory` `sam-approves-sierra-training-mockup-round-1-2026-09-28`):
the five numbers filter what they count, a *Showing N of M* line, words for marks,
a segmented status control, First Light tokens only. **Try it in: Sierra · My
College** rides a destination key, `cplSierraTestDest.v1`, which `cpl_chat.js`
reads; without it a My College hand-off typed into the hidden CPL Assistant input.
Guard: `tests/sierra_training_round1.test.js`.

**RULED (Sam, 2026-09-29, sheet 3 card 12, as proposed):** keep the word
*Sierra*, and where a site hides CPL Assistant show only *My College*.
`sierraHost()` already sent the Sierra button there, so the two buttons opened
one place. **One Sierra in COBI (S398, #2163; Sam, 2026-10-16: *"consolidate Sierra Assistant into Sierra AI and sunset the separate assistant ... only gain"*, `sam-sierra-one-assistant-2026-10-16`).** The CPL Assistant tab (`#chatbot`) is retired: `CPL_CHAT.open({question, send})` opens Sierra AI full screen over any COBI tab, unscoped (surface `cobi-assistant`, kept), with the reader's sign-in. *Try it in: Sierra* and *Save & ask Sierra* ask her over the Training tab and send; *My College* keeps its hand-off; both words always show. Each box keeps its own scope and starters. Its ratings carry page `cobi-sierra`. Guard: `tests/sierra_one_cobi.test.js`. **Open:** the live `cobi_nav` row `chatbot`; the Fact Sheet drawer still names itself CPL Assistant; the floating bubble is one `open()` call away.

**The funding FAQ (S518, #2559):** Sierra reads the page's FAQ. Mechanics: [`docs/cpl_assistant_lessons.md`](../../cpl_assistant_lessons.md), *Moved from the lane (S518)*.

**A named college's funding section (S529).** The vault's funding note gives each of the 118 institutions a section
headed `<full name>: CPL funding standing` (`scripts/funding_sierra_note.js`). A funding question that names one
college reads that section by heading, ahead of the similarity search (`fetchCollegeFundingSection`; every profile in
`chatbox_college_profiles` reaches its heading, the 7 non-CCC names excepted). **Built, first live at the next
deploy** (held for Sam: a production deploy). The miss S528 saw (Cabrillo asked, three other colleges answered) was
the index, not the ranking: the vault's two indexers raced and left 47 of 118 sections; CPLBrain#556 serializes them,
skips unchanged files before embedding and writes a checksum after its sections. Index rebuilt 16:03Z 2026-10-30
(187 of 187 chunks).

**The public CPL Library (S469, live since 03:13Z 2026-10-25; smoke 7x green).** Sierra reads `cpl_library_public()` and a piece's page when the tracker hosts it: [lane](library.md#sierra-reads-the-library-sam-2320z-2026-10-24-built-s469), smoke 7x.

**Statewide exhibits in full (S398-S399, live).** For a request for the whole set, Sierra receives the Fact Sheet's 164 statewide exhibits by program area (`fact-sheet/statewide_catalog.json`, rebuilt daily): #2164, deployed 2026-10-16 on Sam's go (Open Asks Sheet 85 card 7; deploy run 38943025631, production smoke 38943211844 green with mode 7w). **NEXT:** render the Fact Sheet's baked title lists from the catalog (132 baked, 50 current titles missing); retire the April vault note `map-exhibit-analysis.md`; curate the 22 "Other Statewide" exhibits into program areas.

**Sierra quotes complete records (Sam, Open Asks Sheet 95 card 2, 14:43Z 2026-10-18, "quote"; built S416).** `fetchCheckedRequirements` reads a record whose `checks` pass the three machine tests (`coverage` true, `invented` true, `arithmetic` equal or unstated: `program_record_machine_pass` written as PostgREST filters on the column, because the anon key reads the row and cannot call the function), and the block keeps a record for an Active program only; a person's confirm sets `checked` only when those pass, so the 32 confirmed records sit inside the set (11,621 complete on 2026-10-18). The block says the requirements were read from the catalog and checked against the state's Program Course File, naming the catalog and its year; a failing record keeps the lists. Smoke 7q's retrieval assert reads Mt. SAC 08086 through the same filter; `tests/sierra_program_courses.test.js` block 13 pins the filter, the Active gate and the wording. Its deploy: lessons, *Moved from the lane (S521)*. Its three A/Bs: `docs/cpl_assistant_lessons.md`, *Moved from the lane (S465)* ([note](../../kb-notes/methodology-a-regressed-mode-must-reach-the-changed-code.md)).

## Where applied and transcribed credit comes from (2026-09-30)

Sam asked Sierra for the military and non-military split of Chaffey's applied units and the exhibits behind them (his Training note on turn `1b9230ce`). Sheet [NT56gHRViNX9ZYnRg8r1KR](https://claude.ai/artifact/NT56gHRViNX9ZYnRg8r1KR) (`docs/visuals/2026-09-30-sierra-credit-source.html`), all seven items ruled the same day: 1 fix, 2 do, 3 hand to the funding lane (below), 4 and 5 build, 6 his ruling, 7 draft the Training rule after the data ships.

⭐ **Sam's item 6 ruling (2026-09-30): *"I want Sierra to total for everyone using real numbers but when the totals (at any level) are below 10, to show "<10" on the views. This should happen without a governance gate."*** One published layer for every viewer; no reviewer tier. The condition is the student-detail ADR's decision 5: wherever a real total sits above rows, a withheld remainder spans two or more cells and 10 or more students.

**All of it is live (data applied 2026-09-30, receipts in `kb/receipts/`); Sierra reads it from cpl-chat v74 (#1780, deployed 17:19 UTC after a preview A/B with no regressions):**
`map_college_credit_summary` (each figure suppressed on its own students; a `withheld` list), `map_college_credit_statewide`, `map_college_credit_bucket` and `map_college_exhibit_credit`, rebuilt nightly. What #1777, #1779 and #1780 each changed: lessons, *Moved from the lane (beside S539)*.

**Item 3 went to the funding lane and is ruled there:** P1 keeps every applied unit, Needs Action credit included (Sam, sheet 11 card 1, 2026-09-30; [implementation-funding](implementation-funding.md); `cpl_memory` `summary-applied-includes-needs-action-articulated-2026-09-30`).

⚠️ **Never infer a unit split from counts of articulated exhibits.** Her Chaffey answer read "110 Standardized, 77 Credit by Exam" off the articulated-exhibit list; by units, Standardized Assessment carried 95% of Chaffey's applied credit and Credit by Exam none. ⚠️ **MAP's two views disagree by 5% on applied in plan** (171,078 articulation view vs 162,603 student view, 26 colleges); the breakdowns use the student view so they add up to the totals beside them. Most of the gap is a double count in the catalog-year view (below); the note for Pedro is Sam's to edit and send ([map-custom-reports](map-custom-reports.md)). **Item 7 is closed:** Sam added the layout rule in Training (`sierra_guidance` `f3a529ae`, 2026-09-30): one table per source answer, non-military rows first, each group ending on its "<10 each" line. It carries layout only; the substance ships in `CREDIT_STATUS_RULE`. Sessions cannot write `sierra_guidance` or `sierra_feedback` (the SQL guard denies INSERT and UPDATE), so a Training change goes to Sam as text to paste. Lessons: [`student_detail_load_lessons`](../../student_detail_load_lessons.md) (2026-09-30). `cpl_memory`: `sierra-credit-sources-live-2026-09-30`, `sam-sierra-real-totals-lt10-no-governance-gate-2026-09-30`, `credit-summary-per-figure-suppression-live-2026-09-30`, `map-military-columns-partition-applied-credit-2026-09-30`.

**S308-S315 (the two-view double count, CCCSF's split, the place leading only where it teaches, 7c catalog timeouts):** moved verbatim to `docs/cpl_assistant_lessons.md`, *Moved from the lane (S372)*.

**Instructions matched to the question (S540, 2026-11-01; Sam: *"worrying that we are removing part of her brain"*).** Before #2647 every active instruction went newest first to 9,000 characters (19, about 9,360), the question playing no part. First step: match each to the question, matches first, log sent/matched/dropped ids; Jev later, behind a flag. Sam, Sheet 153 card 3, *deploy*, then *"deploy all"* with handoff 530's three held changes: built #2647, preview A/B, one deploy of main. Fable's advice: `docs/sierra_rules_lessons.md`, *Matched instructions*.

**Every institution's JST standing (S543, 2026-11-01).** Sam asked *"which college have not yet met the 75% jst vet sprint goal for the new funding?"*; Sierra said she had no per-college percentages and quoted 25,934 JSTs (the vault's July 19 sprint plan). A question naming no college read no college's section, and her live metrics labeled 30,653 only as students. #2666: the funding note gains one section, *Veteran JSTs: which institutions have met the 75 percent condition* (41 not yet met, 65 met on the 11-01 figures), live at the vault's next funding-note run; cpl-chat reads it by heading for a JST question naming no single college and names `MilitaryStudents` the statewide JST count. **NEEDS SAM (Open Asks Sheet 154):** the cpl-chat half's JST standing waits on a deploy.

