---
title: "Session 251 handoff — three silences, and a description that belongs to nobody"
created: 2026-09-10
updated: 2026-09-10
tags: [handoff]
obsidian-folder: cpl-project-tracker/handoffs
superseded: true
superseded_by: session_252_handoff.md
---

# You are Session 251

Your moniker is **SkyLedger**. The name is the job: this run's work was mostly
about what a surface *records* and what it *tells the person who can act* — an
expired row that said nothing, exhibits printed where nobody reads, and a
description that named a winner among colleges.

⚠️ **SkyReach (S250) wrote this file after closing all six of Sam's 2026-09-10
reports.** Two PRs merged: **[#1537](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1537)**
(`c488a017`) and **[#1538](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1538)**
(`431ea9b5`).

## ⭐ THE THINGS TO CARRY FORWARD

1. ⭐ **FAILING CLOSED AND FAILING SILENTLY ARE SEPARABLE.** Sam's live-session
   banner row was active, had a link, and had expired two days earlier. The guard
   hid it — correctly. **Every check in `cobi_live_banner.test.js` asked whether
   the banner was ABSENT, and absent was right every time**, so the suite was
   green through the whole day he spent believing the feature was never built.
   Now promoted to a standing practice in
   [`engineering_ui_practices`](reference/engineering_ui_practices.md).
2. ⭐ **THE OBVIOUS DETECTOR MEASURED THE WRONG THING.** "Boilerplate" reads as
   *repetition*, and the six most-reused descriptions in the corpus are the C-ID
   descriptors for statistics, psychology, government, composition, public
   speaking and critical thinking — **1,149 rows of our best text**. A repetition
   rule deletes those first. Junk announces itself: 247 of 127,266 rows, 107
   distinct strings, all read by hand. Note:
   [`methodology-the-obvious-detector-measures-the-wrong-thing`](kb-notes/methodology-the-obvious-detector-measures-the-wrong-thing.md).
3. ⭐ **THE CLUSTERING LINK MATTERS MORE THAN THE THRESHOLD.** Complete-link at
   Dice 0.3 reaches exactly as far as single-link at 0.4 (64% either way) with
   **0.0% loose clusters against 10.1%**. The number fell because the rule got
   STRICTER. Note:
   [`methodology-consolidate-sentences-not-documents`](kb-notes/methodology-consolidate-sentences-not-documents.md).
4. ⚠️ **A FIXTURE THAT CANNOT FAIL IS NOT A FIXTURE.** The consolidation fixture
   was rebuilt **twice** — its first version stayed 78/78 green under both a
   revert to support-ordering and a revert to single-link. Falsifying every new
   check by reverting its own line is what caught it. Same run, same shape: a
   test comment claimed a shared dismiss key would break the banner; it does not.
5. ⚠️ **`"".indexOf("")` IS 0.** `charAt` past the end returns `""`, which every
   `indexOf` reports as found at 0 — an unguarded bracket scan hangs the page on
   the last sentence of every description.
6. ⚠️ **`CLAUDE.md` IS AT 59,995 B AGAINST A 60,000 BUDGET.** Five bytes. The
   next structural addition needs a deliberate pare-down first; this run put its
   one PUSH-worthy rule in `engineering_ui_practices` instead.

## Sam's decisions this run

- **The description names no college.** *"I don't want to choose the single most
  representative description and attribute it to the college it came from. Doing
  so could lead to division as some faculty may question the choice… If we always
  provide a generative description and note such, it will allow the faculty
  reviewers the freedom to revise and accept by consensus."* Overrules S235's
  medoid. Resolved by making the unit the **sentence**, not the document — so
  nothing is composed and no college wins.
- **The exhibits list belongs in course view.** *"…on the course cards in course
  view (not just CPL view) when the Articulations chip is selected."*
- **CPL mode is a second universe, not a relabelling.** His words are in the
  lane's NEXT verbatim: CER titles as identities, local exhibits as members,
  rings where a course articulates. ⚠️ `ccr_cpl.json` is keyed the INVERSE way —
  the builder is a new one.
- **Advise and pushback always welcome** (his standing note this run). Item 1's
  premise was half wrong and saying so with data was the right move; he corrected
  himself on the rest.

## Carryover

- **NEEDS SAM — the C-ID/CCN descriptor text.** He asked for the statewide
  descriptor where one exists; MAP holds the **designation**, not the text (541
  of 49,896 — 484 C-ID, 57 CCN). Those cards now say so. Loading them is a data
  feed, and whether ASCCC publishes them in a loadable form is the open question.
- **NEXT — the CPL-mode builder.** Lane-sized. See the lane's NEXT.
- **OPEN, unchanged from S250** — the smoke test's mode 16a (a prose grep Sam has
  a proposal for and has not ruled on); `smoke_test.sh` ~line 518 (Pierce has no
  `"Pierce College"` variant); lane NEEDS SAM ② and ③.
- **`npm run a11y` reports 40 failures**, all the standing COBI/Fact Sheet
  backlog. **SkyView passes all 11 routes.**
- ⚠️ **The To-Do feed is at 18 items against a ~12 guideline.** This run added
  two and could verify only one of the sixteen standing items as still open
  (`s245-fable-unfailable-checks` — the runner still reports 7 files with no
  readable check count). **Triage it WITH Sam** rather than guessing which of his
  asks are done; deleting a live item loses his queue.

## Read these, in order

1. This file.
2. [`docs/reference/lanes/skyview-ccr-interface.md`](reference/lanes/skyview-ccr-interface.md)
   — lane state, NEEDS SAM, NEXT (Sam's CPL-mode words are there verbatim).
3. ⚠️ [`docs/reference/skyview_invariants.md`](reference/skyview_invariants.md)
   — **before touching the code.**
4. [`docs/ccr_atlas_lessons.md`](ccr_atlas_lessons.md) — this run at the bottom.

## Patterns that worked

- **Verify the ask against the SCREEN.** Item 2 read as "add the exhibits" and
  the exhibits were already there; only serving the page showed why that was
  still a real complaint.
- **Falsify every new check by reverting its own line.** It caught two fixtures
  that could not fail and one test comment that named the wrong mechanism.
- **Read the whole output when the rule is small enough.** 107 distinct
  placeholder strings is auditable in full; a rule you can read end to end is a
  different object from one you can only sample.
- **Correct the premise with data, then follow the correction.** Fontana High was
  a real fire academy and a legitimate Cx credential.

## Safety patterns to honor

- **The served page inlines `ccr_universe.js`** — a JS change needs
  `python3 prototype/build_ccr_atlas.py`. Never hand-patch `skyview.html`.
- **The description shards are gitignored and not built.** To read real
  descriptions in Chromium: `python3 kb/_build_ccr_universe.py --shards-only`
  (~5 min, 50 MB into `prototype/ccr_desc/`), then serve `prototype/`.
- **`npm test` is not CI.** Run `kb/_build_dependency_map.py --check` and
  `kb/_build_docs_index.py --check` too.
- **A merged PR is finished.** Restart the designated branch from `origin/main`
  for follow-up work; never stack on merged history.
- **The sandbox cannot reach `*.supabase.co` or `api.github.com`** — Supabase via
  MCP, CI via the MCP `github` tools.

---

*Greetings, you are SkyLedger (Session 251), see SkyReach's handoff —
`docs/session_251_handoff.md` — let's keep rolling with our queue.*
