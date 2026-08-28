---
title: "Parse PDF column grids positionally (x/y anchors), never from linearized text — the MQ Index mis-bins"
created: 2026-07-11
kb-status: published
tags: [methodology, pdf-parsing, mq-handbook, reference-data, data-integrity, validation]
artifacts:
  - kb/reference/mq_sections.json
  - kb/reference/mq_disciplines.json
  - kb/mq_validation_out/2026-07-11/validation_report.json
  - tests/mq_sections.test.js
related:
  - "[[playbook-trail-crew-method-magic-audit]]"
---

# Parse PDF column grids positionally, never from linearized text

## The failure (found Session 112, via Sam's "HUM and PE both require masters")

`kb/reference/mq_sections.json` (the MQ 19th-ed fold, #737) was built by a
text row-grammar parse of the Disciplines Index. The index is a **five-column
X-grid** (Master's · Specific-BA+experience · Any-degree+experience · CCR cite ·
page), and plain text extraction flattens it — a lone `X` loses its column.
Result: **Humanities and Physical Education mis-binned as `not_masters`**
(both are master's-list), PEDS lost its CCR 53414(b) cite, and **eight
disciplines were dropped entirely** (Accounting, African American Studies,
Aeronautics, Addiction Paraprofessional Training, Agricultural Business and
Related Services, Adapted Computer Technology: DSPS, Citizenship: Noncredit,
Specialized Instruction: Vocational Noncredit) — while artifact keys
(`"Disabled Student Programs and"`, glued `53414` section numbers) kept the
count at a plausible-looking 240. Because `mq_disciplines.json` is the
**CCR fire-gate vocabulary**, the dropped names would have silently rejected
legitimate discipline proposals (e.g. Accounting) forever.

## The method that worked

1. **Extract with coordinates** (pdfminer.six `LTTextLine` x0/y0), not text.
2. **Classify X marks by x0** — the three list columns sat at exactly
   x0 = 267.0 / 335.5 / 414.3 across all pages.
3. **Anchor rows on the page-number column tokens** (x0 ≈ 525), not on name
   lines — names wrap, anchors don't. Handle the token zoo: comma lists
   (`24, 52`), ranges (`45-53`), and wrapped continuations (`28, 47,` + `62`
   — merge a token into the previous anchor when that anchor ends with `,`).
4. **Derive section page-ranges empirically** from single-X single-page rows
   (master's pp. 20–43, any-degree 45–51, specific-BA/noncredit 51–58), then
   use dual-page cites spanning two sections to confirm `both_lists` rows
   that carry only one X.
5. **Tiebreak anomalies with the curator, and record them** — Humanities/PE
   are masters-X with a page cite (48) inside the any-degree range; Sam's
   confirmation governs, and the receipt documents the quirk instead of
   hiding it.

## The rule

When a reference PDF encodes meaning in **column position** (X-grids,
checkbox tables), a text-linearized parse is guess-work: it will look ~95%
right and be wrong exactly where it matters. Parse positionally, validate the
full row census against an authoritative count, and commit a regression test
on the rows that were ever wrong (`tests/mq_sections.test.js`). Key names that
operational data already joins on (rows, Supabase decisions) are **not renamed**
during such a fix — record the official name in an `index_name` field and keep
the operational key stable.
