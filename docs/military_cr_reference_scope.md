---
title: Military (ACE) CR Reference — scope, measured before building
date: 2026-08-14
tags: [cr-reference, ccrr, military, ace, jst, curation, scope]
artifacts:
  - map_college_cr_unit (204,683 rows with a credit_rec — the measured population)
  - chatbox_peer_articulations (the freehand corpus, for contrast)
related:
  - "[[docs/common_cr_reference_scope]]"
  - "[[docs/common_cr_reference_lessons]]"
  - "[[docs/kb-notes/methodology-bucket-military-and-non-military-credit-recommendations]]"
---

# Military (ACE) CR Reference — scope

Sam, 2026-08-13: *"assign a CCRR to each CR in the MAP dataset. The military
ones may be the stickiest."*

Handoff 153 flagged that this lane *"deserves the same scoping-before-building
treatment that made this one come out right."* This document is that pass.
Everything is measured against live Supabase; every figure reproduces from the
SQL noted beside it.

**The headline is that Sam's prediction is right about the lane and wrong about
the mechanism** — and the difference changes what we build.

---

## 1. The lanes, and why `source_code` is the discriminator

`map_college_cr_unit`, rows carrying a non-empty `credit_rec`:

| Lane | Rows | % | Distinct strings | Fits the `<units> in <topic>` shape |
|---|---:|---:|---:|---:|
| `source_code='ACE'` | 200,840 | 98.1% | **10,117** | **100.0%** |
| `source_code='MAP'` | 3,254 | 1.6% | 1,231 | 93.6% |
| `source_code=''` | 589 | 0.3% | 171 | 40.1% |

⚠️ This does **not** contradict *"no military flag exists"* — that finding is
about `map_student_credit.military_credits`, an applied *amount*, zero on 84% of
rows. Different column, different grain. At the **CR grain** `source_code` is a
clean discriminator.

The ACE lane is **~5× the freehand corpus's vocabulary** (10,117 vs 2,344) and
**100% shape-conformant** — every single ACE string parses as
`<units> <unit-word> in <topic>`, against 93.6% for MAP-local.

## 2. The central finding: ACE is already a controlled vocabulary

The freehand lane's problem is that *Racial Issues and the Police* and
*Community Relations* are one POST topic in unrelated words. **The ACE lane does
not have that problem at the wording level**, because ACE publishes the
recommendation and MAP stores it.

Measured directly — group every ACE row by `(exhibit_id, units, normalised
topic)` and count how many distinct raw texts each group holds:

| | |
|---|---:|
| `(exhibit, units, topic)` groups | 24,074 |
| ...holding exactly **one** text | **22,487 (93.4%)** |
| ...holding more than one | 1,587 (6.6%) |
| Worst case | 4 variants |

**93.4% of the lane is already textually canonical.** And the 6.6% residue is
not disagreement about wording — it is case and punctuation:

```
1 hour in marksmanship            ||  1 hour in Marksmanship
...Troubleshooting And Maintenance ||  ...Troubleshooting and Maintenance
1 hour in Personal Community Health || 1 hour in Personal/Community Health
0 hours in Credit Is Not Recommended || 0 hour in Credit Is Not Recommended
```

### Where the noise comes from — not the colleges

Casing is **not** a per-college import artifact. Of 108 colleges with ACE rows:

| Pattern | Colleges | Rows |
|---|---:|---:|
| Never lowercase | 50 | 58,193 |
| **Mixed within the same college** | **58** | 142,647 |
| Always lowercase | **0** | 0 |

No college is uniformly lowercase, and 58 hold both forms. So the variance
travels with the **record**, not the institution — an upstream parse/ingest
artifact, not something 108 colleges each typed differently.

⭐ **Consequence: a meaningful part of this lane is a data-quality fix, not a
curation decision.** That is the opposite posture from the freehand lane.

## 3. The vocabulary decomposes three ways

Separating typographic noise from unit variance from genuine semantic
difference, per lane:

| | ACE | MAP-local |
|---|---:|---:|
| Raw distinct strings | 10,117 | 1,231 |
| Collapse by **typography** (case, punctuation, whitespace) | **767 (7.6%)** | 8 (0.6%) |
| Collapse by **units** (same topic, different amount) | **2,244 (22.2%)** | 99 (8.0%) |
| **Genuinely distinct topics remaining** | **7,106** | 1,124 |

Typographic noise is **13× more prevalent** in the ACE lane proportionally.
That is the fingerprint of a machine-ingested controlled vocabulary that has
been through an inconsistent parser, not of freehand human entry.

⭐ **Units carry 22% of the ACE vocabulary on their own** — and the same ACE
exhibit issues the same topic at different amounts. `AR-2201-0552` recommends
*Orienteering* at **1, 2 and 3 hours**; `AR-2201-0399` recommends *Physical
Fitness* at 1, 2 and 3. So the exhibit ID does **not** pin the unit amount, and
units cannot be part of identity here either — consistent with the ruling
already settled on the freehand lane (`units-are-not-part-of-cr-identity`).

⚠️ **One thing this does NOT settle, and Sam should rule on it** (§7).

## 4. A rung that exists only in this lane: the USMC skill level

Marine Corps JSTs list ACE recommendations under **every skill level**, and
higher levels repeat the lower levels' recommendations (`cpl_memory` row `f8`).
That duplication has **leaked into the recommendation topic text itself**:

```
3 hours in Supervision  ssgt gysgt          234 rows
3 hours in Computer Applications (SSgt, GySgt, MSgt, MGySgt)   302 rows
3 hours in Management  gysgt                265 rows
```

Measured (conservative token list — `ssgt|gysgt|msgt|mgysgt|sgtmaj|1stsgt|mstsgt`,
deliberately excluding the ambiguous `cpl`, `sgt`, `pfc`):

| | |
|---|---:|
| Topics carrying a rank token | **482** |
| Their rows | **12,157** |
| Exhibits · colleges affected | 181 · 94 |
| **Strip the rank → lands on an EXISTING base topic** | **306 topics / 10,550 rows** |
| Strips to something with no twin | 176 |

Verified case by case, not just counted:

| Rank-tagged topic | Rows | Lands on | Rows |
|---|---:|---|---:|
| `ssgt gysgt supervision` | 234 | `supervision` | 4,307 |
| `computer applications ssgt gysgt msgt mgysgt` | 302 | `computer applications` | 3,229 |
| `ssgt gysgt aviation maintenance management` | 314 | `aviation maintenance management` | 294 |
| `gysgt management` | 265 | `management` | 1,632 |

⚠️ **The strip list needs widening before this ships.** The 176 non-landing
cases show two residue classes the naive list mishandles:
`leadership ssgt and above` → `leadership and above` (a dangling qualifier), and
`field experience in management gunnery sergeant gysgt only` (**spelled-out**
ranks). Both are mechanical, but the rule is not finished as written.

⭐ **This merge loses nothing.** The skill level says *which service members
qualify* — it is not part of what the credit is **for**. It belongs as an
attribute of the line, exactly like units. Do not discard it; do not let it
fragment the vocabulary.

## 5. The cascade has nothing to bite on — measured, not asserted

Sam's naming cascade is **CCN > C-ID > M-ID > published line > modal wording**
(`ccrr-naming-cascade-ccn-cid-mid`, verified). The first three rungs need a
course identity. The ACE lane barely has one:

| Lane | Rows | With a `college_course` | % |
|---|---:|---:|---:|
| ACE | 200,840 | 5,262 | **2.6%** |
| MAP-local | 3,255 | 3,060 | **94.0%** |

**2.6% versus 94%.** That is the mechanical proof behind *"ACE recommendations
are subject areas, not courses"* — there is no C-ID for *Supervision*, and the
data agrees.

⭐ **But this does not leave the lane unnamed.** Sam's cascade already ends in
*published line > modal wording*, and for an ACE recommendation **ACE's own
published text IS the published line.** The authority exists; it simply sits at
a different rung. No new ruling is needed here.

The 5,262 ACE rows that *do* carry a course (536 distinct courses) are the
articulated military core — the only place the upper cascade rungs can fire.

### The two lanes do not share a vocabulary

| | |
|---|---:|
| ACE topics | 7,106 |
| Freehand articulated topics | 2,187 |
| **Shared** | **134 (1.9%)** |
| ACE rows those cover | 11,778 (**5.9%**) |

So the Common CR Reference already built covers **5.9%** of the military lane.
This lane needs its own vocabulary — confirmed by measurement, not assumed.

## 6. The ranking rule does NOT transfer — and this is the trap

SkyCall's finding was that ranking by *how widely a string spreads* is
backwards, and **collapse value (wordings × colleges)** is right. In this lane
**collapse value barely discriminates**, because spread is near-constant:

| Population | Colleges (min / avg / max) | Wordings (min / avg / max) |
|---|---|---|
| Top 200 ACE topics by rows | 33 / **78** / 103 | 1 / **4.1** / 13 |
| All ACE topics | 1 / 12 / 103 | 1 / 1.4 / 13 |

Every topic in the head already sits at ~80–100 of 108 colleges, because every
college processing a JST receives the same ACE exhibits. Multiplying by a
near-constant ranks nothing.

⭐ **In this lane the right ranking is by ROWS — the backlog each topic
represents** — because the win is not "collapse many wordings," it is "this
single topic is 4,307 rows of Needs Action."

And the head is far flatter, so the work is genuinely bigger:

| Decisions | ACE lane coverage | (freehand lane, for contrast) |
|---:|---:|---|
| top 25 | 21.5% | — |
| top 50 | 28.4% | **49.4%** |
| top 100 | 37.6% | 58.9% |
| **top 250** | **52.5%** | 69.6% (top 250) |
| top 500 | 65.5% | — |
| top 1000 | 79.1% | — |

**~250 decisions to reach half the military lane, against ~50 for half the
freehand corpus — 5× the work for the same coverage.**

## 7. The judgment that is left, and the algorithm that must not be used

After the mechanical rungs, the real curator question is **cross-topic merges
among ACE subject areas**. Token containment finds the candidates — of 1,608
topics with ≥20 rows, **514 are contained in a broader topic**. But containment
is **suggestion-only**, and one family proves why:

> `management` (1,632 rows) contains `maintenance management` (1,095),
> `operations management` (707), `inventory management` (705),
> `records management` (568), `human resource management` (534),
> `project management` (458), `supply chain management` (280), and 14 more.

**None of those are `management`.** *Project management* is not *management*.
Auto-merging on containment would blob 21 distinct subject areas into one.

Contrast the family where the merge is plausible:

> `supervision` (4,307) · `personnel supervision` (1,399) ·
> `principles of supervision` (1,056) · `introduction to supervision` (342)

That is a genuine curator call — and it is the same shape as the freehand
lane's level screen (`Introduction`/`Principles of`), which already exists.

⚠️ **Same discipline as the freehand lane: pairwise and gated, never
transitive.** Connected components over "shares a token" would chain
`management` ↔ `maintenance management` ↔ `aviation maintenance management` into
a single blob.

## 8. The ladder, and what it predicts

| Rung | Mechanism | Resolves | Judgment? |
|---|---|---:|---|
| **0** | **Not-a-topic** — `Credit Is Not Recommended` (32 strings / 3,892 rows) + `Credit may be granted on the basis of an individualized assessment` (15 / 2,771) | **47 strings / 6,663 rows** | None |
| **1** | Typographic fold (case, punctuation, whitespace) | 767 strings | None |
| **2** | Units are an attribute, not identity | 2,244 strings | None (settled) |
| **3** | USMC skill-level strip, landing on an existing base topic | 306 topics / 10,550 rows | None (list needs widening) |
| **4** | Cross-topic merge (`supervision` family) | ~514 candidates | **Curator — suggestion only** |

Cumulative, non-double-counted:

```
10,117 raw strings
 →  7,106  after typography + units
 →  6,749  after the rank strip
 →  6,725  excluding the not-a-topic class
```

⭐ **33.5% of the ACE vocabulary resolves with no judgment at all — against
~10% in the freehand lane.**

## 9. So: is the military lane the stickiest?

**Sam is right that it is the hardest lane, and right for a reason other than
the one everyone assumes.** Precisely:

- ❌ It is **not** stickier *per string*. Automation reaches **3× further** here
  (33.5% vs ~10%), because ACE is a controlled vocabulary and most of the
  variance is typographic.
- ✅ It **is** stickier in **volume** — 6,725 topics against 2,183, and a much
  flatter head: **250 decisions for half the lane, against 50.**
- ✅ It **is** stickier in **naming** — the CCN/C-ID/M-ID rungs fire on 2.6% of
  rows, so almost every reference is named by ACE's own text rather than by a
  course identity.
- ✅ And it is stickier in **kind**: the residual judgment is *"is `project
  management` the same recommendation as `management`?"* — a question about
  subject-area granularity, with no course to arbitrate it.

⚠️ **The most important consequence is a posture change, not a build change.**
In the freehand lane the answer to bad data was a curation workbench. Here, a
third of the vocabulary is an **ingest defect** (§2 — 58 colleges holding both
casings of the same string, 0 holding only one). **A workbench that asks
curators to hand-merge `3 hours in supervision` into `3 hours in Supervision`
would be asking humans to do a parser's job, 767 times.**

## 10. Open questions for Sam — ALL FOUR ANSWERED 2026-08-14

Sam ruled on all four at the top of session 154. Recorded here so this section
is no longer read as open. `cpl_memory`: `ace-unit-variants-are-one-ccrr`,
`ace-not-a-topic-gets-canonical-crs`, `ace-individualized-assessment-never-granted`.

1. ✅ **ACE unit variants are ONE recommendation**, units displayed as a spread.
   Unblocks rung 2 — 2,244 strings, 22.2% of the vocabulary.
2. ✅ **The typographic class is absorbed downstream** by our fold; the upstream
   MAP-ingest fix stays proposed as `cpl_memory` row `o3` rather than blocking.
3. ✅ **Subject-area granularity is SUGGESTION-ONLY** — pairwise, gated, never
   transitive. The curator's working of the worklist is the answer, family by
   family.
4. ⭐ **The not-a-topic class is CANONICALISED, NOT EXCLUDED** — and this
   CORRECTS §8 rung 0 above, which said "excluding the not-a-topic class."
   Sam: *"We still need a canonicalized CR for it to account for every CR in the
   corpus."* Coverage is the goal.

   Measured 2026-08-14: **43 strings / 6,626 rows**, decomposing into four
   meanings that fold to **THREE canonical CRs**:

   | Class | Strings | Rows | Colleges | Applied EVER |
   |---|---:|---:|---:|---:|
   | ① No credit, flat | 15 | 3,503 | 102 | **0** |
   | ② No credit + a reason | 13 | 356 | 85 | **0** |
   | ③ Individualized assessment | 10 | 2,730 | 95 | **0** |
   | ④ Conditional / prerequisite | 5 | 36 | 24 | **0** |

   → `Credit Is Not Recommended` (① + ②, the reason kept as an ATTRIBUTE) ·
   `Credit May Be Granted by Individualized Assessment` (③) ·
   `Credit Is Not Recommended Until Prerequisite Completed` (④).

   ⚠️ **Class ③ IS NOT A "NO" AND MUST NEVER BE AUTO-N/A'd.** ACE is saying
   credit *may* be granted after review — across 95 colleges — and it has
   **never once been granted anywhere.** Marking it Not Applicable records a
   decision nobody made and closes a door that is genuinely open. Same for ④,
   where the credit exists as soon as the second course is finished. Canonicalise
   all of it; keep ③ and ④ tagged as real pending work.

   The parser fingerprints in this class are worth seeing: the string doubled
   (`Credit Is Not Recommended Credit Is Not Recommended`), date stamps doubled
   (`(6/02)(6/02)`), mojibake (`the service?s education`), a truncated word
   (`skills, compet, and knowledge`), a sentence cut mid-clause (`because of
   the`), and one contradictory `1 hour in Credit Is Not Recommended`.

---

*Measured 2026-08-14 against live Supabase (`map_college_cr_unit`, 204,683 rows
carrying a `credit_rec`). Reproduce with the SQL noted per section.*
