---
title: Lessons — finding a credit recommendation for a course a college already approved
date: 2026-08-27
tags: [lessons, cpl, military, ace, jst, articulation, credit-recommendation, lattc, evidence]
artifacts:
  - kb/_match_courses_to_ace_recs.py
  - kb/college_cr_evidence/lattc_military_2026-08-27.json
  - kb/college_cr_evidence/lattc_military_2026-08-27.html
related:
  - "[[CLAUDE]]"
  - "[[military_cr_reference_scope]]"
  - "[[local_course_alignment_lessons]]"
---

# Finding a CR for a course a college already approved

## 2026-08-27 — LATTC's 139 military-CPL courses (Jessica)

**The problem, in Jessica's words:** *"They can easily identify that a course can be
approved for a certain CPL type, but do not have the evidence specified."* LATTC sent
139 courses approved for military CPL and no credit recommendation for any of them —
and MAP requires a CR before an articulation can exist. This is a **recurring class of
ask**, not a one-off, which is why the matcher is committed rather than run in a
scratchpad.

### What the corpus actually supports

- **The CRs exist; the peer articulations mostly do not.** `map_college_cr_unit` holds
  **200,364 ACE rows / 7,156 distinct recommendations / 5,318 exhibits**, but only
  **5,442 rows (2.7%)** name a local college course. Grouped, that is **3,663 peer rows
  across 60 colleges** — and after dropping `CPL-N Elective Course Credits` placeholders,
  only **15 colleges** supply precedent anywhere near LATTC's trades.
- ⚠️ **The peer corpus is skewed to management, supervision and computer courses** — the
  military-CPL default. Before the run: **zero** carpentry, plumbing, water/wastewater or
  architecture peer courses; welding 12, electrical 33, HVAC 7. A college whose catalog is
  trades will get thin peer coverage, and that has to be said out loud rather than papered
  over with a weak match.
- ⭐ **But the ACE recommendation vocabulary is rich exactly where the peer table is
  empty**: `3 hours in welding` (13 exhibits / 40 colleges), `1 hour in blueprint reading`
  (31 / 69), `3 hours in technical mathematics` (21 / 77), `3 hours in carpentry` (4 / 12),
  `3 hours in plumbing` (7 / 36), `3 hours in water treatment operations` (9 / 35).

### Two signals, reported separately, never blended

Per `methodology-two-signals-for-a-judgment-proposal`:

- **A — the recommendation exists.** ACE publishes it and CA students already hold it.
  This makes an articulation *possible*. It is a proposal.
- **B — peer precedent.** A named college attached that CR to a named course. A *fact*.

Result on LATTC: **87 courses A+B · 46 A only · 6 with neither.**

⚠️ **Ranking on B first is wrong.** The first cut sorted peer-backed candidates above
everything and answered *Water Distribution I* with **"3 hours in distribution
management"** (business distribution) over *"water storage and distribution"*, and
*Construction Wiring* with *"introduction to construction"* over the wiring recs.
**Whether anyone has done it does not change what it IS.** Score primary, peer as the
tiebreak inside a 0.1 band.

### The gate that matters: a strong token, not any token

Reusing `cx_align_tokens()`'s stopword list is not enough — its remaining "content" words
include generic nouns that match anything. Uncaught, they produced:

- *Street Maintenance (Applied Calculations in Public Works)* → **"3 hours in mechanical
  maintenance"** (shared: `maintenance`)
- *Piping Principles And Practices* → **"1 hour in laboratory practices"** (shared:
  `practices`) — while *"plumbing and pipefitting"* sat unmatched
- *Calculations and Measurement for Woodworking Students* → **"1 hour in medication
  calculations"** and **"3 hours in student teaching"**

Two rules fix all of them: a **WEAK set** (maintenance · systems · practices · planning ·
principles · technology · materials …) that may contribute to a score but may never be the
only thing shared; and a **DOMAIN GATE** — the recommendation must also sit in the course's
trade, unless **two** independent content words agree.

⚠️ **No "closest match anyway" fallback tier.** It was tempting for the 6 leftovers, and
`CLAUDE.md` already forbids it: built and withdrawn once because it proposed *AUTO 160
Introduction to Automotive Electrical* for a **policing** rec. A course with no
title-word match goes to a human. The 6 are honest: GIS planning, green jobs, grounding,
foundations of design, street maintenance ×2 — **no ACE CR for `conduit` or `grounding`
exists at all** (measured, 0 rows).

⭐ **Show the word the match was made on.** `matched_on` is rendered on every proposal, so
a reviewer kills a bad one in a second. It is also what keeps a domain-word-only match
honest: *History of Architecture* → *"architectural drawing"* reads as **matched on:
architecture**, and a human sees instantly that it is a discipline match, not a content one.

### Keyed to the CR, never to the MOS

⭐ **Jessica, 2026-08-27:** *"colleges often say a service member can get credit based on
their MOS or rate. Service members can have multiple MOS/rates so it is optimal to award
credit based on the credit recommendation on the JST."* The deliverable is therefore
keyed on the recommendation, and each one lists the **exhibits that carry it** — the
JST entries that reach the same credit. `3 hours in welding` arrives via *Hull Maintenance
Technician*, *Steelworker*, *Allied Trades Specialist* and 10 more; a per-MOS mapping would
have had to state that route by route and would go stale as ACE revises exhibits.

### NCCER — what we hold, and what is missing

Same evidence problem in the industry-certification lane. We hold **19 NCCER credentials**;
**14 are statewide with published recommendations and ZERO adopters**, and only **NCCER
Welding Levels 1–4** have ever been articulated, by exactly **three** colleges (Bakersfield,
Barstow, Santa Ana).

⭐ **The statewide recommendations are already at roughly MODULE grain** — *Thermal Cutting
Processes*, *Printreading and Welding Symbols Interpretation*, *Rough Electrical* are NCCER
module names, not level names. So the certificate→module structure is partly encoded already.
⚠️ **In MAP, colleges name NCCER at the LEVEL grain** (`raw_variants` are all
`NCCER <craft> Level N`, plus one `(10 Certificates)` bundle) — the module citing happens
off-platform, which is exactly why the evidence cannot be found later.

⛔ **The authoritative certificate→module map needs the NCCER catalog, and `nccer.org` is
egress-blocked from the sandbox** (proxy returns 403 CONNECT). It must be attached to the
session, as the LATTC workbook was.

### Next

1. LATTC faculty work the 87 peer-backed proposals first — cheapest to defend.
2. The 46 recommendation-only rows are the **ready-to-adopt shelf**: LATTC would be the
   first California college to articulate them.
3. The 6 leftovers need a faculty call, not a better matcher.
4. NCCER: get the catalog PDF attached, then build certificate → module → CR.

### 2026-08-27, later — from a report to a worklist (Jessica)

*"Please also include units… Show a summary of the CRs… in bullets in the same header…
Include a confidence score for each CR and a select button. I don't want them to have to
sort through the detailed info below unless they want to. I want to give them an easy
button for this."* Then: *"The peer precedence would result in a higher confidence score.
Please include the chip that indicates peer precedent etc. next to each bullet."*

The page was a **report**; it needed to be a **worklist**. Everything needed to decide now
sits in the collapsed card — units, ranked recommendations, confidence, the peer chip, a
Select button — and the evidence moved behind one disclosure.

**Units came from COCI**, joined on (subject, course number) against
`chatbox_college_courses`. ⚠️ **Leading zeros cost 25 of 139 matches** on the first pass:
LATTC writes `BLDGCTQ002`, `WELDG/E020`, `WATER001`; COCI stores `2`, `20`, `1`. Normalized,
**131 of 139** resolve. The other 8 are reported as *"units not in COCI"* — never guessed.

⭐ **The join found something better than units: five course numbers that name a different
course in COCI.** `BLDGCTQ105` is *Basic Blueprints And Drawings* on LATTC's list and
**CPR/AED/First Aid: Construction & Industry** in COCI; `BLDGCTQ600` is *Green Jobs for the
AEC Industry Cluster* vs **Building Construction Techniques**; `WATER001/002` vs **Modern
Water Works I/II**; `ECONMT191` vs **Electrical Wiring Systems**. A ratio test separates
these from the 4 harmless spelling drifts (*METAL SCUPTURE II*). Each one is flagged on the
card, because a recommendation attached to the wrong course number is worse than no
recommendation. **A units join is also a course-identity check** — the second finding was
free and worth more.

**Confidence is `0.55 × word fit + 0.25 × peer precedent + 0.20 × how widely held`.**
Jessica confirmed peer precedent must raise it. ⚠️ **It is a ranking heuristic, not a
probability, and it is deliberately not fitted to anything** — nobody has labeled a ground
truth for *"is this the right CR"*, so a trained score would be a borrowed authority. All
three inputs render on the chip's tooltip so a reviewer argues with the arithmetic, not the
number. Bands: High ≥0.70 (**82** courses), Medium ≥0.45 (**34**), Low (**17**).

⚠️ **The bulk "choose the top pick" button fills only High-band rows.** Filling all 139
would launder a Low-confidence guess into a recorded decision at the exact moment nobody is
looking. It fills 82 and says so.

**Selections persist three ways, deliberately layered** — `localStorage` immediately (works
for everyone, survives reload), the `artifact` capability on an explicit *Save* (the shared
record, so choices come back to us rather than dying in a browser), and a CSV via the
`downloads` capability with a clipboard fallback. ⚠️ **A read-only viewer cannot publish** —
`publish` returns `not_writer`, so that path is caught and the viewer is pointed at the CSV
rather than shown a failure.

⭐ **Rebuilt as data + renderer rather than pre-rendered HTML** — required by the capability
(save = swap the state JSON block in the page source and republish; the live DOM is never
serialized back), and it shrank the file from 430 KB to 346 KB.

**Committed the browser test** (`tests/lattc_worklist_page_test.py`, 27 checks) rather than
throwing it away: it guards that the bullets are visible *without* expanding, that every
bullet carries both chips, that the bulk fill stops at 82, and that Save degrades with a
sentence when the runtime is absent. ⚠️ Chromium is at build **1194** here while a
pip-installed Playwright wants 1234 — pass `executable_path`, never `playwright install`.
The lone console error is the Google Fonts fetch, blocked by the sandbox's egress and
allowed by the artifact CSP; the test asserts on **page** errors instead.

### 2026-08-27, later still — the ACE id is plumbing, and a count is useless alone

*"Please do not place emphasis on the ACE ID in the details section. Just list the unique
CRs and the number of colleges."* Then: *"Please remove the ace exhibits in the header."*
And: *"give us a 'hover over' on the colleges as well as the other numbered items to show
details (names of colleges etc.)."*

⭐ **The ACE exhibit id was the most prominent thing on the page and it is the least
decidable.** It was set in monospace, it had its own table column, and it opened the
evidence block. Nobody deciding whether a recommendation fits a course needs
`AR-1723-0026`; they need to know it is *Allied Trades Specialist* and that 40 colleges'
students hold the credit. The header now reads **`matched on weld · held at 40 colleges ·
4 peer articulations`** — no exhibits at all — and the details lead with the recommendation
and its college count. The id survives only inside the hover, where a curator who needs it
can still find it.

⚠️ **A COUNT WITHOUT ITS NAMES IS A DEAD END.** "40 colleges" is unverifiable and therefore
unpersuasive; "40 colleges, and here they are" is an argument. Every count on the page now
opens the list behind it.

⚠️ **`title=""` IS NOT A HOVER.** It never appears on touch, cannot be reached by keyboard,
cannot hold a list and cannot be styled. The hovers are real `<button>`s opening a positioned
panel on **hover, focus AND tap**, dismissed by Escape or an outside click — so the same
affordance works for a mouse, a phone and a screen reader.

⚠️ **Two bugs, both only findable in a browser.** (1) **Hover-open fought click-toggle**:
the pointer opened the panel, the click that followed closed it, so tapping the thing you
were hovering did nothing and touch never worked at all. Fixed with a `pinned` flag — a
click on an already-open panel pins it rather than toggling. (2) **A `scroll` handler closed
the panel**, which was wrong twice: the panel is positioned in *document* coordinates so it
already travels with the page, and browsers scroll a control into view before activating it
— so the close fired before the click landed. Both would have shipped invisibly from a
static read of the diff.

⭐ **The college names paid for themselves immediately: on 111 of the 139 courses, LATTC's
own veterans already hold the recommendation.** LATTC appears in the holder list for 243 of
the candidate rows. That is credit already sitting in their students' records with nothing
to apply it to — the strongest argument on the page for doing the articulation, and it only
became visible once the counts were expanded into names.

### 2026-08-27, the unit question — "a 3 hour credit recommendation for a 1 unit course"

*"We're struggling with the first example of a 1 unit welding lab… We wouldn't want to give
a 3 hour credit recommendation for a 1 unit course and then use the same credit
recommendation for a 3 unit course."* (Jessica). Right on both halves, and the second half
is the bigger one.

**Measured, not assumed.** Across **3,419 peer articulations** carrying both numbers,
**81.1% pair a recommendation's hours with a course of exactly those units**; 8.1% award a
smaller course, 10.8% a larger. `3 hours → 1.0 unit` — the shape of the welding-lab case —
happens **61 times in 3,419 (1.8%)**. So matching hours to units is not a house rule we
invented; it is what colleges overwhelmingly do.

⚠️ **MY OWN DEDUP WAS CAUSING THE PROBLEM.** The matcher collapsed hour-variants of a topic
(`1 hour in welding` → `3 hours in welding`) and kept the better-evidenced one. That was
harmless while hours were decoration and *fatal* once hours were the question: the 1-unit
lab could never be shown `1 hour in welding` (4 exhibits, 18 colleges) because it had been
folded away. **The hour variants ARE the choice.** Only exact-duplicate strings collapse now.

⚠️ **THE LAB-SPECIFIC RECOMMENDATION IS A DEAD END, and it took measuring to see.** ACE does
publish laboratory recommendations — but only **41 of 7,155**, none for welding, and the
hour distribution is **1h×8, 2h×2, 3h×20, 4h×10**. A lab recommendation is not a small
recommendation. "Match a lab course to a lab recommendation" would not have solved the units
at all. `lab`/`laboratory` also sits in the inherited `cx_align_tokens()` stopword list, so
it can never distinguish anything here anyway.

⭐ **THE REUSE PROBLEM IS FAR BIGGER THAN THE LAB CASE, AND IT WAS MINE.** Before this pass,
**118 of 139 courses shared a top pick — 36 distinct recommendations for 133 courses**, with
`3 hours in welding` recommended for **22** courses spanning 1.0 to 6.0 units. The scorer
rewarded short recommendations fully covered by a title, and confidence rewarded breadth, so
the broadest recommendation won everywhere. **A per-course ranking cannot see a collision;
only the assignment can.**

⚠️ **The "fill every top pick" button was therefore actively harmful** — one click put 86
choices in and lit **82 duplicate warnings**. It now skips a recommendation already claimed,
prefers a variant whose hours match the units, fills **40**, and reports what it left for a
human. **A bulk button exists to clear the obvious ones, not to look finished.**

⚠️ **A duplicate is a statement about a PAIR.** Re-rendering only the clicked card left the
other half silently unflagged — the reader saw one warning where there were two. Every card
the change touches re-renders.

**Do peers reuse a recommendation across courses?** Effectively no. Of **900**
(college, recommendation) pairs, **54 (6%)** span more than one course — and reading them,
they are cross-listings (`BUS-3`/`CAT-3`/`CIS-3 Computer Applications for Business`),
catalog-year duplicates (`ELC-11 DC Electronics` at 4.0 and 8.0) and stated alternatives.
**Not one recommendation awarded twice.** ⚠️ The count alone would have said "6% do it" —
the reading is what says they don't.

### Does welding actually come as a lecture + lab pair? (Jessica asked; the data answered)

**No — that is the minority pattern, and LATTC is in it.** Across **1,198 welding courses at
79 colleges**: only **55 (4.6%)** carry lab/laboratory in the title, at **17 of 79 colleges
(22%)**; median welding course is **2.5 units** and **48% are ≥3 units** — i.e. the shop time
is usually *inside* one combined course.

⭐ **And where lab courses do exist, they are mostly NOT the lab half of a pair.** Of 19
`L`-suffixed welding course numbers, exactly **one** has a same-number lecture counterpart
(Mt. SAC `WELD 91` / `91L`). Cerritos has **15** `L` courses and **no** base counterparts —
verified against its complete 30-course welding list, so this is the catalog, not a gap in
our extract. They are standalone skills and certification labs (`252L Pipe Welding Level 1`),
and LATTC's own `Welding Laboratory – Electric I/II/III` read the same way: **a progression
of 1-unit practice courses, not companions to a lecture.**

**So the honest treatment for LATTC's four 1-unit labs is a small recommendation each, not a
share of a 3-hour one** — and, because they are a progression, four *different* ones. That
is a faculty call, but it is now a call made against measured practice instead of intuition.

### 2026-08-27, the correction — reuse is allowed, and small courses were being starved

*"We can utilize a credit recommendation for multiple courses or multiple credit
recommendations for 1 course or any combination like that. Can you please take another look
… recommend the lower unit courses like a 1 unit lab with any or all courses. We just want
to make it easy for them to create articulation for these lower unit courses."* (Jessica).

⭐ **I INFERRED A PROHIBITION FROM A FREQUENCY.** The peer reading was right — of 900
(college, recommendation) pairs only 54 span more than one course, and those are
cross-listings and catalog duplicates. What I then did with it was wrong: I turned *colleges
rarely do this* into *this must not be done*, and shipped it as a duplicate **warning** plus
a bulk-fill that **skipped any recommendation already claimed**. MAP permits many-to-many;
the curator knew that and I did not ask. `CLAUDE.md` already says a team member's domain
knowledge outranks a derived finding — this is what that looks like in practice. Recorded as
`cpl_memory` `a-cr-can-serve-several-courses-and-a-course-several-crs`, verified, sourced to
Jessica.

⚠️ **AND THE SAME RANKING WAS STARVING THE SMALL COURSES.** Confidence rewards how widely a
recommendation is held; the widely-held recommendations are the **3-hour** ones; so a 1- or
2-unit course's best-fitting option sinks below the cut. Showing the top 6 by confidence hid
**22 exact-hour matches** on one 2-unit carpentry course, and hid the *only* unit-matched
option on **12 courses — 5 of them at ≤2 units**, i.e. precisely the courses Jessica asked
to make easy. **A single ranked list cannot serve two different questions.** Each card now
carries the top five by confidence **plus** up to five whose hours *equal* its units, marked
`fits your units`. Courses showing an exact-hour option: **107 → 119 of 127**; at ≤2 units,
**19 → 24 of 28**.

⚠️ **Combinations that sum to the units are nearly useless here** — with the full pool, only
**4 of 127** courses are reachable by a 2- or 3-recommendation sum that a single match does
not already cover, and **0 of the 9** low-unit gaps. Worth measuring, not worth building.
The eight remaining courses without any exact-hour option are genuinely short of vocabulary,
not short of search.

**What the page does now:** a course holds **several** recommendations, the header totals
their hours against the course's units, a recommendation used elsewhere says so **neutrally**
(`also on N other`), the bulk fill no longer skips anything (it still refuses to bulk-fill
below High confidence), and a `1–2 unit courses` filter isolates the 28 small ones.

### 2026-08-27, the unit rule — a curator ruling replaces a modeled one

*"Often credit recommendation hours match the units for the course. If the credit
recommendation hours vary by more than 1 unit, leave it off of the list. If it varies by 1
unit, lower the confidence score but keep it on the list. Hold off on the combinations
mentioned previously. I think we were overanalyzing."* (Jessica).

⭐ **A HARD CUT BEAT MY CONTINUOUS SCORE, AND SHE WAS RIGHT TO OVERRULE IT.** I had scored
the hours/units gap on a curve at 0.20 of the confidence blend. That kept **3 hours in
welding** at the top of a **1-unit** lab, because breadth (40 colleges) outweighed the
penalty — a result that is obviously wrong to the person who has to defend the articulation,
however defensible the arithmetic. `> 1 unit apart → not listed` is simpler, and it is set
by the reader who lives with it rather than inferred by me.

**What the cut does.** A 1-unit lab is now offered `1 hour in welding`, `1 hour in arc
welding`, `1 hour in gas and electric welding` and the off-by-one `2 hours in welding` — the
3-hour recommendations are **gone**. It cuts at the top end too: `WELDG/E121 Electric Welding
I` (**6 units**) went from *3 hours in welding* to **6 hours in welding**, which no amount of
weighting had achieved.

⚠️ **THE CUT APPLIES ONLY WHERE COCI GAVE US UNITS.** The 8 courses with no units are not
filtered at all. Shortening their list would make an *absent* measurement look like a
*failed* one — the same failure family as a suppressed cell rendering as a zero.

⚠️ **A cut changes what counts as evidence, so the counts move honestly**: peer-backed
courses **100 → 87**, recommendation-only **33 → 46**, High-confidence top picks **86 → 68**.
Nothing was lost — those courses now get a *smaller, better-fitting* recommendation that
happens to have fewer adopters. **A drop in "peer-backed" is not a drop in quality here**,
and reporting it as one would be the misreading to avoid.

⚠️ **Widening the shown set exposed a data gap I had been living with.** The candidate lists
went from 133 recommendations to 299, and **184 of them had no college list** — my earlier
pulls had used a hand-written trade regex, so anything outside it silently rendered its
counts as plain text instead of a hover. Both lookups are now pulled for **all 7,155** ACE
recommendations. **A regex-scoped extract is fine until the thing it scopes changes size.**

⚠️ **Three test assertions broke that were pinned to values the data can move** — a peer chip
named on one specific card (that card's top pick changed), and a hardcoded bulk-fill count.
Re-derived from the payload at runtime. The repo's own lesson, met again: an assertion pinned
to a value that can leave the data stops being a guard the moment it does.

**Also:** units now sit beside the course title at the title's own size rather than pushed
right in smaller type — they are part of identifying the course, not a footnote to it.
**Combinations remain unbuilt**, at Jessica's direction and consistent with the measurement
that they reach only 4 of 127 courses.
