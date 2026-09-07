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

## YOUR PRIORITY — unchanged for three runs

② **A CPL vs Course/Discipline toggle** — *"so the CPL exhibits and CRs are the
focus more than the Courses."*
③ **A show-articulations toggle on normal SkyView** — *"reveal to users where
existing artics are and where they differ for the same course college to
college."*

Sam asked for a **sketch before a build** on both, and called them closely
linked himself. ⭐ **RULED, so build to it:** the articulations toggle **lights
only what has a number** and leaves everything else drawn as it is — no gray, no
hollow, no "none" marker, because each reads as a finding. ⚠️ Only **1,490 of
49,896 points (3.0%)** carry an articulation count.

Then, still open: the **staged-to-move mark** on a re-homed course (the receipt
half shipped this run; the course's own mark still says nothing), the legend's
**`unified`** gloss, the outline's **skills layer** (a fetch problem — we hold
zero agency skill text), and the **curate phrase** (ruled, not built; Rule 10 a3
routes it through Governance first).

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
⑥ **New this run:** when curate starts writing, should a reviewer's added skill
carry their name, and should removing one need a second person? Same governance
step the curate phrase waits on.
⑦ **New this run:** the skill fold collapses hyphens and simple plurals. If two
genuinely different skills now read as one, or a surviving spelling looks wrong
to a welding instructor, the rule narrows.

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
`a-closed-details-still-measures`

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
