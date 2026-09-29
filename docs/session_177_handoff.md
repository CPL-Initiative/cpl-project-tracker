---
title: Session 177 handoff — the funding tests fit again, and the To-Do feed had been broken on main for hours
created: 2026-08-20
updated: 2026-08-20
tags: [handoff, session-177, test-infra, jsdom, memory, todo-feed, implementation-funding]
kb-status: internal
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[docs/cpl_funding_lessons]]"
  - "[[docs/kb-notes/methodology-a-test-file-is-a-memory-budget]]"
  - "[[docs/session_176_handoff]]"
superseded: true
superseded_by: session_178_handoff.md
---

# Session 177 handoff

You are **Session 177**. Session 176 was **SkyGlass** — the moniker Sam used in
his greeting. **PR #1272 is MERGED** (`f5cccba`) and Pages deployed it green, so
everything below is on `main`. A second, docs-only PR carries the checkpoint.

⚠️ **Sam frequently runs several sessions at once.** Check `git log origin/main`
before assuming your branch is the only work in flight. Two Session-173 sessions
running in parallel are what broke the To-Do feed described below.

---

## Read in this order

1. **`cpl_memory` FIRST** (Rule 8 — sessions *query*, not only write). Tags
   `test-infra` / `jsdom` / `memory` / `todo-feed`. Three rows written this run.
2. [`docs/kb-notes/methodology-a-test-file-is-a-memory-budget`](kb-notes/methodology-a-test-file-is-a-memory-budget.md)
   — the durable finding, and the only thing you need if you are about to add a
   jsdom suite.
3. [`docs/cpl_funding_lessons.md`](cpl_funding_lessons.md), the 2026-08-20
   SkyGlass section — the measurements.
4. `tests/lib/cpl_funding_harness.js` — the budget, written where someone adding
   a window will hit it.

---

## What Sam asked for

SkySort's handoff left one item explicitly to a successor's judgment rather than
an assumption: *"the cap raise buys headroom, it doesn't fix the file.
cpl_funding.test.js is 2,900 lines and ~60 jsdom windows in one process, and
those windows are never reclaimed — window.close() doesn't release them, which is
its own finding. Splitting it is the real repair."* Sam passed it on as this
session's work.

Mid-run he also reported that **the Curate button was still visible on the public
Fact Sheet**, and asked whether the test file could be the cause.

---

## What shipped

**① `tests/cpl_funding.test.js` is nine suites.** `shell` (static invariants, no
jsdom, ~1 s) · `render` · `rollup` · `equity` · `scenarios` · `earning` · `rate` ·
`rural` · `pool`, over a shared `tests/lib/cpl_funding_harness.js`. Assertion
bodies were moved **verbatim by line range**, not retyped.

| | before | after |
|---|---|---|
| assertions | 575 | **575** (49+123+39+103+72+41+37+56+55) |
| peak RSS | 8,642 MB | **2,393 MB** (the `render` suite) |
| wall clock | 462 s | 333 s sequential — and they now parallelise |

⭐ **The handoff's finding was half right, and the wrong half was load-bearing.**
It is *not* that jsdom windows are unreclaimable — fifteen windows that are
constructed but never booted cost **57 MB in total**, and are collected. Fifteen
**booted** cost 705 MB, ~44 MB each, permanently. `window.close()` is a no-op
here; so is nulling, block-scoping, an IIFE, and awaiting a microtask or a full
event-loop turn. Heap snapshots name the retainers: **`(Stack roots)`** — the
suite's own still-running top-level frame — and, once that root is removed,
**`(Micro tasks)`**, a promise reaction holding `boot()`'s `onDOMContentLoad`
closure on a queue a long synchronous file never drains. **The only event that
reclaims a window is the process ending**, which is why splitting is the only
cure and every in-file tidy-up was a placebo.

⚠️ **Budget when you add to these suites: ~44 MB per booted window over a ~40 MB
floor. Past ~15 windows in one file, start a new suite** rather than trimming
inside one. The 12,288 MB cap in `tests/run.js` stays as headroom for everything
else — it is not this file's life support, and its comment now says so.

⚠️ **A loop-shaped probe cannot reproduce a block-shaped file.** Booting in a
`for` loop and measuring afterwards shows the memory coming back, because the
frame returned. The real file is sixty *sibling blocks* in one still-running
frame. Reproduce the shape, not the operation.

**② The dashboard's 📋 To-Do feed was broken on `main`, and this run found it by
accident.** `kb/cpl_todos.json` carried raw `<<<<<<<` / `=======` / `>>>>>>>`
markers, committed by PR #1268 where **two parallel Session-173 sessions had each
rewritten the feed**. The file is invalid JSON, so the button had nothing to read
on any tab — and it **fails soft by design**, so it simply did not appear and
nothing reported an error. Both sides are merged back together, finished items
dropped.

**③ A second, older To-Do defect underneath it.** The feed writes
`for: "Sam" | "Fable"` (the field `CLAUDE.md` Rule 9 documents); `cpl_todos.js`
grouped on `it.who`. Nothing threw — `byWho[undefined]` is a perfectly good
object key — so the panel rendered **one section headed "For Undefined"** holding
every item, and the split the feature exists for was invisible. The suite passed
throughout, because **its fixture used the spelling the code read**. Fixed with a
`whoKey()` that accepts either and never builds a heading out of a missing value.

**④ Guards for both, verified to fail first.** `tests/cpl_todos.test.js` now
checks that the *shipped* feed parses and matches the renderer's contract, that a
real-shape feed renders both sections and can never render "For Undefined", and
that **no tracked text file carries an unresolved merge conflict** (column-0
anchored, ~0.8 s over 1,818 files). Each was run against the pre-fix state and
does go red.

---

## Sam's Curate report — answered and CLOSED, no code change

Mid-session Sam reported the Curate button still visible on the public Fact
Sheet. **It was not the test file** — nothing under `tests/` is served, and no
page loads it. The code was correct on `main` and Pages had deployed #1269 at
20:40 UTC; `.btn[hidden]{display:none !important}` and the `btn.hidden =
!isRevealed()` call are both present.

✅ **He then opened a private window and confirmed the button is gone**
(2026-08-21). The #1269 mechanism is proven on the deployed page, not just in
headless Chromium — which closes the item Sky175 could only exercise locally.

⭐ **The durable bit: a deliberately sticky reveal will be reported as a
regression by the person it was built for.** The curator is exactly the user
whose browser holds the flag, so the feature working and the feature broken look
identical from outside. The three things to rule out, in order:

1. **His own browser remembers the reveal.** `?curate=1` writes
   `localStorage.cpl_fs_curate = "1"` deliberately, so the bookmark keeps
   working. Any browser that has opened that link once will show the button
   forever. **`fact-sheet/?curate=0` forgets it.**
2. **He is signed in.** A live COBI reviewer session reveals the button by
   design, and since #1207 that session is shared across browser tabs.
3. A cached `factsheet_edit.js` / `factsheet.css` — the tags carry no version
   query, so a hard refresh is the check.

**The only question that distinguishes them is "private window, plain URL, no
session?"** — ask it first, before touching code. No session can run that check
itself; the sandbox is egress-blocked from `cpl-initiative.github.io`.

---

## The funding-model explainer (Sam's second ask this session)

*"Have a look at the CPL implementation funding tab Calculation sanity check…
revise the language to be non-techie and as simple as possible… I'm getting ready
to shop this to my CO colleagues."*

⭐ **The rename was the brief in miniature.** "Calculation sanity check" existed to
*prove the arithmetic*, and read like it — `netCollege`, `sizePct`, price factors,
policy dials. A CO colleague wants to understand the *policy*. Same math,
different reader, so it is a different document, not a copy-edit. It is now
**"How this funding model works"**, five plain steps from the $35M to what one
college is offered and must show. Source lives in the repo at
`prototype/funding_model_explainer.html`; it publishes to the SAME artifact URL
(`SANITY_URL` in `cpl_funding.js`), so the tab's link never moved.

⭐ **Read the saved config before writing a word of it** — the live scenario had
moved since the artifact's 2026-08-04 publish and none of it was guessable:
shares **.50/.30/.20 → .34/.33/.33**, factors **½/1/2 → 1.0/1.0/1.0**,
**`priorityOrder [2,0,1]` — Sam has used SkySort's reorder and Access is now
first**, all three metrics in CPL FTES, deadline **2026-11-01**, Year-2 mirror
**on**. Second time this week the answer was in a table rather than a question.

⚠️ **The page is a SNAPSHOT, deliberately** — a colleague opening a link from an
email should not meet a page somebody is mid-edit on. So when the shares, factors
or order change: `node prototype/build_funding_model_explainer.js <config.json>`
(config read via the Supabase MCP), then re-publish to the same URL. Every figure
is generated by `cpl_funding.js`'s own engine through the jsdom harness — none is
retyped.

⭐ **It says one thing the old page did not.** The $150k minimum is funded from
inside the same pot, so a college above it is effectively funded at **~$5,060 per
FTES rather than $5,649.63**, while a floored small college reaches its target on
far less (Lassen ~$23,900/FTES). "Everyone is paid the state rate" would have been
false.

**Verified, not claimed:** 26 painted contrast pairs all pass AA (computed with
`prototype/check_contrast.py`'s math), and `prototype/check_funding_explainer.js`
runs a real Chromium over nine widths plus structure and keyboard checks — 36
checks green. ⚠️ **Two of those checks were wrong before the page was** (the
reduced-motion probe `return`ed on the first cross-origin sheet and never looked
at the page's own; the skip-link tab test ran with the search box still focused).
Sky175's lesson, immediately.

⚠️ **American English** (Sam, 2026-08-21) — `cheque`, `colour` and two `towards`
were the whole list on the page. Worth a sweep on anything audience-facing.

---

## Carryover

| # | Item | Status |
|---|---|---|
| 1 | **Sam opens the three public pages on a phone** (Fact Sheet · Sierra · Veteran map) | Still the one thing no session can do. Carried since handoff 174. |
| 2 | ~~Sam confirms Curate is hidden in a private window~~ | ✅ **CLOSED 2026-08-21** — he did, and it is. |
| 3 | ~~Drag Priority 3 into the Priority 1 slot~~ | ✅ **DONE — read from the saved config**: `priorityOrder [2,0,1]`, shares 34/33/33, factors all 1.0. Still open: whether the funding factors should stay at 1.0. |
| 3b | **Sam reads the explainer end to end before sending it out** | New. And re-run the generator + re-publish if he moves a dial. |
| 4 | Everything in handoffs 173–176 | Untouched by this run. |

---

## Patterns that worked

- **Reproduce the shape, not the operation.** Three probes said "no leak" before
  one shaped like the real file said 925 MB. The generated-file trick (emit N
  sibling blocks, measure in-frame) is worth reusing.
- **Use the instrument that can see the retainer.** Two sessions guessed at the
  cause from the code; one heap snapshot named it in a single line
  (`<-- (Stack roots)`). `v8.writeHeapSnapshot()` plus a ~40-line reverse-BFS
  over the JSON is all it takes.
- **Move code by line range, not by hand.** The split was generated from the
  original's own line numbers, and the 575-assertion total is the proof nothing
  was dropped or duplicated.
- **Check a new guard fails before keeping it** — the repo's own
  `verify-with-the-instrument-that-can-see-the-defect` rule, applied to four new
  checks.

## Safety patterns to honour

- **Never force-push `main`** (Rule 5). Feature branches may `--force-with-lease`.
- **Rule 4** — `CPL_Dashboard.html` and `index.html` stay identical. Not touched
  this run.
- ⚠️ **Do not add `playwright` to `package.json`** (handoff 174) — CI has jsdom
  only.
- ⚠️ **`CLAUDE.md` is 2.22× its docs-audit budget and this run deliberately added
  nothing to it.** The §11 narrative slots already hold two sessions, and this
  work is test infrastructure, not a roadmap workstream — the lessons doc and the
  KB note carry it. If you need a slot, move SkySort's narrative to
  `docs/roadmap_archive.md` first.

## Running the checks

```bash
npm test                                   # 262 files
node tests/cpl_funding_render.test.js      # the heaviest funding suite, ~86s
node tests/cpl_todos.test.js               # feed contract + the conflict scan
```

## Your moniker

SkyGlass suggests **SkyLedger** — this run was about what a process is holding
and who is allowed to say it is finished. Take it or coin your own; Sam sometimes
names the session in his greeting, and that always wins.

**Sign off with your moniker AND the next handoff number** (Sam, 2026-08-13) —
e.g. *"SkyLedger signing off. Next is Session 178 — `docs/session_178_handoff.md`."*
