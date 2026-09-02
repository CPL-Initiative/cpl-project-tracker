---
title: CPL Implementation Funding tab — workstream lessons
created: 2026-06-11
updated: 2026-09-01
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
> 2026-08-20, the 2026-08-01 → 2026-08-06 sections (the units answer, the
> per-priority price factor, the NC decision, the opt-in v1 and the $50k
> groundwork) on **2026-08-27**, and the 2026-08-22 → 2026-08-23 sections (the
> explainer rework, the maximum allocation, the rural carve-out's retirement,
> the noncredit lane's first shape, Sam's dial-moving day and the docx
> migration) on **2026-09-01** — each time because the doc crossed its size
> budget and the checkpoint needed to append. Those phases are shipped and settled; read the archive only for the
> reasoning behind a decision you are about to change.
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

- ⚠️ **It is deliberately not free text.** An unrecognized key would read
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

---

## 2026-08-28 — SkyLens: the lane switch, and a gate stricter than its own policy

### What shipped (PR #1369, merged as `80d96b6`)

The noncredit lane is on the priority cards behind **one switch above them**, moving
all three together across every year. Sam named the failure mode himself before I
built it: *"otherwise I'll be a confuseled Pooh."* Three per-card toggles is eight
states and six of them describe no lane — the shares still read 34/33/33 while the
pots come from two pools that sum to nothing.

He also ruled **one FTES rate for both lanes** ($5,649.63 × the 0.5 factor =
$2,824.82 per CPL FTES). It holds on the merits: what the noncredit lane measures
is still credit *units*; the *student* originates in noncredit.

### Three card lines could not carry over, and each failed while looking right

1. **Strategies were inherited verbatim** (`strategies: p.strategies`). Credit's
   Success list names *"noncredit mirror courses"* among the things to
   batch-upload — on a noncredit card that instructs a noncredit institution
   about itself. Sam's framing: *"NC programs do not generally award credit, they
   get students trained and qualified to get credit at a credit college — hence
   different strategies."* A difference in the **work**, not the wording, so
   credit's list can never be the fallback.
2. **The actuals line fell through to** *"Actuals arrive with the next daily data
   refresh"* — false, and the most reassuring sentence available.
3. **The earning line read `earnAgg().perPrio[i]`** — the credit statewide
   aggregate, indexed by **position**.

### ⚠️ `undelivered` conflates two things, and the ORDER is the fix

`srcDelivered()` asks the **loaded** performance artifact whether a key is
present, so when the artifact has not loaded it answers false for *every* source.
Testing `meas.undelivered` before asking whether the artifact was there made every
**credit** card claim its measure was uncarried. The order now mirrors
`earnFraction()` exactly — the earning line and the actuals line describe the same
measure, so a surface that ordered them differently would contradict the one
beside it.

### ⚠️ Three things I cut as "gloss" were data — three suites caught all three

Sam asked to remove explanatory language. I over-cut:

| Cut | Why it had to come back |
|---|---|
| The **effective rate** (window ÷ target) | A derived figure, not a gloss — and he separately asked to see *more* of where numbers come from |
| **`meas.basis`** | Looks like a duplicate of the METRIC block, but they have different authors — METRIC is the CURATOR's wording, `meas.basis` is what the SYSTEM measured. Their divergence shows nowhere else |
| **Roll-forward** | A different fact from **reprioritization**: roll-forward is inside the window (unearned Year-1 money is still earnable in Year 2), reprioritization is money never earned at all. Collapsing them lost the half that tells a college its money is still there |

**The ratio is the lesson.** Of the assertions I was ready to write off as stale,
most were protecting something real. A failing assertion on correct-looking work
is a question, not a verdict.

### ⭐ THE FINDING: a client gate stricter than its own RLS policy fails silently, toward lost work

Sam relabeled the three priorities on the live tab. Nothing reached Supabase —
the config md5 was still byte-identical to my own write hours earlier.

My first diagnosis was wrong and worth recording as a near-miss: I concluded he
had not been signed in. **He sent a screenshot: the masthead read "● Signed in".**

The real cause:

```js
function unlocked() { var t = tp(); return !!(t && t.session()); }   // team PHRASE only
```

while all three funding tables carry

```sql
with check (is_allowed_reviewer() OR team_pass_ok())
```

**The database would have accepted his write. The client never attempted it.**
`activeOverride()` handed him the per-browser SCENARIO layer, `persistActive()`
wrote `localStorage` inside a swallowed `try/catch`, and the scenario layer wins
the render — so the tab showed his new labels back to him and looked published.

⭐ **Two credentials, one word.** COBI's masthead reports the **reviewer**
magic-link session; this tab gated on the **team phrase**. §11 already carried the
standing rule for the transition — *"accepts EITHER a session OR a phrase so
nothing goes dark"* — and this tab was one of the places it had not landed.

⚠️ **It was seven write paths, not one.** Config, notes and participation all
decorated with the phrase alone. Fixed as **one `applyWriteAuth()` helper**, not
seven patches: seven copies of an auth decision is seven chances to drift from the
policy, which is how this survived.

### ⚠️ The routing was never at fault

Worth stating because it was Sam's actual question. Every consumer reads the model
through `_prios()` / `_ncPrios()` — `college_briefing.js`, `funding_model_payload.js`,
the memo/docx path — so a renamed priority propagates on its own. **Nothing
hardcodes the names.** The change simply never entered the routing.

### Other findings

- ⚠️ **A bound must be tested by VALUE, never by the model's clamp count.** Santa
  Ana's unclamped noncredit award solves to exactly **$100,000.00**, so it
  receives the maximum without being *held* to it: `ncModel().capped` names 2
  while 3 receive the max. Both true, different measurements. Gating the sentence
  on one while counting the other makes the box disagree with itself.
- **The award range is two rows, never merged.** 115 colleges vs 33 institutions,
  different floors and ceilings, and 30 of the 33 sit in both lanes — a merged
  minimum would print the noncredit floor as the credit minimum.
- **The maximum box named Fresno City alone** while five colleges sit at the
  ceiling. Both bounds now count ties, as the minimum always had.
- ⚠️ **A python patch script that writes only at the end loses every edit when a
  later assertion raises.** One did, the `unlocked()` fix silently never landed,
  and the file still parsed. The new test caught it; nothing else would have.

### Sam's rulings this run

| Ruling | |
|---|---|
| One switch above the cards, all three, every year | never per card |
| Same FTES rate in both lanes | no noncredit rate |
| `Annual funding` / `Combined funding` | replacing "Disbursement / Even tranches / Front-load Year 1" |
| Remove most explanatory language from the cards | keep the derivations |
| No feed keys in reader-facing text | *"what does this mean? Metric · pinned to ppa_u"* |
| Noncredit needs its own strategies | different work, not different wording |
| Career attainment is carried by the **project pool**, reported qualitatively | no invented metric |
| Wire the ABCD §78093.2 outcomes in and make them visible | with superscript links from whatever serves each |
| *"Unearned reallocated after 2028"* — **withdrawn by Sam as invented** | replaced with the §78093.2(d)(1) goals |

### Where it stands / next

- ⛔ **Sam should re-apply his relabels** — with the gate fixed, a reviewer session
  now saves for everyone.
- **Not built: the ABCD spine and the goal-tagged project pool.** Design is in the
  session-203 handoff. `scaling_projects_tech` (~$8.96M) is one box; splitting it
  into named projects each tagged to a goal is most of the (d)(2) reporting
  artifact, and the pool card system already supports custom labeled boxes.
- ⚠️ **The CPL story corpus evidences the wrong goal.** Of 36 stories, **5**
  destinations name a job and only ~4 are genuine progression; 8 of 36 quotes
  mention employment at all, often aspirationally. The corpus documents
  *educational* attainment — goal (B), the one already measurable. Fixable at
  intake (ask what changed at work), not in analysis.
- Still unruled from SkyLane: the **threshold/floor coupling** (400 FTES is the
  last feasible step at the $50k floor).

---

## 2026-08-28 (later) — SkyLens: the fix that was half a fix

Continues the section above. After #1370 landed, Sam re-applied his three
priority relabels and reported them saved. **They were not.** Verified against
Supabase three separate times: `Access` / `Outreach` / (blank), md5 unmoved.

### ⭐ THE MISSING HALF WAS MINE

#1370 fixed **who may write**. It did nothing about work done **before** signing
in — and that is what kept him stuck.

Everything edited while locked lands in the `SCENARIO` overlay, and the overlay
**wins the render**. So after signing in the tab painted his labels back from
localStorage, looking exactly like published work. Re-typing the same text then
wrote nothing: the field already displayed that value, so no `change` event
fired.

⭐ **The promotion step already existed, and exactly one path reached it.**

```js
onUnlocked: function () {          // ← the TEAM PHRASE unlock row, only
  p.scenarios[activeScenario] = deepMerge(clone(SHARED), SCENARIO);
```

A magic-link reviewer never passes through that row: `unlocked()` flips true, the
row disappears, and the overlay is stranded on top of shared for ever — visible
to its author, invisible to everyone else.

Extracted as `promoteScenarioToShared()`, reachable from both credentials, plus:

- ⚠️ **Work that exists in only one browser must say so, unprompted.** Unlocked
  with an overlay, the auth bar reads *"⚠ This browser holds changes nobody else
  can see"* and offers **Publish this browser's changes**. Automatic promotion
  suits a *typed phrase* (deliberate); a magic-link sign-in is often incidental,
  so this path asks.
- ⏰ **An expired sign-in is now distinguishable from never having signed in**
  (Sam: *"I should get a notice if my token has expired"*). A dead-but-present
  session used to read as ordinary exploring.

Durable: [`fixing-who-may-write-does-not-rescue-what-was-already-written`](kb-notes/methodology-fixing-who-may-write-does-not-rescue-what-was-already-written.md).

### The sign-in dropdown (`cobi_identity.js`)

Sam: *"the drop down closes when I try to click into the email box… I have to
trick it and tab to it."*

```js
document.addEventListener("click", function () { if (openPane) { openPane = false; render(); } });
```

Closed on **any** document click. The toggle button survives because it
`stopPropagation()`s itself; nothing inside the pane does, so clicking the email
field bubbled here and `render()` tore the field out mid-click.

⭐ **A tab still worked** — which is what made it read as a focus mystery rather
than a stray handler. Tabbing is not a click, so it never reaches the listener.
**When a workaround is "use the keyboard instead", suspect an event-model
mismatch, not focus.**

Fixed by containment at the boundary rather than `stopPropagation` on each
control: the pane grows controls (`reviewer_signin.js` mounts the sign-in form
into it) and each would have to remember. Swept — no other module closes on an
unconditional document click; **47 sites already do a containment check**, so
this was the lone outlier.

### ⚠️ Two process notes on myself

- **I wrote his labels via SQL and then reverted them.** He said plainly:
  *"I don't want you to fix it; I want the tab to save it."* He was right — my
  write would have masked the very thing under test. Reverted to a byte-identical
  md5. **A hand-applied fix destroys the experiment that proves the repair.**
- **I ground on a redundant local suite** while the same suite was queued in CI,
  with the work already committed. Sam: *"grinding?"* Nothing was blocked on it.
  **A second run of the same check is not verification, it is delay.**

### Where it stands

- **PR #1371** open: `939774d` (dropdown) + `2538fd9` (promotion + expiry notice).
- ⛔ **Sam's relabels are STILL only in his browser.** After #1371 deploys, the
  Publish button is the one click that lands them — and the proof is the config
  md5 moving off `9cf58b99efa36bd40fccbfb823f3683c`, not the screen.
- **Still unproven end to end:** that a reviewer save reaches Supabase at all.
  Every layer has now been fixed or verified in isolation; nothing has done the
  round trip in a real browser.

## 2026-08-28 — SkyLens S203: the round trip closes, the spine lands, and a column that printed money twice

### What shipped

- **#1372** — curating the funding tab requires a **magic-link reviewer**, not the team phrase. Nine policies
  read `is_allowed_reviewer()` alone; writes stamp `curatorEmail()` rather than `(team)`.
- **#1375** — the **Ed. Code §78093.2(d)(1) spine**: four goal cards read live from the model, superscript
  ᴬᴮᶜᴰ links from the priority cards and pool boxes, plus Timing as its own collapsible section.
- **#1378** — the **`NC $` column retired**; every institution renders as a CR/NC pair, SYSTEM included.

### The item three handoffs called unproven is closed

Sam clicked Publish and his three relabels reached Supabase: config md5 `9cf58b99…` → `c95e78aa…`, and
`yearPriorities` year 1 holds `Access: Outreach` (src 0) · `Completion` (src 1) · `Access: Statewide` (src 2).
With `priorityOrder [2,0,1]` that displays exactly as he typed. **Do not re-derive this.**

The write landed stamped `(team)` rather than his email, because `applyWriteAuth()` preferred the phrase when
both credentials were present — which is what #1372 fixed. A per-person credential whose rows say `(team)`
throws away the one thing the magic link buys.

### ⚠️ CI was never broken, and the diagnosis in the inherited handoff was wrong

The Session-203 handoff reported *"NO WORKFLOW HAS RUN REPO-WIDE SINCE 18:28 UTC"* and proposed three
explanations: Actions disabled, out of quota, or a GitHub incident. **All three would have come back clean.**
Two workflows ran successfully after 18:28 — Daily CPL Dashboard at 18:44 and Deploy Pages at 18:49.

The real cause is narrower and completely determines the fix: **a conflicted PR cannot produce a
`pull_request` CI run.** GitHub tests the *merge commit*, and a `dirty` PR has none — so five consecutive
pushes produced zero runs, and the runs GitHub *did* list against the PR were for `7eea4461`, which was
#1371's head, attributed by the recreated branch name. Merging main in fixed the conflict and CI appeared on
the very next push.

**The lesson generalizes:** when a PR shows no checks at all, read `mergeable_state` before investigating the
CI system. `dirty` explains the absence completely, and every infrastructure theory is a detour.

### ⚠️ A post-squash merge hunk that had no correct side

#1371 was squash-merged *from the same branch* #1372 lived on, so main and the branch carried the same changes
in two shapes. Three of four hunks in `cpl_funding.js` resolved to HEAD. The fourth could not be resolved by
picking a side at all: **either choice left two `var promoteBtn` blocks** — one inside the hunk, one
immediately below — so a single click on Publish would have bound the listener twice and promoted twice.
Resolved as *neither* side, then asserted: 1 promoteBtn declaration, 0 `cplFundUnlockSlot` references.

### The spine: two axes, and a derivation that had to be tested properly

**Funded and measured are separate columns and are never merged.** Goal (C) — career attainment — is funded
(the project pool, per Sam's ruling) and has no campus measure at all. A single status forces that into either
a green that lies or a red that denies the money.

**A priority's goal derives from its measure's milestone, not its title** (`eligible`/`applied` → A,
`transcribed` → B, through `measureOf()` — the same resolver the earning math uses).

⚠️ **The first draft's guard proved nothing.** A mutation swapping milestone-reading for title-matching
**passed every assertion**, because on the live config the two agree for all three priorities. The
discriminating case had to be constructed: rename the transcribed priority to *"Access: renamed by a curator"*
and assert it stays under (B). *When two implementations agree on your live data, your test is not
distinguishing them — build the case where they diverge.*

⚠️ Similarly, the harness does not load `window.CPL_STORIES`, so the (C) story-corpus assertion was exercising
the graceful no-corpus path and asserting nothing about the claim. **The absence rendered exactly like the
success** — the same trap as testing a metric with no feed.

### Two claims re-measured rather than inherited

- **The story corpus.** The handoff said 5 of 36 destinations name a job. Counted: **32 end at an educational
  destination, 3 name a job.** The sharper finding is the arrow's shape — `<prior role> → <credential>` — so
  the corpus evidences goal **(B)**, not (C). Fixable at intake by asking what changed at work.
- **The project pool has no breakdown.** The ledger holds `CPL Projects — $35M share` as one row with no
  children, and **no project's `budget_source` names the $35M** (the nearest is `CPL Infrastructure & Scaling
  ($15M one-time)`). So the handoff's "split it into named projects, nearly free" is true of the *mechanism*
  and false of the *amounts*. The two shares are $8,959,692 + $9,040,308 = **$18,000,000** exactly.

### Sam's corrections this run

- **The Workplan register's goals are not a rival vocabulary.** My first pass framed them as incompatible with
  ABCD and implied 32 projects needed retagging. They were set *before* §78093.2 existed, align with the CPL
  Workplan and Vision 2030, and are the operational plan that **delivers** these outcomes. The alignment stack
  he named: Vision 2030 · the California Master Plan for Career Education · the CPL Workplan · §§78092–78093.2.
- **The no-NC row is a data-quality instrument**, not a layout nicety: *"if they disagree and say, Yes, we have
  NC, we can find the error and fix it."* A college that never appears cannot be contradicted.

### The NC column: the duplication was documented rather than fixed

A college's carve-out printed in its credit row's `NC $` cell **and** in its noncredit row's total — and the
noncredit row's own cell rendered `↑` with the hover *"the NC $ figure on the credit row above is the same
money, summarized."* An arrow existed purely to explain a repetition.

Sam's 2026-08-22 requirement (noncredit money on the surface, never lumped into the credit total) is preserved
by the **row structure**, which is stronger: a labeled row is visible without reading a column header.

⚠️ **The CSV keeps its noncredit column, and I was wrong to say otherwise.** I told Sam the export had to
follow the screen. It must not: the CSV has **no noncredit rows** — one line per college — so that column is
the only place noncredit money appears there, and deleting it removes the figure rather than de-duplicating
it. *Screen and export must share a **scope**, not a **shape**; the layouts differ when the carriers differ.*

⚠️ **My own defect:** putting `.cplfund-ncrow` on the new SYSTEM row **broadened what an existing class means**,
and three assertions that sample it to mean "a college's noncredit row" failed on a statewide aggregate they
were never written about. A new kind of row gets a new class.

### Assertions inverted rather than deleted

- *"a credit row with NO noncredit program gets no CR chip"* encoded the rule Sam changed. Now: every credit
  row is paired — plus a **distinctness** check, because a bare count would pass if one college gained a
  second row while another lost its only one.
- The below-threshold reason was matched by the **retired column's wording**. Rekeyed to structure (a reason
  chip plus dash cells that explain themselves), which is what the assertion's own name claimed.

### Next

1. **Sticky header + frozen SYSTEM rows.** Recommended; ⚠️ two-level sticky needs the second `top` to equal the
   header's rendered height, so measure into a CSS variable rather than hardcoding px.
   **Lazy-loading recommended AGAINST** — 115 colleges is ~230 rows, the EACR matrix paints 51,000 cells in
   1.6s, and virtualization breaks browser Ctrl-F and the what-you-see-is-what-exports contract.
2. **Goal-tagged project line items** — blocked on Sam supplying the $8.96M split; the mechanism is built.
3. **The threshold/floor coupling** — 400 FTES is the last feasible step at the $50k floor, still unruled.
4. **The optional Combined award row** (Mt. SAC $400,000 + $100,000 = $500,000).

## 2026-08-30 — The Open Verdicts afternoon: four builds ruled and landed same day

Sam ruled the 19-item Open Verdicts sheet live (reply-by-number, the first full
exercise of the decision-sheets rule), and the funding tab took four of the
builds the same afternoon (#1407, #1408):

1. **The Combined award COLUMN (item 2, resolving the "third Award-range row"
   question his way).** His spec: the pair's ONE total "centered vertically and
   horizontally (like the total FTES)". Built as `combinedColDef()` /
   `combinedCellHtml()` — a `rowspan="2"` cell on the CR row directly after
   Total; all three NC row shapes emit NO cell in the column; `colHideStyleHtml()`
   splits its nth-child rules at the combined position (NC rows sit one index
   earlier to its right, and the combined rule never touches them); the
   statewide pair included; sortable on the summed cap. **Not the retired NC $
   column's defect**: that printed the same money twice; this prints the sum
   that appeared nowhere (Mt. SAC $400,000 + $100,000 = $500,000).
   `tests/cpl_funding_combined.test.js`, 19 checks.
2. **The pair invariant MOVED, and an old test asserted the old truth.**
   `cpl_funding_nc_lane` D2/D16 pinned "NC row carries exactly as many cells as
   the credit row" — the very thing the spanning cell changes. CI caught it;
   the assertions now pin the NEW invariant (exactly one fewer). ⚠️ **The local
   full suite had "passed" first — because `npm test 2>&1 | tail -30` reports
   TAIL's exit status, not the suite's.** The pipe masked a real failure and CI
   told the truth. Check unpiped exit codes (`set -o pipefail`, or `$?` on the
   command itself), and treat "green through a pipe" as unproven.
3. **Frozen header + statewide pair (item 11: freeze, NO lazy loading).**
   `pinFrozenRows()` measures the thead and system-CR-row heights into
   `--cf-pin1/--cf-pin2` on every render + resize — the S203 catch (a typed
   pixel breaks at other zoom/font sizes) is now a test assertion, and the
   no-lazy-loading ruling is pinned by row count. `tests/cpl_funding_sticky.test.js`.
4. **The project-pool card wired (item 5: "sourced from the jointly wired
   Activities, Annual Targets, and Budget table" — never a hand-typed split).**
   The ledger's `pool`-section rows (two program parents + children) fold behind
   a word toggle on the card, framed as ONE $18,000,000 program (the $35M and
   $15M shares join; per-share attribution would be the invented split he ruled
   out), with an honest-empty state and a DRIFT LINE when the program rows stop
   summing to the two shares. The live ledger sums to $18,000,000 exactly.
   `tests/cpl_funding_pool_projects.test.js`.
5. **Goal-card policy (items 12 + 3).** Goal (C): *demonstrated, not directly
   measured — by design* (My CPL Stories touching career attainment + funded
   infrastructure/interagency projects), while KEEPING the counted
   evidence-for-(B) finding; goal (A): student-level equity belongs to the
   system's 3-year legislative reports (MIS + CCCApply + MAP), not college
   outcome funding. The story-intake question's final wording is his: *"What
   changed in your work or career path?"*
6. **Item 1 dissolved rather than decided**: threshold, minimums and buckets are
   independent dials and the model's job is an over/under-budget readout. The
   dials and the solver's feasibility figures already existed; the missing
   surface is the consolidated readout — mocked with the REAL rosters + live
   config (`docs/visuals/2026-08-30-budget-balance.html`; live finding: 42
   institutions demand $1.68M of the $2M carve-out, and 242.7 FTES is the
   frontier where 50 institutions consume exactly $2,000,000). Port on Sam's
   reaction.

## 2026-08-31 — The one-pool day: from morning hunch to adopted model (SkyLedger, S210 line continuing)

**The arc, in one paragraph.** Sam opened with a hunch ("move the NC money into
CR… let all the apportionment flow exactly how it is earned"), and by evening
the one-pool model was **adopted** with its design questions ruled and its
reaction visual built. The instrument chain that made that speed safe: scenario
math validated **to the dollar** against the tab's own solver on both live
lanes before any hypothetical ran; the Budget Balance mock grew a second mode
rather than a second implementation; each ruling landed as a stamped
scoreboard; and the port is sequenced behind its data dependency (the
origination feed) rather than in front of it.

- **Adopted (Sam, verbatim):** *"we should hold on 1 until we finalize
  one-pool, which yes, I want to go with now."* One pool: $25.24M to 118
  institutions sized by credit+noncredit FTES, floor $150K / cap $400K per
  institution combined (his dials, chosen in the mock). The cap is **per
  institution** (Mt San Antonio's pair trims $500K→$400K; Pasadena and Santa
  Ana — big-NC colleges — rise to the cap: the pair sizing working as intended).
- **The origination design (his, refined live):** the three noncredit-only
  institutions hold ordinary max awards and earn by ORIGINATION — their CPL
  transcribed at a credit college, district-scoped for NOCE/SDCCE, statewide
  for Calbright, the same CPL crediting both institutions by design. His first
  sketch (a separate Calbright carve-out) he folded back into the pool himself
  minutes later — present the numbers, let the designer iterate.
- **N1–N3 ruled by number on the mock:** N1 a (exhibits-in-MAP replaces the
  veteran-JST gate) · N2 b (**no advance on origination** — the origin feed is
  the gate to any funding, which re-prioritized the Custom Reports work:
  instructions doc to Malone/Pedro shipped the same hour, formalizing the
  standing 08-26 `Origin`+`LocID2` ask) · N3 a (nothing disburses on
  Calbright's placeholder size; the both-sides credit confirmed for all three).
- **The anti-usurpation answer is a restriction, not a second pool.** Sam's
  worry — NC funding usurped by the CR program — was answered by decomposing
  every award on its face (CR + NC by FTES share) and RESTRICTING the NC share
  to noncredit outcomes. Two pools would have reopened the carve-out-sizing
  problem the adoption killed. The residue is **F1** (hold vs label on the
  $1,300,738 across 108 college awards), posed on the visual, awaiting Sam.
- **Vocabulary is part of the model** (three rulings in one afternoon): the
  per-institution figure is the **max award** (*"communicates that awards are
  based on outcomes, not automatically awarded"*); the list is **alphabetical**
  so colleges don't open on a league table; and **funding, never "money"**,
  with CCC norms over business norms (allocated, restricted/designated,
  redirect, brought up to the minimum; "double count" avoided as an MIS
  audit-error term). Now doctrine in CLAUDE.md Naming.
- **Instruments that carried the day:** the mock's dial persistence + "Copy
  these settings" (built the hour his chosen dials proved browser-only and
  volatile — the bench lesson recurring); the who-moves card ported to the
  live tab (`cpl_funding_whomoves`, 13 floored checks, the saved solve being
  the SAME pipeline with the overlay lifted); and the reaction visual carrying
  every ruling within minutes of its making.
- **PRs:** #1418 (Memo A on the GR tab) · #1419 (mock one-pool mode) · #1420
  (N1–N3 stamped) · #1421 (who-moves + mock memory) · #1422 (adoption + the
  phases 1–3 visual) · #1423 (two lanes on one face · max award · vocabulary —
  in flight at checkpoint). Vault: CPLBrain #64–#67.

## 2026-08-31 — S215 (SkyPool): the labels ruled twice, and the mock became the whole tab

- **Boot race, not a stale greeting**: Sam's greeting named
  `session_215_handoff.md` while main's highest was 214 — the handoff sat in
  SkyLedger's in-flight checkpoint PR (#1423), which merged minutes into the
  session. A greeting can be AHEAD of main, not just behind it: check open PRs
  before declaring a number wrong.
- **Queue item 1 shipped** (#1424): per-priority earned/available dollars in
  every expand, the statewide cards, and the trio's expands — labels shipped as
  the handoff-recommended proposed wording for Sam to rule on.
- **The label two-step**: Sam ruled "Current Total / Potential Total"; the
  session flagged that "Potential Total" reads as ceiling OR gap; he refined
  live — *"I see that it can be read both ways. Let's use 'Total Possible' as
  the ceiling."* Ceiling semantics settled: per priority the CR+NC shares' sum;
  per institution the max award (captions keep his coined term); statewide as a
  mini-label on the card headline, because a duplicate row is exactly the
  redundancy he flags.
- **The sweep miss**: replacing the phrase "Potential Total" left
  `Potential␊Total` split across a hard-wrapped line — the residual scan in the
  smoke (grep the distinctive WORD, not the phrase) caught it; the sweep never
  would have. KB note:
  [`methodology-a-phrase-sweep-misses-what-a-line-break-splits`](kb-notes/methodology-a-phrase-sweep-misses-what-a-line-break-splits.md).
- **The full revised tab** (#1425): Sam saw the live tab's pre-port hybrid and
  asked to see the whole revised tab before the port. An agent inventoried
  `cpl_funding.js`'s ACTUAL render assembly (~30 surfaces — assembly order, not
  file order); every surface got a disposition. Survivors built into the mock:
  the Baseline-eligibility card (N1 a for the trio; held-in-reserve never
  redistributed), §78093.2(d)(1) goal cards + measure-derived superscripts,
  sticky header + ONE SYSTEM row (offset measured, never typed — the S203 catch
  honored even in a mock), live search, the word-control toolbar. Removals
  became **R1–R11** (8 ruled · 3 proposed), each with its successor,
  reply-by-number.
- **The lint earned its keep twice**: the lane file crossed its budget
  (12,691 > 12,000) at checkpoint and the trim pass found a "double count"
  vocabulary violation hiding in superseded pre-adoption text — deleted both.
- **PRs:** #1424 (Current/Total-Possible columns) · #1425 (the full-tab mock).
  Artifact: "CPL Implementation Funding," same URL, versions
  earned-available → full-tab-r1-r11.

## 2026-08-31 → 09-01 — S216 (SkyPort): the port ships, and the test family finds three bugs

**What shipped.** The one-pool model is live in `cpl_funding.js` (PR #1427):
one solve over 118 institutions, $150K/$400K on the combined award, FTES-share
decomposition, NC restriction (F1), origination earning for the trio (N2 b),
targets on the pre-bounds CR slice. All 33 funding suites re-aimed
(~2,000 checks) plus briefing (243) and explainer (15). Sam ran three live
reaction rounds against the mock, all ported same-day; three product bugs
found by the ports were fixed. Vocabulary tightened to doctrine: funding never
"pool"; "on its face" banned.

**Lessons.**

- **The anchor-first order worked exactly as designed.** The mock's figures of
  record became `tests/cpl_funding_one_pool.test.js` BEFORE any family triage;
  the family port then fanned out to five agents whose brief said "re-run the
  anchor at the end." Every agent's re-aims were verified against a moving
  product (three reaction rounds landed mid-port) and the anchor caught none
  of them drifting the model — because none did. The KB note
  (`methodology-a-locked-mock-s-figures-of-record-are-the-port-s-anchor-test`)
  now has its full worked case.
- **Intent-preserving ports are a bug-finding instrument.** Three real product
  bugs surfaced not from users but from agents refusing to weaken guards:
  (1) `prioTarget`'s per-student path omitted the lane slice — cap ÷ target
  scattered 1.5076× and the scatter WAS each college's lane split; the fix
  mirrors `prioEntitlement`'s routing, and the original 2026-07-31 seam
  comment ("the target must ride the SAME basis as the cap") gained its
  one-pool clause: the same-basis rule includes the LANE SLICE.
  (2) Three consumers still keyed rows by the retired `"c:"+order` after rows
  moved to `"c:"+college` — the `?college=` deep link, its scroll, and Sam's
  one-click "✎ Confirm" chip were all dead clicks. A key migration is only
  done when every WRITER of the key is found; the readers announce themselves
  by failing, the writers fail silently.
  (3) "Nothing bold" (the low-key-rows ruling) had shipped only two of its
  three parts — centering and rightmost-right landed, the `<strong>` name
  didn't — caught by a computed-style guard, not a selector guard.
- **Grid columns denominated in `em` disagree across font sizes.** The mock's
  header (.74rem), SYSTEM row (.95rem) and college rows (1rem) shared one
  grid-template *string* but not one grid: em resolved against each element's
  own font-size, so the header's numeric columns were ~25% narrower and every
  label sat right of its values — Sam's screenshot. One `rem` template fixed
  all three at once. (KB note filed.)
- **A display rename and a key rename are different operations.** "LA
  Southwest" and "Riverside City" landed as `display` aliases on the roster
  rows: `dispName()` carries them to rows, CSV, memo, and the explainer's
  display cells, while the `college` key keeps feeding PERF lookups, data-ids,
  opt-ins and deep links. The college briefing renders raw keys and is the
  known gap — queued for college-district-identity rather than half-patched.
- **A wording sweep needs its tests swept in the same motion.** pool→funding
  broke exactly one fresh port (`statutory_goals` pinning "full pool share")
  and my own Summary rework broke the anchor's D1 — both expected, both
  re-aimed within minutes because the porting policy said re-aim, never
  weaken. The cost of sweeping vocabulary while five agents port tests is one
  collision per overlapping phrase; the alternative (freezing wording until
  the port lands) would have cost Sam's live reaction loop.
- **boundLabel doubled a shared bound's figure** ("51 institutions at the
  $150,000 base award at $150,000") because the helper embedded the figure in
  one branch while the caller appended it unconditionally. When a helper
  formats EITHER a name OR a count-phrase, the figure belongs inside both
  branches and the caller appends nothing.
- **Flagged for Sam, not decided:** Annual-view award cells show cumulative
  window earning over the per-year figure ("earning $140,476 · 191%") —
  deliberate per its comment, but two independent porting agents read it as
  over-earning. His display-semantics call.

**Numbers of record:** 118 · 51 base / 7 cap · trio $482,669 · college NC
shares $1,300,738 · SYSTEM NC $1,783,407 (baked; real-data $1,783,399) ·
average $213,901 · Mt. SAC uncapped $711,567 (its NC FTES now rides its row).

## 2026-09-01 — Session 217 (SkyDeck): the deck run, and where a live-painted page still lies

Sam pivoted S217 to a deliverable: revise his Taco Tuesday deck for the
2026-09-02 session (Ed Code §78093.2 · the 2025–26 $50K review · the new
funding). The lane lessons out of a *presentation* run, of all things:

- **The live config is the only place the priorities exist correctly.** The
  deck's three priority cards were two models stale (P1 Access / P2 Success /
  P3 Capacity with headcount metrics). Rebuilt from the live effective values
  (P1 Access: Statewide 34% · P2 Access: Outreach 33% · P3 Completion 33%,
  units-in-FTES metrics), read via the config dump — never from memory rows,
  which hold rulings, not values. The deck's opt-in date was also stale
  (Oct. 31 vs the live participationDeadline 2026-11-01) and its
  coordinator count happened to still be exactly right (48 of 115,
  re-verified against `map_coordinator_summary()`).
- **Sam's sunshine ruling (2026-09-01, verbatim):** "I don't want to get into
  specifics on the new funding, just the general principles… New funding is
  still in draft form that I need to confirm with CO leadership before
  sunshining details." So outward materials carry the model's SHAPE (one
  funding total · base and cap · sized by combined teaching · outcomes-based
  draw-down · three draft priorities · noncredit riding every award) and no
  dollar figures, weights, counts, or the explainer link. The tab and
  explainer remain reachable but are not to be pointed at from presented
  materials until he confirms with CO leadership.
- **A live-painted page still goes stale in its PROSE.** Found while sourcing
  the deck: `funding-model/index.html` step one still says awards are sized by
  *credit* FTES over "all 115 … 1,069,182", and step three + the
  choices-table still say every funding factor is **1.0** — while the live
  Year-1 factors are **0.5** (mirrored years make them effective) and the
  one-pool sizes on combined FTES over 118. The 2026-08 fix gave every
  FIGURE an id the painter overwrites; SENTENCES that assert model mechanics
  have no ids, so the page can no longer lie in numbers but still lies in
  prose. KB note filed; the fix (next session) is to paint the load-bearing
  claims or delete the duplicated mechanics prose in favor of painted text.
- **Deliverable:** `CPLBrain/04-projects/cpl-initiative/20260831_Taco_Tuesday_3.pptx`
  (+ searchable companion .md and the build script beside it). 14 slides:
  agenda (30 min Ed Code · 5 min $50K reporting methods · 10 min questions),
  the ESS 25-82 commitments + a reporting-methods slide for the teammate,
  three Ed Code slides (establishes / requires / the statute verbatim), and
  the funding slides held at general principles.

## 2026-09-01 — Session 218 (SkyMeld): four outcomes fold into three bands, and the model's own earn figures make the case

**PR [#1429](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1429), squash-merged `724feac`.** Sam opened with a
structural ask — *"note how we have the 4 outcomes of 78093.2 and the 3
priorities of the model. I would like to meld these somehow together so we can
still adjust the factors and metrics needed while accounting for the 4
outcomes"* — and refined it across five rounds. What shipped is his structure,
not the one this session first proposed, and that is the story worth keeping.

### What the tab actually had wrong

Two sections described ONE allocation in two vocabularies: "Three Priority
Outcome-Based Allocations" and "Funding Outcomes Required by Ed. Code
§78093.2(d)(1)", stitched by a superscript letter on each priority card. The
collision was visible in the priority NAMES — *Access: Statewide* and *Access:
Outreach* are compounds that exist only because "Access" is the outcome and the
second word is the real distinction.

**And the code already knew.** `prioGoals()` never read a title; it derived the
goal from the metric's MILESTONE (`transcribed` → B, `eligible`/`applied` → A)
because, in its own comment, that distinction *"is the access-vs-completion line
the statute itself draws."* The grouping was already computed. Only the layout
had not caught up — so the consolidation was a presentation change over an
existing derivation, not a new mechanism.

### Sam's two refinements, both better than the proposal

1. **Success = (B) + (C).** *"Combine into Success both completion and career
   attainment the same way we combine two aspects of Access."* This gives goal
   (C) a home inside the campus-facing frame instead of exiling it to the
   project channel, and it is where a reader looks for it.
2. **(D) becomes "Opportunities", not "Pilot projects".** More faithful to the
   statute, not less: (D)'s object is *"credit for prior learning
   opportunities"*; pilot projects are the means it names. It also makes the
   three bands parallel — each is a thing that happens to students.

Then, on the measures: **put the counselor gate ON Applied rather than beside
it.** This session had proposed a fourth measure; Sam's version repairs the
applied rung itself instead of standing a new one next to a still-inflatable
one. Three measures, not four.

### The finding that justified the whole thing

Booting the live model against the live feed (`_prios()` per college × the perf
artifact) measured what the current three priorities actually earn:

| Measure | Cap | Earned | Colleges at full earn |
|---|---:|---:|---|
| Access: Outreach (eligible) | $7,740,780 | **$6,660,016 — 86.0%** | **97 of 115** |
| Completion (transcribed) | $7,740,780 | $1,245,625 — 16.1% | 13 full · 9 partial · 93 zero |
| Access: Statewide (`ppa_u`) | $7,975,349 | $63,773 — 0.8% | 0 |
| **credit slice** | **$23,456,909** | **$7,969,414 — 34.0%** | |

**84% of everything earned comes from the measure 97 of 115 colleges already max
out.** A third of the allocation pays for eligibility that already exists — the
rung the builder itself flags as carrying "the ACE/JST skill-level duplication"
and as "not an action the college took". `earnFraction()` caps at
`min(1, actual/target)`, so an over-target measure is an automatic payment, which
is the same "earns nothing and incentivises nothing" the metric diagnostic warns
about for an UNMEASURABLE metric — reached from the opposite direction.

**Read as an incentive, the model mostly was not one.** That is the argument for
the restructure, and it is stronger than the tidiness argument this session
opened with.

### Three measures proposed and measured before any was adopted

Each candidate looked good until it was measured. That pattern repeated three
times in one session and is the transferable lesson.

- **Completed My CPL Stories as the career-attainment metric.** Measured the
  live corpus: 36 stories, **14 of 118 institutions**, 9 of those with exactly
  one, two colleges holding 44%, and **3 of 36** naming a career destination.
  Rejected for funding (it measures COLLECTION, not attainment; it puts funding
  pressure on a student consent artifact carrying a selfie and a release), kept
  for (d)(2) demonstration. Also found a live defect: the goal-(C) card counts
  `Airman → Cerritos College → UC Riverside` as a career destination because the
  classifier's education regex has `university` but not `UC` — 4 reported, 3 real.
- **Origination-filtering the Access measure.** Sam ruled "filter now". Measured:
  portal-origin is **104 students statewide against 39,007** (0.27%), and
  `ppa_u` is 649.5 units against `pa_u`'s 216,035. Scaling by the statewide
  eligible:applied ratio (6.42×), a filtered Eligible lands near 0.3% of today's
  1,386,862. Shipped anyway on his ruling — correctly, because `srcDelivered()`
  reads an undelivered key as $0 rather than a full cap, and the measure becomes
  right the moment `Origin` carries batch upload.
- **The counselor step.** Adopted. The dial-setting question it raised is below.

### Setting a measure that starts near zero

`prioTarget()` for an FTES priority is `(entitlement / rate) × (nYears / factor)`
— so **factor is the price premium**: a higher factor pays more per CPL FTES and
the share is earned with fewer of them ("a premium on the harder / more-valued
priority", per the code). That is exactly the dial for a new behavior. Measured
from the model: the effective price at factor 0.5 is **$2,520.32 per CPL FTES**
for a college at neither bound, and the statewide window targets are 2,757.1 /
2,676.0 / 2,676.0 CPL FTES.

Against today's 216,035 applied units, the adoption an Accepted measure needs to
earn in full:

| share | factor | target | applied CPL needing the attestation |
|---:|---:|---:|---:|
| 33% | 0.5 | 80,280 u | 37.2% |
| 33% | 1.0 | 40,140 u | 18.6% |
| **25%** | **1.0** | **30,409 u** | **14.1%** ← recommended, Sam ruled yes |
| 20% | 2.0 | 12,164 u | 5.6% |

⚠️ **A per-year ramp is not available in this window:** `mirrorYears` makes year
2 read year 1, and `frontload` gives later years no separate pot. Set the factor
once for the window, revisit at the next appropriation.

### The claim this session got wrong, and Sam corrected

Said repeatedly, and written into a source comment and a commit message, that
the counselor step **"cannot be batch-loaded."** False. Sam: *"there are
allowable uses for batch uploading the counselor step checked true — we ask
colleges to batch upload previously transcribed CPL from their SIS, with the
assumption that they went through the counseling steps with each student before
transcribing."*

The honest version: it is a **policy attestation, not a technical guarantee**.
Its integrity rests on the CO instruction (stop auto-awarding — which *"can
impact students negatively"* — confirm acceptance, then check the step) plus the
audit trail recording who attested and when. The live risk is a college that
auto-awards, military basic-training credit especially, and batch-sets the flag
anyway. It still does real work: an undifferentiated applied count asks the
college to assert NOTHING, while this one requires an assertion they are
accountable for. **The gap narrows; it does not close.** Corrected in `8720687`.

Sam also ruled the step may be checked by **either the student or the
counselor/coordinator/initiator**, and agreed to record the attester in the audit
trail — which is what makes the measure reviewable, and which matters more given
the batch case.

### A bug the consolidation introduced, and how it was caught

Banding puts each band's cards in their own `.cplfund-prio`. The drag/reorder
handlers bound `document.querySelector("#cplFundingMount .cplfund-prio")` —
**singular**, correct while there was one grid. Only the Access band got
listeners: the position picker on every card below it looked live, accepted the
change, and reordered nothing.

**No assertion about markup would have caught it.** It was found by a test that
EXERCISED the last card, and pinned by one that still does — mutation-verified
by reintroducing `querySelector`, which turns exactly that one assertion red.
The general shape: **when you group a flat list into containers, every
`querySelector` that assumed one container becomes a silent partial.**

### Four suites re-aimed, and why counts went UP

`reorder`, `rollup`, `metric_pin` and `render`/`one_pool` located priority cards
by **DOM ordinal**. Bands render in statute order, so the card at display
position N is Nth WITHIN ITS BAND — the ordinal assumption broke. Re-aimed to
`data-priocard`, the display index the renderer already stamps, which is what
every one of those assertions was always reaching for. None was ever about
document order. `render` and `one_pool` also gained absence guards in the
R1–R11 shape (the retired section title must stay gone; the statutory title must
appear exactly once). Counts: reorder 69/69 (was crashing), rollup 43/43 (38/43),
metric_pin 44/44 (43/44), render 137/137 (135/136), one_pool 51/51 (48/49).

### Three CI failures, three different causes

Worth recording because the temptation each time was to assume the previous fix
covered it, and twice that would have been wrong.

1. `b3a8ad1` — the five suites above. Fixed in `d214d71`.
2. `d214d71` — **`dependency map is STALE`**. The map is derived from source and
   the refactor moved code, so recorded line references drifted. 15 lines
   changed, every one a `"line":` number; the markdown was byte-identical.
3. `8720687` — the same staleness (that commit predated the regeneration).

Also surfaced by CI, and easy to miss because it is explicitly "not a failure":
`cpl_funding_statutory_bands.test.js` **had no recorded check floor**, so its 26
assertions were unprotected against silently disappearing. Re-baselined with
`npm run test:floor` and the ledger diff REVIEWED before committing — the tool
rewrites every file's floor and will happily lower one. Nothing dropped: one_pool
49→51, render 136→137, bands new at 26.

### What shipped

Three bands with **derived** membership (a card lands by the goal `prioGoals()`
resolves from its milestone — the same resolver the earning math uses, so the
band a college reads and the dollars it earns can never disagree), an **orphan
band** so an unresolvable priority surfaces loudly instead of vanishing, the goal
spine preserved as a fold (it is the §78093.2(d)(2) reporting artifact and the
only place (C) reads honestly funded-and-unmeasured), a new `accepted` milestone
mapping to (B)+(C), and two measure sources — `ppe`/`ppe_u` emitting today,
`pac`/`pac_u` declared-not-delivered on the noncredit lane's proven pattern.

**Not shipped, deliberately:** shares and factors. Sam's standing rule — *"I
don't want you to fix it; I want the tab to save it"* — makes those curator edits
through the tab, not session SQL.

## 2026-09-01 — Session 219 (SkyTrim): the targets were there all along, laid out into a 240px column

Sam's pass over the college drill-in was seven items: four strikes, one "give me
the targets", two questions. The four strikes were easy and the interesting one
was the request, because **the thing he asked for was already rendered.**

### The finding

`collegeDetailHtml()` builds a `.cplfund-detail-grid` — `repeat(auto-fit,
minmax(240px, 1fr))` — and drops every part of the drill-in into it as a sibling:
the FTES-share line, the base/cap line, the eligibility line, the CO note, the
county line, the district line, **and the per-priority table.** The table is
`table-layout: fixed` with `min-width: 620px` inside an `overflow-x: auto`
scroller, which is exactly right on a phone and catastrophic here: as a grid item
it got ONE ~240px track, so three of its columns lived past a clip edge that no
error, no missing node and no text-based assertion can see. Sam read the expand
and concluded it had no targets. It had all of them.

`grid-column: 1 / -1` is the entire fix. The attestation form and the CO note
were being squeezed the same way and got the same span.

**The generalizable bit:** a scroll container is a correct narrow-screen safety
net and a silent desktop defect the moment its parent track is narrower than its
content. `CLAUDE.md`'s presentation rules already say `overflow-x: auto` is "the
narrow-screen safety net, never the default desktop experience" — this is what
violating it looks like when nothing is obviously broken. And when a curator says
a surface does not show something the code demonstrably renders, **check layout
before you check logic.**

### The column that answers the question he actually asked

"Where they are and where they could be" is a distance, and the table had no
distance — Target and Actual sit two columns apart and the reader subtracts. **To
go** now names it, with the funding that distance would earn beside it.

The interesting constraint is which rows may have one. `earnFraction()` returns
six statuses and only three carry a measurement. Two must not print a distance:

- **suppressed** — the actual is masked for privacy below 5. A mask plus a gap
  *is* the value; the reader subtracts and the suppression has done nothing. The
  mask has to hold across the whole ROW, not just the cell it was applied to.
- **undelivered / bad_src / gap / pending** — there is no number to subtract from.
  Printing "0 to go" would say *you are done*, when the true claim is *we cannot
  see*. That is the same silent-omission class the earned column already guards.

Both read the plain absence. `earnIsMeasured()` already existed for exactly this
question and is the reason the branch is two lines rather than a status list
copied to a fifth site.

### The strikes, and why the base tail went with the cap tail

Sam named the cap line. The base line is its mirror — same sentence shape, same
tail, written as a pair so the two read as one thing. Striking one would leave a
half-pair, which reads worse than either state. The re-split FACT is not lost:
the formula box states it in full and `cpl_funding_cap.test.js` C7 still pins it
there, which is what made the drill-in copy redundant in the first place.

The gate chip is the same shape of judgment run in reverse. Removing a duplicated
signal is not removing the signal, so the guard that demanded the gate read
**without a hover** was re-aimed onto the Elig pie plus the award cell's own
"confirm participation to start earning" — both of which were already there.
A guard whose subject is retired gets re-aimed at the requirement, never deleted.

### The lesson that recurred

`a-test-coupled-to-position-or-wording-breaks-on-correct-work` was recorded on
2026-08-27 after exactly this: a suite indexing cells by position broke when a
column was added. Today the To go insert shifted every index in
`cpl_funding_metric_pin.test.js` and left three checks asserting the right thing
about the wrong cell. **Recording the lesson did not prevent the repeat, because
the 08-27 fix repaired the assertions rather than the addressing.** The suite now
maps header text to a key from the table's own `<th>` row and **throws on an
unmapped header**, so the next column insert is a loud failure naming the column.
When a coupling lesson recurs, change what the test is coupled *to*.

### The two questions, and the one that had a factual answer

Item 7 — "I thought we designed a simplified flat funding box yesterday, am I
imagining things" — is checkable, and he is not. It is
`docs/visuals/2026-08-31-if-tab-simplified.html` §Funding Breakdown: a four-line
ledger stack with the named-projects fold, base and cap lifted into their own
section. It never reached the tab. **The reason it stopped is not a reason:** the
mock is read-only and the seven boxes are the curator's editing surface, but an
inline editor sits in a ledger row exactly as it sits in a box. Worth saying
plainly — *"a mock is read-only"* is a description of the mock, not a constraint
on the port, and it stalled this for a day.

Item 5 got the element-by-element count rather than an opinion: half the
goal-spine fold is a second printing of the band above it (key, name, citation,
statute quote, per-priority funding), and half has no other home. The structural
catch is that **(B) and (C) are separate goals sharing one band and differ on
precisely the axis §78093.2(d)(2) asks about**, so a band-level evidence sentence
cannot say both. Both went to Sam as
`docs/visuals/2026-09-01-if-tab-two-consolidations.html`, numbered for reply.

**Receipts.** PR #1432. `cpl_memory` rows written INSERT-only under author
`session-219-skytrim` — rollback is
`delete from cpl_memory where author = 'session-219-skytrim'`. No data writes
beyond that; shares, factors and titles remain curator edits through the tab.

## 2026-09-01 (later, Session 219) — both consolidations ruled and shipped, and the condition that made one of them dangerous

Sam ruled the decision sheet the day it was written — consolidate the goal
spine, port the flat ledger — and then added two things mid-flight that changed
the work: an introduction, and *"I don't want to lose editability of variables
we have in the model through the simplifying and consolidation process."*

### The condition was the whole risk, and it was not obvious

The Funding Breakdown's seven boxes looked like a display. They were the
**editing surface**: each box held an inline editor for its amount, another for
its label, a control to drop it from the funding math, and another to hide it
from the public college page. "Flatten this into a ledger" reads like a
presentation task, and the natural way to build a ledger is to print the values
— which would have looked *correct in a screenshot* and silently cost Sam the
model. Nothing on the page would have said so; the numbers would all be right.

Two things followed from taking that seriously.

**The class vocabulary did not change.** `.cplfund-card` names a ROLE — a
labeled figure — not a shape, so the flat treatment is CSS scoped to a
`.cplfund-ledger` wrapper and the markup is untouched. Every editor, every
control, every fold and every absence guard (`.feeder`, `.balance`, `.rural`)
kept working. A rename would have been a day of re-aiming ~25 assertions that
were each asserting the right thing about a container that had moved.

**The guard came before the confidence.** `cpl_funding_ledger_editable.test.js`
asserts the dials rather than the look, and it is mutation-verified in the
direction that matters: make one row print its value instead of offering an
editor and it fails eight assertions **by name**. That "by name" cost a fix of
its own — the first version threw at an unguarded `commit(null)` and the run
died before `finish()` printed, so the assertion that caught the bug never
reached the log and the next reader would have seen a stack trace instead of a
cause. **A guard that dies before it can report is only half a guard.**

### One function, two surfaces

The spine consolidation's real content is not the layout. Half the fold was a
second printing of the band above it, and deleting that half is easy. The other
half — the evidence state, the (A) equity limit, the (C)
demonstrated-not-measured note — had to render in the BAND (where a reader
works) while the §78093.2(d)(2) account still had to stand on its own one click
down. That is two surfaces describing the same goal, which is exactly the shape
that drifts.

So `goalEvidence()` / `goalLimitHtml()` / `goalFundsHtml()` were extracted
first, and both surfaces call them. A check asserts the band and the table agree
about (C). Without it, the tab could have told a college "no performance
measure" on the band and something else in the report, and neither would look
wrong on its own.

**And the reason the evidence line is per GOAL rather than per band:** Success
is (B)+(C), and they differ on precisely the axis (d)(2) asks about — (B) is
earned against a MAP measure, (C) is funded and deliberately not measured. A
band-level sentence would have to be wrong about one of them. The consolidation
that groups two goals into one band is the same consolidation that forbids one
statement for the pair.

### R11, and re-aiming versus weakening

The introduction broke a guard: R11's check read *"the Summary sits above the
first section"*, and an intro section precedes it. The lazy fix is to move the
intro below the Summary; the wrong fix is to delete the check. R11's actual
requirement is that **the Summary is never inside a fold** — "above the first
section" was an equivalent proxy until there was a section that belonged above
it. The check now asserts both halves directly: no enclosing `<details>`, and
only the intro may precede it. Strictly stronger than the proxy, and it says
what it means.

Three other re-aims this run, each to a requirement rather than a phrasing: the
goals suite addresses the (d)(2) cells **by column header** (the metric-pin fix
from earlier today, applied before a third column could re-point anything); the
bands suite accepts "campus" or "college" in the no-one-earns claim, which is a
fact and not a spelling; and the hero-note check went case-insensitive when its
phrase became the start of a sentence.

### What the port actually moved, and what it did not

Two of the seven boxes were never ledger lines. The **allocation basis** is a
denominator and the **reimbursement rate** is a price; neither nets down to the
total the ledger sums to, and standing in a money ledger they read as though
they did. They moved into *How an allocation is computed* — with their editors,
which is the same trap in miniature: moving a read-only figure is a layout
change, moving an editable one and printing it as text is a lost dial.

The print CSS learned the ledger too. The print window **clones the live tab**,
so without it "Save as PDF" would have carried the ledger's markup and the
boxes' look — the one place the two surfaces could quietly disagree about what
the model looks like.

**Receipts.** PR #1433, on top of #1432 the same day. 292 test files green; all
sixteen `js-tests.yml` lint steps run locally before the push, which is now
habit rather than diligence: the previous PR went red on
`kb/_build_dependency_map.py --check`, and **editing `cpl_funding.js` at all
moves recorded line numbers in that artifact**, so it is stale after every
change to this tab.

## 2026-09-02 — Session 219 (SkyTrim): the explainer audit, and a figure that was never computed

Sam asked for a register pass over the public explainer — *"revise any
spoken-like text"* — and gave one example: **"Noncredit funding rides every
award's face — not a separate pot."** His replacement named the instrument
(MIS-reported NC FTES), the mechanism (earned against the model's priorities)
and the counting rule (originating in noncredit, awarded at a credit college).

The S217 audit was still open on the same page, so it ran as one pass. That
turned out to matter: **the sentences that read worst were the sentences that
were wrong.**

### "Pot" was doing two kinds of damage

`pot` appeared nineteen times across the two explainer pages. It is banned
vocabulary (`CLAUDE.md`, Funding vocabulary: say **funding**, not "pool" — and
"pot" is worse), and it is also imprecise in a way that matters here: the model
has ONE total, and "a separate pot", "the same pot", "half that pot" invite a
reader to picture several. Sam's own example objected to exactly that — *"could
be misconstrued"* — and the fix is not a synonym but naming the thing: the
appropriation, the amount allocated to institutions, a priority's share.

Same for **"money"** on two section headings, **"offered"** throughout (the
model's term is the **max award**, chosen precisely because it "communicates
that awards are based on outcomes, not automatically awarded"), and the spoken
asides — *"worth saying out loud"*, *"none of them onerous"*, *"a handful of
very large colleges pull it up"*, *"would work against the point"*.

⚠️ **The painted twin.** `#nc-body` has a static fallback AND a painted version,
and the painter's copy is what a browser shows. Revising the static text alone
would have left *"There is no separate noncredit pot"* on the live page — the
same banned word and the same denial Sam flagged, in the one copy that renders.
On a page with a painter, revise both or revise the painted one.

### The figure that was never computed

Step three said **"All three factors are currently set to 1.0"**, and the choices
table said `1.0 / 1.0 / 1.0`. Live Year-1 factors are 0.5. The S217 handoff
recorded this as stale STATIC prose — text the painter cannot reach because it
carries no id.

That was the wrong diagnosis, and the right one is worse. `_prios()` — the
accessor every consumer is told to use instead of reading the config — **never
emitted `factor`**. The payload builder read `p.factor == null ? 1 : p.factor`.
So the page printed 1.0 at *every* setting, through a chain that looked entirely
computed: a live page, a payload built from the engine, a defensive default. A
reader checking the page against the tab would find the tab saying 0.5 and the
page saying 1.0 and have no way to tell which was lying.

**A defaulted field looks computed and never moves.** The tell is not the value —
it is that the value never changes when the dial does, and no single-paint test
can see that. So the guard is now: change a dial through the layer a curator
writes to, repaint, and require the page to disagree with itself. Mutation-tested
by dropping `factor` from the projection again; three assertions go red by name.

### Two more the audit turned up, both invisible in prose

**The worked-example cards** were still sized on `credit_ftes` over
`D.colleges` — the two-lane basis retired on 2026-08-31 — while `rows` beside
them used combined FTES over 118 institutions. One page said Mt San Antonio was
26,804 FTES and 2.5% of the state in a card, and 37,634 in the table directly
below. Both figures were computed; they were computed against different
denominators. They are built FROM `rows` now, so the card and the table are one
number by construction rather than by two computations agreeing.

**The every-college table's "Credit FTES" header** had carried combined figures
since the port — a mislabeled column, and the one column a reader uses to check
the proportional share.

### Why the existing guard missed all of it

`tests/funding_model_page.test.js` already required every hard-coded **money**
figure in the prose to carry an id. Both stale claims were numbers without a
dollar sign: `1,069,182` and `1.0`. The guard now also fails on an unpainted
thousands-separated number in the prose, which is the shape the basis claim had,
and the dial-change check covers the factors. Mutation-verified: restoring
`1,069,182` unpainted fails the new check and names the figure.

### Not fixed, deliberately

`prototype/check_funding_explainer.js` waits on `#f-pool`, an id retired long
ago, and also pins `$24,240,308`, "115 colleges" and a 115-row count. It fails
identically on clean `main`, it sits outside `npm test`, and repairing it means
re-aiming four assertions onto live values — a separate change, and named here
and in the handoff rather than folded into a register pass.

**Receipts.** PR #1434. `_prios()` gained one field; the rest is prose, ids and
guards. Full suite green; all sixteen `js-tests.yml` steps run locally.

## 2026-09-02 — Session 220 (SkyCalm): the calm pass, and the text a test does not see

Sam opened with the brief in one sentence — *"get rid of any cheesy glyphs (per
our rules) and preserve all needed functionality while eliminating any visual
noise possible. I want folks to feel calm when they open this model"* — and
added, mid-turn, the two things that turned out to matter most: the reserve
note on a college row *"isn't clear when compared to 400k available"*, then
*"put it before the $400k CR total and not on the NC total"*; and *"It would be
nice to be able to edit while in curate, any of the text sections."* One PR.

### What the sweep found that the eye had not

The tab had 273 glyph characters in its source; 60-odd of them rendered. Sam's
screenshot circled the obvious ones (the pencil, the warning sign, the tick on
"saved", the chevrons). The guard written for the pass — a character-class
sweep over the whole mount's `innerHTML`, on four sub-views — found two the
eye had missed, and both were in places a reader does see:

- **Tooltips.** `title="… use your browser's Print → Save as PDF"` on two
  buttons. A hover text is rendered text.
- **Entities.** `" per student &rarr; " + students` on every priority card.
  The source shows `&rarr;`; the page shows an arrow.

Neither is in `textContent`'s idea of the page, and neither is in a
screenshot at rest. A sweep over the markup sees both.

### `textContent` has no seams

The vocabulary guard — no `pool`, `money`, `apportion`, `pot` or the advance
concept anywhere rendered — passed with "the one institution pool" put back
into a ledger label. Not because the label was unrendered: because the label
ends where a button begins, and `textContent` joins the two with nothing —
`…the one institution poolRemove`. `\bpool\b` has no boundary to match. The
gate test had recorded the same trap on 2026-07-30 (`"$150,000held $147,606"`)
and the lesson had not traveled to the next guard. Now the sweep reads words
off the markup with a space where every tag was, and the mutation fails by
name. KB note:
[`methodology-the-text-a-reader-sees-is-not-the-text-a-test-reads`](kb-notes/methodology-the-text-a-reader-sees-is-not-the-text-a-test-reads.md).

The method that found it is worth keeping too: a mutation that "passes" is
first a question about the fixture, not the guard. Check that the mutated
branch renders at all (the ledger has a single-source branch and a
multi-source branch; only one shows in tests), and only then ask why the
guard let it through.

### A guard that dies cannot report — recurred, in my own suite

S219 wrote it down: the first draft of the ledger guard threw at an unguarded
call and the run ended before `finish()` printed. This session's first draft
did the same thing under mutation — with the Edit control removed, the click
on a null element crashed the process and the log showed no failure, no
summary, nothing. Every click on a control a regression could remove now goes
through a helper that records absence as a failure by name. The pattern is
general enough that it belongs in the harness one day; for now it is in the
suite, with the comment that explains it.

### The reserve note was relating two quantities without saying so

"$400,000" (the max award) sat in the row; "$132,000 held in reserve — this
college would have earned that on its main allocation" sat in the fourth
column of the drill-in, under the NC award. Two problems. "Main allocation" is
two-lane-era vocabulary (main vs feeder) and means nothing in the one-pool
model. And the sentence never said what the $132k was a part OF. Sam's fix
was placement — *before the $400k CR total, not on the NC total* — and the
wording followed: the figure now reads inside the gate sentence (*"$132,000 of
its max award — earned on the CPL this college has already posted in MAP — is
held in reserve, not lost, until it meets each of these: (1) … (2) …"*) and
again in the priority caption ahead of Total Possible. No standalone item, so
nothing lands under a column it does not belong to. The gate sentence also
stopped joining two curator-written requirement sentences with "and", which
had produced one unreadable clause; they are numbered now.

### Prose is not a dial

Every dial on the tab is editable by everyone — a signed-out visitor's edits
land in a per-browser overlay ("just start editing to explore"). The
eligibility introduction rode that convention as an always-open textarea,
which is why the tab greeted every visitor with an input box above the
requirements. The prose blocks deliberately do not: they render as prose for
everyone and offer Edit only to a signed-in reviewer. Exploring a sentence
has no modeling value, and a textarea is the least calm thing on a page.
Same storage discipline as the dials, though — `text.<key>` in the config
layers, so Reset and Publish treat words and numbers alike.

### Sam's question, answered from the code

*Does Publish reach the explainer?* Yes: the explainer boots the same engine
in a hidden mount and fetches the same shared config, so a published edit is
on it at the next load with no republish step. Two things worth knowing
beside that. When signed in, an edit saves to the shared config immediately —
Publish exists only for edits made before signing in. And the explainer
shares the dashboard's origin, so in the curator's OWN browser it also shows
the unpublished what-if overlay; it looks published from that chair and is
not, for anyone else, until Publish. The snapshot twin under `prototype/` is
the one copy that never updates.

### Shipped

`cpl_funding.js` (glyphs → words on every surface; the calm chrome; the
five prose blocks; the reserve placement; the vocabulary), both HTML shells
(the subtitle), `cpl_funding_public.html`, `funding-model/index.html` + the
payload (masthead tags painted), the snapshot twin (register only), seven
suites re-aimed, and `tests/cpl_funding_calm.test.js` (56 checks,
mutation-verified seven ways).

### Follow-up the same hour: the bound word beside the figure it bounds

Sam, on the row screenshot: *"Let's move the at cap and at base notes next to
the CR and NC total funding on main rows and put the note in parens (at cap),
(at base)."* The chip had sat by the institution's name — where it read as a
label on the college rather than on its award. It now renders in parentheses
after the figure in both award cells (the NC cell only when it holds a share;
"$0 (at cap)" would claim a bound on nothing), with the same hover text. The
NC only word stays by the name: that one is an identity, not a bound. The
footer legend and the cap suite followed the words.

## 2026-09-02 — Session 221 (SkyLead): lead with the table, and the default its author could not see

Sam's brief arrived as seven numbered items, with a screenshot of the Success
band, and a recommendation he wanted before deciding the first: *"I am
considering using the Explainer view as the public view … The only thing
missing from it would be to duplicate the college rows in the public view —
a bit more complicated than the current view but probably worth having it all
in one place."* Then: move the institution table *"up just after the intro
section, so folks don't have to scroll down through the steps to see it —
most won't care about the details, just their funding"*, on both the tab and
the public view; *"collapse all sections on open except the intro and college
table view"*; the Summary *"into the same box as the intro text"*; every
priority box *"the narrower width as is used for the 1st 2 priorities"*; the
Combined funding line gone with *"any necessary numbers"* moved to the band's
top row; and *"make sure the timing and strategies are included in the
Explainer (now public view)"*. One branch, one PR (#1436).

### The default its author could not see

The tab already opened with everything collapsed except the introduction and
the table. My BEFORE screenshot, from a fresh Chromium with no storage,
showed exactly that — the state Sam was asking for. He was asking anyway,
because on his browser it was not true: the section folds had been persisted
per browser since 2026-07-28 (`cplfund_sections_v2`), so every section he had
opened during six weeks of review stayed open on every visit since. The
author of a page with remembered toggles is the one reader who never sees its
default.

The fix is not a bigger default but a smaller memory: the open-state is
per VISIT now. A toggle survives the re-renders an edit triggers (kept in
memory — the reason the store existed), and a fresh open starts from the
default. The retired key is removed once on load so an old browser keeps no
dead entry. The guard for this is the one thing a screenshot could never
show: it seeds the old store with three sections open and boots, and requires
them closed. KB note:
[`methodology-a-remembered-toggle-hides-the-default-from-its-author`](kb-notes/methodology-a-remembered-toggle-hides-the-default-from-its-author.md).

### The hidden host was an embed waiting to happen

The explainer's every-institution table was the question behind item 1.
The page already loaded `cpl_funding.js`, booted the whole tab into a hidden
mount (`#cplFundHiddenHost`) to compute its payload, and then drew its OWN
four-column table from `rows` — a second implementation of the same rows,
which is the shape that drifts: S219 found its header mislabeled and its
sort order the opposite of the tab's. "Duplicate the college rows" read as
a request to write that copy a third time, with the drill-in.

The better answer was already on the page. If the engine is running, show
the engine's rendering: `window.CPL_FUNDING_EMBED = "college"` makes
`render()` emit only the college section body and its footnote into the
mount, which now sits in the Every institution section rather than hidden.
Same rows, same drill-in on the institution's name, same editable
introduction, same search, grouping, columns and Excel export — and nothing
to keep in step, because there is nothing to copy. It cost a flag, moving
the footnote into a function both hosts call, scoping the page's own table
CSS to `.tablebox` so it could not restyle the embed, and a `../`-prefixed
`CPL_TABS.loadScript` shim so the actuals load from one directory down.
The page's `draw()` and its search box went with the table they drew.

### The Combined funding line restated three figures

The screenshot's red line ran from *Combined funding: $8,329,302 for the full
2026–2028 window, earned against that same 2,948.6 CPL FTES target. Effective
$2,824.82/CPL FTES* up to the band head's *33% — $8,329,302 Total Possible*.
The head carries the window figure; the Target line carries the target; and
under front-load the effective rate IS the price line (*Funding factor 0.50 ×
the base rate — $2,824.82 per CPL FTES*), because the target is the window
figure divided by that price. The Current Total line still reads "of
$8,329,302 full-window Total Possible", so the card kept its own copy of the
window figure too. Nothing needed moving; the line was a fourth statement
of three numbers. Only the carryover year keeps a line, because a Year-2 card
with no funding on it has to say why.

The basis suite's "every stated rate matches its own funding ÷ target" guard
had been reading all three numbers from that one sentence. It reads them
from the card's three surfaces now — price line, Current Total line, Target
line — which is the stronger check: a reader has to be able to reproduce the
rate from what the card actually shows.

### R11, re-aimed a second time

R11 (2026-08-31) said the Summary is never inside a fold. S219 re-aimed the
guard once, when the introduction became a section that belongs above it.
Moving the Summary INTO the introduction re-aims it again, and the shape of
the argument is the same: the requirement was never "outside every
`<details>`", it was "never hidden on open". The introduction is the section
that is open on every visit — per-visit folds made that true for everyone,
not just a fresh browser — so the guard asserts the requirement directly:
inside the introduction, in no other fold, the fold open by default, and
every figure-bearing section still after it.

### auto-fit stretches a lone card

`repeat(auto-fit, minmax(260px, 1fr))` gives a band with two cards two
columns and a band with one card one column of the band's full width — so
Completion, alone in the Success band, read twice as wide as the two Access
cards above it. A fixed pair (`repeat(2, minmax(0, 1fr))`, one column below
560px) is what Sam described: every card the width of the first two, and a
lone card leaves its second column empty.

### A guard that dies cannot report — third recurrence, in my own suite

Twelve mutations, twelve caught. But under the one that dropped `strategies`
from `_prios()`, the new suite ended with a TypeError instead of a named
failure: the check that pushes onto the returned array assumed the array was
there. S219 recorded this, S220's first draft repeated it, and this session's
first draft repeated it again with the lesson in front of me. The fix is a
`return false` before the dereference, and the reason it matters is the same
each time: a crash reports nothing, and the run's exit code is the only
thing CI reads.

### Shipped

Sections: introduction (with the Summary inside) → institution table (with
its footnote) → window → breakdown → formula → eligibility → outcomes →
timing. Per-visit folds. Two-column cards. No Combined funding line. Embed
mode; the explainer's Every institution section hosts the tab's college
section directly after the introduction, its steps fold closed on open with a
Show / Hide word, its Step four paints the timing milestones and each
priority card its strategies, both from the payload (`_timing()`,
`_prios().strategies`) with a dial-change check so a typed copy cannot pass.
Both pages fit a 390px phone without sideways scroll. New suite
`tests/cpl_funding_lead_with_the_table.test.js` (29 checks); four suites
re-aimed; `funding_model_page.test.js` up to 37. The old public page
(`cpl_funding_public.html`) is untouched and still live — retiring it into a
redirect is the recommendation in the lane's NEEDS SAM ④, not this PR's
decision to make.
