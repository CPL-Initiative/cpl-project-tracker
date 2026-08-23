---
title: Session 185 handoff — two bounds, one dial fewer, a whole new noncredit lane, and Sierra is down
created: 2026-08-22
updated: 2026-08-23
tags: [handoff, session-185, funding, implementation-funding, allocation, noncredit, cobi]
kb-status: internal
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[docs/session_184_handoff]]"
  - "[[docs/cpl_funding_lessons]]"
---

# Session 185 handoff

You are **Session 185**. Session 184 was **SkyBound** — the CPL funding model,
two merged PRs (**#1293**, **#1297**).

⚠️ **Sam runs several sessions at once and did so all through 184.** Session 183
(SkyScope) shipped My College / Sierra scope (#1291); a *third* session started on
**Sierra from the My College tab** late on 2026-08-22. `git log origin/main` before
assuming your branch is the only work in flight — and note **`college_briefing.js`
changed in #1297**, so anything touching My College needs a fresh pull.

---

## What shipped

**#1293 — a maximum allocation beside the minimum.** Sam: move the explainer link
to the title row; add a **Max Funding** factor, editable, **$400,000**; recalculate;
*"push back and simpler recommendations welcome."*

**#1297 — the rural carve-out retires and the floor takes its place.** Sam, once
both bounds existed: *"we don't need the rural carve out since all are benefitting
from the floor… fold the funds into the total available."* Shipped **paired with a
floor raise to $175,000**, because the removal alone ran the wrong way (below).

| | |
|---|---|
| The dials | `pool.floor_window` **$175,000** · `pool.cap_window` **$400,000**, side by side in one box, `0` disables the ceiling |
| The solver | `allocModel()` bisects `lambda` in `clamp(lambda*size, floor, cap)` — both bounds at once, ceiling-off output bit-for-bit identical to the old loop |
| The bar | `capScale()` scales a capped college's targets to **cap ÷ `plainRatio`** so cap ÷ target is one rate for everyone above the minimum |
| Retired | the $1M rural allowance, its glyph, section, card, CSV column and curator control; the `rural` flag survives as data context only |
| Downstream | My College, `CPL_Data.js`, the explainer artifact (regenerated, republished to the same URL), `cpl_funding_rural.test.js` rewritten as a 33-check retirement guard |

---

## The findings, which matter more than the features

⭐ **A ceiling cannot lift a floored college.** $400K holds 6 colleges and moves
**1.1% of the pool**, none of it to the 45 then at the minimum. **The floor is the
lever** — its own limit is ~$210,785, the average award.

⭐ **The rural removal was two-thirds right.** Ten of 13 rural colleges moved **$0**
— the floor really was doing that work. Three sat *above* the floor, and the
released money re-splits to the **largest** colleges: regressive in direction while
"near zero" in aggregate. The $175K floor pays that cohort **$236,406 more** than
the carve-out ever did.

⭐ **A floor is not free.** At $175K, **69 of 115** colleges sit at the minimum,
**the median college IS the minimum**, and the unbound earn rate falls to **78.2%
of base** ($4,419 per CPL FTES against $5,649.63). A floor is a transfer priced in
the earn rate of the middle. At this floor the $400K ceiling binds **2 colleges,
$82,815, 0.34%** — nearly inert.

⭐ **The retired mechanism carried a second job no column shows** — the rural
allowance was the pool's only **unconditional** money, so those 13 went **$76,923
guaranteed → $0** while ten of their allocation figures did not move at all.

---

## 🔴 Open decisions — Sam's, not yours

1. **Move the noncredit dials.** All three are live in the box. The open one is the
   floor: $25,000 as shipped leaves 27 of 33 at the minimum; $20,000 halves the
   break-even. His call, and cheap to change.
2. **The credit pair** — $175K + $400K as shipped. The alternative (hold at $150K, send
   the freed $1M to noncredit) is no longer *needed* to fund the NC lane, since the
   ≥500 roster fits inside the existing $1,000,000 — but it is still his call.
3. **Nobody has opened any of this in a browser.** The sandbox is egress-blocked
   from the Pages host and from `*.supabase.co`, so the title-row link, the two-dial
   box and the rewritten explainer are verified by test and by reading only.
4. **Year-2 mirror for Scenario 2** — unchanged since S181.

---

## 🟠 Sierra is DOWN — check this first

Every model-backed smoke mode returns HTTP 400 *"Your credit balance is too low to
access the Anthropic API."* Confirmed on a fresh `main` dispatch. Non-AI modes pass,
so the function itself is healthy — it is **billing**, and **nothing alerts on it**:
`cpl-chat-smoke` runs only on dispatch or on a push touching cpl-chat paths. A
student asking Sierra a question today gets an error. `cpl_memory` row
`sierra-down-anthropic-credit-balance` is `verified`.

---

## The noncredit lane — asked as a question, now BUILT

Sam read the measurement and decided: *"Let's go with the NC>=500 with a $25k floor.
We can pull out the Mt SAC NC dup… This would mean we could retire the NC section
provided we could integrate the values on the college rows."* Then, offered a floor
number: *"Maybe we should add a funding box to make the NC>=500 a variable."*

**What it is now.** The noncredit lane was a flat FTES split of the $1,000,000
carve-out among four feeder campuses. It is the **same bounded allocation the credit
pool uses**, over every institution clearing an editable entry threshold — **33 at the
shipped dials: 30 credit colleges running their own noncredit programs, plus 3
standalone institutions.**

| dial | default | what it does |
|---|---|---|
| `nc_threshold_ftes` | 500 | who is in the lane at all |
| `nc_floor_window` | $25,000 | per institution, window |
| `nc_cap_window` | $100,000 | per institution, window; 0 disables |

⭐ **Noncredit is 111 institutions, not 4** — 108 of the 115 college rows carry
noncredit FTES. That is why the lane needs a threshold the credit pool has no
equivalent for: 111 floors of $25,000 is $2,775,000 against a $1,000,000 carve-out.

⭐ **A comment predicted the seam.** `solveAlloc`'s bounds functions were documented in
the ceiling work as *"the one seam a second pool would swap"* — so the new lane calls
`solveBounded({rows, keyOf, sizeOf, net, floor, cap})` and the credit lane became a
five-line caller. `cpl_funding_cap.test.js` still asserts the ceiling-off output matches
a transcription of the original pin loop, which is what proves it moved no dollar.

**Where the money shows.** Its own `NC $` column on the college table, its own two
columns in the CSV, its own line on My College, and a three-row block for the
standalone institutions where the feeder section used to be. **Never summed into the
credit total** — Sam's *"neglected step child"* constraint made structural.

### ⚠️ Three things this run learned the hard way

- **A dedup has a SCOPE.** Removing Mt. SAC NC's duplicated FTES by deleting its roster
  row **erased its real $50,000 ESS 25-82 seed grant** — caught by a test on a
  completely different surface. The FTES was the duplicate; the institution was not. It
  now carries `nc_ftes_on_credit_row` and renders *"counted on the Mt San Antonio row"*,
  because a zeroed row and a missing row look identical.
- **The CSV's total row had been one cell too wide for months** — three empties against
  two headers on the SYSTEM row and every district subtotal, so every figure from that
  point right sat under the wrong heading in the one row a reader checks first.
  Invisible in the browser; you have to open the file. Guarded now by a field-count
  check in both shapes.
- **27 of 33 sit at the floor (68% of the pool) and growth only starts paying at 3,022
  NC FTES.** Sam's stated reason for the lane was the incentive for small programs to
  grow, so the model reports `breakEven` and the box prints it. The incentive is at
  ENTRY (crossing 500 earns $25,000); in the middle it is flat. **If he wants growth to
  pay across the range, the floor is the dial** — $20,000 halves the break-even to 1,762
  FTES and leaves 54% of the pool responsive to size.

⚠️ Still true: *"only what came from the NC landing pages"* is a rule the feed cannot
distinguish yet — Sam expects the origination data from MAP Custom Reports next week.
FTES is the SIZE basis, not the metric.

⚠️ Narrowing the threshold far enough makes the pool unspendable (7 institutions × a
$100K ceiling cannot absorb $1M — $300,000 stranded). The solver surfaces it and the box
warns; pinned by a test. It is the one way moving a dial silently strands money.

## Read in this order

1. `CLAUDE.md` §11 — the **Implementation Funding** row (current truth; rewritten
   and trimmed twice this run to stay under the 4,000-char lint).
2. [`docs/cpl_funding_lessons.md`](cpl_funding_lessons.md) — the two 2026-08-22
   sections carry every measurement table and trap.
3. [`a-second-bound-breaks-a-pin-as-you-go-solver`](kb-notes/methodology-a-second-bound-breaks-a-pin-as-you-go-solver.md)
   and [`a-mechanism-that-looks-redundant-may-be-carrying-a-second-job`](kb-notes/methodology-a-mechanism-that-looks-redundant-may-be-carrying-a-second-job.md)
   — the durable halves.
4. `docs/session_184_handoff.md` — SkyScope's concurrent run.

---

## Patterns that worked

- **Measure the policy before you build it.** Twice this run a probe over the live
  roster changed the recommendation: "add a $400K cap" became "here is what it does
  and here is the dial that does more", and "drop the rural carve-out" became "yes,
  but only paired with a floor raise." Both measurements were the deliverable Sam
  did not ask for and most needed.
- **Make a solver migration bit-for-bit provable.** Bisect to find the bound SETS,
  then compute the free rows with the *old* arithmetic, and assert `0.000e+0`
  against a transcription of the old algorithm rather than a stored snapshot.
- **Break your own checks.** **Four vacuous checks found in two sessions on this
  one tab** — every one a threshold that moved out from under an assertion naming a
  specific number. Fifth consecutive session to find a check that cannot fail.
- **Read the lint's complaint about your own edit.** `stacked_roadmap_cell` and
  `unindexed_kb_note` both fired on this run's work; both fixed before commit.

## Safety patterns to honor

- **Rule 4**: `CPL_Dashboard.html` and `index.html` byte-identical.
- **Rule 5**: never force-push `main`.
- **Merge on `unstable`**, not just `clean`.
- ⚠️ **The explainer is a SNAPSHOT.** Any change to shares, factors, order or the
  bounds means: pull the live config via the Supabase MCP, run
  `node prototype/build_funding_model_explainer.js <config.json>`, then republish to
  `SANITY_URL` in `cpl_funding.js`. The Artifact tool refuses a publish until you
  have READ the live version in the same turn.
- ⚠️ **`_alloc()` reads a CACHED model**; `_model()` clears it. A probe that calls
  `_setScenario()` then `_alloc()` measures the *previous* settings.
- ⚠️ **A marker is load-bearing text.** A comment quoting a retired phrase broke the
  test that greps the source for it.
- ⚠️ **`; echo "EXIT=$?"` reports the last pipe stage, not `npm test`.** It masked a
  real failure this run.

---

## Moniker

**SkySolve** is going if you want it — 184 was about what a solver can and cannot
promise once you give it a second bound. Take it, take your own, or use whatever
Sam names in his greeting.
