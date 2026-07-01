---
title: "Methodology — visual PDF read (not text parse) for layout-encoded facts"
kb-status: published
kb-type: methodology
date: 2026-07-01
tags: [methodology, pdf, extraction, workflow, adversarial-verification, tmc]
related:
  - docs/tmc_builder_lessons.md
  - docs/kb-notes/reference-tmc-adt-data-model.md
  - tmc/_parse_tmc_pdfs.py
  - tmc/tmc_or_groups.json
---

# Visual PDF read for layout-encoded facts

## The trap

Some facts in a PDF live in its **visual layout**, not its text stream:
two-column tables, "OR" adjacency, indentation, boxes. `fitz`/`pdfplumber`
`get_text()` flatten the page into a linear token stream that **destroys** that
layout — columns interleave, an "OR" on one row lands nowhere near the C-ID it
modifies. Text-heuristic parsers ("if the line starts with `or `…") then silently
miss the fact. In the TMC parser, this made **0 of 756** slots recover the
"Course X OR Course Y" alternatives that are all over the source PDFs (244 OR-lines
across 41/45 templates).

## The fix

When a fact is layout-encoded, **read the rendered page visually** instead of
escalating text heuristics:

1. **Read the PDF with the Read tool** (it renders pages as images). A model
   looking at the two-column table sees the "OR" adjacency the text stream lost.
2. **Fan out one reader per document** (a Workflow `pipeline`) so 45 PDFs extract
   concurrently. Anchor each to the structured data you already have (our parsed
   section C-IDs) so the output speaks your keys.
3. **Adversarially verify** — a *second, independent* reader re-reads the same PDF
   and adjudicates each proposed fact, prompted to REJECT the near-misses. Here the
   traps were "a *Select-N* list misread as an OR-group" and "a *flexible proviso*
   ('any CSU-transferable course') misread as a C-ID alternative." The verify stage
   was load-bearing — it caught both.
4. **Land the result as a curated overlay, not inline parser logic.** The extracted
   facts (`tmc/tmc_or_groups.json`, 80 groups, each with an evidence quote) are
   authored/editable data; a deterministic apply step folds them into the parse.
   Curriculum-authoritative facts should be *reviewable*, not buried in a regex.

## Guardrails on the apply

Folding curated facts into a generated structure needs guards that **skip + log**
rather than force:
- resolve each fact to the structural node that actually contains an **anchor**
  (robust to duplicate names — e.g. two sections both called "Required Core");
- detect **overlap** (one course claimed by two lines → can't fold cleanly);
- **all-or-nothing** — never partially apply a group;
- prove **zero drift** with a structural diff old→new (only the intended field
  changed; nothing else moved).

## When to reach for this

Any extraction where the signal is *where things are on the page*, not *what the
words say*: form fields, multi-column catalogs, checkbox/table grids, OR/AND
groupings, ballot-style "pick one" layouts. If your text-heuristic count is
suspiciously **zero**, suspect a layout-encoded fact and switch to a visual read.
