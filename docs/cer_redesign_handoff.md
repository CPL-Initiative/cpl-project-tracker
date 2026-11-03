---
title: "CER redesign handoff: the Credentials view retires into the List, the CR List's panel and line (SkyMulberry)"
date: 2026-11-03
session: CER redesign build, side session (SkyMulberry)
tags: [handoff, cer, exhibits, commons-list, cr-reference, map-links]
status: current
---

# You are SkyMedlar, the Lists' next build

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

---

# SkyTrue's record (earlier the same day)

SkyTrue ran on 2026-11-03 from about 17:43Z to 20:25Z (Sam named it SkyTrue). **Light checkpoint** at the context
warning (about 100,000 tokens left): no §11 row moved, no re-mint, no data receipt (one `cpl_memory` decision row).
Skipped: `README.md`, `kb/README.md`, the pipeline view, a new KB note (the List norms note took the plan), the
decision sheet (nothing waits on Sam). The CPL queue's `docs/session_<N>_handoff.md` stays the routine's (565).

## What shipped (SkyTrue)

- **#2733** (merged): the cer-procedures lane says SLO hints are built; Sheet 161 moved to the lessons doc.
- **#2735** (merged): every Commons card action opens the reference's List; a Subjects pick waiting for a person opens
  List, Open (Confirm this pick lives there; the Reference box saves only a changed code). New addresses
  `#canonical-subj4/list/<filter>`, `#program-requirements/list/<filter>`; Exhibits' procedures open its Rules view.
- **#2736** (merged): Exhibits' tiles fold behind *Hide the summary*; one line of their counts stays above the list.
- **#2737** (open, CI): the Local subjects List, a fourth Subjects view: one row per local code (320 mapped, 18 left
  out, 1,376 only in courses); Confirm writes `_SUBJ_DISC::<CODE>` under DR-25. The map file is never edited from it.
- **#2738** (open, CI): the side panel. `commons_list.js` gains a `panel` hook (a title opens it; the title's drawer
  moves inside); Exhibits shows the credential, its folded members (sortable, MAP links) and the rest folded; a
  Students column. a11y targets `exhibits-panel` and `-dark`.
- Mock: https://claude.ai/artifact/PJKHZ8QwfyfbRW7U6qwBV4 (version 11, Sam: *"Mock looks great"*).

## Sam's decisions this run (cpl_memory `sam-the-list-is-the-commons-workspace-2026-11-03`)

The List is each reference's one workspace: a line of counts, the cards folded, a side panel per row; the original
views retire once the List does what they do. The panel shows the folded members (he set the description layer
aside: MAP's exhibits carry no description). CIP sector over SOC. A Students column. Held exhibit titles keep
Review; Courses keeps SkyView first.

## Emergency note (SkyTrue, 20:46Z, context at its last checkpoint of runway)

#2737 (Local subjects) and #2739 (this checkpoint) merged. #2738 (the side panel) carries a fix for CI shard 5: the
panel had declared a second `listFocusTitle`, which replaced the engine's own and broke
`tests/commons_list_suggest.test.js` (3); the duplicate is gone (19/19). Merge #2738 once `test` passes. Not
refreshed after the light checkpoint: the INDEX history, the vault note, the run logs (they predate this fix).

## Open work, in order

1. **Merge #2737 and #2738** once `test` passes on each head (both subscribed).
2. **Carry the edits into the panel** (issuer, training sites), so the Credentials view can retire.
3. **The other Lists take the line, the folded cards and the panel** (CR, Subjects, Courses, Programs), one PR each,
   by the one renderer (norms note, *The List is the workspace*).
4. **The Subjects card's second count** (local codes confirmed by a person) once the confirms sync to a file.
5. **Carried:** after each of Sam's runs through Another look, move the panel rows the fold names.

## Lessons to honor

- Read the repo before advising: Sam's *"thought we had already gamed this out"* was right; the norms note held it.
- A panel that takes a title's press must carry the title's drawer, or its content is lost (S542's Outcomes lines).
- The seed's `variants_observed` fallback is M-ID SUBJ4s, never local codes.

## Let go

At sign-off: drop the PR watches on #2737 and #2738 once merged, and the artifact watch on the mock.
