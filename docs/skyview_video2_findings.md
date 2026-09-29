---
title: "Video Project 2 — what Sam's screen recording actually shows"
created: 2026-09-06
updated: 2026-09-06
tags: [skyview, findings, video]
obsidian-folder: cpl-project-tracker/findings
---

# Video Project 2 — SkyView, 6m50s, 2026-09-06

Sam recorded himself driving SkyView and narrating. The recording never left his
machine: `kb/_video_context.py` cut 23 scene-aware frames and a local
faster-whisper transcript (138 segments), both committed under
`.video-context/video-project-2/`.

⚠️ **Two findings below are MEASURED in a real browser**, not read off the code.
The page was served locally and driven with Playwright/Chromium — the numbers
come from `getBoundingClientRect()`, because jsdom returns zeroes for every
rectangle and neither defect is visible without layout.

⚠️ **One complaint in the recording was RETRACTED by Sam himself.** It is at the
bottom under "Do not act on this." Acting on it would undo S233's fix.

---

## 1. The dropdown drops a full row when the chip row wraps — MEASURED

**What he said**, three separate times:

> *"Whoops, I just lost introduction to welding. Where did it go?"* (00:52)
> *"Now I have to go down here again. You see how it jumped and I lost my place."* (01:00)
> *"Jumping again, driving me nuts."* (01:12)

**What was measured.** Search `weld`, scroll the list to 300px, then pick rows:

| after | `#u-bar` height | `#sug` top | row 10 top | `scrollTop` | chips |
|---|---|---|---|---|---|
| 0 picks | 30 | 40 | 439 | 0 | 0 |
| scrolled | 30 | 40 | 139 | 300 | 0 |
| pick 1 | 30 | 40 | 139 | 300 | 2 |
| pick 2 | 30 | 40 | 139 | 300 | 4 |
| pick 3 | 30 | 40 | 139 | 300 | 5 |
| **pick 4** | **76** | **76** | **175** | 300 | 6 |

**The first three picks are rock solid — ruling 3's fix holds.** `scrollTop`
never moves. On the fourth pick the toolbar wraps to a second line, `#u-bar`
grows 30 → 76, and **every row moves down 36 pixels — almost exactly one row
height.** The row under the pointer becomes a different row.

**Why the existing fix does not cover it.** `skyview.html:861-875` preserves
`sugEl.scrollTop` across a pick, and that is genuinely working. But the complaint
has two axes and the fix addressed one: the list's scroll offset stays put while
the list's *position on screen* moves. `.u-tokens{display:contents}`
(`skyview.html:544`) makes each chip a flex child of `#u-bar`, so the Nth chip
reflows the bar and shifts everything below it.

**Recommended fix**, in preference order:

1. **Reserve the space.** Give `#u-bar` a `min-height` sized for two chip rows so
   the wrap costs nothing when it happens. Cheapest, no layout rethink.
2. Move the chips to their own fixed-height strip that scrolls horizontally
   rather than wrapping.
3. Anchor `#sug` to the viewport (fixed under the input) so bar reflow cannot
   move it.

**Guard it by value, not by count.** A test asserting "the bar has one row"
passes on a machine where the chips happen to fit. Assert that `#sug`'s
`getBoundingClientRect().top` is unchanged across N picks — with enough picks to
force the wrap, or the fixture is too small to fail
(`methodology-a-fixture-too-small-to-fail-makes-a-guard-a-decoration`). At 1440px
it took four.

---

## 2. Double-click strands you, because the hash never changes — MEASURED

**What he said:**

> *"If I double click it, it should open the exhibit, right? And it doesn't. It
> opens this prototype V1. And there's no way for me to get back now to sky view.
> I have lost sky view. I am stuck."* (02:58)
> *"When I go to sky view, it's going to reset sky view… the welding choices I
> made… I have to start all over."* (03:17)
> *"Ah, back stranded."* (06:27, second attempt)

**What was measured:**

| step | `location.hash` | canvas present | `h1` |
|---|---|---|---|
| start | `#skyview` | yes | SkyView |
| `__ccrDiscipline('Welding')` | **`#skyview`** | **no** | **Welding** |
| `__ccrRoute()` | `#skyview` | yes (rebuilt) | SkyView |

**`discipline()` paints over SkyView without touching the route.** It sets
`state.v` and the crumbs (`skyview.html:1293`) and never calls `syncHash()`. The
URL keeps claiming `#skyview` while the Welding workspace is on screen. Four
consequences, all of which he hit:

- **Back cannot return him** — no history entry was created.
- **`hashchange` cannot fire**, so the router never learns the view changed.
- **The Views menu disagrees with the screen** — his "no man's land".
- **A refresh silently returns to SkyView**, discarding the work.

The return path then rebuilds: `__ccrRoute()` → `__ccrUniverse({solo:true})`
re-creates the canvas from scratch, so every pick is gone. That is the reset he
predicted before he tested it.

⚠️ **It is NOT a different page.** `skyview.html` hosts every view; the masthead
merely reads "prototype v1" (finding 3). Nothing navigated to `ccr_atlas_v1.html`.

**Recommended fix**, three parts — the first unblocks him:

1. **`discipline()` sets a route** (`#disciplines/<name>` or similar) via
   `syncHash()`, so Back works, `hashchange` fires, and the menu agrees with the
   screen.
2. **Make the round trip non-destructive** — picks, zoom and selection survive
   leaving and returning.
3. **Decide what double-click should DO** — see decisions below. Today it is an
   accelerator for the panel's "Open the work surface" button
   (`skyview.html:4488` says so). He expected the exhibit or course outline for
   the identity he double-clicked, which is a different thing entirely.

---

## 3. The masthead still says "prototype v1"

`skyview.html:714` renders `SkyView — prototype v1`. That label is why a view
swap read to him as landing in an old prototype, and it contradicts the ruling
that SkyView is the name (files keep `ccr_atlas_*` paths; user-facing text
changed). One line, and it removes a whole category of confusion.

---

## 4-6. Reported, not yet reproduced

- **Click-to-expand stops working.** *"For some reason when I click on this one
  now it doesn't open up like it did before. I don't know why."* (04:47) He then
  worked out some were standalone orbits and said *"that's fine, we'll deal with
  that"* — so part is understood behavior and part may not be. Needs a repro
  before a fix.
- **Drag-and-drop to rehome did not work.** *"I was going to try and drag and
  drop another intro to welding course over to this, which wasn't working for
  me"* (06:32). He ran out of time and never demonstrated it, so there is no
  evidence of the failure mode. Scope: `docs/skyview_drag_rehome_scope.md`.
- **Sort mode is not obvious.** *"Now this is sorting by, it's sorting by best
  match, I guess."* (04:06) The footer names the order; he was still unsure.

---

## Decisions only Sam can make

1. **Should Enter close the search panel?** He raised it and flagged it as a
   reversal himself: *"after I click enter, I really think it should close this,
   even though we made a prior decision on that"* (02:08). The prior decision
   keeps the list open so a second pick is one click (2026-09-05). These
   conflict; he picks.
2. **What should double-click do?** He expects the exhibit or course outline;
   today it opens the discipline work surface. Options: rewire to the identity's
   catalog description, or drop the accelerator and leave the panel button as the
   only route.

---

## ⚠️ Do not act on this — he retracted it

Between 05:24 and 05:55 he reported at length that hovering a college course
returned the identity card rather than the course, and that double-click should
open the outline:

> *"It should say weld 100 Fullerton, you know, two, three units… and it doesn't.
> So it just shows this general welding."*

**At 06:08 he withdrew all of it:**

> *"You know what? My bad. Forget everything I said there. It's not a problem.
> There it is."*

This is S233's hover fix working correctly — he found it a moment later. Acting
on the first half of that passage would undo a shipped fix. **The retraction is
the finding.**

## Praised — do not break

- **Fit all** — *"I like that, I like that choice very nice."* (02:20)
- **Click moving the panel to the selection** — *"it even shoots over here.
  That's very nice. And that looks really good."* (06:18)
