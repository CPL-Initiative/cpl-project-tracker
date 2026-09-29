---
title: Title 5 §55050 — redraft architecture against Ed. Code Article 9 (SB 135)
created: 2026-08-26
updated: 2026-08-26
tags: [gr, regulation, cpl, sb135, title-5, 55050, drafting]
kb-status: internal
obsidian-folder: cpl-project-tracker
related:
  - "[[docs/gr_sb135_row_sweep]]"
  - "[[docs/gr_register_lessons]]"
artifacts:
  - gr_priorities.js
---

# §55050 redraft — the architecture, before the words

> **Sam, 2026-08-26:** *"My priority today is to get a new draft Title 5 55050 to
> the CO. I want to take a fresh run based on the new Ed Code 78093 – 78093.2."*

> ⛔ **BLOCKED ON TWO TEXTS, AND THEY ARE NOT OPTIONAL.** This session cannot
> reach `leginfo.legislature.ca.gov` or `law.cornell.edu` — both are egress-blocked
> from the sandbox — and **the repo holds no copy of either**. See §5.

---

## 1. Why this is an architecture and not a draft

A regulation going to the Chancellor's Office is the one artifact in this project
where **reconstructed text is disqualifying**. The register already carries the
caveat that its quoted statutory text *"was reconstructed from corroborated search
excerpts"*, and the SB 135 sweep specifically celebrates that Article 9 escapes
that caveat **because Sam supplied authenticated PDFs**.

Drafting amendatory language against a §55050 I have only ever seen described —
in fragments, inside sixteen rows each proposing to change it — would reproduce
exactly the defect the register is trying to shed. So this document does the part
that does not need the text, and states precisely what is needed to finish.

**What the register reveals about the current §55050**, assembled from what the
rows propose to change (this is a functional map, *not* a quotation):

| the rows imply §55050 currently… | from row |
|---|---|
| requires faculty to assess mastery of the outcomes in the course outline of record | #14 |
| carries a "shall consider … where possible honor" clause for ACE, at subdivision (d) | #6, #16 |
| mandates the record be "annotated to reflect credit earned by assessment of prior learning" | #9 |
| provides an accept / decline / appeal right | #15 |
| records CPL as pass/no-pass rather than a credit symbol | #3 |
| sets **no** statewide cap on CPL units (caps are local policy) | #4 |
| authorizes an award for a catalog course "if possible" | #1 |
| grants credit for skills **"similar to"** course content | `kb/merge_doctrine.md` |
| governs awards to special-admit (dual-enrollment) students | #8 |

---

## 2. What Article 9 changed, in one paragraph

Article 9 (§78093–78093.2, eff. 2026-07-13) moved three of the register's asks
from *"we would like this"* to *"the Legislature has said this"*: the three-way
award (course / GE area / elective) is now the statutory **definition** of a
credit recommendation (§78093.1(d)); identify-and-verify is now constitutive —
prior learning that has not been **validated** is not CPL (§78093.1(c), (f)); and
CCC-to-CCC reciprocity is a mandatory campus duty **today** (§78093.2(b)(2)).

It also created duties **no register row covers at all** — most importantly
§78093.2(b)(1), evaluate the prior-learning documents of *every* incoming student
at the education-plan point.

That is what a fresh §55050 should be organized around: **Title 5 implements
Article 9**, rather than Title 5 arguing for things Article 9 already settled.

---

## 3. Proposed subdivision architecture

Ordered as a reader of the regulation would need it, not as the register is
ranked. Each row says what the clause does, which register row it carries, and
**what authority it rests on** — which is the column that decides whether it can
be written at all.

| § | clause | carries | rests on |
|---|---|---|---|
| (a) | **Purpose and scope** — this section implements the Credit for Prior Learning Initiative | — | EC §78093 |
| (b) | **Definitions by reference** — "credit for prior learning", "credit recommendation", "validated" take their statutory meanings | — | EC §78093.1(c),(d),(f) ⭐ |
| (c) | **Course eligibility** — every catalog course with an approved COR may be CPL-eligible at discipline-faculty discretion; a COR need not enumerate CPL | #12 | already law (T5 §55002) ⚠ see §4 |
| (d) | **Evaluation duty** — evaluate prior-learning documents and credentials of all incoming students, before or upon completion of the §78212 education plan | **none — new** | EC §78093.2(b)(1) ⭐ |
| (e) | **Validation and methods** — faculty-approved assessment methods; equivalence to course SLOs | #14 | EC §78093.1(f) |
| (f) | **Recommendations to be honored** — extend the existing ACE clause to MAP-published recommendations and ASCCC Pathways to Credit | #6, #16 | T5 only ⚠ statute says *"may adopt"*, not *shall* |
| (g) | **Forms of award** — course, GE area (local/Cal-GETC/CSU GE Breadth/UC), or elective | #1 | EC §78093.1(d) ⭐ |
| (h) | **Reciprocity** — accept transcribed CPL from another CCC as credit, **without secondary review** | #2 | acceptance = EC §78093.2(b)(2); **"no secondary review" is the T5 addition** ⭐ |
| (i) | **Transcription** — record on the official transcript all CPL awarded, including waived, GE-area and elective units | #10 | implements (b)(2) — it presupposes transcription |
| (j) | **Notation** — strike the annotation mandate; record CPL as credit, basis retained internally | #9 | T5 only |
| (k) | **Grading symbol** — a "CR" symbol rather than P/NP | #3 | T5 only; **also needs §55023** |
| (l) | **No numerical cap** on CPL units | #4 | T5 only; (d)(1)(A) + (b)(1) support it |
| (m) | **Denials** — recorded and communicated in writing with specific reasons; appeal preserved | #15 | T5 only; EC §76001(b) is the model |
| (n) | **Reporting** — CPL course, program and student data on the statewide platform; MAP/MIS integrity | #11 | EC §78093.2(a)(2) ⭐ |
| (o) | **Special-admit students** — a dual-enrollment student may be awarded CPL | #8 (award half only) | EC §78093.2(a)(1)(A)(ii) |

### ⚠ Three register rows must NOT go into §55050

Putting them in would over-reach the section and hand a CO reader an easy
objection to the whole draft:

- **#7 apportionment (units-based FTES)** — that is §58003.2 / §58050 and, on the
  register's own reading, statute. §55050 cannot create a funding mechanism.
- **#5 a central body awards CPL** — credit-granting is vested in district
  governing boards by EC §70902. A Title 5 section cannot move it.
- **#13 Common Course Crosswalk** — a program and a funding line, not a
  regulatory duty.

---

## 4. The one clause a reader will attack

**(c), course eligibility.** §78093.1(f)(2) requires prior learning be
*"approved through established curricular processes and procedures."* A reader
can lift that to argue the course outline of record must enumerate CPL — the
opposite of what (c) says.

The answer exists and should be **pre-empted in the draft's own rationale, not
met in the room**: (f)(2) governs the **assessment method** — how mastery is
judged — not whether the outline must list CPL as an eligible mode. Row #12 is
currently written as though nothing could be said against it, and now something
can.

---

## 5. ⛔ What is needed to write the words

Two documents, neither of which this session can reach:

1. **The current operative text of 5 CCR §55050**, in full. Required to produce a
   redline; every clause above is an amendment to something, and I have never
   seen the something.
2. **Ed. Code §78093.2 subdivision (d) verbatim** — specifically **(d)(1)(A)
   through (D)**. The sweep captured (d)(1)(A) *"increasing access … equitably for
   all eligible students"* and (d)(1)(D) *"the chancellor's office's pilot
   projects, such as the California Mapping Articulated Pathways Initiative"*.
   **(B) and (C) were never quoted and are not in the repo.**

Sam supplied Article 9 as three authenticated PDFs on 2026-08-25; the same
material, or a paste of the two texts, unblocks this immediately.

---

## 6. The four funding priorities — Sam's observation, and what we can and cannot confirm

Sam, 2026-08-26: *"it lists 4 CPL implementation funding priorities. My Funding
model accounts for 3 of the 4. I will account for career advancement through our
CPL Projects and leadership on CA Credential Registry and Career Passport."*

**This corroborates a finding the sweep already made independently**, which is
worth saying because the two arrived from different directions. The sweep flagged
§78093.2(d)(2)'s goals — **access · completion · career attainment** — as *"not
the same three words the funding model uses"* and called it *"worth reconciling
deliberately."* Sam has now noticed the same seam from the funding side.

⚠️ **What we can confirm:** (d)(1) has at least four subparagraphs, (A) and (D)
are quoted above, and the model's dials are **Access 34 / Outreach 33 /
Success 33** (`cpl_funding_config`, saved 2026-08-23).

⚠️ **What we cannot confirm without the text:** which subparagraph is the
career-advancement priority, and whether (d)(1)(A)–(D) are the four Sam means or
whether the fourth sits elsewhere in (d). **Do not map priorities to model dials
from memory** — this is a funding-bearing determination and the register's own
standing rule is that a reconstructed quotation is not a citation.

**Recommended handling once the text is in hand:** treat it as the Implementation
Funding tab's *statutory* gate — §78093.2(d)(2) already conditions an allocation
on demonstrating implementation through the (d)(1) metrics — and record the
mapping as attributed data (the `college_identity_rulings.json` pattern), never
hard-coded, because it is a reading of statute that a curator may need to revise.
