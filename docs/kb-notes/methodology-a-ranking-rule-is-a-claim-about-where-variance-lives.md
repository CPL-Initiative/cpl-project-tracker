---
title: "A ranking rule is a claim about where variance lives — re-derive it per corpus"
created: 2026-09-21
tags: [methodology, kb-note, ranking, prioritization, curation]
kb-status: internal
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
---

# A ranking rule is a claim about where variance lives

**Three corpora, three failures, one cause.** A ranking rule earns its place by
spreading a population out. It does that only where the quantity it multiplies
actually varies, so carrying a rule to a new corpus carries an assumption
nobody re-checked.

## The rule, and where it came from

The Common CR Reference ranks a curation worklist by **collapse value** —
wordings × colleges. It replaced *credentials-spanned*, which put the corpus's
least useful string at position 1: `3 hours in Elective Course Credits` spans
61 credentials, 61 rows and **one college**, a placeholder. Collapse value sinks
it to #174 with no special case. On that corpus the rule is right and the
reason is specific: both factors vary widely.

## Failure 1 — the ACE lane (2026-08-14)

Collapse value ranks nothing there either, for the mirror-image reason. Every
head topic already sits at **80–100 of 108 colleges**, because every college
processing a JST receives the same ACE exhibits. Multiplying by a near-constant
is multiplying by a constant.

## Failure 2 — ranking the four consolidation centers (2026-09-21)

The Jev ladder needed the four centers (CER · CSR · CCR · CCRR) put in order,
and the handoff said to use collapse value. Measured on
`chatbox_peer_articulations`, each center rides the **same 9,413 articulation
rows across the same 82 colleges** — they consolidate different COLUMNS of one
corpus (`unified_title` · `subject` · `subject`+`course_number` · `credit_rec`).

⚠️ **Collapse value orders items WITHIN a center and is a constant BETWEEN
them.** The rule was not merely weak at the new grain; it was undefined there,
and it would have returned a tidy-looking tie.

## What ranked them instead

**What one sitting of verdicts is worth**, which is the quantity that actually
varies:

| Center | One sitting buys |
|---|---|
| CCRR | ~29 rows per verdict (51 verdicts settled 1,459 rows) |
| CER | ~1.2 rows per verdict (all 59 findings reach 71 rows / 20 colleges) |
| CCR | 134,485 member rows over 16,478 identities |

## The test to run before carrying a ranking rule anywhere

1. **Name the grain.** A rule derived over items inside one population says
   nothing about ranking populations against each other.
2. **Measure each factor's spread on the NEW corpus** before ranking anything.
   A factor at 80–100% of its ceiling, or identical across every candidate,
   contributes nothing.
3. **Look at what lands at #1 and at the bottom**, and say out loud why. Both
   the credentials-spanned failure and this one were visible in one glance at
   the top of the list.
4. **Expect the answer to differ per corpus.** Three corpora have now needed
   three different rules; a fourth probably needs a fourth.

## Where this is enforced

The Common CR Reference lane carries the measured numbers and a pointer here.
Earlier statement of the same finding, from the ACE corpus:
`a-ranking-rule-must-be-rederived-per-corpus` (`cpl_memory`, 2026-08-14).
