---
title: EACR — college scope, the CER fold, and the accessibility pass
created: 2026-08-16
updated: 2026-08-16
tags: [lessons, eacr, exhibit-adoption, filters, accessibility, cer]
kb-status: internal
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[exhibit_canonicalization_lessons]]"
  - "[[common_cr_reference_lessons]]"
artifacts:
  - statewide_interactive.js
  - excel_to_dashboard.py
  - tests/eacr_scope.test.js
  - tests/eacr_a11y.test.js
---

# EACR — college scope, the CER fold, and the accessibility pass

Workstream scratchpad for the Exhibit & CR Adoption tab (`#tab-exhibit-adoption`,
`statewide_interactive.js`). Started 2026-08-16 rather than appended to
`exhibit_canonicalization_lessons.md`, which the docs lint already flags at
1.26× its lane budget.

---

## 2026-08-16 (Sky162) — the filter was answering a different question

Sam, opening the session:

> *"Check the College filter and make sure it filters for colleges that have
> adopted the exhibit. I believe it's now filtering for any college that has
> adopted or could adopt. Think about that and recommend a strategy. Sometime I
> might want to sort for colleges that could adopt as an option — perhaps a
> toggle?"*

Plus three more: check the CER wiring, advise on the three collapsible views, and
a goal — *"one stop shopping to view all the exhibits and their credit
recommendations and a convenient view to see the colleges that could adopt."*

Then, mid-session: *"While you're doing the redesign make sure everything is
accessible and mobile friendly."*

### (a) What was learned

**The filter was 93.6% noise, and the number is the argument.** He was right that
it unioned adopters with potentials. What the wording understates is the ratio.
Measured over the live payload:

| | pairs |
|---|---:|
| (card, college) **adopter** pairs | 8,436 |
| (card, college) **potential** pairs | 122,836 |

Per college, filtering to Pasadena City College returned **1,790 cards, 44
adopted (2.5%)**; Bakersfield 1,762 / 129; Santa Rosa 1,734 / 70. The median card
carries **1 adopter and 41 potentials**. Across all 122 colleges, **6.4%** of
College-filter hits were adoptions.

**"Potential" is a TOP-derived claim, which Rule 7 forbids as a primary
determination.** From `excel_to_dashboard.py`:

```
potential = (colleges with a program of study under ANY of this exhibit's TOP codes
             ∪ colleges teaching a course with a matching C-ID) − adopters
```

The TOP branch is why the number is 41: a welding exhibit names every college
with a welding program. That is a *lead*, not a match, and it had been carrying
the word "Potential Adopters" in a column header, a Word report and a CSV.

**The better signal already existed and drove nothing.**
`statewide_prescriptive.js` (`CPL_STATEWIDE_PRESCRIPTIVE`, the M-ID
adoption-leverage layer) holds **739 titles / 4,972 college-pairs** — 25× tighter
than potential — and it *names the local course the college already teaches*. It
rendered inside a `<details>` block on each card and was not reachable by any
filter. This is the recurring shape of this repo's best catches: **the right
value existed and the consumer never asked** (`cpl_memory`
`the-classifier-existed-and-the-consumer-never-asked`, 2026-08-13).

**So: three scopes, not the two-position toggle Sam proposed.** A binary would
have pooled the strong signal with the TOP guesses, which is the very conflation
being fixed. Recorded as Sam's ask, answered one notch differently, with the
reason stated:

| Scope | Source | Pairs | Claim |
|---|---|---:|---|
| **Adopted** (default) | `adopter_names` | 8,436 | Has articulated it |
| **Adopted + likely** | prescriptive M-ID layer | 4,972 | Already teaches the mapping course, course named |
| **Adopted + any** | TOP/C-ID overlap | 122,836 | Same program area — a lead |

**Checked before choosing an adopted-only default.** Sam's standing doctrine
(`cpl_memory` `unadopted-exhibits-are-deliberate-and-must-stay-prominent`) is
that zero-adopter exhibits must stay prominent. Verified: **all 137 statewide
cards have adopters**, so an adopted-only default hides nothing on the
ready-to-adopt shelf. (Two statewide cards match no college at all — zero
adopters *and* zero potential — but they are empty records with no credit recs, a
separate data question.)

**The CER wiring was sound; three gaps sat on top of it.** All **1,745 of 1,745**
classified EACR titles resolve to a `credential_reference_data.js` credential,
zero missing — the identity layer (`kb/unified_titles.json` + `kb/credentials.json`)
is genuinely shared. But:

- **8 credentials rendered as TWO cards.** The card grain is
  `(unified_title, issuer, CPL type)`; the CER's grain is the title. In all 8
  cases one side carried the issuer and was classified, the other had a **blank**
  issuer and was not — and unclassified cards sort to the bottom, so a curator
  saw *Firefighter I* (NFPA, 2 adopters) and never learned of the unclassified
  twin (1 adopter). **A blank issuer means UNKNOWN, not DIFFERENT**, so it folds
  into the title's named issuer — while two genuinely different *named* issuers
  stay separate rather than invent a merge. No such case exists today; the rule
  is what keeps it honest when one appears.
- **`exhibit_ids` was in the payload and rendered nowhere** — grep count zero.
  5,135 MAP exhibit IDs fold into 2,673 cards and none were visible. That was
  exactly Sam's "list all the different aligned exhibits under the common title".
- **4 more titles exist ONLY as unclassified cards** while the CER knows the
  credential. A curation input, not fixed in code.

**Three views → two sub-tabs, and the third was never a view.** The Student view
used the *same* `(unified_title, issuer)` grouping as the Credential view under a
different framing; its one unique asset was the near-me classification, which is
precisely the "who could adopt" answer Sam asked for in goal 4. So it became a
**mode** of the Credentials view rather than a third place to look. Sub-tabs also
fixed a real cost: all three `<details>` sections re-rendered on **every
keystroke** over 2,673 cards regardless of what was open.

**The export layer was outside the loop I had just built.** Found by re-reading
the work against Sam's stated goal rather than against my own diff. #1221 made
the filter and the could-adopt *column* share one scope; Excel, JSON and the Word
report still read `e.potential_names` directly. So whichever scope was on screen,
the file that left the tab carried the full 41-college overlap — **and that is the
layer that reaches a college by email.** A spreadsheet outlives the screen that
produced it.

**The accessibility pass found more defects in day-old work than in inherited
code.** Four of the five were mine, shipped hours earlier:

1. **A partial ARIA tab pattern** — `role="tablist"`/`role="tab"` with no
   `aria-selected`, no `aria-controls`, no `tabpanel`, no arrow keys. It
   *announces* an interaction contract and then does not honour it.
2. **The scope control exposed no selected state at all** — three styled
   `<button>`s. Replaced with **native radios in a `<fieldset>`**: arrow keys,
   "2 of 3, selected" and the focus ring come free, and a hand-rolled radiogroup
   is exactly the thing to get subtly wrong a second time.
3. **Colour-only meaning (WCAG 1.4.1)** — likely-match vs broad-lead separated by
   an *outline colour*. Now two text-labelled groups; the label carries the
   distinction, styling only reinforces it.
4. **`collegeChip` hid the full college name in a `title` on a `<span>`** —
   inconsistently announced, and unreachable on touch. Now `<abbr title>`.

Plus one pre-existing: **"+N more" had never worked.** The handler wrote
`state.expanded[eid + "_pot"]`; the renderer read `state.expanded[eid]`. Clicking
re-rendered identically. It was also a mouse-only `<span>`.

**Mobile: the tab shipped with no responsive rules of its own.** The one thing
that genuinely broke is `.sw-filter-dropdown` — `position:absolute`,
`min-width:220px`, anchored to a ~90px button, so near a phone's right edge it
opened off-screen. Dropdowns now anchor to the filter *bar*.

**The harness trap bit a third time, and `val()` was not enough.** Handoff 161
explicitly warned that the "check that never registers" trap would recur and
prescribed `val()`. It recurred anyway: the first pre-fix run of
`eacr_a11y.test.js` printed **zero checks**, because `val()` guards check
*expressions* while the failure was in an imperative *driver* —
`more().dispatchEvent(...)` where `more()` was null on the pre-fix source. **A
missing element must fail its own check, never take the file down.** Drivers are
now null-safe and `run()` is wrapped so a throw reports as a failed check.

**The one red file on main was not mine.** `team_phrase_sites.test.js` had been
failing since 2026-08-15 — the only red file in 224. It asserted
`/PHRASES = \[[\s\S]{0,900}id: "fin"/`, and Sky160's `raci`→`team` rename added a
~600-char comment *inside* the array, pushing `id: "fin"` to **1,458 chars** from
the anchor. **The property was never violated.** A fixed character window
measures how much *prose* sits above a thing — and it punished precisely the
commit that documented its own reasoning well. This is the rule `cpl_memory`
recorded on **2026-08-14** (`a-test-bound-rots-when-the-code-legitimately-changes`);
the row existed, the check predated it, nobody re-swept.

### (b) Current state

Four PRs merged, Pages deployed, **all 224 test files pass** — main fully green
for the first time since 2026-08-15.

| PR | What |
|---|---|
| **#1221** | Three college scopes, CER fold, aligned exhibits, two sub-tabs |
| **#1222** | Exports re-keyed to the active scope |
| **#1223** | Accessibility + mobile |
| **#1224** | The stale test bound on main (sibling branch, unrelated) |

`tests/eacr_scope.test.js` 49 checks · `tests/eacr_a11y.test.js` 44 checks (40
reproduce against the pre-fix source).

### (c) Strategic roadmap

The tab now answers Sam's goal 4 in one place: a common-reference card carrying
its aligned MAP exhibits, its credit recommendations, its adopters, and — scoped
— who could adopt with the local course named.

Parked / open, in value order:

1. **The 4 unclassified-only titles the CER knows** — a curation fix in
   `kb/unified_titles.json`, not code. Folding them removes 4 orphan cards.
2. **The 2 statewide cards matching no college at all** (zero adopters, zero
   potential, no credit recs) — likely empty records worth a data question.
3. **A sweep for other `{0,N}` character-window test bounds**, which #1224 shows
   rot silently and go red on the wrong commit.
4. **The credential view caps at 50 groups** with a "narrow with filters" note.
   Fine for curation, a real limit for browsing "all the exhibits".

### (d) Next concrete step

Sam uses the tab with the new default and says whether **Adopted** is the right
thing to open on — it is a visible behaviour change, and anyone used to the old
counts will see far fewer rows. Everything else here is downstream of that.
