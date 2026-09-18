---
title: Session 276 handoff — v70 is live and answers the direct question first; read it, then finish the time limit
date: 2026-09-18
session: 275 (SkyCompass)
tags: [handoff, sierra, prospective-cpl, deploy, geography, route-time-limit]
status: current
---

# You are Session 276

Your moniker is **SkyGauge** — v70 knows how far apart two colleges are and
answers the direct question first; the work in front of you starts with
reading how it answers in production and ends with the retrieval time limit
proven and shipped.

Read in order: this file · [`lanes/sierra-retrieval-corpus.md`](reference/lanes/sierra-retrieval-corpus.md)
· `docs/cpl_assistant_lessons.md` (2026-09-18, S275) ·
`docs/kb-notes/methodology-an-absence-in-the-data-is-a-statement-about-the-data.md` ·
`docs/kb-notes/methodology-a-new-assertion-must-fail-in-the-shape-the-grid-counts.md` ·
[PR #1611](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1611) (merged) ·
[PR #1612](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1612) (open).

## ✅ WHERE THINGS STAND (as of 2026-09-18 07:20Z)

- **cpl-chat v70 is LIVE** (PR #1611 squash-merged as `415b8e45` on green
  `test`; deploy run 35318209938, 07:11Z; `list_edge_functions` reports
  version 70). Health run 35318272121 green at 07:12Z. ⚠️ **The post-deploy
  smoke (run 35318277251) failed ONE assertion — 7c's head check** — and its
  7c answer (`chat_interactions` `1be7b7d0`, 07:15Z) shows a real miss under
  it: the first sentence says *"Ask the CPL coordinator at Golden West College
  to review your CNA certificate against NURS G060N (Certified Nurse
  Assistant)"* — a course in the program that TRAINS the credential the
  visitor holds, in the county they named — and only reaches Long Beach's VN
  220 at character 854. Every other assertion on every mode passed (the
  opener check, the absence check, the precedent). The A/B candidate
  (`ac2f4905`) opened with VN 220; this is model variance the prompt must
  close, and it is YOUR FIRST BUILD (step 1 below).
- **What v70 carries:** ⭐ "nearest" has a distance — `COLLEGE_POINTS` (119
  campus points), `placePoint`, `cmpKm` inside every proximity band in all
  four lists, miles in every heading; the Orange County LVN lists lead with
  Long Beach City (24 km) and Rio Hondo (29). ⭐ Sam's three readings of v69:
  the first sentence names a course to ask about; a catalog absence is
  stated as the catalog's with the bridges named; no answer opens with a
  remark about the question; the guidance header scopes each directive to
  the question shape it names; a same-kind credential carries the precedent
  (Chaffey NURVN 414). The smoke fails every mode that opens with a remark,
  and 7c reads for the head (800 chars), the absence and the precedent.
- **A/B run 35316558438 (on `01103aec`):** candidate ALL MODES OK, no
  regressions, both new 7c checks fixed by the candidate. Its answer
  (`chat_interactions` `ac2f4905`): *"Ask the CPL coordinator at Long Beach
  City College to review your CNA certificate against VN 220 — Transition to
  Vocational Nursing (4 units)…"*, the bridges named, ~15 / ~20 / ~20 miles,
  Chaffey cited.
- **Sam's bar and his readings, verbatim:** `cpl_memory`
  `sam-cna-question-is-what-might-qualify-not-who-articulated-2026-09-18` and
  `sam-v69-orange-county-answer-three-misses-2026-09-18`.
- **Deployed on the standing authorization**, no fresh go asked
  (`s275-deployed-v70-under-standing-authorization-2026-09-18`) — Sam's
  2026-09-17 "apply and deploy… hone as we go" and his 2026-09-18 "fold
  solutions in as you work on the queue". If he wants a per-deploy go, that
  row is the one to supersede.
- **The route time limit is BUILT, not shipped:** PR #1612
  (`claude/skycompass-route-time-limits`, merged with the new `main` as
  `52835424`): one fetch wrapper on both supabase-js clients, every GET and
  rpc POST, 5,000 ms default, `CPL_ROUTE_TIMEOUT_MS` overrides with no
  deploy, `0` disables, table writes exempt, one log line per cut.
  `tests/sierra_route_time_limit.test.js` (22). Full suite and CI steps
  green on the pre-merge head; the merged head's suite ran at handoff time —
  confirm `test` on the pushed head.

## YOUR SEQUENCE

1. **The first course must come from the TARGET program (v71).** The LEAD
   bullet says "name a course first" and the place rule says "the visitor's
   place first", so v70 named an in-county CNA course. Fix in
   `buildProspectiveContext`: mark a program section whose TOP title shares
   its noun with a matched credential title (Certified Nurse Assistant ↔
   "Certified Nursing Assistant (CNA)", "Acute Care Nursing Assistant") as
   **BACKGROUND — the program that trains the credential the visitor holds;
   never the course to ask about**, render target programs first and
   background last, and say in the LEAD bullet that the first sentence names
   a course in a TARGET section. Pin it in `sierra_prospective_credit`
   (the CNA section is labeled background, the LVN section renders first)
   and add a 7c assertion that the first 300 characters carry no CNA course
   code (`VHLTH|CNA [0-9]|NURS G060N|NURSE N123`). Then A/B → merge on green
   `test` → deploy → health → smoke → logs, and read the 7c answer yourself.
   ⚠️ **The merge to `main` itself triggers a push-smoke against production**
   — dispatch the post-deploy smoke only after that run finishes, or two
   suites race (statement timeouts) and the second reads the wrong version.
   Then ask Sam to read it in a browser (`s275-sam-oc-answer-v70`).
2. **Ship the time limit.** On #1612: `test` green on the merged head, then
   `cpl-chat-preview-ab.yml` on the branch; read the grid AND the preview
   `function_logs` for `route time limit:` lines (a cut is a route to fix,
   never a setting to raise); merge on green `test`; deploy; health; smoke;
   logs. ⚠️ Never two suites at once — a push to a branch that touches
   `index.ts` or `smoke_test.sh` runs the smoke against production on its
   own; dispatch the A/B only when that run has finished.
3. **A named college should not keep the county band**
   (`s275-fable-college-anchor-pure-distance`): from Long Beach City College,
   Antelope Valley (110 km) still outranks Cypress (12 km) across the county
   line. A named place keeps its band; a named college should sort by
   distance alone. The geo-ranking test pins the old contract ("every
   LA-county college outranks Norco") — move the pin, do not delete it.
4. **Verify the campus points** (`s275-fable-verify-campus-points`) from a
   machine that can reach IPEDS; the sandbox cannot.
5. **Atomic catalog replace** (`s274-fable-offerings-replace-atomic`) —
   designed, not built.

## ⚠️ Sam's open calls — his, not yours

- **Which Orange County college runs an LVN entry program**
  (`s271-sam-lvn-oc`): he called "no OC colleges have LVN" flat wrong; the
  COCI export holds only the bridges. If one exists, trace the loader.
- **Re-scope guidance row 674923db** in the Training tab
  (`s275-sam-guidance-674923db-scope`) — the code scope is in v70.
- **The 381 stored garbled course rows** (`s274-sam-course-title-cleanup`).
- **Auto-deploy on merge** (since S272).

## What this session learned

- **A reader who knows the ground is the test the grid cannot run.** The
  smoke's bar was met and Sam read three misses a regex did not see; his
  readings became fixtures the same hour. KB note:
  `methodology-an-absence-in-the-data-is-a-statement-about-the-data`.
- **A new assertion must fail in the shape the grid counts.** The A/B
  compare matches four error shapes; the first run's new checks printed a
  fifth, and the grid read "0 failing" over SMOKE TEST FAILED. The tell was
  "0 failing" where "ALL MODES OK" should have been. KB note:
  `methodology-a-new-assertion-must-fail-in-the-shape-the-grid-counts`.
- **A precedence line is policy.** "Team guidance wins" let a directive for
  one question shape govern another; the header now says for which question.
- **The push-triggered smoke tests production with the branch's assertions**
  — red by construction until the deploy; say so once on the PR.
- **Node keeps no event loop alive for `AbortSignal.timeout`**, so a test of
  a cut needs a keep-alive handle or it exits 0 with no report.
- **My own clock drifted ahead of the wall clock** for twenty minutes and I
  read two running suites as a production hang; `date -u` before inferring
  from timestamps.

## Carryover

| Item | State |
|---|---|
| v70 deploy → health → smoke → logs | deploy 35318209938 ✅ · health 35318272121 ✅ · smoke 35318277251 ❌ one assertion (7c head — the in-county CNA course led; step 1) |
| Sam reads v70's Orange County answer | asked — `s275-sam-oc-answer-v70` |
| Route time limit (#1612) | built + merged with main; A/B, merge, deploy, logs — step 2 |
| College anchor: pure distance | designed — `s275-fable-college-anchor-pure-distance` |
| Verify `COLLEGE_POINTS` against IPEDS | needs a machine with egress — `s275-fable-verify-campus-points` |
| Atomic catalog replace | designed, not built — `s274-fable-offerings-replace-atomic` |
| Guidance row 674923db re-scope | NEEDS SAM — `s275-sam-guidance-674923db-scope` |
| Orange County LVN entry program | NEEDS SAM — `s271-sam-lvn-oc` |
| 381 garbled course rows | NEEDS SAM — `s274-sam-course-title-cleanup` |
| Auto-deploy on merge | NEEDS SAM (from S272) |
| Health cron fires ~4/day against a cron asking for 8 | open, observed not diagnosed (no scheduled run between 04:34Z and 07:11Z) |
| The 15 strict-mode type errors in `index.ts` | pre-existing on `main`; identical on every branch this run |
| The 495-row CTE disagreement · `verify_search_exhibits_v2.sql` missing · matcher vocabulary · Engineering homograph · ASCCC areas · Credential Engine | unchanged (two moved to the deferred list of the To-Do feed) |

## ⚠️ Safety patterns to honor

- **`npm test` IS NOT THE SUITE** — run the 46 python/shell steps of
  `js-tests.yml` too (parse the workflow with PyYAML; `npm install` first or
  the three jsdom steps fail on a missing module). The full suite takes
  ~15 minutes here; run it in the background and read the log.
- **Rebuild the dependency map** after any edit that moves lines; regenerate
  `sierra_rule_defaults.js` after any rule-text edit (`kb/_build_sierra_rule_defaults.py`).
- **A `check_suite.completed` wake can name a SUPERSEDED head**; re-read
  `get_check_runs` on the current head; `test` green there before every merge.
- **Read the candidate's own answer in `chat_interactions`**, not only the
  grid — and read the grid's HEADER: "0 failing" is not "ALL MODES OK".
- **Never two suites at once against production** (statement timeouts).
- **NEVER INDEX `coci_college_programs`** (measured, #1602). A signature
  change is drop-then-create, one migration, grants restored.
- Rule 4 (both HTMLs) · Rule 5 (never force-push `main`) · Rule 10 (Supabase
  only through MCP; the stop hook's "unpushed" nag is the documented false
  positive — never push to silence it).

## KB notes added this run

- `methodology-a-new-assertion-must-fail-in-the-shape-the-grid-counts`
- `methodology-an-absence-in-the-data-is-a-statement-about-the-data`

---

*Greetings, you are Sky**Gauge** (Session 276), see Sky**Compass**'s handoff —
`docs/session_276_handoff.md` — let's keep rolling with our queue.*
