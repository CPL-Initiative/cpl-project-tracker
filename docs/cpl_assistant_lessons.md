---
title: CPL Assistant (in-dashboard RAG chatbot) — lessons
date: 2026-06-01
tags: [lessons, cpl-assistant, chatbox, rag, supabase-edge-function, sse, session-26]
artifacts:
  - cpl_chat.js (front-end chat panel — static asset)
  - chatbox/supabase/functions/cpl-chat/index.ts (captured live Edge Function source)
  - chatbox/README.md (deploy mechanics + request/response contract)
  - "Supabase Edge Function cpl-chat (project hvuwhnbuahrtptokpqfh) — v15 ACTIVE, verify_jwt:false (model claude-sonnet-4-6)"
  - docs/kb-notes/cpl-chatbox-integration-scope.md (the Phase-0 scope/plan)
  - docs/kb-notes/playbook-deploy-shared-supabase-edge-function.md (the durable redeploy procedure)
related:
  - CLAUDE.md §7c (CPL Assistant tab) + §8 (Supabase) + §3 (Cloudflare proxy precedent)
  - docs/quickstart_chat_lessons.md (the OTHER chat feature — the 1-of-N tab router; distinct workstream)
---

# CPL Assistant — lessons

Workstream scratchpad for the **CPL Assistant** dashboard tab — the in-dashboard
RAG chatbot that brings the live map.rccd.edu CPL chatbox into the project
tracker. Distinct from `quickstart_chat_lessons.md` (that's the lightweight
1-of-N **tab router**; this is a full streaming RAG chatbot). Append a dated
section every checkpoint.

---

> **History before 2026-08-09 moved to
> [`docs/cpl_assistant_lessons_archive.md`](cpl_assistant_lessons_archive.md)**
> (2026-09-11, `oversized_doc` at 1.02×). Fourteen sections, verbatim, nothing
> summarized. This doc keeps the recent ones and is still the one to append to.

---

## 2026-08-09 — SkyMind: Sierra reaches the disposition data, and two guards that fired on truth

### What shipped

**cpl-chat v36 (#1064–#1066), live and smoke-verified.** Sierra can now answer what a college has *acted on* —
statewide and per named college — off the published aggregates (`map_college_credit_summary`,
`map_college_goal2`). 68 committed checks; live smoke run 55 `ALL MODES OK`; deploy byte-verified from the
runner with `verify_jwt:false` intact.

### The finding that reframed the task

The session-129 handoff scoped Priority 1 as carrying **"no new disclosure decision"** because the COBI Sierra
was internal. It also, to its credit, said *"confirm the deployment topology before touching anything."* Two
greps:

| Caller | Endpoint |
|---|---|
| `cpl_chat.js` (COBI tab) | `/functions/v1/cpl-chat` |
| `sierra/sierra.js` (PUBLIC map.rccd.edu widget) | **the same** |
| `fact-sheet/factsheet_sierra.js` | **the same** |

One function, reading with the **service-role key** (RLS constrains nothing on that path) and deployed
`--no-verify-jwt` (anyone can curl it). There was no internal Sierra to start with — so what the handoff recorded
as "no decision" **was** the decision. Sam made it explicitly: per-college open to all callers.

⭐ **Blast radius was narrower than either of us assumed.** Every non-college entity carrying data is *already*
`suppressed=true` under k=10 — North Orange (1 student), San Diego CCE (4), Launch (2); Futuro Health has no row.
Partner figures cannot be stated at all, and the write-time suppression already covered the case we were worried
about. Durable: `methodology-rls-is-not-a-gate-in-front-of-a-service-role-function`.

### Sam's framing, which was a substance decision not a tone one

*Transparency and truth, framed as opportunity rather than deficiency — colleges want to do this work and have
not had the tools or the data visibility until now.* That last clause is a claim about **cause**, and it is
credible precisely because these figures sat in an Access database until 2026-08-08. A backlog is evidence of a
visibility gap closing, not indifference. `CREDIT_STATUS_RULE` encodes it: lead with the already-articulated
block, state real numbers plainly, never a report card, and answer comparative questions as opportunities rather
than a best-to-worst ranking.

Live proof, from smoke 55 on San Diego Mesa:

> **🟡 The Biggest Opportunity: Credit Ready to Act On** — 83,656 units recommended but not yet acted on… Of
> that, **4,593 units are already articulated** — the agreement is already built, and all that's needed is a
> decision to award it… **Note:** roughly 30% of recommendations reviewed system-wide are correctly ruled "Not
> Applicable"… **🔑 Next Step:** Mesa's CPL contact is **Monica Romero**…

### The mistake, twice, hours apart

**Both guards I wrote fired on CORRECT behavior**, and the second was written *after* diagnosing the first.

1. The anon-key boundary check asserted `response == "[]"` and printed **`STUDENT GRAIN LEAKED to anon`** for a
   PostgREST statement timeout (`57014`). Nothing leaked — it conflated "not the empty array" with "rows were
   served."
2. Then "tightening" the absent-college regex. One query before shipping: of the **17** institutions absent from
   the disposition aggregate, exactly **one** has any exhibits at all. So for an absent college "zero" is
   approximately **true**, and the wider pattern would have failed Sierra for being right. Reverted the same day.

Durable: `methodology-a-guard-that-fails-on-truth-gets-muted`. The rule that would have caught both: *enumerate
the response space and name what failure looks like positively; before widening a pattern, query which real cases
it would newly catch.* Positive controls added — an expired anon key would otherwise make every gate assertion
pass vacuously.

### Numbers must be computed, and now carry their provenance

Rolling totals up from the same four objects `college_goal2.js` reads (rather than pasting a headline into prompt
text) immediately surfaced that the docs' figure was unsourceable: **docs said 1,052,531 / 64,074; the published
table sums to 1,051,870 / 63,991**, because 13 of 111 cells carry NULL measures. The 🎓 tab had the same property
all along.

Sam's first ruling was published-everywhere; **on reflection he revised it to show BOTH with a suppression chip**
— *13 of 111 colleges withheld, each under 10 students*. That is the better answer and the same pattern as the
ceiling caveat. ⚠️ With one safety condition: showing both implicitly publishes their difference (661 units).
Across 13 cells that identifies nobody; at **one** suppressed cell the difference *is* that college's figure.
**Show both only while ≥3 cells are suppressed**, and re-check after every refresh.

### Confirmed, not assumed: the CPL contacts

Sam recalled assigning contacts to all remaining nulls. Measured: `map_users.js` → `FALLBACK_CONTACTS` holds all
**71** looked-up colleges — **56 with a contact, 15 blank-with-a-finding**, 3 curator-supplied. But it is a
**display-layer fallback, not a write to MAP** (read-only system of record), so `map_college_contacts` still shows
Gavilan's `primary_contact` empty and 27 of 130 profiles have no `primary_contact_email`. Gavilan is the
documented case: Jessica supplied it because gavilan.edu 403s programmatic fetches.

Of the 15: 5 list individual counselors only, 6 are phone/form-only, **2 publish only a mental-health inbox**
(Contra Costa `wellness@`, LA Harbor Life Skills Center) — **found early, then deliberately DECLINED for CPL
routing; declining them is precisely why those two are blank, and nothing routes there via us** — and 2 are
specialized-only. Sam's call: use the settled counseling contacts as **temporary fills on the COBI side** so the
MAP team can adopt them. Design: a dedicated **"Proposed for MAP"** column populating only where MAP is blank —
never inside "Primary contact email", which means *what MAP holds*.

### Next

1. The proposed-fills build (above), with the **MAP-team queue designed in from the start**, not bolted on.
2. The college action page — one page, pick college + role, briefing-first (never a blank chat box). ⭐ **Inbound
   CPL requests outrank every stat**: colleges will start receiving them daily for the first time, and the 15
   unroutable colleges become urgent. This also makes the nightly feed a **prerequisite**.
3. `docs/map_custom_report_request_for_malone.md` is forwardable; blocked only on the view name.

---

## 2026-08-23 — nobody was watching, and she was paying full price for the same 3,200 tokens (Session 185, SkyScope)

### The outage nobody was told about — twice

Picking up the queue, the first thing worth doing was checking `cpl_memory`, and
it held a `verified` row from that evening: **Sierra was down.** A fresh smoke
dispatch confirmed it — every model-backed mode returning HTTP 400, *"Your credit
balance is too low to access the Anthropic API."* Last healthy run **19:48 UTC**,
first failure **21:30**, still failing at **00:01**.

**Second outage in two days, same cause, and both were found by accident.**
`cpl-chat-smoke.yml` and `sierra-preflight.yml` fire only on dispatch or push;
no other workflow probes the function. So the outage duration was set by when a
session happened to look.

⚠️ **This class of outage cannot report itself.** It takes down every Sierra
surface at once — the public page, the COBI tab, the Fact Sheet drawer,
map.rccd.edu, the college landing pages, the vendor iframe. A student who arrives
in that window reaches nobody and files nothing, so the feedback table stays
empty *because* the thing is broken.

**Built: `chatbox/health_check.sh` + `.github/workflows/cpl-chat-health.yml`.**
One question every three hours; raises a GitHub issue on failure, reuses the open
one rather than filing 8 a day, closes it on recovery.

⭐ **A liveness check is only worth having if it can say no**, so the test does
not read the script — it **runs** it against a mock `cpl-chat` in five shapes
(billing error, generic error, healthy SSE, SSE with no text frame, nothing
listening) and asserts exactly one reports up. Everything not positively
recognized as an answer is DOWN, transport failure included: from a browser, an
unreachable function and a broken one are the same event.

⚠️ **The cadence carries its price in the file.** Sam is funding the Anthropic
account personally until the corporate one exists. A probe is ~6–10K input tokens
(general mode — the cheapest, fewest context builders fire) plus a short answer:
**hourly ≈ $22/month, 3-hourly ≈ $7**. Shipped at 3-hourly with the arithmetic in
the header, so raising it is a decision rather than a shrug.

### The real cost lever was not the model

Sam then asked whether Haiku would be cheaper "with comparable results". Two
things the measurement changed:

1. **There is no Haiku 4.6.** The current one is **Haiku 4.5** (`claude-haiku-4-5`),
   $1/$5 per MTok against Sonnet 4.6's $3/$15 — a real 3× cut, and a context
   window drop from 1M to **200K** that has to be measured, not assumed.
2. **`cache_control` appeared ZERO times in a 200 KB Edge Function.** The ten
   always-assembled rule bodies are **23,433 characters ≈ 5,860 tokens** of
   byte-identical text, and with the preamble and audience rules roughly **7,000
   stable tokens were billed at full price on every turn**. `MAX_TOKENS` is 2048,
   so the bill is input-dominated — exactly what caching attacks.

⚠️ **I told Sam caching carried "no quality risk" and that was wrong.** Caching
is a *prefix* match: the stable material must come FIRST. Sierra's prompt opened
with a 968-char preamble (**242 tokens — below the ~1024-token minimum, so a
breakpoint there caches nothing and says nothing**) and closed with the rule
block, after every volatile context. There was **no zero-reorder option**.

⚠️ **And "mostly stable" is worse than not caching.** A write costs ~1.25×, a
read ~0.1×, so a breakpoint on material that changes per request is a surcharge
— invisibly, since the answers still look right. Caching the whole rule block was
the one-line version and would have done exactly that: `appliesWhen` gates it, so
it differs by question mode. The shipped split caches only the rules whose
predicate is literally `always` — **2,992 tokens that are byte-identical on every
request** (they interpolate nothing but a module constant).

`tests/sierra_prompt_cache.test.js` **runs the assembler over all 16 context
combinations** and asserts the stable half has exactly one distinct value, that
the conditional half genuinely varies, and that the two halves recombine to the
original length so no rule lands in neither. Cache hits and writes are logged
with an explicit *"⚠ NEITHER — the breakpoint is not taking effect"*, because the
counters arrive on **`message_start`, not `message_delta`** — reading usage from
the delta reports zero cache activity for ever and looks exactly like a broken
cache. Durable note:
[`methodology-a-cache-breakpoint-must-lead-and-must-not-move`](kb-notes/methodology-a-cache-breakpoint-must-lead-and-must-not-move.md).

### Smoke mode 7 — red since Session 125 on correct answers

The queue asked for this and named the fix precisely: *don't delete the check;
check instead that a nearby college reached her at all.*

Mode 7 asserts Sam's three-part answer (2026-08-07). Part 3 — name LA-basin
colleges that **teach** construction — was a prose grep for six college names,
and four handoffs record it failing while Sierra answered well: she leads with
the colleges that have **articulated** NCCER (Norco, Barstow), which is the other
true thing. **A CI job that goes red on emphasis gets muted.**

⭐ **Measured at the retrieval layer instead.** Lifting `extractTopicKeywords` +
`expandWithSynonyms` out of `index.ts` gives the exact tsquery the function
builds for that question; run against `search_college_offerings` at its own
`result_limit: 150` it returns **150 rows / 78 colleges, five of the six LA-basin
colleges present**. So the data reaches her and the assertion was testing
wording. New mode **7r** calls that RPC with a **negative control first** (a
nonsense term must return nothing, or "did these names come back?" is answered by
a broken call as convincingly as by a real miss), a positive control, and a
**threshold of 3 of 6 rather than a named college** — mode 14's lesson, that an
assertion pinned to a value which can leave the data stops being a guard the
moment it does.

⚠️ **The pinned tsquery is a transcription, and transcriptions drift.**
`tests/sierra_offerings_retrieval.test.js` re-derives the term set from
`index.ts` on every run and fails if `TOPIC_SYNONYMS` moves — verified by adding
a synonym and watching it go red.

⚠️ **The query fills its 150-row limit exactly**, so truncation is live for this
discipline. Ordering underneath stays `sierra_geo_ranking`'s job, and 7r says so.

⚠️ **My own check tripped on my own comment.** 7r's preamble quotes the retired
assertion so the next reader knows what was removed; the "is it gone?" grep read
the quote as live code. Comments are not code — strip them before judging what a
script *does*. The repo warned about this one handoff ago ("a marker is
load-bearing text").


---

## 2026-09-11 — Three wrong claims about cost, and a blank answer nobody could see (S255, SkyLedger→)

**What moved.** Sam's corporate API account landed, he dispatched the Sonnet 5
deploy (v63, `22:35:17Z`), and asked whether to stay there. Answering that
properly turned into four corrections and one production defect.

**The defect, first, because it matters most.** Sierra returned **blank answers to
27% of requests** for two hours and every instrument said she was fine — 200 on
every call, a cache telemetry line on every call, no exception, no error log.
`chat_interactions` is unambiguous: **0 empty responses every day for two weeks**,
then 5 of 62 on 09-10 (all post-deploy) and 20 of 76 on 09-11. Only **one**
non-smoke turn has run since the deploy, so nobody real has been failed yet.

The cause is worth internalizing: **an upstream failure in a stream is delivered
as data, not as a status.** By the time it lands the response is already 200 and
`message_start` has already fired the cache log. The loop handled exactly three
event types, so `{"type":"error",…}` matched none, fell through into nothing, and
the stream closed through its normal `event: done` path. A well-formed, empty,
successful answer. Distilled to
`[[docs/kb-notes/methodology-an-error-inside-a-success-is-invisible-to-every-status-check]]`.

⚠️ **The smoke check was the only thing that noticed, and its report was
unreadable** — "empty answer", then five content assertions each reporting a regex
that never had any text to match. It now prints the `event: error` frame, so the
next failure says what it was.

**The three wrong claims**, all one shape — reasoning about a *share* of an input
whose total I had never measured:

1. the cached prefix is ~3,234 tokens → **4,476** (`chars/4` ran 28% low)
2. Sonnet 5 "comes back cheaper" → **1.72× dearer** per input token; the prefix is
   **19%** of a request, so a lever on it cannot offset a doubling of all of it
3. the uncached 81% is conversation history → history is **~0** in production
   (capped at 6 turns × 2,000 chars; the widget omits it), so the 81% is retrieval

Each was checkable in the file or the log, and I checked none of them first. The
second was pure arithmetic and needed no measurement at all. Distilled to
`[[docs/kb-notes/methodology-a-share-is-not-a-fact-until-you-have-measured-the-whole]]`.

**Plus a withdrawal.** I "reconciled" the Supabase logs against an Anthropic
Console figure and reported 4.2% agreement. Sam caught it: the Console key was not
the one Sierra bills to. The Supabase *secret* named `ANTHROPIC_API_KEY` and a
Console *key* displayed as `ANTHROPIC_API_KEY` are different namespaces, and I
matched the strings. The cost table never depended on it — `function_logs` are
Sierra's own requests whatever key authenticates them — but the agreement was luck
and reporting it as corroboration was wrong.

**What actually held.** Every load-bearing number came from Sierra's own logs, and
the before/after across the deploy boundary is clean: 48 Haiku requests, not one
cached; 23 Sonnet requests, all 23 cached, first write 6 seconds after the deploy
finished and the last `⚠ NEITHER` 13 seconds before it. That is the one inference
this run made that survived scrutiny.

**Patterns worth keeping.**
- **Falsify a new guard against the pre-change file before trusting it.** The
  stream-error test passes 13/13 on the fix and **1/13** on the pre-fix file, and
  the single pass is a precondition asserted on purpose. Two guards earlier this
  session read green on nothing.
- **`tsc --noEmit` on a Deno file still catches syntax.** Compare the *error
  profile* against the committed version rather than reading the errors — identical
  counts mean the edit introduced nothing. Cheap, and it does not need Deno.
- **A caveat beside a number does not stop the number being used as a fact.** The
  header said "3,234 IS AN ESTIMATE … measure it." It was read and reasoned past.
  Replace the number; do not annotate it.

## 2026-09-11 — The blank answers were a default, not an error and not the cap (S255, SkySignal)

**What moved.** Sam: *"see if you can get Sierra ai back up? Last session quit
responding."* The previous session had measured the blank answers exactly (35 of
35 at `output_tokens=2048` with no text, zero blanks in fourteen days on Haiku)
and named two causes in turn — an unhandled upstream `error` event, then
"`MAX_TOKENS = 2048` is the bug" — shipping only the logging (#1550). Its
mention of a Haiku revert via the secret never happened: the one request after
it wrote a 4,476-token cache prefix, which Haiku never did.

**The cause is a model default.** On Sonnet 5 a request that omits `thinking`
runs adaptive thinking; on Haiku 4.5 and Sonnet 4.6 the same request runs none.
Thinking tokens are output tokens under the same `max_tokens` cap, and the loop
collects only text deltas, so on a question the model chose to reason about it
spent the whole budget before the first word. Anthropic's Sonnet 5 migration
guide says it in one sentence: *"a workload that ran thinking-off on Sonnet 4.6
by omission may now truncate."* The four numbers the file already held — every
blank at exactly the cap, a fifth of the real answers capped too, none of it
on Haiku, HTTP 200 throughout — are all explained by that sentence and by
neither earlier diagnosis. The fix is one field, `thinking: { type: "disabled" }`,
the request Sierra always made spelled out (#1551). `MAX_TOKENS` stays 2048;
raising it would have paid for the thinking rather than stopped it.

**Why two sessions missed it.** Every guard on a model switch pinned a property
that was written down — price, context window, cache floor — and each held. A
default is an absence, and nothing checks an absence. The guard now asks, per
model id, what the configured model does when the field is missing, and fails
closed on an id it does not know; falsified against the pre-change file (20/20
after, 18/20 before, both reds naming the defect). Distilled to
`[[docs/kb-notes/methodology-a-model-switch-carries-its-defaults-not-just-its-price]]`;
the previous note carries a correction section.

**Two more things the guide settles.** The tokenizer changed with the model
(~30% more tokens for the same text), which is most of why the prefix measured
4,476 against the 3,234 that chars/4 predicted, and why 2,048 output tokens now
hold roughly 6,000 characters rather than 8,000 — whether that truncates real
answers with thinking off is unmeasured until the cap-hit count is read after
the deploy. And Fable/Mythos reject `disabled` with a 400, so the field is
model-dependent like the cache floor; the secret can still point `MODEL` at a
model whose default differs, and the guard reads only the committed default.

**Left with Sam.** Whether Sierra should think at all — adaptive at low effort
with a larger output budget — is a product call (latency before the first
word, output spend, answer style), not a default to inherit.


### 2026-09-11, later the same night — the root cause, and two wrong diagnoses before it

**It was adaptive thinking.** On **Sonnet 5 and Opus 5** a request with no
`thinking` field runs *adaptive* thinking; on **Haiku 4.5 and Sonnet 4.6** the
identical request runs none. So code that had been correct for 2,200 turns began
spending its entire answer budget on reasoning the stream loop does not collect as
text. Fixed in **#1551** by sending `thinking: { type: "disabled" }` explicitly;
`MAX_TOKENS` stayed at 2,048. Verified live: **53 consecutive turns, zero blanks**,
overhead falling from **6.5 to 1.45** output tokens per 4 characters of answer.

⚠️ **I got it wrong twice first, and both times by inferring from log SHAPE rather
than measuring.** First as an unhandled upstream `error` event — there was no
error, and the branch I shipped for it can never fire on this. Then as `MAX_TOKENS`
being too small — it had been fine for 2,200 turns, so the cap was the constraint
the new behavior ran into, not the fault. I prepared a cap raise; it was superseded
before merge and correctly so.

⭐ **Sam's recollection was the decisive evidence, and it was available from the
start.** *"This didn't happen when I was originally running sonnet."* Same 2,048
cap in every era: Sonnet 4.6 **2,200 turns / 0 blank / 0.9% at the cap**; Haiku 4.5
**300 / 0 / 0.3%**; Sonnet 5 **202 / 61 / 47%**. A model-specific behavior change
is the only hypothesis that fits all three rows, and I had the rows before I had
either wrong answer. **The repo's own rule — their domain knowledge outranks your
inference — is not only about facts they supply; it is about which hypothesis to
test first.**

⭐ **And a separate trap cost half an hour on its own: a workflow RE-RUN deploys
nothing.** Re-running on the same `head_sha` uploads byte-identical source,
Supabase deduplicates it, no new version is created, the workers never restart, and
the secret changed minutes earlier is never read — with success reported at every
step. Confirmed by `list_edge_functions` still reading **version 63,
`updated_at 2026-09-10T22:35:10Z`**. Distilled to
`[[docs/kb-notes/methodology-a-deploy-that-deploys-nothing-leaves-the-old-environment-running]]`.

**Still open:** 28 of 98 successful answers were hitting the 2,048 cap *before* the
incident, truncated mid-sentence with nothing logged — unrelated to thinking and
unfixed. And `smoke` fires on every push touching `index.ts`, comment-only ones
included; ~11 runs today at ~22 live questions each is where the day's API spend
went.

### 2026-09-11, the morning after — two rulings, and a header that ate the phone (SkySignal)

**Both calls went to Sam as one sheet and came back inside the hour.** Reasoning
stays off — *"Let's keep it off but test for better options if they exist.
Currently, it's giving fantastic answers!"* — and the answer stop is **8,192**,
over the 3,072 the sheet proposed: *"Let's make it high for now so folks playing
around with it always get a complete answer."* The proposal was sized from the
measurement (one answer in nine on v64 sat within a fifth of 2,048); the verdict
was sized from the reader — someone *playing around with it* should never meet a
cut-off. A ceiling costs nothing until an answer uses it, and the only argument
for a low one was the thinking that is now off. **Write the proposal from the
numbers and let the verdict come from the audience; do not defend the number.**
The rulings are in the code beside the constant, on the sheet itself (a visual
that asked a question keeps its answer), and in `cpl_memory` as two
human-sourced decision rows.

**The page's phone view was 64% header.** Sam's ask named the fix — *consolidate
all this text to hover overs* — and the trap inside it: a hover-only control is
unreachable from the device the complaint came from. The intro and beta text moved
into an About Sierra button that opens on hover where a pointer can hover and on
tap or Enter everywhere, closes on Escape and click-outside, and is a real
`aria-expanded` control. Nothing was deleted. The ridgeline peak that had been
clipped for weeks (`overflow:hidden` on a box the peak overshoots) is whole.
Measured at 390×844 the conversation now begins 163px down (19%) against 540px
(64%). ⚠️ **Measure the thing the person saw, not the sweep.** `npm run a11y --
sierra` was clean *before* the change — no contrast, target or overflow fault —
because a header that pushes the content below the fold breaks no rule the
engine checks. The number that mattered was the y-offset of the first message,
and only a screenshot at a phone width surfaces it.

**Smoke modes 15a and 15c were assertion faults, not Sierra faults.** Both
regexes matched a correct negation — *not a failure to act*, *I can't say they've
awarded zero* — so a right answer read as a regression. Fixed in #1555: the two
framing guards strip the negated clause before matching
(`answer_must_not_match_unnegated`); a bare *awarded zero* still fails, and the
privacy guard stays strict. Verified against the recorded answers and seven
controls before the push.

**The checkpoint did not fire before the compaction, and the reason was an
install step.** The meter was right to within 122 tokens of the ceiling and never
ran: its only install was per machine, and a remote session is a fresh container
every time. Rule 9's commit proxy read zero because the handoff had just been
touched inside a PR, and the context had gone to reading and polling — 58 reads
of PR check runs alone cost 136,000 tokens, and produce no commits. The hook is
in the repo's own settings now, with a test that fails if it leaves. Sam, on the
same polling loop: *"I really don't like how you can get locked in a long process
(30-60 mins or more) without a way to interrupt and get you a note."* So a turn
that waits on CI now ends, and a scheduled wake brings the session back; both are
`CLAUDE.md` bullets.

---

## 2026-09-11 — SkyBeat (S257): the cap-hit read, and a deploy boundary that is not a boundary

**The queue item.** SkySignal left "read the cap-hit count in `chat_interactions`
a day after the deploy with thinking off." v64 (thinking disabled, `MAX_TOKENS`
2,048) deployed 02:03:41Z; v65 (8,192) at 16:41:58Z. Read at ~19:00Z.

**The naive answer was wrong.** Splitting `chat_interactions` at the deploy
timestamps shows **2 rows at the 2,048 cap on v64** — which reads as real answers
cut short, exactly the thing the ceiling was raised to prevent. Both are
**zero-character blanks** from `smoke-ci`, at 02:04:04 and 02:04:22, on the same
Boys & Girls Club / NCCER question.

⭐ **A DEPLOY TIMESTAMP IS NOT AN ERA BOUNDARY — WARM ISOLATES KEEP SERVING THE
OLD CODE.** Two independent instruments say those rows are v63's:

1. **The instrumentation's own silence.** #1550 made v64 log `EMPTY ANSWER` on
   *any* zero-text answer, guarded by `tests/sierra_stream_error.test.js`. There
   are **0 such lines in 17 hours** of `function_logs`. If v64 had served either
   blank, it would have logged one.
2. **The log line's FORMAT dates the code.** Ruling 3 added `model=` to the cache
   line in that same deploy. Last line without it: **02:04:02.384Z**. First with
   it: **02:04:06.434Z**. So the crossover is ~25 seconds after the deploy
   completed, and only **5 of 200** cache lines in the window are pre-cutover.

So: **0 real cap hits and 0 blanks on the fixed code.** v65's first window: 37
turns, 0 cap hits, max 1,930 tokens against an 8,192 ceiling.

⚠️ **THE BIGGER FINDING IS THAT THERE IS ALMOST NOTHING TO MEASURE.** Over 30
hours `chat_interactions` holds **`smoke-ci` 432 turns, `health-probe` 9, and 6
human turns across 4 UUID sessions.** The queue's "watch for a cap hit over the
following week" will therefore observe **the smoke suite**, not people. An 8,192
ceiling exercised only by our own synthetic questions is not evidence about real
answers. The instrument that would actually test it is the **sixteen-row register
sweep** already sitting in NEEDS SAM — which is the hardest thing the assistant
does, and is the thing Sam's 2026-08-30 rule asks for before relying on a model.

**Method worth keeping.** When a measurement straddles a deploy, find something in
the record whose *shape* changed at the deploy and date the rows by that, rather
than by the wall clock. Here it was a log line gaining a field. The wall clock
said 2 cap hits; the format said 0.

**Smoke 16a rewritten** (#1559). It required the LACCD answer to name `pierce`
AND `valley` AND one of harbor/southwest/trade, and went red twice on 2026-09-09
on two *different* correct subsets. Which members Sierra names when asked what a
district should DO is emphasis, not capability — the same failure mode 7 paid for
over four handoffs before 7r. Split the way 7 was: **16r** asserts the roster at
retrieval (`map_colleges` on `district`, sandbox rows dropped by `entity_kind`,
negative + positive controls, a floor of 7 of 9); **16a** keeps both bans and
asks the prose for a floor of 2 via a new `answer_must_name_at_least`. Naming
NONE is the regression that keeps. Live run: 16r 9 of 9, 16a named 9 of 9.

⚠️ **15a/15c are still red and are NOT fixed by #1555.** Two correct answers trip
the negation stripper's two narrow shapes: *"not a backlog it's **failing to**
work through"* (the negation is four words upstream of the stem, and shape 1
allows only an article) and *"…awarded, applied, or **transcribed** — it's not
that the number is **zero**"* (the guarded regex matches straight across the
em-dash into the next clause). Proposed patch in the #1559 comment; not pushed,
because it is a different mode from what that PR changes and `smoke` is
non-required.

## 2026-09-12 — SkyGuard (S259): the field that was already built, and the flag that was not

**The queue item.** SkyList's handoff led with *"BUILD THE SIERRA `surface`
FIELD — Sam ruled 'Yes'."* The session's first grep found `KNOWN_SURFACES`,
`normalizeSurface`, the `sierra_guidance.surface` column with its CHECK, the
Training-tab picker and two guard suites — all shipped 2026-08-22 as v56 — and
two live rows (`15ec666b`, `7d8641be`) already scoped to `my-college`. The lane
had read *"RECOMMENDED, NOT BUILT … blocked on Sam's go"* since it was relocated
out of `CLAUDE.md` on 2026-08-28, three weeks after the thing it described went
live, and S258 lifted that line into open question 3 without a grep.

**What Sam actually answered.** The To-Do he read (`s258-sam-sierra-bubble-scope`)
asked whether to build the *scope flag*, with the caution that the access bit
must be decided by the server from the sign-in and never claimed by the page.
His *"3. Yes"* is a ruling on that. The checkpoint relabeled it "the surface
field" in the handoff, the lane, the To-Do and the memory row in one commit.
Recovering the real question took the pre-ruling handoff, the pre-ruling To-Do,
the lane's history and a read of the live table. Durable form:
[`methodology-verify-a-queue-item-against-the-code-before-it-reaches-the-decider`](kb-notes/methodology-verify-a-queue-item-against-the-code-before-it-reaches-the-decider.md).

**What was built (cpl-chat v66, not yet deployed).** `deriveViewer()` reads the
`Authorization` bearer and `x-team-pass` and asks the database's own predicates
— `is_allowed_reviewer()` and `team_pass_ok()` by RPC, from a client signed with
the ANON key and carrying only the caller's credential. `reviewer` · `team` ·
`public`; every error path is `public`; the anon bearer alone costs zero round
trips. It runs inside the parallel retrieval batch, so a reviewer costs the
public no latency. The turn's log row gains `viewer` and `surface` (migration
`chat_interactions_viewer_surface`, applied live; schema of record in
`chatbox/supabase_sierra_feedback.sql`), and the stream gains `event: meta`
`{surface, viewer}` after `sources`. The COBI widget sends what it holds through
`credentialHeaders()` — the magic-link JWT as bearer, the team phrase via the
shared `decorateHeaders()` — and renders the frame as one line of words,
*Recognized by the assistant as a signed-in reviewer*, nothing for the public.
The public page and the Fact Sheet drawer are untouched. Guard:
`tests/sierra_viewer.test.js` (63 checks, the derivation exercised under a fake
client factory). ⚠️ **It widens nothing.** No prompt line, no retrieval change.
Letting a verified reviewer see COBI data is the second build; the boundary
inside COBI is aggregate vs student-detail and that one routes through
Governance and the student-detail disclosure ADR first.

⭐ **Why the check is a browser request and not a decode.** `is_allowed_reviewer()`
reads `auth.jwt()`. Through PostgREST with the user's own bearer, PostgREST
validates signature and expiry before the function body runs, so an expired or
forged token is a 401 and never a judgment made in Deno — and "reviewer" means
exactly what it means on every RLS-gated table, because it is the same
predicate. Under the service key `auth.jwt()` names nobody, so a check signed
that way says "no" to everyone; a hand-rolled read of `allowed_reviewers` with
an email pulled out of an undecoded token says "yes" to anyone who can type
one. The anon key plus the caller's header is the only shape that verifies.

**Two observations filed, not acted on.** `chat_interactions` still carries an
`anon_insert_only` policy (`with_check true`) from before the function logged
under the service key; any holder of the public key can insert a log row, the
new columns included. Not widened by this change and not this session's to
remove. And `cpl-chat-health.yml`'s own header says to raise the cadence to
hourly *once billing moves to the corporate account*. It has: the 2026-09-11
section above records the account landing on 2026-09-10, and three consecutive
handoffs carry it — a fact this session first missed because it asked
`cpl_memory` and the table never got that row. One store's silence is not the
corpus's. The one-line change (`'7 */3 * * *'` → `'7 * * * *'` plus the header)
was then stopped by the remote environment's permission rules, which treat a
scheduled workflow as a shared resource that spends funding; it is a NEEDS SAM
item with the diff written out, not a dropped one.

**15a/15c closed (PR #1566).** The #1559 patch as its own PR: shape 1 spans a
bounded 40-character gap that cannot cross `, ; : — –` or a period; 15c's class
excludes the dashes. `tests/smoke_negation_stripper.test.js` reads both sed
expressions and both mode regexes out of the script and runs real `sed` and
`grep`: the two recorded answers pass, the failure shapes still fail, and the
suite fails 6 of 24 against the previous script.
