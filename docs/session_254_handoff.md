---
title: Session 254 handoff — the sweep is an instrument, and CPL is a universe
date: 2026-09-10
session: 254 (SkyStar)
tags: [handoff, skyview, ccr, cpl-mode, sweep, guards]
status: current
superseded: true
superseded_by: session_255_handoff.md
---

# You are Session 254

Your moniker is **SkyStar**. The name is the job: 84 statewide credentials now
wear a second ring and the word on their label, and at 84 a PERMANENT label is
affordable where 1,987 cannot be labeled — that is the first refinement of the
CPL view Sam asked to see *"in prod to refine."*

⚠️ **TWO LANES RAN ON 2026-09-10, AND BOTH HANDOFFS ARE CURRENT.** SkyLabel
(S252, this file's author) ran SkyView; SkyTouch (S249) wrote
[`docs/session_253_handoff.md`](session_253_handoff.md) for the dark-mode lane
and named its next session SkyProof. Rule 9's "highest number wins" is about
staleness and does not adjudicate a collision: read 253 too, and check whether
its **PR #1542** merged before building on either lane.

Read in this order: [`docs/reference/lanes/skyview-ccr-interface.md`](reference/lanes/skyview-ccr-interface.md) ·
[`docs/reference/skyview_invariants.md`](reference/skyview_invariants.md) (the CPL
universe section) · [`docs/ccr_atlas_lessons.md`](ccr_atlas_lessons.md) (the
2026-09-10 SkyLabel section) · [`docs/skyview_backlog.md`](skyview_backlog.md) ⑩ and ⑪.

## What shipped (both merged)

- **#1546** (`e45a77d`) — **the sweep is an instrument.** `npm run sweep`
  (`prototype/check_skyview_sweep.js`) drives the SERVED page in Chromium through
  222 checks of every reader and curator action, mocks the assistant, refuses the
  network, recovers from a crashed section. Its first two catches: the Ask's
  union where a question meant an intersection (a scoped term, a stem fallback),
  and a mouse click whose second event was dead (Drag… by mouse left Esc dead).
- **#1547** (`f09a567`) — **CPL is a universe, not a lens.** The CPL word swaps
  the payload under the same map: 1,987 credentials, 3,813 local exhibits folded
  in, the courses articulated to each as doors back to the Courses map, a second
  ring on the 84 statewide. Members payload `kb/_build_ccr_cpl_universe_members.py`
  (cron beside 4d3b, guarded). Switches and the light are remembered per universe;
  nothing moves on the CPL map. `tests/ccr_skyview_exhibits.test.js` (80).
- CPLBrain **#136** — the vault session note.

## The one thing to carry forward

⭐ **Six defects in the first cut of the CPL view, and not one was visible on
screen** — each was a check: a same-payload guard that read the swap as nothing
to do, an ASI `return`, a route that drew nothing, `ar` counting LINES not
identities (201 points), a restarted turn, a pane seeded empty on re-render.
And two harness lessons: **give the harness a way to ask the page what it found
under the pointer** before guessing why the page disagrees (`__ccrPickAt`), and
**rebuild derived files AFTER the last edit** — the dependency map went red on
the final push because the rebuild came first.

## DECISIONS SAM MADE THIS RUN

1. *"Can you do a sweep of SkyView functionality to test if it acts as expected
   through all actions a user and curator can now take? Advise."* — the sweep
   is the instrument; its observations are calls for him, not defects (⑩).
2. *"See an example of an Ask SkyView search request that did not present the
   correct view of intro welding courses"* — the screenshot that defined the
   scope rule: a term beside a discipline means the term WITHIN it.
3. *"Once we're done with the sweep, let's pick up the CPL view and get that
   built and into prod to refine."* — shipped as a first cut; ⑪ is the
   refinement queue.

## NEEDS SAM

1. ⭐ **The permanent statewide label** — the ring and the word shipped; his
   ask cut off at *"so folks can easily see…"*. ⑪ names the other five calls:
   crowded full-band labels inside a 74-credential island, the 543 pile drawing
   as the biggest discipline, the card's caps, Ask on the CPL map resolving
   against the course vocabulary, a drift check between the two joins.
2. **The six sweep observations** (⑩): two zooms for one destination, the wheel
   not stopping the turn, a hidden panel giving a selection no words, a chip that
   reads `I…`, Close after a sheet edit landing on the canvas, the stale checker
   `prototype/check_ccr_atlas.js` (re-cut or retire).
3. Carried: the `sierra_guidance` CHECK constraint lacks `skyview-ask`; the
   phone's opening width; C-ID/CCN descriptor text; the To-Do feed at 26 items
   against a ~12 guideline — triage WITH Sam.

## Queue

- Refine the CPL view in prod, ⑪ first — the statewide label once he answers.
- `Counselor_Verified` back into the daily fetch (held so it would not widen a PR).
- 51 guessed column offsets in `excel_to_dashboard.py`.

## Housekeeping

`CLAUDE.md` is at 59,997 B against 60,000 — nothing added this run; the next
addition needs a pare-down first. The SkyView lane was compacted at this
checkpoint (13,859 → under budget) by retiring the S251 build narrative to a
pointer. `docs/ccr_atlas_lessons.md` is at ~106 KB of 120.

## Safety patterns honored

Rule 8 query first (the S238 face row was superseded explicitly, not silently);
Rule 4 (the served page rebuilt from the template, both HTMLs untouched); the
`test` check green before every merge; the sweep, a11y (11/11) and the full
`npm test` (322 files) run before each push; MAP read-only; the public KB
untouched.

---

*Greetings, you are SkyStar (Session 254), see SkyLabel's handoff —
`docs/session_254_handoff.md` — let's keep rolling with our queue.*
