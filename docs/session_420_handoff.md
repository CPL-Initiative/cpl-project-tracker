---
title: "Session 420 handoff: the Commons' step 1 landed and Sam approved the mock-up, Cañada's picker reads the catalog's three heading shapes, the extraction of its 26 moved pages waits"
date: 2026-10-18
session: 419 (SkyCottonwood)
tags: [handoff, commons, program-requirements-harvest, cer-procedures, ui-pass]
status: current
---

# You are Session 420

Your moniker is **SkyTanoak**. Session 419 (**SkyCottonwood**, `session_01SftGNM3hQ4xDyQut9zS31Y`, Sam's hand-opened
session from 18:39Z on 2026-10-18) checkpointed at about 20:10Z with the full Rule 9 list, in cpl-project-tracker#2241
beside the reader change (merge it once `test` passes if it is still open). If the routine started you, follow
`docs/reference/scheduled_sessions.md` first.

## Sam's words this run

None to this session: his opening line only. At 19:08Z he wrote to Session 417 in its chat: *"Commons looks good.
Just make sure I can collapse each and we have a collapse all button."* S417 heard it first-hand and built it (the
mock-up's version 4, #2239); the ruling is `cpl_memory` `sam-approves-commons-mockup-collapse-2026-10-18` (verified;
S418's duplicate is superseded in #2240). At 20:03Z, again to S417: *"Keep the count and meter when collapsed."* The fold as built
stands (a collapsed row keeps its title, words, count and meter); the same row carries both rulings. No sheet is open; Sheet 96 (https://claude.ai/artifact/Gta7x4T2NfFwbymH4nddui)
is the latest answered. Rulings in force from today: Sheet 94 (apply, save, retire, keep), Sheet 95 (build the Commons in
order with Common Subjects; Sierra quotes complete records), Sheet 96 (keep), and the mock-up approval above.

## What shipped (S419)

- **The Commons' step 1 (#2237, merged 19:28Z):** the Progress view the Program Requirements tab drew since S343 is
  drawn by `commons_progress.js`, the shared module (renderer, `readStatus()`, the milestone arithmetic, the status
  words, the time words, the Progress CSS). The tab keeps its definitions and live reads, adds a declarative `HEADLINE`
  and a `PROGRESS` spec, and lends the module its `section()`, `goControl()` and call-card helpers. Nothing changed on
  screen: `tests/program_requirements.test.js` passes its 417 checks with the module loaded first;
  `tests/commons_progress.test.js` (30 checks) guards the shared-only failure modes. The status file moved to
  **`kb/status/program-requirements.json`** (the first of one per common reference; `scripts/queue_status.py --project`;
  checkpoint step 12 names it). Lessons: `docs/commons_lessons.md`; KB note
  `docs/kb-notes/methodology-a-shared-view-borrows-the-host-s-primitives.md`.
- **The Commons ruling recorded** (lane, section 11, the status file) with the time corrected to 19:08Z and the one
  memory row cited; S417 owned the mock-up file and artifact, S418 closed #2238 unmerged and stood down.
- **Cañada's eleven, read from the catalog's own words** (#2241, with this checkpoint): the 11 records the load left
  out were extractions that placed no listed course, each handed a sibling's section. Two page reads of the hand-filed
  copy (`kb/college_reads/canada_shared_pdf_sections.json`; runs 39159401511, 39159883287) showed three heading shapes,
  and `pdf_heading()` / `_pdf_pick()` now read them: the award's letters before the title ("CA  Business Assistant";
  `PDF_AWARD_PREFIX`), a title wrapped onto a short next line ("CA  Human Relations in the" / "Workplace";
  `PDF_WRAP_CHARS`), and a heading page whose list opens the next page ("AS-T  Mathematics 2.0", "AA  Ethnic Studies").
  `tests/program_requirements_college_test.py` 276 checks. **The capture-only run on the branch (39160718966, committed
  as `dc9be8b5`) moved 26 programs' pages** (`capture_preview.json` `would_extract`): eight of the eleven now open on
  their own headings (Business Management, Business Assistant, Human Relations, Digital Marketing, Marketing,
  Mathematics, Ethnic Studies, Technical (Apparel)); Political Science A.A.-T still reads from the description pages
  (its own page names 4 of 9 listed codes); Business Administration A.S. and Theater Arts A.A. carry one-course COCI
  lists the printed section never names (a COCI comparison finding, not the reader's).
- `cpl_memory`: `commons-step-1-shared-progress-module-2026-10-18`, `canada-pdf-heading-shapes-2026-10-18`,
  `verify-a-picker-change-on-the-printed-pages-2026-10-18` (proposed); receipt `kb/receipts/cpl_memory_2026-10-18_s419.sql`.
  Spend: none (two page reads and one capture-only run, no model call).

## In flight at sign-off (check each first)

1. **#2241** (`claude/stoic-cray-l8kmja`): the reader change, the Commons record, this checkpoint and the runner's
   capture commit. Merge once `test` passes; S419 drops its subscription at sign-off.
2. **Cañada's extraction, then load, then display.** On the branch (or on `main` once #2241 merges), dispatch
   `program-requirements-college.yml` with `college=Cañada College`, `step=read`, `extract=1`: the 26 moved pages
   re-extract (about $2 under Sam's standing go of 2026-10-17), the kept 47 do not. Read the run's summary (passing,
   failed.coverage), then `step=reread` (the newest run replaces unchecked rows), `step=load`, and `step=display` on
   `main`. Expect the eight to place their courses; Political Science may still fall short of the machine checks.
3. **The nightly 07:47Z `cer-procedures.yml` run** is the first saving night with no one watching: read its receipt in
   `kb/cer_procedures_out/saved/` and the morning fold's `applied.json` (S418's item, still open).
4. **The UI pass is due on cpl-news** (`python3 scripts/ui_pass.py --next`): two known findings, a heading skip h2 to
   h4 at "Suggest a story" and `input.q` with no focus ring, in both themes. S419 had no room for the fix PR; the ledger
   keeps the view due.

## Priority after that

1. The harvest: Merced's 18 unfound (8 whose Coursedog page prints few of COCI's listed codes; 10 whose own page the
   search never returned, a sibling award's naming the same list); Taft's 21 and San Joaquin Delta's 50 records failing
   a machine check (Delta's seven noncredit programs carry hours the arithmetic cannot add; seven coverage failures place
   fewer than the listed courses; most of the rest add a half-unit choice above a printed total). Read the records'
   `score` before naming a cause: the eleven were named unfound for two sessions and were not.
2. The Commons step 2: each common reference's Progress view drawn from `commons_progress.js`, in the ruled order
   (Exhibit on the CER tab first), each with its definition of complete on a card for Sam and a status file under
   `kb/status/`. The host contract is in `docs/commons_lessons.md`; the collapse pattern Sam asked for belongs in step
   3's Commons row component.

## Patterns that worked

- Lift a view by moving code byte-exact with a script anchored on content, then run the host's own suite unchanged
  with the module loaded first; the 417 checks were the guard, and the new suite covers only what a shared module can
  get wrong.
- Before changing a reader, print the catalog's pages from the runner (a `kb/college_reads/` plan on the hand-filed
  copy) and run the picker over them before and after, per program with its COCI list; the capture-only run then
  confirms on the whole PDF before a model call is spent. Match patterns with `\s+`: pypdf leaves two spaces after the
  award's letters.
- Read the queued notifications before writing anything another session may own; three sessions agreed one writer per
  file by message this hour, and the record came out once, with the right time.

## Lessons to honor

- `bash scripts/check_generated.sh` prints its regenerate hint whenever one check is stale; a `grep -v " ok$"` that
  also drops the STALE line hides it. Read the whole tail before pushing (S419 pushed twice with a stale dependency map
  and fixed it in follow-up commits).
- `CPL_TABS.loadScript` calls back on error as on load, so a module a tab depends on must fail soft or the tab dies at
  load; the stub in `program_requirements.js` is the pattern.
- The runner commits a capture-only read to the branch that ran it; pull before the next commit.
- `execute_sql` runs an insert at once and holds an update for the connector's confirmation (60 s); a committed file
  through `supabase-migrate.yml` applies DML and commits its receipt to the branch.

## Not refreshed this checkpoint

- The Pipeline tab, `README.md`: nothing they cover moved. `kb/README.md`: the `kb/status/` line added.
- The UI pass: cpl-news named, not fixed (item 4 above).
- `kb/status/program-requirements.json`: stamped (headline 20,282 active, 11,621 complete, 113 colleges, re-read live
  at 20:00Z; the whole-harvest row re-read at 20:00Z; next run 2026-10-19T05:12Z).
