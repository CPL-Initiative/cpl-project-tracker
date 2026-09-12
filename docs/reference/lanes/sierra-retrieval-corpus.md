---
title: "Sierra retrieval + corpus — lane state"
created: 2026-08-28
updated: 2026-09-12
tags: [reference, roadmap-lane]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference/lanes
related:
  - "[[CLAUDE]]"
---

# Sierra retrieval + corpus

> **Relocated verbatim from `CLAUDE.md` §11 on 2026-08-28** (Session 206, the
> consolidation). This is **always-current lane state, not an archive** —
> update it at every checkpoint that moves this lane, exactly as you used to
> update the §11 cell. `CLAUDE.md` keeps the one-line pointer; the detail is
> here.

**What this lane is:** Sierra answers credential questions off the CURATED layer, not the raw freehand titles colleges typed into MAP.

## Status

✅ **`chatbox_credentials` LIVE (1,987 rows)** — public-read/no-write, loaded by `kb/_sync_credential_catalog.py` from the PUBLISHED artifact so suppression is inherited by construction. Routes CRED·STD, CRED·VOLUME, COLLEGE·ADOPT, ALIGN live. ✅ **`chatbox_credential_recs` — 2,205 rows LIVE** (134 statewide/351 lines · 2,071 local/3,357) on the nightly `credential-catalog-sync`. ⭐ **Sam's rule:** statewide exists → quote the **statewide set ONLY**; no statewide → the **most common** local recs with their college counts. Never both. ⭐ **The builder REUSES `fact-sheet/_build_statewide_recs.py`** — Sierra quoting different credit from the Fact Sheet is a credibility failure. ⚠️ **Lead with the LIST, never a count:** POST measures **10 lines · 9 carrying a C-ID · 8 DISTINCT · 1 with none**, and the `AJ 110` repeat is **flagged, never auto-resolved** (Sam: *"AJ 110 may be C-ID and it is Elective"*). **Standing retrieval rules, each earned by a failing probe:** search is **TRIGRAM, never `tsquery`** (`to_tsquery('english','aed:*')` → `'a':*` took the CPR corpus out); score the **best single name**, never the concatenation (length-normalized similarity ranks the BEST-CURATED record WORST); **`statewide` is a FILTER, not a tie-break**; **no pure-fuzzy** (tier-4 floor 0.25 + `matched_via`); **zero rows is a RESULT**, not a license to offer a neighbour. ⚠️ **Every student count is a FLOOR and the denominator ships as a COLUMN** — only 4.2% of student rows are nameable; `students_suppressed=true` must never render like `colleges_with_student_data=0`. ⚠️ **The statewide-rec gate is `ccc_rec` OR a published statewide set** — `ccc_rec` is derived from ADOPTIONS, so gating on it alone hid **38 statewide credentials with zero adopters, 36 of them carrying 75 published rec lines** (Carpenters ladder, NCCER, CSLB, ICC, OSHA 10/30) from *every* credential route. ⚠️ **Rec lines are ENRICHMENT, never a filter** — the map is declared OUTSIDE the try and a credential with no line is **still named**; dropping it re-creates the false zero. Every credential route renders through the **shared** `renderRecLines` off **one** batched `credential_recs_for_titles()` — a second lookup is a second matcher that can drift. ✅ **THE `surface` FIELD HAS BEEN LIVE SINCE 2026-08-22 (v56):** `KNOWN_SURFACES` (8) on the request, `sierra_guidance.surface` (⚠️ the live CHECK still lacks `skyview-ask`, so a curator picking it gets a hard save failure — one statement, NEEDS SAM), the Training-tab picker; **2 of the 7 active rows are scoped `my-college`** (`15ec666b`, `7d8641be`), 5 ship everywhere. ⚠️ This lane read *"RECOMMENDED, NOT BUILT … blocked on Sam's go"* for three weeks after it shipped, and S258 carried that line into open question 3. What Sam's **"3. Yes" (2026-09-12)** actually answered is the SCOPE-FLAG question on the To-Do he read (`s258-sam-sierra-bubble-scope`): whether Sierra may use non-public data is decided by the SERVER from the sign-in, never claimed by the page. ✅ **BUILT S259 as cpl-chat v66 (PR #1568 — NOT DEPLOYED until Sam dispatches `cpl-chat-deploy.yml`):** `deriveViewer()` derives `reviewer` · `team` · `public` by calling `is_allowed_reviewer()` / `team_pass_ok()` through PostgREST with the ANON key and the caller's own credential (JWT bearer / `x-team-pass`; CORS admits the header), fails closed to `public`, files `viewer` + `surface` on `chat_interactions` (migration `chat_interactions_viewer_surface`, applied live 2026-09-12; schema of record `chatbox/supabase_sierra_feedback.sql`) and echoes `event: meta`, which the COBI widget renders as one line of words (*Recognized by the assistant as…*; nothing for the public). The two COBI callers send what they hold via `credentialHeaders()`; the public page and the Fact Sheet stay on the anon key. Guard: `tests/sierra_viewer.test.js` (63). ⚠️ **IT WIDENS NOTHING:** no prompt line, no retrieval change — letting a verified reviewer see COBI data is the SECOND build (the boundary inside COBI is aggregate vs student-detail), routed through Governance and the student-detail disclosure ADR (Rule 10 a3) first. Built-in rules still outrank guidance; a surface-aware rule registry is a separate change. **Open:** corpus covers **59 of 123** colleges; `chatbox_college_profiles` stale since 2026-06-25 **except contacts** (live — see the MAP Users row); ⚠️ its **`credit_distribution` column is no longer read by anyone** — it was Sierra's per-college credit source until 2026-08-24 and had drifted two months (#1325, see the My College row); 12 adoption-file statewide titles absent from `chatbox_credentials`; ✅ **Sierra Training queue CLEARED by Sam 2026-08-26 — 0 still to do, 51 of 51 handled, 7 instructions in use** (screenshot; supersedes the 25-untriaged backlog and unblocks the alignment feedback loop, which `alignment-tested-via-sierra-training` called load-bearing). **NEXT:** Sam reads the actual prose — no session has, the sandbox is egress-blocked from `*.supabase.co`. Story: `docs/sierra_credit_recs_lessons.md` · `docs/sierra_credential_naming_lessons.md` · `docs/cpl_assistant_lessons.md`.


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

✅ **THE CAP-HIT READ IS DONE (S257, 2026-09-11): 0 real cap hits and 0 blanks on the fixed code** — v65 (8,192): 37 turns, max 1,930 tokens; v64's two rows AT the 2,048 cap are zero-character `smoke-ci` blanks served by still-warm v63 isolates ~25 s past the deploy (0 `EMPTY ANSWER` lines in 17 hours; the cache line's `model=` format dates the crossover to 02:04:06Z). ⚠️ **A deploy timestamp is not an era boundary** — date rows by something whose SHAPE changed, never by the wall clock. ⚠️ **And there is almost nothing to measure:** over 30 hours `chat_interactions` held `smoke-ci` 432 turns, `health-probe` 9 and **6 human turns across 4 sessions**, so "watch live traffic for a week" observes the smoke suite. **NEXT:** the **sixteen-row register sweep** on Sonnet 5 (Sam's standing rule, 2026-08-30) is the only instrument that would test the ceiling; an A/B of adaptive thinking on the preview slug only if a measured quality gap appears. ✅ Smoke **15a/15c closed by PR #1566** (the stripper spans a bounded same-clause gap; 15c cannot cross a dash; `tests/smoke_negation_stripper.test.js` runs real sed against the recorded answers). Mode **16a is fixed** (#1559): the roster is asserted at retrieval as **16r**, prose keeps only floors and bans.

**Cost, MEASURED from `function_logs` across the deploy boundary** (not modelled):

| | requests | input tokens | cached | blended $/MTok in |
|---|---|---:|---:|---:|
| Haiku 4.5 | 48 | 760,274 | 0.0% | $1.00 |
| Sonnet 5 | 23 | 554,161 | 18.6% | **$1.72** |

Sonnet 5 is **1.72× Haiku per input token** (2.00× uncached); the cached prefix is **4,476 of a 24,093-token average request (19%)** and the other 81% is RETRIEVAL, not history — whether it repeats enough to cache is unmeasured (break the input down in the log line; do not guess again). Absolute spend is trivial (23 requests = $1.21): **choose on answer quality, price is a tiebreak.**

⭐ **The cache line now names the model that answered** (Sam's ruling, decision
sheet item 3) — from `event.message.model`, what the API says it SERVED, never the
`MODEL` constant we asked for. ⚠️ **Nothing on our side can see which Anthropic
ACCOUNT pays**: the code reads a Supabase secret *named* `ANTHROPIC_API_KEY` and a
Console key *displayed as* `ANTHROPIC_API_KEY` is a different namespace — matching
the strings is not evidence. To check where spend lands, filter the Console by key
and group by key.

## The standalone page on a phone — the About Sierra control (2026-09-11)

Sam: *"the current mobile view is mostly consumed by the header text… consolidate all this text to hover overs in the header… and fix the ghosted mountain logo so the peak fits."* The intro and beta paragraphs became an **About Sierra** control in the header — a real `<button aria-expanded>` panel (hover where a pointer can, tap or Enter everywhere, Escape/outside closes; nothing hover-only, nothing deleted; the footer carries the beta and privacy lines). The ridgeline's peak was clipped by `overflow:hidden` — now `overflow: clip visible`. On a phone the header is one row: the map.rccd.edu pill hides ≤560px and the tagline ≤400px, declared as `mayHideBelow` in `a11y.config.js`. **Measured at 390×844: the conversation starts 163px down (19%) against 540px (64%) before.** `npm run a11y -- sierra` is clean at all nine widths. Guard: `tests/sierra_header_about.test.js` (23). ⚠️ The sweep was clean BEFORE the change too — a header that pushes the conversation below the fold breaks no rule the engine measures; the number that mattered was the y-offset of the first message at a phone width. **Open (Sam's ask, advice given, flag now built — the bubble UI itself is not):** a floating Sierra bubble on every COBI tab — `kb/cpl_todos.json` `s255-sam-sierra-bubble-on-every-tab`.
