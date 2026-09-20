---
title: "Common CR Reference — lane state"
created: 2026-08-28
updated: 2026-08-28
tags: [reference, roadmap-lane]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference/lanes
related:
  - "[[CLAUDE]]"
---

# Common CR Reference

> **Relocated verbatim from `CLAUDE.md` §11 on 2026-08-28** (Session 206, the
> consolidation). This is **always-current lane state, not an archive** —
> update it at every checkpoint that moves this lane, exactly as you used to
> update the §11 cell. `CLAUDE.md` keeps the one-line pointer; the detail is
> here.

**What this lane is:** A canonical vocabulary of credit recommendations — what the CER did for freehand credential titles, for the freehand recommendation text.

## Status

✅ **WORKLIST LIVE** (scoped SkyRunner #1174; built SkyCall #1176). ⭐ **SAM'S DESIGN RULING:** *"CID is only one factor… similar to the CCR, we take into account matching factors like title, course name and number, course description, subject, etc."* — illustrative, not exhaustive. C-ID-as-key fails BOTH ways: it over-merges (`AJ 110` on two genuinely different POST lines) and under-merges badly (only ~17% of the 2,344 strings carry a C-ID at all). ⭐ **AUTOMATION REACHES ~10%, SO THIS IS A CURATION WORKBENCH, NOT A MERGE ENGINE** — rung 1 published statewide 351 lines/134 credentials · rung 2 C-ID 36 of those · rung 3 CCR course identity 40 strings · rung 4 mechanical twin ~160 · rung 5 similarity **suggests, never merges**. **~90% is curator judgment no matcher reaches** (*Racial Issues and the Police* ≡ *Community Relations* — one POST topic, unrelated words), which is what the **+ Add a wording** picker is for. ⭐ **SCOPE IS GLOBAL + a split affordance (Sam, 2026-08-13):** 407 strings (17%) span >1 credential but carry **45% of all articulation rows**, and `Introduction to FCAW` is one recommendation under all ten AWS/ASME credentials carrying it. ⚠️ **RANK BY COLLAPSE VALUE (wordings × colleges), NEVER BY CREDENTIALS SPANNED** — the widest-spreading string is `3 hours in Elective Course Credits`: 61 credentials, **1 college**, a placeholder. Credentials-spanned would have ranked the corpus's least useful string #1; collapse value sinks it to #174 with no special case. Real head: `Intro to Administration of Justice` (5 wordings/26 colleges), then Principles & Procedures, then Criminal Investigation. **156 of 2,159 groups carry a decision; top 50 strings = 49.4% of all articulations — an afternoon, not an ocean.** ⚠️ **Units are NOT identity** (`SPAN 100` at 4/4.5/5) — a screen on rung 4 ONLY; rung 1/2/3 override it, so `Engine Performance` correctly merges 2/3-4/4/5 units and the spread is **always displayed**. ⚠️ **Grouping is by KEY, NEVER transitive** — 164 strings bridge ≥2 course identities, so components would chain `AJ 110`↔*Community Relations*↔`AJ 160`. ⚠️ **Two gates DON'T work: `attribution='per_course'`** (every poisoned `AJ 110` row carries it) **and a line-fraction/cartesian test** (`AJ 110` hits 8 of POST's 43 → reads non-cartesian → sails through). The gate that works is the credential's **COURSE count**. ⚠️ **A normalization and the screens that judge it MUST see the same text** — `screen_profile()` ran on the raw topic while the key ran on the folded one, so `Intro`/`Introduction` read as different levels and the level screen **blocked the top of the queue**; then the test re-implemented the folds, missed `adv`, and failed two correct groups. Fixed by EMITTING the profile, not re-deriving it. Decisions live in gated Supabase `cr_reference_decisions` keyed on `group_key`, so a rebuild can never overwrite a judgment. **NEXT: Sam works the head — the top ~50 groups — and we watch which rungs he overrides.** Story: [`docs/common_cr_reference_lessons.md`](docs/common_cr_reference_lessons.md) · scope [`docs/common_cr_reference_scope.md`](docs/common_cr_reference_scope.md).

## Jev on this lane (2026-09-20, S279 SkyKeeper)

⚠️ **`cr_reference_decisions` HOLDS ZERO ROWS.** Read as `postgres`, so RLS is
not hiding them, and `reltuples = -1` means it never held data. The lane's
*"156 of 2,159 groups carry a decision"* counts the MECHANICAL rung ladder
(rung 1: 108 · rung 2: 28 · rung 3: 46 · rung 4: 41), NOT curator judgments.
**There is no human gold set on this lane.** Any plan that proposes scoring a
matcher against "the existing curator decisions" is scoring against nothing.

⚠️ **NONE of the 1,936 rung-5 groups holds more than one wording.** So the ~90%
that "no matcher reaches" is not an in-group merge at all — **the judgment is
ACROSS groups**. That reframes the whole lane: the question is never "do these
two wordings in this group match", it is "should group A and group B be one".
Brute force across rung 5 is **1,873,080 pairs**, which is why similarity
never got traction here.

**The way in is blocking, not a better matcher.** Grouping by SHARED CANONICAL
cuts 1.87M pairs to **51 anchored pairs carrying 1,459 articulation rows**, and
every such cluster already contains a rung-1/2/3 anchor — a published statewide
line, a C-ID or a CCR identity — so each question is a closed yes/no against an
authority rather than open-ended matching.

**Jev (TypeSafe System One) answered all 51 in 10 seconds** on a runner
(`kb/_typesafe_cr_trial.py`, run 35516193054). Buckets: **25 MERGE** (p≥0.85,
346 rows) · **26 REVIEW** · **0 keep**. It discriminates: *Introduction to
Criminal Justice* 0.89 against *Introduction to Criminology* 0.48 on the same
AJ 110 anchor, with near-identical row counts — the designated discriminator,
and it passed. Physics mechanics 0.64 ranked correctly above E&M 0.44 against
INTRO PHYSICS; *Standard First Aid* 0.92 against *Emergency Medical Response*
0.52; Spanish 1/2 at 0.84/0.86 but Spanish 3 at **0.32** against Intermediate
Spanish I.

⚠️ **NOTHING FELL BELOW 0.32.** The `keep` bucket is empty — Jev does not
express confident negatives here. The usable gate is **p≥0.85 = suggest**,
everything else = a curator looks. It suggests; rung 5's "similarity suggests,
never merges" and Rule 7's TOP posture both still hold.

**NEXT: Sam works the 51-item decision sheet** —
[artifact](https://claude.ai/artifact/KydcskYBqc93WAurcMEatq), source
`docs/visuals/2026-09-20-jev-cr-reference-pairs.html`. Replies live in the
artifact's own store; read them with `read_db` on collection `replies` BEFORE
executing, and an item with no reply document has **no** verdict. His verdicts
become the first curator decisions this lane has ever had, and the measure of
whether Jev earns a run at the other 1,881 groups.
