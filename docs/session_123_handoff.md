---
title: Session 123 handoff — the $50k tab rework, built on the disposition rate
created: 2026-08-06
updated: 2026-08-06
tags: [handoff, funding, implementation-funding, cpl-lifecycle]
related:
  - "[[docs/cpl_funding_lessons]]"
  - "[[docs/cpl_funding_handoff]]"
superseded: true
superseded_by: session_132_handoff.md
---

# You are Session 123

Previous session: **SkyPlan** (122). Four PRs merged: **#1007** (CPL Type split),
**#1012** (headcount retired as a basis), **#1013** (Pages concurrency rename),
**#1014** (CR backlog + disposition rate). The **$50k tab rework itself is NOT
built** — SkyPlan did the measurement and plumbing it has to stand on. That
build is your job.

## Read in this order

1. `docs/cpl_funding_lessons.md` — the **2026-08-06** section (the whole story)
2. `docs/cpl_funding_handoff.md` — the workstream handoff
3. KB notes added this run, all four load-bearing for what you're building:
   - `methodology-validate-a-derived-metric-against-expert-ranking`
   - `methodology-an-incentive-teaches-where-the-finish-line-is`
   - `methodology-a-label-that-decides-behaviour-is-a-policy-switch`
   - `playbook-diagnose-a-starved-actions-runner`

## The goal, in Sam's words

> *"My real goal is to get colleges unstuck and awarding real CPL to real
> students in MAP."*

The $50k tab currently shows three bare checkmarks per college. He wants
**where you are / where you should be / a few bullets on how to get there** —
high level in the collapsed row, detail in the expanded one — plus per-college
observations. Public-facing, CO voice, non-punitive. His framing of the dance:
*"Just tell us what to do but don't tell us what to do :)"*

## The five things that must shape the build

1. **Applied is THIS phase's focus, not transcribed.** Sam's correction —
   transcribing is a long-term ask that only actualises when outcomes funding is
   live. Outcome 3 currently fires on ELIGIBLE (`pe > 0 || tr > 0`), which is not
   an action a college takes. Move it to **applied**: changes only 13 colleges.
2. **The metric is the DISPOSITION RATE** (`funding/_build_cr_backlog.py`).
   Median **4.7%**; MVC 3rd, Bakersfield 6th, Cabrillo 13th of 106 — the only
   metric that matched Sam's own read. It counts **Not Applicable as work done**;
   Cabrillo's 844 N/A vs 320 Applied is why that matters. Do not "simplify" it.
3. **Every step is a FRACTION, never a check.** The Veteran Star taught colleges
   that uploading is the finish line (applied ≈ JSTs at ratio 1.00). Any new
   binary becomes the new stopping point. `Articulate — 412 of 1,847 CRs`.
4. **Reframe the Star rather than repeating it:** *"★ Veteran Star — 979 JSTs
   uploaded. Those generated 18,264 credit recommendations; 0 have an
   articulation. The star is the starting line."*
5. **Never rank colleges publicly.** No computable metric fully reproduces
   "adept"; a leaderboard would put model colleges mid-pack and the field would
   notice. Each college against its own numbers only.

## Targeting data you already have

- **436,720 rows at Needs Action** (81% of listed CRs)
- **Top 20 exhibits = ~40% of the backlog** (`MC-2204-0088` 29,580 ·
  `AR-2201-0399` 27,101 · `NV-2202-0165` 22,105)
- **11,495 rows are `Credit Is Not Recommended`** — unarticulable by
  construction. Already carved out of the rate and backlog and reported
  separately. **Auto-N/A-ing them is a free win**; raise it with Sam/Malone.
- The $50k **is** the evaluator-OT money (Sam: *"which is where the funding comes
  in"*). The tab never says so. Connect backlog → hours → the grant. You need one
  number from the team: **how long does an evaluator take to disposition a JST
  student's CR list?** Ask MVC or Bakersfield.

## Carryover

| Item | Status |
|---|---|
| **$50k tab rework** | **NOT BUILT — your priority.** Sam owns NC representation in it (he assigned it) |
| Malone's report → daily pull | ⏳ landing ~2026-08-07. Add view to `fetch_custom_report.py`, set `VIEW` in `_build_cr_backlog.py`, add to `daily-dashboard.yml` |
| NC **floor** build | Unblocked by `feederBasis(f)`. **FTES alone only moved Calbright $33K → $40K — the FLOOR is what delivers equity** (~$161K at $150K). With a floor, basis barely matters. ⚠ 4 recipients × $150K = 60% of the $1M — pick the floor deliberately |
| Calbright placeholder | 1,000 FTES, chipped. Retires automatically when a curator enters a real figure. **Malone still to verify** (21,438.17 = 8.63 FTES/student, impossible; likely enrollments) |
| Re-bake `year_priorities` → FTES | **Deliberately deferred.** Fail-soft fallback is still the headcount model. Rewrites ~15 behavioural assertions — its own PR, re-fixture the suite properly |
| Scenario 2 | Live trapdoor: headcount metrics, no `factor`, and its P2 has neither `target_rate` nor `per_student` → target 0. Sam's what-if; ask before touching |
| Peer-adoption worklist | Concept holds, CR-text join too narrow (max 8 peers). Use the CER's credential-level articulations instead |
| GitHub Actions | **Starved — `runner_id: 0`, no runner assigned since ~15:30 UTC 08-06.** Everything merged publishes when it recovers. If still dead: support ticket per the playbook |

## Patterns that worked

- **Ask for the expert's ground truth before computing anything.** Sam's three
  colleges were the free test set that killed three plausible-but-wrong metrics.
- **Read the job record, not the error message.** `runner_id: 0` was the tell
  after two hours of wrong hypotheses; the run's own text said "waiting for
  approval" against a gate that did not exist.
- **Back out a change whose blast radius you discover mid-flight.** The FTES
  re-bake rewrote 15 assertions at once; splitting it was the right call.
- **Verify the branch base after a merged PR.** A `checkout -B` from a stale
  `origin/main` nearly reverted #1013's pages fix — `git fetch` and diff the
  file you care about before pushing.

## Safety patterns to honour

- Rule 9 Supabase live-curation safety; fresh read at write-time
- The student dataset is **per-student** — never commit it; artifacts stay
  aggregate + `<5` suppressed
- Rule 4 (`CPL_Dashboard.html` == `index.html`); Rule 5 (never force-push `main`)
- Prefer injecting tab CSS from the tab's JS over editing both HTMLs

## Moniker

SkyPlan suggests **SkyLift** — the run that gets colleges unstuck. Claim your
own if you prefer.
