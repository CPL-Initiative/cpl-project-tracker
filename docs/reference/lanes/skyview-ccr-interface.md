---
title: "SkyView / the CCR curation interface — lane state"
created: 2026-08-28
updated: 2026-09-07
tags: [reference, roadmap-lane]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference/lanes
related:
  - "[[CLAUDE]]"
---

# SkyView / the CCR curation interface

> **Always-current lane state, not an archive.** Update it at every checkpoint
> that moves this lane; `CLAUDE.md` keeps the one-line pointer. The shipped
> history — every round, every measurement, every wrong reading — lives in
> [`ccr_atlas_lessons`](../../ccr_atlas_lessons.md) and its
> [archive](../../ccr_atlas_lessons_archive.md); the queue behind the priority
> is [`skyview_backlog`](../../skyview_backlog.md).
>
> ⚠️ **Over the 12,000 B advisory budget, and the excess is invariants** — each
> is here because a session got it wrong once. Compact the narrative sections
> before touching them.

**What this lane is:** An interactive view of the Common Course Reference —
common courses by discipline, their constituent local courses, and moving a
course to where it belongs. **"SkyView" is the map ALONE, filling the window**
(Sam, 2026-08-24, tightened 2026-09-05); the map with its panes is **the
comprehensive view**, and the discipline table, the subject table and the ESL
card are the **workspace** (*Disciplines and subjects*), a tab of their own.
The lane also carries the **re-mint series** — the CSR's codes are what
SkyView's islands are keyed by.

## Status

✅ **Built and stable.** Sam's five goals are met: the whole universe on one
canvas (16,482 identities, 33,423 stand-alone courses, 159 islands); keyword
jump to anything; hover is a quick look and click the docked inspector; every
stand-alone orbits its best-matching identity; drag and drop is real with a
keyboard path. **`#skyview` OPENS AS THE SKY** since S239 (#1514) — the inside
window onto the night sky, with **Sky · Globe · Map** as three places to stand
on ONE canvas. A course opens its outline of record (S235); the map has two
faces and a light (S238); a staged move is marked on the course itself (S239).

Round-by-round history — every measurement and every wrong reading — is in
[`ccr_atlas_lessons`](../../ccr_atlas_lessons.md) and its
[archive](../../ccr_atlas_lessons_archive.md). **Do not restate it here**: this
file is invariants and open work, and it is already over budget.

**S244 (2026-09-09) — Sam's five, all shipped.** Rotation `SPIN` 0.045→0.018
(one turn ~350 s); a dropped course PARKS instead of snapping back; courses
gather by level on the ring score already chose (same-level pairs **19.9%
closer**, 15.54→12.44 over the same 1,990 pairs); **CTE vs academic** as three
Show switches (25,857 · 16,470 · **7,569 with no verdict**); an **Isolate**
toggle. Payload gained `e`/`em`; the builder is deterministic (a no-change re-run
diffs one line).

## Invariants — do not violate these

⭐ **A MEMBER HAS NO POSITION OF ITS OWN** (S244). It is drawn on a SPOKE of its
parent's ring at an angle from its index, so "leave it where I dropped it" cannot
be a screen coordinate — pan, zoom and the turn all walk away from it. A parked
course lives in the WORLD frame islands use for `dx`/`dy` (`parkedMem`, projected
through `w2s` every frame). Parking records NOTHING: `applyMove` and
`unstageMove` both clear it, because "Put back" means both halves.

⚠️ **`islandPass` MEMOIZES ON `showSig()` — ANYTHING THAT CHANGES WHAT PASSES
MUST JOIN THAT SIGNATURE** (S244). Isolation changes which points pass without
touching a switch; with the switch-only signature every island served a stale
count and the map did not change at all. Reverting the signature reproduces it
exactly (`tests/ccr_skyview_isolate.test.js` (7), shown=3 of 3).

⚠️ **`e` (CTE) IS 1 / 0 / ABSENT, AND ABSENT IS ITS OWN SWITCH** (S244). 15% of
points carry no resolvable TOP code; folding them into "Academic" asserts
something about 7,569 courses the data does not say — the false-zero shape `c`
and `ar` already avoid. ⚠️ On a `top_mixed` identity `e` is a SUMMARY, not a
fact (39% of identities; those carry `em:1`). TOP is trusted here because
CLAUDE.md names the CTE flag as one of only two places it is authoritative.

⚠️ **LEVEL ORDERS WITHIN A RING, NEVER ACROSS THEM** (S244). Which ring a course
sits on is decided by MATCH SCORE — best candidates nearest the parent — and
that is real signal. Only 12% of points carry a level word, so `by_level` is a
STABLE sort on the level rank alone: the levelled gather, the other 88% keep
their score order, and a ring with no level words is returned untouched.

⭐ **AN ORBIT IS A PLACEMENT SUGGESTION, NEVER A CURATION DECISION.** Hollow,
tethered, reasons named. Moves accept ONE course at a time as a
`CN:<control number> merge_into <identity>` row. **Nothing is written from the page.**

⭐ **THE TITLE CARRIES THE WEIGHT** (`kb/_build_ccr_universe.py`): title 8 ×
Dice over lightly stemmed tokens; shared local subject code 1.5; TOP 0.5, units
0.15, credit type 0.05 count only after a subject or title signal fired (Rule
7's two-signals gate); a bare SUBJ4 match 0.3, never enough alone.
`tests/ccr_universe_orbits_test.py` pins both directions.

⚠️ **`ar` (articulation count) is ABSENT, never 0** — "none recorded" and "we
did not look" are the same thing on this feed. ⚠️ **The join must NOT resolve
through the alias chain**: those `course_id`s are already current-era, so
resolving again is a double-applied permutation.

⚠️ **THE LIVE SET IS THE CATALOG, NOT THE BROWSER PAYLOAD** (with Rule 7's alias
chain). `unified_courses_data.js` ships 16,480 of 76,008 rows, so "not in the
payload" read as "dead" over-reported it fourfold. `ALIAS_MAPS` is a list of
paths — call `load_maps()` first, or `resolve_id()` resolves nothing and does not
error; the tell is direct and chain agreeing EXACTLY.

⚠️ **Full screen paints ONE element.** A control outside `#u-full` does not
exist there; the page's single search form is **borrowed** into the map's row
and sent home by `setCrumbs`. And **state painted at render time goes stale on
every path that changes it without rendering** (`setSolo` repaints the window
controls; `paintFace` / `paintLit` / `paintProj` paint the face, the light and
the projection row).

⚠️ **The page must be SERVED, not opened** — `file://` blocks the payload fetch.
The layout is hand-built (`kb/_build_ccr_universe.py`, ~20 s) and committed; the
harness needs the gitignored shards (`--shards-only`). Descriptions live in the
public Supabase bucket `ccr-desc`, 159 shards / 50 MB, ordered by
`location.hostname` so the deployed page never tries the local base.

⚠️ **The daily run rebuilds the decision payload AND `skyview.html` with it** —
the atlas payload is INLINE in the served page, so regenerating the JSON alone
never reaches the deployed page. `ccr_universe.json` is deliberately untouched.
The CPL payload (`prototype/ccr_cpl.json`, Step 4d3) and the sphere placement
(`prototype/ccr_sky.json`, Step 4d4) are rebuilt every run; their tests fail
CI on a stale file.

⚠️ **`npm test` proves nothing about layout** — jsdom returns zeroes for every
rectangle. Run `npm run a11y skyview` (11 routes since S239) or drive a real
browser.

⭐ **THE SPHERE IS THE MAP THROUGH A PROJECTION, NOT A SECOND RENDERER** (S239).
One canvas, one `draw()`, one `pick()`: `prepSphere()` projects each island's
center and its Jacobian once a frame (`isl._s`); `w2s(x,y,isl)` is one
multiply-add from it and `pick()` reads the same cache — which is why the S237
drop fixture, the label placer and the keyboard path pass on the sphere
unchanged. `#skyview` opens what `OPENS` says (the Sky); `#globe` and `#map`
are places to stand; `/cpl` rides on each. ⚠️ **The globe is the sky
mirrored** — the window's right is the globe's left (`projectDir` flips x
outside; the drag and arrow signs flip with it). ⚠️ **A flat-map suite declares
`window.CPL_SKYVIEW_OPENS="map"` in `beforeParse`**, or it is testing the
sphere. ⚠️ Below `ID_ZOOM` the stars are batched per color|alpha bucket (117 →
42 ms a frame in software); a fake canvas needs `rect` and `clip`.
[`methodology-the-sphere-is-the-map-through-a-projection`](../../kb-notes/methodology-the-sphere-is-the-map-through-a-projection.md).

⭐ **THE TURN STOPS AT THE FIRST TOUCH, AND THERE IS NONE UNDER REDUCED
MOTION** (Sam, sheet item 4). `startTurn()` returns under
`prefers-reduced-motion`; a pointer, a key, a search or a carry stops it;
*Rotate* restarts it; the twinkle runs only while turning. A carried course
never sees a moving target.

⭐ **AN ISLAND BEHIND THE READER IS NOT A SMALL ISLAND, IT IS A HUGE ONE** (S241,
Sam: *"an enlarged grouping that is crossing over all the others — like a loose
asteroid field spiraling around"*). The sky is stereographic: the scale at `ang`
off the view direction is `sec²(ang/2)` — 1.3× at 60°, 4× at 120°, **131× at
170°** — and `projectDir` only refuses past 3.05 rad (174.8°). The screen cull is
a bounding box built from `isl.r * k`, so that inflated radius covers the window
and **the cull passes**: the island draws as a sprawl of its courses over
everything else. Measured at 240° across: largest scale **88.4×**, an island over
8× in **149 of 150 frames**. ⚠️ It was in S240's own numbers (Music `2.4 → 71.5 →
culled`) and read as a normal cull. The test is ANGULAR — an island whose nearest
edge (`acos(cz) - S.th`) lies beyond the screen's far corner is not in view.
88.4× → 1.5×, 149/150 → 0/150 frames, and **89 of 159 islands at 150° across were
being drawn having never been visible**: 11.4 → **17.4 fps**.

⚠️ **THE OPENING WIDTH IS WRITTEN IN TWO PLACES** — `sph`'s initializer and
`resetView()` — and **`resetView` is the one that runs**, so changing only the
initializer changes nothing (measured: still 150° across). Both now say 94° half
= **188° across** (Sam, 2026-09-08: *"Default might look better a bit
smaller...as long as the stars show up"*). The caveat is the constraint:
`NODE_ZOOM` decides per island whether its courses draw, and the scale falls as
the window widens — 150°: 70/70 islands keep their stars (lowest 0.438) · **188°:
99/99 (0.313)** · 226°: 125/125 (0.224, thin) · 240°: 128/**124** (0.195, four
lose them). An island's scale drifts as the sky turns, so the margin is the point.

⚠️ **THE MAP BUTTON HAS LEFT THE ROW; THE MAP HAS NOT LEFT THE CODE** (Sam,
2026-09-08: *"WE don't need the map view anymore, not with this view showing so
nicely"* — reversing his own sheet item 2 of the day before). `proj==="map"` is
still the flat renderer the sphere is a projection OF, `#map` still routes, and
seven suites declare `CPL_SKYVIEW_OPENS="map"`. Putting the word back is one line.

⚠️ **THE TURN'S `dt` CLAMP MUST SIT ABOVE THE REAL FRAME TIME** (`TURN_DT_MAX`,
S240). It guards ONE case — a backgrounded tab — and is not a frame-rate
limiter. Below the real frame time `dt` pins every frame: a FIXED angular step
at an irregular cadence, which is the lurch, and the turn ran 0.0393 rad/s
against an intended 0.0720. ⚠️ **Fixing it made the picture WORSE and S240 did
not measure that** — time-true motion at 8 fps steps further than broken
half-speed motion (per-frame change 18.59 → 21.87). **Frame rate is what buys
smoothness**; see the frame budget below. The pace stays as ruled.

⭐ **ON THE SPHERE EVERY ZOOM BAND NEEDS HYSTERESIS — A BARE THRESHOLD BLINKS**
(S240, Sam: *"note how the skyview flickers around"*). On the flat map `k` is
`view.k`, crossed deliberately and together; on the sphere it is PER ISLAND
(`sec²(ang/2)` × the center's) and drifts as the sky turns. At 240° across **18
of 159 islands sit within ±3% of `NODE_ZOOM`** (Dance 0.1998 vs 0.2000); 11
flipped inside 120 frames, each switching a discipline's whole dot field while
its disc and name stayed put. `nodesShown()` remembers its side
(`NODE_ZOOM_KEEP`); ⚠️ **`pick()` reads that memory via `nodesOnScreen()`, never
re-tests** — else eye and hand disagree. 16 flips → 4, one crossing each.

⭐ **A TINT THAT FILLS THE WINDOW IS NOT A TINT, IT IS THE SKY** (S240, Sam:
*"after filters applied the sky turns purple and should stay… night"*). The
selected island's fill reads against the ground AT ITS EDGE; past the zoom where
that edge leaves the window, `--sky-island-sel` #2E2A44 simply *was* the sky.
Falls back to `pal.island` when the farthest window corner is inside the disc;
the stroke, the name and the inspector still say what is selected.

⭐ **THE CARRY ENDS WHERE THE MOVE IS STAGED, BY WHATEVER ROUTE** (S240, Sam:
*"Staged move seems to clear but I can't drag it to the new home"*). The canvas
paths cleared `drag`; the PANEL paths (destination click, *Move here*, *Accept*)
went straight to `applyMove` and left the reader invisibly carrying — and the
pick-up handlers refuse a second carry, so every *Drag…* became a silent no-op
for the session. Released in `applyMove` **after** the gates, so a refused move
keeps the carry. `tests/ccr_skyview_carry_release.test.js`.

⭐ **THE OUTLINE IS A SHEET OVER THE MAP, NOT A VIEW INSTEAD OF IT** (S240, Sam:
*"make the course outline a popup… we never have to exit skyview"*).
`__ccrOutline` opens `#u-outline-sheet` when the canvas is mounted and **leaves
the hash alone** — the reader has not left. ⚠️ Mounts inside `#u-full`: full
screen paints only that element. The full page stays for arrival on
`#outline/<id>`. Every other exit parks the camera
(`parkCamera`/`restoreCamera`), so the crumbs' **Back** returns to the framing,
not the opening view; a parked SELECTION still re-frames over it, which is
`restoreTokens`' older and deliberate behavior.

⚠️ **THE CLOSED SIDEBAR IS ZERO-WIDTH, NOT `display:none`** (S240) — it collapses
below `INSP_COLLAPSE` and leaves its grip on the stage's edge, or there is
nothing to drag back out. ⚠️ **That grip must sit ENTIRELY INSIDE**: open, it
straddles the panel border harmlessly 400px in; closed, the same straddle hung
5px past the stage and `npm run a11y skyview` failed **all 11 routes at every
width** — the panel starts closed.

⭐ **NIGHT ON THE SPHERE, LIGHT ON THE MAP, ONE MEMORY; DAY KEEPS THE RIM**
(items 3, 8). `darkChoice` (`skyview:theme`) is the one stored choice across
all three; with none stored, `dark = sphereOn()`. By day every dot is rimmed
seal blue (`--sky-dot-rim`, the legend swatches too) because silver on the day
ground is 1.24:1. The M-ID is **silver** (`--sky-sys0-fill` #D6D6D0) on every
dark canvas and violet on the light one.

⭐ **A DROP LANDS ON A CIRCLE; ONLY A READ LANDS ON A STAR** (S237). An open
identity's member ring SPREADS over its neighbors and `pick()` gives those stars
absolute priority — correct for reading, and it eclipses the destination a
curator aims at. `pick(px,py,forDrop)` resolves circles only while carrying.
⚠️ Neither rule may be widened onto the other.

⭐ **A STAGED MOVE IS MARKED ON THE MODEL, AND EVERY VIEW ASKS IT** (S239, v4
item 7). `stagedHere` / `stagedAwayFrom` / `stagedWords` are the only way a
view learns about a staged move; the words are written once. The destination's
row and star say *staged here — not saved*; the origin still DRAWS the course
as a dashed ghost star and lists it under *Staged to move away* with a *Put
back*; labels, hovers and the outline's band count it. ⚠️ A view that reads
`movedTo` to decide what to SAY is the drift this prevents.
[`methodology-a-staged-state-lives-on-the-model-and-every-view-asks-it`](../../kb-notes/methodology-a-staged-state-lives-on-the-model-and-every-view-asks-it.md).

⚠️ **THE DOCKED PANEL NARROWS THE CANVAS** (S239, Chromium). Opening an
identity docks the details panel, so a screen position computed from the
canvas rect BEFORE the open is stale after it. Measure after the open.

⭐ **THE SPHERE PLACEMENT IS A DAILY ARTIFACT** (S239): `kb/_build_ccr_sky.py`
→ `prototype/ccr_sky.json` — each island's center three ways (committed ·
spread · by kind, as longitude/latitude) with the CTE share and its base;
points are placed in the browser from their island's center and their
flat-map offset (`radians_per_unit`). Fingerprinted: it relaxes only on a
change (~90 s); `--check` runs in half a second; a side is HELD across 0.6/0.4
by a 0.05 margin; `prototype/globe/globe_layout.py` IMPORTS the relaxation.
⚠️ The kind is TOP's one sanctioned use as a display arrangement, never a
classification (24% of points carry it, as `base` per island).

⚠️ **A REFUSAL THAT PRINTS OUT OF SIGHT IS A DEAD CONTROL.** `#u-hint` sits at
the foot of the window; `#u-writes` is inside `#u-below`, which `body.u-solo` —
the default — never paints. Anything that can say *no* says it where the hand
is: the carry rings its destination and names it.

⭐ **ONE SKILL, ONE ROW — FOLD THE KEY, KEEP THE COLLEGES' WORDS** (S237).
Fold at the COUNTING step, never by collapsing finished rows (the chip counts
COLLEGES); display the spelling the most colleges published; `sses` belongs in
the `-es` family. **The fold stands as shipped** (Sam, 2026-09-07); a bad pair
goes on a do-not-fold list.

⚠️ **A REVIEWER'S REMOVAL IS RECORDED, NEVER DERIVED.** The imputation re-runs
whenever a description lands, so storing *what is left* would silently delete
every skill that arrived since. `skillDrop` names the struck keys; each is
restorable.

⚠️ **`ensureCorpus()`, NOT `__ccrUniverse` ALONE.** An outline reached by its own
`#outline/<id>` link had ZERO college courses — a false statement about the
data, not a rendering gap.

⚠️ **A CLOSED `<details>` STILL MEASURES.** Chromium hides its content with
content-visibility, not `display:none`, so the rect is real while `focus()` is a
no-op. A `height === 0` guard does not catch it; the a11y script opens them.

⭐ **THE ARTICULATIONS TOGGLE IS A LIGHT, NOT A FILTER, AND IT SHOWS PRESENCE
ONLY** (Sam's ruling 2, 2026-09-07). It lights what has a number and leaves the
rest drawn as it is — no gray, no hollow, no "none" (1,490 of 49,896 points
carry `ar`). The Show menu keeps the *filter*. Below the course zoom a
discipline holding a lit course carries the ring. ⚠️ **"Where they differ
college to college" is NOT a map layer** — four cases, two of them data
defects, in [`kb/ccr_articulation_disagreements.json`](../../../kb/ccr_articulation_disagreements.json).

⭐ **THE CPL FACE LEADS WITH THE CREDENTIAL, AND A POINT NOTHING REACHES IS
UNLABELED** (Sam's ruling 3). Curated name → issuing agency AND training agency
where they differ → what it earns → the colleges holding it; search switches to
the vocabulary; the agencies go on the outline too. Agencies come from the
curated CER artifact, never the crosswalk's inlined issuer (stale on 1,743 of
4,592 records). `#skyview/cpl` is the face as a link.

⭐ **THE COVERAGE LINE TAKES BOTH NUMBERS FROM ONE UNIVERSE, AND THE SURFACE
COMPUTES IT** (S238): **1,924 of 5,497 articulated exhibits**, from
`ccr_cpl.json`'s counts — the ruled draft paired an identity count with the
ACE-keyed funnel, which shares 570 ids with the map's 1,924; the fixture's 4 of
777 makes a literal fail
([note](../../kb-notes/methodology-a-coverage-line-takes-both-numbers-from-one-universe.md)).
⚠️ The 55 crosswalk exhibits absent from today's feed are flagged `s:1`, never
dropped (ruling 5, 2026-09-05).

**Durable facts:** grinding the whole merge queue perfectly lands at 35,937,
14.4× short of 2,500, so **packaging** is the only mechanism with the right
shape (ESL proved it at 85:1); ~5,700 decisions, 97.1% ≤ 12 identities; 3,001
carry NO discipline; decision packs exist for 5 of 159 disciplines; `CN:` names
more than one course on 1,761 keys and those moves are refused with the reason.

⭐ **TICKING COLLECTS; ENTER APPLIES** (Sam, 2026-09-06). A tick writes to a
pending set and repaints ONE row; Enter commits the set and closes; Escape
abandons; a choosing session spans every term typed. ⚠️ Enter closing the list
is safe **only because ticking no longer commits**.

⭐ **INTENT IS RECORDED, NEVER DERIVED BY SUBTRACTION.** `pendItem` holds the
ticks, `pendOff` the explicit unticks, and one `pendingEdit()` feeds the footer
**and** the commit ([note](../../kb-notes/methodology-a-snapshot-cannot-be-the-authority-on-intent.md)).

⭐ **v4 IS THE GOVERNING REVIEW, AND ALL EIGHT OF ITS ITEMS HAVE SHIPPED** —
[`skyview_video4_findings.md`](../../skyview_video4_findings.md); the staged
mark was the last (S239). ⚠️ `skyview_video2_findings.md` is a **different,
earlier** recording; the two lists must not be merged. **Do not build**
hover-on-the-title — he decided against it on camera.

## Measured in a browser — the durable warnings

⚠️ **jsdom cannot see any of this** — every finding came from the served page
([`ccr_atlas_lessons`](../../ccr_atlas_lessons.md);
[`methodology-a-correct-measurement-can-name-the-wrong-place`](../../kb-notes/methodology-a-correct-measurement-can-name-the-wrong-place.md),
[`methodology-a-rule-that-is-right-for-reading-can-be-wrong-for-writing`](../../kb-notes/methodology-a-rule-that-is-right-for-reading-can-be-wrong-for-writing.md)).
⚠️ It is `.sugwrap` that wraps, not `#u-bar`; chip tightening is bounded by
target size (24×24, SC 2.5.8). ⚠️ The picks died on the way OUT (`setCrumbs()`
calls `clearTokens()`). ⚠️ Sam retracted a finding on camera — read a recording
to the end first. ⚠️ The Sky's turn ran at 5 fps before the star pass was
batched (S239); the served page, not the suite, is where a frame rate exists.

⚠️ **THE FRAME BUDGET IS PER-POINT JS, NOT THE CANVAS — S239's carry-forward
named the wrong lever.** Drawing is nearly free: one batched path of 27,000 rects
fills in **5.9 ms**, `clearRect` in 0.02, `readPal()` 0.03 ms a frame. So an
offscreen star layer or a WebGL point pass — the two levers S239 proposed — buy
almost nothing. **What has worked, every time, is doing less per point.**

⭐ **A MEMO KEYED ON A VALUE THAT DRIFTS IS NOT A MEMO** (S242). `textW` cached on
`ctx.font` + the string, and an island label is sized off its DRAWN radius:
`18.0263px`, `18.2506px`, `18.1185px`, a new float every frame as the sky turns.
It never hit once — and each miss handed Chromium a font size it had to build,
which is the expensive half: **`measureText` 11.2% of the profile against
`textW`'s own 0.5%**, on fifteen calls a frame. `textW` now measures at `TW_REF`
and scales (one font for the life of the page; ~0.14px of hinting error into a
collision box already padded 3px a side, and `placeLabels` draws centered so the
width positions nothing).

⚠️ **AND THAT FIX MOVED THE BILL RATHER THAN REMOVING IT.** Calls fell 15.4 → 0.17
a frame and **`strokeText` went 0.6% → 9.6%**: a font is built at its first USE,
so with the measure no longer asking, the stroke inherited the same work. Only
stopping the drift helped — `labelSize()` rounds the drawn size to whole pixels
(`txPx()` has done this since it was written: *"a fractional px font measures fine
and renders soft"*), ⚠️ **with a 0.6px dead band**, because a bare `Math.round` is
a threshold on a drifting value and 18↔19 every frame is a worse shimmer than the
one being fixed. [`note`](../../kb-notes/methodology-fixing-a-cost-can-move-it-rather-than-remove-it.md)

⭐ **AN ISLAND ON SCREEN IS NOT AN ISLAND WHOSE POINTS ARE ON SCREEN** (S242).
S241's angular cull settled which ISLANDS the window shows; within one that
passes, a discipline wider than the window still spills its courses past every
edge — **5,755 of 27,931 batched dots a frame, 20.6%, lay wholly outside the
canvas**. ⚠️ **The test belongs INSIDE the fast branch and nowhere earlier**: only
there is the node a plain dot of radius `dr` that returns at once, so `dr` is its
whole extent. A point on the SLOW path throws light up to 22% of the canvas and
can legitimately light the window from off screen.

**Measured back-to-back on the served page, same machine, same minute: a median
frame 81 ms → 46 ms, about 12.3 → 21.7 fps.** ⚠️ Measured headless with a GPU
absent; the ORDER should hold, the absolute numbers will not, and nobody has a
number from Sam's machine. `tests/ccr_skyview_frame_budget.test.js` guards all
three. ⚠️ **Its first draft was a decoration** — both fixture islands sat at the
label-size clamp and all three points near the middle, so it passed with every fix
reverted.

The round-by-round of every served-page drive (S237–S239) is in the lessons doc, dated.

**Praised, do not break:** Fit all; the panel moving to the selection.

## Sam's rulings

Where each of the 2026-09-06 and 2026-09-07 rulings landed is recorded once, in
[`ccr_atlas_lessons`](../../ccr_atlas_lessons.md). **The sheet of 2026-09-07
(eight calls before the sky goes in): all eight `yes`, no notes** — and all
eight built the same evening (S239, #1514). The ones still open are NEEDS SAM
below.

## The outline of record — BUILT (S235, CPL layer S238)

`#outline/<id>`, six layers, `tests/ccr_skyview_outline.test.js`. ⭐ The
description is CHOSEN, never written (the medoid member catalog, attributed);
Sam's MAP-Generated sentence prints verbatim. ⭐ Two level axes, neither
derived. ⚠️ Confidence is agreement BETWEEN colleges. ⭐ A reviewer may add a
skill and take one out — staged, nothing written. The CPL layer lists every
credential reaching the course with both agencies; an empty layer states the
ceiling in words.

## NEEDS SAM

**Nothing — all eight answered 2026-09-09** (sheet
`docs/visuals/2026-09-09-pending-decisions.html`; his words in memory row
`sam-eleven-rulings-2026-09-09-decision-sheet`). They are work now, not questions:

① **Skill statements: "use all 3 for now and consolidate them in a set of
skills."** ⭐ With the acceptance bar: *"err on the side of including anything
possibly relevant, as the faculty will revise and keep or toss."* There is no
source ranking to derive — the union is the answer and the faculty are the
filter. **The outline's skill layer is unblocked.**
② **Grab bags: vocational, work experience, interdisciplinary studies** (+ the
no-discipline pile). Interdisciplinary Studies was the lane's candidate at 513
identities; work experience was not. None may vote in a modal decision; today
they all do.
③ **The banner** — nothing broken, see the governance lane.
④ **Legacy anchors: RETIRE** (`M-ID HOSP 100`, `104`, `102`). Id-keyed, so it
lands as a re-mint under
[`coursecontrolnumber_remint.md`](../../coursecontrolnumber_remint.md).
⑤ **Keep depth 60** — `SUG_LIMIT = 60` is the first page, revealed a page at a
time to `SUG_MAX = 300`. Verified, no change. **An emptied discipline stays
DRAWN.**
⑥ **Glyph rail: RETIRE** — it collided with his own glyph rule.
⑦ **CPL face: keep** — *"refine it in later sessions."*
⑧ **The Sky reads right** — *"Looks good now:)"*. ⭐ Two sessions of measurement
could not settle this, because every number was headless and on a machine that
is not his. **His eye was the only instrument that could answer it.**

⚠️ **"Stays drawn" is a BUILDER change, not the one-line renderer tweak the
sheet claimed.** `isl.p` is never mutated at runtime, and `build_islands()`
walks `all_discs = set(by_disc) | set(sa_by_disc)` — an emptied discipline is
**absent from the payload** and never reaches `islandPass` at all. Drawing it
needs a roster to emit from, a radius for a pointless island, and a ghost
lifetime. ⚠️ Do **not** "fix" it in `islandPass`: hiding an island whose points
are all *filtered off* is deliberate and `healShow` depends on it — two
different empties, and only one is Sam's.

⚠️ The Pages deploy prunes `docs/`, so a sheet is handed over as an artifact
link, never a github.io URL.

## NEXT

⚠️ **THIS FILE IS 2.5× ITS BUDGET and the lint says so every run.** It is
invariants, not stacked history, so the compaction is a real read-and-rule pass:
several invariants below predate rulings that superseded them. Worth its own
sitting — do not let a checkpoint keep appending to it in the meantime.

⓪ **DR-24's write surface** — the curate phrase and the propose/second gate. The
register row exists with Sam as owner; the phrase's SCOPE is what is open.
① **The skills layer's fetch problem** (NEEDS SAM ①).
② **The blanks — RULED AND NARROWED: 93 → 86** (Sam, 2026-09-08, sheet items 1-6
and 9). Five codes went into the subject map (BSOT · HUMA · GRAF · BCST · BARB),
filling 7 rows; HOSP is genuinely split four ways and is recorded in the map's own
`_deliberately_unmapped`. ⚠️ **The remaining 86 are NOT fillable and the payload
says so**: across their 45 codes, **37 have no other identity carrying that
prefix** and **6 read "unanimous" off a SINGLE row** — HUMN's one voter is *Music
for Video Games and Film* while its three blanks are popular-culture titles.
Ruled a **curator pass, never an inference**: `kb/discipline_blanks_worklist.json`
(`kb/_build_discipline_blanks_worklist.py`, rebuilt by the daily run's Step 4d5,
guarded by `tests/discipline_blanks_worklist_test.py`) names every code with what
corroboration exists.
③ **The disagreements: 9 → 2 in one day, and neither survivor is a map problem**
(S243, Sam's two sheets of 2026-09-08). Morning: ATHL→Kinesiology · THTR→Drama/
Theater Arts · ESCI→Environmental Technologies · ELEC→Electricity ·
MUSC→Commercial Music. Evening: **ETHN→Chicano Studies** and **ENVS→Biological
Sciences**, plus **ETHA→Native American/American Indian Studies ADDED** — 33
courses and a canonical code with no map entry at all, and ⚠️ **a code with no
entry never surfaces as a disagreement**, which is why nobody had looked. Left:
**PHTO**, where Sam ruled the map right and its twelve courses mis-filed, and
**ESLN**, which is ③b's rename. ⭐ **All nine had printed NOTHING until S243** —
`standingHtml()` appended the note to ONE of four exits; fixed, note on every
exit (`tests/ccr_subject_standing_note.test.js`).
⭐ **WHICH MECHANISM A CASE NEEDS IS ONE QUESTION — NOW IN DR-25** (Sam, hard-ones
item 5): **does the MQ list already carry the distinction?** No → **umbrella**,
mint codes (Foreign Languages' 21 synthetic per-language SUBJ4s; Kinesiology's
ATHL; the two Agriculture disciplines). Yes and the courses split → **fan-in**,
one Common SUBJ and both names kept (`fan_in_with`; FTVE across Film and Media
Studies 360 and Media Production 146). Yes and they do not → a plain
**correction**. ⚠️ **Asking it re-sorts cases** — ETHN and PHTO both sat on a
"hard" list until it was asked. A real MQ discipline carrying NO courses folds
into its parent through `kb/discipline_aliases.json` instead: African American
Studies and Asian American Studies into Ethnic Studies (item 2), which records
where such a course is FILED, never that the names are synonyms.
⚠️ **ATHL IS AN UMBRELLA CODE, NOT A KINE VARIANT** (Sam's note, 2026-09-08:
*"ATHL … is in Kinesiology but is differentiated from KINE which doesn't have the
restrictions athletic PE or KIN course"*). The CSR lists ATHL as a Kinesiology
variant with **1,468 M-IDs**, and the Phase 1e fold re-keys variants to the
canonical — it was caught doing exactly that in Session 47. The protection existed
only as a literal in `_subj4_dryrun.py`'s `load_umbrella_allowances()`; it is now
also **declared in the CSR** (`is_umbrella`, `umbrella_codes ["ATHL","KINE"]`),
which survives a reseed and a Supabase sync, so SkyView reads ATHL as *an umbrella
code under Kinesiology* rather than *not Kinesiology's code*.
③b ⚠️ **EIGHT MQ DISCIPLINE NAMES CARRY A TITLE 5 SECTION NUMBER** — an extraction
artifact from the 19th-edition index, not a vocabulary question. The tell is
`Speech Language Pathology: Disabled Student Programs and 53414 Services`, where
the number splits the phrase. `53412` (noncredit basic skills / ESL) and `53414`
(DSPS) affect 45 live rows — ESLN 5, BSKL 40 — but **1,183 occurrences across 33
files**, `coci_minted_courses.json` and four alias maps among them. Sam ruled ESLN
a data defect to repair at source (item 8); the map side is already correct
(`ESLN → English as a Second Language`). **The rename itself is an id-keyed
corpus change and needs its own dry-run, alias map and receipt — a separate PR.**
④ **The frame budget, if Sam still sees it step.** S242 took the median frame
81 → 46 ms. The remaining named JS is the per-node loop (14%) and the island
loop (10%) — the irreducible walk. **Fewer points per frame is the lever that
has worked three times running.**
⑤ The rest of the queue: [`skyview_backlog`](../../skyview_backlog.md).
⚠️ Whatever changes, the drop test, the keyboard path and `npm run a11y skyview`
run again in the same PR — and `scripts/check_generated.sh` LAST before a push.
