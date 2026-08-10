---
title: College action page & MAP-team queue — lessons
created: 2026-08-09
updated: 2026-08-09
tags: [lessons, college-action-page, map-team-queue, governance, contacts, measurement]
artifacts:
  - map_team_queue.js
  - kb/map_team_tracked.json
  - kb/supabase_sierra_feedback_ci_status.sql
  - tests/map_team_queue.test.js
  - tests/sierra_feedback_ci_rows.test.js
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
