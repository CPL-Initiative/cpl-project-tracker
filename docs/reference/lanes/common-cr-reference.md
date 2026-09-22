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

> Relocated from `CLAUDE.md` §11 on 2026-08-28 (S206). **Always-current lane
> state, never an archive** — update it at every checkpoint that moves this lane.
> When a finding contradicts it, DELETE the superseded text.

## Status

✅ **WORKLIST LIVE.** ⭐ **SAM'S DESIGN RULING:** *"CID is only one factor… similar to the CCR, we take into account matching factors like title, course name and number, course description, subject, etc."* — illustrative, not exhaustive. C-ID-as-key fails BOTH ways: it over-merges (`AJ 110` on two genuinely different POST lines) and under-merges badly (only ~17% of the 2,344 strings carry a C-ID at all). ⭐ **AUTOMATION REACHES ~10%, SO THIS IS A CURATION WORKBENCH, NOT A MERGE ENGINE** — rung 1 published statewide 351 lines/134 credentials · rung 2 C-ID 36 of those · rung 3 CCR course identity 40 strings · rung 4 mechanical twin ~160 · rung 5 similarity **suggests, never merges**. **~90% is curator judgment no matcher reaches** (*Racial Issues and the Police* ≡ *Community Relations* — one POST topic, unrelated words), which is what the **+ Add a wording** picker is for. ⭐ **SCOPE IS GLOBAL + a split affordance (Sam, 2026-08-13):** 407 strings (17%) span >1 credential but carry **45% of all articulation rows**, and `Introduction to FCAW` is one recommendation under all ten AWS/ASME credentials carrying it. ⚠️ **RANK BY COLLAPSE VALUE (wordings × colleges), NEVER BY CREDENTIALS SPANNED** — the widest-spreading string is `3 hours in Elective Course Credits`: 61 credentials, **1 college**, a placeholder. Credentials-spanned would have ranked the corpus's least useful string #1; collapse value sinks it to #174 with no special case. Real head: `Intro to Administration of Justice` (5 wordings/26 colleges), then Principles & Procedures, then Criminal Investigation. **30 groups carry a curator decision as of 2026-09-20 (the older "156" counted the mechanical rung ladder); top 50 strings = 49.4% of all articulations — an afternoon, not an ocean.** ⚠️ **Units are NOT identity** (`SPAN 100` at 4/4.5/5) — a screen on rung 4 ONLY; rung 1/2/3 override it, so `Engine Performance` correctly merges 2/3-4/4/5 units and the spread is **always displayed**. ⚠️ **Grouping is by KEY, NEVER transitive** — 164 strings bridge ≥2 course identities, so components would chain `AJ 110`↔*Community Relations*↔`AJ 160`. ⚠️ **Two gates DON'T work: `attribution='per_course'`** (every poisoned `AJ 110` row carries it) **and a line-fraction/cartesian test** (`AJ 110` hits 8 of POST's 43 → reads non-cartesian → sails through). The gate that works is the credential's **COURSE count**. Decisions live in gated Supabase `cr_reference_decisions` keyed on `group_key`, so a rebuild can never overwrite a judgment. **NEXT: Sam works the head — the top ~50 groups — and we watch which rungs he overrides.** Story + the fixed-bug postmortems: [`common_cr_reference_lessons`](docs/common_cr_reference_lessons.md) · scope [`common_cr_reference_scope`](docs/common_cr_reference_scope.md).

## Jev on this lane — the blocking, the gate, the verdicts (S279/S280, 2026-09-20)

⚠️ **THE JUDGMENT IS ACROSS GROUPS, NEVER INSIDE ONE.** None of the 1,936 rung-5
groups holds more than one wording, so the ~90% "no matcher reaches" is not an
in-group merge: the question is always *should group A and group B be one*. Brute
force there is **1,873,080 pairs**, which is why similarity never got traction.

**The way in was blocking, not a better matcher.** Grouping by SHARED CANONICAL
cuts 1.87M pairs to **51 anchored pairs carrying 1,459 rows**, and every cluster
already contains a rung-1/2/3 anchor — a published statewide line, a C-ID or a CCR
identity — so each question is a closed yes/no against an authority. Jev answered
all 51 in 10 seconds (`kb/_typesafe_cr_trial.py`, run 35516193054) and it
discriminates: *Introduction to Criminal Justice* 0.89 against *Introduction to
Criminology* 0.48 on the same `AJ 110` anchor with near-identical row counts —
the designated discriminator, and it passed. Spanish 1/2 at 0.84/0.86, Spanish 3
at **0.32**.

⚠️ **NOTHING FELL BELOW 0.32 — JEV EXPRESSES NO CONFIDENT NEGATIVES HERE.** The
`keep` bucket came back empty. The usable gate is **p ≥ 0.85 = suggest**,
everything else = a curator looks.

**THE VERDICTS LANDED (S280).** Sam answered all 51 on the
[sheet](https://claude.ai/artifact/KydcskYBqc93WAurcMEatq) (33 fold, 18 keep),
then, shown the eight anchors carrying both a fold and a keep, flipped 26, 27, 28,
29, 32, 35, 37, 38: **41 fold, 10 keep**. Written as **30 rows** in
`cr_reference_decisions` (20 anchor groups carrying folded wordings, 10 kept
groups confirmed), INSERT-only under `updated_by = cr-reference-s280@bot`,
verified member-by-member against
`kb/receipts/cr_reference_decisions_2026-09-20_s280.json`; rollback is one delete
on that `updated_by`. **These are the lane's first curator decisions** — before
them the table had never held data, and the lane's old "156 groups carry a
decision" counted the MECHANICAL rung ladder (108/28/46/41), not judgments.

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

## The gate, the band, and the battery (2026-09-21, S281)

**The gate is empirically right.** p ≥ 0.85 folded **25/25**; sweeping it, 0.85
is the highest-recall cut with precision 1.00 (recall 0.61), degrading at once
below (0.94 at 0.80, 0.87 at 0.70). `kb/_jev_score.py` reproduces it from the
committed receipt — no runner needed.

⚠️ **NOTHING ORDERS THE BAND BELOW THE GATE** — 26 pairs, 838 rows, the part
that needs a curator. Within it AUC(p_same) **0.441**, AUC(care) **0.450**
against 0.50 for chance. The three LOWEST-scored pairs in the whole set (0.32,
0.44, 0.48) were all folds. ⚠️ **A whole-set comparison of `care` flatters and
must not be used** — it reports a +0.41 separation that is really "above-gate
items are easy". The band is the only honest place to measure.

**The battery** (`kb/_jev_battery.py`, six variables, selection rule fixed in
source before any answer existed, primary gating six Holm-corrected
secondaries) **ran and nothing passed** — receipt
`kb/receipts/jev_battery_2026-09-21_s281.json`.

⚠️ **THE PRIMARY CAME BACK BELOW CHANCE — `any_reason` AUC 0.378.** Backwards,
not weakly right: where Jev found a reason to hold two apart, Sam was MORE
likely to fold them.

⚠️ **`units` AT 0.281 IS THE DURABLE LESSON.** Jev applies the general prior
that an hours difference means a content difference — the prior this domain has
overruled. **Where a domain has overruled a general prior, a general model's
confidence runs the wrong way.** Sam's 2-unit rule (below) is what makes the
question askable at all.

⚠️ **`level` IS A LEAD, NOT A FINDING** — raw p 0.023, **Holm 0.138**. It earns
ONE targeted re-test on a batch it did not pick; **never a re-analysis of these
26 rows**.

**What did not fail: the 0.85 gate** — 25 of 25, 346 rows.

## The ladder sheet, and the ranking rule that failed on it (2026-09-21, S282 SkyLedger)

Sheet: **https://claude.ai/artifact/BkxGoSkJUE22BWCGcw9pwB** — ten items,
generator `kb/_build_jev_ladder_sheet.py`.

⚠️ **TEN ADOPTED, NONE OF THEM HIS** — `replies/done` reads `ruled: 0 ·
as_proposed: 10`, every row `by: "default"`. **Worth nothing as calibration**
(the scoring rule is `by: "sam"` rows). Item 1 was held and asked back; he then
ruled it directly: **the CCR gets the next sitting**, at **40-60 findings**.

⚠️ **COLLAPSE VALUE CANNOT RANK THE FOUR CENTERS — IT IS A CONSTANT BETWEEN
THEM.** Measured on `chatbox_peer_articulations`: the CER, CSR, CCR and CCRR
each ride the **same 9,413 articulation rows across the same 82 colleges**,
consolidating different COLUMNS of one corpus. The rule orders items WITHIN a
center and is undefined between them. Third corpus to need its own rule —
the test to run before carrying one anywhere:
[`methodology-a-ranking-rule-is-a-claim-about-where-variance-lives`](../../kb-notes/methodology-a-ranking-rule-is-a-claim-about-where-variance-lives.md).

**What ranks the centers instead: what ONE SITTING of verdicts is worth.**

| Center | Judgment backlog | Reach of that backlog | Per verdict |
|---|---|---|---|
| **CCR** | 16,478 identities · 33,418 stand-alone | **134,485 member rows** | not yet askable |
| **CCRR** | 2,159 groups (1,936 at rung 5) | 9,413 rows · 82 colleges | **~29 rows** (51 verdicts → 1,459 rows) |
| **CSR** | 143 findings (123 are one rule) | identity layer, not rows | Rule 7 re-mint |
| **CER** | 59 findings · 38 keys | **71 rows · 20 colleges** | **~1.2 rows** |

⚠️ **THE CER's MEASURED REACH IS 71 ROWS** — only **21 of its 38** credential
titles reach the articulated corpus at all. Caveat on the sheet: the CER governs
3,813 unified titles across MAP, so its value may sit in **exhibit adoption**
rather than rows, which nobody has measured.

⚠️ **123 OF THE CSR's 143 ARE RULE 7 QUESTIONS.** `cs9_anchor_subj_diverge` asks
whether a discipline's canonical SUBJ4 should follow its anchor course — a
**re-mint**, under the mandatory playbook, and Rule 7 holds that an unreliable
signal never gates identity. Jev may RANK them for a curator; it must never
carry the verdict.

⚠️ **THE CER AND CSR FINDINGS ARE FROM 2026-07-10 — 73 days stale.** Every
triage count in the S281 handoff (CER 239→59, CSR 185→143) comes off those two
files, and the M-ID layer has been through a re-mint since. **Re-run both
scanners before a call is spent on either.**

**Only the CCRR has a decisions store.** `cr_reference_decisions` (with its
`note` reason column) and `kb_curation` are the only decision/curation tables in
the database. Each other center needs one before its first sheet, routed through
Governance under Rule 10(a3).

## The CCR rung, and Sam's ladder design (2026-09-21, S282 SkyLedger)

**Item 1 is RULED and it is his** — the ladder sheet's only `by: "sam"` verdict.
Sam, 2026-09-21: *"CCR gets the next sitting"*. Item 2 (the Trust Card adapter)
was its prerequisite and is built: `ccr_findings()` in `kb/_jev_adjudicate.py`,
guarded by `tests/jev_ccr_adapter.test.js`.

**THE CCR TRIAGES 27,580 TRUST CARDS TO 1,237 QUESTIONS** — the CER/CSR shape
(239→59, 185→143), reached by asking which tags a curator would recognize as a
question. Askable: `discipline_title_mismatch` 1,118 ·
`description_discipline_disagreement` 73 · `generic_title_concrete_discipline`
46. The state tags are repair, never adjudication.

⚠️ **6,621 ROWS FIRE ON SIGNALS THIS REPO HAS ALREADY RULED NON-AUTHORITATIVE,
AND ASKING JEV ABOUT THEM IS THE EXPENSIVE MISTAKE.** `unit_anomaly` (4,179) is
the question the battery MEASURED Jev on at **AUC 0.281, below chance** — units
are not identity here and a general model assumes otherwise.
`top_discipline_disagreement` (1,189) and `member_top_divergence` (1,253) ask Jev
to gate on TOP, which Rule 7 forbids outright. `CCR_NEVER_ASK` names all three
with the reason; `subject_discipline_outlier` (322) and `subject_collision_signal`
(113) are `CCR_RANK_ONLY` because a SUBJ4 change is a re-mint.

⚠️ **`discipline_title_mismatch` IS MOSTLY ARTIFACT, WHICH IS WHY THE DESCRIPTION
RIDES EVERY RULE.** It fires on token overlap, so *Three-Dimensional Design*
under Art and *Environmental Ethics* under Philosophy are both flagged and both
right. The real misses are obvious in the description and invisible without it:
an *Ethics* row under Philosophy whose description is **DEH-24's dental-hygiene
prerequisites**. COCI's `_x000D_` escapes are stripped; the catalog boilerplate
STAYS, because that DEH prerequisite list IS the evidence.

### Sam's ladder design (2026-09-21)

His words verbatim, including the revision that reordered it, are in the
`CPLBrain` braindump and `docs/common_cr_reference_lessons.md`.

**CIP IS AT PROGRAM LEVEL** (`coci_college_programs.cip_code`), and what colleges
actually assigned beats the CO's published crosswalk ~3x: mean **2.85** CIPs per
TOP over 19,349 programs, modal share **86.5%**, against 8.4 and a worst case of
1,032. `kb/top_cip_map.json` holds it (builder carries the refresh query) and it
resolves for **1,235 of 1,237**. It corroborates, never gates.

⚠️ **THE PARENT LAYER IS AN UNREVIEWED MAY DRAFT, AND SAM CALLED IT.** Measured
on `kb/coci_minted_courses.json`: **15,513 of 19,568 parents (79%)** were minted
in **2026-05** by `claude-opus-4-7 (Phase B M-ID consolidation draft)`. **ZERO of
the 19,568 carry a human `reviewed_by`.** 15,513 titles read
`local catalog (representative/modal)` — **the BOTTOM rung of the CCRR naming
cascade**. 14,751 (75%) carry no `discipline_source` at all. **Zero carry a C-ID
or CCN**, so the cascade's top two rungs fire on nothing at this layer; the 243
authority anchors sit in `common_courses.json`, which the auditor excludes by
design as upstream authority.

**So the rungs run membership first, parent second, and loop.**

| # | Rung | Population | Kind |
|---|---|---|---|
| 1 | **Title** — does this course belong under this discipline? | 1,237 | evidence |
| 2 | **Course description** | 1,237 (same rows, + evidence) | evidence |
| 3 | **CIP** | 1,237 (same rows, + evidence) | evidence |
| 4 | **Units** — is the spread a content difference? | **1,538** | population |
| 5 | **Subject-code outliers** | **435** | population |
| 6 | **Blanks the aggregate can fill** | **4,065** | population |
| 7 | The parent's own title, then its number | waits on settled membership | — |

⚠️ **TWO KINDS OF RUNG, AND CONFLATING THEM COSTS A SITTING.** Rungs 1-3 are ONE
question over ONE population with CUMULATIVE evidence, so "escalate what rung 1
could not settle" is meaningful. Rungs 4-6 are DIFFERENT questions over DIFFERENT
populations — they neither accumulate nor escalate into one another, and **each
earns its own gate**. `CCR_RUNG_KIND` says which is which.

⚠️ **SAM'S 2-UNIT RULE IS THE DOMAIN PRIOR THE BATTERY WAS MISSING**, and it is
why `unit_anomaly` left `CCR_NEVER_ASK`. Jev scored **AUC 0.281** there — below
chance — applying the general assumption that different hours mean different
content. Sam: *"the range should be 2 units variation as a non-critical
difference."* Measured across all 4,179 cards (every one carries 2+ member unit
values): **2,641 (63%) clear mechanically at or under 2 units, spending no
call**; **1,538 (37%) sit above it**, up to 33 apart. ⚠️ **The rule is STATED IN
the question** — re-adding it as a bare "do these units differ?" reproduces
0.281 exactly.

⚠️ **THE SUBJECT RUNG ASKS AND NEVER ACTS.** `CCR_NEVER_AUTO` names it: a SUBJ4
change is a re-mint under the mandatory playbook. Sam's low-stakes framing makes
the exploration safe; it does not make a model's answer a decision.

⚠️ **THE AGGREGATE RUNG'S FILL IS THE DESCRIPTION, AND IT COMES FROM A DIFFERENT
FILE.** Membership records carry college, control number, subject, course
number, units, credit status and TOP — **never a description**. 4,231 of the
7,158 aggregatable rows are missing exactly that, and **4,065 have member
descriptions** in `unified_courses_member_desc.js` (keyed by the same id, loaded
lazily because it is 47 MB). Of those, **271 agree word-for-word** (a mechanical
fill) and **3,794 differ** (the judgment). Sam's qualifier — *"where there is
something useful to work with in the aggregate"* — excludes the 8,132 blank/seed
cards that carry no members at all.

⚠️ **THE TWO TOP TAGS STAY NEVER-ASK** (2,442 rows). No domain rule rescues a
question whose whole premise is *"TOP disagrees"*; that is what separates them
from units.

**THE LADDER IS THE TEMPLATE, NOT A CCR SHAPE (Sam, 2026-09-21):** *"I will want
similar rungs for the other datasets."* The CER, CSR and CCRR each get their own
rungs on this pattern.

Rung 4's **title** follows Sam's cascade (CCN > C-ID > M-ID > published line >
modal wording); its **number** is a re-mint under the mandatory playbook, with
Jev ranking candidates and a curator ruling, the alias chain carrying the old id.

⚠️ **RULE 7 FAVORS DOING THIS NOW, and the window closes on a declaration.**
M-IDs are in staging-cleanup, re-mints are permitted under the playbook, and
nothing is faculty-published. ⚠️ **This LOOSENS ladder item 9**, which held the
CSR out because a SUBJ4 change is a re-mint — more conservative than Rule 7
requires. What stands is that Jev suggests and a curator rules.

⚠️ **THE PRODUCT IS THE DECISION, NOT THE CLEANUP (Sam, 2026-09-21):** *"the
MIDs are still experimental, so the stakes are low for mistakes. We want to use
these process explorations to better configure decisions for faculty to respond
to and curate where needed--much like our decision sheet procedure."* So the
M-ID layer is the low-stakes rehearsal room, the measure is whether a reader
rules quickly and stays right (undo and reversal rates, never clicks), and
faculty are discipline-bound — **slice the sheet by discipline**. Capture: `CPLBrain` braindump `2026-09-21-1900-the-ladder-is-a-rehearsal-for-faculty-decisions`.

**THE RUNGS ARE BUILT** (`--rung title|cip|description`, cumulative). CIP comes
from `kb/top_cip_map.json` — the modal CIP colleges assigned to real programs,
which resolves for **1,235 of the 1,237** questions and rides in WITH its
majority (`share`, `cips`) so it corroborates rather than gates.
⚠️ **RUN ONE RUNG.** A rung cannot escalate until it has a gate, and the CCR has
zero verdicts — 0.85 belongs to the CCRR and a different question. **NEXT: a
`title`-rung sitting, whose verdicts calibrate that rung; then rung 2 re-asks
only what rung 1 left unsettled.** Rung 4 (the parent's own title and number)
waits on settled membership.
