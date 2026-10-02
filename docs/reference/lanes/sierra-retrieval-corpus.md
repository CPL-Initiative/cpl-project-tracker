---
title: "Sierra retrieval + corpus — lane state"
created: 2026-08-28
updated: 2026-09-30
tags: [reference, roadmap-lane]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference/lanes
related:
  - "[[CLAUDE]]"
---

# Sierra retrieval + corpus

**What this lane is:** Sierra answers credential questions off the CURATED layer, not the raw freehand titles colleges typed into MAP.

## Status

✅ **`chatbox_credentials` LIVE (1,987 rows)** — public-read/no-write, loaded by `kb/_sync_credential_catalog.py` from the PUBLISHED artifact so suppression is inherited by construction. Routes CRED·STD, CRED·VOLUME, COLLEGE·ADOPT, ALIGN live. ✅ **`chatbox_credential_recs` — 2,205 rows LIVE** (134 statewide/351 lines · 2,071 local/3,357) on the nightly `credential-catalog-sync`. ⭐ **Sam's rule:** statewide exists → quote the **statewide set ONLY**; no statewide → the **most common** local recs with their college counts. Never both. ⭐ **The builder REUSES `fact-sheet/_build_statewide_recs.py`** — Sierra quoting different credit from the Fact Sheet is a credibility failure. ⚠️ **Lead with the LIST, never a count:** POST measures **10 lines · 9 carrying a C-ID · 8 DISTINCT · 1 with none**, and the `AJ 110` repeat is **flagged, never auto-resolved** (Sam: *"AJ 110 may be C-ID and it is Elective"*). **Standing retrieval rules, each earned by a failing probe:** search is **TRIGRAM, never `tsquery`** (`to_tsquery('english','aed:*')` → `'a':*` took the CPR corpus out); score the **best single name**, never the concatenation (length-normalized similarity ranks the BEST-CURATED record WORST); **`statewide` is a FILTER, not a tie-break**; **no pure-fuzzy** (tier-4 floor 0.25 + `matched_via`); **zero rows is a RESULT**, not a license to offer a neighbour. ⚠️ **Every student count is a FLOOR and the denominator ships as a COLUMN** — only 4.2% of student rows are nameable; `students_suppressed=true` must never render like `colleges_with_student_data=0`. ⚠️ **The statewide-rec gate is `ccc_rec` OR a published statewide set** — `ccc_rec` is derived from ADOPTIONS, so gating on it alone hid **38 statewide credentials with zero adopters, 36 of them carrying 75 published rec lines** (Carpenters ladder, NCCER, CSLB, ICC, OSHA 10/30) from *every* credential route. ⚠️ **Rec lines are ENRICHMENT, never a filter** — the map is declared OUTSIDE the try and a credential with no line is **still named**; dropping it re-creates the false zero. Every credential route renders through the **shared** `renderRecLines` off **one** batched `credential_recs_for_titles()` — a second lookup is a second matcher that can drift. ✅ **`surface` live since v56 (2026-08-22):** `KNOWN_SURFACES` (8), `sierra_guidance.surface` (the live CHECK allows `skyview-ask`, read live 2026-09-22 by the SkyView lane), the Training-tab picker; 2 of 7 rows are scoped `my-college`. ✅ v66 (#1568, 2026-09-17) shipped `deriveViewer()` — `reviewer` · `team` · `public` through PostgREST with the ANON key and the caller's own credential, fails closed to `public`, files `viewer` + `surface` on `chat_interactions` (guard `sierra_viewer` 63); its five unshipped days were an INVISIBLE OUTAGE (the function ships only on a deploy dispatch). ⚠️ It widens nothing: a verified reviewer seeing COBI data is the SECOND build, routed through Governance and the student-detail disclosure ADR (Rule 10 a3) first. **Open:** corpus covers **59 of 123** colleges; `chatbox_college_profiles` stale since 2026-06-25 **except contacts** (live); its `credit_distribution` column is read by nobody since 2026-08-24 (#1325); 12 adoption-file statewide titles absent from `chatbox_credentials`. **NEXT:** Sam reads the actual prose — no session has, the sandbox is egress-blocked from `*.supabase.co`. ✅ **PROGRAM SEARCH · PLACE ANCHOR · PROSPECTIVE CREDIT (v67–v73).** `coci_college_programs` (22,335 rows / 118 colleges) is read by `search_college_programs` — title AND code, neither gating. ⚠️ **NEVER INDEX IT** (#1602). A county, a region OR a NAMED SUB-REGION anchors `askedGeo` and orders both catalog RPCs INSIDE the query (`anchor_county` / `anchor_region`, never a filter). ⭐ **`SUBREGIONS` (v73, 13 names) carries its OWN anchor campuses** — the county sets the band, their centroid orders within it (LA County runs Lancaster to Long Beach); ambiguous names are omitted (*South Bay*), and the block says the rest of the county is close, so the list is no fence. ⚠️ **SAM'S BAR: a COURSE-LEVEL answer — what might qualify, so the visitor can ask where it has not been granted; the exhibit answer is a miss even when every fact is true.** The block answers it: per core TOP, the full course lists of the three nearest colleges, ordered by `COLLEGE_POINTS` (119 points, unverified: `s275-fable-verify-campus-points`) inside a band (county > region > `REGION_NEIGHBORS` > elsewhere), with distances on the headings. The first sentence is the answer and the first course named is in the TARGET program (the holding phrase says which is held; the training program is BACKGROUND, last). An absence is what the CATALOG shows, at EVERY mention — the closing caveat as much as the opener, where v72 lapsed — and names the bridges. Articulations come after, only for the credential held. **v73 live 2026-09-18 23:01Z (#1624; A/B clean — 0 regressions, 5 fixes):** ⭐ **Sam's quick list and flyer** (`sam-quick-list-and-flyer-...-2026-09-18`). `program_typical_courses()` aggregates `chatbox_college_courses` statewide per TOP, in COLLEGES (never rows) (50 of 65 CNA colleges list a Nurse Assistant course, 16 an acute-care one; Fundamentals of Nursing 15, Fundamentals of Vocational Nursing 12, Vocational Nursing I 10, Pharmacology 8, IV Therapy 8 of 44 LVN colleges). ⚠️ **`cpl_course_title_norm` EXPANDS `cna`/`lvn` and folds `aide`→`assistant`, in ONE FLAT EXPRESSION — no CTE, no dedupe, no sort.** `typicalFoldKey()` already sorts the stems and unions the colleges downstream, so canonicalizing the key here buys NOTHING and costs real time (3,463→5,426 ms over 141,696 titles) against the anon role's **3 s** `statement_timeout` — the CTE version made the smoke's probe read rows=0 every run while the answers stayed correct. A sorted key breaks that probe too: it reads `norm` as a string. The block renders a QUICK LIST (held program first); the rule asks for a two-column table after paragraph one — **no row quota** (it made the model restate one course under six names; a program is often ONE course plus add-ons), and the columns are independent lists, never row-by-row pairings. `RELATED_PROGRAMS` (Sam's list, keyed by CNA 1230.30) renders the FLYER, every entry checked against the catalog data. The PRECEDENT ON RECORD renders inside the block (a college is paired to a course only where the record names ONE adopter). **Every course line carries its college.** ⭐ **Sam: never "COCI" — say "catalog data"** (swept; the always-on rule carries the ban; the smoke fails any answer saying it). **Route time limit** (#1612): 5,000 ms per retrieval read, `CPL_ROUTE_TIMEOUT_MS` overrides with no deploy; cuts fail safe (`s275-fable-programs-route-latency`). ⚠️ A/B doctrine: read the grid AND the candidate's answer, never the run's conclusion; the push-triggered smoke tests PRODUCTION with the branch's assertions, so it is red until the deploy; never two suites at once. ✅ **The 397 garbled course titles are gone (2026-09-27 20:14 UTC, Sam's open-asks card 7: clean them once, under a receipt, and keep the loader repair).** Each sat beside the repaired twin the 2026-09-18 sync inserted: the sync upserts on a key that includes the title, so it never removed the old row, and the loader repairs every new sync. `course-title-cleanup-apply.yml` removed them from the reviewed plan `kb/course_title_cleanup_out/2026-09-27/` (run 36347161832); the receipt `removed_2026-09-27T201419Z.json` holds full row images and `--rollback` restores them (`tests/course_title_cleanup_apply_test.py`). Live after, re-read S296: 141,696 rows, none carrying the mojibake marks. A loader edit on a merge re-syncs the catalog (`s274-fable-offerings-replace-atomic`). **Open:** extend `RELATED_PROGRAMS` beyond the CNA; Sam reads v73's answer; ⚠️ the PRECEDENT block prefers Lemoore's CNA-into-a-CNA-course over Chaffey NURVN 414, so v73 says no college has articulated CNA credit into an LVN course — Chaffey is exactly that, so it is now a FALSE NEGATIVE (`s276-fable-precedent-names-its-program`). Guards: `sierra_prospective_credit` (163) · `sierra_route_time_limit` · `sierra_place_anchor` (96) · `sierra_program_search` (37) · `coci_program_cip_test.py` · `course_title_mojibake_test.py` · smoke 7p, 7c, 7s. Story: `docs/cpl_assistant_lessons.md`.


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
ceiling, not a spend. Shipped as **v64** (02:03:41Z) and **v65** (16:41:58Z); smoke
run 176 passed 22 of 22 and health run 110 passed. #1550's instrumentation rides
along: a blank turn logs `EMPTY ANSWER` with its `stop_reason` and the client gets
`event: error` before `done`. Full story:
[`cpl_assistant_lessons`](../../cpl_assistant_lessons.md). ⚠️ **The health probe
cannot see this class** — one simple question, and it passed straight through two
hours of blanks on broad questions.


**Cost, MEASURED from `function_logs` across the deploy boundary** (not modelled):

| | requests | input tokens | cached | blended $/MTok in |
|---|---|---:|---:|---:|
| Haiku 4.5 | 48 | 760,274 | 0.0% | $1.00 |
| Sonnet 5 | 23 | 554,161 | 18.6% | **$1.72** |

Sonnet 5 is **1.72× Haiku per input token** (2.00× uncached); the cached prefix is **4,476 of a 24,093-token average request (19%)** and the other 81% is RETRIEVAL — whether it repeats enough to cache is unmeasured. Absolute spend is trivial (23 requests = $1.21): **choose on answer quality, price is a tiebreak.**

⭐ **The cache line names the model that answered** (Sam's ruling, sheet item 3) — from
`event.message.model`, never the `MODEL` constant. ⚠️ **Nothing on our side can see which
Anthropic ACCOUNT pays** — filter the Console by key.

## The standalone page on a phone — the About Sierra control (2026-09-11)

Sam: *"the current mobile view is mostly consumed by the header text."* The intro and beta paragraphs became an **About Sierra** control in the header (an accessible `<button aria-expanded>` panel; the footer keeps the beta and privacy lines); the map.rccd.edu pill hides ≤560px and the tagline ≤400px (`mayHideBelow` in `a11y.config.js`). **Measured at 390×844: the conversation starts 163px down (19%) against 540px (64%) before**; `npm run a11y -- sierra` clean at all nine widths. Guard: `tests/sierra_header_about.test.js` (23). **Open (Sam's ask, flag built, bubble UI not):** a floating Sierra bubble on every COBI tab — `kb/cpl_todos.json` `s255-sam-sierra-bubble-on-every-tab`.

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
one place. **Landed (#1751):** `tryGroup()` draws the Sierra button only where
`sierraHost()` opens the CPL Assistant tab, and asks on every render; elsewhere
the control reads *Try it in: My College*, and on a phone the lone button takes
the row. Guard: `tests/sierra_training_round1.test.js` (5d), which also proves
that button's question lands in My College's own box.

## Where applied and transcribed credit comes from (2026-09-30)

Sam asked Sierra for the military and non-military split of Chaffey's applied units and the exhibits behind them (his Training note on turn `1b9230ce`). Sheet [NT56gHRViNX9ZYnRg8r1KR](https://claude.ai/artifact/NT56gHRViNX9ZYnRg8r1KR) (`docs/visuals/2026-09-30-sierra-credit-source.html`), all seven items ruled the same day: 1 fix, 2 do, 3 hand to the funding lane (below), 4 and 5 build, 6 his ruling, 7 draft the Training rule after the data ships.

⭐ **Sam's item 6 ruling (2026-09-30): *"I want Sierra to total for everyone using real numbers but when the totals (at any level) are below 10, to show "<10" on the views. This should happen without a governance gate."*** One published layer for every viewer; no reviewer tier. The condition is the student-detail ADR's decision 5: wherever a real total sits above rows, a withheld remainder spans two or more cells and 10 or more students.

**All of it is live (data applied 2026-09-30, receipts in `kb/receipts/`); Sierra reads it from cpl-chat v74 (#1780, deployed 17:19 UTC after a preview A/B with no regressions):**
- **#1777** `map_college_credit_summary` suppresses **each figure on its own students**. It had tested only the college's headcount, so 8 colleges published a transcribed total from under 10 students (3 from one), the public `_pub` copy too, and at 13 colleges `applied_credits − articulated_waiting` recovered a thin in-plan figure. It gains `applied_in_plan` and `transcribed_student_view` (student view), a `withheld` list, and **`map_college_credit_statewide`** (real totals). My College renders a withheld figure as "<10 students" (`numN()`; `num(null)` had been a false zero).
- **#1779** **`map_college_credit_bucket`** (military / non-military, per college and statewide) and **`map_college_exhibit_credit`** (per college and exhibit: title, MAP's CPL type, units applied and transcribed, recommendations, "<10 each" roll-ups), rebuilt nightly inside the promotion, each raising on its own property check. MAP's `CPLTypeCode` now rides into the title tables (the id rule mistyped 546 of 677 Credit by Exam exhibits).
- **#1780** Sierra leads with applied on the CPL plan, labels MAP's *Applied Credits* column as the one that CONTAINS the waiting credit (she had counted Chaffey's 1,206 units in both), splits the buckets non-military first, says "<10 students" for a withheld figure, and answers "where does this college's credit come from" by units from the exhibit table.

**Item 3, handed to the funding lane (Sam: "hand to the funding lane"):** does applied FTES count credit articulated but not yet applied? Chaffey's `pa_u` reads 19,020 against 18,066 units at *Applied to CPL Plan*, so at least 954 units come from rows outside the plan, most likely the 1,206 basic-military-service units at Needs Action that MAP's *Applied Credits* column repeats. Unverified row by row (the funding pull is not stored). Recorded where a funding session's Rule 8 query finds it: `cpl_memory` `summary-applied-includes-needs-action-articulated-2026-09-30` (tag `implementation-funding`); the funding lane file sits at its size budget, so it carries no copy.

⚠️ **Never infer a unit split from counts of articulated exhibits.** Her Chaffey answer read "110 Standardized, 77 Credit by Exam" off the articulated-exhibit list; by units, Standardized Assessment carried 95% of Chaffey's applied credit and Credit by Exam none. ⚠️ **MAP's two views disagree by 5% on applied in plan** (171,078 articulation view vs 162,603 student view, 26 colleges); the breakdowns use the student view so they add up to the totals beside them. Most of the gap is a double count in the catalog-year view (below); the note for Pedro is Sam's to edit and send ([map-custom-reports](map-custom-reports.md)). **Item 7 is closed:** Sam added the layout rule in Training (`sierra_guidance` `f3a529ae`, a directive, 2026-09-30 18:04 UTC): one table per source answer, non-military rows first, each group ending on its "<10 each" line. It carries layout only; the substance ships in `CREDIT_STATUS_RULE`. Sessions cannot write `sierra_guidance` or `sierra_feedback` (the SQL guard denies INSERT and UPDATE), so a Training change goes to Sam as text to paste. Lessons: [`student_detail_load_lessons`](../../student_detail_load_lessons.md) (2026-09-30). `cpl_memory`: `sierra-credit-sources-live-2026-09-30`, `sam-sierra-real-totals-lt10-no-governance-gate-2026-09-30`, `credit-summary-per-figure-suppression-live-2026-09-30`, `map-military-columns-partition-applied-credit-2026-09-30`.

**S308/S309 (the two chains joined, 2026-09-30).** ⚠️ **The two-view gap is mostly a double count:** on 253 college × exhibit × catalog year × recommendation keys at 24 colleges, `View_CollegeExhibitCRByCatalogYear` reads exactly twice the student view for the same students, 6,782 of the 8,474 units; `cpl_memory` `map-catalog-year-view-doubles-applied-2026-09-30`. **WRONG (Sam, sheets 14 and 16 card 1): v76 gave CCSF's split statewide.** ✅ **v77 (#1808) answers it:** the matcher strips a possessive (`sierra_geo_ranking` 3b); smoke 15e asks his question (run 36947828031: 13,914 units, military 13,844, non-military 71, led by Default Credit, matching the rows). His sheet 16 note restated v76's 21:14Z answer. ✅ **7s names the place in the first paragraph (S314):** v77's short first sentence left it nowhere, one run in three. ⚠️ **7c's catalog reads still time out under load:** run 36943057866 (23:55Z) lost `program_typical_courses`, `search_college_programs` and a `chatbox_college_courses` read to the 8 s limit together; 48 ms quiet, 3,800 ms during a smoke. `chatbox_college_courses` has no `top_code` index (a 141,696-row seq scan per call): the candidate, by migration, measured first (`methodology-an-index-is-a-write-path-cost-until-measured`). #1789 stores `title_norm` (generated; the schema of record recomputes it). #1791: 7c/7s set aside an absence attributed to the catalog or to articulation. ✅ **7p (#1796):** `coci_college_programs` stores its four search vectors (`cx_search_norm`'s file recomputes them); identical on 13 term sets, a 4-term call 1,473 → 415 ms. #1794: 7s's negation takes a word boundary.
