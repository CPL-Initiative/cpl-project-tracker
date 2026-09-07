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
keyboard path. A course opens its **outline of record** (S235). **Since S238
the map has two faces and a light:** *Courses | CPL* names each point by its
course or by the credential that reaches it, *Articulations* lights what
carries one, and the outline's CPL layer is built (#1508). **Since S239 a
staged move is marked on the course itself** (v4 item 7, #1513) and **the
sphere placement is a daily artifact** (`prototype/ccr_sky.json`). The globe
is RULED IN; its design calls are on a sheet awaiting Sam (NEEDS SAM ⑧).
Rounds and measurements: [`ccr_atlas_lessons`](../../ccr_atlas_lessons.md).

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
every path that changes it without rendering** (`setSolo` must repaint the
window controls; `paintFace`/`paintLit` paint the face and the light).

⚠️ **The page must be SERVED, not opened** — `file://` blocks the payload fetch.
The layout is hand-built (`kb/_build_ccr_universe.py`, ~20 s) and committed; the
harness needs the gitignored shards (`--shards-only`). Descriptions live in the
public Supabase bucket `ccr-desc`, 159 shards / 50 MB, ordered by
`location.hostname` so the deployed page never tries the local base.

⚠️ **The daily run rebuilds the decision payload AND `skyview.html` with it** —
the atlas payload is INLINE in the served page, so regenerating the JSON alone
never reaches the deployed page. `ccr_universe.json` is deliberately untouched.
**The CPL payload (`prototype/ccr_cpl.json`) is rebuilt every run too** (Step
4d3): it joins the crosswalk to the daily CER and statewide artifacts, and
`tests/ccr_cpl_payload_test.py` fails CI on a stale file.

⚠️ **`npm test` proves nothing about layout** — jsdom returns zeroes for every
rectangle. Run `npm run a11y`, or drive a real browser.

⭐ **A DROP LANDS ON A CIRCLE; ONLY A READ LANDS ON A STAR** (S237). An open
identity's member ring SPREADS over its neighbors and `pick()` gives those stars
absolute priority — correct for reading, and it eclipses the destination a
curator aims at. `pick(px,py,forDrop)` resolves circles only while carrying.
⚠️ Neither rule may be widened onto the other.

⭐ **A STAGED MOVE IS MARKED ON THE MODEL, AND EVERY VIEW ASKS IT** (S239, v4
item 7). `stagedHere` / `stagedAwayFrom` / `stagedWords` are the only way a
view learns about a staged move; the words are written once (*staged here —
not saved* · *staged to move to ⟨title⟩ — not saved*). The destination's row
and star say it; the origin still DRAWS the course as a dashed ghost star and
lists it under *Staged to move away* with a *Put back*; labels, hovers and the
outline's band count it. A move record keeps the course's `home`. ⚠️ A view
that reads `movedTo` directly to decide what to SAY is the drift this exists
to prevent — the sphere reads the same helpers.
[`methodology-a-staged-state-lives-on-the-model-and-every-view-asks-it`](../../kb-notes/methodology-a-staged-state-lives-on-the-model-and-every-view-asks-it.md).

⚠️ **THE DOCKED PANEL NARROWS THE CANVAS** (S239, measured in Chromium). Opening
an identity docks the details panel and the canvas loses its width, so a
screen position computed from the canvas rect BEFORE the open is stale after
it — a drive that clicks the center (right either way) and then drops on a
neighbor computed earlier lands on empty space. Measure after the open. jsdom
cannot see this (every rect is zero).

⭐ **THE SPHERE PLACEMENT IS A DAILY ARTIFACT** (S239): `kb/_build_ccr_sky.py`
→ `prototype/ccr_sky.json` (34 KB) — each island's center on the sphere three
ways (committed · spread · by kind, as longitude/latitude in degrees) with the
CTE share and its base; points are placed in the browser from their island's
center and their flat-map offset (`radians_per_unit`, the prototype's
`expmap`). The builder fingerprints its inputs and relaxes only on a change
(~90 s); `--check` and `tests/ccr_sky_payload_test.py` run in half a second
(Step 4d4). A discipline's side is HELD across 0.6/0.4 by a 0.05 margin.
`prototype/globe/globe_layout.py` IMPORTS the relaxation (single source; the
globe page rebuilds byte for byte). ⚠️ The kind is TOP's one sanctioned use as
a display arrangement, never a classification; the reading rests on 24% of
points, carried as `base` per island.

⚠️ **A REFUSAL THAT PRINTS OUT OF SIGHT IS A DEAD CONTROL.** `#u-hint` sits at
the foot of the window; `#u-writes` is inside `#u-below`, which `body.u-solo` —
the default — never paints. Anything that can say *no* says it where the hand
is: the carry rings its destination and names it.

⭐ **ONE SKILL, ONE ROW — FOLD THE KEY, KEEP THE COLLEGES' WORDS** (S237).
Fold at the COUNTING step, never by collapsing finished rows (the chip counts
COLLEGES); display the spelling the most colleges published; `sses` belongs in
the `-es` family. **The fold stands as shipped** (Sam, 2026-09-07); a bad pair
goes on a do-not-fold list. Detail in the lessons doc.

⚠️ **A REVIEWER'S REMOVAL IS RECORDED, NEVER DERIVED.** The imputation re-runs
whenever a description lands, so storing *what is left* would silently delete
every skill that arrived since — S236's lesson, one layer up. `skillDrop` names
the struck keys; each is restorable.

⚠️ **`ensureCorpus()`, NOT `__ccrUniverse` ALONE.** An outline reached by its own
`#outline/<id>` link had ZERO college courses: every layer read "none", which is
a false statement about the data, not a rendering gap.

⚠️ **A CLOSED `<details>` STILL MEASURES.** Chromium hides its content with
content-visibility, not `display:none`, so the rect is real while `focus()` is a
no-op — ten collapsed buttons read as "focusable with no ring" in `npm run
a11y`. A `height === 0` guard does not catch it; the script opens them.

⭐ **THE ARTICULATIONS TOGGLE IS A LIGHT, NOT A FILTER, AND IT SHOWS PRESENCE
ONLY** (Sam's ruling 2, 2026-09-07). It lights what has a number and leaves the
rest drawn as it is — no gray, no hollow, no "none", each of which reads as a
finding the feed cannot support (1,490 of 49,896 points carry `ar`). The Show
menu keeps the *filter*. Below the course zoom a discipline holding a lit course
carries the ring, or the control answers only where the reader is not standing.
⚠️ **"Where they differ college to college" is NOT a map layer** — four cases,
two of them data defects, in
[`kb/ccr_articulation_disagreements.json`](../../../kb/ccr_articulation_disagreements.json).

⭐ **THE CPL FACE LEADS WITH THE CREDENTIAL, AND A POINT NOTHING REACHES IS
UNLABELED** (Sam's ruling 3 + his note). Curated name → issuing agency AND
training agency where they differ → what it earns → the colleges holding it;
search switches to the vocabulary; the agencies go on the **outline of record**
too (and the CER tab already renders both). Agencies come from the curated CER
artifact, never the crosswalk's inlined issuer (stale on 1,743 of 4,592 records).
`#skyview/cpl` is the face as a link.

⭐ **THE COVERAGE LINE TAKES BOTH NUMBERS FROM ONE UNIVERSE, AND THE SURFACE
COMPUTES IT** (S238). The ruled draft, *"1,490 of 6,388 exhibits"*, paired an
identity count with the credit funnel's exhibit count — a universe that shares
**570** ids with the 1,924 exhibits that reach the map (the funnel is ACE-keyed,
the crosswalk MAP-keyed). The line reads **1,924 of 5,497 articulated exhibits**,
built from `ccr_cpl.json`'s counts; the fixture's 4 of 777 makes a literal fail.
[`methodology-a-coverage-line-takes-both-numbers-from-one-universe`](../../kb-notes/methodology-a-coverage-line-takes-both-numbers-from-one-universe.md).
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
**and** the commit. ⚠️ Deriving removals as `have − pendKeys` made Enter destroy
a chip nobody unticked ([`methodology-a-snapshot-cannot-be-the-authority-on-intent`](../../kb-notes/methodology-a-snapshot-cannot-be-the-authority-on-intent.md)).

⭐ **v4 IS THE GOVERNING REVIEW, AND IT IS NOW IN THE REPO** —
[`skyview_video4_findings.md`](../../skyview_video4_findings.md). ⚠️
`skyview_video2_findings.md` is a **different, earlier** recording (6m50s vs
6m18s) and the two lists must not be merged; the committed v2 transcript contains
none of v4's rulings. All eight of v4's items have shipped (#1502/#1503; the legend's `unified`
gloss and the id hovers in S238; the staged-to-move mark in S239, #1513).
**Do not build** hover-on-the-title — he decided against it on camera.

## Measured in a browser — the durable warnings

⚠️ **jsdom cannot see any of this** — every finding came from the served page
([`ccr_atlas_lessons`](../../ccr_atlas_lessons.md);
[`methodology-a-correct-measurement-can-name-the-wrong-place`](../../kb-notes/methodology-a-correct-measurement-can-name-the-wrong-place.md),
[`methodology-a-rule-that-is-right-for-reading-can-be-wrong-for-writing`](../../kb-notes/methodology-a-rule-that-is-right-for-reading-can-be-wrong-for-writing.md)).
⚠️ It is `.sugwrap` that wraps, not `#u-bar`; chip tightening is bounded by
target size (24×24, SC 2.5.8). ⚠️ The picks died on the way OUT (`setCrumbs()`
calls `clearTokens()`). ⚠️ Sam retracted a finding on camera — read a recording
to the end first.

The round-by-round of every served-page drive (S237–S239) is in the lessons doc, dated.

**Praised, do not break:** Fit all; the panel moving to the selection.

## Sam's rulings

Where each of the 2026-09-06 and 2026-09-07 rulings landed is recorded once, in
[`ccr_atlas_lessons`](../../ccr_atlas_lessons.md) (archived from this lane at the
S238 checkpoint); the ones still open are NEEDS SAM below.

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
⑧ **The sphere's design calls — THE SHEET IS OUT, replies pending** (S239):
`docs/visuals/2026-09-07-eight-calls-before-the-sky-goes-in.html`, artifact
https://claude.ai/code/artifact/5d683e8a-baa7-4ecc-a0b8-140ad3aee18d (read the
replies FIRST with the Artifact tool's `read_db`, collection `replies`). Eight
calls: which view opens; whether the flat map stays; the Day sky against the
dark-canvas rule (measured: silver stars 1.2:1 and the light 1.1:1 by day, a
rim is what makes a dot exist); motion by default; curation gestures on a curve;
By kind as the arrangement (29% of five nearest committed neighbors kept, 49%
the ceiling); the fate of each prototype control; and **the M-ID color on the
dark ground** — his globe ruling (silver, "like stars") and his legend ruling
(violet) meet there, and 49,355 of 49,896 points (99%) wear it. Nothing is
built on the answers yet.

⚠️ The Pages deploy prunes `docs/`, so a sheet is handed over as an artifact
link, never a github.io URL.

## NEXT

⓪ **Execute the sheet's verdicts, then build the Sky view** — Sam, 2026-09-07:
*"Looks great! Let's go with it in next session."* Not the prototype page copied
in: a Sky view in `ccr_universe.js` over the live payload (`prototype/ccr_sky.json`
for the islands, `ccr_universe.json` for the points, the prototype's `expmap`
for placement), drawn on the map's own Canvas 2D (a full redraw of 49,896
points measured 18–35 ms in software rendering — no three.js), the CPL face and
the light carried over, and every invariant above re-earned on the sphere (the
drop hit-test by angle, the label placer, the keyboard path, fixed-size text,
reduced motion, the a11y route in `a11y.config.js`). ⚠️ Every design call
assumes his replies (NEEDS SAM ⑧) — do not guess them. The prototype:
`docs/visuals/2026-09-07-skyview-globe-prototype.html`, artifact
https://claude.ai/code/artifact/51f5249d-1884-406d-889e-259b262b86e5, generators `prototype/globe/`.
① **DR-24's write surface** — the curate phrase and the propose/second gate,
routed through Governance first (Rule 10 a3). ② The skills layer's fetch problem
(NEEDS SAM ①). ③ The rest of the queue:
[`skyview_backlog`](../../skyview_backlog.md), including the CPL face's smaller
asks (the 55 stale exhibits, the funnel sidecar refresh, a credentials column in
the workspace tables).
