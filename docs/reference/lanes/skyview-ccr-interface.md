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

## Measured in a browser — the durable warnings

Both defects Sam's 2026-09-06 recording surfaced are FIXED (S235). What must not
be lost is how they were mis-read, not the round-by-round — that is in
[`ccr_atlas_lessons`](../../ccr_atlas_lessons.md).

⚠️ **IT IS `.sugwrap` THAT WRAPS, NOT `#u-bar`.** The triage named `#u-bar`
30 → 76px; walking the real ancestor chain in Chromium on the fourth pick shows
`#u-bar` **unchanged** and `.u-search-slot .sugwrap` going 30 → 66, which pushes
`#sug` 40 → 76. A `min-height` on `#u-bar` would have read as a fix and changed
nothing. Ruling 3 shipped as a two-row reserve on `.sugwrap`; `#sug` top now
holds at 75 across five picks. ⚠️ Chip tightening is bounded by **target size,
not contrast**: `.u-tok-x` 24×24 and `.u-tok-go` min-height 24px sit on the WCAG
2.2 SC 2.5.8 AA floor, verified still 24 after the change.

⚠️ **THE PICKS DIED ON THE WAY OUT, NOT ON THE WAY BACK.** `homeSearch()` called
`clearTokens()` and `setCrumbs()` calls it on every view entry, so
`__ccrTokenKeys()` already read `[]` on the Welding surface. Diagnosing the
return path would have fixed nothing. The selection is now parked and re-rung by
`restoreTokens()`.

⚠️ **Sam RETRACTED a finding on camera** — thirty seconds reporting that hover
returned the identity card, then *"My bad. Forget everything I said there."*
That passage is S233's hover fix working. **Read a recording to the end before
fixing anything.**

**Praised, do not break:** Fit all; the panel moving to the selection.

## Sam's rulings, 2026-09-06 — all three shipped in S235

1. **Enter closes the search panel.** ⚠️ REVERSES ruling 6 of the same morning,
   a reversal he flagged himself. Shipped with it: the sort control moved to the
   list's **top right** (a sticky `.sug-head`) and an **Enter** button took its
   place in the bottom row; key and button are one call (`runSearch`).
   ⚠️ The header is a child of the listbox, so `markSug` addresses rows by `id`,
   never by child position — positional indexing would put the cursor one row
   above where the reader is looking. ⚠️ Ruling 1 did **not** touch
   `takeHighlighted()`: Enter on a highlighted row is the multi-select pick, and
   ruling 3 of 09-05 keeps the list up through it.
2. **Double-click opens the course outline** — split by what is under the
   pointer: a course opens `#outline/<id>`, empty island ground keeps the
   discipline accelerator. A panel button carries the same route, because a
   double-click is undiscoverable and unreachable from a keyboard.
3. **Reserve the chip row's space** — see the warnings above.

## The outline of record — BUILT (S235)

`#outline/<id>`, six layers, `tests/ccr_skyview_outline.test.js` (23 checks,
both key guards mutation-tested). **The description is CHOSEN, never written:**
the medoid of the member catalog descriptions, quoted and attributed — composing
prose out of several catalogs would read as authoritative while belonging to
nobody. Sam's MAP-Generated sentence prints verbatim. **Skills are imputed** from
the colleges' own words (we hold **zero** agency skill statements); confidence is
agreement BETWEEN colleges; thin skills stay, chipped. **Two level axes, neither
derived** — the course's off its title, a skill's off its own words.

⚠️ **Two extraction defects were invisible until driven in Chromium**: every
n-gram length counted per position, so fragments outscored the names containing
them; and n-grams crossed commas in enumerations ("pain tissue integrity gas").
Fixed by longest-n-gram-per-position, a containment guard with a ratio
exception, and segmenting on punctuation first. **94.6% of member courses carry
a description, but only 30.0% of identities have 2+** — stand-alones carry
exactly one, so each outline states its own evidence.

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

⓪ **CPL-focused view + show-articulations toggle (Sam, 2026-09-06, unprompted).**
Two closely-linked asks, both needing a prototype first: (a) a **CPL vs
Course/Discipline toggle** so *"the CPL exhibits and CRs are the focus more than
the Courses"*; (b) a **show-articulations toggle on normal SkyView** to *"reveal
to users where existing artics are and where they differ for the same course
college to college."* ⚠️ `ar` is ABSENT, never 0 — a toggle that draws "no
articulations" where we merely did not look would be a lie at scale.

① **Text zoom on the SkyView toolbar (Sam, 2026-09-06).** A control to zoom text
size up or down, *"squeezed somewhere in on the SkyView toolbar."* ⚠️ **It must
NOT change the current behavior where text does not zoom with the map** — *"it's
important to keep with all we have going on."* So it scales label type
independently of `view.k`, which is a separate axis from the map's zoom.

①b **A magic phrase to curate (Sam, 2026-09-06).** Moving courses goes behind a
phrase login, *"and later shift to a team phrase as things settle."* Sits with
the `org-phrase-scope-auth` lane; the first write from this page is also a
Governance surface (Rule 10 a3).

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
