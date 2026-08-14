---
title: Validate a supplied code column by its structural invariant, not by spot-checking values
created: 2026-08-12
updated: 2026-08-14
tags: [methodology, data-quality, identity, reference-data]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/college_identity_lessons]]"
  - "[[docs/kb-notes/methodology-a-successful-import-is-not-a-correct-one]]"
artifacts:
  - kb/_build_college_identity_crosswalk.py
  - kb/reference/ccc_coll_dist_2025.json
---

# Validate a supplied code column by its structural invariant, not by spot-checking values

> **One-sentence summary** — a column of identifiers can be entirely real,
> entirely plausible, and attached to the wrong rows; the only cheap way to catch
> it is to test a property the codes must satisfy *as a set*.

## Context

A curator supplied a spreadsheet of California's community colleges with a
`LocationID` column, described as the college's identifier. Every value was a
three-digit number in the right range. Allan Hancock — the first row, the one a
human spot-checks — was **611**, which matched the authoritative source exactly.

The column had lost its row alignment. Of 106 codes comparable against the
CCCCO's own Appendix A, **3 agreed**. Had it been trusted, nearly every college
in the system would have been keyed to another college's identifier, with
numbers that look right in every individual cell.

## The claim

**Spot-checking values cannot detect a shifted column, because every value is
still a genuine value.** What detects it is a property the identifiers must
satisfy *collectively*:

> CCCCO MIS college codes are **district-prefixed** — every college in a
> district shares its district's first two digits. Los Angeles CCD is 741–749.

That is a one-line test, and it separated the two files instantly:

| | multi-college districts whose codes share a prefix |
|---|---|
| Appendix A | **25 of 26** |
| The supplied file | **3 of 23** — Los Angeles CCD scattered across 121, 234, 312, 422, 471, 571, 721, 748, 862 |

No amount of reading individual rows would have surfaced that. Reading nine rows
*as a group* made it obvious.

**So: before trusting a supplied identifier column, ask what must be true of the
codes as a set, and test that.** Useful invariants, most reference data has at
least one:

- **Hierarchical prefixes** — child codes sit under parent codes (the case above).
- **Density** — a code space that should be contiguous has no unexplained gaps.
- **Cardinality** — one code per entity, one entity per code, checked both ways.
- **Cross-source agreement** — the same entity gets the same code in two
  independently produced files.
- **Format** — a code that should be `NNN` is never `74A`.

A supplied column that fails its own invariant is not "mostly fine with a few
errors". It is **structurally untrustworthy**, and the correct response is to
take the field from a source that passes and keep the file for what it *is* good
at. Here the same spreadsheet's *name* columns were excellent — they carried the
bridge to a second system and the only current spelling of several colleges — so
the file was kept and its code column marked unusable, in the file itself:

```json
"_warning_locationid": "⚠ DO NOT USE LocationID AS AN MIS COLLEGE CODE …"
```

## Corollary: a self-inconsistent column is its own tell

The same file's `DistrictType` (M = multi-college, S = single) disagreed with
its own data on **37 rows** and carried **both values for 14 districts** — San
Diego CCD appears four times, marked `S`. That needs no external authority to
detect: the file contradicts itself. Anything derivable from the data (here,
multi-vs-single from the college count) should be **derived**, not read from a
column that can rot independently.

## How we got here

Session 141 (SkyLink), 2026-08-12, PR #1132, building the college/district
identity crosswalk. The invariant test took about a minute to write and was the
difference between a correct taxonomy and one that silently mis-keyed 113 of 116
colleges.

Worth noting what *did* work: two independently produced CCCCO files agreeing on
a value is strong evidence. That is how the `EVERYGREEN VALLEY` misspelling was
identified as an upstream CCCCO error rather than our parse — it appears in
both.

## When this applies (and when it doesn't)

Applies to any identifier column arriving from outside the system: MIS codes,
CIP/TOP codes, SOC codes, district codes, vendor ids, anything hand-assembled in
a spreadsheet where a sort or a paste can shift one column relative to its rows.

It does not apply to identifiers you mint yourself with a constraint behind them
— a database PK cannot shift. The risk is specific to **transport through a
format with no referential integrity**, which is exactly what a spreadsheet is.

## Second instance — a relayed code table, shifted by one (2026-08-14)

The same failure, in a different medium: a **relayed summary** rather than a
supplied file. A Teams message paraphrasing the Chancellor's Office noncredit CIP
categories merged two codes (`32.0101` + `32.0104`) onto a single line, which
moved **every pair after it by one**. *Developmental/Remedial Math* would have
been built as `32.0105` — which is actually *Job-Seeking/Changing Skills*.

Structurally identical to the MIS `LocationID` case: real codes, on the wrong
rows, and every individual value plausible. **Spot-checking cannot detect a shift
— by construction, the first row is usually still right.** It was caught only by
checking **all seven pairs** against the CO's certified catalog; the published CO
page agreed with the catalog, so the relay was the sole point of corruption.

Two additions to the method this instance earned:

- **A relay is a transformation.** A human retyping or summarising a code table
  is as capable of shifting a column as a bad CSV parse, and carries none of the
  signals a file does (no header row, no delimiter, no obvious truncation). Treat
  a pasted or summarised table as untrusted **input**, not as authority — go back
  to the published source.
- **Check every pair, not a sample.** When the invariant is *pairwise alignment*
  (code ↔ label), the only sound check is exhaustive over the set. Seven pairs is
  seconds of work; the sample that "looked fine" is what a shift survives.

The validator now runs **on every rebuild**, not once — the same posture as
`verify_source()` re-deriving the Appendix A repairs, so an upstream fix quietly
turns the guard into a no-op instead of leaving a stale patch behind.

Instance: `docs/noncredit_cip_category_scope.md` · `docs/cip_crosswalk_lessons.md`
(2026-08-14) · PRs #1198 / #1199.

## See also

- `[[docs/college_identity_lessons]]` — the workstream
- `[[docs/kb-notes/methodology-a-successful-import-is-not-a-correct-one]]` — the sibling failure: both endpoints right, the transfer wrong
- PR `#1132` — the detection and the crosswalk

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
