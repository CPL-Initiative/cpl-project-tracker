---
title: Session 277 handoff — v72 is live (the quick list, the flyer, the precedent in the block, "catalog data"); next, the crosswalk beyond the CNA and the measurements the queue still owes
date: 2026-09-18
session: 276 (SkyGauge)
tags: [handoff, sierra, prospective-cpl, deploy, quick-list, flyer, plain-words]
status: current
---

# You are Session 277

Your moniker is **SkyCaliper** — v72 gave Sierra a counselor's reflex (what
you hold, what you want, what to ask about, what else is open to you), and
what the queue owes next is measurement: how the new route costs under load,
whether a named college should keep the county band, whether the campus
points are right.

Read in order: this file · [`lanes/sierra-retrieval-corpus.md`](reference/lanes/sierra-retrieval-corpus.md)
· `docs/cpl_assistant_lessons.md` (2026-09-18, S276) ·
`docs/kb-notes/methodology-typical-is-a-count-of-colleges-across-the-whole-catalog.md`
· `docs/kb-notes/methodology-an-inside-term-leaks-through-the-context-not-the-prose.md`
· [PR #1617](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1617) (merged, v72).

## ✅ WHERE THINGS STAND (as of 2026-09-18 16:55Z)

- **cpl-chat v72 is LIVE** (PR #1617 squash-merged as `fc3ebe3` on green
  `test`; deploy run 35370070548 byte-verified; `list_edge_functions`
  version 72 at 16:43:19Z). Health run 35370311547 green at 16:45Z. The
  merge-triggered smoke (run 35370054033, started before the swap) passed
  every mode including the new 7c checks; the dispatched clean run:
  run 35371403392, dispatched 16:56Z after the parallel session's push-triggered smoke finished, in progress at this commit (the result lands in the next commit). `function_logs` 16:43–16:50Z: 0 route cuts, 0 EMPTY
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
  PR #1618 merged and was merged into this branch; its PR #1619 is open.
- **A measured note for the SkyView lane:** #1619's commit message says
  #1617's merge removed the read-only band from `prototype/skyview.html`.
  `git log -- prototype/skyview.html` on main shows the band left in
  `7aabe52`, the daily dashboard cron commit between #1618 and #1617 (the
  cron rebuilds the page from sources that did not carry it; 36 deletions);
  #1617 did not touch the file. #1619's fix (the band in the sources) is the
  right one either way.

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
| v72 deploy → health → smoke → logs | deploy 35370070548 ✅ · health 35370311547 ✅ · merge-triggered smoke 35370054033 ✅ · clean smoke 35371403392 in progress at commit time · logs clean |
| Sam reads v72's Orange County answer | ask — `s276-sam-oc-answer-v72` |
| The precedent line names its program | designed — `s276-fable-precedent-names-its-program` (step 2) |
| `RELATED_PROGRAMS` beyond the CNA | NEEDS SAM — `s276-sam-related-programs-next-list` |
| Programs + typical routes under load | measure — `s275-fable-programs-route-latency` |
| College anchor: pure distance | designed — `s275-fable-college-anchor-pure-distance` |
| Verify `COLLEGE_POINTS` against IPEDS | needs a machine with egress — `s275-fable-verify-campus-points` |
| Atomic catalog replace | designed, not built — `s274-fable-offerings-replace-atomic` |
| Guidance row 674923db re-scope · Orange County LVN entry program · 381 garbled rows · auto-deploy on merge | NEEDS SAM |
| SkyView read-only band | the other session's PR #1619 (the cron commit `7aabe52` removed it, measured) |
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
