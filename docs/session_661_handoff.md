---
title: "Session 661 handoff (from SkyPlover, S660)"
created: 2026-11-15
updated: 2026-11-15
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
superseded: true
superseded_by: session_663_handoff.md
---

# You are SkyKnot (Session 661)

From SkyPlover, S660. Sam opened this session by hand at about 15:52Z on 2026-11-15, while S659's scheduled firing
(session `..YDEHqGDh3xMHsgHac`) was still connected with #3367 open. Sam's one direction: run `/coord`. S660 sent the
heads-up (S659 kept #3367, the harvest lane and handoff 660); no reply came, and #3367 merged at 16:16Z (`1ac9f322`).
One Opus 5.5 session, no conductor; one pr-gate subagent read. This is a **light checkpoint**: no §11 row moved, no
re-mint, no Rule 10 data write. The one live write was one `cpl_memory` row.

Start with COBIx's latest brief on issue #3358 (its body predates handoffs 657 to 661; this file wins on order), then this file.

## What shipped

- **#3368** (`cc46a624`): the Fact Sheet draws Source Sans 3's own italic at 400 for its 9 italic runs.
  `sierra/fonts/source-sans-3-latin-400-italic.woff2` is from @fontsource/source-sans-3 **5.0.0**, the release the
  three upright files match byte for byte. Guard `tests/factsheet_first_light.test.js` (five faces, the italic rule).
  Lane `sierra-page-redesign`: that NEXT is done.
- **#3369** (`4378804a`): the Commons data-dashboard NEXT (1). `kb/reference/restricted_table_access.json` holds a live
  read (about 16:20Z) of each restricted row's table: RLS, anon and authenticated select grants, each select policy.
  `kb/_build_cdc_sharing.py` fails a table missing there or open to anyone (RLS off, or a policy condition other than
  the named gates joined by OR); the doc names who reads each table. Withheld from Pages. Guard
  `tests/cdc_sharing_build_test.py` (30).
- **#3367** (S659's, merged by Sam): `d-both-versions-by-catalog-year-sam-2026-11-15`, a program and its Cal-GETC 2.0
  are both kept, each with its catalog year.

## First things, in order

1. **The prior-catalog read** (`program-requirements-harvest` NEXT, Sam's ruling above): list the 99 plain/2.0 pairs by
   college, then read Riverside City's 2025-2026 catalog (curriQunet; catalog 124 is 2026-2027) for each plain
   sibling and file it with `catalog_year` 2025-2026. Teach-out programs lack a record 67% of the time (424 of 630), so
   this route serves most of them too. The $40-per-college limits apply to any paid extraction.
2. **Step 11** once UTC Nov 16 begins (Nov 15 had its two runs): Allan Hancock's full read (#3284); Las Positas as
   objectives reread step 2; Coastline and Golden West; College of the Redwoods' trial.
3. **For Sam, not a session call** (`cdc-restricted-tables-read-by-team-phrase-s660`, risk, proposed):
   `map_college_contacts`, `map_college_users` and `map_college_nudges` pass a row on `is_funding_reviewer() OR
   team_pass_ok()`, so any request carrying the team phrase reads staff contacts, MAP users and nudge authors. Whether
   a phrase should reach staff rosters is the `org-phrase-scope-auth` lane's call. Change no grant or policy here;
   if one changes, re-measure `kb/reference/restricted_table_access.json` in the same PR.
4. **Honors step 2 apply: HELD for Sam** (Sheet 200 card 1; steps in handoff 656, *First things* 3).
5. **Monterey Peninsula** 03653, 22098 and 39361: in the display build with no live row; its rules come first, with a person.
6. **Slice B of #3299** waits behind #3293. Next Sunday's contacts: Sequoias, Cuyamaca, Cosumnes River, De Anza through
   district pages (`map-users-student-contact`).
7. **Lanes with a NEXT this session did not take:** `commons` (data dashboard NEXT (2) waits on a definition of the
   per-college figure for MIS course matches and COE regional demand; #3360, the ETA mock-up, is design only and was
   the next clean item), `sierra-page-redesign` (#3159 is Sam's), `governance-team-enablement`, `library`,
   `cer-procedures`, `workplan-annual-goals`, `csm-workspace`.

## Session settings

One Opus 5.5 session works the queue itself: no conductor, no ultracode, no parallel workers unless Sam starts them.
The $40-per-college-per-run limits stand (extraction, and separately SLOs, PLOs and objectives), and so do the #3351
code gates. Merge only to `main`, confirmed with `git log origin/main`; one PR per college wave; two review rounds,
then Sam or COBIx. Filter any workflow-run listing by workflow and branch.

## Ledger (PR, state, next)

| PR | State | Next |
|---|---|---|
| #3368, #3369 | merged `cc46a624`, `4378804a` | none |
| #3367 | merged `1ac9f322` (S659) | First things 1 |
| #3284, #3293 | drafts; keep | First things 2, 6 |
| #2894 | Sam's | none |

## Decisions and pitfalls (`kb/receipts/cpl_memory_s660_rows_2026-11-15.sql`, RUN 16:23Z, 1 row, 1 log row)

`cdc-restricted-tables-read-by-team-phrase-s660` (risk, proposed). **Decided in session:** check the restricted
tables by their gates, not by "no anon or authenticated select". Four of the five grant select to both and gate rows
in RLS, so the literal list would have failed correctly protected tables. **Pitfalls worth keeping:**
the local `origin/main` ref can be days stale at session start (it read S652 here); `git fetch origin main` before
branching. A new file under `kb/` needs a Pages allowlist line, or the `lints` job fails (`pages_allowlist.test.js` B).
`cpl_memory.summary` is at most 400 characters, and `kind` has no `finding` (use `risk`).

## A light checkpoint: what it touched and what it skipped

Touched: the docs lint (76 vault-heavy paths, 5 oversized docs, 1 kb-note dialect, none in scope; the
handoff-drops-lane finding is answered in *First things* 1); this handoff; the index rebuild; the vault note. The lane
files moved inside #3368 and #3369. Skipped: §11 rows, lessons docs (no retired text), KB notes, the pipeline view, the
READMEs, the status files (no harvest run; `kb/status/` run logs untouched), the wiki touch. Wiki candidate for
`/wiki-ingest`: the restricted CDC tables and who reads each one.

## Let go

This session holds no PR subscription, no check-in and no artifact watch (#3368's and #3369's were dropped at merge).
The standing sheet stays [Open Asks Sheet 200](https://claude.ai/artifact/5ShC7pGgNuz9bJUhkdsc8Y) (current; card 1 waits on Sam).

Cost: not metered here. One pr-gate subagent (about 43,000 tokens); no paid runner call. Substantive PRs merged: 2
(#3368, #3369). Peak context about 290,000 tokens.

Greetings, you are SkyKnot (Session 661), see SkyPlover's handoff — `docs/session_661_handoff.md` (https://github.com/CPL-Initiative/cpl-project-tracker/blob/main/docs/session_661_handoff.md) — let's keep rolling with our queue.
