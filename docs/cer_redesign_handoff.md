---
title: "CER redesign handoff: the List becomes the workspace, the Exhibits side panel (SkyTrue)"
date: 2026-11-03
session: CER redesign build, side session (SkyTrue)
tags: [handoff, cer, exhibits, exhibit-canonicalization, kb-curation, map-links]
status: current
---

# You are SkyMulberry, the Exhibits tab's next build

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

---

# SkyElderberry's record (earlier the same day)

SkyElderberry ran on 2026-11-03 from about 16:45Z to 17:10Z. **Light checkpoint:** no lane changed state and the run
wrote no data. Skipped: `README.md`, `kb/README.md`, the pipeline view, a KB note, `kb/status/*.json`, the decision
sheet (nothing waits on Sam from this lane). The CPL queue's `docs/session_<N>_handoff.md` stays the routine's (565).

## What shipped (SkyElderberry)

- **The Exhibits tab's MAP links go through `map_links.js`.** Two of them (Request Quick Adopt in a college's panel,
  and each source exhibit's *in MAP* link) built the address from the tab's own copy. `mapUrl` in `exhibits.js` now
  calls `CPL_MAP_LINKS.url` and keeps its copy only for a page without `map_links.js`; `linkUrl` folded into it.
  `tests/exhibits.test.js` pins both links to the `map_links.js` stub and holds the copy equal (198 of 198; the two
  link checks fail on the old code).
- **The EACR lane's NEXT line** said the workbook and the statewide view still built the address themselves. Both
  already call `CPL_MAP_LINKS.url`; the line now says so.
- **Checked, nothing to do:** no fold after 11-03. The 15:33Z CER procedures run (run 41664297423) saved 26
  classifier rows for unclassified exhibits and moved no credential, so no panel row needs moving. No Curate rows from
  Sam since 12:00Z, and no `cer_procedure_*` row.
- **SkyTeaberry still reads blocked** on *reply "go" and approve the Supabase delete*. That delete is SkyBlackberry's
  16:08Z Sheet 161 apply; it is done. Do not reply "go" there.

## Open work, in order

1. **After each of Sam's runs through Another look,** read the next fold's `credential_moves` and `credential_retires`
   and move the panel rows they list. Never move a `unified_title_override` or `unified_title_merge_confirm`, and
   compare values before you call a leftover row redundant.
2. **The first rule sent to the routine** (carried): when one shows up in the Rules view, confirm the overnight firing
   worked it by step 7.
3. **Carried:** the Catalog's *Courses that may align*, once a source names courses.
4. **Noticed, not this lane's:** the 10 credentials on the Fact Sheet builder's MAP fix list (SkySnowberry).

## Lessons to honor

- Before acting on a lane's NEXT line, grep the code it names: the EACR line was one fix behind.
- A delete and a guarded move of a row onto the deleted row's key cannot share one statement with a `not exists`
  guard (SkyBlackberry). The repo's Supabase guard refuses a read that contains `replace`.
- The cer-procedures lane sits at its 20,000-byte budget (19,900 now). Move a ruled paragraph to the lessons doc before
  you add one.

## Let go

At sign-off this session holds no check-in and no artifact watch; its PR watch drops when the PR merges.
