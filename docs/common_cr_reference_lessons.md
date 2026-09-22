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
   <topic>` at 99.1%, 100% with range parsing. Aggressive normalization —
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
   sit under **`AP United States History`**: denormalized, but every wording
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
documents the denormalization risk in detail. Every poisoned `AJ 110` row is
labeled `per_course`. The column is more optimistic than the data; a consumer
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
judgment and no achievable matcher changes that — *Racial Issues and the
Police* and *Community Relations* are one POST topic in unrelated words.

That should drive build order: **worklist, grouping affordance, curator
attribution and receipt first; matcher last.** Building the matcher first spends
the run on the tenth that is easy.

### Next concrete step

Build the tab as a **worklist**, not a report: the ~2,180 topics ranked by how
much they would collapse (wordings × colleges affected), each row offering
group / split / confirm with curator attribution, plus the four automated rungs
pre-applied and labeled by rung. Model the affordances on the CCR merge
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

### Three bugs, one shape: two places normalizing the same text differently

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
denormalized (credential, course) pairing — the POST cross-join the scope doc
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
judgment, almost in full. The local MAP lane by contrast is course-shaped
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

---

## 2026-08-14 — Sky153: the military lane, scoped

The previous section ended by saying the ACE lane *"deserves its own scoping
pass rather than an assumption that the same instrument fits."* It did, and the
assumption would have been wrong in both directions.

### What's been learned

**1. The prediction was right about the lane and wrong about the mechanism.**
Sam said the military CRs would be the stickiest. Handoff 153 explained that as
*"the whole lane falls to curator judgement"* because ACE recommendations are
subject areas with no C-ID to name them. The first half is true; the conclusion
does not follow. ACE is **already a controlled vocabulary** — 93.4% of
(`exhibit_id`, units, topic) groups hold exactly one text — so the lane is
*mechanically easier per string* than the freehand corpus, not harder.
Automation reaches **33.5%** here against ~10% there.

**2. "No cascade" ≠ "no authority."** The reasoning that trapped the handoff is
worth naming: the CCN > C-ID > M-ID rungs genuinely fire on almost nothing
(2.6% of ACE rows carry a `college_course`, against 94% of MAP-local rows). But
Sam's cascade **already ends in *published line > modal wording***, and for an
ACE recommendation ACE's own published text *is* the published line. The
authority was there the whole time, one rung lower. Checking the ruling we
already had saved inventing a new one.

**3. The ranking rule is corpus-specific, and that generalizes.** SkyCall's
hard-won finding was that ranking by spread is backwards and collapse value
(wordings × colleges) is right. In this lane collapse value is **also** wrong,
for the mirror-image reason: every head topic already sits at 80–100 of 108
colleges, because every college processing a JST receives the same ACE
exhibits. Multiplying by a near-constant ranks nothing. The durable form is
that **a ranking rule encodes an assumption about where variance lives**, and
that assumption has to be re-derived per corpus rather than inherited.

**4. The parser/people diagnostic.** The finding that changed the posture:
casing variance is mixed *within* 58 of 108 colleges, and **zero** colleges are
internally consistent in the lowercase direction. Nobody typed this. Typographic
variants are 7.6% of the ACE vocabulary against 0.6% of the freehand one — the
"authoritative" source is 13× dirtier than freehand human entry, which is
diagnostic on its own. Promoted to
[`methodology-tell-a-parser-defect-from-a-people-defect`](kb-notes/methodology-tell-a-parser-defect-from-a-people-defect.md).

**5. A committed memory row paid off, unprompted.** `f8` (Marine Corps JSTs
repeat lower levels' CRs at every skill level) was written for the *eligibility*
question. It explained a text pattern nobody was looking for — `ssgt gysgt
supervision`, 482 topics and 12,157 rows of rank tokens embedded in the
recommendation itself. Reading the memory table first is what connected them.

**6. I re-ran two measurements that were wrong, and both were wrong the same
way.** A `\b` word boundary in Postgres is a *backspace* (`\y` is the boundary),
so a normalization step silently matched nothing and reported no change — which
looks exactly like "that step doesn't help." And a containment join reported
908,451 rows in a 200,840-row lane, because a topic in many pairs was counted
once per pair. **Both were caught by a figure being impossible, not by
inspection.** Sanity-check every count against the population it came from.

### Current state

Scoped, not built. `docs/military_cr_reference_scope.md` carries the full
measurement with reproducible SQL. Nothing has been written to Supabase and no
builder has been pointed at the ACE lane.

### Strategic roadmap

The build order the measurement implies — deliberately the inverse of the
freehand lane, where the worklist came first and the matcher last:

1. **The mechanical spine first**, because here it is worth 33.5% rather than
   ~10%: typographic fold → units-as-attribute → rank strip → the not-a-topic
   class (47 strings / 6,663 rows, ready now).
2. **Then the worklist**, ranked by **rows**, sized for ~250 decisions to reach
   half the lane rather than ~50.
3. **Containment as a suggestion column only**, never a merge.

### Next concrete step

Sam answers the four questions in §10 of the scope doc. The one that actually
forks the build is **whether ACE unit variants are one recommendation or
several** — 22.2% of the vocabulary turns on it, and the existing
units-are-not-identity ruling came from a genuinely different situation
(colleges writing one course at different units, versus ACE issuing different
amounts for different training). The other three can be answered alongside.

## 2026-09-20 — what a model can and cannot be asked (S279, SkyKeeper)

**The lane's own headline number meant something other than it looked like.**
"156 of 2,159 groups carry a decision" reads as curator judgments. It counts the
mechanical rung ladder. `cr_reference_decisions` has never held a row. The
doctrine rule that caught this is the one that says a figure from a lane file is
a claim, not a measurement — reproducing it took one query and changed the whole
plan, because the trial I had designed scored Jev against a gold set that does
not exist.

**The shape of the problem was wrong in the same way.** Every rung-5 group holds
exactly one wording, so there is nothing to merge inside one. Ninety percent of
this lane is a cross-group question, and nobody had said so in those words.
Brute force is 1.87M pairs; blocking on the shared canonical is 51. **The
leverage was in the blocking, not in the matcher** — a better similarity metric
over 1.87M pairs would still have been unusable.

**A typed answer is not a boolean, and reading it as one fails silently.**
TypeSafe's noul returns a probability, 0 to 1. The trial filtered `x is True`,
which no float satisfies, so it would have printed "MERGE on 0 of 55 pairs"
whatever Jev said — a confidently wrong negative that reads exactly like a clean
result. It was caught only because Sam opened egress to the vendor's docs and
the schema could finally be read rather than inferred from their SDK. **The
cheapest fix for a class of silent failure was network access, not code.**

**Jev discriminates where string distance cannot.** *Introduction to Criminology*
sat at 0.48 against the same AJ 110 anchor that *Introduction to Criminal
Justice* scored 0.89 on, with near-identical row counts. Algebra-based physics
mechanics (0.64) ranked above electricity and magnetism (0.44) against
INTRO PHYSICS — the correct ordering, and the reverse of what shared tokens
would give.

**But it never says no.** Nothing fell below 0.32 across 51 pairs. Whatever
else it is, it is not a filter: the usable signal is the top of the range, and
everything else is still a curator's afternoon.


## 2026-09-20 — S280 (SkyForge): the twenty-one Jev use cases, mapped against our lanes

Sam shared @shannholmberg's thread and the *Jev + Claude Code* infographic. The
map, the three tests that decide fit (cheap to verify · ranks, does not filter ·
one more signal under the TOP posture), the data rule (public catalog text is
all that leaves the building) and what the two posts get wrong are in
[`reference-system-one-model-fit-by-lane`](kb-notes/reference-system-one-model-fit-by-lane.md).
The next Jev build is Sierra's semantic smoke assertions, advisory column
first; the CR variable battery still waits on the 51 verdicts, and the
`replies` collection held none at the start of this session.

## 2026-09-20 — S280 (SkyForge): the verdicts landed, and what they said about Jev and about sheets

Sam answered all 51 items in two sittings of a few minutes each: 33 fold, 18
keep, no notes. Shown the eight anchors carrying both a fold and a keep, he
flipped eight keeps to fold, so the lane's first curator decisions are
**41 fold, 10 keep**, written as 30 rows in `cr_reference_decisions` and
verified against the committed receipt
(`kb/receipts/cr_reference_decisions_2026-09-20_s280.json`).

**The gate is right; the ordering under it is noise.** Every pair Jev put at
0.85 or above folded, 25 of 25. Below the gate, Sam first kept the four
highest pairs (all 0.84) and folded the three lowest (0.32, 0.44, 0.48). A
probability in that band told us nothing about his verdict.

**A Yes relative to a proposal that flips per section is not a verdict.** The
sheet's how-to defined Yes as "take the proposal"; the review band proposed
hold-separate; Sam read Yes as fold throughout and said so: *"I found myself
saying yes to things that I later had to flip keep because I didn't pay
attention to your rec."* Items 26–41 all sat at version 2 — a Yes, then a flip
to Keep — answered bottom-up in one minute. That is the fatigue click made
visible, and his rulings follow from it: the recommendation line is the focal
point, chips name the outcome, the fold is proposed by default and pulled out,
the framing sits in the header.

**Over-merge by design.** *"It is better to over merge and give faculty the
chance to pull them out rather than the other way around. It's easier to
respond to a decision than to make one."* The `split` and `excluded`
affordances in the decisions table are the pull-out; the sheet is the
proposal. He wants the flow for CER, CSR, CCRR and CCR, and CCR is *"the big
kahuna with its thousands of decisions"*. The prerequisite there is a
decisions store with a reason column, which the CCR does not have yet.

## 2026-09-21 (S281, SkyAnvil) — the decision sheet rebuilt, and one magic half for four references

### The sheet, rebuilt around what the 51-item run cost

Sam reversed sixteen of his 51 verdicts on 2026-09-20 and named the cause:
*"make your recommendation line more visually a focal point. I found myself
saying yes to things that I later had to flip keep because I didn't pay
attention to your rec."* Two faults were in play at once, and both are now
prevented by construction rather than by care:

- **The proposal read as a fact.** It was `<dd class="ask">` in the same gray as
  the facts around it, with *Why* sitting between it and the chips. It is a
  tinted panel now, with its own rule and label word, and it is the last thing
  before the chip row. `promote_rec()` does the same to a sheet that already
  exists.
- **A bare Yes reads two ways.** The sheet defined Yes as "take the proposal"
  and its review band proposed hold-separate, so a Yes there meant *keep* by the
  sheet and *fold* to Sam. The stored value names the OUTCOME now — `fold` means
  fold whatever was proposed — and the label names the action.

Three further asks landed the same day: the intro deleted so the sheet opens on
item 1; a **Complete** button at the end; and **opt-out** — *"set the decision
button for each item to your recommended and I will change only if needed"*.

### Opt-out's one hazard, and the shape that contains it

A pre-selected chip is indistinguishable from an answered one, so a sheet
abandoned at item 30 hands over verdicts for 31–51 that nobody read. They are
still handed over — that is what opt-out IS — but never as his: an item with no
stored reply is carrying the proposal, a stored reply is always a person's
(`by: "sam"`), and Complete commits the rest marked `by: "default"`. The split
rides the message, the `replies/done` record and the paste line.

⚠️ **This changes what the calibration measurement means.** *"Jev was right 25
of 25 above p 0.85"* only holds over items a person actually judged. Score the
variable battery against `by: "sam"` rows; an as-proposed row measures the
default, never the model.

### `sendToClaude()` does not reach a Claude Code session — measured

Sam pressed Complete and asked whether it had reached the session. It had not.
The record said so (`replies/done` carried `sent: false`), which is what the
db-write-first design is for, but the page said it too quietly to notice.

The first diagnosis was wrong in an instructive way: the artifact watch HAD
lapsed on a session restart, so re-registering it looked like the fix. It was
not. Watch confirmed live at 13:42:11Z, pressed at 13:43:24Z, same
`no_session`. **A remote-container Claude Code session is not a session
`sendToClaude` can reach**, and no amount of watch hygiene changes that.

So the mechanism inverts: `replies/done` is a durable record that needs nothing
alive at the moment of the press, which means a sheet finished at midnight is
read by whatever session runs next. The send is a bonus that works from a
claude.ai chat session. **Arm a `send_later` that reads `replies/done` and
compares its `at`** — that is the hand-over procedure now.

### One magic half, and the second look the trial lacked

`playbook-trail-crew-method-magic-audit` already ran this pattern twice on
2026-07-10 (CER, then CSR). Every reference owns a METHOD half; what differs is
the MAGIC half, and the playbook records that the CCR *"has never had the magic
half at scale — the backlog is adjudication, not detection."* Jev is the cheap
magic half, so `kb/_jev_adjudicate.py` is the one place it lives — four trial
scripts would drift as the alias chain's copy drifted to 7 maps against 15.

⚠️ **The second look never sees the verdict it checks.** The playbook demands a
skeptic on every merge, and its own working version *"re-derived the numbers"*
rather than re-reading the claim. Jev cannot read a registry, so re-derivation
here means the NEGATIVE question put to the same evidence in a separate call
with the first answer withheld. "Critique this proposal" hands a model a
conclusion and asks for fault, which is the shape that rubber-stamps. A refuted
proposal goes to the curator however confident the first look was, and a 0.5
hedge is not a refutation.

**Triage, measured:** CER 239 findings → 59 worth a call (180 are roman-numeral
renames and style nits); CSR 185 → 143; CCRR 55 anchored pairs.

**Reconciled rather than assumed:** the receipt holds 51 pairs and
`build_pairs()` now yields 55. All 51 are still present, none lost, and the four
new ones all sit under the `community relations` anchor — the case this lane
names as the hard one. The calibration stands.

**CCR is deliberately not wired.** Its method half emits Trust Cards rather than
findings, and it is the big kahuna; pointing an unvalidated routine at it before
scoring against the 51 would be backwards.

---

## 2026-09-21 — S282 SkyLedger: the ladder, the CCR rung, and three things found by running rather than reasoning

**Sam ruled item 1 of the ladder: the CCR gets the next sitting of verdicts.**
It is the sheet's only `by: "sam"` verdict — the other nine came back
`as_proposed`, which under opt-out is a verdict for each item together with the
statement that nobody individually reviewed one.

### The ranking rule this lane owns does not rank the centers

The handoff said to prioritize the four centers by **collapse value** (rows ×
colleges), the rule this lane established. Measured on
`chatbox_peer_articulations`, the CER, CSR, CCR and CCRR each ride the **same
9,413 articulation rows across the same 82 colleges** — they consolidate
different COLUMNS of one corpus. The rule orders items WITHIN a center and is
**undefined between them**; it would have returned a tidy-looking tie.

**Third corpus, third rule.** The ACE lane found the mirror image on 2026-08-14
(every head topic already at 80–100 of 108 colleges, so the multiplier is a
constant). The durable version is now a KB note:
[`methodology-a-ranking-rule-is-a-claim-about-where-variance-lives`](kb-notes/methodology-a-ranking-rule-is-a-claim-about-where-variance-lives.md).

**What ranked them instead** is what ONE SITTING of verdicts buys: CCRR ~29 rows
per verdict (51 verdicts settled 1,459 rows) · CER ~1.2 (all 59 findings reach
**71 rows across 20 colleges**, and only 21 of its 38 keys touch the articulated
corpus at all) · CCR **134,485 member rows over 16,478 identities**.

### The CCR is wired, and the triage was the whole job

`ccr_findings()` turns 27,580 Trust Cards into **1,237 questions** — the same
shape as CER (239→59) and CSR (185→143), reached by asking which tags a curator
would recognize as a question rather than by taking the biggest pile.

⚠️ **6,621 rows fire on signals this repo has already ruled non-authoritative,
and asking about them is the expensive mistake.** `unit_anomaly` (4,179) is the
question the battery MEASURED Jev on at **AUC 0.281, below chance**;
`top_discipline_disagreement` (1,189) and `member_top_divergence` (1,253) ask
Jev to gate on TOP, which Rule 7 forbids. `CCR_NEVER_ASK` names all three with
the reason, `CCR_RANK_ONLY` holds the two SUBJ4 tags, and
`tests/jev_ccr_adapter.test.js` fails any re-addition.

⚠️ **`discipline_title_mismatch` is mostly artifact, which is why the
description rides every rule.** It fires on token overlap, so *Three-Dimensional
Design* under Art and *Environmental Ethics* under Philosophy are both flagged
and both right. The real misses are only visible in the description: an *Ethics*
row under Philosophy whose description is **DEH-24's dental-hygiene
prerequisites**. COCI's `_x000D_` escapes are stripped; the catalog boilerplate
STAYS, because that prerequisite list IS the evidence.

### Sam's rung design, and what CIP actually is

> *"title then CIP then course description"* … *"course records do carry CIP"*
> … *"the MIDs were minted a while back and new procedures might find a better
> suited parent number and title"* … *"the MIDs are still experimental, so the
> stakes are low for mistakes. We want to use these process explorations to
> better configure decisions for faculty to respond to and curate where
> needed."*

**CIP is at PROGRAM level** (`coci_college_programs.cip_code`), and the observed
one beats the CO's published crosswalk roughly 3x: mean **2.85** CIPs per TOP
over 19,349 programs with the modal CIP holding **86.5%**, against the
crosswalk's 8.4 and a worst case of 1,032. `kb/top_cip_map.json` holds it and it
resolves for **1,235 of the 1,237** questions. It corroborates and never gates —
a course's only route to a CIP is its TOP code.

⚠️ **THE PARENT LAYER IS AN UNREVIEWED MAY DRAFT, AND SAM CALLED IT.** 15,513 of
19,568 parents (**79%**) were minted 2026-05 by a "Phase B M-ID consolidation
draft" pass; **ZERO carry a human `reviewed_by`**; 15,513 titles read
`local catalog (representative/modal)`, the bottom rung of the CCRR naming
cascade; 14,751 (75%) carry no `discipline_source`; and **zero carry a C-ID or
CCN**, so the cascade's top two rungs fire on nothing at this layer.

**So the rungs run membership first, parent second, and loop** — re-titling a
parent before its membership is settled bakes the error into the new name.

### Three catches, none from a test

- **The ranking rule failed when measured**, not when reasoned about.
- **The gate bug appeared when the runner was wired.** `act_bucket` read one
  module-level `GATE`, so a CCR run would have printed `suggest` off 0.85 — a
  number measured on the CCRR's question. `jev_ccr_adapter` was passing 15/15 at
  the time. `GATES` is per-reference now, and a reference without one runs as a
  **calibration sitting**: every row `uncalibrated`, nothing proposed, no second
  look spent (a skeptic refutes a proposal, and a calibration run makes none).
- **A stale dependency map cost a red CI run**, then the pre-push gate caught the
  next two. `scripts/check_generated.sh` has existed since S242 and nothing in
  `CLAUDE.md` named it; it does now.

**NEXT:** dispatch `typesafe-smoke.yml` with `adjudicate=ccr`, `rung=title`,
a small `adjudicate_limit`; build a decision sheet from the `jev-ccr` artifact;
Sam's verdicts on it calibrate the title rung's gate and earn the CCR an entry
in `GATES`.
