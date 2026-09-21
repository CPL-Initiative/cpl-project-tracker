---
title: "Common CR Reference — lane state"
created: 2026-08-28
updated: 2026-09-21
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

✅ **WORKLIST LIVE** (scoped SkyRunner #1174; built SkyCall #1176). ⭐ **SAM'S DESIGN RULING:** *"CID is only one factor… similar to the CCR, we take into account matching factors like title, course name and number, course description, subject, etc."* — illustrative, not exhaustive. C-ID-as-key fails BOTH ways: it over-merges (`AJ 110` on two genuinely different POST lines) and under-merges badly (only ~17% of the 2,344 strings carry a C-ID at all). ⭐ **AUTOMATION REACHES ~10%, SO THIS IS A CURATION WORKBENCH, NOT A MERGE ENGINE** — rung 1 published statewide 351 lines/134 credentials · rung 2 C-ID 36 of those · rung 3 CCR course identity 40 strings · rung 4 mechanical twin ~160 · rung 5 similarity **suggests, never merges**. **~90% is curator judgment no matcher reaches** (*Racial Issues and the Police* ≡ *Community Relations* — one POST topic, unrelated words), which is what the **+ Add a wording** picker is for. ⭐ **SCOPE IS GLOBAL + a split affordance (Sam, 2026-08-13):** 407 strings (17%) span >1 credential but carry **45% of all articulation rows**, and `Introduction to FCAW` is one recommendation under all ten AWS/ASME credentials carrying it. ⚠️ **RANK BY COLLAPSE VALUE (wordings × colleges), NEVER BY CREDENTIALS SPANNED** — the widest-spreading string is `3 hours in Elective Course Credits`: 61 credentials, **1 college**, a placeholder. Credentials-spanned would have ranked the corpus's least useful string #1; collapse value sinks it to #174 with no special case. Real head: `Intro to Administration of Justice` (5 wordings/26 colleges), then Principles & Procedures, then Criminal Investigation. **30 groups carry a curator decision as of 2026-09-20 (the older "156" counted the mechanical rung ladder); top 50 strings = 49.4% of all articulations — an afternoon, not an ocean.** ⚠️ **Units are NOT identity** (`SPAN 100` at 4/4.5/5) — a screen on rung 4 ONLY; rung 1/2/3 override it, so `Engine Performance` correctly merges 2/3-4/4/5 units and the spread is **always displayed**. ⚠️ **Grouping is by KEY, NEVER transitive** — 164 strings bridge ≥2 course identities, so components would chain `AJ 110`↔*Community Relations*↔`AJ 160`. ⚠️ **Two gates DON'T work: `attribution='per_course'`** (every poisoned `AJ 110` row carries it) **and a line-fraction/cartesian test** (`AJ 110` hits 8 of POST's 43 → reads non-cartesian → sails through). The gate that works is the credential's **COURSE count**. ⚠️ **A normalization and the screens that judge it MUST see the same text** — `screen_profile()` ran on the raw topic while the key ran on the folded one, so `Intro`/`Introduction` read as different levels and the level screen **blocked the top of the queue**; then the test re-implemented the folds, missed `adv`, and failed two correct groups. Fixed by EMITTING the profile, not re-deriving it. Decisions live in gated Supabase `cr_reference_decisions` keyed on `group_key`, so a rebuild can never overwrite a judgment. **NEXT: Sam works the head — the top ~50 groups — and we watch which rungs he overrides.** Story: [`docs/common_cr_reference_lessons.md`](docs/common_cr_reference_lessons.md) · scope [`docs/common_cr_reference_scope.md`](docs/common_cr_reference_scope.md).

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

**THE VERDICTS LANDED (2026-09-20, S280).** Sam answered all 51 on the
[sheet](https://claude.ai/artifact/KydcskYBqc93WAurcMEatq): 33 fold, 18 keep,
no notes; then, shown the eight anchors that carried both a fold and a keep,
he flipped 26, 27, 28, 29, 32, 35, 37, 38 to fold: **41 fold, 10 keep**.
Written to `cr_reference_decisions` as **30 rows** (20 anchor groups carrying
the folded wordings as members, 10 kept groups confirmed as their own
recommendation), INSERT-only under `updated_by = cr-reference-s280@bot`,
verified member-by-member against the receipt:
`kb/receipts/cr_reference_decisions_2026-09-20_s280.json` (+ `.sql` beside it;
rollback is one delete on that `updated_by`). These are the lane's first
curator decisions.

**Calibration against Sam:** at p ≥ 0.85 Jev was right 25 of 25. Below the gate
the number carried no signal: he kept the four 0.84 pairs at first and folded
the three lowest (0.32, 0.44, 0.48); after the review 16 of 26 folded. The gate
earns its place; the ordering under it does not. Keeps after review: items
30, 31, 33, 34, 36, 39, 40, 41, 44, 47.

⚠️ **The sheet's Yes was ambiguous.** Its how-to defined Yes as
"take the proposal", and the review band proposed hold-separate, so a Yes there
meant keep by the sheet and fold to Sam. His messages and his flips list fix
the reading as fold. Sam's rulings for every next sheet (2026-09-20): the
recommendation line is the visual focal point, chips name the outcome (never a
bare Yes), the fold is proposed by default with its reason and faculty pull
out, and the framing sits in the header.
[`decision_sheets`](../decision_sheets.md).

## The magic half is one module now (2026-09-21, S281 SkyAnvil)

`kb/_jev_adjudicate.py` is the single Jev adjudication routine for every
reference — CSR, CER and CCRR wired, CCR deliberately not. The method+magic
pattern is [`playbook-trail-crew-method-magic-audit`](../../kb-notes/playbook-trail-crew-method-magic-audit.md),
which ran it twice on 2026-07-10; every reference already owns a METHOD half and
what differs is the magic one. CCRR's blocking is **imported** from
`_typesafe_cr_trial.build_pairs()`, never reimplemented.

⚠️ **THE SECOND LOOK NEVER SEES THE VERDICT IT CHECKS.** The playbook requires a
skeptic on every merge; its working version re-derived the numbers rather than
re-reading the claim. Jev cannot read a registry, so re-derivation here is the
NEGATIVE question put to the same evidence in a separate call with the first
answer withheld — "critique this proposal" is the shape that rubber-stamps. A
refuted proposal routes to the curator however confident the first look was, and
a 0.5 hedge is not a refutation. Run it from
`.github/workflows/typesafe-smoke.yml` (typesafe.ai is egress-blocked from the
sandbox); it SUGGESTS and writes nothing.

**Triage, measured 2026-09-21:** CER 239 findings → 59 worth a call · CSR 185 →
143 · CCRR 55 anchored pairs. **The receipt's 51 pairs are all still present**
(reconciled, none lost); the 4 new ones sit under the `community relations`
anchor, this lane's named hard case.

⚠️ **SCORE AGAINST `by: "sam"` ROWS ONLY.** The decision sheet went opt-out on
2026-09-21, so an untouched item carries the recommendation marked
`by: "default"`. Scoring a matcher against those measures it against its own
proposals. The 2026-09-20 receipt predates opt-out and is entirely his, which is
why it is the ground truth.

## SCORED against Sam's 51 verdicts (2026-09-21, S281) — `kb/_jev_score.py`

No runner was needed: the receipt carries Jev's `p_same` and `care` beside his
verdict on the same row, so the scoring is arithmetic over a committed file and
anyone can reproduce it.

**The inherited claim reproduces exactly.** p ≥ 0.85 folded **25/25**; below it,
**16/26**.

**The gate is empirically right, not merely asserted.** Sweeping it, 0.85 is the
highest-recall threshold that suggests no wrong fold at all (precision 1.00,
recall 0.61). Precision degrades the moment it drops — 0.94 at 0.80, 0.87 at
0.70. Acting on the gate would have folded 25 pairs and 346 articulation rows
with nothing wrong in it.

⚠️ **NOTHING JEV IS ASKED TODAY ORDERS THE BAND BELOW THE GATE.** That band is
26 pairs and 838 rows — the part that actually needs a curator. Measured within
it: **AUC(p_same) = 0.441, AUC(care) = 0.450**, against 0.50 for chance
(permutation p = 0.67 on care). The three LOWEST-scored pairs in the whole set
— 0.32, 0.44, 0.48 — were all folds.

⚠️ **A WHOLE-SET COMPARISON OF `care` FLATTERS AND MUST NOT BE USED.** All ten
keeps sit below the gate and the above-gate folds are easy ones with low care,
so comparing every fold against every keep reports a +0.41 separation that is
really "above-gate items are easy". The band is the only honest place to
measure. This reading was made and corrected the same hour.

**SO THE VARIABLE BATTERY IS JUSTIFIED, AND FOR A SPECIFIC REASON:** the two
questions Jev is asked are exhausted, and more of the same will not order what
they cannot. The battery has to ask DIFFERENT questions — level, scope, units,
lab against lecture, vendor-specific, a different course — which is what
`s279-fable-jev-variable-battery` proposed and what this measurement now
supports rather than assumes.

**NEXT:** build the battery against the band's 26 pairs, score it the same way
with `kb/_jev_score.py`, and keep any variable that beats 0.50 in-band. Only
then CCR, whose method half emits Trust Cards rather than findings. The other
1,881 rung-5 groups wait on that.

**Where Jev fits beyond this lane, and the gates each use carries:**
[`reference-system-one-model-fit-by-lane`](../../kb-notes/reference-system-one-model-fit-by-lane.md) (S280, 2026-09-20).
