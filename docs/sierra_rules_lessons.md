---
title: Sierra rules as data — lessons
date: 2026-08-14
tags: [sierra, governance, architecture, curation, testing, lessons]
artifacts:
  - chatbox/supabase_sierra_rules.sql
  - chatbox/supabase/functions/cpl-chat/index.ts (RULE_DEFAULTS, assembleRules, PROTECTED_RULE_KEYS)
  - tests/sierra_rules_overlay.test.js
related:
  - "[[docs/kb-notes/adr-judgment-in-tables-mechanism-in-code]]"
  - "[[docs/kb-notes/reference-ui-design-system]]"
---

# Sierra rules as data — lessons

## 2026-08-14 · Sky155 (Session 155)

Five PRs: **#1184** adopter landing pages · **#1185** Send note · **#1186**
`sierra_rules` · **#1187** hand-off resilience · **#1188** side-menu glyphs.
`cpl-chat` v49 → **v51**.

### What was learned

**1. A rule that "isn't followed" may be unfollowable — and this is now the
second consecutive session where that was the whole diagnosis.**

`STATEWIDE_RULE` (Sam's own wording, #1183) asks for a
`college | credit | CPL landing page` table. `renderAdopters()` emitted a
comma-joined list of names and no URLs. The same rule closes with *"use ONLY
landing-page URLs present in the context above — if a college's URL is not
there, name the college without a link rather than guessing one."*

So Sierra was obeying **exactly**. Her own fail-safe produced the empty column.
`chatbox_college_profiles.landing_page_url` had been populated for 123 of 130
colleges the entire time — the **fourth** documented instance of curated,
present, nightly-synced data that no consumer ever read, after the statewide
flag, the `ccc_rec` gate, and the adopter names themselves.

The generalization is not "check the data exists." It is: **when a rule and an
output disagree, ask whether the rule was even satisfiable with what reached the
prompt, before treating it as a compliance problem.**

**2. Measure a join's match rate before building on it — it tells you WHICH
join, not just whether one is broken.**

The repo's join scar (`normalise-both-sides-of-a-join`, PR #1128, five colleges
silently unfunded) creates a reflex to always fold both sides. But over-folding
is the mirror error: a fold can merge two genuinely distinct colleges, and it
hides drift, because a name that changes upstream keeps matching until it
doesn't. One query settled it: **86 distinct adopter names, 86 raw-exact
matches, 86 normalized matches, 86 carrying a URL.** Exact-key `.in()` was
therefore both correct and self-reporting — a drifted name resolves to `null`
and renders as "no landing page on file", which is the fail-safe the rule
already mandates.

That row was also `status='proposed'`, so the warning about the join scar was
**not in the default (verified-only) view** — despite its `source` citing a
committed KB note and a merged PR, which the corroboration gate treats *as*
corroboration. Promoted. **The gate does not enforce itself; someone has to
apply it.**

**3. An author `display` rule silently defeats `[hidden]`.**

Sam: *"it turns gray but nothing else — not sure if it registers."* The handoff
read that as missing code ("clear or close the composer on success"). The
closing code was **already there** — `.cplchat-fb-note { display:flex }` is an
author rule and beats the UA stylesheet's `[hidden] { display:none }`, so
`hidden` was inert. One root cause, three visible symptoms.

The fourth defect was the serious one and was found only while fixing the
others: the confirmation was **unconditional**. `upsert()` was never awaited,
`fetch` doesn't reject on HTTP errors, and `sierra_feedback_upsert` **raises**
on an invalid rating. A note that never saved was thanked for.

That is also why the obvious fix was wrong. "Let a note send without a rating"
would have **silently destroyed notes**, because the RPC rejects a null rating
and the error was swallowed. **Check the server's own validation before
loosening a client guard that mirrors it** — a guard that looks arbitrary may be
enforcing a constraint.

**4. Prove equivalence; don't argue for it.**

The `sierra_rules` refactor moved ten rules out of a hand-concatenated template
literal into a registry. The temptation is to reason that `sort_order` reproduces
the old order. Instead: build the old chain from the real consts, build the new
one from the real registry, and compare **byte for byte across all 16
combinations** of the four contexts. Identical. For a public bot that difference
matters — "it looks right" is not a standard students should be held to.

**5. Four red checks on `main` were stale test BOUNDS, not defects.**

A 900-char window that stopped covering a function once it grew; `await
fetchCredentialRecs(` after #1150 moved the call inside `Promise.all`; a
rule-length cap asserting 500 after #1182 raised it to 1500; an extraction
bundle missing `renderAdopters` since #1178. Each had been failing while the
property it guards was never violated.

Fixes that generalize: **scope an assertion to the function body, not a
character window; count call sites, not a literal call spelling; and compare
duplicated constants to each other rather than to a pinned number** — which is
what the SQL file's own comment already demanded ("THERE ARE THREE LENGTH LIMITS
AND THEY MUST ALL AGREE") and what pinning one number in one file failed to do.

⚠️ And the process failure worth repeating loudly: **the sandbox ships no
`node_modules`**, so every jsdom suite crashes on a missing module — and that
crash *masks* the real error underneath. #1184 merged with two suites broken
because of exactly this. Run `npm install` before trusting a green local sweep.

**6. "It's the same thing, so nothing is lost" was 90% right.**

Sam asked whether suppressing CPL Assistant would lose anything, since it is now
the same as Sierra. It is: the pane holds only a `<style>` block and an empty
`.cplchat-mount`. But the Sierra Training hand-off named `#chatbot`
*specifically*, so suppressing it would have left no way to test an instruction
— **silently**, which is the failure #1166 existed to fix.

And a second dependency worth carrying into the Admin tab design: the base
`cplchat-*` CSS lives in that pane's **markup**. **Hiding** it is safe (CSS in a
hidden container still applies document-wide); **removing** it unstyles Sierra
everywhere else.

### Current state

`sierra_rules` + `sierra_rules_log` are live, reviewer-only, **seeded empty**.
`cpl-chat` reads the overlay every turn and records `rules_fired` /
`rules_overridden` on `chat_interactions`. The protected set is enforced in
code. 213/214 suites green (the one red is the documented `governance.test.js`
drift queue).

### Next concrete step

The **Admin tab** — but two decisions first: what gates Admin itself
(recommend reviewer magic-link only) and whether it absorbs Team Phrases. It is
also the right home for the `sierra_rules` curator UI, which should ship
together with the "which rules were in play for this answer" view — the ADR
argues that visibility is worth more than editability, and it is the half nobody
can see yet.

Then Priority 3: the two-lane memory tab (`memory_slug` already exists on
`sierra_rules`) and the drift check that reports **"decided in memory, no Sierra
rule implements it."**

## S311 (SkyQuill, 2026-10-01): an abbreviation was hiding two bugs, and two smokes at once make a third

**The abbreviation.** Smoke 7s failed on `main` after #1796 because Sierra answered a visitor who
wrote "San Gabriel Valley" with "7 miles from the SGV". The place block's heading already said
"the San Gabriel Valley"; the abbreviation was the model's own. #1800 (v75) added one sub-rule
under the place rule: name the place in full, as the heading names it, the first time, and never
shorten it to an abbreviation the visitor did not write.

**What the full name exposed.** With the place spelled out, the next answers carried two faults the
letters had hidden from the smoke's regexes:

- "Registered Nursing — taught at 20 San Gabriel Valley colleges". The region has six campuses.
  Four catalog sections counted "In <place>" by proximity band, and a sub-region's band is its
  whole county. `inAskedPlace()` (#1804) counts a sub-region by its own campuses and leaves the
  county ranked first. Its guard drives the real builders; the unfixed code fails four of seven.
- "No college in the San Gabriel Valley catalog data shows an existing CNA articulation yet",
  which smoke 7s's absence check catches. The catalog shows courses, not articulations, so the
  sentence garbles its source as well as reading as an absence about the place.

**The lesson:** when a fix makes the model use words a guard can now read, expect the guard to
find what the old words hid, and read the first failures as findings about the context.

**Two smokes at once.** The push to `main` starts a smoke, and a dispatch two minutes later started
a second. They overlapped on the database, and 7c's direct call to `program_typical_courses`
returned nothing (a timeout swallowed as `rows=0`) in one run and passed in the other. Measured
after: 47 ms direct, 122 ms in PostgREST's call shape, 2.1 s mean over 218 PostgREST calls with a
7.9 s maximum. Dispatch a verifying smoke only after the push-triggered run finishes; read which
version each mode ran against when a deploy lands mid-run.

## S370 (SkyHolly, 2026-10-12): a verb before the articulation, and an opening that corrected itself

**Smoke 7s, a fourth shape of an articulation absence.** Run 38251043198 failed 7s on a right
answer: "No college in the San Gabriel Valley (or statewide) has yet set up a formal CPL
articulation specifically matching a CNA into LVN coursework", after Pasadena NURS 102, Rio Hondo
VN 61 and Citrus VNRS 150. The helper set aside "has yet articulated", "has an articulation" and a
pronoun for one, not a verb between "has yet" and the articulation. #2031 adds set up, established,
created, built, put in place, approved and adopted. Each new shape so far has come from a real
answer, and each fix keeps "has set up an LVN program" failing.

**Smoke 7c caught a real defect.** Run 38255175428 opened: "Start by asking Santa Ana College's CPL
coordinator to review your CNA training against VN 220 ... at Long Beach City College — wait, let
me give you the right starting point". The place block says treat the place as home, and the
request bullet said "the CPL coordinator at <college>" without saying which college, so the model
paired a college in the place with the nearest course outside it, then printed its own correction.
#2032 says the request goes to the college that teaches the course, even outside the place, and
asks for the course and its college to be chosen before the first word. The rule states the right
form only: on 2026-10-02 a quoted bad sentence was reproduced word for word.

**A push-triggered smoke measures production, not the branch.** The smoke on #2032's head ran the
old deployed prompt and failed 7c, as it had to. The branch's own evidence is the A/B
(`cpl-chat-preview-ab.yml` on the branch), and the merge-then-deploy waits on that grid.

## S371 SkyMaple, 2026-10-12: 7c's opening holds; its precedent miss is the model

The deployed v90 opens 7c on the course's own college. Smoke 38269835553 then failed 7c's precedent check: the answer said
no CNA-to-LVN precedent existed. A retrieval gap was the first suspicion and was wrong: the failing and passing turns carry
the same `context_chars` (70,554) and uncached input (26,369) in `chat_interactions.timings`, and 13 of 15 turns on the
question in 30 hours cite NURVN 414. The probes reach Acute Care Nursing Assistant through *vocational nursing*, and
`pickHeldTitles` keeps it among the four held titles. Note that `fetchCredentialRecs` turns an RPC error into an empty map,
which `buildPrecedentLines` renders as "none ... the request would be a first": a timeout there would produce the same
sentence, so check the timings before reading either cause into it. Whether to tune the precedent line is Sam's call.

## Matched instructions: Fable's advice on the 9,000-character budget (S540 SkyBunchberry, 2026-11-01)

Sam, 2026-11-01, on the Sierra training tab: *"Thinking about our instructions and the size limitation and the need to
retire instructions to add new ones and worrying that we are removing part of her brain to stuff in different parts and
thinking that may not be sustainable or wise ... consider whether we might use JEV or other tools or approaches or
combinations to unharness her more and make her more agile and free to grow."* He asked for Fable as advisor.

- **Measured** (Fable, from `chatbox/supabase/functions/cpl-chat/index.ts`): `fetchGuidanceKind` (~6679) reads active
  rows newest first, limit 20; `guidanceBlock` (~6704) stops at the first row past 9,000 characters. The question plays
  no part. 18 active directives, 8,693 of 9,000 characters on My College (receipt
  `sierra_guidance_wording_fixes_2026-10-26_s491.sql`). `chat_interactions` logs the built-in rules' `fired` keys,
  never guidance ids. Most instructions already open "When someone asks something like X", a trigger the code ignores.
- **Advice.** Three tiers: a cached core that always goes (about 2,500 characters); instructions matched to the question
  by their trigger, matches first, then newest first to fill (today's behavior as the floor); display rules routed the
  same way. Jev as a second scorer behind a flag for semantic triggers, never the only gate (below p 0.85 its ordering
  was chance in the CCRR trial, `kb/_jev_battery.py`), with a timeout falling back to the keyword score.
- **First step** (one PR, no schema change): score directives against `routeText` with `extractTopicKeywords` and
  `trigramSimilarity`, matches first, log `{sent, matched, dropped}` ids in `timings`, and make
  `sierra_wording_check.js`'s `sendSet` agree. Measure two weeks: matched-and-dropped turns (target 0), characters per
  turn, `first_text_ms` unchanged, thumbs-down rate.
- **Risk.** An instruction that silently fails to fire. The tab should show per instruction "fired on N of the last
  100 questions" and a "Would this fire?" box running the same matcher.
- **Held** on Open Asks Sheet 153: it changes the live function, a production deploy.
