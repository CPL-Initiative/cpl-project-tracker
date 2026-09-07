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
keyboard path. A course opens its **outline of record** (S235); the map has
**two faces and a light** (S238, #1508); a **staged move is marked on the
course itself** (S239, #1513). **Since S239's second checkpoint SkyView OPENS
AS THE SKY** (#1514) — the inside window onto the night sky, built on Sam's
eight `yes` replies to the sheet (2026-09-07): **Sky · Globe · Map** are three
words in the row and three places to stand on ONE canvas; Night by default
with Day keeping the rim; a slow turn that stops at the first touch; drag and
drop by angle; By kind as the arrangement with its two region names; silver
M-IDs on every dark canvas. Rounds and measurements:
[`ccr_atlas_lessons`](../../ccr_atlas_lessons.md).

## Invariants — do not violate these

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

① **Where agency skill statements come from when the three sources disagree**
(ruling 9's follow-up — published standards *and* ACE exhibits *and* the MAP
team; he said "All three"). Pilot: an AWS welding certification. **The only
thing blocking the outline's skill layer**; everything else is buildable.
② Which disciplines are grab bags besides Vocational and the no-discipline pile?
Interdisciplinary Studies (513 identities) is the candidate.
③ The live-session banner — what link, on which tabs?
④ The three legacy anchors without a seed discipline (`M-ID HOSP 100`, `104`,
`102`) need one of the 146 MQ disciplines.
⑤ Whether 60 is the right search depth, and whether an emptied discipline should
vanish or ghost.
⑥ The right-edge vertical glyph rail from his Obsidian screenshot — glyph-only,
so his call under his own glyph rule.
⑦ **The CPL face is on the map — his eye on it.** `#skyview/cpl`: does the
credential-led label read right at his zoom, and is *Articulations* the word?
⑧ **The Sky is in — his eye on it as shipped** (S239): the opening window
(150° across, the prototype's), the pace of the turn and the twinkle, the two
region names, Day's rim, and **whether it runs smoothly on his machine** —
42 ms a frame in headless software rendering (13.5 fps) is the only
measurement we hold; a real GPU should do better, and if it does not, the
lever is an offscreen star layer redrawn only when the view moves.

⚠️ The Pages deploy prunes `docs/`, so a sheet is handed over as an artifact
link, never a github.io URL.

## NEXT

⓪ **His eye on the Sky, then the frame budget** (NEEDS SAM ⑧). Measure on the
served page before touching the draw: `scratchpad` drives exist for the turn
(`time_draw.js`) and a real-mouse drag (`drive_sky.js`); the star pass is
already batched, so the next lever is not per-point work but an offscreen
layer for the sub-`ID_ZOOM` stars, invalidated by view change, or a WebGL
point pass behind the same `w2s`. ⚠️ Whatever changes, the drop test, the
keyboard path and `npm run a11y skyview` run again in the same PR.
① **DR-24's write surface** — the curate phrase and the propose/second gate,
routed through Governance first (Rule 10 a3). ② The skills layer's fetch problem
(NEEDS SAM ①). ③ The rest of the queue:
[`skyview_backlog`](../../skyview_backlog.md), including the CPL face's smaller
asks (the 55 stale exhibits, the funnel sidecar refresh, a credentials column in
the workspace tables).
