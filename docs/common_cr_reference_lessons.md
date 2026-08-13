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

## 2026-08-13 — SkyCall (Session 152), the build

SkyRunner scoped it; this run built it. **PR #1176** — `kb/_build_cr_reference.py`,
`kb/cr_reference_worklist.json`, `cr_reference.js`, `tests/cr_reference.test.js`
(42 checks), gated Supabase `cr_reference_decisions`.

### Sam's two rulings this run

1. **Scope is GLOBAL, with a split affordance.** One vocabulary across all
   credentials, credential as context, curator can split a wording out.
2. **The naming cascade — CCN > C-ID > M-ID > published line > modal wording.**
   Verbatim: *"as is the procedure with CCR, when there is a C-ID or CCN title
   and number, we go with that for the Common CR Reference (CCRR). Once we get
   M-IDs in good shape, those will rule as well — third in the cascade."*
   An official identity **names** the reference; it does not merely corroborate
   it. M-ID is wired but `MID_RULES = False` — Rule 7 keeps that layer in
   staging where re-mints are permitted, so an M-ID canonical could be re-keyed
   out from under a published name.

### The ranking premise in handoff 152 was backwards

It said *"the top strings span up to 61 credentials, and that is where the value
is."* The 61-credential string is `3 hours in Elective Course Credits` — 61
credentials, 61 rows, **one college**. A placeholder, not a topic. Ranking by
credentials-spanned puts the corpus's least useful string at #1.

**Collapse value — (wordings − 1) × colleges touched** — sinks it to #174 with
no special case, and surfaces the real head: `Intro to Administration of
Justice` (5 wordings / 26 colleges), Principles & Procedures (5 / 16), Criminal
Investigation (3 / 24). ⭐ **A ranking rule that needs a special case to avoid an
absurd result is usually the wrong rule.** The fix was not an exclusion list.

### Three bugs, one shape: two places normalising the same text differently

1. **`screen_profile()` judged the RAW topic while the group key used the
   ABBREVIATION-FOLDED one.** `Intro to Administration of Justice` read as
   level-absent, `Introduction to…` as level-present; they disagreed, the level
   safety screen fired, and it **blocked the single highest-value merge in the
   corpus**. The abbreviation fold was silently undone by the screen that ran
   before it.
2. **The first test re-implemented the folds**, missed `adv`→`advanced`, and
   failed two *correct* groups (`Adv Acoustical Ceiling Layout` / `Advanced
   Acoustical Ceiling Layout`). Fixed by **emitting** the screen profile from
   the builder — delete the duplicate derivation, don't sync it.
3. **The first acceptance probe tested a proxy**, not the condition: it asked
   whether a group's KEY contained both "introduction" and "advanced", and
   reported 2 failures that were single-wording groups whose one string
   legitimately carries both words (*"Advanced Composition & Introduction to
   Literature"*). Nothing was being merged. This is SkyRunner's cartesian-gate
   lesson recurring inside the very run that documented it.

### The cascade caught a live data-corruption case

Applying the official title wherever a C-ID resolves would have renamed
**`3 hours in Physical Training and Health Education` → `AJ 110 — Introduction
to Criminal Justice`**. `AJ 110` reaches that group only through the
denormalised (credential, course) pairing — the POST cross-join the scope doc
names. That is not a mislabel; it **asserts that Physical Training is
Introduction to Criminal Justice**.

⭐ **So a divergent official title is OFFERED, never APPLIED.** 38 groups have an
official title sharing no content word with any college wording; all 38 keep
their freehand canonical and carry the identity as a proposal badged
`AJ 110? — check`. Sam's standing rule on the `AJ 110` repeat — *flagged, never
auto-resolved* — turned out to be the same rule. **295 groups do get an official
name applied**, far more than the 36 the scope doc counted (that counted only
C-IDs declared on published lines).

### What the MAP dataset says about "assign a CCRR to each CR"

Sam: *"What we need to then focus on is assigning a CCRR to each CR in the MAP
dataset. The military ones may be the stickiest."* Measured on
`map_college_cr_unit` (204,683 rows):

| Lane | Rows | Distinct CR strings |
|---|---:|---:|
| `source_code = 'ACE'` | 200,840 (98.1%) | **10,117 (88.5%)** |
| `source_code = 'MAP'` | 3,254 | 1,231 |
| blank | 589 | 171 |

**11,426 distinct strings in MAP — roughly 5× the 2,344 the articulated corpus
carries.** Sam's instinct is right and now quantified, and the *reason* is
structural rather than a matter of volume:

⭐ **ACE recommendations are SUBJECT AREAS, not courses.** `3 hours in
Supervision` (2,986 rows) · `Computer Applications` · `Communications` ·
`Industrial Safety` · `Leadership` · `1 hour in First Aid`. **There is no C-ID
for "Supervision".** So the entire cascade — CCN, C-ID, and M-ID when it comes —
has nothing to bite on, and the military lane falls through to rung 5, curator
judgement, almost in full. The local MAP lane by contrast is course-shaped
(`Criminal Investigation`, `Academic Reading and Writing`, `Introduction to
Corrections`) and is exactly what the worklist already resolves.

⚠️ **`source_code` IS a usable military-lane discriminator at the CR grain.**
This does not contradict the standing note that "no military flag exists" —
that one is about `map_student_credit.military_credits`, an *applied amount*
that is zero on 84% of rows. Different column, different grain.

⭐ **Two of the top ACE strings are not recommendations at all:** `0 hours in
Credit Is Not Recommended` (3,242 rows) and `0 hours in Credit may be granted on
the basis of an individualized assessment of the student` (2,269). Both are the
**not-a-topic** class the tab already has a button for, and the first is the
same population §11 already calls "a free auto-N/A win".

### Next concrete step

Sam works the head — the top ~50 groups — and we watch **which rungs he
overrides**. That is the cheapest available signal on whether the rung order is
right, and it costs him minutes rather than a review cycle. Then: extend the
corpus from the articulated 2,344 to MAP's 11,426, where the shape of the work
is different enough that it deserves its own scoping pass rather than an
assumption that the same instrument fits.
