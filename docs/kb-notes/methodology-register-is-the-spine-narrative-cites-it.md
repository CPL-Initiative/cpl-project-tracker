---
title: Split prose from state — the register is the spine, the narrative cites it
created: 2026-08-05
updated: 2026-08-05
tags: [methodology, documentation, tabs, drift, traceability]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/noncredit_cpl_lessons]]"
artifacts:
  - docs/noncredit_cpl_thinking.md
  - kb/nc_learning_partners.json
  - nc_learning_partners.js
  - tests/nc_learning_partners.test.js
---

# Split prose from state — the register is the spine, the narrative cites it

> **One-sentence summary** — When a long analysis document also needs to be an
> operational surface, don't render the document in the tool: keep the *reasoning* in
> markdown, the *state* in a structured register, and make the narrative cite the
> register by ID so an uncited claim becomes visibly unbacked.

## Context

A workstream produces a long thinking document — a thousand-plus lines of analysis.
Someone then reasonably asks for a tab, so the team can work from it and revise it.

The obvious build is *render the document as a page*. That is the wrong build, and
the failure is predictable: you now have the same content in two places with two
edit paths, and they drift. Within a month nobody can say which is current.

## The split

| | Lives in | Why |
|---|---|---|
| **Reasoning** — why the mechanism works, the argument, the trade-offs | Markdown doc, version-controlled | Prose is revised in an editor, reviewed in a diff, and syncs to the vault |
| **State** — the worklists, the taxonomy, the open questions, the statuses | A structured register (JSON) rendered by the tool | Rows change, get filtered, get claimed, get answered |
| **Derived facts** — counts, rankings, "how many are dormant" | Computed at render time from the source dataset | A hand-copied number is stale the day it changes |

The test for which side something belongs on: **does it change without the argument
changing?** A count changes weekly; the reason the count matters doesn't. Put them in
different places.

## The move that makes it hold: citations

Splitting alone isn't enough — the narrative will still make claims, and those claims
will drift from the rows that back them. So the narrative **cites the register by
ID**:

```
"27 colleges teach dental assisting and one awards CPL. [[OPP-4]]"
```

At render time `[[OPP-4]]` becomes a link that opens the target's section, clears any
filter hiding it, scrolls to the card, and flashes it.

Three properties fall out, and the third is the one worth having:

1. **Traceability** — every claim reaches the row that backs it in one click.
2. **No drift by construction** — the narrative can't restate a status, it can only
   point at one.
3. **⭐ An uncited claim is *visibly* unbacked.** The gap becomes detectable by
   looking, instead of something you'd have to remember to check.

## Enforce it with a test

A dead reference silently breaks the traceability claim while looking fine. So the
test suite asserts **every `[[ref]]` in the narrative resolves to a real register
item**:

```js
const refs = narrativeSource.match(/\[\[[A-Za-z0-9-]+\]\]/g).map(strip);
const known = [...modes, ...useCases, ...opportunities, ...questions].map(x => x.id);
ok("every cross-reference resolves", refs.every(r => known.includes(r)));
```

Rename an item without updating its citations and the build fails. That's what keeps
the traceability from quietly rotting.

## Also: pull report prose from the rendered DOM

If the tool exports a report, generate the narrative section by reading the **rendered
DOM**, not by re-templating the source strings. Then the report cannot disagree with
what's on screen — and citation markup renders as its plain ID, so `[[OPP-4]]` exports
as `OPP-4` with no special-casing.

## Pitfalls

- **Don't let the register absorb the prose.** If register fields start growing
  paragraphs of rationale, the split has collapsed and you're back to one artifact
  with two homes.
- **Don't let the narrative restate state.** Write "27 colleges teach it `[[OPP-4]]`",
  not "27 colleges teach it and 9 opportunities are open" — the second hard-codes a
  count that the register already knows.
- **Derived facts belong in neither.** Compute them. A number typed into either the
  doc or the register is a number that will be wrong later.

## See also

- [`docs/noncredit_cpl_thinking.md`](../noncredit_cpl_thinking.md) — the prose half
- `kb/nc_learning_partners.json` — the register half
- [`adr-notes-alongside-the-curated-register`](adr-notes-alongside-the-curated-register.md)
  — how live user input joins this without breaking the split
