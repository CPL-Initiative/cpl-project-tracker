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

The generalisation is not "check the data exists." It is: **when a rule and an
output disagree, ask whether the rule was even satisfiable with what reached the
prompt, before treating it as a compliance problem.**

**2. Measure a join's match rate before building on it — it tells you WHICH
join, not just whether one is broken.**

The repo's join scar (`normalise-both-sides-of-a-join`, PR #1128, five colleges
silently unfunded) creates a reflex to always fold both sides. But over-folding
is the mirror error: a fold can merge two genuinely distinct colleges, and it
hides drift, because a name that changes upstream keeps matching until it
doesn't. One query settled it: **86 distinct adopter names, 86 raw-exact
matches, 86 normalised matches, 86 carrying a URL.** Exact-key `.in()` was
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

Fixes that generalise: **scope an assertion to the function body, not a
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
