---
title: "Sierra retrieval + corpus — lane state"
created: 2026-08-28
updated: 2026-09-18
tags: [reference, roadmap-lane]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference/lanes
related:
  - "[[CLAUDE]]"
---

# Sierra retrieval + corpus

**What this lane is:** Sierra answers credential questions off the CURATED layer, not the raw freehand titles colleges typed into MAP.

## Status

✅ **`chatbox_credentials` LIVE (1,987 rows)** — public-read/no-write, loaded by `kb/_sync_credential_catalog.py` from the PUBLISHED artifact so suppression is inherited by construction. Routes CRED·STD, CRED·VOLUME, COLLEGE·ADOPT, ALIGN live. ✅ **`chatbox_credential_recs` — 2,205 rows LIVE** (134 statewide/351 lines · 2,071 local/3,357) on the nightly `credential-catalog-sync`. ⭐ **Sam's rule:** statewide exists → quote the **statewide set ONLY**; no statewide → the **most common** local recs with their college counts. Never both. ⭐ **The builder REUSES `fact-sheet/_build_statewide_recs.py`** — Sierra quoting different credit from the Fact Sheet is a credibility failure. ⚠️ **Lead with the LIST, never a count:** POST measures **10 lines · 9 carrying a C-ID · 8 DISTINCT · 1 with none**, and the `AJ 110` repeat is **flagged, never auto-resolved** (Sam: *"AJ 110 may be C-ID and it is Elective"*). **Standing retrieval rules, each earned by a failing probe:** search is **TRIGRAM, never `tsquery`** (`to_tsquery('english','aed:*')` → `'a':*` took the CPR corpus out); score the **best single name**, never the concatenation (length-normalized similarity ranks the BEST-CURATED record WORST); **`statewide` is a FILTER, not a tie-break**; **no pure-fuzzy** (tier-4 floor 0.25 + `matched_via`); **zero rows is a RESULT**, not a license to offer a neighbour. ⚠️ **Every student count is a FLOOR and the denominator ships as a COLUMN** — only 4.2% of student rows are nameable; `students_suppressed=true` must never render like `colleges_with_student_data=0`. ⚠️ **The statewide-rec gate is `ccc_rec` OR a published statewide set** — `ccc_rec` is derived from ADOPTIONS, so gating on it alone hid **38 statewide credentials with zero adopters, 36 of them carrying 75 published rec lines** (Carpenters ladder, NCCER, CSLB, ICC, OSHA 10/30) from *every* credential route. ⚠️ **Rec lines are ENRICHMENT, never a filter** — the map is declared OUTSIDE the try and a credential with no line is **still named**; dropping it re-creates the false zero. Every credential route renders through the **shared** `renderRecLines` off **one** batched `credential_recs_for_titles()` — a second lookup is a second matcher that can drift. ✅ ✅ **`surface` live since v56 (2026-08-22):** `KNOWN_SURFACES` (8), `sierra_guidance.surface` (⚠️ the live CHECK lacks `skyview-ask` — a curator picking it gets a hard save failure; one statement, NEEDS SAM), the Training-tab picker; 2 of 7 rows are scoped `my-college`. ✅ v66 (#1568, 2026-09-17) shipped `deriveViewer()` — `reviewer` · `team` · `public` through PostgREST with the ANON key and the caller's own credential, fails closed to `public`, files `viewer` + `surface` on `chat_interactions` (guard `sierra_viewer` 63); its five unshipped days were an INVISIBLE OUTAGE (the function ships only on a deploy dispatch). ⚠️ It widens nothing: a verified reviewer seeing COBI data is the SECOND build, routed through Governance and the student-detail disclosure ADR (Rule 10 a3) first. **Open:** corpus covers **59 of 123** colleges; `chatbox_college_profiles` stale since 2026-06-25 **except contacts** (live); its `credit_distribution` column is read by nobody since 2026-08-24 (#1325); 12 adoption-file statewide titles absent from `chatbox_credentials`; ✅ Training queue cleared by Sam 2026-08-26 (51 of 51). **NEXT:** Sam reads the actual prose — no session has, the sandbox is egress-blocked from `*.supabase.co`. ✅ **PROGRAM SEARCH · PLACE ANCHOR · PROSPECTIVE CREDIT (v67–v72, 2026-09-17/18).** `coci_college_programs` (22,335 rows / 118 colleges) is read by `search_college_programs` — title AND code, neither gating, phrases through `phraseto_tsquery`, vectors once per call; ⚠️ **NEVER INDEX `coci_college_programs`** (#1602). A county or region named in the question anchors `askedGeo` and orders both catalog RPCs INSIDE the query (`anchor_county` / `anchor_region`, never a filter). ⚠️ **SAM'S BAR (2026-09-18): *"what might qualify so the user could ask for it at a college that has not yet granted it"* — a course-level answer; the exhibit answer is a miss even when every fact is true.** The prospective-credit block answers it: per core TOP, the full course lists (`chatbox_college_courses`) of the three colleges nearest the anchor — `COLLEGE_POINTS` (119 campus points, unverified: `s275-fable-verify-campus-points`) orders inside a proximity band (county > region > `REGION_NEIGHBORS` > elsewhere), every heading carries "about N miles from …"; the first course named is in the TARGET program (the visitor's holding phrase says which credential is held; the program that trains it is BACKGROUND, rendered last); every "no college in the place" line states what the catalog data shows and names the bridges; the first sentence is the answer; articulations come after the courses, only for the credential held. **v72 live 2026-09-18 16:43Z (#1617, run 35370070548; health, smoke green):** ⭐ **Sam's quick list and flyer** (*"a quick list view of the typical CNA course next to typical LVN courses… the user did not say where they did their CNA, so being able to generalize is an added skill level… a flyer — Have a CNA Cert? Ask for your credit toward LVN, Rad Tech, ADN, Med Asst, Surgical Tech, Sterilization Tech, Phlebotomy"*). `program_typical_courses()` (`chatbox/supabase_program_typical_courses.sql`, live) aggregates `chatbox_college_courses` STATEWIDE per TOP — normalized title → `count(distinct college)` (48 of 65 CNA colleges list a Nurse Assistant course; Fundamentals of Nursing 13, Fundamentals of Vocational Nursing 10, IV Therapy 8, Pharmacology 8, Vocational Nursing I 8 of 44 LVN colleges); the block renders a QUICK LIST (held program first, counts in colleges) and the rule asks for a two-column table right after the first paragraph. `RELATED_PROGRAMS` (Sam's list, keyed by the CNA program 1230.30, attributed) renders the FLYER checked against the catalog data (statewide count, in-place colleges or *the catalog data lists none in <place>* with the nearest two and distance, typical first courses; Sterile Processing is coded Hospital Central Service Technician 1209.00). The PRECEDENT ON RECORD renders INSIDE the block from the recs already fetched (Chaffey paired only because the record names one adopter; "none" only when the record was read; a holding phrase required). **Every course line carries its college.** ⭐ **Sam: never "COCI" — say "catalog data"**: every rendered string swept, the always-on catalog rule carries the ban, the smoke fails any answer that says it. **Route time limit** (#1612): 5,000 ms per retrieval read, `CPL_ROUTE_TIMEOUT_MS` overrides with no deploy, `0` disables; every cut so far was `search_college_programs` over 5 s and failed safe (`s275-fable-programs-route-latency`). ⚠️ A/B doctrine: read the grid AND the candidate's answer, never the run's conclusion; the push-triggered smoke tests PRODUCTION with the branch's assertions and is red until the deploy; never two suites at once against production. 381 stored course titles carry mojibake (repaired at the loader; cleanup NEEDS SAM, `s274-sam-course-title-cleanup`); a loader edit on a merge re-syncs the live catalog (atomic replace: `s274-fable-offerings-replace-atomic`). **Open:** extend `RELATED_PROGRAMS` beyond the CNA when the team names the next list; Sam reads v72's answer. Guards: `tests/sierra_prospective_credit.test.js` (163) · `sierra_route_time_limit` (22) · `sierra_place_anchor` (77) · `sierra_program_search` (37) · `coci_program_cip_test.py` (20) · `course_title_mojibake_test.py` (40) · smoke 7p, 7c. Story: `docs/cpl_assistant_lessons.md`.


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

Closed: smoke 15a/15c (#1566), 16a (#1559, the roster asserted at retrieval as 16r); deploy timestamps are not era boundaries (KB note).

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
