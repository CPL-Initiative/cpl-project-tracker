---
title: "Session 238 handoff — three defects fixed; the two CPL views are STILL unbuilt"
created: 2026-09-07
updated: 2026-09-07
tags: [handoff]
obsidian-folder: cpl-project-tracker/handoffs
---

# You are Session 238

Your moniker is **SkyFacet III**. The name has now carried three runs because the
priority it names — the map read as CPL rather than as courses — has been
displaced three times by defects Sam reported on the curation path. Predecessors:
SkyOutline S232 → SkyBuild S233 → S234 → SkyOutline II S235 → SkyFacet S236 →
**SkyFacet II S237** (this run).

## What this run did

Everything here is [PR #1505](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1505).
Sam reported three things; two more turned up while fixing them.

## ⭐ THE THING TO CARRY FORWARD

**A rule that is right for READING can be wrong for MOVING.** `pick()` gives an
open identity's member stars absolute priority over any circle they overlap —
S236 measured that (110 of 120 stars used to return the identity card) and it is
still correct. But the ring **spreads**, so the same rule ate the drop: with
*Introduction to Welding* open at 296%, **six identity circles inside the
viewport sat under one of its own stars**, and a drop on each resolved to the
identity the course was already in. `pick(px,py,forDrop)` resolves circles only
while carrying; reading is untouched (24 of 24 drawn stars still open the
course). KB note:
[`methodology-a-rule-that-is-right-for-reading-can-be-wrong-for-writing`](kb-notes/methodology-a-rule-that-is-right-for-reading-can-be-wrong-for-writing.md).

⚠️ **The report named the wrong variable.** *"No longer responsive after 2nd drag
and drop"* — and the second drag is fine. Eight consecutive panel drags, eight
stand-alone drags and four click-carries all landed. What varies is the
**destination**. Reproducing the literal report proves the code works and sends
you looking in the wrong place; the reproduction that mattered enumerated which
destinations were eclipsed.

⚠️ **A refusal that prints out of sight is a dead control.** `applyMove()` did
say *"That course is already there."* — in `#u-hint`, at the foot of the window.
And `#u-writes`, the record of staged moves, lives in `#u-below`, which
`body.u-solo` — SkyView, the default — does not paint at all. So the carry now
rings its destination and names it under the pointer, and the receipt no longer
points at a pane the reader cannot see.

## The other two, and the two found on the way

**② Duplicated skills.** `olWords()` keeps a hyphen inside a token, so
`flux-cored arc welding` is a 3-token phrase and `flux cored arc welding` a
4-token one. Over all **46,317** identities carrying a description: **209** rows
differed by a hyphen, **835** by a plural, **762 identities (1.6%)** showed a
pair. ⭐ **Fold the key at the COUNTING step** — the chip counts colleges, so a
college writing it both ways counts once and two spelling it differently count
twice; collapsing finished rows would keep whichever count was already wrong.
⚠️ `sses` had to be in the `-es` family or *processes* stems to *processe* and 19
pairs survive. Corpus-wide the sweep now finds **none**.

Curate gained **Add a skill** and **Remove**, both staged in the browser beside
the title and subject. A removal is an explicit `skillDrop` key and is
restorable — the imputation re-runs whenever a description lands, so storing
*what is left* would silently delete every skill that arrived since.

**③ Merged rows read white on the dark canvas.** `.mlist li.moved` painted a raw
`#EAF1E6`; four other rules were stranded the same way. The calibration is the
part worth keeping: the **light** tint is only 1.15:1 against the surface it sits
on, so the dark one was chosen to match at 1.13:1 rather than to be conspicuous.

**④ An outline opened by its own link had NO college courses.**
`buildMemberIndex()` ran only inside `__ccrUniverse`, so `#outline/<id>` — a
shared link or a reload, which is what the hash routing exists for — produced an
outline whose every layer read "none". `ensureCorpus()` now binds the payload for
whichever view is entered first. ⚠️ This is why the skills layer could not be
verified in a browser at first; it looked like an empty corpus.

**⑤ A CLOSED `<details>` STILL MEASURES.** `npm run a11y` reported *"10 focusable
with no ring"*; every one was a `Remove` button inside the collapsed *Named by a
single college* section. Chromium hides that content with content-visibility, not
`display:none`, so the rect is real while `focus()` is a no-op. `scripts/a11y.js`
now OPENS the sections for the focus pass and puts them back — skipping them
would have traded a false positive for a coverage hole.

## Verified — in Chromium, not just jsdom

- Six eclipsed destinations enumerated with `__ccrMemberPoints()`; all three
  tested drops moved nothing before, all land now.
- Reading unchanged: 24 of 24 drawn stars open the college course.
- Skill fold re-measured over the whole corpus after the change: **0** duplicates.
- `npm run a11y skyview` — **all 8 routes pass** at 3 widths. ⚠️ The full a11y run
  reports **39 failures across 49 routes**, all pre-existing target-size findings
  on the **Fact Sheet and COBI** (inline links, email addresses, `sw-rec-tg`
  toggles) — identical counts before and after this run's change to the checker.

Suites: `ccr_skyview_drop_target` 14/14 (new) · `ccr_skyview_outline` 50/50 ·
`ccr_skyview_universe` 222/222 · `ccr_skyview_search_show` 130/130. The three key
guards are **mutation-tested** — reverting each fix reproduces the reported
symptom verbatim, including *"That course is already there."* and the two
spellings side by side.

⚠️ **CI failed the first time on `dependency map is STALE`** — a new test file
shifts line numbers in `kb/dependency_map.json`. Run
`python3 kb/_build_dependency_map.py` before pushing anything that adds a file.

## YOUR PRIORITY — the sketch is done and RULED. Build it.

Sam answered all eight items of
[`docs/visuals/2026-09-07-cpl-views-skills-and-curate.html`](visuals/2026-09-07-cpl-views-skills-and-curate.html)
**yes**, no follow-ups, one note. The two CPL views are no longer a sketch — they
are a specification. Read the lane's *eight rulings of 2026-09-07* section before
you start; the whole spec is there.

⭐ **THE CEILING IS THE RECEIVING COURSE, NOT THE MAP.** Only **8,979 of 206,702
rows (4.3%)** of MAP's credit funnel name a receiving college course, and that is
the sole join from a CPL row to a course identity. **The CPL view states its own
coverage on the surface**: *"1,490 of 6,388 exhibits reach a course on this map."*

⭐ **THE CPL FACE** leads with the curated credential → **issuing agency AND
training agency where they differ** → what it earns → the colleges holding it.
Search switches with the face. Sam's note: *"Will want all this included on the
COR and credential Exhibit"* — so the agencies go on the **course outline of
record** and the **credential Exhibit** too, not only the map.

⭐ **THE ARTICULATIONS TOGGLE SHOWS PRESENCE ONLY.** It lights what has a number
(1,490 of 49,896 points) and leaves the rest drawn as it is — no gray, no hollow,
no "none". ⚠️ **"Where they differ college to college" is NOT a map layer** — it
is four cases, in
[`kb/ccr_articulation_disagreements.json`](../kb/ccr_articulation_disagreements.json),
and two of those are data-quality defects. Do not rebuild that measurement from
the crosswalk; it reads ~165 there and the number is wrong.

⭐ **A CURATE EDIT IS PROPOSED, ATTRIBUTED, SECONDED TO PUBLISH** — now
**DR-24** in the governance register with **Sam as its named owner**, the first
owned row in it. An added skill carries the reviewer's name and the day it was
staged and lands `proposed`; a removal is symmetric and an unseconded one stays
visible with the objection beside it. Nothing writes from the page until DR-24's
surface ships. ⚠️ The sheet proposed "DR-22"; that id was already the GR register.

Then, still open: the **staged-to-move mark** on a re-homed course (the receipt
half shipped this run; the course's own mark still says nothing), the legend's
**`unified`** gloss, the outline's **skills layer** (a fetch problem — we hold
zero agency skill text), and the **curate phrase** (ruled, not built).

## NEEDS SAM

① Where agency skill statements come from when the three sources disagree
(ruling 9's follow-up; pilot is an AWS welding certification).
② The live-session banner — what link, which tabs?
③ Whether 60 is the right search depth; whether an emptied discipline vanishes
or ghosts.
④ The right-edge glyph rail from his Obsidian screenshot — his call under his
own glyph rule.
⑤ The three legacy anchors with no seed discipline (`M-ID HOSP 100`, `104`,
`102`) need one of the 146 MQ disciplines.
⑥ Whether to hold the **training agency** back until the field is fuller — he
said incomplete is fine for now, so it ships with the gap visible.
~~⑦ the curate-write governance question~~ — **answered**: DR-24, owner Sam.
~~⑧ the skill fold~~ — **answered**: stands as shipped.

## Housekeeping

- ⚠️ **The SkyView lane is 16.0 KB against a 12,000 B advisory budget (1.34×).**
  ~1 KB of shipped history moved to `ccr_atlas_lessons.md` this run and six
  invariants went in. A future compaction should take the **NEXT** list (2.7 KB
  of small backlog items) to its own note, **not** the invariants — each of those
  is there because a session already got it wrong.
- The description shards are gitignored and 404 in a fresh clone.
  `python3 kb/_build_ccr_universe.py --shards-only` builds them locally in ~2
  min, and **the outline is unreadable without them**.
- `npm test` in full takes longer than a 600 s tool timeout here; run the suites
  you touched and let CI run the rest. `npm install` is needed first — `jsdom`
  is not vendored.
- Browser verification is cheap: Chromium at
  `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, `playwright` at
  `/opt/node22/lib/node_modules/playwright/index.js` (a CommonJS default import,
  not a named one), `python3 -m http.server 8777` from the repo root. **Use it.**

## `cpl_memory` rows written this run

`a-rule-right-for-reading-can-be-wrong-for-writing` ·
`sam-three-skyview-defects-2026-09-07` (verified_by Sam) ·
`fold-a-name-where-you-count-it-not-after` ·
`a-closed-details-still-measures` ·
`sam-eight-rulings-2026-09-07-cpl-views-and-curate` (verified_by Sam) ·
`a-display-payload-is-not-the-root-of-the-data` (verified_by Sam)

⚠️ **SOURCE THE ROOT, NOT THE CONFIG** (Sam, 2026-09-07). The CPL measurements
were being taken from `kb/coci_articulations.json`, the crosswalk SkyView draws,
which holds **41%** of the root's exhibits and **29%** of its credit
recommendations. The root is **`public.map_college_cr_unit`** (206,702 rows).
Re-measuring changed the answers, not the precision.

KB note added:
[`methodology-a-rule-that-is-right-for-reading-can-be-wrong-for-writing`](kb-notes/methodology-a-rule-that-is-right-for-reading-can-be-wrong-for-writing.md).

## Read these first, in order

1. [`docs/reference/lanes/skyview-ccr-interface.md`](reference/lanes/skyview-ccr-interface.md)
2. [`docs/skyview_video4_findings.md`](skyview_video4_findings.md) — the governing
   review. ⚠️ `skyview_video2_findings.md` is a DIFFERENT, earlier recording
3. `tests/ccr_skyview_drop_target.test.js` — the drop model, as assertions

Then run **`python3 kb/doctrine.py --read <files>`** before concluding anything
from the data, and **query `cpl_memory` before you work** (Rule 8).

---

*Greetings, you are SkyFacet III (Session 238), see SkyFacet II's handoff —
`docs/session_238_handoff.md` — let's keep rolling with our queue.*
