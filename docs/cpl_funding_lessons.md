---
title: CPL Implementation Funding tab — workstream lessons
created: 2026-06-11
updated: 2026-08-20
tags: [lessons, funding, implementation-funding, dashboard-tab, parallel-session]
artifacts:
  - CPL_Dashboard.html / index.html (tab shell — PR #352)
  - funding/CPL_Funding_Model_2026.xlsx (committed source workbook)
  - funding/_build_funding_data.py (one-shot extractor)
  - cpl_funding_data.js (static data artifact, window.CPL_FUNDING)
  - cpl_funding.js (renderer, window.CPL_FUNDING_TAB)
  - tests/cpl_funding.test.js
  - tests/cpl_funding_reorder.test.js
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

> **Earlier sections archived.** The 2026-06-11 → 2026-07-31 build-out — the tab
> itself, the Chancellor-facing 2-year rework, the equity refinements
> (front-load · floor · rural allowance · eligibility badges), the
> achievement-based cap-and-earn model, the $35M reframe, the Budget-tab ledger
> reconciliation and the move to credit FTES — moved verbatim to
> [`cpl_funding_lessons_archive.md`](cpl_funding_lessons_archive.md) on
> 2026-08-20 (the doc had crossed its size budget and this checkpoint needed to
> append). Those phases are shipped and settled; read the archive only for the
> reasoning behind a decision you are about to change.

## 2026-08-01 (SkyUnit) — the units answer, and the metric moves one rung down the funnel

Sam opened with two observations on the pool cards, both correct, and the second
one had a real defect under it: *"we should eliminate headcount from the model
altogether — the card that allocates $4.62 per student should be a per FTES
amount"*, and *"seems like we are miscalculating the P1,2,3 earned FTES, which
seem way too high. Also the tgt FTES seem way too low."*

Two PRs, both merged: **#964** (the units + the cards + Applied measurement) and
**#965** (the rate as a curator-editable variable).

### The defect — the summary surfaces disagreed with the detail by 30×

The per-college P-cells convert units → CPL FTES through `earnFraction`/`toActual`.
**Three summary surfaces did not**, and every one of them read as fact on the
live page:

| surface | rendered | should have read |
|---|---|---|
| priority card, actual | "Actual **1,354,527 students** — **193,700%** of target" | 45,150.9 CPL FTES — 6,456% |
| priority card, target | "$73.90 per student → **699 students** (0.028% of headcount)" | Target 699.3 **CPL FTES** (≈20,979 units) |
| college table, SYSTEM row | header *Credit FTES*, row beneath it **2,517,685** (a headcount) | 1,069,182 credit FTES |

This is the **fourth, fifth and sixth** instance of the same defect in this
workstream (#960/#961/#962 were one through three). They survived because the
tests asserted each side's *presence* — never the *relationship* between a
rendered number and its target's unit. The new assertions recompute "% of target"
from the card's own two numbers, so the surface has to be internally consistent
regardless of the data.

**The SYSTEM row was caught by rendering the page in real Chromium and reading the
column header next to its own total** — not by the suite, and not by reading the
diff. A total that isn't in the units of the column it tops is worse than no
total: it invites the reader to add up the column, and it will never reconcile.

Durable: [`methodology-a-summary-must-share-the-unit-of-its-detail`](kb-notes/methodology-a-summary-must-share-the-unit-of-its-detail.md).

### The cards — and the counterintuitive bit about the rate

Both hardcoded headcount, and the first still called headcount *"the allocation
basis"* months after the basis moved to credit FTES (#959) — asserting a false
thing on the live page. Both now follow the basis seam, and the feeder side
follows with them: credit FTES on the college side pairs with **noncredit FTES**
on the feeder side, never with feeder headcount.

The `$4.62` card is retired under FTES metrics in favour of the operative price —
**$5,649.63 per CPL FTES → 2,056.8 CPL FTES the tranche buys** (61,704 units,
$188.32/unit). Pool depth per credit FTES (**$10.87** — the literal swap Sam
asked for) rides as a *note*, because it is a scale statistic, not the rate the
model runs on.

**Three different "per something" numbers existed and only one belonged on that
card.** Worth writing down, because Sam's message reasonably conflated two of
them:

| quantity | value | what it is |
|---|---:|---|
| pool ÷ statewide headcount | $4.62 | the retired card |
| pool ÷ statewide credit FTES | $10.87 | pool depth — a scale statistic |
| pool ÷ CPL FTES purchased | $5,649.63 | the price the model actually runs on |

And the bit that cuts against intuition, now test-locked: **raising the rate
LOWERS the target** (target = allocation ÷ rate). Sam thought the rate might be
~$8k; there is no $8k figure in the dataset (the only rate is $5,649.63, labelled
SCFF base), and moving to an all-in ~$8,071 would have taken the statewide target
from 2,057 → 1,440 CPL FTES — the wrong direction for his own complaint. **The
rate is not the lever on targets.** He settled on $5,649.63.

### P1 → Applied: our arithmetic was right, the source was inflated

I proposed dropping the eligible-units metric on the evidence that it does not
discriminate (98 of 102 colleges over target, median 42×, max 605×). Sam pushed
back on the *reasoning* and was right to: eligible units aren't free — they
require approved articulations and matching students — and he pointed at the real
cause. *"There will be another category of units called Applied, which is fewer
units because it doesn't double count eligible units like we sometimes do for
Marine Corps JSTs."*

Measurement then localised it precisely: the producer's own cross-check against
MAP's published per-college totals reads **1.0054** — we match the source to half
a percent. **The inflation is upstream** (ACE JST exhibits repeat a credit
recommendation under every skill level; `map_data_quality` `10ad9e0a`, and MAP's
parser can't easily fix it because skill levels aren't canonically ordered). So
the answer isn't a correction factor and isn't waiting on MAP — it's to **measure
one rung later in the funnel**, where the defect can't reach:

**eligible 1,354,527 → applied 242,559 (18%) → transcribed 103,139 (8%)**

`Applied Credits` was already in the same view we read, so the producer now emits
`pa`/`pa_u`. **P1 is not rewired yet** — the per-college Applied split isn't
visible from a sandbox without `MAP_API_KEY`, so the measurement ships first and
the policy call follows the numbers.

Durable: [`methodology-move-down-the-funnel-to-route-around-an-upstream-defect`](kb-notes/methodology-move-down-the-funnel-to-route-around-an-upstream-defect.md).

### The two guards that mattered more than the feature

1. **`pa` is OMITTED, never zeroed, when the pull lacks the column.**
   `earnFraction()` reads a present-but-zero cell as "feed published, this college
   posted nothing" and pays $0 — a column we never asked for would have zeroed out
   every college in the state. Absent keys are the honest shape for absent data.
   ([`methodology-omit-dont-zero-an-absent-measure`](kb-notes/methodology-omit-dont-zero-an-absent-measure.md) —
   the mirror image of `methodology-a-default-payout-masks-the-gap-beneath-it`:
   same root cause, opposite direction. Ask what a metric's absence pays in *both*.)
2. **A `MEASURES` entry shipped WITH the data.** Metric text is curator-editable
   live in Supabase, and "Applied CPL Units as FTES" matched no existing rule — it
   fell through every predicate to `{}`, which `earnFraction` reads as a data gap
   and pays at **full cap**. The moment Sam retyped P1 the model would have gone to
   100% advance with nothing on screen saying so.

### The rate is now editable (#965)

Two entry points — the pool card and the FTES-factors row, which had been sitting
frozen among editable siblings. Three calls worth remembering:

- **The BASE rate is editable, not the derived effective rate** (`rate ÷ multiplier`).
  Typing into a derived field pushes the number through a divisor and stores
  something else — the store-a-quotient mistake `ftes_factors` already avoids.
- **It writes via `setFtesRate`, not `setPool`.** `ftesRate()` reads
  `SCENARIO ?? SHARED ?? poolField(...)`, so a pool write lands *underneath* any
  top-level override: type a new rate, see nothing change, get no explanation.
  (`setFtesRate` had existed since #962 and was wired to nothing.)
- **Two entry points is only safe because they share one setter** — a test edits
  via each and asserts the other follows.
- **A zero rate is rejected, not clamped.** Every `prioTarget()` → 0,
  `earnFraction` reads `target <= 0` as `"none"`, and every college in the state
  silently earns $0. Guarded three ways (zero, negative, junk).

### A process note on myself

I reported "all funding tests green" from a run of `cpl_funding.test.js` that
**predated** my SYSTEM-row edit, and CI caught the two assertions I'd invalidated.
The stale-result trap is cheap to avoid and I walked into it: re-run the file you
touched *after* you touch it, not before. Fixed in a second commit, with the
assertion that would have caught the original defect (the total must not contain
the headcount figure).

Separately, a first pass at baselining the phone overflow against `origin/main`
was **wrong** — that ref was 16 commits stale in the sandbox, so "main is clean"
was an artifact of old data files. Re-baselined against `HEAD`: the 42px overflow
was pre-existing in the FTES-factors box (invisible until now because that box
only renders once a priority is FTES-denominated, which the committed defaults
are not). Fixed while in there. **Check what your baseline ref actually points at
before concluding a regression is yours — or isn't.**

### Also settled this run

- **Quarter colleges keep the 11.67 TLM** (→ 45 units/FTES). Sam's ruling closed
  `map_data_quality` `7eb0c25a`, which had been open since the morning; it confirms
  the shipped behaviour, so no code change. The row carries the caveat that the
  reading flips to a flat 30 if MAP turns out to pre-normalise quarter units.
- **New DQ item `ae3e16d6`** (Sam's idea, parked): normalize the unit basis in MAP
  — emit semester-equivalent units *alongside* native, never overwriting, because a
  quarter college's registrar and SIS think in quarter units. That would retire the
  TLM branch entirely and permanently close `7eb0c25a`.

### State

- Tests: `cpl_funding` **545** · `cpl_funding_cpl_ftes` **54** (Parts F/G/H new) ·
  new `cpl_funding_applied` **23** · basis 35 · metric_wiring 26 · performance 24 ·
  frontload 40 · public_private 9 · gate_ledger_public 53. Suite **181 files green**.
- Real Chromium at the **live Supabase Scenario-1 metrics** (the committed defaults
  are headcount-denominated and would not have exercised any of this), desktop +
  phone: 0 horizontal overflow, 0 console errors.

### Next concrete step

**The cron publishes `pa`/`pa_u` at 06:17 UTC.** Then: wire P1 → Applied and make
targets cumulative (Sam's calls), with the per-college distribution actually in
front of you. The thing to look at before committing to it — his two calls
together mean past work counts fully (LA Pierce maxes P2 on pre-program work)
while **79 of 99 colleges sit at zero transcribed** and the top 10 hold 95.7%.
Applied should widen that base considerably; measure it, don't assume it.

Then the **Budget consolidation** — still open, still the fix for the drift class.

## 2026-08-03 (SkyUnit cont.) — P1 → Applied went live, and I had the causal story wrong

Sam sent a pivot of the MAP Student Aggregated Values export (Bakersfield tab, rows
= MAP Internal StudentIDs, FTES row = column total ÷ 30) and asked to switch P1 from
eligible to applied units.

**The pivot validated the producer exactly** — eligible 25,280.5 / applied 8,437.5 /
transcribed 962.5, all three matching `pe_u`/`pa_u`/`p3_u` to the decimal. Because he
built it independently at the per-student grain we dedupe on, that is a real
confirmation of the grain assumption rather than a circular one. His aside about
outside submissions answered itself: **5 students / 25 units statewide.**

### What I got wrong, twice

**(1) The causal story.** On 2026-08-01 I wrote — into a KB note, a `cpl_memory` row
and #964's PR body — that eligible is *"inflated at the SOURCE"* by the ACE/JST
skill-level duplication. That framing is materially misleading. Sam: applying credit
is a **low-burden checkmark** meaning *"this looks applicable to their program"*, and
it *"eliminates a bunch of noise from Eligible credits that could never be applied…
(e.g., 1 unit in marksmanship)."*

The data shows it from the other side: where a credential **has** been articulated by
someone (the CER population), colleges apply **79%** of eligible credit (75,027 of
94,772 units). Across **all** identified eligibility in the student view it is **18%**.
The gap is dominated by eligibility on credit recommendations nobody articulated —
correct filtering, not loss. The duplication is real but **minor**.

That matters because a wrong causal story propagates: it had reached three artifacts,
and a future session would have gone hunting a defect that mostly isn't there.
**Establish *why* a number shrinks downstream before describing the gap.** Corrected in
the KB note + the memory row.

**(2) A unit-scope error in my own recommendation.** I built a multiplier comparison
on a **window**-denominated entitlement, then read it as if it were **per-year**, and
recommended "2.0×" when that row was actually multiplier **4.0**. Precisely the class
of defect I spent #964 fixing, made while fixing it. Caught by recomputing against the
live config instead of trusting my own table.

Re-examined with correct numbers I also **changed my mind on the substance**: 4.0
drops the median college to 27.4% of cap, and P1 capping is not the failure I framed
it as — a capped college has applied enough credit for its size, and you cannot apply
credit infinitely. **The ongoing pull lives in P2**, where 79 colleges are at zero and
nobody is capped. The ladder does the work; the multiplier didn't need to.

### Sam's design intent, in his words — the reason the metrics are what they are

- **P1 = Applied** — proxy for the upfront articulation work, "available to incoming
  students and community members." The petition→outreach flip: the onus moves to the
  college to create CPL opportunities *before* the student asks.
- **P2 = Transcribed** — the checkbox is a proxy that *every* step happened:
  articulation, counselling, appropriateness to program **and transfer destination**,
  correctly coded in SIS and later reported to MIS.
- **P3 = outside-submission activity** — evidences outreach to people who are *not yet
  students*, "the real access booster we need long term."

I proposed replacing P1 with a raw **articulation count** (corr with applied is only
0.334, and colleges like American River have 151 credentials articulated against 4.4
applied FTES). Sam's proxy logic is better and I withdrew it: a raw count rewards 264
articulated credentials nobody qualifies for, while applied proves the articulation was
both created *and* useful.

### What shipped

**Config, applied live** (receipt `kb/supabase_funding_p1_applied.sql`, guarded UPDATE):
P1 → Applied units · shares **.50 / .45 / .05** · target multiplier **2.0**. Also fixed
Year-2 P1, which had been set to *Transcribed* — duplicating P2, a curation artifact.

**Cumulative targets came for free.** `prioTarget = (entitlement / nYears) / rate ×
multiplier`, so with a 2-year window **multiplier 2.0 IS the cumulative window target**,
exactly. Dropping the `/ nYears` in `prioEntitlement` would give the same target and
**cancel the front-load incentive** — which that function's own comment names as the
reason it is the one exemption from the no-inline-scope guard. So: no seam change, and
a new test (`tests/cpl_funding_cumulative_target.test.js`, 10 assertions) carries the
*reason* so the next session doesn't "implement cumulative targets" by breaking it.

**I also withdrew my own proposal to delete the `credit recommendation` MEASURES rule.**
Deleting it would let an "eligible + statewide" metric fall through to plain `eligible`
and silently measure *all* eligibility — a wrong number in place of an honest gap.

### Live result

| | before | after |
|---|---:|---:|
| pool earned | $7.00M (30.1%) | **$9.65M (41.5%)** |
| median college | 34.0% of cap | **50.0%** |
| statewide target | 2,057 CPL FTES | 4,114 (cumulative) |

29 colleges at $0 — 11 of them have no feed row at all, and **13 have eligible credit
identified but have applied none of it** (Moorpark 8,664u · Cuyamaca 6,939u · LA City
5,925u · Monterey 5,582u · Ohlone 5,231u · Santa Barbara 4,016u · Sacramento City
2,298u · Gavilan 1,891u · Columbia 1,144u · Chabot 983u · Butte 435u · Feather River
433u · Taft 353u). Since applying is a checkmark, that is an **outreach list**, not a
performance verdict.

### Next concrete step

Watch the first cron after the config change to confirm the tab renders the new
metric/shares live. Then the **Budget consolidation** — still open. Open question
unchanged: the 11 colleges with no feed row, which Sam said he'd supply gap data for.

## 2026-08-03 (SkyUnit cont. 2) — the 9 no-feed colleges, and the third kind of zero

Sam, on the colleges reading $0 with no feed row: *"there should be no data gap,
just an implementation gap that will be remedied when they implement. Correct me
if you think that's wrong."*

**He's right, and it was worth verifying rather than agreeing** — #957 was exactly
this shape (Barstow/Lassen/Madera/Southwestern read $0 for months because of a
`College` vs `Community College` join miss that looked identical to an
implementation gap). Check: the 9 absent colleges are **not** in the builder's
`unmatched` bucket, which holds only 3 entries (`Calbright College Credit`,
`North Orange Continuing Education Credit`, `Launch Apprenticeship` — the two
known `… Credit` feeder variants plus one apprenticeship provider, none of them
funding colleges). So MAP genuinely has no student rows for those 9.

**And it demonstrably self-heals:** West Hills Coalinga and Santa Monica were on
the no-feed list on 2026-08-01 and now have rows.

### The finding: THREE states, one rendering

Verifying Sam's claim surfaced something he didn't ask about. Three different
things all render as `$0`:

| state | in the artifact | means | n |
|---|---|---|---:|
| **absent** | no row | hasn't implemented (Sam's read) | 9 |
| **withheld** | `null` + `_suppressed` | HAS implemented, 1–4 students, privacy floor | 4 |
| **measured zero** | `0` | has eligible credit, applied none | 16 |

The middle state is the one that matters: **West Hills Coalinga, Santa Monica,
Monterey and Moorpark have applied CPL credit and earn $0 anyway**, because the
<5 rule that protects those students also erases the evidence they exist. That is
not the same as Sam's "let them earn $0 — that's the incentive" ruling, which was
about colleges that posted nothing.

It also **corrects Friday's outreach list**: Monterey and Moorpark were on it as
"eligible but applied none," and they have in fact applied — it's just hidden.

Not decided; surfaced to Sam. The generalisable form is in
[`methodology-omit-dont-zero-an-absent-measure`](kb-notes/methodology-omit-dont-zero-an-absent-measure.md):
**when a suppression layer sits between a measurement and a consequence, work out
what the suppressed state costs the subject — if suppression can only ever hurt,
it has become a penalty for being small.** And never fold the three into one
bucket in prose: "29 colleges earned nothing" is true and useless.

### State

Config live: P1 = Applied · shares .50/.45/.05 · multiplier 2.0 (= the cumulative
2-year window target). Pool earns **$9.65M of $23.24M (41.5%)**; median college
**50%** of cap. Suite **182 files green**.

### Next concrete step

**Budget reconciliation** (Sam's call) — fold Implementation Funding in as a
Budget sub-view. Both tabs are JS-rendered, so it's a nav change plus a segmented
control `[Sources & Uses | $35M model | $15M Distributions | Report]`. The
single-source wiring (#949) already landed, so the two tabs agree on their numbers
and this is now the lower-risk half.

Then, in rough order of value: the **suppressed-earns-zero** decision above; the
**add/delete/reorder** gap in the ledger editor (the biggest distance between
"editable" and "curatable"); the **budget-vs-actual** expenditure lane.

## 2026-08-04 — SkyUnit cont.: the per-priority PRICE FACTOR (the global 2× is retired) — #971

Sam & Malone's ask: **decouple the funding split from the FTES difficulty.** The
model welded them — for every priority `cap ÷ target = the rate`, uniformly, so a
priority's FTES target was rigidly proportional to its dollar tranche. The single
global **target multiplier** couldn't tune per-priority. Fix: **move the dial to the
priority level.** Each priority now carries a `factor`; its **price per CPL FTES =
factor × the SCFF base rate**, and **target = pot ÷ price**. Higher factor ⇒ pays
more per FTES ⇒ **fewer** FTES earn the pot — the *price reading* Sam confirmed (a
premium on the harder / more-valued behavior), which scales the target
**inversely** (factor 2.0 halves it).

**(a) Learned.** Three things worth carrying forward, distilled into
[`methodology-retire-a-global-dial-into-per-item-dials`](kb-notes/methodology-retire-a-global-dial-into-per-item-dials.md):
1. **Make the neutral value an exact identity.** `factor 1.0` had to reproduce
   today's model. The old ×2 was doing *double duty* — a policy dial **and** the
   cumulative-window `nYears` conversion. Moving only the policy role would silently
   halve targets. So the ×nYears became **structural** in `prioTarget`
   (`perYear/rate × nYears/factor`), leaving `prioEntitlement` per-year (the
   front-load invariant). Now `factor 1.0` is a true identity and **merging moved no
   live numbers.**
2. **Direction is a real decision, not a default.** A per-item factor can scale the
   *target* (stringency) or the *price* (premium) — inverses that flip the incentive
   180°. I asked before building; Sam meant price (2× on P3 = pay double for portal,
   not make it twice as hard). The AskUserQuestion-worthy fork was the whole ballgame.
3. **Split the merge from the activation; the config write is POST-DEPLOY.** With the
   neutral default an identity, the code merge is behavior-neutral (live config still
   carried `targetMultiplier: 2`, which the new code ignores → neutral). Setting the
   real factors is a **separate Supabase write after Pages deploys** — removing the
   old multiplier while old code is still live would fall back to a default and halve
   every target. Order: merge → deploy → config.

**(b) State.** Merged #971 (squash `93b80aa`), Pages deploy green, full suite green
(545/545 on the big file). Live config activated post-deploy
(`kb/supabase_funding_priority_factors.sql`, fresh-read + Rule-9-guarded — all six
factors were null, so nothing of Sam's was overwritten): **shares .5/.3/.2 · factors
P1 0.5 / P2 1.0 / P3 2.0**, `targetMultiplier` removed. Live now: pool unchanged
**$23,240,308**; statewide target **5,759 CPL FTES** (was 4,114 neutral); pool earns
**$8.62M = 35.6%** of cap; median college **31%**; 23 at ~$0. Prices P1 $2,824.82 /
P2 $5,649.63 / P3 $11,299.26 per CPL FTES. Editable per-priority in the tab (retired
`targetMultiplier`/`effectiveFtesRate`/`setTargetMultiplier` + the global "Target
multiplier"/"Effective rate" FTES-factors rows). Tests rewritten for inverse scaling
+ cumulative default.

**(c) Prototype → port.** Iterated the whole model in the calculation sanity-check
**artifact** first (real-Chromium verified: neutral 1/1/1 reproduced the anchors
before any code moved), locked the direction with Sam, then ported. The artifact is
now synced to the live model and stays linked from the private tab — a durable shared
sanity-check surface, not a throwaway.

**(d) Next concrete step.** Still the **Budget reconciliation** (fold Implementation
Funding in as a Budget sub-view + single-source the $35M from the ledger). Factor
tuning is now self-serve in the tab; if 5,759 FTES / 35.6% isn't the intended
calibration, the factor inputs are the dial (P2's factor has the most redistributive
teeth today, since P2 is the biggest tranche and where most colleges sit mid-range).

## 2026-08-04 — SkyBox: Sam's funding-model tweaks (display + report) + the NC decision (#973, #974)

**(a) Learned.**
- **A "redundant" box often encodes a real distinction that only *collapses in the current
  data*.** The two $35M boxes (source vs computed total) are equal only because there is
  exactly ONE revenue source; the collapse must be conditional (single-source → one editable
  box; multi-source → sources + a computed total) or "+Add revenue source" silently breaks.
  Same shape as the memo's two redundant "Total available / Distributed" rows.
- **Changing a headline figure's *meaning* ripples into its invariants, not just its value.**
  Moving the hero from the college pool ($24.24M) to the institution total ($25.24M =
  `college_funding_before_feeder`) flipped one property: the hero used to *shrink* when the
  feeder carve-out rose; now it's *invariant* (the feeder just moves money college→NC inside
  the total). The test asserting "raising the feeder shrinks the hero" was right BEFORE and
  wrong AFTER — the fix was to assert the new relationship (total holds, college pool absorbs
  the shift), not to patch a number.
- **A coincidental value collision causes real confusion.** "Earned so far" ≈ $1M read as the
  $1M NC carve-out. The fix isn't to hide the number (it's honest earned-to-date) but to name
  what it ISN'T ("…not the noncredit carve-out"). It drifts off $1M as MAP updates.
- **Reframe a premise with the user's own data.** Sam worried he'd "left SF off" the NC
  carve-out; the FTES sheet HE sent shows SF earning $236,645 in the credit "Funding?" column
  and **$0 for the 4 standalone NC campuses** — proof the carve-out targets the credit-shut-out
  institutions, and SF isn't excluded (it earns through the credit door). The strongest
  pushback used his own file.
- **A per-item distribution is dominated by its worst datum.** $1M split by NC FTES hands
  Calbright ~$208K (21%) on an impossible figure (21,438 FTES / 2,484 heads = 8.6 FTES per
  student). The current HEADCOUNT split keeps Calbright at ~$33K — don't "true up" to an
  FTES split without excluding the bad datum first.

**(b) State.** 6 of 7 tweaks shipped (#973: #4 award order + #7 report; #974: #1 box collapse
+ #2 institution-total hero + #3a earned relabel). Suite cpl_funding **545→552**, public/private
11/11. NC direction locked: **targeted + advisory column** (not diluted). Sam pre-closed three
open questions: no suppressed colleges, factors/shares fine, no-feed colleges at $0.

**(c) Roadmap.** Finish the NC cluster — **#5** advisory NC column on the 115-college table,
**#3b** gate the NC carve-out on the 2 baseline quals (fail-open, held-not-redistributed) —
which mirrors the college gate. THEN the Budget reconciliation (the standing next-step).

**(d) Next concrete step.** #5: decide the column's content with Sam — NC **FTES** (visibility,
my rec) vs a recommended **$ amount** (his original words, but we chose not to distribute the
$1M to colleges, so a per-college $ lacks a funded basis) — then add each college's MIS NC FTES
to `cpl_funding_data.js` (Malone's 115-row table is in the 2026-08-04 chat) and render the
column. #3b: gate `feederCarveout()` disbursement on `baselineGate()` per feeder, held + rolled
forward, never redistributed.

## 2026-08-04 — SkyBox cont. (#976): the advisory NC-FTES column shipped

Sam chose **NC FTES (visibility)** for the advisory column. Built + merged as #976.

**(a) Learned.**
- **A whitelisting `.map()` silently drops new data-file fields from the render.** I added
  `noncredit_ftes` to all 115 college rows and wrote the render — and it did NOT appear, while a
  sibling change (the `display` override) DID. Root cause: `rowsFiltered()` projects each college
  into a NEW object with an EXPLICIT field whitelist, so `noncredit_ftes` never reached the row.
  (`display` survived only because `dispName()` looks it up from `base()` by the raw key, not from
  the row copy.) The fix is one line — add the field to the projection — but the *lesson* is: when a
  new field won't render, check for a row-copy projection before debugging the emitter.
- **Cross-validate a name-match with a field you already trust.** Matching Malone's 116-row sheet to
  the model's 115 colleges risked wrong-college NC values. The script aborts on any unmatched, AND the
  model's own `credit_ftes` equals Malone's Credit-FTES column for the same row (Mt San Antonio
  26,804.41, SF 12,951.79) — so a mis-match would show as a credit-FTES disagreement, not just a
  silent bad NC value. Use an independent shared column as the match's checksum.
- **When two of the user's standing rules collide, surface it — don't silently pick.** Sam asked for a
  "column" AND has a hard "no horizontal scroll" rule. I shipped the lower-risk sub-line (no width
  cost, delivers the visibility) and told him plainly he can promote it to a standalone sortable
  column if he prefers. Deliver the value, name the tradeoff, leave the final form to him.
- **`display` override, not a key rename, for a display-name fix.** "De Anza → DeAnza" is display-only;
  the `college` key drives `perfFor()`/elig joins against the MAP feed, so renaming it would break
  matching. Added `"display": "DeAnza"`; key unchanged. Chabot stayed "Chabot" (the alias was
  lookup-only — the NC value 152.79 was already correct).

**(b) State.** ALL 7 of Sam's tweaks + the NC rehaul are live (#973–#976). cpl_funding **555** green.
Only #3b (NC gate) deferred as inert-today. Sam: *"From tweaks to rehaul, this was a big lift… Looking good."*

**(c) Roadmap / (d) next.** The funding model itself is done — next real step is the **Budget
reconciliation** (fold Implementation Funding in as a Budget sub-view; single-source wiring #949 landed).

## 2026-08-05 — SkyBox cont. (#978): the Report/memo rework + KB research discipline

Sam sent 6 Report/memo tweaks + a mid-turn 7th (the $50k-seed intro). Built + merged as #978.

**(a) Learned.**
- **Research an official deliverable's external content with a subagent, and make it report the GAPS,
  not just the hits.** I spun a general-purpose agent to mine the public CPL KB for the Technical
  Assistance links. Its most valuable output was the NEGATIVE space: the KB has **no** dedicated
  Office-Hours/"Get Involved" URL (only "see the MAP website"), **no** public ESS-memo URL, and **no**
  personnel (Estrada/Nelson absent by design). In an official memo, "not found — don't fabricate" is a
  first-class result. I rendered those as plain text / a MAP-site pointer and left `ESS_MEMO_URL` +
  `MAP_LINKS` slots for Sam — never inventing a link or an email. The subagent prompt explicitly asked
  for "not found in KB" over a guess, which is why the gaps came back clean.
- **A hardcoded map beats a data-file change when the mapping is consumer-specific.** Grouping the 4 NC
  feeders by district is a MEMO concern only; a `MEMO_FEEDER_DISTRICT` map in the memo code avoided a
  `cpl_funding_data.js` change (and the sibling-test re-run risk that #976's data change caused).
- **Real-render, don't just assert.** After 562/562 green I booted the tab in node (reusing the test's
  `freshDom`/`boot`, `NODE_PATH` at the repo's node_modules) and eyeballed the district groups: it
  confirmed Mt SAC NC landed under Mt. San Antonio ($993,947 subtotal), the NOCE/SD/Calbright
  placements, and the TA links — things the string assertions don't fully catch (layout, right group).
- **Reuse an existing helper to render, don't reinvent.** The verification harness was 15 lines because
  `freshDom`/`boot` already existed in the test file.

**(b) State.** ALL of Sam's tweaks live (#973–#978). cpl_funding **562** green. Sam queued a forward
item: an **administrator opt-in** button (VPAA/VPSS/CEO) — my "capture-at-opt-in + CO-confirm" design
is in the handoff (build v1 next). Sam: *"From tweaks to rehaul, this was a big lift, Sky!"*

**(c) Roadmap / (d) next.** Build the opt-in v1 (attest + CO-confirm → `baselineGate`), then the Budget
reconciliation.

## Session checkpoint — 2026-08-05 (SkyOptIn; the self-service administrator opt-in v1)

**(a) Learned.**
- **The gate table already existed — the build was a role-flip, not a new surface.** The participation
  half of `baselineGate` was already backed by `cpl_funding_participation` + `ELIG.optin`, but opt-in
  was a *reviewer-only* toggle (`setOptIn` → "Mark opted-in"). "Add a self-service opt-in" was really
  "let the public write a constrained row, and capture WHO." Reading the existing consumer end-to-end
  before designing saved a parallel table.
- **RLS gates rows; only column GRANTs (or a definer RPC) gate COLUMNS.** The attestor name/email are
  PII, and the tab's own norm keeps contact PII reviewer-gated (the coordinator RPC exposes only a
  boolean). Since reviewers use the *same* anon/authenticated role as the public (team-phrase is a
  claim, not a distinct DB role), an RLS `is_allowed_reviewer()` policy can't reveal extra columns to
  them. The working shape: **revoke SELECT on the PII columns from anon/authenticated, re-grant only the
  non-PII columns, and read the PII back through a SECURITY DEFINER RPC that gates internally** — the
  exact `map_coordinator_summary()` pattern already in the file. Verified as `anon` in a rolled-back txn:
  a valid self-attest is allowed, a forged `confirmed` insert is RLS-rejected, and `select attestor_email`
  is *permission denied*.
- **Attest-first is the correct semantics, and Sam picked it.** The opt-in *is* the "participation
  request by the deadline" — the admin's submission satisfies the gate immediately; the CO confirm/revoke
  lane is the audit/fraud-catch, not a pre-gate. Matches the model's standing "attest + audit, not
  pre-verify / fail-open / held-not-punitive" posture. A pending-then-confirm gate would have made the CO
  a bottleneck on every college's money.
- **A column-read revoke can 403 a successful WRITE.** Once anon/authenticated lose SELECT on the PII
  columns, any write that returns a representation makes PostgREST SELECT them back → 403 on an otherwise-
  successful insert/patch/delete. Fix: `Prefer: return=minimal` on *every* write (public submit AND the
  three reviewer writes), then re-read status separately. PostgREST's default is minimal-ish, but making
  it explicit is immune to version drift.
- **The public opt-in button must survive the public sweep; the CO lane must not render at all.** The
  form uses NON-`CURATE_ATTRS` data-attributes (so `stripCurateAffordances` leaves it), while the lane is
  gated on `unlocked()` (never true publicly) AND its PII only arrives via the gated RPC (`[]` for anon).
  A jsdom test asserts both directions, including that PII handed to the client is still not rendered in
  public mode — a render-gate check on top of the RPC gate.

**(b) State.** v1 shipped (PR #<tbd>): schema migration `kb/supabase_funding_optin.sql` applied live
(`cpl_funding_participation` + attestation/status columns, constrained anon `cfp_insert_self`, PII column
grants, `cpl_funding_optin_review()` RPC); consumer adds the per-row opt-in form (public + private), the
reviewer confirm/revoke/remove lane in the eligibility section, and status-aware gate wiring. Tests
`cpl_funding_optin` **18** green; the other 9 funding files green. The migration was **behavior-neutral
to the currently-deployed code** (still reads only the non-PII columns), so it was safe to apply before
the code merges. ⚠ The sandbox can't reach `*.supabase.co`, so the live public INSERT path is
unexercised in-session — eyeball one real opt-in on the deployed site.

**(c) Roadmap.** v2 (the "magic," optional): a one-time magic link to the entered @college.edu address
that auto-confirms, so the CO drops out of the per-opt-in loop — needs an edge function + mail provider +
a college→domain map (more stable than a person roster). Only build if the CO wants out of the loop.
Then the deferred **#3b** NC-carve-out gate, and the **Budget reconciliation** (still the real next step).

**(d) Next.** Confirm one live opt-in end-to-end on the deployed site once merged; then Budget.

## 2026-08-05 — SkyOptIn cont.: opt-in row CTA + the Budget reconciliation + ongoing → 2030-31

**(a) Learned.**
- **Put the action where the user looked.** Sam opted Alameda in, then "I don't see where to confirm,
  other than the CO Note box." The CO confirm/reject lived in a *separate* Baseline-eligibility lane, not
  on the college's own row. Fix = surface ✓ Confirm / ✕ Reject **inline in the row drill-in** (gated on
  `unlocked()`), reusing `data-optinconfirm`/`revoke`. Binding gotcha: those buttons are re-rendered by
  `refreshTable()` (partial), so they must be bound **holder-scoped in `wireTable()`**, and the aggregate
  lane's copies scoped to `.cplfund-elig` in `wire()` — disjoint, so no double-bind / double-PATCH.
- **A number in a human-authored document that your system also derives is a claim to VERIFY, not a
  source to copy.** The amendment workbook's **$74M** grand total double-counts $3M (`=E2+E9+E10` sums the
  $18M project cross-cut instead of the $15M pot; true = $71M) and its **Max Award $665,971** is ~$144K
  stale vs the live model's **$522,239** (Mt. San Antonio) — it predates the $1M NC + $1M rural carve-outs
  and the credit-FTES basis. Recompute headline figures from the live engine (`awardStats()` over the 115
  colleges), reconcile the delta, and hand back the corrected numbers. New note:
  `docs/kb-notes/methodology-recompute-a-documents-figures-from-the-live-engine.md`.
- **The award range mixes two recipient sets.** The header's Avg $212,103 = $25,240,308 ÷ **119** (colleges
  + 4 NC); the floor/rural/size model governs the **115 colleges** only. The 4 NC campuses share the $1M
  feeder by headcount and are NOT floored — **Calbright $33,134 is below the $150K college floor**, so a
  blended 119-recipient Min/Avg/Max is dishonest. Report the two groups separately.
- **Extending a fixed-column ledger is a 3-line consumer change + a guarded data write.** `budget_ledger.js`
  keys everything off `YEAR_COLS`/`YEAR_LABELS`/`USE_YEARS`; adding `yr_2030_31` + extending `USE_YEARS` to
  `[1..5]` propagates to headers, cells, `sumYears`, and footers automatically (windowed Sources totals
  pick it up for free). "Committed vs anticipated" = an accounting stance, not a styling problem — Sam chose
  committed, so the years render normally and count; the source `window_label` carries the "committed
  through 2030-31" statement.

**(b) State.** Opt-in row CTA + inline confirm **MERGED (#986)**; `cpl_funding_optin` 18 → 28. Budget
reconciliation delivered (verdict: ties to the penny; $74M→$71M + award recompute are Sam's workbook fixes).
COBI ongoing → 2030-31 committed **in PR #1002** (bundled with this checkpoint): `budget_ledger.js` grows
`yr_2030_31`, `USE_YEARS → [1..5]`; Supabase applied + verified (`kb/supabase_budget_extend_2030_31.sql` —
$5M archived, ids 5/14 ongoing → $35M). `budget_ledger` 34 → 40; full suite 183 files green. The ledger was
already reconciled to the revised budget (all sources/uses/projects match) — the #949 wiring + SkyReconcile
did the heavy lifting; the extension was the only change needed.

**(c) Roadmap.** **NC equalization** is the live open workstream: design LOCKED (floor + optional per-row
factor, no double-dip flag), BUILD DEFERRED until Sam decides **headcount → FTES** for the NC split (next
session). Then build the editable NC section + fold in the award-card 115/4-NC split. v2 opt-in magic-link
and #3b NC-gate remain parked.

**(d) Next.** Land Sam's headcount→FTES NC-basis decision, then build the editable NC section (floor ·
optional factor · add-program dropdown) in one pass with the award-card split. Sam's workbook fixes ($74M,
award Max, split line) are his to make.

## Session checkpoint — 2026-08-06 (SkyPlan; the $50k rework groundwork + headcount finally retired)

Sam opened with the $50k/ESS-25-82 tab: *"see where we have simple check marks
for each priority"* — he wants where-you-are / where-you-should-be / how-to-get-
there, and his real goal underneath it: **get colleges unstuck and awarding real
CPL to real students in MAP.** Four PRs merged. The design itself is NOT built
yet — this run was the measurement and the plumbing it has to stand on.

### What the data actually said (and how wrong my first read was)

I led with the applied→transcribed cliff (65 colleges with applied CPL and zero
transcribed). **Sam corrected the phase:** applied credit is this phase's focus;
transcribing is a long-term ask that only actualises when outcomes funding is on
the line. That correction made the finding *smaller and more fixable* — outcome
3 currently fires on `pe > 0 || tr > 0`, i.e. ELIGIBLE, which is not an action a
college takes. Moving it to APPLIED changes only 13 colleges' state, not 78.

Then he explained the lifecycle in detail (JST/public/batch upload → CPL Plan →
disposition each CR → create the articulation), and two things fell out that no
amount of staring at aggregates would have produced:

- **Batch Cx/AP/IB uploads land already-transcribed by construction.** So any
  transcribed-based measure rewards batch loading identically to counselling.
  Merced's 99% completion is a batch, not mastery.
- **Colleges stop at upload because that is what the Veteran Star rewards.**
  Applied-CPL students ≈ JSTs uploaded at a ratio of **1.00** for the median
  college. The incentive drew a finish line nobody intended → KB note
  `methodology-an-incentive-teaches-where-the-finish-line-is`.

### The metric hunt — and the free test set I nearly wasted

Sam named MVC / Cabrillo / Bakersfield as adept *before* anything was computed.
Four metrics were tried; three ranked Cabrillo 24th–29th. Only the **disposition
rate** (share of credit recommendations carrying any disposition — Applied /
Not Applicable / In Process) put all three in the top thirteen of 106, against a
**median of 4.7%**. Method → `methodology-validate-a-derived-metric-against-expert-ranking`.

It is also the FAIR measure, and Cabrillo proves why: **844 Not Applicable vs
320 Applied.** An applied-only metric scores them 9% instead of 34% and drops
them ~40 places. Ruling a recommendation out *is* the work.

### The dataset (Sam supplied it mid-session; Malone is productionising it)

`StudentDetailCredits` — 537,908 rows, one per student × credit recommendation,
carrying `CPLStatusPlan` and `CreditsInReview`, the two fields the funding model
had been missing. Findings: **436,720 rows at Needs Action (81%)**; the top **20
exhibits carry ~40%** of the backlog; and **11,495 rows are "Credit Is Not
Recommended"** — unarticulable by construction, clogging every queue, and a free
win to auto-N/A. Generator shipped as `funding/_build_cr_backlog.py` (#1014),
aggregate-only, waiting on Malone's view name.

### Headcount: Sam was right that something was trumping us

*"There must be something in the config trumping our current understanding."*
There was. `wantsUnits()` decided FTES-vs-students by **string-matching
"headcount" in the metric LABEL** — so retitling a metric silently moved the
target onto `sizeOf(c) × target_rate`, where `target_rate` is a headcount-era
percentage applied to credit FTES. A category error reachable by a typo. Fixed
with an explicit, **layer-aware** `unit` field (#1012) — the layer-awareness is
the load-bearing part; a naive lookup would have inverted the bug and scored the
live Scenario 2's headcount metrics as FTES. KB note
`methodology-a-label-that-decides-behaviour-is-a-policy-switch`.

Also #1012: **NC split moved headcount → noncredit FTES** via a new
`feederBasis(f)` seam (the split was open-coded at FOUR sites while the
aggregate already flipped with `usesFtes()`), plus **Calbright's placeholder**
(Sam's 1,000, inside the peer-plausible 611–1,076 band; its reported 21,438.17
is 8.63 FTES/student, impossible, and on the raw figure the smallest campus
takes 47% of the $1M). The placeholder is a separate field — reported value
retained, chip explains the arithmetic, a curator's real figure retires it.

⚠️ **FTES alone barely moves Calbright ($33K → $40K). The FLOOR is what delivers
Sam's equity goal** (~$161K at a $150K floor) — and with a floor in place the
basis choice moves almost no money. Those are two independent decisions and were
being conflated.

### Deliberately not done

**Re-baking `year_priorities` onto the FTES regime.** The baked defaults are the
fail-soft fallback and are still the retired headcount model. I started it, saw
it rewrite ~15 behavioural assertions at once, and backed it out — that is how a
subtle regression ships. Baked rows now declare their *current* unit explicitly
(behaviour-neutral, test asserts field == sniff); the re-bake is its own change.

### The day's other lesson: two hours lost to CI

Every workflow began failing at ~15 minutes and Pages wedged. I went through
three wrong hypotheses (protection rule → billing → org policy) before reading
the job record: **`runner_id: 0`** — no runner ever assigned, cancelled at the
allocation timeout. Public repo, $0 billable, no budgets. Playbook →
`playbook-diagnose-a-starved-actions-runner`. Repo-side lever taken: the
`pages` concurrency group renamed to `pages-deploy` (#1013) to route around an
uncancellable wedged run.

### Next concrete step

Build the **$50k tab rework** on the disposition rate: stage ladder terminating
at APPLIED (transcribed shown as the $35M-era preview, explicitly unscored),
every step a **fraction not a check**, the Veteran Star reframed as a starting
line, and the per-college observation naming the top stranded exhibits. Then the
NC floor. Wire Malone's view into `fetch_custom_report.py` + set `VIEW` in
`_build_cr_backlog.py` when it lands.

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
