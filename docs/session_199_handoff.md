---
title: Session 199 handoff — from SkyPin (Session 198/199 run)
created: 2026-08-27
updated: 2026-08-27
tags: [handoff, session-199, cpl-funding, noncredit, measurement]
kb-status: internal
obsidian-folder: cpl-project-tracker
---

# You are Session 199

SkyPin here. This run shipped **#1363** and **#1364** and closed the noncredit
lane's build step 1 — but the headline is not the step. It is that **the credit
lane's largest priority had been paying every college $0 for a reason nobody
could see**, and that my own first fix for it was measured on the wrong people.

## ⭐ Sam's rulings this run — read these before anything

| ruling | what it settles |
|---|---|
| **`Potential Student` = Yes IS the origin filter, for now** | *"our temporary field indicating it was submitted from a landing page or the portal … count every instance of Yes as meeting these metrics."* The Access metric was never unmeasurable. |
| **`Origin` + `LocID2` are coming** | Explicit origins (Student Portal / Landing Page / Batch / College Entered) plus a `LocID2` naming the noncredit location. *"all three count the NC FTES only if they have a Yes."* |
| **Row shape: Option A** | A second **NC row per college**, not extra lines inside each P-cell. |
| **Display** | CR/NC chips (not "Credit"/"Noncredit") · Tgt and Now folded onto aligned lines · abbreviated `$99.7K` · **bold only on the Total column**. |
| **Draft-model posture (carried from 198)** | A missing upstream field is not a blocker and not a design flaw — *"freedom to play to pay"* — but values must calculate **correctly on available data**. An absent number is fine; a plausible wrong one never is. |

## ⛔ What was actually broken, and is now fixed

Sam's Year-1 **Access** metric asks for *applied* units from portal / landing
page / batch upload. `measurability()` matched its prose, hit "Landing Page"
first, and resolved to **`pp_u`** — portal-origin **transcribed** units, 25.0
across 3 of 105 colleges. **All 115 colleges read $0** on the priority holding
share 0.34 (**$7,969,705**), and under front-load that is the whole window.

⚠️ **The direction matters.** Read as a genuine data gap it would have *advanced
the full cap*; resolving to a real key paid $0 instead. The mis-resolution
flipped roughly a third of the pool from "advances" to "earns nothing" —
silently, because a low number on a new program looks like the program being new.

⚠️ **And my first fix was wrong.** I proposed pinning it to `pa_u`. But every
metric in the builder except `pp` carries `and not is_potential`:

```python
("pe",  ecr > 0 and not is_potential),
("pa",  acr > 0 and not is_potential),
("pp",  tcr > 0 and     is_potential),   # only portal measure — TRANSCRIBED
```

**`pa` and `ppa` are DISJOINT cohorts**, not superset and subset. `pa_u` would
have scored Access on exactly the students its wording excludes. New
`ppa`/`ppa_u` is the mirror: applied units where `Potential Student = Yes`.

**Live now:** `ppa_u` = **108 students / 661.5 units / 52 of 105 colleges**;
Access went from 115 "no feed" to **12 earning, 0 no-feed**, MILESTONE warning
cleared.

## What shipped

- **`metric_src`** — a priority pins its measure instead of having it inferred.
  Registry `METRIC_SOURCES`; `""` un-pins; an unknown pin is a loud `bad_src`
  earning **$0, never a full-cap advance**; a declared-but-undelivered source is
  `undelivered` (Sam's NC ruling: targets shown, $0 earned, not an advance).
- **MILESTONE-agreement check** — the second axis beside the UNIT check. The
  funnel has three rungs and the tab guarded only the unit axis.
- **`ppa`/`ppa_u`** in `funding/_build_funding_performance.py`, `NO_SUPPRESS`
  alongside `pp` (same people, different rung — suppressing costs small-portal
  colleges their Access money).
- Pin written to the **live Supabase config** via `jsonb_set` on the single path.

## ⚠️ Safety patterns this run earned

- **A pin belongs with its metric, NOT in the bake.** `cpl_funding_data.js` is
  stale by design — its slot-2 metric is *headcount/transcribed* while live slot
  2 is *applied/units*. A baked pin lands on whichever metric occupies the slot;
  mine turned **nine assertions across three suites red**, correctly.
- **A guard that has never been made to fail is not a guard.** Two of mine passed
  with the fix deleted — one read source text instead of exercising the CSV, one
  used a fixture whose prose already produced the right answer. Twelve mutations
  run in total across both PRs.
- **When you have predicted the output, inspection stops working.** New KB note:
  `methodology-a-defect-that-produces-the-expected-value-is-invisible`.
- **The stop-hook "N unpushed commits" nag has a real fix**, not just a dismissal:
  `git remote prune origin` clears the stale remote-tracking ref left when GitHub
  auto-deletes a merged branch. `docs/reference/troubleshooting.md` still says
  only "confirm and dismiss" — worth updating.
- Verify layout in **Chromium**, not jsdom (`/opt/pw-browsers/chromium-1194/chrome-linux/chrome`
  via `executablePath`; the repo pins a newer Playwright than the preinstalled build).

## Priority workstream — NC lane, build step 2

**Blocked on ONE thing: the NC shares.** Nothing has been ruled. Inheriting
credit's 34/33/33 is the obvious default and keeps one number to change, but Sam
has not said so. Ask, then build:

1. NC priorities earn against `nc_pe_u` / `nc_pa_u` / `nc_pt_u` — declared in
   `METRIC_SOURCES`, emitted by nothing, so they read `$0 · no feed` honestly
   until `LocID2` lands. **No synthetic data, no placeholder to remove.**
2. Render the **Option A** second row (mock:
   `https://claude.ai/code/artifact/7c62ff4f-12ce-4574-8821-86c667109df9`).
3. ⚠️ `share` splits the MONEY, not the FTES. **Route, don't split.**

## Carryover

- **Year-1 P3's strategy list still names *"noncredit mirror courses"*** — one
  line to move into NC's own strategies when the lane goes live.
- **Sam's phone check** on the Fact Sheet + Sierra/veteran-map pages.
- **TruffleHog stalled ~30 min** on #1364 (queued, never started). It also runs
  on push to `main`, so the merge commit was scanned. Watch whether it recurs.
- Jessica was working **Military CPL** in a parallel session on 2026-08-27 — no
  file overlap with this run, but check before touching ACE surfaces.

## Docs to read, in order

1. `CLAUDE.md` §11 — the funding row (compacted this run; it states current truth)
2. `docs/cpl_funding_lessons.md` — the 2026-08-27 sections, both of them
3. `docs/kb-notes/methodology-a-defect-that-produces-the-expected-value-is-invisible.md`
4. `cpl_memory` — query `tags && array['cpl-funding']` **before** touching this

## Moniker

I took **SkyPin** — the run was about pinning a measure instead of inferring it.
Yours is open.

**Next is Session 200 — `docs/session_200_handoff.md`.**
