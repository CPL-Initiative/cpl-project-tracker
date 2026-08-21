---
title: Session 174 handoff — the Fact Sheet is public-clean and phone-usable; the funding priorities reorder, and one test file is out of room
created: 2026-08-20
updated: 2026-08-20
tags: [handoff, session-174, fact-sheet, accessibility, mobile, curate, public-surface, implementation-funding, reorder, test-infra]
kb-status: internal
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[docs/fact_sheet_lessons]]"
  - "[[docs/cpl_funding_lessons]]"
  - "[[docs/kb-notes/methodology-verify-with-the-instrument-that-can-see-the-defect]]"
  - "[[docs/session_173_handoff]]"
superseded: true
superseded_by: session_178_handoff.md
---

# Session 174 handoff

You are **Session 174**. **Two sessions numbered 173 ran in parallel**, and this
handoff carries both — Sam runs several at once, and each wrote its own
`session_174_handoff.md`; they were merged rather than one overwriting the other.

- **SkyCurate** — the Fact Sheet run. Merged and live on `main` (`d14d2f2`,
  PR #1269), Pages deployed green. That is everything down to the divider.
- **SkySort** — the Implementation Funding reorder. **PR #1268 is OPEN, NOT
  merged**, and its `test` check is RED. Section at the bottom.

⚠️ **Sam frequently runs several sessions at once.** Check `git log origin/main`
before assuming your branch is the only work in flight.

---

## Read in this order

1. **`cpl_memory` FIRST** (Rule 8 — sessions *query*, they do not only write).
   Tags `fact-sheet` / `accessibility` / `verification`. Five rows written this
   run; the two carrying Sam's rulings name him in `verified_by`.
2. [`docs/fact_sheet_lessons.md`](fact_sheet_lessons.md) — the 2026-08-20
   SkyCurate section has the measurements and the reasoning.
3. `CLAUDE.md` §11, row **"Fact Sheet (public) — curate access + accessibility"**.
4. The two new KB notes (both durable beyond this workstream):
   [`methodology-hiding-a-control-also-hides-the-way-in`](kb-notes/methodology-hiding-a-control-also-hides-the-way-in.md)
   and [`methodology-verify-with-the-instrument-that-can-see-the-defect`](kb-notes/methodology-verify-with-the-instrument-that-can-see-the-defect.md).

---

## Decisions Sam made this run (these are inputs, not my inferences)

- **"Hide the Curate button so the public doesn't see it…but I would like it to
  be available somehow for the MAP team to curate."** The ruling is *hide from
  the public, keep team access* — he did not specify the mechanism, and approved
  the recommendation (session-driven + `?curate=1`) with **"Ship it!"**.
- **"Make sure everything is accessible and mobile friendly"** — asked as a
  follow-up for the Fact Sheet specifically, but treat it as the standing
  expectation for **any public surface** you touch. He apologised for asking
  late; he should not have — the audit found more than the feature did.

---

## What shipped

**① The Curate button is hidden from the public.** Two ways in:

- a **live reviewer session** — the page now loads `cpl_session.js` (the #1205 /
  #1207 keeper), so signing in on COBI (About → reviewer sign-in) reaches the
  Fact Sheet across browser tabs;
- **`?curate=1`** — stripped from the address bar on read, remembered per
  browser, `?curate=0` forgets. **The bookmark to hand anyone is
  `fact-sheet/?curate=1`.**

⚠️ **Do not "simplify" this to the session path alone.** The button *was* the
sign-in entry point, so session-only strands a curator with no session — which
is exactly the person who needs to sign in. The second door is the point.

⚠️ **Never describe this as security.** Writes are RLS'd to
`is_allowed_reviewer()`; `factsheet_edit.js` is served publicly, so the switch is
discoverable by design. A test pins that the reveal flag is never consulted by
the auth helpers.

**② Four accessibility/mobile defects fixed** — the statewide grid stacks below
560px (it needed 368px of fixed track, so at 360px the page scrolled sideways,
the program name printed *on top of* its own figure, and "Could adopt" was
clipped out of existence); a skip link; the funding table's scroll container is
now a labelled region focusable only while it overflows; heading levels no longer
skip. All 31 painted contrast pairs already passed AA.

---

## Carryover — nothing is blocked

| # | Item | Status |
|---|---|---|
| 1 | **Sam opens the Fact Sheet on his phone** | **The one thing no session can do** — the sandbox is egress-blocked from `cpl-initiative.github.io`. The mobile rework is verified in headless Chromium, not on glass. |
| 2 | Confirm Curate appears after a COBI sign-in | The cross-tab session path was reasoned and unit-tested, never clicked in a real browser. |
| 3 | Point the layout harness at `sierra/` + `veteran-sprint-map/` | The other public standalone pages. **Neither has ever had a layout audit**, and both are shared with colleges. Highest-value next engineering step. |
| 4 | Everything in handoff 173 | The 13:40 UTC custom-report cron, the P5 Cx surface decision, the clean-up worklist lanes — all untouched by this run. |

---

## Patterns that worked

- **Recommend before building when asked to.** Sam said *"consider and
  recommend"*; the recommendation surfaced the strand-the-curator problem before
  a line of code, and that shaped the design.
- **Measure, don't assert.** Every claim in the PR is a number from a real
  renderer or a computed contrast ratio. The two defects that mattered most were
  invisible to nine existing jsdom suites.
- **Screenshot a change whose claim is visual.** The heading re-level broke the
  Contents heading and every test still passed; a before/after pixel diff caught
  it. Final desktop diff: **0 px**.
- **Suspect a brand-new check when it goes red.** Two of mine were wrong before
  the code was — an x-axis-only overlap test, and an unanchored `color:` regex
  matching `outline-color`.

---

## Safety patterns to honour

- **Rule 4** — `CPL_Dashboard.html` and `index.html` stay identical. (Not
  triggered this run: `fact-sheet/index.html` is standalone.)
- **Rule 5** — never force-push `main`.
- **Rule 7 / TOP** — last-in-line corroborator, never a gatekeeper.
- **Artifact policy** — code-only PRs; let the cron publish artifacts.
- ⚠️ **Do not add `playwright` to `package.json`.** `fact-sheet/check_mobile_layout.js`
  is deliberately outside `tests/` and outside `npm test`: CI has jsdom only, and
  a dependency there makes CI download browsers for a check it never runs. An
  incidental `npm install` added it this run and it was reverted.
- ⚠️ `*/` **inside a block comment ends the comment.** Cost a syntax error when
  documenting a glob path.

---

## Running the checks

```bash
npm test                                  # 232 files, includes the 69-check a11y suite
node fact-sheet/check_mobile_layout.js    # Chromium: 9 viewports + keyboard + reduced motion
node fact-sheet/check_mobile_layout.js --shots /tmp/shots   # + before/after screenshots
```

The harness finds the sandbox Chromium automatically; `PLAYWRIGHT_CHROMIUM`
overrides. It exits non-zero on a defect, so it can gate a release by hand.

---

## Your moniker

SkyCurate suggests **SkyGlass** — the run's lesson was that some defects are only
visible through the right lens, and the next obvious job (auditing the other two
public pages) is the same lens pointed somewhere new. Take it, or coin your own;
Sam sometimes names the session in his greeting, in which case use his.

**Sign off with your moniker AND the next handoff number** (Sam, 2026-08-13) —
e.g. *"SkyGlass signing off. Next is Session 175 — `docs/session_175_handoff.md`."*

---

# SkySort — Implementation Funding (PR #1268, OPEN and RED)

⚠️ **Do not assume this is merged.** It is not. Sam looked at the live tab and
asked where the drag-and-drop was — the answer is that Pages serves `main`, and
this never landed.

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

## ⚠️ The blocker: cpl_funding.test.js is out of memory, and it is not this feature

CI reports, in the runner's own words now:

    1 of 231 test file(s) FAILED:
      ✗ cpl_funding.test.js — killed by SIGABRT

That is a V8 heap-limit abort against the 8,192 MB cap `tests/run.js` gives each
child — **not a failed assertion**. The feature's own 69 assertions pass, as do
the other eleven funding suites and `college_briefing` (236/236).

**What was measured, so the next session does not repeat it:**

| | `main` | this branch |
|---|---|---|
| MB retained per render | 42.0 | 42.0 |
| MB leaked per discarded jsdom window | 44.81 | 44.82 |
| Heap at check 25 / 50 / 75 / 100 | 59 / 111 / 153 / 581 MB | 59 / 98 / 143 / 573 MB |

The two are **indistinguishable on every axis**, and `main` is marginally
*higher* at check 100. `main` reaches 5,443 MB by check 400 of 575 — it passes
with a few hundred MB of headroom, and this branch tips over it.

⚠️ **Two fixes were tried and BOTH were wrong about the cause** — memoising
`priorityOrder()` (kept: it is right on its own merits, the reorder seam should
not allocate per lookup) and closing stale jsdom windows in the test
(**reverted**, `1a391fb`, since it did not help and should not sit in the diff
pretending to). Do not re-try either.

⭐ **The honest reading is that this file is at ~95% of its ceiling on `main`
and any addition tips it.** The options, in the order worth considering:
① split `cpl_funding.test.js` — it is 2,900 lines and 62 jsdom windows in one
process; ② raise the per-child cap in `tests/run.js` (runners have 16 GB, the
comment already calls the cap "generous, uniform" and it has not moved as the
file grew); ③ find what makes 62 windows unreclaimable — `window.close()` alone
did not do it, which is itself a finding.

**Kept from this run regardless of how that lands:** `tests/run.js` now NAMES
the files that fail and says how (`cacd7a5`, `48bb236`). "1 of 231 FAILED" cost
this session an evening of running 55 files one at a time to find the one; the
summary sits at the end of the log, which is the part CI actually lets you
fetch.

## Moniker

SkyCurate and SkySort both ran as 173. Take **SkyPair** if you continue the
funding thread, or coin your own — Sam sometimes names the session in his
greeting, and that always wins.
