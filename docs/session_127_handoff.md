---
title: Session 127 handoff (SkyMiner → you) — measure mode 7 before touching it; the queue is the roadmap
created: 2026-08-07
updated: 2026-08-07
tags: [handoff, sierra, cpl-assistant, governance, feedback, detector]
related:
  - "[[docs/cpl_assistant_lessons]]"
  - "[[docs/kb-notes/methodology-judge-a-detector-by-what-it-prints]]"
  - "[[docs/kb-notes/methodology-a-failed-read-is-not-an-empty-result]]"
  - "[[docs/kb-notes/methodology-the-feedback-queue-already-knew]]"
superseded: true
superseded_by: session_132_handoff.md
---

# You are Session 127

Previous session was **SkyMiner (126)**. The assistant is **Sierra**; the workstream is the "CPL AI Sherpa."
Sam names monikers — if he doesn't, **SkyGauge** is the suggestion (your first job is a measurement). Coin your
own if you prefer.

## Read these first, in order

1. `docs/cpl_assistant_lessons.md` — §SkyMiner and §SkyMiner part 2.
2. `docs/kb-notes/methodology-judge-a-detector-by-what-it-prints.md` — new; read before building any detector,
   audit rule or worklist, which this project does constantly.
3. `docs/kb-notes/methodology-a-failed-read-is-not-an-empty-result.md` — new.

## What SkyMiner shipped (all merged; cpl-chat **v35**; main `4a9e303`)

| PR | What |
|---|---|
| #1029 | Both of SkyHero's queued decisions — *restraint binds salesmanship, not facts*; mode 7 = all three parts |
| #1030 | Rule 8 checkpoint |
| #1031 | Sierra on the governance register — DR-11, CA-06, OQ-07 |
| #1032 | The owner **Save** needing two clicks |
| #1033 | Two more owner-flow defects (failed read wiping owners; sign-in not re-reading) |
| #1034 | OQ-08 captured with the drift numbers |
| #1035 | Sierra edge cases — distance, and the true dead end (**deploy 12 = v35**) |
| #1036 | The governance drift detector, wired to the daily cron |

## 🎯 Priority 1 — mode 7 part 3: MEASURE, do not edit prompt text

Live smoke 47: **3 of 4 green.** `home college detected` ✅ · `adoption precedent` ✅ · `on-topic` ✅ ·
**`nearby construction college` ❌** — Sierra's table is all *exhibit* colleges (Norco · Santiago Canyon ·
Chaffey · SBVC). Part 3 did not fire.

⭐ **Mode 8, the next question in the same run against the same function, names Rio Hondo (70 carpentry
courses), LA Trade Tech (32), Long Beach City and College of the Canyons — all LA County.** The teaching
colleges ARE in the catalog data. Part 3 is reachable.

Two candidate causes needing **opposite** fixes, and it is NOT established which:

1. **Retrieval.** `searchCollegeOfferings` runs on the raw query text; mode 7's carries *"Los Angeles Harbor
   College"*, mode 8's is cleanly topical. If that thins `buildOfferingsContext`'s `others` list, **no prompt
   wording fixes it.**
2. **Instruction-following.** The context had them and the model still framed its table as "options with CPL
   already in place." The ANSWER SHAPE block is one bullet among eight in `OFFERINGS_RULE`.

**Extend `tests/sierra_geo_ranking.test.js` to assert the ordered college set for this exact query first.**
Guessing between these is the mistake this workstream keeps re-learning.

## 🎯 Priority 2 — the feedback queue (6 real rows) and its owner

The queue is now readable: CI rows filtered from the list **and** the counts, `21 of 25 untriaged` shown live on
the Governance tab (CA-06). 4 marked addressed. What remains:

- ⭐ **"How many colleges have a CPL Counselor or Coordinator listed?"** (07-23) — a *build*, not a bug. The data
  exists from SkyMail (`map_college_contacts`). Best value in the queue.
- MJC showing 75 ECE credit recs vs 4 on its landing page (07-06) — count-source mismatch.
- Fullerton catalog read in one answer, not the next (07-06) — plausibly the non-determinism #1023 fixed;
  re-run the pair and close it if stable.
- College of the Canyons articulations (07-02, employer, no note) — re-run and judge.
- Student counts per certificate ×2 — known gap, ties to **Malone's view** → `fetch_custom_report.py`.
- "I don't have a college yet" (07-17) — the student-portal work probably fixed it; **nobody has confirmed.**

⚠️ **Sam wants to invite the MAP and CO teams. That should not happen until CA-06 has a named owner** — see
OQ-07, which suggests staging it (MAP first, CO second).

## 🎯 Priority 3 — the 7 unfixed owner-dialog defects (#1033)

The likeliest to be mistaken for a regression: **`Clear owner` is a no-op on CA-01/CA-02/CA-04**, the cadences
carrying a register-file owner — `ownerOf` falls through to `row.owner`, so there is no way to say "this one has
nobody." It will look exactly like the two-click bug returning. It isn't.

Also open: cleared rows indistinguishable from never-set (and the note vanishes from view); Enter on an emptied
field deleting silently; no Escape/focus-trap/focus-restore; a team phrase not attached when a JWT exists;
`set_at` from the client clock.

## 🎯 Priority 4 — the corpus (unchanged, still the biggest limit)

`chatbox_exhibits` = **2,397 exhibits across 59 colleges**; MAP has **123**. `chatbox_college_profiles` last
refreshed **2026-06-25**. ⚠️ Shared table feeding production Sierra — walk Sam through blast radius first.

## Carryover

- **SkyHero's five-surface poaching audit was never reported.** Re-run it now the "never hide facts" line is live.
- **`creditforbeingyou.org/main/student` is still unverified** — sandbox is egress-blocked from that domain, and
  it is in front of every student who asks. One-line fix (`PORTAL_STUDENT_URL`) if wrong.
- **Promote-from-candidate** is not built. Accepting a drift candidate means editing
  `kb/governance_surface_map.json` by hand. If that friction bites, build a Supabase overlay like
  `governance_owners`.
- Sierra Phase 1 guardrails still unbuilt — `docs/sierra_vendor_lane_handoff.md`.

## Patterns that worked

- **Measure the thing before asking about it.** Pulling the feedback queue before putting questions to Sam turned
  "drain 10 rows" into the session's main finding.
- **Ask decisions as a SET.** Four at once made visible that two were consequences of a tie-break already set.
- **Run a detector before reviewing it.** Both filter bugs read fine in code; both were obvious on first print.
- **Verify a regression test by reverting the fix.** Every guard added this session was proven red-then-green.
- **A tie-break must be repeated where the conflict BITES**, not only where it is defined.

## Safety patterns to honour

- **Deploys** go through `.github/workflows/cpl-chat-deploy.yml` with `confirm: DEPLOY`; `--no-verify-jwt` is
  pinned there. Prompt text only takes effect on deploy — **merging is not shipping.** Confirm with
  `mcp__Supabase__list_edge_functions` (version + `updated_at` + `verify_jwt:false`), which is compact.
- The sandbox **cannot reach** `*.supabase.co`, `creditforbeingyou.org`, `github.io`, or Actions blob logs.
  Check an HTTP status before reading a blank curl result as data.
- ⚠️ **`actions_list` returns enormous payloads** and its `workflow_id` filter is ignored. Prefer
  `actions_get {method:"get_workflow_run", resource_id}` and
  `actions_list {method:"list_workflow_jobs", resource_id}`. Job logs 404 until the job finishes.
- **After every squash-merge, `git fetch && git reset --hard origin/main`** before starting the next change, or
  the next PR opens `dirty` against the pre-squash commit (it happened twice this session).
- **The stop hook will nag "1 unpushed commit" after every merge.** The sandbox's harness copy lacks the
  `is-ancestor` early-exit the repo copy has. Verify `git rev-list --count origin/main..HEAD` is 0 and the
  committer is `noreply@github.com`, then **ignore it** — never amend, never force-push (Rule 5).
- Never widen `sierra_guidance` / feedback / contacts gates toward anon.

## Rollback

`git show 3272bb4:chatbox/supabase/functions/cpl-chat/index.ts` is the current live text (v35).
For the pre-#1035 state use `git show 9b3dc0c:...`. Commit, then dispatch the deploy workflow.
