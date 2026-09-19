---
title: Session 276 handoff — v71 is live, the first course is in the target program, the time limit ships; next, the precedent moves into the block
date: 2026-09-18
session: 275 (SkyCompass)
tags: [handoff, sierra, prospective-cpl, deploy, route-time-limit, a-b]
status: current
superseded: true
superseded_by: session_279_handoff.md
---

# You are Session 276

Your moniker is **SkyGauge** — v71 measures what the visitor said they hold
and answers from the program they want to enter; the work in front of you
starts with reading how it answers in production and ends with the one
sentence it still drops (the precedent) rendered where the model reads the
courses.

Read in order: this file · [`lanes/sierra-retrieval-corpus.md`](reference/lanes/sierra-retrieval-corpus.md)
· `docs/cpl_assistant_lessons.md` (2026-09-18, S275, through "After the
checkpoint") · `docs/kb-notes/methodology-the-record-cannot-say-which-credential-is-held.md`
· [PR #1614](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1614) (merged, v71)
· [PR #1612](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1612) (merged, the time limit)
· [PR #1615](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1615) (merged, the compare's exit code).

## ✅ WHERE THINGS STAND (as of 2026-09-18 08:45Z)

- **cpl-chat v71 is LIVE** (PR #1614 squash-merged as `7d23be6f` on green
  `test`; deploy run 35324360975, 08:26Z; `list_edge_functions` reports
  version 71). Health run 35324519410 green at 08:28Z. The post-deploy
  smoke: run 35324991804 **green** at 08:40Z (ALL MODES OK; the merge-triggered run
  35324344960 that started before the function swapped is the mixed one). Its
  Orange County answer (`22458f93`, 08:37Z) opens *"Ask the CPL coordinator
  at Long Beach City College to review your CNA certificate against VN 220 —
  Transition to Vocational Nursing (4 units)"* (VN 220 at character 93), no
  CNA course code, the absence as the catalog's with the bridges named,
  Chaffey cited.
- **What v71 does:** for "I have a CNA certificate … what CNA courses match
  LVN courses in Orange County", the first sentence names Long Beach City's
  VN 220 (A/B candidate answer `f23958c1`: *"Ask the CPL coordinator at Long
  Beach City College to review your CNA certificate against VN 220 —
  Transition to Vocational Nursing (4 units)…"*), then Rio Hondo's VN 61 and
  Mt. San Antonio's VOC VN101; the catalog absence is stated as the catalog's
  with the three bridges named; the CNA program's own courses come last under
  a **BACKGROUND** heading. The mechanism is retrieval, never prose:
  `heldCredentialPhrases` reads the visitor's holding phrase,
  `pickHeldTitles` keeps the held titles and their kind, and
  `buildProspectiveContext` marks and reorders — because the credential
  record matches the target's credential too (`search_credentials_any('lvn')`
  ranks the LVN license first of six) and v70's intro had named it as held.
  Fail-safe: no holding phrase, or a phrase every section answers to, marks
  nothing. Pinned by `sierra_prospective_credit` block 10 (131) and smoke 7c
  (no CNA course code in the first 300 characters; the head read at 400).
- **The route time limit SHIPPED with v71** (#1612): every GET and rpc POST
  on both supabase-js clients, 5,000 ms default, `CPL_ROUTE_TIMEOUT_MS`
  overrides with no deploy, `0` disables, table writes exempt, one log line
  per cut. **Three cuts measured in 35 minutes, all `search_college_programs`
  over 5 s, all failed safe:** 08:18:05Z (the v71 preview, mode 9), 08:29:54Z
  and 08:37:31Z (production v71 under the two post-merge smokes) — the
  answers passed every assertion each time. Step 3 is the measurement. The programs rule is `appliesWhen: "always"`, so a cut
  read still lists `programs` in `rules_fired`.
- **A/B run 35322736555:** PRODUCTION 3 failing, PREVIEW 1 failing, no
  regressions; fixed by the candidate: both 7c head checks. ⚠️ **Failing on
  both sides: the Chaffey precedent** — three of the last four Orange County
  answers (two candidates, one production) said no college had articulated a
  CNA credential against an LVN course while the credential record carried
  Chaffey's NURVN 414 (Acute Care Nursing Assistant, 6 units). That is YOUR
  FIRST BUILD (step 1), with the misattribution the post-merge smoke caught:
  v71 opened one answer with Mt. San Antonio's VOC VN1 attributed to Golden
  West (`39a328be`; memory row `s275-v71-course-detached-from-its-college`).
- **Two instruments fixed this run.** The A/B compare's exit code was
  `tee`'s, so run 35320175425 printed a REGRESSION and concluded success —
  #1615 (`d1f0b8de`) sets `pipefail`; the v71 A/B ran on the branch's copy
  of the workflow, so **the first run whose exit code carries the grid is
  yours.** And `tests/check_floor.json` keeps floors under `files`; a
  top-level key is ignored (one sat at 60 for sessions).
- **Deployed on the standing authorization**, no fresh go asked
  (`s275-deployed-v71-target-program-first-2026-09-18`, same footing as
  `s275-deployed-v70-under-standing-authorization-2026-09-18`).
- **Sam's bar and his readings, verbatim:** `cpl_memory`
  `sam-cna-question-is-what-might-qualify-not-who-articulated-2026-09-18`
  and `sam-v69-orange-county-answer-three-misses-2026-09-18`.

## YOUR SEQUENCE

1. **The college goes on every course line, and the precedent goes IN the
   block (`s275-fable-precedent-in-the-block`).** Two misses in v71's own
   answers, both in the context: (a) `chat_interactions` `39a328be`
   (08:29Z, production) opened *"At Golden West College, ask the CPL
   coordinator to review your CNA certificate against VOC VN1 / Vocational
   Nursing 1"* — VOC VN1 is Mt. San Antonio's, Golden West teaches no LVN
   course; the block lists courses under a college heading with no college
   on the line, and the programs section shows Golden West's LVN-to-RN
   programs in the county, so the model took the place's college and a
   course from the target list. (b) Three of the last four answers said no
   college had articulated a CNA credential against an LVN course while the
   credential record carried Chaffey's NURVN 414. In
   `buildProspectiveContext`: render each course line with its college
   (`Mt. San Antonio College · VOC VN1 — Vocational Nursing 1`); compute the
   precedent line for the held titles from the credit recommendations already
   fetched for the record (adopter college, course, units) and render it
   under the TARGET program's heading, "none on record" in words when there
   is none; the LEAD bullet says college and course come from the SAME
   heading. Pin both in `sierra_prospective_credit` (block 11). Smoke 7c: an
   Orange County college name within ~120 characters before an LVN course
   code in the first 300 characters fails (no Orange County college teaches
   one) — `answer_head_must_not_match -i 300 "(golden west|cypress|saddleback|santa ana|santiago canyon)[^.]{0,120}(VN[ -]?[0-9]|VOC VN|NURVN|VNRS|NURS[ -]?(102|125))"`;
   and add `VN1\b` / `Vocational Nursing 1\b` to the head alternation, which
   is why that run went red (for the wrong reason). Then A/B → read the grid
   AND the answers → merge on green `test` → deploy → health → smoke (only
   after the merge-triggered main smoke finishes) → logs.
2. **Ask Sam to read v71's Orange County answer in a browser**
   (`s275-sam-oc-answer-v71`) — no session can; the sandbox is egress-blocked
   from `*.supabase.co`.
3. **Measure the programs route under load** (`s275-fable-programs-route-latency`):
   every `route time limit:` line in `function_logs` over a week; the query
   moves or the limit does, never an index on `coci_college_programs` (#1602).
4. **A named college should not keep the county band**
   (`s275-fable-college-anchor-pure-distance`): from Long Beach City College,
   Antelope Valley (110 km) still outranks Cypress (12 km). Move the
   geo-ranking test's pin, do not delete it.
5. **Verify the campus points** (`s275-fable-verify-campus-points`) from a
   machine that can reach IPEDS; the sandbox cannot.
6. **Atomic catalog replace** (`s274-fable-offerings-replace-atomic`) —
   designed, not built.

## ⚠️ Sam's open calls — his, not yours

- **Which Orange County college runs an LVN entry program**
  (`s271-sam-lvn-oc`): the COCI export holds only the bridges.
- **Re-scope guidance row 674923db** in the Training tab
  (`s275-sam-guidance-674923db-scope`) — the code scope is in v70.
- **The 381 stored garbled course rows** (`s274-sam-course-title-cleanup`).
- **Auto-deploy on merge** (`s272-sam-autodeploy-ruling`).

## What this session learned

- **The record cannot say which credential is held.** It matches what was
  asked, and a prospective question names two credentials. Only the
  visitor's own words say which one they hold. KB note:
  `methodology-the-record-cannot-say-which-credential-is-held`.
- **A prompt rule cannot outrun a context that contradicts it.** v69's rule
  already called the held program background; the model opened with it
  twice because the block's own intro said the visitor held an LVN license.
- **A reader who knows the ground is the test the grid cannot run**, and **a
  new assertion must fail in the shape the grid counts** (the two earlier KB
  notes of this session).
- **Read the grid, never the run's conclusion.** The compare's exit code was
  swallowed by `tee` for as long as the workflow has existed.
- **The push-triggered smoke tests production with the branch's assertions**
  — red by construction until the deploy; say so once on the PR. And the
  merge to `main` triggers one too, so a deploy right after a merge splits
  that run across two versions — the dispatched smoke is the clean one.
- **Never two suites at once against production**; a suite started before
  the previous one finished is how statement timeouts are made.

## Carryover

| Item | State |
|---|---|
| v71 deploy → health → smoke → logs | deploy 35324360975 ✅ · health 35324519410 ✅ · smoke 35324991804 ✅ ALL MODES OK · logs read |
| Sam reads v71's Orange County answer | asked — `s275-sam-oc-answer-v71` |
| The precedent in the block | designed — `s275-fable-precedent-in-the-block` (step 1) |
| Programs route latency under load | measure — `s275-fable-programs-route-latency` |
| College anchor: pure distance | designed — `s275-fable-college-anchor-pure-distance` |
| Verify `COLLEGE_POINTS` against IPEDS | needs a machine with egress — `s275-fable-verify-campus-points` |
| Atomic catalog replace | designed, not built — `s274-fable-offerings-replace-atomic` |
| Guidance row 674923db re-scope | NEEDS SAM — `s275-sam-guidance-674923db-scope` |
| Orange County LVN entry program | NEEDS SAM — `s271-sam-lvn-oc` |
| 381 garbled course rows | NEEDS SAM — `s274-sam-course-title-cleanup` |
| Auto-deploy on merge | NEEDS SAM — `s272-sam-autodeploy-ruling` |
| Health cron fires ~4/day against a cron asking for 8 | open, observed not diagnosed |
| The 15 strict-mode type errors in `index.ts` | pre-existing on `main`; identical on every branch this run |
| The 495-row CTE disagreement · `verify_search_exhibits_v2.sql` missing · matcher vocabulary · Engineering homograph · ASCCC areas · Credential Engine | unchanged (deferred list of the To-Do feed) |

## ⚠️ Safety patterns to honor

- **`npm test` IS NOT THE SUITE** — run the 46 python/shell steps of
  `js-tests.yml` too (parse the workflow with PyYAML; `npm install` first or
  the three jsdom steps fail on a missing module). The full suite takes
  ~15 minutes here; run it in the background and read the log.
- **`deno check` needs a cwd with no `node_modules`** — after `npm install`
  in the repo it resolves `npm:openai` against `node_modules` and fails
  before type-checking; copy the file to the scratchpad and check it there
  (15 pre-existing errors on `main`; compare the error SET, not the count).
- **Rebuild the dependency map** after any edit that moves lines; regenerate
  `sierra_rule_defaults.js` after any rule-text edit; a floor lives in
  `tests/check_floor.json` → `files`.
- **A `check_suite.completed` wake can name a SUPERSEDED head**; re-read
  `get_check_runs` on the current head; `test` green there before every merge.
- **Read the candidate's own answer in `chat_interactions`**, not only the
  grid — and read the grid's HEADER: "0 failing" is not "ALL MODES OK".
- **Never two suites at once against production** (statement timeouts).
- **NEVER INDEX `coci_college_programs`** (measured, #1602).
- Rule 4 (both HTMLs) · Rule 5 (never force-push `main`) · Rule 10 (Supabase
  only through MCP; the stop hook's "unpushed" nag is the documented false
  positive — never push to silence it).

## KB notes added this session

- `methodology-a-new-assertion-must-fail-in-the-shape-the-grid-counts`
- `methodology-an-absence-in-the-data-is-a-statement-about-the-data`
- `methodology-the-record-cannot-say-which-credential-is-held`

---

*Greetings, you are Sky**Gauge** (Session 276), see Sky**Compass**'s handoff —
`docs/session_276_handoff.md` — let's keep rolling with our queue.*
