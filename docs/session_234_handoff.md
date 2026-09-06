---
title: "Session 234 handoff — the outline is still unbuilt, and one payload is twelve days stale"
created: 2026-09-06
updated: 2026-09-06
tags: [handoff]
obsidian-folder: cpl-project-tracker/handoffs
---

# You are Session 234

Your moniker is **SkyGrain**. Predecessors: SkyReply S231 → SkyOutline S232 →
**SkyBuild S233**.

## What S233 did — two rounds of reports on SkyView (PR #1493)

**Round 1: an observation log of sixteen findings.** Four were real and are
fixed; two were not defects; one was right about the arithmetic and wrong about
the mechanism.

1. ⭐ **"No click path back to the discipline" and "Escape backs out only if you
   arrived by keyboard" were ONE defect.** `kbIsl`/`kbNode`/`kbInside` were set
   only by the Tab/Enter path, so the back path existed and was unreachable by
   the route almost everyone takes. `kbSync()` points the cursor from every
   selection path now; the panel also carries a **Back to `<discipline>`** word.
2. The panel kept its scroll when opening an identity. ⚠️ Reset at the **entry
   points only** — `renderNode()` fires on every keystroke, and resetting there
   restates Sam's ruling 3a friction as a feature. A test forbids that direction.
3. `DESC_BASES` tried an uncommitted local base first, costing a guaranteed 404
   per discipline on the deployed page. Ordered by `location.hostname` now.
4. The identity-system chip — 13 of 16 chips on a panel — carried no title.

⚠️ **Two findings were wrong on inspection** (Pan/Move DO carry `aria-pressed`;
`row count` DOES carry an explaining title), and **the finding ranked first was
the most wrong**: the brief's payload figure was correct for the file it named,
and the session had measured a different payload on the same page.

**Round 2: Sam drove it and reported five more, all fixed.** The hover returned
the **identity** card on 14 of 30 college courses (an opened ring spreads over
its neighbors and `pick()` gave the circle priority); the purple canvas is the
**membership glow** reaching 983px on a 960×600 canvas, **not** the focus disc;
`weldi` lost *Introduction to Welding* because tiers tested the string start
only; Hide died on the next pick; the list is paged (ranked once to 300,
revealed 60 at a time). Plus **Similar courses**, ordered Beg → Int → Adv.

## Read these first, in order

1. [`docs/reference/lanes/skyview-ccr-interface.md`](reference/lanes/skyview-ccr-interface.md)
2. [`docs/ccr_atlas_lessons.md`](ccr_atlas_lessons.md) — the two 2026-09-06 sections
3. [`methodology-a-figure-is-only-wrong-relative-to-the-payload-it-names`](kb-notes/methodology-a-figure-is-only-wrong-relative-to-the-payload-it-names.md)
   and [`methodology-a-fixture-too-small-to-fail-makes-a-guard-a-decoration`](kb-notes/methodology-a-fixture-too-small-to-fail-makes-a-guard-a-decoration.md)

Then run **`python3 kb/doctrine.py --read <files>`** before concluding anything
from the data.

## Your priority: STILL BUILD THE COURSE OUTLINE

It has now been planned twice, cleared twice, and built zero times. Nothing
blocks it. Sam's design is settled and binding — the full list is in the lane;
the load-bearing parts:

- A synthetic description may show **"as long as it is clearly labeled
  MAP-Generated for faculty consideration and revision before use."**
- **Layered from the start**; MAP exhibits and military CRs are the next layers.
- Reviewers **edit titles and re-subject**; re-mint only when verified **and**
  admin-released.
- Thin skills are **included with a confidence chip**, not dropped.
- **A proficiency level on the course AND on each skill** — two axes, carry
  both, derive neither. ⚠️ `courseLevel()` and the Beg/Int/Adv ladder now exist
  in `prototype/ccr_universe.js`; reuse them rather than re-deriving.
- ⚠️ **Double-click is taken.** Split it: a course opens the outline, empty
  island ground keeps today's behavior.
- ⚠️ We hold **57 published welding credit recommendations and ZERO skill
  statements.** Everything else is buildable from data we already have.

## NEEDS SAM — decide before it bites again

⚠️ **The atlas payload is twelve days older than the universe payload.**
`prototype/ccr_atlas_data.json` says `_generated_from: 2026-08-24 15:34`;
`prototype/ccr_universe.json` says `2026-09-05 15:22` — a gap spanning the
authority recode, the Z-band retirement and the prefix fold. That is the WHOLE
of the 117-of-158 per-discipline disagreement (net −6, `(no discipline yet)` 955
lower in the universe), so the −6 needs no investigation. **The staleness does:**
the discipline tables read the older payload while the map reads the newer, so
one screen can show Health 43 apart. `daily-dashboard.yml` builds only the
description shards. This folds into his standing question ② — should the daily
run rebuild the layouts? Until he rules: **rebuild both payloads in one commit
or neither.**

Also open: **ruling 9's follow-up** (how three skill-statement sources reconcile
when they disagree) and **ruling 2's queue** (routed through Governance, spec is
the ADR's four-item checklist, not built).

## Left deliberately, for Sam not a session

Logged, not fixed: token chips read as breadcrumbs but only their `×` is a
control; only the title is a hit target in a panel row; a carried course has no
in-panel destination; *Recenter* targets the token, not the panel; the canvas
sits behind 217 tab stops. **Enter still closes the suggestion list** and flies
the map — the form's documented two-behavior design, and Sam withdrew that
report before reproducing a narrower one.

## Patterns that worked

- ⭐ **Verify every reported defect against the source before touching it.** Two
  of sixteen dissolved on a grep, and the one ranked first was a correct number
  about a different file. S231 paid this lesson; S233 paid it twice more.
- ⭐ **When a perturbation comes back GREEN, suspect the fixture, not the
  assertion.** Two guards this run asserted exactly the right thing on a fixture
  that could not produce the condition. The assertions were never the problem.
- ⭐ **Measure which, not how many.** "The hover is wrong" became tractable as
  "16 of 30 stars return the wrong card", and the fix moved it to 30 of 30.
- **Reproduce an inherited number against ITS OWN source** before correcting it.
- **The build is part of the change** — `skyview.html`, the payloads and the
  dependency map rebuild in the same commit. ⚠️ The docs catalogs too:
  `kb/_build_docs_index.py` is a CI check, and forgetting it turned `test` red
  this run.

## Safety patterns to honor

Rule 10 at any write: fresh live read, guarded statement, a receipt that makes it
reversible. A **new write surface** routes through Governance and the privacy
ADRs *before* it ships. Artifact policy: code-only PRs where the runner
publishes. ⚠️ `npm run a11y` before shipping any view — CI does **not** run it,
and `npm test` proves nothing about layout (jsdom returns zeroes for every
rectangle).

---

*Greetings, you are SkyGrain (Session 234), see SkyBuild's handoff —
`docs/session_234_handoff.md` — let's keep rolling with our queue.*
