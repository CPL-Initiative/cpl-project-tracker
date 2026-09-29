---
title: Derive a listing from the things it lists
created: 2026-08-28
updated: 2026-08-28
tags: [methodology, documentation, obsidian, generators, maintenance, pitfall]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
artifacts:
  - kb/_build_docs_index.py
  - docs/INDEX.md
  - docs/catalog/
  - tests/docs_index_build_test.py
related:
  - "[[methodology-a-second-copy-of-a-fact-is-a-stale-copy-waiting]]"
  - "[[methodology-a-knowledge-base-needs-a-lint-pass]]"
  - "[[methodology-a-field-the-resolver-never-reaches-can-disagree-forever]]"
---

# Derive a listing from the things it lists

> **One-sentence summary** — an index authored *beside* its contents drifts from
> them and grows without bound; the fix is not discipline at the append site, it
> is deriving every row from the thing it names.

## Measured

`docs/INDEX.md` was hand-maintained by every checkpoint for 15 months. It reached
**273,616 B — 6.84× its 40,000 B budget**, whose own comment states the intent:
*"a landing page you must scroll is not a landing page."*

Half of that was **link text**. A KB note's row carried the note's entire thesis
— ~450 bytes — even though the note's frontmatter already held a short `title:`.
The index was not pointing at 340 notes; it was a second, diverging copy of them.

## The rot has a mechanism, and it is not laziness

Three distinct failures, none of which a "remember to update the index" rule
would have prevented:

1. **No slot for a new kind of thing.** 75 workstream docs (scopes, plans,
   specs) matched no table. A contributor with something to file and nowhere to
   file it does the only available thing — appends a new `## Added <date>`
   section. There were three, and their contents duplicated rows elsewhere.
2. **Append to the first table that looks right.** Six KB notes had been added
   to the **three-lanes table** at the top of the file — a 3-column table
   describing doc *lanes*, not documents. Two carried a 4th column that broke
   the table's shape. Nobody noticed, because **nobody reads a 273 KB file top
   to bottom** — including the sessions appending to it.
3. **Restated facts go stale silently.** A hand-written summary in a row cannot
   be checked against the note it summarizes, so it simply ages.

⭐ **The generated version cannot exhibit any of the three.** A lane with no
table is a lane the generator does not know about — which is a code change, not
a silent omission. A row's title comes from the note, so it cannot drift. And
`--check` in CI makes "somebody forgot to rebuild" a red check on the day it
happens rather than a 273 KB file two years later.

## The trap on the way out

Moving the listings into `docs/catalog/*.md` **orphaned all 340 notes from the
coverage rule that made the index trustworthy** — `unindexed_kb_note` read
`docs/INDEX.md` and nothing else. The rebuild would have looked like a tidy-up
(a −250,000 byte diff, every test green) while quietly making every note
unreachable by browsing.

⚠️ **Moving content out from under a guard disables the guard, and the diff
looks like progress.** The rule now reads INDEX plus every catalog INDEX
actually *links to*, so **reachability** is the invariant rather than a
filename. Unlink a catalog and its notes correctly report unreachable again —
proven both ways (334 findings unlinked, 0 linked) and pinned by a test, because
a guard nobody has watched fail is not yet a guard.

## The rule

Ask what the listing's rows are **for**. If a row exists to help someone *find*
a thing, it needs that thing's identity and nothing else — derive it. Keep hand
prose for what genuinely cannot be derived (why the lanes exist, what to read
first) and put a marker around it so the generator can never eat it.

**A landing page and a catalog are different artifacts.** Trying to be both is
what produced a 273 KB landing page; the budget was telling us so the whole time.
