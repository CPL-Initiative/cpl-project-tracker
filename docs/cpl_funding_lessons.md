---
title: CPL Implementation Funding tab — workstream lessons
created: 2026-06-11
updated: 2026-08-22
tags: [lessons, funding, implementation-funding, dashboard-tab, parallel-session]
artifacts:
  - CPL_Dashboard.html / index.html (tab shell — PR #352)
  - funding/CPL_Funding_Model_2026.xlsx (committed source workbook)
  - funding/_build_funding_data.py (one-shot extractor)
  - cpl_funding_data.js (static data artifact, window.CPL_FUNDING)
  - cpl_funding.js (renderer, window.CPL_FUNDING_TAB)
  - tests/cpl_funding_*.test.js (nine suites; split 2026-08-20)
  - tests/lib/cpl_funding_harness.js
  - tests/cpl_funding_reorder.test.js
  - prototype/funding_model_explainer.html (the audience-facing explainer)
  - prototype/build_funding_model_explainer.js (regenerates its data)
  - tests/cobi_prose_measure.test.js (the full-width prose rule, COBI-wide)
  - college_briefing.js (My College funding box — the identity join)
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/methodology-standing-pii-guard]]"
  - "[[docs/cpl_funding_handoff]]"
---

# CPL Implementation Funding tab — lessons

Workstream scratchpad for the **Implementation Funding** dashboard tab
(hash `#implementation-funding`), built 2026-06-11 in a session running
**parallel to an active CCR session** — hence the unusual constraint set:
shell-first, then new-files-only.

> **Earlier sections archived.** The 2026-06-11 → **2026-08-06** build-out — the tab
> itself, the Chancellor-facing 2-year rework, the equity refinements
> (front-load · floor · rural allowance · eligibility badges), the
> achievement-based cap-and-earn model, the $35M reframe, the Budget-tab ledger
> reconciliation and the move to credit FTES — moved verbatim to
> [`cpl_funding_lessons_archive.md`](cpl_funding_lessons_archive.md) on
> 2026-08-20, and the 2026-08-01 → 2026-08-06 sections (the units answer, the
> per-priority price factor, the NC decision, the opt-in v1 and the $50k
> groundwork) on **2026-08-27** — each time because the doc crossed its size
> budget and the checkpoint needed to append. Those phases are shipped and settled; read the archive only for the
> reasoning behind a decision you are about to change.

## 2026-08-20 — SkySort (Session 173): drag-to-reorder the priorities, "funding factor", and the Year-2 mirror

Sam's three asks, in his words: move **Priority 3 into the Priority 1 position**
by drag and drop rather than retyping both years; rename **Price factor →
Funding factor**; and **auto-copy each priority's detail from Year 1 to Year 2
when Front-load is selected**. Plus: *"push back and better alternatives always
welcome"* — taken up on the third.

**(a) Learned**

- ⭐ **A reorder must never rewrite the config.** The obvious implementation —
  permute `yearPriorities[slot]` and save — has to enumerate every field, and a
  field it forgets silently re-points a priority at a *different* identity's
  baked default. That is not theoretical here: the live overrides are **partial**
  (Scenario 2 sets `metric` and `share` on two priorities and neither `factor`
  nor `title`), and `yearPriorities[slot]` is stored as an **object keyed by
  index string**, not an array. The order ships instead as a **permutation
  stored beside the config** (`priorityOrder: [2,0,1]`), so not one stored value
  moves and every allocation, cap and target comes back byte-identical.
- ⭐ **One translation seam, not per-emitter translation.** Exactly four
  functions index a priority list (`prioField`, `prioMetricSource`, `prioUnit`,
  `setPrio`) plus `priorities()`. Everything above them speaks DISPLAY index and
  everything below speaks SOURCE index. The failure mode that matters is an edit
  landing silently on the wrong priority, and a per-call-site translation is a
  call site somebody eventually misses.
- ⚠️ **The label is positional, the key is not.** `label` becomes
  `"Priority " + (i+1)`, `key`/`src` stay with the identity — so the P1/P2/P3
  columns follow the eye while every per-college cap stays attached to its own
  priority. `DEFAULT_PRIORITY_TITLES` had to move to the source index too, or an
  untitled priority adopts the default title of the slot it was dragged into.
- ⚠️ **The order is WINDOW-LEVEL, not per-year** — Sam's own ruling that the
  years are deliberately identical (`cpl_memory` `funding-years-are-mirrored-two-year-project`)
  decides it, and a per-year order would both make P1/P2/P3 mean different
  things in different years and cost him the second drag this exists to save.
- ⭐ **MY COLLEGE JOINED THE MONEY TO THE ADVICE BY POSITION, and its own guard
  could not see the reorder.** `prioritiesAlign()` gates on COUNT equality —
  correct while both sides walked one ordered set, useless once one of them is
  reordered, because three still equals three. The join is now by identity
  (`_prios().src` ↔ `collectPrograms().key`). **And the identity was being
  dropped**: `buildBriefing()` re-maps each priority into a fresh object and did
  not carry `key`, so the first version of the identity join resolved to nothing
  and the strategies quietly left the funding box. Caught by the existing Part-P
  assertions in `tests/college_briefing.test.js`, which is exactly what they are
  for.
- ⭐ **Pushed back on "copy on front-load".** A copy fired by that toggle
  overwrites whatever Year 2 holds, with no undo, as a side effect of a control
  about *cash timing* — and the same click is a no-op for Scenario 1 (years
  byte-identical) and a silent policy edit for Scenario 2 (they differ). Worse,
  front-load is the case where it matters **least**: it already makes Year 2 pure
  carryover, so the Year-2 metrics are never scored. Shipped the non-destructive
  form instead — a **mirror** that resolves later years from Year 1 while it is
  on, plus an explicit **Copy Year 1 → Year 2** that asks first. Default OFF, so
  shipping changes nothing until a curator asks for it.
- ⚠️ **A mirrored year must SAY it is mirrored**, or the Year-2 view reads as a
  Year-2 decision that happens to match and an edit there silently lands on both.

**(b) State.** All three live in `cpl_funding.js` + `college_briefing.js`;
`tests/cpl_funding_reorder.test.js` (69 assertions) covers the seam, the
malformed-order fallbacks, both affordances, public mode, the rename, the
mirror and the My College join. `cpl_funding.test.js` and the ten other funding
suites unchanged; `college_briefing.test.js` 236/236.

**(c) Roadmap.** The order is stored per project+scenario like every other
override, so a new scenario clones it. If the priority list ever stops being
three, `isPermutation()` drops a stale order back to the natural one rather than
dropping a priority off the page.

**(d) Next.** Sam drags them in a browser and sets the new shares + funding
factors; the recalculation is live (target = pot ÷ factor × base rate) and was
asserted rather than assumed.

⚠️ **The audit flagged this doc at 1.5× its budget (179 KB / 120 KB) and this
checkpoint acted on it**: 2026-06-11 → 2026-07-31 moved verbatim to
[`cpl_funding_lessons_archive.md`](cpl_funding_lessons_archive.md), leaving
52 KB live. The rule that produced the flag is the one worth keeping — a
checkpoint that only ever appends eventually makes the doc unreadable to the
session that needs it.

---

## 2026-08-20 — SkyGlass (Session 176): splitting `cpl_funding.test.js`, and the leak that was never the test's to fix

**(a) What happened.** SkySort's handoff left one item explicitly for a
successor's judgment: the per-child heap cap had been raised 8,192 → 12,288 MB
to get PR #1268 green, and the note said plainly that the cap buys headroom and
does not fix the file — 2,955 lines, 61 jsdom windows, one process. It also
recorded a suspicion: *the windows are never reclaimed; `window.close()` does not
release them, which is its own finding.*

**The suspicion was half right, and the wrong half is the one that matters.**
Measured this run:

| | |
|---|---|
| 15 windows **constructed, not booted** | 57 MB **total** — collected normally |
| 15 windows **booted** | 705 MB — ~44 MB each, never released |
| the same 20 windows with `window.close()` | identical curve to one decimal place |

So jsdom is not the leak and the windows are not "unreclaimable" — *rendering* is
what leaves 44 MB behind, and nothing the test does can free it. Heap snapshots
name the retainers: while the file's top-level frame is running every window is
rooted from **`(Stack roots)`**, the frame's own live registers; wrap each block
in an IIFE and that root disappears while the DOM stays rooted from
**`(Micro tasks)`** — a promise reaction holding `boot()`'s `onDOMContentLoad`
closure, on a queue a long synchronous script never drains. Remove one, the other
holds.

⭐ **The process boundary is the only allocator.** The one event that reclaims a
booted window is the process exiting, which `tests/run.js` already gives every
file. Peak memory is therefore a property of the **largest file**, and the only
lever is how many windows that file builds. That is the whole argument for the
split — and the reason no amount of in-file tidying was ever going to work,
including the close-stale-windows attempt #1268 correctly reverted.

⚠️ **A loop-shaped probe cannot reproduce a block-shaped file.** Booting in a
`for` loop and measuring afterwards shows the memory coming back, because the
frame returned. The real file is sixty *sibling blocks* in one still-running
frame. Reproduce the shape, not the operation, or you will conclude there is no
leak.

**(b) State.** `tests/cpl_funding.test.js` is gone, replaced by nine suites —
`shell` (static invariants, no jsdom, ~1 s), `render`, `rollup`, `equity`,
`scenarios`, `earning`, `rate`, `rural`, `pool` — over a shared
`tests/lib/cpl_funding_harness.js` (the same `freshDom`/`boot`/`click`/`commit`/
`scenSlot`/`footText`/`greenSlices`/`pieSlices`, plus `check`/`finish`). The
assertion bodies were moved verbatim by line range, not retyped.

| | before | after |
|---|---|---|
| assertions | 575 | **575** (49+123+39+103+72+41+37+56+55) |
| peak RSS | 8,642 MB | **2,393 MB** (the `render` suite) |
| wall clock | 462 s | 333 s sequential — and they now parallelise |

**(c) Roadmap.** The budget is written where the next person will hit it (the
harness header, `tests/run.js`, and the KB note): **~44 MB per booted window over
a ~40 MB floor; past ~15 windows in one file, start a new suite.** The cap stays
at 12,288 MB as headroom for everything else, not as this file's life support.

**(d) Next.** Nothing pending on this thread. If a funding suite starts creeping
past ~15 windows, split it rather than trimming inside it.

Durable:
[`methodology-a-test-file-is-a-memory-budget`](kb-notes/methodology-a-test-file-is-a-memory-budget.md).

---

## 2026-08-21 — SkyGlass cont.: the sanity check becomes an explainer

**(a) What Sam asked.** *"Have a look at the CPL implementation funding tab
Calculation sanity check and make sure it reflects the latest changes I made…
revise the language to be non-techie and as simple as possible… I'm getting ready
to shop this to my CO colleagues and I want the sanity check to guide folks
through the basics of the model. Change the Calculation sanity check label to
'How this funding model works'."*

⭐ **The rename was the whole brief in miniature.** "Calculation sanity check" is
an *engineering* artifact — it existed to prove the tab's arithmetic, and it was
written in the model's own vocabulary (`netCollege`, `sizePct`, `prioTarget`,
price factors, a live-config calculator with policy dials). A CO colleague opening
it does not want to verify the engine; they want to understand the policy. Same
arithmetic, different reader, so it is a different document — not a copy-edit of
the old one.

**(b) The config had moved, and reading it was the first step.** The live shared
scenario had changed since the artifact was last published on 2026-08-04, and
none of it was guessable:

| | 2026-08-04 artifact | live on 2026-08-21 |
|---|---|---|
| shares | .50 / .30 / .20 | **.34 / .33 / .33** |
| funding factors | ½ / 1 / 2 | **1.0 / 1.0 / 1.0** |
| priority order | source order | **`[2,0,1]` — Sam dragged Access to first** |
| metrics | headcount-era wording | **all three in CPL FTES** |
| deadline | 2026-09-01 | **2026-11-01** |
| Year-2 mirror | did not exist | **on** |

⭐ **Sam had used the reorder** (SkySort's #1268) — `priorityOrder: [2,0,1]` is
sitting in the saved config. That is the second time this week a question was
answered by *reading the table* rather than asking (the Admin tab's `cobi_nav`
was the first).

**(c) Every number is generated, never retyped.** The page's figures come from
`cpl_funding.js`'s own engine, driven through `tests/lib/cpl_funding_harness.js`
with the live config injected via `_setConfig` — pool waterfall, all 115 offers,
the floor count, the worked example. `prototype/build_funding_model_explainer.js`
regenerates the embedded block, so refreshing after a dial moves is one command
rather than a re-derivation. ⚠️ **It is a SNAPSHOT and that is deliberate** — a
colleague opening a link from an email should not see a page mid-edit — so the
generator's docstring is where the refresh procedure lives.

**(d) One honest number the old page did not surface.** The $150,000 minimum is
funded from inside the same pot, so a college above the minimum is effectively
funded at **~$5,060 per FTES rather than the full $5,649.63**, while a small
college lifted to the minimum reaches its target on far less (Lassen: ~$23,900
per FTES). That is the floor working as designed, but "everyone is paid the state
rate" would have been false, so the page says it plainly.

**(e) Verified, not claimed.** All **26 painted contrast pairs pass AA** (computed
with `prototype/check_contrast.py`'s own math); `prototype/check_funding_explainer.js`
runs a real Chromium over **nine widths** plus structure and keyboard checks —
**36 checks, all green**. ⚠️ **Two of those checks were wrong before the page
was**: the reduced-motion probe `return`ed on the first *cross-origin* stylesheet
(Google Fonts) and so never looked at the page's own sheet, and the skip-link tab
test ran with the search box still focused from an earlier step. Both are the
Sky175 lesson repeating — suspect a new check when it goes red.

**(f) Sam's copy note.** *"Use American English (e.g., check rather than
cheque)."* Swept the page and this run's new files; `cheque`, `colour` and two
`towards` were the whole list. Left the two pre-existing `modelling`s in
`cpl_funding.js` alone rather than churn code this run did not touch.

**(g) Sam's second copy note — and the trap in it.** *"Revise 'the middle
college's offer for the two years' to 'average funding for two years' and add a
detail on the min and max funding."* ⚠️ **The tile was showing the MEDIAN
($167,171); the average is $210,785.** Relabeling it without changing the number
would have stated a false figure on the page he is about to send to colleagues.
Shipped as: the tile now carries the true **average**, and a three-up strip below
it gives **lowest $150,000** (the guaranteed minimum, where 50 of 115 land),
**typical $167,171** (the median, kept because it is the more honest answer to
"what would my college get?") and **highest $522,239** (Mt San Antonio). A line
underneath says why they differ — a handful of very large colleges pull the
average above what most colleges see. Both figures are emitted by the generator,
so neither can drift.

**(h) Next.** Sam reads it end to end before sending it out; re-run the generator
and re-publish whenever the shares, factors or order change.


---

## 2026-08-22 — SkyPlain (Session 182): the explainer stopped arguing against itself

Five rounds on `prototype/funding_model_explainer.html` with Sam reading it as its
audience would — CO colleagues and possibly CA Finance staff. **PRs #1285 · #1286 ·
#1287 · #1288 · #1289**, each republished to the same artifact URL
(`SANITY_URL` in `cpl_funding.js`), plus a COBI-wide layout rule at the end.

### (a) The comment loop works, and it is not a live channel

Sam copied the artifact and left comments on the copy
(`b1588987-…`), then asked whether they had arrived. They had — `Artifact`
`action:"comments"` returns them with thread ids, and `reply`/`resolve` post back as
*"Claude · via the user"*. ⚠️ **But there is no live subscription from a remote
session**: `--watch-artifact` does not wake this session, so comments arrive only when
someone asks for them. Say so rather than implying a channel. ⚠️ **The copy and the
canonical artifact drift immediately** — every fix went to the original (the one the
tab links to), so the copy Sam was commenting on fell five versions behind within the
hour. Offer to refresh it or move the review to the canonical URL.

### (b) The tone was arguing the opposite of the case

Sam: *"the tone of this is written such that a CEO at a college might question why so
much funding is being withheld by the CO"*, naming **"What is set aside before
anything reaches a college"** and **"Left for institutions"**. Both were mine. The
frame ran the whole page — *holds back*, *set aside*, *held back or set aside*, and a
crimson ▼ on every non-college line.

⭐ **The fix was not softer words, it was naming the BENEFICIARY of each amount.**
"Held by the Chancellor's Office" → "statewide CPL projects and technology, and two
Chancellor's Office posts — the work all 115 colleges draw on". Same dollars, same
arithmetic, opposite reading. The heading became **"Where the appropriation goes"**.

⭐ **Sam's second instruction was the more useful half:** *"Rather than refer to this
funding not being a 'check' make a positive statement that the funding is based on
real-time CPL outcomes."* *"That figure is a ceiling, not a check… Show none of it,
earn none of it"* became *"What a college receives is driven by its own CPL results,
as they happen."* **Nothing was hidden by saying it warmly** — the information that
sentence carried still lands in the qualifying step ("earns nothing against it") and
the earning step ("half its target … half that pot"). A negative framing is rarely
load-bearing; check where the fact ALSO appears before assuming it is.

⚠️ **One buried reassurance was worth more than the warning it sat behind.** The
qualifying caveat read *"it earns nothing against it, and what it would have earned is
held in reserve"*. Reversed, that is: **a college's allocation is not redistributed
while it works toward the baseline** — a genuinely reassuring, already-true fact that
a CEO would want, hidden behind the penalty clause.

### (c) A waterfall argues that spending is a loss

Recoloring was not enough. Sam: *"The crimson values still scream negative when they
are actually doing very positive things. All this funding is meant to be expended
(which is a negative), but is to produce positive outcomes."*

⭐ **The instrument was wrong, not the palette.** A waterfall's job is reconciling an
account, so every non-terminal line is a deduction and reads as a loss. This page's job
is saying where $35M goes. Retiring **Step one** entirely removed the last crimson from
the page — `.flow-row.out .amt` and `.bar i.out` were its only consumers. The section's
content became boxes in the intro plus one line of prose; nothing was lost.

⚠️ **Deleting the section nearly deleted a figure.** The `$800,000` CO staff line
existed ONLY in the waterfall, because an earlier round had combined staff + projects
into one box at Sam's request. Splitting it back out was not in the ask and was
necessary. **When you retire a surface, diff what it was the sole display of.**

### (d) Grouping is an argument too

Sam: *"use the $24,240,308 box to show $25,240,308 and note that $1M is dedicated to
noncredit. This will show that we are allocating funding for outcomes for the whole
effort."* ⭐ **Showing the noncredit $1M as its own box read as money being taken out;
folded into one institutions figure it reads as the whole effort being funded.** Same
two numbers.

⚠️ **But "also refer to the 4 noncredit campuses" cannot be applied blanket.** They are
NOT in the credit-FTES split — they have no credit enrollment to be measured on. Four
of the page's `115` references (the FTES sum, the table count, its live status text,
the footer roster) are genuinely credit-only and stay. What the instruction correctly
demanded was the **allocation** framing, plus a line in the "Every college" table
saying where the noncredit campuses are rather than leaving four institutions silently
absent from a list called *Every college*.

### (e) Arithmetic must close, or a Finance reader stops reading

Every box round, the boxes had to SUM. `$35,000,000 − $9,759,692 ≠ $24,240,308` because
the noncredit $1M also comes out — so the first box round added a third box Sam had not
asked for. Made structural rather than remembered: **the college/institution figure is
DEFINED as the appropriation minus everything else** (`hero = one_time − admin −
scaling − feeder`), so no two boxes can drift apart on a rebuild.

### (f) The measure rule, and it is a habit not a one-off

Sam: *"this is a consistent formatting pattern you use — where you make text widths
short for readability but it looks awkward when set against the full width items. I
prefer if you either extend text widths the full extent OR use two columns."* Then:
*"I would like the full width format rule on throughout COBI."*

⭐ **Shipped as a TOKEN, not 39 hardcoded values** — `--cpl-measure: none` on `:root` in
both mirrored HTMLs, every site `max-width:var(--cpl-measure,none)`. One lever restores
a measure everywhere, or moves to columns later.
⚠️ **The `,none` fallback is load-bearing**: most of these rules ship from a tab's own
JS onto surfaces that never declare the token (`cpl_funding_public.html` is exactly
that), and without the fallback the declaration is invalid — right by accident today,
wrong the day the token becomes a `ch` value again.
⚠️ **THE THRESHOLD IS THE WHOLE POINT.** 60 of the 60 `ch` caps in COBI split cleanly:
34 at 60–82ch are reading measures; 26 at 9–46ch are LAYOUT — cell truncation, a
raw-value column, a monospace strip, a badge, a deliberately short hero lede. A blanket
sweep would have widened all 60 and broken layouts this change is not about.
⚠️ **A px cap is the same defect in different units** — four tab intro paragraphs at
880px/760px (`raci`, `tmc_builder`, `team_phrases`, four inline `<p>` in the HTMLs) were
invisible to a `ch` grep.
⭐ **Two columns was offered and declined with a reason:** at full width most blocks on
these pages run one to three lines, so columns would produce one- and two-line stacks
and force the eye down and back for nothing. Columns pay off over long continuous runs
of text, which COBI does not have.

### (g) Next

Sam reads the explainer end to end in a browser and looks at the full-width rule across
the tabs — no session can, the sandbox is egress-blocked from the Pages host. Then:
re-run `prototype/build_funding_model_explainer.js` and re-publish whenever the shares,
factors or order change; and decide whether the Year-2 mirror should be on for
Scenario 2.

---

## 2026-08-22 (later) — SkyBound: a maximum allocation, and what it actually buys

Sam, four items: move the explainer link to the title row; add a **Max Funding**
factor beside the $150K minimum, editable, set to **$400,000**; recalculate; and
*"push back and simpler recommendations welcome."* (A fifth item — Title 5
apportionment for CPL units — was explicitly thinking-only.)

### The measurement came first, and it changed what there was to say

Before touching the solver, the whole design space got measured over the live
roster. That took one probe script and it is the most useful thing in this
section:

| Setting | Max | Min | Ratio | At min | At max |
|---|---|---|---|---|---|
| floor $150K, no ceiling (before) | $522,239 | $150,000 | 3.48x | 50 | — |
| **floor $150K, ceiling $400K (shipped)** | **$400,000** | **$150,000** | **2.67x** | **45** | **6** |
| floor $150K, ceiling $300K | $300,000 | $150,000 | 2.00x | 42 | 26 |
| floor $150K, ceiling $250K | $250,000 | $150,000 | 1.67x | 30 | 56 |
| **floor $200K, no ceiling** | **$375,285** | **$200,000** | **1.88x** | **93** | — |
| floor $200K, ceiling $400K | $375,285 | $200,000 | 1.88x | 93 | 0 |
| floor $250K | — | — | — | *unaffordable* | — |

⭐ **A $400,000 ceiling is close to a no-op for equity.** It holds six colleges
and moves **$262,241 — 1.1% of the pool**. Every dollar of it lands on the
colleges ranked ~7–70; **the 45 colleges at the minimum gain nothing**, because
a college pinned to the floor cannot be lifted by a ceiling. Biggest gainer:
Santa Monica, **+$7,079** — the seventh-largest college in the state. Median
gain among the 64 that gain: **$4,116**.

⭐ **The floor is the equity lever, not the ceiling.** Raising the minimum to
$200,000 reaches 1.88x on its own, and at that floor a $400,000 ceiling never
binds — one dial instead of two. The floor's own limit is **~$210,785** (the
average award); above that every college is at the average and the model has
stopped being proportional at all. Recommendation put to Sam in the PR body;
the ceiling shipped as asked either way, because it is a live-editable dial and
the number is his to move.

### The solver had to change shape (the durable half)

Full write-up:
[`methodology-a-second-bound-breaks-a-pin-as-you-go-solver`](kb-notes/methodology-a-second-bound-breaks-a-pin-as-you-go-solver.md).
In brief: a floor is **monotone** (pinning pushes everyone else DOWN, so a pin
is safe forever); a ceiling runs the **other way** (pinning RELEASES money and
pushes everyone else UP), and that can lift a college back off the floor.
Measured: **5 of the 50 floored colleges come off it** at $400K. A second `if`
in the old pin loop would have stranded them at $150,000 with the pool still
balancing and every row still inside both bounds — invisible.

`allocModel()` now bisects `lambda` in `W(c) = clamp(lambda*size, floor, cap)`,
then computes the free rows with the waterfall's own arithmetic — so with the
ceiling **off** it reproduces the old loop **bit-for-bit** (`0.000e+0`), which
is what `C2` asserts against a transcription of the pre-change algorithm.

### ⚠️ A bound on the money is a bound on the bar

Capping the allocation without capping the target asks the capped college for
~40% more CPL per dollar than anybody else, and has the state asking for more
prior learning than it funds — the *"reads as withholding"* failure Sam ruled
out three days earlier on this very page. `capScale()` scales a capped college's
targets down with its money.

⚠️ **Scale to the ceiling ÷ `plainRatio`, not to the ceiling.** Every unbound
college already pays a **~9% rate discount** to fund the floor top-ups
(`plainRatio` 0.913 on the FTES basis). Scaling to the bare ceiling would hand
the six largest colleges the only unsubsidized rate in the state. The invariant
the repo already had a test for is the right one: **cap ÷ target is ONE rate for
every college above the minimum** — now `1.000000000000` on both bases, capped
colleges included rather than excused.

⚠️ **The clamp must reach BOTH target paths.** A CPL-FTES priority derives its
target from `prioEntitlement`; a student-unit priority derives it from
`size x target_rate` and never touches that function. A clamp in one place
gives the same college two different answers depending on a **metric label** —
the exact trap `metric-label-was-a-policy-switch` already records against this
tab.

### Smaller things worth keeping

- ⚠️ **One new check could not fail.** "No rural row exceeds the ceiling" is
  vacuous at $400K — no rural college comes within $200K of it — and it passed
  against a deliberately broken `capFor()`. It now runs at a ceiling that binds
  ($160K). Three of the other four breakages fired first time; this is the
  fourth consecutive session to find a check that cannot fail.
- ⚠️ **Two amount inputs in one box need distinct accessible names.** Both
  inherited `aria-label="Funding amount"`, so a screen-reader user could not
  tell the minimum from the maximum. `valueEd()` takes an `aria` override now.
- ⚠️ **The explainer's worked example had to move.** It was "the largest
  college, because its offer is the one not bent by the floor" — true while the
  floor was the only bound. The largest college is now pinned to a round number
  its own share cannot explain, so the walk-through would have shown a
  subtraction the reader could not reproduce. It picks the largest **unbound**
  college now (Santa Monica).
- The explainer's typed `$5,060` effective rate is now **computed** from the
  model. With the ceiling on it rises to **$5,159**, because the released money
  goes back to exactly the colleges paying the floor discount — the clearest
  one-line statement of what the ceiling does for everyone else.
- Six colleges tie at the ceiling, so "sort by offer" no longer orders the
  table; the explainer falls back to size, and the COBI sort test now asserts
  the first row carries the **maximum total** rather than naming a college.
- My College dropped *"a cap, not a cheque"* — Sam retired that framing on
  2026-08-22, and "cap" is now literally a cap in this model. ⚠️ The replacement
  comment quoted the retired phrase and broke the test that greps the source:
  **a marker is load-bearing text, not prose.**

### ⭐ The noncredit question, measured: noncredit is 111 institutions, not 4

Sam's think-only follow-up: *"what about our other NCs… Can you see how it would
look if we gave each a floor of $25K and a ceiling of $100k based on their ftes?"*

The first number reframes the question. **108 of the 115 credit colleges already
carry noncredit FTES** (67,822.6 between them) alongside the 3 standalone NC
institutions (14,165.8 — Mt. SAC NC deduped, Calbright on its $1,000 placeholder).
So *"our other NCs"* is **111 institutions carrying 81,988 noncredit FTES**, not a
handful. Noncredit is nearly the whole system wearing a different hat.

⚠️ **At that roster the proposed bounds are arithmetically infeasible inside the
carve-out.** 111 × $25,000 = **$2,775,000 — 2.8× the $1,000,000 feeder carve-out**,
and still short even if the retired rural $1M is added on top. At exactly
$2,775,000 every institution sits on the floor and the ceiling never binds, so the
FTES basis does nothing at all. The lane only starts to differentiate near $3.5M.

⭐ **So the lever is the ROSTER, not the bounds** — and the distribution is kind:

| NC FTES ≥ | institutions | share of the lane | $25K floors cost | inside the $1M carve-out? |
|---|---|---|---|---|
| 250 | 47 | 92% | $1,175,000 | no, just over |
| **500** | **33** | **87%** | **$825,000** | **yes** |
| 1,000 | 17 | 72% | $425,000 | yes, but 17 × $100K can't spend $2M |

**A ≥500 NC FTES roster is the one that fits what Sam asked for with no new money**:
33 institutions, 27 of them at the $25K floor, top allocation **$89,586** (Mt. SAC),
the $100K ceiling never binding — inside the existing $1,000,000.

⚠️ **The Mt. SAC double-count is load-bearing the moment this ships.** Its credit
row and the feeder roster both carry 10,829.3 noncredit FTES; undeduped it earns in
the NC lane twice. Harmless while the carve-out is a flat 4-way split — a real
defect on the day NC money follows the number.

⚠️ **And this is only the SIZE basis.** Sam's other half — *"count them only if they
originated from the NC landing pages"* — is a metric-scoping rule on what is EARNED,
which the feed does not distinguish today. Sizing the pool is the easy half.

⚠️ **Whatever the shape, the college row keeps CR and NC money visibly separate**
(Sam: *"I want it on the surface the amount admin should give to NC so it doesn't get
lumped into the whole"*). That is a display requirement on the credit tab, not a
property of the allocation.

### ⚠️ Two existing assertions were pinned to the wrong wording

Changing the two cards turned `cpl_funding_render.test.js` and
`cpl_funding_scenarios.test.js` red. Neither was a regression: one required the
literal phrase *"noncredit feeder support"* and the other *"noncredit campuses"* —
**both of which the sentences kept saying while they were wrong**. The phrase
survived the claim being false, which is the definition of an assertion that has
stopped guarding anything.

They now assert the **substance**: the two lane figures appear, the lane is sized
by `ncModel().rows.length` rather than the standalone roster, and the count line
reports noncredit FTES rather than a headcount. Same failure shape this repo has
recorded before — *an assertion pinned to a value that can leave the data stops
being a guard the moment it does*.

⚠️ **This is also why the full suite is not optional.** Both files sit outside any
subset a session would choose while working on the memo, and the run that caught
them exited **1** — the previous three runs in this session were all contaminated
by edits landing underneath them, and every one of them read as green.

### Where this leaves it

The ceiling is built, tested (51 checks), editable, and reversible with one
dial. **Next: Sam picks the number** — $400,000 as shipped, or the floor raise
that does more with one lever. Either way the explainer artifact must be
re-run and re-published to the same URL; it is a snapshot.

---

## 2026-08-22 (later still) — the rural carve-out retires, and the floor takes its place

Sam, immediately after the ceiling shipped: *"since we have now both a floor and
ceiling to the funding, it seems we don't need the rural carve out since all are
benefitting from the floor… fold the funds into the total available. Seems like
it would be near zero impact and would eliminate a complicating factor."*

### The claim was two-thirds true, and the third that wasn't is the whole lesson

| | today | without the carve-out | delta |
|---|---|---|---|
| 10 rural colleges at the minimum | $150,000 | $150,000 | **$0** |
| Shasta | $220,656 | $150,000 | **−$70,656** |
| Redwoods | $162,193 | $150,000 | −$12,193 |
| Imperial | $155,655 | $150,000 | −$5,655 |

⭐ **Ten of the 13 moved exactly $0** — the floor genuinely was doing that work,
exactly as Sam said. **Three sat ABOVE the floor**, where the $76,923 was riding
on top as a bonus rather than filling a gap.

⚠️ **And the released $88,594 travels the wrong way.** It re-splits
proportionally, so the biggest gainers were **Santa Monica +$2,375, East LA
+$2,328, Riverside +$2,277** — a transfer from three rural colleges to the
largest non-rural ones. "Near zero impact" was true in aggregate and regressive
in direction. That is why it shipped **paired with the floor raise to $175,000**,
under which the 13 receive **$2,275,000 — $236,406 more** than the carve-out
ever paid.

### ⭐ The redundant-looking mechanism was carrying a SECOND job

The allocation table could not show this and it is the real policy consequence:
the rural allowance was **the only unconditional money in the college pool**.
The floor caps what a college can *earn*; it does not guarantee what it
*receives*. A floored college that posts nothing in MAP still earns ~$0. So all
13 went from **$76,923 guaranteed → $0 guaranteed**, and nothing in the pool is
unconditional now.

It matters *increasingly*, not today: unmeasurable priorities currently pay
provisional advances, so everyone looks funded. Once the feed measures
everything, the guarantee would have been the only thing left that wasn't earned.
Durable: [`a-mechanism-that-looks-redundant-may-be-carrying-a-second-job`](kb-notes/methodology-a-mechanism-that-looks-redundant-may-be-carrying-a-second-job.md).

### ⚠️ What the $175K floor costs, measured and on the record

| | floor $150K | **$175K (shipped)** | $200K |
|---|---|---|---|
| colleges at the minimum | 49 | **69 of 115** | 93 |
| the median college gets | $165,770 | **$175,000 — the minimum itself** | $200,000 |
| unbound college's earn rate | 88.1% of base | **78.2%** | 61.8% |
| the $400K ceiling binds | 6, $262,241 | **2, $82,815 (0.34%)** | 0 |

Two things nobody asked for and both matter. **The median college is now exactly
on the floor** — half the system is funded by the minimum rather than by its
size. And **the floor is paid for by the colleges above it**, so their effective
rate falls to **$4,419 per CPL FTES against a $5,649.63 base**. A floor raise is
not free; it is a transfer priced in the earn rate of the middle.

That is the strongest argument for the alternative Sam floated afterwards — keep
the floor at $150K and send the freed $1M to noncredit instead. **Both are the
same structural change with two different dial values** (`floor_window` and
`feeder_carveout`), which is why the code shipped either way.

### Smaller things worth keeping

- ⚠️ **Two more assertions could not fail.** The ceiling's rural bound was
  vacuous at $400K (no rural college comes near it) — it passed against a
  deliberately broken `capFor()`. And "colleges come off the floor" stopped
  being observable once the floor rose, because the ceiling now binds only two
  colleges. Both now run where they bind. **That is four vacuous checks found in
  two sessions on this one tab**; the pattern is always a threshold moving out
  from under an assertion that named a specific number.
- ⚠️ **The explainer's worked-example cards were hand-typed** and two of their
  four figures were already stale. They are generated from the payload now — in
  a file whose own docstring says every figure comes from the engine.
- The rural FLAG survives as context in the data (federal categorization, a true
  fact Sam's team maintains); the glyph, the section, the card, the CSV column
  and the curator control are gone.

### ⚠️ Two defects the removal itself left behind, found at the checkpoint

**A removal leaves a HUSK, and a husk can render.** Deleting
`netCollegeWithRural()` left `fmtMoney(netCollege() - netCollege())` standing in
**two audience-facing briefs** — the copyable text and the print HTML — so both
told colleges the pool included *"the **$0** Rural College allowance."* It was
syntactically fine, arithmetically valid, and invisible to every test, because
the function it had referenced was already gone and nothing asserted on the
sentence. **A self-subtraction is the signature of exactly this mistake**, so
that is now the check (`cpl_funding_rural.test.js`, 33 → 35, both new checks
verified to fail against the reintroduced defect).

**A page that fills its figures with JS still ships hand-typed defaults.** The
explainer writes seven figures from its payload at render time, and the static
text inside those elements still said **$150,000** in six places and **45
colleges** in one. A browser never shows them; view-source, a saved copy or a
reader with scripts off does. This is the *second* instance in one session on
the same file (the worked-example cards were the first), in a file whose own
docstring says every figure comes from the engine. Fixed, and guarded twice:
`lintStaticDefaults()` in the builder warns at build time, and
`tests/funding_explainer_defaults.test.js` (11 checks) fails in CI if the page
disagrees with its payload **or** if the payload disagrees with the repo's bounds
— because a default checked against a stale snapshot agrees for the wrong reason.

⭐ The generalization worth keeping: **when the same figure has two sources —
one generated, one typed — the typed one is a source of truth that nothing
exercises.** Generate it or lint it; there is no third option that survives a
dial change.

### Where this leaves it

Two dials, both live and editable: **minimum $175,000**, **maximum $400,000**.
**Next: Sam picks the pair** — as shipped, or $150K + $1M to noncredit. The
noncredit expansion is scoped but unbuilt; see the handoff.

## 2026-08-23 — the noncredit lane becomes a real allocation

Sam, after reading the measurement: *"Let's go with the NC>=500 with a $25k
floor. We can pull out the Mt SAC NC dup… This would mean we could retire the NC
section provided we could integrate the values on the college rows."* Then, on
being offered a floor number: *"Maybe we should add a funding box to make the
NC>=500 a variable."*

### What shipped

The noncredit lane was a flat FTES split of the $1,000,000 carve-out among four
feeder campuses. It is now **the same bounded allocation the credit pool uses**,
over every institution clearing an editable entry threshold — 33 of them at the
shipped dials, **30 credit colleges running their own noncredit programs plus 3
standalone institutions**.

Three dials, all editable in the box beside the credit pair: `nc_threshold_ftes`
(500), `nc_floor_window` ($25,000), `nc_cap_window` ($100,000). The awards are
window totals, like the credit floor and ceiling; the two-batch-per-funding-year
cadence survives because it is disbursement policy, not part of the retired
mechanism.

### ⭐ The seam a comment predicted, and why it was worth honoring

`solveAlloc()` carried a comment from the ceiling work saying its bounds
functions were *"the one seam a second pool would swap (a noncredit pool on
noncredit FTES with its own floor and ceiling)"*. That turned out to be exactly
right, so the noncredit lane calls the SAME solver — `solveBounded({rows, keyOf,
sizeOf, net, floor, cap})` — rather than growing a second one that would drift.
The credit lane is now a five-line caller. `cpl_funding_cap.test.js` still
asserts the ceiling-off output matches a transcription of the original pin loop,
which is what proves the generalization moved no dollar.

### ⚠️ The dedup was right about the FTES and wrong about the institution

Sam's *"pull out the Mt SAC NC dup"* is correct: Mt. SAC Noncredit's 10,829.3
noncredit FTES is **also** on the Mt. San Antonio credit row, so an
FTES-proportional lane would pay the same program twice. I deleted the row from
the `feeders` roster — and a test went red on a completely different surface:

> `FAIL  Q2: 118 recipients + 1 declined row`

**ESS 25-82 paid Mt. SAC Noncredit its own $50,000 seed grant.** It is a real
institution in a record of distributed awards, and deleting the row erased one.
The duplicate was the *FTES*, never the *institution*. The fix moved the dedup
from the data roster into the size basis: the row carries
`nc_ftes_on_credit_row: "Mt San Antonio"`, its noncredit size is zeroed, and the
table renders it with the reason — *"counted on the Mt San Antonio row"* — because
a silently missing institution and a deliberately-zero one look identical.

⭐ **A deduplication has a scope, and the scope is one measure — not the record.**
The same row can be a duplicate in one lane and the only copy in another.

### ⚠️ The CSV's total row had been one cell too wide for months

Adding the noncredit columns to the export produced a field-count mismatch, and
checking against `main` showed **the mismatch predated the change**: the SYSTEM
row emitted three empties where the header has two, and so did every DISTRICT
SUBTOTAL line. Every figure from that point right — the year columns, the window
total, all five earned columns — sat under the wrong heading **in the one row a
reader checks first**. Invisible in the browser; you have to open the file.

The guard is a field-count check over every line against the header, in both the
flat and district-grouped shapes, plus one that reads the SYSTEM total by
**column name** and compares it to the pool. Both verified against the
reintroduced defect. ⭐ It generalizes: any future column added to one line and
not another fails here.

### ⚠️ Where the growth incentive actually is

Sam liked this lane because it *"gives the smaller NC programs an incentive to
grow"*. Measured, that is true at the entry and absent in the middle: **27 of 33
sit at the $25,000 floor — 68% of the pool — and growth does not start paying
until 3,022 noncredit FTES**, which only six institutions clear. A college at 600
FTES and one at 2,900 receive exactly the same $25,000.

| floor | at the floor | growth starts paying at | floor share of pool |
|---|---|---|---|
| **$25,000** (shipped) | 27 of 33 | 3,022 FTES | 68% |
| $20,000 | 23 of 33 | 1,762 FTES | 46% |
| $15,000 | 17 of 33 | 1,017 FTES | 26% |

The model now reports `breakEven` and the box prints it, because a lane that is
mostly floor is mostly not an incentive and that should be visible on the dial
rather than discovered later.

### ⚠️ A dial can strand real money, so the box has to say so

Narrowing the threshold to 3,000 FTES leaves 7 institutions, and 7 × $100,000
cannot absorb $1,000,000: **$300,000 becomes unspendable**. The solver's existing
degenerate branch surfaces it and the box warns on screen. This is the one way a
curator moving a dial can silently strand money, so it is pinned by a test.

### Where this leaves it

Noncredit money now rides **beside** the credit total everywhere it appears — its
own column on the tab, its own columns in the CSV, its own line on My College —
never summed into it, which is Sam's *"neglected step child"* constraint made
structural. The retired feeder section is a three-row block for the institutions
with no credit row; they are listed rather than forced into the college table as
three rows of dashes across every credit column, which would also have dragged
them into the credit totals, the district rollup and the eligibility counts.

**Next: Sam moves the dials.** The threshold, floor and ceiling are all live, and
the box reports what each one did.

## 2026-08-23 — Sam moved the dials, and every remaining defect fell out of it

He set the credit floor to **$150,000** and the noncredit floor to **$50,000**
"just to see how it would play out", and reported that *"the changes didn't
propagate and recalculate"*. The tab had recalculated — the figures in his
screenshot (49 topped up, 6 held, $275,852 released) are exactly what the engine
computes at $150K. But the report was right anyway, because **three surfaces
were lying, each in a different way**, and the dial change is what exposed them.

### ⚠️ A floor the pool cannot honor reported itself as honored

33 institutions × $50,000 is **$1,650,000** against a **$1,000,000** pool. The
solver's degenerate branch splits the pool pro rata and marks every row
`floored` — so `floorCount` counted all 33 and the box read **"33 at the
minimum"** while every institution actually received **$30,303, 61% of the
stated minimum**.

⭐ **Silently paying less than the number printed on the dial is the worst state
this model has**, and it was the only state with no warning: the ceiling's
mirror case (a pool too small to spend) has had one since the ceiling shipped.
`solveBounded()` now returns `floorInfeasible` + `floorDemanded`, and both boxes
**replace** their floor note rather than appending to it — the count is not
merely incomplete there, it is false. The noncredit box also drops "growth
starts paying above N FTES", which describes a proportional mechanism that is
not running when every row is pinned. Latent in the credit lane too: 115 × any
floor above ~$210,785 trips it.

### ⚠️ The explainer had not moved at all, and could not

It was a Claude artifact, rebuilt by a Node script and republished by hand, on a
host that blocks the outbound call it would need to read the config. Sam: *"Yes,
move explainer to Pages"*. It is now `funding-model/index.html` served from the
same Pages site, loading `cpl_funding.js`, calling `ensureLoaded()`, subscribing
to `onModelChange()` and painting from the engine — the pattern My College
already used.

⭐ **Computing a figure correctly once is not the same as the figure being
correct.** Both were true of the snapshot; only the second matters to a reader.
Durable: [`a-snapshot-of-a-live-model-is-a-claim-that-decays`](kb-notes/methodology-a-snapshot-of-a-live-model-is-a-claim-that-decays.md).

⚠️ **One payload builder, two callers.** `funding_model_payload.js` is shared
with the Node snapshot script (kept only for a frozen emailable copy). Two
builders would drift invisibly — this is the same file that shipped a hand-typed
`$5,060` and "four noncredit campuses". The extraction was verified
byte-identical.

⚠️ **A painter written for a page that runs once will accumulate.** Sam caught
the worked-example cards rendering **three times**: the live page repaints on
every model change and three containers appended another copy each time. Every
container the painter appends into is now emptied first — and the test that
should have caught it had asserted on `#tbody`, **the one container whose own
`draw()` clears it**. Asserting on the part that cannot fail is not a guard.

### ⚠️ "held $X" on all 115 rows, months before anyone was late

Sam: *"a little worried about the message we're sending with the Held label — not
sure we need it."* The label existed for a good reason (it replaced a bare `$0
earned`, which falsely said the college had posted no CPL — his own 2026-07-30
ruling). What changed is that **every** college is gated until the participation
deadline, so 115 rows of "held $132,000" read as the state withholding from the
whole system when the requirement is not yet due.

Now phase-dependent: before the deadline the row says **"opt in to start
earning"** and names no figure; after it, the figure returns, because then it is
true. A failed clock read defaults to the softer wording — a clock error must
never accuse 115 colleges.

### ⭐ The parity figure he asked for exposed a third defect

Sam kept the carve-out at $1M — *"I can adjust it up for parity later, so glad to
have that 7.1% number at the ready"* — and asked for it on the tab. Building it
surfaced that the **"CCC total" card counted only the standalone roster**
(24,995 FTES) as the whole of noncredit, missing **56,993 FTES** carried on 108
college rows. That is the exact card a reader would use to judge whether $1M is
a fair noncredit share.

| | |
|---|---|
| noncredit share of teaching | **7.1%** (81,988 FTES against 1,069,182 credit) |
| noncredit share of money | **4.0%** ($1,000,000 of $25,240,308) |
| parity would be | **$1,797,660** — $797,660 above the carve-out |

Also settled: the $1M carve-out is **not** redundant with the three NC dials.
They share the money; it decides how much there is, and it is the boundary that
keeps "$24,240,308 to colleges" a fixed number that ties to the amendment.

### ⚠️ Two verification failures, and they cost a red main

Recorded because they were expensive and repeated, not because they were novel.

1. **Merged twice on the required check** while the non-required suite covering
   the exact changed files was still running. The repo rule permits merging on
   `unstable`; it assumes the pending check is not the one carrying your risk.
2. **Verified locally with a subset I chose.** Both files that broke were outside
   it — and one held a **duplicate** of an assertion I had already fixed in a
   file I did run.
3. **Reported a "full suite pass" that was SIGTERM.** `REAL_EXIT=143`, killed by
   my own `pkill`; the "exit code 0" belonged to the wrapper. Same class as the
   `; echo "EXIT=$?"` trap written into the handoff that morning.

Durable: [`a-green-check-you-did-not-scope-is-not-evidence`](kb-notes/methodology-a-green-check-you-did-not-scope-is-not-evidence.md).

### Where this leaves it

Four PRs merged (#1302–#1305) plus the repaint/noncredit-section fix. The
explainer is live at `/funding-model/` and explains the noncredit lane from the
payload. **Open, both Sam's:** the noncredit floor (27 of 33 sit on $25,000;
$20,000 halves the break-even to 1,762 FTES) and whether $1M moves toward the
$1,797,660 parity figure.

## 2026-08-23 (Session 186, SkySew) — the tab was migrated, the document it exports was not

Sam: *"let's get the funding tab sewn up!"* Two items were listed as open, and
**`cpl_memory`'s read step closed one of them before any code was read**: he had
already ruled *keep the carve-out at $1M, raise toward parity later*
(`sam-keep-nc-carveout-at-1m-parity-later`, verified). Reading the live config
then closed it a second way — he had since set it to **$1,800,000**, essentially
the $1,797,660 parity figure, and moved the credit floor to **$150,000**. So the
tab was sitting in a configuration nobody had looked at.

### ⭐ The retired mechanism survived in the export

The noncredit lane stopped being a flat FTES split among the standalone campuses
on 2026-08-23 and became the bounded allocation over 33 institutions. The tab was
migrated. **`memoModel()` was not** — it still computed
`feederBasis(f) / Σ feederBasis * carve`. At Sam's live dials the exported memo
said:

| institution | the memo | the model |
|---|---|---|
| Mt. SAC Noncredit | **$779,862** | **$0** |
| SD Cont. Ed | $672,453 | $100,000 |
| North Orange | $275,671 | $50,000 |
| Calbright | $72,014 | $50,000 |
| the 30 colleges | *absent* | the remaining $1.6M |

Two independent defects. It paid the **entire** carve-out to four institutions,
so 30 colleges' noncredit money was missing from the one document that tells a
district what it is getting. And it paid **$779,862 to the deduped record** —
Mt. SAC Noncredit's FTES is already counted on the Mt. San Antonio credit row,
which is why `ncInstitutions()` zeroes it — re-introducing by re-derivation the
exact double payment [`a-deduplication-has-a-scope`](kb-notes/methodology-a-deduplication-has-a-scope.md)
was written to prevent.

⭐ **The tie-out is what let it survive.** Four campuses absorbing the whole
carve-out produced a table that added up, so the missing 30 colleges were
invisible: a total that balances reads as a total that is right.

⚠️ **The standing rule this repo already states for the credit lane — *never
re-derive an allocation, call the model* — had never been written down for the
noncredit lane**, and the surface where re-derivation is hardest to notice is the
one nobody reads beside the screen. Fixed by sourcing `ncModel()`, and the
district table gains **its own noncredit column** so it ties to the institution
total without folding noncredit into credit (Sam's "neglected step child" rule).

⚠️ **A district with no credit member printed `$0`.** Calbright's subtotal read
"$0" beside its real $50,000 of noncredit support. Not zero — not applicable.

### ⚠️ Two on-screen cards described a 33-institution lane by a 4-record roster

The pool card said the carve-out went *"to the 4 NC campuses below"* and the
table count line said *"plus 4 noncredit campuses (74,968 students)"*. Both used
`feeders().length`. The pool card is the one a reader uses to judge whether the
carve-out is proportionate — **the exact question Sam raised it to $1.8M to
answer**. The 74,968 was also the wrong *quantity*: a headcount the lane does not
allocate on, including the deduped campus's 35,363, so nearly half of it was an
institution paid $0.

### ⚠️ The opt-in prompt was bound to the size of the withheld figure

Sam: *"Why don't Cosumnes and Grossmont and others have the opt in to begin
earning note?"* The branch keyed on `held > 0.5`, so a college that is **gated
but has earned nothing** rendered no prompt at all — and `yearEarnParts()` two
functions below already named the case in a comment ("a gated college can also
have earned_total == 0"). That is the one cohort the prompt exists for: a college
showing nothing is exactly the one that has not started. Same silent-omission
class as the bare "$0 earned" this wording replaced. Now driven by the **gate**;
the dollar figure still appears only when there is one to hold, so nothing ever
reads "held $0".

⚠️ **This could not be reproduced offline** — the harness has no
coordinator/participation feed, so the gate reads PENDING and no row is blocked.
The assertion is on the function's contract instead. Worth naming: *the
instrument that renders the page cannot always reach the state being reported.*

### ⭐ A hand-maintained lint is the thing that goes stale

Three of the explainer's four mentions of the carve-out repainted to $1.8M. The
fourth — the every-college lead-in — was a bare `<b class="num">$1,000,000</b>`
with **no id**, so nothing painted it and the existing defaults lint, a
hand-maintained `BOUND` map, could not see it. **Three agreeing and one not is
worse than four wrong**: the odd one reads as a considered exception. Fixed in
both the live page and the frozen snapshot, and both now carry a *structural*
check — a literal currency figure in the prose must carry an id — which needs no
one to remember to extend a list.

### Also shipped

- **The priority columns carry their names** (`P1 Access`, centered) — Sam asked;
  the ordinal alone made a reader hover to learn what the column was. ⚠️ The title
  is optional by construction: `yearPriorities` is a **sparse overlay** and one
  slot carries no title. A first test "proving" the fallback **failed, and the
  code was right** — `prioTitle()` falls back to `DEFAULT_PRIORITY_TITLES`, so an
  empty title is not reachable through config today. The test now asserts what is
  actually true rather than staging a path it cannot reach.
- **The noncredit calculation is in "How an allocation is computed"** — the
  section a reader opens to check the arithmetic described only the credit pool.
  Every figure from `ncModel()`; and when the minimum is infeasible it says so
  **there too**, replacing (not annotating) the bounds and break-even sentences,
  because at that point neither is true.

### Where this leaves it

⚠️ **At Sam's live dials the noncredit lane is *more* floor-bound than the
settings it replaced**: **30 of 33** sit at the minimum (was 27) and growth does
not start paying until **3,909 FTES** (was 3,022). Raising the floor to $50,000
and the pool to $1.8M together moved the incentive further toward entry, which is
the opposite of his stated reason for the lane. **That is the decision still
open**, and it is his.

⚠️ **`CLAUDE.md` §11 says "factors 1.0"; the live config carries `factor: 0.5` on
all three priorities.** Corrected at this checkpoint.

⚠️ **A `cpl_memory` row is stale**: `p3-portal-routing-is-standard-practice`
(2026-08-11, Sam) says Priority 3 pays on portal/landing-page arrivals. The live
config now measures P1 = *applied units by origin*, P2 = *eligible units*,
P3 = *transcribed units*. Same author, later statement — flagged rather than
silently superseded, per Rule 8.

## 2026-08-26 (Session 197, SkyVerdict) — the noncredit lane earns, and two ways a value can lie

Sam opened on the noncredit half of the model and ended up ruling on its shape.
The engineering that came out of it is small; the findings are not.

### ⭐ Sam's ruling: NC EARNS like credit

Offered allocated-and-displayed, display-first, or earned-now, he took **earned**:
the NC award becomes a **cap earned against three targets**, not a presentational
split of an FTES clamp. His reason is the whole workstream in one line — a fixed
handout is what makes noncredit the stepchild.

His three metrics mirror the credit three with an origin filter:
P1 Applied · P2 Eligible · P3 Transcribed, for students originating from NC.
That ordering already matches the live display order (`priorityOrder [2,0,1]`).

⭐ **He corrected my objection and was right.** I argued noncredit has no units,
so the FTES conversion would not transfer. It does — the lane measures **credit**
CPL FTES for NC-origin students. NC is a filter on the population, not a change
of currency, so `unitsPerCplFtes` is unchanged and the units are already in the
data we hold. Only the origin marker is missing.

### ⭐ Route, don't split — and the reason is in the model already

Sam raised double-dipping himself, and proposed either deducting NC FTES from the
credit total or splitting each unit. The mechanics answer it:

`prioEntitlement = sizePct × netCollege × share ÷ nYears` — **share splits the
MONEY**. Each priority then reads its **own** `meas.src`. So eligible / applied /
transcribed are three *milestones on one credit*, and **the model already counts
the same FTES three times by design**. Within-lane repetition is the funnel, not
a leak.

Which makes the real rule narrow: same unit + different milestone → count it;
same unit + **same** milestone + two lanes → a true duplicate. So **route by
origin** rather than splitting — no ratio to defend, and no subtraction ever
appears on a college's row. Deducting from the credit total would make a college's
credit earning fall when it reports noncredit work, which is a reporting
disincentive aimed at exactly the colleges you want doing it.

⚠️ **The credit lane is already inviting noncredit in.** Year‑1 P3's own strategy
list says *"Include AP, IB, CLEP, High School articulated credit by exam,
**noncredit mirror courses**, basic training credit…"*. Today that is not a double
dip — it is a **single dip in the wrong lane**. One line to remove when NC goes
live.

⚠️ **Leakage is fine and points the safe way.** An NC student who uses the credit
landing page is counted once, in the credit lane, so leakage **undercounts NC**
rather than double-paying. Sam's read: that is the incentive for NC programs to
route students through their own landing page. Consequence to hold: NC will be
biased low during the ramp, which is an argument for keeping the floor.

### ⚠️ The build is blocked on something found before writing any of it

`measurability()` resolves a metric to its data source by **substring-matching
the metric's prose**. All three NC metrics match the **credit** sources; one
naming the NC landing page matches `pp_u` (portal-origin transcribed) **first**.
So the NC lane would be silently measured against credit performance — real
numbers, plausible percentages, nothing on screen saying so.

This invalidates the argument that made "build it now" safe (unmeasurable → gap →
full-cap advance). **Build order is therefore: explicit per-priority `src` →
NC priorities earn → display.** Note
[`methodology-a-metric-matched-by-its-prose-mis-measures-once-a-second-lane-exists`](kb-notes/methodology-a-metric-matched-by-its-prose-mis-measures-once-a-second-lane-exists.md).

### ⚠️ "Never rely on the config" — and the harness that answers it

I read `yearPriorities["2"].factor = 1` from the **live** Supabase config and told
Sam credit runs 1.0 in Year 2. It runs **0.5**: `mirrorYears` makes `prioSlot()`
return `"1"` for every year, so the stored Year‑2 block is unreachable. Front-load
makes it moot a second time (carryover, zero cap).

⭐ **A missing value sends you looking; a dormant one does not.** Shipped
`_effective()` + `scripts/funding_effective.js` (#1359), which **refuses to run
without a config** and flags each year MIRRORED / CARRYOVER. Verified against
independently-recorded figures — 30 of 33 at the NC floor, break-even 3,909,
$25,240,308 to institutions. ⚠️ Its own test caught the same bug *inside the fix*:
`_effective()` read a `ncModel()` memoised at boot, so a caller setting a config
afterwards got BAKED numbers reported as "effective".
[`methodology-a-saved-setting-is-not-the-effective-value`](kb-notes/methodology-a-saved-setting-is-not-the-effective-value.md).

### The NC floor sweep, for the decision still open

Model re-solved at each floor (`--nc-sweep`), pool $1.8M, threshold 500 FTES:

| floor | in lane | at floor | at cap | break-even FTES |
|---|---|---|---|---|
| $15,000 | 33 | 0 | 9 | 384 |
| $25,000 | 33 | 6 | 9 | 654 |
| $40,000 | 33 | 21 | 5 | 1,528 |
| **$50,000 (live)** | 33 | **30** | 2 | **3,909** |
| $60,000 | 33 | 33 | 0 | — **INFEASIBLE** |

⚠️ **Dropping the threshold does not work at this pool.** Noncredit is **8.74%**
of system teaching (102,427 NC FTES vs 1,069,182 credit) against **7.13%** of the
money, so parity is ~**$2.21M** — up $406k, not a step change. Across all 111
institutions that buys a **$16,216** floor ($19,873 at parity), and the median
institution in that lane has **226** noncredit FTES. The threshold is what buys
the floor its size: a meaningful floor for a few, or a token for everyone.

---

## 2026-08-27 — Session 199 (SkyPin): build step 1, and the column was in the wrong database

### ⭐ The defect is three times worse than it was recorded, and invisible by construction

Session 197 recorded that `measurability()` mis-resolves Sam's noncredit metrics —
"all three match the credit sources, and one naming the NC landing page matches
`pp_u` first". Reproduced against the real predicates before touching anything,
in his own idiom:

```
pp_u  <-  Eligible CPL Units as FTES ... Noncredit Landing Page
pp_u  <-  Applied CPL Units as FTES ... Noncredit Landing Page
pp_u  <-  Transcribed CPL Units as FTES ... Noncredit Landing Page
```

**All three collapse onto one source.** The portal/landing-page entry sits FIRST
among the unit measures, so it wins before `eligible` / `applied` / `transcribed`
is ever consulted. The eligible → applied → transcribed **milestone structure —
the entire reason the lane gets three priorities — silently becomes one number**,
and that number is the credit lane's portal traffic.

⚠️ **And the wrong number is indistinguishable from the right one.** Statewide
`pp_u` is **25.0 units carried by 3 of 105 colleges**, so 102 colleges would
render **0** — exactly the honest zero Sam asked the NC lane to show while the
origination field is undelivered. There is no screen you could look at to catch
this. It is precisely the case his draft-model ruling excludes: *"values calculate
correctly based on the available data"* permits an absent number, never a
plausible wrong one.

The demonstration that made it concrete — same metric prose in all three slots,
only the pin differing:

| slot | pin | renders |
|---|---|---|
| P1 | `pa_u` | Now **400 FTES** · $26.3K · 100% |
| P2 | *(none — falls to prose)* | Now 0 FTES · **$389** · 1.06% |
| P3 | `nope_u` | **not wired** · $0 |

One config field; a 4,000× difference in what the college is judged on; **neither
cell looks broken.**

### ⚠️ The handoff put the NULL column in the wrong database

Sam's mechanism is right and is the good one — declare the field now, all empty,
calculate off it, so nothing is synthetic, nothing has to be removed later, the
cutover is zero-change, and *the disclosure becomes derivable rather than
maintained*. The **location** was wrong.

The handoff said to add `nc_origin_loc_id` to Supabase `map_student_credit` and
`map_college_cr_unit`. **The funding model never reads either.** `perf()` is
`window.CPL_FUNDING_PERF` — a static artifact built by
`funding/_build_funding_performance.py` from the daily MAP pull. `cpl_funding.js`
touches Supabase only for the config and the opt-in. A NULL column in those two
tables would have wired **nothing** in this lane, and the first sign would have
been an NC row reading $0 for a reason nobody could find.

⭐ **So the funding lane's equivalent of his NULL column is a DECLARED SOURCE THE
FEED DOES NOT CARRY YET** — `nc_pe_u` / `nc_pa_u` / `nc_pt_u`, registered in
`METRIC_SOURCES`, emitted by nothing. Every property he wanted survives the move:
nothing synthetic, nothing to remove, zero-change cutover the day the builder can
compute them, and `srcDelivered()` **asks the published artifact** whether the key
is present rather than reading a flag somebody has to keep true.

(The Supabase column is still worth having for student-grain analysis. It is a
different consumer, and it is not this.)

### What shipped

`metric_src` — an explicit per-priority pin that overrides the prose, riding
`prioField()` so it layers scenario → shared → baked like every other field.

- ⚠️ **It is deliberately not free text.** An unrecognised key would read
  `rec[src] == null`, fall through to status `none`, and render as *"this college
  posted nothing"* — a typo silently zeroing a lane and **looking like a
  measurement**. Every legal key is declared with its unit; an unknown one becomes
  a loud `bad_src`.
- ⚠️ **A miswired pin must never ADVANCE.** Without its own branch, `bad_src` fell
  into the data-gap branch and paid **every college its full cap** — one typo in
  one config field disbursing a whole priority. The gap branch is for a metric
  *nobody* can measure, which is a statement about the world; a bad pin is a
  statement about our own config, and the safe reading of "we do not know what
  this measures" is **$0, loudly**, not everything, silently.
- ⭐ **`undelivered` is a LABEL, not a third earn state.** The fraction is 0,
  identical to `none` — Sam's ruling exactly. It is separated because *"the feed
  carries no such measure"* and *"this college posted nothing"* are two different
  zeros, and this repo has kept absent / withheld / measured apart for a year.
- ⚠️ **Four surfaces each tested `status === "gap" || status === "pending"`
  inline**, so every new status had to be remembered in four places or it rendered
  as a measured zero. Now one `earnIsMeasured()`.

### ⚠️ Two of my own guards were inert, and only mutation showed it

Written, green, and **proven worthless**:

- `earnIsMeasured()` forced to `return true` — the CSV/sort assertions **still
  passed**, because they read the *source text* rather than exercising the CSV.
- `prioUnit()`'s registry lookup blanked — the unit assertion **still passed**,
  because its own fixture's prose (*"…Units as FTES…"*) already sniffed to units,
  so the pin was never the thing under test.

Both replaced with behavioral checks (a real `_csv()` round trip; a metric whose
prose says **Headcount** pinned to a unit source, so the pin is the only thing
that can produce FTES). **Seven mutations, all now caught.** Same lesson as
#1361's reversed `check()` arguments, one session later: *a guard that has never
been made to fail is not yet a guard.*

### ⛔ THE SAME DEFECT IS ALREADY LIVE ON THE CREDIT LANE, ON THE BIGGEST PRIORITY

Looking up the live Supabase config to build a faithful mock turned the
hypothetical into a present-tense one. Sam's **Year-1 Access** metric reads:

> *"**Applied** units measured in FTES for students originating from either CPL
> Portal, College CPL Landing Page, **or batch upload**"*

It resolves to **`pp_u`** — portal-origin **transcribed** units. Two disagreements
at once, and neither is visible on the tab:

1. **Wrong rung.** He asks for APPLIED; `pp_u` returns TRANSCRIBED. Statewide these
   are 223,384 and 80,338 units — not interchangeable.
2. **Wrong origin scope.** He names three origins *including batch upload*; `pp_u`
   is `Potential Student = Yes` only, which excludes batch upload entirely.

⚠️ **Measured against the published artifact: all 115 colleges read exactly
`0 FTES` on it.** `pp_u` is 25.0 units across 3 colleges, and 25 ÷ 30 rounds to 0.
Access carries **share 0.34 — the largest of the three** — and under front-load
Year 1 carries the whole window. **So the tab's largest earning line reads $0
system-wide, for a reason nothing on screen states.**

⭐ **And note which way the error runs.** Had the metric been read as a genuine
data gap it would have *advanced the full cap*; instead it resolves to a real key
and pays $0. The mis-resolution flipped roughly a third of the pool from
"advances" to "earns nothing" — silently, in the direction nobody audits, because
a low number on a new program looks like the program being new.

**The fix is Sam's call, not ours** — pin it to `pa_u` (right rung, no origin
filter), or accept it as a data gap that advances, or accept `pp_u` deliberately.
All three are now one config field. What shipped instead is the thing that makes
the disagreement impossible to miss: a **MILESTONE-agreement check** in the
curator diagnostic, the second axis beside the UNIT-agreement check that has been
there since 2026-07-31. It reads `⚠ MILESTONE MISMATCH — this metric asks for
APPLIED CPL but pp_u returns transcribed`, fires on that slot in both years, and
leaves the four honest priorities a clean ✔.

⭐ **The generalizable half:** the funnel has three rungs and the tab had a guard
for the *unit* axis and none for the *rung* axis. When a matcher can be wrong
along more than one dimension, a guard on one dimension reads as coverage.

### Still open, and needing Sam

- ⛔ **The live Access metric** (above) — pin, gap, or accept. It is the largest
  share and currently earns $0 for every college.
- **Row shape** — a second table row per college, or extra lines inside each
  P1/P2/P3 cell. A mock, not a guess.
- **Shares for the NC three.** Nothing ruled. Inheriting credit's 34/33/33 is the
  obvious default and keeps one number to change, but he has not said so.

Neither blocks anything else; both block step 2.

---

## 2026-08-27 (later) — Sam corrects the Access fix, and `pa` turns out to be the wrong half

### ⛔ I offered three options and my numbers for the recommended one were measured on the wrong population

I put the live Access defect to Sam as pin `pa_u` / declare a gap / accept, with
measured payouts (51 colleges full, 115 full, 112 zero). He answered with the
fact that made option 1 both right and wrong:

> *"Option 1 is correct but we need to read the **Potential Student**, which
> returns either 'Yes' or 'No' and is our temporary field indicating it was
> submitted from a landing page or the portal."*

⭐ **THE ORIGIN FILTER ALREADY EXISTS.** The metric's *"originating from either
CPL Portal, College CPL Landing Page, or batch upload"* was never unmeasurable —
`Potential Student` has been in the pull since the beginning and the builder has
read it since 2026-07-27.

⚠️ **AND `pa` IS NOT THE SUPERSET OF WHAT HE WANTS — IT IS THE COMPLEMENT.**
Every other metric in `_build_funding_performance.py` carries `and not
is_potential`:

```
("pe",  ecr > 0 and not is_potential),
("pa",  acr > 0 and not is_potential),
("p3",  tcr > 0 and not is_potential),
("p2",  tcr >= P2_MIN_UNITS and not is_potential),
("pp",  tcr > 0 and     is_potential),      # the ONLY portal measure — transcribed
```

So `pe/pa/p2/p3` describe the **documented** cohort and deliberately **exclude**
portal-origin students, and `pp` — the only measure of that population — is gated
on **transcribed**. There was no applied-among-portal-origin figure at all.
**Pinning Access to `pa_u` would have scored it on precisely the students the
metric's own wording excludes**, and my "51 colleges earn full" was that wrong
population's number.

⭐ **The general shape, and it is the same one as the milestone finding one step
earlier:** a matcher can be wrong along more than one axis. I had just added a
guard for the *rung* (eligible/applied/transcribed) and was still reasoning about
the *cohort* by assumption. Two axes were checked; the third was not even named.

### What shipped

`ppa` / `ppa_u` — applied units among `Potential Student = Yes` — the mirror of
`pa` on the other side of the partition, same rung, opposite cohort. Registered
as `ppa_u` and **pinned on the Access priority in the LIVE Supabase config** —
surgically, with `jsonb_set` on the one path, so a concurrent edit by Sam to any
other field survives. Shares, factors, `priorityOrder` and the NC floor were
re-read after the write and are unchanged.

⚠️ **THE PIN DOES NOT BELONG IN THE BAKE, and trying to put it there is what
proved it.** `cpl_funding_data.js` is stale *by design*: its slot-2 metric is the
old *"Headcount … transcribed Credit from either CPL Student Portal or CPL Landing
Page"* while the live config's slot 2 is Sam's **applied/units** one. A pin lands
on whichever metric occupies the slot, so pinning `ppa_u` in the bake attached a
units/applied key to a headcount/transcribed metric — **nine assertions across
three suites went red**, correctly. The layering makes a baked value a *shared
default*, not a private one. A pin belongs with the metric it was chosen for.

⭐ **And the attempt exposed a real gap: a pin could not be CLEARED.**
`firstDefined()` skips null and undefined, so an override layer could ADD a pin
but never REMOVE one — a curator could not un-pin on the tab, and a lower layer's
pin would have been permanent. `metric_src: ""` is now the un-pin.

⭐ **The pin is safe to land BEFORE the data.** `ppa_u` is emitted by the builder
but the published artifact predates it, so today every college reads
**`Now: $0 · no feed`** — the `undelivered` state, an absent measure rather than a
wrong one — and starts earning with **no code change** the moment the cron
regenerates the artifact. Verified both ways.

⚠️ **`ppa` joins `pp` in `NO_SUPPRESS`, and that is a funding decision as much as
a privacy one.** It describes the *same people* as `pp` at a different rung, so
suppressing it hides nothing already visible — while a suppressed cell reads to
`earnFraction()` as *"not yet credited"*, `f=0`, which would cost small-portal
colleges their Access money outright.

⏭ **What replaces it** (Sam): MAP is shipping an explicit `Origin` — Student
Portal / Landing Page / Batch / College Entered — plus a **`LocID2`** naming the
noncredit location a record came from. Then `ppa_u` narrows from "Yes" to the
named origins, and the three `nc_*` measures become the same rung cut by LocID2.
One builder change, no consumer change, because the pin already names the key.
His example row:

| LocID | College | Origin | LocID2 |
|---|---|---|---|
| 1 | Mt SAC | Landing Page | 1x [Mt SAC NC] |

⚠️ **His noncredit rule, recorded before it can be built:** *"all three count the
NC FTES only if they have a Yes."* The Yes-gate applies to the NC three as well —
but NC records cannot be isolated until `LocID2` arrives, which is exactly why
the `nc_*` sources stay declared-and-undelivered rather than being approximated.

### ⚠️ My own test failed because I fixed what it was asserting

Section 7 asserted the live Access metric mis-resolves and the diagnostic flags
it. The baked pin made all four of those false. **That is the guard behaving
correctly** — a premise changed and something said so. It now asserts *both*
halves: the defect still reproduces on an **unpinned** slot (so the guard keeps
its teeth), and the pinned slot is clean. Five mutations, all caught, including
`ppa` gated on the wrong cohort and `ppa` summing the wrong column.

### ⚠️ Postscript: my own guard was pinned to a value that then left the data

Section 7c asserted *"every pinned Access cell reads `no feed`"*. True when
written — `ppa_u` was declared and undelivered. The cron regenerated the artifact
a few hours later, `ppa_u` arrived (**108 students / 661.5 units / 52 of 105
colleges**), and the assertion went **red on the feature working exactly as
designed**.

⭐ **The repo has recorded this shape before** (mode 14, the EACR column axis, the
Sierra prose grep red since Session 125): *an assertion pinned to a value that can
leave the data stops being a guard the moment it does.* I wrote a fresh one
anyway, the same day I wrote a note about defects that hide behind expected
values.

Rewritten as the **invariant**, which cannot expire: the pinned column resolves
somewhere other than the prose matcher does, and is never the unpinned column's
universal zero. Whether the source is delivered yet is sections 3e and 8's job —
they use fixtures they control, which is where a transient state belongs.
Mutation-checked after the rewrite: blanking the pin still fails it (34/43).

**End state of the Access fix, measured on the live artifact:** 115 colleges at
`no feed` → **0**; earning → **12**; `MILESTONE MISMATCH` → cleared. The 103
measured zeros are now genuine — those colleges have no applied credit from
portal-origin students yet, which is the incentive, not a defect.

---

## 2026-08-27 (Session 200, SkyLane) — the noncredit lane earns, and the trap ran the other way

Sam ruled the last open dial in one line — **NC inherits credit's shares,
34/33/33** — and build step 2 landed: the noncredit lane now EARNS against its
own three measures, and the Option A row renders under every college that has a
noncredit program.

### The shape of the build

The lane needed exactly one new idea and no new plumbing. `prioTarget()` already
computes *pot ÷ price*; what changed is **which pot**:

```js
function prioEntitlement(c, p) {
  if (p && p.lane === "nc") return ncPrioEntitlement(c, p);   // route, don't split
  return (c ? sizePct(c) * capScale(c) : 1) * netCollege() * p.share / nYears();
}
```

That is Sam's *"route, don't split"* made structural: a priority belongs to one
lane and is measured against that lane's pot; `share` splits the MONEY inside the
lane, never the FTES. Everything downstream — the clamp, the earning ladder, the
front-load carryover states, the floor/ceiling asymmetry — is reused unchanged.

`ncPriorities(slot)` is credit's three, re-pointed. Titles, descriptions,
strategies, shares and the funding factor are **inherited** (Sam: "the same three
priorities", "no discount for being the newer lane"), with an `ncPriorities`
override layer resolving scenario → shared → baked so diverging any of them later
is one field rather than a refactor.

### ⭐ The prose trap, running in the opposite direction

#1364 fixed a CREDIT metric that prose-matched its way onto the wrong measure.
This lane is the mirror, and it is worse: **the NC priorities inherit credit's
wording by construction.** An unpinned NC priority does not fail to resolve — it
resolves confidently onto a CREDIT source and scores noncredit money on credit
performance. Every figure would be non-zero, in range, and wrong.

So `ncPriorities()` **always** emits a `metric_src`, mapped by MILESTONE out of
`METRIC_SOURCES` itself rather than written down a second time, and a milestone
with no noncredit counterpart gets a deliberately-unknown key so it lands in the
loud `bad_src` branch — $0, named on the cell — instead of falling through to the
prose. There is no unpinned path in this lane by construction, not by discipline.

⚠️ **And the coupling runs both ways.** Because the NC rung is taken from how the
CREDIT priority resolved, a mis-resolved credit metric hands its error straight to
noncredit. `F9`/`F10` pin this: un-pin the credit Access metric and its noncredit
counterpart follows it onto the transcribed rung, collapsing two NC priorities
onto one source. **Sam's `ppa_u` pin is now load-bearing for both lanes.**

### ⚠️ Three ways this build could have quietly disbursed the carve-out

1. **The advance.** `earnFraction()` pays the FULL CAP when the perf artifact has
   not loaded — a sensible transient for credit, and catastrophic here: Sam ruled
   NC shows $0, never an advance. That branch fires *before* `srcDelivered()` can
   be asked anything, so without a lane test a slow artifact load (or any harness
   without one) disburses the whole **$1.8M**. Lane-guarded now.
2. **The share sum.** `prioCap()` normalizes by the CREDIT share sum. Identical
   today, because Sam set NC's shares to credit's — and silently wrong the moment
   he moves one. `ncShareSum`/`ncSlotEntitlement`/`ncPrioCap` exist for exactly
   that day. ⚠️ Measured while writing the guard: **a share set is a MULTIPLIER on
   the pot, not a normalizer** — shares summing to 1.30 place 1.30 × W, in credit
   too. My first assertion encoded an invariant the credit lane does not have.
3. **The wrong floor in the hover.** Reusing `prioCellHtml()` wholesale would have
   printed the **$150,000 credit floor** on a row held by the **$50,000 noncredit**
   one — a real dollar figure, in the right place, describing the wrong dial. The
   NC cell is its own function for this reason.

### ⚠️ `fmtCountK` misstates a noncredit target — found in Chromium, not jsdom

The row was structurally perfect and the numbers were wrong. Credit targets are in
the hundreds or thousands, so the compact formatter rounds to a whole number
harmlessly. **Noncredit targets are order 1–25 CPL FTES**, where `1.4` paints
`"1"` (−29%) and anything under 0.5 paints **`"0"`** — an absent-looking zero, on
the one lane whose honest zeros are the entire point of the design.

Nine jsdom assertions about that cell passed. It took a screenshot to see it.
`fmtFtesSmall()` keeps one decimal below 100 and defers to the shared compaction
above it. ⚠️ **The credit lane has the same latent case** — a small college's
FTES-denominated credit target can also fall under 100 — left alone deliberately
rather than widened into a live tab mid-build.

### Measured on the LIVE config, not the bake

Sam, mid-build: *"The config is likely old news. Check the tab for current numbers
and metrics."* He was right to say it — every block of the new suite runs on the
BAKED defaults, which differ from live on **all four** properties that matter
here: shares, factor, `mirrorYears`, and (decisively) the bake has **two
priorities on the transcribed rung**, so it cannot exercise the three-distinct-
sources mapping at all.

Dumped live via MCP, verified **byte-identical** (`md5 23531c14…`, 8,607 chars —
not hand-checked, compared against `md5(config::text)` in Postgres), and run
through `_effective()`:

| | live |
|---|---|
| NC carve-out | **$1,800,000** |
| entry threshold | 500 FTES → **33 institutions** |
| NC floor / cap | **$50,000 / $100,000** |
| at floor / at cap | **30 / 2** |
| NC sources | three DISTINCT (`nc_pe_u` · `nc_pa_u` · `nc_pt_u`) |
| earned across all 33 | **$0** |

⭐ **30 of 33 sit at the floor and 2 at the cap — exactly ONE institution is
earning proportionally.** `ncModel().breakEven` already said so (3,909 FTES);
seeing it as 30/33 makes the point sharper. As an incentive the lane is currently
almost entirely a grant, and that is a dial question for Sam, not a defect.

⚠️ A live-shaped FIXTURE went into the suite, never the live config — a test
carrying today's shares goes red the next time Sam edits one, which is how a
guard becomes a chore and then a deletion. It reproduces the four structural
properties and pins no dial.

### Verification

`tests/cpl_funding_nc_lane.test.js` — **48 assertions**, six blocks. Five
mutations run, all caught: dropping the pin (7 fail), routing the entitlement at
the credit pool (4), letting the not-loaded branch advance NC (3), normalizing on
the credit share sum (3), reverting the target precision (1).

`scripts/check_funding_nc_row_layout.js` — **9 Chromium checks** for the four
claims jsdom structurally cannot make: the row does not widen the table, every
cell lines up under its credit counterpart, the CR/NC chips are painted words at
a readable size, and the body never scrolls sideways at 390px.

⚠️ **Do not mutate a source file while a full-suite background run is in flight** —
I invalidated a 15-minute run that way, then compounded it with a `git checkout --`
in the restore step that wiped the file. A copy taken before the first mutation is
what saved it.

### Next

1. **Sam looks at the row** — density and the tint are his calls.
2. The credit-lane variant of the rounding (a small college's FTES target).
3. **NC's own strategy text.** Year-1 P-Success still lists *"noncredit mirror
   courses"* among CREDIT strategies (the carryover from Session 199). The NC
   priorities inherit credit's strategies today; moving that line is a change to
   curator-authored text in the live config, so it is Sam's, not a session's.

## 2026-08-27 (later, Session 200) — twelve tweaks, and the two guards I broke without noticing

The NC lane merged as **#1367** after Sam drove the row through roughly a dozen
visual passes in one sitting. The build lessons are in the section above; these
are the ones the *iteration* produced.

### ⭐ Sam arrived at the grouping problem from the other end

I had rendered three options for his "gray underline below the CR row" and
recommended the opposite — heavier rules BETWEEN institutions, lighter WITHIN
the pair — because underlining inside the pair makes a noncredit row read as a
separate college. He accepted that, then found the same defect independently
from the zebra striping:

> *"rather than alternating gray/white rows, which makes them look like
> different colleges, would be better to alternate between colleges and keep the
> CR and NC same background."*

`tr:nth-child(even)` is **row** parity. The moment a college can occupy two
rows, its credit row and its noncredit row land on opposite stripes. Two
independent routes to one conclusion is the strongest signal a design has that
it is right; the stripe is now emitted per COLLEGE and carried by every row of
that college's block, so it survives a future third row.

### ⚠️ I broke two suites I never ran, twice, the same way

`cpl_funding_metric_pin` (9 of 43) and `cpl_funding_basis` (1 of 37). Neither
failure was about what the suite tests:

- metric_pin indexed priority cells off the row's `<td>` list — `cells[4]`,
  `[5]`, `[6]` — and matched on the inline `"Now"` label. A **TGT/NOW label
  column** shifted every index by one and removed the label.
- basis asserted `/Credit FTES/` against the whole `<thead>`. Sam **renamed the
  header**, which changed nothing about the allocation basis that assertion
  exists to protect.

**Both times I ran the suites my change was ABOUT rather than the ones it could
REACH.** CI found one; the merge conflict made me re-run and find the other. The
rule is not "run everything" (30+ minutes) — it is that a *layout* change reaches
every suite that locates an element, and a *wording* change reaches every suite
that matches a string.

Both are now written against the CONTRACT: `td.cf-prio` in document order IS
P1/P2/P3, `.cf-t`/`.cf-a` ARE the target and actual lines, and the size column
NAMES THE BASIS IN FORCE rather than saying one particular phrase. ⚠️ basis's
paired assertion had also gone **vacuous** — "the header does NOT say Credit
FTES" became trivially true once nothing said it anywhere; it now asserts the
positive and the negative on the same scoped element.

### ⛔ The threshold cannot go below 400, and that is a finding about the FLOOR

Sam asked whether to show all noncredit rows because *"I may adjust the minimum
500 threshold"*. Building that surfaced the constraint behind his question.
Swept through the model (not re-derived):

| threshold | in lane | floor demanded | vs $1.8M |
|---|---|---|---|
| 500 | 33 | $1.65M | ok, 2 also capped |
| 450 | 34 | $1.70M | ok, ceiling stops binding |
| **400** | **35** | **$1.75M** | **last feasible step** |
| 350 | 38 | $1.90M | ✗ `floorInfeasible` |
| 200 | 58 | $2.90M | ✗ |
| 50 | 88 | $4.40M | ✗ |

**The threshold and the floor are one decision, not two.** Widening the lane
below 400 makes the $50k minimum unpayable, so the lever for a bigger lane is
the floor or the carve-out. Also: at 450 and below the $100k ceiling stops
binding entirely (capped 2 → 0), so it is inert the moment the lane widens.

### ⭐ Showing the 78 below-threshold colleges is a DIAL argument

While the table listed only qualifiers, moving the threshold changed **which
rows exist** — so the table could not show the consequence of the curator's own
edit; you had to already know who was missing to see who joined.
`ncInstitutions()` has returned the roster unfiltered since it was written, for
exactly this reason. The ROW layer simply never honored it.

⚠️ **A below-threshold row must not print $0.** "$0 earned" and "never eligible
to earn" are different facts. Em-dashes with the reason, plus a `below 500` chip
naming the gap — 476.7 short by 23 is a different story from 0.26, and both were
equally invisible before.

### ⚠️ "Opt in" was hiding a live typo, two layers down

Sam asked for wording that sounds less optional without a compliance tone.
"Confirm participation" — opt-in is mailing-list language presuming a default of
OUT, when nothing here turns on a choice, only on results.

Chasing the label found that **`partLabel` ends in the word "by" and two of its
three call sites appended their own**, so the eligibility hover and the
baseline-gate text had been rendering *"Opt-in participation **by by**
2026-11-01"*. The third site appended nothing — so the same label had to end in
"by" there and not end in "by" at the other two. **No single value satisfies
that**, which is why editing the text could never have fixed it.

⚠️ It is guarded through a **hook**, not the screen: both render surfaces need
live eligibility data (`baselineGate()` short-circuits to "pending" when the
coordinator feed has not loaded), so the join is unreachable from jsdom — which
is exactly why it shipped wrong and stayed wrong.

### Next

1. **The ⬆/⬇ glyph → the words `min`/`max`.** Sam asked what it meant, which is
   the finding: one mark doing two jobs ($150k credit floor on a credit row,
   $50k noncredit floor on an NC row), told apart only by hover, against his own
   standing preference for plain words over glyphs.
2. **His call on the threshold**, given it is really a floor decision.
3. The credit-lane variant of the `fmtCountK` rounding.
4. NC's own strategy text (Year-1 P-Success still lists "noncredit mirror
   courses" among CREDIT strategies).
