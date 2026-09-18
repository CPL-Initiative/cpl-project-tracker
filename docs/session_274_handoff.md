---
title: Session 274 handoff — v68 is built and verified; merge, deploy and read it
date: 2026-09-18
session: 273 (SkyPilot)
tags: [handoff, sierra, place-anchor, program-search, deploy]
status: current
---

# You are Session 274

Your moniker is **SkyMeter** — the work in front of you is finishing a
deploy this session built and proved but did not ship, then reading how
Sierra behaves with it.

Read in order: this file · [`lanes/sierra-retrieval-corpus.md`](reference/lanes/sierra-retrieval-corpus.md)
· `docs/cpl_assistant_lessons.md` (2026-09-18, S273 second round) ·
`docs/kb-notes/methodology-a-place-is-an-anchor-not-a-college.md` ·
[PR #1607](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1607).

## ✅ WHERE THINGS STAND (as of 2026-09-18 02:30Z)

- **Production is still cpl-chat v67.** Sam read its answer to *"I have a cna
  cert and I want to go to a college in orange county. What CNA courses at
  the colleges match LVN courses so I can ask for credit?"* and said *"Still
  not able to analyze course and program data."* The diagnosis is in the KB
  note; the short form: a county in the question anchored nothing (askedGeo
  came only from a resolved college), "orange" matched Orange Coast College
  and NOCE by name, `cna` had no synonym family, the offerings query dropped
  every phrase, and the ask-shape words spent the credential probes.
- **v68 is BUILT on `claude/exciting-allen-k2nrbf`, PR #1607 (draft).**
  `resolveAskedPlace` anchors on a county or region from `college_geo`,
  strips it from detection and the keyword routes, carries it across turns;
  both catalog builders say in words when no college in the place matches;
  `cna` expands to phrases; `tsQueryFromTerms` expresses a phrase as
  `nurse:* <-> assistant:*`; ask-shape stop words; phrase synonyms as
  credential probes. Two commits: `897076a` (the change) and `f64f645`
  (four test pins the change moved).
- **The two RPC migrations are APPLIED LIVE and verified**
  (`search_college_programs_place_anchor`,
  `search_college_offerings_place_anchor`): `anchor_county` /
  `anchor_region` lead the ORDER BY, never filter. Part E 4/4 and the
  offerings verify 6/6. v67 keeps calling with the old named args (the
  smoke run 35298250073 against production passed after the migration,
  mode 7c included). Rollback is one `create or replace` from git for each
  function — drop the two-anchor signature first.
- **Proven locally:** `npm test` 344/344 (`f64f645`), the 40 CI python/shell
  steps, `deno check` at the 15 pre-existing errors with none added,
  `deno run` boots, `tests/sierra_place_anchor.test.js` 77/77.
- **In flight when this session closed:** the branch A/B run
  **35298283829** (candidate on the preview slug, `cleanup=false`) and CI
  `test` on `f64f645`. The first `test` run (on `897076a`) failed on exactly
  the four files `f64f645` fixes.

## YOUR SEQUENCE

1. **Read the A/B** (run 35298283829): the PASS/FAIL grid for both slugs —
   a mode that passes on production and fails on the candidate is the
   signal; 7c may fail on production and pass on the candidate, which is
   fine — then `function_logs` for the run's window: `unavailable`,
   `EMPTY ANSWER`, `error`. A fail-safe route drops its section silently,
   so the grid alone is not the check.
2. **`test` green on `f64f645`** (get_check_runs on the PR head, never a
   `check_suite.completed` wake) → mark #1607 ready → squash-merge. Sam's
   review is not a gate.
3. **Deploy v68** — `cpl-chat-deploy.yml`, `confirm: DEPLOY` — then
   `cpl-chat-health.yml`, `cpl-chat-smoke.yml`, and `function_logs` again.
   Delete the preview slug afterwards (an A/B run with `cleanup=true`, or
   the Supabase dashboard).
4. **Ask the Orange County question of production** and read the answer:
   it should say that no Orange County college confers a Vocational
   Nursing award in COCI, name the LVN-to-RN bridges for what they are,
   name the nearest Vocational Nursing programs with their county, and
   cite the Chaffey NURVN 414 precedent for CNA-to-LVN credit. Then ask
   Sam to read it (To-Do `s273-sam-oc-question-v68`).
5. Only then the older queue: client-side time limits on every retrieval
   RPC (`s273-fable-route-time-limits`); the college-derived anchor
   applied inside the RPCs too (today only a PLACE reaches the database;
   a named college still ranks client-side after the limit); generated
   tsvector columns as a measured loader-side option.

## ⚠️ Sam's open call — his, not yours

- **Auto-deploy the Edge Function on merge?** Asked in S272, still unruled.
  This round is the third time the sequence apply → A/B → logs → merge →
  deploy → smoke was run by hand; the A/B runs on the branch, so the gate
  can sit in front of the merge.

## What this session learned

- **A place is an anchor, not a college.** A county or region named in the
  question must anchor geography and must never be matched against college
  names; and a proximity sort applied after `result_limit` cannot restore a
  row the limit already cut, so the anchor belongs inside the query. KB
  note: `methodology-a-place-is-an-anchor-not-a-college`.
- **Tell the model the fact in words.** "NO college in Orange County has a
  matching program" in the context is what stops a hedge; the "not
  exhaustive" rule alone produces one.
- **The words that describe the ask are stop words** (*want, ask, request,
  match, course, program*) — every one was a live search term and a spent
  credential probe.
- **A test pin reads code shapes, not behavior.** Four files failed on the
  first full run for a ternary colon, a regenerated defaults file, a floor
  entry at the wrong level, and a renamed variable. Run the FULL `npm test`
  before the push; the targeted tests are not the suite.

## Carryover

| Item | State |
|---|---|
| A/B 35298283829 read (grid + logs) → merge #1607 → deploy v68 → health + smoke → logs | **YOURS FIRST** — everything before it is done and verified |
| Production read of the Orange County CNA-to-LVN question; Sam reads it | after the deploy — `s273-sam-oc-question-v68` |
| Sam reads Sierra's program answers in a browser | asked S273 — `s273-sam-read-program-answers` |
| Client-side time limit on every retrieval RPC (`AbortSignal`) | recommended, not built — `s273-fable-route-time-limits` |
| College-derived anchor inside the RPCs (detection ahead of the catalog routes) | designed, not built — see the KB note's "What it does not do yet" |
| Stored generated tsvector columns to cut the ~700 ms floor | a LOADER-side cost; measure on `coci_programs_replace` first (#1602) |
| The 15 strict-mode type errors in `index.ts` | pre-existing on `main`; clear in a code-only PR, then `deno check` can gate |
| Auto-deploy on merge | NEEDS SAM (from S272) |
| Sam's eyes on the public My College, signed out | asked S271, still unconfirmed |
| Health cron fires ~4/day against a cron asking for 8 | open, observed not diagnosed |
| The 495-row CTE disagreement · `verify_search_exhibits_v2.sql` missing · matcher vocabulary · Engineering homograph · ASCCC areas · Credential Engine | unchanged from S272 |

## ⚠️ Safety patterns to honor

- **`npm test` IS NOT THE SUITE.** Extract `js-tests.yml`'s python steps and run
  them (40 pass locally on this branch). And the targeted tests are not
  `npm test`: run the whole thing before a push.
- **A `check_suite.completed` wake can name a SUPERSEDED head.** Re-read
  `get_check_runs` on the current head; `test` green there before every merge.
- **NEVER INDEX `coci_college_programs`** (measured, #1602).
- **Read the function logs after any A/B or deploy**, not only the grid.
- **A signature change is drop-then-create**, in one migration, grants
  restored (the overload trap; both SQL files of record say so).
- Rule 4 (both HTMLs) · Rule 5 (never force-push `main`) · Rule 10 (Supabase
  only through MCP; the stop hook's "unpushed" nag is the documented false
  positive — `python3 scripts/patch_stop_hook.py`, never push to silence it).

## KB notes added this run

- `methodology-a-place-is-an-anchor-not-a-college`

---

*Greetings, you are Sky**Meter** (Session 274), see Sky**Pilot**'s handoff —
`docs/session_274_handoff.md` — let's keep rolling with our queue.*
