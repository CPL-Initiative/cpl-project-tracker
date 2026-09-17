---
title: Session 274 handoff — the merge was ready, the deploy is waiting on one apply
date: 2026-09-17
session: 273 (SkyPilot)
tags: [handoff, sierra, program-search, deploy, performance]
status: current
---

# You are Session 274

Your moniker is **SkyMeter** — the work in front of you is one apply, one
re-measurement, and a deploy whose readiness is now a number rather than a
guess.

Read in order: this file · [`lanes/sierra-retrieval-corpus.md`](reference/lanes/sierra-retrieval-corpus.md)
· `docs/cpl_assistant_lessons.md` (2026-09-17, S273) · the header of
`chatbox/supabase_search_college_programs.sql` · PRs #1603 and the S273 PR.

## ⛔ WHERE THINGS STAND

- **#1603 is MERGED (`0b40f8a`) and NOT DEPLOYED.** Production is cpl-chat
  **v66**, which predates #1601: the program route, the phrases and the guards
  all sit on `main` and nowhere live.
- **The first `cpl-chat-preview-ab.yml` run (35275472821) came back clean on
  the grid and was NOT a green light.** Both slugs ALL MODES OK, no regressions;
  the preview's own `function_logs` show `search_college_programs unavailable:
  canceling statement due to statement timeout` three times.
  `pg_stat_statements`: 15 calls, mean 4,282 ms, max 7,875 ms; the effective
  timeout through PostgREST is 8 s. The route fails safe — Sierra answered
  without the section and read fine.
- **The fix is written and proven, not applied.** `search_college_programs`
  now computes its four tsvectors ONCE per call and counts every term's DF in
  one pass: identical rows on nine term sets (proven on a `pg_temp` copy beside
  the live function), 1.1–2.5 s against 1.8–19.8 s. Applying it is a
  `create or replace` of a read-only RPC with no production consumer today,
  and Sam has been asked for the go (To-Do `s273-sam-apply-program-search-rewrite`).
- The preview slug **`cpl-chat-preview` (v1, the merged bytes) persists** and
  reads the live RPC, so a re-run of the A/B measures the apply directly.

## YOUR SEQUENCE

1. **Apply the rewrite** once Sam says go: the function block of
   `chatbox/supabase_search_college_programs.sql`, then run
   `chatbox/verify_search_college_programs.sql` (A 8 · B 2 · C 4 · **D 2**).
2. **Re-run `cpl-chat-preview-ab.yml`** on `main` and then read the LOGS, not
   only the grid: `select … from logs where source = 'function_logs' and
   event_message ilike '%unavailable%'` over the run's window. Zero lines is
   the pass.
3. **`cpl-chat-deploy.yml`** (confirm `DEPLOY`), then `cpl-chat-smoke.yml` and
   read **7p**, which now asserts the LVN question answers in under 4 s.
4. Delete `cpl-chat-preview` (a later A/B run with `cleanup=true`, or by hand).
5. Rollback is one `cpl-chat-deploy.yml` dispatch from the previous commit,
   and one `create or replace` from git for the SQL.

## ⚠️ Sam's open calls — his, not yours

- **Auto-deploy the Edge Function on merge?** Asked in S272, still unruled.
  S272 recommended yes with the dispatch kept for rollbacks; S273 adds: the A/B
  can run on the BRANCH before merge (it checks out the dispatched ref), so the
  gate moves in front of the merge rather than disappearing.
- **The apply above.** Zero production effect until the deploy; it makes the
  deploy safe.

## What this session learned

- **Deno installs from npm in the sandbox** (`npm install deno@2`). With a
  `deno.json` of `{"nodeModulesDir":"auto"}` beside a copy of `index.ts`,
  `deno check` runs (15 pre-existing strict-mode errors on `main`, identical set
  on the branch, none added; the Supabase deploy does not typecheck) and
  `deno run --no-check` with dummy env vars boots the module. Two handoffs said
  this was impossible. KB note: `methodology-a-missing-tool-is-usually-a-missing-install`.
- **A pass/fail grid cannot see a route that fails safe.** After any A/B, read
  `function_logs` for the preview window. KB note:
  `methodology-a-retrieval-route-costs-what-the-synonym-table-decides`.
- **A timing without its term count and role is not a measurement.** The
  file's header carried 561.9 ms for a 6-term call; the same call measured
  cleanly is 4,255 ms. Record the terms and the role with every number.
- **Prove a SQL rewrite in `pg_temp`.** Session-local, vanishes with the
  connection, touches no shared schema; `EXCEPT` both ways plus a row-number
  order check is the equivalence proof.

## Carryover

| Item | State |
|---|---|
| Apply the one-pass `search_college_programs` → A/B re-run → deploy → 7p → delete the preview slug | **your first job** — apply NEEDS SAM |
| Client-side time limit on every retrieval RPC (`AbortSignal`) | recommended, not built — `s273-fable-route-time-limits` |
| Stored generated tsvector columns to cut the ~700 ms floor | a LOADER-side cost; measure on `coci_programs_replace` before shipping (#1602's lesson) |
| The 15 strict-mode type errors in `index.ts` | pre-existing on `main`; clear in a code-only PR, then `deno check` can gate |
| Smoke 15a's fourth negation shape (a negated reading verb, then a quotation) and 15c's fifth (a contrast phrase: "different from saying") | fixed: reading verbs, contrast phrases and gerunds joined the stripper's can't-say shape; fixtures + controls in `smoke_negation_stripper.test.js` (42). Five shapes in six days: the class wants a better instrument than sed |
| Auto-deploy on merge | NEEDS SAM (from S272) |
| Sam's eyes on the public My College, signed out | asked S271, still unconfirmed |
| Health cron fires ~4/day against a cron asking for 8 | open, observed not diagnosed |
| The 495-row CTE disagreement · `verify_search_exhibits_v2.sql` missing · matcher vocabulary · Engineering homograph · ASCCC areas · Credential Engine | unchanged from S272 |

## ⚠️ Safety patterns to honor

- **`npm test` IS NOT THE SUITE.** Extract `js-tests.yml`'s python steps and run
  them (44 pass locally on this branch).
- **A `check_suite.completed` wake can name a SUPERSEDED head.** Re-read
  `get_check_runs` on the current head; `test` green there before every merge.
- **NEVER INDEX `coci_college_programs`** (measured, #1602). Generated columns
  are a different cost class and still a measurement, not a reflex.
- **Read the function logs after any A/B or deploy**, not only the grid.
- Rule 4 (both HTMLs) · Rule 5 (never force-push `main`) · Rule 10 (Supabase
  only through MCP; the stop hook's "unpushed" nag is the documented false
  positive — `python3 scripts/patch_stop_hook.py`, never push to silence it).

## KB notes added this run

- `methodology-a-retrieval-route-costs-what-the-synonym-table-decides`
- `methodology-a-missing-tool-is-usually-a-missing-install`

---

*Greetings, you are Sky**Meter** (Session 274), see Sky**Pilot**'s handoff —
`docs/session_274_handoff.md` — let's keep rolling with our queue.*
