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
> ⚠️ **Compacted 2026-09-06 (S234)** from 40,693 B to fit the 12,000 B lane
> budget. Nothing was dropped: the shipped-round narratives moved verbatim to
> the lessons doc. What stays here is what a session must not violate, what is
> waiting on Sam, and what is next.

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
stand-alone orbits its best-matching identity (31,515 placed, 1,908 on the rim,
1,375 crossing disciplines); drag and drop is real with a keyboard path. The
interface, the C-ID chip, the re-mint series, the prefix fold, the
curated-anchor worklist, the articulation counts, the search sort, the
membership glow, Similar courses, and Sam's six interaction rulings are all
shipped. Rounds and measurements: [`ccr_atlas_lessons`](../../ccr_atlas_lessons.md).

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

## Measured 2026-09-06 (S234) — from Sam's screen recording

Two defects found by driving the deployed map and measured in Chromium.
Full triage: [`skyview_video2_findings`](../../skyview_video2_findings.md).

⭐ **THE DROPDOWN DROPS A FULL ROW WHEN THE CHIP ROW WRAPS — AND RULING 3's FIX
IS NOT THE ONE THAT COVERS IT.** Picks 1-3 are rock solid; `scrollTop` holds at
300 exactly as designed. On **pick 4** the toolbar wraps: `#u-bar` 30 → 76,
`#sug` top 40 → 76, **every row moves down 36px — one row height**, so the row
under the pointer becomes a different row. `.u-tokens{display:contents}` makes
each chip a flex child of `#u-bar`. The shipped fix preserves the list's SCROLL
OFFSET; what moves is its POSITION ON SCREEN. ⚠️ **Guard it by VALUE** — assert
`#sug`'s `getBoundingClientRect().top` is unchanged across enough picks to force
the wrap (four at 1440px), never "the bar has one row".

⭐ **DOUBLE-CLICK STRANDS BECAUSE THE HASH NEVER CHANGES.** `discipline()`
paints over SkyView and never calls `syncHash()`: `location.hash` still reads
`#skyview` while the Welding workspace is on screen, so Back makes no history
entry, `hashchange` cannot fire, the Views menu disagrees with the screen, and a
refresh silently discards the work. Returning rebuilds the canvas from scratch,
losing every pick. ⚠️ **It is NOT a second page** — `skyview.html` hosts every
view; the masthead's stale "prototype v1" tag (line 714) is what makes a view
swap read as landing in an old prototype.

⚠️ **Sam RETRACTED a finding on camera.** He reported at length that hover
returns the identity card rather than the course, then found it working:
*"My bad. Forget everything I said there. It's not a problem."* That passage is
S233's hover fix working. **Do not act on the first half of it.**

**Praised, do not break:** Fit all; the panel moving to the selection.

## Sam's rulings, 2026-09-06 (S234)

1. **Enter closes the search panel.** ⚠️ This REVERSES ruling 6 of the same
   morning ("Enter runs the search AND leaves the list up"), and he flagged the
   reversal himself: *"I really think it should close this, even though we made
   a prior decision on that."* With it: **move the sort chip to the list's top
   right** and **put an Enter button where the sort button is now**; the
   keyboard Enter and the button must both work.
2. **Double-click opens the course outline of record work surface** — which
   confirms rather than changes the plan already in this lane (a course opens
   the outline, empty island ground keeps today's behavior).
3. **Reserve the chip row's space** — *"stability wins."* ⚠️ Chip padding may
   shrink to fit more per row, but **contrast is not the constraint, target size
   is**: `.u-tok-x` is 24×24 and `.u-tok-go` is `min-height:24px`, both exactly
   on the WCAG 2.2 SC 2.5.8 AA floor. Only horizontal padding, the 5px gap and
   `max-width:150px` are free. Tightening postpones the wrap; only the reserved
   row removes it.

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

⓪ **BUILD THE OUTLINE.** Planned twice, cleared twice, built zero times.
Layered panel, MAP-Generated labels, `kb_curation` for edits, re-mint queued
behind verified-plus-admin, a certification-first entry beside the course-first
one. ⚠️ Reuse `courseLevel()` and the Beg/Int/Adv ladder in
`prototype/ccr_universe.js` rather than re-deriving. **Course level and skill
level are different axes — carry both, derive neither.** Sources are wildly
uneven and that is the lane's central constraint: 484 identities carry a C-ID,
57 a CCN (title and number only), **15,937 are M-IDs with no authority text**.
All thirteen MC slots are unsourced.

① **The three fixes from the recording** — reserve the chip row (+ tighter
chips), route `discipline()` so the trip survives, drop "prototype v1".
② **The re-mint approval queue** — routed through Governance
([`adr-remint-approval-queue-decision-rights`](../../kb-notes/adr-remint-approval-queue-decision-rights.md)),
not built. A register row owning the approval, the surface mapped in
`kb/governance_surface_map.json` at the first write, INSERT-only rollback, and a
test asserting it writes approvals and nothing else.
③ **Decision packs per discipline, fetched on demand** — the bottleneck behind
every UI tweak; the shards' publish path is the template.
④ The drag that leaves SUBJ4 inconsistent queues a re-mint candidate — proposes,
never auto-adds.
⑤ The 73 two-real-course control numbers · the member-roster fold at source
(`CaÃ±ada College` ×678) · accept-all-orbits-above-a-score as a batch verb · the
67 `ESOL Z####` rows and `FIMS M1018` (needs an un-merge verb) · a tool for the
3,001 with no discipline.
⑥ **A description signal for the rim** — 1,600 of 2,073 rim courses have a
catalog description; TF-IDF places ~130 well and agrees with the title-based
parent only 20% of the time. A gap-filler that never outvotes a title.
⑦ Dropdown labels that name the grain on the CCR tab.
⑧ **After the fold:** the promote step is BUILT (`kb/_uc_cur_promote.py`); the
seven held rows move when a second signal arrives; the identities map's ghost
keys have a dry run and a cut receipt awaiting Sam's sheet.
⑨ Identity-level chips once members are classified.
