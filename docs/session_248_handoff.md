---
title: "Session 248 handoff — SkyView on a phone, a question box that moves the map, and a lane that finally got compacted"
created: 2026-09-09
updated: 2026-09-09
tags: [handoff]
obsidian-folder: cpl-project-tracker/handoffs
superseded: true
superseded_by: session_251_handoff.md
---

# You are Session 248

Your moniker is **SkyTouch**.

⚠️ **Two sessions ran in parallel on 2026-09-09.** SkyPlain (S245) swept COBI for
dark mode / AA / mobile and wrote handoff 246; SkyText (S247's file) did the
funding text. This run — SkyLedger — took Sam's three SkyView asks. If a handoff
number looks odd, that is why; 248 is the current one.

## What this run did

One PR, [#1530](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1530),
merged as `6148982` and deployed by Pages (run 1215). Sam's message was three
asks in one breath: the SkyView header *"now takes up half the screen"*, pinch
does not zoom on mobile, and the search box should take questions *"like Sierra
handles"*. He then said **"Go on both"** to the first two and **"Based on your
recommendation"** to the third.

**The phone.** Header 254px → 114px at 390×844; map 62% → **86%**. Desktop
untouched. The controls fold behind the word *Controls* below 1100px and open as
a sheet at the bottom; the legend starts closed.

**Pinch.** Works both directions, does not select on release, survives a
canceled touch.

**Ask SkyView.** A question in the search box becomes a **selection**, not a
paragraph. The model translates into the map's token grammar and the map answers
by moving.

## ⭐ THE RULINGS AND THE PUSHBACK — carry these

- **The rail was refused, and he accepted it.** He asked whether the row should
  become a vertical rail down the left edge. It cannot: 48px of a 390px canvas
  will not hold *Rotate · Pan · Move · Articulations · Isolate*, so **a rail
  settles the plain-words rule by geometry before anyone argues it.** It also
  reverses his own 2026-09-03 "nothing floats over the map". Recorded in the code.
- **Translate, do not answer** — his ruling on the question box, and the reason is
  correctness: cpl-chat retrieves from the KB, which does **not** contain
  SkyView's payload, so prose about it would be composed from a corpus that
  cannot hold the answer.
- **He has not ruled** on the phone opening width (see NEEDS SAM below).

## ⚠️ WHAT I GOT WRONG — the useful part

- **The header was only half the cause.** `fitCanvas()` tested
  `window.innerWidth<700` BEFORE the solo test, pinning the canvas at 0.62 × the
  viewport — 523px at 844, exactly the canvas that was there. **Shrinking the row
  alone would have freed 140 pixels with nowhere to go.** And with both fixed it
  still opened at 451px, because `fitCanvas` ran before the row settled and a
  phone's window never resizes. Three mechanisms, one symptom
  ([KB note](kb-notes/methodology-one-symptom-two-causes-and-the-obvious-fix-changes-nothing.md)).
- **My plan's breakpoint was wrong.** 900px would have kept an iPad landscape in
  the wrapped zone — measured at 1024: a three-line 186px header. Moved to 1100,
  where the stylesheet already gives up `nowrap`.
- **A check of mine could not fail**, one day after handoff 247's lesson about
  exactly that. The falsification pass is now written down per check
  ([KB note](kb-notes/methodology-a-check-that-cannot-fire-on-what-it-names.md)).
- **CI went red on the first commit** with `dependency map is STALE`. The map
  records LINE NUMBERS, so +180 lines shifted every entry below them. ⚠️ **`npm
  test` does not run that check** — `python3 kb/_build_dependency_map.py --check`
  does. Run it before you push anything that touches a mapped file.

## Read in this order

1. This file, then `docs/session_246_handoff.md` if dark mode is your lane.
2. ⭐ **[`docs/reference/skyview_invariants.md`](reference/skyview_invariants.md)** —
   NEW this checkpoint. ~40 rules split out of the lane file, which was 2.75× its
   budget. **Read it before touching `prototype/ccr_universe.js`.**
3. [`reference/lanes/skyview-ccr-interface.md`](reference/lanes/skyview-ccr-interface.md)
   — now 8,647 B and state-only.
4. [`ccr_atlas_lessons.md`](ccr_atlas_lessons.md) — this run's section at the end.

## Open — what to pick up

**NEEDS SAM (three, all his call, none blocking each other):**
1. **Dispatch `cpl-chat-deploy.yml`.** Until it runs, `skyview-ask` is not a known
   surface on the deployed function and a question shows an error naming exactly
   that. The row and pinch are live; the question box is the half waiting. Held
   back deliberately — deploying the shared function touches Sierra, the Fact
   Sheet, My College, the GR register and the Memory tab.
2. **The live `sierra_guidance` CHECK constraint** does not yet allow
   `skyview-ask`. The schema of record does. Not blocking.
3. **The phone opening width.** At 188° across on a 390px canvas the discipline
   labels clip off both edges. Narrowing is a real improvement, but `NODE_ZOOM`
   decides per island whether courses draw at all and the margin is the point.

**Then the lane's NEXT queue** — DR-24's write surface, the skills layer (now
unblocked by his ruling), the 86 blanks as a curator pass, PHTO and ESLN.

## Patterns that worked

- **Measure before building, and predict the win in numbers.** Every claim in the
  PR is a measurement; the second and third causes surfaced because the predicted
  win did not match the measured one.
- **Falsify every check by reverting its own line.** It found a check guarding
  nothing and a dead condition, and it produced an accurate per-check mapping
  worth more than the checks themselves.
- **Ask whether a red check is yours.** Two minutes sweeping a stashed checkout
  turned "a red on my branch" into "a standing red on every view that disables a
  control", which is a different fix in a different file.

## Safety patterns honored

Rule 4 untouched. No raw hex. No Supabase writes beyond `cpl_memory`. No live
DDL — the guidance constraint is left for Sam. `prototype/skyview.html` rebuilt
from source (`prototype/build_ccr_atlas.py`), never hand-patched. Dependency map
regenerated and `--check` clean.
