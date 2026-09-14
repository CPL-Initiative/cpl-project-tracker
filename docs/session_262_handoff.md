---
title: Session 262 handoff — the band wrapper retires, and a double claim surfaces
date: 2026-09-14
session: 262 (SkySave)
tags: [handoff, implementation-funding, testing, a11y]
status: current
---

# You are Session 262

Your moniker is **SkySave**. S262 rebuilt the funding tab's Outcome section to Sam's
2026-09-14 rulings — the statutory band wrapper is gone, the outcome rides each card, and
the project allocation splits across (C)/(D). **PR #1574 is merged.** The most useful
thing in this handoff is the defect the feature request exposed.

⚠️ **PARALLEL LANES.** [`docs/session_253_handoff.md`](session_253_handoff.md) (SkyProof,
dark mode) and [`docs/session_254_handoff.md`](session_254_handoff.md) (SkyStar, SkyView)
are still live for their lanes; this file supersedes only
[`docs/session_261_handoff.md`](session_261_handoff.md).

Read in order:
[`lanes/implementation-funding.md`](reference/lanes/implementation-funding.md) ·
[`methodology-a-figure-tagged-to-two-owners-is-claimed-twice`](kb-notes/methodology-a-figure-tagged-to-two-owners-is-claimed-twice.md) ·
[`methodology-retiring-a-structure-means-rewriting-its-guard`](kb-notes/methodology-retiring-a-structure-means-rewriting-its-guard.md) ·
[`cpl_funding_lessons.md`](cpl_funding_lessons.md) (2026-09-14) · PR #1574.

## What Session 262 shipped — PR #1574, merged

- ⭐ **THE BAND WRAPPER IS RETIRED.** The card carries what the band head did — key, name,
  citation, the statute's own sentence — plus a picker. `setPrioGoal()` writes it; the
  measure-derived goal stays the DEFAULT. ⚠️ **Clearing stores the sentinel `"derived"`
  rather than deleting the key** — a deleted key lets a SHARED value resurface and the
  reset undoes itself on the next render.
- ⭐ **THE ORPHAN BAND WENT TOO, AND THE GUARANTEE GOT STRONGER.** A flat grid filters
  nothing: every card renders always, and an unresolvable one says *Awaiting a statutory
  outcome* on its own face. The per-outcome Total Possible survives as the **totals row**,
  which names **every** statutory goal, served or not — the guard that stops a goal going
  quiet now that cards can be re-pointed.
- ⭐ **THE PROJECT ALLOCATION SPLITS ACROSS (C)/(D) — AND THAT FIXED A DOUBLE CLAIM.**
  See below.
- **Reported cards are STORED with their own identity** (Sam's ruling), defaulting to the
  derived set, one per goal, with a goal-keyed `reportedStrategies` store.
- **Every section below the Metric collapses**, each summary carrying its own figure.
  Designated activities stays OPEN — his 2026-09-13 always-visible ruling survives,
  because collapsible and collapsed are different asks.
- **Add/delete designations with a live count**, from one renderer shared by both card
  kinds. **Card size** is a per-browser dial (width + a MINIMUM height).
- `cpl_funding_outcome_cards.test.js` (**77 assertions**) REPLACES the bands suite.

## ⚠️ Read this before you touch any per-goal attribution

The project allocation was tagged to **(C) AND (D)**, and `goalFunding()` pushed its
**full** amount into each — $8,959,692 reported under two statutory goals at once, $17.9M
of reporting against an $8.96M allocation. Every row was correct in isolation, **nothing
ever summed the goals**, and so it survived for months. It surfaced only because Sam asked
for a split; no audit found it.

**A tag is many-to-many. An amount is not.** Store the split, not the tag alone. The test
that catches this is the one that ADDS THE ROWS UP, never one that checks a row.

## Sam's decisions and corrections this run

1. ⚠️ **"The bands are included on the priority cards and illustrated on the screenshot."**
   I had read the arrow as "put a picker on the card" and scattered the band's other
   content. The band goes ON the card — all four pieces. **Verify an ask against the
   screen, not your reading of it.**
2. **"Seems the card should be stored with its own identity"** — reported cards became
   stored entities rather than pure derivations.
3. **The four calls, answered by number:** keep the statute quote on every card even when
   it repeats · keep the outcome totals line · the derived-vs-set question "is answered by
   the consistent card family" · name the designated activities on the card.
4. **"Make sure it is all wired to public view and explainer and stays AA and mobile
   friendly as you build."**
5. **"Just to be consistent"** — (C)/(D) get Position, Drag, the outcome picker and
   Recommended strategies; every section below the Metric collapses.
6. Start the split with the whole $8,959,692 on (D), editable, with (C) taking the
   remainder — **and vice versa**.

## NEEDS SAM

1. ⭐ **POSITION + DRAG ON THE (C)/(D) CARDS** — the one ask from this run NOT built.
   It needs a single display order covering both card kinds, and `priorityOrder` already
   governs the priority sequence well beyond this section (the ledger, exports, `_prios()`).
   A second order over the same cards is a contradiction waiting to happen. **Two options:**
   one id-keyed `cardOrder` that writes `priorityOrder` in the same action so the two
   cannot disagree, or reported cards ordering among themselves after the priorities.
   **The approved mockup showed the first.** Mockup:
   https://claude.ai/code/artifact/6b1199c2-5245-486e-8e88-108e9d940e3c
2. **Whether the funding tab's 7 `--text-faint` contrast findings are in scope.** They are
   pre-existing and identical on `main`; they belong to the COBI-wide contrast queue, and I
   did not widen the PR to take them.
3. **The count noun.** The control says *Designate activities*; the count says *designated
   projects*. Both are live strings and his convention covers both, but not side by side on
   one card. One word, his call.
4. Carried: the funding dials ⓪; the annual-view earning percent; `CollegeID2`; the calm
   pass's lettered calls; whether COBI keeps showing "<10".

## Queue

- **COBI-wide CONTRAST** — 17 of 38 routes, worst `#FFFFFF on #FFFFFF` at 1:1. Grouped by
  COLOR PAIR that is a short list of decisions, not 105 problems. In no lane.
- **137 focus-ring findings** on the explainer; 55 on the tab. Pre-existing.
- ⚠️ **Docs over budget:** `docs/roadmap_archive.md` 4.3× (worst in the corpus, untouched);
  `cpl_funding_lessons_archive.md` 1.78×; `lanes/cobi-dark-mode.md` 1.54×;
  **`lanes/implementation-funding.md` 1.09×** (brought down from 1.19× this run while
  absorbing a run's worth of state — further cuts now trade clarity for a threshold).
- Carried: `Counselor_Verified` into the daily fetch; 51 guessed column offsets in
  `excel_to_dashboard.py`; SkyView ⑩/⑪ (S254); the explainer video shot sheet.

## Patterns that worked

- **Show the shape before building it.** S261 went past the brief; this run built the
  mockup first and Sam ruled on it five times mid-build. Every correction was cheap.
- **Baseline the sweep before reporting it.** `npm run a11y` said FAIL; a worktree run of
  `main` said FAIL *plus three more*. "Fails identically, minus three" is a completely
  different report from "fails".
- **Read the retired suite's header.** It states the invariant in prose, above the
  assertions — that paragraph is the specification for the replacement.
- **Delete, don't rewrite, when a doc is over budget.** Two rounds of "compaction" produced
  text of the same length and one round GREW the file.
- **Let the guards read your prose.** Two house-rule breaches in my own rendered sentences
  were caught by `cpl_funding_calm`, neither by re-reading.

## Safety patterns to honor

Rule 4 · Rule 5 (never force-push `main`) · Rule 10 (Supabase only through MCP) · the
`test` check green on the CURRENT head before every merge, and ⚠️ **a wake's `head_sha`
routinely names a SUPERSEDED commit** — always re-read `get_check_runs` · **rebuild
`kb/dependency_map.json` as the genuinely LAST step** (it records LINE NUMBERS; CI went red
on exactly this again this run) · never re-baseline `check_floor.json` from a contended run
— swap the single entry by hand from an isolated one · `unlocked()` decides where a write
LANDS, not whether a control renders · `cpl-chat deploy` is Sam's · MAP read-only · the
public KB untouched.

## KB notes added this run

- `methodology-a-figure-tagged-to-two-owners-is-claimed-twice`
- `methodology-retiring-a-structure-means-rewriting-its-guard`

---

*Greetings, you are Sky**Order** (Session 263), see Sky**Save**'s handoff —
`docs/session_262_handoff.md` — let's keep rolling with our queue.*
