---
title: Obsidian vault hygiene — lessons
created: 2026-08-28
updated: 2026-08-28
tags: [lessons, obsidian, vault, documentation, lint, docs-corpus]
kb-status: internal
obsidian-folder: cpl-project-tracker
artifacts:
  - kb/_normalize_kb_note_frontmatter.py
  - kb/_build_docs_index.py
  - kb/_fix_american_spelling.py
  - kb/_docs_audit.py
  - docs/catalog/
related:
  - "[[docs/kb-notes/methodology-derive-a-listing-from-the-things-it-lists]]"
  - "[[docs/kb-notes/methodology-a-field-the-resolver-never-reaches-can-disagree-forever]]"
  - "[[docs/kb-notes/methodology-a-knowledge-base-needs-a-lint-pass]]"
---

# Obsidian vault hygiene — lessons

The vault-facing half of the docs corpus: the properties Obsidian indexes, the
landing page it opens on, and the prose Sam reads. `kb/_docs_audit.py` has
reported all of it for weeks; this is the first pass that *applied* any of it.

## 2026-08-28 — Session 204 (SkyLint)

### What was learned

**1. The lint had reported the same debt for weeks and nothing consumed it.**
Rule 9 says run the docs audit *first* at every checkpoint, and sessions did —
`american_spelling` sat at ~174 findings since 2026-08-21, `kb_note_dialect` at
60. Reading a report is not acting on one. The gap closed only when the findings
became a workstream rather than a preamble.

**2. Three findings that looked like three chores were one job, in order.**
Canonicalize the properties → generate the index *from* those properties →
sweep the prose. The index could not be generated until every note declared its
type and date the same way; that is why the dialect pass had to come first, and
why doing the spelling sweep first would have meant sweeping the generated
catalogs too.

**3. `kb_note_dialect` is not cosmetic in Obsidian.** The Properties panel keys
on the property NAME, so `date:` and `created:` are two typed properties and any
Base or Dataview query must ask for both. A type carried in `type:`/`kb-type:`
is invisible to a tag query and to the tag pane. 340 notes now agree.

**4. Tags are navigation, and ours were split by spelling.** `data-modelling`
(4 notes) sat beside `data-modeling` (1); `prioritisation` (3) beside
`prioritization` (3). The tag pane renders each pair as two unrelated tags — on
the 3/3 split, **neither view was complete**. This is the strongest concrete
argument for the American-spelling rule having teeth beyond style.

**5. The redundant field nobody could see.** 41 notes carried a type key beside
a type tag; `kb_type_of` returns the tag and stops, so the key was never read
and never checked. **Six disagreed.** Full write-up:
[`a-field-the-resolver-never-reaches-can-disagree-forever`](kb-notes/methodology-a-field-the-resolver-never-reaches-can-disagree-forever.md).

**6. The index rotted for structural reasons, not sloppy ones.** 75 workstream
docs matched no table, so sessions appended `## Added <date>` sections; six KB
notes had been appended into the **three-lanes table**, two of them breaking its
column count. Invisible because nobody reads a 273 KB file — including the
sessions appending to it. Full write-up:
[`derive-a-listing-from-the-things-it-lists`](kb-notes/methodology-derive-a-listing-from-the-things-it-lists.md).

**7. Moving content out from under a guard disables the guard, and the diff
looks like progress.** Relocating the listings orphaned all 340 notes from
`unindexed_kb_note`. Caught only because the audit was re-run after the move.
Reachability is the invariant now, and it is proven to fail when broken.

**8. Sam's ruling generalized better than its example.** *"No need to fix any
spellings we import…like COCI catalog or MAP Custom Reports data."* Applied to
every **quoted span** rather than to a list of import sources, it costs 3 of 402
replacements and removes the whole class — including one nobody had thought
about: Sam himself, quoted verbatim in `session_68_handoff.md`. A quotation is
someone else's text whether it came from COCI or from a person.

**9. A filename is an identifier, not a spelling.** Five notes carry a British
form in their own filename. Renaming touches `CLAUDE.md`, other notes'
`related:` wikilinks and `cpl_memory` rows, so the sweeper lists them and stops.
Verified rather than asserted: **all 3,145 link and wikilink targets in the
corpus are byte-identical before and after the sweep.**

**10. The guard for all of this had never run.** `tests/docs_audit_test.py` —
67 assertions protecting the lint that protects the whole prose surface —
executed nowhere, because `npm test` discovers only `*.test.js`. The workflow's
own comment had already noted 18 of 20 `tests/*_test.py` run nowhere. Fixed for
the docs lane, including `--check`, which is what stops the index rotting again.

### Current state

| | Before | After |
|---|---:|---:|
| `kb_note_dialect` | 60 | **0** |
| `american_spelling` | 174 | **1** (a concurrently-owned funding doc) |
| `oversized_doc` | 5 | **4** |
| `docs/INDEX.md` | 273,616 B | **20,757 B** |

Suites: `docs_audit` 67/67 · `docs_index_build` 25/25 (new) ·
`american_spelling` 32/32 (new). PR #1373.

### Strategic roadmap

1. **`CLAUDE.md` at 2.49× its always-loaded budget** — the highest-value item
   left, because every session pays it. Held this run only because paring §11
   collides with a concurrent Funding session.
2. **The 5 British-form filenames** — one coordinated rename touching
   `CLAUDE.md`, `related:` wikilinks and `cpl_memory` rows.
3. **`docs/roadmap_archive.md` at 3.36×** — an archive, so the budget may simply
   be wrong for that lane; decide which.
4. **Obsidian Bases** — the properties are canonical now, which is the
   precondition for a `.base` live view (filter by type/status/date) replacing
   static tables *inside the vault*. The generated catalogs stay for GitHub,
   which does not render Bases.

### Next concrete step

Pare `CLAUDE.md` once the Funding session's PR has landed — move §11 narratives
older than two sessions to `docs/roadmap_archive.md` per Rule 9's own budget,
and check `stacked_roadmap_cell` after.
