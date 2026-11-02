---
title: "Session 545 handoff: the List engine owns suggestions and filter counts, two colleges back in the funding join"
date: 2026-11-02
session: 544 (SkySombrero, Sam's session, live from about 01:32Z 2026-11-02)
tags: [handoff, commons, commons-list, funding, college-identity, sierra, jst]
status: current
---

# You are Session 545

Your moniker is **SkyWhirlpool** (galaxy names, Sam at S540). S544 ran a **full checkpoint** (a KB generator moved:
`kb/_seed_college_short_names.py`). Skipped: README (no surface it describes changed) and the Pipeline tab (no phase,
auditor or re-mint moved). Run `list_sessions` first.

## What shipped (all merged on a passing `test`)

- **#2673, the List norms' step 1.** `commons_list.js` takes a spec's `suggest` slot and `changed: true`: *Suggested: what
  (why)* with the verb and Dismiss under the title, the visit's changed set, the filter ids `suggested` and `changed`.
  CR's rung proposals read *Suggested groups* (Confirm the group); Subjects' open picks read *Suggested picks* (Confirm
  this pick). **A pick in a collision is never suggested.**
- **#2675, step 2.** Every filter word carries its count from the engine; `counts()` for Program Requirements and
  Courses; `uncounted(id)` leaves a word bare while its data is unread; *Selected* on every List.
- **#2674.** The nightly procedures run rebuilds `kb/status/commons.json`, so the Exhibits tile agrees with Review the
  same night (351 against 1 before).
- **#2676, the funding join (Sam, Open Asks Sheet 155, *restore*).** Sam asked Sierra the JST question; she named the 41
  and said 30,653, and showed *no counts* for City College of San Francisco and College of the Desert. #2598's short
  names had left both in `cpl_funding_performance.js`'s `unmatched` from the 2026-10-31 run. The join reads aliases,
  *Desert* is an alias, `tests/funding_name_resolver_test.py` pins all 115 roster rows. #2677 and CPLBrain#598 record it.

## Sam's decisions this run (cpl_memory rows name him)

- Sheet 155 card 1, *restore*, 02:42Z 2026-11-02, his own call (`sam-sheet-155-rulings-2026-11-02`). No sheet is open;
  no lane carries NEEDS SAM.

## Read in order

1. `docs/kb-notes/reference-catalog-commons-list-norms.md` (steps 1 and 2 landed, step 3 next) and `docs/commons_lessons.md`, *S544*.
2. `docs/cpl_funding_lessons.md`, *S544*, and `docs/kb-notes/methodology-a-name-a-join-keys-on-is-a-key.md`.

## Open work, in order

0. **After the 06:17Z daily run, check it carried the fixes:** `cpl_funding_performance.js` has no City College of San
   Francisco or College of the Desert under `unmatched`, and `vet_star` and `vet_jst` carry *San Francisco* and *Desert*;
   `cpl_funding_ess.js` reads 152 statewide credentials (#2667); `kb/exhibit_slo_neighbors.json` was built (#2668). The
   funding page should then show both colleges' JST condition met.
1. **The List norms' step 3:** bands from a spec's `groupOf(r)` in the engine, read only where the spec has no save, so
   the Courses List stops hand-rolling its M-ID bands (`coci_lookup.js` `bands`).
2. **The Exhibits List onto the engine's suggestion slot** and changed set (its own `listSuggest`, `sgDone` and
   `L.changed` today); the engine contract says how.
3. **Carryover:** step 10's credential harvest night; the cert link's next families (AP, CLEP, IB); Monterey Peninsula's
   14; Accept's email; Sierra's first-text latency; the college short-name editor. Offered to Sam, no answer: a smoke
   mode for the JST question. For the identity lane, Sam's call: the canonical reads *Miracosta College*; the college
   styles itself *MiraCosta*.

## Lessons to honor

- **A name a join keys on is a key.** Before changing a short name, keep the old one in `EXTRA_ALIASES`, then run
  `tests/funding_name_resolver_test.py`.
- **A rollup row that says "no counts" for a college MAP holds data on is a join failure upstream.**
- **A machine suggestion runs the write's own refusal first** (one code, one MQ discipline).
- **Run a long local test loop in its own worktree**; switching branches under it voids the result.
- **No unmeasured number in a PR body, even as an example.**
- To measure what a funding fix moves without MAP's report: patch the committed `cpl_funding_performance.js`, run
  `cpl_funding.js` in jsdom with `CPL_FUNDING_NO_REMOTE`, compare `_alloc()` and `_conditions()` (lessons S544).

## Let go

S544 dropped every PR subscription and deleted its check-in (`trig_01FH3aNn8wiUSdCJFmYd8gNW`). The Sheet 155 artifact's
watch lapses with the session. The CPL queue fires next at 06:12Z on 2026-11-02.
