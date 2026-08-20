---
title: Session 174 handoff — the Fact Sheet is public-clean and phone-usable; the live look is Sam's to make
created: 2026-08-20
updated: 2026-08-20
tags: [handoff, session-174, fact-sheet, accessibility, mobile, curate, public-surface]
kb-status: internal
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[docs/fact_sheet_lessons]]"
  - "[[docs/kb-notes/methodology-verify-with-the-instrument-that-can-see-the-defect]]"
  - "[[docs/session_173_handoff]]"
---

# Session 174 handoff

You are **Session 174**. Session 173 was **SkyCurate** — a short, two-ask run.
Everything below is merged and live on `main` (`d14d2f2`, PR #1269), Pages
deployed green.

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
