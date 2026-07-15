---
title: "CCR Merge/Mint Doctrine — the decision policy for course convergence"
created: 2026-07-03
version: "0.13 (2026-07-15 — batch 7, Session 117 StarMarcus: Q-VARIANT settled — the rest of the D-4 variant family resolves on its own logic, NOT a blanket honors fold: LAB (Lecture/Lab/Lecture-Lab of one course → ONE identity, own-C-ID labs excepted); REFRESHER (own identity distinct from the full base course — the whole-vs-part logic; refresher-variants merge with each other); BRIDGE (distinct transition course, kept; drift-variants merge). Doctrine's named open-fork queue now exhausted. v0.12 — batch 6: P-13 Q-HONORS (honors variant folds into its base; standalone honors-program courses keep identity); P-5 refinement Q-UNITS (a big unit spread on a non-standardized course is a WHOLE-vs-PART split signal, not a merge cap — the standardized-academy carve-out P-5a is unchanged); Q-XDISC (same-subject-code cross-discipline groups merge to the canonical SUBJ4 discipline; different-subject-code title collisions run the P-12 homonym check first). New open fork Q-VARIANT = the rest of the D-4 variant family (Lab/Refresher/Bridge…). v0.11 — P-11 Q-TARGETCOUNT FULLY SETTLED: Dance styles all consolidate to ONE 'Dance Technique' B/I/A; Music applied study stays PER-INSTRUMENT (Piano/Guitar/Voice B/I/A); ensembles (Music+Dance) stay per-type like KINE athletics; Music Theory/History keep transfer rungs. v0.10 — P-10 level-descriptor convention: TEXT bands (Beginning/Intermediate/Advanced) everywhere EXCEPT Foreign Languages, which use NUMERIC rungs (Spanish 1/2/3, drop the redundant 'Beginning'). Refined the 3-rung cap: per-rung official-identity sequences (FL/Calc — a C-ID per rung) keep ALL rungs (D-1); ladders without a per-rung official ID (ESL, studio art) cap at 3. v0.9 was the ESL 3-comprehensive collapse; v0.8 P-7/Q-FLOOR/3-rung-cap; v0.7 graduation gate P-6+P-1b; v0.6 P-1 RATIFIED + P-1a/7a/9a/10a)"
tags: [ccr, doctrine, merge, mint, m-id, mind-meld]
kb-status: internal
obsidian-folder: cpl-project-tracker
related:
  - "[[docs/ccr_convergence_strategy]]"
  - "[[docs/ccr_rules_brief]]"
  - "[[kb/doctrine_questions.json]]"
---

# CCR Merge/Mint Doctrine

**What this is.** The written decision policy for merging and minting course
identities on the Common Course Reference — the rules a curator (human or AI)
applies when deciding whether local courses are *one common course* for CPL
purposes. It exists so that 7,700+ worklist decisions can be made consistently,
at scale, by AI sessions calibrated to Sam's judgment (faculty → dean → VPAA
lens), with faculty SMEs validating downstream.

**How it evolves.** Rules carry a status:

- **ESTABLISHED** — already enforced in code/receipts; changing one is an
  engineering decision, not a curation one.
- **PROPOSED** — drafted from Sam's stated intent + system precedent; applied
  by AI batch decisions *as draft policy*, awaiting ratification through the
  mind-meld loop (voice notes in the worklist + calibration reviews).
- **OPEN** — a genuine fork only Sam (or faculty) can settle; the paired
  question lives in `kb/doctrine_questions.json` and surfaces contextually in
  the Suggested-merges popup.

Every batch pass cites rule ids in its receipts (`doctrine: ["D-3","P-9"]`),
so any decision can be traced to the policy line that produced it — and any
policy change identifies exactly the cohort to revisit.

---

## Part I — The purpose test (reading order matters)

### P-1 · CPL utility is the organizing principle — RATIFIED (Sam, 2026-07-13)

**The one test every other rule serves — Sam's lens (2026-07-13 calibration
sitting):**

> *"If a student showed up with evidence they'd already completed it — or that
> they have the skills — would you make them repeat your local course under its
> local name?"*
>
> **No → it's ONE identity (merge). Yes → keep it separate.**

This is pure CPL equivalence: the question is about **learning**, not textual
similarity and not discipline codes. It reproduces every sub-rule below — and
when a sub-rule and this test disagree, **the student-repeat test wins**:

- **Rungs** (Intermediate → Advanced): a student with Intermediate *would* be
  sent to repeat Advanced → **keep separate.**
- **Homonyms** (music "keyboard" vs office "keyboard"): the skills differ, so
  the student *would* repeat → **keep separate.**
- **Title drift** (Intro Auto Mechanics ≡ Fundamentals of Auto Mechanics):
  same learning, *wouldn't* repeat → **merge.**
- **CR/NC mirror** (a course taught credit + free-noncredit): the noncredit
  twin **is** the Credit-by-Exam on-ramp — you'd never make the student repeat
  it → **merge to one identity** (credit is the face, noncredit tagged).

**Legal foundation — CA Title 5 §55050 (Sam, 2026-07-13).** California's Title 5
§55050 authorizes Credit for Prior Learning for skills **"similar to"** the
course outcomes — *not identical*. That "similar" standard is the statutory
window that lets faculty **err on the side of the student**: an obviously
qualified learner should not have to sit through a course to earn credit they
could arguably teach. The student-repeat test is the faculty-judgment form of
§55050 — *"would you make them repeat it?"* ≈ *"are their skills similar enough
to the outcomes?"* This is why the staging default is **merge / grant, with
receipts** (P-9): under-serving a qualified student is the worse error, and the
"similar" bar — not an "identical" bar — is the one the law actually sets. The
mission it serves: give faculty the tools to save students time and money, and
to welcome the learners who assumed *"college isn't for me."*

Equivalent faculty-facing phrasing (same test, curator voice): *"Would a
faculty workgroup mapping a credential treat these as ONE credit target?"* The
CCR catalog exists so those workgroups pick a credit recommendation by **common
course name** instead of 116 local names. Catalog fidelity is the *evidence*;
credit/learning equivalence is the *question*.

**Learning-equivalence beats subject-code matching (Sam, 2026-07-13).** The
student doesn't care which **department** owns the course. If the *learning* is
the same, same-content courses in **different disciplines are one identity** —
the department is a taxonomy artifact, not a separator. (Worked case: *Wellness
Arts* in Family & Consumer Sciences ≡ *Arts for Wellness* in Interdisciplinary
Studies — a student with one is never sent to repeat the other.) This
deliberately relaxes the old "different discipline → keep separate" reflex, and
it is **safe** because the homonym guard survives on its own terms: different
*skills* means the student WOULD repeat, so music-"keyboard" vs office-
"keyboard" still splits. In one line: **learning-equivalence merges
same-content-different-department; the homonym guard splits
same-word-different-skill.**

#### Calibration refinements folded from the 2026-07-13 sitting

Deltas ratified while walking the 52-group calibration through the lens above.
Each amends a named rule and is cited by its id in receipts:

- **P-1a — Homonym group with a mergeable core.** A shared-word group is not
  all-or-nothing. When a "same word" cluster contains a genuine sub-family plus
  an outlier, **split the outlier and merge the core** — do not default the
  whole group to keep-separate. (Case #30 *Healthy Aging*: merge the
  Healthy-Living/wellness core — stress/nutrition/exercise/weight — and keep
  the substantive **gerontology** "Healthy Aging" as its own identity.)
- **P-7a — Reclassify a real course wearing a generic coat.** A title that
  *looks* generic ("Individual Problems in Sculpture") but is really a nameable
  skills course gets **reclassified/renamed**, not dismissed as a generic shell.
  (Case #36 → rename to *Sculpture Skills 1 / 2*, kept as a 2-rung sequence.)
- **P-9a — Region/theme-word groups: umbrella on a second signal.** A
  region-or-theme-word collision (case #23 *Asian & Pacific* across
  music/dance/art) stays **separate by default**, but if the members actually
  **co-articulate** (cross-topic evidence — a credential maps A&P music *and*
  dance *and* culture together), merge to a named **umbrella** identity (e.g.
  *Asian & Pacific Culture (Music/Dance/Art)*). The second signal is the
  co-articulation evidence, not the shared word.
- **P-10a — Strip catalog rung-codes from unified titles.** Local rung
  notations like "3A" / "1B" never survive into a unified title; express level
  as the plain word (*Beginning / Intermediate / Advanced*) and record the
  original code in `merge_note`. (Case #39 *Intermediate Ballet 3A* → the "3A"
  drops.)

#### Calibration rulings folded from the 2026-07-14 graduation gate

The v0.6 gate re-decided a blind sample and surfaced two forks Sam settled
(receipt: `kb/doctrine_out/2026-07-14/v06_gate_measurement.md`). Both are cited
by id in receipts:

- **P-6 RATIFIED (settles Q-SAMECOLL) — same-college variants converge; the FORM
  depends on whether the pair is title-drift or a numbered sequence.** Two
  same-college sub-cases (Sam, 2026-07-14, refined):
  - **Title-drift / both-introductory pairs → clean MERGE.** When the two are the
    same course under a drifted name — *Printing Skills Lab* + *Introductory
    Printing Skills Lab* (**both read introductory**) — merge to ONE identity, no
    rung notation. A student with the skill wouldn't repeat either.
  - **Numbered sequences (1/2/3) → the per-rung UNIT LOAD decides (P-5 signal).**
    A level split like *Custodial Report Writing 1 + 2* merges into one identity
    whose unified title carries the rung span parenthetically — *"Custodial Report
    Writing (1 and 2)"* — with the rungs in `merge_note`. **Low per-rung units
    (≤ ~1u, e.g. 0.5u each) → MERGE** (parenthetical form): the rungs are
    competency *pieces* of one course, not distinct credit targets. Substantial
    per-rung units lean the other way. This is P-3-style packaging at the
    same-college level: the merge **preserves** the rung composition
    parenthetically, never silently collapses it. (Per P-10, the parenthetical
    span is the ONE allowed rung notation in a unified title, and only for this
    same-college numbered-package case.)
  - **Boundary (unchanged):** a **degree-applicable** sequence where each rung is
    its own credit target (Calculus I/II, the composition sequence) keeps its
    rungs per P-3. (Sam, 2026-07-14: "Custodial courses could either be kept
    separate 1 and 2 or merged with a parenthetical (1 and 2). Print courses
    should be merged since both appear introductory… since Custodial is only .5u,
    seems like merging would be best.")
- **P-1b — breadth + program-context splits a homonym.** Same-word titles that
  differ in **both breadth and program context** are different credit targets
  and stay **separate**: a broad course embedded in a **degree program** vs. a
  **narrow, specific** offering that reads as **enrichment / noncredit**. The
  learning differs (so the student *would* repeat), and the enrichment side may
  fall **below the CPL floor** entirely (→ Q-FLOOR). This sharpens the P-12
  homonym guard with a breadth signal. (Worked case #14: *Management: People
  Skills* — Business, part of a business program — vs. *People Skills for the
  Freelancer* — Small Business Development, specific/enrichment — **keep
  separate**. Sam, 2026-07-14: "People Skills in Management is broad and likely
  part of a Business program, whereas the freelancer one is super specific and
  sounds like a noncredit program for enrichment.")

#### Calibration rulings — batch 2 (2026-07-14, three fresh-sample scenarios)

A second small batch of stratified scenarios (the antidote to the thousands-
strong worklist — Sam: he'd dropped off the 🧠 Suggested-Merges panel because
the volume overwhelmed him). Three open questions settled:

- **P-7 RATIFIED (settles Q-GENERIC) — one umbrella identity per generic-type ×
  subject.** Generic variable-content shells (**Topics in X · Discussion in X ·
  Special Topics · Work Experience · Independent Study · Directed Study**) are
  **umbrella-minted ONE per (generic-type, subject)** — e.g. a single "Topics in
  Business", a single "Work Experience in Business" — with "Advanced"/level
  variants folded in as `merge_note`. They carry no per-section identity, so this
  is the only convergent form that makes sense; the umbrella IS the CPL-facing
  target. (Sam, 2026-07-14: "merge 1 for each 'Topics, Discussion in any Subject'
  'Work Experience in any Subject'.") Reconciles P-7's prior "second signal"
  bar: the *discipline+generic-type* pairing IS the second signal.
- **Q-FLOOR bounded — enrichment framing alone does NOT lower a course below the
  floor.** When an enrichment/older-adult **noncredit** course teaches the **same
  learning** as a credit course, it **MERGES** under learning-equivalence (P-1) —
  the noncredit-enrichment label is not disqualifying. The CPL floor is for
  content with **no credit-equivalent learning** (recreational/avocational), not
  for merely-noncredit delivery of real skills. This bounds **P-1b**: P-1b splits
  when the *skills/breadth differ* (People Skills); it does **not** split when the
  learning is the SAME and only the audience is enrichment (Nonfiction Writing —
  Humanities credit ≡ Older-Adults-Noncredit → merge). (Sam, 2026-07-14: "Merge —
  learning-equivalence.")
- **P-3 refinement (Q-LADDER) — the 3-RUNG CAP.** A ladder whose rungs are NOT
  independently official/transfer credit targets caps at **three rungs**; a
  ladder with >3 such rungs **consolidates by pairing**: **(1,2) → rung 1 ·
  (3,4) → rung 2 · (5,6+) → rung 3.** This applies even to **degree-applicable
  creative/skill ladders** (studio art) — CSU-transferable is not enough to
  exempt. Naming follows the field: **numbered "1/2/3" for Foreign Languages**
  (per P-10; drop the redundant "Beginning" — "Spanish 2", not "Beginning Spanish
  2"), Beginning/Intermediate/Advanced **word-bands** for everything else (ESL,
  studio); rungs recorded in `merge_note`. (Worked case: Painting 2/3/4 +
  Advanced Painting 1/2 + "Painting - Advanced" → 3 consolidated rungs. Sam,
  2026-07-14: "changed to 1 of 3 numbered rungs and those with more than 3 rungs
  consolidated: (1,2) (3,4) (5,=>6).")
  - **Exception — per-rung official-identity sequences keep ALL rungs (D-1).**
    Where each rung maps to its own **official identity** (a distinct C-ID/CCN or
    a per-rung transfer target) — **Foreign Language** (Spanish 1/2/3/4 → C-ID
    SPAN 100/110/200/210), **Calculus I/II**, the composition sequence — the rungs
    are separate authoritative credit targets and **never collapse**, however many
    there are. These use numeric labels for FL, keep their count, and are exempt
    from the 3-rung cap. (Studio art has no per-rung C-ID → it caps; FL does → it
    doesn't. That, not mere transferability, is the line.)

#### Calibration rulings — batch 6 (2026-07-15, Session 117 StarMarcus)

A grounded 3-fork batch settled the last of the carryover open forks
(Q-HONORS, Q-UNITS, Q-XDISC). Each is cited by id in receipts.

- **P-13 — Honors variant folds under its base course; standalone honors-program
  courses keep their identity — RATIFIED (Sam, 2026-07-15; settles Q-HONORS).**
  An **Honors variant of a base academic course** (*Honors Financial Accounting*
  ≡ *Financial Accounting*; *Honors General Chemistry* ≡ *General Chemistry 1*)
  **merges INTO the base** — the competencies are the same course, so under the
  student-repeat test a student with either would not repeat the other. The honors
  designation is a GPA/enrollment mark (like the venue/format marks P-11 folds),
  recorded in `merge_note`. **Carve-out:** a **standalone honors-program course
  with no base** — *Honors Colloquium*, *Honors Forum – Humanities / Social
  Sciences*, *Honors Seminar* — is its OWN identity (there is no base course to
  fold into; it's a distinct interdisciplinary offering). Do NOT collapse the
  standalone honors courses into a generic umbrella. (Data: 128 unified courses
  carry "Honors" in the title.) This scopes only the **honors** slice of the D-4
  variant-type family; the OTHER D-4 marks (Lab / Refresher / Recertification /
  Bridge / Cross-listed) are the still-open **Q-VARIANT** fork.

- **P-5 refinement — a large unit spread on a NON-standardized course is a
  WHOLE-vs-PART signal, not a merge threshold — RATIFIED (Sam, 2026-07-15; bounds
  Q-UNITS).** When members of a non-standardized group span a wide unit range
  (≥ ~4u), the spread almost always means a **comprehensive course got lumped with
  its own pieces**: *Introduction to Medical Assisting* (15u) sitting with *Intro
  to Medical Assisting 1/2* (3u each); *Vocational Nursing 1* (9u) sitting with
  *Supplementary Nursing Skills Practice* (0.5u). The correct move is to **split
  the whole from its parts** — the comprehensive course is one identity, each part
  (module, companion lab, skills-practice) merges with its true peers — NOT to
  block the merge on a fixed unit cap, and NOT to over-merge whole+part into one
  row. **The standardized-curriculum carve-out (P-5a) is unchanged:** POST / Fire /
  EMT / NCCER / BAR academies merge despite huge spreads because colleges package
  the same standardized training into different unit loads. So unit spread is a
  **diagnostic**: on standardized curricula a big spread means *"packaged
  differently, merge"*; on non-standardized curricula it means *"whole lumped with
  parts, split them."* (Screening signal: a member < ~25% of the group's modal
  units, or > ~2× the modal, is a whole/part outlier to separate; record the split
  rationale in `merge_note`.) (Data: 826 non-standardized groups carry ≥3u spread;
  370 are ≥4u.)

- **Q-XDISC RESOLVED — same-subject-code cross-discipline groups merge to the
  canonical SUBJ4 discipline; different-subject-code title collisions gate on the
  homonym check — RATIFIED (Sam, 2026-07-15).** The dominant cross-discipline
  pattern is **one subject code tagged with disagreeing discipline labels**:
  *Income Tax Accounting* tagged both **Accounting** and **Business** (both subject
  `ACCT`); *Ceramics Handbuilding* tagged both **Art** and **Ceramic Technology**
  (both `ART`). These are one course tagged inconsistently → **merge; the survivor
  takes the canonical discipline for that SUBJ4** (D-8), the pick recorded in
  `merge_note`. The **smaller pile with DIFFERENT subject codes + a colliding
  title** (*Fire Fighter* as Fire Technology/`FIRE` vs Emergency Medical
  Technologies/`CALJA`) is a possible **homonym**: run the **P-12** check
  (title + description + aligned exhibit) BEFORE merging — never auto-merge those.
  This makes D-8's "cross-discipline merges pick the survivor's discipline
  deliberately" a concrete two-branch procedure. (Data: 2,050 groups span ≥2
  disciplines; 371 span 3+.)

### P-2 · The two-number goal — PROPOSED

1. **CPL-facing tier: ≤ 2,500 named common courses** — the concise crosswalk
   catalog surfaced to MAP faculty workgroups. Composition: all CCNs (58) +
   all C-IDs in CCC use (~491) + the M-IDs that CPL demand actually touches
   (existing articulations, exhibit/credential alignment, adoption leverage,
   JST/military crosswalk, workforce sectors).
2. **Total-space convergence: continuous.** The rest of the identity space
   (the long tail of standalones) keeps converging mechanically where safe,
   but concision is measured and managed on the CPL-facing tier, not the
   whole universe.

Per-discipline convergence targets follow from tier-1 (see the strategy doc);
a discipline's target is a *design goal that biases decisions*, not a quota
that forces bad merges.

### P-9 · At this stage: when in doubt, merge and flag — PROPOSED

The M-ID layer is AI-assisted **staging** (Rule 7) — not faculty-published.
Sam (Session 57): *"over-merge > under-merge."* An under-merged catalog at
7,700 decisions is a bigger failure than a few over-merges that carry
receipts and reverse cleanly. So the staging-phase default is **merge**, with
three hard carve-outs that never soften:

- never across the credit/noncredit **band** (D-3) — unless via an explicit
  packaging decision (P-4) that records it;
- never across unshared **variant-type marks** (Honors/Lab/Refresher/
  Instructor/…, D-4) without member-level evidence;
- never a suspected **homonym** (same words, different field — music vs
  office "keyboard") — cross-discipline groups need a human or a
  second signal.

Every doubt-merge carries `merge_note` receipts so faculty validation can
split it back with zero archaeology.

---

## Part II — Established mechanics (already enforced; cite, don't relitigate)

### D-1 · Identity precedence: CCN > C-ID > M-ID — ESTABLISHED

Official identities are authoritative and verbatim — never re-keyed, never
retitled, never invented. An M-ID exists only where no official identity
covers the course; when one arrives, the M-ID folds into it (alias-tracked).

### D-2 · The evidence ladder — ESTABLISHED

Placement uses the strongest available justification: (1) the college's own
COCI filing → (2) the c-id.net registry → (3) historical receipts that pass
the kinship (title-freshness) check → (4) a human confirmation. Title/
description *similarity* only ever produces suggestions. (Full plain-language
statement: `docs/ccr_rules_brief.md`.)

### D-3 · Band purity — ESTABLISHED (mirror carve-out added 2026-07-12)

Credit (`M1xxx`) and noncredit (`M9xxx`) identities never merge across the
band in a *same-course* merge. (A deliberate level-band **package** that
spans funding types is a different operation — P-4 — and must be explicit,
never an auto-merge side effect.)

**Mirror carve-out — Q-CREDITNC RESOLVED (Sam, 2026-07-12).** Colleges
routinely offer a **mirrored CR/NC pair**: the *same course* taught in both a
credit and a **noncredit** section. The noncredit section is **free**, has an
easier onboarding path, and — critically — **is itself a CPL mechanism**: a
vocationally-qualified (experience-list / `not_masters` MQ) instructor teaches
the noncredit section, and the student earns credit for the mirrored course
through the **Credit-by-Exam** process. This pairing is a *feature*, not a
band-purity violation.

Therefore a **same-college noncredit member that mirrors a same-college credit
member** (same subject; the NC section is typically 0.0u and often numbered as
the credit number plus a noncredit prefix, e.g. `IS 52` ⟷ `IS 352`, `ELECT 11`
⟷ `ELECT 111`) **belongs in the SAME identity** and does **not** trigger an
over-merge split. The presence of the NC mirror is *expected evidence of a CPL
pathway*, and the merge records the pair with a `merge_note` (the credit member
is the survivor; the NC mirror + its Credit-by-Exam bridge are noted for
faculty). This closes the loop with the MQ lane: the CR/NC mirror is precisely
*where* a vocational-discipline's faculty teach.

D-3 still gates credit/noncredit mixes that are **not** mirror pairs — genuinely
different courses lumped across the band with no same-college credit⟷noncredit
correspondence (those remain over-merge splits). The test is: *does each
noncredit member have a same-college credit sibling of the same subject?* If
yes → mirror, keep. If the band mix is between different courses → D-3 split
stands.

**Mirror ≠ "keep everything separate" (Sam, 2026-07-12).** The carve-out
suppresses the D-3 *split* signal; it does **not** suppress cross-college
*consolidation*. A mirror is a **property of one canonical identity**, not a
license to keep every college's copy of the same mirrored course as its own
row. So the same mirrored course taught at N colleges still merges to **one
canonical CR/NC pair** (credit member the survivor, the NC mirror + its
Credit-by-Exam bridge recorded in a `merge_note`), *tagged* as a mirror. The
goal is exactly one canonical version of the pair — the mirror tag rides that
canonical row. (Materialized as the `crnc_mirror` flag on each identity, from
`kb/_detect_crnc_mirrors.py`.)

### D-4 · The guard suite — ESTABLISHED

`kb/_consolidation_guards.py`: level marks gate on two independent axes
(word-levels and digit-levels); cardinal word-numbers count as digits; 4-digit
years are edition marks; variant-type words (refresher/update/instructor/
supervisor/module/bridge/honors/lab/…) gate at strict equality; gender and
sport marks gate the athletics template trap. These guards filter what is
*suggested*; the doctrine governs what a curator *confirms over* them.

### D-5 · Humans outrank automation, always — ESTABLISHED

A curator row is never overwritten by a batch pass (`ON CONFLICT DO
NOTHING`); Verified rows are locked to automation; anchors are firewalled.

### D-6 · Everything reversible, everything receipted — ESTABLISHED

Batch cohorts are stamped (`reviewed_by = '<cohort>@bot'`), plans and alias
maps are committed under `kb/*_out/<date>/`, and the re-mint playbook (Rule
7) governs any identity re-key. A decision that can't be traced or reversed
doesn't ship.

### D-7 · Aggressive suggestion, deliberate confirmation — ESTABLISHED

The worklist surfaces loosely (level-collapsing signatures, synonym map,
looseness slider) because surfacing is free; confirmation is where judgment
applies. Title 5 §55050 gives colleges wide CPL latitude — the suggestion
layer mirrors that latitude, the confirmation layer applies this doctrine.

### D-8 · Discipline / SUBJ4 coherence — ESTABLISHED

One discipline → one canonical SUBJ4 (umbrella exceptions: Foreign Languages,
Kinesiology). A merge whose survivor changes discipline re-disciplines
explicitly (never silently); cross-discipline merges pick the survivor's
discipline deliberately. **Q-XDISC procedure (2026-07-15, batch 6): a group
whose members share ONE subject code but carry disagreeing discipline labels
(`ACCT` tagged Accounting vs Business) is one course tagged inconsistently →
merge to that SUBJ4's canonical discipline, pick in `merge_note`. A group with
DIFFERENT subject codes + a colliding title runs the P-12 homonym check
(title + description + exhibit) BEFORE merging — never auto-merge those.**

### D-9 · MQ-tightening gate — ESTABLISHED (Sam, 2026-07-12)

A re-discipline changes the *implied faculty-qualification pool* — the MQ list
(`mq_list` in `kb/reference/mq_sections.json`) of the new discipline vs. the
old. **Direction matters, and only the tightening direction gates:**

- **Loosening or lateral** — moving a course TO the experience/vocational list
  (`not_masters`), or a move within the same list — **expands or preserves**
  the teachable pool. **Auto-apply** as normal.
- **Tightening** — moving a course TO the master's list (a `not_masters` →
  `masters`/`both_lists` move) can **disqualify current instructors**. **Gate
  it: route to `needs_curator`** for faculty; never auto-fire.

This closes the D-8 gap the MQ wire-up exposed (a discipline change is also a
who-can-teach change). It applies at fire-time to every `discipline_correct`
lane — the proposal's old→new `mq_list` transition is checked before staging.

### D-10 · Discipline is the course's FIELD, not its program — ESTABLISHED (Sam, 2026-07-12)

A course's **discipline** is the *field it belongs to* — what it teaches and who
is MQ-qualified to teach it (**title + description + content**). It is **NOT** the
program, apprenticeship, or pathway that *requires* the course. Vocational /
apprenticeship programs are **cross-disciplinary**: the Carpenters Apprenticeship,
for one, includes Welding, Industrial Technology, Steamfitting, and Construction
Technology courses alongside Carpentry ones. Each course keeps **its own
discipline**; its membership in a program lives in the **articulation / pathway
layer** (the exhibit it articulates to), never in the discipline field.

- **The tell:** a course whose title/description are clearly field X (e.g.
  "Structural Welding," AWS processes → Welding) but that carries a program's
  TOP code (0952.10 Carpentry) and articulates to that program's apprenticeship.
  Per **P-12**, the program-driven TOP is the *weak* signal; title + description
  govern → discipline = the field (Welding), not the program (Carpentry).
- **Worked case (2026-07-12):** `WELD M1066 / M1092 / M1121` ("Structural
  Welding A/B," "Light Gage Welding") were fired **Welding → Carpentry** by the
  wave-1 lane because they carry TOP 0952.x and articulate to "Carpenters
  Apprenticeship — Millwright / Drywall/Lather." That is exactly this error —
  they are *Welding courses included in* carpentry apprenticeships. Correct
  discipline = Welding; the carpentry link is preserved in the articulation.
  (Revert staged: `kb/ccr_out/2026-07-12/discipline_vs_program_revert.json`.)
- **Rule for adjudicators:** never re-discipline a course to match a
  program/apprenticeship it articulates to. When the course's field and its
  program differ, keep the **field** as the discipline; the articulation carries
  the program membership. (Connects to D-9 — a welding course needs a
  welding-qualified instructor regardless of which program uses it.)

---

## Part III — Proposed judgment rules (the mind-meld draft)

### P-3 · Level-band packaging for non-degree-applicable ladders — PROPOSED

**The ESL move.** Where a course family is a long ladder (levels 1–7,
quarters, modules) **and** the rungs do not change the credit a CPL student
would receive — typically noncredit and/or non-degree-applicable sequences —
mint **band packages**: *Beginning / Intermediate / Advanced X*, and fold the
rungs in with their original level recorded in `merge_note`.

- Rationale: a certification or JST skill maps to "Intermediate ESL," never
  to "ESL Level 4 Grammar Module B." Rung-level rows are noise to a faculty
  workgroup and an equity obstacle to a student.
- **RATIFIED by mind-meld (Sam, 2026-07-03; distilled 2026-07-10).** Sam's
  ESL sitting enacted exactly this move and pinned the mapping: **levels 3–4
  → Intermediate 1 and 2** (a band may carry numbered SUB-BANDS when the
  ladder is long), **levels 5–6/7 → Advanced**; unnumbered base titles and
  "Skills Development" variants → Beginning. CPL frame confirmed verbatim:
  the package backs "an ESL certificate … used to clear a prerequisite."
  He also treats the **"English as a Second Language" and "ESL Noncredit"
  DISCIPLINES as one family for packaging** ("much of the content will be
  the same type of preparation") — a P-3/P-4 packaging decision that spans
  the band per D-3's explicit-package carve-out, recorded per member.
- Faculty framing: not a curricular judgment — a **CPL-feasibility** decision
  under Title 5 §55050. The rungs still exist at every college; the CCR
  packages them for credit-recommendation purposes only.
- **Boundary:** degree-applicable sequenced courses (Calculus I/II, Spanish
  1/2/3, ENGL composition sequence) keep their rungs — CPL awards real
  course credit there and the rung *is* the credit target. (→ Q-LADDER)

### P-4 · Skill strands fold into the band — RATIFIED (Sam, 2026-07-14; the ESL 3-comprehensive collapse)

Within a packaged family, parallel skill strands fold into the band package.
**Q-STRANDS SETTLED — no strand survives as its own identity.**

**The ESL 3-comprehensive collapse (Sam, 2026-07-14).** ALL of ESL (English as
a Second Language, credit ⋃ noncredit per P-3) collapses to **exactly three
comprehensive courses — Beginning · Intermediate · Advanced ESL** (the 3-rung
cap applied to the discipline). **Every flavor bundles into the level-appropriate
comprehensive:**

- **Skill strands** — listening, speaking, reading, writing, grammar,
  conversation, pronunciation, vocabulary, **academic prep / EAP** — all fold in.
  None is a separate target. (Sam: *"bundle all the flavors into one of the 3
  comprehensives."*)
- **Content-for-ESL-students courses** — culture/film, "US Life & Culture for
  Multilingual Students", "Desktop Apps for Multilingual Students", classroom
  culture — **also bundle into the 3** (Sam ruled these IN: they're part of the
  ESL offering, folded by level).
- **Level assignment:** use the title/description level mark; a course with **no
  explicit level defaults to Beginning** (the CPL-safe under-claim — award at the
  entry band rather than over-claim), refined from the description where present.

**Three carve-outs escape the collapse (kept as their own identities):**

1. **Transfer-level / degree-applicable ESL** — the rare transferable courses
   (e.g. *"ESL 101 Reading and Writing"*, a transfer composition course). CPL
   awards real transferable credit here, so the rung IS the credit target — the
   ESL analog of the P-3 degree-applicable boundary (Calc I/II keeps its rungs).
   *"Some colleges have those but they are fairly rare."* (Sam, 2026-07-14.)
2. **ESL Citizenship** — naturalization/civics-purpose ESL ("ESL for Citizenship",
   "Citizenship Preparation") is its own identity, not general language (Sam kept
   distinct).
3. **Vocational ESL (VESL)** — workforce/CTE-purpose ESL ("Vocational English for
   Culinary Arts", "ESL for the Workplace", "IT Workplace Language Support") is
   its own identity/family, a distinct workforce-credit angle (Sam kept distinct).

Impact on current data: **2,364 ESL identities → 3 comprehensives + the 3 small
carve-out families.** This is the flagship packaging pass (`package-esl@bot`).

### P-5 · Units tolerance — PROPOSED

Unit spread alone does not block a merge when (a) the curriculum is
externally standardized (BAR smog, POST, NCCER, NREMT — colleges package the
same training differently), or (b) the credit recommendation will specify
units anyway. Store the modal `typical_units`, preserve the spread, flag
`unit_anomaly` for faculty. A ≥4-unit spread on a *non*-standardized course
is a genuine stop-and-look. **Refined 2026-07-15 (batch 6, Q-UNITS resolved):
on a non-standardized course a ≥ ~4u spread is a WHOLE-vs-PART signal — the
comprehensive course got lumped with its own component labs/modules/skills-
practice. Split the whole from its parts (each part merges with its true peers)
rather than blocking the merge or over-merging whole+part into one row; P-5a's
standardized-academy carve-out is unchanged. See the batch-6 ruling above.**
(→ Q-UNITS)

### P-6 · Same-college groups are variants, not duplicates — RATIFIED (Sam, 2026-07-14; see the 2026-07-14 gate ruling above)

A group whose members all resolve to one college is a variant ladder
(levels, formats, credit/noncredit twins) — never cross-college
corroboration. **Ratified default (Q-SAMECOLL settled):** a same-college
same-competency pair **converges**, and the FORM follows the 2026-07-14 gate
ruling above — **title-drift / both-introductory pairs merge cleanly** (*Intro X*
+ *X* → Printing), while **numbered sequences merge with a parenthetical rung
span when the per-rung unit load is low** (≤ ~1u; *Report Writing 1 + 2* at 0.5u
→ *"…(1 and 2)"*), rungs recorded in `merge_note`. D-4's level-mark guard does
*not* keep the low-unit competency-splits apart. The carve-out is a genuinely
**degree-applicable sequence** (each rung its own credit target — Calculus I/II),
which keeps its rungs per P-3. Longer level ladders still route to the packaging
pass (P-3).

### P-7 · Generic-title families → one umbrella per generic-type × subject — RATIFIED (Sam, 2026-07-14; see the batch-2 ruling above)

"Special Topics in X", "Independent Study", "Work Experience", "Directed
Studies", "Selected Topics", "Topics in X", "Discussion in X" never merge on
title similarity alone — the title carries no per-section identity. **Ratified
(Q-GENERIC settled):** umbrella-mint **ONE identity per (generic-type, subject)**
— a single "Topics in Business", a single "Work Experience in Business", a single
"Independent Study in Art" — with "Advanced"/level variants folded in as
`merge_note`. The **discipline + generic-type pairing IS the second signal** this
rule always demanded; the umbrella is the CPL-facing target. Do NOT leave them as
per-section standalones, and do NOT merge two *different* generic types together.

### P-8 · CTE / credential-aligned courses bias to merge — PROPOSED

The CPL payoff concentrates where credentials articulate: a cert mapped at
24 colleges under 24 M-IDs (the CompTIA A+ case) is the system's failure
mode. Where an exhibit/credential alignment exists on any member, bias
strongly toward convergence so the credit recommendation lands on ONE common
course. Transfer-sequence academic courses get the opposite bias: precision
over concision (their identity work belongs to C-ID/CCN anyway).

### P-11 · Activity doctrine (Kinesiology · Dance · Music) — Q-TARGETCOUNT FULLY SETTLED (KINE 2026-07-03; Dance/Music 2026-07-14)

Sam's five KINE sittings draw one consistent line — **athletics vs general**:

- **General fitness/conditioning consolidates modality-agnostically.** All
  fitness-first courses — Individual/Cardio/Core/Body Conditioning, Bootcamp
  Fitness, Walk/Run, Fitness-through-Dance, Cardiovascular Fitness,
  Swimming-for-Fitness, Hydro HIIT — merge into **Conditioning Beginning /
  Intermediate / Advanced**, "regardless of the sport as long as it's not an
  intercollegiate or athletic" course.
- **Sport-specific stays per-sport.** Athletic conditioning splits per sport
  ("we'll probably need to keep the different athletic courses separate …
  since they are sports specific"); sport skill ladders get one row per
  activity per band (Volleyball Beginning/Intermediate/Advanced).
- **The title's PRIMARY FRAME decides the boundary**: "Swimming for Fitness"
  is a fitness course → Conditioning; "Individual Swim Conditioning" is a
  swim course → the sport. Fitness-first → Conditioning; sport-first → sport.
- **Venue/format marks fold**: indoor/outdoor not differentiated for CPL
  ("Volleyball Advanced", not "Outdoor Volleyball Advanced").
- **Combination-level courses (Sam's precedents, flagged "a tough one")**:
  Intermediate–Advanced combo → Advanced; Beginning–Intermediate combo →
  Beginning.
- **Synonym ruling**: Sports Medicine "Experience" ≡ "Clinical" (one course
  family; letters A/B/C/D ↔ numbers; unified name "Sports Medicine
  Clinical N"). Add to the synonym map.

**Dance — Q-TARGETCOUNT settled (Sam, 2026-07-14).** Dance did NOT follow the
KINE per-sport shape. **All dance-technique STYLES consolidate into ONE "Dance
Technique — Beginning / Intermediate / Advanced"** ladder (Hip Hop, Ballet, Jazz,
Tap, Modern, Ballroom, Contemporary all fold in). **The reason is PERMUTATION
VOLUME, not skill-equivalence (Sam, 2026-07-14):** *"the only reason I'm merging
the dance is because they have so many permutations vs. the others which are more
standard."* Dance explodes across style × level × format, so granularity is
unmanageable and low-value → consolidate. This is the **permutation-pressure
lever** (below), NOT a claim that Ballet ≡ Hip Hop. The exception is
**ensembles/companies**, which stay per-type (below).

**Music — Q-TARGETCOUNT settled (Sam, 2026-07-14).** Music DID follow the
per-sport shape at the instrument level: **applied/instrument study stays
PER-INSTRUMENT** — Piano B/I/A, Guitar B/I/A, Voice B/I/A, etc. (each instrument
a distinct skill, like a distinct sport). Music **Theory** and Music **History**
are transfer-academic sequences (a C-ID per rung) → keep their rungs per the
per-rung-official-identity exception, NOT the 3-rung cap.

**Ensembles/performance groups (Music AND Dance) — per-ensemble-type (Sam,
2026-07-14).** Repeatable performance ensembles stay their own identities by
type: Concert Choir, Chamber Singers, Orchestra, Symphonic/Concert Band, Jazz
Ensemble, Concert Dance Ensemble, Dance Company — the direct analog of KINE
keeping intercollegiate athletics per-sport. Do NOT consolidate ensembles into a
generic "Vocal/Instrumental/Dance Ensemble."

The through-line across all three activity disciplines: **a genuinely distinct
performed skill stays its own target (per-sport, per-instrument, per-ensemble);
general skill-building consolidates to a 3-band ladder** (Conditioning for KINE,
Dance Technique for Dance) with modality/venue folded.

**The permutation-pressure lever (Sam, 2026-07-14).** There is a *second* reason
to consolidate beyond skill-equivalence: **when a sub-category's permutations
explode unmanageably (style × level × format), collapse them even if the
sub-skills are genuinely distinct** — the granularity is low-value for CPL and
the count is the problem. Dance styles fold for THIS reason (Sam: too many
permutations), while Music instruments stay per-instrument because they're "more
standard" (bounded permutations). Use the lever sparingly and name it in the
`merge_note`: a permutation-driven consolidation is an explicit curator call, not
a claim the members teach the same thing. (Screening signal: a discipline sub-tree
with dozens of style/modality crosses at every level is a candidate; a bounded set
like piano/guitar/voice is not.)

### P-12 · Homonym test — evidence over TOP — ESTABLISHED (Sam, 2026-07-12)

A string-identical title can span genuinely different fields ("Electrical
Fundamentals": construction vs. automotive; "Blueprint Reading" across 13
subjects). **TOP code is a WEAK signal — colleges frequently mis-enter it** —
so a TOP-division divergence (`member_top_divergence`) **SURFACES** a homonym
for review; it does **not decide** one. The reliable evidence, in order:

1. **Title** · 2. **Course/catalog description** · 3. **Aligned exhibit /
   credential** (a shared C-ID or exhibit target is the strongest tie) ·
4. TOP code — **used only to tip the scales when 1–3 are inconclusive.**

Decision: **split** a homonym only when title + description + exhibit evidence
shows genuinely different courses; hard credential/articulation evidence that
ties the members **overrides** a TOP-division split. **Never split on TOP
divergence alone.** (Implication: the ~100 wave `split_candidate`s driven mainly
by `member_top_divergence` must be re-checked against title/description/exhibit
before they fire — TOP alone no longer justifies the split.)

### P-13 · Variant-type folding (the D-4 family) — RATIFIED (Sam, 2026-07-15; Q-HONORS + Q-VARIANT settled)

The D-4 guard suite gates the variant-type marks (Honors / Lab / Refresher /
Recertification / Bridge / Instructor / Supervisor / Cross-listed) at strict
equality — it filters what is *suggested*. This rule governs what a curator
*confirms* for the CPL-facing identity.

- **Honors — RATIFIED (settles Q-HONORS).** An **Honors variant of a base
  course folds INTO the base** (same competencies; the honors mark is a
  GPA/enrollment artifact, recorded in `merge_note`). A **standalone
  honors-program course with no base** (*Honors Colloquium / Forum / Seminar*)
  stays its own identity — there is no base to fold into. Never collapse the
  standalone honors courses into a generic umbrella. (See the batch-6 ruling.)
- **Lab / Refresher / Bridge — RATIFIED (Sam, 2026-07-15; settles Q-VARIANT).**
  Each D-4 variant resolves on its OWN logic — there is no blanket honors-style
  fold across the family:
  - **Lab.** Lecture / Lab / Lecture-Lab of the SAME course are **ONE identity**
    (the combined course is the face); lecture-only and lab-only are packaging
    forms recorded in `merge_note`. A student with the competency wouldn't repeat
    any form. **Exception:** a lab carrying its **own official C-ID/transfer
    identity** stays separate (D-1). (Cases: *Introductory Biology* Lecture + Lab
    (1u) + Lecture/Lab (4u) → one; *Marine Biology* Laboratory + Non-Laboratory +
    Introduction → one.)
  - **Refresher / Recertification / Renewal.** A refresher is **its own identity,
    distinct from the full base course** — a 2u "EMT Refresher" is NOT the 6–9u
    "EMT" course, so folding it in would over-grant credit (the **whole-vs-part**
    logic of the P-5 refinement, applied to a variant mark instead of a unit
    spread). Refresher-variants merge with **each other** → one "EMT Refresher",
    kept separate from the base.
  - **Bridge / Transition.** A bridge teaches the **gap** between two
    levels/programs (LVN→RN; *Transition to Professional Practice*) — it is a
    **distinct real course**, kept as its own identity, never folded into a base
    or a destination program. Singular/plural or wording **drift of the SAME
    bridge** (*Transition* ≡ *Transitions to Professional Practice*) merges as
    ordinary title-drift (P-1).
  - **Cross-listed.** Not a title-borne mark in the worklist (0 groups) —
    handled by the identity layer, not this rule.

  **Through-line:** the D-4 marks do NOT share one fold rule. Honors (a
  GPA/enrollment artifact) and Lab (a delivery split of one course) **fold** to
  the base/combined identity; Refresher (a shorter update — a *part*) and Bridge
  (a distinct gap course) **stay separate**. The test is always P-1: would the
  student repeat it? Honors/Lab — no (fold); Refresher/Bridge — the base and the
  variant are different learning/scope (keep).

### P-10 · Unified-title naming — PROPOSED

Student-facing plain names: Title Case; no college-isms, section letters,
"(formerly …)", mojibake, or funding parentheticals; spelled-out level words
("Beginning", not "Beg" or "I"); the deterministic normalizer
(`kb/_normalize_common_titles.py`) is the base, curator override wins.
Package mints name the band, not the rungs: "Beginning ESL", "Intermediate
Welding". (→ Q-MINTNAME) **Mind-meld addendum (2026-07-03/10): names are
modality- and venue-agnostic for CPL** — "Volleyball Advanced" (not
"Advanced Outdoor Volleyball"), "Conditioning Advanced" (not "Advanced
Hydro HIIT"); Sam renamed both live.

**Level-descriptor convention — TEXT bands everywhere EXCEPT Foreign Languages
(Sam, 2026-07-14).** Leveled unified titles use spelled-out **text** rung words
(*Beginning / Intermediate / Advanced X*) — the default. The **sole exception is
Foreign Language courses, which use NUMERIC rungs** (*Spanish 1 / 2 / 3*,
*French 1 / 2*) per the field's historical convention. And **drop the redundant
level word** colleges historically prefix onto the numbered title: *"Beginning
Spanish 2"* → **"Spanish 2"** (the number already carries the level). This holds
because FL transfer sequences are the **degree-applicable keep-the-rungs case**
(P-3 boundary already cites *Spanish 1/2/3*): each numeric rung is a distinct
transfer credit target (typically its own C-ID, e.g. SPAN 100/110/200/210), so
per D-1 the rungs never collapse — the 3-rung cap does NOT apply to them. (The
3-rung cap governs ladders WITHOUT a per-rung official/transfer identity — ESL,
studio art; FL keeps every numeric rung.)

---

## Part IV — Open questions (the interview instrument)

The paired, worklist-surfaceable versions live in
`kb/doctrine_questions.json`; answers arrive as voice notes in
`merge_doctrine_notes` and get distilled back into Parts I–III at each
checkpoint. Current forks:

| id | Fork | Doctrine it settles |
|---|---|---|
| Q-LADDER | **Settled 2026-07-14 → the 3-RUNG CAP.** No unified ladder exceeds 3 rungs; >3 rungs consolidate by pairing (1,2)(3,4)(5,6+), incl. degree-applicable creative ladders. Academic sequences already ≤3 (Calc I/II) keep their rungs. (Earlier: P-3 ESL band mapping, 2026-07-10.) | P-3 |
| Q-STRANDS | **RESOLVED 2026-07-14 (Sam):** NO strand survives — ESL collapses to 3 comprehensives (Beginning/Intermediate/Advanced), all strands + content-for-ESL courses bundled in by level (P-4 ratified). Carve-outs: transfer-level ESL, ESL Citizenship, VESL. | P-4 |
| Q-UNITS | **RESOLVED 2026-07-15 (Sam):** a large unit spread on a NON-standardized course is a WHOLE-vs-PART signal, not a merge threshold — split the comprehensive course from its parts (modules/labs/skills-practice); each part merges with its true peers. Standardized academies (POST/Fire/EMT) still merge despite spread (P-5a). | P-5 |
| Q-SAMECOLL | **RESOLVED 2026-07-14 (Sam):** same-college same-competency pairs converge (P-6 ratified) — title-drift/both-intro → clean merge; low-unit (≤1u) numbered sequences → parenthetical merge "(1 and 2)"; D-4's level guard yields. Degree-applicable sequences keep their rungs (P-3). | P-6 |
| Q-GENERIC | **RESOLVED 2026-07-14 (Sam):** umbrella-mint ONE identity per (generic-type × subject) — "Topics in Business", "Work Experience in Business", … — variants folded in (P-7 ratified). | P-7 |
| Q-HONORS | **RESOLVED 2026-07-15 (Sam):** an Honors variant of a base course FOLDS into the base (same competencies; honors = GPA/enrollment mark, `merge_note`); standalone honors-program courses (Colloquium/Forum/Seminar — no base) keep their identity (P-13). | D-4/P-13 |
| Q-VARIANT | **RESOLVED 2026-07-15 (Sam):** the D-4 marks don't share one rule — **Lab** (Lecture/Lab/Lecture-Lab → ONE identity, own-C-ID labs excepted) and **Honors** FOLD; **Refresher** (own identity, distinct from the full base — whole-vs-part; refresher-variants merge with each other) and **Bridge** (distinct gap course; drift-variants merge) stay SEPARATE. (P-13.) | D-4/P-13 |
| Q-CREDITNC | ~~Credit + noncredit twins of one course: separate targets forever, or noncredit folds under the credit target with a band note?~~ **RESOLVED 2026-07-12 (Sam):** a same-college CR/NC *mirror* is the SAME course — a CPL mechanism (free NC section, voc-MQ instructor, Credit-by-Exam bridge). The NC mirror folds under the credit survivor with a band note; NOT a D-3 split. See the D-3 mirror carve-out. | D-3 |
| Q-XDISC | **RESOLVED 2026-07-15 (Sam):** same-subject-code cross-discipline groups merge to the canonical SUBJ4 discipline (D-8, pick in `merge_note`); different-subject-code title collisions run the P-12 homonym check first. | D-8/P-9 |
| Q-TARGETCOUNT | **FULLY SETTLED → P-11.** KINE (2026-07-10): athletics-vs-general, per-sport rows, modality-agnostic conditioning. Dance/Music (2026-07-14): Dance styles → ONE 'Dance Technique' B/I/A; Music applied → per-instrument B/I/A; ensembles (both) → per-type; Music Theory/History keep transfer rungs. | P-11 |
| Q-MINTNAME | Naming for packages: "Beginning ESL" clean, or "ESL — Beginning (Levels 1–2)" explicit? | P-10 |
| Q-FLOOR | What is *never* a CPL credit target? Recreational PE? **Bounded 2026-07-14 (Sam):** enrichment/noncredit framing ALONE does not lower a course below the floor — if it teaches the SAME learning as a credit course it MERGES (learning-equivalence). The floor is for content with NO credit-equivalent learning. P-1b splits only when the skills/breadth genuinely differ (not merely the audience). | P-2 |

---

## Part V — How the doctrine is applied at scale

1. **Calibration first.** A stratified sample of worklist groups is
   pre-decided by AI against this doctrine, with cited rules + confidence
   (`kb/_doctrine_calibration_sample.py` → `kb/doctrine_out/<date>/`). Sam
   reviews — voice-first in the worklist's 🧠 Mind-meld panel — and every
   disagreement becomes a rule edit or a settled question.
2. **Agreement gate — PASSED 2026-07-14.** A blind v0.6 re-decision reproduced
   Sam's ratified calls **92% fundamental / 94.7% fine** once his two gate
   rulings (P-6, P-1b above) resolved the divergent groups; the CR/NC mirror
   merge works blind. Every fine-miss was a case where v0.6 applied doctrine
   that postdates the seed — the doctrine is ahead of the stale seed, not wrong.
   The doctrine has **graduated (v0.7)** and the batch pass is authorized. A
   fresh held-out sample (`kb/doctrine_out/2026-07-14/calibration_review_v06.md`)
   is staged for Sam's optional confirm marks — the generalization check — but
   the gate is cleared. Receipt: `kb/doctrine_out/2026-07-14/v06_gate_measurement.md`.
3. **Batch pass (the pass-1 pattern, extended).** Dry-run planner over all
   lanes → committed plan + report → Sam skims → apply in one cron window,
   cohort-stamped, ON CONFLICT DO NOTHING. Level-band packaging runs as its
   own explicitly-scoped pass (P-3/P-4 receipts), never mixed into
   same-course merges.
4. **Faculty validation** uses the existing §11 machinery (trust scores,
   Verify, the readiness tiers) — the doctrine (via `docs/ccr_rules_brief.md`)
   is the brief faculty react to.
