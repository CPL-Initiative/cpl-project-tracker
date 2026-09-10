---
title: "SkyView — the engineering invariants"
created: 2026-09-09
updated: 2026-09-09
tags: [reference, skyview]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference
related:
  - "[[skyview-ccr-interface]]"
---

# SkyView — the engineering invariants

> **Read this BEFORE touching `prototype/ccr_universe.js`,
> `prototype/ccr_atlas_v1.html` or the SkyView builders.** Every rule below is
> here because a session got it wrong once; several are silent failures that
> look like correct output. The lane's STATE — what is shipped, what waits on
> Sam, what is next — is
> [`lanes/skyview-ccr-interface`](lanes/skyview-ccr-interface.md); the dated
> story behind each rule is [`ccr_atlas_lessons`](../ccr_atlas_lessons.md).
>
> ⭐ **Split out of the lane file on 2026-09-09**, which was 2.75× its 12,000 B
> budget and had carried the warning for three checkpoints. The invariants are
> not lane state — they answer a question you arrive with, which is the PULL
> side of `CLAUDE.md`'s assignment rule. **Do not move them back**, and do not
> re-inflate a rule with its evidence: the evidence goes to the lessons doc and
> a pointer comes back.

## Invariants — do not violate these

### The payload and the model

⭐ **AN ORBIT IS A PLACEMENT SUGGESTION, NEVER A CURATION DECISION.** Hollow,
tethered, reasons named. Moves accept ONE course at a time as a
`CN:<control number> merge_into <identity>` row. **Nothing is written from the page.**

⭐ **THE TITLE CARRIES THE WEIGHT** (`kb/_build_ccr_universe.py`): title 8 × Dice
over lightly stemmed tokens; shared local subject code 1.5; TOP 0.5, units 0.15,
credit type 0.05 count only after a subject or title signal fired (Rule 7's
two-signals gate); a bare SUBJ4 match 0.3, never enough alone.
`tests/ccr_universe_orbits_test.py` pins both directions.

⭐ **A MEMBER HAS NO POSITION OF ITS OWN.** It is drawn on a SPOKE of its
parent's ring, so "leave it where I dropped it" cannot be a screen coordinate. A
parked course lives in the WORLD frame (`parkedMem`). Parking records NOTHING:
`applyMove` and `unstageMove` both clear it — "Put back" means both halves.

⚠️ **`ar` (articulation count) is ABSENT, never 0** — "none recorded" and "we did
not look" are the same thing on this feed. ⚠️ **The join must NOT resolve through
the alias chain**: those `course_id`s are already current-era.

⚠️ **`e` (CTE) IS 1 / 0 / ABSENT, AND ABSENT IS ITS OWN SWITCH.** 15% of points
carry no resolvable TOP code; folding them into "Academic" asserts something
about 7,569 courses the data does not say. ⚠️ On a `top_mixed` identity `e` is a
SUMMARY, not a fact (39%; those carry `em:1`).

⚠️ **LEVEL ORDERS WITHIN A RING, NEVER ACROSS THEM.** Which ring a course sits on
is decided by MATCH SCORE, and that is real signal. Only 12% carry a level word,
so `by_level` is a STABLE sort on the level rank alone.

⚠️ **THE LIVE SET IS THE CATALOG, NOT THE BROWSER PAYLOAD** (with Rule 7's alias
chain). `unified_courses_data.js` ships 16,480 of 76,008 rows, so "not in the
payload" read as "dead" over-reported it fourfold. `ALIAS_MAPS` is a list of
paths — call `load_maps()` first, or `resolve_id()` resolves nothing and does not
error; the tell is direct and chain agreeing EXACTLY.

### Building and serving

⚠️ **The page must be SERVED, not opened** — `file://` blocks the payload fetch.
The layout is hand-built (`kb/_build_ccr_universe.py`, ~20 s) and committed; the
harness needs the gitignored shards (`--shards-only`). Descriptions live in the
public Supabase bucket `ccr-desc`, 159 shards / 50 MB.

⚠️ **The daily run rebuilds the decision payload AND `skyview.html` with it** —
the payload AND `ccr_universe.js` are INLINE in the served page, so regenerating
the JSON alone never reaches it, and neither does a JS change. Rebuild with
`prototype/build_ccr_atlas.py`; never hand-patch `skyview.html`.
`prototype/ccr_cpl.json` and `prototype/ccr_sky.json` rebuild every run; their
tests fail CI on a stale file.

⚠️ **`npm test` proves nothing about layout** — jsdom returns zeroes for every
rectangle. Run `npm run a11y skyview` (11 routes) or drive a real browser.
⚠️ **And `npm test` does not run the dependency-map check.** The map records LINE
NUMBERS, so any edit to a mapped file makes it stale and turns CI red on a green
local suite: `python3 kb/_build_dependency_map.py --check`.

### The window, the row and the canvas

⚠️ **Full screen paints ONE element.** A control outside `#u-full` does not exist
there; the page's single search form is **borrowed** into the map's row and sent
home by `setCrumbs`. And **state painted at render time goes stale on every path
that changes it without rendering** (`setSolo`, `paintFace`, `paintLit`,
`paintProj`, `paintCtls`).

⭐ **THE CANVAS HEIGHT IS JS-OWNED, AND CSS CANNOT TAKE IT** (S247). `fitCanvas()`
writes `#u-wrap`'s height inline, so a stylesheet rule for it is overridden and
only looks as though it works. ⚠️ **Its branch ORDER is load-bearing**: the solo
test must precede `window.innerWidth<700`, or the map is pinned at 0.62 × the
viewport on every phone by arithmetic no header change can free. 0.62 remains
correct for the comprehensive view, which scrolls.

⭐ **THE CANVAS HEIGHT IS DERIVED FROM THE ROW'S, SO IT GOES STALE WHEN THE ROW
CHANGES HEIGHT** (S247). A `ResizeObserver` on `#u-top` / `#u-foot` /
`#u-face-line` is the fix; a resize listener cannot be, because the window never
resizes on a phone. It also covers the row wrapping at a breakpoint and a font
landing late.

⭐ **BELOW 1100px THE ROW FOLDS BEHIND THE WORD *Controls*, AND THE FOLD IS CSS
ONLY** (Sam, 2026-09-09: *"It now takes up half the screen"*). `#u-bar` keeps its
place in the DOM — lifting it elsewhere was tried and is wrong (two `#u-bar`
under one id, and it vanishes in full screen), so every id, handler and `paint*`
function is untouched. ⚠️ **`NARROW_MAX` must equal the stylesheet's breakpoint**
(`tests/ccr_skyview_mobile_row.test.js` pins them): the CSS decides whether the
word shows and the constant decides whether the legend starts shut, so a drift is
a legend folded with no way to unfold it. ⚠️ A rail down the left edge was
considered and refused — 48px of a 390px canvas cannot hold words, so it settles
the plain-words rule by geometry.

⚠️ **THE CLOSED SIDEBAR IS ZERO-WIDTH, NOT `display:none`** — it collapses below
`INSP_COLLAPSE` and leaves its grip on the stage's edge, or there is nothing to
drag back out. ⚠️ **That grip must sit ENTIRELY INSIDE**: closed, a 5px straddle
failed `npm run a11y skyview` on all 11 routes at every width. ⚠️ Below 700px the
stage is a COLUMN, where a zero-*width* rule still measures 1px tall — enough for
a phone to rubber-band a map that should hold still.

⚠️ **THE DOCKED PANEL NARROWS THE CANVAS.** A screen position computed from the
canvas rect BEFORE an identity opens is stale after it. Measure after.

⚠️ **A REFUSAL THAT PRINTS OUT OF SIGHT IS A DEAD CONTROL.** `#u-hint` sits at the
foot of the window; `#u-writes` is inside `#u-below`, which `body.u-solo` — the
default — never paints. Anything that can say *no* says it where the hand is.

### Pointer, touch and the turn

⭐ **TWO FINGERS NEED A REGISTRY, AND WITHOUT ONE THEY FIGHT** (S247). The canvas
carries `touch-action:none`, so the browser's own pinch is off; `pointerdown` set
`drag` unconditionally, so a second finger replaced the first one's grab and both
fed the same pan — a 5× spread changed the zoom by nothing. `pts` keyed by
`pointerId` is what makes "how many fingers" answerable; `zoomAt()` already
serves both projections. ⚠️ **`pointercancel` must clear the registry** — the OS
takes a pointer away on a system gesture or palm rejection and never sends
`pointerup`, so the phantom would make the next single drag count two.
⚠️ A carried course outranks a pinch (the rule below).

⭐ **THE TURN STOPS AT THE FIRST TOUCH, AND THERE IS NONE UNDER REDUCED MOTION.**
`startTurn()` returns under `prefers-reduced-motion`; a pointer, a key, a search
or a carry stops it; *Rotate* restarts it. **A carried course never sees a moving
target.**

⭐ **THE CARRY ENDS WHERE THE MOVE IS STAGED, BY WHATEVER ROUTE.** The canvas
paths cleared `drag`; the PANEL paths went straight to `applyMove` and left the
reader invisibly carrying, and the pick-up handlers refuse a second carry — so
every *Drag…* became a silent no-op for the session. Released in `applyMove`
**after** the gates, so a refused move keeps the carry.

⭐ **A DROP LANDS ON A CIRCLE; ONLY A READ LANDS ON A STAR.** An open identity's
member ring spreads over its neighbors and `pick()` gives those stars absolute
priority — right for reading, wrong for aiming. `pick(px,py,forDrop)` resolves
circles only while carrying. ⚠️ Neither rule may be widened onto the other.

⚠️ **THE TURN'S `dt` CLAMP MUST SIT ABOVE THE REAL FRAME TIME** (`TURN_DT_MAX`).
It guards a backgrounded tab and is not a frame-rate limiter; below the real
frame time it pins every frame into a fixed angular step at an irregular cadence,
which is the lurch. ⚠️ Fixing it made the picture WORSE — **frame rate is what
buys smoothness**. The pace stays as ruled.

### The sphere

⭐ **THE SPHERE IS THE MAP THROUGH A PROJECTION, NOT A SECOND RENDERER.** One
canvas, one `draw()`, one `pick()`: `prepSphere()` projects each island's center
and its Jacobian once a frame; `w2s(x,y,isl)` is one multiply-add from it and
`pick()` reads the same cache. ⚠️ **The globe is the sky mirrored** — the
window's right is the globe's left. ⚠️ **A flat-map suite declares
`window.CPL_SKYVIEW_OPENS="map"` in `beforeParse`**, or it is testing the sphere.
[note](../../kb-notes/methodology-the-sphere-is-the-map-through-a-projection.md)

⭐ **AN ISLAND BEHIND THE READER IS NOT A SMALL ISLAND, IT IS A HUGE ONE.** The
sky is stereographic — the scale at `ang` off the view direction is `sec²(ang/2)`,
131× at 170° — and a bounding-box cull built from `isl.r * k` PASSES on that
inflated radius, so the island sprays its courses over everything. The test is
ANGULAR: an island whose nearest edge lies beyond the screen's far corner is not
in view. ⚠️ It was in the prior session's own numbers and read as a normal cull.

⭐ **AN ISLAND ON SCREEN IS NOT AN ISLAND WHOSE POINTS ARE ON SCREEN.** Within a
passing island, a discipline wider than the window spills 20.6% of its dots past
every edge. ⚠️ **The test belongs INSIDE the fast branch and nowhere earlier** —
only there is the node a plain dot whose radius is its whole extent; a point on
the slow path can legitimately light the window from off screen.

⭐ **EVERY ZOOM BAND NEEDS HYSTERESIS — A BARE THRESHOLD BLINKS.** On the sphere
`k` is PER ISLAND and drifts as the sky turns, so islands sitting within ±3% of
`NODE_ZOOM` flip repeatedly, each switching a discipline's whole dot field.
`nodesShown()` remembers its side (`NODE_ZOOM_KEEP`); ⚠️ **`pick()` reads that
memory via `nodesOnScreen()` and never re-tests**, or eye and hand disagree.

⚠️ **THE OPENING WIDTH IS WRITTEN IN TWO PLACES** — `sph`'s initializer and
`resetView()` — and **`resetView` is the one that runs.** Both say 94° half =
**188° across** (Sam, 2026-09-08). The constraint is `NODE_ZOOM`: as the window
widens the per-island scale falls, and past ~226° islands start losing their
stars (150°: 70/70 · **188°: 99/99** · 240°: 128/**124**). An island's scale
drifts as the sky turns, so the margin is the point.

⭐ **A TINT THAT FILLS THE WINDOW IS NOT A TINT, IT IS THE SKY.** The selected
island's fill reads against the ground AT ITS EDGE; past the zoom where that edge
leaves the window it simply *is* the sky. Falls back to `pal.island` when the
farthest window corner is inside the disc.

⭐ **NIGHT ON THE SPHERE, LIGHT ON THE MAP, ONE MEMORY; DAY KEEPS THE RIM.**
`darkChoice` (`skyview:theme`) is the one stored choice; with none stored,
`dark = sphereOn()`. By day every dot is rimmed seal blue — silver on the day
ground is 1.24:1.

⭐ **THE SPHERE PLACEMENT IS A DAILY ARTIFACT**: `kb/_build_ccr_sky.py` →
`prototype/ccr_sky.json`. Fingerprinted; `--check` runs in half a second;
`prototype/globe/globe_layout.py` IMPORTS the relaxation. ⚠️ Its "kind" is TOP's
one sanctioned use as a display arrangement, never a classification.

⚠️ **THE MAP BUTTON HAS LEFT THE ROW; THE MAP HAS NOT LEFT THE CODE** (Sam,
2026-09-08, reversing his own ruling of the day before). `proj==="map"` is still
the flat renderer the sphere is a projection OF, `#map` still routes, and seven
suites declare `CPL_SKYVIEW_OPENS="map"`. Putting the word back is one line.

### Labels and the frame budget

⭐ **A MEMO KEYED ON A VALUE THAT DRIFTS IS NOT A MEMO.** `textW` cached on
`ctx.font` + string, and a label is sized off its DRAWN radius — a new float
every frame, so it never hit once, and each miss handed Chromium a font to build
(`measureText` 11.2% of the profile). ⚠️ **And the fix moved the bill rather than
removing it**: with the measure no longer asking, `strokeText` inherited the same
work. Only stopping the drift helped — `labelSize()` rounds to whole pixels
**with a 0.6px dead band**, because a bare round is itself a threshold on a
drifting value. [note](../../kb-notes/methodology-fixing-a-cost-can-move-it-rather-than-remove-it.md)

⚠️ **THE FRAME BUDGET IS PER-POINT JS, NOT THE CANVAS.** Drawing is nearly free
(27,000 rects in 5.9 ms), so an offscreen layer or a WebGL pass buys almost
nothing. **What has worked, three times running, is doing less per point.**
⚠️ Numbers are headless with no GPU: the ORDER holds, the absolutes do not, and
nobody has a number from Sam's machine.

### Search, the ask, and the lists

⭐ **TICKING COLLECTS; ENTER APPLIES.** A tick writes to a pending set and
repaints ONE row; Enter commits and closes; Escape abandons; a choosing session
spans every term typed. ⚠️ Enter closing the list is safe **only because ticking
no longer commits**.

⭐ **INTENT IS RECORDED, NEVER DERIVED BY SUBTRACTION.** `pendItem` holds the
ticks, `pendOff` the explicit unticks, and one `pendingEdit()` feeds the footer
**and** the commit.
[note](../../kb-notes/methodology-a-snapshot-cannot-be-the-authority-on-intent.md)

⭐ **A QUESTION IN THE SEARCH BOX RETURNS A SELECTION, NOT A PARAGRAPH** (S247,
Sam: *"use the search box for questions, like Sierra handles"*). cpl-chat
retrieves from the knowledge base, which does not contain SkyView's payload — so
prose about it would be composed from a corpus that cannot hold the answer. The
model translates into the map's token grammar and the map answers by moving.
⚠️ **Nothing the model names is trusted as a key**: every discipline and course
id resolves against the live payload, and what does not resolve is REPORTED, not
dropped — a dropped name and an empty island look identical and mean opposite
things. An ambiguous near-match resolves to NOTHING rather than the first hit.
⚠️ A question that resolves to nothing leaves the map exactly as it was.

⚠️ **A NEW cpl-chat SURFACE MUST BE DECLARED IN FIVE PLACES**, and three suites
enforce it: `KNOWN_SURFACES`, `DRAFTING_SURFACES` + its cap table, the
`sierra_guidance` CHECK constraint, the curator's picker in `sierra_training.js`,
and the vetted-owner map in `tests/sierra_memory_isolation.test.js`. ⚠️ An
undeclared surface does not error — it normalizes to null and silently takes the
1,000-character chat cap, truncating the contract. ⚠️ `skyview-ask`'s envelope is
6,178 chars, over `QUERY_CAP_DRAFTING`, hence its own cap.
⚠️ **`retrieval_query` carries the QUESTION, never the envelope** — embedding the
contract searches the knowledge base for the contract.

⭐ **A REFUSAL OR AN OFFER MUST BE VISIBLE WHERE IT APPLIES** (S247). A question
matches no course title, so the suggestion list hid itself and took the "Enter
asks" footer with it — the affordance was invisible exactly when it became
available. It renders with no options instead. ⚠️ And the footer's condition must
be the SAME test the commit makes, or the label promises what the key will not do.

### The outline, the skills and the CPL face

⭐ **THE OUTLINE IS A SHEET OVER THE MAP, NOT A VIEW INSTEAD OF IT** (Sam: *"we
never have to exit skyview"*). `__ccrOutline` opens `#u-outline-sheet` and
**leaves the hash alone**. ⚠️ Mounts inside `#u-full`. Every other exit parks the
camera, so **Back** returns to the framing, not the opening view.

⭐ **A STAGED MOVE IS MARKED ON THE MODEL, AND EVERY VIEW ASKS IT.**
`stagedHere` / `stagedAwayFrom` / `stagedWords` are the only way a view learns
about one; the words are written once. ⚠️ A view that reads `movedTo` to decide
what to SAY is the drift this prevents.
[note](../../kb-notes/methodology-a-staged-state-lives-on-the-model-and-every-view-asks-it.md)

⭐ **ONE SKILL, ONE ROW — FOLD THE KEY, KEEP THE COLLEGES' WORDS.** Fold at the
COUNTING step, never by collapsing finished rows; display the spelling the most
colleges published. **The fold stands as shipped** (Sam, 2026-09-07).
⚠️ **A REVIEWER'S REMOVAL IS RECORDED, NEVER DERIVED** — the imputation re-runs
whenever a description lands, so storing *what is left* would delete every skill
that arrived since. `skillDrop` names the struck keys.

⭐ **THE ARTICULATIONS TOGGLE IS A LIGHT, NOT A FILTER, AND SHOWS PRESENCE ONLY**
(Sam's ruling 2, 2026-09-07). It lights what has a number and leaves the rest
drawn as it is (1,490 of 49,896 carry `ar`). The Show menu keeps the *filter*.
⚠️ "Where they differ college to college" is NOT a map layer — four cases, two of
them data defects, in `kb/ccr_articulation_disagreements.json`.

⭐ **THE CPL FACE LEADS WITH THE CREDENTIAL, AND A POINT NOTHING REACHES IS
UNLABELED.** Curated name → issuing AND training agency where they differ → what
it earns → the colleges holding it. Agencies come from the curated CER artifact,
never the crosswalk's inlined issuer (stale on 1,743 of 4,592).

⭐ **THE COVERAGE LINE TAKES BOTH NUMBERS FROM ONE UNIVERSE**: **1,924 of 5,497
articulated exhibits**, from `ccr_cpl.json`'s own counts.
[note](../../kb-notes/methodology-a-coverage-line-takes-both-numbers-from-one-universe.md)
⚠️ The 55 crosswalk exhibits absent from today's feed are flagged `s:1`, never
dropped.

⚠️ **`ensureCorpus()`, NOT `__ccrUniverse` ALONE.** An outline reached by its own
`#outline/<id>` link had ZERO college courses — a false statement about the data.

⚠️ **A CLOSED `<details>` STILL MEASURES.** Chromium hides its content with
content-visibility, not `display:none`, so the rect is real while `focus()` is a
no-op; the a11y script opens them. ⚠️ **A DISABLED control is the same shape** —
`focus()` is a no-op there too, so it read as "no ring" on every view that
disables one (fixed in `scripts/a11y.js`, S247).

⭐ **v4 IS THE GOVERNING REVIEW, AND ALL EIGHT ITEMS HAVE SHIPPED** —
[`skyview_video4_findings.md`](../../skyview_video4_findings.md).
⚠️ `skyview_video2_findings.md` is a **different, earlier** recording; the two
lists must not be merged. **Do not build** hover-on-the-title — he decided
against it on camera. **Praised, do not break:** Fit all; the panel moving to the
selection.

**Durable facts:** grinding the whole merge queue perfectly lands at 35,937,
14.4× short of 2,500, so **packaging** is the only mechanism with the right shape
(ESL proved it at 85:1); ~5,700 decisions, 97.1% ≤ 12 identities; 3,001 carry NO
discipline; `CN:` names more than one course on 1,761 keys and those moves are
refused with the reason.

## The outline of record — BUILT (S235, CPL layer S238)

*Moved here from the SkyView lane at the S251 checkpoint: these are
invariants, and invariants live in the invariants file. The lane states
current truth about the lane; this states what must not be violated.*

`#outline/<id>`, six layers, `tests/ccr_skyview_outline.test.js`.

⭐ **The description is CONSOLIDATED and NAMES NO COLLEGE** (Sam, 2026-09-10:
attribution *"could lead to division as some faculty may question the choice"*).
The unit is the SENTENCE; the selector is agreement, not typicality; what only
some add sits under *Some colleges also include* with its count. Invariants, none
optional: ⚠️ **COMPLETE-link at Dice 0.3, never single-link** (single-link chains
and reports agreement no two colleges have); ⚠️ **ordered by position in the
source, not by support**; ⚠️ **the catalog's administration is stripped FIRST**
and is the most-agreed text in the corpus — a numeric heading is stripped and its
sentence KEPT, a prose-valued key takes its sentence with it; ⚠️ **placeholder
text never enters a derived layer**; ⚠️ **C-ID/CCN is NOT HANDLED and the card
says so** — MAP holds the designation, not the descriptor text (541 identities),
so loading them is a data feed. Measurements:
[`methodology-consolidate-sentences-not-documents`](../../kb-notes/methodology-consolidate-sentences-not-documents.md).

⭐ Sam's MAP-Generated sentence prints verbatim. ⭐ Two level axes, neither
derived. ⚠️ Confidence is agreement BETWEEN colleges. ⭐ A reviewer may add a
skill and take one out — staged, nothing written.
