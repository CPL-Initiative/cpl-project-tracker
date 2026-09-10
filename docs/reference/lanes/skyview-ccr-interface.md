---
title: "SkyView / the CCR curation interface — lane state"
created: 2026-08-28
updated: 2026-09-10
tags: [reference, roadmap-lane]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference/lanes
related:
  - "[[CLAUDE]]"
---

# SkyView / the CCR curation interface

> **Always-current lane state, not an archive.** The shipped history — every
> round, every measurement, every wrong reading — lives in
> [`ccr_atlas_lessons`](../../ccr_atlas_lessons.md) and its
> [archive](../../ccr_atlas_lessons_archive.md); the queue behind the priority is
> [`skyview_backlog`](../../skyview_backlog.md).
>
> ⭐ **COMPACTED 2026-09-09, from 33,041 B (2.75× budget) to under it.** Three
> checkpoints had deferred this as "worth its own sitting". Every invariant was
> KEPT as a rule; what left was its derivation — the fps numbers, the session
> archaeology, the verbatim quotes restating the rule beside it — all of which
> the lessons doc already holds, dated. **Do not re-inflate a rule with its
> evidence.** If an invariant needs its story, the story goes to the lessons doc
> and a pointer comes back.

**What this lane is:** An interactive view of the Common Course Reference —
common courses by discipline, their constituent local courses, and moving a
course to where it belongs. **"SkyView" is the map ALONE, filling the window**
(Sam, 2026-08-24, tightened 2026-09-05); the map with its panes is **the
comprehensive view**, and the discipline table, the subject table and the ESL
card are the **workspace** (*Disciplines and subjects*), a tab of their own. The
lane also carries the **re-mint series** — the CSR's codes key SkyView's islands.

## Status

✅ **Built and stable.** Sam's five goals are met: the whole universe on one
canvas (16,482 identities, 33,423 stand-alone courses, 159 islands); keyword jump
to anything; hover is a quick look and click the docked inspector; every
stand-alone orbits its best-matching identity; drag and drop is real with a
keyboard path. **`#skyview` OPENS AS THE SKY** since S239 — **Sky · Globe** as
places to stand on ONE canvas. A course opens its outline of record (S235); a
staged move is marked on the course itself (S239).

**Current behavior worth knowing before you touch it:** rotation `SPIN` 0.018; a
dropped course PARKS; courses gather by level on the ring score already chose;
**CTE vs academic** is three Show switches (25,857 · 16,470 · **7,569 with no
verdict**); **Isolate** is a toggle; the phone header is 114px at 390×844 (map
86%) and pinch zooms; a question typed in the search box becomes a map selection
AND answers in a `role="status"` panel inside the search form.

⚠️ Session-by-session narrative for all of the above lives in
[`docs/ccr_atlas_lessons.md`](../../ccr_atlas_lessons.md) — this file states
current truth, so do not re-inflate it with a log.

## Invariants — in their own file

⚠️ **[`docs/reference/skyview_invariants.md`](../skyview_invariants.md) — READ
IT BEFORE TOUCHING THE CODE.** Around forty rules, each written because a session got it
wrong once, grouped as: the payload and the model · building and serving · the
window, the row and the canvas · pointer, touch and the turn · the sphere ·
labels and the frame budget · search, the ask and the lists · the outline, the
skills and the CPL face. They moved out of THIS file on 2026-09-09 because they
are reference, not state — but a store nobody names is a store nobody finds, so
this pointer is the safety mechanism, not a courtesy.

The ones most often needed first: the canvas height is **JS-owned** by
`fitCanvas()` and CSS cannot take it; `npm test` proves **nothing** about layout
*and* does not run the dependency-map check; the served page inlines
`ccr_universe.js`, so a JS change needs `prototype/build_ccr_atlas.py`; and
**nothing the model names is trusted as a key** on the ask path.

## The outline of record — BUILT (S235, CPL layer S238)

`#outline/<id>`, six layers, `tests/ccr_skyview_outline.test.js`. ⚠️ **Its invariants moved to**
[`skyview_invariants.md`](../skyview_invariants.md) **at the S251 checkpoint** — the
consolidated description that names no college, complete-link at Dice 0.3, the
administration strip, placeholder text, and C-ID/CCN being unhandled. **Read them
before touching the outline**; they are the kind of rule you only look up once you
already suspect it, which is why the pointer is here.

## NEEDS SAM

① **What the statewide exhibits are FOR.** His 2026-09-10 ask cut off at *"shown
visibly on the sky so folks can easily see…"*. The data side is done (`sw` on all
84); the treatment depends on the rest of the sentence — see which are statewide,
see what a college could adopt, or see where they are already in use.
② **The live `sierra_guidance` CHECK constraint** does not yet allow
`skyview-ask`. The schema of record does. Not blocking — nothing in the feature
writes a guidance row — so it only matters to scope a Sierra rule to this surface.
③ **The opening width on a phone.** At 188° across on a 390px canvas the
discipline labels clip off both edges. Narrowing is a real improvement but
`NODE_ZOOM` decides per island whether courses draw at all, and the margin is the
point (see the invariant), so this is a ruling, not a sweep.

⚠️ **"An emptied discipline stays DRAWN" is a BUILDER change, not a renderer
tweak.** `build_islands()` walks `all_discs`, so an emptied discipline is absent
from the payload and never reaches `islandPass`. Drawing it needs a roster to
emit from, a radius, and a ghost lifetime. ⚠️ Do **not** "fix" it in `islandPass`
— hiding an island whose points are all *filtered off* is deliberate and
`healShow` depends on it. Two different empties; only one is Sam's.

⚠️ The Pages deploy prunes `docs/`, so a sheet is handed over as an artifact
link, never a github.io URL.

## NEXT

⭐ **CPL MODE IS A SECOND UNIVERSE, NOT A RELABELLING — Sam's ruling, 2026-09-10,
his words:** *"Instead of courses, it groups exhibits in discipline groupings
like the course view but relies on the CER titles to show Exhibits like we show
the courses — as entities. So a Firefighter 1 Exhibit would be like a MID
grouping showing all the local exhibits as members of the group as if they were
courses. Then we would show the course(s), perhaps on the exhibit cards, that
have CPL based on the exhibit… It's like another universe where the entities are
exhibits rather than courses, but just like in course view, circles around the
exhibits can indicate that courses are articulated to them."*

This is not the shipped CPL face, which renames the same points. It is a second
payload with the same shape as `ccr_universe.json`: **CER canonical titles as
identities, local MAP exhibits as their members, disciplines as islands, and a
ring where a course articulates to the exhibit.** ⚠️ `prototype/ccr_cpl.json` is
keyed the INVERSE way — course identity → credentials — so it cannot be reused
directly; the builder is a new one. Lane-sized, not a session's work.

✅ **BUILT (S251)** — `kb/_build_ccr_cpl_universe.py` → `prototype/ccr_cpl_universe.json`
(0.36 MB), rebuilt by the daily cron beside its siblings, guarded by
`tests/ccr_cpl_universe_test.py` (25 checks). **1,987 exhibit identities folding
3,813 local exhibits in 97 islands · 1,603 with a ring · 534 grouped / 1,453
singleton · 84 statewide, all articulated · 543 in the pile.**

**The CER supplies every axis**, so the builder reads one file: `ut` the identity,
`raw_variants` the members, `disc_modal` the island, `n_articulation_lines` the
ring, `issuer`/`issuers`/`trainer` the agencies, plus `statewide` and `cpl_types`.

⚠️ **Read agencies from the CER, NEVER the crosswalk's inlined `issuing_agency`** —
a 2026-05-21 snapshot wrong on 1,743 of 4,592 records. Asserted at RUNTIME by
recording what the build opens, because the first version of that check grepped
the source and failed on the builder's own comment saying not to read it.
⚠️ **Never mix in the credit funnel's exhibit count** — it and the articulation
feed share 570 ids. A coverage line takes both numbers from one universe.

✅ **SAM'S TWO SHAPE RULINGS, 2026-09-10** — each pinned by a check:
- **A singleton draws as any other identity, a group of one.** 73% of CER titles
  (1,453 of 1,987) hold exactly one local exhibit; the Firefighter-1 case he
  described is the 534 that genuinely group (257 pairs, 118 with six or more,
  max 31). Courses mode already draws 3,217 single-satellite identities so.
- **The 543 with no discipline SHIP as a visible island**, not a blocked build.
  ⚠️ There is no mechanical route to a discipline for them: TOP recovers 4 (and
  Rule 7 bars TOP as a primary discipline call regardless), issuer recovers 11
  (42 issuers are discipline-mixed against 19 unanimous). 159 are articulated,
  so they are live points. A curator pass, never an inference.

⚠️ **THE LAYOUT IS IMPORTED, NEVER COPIED.** `layout_island`/`build_islands` take
a `point_fn` (default `point_of`, the course shape); the CPL builder passes an
exhibit shape. Two packers would stop agreeing about what a discipline looks
like — the reason `kb/alias_chain.py` is imported. Proven neutral: both universes
regenerate **byte-identical** on the same data under either code version.

⚠️ **`slug()` TRUNCATES AT 60 AND THAT COLLIDES CER TITLES.** It names a
description shard FILE, so it must not be widened; two Carpenters titles differ
only past the cut and merged into one entity on the first build. `ident_id()`
appends a digest of the exact title. ⚠️ The id derives from the TITLE, so a
rename re-mints it — safe while nothing stores a reference, but the first feature
that persists one needs a real surrogate key on the CER (Rule 7).

**NEXT: the view.** The payload is drawable; nothing draws it. Sam's statewide ask
(*"shown visibly on the sky so folks can easily see…"*, message truncated — the
rest is unanswered) is met on the data side: every statewide point carries `sw`.
At 84 points a permanent LABEL is affordable where 1,987 cannot be labeled.

⓪ **DR-24's write surface** — the curate phrase and the propose/second gate. The
register row exists with Sam as owner; the phrase's SCOPE is what is open.
① **The skills layer's fetch problem.** Unblocked by his ruling: use all three
sources, union them, *"err on the side of including anything possibly relevant,
as the faculty will revise and keep or toss."*
② **The blanks — RULED AND NARROWED: 93 → 86.** Five codes went into the subject
map (BSOT · HUMA · GRAF · BCST · BARB); HOSP is genuinely split four ways.
⚠️ **The remaining 86 are NOT fillable and the payload says so**: across their 45
codes, 37 have no other identity carrying that prefix and 6 read "unanimous" off
a SINGLE row. A **curator pass, never an inference**:
`kb/discipline_blanks_worklist.json`.
③ **The disagreements: 9 → 2, and neither survivor is a map problem.** Left:
**PHTO** (the map is right, its twelve courses mis-filed) and **ESLN** (③b's
rename). ⭐ All nine printed NOTHING until S243 — `standingHtml()` appended the
note to ONE of four exits.
⭐ **WHICH MECHANISM A CASE NEEDS IS ONE QUESTION — NOW IN DR-25**: does the MQ
list already carry the distinction? No → **umbrella**, mint codes. Yes and the
courses split → **fan-in**, one Common SUBJ, both names kept. Yes and they do not
→ a plain **correction**. ⚠️ Asking it re-sorts cases. A real MQ discipline
carrying NO courses folds into its parent through `kb/discipline_aliases.json`.
⚠️ **ATHL IS AN UMBRELLA CODE, NOT A KINE VARIANT** (Sam, 2026-09-08) — 1,468
M-IDs, and the Phase 1e fold was caught re-keying them once. Now declared in the
CSR (`is_umbrella`), which survives a reseed and a Supabase sync.
③b ⚠️ **EIGHT MQ DISCIPLINE NAMES CARRY A TITLE 5 SECTION NUMBER** — an
extraction artifact, not a vocabulary question. 45 live rows but **1,183
occurrences across 33 files**. **An id-keyed corpus change: its own dry-run,
alias map and receipt, in a separate PR.**
④ **Grab bags** — vocational, work experience, interdisciplinary studies, and the
no-discipline pile. None may vote in a modal decision; today they all do.
⑤ **Legacy anchors: RETIRE** (`M-ID HOSP 100`, `104`, `102`) — id-keyed, so a
re-mint under [`coursecontrolnumber_remint.md`](../../coursecontrolnumber_remint.md).
⑥ **The frame budget, if Sam still sees it step.** The remaining named JS is the
per-node loop (14%) and the island loop (10%) — the irreducible walk. **Fewer
points per frame is the lever that has worked three times running.**
⑦ The rest of the queue: [`skyview_backlog`](../../skyview_backlog.md).

⚠️ Whatever changes, the drop test, the keyboard path and `npm run a11y skyview`
run again in the same PR — and `scripts/check_generated.sh` LAST before a push.
