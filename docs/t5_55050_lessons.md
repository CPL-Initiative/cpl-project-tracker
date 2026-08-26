---
title: Title 5 §55050 — conforming the regulation to Ed. Code Article 9 (lessons)
created: 2026-08-26
updated: 2026-08-26
tags: [gr, regulation, cpl, sb135, title-5, 55050, 55051, rulemaking, lessons]
kb-status: internal
obsidian-folder: cpl-project-tracker
related:
  - "[[docs/t5_55050_amendment_package_draft]]"
  - "[[docs/t5_55050_regulatory_action_proposal]]"
  - "[[docs/t5_55050_cover_argument]]"
  - "[[docs/t5_55050_restore_the_2025_draft]]"
  - "[[docs/gr_register_lessons]]"
artifacts:
  - docs/reference/statute/
  - kb/_derive_55050_clean.py
  - kb/_verify_55050_redline.py
  - kb/_build_55050_redline_docx.py
  - exports/20260826_T5_55050_Article9_Conformity_TrackedChanges.docx
---

# §55050 → Article 9 — workstream lessons

The authoritative documents are the six `docs/t5_55050_*.md` files. This is the
scratchpad: what was learned, in what order, and what is still open.

---

## 2026-08-26 (Session 196, SkyRule) — the whole workstream in one day

Sam: *"My priority today is to get a new draft Title 5 55050 to the CO. I want to
take a fresh run based on the new Ed Code 78093 - 78093.2 (based on 2026 SB 135)."*

### What was learned

**⭐ The deliverable is not the one that was asked for, and that is the finding.**
A "fresh run" was the request. Two texts made it the wrong shape:

1. **A final revised §55050 already exists** — finalized 2026-08-12, adopted by
   the Board of Governors. It does not implement Article 9, and its NOTE cites
   none of it.
2. **Its renumbering is Sam's own November 2025 work.** (m)→(a), (a)→(b), (d)→(c),
   (h)→(d), (j)→(e), (b)→(f), (k)→(g), (c)→(h), (e)→(i), (g)→(j), (i)→(k),
   (f)→(l), (l)→(m), (n) deleted. **So this is not a competing structure — it is
   the same section with its substance missing.** The deliverable became
   *restore*, not *redraft*.

**⭐ And a cross-reference locked the lettering.** Adopted §55051(d) reads *"as
defined in section 55050(i)"* — the same rulemaking strikes `55753` and inserts
that pointer. It did not exist in the operative text, so checking "what
references §55050?" against the published regulation returns nothing. Everything
new goes on the end as **(n)**; (a)–(m) do not move. Durable:
[`a-change-inherits-every-reference-into-it`](kb-notes/methodology-a-change-inherits-every-reference-into-it.md).

**⭐ Nobody erred, and leading with that is the argument.** The final text's
accessibility stamp reads **6/19/26**; Article 9 took effect **7/13/26**. The
drafting predates the statute. That single fact turns the package from a
criticism into a conformity amendment, which is the ordinary reason regulations
get amended.

**⭐ The sharpest point is about districts, not about us.** §78093.2(b)(1)
(evaluate all incoming students' prior learning documents) and (b)(2) (accept
transcribed CPL from other campuses) bind every campus **today**, by force of the
Education Code. A district that follows the adopted §55050 to the letter is
nevertheless not meeting them. Title 5's job is to tell districts what the law
requires; on these two duties it does not.

**⭐ Tier 1 alone. The two tiers carry different burdens of proof** — Tier 1 asks
*does Article 9 say this?* (read the statute, five minutes); Tier 2 asks *is this
good policy?* (a debate, already had in November, and these lost). Bundling makes
Tier 1 inherit Tier 2's burden, and the natural move for anyone who does not want
to reopen the policy fight is to decline the package rather than split it for you.
⚠️ The real counter-argument — the rulemaking is open now and reopening costs
another full cycle — is why this is a judgment rather than an obvious call.

**⭐ Name your own two additions before a reader finds them.** *Shall consider* in
(c) sits on §78093.2(a)(3)'s permissive *"may adopt"*; the second sentence of the
new (n) adds *no secondary review* where the statute says only *accept*. A package
that flags its own two stretches is trusted on the other seven clauses.

### The redline, and why it needed a script

⚠️ **The adopted document is a redline, and `pdftotext` drops the formatting.**
Struck and inserted text run together: `at leastminimum`, `standardized
examsexaminations`, `(ab)`, `5575355050(i)`. **21 collisions plus 7 whole
paragraphs struck with no marker at all.** Drafting against the extraction means
drafting against wording that never existed.

Sam, mid-session: *"the attached doc is the recently approved 55050 revision
adopted by the BOG… disregard all the strikethrough language as that will be
pulled off when the reg is published on the web."* The PDF he re-sent extracts
**byte-identical** to the one already committed, so the base was right — what was
missing was proof.

- `kb/_derive_55050_clean.py` — the resolution as a reviewable edit list, each row
  carrying its reason, each asserted against the source. Output:
  `docs/reference/statute/t5_55050_clean_after_2026-08-12.txt`, **the baseline**.
- ⭐ **Two free structural checks fall out**: the resolved subdivisions must run
  **(a)–(m) contiguous, no gaps, no duplicates** (which is what confirmed the
  seven whole-paragraph deletions); and no run-together marker may survive.
- ⚠️ **The same phrase resolves two ways in one section.** `course contentoutcomes`
  in (f) → *"course outcomes"*; the identical phrase sits **unstruck** in (h) →
  stays *"course content"*. Deliberate. A global replace is wrong in one of them,
  and a careful reader is tempted to "fix" the inconsistency.
- ⚠️ **A deleted conjunction orphans its punctuation.** The NOTE struck `" and"` to
  insert a citation and accepted as *"66700 70901"*. Invisible in the redline
  view, which never shows what the sentence reads as once accepted.

`kb/_verify_55050_redline.py`, **71 checks**: reject-all must reproduce the
adopted text subdivision by subdivision; struck-in-2026 language must be **absent**
from the baseline; accept-all must carry all fourteen amendment clauses; every
`w:ins`/`w:del` carries id/author/date and every deletion uses `w:delText`. Four
perturbations each produce a named FAIL with the count still registering — and
one showed that a deletion written as `w:t` corrupts the reject-all view, not just
Word's rendering. Durable:
[`resolve-a-redline-as-an-edit-list`](kb-notes/methodology-resolve-a-redline-as-an-edit-list.md).

### Current state

Shipped and merged (#1339, #1341–#1347):

| artifact | what |
|---|---|
| `docs/reference/statute/` | 7 primary sources + the generated clean baseline |
| `docs/t5_55050_redraft_scope.md` | the architecture, and the two texts that block a redraft |
| `docs/t5_55050_restore_the_2025_draft.md` | 11 dropped clauses × the Article 9 authority for each |
| `docs/t5_55050_article9_amendments.md` | the gaps Article 9 opens |
| `docs/t5_55050_amendment_package_draft.md` | 9 amendments, tiered, authority per clause |
| `docs/t5_55050_cover_argument.md` | the Tier 1/2 call and the order to raise things in |
| `docs/t5_55050_regulatory_action_proposal.md` | the filing document, November format |
| `exports/20260826_…_TrackedChanges.docx` | 14 insertions / 3 deletions, verified |

### Strategic roadmap

1. Sam takes the tracked-changes file and the Regulatory Action Proposal to the CO.
2. Tier 2 (CR symbol + §55023, fees, program requirements, §55052/§55052.5) goes
   as **separate** actions on their own merits — Amendment 7 (fees, carrying ASCCC
   Res. 103.04) is the strongest near-term candidate.
3. **Separately from the regulation**: §78093.2(d)(2) conditions every allocation
   on *"the metrics described in paragraph (1)"*, and paragraph (1) describes four
   goals and supplies **no metrics**. Someone must define them. The Implementation
   Funding model already quantifies (A) access and (B) completion college by
   college, with (D) satisfied because MAP is the named pilot. **(C) career
   attainment is the acknowledged gap**, which Sam covers through CPL Projects and
   leadership on the CA Credential Registry and Career Passport. This needs no
   rulemaking, which is its whole advantage — keep it out of the amendment.

### Next concrete step

**Four things are Sam's, and none of them are drafting:**

1. **§88782** — the adopted NOTE carries it, so this action mirrors it. Whether
   §88782 *is* the Career Passport Program in the Education Code is unverified
   (sessions cannot reach `leginfo`). If it is wrong, that is a defect in the
   adopted regulation and a **separate** action — do not fold a citation fix into
   a conformity amendment.
2. **Executive Sponsor / Staff Lead** — carried forward from November, unconfirmed.
3. **The 2026–27 timeline** — 5C · field vetting · Consultation Council · two BOG
   reads. ⚠️ The §78093.2(b) duties are in force now; the interval to adoption is
   time in which Title 5 does not state them.
4. **Whether Tier 2 gets a companion action**, and on what schedule.

---

## 2026-08-26 (later the same day) — Sam revises, and two statutes arrive

Sam returned the package with **59 tracked changes** plus authenticated text for
**EC §88782** (Career Passport) and **EC §75013** (California Online Community
College Act). Full review: [`t5_55050_sam_revision_review.md`](t5_55050_sam_revision_review.md).

### What changed the shape of the package

⭐ **SB 135 is wider than Article 9.** §75013 is **Sec. 14 of the same chapter**
(Article 9 is Sec. 16), and §75013(b) opens *"As part of the Credit for Prior
Learning Initiative."* So a CPL Initiative duty lives **outside** Article 9 —
mandatory, systemwide-uniform, with a **2027-07-01** deadline. Every scoping
document we wrote reads §§78093–78093.2 and stops. **That was the wrong boundary,
and the boundary was a section-number range rather than a statutory scheme.**

⭐ **It promotes an amendment.** A recommendation of *N units toward a program*
cannot be implemented by a regulation permitting credit only against individually
identified catalog courses — so the program-level/GE-area broadening moves from
**Tier 2 to Tier 1**. And *"strongly encouraged to award consistent with"* is a
far better foundation for *"shall consider"* than §78093.2(a)(3)'s permissive
*"may adopt"*: the weaker of the two stretches we named is now much cheaper.

⭐ **§88782 does three jobs, not one.** It settles the citation; it **names MAP in
the Education Code**, giving (b)(4) an anchor in place of a bare product name; and
§88782(a)(1) makes CPL a **named input to the Career Passport**, which is the
argument for keeping the academic-record annotation Sam's revision deletes.

### What the review had to push back on

The five fixes are in the review doc. The one worth restating: **deleting
"gender and race/ethnicity" from (m)** contradicts §75013(c)(2)(B) *in the same
bill*, contradicts the equity condition the money hangs on, and deletes adopted
text in a filing framed as conformity. The new categories are additive — keep both.

⚠️ **And "evaluation of authenticated competencies" was struck** — the only
competency word in §55050 — in the same message that told me competency-based
education matters. Worth noticing that the BOG had already moved (f) from
*"course content"* to *"course outcomes"*, which is the competency framing arriving
in adopted text without anyone calling it that.

### Method note

⚠️ **My own check reported four mismatches and two of them were its bug** —
paragraph-mark insertions (`<w:ins>` inside `<w:pPr><w:rPr>`) threw the offsets, so
a properly-tracked deletion read as a vanished paragraph. Reading the raw XML
before writing any of it down is what kept two false findings out of a document
going to the Chancellor's Office. **The one real finding survived:** `only` was
deleted from (c) with no `w:del` at all.
