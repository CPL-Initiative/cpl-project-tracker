---
title: "Methodology — build a packaging dry-run: title-primary carve-outs, safe-default under-claim, review-bucket when no authoritative flag"
kb-status: published
created: 2026-07-15
updated: 2026-07-15
tags: [methodology, ccr, packaging, dry-run, esl, classification, curation, human-in-the-loop]
related:
  - "[[kb/merge_doctrine]]"
  - "[[docs/ccr_convergence_lessons]]"
  - "[[docs/kb-notes/methodology-curated-scenario-batches-doctrine-elicitation]]"
  - "[[docs/kb-notes/methodology-verify-consumer-before-migrating]]"
---

# Build a packaging dry-run: classify at scale, gate the risky direction

**When this applies.** A ratified doctrine says "collapse discipline X's many local
course identities into a small set of packaged targets" (ESL → 3 comprehensives +
carve-outs; next: Music/Dance/KINE per P-11). Before anything writes, you build a
**measurement-only dry-run** that maps every identity to its target so the curator
eyeballs the plan. Worked instance: `kb/_esl_package_dryrun.py` (2,364 ESL → 3
comprehensives + 3 carve-outs), receipts `kb/esl_package_out/2026-07-15/`.

## The five rules that made it correct

1. **Reconcile the population count FIRST.** An identity space is rarely one file.
   The 2,364 ESL identities = **650 consolidated M-IDs + 1,714 single-college
   singletons** — filtering only `coci_minted_courses.json` would have silently
   dropped 72% of the population. Find the exact count (across `courses` +
   `singletons`, by `discipline`) and match it to the doctrine's stated number
   before you classify a single row. A mismatch means you're packaging the wrong
   set.

2. **Carve-out detection is TITLE-PRIMARY** (the KINE "primary frame" logic, P-11).
   The carve-out theme must be the course's **subject**, not incidental vocabulary.
   First-pass lexicons over-caught ~4× (VESL 235→155, transfer 280→22) by matching
   any title/description that *mentioned* "workplace"/"college"/"career." A word in
   the title is not the course's frame. Tighten until the counts match the
   curator's sense of the real distribution ("rare" should read as rare).

3. **No authoritative flag → a REVIEW bucket, never an auto-fold.** Identify the
   direction where a mis-classification *under-serves* the student (for ESL:
   transfer-level, which awards real transferable credit — folding it into
   "Beginning" throws that away). If the source data has **no hard signal** for it
   (no CB05/transferable flag, no c_id), emit those rows to a human-review bucket,
   not an automatic decision. Reserve automation for the low-risk direction.

4. **Default to the SAFE under-claim, and say so per row.** Where a signal is
   absent (no level word), assign the CPL-safe floor (ESL: → Beginning) and record
   the reason in the `merge_note`. Under-claiming credit is the recoverable error;
   over-claiming is not. Make the default explicit and auditable, never silent.

5. **Emit confidence + signal per row, and a spot-check queue.** Every row carries
   *how* it was decided (title-word / combo / numeric / default / carve-out) and a
   confidence (high / medium / review). The report surfaces the medium/review rows
   as named queues so the curator spends attention where it matters, not on the
   high-confidence bulk. Reversible + receipted (D-6): the plan IS the receipt; the
   apply cites the same rule ids per row.

## Traps that bite

- **A catalog rung code masquerading as a signal.** "English **1A**" / "**3A**" is
  a *level* mark (P-10a strips it), NOT transfer ENGL 1A — a naive `\b1a\b` transfer
  pattern mis-bucketed real rung-coded courses. Exclude rung codes from semantic
  lexicons.
- **Numeric ladders assume a length.** Mapping 1–2→Beg / 3–4→Int / 5+→Adv
  under-assigns the top rung of a *short* (1–3) ladder (its "Level 3" is Advanced,
  not Intermediate). Flag numeric assignments medium-confidence; don't present them
  as certain.
- **Reuse ratified levers across disciplines.** The KINE combo rule (Beg–Int →
  Beginning; Int–Adv → Advanced, P-11) transferred directly to ESL combos. A lever
  ratified in one activity doctrine often generalizes — check before inventing a
  new rule.

## The apply is a SEPARATE, gated step

The dry-run writes **nothing**. Measure the apply surface so its scope is known —
the `merge_into` pointer count + the downstream **re-key** surface (articulations /
promotions pointing at a folding identity, Rule 7). The apply itself is a Rule-9
write (fresh live read at write-time, INSERT-only `ON CONFLICT DO NOTHING`, cohort
`<lane>-s<N>@bot`, committed receipt) that runs only after the curator has skimmed
the plan.

**Reuse.** Any large-set packaging/consolidation where a curator must trust the
result before it lands: the remaining CCR discipline passes, credential
canonicalization, discipline cleanup. Reconcile the population, detect
theme-primary, gate the under-serving direction behind human review, default safe,
and make every row's reasoning legible.
