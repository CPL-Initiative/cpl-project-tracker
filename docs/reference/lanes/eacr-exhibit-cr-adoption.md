---
title: "EACR — Exhibit & CR Adoption — lane state"
created: 2026-08-28
updated: 2026-09-25
tags: [reference, roadmap-lane]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference/lanes
related:
  - "[[CLAUDE]]"
---

# EACR — Exhibit & CR Adoption

> **Always-current lane state, not an archive** (relocated from `CLAUDE.md` §11
> on 2026-08-28; rewritten to current truth 2026-09-24 when Sam's ten tweaks
> landed). Update it at every checkpoint that moves this lane.

**What this lane is:** One place to see every exhibit, its credit recommendations, and the colleges that could adopt it.

## Status

✅ **SAM'S TEN TWEAKS OF 2026-09-24 ARE LIVE** ([#1681](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1681); the data
half landed with the 2026-09-24 17:03 UTC build, and every card carries
`cip_sector`). What the tab does now, in the order he asked:

1. **CIP Sectors replaces Career Cluster**, and the filter offers the COMPLETE
   two-digit family list (fifty, from the same `fams` the TOP to CIP tab reads)
   with a count beside each. The route: MAP's integer TOP id → the CCC 4-digit
   TOP (`TOP_Code_Lookup.xlsx` column D) → the family colleges actually
   assigned under that TOP (`kb/top_cip_map.json`, the 4-digit code's own
   `.00` entry first, then the programs-weighted fold), the published crosswalk
   (`kb/reference/topcip_2021_crosswalk.xlsx`) only where no college has. TOP
   4930 (AP exams, general education) lands on 24 Liberal Arts, not on the 32
   Basic Skills the raw fold sent it to. Every filter is multi-select.
   **All 198 MAP TOP ids resolve since 2026-09-25.** Column D had disagreed
   with its own program title on 81 rows (History at 2203, which is Ethnic
   Studies; Fire Technology at 2130, which is no TOP code), and nothing read
   the column before #1681. `kb/_correct_top_lookup_code4.py` corrected it
   against the TOP manual (receipt
   `kb/receipts/top_code_lookup_code4_2026-09-25_s288.json`, old and new code
   per row); `tests/top_code_lookup_code4_test.py` holds it there in CI.
   **The title rules come first for exams and fill every gap TOP leaves**
   (Sam, 2026-09-25: *"We only need the CIP sector on this tab for filter and
   quick categorization. I would be just as happy if you used your own
   analysis from your knowledge to create the sectors yourself. I don't want
   to get sucked into the top/CIP black hole, which is it's own project."*).
   `kb/reference/eacr_cip_title_rules.json` holds 37 ordered title patterns and
   an exact-title table, authored from the 669 titles that were exams or had no
   sector; the generator applies it FIRST for Standardized Assessment cards (an
   exam's MAP TOP id is a coarse general-education code, which filed AP
   Chemistry under 24 Liberal Arts and CLEP Spanish under 09 Communication) and
   as the FALLBACK for every other card. Live since the 2026-09-25 14:16 UTC
   build ([#1693](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1693)) and confirmed in Chromium at 390 and 1440: the
   dropdown reads "No CIP assigned yet (3)", down from 449, and 84 exams moved
   to their subject (a random 25 all read right). The three left are course codes the session could not
   place (AT 40, NC.MEA-108, NC.PTA-100). A new title that no rule names keeps
   its TOP sector, or reads "No CIP assigned yet": add a rule or a title to the
   JSON, never to code. Guard: `tests/eacr_matrix_payload_test.py` §8c.
   Generator: `_load_cip_families()` / `_cip_sector_for_tops()` /
   `_load_cip_title_rules()` / `_cip_sector_for_title()` in
   `excel_to_dashboard.py`; the card carries `cip_sector` and `top_codes`, the
   payload `cip_sectors`.
   The TOP route itself was corrected first ([#1692](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1692)): `TOP_Code_Lookup.xlsx`
   column D disagreed with its own program title on 81 of 198 rows, nothing
   read the column before #1681, and `kb/_correct_top_lookup_code4.py` set it
   from the TOP manual (receipt `kb/receipts/top_code_lookup_code4_2026-09-25_s288.json`;
   guard `tests/top_code_lookup_code4_test.py`). A route through the programs
   that list each articulated course was measured and not shipped: a course
   carries the field of every program that requires it (8 better, 15 worse on
   a random 30). [`methodology-a-program-cip-labels-the-program-not-its-courses`](../../kb-notes/methodology-a-program-cip-labels-the-program-not-its-courses.md).
   The course and program CIP question is the TOP to CIP lane's, not this
   tab's.
2. **ASCCC Area filter** beside SW Region, from `college_lookup.js`
   `ascccArea`, which `kb/_apply_asccc_areas.py` writes from
   [`kb/reference/asccc_area_map.json`](../../../kb/reference/asccc_area_map.json)
   (`--check` runs in `scripts/check_generated.sh`). **Provisional, and
   accepted as the working map by Sam's 2026-09-24 ruling — see the last
   section.** It narrows rows and matrix columns exactly as District and SW
   Region do.
3. **Vertical college headers** (bottom to top, `writing-mode: vertical-rl`),
   so a column is 32px against the diagonal's 34; six-character figures such as
   `(10.5)` get a tighter setting rather than every column widening (43 such
   cells, measured).
4. **The exhibit drill-down names each MAP record's TITLE and TOTAL UNITS**;
   the MAP id survives only as the chip's title attribute. Generator field
   `exhibit_records` (title, units, lines per id); until the data build lands,
   the consumer pairs raw titles with ids where the two lists align.
5. **No college-scope chips, no rows-threshold chips.** Filters match ADOPTERS
   (Sam's 2026-08-16 ruling, now fixed rather than switchable); the could-adopt
   column and every export carry the M-ID "already teaches a matching course"
   layer; the broad TOP/C-ID lead list reaches no screen or export from this
   tab (Rule 7). **Every credential with an adopting college is a matrix row**
   (2,675 of 2,738 titles; his screen had "1 adopter" selected when he asked —
   an assumption, stated in the PR).
6. **Matrix rows sit under CIP-sector section headers** (code ascending, the
   no-CIP bucket last, sticky under the column header), alphabetical within.
7. **Hover or focus on an inked cell opens a panel** listing what that college
   articulated — each course, its units, the recommendation text — plus the
   opportunity line and, for a likely non-adopter, the course it already
   teaches. Generator field `adopter_rec_idx` (college → indices into
   `credit_recs`); older payloads show the units alone. A real element with
   `role=tooltip` and `aria-describedby`, never a title attribute.
8. **Verified, not claimed:** `npm run a11y` passes the route at 390 and 1440;
   the jsdom suites are `eacr_matrix` (114), `eacr_a11y` (63), `eacr_scope`
   (44), `eacr_filters` (30), `eacr_handout` (16), `eacr_common_titles` (6);
   the generator half is `tests/eacr_matrix_payload_test.py` (52); the
   dependency map was regenerated.
9. **⭐ THE MATRIX IS A WINDOW, NOT A GRID.** 2,675 × 118 is ~316,000 cells. A
   chunked render was measured first: the HTML is cheap, but the table costs
   ~22 s to land in Chromium and 200–500 ms per scroll frame afterwards, with
   or without the sticky headers. So the DOM only ever holds the rows within a
   viewport-and-a-bit of the scroll position (25–40), two spacer rows carry the
   rest of the height, every credential row is 52px (titles clamp to two
   lines; the th's title attribute and DOM text carry the whole), and the
   current section's header is rendered one line early so the sticky rule keeps
   the sector named. Measured after: first paint 65–82 ms, wheel-sized scroll
   frames 33 ms median / 133–168 ms max on a re-window, `table-layout: fixed`
   with a colgroup so the phone's 180px title column reaches the layout.
   Arrow keys move between cells (a row outside the window scrolls itself in
   first), Escape returns to the region and is stopped there so the page's own
   Escape handlers do not move focus. Lesson note:
   [`methodology-a-grid-past-a-few-hundred-thousand-cells-needs-a-window-not-chunks`](../../kb-notes/methodology-a-grid-past-a-few-hundred-thousand-cells-needs-a-window-not-chunks.md).
10. **Create Handout** (a word on a button, in the shared filter bar) opens My
    College, where the handout is built — its Report builds the briefing
    document and its occupation opportunity register is the port of the
    per-college handout page. One college in the College filter travels as My
    College's remembered choice (`MY_COLLEGE_SCOPE_KEY` mirrors
    `college_briefing.js` `SCOPE_KEY`; `tests/eacr_handout.test.js` fails if
    the literals drift); two or none → the tab opens and asks, as it always
    does.

**Standing rulings that survive:** brown is the PEER BENCHMARK, never
`rec_units_total` · columns open on COLLEGES · brown on CREDIBLE cells only ·
`matrixCell()` is ONE function for grid, panel and CSV · roster rules
(`kb/reference/map_college_roster_rules.json`) are the one place identity folds
belong (118 = 115 credit + 3 noncredit) · a content filter never drops a column.
Story of the earlier rounds: [`docs/eacr_scope_lessons.md`](../../eacr_scope_lessons.md).

## NEXT

① Nothing waits on a build: the column-D correction and the title rules are
live and verified. ② **Sam looks at the grid in a browser** —
the 52px row, the two-line title clamp, the 0.62rem cell figures and the panel
are his to judge. ③ The Adoption table's own rows keep their opportunity-first
order; sectioning that view too is one call away if he wants it.
④ Curation carryover, unchanged: 4 unclassified-only titles the CER knows · 2
statewide cards matching no college · the 50-group credential-view cap.
⑤ **The title rules are the place to curate a sector.** A misfiled exam or a
new title no rule names is one line in `kb/reference/eacr_cip_title_rules.json`.

## The ASCCC Area map is provisional, and that is the ruling

`kb/reference/asccc_area_map.json` assigns all 118 colleges, but only 36 are
anchored to asccc.org text (the Area A directory slice, Area B's M–S slice,
Area C's four named bounds, Area D's six named colleges — read through search
snippets, because the sandbox's egress policy blocks asccc.org, cccco.edu and
web.archive.org). The other 82 follow the Areas' own geographic descriptions.
Sam, 2026-09-24: *"Go ahead and use what we have for ASCCC regions and we'll
get the new report later."* So the map is the working map and nothing waits on
him; the MAP Custom Report of locations by region (Pedro, per his 2026-09-22
note) replaces it when it arrives — edit the JSON's per-college rows, run
`python3 kb/_apply_asccc_areas.py`, and the file's `basis` field says which
rows it confirmed or corrected. My College's "Academic Senate region" scope
still reads not ready; wiring it to this field is a separate build.
