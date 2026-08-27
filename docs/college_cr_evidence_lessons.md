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
probability, and it is deliberately not fitted to anything** — nobody has labelled a ground
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
