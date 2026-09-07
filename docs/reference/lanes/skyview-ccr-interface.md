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
> [archive](../../ccr_atlas_lessons_archive.md).
>
> ⚠️ **Compacted 2026-09-06 (S234, S235) and again 2026-09-07 (S237).** It is
> **16.0 KB against the 12,000 B advisory budget** and the excess is invariants,
> not narrative: S237 added six and moved ~1 KB of shipped history to the lessons
> doc. A future compaction should take the **NEXT** list (2.7 KB of small
> backlog items) to its own note, not the invariants — each of those is here
> because a session already got it wrong once.

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
keyboard path. Since S235 a course also opens its **outline of record**. Rounds
and measurements: [`ccr_atlas_lessons`](../../ccr_atlas_lessons.md).

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
window controls).

⚠️ **The page must be SERVED, not opened** — `file://` blocks the payload fetch.
The layout is hand-built (`kb/_build_ccr_universe.py`, ~20 s) and committed; the
harness needs the gitignored shards (`--shards-only`). Descriptions live in the
public Supabase bucket `ccr-desc`, 159 shards / 50 MB, ordered by
`location.hostname` so the deployed page never tries the local base.

⚠️ **The daily run rebuilds the decision payload AND `skyview.html` with it** —
the atlas payload is INLINE in the served page, so regenerating the JSON alone
never reaches the deployed page. `ccr_universe.json` is deliberately untouched.

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
in the `-es` family or *processes* stems to *processe*.

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
a11y`. A `height === 0` guard does not catch it; the script skips them now.

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
none of v4's rulings. Six of v4's eight items shipped in #1502/#1503. **Open:**
a rehome gives the course no *staged-to-move* mark (the confirmation line already
renders — frame 17 — so the fix is the mark, not the message); and the legend's
`unified` carries no gloss while every other entry does. **Do not build**
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
open the college course. Skill duplicates across the whole corpus: **209 rows by
a hyphen, 835 by a plural, 762 identities (1.6%)** before; **none** after.

**Praised, do not break:** Fit all; the panel moving to the selection.

## Sam's eight rulings of 2026-09-06 (decision sheet) — 3 built, 5 recorded

All eight answered **yes**, no edits, no follow-ups
(`cpl_memory` `sam-eight-rulings-2026-09-06-outline-sheet`). Built in S235: text
zoom, **"the only college teaching it"**, a `.gitattributes`. **Recorded, not
built:** the skill-source precedence, the articulations toggle's treatment of
absence, the curate phrase's scope, **no nightly layout rebuild**, and
**Interdisciplinary Studies is a grab bag** (525 identities against 1,263
stand-alones). His three earlier rulings of the same day all shipped. What they
cost to build, and the two traps inside them, are in
[`ccr_atlas_lessons`](../../ccr_atlas_lessons.md).

## The outline of record — BUILT (S235)

`#outline/<id>`, six layers, `tests/ccr_skyview_outline.test.js` (50 checks, key
guards mutation-tested). **Invariants, not history:**

⭐ **The description is CHOSEN, never written** — the medoid member catalog
description, quoted and attributed. Composing prose out of several catalogs would
read as authoritative while belonging to nobody. Sam's MAP-Generated sentence
prints verbatim.
⭐ **Two level axes, neither derived** — the course's off its title, a skill's
off its own words.
⚠️ **Confidence is agreement BETWEEN colleges**, and "one college" means opposite
things by context: a course carried by ONE college reads **"the only college
teaching it"** (complete evidence), one that merely has a single catalog reads
**"the only college with a description"**. The distinction is the MEMBER count.
⚠️ **Skill phrases need punctuation-aware n-grams, longest-name-wins and the
fold above.** **94.6% of member courses carry a description, but only 30.0% of
identities have 2+**, so each outline states its own evidence.
⭐ **A reviewer may add a skill and take one out** — staged in the browser beside
the title and subject, nothing written.

## NEEDS SAM

① **Where agency skill statements come from when the three sources disagree**
(ruling 9's follow-up — published standards *and* ACE exhibits *and* the MAP
team; he said "All three"). Pilot: an AWS welding certification. **This is the
only thing blocking the outline's skill layer**; everything else is buildable.
② Should the daily run rebuild the universe layout too?
③ Which disciplines are grab bags besides Vocational and the no-discipline pile?
Interdisciplinary Studies (513 identities) is the candidate.
④ The live-session banner — what link, on which tabs?
⑤ The three legacy anchors without a seed discipline (`M-ID HOSP 100`, `104`,
`102`) need one of the 146 MQ disciplines.
⑥ Whether 60 is the right search depth, and whether an emptied discipline should
vanish or ghost.
⑦ The right-edge vertical glyph rail from his Obsidian screenshot — glyph-only,
so his call under his own glyph rule.

⚠️ The Pages deploy prunes `docs/`, so a sheet is handed over as an artifact
link, never a github.io URL.

## Sam's eight rulings of 2026-09-07 (decision sheet) — ALL YES, one note

Sheet: `docs/visuals/2026-09-07-cpl-views-skills-and-curate.html`. Every figure on
it came from **MAP's own credit funnel** (`map_college_cr_unit`), not from the
resolved crosswalk this map draws — Sam, mid-session: *"make sure you're source
the root of the data and not config for this work."* The crosswalk holds 41% of
the root's exhibits and 29% of its credit recommendations.

⭐ **THE CEILING IS THE RECEIVING COURSE, NOT THE MAP.** Only **8,979 of 206,702
rows (4.3%)** name a receiving college course, and that is the sole join from a
CPL row to a course identity. 1,490 of 6,388 exhibits reach a point on the shipped
map. **The CPL view says its own coverage on the surface** — one line, *"1,490 of
6,388 exhibits reach a course on this map"* — because a view that quietly shows a
quarter of the record looks like the record.

⭐ **THE ARTICULATIONS TOGGLE SHOWS PRESENCE. "WHERE THEY DIFFER" IS NOT A MAP
LAYER** (ruling 2). ⚠️ Measured three ways and the first two were wrong: differing
recommendation TEXT per exhibit gives 2,834 and differing HOURS per exhibit gives
678, but **both count an exhibit's own tiered menu as a disagreement** — ACE writes
*3 / 6 / 9 hours in air traffic control* on one exhibit and a single college holds
all three lines on one course in one catalog year. Presence in the funnel is not a
decision; `cpl_status_plan` is. Restricted to rows that name a course AND were
acted on: **four**, and two of those are data-quality defects. They are a receipt,
not a layer: [`kb/ccr_articulation_disagreements.json`](../../../kb/ccr_articulation_disagreements.json).
⚠️ NOT written to `map_cleanup_worklist` — that table's grain is per COLLEGE and
these are per EXHIBIT, and a first write to it is a new write surface.

⭐ **THE CPL FACE LEADS WITH THE CREDENTIAL, THEN THE AGENCIES** (ruling 3 + his
note). Curated credential name → **issuing agency AND training agency where they
differ** → what it earns → the colleges holding it. Search switches with the face.
Points with no exhibit stay drawn and unlabeled, the same rule as the toggle.
Sam: *"If we can also include the issuing and training agencies, it would be good.
We know that the data are incomplete now, which is OK for now. Will want all this
included on the COR and credential Exhibit"* — so the agencies belong in the
**course outline of record** and on the **credential Exhibit**, not only on the map.

⭐ **THE SKILL FOLD STANDS AS SHIPPED** (rulings 4-5). 2,756 families over 46,317
identities, 4,360 rows; all 39 families touching a word whose singular means
something else (*athletics*, *graphics*, *ethics*, *physics*) pair real variants of
one name, none merged two skills. If a pair ever reads as two things, it goes on a
short do-not-fold list rather than weakening the stemmer.
⚠️ **A grouping key can be a non-word and that is not a bug** — *news stories* keys
as `new story`, *series solutions* as `sery solution`, *mechanics' lien* as
`mechanic lien`. The key is NEVER shown; the card displays a spelling a college
published. It would only bite if one card carried both senses of such a word, which
does not occur today.

⭐ **A CURATE EDIT IS PROPOSED, ATTRIBUTED, AND SECONDED TO PUBLISH** (rulings 6-8),
now **DR-24** in the governance register with **Sam as its named owner — the first
owned row in the register**. ⚠️ The sheet proposed "DR-22"; that id was already the
GR register, so the row landed as DR-24. An added skill carries the reviewer's name
and the day it was staged and lands `proposed`, visible at once to its author and to
curators, joining the published outline on a second curator's agreement. A removal
is symmetric: immediate and reversible in the reviewer's own view, seconded to leave
the published outline, and an unseconded removal stays visible with the objection
beside it. Nothing writes from the page until DR-24's surface ships.

## NEXT

⓪ **CPL-focused view + show-articulations toggle (Sam, 2026-09-06).** Two
closely-linked asks, both to be prototyped first: (a) a **CPL vs
Course/Discipline toggle** so *"the CPL exhibits and CRs are the focus more than
the Courses"*; (b) a **show-articulations toggle**. ⭐ **RULED**: the toggle
**lights only what has a number** and leaves the rest drawn as it is — no gray,
no hollow, no "none" marker, each of which reads as a finding. ⚠️ Only **1,490
of 49,896 points (3.0%)** carry an articulation count, so marking absence would
claim something about 48,406 points the data cannot support.

⚠️ **The rest of the queue moved out on 2026-09-07** — the skills layer's fetch
problem, the curate phrase, the re-mint approval queue, decision packs, the
SUBJ4-inconsistent drag, the shared control numbers, the rim description signal
and the rest: [`docs/skyview_backlog.md`](../../skyview_backlog.md).
