---
title: Session 273 handoff — program search is live; the edge function is not deployed
date: 2026-09-17
session: 272 (SkyIndex)
tags: [handoff, sierra, program-search, cip, deploy]
status: current
superseded: true
superseded_by: session_274_handoff.md
---

# You are Session 273

Your moniker is **SkyPilot** — the work in front of you is a deploy that has
already been prepared, measured and asked about, and nothing else is blocking.

Read in order: this file · [`lanes/sierra-retrieval-corpus.md`](reference/lanes/sierra-retrieval-corpus.md)
· `docs/cpl_assistant_lessons.md` (2026-09-17, S272) · PRs #1601 #1602 #1603.

## ⛔ YOUR FIRST JOB, AND SAM HAS BEEN ASKED ABOUT IT

**PR #1603 carries edge-function changes that are INERT until `cpl-chat-deploy.yml`
runs.** The `lvn` synonym family, the `become` stop word and the `singleTokenTerms`
guard ship with the FUNCTION, not with the merge. That page-on-merge /
function-on-dispatch asymmetry is the root cause of the five-day invisible outage
in #1595, and it is still exactly as true today.

Sequence:

1. **Merge #1603** once `test` is green on its current head.
2. **Run `cpl-chat-preview-ab.yml` FIRST** — Sam was asked to approve this and had
   not answered when S272 ended. It deploys the same bytes to an unadvertised
   slug and reports any smoke mode that passes on production and fails on the
   candidate. ⚠️ **There is no Deno in the sandbox**, so `index.ts` cannot be
   typechecked locally — the preview run is what replaces a guess about the
   function booting.
3. **Then `cpl-chat-deploy.yml`**, then dispatch `cpl-chat-smoke.yml` and read
   **mode 7p** (new this run).
4. Rollback is one dispatch from the previous commit. The SQL half is already
   live and backward compatible: an older function sends no multi-word terms, so
   the phrase branch lies dormant rather than erroring.

## ⚠️ Sam's open question — his call, not yours to make

He asked what he could do to prevent another Sierra outage. That surfaced the
real answer: **should the Edge Function auto-deploy on merge when
`chatbox/supabase/functions/**` changes?** `cpl-chat-deploy.yml` is
`workflow_dispatch` only and its own header says it *"triggers nothing
automatically."* S272 recommended auto-deploy on merge, keeping the dispatch for
rollbacks. **He had not ruled when the session ended.** Do not implement it
without his answer.

## What shipped

- ⭐ **#1601 — the third view of a college: what it AWARDS.** `coci_college_programs`
  held 22,335 rows over 118 colleges that no retrieval path read. The design is a
  measurement: the LVN question finds **53 colleges by title, 44 by either code,
  56 in union**. The 12 title-only ones are LVN-to-RN bridges coded Registered
  Nursing in BOTH taxonomies — **a code says what a program is ABOUT and cannot
  say who it is FOR** — so the route returns the union, reports `matched_via`, and
  files a code-only match in its own labeled bucket. CIP is loaded and never
  gated: 19,349 of 22,335 rows carry one.
- ⭐ **#1602 — three GIN indexes I added broke the nightly loader and bought 4 ms.**
  `coci_programs_replace` rewrites all 22,335 rows in ONE statement; three more
  GIN indexes pushed it past the statement timeout (57014). Measured: 561.9 ms
  with them, 565.8 ms without.
- ⭐ **#1603 — the LVN question went from 28 to 56 colleges, and the sync stopped
  writing production from feature branches.** Phrase terms via
  `phraseto_tsquery`; `branches: [main]` on `coci-offerings-sync.yml`.

## Carryover

| Item | State |
|---|---|
| #1603 merge → preview A/B → deploy → smoke 7p | **your first job**, above |
| Auto-deploy the Edge Function on merge | **NEEDS SAM** — recommended, not ruled |
| Sam's eyes on the public My College, signed out | asked S271, still unconfirmed |
| Health cron fires ~4/day against a cron asking for 8 | open, observed not diagnosed |
| The 495-row CTE disagreement | parked — the program export's asterisk disagrees with `kb/reference/top_categories.json` on 495 of 20,727 matchable active rows. Two readings of one manual; not a retrieval change. |
| `chatbox/verify_search_exhibits_v2.sql` | **does not exist** — v2's own header points at it as its verification and git shows no delete. A dangling pointer in the file whose design this lane inherited. |
| Matcher vocabulary gap · Engineering homograph · ASCCC areas · Credential Engine | unchanged from S268 |

## Patterns that worked

- **Measure the cheap fix before shipping it.** The one-line synonym I proposed to
  Sam was wrong, and only measuring it showed why. Proposing and then testing
  cost one query and saved shipping junk into student answers.
- **Compute the cross-impact, don't discover it.** A multi-word term is a hard
  42601 in `searchCollegeOfferings` — a PRIMARY path. Checking every consumer of
  `expandWithSynonyms` before adding a phrase is what caught it.
- **Mutation-test the guard.** Five mutations, five reds, each on the right check.
  A test that passes on a broken build is decoration.

## ⚠️ Safety patterns to honor

- **`npm test` IS NOT THE SUITE.** It auto-discovers `tests/*.test.js` only. CI
  runs **46 separate `python3` steps** in `js-tests.yml`, and both failures that
  reddened #1601 lived there. Extract them and run them:
  `grep -E "^\s+run: (python3|npm run)" .github/workflows/js-tests.yml`.
- **Three derived artifacts bit this run** — `sierra_rule_defaults.js` (from
  `index.ts`), the docs catalogs (from lane frontmatter), and
  `kb/dependency_map.json` TWICE (the second time because smoke 7p became a new
  RPC caller). Rebuild order: stage → dependency map → admin surface → suite.
- **NEVER INDEX `coci_college_programs`.** Its loader is one statement under a
  fixed timeout. The file's header records the measurement.
- **A `check_suite.completed` wake named a SUPERSEDED head THREE times** this
  session. Always re-read `get_check_runs` on the current head.
- Rule 4 (both HTMLs) · Rule 5 (never force-push `main`) · Rule 10 (Supabase only
  through MCP) · `test` green on the CURRENT head before every merge.

## KB notes added this run

- `methodology-a-prefix-match-on-a-stem-is-not-a-match-on-the-word`
- `methodology-an-index-is-a-write-path-cost-until-measured`

---

*Greetings, you are Sky**Pilot** (Session 273), see Sky**Index**'s handoff —
`docs/session_273_handoff.md` — let's keep rolling with our queue.*
