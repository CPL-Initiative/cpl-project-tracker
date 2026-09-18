---
title: Session 275 handoff — v69 answers the prospective question; ship it, read it, then give nearest a distance
date: 2026-09-18
session: 274 (SkyMeter)
tags: [handoff, sierra, prospective-cpl, deploy, encoding]
status: current
---

# You are Session 275

Your moniker is **SkyCompass** — v69 knows which regions border which and
still cannot say how far apart two colleges are; the work in front of you
starts with reading how it answers in production and ends with giving
"nearest" a distance.

Read in order: this file · [`lanes/sierra-retrieval-corpus.md`](reference/lanes/sierra-retrieval-corpus.md)
· `docs/cpl_assistant_lessons.md` (2026-09-18, S274) ·
`docs/kb-notes/methodology-what-might-qualify-is-a-different-question-from-who-already-grants-it.md`
· [PR #1608](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1608).

## ✅ WHERE THINGS STAND (as of 2026-09-18 03:40Z)

- **cpl-chat v68 is LIVE** (deploy run 35302005168, `main` at `fa87ece`,
  03:08Z): a county or region named in the question anchors both catalog
  lists. Health green; smoke runs 35301970000 and 35302133252 ALL MODES OK;
  `function_logs` since the deploy clean.
- **Sam's bar, verbatim (2026-09-18):** *"I was asking her to compare CNA
  courses to LVN courses so the user could ask for credit… The question is
  what might qualify so the user could ask for it at a college that has not
  yet granted it."* `cpl_memory`
  `sam-cna-question-is-what-might-qualify-not-who-articulated-2026-09-18`.
  v68's production answer (`chat_interactions` `9a74a91b`) anchored the
  county and then answered the exhibit question — the miss he named.
- **v69 is on PR #1608 (`claude/confident-johnson-18vlh7`, head `2691382`):**
  the prospective-credit block (per core TOP, the three nearest colleges'
  full course lists from `chatbox_college_courses`; `PROSPECTIVE_RULE`: the
  target is the program they want to ENTER, every match a REQUEST, cite the
  precedent), a neighbor-region band, `isFalseFriend` (a tier-3/4 substring
  credential hit must be a whole word — "cna" inside "ccna" had switched the
  local route off), both credential routes always, adopted credentials
  ranked first in the local route (cap 6), and course titles repaired at the
  loader (`kb/_text_repair.py`). **A/B run 35302590083 on `bf46011`:**
  candidate ALL MODES OK, no regressions, 7c's course-level assertion fixed by
  the candidate; the candidate's answer (`b0bcea2d`) named Pasadena NURS
  102/102L, Southwestern VN 10/10L, Chaffey NURVN 403/403L with units, framed
  as a request; prompts no larger than production (21,123 vs 21,900 uncached
  tokens); logs clean. It missed the Chaffey NURVN 414 precedent — the cap,
  not the gate — which `2691382` fixes; **the second A/B (run 35303520840)
  gates the deploy.** [If this file still says so, check the run and the
  deploy state before anything else.]
- **Locally proven on the branch:** `npm test` 345/345, all 43 CI
  python/shell steps plus the new mojibake step, `deno check` at main's 15,
  `deno run` boots, `sierra_prospective_credit.test.js` 61/61.

## YOUR SEQUENCE

1. **Confirm the deploy state.** `list_edge_functions`: v69 live? If PR #1608
   is merged and the function is still v68, the deploy is yours:
   `cpl-chat-deploy.yml` (`confirm: DEPLOY`) → `cpl-chat-health.yml` →
   `cpl-chat-smoke.yml` → `function_logs` (`unavailable` / `EMPTY ANSWER` /
   `error`). If the PR is still open, read the second A/B's grid AND logs,
   merge on green `test`, then deploy.
2. **Read v69's production answer** to the Orange County question (the
   smoke's 7c turn lands in `chat_interactions`, session `smoke-ci`) against
   Sam's bar, then ask Sam to read it (`s274-sam-oc-question-v69`).
3. **Give "nearest" a distance** (`s274-fable-nearest-needs-distance`): within
   a proximity band the picks order by course count. A county-to-county
   distance table (centroids are enough; `college_geo` has county) lets the
   course lists lead with Long Beach and Rio Hondo for Orange County rather
   than the largest program in a neighboring region.
4. **Client-side time limits on every retrieval RPC**
   (`s273-fable-route-time-limits`): `AbortSignal` on each `.rpc()` in the
   retrieval `Promise.all` so one slow route cannot hold the answer for 8 s.
   A/B on the branch + logs before any deploy.
5. **Do not delete the 381 garbled course rows.** That is Sam's
   (`s274-sam-course-title-cleanup`): the course sync is upsert-only with the
   title in its conflict key, so after the first clean nightly sync the old
   rows sit beside the repaired ones and double the alignment candidates.
   Plan: delete rows matching the mojibake sequences, with a receipt.

## ⚠️ Sam's open calls — his, not yours

- **Auto-deploy the Edge Function on merge?** Asked in S272, still unruled.
  This session ran apply → A/B → merge → deploy → smoke by hand for v68 and
  again for v69. The A/B runs on the branch, so the gate can sit in front of
  the merge.
- **The 381 stored garbled course rows** (above).

## What this session learned

- **A correct answer to the wrong question reads as a miss.** Two sessions
  and one A/B judged the Orange County answer on whether it named the right
  colleges; Sam judged it on whether it compared courses. Smoke 7c now reads
  for a course code and the word "review". KB note:
  `methodology-what-might-qualify-is-a-different-question-from-who-already-grants-it`.
- **When a fact is hidden twice, removing the first gate is not the fix.**
  The CCNA false friend hid the Chaffey precedent; so did a cap of four.
  Measure which rows reach the model.
- **A double-decoded string needs the codec that decoded it.** cp1252 with
  the five undefined code points passed through, up to three passes, repair
  before whitespace collapse, one module for every loader. KB note:
  `methodology-a-double-decoded-string-needs-the-codec-that-decoded-it`.
- **A stale dependency map is the CI failure this repo keeps re-learning**
  (#1601 twice, #1607 once, and once more on this branch). Rebuild it after
  every edit that moves lines in `index.ts`, `smoke_test.sh` or the SQL.

## Carryover

| Item | State |
|---|---|
| v69 deploy → health → smoke → logs → Sam reads the answer | **YOURS FIRST** if this file still says the second A/B gates it |
| Sam reads the v69 Orange County answer | asked — `s274-sam-oc-question-v69` |
| Delete the 381 garbled course rows after the first clean sync (receipt) | NEEDS SAM — `s274-sam-course-title-cleanup` |
| A county-to-county distance table for "nearest" | designed, not built — `s274-fable-nearest-needs-distance` |
| Client-side time limit on every retrieval RPC | recommended, not built — `s273-fable-route-time-limits` |
| Sam reads Sierra's program answers in a browser | asked S273 — `s273-sam-read-program-answers` |
| Auto-deploy on merge | NEEDS SAM (from S272) |
| The 15 strict-mode type errors in `index.ts` | pre-existing on `main`; clear in a code-only PR, then `deno check` can gate |
| Sam's eyes on the public My College, signed out | asked S271, still unconfirmed |
| Health cron fires ~4/day against a cron asking for 8 | open, observed not diagnosed |
| The 495-row CTE disagreement · `verify_search_exhibits_v2.sql` missing · matcher vocabulary · Engineering homograph · ASCCC areas · Credential Engine | unchanged from S272 |

## ⚠️ Safety patterns to honor

- **`npm test` IS NOT THE SUITE.** Run `js-tests.yml`'s python/shell steps
  too (parse the workflow with PyYAML and run each `run:`; 44 pass locally).
  And the full `npm test` takes ~15 minutes here — start it in the background
  and wait on the log, never on a feeling.
- **Rebuild the dependency map** (`python3 kb/_build_dependency_map.py`)
  after any edit that moves lines; `--check` is a CI step.
- **A `check_suite.completed` wake can name a SUPERSEDED head.** Re-read
  `get_check_runs` on the current head; `test` green there before every merge.
- **Read the function logs after any A/B or deploy**, not only the grid; and
  read the candidate's own answer in `chat_interactions`, not only the grid.
- **NEVER INDEX `coci_college_programs`** (measured, #1602).
- **A signature change is drop-then-create**, one migration, grants restored.
- Rule 4 (both HTMLs) · Rule 5 (never force-push `main`) · Rule 10 (Supabase
  only through MCP; the stop hook's "unpushed" nag is the documented false
  positive — `python3 scripts/patch_stop_hook.py`, never push to silence it).

## KB notes added this run

- `methodology-what-might-qualify-is-a-different-question-from-who-already-grants-it`
- `methodology-a-double-decoded-string-needs-the-codec-that-decoded-it`

---

*Greetings, you are Sky**Compass** (Session 275), see Sky**Meter**'s handoff —
`docs/session_275_handoff.md` — let's keep rolling with our queue.*
