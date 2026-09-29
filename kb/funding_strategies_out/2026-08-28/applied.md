---
title: Funding strategies — consolidated credit set + the first noncredit set
date: 2026-08-28
tags: [receipt, cpl-funding, noncredit, strategies]
artifacts:
  - kb/funding_strategies_out/2026-08-28/config_before.json
related:
  - "[[cpl_funding_lessons]]"
---

# Receipt — 2026-08-28 strategy write

Sam, 2026-08-28: *"Love your strategies! Can you make them so!"* and *"Can you
take a pass while you're at it consolidating and perhaps correcting my priorities
for CR P's?"*

| | |
|---|---|
| Table | `public.cpl_funding_config`, row `default` |
| Scope | `projects → cpl-implementation → scenarios → Scenario 1` |
| Touched | the six `yearPriorities` **strategy arrays** (Years 1 and 2) and a new `ncPriorities` block |
| Untouched | every share, factor, metric, metric_src, title, description, pool figure and dial |
| md5 before | `294368788ceb5a377314e28bd0d48f3c` (asserted in the UPDATE's WHERE clause) |
| md5 after | `9cf58b99efa36bd40fccbfb823f3683c` |
| `updated_by` | `skylens-s202@bot` |

The write was guarded on the before-md5, so it could only apply to exactly the
config in `config_before.json`. To revert, restore that file's `strategies`
arrays and delete `ncPriorities`.

## Why the credit set changed

**The test applied: does each strategy drive ITS OWN priority's metric?** Access
is measured on APPLIED units of portal / landing-page / batch origin, Outreach on
ELIGIBLE units, Success on TRANSCRIBED units. Several items sat under a priority
whose metric they could not move.

- **Moved to Access** — *Add CPL review to every Comprehensive Student Education
  Plan* (it is how a student reaches CPL at all, and Ed. Code §78093.2(b)(1)
  makes evaluation at or before the education plan a campus duty),
  *Review the CPL Administrative Procedure*, *Convene a CPL strike team*.
- **Moved to Outreach** — *Put CPL on program pathway maps and flyers* and
  *Document student CPL stories*, which make credit visible and so make it
  identifiable; both previously sat where they measured nothing.
- **Split** — *Create HS articulated course exhibits on MAP and batch upload
  student enrollment and Cx grades* was two actions on two different rungs:
  building the exhibit (Outreach) and uploading the grades (Success).
- **Merged** — three separate CPL-Coordinator items became one staffing line;
  *use program review to embed CPL on pathway maps* and *add CPL to pathway maps
  and flyers* were the same instruction twice.
- **Typos fixed** — "reuqests" → "requests"; "Support A&R and VRC staff **is**
  CPL efforts" → "in".

Net: 9 / 6 / 9 → **7 / 6 / 7**, nothing dropped that was not a duplicate or a
half of a split item.

⚠️ **Year 2 was updated too, even though `mirrorYears` makes it inert.** Leaving
it stale would mean that un-checking the mirror silently restored the old,
un-consolidated lists — the dormant-value trap `_effective()` exists to expose.

## Why the noncredit set is not credit's

Sam, 2026-08-28: *"NC programs do not generally award credit, they get students
trained and qualified to get credit at a credit college — hence different
strategies."*

That is a difference in the **work**, not in the wording, which is why
`ncPriorities()` no longer falls back to credit's list: handing a noncredit
institution instructions about transcribing credit it does not award would be
confidently wrong. Before this write the NC cards read *"None written for the
noncredit lane yet"*; they now carry their own three per priority.

| Priority | Noncredit strategies |
|---|---|
| **Access** | Stand up a noncredit CPL landing page with its own MAP location ID · Add a CPL step at the end of every noncredit certificate · Name the credit colleges that already accept your training |
| **Outreach** | Get noncredit certificates and industry-aligned courses into MAP as exhibits · Build mirror-course or noncredit-to-credit articulation with your feeder college · Route apprenticeship and pre-apprenticeship completers to CPL review before they enroll |
| **Success** | Named articulation agreements: which noncredit completion maps to which credit course · Hand the completer to a person at the receiving college, not a webpage · Track completers through to transcription and report back what did not transcribe |

## Still open

- **NC strategies are not editable in the tab.** Every card field is an editor
  addressed by `data-slot`/`data-idx`, which writes to the stored **credit**
  priority, so the NC cards are read-only by design. Editing NC's own strategies
  (or a diverging share/factor) needs an editor that writes to
  `ncPrioOverride()`. Until then this receipt and the SQL above are the way in.
- **Two of the four statutory goals are matched by no priority.** Ed. Code
  §78093.2(d)(1) lists access, completion, **career attainment**, and support for
  the chancellor's office's CPL pilot projects; the three priorities cover the
  first two. §78093.2(d)(2) makes demonstrating those metrics a precondition of
  receiving an allocation, so the gap deserves a deliberate answer.
