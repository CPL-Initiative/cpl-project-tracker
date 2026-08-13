---
title: Common CR Reference — scope, measured against the CCR's actual matching factors
date: 2026-08-13
tags: [cr-reference, ccr, curation, identity, alignment, scope]
artifacts:
  - chatbox_peer_articulations (9,413 rows — the measured population)
  - chatbox_credential_recs (2,290 credentials / 3,818 lines — the curated spine)
related:
  - "[[docs/ccr_rules_brief]]"
  - "[[docs/local_course_alignment_lessons]]"
  - "[[docs/kb-notes/methodology-use-the-identity-key-before-you-score-strings]]"
  - "[[docs/kb-notes/methodology-top-is-a-last-in-line-signal]]"
---

# Common CR Reference — scope

Sam, 2026-08-13: *"we should have a Common CR Reference just as we have pretty
well developed CER, CSR, and the beginnings of a CCR."* And the design ruling
that governs everything below:

> *"CID is only one factor in determining common CR references. Similar to the
> CCR, we take into account matching factors like title, course name and number,
> course description, subject, etc."*

This document does what he asked for next: **scope it against the CCR's actual
matching factors before building.** Everything here is measured, not assumed.
Every number reproduces from the SQL noted beside it.

---

## 1. What a credit recommendation actually looks like

A `credit_rec` is not free prose. It has a **stable two-part shape**:

```
<units-expression> <unit-word> in <topic>
        3 hours    in    Criminal Investigation
        3-4 hours  in    Introduction to Flux Cored Arc Welding (FCAW)
        7.5-14 hours in  Emergency Medical Technician (EMT)
```

**2,323 of 2,344 distinct strings (99.1%) fit that shape** on a strict regex.
The 21 that miss are all **range units** (`3-4 hours`, `3 or 4 hours`,
`3 to 4 hours`, `3 - 4 hour in`) — a units-parsing variant, not a different
shape. **With range parsing, the shape holds at 100%.**

So the vocabulary decomposes cleanly into a **units expression** (mechanical)
and a **topic** (the freehand part that needs curation). The tail of the topic
field carries exactly the freehand-typo class the CER dealt with —
`Advance Flux Cored Arc Weliding (FCAW)`, `Advanced to Gas Tungsten Arc
Welding`, `3-4 hour in`.

## 2. Mechanical normalisation is nearly worthless here — this is curation

The single most important measurement in this document:

| Step | Distinct strings |
|---|---|
| Raw `credit_rec` | **2,344** |
| Topic + raw units expression | 2,312 (−1.4%) |
| **Topic only, aggressively normalised** — units *discarded entirely*, lowercased, punctuation stripped, `Intro`→`Introduction`, `Advance`→`Advanced`, whitespace collapsed | **2,183 (−6.9%)** |

Throwing the units away completely and folding the two commonest word variants
still collapses under 7%. **The vocabulary is genuinely ~2,183 distinct
topics.** There is no string-cleaning pass that solves this, which is precisely
the CER's situation and precisely why Sam framed it as a *reference* rather
than a normaliser.

⚠️ Do not re-litigate this by trying a better normaliser. The reason the
collapse is small is not a weak regex — it is that `Racial Issues and the
Police`, `Community and the Justice System` and `Community Relations` are the
same POST topic in three unrelated sets of words. **No string metric reaches
that. A reference does.**

## 3. The strongest available factor is one nobody named: the CCR itself

Sam's list — title, course name and number, course description, subject — is
*illustrative*, and the measurement turned up a factor stronger than all of
them, which is also the one most faithful to *"similar to the CCR"*:

**Every peer articulation already resolves its local course to a CCR row.**
`chatbox_peer_articulations` carries `course_id` and `identity_system` on
**9,413 of 9,413 rows** (5,399 C-ID, 4,014 M-ID). The CCR has already decided,
multi-factor and curator-reviewed, which local courses are the same course.

That answer transfers to recommendations because **a credit recommendation
names a course-shaped thing.** And it is decisive where strings are hopeless:

| CCR row | Wordings it folds together |
|---|---|
| `HIST 130` | *History of the United States to 1877* · *The United States to 1877* · *United States History* · *United States History through 1877* · *United States History To 1876* · *United States History, 1550-1877* |
| `HIST 160` | *World Civilization From the 16th Century* · *World Civilizations II* · *World History 2* · *World History from 1500 to Present* · *World History Since 1500* |
| `SPAN 100` | *Elementary Spanish I* · *Spanish I* · *BEGINNING SPANISH I* · *Elementary Spanish 1* — **at 4, 4.5 and 5 units** |

No title metric merges *"The United States to 1877"* with *"United States
History, 1550-1877"*. The identity key does it instantly.

⭐ **`SPAN 100` also settles a design question: units are NOT part of identity.**
The same recommendation is written at 4, 4.5 and 5 units by different colleges.
Units are an **attribute of the line**, not part of the reference — exactly as
the CCR treats units (a property of the row, and a *screen* on the twin merge,
never the identity).

### But it is a corroborator, not a key — and the data says so twice

**First: it barely collapses anything on its own.** 2,180 of 2,344 rec strings
(93%) reach exactly **one** CCR course identity, and 1,874 of 2,183 courses
serve exactly **one** rec string. That near-1:1 makes course identity mostly a
*relabelling*. All the collapse lives in the **309 courses that serve ≥2
wordings**.

**Second: where it does collapse, it sometimes over-merges.** `AJ 110`
(*Introduction to Criminal Justice*) absorbs ten wordings — including
**`3 hours in Physical Training and Health Education (CSU GE Area E)`** and
**`3 hours in Community Relations`**, which also sits under `AJ 160` where it
belongs. Physical Training is emphatically not Introduction to Administration
of Justice.

This is the same `AJ 110` repeat Sam ruled must be **FLAGGED, never
auto-resolved** — and it is the empirical proof of his ruling. C-ID as key
fails in both directions: it under-merges (only ~17% of rec strings resolve to
an official C-ID at all) *and* it over-merges (this).

### Why it over-merges, and the gate that fixes it

The signature is in the row counts. Under `AJ 110`, nine of the ten wordings
carry **137–142 rows / 18 colleges** — near-identical. That is one articulation
paired with *every* line of the credential: a cartesian product at credential
grain.

⚠️ **`attribution = 'per_course'` does NOT protect against this.** Every one of
those `AJ 110` rows is labelled `per_course`. The column is more optimistic
than reality, which matches the standing memory row
(`peer-attribution-is-per-course-57-percent`: 43% of multi-course articulations
repeat one identical college set onto every course). **Do not use
`attribution` as the gate — it will pass the exact case it looks like it
catches.**

The gate that *does* work is computable. For each (credential, course), measure
what fraction of that credential's rec lines the course pairs with:

| Pairing | Course↔credential pairs |
|---|---|
| Pairs with exactly **1** line — strong evidence | **1,681** |
| Credential has only 1 line — uninformative by construction | 1,249 |
| Pairs with a **subset** — partial evidence | 180 |
| **Pairs with ALL lines — cartesian, no evidence** | **43** |

**Only 43 pairs are cartesian.** The problem is small, identifiable and
excludable — course identity survives as a corroborator behind that gate.

### And the algorithm is not connected components

**164 rec strings bridge ≥2 course identities.** `3 hours in Community
Relations` alone touches `AJ 160`, `AJ 110`, `CRIM M1120`, `CRIM M1302` and
`CRIM M1067`. Taking connected components over "shares a course identity"
would chain `AJ 110` ↔ `Community Relations` ↔ `AJ 160` and blob Intro to AJ,
Community Relations and Physical Training into one reference. **Merges must be
pairwise and gated, never transitive.**

## 4. The curated spine that already exists

`chatbox_credential_recs` is the authoritative rung and it is thinner than it
looks:

| Kind | Credentials | Lines | Lines carrying a C-ID |
|---|---|---|---|
| `statewide_authoritative` | 134 | 351 | **36 (10%)** |
| `local_modal` | 2,156 | 3,467 | **0** |

So even in the *curated statewide* layer only one line in ten names a C-ID.
C-ID coverage is thin from every direction measured — which is the third
independent confirmation of Sam's ruling.

## 5. Proposed ladder — the CCR's rules, transposed

[`docs/ccr_rules_brief.md`](ccr_rules_brief.md) states the CCR contract:
strongest evidence first, title similarity **never** merges automatically, and
exactly one title-based auto-step (the twin merge) that is deliberately the
strictest rule in the system. Transposed to recommendations:

| Rung | Evidence | Acts automatically? |
|---|---|---|
| **1** | **The published set says so.** A line in `statewide_authoritative` — MAP's own curated recommendation, already public on the Fact Sheet. | Yes — it is the authority |
| **2** | **The exhibit names a C-ID** and a second factor agrees (subject or CCR course identity). Two-signals-agree, per Rule 7's posture. | Yes |
| **3** | **CCR course identity agrees**, the pairing is *not* cartesian (§3 gate), *and* subject agrees. | Yes |
| **4** | **Twin merge** — same word set after normalisation (order, punctuation, `&`/`and`, Roman/Arabic, `Intro`/`Introduction` aside), same subject, and no safety screen objects (level, Honors/Lab variant, sport, gender). | Yes — strictest rule, mirrors the CCR twin merge exactly |
| **5** | Title similarity · description similarity · issuer · units agreement | **Suggestion only — never merges** |

**Units are never a merge criterion** (§3, `SPAN 100`) but they *are* a safety
**screen** on rung 4, exactly as in the CCR twin merge: differing units hold
the pair as a suggestion.

Safety screens carry over verbatim from the CCR because they earned themselves
there: course **level** (`Introduction`/`Advanced` — visible in this data as
`Introduction to FCAW` vs `Advanced FCAW`), **Honors** variants (`ENGL 100`
absorbs *4 hours in Academic Reading and Writing - Honors* and *5 hours in
Intensive Reading, Writing, and Reasoning for English Language Learners*, both
of which must be held), sport, and gender.

## 6. What this predicts

Rungs 1–4 are expected to resolve a **minority** of the 2,344, and that is the
honest headline, not a disappointment: rung 3's whole reachable population is
the 309 multi-wording courses minus the 43 cartesian pairs, and rung 4 is the
~7% mechanical collapse. **The remainder is curator work by design** — which is
the finding, and the reason this is a *reference* with a worklist rather than a
build script.

The CER is the precedent for that shape: a canonical layer plus a human queue,
not an algorithm that finishes.

## 7. Open questions for Sam

1. **Is the CCR course identity an accepted factor?** It is the strongest
   signal measured and it is the most literal reading of *"similar to the
   CCR"* — but he named title/number/description/subject, not this.
2. **Is the reference global or per-credential?** 1,937 of 2,344 strings (83%)
   appear under exactly one credential, so per-credential is nearly free; but
   the top strings span up to 61 credentials, and those are where the value is.
3. **Do units belong in the identity?** Measured recommendation: no (§3), with
   units as a screen and a displayed attribute.
4. **Which remaining factors to add?** Course description is available via
   `chatbox_college_courses`/COCI but is a rung-5 suggestion signal at best —
   the CCR treats description similarity as suggestion-only too.

---

*Measured 2026-08-13 against live Supabase. Reproduce with the SQL noted per
section; all figures are from `chatbox_peer_articulations` (9,413 rows) and
`chatbox_credential_recs` unless stated.*
