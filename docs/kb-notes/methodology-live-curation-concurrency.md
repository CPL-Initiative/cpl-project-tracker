---
title: "Methodology: bulk-writing beside a live curator — snapshot decay + conflict-yielding writes"
created: 2026-07-09
kb-status: published
tags: [methodology, supabase, curation, concurrency, kb_curation, cer]
related:
  - "[[exhibit_canonicalization_lessons]]"
artifacts:
  - "kb/ccc_bulk_out/2026-07-09/receipt.json"
---

# Bulk-writing beside a live curator

Session 108 executed a 368-row bulk issuer write while Sam saved rows in the
same table at ~5 rows/minute. Three rules made it safe; each earned its place
the same night.

## 1. Every snapshot is stale the moment you take it

Between the first pending-count (430), the target build (368), and the insert,
the curator had saved another ~60 rows. Plan from snapshots, but never TRUST
one at write time. The committed bake is *history*; the live overlay table
(`kb_curation`) is the *present*; and even a live read decays in minutes.

## 2. Writes must yield to the curator — structurally, not procedurally

`INSERT … ON CONFLICT (course_id, field) DO NOTHING` makes the race harmless
by construction: 29 of 368 targets had gained a curator save between snapshot
and insert, and every one of his rows won. No re-diff loop, no lock, no
coordination message — the conflict target IS the coordination.

Never bulk-UPDATE beside a live curator: an UPDATE would overwrite a save made
after your snapshot with no receipt that it happened.

## 3. Audit against the live overlay before "correcting" anything

The night's audit found 17 CCC-issuer rows with high-school signals — in the
BAKE. Reading the live overlay showed the curator's own split pattern had
already handled them (per-school credentials minted; aggregates CCC on
purpose). A bake-based "correction" would have fought his curation. Corollary
for fold semantics: check the promotion mode FIRST (Mode A2 is fill-or-append —
an override "correcting" an issuer-carrying row APPENDS a second record; only
null-issuer rows get the clean rec0 fill).

## Bonus: queue-anchored verifier spots must be presence-conditional

A spot check that asserts "row X is staged like Y" fails the moment the
curator resolves row X. Condition every queue-anchored spot on presence
(`(row is None) or <assertion>`) — the Ironworker spot went red the same
night for exactly this reason.
