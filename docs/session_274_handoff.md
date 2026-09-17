---
title: Session 274 handoff — program search is applied and deployed as v67; now we hone
date: 2026-09-17
session: 273 (SkyPilot)
tags: [handoff, sierra, program-search, deploy, performance]
status: current
---

# You are Session 274

Your moniker is **SkyMeter** — Sierra's third view of a college is live in
production, and the work in front of you is reading how it behaves and honing
it, with the numbers this session left you.

Read in order: this file · [`lanes/sierra-retrieval-corpus.md`](reference/lanes/sierra-retrieval-corpus.md)
· `docs/cpl_assistant_lessons.md` (2026-09-17, S273) · the header of
`chatbox/supabase_search_college_programs.sql` · PRs #1603 and the S273 PR.

## ✅ WHERE THINGS STAND (as of 2026-09-17 23:31Z)

- **cpl-chat v67 is LIVE** (deploy run 35287167393, `main` at `ab3e4a9`). It
  carries #1601's program route, #1603's phrases, stop word and guards. Sam
  authorized it verbatim: *"apply and deploy...as long as we don't break Sierra
  in the process:) I'm OK with a few anomalies if those occur. We can hone as
  we go."* (`cpl_memory` `sam-authorized-apply-and-deploy-program-search-2026-09-17`).
- **The one-pass `search_college_programs` is APPLIED** (migration
  `20260917231239 search_college_programs_one_pass`). Verified live after the
  apply: A 8/8 · B 2/2 · C 4/4 · **D 2/2**, the 30-term call at 2,573 ms, the
  LVN question at 887 ms reaching 56 colleges.
- **The second `cpl-chat-preview-ab.yml` run (35285864076) was clean in BOTH
  senses:** ALL MODES OK on both slugs, no regressions, and ZERO
  `search_college_programs unavailable` lines in `function_logs` for its window
  (run 1 had three). The four Postgres timeouts in that window are mode 15d's
  deliberate anon-role probes, present in every run. The preview slug was
  deleted by the run (`cleanup=true`).
- **Post-deploy smoke and health, both green on v67:** smoke run 35287560339
  ALL MODES OK, 7p at 56 colleges and **1.60 s** on the anon key; health run
  35287562670 green. The smoke's 19 chat turns took the same 5.7 minutes as
  on v66, with answers ~13% longer and 8 of 19 mentioning programs (3 before).
  Function logs since the deploy: 0 `unavailable`, 0 `EMPTY ANSWER`, 0 errors.

## YOUR SEQUENCE

1. **Read what v67 does with real questions.** `chat_interactions` rows since
   23:31Z 2026-09-17 (session_id other than `smoke-ci` / `health-probe`), and
   `function_logs` for `unavailable`, `EMPTY ANSWER` and `error`. The route
   fails safe, so a missing Program Catalog section is only visible in the
   logs.
2. **Ask Sam to read Sierra's program answers in a browser** (To-Do
   `s273-sam-read-program-answers`): "Where can I train to become an LVN?",
   "Which colleges award a welding certificate?", one with a home college
   named. Anomalies are expected and accepted; record each as a fixture or a
   vocabulary entry, the way the negation class is handled.
3. **Give every retrieval RPC a client-side time limit** (`AbortSignal` on the
   `.rpc()` calls, To-Do `s273-fable-route-time-limits`) so one slow route can
   never hold the whole answer for 8 s again. Deploy needs the A/B + the logs
   read, as this session did.
4. **Optional, measured:** stored generated tsvector columns to cut the ~700 ms
   floor of the program route. A LOADER-side cost — measure on
   `coci_programs_replace` before shipping (#1602's lesson).
5. Rollback stays one `cpl-chat-deploy.yml` dispatch from the previous commit
   (`663027f` was v66), and one `create or replace` from git for the SQL.

## ⚠️ Sam's open call — his, not yours

- **Auto-deploy the Edge Function on merge?** Asked in S272, still unruled.
  S272 recommended yes with the dispatch kept for rollbacks; S273 adds: the A/B
  can run on the BRANCH before merge (it checks out the dispatched ref), so the
  gate moves in front of the merge rather than disappearing. Today's sequence
  (apply → A/B → logs → deploy → smoke) took about 25 minutes by hand.

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
| Apply → A/B re-run → deploy → smoke → delete the preview slug | **DONE 2026-09-17** — v67 live, migration `search_college_programs_one_pass` applied, A/B run 2 clean in grid and logs |
| Sam reads Sierra's program answers in a browser | asked — `s273-sam-read-program-answers` |
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
