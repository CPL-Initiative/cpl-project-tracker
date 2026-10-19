---
title: "Session 415 handoff: the Coursedog reader (Merced loaded); the slash rescoring at four colleges; build 7e4a2a9c5ba7"
date: 2026-10-18
session: 414 (SkyChamise)
tags: [handoff, program-requirements, catalog-sweep, coursedog, reconcile]
status: current
superseded: true
superseded_by: session_421_handoff.md
---

# You are Session 415

Your moniker is **SkyRedbud**. Session 414 (**SkyChamise**, `session_0174qTiBg78a3LCReYkWk8GN`, from 09:13Z on
2026-10-18) was started by Sam's routine and checkpointed with the Rule 9 list. If the routine started you, follow
`docs/reference/scheduled_sessions.md` first.

## Sam's words this run

None: a scheduled session, no message from Sam. Rulings in force: the CER procedures ask (2026-10-18 ~02:55Z), no
approval per item (2026-10-17), extraction with no card up to $40 a college (2026-10-14). Open Asks Sheet 93's store
was empty at 09:15Z (https://claude.ai/artifact/MZXYEqiNitiWGiTakDHUwW, current, three CER cards).

## What shipped (S414)

- **The display apply of `3f93779f0115`** landed on `main` (run 39111185413).
- **#2224, the Coursedog reader:** Merced's own program search call is rewritten by a route (limit 20 to 250; a
  replay without the page's headers answered 401), then each program's Requisites tab. Merced: 154 of 172 found, 125
  of 154 passing, $9.14, **153 loaded** (run 39119871201). Dated reads filed (registry d86f7dae; MAP 33 codes,
  6d94c10a).
- **The slash rescoring, by free reconcile runs:** Glendale 14 replaced (37 to 43 passing), De Anza 12 replaced plus 6
  new programs loaded, Los Angeles Trade Technical 5 replaced plus 9 inserted, Crafton Hills 2 replaced.
- **A second slash shape** in the scorer: `THART/S 124X2` printed, `THART124X2` stored (`listed_key()`).
- **Display build `7e4a2a9c5ba7`: 15,946 programs at 114 colleges**, in #2224.
- Spend: Merced $9.14, De Anza's six about $0.50, LA Trade Technical $0.66.

## In flight at sign-off (check each first)

1. **#2224 merged** (`34eb3e48`, 11:05Z) and its display apply was dispatched on `main` (`step=display`). Read its
   applied record (`Applied record: the page's display build (run N)` on `main`); if it failed, dispatch it again.
2. **Branch `claude/s414-slash-delta`** (not in #2224): San Joaquin Delta's reconcile (run 39116289105) fixes its two
   `THART/S` records but rescored 204 others under the later degree-total check, 152 to 126 passing. Decide whether the
   28 new arithmetic failures are true readings before any reread; if they are, merge `main` into it, reread, and add
   it to the next build.

## Priority after that

1. **San Joaquin Delta**, as above.
2. **Taft's degree-total records** (34 fail arithmetic: 22 name no total, 12 unequal, most reading the page's 60 as the
   major's) and **Cañada's 11** (a PDF reader change for pages 148-154 and the course availability table).
3. **Merced's 18:** 10 page_claimed (a certificate and its degree naming one list, e.g. Child Development A.A.) and 8
   not found (Diesel, Mechanized Agriculture: the tab prints few listed codes). `kb/program_requirements_college/merced/capture.json`.
4. **Sheet 93's three CER cards** stay waiting on Sam.

## Patterns that worked

- **A reconcile run rescores for free** (`step=reconcile`, extract 0): a scorer fix reaches filed records with no
  model call. Reread it before any extraction on the same branch: reread posts only the newest run.
- **One branch per college, dispatched together**, then a wave branch merging them with one display build.
- **A route that rewrites the page's own call** carries the page's auth where a replay does not.

## Lessons to honor

- Read a reconcile's summary before its reread: it applies every later scorer check, not just the fix.
- `kb/_build_roep_display.py` needs `openpyxl` in the sandbox (`python3 -m pip install openpyxl`).
- A load and its display build land together, or `lints` holds every PR red.

## Not refreshed this checkpoint

- The Pipeline tab: its phases did not move. `kb/README.md`, `README.md`: nothing they cover changed.
- The UI pass: skipped for scope; `cobi:pipeline` stays due (`python3 scripts/ui_pass.py --next`).
- The open-asks sheet: Sheet 93 unchanged and current, so no rebuild. No KB note crossed the bar.

## Subscriptions and check-ins

S414 subscribed to #2224 and releases it at sign-off; no check-in, no artifact watch. The four `claude/s414-slash-*`
branches besides Delta are merged into #2224's branch; `claude/s414-merced-coursedog` likewise.
