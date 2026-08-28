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

## 2026-08-28 — Session 204 (SkySolidare)

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

**11. The mechanism change was not finished when the code shipped.** `docs/INDEX.md`
became generated, and BOTH instructions describing how to maintain it — `CLAUDE.md`
Rule 9 and `.claude/commands/checkpoint.md` step 6 — still said to hand-add table
rows. A session following the documented procedure most carefully would have added
rows inside the marker block and had them erased on the next build. **The
instructions are consumers too, and they are the consumers with no tests.** Caught
by Sam asking *"is there anything we just changed that would cause you to miss the
checkpoint rule?"* — not by CI, which guards content and cannot read prose for
claims about a mechanism. Appended as the inverse case to
[`a-settled-ruling-does-not-enforce-itself`](kb-notes/methodology-a-settled-ruling-does-not-enforce-itself.md).

**12. Following the checkpoint list surfaced three more gaps.** `kb/README.md` still
said the auditor had "Seven rules" and a 56-check suite (nine and 67); the root
README's tree did not mention `docs/catalog/`; INDEX's `## Update history` had no
bullet for this run and stood at 15 entries against step 6's cap of ~8. And the
handoff **contradicted itself** — "You are Session 204" over a sign-off naming 205.
Running in parallel with another session makes the numbering a real question, not a
formality: the funding session is 203 (it is the one SkyLens's handoff addressed and
the one Sam named), so this session is 204 and its handoff is
`session_205_handoff.md`.

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

---

## 2026-08-28 — Session 206 (SkyCrush): the consolidation, and three guards that were not looking

**`CLAUDE.md` 151,484 B → 58,006 B — 2.52× its budget to 0.97×, with nothing
deleted.** PRs #1381 (mechanical) and #1382 (judgment). `oversized_doc` 4 → 3;
this file is no longer flagged for the first time since the lint existed.

### What was learned

**The assignment rule is the whole thing.** Sam's test — *push what a session
cannot know to ask for, pull everything else* — is what made this tractable.
Before it, "what belongs in `CLAUDE.md`" had no answer, so everything accreted
into the one store that loads unconditionally. After it, 62% of the file was
obviously pull-side and moved without a single judgment call about importance.

**Split sections; do not relocate them whole.** The two remaining oversized
sections were both *entirely push at the level of the rule and almost entirely
pull at the level of the evidence.* Branch policy went 8,227 → 3,304 B by
keeping every operative rule and moving Sam's wording, the PR numbers and the
toggle dates. It reads better, because the rule stopped competing with its own
footnotes. A merge rule that has to be looked up has already failed.

**⚠️ The inherited measurement was wrong, and re-measuring cost ten minutes.**
Session 206's handoff listed *five rows / 14,379 B retirable with no judgment
calls.* Read per-row, **four carry an explicit `NEXT` or `Open` list in their
own text**, and the fifth holds load-bearing invariants rather than finished
history. Session 205 had predicted exactly this (*"26 rows carry a ✅ marker,
but that over-counts — read each row, do not grep"*). **Nothing was retired.**
The retirement test is now written into the §11 preamble and
`.claude/commands/checkpoint.md`.

**⚠️ Three guards were not looking, all found by moving content past them.**
This is the third consecutive session to hit the pattern:

1. `stacked_roadmap_cell` hard-coded `rel == "CLAUDE.md"` — it would have gone
   **silently green over an unguarded corpus** the moment the cells moved.
2. It split rows on a bare `|` and skipped anything with fewer than four, so a
   **malformed row exempted itself**. The two LARGEST cells in the live table
   were both invisible to it: Implementation Funding (4,930 chars, over the
   4,000 cap) was missing its trailing pipe; ESL packaging (4,447) carries
   `` `1|2,3|4` `` inside a code span, so the measured cell read 1,289 chars.
   **When a validator has a skip branch, ask what the skipped population looks
   like — it is rarely a random sample.**
3. **`docs/reference/**` had never been indexed at all.** Every lane in
   `_build_docs_index.py` globs `docs/*.md`, which is *flat*, so the pare-down
   files `CLAUDE.md` itself tells sessions to read had never once appeared in
   the corpus index. 0 → 37 docs once a recursive lane was added.

**⚠️ Two new assertions passed for the wrong reason.** Reverting the parser to
prove the guard fails showed two of the four new checks staying green — the
*malformed* branch was catching inputs meant to test the *size* branch. Tightened
to assert `malformed == 0` **and** `chars > CELL_MAX_CHARS`. A guard proven to
fail is worth more than a guard that merely passes.

**`cpl_memory.scope` cannot do the job it was earmarked for.** Measured at **68
of 652 rows** (not 4 of 646) with an **uncontrolled vocabulary** — `funding` and
`cpl-funding` are one intent spelled twice, `global` and `engineering` another,
and **25 of the 68 values are literally repeated in the row's own `tags`**. It
conflates *where a learning was found* with *how far it applies*: generic
methodology sits under `funding` because that is the lane it surfaced in.
Populating it as-is would entrench a duplicate topic tag. **Recommended, not
written**, per Sam's standing rule on Supabase.

### Current state

`CLAUDE.md` 58,006 B, under budget. 30 lane files under `docs/reference/lanes/`,
0 over their new 12,000 B budget, largest 5,825 B. `stacked_roadmap_cell` guards
both surfaces. `docs_audit` 73/73, `docs_index_build` 31/31.

### Next concrete step

Retire the lanes that genuinely are finished — a per-row read of all 29 against
the now-written test (no `NEXT`, no `NEEDS SAM`, no `BLOCKED`), which is a real
worklist rather than the five the old measurement named. Then Sam's call on the
`scope` vocabulary.
