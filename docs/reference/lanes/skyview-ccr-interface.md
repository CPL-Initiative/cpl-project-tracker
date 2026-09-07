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
carries one, and the outline's CPL layer is built (#1508). Rounds and measurements:
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

⚠️ **A REFUSAL THAT PRINTS OUT OF SIGHT IS A DEAD CONTROL.** `#u-hint` sits at
the foot of the window; `#u-writes` is inside `#u-below`, which `body.u-solo` —
the default — never paints. Anything that can say *no* says it where the hand
is: the carry rings its destination and names it.

⭐ **ONE SKILL, ONE ROW — FOLD THE KEY, KEEP THE COLLEGES' WORDS** (S237).
`olWords()` keeps a hyphen inside a token, so `flux-cored arc welding` is a
3-token phrase and `flux cored arc welding` a 4-token one. ⚠️ **Fold at the
COUNTING step, never by collapsing finished rows** — the chip counts COLLEGES,
so one college writing it both ways counts once and two spelling it differently
count twice. Display the spelling the most colleges published. ⚠️ `sses` belongs
in the `-es` family or *processes* stems to *processe*. **The fold stands as
shipped** (Sam, 2026-09-07): all 39 families touching a word whose singular means
something else pair real variants of one name; a key can be a non-word (*sery
solution*) and the key is never shown. A bad pair goes on a do-not-fold list.

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

⭐ **TICKING COLLECTS; ENTER APPLIES (Sam, 2026-09-06: "why not wait on that step
until the user hits enter").** A tick writes to a pending set and repaints ONE
row — nothing re-ranks, rebuilds, reveals or moves, so there is no scroll to
restore and no page count to keep in step. Enter commits the whole set and
closes; Escape abandons it. A choosing session spans **every term the reader
types**, because refining a search is how you hunt for the next thing to add.
⚠️ Enter closing the list reverses item 6 of the same day, and is safe **only
because ticking no longer commits**. If ticking is ever made to commit on the
spot, item 6's protection must come back with it.

⭐ **INTENT IS RECORDED, NEVER DERIVED BY SUBTRACTION.** `pendItem` holds the
rows the reader ticked, `pendOff` the keys they explicitly unticked, and one
`pendingEdit()` feeds the footer **and** the commit so the counter cannot promise
what the commit will not do. ⚠️ The first cut derived removals as
`have − pendKeys`, and that made Enter **destroy a chip nobody unticked**:
`pendKeys` is seeded once per session, so anything committed outside that seed is
absent from the snapshot and absence read as intent is a deletion. A snapshot
cannot be the authority on intent — everything that happens outside it looks like
a decision the reader made. Guarded by a check that names the destroyed key, not
a count, so it cannot be satisfied by lowering an expectation.

⭐ **v4 IS THE GOVERNING REVIEW, AND IT IS NOW IN THE REPO** —
[`skyview_video4_findings.md`](../../skyview_video4_findings.md). ⚠️
`skyview_video2_findings.md` is a **different, earlier** recording (6m50s vs
6m18s) and the two lists must not be merged; the committed v2 transcript contains
none of v4's rulings. Seven of v4's eight items have shipped (#1502/#1503; the
legend's `unified` gloss and the id hovers in S238). **Open:** a rehome gives the
course no *staged-to-move* mark (the confirmation line already renders — frame
17 — so the fix is the mark, not the message). **Do not build**
hover-on-the-title — he decided against it on camera.

## Measured in a browser — the durable warnings

⚠️ **jsdom cannot see any of this.** Every finding below came from driving the
served page; the round-by-round is in
[`ccr_atlas_lessons`](../../ccr_atlas_lessons.md), the reusable lessons in
[`methodology-a-correct-measurement-can-name-the-wrong-place`](../../kb-notes/methodology-a-correct-measurement-can-name-the-wrong-place.md)
and
[`methodology-a-rule-that-is-right-for-reading-can-be-wrong-for-writing`](../../kb-notes/methodology-a-rule-that-is-right-for-reading-can-be-wrong-for-writing.md).

⚠️ **IT IS `.sugwrap` THAT WRAPS, NOT `#u-bar`** — a `min-height` on `#u-bar`
would have read as a fix and changed nothing. Chip tightening is bounded by
**target size, not contrast** (`.u-tok-x` 24×24 is the SC 2.5.8 floor).
⚠️ **THE PICKS DIED ON THE WAY OUT** — `setCrumbs()` calls `clearTokens()` on
every view entry, so diagnosing the return path would have fixed nothing.
⚠️ **Sam RETRACTED a finding on camera.** Read a recording to the end first.

**S237, at 296% with Introduction to Welding open:** SIX identity circles inside
the viewport sat under one of that identity's own member stars, and a drop on
each of the first three moved nothing while the hint said *"That course is
already there."* Reading is unchanged by the fix — **24 of 24 drawn stars** still
open the college course. **S238:** the CPL face, the light, the vocabulary search
and the outline layer were each driven on the served page; `npm run a11y skyview`
passes all 9 routes at 3 widths.

**Praised, do not break:** Fit all; the panel moving to the selection.

## Sam's rulings — where each landed

- **2026-09-06, eight (outline sheet):** built — text zoom, "the only college
  teaching it", `.gitattributes`; recorded — skill-source precedence, the
  toggle's treatment of absence, the curate phrase's scope, no nightly layout
  rebuild, Interdisciplinary Studies is a grab bag. Detail in the lessons doc.
- **2026-09-07, eight (CPL views, folded skills, curate governance):** items 1-3
  **built in S238** (the invariants above); 4-5 stand as shipped; 6-8 are
  **DR-24** in the governance register with **Sam as its named owner** — an
  added skill carries the reviewer's name and the day, lands `proposed`, joins
  the published outline on a second curator's agreement; a removal is symmetric
  and an unseconded one stays visible with the objection. Nothing writes from the
  page until DR-24's surface ships. ⚠️ The sheet proposed "DR-22"; that id was
  already the GR register.

## The outline of record — BUILT (S235, CPL layer S238)

`#outline/<id>`, six layers, `tests/ccr_skyview_outline.test.js` (50 checks).
⭐ **The description is CHOSEN, never written** — the medoid member catalog
description, quoted and attributed. Sam's MAP-Generated sentence prints verbatim.
⭐ **Two level axes, neither derived** — the course's off its title, a skill's
off its own words. ⚠️ **Confidence is agreement BETWEEN colleges**: a course
carried by ONE college reads "the only college teaching it", one with a single
catalog "the only college with a description". ⚠️ **Skill phrases need
punctuation-aware n-grams, longest-name-wins and the fold above.** ⭐ **A
reviewer may add a skill and take one out** — staged, nothing written. **The CPL
layer** lists every credential reaching the course with both agencies; an empty
layer states the ceiling in words rather than reading as finished.

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
⑧ **The globe prototype — keep or drop, on sight.** His ask of 2026-09-07
(*"a 3-d 360 globe that rotates"*), built as a throwaway outside the product:
`docs/visuals/2026-09-07-skyview-globe-prototype.html`, artifact https://claude.ai/code/artifact/51f5249d-1884-406d-889e-259b262b86e5. A globe shows a hemisphere at a time, so it adds no
area; a yes is a decision sheet (planetarium form, gestures on a curve, motion),
never a port of that file. Detail: [`skyview_backlog`](../../skyview_backlog.md) ①d.

⚠️ The Pages deploy prunes `docs/`, so a sheet is handed over as an artifact
link, never a github.io URL.

## NEXT

⓪ **The staged-to-move mark on a re-homed course** (v4 item 7, the last open
item of the governing review): after a move, the course's own dot and its row
say nothing about being staged rather than saved. The confirmation half shipped
in S237; this is the mark.
① **DR-24's write surface** — the curate phrase and the propose/second gate,
routed through Governance first (Rule 10 a3). ② The skills layer's fetch problem
(NEEDS SAM ①). ③ The rest of the queue:
[`skyview_backlog`](../../skyview_backlog.md), including the CPL face's smaller
asks (the 55 stale exhibits, the funnel sidecar refresh, a credentials column in
the workspace tables).
