---
title: "SkyView / the CCR curation interface — lane state"
created: 2026-08-28
updated: 2026-09-06
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
> ⚠️ **Compacted 2026-09-06 (S234, again S235)** to fit the 12,000 B budget.
> Nothing dropped — the round narratives are verbatim in the lessons doc.

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

⚠️ **RESOLVE A STORED ID THROUGH `kb/alias_chain.py` BEFORE COMPARING IT TO THE
LIVE SET — and the live set is the CATALOG, not the browser payload.**
`unified_courses_data.js` ships 16,480 of 76,008 rows, so "not in the payload"
read as "dead" over-reported it fourfold. `ALIAS_MAPS` is a list of **paths**:
call `load_maps()` first or `resolve_id()` resolves nothing and does not error —
the tell is direct and chain agreeing EXACTLY.

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

## Measured in a browser — the durable warnings

Both defects from Sam's 2026-09-06 recording are FIXED. What must not be lost is
how they were MIS-READ; the round-by-round is in
[`ccr_atlas_lessons`](../../ccr_atlas_lessons.md) and the reusable lesson in
[`methodology-a-correct-measurement-can-name-the-wrong-place`](../../kb-notes/methodology-a-correct-measurement-can-name-the-wrong-place.md).

⚠️ **IT IS `.sugwrap` THAT WRAPS, NOT `#u-bar`.** The triage named `#u-bar`
30 → 76px; the real ancestor chain shows `#u-bar` **unchanged** and
`.u-search-slot .sugwrap` going 30 → 66, which pushes `#sug` 40 → 76. A
`min-height` on `#u-bar` would have read as a fix and changed nothing.
⚠️ Chip tightening is bounded by **target size, not contrast**: `.u-tok-x` 24×24
and `.u-tok-go` min-height 24px are on the WCAG 2.2 SC 2.5.8 AA floor.
⭐ **That wrap can no longer fire WHILE THE READER IS PICKING** — deferring the
commit means no chip exists until Enter, and by then the list is shut. Measured
in Chromium at 1440px, four consecutive ticks: `#u-bar` 30 → 30, `#sug` top
75.0 → 75.0, 60 → 60 rows. The layout finding above still holds for chips that
land; it is the *selection* path that no longer reaches it.

⚠️ **THE PICKS DIED ON THE WAY OUT.** `homeSearch()` called `clearTokens()` and
`setCrumbs()` calls it on every view entry, so `__ccrTokenKeys()` already read
`[]` on the work surface. Diagnosing the return path would have fixed nothing.

⚠️ **Sam RETRACTED a finding on camera** — that passage is S233's hover fix
working. **Read a recording to the end before fixing anything.**

**Praised, do not break:** Fit all; the panel moving to the selection.

## Sam's eight rulings of 2026-09-06 (decision sheet) — 3 built, 5 recorded

All eight answered **yes**, no edits, no follow-ups
(`cpl_memory` `sam-eight-rulings-2026-09-06-outline-sheet`). Built in S235:
**text zoom** (three steps 0.85/1/1.25, per-browser; ⚠️ NOT a slider — the label
placer drops what it cannot fit, so past a size the map goes quiet rather than
crowding, and the collision boxes scale WITH the text or the placer accepts
labels that then overlap; measured, the map's own zoom holds at 0.10043 across
all three steps); **"the only college teaching it"** where a course is carried by
one college (⚠️ the MEMBER count, not the description count — `total` in
`olConfWord` counts colleges that publish a catalog, so the two cases say
different things); and a **`.gitattributes`** with its ten files renormalized.
Recorded, not built: the skill-source precedence, the articulations toggle's
treatment of absence, the curate phrase's scope, **no nightly layout rebuild**,
and **Interdisciplinary Studies is a grab bag** (525 identities against 1,263
stand-alones).

## Sam's three earlier rulings, 2026-09-06 — shipped

Enter closes the search panel; double-click opens the course outline; the chip
row reserves its space. Sort control at the list's top right, Enter button at
the bottom, `markSug` addressing rows by `id` because the header is a child of
the listbox. Detail: [`ccr_atlas_lessons`](../../ccr_atlas_lessons.md).

## The outline of record — BUILT (S235)

`#outline/<id>`, six layers, `tests/ccr_skyview_outline.test.js` (31 checks,
key guards mutation-tested). **Invariants, not history:**

⭐ **The description is CHOSEN, never written** — the medoid member catalog
description, quoted and attributed. Composing prose out of several catalogs
would read as authoritative while belonging to nobody. Sam's MAP-Generated
sentence prints verbatim.
⭐ **Two level axes, neither derived** — the course's off its title, a skill's
off its own words.
⚠️ **Confidence is agreement BETWEEN colleges**, and "one college" means
opposite things by context: a course carried by ONE college reads **"the only
college teaching it"** (complete evidence), one that merely has a single catalog
reads **"the only college with a description"**. The distinction is the MEMBER
count, not the description count.
⚠️ **Skill phrases need punctuation-aware n-grams and longest-name-wins** — the
defects and their fixes are in the lessons doc. **94.6% of member courses carry
a description, but only 30.0% of identities have 2+**, so each outline states
its own evidence.

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

## NEXT

⓪ **CPL-focused view + show-articulations toggle (Sam, 2026-09-06).** Two
closely-linked asks, both to be prototyped first: (a) a **CPL vs
Course/Discipline toggle** so *"the CPL exhibits and CRs are the focus more than
the Courses"*; (b) a **show-articulations toggle**. ⭐ **RULED**: the toggle
**lights only what has a number** and leaves the rest drawn as it is — no gray,
no hollow, no "none" marker, each of which reads as a finding. ⚠️ Only **1,490
of 49,896 points (3.0%)** carry an articulation count, so marking absence would
claim something about 48,406 points the data cannot support.

① **The outline's skills layer — UNBLOCKED, now a fetch problem.** Ruling 1
settles the precedence: **published agency standard is the text of record; an
ACE exhibit fills a gap it leaves and never overrides it; the MAP team overrides
either, attributed and dated**; a genuine conflict shows **both, each named**.
⚠️ We hold none of that text — 1,987 credentials classified, 64 welding, **zero
carrying a skill field**. Pilot: an AWS welding certification.

①b **The curate phrase — ruled, not built.** **One phrase gates anything that
leaves the browser**; reading stays open. ⚠️ First write from this surface, so
Rule 10 a3 routes it through Governance and the privacy ADRs before it ships.

② **The re-mint approval queue** — routed through Governance
([`adr-remint-approval-queue-decision-rights`](../../kb-notes/adr-remint-approval-queue-decision-rights.md)),
not built: a register row owning the approval, the surface mapped in
`kb/governance_surface_map.json` at the first write, INSERT-only rollback, a
test asserting it writes approvals and nothing else.
③ **Decision packs per discipline, fetched on demand** — the bottleneck behind
every UI tweak; the shards' publish path is the template.
④ The drag that leaves SUBJ4 inconsistent queues a re-mint candidate — proposes,
never auto-adds.
⑤ The 73 two-real-course control numbers · the member-roster fold at source
(`CaÃ±ada College` ×678) · accept-all-orbits-above-a-score · the 67 `ESOL Z####`
rows and `FIMS M1018` (needs an un-merge verb) · a tool for the 3,001 with no
discipline.
⑥ **A description signal for the rim** — 1,600 of 2,073 rim courses have a
description; TF-IDF places ~130 well and agrees with the title-based parent only
20% of the time. A gap-filler that never outvotes a title.
⑦ Dropdown labels that name the grain on the CCR tab.
⑧ **After the fold:** the promote step is BUILT (`kb/_uc_cur_promote.py`); seven
held rows move on a second signal; the identities map's ghost keys have a dry run
and a receipt awaiting Sam's sheet.
⑨ Identity-level chips once members are classified.
