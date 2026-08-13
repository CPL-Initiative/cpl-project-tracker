---
title: Common CR Reference — lessons
date: 2026-08-13
tags: [cr-reference, ccr, curation, identity, lessons]
artifacts:
  - docs/common_cr_reference_scope.md
  - cpl_memory:cr-reference-is-a-curation-workbench-not-a-merge-engine
related:
  - "[[docs/ccr_rules_brief]]"
  - "[[docs/local_course_alignment_lessons]]"
---

# Common CR Reference — lessons

## 2026-08-13 — SkyRunner (Session 151), first checkpoint

Sam proposed the Common CR Reference the day before and asked for it to be
built. The handoff said: **scope it before you write code.** That instruction
is the reason this run produced a correct answer instead of a shipped mistake.

### What happened, in order — the whole lesson is the sequence

1. Measured the vocabulary. `credit_rec` fits `<units-expr> <unit-word> in
   <topic>` at 99.1%, 100% with range parsing. Aggressive normalisation —
   units discarded entirely — collapses **6.9%**. Confirmed Sam's framing:
   curation, not string-cleaning.
2. Noticed a factor nobody had named. Every peer articulation already carries
   `course_id` — **the CCR has already decided which courses are the same
   course**, and a credit recommendation names a course-shaped thing. `HIST 130`
   folds *"The United States to 1877"* with *"United States History,
   1550-1877"*; no string metric reaches that. It looked decisive.
3. Found the counter-example in the same query. `AJ 110` also absorbs
   *"Physical Training and Health Education"*. So: strong signal, needs a gate.
4. **Guessed the gate wrong.** Proposed a cartesian test — exclude a
   (credential, course) pair when the course pairs with *all* of the
   credential's rec lines. Measured it: only 43 such pairs. Wrote it into the
   scope doc as the design, and asked Sam to approve the rung.
5. **Then tested the gate against the case it was invented for, and it
   failed.** `AJ 110` pairs with 8 of POST's **43** lines → reads
   *non*-cartesian → sails through → Physical Training still merges into Intro
   to Administration of Justice. The cross-join is a block *inside* a large
   credential, not a pairing with all of it.
6. Looked for the real signature: the **college set**. All 8 POST/`AJ 110`
   lines carry the identical 18-college set. Measured table-wide: of the
   (credential, course) pairs touching >1 rec line, **zero** have differing
   college sets; 223 pairs / 579 lines share one. The pairing carries **no**
   per-line information anywhere.
7. Nearly concluded rung 3 was dead — then checked whether the *good* merges
   live across credentials rather than within one. `HIST 130`'s six wordings all
   sit under **`AP United States History`**: denormalised, but every wording
   belongs to one credential and one course, so they genuinely are six
   phrasings of one recommendation. `POST` differs only because it spans 43
   lines and many courses.
8. Correct gate: **the credential's course count.** 1,211 credentials resolve
   to exactly one course; 30 of those carry multiple wordings; the rung
   collapses **40 strings of 2,344 — 1.7%**.

### The reusable lessons

⭐ **Test a gate against the case that motivated it, before you design around
it.** The cartesian gate was measured (43 pairs — a real number), documented,
and wrong. Measuring a gate's *population* is not testing it; only running it
against the known-bad case does that. One query separated "43 pairs, problem
solved" from "the gate does not fire on the example I invented it for."

⭐ **A label that names the disease is not a test for it.** `attribution`
already carries `per_course` / `group_wide`, and the builder's own header
documents the denormalisation risk in detail. Every poisoned `AJ 110` row is
labelled `per_course`. The column is more optimistic than the data; a consumer
trusting it passes the exact case it appears to catch.

⭐ **The strongest-looking factor can be the smallest rung.** Course identity
produced the most compelling examples in the whole investigation and resolves
1.7% of the problem. Compellingness of examples is not yield — it took a
counting query to tell them apart, and the examples were doing the persuading
right up until then.

⭐ **A near-1:1 mapping collapses nothing.** 93% of rec strings reach exactly
one course and 86% of courses serve exactly one rec. That is a *relabelling*,
not a canonicalisation. Whenever a proposed key is nearly bijective with what
it is keying, check the yield before believing in it.

⭐ **Ask whether the evidence lives at the grain you are testing.** The
college-set gate said "zero real evidence" and that was true *within* a
credential — while the good merges lived *across* credentials, where the gate
had nothing to say. Had I stopped at step 6 I would have killed a sound rung on
a correct measurement of the wrong grain.

### Where this leaves the build

**The deliverable is a curation workbench with a small automated spine, not a
merge engine.** Automation reaches ~10% (rung 1: 351 published statewide lines;
rung 2: 36 C-ID-declared; rung 3: 40; rung 4: ~160 mechanical). ~90% is curator
judgement and no achievable matcher changes that — *Racial Issues and the
Police* and *Community Relations* are one POST topic in unrelated words.

That should drive build order: **worklist, grouping affordance, curator
attribution and receipt first; matcher last.** Building the matcher first spends
the run on the tenth that is easy.

### Next concrete step

Build the tab as a **worklist**, not a report: the ~2,180 topics ranked by how
much they would collapse (wordings × colleges affected), each row offering
group / split / confirm with curator attribution, plus the four automated rungs
pre-applied and labelled by rung. Model the affordances on the CCR merge
workspace (`docs/ccr_merge_workspace_epic_scope.md`), which already solved the
curator-confirm pattern for course identity.

**Open with Sam** (from the scope doc §7): whether the reference is global or
per-credential — 83% of strings appear under exactly one credential, so
per-credential is nearly free, but the top strings span up to 61 credentials
and that is where the value is.
