---
title: "CCR Merge/Mint Doctrine — the decision policy for course convergence"
created: 2026-07-03
version: "0.2 (first mind-meld distillation — 8 voice notes of 2026-07-03, distilled 2026-07-10)"
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

### P-1 · CPL utility is the organizing principle — PROPOSED

The CCR catalog exists so that faculty workgroups aligning certification /
training / military skills to course outcomes can pick a credit
recommendation by **common course name** instead of 116 local names. Every
merge/mint question is therefore:

> *"Would a faculty workgroup mapping a credential treat these as ONE credit
> target?"*

— **not** *"are these catalog entries textually identical?"* Two courses with
drifted titles but the same credit outcome are one CCR row. Two courses with
identical titles but different credit outcomes (level, band,
degree-applicability) are two rows. Catalog fidelity is the *evidence*; credit
equivalence is the *question*.

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

### D-3 · Band purity — ESTABLISHED

Credit (`M1xxx`) and noncredit (`M9xxx`) identities never merge across the
band in a *same-course* merge. (A deliberate level-band **package** that
spans funding types is a different operation — P-4 — and must be explicit,
never an auto-merge side effect.)

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
discipline deliberately.

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

### P-4 · Skill strands fold into the band — PROPOSED

Within a packaged family, parallel skill strands (ESL Reading / Writing /
Grammar / Conversation at level N) fold into the band package too, unless a
strand is independently a credit target (e.g. a credit "ESL Writing for
College" that satisfies a requirement). Sam's instinct, verbatim: *"converge
packages of these into Beginning, Intermediate, Advanced ESL."* (→ Q-STRANDS)

### P-5 · Units tolerance — PROPOSED

Unit spread alone does not block a merge when (a) the curriculum is
externally standardized (BAR smog, POST, NCCER, NREMT — colleges package the
same training differently), or (b) the credit recommendation will specify
units anyway. Store the modal `typical_units`, preserve the spread, flag
`unit_anomaly` for faculty. A ≥4-unit spread on a *non*-standardized course
is a genuine stop-and-look. (→ Q-UNITS)

### P-6 · Same-college groups are variants, not duplicates — PROPOSED

A group whose members all resolve to one college is a variant ladder
(levels, formats, credit/noncredit twins) — never cross-college
corroboration. Default: leave to the packaging pass (P-3) or keep as-is;
do not merge as "duplicates." (→ Q-SAMECOLL)

### P-7 · Generic-title families need a second signal — PROPOSED

"Special Topics in X", "Independent Study", "Work Experience", "Directed
Studies", "Selected Topics" never merge on title similarity alone — the title
carries no course identity. Options under consideration: per-discipline
umbrella mints (one "Occupational Work Experience — Automotive" statewide) vs
leaving them standalone and out of the CPL-facing tier. (→ Q-GENERIC)

### P-8 · CTE / credential-aligned courses bias to merge — PROPOSED

The CPL payoff concentrates where credentials articulate: a cert mapped at
24 colleges under 24 M-IDs (the CompTIA A+ case) is the system's failure
mode. Where an exhibit/credential alignment exists on any member, bias
strongly toward convergence so the credit recommendation lands on ONE common
course. Transfer-sequence academic courses get the opposite bias: precision
over concision (their identity work belongs to C-ID/CCN anyway).

### P-11 · Kinesiology activity doctrine — PROPOSED (distilled from the 2026-07-03 mind-meld; settles Q-TARGETCOUNT for KINE)

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

Dance/Music activity ladders: presumed to follow the same shape but NOT yet
sat — Q-TARGETCOUNT remains open for those two.

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

---

## Part IV — Open questions (the interview instrument)

The paired, worklist-surfaceable versions live in
`kb/doctrine_questions.json`; answers arrive as voice notes in
`merge_doctrine_notes` and get distilled back into Parts I–III at each
checkpoint. Current forks:

| id | Fork | Doctrine it settles |
|---|---|---|
| Q-LADDER | **Partially settled 2026-07-10** (P-3 ratified with the ESL band mapping; sub-bands allowed). Remaining fork: the exact package-vs-rungs TEST WORDING (degree-applicability vs credit status vs transferability) for edge families. | P-3 |
| Q-STRANDS | Do skill strands ever survive packaging (ESL Writing as its own target)? | P-4 |
| Q-UNITS | How much unit spread stops a merge on a non-standardized course? | P-5 |
| Q-SAMECOLL | Is there ANY same-college pair you'd merge outright (catalog editions? renumberings?) | P-6 |
| Q-GENERIC | Work Experience / Special Topics / Independent Study: umbrella-mint per discipline, or exclude from the CPL tier? | P-7 |
| Q-HONORS | For CPL purposes, does an Honors variant fold under the base course (the credit rec ignores honors) or stay distinct? | D-4/P-3 |
| Q-CREDITNC | Credit + noncredit twins of one course: separate targets forever, or noncredit folds under the credit target with a band note? | D-3/P-3 |
| Q-XDISC | Cross-discipline groups that are really one course tagged inconsistently: merge-and-pick-discipline, or hold for faculty? | D-8/P-9 |
| Q-TARGETCOUNT | **Settled for KINE 2026-07-10 → P-11** (athletics-vs-general split; per-sport rows; modality-agnostic conditioning). Still open for Dance/Music ladders. | P-11 |
| Q-MINTNAME | Naming for packages: "Beginning ESL" clean, or "ESL — Beginning (Levels 1–2)" explicit? | P-10 |
| Q-FLOOR | What is *never* a CPL credit target (and can leave the CPL-facing tier entirely)? Recreational PE? Older-adult noncredit? | P-2 |

---

## Part V — How the doctrine is applied at scale

1. **Calibration first.** A stratified sample of worklist groups is
   pre-decided by AI against this doctrine, with cited rules + confidence
   (`kb/_doctrine_calibration_sample.py` → `kb/doctrine_out/<date>/`). Sam
   reviews — voice-first in the worklist's 🧠 Mind-meld panel — and every
   disagreement becomes a rule edit or a settled question.
2. **Agreement gate.** When a *fresh* held-out sample agrees ≥90% with Sam's
   calls, the doctrine graduates to v1 and the batch pass is authorized.
3. **Batch pass (the pass-1 pattern, extended).** Dry-run planner over all
   lanes → committed plan + report → Sam skims → apply in one cron window,
   cohort-stamped, ON CONFLICT DO NOTHING. Level-band packaging runs as its
   own explicitly-scoped pass (P-3/P-4 receipts), never mixed into
   same-course merges.
4. **Faculty validation** uses the existing §11 machinery (trust scores,
   Verify, the readiness tiers) — the doctrine (via `docs/ccr_rules_brief.md`)
   is the brief faculty react to.
