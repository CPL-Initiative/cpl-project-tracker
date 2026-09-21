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

## SCORED against Sam's 51 verdicts (2026-09-21, S281) — `kb/_jev_score.py`

Arithmetic over a committed receipt, so anyone can reproduce it without a runner.
**The inherited claim reproduces exactly:** p ≥ 0.85 folded **25/25**; below it,
16/26. Sweeping the threshold, **0.85 is the highest-recall cut that suggests no
wrong fold at all** (precision 1.00, recall 0.61) and precision degrades the
moment it drops — 0.94 at 0.80, 0.87 at 0.70.

⚠️ **NOTHING JEV IS ASKED TODAY ORDERS THE BAND BELOW THE GATE** — 26 pairs, 838
rows, the part that actually needs a curator. Measured within it: **AUC(p_same)
0.441, AUC(care) 0.450** against 0.50 for chance (permutation p = 0.67 on care).
The three LOWEST-scored pairs in the whole set (0.32, 0.44, 0.48) were all folds.

⚠️ **A WHOLE-SET COMPARISON OF `care` FLATTERS AND MUST NOT BE USED.** All ten
keeps sit below the gate and the above-gate folds are easy ones with low care, so
comparing every fold against every keep reports a +0.41 separation that is really
"above-gate items are easy". **The band is the only honest place to measure.**
This reading was made and corrected the same hour.

## The battery: six variables, pre-registered, and it failed (2026-09-21, S281)

`kb/_jev_battery.py` — six reasons to hold two recommendations apart (**level ·
scope · units · lab · vendor · different_course**), all phrased in one direction,
all riding ONE call per pair. ⚠️ **The selection rule is fixed IN THE SOURCE
before any answer exists** (AUC ≥ 0.65, permutation p ≤ 0.05, 20,000 shuffles,
seed 7), the primary `any_reason` GATES the six secondaries (six tests over 26
rows handed a winner on 2 of 25 pure-noise runs; with the gate, 0 of 25), and the
design detects only AUC ≥ ~0.75 — **so a null means "no large effect in 26
pairs", never "no signal"**. Read the script before re-running it.

## THE BATTERY RAN, AND NOTHING PASSED (2026-09-21, run 35632754128)

Full per-variable table in the receipt, because an Actions log and artifact both
age out: `kb/receipts/jev_battery_2026-09-21_s281.json`.

⚠️ **THE PRIMARY IS BELOW CHANCE — `any_reason` AUC 0.378 (p 0.848).** The battery
is **backwards**, not weakly right: when Jev found a reason to hold two
recommendations apart, Sam was MORE likely to fold them.

⚠️ **`units` AT 0.281 IS INTERPRETABLE, AND THIS LANE PREDICTED IT.** The lane
already rules **units are NOT identity** (`SPAN 100` at 4/4.5/5 is one course;
`Engine Performance` correctly merges 2/3-4/4/5). Jev applies the general prior
that an hours difference means a content difference — the assumption CPL has
overruled. **Where a domain has overruled a general prior, a general model's
confidence runs the wrong way.** That is the durable lesson, and it is why
`unit_anomaly` is in `CCR_NEVER_ASK`.

⚠️ **`level` IS A LEAD, NOT A FINDING** — right direction, largest effect, raw
p 0.023, **Holm 0.138**. "Level works" is what anyone who had not pre-registered
would have reported. It earns **ONE** targeted re-test on a batch it did not pick,
pre-registered as a single hypothesis; **never a re-analysis of these 26 rows**.

**WHAT DID NOT FAIL: the 0.85 gate** — 25 of 25, 346 rows, nothing wrong in it.
The failure is confined to the 26 hard pairs, which is where curator judgment IS
the product rather than a cost to automate away.

## The ladder sheet, and the ranking rule that failed on it (2026-09-21, S282 SkyLedger)

Sheet: **https://claude.ai/artifact/BkxGoSkJUE22BWCGcw9pwB** — ten items,
generator `kb/_build_jev_ladder_sheet.py`.

⚠️ **ALL TEN CAME BACK ADOPTED, AND NONE OF THEM IS SAM'S.** He pressed Complete
at 18:31:36Z, two minutes after the sheet was published: `replies/done` reads
`ruled: 0 · as_proposed: 10`, and every row is stamped `by: "default"`. Under
opt-out that is a verdict for each item together with the statement that nobody
individually reviewed one. **So this sheet is worth nothing as calibration** —
the scoring rule is `by: "sam"` rows only, and there are none. Nine items are
being executed because adopting them costs him nothing; **item 1 is held**,
because it is the only one that spends something of his (his next sitting of
verdicts, on the CCR) and it carries the sheet's proposal rather than his
choice. Asked back in the comment thread.

⚠️ **COLLAPSE VALUE CANNOT RANK THE FOUR CENTERS — IT IS A CONSTANT BETWEEN
THEM.** The S281 handoff said to prioritize the ladder by collapse value
(rows × colleges), this lane's own rule. Measured on
`chatbox_peer_articulations`: the CER, CSR, CCR and CCRR each ride the **same
9,413 articulation rows across the same 82 colleges**, because they consolidate
different COLUMNS of one corpus (`unified_title` · `subject` ·
`subject`+`course_number` · `credit_rec`). Collapse value orders items WITHIN a
center and ranks nothing BETWEEN them. This is the **second** corpus on which
the rule has failed for a corpus-specific reason — the ACE lane found the mirror
image on 2026-08-14 (`a-ranking-rule-must-be-rederived-per-corpus`), where every
head topic already sat at 80–100 of 108 colleges. **Re-derive a ranking rule
per corpus; never carry one across.**

**What ranks the centers instead: what ONE SITTING of verdicts is worth.**

| Center | Judgment backlog | Reach of that backlog | Per verdict |
|---|---|---|---|
| **CCR** | 16,478 identities · 33,418 stand-alone | **134,485 member rows** | not yet askable |
| **CCRR** | 2,159 groups (1,936 at rung 5) | 9,413 rows · 82 colleges | **~29 rows** (51 verdicts → 1,459 rows) |
| **CSR** | 143 findings (123 are one rule) | identity layer, not rows | Rule 7 re-mint |
| **CER** | 59 findings · 38 keys | **71 rows · 20 colleges** | **~1.2 rows** |

⚠️ **THE CER's MEASURED REACH IS 71 ROWS.** Only **21 of its 38** distinct
credential titles appear in the articulated corpus at all, so its mid-sized
backlog buys the least of any center per verdict. Caveat recorded on the sheet:
the CER governs 3,813 unified titles across all of MAP, so its value may sit in
**exhibit adoption** rather than articulation rows — a measure nobody has taken.

⚠️ **THE CCR WAS NOT ASKABLE**, structurally: its method half emits Trust Cards
where the others emit findings. Fixed this session — see the CCR rung below.

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

### Sam's ladder design (2026-09-21, verbatim)

> *"For each ladder process (e.g., CCR), we will identify progressive steps make
> Jev determinations, right?"* … *"title then CIP then course description..."* …
> *"course records do carry CIP"* … *"the MIDs were minted a while back and new
> procedures might find a better suited parent number and title, so think about
> how/if we incorporate that"*

**CIP IS REAL AND IT IS AT THE PROGRAM LEVEL** — `coci_college_programs.cip_code`,
reached by college + TOP. ⚠️ **The OBSERVED CIP beats the published crosswalk by
3x:** across 19,349 real programs a TOP carries a mean of **2.85** CIPs (max 14)
and the modal CIP holds **84%** of its programs, against the CO crosswalk file's
mean 8.4 and max 1,032 (only 38 of 419 TOPs resolve to one CIP there). 192 of the
193 TOP codes behind the CCR questions are covered. CIP **corroborates, never
gates** — CLAUDE.md's standing posture until CIP earns trust.

⚠️ **THE PARENT LAYER IS AN UNREVIEWED MAY DRAFT, AND SAM CALLED IT.** Measured
on `kb/coci_minted_courses.json`: **15,513 of 19,568 parents (79%)** were minted
in **2026-05** by `claude-opus-4-7 (Phase B M-ID consolidation draft)`. **ZERO of
the 19,568 carry a human `reviewed_by`.** 15,513 titles read
`local catalog (representative/modal)` — **the BOTTOM rung of the CCRR naming
cascade**. 14,751 (75%) carry no `discipline_source` at all. **Zero carry a C-ID
or CCN**, so the cascade's top two rungs fire on nothing at this layer; the 243
authority anchors sit in `common_courses.json`, which the auditor excludes by
design as upstream authority.

**SO THE LADDER HAS A SEQUENCING CONSTRAINT.** Asking *"does this course belong
under this parent"* treats the parent as fixed, and for 79% it is a four-month-old
draft; re-titling a parent before its membership is settled bakes the error into
the new name. Both directions fail alone, so the rungs run membership first,
parent second, and **loop**:

| Rung | Question | Evidence |
|---|---|---|
| 1 | Does this member belong under this parent? | title |
| 2 | Does CIP corroborate? | program CIP (disagreement routes down, never decides) |
| 3 | Does the description settle it? | course description |
| 4 | Is the PARENT right — its title, then its number? | the settled membership |
| 5 | Re-run, because a changed parent changes membership calls | — |

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

**NEXT: stage `ccr_findings()` into the rungs above**, CIP from `coci_college_programs`.
