---
title: Session 180 handoff — the doctrine has a lookup now; use it
created: 2026-08-21
updated: 2026-08-21
tags: [handoff, session-180, doctrine, sierra, college-identity]
kb-status: internal
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/methodology-index-the-doctrine-to-the-file]]"
  - "[[docs/doctrine_enforcement_lessons]]"
---

# Session 180 handoff

You are **Session 180**. Session 179 was **SkyApply**. Sam's brief was one line:
***"let's cure our need to internalize."***

⚠️ Sam frequently runs several sessions at once. Check `git log origin/main`
before assuming your branch is the only work in flight.

---

## ⭐ RUN THIS BEFORE YOU WRITE ANY CODE

```bash
python3 kb/doctrine.py --changed
```

It prints, for every file in your working diff, the committed rules that already
name it — **titles, not a reading list**, because in this corpus the title *is*
the rule. It reads untracked files too, so a brand-new file is covered.

This exists because of a measurement, not a hunch:

| | |
|---|---:|
| KB notes | 299 |
| Prescriptive (rules) | 236 |
| Rules naming a test or lint | 20 |
| Notes named anywhere in an executable file | 8 |

**92–97% of the doctrine has no consumer.** And `cpl-chat/index.ts` — where the
"3 of 9 LACCD colleges" defect shipped — is named by **22 notes, four about
caps**, one titled *"A capped list must never read as a census."* The knowledge
was written, distilled to a title that states the rule, and indexed to the exact
file. Nobody could ask.

**Recall costs scale with the corpus. Lookup scales with your diff.**

Second thing, and it needs no invocation: **`npm test` now fails a file that runs
FEWER checks than recorded** (`tests/check_floor.json`, 241 of 247 files, ~7,500
checks). If you legitimately remove tests, `npm run test:floor` re-baselines —
and the lower floor shows up in your PR diff, which is the point.

---

## What shipped (PR #1280)

| | |
|---|---|
| **Check-count floor** | `tests/lib/check_ledger.js` + `tests/check_floor.json` + `tests/run.js`. The runner judged files by exit status alone. |
| **Doctrine lookup** | `kb/doctrine.py` (+ `tests/doctrine_lookup_test.py`, in CI). |
| **Sierra district roster** | `resolveDistrict()` in `cpl-chat`. LACCD answers from `map_colleges.district`, alphabetically. |
| **"Students in MAP"** | Replaces the false "Students Awarded" label, plus a required Transcribed Units column. |
| **Suppressed chip** | College Identity tab chips MAP's 8 sandbox rows. |
| **`american_spelling` precision** | The `analys` stem flagged **430 correct words**; now only the verb forms. |

---

## Read in this order

1. **`cpl_memory` FIRST** (Rule 8). Tags `doctrine` / `sierra` / `college-identity`.
2. [`methodology-index-the-doctrine-to-the-file`](kb-notes/methodology-index-the-doctrine-to-the-file.md) — the three tiers.
3. [`docs/doctrine_enforcement_lessons.md`](doctrine_enforcement_lessons.md) — including everything that went wrong building it.
4. §11 rows: **Sierra: false absences**, **My College**, **College & district identity**.

---

## Decisions Sam made this run

- **Tablize where advantageous** — his own ADR
  (`adr-judgment-in-tables-mechanism-in-code`). ⚠️ **My `TABLE_COLUMN_RULE` half-
  fails its four tests**: the column labels are curator judgment (he changed
  them twice in one message) and they are in code. **Proposed and awaiting his
  go:** a `kind` column on `sierra_guidance` splitting `directive` (prose,
  counts toward the cap) from `display` (structured, doesn't) — one table, one
  read, and it frees the row budget at the same time.
- **No temporary MIS codes.** He asked whether the cron should mint one for an
  org arriving without a location code. Measured: **not a problem today** —
  116/116 colleges have an MIS code and every row has a MAP `college_id`.
  Recommendation accepted-in-principle: **record the entity, never invent the
  identifier**; a synthetic id that later gets replaced is a re-key project this
  repo has paid for twice (`UC-CUR-AUTO*`).
- **Pedro at ITPI has the College Identity tab link** and is fixing the 13
  unresolved names at source.

---

## Carryover

| # | Item | Status |
|---|---|---|
| 1 | **Sam's go on the `sierra_guidance` `kind` column** | New. Would tablize the display rules and free the row cap in one change. |
| 2 | **Consolidate the guidance notes 9 → 7** | New, drafted in the lessons doc. Three rows are one "answer directly" principle; two carry the military caveat twice. ⚠️ **Eviction is oldest-first and silent — the naming rule is the one at risk.** |
| 3 | **Raise `GUIDANCE_MAX_RULES` 10 → ~20** | New. It's a fossil: per-rule went 500→1500 and total 2500→9000 on 08-12; the row cap stayed. Two places: the edge function and `GUIDANCE_SENT_CAP` in `sierra_training.js`. |
| 4 | **Give `Calbright College Credit` + `Launch Apprenticeship Non-Credit` rows in `map_colleges`** | New, small. `college_id` null + `awaiting_map_id`, so they join instead of vanishing from 4 tables. |
| 5 | **`Las PosTest College` is in Sierra's corpus** | New. `chatbox_college_profiles` has no `entity_kind`, so the `neq.test` filter can't reach it. Empty shell, low harm, shouldn't exist. |
| 6 | **Add `college_id` to the tables we build** | New. 18 tables are text-keyed; 13 carry the id. Resolve once at load where a miss is visible, not at every read where it is silent. Order: `chatbox_college_profiles` → `map_college_contacts` → `college_geo`. |
| 7 | **6 files print no readable check count** | New, trivial: each needs a final `N/M checks passed` line to come under the floor. |
| 8 | Sam re-asks the LACCD question and reads the prose | Carried. |
| 9 | Smoke mode 7 greps model PROSE | Carried, known-weak. |
| 10 | 12 adoption-file statewide titles absent from `chatbox_credentials` | Carried. |
| 11 | Everything in handoffs 173–179 | Untouched. |

---

## Patterns that worked

- **Measure before building.** Every design call this run came from a query, not
  an opinion — including "don't mint temporary codes" and "the row cap is a
  fossil".
- **List the directory before writing a note.** I nearly wrote a duplicate of
  `a-check-that-never-registers-can-never-fail`; instead it got the consumer it
  had been asking for since 08-15.
- **Fix the instance, then grep for its twin.** The column-label fix went on
  *both* the roster and name-match paths, because a fix on one branch and not
  its twin is exactly the "three of nine" defect.

## Safety patterns to honor

- **Never force-push `main`** (Rule 5). **Rule 4** — `cmp` the two HTMLs.
- ⚠️ **Never deploy `cpl-chat` through the Supabase MCP.** Use
  `.github/workflows/cpl-chat-deploy.yml` (`workflow_dispatch`, `confirm: DEPLOY`).
- ⚠️ **Never baseline the check floor against a moving tree.** Done twice this
  run; both ledgers recorded broken states as floors (`sierra_geo_ranking` at
  **1** against a true 50). Freeze, then generate.
- ⚠️ **`lift_ts.js` constrains the code shape in `index.ts`.** No `type X = {}`
  inside the lifted range, no `!` non-null assertions, no object-literal
  annotations — and **never quote a lift marker in a comment**, because
  `indexOf()` will find it there.
- ⚠️ **Verify fail-first, and check the demonstration can actually fail.** Two of
  mine could not: a `>=` that stayed true while 235 entries went missing, and a
  lift that threw pre-change so the run reported "0/5 skipped" instead of
  failing.

## Running the checks

```bash
npm test                                      # 248 files, now floor-guarded
npm run test:floor                            # re-baseline (review the diff)
python3 kb/doctrine.py --changed              # ⭐ before you write
node tests/sierra_district_roster.test.js     # 26 — the district roster
node tests/check_ledger.test.js               # 23 — the floor itself
python3 tests/doctrine_lookup_test.py         # 19
python3 kb/_docs_audit.py                     # the docs lint
```

## Your moniker

SkyApply suggests **SkyAsk II** — no. Take **SkyQuery**: the run's whole finding
is that the corpus needed a way to be asked. Coin your own if you prefer; Sam
sometimes names the session in his greeting, and that always wins.

**Sign off with your moniker AND the next handoff number** — e.g. *"SkyQuery
signing off. Next is Session 181 — `docs/session_181_handoff.md`."*
