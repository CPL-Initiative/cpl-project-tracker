---
title: "SkyView / the CCR curation interface — lane state"
created: 2026-08-28
updated: 2026-09-19
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
> ⭐ **Compacted 2026-09-09 (2.75×) and 2026-09-10. Do not re-inflate a rule
> with its evidence** — the story goes to the lessons doc; a pointer comes back.

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

**Swept end to end:** `npm run sweep` drives the served page through every reader
and curator action (~200 checks) and passes. What it observed and did not change
is [`skyview_backlog` ⑩](../../skyview_backlog.md).

⚠️ **`prototype/skyview.html` IS GENERATED — edit `ccr_universe.js` (behavior and
markup) or `ccr_atlas_v1.html` (CSS), then `python3 prototype/build_ccr_atlas.py`.**
A hand-patch survives review and deploy and dies on the next rebuild; it did, on
2026-09-18 (#1618, reverted by #1617's rebuild within the hour). Guarded now by
`tests/skyview_built_from_source_test.py`, in CI and in `scripts/check_generated.sh`.
[`methodology-a-generated-file-accepts-your-edit`](../../kb-notes/methodology-a-generated-file-accepts-your-edit.md)

**A three-rung curation ladder (2026-09-18, #1625; widened 2026-09-19).** Sam
specified it across three messages: *"To position courses to merge needs at
least team code auth to do"*, *"magic link can do any of the three"*, *"Team
code or magic should be able to navigate to all links"*. On 2026-09-19 he named
the goal the ladder serves: *"allow public read only SkyView access but prevent
any actions to be taken that would edit or access views where edits could be
done."*

| Rung | Credential | Opens |
|---|---|---|
| 0 VIEW | the link alone | the map, search, details, the Ask, the course outline of record, How SkyView works |
| 1 STAGE | the team phrase | positioning a course; the comprehensive view, By discipline, By subject, ESL packaging, the decision surface, the outline's reviewer panel; the COBI and CCR-table links |
| 2 EXECUTE | a magic-link reviewer | Save, writing `kb_curation` |

⭐ **RUNG 0 IS NOW A DELIBERATE PUBLIC SURFACE, AND WHAT IT HOLDS WAS CHOSEN
RATHER THAN INHERITED.** Four views left it on 2026-09-19 because each reaches a
staging control: the comprehensive view embeds the forest, whose *Open this one*
opens the decision surface; the Disciplines table carries a **Decisions** button
into the same place; and **By discipline / By subject / ESL packaging share ONE
workspace shell with ONE mode bar**, so a reader let into ESL is one click from
the Disciplines table. Asked whether to gray them or hide them, Sam chose
**hide** — a rung-0 menu lists SkyView, How SkyView works, and one note naming
the remedy. The course outline of record STAYS open: it is reading matter, and
its reviewer panel carries the rung instead.

⚠️ **THE MENU WAS NEVER THE ONLY DOOR, AND GATING IT ALONE WOULD HAVE LOOKED
RIGHT IN A SCREENSHOT.** `#comprehensive`, `#disciplines`, `#subjects`, `#esl`
and `#work/<discipline>` are ordinary URLs — a shared link, a bookmark, a typed
hash or Back reaches them without the menu ever opening. `GATED_ROUTES` puts the
same question on `__ccrRoute()`, the one funnel every route passes; a refused
route lands on the map and says why. `refreshAuthChrome()` re-runs it when a
credential is lost, so a curator who signs out in another tab stops standing on
the Disciplines table. The suite asserts the two lists AGREE — a view given a
rung in the menu but left out of `GATED_ROUTES` is invisible on screen and is
exactly the hole.

⛔ **THE LADDER HAD A SECOND DOORWAY IN ANOTHER FILE, AND THE SINGLE-DECIDER
GUARD COULD NOT SEE IT.** `ccr_atlas_graph.js`'s `__ccrDecision` is a full
drag-to-move curation surface — *"Move any course to the identity it belongs
to"*, a drop target per circle, a Move button, a review-status selector — with
its own `moves[]`. It predates the ladder and lives in a different file, so
`curationRung()` never saw it, and `ccr_skyview_read_only.test.js`'s *"nothing
outside curationRung() decides authorization"* passed throughout **because it
only read `ccr_universe.js`**. The lesson generalizes: **a single-decider guard
is only as wide as the files it reads.** Fixed by exporting `window.__ccrRung`
and having graph.js ask it — one decider still — failing CLOSED when absent,
since the build refuses to write a page missing either file.

⚠️ **THE BAND NAMES THE CREDENTIAL, BECAUSE TWO RUNGS OPENED ON THE SAME WORDS.**
Rung 1 read *"**Read only.** Moves stage in this browser alone"* — rung 0's
sentence — so a curator who had just entered the phrase could not tell it had
taken. Sam, 2026-09-19: *"I just want to make sure that I can see on SkyView if
I am signed on with either magic link or team phrase AND if not, I want to see
clearly that I am in Read Only mode."* Each rung now leads with its own name
(**Read only** · **Team phrase** · **Magic link**), and the suite asserts the
three leads are DISTINCT rather than merely present.

⭐ **AND IT ANSWERS THE COBI HALF, WHICH IS ONE CREDENTIAL.** His other
uncertainty: *"I'm not sure if I'm also signed in on COBI main page."* `cpl_sb`
and `cpl_team_pass` are `localStorage` keys and `prototype/skyview.html` and
`index.html` are the **same origin**, so holding one here IS holding it there.
Rungs 1 and 2 say *"here and in COBI"*; rung 0 stays exactly as he read it on
screen and leaves COBI to the menu's one note.

⚠️ **THE PRE-JS BANNER HANDED EVERY READER A COBI DOOR.** The static
`u-ro-line` markup hardcoded `href="../index.html#unified-courses/list"` and
painted in the gap before `renderCurationLine()` ran — underneath the sentence
saying the reader was read only — so the Views-menu gate never applied to it.
Removed; the suite's assertion **inverted** from requiring that link to
forbidding any link in the shipped markup.

`curationRung()` is the ONLY place any of it is decided — the rungs moved twice
inside one conversation, and nothing else reads the storage keys. Its ranking
matches `nav_overlay.js`'s `AUDIENCE_RANK`, so rung 2 satisfying rung 1 falls out
rather than being special-cased. **Re-mint is NOT built**: Sam called it the
process *after* merge execution, and his 2026-09-05 ruling makes a re-mint view a
queue he approves, never a fire button.

Sign-in and the curation line live in the band inside `#u-full` — the only chrome
surviving both `body.u-solo` and browser full screen. ⚠️ The staged list
(`#u-writes`) is in `#u-below`, which solo HIDES, so a Save control there would be
invisible in the default view. The band's older sentence stays exactly true below
rung 2: nothing under EXECUTE sends anything anywhere, and Sam shared the page on
that sentence.

⚠️ **The rung gate is a convenience, not a boundary, and the code says so.**
Staging writes nothing, so gating it in the browser IS the mechanism; for EXECUTE
the button is a courtesy and `kb_curation`'s RLS is the real refusal. Withholding
a view or a COBI link removes the OFFER rather than the access — `pages.yml` serves
`prototype/` and COBI alike, so anyone holding an address walks in. 12 of the 29
Everyone-rung tabs render live internal data to a signed-out reader; closing that
is RLS or the [public/private split](public-private-repo-split.md).

Governance: `tab:skyview-merge-execution` → **DR-04**, the row already governing
`kb_curation` (Rule 10 a3). The dependency map now derives the same edge —
`prototype/ccr_universe.js` writes `kb_curation`, and all three phrase RPCs gain
both SkyView pages as readers.

**Current behavior worth knowing before you touch it:** rotation `SPIN` 0.018; a
dropped course PARKS; a drop that stages nothing ANSWERS (the
silent `fromNode` exit was the "stops responding on the second or third merge",
2026-09-18) and a staged course queues on its own arc against the parent circle,
labeled *staged, awaiting a curator*; courses gather by level on the ring score
already chose;
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
skills and the CPL universe. Moved out of THIS file on 2026-09-09 (reference, not
state); a store nobody names is a store nobody finds, so this pointer is the
safety mechanism.

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
`skyview-ask` (the schema of record does). Not blocking; it only matters to scope
a Sierra rule to this surface.
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

⭐ **CPL MODE IS A SECOND UNIVERSE, NOT A RELABELING** (Sam's ruling, 2026-09-10).
Exhibits grouped into discipline islands the way courses are, CER canonical titles
as the entities, local exhibits as their members, a ring where courses are
articulated to them. His words verbatim: `cpl_memory`
`sam-cpl-mode-is-an-exhibit-universe-2026-09-10`.

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

**Builder invariants are PULL** — the CER supplies every axis and agencies come
from it, never the crosswalk's inlined issuer; the credit funnel's count is never
mixed in; the layout is IMPORTED from the course universe; `slug()` truncates at
60 and `ident_id()` appends a digest; a singleton draws as any identity and the
543-credential pile ships visible (Sam's two rulings). Each is a check in
`tests/ccr_cpl_universe_test.py`; the story is the SkyLedger section of
[`ccr_atlas_lessons`](../../ccr_atlas_lessons.md).

✅ **THE VIEW SHIPPED (S252)** — the CPL word swaps the universe under the same
map (`bindUniverse` + a full re-render; hash · legend · Show menu · corpus · light
all this universe's). A credential's card lists the courses articulated to it,
each a door onto the Courses map, and the local exhibits folded in; a statewide
credential wears a second ring and the word on its label. Nothing moves there.
Members payload: `kb/_build_ccr_cpl_universe_members.py` (0.99 MB, cron beside
4d3b, `tests/ccr_cpl_universe_members_test.py`). Swept: `npm run sweep` §K + §R.
[invariants](../skyview_invariants.md#the-outline-the-skills-and-the-cpl-universe)

**NEXT: refine in prod.** Sam's statewide ask (*"shown visibly on the sky so
folks can easily see…"*, truncated) is met with the ring and the label word; a
PERMANENT label for the 84 is the next call (1,987 cannot be labeled, 84 can).
The 543-credential pile island draws as *(no discipline yet)*; the card caps the
course list at 40 and the members at a page. Ask SkyView still resolves against
the course vocabulary on the CPL map (the envelope's discipline list is the
same; the terms are not).

⓪ **DR-24's write surface** — the curate phrase and the propose/second gate. The
register row exists with Sam as owner; the phrase's SCOPE is what is open.
① **The skills layer's fetch problem.** Unblocked by his ruling: use all three
sources, union them, *"err on the side of including anything possibly relevant,
as the faculty will revise and keep or toss."*
② **The blanks — RULED AND NARROWED: 93 → 86.** Five codes went into the subject
map (BSOT · HUMA · GRAF · BCST · BARB); HOSP is genuinely split four ways.
⚠️ **The remaining 86 are NOT fillable and the payload says so** (37 of their 45
codes have no other identity carrying that prefix). A **curator pass, never an
inference**: `kb/discipline_blanks_worklist.json`.
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

⚠️ Whatever changes, `npm run sweep` and `npm run a11y skyview` run again in the
same PR — and `scripts/check_generated.sh` LAST before a push.
