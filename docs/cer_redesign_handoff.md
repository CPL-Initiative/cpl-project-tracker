---
title: "CER redesign handoff: every List carries the line, the folded summary and the side panel (SkyTeaberry)"
date: 2026-11-04
session: CER redesign build, side session (SkyTeaberry)
tags: [handoff, cer, exhibits, commons-list, cr-reference, subjects, program-requirements, coci-lookup]
status: current
---

# You are SkyPawpaw, the Lists' next build

SkyTeaberry ran on 2026-11-04 from about 00:00Z to 01:15Z (Sam named it; the greeting cited SkyInkberry's handoff, and
the file held SkyMulberry's, which named SkyMedlar). **Light checkpoint:** no §11 row moved, no re-mint, no data receipt.
One `cpl_memory` row: `pitfall-null-list-limit-empties-table-2026-11-04` (proposed). Skipped: `README.md`,
`kb/README.md`, the pipeline view, a new KB note (the List norms note took the record), the lessons doc (nothing
retired), and the decision sheet (nothing waits on Sam from this run). The CPL queue's `docs/session_<N>_handoff.md`
stays the routine's (565). The lint flags two items that belong to the routine: `CLAUDE.md` at 60,641 of 60,000
bytes, and the commits since `session_565` (its checkpoint trigger).

## What shipped (SkyTeaberry)

- **#2745** (merged): **Subjects and Programs take the line, the folded summary and the side panel.** Subjects'
  panel: an MQ discipline's local subjects (most used first, each share), the codes it shares (a collision, or shared
  by design; another discipline's name opens its panel) and Confirm this pick with its own status line. Programs'
  panel: the record's checks in words and its courses block by block with title, units and the CPL on record at the
  college; a light record is read once from the panel. **Engine fix:** a count pressed on CR's line set
  `L.limit = null` and `slice(0, null)` drew an empty table; `listState` restores the first page, callers pass
  `api.LIMIT`. `h.table` takes an opening `sort`; the line's pair words stop at a colon too.
  `tests/csr_list_panel.test.js`, `tests/program_requirements_list_panel.test.js`.
- **#2746** (merged): **Courses, the fifth.** Its counts open SkyView in a new tab (Courses keeps SkyView first); the line
  shares the tab's one read of the Commons file with its Progress page; a course's panel lists the local courses its
  M-ID holds, the Title drawer (description, outcomes) moved in. The Title drawer's tests in `coci_list` and
  `coci_lookup` now drive it inside the panel. `tests/coci_list_panel.test.js`. This checkpoint rides in it.

## Open work, in order

1. **Merge the Exhibits PR** (its panel on the engine's parts; Exhibits' and CR Progress's Commons reads through
   `CPL_COMMONS_LIST.readCommons`) once `test` passes on its head. #2746 merged.
2. **The original views retire as each List does what they do**, one PR each, tests ported first: CR's worklist
   (its group edits now live in the panel; what remains there: the filters *auto* and *held* that `cr_progress.js`'s
   counts open, the official-title warning, *Seen under*), then Subjects' Reference
   view (its toolbar filters, the SUBJ check modal), then Programs' and Courses' older views. Check what only the
   view still has and carry it into the panel first.
3. **The Subjects card's second count** (local codes confirmed by a person) once the confirms sync to a file.
4. **Carried:** after each of Sam's runs through Another look, move the panel rows the fold names; the first rule sent
   to the routine; the Catalog's *Courses that may align*, once a source names courses.

## Lessons to honor

- **A null page limit empties a List.** `rows.slice(0, null)` is `[]`. Reset with `api.LIMIT`; the engine now guards it.
- **The engine's `redraw` repaints the table only.** A control that changes the head (the line, the fold) calls the
  tab's own render.
- **A raw-hex lint reads `#2736` as a color.** Write PR numbers in comments as `PR 2736` in files whose tests scan for hex.
- **Before a title press moves into a panel, port the Title drawer's tests** (`.P-pdrawer` inside `#P-panel`) and
  filter a fetch log by its table (`course_outcomes`) rather than reading `fetches[0]`.
- **A 503 retries after a delay** in Programs' reads; a test that wants a failure answers 400.
- **A lane edit can tip its budget.** Run the lint before the push, not after.

## Let go

At sign-off: drop the PR watch on #2746 and the check-in `trig_01D7fGoDcNALyBK5UaqiHQP3` once it merges. No artifact watch.

---

# SkyMulberry's record (2026-11-03)

SkyMulberry ran on 2026-11-03 from about 21:06Z to 23:00Z. **Light checkpoint:** no §11 row moved, no re-mint, no data
receipt. It wrote two `cpl_memory` rows: `exhibits-credentials-view-retired-into-list-2026-11-03` (verified by its
merged PRs) and `pitfall-read-on-render-loops-on-failure-2026-11-03` (proposed). Skipped: `README.md`, `kb/README.md`,
the pipeline view, a new KB note (the List norms note took the plan), the lessons doc (no retired text needed a home),
and the decision sheet (nothing waits on Sam from this run). The CPL queue's `docs/session_<N>_handoff.md` stays the
routine's (565). The lint flags two items that belong to the routine: `CLAUDE.md` at 60,641 of 60,000 bytes, and 15
commits since `session_565` (its checkpoint trigger).

## What shipped (SkyMulberry)

- **#2738** (merged): SkyTrue's side panel, once `test` passed on its head.
- **#2740** (merged): the side panel edits the issuer and training sites, each site for a college or any college,
  with the Credentials view's own editor; a save shows in the row and joins *Changed this visit*. The List's row Edit
  now keeps a kept site's college; it used to drop it.
- **#2741** (merged): **the Credentials view retired into the List.** The panel gained the credit lines, each college's
  own MAP exhibit, MAP's Request Quick Adopt line and the over-merged count. The finder searches local titles and
  other issuers. The Review card's link reads *Set them in the List* and opens the panel; `#exhibits/credentials`
  opens the List. Part C of `tests/exhibits.test.js` drives the List (186).
- **#2742** (open, CI): **the CR List's side panel.** The engine gains the panel's shared parts (`h.title`, `h.meta`,
  `h.heading`, `h.table`, `h.fold`, `h.open`). A wording's panel shows its group's wordings, Confirm the group and Not a
  topic with their own status line, and the rest folded. `tests/cr_list_panel.test.js`.
- **#2743** (open, CI, stacked on #2742; GitHub retargets it to `main` when #2742 merges): **the line over the CR List
  and its folded cards.** The engine draws the line (`api.line`, `CPL_COMMONS_LIST.readCommons`, `lineItems`), and
  Exhibits' line moved onto it with its own class names. `tests/cr_list_line.test.js`.

## Open work, in order

1. **Merge #2742, then #2743**, each once `test` passes on its current head. If #2743 conflicts after #2742's merge,
   merge `main` into it and regenerate the dependency map (never pick sides on a generated file).
2. **The other Lists take the line, the folded cards and the panel** (Subjects, then Programs, then Courses), one PR
   each, with the engine's `api.line` and panel parts. Subjects' List is `canonical_subj4.js` (row key `subjects`);
   Programs `program_requirements.js` (`requirements`); Courses `coci_lookup.js` (`course`; Courses keeps SkyView first).
3. **Exhibits' panel onto the engine's parts** (`h.table` for its members, `h.fold` for its folds), and Exhibits' and
   `cr_progress.js`'s reads of `kb/status/commons.json` onto `CPL_COMMONS_LIST.readCommons` where the engine is loaded
   (the norm: never a second reader).
4. **CR's worklist retires once the List does what it does.** Check what only the worklist still has (Add a wording
   inside a group, a split, the per-group detail) and carry it into the panel first.
5. **The Subjects card's second count** (local codes confirmed by a person) once the confirms sync to a file.
6. **Carried:** after each of Sam's runs through Another look, move the panel rows the fold names; the first rule sent
   to the routine; the Catalog's *Courses that may align*, once a source names courses.

## Lessons to honor

- A read started from a render must be marked done for the visit, success or failure, or a failed read re-renders and
  reads again forever. The CR line's jsdom test found it (a 404); `cpl_memory` has the pitfall.
- `pkill -f <pattern>` kills your own shell when the pattern is in the command you typed. Kill by pid.
- A merge refused with *Head branch was modified* can be your own short SHA; pass the full head SHA from the PR.
- Before a view retires, port its tests onto the place that replaces it rather than deleting them: Part C kept every
  guard on issuer and site resolution, the three-row save and the adoption semantics.

## Let go

At sign-off: drop the PR watches on #2742 and #2743 once merged. This session holds no check-in and no artifact watch.
