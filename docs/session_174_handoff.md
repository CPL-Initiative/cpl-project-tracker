---
title: Session 174 handoff — the priorities reorder without rewriting anything, and the join it would have broken
created: 2026-08-20
updated: 2026-08-20
tags: [handoff, session-174, implementation-funding, cobi, my-college, reorder]
kb-status: internal
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[docs/cpl_funding_lessons]]"
  - "[[docs/session_173_handoff]]"
---

# Session 174 handoff

You are **Session 174**. Session 173 was **SkySort**, and it worked one thing:
Sam's three asks on the **Implementation Funding** tab.

⚠️ **Sam frequently runs several sessions at once.** He said so explicitly this
run ("I have another session running on Session 172 queue work"). Check
`git log origin/main` before assuming your branch is the only work in flight,
and expect a `session_174_handoff.md` written by that session too.

---

## Read in this order

1. `CLAUDE.md` §11 — the new **Implementation Funding tab / the $35M model** row.
2. [`docs/cpl_funding_lessons.md`](cpl_funding_lessons.md) — the 2026-08-20
   section. (2026-06 → 07 now lives in
   [`cpl_funding_lessons_archive.md`](cpl_funding_lessons_archive.md); the doc
   had crossed its size budget.)
3. The three KB notes below, if you are touching a reorder or a cross-module join.

---

## What shipped — PR #1268

Sam, verbatim: *"I'm thinking of moving Priority 3 to the Priority 1 position…
rather than copying and pasting everything for both years, I'd like to know if
it would be possible to drag and drop them into position"*; rename **Price
factor → Funding factor**; **auto-copy Year 1 → Year 2 when Front-load is
selected**; *"Push back and better alternatives always welcome!"*

**1. Drag-to-reorder.** Each card gets a **Drag** handle and a **Position**
picker (the picker is the keyboard/screen-reader path, and the only one that
stays truthful when three cards wrap onto two rows).

⭐ **The order is a PERMUTATION stored beside the config, never a rewrite of
it.** Permuting the stored priorities would have to enumerate every field, and
a forgotten field re-points a priority at a **different identity's baked
default** — not theoretical: the live overrides are **partial** (Scenario 2 sets
`metric`/`share` on two priorities and neither `factor` nor `title`), and
`yearPriorities[slot]` is an **object keyed by index string**, not an array.

⭐ **ONE display→source seam** — `prioField` / `prioMetricSource` / `prioUnit` /
`setPrio`, plus `priorities()`. Above it every call site speaks DISPLAY index;
below it, SOURCE index. Per-emitter translation was the alternative and its
failure mode is **an edit landing silently on the wrong priority**.

⚠️ `label` is positional; `key`/`src` are the identity. The baked default-title
list had to move to the SOURCE index too, or an untitled priority adopts the
title of the slot it was dragged into.

⚠️ **The order is WINDOW-LEVEL** (Sam, 2026-08-09: the years are deliberately
identical). Per-year would make P1/P2/P3 mean different things in different
years — and cost him the second drag this exists to save.

**2. My College.** ⚠️ That tab nests each priority's strategies inside its cap
and joined them **BY POSITION**, guarded by a **count** check — which a reorder
cannot trip, because three still equals three. Now an identity join
(`_prios().src` ↔ `collectPrograms().key`). ⚠️ **`buildBriefing()` was dropping
the key** in its remap, so the first identity join resolved to nothing and the
strategies left the funding box silently; its own Part-P assertions caught it.

**3. Funding factor.** Label only — the stored `factor`, the `priofactor` edit
key and `prioPrice()` keep their names, so nothing saved is stranded.

**4. Year-2 sync — pushed back.** A copy fired by the front-load toggle
overwrites Year 2 with no undo **as a side effect of a cash-timing control**, is
a no-op for Scenario 1 and a silent policy edit for Scenario 2, and fires where
it matters least (Year 2 is already carryover). Shipped a non-destructive
**mirror** + an explicit **Copy Year 1 → Year 2** that asks first. **Default
OFF.**

---

## Carryover — pick this up first

- ⚠️ **PR #1268 CI.** TruffleHog (required) passed; the non-required `test`
  check failed with **1 of 231 test files FAILED**. Everything that loads the
  changed files was re-run locally and is green — `college_briefing` 236/236,
  `college_briefing_auth` 26/26, `my_college_scope`, `my_college_refinement`,
  `retheme_tokens`, `suppression_floor`, and ten of the eleven funding suites —
  which leaves **`tests/cpl_funding.test.js`** as the only unverified file.
  It takes >25 min in this sandbox against ~2 min on the runner, so the local
  reproduction is slow, not stuck. **`main` was green on `js-tests` at 18:28
  today, so this is ours, not a pre-existing failure.** Fix it, push, merge.
- **NEXT for Sam:** drag Priority 3 up in a browser and set the new shares +
  funding factors. Recalculation is live and asserted; the allocation-balance
  box flags the shares if they stop summing to 100%.
- **Open question for Sam:** should the mirror be ON for Scenario 1? Its two
  years are already byte-identical, so turning it on costs nothing and makes
  drift impossible — but it is his call, and it ships off.

---

## Patterns that worked

- **Read the live config before designing.** `cpl_memory` said the overlay holds
  the real priorities and the baked defaults are stale; querying Supabase showed
  the overrides were **partial** and stored as an **object**, which is what
  killed the obvious implementation before a line was written.
- **Take the user's mid-turn note as a scope expansion, not a nit.** Sam's *"needs
  to be wired into the My College tab"* is the only reason anyone looked at a
  join in another file that had its own passing suite.
- **Assert the property a rewrite cannot fake** — the statewide total unchanged
  after a reorder, and an edit typed into position 1 landing on the priority
  shown there.

## Safety patterns to honour

- **Never force-push `main`** (Rule 5). Feature branches may `--force-with-lease`.
- **Supabase live-curation safety** (Rule 10) — fresh read at write time, and the
  sandbox cannot reach `*.supabase.co` except through the MCP tools.
- **Rule 4** — `CPL_Dashboard.html` and `index.html` stay identical. This run did
  not touch either (the funding tab injects its CSS from JS, which is why).
- **Merge on `clean` OR `unstable`**, but not while a check you own is red.

## Moniker

SkySort took the name from the work. Take **SkyPair** if the join thread
continues, or coin your own — Sam sometimes names the session in his greeting,
and that always wins.
