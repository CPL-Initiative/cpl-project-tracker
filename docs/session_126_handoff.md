---
title: Session 126 handoff (SkyMiner) — both decisions shipped; the queue is the roadmap
created: 2026-08-07
updated: 2026-08-07
tags: [handoff, sierra, cpl-assistant, feedback, triage, student-portal, corpus]
related:
  - "[[docs/cpl_assistant_lessons]]"
  - "[[docs/kb-notes/methodology-a-test-that-writes-to-the-queue-it-monitors]]"
  - "[[docs/kb-notes/methodology-a-guardrail-that-only-forbids-disables-the-feature]]"
  - "[[docs/kb-notes/methodology-the-feedback-queue-already-knew]]"
---

# You are Session 127

Previous session was **SkyMiner (126)**. The assistant is **Sierra**; the workstream is the "CPL AI Sherpa."
Sam names monikers — if he doesn't, **SkyDrain** is the suggestion (the corpus and the last feedback rows are
what's left). Coin your own if you prefer.

## Read these first, in order

1. `docs/cpl_assistant_lessons.md` — the §SkyMiner section.
2. `docs/kb-notes/methodology-a-test-that-writes-to-the-queue-it-monitors.md` — the new one.
3. `docs/kb-notes/methodology-a-guardrail-that-only-forbids-disables-the-feature.md` — **read the new
   "Resolution" section**; the rest was written while the decision was still open.

## What SkyMiner shipped (#1029 merged · deploy 11 green · LIVE)

Sam answered **both** of SkyHero's queued decisions, and both are deployed:

- **(a) Restraint binds salesmanship, not facts.** `PORTAL_RULE` now carries the tie-break: never withhold a
  fact that materially changes the visitor's outcome; never editorialise. If the host hasn't articulated it —
  say so, say where it *is* available today, say the host can adopt it. Visitor's outcome wins, *stated
  plainly, never sold*. Same refusal-of-the-dead-end added to the student audience rule.
- **(b) Mode 7 = all three parts, in order:** host → precedent → **nearest real route** (colleges that *teach*
  it, even with no exhibit). `OFFERINGS_RULE` calls stopping early *a failure of the answer, not politeness*.
  The smoke assertion now requires all three, so it encodes the **decision**, not the code.
  ⚠️ **Shipped, but part 3 does not yet fire on the live function — see the next section. This is the open item.**
- **(c) The CI rows are out of the feedback queue** — hidden by default, disclosed with a count next to a
  toggle, and **the stats follow the same rule as the list**. `FEEDBACK_LIMIT` 200 → 500.
- Tests: `sierra_student_portal` 44 → **59**, `sierra_training` 31 → **44**. Sierra suite green (382).

## ⚠️ Mode 7 is STILL RED — and your first job is a MEASUREMENT, not a prompt edit

Live smoke **run 47**, post-deploy, **3 of 4 green**: `home college detected` ✅ · **`adoption precedent`
(the new one — Norco named) ✅** · `on-topic` ✅ · **`nearby construction college` ❌.** Sierra's table
("Your Nearest Options with CPL Already in Place") lists Norco · Santiago Canyon · Chaffey · San Bernardino
Valley — every one an *exhibit* college. Part 3 did not fire.

⭐ **The same run refutes the premise SkyHero's handoff and mine both carried.** "No LA-county college has a
construction exhibit" is true, and it was quietly doing work it can't do — implying part 3 was unreachable.
**Mode 8, the next question in the same run against the same function, names Rio Hondo (70 carpentry courses),
LA Trade Technical (32 + 26 construction crafts), Long Beach City and College of the Canyons — all LA County.**
The teaching colleges are in the catalog data. Part 3 is reachable.

Sierra echoed `buildOfferingsContext`'s no-match branch nearly verbatim (*"does not appear in the current course
catalog"*), so the offerings context was present and read. **What is NOT established** — and what you must
measure before editing anything — is whether that context's `others` list was populated for this query. It ranks
core matches by county first, so Rio Hondo and Trade Tech would have been at the very top if present. Two
candidates:

1. **Retrieval.** `searchCollegeOfferings` is driven by raw query text; mode 7's carries *"Los Angeles Harbor
   College"*, mode 8's is cleanly topical. If that skews the catalog search, `others` is thin and **no prompt
   wording will fix it.**
2. **Instruction-following.** The context had them and the model still framed its table as "options with CPL
   already in place." The ANSWER SHAPE block is one bullet among six in `OFFERINGS_RULE`.

**Do not guess.** `tests/sierra_geo_ranking.test.js` exists precisely to assert the ordered college set the
context builders emit — extend it to this query and find out which. Inferring (2) and rewriting prompt text is
the exact mistake this workstream keeps re-learning.

## ⭐ The thing to internalise: the queue is the roadmap

`sierra_feedback` had **53 rows, all `status='new'`, 28 of them written by our own smoke test** (up from 19 the
day before — it grows ~1/run and **can never be deleted**, because mode 12 writes as anon and anon is
write-only there by design). The headline "👎 total" read **38 when the real number was 10**.

And it had **already reported three of the last four sessions' work**: the CPR misses (07-01 ×2, 08-06 → #1016),
"Moreno Valley is closer to Crafton than Bako" (07-03 → #1023), and — the sharp one — on **2026-07-17**,
*"'Find a College That Fits You' should not push students to map.rccd.edu… should push them to the student
portal."* That is the student-routing problem, described by a user **three weeks before** Sam raised it and four
passes of prompt rewriting followed.

**Read the queue at the START of your session.** It has been running three weeks ahead of us.

## 🎯 Priority 2 — the 6 remaining feedback rows

4 are marked `addressed` (the 3 CPR + the geo one — fixes shipped and verified). What's left:

| Row | Disposition |
|---|---|
| **07-23 "How many colleges have a CPL Counselor or Coordinator listed?"** | ⭐ **Best value.** A *build*, not a bug — Sierra names contacts one at a time but can't aggregate. The data exists from SkyMail (#991–#993, #1001, `map_college_contacts`). |
| 07-06 MJC: Sierra said 75 ECE credit recs, landing page shows 4 | Investigate — count-source mismatch, possibly a real data question worth answering properly. |
| 07-06 Fullerton catalogue read in one answer, not the next | Plausibly the **non-determinism #1023 fixed** (`.limit(3)` with no `ORDER BY`). Re-run the pair; if stable, mark addressed. |
| 07-02 ×2 student counts per certificate | Known data gap Sam owns — ties to **Malone's view** → `fetch_custom_report.py` → `_build_cr_backlog.py`. |
| 07-02 College of the Canyons articulations (employer, no note) | Re-run and judge. |

⚠️ **Sam wants to invite the MAP and CO teams to test Sierra — that should not happen until this queue has an
owner.** The Governance tab (OQ-01) is the place to name one.

## 🎯 Priority 3 — the poaching audit (carryover, never reported)

SkyHero's five-surface audit (prompt constants · audience rules · context builders · live `sierra_guidance`
rows · sibling report generators) was still running at its checkpoint and **was never reported**. Re-run it
now that the "never hide facts" line is live — you are looking for any *other* place that still tells Sierra
to stay quiet.

## 🎯 Priority 4 — the corpus (unchanged, still the biggest limit)

`chatbox_exhibits` = **2,397 exhibits across 59 colleges**; MAP has **123**.
`chatbox_college_profiles` last refreshed **2026-06-25**. ⚠️ Shared table feeding production Sierra — walk Sam
through blast radius first.

## Carryover

- **`creditforbeingyou.org/main/student` is still unverified** — sandbox is egress-blocked from that domain, and
  it is now in front of every student who asks. One-line fix (`PORTAL_STUDENT_URL`) if wrong.
- Sierra Phase 1 guardrails still unbuilt (rate limit, cost breaker, CORS, usage digest) —
  `docs/sierra_vendor_lane_handoff.md`.
- Suppression threshold: Sam wants **<10**; the backlog builder uses 5.

## Patterns that worked

- **Measure the thing you are about to ask about.** Pulling the queue before putting the two questions to Sam
  is what turned "drain 10 rows" into the session's main finding. The questions were better for it too.
- **Ask when the handoff says ask.** Both answers changed the code, and (b) produced an option I had not
  offered as primary — *both, in order*. Neither was inferable.
- **A tie-break must be repeated where the conflict bites.** Stating it in `PORTAL_RULE` was not enough;
  `OFFERINGS_RULE` had to cross-reference it or the later rule silently won.
- **Test the permission, not just the prohibition.** A violated prohibition is loud; a violated permission is
  silent. Only one of them rots unnoticed.

## Safety patterns to honour

- **Deploys** go through `.github/workflows/cpl-chat-deploy.yml` with `confirm: DEPLOY`. `--no-verify-jwt` is
  pinned there — do not remove it. Never hand-transcribe the function.
- **Prompt text only takes effect on deploy.** Merging is not shipping.
- The sandbox **cannot reach `*.supabase.co`** (Supabase via MCP only), nor `creditforbeingyou.org`.
- ⚠️ **`actions_list` returns enormous payloads** (full repository objects per run) — it burned real context this
  session. Prefer `actions_get {method:"get_workflow_run", resource_id}` for status, and
  `actions_list {method:"list_workflow_jobs", resource_id}` for per-step state. Job logs 404 until the job
  finishes. Poll via the MCP github tools, **never curl**.
- Adding a parameter to a Postgres function creates an **OVERLOAD** — drop the superseded signature or
  PostgREST fails `42725`.
- These prompt rules are **template literals evaluated at module load**: a const referenced before its
  declaration is a TDZ `ReferenceError` that kills the function at boot.
- Never widen `sierra_guidance` / feedback / contacts gates toward anon.

## Rollback

`git show 758f26b:chatbox/supabase/functions/cpl-chat/index.ts` → commit → dispatch the deploy workflow.
(That is the pre-#1029 state — #1027's version.) Rollback is an ordinary revert, not a hand-transcription.
