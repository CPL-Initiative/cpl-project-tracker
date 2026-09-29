---
title: Shared prose over-claims on the rows it was not written for
created: 2026-08-19
updated: 2026-08-19
tags: [methodology, deliverables, data-quality, guards, partners]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/delta_college_crosswalk_lessons]]"
artifacts:
  - kb/_build_college_offering_crosswalk.py
  - kb/delta_offering_map.json
---

# Shared prose over-claims on the rows it was not written for

> **One-sentence summary** — Authored explanation written once and applied to a
> cluster of related rows will be true of most of them and false of the rest;
> assert the false part against a column you already compute, and fail the build.

## Context

Curated deliverables in this repo pair **computed** columns with **authored**
prose. The prose is written per cluster, not per row, because writing 139
individual explanations is not affordable. That economy is exactly where the
defect lives.

## The claim

**A sentence authored for a cluster inherits to every member, including the ones
it is wrong about — and when that sentence asserts an absence, the row's own
computed data already contradicts it.**

The strong form: **any authored claim that restates something you compute is
checkable, so check it.** Absence claims are the highest-value case, because
absence is what a reader acts on ("nothing exists — we should build it") and
because a shared cluster explanation is most tempting precisely where a group of
occupations looks uniformly empty.

```python
ABSENCE_CLAIMS = ("no cpl exists anywhere", "zero cpl anywhere", "no cpl anywhere",
                  "nothing exists anywhere in california",
                  "no credit recommendation exists anywhere")

def check_absence_claims(rows):
    """Fail if a row's prose claims statewide absence while its exhibit list is non-empty."""
    bad = []
    for r in rows:
        if not r["creds"]:
            continue                      # genuinely nothing matched; the claim is true
        prose = ("%s %s" % (r["why"], r["cpl"])).lower()
        if any(c in prose for c in ABSENCE_CLAIMS):
            bad.append(r["occupation"])
    if bad:
        sys.exit("ERROR: %d row(s) claim no CPL exists anywhere but matched exhibits: %s"
                 % (len(bad), ", ".join(bad)))
```

**Make it a hard failure, not a warning.** The output is a document that goes into
a room with an external partner. One demonstrably false absence claim invites the
reader to doubt the other 138 rows they cannot check — the cost is not the one
wrong cell, it is the credibility of everything beside it.

## How we got here

Building the Delta crosswalk, a single paragraph was authored for the seven
hydro/utility occupations, including the sentence *"these occupations have zero
CPL anywhere in California."* True for five. **False for `Plant Operator` and
`Hydro Plant Operator`**, which both matched local wastewater-treatment exhibits.
Caught by hand, by chance, while reviewing a screenshot.

The guard was then written *because* of that catch — and immediately failed the
build on **four more rows nobody had noticed**: the masonry cluster
(`Cement Mason`, `Marble Mason/Setter`, `Mobile Concrete Pumps Operator`,
`Terrazzo Layer/Setter`) carried *"tile and terrazzo have no CPL anywhere"* while
three of them matched statewide CSLB-licence exhibits (C-8, C-29).

**Six over-claims total; manual review found two.** That ratio is the argument
for the guard.

Verified by injecting a deliberate false claim on a row with six matched exhibits
and confirming a non-zero exit — a guard nobody has watched fail is not known to
work.

## Consequences and caveats

- **Phrase matching is a floor, not a ceiling.** It catches the formulaic
  assertions, not a paraphrase. Keep the list short and literal; treat it as a
  net for the common shape rather than proof of correctness.
- **Absence is the highest-value class but not the only one.** The same pattern
  applies to any authored claim restating a computed column ("no adopters", "only
  at one college", "statewide"). Add checks as those claims appear.
- **The fix is per-row prose, never a weaker check.** When the guard fires,
  rewrite the ruling so each row says what is true of *it*. In the masonry case
  that meant four distinct sentences — three "the credential is portable, refer
  out" and one genuine gap.
- **Related:** the two "absences" must not collapse in the first place — *no
  exhibit exists anywhere* (build) versus *an exhibit exists and this college is
  not on it* (adopt) are the same empty cell with opposite next steps.
