---
title: Surface a finer derived layer on a single-grain reference tab (without breaking the grain)
created: 2026-06-09
updated: 2026-06-09
tags: [methodology, ui, reference-tabs, csr, search, foreign-languages, subj4]
kb-status: published
kb-type: methodology
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[methodology-coarse-top-division-discipline-fallback]]"
  - "[[methodology-umbrella-discipline-subj4-split]]"
artifacts:
  - canonical_subj4.js
  - kb/foreign_language_subj4.json
  - tests/csr_fl_split.test.js
---

# Surface a finer derived layer on a single-grain reference tab

> **One-sentence summary** — When a reference view is **one row per X** (e.g. the CSR
> = one row per MQ discipline) but a *finer* layer exists underneath (e.g. Foreign
> Languages splits into per-language subjects `FLSP`/`FLFR`/…), don't add ghost rows
> that break the grain — keep the one row and surface the sub-layer as a **display
> chip + a search-match on the derived tokens**, loaded from the layer's own file.

## The problem

The CSR keeps the discipline grain because MQ has no per-language discipline — there's
exactly one "Foreign Languages" row. But the SUBJ4 re-mint split that umbrella into
real per-language subjects (`FLSP` Spanish, `FLFR` French, …) living in a separate
file. Result: the splits were **invisible** — searching "Spanish" or "FLSP" found
nothing, and the row showed only the umbrella canonical. Sam: *"Foreign Lang shows up
in subjects search but none of the splits do."*

The wrong fix is to mint per-language **rows** (no "Spanish" MQ discipline exists; it
breaks the curation model — you curate a discipline's canonical, not a language). The
right fix keeps one row and makes the sub-layer **visible + findable** on it.

## The pattern (3 moves)

1. **Load the derived layer's own file** (`fetch` it into the consumer, empty-on-404
   so a missing file never crashes). Build a `{ rowKey: [derivedItems] }` map keyed by
   the same field the grain uses (here `discipline`), so it generalizes to future
   split files, not just this one.
2. **Display it on the row** — a compact chip (`⚯ N splits`, hover = full list) + a
   codes line (`FLSP · FLFR · FLGE · …`), so a viewer who finds the row understands it
   isn't single-valued.
3. **Search-match the derived tokens** — extend *every* search predicate (the main
   text box AND any secondary code box) so the derived names + codes surface the parent
   row. This is the move that actually answers the user's complaint.

## Gotchas

- **Rows keyed by name often don't carry the name.** The CSR entries are keyed *by*
  discipline in a dict but don't have a `discipline` field on the value. Stamp it onto
  every entry at load (`entry.discipline = name`) so the derived-layer lookup resolves
  from raw entries too, not just from fully-built rows (the count loops use raw ones).
- **Check the LIVE overlay, not just the committed JSON, before "fixing" a status.**
  I'd planned an "invalid→split" relabel off the committed `canonical_subj4: null` —
  but the live row read "initiated/FLNG" because the daily cron had folded a Supabase
  override on top. The committed file was stale; the deployed view wasn't broken. A
  user screenshot caught it. Verify against what the browser actually renders.
- **jsdom-test the real consumer** with mocked `fetch` (route by URL substring) + a
  minimal DOM scaffold — assert the chip/codes render AND that simulating a search for
  a derived token keeps the parent row while filtering others out.
