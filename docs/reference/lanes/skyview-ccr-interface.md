---
title: "SkyView / the CCR curation interface — lane state"
created: 2026-08-28
updated: 2026-09-09
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

**S244 (2026-09-09).** Rotation `SPIN` 0.045→0.018; a dropped course PARKS;
courses gather by level on the ring score already chose (same-level pairs 19.9%
closer); **CTE vs academic** as three Show switches (25,857 · 16,470 · **7,569
with no verdict**); an **Isolate** toggle.

**S247/SkyLedger (2026-09-09), PR #1530 — the phone, and the question box.**
Header 254px → 114px at 390×844, map 62% → 86%; pinch zooms; a question in the
search box becomes a map selection. Desktop unchanged. Detail in the lessons doc.

**S249 (2026-09-09), PR #1532 — two defects Sam hit on his first real use.**
⭐ **Isolate emptied the map on a DISCIPLINE selection** — a `subject` token is
an ISLAND, not node hits, so `searchHits` was empty and `isoNodeOK` failed every
node while `isoActive()` and the button's `can` test both counted `selIsl`:
49,896/159 → 0/0, now 191/1 for Chemistry. ⭐ **The Ask answered 850px from the
box** — it ran and printed correctly into `#u-hint`, a 36px strip at the bottom
edge, so what Sam saw was only the sky stopping. It now also answers in a
`role="status"` panel inside the search FORM. Detail in the lessons doc.

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

`#outline/<id>`, six layers, `tests/ccr_skyview_outline.test.js`. ⭐ The
description is CHOSEN, never written (the medoid member catalog, attributed);
Sam's MAP-Generated sentence prints verbatim. ⭐ Two level axes, neither derived.
⚠️ Confidence is agreement BETWEEN colleges. ⭐ A reviewer may add a skill and
take one out — staged, nothing written.

## NEEDS SAM

① **DONE — `cpl-chat-deploy.yml` ran 2026-09-09** (run 34402962685, byte-verify
clean) on Sam's go, so `skyview-ask` is a known surface on the deployed function
and the question box is live end to end. `cpl-chat-smoke.yml` re-checked the four
search modes the same redeploy touched.
② **The live `sierra_guidance` CHECK constraint** does not yet allow
`skyview-ask`. The schema of record does. Not blocking — nothing in the feature
writes a guidance row — so it only matters to scope a Sierra rule to this surface.
③ **The opening width on a phone.** At 188° across on a 390px canvas the
discipline labels clip off both edges. Narrowing is a real improvement but
`NODE_ZOOM` decides per island whether courses draw at all, and the margin is the
point (see the invariant), so this is a ruling, not a sweep.

The eight of 2026-09-09 are all answered — sheet
`docs/visuals/2026-09-09-pending-decisions.html`, memory row
`sam-eleven-rulings-2026-09-09-decision-sheet`. They are work now, in NEXT.

⚠️ **"An emptied discipline stays DRAWN" is a BUILDER change, not a renderer
tweak.** `build_islands()` walks `all_discs`, so an emptied discipline is absent
from the payload and never reaches `islandPass`. Drawing it needs a roster to
emit from, a radius, and a ghost lifetime. ⚠️ Do **not** "fix" it in `islandPass`
— hiding an island whose points are all *filtered off* is deliberate and
`healShow` depends on it. Two different empties; only one is Sam's.

⚠️ The Pages deploy prunes `docs/`, so a sheet is handed over as an artifact
link, never a github.io URL.

## NEXT

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
