---
title: Session 277 handoff — v72 is live (the quick list, the flyer, the precedent in the block, "catalog data"); next, the crosswalk beyond the CNA and the measurements the queue still owes · part two, the SkyView lane (shareable, answers every drop)
date: 2026-09-18
session: 276 (SkyGauge) and 276 parallel (SkyLevel)
tags: [handoff, sierra, prospective-cpl, deploy, quick-list, flyer, plain-words, skyview, ccr, generated-artifacts, read-only]
status: current
---

# You are Session 277

Your moniker is **SkyCaliper** — v72 gave Sierra a counselor's reflex (what
you hold, what you want, what to ask about, what else is open to you), and
what the queue owes next is measurement: how the new route costs under load,
whether a named college should keep the county band, whether the campus
points are right.

⚠️ **TWO SESSIONS RAN 2026-09-18 IN PARALLEL, AND BOTH WROTE THIS FILE.** This
is the merged handoff. Part one (this half) is the **Sierra** lane, written by
SkyGauge; part two, below the rule near the end, is the **SkyView** lane,
written by SkyLevel and merged from #1621 and #1622 with its headings
demoted and one sentence adjusted for the name. SkyLevel's half called you **SkyLedger**; the
sign-off line Sam pastes names **SkyCaliper**. Answer to either, carry
SkyCaliper forward. The SkyView queue (`s277-*`) sits in the To-Do feed beside
the Sierra one, and the merged feed keeps the Sierra session's `_status`.

Read in order: this file · [`lanes/sierra-retrieval-corpus.md`](reference/lanes/sierra-retrieval-corpus.md)
· `docs/cpl_assistant_lessons.md` (2026-09-18, S276) ·
`docs/kb-notes/methodology-typical-is-a-count-of-colleges-across-the-whole-catalog.md`
· `docs/kb-notes/methodology-an-inside-term-leaks-through-the-context-not-the-prose.md`
· [PR #1617](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1617) (merged, v72).

## ✅ WHERE THINGS STAND (as of 2026-09-18 17:35Z)

- **cpl-chat v72 is LIVE** (PR #1617 squash-merged as `fc3ebe3` on green
  `test`; deploy run 35370070548 byte-verified; `list_edge_functions`
  version 72 at 16:43:19Z). Health run 35370311547 green at 16:45Z. The
  merge-triggered smoke (run 35370054033, started before the swap) passed
  every mode including the new 7c checks; the dispatched clean run:
  35371403392 (16:56Z) failed ONE mode, 9 (the multi-college NCCER question):
  curl's 90 s ceiling, 11,463 bytes received. The function finished that
  answer at ~100 s (`chat_interactions` `6547d030`, 17:02:17Z, 1,117 tokens;
  El Camino named and not dismissed, so both mode-9 assertions hold on the
  completed text) while the modes on either side streamed at 40–100 tokens/s:
  one slow generation, and mode 9 had passed on this commit at 16:42Z, so the
  one sanctioned re-run went out: run 35373228305 (17:15Z). It failed mode 7c
  alone, for a measured reason outside the function: the scheduled
  `map-custom-report-load.yml` (run 35372830989, cron 17:11Z) posted 629,232
  rows to `stg_map_student_credit` from 17:13:41 to 17:16:37Z, single requests
  ran up to 125 s at the gateway, Postgres canceled 20 statements on its
  timeout (15 of them at 17:19), and the function logged some thirty route
  cuts between 17:16 and 17:21Z (`program_typical_courses`,
  `chatbox_college_courses`, `search_college_programs` among them), so 7c's
  answer (`e2a6aba3`, 17:20:19Z) came without its block, as designed. Mode 9
  passed in 25 s; every mode after 17:21Z passed. The loader's job reported
  HTTP 504 on the promotion at 17:18:58Z and printed "rolled back, live
  unchanged" — and `map_data_loads` row 35 shows the promotion COMMITTED at
  17:16:52Z (629,232 student rows, 221,324 CR-unit rows, reconciled): the
  gateway gave up at 60 s, the transaction did not. Live carries today's data;
  the job's red is a misreport (its first after 38 green runs). A third clean
  run in a quiet window, 35374928638 (17:32Z): every answer assertion passed,
  7c's eleven included (quick list, flyer, Chaffey, the course-level first
  sentence); its one failure was the smoke's own anon probe of
  `program_typical_courses` (rows=0 at 17:35:31Z — the anon key's 3 s statement
  timeout, while a one-row `map_colleges` read took 3.1 s at 17:38Z). The
  function logged two cuts in that run (`search_college_programs` 17:34:04Z,
  `program_typical_courses` 17:34:57Z on the Harbor NCCER question), both
  failed safe. So v72's answers are verified three times over (16:42Z full
  pass; 17:35Z 7c full pass); the smoke's anon probe and the function's
  fan-out share one PostgREST pool, and that is the open item (sequence 9).
  The first clean run had shown the shape in miniature: three 5 s route cuts
  during mode 8 (17:00:08–14Z) that failed safe.
  `function_logs` 16:43–16:50Z: 0 route cuts, 0 EMPTY
  ANSWER, 0 unavailable, 0 errors; `program_typical_courses` 5 of 5 calls 200.
- **What v72 does, on Sam's two asks** (verbatim in `cpl_memory`
  `sam-quick-list-and-flyer-a-counselor-at-her-fingertips-2026-09-18` and
  `sam-never-say-coci-say-catalog-data-2026-09-18`): after the direct answer,
  a two-column table of the typical courses in the held program beside the
  typical courses in the target program — statewide, counted in colleges,
  because the visitor never named their CNA college (`program_typical_courses()`,
  `chatbox/supabase_program_typical_courses.sql`, verify file beside it); the
  PRECEDENT ON RECORD rendered inside the block from the recs already fetched
  (Chaffey NURVN 414, three of four v71 answers had dropped it); the FLYER —
  `RELATED_PROGRAMS`, Sam's list keyed by the CNA program 1230.30, attributed,
  checked against the catalog data (statewide count, in-place colleges or the
  nearest with distance, typical first courses); every course line carries its
  college; "COCI" swept from every rendered string, the always-on catalog rule
  carries the ban, the smoke fails any answer that says it.
- **Production's answer to Sam's question** (`chat_interactions` `43fa4d62`,
  16:45:44Z): VN 220 / VN 61 / VOC VN101 in the first paragraph, the absence
  as the catalog data's with the bridges, the table with college counts, the
  precedent, the request framing, "Also worth asking about with a CNA". No
  COCI. One wording to watch: the model called Chaffey's NURVN 414 "not an
  LVN-course match specifically" — it is in Chaffey's LVN program (step 2).
- **The first version of the RPC timed out under load** — a regex chain per
  row and a quadratic example-course subquery: 33 s on the 47 health programs,
  HTTP 500 to the smoke and the preview function while two suites ran.
  Rewritten (word-array normalizer, linear example course): 0.9 s on the same
  47 programs; the verify file's A9/A10 time both shapes. The lesson is the
  programs-route one again: cost is part of correctness, and the timing check
  belongs at the shape that fails.
- **Deployed on the standing authorization**, no fresh go asked (same footing
  as `s275-deployed-v71-target-program-first-2026-09-18`).
- **Sam's mid-session asks:** fewer SQL prompts → `.claude/settings.json`
  allows the Supabase read tools (effective at the next session start; the
  "Allow once" prompts are the auto-mode classifier, which an allowlist does
  not change, and the classifier also refused a few shell commands as
  self-modification). He also flagged a parallel **SkyView session**; its
  PR #1618 merged and was merged into this branch; its PR #1619 merged at
  17:01Z (`1d65115`) and was merged into this branch too: `test` on main at
  `fc3ebe3` was red on `ccr_skyview_read_only` (run 35370054088; the cron
  commit `7aabe52` had rebuilt `prototype/skyview.html` without the band),
  this docs PR inherited the red on its first push, and #1619 — the band in
  the sources — made main's `test` green again (run 35371906271).
- **A measured note for the SkyView lane:** #1619's commit message says
  #1617's merge removed the read-only band from `prototype/skyview.html`.
  `git log -- prototype/skyview.html` on main shows the band left in
  `7aabe52`, the daily dashboard cron commit between #1618 and #1617 (the
  cron rebuilds the page from sources that did not carry it; 36 deletions);
  #1617 did not touch the file. #1619's fix (the band in the sources) is the
  right one either way. It merged at 17:01Z (`1d65115`) and main's `test` is
  green again.

## YOUR SEQUENCE

1. **Ask Sam to read v72's Orange County answer in a browser**
   (`s276-sam-oc-answer-v72`) — the quick list and the flyer are his shape;
   whether they read the way a counselor would say them is his call. No
   session can; the sandbox is egress-blocked from `*.supabase.co`.
2. **The precedent line names its program** (`s276-fable-precedent-names-its-program`):
   when a precedent's `example_course` matches a course in a target section,
   `buildPrecedentLines` can say so (*"NURVN 414 — in Chaffey's Licensed
   Vocational Nursing program"*), which closes the "not an LVN-course match"
   misreading. Pin in `sierra_prospective_credit` block 11; A/B before deploy.
3. **Extend `RELATED_PROGRAMS` beyond the CNA** — the team's list, never an
   inference from a code (`s276-sam-related-programs-next-list`, NEEDS SAM).
   The mechanism is ready: an entry keyed by the held program's TOP with
   aliases (the visitor's words) and targets; `heldProgramTops` falls back to
   an alias when the block has no BACKGROUND section. Obvious candidates for
   him to confirm or strike: EMT → Paramedic, Fire Technology; LVN → RN; Medical
   Assistant → LVN, Phlebotomy; Pharmacy Technician → nursing pharmacology.
4. **Measure the two slow routes under load** (`s275-fable-programs-route-latency`):
   every `route time limit:` line in `function_logs` over a week, now for
   `search_college_programs` AND `program_typical_courses`; the query moves or
   the limit does, never an index on `coci_college_programs` (#1602).
5. **A named college should not keep the county band**
   (`s275-fable-college-anchor-pure-distance`): from Long Beach City College,
   Antelope Valley (110 km) still outranks Cypress (12 km). Move the
   geo-ranking test's pin, do not delete it.
6. **Verify the campus points** (`s275-fable-verify-campus-points`) from a
   machine that can reach IPEDS; the sandbox cannot.
7. **Atomic catalog replace** (`s274-fable-offerings-replace-atomic`) —
   designed, not built.

8. **Decide what the smoke's 90 s ceiling means when the answer completes
   later.** Run 35371403392 failed mode 9 at curl's ceiling while the
   function finished the answer at ~100 s (`chat_interactions` `6547d030`).
   A student waiting 90 s has left, so the ceiling may be the right bar,
   but today the smoke cannot tell a slow generation from a dead function.
   Two small options: on a curl timeout, read the interaction row for the
   question (the smoke holds the anon key; check what that key can read), or
   have the SSE parser print the stream's token rate so the log says which
   it was. Decide before the next hone; no code moved for it this session.

9. **The loader's 504 is a misreport, and the smoke's probe shares the pool.**
   Today's `map-custom-report-load.yml` run (35372830989) printed "PROMOTION
   REFUSED (HTTP 504). Live is UNCHANGED — the whole transaction rolled back"
   while `map_data_loads` row 35 shows the promotion committed at 17:16:52Z
   (629,232 student rows, reconciled). A gateway timeout ends the HTTP call,
   never the Postgres transaction, so the loader must read `map_data_loads`
   back (for a minute or two) before it declares a rollback; until then a red
   run there means "read the table". Do not re-dispatch it for today. The
   same minutes cost the smoke re-run its 7c (route cuts) and the third run its
   anon probe of `program_typical_courses` (3 s statement timeout while the
   function's own fan-out of some thirty reads per request held the PostgREST
   pool). Two small moves: give the smoke's probe the two-program shape and a
   retry, and measure the pool under one request
   (`s275-fable-programs-route-latency` now includes the typical-courses
   call). The loaders own 17:06–17:20Z (credential-catalog-sync 17:06,
   custom-report load and college-briefing-publish 17:11); dispatch smokes
   clear of it. The lane is `lanes/map-custom-reports.md`.

## ⚠️ Sam's open calls — his, not yours

- **Which Orange County college runs an LVN entry program**
  (`s271-sam-lvn-oc`): the catalog data holds only the bridges.
- **Re-scope guidance row 674923db** (`s275-sam-guidance-674923db-scope`).
- **The 381 stored garbled course rows** (`s274-sam-course-title-cleanup`).
- **Auto-deploy on merge** (`s272-sam-autodeploy-ruling`).
- **The next `RELATED_PROGRAMS` list** (`s276-sam-related-programs-next-list`).

## What this session learned

- **"Typical" is a count of colleges across the whole catalog.** Normalize the
  faculty-typed title, keep the level words, count `distinct college`, carry
  the program's college count as the denominator, aggregate in the database
  (PostgREST stops at 1,000 rows and says nothing). KB note:
  `methodology-typical-is-a-count-of-colleges-across-the-whole-catalog`.
- **An inside term leaks through the context, never the prose.** The rules
  had banned COCI since v22; the section headers said it. Rename where
  retrieval renders it, keep the ban, guard the answer in a counted shape.
  KB note: `methodology-an-inside-term-leaks-through-the-context-not-the-prose`.
- **Cost is part of correctness, again.** 65 ms on two programs, 33 s on
  forty-seven; the API returned 500 and the answer lost its quick list
  silently. Time the shape that fails, in the verify file.
- **Curated knowledge is data with a name on it.** The flyer's crosswalk is
  Sam's list, attributed in the block; the catalog data checks every line.

## Carryover

| Item | State |
|---|---|
| v72 deploy → health → smoke → logs | deploy 35370070548 ✅ · health 35370311547 ✅ · merge-triggered smoke 35370054033 ✅ · clean smoke 35371403392 ✗ mode 9 only (curl's 90 s ceiling; the answer completed at ~100 s) · re-run 35373228305 ✗ 7c only (route cuts during the 17:13–17:21Z student-credit load) · third run 35374928638 ✗ the smoke's anon probe only (rows=0 at the 3 s statement timeout; every answer assertion passed, 7c's eleven included) · logs: two fail-safe cuts in that run |
| MAP Custom Report load, 17:11Z cron | job red: the promotion call got HTTP 504 and the job printed "rolled back, live unchanged" — yet `map_data_loads` 35 shows it committed at 17:16:52Z with today's rows, reconciled. Live is current; do NOT re-dispatch. The loader needs a read-back after a gateway timeout (sequence item 9) |
| Sam reads v72's Orange County answer | ask — `s276-sam-oc-answer-v72` |
| The precedent line names its program | designed — `s276-fable-precedent-names-its-program` (step 2) |
| `RELATED_PROGRAMS` beyond the CNA | NEEDS SAM — `s276-sam-related-programs-next-list` |
| Programs + typical routes under load | measure — `s275-fable-programs-route-latency` |
| College anchor: pure distance | designed — `s275-fable-college-anchor-pure-distance` |
| Verify `COLLEGE_POINTS` against IPEDS | needs a machine with egress — `s275-fable-verify-campus-points` |
| Atomic catalog replace | designed, not built — `s274-fable-offerings-replace-atomic` |
| Guidance row 674923db re-scope · Orange County LVN entry program · 381 garbled rows · auto-deploy on merge | NEEDS SAM |
| SkyView read-only band | restored from the sources by the other session's PR #1619, merged 17:01Z (the cron commit `7aabe52` had removed it, measured) |
| Health cron fires ~4/day against a cron asking for 8 | open, observed not diagnosed |
| The 15 strict-mode type errors in `index.ts` | pre-existing on `main`; identical set on this branch |

## ⚠️ Safety patterns to honor

- **`npm test` IS NOT THE SUITE** — run the workflow's python/shell steps too
  (`npm install` first; ~15 minutes; background it).
- **`deno check` needs a cwd with no `node_modules`** — copy `index.ts` to a
  scratch directory with `{"nodeModulesDir":"auto"}`; compare the error SET
  (15 on `main`), never the count.
- **Rebuild the dependency map** after any edit that adds a read; regenerate
  `sierra_rule_defaults.js` after any rule-text edit; a floor lives in
  `tests/check_floor.json` → `files`.
- **A `check_suite.completed` wake can name a SUPERSEDED head**; re-read
  `get_check_runs` on the current head; `test` green there before every merge.
- **Read the grid AND the candidate's own answer**; "0 failing" is not "ALL
  MODES OK". The push-triggered smoke tests PRODUCTION with the branch's
  assertions and is red by construction until the deploy — say so once on
  the PR.
- **Never two suites at once against production** — a parallel session's
  push-triggered smoke counts; wait it out before dispatching.
- **The docs-audit artifacts conflict on every parallel merge** — regenerate
  them with `kb/_docs_audit.py` on the merged tree, never pick a side.
- **NEVER INDEX `coci_college_programs`** (measured, #1602).
- Rule 4 (both HTMLs) · Rule 5 (never force-push `main`) · Rule 10 (Supabase
  only through MCP; the stop hook's "unpushed" nag after a merge is the local
  branch reset to main — never push to silence it).

## KB notes added this session

- `methodology-typical-is-a-count-of-colleges-across-the-whole-catalog`
- `methodology-an-inside-term-leaks-through-the-context-not-the-prose`

---

*Greetings, you are Sky**Caliper** (Session 277), see Sky**Gauge**'s handoff —
`docs/session_277_handoff.md` — let's keep rolling with our queue.*
- The SkyView lane (#1621): `docs/kb-notes/methodology-a-generated-file-accepts-your-edit.md`.

---

## Part two — the SkyView lane (SkyLevel's handoff, merged from #1621 and #1622)

SkyLevel's half named you **SkyLedger** (the note at the top of this file keeps one name, SkyCaliper) — SkyView now says what it is and answers what you
do to it, and the work in front of you is the write that makes a merge stick.

⚠️ **TWO SESSIONS RAN 2026-09-18 IN PARALLEL.** This handoff is the **SkyView**
lane, written by SkyLevel, which had no handoff of its own (Sam: *"this session I
don't have a typical handoff to give you"*). The **Sierra** lane ran beside it as
SkyGauge and shipped v72 in [PR #1617](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1617);
its state is in [`lanes/sierra-retrieval-corpus.md`](reference/lanes/sierra-retrieval-corpus.md)
and `docs/cpl_assistant_lessons.md`, and its own carryover is in the To-Do feed.
If SkyGauge also wrote this file, **merge the two halves rather than picking one**.

Read in order: this file · [`lanes/skyview-ccr-interface.md`](reference/lanes/skyview-ccr-interface.md)
· [`reference/skyview_invariants.md`](reference/skyview_invariants.md) (before any code)
· `docs/ccr_atlas_lessons.md` (2026-09-18) ·
[`methodology-a-generated-file-accepts-your-edit`](kb-notes/methodology-a-generated-file-accepts-your-edit.md)
· [PR #1618](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1618) (merged)
· [PR #1619](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1619) (merged).

### ✅ WHERE THINGS STAND

- **SkyView states that it is read only**, in a band under the control row, inside
  `#u-full` so it survives full screen and clear of the legend so folding cannot
  take it: *Read only. Moves stage in this browser alone. Signed-in curators save
  in COBI's Common Course Reference tab.* 29px at 1440×900, 47px at 390×844, no
  horizontal scroll. The three older statements of the same fact all sat in chrome
  `body.u-solo` hides — the footer, `#prov`'s title attribute, and a comment.
- **The page still writes NOTHING.** One POST in the whole file (the Ask calling
  `cpl-chat`, a drafting surface that skips its `chat_interactions` insert), no
  `rest/v1` call at all. `tests/ccr_skyview_read_only.test.js` (21 checks) pins
  both the placement and the no-write claim, so a later change cannot quietly
  falsify a statement the page was shared on.
- **A drop that stages nothing now answers.** `pointerup` had one exit returning
  in silence — a carried course released on `drag.fromNode`, which for a course
  picked up from a member square is the whole clustered identity. That silence was
  Sam's *"stops responding on the second or third merge"*. `CLICK_SLOP` is 8px
  against the 5px a carry needs to start; the panel's Drag… button has no press
  point, so its travel reads infinite and is never a click.
- **A merged course queues against its parent** on its own arc, drawn as a circle
  rather than a ring star, labeled *staged, awaiting a curator* — Sam's *"as if
  it's in line for the next remint procedure"*.
- ⚠️ **`prototype/skyview.html` IS GENERATED, and #1618 shipped into it.** The band
  was written into the artifact, passed a browser check, a jsdom suite, review,
  merge and deploy — and #1617's rebuild from the sources stripped it out of main
  within the hour. Everything now lives in `prototype/ccr_universe.js` and
  `prototype/ccr_atlas_v1.html`; `tests/skyview_built_from_source_test.py` names
  the source file and line of the first divergence, in `js-tests.yml` **and** in
  `scripts/check_generated.sh`, which had listed every other generated file and
  not this one.

### YOUR SEQUENCE

1. **Merge execution from SkyView** (`s277-fable-skyview-merge-execution`).
   ✅ **SAM SAID YES, 2026-09-18** (`cpl_memory` `sam-yes-skyview-saves-a-merge-2026-09-18`),
   and asked that the build happen in the next session. The write already exists
   and is governed: `unified_courses.js` POSTs `kb_curation` with `field:
   "merge_into"` under a magic-link reviewer session with RLS per row, and
   `table:kb_curation` maps to governance row DR-04. So the build is the
   `cpl_session.js` keeper (31 modules already read a reviewer session), a Save
   control on the staged list, the same POST, the undo that already exists as a
   row delete, and **one entry in `kb/governance_surface_map.json` with its
   reason** — a read-only surface gaining writes is a decision-rights change under
   Rule 10 (a3). ⚠️ **Two things the yes carries that are easy to miss.**
   `tests/ccr_skyview_read_only.test.js` asserts the page has exactly one non-GET
   request and no `rest/v1` call at all — that guard was written to resist a
   casual change, so update it deliberately rather than route around it. And the
   band's sentence **stops being true for one audience**: *Moves stage in this
   browser alone* is false for a signed-in curator and still true for everyone
   else, including the people Sam is sharing the page with, whose writes RLS
   refuses. Make the band conditional on session state, and keep the
   non-reviewer's version accurate — he shared the page on that sentence.
2. **Re-mint: compose and approve in SkyView, land in the harness**
   (`advice-remint-request-not-execution-in-skyview-2026-09-18`). Sam asked for
   advice on the shape and has it; the pick is still his.
   ⭐ **Two different things are called re-mint.** A corpus re-key (the 72,481-id
   migration) is a batch migration. A principled re-mint of SPECIFIC identities
   is what a curator wants and is expressible as a request — build that one.
   ⭐ **Smallest first step: the blast-radius view ALONE, no approve button.** It
   is read-only, needs no governance change, is useful by itself, and is the hard
   part of the UI. ⚠️ Two constraints: every re-mint appends to
   `kb/alias_chain.py`, and SkyView must resolve stored ids THROUGH the chain or
   the map will itself report dead rows that are alive (Rule 7); and Rule 7
   **re-locks** at faculty publication, so gate the approve step behind a flag
   rather than building it to be torn out.
   ⚠️ **A browser cannot do the landing, and the reason is mechanical, not
   caution:** `docs/coursecontrolnumber_remint.md` requires producer and consumer
   in ONE git commit (new export against old kb collapses Phase B to 0 and member
   rows to 76, measured), then the gated Supabase re-key inside a window that must
   close before the 10:17 UTC cron, because the workflow runs `_apply_curation.py`
   before export. Build the request, the dry-run's blast radius and the approval
   in SkyView; dispatch the playbook to land it.
3. **The loner eclipse** (`s277-fable-skyview-loner-eclipse`) — measured and
   deliberately unfixed. 23 of 24 loners already resolve correctly with their
   parent open; 37 of 37 focused member stars resolve to that member. Reopen only
   if Sam hits it again.
4. **`.claude/settings.json` — the `execute_sql` guard**
   (`advice-execute-sql-allowlist-needs-a-pretooluse-hook-2026-09-18`). Sam asked
   for advice and has it; the pick is his. #1617 allowlisted five Supabase tools;
   four are read-only by construction, and `execute_sql` runs arbitrary SQL
   against the project holding `map_student_credit` (537,908 student-grain rows).
   **Rule 10's write discipline is doctrine and the permission prompt was its only
   mechanism.** Recommended: a **PreToolUse hook** on `mcp__Supabase__execute_sql`
   that passes reads and blocks write verbs — it keeps the speed the Sierra lane
   needs and restores enforcement, and this repo already runs hooks from
   `.claude/settings.json`. ⚠️ Say the limit plainly when you build it: a pattern
   over SQL is a guardrail against accident, not a security boundary. Stronger
   alternative if he wants it: a Postgres role with no write grants. Either way
   the other four stay, and the read-only GitHub MCP tools are a safe addition
   now that the block exists on `main`.

### ⚠️ Sam's open calls — his, not yours

- ✅ **Does SkyView save a merge itself — ANSWERED YES** (2026-09-18). Build it.
- **The re-mint shape** and **the `execute_sql` guard** — he has the advice above
  and both picks are still his. Do not build either on your own.
- **Statewide exhibits on the sky** (lane item ①) — his 2026-09-10 ask cut off.
- **The opening width on a phone** (lane item ③) — a ruling, not a sweep.
- The Sierra lane's own open calls are in the To-Do feed and its lane file.

### What this session learned

- **A generated file accepts your edit, and that is what makes it dangerous.**
  Every signal fires green and the failure arrives later from somewhere else. KB
  note: `methodology-a-generated-file-accepts-your-edit`. The rule already existed
  — `skyview_invariants.md` says *"never hand-patch `skyview.html`"* — and reading
  the lane's pointer to that file is not the same as opening it. Knowing is not
  the defense; the check is.
- **Silence is a bug report.** "Stops responding" was not a dead handler; it was a
  handler that did the right thing and said nothing, leaving a stale hint claiming
  the reader still carried a course. Every exit from a gesture needs an account.
- **Measure before re-ordering a rule that already works.** The hit-test fix was
  tempting and would have traded 37 of 37 for 23 of 24.

### Safety patterns to honor

- `prototype/skyview.html` is generated — edit the sources, run
  `python3 prototype/build_ccr_atlas.py`, and run `bash scripts/check_generated.sh`
  LAST before a push.
- `npm run sweep` and `npm run a11y skyview` in the same PR as any SkyView change.
- The band's claim is load-bearing: Sam shared the page on it.
