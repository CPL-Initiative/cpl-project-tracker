---
title: Session 264 handoff — the counselor step becomes a measure, and the last dial gets a control
date: 2026-09-15
session: 264 (SkyMantis)
tags: [handoff, implementation-funding, measures, curator-controls]
status: current
---

# You are Session 265

Your moniker is **SkyLedger**. S264 made the counselor lifecycle check something the funding
model can measure, and gave `metric_src` — the last funding dial with no control — a picker on the
priority card. Sam set both live dials himself.

⚠️ **PARALLEL LANES.** [`docs/session_253_handoff.md`](session_253_handoff.md) (SkyProof, dark mode)
and [`docs/session_254_handoff.md`](session_254_handoff.md) (SkyStar, SkyView) are still live for
their lanes; this file supersedes only [`docs/session_263_handoff.md`](session_263_handoff.md).

Read in order:
[`lanes/implementation-funding.md`](reference/lanes/implementation-funding.md) ·
[`methodology-a-pipe-discards-a-commands-verdict`](kb-notes/methodology-a-pipe-discards-a-commands-verdict.md) ·
[`methodology-retiring-a-behavior-means-inverting-its-tests`](kb-notes/methodology-retiring-a-behavior-means-inverting-its-tests.md) ·
[`cpl_funding_lessons.md`](cpl_funding_lessons.md) (2026-09-15) · PRs #1582 #1583 #1584 #1585.

## What shipped

- ⭐ **#1582 — THE COUNSELOR STEP IS A MEASURE, AND `metric_src` HAS A CONTROL.** P2's text named the
  counselor check; its pin (`ppa_u`) never read that field. `MEASURES` had no counselor entry (so the
  text resolved on its PORTAL clause to `pp_u`) and `metricMilestone()` had no `accepted` branch (so
  the diagnostic flagged a mismatch against the CORRECT config). Both go through one predicate,
  `saysCounselorAccepted`. Plus the **measure picker** — one select in the metric block, options
  derived from the registry, `publicMode()`-gated. ⚠️ **Un-pinning stores `""`, never deletes**: a
  deleted key lets a lower override layer's pin resurface.
- **#1583** — the builder's retired "eligible is inflated upstream" story corrected to Sam's account,
  plus the decision sheet.
- **#1584 — Credit FTES is the only allocation basis.** `allocationBasis()` is a constant; a stored
  `"headcount"` is inert. Measured before removing: flipping it moved **69 of 118 awards**, largest
  swing **$110,391**.
- **#1585** — measure options named by route, batch upload included.

## ⚠️ Sam's decisions this run — do not re-litigate

1. **The counselor check is on P2, not P1** — I had it backwards from his first message and built a
   whole mockup on P1 before he corrected me.
2. **He SPLIT the elements rather than combining them.** Asked for one measure carrying counselor AND
   origin, he put origin on P1 (`ppa_u`) and the counselor step on P2 (`pac_u`). P2's text and
   measure now match exactly. Simpler than the combined source I was about to declare.
3. **"Don't worry about measurable but for the moment stranded funding."** P1 measures 666.5 units
   against an ~88,000-unit target; **0 of 118** institutions reach it; demonstrated is $2,167,955
   (8.6%) against $6,918,139 with P1 on `pa_u`. He accepts this — the origination element is coming.
   ⭐ **His pin is FORWARD-CORRECT**: `ppa_u` is the key the origin cut lands on. **Do not advise
   changing P1 again.**
4. **"Include batch in P1."** The label names three routes though the measure counts two.
5. **"Effective" is retired vocabulary** — its absence from all three repos is correct, not a gap.
6. **Eligible is the whole JST by design** (see the CPLBrain braindump) — the gap to applied is
   correct applicability filtering, and industry CPL avoids it because colleges only adopt an exhibit
   when they hold a course to articulate with it.

## NEEDS SAM

The [2026-09-15 decision sheet](visuals/2026-09-15-counselor-measure-and-carried-dials.html) has
seven items and **all seven are answered** — executed 2026-09-15 after Sam asked whether a new
sheet existed. ⚠️ **S264 reported five of them unanswered and was WRONG**: it read the `replies`
collection BEFORE he wrote items 2, 3, 5, 6 and 7 (timestamps 20:02–20:03Z) and never re-read.
**Re-read a sheet's store at execution time, not once at the top of the run** — the store is live
and he answers while the session works.

| # | Verdict | State |
|---|---|---|
| 1 | edit | Drove the route-named picker labels (#1585). Done. |
| 2 | yes | Sam trimmed it himself — verified 2026-09-15 21:3xZ against his screenshot of the live tab: P2 read *"Applied CPL units (FTES) for students with Counselor step checked"*, no origin clause. ⚠️ **He said immediately after that he was still correcting the text, so RE-READ `cpl_funding_config` before relying on this** — and re-run the diagnostic, because a reworded metric can outrun its pin. ⚠️ S264 also had this as P1's clause; it was always P2's. |

⛔ **DO NOT "FIX" P1'S PROSE FALLBACK — Sam ruled *"1 leave it"* (2026-09-15).** Checking the pins after his text edit turned up that P1's wording resolves to `pp_u` (portal TRANSCRIBED, ~25 units statewide) before `pa_u`, and that **no wording derives `ppa_u`** — P1 is correct only because it is pinned. He was shown both the finding and a fix (rung-aware portal rules plus a `ppa_u` prose entry) and chose to leave it. The pin holds; nothing is wrong on screen. Re-raising this is re-litigating a settled call.
| 3 | edit (*"see screenshot and chat"*) | Resolved to `ppa_u`, NOT the `pa_u` the sheet proposed. He set it. Done. |
| 4 | yes | Headcount basis removed; `allocationBasis()` locked to `ftes`. Done. |
| 5 | yes | Per-CPL-type unit portion added to the standing Pedro request (lane NEXT ⓪). Done. |
| 6 | yes | Note drafted: [`docs/map_eligible_label_note_draft.md`](map_eligible_label_note_draft.md). **Sam sends it, a session never does** — and re-measure the reconciliation before he does, because the numbers ARE the argument. |
| 7 | yes | CPLBrain PR #148 merged (`9bd12af`). Done. |

## Queue

- ⭐ **THE ORIGINATION CUTOVER IS ASYMMETRIC.** NC (`LocID2`) lands automatically — the builder emits
  `nc_pe`/`nc_pa`/`nc_pt` and consumers are wired. **The credit side does NOT**: the builder holds the
  `ppa` cutover from `Potential Student` to named origins PENDING on confirmed spellings and emits an
  `origin_values` histogram to confirm them. Only that cutover makes the three-route labels true, and
  its only signal is one line in a daily run log. **It will wait on nobody.**
- Carried: `Counselor_Verified` into the daily fetch; 51 guessed column offsets in
  `excel_to_dashboard.py`; SkyView ⑩/⑪ (S254); the explainer video shot sheet; COBI-wide contrast
  (17 of 38 routes).
- ⚠️ **Docs over budget:** `roadmap_archive.md` 4.3× · `cpl_funding_lessons_archive.md` 1.78× ·
  `lanes/implementation-funding.md` 1.20× (compacted three times this run while absorbing a full day).

## Patterns that worked

- **Measure before advising.** The Headcount removal had been "dead policy" for two sessions; it
  shipped the day it became "69 of 118 awards, largest swing $110,391".
- **Read the builder before advising twice.** It showed Sam's P1 pin was already forward-correct and
  my advice was aimed at the wrong horizon.
- **Ask the model, never re-derive.** `_alloc()` / `_csv()` / `_effective()` answered every figure.
- **Mutate every new guard.** Both new suites were proven to fail on the real defect by name.

## Safety patterns to honor

⚠️ **NEVER PUT A GATE BEHIND A PIPE** — it discards the exit code. This cost a false "suite is green"
report and a push on a stale dependency map, in one day. ⚠️ **`npm test` green is not CI green**: CI
runs `kb/_build_dependency_map.py --check`, which the local suite does not — rebuild the map as the
genuinely LAST step. Rule 4 · Rule 5 (never force-push `main`) · Rule 10 (Supabase only through MCP) ·
the `test` check green on the CURRENT head before every merge, and a `check_suite` wake routinely
names a SUPERSEDED `head_sha` · a draft PR cannot be merged (mark ready first) · dials are Sam's,
through the tab · MAP read-only · the public KB untouched.

## KB notes added this run

- `methodology-a-pipe-discards-a-commands-verdict`
- `methodology-retiring-a-behavior-means-inverting-its-tests`

---

*Greetings, you are Sky**Ledger** (Session 265), see Sky**Mantis**'s handoff —
`docs/session_265_handoff.md` — let's keep rolling with our queue.*
