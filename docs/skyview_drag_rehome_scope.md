---
title: SkyView — drag any local course, queue the breakage, batch the re-mint
created: 2026-08-24
updated: 2026-08-24
tags: [scope, skyview, ccr, curation, remint, rule-7]
kb-status: internal
obsidian-folder: cpl-project-tracker
artifacts:
  - prototype/ccr_universe.json
  - prototype/ccr_atlas_graph.js
  - kb/_build_ccr_universe.py
  - kb/_row_audit.py
related:
  - "[[CLAUDE]]"
  - "[[docs/ccr_atlas_lessons]]"
  - "[[docs/coursecontrolnumber_remint]]"
---

# SkyView — drag any local course, queue the breakage, batch the re-mint

**Sam, 2026-08-24:** *"In SkyView, I want to be able to drag and drop any local course,
regardless if it has been previously merged, to another MID and have a mint procedure that
will initiate the remint for just the MID grouping … Push back welcome!"*
Then, on the counter-proposal below: ***"Great recommendations, let's roll with them."***

This is the authority for that work. It is **scoped, not built.**

---

## The shape Sam approved

| Step | What | Fires a re-mint? |
|---|---|---|
| **1** | Drag any local course — including one inside a previously-merged identity — onto another M-ID. Writes `CN:<control_number>`. | **No** |
| **2** | If the drag leaves the destination's SUBJ4 inconsistent with its corroborated discipline, **queue** a re-mint candidate. | **No** |
| **3** | Work the queue in **batches** under the Rule 7 playbook — one alias map, one cron window, articulations **and** promotions re-keyed. | Yes, deliberately |

### Why not mint on the drag

Sam invited the pushback and accepted it. Three reasons, in order of weight:

1. **Moving a member changes MEMBERSHIP, not identity.** An M-ID names an identity; re-homing
   a course does not rename it. `CN:` is documented as *"tested, reversible, **never re-mints**
   (Rule 7 not engaged)"*. A re-mint is warranted only when the **destination** becomes
   internally wrong — its SUBJ4 no longer matching its corroborated discipline — which is a
   detectable *consequence* of some drags, not a property of all of them.
2. **Alias maps do not survive being many and small.** Session 42's correction: alias maps are
   *simultaneous permutations with slot reuse* — apply each **once**, chronologically,
   era-stamped (`_rekeyed_through`), V5-validated. Per-drag minting produces dozens of tiny
   maps in arbitrary order, which is precisely the shape that broke.
3. **The failure mode is silent and has already happened.** Four re-mints skipped the
   promotions re-key and severed **53%** of the Phase A/B official-ID fold evidence with
   nobody noticing. Live re-key surface today: **2,355** identities with articulations,
   **1,986** promotions, plus `kb_curation`.

⚠️ **Sam's risk framing is accepted and is why step 1 ships unblocked**: the CCR is in
development, does not govern articulations, and only guides opportunities. The residual risk
is not public exposure — it is the silent severance of our own evidence, which is exactly what
steps 2 and 3 keep inside the checks.

---

## Step 1 — the data prerequisite nobody would guess

⚠️ **SkyView cannot drag a course today, and not because the drag is missing.**
`prototype/ccr_universe.json` holds **158 islands of identity points** — id, title, member
**count**, flags — and **no member courses at all**. There is nothing at course grain to grab.

Two things follow:

- **Members must reach the universe payload.** That is a builder change
  (`kb/_build_ccr_universe.py`), not a UI change, and it is the first task.
- **Merged-away identities must contribute their members to the survivor.**
  `flatten_merge_chains()` (#1312) already resolves a merge chain to its root, so this is a
  **display** resolution — nothing stored changes. This is what makes *"regardless if it has
  been previously merged"* work.

⚠️ **Payload size is the real constraint.** The universe already carries 16,484 identities;
member rows are **134,485**. Do **not** ship all members inline. Options, cheapest first:
① members fetched per-island on zoom/selection; ② members only for islands under a size
threshold; ③ a separate member payload keyed by identity, loaded on demand. Measure before
choosing — `ccr_universe.json` is already 1.7 MB.

### The write

`CN:<control_number>` into `kb_curation`, honored by `excel_to_dashboard.py`, already tested
and reversible. **Zero `CN:` rows exist**, so the first real drag is also the first exercise of
a verb built in Session 54 and never used — expect to find something.

Rule 10 applies: fresh live read at write time, cohort `reviewer_email`, committed receipt.

---

## Step 2 — the queue

The detector already exists in spirit: **`subject_collision_signal`** in `kb/_row_audit.py`
watches for rows whose SUBJ4 disagrees with their discipline. What is missing is the **queue**
— a durable list of "this identity's SUBJ4 stopped matching after a re-home", with who moved
what and when.

⚠️ **Queue, never auto-add.** The governance drift detector's rule applies here too: it
*proposes*, and a human dismisses with a reason. Do not bulk-clear.

⚠️ **A drag can be ambiguous in the same way a cross-discipline merge is** — moving a course
may mean the merge was wrong *or* the label was wrong, and the repairs are opposite. The queue
records the observation; it does not decide.

---

## Step 3 — the batch re-mint

Straight down [`docs/coursecontrolnumber_remint.md`](coursecontrolnumber_remint.md). Nothing
new is invented here; the point of steps 1–2 is to feed this path rather than bypass it:

dry-run → alias map committed → Supabase fresh read → **articulations re-keyed** →
**`kb/promotions.json` re-keyed** (`kb/_rekey_promotions.py`) → atomic land in one cron window
(06:17 UTC primary) → receipt under `kb/remint_out/<date>/`.

⚠️ **`kb/_rekey_promotions.py` is not optional.** It exists because four re-mints skipped it.

---

## Open questions for Sam

1. **Does a drag ever need to be reviewable before it lands**, or is instant-and-reversible
   right? Instant matches how he described it; a staged plan matches how every other write in
   this repo works.
2. **What surfaces the queue** — a SkyView pane, a row on MAP Data Quality, or a worklist tab?
3. **Batch cadence.** Per session, weekly, or when the queue passes a threshold?

## Not in scope

- The **per-college ladder view** for ESL levels (see the handoff) — related surface, different
  job, and blocked on SME input.
- Un-merging an applied identity merge, and relabeling an island's discipline. Both are still
  missing verbs; neither is needed for steps 1–3.
