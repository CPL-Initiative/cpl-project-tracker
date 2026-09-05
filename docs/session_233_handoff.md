---
title: "Session 233 handoff — build the course outline; the queue is clear"
created: 2026-09-05
updated: 2026-09-05
tags: [handoff]
obsidian-folder: cpl-project-tracker/handoffs
---

# You are Session 233

Your moniker is **SkyBuild**. Predecessors: SkyKeep S230 → SkyReply S231 →
**SkyOutline S232**.

## What S232 did — all eight queued rulings, in Sam's order

**Two PRs.** #1490 (rulings 8, 4, 5, 11) and #1491 (rulings 3, 1, 6, 2).

1. ⭐ **The alias chain is declared ONCE** — `kb/alias_chain.py` holds the one
   `ALIAS_MAPS`, resolver and era guard; five scripts import it.
   `tests/alias_chain_single_source_test.py` (16 checks, AST-parsed, all four
   failure modes perturbation-tested) fails a second declaration under that name
   **or any other**. Plus a PUSH line under Rule 7 and a `cpl_memory` row —
   Sam's four layers, weakest last.
2. ⚠️ **Ruling 4 mostly evaporated on measurement, and executing it literally
   would have done damage.** `cr_reference_worklist.json` has **0 dead** ids —
   the daily run rebuilds it, so it cannot go stale, and re-keying its 2,006
   M-IDs would have MOVED 1,197 live ones. `articulations[].course_id` was
   already current-era. Only the `identities` side map was stale: **1,369
   re-keyed, 2,290 entries all live**.
3. ⚠️ **The near-miss, and the thing to carry forward.** 175 identities are
   `identity_system: C-ID`, keyed by the C-ID code, which an M-ID catalog can
   never contain — so S229's liveness test condemned them **by construction**:
   172 live identities carrying 662 articulation records, one `--apply` away,
   with **all five gates passing**. Gates check that the post-state is
   consistent, not that the plan was sane. Dead remainder: 175 → **3**.
4. **`doctrine.py --read` + the `consult-doctrine` skill** (ruling 11) — the
   read side, because `--changed` is silent while you are still reading, which
   is where the error above was made.
5. **SkyView:** the three frictions (ruling 3), articulation counts + a
   two-switch Show group (ruling 1), the merge-candidate queue that writes
   nothing (ruling 6), and ruling 2 **routed** through Governance.

## Read these first, in order

1. [`docs/reference/lanes/skyview-ccr-interface.md`](reference/lanes/skyview-ccr-interface.md)
   — the whole picture, including the outline design.
2. [`docs/ccr_atlas_lessons.md`](ccr_atlas_lessons.md) — the two 2026-09-05
   sections at the end.
3. [`adr-remint-approval-queue-decision-rights`](kb-notes/adr-remint-approval-queue-decision-rights.md)
   and
   [`methodology-a-liveness-set-must-be-able-to-contain-what-it-judges`](kb-notes/methodology-a-liveness-set-must-be-able-to-contain-what-it-judges.md).

Then run **`python3 kb/doctrine.py --read`** before you conclude anything from
the data. It exists because of this session.

## Your priority: BUILD THE COURSE OUTLINE

It has been planned twice and built zero times, and the rulings that were in its
way are now cleared. Sam's design is settled and binding (all in the lane):

- A synthetic description may show **"as long as it is clearly labeled
  MAP-Generated for faculty consideration and revision before use."**
- **Layered from the start** — MAP exhibits and military CRs are the next layers.
- Reviewers **edit titles and re-subject**; re-mint only when verified **and**
  admin-released. Discipline change = a `kb_curation` row; SUBJ4 change queues.
- Thin skills are **included with a confidence chip**, not dropped.
- **A proficiency level on the course AND on each skill** (Beg/Int/Adv) — two
  different axes; carry both, derive neither.
- ⚠️ **Double-click is taken** (it opens the discipline work surface). Split it:
  a course opens the outline, empty island ground keeps today's behavior.
- Sam ruled item 9 **"All three"**: agency skill statements come from published
  agency standards **and** ACE exhibits **and** the MAP team. ⚠️ **He flagged it
  for follow-up — go back to him on how the three are reconciled when they
  disagree.** The pilot is an **AWS welding certification** (one certification,
  not one discipline).
- ⚠️ We hold **57 published welding credit recommendations and ZERO skill
  statements**. A recommendation names where credit *lands*, never what the
  holder can *do*. Everything else in the outline is buildable from data we
  already have.

## Carryover

| item | state |
|---|---|
| Ruling 2's queue | **routed, not built** — the ADR's four-item checklist is the spec |
| Ruling 9 follow-up | **open with Sam** — how three skill-statement sources reconcile |
| Ruling 6's merges | queued at `kb/merge_candidates/2026-09-05/`; **a faculty reviewer decides**, not a session |
| SkyView lane file | 2.68× its 12 KB budget after compaction; what is left is live design content |
| `docs/roadmap_archive.md` | 3.84× — the biggest lint offender, and pure history |

## Patterns that worked

- ⭐ **Perturbation is what distinguishes a guard from a decoration.** Every fix
  this run was reverted and confirmed RED before green — and that is how the
  wrong reading of ruling 3 was caught: the test passed just as well without it.
- ⭐ **Look at WHICH, not how many.** "175 dead" is a number; `ACCT 110`,
  `AG-AB 104` is a pattern, visible in four rows.
- ⭐ **Watch the DIRECTION a resolution moves a count.** Resolving an old-era key
  heals it; resolving a current one moves it onto a live but unrelated row. If
  dead goes UP when you resolve, the keys were already current.
- **Reproduce the inherited number before correcting it** — matching S231's 44%
  exactly is what made the correction safe to assert.
- **The build is part of the change** — `prototype/skyview.html`, the payload
  and the dependency map get rebuilt in the same commit as the edit. ⚠️ The
  dependency map pins a **line number** in `ccr_universe.js`, so any edit there
  drifts it; CI caught that twice this run.

## Safety patterns to honor

Rule 10 at any write: fresh live read, guarded statement, a receipt that makes
it reversible. A **new write surface** routes through Governance and the privacy
ADRs *before* it ships. Artifact policy: code-only PRs where the runner
publishes; `kb/coci_articulations.json` is the exception — the daily run only
`git add`s it, so an apply must be committed.

---

*Greetings, you are SkyBuild (Session 233), see SkyOutline's handoff —
`docs/session_233_handoff.md` — let's keep rolling with our queue.*
