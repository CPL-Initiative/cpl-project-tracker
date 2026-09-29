---
title: Session 200 handoff — college CR evidence, and the NCCER lane
created: 2026-08-27
updated: 2026-08-27
tags: [handoff, session-200, cpl, articulation, credit-recommendation, ace, military, lattc, nccer]
kb-status: internal
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[college_cr_evidence_lessons]]"
superseded: true
superseded_by: session_203_handoff.md
---

# You are Session 200

⚠️ **TWO WORKSTREAMS RAN IN PARALLEL ON 2026-08-27, AND THERE ARE TWO HANDOFFS.**
Read **both**, in whichever order matches what you are asked to do:

- **[`session_199_handoff.md`](session_199_handoff.md) — SkyPin, the funding lane.** The
  measure pin (`metric_src`), the Access-metric cohort fix, #1363/#1364. Landed on `main`
  as #1366.
- **This file — SkyMatch, college CR evidence.** Driven by **Jessica**, not Sam. Open on
  PR #1365.

The collision was predicted and it happened: both sessions wrote `session_199_handoff.md`,
and this branch resolved it by keeping SkyPin's at 199 and moving this one to 200. **Neither
is stale** — they are different lanes, not successive versions. `CLAUDE.md`'s
"highest-numbered handoff wins" rule assumes a single line of sessions; it does not hold on a
day with two.

## What shipped — PR #1365 (open, TruffleHog green)

A college names courses it will award for a CPL type and holds **no credit recommendation**;
MAP requires one before an articulation can exist. Jessica: *"This is a common problem we
have with colleges. They can easily identify that a course can be approved for a certain CPL
type, but do not have the evidence specified."* So it shipped as a **reusable matcher**, not
a one-off.

- `kb/_match_courses_to_ace_recs.py` — the matcher
- `kb/college_cr_evidence/lattc_military_2026-08-27.{json,html}` — payload + worklist
- `tests/lattc_worklist_page_test.py` — 51 browser checks (Chromium; **not** in `npm test`)
- Artifact (live, same URL across all revisions):
  https://claude.ai/code/artifact/cbf1e2e5-e3a0-406b-9aaf-1bddcbc3a0c2

**LATTC, 139 military-CPL courses: 87 peer-backed · 46 recommendation-only · 6 need a
faculty call.**

## Read in this order

1. `docs/college_cr_evidence_lessons.md` — the whole story, five dated sections
2. `CLAUDE.md` §11 row **College CR evidence**
3. `docs/kb-notes/methodology-a-frequency-is-not-a-rule.md`
4. `docs/kb-notes/methodology-one-ranked-list-cannot-answer-two-questions.md`

## Jessica's rulings this run — these are inputs, not narrative

| Ruling | Where it lives |
|---|---|
| **Hours >1 unit from the course → NOT LISTED.** Exactly one apart → keep, lower score. | `UNIT_GAP_DROP` / `UNIT_GAP_PENALTY` in the matcher |
| **A CR may serve several courses; a course may take several CRs; any combination.** | `cpl_memory` `a-cr-can-serve-several-courses-and-a-course-several-crs` (verified, verified_by Jessica) |
| **Hold off on combinations** that sum to the units — *"we were overanalyzing"* | unbuilt, and measured as reaching only 4 of 127 courses |
| **Award on the CR printed on the JST, not the MOS** — a service member holds several MOSs | the whole output is CR-keyed |
| **Do not emphasize the ACE exhibit ID**; lead with the CR and the college count | header carries no exhibits; ID lives inside a hover |
| **Units beside the course title, same font size** | `unitsCell()` |

## Carryover

1. ⛔ **NCCER catalog — BLOCKED, needs a human.** `https://www.nccer.org/media/2026/03/NCCER-FULL-CATALOG-2026.pdf`
   is **egress-blocked** (403 at the proxy); `WebFetch` refuses it too. Jessica must attach
   the PDF to a session. Goal: certification → module → CR table. What we already hold:
   **19 NCCER credentials**, **14 statewide with published recs and ZERO adopters**; only
   **Welding Levels 1–4** are articulated, by three colleges (Bakersfield, Barstow,
   Santa Ana). ⭐ The statewide recs are **already at roughly module grain** (*Thermal Cutting
   Processes*, *Printreading and Welding Symbols Interpretation*); MAP records NCCER only at
   the **level** grain, which is why the module evidence disappears.
2. **Ask LATTC about 5 course numbers** whose COCI title is a different course —
   `BLDGCTQ105` (*Basic Blueprints* vs COCI *CPR/AED/First Aid*), `BLDGCTQ600`,
   `WATER001`/`002` (*Modern Water Works*), `ECONMT191`. Flagged on each card.
3. **8 courses have no COCI units** — deliberately unfiltered by the unit rule.
4. **CI `test` check red on #1365 — not this PR's, do not chase it.** Two comments on the PR
   carry the full account. Faithful reproduction (this branch, fresh install, **Node 20.20.2**
   = what CI resolves): **276 files, 0 failures**. The re-run has been spent. The branch adds
   **no JavaScript**; `tests/run.js` globs `tests/*.test.js` only. `js-tests.yml` is
   **non-required** by its own header.

## Patterns that worked

- **Run the page in a real browser.** Chromium is at `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`
  — pass `executable_path`, never `playwright install`. Four defects were browser-only:
  hover-open fighting click-toggle (touch never worked at all), a scroll handler closing a
  popover before the click landed, a duplicate flagged on one card of a pair, and a
  units-vs-title font mismatch.
- **Measure the domain question instead of answering it.** *"Do welding programs have a
  lecture+lab pair?"* → 1,198 welding courses at 79 colleges; 55 lab-titled at 17 colleges;
  of 19 `L`-suffixed numbers exactly **one** has a lecture counterpart.
- **A units join is also a course-identity check.** The second finding was free and worth
  more than the first.

## Safety patterns to honor

- A **regex-scoped extract is fine until the thing it scopes changes size** — widening the
  shortlists left **184 of 299** recommendations without a college list. Both lookups now
  cover all **7,155**.
- **Never pin an assertion to a value that can leave the data.** Three broke this run.
- **`kb/college_cr_evidence/` artifacts are committed** — that is deliberate (they are the
  deliverable, not a build output), but keep them out of any `**/*.md` vault-materialize rule.

## Next concrete step

**Ask Jessica for the NCCER PDF.** Everything else is either with LATTC or with Sam.

## Moniker

SkyMatch → yours to claim. **SkyLevel** fits if you take the NCCER lane (certificate levels
and their modules). Coin your own if you'd rather.
