---
title: Noncredit CIP categories — scope, and the pathway that does not need the TOP
date: 2026-08-14
tags: [cip, noncredit, cdcp, top-to-cip, coci, curation, scope, cte]
artifacts:
  - tmc/source_data/coci_program_export_2026-06-17.csv (3,187 noncredit programs / 108 colleges)
  - cip_crosswalk_data.js (CIP-2020 + certified CTE designations, 2026-07-15 cut)
  - CCCCO "TOP to CIP Noncredit Mapping" page, updated 2026-05-26 (the authority)
related:
  - "[[docs/cip_crosswalk_lessons]]"
  - "[[docs/kb-notes/methodology-top-is-a-last-in-line-signal]]"
  - "[[docs/kb-notes/methodology-validate-a-code-column-by-its-structural-invariant]]"
  - "[[docs/common_cr_reference_scope]]"
---

# Noncredit CIP categories — scope

**The question Sam asked:** *"can we determine what the correct TOP should be so we can crosswalk
the CIPs correctly … to determine if NC CIP is CTE?"*

**The answer this scope is built on: we do not need to.** For 90% of noncredit programs there is
already a CIP on the COCI record that carries more information than the TOP does, and where the TOP
matters at all it is corroborated 99.6% of the time. The pathway routes around a wrong TOP rather
than repairing it.

---

## 1. Authority, and one correction

The authority is the CCCCO **"TOP to CIP Noncredit Mapping"** page, updated **2026-05-26**. Its own
framing matters and should survive into the UI: the codes *"serve as **examples** … and can be used
by colleges to identify the most appropriate CIP code that aligns with an existing TOP code."*
Examples, not a locked mapping — which is the whole reason the college is the decider here.

⚠️ **Jenni's Teams relay of the Basic Skills row has its labels shifted by one, and the shift is
silent.** She merged `32.0101 + 32.0104` onto the first line, which moved every pair after it:

| Label | Published page ✅ | Teams relay ❌ | What that code actually is |
|---|---|---|---|
| Developmental/Remedial **Math** | `32.0104` | `32.0105` | 32.0105 = Job-Seeking/Changing Skills |
| **Job-seeking**/changing skills | `32.0105` | `32.0108` | 32.0108 = Developmental/Remedial English |
| Developmental/Remedial **English** | `32.0108` | `32.0110` | 32.0110 = Basic Computer Skills |
| **Basic Computer** Skills | `32.0110` | `32.0201` | 32.0201 = Exam Prep & Test-Taking |

Verified against the CO's certified CIP catalog in `cip_crosswalk_data.js`; the published page agrees
with the catalog on all seven pairs. This is the same failure shape as the MIS `LocationID` column in
the college-identity work — **plausible codes on the wrong rows, invisible to spot-checking, caught
only by checking every pair against an independent authority.**

**Build encodes the published page.** Where a relayed message and the page disagree, the page wins,
and the disagreement gets recorded rather than silently resolved. Two smaller relay differences,
same treatment: Immigrant Education is `33.0101 – 33.0199` on the page (relay said `33.0109`), and
Health & Safety includes `34.0104` on the page (relay omitted it).

**Not on the page at all — Jenni's addition, and the mechanism this whole design rests on:**

> Short-Term Vocational (CDCP): Skills-based training for jobs (32.0111) **plus a secondary credit
> CIP code aligning with the program subject matter**

and the CTE rule from the same conversation:

> if all correct criteria are met AND the secondary CIP code is a CTE course AND the CIP is 32.0111,
> the rule could be that NC CIP is CTE

Neither sentence is published yet. **Flag in the UI as CO guidance ahead of publication**, not as
something a college can point to.

---

## 2. The ten categories (as published)

| Category | CDCP | Primary CIP |
|---|---|---|
| Short-Term Vocational | ✅ | `32.0111` **+ a secondary credit CIP** |
| Workforce Preparation | ✅ | `32.0107` |
| ESL | ✅ | `32.0109`, `32.0112` (rare) |
| Elementary & Secondary Basic Skills | ✅ | `53.xxxx`, `32.0101`, `32.0104`, `32.0105`, `32.0108`, `32.0110`, `32.0201` |
| Immigrant Education / Citizenship | — | `33.0101 – 33.0199` |
| Health and Safety | — | `34.0102`, `34.0103`, `34.0104`, `34.0105` |
| Parenting | — | `34.0102`, `34.0103`, `34.0104`, `34.0105` |
| Home Economics | — | `36.01xx`, `36.0105`, `36.0112`, `36.0123` |
| Substantial Disabilities | — | any noncredit CIP (+ credit `13.10` may apply) |
| Courses for Older Adults | — | any noncredit CIP |

Two structural facts the build must respect:

- **Health & Safety and Parenting share all four codes.** A CIP in `34.010x` names a *pair*, never a
  single category. Never auto-pick between them.
- **Substantial Disabilities and Courses for Older Adults are populations, not content** — the page
  says so explicitly. They can carry *any* noncredit CIP, so they are never inferable from a code and
  must always be a curator choice.

---

## 3. The population, and the ladder

3,187 noncredit programs across **108 colleges** (COCI export 2026-06-17; membership is the `AWARD`
field verbatim, never the TOP and never the title).

| Rung | What we have | Programs | |
|---|---|---|---|
| **R1a** | On a noncredit CIP that maps to **exactly one** category | **997** | 31.3% |
| **R1b** | On a `34.010x` code — names Health & Safety **or** Parenting | 0 today | — |
| **R2** | On a noncredit CIP **not on the page's list** | 76 | 2.4% |
| **R3** | On a **credit** CIP — that code *is* the secondary | **1,796** | 56.4% |
| **R4** | No CIP at all | 247 | 7.8% |
| **R5** | Retired / reserved / unknown code | 71 | 2.2% |

**R3 is the unlock.** Those 1,796 credit CIPs are not errors to be cleared — under the Short-Term
Vocational rule they are the *secondary credit CIP aligning with the program subject matter*. The
work is re-seating them from primary to secondary with `32.0111` above, not replacing them.

**And R3 needs no TOP repair: 1,789 of 1,796 (99.6%) of those credit CIPs already sit inside their
own TOP's crosswalk.** TOP and the college's own CIP assignment independently agree — the
two-signals-agree gate from Rule 7, satisfied without relying on either alone. The **7** that
disagree are surfaced, never guessed.

Secondary-CIP categories on R3: **CTE 1,327 · Both 177 · Non-CTE 292.** A second signal agrees on the
strongest set — **1,159 have a CTE secondary CIP *and* `GOAL = C - CTE`**.

---

## 4. Why the TOP is not in the chain

Measured, not assumed:

- **The TOP cannot decide the category even when correct.** Running the page's own TOP ranges against
  the population, only **28.8%** of programs are claimed by exactly one category; 69.5% are claimed
  by two or more. Short-Term Vocational and Workforce Preparation are *both* "any vocational code" —
  the `32.0111` / `32.0107` fork, undecidable by TOP for **1,928** programs.
- **The TOP almost never blocks compliance.** 3,136 of 3,187 (**98.4%**) can already reach a true
  noncredit CIP through the TOP they have. **17 programs across 13 colleges** cannot — the entire
  population where a TOP change is genuinely required.
- **Peer consensus cannot repair TOPs here.** 2,672 distinct titles for 3,187 programs; only 278
  titles are shared across colleges, and a ≥60% peer majority yields **38 proposable corrections
  (1.2%)**. The method is sound — `ESL 4930.84 → 4930.87` (7/9 peers), `Beginning Computer Skills
  0514.40 → 0514.00` (4/6) — there is simply almost nothing for it to work on.
- **The CTE rule does not mention TOP.** It is `32.0111` + the secondary CIP's own certified
  category.

⚠️ **And a TOP-correction drive carries downside.** 1,601 of the 1,970 noncredit programs on a
non-49xx TOP are `GOAL = CTE`, and inside the 49xx block only `4931.00*` carries the vocational
asterisk. Encouraging a college to "fix" its TOP can strip the marker currently carrying its CTE
designation — and **CTE noncredit qualifies for funding that non-CTE does not.** Ship TOP proposals
advisory, paired with the consequence, or not at all.

---

## 5. What the tool does

A **category picker per noncredit program**, pre-filled from the strongest available rung, with the
college confirming. Not a prepopulation — the lesson from the reverted blanket-32.0111 rule (#1192,
reverted #1194) is that a rule applied to a category we cannot determine is wrong for the majority.

Per row:

1. **Proposed category**, with its rung named — *"your CIP `32.0109` is ESL"* / *"you hold a credit
   CIP, which is what Short-Term Vocational needs as its secondary — confirm the category."*
2. **All ten categories** selectable. The proposal is a default, never a gate.
3. On confirm, the **primary CIP** follows from the category; where the category offers several
   (Basic Skills has seven), the college picks from that set.
4. **Short-Term Vocational only:** the secondary credit CIP, pre-filled from the code they already
   hold, changeable from their TOP's crosswalk.
5. **The CTE line, stated but not applied** until the category is confirmed.

### Guards (each earned)

- **A CTE secondary CIP does not prove Short-Term Vocational.** Some R3 rows are ESL or Basic Skills
  programs mis-coded onto a credit CIP. Category first, CTE second — never inverted, because that is
  the funding line.
- **`34.010x` names two categories.** Render both, force the choice.
- **Populations are never inferred.** Substantial Disabilities and Courses for Older Adults come only
  from the curator.
- **Computed, not stored** (from #1192): a rule-driven default is never written as a curator
  revision, and the row says `proposed · COCI has X` rather than borrowing *"changed from"*, which
  claims a decision a person did not make.
- **A proposed code appears in the row's own option list**, or the row contradicts its own picker.
- **Nothing reaches COCI.** Say it on the surface, every time.
- **Persistence, in Jenni's words:** *"Once selected, that assignment will remain with the program or
  course until a substantial change is submitted through COCI."*
- **The dead end has an exit:** the crosswalk is locked; if the right CIP is absent, `top2cip@cccco.edu`.

---

## 6. Open questions

**For Jenni**

1. **The Basic Skills shift** (§1) — confirm the published page is right and the relay was a typo, so
   we are certain which of the two we encode.
2. **Two noncredit CIPs in active use are absent from the page's list:** `32.0199` *Basic Skills and
   Developmental/Remedial Education, Other* (**60 programs**) and `35.0101` *Interpersonal and Social
   Skills, General* (**16 programs**). Both are legitimate `Noncredit`-category codes in the CO
   catalog. Fold into Basic Skills, or must those 76 move?
3. **Crosswalk vintage.** She reports the crosswalk is now locked and that the tool's right-hand codes
   are the anchor. Ours is the **2026-07-15** workbook cut; the mapping page is dated **2026-05-26**.
   Is 7/15 the locked version, or is there a final cut to rebuild from? Every option list depends on it.
4. **Is the secondary credit CIP being published**, and does it become a real COCI field? Today the
   export has one `CIP CODE` column, so the secondary has nowhere to live upstream.
5. **Can the non-CDCP categories be CTE at all**, or is CTE reachable only via Short-Term Vocational?
   This is the funding line for ~1,300 programs.

**For Sam**

6. Where does a confirmed category persist? Browser `localStorage` (today's pattern) is wrong for a
   funding-relevant determination — recommend a gated Supabase table with who/when, as with
   `cr_reference_decisions` and `governance_owners`.
7. Does this become its own worklist view, or stay inline on the Programs list behind the existing
   Award-type picker?

---

## 7. Build order

1. **Encode the published page** as data (`kb/noncredit_cip_categories.json`) — ten categories, their
   CIP sets, CDCP flag, shared-code and population-not-content markers. Generated with a validator
   that asserts every code exists in `cip_crosswalk_data.js` and carries `cat == "Noncredit"` (the
   check that caught the shift; it must run on every rebuild, not once).
2. **The rung classifier + a receipt**, so the 997 / 76 / 1,796 / 247 / 71 split is reproducible and
   moves visibly as colleges work it.
3. **The picker**, per §5.
4. **The secondary CIP + the CTE line**, once Q4/Q5 land.
5. **The 17-program "your TOP offers no noncredit CIP" list** — the one place a TOP conversation is
   warranted, small enough to work by hand.

Phases 1–3 need nothing further from Jenni beyond Q1. Phases 4–5 wait.
