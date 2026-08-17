---
title: College action page & MAP-team queue — lessons
created: 2026-08-09
updated: 2026-08-17
tags: [lessons, college-action-page, map-team-queue, governance, contacts, measurement]
artifacts:
  - map_team_queue.js
  - kb/map_team_tracked.json
  - kb/supabase_sierra_feedback_ci_status.sql
  - tests/map_team_queue.test.js
  - tests/sierra_feedback_ci_rows.test.js
  - college_briefing.js
  - tests/college_briefing_auth.test.js
  - tests/my_college_scope.test.js
related:
  - "[[docs/kb-notes/methodology-a-written-backlog-decays-silently]]"
  - "[[docs/kb-notes/methodology-a-sweep-scoped-by-a-proxy-leaves-a-shadow]]"
  - "[[docs/session_132_handoff]]"
---

# College action page & MAP-team queue — lessons

The workstream Sam framed as **one engine, two audiences**: colleges need *what
should I do next* (a briefing, leads with opportunity); the MAP team needs
*what's waiting on me* (an inbox, leads with age). This doc is the scratchpad
for both halves. Append a dated section every checkpoint.

---

## 2026-08-09 — SkyTime / SkyDesk (Session 131): the inbox half, and why it measures

### What shipped

- **#1072** — CI smoke rows no longer enter the Sierra feedback queue. Fixed at
  the **write path** (`sierra_feedback_upsert` stamps `status='ci'` when
  `page='smoke'`), not at display time. 43 existing rows backfilled. Queue went
  from a 66-row headline to **23 real open · 4 addressed · 43 CI**.
- **#1073** — the **📥 MAP Team Queue** tab. `buildQueue()` is a pure engine
  (sources + `now` in, ranked items out) intended for reuse by the college half.

### ⭐ The finding that set the design

The session-130 handoff carried the MAP team's backlog as prose. Measuring all
six items first — about fifteen minutes of SQL — found **two already wrong
within two days**, and a third wrong in a way that mattered more:

| Handoff | Measured 2026-08-09 |
|---|---|
| "every governance owner unset" | **17 of 17 assigned.** Team filled them Aug 5 + 7 |
| "6 open Sierra feedback rows" | **23** real (9 thumbs-down) |
| "56 proposed contact fills" | **14.** 42 of the 56 are colleges MAP already covers |
| "15 unroutable colleges" | **11**, only **4** looked-up-and-empty |

The governance row is the sharpest: that register's own **OQ-01** asks *"who owns
each row above?"* and it had been **answered by people, in the system**, while
the document still listed it as the outstanding work. Distilled into
`methodology-a-written-backlog-decays-silently`.

**So the tab's one rule is: measure at load, never carry a list.** Items with no
live source live in `kb/map_team_tracked.json`, rendered separately **with their
staleness**, so an unconfirmed item looks unreliable rather than authoritative.

### ⭐ The seven colleges nobody had looked up

The contact sweep scoped to *"colleges without a CPL Assistant"* — a **proxy**
for the actual need, which is *"colleges where `primary_contact_email` is
blank"*. The two come apart on **7 of 25 rows (28%)**:

```
no primary_contact_email                25
  ├─ swept, contact found               14   → proposal waiting on the MAP team
  ├─ swept, nothing usable              4    → needs a human
  └─ NEVER SWEPT                        7    ← Citrus · College of the Canyons
                                              · Palomar · Saddleback · Yuba
                                              · Futuro Health · Launch Apprenticeship
```

Having a CPL Assistant does not mean MAP can route a student — different fields,
different people, different times. These are the **cheapest** items on the whole
backlog (one lookup each) and they were invisible because the sweep's artefact
counted its own batch, not the population. Distilled into
`methodology-a-sweep-scoped-by-a-proxy-leaves-a-shadow`.

### Two properties the tab turns on

- **A failed read is not an empty queue.** A source that doesn't load renders
  `unknown` and sorts to the **top** — never `0`. Collapsing those is how a
  queue quietly reports itself clear from data it could not fetch.
- **A cleared item stays visible, marked clear**, so "nothing waiting" and
  "nothing measured" never look the same.

Both are the same family as the `STUDENT GRAIN LEAKED` false positive SkyMind
shipped at a PostgREST timeout, and both have positive controls in the test.

### What I got wrong

Two assertions in `tests/sierra_feedback_ci_rows.test.js` failed on first run,
and **both were my assertions, not the code**. The instructive one: the SQL
check `/on conflict[\s\S]*?set[\s\S]*?status\s*=/` ran past the function body and
matched step 3's legitimate backfill — the *proxy-instead-of-property* mistake
`methodology-a-guard-that-fails-on-truth-gets-muted` describes, committed while
that note was open in the same session. Fixed by scoping the match to the
`ON CONFLICT` clause and adding a positive control that the clause still updates
`rating`/`note`/`audience`, so a regex matching nothing cannot pass.

Also: I wrote `CPL_TABS.show()` from memory. The real API is `navigate()`. It
would have failed **silently** into the hash fallback, which half-works — caught
only by grepping `tabs.js` before committing.

### Current state

The queue reads, against live data:

```
23  39d  Sierra reports untriaged        person waiting
14   4d  proposals for the MAP team      person waiting
 7   4d  colleges never looked up        person waiting
 4   4d  nothing usable found            person waiting
 1   2d  cadence decided, never run
 3   2d  hand-tracked (Malone's view name + 2)
 0   2d  governance owners — CLEAR
 1   1d  data age — clear
```

### Next concrete step

**The college-facing briefing**, on the same `buildQueue()` engine with
college-scoped sources and an opportunity-first renderer. Design calls already
made and not to be re-derived: open with a **rendered briefing, not a blank chat
box**; role is a dropdown that **tailors but never gates**; the **action library
is the hard part** — seed it from the IFM P1/P2/P3 strategies rather than
inventing to-dos; the $35M priorities are **read at runtime** from
`cpl_funding_data.js` ⊕ `cpl_funding_config`, never pasted.

⚠️ Its top slot — **inbound CPL requests** — needs the nightly feed, which is
blocked on Malone's view name. That blocker is now item 6 on the queue, aging in
public where somebody will see it.

## 2026-08-09 — Session 132 (SkyHigh): the action library was already written

### The premise this session checked

The handoff named the action library as the hard part — *"we know each college's
STATE; we do not have the playbook that moves it"* — and recommended seeding it
from the IFM P1/P2/P3 strategies by hand. Before inventing anything, I looked for
those strategies in the repo, per the standing rule that the best recent catches
came from re-reading a committed artefact rather than generating a new one.

**They exist, fully written, and the team typed them.** Supabase
`cpl_funding_config`, Scenario 1, Year 1: **10 P1 strategies, 7 P2, 6 P3.**
Concrete and college-facing —

> *"Act on all JST credit recommendations in MAP"* · *"Configure College CPL
> Landing site, including adding a CPL Request Email"* · *"Batch upload to MAP
> all transcribed CPL from 2023-24 to date"* · *"Ensure a CPL Coordinator and/or
> Counselor is listed and responsive"* · *"Find top 15 ACE credit
> recommendations and route to faculty for articulations"*

### ⚠️ And the documented source is the wrong one

CLAUDE.md and the handoff both say the overlay is *"currently EMPTY so defaults
stand."* It is not, and the active scenario disagrees with the baked defaults on
nearly everything a briefing would print:

| | Baked `cpl_funding_data.js` | Live Scenario 1 |
|---|---|---|
| Shares | P1 30% · P2 42% · P3 28% | P1 **50%** · P2 **30%** · P3 **20%** |
| P1 description | completion through CPL awards | consistent statewide **access** |
| P1 metric | Headcount eligible | **Applied CPL Units as FTES** |
| Strategies | none | **23** |

A briefing built off the documented source would have shown wrong priorities,
wrong weights and wrong measures — while being able to point at a file and claim
it was sourced. Distilled into
[`methodology-verify-the-last-hop-of-a-resolution-chain`](kb-notes/methodology-verify-the-last-hop-of-a-resolution-chain.md).

### Why this makes the briefing tractable

Each strategy maps onto state already measured, so every to-do can be a
**fraction rather than a checkmark** (SkyPlan's rule — the Veteran Star taught
colleges that uploading is the finish line):

| Strategy | Measured today |
|---|---|
| Configure CPL Landing site | which colleges have a live landing page |
| CPL Coordinator listed *and responsive* | `primary_contact_email` blanks, incl. the 7 from #1078 |
| Act on all JST credit recommendations | 1,051,870 units at Needs Action |
| Complete the Transcribe step | applied 111,779 → transcribed 60,246 (**54%**) |

### Two decisions still open (Sam's, asked and not yet answered)

1. **Scenario 1 or Scenario 2?** They carry different shares *and* different
   strategies. Scenario 1 is the code default (`activeScenario`).
2. **Year 1 or Year 2?** Scenario 1's **Year 2 has no strategies at all** — so a
   briefing aimed at the year ahead has an empty action library today.

### Also flagged, deliberately not fixed

Typos in the team's typed strategies: `"reuqests"` (×2), `"Support A&R and VRC
staff **is** CPL efforts"`, and one empty-string strategy in P2 Year 1. Curator
content — flag, don't silently edit.

### Next concrete step

Build the briefing shell against **Scenario 1 / Year 1**, reusing
`buildQueue(sources, now)` rather than forking the ranking rules, and resolving
priorities through the **full** chain including the overlay. The top slot
(inbound CPL requests) stays blocked on Malone's view name.

### Addendum, same day — two corrections found while building

**1. The config path in the section above is wrong.** Real location:
`config.projects."cpl-implementation".scenarios."Scenario 1".yearPriorities."1"`
— camelCase, three levels deeper than `config.year_priorities`. `config`'s only
top-level key is `projects`, so the documented path returns `null`, which is
**indistinguishable from the empty overlay the docs also claimed**. Two wrong
statements that corroborate each other. Corrected in CLAUDE.md and in the KB note.

**2. ⭐ `CPLStatusPlan` is in hand and always was — Sam's probe, 2026-08-09.**
`map_college_cr_unit`, **204,714 rows, zero nulls**: Needs Action 182,941
(1,053,332.50 potential units) · Not Applicable 15,272 · Applied to CPL Plan
4,572 (111,778.65 applied → 60,246.45 transcribed) · In Process 1,929. It arrived
via **Sam's Access import**, not the API. The standing line *"`CPLStatusPlan` is
in NONE of the nine views"* is true **only of the API views**, and **two sessions
read it as "we don't have the disposition data"** — so the briefing's disposition
content was never blocked. Only **freshness** is. Sam: *"I've been wondering why
you were waiting so hard on Malone's side of the deal."* Fair. Keep *do we have
it* and *is it fresh* apart, in that order.

**Reconciliation done before any of it reaches a college's screen.**
`map_college_cr_unit` (raw) and `map_college_credit_summary` (suppression applied
at write time) differ by **1,462.50 units** — and it resolves exactly: the 98
unsuppressed colleges match to **0.00**, and the whole difference is the 13
suppressed colleges the summary zeroes. Disclosure control working.

⚠️ **But one published number does not reproduce.** Of the four in the standing
NUMBER POLICY, three are exact — dormant published 1,051,870 ✓, articulated
published 63,991 ✓, articulated unsuppressed 64,074 ✓ — and **dormant
unsuppressed is 1,053,332.50, not the documented 1,052,531**. The policy says to
publish both totals, so that figure is on a path to a public surface with no
query behind it. **Decide the number before the chip ships.** (k≥3 holds
comfortably: 13 suppressed colleges, 41 students among them.)

**Build consequence:** the briefing reads `map_college_credit_summary`, the same
suppression-applied table the 🎓 tab and Sierra use, so it cannot drift from them.

### Live config writes, 2026-08-09 (SkyHigh) — audit trail

Two writes to the shared Supabase `cpl_funding_config`, both on Sam's explicit
instruction the same day. Recorded here because that row is read by the funding
tab AND the new College Briefing, and a config change leaves no PR trail.

1. **Year 2 strategies filled** (Sam: *"Same strategies for year 2 as year 1"*;
   then *"I didn't set year 2 strategies because it was a lot of copy paste"* —
   which is exactly why it stayed empty). Copied Year 1 → Year 2: **10 / 6 / 6**.
   P2 is 6 not 7 because the empty-string entry was dropped rather than
   propagated as a blank bullet.
2. **Year 2 metrics mirrored to Year 1** (Sam: *"Year 2 metrics and strategies
   should mirror year 1. I changed them 2 days ago"*).

3. **Full mirror completed** after Sam escalated the instruction twice —
   *"Yah mirror them. I'll get in and correct it"*, then **"Year 1 is the
   authoritative set"**, under the framing *"a 2-year project with unchanging
   priorities, metrics, strategies"*. End state verified: the two year objects
   are **byte-identical** (`yearPriorities.1 = yearPriorities.2` → true),
   **22 strategies each**.

   Three further edits, all named because two of them changed Year 1:
   - **Y1 P2's blank strategy removed** — 7 entries → 6 real ones.
   - **`target_rate` 0.03 copied Y1 → Y2.** ⚠️ This one feeds **funding math**,
     not display: `per_student = (share × perYear) ÷ (totalHeads × target_rate)`.
     Y2 P3 previously had none. Scenario 2 Y1 also carries 0.03.
   - ⚠️ **Y2 P3's description was copied UP into Y1** — done under *"mirror
     them"*, BEFORE *"Year 1 is authoritative"* arrived. Under the final rule the
     strictly correct move was to delete it from Y2 instead. The end state is
     self-consistent (both years carry it; it matches the P3 title) but **Year 1
     gained prose Sam did not put there**, so it is flagged rather than left to
     be discovered.

**Sequencing lesson.** Three instructions arrived in three messages, each
widening the last, and acting on each as it landed produced one edit in the
wrong direction. Nothing was lost — but with a curator actively typing, the
cheap move is to let an instruction settle for one exchange before writing to a
shared table, or to make the reversible edit first (add, don't delete) so a
later refinement costs nothing. Adding rather than deleting is what saved this
one.

⚠️ **Side effect worth knowing:** the metric mirror dropped Year 2's
*"(1 Unit = .0334 FTES)"* conversion text, since Year 1's wording omits it.

⚠️ **Still typos, still not silently edited:** `"reuqests"` and *"Support A&R and
VRC staff **is** CPL efforts"* — and the mirror has now **duplicated both into
Year 2**, so fixing them is four edits rather than two. Offered to Sam; curator
text, so his call.

**Method note.** Both writes were surgical `jsonb_set` on specific paths, never a
whole-object overwrite — the config is Chancellor/team-editable and a blind
rewrite would clobber concurrent curator edits. The first was additionally
guarded (`where … strategies is null`) so re-running it could not overwrite real
content. `updated_by` records the instruction verbatim.

### The number policy figure, corrected

Sam: *"OK to go."* Dormant-unsuppressed is **1,053,332.50**, not the documented
1,052,531 — which reproduces from no query. The other three figures in the policy
verify exactly. CLAUDE.md now carries the derivation and says to **re-derive both
totals rather than quote them**, since they move with every refresh.


### ⚠️ Correction to the correction — the number was right all along (2026-08-09, same session)

**I merged a wrong "fix" in #1087 and reverted it within the hour.** Recording it
because the failure is instructive and I had the disproving fact in hand.

The standing figure was **dormant unsuppressed = 1,052,531**. I measured
1,053,332.50, could not reproduce 1,052,531, and called it unreproducible. It
reproduces **exactly** — scoped to `entity_kind = 'college'`:

| `entity_kind` | Entities | Dormant | Articulated |
|---|---:|---:|---:|
| **college** | **106** | **1,052,531.00** | **64,074.00** |
| continuing_education | 2 | 325.00 | 0 |
| *(absent from `map_colleges`)* | 2 | 432.50 | 0 |
| partner | 1 | 44.00 | 0 |

**The disproving fact was in the memory row I was correcting.** It said
*"across 106 colleges"*; I measured 111 and treated the mismatch as evidence the
NUMBER was wrong rather than as evidence the SCOPES differed. A count that
disagrees alongside a total that disagrees is not two errors — it is one scope.

**And the fix was worse than the defect.** Articulated (64,074) is college-scoped
too, so publishing an all-entities dormant beside a college-scoped articulated
made the pair internally inconsistent — worse than either basis applied
consistently. **Never change one half of a pair alone.**

**Root cause, and the actual repair:** the figure was published *without its
scope*. That is what made a correct number look unreproducible and invited a
"correction". The revert therefore restores 1,052,531 **and attaches the
derivation**, which is what should have been there originally — the same
prescription as
[`methodology-verify-the-last-hop-of-a-resolution-chain`](kb-notes/methodology-verify-the-last-hop-of-a-resolution-chain.md):
document how to CHECK a figure, never just the figure. I applied that lesson to
someone else's number and not to my own conclusion.

⭐ **Sam identified the excluded set on sight** — *"106 may be due to the NC
campuses and agency landing pages for Futuro and LAUNCH"* — which is confirmed:
SD CCE (119) + North Orange CE (121) as `continuing_education`, and Launch (132)
/ Futuro (133) as `partner`. Domain knowledge beat my measurement to the
explanation.

**Two findings fall out of it:**
1. **Ids 122 and 131 are absent from `map_colleges`** (128 rows, max id 133), and
   hold **432.50 dormant units** between them. This is the roadmap's open "name
   colleges 122/131" item — now with a measured cost attached.
2. `map_colleges` carries **8 `entity_kind='test'` rows**. None have credit data,
   but a query filtering `!= 'college'` instead of `= 'college'` sweeps them in.

⚠️ **122/131 are NOT Futuro and Launch.** Sam's guess, and a reasonable one given
the id neighbourhood — but refuted: **Launch is 132** (12 rows, 44.00 dormant)
and **Futuro is 133** (named, and carries *no* credit data). So `map_colleges`
(128 rows, max id 133) is **incomplete relative to the credit data**, which has
111 distinct ids. Resolving these two needs **MAP's current college list**, not
more inference from id adjacency — the sync either missed them or they postdate
it. Worth doing: **122 holds 417.00 dormant units across only 3 exhibits**, an
unusually heavy per-exhibit load that is interesting independent of the naming.

Note this is the mirror image of the mistake three paragraphs up: there I
distrusted a correct figure, here a plausible identification is wrong. Both are
resolved the same way — measure the scope, don't reason from the neighbourhood.


### ⚠️ Unidentified entity 122 is INSIDE the published total (2026-08-09)

Raised by Sam — *"One possibility is our sandbox location CA MAP Initiative, but
that should be suppressed in reporting...sometimes slips through"* — and the
check says the risk is real for exactly one entity.

Of the five non-college entities in `map_college_credit_summary`:

| id | Name | Suppressed | Students | Dormant |
|---|---|---|---:|---:|
| **122** | **(absent from `map_colleges`)** | **NO** | **117** | **417.00** |
| 119 | San Diego CCE | yes | 4 | — |
| 121 | North Orange CE | yes | 1 | — |
| 131 | (absent) | yes | 3 | — |
| 132 | Launch Apprenticeship | yes | 2 | — |

**Four are suppressed by k=10 and contribute nothing. 122 is not, so its 417.00
units are inside the published 1,051,870.** k-anonymity suppressed the small
partners as a side effect of them being small — it is not an entity-type filter,
and nothing else is filtering by type on that path.

**Not the sandbox, probably:** `CA MAP INITIATIVE COLLEGE` is id **120**,
classified `test`, and has **no credit data at all**. 117 students is also a lot
for a sandbox. But "probably" is doing real work in that sentence, and the entity
is unnamed.

**Do not silently drop it.** 417 of 1,051,870 is 0.04% — immaterial to the
headline, and removing it unilaterally would change a published number to fix a
suspicion. The decision is Sam's, and the options are: (a) name 122 and classify
it, which resolves the question outright; (b) filter the published aggregate to
`entity_kind = 'college'`, which is what the *unsuppressed* figure already does
and would make the two bases consistent; (c) accept it and note it.

⭐ **The transferable point: k-anonymity is not a type filter.** Small non-college
entities got excluded here by luck — they happened to be tiny. A large partner or
a seeded sandbox would sail straight into a published college total. If the
number means *colleges*, filter on **entity kind**, and let suppression do only
the job it is for.

---

## 2026-08-11 (SkyBridge, Session 140) — the funding box, and why a plausible dollar figure is the dangerous kind

The four threads #1115 deferred. Three built (funding box · district picker ·
Ask Sierra); the fourth — student CPL request uploads — is still blocked on a
portal feed that does not exist in Supabase, so it stays unbuilt rather than
faked.

### ⭐ The handoff handed me a number, and the number was wrong

Handoff 139 modelled Bakersfield at **≈$426K**, derived as 1.83% of the $23.24M
pool from 46,171 headcount, and flagged the **$150K floor waterfall** as the
thing to resolve before shipping. That warning was correct and it was
understated. Resolved against the live model:

| College | Flat proportional | Model | |
|---|---:|---:|---|
| Palo Verde | $59,742 | **$150,000** | pinned at the floor |
| Lassen | $34,985 | **$150,000** | pinned at the floor |
| LA Southwest | $113,262 | **$150,000** | pinned at the floor |
| Bakersfield | $426,196 | **$414,856** | **not floored — still wrong by $11,340** |
| Mt. San Antonio | $772,869 | **$522,239** | not floored |

**50 of 115 colleges are pinned at the floor** — the flat figure is wrong for
43% of the state outright. The part worth keeping is the last two rows: the
flat figure is *also* wrong for colleges the floor never touches, because the
floor's **$1,999,687** cost is funded out of the same pool, so every unfloored
college's proportional share is reduced. **A derivation can be wrong for
colleges its special case does not apply to.** I would not have predicted that
from reading the rule; it fell out of running the model.

The failure mode this avoids is specific: $426K is *plausible*. Nobody at
Bakersfield would have queried it, and it disagrees with the Implementation
Funding tab by an amount too small to notice and too large to be rounding —
the same shape as the Sierra CompTIA answer that was accidentally correct.

**So nothing on this page derives a dollar.** `cpl_funding.js` gained a small
read-only API (`onModelChange` / `ensureLoaded` / `_ess` / `_grant` /
`_isRural` / `_district`) and the briefing renders what it returns.
`ensureLoaded()` reuses the module's own `boot()`, so the briefing reads the
**same** figures the funding tab shows, ledger overrides included; the sidecars
land async, hence the subscription. Independent cross-check: Mt. San Antonio
returns **$522,239**, matching the figure the Sep-BOG workbook reconciliation
settled on by a completely different route.

### ⭐ The join was the real risk, and measuring it found a defect in the resolver

The funding roster keys colleges by short name (`Bakersfield`), the briefing by
MAP's full name (`Bakersfield College`). An unchecked join does one of two
things, and the second is much worse than the first: it drops a college
silently, or it attaches **one college's money to another**.

Both sides now resolve through `cplCollegeShort()` — the curator-owned
crosswalk — rather than a private guess. Measured against the real rosters:
**115 of 116 MAP colleges reach a distinct funding row, 0 collisions on either
side, 0 funding rows orphaned.** The residue is Calbright, a noncredit feeder
genuinely off the 115-college credit roster; it renders as its own state.

Running that measurement is what exposed the defect. The **first** attempt
resolved only the MAP side and matched against raw roster strings — 110 of 116,
with 5 misses that were spelling drift *inside the roster* (`Reedley College`
vs `Reedley`, `LA Swest` vs `LA Southwest`, `MiraCosta` vs `Mira Costa`).
Running **both sides through the resolver** took it to 114, and the last one
exposed the actual bug: the JS resolver indexes `canonical` + `aliases`, while
its Python twin (`funding/_build_funding_performance.py`) also indexes `short`
and `short_caps`. So **the resolver could not round-trip its own output** —
`cplCollegeShort("LA Swest")` fell through to the safe fallback, returned the
input, and any caller joining two datasets through it lost Los Angeles
Southwest College entirely. Fixed in `kb/_seed_college_short_names.py` and
regenerated; verified collision-free (146 normalized keys, 0 conflicts).

⚠️ **A "safe fallback" is only safe for the caller it was written for.**
Returning the input unmatched is right for a chip (never render blank) and
quietly wrong for a money join (the row vanishes). The fallback did not change;
the second caller arrived. That is why `fundingFor()` distinguishes
model-not-loaded from off-roster from a real figure — three states that a
single `null` would have collapsed.

### The ESS outcomes are fractions

The $50k row's build rule, earned from the Veteran Star: **every step a
fraction, not a check.** Outcome 2 now reads *"2 articulated of the 84
statewide credit recommendations in MAP · 3 more available to adopt"* — where
you are and what is left, from data the page already held. A bare ✓ is what
taught colleges that uploading is the finish line.

### Current state

Live on `#college-briefing` behind the team gate: the $50K seed grant (with
`declined` as a real state, not $0), the implementation allocation labelled a
**cap, not a cheque**, with floor / rural-allowance / participation-gate all
named; a 72-district picker that narrows the college list and lists a
district's colleges **alphabetically, never ranked**; and four Ask-Sierra
deep-links that reuse `cpl_chat.js`'s existing `cplSierraTestQ.v1` prefill —
**one chat instance, one set of audience rules, and the question is not sent**
so it can be edited first. `tests/college_briefing.test.js` **49 → 87**, with
the join assertions running against the real shipped rosters so drift fails in
CI, not on the page.

### Next concrete step

The student-request box needs a portal feed before it can be built — that is a
MAP-side ask, not a build. Otherwise: **EACR's `statewide_prescriptive.js` →
Supabase** (carryover 2), which would turn "adopt CompTIA A+" into "adopt it
against CIS-25, which you already run" on both this tab and Sierra.

---

## 2026-08-11, later (SkyBridge) — the session where Sam drove the design live

A long working session with Sam reacting in real time. Eleven steers, each one
correcting or sharpening the last. What survived is worth more than the code.

### ⭐ The corrections that mattered most

**"Transcribed" in MAP is a MARK, not a posting.** A college checks the
Transcribe step when it judges the CPL on a plan ready, then **forwards the plan
to Admissions & Records, who enter the credit in the college SIS by hand**.
There is **no SIS integration with MAP**, and closing that gap is hard because
SIS setups and the coding of transcribed CPL differ markedly college to college.
The tab had said *"Written onto the transcript"* and *"have not reached the
transcript yet"* — asserting what MAP cannot know, and worse, telling a
coordinator A&R's step was already handled. Fixed in #1118, guarded by four
checks.

The *why* now sits on the page, because without it marking a box reads as
duplicate data entry: **MAP is the only real-time view of the CPL lifecycle.**
The alternative is CO MIS reporting, which lags a semester to a year and is
widely under-reported and mis-coded — hence the long-term goal of reconciling
MAP to MIS.

**"Without making it sound like gaming."** Priority 3 pays on students arriving
through the Student Portal or a college landing page. Colleges can move it fast
by routing students they already work with through those pages. Sam's first
steer was *state that plainly*; his second was *don't frame it as a shortcut* —
and the second was the better instinct, because **routing existing students
through the public pages is not working the system, it is adopting the process
the system is standardizing around.** Accepted deliberately: it defeats the
primary purpose (community visibility) but standardizes procedures and
technology, which is the long-run win.

**Not "$35M" — the tab names.** *"That's just the term I use with you."* The
pools are **2025–2026 $50K Seed Funding** and **2026–2028 College
Implementation Funding**, lifted from the sub-tab buttons.

**Sierra AI, not Sierra.** *"Just didn't want it to be confused with Sierra
College."*

**Show the contacts, don't withhold them.** The `ctx=external` suppression is
for vendor embeds; a college's own view should show who MAP has on file so they
can keep it current.

### ⭐ Measurements that changed a design decision

**The allocation is a floor waterfall, and a flat figure is wrong for colleges
the floor never touches.** 50 of 115 colleges are pinned at the $150K minimum,
and the floor's $1,999,687 cost comes out of the same pool — so Bakersfield, not
floored, is still off by $11,340. Never re-derive; call `_alloc()`.

**A rate-based percentile hands a top-5% badge to a college with 21 students.**
Compton is 96th percentile on disposition rate with 21 students; Chaffey is 97th
with 1,495. 26 of 111 colleges have fewer than 30 students. And the bottom half
is degenerate — median 4.5%, p25 0.3%, 16 tied at exactly zero. **Recognition at
the top is meaningful; a band anywhere else is noise wearing a rank.**

**The existing tier system already exists and 77% of colleges are in one
bucket** — Leading 14 / Advancing 89 / Inactive 12, from ≥3 of 5 criteria
computed off the CCCCO Dashboard API. Three of the five are size; two are
transcribed, colliding with this project's own "never rank on transcribed" rule.
The fix is not a new scheme: show *"Advancing — 2 of 5"* with the missing three
named, which turns a meaningless bucket into a to-do list.

**For most colleges MAP undercounts, not MIS.** 87 of 111 have marked zero
transcribed. So a MAP↔MIS side-by-side will mostly show MIS *above* MAP — which
is a **stronger** argument against "double work," not a weaker one: the college
is already doing the work and MAP cannot see it.

**The waiting pile is almost all elective and PE.** Bakersfield's 4,306
"articulated and waiting" units are three recommendations — GE Elective (3,073),
PE (876), GE Elective again (357). Statewide the top 12 buckets are ~69% of the
pile and nearly all GE/health/PE/lifelong-learning. The lead box calls this "the
cheapest credit you will ever give" and should probably say what kind it is.

### On the student-list question

Sam asked whether we could list the students who could be awarded credit now.
**No, for three reasons and the third is the one that would bite us:** the data
carries only a surrogate `student_key` (no names, by design); it is 545 students
at Bakersfield, not a short list; and **the tab is gated by a shared team
phrase, so anyone signed in can pick any college.** What shipped instead is the
grouping a coordinator acts on — approve the recommendation, and every student
behind it moves.

### Current state

Live: Sierra AI embedded at the top of My College (`mountInto` on
`cpl_chat.js` — one assistant, two mounts), pickers inside it, suggested
questions computed per college, and "Who MAP has on file" with de-duplication.
Mock carries three more sections not yet ported.

### Next concrete step

Port the funding-pool breakdown, the waiting-credit list and the resources
section from the mock. Then the access shape: a per-college URL with **no
picker**, `noindex`, team members keep the picker.

---

## 2026-08-11 — SkyLink (Session 141): the lead figure was one decision, not three hundred

### What we learned

**1. Nobody had asked what the headline number is made of.** `articulated_waiting`
has been the page's lead figure for three sessions, described as *the cheapest
credit you will ever give a student*. One `group by course_type` over
`map_college_cr_unit` — filtered exactly as `kb/supabase_map_college_credit_summary.sql`
filters — showed **98.8% of all 64,074 units is Credit for Basic Military
Service**: 87.7% to a GE/graduation area, 10.5% to elective, 0.6% to a named
course. **65 of the 73** colleges with any are at **100%**; the average is 96.2%.
The whole backlog is **592 rows**.

That is not a detail, it is the framing. "63,991 units already articulated,
waiting" invites a coordinator to picture a varied pile of CTE certifications and
several hundred judgment calls, so they defer it. It is close to **one decision
applied repeatedly**, against an exhibit they already articulated, for students
who already have a DD-214 or JST on file — which ties back to the incentive note:
basic-training credit *auto-applies* once the JST lands, so the platform computed
this credit itself and left it for a human. Full numbers:
`docs/kb-notes/reference-the-waiting-credit-backlog-is-basic-military-service.md`.

**2. Thirty-three of 106 colleges have nothing waiting** — Moreno Valley (2,404
CPL students), CCSF, De Anza, Coastline, Riverside City among them. A zero there
is a *finished queue*. The section renders it as one, and distinguishes it from a
failed read, which stays `null` and renders nothing at all.

**3. `map_college_cr_unit` has no k-anonymity of its own.** Only
`map_college_credit_summary` applies the k = 10 rule. So the breakdown had to
carry its own suppression check: a college whose headline figures are withheld
gets **no** per-recommendation list, because publishing the parts of a withheld
whole hands back exactly what withholding removed.

**4. The funding module's per-priority caps are keyed off the *other tab's*
viewed year.** `collegeAlloc()` writes `out[p.key]` using `priorities(state.viewSlot)`,
and under front-loaded disbursement every slot after Year 1 has a zero cap. A
briefing that inherited a Year-2 view would have rendered **$0 against all three
priorities** — plausible, unqueryable, and read as a finding about the college.
The new `_prios(name, slot)` takes the year explicitly and defaults to Year 1,
and the test asserts the *behaviour* (the function body never mentions
`state.viewSlot`) rather than the comment that says so.

**5. ⭐ A percentage must never round UP into a claim it cannot support.** With
4,988 of 5,000 units military, the summary line printed *"100% of it is credit for
basic military service"* while a row reading *"Elective credit · 12 units · 0.2%"*
sat three lines above it. True share: 99.76%. **Every assertion passed.** It was
caught by rendering the page and reading the output.

The same PR already contained a guard against the *inbound* form of the identical
bug — `live_metrics.json` publishes a transcription rate rounded to one decimal
while the worker's tier criterion tests the unrounded ratio, so a true 24.96%
publishes as `25.0`. Having written that guard, the session shipped the outbound
form in the same file. One lesson, two ends:
`docs/kb-notes/methodology-a-percentage-must-not-round-up-into-a-claim.md`.

**6. The access shape (carryover #4) is not a UI change.** The handoff described
`?college=` + no picker + `noindex` as designed-and-ready. The design does not
touch the half that actually blocks it: four of the tab's reads are gated at the
**database** — `map_college_credit_summary`, `map_college_cr_unit`,
`map_college_goal2`, `map_college_contacts` all require
`is_allowed_reviewer() OR team_pass_ok()`. An unauthenticated college hitting the
URL would not get a picker-free page; it would get nothing, because the reads
fail. Serving colleges their own view is an **RLS policy decision** about
publishing student-derived aggregates and staff contact details — outward-facing,
hard to reverse once URLs are out, and not a session's call.

**7. One read has no policy beneath it at all.** Auditing that gate found
`map_credential_student_rollup` is a **materialized view** — `relkind = 'm'`, RLS
disabled, zero policies — and `anon` holds the SELECT grant. Postgres does not
implement RLS for matviews; `security_invoker` does not apply. Nothing is
currently exposed: 543 rows, 123 published, **0 below k = 10**, minimum published
exactly 10, and all 420 suppressed rows null out *every* measure including the
unit columns, so nothing leaks by magnitude either. The finding is structural —
its suppression is enforced solely by the build script, with no second line, and
it is the only read on this tab in that position.
`docs/kb-notes/methodology-a-materialized-view-cannot-carry-rls.md`.

### Current state

**My College is 8 sections + the tier block.** Shipped this run (#1121): the
waiting-credit breakdown, the funding-pool split (real tab names, each priority's
cap and the college's own target, a *Do this next* per pool), a 15-entry Resources
section, and the tier block — *"Advancing — 2 of 5"* with the missing criteria
named and the college's own value beside each threshold, validated against
`live_metrics.json` for all **115 colleges: 0 mismatches**, tiers 14/89/12.

`tests/college_briefing.test.js` **104 → 170**. Full suite green, 196 files.

The Resources list also **fixes** the public fact sheet's retired *"MAP Initiative
Website"* title rather than copying it forward — and `fact-sheet/index.html` still
carries the old one, which a test now asserts, so the guard cannot pass on a stale
assumption.

### Strategic roadmap

**Blocked on people, not code:** the MAP deep links (Sam is checking with **Malone
and Pedro** for the right URL shapes — adopt an exhibit / work student records /
update contacts; the three host sections are built and waiting) and the access
shape, which needs the RLS decision above.

**Unblocked and next by value:** the student-request feed still needs a MAP-side
portal source; EACR's `statewide_prescriptive.js` → Supabase is four sessions old
and is what turns "adopt A+" into "adopt it against your CIS-25"; 25 Sierra
feedback rows remain untriaged.

**Recommended for the tier block's next pass:** it currently names the missing
criteria but does not say *how far* — "you are at 3.6 of the 5 units-per-student
threshold" is one line away and is the difference between a checklist and a
target.

### Next concrete step

Wire the three MAP deep links the moment Malone and Pedro settle the URL shapes —
each has a section already waiting for it. If that stalls, put the RLS decision in
front of Sam as a written option set (revoke `anon` on the matview · assert the
suppression invariant in CI · declare it public by design, as `chatbox_credentials`
already is), because it gates the access shape *and* closes the one structural
gap found this run.

### 2026-08-11 (later) — SkyLink part 2: Sam read the live tab

Two changes he asked for after using it, both shipped in **#1123**.

**8. A suggested question that only fills the box is two steps, and the second
one loses people.** Sam: *"so they don't have to take 2 steps and get lost."*
The questions sit directly above an assistant that is **already mounted on the
same tab**, so the obvious fix was to make `prefill()` send.

That would have broken the **Sierra Training** tab silently. Its "Test in
Sierra" hand-off depends on `prefill()` *not* sending, so a reviewer can edit a
logged question before replaying it — a constraint recorded only in a code
comment. `cpl_chat.js` gained a sibling **`ask()`** (fill + submit, matching the
assistant's own starter chips); `askSierra()` prefers it and keeps `prefill()`
as the fallback. Both halves are now asserted, because the failure mode of
getting this wrong is silent in the other tab.

**When two callers need different behaviour from one helper, add the sibling —
do not retune the shared one.** The existing caller's requirement was invisible
from the call site that wanted the change.

**9. A classification label must ship with its scheme.** Sam asked for the tier
block to read as prose and to *"add a very brief note in the title that shows
the 3 tiers and brief criteria so users are grounded."* He was identifying a
real gap, not asking for decoration: **"Advancing" alone is a verdict from a
scheme the reader has never been shown.** The header now states it — Leading
meets three or more, Advancing one or two, Inactive has essentially no CPL
recorded — before the label lands.

**10. In prose, the ORDER is the advice.** Rows are equal-weight by
construction; a paragraph is not. The unmet criteria are now sorted by
`actual ÷ threshold`, nearest first, so a college at 20.6% against a 25% bar
reads that first instead of finding it fourth in a list. This is the "say how
far" idea from the previous checkpoint, delivered by ordering rather than by
adding a number. `met` remains the sole authority on whether a criterion is
satisfied; `ratio` is display ordering only, and computes from the **unrounded**
transcribed ratio for the same reason `met` does.

**11. Inactive is not a score of zero.** The Cloudflare worker assigns that tier
by *absence of recorded activity* (fewer than ten students AND zero units), not
by counting the five criteria. Rendering it as "0 of 5" would blame a college
for a scheme it never entered, so it gets its own sentence: what it reflects is
that CPL is not reaching MAP, and that is the thing to fix first. Sam confirmed
both this and the nearest-first ordering.

**12. ⭐ A source-text assertion is unsound in BOTH directions.** Four tier
checks grepped `briefingSrc` for exact phrases. Rewording broke them — and so
did *reflowing*, because the copy is built from concatenated literals, so
`/batch-upload already-posted credit/` never matches a source where the string
is split across a `+`. Four tests went red on a correct page.

That is the same root cause as the previous checkpoint's shipped "100%" bug seen
from the other side: **the false green** (163 assertions passing on a page that
contradicted itself) and **the false red** (four failures on a page that was
fine), in one file, within an hour. Assertions about copy now run against
`root.textContent`; source-greps are reserved for genuine source invariants like
"this function body must never reference `state.viewSlot`". New note:
`docs/kb-notes/methodology-assert-what-the-reader-sees.md`.

**13. Reading the render found a defect no assertion would have named.** With
all four tier states printed side by side, the zero-met case read *"you meet 0
of the 5 criteria"* — arithmetic, not a sentence. Now *"you do not yet meet any
of the five."* Thirty seconds of looking; nothing was ever going to grep for it.

### Current state (part 2)

`tests/college_briefing.test.js` **170 → 183**. My College is feature-complete
apart from the three MAP links. Both remaining blockers are unchanged and both
need a person: the URL shapes (Sam ← Malone and Pedro) and the RLS decision.

⚠️ A concurrent session landed **#1124** (CIP tab) on `main` during this run.
Sam frequently runs several at once — fetch before assuming your branch base is
current, and expect `CLAUDE.md` to have moved.

### Next concrete step (part 2)

Unchanged: wire the three MAP links when the URL shapes arrive. If that stalls,
put the RLS option set in front of Sam — it gates the access shape *and* closes
the matview gap, and both are the same conversation.

---

## 2026-08-12 — SkyPro (Session 143): the tab folds down, and two things it was quietly saying wrong

Sam redirected mid-session. MAP deep links, the RLS decision and the MIS
side-by-side are all **held** at his instruction; the work is the tab itself.
His brief, after the MAP team used it:

> The team … were very impressed by how useful Sierra AI was and how accurate
> and appropriate her responses were. That leads me to want to reinforce her as
> the main focus of the page and make all the content below in collapsible
> sections (default collapsed).
>
> Also for the Strategies section, that just looks like a long list of
> intimidating to-dos that any staff or college admin would prefer to
> avoid — what with all their other squeaky wheels chirping and unscheduled
> fires burning … basically, I want a minimal initial view on this tab with
> nested expandable details for the inquisitive :)

Shipped as **#1128**. Tests **183 → 228**.

### 14. Collapsing is not the same as hiding

The literal request — wrap each section in `<details>` — produces nine identical
rows and a page you must click nine times to read. So every closed header
carries that college's own figure (*"My CPL Funding · $50,000 seed · $414,856
cap"*, *"Statewide CPL Benchmarks · Leading — 3 of 5 criteria"*). Shut, the tab
is an eight-line standing report; open, it is everything it was.

Two implementation details that are not optional: **every branch needs a
summary** (a blank right-hand side reads as broken, and "not loaded" ≠
"nothing"), and **open state lives in `state.open`, not the DOM** — `render()`
rewrites `innerHTML`, so a `<details open>` in markup alone slams shut whenever
anything re-renders. Note:
[`methodology-a-collapsed-section-must-still-inform`](kb-notes/methodology-a-collapsed-section-must-still-inform.md).

### 15. The 22 strategies were not too many; they were in the wrong place

Sam's diagnosis was precise. As a flat list at the bottom of the page they had
no consequence attached, and **19 of the 22 carried an identical "not measured
here" flag** — which was honest, and was the single thing making advice read as
an audit you are already failing. They now nest inside the funding priority they
earn against: 10 under Access, 6 under Success, 6 under Capacity, each behind a
closed *"N steps the team suggests"*. The flag is dropped in that view; measured
steps keep their figure.

**The join is by position and that is sound by construction** —
`cpl_funding.js`'s `priorities(slot)` walks the ordered priority list and
overlays Supabase *by the same index* (`prioField(slot, i, …)`), while
`collectPrograms()` here sorts that config's own numeric keys. Both are `i` over
one set. So `prioritiesAlign()` gates on **count equality**, deliberately *not*
metric equality: the funding module loads its overlay asynchronously, so a
metric gate drops the steps out of the box during that window and puts them back
after — a flap caused by the check rather than by a fault. Real drift is caught
in the tests instead.

Guarantee (c) survives the move: only `cpl-implementation` folds into the funding
box, so any program the team adds later still gets its own section with no code
change.

### 16. ⭐ Five colleges were being told they have no implementation funding

Found by rendering every branch and reading it. `fundingFor()` normalised MAP's
college name through `cplCollegeShort()` and handed the result to
`cpl_funding.js`, whose `baseCollege()` compares it against the roster's **raw**
string. Only one side of the join went through the resolver.

It worked for ~110 colleges whose two spellings already agreed and failed for the
five where they do not — **Mt. San Antonio** (roster: `Mt San Antonio`, no
period), **Norco**, **Reedley**, **MiraCosta**, **Los Angeles Southwest**. Each
rendered *"is not on the 115-college funding roster."* Mt. SAC is the largest CPL
programme in the system; its real allocation is **$522,239**, and the roster row
was there the whole time.

**The existing join test asserted `S(roster)` against `S(roster)`** — distinctness
of one side — and reported "0 collisions, 0 orphans" while five colleges were
orphaned in production. A join test has to exercise *the direction the code joins
in*. The new one asserts against the real shipped roster and the real funding
module, and checks the bug directly in both directions. Verified against a figure
derived outside this repo: `$522,239` matches the Sep-BOG reconciliation. Note:
[`methodology-normalise-both-sides-of-a-join`](kb-notes/methodology-normalise-both-sides-of-a-join.md).

### 17. ⭐ A college with no data was being congratulated

Imperial Valley College — three CPL students, no rows in the credit summary —
was told *"Nothing is waiting. Every credit recommendation with an articulated
exhibit behind it has been acted on. That is a finished queue, not a missing
measurement."*

That is the "not in this dataset read as zero" failure pointing the other way: an
absence rendering as an **accomplishment**. `waitingBreakdown()` now returns a
distinct `unmeasured` state when there is no summary row. **Congratulatory copy
needs a stricter guard than neutral copy** — "0 units" is merely wrong when the
truth is unknown; "you have finished" is wrong *and* tells someone to stop
working. Folded into
[`methodology-omit-dont-zero-an-absent-measure`](kb-notes/methodology-omit-dont-zero-an-absent-measure.md).

Adding the state also broke the branch above it (`if (wb && !wb.suppressed &&
!wb.empty)` let `unmeasured` fall through into code expecting grouped rows, and
threw). **Adding a state means auditing every `if` that tested for its absence** —
caught by rendering, not by any assertion.

### 18. A test pinned to a daily-refreshed number is a scheduled false alarm

An assertion read `(you: 2,250)`; the cron moved CCSF to **2,251** and it went red
on a correct page. Pre-existing, unrelated to this run, fixed here: it now looks
the figure up in `live_metrics.json` — plus a presence check, because deriving the
expectation from the render's own source can pass vacuously when both sides
become `undefined`. **If a committed value changes without anyone editing the
repo, it is data, not an expectation.**

### 19. The two student counts — asked, measured, and parked by Sam

The tab shows two "CPL students" figures from two feeds. Measured: **36 of 104
colleges match exactly**, 16 differ by ≥5% and ≥10 students, 3 by more than half
(CCSF 2,251 vs 1,248; Chaffey 3,652 vs 1,495; **LA Pierce reversed**, 336 vs 767).

Three theories were tested and eliminated — the dashboard sub-population split,
batch-uploaded AP/IB/CLEP volume, and an `indExcludeSA` scrape parameter that I
offered and **Sam correctly rejected** (it is set to `0`, meaning *exclude =
false*). What survived is worth keeping: **our aggregation is faithful** —
`map_college_credit_summary.students` equals `count(distinct student_key)` in the
raw extract exactly, for every college sampled. The divergence is entirely
between MAP's dashboard API and MAP's own extract.

**Sam supplied the cause**, which no amount of querying from this side would have
produced:

> the MAP team has been pulling some records off MAP to correct Exhibit
> references and get them reloaded. I think this is the divergence … our uploaded
> data is a bit stale now but will reconcile better as the data is corrected and
> reloaded in MAP. Once we get the MAP Custom Report fetch enabled, this should
> resolve. Let's park the problem for now assuming that's the discrepancy.

⚠ **This changed the design answer.** I had recommended shipping a sentence
naming the gap on the divergent colleges. If the divergence is transient reload
state, that sentence would permanently narrate a temporary condition. When this
is picked back up, prefer labelling each figure with its source — or leaving it
until the Custom Report fetch closes the question. The measured before-picture is
in `cpl_memory` so reconciliation has something to be checked against.

### Sam's calls this run

- **Contacts and staff are not PII.** I had used synthetic placeholders in a
  scratch fixture; over-cautious, corrected. MAP college staff contacts are
  directory information for a public programme.
- **Hold** MAP deep links, the RLS decision, and MIS.
- **`My CPL Funding`**, moved up directly under *Start here* — money is the second
  thing a coordinator wants, and it was sitting seventh behind four measurement
  sections.
- **`Current MAP Users and Contacts`** replaces "Who MAP has on file for you".
- **`Statewide CPL Benchmarks`** for the tier section. He rejected "How this
  college compares statewide" on the same grounds he rejected "tier": both imply
  a ranking, and this section is explicitly not one. All five criteria measure
  activity against *fixed thresholds* — that is a benchmark. The section's own
  closing line was reworded from "compares you against" so the heading and the
  body agree.

### Current state

My College is feature-complete apart from the three MAP links, and all three
of the previously-named blockers are held by Sam. The tab now opens as Sierra AI
plus nine closed rows.

### Next concrete step

Nothing on this workstream is unblocked. The largest genuinely-open engineering
item elsewhere is **EACR's `statewide_prescriptive.js` → Supabase** (carryover,
five sessions). On this tab, two unanswered design questions: whether the closed-row
summaries earn their place, and whether *Start here* should be the one section
open by default.

---

## 2026-08-17 (Session 167, Sky167) — the key was a ghost, then the tab was rebuilt around the choice

Three merges: **#1232** (the auth fix + Sierra alignment), **#1233** (the
scope-first redesign), **#1234** (the docx briefing).

### The defect Sam reported, and why it looked like missing data

Sam, against *"What that waiting credit actually is"* showing `no figures held`:
**"I think all the colleges are coming up blank on this."**

`waitingBreakdown()` was correct throughout. The credential never reached the
server.

`getSession()` in `college_briefing.js` read `localStorage.cpl_team_session`.
**That string occurred exactly once in the entire repo — as that read.** No
module, no sign-in flow and no test has ever written it, so it returned `null`
for every visitor since the tab was written. Two consequences:

1. **The reviewer session was invisible.** The canonical key is `cpl_sb`, which
   `cpl_session.js` (the keeper, #1205) holds continuously fresh for the other
   25 modules. This tab never read it, so the keeper could not help it and a
   magic-link reviewer was, to this file, a logged-out guest.
2. **The team phrase never left the browser.** `signedIn()` checked
   `cpl_team_pass` *separately* — so a phrase holder rendered the whole tab —
   but `authHeaders()` built its headers from the always-null session and
   attached no `x-team-pass`, which is the header `team_pass_ok()` reads.

Both halves of `is_allowed_reviewer() OR team_pass_ok()` were therefore false on
every gated read.

**Why it presented as a data gap.** An RLS-filtered `SELECT` is not an error:
PostgREST answers **200 with `[]`**. So `map_college_credit_summary`,
`map_college_cr_unit`, `map_college_goal2` and `map_college_contacts` all
returned empty arrays that are indistinguishable from *"this college has
nothing"* — while `map_colleges`, `chatbox_credentials` and `cpl_funding_config`
(all public-read) kept working and made the page look healthy. **109 of the 120
non-test colleges have a credit-summary row.** Nothing was missing.

**The fix delegates** to `window.CPL_SESSION` and
`CPL_TEAM_PHRASE.decorateHeaders` rather than writing a fourteenth copy of the
auth dance — the keeper's own reasoning. A phrase session keeps the **anon key**
as its bearer (`Bearer <phrase>` is the classic version of this mistake), and
the stored phrase rides along even for a JWT session, which un-shadows it for a
signed-in **non-reviewer** whose JWT alone fails `is_allowed_reviewer()`.

⚠️ **The test suite was complicit.** `college_briefing.test.js` signs in with
`cpl_team_pass` — the broken path — and stubs `fetch`. It exercised the defect
on every one of its 232 passing checks and asserted nothing about it. The new
`college_briefing_auth.test.js` asserts **headers, not pixels**, because there
is no rendered state that distinguishes this bug from the truth.

### Then Sam's seven asks

Open on the **choice**, not a title; curate the second list from the first
answer; welcome the reader only once there is something to welcome; Sierra
collapsible but expanded; expand/collapse all; a briefing button; no emoji.

Design calls worth recording:

- **Collapse all closes Sierra too** — Sam's ruling, the literal reading. A
  control that silently exempts one section teaches people it is broken.
- **The `<summary>` carries the single heading.** `hoistAssistantIntro()` now
  splits the widget's intro: its `h2` into the summary (so a collapsed section
  names itself), the description into the body. Putting the title in both is
  how #1231's duplicate would return one level up.
- **`askSierra()` opens the section first.** Prefilling a widget inside a closed
  `<details>` types into a box nobody can see — the #1166 invisible-input bug,
  which was fixed for the Sierra Training hand-off that drives *this* widget.
  Making Sierra collapsible re-armed it.
- **"Choose another college" returns to step 2, not step 1.** Switching college
  is the common journey; re-answering "who are you" is a tax.
- **The scope is remembered but always escapable**, and a remembered scope that
  is not `ready` is ignored rather than stranding someone on a blank screen.

### The pushback, and the trap underneath it

Two of the five scopes Sam named have **no data anywhere in this repo**:
`map_colleges` carries only `college_id / college_name / variants / is_test /
entity_kind`, and the funding roster's only geography key is `district`.

⚠️ **And the region data we DO hold is a third scheme.** `college_geo.region`
(120 colleges, 10 regions) is hand-authored for Sierra's *"which colleges NEAR
me"* ranking — `chatbox/_seed_college_geo.py` says exactly that in its
docstring. The **Strong Workforce programme has eight** regional consortia with
different boundaries (our *San Joaquin Valley* + *Greater Sacramento* split is
not *Central Valley/Mother Lode*; *Central Coast* is not *South Central Coast*),
and the **ASCCC has four** areas, A–D. Pointing either label at `college_geo`
would silently mis-group a college's peers in a view people act on.

So both render **disabled with their reason on hover**, and a test pins that
they stay unwired — because the tempting fix for a disabled button is the
nearest available column. Sam confirms the real groupings are on the MAP
Dashboard, so this is *not located in an export yet*, not *does not exist*.

### The disclosure rule the roll-ups needed

District and statewide sum **only the unsuppressed rows**. `k=10` withholds 13
colleges; a total that included them would mean `total − visible = the withheld
figure`, and a two-college district hands it over in one subtraction. Summing
only what is already on screen makes that arithmetic return zero by
construction. The withheld are **counted** in the note so the total is never
mistaken for the whole group, and an **absent** college stays distinct from a
**withheld** one — folding the two turns *"never measured"* into *"does none"*.

### The briefing

Sam's first ask was "a Report button that creates a briefing"; four hours later,
**"Briefing should be docx"**. Both versions read the **rendered DOM** rather
than re-deriving the figures — the EACR `matrixCell()` reasoning, since a report
that computes separately is a second implementation and the document is the copy
that leaves the building. It also inherits the disclosure control for free: a
withheld college reads "withheld" on screen, so it reads "withheld" in the file.
The suppression note travels **inside** the document, because on screen a reader
has the surrounding page to explain a dash and in an emailed file they do not.

⚠️ Its first cut walked `details.cb-sec` only — and a **district or statewide
view has no sections at all**, so the briefing was empty for two of the three
scopes and the "nothing to put in a briefing yet" guard would have reported that
as though the college had no data. Now a document-order pass over a whitelist.

### Two bugs the tests found, both introduced by this work

- **`finish()` hoisted the first `.cb-bar` in document order** into the Sierra
  box. That was correct only because the picker bar happened to be authored
  first; once the pickers moved to step 2, the first `.cb-bar` in the briefing
  view is one of the waiting breakdown's **progress bars**, which would have
  been torn out of its table and dropped into the assistant. *A positional
  selector is a bound on the order things are written in.*
- **The rendered checks passed over an EMPTY list.** jsdom defers
  `DOMContentLoaded`, so the standalone Sierra page never booted and
  `.some()`/`.every()` were vacuously true on nothing. Each such check now
  requires the five chips in its own condition.

### Current state

The tab is live on `main` and **nobody has seen the redesign in a browser** —
copy and density are Sam's call. The auth fix is the one that matters
operationally: every MAP figure on the tab was blank for every user, and is not
any more.

### Next concrete step

1. Sam opens the tab and reacts to the shape.
2. The two region lists, when he locates them in a MAP export → flip `ready`.
3. `college_report_generator.js` dates its filename at the END where the new
   briefing uses the mandated `YYYYMMDD` prefix — one convention, Sam's call.
