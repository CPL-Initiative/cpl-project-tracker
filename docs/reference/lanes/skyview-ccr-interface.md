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

**S244 (2026-09-09).** Rotation `SPIN` 0.045→0.018; a dropped course PARKS;
courses gather by level on the ring score already chose (same-level pairs 19.9%
closer); **CTE vs academic** as three Show switches (25,857 · 16,470 · **7,569
with no verdict**); an **Isolate** toggle.

**S247/SkyLedger (2026-09-09), PR #1530 — the phone, and the question box.**
Header 254px → 114px at 390×844, map 62% → 86%; pinch zooms; a question in the
search box becomes a map selection. Desktop unchanged. Detail in the lessons doc.

**SkySight (2026-09-09), PR #1532 — two defects Sam hit on his first real use.**
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

`#outline/<id>`, six layers, `tests/ccr_skyview_outline.test.js`.

⭐ **The description is CONSOLIDATED and NAMES NO COLLEGE** (Sam, 2026-09-10:
attributing one college's wording *"could lead to division as some faculty may
question the choice"*). The unit is the SENTENCE, so nothing is composed; the
selector is agreement, not typicality; what only some add sits under *Some
colleges also include* with its count. ⚠️ **COMPLETE-link at Dice 0.3, never
single-link** — single-link chains and reports agreement no two colleges have.
⚠️ **Ordered by position in the source, not by support.** ⚠️ **The catalog's
administration is stripped FIRST and is the most-agreed text in the corpus**; a
numeric heading is stripped and its sentence KEPT, a prose-valued key takes its
sentence with it. ⚠️ **Placeholder text never enters a derived layer** — marked
in the member lists, never in the quote or the imputed skills. ⚠️ **C-ID/CCN:
NOT HANDLED and the card says so** — MAP holds the designation, not the
descriptor text (541 identities); loading them is a data feed, not a rendering
change. Every measurement:
[`methodology-consolidate-sentences-not-documents`](../../kb-notes/methodology-consolidate-sentences-not-documents.md).

⭐ Sam's MAP-Generated sentence prints verbatim. ⭐ Two level axes, neither
derived. ⚠️ Confidence is agreement BETWEEN colleges. ⭐ A reviewer may add a
skill and take one out — staged, nothing written.

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

⭐ **THE CER ALREADY CARRIES EVERY AXIS — measured 2026-09-10 on the CER the cron
regenerated at 13:40.** `credential_reference_data.js` `unified_titles` supplies
all four: `ut` the identity, `raw_variants` the members, `disc_modal` the island,
`articulations`/`n_articulation_lines` the ring, and `issuer`/`issuers`/`trainer`
the agencies. **1,987 identities · 3,813 member variants · 96 disciplines · 1,603
carrying an articulation (81%) · six CPL types · 172 issuers (208 with `issuers[]`)
· 67 trainers.** ⚠️ The earlier figures here — *"3,124 exhibit rows, 135 issuing
agencies"* — were stale and are deleted; today's statewide feed carries 2,909
exhibits, a third number again, because these are different universes (see the
`cpl_memory` row `the-credit-funnel-and-the-articulation-feed-are-nearly-disjoint`).

⚠️ **TWO SHAPE FACTS DECIDE WHAT THE VIEW LOOKS LIKE, AND BOTH ARE SAM'S CALL:**

|            | singleton | grouped |
|---|---:|---:|
| **no discipline** | 442 | 101 |
| **has discipline** | 1,011 | 433 |

**73% of CER titles group exactly ONE local exhibit** (1,453 of 1,987), so the
Firefighter-1-with-its-variants case Sam described is the 534 that genuinely
group (257 pairs, 118 with six or more, max 31) — the rest would draw as a group
of one. And **27% have no discipline** (543), 81% of those also singletons, which
is a far larger blank pile than the course view's 86 of 16,480.
⚠️ **TOP CANNOT RESCUE THE BLANKS** — only 4 of the 543 carry a `top_modal`, and
Rule 7 forbids TOP as a primary discipline determination regardless. 159 of the
543 carry an articulation, so they are not inert.

⚠️ **Read agencies from the CER, never the crosswalk's inlined `issuing_agency`** —
it is a 2026-05-21 snapshot, wrong on 1,743 of 4,592 records (`cpl_memory`:
`the-crosswalks-inlined-issuer-is-a-stale-snapshot`).

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
