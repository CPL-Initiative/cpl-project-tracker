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

✅ **`chatbox_credentials` LIVE (1,987 rows)** — public-read/no-write, loaded by `kb/_sync_credential_catalog.py` from the PUBLISHED artifact so suppression is inherited by construction. Routes CRED·STD, CRED·VOLUME, COLLEGE·ADOPT, ALIGN live. ✅ **`chatbox_credential_recs` — 2,205 rows LIVE** (134 statewide/351 lines · 2,071 local/3,357) on the nightly `credential-catalog-sync`. ⭐ **Sam's rule:** statewide exists → quote the **statewide set ONLY**; no statewide → the **most common** local recs with their college counts. Never both. ⭐ **The builder REUSES `fact-sheet/_build_statewide_recs.py`** — Sierra quoting different credit from the Fact Sheet is a credibility failure. ⚠️ **Lead with the LIST, never a count:** POST measures **10 lines · 9 carrying a C-ID · 8 DISTINCT · 1 with none**, and the `AJ 110` repeat is **flagged, never auto-resolved** (Sam: *"AJ 110 may be C-ID and it is Elective"*). **Standing retrieval rules, each earned by a failing probe:** search is **TRIGRAM, never `tsquery`** (`to_tsquery('english','aed:*')` → `'a':*` took the CPR corpus out); score the **best single name**, never the concatenation (length-normalized similarity ranks the BEST-CURATED record WORST); **`statewide` is a FILTER, not a tie-break**; **no pure-fuzzy** (tier-4 floor 0.25 + `matched_via`); **zero rows is a RESULT**, not a license to offer a neighbour. ⚠️ **Every student count is a FLOOR and the denominator ships as a COLUMN** — only 4.2% of student rows are nameable; `students_suppressed=true` must never render like `colleges_with_student_data=0`. ⚠️ **The statewide-rec gate is `ccc_rec` OR a published statewide set** — `ccc_rec` is derived from ADOPTIONS, so gating on it alone hid **38 statewide credentials with zero adopters, 36 of them carrying 75 published rec lines** (Carpenters ladder, NCCER, CSLB, ICC, OSHA 10/30) from *every* credential route. ⚠️ **Rec lines are ENRICHMENT, never a filter** — the map is declared OUTSIDE the try and a credential with no line is **still named**; dropping it re-creates the false zero. Every credential route renders through the **shared** `renderRecLines` off **one** batched `credential_recs_for_titles()` — a second lookup is a second matcher that can drift. ✅ **THE `surface` FIELD HAS BEEN LIVE SINCE 2026-08-22 (v56):** `KNOWN_SURFACES` (8) on the request, `sierra_guidance.surface` (⚠️ the live CHECK still lacks `skyview-ask`, so a curator picking it gets a hard save failure — one statement, NEEDS SAM), the Training-tab picker; **2 of the 7 active rows are scoped `my-college`** (`15ec666b`, `7d8641be`), 5 ship everywhere. ✅ **DEPLOYED 2026-09-17 as cpl-chat v66 (#1568); the five days it sat unshipped were an INVISIBLE OUTAGE** — the page ships on merge, the function only on a `cpl-chat-deploy.yml` dispatch, and curl never preflights (it does now, #1595). `deriveViewer()` derives `reviewer` · `team` · `public` through PostgREST with the ANON key and the caller's own credential, fails closed to `public`, files `viewer` + `surface` on `chat_interactions` and echoes `event: meta`. Guard: `tests/sierra_viewer.test.js` (63). ⚠️ **IT WIDENS NOTHING:** no prompt line, no retrieval change — letting a verified reviewer see COBI data is the SECOND build (the boundary inside COBI is aggregate vs student-detail), routed through Governance and the student-detail disclosure ADR (Rule 10 a3) first. **Open:** corpus covers **59 of 123** colleges; `chatbox_college_profiles` stale since 2026-06-25 **except contacts** (live); its `credit_distribution` column is read by nobody since 2026-08-24 (#1325); 12 adoption-file statewide titles absent from `chatbox_credentials`; ✅ **Sierra Training queue CLEARED by Sam 2026-08-26 — 51 of 51 handled, 7 instructions in use.** **NEXT:** Sam reads the actual prose — no session has, the sandbox is egress-blocked from `*.supabase.co`. ✅ **PROGRAM SEARCH (S272) · PLACE ANCHOR (S273) · PROSPECTIVE CREDIT (S274).** `coci_college_programs` (22,335 rows / 118 colleges) is read by `search_college_programs` — title AND code, neither gating, `matched_via` per row; phrases through `phraseto_tsquery` ("LVN" reaches 56 colleges, 0 noise); vectors once per call, 0.9–2.6 s; ⚠️ **NEVER INDEX `coci_college_programs`** (#1602). **v67** live 2026-09-17 23:31Z. **v68** live 2026-09-18 03:08Z (#1607): a county or region named in the question (`resolveAskedPlace`) anchors `askedGeo`, is stripped from detection and the keyword routes, and orders both catalog RPCs INSIDE the query (`anchor_county` / `anchor_region`, never a filter); `cna` family; phrase-capable offerings query; ask-shape stop words. ⚠️ **SAM'S BAR (2026-09-18): *"what might qualify so the user could ask for it at a college that has not yet granted it"* — a course-level answer; the exhibit answer is a miss even when every fact is true** (`cpl_memory` `sam-cna-question-is-what-might-qualify-not-who-articulated-2026-09-18`). v68 answered the exhibit question. **v69** live 2026-09-18 03:53Z (#1608, deploy run 35304800563): the prospective-credit block — per core TOP, the three nearest colleges' full course lists from `chatbox_college_courses` (141,696 rows), `PROSPECTIVE_RULE`: the target is the program they want to ENTER, every match a REQUEST, cite the precedent; a neighbor-region band (`REGION_NEIGHBORS`; county 3 > region 2 > neighbor 1 > elsewhere 0 — Orange County is a region of one county with no LVN entry program, so volume had ranked Sacramento ahead of Long Beach); `isFalseFriend` (a tier-3/4 SUBSTRING hit must be a whole word — "cna" inside "ccna" switched the local route off); both credential routes always; the local route ranks an ADOPTED credential first and keeps six (the cap had hidden Chaffey's NURVN 414 after the gate no longer did). A/B run 35302590083: candidate ALL MODES OK, no regressions, 7c's course-level assertion fixed by the candidate; prompts no larger (21,123 vs 21,900 uncached tokens). Second A/B (35303520840): preview ALL MODES OK, no regressions, the candidate cites Chaffey's precedent. ⚠️ The merge's path-triggered `coci-offerings-sync.yml` died twice on a 4,000-row chunk (57014, 8 s `statement_timeout`) and left `coci_college_offerings` live at 12,000 then 8,000 of 16,097 rows; both v69 smoke runs failed only 7c's offerings-RPC check. Fix: 1,000-row chunks + a halving retry (`coci_offerings_sync_chunk_test.py`, 21); an atomic replace is the durable fix. Course titles: 381 of 141,696 carry mojibake — one repair in `kb/_text_repair.py` for both loaders (`ae76280`), the stored rows' cleanup NEEDS SAM (`s274-sam-course-title-cleanup`). **NEXT:** Sam reads the v69 answer (`s274-sam-oc-question-v69`); a client-side time limit on every retrieval RPC; a county-to-county distance table; generated tsvector columns only as a MEASURED loader-side option. **NEEDS SAM:** auto-deploy on merge (unruled since S272). Guards: `tests/sierra_prospective_credit.test.js` (61) · `sierra_place_anchor` (77) · `sierra_program_search` (37) · `coci_program_cip_test.py` (20) · `course_title_mojibake_test.py` (40) · smoke 7p, 7c. Story: `docs/cpl_assistant_lessons.md`.


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

⚠️ **A deploy timestamp is not an era boundary** — date rows by something whose SHAPE changed, never by the wall clock. ✅ Smoke **15a/15c closed by PR #1566** (the stripper spans a bounded same-clause gap; 15c cannot cross a dash; `tests/smoke_negation_stripper.test.js` runs real sed against the recorded answers). Mode **16a is fixed** (#1559): the roster is asserted at retrieval as **16r**, prose keeps only floors and bans.

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

Sam: *"the current mobile view is mostly consumed by the header text… consolidate all this text to hover overs in the header."* The intro and beta paragraphs became an **About Sierra** control in the header — an accessible `<button aria-expanded>` panel (the footer keeps the beta and privacy lines). On a phone the header is one row: the map.rccd.edu pill hides ≤560px and the tagline ≤400px, declared as `mayHideBelow` in `a11y.config.js`. **Measured at 390×844: the conversation starts 163px down (19%) against 540px (64%) before.** `npm run a11y -- sierra` is clean at all nine widths. Guard: `tests/sierra_header_about.test.js` (23). ⚠️ The sweep was clean BEFORE the change too — the number that mattered was the first message's y-offset at a phone width. **Open (Sam's ask, advice given, flag now built — the bubble UI itself is not):** a floating Sierra bubble on every COBI tab — `kb/cpl_todos.json` `s255-sam-sierra-bubble-on-every-tab`.
