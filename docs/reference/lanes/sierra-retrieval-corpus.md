---
title: "Sierra retrieval + corpus — lane state"
created: 2026-08-28
updated: 2026-09-11
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

✅ **`chatbox_credentials` LIVE (1,987 rows)** — public-read/no-write, loaded by `kb/_sync_credential_catalog.py` from the PUBLISHED artifact so suppression is inherited by construction. Routes CRED·STD, CRED·VOLUME, COLLEGE·ADOPT, ALIGN live. ✅ **`chatbox_credential_recs` — 2,205 rows LIVE** (134 statewide/351 lines · 2,071 local/3,357) on the nightly `credential-catalog-sync`. ⭐ **Sam's rule:** statewide exists → quote the **statewide set ONLY**; no statewide → the **most common** local recs with their college counts. Never both. ⭐ **The builder REUSES `fact-sheet/_build_statewide_recs.py`** — Sierra quoting different credit from the Fact Sheet is a credibility failure. ⚠️ **Lead with the LIST, never a count:** POST measures **10 lines · 9 carrying a C-ID · 8 DISTINCT · 1 with none**, and the `AJ 110` repeat is **flagged, never auto-resolved** (Sam: *"AJ 110 may be C-ID and it is Elective"*). **Standing retrieval rules, each earned by a failing probe:** search is **TRIGRAM, never `tsquery`** (`to_tsquery('english','aed:*')` → `'a':*` took the CPR corpus out); score the **best single name**, never the concatenation (length-normalized similarity ranks the BEST-CURATED record WORST); **`statewide` is a FILTER, not a tie-break**; **no pure-fuzzy** (tier-4 floor 0.25 + `matched_via`); **zero rows is a RESULT**, not a license to offer a neighbour. ⚠️ **Every student count is a FLOOR and the denominator ships as a COLUMN** — only 4.2% of student rows are nameable; `students_suppressed=true` must never render like `colleges_with_student_data=0`. ⚠️ **The statewide-rec gate is `ccc_rec` OR a published statewide set** — `ccc_rec` is derived from ADOPTIONS, so gating on it alone hid **38 statewide credentials with zero adopters, 36 of them carrying 75 published rec lines** (Carpenters ladder, NCCER, CSLB, ICC, OSHA 10/30) from *every* credential route. ⚠️ **Rec lines are ENRICHMENT, never a filter** — the map is declared OUTSIDE the try and a credential with no line is **still named**; dropping it re-creates the false zero. Every credential route renders through the **shared** `renderRecLines` off **one** batched `credential_recs_for_titles()` — a second lookup is a second matcher that can drift. ⚠️ **GUIDANCE AUDIT (SkyScope, on Sam's go): 1 of 7 active rules referenced a fact the request does not carry** — `15ec666b` named neither the tab nor the institution, so it was an instruction to GUESS. Budget is **not** binding (4,095/9,000 chars, 7/20 rows, 0 `display`). ⚠️ **All 7 ship to all 6 surfaces**, so that rule's opening condition is UNEVALUABLE everywhere, the public page included. **RECOMMENDED, NOT BUILT: a `surface` field** on the request + a nullable `surface` column on `sierra_guidance` — NOT a forked Sierra and NOT a `mode` enum (the differences are already separate fields: `audience`, `ctx`, `history`, `scope`). ⚠️ It will NOT deliver behavior contradicting a BUILT-IN rule (built-ins win in practice); that needs the rule registry to become surface-aware. **Blocked on Sam's go.** **Open:** corpus covers **59 of 123** colleges; `chatbox_college_profiles` stale since 2026-06-25 **except contacts** (live — see the MAP Users row); ⚠️ its **`credit_distribution` column is no longer read by anyone** — it was Sierra's per-college credit source until 2026-08-24 and had drifted two months (#1325, see the My College row); 12 adoption-file statewide titles absent from `chatbox_credentials`; ✅ **Sierra Training queue CLEARED by Sam 2026-08-26 — 0 still to do, 51 of 51 handled, 7 instructions in use** (screenshot; supersedes the 25-untriaged backlog and unblocks the alignment feedback loop, which `alignment-tested-via-sierra-training` called load-bearing). **NEXT:** Sam reads the actual prose — no session has, the sandbox is egress-blocked from `*.supabase.co`. Story: `docs/sierra_credit_recs_lessons.md` · `docs/sierra_credential_naming_lessons.md` · `docs/cpl_assistant_lessons.md`.


## The endpoint itself — model, cost, reliability (added 2026-09-11)

**MODEL is `claude-sonnet-5`**, committed default since v63 (deployed
`2026-09-10T22:35:17Z`, Sam's dispatch). The `CPL_CHAT_MODEL` Supabase secret
still overrides it with **no deploy** and is the fast revert lever — ⚠️ **do not
delete it**, which reverses the advice given earlier that same day. Reverting to
`claude-haiku-4-5-20251001` is one secret and no code change.

⚠️ **BLANK ANSWERS, 09-10 22:35Z → the #1551 deploy, AND THE CAUSE WAS A MODEL
DEFAULT.** `chat_interactions`: 0 empty responses every day for two weeks, then
5 of 62 on 09-10 (all after the Sonnet 5 deploy) and 39 of 137 on 09-11, three
of them real users. On Sonnet 5 a request that OMITS `thinking` runs adaptive
thinking; on Haiku 4.5 and Sonnet 4.6 the same request runs none. Thinking
tokens count against `max_tokens`, and the loop collects only text — so on a
broad question the model spent the whole 2,048-token budget before the first
word (35 of 35 blanks at `output_tokens=2048`, zero text). Not an upstream error
and not the cap: the same cap produced zero blanks in fourteen days on Haiku.
**FIXED (#1551): the request sends `thinking: { type: "disabled" }`**, the
request Sierra always made spelled out. ⭐ **Sam ruled it STAYS OFF (2026-09-11,
decision sheet *Two Calls on Sierra*, item 1: *"Let's keep it off but test for
better options if they exist. Currently, it's giving fantastic answers!"*)** —
any trial of adaptive thinking runs on the preview slug (`cpl-chat-preview-ab.yml`),
never live. The guard
(`tests/sierra_model_choice.test.js` block 5) keys the thinking default to the
model id — adaptive-by-default / always-on (Fable, Mythos: `disabled` is a 400) /
off — and fails closed on an unknown id. **Deployed as v64** by `cpl-chat deploy` run 41 at 02:03:41Z on 2026-09-11, byte-identical to `main` (sha256 `0624be54…`), `verify_jwt` false; the health probe passed at 02:04:49Z. **Verified on v64 (02:03–02:10Z): 54 turns, 0 blanks, 0 cap hits**; the NCCER question that blanked on v63 answered twice (4,148 and 3,733 chars); output per 4 chars of answer 1.91 → 1.46, the residual being the tokenizer. ⚠️ **The secret can
still point `MODEL` at a model whose default differs; the guard reads only the
committed default.** #1550's instrumentation shipped in the same deploy: a blank
turn now logs `EMPTY ANSWER` with its `stop_reason` (`max_tokens` at exactly the
cap = thinking ran it out; none = upstream error; `end_turn` = the model chose
silence) and sends the client `event: error` before `done`. ⚠️ **The health probe
cannot see this class** — one simple question, and it passed straight through two
hours of blanks on broad questions. ⭐ **`MAX_TOKENS` is 8,192 (Sam's ruling, same
sheet, item 2: *"Let's make it high for now so folks playing around with it always
get a complete answer"*; #1555)** — a ceiling, not a spend: an answer costs what it
uses, and `stop_reason` names any turn that reaches it. It was 2,048 from launch;
the tokenizer counts ~30% more tokens for the same text, so 2,048 had come to hold
about 6,000 characters, and one answer in nine on v64 sat within a fifth of it.
**Deployed as v65** by `cpl-chat deploy` run 42 at 16:41:58Z on 2026-09-11 from `main` 05f2b06d, `verify_jwt` false. **Verified on v65:** smoke run 176 passed 22 of 22 (16:45–16:50Z, the first green smoke since the 15a/15c guards were fixed) and health run 110 passed at 16:45:45Z. **NEXT:** the sixteen-row register sweep once on Sonnet 5 (Sam's standing
rule of 2026-08-30); an A/B of adaptive thinking on the preview slug only if a
measured quality gap appears; and watch for a cap hit over the following week — `response_tokens` at 8,192 in
`chat_interactions` (the table has no `stop_reason` column; the reason is on the
`EMPTY ANSWER` line in `function_logs`). With an 8,192 ceiling and thinking off,
any hit is a real answer that long. First quarter hour on v65 (16:42–16:57Z): 37
turns, 0 blanks, longest answer 4,964 characters.

**Cost, MEASURED from `function_logs` across the deploy boundary** (not modelled):

| | requests | input tokens | cached | blended $/MTok in |
|---|---|---:|---:|---:|
| Haiku 4.5 | 48 | 760,274 | 0.0% | $1.00 |
| Sonnet 5 | 23 | 554,161 | 18.6% | **$1.72** |

Sonnet 5 is **1.72× Haiku per input token** (2.00× with no cache) — the cache
recovers 28% of the step and does not close it. ⚠️ **The cached prefix is 4,476
tokens, 19% of a 24,093-token average request** — NOT most of it, and `chars/4`
estimated it 28% low. The other **81% is RETRIEVAL**, not conversation history
(history is capped at 6 turns × 2,000 chars and the production widget omits it
entirely). Whether any of that 81% repeats enough to cache is **unmeasured** —
settle it by breaking the input down in the log line, not by guessing again.
Absolute spend is trivial either way (23 requests = $1.21), so **choose on answer
quality and treat price as a tiebreak.**

⭐ **The cache line now names the model that answered** (Sam's ruling, decision
sheet item 3) — from `event.message.model`, what the API says it SERVED, never the
`MODEL` constant we asked for. ⚠️ **Nothing on our side can see which Anthropic
ACCOUNT pays**: the code reads a Supabase secret *named* `ANTHROPIC_API_KEY` and a
Console key *displayed as* `ANTHROPIC_API_KEY` is a different namespace — matching
the strings is not evidence. To check where spend lands, filter the Console by key
and group by key.

## The standalone page on a phone — the About Sierra control (2026-09-11)

Sam: *"the current mobile view is mostly consumed by the header text… consolidate
all this text to hover overs in the header… and fix the ghosted mountain logo so
the peak fits."* The intro and beta paragraphs left the flow for an **About
Sierra** control in the header — a real `<button aria-expanded>` opening a panel:
hover opens it where a pointer can hover, tap or Enter opens it everywhere, Escape
and a click outside close it. Nothing hover-only, nothing deleted; the footer
carries the beta and privacy lines. The ridgeline mark's peak had been clipped by
`overflow:hidden` on a box it overshoots — now `overflow: clip visible`. On a phone
the header is one row: the map.rccd.edu pill hides ≤560px and the tagline ≤400px,
declared as `mayHideBelow` in `a11y.config.js` and nothing else. **Measured at
390×844: the conversation starts 163px down (19% of the viewport) against 540px
(64%) before; at 320px, 161px against 689px.** `npm run a11y -- sierra` is clean
at all nine widths and `kb/_glyph_sweep.py` finds nothing in `sierra/`. Guard:
`tests/sierra_header_about.test.js` (23 checks; 3 of 14 on the pre-change files).
⚠️ The sweep was clean BEFORE the change too — a header that pushes the
conversation below the fold breaks no rule the engine measures; the number that
mattered was the y-offset of the first message at a phone width. **Open (Sam's
ask, advice given, not built):** a floating Sierra bubble on every COBI tab —
`kb/cpl_todos.json` `s255-sam-sierra-bubble-on-every-tab`.
