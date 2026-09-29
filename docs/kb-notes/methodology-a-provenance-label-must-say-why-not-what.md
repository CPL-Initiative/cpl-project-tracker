---
title: A provenance label must say why, not what
created: 2026-08-13
updated: 2026-08-13
tags: [methodology, ui, provenance, curation, map-users]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/reference-ui-design-system]]"
artifacts:
  - map_users.js
  - tests/map_users_proposals.test.js
---

# A provenance label must say why, not what

> **One-sentence summary** — a chip that names the *source* of a derived value
> reads as a *category of the thing* unless it says what the source implies;
> "CPL Assistant" and "CPL Assistant in MAP — nobody is marked Primary Contact"
> are the same data and different information.

## Context

The MAP Users worklist proposes a student-contact address for colleges that have
no Primary Contact in MAP, walking a cascade of the college's own designations:
Coordinator → Assistant → Counselor → Articulation Officer → Lead Initiator →
Faculty Lead. A column headed **"Because"** showed the role the cascade landed
on, as a bare chip: `CPL Coordinator`, `CPL Assistant`, `Articulation Officer`.

Sam, reading it:

> *"the Because column chips are unclear as to their meaning. Some are listed as
> CPL Assistant. Does that mean that we have a CPL Assistant contact on file but
> nothing marked Primary Contact? If so, I would think that our cascade process
> would assign the assistant as the primary contact."*

**His reading was exactly right, and the cascade was already doing it.** The
address in the adjacent column *was* the assistant, promoted. Nothing was broken.
The chip had simply failed to communicate that it was answering *why is this
person here?* rather than *what is this person?*

## The failure mode

A derived value carries two facts: **the value** and **the reason it was
chosen**. A one-word provenance label collapses the second into something that
parses as a property of the first. "CPL Assistant" next to an email address reads
as *this address belongs to an assistant* — true, but not the point. The point is
*this college designated an assistant and designated nobody as Primary Contact,
so the cascade fell to them.*

That gap costs review time from exactly the people best placed to catch an error:
a domain expert who cannot tell whether a value is a lookup, an inference, or a
fallback will re-derive the logic in their head — as Sam did, correctly — and
then have to ask whether the system agrees with them.

## The repair

Three changes, none of them to the underlying logic:

1. **Name the question in the column header.** `Because` → `Proposed because`.
2. **Make the chip a claim about provenance.** `CPL Assistant` → `CPL Assistant
   in MAP`, with hover text stating the implication in full: *"This college
   designated this person as its CPL Assistant in MAP. Nobody is marked Primary
   Contact, so the cascade proposes them as the student contact."*
3. **Spell the cascade out once, near the table**, so the ordering is legible
   without reading code.

## Corollary — an absent field is not a failed lookup

The same table showed one college with a name and email, and the next with a bare
address. That looks like a lookup failure. It is not: `map_college_contacts` has
a `cpl_assistant_email` column with **no matching name column**, so MAP records
that person as an address and nothing else. Every other tier has both.

A rendered blank that has a *reason* should state the reason —
*"MAP has no name for this address"* — rather than leaving the reader to conclude
the data is broken. This is the same rule as *an absent measurement must never
render as an achievement*: the UI owes the reader the difference between
**missing**, **not applicable**, and **not collected**.

## Corollary — a curator's value needs a visibly different label

Once a human can override a derived value, the label carries a second job: keep
the two apart. In this table a curator-supplied contact renders
`curator-set` in an inverted chip, carrying **who** set it and **when**, and its
hover says *"A proposal for MAP — MAP itself still holds nothing."*

That matters because the export from this table is the list somebody works
through *inside* MAP. A CSV that collapsed "the college designated this person"
and "one of us thinks it should be this person" into one `proposed` column would
be actively misleading at the moment of use. Both layers ship as separate
columns.

## The test to write

Assert on the *rendered* provenance, not the underlying value — the value was
never wrong:

```js
check("the chip names the role AND says it is a MAP designation",
      /CPL Assistant in MAP/.test(cell));
check("the chip explains WHY, not just what",
      /nobody is marked Primary Contact/i.test(cell) && /cascade/i.test(cell));
check("a curator proposal never claims MAP holds it",
      /MAP itself still holds nothing/.test(cell));
```

## See also

- `reference-ui-design-system` — chip component + tokens.
- `methodology-a-collapsed-section-must-still-inform` — the same obligation
  applied to collapsed sections.
- CLAUDE.md §11 *MAP Users / student contact*.
